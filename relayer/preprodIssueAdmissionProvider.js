const { readPreprodIssueObservation } = require('./preprodIssueObservationReader')
const { createPreprodIssueObservationProducer } = require('./preprodIssueObservationProvider')
const { fetchSignedIssueAuthority } = require('./signedIssueAuthority')

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
    readObservation: async ({ counterInputReference, poolInputReference, poolUsdmValue, runtimeInputs }) => {
      if (!runtimeInputs || typeof runtimeInputs !== 'object') throw new Error('runtimeInputs are required')

      const authoritativeInputs = runtimeInputs.authoritativeInputs
      const observationTimestamp =
        runtimeInputs.observedAt === undefined || runtimeInputs.observedAt === null
          ? Date.now()
          : runtimeInputs.observedAt

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
      })

      if (observed.counterInputReference !== counterInputReference) {
        throw new Error('Preprod reader Counter reference does not match runtime input')
      }
      if (observed.poolInputReference !== poolInputReference) {
        throw new Error('Preprod reader Pool reference does not match runtime input')
      }
      if (String(observed.poolUsdmValue) !== String(poolUsdmValue)) {
        throw new Error('Preprod reader Pool valuation does not match runtime input')
      }
      return observed
    },
  })
}

module.exports = { createPreprodIssueObservationProducerFromLucid }
