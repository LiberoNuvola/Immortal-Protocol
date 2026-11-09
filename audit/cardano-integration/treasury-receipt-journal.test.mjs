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

function receiptInput({
  txHash = TX,
  txIndex = RECEIPT_INDEX,
  lovelace = '2200000',
  assets = [{ policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '1500000' }],
} = {}) {
  return {
    ...txInput(txHash, txIndex, TREASURY, TREASURY_CREDENTIAL),
    value: lovelace,
    asset_list: assets,
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

function withSnapshot(journal, { height = 100, hash = 'a0'.repeat(32), artifactFingerprints = { 'loadValidator.ts': 'ab'.repeat(32) } } = {}) {
  journal.observation = {
    provider: 'Koios',
    fromBlockHeightInclusive: 0,
    snapshotTip: { blockHeight: height, hash },
    derivedTopology: {
      treasuryAddress: TREASURY,
      treasuryPaymentCredential: TREASURY_CREDENTIAL,
      b1PrizePoolAddress: POOL,
      b1PrizePoolPaymentCredential: POOL_CREDENTIAL,
      ticketPolicyId: TICKET_POLICY,
      oraclePublisherPkh: '77'.repeat(28),
      oracleStatePolicyId: '88'.repeat(28),
      oracleStateTokenNameHex: '01',
      poolTokenPolicyId: '99'.repeat(28),
      poolTokenNameHex: '02',
      prizeTable: [1, 2, 3, 5, 10, 25, 50, 100],
    },
    artifactFingerprints,
  }
  return journal
}

function saleAt({ hash = 'a4'.repeat(32), height = 101, blockHash = 'f4'.repeat(32), slot = 910, timestamp = 1_700_000_100, ticketName = '505245524943480002' } = {}) {
  return saleTx({
    tx_hash: hash,
    block_hash: blockHash,
    block_height: height,
    absolute_slot: slot,
    tx_timestamp: timestamp,
    tx_block_index: 1,
    outputs: [
      txOutput(hash, 0, POOL, POOL_CREDENTIAL, '5000000'),
      txOutput(hash, 1, TREASURY, TREASURY_CREDENTIAL, '1100000', [
        { policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '500000' },
      ]),
    ],
    assets_minted: [{ policy_id: TICKET_POLICY, asset_name: ticketName, quantity: '1' }],
  })
}

test('reconciles full Treasury custody including unclassified inflows by exact asset unit', () => {
  const otherTxHash = 'a3'.repeat(32)
  const otherTx = {
    tx_hash: otherTxHash,
    block_hash: 'f5'.repeat(32),
    block_height: 99,
    absolute_slot: 890,
    tx_timestamp: 1_699_999_900,
    tx_block_index: 0,
    valid_contract: true,
    inputs: [txInput('b3'.repeat(32), 0, 'addr_test1sender', '55'.repeat(28))],
    outputs: [
      txOutput(otherTxHash, 0, TREASURY, TREASURY_CREDENTIAL, '1000000', [
        { policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '500000' },
        { policy_id: '66'.repeat(28), asset_name: '414243', quantity: '9' },
      ]),
    ],
    assets_minted: [],
  }
  const journal = fixture({
    transactions: [saleTx(), otherTx],
    treasuryOutputs: [
      addressOutput(),
      addressOutput({
        tx_hash: otherTxHash,
        tx_index: 0,
        block_height: 99,
        block_time: 1_699_999_900,
      }),
    ],
  })
  assert.equal(journal.receiptEvents.length, 1)
  assert.equal(journal.nonSaleTreasuryOutputs.length, 1)
  assert.equal(journal.treasuryCustody.unspentOutputCount, 2)
  assert.deepEqual(journal.treasuryCustody.totalsByAsset, [
    { unit: 'lovelace', quantity: '3200000' },
    { unit: PAYMENT_POLICY + '5553444d', quantity: '2000000' },
    { unit: '66'.repeat(28) + '414243', quantity: '9' },
  ])
})

test('recognizes an exact TicketSale receipt and leaves category posting unassigned', () => {
  const journal = fixture()
  assert.equal(journal.schema, 'PRE-RICH-TREASURY-TICKET-SALE-RECEIPT-JOURNAL-v1')
  assert.deepEqual(journal.treasuryCustody.totalsByAsset, [
    { unit: 'lovelace', quantity: '2200000' },
    { unit: PAYMENT_POLICY + '5553444d', quantity: '1500000' },
  ])
  assert.equal(journal.treasuryCustody.unspentOutputCount, 1)
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

test('repeated observations preserve an identical deterministic receipt event identity and payload', () => {
  const first = fixture({ observedAt: '2026-11-05T12:00:00.000Z' })
  const second = fixture({ observedAt: '2026-11-05T12:05:00.000Z' })
  assert.equal(first.receiptEvents[0].eventId, second.receiptEvents[0].eventId)
  assert.deepEqual(first.receiptEvents, second.receiptEvents)
})

test('rejects duplicate transaction facts as a conflicting or replayed observation', () => {
  assert.throws(() => fixture({ transactions: [saleTx(), saleTx()] }), /DUPLICATE_TX_INFO/)
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

test('accepts a B1 continuation only when its full native-asset basket is preserved', () => {
  const token = { policy_id: PAYMENT_POLICY, asset_name: '424f4f4b', quantity: '7' }
  const tx = saleTx()
  const inputs = tx.inputs.map((input, index) => index === 0
    ? { ...input, asset_list: [token] }
    : input)
  const outputs = tx.outputs.map((output) => output.payment_addr.cred === POOL_CREDENTIAL
    ? { ...output, asset_list: [token] }
    : output)
  const journal = fixture({ transactions: [{ ...tx, inputs, outputs }] })
  assert.equal(journal.receiptEvents.length, 1)
  assert.equal(journal.receiptEvents[0].prizePool.physicalValuePreservedInObservedTransaction, true)
  assert.equal(journal.receiptEvents[0].prizePool.physicalValueEvidence, 'OBSERVED_INPUT_OUTPUT_EQUALITY')
})

test('rejects a B1 continuation with a different lovelace value', () => {
  const tx = saleTx()
  const outputs = tx.outputs.map((output) => output.payment_addr.cred === POOL_CREDENTIAL
    ? { ...output, value: '5000001' }
    : output)
  assert.throws(() => fixture({ transactions: [{ ...tx, outputs }] }), /B1_PHYSICAL_VALUE_NOT_PRESERVED/)
})

test('rejects a B1 continuation with a changed native-asset quantity', () => {
  const inputAsset = { policy_id: PAYMENT_POLICY, asset_name: '424f4f4b', quantity: '7' }
  const outputAsset = { ...inputAsset, quantity: '6' }
  const tx = saleTx()
  const inputs = tx.inputs.map((input, index) => index === 0
    ? { ...input, asset_list: [inputAsset] }
    : input)
  const outputs = tx.outputs.map((output) => output.payment_addr.cred === POOL_CREDENTIAL
    ? { ...output, asset_list: [outputAsset] }
    : output)
  assert.throws(() => fixture({ transactions: [{ ...tx, inputs, outputs }] }), /B1_PHYSICAL_VALUE_NOT_PRESERVED/)
})

test('accepts explicit null asset lists as ADA-only values', () => {
  const tx = saleTx()
  const inputs = tx.inputs.map((input, index) => index === 0
    ? { ...input, asset_list: null }
    : input)
  const outputs = tx.outputs.map((output) => output.payment_addr.cred === POOL_CREDENTIAL
    ? { ...output, asset_list: null }
    : output)
  const journal = fixture({ transactions: [{ ...tx, inputs, outputs }] })
  assert.equal(journal.receiptEvents.length, 1)
  assert.equal(journal.receiptEvents[0].prizePool.physicalValuePreservedInObservedTransaction, true)
})

test('fails closed when Koios omits the B1 input asset list', () => {
  const tx = saleTx()
  const inputs = tx.inputs.map((input, index) => index === 0
    ? { ...input, asset_list: undefined }
    : input)
  assert.throws(() => fixture({ transactions: [{ ...tx, inputs }] }), /INPUT_ASSET_LIST_MISSING/)
})

test('fails closed when Koios omits the B1 continuation asset list', () => {
  const tx = saleTx()
  const outputs = tx.outputs.map((output) => output.payment_addr.cred === POOL_CREDENTIAL
    ? { ...output, asset_list: undefined }
    : output)
  assert.throws(() => fixture({ transactions: [{ ...tx, outputs }] }), /OUTPUT_ASSET_LIST_MISSING/)
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
    inputs: [receiptInput()],
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
    inputs: [receiptInput()],
    outputs: [],
    assets_minted: [],
  }
  assert.throws(() => fixture({ transactions: [saleTx(), consumer] }), /UNSPENT_OUTPUT_HAS_CONSUMER/)
})

test('rejects a consumer input whose lovelace differs from the original receipt output', () => {
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [receiptInput({ lovelace: '2200001' })],
    outputs: [],
    assets_minted: [],
  }
  assert.throws(
    () => fixture({ treasuryOutputs: [addressOutput({ is_spent: true })], transactions: [saleTx(), consumer] }),
    /TREASURY_JOURNAL_CONSUMER_INPUT_VALUE_MISMATCH/,
  )
})

test('rejects a consumer input whose native-asset basket differs from the original receipt output', () => {
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [receiptInput({ assets: [{ policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '1499999' }] })],
    outputs: [],
    assets_minted: [],
  }
  assert.throws(
    () => fixture({ treasuryOutputs: [addressOutput({ is_spent: true })], transactions: [saleTx(), consumer] }),
    /TREASURY_JOURNAL_CONSUMER_INPUT_VALUE_MISMATCH/,
  )
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
    inputs: [receiptInput()],
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


test('reconstructs canonical Treasury outputs from address transaction history', async () => {
  const { deriveTreasuryAddressOutputs } = await import('./treasury-receipt-journal.mjs')
  const rows = deriveTreasuryAddressOutputs({
    treasuryAddress: TREASURY,
    treasuryPaymentCredential: TREASURY_CREDENTIAL,
    transactions: [saleTx()],
  })
  assert.equal(rows.length, 1)
  assert.equal(rows[0].tx_hash, TX)
  assert.equal(rows[0].tx_index, RECEIPT_INDEX)
  assert.equal(rows[0].block_height, 100)
  assert.equal(rows[0].block_time, 1_700_000_000)
  assert.equal(rows[0].is_spent, false)
})

test('derives spent state by following valid consuming transaction inputs', async () => {
  const { deriveTreasuryAddressOutputs } = await import('./treasury-receipt-journal.mjs')
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [receiptInput()],
    outputs: [
      txOutput(CONSUMER_TX, 0, TREASURY, TREASURY_CREDENTIAL, '2200000'),
    ],
    assets_minted: [],
  }
  const rows = deriveTreasuryAddressOutputs({
    treasuryAddress: TREASURY,
    treasuryPaymentCredential: TREASURY_CREDENTIAL,
    transactions: [saleTx(), consumer],
  })
  assert.equal(rows.length, 2)
  const receipt = rows.find((row) => row.tx_hash === TX)
  assert.equal(receipt.is_spent, true)
  const continuation = rows.find((row) => row.tx_hash === CONSUMER_TX)
  assert.equal(continuation.is_spent, false)
})

test('rejects a spent Treasury input whose Value differs from its originating output', async () => {
  const { deriveTreasuryAddressOutputs } = await import('./treasury-receipt-journal.mjs')
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [receiptInput({ assets: [{ policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '1499999' }] })],
    outputs: [],
    assets_minted: [],
  }
  assert.throws(
    () => deriveTreasuryAddressOutputs({
      treasuryAddress: TREASURY,
      treasuryPaymentCredential: TREASURY_CREDENTIAL,
      transactions: [saleTx(), consumer],
    }),
    /TREASURY_JOURNAL_SPENT_INPUT_VALUE_MISMATCH/,
  )
})

test('fails closed on an output with Treasury credential but non-canonical address', async () => {
  const { deriveTreasuryAddressOutputs } = await import('./treasury-receipt-journal.mjs')
  const tx = saleTx({
    outputs: [
      txOutput(TX, 0, POOL, POOL_CREDENTIAL, '5000000'),
      txOutput(TX, RECEIPT_INDEX, TREASURY_ALT, TREASURY_CREDENTIAL, '2200000'),
    ],
  })
  assert.throws(
    () => deriveTreasuryAddressOutputs({
      treasuryAddress: TREASURY,
      treasuryPaymentCredential: TREASURY_CREDENTIAL,
      transactions: [tx],
    }),
    /DERIVED_OUTPUT_IDENTITY_MISMATCH/,
  )
})

test('cross-check accepts a provider omission at a history cursor boundary while retaining the tx-info row', async () => {
  const { assertTreasuryAddressOutputCrossCheck, deriveTreasuryAddressOutputs } = await import('./treasury-receipt-journal.mjs')
  const derivedRows = deriveTreasuryAddressOutputs({
    treasuryAddress: TREASURY,
    treasuryPaymentCredential: TREASURY_CREDENTIAL,
    transactions: [saleTx()],
  })
  const result = assertTreasuryAddressOutputCrossCheck({
    treasuryAddress: TREASURY,
    providerRows: [],
    derivedRows,
  })
  assert.equal(result.providerRows, 0)
  assert.equal(result.derivedRows, 1)
  assert.equal(result.providerRowsMissingFromEndpoint, 1)
  assert.equal(result.exactMatches, 0)
})

test('cross-check rejects output history returned for a different address', async () => {
  const { assertTreasuryAddressOutputCrossCheck, deriveTreasuryAddressOutputs } = await import('./treasury-receipt-journal.mjs')
  const derivedRows = deriveTreasuryAddressOutputs({
    treasuryAddress: TREASURY,
    treasuryPaymentCredential: TREASURY_CREDENTIAL,
    transactions: [saleTx()],
  })
  assert.throws(
    () => assertTreasuryAddressOutputCrossCheck({
      treasuryAddress: TREASURY,
      providerRows: [addressOutput({ address: TREASURY_ALT })],
      derivedRows,
    }),
    /ADDRESS_OUTPUT_ADDRESS_MISMATCH/,
  )
})


test('classifies a receipt consumed by a Treasury-to-PrizePool transfer and preserves exact consumer outputs', () => {
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [receiptInput()],
    outputs: [
      txOutput(CONSUMER_TX, 0, POOL, POOL_CREDENTIAL, '2200000', [
        { policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '1500000' },
      ]),
    ],
    assets_minted: [],
  }
  const journal = fixture({
    treasuryOutputs: [addressOutput({ is_spent: true })],
    transactions: [saleTx(), consumer],
  })
  const receipt = journal.receiptEvents[0]
  assert.equal(receipt.lifecycle.state, 'SPENT_WITH_B1_PRIZEPOOL_OUTPUT')
  assert.deepEqual(receipt.lifecycle.b1PrizePoolOutputRefs, [CONSUMER_TX + '#0'])
  const consumerRecord = journal.consumingTransactions[0]
  assert.equal(consumerRecord.outputs[0].address, POOL)
  assert.equal(consumerRecord.outputs[0].lovelace, '2200000')
  assert.deepEqual(consumerRecord.outputs[0].nativeAssets, [{
    policyId: PAYMENT_POLICY,
    assetNameHex: '5553444d',
    unit: PAYMENT_POLICY + '5553444d',
    quantity: '1500000',
  }])
})

test('derives a consolidated receipt batch total only from the exact receipt inputs consumed', () => {
  const secondSaleHash = 'a2'.repeat(32)
  const secondPoolInputHash = 'b2'.repeat(32)
  const secondSale = saleTx({
    tx_hash: secondSaleHash,
    block_hash: 'f3'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    inputs: [
      txInput(secondPoolInputHash, 0, POOL, POOL_CREDENTIAL),
      txInput('c2'.repeat(32), 0, 'addr_test1buyer2', '55'.repeat(28)),
    ],
    outputs: [
      txOutput(secondSaleHash, 0, POOL, POOL_CREDENTIAL, '5000000'),
      txOutput(secondSaleHash, 1, TREASURY, TREASURY_CREDENTIAL, '1100000', [
        { policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '500000' },
      ]),
    ],
    assets_minted: [
      { policy_id: TICKET_POLICY, asset_name: '505245524943480002', quantity: '1' },
    ],
  })
  const batchConsumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f4'.repeat(32),
    block_height: 102,
    absolute_slot: 920,
    tx_timestamp: 1_700_000_200,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [
      receiptInput(),
      receiptInput({
        txHash: secondSaleHash,
        txIndex: 1,
        lovelace: '1100000',
        assets: [{ policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '500000' }],
      }),
      { ...txInput('d2'.repeat(32), 0, 'addr_test1batcher', '55'.repeat(28)), value: '400000' },
    ],
    outputs: [
      txOutput(CONSUMER_TX, 0, POOL, POOL_CREDENTIAL, '3500000', [
        { policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '2000000' },
      ]),
    ],
    assets_minted: [],
  }
  const journal = fixture({
    treasuryOutputs: [
      addressOutput({ is_spent: true }),
      addressOutput({ tx_hash: secondSaleHash, tx_index: 1, block_height: 101, block_time: 1_700_000_100, is_spent: true }),
    ],
    transactions: [saleTx(), secondSale, batchConsumer],
  })
  assert.equal(journal.consumingTransactions.length, 1)
  const batch = journal.consumingTransactions[0]
  assert.deepEqual(batch.consumedReceiptRefs, [TX + '#' + RECEIPT_INDEX, secondSaleHash + '#1'].sort())
  assert.equal(batch.consumedReceiptInputs.length, 2)
  assert.equal(batch.inputs.length, 3)
  assert.equal(batch.receiptInputTotalsByAsset.find((entry) => entry.unit === 'lovelace').quantity, '3300000')
  assert.equal(batch.receiptInputTotalsByAsset.find((entry) => entry.unit === PAYMENT_POLICY + '5553444d').quantity, '2000000')
})


test('reconciles an identical repeated full-history snapshot idempotently', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture(), { height: 100, hash: 'a0'.repeat(32) })
  const current = withSnapshot(fixture({ observedAt: '2026-11-05T12:05:00.000Z' }), { height: 100, hash: 'a0'.repeat(32) })
  const result = reconcileTreasuryJournalSnapshots({ previous, current })
  assert.equal(result.disposition, 'SAME_TIP_SNAPSHOT_RECONCILED')
  assert.deepEqual(result.eventDelta.addedReceiptRefs, [])
  assert.deepEqual(result.custodyDeltaByAsset, [])
  assert.equal(result.evidenceQuality.ledgerFinalityEstablished, false)
})

