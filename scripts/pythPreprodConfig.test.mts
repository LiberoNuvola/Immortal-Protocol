import assert from 'node:assert/strict'
import {
  PYTH_PRO_PREPROD_POLICY_ID,
  validatePythPreprodPolicyId,
} from './pythPreprodConfig.mts'

assert.equal(
  validatePythPreprodPolicyId(PYTH_PRO_PREPROD_POLICY_ID),
  PYTH_PRO_PREPROD_POLICY_ID,
)
assert.equal(
  validatePythPreprodPolicyId('0x' + PYTH_PRO_PREPROD_POLICY_ID.toUpperCase()),
  PYTH_PRO_PREPROD_POLICY_ID,
)
assert.throws(
  () => validatePythPreprodPolicyId('a'.repeat(56)),
  /does not match the published Pyth Pro Cardano Preprod deployment/,
)
assert.throws(
  () => validatePythPreprodPolicyId('short'),
  /exactly 56 hexadecimal characters/,
)

console.log('Pyth Preprod deployment identity guards: PASS')
