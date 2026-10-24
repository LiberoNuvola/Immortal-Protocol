import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  digestJson,
  EEV_EVIDENCE_REFERENCES,
  EEV_REPO_FILES,
} from './eev-approval-integrity.mjs'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const approvalScript = resolve(root, 'audit/cardano-integration/preprod-direct-usdm-approve.mjs')
const PROFILE = 'PRE-RICH-EEV-USDM-DIRECT-V1'
const poolRef = 'a'.repeat(64) + '#0'
const oracleRef = 'b'.repeat(64) + '#1'
const tusdmUnit = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d'
const poolUnit = '9'.repeat(56) + '504f4f4c2d444952454354'
const oracleIdentity = {
  policyId: 'c'.repeat(56),
  tokenNameHex: '4f5241434c45',
  publisherPkh: 'd'.repeat(56),
  address: 'addr_test1_oracle_fixture',
  utxo: oracleRef,
}

function seal(value) {
  value.evidenceHash = digestJson(value)
  return value
}

async function saveJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 2) + '\n')
}

async function fixture(directory) {
  const evidence = {}
  for (const key of ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7']) {
    const bytes = await readFile(resolve(root, EEV_REPO_FILES[key]))
    evidence[key] = {
      reference: EEV_EVIDENCE_REFERENCES[key],
      digest: createHash('sha256').update(bytes).digest('hex'),
    }
  }

  const oracle = seal({
    schema: 'IMMORTAL-PREPROD-ORACLE-STATE-DEPLOYMENT-v0.1',
    status: 'MATERIALIZED',
    network: 'cardano-preprod',
    authorityKind: 'DEPLOYMENT_WALLET_SIGNED',
    oracleState: { ...oracleIdentity },
    datumSemantics: { fixture: true },
  })

  const deployment = seal({
    schema: 'IMMORTAL-PREPROD-DIRECT-USDM-DEPLOYMENT-v0.1',
    status: 'DEPLOYED',
    network: 'cardano-preprod',
    profileCandidate: PROFILE,
    assets: {
      directUsdmUnit: tusdmUnit,
      poolUnit,
    },
    topology: { b1PrizePoolAddress: 'addr_test1_pool_fixture' },
    utxos: { pool: poolRef },
    oracleConfiguration: {
      statePolicyId: oracleIdentity.policyId,
      stateTokenNameHex: oracleIdentity.tokenNameHex,
      publisherPkh: oracleIdentity.publisherPkh,
      address: oracleIdentity.address,
      utxo: oracleIdentity.utxo,
    },
  })

  const sourceSet = seal({
    schema: 'PRE-RICH-EEV-USDM-DIRECT-V1-SOURCE-SET-v0.1',
    profileVersion: PROFILE,
    status: 'OBSERVED_NOT_QUALIFIED',
    network: 'cardano-preprod',
    source: {
      kind: 'CARDANO_LIVE_UTXO',
      provider: 'test-fixture',
      b1PrizePoolAddress: deployment.topology.b1PrizePoolAddress,
      b1PrizePoolUtxo: poolRef,
      poolSingletonUnit: poolUnit,
      directUsdmUnit: tusdmUnit,
    },
    derivation: {
      version: 'direct-usdm-v1',
      ledgerDecimals: 6,
      immortalUsdmSubunitsPerUsdm: '100',
      formula: 'floor(atomicQuantity * 100 / 1000000)',
      atomicQuantity: '1000000000',
      verifiedUsdmSubunits: '100000',
      rounding: 'FLOOR',
    },
    freshness: {
      model: 'LIVE_UTXO_REVALIDATION',
      rule: 'fixture-only; exact out-reference must be revalidated at admission',
      stalenessTest: 'fixture-only',
    },
    chainTip: { block_height: 1 },
    observedAt: '2026-10-24T00:00:00.000Z',
    deploymentApproval: { status: 'PENDING' },
  })

  const qualification = seal({
    schema: 'PRE-RICH-EEV-USDM-DIRECT-V1-QUALIFICATION-v0.1',
    status: 'qualified',
    contractVersion: '3.0.0',
    sourceReference: 'cardano:preprod/utxo/' + poolRef,
    verificationReference: 'github-actions:run/42@' + 'a'.repeat(40),
    derivationVersion: 'direct-usdm-v1',
    snapshotReference: 'sha256:' + 'f'.repeat(64),
    evidence,
    qualifiedProperties: ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7'],
    excludedProperties: ['unqualified test fixture cannot imply production value'],
    testSuiteVersion: 'pre-rich-direct-usdm-conformance-v1',
    failureMatrixVersion: 'pre-rich-direct-usdm-failure-matrix-v1',
    deploymentApproval: null,
    oracleState: {
      status: oracle.status,
      authorityKind: oracle.authorityKind,
      identity: oracle.oracleState,
      datumSemantics: oracle.datumSemantics,
      evidenceHash: oracle.evidenceHash,
    },
    sourceSet: {
      statusAtQualification: sourceSet.status,
      directUsdmUnit: sourceSet.source.directUsdmUnit,
      poolAddress: sourceSet.source.b1PrizePoolAddress,
      poolInputReference: sourceSet.source.b1PrizePoolUtxo,
      observedPhysicalAtoms: sourceSet.derivation.atomicQuantity,
      observedUsdmSubunits: sourceSet.derivation.verifiedUsdmSubunits,
      freshnessModel: sourceSet.freshness.model,
      sourceEvidenceHash: sourceSet.evidenceHash,
    },
    governance: { deploymentApprovalStatus: 'PENDING' },
  })

  const dir = resolve(directory, 'audit/preprod-evidence')
  await Promise.all([
    saveJson(resolve(dir, 'preprod-oracle-state-deployment.json'), oracle),
    saveJson(resolve(dir, 'preprod-direct-usdm-deployment.json'), deployment),
    saveJson(resolve(dir, 'preprod-direct-usdm-source-set.json'), sourceSet),
    saveJson(resolve(dir, 'preprod-direct-usdm-qualification.json'), qualification),
  ])
  return { dir, qualification }
}

