import { mkdir, readFile, writeFile } from 'node:fs/promises'
import {
  assertArtifactEvidenceHash,
  assertQualificationEvidenceMatchesRepository,
  digestJson as digest,
} from './eev-approval-integrity.mjs'

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

// Recompute all evidence digests from the parsed canonical contents. Digest
// shape alone is insufficient for a privileged deployment-approval action.
const sourceSetEvidenceHash = assertArtifactEvidenceHash(sourceSet, 'sourceSet')
const deploymentEvidenceHash = assertArtifactEvidenceHash(deployment, 'deployment')
const oracleEvidenceHash = assertArtifactEvidenceHash(oracleState, 'oracleState')
const qualificationEvidenceHash = assertArtifactEvidenceHash(qualification, 'qualification')

// EV1-EV7 must identify exactly the reviewed source paths and the current
// repository bytes at this approval workflow's checked-out commit.
await assertQualificationEvidenceMatchesRepository(qualification, process.cwd())

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

if (deployment?.network !== 'cardano-preprod' || sourceSet?.network !== 'cardano-preprod') {
  throw new Error('deployment and source-set must both identify Cardano Preprod')
}

if (oracleState?.network !== 'cardano-preprod' ||
    oracleState?.status !== 'MATERIALIZED' ||
    oracleState?.authorityKind !== 'DEPLOYMENT_WALLET_SIGNED') {
  throw new Error('Oracle State is not an authenticated materialized Cardano Preprod source')
}

const oracleIdentity = oracleState?.oracleState
const oracleConfiguration = deployment?.oracleConfiguration
if (!oracleIdentity?.policyId || !oracleIdentity?.tokenNameHex ||
    !oracleIdentity?.publisherPkh || !oracleIdentity?.address || !oracleIdentity?.utxo) {
  throw new Error('Oracle State manifest lacks the exact singleton identity')
}
if (oracleConfiguration?.statePolicyId !== oracleIdentity.policyId ||
    oracleConfiguration?.stateTokenNameHex !== oracleIdentity.tokenNameHex ||
    oracleConfiguration?.publisherPkh !== oracleIdentity.publisherPkh ||
    oracleConfiguration?.address !== oracleIdentity.address ||
    oracleConfiguration?.utxo !== oracleIdentity.utxo) {
  throw new Error('deployment Oracle State configuration does not match the hashed Oracle State manifest')
}

if (deployment?.profileCandidate !== PROFILE_VERSION) {
  throw new Error('deployment manifest profileCandidate mismatch')
}

if (sourceSet?.profileVersion !== PROFILE_VERSION) {
  throw new Error('source-set profile mismatch')
}

if (sourceSet?.source?.kind !== 'CARDANO_LIVE_UTXO' ||
    sourceSet?.freshness?.model !== 'LIVE_UTXO_REVALIDATION' ||
    sourceSet?.derivation?.version !== 'direct-usdm-v1' ||
    sourceSet?.derivation?.rounding !== 'FLOOR') {
  throw new Error('source-set does not match the declared direct-USDM live-source contract')
}

if (sourceSet?.source?.directUsdmUnit !== deployment?.assets?.directUsdmUnit) {
  throw new Error('source-set direct-USDM unit does not match deployment asset identity')
}
if (sourceSet?.source?.b1PrizePoolUtxo !== deployment?.utxos?.pool ||
    sourceSet?.source?.b1PrizePoolAddress !== deployment?.topology?.b1PrizePoolAddress ||
    sourceSet?.source?.poolSingletonUnit !== deployment?.assets?.poolUnit) {
  throw new Error('source-set does not match the exact deployed B1 PrizePool candidate')
}

if (qualification?.sourceSet?.poolInputReference !== sourceSet?.source?.b1PrizePoolUtxo) {
  throw new Error('qualification/source-set Pool reference mismatch')
}
if (qualification?.sourceSet?.directUsdmUnit !== sourceSet?.source?.directUsdmUnit ||
    qualification?.sourceSet?.sourceEvidenceHash !== sourceSetEvidenceHash ||
    qualification?.sourceSet?.statusAtQualification !== sourceSet.status ||
    qualification?.sourceSet?.poolAddress !== sourceSet.source.b1PrizePoolAddress ||
    qualification?.sourceSet?.observedPhysicalAtoms !== sourceSet.derivation.atomicQuantity ||
    qualification?.sourceSet?.observedUsdmSubunits !== sourceSet.derivation.verifiedUsdmSubunits ||
    qualification?.sourceSet?.freshnessModel !== sourceSet.freshness.model) {
  throw new Error('qualification does not bind the complete current source-set facts')
}

if (qualification?.sourceReference !==
    'cardano:preprod/utxo/' + sourceSet.source.b1PrizePoolUtxo) {
  throw new Error('qualification sourceReference does not match source-set')
}

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
  qualificationEvidenceHash,
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