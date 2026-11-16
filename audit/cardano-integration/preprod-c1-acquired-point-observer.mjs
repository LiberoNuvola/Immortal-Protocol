/**
 * Read-only five-component C1 acquired-point observation primitive.
 *
 * This module accepts an explicitly supplied candidate identity envelope and
 * queries all five declared addresses through one already-acquired Ogmios
 * ledger-state session. It does NOT authenticate deployment authority,
 * re-derive scripts, classify PrizeDatum rows, or qualify C1.
 *
 * Candidate inputs remain untrusted until the GOV-30 authority chain exists.
 */

import { createHash } from 'node:crypto'
import { decodeC1ComponentCardinality } from './preprod-c1-cardinality-decoder.mjs'

export const C1_COMPONENT_IDS = Object.freeze([
  'prizeValidator',
  'b1Pool',
  'counter',
  'v3Carrier',
  'b2Control',
])

const SINGLETON_COMPONENTS = new Set(['b1Pool', 'v3Carrier', 'b2Control'])

/**
 * Deterministic JSON canonicalization for parsed Ogmios result objects.
 * This digest binds the parsed response, not the original WebSocket wire bytes.
 * Unsafe numeric values are rejected because JSON.parse would already have
 * lost their exact integer representation.
 */
export function canonicalJson(value) {
  if (value === null) return 'null'
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new Error('C1_OBSERVER_CANONICAL_JSON_NUMBER_INVALID')
    }
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']'
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return '{' + keys.map(key => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}'
  }
  throw new Error('C1_OBSERVER_CANONICAL_JSON_VALUE_UNSUPPORTED')
}

export function sha256CanonicalJson(value) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex')
}

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function bech32Polymod(values) {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < BECH32_GENERATORS.length; i += 1) {
      if (((top >>> i) & 1) !== 0) checksum ^= BECH32_GENERATORS[i]
    }
  }
  return checksum >>> 0
}

function bech32HrpExpand(hrp) {
  return [
    ...Array.from(hrp, character => character.charCodeAt(0) >>> 5),
    0,
    ...Array.from(hrp, character => character.charCodeAt(0) & 31),
  ]
}

/**
 * Decode only the address fields needed for the C1 payment-credential check.
 * This verifies Bech32 syntax/checksum, Preprod HRP/network id, Shelley script
 * payment credential type, and exact 28-byte payment credential. It does not
 * authenticate the deployment manifest or prove that the script bytes were
 * independently rebuilt from the declared source.
 */
export function decodeTestnetScriptAddress(address, expectedPaymentCredentialHash) {
  if (typeof address !== 'string' || address.trim() === '') {
    throw new Error('C1_IDENTITY_ADDRESS_REQUIRED')
  }
  const value = address.trim()
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) {
    throw new Error('C1_IDENTITY_ADDRESS_BECH32_MIXED_CASE')
  }
  const normalized = value.toLowerCase()
  const separator = normalized.lastIndexOf('1')
  if (separator < 1 || separator + 7 > normalized.length) {
    throw new Error('C1_IDENTITY_ADDRESS_BECH32_FORMAT_INVALID')
  }
  const hrp = normalized.slice(0, separator)
  if (hrp !== 'addr_test') {
    throw new Error('C1_IDENTITY_ADDRESS_NOT_PREPROD')
  }

  const encoded = normalized.slice(separator + 1)
  const words = []
  for (const character of encoded) {
    const word = BECH32_CHARSET.indexOf(character)
    if (word < 0) throw new Error('C1_IDENTITY_ADDRESS_BECH32_CHARACTER_INVALID')
    words.push(word)
  }
  if (bech32Polymod([...bech32HrpExpand(hrp), ...words]) !== 1) {
    throw new Error('C1_IDENTITY_ADDRESS_BECH32_CHECKSUM_INVALID')
  }

  const data = words.slice(0, -6)
  const bytes = []
  let accumulator = 0
  let bits = 0
  for (const word of data) {
    accumulator = ((accumulator << 5) | word) & 0xfff
    bits += 5
    while (bits >= 8) {
      bits -= 8
      bytes.push((accumulator >>> bits) & 0xff)
    }
  }
  if (bits >= 5 || ((accumulator << (8 - bits)) & 0xff) !== 0) {
    throw new Error('C1_IDENTITY_ADDRESS_BECH32_PADDING_INVALID')
  }
  if (bytes.length < 29) {
    throw new Error('C1_IDENTITY_ADDRESS_SHELLEY_PAYLOAD_TOO_SHORT')
  }

  const addressType = bytes[0] >>> 4
  const networkId = bytes[0] & 0x0f
  if (networkId !== 0) {
    throw new Error('C1_IDENTITY_ADDRESS_NETWORK_ID_NOT_PREPROD')
  }
  if (![1, 3, 5, 7].includes(addressType)) {
    throw new Error('C1_IDENTITY_ADDRESS_PAYMENT_CREDENTIAL_NOT_SCRIPT')
  }
  const validPayloadLength =
    (addressType === 1 || addressType === 3) ? bytes.length === 57 :
    addressType === 5 ? bytes.length >= 32 :
    bytes.length === 29
  if (!validPayloadLength) {
    throw new Error('C1_IDENTITY_ADDRESS_SHELLEY_PAYLOAD_LENGTH_INVALID')
  }

  const paymentCredentialHash = Buffer.from(bytes.slice(1, 29)).toString('hex')
  const expected = requiredPaymentCredentialHash(expectedPaymentCredentialHash)
  if (paymentCredentialHash !== expected) {
    throw new Error('C1_IDENTITY_ADDRESS_PAYMENT_CREDENTIAL_HASH_MISMATCH')
  }
  return { addressType, networkId, paymentCredentialHash }
}

