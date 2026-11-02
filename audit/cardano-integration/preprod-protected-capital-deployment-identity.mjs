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

  const directUsdmUnit = requireString(assets.directUsdmUnit, 'DIRECT_USDM_UNIT').toLowerCase()
  if (!/^[0-9a-f]{56}(?:[0-9a-f]{2}){0,32}$/.test(directUsdmUnit)) {
    throw new Error('DIRECT_USDM_UNIT_INVALID')
  }

  return {
    sourceMode: 'VERIFIED_DEPLOYMENT_MANIFESTS',
    deploymentManifestPath,
    deploymentManifestEvidenceHash: deployment.evidenceHash.toLowerCase(),
    oracleStateManifestPath,
    oracleStateManifestEvidenceHash: oracleManifest.evidenceHash.toLowerCase(),
    network: 'Preprod',
    oraclePublisherPkh,
    oracleStatePolicyId: oraclePolicyId,
    oracleStateTokenNameHex,
    oracleStateUnit,
    oracleStateAddress: oracleAddress,
    oracleStateUtxo,
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
  }
}
