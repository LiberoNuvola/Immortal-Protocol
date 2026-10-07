import assert from 'node:assert/strict'
import test from 'node:test'

import {
  admitAwraCandidate,
  computeAwraProbabilityDeltas,
  deriveAwraAlpha,
  AWRA_LOSS_OUTCOME_MULTIPLE,
  awraBudgetAdmissibleAfterJackpot,
  deriveAwraPostJackpotResidualSurplus,
  evaluateAwraCandidate,
  evaluateAwraDistribution,
  generateRecovered55Candidates,
  selectAuthorizedAwraCandidate,
} from '../../../PRE-RICH/src/PreRichAwraReference.ts'

const currentClassic6 = [
  { multiple: 0, probability: 0.765625 },
  { multiple: 1, probability: 0.14875 },
  { multiple: 2, probability: 0.007225 },
  { multiple: 2.5, probability: 0.0525 },
  { multiple: 3.5, probability: 0.0051 },
  { multiple: 5, probability: 0.01665 },
  { multiple: 6, probability: 0.00153 },
  { multiple: 7.5, probability: 0.00054 },
  { multiple: 10, probability: 0.000081 },
  { multiple: 100, probability: 0.0016625 },
  { multiple: 101, probability: 0.0001615 },
  { multiple: 102.5, probability: 0.000057 },
  { multiple: 105, probability: 0.0000171 },
  { multiple: 200, probability: 0.0000009025 },
  { multiple: 500, probability: 0.0000999975 },
]

test('AWRA historical budget transform is preserved', () => {
  const deltas = computeAwraProbabilityDeltas(0.05, [
    { multiple: 1, weight: 0.4 },
    { multiple: 2, weight: 0.6 },
  ])

  assert.equal(deltas.length, 2)
  assert.equal(deltas[0]?.multiple, 1)
  assert.ok(Math.abs((deltas[0]?.probability ?? 0) - 0.02) < 1e-12)
  assert.equal(deltas[1]?.multiple, 2)
  assert.ok(Math.abs((deltas[1]?.probability ?? 0) - 0.015) < 1e-12)

  const expectedBudget = deltas.reduce(
    (sum, delta) => sum + delta.multiple * delta.probability,
    0,
  )
  assert.ok(Math.abs(expectedBudget - 0.05) < 1e-12)
})

test('AWRA alpha is derived from admissible RawSurplus, never selected as a default', () => {
  assert.equal(deriveAwraAlpha(100, 25), 0.25)
  assert.equal(deriveAwraAlpha(0, 0), null)
  assert.throws(
    () => deriveAwraAlpha(10, 11),
    /AWRA budget exceeds RawSurplus/,
  )
})

test('the recovered 55-candidate grid can be evaluated on the current Classic-6 model', () => {
  const base = evaluateAwraDistribution(currentClassic6)
  const candidates = generateRecovered55Candidates()

  assert.equal(candidates.length, 55)
  assert.ok(Math.abs(base.expectedPayout - 0.64996875) < 1e-12)
  assert.ok(Math.abs(base.winRate - 0.234375) < 1e-12)
  assert.ok(Math.abs(base.profitWinRate - 0.085625) < 1e-12)
  assert.ok(Math.abs(base.probabilityAtLeast100x - 0.001999) < 1e-12)

  for (const candidate of candidates) {
    const evaluation = evaluateAwraCandidate(currentClassic6, candidate, AWRA_LOSS_OUTCOME_MULTIPLE)
    assert.ok(
      Math.abs(evaluation.expectedPayout - base.expectedPayout - candidate.budget) < 1e-10,
      candidate.id,
    )
  }
})

test('Jackpot funding consumes only its exact need and leaves the remainder for AWRA', () => {
  assert.equal(deriveAwraPostJackpotResidualSurplus(100, 40), 60)
  assert.equal(deriveAwraPostJackpotResidualSurplus(100, 0), 100)
  assert.equal(awraBudgetAdmissibleAfterJackpot(100, 40, 60), true)
  assert.equal(awraBudgetAdmissibleAfterJackpot(100, 40, 60.0000001), false)
})

test('AWRA cannot validate against pre-Jackpot RawSurplus when the Jackpot need is larger', () => {
  assert.equal(awraBudgetAdmissibleAfterJackpot(100, 75, 25), true)
  assert.equal(awraBudgetAdmissibleAfterJackpot(100, 75, 25.0000001), false)
  assert.throws(
    () => deriveAwraPostJackpotResidualSurplus(100, 101),
    /Jackpot funding need exceeds RawSurplus/,
  )
})

test('economic gate, viability and authorized preference remain separate', () => {
  const candidate = {
    id: 'candidate',
    budget: 10,
    weights: [{ multiple: 1, weight: 1 }],
  }

  const deniedByViability = admitAwraCandidate(10, candidate, {
    economicGate: () => true,
    viability: () => false,
    authorizedPolicy: () => true,
  })
  assert.equal(deniedByViability.economicGateAccepted, true)
  assert.equal(deniedByViability.viabilityAccepted, false)
  assert.equal(deniedByViability.authorizedPolicyAccepted, false)

  const candidates = [
    { id: 'unsafe-high', budget: 10, weights: [{ multiple: 1, weight: 1 }] },
    { id: 'safe-low', budget: 5, weights: [{ multiple: 1, weight: 1 }] },
  ]
  const selected = selectAuthorizedAwraCandidate(
    candidates,
    (value) => value.id === 'safe-low',
    (left, right) => right.budget - left.budget,
  )
  assert.equal(selected?.id, 'safe-low')
})
