import { describe, expect, it } from 'vitest'

import {
  buildPreRichProtectedCapitalItemLedger,
  type ObservedPrizeDatumForLedger,
  type PrizeDatumSourceCensus,
} from '../../src/PreRichProtectedCapitalItemLedger'

const PRIZE_VALIDATOR_HASH = 'a'.repeat(56)
const B1_POOL_SCRIPT_HASH = 'b'.repeat(56)
const TICKET_POLICY_ID = 'c'.repeat(56)
const SNAPSHOT = 'preprod:slot:100'

function record(
  index: number,
  status: string,
  beaconStatus: string,
  priceUsdmSubunits: bigint,
  prizeAmountUsdmSubunits: bigint,
): ObservedPrizeDatumForLedger {
  const txHash = (index + 1).toString(16).repeat(64)
  const name = (index + 1).toString(16).padStart(2, '0')
  return {
    utxoReference: txHash + '#0',
    datumDigest: (index + 1).toString(16).padStart(64, '0'),
    ticketPolicyId: TICKET_POLICY_ID,
    ticketAssetNameHex: name,
    nftPolicyId: TICKET_POLICY_ID,
    nftAssetNameHex: name,
    nftQuantity: 1n,
    prizePoolHash: B1_POOL_SCRIPT_HASH,
    priceUsdmSubunits,
    prizeAmountUsdmSubunits,
    prizeStatus: status,
    beaconStatus,
    issuedAt: 10n,
    // Deliberately past observedAt in the Revealed-win test row.
    expiresAt: 20n,
  }
}

function baseCensus(): PrizeDatumSourceCensus {
  const records = [
    record(0, 'Pending', 'BeaconPending', 100n, 0n),
    record(1, 'Pending', 'BeaconReady', 200n, 0n),
    record(2, 'Pending', 'BeaconPending', 300n, 0n),
    record(3, 'Revealed', 'BeaconReady', 100n, 500n),
    record(4, 'Revealed', 'BeaconReady', 100n, 0n),
    record(5, 'Claimed', 'BeaconReady', 200n, 200n),
  ]

  return {
    network: 'Preprod',
    observedSlot: 100n,
    observedAt: 1_000n,
    providerId: 'synthetic-test-provider',
    snapshotReference: SNAPSHOT,
    sourceReference: 'fixture:pc-item-ledger',
    sourceManifestDigest: 'd'.repeat(64),
    prizeValidatorAddress: 'addr_test_fixture',
    prizeValidatorHash: PRIZE_VALIDATOR_HASH,
    b1PrizePoolScriptHash: B1_POOL_SCRIPT_HASH,
    ticketPolicyId: TICKET_POLICY_ID,
    paginationComplete: true,
    pageCount: 1n,
    sourceUtxoCount: BigInt(records.length),
    decodedPrizeDatumCount: BigInt(records.length),
    unclassifiedUtxoCount: 0n,
    pool: {
      utxoReference: 'f'.repeat(64) + '#0',
      datumDigest: 'e'.repeat(64),
      snapshotReference: SNAPSHOT,
      prizeValidatorHash: PRIZE_VALIDATOR_HASH,
      pendingLiabilitiesUsdmSubunits: 500n,
      unresolvedReserveUsdmSubunits: 600n,
      unresolvedTicketCount: 3n,
      lockedJackpotUsdmSubunits: 0n,
      jackpotThresholdUsdmSubunits: 10_000n,
    },
    records,
  }
}

