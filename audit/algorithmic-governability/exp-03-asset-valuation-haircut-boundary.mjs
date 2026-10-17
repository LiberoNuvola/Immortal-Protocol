#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const isRecord = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
   Object.getPrototypeOf(value) === null)

const readOwnData = (record, key) => {
  if (!isRecord(record)) return undefined
  const descriptor = Object.getOwnPropertyDescriptor(record, key)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value
    : undefined
}

const nonBlankString = (value) => typeof value === 'string' && value.trim().length > 0

const admit = (asset) => {
  if (!isRecord(asset)) return 'UNVERIFIABLE'
  const assetIdentity = readOwnData(asset, 'assetIdentity')
  const valuationEvidence = readOwnData(asset, 'valuationEvidence')
  const haircutPolicyRequired = readOwnData(asset, 'haircutPolicyRequired')
  const haircutPolicy = readOwnData(asset, 'haircutPolicy')
  if (!nonBlankString(assetIdentity) || !isRecord(valuationEvidence)) return 'UNVERIFIABLE'
  const source = readOwnData(valuationEvidence, 'source')
  const version = readOwnData(valuationEvidence, 'version')
  if (!nonBlankString(source) || !nonBlankString(version)) return 'UNVERIFIABLE'

  let haircutPolicyId = null
  if (haircutPolicyRequired === true) {
    haircutPolicyId = readOwnData(haircutPolicy, 'id')
    if (!nonBlankString(haircutPolicyId)) return 'UNVERIFIABLE'
  } else if (haircutPolicy !== undefined && haircutPolicy !== null) {
    haircutPolicyId = readOwnData(haircutPolicy, 'id')
    if (haircutPolicyId !== undefined && haircutPolicyId !== null &&
        !nonBlankString(haircutPolicyId)) return 'UNVERIFIABLE'
  }

  return Object.freeze({
    assetIdentity,
    valuationSource: source,
    valuationVersion: version,
    haircutPolicyId,
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
let valuationGetterCalls = 0
const accessorAsset = {
  assetIdentity: 'asset-v1',
  valuationEvidence: { source: 'source-a', version: 'v1' },
  haircutPolicyRequired: false,
}
Object.defineProperty(accessorAsset, 'assetIdentity', {
  get() { valuationGetterCalls += 1; return 'asset-v1' },
})
assert(
  admit(accessorAsset) === 'UNVERIFIABLE' && valuationGetterCalls === 0,
  'accessor-backed asset identity fails closed without executing getters',
)
assert(
  admit({ assetIdentity: 'asset-v1', valuationEvidence: Object.create({ source: 'source-a', version: 'v1' }) }) === 'UNVERIFIABLE',
  'inherited valuation provenance cannot be accepted',
)
assert(
  admit({ assetIdentity: 'asset-v1', valuationEvidence: { source: 'source-a', version: 'v1' }, haircutPolicyRequired: true, haircutPolicy: { id: '   ' } }) === 'UNVERIFIABLE',
  'blank required haircut policy identity fails closed',
)

assert(eligible.liquid === false, 'valuation evidence does not imply liquidity')
assert(eligible.protected === false, 'valuation evidence does not imply ProtectedCapital treatment')

console.log('ALL EXP-03 ASSET VALUATION/HAIRCUT BOUNDARY CHECKS PASSED')
