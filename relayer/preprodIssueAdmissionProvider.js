const { readPreprodIssueObservation } = require('./preprodIssueObservationReader')
const { createPreprodIssueObservationProducer } = require('./preprodIssueObservationProvider')
const { fetchSignedIssueAuthority } = require('./signedIssueAuthority')

function exactRef(utxo) {
  if (
    !utxo ||
    typeof utxo.txHash !== 'string' ||
    !/^[0-9a-fA-F]{64}$/.test(utxo.txHash) ||
    !Number.isInteger(utxo.outputIndex) ||
    utxo.outputIndex < 0
  ) {
    throw new Error('Pool UTxO has no exact Cardano reference')
  }
  return utxo.txHash + '#' + utxo.outputIndex
}

async function observeDirectUsdmPool({ lucid, deployment, poolInputReference }) {
  if (typeof deployment.directUsdmUnit !== 'string' || deployment.directUsdmUnit.trim() === '') {
    throw new Error('deployment.directUsdmUnit is required')
  }

  const utxos = await lucid.utxosAt(deployment.b1PrizePoolAddress)
  const matches = utxos.filter(utxo => exactRef(utxo) === poolInputReference)

  if (matches.length !== 1) {
    throw new Error('exact B1 PrizePool input is no longer live; direct-USDM observation is stale')
  }

  const pool = matches[0]
  if ((pool.assets?.[deployment.poolTokenUnit] ?? 0n) !== 1n) {
    throw new Error('exact B1 PrizePool input does not contain the expected singleton')
  }

  const quantity = BigInt(pool.assets?.[deployment.directUsdmUnit] ?? 0n)
  if (quantity <= 0n) {
    throw new Error('exact B1 PrizePool input does not contain the deployment direct-USDM asset')
  }

  return (quantity * 100n) / 1_000_000n
}