test('reconciles a later TicketSale as an append-only receipt event and exact custody delta', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture(), { height: 100, hash: 'a0'.repeat(32) })
  const hash = 'a4'.repeat(32)
  const current = withSnapshot(fixture({
    transactions: [saleTx(), saleAt({ hash, height: 101 })],
    treasuryOutputs: [
      addressOutput(),
      addressOutput({ tx_hash: hash, tx_index: 1, block_height: 101, block_time: 1_700_000_100 }),
    ],
  }), { height: 101, hash: 'a1'.repeat(32) })
  const result = reconcileTreasuryJournalSnapshots({ previous, current })
  assert.deepEqual(result.eventDelta.addedReceiptRefs, [hash + '#1'])
  assert.deepEqual(result.eventDelta.historicalBackfillReceiptRefs, [])
  assert.equal(result.chainContinuity, 'PRIOR_TIP_ANCESTRY_NOT_PROVEN_BY_THIS_RECONCILER')
  assert.deepEqual(result.custodyDeltaByAsset, [
    { unit: 'lovelace', delta: '1100000' },
    { unit: PAYMENT_POLICY + '5553444d', delta: '500000' },
  ])
})

test('reconciles a receipt from unspent to spent only when its current history carries the consumer', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture(), { height: 100, hash: 'a0'.repeat(32) })
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [receiptInput()],
    outputs: [],
    assets_minted: [],
  }
  const current = withSnapshot(fixture({
    transactions: [saleTx(), consumer],
    treasuryOutputs: [addressOutput({ is_spent: true })],
  }), { height: 101, hash: 'a1'.repeat(32) })
  const result = reconcileTreasuryJournalSnapshots({ previous, current })
  assert.deepEqual(result.eventDelta.newlySpentReceiptRefs, [TX + '#' + RECEIPT_INDEX])
  assert.deepEqual(result.treasuryOutputDelta.removedCustodyOutputRefs, [TX + '#' + RECEIPT_INDEX])
  assert.deepEqual(result.custodyDeltaByAsset, [
    { unit: 'lovelace', delta: '-2200000' },
    { unit: PAYMENT_POLICY + '5553444d', delta: '-1500000' },
  ])
})

