/**
 * Cryptographic verification for an externally governed multi-oracle registry
 * snapshot. This module verifies an Ed25519 signature against a caller-supplied
 * trusted public key and checks the SHA-256 digest of canonical payload bytes.
 *
 * It does NOT decide who is entitled to publish the key, whether a snapshot is
 * the newest/revocation-effective snapshot, or whether a source should be
 * activated. Those remain separate authority/governance responsibilities.
 * No source identities or policy values are configured in this module.
 */
const crypto = require('node:crypto')

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(field + ' is required')
  }
  return value.trim()
}

function requiredObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(field + ' is required')
  }
  return value
}

function canonicalize(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new Error('registry payload numbers must be safe integers; encode exact values as strings')
    }
    return JSON.stringify(value)
  }
  if (typeof value !== 'object') {
    throw new Error('registry payload contains a non-JSON value')
  }
  if (seen.has(value)) throw new Error('registry payload contains a cycle')
  seen.add(value)
  let result
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      if (!(i in value)) throw new Error('registry payload contains a sparse array')
    }
    result = '[' + value.map(item => canonicalize(item, seen)).join(',') + ']'
  } else {
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error('registry payload objects must be plain JSON objects')
    }
    const keys = Object.keys(value).sort()
    result = '{' + keys.map(key => {
      if (value[key] === undefined) throw new Error('registry payload contains undefined')
      return JSON.stringify(key) + ':' + canonicalize(value[key], seen)
    }).join(',') + '}'
  }
  seen.delete(value)
  return result
}

function canonicalRegistryPayload(payload) {
  return canonicalize(payload)
}

function digestRegistryPayload(payload) {
  return crypto.createHash('sha256')
    .update(canonicalRegistryPayload(payload), 'utf8')
    .digest('hex')
}

function requiredDigest(value, field) {
  const digest = requiredString(value, field).toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(digest)) {
    throw new Error(field + ' must be a SHA-256 hex digest')
  }
  return digest
}

function canonicalSequence(value, field) {
  const text = requiredString(value, field)
  if (!/^(0|[1-9][0-9]*)$/.test(text)) {
    throw new Error(field + ' must be a canonical non-negative decimal sequence')
  }
  return BigInt(text).toString()
}

function revocationKey(value, index) {
  requiredObject(value, 'registry currentness revokedEntries[' + index + ']')
  return [
    requiredString(value.sourceId, 'revokedEntries[' + index + '].sourceId'),
    requiredString(value.feedId, 'revokedEntries[' + index + '].feedId'),
    requiredString(value.policyVersion, 'revokedEntries[' + index + '].policyVersion'),
  ].join('\\u0000')
}

function normalizeRegistryEntry(entry, index, snapshotPolicyVersion) {
  requiredObject(entry, 'registry.entries[' + index + ']')
  const requiredFields = [
    'sourceId',
    'feedId',
    'baseAsset',
    'quoteAsset',
    'timestampUnit',
    'activationState',
    'policyVersion',
  ]
  const result = { ...entry }
  for (const field of requiredFields) {
    result[field] = requiredString(entry[field], 'registry.entries[' + index + '].' + field)
  }
  if (result.policyVersion !== snapshotPolicyVersion) {
    throw new Error('registry entry policyVersion does not match snapshot policyVersion')
  }
  return Object.freeze(result)
}

function verifySignedMultiOracleRegistrySnapshot(envelope, trustedPublicKeyPem) {
  requiredObject(envelope, 'registry snapshot envelope')
  const payload = requiredObject(envelope.payload, 'registry snapshot payload')
  const publicKeyPem = requiredString(trustedPublicKeyPem, 'trusted registry public key')
  if (payload.schema !== 'IMMORTAL-MULTI-ORACLE-REGISTRY-V1') {
    throw new Error('registry snapshot schema is invalid')
  }
  const registryVersion = requiredString(payload.registryVersion, 'registryVersion')
  const registrySequence = canonicalSequence(payload.registrySequence, 'registrySequence')
  const policyVersion = requiredString(payload.policyVersion, 'policyVersion')
  if (!Array.isArray(payload.entries)) throw new Error('registry entries must be an array')

  const registryDigest = digestRegistryPayload(payload)
  if (requiredDigest(envelope.payloadDigest, 'registry payloadDigest') !== registryDigest) {
    throw new Error('registry snapshot payload digest mismatch')
  }

  let publicKey
  try {
    publicKey = crypto.createPublicKey(publicKeyPem)
  } catch (error) {
    throw new Error('trusted registry public key could not be parsed: ' + error.message)
  }
  if (publicKey.asymmetricKeyType !== 'ed25519') {
    throw new Error('trusted registry public key must use Ed25519 for this envelope version')
  }

  const signatureText = requiredString(envelope.signature, 'registry snapshot signature')
  let signatureBytes
  try {
    signatureBytes = Buffer.from(signatureText, 'base64')
  } catch {
    throw new Error('registry snapshot signature must be base64')
  }
  if (signatureBytes.length !== 64 || signatureBytes.toString('base64') !== signatureText) {
    throw new Error('registry snapshot signature must be canonical base64 Ed25519 bytes')
  }

  let signatureValid = false
  try {
    signatureValid = crypto.verify(
      null,
      Buffer.from(canonicalRegistryPayload(payload), 'utf8'),
      publicKey,
      signatureBytes,
    )
  } catch (error) {
    throw new Error('registry snapshot signature verification failed: ' + error.message)
  }
  if (!signatureValid) throw new Error('registry snapshot signature is invalid')

  const entries = payload.entries.map((entry, index) =>
    normalizeRegistryEntry(entry, index, policyVersion),
  )
  const seen = new Set()
  for (const entry of entries) {
    const key = [entry.sourceId, entry.feedId, entry.policyVersion].join('\u0000')
    if (seen.has(key)) throw new Error('registry snapshot contains duplicate source/feed/policy entry')
    seen.add(key)
  }

  const normalizedPayload = Object.freeze({
    ...payload,
    registryVersion,
    registrySequence,
    policyVersion,
    entries: Object.freeze(entries),
  })
  // Re-hash the normalized payload to ensure normalization did not alter signed content.
  if (digestRegistryPayload(normalizedPayload) !== registryDigest) {
    throw new Error('registry snapshot canonical digest changed during normalization')
  }
  return Object.freeze({
    payload: normalizedPayload,
    registryDigest,
    signatureScheme: 'Ed25519',
    verificationStatus: 'VERIFIED',
  })
}

