#!/usr/bin/env node

/**
 * Non-normative structural C17 partition checker prototype.
 *
 * It checks exact assignment of a caller-supplied item universe to declared
 * disjoint buckets. It does NOT authenticate source completeness, valuation,
 * obligation semantics, or authority. A successful result is therefore only
 * STRUCTURALLY_VALID_ONLY, never a C17 certification.
 */

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const nonBlank = (value) => typeof value === 'string' && value.trim().length > 0
const sha256Hex = (value) => typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value)

export function inspectC17Partition({ universe, partition, qualificationBinding } = {}) {
  if (!isRecord(universe) || !Array.isArray(universe.items) ||
      !isRecord(partition) || !Array.isArray(partition.buckets) ||
      !Array.isArray(partition.assignments)) {
    return { status: 'UNVERIFIABLE', reason: 'MISSING_OR_MALFORMED_STRUCTURAL_INPUT' }
  }

  if (!isRecord(qualificationBinding) ||
      !nonBlank(qualificationBinding.sourceReference) ||
      !nonBlank(qualificationBinding.snapshotReference) ||
      !sha256Hex(qualificationBinding.manifestDigest) ||
      !nonBlank(qualificationBinding.evidenceReference) ||
      !nonBlank(qualificationBinding.verificationReference)) {
    return { status: 'UNVERIFIABLE', reason: 'SOURCE_QUALIFICATION_BINDING_MISSING_OR_MALFORMED' }
  }

  if (!nonBlank(universe.sourceReference) ||
      !nonBlank(universe.snapshotReference) ||
      !sha256Hex(universe.manifestDigest) ||
      !Number.isSafeInteger(universe.declaredItemCount) || universe.declaredItemCount < 0) {
    return { status: 'UNVERIFIABLE', reason: 'SOURCE_UNIVERSE_IDENTITY_MISSING_OR_MALFORMED' }
  }

  if (qualificationBinding.sourceReference !== universe.sourceReference ||
      qualificationBinding.snapshotReference !== universe.snapshotReference ||
      qualificationBinding.manifestDigest.toLowerCase() !== universe.manifestDigest.toLowerCase()) {
    return { status: 'REJECTED', reason: 'SOURCE_QUALIFICATION_BINDING_MISMATCH' }
  }

  if (universe.declaredItemCount !== universe.items.length) {
    return { status: 'REJECTED', reason: 'DECLARED_ITEM_COUNT_MISMATCH' }
  }

  if (!nonBlank(partition.version)) {
    return { status: 'UNVERIFIABLE', reason: 'PARTITION_VERSION_MISSING' }
  }

  const itemIds = new Set()
  for (const item of universe.items) {
    if (!isRecord(item) || !nonBlank(item.contentId)) {
      return { status: 'UNVERIFIABLE', reason: 'SOURCE_ITEM_ID_MISSING' }
    }
    if (itemIds.has(item.contentId)) {
      return { status: 'REJECTED', reason: 'DUPLICATE_SOURCE_CONTENT_ID' }
    }
    itemIds.add(item.contentId)
  }

  const bucketIds = new Set()
  for (const bucket of partition.buckets) {
    if (!isRecord(bucket) || !nonBlank(bucket.bucketId) || !nonBlank(bucket.definitionReference)) {
      return { status: 'UNVERIFIABLE', reason: 'BUCKET_DEFINITION_MISSING' }
    }
    if (bucketIds.has(bucket.bucketId)) {
      return { status: 'REJECTED', reason: 'DUPLICATE_BUCKET_ID' }
    }
    bucketIds.add(bucket.bucketId)
  }

  const assigned = new Set()
  for (const assignment of partition.assignments) {
    if (!isRecord(assignment) || !nonBlank(assignment.contentId) || !nonBlank(assignment.bucketId)) {
      return { status: 'UNVERIFIABLE', reason: 'PARTITION_ASSIGNMENT_MALFORMED' }
    }
    if (!itemIds.has(assignment.contentId)) {
      return { status: 'REJECTED', reason: 'ASSIGNMENT_REFERENCES_UNKNOWN_CONTENT' }
    }
    if (!bucketIds.has(assignment.bucketId)) {
      return { status: 'REJECTED', reason: 'ASSIGNMENT_REFERENCES_UNKNOWN_BUCKET' }
    }
    if (assigned.has(assignment.contentId)) {
      return { status: 'REJECTED', reason: 'CONTENT_ASSIGNED_MORE_THAN_ONCE' }
    }
    assigned.add(assignment.contentId)
  }

  for (const contentId of itemIds) {
    if (!assigned.has(contentId)) {
      return { status: 'REJECTED', reason: 'SOURCE_CONTENT_NOT_PARTITIONED' }
    }
  }

  return {
    status: 'STRUCTURALLY_VALID_ONLY',
    sourceItemCount: itemIds.size,
    bucketCount: bucketIds.size,
    assignmentCount: assigned.size,
    sourceQualificationBindingPresent: true,
    sourceCompletenessAuthenticatedByThisChecker: false,
    c17Certified: false,
  }
}