test('resolves a previously unknown receipt consumer without changing receipt identity', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture({
    treasuryOutputs: [addressOutput({ is_spent: true })],
  }), { height: 100, hash: 'a0'.repeat(32) })
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [receiptInput()],
    outputs: [txOutput(CONSUMER_TX, 0, POOL, POOL_CREDENTIAL, '2200000')],
    assets_minted: [],
  }
  const current = withSnapshot(fixture({
    transactions: [saleTx(), consumer],
    treasuryOutputs: [addressOutput({ is_spent: true })],
  }), { height: 101, hash: 'a1'.repeat(32) })
  const result = reconcileTreasuryJournalSnapshots({ previous, current })
  assert.deepEqual(result.eventDelta.newlyResolvedReceiptRefs, [TX + '#' + RECEIPT_INDEX])
})

test('fails closed if a previously observed receipt disappears from a later full-history snapshot', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture(), { height: 100, hash: 'a0'.repeat(32) })
  const current = withSnapshot(fixture({ transactions: [saleTx({ assets_minted: [] })] }), { height: 101, hash: 'a1'.repeat(32) })
  assert.throws(() => reconcileTreasuryJournalSnapshots({ previous, current }), /RECEIPT_DISAPPEARED/)
})

test('fails closed if immutable receipt Value changes under the same output reference', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture(), { height: 100, hash: 'a0'.repeat(32) })
  const altered = saleTx({
    outputs: [
      txOutput(TX, 0, POOL, POOL_CREDENTIAL, '5000000'),
      txOutput(TX, RECEIPT_INDEX, TREASURY, TREASURY_CREDENTIAL, '2200001', [
        { policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '1500000' },
      ]),
    ],
  })
  const current = withSnapshot(fixture({ transactions: [altered] }), { height: 101, hash: 'a1'.repeat(32) })
  assert.throws(() => reconcileTreasuryJournalSnapshots({ previous, current }), /IMMUTABLE_EVIDENCE_CHANGED/)
})