function createSignedMultiOracleRegistryProvider({
  envelope,
  trustedPublicKeyPem,
  registryReference,
  trustRootReference,
  currentnessProvider,
}) {
  const reference = requiredString(registryReference, 'registryReference')
  const rootReference = requiredString(trustRootReference, 'trustRootReference')
  if (!currentnessProvider || typeof currentnessProvider.resolveCurrentRegistryState !== 'function') {
    throw new Error('trusted currentnessProvider.resolveCurrentRegistryState is required')
  }
  const verified = verifySignedMultiOracleRegistrySnapshot(envelope, trustedPublicKeyPem)
  // Process-local high-water mark: defense-in-depth only. Durable rollback
  // protection must be supplied by the external authoritative currentness provider.
  const lastSeenCurrentness = new Map()
  const seenRevocationsByPolicy = new Map()
  const revokedRegistryDigests = new Set()

  async function resolveCurrentState(requestedPolicy) {
    // The provider must read and authenticate the current, rollback-resistant
    // authoritative state on every call. This adapter intentionally does not
    // treat a signed but replayed checkpoint as proof of currentness.
    const state = await currentnessProvider.resolveCurrentRegistryState({
      policyVersion: requestedPolicy,
    })
    requiredObject(state, 'current registry state')
    if (state.verificationStatus !== 'VERIFIED') {
      throw new Error('authoritative current registry state must be independently verified')
    }
    const authorityReference = requiredString(state.authorityReference, 'currentness.authorityReference')
    const checkpointReference = requiredString(state.checkpointReference, 'currentness.checkpointReference')
    const currentPolicyVersion = requiredString(state.policyVersion, 'currentness.policyVersion')
    if (currentPolicyVersion !== requestedPolicy) {
      throw new Error('current registry state policy version mismatch')
    }
    const registryStatus = requiredString(state.registryStatus, 'currentness.registryStatus')
    const controlSequence = canonicalSequence(state.controlSequence, 'currentness.controlSequence')
    const currentRegistrySequence = canonicalSequence(state.registrySequence, 'currentness.registrySequence')
    const currentRegistryVersion = requiredString(state.registryVersion, 'currentness.registryVersion')
    const currentRegistryDigest = requiredDigest(state.registryDigest, 'currentness.registryDigest')

    if (!Array.isArray(state.revokedEntries)) {
      throw new Error('currentness.revokedEntries must be an array')
    }
    const normalizedRevokedEntries = state.revokedEntries.map((value, index) => {
      requiredObject(value, 'currentness.revokedEntries[' + index + ']')
      return {
        sourceId: requiredString(value.sourceId, 'revokedEntries[' + index + '].sourceId'),
        feedId: requiredString(value.feedId, 'revokedEntries[' + index + '].feedId'),
        policyVersion: requiredString(value.policyVersion, 'revokedEntries[' + index + '].policyVersion'),
      }
    }).sort((left, right) =>
      [left.sourceId, left.feedId, left.policyVersion].join('\\u0000').localeCompare(
        [right.sourceId, right.feedId, right.policyVersion].join('\\u0000'),
      ),
    )
    const currentnessDigest = digestRegistryPayload({
      authorityReference,
      checkpointReference,
      policyVersion: currentPolicyVersion,
      controlSequence,
      registrySequence: currentRegistrySequence,
      registryVersion: currentRegistryVersion,
      registryDigest: currentRegistryDigest,
      registryStatus,
      revokedEntries: normalizedRevokedEntries,
    })
    const revokedKeys = new Set(normalizedRevokedEntries.map(value =>
      [value.sourceId, value.feedId, value.policyVersion].join('\\u0000'),
    ))
    const previouslyRevokedKeys = seenRevocationsByPolicy.get(requestedPolicy) || new Set()
    for (const revokedKey of previouslyRevokedKeys) {
      if (!revokedKeys.has(revokedKey)) {
        throw new Error('revocation tombstone disappeared within the same policy version')
      }
    }
    const previous = lastSeenCurrentness.get(requestedPolicy)
    if (previous && BigInt(controlSequence) < BigInt(previous.controlSequence)) {
      throw new Error('authoritative currentness control sequence rolled back within this process')
    }
    if (previous && BigInt(currentRegistrySequence) < BigInt(previous.registrySequence)) {
      throw new Error('authoritative registry sequence rolled back within this process')
    }
    if (previous && currentRegistrySequence === previous.registrySequence &&
        (currentRegistryVersion !== previous.registryVersion ||
         currentRegistryDigest !== previous.registryDigest)) {
      throw new Error('authoritative registry sequence equivocated across registry version/digest')
    }
    if (previous && controlSequence === previous.controlSequence &&
        currentnessDigest !== previous.currentnessDigest) {
      throw new Error('authoritative currentness state equivocated at the same control sequence')
    }
    if (!previous || BigInt(controlSequence) > BigInt(previous.controlSequence)) {
      lastSeenCurrentness.set(requestedPolicy, {
        controlSequence,
        currentnessDigest,
        registrySequence: currentRegistrySequence,
        registryVersion: currentRegistryVersion,
        registryDigest: currentRegistryDigest,
      })
    }
    seenRevocationsByPolicy.set(requestedPolicy, new Set([
      ...previouslyRevokedKeys,
      ...revokedKeys,
    ]))

    // Remember explicitly revoked snapshots before returning an error, so a
    // later higher-sequence response cannot reactivate the same signed digest.
    if (registryStatus === 'REVOKED') revokedRegistryDigests.add(currentRegistryDigest)
    if (revokedRegistryDigests.has(verified.registryDigest)) {
      throw new Error('signed registry snapshot digest has been revoked')
    }
    if (registryStatus !== 'CURRENT') {
      throw new Error('registry snapshot is revoked or not the authoritative current snapshot')
    }
    if (BigInt(currentRegistrySequence) > BigInt(verified.payload.registrySequence)) {
      throw new Error('registry snapshot is stale or rolled back relative to the authoritative current checkpoint')
    }
    if (BigInt(currentRegistrySequence) < BigInt(verified.payload.registrySequence)) {
      throw new Error('registry snapshot sequence is ahead of the authoritative current checkpoint')
    }
    if (currentRegistryVersion !== verified.payload.registryVersion ||
        currentRegistryDigest !== verified.registryDigest) {
      throw new Error('registry snapshot does not match the authoritative current checkpoint')
    }

    return {
      authorityReference,
      checkpointReference,
      controlSequence,
      revokedKeys,
    }
  }

  return Object.freeze({
    async resolveVerifiedRegistrySnapshot({ sourceId, feedId, policyVersion }) {
      const requestedSource = requiredString(sourceId, 'sourceId')
      const requestedFeed = requiredString(feedId, 'feedId')
      const requestedPolicy = requiredString(policyVersion, 'policyVersion')
      if (requestedPolicy !== verified.payload.policyVersion) {
        throw new Error('requested policy version does not match verified registry snapshot')
      }

      // Check authoritative currentness/revocation before returning any source entry.
      const currentness = await resolveCurrentState(requestedPolicy)
      const matches = verified.payload.entries.filter(entry =>
        entry.sourceId === requestedSource &&
        entry.feedId === requestedFeed &&
        entry.policyVersion === requestedPolicy
      )
      if (matches.length === 0) throw new Error('source/feed/policy entry not found in verified registry snapshot')
      if (matches.length !== 1) throw new Error('source/feed/policy entry is ambiguous in verified registry snapshot')
      const entry = matches[0]
      if (currentness.revokedKeys.has([requestedSource, requestedFeed, requestedPolicy].join('\\u0000'))) {
        throw new Error('source/feed/policy entry is revoked in authoritative currentness state')
      }
      if (entry.activationState !== 'ACTIVE') {
        throw new Error('source is not active in the authoritative current registry snapshot')
      }

      return Object.freeze({
        verificationStatus: verified.verificationStatus,
        signatureScheme: verified.signatureScheme,
        registryReference: reference,
        trustRootReference: rootReference,
        registryVersion: verified.payload.registryVersion,
        registrySequence: verified.payload.registrySequence,
        registryDigest: verified.registryDigest,
        policyVersion: verified.payload.policyVersion,
        currentnessAuthorityReference: currentness.authorityReference,
        currentnessCheckpointReference: currentness.checkpointReference,
        currentnessControlSequence: currentness.controlSequence,
        currentnessVerificationStatus: 'VERIFIED',
        entry,
      })
    },
  })
}

module.exports = {
  canonicalRegistryPayload,
  digestRegistryPayload,
  verifySignedMultiOracleRegistrySnapshot,
  createSignedMultiOracleRegistryProvider,
}
