const HASH_28 = /^[0-9a-f]{56}$/i
const HASH_32 = /^[0-9a-f]{64}$/i
const HEX = /^(?:[0-9a-f]{2})*$/i
const INTEGER = /^-?(?:0|[1-9][0-9]*)$/

function fail(code) {
  throw new Error(code)
}

function normalizedHash(value, code = 'TREASURY_JOURNAL_TX_HASH_INVALID') {
  if (typeof value !== 'string' || !HASH_32.test(value)) fail(code)
  return value.toLowerCase()
}

function normalizedAddress(output) {
  const value = output?.payment_addr?.bech32 ?? output?.payment_addr ?? output?.address
  return typeof value === 'string' ? value : null
}

function normalizedCredential(output) {
  const value = output?.payment_addr?.cred ?? output?.payment_cred
  return typeof value === 'string' ? value.toLowerCase() : null
}

function integerString(value, code) {
  const result = String(value ?? '')
  if (!INTEGER.test(result)) fail(code)
  return BigInt(result).toString()
}

function outputReference(txHash, txIndex) {
  const hash = normalizedHash(txHash)
  const index = Number(txIndex)
  if (!Number.isSafeInteger(index) || index < 0) fail('TREASURY_JOURNAL_TX_INDEX_INVALID')
  return hash + '#' + index
}

function normalizeAssetList(assets, codePrefix, { allowNegative = false } = {}) {
  if (assets == null) return []
  if (!Array.isArray(assets)) fail(codePrefix + '_ASSET_LIST_INVALID')
  const seen = new Set()
  const normalized = assets.map((asset) => {
    const policyId = String(asset?.policy_id ?? '').toLowerCase()
    const assetNameHex = String(asset?.asset_name ?? '').toLowerCase()
    if (!HASH_28.test(policyId) || !HEX.test(assetNameHex) || assetNameHex.length > 128) {
      fail(codePrefix + '_ASSET_IDENTITY_INVALID')
    }
    const unit = policyId + assetNameHex
    if (seen.has(unit)) fail(codePrefix + '_DUPLICATE_ASSET_UNIT')
    seen.add(unit)
    const quantity = integerString(asset.quantity, codePrefix + '_ASSET_QUANTITY_INVALID')
    if (!allowNegative && BigInt(quantity) <= 0n) fail(codePrefix + '_ASSET_QUANTITY_NOT_POSITIVE')
    return {
      policyId,
      assetNameHex,
      unit,
      quantity,
    }
  })
  normalized.sort((a, b) => a.unit.localeCompare(b.unit))
  return normalized
}

function parseTransaction(tx, expected) {
  if (!tx || typeof tx !== 'object') fail('TREASURY_JOURNAL_TX_INFO_INVALID')
  const txHash = normalizedHash(tx.tx_hash)
  if (typeof tx.valid_contract !== 'boolean') fail('TREASURY_JOURNAL_TX_VALIDITY_MISSING_' + txHash)
  if (!Array.isArray(tx.inputs) || !Array.isArray(tx.outputs) || (tx.assets_minted != null && !Array.isArray(tx.assets_minted))) {
    fail('TREASURY_JOURNAL_TX_COMPONENTS_MISSING_' + txHash)
  }

  const blockHeight = Number(tx.block_height)
  const absoluteSlot = Number(tx.absolute_slot)
  const txTimestamp = Number(tx.tx_timestamp)
  if (!Number.isSafeInteger(blockHeight) || blockHeight < 0) fail('TREASURY_JOURNAL_BLOCK_HEIGHT_INVALID_' + txHash)
  if (!Number.isSafeInteger(absoluteSlot) || absoluteSlot < 0) fail('TREASURY_JOURNAL_SLOT_INVALID_' + txHash)
  if (!Number.isSafeInteger(txTimestamp) || txTimestamp < 0) fail('TREASURY_JOURNAL_TIMESTAMP_INVALID_' + txHash)
  if (typeof tx.block_hash !== 'string' || !HASH_32.test(tx.block_hash)) fail('TREASURY_JOURNAL_BLOCK_HASH_INVALID_' + txHash)

  const outputs = tx.outputs.map((output) => {
    const ref = outputReference(output?.tx_hash, output?.tx_index)
    if (!ref.startsWith(txHash + '#')) fail('TREASURY_JOURNAL_OUTPUT_TX_HASH_MISMATCH_' + txHash)
    const address = normalizedAddress(output)
    const credential = normalizedCredential(output)
    if (!address || !credential) fail('TREASURY_JOURNAL_OUTPUT_ADDRESS_MISSING_' + ref)
    if (output.asset_list === undefined) fail('TREASURY_JOURNAL_OUTPUT_ASSET_LIST_MISSING_' + ref)
    const valueLovelace = integerString(output.value, 'TREASURY_JOURNAL_OUTPUT_VALUE_INVALID_' + ref)
    if (BigInt(valueLovelace) < 0n) fail('TREASURY_JOURNAL_OUTPUT_VALUE_NEGATIVE_' + ref)
    return {
      ref,
      txHash,
      txIndex: Number(output.tx_index),
      address,
      paymentCredential: credential,
      lovelace: valueLovelace,
      assets: normalizeAssetList(output.asset_list, 'TREASURY_JOURNAL_OUTPUT_' + ref),
      datumHash: output.datum_hash == null ? null : String(output.datum_hash).toLowerCase(),
      inlineDatumPresent: output.inline_datum != null,
    }
  })

  const inputs = tx.inputs.map((input) => {
    const ref = outputReference(input?.tx_hash, input?.tx_index)
    const address = normalizedAddress(input)
    const credential = normalizedCredential(input)
    if (!address || !credential) fail('TREASURY_JOURNAL_INPUT_ADDRESS_MISSING_' + ref)
    if (input.asset_list === undefined) fail('TREASURY_JOURNAL_INPUT_ASSET_LIST_MISSING_' + ref)
    const valueLovelace = integerString(input.value, 'TREASURY_JOURNAL_INPUT_VALUE_INVALID_' + ref)
    if (BigInt(valueLovelace) < 0n) fail('TREASURY_JOURNAL_INPUT_VALUE_NEGATIVE_' + ref)
    return {
      ref,
      address,
      paymentCredential: credential,
      lovelace: valueLovelace,
      assets: normalizeAssetList(input.asset_list, 'TREASURY_JOURNAL_INPUT_' + ref),
    }
  })

  const minted = normalizeAssetList(tx.assets_minted ?? [], 'TREASURY_JOURNAL_MINT_' + txHash, { allowNegative: true })
  const ticketMints = minted.filter((asset) => asset.policyId === expected.ticketPolicyId)
  return {
    txHash,
    blockHash: tx.block_hash.toLowerCase(),
    blockHeight,
    absoluteSlot,
    txTimestamp,
    txBlockIndex: Number.isSafeInteger(Number(tx.tx_block_index)) ? Number(tx.tx_block_index) : null,
    validContract: tx.valid_contract,
    inputs,
    outputs,
    minted,
    ticketMints,
  }
}

