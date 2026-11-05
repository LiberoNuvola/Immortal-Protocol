import { describe, expect, it } from 'vitest'
import fixtureData from '../../verification/gcl-01/gcl-01-conformance-v0.1.json'

type GclRecord = { [key: string]: any }
const fixture = fixtureData as GclRecord
const families = fixture.families as GclRecord[]
const profiles = fixture.profiles as GclRecord[]
const assignments = fixture.assignments as GclRecord[]
const effectBindings = fixture.effectBindings as GclRecord[]
const decisions = fixture.decisions as GclRecord[]
const transitionPolicies = fixture.transitionPolicies as GclRecord[]
const evidence = fixture.evidence as GclRecord[]

const DERIVED_MODES = new Set(['deterministic-rule', 'evidence-assessment', 'model-assisted', 'state-derived'])
const ORDERING_KINDS = new Set(['nominal', 'ordinal', 'partial-order', 'multidimensional', 'none'])
const TRANSITION_MODES = new Set(['immutable-after-commitment', 'explicit-user-selection', 'prospective-reassessment', 'state-derived-transition', 'expiring-reissuable'])
const FORBIDDEN_ASSIGNMENT_KEYS = ['authorizedActions', 'permissions', 'admissionDecision', 'authorization', 'eligible', 'saleable']

