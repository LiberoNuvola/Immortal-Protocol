import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(fileURLToPath(new URL('./treasury-liquidation-simulation.mjs', import.meta.url)));

function runScenario(overrides = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'immortal-liquidation-test-'));
  const env = {
    ...process.env,
    SCENARIO_ID: 'unit-test',
    ASSET_REF: 'policy.asset',
    ASSET_QUANTITY_ATOMIC: '1000000',
    ASSET_QUANTITY_SCALE: '1000000',
    ASSET_VALUE_REMOVED_USDM_ATOMIC: '10000000',
    GROSS_USDM_PROCEEDS_ATOMIC: '12000000',
    EXECUTION_COSTS_USDM_ATOMIC: '1000000',
    PRE_EEV_USDM_ATOMIC: '50000000',
    PROTECTED_CAPITAL_USDM_ATOMIC: '30000000',
    EVIDENCE_CLASS: 'USER_SUPPLIED_SCENARIO',
    ...overrides,
  };
  try {
    const proc = spawnSync(process.execPath, [script], { cwd, env, encoding: 'utf8' });
    let artifact = null;
    try {
      artifact = JSON.parse(readFileSync(join(cwd, 'treasury-liquidation-simulation.json'), 'utf8'));
    } catch {}
    return { ...proc, artifact };
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test('scenario passes only when net proceeds preserve the buffer', () => {
  const result = runScenario();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.artifact.verdict, 'SCENARIO_PASS');
  assert.equal(result.artifact.derived.netUsdmProceedsAtomic, '11000000');
  assert.equal(result.artifact.derived.bufferDeltaUsdmAtomic, '1000000');
  assert.equal(result.artifact.checks.bufferPreserved, true);
});

test('scenario fails when net proceeds erode the buffer', () => {
  const result = runScenario({ GROSS_USDM_PROCEEDS_ATOMIC: '9000000', EXECUTION_COSTS_USDM_ATOMIC: '1000000' });
  assert.equal(result.status, 1);
  assert.equal(result.artifact.verdict, 'SCENARIO_FAIL');
  assert.equal(result.artifact.checks.bufferPreserved, false);
});

test('scenario fails when post-sale buffer is negative', () => {
  const result = runScenario({
    ASSET_VALUE_REMOVED_USDM_ATOMIC: '25000000',
    GROSS_USDM_PROCEEDS_ATOMIC: '1000000',
    EXECUTION_COSTS_USDM_ATOMIC: '0',
    PRE_EEV_USDM_ATOMIC: '40000000',
    PROTECTED_CAPITAL_USDM_ATOMIC: '30000000',
  });
  assert.equal(result.status, 1);
  assert.equal(result.artifact.verdict, 'SCENARIO_FAIL');
  assert.equal(result.artifact.checks.postBufferNonNegative, false);
});

test('rejects missing inputs instead of guessing them', () => {
  const result = runScenario({ GROSS_USDM_PROCEEDS_ATOMIC: '' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /missing required scenario inputs/);
  assert.equal(result.artifact, null);
});

test('rejects costs greater than gross proceeds', () => {
  const result = runScenario({ GROSS_USDM_PROCEEDS_ATOMIC: '100', EXECUTION_COSTS_USDM_ATOMIC: '101' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /execution costs exceed gross proceeds/);
});
