/**
 * Read-only PRE-RICH ProtectedCapital ticket item ledger.
 *
 * This module consumes a caller-supplied, fully enumerated PrizeValidator
 * source snapshot. It does not query a provider, sign, submit, or mutate.
 *
 * It can qualify the ticket-derived L1/L3 slice only. It never certifies the
 * full ProtectedCapital perimeter, SafetyCapital, ReserveProtection,
 * MandatoryFutureCosts, or global R7 L6 emptiness.
 */

import {
  PRE_RICH_CANONICAL_PRICES,
  PRE_RICH_MAX_NORMAL_PAYOUT_MULTIPLIER,
  USDM_SUBUNITS_PER_REFERENCE_UNIT,
} from './PreRichCardanoObservationProjection'

export type PrizeLedgerStatus = 'Pending' | 'Revealed' | 'Claimed'
export type PrizeLedgerBeaconStatus = 'BeaconPending' | 'BeaconReady'
export type PrizeLedgerR7Cell = 'L1' | 'L3' | 'L4' | 'L5' | 'L6'
export type PrizeLedgerPcComponent =
  | 'crystallizedLiabilities'
  | 'worstCaseExposure'
  | null

export type ObservedPrizeDatumForLedger = {
  utxoReference: string
  datumDigest: string
  ticketPolicyId: string
  ticketAssetNameHex: string
  nftPolicyId: string
  nftAssetNameHex: string
  nftQuantity: bigint
  prizePoolHash: string
  priceUsdmSubunits: bigint
  prizeAmountUsdmSubunits: bigint
  prizeStatus: string
  beaconStatus: string
  issuedAt: bigint
  expiresAt: bigint
}

export type PrizePoolAggregateForLedger = {
  utxoReference: string
  datumDigest: string
  snapshotReference: string
  prizeValidatorHash: string
  pendingLiabilitiesUsdmSubunits: bigint
  unresolvedReserveUsdmSubunits: bigint
  unresolvedTicketCount: bigint
  lockedJackpotUsdmSubunits: bigint
  jackpotThresholdUsdmSubunits: bigint
}

export type PrizeDatumSourceCensus = {
  network: string
  observedSlot: bigint
  observedAt: bigint
  providerId: string
  snapshotReference: string
  sourceReference: string
  sourceManifestDigest: string
  prizeValidatorAddress: string
  prizeValidatorHash: string
  b1PrizePoolScriptHash: string
  ticketPolicyId: string
  paginationComplete: boolean
  pageCount: bigint
  sourceUtxoCount: bigint
  decodedPrizeDatumCount: bigint
  unclassifiedUtxoCount: bigint
  pool: PrizePoolAggregateForLedger
  records: ObservedPrizeDatumForLedger[]
}

export type PrizeDatumLedgerItem = {
  itemId: string
  utxoReference: string
  datumDigest: string
  prizeStatus: string
  beaconStatus: string
  r7Cell: PrizeLedgerR7Cell
  pcComponent: PrizeLedgerPcComponent
  classId: bigint | null
  priceUsdmSubunits: bigint
  priceReferenceUnits: bigint | null
  prizeAmountUsdmSubunits: bigint
  countedAmountReferenceUnits: bigint
  classificationReason: string
}

