#!/usr/bin/env node

const assert=(c,m)=>{if(!c)throw new Error(`FAIL: ${m}`);console.log(`PASS: ${m}`)}

const progressGate=(e)=>{
  if(!e?.condition||!e.observableEvent) return 'NOT_DISCHARGED'
  if(e.overrideAdmission===true) return 'REJECT'
  if(e.weakenedSafe===true) return 'REJECT'
  if(e.enlargedKcWithoutCertificate===true) return 'REJECT'
  if(e.missingObligationsAsSurplus===true) return 'REJECT'
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

console.log('ALL R4 LIVENESS/SAFE-STALL BOUNDARY CHECKS PASSED')