function requiredPaymentCredentialHash(value) {
  if (typeof value !== 'string' || !/^[0-9a-fA-F]{56}$/.test(value)) {
    throw new Error('C1_IDENTITY_PAYMENT_CREDENTIAL_HASH_INVALID')
  }
  return value.toLowerCase()
}

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('C1_IDENTITY_' + field + '_REQUIRED')
  }
  return value.trim()
}

function requiredHex(value, bytes, field) {
  const normalized = requiredString(value, field).toLowerCase()
  if (!(new RegExp('^[0-9a-f]{' + (bytes * 2) + '}$')).test(normalized)) {
    throw new Error('C1_IDENTITY_' + field + '_INVALID')
  }
  return normalized
}

/**
 * Structural validation only. A valid result is not an authenticated
 * deployment identity and must never be promoted to deployment authority.
 */
export function validateC1CandidateIdentityEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new Error('C1_IDENTITY_ENVELOPE_REQUIRED')
  }
  if (envelope.schema !== 'IMMORTAL-PREPROD-DEPLOYMENT-IDENTITY-v0.1') {
    throw new Error('C1_IDENTITY_SCHEMA_UNSUPPORTED')
  }
  if (envelope.network !== 'cardano-preprod') {
    throw new Error('C1_IDENTITY_NETWORK_MISMATCH')
  }

  const deploymentId = requiredString(envelope.deploymentId, 'DEPLOYMENT_ID')
  const sourceCommit = requiredHex(envelope.source?.commit, 20, 'SOURCE_COMMIT')
  if (!Array.isArray(envelope.components)) {
    throw new Error('C1_IDENTITY_COMPONENTS_REQUIRED')
  }

  const byId = new Map()
  const addressOwners = new Map()
  for (const component of envelope.components) {
    const componentId = requiredString(component?.componentId, 'COMPONENT_ID')
    if (!C1_COMPONENT_IDS.includes(componentId)) {
      throw new Error('C1_IDENTITY_COMPONENT_UNKNOWN:' + componentId)
    }
    if (byId.has(componentId)) {
      throw new Error('C1_IDENTITY_COMPONENT_DUPLICATE:' + componentId)
    }
    if (requiredString(component.deploymentId, componentId + '_DEPLOYMENT_ID') !== deploymentId) {
      throw new Error('C1_IDENTITY_DEPLOYMENT_GENERATION_MISMATCH:' + componentId)
    }
    if (requiredHex(component.sourceCommit, 20, componentId + '_SOURCE_COMMIT') !== sourceCommit) {
      throw new Error('C1_IDENTITY_SOURCE_COMMIT_MISMATCH:' + componentId)
    }
    const componentAddress = requiredString(component.address, componentId + '_ADDRESS')
    if (component.address !== componentAddress) {
      throw new Error('C1_IDENTITY_ADDRESS_WHITESPACE_INVALID:' + componentId)
    }
    if (addressOwners.has(componentAddress)) {
      throw new Error('C1_IDENTITY_ADDRESS_REUSED:' + componentId + ':also-used-by:' + addressOwners.get(componentAddress))
    }
    addressOwners.set(componentAddress, componentId)
    if (component.paymentCredentialKind !== 'script') {
      throw new Error('C1_IDENTITY_PAYMENT_CREDENTIAL_KIND_INVALID:' + componentId)
    }
    const paymentCredentialHash = requiredHex(component.paymentCredentialHash, 28, componentId + '_PAYMENT_CREDENTIAL_HASH')
    const derivedScriptHash = requiredHex(component.derivedScriptHash, 28, componentId + '_DERIVED_SCRIPT_HASH')
    if (paymentCredentialHash !== derivedScriptHash) {
      throw new Error('C1_IDENTITY_PAYMENT_CREDENTIAL_DERIVED_HASH_MISMATCH:' + componentId)
    }
    decodeTestnetScriptAddress(componentAddress, derivedScriptHash)
    requiredHex(component.scriptArtifactDigest, 32, componentId + '_SCRIPT_ARTIFACT_DIGEST')
    requiredHex(component.parameterDigest, 32, componentId + '_PARAMETER_DIGEST')
    const deploymentTxOutRef = requiredString(component.deploymentTxOutRef, componentId + '_DEPLOYMENT_TX_OUT_REF')
    const deploymentRefMatch = /^([0-9a-f]{64})#(0|[1-9][0-9]*)$/i.exec(deploymentTxOutRef)
    if (!deploymentRefMatch || !Number.isSafeInteger(Number(deploymentRefMatch[2]))) {
      throw new Error('C1_IDENTITY_DEPLOYMENT_TX_OUT_REF_INVALID:' + componentId)
    }

    if (SINGLETON_COMPONENTS.has(componentId)) {
      requiredHex(component.singleton?.policyId, 28, componentId + '_SINGLETON_POLICY_ID')
      const tokenNameHex = requiredString(component.singleton?.tokenNameHex, componentId + '_SINGLETON_TOKEN_NAME')
      if (!/^(?:[0-9a-fA-F]{2}){1,32}$/.test(tokenNameHex)) {
        throw new Error('C1_IDENTITY_SINGLETON_TOKEN_NAME_INVALID:' + componentId)
      }
    } else if (component.singleton != null) {
      throw new Error('C1_IDENTITY_UNEXPECTED_SINGLETON:' + componentId)
    }

    byId.set(componentId, component)
  }

  for (const componentId of C1_COMPONENT_IDS) {
    if (!byId.has(componentId)) {
      throw new Error('C1_IDENTITY_COMPONENT_MISSING:' + componentId)
    }
  }

  return {
    deploymentId,
    sourceCommit,
    components: C1_COMPONENT_IDS.map(componentId => byId.get(componentId)),
    identityConsistency: 'STRUCTURAL_INPUT_CHECKS_ONLY',
    deploymentAuthorityVerified: false,
    c1Qualified: false,
  }
}