export type PreRichProtectedCapitalItemLedger = {
  schemaVersion: 'PRE-RICH-TICKET-ITEM-LEDGER-V1'
  qualification: {
    ticketLedgerQualified: boolean
    fullProtectedCapitalQualified: false
    blockers: string[]
    scope: 'PRIZE_VALIDATOR_TICKET_POPULATION_ONLY'
    r7L6EmptinessProven: false
  }
  source: {
    network: string
    observedSlot: bigint
    observedAt: bigint
    providerId: string
    snapshotReference: string
    sourceReference: string
    sourceManifestDigest: string
    prizeValidatorAddress: string
    prizeValidatorHash: string
    b1PrizePoolScriptHash: string
    ticketPolicyId: string
    pageCount: bigint
    sourceUtxoCount: bigint
    decodedPrizeDatumCount: bigint
    unclassifiedUtxoCount: bigint
    poolUtxoReference: string
    poolDatumDigest: string
  }
  items: PrizeDatumLedgerItem[]
  totals: {
    l1PayoutUsdmSubunits: bigint
    l1PayoutReferenceUnits: bigint
    l1ItemCount: bigint
    l3FacePriceUsdmSubunits: bigint
    l3FacePriceReferenceUnits: bigint
    l3TicketCount: bigint
    l3WorstCaseExposureReferenceUnits: bigint
    l4SettledItemCount: bigint
    l5ResolvedOrExpiredItemCount: bigint
    l6UnclassifiedItemCount: bigint
    l2LockedJackpotUsdmSubunits: bigint
    l2LockedJackpotReferenceUnits: bigint
    l2Status: 'ZERO_AT_THIS_SNAPSHOT' | 'AGGREGATE_ONLY_LIFECYCLE_NOT_PROVEN'
  }
  reconciliation: {
    l1MatchesB1PendingLiabilities: boolean
    l3FacePriceMatchesB1UnresolvedReserve: boolean
    l3CountMatchesB1UnresolvedTicketCount: boolean
    allSourceOutputsAccountedFor: boolean
  }
}

function requireNonNegative(value: bigint, field: string): void {
  if (value < 0n) throw new Error(field + ' must be non-negative')
}

function requireHex(value: string, bytes: number, field: string): void {
  if (!(new RegExp('^[0-9a-fA-F]{' + (bytes * 2) + '}$')).test(value)) {
    throw new Error(field + ' must be exactly ' + bytes + ' bytes of hex')
  }
}

function requireAssetNameHex(value: string, field: string): void {
  if (!/^(?:[0-9a-fA-F]{2}){0,32}$/.test(value)) {
    throw new Error(field + ' must be zero to 32 bytes of hex')
  }
}

function requireUtxoReference(value: string, field: string): void {
  if (!/^[0-9a-fA-F]{64}#[0-9]+$/.test(value)) {
    throw new Error(field + ' must be an exact txHash#outputIndex reference')
  }
}

function referenceUnitsFromSubunits(value: bigint, field: string): bigint {
  requireNonNegative(value, field)
  if (value % USDM_SUBUNITS_PER_REFERENCE_UNIT !== 0n) {
    throw new Error(field + ' is not representable in whole IMMORTAL reference units')
  }
  return value / USDM_SUBUNITS_PER_REFERENCE_UNIT
}

