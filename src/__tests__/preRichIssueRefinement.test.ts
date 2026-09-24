import { describe, expect, it } from 'vitest'

import {
  issueTicketRefinementAdmissible,
  validateIssueTicketRefinementEvidence,
  type IssueTicketRefinementEvidence,
} from '../../PRE-RICH/profile/PreRichIssueRefinement'

const base: IssueTicketRefinementEvidence = {
  classId: 0n,
  priceReferenceUnits: 1n,
  currentActiveClass: 0n,
  highestClassEverActivated: 0n,
  issued: 4n,
  cap: 10n,
  ticketPolicyId: 'aa'.repeat(28),
  ticketAssetNameHex: '30',
  ticketPriceSubunits: 100n,
  counterBefore: 7n,
  counterAfter: 8n,
  unresolvedBefore: 11n,
  unresolvedAfter: 12n,
  unresolvedReserveBefore: 1_000n,
  unresolvedReserveAfter: 1_100n,
  treasuryPaymentReferenceUnits: 1n,
  prizeStatus: 'Pending',
  prizeAmountSubunits: 0n,
  row1Tier: 0n,
  row2Tier: 0n,
  resultHex: '',
  beaconStatus: 'BeaconPending',
}

describe('PRE-RICH ticket-level Issue refinement', () => {
  it('accepts a complete canonical Genesis issue witness', () => {
    expect(issueTicketRefinementAdmissible(base)).toBe(true)
    expect(() => validateIssueTicketRefinementEvidence(base)).not.toThrow()
  })

  it('binds reference-unit price to 100 sub-units per USDM', () => {
    expect(issueTicketRefinementAdmissible({
      ...base,
      classId: 1n,
      priceReferenceUnits: 2n,
      currentActiveClass: 1n,
      highestClassEverActivated: 1n,
      ticketPriceSubunits: 200n,
      unresolvedReserveAfter: 1_200n,
      treasuryPaymentReferenceUnits: 2n,
    })).toBe(true)
  })

  it('rejects a ticket price/subunit mismatch', () => {
    expect(() => validateIssueTicketRefinementEvidence({ ...base, ticketPriceSubunits: 101n }))
      .toThrow('ticket price subunits do not match the canonical class price')
  })

  it('rejects a non-atomic counter increment', () => {
    expect(() => validateIssueTicketRefinementEvidence({ ...base, counterAfter: 9n }))
      .toThrow('ticket issue must advance the counter exactly once')
  })

  it('rejects a reserve delta different from the ticket price', () => {
    expect(() => validateIssueTicketRefinementEvidence({ ...base, unresolvedReserveAfter: 1_099n }))
      .toThrow('ticket issue must reserve the exact ticket price')
  })

  it('rejects a mismatched Treasury economic price', () => {
    expect(() => validateIssueTicketRefinementEvidence({ ...base, treasuryPaymentReferenceUnits: 2n }))
      .toThrow('treasury payment must equal the canonical ticket price in reference units')
  })

  it('rejects a new ticket that already contains outcome state', () => {
    expect(() => validateIssueTicketRefinementEvidence({ ...base, row1Tier: 1n }))
      .toThrow('new ticket row tiers must be zero before reveal')
    expect(() => validateIssueTicketRefinementEvidence({ ...base, prizeAmountSubunits: 100n }))
      .toThrow('new ticket PrizeDatum must not contain a payout')
    expect(() => validateIssueTicketRefinementEvidence({ ...base, resultHex: 'ff' }))
      .toThrow('new ticket result must be empty before reveal')
  })

  it('rejects a Beacon status different from the issuance state', () => {
    const invalid = {
      ...base,
      beaconStatus: 'BeaconReady',
    } as unknown as IssueTicketRefinementEvidence
    expect(() => validateIssueTicketRefinementEvidence(invalid))
      .toThrow('new ticket Beacon status must be BeaconPending')
  })

  it('inherits class saleability fail-closed behavior', () => {
    expect(issueTicketRefinementAdmissible({ ...base, currentActiveClass: -1n })).toBe(false)
    expect(issueTicketRefinementAdmissible({ ...base, issued: 10n })).toBe(false)
  })
})