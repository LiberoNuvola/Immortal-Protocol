#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXPECTED_CHECKS = Object.freeze([
  { id: 'canonical-source-snapshot', command: 'node scripts/check-r1-canonical-source.mjs', outputFile: 'canonical-source.log', exitStatusFile: 'canonical-source.exit-status' },
  { id: 'v3-universal-projection', command: 'node scripts/check-v3-universal-projection.mjs', outputFile: 'v3-universal-projection.log', exitStatusFile: 'v3-universal-projection.exit-status' },
  { id: 'r1-economic-inventory', command: 'node scripts/check-r1-economic-inventory.mjs', outputFile: 'r1-economic-inventory.log', exitStatusFile: 'r1-economic-inventory.exit-status' },
  { id: 'profile-manifest-structural-tests', command: 'node --test docs/workflow-c/validate-profile-manifest.test.mjs', outputFile: 'profile-manifest-tests.tap', exitStatusFile: 'profile-manifest-tests.exit-status' },
  { id: 'finite-r1-source-binding-projection-inventory-tests', command: 'node --test test/check-r1-finite-certificate.test.mjs test/check-r1-canonical-source.test.mjs test/check-v3-universal-projection.test.mjs test/check-r1-economic-inventory.test.mjs', outputFile: 'finite-r1-tests.tap', exitStatusFile: 'finite-r1-tests.exit-status' },
  { id: 'c10-evidence-manifest-builder-tests', command: 'node --test scripts/test-workflow-c-mechanical-evidence.mjs', outputFile: 'manifest-builder-tests.tap', exitStatusFile: 'manifest-builder-tests.exit-status' },
]);