function normalizeAddressOutput(row, expectedAddress) {
  if (!row || row.address !== expectedAddress) fail('TREASURY_JOURNAL_ADDRESS_OUTPUT_ADDRESS_MISMATCH')
  const ref = outputReference(row.tx_hash, row.tx_index)
  if (typeof row.is_spent !== 'boolean') fail('TREASURY_JOURNAL_ADDRESS_OUTPUT_SPENT_FLAG_MISSING_' + ref)
  const blockHeight = Number(row.block_height)
  if (!Number.isSafeInteger(blockHeight) || blockHeight < 0) fail('TREASURY_JOURNAL_ADDRESS_OUTPUT_BLOCK_HEIGHT_INVALID_' + ref)
  const blockTime = Number(row.block_time)
  if (!Number.isSafeInteger(blockTime) || blockTime < 0) fail('TREASURY_JOURNAL_ADDRESS_OUTPUT_BLOCK_TIME_INVALID_' + ref)
  return {
    ref,
    address: expectedAddress,
    blockHeight,
    blockTime,
    paymentCredential: row.payment_cred == null ? null : String(row.payment_cred).toLowerCase(),
    isSpent: row.is_spent,
  }
}

function mapUnique(rows, keyOf, duplicateCode) {
  const map = new Map()
  for (const row of rows) {
    const key = keyOf(row)
    if (map.has(key)) fail(duplicateCode + '_' + key)
    map.set(key, row)
  }
  return map
}

function sameUtxoValue(left, right) {
  return left.lovelace === right.lovelace
    && left.assets.length === right.assets.length
    && left.assets.every((asset, index) =>
      asset.unit === right.assets[index].unit && asset.quantity === right.assets[index].quantity
    )
}

function compareAssetUnits(left, right) {
  if (left.unit === right.unit) return 0
  if (left.unit === 'lovelace') return -1
  if (right.unit === 'lovelace') return 1
  return left.unit.localeCompare(right.unit)
}

/**
 * Build read-only TicketSale receipt events from Koios transaction facts.
 *
 * This function performs no category classification, valuation, spending
 * authorization, settlement construction or transaction submission.
 */
