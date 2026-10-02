const { readPreprodIssueObservation } = require('./preprodIssueObservationReader')
const { createPreprodIssueObservationProducer } = require('./preprodIssueObservationProvider')

function createPreprodIssueObservationProducerFromLucid({ lucid, deployment }) {
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

  return createPreprodIssueObservationProducer({
    readObservation: async ({ counterInputReference, poolInputReference, poolUsdmValue, runtimeInputs }) => {
      if (!runtimeInputs || typeof runtimeInputs !== 'object') throw new Error('runtimeInputs are required')
      const authoritativeInputs = runtimeInputs.authoritativeInputs
      if (!authoritativeInputs || typeof authoritativeInputs !== 'object') {
        throw new Error('runtimeInputs.authoritativeInputs are required')
      }

      const observed = await readPreprodIssueObservation({
        lucid,
        ...deployment,
        classId: runtimeInputs.classId,
        price: runtimeInputs.price,
        authoritativeInputs,
        observedAt: runtimeInputs.observedAt,
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