test('fails closed on tip regression or same-height tip hash change', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture(), { height: 100, hash: 'a0'.repeat(32) })
  const regressed = withSnapshot(fixture(), { height: 99, hash: '99'.repeat(32) })
  const forked = withSnapshot(fixture(), { height: 100, hash: 'ff'.repeat(32) })
  assert.throws(() => reconcileTreasuryJournalSnapshots({ previous, current: regressed }), /TIP_REGRESSION/)
  assert.throws(() => reconcileTreasuryJournalSnapshots({ previous, current: forked }), /SAME_HEIGHT_TIP_HASH_CHANGED/)
})

test('flags late-discovered historical receipts for explicit review rather than silently backfilling', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture(), { height: 105, hash: 'a5'.repeat(32) })
  const hash = 'a4'.repeat(32)
  const current = withSnapshot(fixture({
    transactions: [saleTx(), saleAt({ hash, height: 101 })],
    treasuryOutputs: [
      addressOutput(),
      addressOutput({ tx_hash: hash, tx_index: 1, block_height: 101, block_time: 1_700_000_100 }),
    ],
  }), { height: 106, hash: 'a6'.repeat(32) })
  const result = reconcileTreasuryJournalSnapshots({ previous, current })
  assert.deepEqual(result.eventDelta.historicalBackfillReceiptRefs, [hash + '#1'])
  assert.equal(result.disposition, 'HISTORICAL_BACKFILL_REQUIRES_REVIEW')
})

