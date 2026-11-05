import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTicketSaleReceiptJournal } from './treasury-receipt-journal.mjs'

const TX = 'a1'.repeat(32)
const INPUT_TX = 'b1'.repeat(32)
const CONSUMER_TX = 'c1'.repeat(32)
const CONSUMER_TX_2 = 'd1'.repeat(32)
const BLOCK = 'e1'.repeat(32)
const TREASURY = 'addr_test1wqcanonicaltreasury'
const TREASURY_ALT = 'addr_test1wqalternate'
const POOL = 'addr_test1wqcanonicalpool'
const TREASURY_CREDENTIAL = '11'.repeat(28)
const POOL_CREDENTIAL = '22'.repeat(28)
const TICKET_POLICY = '33'.repeat(28)
const PAYMENT_POLICY = '44'.repeat(28)
const TICKET_NAME = '505245524943480001'
const RECEIPT_INDEX = 1

function txOutput(txHash, txIndex, address, credential, value, assets = []) {
  return {
    tx_hash: txHash,
    tx_index: txIndex,
    payment_addr: { bech32: address, cred: credential },
    value: String(value),
    asset_list: assets,
    datum_hash: null,
    inline_datum: null,
  }
}

function txInput(txHash, txIndex, address, credential) {
  return {
    tx_hash: txHash,
    tx_index: txIndex,
    payment_addr: { bech32: address, cred: credential },
    value: '5000000',
    asset_list: [],
  }
}

function saleTx(overrides = {}) {
  const base = {
    tx_hash: TX,
    block_hash: BLOCK,
    block_height: 100,
    absolute_slot: 900,
    tx_timestamp: 1_700_000_000,
    tx_block_index: 2,
    valid_contract: true,
    inputs: [
      txInput(INPUT_TX, 0, POOL, POOL_CREDENTIAL),
      txInput('f1'.repeat(32), 0, 'addr_test1buyer', '55'.repeat(28)),
    ],
    outputs: [
      txOutput(TX, 0, POOL, POOL_CREDENTIAL, '5000000'),
      txOutput(TX, RECEIPT_INDEX, TREASURY, TREASURY_CREDENTIAL, '2200000', [
        { policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '1500000' },
      ]),
    ],
    assets_minted: [
      { policy_id: TICKET_POLICY, asset_name: TICKET_NAME, quantity: '1' },
    ],
  }
  return { ...base, ...overrides }
}

function addressOutput(overrides = {}) {
  return {
    address: TREASURY,
    tx_hash: TX,
    tx_index: RECEIPT_INDEX,
    block_height: 100,
    block_time: 1_700_000_000,
    payment_cred: TREASURY_CREDENTIAL,
    is_spent: false,
    ...overrides,
  }
}

function fixture({ transactions = [saleTx()], treasuryOutputs = [addressOutput()], ...overrides } = {}) {
  return buildTicketSaleReceiptJournal({
    treasuryAddress: TREASURY,
    treasuryPaymentCredential: TREASURY_CREDENTIAL,
    ticketPolicyId: TICKET_POLICY,
    b1PrizePoolAddress: POOL,
    b1PrizePoolPaymentCredential: POOL_CREDENTIAL,
    addressOutputs: treasuryOutputs,
    transactions,
    observedAt: '2026-11-05T12:00:00.000Z',
    ...overrides,
  })
}

test('recognizes an exact TicketSale receipt and leaves category posting unassigned', () => {
  const journal = fixture()
  assert.equal(journal.schema, 'PRE-RICH-TREASURY-TICKET-SALE-RECEIPT-JOURNAL-v1')
  assert.equal(journal.receiptEvents.length, 1)
  const receipt = journal.receiptEvents[0]
  assert.equal(receipt.receiptRef, TX + '#' + RECEIPT_INDEX)
  assert.equal(receipt.ticket.policyId, TICKET_POLICY)
  assert.equal(receipt.ticket.assetNameHex, TICKET_NAME)
  assert.equal(receipt.treasury.outputValueLovelace, '2200000')
  assert.deepEqual(receipt.treasury.nativeAssets, [{
    policyId: PAYMENT_POLICY,
    assetNameHex: '5553444d',
    unit: PAYMENT_POLICY + '5553444d',
    quantity: '1500000',
  }])
  assert.equal(receipt.prizePool.inputRef, INPUT_TX + '#0')
  assert.equal(receipt.prizePool.continuationRef, TX + '#0')
  assert.equal(receipt.journalStatus, 'OBSERVED_RECEIPT_ONLY')
  assert.equal(receipt.categoryPosting, null)
  assert.equal(receipt.spendAuthorization, false)
  assert.equal(journal.summary.categoryCredits, 0)
  assert.equal(journal.summary.spendAuthorizations, 0)
})

test('does not classify a Treasury inflow without the exact ticket policy mint', () => {
  const journal = fixture({
    transactions: [saleTx({ assets_minted: [] })],
  })
  assert.equal(journal.receiptEvents.length, 0)
  assert.equal(journal.nonSaleTreasuryOutputs.length, 1)
  assert.match(journal.nonSaleTreasuryOutputs[0].reason, /NO_EXACT_TICKET_POLICY_MINT_LINK/)
})

