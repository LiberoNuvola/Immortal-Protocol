import assert from 'node:assert/strict'
import test from 'node:test'
import { buildC1ProducerCrosswalk } from './preprod-c1-producer-crosswalk.mjs'

function source(path, value) {
  return { status: 'PRESENT', path, sha256: 'a'.repeat(64), value }
}

test('reports the existing producers without synthesizing a common deployment generation', () => {
  const report = buildC1ProducerCrosswalk({
    directUsdm: source('direct.json', {
      schema: 'IMMORTAL-PREPROD-DIRECT-USDM-DEPLOYMENT-v0.1',
      network: 'cardano-preprod',
      bootstrap: { txHash: 'b'.repeat(64) },
      topology: {
        counterHash: '1'.repeat(56),
        counterAddress: 'addr_test_counter',
        prizeHash: '2'.repeat(56),
        prizeAddress: 'addr_test_prize',
        b1PrizePoolHash: '3'.repeat(56),
        b1PrizePoolAddress: 'addr_test_pool',
      },
      assets: { poolTokenPolicyId: '4'.repeat(56), poolTokenNameHex: '504f4f4c' },
      utxos: { pool: 'c'.repeat(64) + '#0' },
    }),
    v3Carrier: source('v3.json', {
      deployment: 'V3-ECONOMIC-STATE-CARRIER-PREPROD-001',
      network: 'Preprod',
      policyId: '5'.repeat(56),
      carrierTokenNameHex: '01',
      carrierScriptAddress: 'addr_test_v3',
      deploymentTransactionRef: 'cardano:tx/' + 'd'.repeat(64),
      carrierStateReference: 'cardano:tx/' + 'e'.repeat(64) + '#0',
    }),
    b2Control: source('b2.json', {
      deployment: 'PRE-RICH-B2-CONTROL-PREPROD-001',
      network: 'Preprod',
      policyId: '6'.repeat(56),
      controlTokenNameHex: '02',
      controlScriptAddress: 'addr_test_b2',
      deploymentTransactionRef: 'cardano:tx/' + 'f'.repeat(64),
      controlStateReference: 'cardano:tx/' + '1'.repeat(64) + '#0',
    }),
  })

  assert.equal(report.schema, 'IMMORTAL-PREPROD-C1-PRODUCER-CROSSWALK-REPORT-v0.1')
  assert.equal(report.mode, 'READ_ONLY_PROVENANCE_GAP_REPORT')
  assert.equal(report.components.counter.fields.address.status, 'PRESENT_IN_SOURCE')
  assert.equal(report.components.counter.fields.deploymentTxOutRef.status, 'MISSING_FROM_SOURCE')
  assert.equal(report.sharedGenerationAvailable, false)
  assert.equal(report.c1QueryableEnvelopeEmitted, false)
  assert.equal(report.deploymentAuthorityVerified, false)
  assert.equal(report.c1Qualified, false)
  assert.ok(report.blockers.includes('NO_COMMON_AUTHORIZED_DEPLOYMENT_GENERATION_IN_SOURCE_PRODUCERS'))
})

test('does not classify Counter singleton identity as missing', () => {
  const report = buildC1ProducerCrosswalk({
    directUsdm: source('direct.json', { topology: { counterHash: 'a'.repeat(56), counterAddress: 'addr_test_counter' } }),
    v3Carrier: { status: 'MISSING', path: 'v3.json', sha256: null, value: null },
    b2Control: { status: 'MISSING', path: 'b2.json', sha256: null, value: null },
  })
  assert.equal(report.components.counter.fields.singletonPolicyId.status, 'NOT_APPLICABLE_BY_C1_CONTRACT')
  assert.equal(report.c1QueryableEnvelopeEmitted, false)
})
