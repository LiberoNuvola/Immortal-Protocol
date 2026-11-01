import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const ADDRESS = 'addr1z9cy2gmar6cpn8yymll93lnd7lw96f27kn2p3eq5d4tjr7rshnr04ple6jjfc0cvcmcpcxmsh576v7j2mjk8tw890vespzvgwd';
const USDM_UNIT = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d';
const FACTORY_POLICY = 'de9b756719341e79785aa13c164e7fe68c189ed04d61c9876b2fe53f';
const FACTORY_NAME = '4d7565736c69537761705f414d4d';
const POOL_NFT_POLICY = '909133088303c49f3a30f1cc8ed553a73857a29779f6c6561cd8093f';
const BASE = 'https://api.koios.rest/api/v1';
const OUT = 'audit/muesliswap-evidence';

async function post(path, body) {
  const response = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`KOIOS_${path.slice(1)}_HTTP_${response.status}:${raw.slice(0, 500)}`);
  return { raw, data: JSON.parse(raw), status: response.status };
}

await mkdir(OUT, { recursive: true });
const startedAt = new Date().toISOString();
const manifest = {
  schema: 'IMMORTAL_MUESLISWAP_FACTORY_POOL_CENSUS_V1',
  network: 'cardano-mainnet',
  endpoint: BASE,
  address: ADDRESS,
  usdmUnit: USDM_UNIT,
  startedAt,
  readOnly: true,
  transactionSubmission: false,
};
try {
  const [tipResult, addressUtxoResult, factoryUtxoResult] = await Promise.all([
    post('/tip', {}),
    post('/address_utxos', { _addresses: [ADDRESS], _extended: true }),
    post('/asset_utxos?limit=1000&offset=0', { _asset_list: [[FACTORY_POLICY, FACTORY_NAME]], _extended: true }),
  ]);
  if (!Array.isArray(tipResult.data) || tipResult.data.length !== 1) throw new Error('KOIOS_TIP_SHAPE_INVALID');
  if (!Array.isArray(addressUtxoResult.data)) throw new Error('KOIOS_ADDRESS_UTXOS_SHAPE_INVALID');
  if (!Array.isArray(factoryUtxoResult.data)) throw new Error('KOIOS_ASSET_UTXOS_SHAPE_INVALID');
  const rows = addressUtxoResult.data;
  const factoryRows = factoryUtxoResult.data;
  const factoryPools = factoryRows.map(row => {
    const assets = (row.asset_list ?? []).map(asset => ({
      unit: String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase(),
      quantity: String(asset.quantity ?? '0'),
    }));
    const markerQuantity = assets.filter(asset => asset.unit === FACTORY_POLICY + FACTORY_NAME)
      .reduce((sum, asset) => sum + BigInt(asset.quantity), 0n);
    const nftAssets = assets.filter(asset => asset.unit.startsWith(POOL_NFT_POLICY));
    const usdmQuantity = assets.filter(asset => asset.unit === USDM_UNIT)
      .reduce((sum, asset) => sum + BigInt(asset.quantity), 0n);
    return {
      txHash: row.tx_hash,
      outputIndex: Number(row.tx_index),
      address: row.address,
      lovelace: String(row.value),
      markerQuantity: markerQuantity.toString(),
      poolNftAssets: nftAssets,
      usdmQuantity: usdmQuantity.toString(),
      assets,
      datumHash: row.datum_hash ?? null,
      inlineDatum: row.inline_datum ?? null,
      blockHeight: row.block_height ?? null,
      blockTime: row.block_time ?? null,
      addressMatchesPinnedPoolScript: row.address === ADDRESS,
    };
  });
  const distinctPoolAddresses = [...new Set(factoryPools.map(pool => pool.address))].sort();
  const factoryUsdmPools = factoryPools.filter(pool => BigInt(pool.usdmQuantity) > 0n);
  const invalidMarkerRows = factoryPools.filter(pool => pool.markerQuantity !== '1');
  const missingNftRows = factoryPools.filter(pool => pool.poolNftAssets.length === 0);
  const candidateDatumHashes = [...new Set(factoryUsdmPools.map(pool =>
    factoryRows.find(row => row.tx_hash === pool.txHash && Number(row.tx_index) === pool.outputIndex)?.datum_hash
  ).filter(Boolean))];
  const datumResult = candidateDatumHashes.length
    ? await post('/datum_info', { _datum_hashes: candidateDatumHashes })
    : { raw: '[]', data: [] };
  if (!Array.isArray(datumResult.data)) throw new Error('KOIOS_DATUM_INFO_SHAPE_INVALID');
  const datumByHash = new Map(datumResult.data.map(datum => [datum.hash, datum]));
  function decodeAssetClass(value) {
    if (!value || value.constructor !== 0 || !Array.isArray(value.fields) || value.fields.length !== 2
      || typeof value.fields[0]?.bytes !== 'string' || typeof value.fields[1]?.bytes !== 'string') return null;
    return { policy: value.fields[0].bytes.toLowerCase(), name: value.fields[1].bytes.toLowerCase() };
  }
  function decodePoolDatum(value) {
    if (!value || value.constructor !== 0 || !Array.isArray(value.fields) || value.fields.length !== 4) return null;
    const coinA = decodeAssetClass(value.fields[0]);
    const coinB = decodeAssetClass(value.fields[1]);
    const totalLiquidity = value.fields[2]?.int;
    const swapFee = value.fields[3]?.int;
    if (!coinA || !coinB || totalLiquidity === undefined || swapFee === undefined) return null;
    return { coinA, coinB, totalLiquidity: String(totalLiquidity), swapFee: String(swapFee) };
  }
  const decodedUsdmPools = factoryUsdmPools.map(pool => {
    const row = factoryRows.find(item => item.tx_hash === pool.txHash && Number(item.tx_index) === pool.outputIndex);
    const datum = row?.datum_hash ? datumByHash.get(row.datum_hash) : null;
    const decoded = decodePoolDatum(datum?.value);
    const assetMap = new Map(pool.assets.map(asset => [asset.unit, BigInt(asset.quantity)]));
    const reserveFor = coin => coin.policy === '' && coin.name === ''
      ? BigInt(pool.lovelace)
      : (assetMap.get(coin.policy + coin.name) ?? 0n);
    const reserveA = decoded ? reserveFor(decoded.coinA) : null;
    const reserveB = decoded ? reserveFor(decoded.coinB) : null;
    const datumPairContainsUsdm = decoded
      ? [decoded.coinA, decoded.coinB].some(coin => coin.policy + coin.name === USDM_UNIT)
      : false;
    return {
      txHash: pool.txHash,
      outputIndex: pool.outputIndex,
      address: pool.address,
      datumHash: row?.datum_hash ?? null,
      datumBytes: datum?.bytes ?? null,
      datumValue: datum?.value ?? null,
      decodedPoolDatum: decoded,
      reserveA: reserveA?.toString() ?? null,
      reserveB: reserveB?.toString() ?? null,
      reserveValueMatchesDatum: Boolean(decoded && reserveA > 0n && reserveB > 0n),
      datumPairContainsUsdm,
      usdmQuantityInValue: pool.usdmQuantity,
      poolNftAssets: pool.poolNftAssets,
      markerQuantity: pool.markerQuantity,
    };
  });
  const candidates = rows.filter(row => (row.asset_list ?? []).some(asset =>
    String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase() === USDM_UNIT
    && BigInt(String(asset.quantity ?? '0')) > 0n
  ));
  const normalized = candidates.map(row => ({
    txHash: row.tx_hash,
    outputIndex: Number(row.tx_index),
    address: row.address,
    lovelace: String(row.value),
    assets: (row.asset_list ?? []).map(asset => ({
      unit: String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase(),
      quantity: String(asset.quantity ?? '0'),
    })),
    datumHash: row.datum_hash ?? null,
    inlineDatumBytes: row.inline_datum?.bytes ?? null,
    inlineDatumHash: row.inline_datum?.hash ?? null,
    blockHeight: row.block_height ?? null,
    blockTime: row.block_time ?? null,
  }));
  manifest.completedAt = new Date().toISOString();
  manifest.tip = tipResult.data[0];
  manifest.pinnedAddressUtxoCount = rows.length;
  manifest.pinnedAddressUsdmCandidateCount = candidates.length;
  manifest.pinnedAddressUsdmCandidates = normalized;
  manifest.factoryMarker = { policy: FACTORY_POLICY, assetNameHex: FACTORY_NAME };
  manifest.poolNftPolicy = POOL_NFT_POLICY;
  manifest.factoryPoolUtxoCount = factoryPools.length;
  manifest.distinctFactoryPoolAddressCount = distinctPoolAddresses.length;
  manifest.distinctFactoryPoolAddresses = distinctPoolAddresses;
  manifest.factoryPoolUsdmCandidateCount = factoryUsdmPools.length;
  manifest.factoryPoolUsdmCandidates = factoryUsdmPools;
  manifest.candidateDatumHashes = candidateDatumHashes;
  manifest.datumInfoResponseSha256 = createHash('sha256').update(datumResult.raw, 'utf8').digest('hex');
  manifest.decodedUsdmPools = decodedUsdmPools;
  await writeFile(`${OUT}/candidate-datum-info-response.json`, datumResult.raw + '\\n');
  manifest.invalidFactoryMarkerCount = invalidMarkerRows.length;
  manifest.missingPoolNftCount = missingNftRows.length;
  manifest.addressResponseSha256 = createHash('sha256').update(addressUtxoResult.raw, 'utf8').digest('hex');
  manifest.factoryAssetUtxosResponseSha256 = createHash('sha256').update(factoryUtxoResult.raw, 'utf8').digest('hex');
  await writeFile(`${OUT}/pinned-address-utxos-response.json`, addressUtxoResult.raw + '\n');
  await writeFile(`${OUT}/factory-marker-asset-utxos-response.json`, factoryUtxoResult.raw + '\n');
  await writeFile(`${OUT}/observation.json`, JSON.stringify(manifest, null, 2) + '\n');
  const lines = [
    'MuesliSwap Mainnet USDM UTxO observation',
    `startedAt=${startedAt}`,
    `completedAt=${manifest.completedAt}`,
    `tipSlot=${manifest.tip.abs_slot ?? manifest.tip.absolute_slot ?? 'unknown'}`,
    `tipBlock=${manifest.tip.block_no ?? manifest.tip.block_height ?? 'unknown'}`,
    `pinnedAddressUtxoCount=${rows.length}`,
    `pinnedAddressUsdmCandidateCount=${candidates.length}`,
    `factoryPoolUtxoCount=${factoryPools.length}`,
    `distinctFactoryPoolAddressCount=${distinctPoolAddresses.length}`,
    `factoryPoolUsdmCandidateCount=${factoryUsdmPools.length}`,
    `candidateDatumCount=${datumResult.data.length}`,
    `decodedUsdmPoolCount=${decodedUsdmPools.filter(pool => pool.decodedPoolDatum !== null).length}`,
    `datumPairUsdmMatches=${decodedUsdmPools.filter(pool => pool.datumPairContainsUsdm).length}`,
    `reserveValueMatchesDatum=${decodedUsdmPools.filter(pool => pool.reserveValueMatchesDatum).length}`,
    `factoryPoolAddresses=${distinctPoolAddresses.join(',')}`,
    `invalidFactoryMarkerCount=${invalidMarkerRows.length}`,
    `missingPoolNftCount=${missingNftRows.length}`,
    `addressResponseSha256=${manifest.addressResponseSha256}`,
    `factoryAssetUtxosResponseSha256=${manifest.factoryAssetUtxosResponseSha256}`,
    'readOnly=true',
    'poolDatumDecoded=attempted-from-koios-datum-info',
    'scope=all-current-utxos-holding-exact-MuesliSwap-factory-marker',
  ];
  await writeFile(`${OUT}/summary.txt`, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  if (factoryUsdmPools.length === 0) console.log('RESULT=NO_CURRENT_USDM_UTXO_IN_FACTORY_MARKER_CENSUS');
} catch (error) {
  manifest.completedAt = new Date().toISOString();
  manifest.error = String(error?.stack ?? error);
  await writeFile(`${OUT}/observation-error.json`, JSON.stringify(manifest, null, 2) + '\n');
  console.error(manifest.error);
  process.exitCode = 1;
}
