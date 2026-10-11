#!/usr/bin/env node
const assert=(c,m)=>{if(!c)throw new Error("FAIL: "+m);console.log("PASS: "+m)}
const intent=Object.freeze({action:"Issue",classId:3n,price:5n})
const admission=Object.freeze({admitted:true,actionClass:"Issue",decisionReference:"admission:001",stateHash:"aa".repeat(32),actionFingerprint:"bb".repeat(32)})
const prepare=(i,a)=>{if(!a||a.admitted!==true)return"UNVERIFIABLE";if(a.actionClass!==i.action)return"REJECTED";if(!a.decisionReference||!a.stateHash||!a.actionFingerprint)return"UNVERIFIABLE";return Object.freeze({adapter:"MIDNIGHT",actionClass:"Issue",intent:i,admissionDecisionReference:a.decisionReference,admissionStateHash:a.stateHash,actionFingerprint:a.actionFingerprint,circuitName:"issue"})}
const env=prepare(intent,admission)
assert(env.adapter==="MIDNIGHT","admitted Intent produces a bounded Midnight execution envelope")
const receipt=Object.freeze({adapter:"MIDNIGHT",actionClass:"Issue",transactionReference:"tx:001",circuitName:"issue",admissionDecisionReference:"admission:001",admissionStateHash:"aa".repeat(32),actionFingerprint:"bb".repeat(32),finalityReference:"finality:001",status:"FINALIZED"})
const bind=(e,r)=>{if(r.adapter!==e.adapter||r.actionClass!==e.actionClass)return"REJECTED";if(r.circuitName!==e.circuitName||r.admissionDecisionReference!==e.admissionDecisionReference||r.admissionStateHash!==e.admissionStateHash||r.actionFingerprint!==e.actionFingerprint)return"REJECTED";if(r.status!=="FINALIZED")return"UNVERIFIABLE";if(!r.transactionReference||!r.finalityReference)return"UNVERIFIABLE";if(!/^[0-9a-fA-F]{64}$/.test(r.admissionStateHash)||!/^[0-9a-fA-F]{64}$/.test(r.actionFingerprint))return"UNVERIFIABLE";return Object.freeze(r)}
const bound=bind(env,receipt)
assert(bound!=="REJECTED"&&bound!=="UNVERIFIABLE","finalized receipt is bound to the admitted envelope")
const obs=Object.freeze({adapter:"MIDNIGHT",observationReference:"obs:001",contractReference:"contract:001",ledgerStateReference:"ledger:001",sourceReference:"public-data:001"})
const evidence=Object.freeze({adapter:"MIDNIGHT",actionClass:"Issue",admissionDecisionReference:env.admissionDecisionReference,admissionStateHash:env.admissionStateHash,actionFingerprint:env.actionFingerprint,circuitName:env.circuitName,transactionReference:receipt.transactionReference,finalityReference:receipt.finalityReference,observationReference:obs.observationReference,ledgerStateReference:obs.ledgerStateReference,sourceReference:obs.sourceReference})
assert(evidence.admissionStateHash===admission.stateHash,"economic admission identity remains bound")
assert(evidence.transactionReference===receipt.transactionReference,"execution identity remains bound")
assert(evidence.observationReference===obs.observationReference,"observation identity remains distinct")
assert(bind(env,Object.freeze({...receipt,actionFingerprint:"cc".repeat(32)}))==="REJECTED","receipt fingerprint mutation is rejected")
assert(bind(env,Object.freeze({...receipt,status:"SUBMITTED"}))==="UNVERIFIABLE","non-finalized receipt cannot close execution evidence")
assert(obs.adapter==="MIDNIGHT"&&obs.sourceReference,"public observation is explicitly typed and provenance-bound")
assert(!("economicAdmission" in evidence),"execution evidence does not manufacture economic admission")
console.log("ALL MIDNIGHT EXECUTION/EVIDENCE BOUNDARY CHECKS PASSED")
