/**
 * Read-only projection from one C1 acquired-point raw observation to the
 * existing PRE-RICH PrizeDatum item ledger. It is not a PA1-PA7 certificate.
 */
import { createHash } from 'node:crypto'
import { Data } from '@lucid-evolution/lucid'
import {
  validateC1CandidateIdentityEnvelope,
  validatePreprodNetworkGenesis,
  sha256CanonicalJson,
  C1_COMPONENT_IDS,
} from './preprod-c1-acquired-point-observer.mjs'
import { decodeC1ComponentCardinality } from './preprod-c1-cardinality-decoder.mjs'
import { buildPreRichProtectedCapitalItemLedger } from '../../PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts'

const SCHEMA = 'IMMORTAL-PREPROD-C1-ACQUIRED-POINT-RAW-OBSERVATION-v0.1'
const SINGLETONS = ['b1Pool', 'v3Carrier', 'b2Control']

const fail = code => { throw new Error('C1_ITEM_LEDGER_' + code) }
const hex = (value, size, field) => {
  if (typeof value !== 'string' || !(new RegExp('^[0-9a-fA-F]{' + size * 2 + '}$')).test(value)) fail(field + '_INVALID')
  return value.toLowerCase()
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

function reference(row, field) {
  const tx = row?.outputReference?.transaction?.id ?? row?.transaction?.id ?? row?.txHash
  const ix = row?.outputReference?.index ?? row?.index
  if (typeof tx !== 'string' || !/^[0-9a-f]{64}$/i.test(tx) || !Number.isSafeInteger(ix) || ix < 0) {
    fail(field + '_UTXO_REFERENCE_INVALID')
  }
  return tx.toLowerCase() + '#' + String(ix)
}

function rowsFor(observation, component) {
  const found = observation.observations?.[component.componentId]
  if (!found || found.address !== component.address ||
      found.query?.method !== 'queryLedgerState/utxo' ||
      found.query?.params?.addresses?.length !== 1 ||
      found.query.params.addresses[0] !== component.address ||
      !Array.isArray(found.rawOgmiosUtxoResult) ||
      found.rawUtxoCount !== found.rawOgmiosUtxoResult.length) {
    fail('RAW_COMPONENT_OBSERVATION_INVALID:' + component.componentId)
  }
  const refs = new Set()
  for (const row of found.rawOgmiosUtxoResult) {
    const ref = reference(row, component.componentId)
    if (refs.has(ref)) fail('DUPLICATE_UTXO_REFERENCE:' + component.componentId + ':' + ref)
    refs.add(ref)
  }
  return found.rawOgmiosUtxoResult
}

function parseCbor(raw, field) {
  if (typeof raw !== 'string' || !/^(?:[0-9a-fA-F]{2})+$/.test(raw)) fail(field + '_DATUM_CBOR_MISSING_OR_INVALID')
  try { return { value: Data.from(raw), bytes: raw.toLowerCase() } }
  catch (error) { fail(field + '_DATUM_DECODE_FAILED:' + String(error?.message ?? error)) }
}

function fields(data, field, count) {
  if (!data || data.index !== 0 || !Array.isArray(data.fields) || data.fields.length !== count) {
    fail(field + '_DATUM_SHAPE_INVALID')
  }
  return data.fields
}

function constr(value, field, allowed) {
  const index = Number(value?.index)
  if (!Number.isInteger(index) || !allowed.includes(index) || !Array.isArray(value?.fields)) {
    fail(field + '_CONSTRUCTOR_INVALID')
  }
  return index
}

function bytesHex(value, field) {
  let raw
  if (typeof value === 'string') raw = value
  else if (value instanceof Uint8Array || Buffer.isBuffer(value)) raw = Buffer.from(value).toString('hex')
  else if (value && typeof value.bytes === 'string') raw = value.bytes
  else fail(field + '_BYTES_INVALID')
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(raw)) fail(field + '_BYTES_INVALID')
  return raw.toLowerCase()
}

function integer(value, field) {
  let result
  try {
    result = typeof value === 'bigint' ? value :
      typeof value === 'number' && Number.isSafeInteger(value) ? BigInt(value) :
      BigInt(value?.int ?? value)
  } catch { fail(field + '_INTEGER_INVALID') }
  if (result < 0n) fail(field + '_NEGATIVE')
  return result
}

