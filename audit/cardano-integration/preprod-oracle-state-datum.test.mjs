import assert from 'node:assert/strict'
import test from 'node:test'
import { Constr, Data } from '@lucid-evolution/lucid'
import { decodeOracleStateDatum } from './preprod-oracle-state-datum.mjs'

const publisher = '69fe256b67d8f11822a34b250ab8ba271bdedb513daf99e618b6bc89'
const otherPublisher = '79fe256b67d8f11822a34b250ab8ba271bdedb513daf99e618b6bc89'
const expected = { expectedPublisherPkh: publisher }

function encode({
  index = 0,
  policy = '',
  assetName = '',
  price = 100n,
  timestamp = 1_798_000_000_000n,
  signer = publisher,
  fieldCount = 5,
} = {}) {
  const fields = [policy, assetName, price, timestamp, signer].slice(0, fieldCount)
  return Data.to(new Constr(index, fields))
}

test('decodes the timestamp from the existing Oracle State datum without replacing it with wall-clock time', () => {
  const timestamp = 1_798_000_000_000n
  const decoded = decodeOracleStateDatum(encode({ timestamp }), expected)

  assert.equal(decoded.assetPolicyHex, '')
  assert.equal(decoded.assetNameHex, '')
  assert.equal(decoded.priceUsdmSubunitsPerLovelace, '100')
  assert.equal(decoded.timestampMs, timestamp)
  assert.equal(decoded.publisherPkh, publisher)
})

test('rejects malformed CBOR bytes', () => {
  assert.throws(
    () => decodeOracleStateDatum('not-hex', expected),
    /datum CBOR must be non-empty even-length hex/,
  )
})

test('rejects a constructor other than Oracle State constructor 0', () => {
  assert.throws(
    () => decodeOracleStateDatum(encode({ index: 1 }), expected),
    /constructor 0 with exactly five fields/,
  )
})

test('rejects a malformed field count', () => {
  assert.throws(
    () => decodeOracleStateDatum(encode({ fieldCount: 4 }), expected),
    /constructor 0 with exactly five fields/,
  )
})

test('rejects negative timestamps rather than presenting them as usable freshness data', () => {
  assert.throws(
    () => decodeOracleStateDatum(encode({ timestamp: -1n }), expected),
    /timestampMs must be a non-negative integer/,
  )
})

test('rejects unexpected price, asset identity, and publisher', () => {
  assert.throws(
    () => decodeOracleStateDatum(encode({ price: 101n }), expected),
    /price does not match the configured price/,
  )
  assert.throws(
    () => decodeOracleStateDatum(encode({ policy: 'aa'.repeat(28) }), expected),
    /asset identity does not match the configured asset/,
  )
  assert.throws(
    () => decodeOracleStateDatum(encode({ signer: otherPublisher }), expected),
    /publisher does not match the authenticated deployment wallet/,
  )
})
