#!/usr/bin/env node

const assert=(condition,message)=>{
  if(!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const record=Object.freeze({
  contributionId:'c-001',
  evidenceRef:'evidence-001',
  accepted:true,
  verified:true,
  ruleVersion:'credential-v1',
})

const credential=Object.freeze({
  credentialId:'cred-001',
  contributionId:record.contributionId,
  evidenceRef:record.evidenceRef,
  ruleVersion:record.ruleVersion,
})

const eligible=(r,c)=>{
  if(!r?.accepted||!r?.verified) return 'UNVERIFIABLE'
  if(c.contributionId!==r.contributionId||c.evidenceRef!==r.evidenceRef||c.ruleVersion!==r.ruleVersion){
    return 'UNVERIFIABLE'
  }
  return 'ELIGIBLE'
}

assert(eligible(record,credential)==='ELIGIBLE','credential binds to verified contribution identity')
assert(!('rewardBudget' in credential),'credential does not carry an implicit reward budget')
assert(!('governanceAuthority' in credential),'credential does not carry implicit governance authority')
assert(!('treasuryAuthority' in credential),'credential does not carry implicit Treasury authority')

const forged=Object.freeze({...credential,contributionId:'c-999'})
assert(eligible(record,forged)==='UNVERIFIABLE','credential cannot point at another contribution')

const revoked=Object.freeze({...record,accepted:false})
assert(eligible(revoked,credential)==='UNVERIFIABLE','revoked/corrected contribution cannot retain eligibility')

const selfAuthorized=Object.freeze({...credential,authority:'self-issued'})
assert(!('authority' in credential),'canonical credential has no self-authorizing authority field')
assert(eligible(record,selfAuthorized)==='ELIGIBLE','undeclared authority metadata does not change eligibility semantics')

console.log('ALL CONTRIBUTOR REWARD NFT ANTI-CAPTURE CHECKS PASSED')
