const { generateKeyPairSync } = require('node:crypto')
const { signIssueAuthorityEnvelope } = require('./preprodIssueAuthorityEnvelope')
const { verifySignedIssueAuthorityEnvelope } = require('./signedIssueAuthority')

const refs = {
  counter: 'b'.repeat(64) + '#0',
  pool: 'a'.repeat(64) + '#0',
  carrier: 'c'.repeat(64) + '#0',
  control: 'e'.repeat(64) + '#3',
}
const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const eevQualification = {
  status: 'qualified',
  contractVersion: '3.0.0',
  sourceReference: 'cardano:preprod/utxo/' + refs.pool,
  verificationReference: 'github-actions:run/123@' + 'b'.repeat(40),
  derivationVersion: 'direct-usdm-v1',
  snapshotReference: 'sha256:' + 'c'.repeat(64),
  evidence: Object.fromEntries(['EV1','EV2','EV3','EV4','EV5','EV6','EV7'].map(k => [k, { reference: 'repo:' + k, digest: 'd'.repeat(64) }])),
  deploymentApproval: {
    status: 'DEPLOYMENT_APPROVED',
    candidateId: 'candidate-1',
    sourceSetId: 'source-set-1',
    profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
    evidenceHash: 'e'.repeat(64),
    qualifiedProperties: ['EV1','EV2','EV3','EV4','EV5','EV6','EV7'],
    excludedProperties: [],
    testSuiteVersion: 'pre-rich-direct-usdm-conformance-v1',
    failureMatrixVersion: 'pre-rich-direct-usdm-failure-matrix-v1',
    validFrom: '2026-10-09T00:00:00Z',
    validUntilOrRevalidationRule: 'LIVE_UTXO_REVALIDATION',
  },
}
const viabilityCertificate = {
  id: 'fixture-vc',
  version: '1',
  modelReference: 'fixture:model',
  characteristicPredicateReference: 'fixture:chi',
  witnessSelectorReference: 'fixture:wit',
  boundsReference: 'fixture:bounds',
  proofs: Object.fromEntries(['VC1','VC2','VC3','VC4','VC5','VC6'].map(k => [k, { reference: 'proof:' + k, digest: 'f'.repeat(64) }])),
  evidence: Object.fromEntries(['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10'].map(k => [k, { reference: 'evidence:' + k, digest: '1'.repeat(64) }])),
  digest: '2'.repeat(64),
  deploymentBinding: {
    network: 'cardano-preprod',
    carrierStateReference: refs.carrier,
    stateHash: '3'.repeat(64),
    eevSnapshotReference: 'sha256:' + 'c'.repeat(64),
    protectedCapitalSourceReference: refs.carrier,
  },
}
const witness = {
  admitted: true,
  actionClass: 'Issue',
  decisionReference: 'decision-1',
  authoritativeObservationReference: 'observation-1',
  counterInputReference: refs.counter,
  controlStateReference: refs.control,
  authenticatedPoolInputReference: refs.pool,
  authenticatedPoolUsdmValue: 100n,
  eev: 100n,
  requiredImmediateLiquidity: 0n,
  executableLiquidityObservation: { observedAt: BigInt(Date.now()) },
  v3CarrierBinding: { carrierStateReference: refs.carrier },
  eevQualification,
  protectedCapitalProvenance: {
    sourceReference: refs.carrier,
    components: {
      crystallizedLiabilities: '1',
      worstCaseExposure: '2',
      safetyCapital: '3',
      reserveProtection: '4',
      lockedJackpot: '5',
      mandatoryFutureCosts: '6',
    },
    accountingInputs: { unresolvedReserve: '2', unresolvedTicketCount: '1' },
    total: '21',
  },
  viabilityCertificate,
  stateHash: '3'.repeat(64),
  postStateHash: '4'.repeat(64),
  actionFingerprint: '5'.repeat(64),
}
const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' })
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' })
const now = Number(witness.executableLiquidityObservation.observedAt)
const envelope = signIssueAuthorityEnvelope({
  witness,
  directUsdmUnit: 'd'.repeat(56),
  freshnessWindow: 300000,
  privateKeyPem,
  publicKeyPem,
  currentObservedAt: now,
})
verifySignedIssueAuthorityEnvelope(envelope, publicKeyPem, {
  counterInputReference: refs.counter,
  controlStateReference: refs.control,
  poolInputReference: refs.pool,
  carrierStateReference: refs.carrier,
  classId: 0,
  price: 1,
  directUsdmUnit: 'd'.repeat(56),
  observationReference: 'observation-1',
  observedAt: witness.executableLiquidityObservation.observedAt,
  currentObservedAt: now,
})
try {
  signIssueAuthorityEnvelope({
    witness: {
      ...witness,
      viabilityCertificate: {
        ...witness.viabilityCertificate,
        deploymentBinding: {
          ...witness.viabilityCertificate.deploymentBinding,
          carrierStateReference: '9'.repeat(64) + '#0',
        },
      },
    },
    directUsdmUnit: 'd'.repeat(56),
    freshnessWindow: 300000,
    privateKeyPem,
    publicKeyPem,
    currentObservedAt: now,
  })
  throw new Error('FAIL: mismatched viability certificate binding was accepted')
} catch (error) {
  if (!String(error.message).includes('carrier binding mismatch')) throw error
}

const badSchema = {
  payload: { ...envelope.payload, schema: 'OTHER' },
  signature: envelope.signature,
}
try {
  verifySignedIssueAuthorityEnvelope(badSchema, publicKeyPem, {
    counterInputReference: refs.counter,
    poolInputReference: refs.pool,
    carrierStateReference: refs.carrier,
    classId: 0n,
    price: 1n,
    directUsdmUnit: 'd'.repeat(56),
    observationReference: 'observation-1',
    observedAt: witness.executableLiquidityObservation.observedAt,
    currentObservedAt: now,
  })
  throw new Error('FAIL: invalid Issue authority schema was accepted')
} catch (error) {
  if (!String(error.message).includes('schema is invalid')) throw error
}

try {
  signIssueAuthorityEnvelope({
    witness: { ...witness, preEEV: undefined },
    directUsdmUnit: 'd'.repeat(56),
    freshnessWindow: 300000,
    privateKeyPem,
    publicKeyPem,
    currentObservedAt: now,
  })
  throw new Error('FAIL: missing witness preEEV was accepted')
} catch (error) {
  if (!String(error.message).includes('witness preEEV is required')) throw error
}

try {
  signIssueAuthorityEnvelope({
    witness: { ...witness, eevFresh: false },
    directUsdmUnit: 'd'.repeat(56),
    freshnessWindow: 300000,
    privateKeyPem,
    publicKeyPem,
    currentObservedAt: now,
  })
  throw new Error('FAIL: unverified witness flag was accepted')
} catch (error) {
  if (!String(error.message).includes('witness eevFresh must be true')) throw error
}

console.log('PASS: signed Issue authority envelope self-verifies and rejects malformed authority')
