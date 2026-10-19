#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { buildEvidenceManifest, EXPECTED_CHECKS, SOURCE_PATHS } from './build-workflow-c-mechanical-evidence.mjs';

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), 'workflow-c-evidence-'));
  const directory = resolve(root, 'workflow-c-evidence');
  mkdirSync(directory, { recursive: true });
  for (const source of SOURCE_PATHS) {
    const path = resolve(root, source);
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, 'source:' + source + '\n', 'utf8');
  }
  for (const check of EXPECTED_CHECKS) {
    writeFileSync(resolve(directory, check.outputFile), 'raw output for ' + check.id + '\n', 'utf8');
    writeFileSync(resolve(directory, check.exitStatusFile), '0\n', 'utf8');
  }
  return { root, directory };
}
const metadata = {
  repository: 'LiberoNuvola/Immortal-Protocol',
  ref: 'refs/heads/release/public-main-curated-2026-09-24',
  commitSha: 'a'.repeat(40), workflow: 'C6 R1 finite certificate checker', event: 'push',
  runId: '123456789', runAttempt: '1', jobStatusAtAssembly: 'success',
};

test('binds exact run metadata, command status, output hashes and source hashes', () => {
  const f = fixture();
  try {
    const manifest = buildEvidenceManifest({ ...f, metadata, runtime: { node: 'v22.test', platform: 'linux', architecture: 'x64' } });
    assert.equal(manifest.schema, 'workflow-c-mechanical-evidence-v1');
    assert.equal(manifest.classification, 'MECHANICAL_EVIDENCE_ONLY_NOT_PROFILE_CERTIFICATION');
    assert.equal(manifest.ref, metadata.ref);
    assert.equal(manifest.commitSha, metadata.commitSha);
    assert.equal(manifest.runUrl, 'https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/123456789');
    assert.equal(manifest.jobStatusAtAssembly, 'success');
    assert.deepEqual(manifest.runtime, { node: 'v22.test', platform: 'linux', architecture: 'x64' });
    assert.equal(manifest.checks.length, EXPECTED_CHECKS.length);
    assert.ok(manifest.checks.every((x) => x.status === 'PASS' && x.exitStatus === 0 && x.outputCaptured));
    for (const c of manifest.checks) {
      const bytes = readFileSync(resolve(f.directory, c.outputFile));
      assert.equal(c.sizeBytes, bytes.length);
      assert.equal(c.sha256, createHash('sha256').update(bytes).digest('hex'));
      assert.equal(c.command, EXPECTED_CHECKS.find((x) => x.id === c.id).command);
    }
    assert.equal(manifest.sourceFiles.length, SOURCE_PATHS.length);
    assert.ok(manifest.sourceFiles.every((x) => x.status === 'CAPTURED'));
    for (const s of manifest.sourceFiles) {
      const bytes = readFileSync(resolve(f.root, s.path));
      assert.equal(s.sizeBytes, bytes.length);
      assert.equal(s.sha256, createHash('sha256').update(bytes).digest('hex'));
    }
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('marks a nonzero command exit as FAIL', () => {
  const f = fixture();
  try {
    writeFileSync(resolve(f.directory, EXPECTED_CHECKS[0].exitStatusFile), '7\n', 'utf8');
    const m = buildEvidenceManifest({ ...f, metadata });
    assert.equal(m.checks[0].status, 'FAIL');
    assert.equal(m.checks[0].exitStatus, 7);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('marks a missing exit-status record as NOT_RUN_OR_NO_EXIT_STATUS', () => {
  const f = fixture();
  try {
    rmSync(resolve(f.directory, EXPECTED_CHECKS[0].exitStatusFile));
    const m = buildEvidenceManifest({ ...f, metadata });
    assert.equal(m.checks[0].status, 'NOT_RUN_OR_NO_EXIT_STATUS');
    assert.equal(m.checks[0].exitStatus, null);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('does not treat malformed exit-status content as a pass', () => {
  const f = fixture();
  try {
    writeFileSync(resolve(f.directory, EXPECTED_CHECKS[0].exitStatusFile), 'success\n', 'utf8');
    const m = buildEvidenceManifest({ ...f, metadata });
    assert.equal(m.checks[0].status, 'FAIL');
    assert.equal(m.checks[0].exitStatus, null);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('marks missing output as FAIL even when exit status is zero', () => {
  const f = fixture();
  try {
    rmSync(resolve(f.directory, EXPECTED_CHECKS[0].outputFile));
    const m = buildEvidenceManifest({ ...f, metadata });
    assert.equal(m.checks[0].status, 'FAIL');
    assert.equal(m.checks[0].exitStatus, 0);
    assert.equal(m.checks[0].outputCaptured, false);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('records missing source files explicitly', () => {
  const f = fixture();
  try {
    rmSync(resolve(f.root, SOURCE_PATHS[1]));
    const m = buildEvidenceManifest({ ...f, metadata });
    assert.equal(m.sourceFiles[1].path, SOURCE_PATHS[1]);
    assert.equal(m.sourceFiles[1].status, 'NOT_CAPTURED');
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});


test('includes canonical Workflow C normative and reconciliation sources in provenance', () => {
  const required = [
    'docs/00-normative/01_CONSTITUTION_FINAL.md',
    'docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md',
    'docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md',
    'docs/01-contracts/13_LIVENESS_AND_PROGRESS_SPECIFICATION.md',
    'docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md',
    'docs/02-certification/LIVENESS_AND_PROGRESS_PROOF_SPECIFICATION.md',
    'docs/02-certification/NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md',
    'docs/workflow-c/README.md',
    'docs/workflow-c/BRANCH-AND-TRANSFER-RECORD.md',
    'docs/workflow-c/C0-C5-SOURCE-MAP.md',
    'docs/workflow-c/C2-PREDICATE-INVENTORY.md',
    'docs/workflow-c/C6-RECONCILIATION.md',
    'docs/workflow-c/C7-OMEGA-WORKSHEET.md',
    'docs/workflow-c/REFERENCE-PROFILE-CONTRACT.md',
    'docs/workflow-c/B3-EVIDENCE-INTEGRATION.md',
    'docs/workflow-c/R1-FINITE-CHECKER-SCHEMA.md',
    'IMMORTAL/kernel/UniversalEconomicKernel.hs',
    'IMMORTAL/state/UniversalEconomicState.hs',
  ];
  for (const path of required) {
    assert.ok(SOURCE_PATHS.includes(path), 'source provenance must include ' + path);
  }
});
