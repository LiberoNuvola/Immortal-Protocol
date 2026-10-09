const crypto = require('node:crypto')

function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']'
  return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + canonicalize(value[key])).join(',') + '}'
}

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(field + ' is required')
  return value.trim()
}

function nonNegative(value, field) {
  let n
  try { n = BigInt(String(value)) } catch { throw new Error(field + ' must be an integer') }
  if (n < 0n) throw new Error(field + ' must be non-negative')
  return n
}

function requiredObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(field + ' is required')
  }
  return value
}

function requiredDigest(value, field) {
  const digest = requiredString(value, field)
  if (!/^[0-9a-fA-F]{64}$/.test(digest)) {
    throw new Error(field + ' must be a 32-byte hex digest')
  }
  return digest.toLowerCase()
}

function validateViabilityCertificate(value) {
  const certificate = requiredObject(value, 'viabilityCertificate')
  const fields = [
    'id',
    'version',
    'modelReference',
    'characteristicPredicateReference',
    'witnessSelectorReference',
    'boundsReference',
  ]
  for (const field of fields) {
    requiredString(certificate[field], 'viabilityCertificate.' + field)
  }
  const digest = requiredDigest(certificate.digest, 'viabilityCertificate.digest')

  const proofs = requiredObject(certificate.proofs, 'viabilityCertificate.proofs')
  const normalizedProofs = {}
  for (const key of ['VC1', 'VC2', 'VC3', 'VC4', 'VC5', 'VC6']) {
    const proof = requiredObject(
      proofs[key],
      'viabilityCertificate.proofs.' + key,
    )
    normalizedProofs[key] = Object.freeze({
      reference: requiredString(
        proof.reference,
        'viabilityCertificate.proofs.' + key + '.reference',
      ),
      digest: requiredDigest(
        proof.digest,
        'viabilityCertificate.proofs.' + key + '.digest',
      ),
    })
  }

  const evidence = requiredObject(
    certificate.evidence,
    'viabilityCertificate.evidence',
  )
  const normalizedEvidence = {}
  for (const key of ['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10']) {
    const artifact = requiredObject(
      evidence[key],
      'viabilityCertificate.evidence.' + key,
    )
    normalizedEvidence[key] = Object.freeze({
      reference: requiredString(
        artifact.reference,
        'viabilityCertificate.evidence.' + key + '.reference',
      ),
      digest: requiredDigest(
        artifact.digest,
        'viabilityCertificate.evidence.' + key + '.digest',
      ),
    })
  }

  return Object.freeze({
    id: certificate.id,
    version: certificate.version,
    modelReference: certificate.modelReference,
    characteristicPredicateReference: certificate.characteristicPredicateReference,
    witnessSelectorReference: certificate.witnessSelectorReference,
    boundsReference: certificate.boundsReference,
    proofs: Object.freeze(normalizedProofs),
    evidence: Object.freeze(normalizedEvidence),
    digest,
  })
}

