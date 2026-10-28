import { Data } from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'

export const ORCFAX_PREPROD = Object.freeze({
  fspScriptHash: 'f4c6dcd7cf4ad371db15e2883811d489c4bd82c55a0d16ea73688e2e',
  documentedFsScriptHash: 'fa0f8722df2372ccbb3649a23e3c541ad7e4f8218b3500d0c0b505f7',
  constitutionScriptHash: 'cc4f77eae0f135b86b734e18ea20901da54b0a3bb19144fae743c54d',
  fspTokenNameHex: '000de140',
  expectedFeedPrefixes: Object.freeze({
    adaUsd: 'CER/ADA-USD/',
    adaUsdm: 'CER/ADA-USDM/',
  }),
  maximumAgeMs: 3_600_000n,
  deploymentsReference: 'https://docs.orcfax.io/deployments',
  consumerReference: 'https://docs.orcfax.io/consume',
})

function constrIndex(value) {
  if (!value || typeof value !== 'object') return null
  const raw = value.index ?? value.constr
  return Number.isInteger(raw) ? raw : null
}

function fieldsOf(value, label, expectedIndex, expectedLength) {
  if (
    constrIndex(value) !== expectedIndex ||
    !Array.isArray(value.fields) ||
    value.fields.length !== expectedLength
  ) {
    throw new Error(label + ' has an unexpected constructor or field count')
  }
  return value.fields
}

function bytesHex(value, label) {
  if (typeof value === 'string' && value.length % 2 === 0 && /^[0-9a-fA-F]*$/.test(value)) {
    return value.toLowerCase()
  }
  if (value instanceof Uint8Array) return Buffer.from(value).toString('hex')
  if (value && typeof value === 'object' && typeof value.bytes === 'string') {
    const raw = value.bytes
    if (raw.length % 2 === 0 && /^[0-9a-fA-F]*$/.test(raw)) return raw.toLowerCase()
  }
  throw new Error(label + ' must be a byte string')
}

function asciiFromHex(hex, label) {
  const bytes = Buffer.from(hex, 'hex')
  const text = bytes.toString('utf8')
  if (!bytes.equals(Buffer.from(text, 'utf8')) || !/^[\x20-\x7e]+$/.test(text)) {
    throw new Error(label + ' must be printable ASCII')
  }
  return text
}

function integer(value, label) {
  try {
    const raw = value && typeof value === 'object' && 'int' in value ? value.int : value
    if (typeof raw === 'bigint') return raw
    if (typeof raw === 'number' && Number.isSafeInteger(raw)) return BigInt(raw)
    if (typeof raw === 'string' && /^-?\d+$/.test(raw)) return BigInt(raw)
  } catch {
    // Normalize all malformed integer encodings to the single error below.
  }
  throw new Error(label + ' must be an integer')
}

export function decodeFspCurrentFsHash(datumCborHex) {
  if (
    typeof datumCborHex !== 'string' ||
    datumCborHex.length === 0 ||
    datumCborHex.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(datumCborHex)
  ) {
    throw new Error('FSP datum must be non-empty even-length CBOR hex')
  }

  let decoded
  try {
    decoded = Data.from(datumCborHex)
  } catch (error) {
    throw new Error('FSP datum CBOR decode failed: ' + (error instanceof Error ? error.message : String(error)))
  }

  const fsHashHex = bytesHex(decoded, 'FSP datum FS script hash')
  if (!/^[0-9a-f]{56}$/.test(fsHashHex)) {
    throw new Error('FSP datum must point to one 28-byte FS script hash')
  }
  return fsHashHex
}

export function hasExactAssetQuantity(assetList, unit, quantity = 1n) {
  if (!Array.isArray(assetList) || typeof unit !== 'string' || !/^[0-9a-fA-F]{56,}$/.test(unit)) {
    return false
  }
  const policy = unit.slice(0, 56).toLowerCase()
  const name = unit.slice(56).toLowerCase()
  const matches = assetList.filter(asset =>
    String(asset?.policy_id ?? '').toLowerCase() === policy &&
    String(asset?.asset_name ?? '').toLowerCase() === name,
  )
  if (matches.length !== 1) return false
  try {
    return BigInt(matches[0].quantity) === quantity
  } catch {
    return false
  }
}

