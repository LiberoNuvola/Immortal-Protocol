import assert from 'node:assert/strict'
import test from 'node:test'

import {
  C1_COMPONENT_IDS,
  observeC1ComponentsAtAcquiredPoint,
  validateC1CandidateIdentityEnvelope,
  sha256CanonicalJson,
} from './preprod-c1-acquired-point-observer.mjs'

const commit = 'a'.repeat(40)
const point = { slot: 123456, id: 'b'.repeat(64) }

function fixture() {
  return {
    schema: 'IMMORTAL-PREPROD-DEPLOYMENT-IDENTITY-v0.1',
    network: 'cardano-preprod',
    deploymentId: 'deployment-generation-fixture-01',
    source: { commit },
    components: C1_COMPONENT_IDS.map((componentId, index) => ({
      componentId,
      deploymentId: 'deployment-generation-fixture-01',
      sourceCommit: commit,
      address: 'addr_test_candidate_' + componentId,
      paymentCredentialKind: 'script',
      paymentCredentialHash: String(index + 1).repeat(56),
      derivedScriptHash: String(index + 1).repeat(56),
      scriptArtifactDigest: String(index + 1).repeat(64),
      parameterDigest: String(index + 1).repeat(64),
      deploymentTxOutRef: String(index + 1).repeat(64) + '#0',
      ...( ['b1Pool', 'v3Carrier', 'b2Control'].includes(componentId)
        ? { singleton: { policyId: String(index + 1).repeat(56), tokenNameHex: '01' } }
        : {}),
    })),
  }
}

function session() {
  const calls = []
  return {
    calls,
    isAcquired: true,
    isReleased: false,
    point,
    async query(method, params) {
      calls.push({ method, params })
      return [{ address: params.addresses[0], outputReference: { transaction: { id: 'c'.repeat(64) }, index: calls.length - 1 }, value: {} }]
    },
  }
}

test('validates exactly five component identities without granting authority', () => {
  const identity = validateC1CandidateIdentityEnvelope(fixture())
  assert.equal(identity.components.length, 5)
  assert.equal(identity.deploymentAuthorityVerified, false)
  assert.equal(identity.c1Qualified, false)
})

test('rejects a missing component', () => {
  const input = fixture()
  input.components = input.components.filter(item => item.componentId !== 'counter')
  assert.throws(() => validateC1CandidateIdentityEnvelope(input), /COMPONENT_MISSING:counter/)
})

test('rejects mixed deployment generations', () => {
  const input = fixture()
  input.components[2].deploymentId = 'another-generation'
  assert.throws(() => validateC1CandidateIdentityEnvelope(input), /GENERATION_MISMATCH:counter/)
})

test('rejects a payment credential that differs from the independently derived script hash', () => {
  const input = fixture()
  input.components[1].derivedScriptHash = 'f'.repeat(56)
  assert.throws(() => validateC1CandidateIdentityEnvelope(input), /PAYMENT_CREDENTIAL_DERIVED_HASH_MISMATCH:b1Pool/)
})

test('requires script artifact digests and exact deployment output references', () => {
  const missingDigest = fixture()
  delete missingDigest.components[0].scriptArtifactDigest
  assert.throws(() => validateC1CandidateIdentityEnvelope(missingDigest), /SCRIPT_ARTIFACT_DIGEST_REQUIRED/)

  const malformedReference = fixture()
  malformedReference.components[0].deploymentTxOutRef = 'not-an-out-reference'
  assert.throws(() => validateC1CandidateIdentityEnvelope(malformedReference), /DEPLOYMENT_TX_OUT_REF_INVALID:prizeValidator/)
})

test('canonical JSON digest is independent of object key insertion order', () => {
  assert.equal(
    sha256CanonicalJson({ z: 3, nested: { b: true, a: 1 }, a: 'value' }),
    sha256CanonicalJson({ a: 'value', nested: { a: 1, b: true }, z: 3 }),
  )
  assert.throws(() => sha256CanonicalJson({ unsafe: Number.MAX_SAFE_INTEGER + 1 }), /CANONICAL_JSON_NUMBER_INVALID/)
})

test('rejects a PrizeValidator singleton token assumption', () => {
  const input = fixture()
  input.components[0].singleton = { policyId: 'd'.repeat(56), tokenNameHex: '01' }
  assert.throws(() => validateC1CandidateIdentityEnvelope(input), /UNEXPECTED_SINGLETON:prizeValidator/)
})

test('queries all five addresses in one acquired point and preserves raw responses', async () => {
  const ledgerSession = session()
  const result = await observeC1ComponentsAtAcquiredPoint({
    ledgerSession,
    identityEnvelope: fixture(),
  })

  assert.deepEqual(ledgerSession.calls.map(call => call.params.addresses[0]),
    C1_COMPONENT_IDS.map(id => 'addr_test_candidate_' + id))
  assert.ok(ledgerSession.calls.every(call => call.method === 'queryLedgerState/utxo'))
  assert.deepEqual(result.acquiredLedgerState, point)
  assert.equal(result.digestAlgorithm, 'SHA256_CANONICAL_JSON_V1')
  assert.equal(result.digestScope, 'PARSED_JSON_OBJECTS_NOT_ORIGINAL_WEBSOCKET_WIRE_BYTES')
  assert.match(result.identityEnvelopeCanonicalJsonSha256, /^[0-9a-f]{64}$/)
  assert.deepEqual(Object.keys(result.observations), C1_COMPONENT_IDS)
  for (const observation of Object.values(result.observations)) {
    assert.equal(observation.query.method, 'queryLedgerState/utxo')
    assert.match(observation.queryCanonicalJsonSha256, /^[0-9a-f]{64}$/)
    assert.match(observation.rawOgmiosUtxoResultCanonicalJsonSha256, /^[0-9a-f]{64}$/)
  }
  assert.equal(result.observations.prizeValidator.rawUtxoCount, 1)
  assert.equal(result.observations.b1Pool.cardinalityStatus, 'FAIL_SINGLETON_TOKEN_CARDINALITY_OR_QUANTITY')
  assert.equal(result.observations.counter.cardinalityStatus, 'OBSERVED_EXACTLY_ONE_UTXO')
  assert.equal(result.observations.prizeValidator.cardinality.populationClassificationStatus, 'NOT_CLASSIFIED_PRIZEDATUM_DECODER_REQUIRED')
  assert.equal(result.deploymentAuthorityVerified, false)
  assert.equal(result.cardinalityQualified, false)
  assert.equal(result.c1Qualified, false)
})

test('refuses a released or unacquired session before querying', async () => {
  const ledgerSession = session()
  ledgerSession.isReleased = true
  await assert.rejects(
    observeC1ComponentsAtAcquiredPoint({ ledgerSession, identityEnvelope: fixture() }),
    /ACTIVE_ACQUIRED_LEDGER_SESSION/,
  )
  assert.equal(ledgerSession.calls.length, 0)
})

test('rejects non-array UTxO responses and stops the census', async () => {
  const ledgerSession = session()
  ledgerSession.query = async () => ({ malformed: true })
  await assert.rejects(
    observeC1ComponentsAtAcquiredPoint({ ledgerSession, identityEnvelope: fixture() }),
    /UTXO_RESPONSE_NOT_ARRAY:prizeValidator/,
  )
})
