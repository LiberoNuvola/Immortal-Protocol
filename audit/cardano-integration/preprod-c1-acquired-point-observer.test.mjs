import assert from 'node:assert/strict'
import test from 'node:test'

import {
  C1_COMPONENT_IDS,
  observeC1ComponentsAtAcquiredPoint,
  validateC1CandidateIdentityEnvelope,
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
  assert.deepEqual(Object.keys(result.observations), C1_COMPONENT_IDS)
  assert.equal(result.observations.prizeValidator.rawUtxoCount, 1)
  assert.equal(result.observations.b1Pool.cardinalityStatus, 'NOT_EVALUATED_RAW_VALUE_DECODER_REQUIRED')
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
