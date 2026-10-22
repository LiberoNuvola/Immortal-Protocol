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


const fullPoolUtxo = {
  txHash: 'b'.repeat(64),
  outputIndex: 1,
  assets: {
    [deployment.poolTokenUnit]: 1n,
    [deployment.directUsdmUnit]: 1_000_000_000n,
  },
  datum: { fields: Array.from({ length: 8 }, () => 0n) },
}
const fullCounterUtxo = {
  txHash: 'a'.repeat(64),
  outputIndex: 0,
  assets: {},
}
const classData = Array.from({ length: 8 }, (_, classId) => ({
  fields: [BigInt(classId), 0n, 0n, 0n, 100n, { index: 1 }],
}))
const fullCarrierUtxo = {
  txHash: 'c'.repeat(64),
  outputIndex: 2,
  assets: {
    [deployment.carrierPolicyId + deployment.carrierTokenNameHex]: 1n,
  },
  datum: {
    fields: [
      0n,
      {
        fields: [
          0n, 0n, 0n, 0n, 0n, 0n,
          classData,
          { fields: [0n, 0n] },
          { fields: [0n, 0n, { index: 0 }, 0n] },
        ],
      },
    ],
  },
}
const fullControlUtxo = {
  txHash: 'd'.repeat(64),
  outputIndex: 3,
  assets: {
    [deployment.controlPolicyId + deployment.controlTokenNameHex]: 1n,
  },
  datum: {
    fields: [
      0n, 0n, 0n, 0n,
      deployment.controlPolicyId,
      deployment.controlTokenNameHex,
    ],
  },
}
const fullFixtureLucid = {
  utxosAt: async address => {
    if (address === deployment.b1PrizePoolAddress) return [fullPoolUtxo]
    if (address === deployment.counterAddress) return [fullCounterUtxo]
    if (address === deployment.carrierAddress) return [fullCarrierUtxo]
    if (address === deployment.controlAddress) return [fullControlUtxo]
    return []
  },
}

async function assertRejectedEevQualification(eevQualification, expectedError, omit = false) {
  const producerWithAuthority = createPreprodIssueObservationProducerFromLucid({
    lucid: fullFixtureLucid,
    deployment,
    authoritySource: async ({ observedAt }) => ({
      poolUsdmValue: 100_000n,
      preEEV: 100_000n,
      candidateEEV: 100_000n,
      requiredImmediateLiquidity: 0n,
      truthVerified: true,
      eevFresh: true,
      obligationsComplete: true,
      allOmegaSuccessorsCertified: true,
      decisionReference: 'bounded-test-decision',
      observedAt,
      protectedCapitalProvenance: { source: 'bounded-test-fixture' },
      viabilityCertificate: {},
      ...(omit ? {} : { eevQualification }),
    }),
  })

  await assert.rejects(
    () => producerWithAuthority({
      counterInputReference: 'a'.repeat(64) + '#0',
      poolInputReference: 'b'.repeat(64) + '#1',
      controlStateReference: 'd'.repeat(64) + '#3',
      classId: 0,
      price: 1,
      observedAt: 1,
    }),
    expectedError,
  )
}

await assertRejectedEevQualification(
  undefined,
  /authoritative Issue EEV qualification is required/,
  true,
)
await assertRejectedEevQualification(
  { status: 'pending', deploymentApproval: { status: 'DEPLOYMENT_APPROVED', profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1' } },
  /authoritative Issue EEV qualification must be qualified/,
)
await assertRejectedEevQualification(
  { status: 'qualified' },
  /authoritative Issue EEV deployment approval is required/,
)
await assertRejectedEevQualification(
  { status: 'qualified', deploymentApproval: { status: 'PENDING', profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1' } },
  /authoritative Issue EEV deployment approval must be DEPLOYMENT_APPROVED/,
)
await assertRejectedEevQualification(
  { status: 'qualified', deploymentApproval: { status: 'DEPLOYMENT_APPROVED', profileVersion: 'OTHER-PROFILE' } },
  /authoritative Issue EEV profile does not match direct-USDM V1/,
)

console.log('preprodIssueAdmissionProvider: caller-supplied authority rejected')
