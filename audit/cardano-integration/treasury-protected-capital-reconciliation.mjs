const JOURNAL_SCHEMA = 'PRE-RICH-TREASURY-TICKET-SALE-RECEIPT-JOURNAL-v1'
const LEDGER_SCHEMA = 'PRE-RICH-TICKET-ITEM-LEDGER-V1'

function fail(code) {
  throw new Error(code)
}

function normalizeNetwork(value) {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  if (normalized === 'preprod' || normalized === 'cardanopreprod') return 'preprod'
  if (normalized === 'mainnet' || normalized === 'cardanomainnet') return 'mainnet'
  return normalized
}

function uniqueMap(rows, keyOf, code) {
  const result = new Map()
  for (const row of rows) {
    const key = keyOf(row)
    if (result.has(key)) fail(code + ':' + key)
    result.set(key, row)
  }
  return result
}

function ledgerIdentity(item) {
  const prefix = 'cardano-ticket:'
  if (typeof item?.itemId !== 'string' || !item.itemId.startsWith(prefix)) {
    fail('PC_RECONCILE_LEDGER_ITEM_ID_INVALID')
  }
  const identity = item.itemId.slice(prefix.length).toLowerCase()
  const match = /^([0-9a-f]{56})\.((?:[0-9a-f]{2}){0,32})$/.exec(identity)
  if (!match) fail('PC_RECONCILE_LEDGER_ITEM_IDENTITY_INVALID:' + item.itemId)
  return { policyId: match[1], assetNameHex: match[2], unit: match[1] + match[2] }
}

function txHashFromUtxoReference(reference) {
  if (typeof reference !== 'string') return null
  const match = /^([0-9a-f]{64})#(?:0|[1-9][0-9]*)$/i.exec(reference)
  return match ? match[1].toLowerCase() : null
}

/**
 * Reconcile observed TicketSale receipts against the current PrizeDatum item
 * census. This is an identity/lifecycle crosswalk only: it does not value,
 * post, settle, or authorize any Treasury amount.
 */
