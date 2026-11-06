import { readFile } from 'node:fs/promises'
import { assertArtifactEvidenceHash } from './eev-approval-integrity.mjs'

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(field + '_REQUIRED')
  }
  return value.trim()
}

function requireHex(value, bytes, field) {
  if (typeof value !== 'string' ||
      !(new RegExp('^[0-9a-fA-F]{' + (bytes * 2) + '}$')).test(value)) {
    throw new Error(field + '_MUST_BE_' + bytes + '_BYTE_HEX')
  }
  return value.toLowerCase()
}

function requireTokenNameHex(value, field) {
  if (typeof value !== 'string' || !/^(?:[0-9a-fA-F]{2}){1,32}$/.test(value)) {
    throw new Error(field + '_MUST_BE_1_TO_32_BYTE_HEX')
  }
  return value.toLowerCase()
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

function decodeAddressPayload(address, field) {
  const value = requireString(address, field)
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) {
    throw new Error(field + '_BECH32_MIXED_CASE')
  }
  const normalized = value.toLowerCase()
  const separator = normalized.lastIndexOf('1')
  if (separator < 1 || separator + 7 > normalized.length) {
    throw new Error(field + '_BECH32_FORMAT_INVALID')
  }
  const hrp = normalized.slice(0, separator)
  if (hrp !== 'addr_test') throw new Error(field + '_NOT_CARDANO_PREPROD_ADDRESS')
  const encoded = normalized.slice(separator + 1)
  const values = []
  for (const character of encoded) {
    const index = BECH32_CHARSET.indexOf(character)
    if (index < 0) throw new Error(field + '_BECH32_CHARACTER_INVALID')
    values.push(index)
  }
  if (bech32Polymod([...bech32HrpExpand(hrp), ...values]) !== 1) {
    throw new Error(field + '_BECH32_CHECKSUM_INVALID')
  }

  const data = values.slice(0, -6)
  const bytes = []
  let accumulator = 0
  let bits = 0
  for (const item of data) {
    accumulator = (accumulator << 5) | item
    bits += 5
    while (bits >= 8) {
      bits -= 8
      bytes.push((accumulator >>> bits) & 0xff)
    }
  }
  if (bits >= 5 || ((accumulator << (8 - bits)) & 0xff) !== 0) {
    throw new Error(field + '_BECH32_PADDING_INVALID')
  }
  if (bytes.length < 29) throw new Error(field + '_SHELLEY_PAYLOAD_TOO_SHORT')

  const header = bytes[0]
  const addressType = header >>> 4
  const networkId = header & 0x0f
  if (networkId !== 0) throw new Error(field + '_NETWORK_ID_NOT_PREPROD')
  return {
    addressType,
    networkId,
    paymentCredentialHash: Buffer.from(bytes.slice(1, 29)).toString('hex'),
  }
}

function assertPaymentCredential(address, expectedHash, credentialKind, field) {
  const decoded = decodeAddressPayload(address, field)
  const scriptTypes = [1, 3, 5, 7]
  const keyTypes = [0, 2, 4, 6]
  const allowed = credentialKind === 'script' ? scriptTypes : keyTypes
  if (!allowed.includes(decoded.addressType)) {
    throw new Error(field + '_PAYMENT_CREDENTIAL_KIND_MISMATCH')
  }
  if (decoded.paymentCredentialHash !== expectedHash) {
    throw new Error(field + '_PAYMENT_CREDENTIAL_HASH_MISMATCH')
  }
  return decoded
}

function assertNetworkAndStatus(manifest, label, schema, status) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(label + '_MANIFEST_MUST_BE_OBJECT')
  }
  if (manifest.schema !== schema) throw new Error(label + '_SCHEMA_MISMATCH')
  if (manifest.network !== 'cardano-preprod') throw new Error(label + '_NETWORK_MISMATCH')
  if (manifest.status !== status) throw new Error(label + '_STATUS_NOT_' + status)
  assertArtifactEvidenceHash(manifest, label)
}

async function readJson(path, readFileImpl, label) {
  requireString(path, label + '_PATH')
  let raw
  try {
    raw = await readFileImpl(path, 'utf8')
  } catch (error) {
    throw new Error(label + '_READ_FAILED:' + (error instanceof Error ? error.message : String(error)))
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(label + '_JSON_INVALID')
  }
}

/**
 * Load and cross-check the deployment identity manifests produced by the
 * existing Preprod deployment workflow. These manifests are configuration
 * provenance only: the consumer must still re-derive the scripts and query
 * the current live UTxOs before producing an observation packet.
 */
