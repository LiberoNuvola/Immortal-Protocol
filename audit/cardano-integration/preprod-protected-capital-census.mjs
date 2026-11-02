#!/usr/bin/env node

/**
 * Read-only Preprod ProtectedCapital ticket source census.
 *
 * Run from the repository root:
 *   node --import=tsx audit/cardano-integration/preprod-protected-capital-census.mjs
 *
 * Preferred deployment identity inputs (read-only, no signing secret):
 *   PC_CENSUS_DEPLOYMENT_MANIFEST
 *   PC_CENSUS_ORACLE_STATE_MANIFEST
 *
 * Legacy fallback (when both manifests are not supplied):
 *   VITE_ORACLE_PUBLISHER_PKH
 *   VITE_ORACLE_STATE_POLICY_ID
 *   VITE_ORACLE_STATE_TOKEN_NAME_HEX
 *   VITE_B1_POOL_TOKEN_POLICY_ID
 *   VITE_B1_POOL_TOKEN_NAME_HEX
 *
 * Optional:
 *   VITE_TICKET_POLICY_ID        (cross-check against derived MintPolicy ID)
 *   KOIOS_PREPROD_URL            (defaults to the official Koios Preprod endpoint)
 *   KOIOS_API_TOKEN              (optional Koios bearer token)
 *   PC_CENSUS_OUTPUT             (output JSON path)
 *
 * This script never signs, builds, submits, or mutates a Cardano transaction.
 * The output is an unauthenticated-provider observation packet and does not
 * certify the whole ProtectedCapital perimeter or PA1-PA7.
 */

import 'dotenv/config'

import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import {
  Data,
  mintingPolicyToId,
  validatorToAddress,
  validatorToScriptHash,
} from '@lucid-evolution/lucid'

import { buildScriptsFromLucid } from '../../src/loadValidator'
import { defaultPrizeTable } from '../../src/gameRules'
import { buildPreRichProtectedCapitalItemLedger } from '../../PRE-RICH/src/PreRichProtectedCapitalItemLedger'
import { createKoiosProtectedCapitalSource } from '../../relayer/koiosProtectedCapitalSourceCensus.js'
import { loadProtectedCapitalDeploymentIdentity } from './preprod-protected-capital-deployment-identity.mjs'

const KOIOS_BASE_URL =
  process.env.KOIOS_PREPROD_URL?.trim() ||
  'https://preprod.koios.rest/api/v1'

function requiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error('CONFIG_REQUIRED:' + name)
  return value
}

function hexBytes(value, field) {
  if (typeof value === 'string' && /^(?:[0-9a-fA-F]{2})*$/.test(value)) {
    return value.toLowerCase()
  }
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return Buffer.from(value).toString('hex')
  }
  throw new Error('DATUM_BYTES_FIELD_INVALID:' + field)
}

function dataFields(value, field, expectedLength) {
  if (!value || !Array.isArray(value.fields) || value.index !== 0) {
    throw new Error(field + '_NOT_CONSTR_0')
  }
  if (value.fields.length !== expectedLength) {
    throw new Error(field + '_FIELD_COUNT_MISMATCH')
  }
  return value.fields
}

function dataInt(value, field) {
  let parsed
  try {
    parsed = typeof value === 'bigint'
      ? value
      : typeof value === 'number' && Number.isSafeInteger(value)
        ? BigInt(value)
        : BigInt(value?.int ?? value)
  } catch {
    throw new Error(field + '_NOT_INTEGER')
  }
  if (parsed < 0n) throw new Error(field + '_NEGATIVE')
  return parsed
}

function dataConstrIndex(value, field, allowed) {
  const index = Number(value?.index)
  if (!Number.isInteger(index) || !allowed.includes(index)) {
    throw new Error(field + '_UNSUPPORTED_CONSTRUCTOR')
  }
  return index
}

function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function datumDigest(datumBytesHex) {
  return sha256Hex(Buffer.from(datumBytesHex, 'hex'))
}

function exactUtxoReference(row) {
  return row.tx_hash + '#' + row.tx_index
}

