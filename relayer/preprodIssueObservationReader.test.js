const test = require('node:test')
const assert = require('node:assert/strict')
const { readPreprodIssueObservation } = require('./preprodIssueObservationReader')

const ref = (ch) => ch.repeat(64)

function datum() {
  const prices = [1n,2n,3n,5n,10n,25n,50n,100n]
  const classes = prices.map((price, i) => ({
    fields: [
      BigInt(i), 0n, 0n, 0n, 10n,
      { index: i === 0 ? 1 : 0, fields: [] },
    ],
  }))
  const state = {
    fields: [
      0n, 0n, 0n, 0n, 0n, 0n,
      classes,
      { fields: [0n, 0n] },
      { fields: [0n, 0n, { index: 0, fields: [] }, 0n] },
    ],
  }
  return { fields: [0n, state] }
}

function fakeLucid() {
  return {
    async utxosAt(address) {
      if (address === 'counter') {
        return [{ txHash: ref('a'), outputIndex: 0, datum: { fields: [0n] }, assets: { lovelace: 5_000_000n } }]
      }
      if (address === 'pool') {
        return [{
          txHash: ref('b'),
          outputIndex: 1,
          datum: { fields: [1_000n,0n,0n,0n,0n,0n,{},{}] },
          assets: { ['poolpolicy' + 'poolname']: 1n },
        }]
      }
      if (address === 'carrier') {
        return [{
          txHash: ref('c'),
          outputIndex: 2,
          datum: datum(),
          assets: { ['carrierpolicy' + 'carriername']: 1n },
        }]
      }
      return []
    },
  }
}

test('reads exact Counter, Pool and V3 carrier and binds authoritative inputs', async () => {
  const result = await readPreprodIssueObservation({
    lucid: fakeLucid(),
    counterAddress: 'counter',
    b1PrizePoolAddress: 'pool',
    poolTokenUnit: 'poolpolicy' + 'poolname',
    carrierAddress: 'carrier',
    carrierPolicyId: 'carrierpolicy',
    carrierTokenNameHex: 'carriername',
    classId: 0,
    price: 1,
    observedAt: 123n,
    authoritativeInputs: {
      poolUsdmValue: 1_000n,
      preEEV: 1_000n,
      candidateEEV: 1_000n,
      requiredImmediateLiquidity: 1n,
      truthVerified: true,
      eevFresh: true,
      obligationsComplete: true,
      allOmegaSuccessorsCertified: true,
      decisionReference: 'decision-1',
    },
  })

  assert.equal(result.counterInputReference, ref('a') + '#0')
  assert.equal(result.poolInputReference, ref('b') + '#1')
  assert.equal(result.carrierStateReference, 'cardano:tx/' + ref('c') + '#2')
  assert.equal(result.decisionInput.preState.control.currentActiveClass, 0n)
  assert.equal(result.decisionInput.classId, 0n)
  assert.equal(result.decisionInput.observationReference.includes(ref('c')), true)
})

test('fails closed when the carrier singleton is ambiguous', async () => {
  const lucid = fakeLucid()
  const original = lucid.utxosAt
  lucid.utxosAt = async (address) => {
    const values = await original(address)
    if (address === 'carrier') values.push({ ...values[0], outputIndex: 3 })
    return values
  }

  await assert.rejects(
    () => readPreprodIssueObservation({
      lucid,
      counterAddress: 'counter',
      b1PrizePoolAddress: 'pool',
      poolTokenUnit: 'poolpolicy' + 'poolname',
      carrierAddress: 'carrier',
      carrierPolicyId: 'carrierpolicy',
      carrierTokenNameHex: 'carriername',
      classId: 0,
      price: 1,
      observedAt: 123n,
      authoritativeInputs: {
        poolUsdmValue: 1n,
        preEEV: 1n,
        candidateEEV: 1n,
        requiredImmediateLiquidity: 1n,
        truthVerified: true,
        eevFresh: true,
        obligationsComplete: true,
        allOmegaSuccessorsCertified: true,
        decisionReference: 'decision-1',
      },
    }),
    /ambiguous/,
  )
})


test('fails closed when observation time is not authenticated', async () => {
  await assert.rejects(
    () => readPreprodIssueObservation({
      lucid: fakeLucid(),
      counterAddress: 'counter',
      b1PrizePoolAddress: 'pool',
      poolTokenUnit: 'poolpolicy' + 'poolname',
      carrierAddress: 'carrier',
      carrierPolicyId: 'carrierpolicy',
      carrierTokenNameHex: 'carriername',
      classId: 0,
      price: 1,
      authoritativeInputs: {
        poolUsdmValue: 1n,
        preEEV: 1n,
        candidateEEV: 1n,
        requiredImmediateLiquidity: 1n,
        truthVerified: true,
        eevFresh: true,
        obligationsComplete: true,
        allOmegaSuccessorsCertified: true,
        decisionReference: 'decision-1',
      },
    }),
    /observedAt is required/,
  )
})
