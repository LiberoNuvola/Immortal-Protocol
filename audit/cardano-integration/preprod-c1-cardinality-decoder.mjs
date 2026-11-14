/**
 * Deterministic read-only decoder for C1 Ogmios v7 UTxO cardinalities.
 * Decodes the Ogmios value map shape only; it does not authenticate identity,
 * re-derive scripts, decode PrizeDatum, or qualify deployment C1.
 */
const SINGLETON_COMPONENTS = new Set(['b1Pool', 'v3Carrier', 'b2Control']);
function nonEmptyString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}
function hex(value, bytes, code) {
  const normalized = nonEmptyString(value, code).toLowerCase();
  if (!new RegExp('^[0-9a-f]{' + bytes * 2 + '}$').test(normalized)) throw new Error(code);
  return normalized;
}
function quantity(value, code) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) return BigInt(value);
  throw new Error(code);
}
function normalizeUtxo(entry, componentId, expectedAddress) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('C1_CARDINALITY_UTXO_ENTRY_INVALID:' + componentId);
  if (entry.address !== expectedAddress) throw new Error('C1_CARDINALITY_UTXO_ADDRESS_MISMATCH:' + componentId);
  const txHash = entry.outputReference?.transaction?.id ?? entry.transaction?.id ?? entry.txHash;
  const index = entry.outputReference?.index ?? entry.index;
  if (typeof txHash !== 'string' || !/^[0-9a-f]{64}$/i.test(txHash) || !Number.isSafeInteger(index) || index < 0) {
    throw new Error('C1_CARDINALITY_UTXO_REFERENCE_INVALID:' + componentId);
  }
  const value = entry.value ?? entry.amount;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('C1_CARDINALITY_UTXO_VALUE_INVALID:' + componentId);
  return { txHash: txHash.toLowerCase(), index, value };
}
function singletonAssetQuantity(value, policyId, tokenNameHex, componentId) {
  const policy = value[policyId];
  if (policy === undefined) return 0n;
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) throw new Error('C1_CARDINALITY_ASSET_POLICY_VALUE_INVALID:' + componentId);
  const token = policy[tokenNameHex];
  if (token === undefined) return 0n;
  return quantity(token, 'C1_CARDINALITY_ASSET_QUANTITY_INVALID:' + componentId);
}
export function decodeC1ComponentCardinality({ component, rawUtxos }) {
  if (!component || typeof component !== 'object') throw new Error('C1_CARDINALITY_COMPONENT_REQUIRED');
  const componentId = nonEmptyString(component.componentId, 'C1_CARDINALITY_COMPONENT_ID_REQUIRED');
  const address = nonEmptyString(component.address, 'C1_CARDINALITY_ADDRESS_REQUIRED');
  if (!Array.isArray(rawUtxos)) throw new Error('C1_CARDINALITY_UTXOS_MUST_BE_ARRAY:' + componentId);
  const utxos = rawUtxos.map(entry => normalizeUtxo(entry, componentId, address));
  const references = utxos.map(utxo => utxo.txHash + '#' + String(utxo.index));
  if (componentId === 'prizeValidator') {
    return {
      componentId, addressUtxoCount: utxos.length, utxoReferences: references,
      datumDecoderStatus: 'NOT_EVALUATED_RAW_UTXO_DATUM_REQUIRED',
      populationClassificationStatus: 'NOT_CLASSIFIED_PRIZEDATUM_DECODER_REQUIRED',
      cardinalityStatus: 'NOT_APPLICABLE_POPULATION_CENSUS', cardinalityQualified: false,
    };
  }
  if (componentId === 'counter') {
    return {
      componentId, addressUtxoCount: utxos.length, utxoReferences: references,
      cardinalityStatus: utxos.length === 1 ? 'OBSERVED_EXACTLY_ONE_UTXO' : 'FAIL_EXPECTED_EXACTLY_ONE_UTXO',
      cardinalityQualified: utxos.length === 1,
    };
  }
  if (!SINGLETON_COMPONENTS.has(componentId)) throw new Error('C1_CARDINALITY_COMPONENT_UNSUPPORTED:' + componentId);
  const policyId = hex(component.singleton?.policyId, 28, 'C1_CARDINALITY_POLICY_ID_INVALID:' + componentId);
  const tokenNameHex = nonEmptyString(component.singleton?.tokenNameHex, 'C1_CARDINALITY_TOKEN_NAME_REQUIRED:' + componentId).toLowerCase();
  if (!/^(?:[0-9a-f]{2}){1,32}$/.test(tokenNameHex)) throw new Error('C1_CARDINALITY_TOKEN_NAME_INVALID:' + componentId);
  const tokenHolders = [];
  for (let i = 0; i < utxos.length; i += 1) {
    const amount = singletonAssetQuantity(utxos[i].value, policyId, tokenNameHex, componentId);
    if (amount > 0n) tokenHolders.push({ reference: references[i], quantity: amount.toString() });
  }
  const exactlyOneHolder = tokenHolders.length === 1;
  const exactQuantity = exactlyOneHolder && tokenHolders[0].quantity === '1';
  return {
    componentId, addressUtxoCount: utxos.length, utxoReferences: references,
    singletonAsset: { policyId, tokenNameHex }, singletonTokenHolderCount: tokenHolders.length,
    singletonTokenHolders: tokenHolders,
    cardinalityStatus: exactQuantity ? 'OBSERVED_EXACTLY_ONE_SINGLETON_TOKEN' : 'FAIL_SINGLETON_TOKEN_CARDINALITY_OR_QUANTITY',
    cardinalityQualified: exactQuantity,
  };
}
