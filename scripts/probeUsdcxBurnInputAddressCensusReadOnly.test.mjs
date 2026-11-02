import test from 'node:test'
import assert from 'node:assert/strict'
import {
  USDCX_POLICY,
  USDCX_NAME,
  decodeTip,
  decodeBurnEvents,
  decodeBurnTxInfoBatch,
  summarizeBurnAddressCensus,
  TX_HASHES_PER_BATCH,
  TX_INFO_BATCH_SPACING_MS,
  retryDelayMs,
} from './probeUsdcxBurnInputAddressCensusReadOnly.mjs'

const unit = { policy_id: USDCX_POLICY, asset_name: USDCX_NAME }
const addressA = 'addr1' + 'a'.repeat(45)
const addressB = 'addr1' + 'b'.repeat(45)
const txA = 'a'.repeat(64)
const txB = 'b'.repeat(64)

function burn(txHash, burnedAtomic) {
  return { txHash, burnedAtomic: String(burnedAtomic), blockTime: 100 }
}

function txInfo(txHash, burnedAtomic, inputs) {
  return {
    tx_hash: txHash,
    assets_minted: [{ ...unit, quantity: String(-BigInt(burnedAtomic)) }],
    inputs,
  }
}

function input(address, quantity) {
  return {
    payment_addr: { bech32: address, cred: '1'.repeat(56) },
    asset_list: [{ ...unit, quantity: String(quantity) }],
  }
}

test('decodes only exact USDCx negative mint events as burns', () => {
  const events = decodeBurnEvents([{
    ...unit,
    minting_txs: [
      { tx_hash: txA, quantity: '1000', block_time: 10 },
      { tx_hash: txB, quantity: '-300', block_time: 20 },
    ],
  }])
  assert.deepEqual(events, [{ txHash: txB, burnedAtomic: '300', blockTime: 20 }])
})

test('rejects duplicate and malformed asset-history events', () => {
  assert.throws(() => decodeBurnEvents([]), /NOT_UNIQUE/)
  assert.throws(() => decodeBurnEvents([{
    ...unit,
    minting_txs: [
      { tx_hash: txA, quantity: '-2', block_time: 1 },
      { tx_hash: txA, quantity: '-1', block_time: 2 },
    ],
  }]), /DUPLICATE_TX/)
  assert.throws(() => decodeBurnEvents([{
    ...unit,
    minting_txs: [{ tx_hash: 'bad', quantity: '-1', block_time: 1 }],
  }]), /EVENT_INVALID/)
})

test('validates negative minted quantity against exact USDCx input payment addresses', () => {
  const records = decodeBurnTxInfoBatch(
    [burn(txA, 300)],
    [txInfo(txA, 300, [input(addressA, 400)])],
  )
  assert.equal(records.length, 1)
  assert.equal(records[0].status, 'INPUT_PAYMENT_ADDRESSES_MAPPED')
  assert.equal(records[0].inputUsdcxAtomic, '400')
  assert.deepEqual(records[0].inputAddresses, [{
    address: addressA,
    inputUsdcxAtomic: '400',
  }])
})

test('maps multiple exact-USDCx inputs and combines quantities per address', () => {
  const records = decodeBurnTxInfoBatch(
    [burn(txA, 300)],
    [txInfo(txA, 300, [input(addressA, 100), input(addressA, 250), input(addressB, 50)])],
  )
  assert.equal(records[0].status, 'INPUT_PAYMENT_ADDRESSES_MAPPED')
  assert.equal(records[0].inputUsdcxAtomic, '400')
  assert.deepEqual(records[0].inputAddresses, [
    { address: addressA, inputUsdcxAtomic: '350' },
    { address: addressB, inputUsdcxAtomic: '50' },
  ])
})

test('does not map a burn when exact USDCx input quantity is below the burn', () => {
  const records = decodeBurnTxInfoBatch(
    [burn(txA, 300)],
    [txInfo(txA, 300, [input(addressA, 299)])],
  )
  assert.equal(records[0].status, 'USDCX_INPUT_QUANTITY_BELOW_BURN_OR_ADDRESS_ABSENT')
})

