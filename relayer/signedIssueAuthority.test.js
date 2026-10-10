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
    deploymentApproval: {
      status: 'DEPLOYMENT_APPROVED',
      candidateId: 'pre-rich-eev-v1',
      sourceSetId: 'source-set://preprod/1',
      profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
      evidenceHash: 'e'.repeat(64),
      qualifiedProperties: ['EV1','EV2','EV3','EV4','EV5','EV6','EV7'],
      excludedProperties: [],
      testSuiteVersion: 'eev-qualification-tests-v1',
      failureMatrixVersion: 'eev-failure-matrix-v1',
      validFrom: '2026-10-07T00:00:00Z',
      validUntilOrRevalidationRule: 'revalidate-on-source-or-profile-change',
    },
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

function protectedCapitalProvenance() {
  return {
    sourceReference: 'c'.repeat(64) + '#2',
    components: {
      crystallizedLiabilities: '10',
      worstCaseExposure: '100',
      safetyCapital: '20',
      reserveProtection: '30',
      lockedJackpot: '50',
      mandatoryFutureCosts: '40',
    },
    accountingInputs: {
      unresolvedReserve: '3',
      unresolvedTicketCount: '2',
    },
    total: '250',
  }
}

function viabilityCertificate() {
  const digest = (n) => String(n).repeat(64).slice(0, 64)
  const proofs = {}
  for (const [i, key] of ['VC1','VC2','VC3','VC4','VC5','VC6'].entries()) {
    proofs[key] = { reference: 'proof://' + key, digest: digest(i + 1) }
  }
  const evidence = {}
  for (const [i, key] of ['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10'].entries()) {
    evidence[key] = { reference: 'evidence://' + key, digest: digest((i + 1) % 10) }
  }
  return {
    id: 'pre-rich-kc-v1',
    version: '1',
    modelReference: 'model://pre-rich-v1',
    characteristicPredicateReference: 'chi://pre-rich-v1',
    witnessSelectorReference: 'wit://pre-rich-v1',
    boundsReference: 'bounds://pre-rich-v1',
    proofs,
    evidence,
    digest: 'f'.repeat(64),
    deploymentBinding: {
      network: 'cardano-preprod',
      carrierStateReference: 'c'.repeat(64) + '#2',
      stateHash: '4'.repeat(64),
      eevSnapshotReference: 'snapshot://eev/123',
      protectedCapitalSourceReference: 'c'.repeat(64) + '#2',
    },
  }
}

function makePayload(overrides = {}) {
  return {
    schema: 'PRE-RICH-SIGNED-ISSUE-AUTHORITY-V1',
    authorityVersion: '1',
    actionClass: 'Issue',
    stateHash: '4'.repeat(64),
    postStateHash: '5'.repeat(64),
    actionFingerprint: '6'.repeat(64),
    counterInputReference: 'a'.repeat(64) + '#0',
    controlStateReference: 'd'.repeat(64) + '#3',
    poolInputReference: 'b'.repeat(64) + '#1',
    carrierStateReference: 'c'.repeat(64) + '#2',
    directUsdmUnit: 'e'.repeat(56) + '0014df10745553444d',
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
    protectedCapitalProvenance: protectedCapitalProvenance(),
    viabilityCertificate: viabilityCertificate(),
    ...overrides,
  }
}

function signed(payload, privateKey) {
  const carrierBindingMessage = [
    payload.actionClass,
    payload.decisionReference,
    payload.observationReference,
    payload.stateHash,
    payload.actionFingerprint,
    payload.postStateHash,
  ].join('|')
  payload.carrierBindingSignature = crypto.sign(
    null,
    Buffer.from(carrierBindingMessage, 'utf8'),
    privateKey,
  ).toString('hex')
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
  controlStateReference: 'd'.repeat(64) + '#3',
  poolInputReference: 'b'.repeat(64) + '#1',
  carrierStateReference: 'c'.repeat(64) + '#2',
  directUsdmUnit: 'e'.repeat(56) + '0014df10745553444d',
  observationReference: 'obs://issue/1',
  decisionReference: 'decision://issue/1',
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
assert.equal(good.eevQualification.deploymentApproval.status, 'DEPLOYMENT_APPROVED')
assert.equal(good.observedAt, 1000n)
assert.equal(good.directUsdmUnit, expected.directUsdmUnit)

assert.throws(
  () => verifySignedIssueAuthorityEnvelope(
    signed(makePayload({
      eevQualification: {
        ...certificate(),
        deploymentApproval: {
          ...certificate().deploymentApproval,
          profileVersion: 'OTHER-EEV-PROFILE',
        },
      },
    }), privateKey),
    publicKey.export({ type: 'spki', format: 'pem' }),
    expected,
  ),
  /eevQualification profile is not the deployed direct-USDM profile/,
)

assert.throws(
  () => verifySignedIssueAuthorityEnvelope(
    signed(makePayload({
      directUsdmUnit: 'f'.repeat(56) + '0014df10745553444d',
    }), privateKey),
    publicKey.export({ type: 'spki', format: 'pem' }),
    expected,
  ),
  /Issue authority directUsdmUnit mismatch/,
)

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
    signed(makePayload({ controlStateReference: '9'.repeat(64) + '#3' }), privateKey),
    publicKey.export({ type: 'spki', format: 'pem' }),
    expected,
  ),
  /Issue authority B2 control reference mismatch/,
)

assert.throws(
  () => verifySignedIssueAuthorityEnvelope(
    signed(makePayload({ observationReference: 'obs://issue/tampered' }), privateKey),
    publicKey.export({ type: 'spki', format: 'pem' }),
    expected,
  ),
  /Issue authority observation reference mismatch/,
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

assert.throws(
  () => verifySignedIssueAuthorityEnvelope(
    signed(makePayload({
      protectedCapitalProvenance: {
        ...protectedCapitalProvenance(),
        total: '251',
      },
    }), privateKey),
    publicKey.export({ type: 'spki', format: 'pem' }),
    expected,
  ),
  /ProtectedCapital provenance total does not match components/,
)


assert.throws(
  () => verifySignedIssueAuthorityEnvelope(
    signed(makePayload({
      viabilityCertificate: {
        ...viabilityCertificate(),
        proofs: { ...viabilityCertificate().proofs, VC3: undefined },
      },
    }), privateKey),
    publicKey.export({ type: 'spki', format: 'pem' }),
    expected,
  ),
  /viabilityCertificate.proofs.VC3 is required/,
)
