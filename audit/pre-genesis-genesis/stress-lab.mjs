#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const GENESIS_THRESHOLD_USDM = 4000n;
const GENESIS_TICKET_PRICE_USDM = 1n;
const CANONICAL_TREASURY = 'treasury:pre-rich:v1';
const CANONICAL_PRE_POLICY = 'pre-policy:v1';
const CANONICAL_PRE_ASSET = 'PRE-RICH';
const CANONICAL_ORACLE_PUBLISHER = 'publisher:canonical:v1';

function observe(input) {
  const verifiedValue = input.valuationVerified && input.fresh
    ? BigInt(input.preAmount) * BigInt(input.prePriceUsdm)
    : null;
  return Object.freeze({
    observationId: input.observationId, treasury: input.treasury,
    prePolicyId: input.prePolicyId, preAssetName: input.preAssetName, oraclePublisher: input.oraclePublisher,
    preAmount: BigInt(input.preAmount), prePriceUsdm: BigInt(input.prePriceUsdm),
    verifiedValueUsdm: verifiedValue, valuationVerified: input.valuationVerified,
    fresh: input.fresh, prizePoolLiquidityUsdm: BigInt(input.prizePoolLiquidityUsdm),
    bootstrapUsdm: BigInt(input.bootstrapUsdm)
  });
}

function genesisCandidate(state, observation) {
  return state.regime === 'PRE-GENESIS' &&
    observation.treasury === CANONICAL_TREASURY &&
    observation.prePolicyId === CANONICAL_PRE_POLICY &&
    observation.preAssetName === CANONICAL_PRE_ASSET &&
    observation.oraclePublisher === CANONICAL_ORACLE_PUBLISHER &&
    observation.verifiedValueUsdm !== null &&
    observation.verifiedValueUsdm >= GENESIS_THRESHOLD_USDM;
}

function transition(state, observation) {
  assert.equal(observation.treasury, CANONICAL_TREASURY, 'wrong Treasury');
  assert.equal(observation.prePolicyId, CANONICAL_PRE_POLICY, 'wrong PRE policy');
  assert.equal(observation.preAssetName, CANONICAL_PRE_ASSET, 'wrong PRE asset');
  assert.equal(observation.oraclePublisher, CANONICAL_ORACLE_PUBLISHER, 'wrong Oracle publisher');
  assert.equal(state.regime, 'PRE-GENESIS', 'Genesis already consumed or wrong source regime');
  assert.equal(observation.valuationVerified, true, 'valuation not verified');
  assert.equal(observation.fresh, true, 'valuation observation is stale');
  assert.ok(observation.verifiedValueUsdm !== null, 'missing verified value');
  assert.ok(observation.verifiedValueUsdm >= GENESIS_THRESHOLD_USDM, 'Genesis threshold not reached');
  return Object.freeze({
    ...state, regime: 'GENESIS', genesisTicketPriceUsdm: GENESIS_TICKET_PRICE_USDM,
    genesisObservationId: observation.observationId,
    genesisVerifiedTreasuryValueUsdm: observation.verifiedValueUsdm,
    prizePoolLiquidityUsdm: state.prizePoolLiquidityUsdm
  });
}

function runScenario(name, inputs, expected) {
  let state = Object.freeze({
    regime: 'PRE-GENESIS', genesisTicketPriceUsdm: null, genesisObservationId: null,
    genesisVerifiedTreasuryValueUsdm: null, prizePoolLiquidityUsdm: BigInt(inputs[0].prizePoolLiquidityUsdm)
  });
  const trace = [];
  let candidate = null;
  for (const input of inputs) {
    const observation = observe(input);
    const isCandidate = genesisCandidate(state, observation);
    const row = {
      step: trace.length, observationId: observation.observationId, regimeBefore: state.regime,
      preAmount: observation.preAmount.toString(), prePriceUsdm: observation.prePriceUsdm.toString(),
      verifiedValueUsdm: observation.verifiedValueUsdm === null ? null : observation.verifiedValueUsdm.toString(),
      valuationVerified: observation.valuationVerified, fresh: observation.fresh, treasury: observation.treasury,
      genesisCandidate: isCandidate, prePolicyId: observation.prePolicyId, preAssetName: observation.preAssetName, oraclePublisher: observation.oraclePublisher,
      prizePoolLiquidityBefore: state.prizePoolLiquidityUsdm.toString()
    };
    trace.push(row);
    if (isCandidate && candidate === null) candidate = { observationId: observation.observationId, observedValueUsdm: observation.verifiedValueUsdm.toString() };
    if (input.submit === true) {
      try { state = transition(state, observation); row.transition = 'COMMITTED'; }
      catch (error) { row.transition = 'REJECTED'; row.reason = error.message; }
    }
  }
  assert.equal(state.regime, expected.finalRegime, name);
  assert.equal(state.prizePoolLiquidityUsdm, BigInt(inputs[0].prizePoolLiquidityUsdm), name + ': bootstrap must not become PrizePool liquidity');
  if (expected.genesisObservationId !== undefined) assert.equal(state.genesisObservationId, expected.genesisObservationId, name);
  return { name, candidate, finalState: state, trace };
}

