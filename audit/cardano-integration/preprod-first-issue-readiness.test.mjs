import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readinessScript = resolve(root, 'audit/cardano-integration/preprod-first-issue-readiness.mjs')
const providerModule = resolve(root, 'relayer/preprodIssueAdmissionProvider.js')
const evidenceRoot = await mkdtemp(resolve(tmpdir(), 'immortal-preprod-readiness-'))

const EEV_SOURCE_EVIDENCE = {
  EV1: {
    path: 'docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md',
    reference: 'docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md#EV1-Source-specification-and-verification-predicate',
  },
  EV2: {
    path: 'Adapter/CARDANO/observation/DirectUsdmEev.ts',
    reference: 'Adapter/CARDANO/observation/DirectUsdmEev.ts#direct-usdm-v1',
  },
  EV3: {
    path: 'audit/cardano-integration/preprod-direct-usdm-source-set.mjs',
    reference: 'audit/cardano-integration/preprod-direct-usdm-source-set.mjs#LIVE_UTXO_REVALIDATION',
  },
  EV4: {
    path: 'Adapter/CARDANO/observation/DirectUsdmEev.test.ts',
    reference: 'Adapter/CARDANO/observation/DirectUsdmEev.test.ts#deterministic-floor-conversion',
  },
  EV5: {
    path: 'Adapter/CARDANO/observation/PreprodDirectUsdmObservation.test.ts',
    reference: 'Adapter/CARDANO/observation/PreprodDirectUsdmObservation.test.ts#exact-pool-binding-failure-matrix',
  },
  EV6: {
    path: 'docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md',
    reference: 'docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md#external-truth-failure-and-shock-perimeter',
  },
  EV7: {
    path: 'docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md',
    reference: 'docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md#PA1-PA7-accounting-partition-certification',
  },
}

const sourceEvidence = {}
for (const [key, source] of Object.entries(EEV_SOURCE_EVIDENCE)) {
  const bytes = await readFile(resolve(root, source.path))
  sourceEvidence[key] = {
    reference: source.reference,
    digest: createHash('sha256').update(bytes).digest('hex'),
  }
}

function digest(value) {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, item) =>
      typeof item === 'bigint' ? item.toString() : item,
    ), 'utf8')
    .digest('hex')
}

function withEvidenceHash(value) {
  value.evidenceHash = digest(value)
  return value
}

function setArtifactDigest(value) {
  const copy = { ...value }
  delete copy.evidenceHash
  value.evidenceHash = digest(copy)
  return value
}

async function saveJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 2) + '\n')
}

