#!/usr/bin/env node

const assert=(condition,message)=>{
  if(!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const hasNonBlankString = (value) =>
  typeof value === 'string' && value.trim().length > 0

const record=Object.freeze({
  contributionId:'c-001',
  contributorId:'identity-1',
  evidenceRef:'evidence-001',
  evidenceContract:'contribution-evidence-v1',
  accepted:true,
  verified:true,
  ruleVersion:'credential-v1',
})

const credential=Object.freeze({
  credentialId:'cred-001',
  contributionId:record.contributionId,
  contributorId:record.contributorId,
  evidenceRef:record.evidenceRef,
  evidenceContract:record.evidenceContract,
  ruleVersion:record.ruleVersion,
})

const eligible=(r,c)=>{
  if(r?.accepted !== true || r?.verified !== true) return 'UNVERIFIABLE'

  for(const field of ['contributionId','contributorId','evidenceRef','evidenceContract','ruleVersion']){
    if(!hasNonBlankString(r?.[field])) return 'UNVERIFIABLE'
    if(!hasNonBlankString(c?.[field])) return 'UNVERIFIABLE'
    if(c[field] !== r[field]) return 'UNVERIFIABLE'
  }

  if(!hasNonBlankString(c?.credentialId)) return 'UNVERIFIABLE'
  return 'ELIGIBLE'
}

assert(eligible(record,credential)==='ELIGIBLE','credential binds to verified contribution, contributor, evidence and rule identity')
assert(!('rewardBudget' in credential),'credential does not carry an implicit reward budget')
assert(!('governanceAuthority' in credential),'credential does not carry implicit governance authority')
assert(!('treasuryAuthority' in credential),'credential does not carry implicit Treasury authority')

const forged=Object.freeze({...credential,contributionId:'c-999'})
assert(eligible(record,forged)==='UNVERIFIABLE','credential cannot point at another contribution')

const forgedContributor=Object.freeze({...credential,contributorId:'identity-999'})
assert(eligible(record,forgedContributor)==='UNVERIFIABLE','credential cannot rebind a contribution to another contributor')

const forgedEvidenceContract=Object.freeze({...credential,evidenceContract:'other-evidence-v9'})
assert(eligible(record,forgedEvidenceContract)==='UNVERIFIABLE','credential cannot substitute another evidence-contract version')

const missingEvidence=Object.freeze({...credential,evidenceRef:'  '})
assert(eligible(record,missingEvidence)==='UNVERIFIABLE','blank evidence reference leaves credential eligibility unverifiable')

const missingCredentialId=Object.freeze({...credential,credentialId:''})
assert(eligible(record,missingCredentialId)==='UNVERIFIABLE','credential without a stable credential identity remains unverifiable')

const revoked=Object.freeze({...record,accepted:false})
assert(eligible(revoked,credential)==='UNVERIFIABLE','revoked/corrected contribution cannot retain eligibility')

const truthyAcceptance=Object.freeze({...record,accepted:'true'})
assert(eligible(truthyAcceptance,credential)==='UNVERIFIABLE','truthy non-boolean acceptance cannot qualify a contribution')

const truthyVerification=Object.freeze({...record,verified:1})
assert(eligible(truthyVerification,credential)==='UNVERIFIABLE','untyped verification cannot qualify a contribution')

const selfAuthorized=Object.freeze({...credential,authority:'self-issued'})
assert(!('authority' in credential),'canonical credential has no self-authorizing authority field')
assert(eligible(record,selfAuthorized)==='ELIGIBLE','undeclared authority metadata does not change eligibility semantics')

console.log('ALL CONTRIBUTOR REWARD NFT ANTI-CAPTURE CHECKS PASSED')
