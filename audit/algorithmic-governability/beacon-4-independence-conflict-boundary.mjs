#!/usr/bin/env node

const assert=(c,m)=>{if(!c)throw new Error(`FAIL: ${m}`);console.log(`PASS: ${m}`)}

const pathRiskFields = ['replay', 'stale', 'malformed']
const requiredPathFields = ['id', 'result', 'independenceDemonstrated', ...pathRiskFields]
const INVALID = Symbol('invalid-own-data')

const isRecord=(value)=>{
  if(value===null || typeof value!=='object' || Array.isArray(value)) return false
  const prototype=Object.getPrototypeOf(value)
  return prototype===Object.prototype || prototype===null
}

const readOwnData=(record,field)=>{
  const descriptor=Object.getOwnPropertyDescriptor(record,field)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor,'value')
    ? descriptor.value
    : INVALID
}

const reconcile=(paths,modeCommitted)=>{
  if(modeCommitted!=='B4') return 'UNVERIFIABLE'
  if(!Array.isArray(paths)) return 'NO_CANONICAL_RESULT'

  const lengthDescriptor=Object.getOwnPropertyDescriptor(paths,'length')
  if(!lengthDescriptor || !Object.prototype.hasOwnProperty.call(lengthDescriptor,'value') ||
     !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value<2) {
    return 'NO_CANONICAL_RESULT'
  }

  const canonicalPaths=[]
  for(let index=0;index<lengthDescriptor.value;index+=1) {
    const itemDescriptor=Object.getOwnPropertyDescriptor(paths,String(index))
    if(!itemDescriptor || !Object.prototype.hasOwnProperty.call(itemDescriptor,'value')) {
      return 'NO_CANONICAL_RESULT'
    }
    const path=itemDescriptor.value
    if(!isRecord(path)) return 'NO_CANONICAL_RESULT'

    const values=Object.create(null)
    for(const field of requiredPathFields) {
      const value=readOwnData(path,field)
      if(value===INVALID) return 'NO_CANONICAL_RESULT'
      values[field]=value
    }
    if(typeof values.id!=='string' || values.id.trim()==='' ||
       typeof values.result!=='string' || values.result.trim()==='') {
      return 'NO_CANONICAL_RESULT'
    }
    if(pathRiskFields.some((field)=>typeof values[field] !== 'boolean')) {
      return 'NO_CANONICAL_RESULT'
    }
    if(pathRiskFields.some((field)=>values[field] === true)) return 'REJECT'
    if(values.independenceDemonstrated !== true) return 'NO_CANONICAL_RESULT'
    canonicalPaths.push(Object.freeze(values))
  }

  const identifiers = canonicalPaths.map(path => path.id)
  if(new Set(identifiers).size !== identifiers.length) return 'NO_CANONICAL_RESULT'

  const firstResult=canonicalPaths[0].result
  const conflicts=canonicalPaths.some(path=>path.result!==firstResult)
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

let getterCalls=0
const accessorPath={...base[0]}
Object.defineProperty(accessorPath,'result',{enumerable:true,get(){getterCalls+=1;return 'R1'}})
assert(reconcile([accessorPath,base[1]],'B4')==='NO_CANONICAL_RESULT' && getterCalls===0,
  'accessor-backed proof fields fail closed without executing getters')

const sparsePaths=[base[0],base[1]]
delete sparsePaths[0]
assert(reconcile(sparsePaths,'B4')==='NO_CANONICAL_RESULT',
  'sparse proof-path arrays cannot create a canonical candidate')

const iteratorPaths=[...base]
iteratorPaths[Symbol.iterator]=()=>{throw new Error('caller iterator must not execute')}
assert(reconcile(iteratorPaths,'B4')==='CANDIDATE_CANONICAL_RESULT',
  'caller-supplied proof-path iterator is ignored')

console.log('ALL BEACON 4 INDEPENDENCE/CONFLICT BOUNDARY CHECKS PASSED')
