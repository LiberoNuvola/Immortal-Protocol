#!/usr/bin/env node

const assert=(c,m)=>{if(!c)throw new Error(`FAIL: ${m}`);console.log(`PASS: ${m}`)}

const riskEvidenceFields = [
  'overrideAdmission',
  'weakenedSafe',
  'enlargedKcWithoutCertificate',
  'missingObligationsAsSurplus',
]

const progressGate=(e)=>{
  if(!e || e.condition!==true || e.observableEvent!==true) return 'NOT_DISCHARGED'
  if(riskEvidenceFields.some((field)=>typeof e[field] !== 'boolean')) return 'NOT_DISCHARGED'
  if(riskEvidenceFields.some((field)=>e[field] === true)) return 'REJECT'
  if(e.revalidated!==true) return 'NOT_DISCHARGED'
  if(e.atomic!==true) return 'NOT_DISCHARGED'
  return 'DISCHARGED'
}

const valid={
  condition:true,observableEvent:true,revalidated:true,atomic:true,
  overrideAdmission:false,weakenedSafe:false,enlargedKcWithoutCertificate:false,
  missingObligationsAsSurplus:false,
}
assert(progressGate(valid)==='DISCHARGED','bounded liveness evidence requires observable condition plus revalidation and atomicity')
assert(progressGate({...valid,overrideAdmission:true})==='REJECT','relayer/operator cannot override admission for progress')
assert(progressGate({...valid,weakenedSafe:true})==='REJECT','Safe cannot be weakened to obtain progress')
assert(progressGate({...valid,enlargedKcWithoutCertificate:true})==='REJECT','Kc cannot be enlarged without a certificate')
assert(progressGate({...valid,missingObligationsAsSurplus:true})==='REJECT','missing obligations cannot become surplus')
assert(progressGate({...valid,revalidated:false})==='NOT_DISCHARGED','missing commit-time revalidation leaves progress not discharged')
assert(progressGate({...valid,atomic:false})==='NOT_DISCHARGED','non-atomic transition leaves progress not discharged')
assert(progressGate({condition:true,observableEvent:true})==='NOT_DISCHARGED','deployment claims cannot discharge from partial evidence')

assert(progressGate({...valid,condition:'true'})==='NOT_DISCHARGED','truthy non-boolean condition is not accepted as observed evidence')
assert(progressGate({...valid,observableEvent:1})==='NOT_DISCHARGED','non-boolean observable event is not accepted as evidence')

for (const field of riskEvidenceFields) {
  const missing = { ...valid }
  delete missing[field]
  assert(progressGate(missing)==='NOT_DISCHARGED', `${field} absent leaves progress not discharged`)

  assert(
    progressGate({ ...valid, [field]: null })==='NOT_DISCHARGED',
    `${field} null is unknown, not proof that the risk is absent`,
  )
  assert(
    progressGate({ ...valid, [field]: 'false' })==='NOT_DISCHARGED',
    `${field} string value is not accepted as typed risk evidence`,
  )
}


/*
 * Evidence-packet shape from R4-LIVENESS-EVIDENCE-MATRIX-v1.
 * Shape validation is not deployment evidence and does not prove progress.
 */
const hasNonBlankString = (value) =>
  typeof value === 'string' && value.trim().length > 0

const isUtcTimestamp = (value) => {
  if (typeof value !== 'string' ||
      !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/.test(value)) {
    return false
  }
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && new Date(parsed).toISOString().replace(/\\.000Z$/, 'Z') === value
}

const r4Classes = new Set(Array.from({ length: 10 }, (_, i) => `FM${i + 1}`))

const validateEvidencePacket = (p) => {
  if (!p || typeof p !== 'object') return 'NOT_DISCHARGED'
  for (const field of [
    'canonicalPreStateRef',
    'expectedEligibleAction',
    'gateResult',
    'finalOutcome',
    'sourceRef',
    'toolchainRef',
    'runtimeRef',
  ]) {
    if (!hasNonBlankString(p[field])) return 'NOT_DISCHARGED'
  }
  if (!Array.isArray(p.authoritativeInputRefs) ||
      p.authoritativeInputRefs.length === 0 ||
      p.authoritativeInputRefs.some(ref => !hasNonBlankString(ref))) {
    return 'NOT_DISCHARGED'
  }
  if (!isUtcTimestamp(p.observedAt) || !isUtcTimestamp(p.gateEvaluatedAt)) {
    return 'NOT_DISCHARGED'
  }
  if (!r4Classes.has(p.r4Classification)) return 'NOT_DISCHARGED'
  if (!Object.prototype.hasOwnProperty.call(p, 'recoveryAction')) return 'NOT_DISCHARGED'
  if (p.recoveryAction !== null && !hasNonBlankString(p.recoveryAction)) {
    return 'NOT_DISCHARGED'
  }
  return 'PACKET_SHAPE_COMPLETE'
}

const evidencePacket = Object.freeze({
  canonicalPreStateRef: 'fixture:pre-state-7',
  expectedEligibleAction: 'Expire',
  authoritativeInputRefs: Object.freeze(['fixture:expiry-observation-1']),
  observedAt: '2026-10-17T08:30:00Z',
  gateEvaluatedAt: '2026-10-17T08:30:01Z',
  gateResult: 'REJECT',
  r4Classification: 'FM1',
  recoveryAction: null,
  finalOutcome: 'SAFE_STALL',
  sourceRef: 'commit:fixture-source',
  toolchainRef: 'node-22',
  runtimeRef: 'fixture-runtime-v1',
})

assert(
  validateEvidencePacket(evidencePacket) === 'PACKET_SHAPE_COMPLETE',
  'R4 incident packet binds state, action, inputs, timestamps, classification, outcome and provenance',
)
assert(
  validateEvidencePacket({ ...evidencePacket, canonicalPreStateRef: '' }) === 'NOT_DISCHARGED',
  'missing canonical pre-state reference leaves incident evidence incomplete',
)
assert(
  validateEvidencePacket({ ...evidencePacket, authoritativeInputRefs: [] }) === 'NOT_DISCHARGED',
  'empty authoritative-input references cannot support an incident classification',
)
assert(
  validateEvidencePacket({ ...evidencePacket, observedAt: '17/10/2026 08:30' }) === 'NOT_DISCHARGED',
  'non-canonical observation timestamp leaves incident evidence incomplete',
)
assert(
  validateEvidencePacket({ ...evidencePacket, observedAt: '2026-02-30T08:30:00Z' }) === 'NOT_DISCHARGED',
  'calendar-invalid UTC timestamp cannot be normalized into accepted observation evidence',
)
assert(
  validateEvidencePacket({ ...evidencePacket, r4Classification: 'FM11' }) === 'NOT_DISCHARGED',
  'incident classification must use the existing FM1-FM10 taxonomy',
)
assert(
  validateEvidencePacket({ ...evidencePacket, recoveryAction: undefined }) === 'NOT_DISCHARGED',
  'recovery disposition must be explicit even when no recovery was taken',
)
assert(
  validateEvidencePacket({ ...evidencePacket, runtimeRef: ' ' }) === 'NOT_DISCHARGED',
  'missing runtime provenance leaves incident evidence incomplete',
)

console.log('ALL R4 LIVENESS/SAFE-STALL BOUNDARY CHECKS PASSED')