export function buildTicketSaleReceiptJournal({
  treasuryAddress,
  treasuryPaymentCredential,
  ticketPolicyId,
  b1PrizePoolAddress,
  b1PrizePoolPaymentCredential,
  addressOutputs,
  transactions,
  observedAt = new Date().toISOString(),
  network = 'cardano-preprod',
}) {
  if (typeof treasuryAddress !== 'string' || treasuryAddress.length === 0) fail('TREASURY_JOURNAL_TREASURY_ADDRESS_REQUIRED')
  if (!HASH_28.test(String(treasuryPaymentCredential ?? ''))) fail('TREASURY_JOURNAL_TREASURY_CREDENTIAL_INVALID')
  if (!HASH_28.test(String(ticketPolicyId ?? ''))) fail('TREASURY_JOURNAL_TICKET_POLICY_INVALID')
  if (typeof b1PrizePoolAddress !== 'string' || b1PrizePoolAddress.length === 0) fail('TREASURY_JOURNAL_B1_ADDRESS_REQUIRED')
  if (!HASH_28.test(String(b1PrizePoolPaymentCredential ?? ''))) fail('TREASURY_JOURNAL_B1_CREDENTIAL_INVALID')
  if (!Array.isArray(addressOutputs) || !Array.isArray(transactions)) fail('TREASURY_JOURNAL_INPUT_ARRAYS_REQUIRED')

  const expected = {
    ticketPolicyId: ticketPolicyId.toLowerCase(),
    treasuryPaymentCredential: treasuryPaymentCredential.toLowerCase(),
    b1PrizePoolPaymentCredential: b1PrizePoolPaymentCredential.toLowerCase(),
  }
  const treasuryOutputMap = mapUnique(
    addressOutputs.map((row) => normalizeAddressOutput(row, treasuryAddress)),
    (row) => row.ref,
    'TREASURY_JOURNAL_DUPLICATE_TREASURY_OUTPUT',
  )
  const txMap = mapUnique(
    transactions.map((tx) => parseTransaction(tx, expected)),
    (tx) => tx.txHash,
    'TREASURY_JOURNAL_DUPLICATE_TX_INFO',
  )
  const outputsByRef = new Map()
  for (const tx of txMap.values()) {
    for (const output of tx.outputs) {
      if (outputsByRef.has(output.ref)) fail('TREASURY_JOURNAL_DUPLICATE_TX_OUTPUT_REF_' + output.ref)
      outputsByRef.set(output.ref, output)
    }
  }

  const receiptEvents = []
  const nonSaleTreasuryOutputs = []

  for (const tx of txMap.values()) {
    // A valid mint under the exact current Ticket policy is the transaction
    // discriminator. Treasury payments without this mint remain unclassified.
    if (tx.ticketMints.length === 0 || !tx.validContract) continue
    if (tx.ticketMints.length !== 1) fail('TREASURY_JOURNAL_MULTIPLE_TICKETS_IN_ONE_TX_' + tx.txHash)
    const ticketMint = tx.ticketMints[0]
    if (BigInt(ticketMint.quantity) !== 1n) fail('TREASURY_JOURNAL_TICKET_MINT_QUANTITY_INVALID_' + tx.txHash)

    const treasuryCredentialOutputs = tx.outputs.filter((output) =>
      output.paymentCredential === expected.treasuryPaymentCredential
    )
    if (treasuryCredentialOutputs.length !== 1) {
      fail('TREASURY_JOURNAL_TREASURY_OUTPUT_CREDENTIAL_COUNT_INVALID_' + tx.txHash)
    }
    const treasuryOutput = treasuryCredentialOutputs[0]
    if (treasuryOutput.address !== treasuryAddress) {
      fail('TREASURY_JOURNAL_TREASURY_OUTPUT_NOT_CANONICAL_ADDRESS_' + tx.txHash)
    }

    const b1Inputs = tx.inputs.filter((input) =>
      input.paymentCredential === expected.b1PrizePoolPaymentCredential
    )
    const b1Outputs = tx.outputs.filter((output) =>
      output.paymentCredential === expected.b1PrizePoolPaymentCredential
    )
    if (b1Inputs.length !== 1 || b1Outputs.length !== 1) {
      fail('TREASURY_JOURNAL_B1_ATOMIC_PAIR_INVALID_' + tx.txHash)
    }
    if (b1Inputs[0].address !== b1PrizePoolAddress || b1Outputs[0].address !== b1PrizePoolAddress) {
      fail('TREASURY_JOURNAL_B1_NON_CANONICAL_ADDRESS_' + tx.txHash)
    }
    const poolInput = b1Inputs[0]
    const poolOutput = b1Outputs[0]
    const sameAssetList = poolInput.assets.length === poolOutput.assets.length
      && poolInput.assets.every((asset, index) =>
        asset.unit === poolOutput.assets[index].unit && asset.quantity === poolOutput.assets[index].quantity
      )
    if (poolInput.lovelace !== poolOutput.lovelace || !sameAssetList) {
      fail('TREASURY_JOURNAL_B1_PHYSICAL_VALUE_NOT_PRESERVED_' + tx.txHash)
    }

    const receiptLocation = treasuryOutputMap.get(treasuryOutput.ref)
    if (!receiptLocation) fail('TREASURY_JOURNAL_TREASURY_OUTPUT_NOT_IN_ADDRESS_HISTORY_' + treasuryOutput.ref)
    if (receiptLocation.blockHeight !== tx.blockHeight) {
      fail('TREASURY_JOURNAL_TREASURY_OUTPUT_BLOCK_MISMATCH_' + treasuryOutput.ref)
    }
    if (receiptLocation.blockTime !== tx.txTimestamp) {
      fail('TREASURY_JOURNAL_TREASURY_OUTPUT_BLOCK_TIME_MISMATCH_' + treasuryOutput.ref)
    }
    if (receiptLocation.paymentCredential && receiptLocation.paymentCredential !== expected.treasuryPaymentCredential) {
      fail('TREASURY_JOURNAL_TREASURY_OUTPUT_CREDENTIAL_MISMATCH_' + treasuryOutput.ref)
    }

    receiptEvents.push({
      eventId: treasuryOutput.ref,
      receiptRef: treasuryOutput.ref,
      transactionHash: tx.txHash,
      outputIndex: treasuryOutput.txIndex,
      network,
      block: {
        hash: tx.blockHash,
        height: tx.blockHeight,
        absoluteSlot: tx.absoluteSlot,
        timestampUnix: tx.txTimestamp,
        timestamp: new Date(tx.txTimestamp * 1000).toISOString(),
        transactionIndex: tx.txBlockIndex,
      },
      ticket: {
        unit: ticketMint.unit,
        policyId: ticketMint.policyId,
        assetNameHex: ticketMint.assetNameHex,
        quantity: ticketMint.quantity,
      },
      treasury: {
        address: treasuryAddress,
        paymentCredential: expected.treasuryPaymentCredential,
        outputValueLovelace: treasuryOutput.lovelace,
        nativeAssets: treasuryOutput.assets,
        datumHash: treasuryOutput.datumHash,
        inlineDatumPresent: treasuryOutput.inlineDatumPresent,
      },
      prizePool: {
        address: b1PrizePoolAddress,
        paymentCredential: expected.b1PrizePoolPaymentCredential,
        inputRef: b1Inputs[0].ref,
        continuationRef: b1Outputs[0].ref,
        // Derived from the observed tx_info input/output values; not a claim
        // that TicketIssued itself enforces physical Value equality.
        physicalValuePreservedInObservedTransaction: true,
        physicalValueEvidence: 'OBSERVED_INPUT_OUTPUT_EQUALITY',
      },
      journalStatus: 'OBSERVED_RECEIPT_ONLY',
      categoryPosting: null,
      spendAuthorization: false,
      sourceEvidence: {
        provider: 'Koios',
        transactionValidContract: true,
        transactionHash: tx.txHash,
        treasuryOutputRef: treasuryOutput.ref,
        ticketPolicyId: expected.ticketPolicyId,
      },
      lifecycle: {
        isSpent: receiptLocation.isSpent,
        state: receiptLocation.isSpent ? 'SPENT_CONSUMER_PENDING' : 'UNSPENT_CURRENT_UTXO',
        consumingTransactionHash: null,
        retainedTreasuryOutputRefs: [],
      },
    })
  }

  const receiptMap = mapUnique(receiptEvents, (event) => event.receiptRef, 'TREASURY_JOURNAL_DUPLICATE_RECEIPT')
  const spendingTxByReceipt = new Map()
  for (const tx of txMap.values()) {
    if (!tx.validContract) continue
    for (const input of tx.inputs) {
      if (!receiptMap.has(input.ref)) continue
      if (input.address !== treasuryAddress || input.paymentCredential !== expected.treasuryPaymentCredential) {
        fail('TREASURY_JOURNAL_CONSUMER_INPUT_IDENTITY_MISMATCH_' + input.ref)
      }
      const originOutput = outputsByRef.get(input.ref)
      if (!originOutput) fail('TREASURY_JOURNAL_RECEIPT_SOURCE_OUTPUT_MISSING_' + input.ref)
      if (!sameUtxoValue(input, originOutput)) {
        fail('TREASURY_JOURNAL_CONSUMER_INPUT_VALUE_MISMATCH_' + input.ref)
      }
      const prior = spendingTxByReceipt.get(input.ref) ?? []
      prior.push(tx.txHash)
      spendingTxByReceipt.set(input.ref, prior)
    }
  }

  for (const event of receiptEvents) {
    const consumers = spendingTxByReceipt.get(event.receiptRef) ?? []
    if (consumers.length > 1) fail('TREASURY_JOURNAL_MULTIPLE_CONSUMERS_' + event.receiptRef)
    if (!event.lifecycle.isSpent && consumers.length > 0) {
      fail('TREASURY_JOURNAL_UNSPENT_OUTPUT_HAS_CONSUMER_' + event.receiptRef)
    }
    if (event.lifecycle.isSpent && consumers.length === 1) {
      const consumerHash = consumers[0]
      const consumerTx = txMap.get(consumerHash)
      const retained = consumerTx.outputs
        .filter((output) => output.paymentCredential === expected.treasuryPaymentCredential)
        .map((output) => output.ref)
      event.lifecycle = {
        isSpent: true,
        state: retained.length > 0
          ? 'SPENT_RETAINED_IN_TREASURY_CUSTODY'
          : consumerTx.outputs.some((output) => output.paymentCredential === expected.b1PrizePoolPaymentCredential && output.address === b1PrizePoolAddress)
            ? 'SPENT_WITH_B1_PRIZEPOOL_OUTPUT'
            : 'SPENT_OUTSIDE_TREASURY_CUSTODY',
        consumingTransactionHash: consumerHash,
        retainedTreasuryOutputRefs: retained,
        b1PrizePoolOutputRefs: consumerTx.outputs
          .filter((output) => output.paymentCredential === expected.b1PrizePoolPaymentCredential && output.address === b1PrizePoolAddress)
          .map((output) => output.ref),
      }
    } else if (event.lifecycle.isSpent) {
      event.lifecycle.state = 'SPENT_CONSUMER_NOT_RECONSTRUCTED'
    }
  }

  const receiptRefs = new Set(receiptEvents.map((event) => event.receiptRef))
  for (const row of treasuryOutputMap.values()) {
    if (!receiptRefs.has(row.ref)) {
      const output = outputsByRef.get(row.ref)
      if (!output) fail('TREASURY_JOURNAL_NON_SALE_SOURCE_OUTPUT_MISSING_' + row.ref)
      nonSaleTreasuryOutputs.push({
        outputRef: row.ref,
        address: output.address,
        paymentCredential: output.paymentCredential,
        blockHeight: row.blockHeight,
        isSpent: row.isSpent,
        lovelace: output.lovelace,
        nativeAssets: output.assets,
        reason: 'NO_EXACT_TICKET_POLICY_MINT_LINK_IN_OBSERVED_TRANSACTION_SET',
      })
    }
  }

  // Reconcile the current physical Treasury custody from every unspent
  // canonical Treasury output, not only outputs classified as TicketSale.
  const custodyTotals = new Map()
  const custodyOutputRefs = []
  const addCustodyAmount = (unit, quantity) => {
    custodyTotals.set(unit, (custodyTotals.get(unit) ?? 0n) + BigInt(quantity))
  }
  for (const row of treasuryOutputMap.values()) {
    if (row.isSpent) continue
    const output = outputsByRef.get(row.ref)
    if (!output) fail('TREASURY_JOURNAL_CUSTODY_SOURCE_OUTPUT_MISSING_' + row.ref)
    if (output.address !== treasuryAddress || output.paymentCredential !== expected.treasuryPaymentCredential) {
      fail('TREASURY_JOURNAL_CUSTODY_SOURCE_IDENTITY_MISMATCH_' + row.ref)
    }
    custodyOutputRefs.push(row.ref)
    addCustodyAmount('lovelace', output.lovelace)
    for (const asset of output.assets) addCustodyAmount(asset.unit, asset.quantity)
  }
  const treasuryCustody = {
    state: 'OBSERVED_CURRENT_UTXO_SNAPSHOT',
    canonicalAddress: treasuryAddress,
    unspentOutputCount: custodyOutputRefs.length,
    outputRefs: custodyOutputRefs.sort(),
    totalsByAsset: [...custodyTotals.entries()]
      .map(([unit, quantity]) => ({ unit, quantity: quantity.toString() }))
      .sort(compareAssetUnits),
    interpretation: 'RAW_PHYSICAL_CUSTODY_ONLY_NO_CATEGORY_CREDIT_NO_EEV_VALUATION',
  }

  const consumersByTx = new Map()
  for (const event of receiptEvents) {
    const consumerHash = event.lifecycle.consumingTransactionHash
    if (!consumerHash) continue
    const prior = consumersByTx.get(consumerHash) ?? []
    prior.push(event.receiptRef)
    consumersByTx.set(consumerHash, prior)
  }
  const consumingTransactions = [...consumersByTx.entries()]
    .map(([transactionHash, consumedReceiptRefs]) => {
      const tx = txMap.get(transactionHash)
      const consumedRefSet = new Set(consumedReceiptRefs)
      const consumedReceiptInputs = tx.inputs.filter((input) => consumedRefSet.has(input.ref))
      const receiptInputTotals = new Map()
      const addReceiptInputAmount = (unit, quantity) => {
        receiptInputTotals.set(unit, (receiptInputTotals.get(unit) ?? 0n) + BigInt(quantity))
      }
      for (const input of consumedReceiptInputs) {
        addReceiptInputAmount('lovelace', input.lovelace)
        for (const asset of input.assets) addReceiptInputAmount(asset.unit, asset.quantity)
      }
      return {
        transactionHash,
        consumedReceiptRefs: consumedReceiptRefs.sort(),
        consumedReceiptInputs: consumedReceiptInputs.map((input) => ({
          inputRef: input.ref,
          address: input.address,
          paymentCredential: input.paymentCredential,
          lovelace: input.lovelace,
          nativeAssets: input.assets,
        })),
        receiptInputTotalsByAsset: [...receiptInputTotals.entries()]
          .map(([unit, quantity]) => ({ unit, quantity: quantity.toString() }))
          .sort(compareAssetUnits),
        inputs: tx.inputs.map((input) => ({
          inputRef: input.ref,
          address: input.address,
          paymentCredential: input.paymentCredential,
          lovelace: input.lovelace,
          nativeAssets: input.assets,
        })),
        retainedTreasuryOutputRefs: tx.outputs
          .filter((output) => output.paymentCredential === expected.treasuryPaymentCredential && output.address === treasuryAddress)
          .map((output) => output.ref)
          .sort(),
        b1PrizePoolOutputRefs: tx.outputs
          .filter((output) => output.paymentCredential === expected.b1PrizePoolPaymentCredential && output.address === b1PrizePoolAddress)
          .map((output) => output.ref)
          .sort(),
        outputs: tx.outputs.map((output) => ({
          outputRef: output.ref,
          address: output.address,
          paymentCredential: output.paymentCredential,
          lovelace: output.lovelace,
          nativeAssets: output.assets,
        })),
      }
    })
    .sort((a, b) => a.transactionHash.localeCompare(b.transactionHash))

  receiptEvents.sort((a, b) => a.block.height - b.block.height || a.receiptRef.localeCompare(b.receiptRef))
  nonSaleTreasuryOutputs.sort((a, b) => a.blockHeight - b.blockHeight || a.outputRef.localeCompare(b.outputRef))

  return {
    schema: 'PRE-RICH-TREASURY-TICKET-SALE-RECEIPT-JOURNAL-v1',
    network,
    observedAt,
    treasuryIdentity: {
      address: treasuryAddress,
      paymentCredential: expected.treasuryPaymentCredential,
    },
    ticketPolicyId: expected.ticketPolicyId,
    b1PrizePoolIdentity: {
      address: b1PrizePoolAddress,
      paymentCredential: expected.b1PrizePoolPaymentCredential,
    },
    receiptEvents,
    consumingTransactions,
    nonSaleTreasuryOutputs,
    treasuryCustody,
    summary: {
      treasuryOutputCount: treasuryOutputMap.size,
      ticketSaleReceiptCount: receiptEvents.length,
      unspentReceiptCount: receiptEvents.filter((event) => event.lifecycle.state === 'UNSPENT_CURRENT_UTXO').length,
      spentReceiptCount: receiptEvents.filter((event) => event.lifecycle.isSpent).length,
      unresolvedSpendLinkCount: receiptEvents.filter((event) => event.lifecycle.state === 'SPENT_CONSUMER_NOT_RECONSTRUCTED').length,
      nonSaleTreasuryOutputCount: nonSaleTreasuryOutputs.length,
      categoryCredits: 0,
      spendAuthorizations: 0,
    },
    interpretation: {
      receiptRecognition: 'READ_ONLY_TRANSACTION_EVIDENCE',
      categoryAllocation: 'NOT_PERFORMED',
      economicValuation: 'NOT_PERFORMED',
      spendAuthority: false,
      targetSemantics: 'NOT_EVALUATED_BY_THIS_OBSERVER',
    },
  }
}



function canonicalJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']'
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) =>
      JSON.stringify(key) + ':' + canonicalJson(value[key])
    ).join(',') + '}'
  }
  return JSON.stringify(value)
}

function journalSnapshotMeta(snapshot, label) {
  if (!snapshot || typeof snapshot !== 'object') fail('TREASURY_RECONCILE_' + label + '_SNAPSHOT_INVALID')
  if (snapshot.schema !== 'PRE-RICH-TREASURY-TICKET-SALE-RECEIPT-JOURNAL-v1') {
    fail('TREASURY_RECONCILE_' + label + '_SCHEMA_MISMATCH')
  }
  if (typeof snapshot.network !== 'string' || snapshot.network.length === 0 ||
      !snapshot.treasuryIdentity || typeof snapshot.treasuryIdentity.address !== 'string' ||
      typeof snapshot.treasuryIdentity.paymentCredential !== 'string' ||
      !HASH_28.test(snapshot.treasuryIdentity.paymentCredential) ||
      !HASH_28.test(String(snapshot.ticketPolicyId ?? '')) ||
      !snapshot.b1PrizePoolIdentity || typeof snapshot.b1PrizePoolIdentity.address !== 'string' ||
      !HASH_28.test(String(snapshot.b1PrizePoolIdentity.paymentCredential ?? ''))) {
    fail('TREASURY_RECONCILE_' + label + '_DEPLOYMENT_IDENTITY_INVALID')
  }
  const observation = snapshot.observation
  const tip = observation?.snapshotTip
  if (!observation || observation.fromBlockHeightInclusive !== 0 ||
      !tip || !HASH_32.test(String(tip.hash ?? '')) ||
      !Number.isSafeInteger(Number(tip.blockHeight)) || Number(tip.blockHeight) < 0 ||
      !observation.derivedTopology || typeof observation.derivedTopology !== 'object' ||
      !observation.artifactFingerprints || typeof observation.artifactFingerprints !== 'object' ||
      Array.isArray(observation.artifactFingerprints)) {
    fail('TREASURY_RECONCILE_' + label + '_OBSERVATION_METADATA_INVALID')
  }
  if (!Array.isArray(snapshot.receiptEvents) ||
      !Array.isArray(snapshot.nonSaleTreasuryOutputs) ||
      !snapshot.treasuryCustody || !Array.isArray(snapshot.treasuryCustody.outputRefs) ||
      !Array.isArray(snapshot.treasuryCustody.totalsByAsset)) {
    fail('TREASURY_RECONCILE_' + label + '_JOURNAL_COMPONENTS_INVALID')
  }
  if (snapshot.treasuryCustody.canonicalAddress !== snapshot.treasuryIdentity.address ||
      snapshot.treasuryCustody.state !== 'OBSERVED_CURRENT_UTXO_SNAPSHOT') {
    fail('TREASURY_RECONCILE_' + label + '_CUSTODY_IDENTITY_INVALID')
  }
  return {
    tipHash: String(tip.hash).toLowerCase(),
    tipHeight: Number(tip.blockHeight),
    topology: observation.derivedTopology,
    artifactFingerprints: observation.artifactFingerprints,
  }
}

