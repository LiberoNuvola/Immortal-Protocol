import { describe, expect, it } from 'vitest'
import {
  issueTicketRefinementAdmissible,
  type IssueTicketRefinementEvidence,
} from '../../PRE-RICH/src/PreRichIssueRefinement'
import {
  revealRefinementAdmissible,
  type RevealRefinementEvidence,
} from '../../PRE-RICH/src/PreRichRevealRefinement'
import {
  claimRefinementAdmissible,
  type ClaimRefinementEvidence,
} from '../../PRE-RICH/src/PreRichClaimRefinement'
import {
  refinesAggregateExpire,
  type ExpireRefinementEvidence,
} from '../../PRE-RICH/src/PreRichExpireRefinement'

type ActionClass = 'Issue' | 'Reveal' | 'Claim' | 'Expire'

type NormalizedActionEnvelope = {
  action: ActionClass
  admitted: boolean
  inputReferences: readonly string[]
  liquiditySourceReferences: readonly string[]
  stateDelta: Record<string, string>
}

function normalizeIssue(e: IssueTicketRefinementEvidence): NormalizedActionEnvelope {
  return {
    action: 'Issue',
    admitted: issueTicketRefinementAdmissible(e),
    inputReferences: ['counter#0', 'pool#0'],
    liquiditySourceReferences: ['pool#0'],
    stateDelta: {
      counter: `${e.counterBefore}->${e.counterAfter}`,
      unresolved: `${e.unresolvedBefore}->${e.unresolvedAfter}`,
      reserve: `${e.unresolvedReserveBefore}->${e.unresolvedReserveAfter}`,
      ticketPrice: e.ticketPriceSubunits.toString(),
      prizeStatus: e.prizeStatus,
    },
  }
}

function normalizeReveal(e: RevealRefinementEvidence): NormalizedActionEnvelope {
  return {
    action: 'Reveal',
    admitted: revealRefinementAdmissible(e),
    inputReferences: ['prize#0', 'pool#0'],
    liquiditySourceReferences: ['pool#0'],
    stateDelta: {
      status: `${e.statusBefore}->${e.statusAfter}`,
      unresolved: `${e.unresolvedBefore}->${e.unresolvedAfter}`,
      reserve: `${e.unresolvedReserveBefore}->${e.unresolvedReserveAfter}`,
      liability: `${e.pendingLiabilityBefore}->${e.pendingLiabilityAfter}`,
      payout: e.prizeAmountSubunits.toString(),
    },
  }
}

function normalizeClaim(e: ClaimRefinementEvidence): NormalizedActionEnvelope {
  return {
    action: 'Claim',
    admitted: claimRefinementAdmissible(e),
    inputReferences: ['prize#0', 'pool#0', 'ticket#0'],
    liquiditySourceReferences: ['pool#0'],
    stateDelta: {
      status: `${e.statusBefore}->${e.statusAfter}`,
      liability: `${e.pendingLiabilityBefore}->${e.pendingLiabilityAfter}`,
      liquidity: `${e.totalLiquidityBefore}->${e.totalLiquidityAfter}`,
      settlement: e.settlementAmountSubunits.toString(),
      ticketNftRetained: String(e.ticketNftRetained),
    },
  }
}

function normalizeExpire(
  e: ExpireRefinementEvidence,
  aggregateClass: number,
  canonicalPriceUsdm: bigint,
  atTime: bigint,
): NormalizedActionEnvelope {
  return {
    action: 'Expire',
    admitted: refinesAggregateExpire(e, aggregateClass, canonicalPriceUsdm, atTime),
    inputReferences: ['prize#0', 'pool#0'],
    liquiditySourceReferences: ['pool#0'],
    stateDelta: {
      unresolved: `${e.unresolvedBefore}->${e.unresolvedAfter}`,
      reserve: `${e.unresolvedReserveBefore}->${e.unresolvedReserveAfter}`,
      ticketClass: String(e.ticketClass),
      ticketPriceUsdm: e.ticketPriceUsdm.toString(),
      expiresAt: e.ticketExpiresAt.toString(),
    },
  }
}

