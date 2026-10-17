#!/usr/bin/env node
const assert=(c,m)=>{if(!c)throw new Error("FAIL: "+m);console.log("PASS: "+m)}
const intent=Object.freeze({action:"Issue",classId:3n,price:5n})
const admission=Object.freeze({admitted:true,actionClass:"Issue",decisionReference:"admission:001",stateHash:"aa".repeat(32),actionFingerprint:"bb".repeat(32),expectedPostStateHash:"cc".repeat(32)})
const isRecord=(value)=>{if(!value||typeof value!=="object"||Array.isArray(value))return false;const proto=Object.getPrototypeOf(value);return proto===Object.prototype||proto===null}
const isDigest=(value)=>typeof value==="string"&&/^[0-9a-fA-F]{64}$/.test(value)
const prepare=(i,a)=>{if(!isRecord(i)||!isRecord(a))return"UNVERIFIABLE";if(a.admitted!==true)return"UNVERIFIABLE";if(a.actionClass!==i.action)return"REJECTED";if(typeof a.decisionReference!=="string"||!a.decisionReference.trim())return"UNVERIFIABLE";if(!isDigest(a.stateHash)||!isDigest(a.actionFingerprint)||!isDigest(a.expectedPostStateHash))return"UNVERIFIABLE";return Object.freeze({adapter:"MIDNIGHT",actionClass:"Issue",intent:i,admissionDecisionReference:a.decisionReference,admissionStateHash:a.stateHash,actionFingerprint:a.actionFingerprint,expectedPostStateHash:a.expectedPostStateHash,circuitName:"issue"})}
const env=prepare(intent,admission)
assert(env.adapter==="MIDNIGHT","admitted Intent produces a bounded Midnight execution envelope")
for(const malformed of [null,undefined,"intent",7,[]]) assert(prepare(malformed,admission)==="UNVERIFIABLE",`malformed intent container (${String(malformed)}) fails closed`)
for(const malformed of [null,undefined,"admission",7,[]]) assert(prepare(intent,malformed)==="UNVERIFIABLE",`malformed admission container (${String(malformed)}) fails closed`)
assert(prepare(intent,Object.freeze({...admission,stateHash:"not-a-digest"}))==="UNVERIFIABLE","malformed admission state digest cannot produce an execution envelope")
assert(prepare(intent,Object.freeze({...admission,actionFingerprint:" "}))==="UNVERIFIABLE","malformed action fingerprint cannot produce an execution envelope")
assert(prepare(intent,Object.freeze({...admission,decisionReference:"  "}))==="UNVERIFIABLE","blank admission reference cannot produce an execution envelope")

const receipt=Object.freeze({adapter:"MIDNIGHT",actionClass:"Issue",transactionReference:"tx:001",circuitName:"issue",admissionDecisionReference:"admission:001",admissionStateHash:"aa".repeat(32),actionFingerprint:"bb".repeat(32),finalityReference:"finality:001",observedPostStateHash:"cc".repeat(32),executionEvidenceReference:"exec-proof:001",status:"FINALIZED"})
const bind=(e,r)=>{if(!isRecord(e)||!isRecord(r))return"UNVERIFIABLE";if(r.adapter!==e.adapter||r.actionClass!==e.actionClass)return"REJECTED";if(r.circuitName!==e.circuitName||r.admissionDecisionReference!==e.admissionDecisionReference||r.admissionStateHash!==e.admissionStateHash||r.actionFingerprint!==e.actionFingerprint)return"REJECTED";if(r.observedPostStateHash!==e.expectedPostStateHash)return"REJECTED";if(r.status!=="FINALIZED")return"UNVERIFIABLE";if(!r.transactionReference||!r.finalityReference||!r.executionEvidenceReference)return"UNVERIFIABLE";if(!/^[0-9a-fA-F]{64}$/.test(r.admissionStateHash)||!/^[0-9a-fA-F]{64}$/.test(r.actionFingerprint)||!/^[0-9a-fA-F]{64}$/.test(r.observedPostStateHash))return"UNVERIFIABLE";return Object.freeze(r)}
const bound=bind(env,receipt)
for(const malformed of [null,undefined,"receipt",7,[]]) assert(bind(env,malformed)==="UNVERIFIABLE",`malformed receipt container (${String(malformed)}) fails closed`)
for(const malformed of [null,undefined,"envelope",7,[]]) assert(bind(malformed,receipt)==="UNVERIFIABLE",`malformed envelope container (${String(malformed)}) fails closed`)
const forgedArrayReceipt=[]
Object.assign(forgedArrayReceipt,receipt)
assert(bind(env,forgedArrayReceipt)==="UNVERIFIABLE","array with forged receipt fields cannot close execution evidence")

assert(bound!=="REJECTED"&&bound!=="UNVERIFIABLE","finalized receipt is bound to the admitted envelope")
assert(bound.observedPostStateHash===admission.expectedPostStateHash,"execution receipt carries the post-state identity supplied by the certified admission context")
assert(bound.executionEvidenceReference==="exec-proof:001","execution evidence reference remains explicit and distinct from admission")
const obs=Object.freeze({adapter:"MIDNIGHT",observationReference:"obs:001",contractReference:"contract:001",ledgerStateReference:"ledger:001",sourceReference:"public-data:001"})
const evidence=Object.freeze({adapter:"MIDNIGHT",actionClass:"Issue",admissionDecisionReference:env.admissionDecisionReference,admissionStateHash:env.admissionStateHash,actionFingerprint:env.actionFingerprint,circuitName:env.circuitName,transactionReference:receipt.transactionReference,finalityReference:receipt.finalityReference,observationReference:obs.observationReference,ledgerStateReference:obs.ledgerStateReference,sourceReference:obs.sourceReference})
assert(evidence.admissionStateHash===admission.stateHash,"economic admission identity remains bound")
assert(evidence.transactionReference===receipt.transactionReference,"execution identity remains bound")
assert(evidence.observationReference===obs.observationReference,"observation identity remains distinct")
assert(bind(env,Object.freeze({...receipt,actionFingerprint:"cc".repeat(32)}))==="REJECTED","receipt fingerprint mutation is rejected")
assert(bind(env,Object.freeze({...receipt,status:"SUBMITTED"}))==="UNVERIFIABLE","non-finalized receipt cannot close execution evidence")
assert(bind(env,Object.freeze({...receipt,observedPostStateHash:"dd".repeat(32)}))==="REJECTED","post-state mutation is rejected")
assert(bind(env,Object.freeze({...receipt,executionEvidenceReference:""}))==="UNVERIFIABLE","missing execution evidence cannot close the boundary")
assert(obs.adapter==="MIDNIGHT"&&obs.sourceReference,"public observation is explicitly typed and provenance-bound")
assert(!("economicAdmission" in evidence),"execution evidence does not manufacture economic admission")
console.log("ALL MIDNIGHT EXECUTION/EVIDENCE BOUNDARY CHECKS PASSED")