const base = (observationId, preAmount, prePriceUsdm, overrides = {}) => ({
  observationId, preAmount, prePriceUsdm, valuationVerified: true, fresh: true,
  treasury: CANONICAL_TREASURY, prePolicyId: CANONICAL_PRE_POLICY, preAssetName: CANONICAL_PRE_ASSET, oraclePublisher: CANONICAL_ORACLE_PUBLISHER,
  prizePoolLiquidityUsdm: 0, bootstrapUsdm: preAmount * prePriceUsdm,
  submit: false, ...overrides
});

const scenarios = [
  runScenario('A-below-threshold', [base('A0', 1000, 3, { submit: true })], { finalRegime: 'PRE-GENESIS' }),
  runScenario('B-exact-threshold', [base('B0', 1000, 4, { submit: true })], { finalRegime: 'GENESIS', genesisObservationId: 'B0' }),
  runScenario('C-dump-before-submit-rejects-stale-candidate', [base('C0', 1000, 4), base('C1', 1000, 3, { submit: true })], { finalRegime: 'PRE-GENESIS' }),
  runScenario('D-threshold-cross-then-post-genesis-dump', [base('D0', 1000, 4, { submit: true }), base('D1', 1000, 2)], { finalRegime: 'GENESIS', genesisObservationId: 'D0' }),
  runScenario('E-stale-crossing-rejected', [base('E0', 1000, 4, { fresh: false, submit: true })], { finalRegime: 'PRE-GENESIS' }),
  runScenario('F-wrong-treasury-rejected', [base('F0', 1000, 5, { treasury: 'treasury:attacker', submit: true })], { finalRegime: 'PRE-GENESIS' }),
  runScenario('H-wrong-pre-asset-rejected', [base('H0', 1000, 4, { preAssetName: 'ATTACKER', submit: true })], { finalRegime: 'PRE-GENESIS' }),
  runScenario('I-forged-oracle-publisher-rejected', [base('I0', 1000, 4, { oraclePublisher: 'publisher:attacker:v1', submit: true })], { finalRegime: 'PRE-GENESIS' }),
  runScenario('J-wrong-pre-policy-rejected', [base('J0', 1000, 4, { prePolicyId: 'pre-policy:attacker:v1', submit: true })], { finalRegime: 'PRE-GENESIS' }),
  runScenario('G-duplicate-transition-rejected', [base('G0', 1000, 4, { submit: true }), base('G1', 1000, 5, { submit: true })], { finalRegime: 'GENESIS', genesisObservationId: 'G0' })
];

const output = {
  schema: 'pre-genesis-genesis-stress-v0.1', status: 'PASS',
  normativeParametersUsed: { genesisThresholdUsdm: GENESIS_THRESHOLD_USDM.toString(), genesisTicketPriceUsdm: GENESIS_TICKET_PRICE_USDM.toString() },
  note: 'Scenario valuation is instrumentation only. The added asset/publisher checks mirror the authenticated observation fields required by the current carrier; they do not prove ledger-level authority of the reference inputs. Real deployment must supply the verified Treasury valuation path; this harness does not define an oracle or a stability window.',
  scenarios
};

const outDir = path.resolve('audit/pre-genesis-genesis/evidence');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'stress-lab-result.json');
fs.writeFileSync(outFile, JSON.stringify(output, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS', scenarios: scenarios.length, evidence: outFile }, null, 2));