test('rejects a previously spent receipt that reappears as unspent', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const consumer = {
    tx_hash: CONSUMER_TX,
    block_hash: 'f2'.repeat(32),
    block_height: 101,
    absolute_slot: 910,
    tx_timestamp: 1_700_000_100,
    tx_block_index: 1,
    valid_contract: true,
    inputs: [receiptInput()],
    outputs: [],
    assets_minted: [],
  }
  const previous = withSnapshot(fixture({
    transactions: [saleTx(), consumer],
    treasuryOutputs: [addressOutput({ is_spent: true })],
  }), { height: 101, hash: 'a1'.repeat(32) })
  const current = withSnapshot(fixture(), { height: 102, hash: 'a2'.repeat(32) })
  assert.throws(() => reconcileTreasuryJournalSnapshots({ previous, current }), /SPEND_REGRESSION/)
})

test('validates the current custody totals against exact per-output values', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture(), { height: 100, hash: 'a0'.repeat(32) })
  const current = withSnapshot(fixture(), { height: 100, hash: 'a0'.repeat(32) })
  current.treasuryCustody.totalsByAsset = [{ unit: 'lovelace', quantity: '999' }]
  assert.throws(() => reconcileTreasuryJournalSnapshots({ previous, current }), /CUSTODY_TOTAL_VALUE_MISMATCH/)
})