export function exactOutRef(utxo) {
  if (
    !utxo ||
    typeof utxo.tx_hash !== 'string' ||
    !/^[0-9a-fA-F]{64}$/.test(utxo.tx_hash) ||
    !Number.isInteger(Number(utxo.tx_index)) ||
    Number(utxo.tx_index) < 0
  ) {
    throw new Error('Koios UTxO lacks a valid exact tx_hash#tx_index')
  }
  return utxo.tx_hash.toLowerCase() + '#' + Number(utxo.tx_index)
}

/**
 * Decode the documented Orcfax v1 CER datum structure:
 * Constr 0 [Statement, Context]
 * Statement = Constr 0 [feed_id bytes, created_at POSIX milliseconds, Rational]
 * Rational = Constr 0 [num, denom]
 *
 * This classifies ledger-observed candidates only. It does not establish the
 * feed publisher's external truth, Moneta token identity, or settlement approval.
 */
export function inspectOrcfaxCerDatum(
  datumCborHex,
  { expectedFeedPrefix, chainTipTimeMs, maximumAgeMs = ORCFAX_PREPROD.maximumAgeMs } = {},
) {
  if (typeof expectedFeedPrefix !== 'string' || !/^CER\/[\x20-\x7e]+\/$/.test(expectedFeedPrefix)) {
    throw new Error('Expected feed prefix must be a CER feed path with its trailing slash')
  }
  if (typeof chainTipTimeMs !== 'bigint' || chainTipTimeMs <= 0n) {
    throw new Error('Chain-tip time must be a positive bigint in POSIX milliseconds')
  }
  if (typeof maximumAgeMs !== 'bigint' || maximumAgeMs <= 0n) {
    throw new Error('Maximum quote age must be a positive bigint')
  }
  if (
    typeof datumCborHex !== 'string' ||
    datumCborHex.length === 0 ||
    datumCborHex.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(datumCborHex)
  ) {
    throw new Error('Orcfax CER datum must be non-empty even-length CBOR hex')
  }

  let decoded
  try {
    decoded = Data.from(datumCborHex)
  } catch (error) {
    throw new Error('Orcfax CER datum CBOR decode failed: ' + (error instanceof Error ? error.message : String(error)))
  }

  const [statement] = fieldsOf(decoded, 'Orcfax CER datum', 0, 2)
  const [feedIdRaw, createdAtRaw, body] = fieldsOf(statement, 'Orcfax CER statement', 0, 3)
  const feedIdHex = bytesHex(feedIdRaw, 'Orcfax feed_id')
  const feedId = asciiFromHex(feedIdHex, 'Orcfax feed_id')
  const createdAtRawMs = integer(createdAtRaw, 'Orcfax created_at')

  // Current official v1 CER examples encode POSIX milliseconds. Do not infer
  // seconds from magnitude or normalize a seconds-shaped value into freshness.
  if (createdAtRawMs < 1_000_000_000_000n || createdAtRawMs >= 100_000_000_000_000n) {
    throw new Error('Orcfax created_at is not a supported POSIX-milliseconds timestamp')
  }

  const [numeratorRaw, denominatorRaw] = fieldsOf(body, 'Orcfax CER rational body', 0, 2)
  const numerator = integer(numeratorRaw, 'Orcfax rational numerator')
  const denominator = integer(denominatorRaw, 'Orcfax rational denominator')
  if (numerator <= 0n) throw new Error('Orcfax rational numerator must be positive')
  if (denominator <= 0n) throw new Error('Orcfax rational denominator must be positive')

  const ageMs = chainTipTimeMs - createdAtRawMs
  const feedIdMatches = feedId.startsWith(expectedFeedPrefix)
  const timestampNotFuture = ageMs >= 0n
  const fresh = timestampNotFuture && ageMs <= maximumAgeMs
  const blockers = []
  if (!feedIdMatches) blockers.push('EXPECTED_FEED_ID_PREFIX_NOT_MATCHED')
  if (!timestampNotFuture) blockers.push('FUTURE_TIMESTAMP')
  else if (!fresh) blockers.push('STALE_TIMESTAMP')

  return {
    status: blockers.length === 0 ? 'FRESH_CANDIDATE_NOT_QUALIFIED' : 'OBSERVED_NOT_QUALIFIED',
    datumCborSha256: createHash('sha256').update(Buffer.from(datumCborHex, 'hex')).digest('hex'),
    feedId,
    feedIdHex,
    expectedFeedPrefix,
    feedIdMatches,
    createdAtMs: createdAtRawMs.toString(),
    chainTipTimeMs: chainTipTimeMs.toString(),
    ageMs: ageMs.toString(),
    maximumAgeMs: maximumAgeMs.toString(),
    timestampNotFuture,
    freshWithinMaximumAge: fresh,
    rational: {
      numerator: numerator.toString(),
      denominator: denominator.toString(),
      exactText: numerator.toString() + '/' + denominator.toString(),
      positive: true,
    },
    freshCandidate: blockers.length === 0,
    blockers,
  }
}

