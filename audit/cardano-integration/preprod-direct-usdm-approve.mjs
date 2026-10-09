import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const EVIDENCE_DIR =
  process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'

const QUALIFICATION =
  process.env.PREPROD_EEV_QUALIFICATION ??
  EVIDENCE_DIR + '/preprod-direct-usdm-qualification.json'

const SOURCE_SET =
  process.env.PREPROD_DIRECT_USDM_SOURCE_SET ??
  EVIDENCE_DIR + '/preprod-direct-usdm-source-set.json'

const DEPLOYMENT =
  process.env.PREPROD_DEPLOYMENT_MANIFEST ??
  EVIDENCE_DIR + '/preprod-direct-usdm-deployment.json'

const ORACLE_STATE =
  process.env.PREPROD_ORACLE_STATE_MANIFEST ??
  EVIDENCE_DIR + '/preprod-oracle-state-deployment.json'

const APPROVED_OUTPUT =
  process.env.PREPROD_EEV_APPROVED_QUALIFICATION ??
  EVIDENCE_DIR + '/preprod-direct-usdm-approved-qualification.json'

const PROFILE_VERSION = 'PRE-RICH-EEV-USDM-DIRECT-V1'
const REQUIRED_APPROVAL_TOKEN = 'PREPROD_EEV_APPROVAL_TOKEN'
const REQUIRED_ACTION = 'APPROVE_PREPROD_EEV'

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(field + ' is required')
  }
  return value.trim()
}

function digest(value) {
  return createHash('sha256')
    .update(
      JSON.stringify(value, (_key, item) =>
        typeof item === 'bigint' ? item.toString() : item,
      ),
      'utf8',
    )
    .digest('hex')
}

function requiredDigest(value, field) {
  const normalized = requiredString(value, field)
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error(field + ' must be a 32-byte hex digest')
  }
  return normalized.toLowerCase()
}

const action = requiredString(
  process.env.PREPROD_EEV_APPROVAL_ACTION,
  'PREPROD_EEV_APPROVAL_ACTION',
)

if (action !== REQUIRED_ACTION) {
  throw new Error(
    'deployment approval requires explicit action ' + REQUIRED_ACTION,
  )
}

requiredString(
  process.env[REQUIRED_APPROVAL_TOKEN],
  REQUIRED_APPROVAL_TOKEN,
)

const actor = requiredString(process.env.GITHUB_ACTOR, 'GITHUB_ACTOR')
const runId = requiredString(process.env.GITHUB_RUN_ID, 'GITHUB_RUN_ID')
const sha = requiredString(process.env.GITHUB_SHA, 'GITHUB_SHA')

await mkdir(EVIDENCE_DIR, { recursive: true })

const qualification = JSON.parse(
  await readFile(QUALIFICATION, 'utf8'),
)
const sourceSet = JSON.parse(
  await readFile(SOURCE_SET, 'utf8'),
)
const deployment = JSON.parse(
  await readFile(DEPLOYMENT, 'utf8'),
)
const oracleState = JSON.parse(
  await readFile(ORACLE_STATE, 'utf8'),
)

if (qualification?.status !== 'qualified') {
  throw new Error('EEV qualification is not qualified')
}

if (qualification?.deploymentApproval !== null &&
    qualification?.deploymentApproval !== undefined) {
  throw new Error(
    'EEV qualification already contains deployment approval; refusing to overwrite approval history',
  )
}

if (sourceSet?.status !== 'OBSERVED_NOT_QUALIFIED') {
  throw new Error('source-set is not the expected pre-approval state')
}

if (sourceSet?.deploymentApproval?.status !== 'PENDING') {
  throw new Error('source-set deployment status is not PENDING')
}

if (deployment?.profileCandidate !== PROFILE_VERSION) {
  throw new Error('deployment manifest profileCandidate mismatch')
}

if (sourceSet?.profileVersion !== PROFILE_VERSION) {
  throw new Error('source-set profile mismatch')
}

