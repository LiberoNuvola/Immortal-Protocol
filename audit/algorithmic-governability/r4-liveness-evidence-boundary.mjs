#!/usr/bin/env node

const assert=(c,m)=>{if(!c)throw new Error(`FAIL: ${m}`);console.log(`PASS: ${m}`)}

const riskEvidenceFields = [
  'overrideAdmission',
  'weakenedSafe',
  'enlargedKcWithoutCertificate',
  'missingObligationsAsSurplus',
]

const ownDataValue = (record, field) => {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) return undefined
  const prototype = Object.getPrototypeOf(record)
  if (prototype !== Object.prototype && prototype !== null) return undefined
  const descriptor = Object.getOwnPropertyDescriptor(record, field)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value
    : undefined
}

const progressGate=(e)=>{
  if (e === null || typeof e !== 'object' || Array.isArray(e)) return 'NOT_DISCHARGED'
  const prototype = Object.getPrototypeOf(e)
  if (prototype !== Object.prototype && prototype !== null) return 'NOT_DISCHARGED'
  const requiredFields = ['condition', 'observableEvent', 'revalidated', 'atomic', ...riskEvidenceFields]
  const values = Object.create(null)
  for (const field of requiredFields) {
    const value = ownDataValue(e, field)
    if (value === undefined) return 'NOT_DISCHARGED'
    values[field] = value
  }
  if(values.condition!==true || values.observableEvent!==true) return 'NOT_DISCHARGED'
  if(riskEvidenceFields.some((field)=>typeof values[field] !== 'boolean')) return 'NOT_DISCHARGED'
  if(riskEvidenceFields.some((field)=>values[field] === true)) return 'REJECT'
  if(values.revalidated!==true) return 'NOT_DISCHARGED'
  if(values.atomic!==true) return 'NOT_DISCHARGED'
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
let progressGetterCalls = 0
const accessorProgress = { ...valid }
Object.defineProperty(accessorProgress, 'condition', {
  get() { progressGetterCalls += 1; return true },
})
assert(progressGate(accessorProgress)==='NOT_DISCHARGED' && progressGetterCalls===0,
  'accessor-backed progress evidence fails closed without executing getters')

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
  return Number.isFinite(parsed) && new Date(parsed).toISOString().replace(/\.000Z$/, 'Z') === value
}

const r4Classes = new Set(Array.from({ length: 10 }, (_, i) => `FM${i + 1}`))

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const validateEvidencePacket = (p) => {
  if (!isRecord(p)) return 'NOT_DISCHARGED'
  const requiredFields = [
    'canonicalPreStateRef',
    'expectedEligibleAction',
    'gateResult',
    'finalOutcome',
    'sourceRef',
    'toolchainRef',
    'runtimeRef',
    'authoritativeInputRefs',
    'observedAt',
    'gateEvaluatedAt',
    'r4Classification',
    'recoveryAction',
  ]
  const values = Object.create(null)
  for (const field of requiredFields) {
    const descriptor = Object.getOwnPropertyDescriptor(p, field)
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return 'NOT_DISCHARGED'
    values[field] = descriptor.value
  }
  for (const field of [
    'canonicalPreStateRef',
    'expectedEligibleAction',
    'gateResult',
    'finalOutcome',
    'sourceRef',
    'toolchainRef',
    'runtimeRef',
  ]) {
    if (!hasNonBlankString(values[field])) return 'NOT_DISCHARGED'
  }
  const refs = values.authoritativeInputRefs
  if (!Array.isArray(refs) || refs.length === 0) return 'NOT_DISCHARGED'
  for (let index = 0; index < refs.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(refs, String(index))
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value') ||
        !hasNonBlankString(descriptor.value)) return 'NOT_DISCHARGED'
  }
  if (!isUtcTimestamp(values.observedAt) || !isUtcTimestamp(values.gateEvaluatedAt)) {
    return 'NOT_DISCHARGED'
  }
  if (!r4Classes.has(values.r4Classification)) return 'NOT_DISCHARGED'
  if (values.recoveryAction !== null && !hasNonBlankString(values.recoveryAction)) {
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
let packetGetterCalls = 0
const accessorPacket = { ...evidencePacket }
Object.defineProperty(accessorPacket, 'gateResult', {
  get() { packetGetterCalls += 1; return 'REJECT' },
})
assert(validateEvidencePacket(accessorPacket)==='NOT_DISCHARGED' && packetGetterCalls===0,
  'accessor-backed incident metadata fails closed without executing getters')
const accessorRefs = ['fixture:expiry-observation-1']
Object.defineProperty(accessorRefs, 'some', {
  value() { packetGetterCalls += 1; return false },
})
assert(validateEvidencePacket({ ...evidencePacket, authoritativeInputRefs: accessorRefs })==='PACKET_SHAPE_COMPLETE' && packetGetterCalls===0,
  'caller-overridden array methods cannot influence authoritative-input validation')
const accessorRefElement = []
accessorRefElement.length = 1
Object.defineProperty(accessorRefElement, '0', {
  get() { packetGetterCalls += 1; return 'fixture:expiry-observation-1' },
})
assert(validateEvidencePacket({ ...evidencePacket, authoritativeInputRefs: accessorRefElement })==='NOT_DISCHARGED' && packetGetterCalls===0,
  'accessor-backed authoritative-input entries fail closed without executing getters')

for (const malformed of [null, undefined, 'packet', 7, [], Object.assign([], evidencePacket)]) {
  assert(validateEvidencePacket(malformed) === 'NOT_DISCHARGED',
    'malformed R4 evidence-packet container fails closed')
}

console.log('ALL R4 LIVENESS/SAFE-STALL BOUNDARY CHECKS PASSED')