function gcd(left, right) {
  let a = left < 0n ? -left : left
  let b = right < 0n ? -right : right
  while (b !== 0n) {
    const next = a % b
    a = b
    b = next
  }
  return a
}

/**
 * Exact candidate cross-rate only. Requires exactly one structurally valid,
 * fresh statement for each prefix. The caller must still independently qualify
 * the feeds and the precise base/quote token semantics before using it.
 */
export function deriveUsdUsdmCrossRate(adaUsdCandidate, adaUsdmCandidate) {
  if (!adaUsdCandidate?.freshCandidate || !adaUsdmCandidate?.freshCandidate) {
    throw new Error('Both ADA-USD and ADA-USDM observations must be fresh candidates')
  }
  if (
    !String(adaUsdCandidate.feedId ?? '').startsWith(ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd) ||
    !String(adaUsdmCandidate.feedId ?? '').startsWith(ORCFAX_PREPROD.expectedFeedPrefixes.adaUsdm)
  ) {
    throw new Error('Cross-rate requires exact ADA-USD and ADA-USDM feed prefixes')
  }

  const usdNum = BigInt(adaUsdCandidate.rational.numerator)
  const usdDen = BigInt(adaUsdCandidate.rational.denominator)
  const usdmNum = BigInt(adaUsdmCandidate.rational.numerator)
  const usdmDen = BigInt(adaUsdmCandidate.rational.denominator)
  // (USDM per ADA) / (USD per ADA) = USDM per USD.
  let numerator = usdmNum * usdDen
  let denominator = usdmDen * usdNum
  const divisor = gcd(numerator, denominator)
  numerator /= divisor
  denominator /= divisor

  return {
    status: 'CANDIDATE_ONLY_NOT_QUALIFIED',
    direction: 'USDM per USD',
    numerator: numerator.toString(),
    denominator: denominator.toString(),
    exactText: numerator.toString() + '/' + denominator.toString(),
    derivation: '(ADA-USDM num / ADA-USDM denom) / (ADA-USD num / ADA-USD denom)',
    floatingPointUsed: false,
    authorizedForSettlement: false,
    externalSourceTruthVerified: false,
    blockers: [
      'FEED_VERSION_AND_EXTERNAL_PROVENANCE_REQUIRE_INDEPENDENT_REVIEW',
      'FEED_LABELS_DO_NOT_PROVE_EXACT_CARDANO_USDM_ASSET_IDENTITY',
      'CROSS_RATE_NOT_BOUND_TO_AN_ISSUE_TRANSACTION_OR_VALIDITY_INTERVAL',
      'GOVERNED_SOURCE_AND_CONSUMER_QUALIFICATION_NOT_APPROVED',
    ],
  }
}