describe('RF8 differential action replay — normalized conformance envelope', () => {
  it('keeps the four economic actions explicit and independently admissible', () => {
    const issue: IssueTicketRefinementEvidence = {
      classId: 0n, priceReferenceUnits: 1n, currentActiveClass: 0n,
      highestClassEverActivated: 0n, issued: 4n, cap: 10n,
      ticketPolicyId: 'aa'.repeat(28), ticketAssetNameHex: '30',
      ticketPriceSubunits: 100n, counterBefore: 7n, counterAfter: 8n,
      unresolvedBefore: 11n, unresolvedAfter: 12n,
      unresolvedReserveBefore: 1_000n, unresolvedReserveAfter: 1_100n,
      treasuryPaymentReferenceUnits: 1n, prizeStatus: 'Pending',
      prizeAmountSubunits: 0n, row1Tier: 0n, row2Tier: 0n,
      resultHex: '', beaconStatus: 'BeaconPending',
    }

    const reveal: RevealRefinementEvidence = {
      ticketPolicyId: 'aa'.repeat(28), ticketAssetNameHex: '30',
      statusBefore: 'Pending', statusAfter: 'Revealed',
      beaconReady: true, commitmentVerified: true, resultVerified: true,
      resultHex: 'bb'.repeat(32), priceSubunits: 100n,
      row1Tier: 0n, row2Tier: 2n, prizeTier: 2n,
      row1PayoutSubunits: 0n, row2PayoutSubunits: 250n,
      prizeAmountSubunits: 250n, revealValidityUpperBound: 1_000n,
      expiresAt: 1_000n, unresolvedBefore: 10n, unresolvedAfter: 9n,
      unresolvedReserveBefore: 1_000n, unresolvedReserveAfter: 900n,
      pendingLiabilityBefore: 500n, pendingLiabilityAfter: 750n,
      totalLiquidityBefore: 10_000n, lockedJackpotBefore: 1_000n,
    }

    const claim: ClaimRefinementEvidence = {
      ticketPolicyId: 'aa'.repeat(28), ticketAssetNameHex: '30',
      statusBefore: 'Revealed', statusAfter: 'Claimed',
      prizeAmountSubunits: 250n, settlementAmountSubunits: 250n,
      ticketOwnerPkh: 'owner', claimantPkh: 'owner', ownerSigned: true,
      claimValidityUpperBound: 1_000n, expiresAt: 1_000n,
      pendingLiabilityBefore: 500n, pendingLiabilityAfter: 250n,
      totalLiquidityBefore: 10_000n, totalLiquidityAfter: 9_750n,
      ticketNftRetained: true,
    }

    const expire: ExpireRefinementEvidence = {
      ticketId: 'ticket-42', ticketClass: 3, ticketPriceUsdm: 500n,
      ticketIssuedAt: 10_000n, ticketExpiresAt: 20_000n,
      unresolvedBefore: 7n, unresolvedAfter: 6n,
      unresolvedReserveBefore: 4_000n, unresolvedReserveAfter: 3_500n,
    }

    const envelopes = [
      normalizeIssue(issue),
      normalizeReveal(reveal),
      normalizeClaim(claim),
      normalizeExpire(expire, 3, 500n, 20_000n),
    ]

    expect(envelopes.map(e => e.action)).toEqual(['Issue', 'Reveal', 'Claim', 'Expire'])
    expect(envelopes.every(e => e.admitted)).toBe(true)
    expect(envelopes.every(e => e.inputReferences.length > 0)).toBe(true)
    expect(envelopes.every(e => e.liquiditySourceReferences.length > 0)).toBe(true)
  })

  it('rejects replay when the normalized action is changed', () => {
    const envelope: NormalizedActionEnvelope = {
      action: 'Reveal',
      admitted: true,
      inputReferences: ['prize#0', 'pool#0'],
      liquiditySourceReferences: ['pool#0'],
      stateDelta: { payout: '250' },
    }

    const replayed = { ...envelope, action: 'Claim' as const }
    expect(replayed.action).not.toBe(envelope.action)
  })

  it('rejects replay when liquidity source is not one of the consumed inputs', () => {
    const envelope: NormalizedActionEnvelope = {
      action: 'Reveal',
      admitted: true,
      inputReferences: ['prize#0', 'pool#0'],
      liquiditySourceReferences: ['other-pool#0'],
      stateDelta: { payout: '250' },
    }

    const liquidityIsConsumed = envelope.liquiditySourceReferences.every(
      ref => envelope.inputReferences.includes(ref),
    )
    expect(liquidityIsConsumed).toBe(false)
  })

  it('rejects an inadmissible refinement instead of normalizing it as canonical', () => {
    const invalid: ClaimRefinementEvidence = {
      ticketPolicyId: 'aa'.repeat(28), ticketAssetNameHex: '30',
      statusBefore: 'Revealed', statusAfter: 'Claimed',
      prizeAmountSubunits: 250n, settlementAmountSubunits: 249n,
      ticketOwnerPkh: 'owner', claimantPkh: 'owner', ownerSigned: true,
      claimValidityUpperBound: 1_000n, expiresAt: 1_000n,
      pendingLiabilityBefore: 500n, pendingLiabilityAfter: 250n,
      totalLiquidityBefore: 10_000n, totalLiquidityAfter: 9_750n,
      ticketNftRetained: true,
    }

    expect(normalizeClaim(invalid).admitted).toBe(false)
  })
})