function validateEevQualification(value) {
  const qualification = requiredObject(value, 'eevQualification')
  if (qualification.status !== 'qualified') {
    throw new Error('eevQualification status must be qualified')
  }

  const deploymentApproval = requiredObject(
    qualification.deploymentApproval,
    'eevQualification.deploymentApproval',
  )
  if (deploymentApproval.status !== 'DEPLOYMENT_APPROVED') {
    throw new Error('eevQualification deployment status must be DEPLOYMENT_APPROVED')
  }
  if (deploymentApproval.profileVersion !== 'PRE-RICH-EEV-USDM-DIRECT-V1') {
    throw new Error('eevQualification profile is not the deployed direct-USDM profile')
  }
  for (const field of [
    'candidateId',
    'sourceSetId',
    'profileVersion',
    'testSuiteVersion',
    'failureMatrixVersion',
    'validFrom',
    'validUntilOrRevalidationRule',
  ]) {
    requiredString(
      deploymentApproval[field],
      'eevQualification.deploymentApproval.' + field,
    )
  }
  requiredDigest(
    deploymentApproval.evidenceHash,
    'eevQualification.deploymentApproval.evidenceHash',
  )
  for (const field of ['qualifiedProperties', 'excludedProperties']) {
    if (!Array.isArray(deploymentApproval[field])) {
      throw new Error(
        'eevQualification.deploymentApproval.' + field + ' must be an array',
      )
    }
    deploymentApproval[field].forEach((item, index) =>
      requiredString(
        item,
        'eevQualification.deploymentApproval.' + field + '[' + index + ']',
      ),
    )
  }

  const contractVersion = requiredString(
    qualification.contractVersion,
    'eevQualification.contractVersion',
  )
  const sourceReference = requiredString(
    qualification.sourceReference,
    'eevQualification.sourceReference',
  )
  const verificationReference = requiredString(
    qualification.verificationReference,
    'eevQualification.verificationReference',
  )
  const derivationVersion = requiredString(
    qualification.derivationVersion,
    'eevQualification.derivationVersion',
  )
  const snapshotReference = requiredString(
    qualification.snapshotReference,
    'eevQualification.snapshotReference',
  )
  const evidence = requiredObject(
    qualification.evidence,
    'eevQualification.evidence',
  )

  const normalizedEvidence = {}
  for (const key of ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7']) {
    const artifact = requiredObject(
      evidence[key],
      'eevQualification.evidence.' + key,
    )
    normalizedEvidence[key] = Object.freeze({
      reference: requiredString(
        artifact.reference,
        'eevQualification.evidence.' + key + '.reference',
      ),
      digest: requiredDigest(
        artifact.digest,
        'eevQualification.evidence.' + key + '.digest',
      ),
    })
  }

  return Object.freeze({
    status: 'qualified',
    contractVersion,
    deploymentApproval: Object.freeze({
      status: 'DEPLOYMENT_APPROVED',
      candidateId: deploymentApproval.candidateId,
      sourceSetId: deploymentApproval.sourceSetId,
      profileVersion: deploymentApproval.profileVersion,
      evidenceHash: requiredDigest(
        deploymentApproval.evidenceHash,
        'eevQualification.deploymentApproval.evidenceHash',
      ),
      qualifiedProperties: Object.freeze([...deploymentApproval.qualifiedProperties]),
      excludedProperties: Object.freeze([...deploymentApproval.excludedProperties]),
      testSuiteVersion: deploymentApproval.testSuiteVersion,
      failureMatrixVersion: deploymentApproval.failureMatrixVersion,
      validFrom: deploymentApproval.validFrom,
      validUntilOrRevalidationRule: deploymentApproval.validUntilOrRevalidationRule,
    }),
    sourceReference,
    verificationReference,
    derivationVersion,
    snapshotReference,
    evidence: Object.freeze(normalizedEvidence),
  })
}

function validateProtectedCapitalProvenance(value) {
  const provenance = requiredObject(value, 'protectedCapitalProvenance')
  const sourceReference = requiredString(
    provenance.sourceReference,
    'protectedCapitalProvenance.sourceReference',
  )
  const components = requiredObject(
    provenance.components,
    'protectedCapitalProvenance.components',
  )
  const componentNames = [
    'crystallizedLiabilities',
    'worstCaseExposure',
    'safetyCapital',
    'reserveProtection',
    'lockedJackpot',
    'mandatoryFutureCosts',
  ]
  const normalizedComponents = {}
  for (const name of componentNames) {
    normalizedComponents[name] = nonNegative(
      components[name],
      'protectedCapitalProvenance.components.' + name,
    )
  }
  const accountingInputs = requiredObject(
    provenance.accountingInputs,
    'protectedCapitalProvenance.accountingInputs',
  )
  const normalizedAccountingInputs = {
    unresolvedReserve: nonNegative(
      accountingInputs.unresolvedReserve,
      'protectedCapitalProvenance.accountingInputs.unresolvedReserve',
    ),
    unresolvedTicketCount: nonNegative(
      accountingInputs.unresolvedTicketCount,
      'protectedCapitalProvenance.accountingInputs.unresolvedTicketCount',
    ),
  }
  const total = nonNegative(
    provenance.total,
    'protectedCapitalProvenance.total',
  )
  const sum = Object.values(normalizedComponents).reduce(
    (acc, value) => acc + value,
    0n,
  )
  if (sum !== total) {
    throw new Error('ProtectedCapital provenance total does not match components')
  }
  return Object.freeze({
    sourceReference,
    components: Object.freeze(normalizedComponents),
    accountingInputs: Object.freeze(normalizedAccountingInputs),
    total,
  })
}

