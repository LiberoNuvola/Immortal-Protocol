/**
 * PRE-RICH — AWRA reference layer
 *
 * Research / conformance helper only.
 *
 * This module restores the historical AWRA computation boundary without
 * promoting a historical budget, alpha, risk ceiling or preference order to
 * canonical policy. The current model supplies the economic distribution;
 * the caller supplies the authorized policy/risk/viability functions.
 */

export type AwraOutcome = {
  readonly multiple: number
  readonly probability: number
}

export type AwraWeight = {
  readonly multiple: number
  readonly weight: number
}

export type AwraCandidate = {
  readonly id: string
  readonly budget: number
  readonly weights: readonly AwraWeight[]
}

export type AwraCandidateEvaluation = {
  readonly candidate: AwraCandidate
  readonly winRate: number
  readonly profitWinRate: number
  readonly probabilityAtLeast5x: number
  readonly probabilityAtLeast100x: number
  readonly expectedPayout: number
  readonly variance: number
}

export type AwraAdmissibility = {
  readonly budgetWithinRawSurplus: boolean
  readonly economicGateAccepted: boolean
  readonly viabilityAccepted: boolean
  readonly authorizedPolicyAccepted: boolean
}

export function validateProbabilityDistribution(
  distribution: readonly AwraOutcome[],
): void {
  if (distribution.length === 0) {
    throw new Error('AWRA distribution must not be empty')
  }

  let total = 0
  for (const outcome of distribution) {
    if (!Number.isFinite(outcome.multiple) || outcome.multiple < 0) {
      throw new Error('AWRA payout multiple must be a finite non-negative number')
    }
    if (!Number.isFinite(outcome.probability) || outcome.probability < 0) {
      throw new Error('AWRA probability must be a finite non-negative number')
    }
    total += outcome.probability
  }

  if (Math.abs(total - 1) > 1e-12) {
    throw new Error('AWRA probabilities must sum to 1')
  }
}

export function validateWeights(
  weights: readonly AwraWeight[],
): void {
  if (weights.length === 0) {
    throw new Error('AWRA weight set must not be empty')
  }

  let total = 0
  const seen = new Set<number>()

  for (const entry of weights) {
    if (!Number.isFinite(entry.multiple) || entry.multiple <= 0) {
      throw new Error('AWRA weighted payout multiple must be finite and positive')
    }
    if (!Number.isFinite(entry.weight) || entry.weight < 0) {
      throw new Error('AWRA weight must be finite and non-negative')
    }
    if (seen.has(entry.multiple)) {
      throw new Error('AWRA weight multiples must be unique')
    }
    seen.add(entry.multiple)
    total += entry.weight
  }

  if (Math.abs(total - 1) > 1e-12) {
    throw new Error('AWRA weights must sum to 1')
  }
}

/**
 * Recovered historical transformation:
 *
 *   Δp_x = B_AWRA * w_x / x
 *
 * This function returns probability increments only. It deliberately does
 * not decide which existing outcome loses probability mass; that donor rule
 * is part of the application policy and must be supplied explicitly when a
 * complete distribution is constructed.
 */
export function computeAwraProbabilityDeltas(
  budget: number,
  weights: readonly AwraWeight[],
): readonly AwraOutcome[] {
  if (!Number.isFinite(budget) || budget < 0) {
    throw new Error('AWRA budget must be finite and non-negative')
  }
  validateWeights(weights)

  return weights
    .filter((entry) => entry.weight > 0)
    .map((entry) => ({
      multiple: entry.multiple,
      probability: (budget * entry.weight) / entry.multiple,
    }))
}

export function awraBudgetAdmissible(
  rawSurplus: number,
  budget: number,
): boolean {
  if (!Number.isFinite(rawSurplus) || rawSurplus < 0) {
    throw new Error('RawSurplus must be finite and non-negative')
  }
  if (!Number.isFinite(budget) || budget < 0) {
    throw new Error('AWRA budget must be finite and non-negative')
  }
  return budget <= rawSurplus
}

/**
 * Alpha is a derived reporting quantity, not a policy default.
 *
 *   alpha_t = B_t / RawSurplus_t
 *
 * The function returns null when RawSurplus is zero so that no implicit
 * division-by-zero convention becomes an economic rule.
 */
export function deriveAwraAlpha(
  rawSurplus: number,
  budget: number,
): number | null {
  if (!awraBudgetAdmissible(rawSurplus, budget)) {
    throw new Error('AWRA budget exceeds RawSurplus')
  }
  if (rawSurplus === 0) return null
  return budget / rawSurplus
}

/**
 * Apply explicitly supplied probability increments to an existing
 * distribution. A donor outcome must be named by the caller; no donor rule is
 * silently assumed here.
 */