export async function loadProtectedCapitalDeploymentIdentity({
  deploymentManifestPath,
  oracleStateManifestPath,
  readFileImpl = readFile,
} = {}) {
  const deployment = await readJson(
    deploymentManifestPath,
    readFileImpl,
    'PREPROD_DIRECT_USDM_DEPLOYMENT',
  )
  const oracleManifest = await readJson(
    oracleStateManifestPath,
    readFileImpl,
    'PREPROD_ORACLE_STATE_DEPLOYMENT',
  )

  assertNetworkAndStatus(
    deployment,
    'PREPROD_DIRECT_USDM_DEPLOYMENT',
    'IMMORTAL-PREPROD-DIRECT-USDM-DEPLOYMENT-v0.1',
    'DEPLOYED',
  )
  assertNetworkAndStatus(
    oracleManifest,
    'PREPROD_ORACLE_STATE_DEPLOYMENT',
    'IMMORTAL-PREPROD-ORACLE-STATE-DEPLOYMENT-v0.1',
    'MATERIALIZED',
  )

  if (deployment.profileCandidate !== 'PRE-RICH-EEV-USDM-DIRECT-V1') {
    throw new Error('PREPROD_DEPLOYMENT_PROFILE_CANDIDATE_MISMATCH')
  }
  if (oracleManifest.authorityKind !== 'DEPLOYMENT_WALLET_SIGNED') {
    throw new Error('PREPROD_ORACLE_STATE_AUTHORITY_KIND_MISMATCH')
  }

  const oracle = deployment.oracleConfiguration
  const oracleState = oracleManifest.oracleState
  if (!oracle || typeof oracle !== 'object' || !oracleState || typeof oracleState !== 'object') {
    throw new Error('PREPROD_ORACLE_STATE_IDENTITY_MISSING')
  }

  const oraclePolicyId = requireHex(oracleState.policyId, 28, 'ORACLE_STATE_POLICY_ID')
  const oracleTokenNameHex = requireTokenNameHex(oracleState.tokenNameHex, 'ORACLE_STATE_TOKEN_NAME_HEX')
  const oraclePublisherPkh = requireHex(oracleState.publisherPkh, 28, 'ORACLE_STATE_PUBLISHER_PKH')
  const oracleUnit = requireString(oracleState.unit, 'ORACLE_STATE_UNIT').toLowerCase()
  const oracleAddress = requireString(oracleState.address, 'ORACLE_STATE_ADDRESS')
  const oracleUtxo = requireString(oracleState.utxo, 'ORACLE_STATE_UTXO')

  if (oracleUnit !== oraclePolicyId + oracleTokenNameHex) {
    throw new Error('ORACLE_STATE_UNIT_DOES_NOT_MATCH_POLICY_AND_NAME')
  }
  if (
    String(oracle.statePolicyId ?? '').toLowerCase() !== oraclePolicyId ||
    String(oracle.stateTokenNameHex ?? '').toLowerCase() !== oracleTokenNameHex ||
    String(oracle.publisherPkh ?? '').toLowerCase() !== oraclePublisherPkh ||
    oracle.address !== oracleAddress ||
    oracle.unit?.toLowerCase() !== oracleUnit ||
    oracle.utxo !== oracleUtxo ||
    oracle.authorityKind !== oracleManifest.authorityKind ||
    deployment.walletAddress !== oracleAddress
  ) {
    throw new Error('DIRECT_USDM_AND_ORACLE_STATE_MANIFEST_IDENTITY_MISMATCH')
  }

  const assets = deployment.assets
  const topology = deployment.topology
  if (!assets || typeof assets !== 'object' || !topology || typeof topology !== 'object') {
    throw new Error('PREPROD_DEPLOYMENT_TOPOLOGY_OR_ASSETS_MISSING')
  }
  const poolTokenPolicyId = requireHex(assets.poolTokenPolicyId, 28, 'B1_POOL_TOKEN_POLICY_ID')
  const poolTokenNameHex = requireTokenNameHex(assets.poolTokenNameHex, 'B1_POOL_TOKEN_NAME_HEX')
  const poolTokenUnit = requireString(assets.poolUnit, 'B1_POOL_TOKEN_UNIT').toLowerCase()
  if (poolTokenUnit !== poolTokenPolicyId + poolTokenNameHex) {
    throw new Error('B1_POOL_TOKEN_UNIT_DOES_NOT_MATCH_POLICY_AND_NAME')
  }

  const requiredTopology = {
    counterHash: topology.counterHash,
    registryHash: topology.registryHash,
    treasuryHash: topology.treasuryHash,
    prizeHash: topology.prizeHash,
    b1PrizePoolHash: topology.b1PrizePoolHash,
    ticketPolicyId: topology.ticketPolicyId,
    prizeAddress: topology.prizeAddress,
    b1PrizePoolAddress: topology.b1PrizePoolAddress,
  }
  for (const [key, value] of Object.entries(requiredTopology)) {
    requireString(value, 'DEPLOYMENT_TOPOLOGY_' + key)
  }
  const prizeHash = requireHex(topology.prizeHash, 28, 'PRIZE_VALIDATOR_HASH')
  const poolHash = requireHex(topology.b1PrizePoolHash, 28, 'B1_PRIZE_POOL_SCRIPT_HASH')
  const ticketPolicyId = requireHex(topology.ticketPolicyId, 28, 'TICKET_POLICY_ID')

  // Bind configured Preprod addresses to the exact payment credentials in the
  // historical deployment manifests. This checks address/hash consistency;
  // it does not authenticate the manifest or re-derive the Plutus bytecode.
  const prizeAddressBinding = assertPaymentCredential(
    requiredTopology.prizeAddress,
    prizeHash,
    'script',
    'PREPROD_PRIZE_VALIDATOR_ADDRESS',
  )
  const poolAddressBinding = assertPaymentCredential(
    requiredTopology.b1PrizePoolAddress,
    poolHash,
    'script',
    'PREPROD_B1_POOL_ADDRESS',
  )
  const oraclePublisherAddressBinding = assertPaymentCredential(
    oracleAddress,
    oraclePublisherPkh,
    'key',
    'PREPROD_ORACLE_PUBLISHER_ADDRESS',
  )

  const directUsdmUnit = requireString(assets.directUsdmUnit, 'DIRECT_USDM_UNIT').toLowerCase()
  if (!/^[0-9a-f]{56}(?:[0-9a-f]{2}){0,32}$/.test(directUsdmUnit)) {
    throw new Error('DIRECT_USDM_UNIT_INVALID')
  }

  return {
    sourceMode: 'DEPLOYMENT_MANIFESTS_HASH_CHECKED',
    manifestIntegrity: 'SELF_HASH_MATCH_NOT_SIGNATURE_AUTHENTICATION',
    manifestAuthorityCryptographicallyVerified: false,
    deploymentManifestPath,
    deploymentManifestEvidenceHash: deployment.evidenceHash.toLowerCase(),
    oracleStateManifestPath,
    oracleStateManifestEvidenceHash: oracleManifest.evidenceHash.toLowerCase(),
    network: 'Preprod',
    oraclePublisherPkh,
    oracleStatePolicyId: oraclePolicyId,
    oracleStateTokenNameHex: oracleTokenNameHex,
    oracleStateUnit: oracleUnit,
    oracleStateAddress: oracleAddress,
    oracleStateUtxo: oracleUtxo,
    poolTokenPolicyId,
    poolTokenNameHex,
    poolTokenUnit,
    directUsdmUnit,
    topology: {
      counterHash: requiredTopology.counterHash.toLowerCase(),
      registryHash: requiredTopology.registryHash.toLowerCase(),
      treasuryHash: requiredTopology.treasuryHash.toLowerCase(),
      prizeHash,
      b1PrizePoolHash: poolHash,
      ticketPolicyId,
      prizeAddress: requiredTopology.prizeAddress,
      b1PrizePoolAddress: requiredTopology.b1PrizePoolAddress,
    },
    addressBindings: {
      network: 'cardano-preprod',
      prizeValidator: {
        addressType: prizeAddressBinding.addressType,
        paymentCredentialHash: prizeAddressBinding.paymentCredentialHash,
        matchesDeploymentHash: true,
      },
      b1PrizePool: {
        addressType: poolAddressBinding.addressType,
        paymentCredentialHash: poolAddressBinding.paymentCredentialHash,
        matchesDeploymentHash: true,
      },
      oraclePublisher: {
        addressType: oraclePublisherAddressBinding.addressType,
        paymentCredentialHash: oraclePublisherAddressBinding.paymentCredentialHash,
        matchesConfiguredPublisherPkh: true,
      },
      scope: 'BECH32_ADDRESS_PAYMENT_CREDENTIAL_BINDING_ONLY_NOT_BYTECODE_REDERIVATION_OR_MANIFEST_AUTHENTICATION',
    },
  }
}
