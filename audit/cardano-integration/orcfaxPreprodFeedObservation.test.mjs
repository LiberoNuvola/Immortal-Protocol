import assert from 'node:assert/strict'
import test from 'node:test'
import { Constr, Data } from '@lucid-evolution/lucid'
import {
  ORCFAX_PREPROD,
  decodeFspCurrentFsHash,
  deriveUsdUsdmCrossRate,
  hasExactAssetQuantity,
  inspectOrcfaxCerDatum,
} from './orcfaxPreprodFeedObservation.mjs'

const toHex = value => Buffer.from(value, 'utf8').toString('hex')
const tipMs = 1_798_000_000_000n

function datum({
  feedId = 'CER/ADA-USD/3',
  createdAtMs = tipMs - 15_000n,
  numerator = 1633n,
  denominator = 10_000n,
  outerIndex = 0,
  statementIndex = 0,
  rationalIndex = 0,
  fieldCount = 3,
} = {}) {
  const rationalFields = [numerator, denominator]
  const rational = new Constr(rationalIndex, rationalFields)
  const statementFields = [toHex(feedId), createdAtMs, rational].slice(0, fieldCount)
  const statement = new Constr(statementIndex, statementFields)
  return Data.to(new Constr(outerIndex, [statement, new Constr(0, [])]))
}

test('decodes an exact fresh CER/ADA-USD rational without floating point', () => {
  const parsed = inspectOrcfaxCerDatum(datum(), {
    expectedFeedPrefix: ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd,
    chainTipTimeMs: tipMs,
  })
  assert.equal(parsed.feedId, 'CER/ADA-USD/3')
  assert.equal(parsed.feedIdMatches, true)
  assert.equal(parsed.rational.numerator, '1633')
  assert.equal(parsed.rational.denominator, '10000')
  assert.equal(parsed.rational.exactText, '1633/10000')
  assert.equal(parsed.freshWithinMaximumAge, true)
  assert.equal(parsed.freshCandidate, true)
  assert.deepEqual(parsed.blockers, [])
})

test('does not confuse ADA-USD with ADA-USDM because the expected prefix includes the trailing slash', () => {
  const parsed = inspectOrcfaxCerDatum(datum({ feedId: 'CER/ADA-USDM/3' }), {
    expectedFeedPrefix: ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd,
    chainTipTimeMs: tipMs,
  })
  assert.equal(parsed.feedIdMatches, false)
  assert.equal(parsed.freshCandidate, false)
  assert.ok(parsed.blockers.includes('EXPECTED_FEED_ID_PREFIX_NOT_MATCHED'))
})

test('marks stale and future statements as non-candidates using Cardano chain-tip time', () => {
  const stale = inspectOrcfaxCerDatum(datum({ createdAtMs: tipMs - 3_600_001n }), {
    expectedFeedPrefix: ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd,
    chainTipTimeMs: tipMs,
  })
  assert.equal(stale.freshWithinMaximumAge, false)
  assert.ok(stale.blockers.includes('STALE_TIMESTAMP'))

  const future = inspectOrcfaxCerDatum(datum({ createdAtMs: tipMs + 1n }), {
    expectedFeedPrefix: ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd,
    chainTipTimeMs: tipMs,
  })
  assert.equal(future.timestampNotFuture, false)
  assert.ok(future.blockers.includes('FUTURE_TIMESTAMP'))
})

test('fails closed on unsupported seconds timestamps and malformed datum shape', () => {
  assert.throws(() => inspectOrcfaxCerDatum(datum({ createdAtMs: 1_798_000_000n }), {
    expectedFeedPrefix: ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd,
    chainTipTimeMs: tipMs,
  }), /not a supported POSIX-milliseconds timestamp/)

  assert.throws(() => inspectOrcfaxCerDatum(datum({ outerIndex: 1 }), {
    expectedFeedPrefix: ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd,
    chainTipTimeMs: tipMs,
  }), /unexpected constructor or field count/)

  assert.throws(() => inspectOrcfaxCerDatum(datum({ denominator: 0n }), {
    expectedFeedPrefix: ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd,
    chainTipTimeMs: tipMs,
  }), /denominator must be positive/)
})

test('decodes the current FS hash from the FSP byte-string datum', () => {
  const fsHash = ORCFAX_PREPROD.documentedFsScriptHash
  assert.equal(decodeFspCurrentFsHash(Data.to(fsHash)), fsHash)
  assert.throws(() => decodeFspCurrentFsHash('not-hex'), /non-empty even-length CBOR hex/)
  assert.throws(() => decodeFspCurrentFsHash(Data.to('1234')), /28-byte FS script hash/)
})

test('requires exactly one policy/name asset row at the requested quantity', () => {
  const unit = 'a'.repeat(56) + '000de140'
  const row = { policy_id: 'a'.repeat(56), asset_name: '000de140', quantity: '1' }
  assert.equal(hasExactAssetQuantity([row], unit, 1n), true)
  assert.equal(hasExactAssetQuantity([{ ...row, quantity: '2' }], unit, 1n), false)
  assert.equal(hasExactAssetQuantity([row, row], unit, 1n), false)
  assert.equal(hasExactAssetQuantity([], unit, 1n), false)
})

test('derives the cross-rate as an exact reduced rational and never authorizes settlement', () => {
  const adaUsd = {
    feedId: 'CER/ADA-USD/3',
    freshCandidate: true,
    rational: { numerator: '1633', denominator: '10000' },
  }
  const adaUsdm = {
    feedId: 'CER/ADA-USDM/3',
    freshCandidate: true,
    rational: { numerator: '1628', denominator: '10000' },
  }
  const result = deriveUsdUsdmCrossRate(adaUsd, adaUsdm)
  assert.equal(result.direction, 'USDM per USD')
  assert.equal(result.numerator, '1628')
  assert.equal(result.denominator, '1633')
  assert.equal(result.exactText, '1628/1633')
  assert.equal(result.floatingPointUsed, false)
  assert.equal(result.authorizedForSettlement, false)
  assert.equal(result.status, 'CANDIDATE_ONLY_NOT_QUALIFIED')
  assert.throws(() => deriveUsdUsdmCrossRate(adaUsd, { ...adaUsdm, freshCandidate: false }), /must be fresh candidates/)
})