function normalizedJournalAssets(assets, code) {
  if (!Array.isArray(assets)) fail(code + '_ASSETS_MISSING')
  const seen = new Set()
  const normalized = assets.map((asset) => {
    const unit = String(asset?.unit ?? '').toLowerCase()
    const quantity = integerString(asset?.quantity, code + '_QUANTITY_INVALID')
    if (!/^[0-9a-f]{56}(?:[0-9a-f]{2}){0,64}$/.test(unit) ||
        BigInt(quantity) <= 0n || seen.has(unit)) {
      fail(code + '_ASSET_INVALID')
    }
    seen.add(unit)
    return { unit, quantity }
  })
  normalized.sort(compareAssetUnits)
  return normalized
}

function snapshotOutputRecords(snapshot, label, { requireValues }) {
  const records = new Map()
  for (const event of snapshot.receiptEvents) {
    const ref = String(event?.receiptRef ?? '')
    if (!ref || event.eventId !== ref ||
        event.transactionHash + '#' + event.outputIndex !== ref ||
        !Number.isSafeInteger(Number(event.block?.height)) ||
        Number(event.block.height) < 0 || Number(event.block.height) > Number(snapshot.observation.snapshotTip.blockHeight) ||
        typeof event.lifecycle?.isSpent !== 'boolean' ||
        typeof event.lifecycle?.state !== 'string') {
      fail('TREASURY_RECONCILE_' + label + '_RECEIPT_EVENT_INVALID')
    }
    if (event.treasury?.address !== snapshot.treasuryIdentity.address ||
        String(event.treasury?.paymentCredential ?? '').toLowerCase() !== String(snapshot.treasuryIdentity.paymentCredential).toLowerCase()) {
      fail('TREASURY_RECONCILE_' + label + '_RECEIPT_OUTPUT_IDENTITY_MISMATCH_' + ref)
    }
    if (records.has(ref)) fail('TREASURY_RECONCILE_' + label + '_DUPLICATE_OUTPUT_REF_' + ref)
    const lovelace = integerString(event.treasury.outputValueLovelace, 'TREASURY_RECONCILE_' + label + '_LOVELACE_INVALID')
    if (BigInt(lovelace) < 0n) fail('TREASURY_RECONCILE_' + label + '_LOVELACE_NEGATIVE')
    records.set(ref, {
      ref,
      kind: 'receipt',
      blockHeight: Number(event.block.height),
      isSpent: event.lifecycle.isSpent,
      lifecycle: event.lifecycle,
      lovelace,
      nativeAssets: normalizedJournalAssets(event.treasury.nativeAssets, 'TREASURY_RECONCILE_' + label + '_RECEIPT'),
      event,
    })
  }

  for (const row of snapshot.nonSaleTreasuryOutputs) {
    const ref = String(row?.outputRef ?? '')
    if (!ref || !Number.isSafeInteger(Number(row.blockHeight)) ||
        Number(row.blockHeight) < 0 || Number(row.blockHeight) > Number(snapshot.observation.snapshotTip.blockHeight) ||
        typeof row.isSpent !== 'boolean' ||
        row.address !== snapshot.treasuryIdentity.address ||
        String(row.paymentCredential ?? '').toLowerCase() !== String(snapshot.treasuryIdentity.paymentCredential).toLowerCase()) {
      fail('TREASURY_RECONCILE_' + label + '_NON_SALE_OUTPUT_INVALID')
    }
    if (records.has(ref)) fail('TREASURY_RECONCILE_' + label + '_DUPLICATE_OUTPUT_REF_' + ref)
    let lovelace = null
    let nativeAssets = null
    if (row.lovelace !== undefined && row.nativeAssets !== undefined) {
      lovelace = integerString(row.lovelace, 'TREASURY_RECONCILE_' + label + '_NON_SALE_LOVELACE_INVALID')
      if (BigInt(lovelace) < 0n) fail('TREASURY_RECONCILE_' + label + '_NON_SALE_LOVELACE_NEGATIVE')
      nativeAssets = normalizedJournalAssets(row.nativeAssets, 'TREASURY_RECONCILE_' + label + '_NON_SALE')
    } else if (requireValues) {
      fail('TREASURY_RECONCILE_' + label + '_NON_SALE_VALUE_DETAILS_MISSING_' + ref)
    }
    records.set(ref, {
      ref,
      kind: 'non-sale',
      blockHeight: Number(row.blockHeight),
      isSpent: row.isSpent,
      reason: row.reason,
      lovelace,
      nativeAssets,
      event: null,
    })
  }
  return records
}

