import { strict as assert } from 'node:assert'
import {
  admitGenesisTreasury,
  GENESIS_PRE_TREASURY_THRESHOLD_USDM_SUBUNITS,
  type GenesisTreasuryObservation,
} from './GenesisTreasuryAdmission.ts'

const TREASURY = 'treasury:pre-rich:v1'
const POLICY = '1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c'
const NAME = '5052452d52494348'

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
    oraclePublisher: 'publisher',
    oracleTimestamp: 100n,
    observedAt: 100n,
    sourceStateHash: 'state-hash',
    valuationVerified: true,
    oracleFresh: true,
    ...overrides,
  }
}

assert.equal(
  admitGenesisTreasury(observation({ preQuantity: 3_999n }), TREASURY, POLICY, NAME).reason,
  'BELOW_THRESHOLD',
)
assert.equal(
  admitGenesisTreasury(observation(), TREASURY, POLICY, NAME).admitted,
  true,
)
assert.equal(
  admitGenesisTreasury(
    observation({ preQuantity: GENESIS_PRE_TREASURY_THRESHOLD_USDM_SUBUNITS / 100n + 1n }),
    TREASURY, POLICY, NAME,
  ).admitted,
  true,
)
assert.equal(
  admitGenesisTreasury(observation({ oracleFresh: false }), TREASURY, POLICY, NAME).reason,
  'ORACLE_STALE',
)
assert.equal(
  admitGenesisTreasury(observation({ valuationVerified: false }), TREASURY, POLICY, NAME).reason,
  'ORACLE_UNVERIFIED',
)
assert.equal(
  admitGenesisTreasury(observation({ treasuryIdentity: 'wrong' }), TREASURY, POLICY, NAME).reason,
  'WRONG_TREASURY',
)
assert.equal(
  admitGenesisTreasury(observation({ sourceRegime: 'GENESIS' }), TREASURY, POLICY, NAME).reason,
  'WRONG_SOURCE_REGIME',
)
assert.equal(
  admitGenesisTreasury(observation({ prePolicyId: 'wrong' }), TREASURY, POLICY, NAME).reason,
  'INVALID_ASSET',
)
assert.equal(
  admitGenesisTreasury(
    observation({ preQuantity: 399_999n, verifiedPreUsdmPrice: 1_000_001n, oraclePrecision: 1_000_000n }),
    TREASURY, POLICY, NAME,
  ).admitted,
  true,
)
assert.equal(
  admitGenesisTreasury(observation({ oraclePrecision: 0n }), TREASURY, POLICY, NAME).reason,
  'ORACLE_UNVERIFIED',
)
