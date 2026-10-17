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

const genesisAdmission=(o)=>{
  if(!o) return 'UNVERIFIABLE'
  for (const field of ['treasuryIdentity','preAssetIdentity','oracleIdentity']) {
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

assert(genesisAdmission(null)==='UNVERIFIABLE','absent Genesis observation fails closed')
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