export function applyAwraProbabilityDeltas(
  distribution: readonly AwraOutcome[],
  deltas: readonly AwraOutcome[],
  donorMultiple: number,
): readonly AwraOutcome[] {
  validateProbabilityDistribution(distribution)

  if (!Number.isFinite(donorMultiple) || donorMultiple < 0) {
    throw new Error('AWRA donor multiple must be finite and non-negative')
  }

  const deltaByMultiple = new Map<number, number>()
  for (const delta of deltas) {
    if (delta.probability < 0 || !Number.isFinite(delta.probability)) {
      throw new Error('AWRA probability delta must be finite and non-negative')
    }
    deltaByMultiple.set(
      delta.multiple,
      (deltaByMultiple.get(delta.multiple) ?? 0) + delta.probability,
    )
  }

  const donorDecrease = [...deltaByMultiple.values()].reduce(
    (sum, value) => sum + value,
    0,
  )

  const result = distribution.map((outcome) => {
    const decrease = outcome.multiple === donorMultiple ? donorDecrease : 0
    const increase = deltaByMultiple.get(outcome.multiple) ?? 0
    return {
      multiple: outcome.multiple,
      probability: outcome.probability - decrease + increase,
    }
  })

  const donor = result.find((outcome) => outcome.multiple === donorMultiple)
  if (!donor) {
    throw new Error('AWRA donor outcome is absent from the distribution')
  }
  if (donor.probability < -1e-12) {
    throw new Error('AWRA transformation requires more donor probability mass than exists')
  }

  const normalized = result.map((outcome) => ({
    multiple: outcome.multiple,
    probability: Math.abs(outcome.probability) < 1e-15 ? 0 : outcome.probability,
  }))

  validateProbabilityDistribution(normalized)
  return normalized
}

export function evaluateAwraDistribution(
  distribution: readonly AwraOutcome[],
): Omit<AwraCandidateEvaluation, 'candidate'> {
  validateProbabilityDistribution(distribution)

  let expected = 0
  let expectedSquare = 0
  let winRate = 0
  let profitWinRate = 0
  let atLeast5x = 0
  let atLeast100x = 0

  for (const outcome of distribution) {
    const { multiple, probability } = outcome
    expected += multiple * probability
    expectedSquare += multiple * multiple * probability
    if (multiple > 0) winRate += probability
    if (multiple > 1) profitWinRate += probability
    if (multiple >= 5) atLeast5x += probability
    if (multiple >= 100) atLeast100x += probability
  }

  return {
    winRate,
    profitWinRate,
    probabilityAtLeast5x: atLeast5x,
    probabilityAtLeast100x: atLeast100x,
    expectedPayout: expected,
    variance: Math.max(0, expectedSquare - expected * expected),
  }
}

export function admitAwraCandidate(
  rawSurplus: number,
  candidate: AwraCandidate,
  checks: {
    readonly economicGate: (candidate: AwraCandidate) => boolean
    readonly viability: (candidate: AwraCandidate) => boolean
    readonly authorizedPolicy: (candidate: AwraCandidate) => boolean
  },
): AwraAdmissibility {
  if (!Number.isFinite(candidate.budget) || candidate.budget < 0) {
    throw new Error('AWRA candidate budget must be finite and non-negative')
  }

  const budgetWithinRawSurplus = awraBudgetAdmissible(
    rawSurplus,
    candidate.budget,
  )
  const economicGateAccepted =
    budgetWithinRawSurplus && checks.economicGate(candidate)
  const viabilityAccepted =
    economicGateAccepted && checks.viability(candidate)
  const authorizedPolicyAccepted =
    viabilityAccepted && checks.authorizedPolicy(candidate)

  return {
    budgetWithinRawSurplus,
    economicGateAccepted,
    viabilityAccepted,
    authorizedPolicyAccepted,
  }
}

/**
 * Recovered 5 × 11 candidate-budget grid.
 *
 * The historical sweep varied B across five values and split the mutable
 * weight mass only between 1× and 2×. The remaining historical weights are
 * intentionally not fabricated here.
 */
export function generateRecovered55Candidates(
  budgets: readonly number[] = [0.005, 0.01, 0.025, 0.05, 0.1],
): readonly AwraCandidate[] {
  const candidates: AwraCandidate[] = []

  for (const budget of budgets) {
    if (!Number.isFinite(budget) || budget < 0) {
      throw new Error('AWRA grid budget must be finite and non-negative')
    }

    for (let i = 0; i <= 10; i += 1) {
      const w1 = i / 10
      const w2 = 1 - w1
      candidates.push({
        id: `B=${budget}:w1=${w1.toFixed(1)}`,
        budget,
        weights: [
          { multiple: 1, weight: w1 },
          { multiple: 2, weight: w2 },
        ],
      })
    }
  }

  return candidates
}
