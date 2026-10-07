const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const {
  canonicalize,
  verifySignedIssueAuthorityEnvelope,
} = require('./signedIssueAuthority.js')

function certificate() {
  const d = (n) => n.toString(16).padStart(2, '0').repeat(32)
  return {
    status: 'qualified',
    contractVersion: '3.0.0',
    sourceReference: 'source://eev/preprod',
    verificationReference: 'verify://eev/preprod',
    derivationVersion: 'eev-v1',
    snapshotReference: 'snapshot://eev/123',
    evidence: {
      EV1: { reference: 'evidence://EV1', digest: d(1) },
      EV2: { reference: 'evidence://EV2', digest: d(2) },
      EV3: { reference: 'evidence://EV3', digest: d(3) },
      EV4: { reference: 'evidence://EV4', digest: d(4) },
      EV5: { reference: 'evidence://EV5', digest: d(5) },
      EV6: { reference: 'evidence://EV6', digest: d(6) },
      EV7: { reference: 'evidence://EV7', digest: d(7) },
    },
  }
}

function makePayload(overrides = {}) {
  return {
    counterInputReference: 'a'.repeat(64) + '#0',
    poolInputReference: 'b'.repeat(64) + '#1',
    carrierStateReference: 'c'.repeat(64) + '#2',
    observationReference: 'obs://issue/1',
    decisionReference: 'decision://issue/1',
    classId: 0,
    price: 1,
    poolUsdmValue: '1000',
    preEEV: '1200',
    candidateEEV: '1201',
    requiredImmediateLiquidity: '1',
    truthVerified: true,
    eevFresh: true,
    obligationsComplete: true,
    allOmegaSuccessorsCertified: true,
    observedAt: '1000',
    freshnessWindow: '300000',
    sourceReference: 'source://eev/preprod',
    verificationReference: 'verify://eev/preprod',
    derivationVersion: 'eev-v1',
    eevQualification: certificate(),
    ...overrides,
  }
}

function signed(payload, privateKey) {
  const signature = crypto.sign(
    null,
    Buffer.from(canonicalize(payload), 'utf8'),
    privateKey,
  ).toString('base64')
  return { payload, signature }
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
const expected = {
  counterInputReference: 'a'.repeat(64) + '#0',
  poolInputReference: 'b'.repeat(64) + '#1',
  carrierStateReference: 'c'.repeat(64) + '#2',
  classId: 0,
  price: 1,
  currentObservedAt: 1100,
}

const good = verifySignedIssueAuthorityEnvelope(
  signed(makePayload(), privateKey),
  publicKey.export({ type: 'spki', format: 'pem' }),
  expected,
)
assert.equal(good.candidateEEV, 1201n)
assert.equal(good.eevQualification.status, 'qualified')
assert.equal(good.observedAt, 1000n)

assert.throws(
  () => verifySignedIssueAuthorityEnvelope(
    signed(makePayload({ eevQualification: { ...certificate(), evidence: { ...certificate().evidence, EV6: undefined } } }), privateKey),
    publicKey.export({ type: 'spki', format: 'pem' }),
    expected,
  ),
  /eevQualification.evidence.EV6 is required/,
)

assert.throws(
  () => verifySignedIssueAuthorityEnvelope(
    signed(makePayload({ observedAt: '500', freshnessWindow: '100' }), privateKey),
    publicKey.export({ type: 'spki', format: 'pem' }),
    expected,
  ),
  /EEV observation is stale|observation is stale/,
)

console.log('signedIssueAuthority: PASS')
