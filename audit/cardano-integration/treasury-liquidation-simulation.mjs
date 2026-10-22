#!/usr/bin/env node
/**
 * Treasury liquidation scenario simulator.
 *
 * Scenario-only evidence. Inputs must be supplied from an explicit scenario;
 * this script does not fetch prices, infer liquidity, or certify a live swap.
 * All monetary values are integer USDM atomic units at the same declared scale.
 */
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const required = [
  'SCENARIO_ID',
  'ASSET_REF',
  'ASSET_QUANTITY_ATOMIC',
  'ASSET_QUANTITY_SCALE',
  'ASSET_VALUE_REMOVED_USDM_ATOMIC',
  'GROSS_USDM_PROCEEDS_ATOMIC',
  'EXECUTION_COSTS_USDM_ATOMIC',
  'PRE_EEV_USDM_ATOMIC',
  'PROTECTED_CAPITAL_USDM_ATOMIC',
  'EVIDENCE_CLASS',
];

const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error('INCONCLUSIVE: missing required scenario inputs:', missing.join(', '));
  process.exit(2);
}

const integer = (key) => {
  const raw = process.env[key];
  if (!/^(0|[1-9][0-9]*)$/.test(raw)) {
    throw new Error(key + ' must be a non-negative integer string');
  }
  return BigInt(raw);
};

const scenarioId = process.env.SCENARIO_ID.trim();
const assetRef = process.env.ASSET_REF.trim();
const evidenceClass = process.env.EVIDENCE_CLASS.trim();
if (!/^[A-Za-z0-9._:-]{1,128}$/.test(scenarioId)) throw new Error('SCENARIO_ID invalid');
if (!/^[A-Za-z0-9._:#/-]{1,256}$/.test(assetRef)) throw new Error('ASSET_REF invalid');
if (!['USER_SUPPLIED_SCENARIO', 'OBSERVED_EXECUTION'].includes(evidenceClass)) {
  throw new Error('EVIDENCE_CLASS must be USER_SUPPLIED_SCENARIO or OBSERVED_EXECUTION');
}

const quantityAtomic = integer('ASSET_QUANTITY_ATOMIC');
const quantityScale = integer('ASSET_QUANTITY_SCALE');
const assetValueRemoved = integer('ASSET_VALUE_REMOVED_USDM_ATOMIC');
const gross = integer('GROSS_USDM_PROCEEDS_ATOMIC');
const costs = integer('EXECUTION_COSTS_USDM_ATOMIC');
const preEEV = integer('PRE_EEV_USDM_ATOMIC');
const protectedCapital = integer('PROTECTED_CAPITAL_USDM_ATOMIC');

if (quantityAtomic === 0n || quantityScale === 0n) throw new Error('quantity and quantity scale must be > 0');
if (costs > gross) throw new Error('execution costs exceed gross proceeds');
if (assetValueRemoved > preEEV) throw new Error('asset value removed exceeds pre-sale EEV');

const net = gross - costs;
const preBuffer = preEEV - protectedCapital;
const postEEV = preEEV - assetValueRemoved + net;
const postBuffer = postEEV - protectedCapital;
const bufferDelta = postBuffer - preBuffer;
const netCoversRemovedValue = net >= assetValueRemoved;
const preservesBuffer = postBuffer >= preBuffer;
const nonNegativePostBuffer = postBuffer >= 0n;

const result = {
  schema: 'IMMORTAL_TREASURY_LIQUIDATION_SIMULATION_V1',
  scenarioId,
  asset: { ref: assetRef, quantityAtomic: quantityAtomic.toString(), quantityScale: quantityScale.toString() },
  evidenceClass,
  monetaryUnit: 'USDM atomic units; all monetary inputs must use the same precision',
  inputs: {
    assetValueRemovedUsdmAtomic: assetValueRemoved.toString(),
    grossUsdmProceedsAtomic: gross.toString(),
    executionCostsUsdmAtomic: costs.toString(),
    preEevUsdmAtomic: preEEV.toString(),
    protectedCapitalUsdmAtomic: protectedCapital.toString(),
  },
  derived: {
    netUsdmProceedsAtomic: net.toString(),
    preBufferUsdmAtomic: preBuffer.toString(),
    postEevUsdmAtomic: postEEV.toString(),
    postBufferUsdmAtomic: postBuffer.toString(),
    bufferDeltaUsdmAtomic: bufferDelta.toString(),
  },
  checks: {
    netProceedsCoverRemovedAssetValue: netCoversRemovedValue,
    bufferPreserved: preservesBuffer,
    postBufferNonNegative: nonNegativePostBuffer,
  },
  verdict: preservesBuffer && nonNegativePostBuffer ? 'SCENARIO_PASS' : 'SCENARIO_FAIL',
  limitations: [
    'This is arithmetic over supplied inputs, not a DEX/AMM execution.',
    'OBSERVED_EXECUTION is a label only; external evidence must independently substantiate it.',
    'Does not prove Treasury ownership, route availability, execution authenticity, or QNE across all states and outcomes.',
    'Does not model future obligations or environment transitions unless already reflected in supplied EEV and ProtectedCapital.',
  ],
};

const canonical = JSON.stringify(result);
result.evidenceDigestSha256 = createHash('sha256').update(canonical).digest('hex');
writeFileSync('treasury-liquidation-simulation.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.verdict !== 'SCENARIO_PASS') process.exitCode = 1;