function classifyPrizeDatum(
  record: ObservedPrizeDatumForLedger,
): Omit<PrizeDatumLedgerItem, 'itemId' | 'utxoReference' | 'datumDigest'> {
  const common = {
    prizeStatus: record.prizeStatus,
    beaconStatus: record.beaconStatus,
    priceUsdmSubunits: record.priceUsdmSubunits,
    prizeAmountUsdmSubunits: record.prizeAmountUsdmSubunits,
  }

  requireNonNegative(record.priceUsdmSubunits, 'ticket price')
  requireNonNegative(record.prizeAmountUsdmSubunits, 'ticket prize amount')
  requireNonNegative(record.issuedAt, 'ticket issuedAt')
  requireNonNegative(record.expiresAt, 'ticket expiresAt')
  if (record.expiresAt < record.issuedAt) {
    throw new Error('ticket expiresAt must not precede issuedAt')
  }

  if (record.prizeStatus === 'Pending') {
    if (record.prizeAmountUsdmSubunits !== 0n) {
      return {
        ...common,
        r7Cell: 'L6',
        pcComponent: null,
        classId: null,
        priceReferenceUnits: null,
        countedAmountReferenceUnits: 0n,
        classificationReason: 'Pending datum carries a non-zero payout amount',
      }
    }
    if (
      record.beaconStatus !== 'BeaconPending' &&
      record.beaconStatus !== 'BeaconReady'
    ) {
      return {
        ...common,
        r7Cell: 'L6',
        pcComponent: null,
        classId: null,
        priceReferenceUnits: null,
        countedAmountReferenceUnits: 0n,
        classificationReason: 'Pending datum has an unsupported Beacon status',
      }
    }

    if (record.priceUsdmSubunits === 0n ||
        record.priceUsdmSubunits % USDM_SUBUNITS_PER_REFERENCE_UNIT !== 0n) {
      return {
        ...common,
        r7Cell: 'L6',
        pcComponent: null,
        classId: null,
        priceReferenceUnits: null,
        countedAmountReferenceUnits: 0n,
        classificationReason: 'Pending ticket price is zero or not representable in reference units',
      }
    }

    const priceReferenceUnits =
      record.priceUsdmSubunits / USDM_SUBUNITS_PER_REFERENCE_UNIT
    const classIndex = PRE_RICH_CANONICAL_PRICES.findIndex(
      (price) => price === priceReferenceUnits,
    )
    if (classIndex < 0) {
      return {
        ...common,
        r7Cell: 'L6',
        pcComponent: null,
        classId: null,
        priceReferenceUnits,
        countedAmountReferenceUnits: 0n,
        classificationReason: 'Pending ticket price is not in the canonical PRE-RICH ladder',
      }
    }

    return {
      ...common,
      r7Cell: 'L3',
      pcComponent: 'worstCaseExposure',
      classId: BigInt(classIndex),
      priceReferenceUnits,
      countedAmountReferenceUnits:
        PRE_RICH_MAX_NORMAL_PAYOUT_MULTIPLIER * priceReferenceUnits,
      classificationReason: 'Live unresolved ticket; deterministic PRE-RICH worst-case exposure',
    }
  }

  if (record.prizeStatus === 'Revealed') {
    if (record.prizeAmountUsdmSubunits === 0n) {
      return {
        ...common,
        r7Cell: 'L5',
        pcComponent: null,
        classId: null,
        priceReferenceUnits: null,
        countedAmountReferenceUnits: 0n,
        classificationReason: 'Revealed loss; no crystallized payout remains',
      }
    }
    const payoutReferenceUnits = referenceUnitsFromSubunits(
      record.prizeAmountUsdmSubunits,
      'revealed prize amount',
    )
    return {
      ...common,
      r7Cell: 'L1',
      pcComponent: 'crystallizedLiabilities',
      classId: null,
      priceReferenceUnits: null,
      countedAmountReferenceUnits: payoutReferenceUnits,
      classificationReason: 'Revealed positive payout remains live until Claim or valid Expire is observed',
    }
  }

  if (record.prizeStatus === 'Claimed') {
    if (record.prizeAmountUsdmSubunits === 0n) {
      return {
        ...common,
        r7Cell: 'L6',
        pcComponent: null,
        classId: null,
        priceReferenceUnits: null,
        countedAmountReferenceUnits: 0n,
        classificationReason: 'Claimed datum has no positive crystallized payout',
      }
    }
    referenceUnitsFromSubunits(record.prizeAmountUsdmSubunits, 'claimed prize amount')
    return {
      ...common,
      r7Cell: 'L4',
      pcComponent: null,
      classId: null,
      priceReferenceUnits: null,
      countedAmountReferenceUnits: 0n,
      classificationReason: 'Claimed ticket; historical settled record, not live ProtectedCapital',
    }
  }

  return {
    ...common,
    r7Cell: 'L6',
    pcComponent: null,
    classId: null,
    priceReferenceUnits: null,
    countedAmountReferenceUnits: 0n,
    classificationReason: 'Unsupported PrizeDatum status',
  }
}

/**
 * Build a deterministic item ledger from a claimed-complete PrizeValidator
 * snapshot. Completeness metadata is checked but cannot itself prove that an
 * upstream provider actually returned every page; retain the signed source
 * manifest and provider evidence alongside this result.
 */