function runApproval(dir) {
  return spawnSync(process.execPath, [approvalScript], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PREPROD_EVIDENCE_DIR: dir,
      PREPROD_EEV_APPROVAL_ACTION: 'APPROVE_PREPROD_EEV',
      PREPROD_EEV_APPROVAL_TOKEN: 'synthetic-test-token-not-a-secret',
      GITHUB_ACTOR: 'ci-fixture',
      GITHUB_RUN_ID: '42',
      GITHUB_SHA: 'a'.repeat(40),
    },
  })
}

const temp = await mkdtemp(resolve(tmpdir(), 'immortal-eev-approval-test-'))
try {
  const validRoot = resolve(temp, 'valid')
  const valid = await fixture(validRoot)
  const success = runApproval(valid.dir)
  assert.equal(success.status, 0, success.stderr || success.stdout)
  const approved = JSON.parse(await readFile(
    resolve(valid.dir, 'preprod-direct-usdm-approved-qualification.json'),
    'utf8',
  ))
  assert.equal(approved.deploymentApproval.status, 'DEPLOYMENT_APPROVED')
  assert.equal(approved.deploymentApproval.qualificationEvidenceHash, valid.qualification.evidenceHash)

  const tamperedRoot = resolve(temp, 'tampered-manifest')
  const tampered = await fixture(tamperedRoot)
  const sourceSetPath = resolve(tampered.dir, 'preprod-direct-usdm-source-set.json')
  const sourceSet = JSON.parse(await readFile(sourceSetPath, 'utf8'))
  sourceSet.source.directUsdmUnit = 'f'.repeat(56) + '0014df10745553444d'
  await saveJson(sourceSetPath, sourceSet)
  const rejectedManifest = runApproval(tampered.dir)
  assert.notEqual(rejectedManifest.status, 0)
  assert.match(rejectedManifest.stderr + rejectedManifest.stdout, /sourceSet\.evidenceHash does not match its current content/)

  const staleEvRoot = resolve(temp, 'stale-ev-source')
  const staleEv = await fixture(staleEvRoot)
  const qualificationPath = resolve(staleEv.dir, 'preprod-direct-usdm-qualification.json')
  const qualification = JSON.parse(await readFile(qualificationPath, 'utf8'))
  qualification.evidence.EV2.digest = '0'.repeat(64)
  delete qualification.evidenceHash
  qualification.evidenceHash = digestJson(qualification)
  await saveJson(qualificationPath, qualification)
  const rejectedEv = runApproval(staleEv.dir)
  assert.notEqual(rejectedEv.status, 0)
  assert.match(rejectedEv.stderr + rejectedEv.stdout, /EV2 digest does not match the current repository source bytes/)

  console.log('preprod-direct-usdm-approve: valid synthetic evidence chain approved; tampered manifest and stale EV source rejected')
} finally {
  await rm(temp, { recursive: true, force: true })
}
