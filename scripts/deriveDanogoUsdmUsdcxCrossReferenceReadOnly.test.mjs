import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { deriveEvidence, derivePoolMarginalSpot, USDM_UNIT, USDCX_UNIT } from './deriveDanogoUsdmUsdcxCrossReferenceReadOnly.mjs'

const fixture = JSON.parse(await readFile(new URL('./fixtures/danogo-usdm-usdcx-mainnet-2026-10-31.json', import.meta.url), 'utf8'))

test('derives two exact USDM/USDCx observations from reconciled real on-chain fixtures', () => {
  const evidence = deriveEvidence(fixture)
  assert.equal(evidence.summary.structurallyMatchedDirectPools, 2)
  assert.equal(evidence.summary.minMarginalUsdcxPerUsdm, '0.99425159')
  assert.equal(evidence.summary.maxMarginalUsdcxPerUsdm, '0.99499497')
  assert.deepEqual(evidence.observations.map((x) => x.lpFeeRateBasisPoints), ['5', '10'])
  for (const observation of evidence.observations) {
    assert.ok([USDM_UNIT, USDCX_UNIT].includes(observation.tokenXUnit))
    assert.ok([USDM_UNIT, USDCX_UNIT].includes(observation.tokenYUnit))
    assert.equal(observation.priceMethod, 'PINNED_DANOGO_SDK_VIRTUAL_RESERVE_MARGINAL_RATIO')
    assert.equal(observation.priceLimit, 'PRE_LP_FEE_MARGINAL_SPOT; NOT_AN_EXECUTABLE_QUOTE')
  }
})

test('fails closed when network or exact Moneta identity is changed', () => {
  assert.throws(() => deriveEvidence({ ...fixture, network: 'cardano-preprod' }), /NETWORK_INVALID/)
  assert.throws(() => deriveEvidence({ ...fixture, exactAsset: { policyId: '00', assetNameHex: 'USDM' } }), /IDENTITY_INVALID/)
})

test('fails closed if a candidate pool script credential mismatches', () => {
  const pool = { ...fixture.pools[0], paymentCredentialMatchesPoolScript: false }
  assert.throws(() => derivePoolMarginalSpot(pool), /SCRIPT_CREDENTIAL_MISMATCH/)
})

test('fails closed if the pair is not the exact policy+asset identity', () => {
  const pool = structuredClone(fixture.pools[0])
  pool.datum.tokenY.unit = '00'.repeat(28) + '5553444378'
  assert.throws(() => derivePoolMarginalSpot(pool), /NOT_EXACT_USDM_USDCX_PAIR/)
})

test('fails closed for unresolved reward state', () => {
  const pool = { ...fixture.pools[0], rewardEpochBehind: true, rewardAmountRead: false }
  assert.throws(() => derivePoolMarginalSpot(pool), /REWARD_AMOUNT_UNRESOLVED/)
})
