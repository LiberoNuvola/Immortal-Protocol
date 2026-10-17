#!/usr/bin/env node

const assert=(c,m)=>{if(!c)throw new Error(`FAIL: ${m}`);console.log(`PASS: ${m}`)}

const pathRiskFields = ['replay', 'stale', 'malformed']

const reconcile=(paths,modeCommitted)=>{
  if(modeCommitted!=='B4') return 'UNVERIFIABLE'
  if(!Array.isArray(paths) || paths.length < 2) return 'NO_CANONICAL_RESULT'

  for (const path of paths) {
    if(!path || typeof path.id!=='string' || path.id.trim()==='' ||
       typeof path.result!=='string' || path.result.trim()==='') {
      return 'NO_CANONICAL_RESULT'
    }
    if(pathRiskFields.some((field)=>typeof path[field] !== 'boolean')) {
      return 'NO_CANONICAL_RESULT'
    }
    if(pathRiskFields.some((field)=>path[field] === true)) return 'REJECT'
    if(path.independenceDemonstrated !== true) return 'NO_CANONICAL_RESULT'
  }

  const identifiers = paths.map(path => path.id)
  if(new Set(identifiers).size !== identifiers.length) return 'NO_CANONICAL_RESULT'

  const conflicts=paths.some(p=>p.result!==paths[0].result)
  if(conflicts) return 'CONFLICT/NO_CANONICAL_RESULT'
  return 'CANDIDATE_CANONICAL_RESULT'
}

const base=[
  {id:'materios',result:'R1',independenceDemonstrated:true,replay:false,stale:false,malformed:false},
  {id:'independent-consensus',result:'R1',independenceDemonstrated:true,replay:false,stale:false,malformed:false},
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

assert(reconcile([],'B4')==='NO_CANONICAL_RESULT','zero proof paths cannot produce a candidate')
assert(reconcile([base[0]],'B4')==='NO_CANONICAL_RESULT','one proof path cannot stand in for multiple independent paths')
assert(
  reconcile([base[0], {...base[1], id: base[0].id}], 'B4') === 'NO_CANONICAL_RESULT',
  'duplicated path identity cannot be counted as independent corroboration',
)
assert(
  reconcile([base[0], {...base[1], independenceDemonstrated: undefined}], 'B4') === 'NO_CANONICAL_RESULT',
  'unknown independence status cannot be treated as demonstrated',
)
assert(
  reconcile([base[0], {...base[1], stale: undefined}], 'B4') === 'NO_CANONICAL_RESULT',
  'unknown freshness status cannot be treated as fresh evidence',
)
assert(
  reconcile([base[0], {...base[1], result: '   '}], 'B4') === 'NO_CANONICAL_RESULT',
  'blank proof result cannot yield a candidate canonical result',
)


console.log('ALL BEACON 4 INDEPENDENCE/CONFLICT BOUNDARY CHECKS PASSED')
