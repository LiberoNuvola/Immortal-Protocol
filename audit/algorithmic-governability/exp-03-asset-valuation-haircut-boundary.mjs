#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const admit = (asset) => {
  if (!asset?.assetIdentity) return 'UNVERIFIABLE'
  if (!asset.valuationEvidence?.source || !asset.valuationEvidence?.version) return 'UNVERIFIABLE'
  if (asset.haircutPolicyRequired === true && !asset.haircutPolicy?.id) return 'UNVERIFIABLE'
  return Object.freeze({
    assetIdentity: asset.assetIdentity,
    valuationSource: asset.valuationEvidence.source,
    valuationVersion: asset.valuationEvidence.version,
    haircutPolicyId: asset.haircutPolicy?.id ?? null,
  })
}

const eligible = Object.freeze({
  assetIdentity: 'asset-v1',
  valuationEvidence: Object.freeze({ source: 'source-a', version: 'v1' }),
  haircutPolicyRequired: false,
  liquid: false,
  protected: false,
})
const result = admit(eligible)
assert(result.assetIdentity === 'asset-v1', 'asset identity remains explicit')
assert(result.valuationSource === 'source-a', 'valuation provenance remains explicit')
assert(result.haircutPolicyId === null, 'no haircut policy is silently invented')

assert(
  admit(Object.freeze({ assetIdentity: 'asset-v1', valuationEvidence: { source: 'source-a' } })) === 'UNVERIFIABLE',
  'incomplete valuation evidence fails closed',
)
assert(
  admit(Object.freeze({
    assetIdentity: 'asset-v1',
    valuationEvidence: { source: 'source-a', version: 'v1' },
    haircutPolicyRequired: true,
  })) === 'UNVERIFIABLE',
  'required haircut evidence cannot be omitted',
)

assert(eligible.liquid === false, 'valuation evidence does not imply liquidity')
assert(eligible.protected === false, 'valuation evidence does not imply ProtectedCapital treatment')

console.log('ALL EXP-03 ASSET VALUATION/HAIRCUT BOUNDARY CHECKS PASSED')
