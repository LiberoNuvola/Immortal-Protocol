#!/usr/bin/env node

const assert=(condition,message)=>{
  if(!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

// This harness has no production cryptographic verifier wired into it.
// Packet fields are claims, not proof that the claims are authentic.
const promotion = (packet) => {
  if(packet===null || typeof packet!=='object' || Array.isArray(packet)) return 'UNVERIFIABLE'
  const prototype=Object.getPrototypeOf(packet)
  if(prototype!==Object.prototype && prototype!==null) return 'UNVERIFIABLE'
  for(const key of ['sourceReference','verificationReference','synthetic','selfAttestedAuthority','proofMaterial','independentVerification']) {
    const descriptor=Object.getOwnPropertyDescriptor(packet,key)
    if(!descriptor || !Object.prototype.hasOwnProperty.call(descriptor,'value')) return 'UNVERIFIABLE'
  }
  if(typeof packet.sourceReference!=='string' || !packet.sourceReference.trim()) return 'UNVERIFIABLE'
  if(typeof packet.verificationReference!=='string' || !packet.verificationReference.trim()) return 'UNVERIFIABLE'
  if(packet.synthetic===true || packet.selfAttestedAuthority===true) return 'NOT_A_REAL_WITNESS'
  if(packet.proofMaterial!=='REAL_PROOF' || packet.independentVerification!=='VERIFIED') return 'NOT_A_REAL_WITNESS'
  return 'UNVERIFIABLE'
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
assert(promotion(incomplete)==='NOT_A_REAL_WITNESS','independent verification claim alone is insufficient')

const claimOnlyCandidate={
  sourceReference:'materios://observation',
  verificationReference:'verifier-001',
  synthetic:false,
  proofMaterial:'REAL_PROOF',
  independentVerification:'VERIFIED',
}
assert(promotion(claimOnlyCandidate)==='UNVERIFIABLE','complete-looking claims remain unverifiable without a wired cryptographic verifier')

assert(promotion([])==='UNVERIFIABLE','array packet rejected')
assert(promotion(new Date())==='UNVERIFIABLE','Date packet rejected')
assert(promotion(null)==='UNVERIFIABLE','null packet rejected')
const inherited=Object.create({sourceReference:'materios://forged'})
inherited.verificationReference='verifier-001'
inherited.synthetic=false
inherited.selfAttestedAuthority=false
inherited.proofMaterial='REAL_PROOF'
inherited.independentVerification='VERIFIED'
assert(promotion(inherited)==='UNVERIFIABLE','inherited packet fields cannot establish provenance')

const accessor={}
Object.defineProperty(accessor,'sourceReference',{get(){return 'materios://forged'},enumerable:true})
for(const [key,value] of Object.entries({verificationReference:'verifier-001',synthetic:false,selfAttestedAuthority:false,proofMaterial:'REAL_PROOF',independentVerification:'VERIFIED'})) accessor[key]=value
assert(promotion(accessor)==='UNVERIFIABLE','accessor-backed packet fields are rejected')

console.log('B3 REAL-WITNESS PROMOTION BOUNDARY PASSED')
console.log('OPEN: no production cryptographic verifier is wired; no candidate is promoted to witness review')