export function reconcileTicketSalesToProtectedCapital({ journal, ledger }) {
  if (journal?.schema !== JOURNAL_SCHEMA) fail('PC_RECONCILE_TREASURY_JOURNAL_SCHEMA_INVALID')
  if (ledger?.schemaVersion !== LEDGER_SCHEMA) fail('PC_RECONCILE_PROTECTED_CAPITAL_LEDGER_SCHEMA_INVALID')
  if (!Array.isArray(journal.receiptEvents) || !Array.isArray(ledger.items)) {
    fail('PC_RECONCILE_SOURCE_COLLECTIONS_INVALID')
  }

  const blockers = []
  const eventNetworks = [...new Set(journal.receiptEvents.map((event) => normalizeNetwork(event?.network)).filter(Boolean))]
  const journalNetwork = normalizeNetwork(journal.network ?? journal.observation?.network ?? eventNetworks[0])
  const ledgerNetwork = normalizeNetwork(ledger.source?.network)
  if (!journalNetwork) blockers.push('TREASURY_JOURNAL_NETWORK_MISSING')
  if (eventNetworks.length > 1 || (journalNetwork && eventNetworks.some((network) => network !== journalNetwork))) {
    blockers.push('TREASURY_JOURNAL_EVENT_NETWORK_MISMATCH')
  }
  if (!ledgerNetwork || (journalNetwork && journalNetwork !== ledgerNetwork)) blockers.push('NETWORK_MISMATCH')

  const journalPolicy = String(journal.observation?.derivedTopology?.ticketPolicyId ?? '').toLowerCase()
  const ledgerPolicy = String(ledger.source?.ticketPolicyId ?? '').toLowerCase()
  if (!/^[0-9a-f]{56}$/.test(journalPolicy) || !/^[0-9a-f]{56}$/.test(ledgerPolicy)) {
    blockers.push('TICKET_POLICY_ID_MISSING_OR_INVALID')
  } else if (journalPolicy !== ledgerPolicy) {
    blockers.push('TICKET_POLICY_ID_MISMATCH')
  }

  const treasurySlot = journal.observation?.snapshotTip?.absoluteSlot
  const protectedCapitalSlot = ledger.source?.observedSlot
  if (treasurySlot == null || protectedCapitalSlot == null ||
      !Number.isSafeInteger(Number(treasurySlot)) || !Number.isSafeInteger(Number(protectedCapitalSlot))) {
    blockers.push('SNAPSHOT_SLOT_MISSING_OR_INVALID')
  } else if (Number(treasurySlot) !== Number(protectedCapitalSlot)) {
    blockers.push('SNAPSHOT_SLOT_MISMATCH')
  }

  const receipts = journal.receiptEvents.map((event) => {
    const policyId = String(event?.ticket?.policyId ?? '').toLowerCase()
    const assetNameHex = String(event?.ticket?.assetNameHex ?? '').toLowerCase()
    if (!/^[0-9a-f]{56}$/.test(policyId) || !/^(?:[0-9a-f]{2}){0,32}$/.test(assetNameHex)) {
      fail('PC_RECONCILE_RECEIPT_TICKET_IDENTITY_INVALID')
    }
    if (event.ticket.unit !== policyId + assetNameHex || event.ticket.quantity !== '1') {
      fail('PC_RECONCILE_RECEIPT_TICKET_UNIT_OR_QUANTITY_INVALID')
    }
    if (policyId !== journalPolicy) fail('PC_RECONCILE_RECEIPT_POLICY_DIFFERS_FROM_JOURNAL_TOPOLOGY')
    return { event, unit: policyId + assetNameHex }
  })
  const receiptByUnit = uniqueMap(receipts, (row) => row.unit, 'PC_RECONCILE_DUPLICATE_RECEIPT_TICKET_IDENTITY')

  const ledgerRows = ledger.items.map((item) => {
    const identity = ledgerIdentity(item)
    if (identity.policyId !== ledgerPolicy) fail('PC_RECONCILE_LEDGER_ITEM_POLICY_DIFFERS_FROM_SOURCE')
    const txHash = txHashFromUtxoReference(item.utxoReference)
    if (!txHash) fail('PC_RECONCILE_LEDGER_ITEM_UTXO_REFERENCE_INVALID')
    return { item, ...identity, currentUtxoTxHash: txHash }
  })
  const ledgerByUnit = uniqueMap(ledgerRows, (row) => row.unit, 'PC_RECONCILE_DUPLICATE_LEDGER_TICKET_IDENTITY')

  const matched = []
  const receiptWithoutCurrentDatum = []
  for (const [unit, receiptRow] of receiptByUnit) {
    const ledgerRow = ledgerByUnit.get(unit)
    if (!ledgerRow) {
      receiptWithoutCurrentDatum.push({
        ticketUnit: unit,
        receiptRef: receiptRow.event.receiptRef,
        transactionHash: receiptRow.event.transactionHash,
        status: 'RECEIPT_WITHOUT_CURRENT_LIVE_PRIZEDATUM',
        interpretation: 'The current PrizeValidator census has no matching live datum; historical lifecycle replay is required before drawing conclusions.',
      })
      continue
    }
    matched.push({
      ticketUnit: unit,
      receiptRef: receiptRow.event.receiptRef,
      issueTransactionHash: receiptRow.event.transactionHash,
      currentPrizeDatumUtxoTransactionHash: ledgerRow.currentUtxoTxHash,
      prizeDatumUtxoReference: ledgerRow.item.utxoReference,
      prizeDatumDigest: ledgerRow.item.datumDigest,
      r7Cell: ledgerRow.item.r7Cell,
      pcComponent: ledgerRow.item.pcComponent,
      classificationReason: ledgerRow.item.classificationReason,
      status: 'RECEIPT_AND_CURRENT_PRIZEDATUM_IDENTITY_MATCHED',
    })
  }

  const ledgerWithoutReceipt = []
  for (const [unit, ledgerRow] of ledgerByUnit) {
    if (receiptByUnit.has(unit)) continue
    ledgerWithoutReceipt.push({
      ticketUnit: unit,
      prizeDatumUtxoReference: ledgerRow.item.utxoReference,
      status: 'CURRENT_PRIZEDATUM_WITHOUT_MATCHING_OBSERVED_RECEIPT',
      interpretation: 'The supplied Treasury journal does not contain this mint receipt; verify history coverage and retained observation provenance.',
    })
  }

  const bothPopulationsEmpty = receipts.length === 0 && ledgerRows.length === 0
  const nonemptyOneToOneMatch = !bothPopulationsEmpty
    && blockers.length === 0
    && receiptWithoutCurrentDatum.length === 0
    && ledgerWithoutReceipt.length === 0
    && matched.length === receipts.length
    && matched.length === ledgerRows.length

  const populationDisposition = bothPopulationsEmpty
    ? 'EMPTY_INPUT_POPULATIONS'
    : nonemptyOneToOneMatch
      ? 'NONEMPTY_ONE_TO_ONE_MATCH'
      : 'NONEMPTY_UNRECONCILED'

  return {
    schema: 'PRE-RICH-TICKETSALE-PROTECTED-CAPITAL-CROSSWALK-v1',
    qualification: {
      populationDisposition,
      identityCrosswalkComplete: nonemptyOneToOneMatch,
      providedSetIdentityCrosswalkComplete: nonemptyOneToOneMatch,
      treasuryJournalHistoryCompletenessVerified: false,
      protectedCapitalSourceCompletenessAuthorityVerified: false,
      economicPostingQualified: false,
      fullProtectedCapitalQualified: false,
      spendAuthorizationGranted: false,
      blockers: [...new Set(blockers)].sort(),
    },
    snapshots: {
      network: ledgerNetwork || journalNetwork,
      treasurySnapshotSlot: treasurySlot == null ? null : Number(treasurySlot),
      protectedCapitalSnapshotSlot: protectedCapitalSlot == null ? null : Number(protectedCapitalSlot),
      exactSnapshotSlotMatch: blockers.includes('SNAPSHOT_SLOT_MISSING_OR_INVALID') || blockers.includes('SNAPSHOT_SLOT_MISMATCH') ? false : true,
    },
    counts: {
      receiptCount: receipts.length,
      protectedCapitalItemCount: ledgerRows.length,
      matchedCount: matched.length,
      receiptWithoutCurrentDatumCount: receiptWithoutCurrentDatum.length,
      ledgerWithoutReceiptCount: ledgerWithoutReceipt.length,
    },
    matched,
    receiptWithoutCurrentDatum,
    ledgerWithoutReceipt,
    limitations: [
      'The crosswalk matches immutable ticket identity; the Issue transaction hash is retained as receipt provenance but is not compared with the current PrizeDatum UTxO transaction hash because lifecycle transitions may recreate the datum.',
      'A missing current PrizeDatum does not prove that no obligation ever existed; consumed lifecycle history is outside this current-UTxO census.',
      'A missing Treasury receipt does not prove that a ticket was never sold; journal history coverage must be independently qualified.',
      'No Treasury asset valuation, category posting, EEV credit, ProtectedCapital perimeter certification, settlement or spend authority is inferred.',
      'The result is qualified only when both source snapshots have the exact same observed slot and every ticket identity is one-to-one matched.',
    ],
  }
}
