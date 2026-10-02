/**
 * PRE-RICH Jackpot activation/funding policy boundary.
 *
 * This is application policy, not IMMORTAL universal semantics.
 *
 * The policy composes already-decided predicates:
 *   StableLadder(S)
 *     := CurrentActiveClass(S) = HighestClassEverActivated(S) = topClass
 *        AND ActivationPredicate(100,S)
 *        AND NOT SuspensionPredicate(100,S)
 *
 * Funding is then eligible only when:
 *   StableLadder(S)
 *   AND FundingNeed(S) > 0
 *   AND EconomicGate(S, JACKPOT_FUND) = ACCEPT
 *
 * The activation/suspension predicates are supplied as authoritative
 * witnesses because their derivation belongs to the existing PRE-RICH
 * class-control/hysteresis mechanism. This module does not invent a new
 * numeric maturity threshold or a second economic authority.
 */

import { PRE_RICH_CANONICAL_PRICES } from './PreRichCardanoObservationProjection'

export const PRE_RICH_JACKPOT_TOP_CLASS_ID =
  BigInt(PRE_RICH_CANONICAL_PRICES.length - 1)

export type PreRichJackpotActivationWitness = {
  currentActiveClass: bigint
  highestClassEverActivated: bigint
  activationPredicateSatisfied: boolean
  suspensionPredicateSatisfied: boolean
}

export type PreRichJackpotFundingWitness =
  PreRichJackpotActivationWitness & {
    jackpotFloor: bigint
    lockedJackpot: bigint
    economicGateAccepted: boolean
  }

/** A2: deterministic, state-derived and non-discretionary ladder stability. */
export function isPreRichJackpotStableLadder(
  witness: PreRichJackpotActivationWitness,
): boolean {
  return (
    witness.currentActiveClass === PRE_RICH_JACKPOT_TOP_CLASS_ID &&
    witness.highestClassEverActivated === PRE_RICH_JACKPOT_TOP_CLASS_ID &&
    witness.activationPredicateSatisfied &&
    !witness.suspensionPredicateSatisfied
  )
}

/** A3: no fixed allocation rate; fund only the state-derived shortfall. */
export function preRichJackpotFundingNeed(
  jackpotFloor: bigint,
  lockedJackpot: bigint,
): bigint {
  if (jackpotFloor < 0n) {
    throw new Error('Jackpot floor must be non-negative')
  }
  if (lockedJackpot < 0n) {
    throw new Error('Locked Jackpot must be non-negative')
  }

  return jackpotFloor > lockedJackpot
    ? jackpotFloor - lockedJackpot
    : 0n
}

/** A2 + A3: stable ladder, positive funding need, and Economic Gate acceptance. */
export function isPreRichJackpotFundingEligible(
  witness: PreRichJackpotFundingWitness,
): boolean {
  return (
    isPreRichJackpotStableLadder(witness) &&
    preRichJackpotFundingNeed(
      witness.jackpotFloor,
      witness.lockedJackpot,
    ) > 0n &&
    witness.economicGateAccepted
  )
}
