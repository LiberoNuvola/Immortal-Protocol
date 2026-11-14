import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeC1ComponentCardinality } from './preprod-c1-cardinality-decoder.mjs'
const address = 'addr_test_candidate'
const policyId = '9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e'
const tokenNameHex = '504f4f4c2d444952454354'
const tx = n => String(n).repeat(64)
function utxo(index, value = {}) {
  return { transaction: { id: tx(index + 1) }, index, address, value, datum: null }
}
function singleton(componentId = 'b1Pool') {
  return { componentId, address, singleton: { policyId, tokenNameHex } }
}
test('decodes Ogmios v7 policy/token map and exact singleton quantity one', () => {
  const result = decodeC1ComponentCardinality({
    component: singleton(),
    rawUtxos: [utxo(0, { ada: { lovelace: 5000000 }, [policyId]: { [tokenNameHex]: 1 } })],
  })
  assert.equal(result.cardinalityStatus, 'OBSERVED_EXACTLY_ONE_SINGLETON_TOKEN')
  assert.equal(result.singletonTokenHolderCount, 1)
  assert.equal(result.singletonTokenHolders[0].quantity, '1')
})
test('rejects missing singleton token', () => {
  const result = decodeC1ComponentCardinality({ component: singleton(), rawUtxos: [utxo(0)] })
  assert.equal(result.cardinalityQualified, false)
  assert.equal(result.singletonTokenHolderCount, 0)
})
test('rejects singleton token quantity other than one', () => {
  const result = decodeC1ComponentCardinality({
    component: singleton(),
    rawUtxos: [utxo(0, { [policyId]: { [tokenNameHex]: 2 } })],
  })
  assert.equal(result.cardinalityStatus, 'FAIL_SINGLETON_TOKEN_CARDINALITY_OR_QUANTITY')
})
test('rejects the target singleton token spread across multiple UTxOs', () => {
  const result = decodeC1ComponentCardinality({
    component: singleton(),
    rawUtxos: [utxo(0, { [policyId]: { [tokenNameHex]: 1 } }), utxo(1, { [policyId]: { [tokenNameHex]: 1 } })],
  })
  assert.equal(result.singletonTokenHolderCount, 2)
  assert.equal(result.cardinalityQualified, false)
})
test('requires exactly one UTxO for Counter without inventing a singleton token', () => {
  const result = decodeC1ComponentCardinality({ component: { componentId: 'counter', address }, rawUtxos: [utxo(0)] })
  assert.equal(result.cardinalityStatus, 'OBSERVED_EXACTLY_ONE_UTXO')
  assert.equal(result.cardinalityQualified, true)
})
test('keeps PrizeValidator as a full population census, not a singleton', () => {
  const result = decodeC1ComponentCardinality({
    component: { componentId: 'prizeValidator', address }, rawUtxos: [utxo(0), utxo(1)],
  })
  assert.equal(result.addressUtxoCount, 2)
  assert.equal(result.cardinalityStatus, 'NOT_APPLICABLE_POPULATION_CENSUS')
  assert.equal(result.populationClassificationStatus, 'NOT_CLASSIFIED_PRIZEDATUM_DECODER_REQUIRED')
  assert.equal(result.cardinalityQualified, false)
})
test('rejects UTxOs whose address differs from the candidate address', () => {
  assert.throws(() => decodeC1ComponentCardinality({
    component: singleton(), rawUtxos: [{ ...utxo(0), address: 'addr_other' }],
  }), /ADDRESS_MISMATCH/)
})
test('rejects unsafe or malformed token quantities rather than coercing them', () => {
  assert.throws(() => decodeC1ComponentCardinality({
    component: singleton(), rawUtxos: [utxo(0, { [policyId]: { [tokenNameHex]: '01x' } })],
  }), /ASSET_QUANTITY_INVALID/)
})