function validateCustodySnapshot(snapshot, records, label, { requireCompleteValues }) {
  const refs = snapshot.treasuryCustody.outputRefs.map((ref) => String(ref))
  if (new Set(refs).size !== refs.length) fail('TREASURY_RECONCILE_' + label + '_CUSTODY_DUPLICATE_OUTPUT_REF')
  const expectedRefs = [...records.values()].filter((row) => !row.isSpent).map((row) => row.ref).sort()
  const actualRefs = [...refs].sort()
  if (canonicalJson(actualRefs) !== canonicalJson(expectedRefs) ||
      Number(snapshot.treasuryCustody.unspentOutputCount) !== expectedRefs.length) {
    fail('TREASURY_RECONCILE_' + label + '_CUSTODY_OUTPUT_SET_MISMATCH')
  }
  const totals = new Map()
  for (const row of snapshot.treasuryCustody.totalsByAsset) {
    const unit = String(row?.unit ?? '').toLowerCase()
    const quantity = integerString(row?.quantity, 'TREASURY_RECONCILE_' + label + '_CUSTODY_TOTAL_INVALID')
    if (!unit || BigInt(quantity) < 0n || totals.has(unit)) {
      fail('TREASURY_RECONCILE_' + label + '_CUSTODY_TOTAL_INVALID')
    }
    totals.set(unit, BigInt(quantity))
  }
  const complete = [...records.values()].every((row) =>
    row.lovelace !== null && Array.isArray(row.nativeAssets)
  )
  if (complete || requireCompleteValues) {
    const derived = new Map()
    const add = (unit, quantity) => {
      derived.set(unit, (derived.get(unit) ?? 0n) + BigInt(quantity))
    }
    for (const row of records.values()) {
      if (row.isSpent) continue
      if (row.lovelace === null || !Array.isArray(row.nativeAssets)) {
        fail('TREASURY_RECONCILE_' + label + '_CUSTODY_VALUE_DETAILS_INCOMPLETE')
      }
      add('lovelace', row.lovelace)
      for (const asset of row.nativeAssets) add(asset.unit, asset.quantity)
    }
    const expected = [...derived.entries()]
      .filter(([, quantity]) => quantity !== 0n)
      .map(([unit, quantity]) => ({ unit, quantity: quantity.toString() }))
      .sort(compareAssetUnits)
    const actual = [...totals.entries()]
      .filter(([, quantity]) => quantity !== 0n)
      .map(([unit, quantity]) => ({ unit, quantity: quantity.toString() }))
      .sort(compareAssetUnits)
    if (canonicalJson(actual) !== canonicalJson(expected)) {
      fail('TREASURY_RECONCILE_' + label + '_CUSTODY_TOTAL_VALUE_MISMATCH')
    }
  }
  return { totals, complete }
}

function immutableReceiptProjection(event) {
  const projection = JSON.parse(JSON.stringify(event))
  delete projection.lifecycle
  if (projection.block) {
    delete projection.block.confirmations
    delete projection.block.confirmationProvider
  }
  return projection
}

function resolvedReceiptLifecycle(lifecycle) {
  return [
    'SPENT_RETAINED_IN_TREASURY_CUSTODY',
    'SPENT_WITH_B1_PRIZEPOOL_OUTPUT',
    'SPENT_OUTSIDE_TREASURY_CUSTODY',
  ].includes(lifecycle?.state) && typeof lifecycle?.consumingTransactionHash === 'string'
}

function compareReceiptLifecycle(previous, current, ref) {
  if (!previous.isSpent && !current.isSpent) {
    if (canonicalJson(previous) !== canonicalJson(current)) {
      fail('TREASURY_RECONCILE_RECEIPT_UNSPENT_LIFECYCLE_CHANGED_' + ref)
    }
    return { newlySpent: false, newlyResolved: false }
  }
  if (previous.isSpent && !current.isSpent) {
    fail('TREASURY_RECONCILE_RECEIPT_SPEND_REGRESSION_' + ref)
  }
  if (previous.isSpent && resolvedReceiptLifecycle(previous) &&
      (!resolvedReceiptLifecycle(current) || canonicalJson(previous) !== canonicalJson(current))) {
    fail('TREASURY_RECONCILE_RECEIPT_CONSUMER_LINK_REGRESSION_' + ref)
  }
  if (current.isSpent && !resolvedReceiptLifecycle(current) &&
      !['SPENT_CONSUMER_PENDING', 'SPENT_CONSUMER_NOT_RECONSTRUCTED'].includes(current.state)) {
    fail('TREASURY_RECONCILE_RECEIPT_SPENT_STATE_INVALID_' + ref)
  }
  return {
    newlySpent: !previous.isSpent && current.isSpent,
    newlyResolved: previous.isSpent && !resolvedReceiptLifecycle(previous) && resolvedReceiptLifecycle(current),
  }
}

/**
 * Reconcile two independently produced full-history Treasury snapshots.
 *
 * This is a deterministic evidence comparator, not a persistence service, a
 * ledger-finality proof, a category ledger, or spending authority. The caller
 * must retain and supply the previous snapshot artifact on the next run.
 */