export function buildPreRichProtectedCapitalItemLedger(
  census: PrizeDatumSourceCensus,
): PreRichProtectedCapitalItemLedger {
  if (!census.network.trim()) throw new Error('source network is required')
  if (!census.providerId.trim()) throw new Error('source providerId is required')
  if (!census.snapshotReference.trim()) throw new Error('source snapshotReference is required')
  if (!census.sourceReference.trim()) throw new Error('source sourceReference is required')
  if (!census.prizeValidatorAddress.trim()) throw new Error('PrizeValidator address is required')
  if (!census.records) throw new Error('PrizeDatum source records are required')

  requireNonNegative(census.observedSlot, 'source observedSlot')
  requireNonNegative(census.observedAt, 'source observedAt')
  requireNonNegative(census.pageCount, 'source pageCount')
  requireNonNegative(census.sourceUtxoCount, 'sourceUtxoCount')
  requireNonNegative(census.decodedPrizeDatumCount, 'decodedPrizeDatumCount')
  requireNonNegative(census.unclassifiedUtxoCount, 'unclassifiedUtxoCount')
  requireHex(census.prizeValidatorHash, 28, 'prizeValidatorHash')
  requireHex(census.b1PrizePoolScriptHash, 28, 'b1PrizePoolScriptHash')
  requireHex(census.ticketPolicyId, 28, 'ticketPolicyId')
  requireHex(census.sourceManifestDigest, 32, 'sourceManifestDigest')
  requireUtxoReference(census.pool.utxoReference, 'Pool UTxO reference')
  requireHex(census.pool.datumDigest, 32, 'Pool datum digest')
  requireHex(census.pool.prizeValidatorHash, 28, 'Pool datum prizeValidatorHash')
  if (census.pool.snapshotReference !== census.snapshotReference) {
    throw new Error('Pool datum and PrizeDatum census must share the exact snapshot reference')
  }
  if (census.pool.prizeValidatorHash.toLowerCase() !== census.prizeValidatorHash.toLowerCase()) {
    throw new Error('B1 Pool prizeHash does not match the enumerated PrizeValidator hash')
  }

  const poolValues = [
    census.pool.pendingLiabilitiesUsdmSubunits,
    census.pool.unresolvedReserveUsdmSubunits,
    census.pool.unresolvedTicketCount,
    census.pool.lockedJackpotUsdmSubunits,
    census.pool.jackpotThresholdUsdmSubunits,
  ]
  poolValues.forEach((value, index) => requireNonNegative(value, 'Pool aggregate ' + index))

  const blockers: string[] = []
  if (!census.paginationComplete) blockers.push('PRIZE_ADDRESS_PAGINATION_NOT_COMPLETE')
  if (census.pageCount === 0n) blockers.push('PRIZE_ADDRESS_QUERY_HAS_NO_PAGE_EVIDENCE')
  if (census.decodedPrizeDatumCount !== BigInt(census.records.length)) {
    blockers.push('DECODED_PRIZEDATUM_COUNT_DOES_NOT_MATCH_RECORDS')
  }
  if (census.sourceUtxoCount !== census.decodedPrizeDatumCount + census.unclassifiedUtxoCount) {
    blockers.push('SOURCE_UTXO_COUNT_DOES_NOT_RECONCILE_TO_DECODED_AND_UNCLASSIFIED')
  }
  if (census.unclassifiedUtxoCount !== 0n) {
    blockers.push('UNCLASSIFIED_PRIZE_ADDRESS_UTXOS_PRESENT')
  }

  const seenIdentities = new Set<string>()
  let l1PayoutUsdmSubunits = 0n
  let l1ItemCount = 0n
  let l3FacePriceUsdmSubunits = 0n
  let l3TicketCount = 0n
  let l3WorstCaseExposureReferenceUnits = 0n
  let l4SettledItemCount = 0n
  let l5ResolvedOrExpiredItemCount = 0n
  let l6UnclassifiedItemCount = 0n

  const items = census.records.map((record) => {
    requireUtxoReference(record.utxoReference, 'PrizeDatum UTxO reference')
    requireHex(record.datumDigest, 32, 'PrizeDatum digest')
    requireHex(record.ticketPolicyId, 28, 'PrizeDatum ticket policy')
    requireAssetNameHex(record.ticketAssetNameHex, 'PrizeDatum ticket asset name')
    requireHex(record.nftPolicyId, 28, 'observed NFT policy')
    requireAssetNameHex(record.nftAssetNameHex, 'observed NFT asset name')
    requireHex(record.prizePoolHash, 28, 'PrizeDatum prizePoolHash')
    requireNonNegative(record.nftQuantity, 'observed ticket NFT quantity')

    const identity =
      record.ticketPolicyId.toLowerCase() + '.' + record.ticketAssetNameHex.toLowerCase()
    if (seenIdentities.has(identity)) {
      throw new Error('duplicate ticket identity in PrizeValidator census: ' + identity)
    }
    seenIdentities.add(identity)

    let identityValid = true
    if (record.ticketPolicyId.toLowerCase() !== census.ticketPolicyId.toLowerCase()) {
      blockers.push('TICKET_POLICY_ID_MISMATCH:' + identity)
      identityValid = false
    }
    if (
      record.nftPolicyId.toLowerCase() !== record.ticketPolicyId.toLowerCase() ||
      record.nftAssetNameHex.toLowerCase() !== record.ticketAssetNameHex.toLowerCase() ||
      record.nftQuantity !== 1n
    ) {
      blockers.push('DATUM_AND_NFT_IDENTITY_OR_QUANTITY_MISMATCH:' + identity)
      identityValid = false
    }
    if (record.prizePoolHash.toLowerCase() !== census.b1PrizePoolScriptHash.toLowerCase()) {
      blockers.push('TICKET_B1_POOL_SCRIPT_BINDING_MISMATCH:' + identity)
      identityValid = false
    }

    const classified = classifyPrizeDatum(record)
    let item = classified
    if (!identityValid) {
      item = {
        ...classified,
        r7Cell: 'L6',
        pcComponent: null,
        classId: null,
        countedAmountReferenceUnits: 0n,
        classificationReason: 'Ticket identity or Pool binding is not authoritative',
      }
    }

    if (item.r7Cell === 'L1') {
      l1PayoutUsdmSubunits += item.prizeAmountUsdmSubunits
      l1ItemCount += 1n
    } else if (item.r7Cell === 'L3') {
      l3FacePriceUsdmSubunits += item.priceUsdmSubunits
      l3TicketCount += 1n
      l3WorstCaseExposureReferenceUnits += item.countedAmountReferenceUnits
    } else if (item.r7Cell === 'L4') {
      l4SettledItemCount += 1n
    } else if (item.r7Cell === 'L5') {
      l5ResolvedOrExpiredItemCount += 1n
    } else {
      l6UnclassifiedItemCount += 1n
      blockers.push('UNCLASSIFIED_TICKET_ITEM:' + identity)
    }

    return {
      itemId: 'cardano-ticket:' + identity,
      utxoReference: record.utxoReference,
      datumDigest: record.datumDigest.toLowerCase(),
      ...item,
    }
  })

  const l1MatchesB1PendingLiabilities =
    l1PayoutUsdmSubunits === census.pool.pendingLiabilitiesUsdmSubunits
  const l3FacePriceMatchesB1UnresolvedReserve =
    l3FacePriceUsdmSubunits === census.pool.unresolvedReserveUsdmSubunits
  const l3CountMatchesB1UnresolvedTicketCount =
    l3TicketCount === census.pool.unresolvedTicketCount
  const allSourceOutputsAccountedFor =
    census.paginationComplete &&
    census.pageCount > 0n &&
    census.sourceUtxoCount === BigInt(census.records.length) &&
    census.decodedPrizeDatumCount === BigInt(census.records.length) &&
    census.unclassifiedUtxoCount === 0n

  if (!l1MatchesB1PendingLiabilities) blockers.push('L1_ITEM_SUM_DOES_NOT_MATCH_B1_PENDING_LIABILITIES')
  if (!l3FacePriceMatchesB1UnresolvedReserve) blockers.push('L3_ITEM_PRICE_SUM_DOES_NOT_MATCH_B1_UNRESOLVED_RESERVE')
  if (!l3CountMatchesB1UnresolvedTicketCount) blockers.push('L3_ITEM_COUNT_DOES_NOT_MATCH_B1_UNRESOLVED_COUNT')
  if (!allSourceOutputsAccountedFor) blockers.push('PRIZE_ADDRESS_SOURCE_POPULATION_NOT_FULLY_ACCOUNTED_FOR')

  const l2Status =
    census.pool.lockedJackpotUsdmSubunits === 0n
      ? 'ZERO_AT_THIS_SNAPSHOT'
      : 'AGGREGATE_ONLY_LIFECYCLE_NOT_PROVEN'
  if (census.pool.lockedJackpotUsdmSubunits > 0n) {
    blockers.push('L2_JACKPOT_FUNDING_LOCK_TRANSITION_NOT_PROVEN')
  }

  const uniqueBlockers = [...new Set(blockers)]
  const ticketLedgerQualified = uniqueBlockers.length === 0

  return {
    schemaVersion: 'PRE-RICH-TICKET-ITEM-LEDGER-V1',
    qualification: {
      ticketLedgerQualified,
      fullProtectedCapitalQualified: false,
      blockers: uniqueBlockers,
      scope: 'PRIZE_VALIDATOR_TICKET_POPULATION_ONLY',
      r7L6EmptinessProven: false,
    },
    source: {
      network: census.network,
      observedSlot: census.observedSlot,
      observedAt: census.observedAt,
      providerId: census.providerId,
      snapshotReference: census.snapshotReference,
      sourceReference: census.sourceReference,
      sourceManifestDigest: census.sourceManifestDigest.toLowerCase(),
      prizeValidatorAddress: census.prizeValidatorAddress,
      prizeValidatorHash: census.prizeValidatorHash.toLowerCase(),
      b1PrizePoolScriptHash: census.b1PrizePoolScriptHash.toLowerCase(),
      ticketPolicyId: census.ticketPolicyId.toLowerCase(),
      pageCount: census.pageCount,
      sourceUtxoCount: census.sourceUtxoCount,
      decodedPrizeDatumCount: census.decodedPrizeDatumCount,
      unclassifiedUtxoCount: census.unclassifiedUtxoCount,
      poolUtxoReference: census.pool.utxoReference,
      poolDatumDigest: census.pool.datumDigest.toLowerCase(),
    },
    items,
    totals: {
      l1PayoutUsdmSubunits,
      l1PayoutReferenceUnits: referenceUnitsFromSubunits(l1PayoutUsdmSubunits, 'L1 payout total'),
      l1ItemCount,
      l3FacePriceUsdmSubunits,
      l3FacePriceReferenceUnits: referenceUnitsFromSubunits(l3FacePriceUsdmSubunits, 'L3 face-price total'),
      l3TicketCount,
      l3WorstCaseExposureReferenceUnits,
      l4SettledItemCount,
      l5ResolvedOrExpiredItemCount,
      l6UnclassifiedItemCount,
      l2LockedJackpotUsdmSubunits: census.pool.lockedJackpotUsdmSubunits,
      l2LockedJackpotReferenceUnits: referenceUnitsFromSubunits(
        census.pool.lockedJackpotUsdmSubunits,
        'L2 locked Jackpot',
      ),
      l2Status,
    },
    reconciliation: {
      l1MatchesB1PendingLiabilities,
      l3FacePriceMatchesB1UnresolvedReserve,
      l3CountMatchesB1UnresolvedTicketCount,
      allSourceOutputsAccountedFor,
    },
  }
}
