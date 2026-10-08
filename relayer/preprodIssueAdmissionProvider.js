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
  ]) {
    if (typeof deployment[field] !== 'string' || deployment[field].trim() === '') {
      throw new Error('deployment.' + field + ' is required')
    }
  }

  const configuredAuthoritySource =
    typeof authoritySource === 'function'
      ? authoritySource
      : authorityUrl && authorityPublicKeyPem
        ? ({ counterInputReference, poolInputReference, carrierStateReference, classId, price, observedAt, observationReference }) =>
            fetchSignedIssueAuthority({
              baseUrl: authorityUrl,
              publicKeyPem: authorityPublicKeyPem,
              request: {
                counterInputReference,
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

      const authoritativeInputs = runtimeInputs.authoritativeInputs
      const observationTimestamp = runtimeInputs.observedAt
      const directUsdmValue = await observeDirectUsdmPool({
        lucid,
        deployment,
        poolInputReference,
      })


      if (
        (!authoritativeInputs || typeof authoritativeInputs !== 'object') &&
        !configuredAuthoritySource
      ) {
        throw new Error(
          'runtimeInputs.authoritativeInputs or an authenticated issue authority source is required',
        )
      }

      const observed = await readPreprodIssueObservation({
        lucid,
        ...deployment,
        classId: runtimeInputs.classId,
        price: runtimeInputs.price,
        authoritativeInputs:
          authoritativeInputs && typeof authoritativeInputs === 'object'
            ? authoritativeInputs
            : undefined,
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
      if (BigInt(String(observed.poolUsdmValue)) !== directUsdmValue) {
        throw new Error('Preprod reader Pool valuation does not match direct physical observation')
      }
      if (
        BigInt(String(observed.decisionInput.preEEV)) !== directUsdmValue ||
        BigInt(String(observed.decisionInput.candidateEEV)) !== directUsdmValue
      ) {
        throw new Error(
          'authoritative Issue EEV values do not match direct physical USDM observation',
        )
      }

      const qualification = observed.eevQualification
      const profileVersion = qualification?.deploymentApproval?.profileVersion
      if (
        profileVersion !== undefined &&
        profileVersion !== 'PRE-RICH-EEV-USDM-DIRECT-V1'
      ) {
        throw new Error('authoritative Issue EEV profile does not match direct-USDM V1')
      }

      return observed
    },
  })
}

module.exports = { createPreprodIssueObservationProducerFromLucid }