export function reconcileTreasuryJournalSnapshots({ previous, current }) {
  const priorMeta = journalSnapshotMeta(previous, 'PREVIOUS')
  const currentMeta = journalSnapshotMeta(current, 'CURRENT')
  if (previous.network !== current.network ||
      canonicalJson(previous.treasuryIdentity) !== canonicalJson(current.treasuryIdentity) ||
      String(previous.ticketPolicyId).toLowerCase() !== String(current.ticketPolicyId).toLowerCase() ||
      canonicalJson(previous.b1PrizePoolIdentity) !== canonicalJson(current.b1PrizePoolIdentity) ||
      canonicalJson(priorMeta.topology) !== canonicalJson(currentMeta.topology)) {
    fail('TREASURY_RECONCILE_DEPLOYMENT_IDENTITY_OR_TOPOLOGY_CHANGED')
  }
  if (currentMeta.tipHeight < priorMeta.tipHeight) fail('TREASURY_RECONCILE_TIP_REGRESSION')
  if (currentMeta.tipHeight === priorMeta.tipHeight && currentMeta.tipHash !== priorMeta.tipHash) {
    fail('TREASURY_RECONCILE_SAME_HEIGHT_TIP_HASH_CHANGED')
  }

  const previousRecords = snapshotOutputRecords(previous, 'PREVIOUS', { requireValues: false })
  const currentRecords = snapshotOutputRecords(current, 'CURRENT', { requireValues: true })
  const previousCustody = validateCustodySnapshot(previous, previousRecords, 'PREVIOUS', { requireCompleteValues: false })
  const currentCustody = validateCustodySnapshot(current, currentRecords, 'CURRENT', { requireCompleteValues: true })

  const previousEvents = mapUnique(previous.receiptEvents, (event) => event.receiptRef, 'TREASURY_RECONCILE_PREVIOUS_DUPLICATE_RECEIPT')
  const currentEvents = mapUnique(current.receiptEvents, (event) => event.receiptRef, 'TREASURY_RECONCILE_CURRENT_DUPLICATE_RECEIPT')
  const newlySpentReceiptRefs = []
  const newlyResolvedReceiptRefs = []
  for (const [ref, priorEvent] of previousEvents) {
    const nextEvent = currentEvents.get(ref)
    if (!nextEvent) fail('TREASURY_RECONCILE_RECEIPT_DISAPPEARED_' + ref)
    if (canonicalJson(immutableReceiptProjection(priorEvent)) !== canonicalJson(immutableReceiptProjection(nextEvent))) {
      fail('TREASURY_RECONCILE_RECEIPT_IMMUTABLE_EVIDENCE_CHANGED_' + ref)
    }
    const transition = compareReceiptLifecycle(priorEvent.lifecycle, nextEvent.lifecycle, ref)
    if (transition.newlySpent) newlySpentReceiptRefs.push(ref)
    if (transition.newlyResolved) newlyResolvedReceiptRefs.push(ref)
  }

  const historicalBackfillReceiptRefs = []
  const addedReceiptRefs = []
  for (const [ref, event] of currentEvents) {
    if (previousEvents.has(ref)) continue
    if (Number(event.block.height) <= priorMeta.tipHeight) historicalBackfillReceiptRefs.push(ref)
    else addedReceiptRefs.push(ref)
  }

  const newlyDiscoveredHistoricalOutputRefs = []
  for (const [ref, oldRow] of previousRecords) {
    const nextRow = currentRecords.get(ref)
    if (!nextRow) fail('TREASURY_RECONCILE_TREASURY_OUTPUT_DISAPPEARED_' + ref)
    if (oldRow.kind !== nextRow.kind || oldRow.blockHeight !== nextRow.blockHeight) {
      fail('TREASURY_RECONCILE_TREASURY_OUTPUT_IDENTITY_CHANGED_' + ref)
    }
    if (oldRow.kind === 'non-sale' && oldRow.reason !== nextRow.reason) {
      fail('TREASURY_RECONCILE_NON_SALE_CLASSIFICATION_CHANGED_' + ref)
    }
    if (oldRow.isSpent && !nextRow.isSpent) fail('TREASURY_RECONCILE_TREASURY_OUTPUT_SPEND_REGRESSION_' + ref)
    if (oldRow.lovelace !== null && (oldRow.lovelace !== nextRow.lovelace ||
        canonicalJson(oldRow.nativeAssets) !== canonicalJson(nextRow.nativeAssets))) {
      fail('TREASURY_RECONCILE_TREASURY_OUTPUT_VALUE_CHANGED_' + ref)
    }
  }
  for (const [ref, row] of currentRecords) {
    if (!previousRecords.has(ref) && row.blockHeight <= priorMeta.tipHeight) {
      newlyDiscoveredHistoricalOutputRefs.push(ref)
    }
  }

  const previousCustodyRefs = new Set(previous.treasuryCustody.outputRefs)
  const currentCustodyRefs = new Set(current.treasuryCustody.outputRefs)
  const removedCustodyOutputRefs = [...previousCustodyRefs].filter((ref) => !currentCustodyRefs.has(ref)).sort()
  const addedCustodyOutputRefs = [...currentCustodyRefs].filter((ref) => !previousCustodyRefs.has(ref)).sort()
  for (const ref of removedCustodyOutputRefs) {
    const row = currentRecords.get(ref)
    if (!row || !row.isSpent) fail('TREASURY_RECONCILE_CUSTODY_OUTPUT_REMOVED_WITHOUT_SPEND_EVIDENCE_' + ref)
  }
  for (const ref of addedCustodyOutputRefs) {
    const row = currentRecords.get(ref)
    if (!row || row.isSpent) fail('TREASURY_RECONCILE_CUSTODY_OUTPUT_ADDED_BUT_MARKED_SPENT_' + ref)
  }

  const allUnits = new Set([...previousCustody.totals.keys(), ...currentCustody.totals.keys()])
  const custodyDeltaByAsset = [...allUnits]
    .map((unit) => ({
      unit,
      delta: ((currentCustody.totals.get(unit) ?? 0n) - (previousCustody.totals.get(unit) ?? 0n)).toString(),
    }))
    .filter((row) => BigInt(row.delta) !== 0n)
    .sort(compareAssetUnits)

  const artifactFingerprintsChanged =
    canonicalJson(priorMeta.artifactFingerprints) !== canonicalJson(currentMeta.artifactFingerprints)
  const historicalBackfill = historicalBackfillReceiptRefs.length > 0 ||
    newlyDiscoveredHistoricalOutputRefs.length > 0
  const sameTip = currentMeta.tipHeight === priorMeta.tipHeight && currentMeta.tipHash === priorMeta.tipHash

  let disposition = 'STRUCTURAL_RECONCILIATION_ONLY_TIP_ANCESTRY_UNPROVEN'
  if (sameTip) disposition = 'SAME_TIP_SNAPSHOT_RECONCILED'
  if (historicalBackfill) disposition = 'HISTORICAL_BACKFILL_REQUIRES_REVIEW'
  if (artifactFingerprintsChanged) disposition = 'DEPLOYMENT_ARTIFACT_FINGERPRINT_CHANGE_REQUIRES_REVIEW'

  return {
    schema: 'PRE-RICH-TREASURY-CROSS-SNAPSHOT-RECONCILIATION-v1',
    disposition,
    chainContinuity: sameTip ? 'SAME_TIP_HASH_MATCHED' : 'PRIOR_TIP_ANCESTRY_NOT_PROVEN_BY_THIS_RECONCILER',
    previousSnapshot: { blockHeight: priorMeta.tipHeight, blockHash: priorMeta.tipHash },
    currentSnapshot: { blockHeight: currentMeta.tipHeight, blockHash: currentMeta.tipHash },
    eventDelta: {
      priorReceiptCount: previousEvents.size,
      currentReceiptCount: currentEvents.size,
      addedReceiptRefs: addedReceiptRefs.sort(),
      historicalBackfillReceiptRefs: historicalBackfillReceiptRefs.sort(),
      newlySpentReceiptRefs: newlySpentReceiptRefs.sort(),
      newlyResolvedReceiptRefs: newlyResolvedReceiptRefs.sort(),
    },
    treasuryOutputDelta: {
      addedCustodyOutputRefs,
      removedCustodyOutputRefs,
      newlyDiscoveredHistoricalOutputRefs: newlyDiscoveredHistoricalOutputRefs.sort(),
    },
    custodyDeltaByAsset,
    evidenceQuality: {
      previousCustodyOutputValuesComplete: previousCustody.complete,
      currentCustodyOutputValuesComplete: currentCustody.complete,
      deploymentArtifactFingerprintsChanged: artifactFingerprintsChanged,
      ledgerFinalityEstablished: false,
      previousTipAncestryVerified: sameTip,
      categoryPostingPerformed: false,
      spendAuthorizationGranted: false,
    },
    limitations: [
      'This comparison is deterministic but stateless; the caller must retain and supply the previous snapshot artifact.',
      'A higher current tip does not prove that the previous tip is an ancestor; this function does not verify full Cardano header-chain continuity.',
      'Provider responses are indexed observation evidence, not an independent ledger proof or finality certificate.',
      'Custody deltas are raw asset-unit differences only; no USDM valuation, category posting, EEV claim or spend authority is inferred.',
    ],
  }
}

