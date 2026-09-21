import {
  PRE_RICH_ISSUE_PRICES,
  issueClassSaleable,
  validateIssueRefinementEvidence,
  type IssueRefinementEvidence,
} from './PreRichIssueEvidence'

export const USDM_SUBUNITS_PER_USDM = 100n

export type IssueTicketRefinementEvidence = IssueRefinementEvidence & {
  ticketPolicyId: string
  ticketAssetNameHex: string
  ticketPriceSubunits: bigint
  counterBefore: bigint
  counterAfter: bigint
  unresolvedBefore: bigint
  unresolvedAfter: bigint
  unresolvedReserveBefore: bigint
  unresolvedReserveAfter: bigint
  treasuryPaymentReferenceUnits: bigint
  prizeStatus: 'Pending'
  prizeAmountSubunits: bigint
  row1Tier: bigint
  row2Tier: bigint
  resultHex: string
  beaconStatus: 'BeaconPending'
}

export function validateIssueTicketRefinementEvidence(
  evidence: IssueTicketRefinementEvidence,
): void {
  validateIssueRefinementEvidence(evidence)

  if (!issueClassSaleable(evidence)) {
    throw new Error('PRE-RICH ticket issue is not class-saleable')
  }
  if (!evidence.ticketPolicyId.trim()) {
    throw new Error('ticket policy ID is required')
  }
  if (!evidence.ticketAssetNameHex.trim()) {
    throw new Error('ticket asset name is required')
  }
  if (evidence.ticketPriceSubunits <= 0n) {
    throw new Error('ticket price in subunits must be positive')
  }

  const referencePrice =
    PRE_RICH_ISSUE_PRICES[Number(evidence.classId)]
  if (evidence.ticketPriceSubunits !== referencePrice * USDM_SUBUNITS_PER_USDM) {
    throw new Error('ticket price subunits do not match the canonical class price')
  }

  if (evidence.counterBefore < 0n || evidence.counterAfter < 0n) {
    throw new Error('counter values must be non-negative')
  }
  if (evidence.counterAfter !== evidence.counterBefore + 1n) {
    throw new Error('ticket issue must advance the counter exactly once')
  }

  if (evidence.unresolvedBefore < 0n || evidence.unresolvedAfter < 0n) {
    throw new Error('unresolved ticket count must be non-negative')
  }
  if (evidence.unresolvedAfter !== evidence.unresolvedBefore + 1n) {
    throw new Error('ticket issue must create exactly one unresolved ticket')
  }

  if (evidence.unresolvedReserveBefore < 0n || evidence.unresolvedReserveAfter < 0n) {
    throw new Error('unresolved reserve must be non-negative')
  }
  if (evidence.unresolvedReserveAfter !== evidence.unresolvedReserveBefore + evidence.ticketPriceSubunits) {
    throw new Error('ticket issue must reserve the exact ticket price')
  }

  if (evidence.treasuryPaymentReferenceUnits !== evidence.priceReferenceUnits) {
    throw new Error('treasury payment must equal the canonical ticket price in reference units')
  }

  if (evidence.prizeStatus !== 'Pending') {
    throw new Error('new ticket PrizeDatum must be Pending')
  }
  if (evidence.prizeAmountSubunits !== 0n) {
    throw new Error('new ticket PrizeDatum must not contain a payout')
  }
  if (evidence.row1Tier !== 0n || evidence.row2Tier !== 0n) {
    throw new Error('new ticket row tiers must be zero before reveal')
  }
  if (evidence.resultHex.length !== 0) {
    throw new Error('new ticket result must be empty before reveal')
  }
  if (evidence.beaconStatus !== 'BeaconPending') {
    throw new Error('new ticket Beacon status must be BeaconPending')
  }
}

export function issueTicketRefinementAdmissible(
  evidence: IssueTicketRefinementEvidence,
): boolean {
  try {
    validateIssueTicketRefinementEvidence(evidence)
    return true
  } catch {
    return false
  }
}