function verifySignedIssueAuthorityEnvelope(envelope, publicKeyPem, expected) {
  if (!envelope || typeof envelope !== 'object') throw new Error('Issue authority envelope is required')
  if (!publicKeyPem) throw new Error('ISSUE_AUTHORITY_PUBLIC_KEY is required')

  const payload = envelope.payload
  if (!payload || typeof payload !== 'object') throw new Error('Issue authority payload is required')
  if (payload.schema !== 'PRE-RICH-SIGNED-ISSUE-AUTHORITY-V1') {
    throw new Error('Issue authority payload schema is invalid')
  }
  if (payload.authorityVersion !== '1') {
    throw new Error('Issue authority authorityVersion is invalid')
  }
  if (payload.actionClass !== 'Issue') {
    throw new Error('Issue authority actionClass must be Issue')
  }
  const signature = requiredString(envelope.signature, 'Issue authority signature')

  const expectedDirectUsdmUnit = requiredString(
    expected.directUsdmUnit,
    'directUsdmUnit',
  )
  const payloadDirectUsdmUnit = requiredString(
    payload.directUsdmUnit,
    'directUsdmUnit',
  )
  if (
    payloadDirectUsdmUnit.toLowerCase() !==
    expectedDirectUsdmUnit.toLowerCase()
  ) {
    throw new Error('Issue authority directUsdmUnit mismatch')
  }

  const requiredRefs = ['counterInputReference', 'poolInputReference', 'carrierStateReference', 'observationReference', 'decisionReference']
  for (const field of requiredRefs) requiredString(payload[field], field)

  if (payload.counterInputReference !== expected.counterInputReference) throw new Error('Issue authority Counter reference mismatch')
  if (payload.poolInputReference !== expected.poolInputReference) throw new Error('Issue authority Pool reference mismatch')
  if (payload.carrierStateReference !== expected.carrierStateReference) throw new Error('Issue authority carrier reference mismatch')
  if (payload.classId !== expected.classId) throw new Error('Issue authority classId mismatch')
  if (payload.price !== expected.price) throw new Error('Issue authority price mismatch')
  if (payload.observationReference !== expected.observationReference) throw new Error('Issue authority observation reference mismatch')

  const signedBytes = Buffer.from(canonicalize(payload), 'utf8')
  let signatureBytes
  try { signatureBytes = Buffer.from(signature, 'base64') } catch { throw new Error('Issue authority signature is not base64') }
  if (signatureBytes.length === 0) throw new Error('Issue authority signature is empty')

  let valid = false
  try { valid = crypto.verify(null, signedBytes, publicKeyPem, signatureBytes) } catch (error) { throw new Error('Issue authority signature verification failed: ' + error.message) }
  if (!valid) throw new Error('Issue authority signature is invalid')

  const eevQualification = validateEevQualification(payload.eevQualification)
  const protectedCapitalProvenance = validateProtectedCapitalProvenance(payload.protectedCapitalProvenance)
  const viabilityCertificate = validateViabilityCertificate(
    payload.viabilityCertificate,
  )
  if (
    eevQualification.sourceReference !==
    requiredString(payload.sourceReference, 'sourceReference')
  ) {
    throw new Error('EEV qualification sourceReference mismatch')
  }
  if (
    eevQualification.verificationReference !==
    requiredString(payload.verificationReference, 'verificationReference')
  ) {
    throw new Error('EEV qualification verificationReference mismatch')
  }
  if (
    eevQualification.derivationVersion !==
    requiredString(payload.derivationVersion, 'derivationVersion')
  ) {
    throw new Error('EEV qualification derivationVersion mismatch')
  }
  if (protectedCapitalProvenance.sourceReference !== payload.carrierStateReference) {
    throw new Error('ProtectedCapital provenance is not bound to the V3 carrier state')
  }

  const values = {
    poolUsdmValue: nonNegative(payload.poolUsdmValue, 'poolUsdmValue'),
    preEEV: nonNegative(payload.preEEV, 'preEEV'),
    candidateEEV: nonNegative(payload.candidateEEV, 'candidateEEV'),
    requiredImmediateLiquidity: nonNegative(payload.requiredImmediateLiquidity, 'requiredImmediateLiquidity'),
  }

  for (const key of ['truthVerified', 'eevFresh', 'obligationsComplete', 'allOmegaSuccessorsCertified']) {
    if (typeof payload[key] !== 'boolean') throw new Error(key + ' must be boolean')
  }

  if (!payload.truthVerified || !payload.eevFresh || !payload.obligationsComplete || !payload.allOmegaSuccessorsCertified) {
    throw new Error('Issue authority evidence is not fully verified/fresh/certified')
  }

  const observedAt = nonNegative(payload.observedAt, 'observedAt')
  const freshnessWindow = nonNegative(payload.freshnessWindow, 'freshnessWindow')
  if (expected.observedAt !== undefined) {
    const expectedAt = nonNegative(expected.observedAt, 'expected observedAt')
    if (observedAt !== expectedAt) throw new Error('Issue authority observedAt mismatch')
  }
  if (freshnessWindow === 0n) throw new Error('Issue authority freshnessWindow must be positive')

  if (expected.currentObservedAt !== undefined) {
    const currentObservedAt = nonNegative(
      expected.currentObservedAt,
      'current observedAt',
    )
    if (currentObservedAt < observedAt) {
      throw new Error('Issue authority observation is from the future')
    }
    if (currentObservedAt - observedAt > freshnessWindow) {
      throw new Error('Issue authority EEV observation is stale')
    }
  }

  return Object.freeze({
    ...values,
    truthVerified: true,
    eevFresh: true,
    obligationsComplete: true,
    allOmegaSuccessorsCertified: true,
    decisionReference: payload.decisionReference,
    observationReference: payload.observationReference,
    observedAt,
    freshnessWindow,
    verificationReference: requiredString(payload.verificationReference, 'verificationReference'),
    sourceReference: requiredString(payload.sourceReference, 'sourceReference'),
    derivationVersion: requiredString(payload.derivationVersion, 'derivationVersion'),
    directUsdmUnit: payloadDirectUsdmUnit.toLowerCase(),
    eevQualification,
    protectedCapitalProvenance,
    viabilityCertificate,
  })
}

async function fetchSignedIssueAuthority({ baseUrl, publicKeyPem, request }) {
  if (!baseUrl) throw new Error('ISSUE_AUTHORITY_URL is required')
  if (!publicKeyPem) throw new Error('ISSUE_AUTHORITY_PUBLIC_KEY is required')
  const url = new URL(baseUrl)
  for (const [key, value] of Object.entries(request)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }
  const response = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error('Issue authority returned HTTP ' + response.status)
  const envelope = await response.json()
  return verifySignedIssueAuthorityEnvelope(envelope, publicKeyPem, {
    ...request,
    currentObservedAt: Date.now(),
  })
}

module.exports = { canonicalize, verifySignedIssueAuthorityEnvelope, fetchSignedIssueAuthority }
