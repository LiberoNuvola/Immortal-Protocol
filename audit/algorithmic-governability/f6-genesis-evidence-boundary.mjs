#!/usr/bin/env node

const assert=(c,m)=>{if(!c)throw new Error(`FAIL: ${m}`);console.log(`PASS: ${m}`)}

const genesisAdmission=(o)=>{
  if(!o?.treasuryIdentity||!o?.preAssetIdentity||!o?.oracleIdentity) return 'UNVERIFIABLE'
  if(o.stale||o.malformed||o.wrongAsset||o.wrongTreasury||o.notProtocolControlled) return 'REJECTED'
  if(o.duplicateOrConcurrent) return 'REJECTED'
  if(o.bootstrapValueInPrizePool) return 'REJECTED'
  if(o.verifiedFresh!==true) return 'UNVERIFIABLE'
  if(o.bootstrapQualified!==true) return 'ADMISSIBLE'
  return 'NOT_ADMISSIBLE'
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

console.log('ALL F6 GENESIS EVIDENCE BOUNDARY CHECKS PASSED')