function familyKey(ref: GclRecord): string {
  return [ref.namespace, ref.familyId, ref.version].join('::')
}
function findFamily(ref: GclRecord): GclRecord | undefined {
  return families.find((candidate) => familyKey(candidate.familyRef) === familyKey(ref))
}
function validateFamilyRegistry(records: GclRecord[]): string | null {
  const keys = new Set<string>()
  for (const record of records) {
    const ref = record.familyRef
    if (!ref?.namespace || !ref?.familyId || !ref?.version) return 'invalid-family-ref'
    const key = familyKey(ref)
    if (keys.has(key)) return 'duplicate-family-version'
    keys.add(key)
    if (!ORDERING_KINDS.has(record.ordering?.kind)) return 'invalid-ordering-kind'
    if (!Array.isArray(record.categoryRefs) || record.categoryRefs.length === 0) return 'missing-categories'
    if (new Set(record.categoryRefs).size !== record.categoryRefs.length) return 'duplicate-category'
    if (!Array.isArray(record.supportedAssignmentModes) || record.supportedAssignmentModes.length === 0) return 'missing-assignment-modes'
  }
  return null
}
function validateAssignment(record: GclRecord, knownEvidence: string[] = evidence.map((item) => item.evidenceRef)): string | null {
  if (!record.assignmentId || !record.subjectRef || !record.scopeRef) return 'missing-assignment-identity'
  if (FORBIDDEN_ASSIGNMENT_KEYS.some((key) => Object.prototype.hasOwnProperty.call(record, key))) return 'classification-escalates-authority-or-eligibility'
  const familyRecord = findFamily(record.familyRef ?? {})
  if (!familyRecord) return 'unknown-family-version'
  if (!familyRecord.supportedAssignmentModes.includes(record.mode)) return 'unsupported-assignment-mode'
  if (DERIVED_MODES.has(record.mode) && (typeof record.methodRef !== 'string' || record.methodRef.length === 0)) return 'derived-assignment-missing-method'
  if (!Array.isArray(record.values) || record.values.length === 0) return 'missing-assignment-values'
  for (const value of record.values) if (!familyRecord.categoryRefs.includes(value.categoryRef)) return 'unknown-category'
  if (!Array.isArray(record.evidenceRefs) || new Set(record.evidenceRefs).size !== record.evidenceRefs.length) return 'duplicate-evidence-reference'
  if (record.evidenceRefs.some((ref: string) => !knownEvidence.includes(ref))) return 'unknown-evidence-reference'
  return null
}
function validateEffectBinding(record: GclRecord): string | null {
  const assignment = assignments.find((item) => item.assignmentId === record.assignmentRef)
  if (!assignment) return 'unknown-assignment'
  const profile = profiles.find((item) => item.profileRef === record.effectProfileRef)
  if (!profile) return 'unknown-effect-profile-version'
  if (profile.effectDomain !== record.effectDomain) return 'effect-domain-mismatch'
  if (record.subjectRef !== assignment.subjectRef || record.scopeRef !== assignment.scopeRef) return 'effect-subject-or-scope-substitution'
  if (!record.actionRef) return 'effect-action-required'
  return null
}
function validateTransitionPolicy(record: GclRecord): string | null {
  if (!findFamily(record.familyRef ?? {})) return 'unknown-family-version'
  if (!TRANSITION_MODES.has(record.changeMode)) return 'unsupported-transition-mode'
  if (record.retroactiveMutation !== 'prohibited') return 'retroactive-mutation-not-prohibited'
  if (!record.historyMode) return 'history-mode-required'
  return null
}
function validateAdmissionDecision(record: GclRecord): string | null {
  if (!record.decisionId || !record.subjectRef || !record.scopeRef || !record.actionRef) return 'missing-decision-binding'
  for (const effectRef of record.effectBindingRefs ?? []) {
    const effect = effectBindings.find((item) => item.effectBindingId === effectRef)
    if (!effect) return 'unknown-effect-binding'
    const assignment = assignments.find((item) => item.assignmentId === effect.assignmentRef)
    const profile = profiles.find((item) => item.profileRef === effect.effectProfileRef)
    if (!assignment || !profile) return 'incomplete-decision-reference'
    if (!record.assignmentRefs.includes(assignment.assignmentId)) return 'decision-missing-assignment-reference'
    if (record.subjectRef !== assignment.subjectRef || record.scopeRef !== assignment.scopeRef) return 'decision-subject-or-scope-substitution'
    if (record.actionRef !== effect.actionRef) return 'decision-action-substitution'
    if (record.authorityRef !== profile.authorityRef) return 'decision-authority-mismatch'
  }
  return null
}
function validateLineageGraph(records: GclRecord[], expectedSubject?: string, expectedScope?: string): string | null {
  const byRef = new Map<string, GclRecord>()
  for (const record of records) {
    if (!record.evidenceRef || byRef.has(record.evidenceRef)) return 'duplicate-or-missing-evidence-reference'
    if (expectedSubject && record.subjectRef !== expectedSubject) return 'subject-substitution'
    if (expectedScope && record.scopeRef !== expectedScope) return 'scope-substitution'
    byRef.set(record.evidenceRef, record)
  }
  for (const record of records) for (const relation of record.lineageRefs ?? []) {
    if (!byRef.has(relation.relatedEvidenceRef)) return 'missing-lineage-parent'
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  function visit(ref: string): boolean {
    if (visiting.has(ref)) return false
    if (visited.has(ref)) return true
    visiting.add(ref)
    const record = byRef.get(ref)
    for (const relation of record?.lineageRefs ?? []) if (!visit(relation.relatedEvidenceRef)) return false
    visiting.delete(ref)
    visited.add(ref)
    return true
  }
  for (const ref of byRef.keys()) if (!visit(ref)) return 'lineage-cycle'
  return null
}
function ancestorRefs(ref: string, byRef: Map<string, GclRecord>, seen = new Set<string>()): Set<string> {
  const record = byRef.get(ref)
  for (const relation of record?.lineageRefs ?? []) {
    if (!seen.has(relation.relatedEvidenceRef)) {
      seen.add(relation.relatedEvidenceRef)
      ancestorRefs(relation.relatedEvidenceRef, byRef, seen)
    }
  }
  return seen
}
function classifyLineageRelation(leftRef: string, rightRef: string, records: GclRecord[]): string {
  const byRef = new Map(records.map((record) => [record.evidenceRef, record]))
  const left = byRef.get(leftRef)!
  const right = byRef.get(rightRef)!
  if (left.artifactDigest === right.artifactDigest) return 'same-artifact'
  if (left.eventRef === right.eventRef) return 'same-event'
  const leftAncestors = ancestorRefs(leftRef, byRef)
  const rightAncestors = ancestorRefs(rightRef, byRef)
  if (leftAncestors.has(rightRef) || rightAncestors.has(leftRef)) return 'derived-from'
  if ([...leftAncestors].some((ref) => rightAncestors.has(ref))) return 'shared-ancestor'
  if (left.producerRef === right.producerRef) return 'same-source'
  if ((left.correlationGroupRefs ?? []).some((group: string) => (right.correlationGroupRefs ?? []).includes(group))) return 'correlated-with'
  return 'unknown'
}
function validateIndependentContributions(refs: string[], records: GclRecord[]): string | null {
  const selected = refs.map((ref) => records.find((record) => record.evidenceRef === ref))
  if (selected.some((record) => !record)) return 'unknown-evidence-reference'
  const digests = selected.map((record) => record!.artifactDigest)
  const events = selected.map((record) => record!.eventRef)
  if (new Set(digests).size !== digests.length) return 'duplicate-artifact-contribution'
  if (new Set(events).size !== events.length) return 'duplicate-event-contribution'
  return null
}

describe('GCL-01 design-only conformance fixtures v0.1', () => {
  it('declares the fixture version and non-normative status', () => {
    expect(fixture.fixtureVersion).toBe('GCL-01-CONFORMANCE-V0.1')
    expect(fixture.status).toBe('DESIGN_ONLY_NOT_NORMATIVE')
  })
  it('accepts the cross-domain family definitions without merging their taxonomies', () => {
    expect(validateFamilyRegistry(families)).toBeNull()
    expect(families.map((item) => item.familyRef.familyId)).toEqual([
      'ticket-price-access','ticket-price-access','row-outcome-payout','merit-assessment','action-risk-band','difficulty-level','evidence-quality',
    ])
    expect(families.find((item) => item.familyRef.familyId === 'difficulty-level')?.supportedAssignmentModes).toEqual(['explicit-selection'])
  })
  it('accepts all six positive assignments and preserves exact family-version pinning', () => {
    expect(assignments).toHaveLength(6)
    for (const assignment of assignments) expect(validateAssignment(assignment)).toBeNull()
    const pinned = assignments.find((item) => item.assignmentId === 'A-PRE-PRICE-001')!
    expect(pinned.familyRef.version).toBe('1')
    expect(findFamily(pinned.familyRef)?.categoryRefs).not.toContain('future-profile-category')
    expect(families.find((item) => item.familyRef.familyId === 'ticket-price-access' && item.familyRef.version === '2')).toBeDefined()
  })
  it('keeps explicit game difficulty selection free of a synthetic classifier', () => {
    const selection = assignments.find((item) => item.assignmentId === 'A-GAME-001')!
    expect(selection.mode).toBe('explicit-selection')
    expect(selection.methodRef).toBeNull()
    expect(validateAssignment(selection)).toBeNull()
  })
  it('validates all effect bindings against their owning effect-profile versions', () => {
    expect(effectBindings).toHaveLength(6)
    for (const binding of effectBindings) expect(validateEffectBinding(binding)).toBeNull()
  })
  it('keeps admission decisions distinct and routes them to the profile authority', () => {
    expect(decisions).toHaveLength(6)
    for (const decision of decisions) expect(validateAdmissionDecision(decision)).toBeNull()
    expect(decisions.map((decision) => decision.authorityRef)).toEqual(profiles.map((profile) => profile.authorityRef))
  })
  it('validates transition policies and prohibits retroactive mutation', () => {
    expect(transitionPolicies).toHaveLength(6)
    for (const policy of transitionPolicies) expect(validateTransitionPolicy(policy)).toBeNull()
  })
  it('preserves same-source distinct events without calling them independent sources', () => {
    const scenario = fixture.lineageScenarios.find((item: GclRecord) => item.id === 'same-source-distinct-events')!
    expect(validateLineageGraph(scenario.records, 'subject-x', 'scope-x')).toBeNull()
    expect(classifyLineageRelation(scenario.records[0].evidenceRef, scenario.records[1].evidenceRef, scenario.records)).toBe('same-source')
  })
  it('preserves model outputs and records their shared source ancestor', () => {
    const scenario = fixture.lineageScenarios.find((item: GclRecord) => item.id === 'model-outputs-share-source-observation')!
    expect(validateLineageGraph(scenario.records, 'subject-x', 'scope-x')).toBeNull()
    expect(classifyLineageRelation('model-output-a','model-output-b',scenario.records)).toBe('shared-ancestor')
  })
  it('preserves correlated evidence and records the declared correlation group', () => {
    const scenario = fixture.lineageScenarios.find((item: GclRecord) => item.id === 'declared-correlation-group')!
    expect(validateLineageGraph(scenario.records, 'subject-x', 'scope-x')).toBeNull()
    expect(classifyLineageRelation(scenario.records[0].evidenceRef,scenario.records[1].evidenceRef,scenario.records)).toBe('correlated-with')
  })
  it('keeps unknown independence unknown instead of inferring it from producer IDs', () => {
    const scenario = fixture.lineageScenarios.find((item: GclRecord) => item.id === 'unknown-independence')!
    expect(validateLineageGraph(scenario.records, 'subject-x', 'scope-x')).toBeNull()
    expect(classifyLineageRelation(scenario.records[0].evidenceRef,scenario.records[1].evidenceRef,scenario.records)).toBe('unknown')
  })
  it('rejects unsupported modes, missing derivation method and unknown family/category refs', () => {
    const base = assignments[0]
    expect(validateAssignment({ ...base, mode:'automatic-classification' })).toBe('unsupported-assignment-mode')
    const derived = assignments.find((item) => item.mode === 'deterministic-rule')!
    expect(validateAssignment({ ...derived, methodRef:null })).toBe('derived-assignment-missing-method')
    expect(validateAssignment({ ...base, familyRef:{...base.familyRef,version:'999'} })).toBe('unknown-family-version')
    expect(validateAssignment({ ...base, values:[{axisRef:'price',categoryRef:'not-declared'}] })).toBe('unknown-category')
  })
  it('rejects classification-to-authority and classification-to-eligibility escalation', () => {
    const base = assignments[0]
    expect(validateAssignment({ ...base, authorizedActions:['PRE-RICH.SALE'] })).toBe('classification-escalates-authority-or-eligibility')
    expect(validateAssignment({ ...base, saleable:true })).toBe('classification-escalates-authority-or-eligibility')
  })
  it('rejects duplicate evidence references in an assignment', () => {
    const base = assignments.find((item) => item.evidenceRefs.length > 0)!
    expect(validateAssignment({ ...base, evidenceRefs:[base.evidenceRefs[0],base.evidenceRefs[0]] })).toBe('duplicate-evidence-reference')
  })
  it('rejects conflicting definitions under one exact family/version identity', () => {
    const original = families[0]
    const conflict = { ...original, categoryRefs:[...original.categoryRefs,'different-semantics'] }
    expect(validateFamilyRegistry([original,conflict])).toBe('duplicate-family-version')
  })
  it('rejects a transition policy that permits retroactive mutation', () => {
    expect(validateTransitionPolicy({ ...transitionPolicies[0], retroactiveMutation:'allowed' })).toBe('retroactive-mutation-not-prohibited')
  })
  it('rejects effect-domain mismatch and subject substitution', () => {
    expect(validateEffectBinding({ ...effectBindings[0], effectDomain:'operational' })).toBe('effect-domain-mismatch')
    expect(validateEffectBinding({ ...effectBindings[0], subjectRef:'another-subject' })).toBe('effect-subject-or-scope-substitution')
  })
  it('rejects admission action substitution and authority impersonation', () => {
    expect(validateAdmissionDecision({ ...decisions[0], actionRef:'OTHER.ACTION' })).toBe('decision-action-substitution')
    expect(validateAdmissionDecision({ ...decisions[0], authorityRef:'INSURER.UnderwritingAuthority' })).toBe('decision-authority-mismatch')
  })
  it('rejects duplicate artifact/event contribution without rejecting correlated evidence', () => {
    const scenario = fixture.lineageScenarios.find((item: GclRecord) => item.id === 'unknown-independence')!
    const sameDigest = [scenario.records[0],{ ...scenario.records[1],artifactDigest:scenario.records[0].artifactDigest }]
    expect(validateIndependentContributions(sameDigest.map((item: GclRecord) => item.evidenceRef),sameDigest)).toBe('duplicate-artifact-contribution')
    const sameEvent = [scenario.records[0],{ ...scenario.records[1],eventRef:scenario.records[0].eventRef }]
    expect(validateIndependentContributions(sameEvent.map((item: GclRecord) => item.evidenceRef),sameEvent)).toBe('duplicate-event-contribution')
  })
  it('rejects missing parents, cycles and subject/scope substitution in lineage', () => {
    const root = { ...evidence[0] }
    const missing = { ...root,evidenceRef:'missing-parent-child',lineageRefs:[{relatedEvidenceRef:'not-present',relation:'derived-from'}] }
    expect(validateLineageGraph([root,missing])).toBe('missing-lineage-parent')
    const a = { ...root,evidenceRef:'cycle-a',lineageRefs:[{relatedEvidenceRef:'cycle-b',relation:'derived-from'}] }
    const b = { ...root,evidenceRef:'cycle-b',lineageRefs:[{relatedEvidenceRef:'cycle-a',relation:'derived-from'}] }
    expect(validateLineageGraph([a,b])).toBe('lineage-cycle')
    expect(validateLineageGraph([root,{ ...root,evidenceRef:'scope-other',scopeRef:'other-scope' }],root.subjectRef,root.scopeRef)).toBe('scope-substitution')
  })
  it('keeps the negative expectation catalogue versioned with the fixture corpus', () => {
    expect(fixture.negativeExpectationIds).toHaveLength(19)
    expect(new Set(fixture.negativeExpectationIds).size).toBe(fixture.negativeExpectationIds.length)
  })
})
