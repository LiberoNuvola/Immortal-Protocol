#!/usr/bin/env node

import fs from 'node:fs'

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const read = (path) => fs.readFileSync(path, 'utf8')

const types = read('plutus/Types.hs')
const validator = read('plutus/BeaconRegistry.hs')
const datumBuilder = read('src/registryDatum.ts')
const flow = read('src/registryFlow.ts')

const datumStart = types.indexOf('data BeaconRegistryDatum =')
const datumEnd = types.indexOf('PlutusTx.unstableMakeIsData \'\'BeaconRegistryDatum')
assert(datumStart >= 0 && datumEnd > datumStart, 'BeaconRegistryDatum declaration is locatable')

const datumBlock = types.slice(datumStart, datumEnd)
const datumFields = [...datumBlock.matchAll(/^\s*[{,]\s*(br[A-Z][A-Za-z0-9_]*)\s+::/gm)].map((m) => m[1])

assert(datumFields.length === 7, 'current canonical BeaconRegistryDatum remains the known seven-field schema')
assert(!datumBlock.includes('brGameRoundCommitment'), 'GameRoundCommitment is not silently represented as an on-chain registry datum field')

const validatorCommitmentRefs = /brGameRoundCommitment|grcGameId|grcRound|grcConfigHash|grcProtocolVersion|grcCommitmentHash/.test(validator)
assert(!validatorCommitmentRefs, 'BeaconRegistry validator does not claim to authenticate GameRoundCommitment')

const tsFieldBlock = datumBuilder.slice(
  datumBuilder.indexOf('export type BeaconRegistryFields ='),
  datumBuilder.indexOf('export function buildBeaconRegistryDatumConstr'),
)
assert(!tsFieldBlock.includes('brGameRoundCommitment'), 'canonical TypeScript registry datum fields do not fabricate a commitment field')

assert(
  /not authenticated by the current on-chain registry datum/i.test(flow) &&
  /off-chain consistency check only/i.test(flow),
  'registry publish flow explicitly distinguishes off-chain commitment consistency from on-chain authentication',
)

console.log('ALL BEACON REGISTRY COMMITMENT GAP GUARDS PASSED')