function assetQuantity(row, unit) {
  const policy = unit.slice(0, 56).toLowerCase()
  const name = unit.slice(56).toLowerCase()
  const rows = Array.isArray(row.asset_list) ? row.asset_list : []
  let total = 0n
  for (const asset of rows) {
    const candidatePolicy = String(asset.policy_id ?? '').toLowerCase()
    const candidateName = String(asset.asset_name ?? '').toLowerCase()
    if (candidatePolicy === policy && candidateName === name) {
      total += BigInt(String(asset.quantity ?? '0'))
    }
  }
  return total
}

function assertDatumContentUsable(row, label) {
  if (!row.datum_bytes) throw new Error(label + '_DATUM_BYTES_MISSING')
  if (row.datum_hash) {
    if (row.datum_hash_content_verified !== true) {
      throw new Error(label + '_CARDANO_DATUM_HASH_NOT_VERIFIED')
    }
    return
  }
  if (row.datum_source !== 'INLINE' ||
      row.datum_hash_verification !== 'INLINE_DATUM_HASH_NOT_APPLICABLE') {
    throw new Error(label + '_DATUM_HASH_MISSING_WITHOUT_INLINE_DATUM')
  }
}

function parsePrizeDatum(row) {
  const reference = exactUtxoReference(row)
  assertDatumContentUsable(row, 'PRIZEDATUM')
  const raw = Data.from(row.datum_bytes)
  const fields = dataFields(raw, 'PRIZEDATUM', 23)

  const ticketPolicyId = hexBytes(fields[0], 'pdTicketPolicy')
  const ticketAssetNameHex = hexBytes(fields[1], 'pdTicketName')
  const priceUsdmSubunits = dataInt(fields[3], 'pdPriceUsdm')
  const prizeAmountUsdmSubunits = dataInt(fields[7], 'pdPrizeAmount')
  const prizeStatusIndex = dataConstrIndex(fields[10], 'pdStatus', [0, 1, 2])
  const beaconStatusIndex = dataConstrIndex(fields[14], 'pdBeaconStatus', [0, 1])
  const observedPrizePoolHash = hexBytes(fields[18], 'pdPrizePoolHash')
  const issuedAt = dataInt(fields[19], 'pdIssuedAt')
  const expiresAt = dataInt(fields[20], 'pdExpiresAt')

  if (!ticketPolicyId || !ticketAssetNameHex) {
    throw new Error('PRIZEDATUM_TICKET_IDENTITY_EMPTY')
  }

  const status = ['Pending', 'Revealed', 'Claimed'][prizeStatusIndex]
  const beaconStatus = ['BeaconPending', 'BeaconReady'][beaconStatusIndex]

  return {
    utxoReference: reference,
    datumDigest: datumDigest(row.datum_bytes),
    ticketPolicyId,
    ticketAssetNameHex,
    prizePoolHash: observedPrizePoolHash,
    priceUsdmSubunits,
    prizeAmountUsdmSubunits,
    prizeStatus: status,
    beaconStatus,
    issuedAt,
    expiresAt,
  }
}

function parsePoolDatum(row, expectedPrizeHash, snapshotReference) {
  assertDatumContentUsable(row, 'B1_POOL')
  const fields = dataFields(Data.from(row.datum_bytes), 'B1_POOL_DATUM', 8)
  const embeddedPrizeHash = hexBytes(fields[7], 'ppPrizeHash')
  if (embeddedPrizeHash !== expectedPrizeHash.toLowerCase()) {
    throw new Error('B1_POOL_DATUM_PRIZE_HASH_MISMATCH')
  }
  return {
    utxoReference: exactUtxoReference(row),
    datumDigest: datumDigest(row.datum_bytes),
    snapshotReference,
    prizeValidatorHash: embeddedPrizeHash,
    pendingLiabilitiesUsdmSubunits: dataInt(fields[1], 'ppPendingLiabilities'),
    unresolvedReserveUsdmSubunits: dataInt(fields[2], 'ppUnresolvedReserve'),
    unresolvedTicketCount: dataInt(fields[3], 'ppUnresolvedTicketCount'),
    lockedJackpotUsdmSubunits: dataInt(fields[4], 'ppLockedJackpot'),
    jackpotThresholdUsdmSubunits: dataInt(fields[5], 'ppJackpotThreshold'),
  }
}

