#!/usr/bin/env node

const assert=(c,m)=>{if(!c)throw new Error(`FAIL: ${m}`);console.log(`PASS: ${m}`)}

const reconcile=(paths,modeCommitted)=>{
  if(modeCommitted!=='B4') return 'UNVERIFIABLE'
  if(paths.some(p=>p.replay===true)) return 'REJECT'
  if(paths.some(p=>p.stale===true)) return 'REJECT'
  if(paths.some(p=>p.malformed===true)) return 'REJECT'
  if(paths.some(p=>p.independenceDemonstrated===false)) return 'NO_CANONICAL_RESULT'
  const conflicts=paths.some(p=>p.result!==paths[0].result)
  if(conflicts) return 'CONFLICT/NO_CANONICAL_RESULT'
  return 'CANDIDATE_CANONICAL_RESULT'
}

const base=[
  {id:'materios',result:'R1',independenceDemonstrated:true},
  {id:'independent-consensus',result:'R1',independenceDemonstrated:true},
]

assert(reconcile(base,'B4')==='CANDIDATE_CANONICAL_RESULT','independent agreeing proof paths produce only a candidate canonical result')
assert(reconcile([
  base[0],{...base[1],result:'R2'}
],'B4')==='CONFLICT/NO_CANONICAL_RESULT','contradictory proof paths produce explicit conflict')
assert(reconcile([
  base[0],{...base[1],independenceDemonstrated:false}
],'B4')==='NO_CANONICAL_RESULT','unproven independence blocks B4 acceptance')
assert(reconcile([
  {...base[0],stale:true},base[1]
],'B4')==='REJECT','stale evidence is rejected')
assert(reconcile([
  {...base[0],replay:true},base[1]
],'B4')==='REJECT','replayed/equivocating evidence is rejected')
assert(reconcile([
  {...base[0],malformed:true},base[1]
],'B4')==='REJECT','malformed proof path is rejected')
assert(reconcile(base,'B3')==='UNVERIFIABLE','B4 verifier does not silently reinterpret a different trust mode')
assert(reconcile(base,'B4')==='CANDIDATE_CANONICAL_RESULT','new-round B4 evaluation remains deterministic')

console.log('ALL BEACON 4 INDEPENDENCE/CONFLICT BOUNDARY CHECKS PASSED')