test('requires deployment identity and topology to remain exactly bound across snapshots', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture(), { height: 100, hash: 'a0'.repeat(32) })
  const current = withSnapshot(fixture(), { height: 101, hash: 'a1'.repeat(32) })
  current.observation.derivedTopology.treasuryPaymentCredential = 'aa'.repeat(28)
  assert.throws(() => reconcileTreasuryJournalSnapshots({ previous, current }), /IDENTITY_OR_TOPOLOGY_CHANGED/)
})

test('fails closed if a previously observed Treasury UTxO disappears without spend evidence', async () => {
  const { reconcileTreasuryJournalSnapshots } = await import('./treasury-receipt-journal.mjs')
  const previous = withSnapshot(fixture({
    transactions: [saleTx({ assets_minted: [] })],
  }), { height: 100, hash: 'a0'.repeat(32) })
  const current = withSnapshot(fixture({ transactions: [] , treasuryOutputs: [] }), { height: 101, hash: 'a1'.repeat(32) })
  assert.throws(() => reconcileTreasuryJournalSnapshots({ previous, current }), /TREASURY_OUTPUT_DISAPPEARED/)
})

test('rejects non-positive asset quantities in a Treasury output', () => {
  const tx = saleTx({
    outputs: [
      txOutput(TX, 0, POOL, POOL_CREDENTIAL, '5000000'),
      txOutput(TX, RECEIPT_INDEX, TREASURY, TREASURY_CREDENTIAL, '2200000', [
        { policy_id: PAYMENT_POLICY, asset_name: '5553444d', quantity: '-1' },
      ]),
    ],
  })
  assert.throws(() => fixture({ transactions: [tx] }), /ASSET_QUANTITY_NOT_POSITIVE/)
})
