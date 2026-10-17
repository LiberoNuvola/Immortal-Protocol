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


console.log('ALL R4 LIVENESS/SAFE-STALL BOUNDARY CHECKS PASSED')