const manifestDigest = 'a'.repeat(64)
const universe = {
  sourceReference: 'source:qualified-snapshot-01',
  snapshotReference: 'state:snapshot-01',
  manifestDigest,
  declaredItemCount: 3,
  items: [
    { contentId: 'obligation:01' },
    { contentId: 'obligation:02' },
    { contentId: 'exposure:03' },
  ],
}
const partition = {
  version: 'partition-definition-v1',
  buckets: [
    { bucketId: 'crystallized', definitionReference: 'profile:bucket-crystallized-v1' },
    { bucketId: 'unresolved', definitionReference: 'profile:bucket-unresolved-v1' },
    { bucketId: 'explicit-empty-example', definitionReference: 'profile:bucket-empty-example-v1' },
  ],
  assignments: [
    { contentId: 'obligation:01', bucketId: 'crystallized' },
    { contentId: 'obligation:02', bucketId: 'crystallized' },
    { contentId: 'exposure:03', bucketId: 'unresolved' },
  ],
}
const binding = {
  sourceReference: universe.sourceReference,
  snapshotReference: universe.snapshotReference,
  manifestDigest,
  evidenceReference: 'evidence:c17-source-qualification-01',
  verificationReference: 'verification:external-source-appraisal-01',
}

const valid = inspectC17Partition({ universe, partition, qualificationBinding: binding })
assert(valid.status === 'STRUCTURALLY_VALID_ONLY', 'complete supplied universe has an exact single-bucket assignment')
assert(valid.c17Certified === false, 'structural checker never declares C17 certified')
assert(valid.sourceCompletenessAuthenticatedByThisChecker === false, 'checker does not authenticate its supplied universe')
assert(valid.bucketCount === 3, 'declared empty bucket remains explicit rather than disappearing')

assert(
  inspectC17Partition({ universe, partition }).status === 'UNVERIFIABLE',
  'missing source-qualification binding remains unverifiable',
)
assert(
  inspectC17Partition({ universe, partition, qualificationBinding: { ...binding, manifestDigest: 'bad' } }).status === 'UNVERIFIABLE',
  'malformed source manifest digest remains unverifiable',
)
assert(
  inspectC17Partition({ universe, partition, qualificationBinding: { ...binding, snapshotReference: 'state:other' } }).reason === 'SOURCE_QUALIFICATION_BINDING_MISMATCH',
  'qualification binding to a different snapshot is rejected',
)
assert(
  inspectC17Partition({ universe: { ...universe, declaredItemCount: 4 }, partition, qualificationBinding: binding }).reason === 'DECLARED_ITEM_COUNT_MISMATCH',
  'source count mismatch is rejected',
)
assert(
  inspectC17Partition({ universe: { ...universe, items: [...universe.items, universe.items[0]], declaredItemCount: 4 }, partition, qualificationBinding: binding }).reason === 'DUPLICATE_SOURCE_CONTENT_ID',
  'duplicate source identity is rejected',
)
assert(
  inspectC17Partition({ universe, partition: { ...partition, assignments: partition.assignments.slice(1) }, qualificationBinding: binding }).reason === 'SOURCE_CONTENT_NOT_PARTITIONED',
  'unpartitioned protected content is rejected',
)
assert(
  inspectC17Partition({ universe, partition: { ...partition, assignments: [...partition.assignments, partition.assignments[0]] }, qualificationBinding: binding }).reason === 'CONTENT_ASSIGNED_MORE_THAN_ONCE',
  'overlapping partition assignment is rejected',
)
assert(
  inspectC17Partition({ universe, partition: { ...partition, assignments: [...partition.assignments, { contentId: 'obligation:ghost', bucketId: 'crystallized' }] }, qualificationBinding: binding }).reason === 'ASSIGNMENT_REFERENCES_UNKNOWN_CONTENT',
  'assignment to content outside the source universe is rejected',
)
assert(
  inspectC17Partition({ universe, partition: { ...partition, assignments: [{ ...partition.assignments[0], bucketId: 'unknown' }, ...partition.assignments.slice(1)] }, qualificationBinding: binding }).reason === 'ASSIGNMENT_REFERENCES_UNKNOWN_BUCKET',
  'assignment to an undeclared bucket is rejected',
)
assert(
  inspectC17Partition({ universe, partition: { ...partition, buckets: [...partition.buckets, partition.buckets[0]] }, qualificationBinding: binding }).reason === 'DUPLICATE_BUCKET_ID',
  'duplicate bucket definition is rejected',
)

console.log('ALL EXP-01 C17 STRUCTURAL PARTITION BOUNDARY CHECKS PASSED')