/**
 * Reconstruct all canonical Treasury outputs from the complete address_txs
 * transaction set and tx_info outputs. address_outputs remains an independent
 * cross-check; this derived list avoids relying on its historical cursor edge.
 */
export function deriveTreasuryAddressOutputs({
  treasuryAddress,
  treasuryPaymentCredential,
  transactions,
}) {
  if (typeof treasuryAddress !== 'string' || treasuryAddress.length === 0) fail('TREASURY_JOURNAL_TREASURY_ADDRESS_REQUIRED')
  if (!HASH_28.test(String(treasuryPaymentCredential ?? ''))) fail('TREASURY_JOURNAL_TREASURY_CREDENTIAL_INVALID')
  if (!Array.isArray(transactions)) fail('TREASURY_JOURNAL_TX_ARRAY_REQUIRED')

  const credential = treasuryPaymentCredential.toLowerCase()
  const txRows = transactions.map((tx) => parseTransaction(tx, { ticketPolicyId: '00'.repeat(28) }))
  const spentRefs = new Set()

  for (const tx of txRows) {
    if (!tx.validContract) continue
    for (const input of tx.inputs) {
      // Any input consuming a canonical Treasury output marks it spent.
      // The tx_info transaction set is discovered through address_txs, which
      // includes both creation and consumption transactions for the address.
      spentRefs.add(input.ref)
    }
  }

  const outputs = []
  const seen = new Set()
  const sourceTxByHash = new Map(txRows.map((tx) => [tx.txHash, tx]))

  for (const tx of txRows) {
    if (!tx.validContract) continue
    for (const output of tx.outputs) {
      const byAddress = output.address === treasuryAddress
      const byCredential = output.paymentCredential === credential
      if (!byAddress && !byCredential) continue
      if (!byAddress || !byCredential) {
        fail('TREASURY_JOURNAL_DERIVED_OUTPUT_IDENTITY_MISMATCH_' + output.ref)
      }
      if (seen.has(output.ref)) fail('TREASURY_JOURNAL_DERIVED_OUTPUT_DUPLICATE_' + output.ref)
      seen.add(output.ref)
      outputs.push({
        address: treasuryAddress,
        tx_hash: tx.txHash,
        tx_index: output.txIndex,
        block_height: tx.blockHeight,
        block_time: tx.txTimestamp,
        payment_cred: credential,
        is_spent: spentRefs.has(output.ref),
      })
    }
  }

  // A consuming input must preserve the identity of the referenced canonical
  // Treasury output. A matching out-ref with contradictory provider metadata
  // is not accepted as spend-lineage evidence.
  const canonicalOutputsByRef = new Map()
  for (const row of outputs) {
    const sourceTx = sourceTxByHash.get(row.tx_hash)
    const sourceOutput = sourceTx?.outputs.find((output) => output.ref === row.tx_hash + '#' + row.tx_index)
    if (!sourceOutput) fail('TREASURY_JOURNAL_DERIVED_OUTPUT_SOURCE_REF_MISSING_' + row.tx_hash + '#' + row.tx_index)
    canonicalOutputsByRef.set(sourceOutput.ref, sourceOutput)
  }
  for (const tx of txRows) {
    if (!tx.validContract) continue
    for (const input of tx.inputs) {
      const originOutput = canonicalOutputsByRef.get(input.ref)
      if (!originOutput) continue
      if (input.address !== treasuryAddress || input.paymentCredential !== credential) {
        fail('TREASURY_JOURNAL_SPENT_INPUT_IDENTITY_MISMATCH_' + input.ref)
      }
      if (!sameUtxoValue(input, originOutput)) {
        fail('TREASURY_JOURNAL_SPENT_INPUT_VALUE_MISMATCH_' + input.ref)
      }
    }
  }

  // Sanity check that each derived ref belongs to the exact transaction
  // that supplied its output, not just a matching address/credential string.
  for (const row of outputs) {
    if (!sourceTxByHash.has(row.tx_hash)) fail('TREASURY_JOURNAL_DERIVED_OUTPUT_SOURCE_TX_MISSING_' + row.tx_hash)
  }

  outputs.sort((a, b) => Number(a.block_height) - Number(b.block_height)
    || String(a.tx_hash).localeCompare(String(b.tx_hash))
    || Number(a.tx_index) - Number(b.tx_index))
  return outputs
}

export function assertTreasuryAddressOutputCrossCheck({ providerRows, derivedRows, treasuryAddress }) {
  if (typeof treasuryAddress !== 'string' || treasuryAddress.length === 0) fail('TREASURY_JOURNAL_TREASURY_ADDRESS_REQUIRED')
  if (!Array.isArray(providerRows) || !Array.isArray(derivedRows)) fail('TREASURY_JOURNAL_CROSSCHECK_ARRAYS_REQUIRED')
  const derived = mapUnique(derivedRows.map((row) => normalizeAddressOutput(row, treasuryAddress)),
    (row) => row.ref, 'TREASURY_JOURNAL_CROSSCHECK_DERIVED_DUPLICATE')
  const observed = mapUnique(providerRows.map((row) => normalizeAddressOutput(row, treasuryAddress)),
    (row) => row.ref, 'TREASURY_JOURNAL_CROSSCHECK_PROVIDER_DUPLICATE')

  for (const [ref, row] of observed) {
    const expected = derived.get(ref)
    if (!expected) fail('TREASURY_JOURNAL_ADDRESS_OUTPUT_NOT_IN_TX_INFO_HISTORY_' + ref)
    if (row.blockHeight !== expected.blockHeight || row.blockTime !== expected.blockTime ||
        row.paymentCredential !== expected.paymentCredential || row.isSpent !== expected.isSpent) {
      fail('TREASURY_JOURNAL_ADDRESS_OUTPUT_TX_INFO_MISMATCH_' + ref)
    }
  }

  return {
    providerRows: observed.size,
    derivedRows: derived.size,
    providerRowsMissingFromEndpoint: Math.max(0, derived.size - observed.size),
    exactMatches: observed.size,
  }
}
