#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

/*
 * Epistemic non-sovereignty boundary.
 * The two monitors receive the exact same observation but may derive
 * different metrics. Neither result can mutate the predeclared selector.
 */
const rawObservation = Object.freeze({
  observationId: 'obs-shared-001',
  samples: Object.freeze(['a', 'b', 'c', 'd']),
  evidenceRef: 'obs-evidence-001',
})

const contract = Object.freeze({
  version: 'viability-contract-v1',
  metricSelector: 'PREDECLARED',
  authority: 'institutional-selector-v1',
  evidenceContract: 'monitor-evidence-v1',
})

const monitorA = Object.freeze({
  version: 'monitor-a-v1',
  derive: (observation) => Object.freeze({
    observationId: observation.observationId,
    metricId: 'metric-a',
    value: observation.samples.length,
  }),
})

const monitorB = Object.freeze({
  version: 'monitor-b-v1',
  derive: (observation) => Object.freeze({
    observationId: observation.observationId,
    metricId: 'metric-b',
    value: observation.samples.slice().reverse().join(':'),
  }),
})

const metricsA = monitorA.derive(rawObservation)
const metricsB = monitorB.derive(rawObservation)

assert(metricsA.observationId === metricsB.observationId, 'competing monitors bind to the same raw observation')
assert(metricsA.metricId !== metricsB.metricId, 'competing monitors retain distinct metric identities')
assert(metricsA.value !== metricsB.value, 'competing monitors may legitimately derive different metrics')

const assess = (metrics, declaredContract, monitor) => Object.freeze({
  monitorVersion: monitor.version,
  metricId: metrics.metricId,
  observationId: metrics.observationId,
  contractVersion: declaredContract.version,
  authority: declaredContract.authority,
  evidenceContract: declaredContract.evidenceContract,
})

const assessedA = assess(metricsA, contract, monitorA)
const assessedB = assess(metricsB, contract, monitorB)

for (const assessed of [assessedA, assessedB]) {
  assert(assessed.contractVersion === contract.version, 'monitor assessment preserves the predeclared contract identity')
  assert(assessed.authority === contract.authority, 'monitor result does not replace normative authority')
  assert(assessed.evidenceContract === contract.evidenceContract, 'monitor result does not replace the evidence contract')
  assert(assessed.observationId === rawObservation.observationId, 'monitor assessment preserves observation provenance')
}

const divergentOutcome = Object.freeze({
  kind: 'CONTEST',
  observationId: rawObservation.observationId,
  monitorA: metricsA.metricId,
  monitorB: metricsB.metricId,
  contractVersion: contract.version,
})

assert(divergentOutcome.kind === 'CONTEST', 'divergent monitor results map to contestability rather than authority transfer')
assert(divergentOutcome.contractVersion === contract.version, 'contestability remains bound to the predeclared contract')

const attemptedPromotion = Object.freeze({
  ...contract,
  authority: 'authority-derived-from-monitor-output',
  metricSelector: metricsA.metricId,
})

assert(attemptedPromotion.authority !== contract.authority, 'result-dependent authority promotion is distinguishable')
assert(attemptedPromotion.metricSelector !== contract.metricSelector, 'result-dependent metric selection is distinguishable')

const admissibleSelection = Object.freeze({
  selector: contract.metricSelector,
  authority: contract.authority,
  source: 'predeclared-contract',
})

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const authorizeSelection = (candidate, declaredContract) => {
  if (!isRecord(candidate) || !isRecord(declaredContract)) return 'UNVERIFIABLE'
  if (candidate.selector !== declaredContract.metricSelector ||
      candidate.authority !== declaredContract.authority ||
      candidate.source !== 'predeclared-contract') {
    return 'REJECTED'
  }
  return 'AUTHORIZED'
}

assert(admissibleSelection.authority === contract.authority, 'only the predeclared contract supplies normative selector authority')
assert(admissibleSelection.source === 'predeclared-contract', 'normative selection remains independent of monitor output')
assert(authorizeSelection(admissibleSelection, contract) === 'AUTHORIZED', 'predeclared selector candidate is authorized')
assert(authorizeSelection(attemptedPromotion, contract) === 'REJECTED', 'result-dependent selector/authority promotion is actively rejected')
for (const malformed of [null, undefined, true, 1, 'selection', []]) {
  assert(authorizeSelection(malformed, contract) === 'UNVERIFIABLE', 'malformed selector candidate fails closed')
}
assert(authorizeSelection(admissibleSelection, []) === 'UNVERIFIABLE', 'malformed predeclared contract fails closed')
assert(authorizeSelection(admissibleSelection, new Date()) === 'UNVERIFIABLE', 'non-record contract object fails closed')
assert(authorizeSelection(new Date(), contract) === 'UNVERIFIABLE', 'non-record selector candidate fails closed')

console.log('ALL COMPETING-MONITOR EPISTEMIC NON-SOVEREIGNTY CHECKS PASSED')