if (qualification?.sourceSet?.poolInputReference !== sourceSet?.source?.b1PrizePoolUtxo) {
  throw new Error('qualification/source-set Pool reference mismatch')
}

if (qualification?.sourceReference !==
    'cardano:preprod/utxo/' + sourceSet.source.b1PrizePoolUtxo) {
  throw new Error('qualification sourceReference does not match source-set')
}

const sourceSetEvidenceHash = requiredDigest(
  sourceSet.evidenceHash,
  'sourceSet.evidenceHash',
)
const deploymentEvidenceHash = requiredDigest(
  deployment.evidenceHash,
  'deployment.evidenceHash',
)
const oracleEvidenceHash = requiredDigest(
  oracleState.evidenceHash,
  'oracleState.evidenceHash',
)
const qualificationEvidenceHash = requiredDigest(
  qualification.evidenceHash,
  'qualification.evidenceHash',
)

const candidateId =
  PROFILE_VERSION + ':' + sourceSet.source.b1PrizePoolUtxo

const sourceSetId =
  sourceSet.schema + ':' + sourceSetEvidenceHash

const approvalSnapshot = {
  action: REQUIRED_ACTION,
  actor,
  runId,
  workflowCommit: sha,
  profileVersion: PROFILE_VERSION,
  candidateId,
  sourceSetId,
  qualificationEvidenceHash,
  sourceSetEvidenceHash,
  deploymentEvidenceHash,
  oracleEvidenceHash,
  sourceReference: qualification.sourceReference,
  directUsdmUnit: sourceSet.source.directUsdmUnit,
  poolInputReference: sourceSet.source.b1PrizePoolUtxo,
  freshnessModel: sourceSet.freshness.model,
  derivationVersion: sourceSet.derivation.version,
}

const approvalEvidenceHash = digest(approvalSnapshot)

const deploymentApproval = {
  status: 'DEPLOYMENT_APPROVED',
  candidateId,
  sourceSetId,
  profileVersion: PROFILE_VERSION,
  evidenceHash: approvalEvidenceHash,
  qualifiedProperties: Array.isArray(qualification.qualifiedProperties)
    ? [...qualification.qualifiedProperties]
    : ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7'],
  excludedProperties: Array.isArray(qualification.excludedProperties)
    ? [...qualification.excludedProperties]
    : [],
  testSuiteVersion:
    qualification.testSuiteVersion ??
    'pre-rich-direct-usdm-conformance-v1',
  failureMatrixVersion:
    qualification.failureMatrixVersion ??
    'pre-rich-direct-usdm-failure-matrix-v1',
  validFrom: new Date().toISOString(),
  validUntilOrRevalidationRule: 'LIVE_UTXO_REVALIDATION',
}

const approved = {
  ...qualification,
  deploymentApproval,
  governance: {
    ...(qualification.governance ?? {}),
    deploymentApprovalStatus: 'DEPLOYMENT_APPROVED',
    approvalReference:
      'github-actions:environment/PREPROD-EEV-APPROVAL/run/' + runId,
    approvalActor: actor,
    approvalWorkflowCommit: sha,
    approvalEvidenceHash,
    approvalInputQualificationHash: qualificationEvidenceHash,
    approvalInputSourceSetHash: sourceSetEvidenceHash,
    approvalInputDeploymentHash: deploymentEvidenceHash,
    approvalInputOracleStateHash: oracleEvidenceHash,
  },
}

delete approved.evidenceHash
approved.evidenceHash = digest(approved)

await writeFile(
  APPROVED_OUTPUT,
  JSON.stringify(approved, null, 2) + '\n',
)

console.log(
  JSON.stringify(
    {
      status: approved.status,
      deploymentApproval: deploymentApproval.status,
      profileVersion: deploymentApproval.profileVersion,
      candidateId,
      sourceSetId,
      approvalEvidenceHash,
      approvedQualificationEvidenceHash: approved.evidenceHash,
      approvalActor: actor,
      approvalRunId: runId,
      output: APPROVED_OUTPUT,
    },
    null,
    2,
  ),
)