function jsonBigIntReplacer(_key, value) {
  return typeof value === 'bigint' ? value.toString() : value
}

function makeLucidScriptUtils() {
  return {
    validatorToScriptHash,
    mintingPolicyToId,
    validatorToAddress: (script) => validatorToAddress('Preprod', script),
  }
}

async function main() {
  const deploymentManifestPath = process.env.PC_CENSUS_DEPLOYMENT_MANIFEST?.trim()
  const oracleStateManifestPath = process.env.PC_CENSUS_ORACLE_STATE_MANIFEST?.trim()
  const manifestMode = Boolean(deploymentManifestPath || oracleStateManifestPath)

  let identity
  if (manifestMode) {
    if (!deploymentManifestPath || !oracleStateManifestPath) {
      throw new Error('BOTH_PREPROD_DEPLOYMENT_AND_ORACLE_STATE_MANIFESTS_ARE_REQUIRED')
    }
    identity = await loadProtectedCapitalDeploymentIdentity({
      deploymentManifestPath,
      oracleStateManifestPath,
    })
  } else {
    const oraclePublisherPkh = requiredEnv('VITE_ORACLE_PUBLISHER_PKH')
    const oracleStatePolicyId = requiredEnv('VITE_ORACLE_STATE_POLICY_ID')
    const oracleStateTokenNameHex = requiredEnv('VITE_ORACLE_STATE_TOKEN_NAME_HEX')
    const poolTokenPolicyId = requiredEnv('VITE_B1_POOL_TOKEN_POLICY_ID')
    const poolTokenNameHex = requiredEnv('VITE_B1_POOL_TOKEN_NAME_HEX')

    if (!/^[0-9a-fA-F]{56}$/.test(oraclePublisherPkh)) {
      throw new Error('VITE_ORACLE_PUBLISHER_PKH_MUST_BE_28_BYTE_HEX')
    }
    if (!/^[0-9a-fA-F]{56}$/.test(oracleStatePolicyId)) {
      throw new Error('VITE_ORACLE_STATE_POLICY_ID_MUST_BE_28_BYTE_HEX')
    }
    if (!/^(?:[0-9a-fA-F]{2}){1,32}$/.test(oracleStateTokenNameHex)) {
      throw new Error('VITE_ORACLE_STATE_TOKEN_NAME_HEX_INVALID')
    }
    if (!/^[0-9a-fA-F]{56}$/.test(poolTokenPolicyId)) {
      throw new Error('VITE_B1_POOL_TOKEN_POLICY_ID_MUST_BE_28_BYTE_HEX')
    }
    if (!/^(?:[0-9a-fA-F]{2}){1,32}$/.test(poolTokenNameHex)) {
      throw new Error('VITE_B1_POOL_TOKEN_NAME_HEX_INVALID')
    }

    identity = {
      sourceMode: 'EXPLICIT_ENVIRONMENT_CONFIGURATION',
      deploymentManifestPath: null,
      deploymentManifestEvidenceHash: null,
      oracleStateManifestPath: null,
      oracleStateManifestEvidenceHash: null,
      network: 'Preprod',
      oraclePublisherPkh,
      oracleStatePolicyId,
      oracleStateTokenNameHex,
      poolTokenPolicyId,
      poolTokenNameHex,
      poolTokenUnit: poolTokenPolicyId.toLowerCase() + poolTokenNameHex.toLowerCase(),
      directUsdmUnit: null,
      topology: null,
    }
  }

  const topology = buildScriptsFromLucid(
    { utils: makeLucidScriptUtils() },
    defaultPrizeTable,
    identity.oraclePublisherPkh,
    identity.oracleStatePolicyId,
    identity.oracleStateTokenNameHex,
    identity.poolTokenPolicyId,
    identity.poolTokenNameHex,
  )

  if (!topology.prizeAddress || !topology.b1PrizePoolAddress) {
    throw new Error('PREPROD_SCRIPT_ADDRESS_DERIVATION_FAILED')
  }

  if (identity.topology) {
    const identityFields = [
      'counterHash',
      'registryHash',
      'treasuryHash',
      'prizeHash',
      'b1PrizePoolHash',
      'ticketPolicyId',
      'prizeAddress',
      'b1PrizePoolAddress',
    ]
    for (const field of identityFields) {
      const expected = String(identity.topology[field]).toLowerCase()
      const derived = String(topology[field] ?? '').toLowerCase()
      if (!expected || derived !== expected) {
        throw new Error('DEPLOYED_SCRIPT_TOPOLOGY_DOES_NOT_MATCH_MANIFEST:' + field)
      }
    }
  }

  const configuredTicketPolicyId = process.env.VITE_TICKET_POLICY_ID?.trim()
  if (configuredTicketPolicyId &&
      configuredTicketPolicyId.toLowerCase() !== topology.ticketPolicyId.toLowerCase()) {
    throw new Error('CONFIGURED_TICKET_POLICY_DOES_NOT_MATCH_DERIVED_MINT_POLICY')
  }

  const poolUnit = identity.poolTokenUnit.toLowerCase()
  const source = createKoiosProtectedCapitalSource({
    baseUrl: KOIOS_BASE_URL,
    apiToken: process.env.KOIOS_API_TOKEN?.trim() || '',
    pageSize: 500,
  })

  const scan = await source.scanSnapshot([
    { name: 'prizeValidator', address: topology.prizeAddress },
    { name: 'b1PrizePool', address: topology.b1PrizePoolAddress },
  ])

  const prizeScan = scan.addressScans.prizeValidator
  const poolScan = scan.addressScans.b1PrizePool
  const poolCandidates = poolScan.rows
    .map((row) => ({ row, quantity: assetQuantity(row, poolUnit) }))
    .filter((entry) => entry.quantity > 0n)
  if (poolCandidates.length !== 1 || poolCandidates[0].quantity !== 1n) {
    throw new Error(
      'B1_POOL_SINGLETON_NOT_UNIQUE_OR_BAD_QUANTITY:' +
      poolCandidates.length + ':' +
      poolCandidates.map((entry) => entry.quantity.toString()).join(','),
    )
  }

  const poolRow = poolCandidates[0].row
  const poolState = parsePoolDatum(
    poolRow,
    topology.prizeHash,
    scan.snapshotReference,
  )

  const records = []
  const unclassifiedOutputs = []
  for (const row of prizeScan.rows) {
    try {
      records.push(parsePrizeDatum(row))
    } catch (error) {
      unclassifiedOutputs.push({
        utxoReference: exactUtxoReference(row),
        datumHash: row.datum_hash ?? null,
        datumSource: row.datum_source,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const census = {
    network: 'Preprod',
    observedSlot: scan.observedSlot,
    observedAt: scan.observedAt,
    providerId: 'Koios Preprod',
    snapshotReference: scan.snapshotReference,
    sourceReference: 'koios-preprod:' + scan.sourceManifestDigest,
    sourceManifestDigest: scan.sourceManifestDigest,
    prizeValidatorAddress: topology.prizeAddress,
    prizeValidatorHash: topology.prizeHash,
    b1PrizePoolScriptHash: topology.b1PrizePoolHash,
    ticketPolicyId: topology.ticketPolicyId,
    paginationComplete: true,
    pageCount: BigInt(prizeScan.pages.length),
    sourceUtxoCount: BigInt(prizeScan.totalCount),
    decodedPrizeDatumCount: BigInt(records.length),
    unclassifiedUtxoCount: BigInt(unclassifiedOutputs.length),
    pool: poolState,
    records,
  }

  const ledger = buildPreRichProtectedCapitalItemLedger(census)
  const output = {
    schema: 'IMMORTAL-PREPROD-PROTECTED-CAPITAL-CENSUS-V1',
    createdAt: new Date().toISOString(),
    providerReadOnly: true,
    transactionSubmissionAttempted: false,
    network: 'Preprod',
    deploymentIdentity: {
      sourceMode: identity.sourceMode,
      manifestIntegrity: identity.manifestIntegrity ?? 'ENVIRONMENT_CONFIGURATION_NO_MANIFEST',
      manifestAuthorityCryptographicallyVerified: identity.manifestAuthorityCryptographicallyVerified ?? false,
      deploymentManifestPath: identity.deploymentManifestPath,
      deploymentManifestEvidenceHash: identity.deploymentManifestEvidenceHash,
      oracleStateManifestPath: identity.oracleStateManifestPath,
      oracleStateManifestEvidenceHash: identity.oracleStateManifestEvidenceHash,
      oracleStateAddress: identity.oracleStateAddress ?? null,
      oracleStateUtxo: identity.oracleStateUtxo ?? null,
      directUsdmUnit: identity.directUsdmUnit,
    },
    topology: {
      prizeValidatorAddress: topology.prizeAddress,
      prizeValidatorHash: topology.prizeHash,
      b1PrizePoolAddress: topology.b1PrizePoolAddress,
      b1PrizePoolHash: topology.b1PrizePoolHash,
      ticketPolicyId: topology.ticketPolicyId,
      b1PoolTokenUnit: poolUnit,
    },
    sourceManifest: scan.manifest,
    ledger,
    unclassifiedOutputs,
    rawSource: {
      prizeValidatorUtxos: prizeScan.rows,
      b1PrizePoolUtxos: poolScan.rows,
    },
    qualifications: {
      ticketLedgerInternallyReconciled: ledger.qualification.ticketLedgerInternallyReconciled,
      deploymentManifestAuthorityCryptographicallyVerified: identity.manifestAuthorityCryptographicallyVerified ?? false,
      sourceCompletenessAuthorityVerified: false,
      providerAttestationVerified: false,
      datumBytesAvailableForAll: scan.manifest.datumBytesAvailableForAll,
    datumHashComparisonsVerified: scan.manifest.datumHashComparisonsVerified,
    datumHashComparisonRequiredCount: scan.manifest.datumHashComparisonRequiredCount,
    datumHashMismatchCount: scan.manifest.datumHashMismatchCount,
    inlineDatumWithoutHashCount: scan.manifest.inlineDatumWithoutHashCount,
      providerSnapshotPinned: false,
      sameBackendSnapshotVerified: false,
      fullProtectedCapitalQualified: false,
      r7L6EmptinessProven: false,
      l2LifecycleProven: false,
      liveL5RowsMayBePresent: true,
      consumedL5ExpiryHistoryRequiresTransactionReplay: true,
    },
  }

  const outputPath = resolve(
    process.cwd(),
    process.env.PC_CENSUS_OUTPUT?.trim() ||
      '.immortal-evidence/protected-capital/preprod-protected-capital-census-' +
        scan.observedSlot.toString() + '.json',
  )
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    JSON.stringify(output, jsonBigIntReplacer, 2) + '\n',
    { flag: 'wx' },
  )

  console.log(JSON.stringify({
    status: ledger.qualification.ticketLedgerInternallyReconciled
      ? 'INTERNAL_RECONCILIATION_ONLY'
      : 'BLOCKED',
    outputPath,
    snapshotReference: scan.snapshotReference,
    sourceManifestDigest: scan.sourceManifestDigest,
    prizeValidatorUtxoCount: prizeScan.totalCount,
    decodedPrizeDatumCount: records.length,
    unclassifiedPrizeValidatorOutputs: unclassifiedOutputs.length,
    l1PendingLiabilitiesMatch: ledger.reconciliation.l1MatchesB1PendingLiabilities,
    l3PriceReserveMatch: ledger.reconciliation.l3FacePriceMatchesB1UnresolvedReserve,
    l3TicketCountMatch: ledger.reconciliation.l3CountMatchesB1UnresolvedTicketCount,
    sourceCompletenessAuthorityVerified: false,
    providerAttestationVerified: false,
    datumBytesAvailableForAll: scan.manifest.datumBytesAvailableForAll,
      datumHashComparisonsVerified: scan.manifest.datumHashComparisonsVerified,
      datumHashComparisonRequiredCount: scan.manifest.datumHashComparisonRequiredCount,
      datumHashMismatchCount: scan.manifest.datumHashMismatchCount,
      inlineDatumWithoutHashCount: scan.manifest.inlineDatumWithoutHashCount,
    transactionSubmissionAttempted: false,
  }, null, 2))

  if (!ledger.qualification.ticketLedgerInternallyReconciled) {
    process.exitCode = 2
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error))
  process.exitCode = 1
})