function runGate(env) {
  const result = spawnSync(process.execPath, [readinessScript], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
  const report = JSON.parse(result.stdout)
  return { code: result.status, report, stderr: result.stderr }
}

try {
  const evidenceDir = resolve(evidenceRoot, 'audit/preprod-evidence')
  const issueDir = resolve(evidenceRoot, 'audit/preprod-issue')
  const poolRef = 'a'.repeat(64) + '#1'
  const oracleUtxo = 'b'.repeat(64) + '#0'
  const directUsdmUnit = 'e'.repeat(56) + '0014df10745553444d'
  const sourceSet = withEvidenceHash({
    schema: 'PRE-RICH-EEV-USDM-DIRECT-V1-SOURCE-SET-v0.1',
    profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
    status: 'OBSERVED_NOT_QUALIFIED',
    network: 'cardano-preprod',
    source: {
      kind: 'CARDANO_LIVE_UTXO',
      b1PrizePoolAddress: 'addr_test1_pool',
      b1PrizePoolUtxo: poolRef,
      directUsdmUnit,
    },
    derivation: { version: 'direct-usdm-v1' },
    freshness: { model: 'LIVE_UTXO_REVALIDATION' },
  })
  const deployment = {
    status: 'DEPLOYED',
    network: 'cardano-preprod',
    utxos: { pool: poolRef },
    assets: { directUsdmUnit },
    oracleConfiguration: { utxo: oracleUtxo },
    evidenceHash: '1'.repeat(64),
  }
  const oracle = setArtifactDigest({
    status: 'MATERIALIZED',
    network: 'cardano-preprod',
    oracleState: { utxo: oracleUtxo },
    datumSemantics: {
      timestampMs: String(Date.now()),
      maxAgeMs: '3600000',
    },
    qualification: {
      externalPriceSourceVerified: true,
      evidenceReference: 'synthetic://oracle-source-qualification',
      evidenceHash: '3'.repeat(64),
    },
  })
  const qualification = withEvidenceHash({
    schema: 'PRE-RICH-EEV-USDM-DIRECT-V1-QUALIFICATION-v0.1',
    status: 'qualified',
    contractVersion: '3.0.0',
    sourceReference: 'cardano:preprod/utxo/' + poolRef,
    verificationReference: 'github-actions:run/100@' + 'c'.repeat(40),
    derivationVersion: 'direct-usdm-v1',
    snapshotReference: 'sha256:' + 'd'.repeat(64),
    evidence: sourceEvidence,
    qualifiedProperties: ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7'],
    excludedProperties: [],
    testSuiteVersion: 'pre-rich-direct-usdm-conformance-v1',
    failureMatrixVersion: 'pre-rich-direct-usdm-failure-matrix-v1',
    deploymentApproval: null,
    sourceSet: { poolInputReference: poolRef },
    governance: { deploymentApprovalStatus: 'PENDING' },
  })

  const actor = 'ci-fixture'
  const runId = '42'
  const workflowCommit = 'f'.repeat(40)
  const candidateId = 'PRE-RICH-EEV-USDM-DIRECT-V1:' + poolRef
  const sourceSetId = sourceSet.schema + ':' + sourceSet.evidenceHash
  const approvalSnapshot = {
    action: 'APPROVE_PREPROD_EEV',
    actor,
    runId,
    workflowCommit,
    profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
    candidateId,
    sourceSetId,
    qualificationEvidenceHash: qualification.evidenceHash,
    sourceSetEvidenceHash: sourceSet.evidenceHash,
    deploymentEvidenceHash: deployment.evidenceHash,
    oracleEvidenceHash: oracle.evidenceHash,
    sourceReference: qualification.sourceReference,
    directUsdmUnit,
    poolInputReference: poolRef,
    freshnessModel: sourceSet.freshness.model,
    derivationVersion: sourceSet.derivation.version,
  }
  const approvalEvidenceHash = digest(approvalSnapshot)
  const deploymentApproval = {
    status: 'DEPLOYMENT_APPROVED',
    candidateId,
    sourceSetId,
    profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
    evidenceHash: approvalEvidenceHash,
    qualificationEvidenceHash: qualification.evidenceHash,
    qualifiedProperties: qualification.qualifiedProperties,
    excludedProperties: qualification.excludedProperties,
    testSuiteVersion: qualification.testSuiteVersion,
    failureMatrixVersion: qualification.failureMatrixVersion,
    validFrom: '2026-10-21T00:00:00.000Z',
    validUntilOrRevalidationRule: 'LIVE_UTXO_REVALIDATION',
  }
  const approvedQualification = setArtifactDigest({
    ...qualification,
    deploymentApproval,
    governance: {
      deploymentApprovalStatus: 'DEPLOYMENT_APPROVED',
      approvalReference: 'github-actions:environment/PREPROD-EEV-APPROVAL/run/' + runId,
      approvalActor: actor,
      approvalWorkflowCommit: workflowCommit,
      approvalEvidenceHash,
      approvalInputQualificationHash: qualification.evidenceHash,
      approvalInputSourceSetHash: sourceSet.evidenceHash,
      approvalInputDeploymentHash: deployment.evidenceHash,
      approvalInputOracleStateHash: oracle.evidenceHash,
    },
  })
  const b2 = {
    network: 'cardano-preprod',
    controlAddress: 'addr_test1_control',
    controlPolicyId: '3'.repeat(56),
    controlTokenNameHex: '4354524c',
  }

  await Promise.all([
    saveJson(resolve(evidenceDir, 'preprod-direct-usdm-deployment.json'), deployment),
    saveJson(resolve(evidenceDir, 'preprod-direct-usdm-source-set.json'), sourceSet),
    saveJson(resolve(evidenceDir, 'preprod-direct-usdm-qualification.json'), qualification),
    saveJson(resolve(evidenceDir, 'preprod-direct-usdm-approved-qualification.json'), approvedQualification),
    saveJson(resolve(evidenceDir, 'preprod-oracle-state-deployment.json'), oracle),
    saveJson(resolve(issueDir, 'b2-control-deployment.json'), b2),
  ])

  const { publicKey } = generateKeyPairSync('ed25519')
  const authorityPublicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString()
  const env = {
    PREPROD_EVIDENCE_DIR: evidenceDir,
    PREPROD_ISSUE_EVIDENCE_DIR: issueDir,
    PREPROD_TUSDM_UNIT: directUsdmUnit,
    PREPROD_ISSUE_ADMISSION_PROVIDER_MODULE: providerModule,
    ISSUE_AUTHORITY_URL: 'https://authority.example.invalid/issue-admission',
    ISSUE_AUTHORITY_PUBLIC_KEY: authorityPublicKeyPem,
  }

  const ready = runGate(env)
  assert.equal(ready.code, 0, ready.stderr || JSON.stringify(ready.report.blockers, null, 2))
  assert.equal(ready.report.status, 'READY_FOR_WALLET_REVIEW')
  assert.equal(ready.report.safety.transactionsSubmitted, false)
  assert.equal(ready.report.safety.walletSigned, false)

  const unverifiedOracle = setArtifactDigest({
    ...oracle,
    qualification: {
      externalPriceSourceVerified: false,
      evidenceReference: undefined,
      evidenceHash: undefined,
    },
  })
  await saveJson(resolve(evidenceDir, 'preprod-oracle-state-deployment.json'), unverifiedOracle)
  const unverifiedSource = runGate(env)
  assert.equal(unverifiedSource.code, 2)
  assert.ok(unverifiedSource.report.blockers.some(item =>
    item.label === 'Oracle external price source is independently verified',
  ))

  const staleOracle = setArtifactDigest({
    ...oracle,
    datumSemantics: {
      timestampMs: String(Date.now() - 3_600_001),
      maxAgeMs: '3600000',
    },
  })
  await saveJson(resolve(evidenceDir, 'preprod-oracle-state-deployment.json'), staleOracle)
  const staleTimestamp = runGate(env)
  assert.equal(staleTimestamp.code, 2)
  assert.ok(staleTimestamp.report.blockers.some(item =>
    item.label === 'Oracle State price timestamp is present, non-future, and within maxAgeMs',
  ))

  const missingTimestampOracle = setArtifactDigest({
    ...oracle,
    datumSemantics: { timestampMs: null, maxAgeMs: '3600000' },
  })
  await saveJson(resolve(evidenceDir, 'preprod-oracle-state-deployment.json'), missingTimestampOracle)
  const missingTimestamp = runGate(env)
  assert.equal(missingTimestamp.code, 2)
  assert.ok(missingTimestamp.report.blockers.some(item =>
    item.label === 'Oracle State price timestamp is present, non-future, and within maxAgeMs',
  ))
  await saveJson(resolve(evidenceDir, 'preprod-oracle-state-deployment.json'), oracle)

  const invalidKey = runGate({ ...env, ISSUE_AUTHORITY_PUBLIC_KEY: 'not-a-public-key' })
  assert.equal(invalidKey.code, 2)
  assert.equal(invalidKey.report.status, 'BLOCKED')
  assert.ok(invalidKey.report.blockers.some(item =>
    item.label === 'External signed Issue authority verification key is a valid public key',
  ))

  const invalidUrl = runGate({ ...env, ISSUE_AUTHORITY_URL: 'not-a-url' })
  assert.equal(invalidUrl.code, 2)
  assert.equal(invalidUrl.report.status, 'BLOCKED')
  assert.ok(invalidUrl.report.blockers.some(item =>
    item.label === 'External signed Issue authority URL is configured as a valid HTTP(S) URL',
  ))

  const tamperedApproval = JSON.parse(await readFile(
    resolve(evidenceDir, 'preprod-direct-usdm-approved-qualification.json'),
    'utf8',
  ))
  tamperedApproval.deploymentApproval.qualificationEvidenceHash = '9'.repeat(64)
  setArtifactDigest(tamperedApproval)
  await saveJson(resolve(evidenceDir, 'preprod-direct-usdm-approved-qualification.json'), tamperedApproval)
  const blocked = runGate(env)
  assert.equal(blocked.code, 2)
  assert.equal(blocked.report.status, 'BLOCKED')
  assert.ok(blocked.report.blockers.some(item =>
    item.label === 'Approval digest is bound to the original qualification, current source-set, deployment, Oracle State, exact Pool candidate, actor, run, and commit',
  ))

  // Recompute every EV digest from actual repository bytes and reject a
  // coherently re-hashed qualification artifact whose referenced source bytes
  // no longer match its EV evidence.
  const qualificationPath = resolve(evidenceDir, 'preprod-direct-usdm-qualification.json')
  const validQualification = JSON.parse(await readFile(qualificationPath, 'utf8'))
  const staleSourceQualification = JSON.parse(JSON.stringify(validQualification))
  staleSourceQualification.evidence.EV2.digest = '0'.repeat(64)
  setArtifactDigest(staleSourceQualification)
  await saveJson(qualificationPath, staleSourceQualification)
  const staleSource = runGate(env)
  assert.equal(staleSource.code, 2)
  assert.equal(staleSource.report.status, 'BLOCKED')
  assert.ok(staleSource.report.blockers.some(item =>
    item.label === 'EV1-EV7 digests and exact source references match current repository bytes',
  ))
  await saveJson(qualificationPath, validQualification)

  console.log('preprod-first-issue-readiness: passes valid evidence chain and blocks altered source digests and approval digest mismatch')
} finally {
  await rm(evidenceRoot, { recursive: true, force: true })
}