async function datumEvidence(row, field) {
  const decoded = parseCbor(row?.datum, field)
  const datumHash = row?.datumHash ?? row?.datumhash ?? null
  let datumHashStatus = 'DATUM_BYTES_PRESENT_HASH_FIELD_ABSENT'
  if (datumHash !== null && datumHash !== undefined) {
    const expected = hex(datumHash, 32, field + '_CARDANO_DATUM_HASH')
    const { blake2b } = await import('@noble/hashes/blake2b.js')
    const actual = Buffer.from(blake2b(Buffer.from(decoded.bytes, 'hex'), { dkLen: 32 })).toString('hex')
    if (actual !== expected) fail(field + '_CARDANO_DATUM_HASH_MISMATCH')
    datumHashStatus = 'BLAKE2B_256_MATCH'
  }
  return {
    data: decoded.value,
    digest: sha256(Buffer.from(decoded.bytes, 'hex')),
    datumHash: datumHash === null || datumHash === undefined ? null : String(datumHash).toLowerCase(),
    datumHashStatus,
  }
}

async function prizeRecord(row, expectedPoolHash) {
  const ref = reference(row, 'PRIZEDATUM')
  const evidence = await datumEvidence(row, 'PRIZEDATUM')
  const f = fields(evidence.data, 'PRIZEDATUM', 23)
  const ticketPolicyId = bytesHex(f[0], 'TICKET_POLICY')
  const ticketAssetNameHex = bytesHex(f[1], 'TICKET_NAME')
  const priceUsdmSubunits = integer(f[3], 'TICKET_PRICE')
  const prizeAmountUsdmSubunits = integer(f[7], 'TICKET_PAYOUT')
  const prizeStatus = constr(f[10], 'PRIZE_STATUS', [0, 1, 2])
  const beaconStatus = constr(f[14], 'BEACON_STATUS', [0, 1])
  const prizePoolHash = bytesHex(f[18], 'PRIZE_POOL_HASH')
  const issuedAt = integer(f[19], 'ISSUED_AT')
  const expiresAt = integer(f[20], 'EXPIRES_AT')
  if (!/^[0-9a-f]{56}$/.test(ticketPolicyId) || ticketAssetNameHex.length > 64 ||
      !/^[0-9a-f]{56}$/.test(prizePoolHash)) fail('PRIZEDATUM_IDENTITY_INVALID')
  if (prizePoolHash !== expectedPoolHash) fail('PRIZEDATUM_POOL_HASH_MISMATCH')
  return {
    record: {
      utxoReference: ref,
      datumDigest: evidence.digest,
      ticketPolicyId,
      ticketAssetNameHex,
      prizePoolHash,
      priceUsdmSubunits,
      prizeAmountUsdmSubunits,
      prizeStatus: ['Pending', 'Revealed', 'Claimed'][prizeStatus],
      beaconStatus: ['BeaconPending', 'BeaconReady'][beaconStatus],
      issuedAt,
      expiresAt,
    },
    evidence: {
      utxoReference: ref,
      datumDigestSha256: evidence.digest,
      cardanoDatumHash: evidence.datumHash,
      datumHashStatus: evidence.datumHashStatus,
    },
  }
}

async function poolDatum(row, expectedPrizeHash, snapshotReference) {
  const ref = reference(row, 'B1_POOL')
  const evidence = await datumEvidence(row, 'B1_POOL')
  const f = fields(evidence.data, 'B1_POOL', 8)
  const prizeValidatorHash = bytesHex(f[7], 'B1_PRIZE_HASH')
  if (prizeValidatorHash !== expectedPrizeHash) fail('B1_PRIZE_HASH_MISMATCH')
  return {
    utxoReference: ref,
    datumDigest: evidence.digest,
    snapshotReference,
    prizeValidatorHash,
    totalLiquidityUsdmSubunits: integer(f[0], 'B1_TOTAL_LIQUIDITY'),
    pendingLiabilitiesUsdmSubunits: integer(f[1], 'B1_PENDING_LIABILITIES'),
    unresolvedReserveUsdmSubunits: integer(f[2], 'B1_UNRESOLVED_RESERVE'),
    unresolvedTicketCount: integer(f[3], 'B1_UNRESOLVED_COUNT'),
    lockedJackpotUsdmSubunits: integer(f[4], 'B1_LOCKED_JACKPOT'),
    jackpotThresholdUsdmSubunits: integer(f[5], 'B1_JACKPOT_THRESHOLD'),
  }
}

function jsonSafe(value) {
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(jsonSafe)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonSafe(item)]))
  }
  return value
}

/**
 * observedAtMs is metadata from the local clock, not the ledger snapshot identity.
 */
