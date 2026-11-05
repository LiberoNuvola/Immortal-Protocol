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

function normalizeAssetList(assets, codePrefix) {
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
    return {
      policyId,
      assetNameHex,
      unit,
      quantity: integerString(asset.quantity, codePrefix + '_ASSET_QUANTITY_INVALID'),
    }
  })
  normalized.sort((a, b) => a.unit.localeCompare(b.unit))
  return normalized
}

function parseTransaction(tx, expected) {
  if (!tx || typeof tx !== 'object') fail('TREASURY_JOURNAL_TX_INFO_INVALID')
  const txHash = normalizedHash(tx.tx_hash)
  if (typeof tx.valid_contract !== 'boolean') fail('TREASURY_JOURNAL_TX_VALIDITY_MISSING_' + txHash)
  if (!Array.isArray(tx.inputs) || !Array.isArray(tx.outputs) || !Array.isArray(tx.assets_minted)) {
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
    return { ref, address, paymentCredential: credential }
  })

  const minted = normalizeAssetList(tx.assets_minted, 'TREASURY_JOURNAL_MINT_' + txHash)
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
        physicalValuePreservedByValidator: true,
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
        state: retained.length > 0 ? 'SPENT_RETAINED_IN_TREASURY_CUSTODY' : 'SPENT_OUTSIDE_TREASURY_CUSTODY',
        consumingTransactionHash: consumerHash,
        retainedTreasuryOutputRefs: retained,
      }
    } else if (event.lifecycle.isSpent) {
      event.lifecycle.state = 'SPENT_CONSUMER_NOT_RECONSTRUCTED'
    }
  }

  const receiptRefs = new Set(receiptEvents.map((event) => event.receiptRef))
  for (const row of treasuryOutputMap.values()) {
    if (!receiptRefs.has(row.ref)) {
      nonSaleTreasuryOutputs.push({
        outputRef: row.ref,
        blockHeight: row.blockHeight,
        isSpent: row.isSpent,
        reason: 'NO_EXACT_TICKET_POLICY_MINT_LINK_IN_OBSERVED_TRANSACTION_SET',
      })
    }
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
      return {
        transactionHash,
        consumedReceiptRefs: consumedReceiptRefs.sort(),
        retainedTreasuryOutputRefs: tx.outputs
          .filter((output) => output.paymentCredential === expected.treasuryPaymentCredential)
          .map((output) => output.ref)
          .sort(),
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
