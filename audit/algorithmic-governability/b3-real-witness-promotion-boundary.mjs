#!/usr/bin/env node

const assert=(condition,message)=>{
  if(!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const promotion = (packet) => {
  if(!packet?.sourceReference||!packet?.verificationReference) return 'UNVERIFIABLE'
  if(packet.synthetic===true) return 'NOT_A_REAL_WITNESS'
  if(packet.selfAttestedAuthority===true) return 'NOT_A_REAL_WITNESS'
  if(packet.proofMaterial!=='REAL_PROOF') return 'NOT_A_REAL_WITNESS'
  if(packet.independentVerification!=='VERIFIED') return 'NOT_A_REAL_WITNESS'
  return 'ELIGIBLE_FOR_WITNESS_REVIEW'
}

const fixture={
  sourceReference:'fixture://b3-a',
  verificationReference:'fixture-verifier',
  synthetic:true,
  proofMaterial:'FIXTURE',
  independentVerification:'VERIFIED',
}
assert(promotion(fixture)==='NOT_A_REAL_WITNESS','synthetic fixture cannot be promoted to a real witness')

const selfAttested={
  sourceReference:'observer://claim',
  verificationReference:'self-check',
  synthetic:false,
  selfAttestedAuthority:true,
  proofMaterial:'REAL_PROOF',
  independentVerification:'VERIFIED',
}
assert(promotion(selfAttested)==='NOT_A_REAL_WITNESS','self-attested authority cannot establish witness authenticity')

const incomplete={
  sourceReference:'materios://observation',
  verificationReference:'verifier-001',
  synthetic:false,
  proofMaterial:'REAL_PROOF',
  independentVerification:'UNKNOWN',
}
assert(promotion(incomplete)==='NOT_A_REAL_WITNESS','independent verification is mandatory for witness promotion')

const candidate={
  sourceReference:'materios://observation',
  verificationReference:'verifier-001',
  synthetic:false,
  proofMaterial:'REAL_PROOF',
  independentVerification:'VERIFIED',
}
assert(promotion(candidate)==='ELIGIBLE_FOR_WITNESS_REVIEW','only source-bound independently verified proof material reaches witness review')

console.log('ALL B3 REAL-WITNESS PROMOTION CHECKS PASSED')