test('does not map a burn when its assets_minted record mismatches history', () => {
  const records = decodeBurnTxInfoBatch(
    [burn(txA, 300)],
    [{ ...txInfo(txA, 299, [input(addressA, 400)]) }],
  )
  assert.equal(records[0].status, 'USDCX_BURN_MINTED_AMOUNT_MISMATCH')
})

test('fails closed on malformed address or missing input data', () => {
  const malformed = txInfo(txA, 300, [{
    payment_addr: { bech32: 'addr_test1invalid' },
    asset_list: [{ ...unit, quantity: '400' }],
  }])
  assert.equal(
    decodeBurnTxInfoBatch([burn(txA, 300)], [malformed])[0].status,
    'USDCX_INPUT_PAYMENT_ADDRESS_MALFORMED',
  )
  assert.equal(
    decodeBurnTxInfoBatch([burn(txA, 300)], [{ ...txInfo(txA, 300, []), inputs: [] }])[0].status,
    'TX_INFO_INPUTS_MISSING',
  )
})

test('records missing transaction-info rows without inventing addresses', () => {
  const records = decodeBurnTxInfoBatch([burn(txA, 300), burn(txB, 100)], [
    txInfo(txA, 300, [input(addressA, 400)]),
  ])
  assert.equal(records[0].status, 'INPUT_PAYMENT_ADDRESSES_MAPPED')
  assert.equal(records[1].status, 'TX_INFO_ROW_MISSING')
  assert.deepEqual(records[1].inputAddresses, [])
})

test('rejects transaction-info rows outside the requested hash set and duplicates', () => {
  assert.throws(
    () => decodeBurnTxInfoBatch([burn(txA, 1)], [txInfo(txB, 1, [input(addressA, 1)])]),
    /HASH_SET_INVALID/,
  )
  assert.throws(
    () => decodeBurnTxInfoBatch([burn(txA, 1)], [
      txInfo(txA, 1, [input(addressA, 1)]),
      txInfo(txA, 1, [input(addressA, 1)]),
    ]),
    /HASH_SET_INVALID/,
  )
})

test('summarizes unique addresses and preserves exact burn-to-address mapping', () => {
  const records = decodeBurnTxInfoBatch(
    [burn(txA, 300), burn(txB, 100)],
    [
      txInfo(txA, 300, [input(addressA, 400)]),
      txInfo(txB, 100, [input(addressA, 100), input(addressB, 100)]),
    ],
  )
  const summary = summarizeBurnAddressCensus(records)
  assert.equal(summary.burnEventCount, 2)
  assert.equal(summary.burnTxInfoMappedCount, 2)
  assert.equal(summary.burnTxInfoUnmappedCount, 0)
  assert.equal(summary.uniqueInputPaymentAddressCount, 2)
  assert.deepEqual(summary.addresses[0].burnTxHashes, [txA, txB])
  assert.equal(summary.addresses[0].burnTxCount, 2)
})

test('decodes a valid mainnet tip and rejects a malformed tip', () => {
  assert.deepEqual(decodeTip([{ hash: txA, abs_slot: 123, block_no: 456, block_time: 789 }]), {
    hash: txA, absSlot: 123, blockNo: 456, blockTime: 789,
  })
  assert.throws(() => decodeTip([]), /TIP_SHAPE_INVALID/)
})


test('keeps transaction-info request batches within the conservative public API bound', () => {
  assert.equal(TX_HASHES_PER_BATCH, 20)
})


test('honors Retry-After seconds and HTTP-date values', () => {
  assert.equal(retryDelayMs('2', 0, 1_000), 2_000)
  assert.equal(retryDelayMs('Thu, 01 Jan 1970 00:00:05 GMT', 0, 1_000), 4_000)
})

test('uses bounded exponential fallback when Retry-After is missing', () => {
  assert.equal(retryDelayMs(null, 0, 0), 30_000)
  assert.equal(retryDelayMs('not-a-date', 1, 0), 60_000)
  assert.equal(retryDelayMs(null, 9, 0), 120_000)
})

test('spaces sequential transaction-info batches', () => {
  assert.equal(TX_INFO_BATCH_SPACING_MS, 5_200)
})
