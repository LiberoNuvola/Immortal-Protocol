import assert from 'node:assert/strict'
import { createPreprodIssueObservationProducerFromLucid } from './preprodIssueAdmissionProvider.js'

const deployment = {
  counterAddress: 'addr_test_counter',
  b1PrizePoolAddress: 'addr_test_pool',
  poolTokenUnit: 'p'.repeat(56),
  directUsdmUnit: 'u'.repeat(56),
  carrierAddress: 'addr_test_carrier',
  carrierPolicyId: 'carrierpolicy',
  carrierTokenNameHex: '43415252494552',
  controlAddress: 'addr_test_control',
  controlPolicyId: 'ab'.repeat(28),
  controlTokenNameHex: '434f4e54524f4c',
}

const fakeLucid = {
  utxosAt: async address => {
    if (address === deployment.b1PrizePoolAddress) {
      return [{
        txHash: 'b'.repeat(64),
        outputIndex: 1,
        assets: {
          [deployment.poolTokenUnit]: 1n,
          [deployment.directUsdmUnit]: 1_000_000_000n,
        },
        datum: { fields: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n] },
      }]
    }
    return []
  },
}

const producer = createPreprodIssueObservationProducerFromLucid({
  lucid: fakeLucid,
  deployment,
})

await assert.rejects(
  () => producer({
    counterInputReference: 'a'.repeat(64) + '#0',
    poolInputReference: 'b'.repeat(64) + '#1',
    controlStateReference: 'e'.repeat(64) + '#3',
    classId: 0,
    price: 1,
    observedAt: 1,
    // Deliberately attacker-controlled: production provider must not accept this.
    authoritativeInputs: {
      poolUsdmValue: 100_000,
      preEEV: 100_000,
      candidateEEV: 100_000,
      requiredImmediateLiquidity: 0,
      truthVerified: true,
      eevFresh: true,
      obligationsComplete: true,
      allOmegaSuccessorsCertified: true,
      decisionReference: 'forged-decision',
      protectedCapitalProvenance: {},
      eevQualification: {
        status: 'qualified',
        deploymentApproval: {
          status: 'DEPLOYMENT_APPROVED',
          profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
        },
      },
      viabilityCertificate: {},
    },
  }),
  /authenticated issue authority source is required; caller-supplied authoritativeInputs are not trusted/,
)

console.log('preprodIssueAdmissionProvider: caller-supplied authority rejected')