test('rejects a ticket mint paid to a different address under the Treasury credential', () => {
  const tx = saleTx({
    outputs: [
      txOutput(TX, 0, POOL, POOL_CREDENTIAL, '5000000'),
      txOutput(TX, RECEIPT_INDEX, TREASURY_ALT, TREASURY_CREDENTIAL, '2200000'),
    ],
  })
  assert.throws(() => fixture({ transactions: [tx] }), /TREASURY_OUTPUT_NOT_CANONICAL_ADDRESS/)
})

test('rejects duplicate Treasury script outputs in one sale transaction', () => {
  const tx = saleTx({
    outputs: [
      ...saleTx().outputs,
      txOutput(TX, 2, TREASURY, TREASURY_CREDENTIAL, '2000000'),
    ],
  })
  assert.throws(() => fixture({ transactions: [tx] }), /TREASURY_OUTPUT_CREDENTIAL_COUNT_INVALID/)
})

test('rejects TicketSale evidence without exactly one B1 input and continuation', () => {
  const tx = saleTx({
    inputs: saleTx().inputs.filter((input) => input.payment_addr.cred !== POOL_CREDENTIAL),
  })
  assert.throws(() => fixture({ transactions: [tx] }), /B1_ATOMIC_PAIR_INVALID/)
})

test('rejects a ticket-policy mint quantity other than one', () => {
  const tx = saleTx({
    assets_minted: [
      { policy_id: TICKET_POLICY, asset_name: TICKET_NAME, quantity: '2' },
    ],
  })
  assert.throws(() => fixture({ transactions: [tx] }), /TICKET_MINT_QUANTITY_INVALID/)
})

test('does not recognize an invalid on-chain transaction as a TicketSale', () => {
  const journal = fixture({
    transactions: [saleTx({ valid_contract: false })],
    treasuryOutputs: [],
  })
  assert.equal(journal.receiptEvents.length, 0)
  assert.equal(journal.summary.categoryCredits, 0)
})

test('rejects duplicate treasury output references from provider pagination', () => {
  assert.throws(
    () => fixture({ treasuryOutputs: [addressOutput(), addressOutput()] }),
    /DUPLICATE_TREASURY_OUTPUT/,
  )
})

test('links a spent receipt to the unique consuming transaction and retained Treasury outputs', () => {
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [txInput(TX, RECEIPT_INDEX, TREASURY, TREASURY_CREDENTIAL)],
    outputs: [
      txOutput(CONSUMER_TX, 0, TREASURY, TREASURY_CREDENTIAL, '2200000'),
    ],
    assets_minted: [],
  }
  const journal = fixture({
    treasuryOutputs: [addressOutput({ is_spent: true })],
    transactions: [saleTx(), consumer],
  })
  const receipt = journal.receiptEvents[0]
  assert.equal(receipt.lifecycle.state, 'SPENT_RETAINED_IN_TREASURY_CUSTODY')
  assert.equal(receipt.lifecycle.consumingTransactionHash, CONSUMER_TX)
  assert.deepEqual(receipt.lifecycle.retainedTreasuryOutputRefs, [CONSUMER_TX + '#0'])
  assert.equal(journal.consumingTransactions.length, 1)
  assert.deepEqual(journal.consumingTransactions[0].consumedReceiptRefs, [TX + '#' + RECEIPT_INDEX])
})

test('marks a spent receipt unresolved when the consumer transaction is outside the supplied history', () => {
  const journal = fixture({
    treasuryOutputs: [addressOutput({ is_spent: true })],
    transactions: [saleTx()],
  })
  assert.equal(journal.receiptEvents[0].lifecycle.state, 'SPENT_CONSUMER_NOT_RECONSTRUCTED')
  assert.equal(journal.summary.unresolvedSpendLinkCount, 1)
})

test('rejects an output marked unspent when a supplied transaction consumes it', () => {
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [txInput(TX, RECEIPT_INDEX, TREASURY, TREASURY_CREDENTIAL)],
    outputs: [],
    assets_minted: [],
  }
  assert.throws(() => fixture({ transactions: [saleTx(), consumer] }), /UNSPENT_OUTPUT_HAS_CONSUMER/)
})

test('rejects impossible multiple consumers for one output reference', () => {
  const consumer = (txHash, blockHeight) => ({
    tx_hash: txHash,
    block_hash: 'f2'.repeat(32),
    block_height: blockHeight,
    absolute_slot: 910 + blockHeight,
    tx_timestamp: 1_700_000_100 + blockHeight,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [txInput(TX, RECEIPT_INDEX, TREASURY, TREASURY_CREDENTIAL)],
    outputs: [],
    assets_minted: [],
  })
  assert.throws(
    () => fixture({
      treasuryOutputs: [addressOutput({ is_spent: true })],
      transactions: [saleTx(), consumer(CONSUMER_TX, 101), consumer(CONSUMER_TX_2, 102)],
    }),
    /MULTIPLE_CONSUMERS/,
  )
})

test('rejects a Sale transaction if the Treasury output is missing from address history', () => {
  assert.throws(
    () => fixture({ treasuryOutputs: [] }),
    /TREASURY_OUTPUT_NOT_IN_ADDRESS_HISTORY/,
  )
})
