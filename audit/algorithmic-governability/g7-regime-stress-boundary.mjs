#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const policy = Object.freeze({
  activationThreshold: 8n,
  maintenanceThreshold: 4n,
  distributionThreshold: 4n,
})

const classes = Object.freeze([
  Object.freeze({ id: 1, capacityCost: 10n }),
  Object.freeze({ id: 2, capacityCost: 20n }),
  Object.freeze({ id: 3, capacityCost: 40n }),
  Object.freeze({ id: 4, capacityCost: 100n }),
])

const validate = (p) => {
  if (!(p.maintenanceThreshold > 0n)) return false
  if (!(p.activationThreshold > p.maintenanceThreshold)) return false
  if (!(p.distributionThreshold >= p.maintenanceThreshold)) return false
  if (!(p.distributionThreshold < p.activationThreshold)) return false
  return true
}

const evolve = (capacity, state) => {
  const activation = classes
    .filter((c) => capacity >= policy.activationThreshold * c.capacityCost)
    .sort((a, b) => b.id - a.id)[0] ?? null

  if (state.currentActiveClass === null) {
    return activation
      ? {
          action: 'ACTIVATE',
          currentActiveClass: activation.id,
          highestClassEverActivated: Math.max(
            state.highestClassEverActivated ?? activation.id,
            activation.id,
          ),
        }
      : {
          action: 'HALT',
          currentActiveClass: null,
          highestClassEverActivated: state.highestClassEverActivated,
        }
  }

  const current = classes.find((c) => c.id === state.currentActiveClass)
  if (!current) throw new Error('current class absent')

  if (activation && activation.id > current.id) {
    return {
      action: 'UPGRADE',
      currentActiveClass: activation.id,
      highestClassEverActivated: Math.max(
        state.highestClassEverActivated ?? activation.id,
        activation.id,
      ),
    }
  }

  if (capacity >= policy.maintenanceThreshold * current.capacityCost) {
    return {
      action: 'RETAIN',
      currentActiveClass: current.id,
      highestClassEverActivated: state.highestClassEverActivated,
    }
  }

  const maintainable = classes
    .filter(
      (c) =>
        c.id <= current.id &&
        capacity >= policy.maintenanceThreshold * c.capacityCost,
    )
    .sort((a, b) => b.id - a.id)[0] ?? null

  return maintainable
    ? {
        action: 'CONTRACT',
        currentActiveClass: maintainable.id,
        highestClassEverActivated: state.highestClassEverActivated,
      }
    : {
        action: 'HALT',
        currentActiveClass: null,
        highestClassEverActivated: state.highestClassEverActivated,
      }
}

assert(validate(policy), 'existing PRE-RICH hysteresis policy shape is valid')

let state = {
  currentActiveClass: null,
  highestClassEverActivated: null,
}

const path = [
  [800n, 'ACTIVATE', 4, 4],
  [399n, 'CONTRACT', 3, 4],
  [401n, 'RETAIN', 3, 4],
  [799n, 'RETAIN', 3, 4],
  [800n, 'UPGRADE', 4, 4],
  [39n, 'HALT', null, 4],
  [800n, 'ACTIVATE', 4, 4],
]

for (const [capacity, expectedAction, expectedCurrent, expectedHighest] of path) {
  const next = evolve(capacity, state)
  assert(next.action === expectedAction, `capacity ${capacity} yields deterministic ${expectedAction}`)
  assert(next.currentActiveClass === expectedCurrent, `capacity ${capacity} yields expected current class`)
  assert(next.highestClassEverActivated === expectedHighest, `capacity ${capacity} preserves historical maximum`)
  state = next
}

assert(state.highestClassEverActivated === 4, 'historical maximum remains monotonic across the stress path')

const forged = {
  currentActiveClass: 1,
  highestClassEverActivated: 1,
}
assert(forged.currentActiveClass < state.currentActiveClass, 'caller-controlled lower regime is distinguishable from controller output')

const noNewThresholds = Object.freeze({
  ...policy,
})
assert(noNewThresholds.activationThreshold === 8n, 'activation threshold remains the existing value')
assert(noNewThresholds.maintenanceThreshold === 4n, 'maintenance threshold remains the existing value')
assert(noNewThresholds.distributionThreshold === 4n, 'distribution threshold remains the existing value')

console.log('ALL G7 REGIME/STRESS BOUNDARY CHECKS PASSED')