/**
 * Verify the connected node's Shelley genesis against Cardano Preprod.
 * Cardano addresses carry only the mainnet/testnet discriminant; the network
 * magic distinguishes Preprod from Preview and other testnets.
 */
export function validatePreprodNetworkGenesis(genesis) {
  if (!genesis || typeof genesis !== 'object' || Array.isArray(genesis)) {
    throw new Error('C1_OBSERVER_PREPROD_GENESIS_CONFIGURATION_REQUIRED')
  }
  if (genesis.era !== 'shelley' || genesis.network !== 'testnet') {
    throw new Error('C1_OBSERVER_NETWORK_CONFIGURATION_MISMATCH')
  }
  if (!Number.isSafeInteger(genesis.networkMagic) || genesis.networkMagic !== 1) {
    throw new Error('C1_OBSERVER_PREPROD_NETWORK_MAGIC_MISMATCH')
  }
  return {
    era: 'shelley',
    network: 'testnet',
    networkMagic: 1,
  }
}

/**
 * Query the five exact candidate addresses at the same acquired ledger point.
 * The Shelley genesis query is also performed in the active session to
 * distinguish Preprod (network magic 1) from Preview (network magic 2).
 * Raw Ogmios responses are retained unchanged for independent decoding.
 */
export async function observeC1ComponentsAtAcquiredPoint({
  ledgerSession,
  identityEnvelope,
}) {
  if (!ledgerSession || ledgerSession.isAcquired !== true ||
      ledgerSession.isReleased !== false || !ledgerSession.point) {
    throw new Error('C1_OBSERVER_REQUIRES_ACTIVE_ACQUIRED_LEDGER_SESSION')
  }

  const identity = validateC1CandidateIdentityEnvelope(identityEnvelope)
  const acquiredPoint = { ...ledgerSession.point }
  const observations = {}
  const identityEnvelopeCanonicalJsonSha256 = sha256CanonicalJson(identityEnvelope)
  const genesisQuery = {
    method: 'queryNetwork/genesisConfiguration',
    params: { era: 'shelley' },
  }
  const genesisResult = await ledgerSession.query(genesisQuery.method, genesisQuery.params)
  if (ledgerSession.isAcquired !== true || ledgerSession.isReleased !== false ||
      JSON.stringify(ledgerSession.point) !== JSON.stringify(acquiredPoint)) {
    throw new Error('C1_OBSERVER_LEDGER_SESSION_POINT_CHANGED:preprod-genesis')
  }
  const networkIdentity = validatePreprodNetworkGenesis(genesisResult)

  for (const component of identity.components) {
    const query = {
      method: 'queryLedgerState/utxo',
      params: { addresses: [component.address] },
    }
    const raw = await ledgerSession.query(query.method, query.params)
    if (!Array.isArray(raw)) {
      throw new Error('C1_OBSERVER_UTXO_RESPONSE_NOT_ARRAY:' + component.componentId)
    }
    if (ledgerSession.isAcquired !== true || ledgerSession.isReleased !== false ||
        JSON.stringify(ledgerSession.point) !== JSON.stringify(acquiredPoint)) {
      throw new Error('C1_OBSERVER_LEDGER_SESSION_POINT_CHANGED:' + component.componentId)
    }

    const cardinality = decodeC1ComponentCardinality({
      component,
      rawUtxos: raw,
    })
    observations[component.componentId] = {
      address: component.address,
      query,
      queryCanonicalJsonSha256: sha256CanonicalJson(query),
      rawUtxoCount: raw.length,
      rawOgmiosUtxoResult: raw,
      rawOgmiosUtxoResultCanonicalJsonSha256: sha256CanonicalJson(raw),
      cardinality,
      cardinalityStatus: cardinality.cardinalityStatus,
    }
  }

  return {
    schema: 'IMMORTAL-PREPROD-C1-ACQUIRED-POINT-RAW-OBSERVATION-v0.1',
    network: 'cardano-preprod',
    deploymentId: identity.deploymentId,
    sourceCommit: identity.sourceCommit,
    acquiredLedgerState: acquiredPoint,
    queryConsistency: 'ONE_ACQUIRED_OGMIOS_LEDGER_STATE',
    networkIdentity,
    networkGenesisQuery: genesisQuery,
    networkGenesisQueryCanonicalJsonSha256: sha256CanonicalJson(genesisQuery),
    networkGenesisResult: genesisResult,
    networkGenesisResultCanonicalJsonSha256: sha256CanonicalJson(genesisResult),
    digestAlgorithm: 'SHA256_CANONICAL_JSON_V1',
    digestScope: 'PARSED_JSON_OBJECTS_NOT_ORIGINAL_WEBSOCKET_WIRE_BYTES',
    identityEnvelopeCanonicalJsonSha256,
    componentOrder: [...C1_COMPONENT_IDS],
    observations,
    identityConsistency: identity.identityConsistency,
    deploymentAuthorityVerified: false,
    cardinalityQualified: false,
    prizeValidatorPopulationClassified: false,
    c1Qualified: false,
    qualificationBlockers: [
      'GOV_30_TRUST_ROOT_AND_AUTHORIZED_DEPLOYMENT_ATTESTATION_UNRESOLVED',
      'SCRIPT_AND_PARAMETER_REDERIVATION_NOT_PERFORMED_BY_THIS_OBSERVER',
      'PRIZEVALIDATOR_POPULATION_CLASSIFICATION_REQUIRES_PRIZEDATUM_DECODER_AND_AUTHENTICATED_ADDRESS',
      'PRIZEVALIDATOR_POPULATION_CLASSIFICATION_NOT_PERFORMED_BY_THIS_OBSERVER',
      'B1_V3_AGGREGATE_RECONCILIATION_NOT_PERFORMED',
    ],
  }
}
