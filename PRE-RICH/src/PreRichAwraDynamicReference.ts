/**
 * PRE-RICH — AWRA dynamic research reference
 *
 * RESEARCH / HISTORICAL RECOVERY ONLY.
 *
 * This module captures the dynamic risk-envelope boundary that can be
 * reconstructed from the archived v36 evidence. It intentionally does not
 * define the hidden v37-v39 selector as canonical policy.
 *
 * Recovered v36 relation:
 *
 *   exposurePressure = unresolvedWorstCaseExposure / executableCash
 *   headroomFactor   = max(0, 1 - exposurePressure)
 *   allowedRatio     = 1 + eta * headroomFactor
 *
 * The archived evidence matches this relation exactly for the observed
 * cash/unresolved/eta grid, e.g.:
 *   cash=4000, unresolved=1, eta=.10 -> 1.0875
 *   cash=8000, unresolved=1, eta=.10 -> 1.09375
 *   cash=12000, unresolved=1, eta=.10 -> 1.095833...
 *   cash=20000, unresolved=1, eta=.10 -> 1.0975
 *
 * v37-v39 output files show later dynamic budget selection, but the original
 * selector source is not present in the recovered materials. We therefore
 * expose admissibility primitives and observed-data classification only.
 */

export const HISTORICAL_AWRA_BUDGET_FLOOR = 0.005
export const HISTORICAL_AWRA_MAX_BUDGET = 0.1
export const HISTORICAL_AWRA_WORST_CASE_MULTIPLE = 500

export type DynamicRiskContext = {
  readonly executableCash: number
  readonly unresolvedTicketPrice: number
  readonly unresolvedCount: number
  readonly eta: number
}

export type AwraRiskEnvelope = {
  readonly exposurePressure: number
  readonly headroomFactor: number
  readonly allowedRatio: number
}

export type AwraRiskCandidate = {
  readonly id: string
  readonly budget: number
  readonly riskMax: number
}

export function validateDynamicRiskContext(
  context: DynamicRiskContext,
): void {
  if (!Number.isFinite(context.executableCash) || context.executableCash < 0) {
    throw new Error('executableCash must be finite and non-negative')
  }
  if (
    !Number.isFinite(context.unresolvedTicketPrice) ||
    context.unresolvedTicketPrice <= 0
  ) {
    throw new Error('unresolvedTicketPrice must be finite and positive')
  }
  if (!Number.isInteger(context.unresolvedCount) || context.unresolvedCount < 0) {
    throw new Error('unresolvedCount must be a non-negative integer')
  }
  if (!Number.isFinite(context.eta) || context.eta < 0) {
    throw new Error('eta must be finite and non-negative')
  }
}

export function deriveDynamicRiskEnvelope(
  context: DynamicRiskContext,
): AwraRiskEnvelope {
  validateDynamicRiskContext(context)

  if (context.executableCash === 0) {
    return {
      exposurePressure:
        context.unresolvedCount === 0 ? 0 : Number.POSITIVE_INFINITY,
      headroomFactor: 0,
      allowedRatio: 1,
    }
  }

  const unresolvedWorstCaseExposure =
    HISTORICAL_AWRA_WORST_CASE_MULTIPLE *
    context.unresolvedTicketPrice *
    context.unresolvedCount

  const exposurePressure =
    unresolvedWorstCaseExposure / context.executableCash
  const headroomFactor = Math.max(0, 1 - exposurePressure)
  const allowedRatio = 1 + context.eta * headroomFactor

  return {
    exposurePressure,
    headroomFactor,
    allowedRatio,
  }
}

/**
 * Normalise a candidate risk score to the historical minimum risk observed
 * in the comparison set. The caller supplies the baseline; this avoids
 * smuggling a hidden optimisation objective into the reference layer.
 */
export function deriveCandidateRiskRatio(
  candidateRiskMax: number,
  minimumRiskMax: number,
): number {
  if (!Number.isFinite(candidateRiskMax) || candidateRiskMax < 0) {
    throw new Error('candidateRiskMax must be finite and non-negative')
  }
  if (!Number.isFinite(minimumRiskMax) || minimumRiskMax <= 0) {
    throw new Error('minimumRiskMax must be finite and positive')
  }
  return candidateRiskMax / minimumRiskMax
}

export function riskEnvelopeAdmissible(
  candidateRiskRatio: number,
  allowedRatio: number,
): boolean {
  if (!Number.isFinite(candidateRiskRatio) || candidateRiskRatio < 0) {
    throw new Error('candidateRiskRatio must be finite and non-negative')
  }
  if (!Number.isFinite(allowedRatio) || allowedRatio < 1) {
    throw new Error('allowedRatio must be finite and at least 1')
  }
  return candidateRiskRatio <= allowedRatio + 1e-12
}

export function filterCandidatesByRiskEnvelope(
  candidates: readonly AwraRiskCandidate[],
  envelope: AwraRiskEnvelope,
  minimumRiskMax: number,
): readonly AwraRiskCandidate[] {
  return candidates.filter((candidate) =>
    riskEnvelopeAdmissible(
      deriveCandidateRiskRatio(candidate.riskMax, minimumRiskMax),
      envelope.allowedRatio,
    ),
  )
}

/**
 * Historical v37 observed-budget reconstruction.
 *
 * The archived v37 trials show:
 *   eta = 0.00 -> avg_B = 0.005
 *   eta = 0.05 -> avg_B = 0.025
 *   eta = 0.10 -> avg_B = 0.050
 *
 * This is kept as an observed-fit helper only. It is NOT asserted to be the
 * original hidden implementation for eta values that were not present in the
 * recovered evidence, and it is NOT canonical policy.
 */
export function observedV37BudgetTarget(
  eta: number,
  floor = HISTORICAL_AWRA_BUDGET_FLOOR,
): number {
  if (!Number.isFinite(eta) || eta < 0) {
    throw new Error('eta must be finite and non-negative')
  }
  if (!Number.isFinite(floor) || floor < 0) {
    throw new Error('floor must be finite and non-negative')
  }
  return Math.max(floor, eta / 2)
}

/**
 * Report-only classification for the v38/v39 archived budgets.
 *
 * It does not infer how the hidden selector chose the budget. It merely
 * distinguishes a returned historical budget from the recovered static grid.
 */
export function classifyHistoricalBudget(
  budget: number,
): 'BELOW_FLOOR' | 'GRID_VALUE' | 'ABOVE_RECOVERED_GRID' {
  if (!Number.isFinite(budget) || budget < 0) {
    throw new Error('budget must be finite and non-negative')
  }
  if (budget < HISTORICAL_AWRA_BUDGET_FLOOR - 1e-12) {
    return 'BELOW_FLOOR'
  }
  if (
    [0.005, 0.01, 0.025, 0.05, 0.1].some(
      (value) => Math.abs(value - budget) < 1e-12,
    )
  ) {
    return 'GRID_VALUE'
  }
  return budget > HISTORICAL_AWRA_MAX_BUDGET
    ? 'ABOVE_RECOVERED_GRID'
    : 'GRID_VALUE'
}
