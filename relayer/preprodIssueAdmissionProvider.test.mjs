import assert from 'node:assert/strict'
import { createPreprodIssueObservationProducerFromLucid } from './preprodIssueAdmissionProvider.js'

const deployment = {
  counterAddress: 'addr_test_counter',
  b1PrizePoolAddress: 'addr_test_pool',
  poolTokenUnit: 'poolunit',
  carrierAddress: 'addr_test_carrier',
  carrierPolicyId: 'carrierpolicy',
  carrierTokenNameHex: '43415252494552',
}

const fakeLucid = {
  utxosAt: async address => {
    if (address === deployment.counterAddress) {
      return [{ txHash: 'a'.repeat(64), outputIndex: 0 }]
    }
    if (address === deployment.b1PrizePoolAddress) {
      return [{
        txHash: 'b'.repeat(64),
        outputIndex: 1,
        assets: { [deployment.poolTokenUnit]: 1n },
        datum: { fields: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n] },
      }]
    }
    if (address === deployment.carrierAddress) {
      const classes = Array.from({ length: 8 }, (_, i) => ({
        fields: [BigInt(i), 0n, 0n, 0n, 10n, { index: i === 0 ? 1 : 0 }],
      }))
      return [{
        txHash: 'c'.repeat(64),
        outputIndex: 2,
        assets: { [deployment.carrierPolicyId + deployment.carrierTokenNameHex]: 1n },
        datum: {
          fields: [0n, {
            fields: [
              0n, 0n, 0n, 0n, 0n, 0n,
              classes,
              { fields: [0n, 0n] },
              { fields: [0n, 0n, { index: 0 }, 0n] },
            ],
          }],
        },
      }]
    }
    throw new Error('unexpected address ' + address)
  },
}

const producer = createPreprodIssueObservationProducerFromLucid({ lucid: fakeLucid, deployment })
const context = await producer({
  counterInputReference: 'a'.repeat(64) + '#0',
  poolInputReference: 'b'.repeat(64) + '#1',
  poolUsdmValue: 0,
  classId: 0,
  price: 1,
  observedAt: 1,
  authoritativeInputs: {
    poolUsdmValue: 0,
    preEEV: 0,
    candidateEEV: 0,
    requiredImmediateLiquidity: 0,
    truthVerified: true,
    eevFresh: true,
    obligationsComplete: true,
    allOmegaSuccessorsCertified: true,
    decisionReference: 'decision:1',
  },
})

assert.equal(context.decisionInput.classId, 0n)
assert.equal(context.decisionInput.availableExecutableLiquidity, 0n)
console.log('preprodIssueAdmissionProvider: PASS')
