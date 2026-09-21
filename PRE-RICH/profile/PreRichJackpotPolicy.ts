/**
 * PRE-RICH Jackpot application policy.
 *
 * This module implements the already-closed PRE-RICH semantics:
 * - activation only on the stable top class;
 * - dynamic funding floor;
 * - funding need is the exact gap to the floor;
 * - no fixed allocation percentage.
 *
 * No Jackpot primitive is introduced into IMMORTAL's universal kernel.
 */

export type PreRichJackpotPolicyInput = {
  ticketPricesReferenceUnits: readonly bigint[]
  maxNormalPayoutMultiplier: bigint
  currentActiveClass: bigint | null
  highestClassEverActivated: bigint | null
  activationPredicate: boolean
  suspensionPredicate: boolean
  lockedJackpot: bigint
  normalSaleablePricesReferenceUnits: readonly bigint[]
}

export type PreRichJackpotFundingDecision = {
  stableLadder: boolean
  floorReferenceUnits: bigint
  fundingNeedReferenceUnits: bigint
}

function nonNegative(value: bigint, name: string): void {
  if (value < 0n) throw new Error(`${name} must be non-negative`)
}

export function stableLadder(input: PreRichJackpotPolicyInput): boolean {
  validate(input)
  const topClassId = BigInt(input.ticketPricesReferenceUnits.length - 1)
  return input.currentActiveClass === topClassId &&
    input.highestClassEverActivated === topClassId &&
    input.activationPredicate &&
    !input.suspensionPredicate
}

export function jackpotFloorReferenceUnits(
  input: PreRichJackpotPolicyInput,
): bigint {
  validate(input)
  const normalSum = input.ticketPricesReferenceUnits.reduce((sum, p) => sum + p, 0n)
  const saleableSum = input.normalSaleablePricesReferenceUnits.reduce((sum, p) => sum + p, 0n)
  return input.maxNormalPayoutMultiplier * (normalSum > saleableSum ? normalSum : saleableSum)
}

export function jackpotFundingNeedReferenceUnits(
  input: PreRichJackpotPolicyInput,
): PreRichJackpotFundingDecision {
  validate(input)
  const floor = jackpotFloorReferenceUnits(input)
  const need = floor > input.lockedJackpot ? floor - input.lockedJackpot : 0n
  return {
    stableLadder: stableLadder(input),
    floorReferenceUnits: floor,
    fundingNeedReferenceUnits: stableLadder(input) ? need : 0n,
  }
}

export function jackpotFundingAdmissible(
  input: PreRichJackpotPolicyInput,
  rawSurplusReferenceUnits: bigint,
  gateAccepted: boolean,
): boolean {
  validate(input)
  nonNegative(rawSurplusReferenceUnits, 'rawSurplusReferenceUnits')
  const decision = jackpotFundingNeedReferenceUnits(input)
  return decision.stableLadder &&
    gateAccepted &&
    decision.fundingNeedReferenceUnits <= rawSurplusReferenceUnits
}

function validate(input: PreRichJackpotPolicyInput): void {
  if (input.ticketPricesReferenceUnits.length === 0) throw new Error('ticket price ladder is empty')
  if (input.normalSaleablePricesReferenceUnits.some((p) => p <= 0n)) {
    throw new Error('saleable ticket prices must be positive')
  }
  input.ticketPricesReferenceUnits.forEach((p) => nonNegative(p, 'ticket price'))
  nonNegative(input.maxNormalPayoutMultiplier, 'maxNormalPayoutMultiplier')
  nonNegative(input.lockedJackpot, 'lockedJackpot')
}