const stripTxPrefix = (value) => String(value).trim().replace(/^cardano:tx\//, '')

function assertDirectUsdmEevUnits(observed, directUsdmValue) {
  const signed = observed?.signedEevUsdmSubunits
  const conversion = observed?.eevUnitConversion
  const decisionInput = observed?.decisionInput
  if (!signed || !conversion || !decisionInput) {
    throw new Error('authoritative Issue observation is missing signed EEV unit-conversion evidence')
  }

  const signedPreEEV = BigInt(requiredNonNegativeInteger(signed.preEEV, 'signed preEEV USDM sub-units'))
  const signedCandidateEEV = BigInt(requiredNonNegativeInteger(
    signed.candidateEEV,
    'signed candidateEEV USDM sub-units',
  ))
  if (signedPreEEV !== directUsdmValue || signedCandidateEEV !== directUsdmValue) {
    throw new Error('signed direct-USDM EEV values do not match the exact physical Pool observation')
  }

  if (
    conversion.sourceUnit !== 'USDM_SUBUNITS' ||
    conversion.targetUnit !== 'IMMORTAL_REFERENCE_UNITS' ||
    conversion.conversion !== 'EXACT_DIVIDE_BY_100'
  ) {
    throw new Error('authoritative Issue EEV unit conversion profile is invalid')
  }
  const subunitsPerReferenceUnit = BigInt(requiredNonNegativeInteger(
    conversion.sourceSubunitsPerReferenceUnit,
    'EEV sourceSubunitsPerReferenceUnit',
  ))
  if (subunitsPerReferenceUnit !== 100n) {
    throw new Error('authoritative Issue EEV conversion factor must be exactly 100')
  }

  const preEEVReferenceUnits = BigInt(requiredNonNegativeInteger(
    conversion.preEEVReferenceUnits,
    'converted preEEV reference units',
  ))
  const candidateEEVReferenceUnits = BigInt(requiredNonNegativeInteger(
    conversion.candidateEEVReferenceUnits,
    'converted candidateEEV reference units',
  ))
  const decisionPreEEV = BigInt(requiredNonNegativeInteger(
    decisionInput.preEEV,
    'IssueDecisionInput preEEV reference units',
  ))
  const decisionCandidateEEV = BigInt(requiredNonNegativeInteger(
    decisionInput.candidateEEV,
    'IssueDecisionInput candidateEEV reference units',
  ))

  if (
    preEEVReferenceUnits !== decisionPreEEV ||
    candidateEEVReferenceUnits !== decisionCandidateEEV ||
    preEEVReferenceUnits * subunitsPerReferenceUnit !== signedPreEEV ||
    candidateEEVReferenceUnits * subunitsPerReferenceUnit !== signedCandidateEEV
  ) {
    throw new Error('IssueDecisionInput EEV does not match the exact signed direct-USDM unit conversion')
  }
}

function createPreprodIssueObservationProducerFromLucid({
  lucid,
  deployment,
  authoritySource,
  authorityUrl = process.env.ISSUE_AUTHORITY_URL,
  authorityPublicKeyPem = process.env.ISSUE_AUTHORITY_PUBLIC_KEY,
}) {
  if (!lucid) throw new Error('lucid is required')
  if (!deployment || typeof deployment !== 'object') throw new Error('deployment is required')

  for (const field of [
    'counterAddress',
    'b1PrizePoolAddress',
    'poolTokenUnit',
    'directUsdmUnit',
    'carrierAddress',
    'carrierPolicyId',
    'carrierTokenNameHex',
    'controlAddress',
    'controlPolicyId',
    'controlTokenNameHex',
  ]) {
    if (typeof deployment[field] !== 'string' || deployment[field].trim() === '') {
      throw new Error('deployment.' + field + ' is required')
    }
  }

  const configuredAuthoritySource =
    typeof authoritySource === 'function'
      ? authoritySource
      : authorityUrl && authorityPublicKeyPem
        ? ({ counterInputReference, controlStateReference, poolInputReference, carrierStateReference, classId, price, observedAt, observationReference }) =>
            fetchSignedIssueAuthority({
              baseUrl: authorityUrl,
              publicKeyPem: authorityPublicKeyPem,
              request: {
                counterInputReference,
                controlStateReference,
                poolInputReference,
                carrierStateReference,
                classId,
                price,
                observedAt,
                observationReference,
              },
            })
        : null

  return createPreprodIssueObservationProducer({
    readObservation: async ({ counterInputReference, poolInputReference, runtimeInputs }) => {
      if (!runtimeInputs || typeof runtimeInputs !== 'object') throw new Error('runtimeInputs are required')

      const observationTimestamp = runtimeInputs.observedAt
      const directUsdmValue = await observeDirectUsdmPool({
        lucid,
        deployment,
        poolInputReference,
      })


      // Never accept economic inputs supplied by the browser/request caller.
      // Production admission must be backed by the configured authenticated authority.
      if (!configuredAuthoritySource) {
        throw new Error('authenticated issue authority source is required; caller-supplied authoritativeInputs are not trusted')
      }

      const observed = await readPreprodIssueObservation({
        lucid,
        ...deployment,
        classId: runtimeInputs.classId,
        price: runtimeInputs.price,
        authoritySource: configuredAuthoritySource,
        observedAt: observationTimestamp,
        poolUsdmValue: directUsdmValue,
      })

      if (observed.counterInputReference !== counterInputReference) {
        throw new Error('Preprod reader Counter reference does not match runtime input')
      }
      if (observed.poolInputReference !== poolInputReference) {
        throw new Error('Preprod reader Pool reference does not match runtime input')
      }
      if (
        runtimeInputs.controlStateReference !== undefined &&
        stripTxPrefix(observed.controlStateReference) !== stripTxPrefix(runtimeInputs.controlStateReference)
      ) {
        throw new Error('Preprod reader B2 control reference does not match runtime input')
      }
      if (BigInt(String(observed.poolUsdmValue)) !== directUsdmValue) {
        throw new Error('Preprod reader Pool valuation does not match direct physical observation')
      }
      assertDirectUsdmEevUnits(observed, directUsdmValue)

      const qualification = observed.eevQualification
      if (!qualification || typeof qualification !== 'object' || Array.isArray(qualification)) {
        throw new Error('authoritative Issue EEV qualification is required')
      }
      if (qualification.status !== 'qualified') {
        throw new Error('authoritative Issue EEV qualification must be qualified')
      }

      const deploymentApproval = qualification.deploymentApproval
      if (!deploymentApproval || typeof deploymentApproval !== 'object' || Array.isArray(deploymentApproval)) {
        throw new Error('authoritative Issue EEV deployment approval is required')
      }
      if (deploymentApproval.status !== 'DEPLOYMENT_APPROVED') {
        throw new Error('authoritative Issue EEV deployment approval must be DEPLOYMENT_APPROVED')
      }
      if (deploymentApproval.profileVersion !== 'PRE-RICH-EEV-USDM-DIRECT-V1') {
        throw new Error('authoritative Issue EEV profile does not match direct-USDM V1')
      }

      return observed
    },
  })
}

module.exports = { createPreprodIssueObservationProducerFromLucid }
