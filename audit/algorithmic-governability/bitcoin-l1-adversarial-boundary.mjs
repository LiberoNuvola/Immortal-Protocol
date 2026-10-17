#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const classify = (observation) => {
  if (!isRecord(observation)) return 'UNVERIFIABLE'
  const { txValid, admissionRef, semanticMatch, finalityStatus } = observation
  if (!txValid) return 'CHAIN-INVALID'
  if (finalityStatus === 'REORG-UNCERTAIN') return 'OBSERVATION-DOWNGRADED'
  if (!admissionRef) return 'CHAIN-OBSERVED/IMMORTAL-ADMISSION-MISSING'
  if (!semanticMatch) return 'CHAIN-OBSERVED/POST-STATE-MISMATCH'
  return 'EXECUTION-CANDIDATE'
}

assert(
  classify({ txValid: true, admissionRef: null, semanticMatch: true, finalityStatus: 'OBSERVED' }) ===
    'CHAIN-OBSERVED/IMMORTAL-ADMISSION-MISSING',
  'valid Bitcoin observation without IMMORTAL admission is not ExecAccept',
)

assert(
  classify({ txValid: true, admissionRef: 'admission-1', semanticMatch: false, finalityStatus: 'OBSERVED' }) ===
    'CHAIN-OBSERVED/POST-STATE-MISMATCH',
  'valid inclusion with semantic post-state mismatch is rejected as equivalent execution',
)

assert(
  classify({ txValid: true, admissionRef: 'admission-1', semanticMatch: true, finalityStatus: 'REORG-UNCERTAIN' }) ===
    'OBSERVATION-DOWNGRADED',
  'reorg uncertainty downgrades prior observation',
)

assert(
  classify({ txValid: true, admissionRef: 'admission-1', semanticMatch: true, finalityStatus: 'OBSERVED' }) ===
    'EXECUTION-CANDIDATE',
  'only the fully bound research candidate reaches the execution-candidate classification',
)

for (const malformed of [null, undefined, 'observation', 7, [], Object.assign([], {
  txValid: true,
  admissionRef: 'admission-1',
  semanticMatch: true,
  finalityStatus: 'OBSERVED',
})]) {
  assert(classify(malformed) === 'UNVERIFIABLE',
    'malformed Bitcoin observation container fails closed')
}

console.log('ALL BITCOIN L1 ADVERSARIAL BOUNDARY CHECKS PASSED')