export const SOURCE_PATHS = Object.freeze([
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
  'docs/workflow-c/C1-CANONICAL-STATE-FIELD-REGISTER.md',
  'docs/workflow-c/C6-RECONCILIATION.md',
  'docs/workflow-c/C7-OMEGA-WORKSHEET.md',
  'docs/workflow-c/REFERENCE-PROFILE-CONTRACT.md',
  'docs/workflow-c/B3-EVIDENCE-INTEGRATION.md',
  'docs/workflow-c/R1-FINITE-CHECKER-SCHEMA.md',
  'IMMORTAL/kernel/UniversalEconomicKernel.hs',
  'IMMORTAL/state/UniversalEconomicState.hs',
  '.github/workflows/c6-r1-finite-checker.yml',
  'docs/workflow-c/WORK-PROGRAM.md',
  'docs/workflow-c/profile.schema.json',
  'docs/workflow-c/validate-profile-manifest.mjs',
  'docs/workflow-c/validate-profile-manifest.test.mjs',
  'docs/workflow-c/R1-ECONOMIC-INVENTORY-REGISTER-2026-10-18.json',
  'docs/workflow-c/R1-ECONOMIC-INVENTORY-CHECKPOINT-2026-10-18.md',
  'docs/workflow-c/C6-ACTION-SPACE-MATRIX-2026-10-18.md',
  'scripts/build-workflow-c-mechanical-evidence.mjs',
  'scripts/test-workflow-c-mechanical-evidence.mjs',
  'scripts/check-r1-canonical-source.mjs',
  'scripts/check-v3-universal-projection.mjs',
  'scripts/check-r1-economic-inventory.mjs',
  'scripts/check-r1-finite-certificate.mjs',
  'test/check-r1-finite-certificate.test.mjs',
  'test/check-r1-canonical-source.test.mjs',
  'test/check-v3-universal-projection.test.mjs',
  'test/check-r1-economic-inventory.test.mjs',
  'docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md',
  'docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md',
  'docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md',
  'docs/02-certification/OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md',
]);

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function buildEvidenceManifest({ root = process.cwd(), directory = resolve(root, 'workflow-c-evidence'), metadata = {}, runtime = { node: process.version, platform: process.platform, architecture: process.arch } } = {}) {
  const checks = EXPECTED_CHECKS.map((expected) => {
    const outputPath = resolve(directory, expected.outputFile);
    const statusPath = resolve(directory, expected.exitStatusFile);
    const outputExists = existsSync(outputPath);
    const statusExists = existsSync(statusPath);
    const bytes = outputExists ? readFileSync(outputPath) : null;
    const statusText = statusExists ? readFileSync(statusPath, 'utf8').trim() : null;
    const exitStatus = statusText !== null && /^\d+$/.test(statusText) ? Number(statusText) : null;
    const status = !statusExists ? 'NOT_RUN_OR_NO_EXIT_STATUS' : (!outputExists || exitStatus === null || exitStatus !== 0) ? 'FAIL' : 'PASS';
    return {
      id: expected.id, command: expected.command, outputFile: expected.outputFile, exitStatusFile: expected.exitStatusFile,
      status, exitStatus, outputCaptured: outputExists,
      ...(bytes ? { sizeBytes: bytes.length, sha256: digest(bytes) } : {}),
    };
  });
  const sourceFiles = SOURCE_PATHS.map((path) => {
    const absolutePath = resolve(root, path);
    if (!existsSync(absolutePath)) return { path, status: 'NOT_CAPTURED' };
    const bytes = readFileSync(absolutePath);
    return { path, status: 'CAPTURED', sizeBytes: bytes.length, sha256: digest(bytes) };
  });
  const repository = metadata.repository ?? '';
  const runId = metadata.runId ?? '';
  return {
    schema: 'workflow-c-mechanical-evidence-v1',
    classification: 'MECHANICAL_EVIDENCE_ONLY_NOT_PROFILE_CERTIFICATION',
    repository, ref: metadata.ref ?? '', commitSha: metadata.commitSha ?? '', workflow: metadata.workflow ?? '', event: metadata.event ?? '',
    runId, runAttempt: metadata.runAttempt ?? '',
    runUrl: metadata.runUrl ?? (repository && runId ? 'https://github.com/' + repository + '/actions/runs/' + runId : ''),
    jobStatusAtAssembly: metadata.jobStatusAtAssembly ?? '',
    runtime, checks, sourceFiles,
    limitations: [
      'This packet records configured commands and exit statuses plus SHA-256 digests of the named checked-out source files.',
      'This packet does not establish exhaustive PA2/PA7 coverage or authenticate the real-world asset/obligation universe.',
      'The packet does not prove completeness of Omega, source authenticity, a live admissible S0, or an independently authorized transition relation.',
      'A successful finite mechanical run does not certify non-empty Kc, an infinite-horizon property, adapter conformance, or deployment state.',
      'The R1 inventory checker must continue to report closureEligible=false until its explicit closure obligations are satisfied.',
      'A source-file digest identifies bytes in this commit; it does not establish normative authority, source completeness, or deployed identity.',
      'This manifest hash list excludes the manifest itself; GitHub Actions publishes the containing artifact separately.',
    ],
  };
}

function main() {
  const root = process.cwd();
  const directory = resolve(root, process.env.EVIDENCE_DIRECTORY || 'workflow-c-evidence');
  mkdirSync(directory, { recursive: true });
  const repository = process.env.EVIDENCE_REPOSITORY ?? '';
  const runId = process.env.EVIDENCE_RUN_ID ?? '';
  const manifest = buildEvidenceManifest({
    root, directory,
    metadata: {
      repository, ref: process.env.EVIDENCE_REF, commitSha: process.env.EVIDENCE_COMMIT,
      workflow: process.env.EVIDENCE_WORKFLOW, event: process.env.EVIDENCE_EVENT,
      runId, runAttempt: process.env.EVIDENCE_RUN_ATTEMPT,
      runUrl: process.env.EVIDENCE_RUN_URL || (repository && runId ? 'https://github.com/' + repository + '/actions/runs/' + runId : ''),
      jobStatusAtAssembly: process.env.EVIDENCE_JOB_STATUS,
    },
  });
  const json = JSON.stringify(manifest, null, 2) + '\n';
  writeFileSync(resolve(directory, 'evidence-manifest.json'), json, 'utf8');
  console.log(json);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
