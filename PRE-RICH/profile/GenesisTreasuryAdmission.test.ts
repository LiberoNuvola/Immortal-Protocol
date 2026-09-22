import { strict as assert } from 'node:assert'
import {
  admitGenesisTreasury,
  GENESIS_PRE_TREASURY_THRESHOLD_USDM_SUBUNITS,
  type GenesisTreasuryObservation,
} from './GenesisTreasuryAdmission.ts'

const TREASURY = 'treasury:pre-rich:v1'
const POLICY = '1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c'
const NAME = '5052452d52494348'
const PUBLISHER = 'publisher'

function observation(overrides: Partial<GenesisTreasuryObservation> = {}): GenesisTreasuryObservation {
  return {
    sourceRegime: 'PRE-GENESIS',
    treasuryIdentity: TREASURY,
    treasuryStateReference: 'tx0#0',
    prePolicyId: POLICY,
    preAssetNameHex: NAME,
    preQuantity: 4_000n,
    verifiedPreUsdmPrice: 100n,
    oraclePrecision: 1n,
    oracleStateReference: 'oracle#0',
    oraclePublisher: PUBLISHER,
    oracleTimestamp: 100n,
    observedAt: 100n,
    sourceStateHash: 'state-hash',
    valuationVerified: true,
    oracleFresh: true,
    ...overrides,
  }
}

const admit = (o: GenesisTreasuryObservation) =>
  admitGenesisTreasury(o, TREASURY, POLICY, NAME, PUBLISHER)

assert.equal(
  admit(observation({ preQuantity: 3_999n })).reason,
  'BELOW_THRESHOLD',
)
assert.equal(
  admit(observation()).admitted,
  true,
)
assert.equal(
  admit(observation({ preQuantity: GENESIS_PRE_TREASURY_THRESHOLD_USDM_SUBUNITS / 100n + 1n })).admitted,
  true,
)
assert.equal(
  admit(observation({ oracleFresh: false })).reason,
  'ORACLE_STALE',
)
assert.equal(
  admit(observation({ valuationVerified: false })).reason,
  'ORACLE_UNVERIFIED',
)
assert.equal(
  admit(observation({ oraclePublisher: 'wrong' })).reason,
  'WRONG_ORACLE_PUBLISHER',
)
assert.equal(
  admit(observation({ treasuryIdentity: 'wrong' })).reason,
  'WRONG_TREASURY',
)
assert.equal(
  admit(observation({ sourceRegime: 'GENESIS' })).reason,
  'WRONG_SOURCE_REGIME',
)
assert.equal(
  admit(observation({ prePolicyId: 'wrong' })).reason,
  'INVALID_ASSET',
)
assert.equal(
  admit(
    observation({ preQuantity: 399_999n, verifiedPreUsdmPrice: 1_000_001n, oraclePrecision: 1_000_000n }),
  ).admitted,
  true,
)
assert.equal(
  admit(observation({ oraclePrecision: 0n })).reason,
  'ORACLE_UNVERIFIED',
)
