#!/usr/bin/env node

const assert=(c,m)=>{if(!c)throw new Error(`FAIL: ${m}`);console.log(`PASS: ${m}`)}

const riskEvidenceFields = [
  'stale',
  'malformed',
  'wrongAsset',
  'wrongTreasury',
  'notProtocolControlled',
  'duplicateOrConcurrent',
  'bootstrapValueInPrizePool',
]

const isRecord=(value)=>{
  if(value===null || typeof value!=='object' || Array.isArray(value)) return false
  const prototype=Object.getPrototypeOf(value)
  return prototype===Object.prototype || prototype===null
}

const hasOwnData=(value,field)=>{
  const descriptor=Object.getOwnPropertyDescriptor(value,field)
  return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor,'value'))
}

const genesisAdmission=(o)=>{
  if(!isRecord(o)) return 'UNVERIFIABLE'
  const requiredIdentityFields=['treasuryIdentity','preAssetIdentity','oracleIdentity']
  const requiredEvidenceFields=[...riskEvidenceFields,'verifiedFresh','bootstrapQualified']
  // Validate descriptors before reading values: own accessors are not evidence
  // and must not execute while evaluating a Genesis admission candidate.
  for (const field of [...requiredIdentityFields,...requiredEvidenceFields]) {
    if(!hasOwnData(o,field)) return 'UNVERIFIABLE'
  }
  for (const field of requiredIdentityFields) {
    if(typeof o[field] !== 'string' || o[field].trim().length === 0) return 'UNVERIFIABLE'
  }
  // Unknown flags are not evidence that a risk is absent.
  if(riskEvidenceFields.some((field)=>typeof o[field] !== 'boolean')) return 'UNVERIFIABLE'
  if(riskEvidenceFields.some((field)=>o[field] === true)) return 'REJECTED'
  if(o.verifiedFresh!==true) return 'UNVERIFIABLE'
  if(typeof o.bootstrapQualified !== 'boolean') return 'UNVERIFIABLE'
  if(o.bootstrapQualified!==true) return 'NOT_ADMISSIBLE'
  return 'ADMISSIBLE'
}

const valid={
  treasuryIdentity:'treasury-1',preAssetIdentity:'pre-1',oracleIdentity:'oracle-1',
  verifiedFresh:true,bootstrapQualified:true,
  stale:false,malformed:false,wrongAsset:false,wrongTreasury:false,notProtocolControlled:false,
  duplicateOrConcurrent:false,bootstrapValueInPrizePool:false,
}
assert(genesisAdmission(valid)==='ADMISSIBLE','qualified Genesis candidate crosses the bounded admission boundary')
assert(genesisAdmission({...valid,stale:true})==='REJECTED','stale valuation is rejected')
assert(genesisAdmission({...valid,wrongAsset:true})==='REJECTED','wrong PRE asset is rejected')
assert(genesisAdmission({...valid,wrongTreasury:true})==='REJECTED','wrong Treasury is rejected')
assert(genesisAdmission({...valid,notProtocolControlled:true})==='REJECTED','non-protocol-controlled Treasury is rejected')
assert(genesisAdmission({...valid,duplicateOrConcurrent:true})==='REJECTED','duplicate/concurrent Genesis transition is rejected')
assert(genesisAdmission({...valid,bootstrapValueInPrizePool:true})==='REJECTED','bootstrap value is not treated as PrizePool liquidity')
assert(genesisAdmission({...valid,oracleIdentity:null})==='UNVERIFIABLE','missing oracle identity fails closed')
assert(genesisAdmission({...valid,verifiedFresh:false})==='UNVERIFIABLE','unverified valuation fails closed')
let genesisGetterCalls=0
const accessorIdentity={...valid}
Object.defineProperty(accessorIdentity,'treasuryIdentity',{enumerable:true,get(){genesisGetterCalls+=1;return valid.treasuryIdentity}})
assert(genesisAdmission(accessorIdentity)==='UNVERIFIABLE' && genesisGetterCalls===0,
  'accessor-backed Treasury identity fails closed without executing getter')
const accessorRisk={...valid}
Object.defineProperty(accessorRisk,'stale',{enumerable:true,get(){genesisGetterCalls+=1;return false}})
assert(genesisAdmission(accessorRisk)==='UNVERIFIABLE' && genesisGetterCalls===0,
  'accessor-backed risk flag fails closed without executing getter')

assert(genesisAdmission(null)==='UNVERIFIABLE','absent Genesis observation fails closed')
for (const malformed of [undefined, 'observation', 7, [], new Date()]) {
  assert(genesisAdmission(malformed)==='UNVERIFIABLE',
    `non-record Genesis observation (${String(malformed)}) fails closed`)
}
const inheritedObservation=Object.create(valid)
assert(genesisAdmission(inheritedObservation)==='UNVERIFIABLE',
  'inherited Genesis identities and risk flags cannot certify admission')
const inheritedRisk=Object.create(valid)
Object.defineProperty(inheritedRisk,'treasuryIdentity',{value:'treasury-1',enumerable:true})
Object.defineProperty(inheritedRisk,'preAssetIdentity',{value:'pre-1',enumerable:true})
Object.defineProperty(inheritedRisk,'oracleIdentity',{value:'oracle-1',enumerable:true})
assert(genesisAdmission(inheritedRisk)==='UNVERIFIABLE',
  'inherited risk-evidence flags cannot be treated as evidence of safety')
assert(genesisAdmission({...valid,treasuryIdentity:'   '})==='UNVERIFIABLE','blank Treasury identity fails closed')

for (const field of riskEvidenceFields) {
  const missing = { ...valid }
  delete missing[field]
  assert(
    genesisAdmission(missing)==='UNVERIFIABLE',
    `unknown Treasury/oracle risk evidence ${field} leaves admission unverifiable`,
  )
  assert(
    genesisAdmission({ ...valid, [field]: null })==='UNVERIFIABLE',
    `null Treasury/oracle risk evidence ${field} is not evidence of safety`,
  )
  assert(
    genesisAdmission({ ...valid, [field]: 'false' })==='UNVERIFIABLE',
    `untyped Treasury/oracle risk evidence ${field} is not admissible`,
  )
}

for (const field of riskEvidenceFields) {
  assert(
    genesisAdmission({ ...valid, [field]: true }) === 'REJECTED',
    `positive risk evidence ${field} is rejected`,
  )
}

assert(genesisAdmission({...valid,bootstrapQualified:false})==='NOT_ADMISSIBLE','explicitly unqualified Genesis candidate is not admissible')
assert(genesisAdmission({...valid,bootstrapQualified:null})==='UNVERIFIABLE','unknown bootstrap qualification is not treated as a negative result')
assert(genesisAdmission({...valid,bootstrapQualified:'true'})==='UNVERIFIABLE','untyped bootstrap qualification fails closed')


console.log('ALL F6 GENESIS EVIDENCE BOUNDARY CHECKS PASSED')