export async function buildC1ProtectedCapitalItemLedger({
  observation,
  identityEnvelope,
  observedAtMs = BigInt(Date.now()),
} = {}) {
  if (!observation || observation.schema !== SCHEMA ||
      observation.network !== 'cardano-preprod' ||
      observation.queryConsistency !== 'ONE_ACQUIRED_OGMIOS_LEDGER_STATE') {
    fail('RAW_OBSERVATION_SCHEMA_OR_NETWORK_INVALID')
  }
  const point = observation.acquiredLedgerState
  if (!point || !Number.isSafeInteger(point.slot) || point.slot < 0 ||
      typeof point.id !== 'string' || !/^[0-9a-f]{64}$/i.test(point.id)) fail('ACQUIRED_POINT_INVALID')
  const genesisQuery = { method: 'queryNetwork/genesisConfiguration', params: { era: 'shelley' } }
  if (JSON.stringify(observation.networkGenesisQuery) !== JSON.stringify(genesisQuery) ||
      observation.networkGenesisQueryCanonicalJsonSha256 !== sha256CanonicalJson(genesisQuery) ||
      observation.networkGenesisResultCanonicalJsonSha256 !== sha256CanonicalJson(observation.networkGenesisResult)) {
    fail('NETWORK_GENESIS_EVIDENCE_DIGEST_MISMATCH')
  }
  const networkIdentity = validatePreprodNetworkGenesis(observation.networkGenesisResult)
  if (JSON.stringify(networkIdentity) !== JSON.stringify(observation.networkIdentity)) fail('PREPROD_NETWORK_IDENTITY_INVALID')
  if (JSON.stringify(observation.componentOrder) !== JSON.stringify(C1_COMPONENT_IDS)) fail('COMPONENT_ORDER_MISMATCH')
  if (BigInt(observedAtMs) < 0n) fail('OBSERVED_AT_INVALID')

  const identity = validateC1CandidateIdentityEnvelope(identityEnvelope)
  const envelopeDigest = sha256CanonicalJson(identityEnvelope)
  if (observation.identityEnvelopeCanonicalJsonSha256 !== envelopeDigest) fail('IDENTITY_ENVELOPE_DIGEST_MISMATCH')
  const components = Object.fromEntries(identity.components.map(c => [c.componentId, c]))
  for (const id of C1_COMPONENT_IDS) rowsFor(observation, components[id])

  const cardinality = {}
  for (const id of SINGLETONS) {
    const result = decodeC1ComponentCardinality({
      component: components[id],
      rawUtxos: rowsFor(observation, components[id]),
    })
    if (result.cardinalityQualified !== true) fail('SINGLETON_CARDINALITY_FAILED:' + id)
    cardinality[id] = result
  }
  cardinality.counter = decodeC1ComponentCardinality({
    component: components.counter,
    rawUtxos: rowsFor(observation, components.counter),
  })
  if (cardinality.counter.cardinalityQualified !== true) fail('COUNTER_CARDINALITY_FAILED')

  const prizeComponent = components.prizeValidator
  const ticketPolicyId = hex(prizeComponent.ticketPolicyId, 28, 'TICKET_POLICY_ID')
  const prizeHash = hex(prizeComponent.paymentCredentialHash, 28, 'PRIZE_VALIDATOR_HASH')
  const poolComponent = components.b1Pool
  const poolHash = hex(poolComponent.paymentCredentialHash, 28, 'B1_POOL_SCRIPT_HASH')
  const poolRows = rowsFor(observation, poolComponent)
  const poolRef = cardinality.b1Pool.singletonTokenHolders[0].reference
  const poolRow = poolRows.find(row => reference(row, 'B1_POOL') === poolRef)
  if (!poolRow) fail('B1_SINGLETON_UTXO_NOT_FOUND')

  const snapshotReference = 'cardano:preprod:' + point.slot + ':' + point.id.toLowerCase()
  const pool = await poolDatum(poolRow, prizeHash, snapshotReference)
  const prizeRows = rowsFor(observation, prizeComponent)
  cardinality.prizeValidator = decodeC1ComponentCardinality({
    component: prizeComponent,
    rawUtxos: prizeRows,
  })
  if (cardinality.prizeValidator.cardinalityStatus !== 'NOT_APPLICABLE_POPULATION_CENSUS') {
    fail('PRIZE_VALIDATOR_POPULATION_CENSUS_SHAPE_INVALID')
  }
  const records = []
  const prizeDatumEvidence = []
  const unclassifiedUtxos = []
  for (const row of prizeRows) {
    const ref = reference(row, 'PRIZEDATUM')
    try {
      const parsed = await prizeRecord(row, poolHash)
      records.push(parsed.record)
      prizeDatumEvidence.push(parsed.evidence)
    } catch (error) {
      unclassifiedUtxos.push({
        utxoReference: ref,
        reason: error instanceof Error ? error.message : String(error),
        datumPresent: typeof row?.datum === 'string',
        datumHash: row?.datumHash ?? row?.datumhash ?? null,
      })
    }
  }

  const census = {
    network: 'Preprod',
    observedSlot: BigInt(point.slot),
    observedAt: BigInt(observedAtMs),
    providerId: 'Demeter/Ogmios-v7',
    snapshotReference,
    sourceReference: snapshotReference,
    sourceManifestDigest: envelopeDigest,
    prizeValidatorAddress: prizeComponent.address,
    prizeValidatorHash: prizeHash,
    b1PrizePoolScriptHash: poolHash,
    ticketPolicyId,
    paginationComplete: true,
    pageCount: 1n,
    sourceUtxoCount: BigInt(prizeRows.length),
    decodedPrizeDatumCount: BigInt(records.length),
    unclassifiedUtxoCount: BigInt(unclassifiedUtxos.length),
    pool: {
      utxoReference: pool.utxoReference,
      datumDigest: pool.datumDigest,
      snapshotReference,
      prizeValidatorHash: pool.prizeValidatorHash,
      pendingLiabilitiesUsdmSubunits: pool.pendingLiabilitiesUsdmSubunits,
      unresolvedReserveUsdmSubunits: pool.unresolvedReserveUsdmSubunits,
      unresolvedTicketCount: pool.unresolvedTicketCount,
      lockedJackpotUsdmSubunits: pool.lockedJackpotUsdmSubunits,
      jackpotThresholdUsdmSubunits: pool.jackpotThresholdUsdmSubunits,
    },
    records,
  }
  const itemLedger = buildPreRichProtectedCapitalItemLedger(census)

  return {
    schema: 'IMMORTAL-PREPROD-C1-TICKET-ITEM-LEDGER-PROJECTION-v0.1',
    network: 'cardano-preprod',
    acquiredLedgerState: { slot: point.slot, id: point.id.toLowerCase() },
    snapshotReference,
    deploymentId: identity.deploymentId,
    sourceCommit: identity.sourceCommit,
    identityEnvelopeCanonicalJsonSha256: envelopeDigest,
    cardinality,
    pool: {
      utxoReference: pool.utxoReference,
      datumDigestSha256: pool.datumDigest,
      totalLiquidityUsdmSubunits: pool.totalLiquidityUsdmSubunits.toString(),
      prizeValidatorHash: pool.prizeValidatorHash,
    },
    prizeValidator: {
      address: prizeComponent.address,
      sourceUtxoCount: prizeRows.length,
      decodedPrizeDatumCount: records.length,
      unclassifiedUtxoCount: unclassifiedUtxos.length,
      prizeDatumEvidence,
      unclassifiedUtxos,
    },
    itemLedger: jsonSafe(itemLedger),
    qualification: {
      acquiredPointInputStructurallyBound: true,
      cardinalityChecksPassed: true,
      prizeDatumDecodingComplete: unclassifiedUtxos.length === 0,
      ticketLedgerInternallyReconciled: itemLedger.qualification.ticketLedgerInternallyReconciled,
      l1L3ReconciledToB1Aggregates: itemLedger.qualification.ticketLedgerInternallyReconciled,
      deploymentAuthorityVerified: false,
      providerAttestationVerified: false,
      sourceCompletenessAuthorityVerified: false,
      v3AggregateReconciliationPerformed: false,
      historicalClaimExpireReplayPerformed: false,
      fullProtectedCapitalQualified: false,
      r7L6EmptinessProven: false,
      c1Qualified: false,
    },
    nonAuthorityNotes: [
      'The identity envelope is structurally checked and digest-bound, not GOV-30 authenticated.',
      'The five-component input is an acquired-point observation, but provider and address-population completeness are not independently attested.',
      'The item ledger covers the current PrizeValidator ticket population only; it does not enumerate L2, SafetyCapital, ReserveProtection, MandatoryFutureCosts, other obligation origins, or consumed Claim/Expire history.',
      'No V3 aggregate comparison is performed by this projection.',
      'ObservedAt is local wall-clock metadata; acquired slot/hash are the snapshot identity.',
    ],
  }
}