describe('PRE-RICH ProtectedCapital item ledger — read-only source census', () => {
  it('classifies and reconciles L1/L3 while retaining terminal L4/L5 rows', () => {
    const ledger = buildPreRichProtectedCapitalItemLedger(baseCensus())

    expect(ledger.qualification.ticketLedgerInternallyReconciled).toBe(true)
    expect(ledger.qualification.fullProtectedCapitalQualified).toBe(false)
    expect(ledger.qualification.r7L6EmptinessProven).toBe(false)
    expect(ledger.qualification.sourceCompletenessAuthorityVerified).toBe(false)
    expect(ledger.qualification.scope).toBe('PRIZE_VALIDATOR_TICKET_POPULATION_ONLY')

    expect(ledger.totals.l1PayoutUsdmSubunits).toBe(500n)
    expect(ledger.totals.l1PayoutReferenceUnits).toBe(5n)
    expect(ledger.totals.l1ItemCount).toBe(1n)

    expect(ledger.totals.l3FacePriceUsdmSubunits).toBe(600n)
    expect(ledger.totals.l3FacePriceReferenceUnits).toBe(6n)
    expect(ledger.totals.l3TicketCount).toBe(3n)
    expect(ledger.totals.l3WorstCaseExposureReferenceUnits).toBe(3_000n)

    expect(ledger.totals.l4SettledItemCount).toBe(1n)
    expect(ledger.totals.l5ResolvedOrExpiredItemCount).toBe(1n)
    expect(ledger.totals.l6UnclassifiedItemCount).toBe(0n)

    expect(ledger.reconciliation).toEqual({
      l1MatchesB1PendingLiabilities: true,
      l3FacePriceMatchesB1UnresolvedReserve: true,
      l3CountMatchesB1UnresolvedTicketCount: true,
      declaredSourceCountsReconcile: true,
    })
  })

  it('keeps an expired-by-clock but still live Revealed win in L1', () => {
    const ledger = buildPreRichProtectedCapitalItemLedger(baseCensus())
    const winningItem = ledger.items.find((item) => item.r7Cell === 'L1')

    expect(winningItem).toBeDefined()
    expect(winningItem?.countedAmountReferenceUnits).toBe(5n)
    expect(winningItem?.classificationReason).toContain(
      'remains live until Claim or valid Expire is observed',
    )
  })

  it('fails closed when source pagination is incomplete', () => {
    const census = baseCensus()
    census.paginationComplete = false

    const ledger = buildPreRichProtectedCapitalItemLedger(census)

    expect(ledger.qualification.ticketLedgerInternallyReconciled).toBe(false)
    expect(ledger.qualification.blockers).toContain(
      'PRIZE_ADDRESS_PAGINATION_NOT_COMPLETE',
    )
    expect(ledger.reconciliation.declaredSourceCountsReconcile).toBe(false)
  })

  it('fails closed when source outputs are not all decoded or classified', () => {
    const census = baseCensus()
    census.sourceUtxoCount = 7n
    census.unclassifiedUtxoCount = 1n

    const ledger = buildPreRichProtectedCapitalItemLedger(census)

    expect(ledger.qualification.ticketLedgerInternallyReconciled).toBe(false)
    expect(ledger.qualification.blockers).toContain(
      'UNCLASSIFIED_PRIZE_ADDRESS_UTXOS_PRESENT',
    )
    expect(ledger.qualification.blockers).toContain(
      'PRIZE_ADDRESS_DECLARED_SOURCE_COUNTS_DO_NOT_RECONCILE',
    )
  })

  it('fails closed when the item-level L1 sum does not reconcile to B1', () => {
    const census = baseCensus()
    census.pool.pendingLiabilitiesUsdmSubunits = 400n

    const ledger = buildPreRichProtectedCapitalItemLedger(census)

    expect(ledger.reconciliation.l1MatchesB1PendingLiabilities).toBe(false)
    expect(ledger.qualification.ticketLedgerInternallyReconciled).toBe(false)
    expect(ledger.qualification.blockers).toContain(
      'L1_ITEM_SUM_DOES_NOT_MATCH_B1_PENDING_LIABILITIES',
    )
  })

  it('fails closed on duplicate logical ticket identity', () => {
    const census = baseCensus()
    const duplicate = {
      ...census.records[0],
      utxoReference: '9'.repeat(64) + '#1',
    }
    census.records.push(duplicate)
    census.sourceUtxoCount += 1n
    census.decodedPrizeDatumCount += 1n

    expect(() => buildPreRichProtectedCapitalItemLedger(census)).toThrow(
      'duplicate ticket identity in PrizeValidator census',
    )
  })

  it('fails closed when datum identity does not match the observed NFT', () => {
    const census = baseCensus()
    census.records[0] = {
      ...census.records[0],
      nftAssetNameHex: 'ff',
    }

    const ledger = buildPreRichProtectedCapitalItemLedger(census)

    expect(ledger.qualification.ticketLedgerInternallyReconciled).toBe(false)
    expect(ledger.items[0].r7Cell).toBe('L6')
    expect(ledger.qualification.blockers).toContain(
      'DATUM_AND_NFT_IDENTITY_OR_QUANTITY_MISMATCH:' +
        TICKET_POLICY_ID + '.01',
    )
  })

  it('does not certify a positive Jackpot scalar as L2 without lifecycle provenance', () => {
    const census = baseCensus()
    census.pool.lockedJackpotUsdmSubunits = 100n

    const ledger = buildPreRichProtectedCapitalItemLedger(census)

    expect(ledger.totals.l2LockedJackpotReferenceUnits).toBe(1n)
    expect(ledger.totals.l2Status).toBe('AGGREGATE_ONLY_LIFECYCLE_NOT_PROVEN')
    expect(ledger.qualification.ticketLedgerInternallyReconciled).toBe(false)
    expect(ledger.qualification.blockers).toContain(
      'L2_JACKPOT_FUNDING_LOCK_TRANSITION_NOT_PROVEN',
    )
  })

  it('rejects Pool and PrizeDatum snapshots that are not identical', () => {
    const census = baseCensus()
    census.pool.snapshotReference = 'preprod:slot:99'

    expect(() => buildPreRichProtectedCapitalItemLedger(census)).toThrow(
      'Pool datum and PrizeDatum census must share the exact snapshot reference',
    )
  })

  it('rejects non-canonical ticket prices instead of inventing a class', () => {
    const census = baseCensus()
    census.records[0] = {
      ...census.records[0],
      priceUsdmSubunits: 150n,
    }
    census.pool.unresolvedReserveUsdmSubunits = 650n

    const ledger = buildPreRichProtectedCapitalItemLedger(census)

    expect(ledger.qualification.ticketLedgerInternallyReconciled).toBe(false)
    expect(ledger.items[0].r7Cell).toBe('L6')
    expect(ledger.qualification.blockers).toContain(
      'UNCLASSIFIED_TICKET_ITEM:' + TICKET_POLICY_ID + '.01',
    )
  })
  it('rejects a duplicate source UTxO even when the ticket identity differs', () => {
    const census = baseCensus()
    census.records[1] = {
      ...census.records[1],
      utxoReference: census.records[0].utxoReference,
      ticketAssetNameHex: 'aa',
      nftAssetNameHex: 'aa',
    }

    expect(() => buildPreRichProtectedCapitalItemLedger(census)).toThrow(
      'duplicate PrizeDatum UTxO reference in source census',
    )
  })

  it('classifies a Revealed datum with a non-ready Beacon as L6', () => {
    const census = baseCensus()
    census.records[3] = {
      ...census.records[3],
      beaconStatus: 'BeaconPending',
    }

    const ledger = buildPreRichProtectedCapitalItemLedger(census)

    expect(ledger.qualification.ticketLedgerInternallyReconciled).toBe(false)
    expect(ledger.items[3].r7Cell).toBe('L6')
    expect(ledger.qualification.blockers).toContain(
      'UNCLASSIFIED_TICKET_ITEM:' + TICKET_POLICY_ID + '.04',
    )
  })

})
