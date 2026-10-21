import { access, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const evidenceDir = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'
const issueEvidenceDir = process.env.PREPROD_ISSUE_EVIDENCE_DIR ?? 'audit/preprod-issue'
const directUsdmUnit = process.env.PREPROD_TUSDM_UNIT?.trim()
const checks = []

async function jsonFile(path, label) {
  try {
    const value = JSON.parse(await readFile(path, 'utf8'))
    checks.push({ label, status: 'present', path })
    return value
  } catch {
    checks.push({ label, status: 'missing_or_invalid', path })
    return null
  }
}

function check(condition, label, detail) {
  checks.push({ label, status: condition ? 'pass' : 'blocked', ...(detail ? { detail } : {}) })
}

function digestWithoutEvidenceHash(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const body = { ...value }
  delete body.evidenceHash
  return createHash('sha256')
    .update(JSON.stringify(body, (_key, item) =>
      typeof item === 'bigint' ? item.toString() : item,
    ), 'utf8')
    .digest('hex')
}

function approvalSnapshotDigestMatches(approved, qualification, sourceSet, deployment, oracle) {
  const governance = approved?.governance
  const approval = approved?.deploymentApproval
  const match = /^github-actions:environment\\/PREPROD-EEV-APPROVAL\\/run\\/(.+)$/.exec(
    governance?.approvalReference ?? '',
  )
  if (!match) return false
  if (
    typeof governance?.approvalActor !== 'string' ||
    typeof governance?.approvalWorkflowCommit !== 'string' ||
    !sourceSet?.source?.directUsdmUnit ||
    !sourceSet?.source?.b1PrizePoolUtxo ||
    !sourceSet?.freshness?.model ||
    !sourceSet?.derivation?.version
  ) return false

  const snapshot = {
    action: 'APPROVE_PREPROD_EEV',
    actor: governance.approvalActor,
    runId: match[1],
    workflowCommit: governance.approvalWorkflowCommit,
    profileVersion: approval?.profileVersion,
    candidateId: approval?.candidateId,
    sourceSetId: approval?.sourceSetId,
    qualificationEvidenceHash: qualification?.evidenceHash,
    sourceSetEvidenceHash: sourceSet?.evidenceHash,
    deploymentEvidenceHash: deployment?.evidenceHash,
    oracleEvidenceHash: oracle?.evidenceHash,
    sourceReference: approved?.sourceReference,
    directUsdmUnit: sourceSet.source.directUsdmUnit,
    poolInputReference: sourceSet.source.b1PrizePoolUtxo,
    freshnessModel: sourceSet.freshness.model,
    derivationVersion: sourceSet.derivation.version,
  }
  const digest = createHash('sha256')
    .update(JSON.stringify(snapshot), 'utf8')
    .digest('hex')
  return digest === approval?.evidenceHash
}

async function exists(path) {
  try { await access(path); return true } catch { return false }
}

const deployment = await jsonFile(
  evidenceDir + '/preprod-direct-usdm-deployment.json',
  'Direct-USDM deployment manifest',
)
const sourceSet = await jsonFile(
  evidenceDir + '/preprod-direct-usdm-source-set.json',
  'Live direct-USDM source-set',
)
const qualification = await jsonFile(
  evidenceDir + '/preprod-direct-usdm-qualification.json',
  'EV1-EV7 qualification',
)
const oracle = await jsonFile(
  evidenceDir + '/preprod-oracle-state-deployment.json',
  'Oracle State deployment evidence',
)
const b2 = await jsonFile(
  issueEvidenceDir + '/b2-control-deployment.json',
  'B2 control deployment evidence',
)
const approvedQualification = await jsonFile(
  evidenceDir + '/preprod-direct-usdm-approved-qualification.json',
  'Approved direct-USDM EEV qualification',
)

check(deployment?.status === 'DEPLOYED' && deployment?.network === 'cardano-preprod',
  'Direct-USDM Pool deployment is on Preprod')
check(typeof deployment?.utxos?.pool === 'string' && /^[0-9a-f]{64}#\d+$/.test(deployment.utxos.pool),
  'Deployment binds exact Pool UTxO')
check(Boolean(directUsdmUnit) && deployment?.assets?.directUsdmUnit === directUsdmUnit,
  'Configured USDM asset matches deployment', directUsdmUnit ? undefined : 'PREPROD_TUSDM_UNIT is not configured')
check(sourceSet?.status === 'OBSERVED_NOT_QUALIFIED' || sourceSet?.status === 'QUALIFIED',
  'Live source-set is materialized')
check(sourceSet?.source?.kind === 'CARDANO_LIVE_UTXO' &&
  sourceSet?.source?.b1PrizePoolUtxo === deployment?.utxos?.pool &&
  sourceSet?.source?.directUsdmUnit === directUsdmUnit,
  'Source-set binds the exact deployed Pool and USDM unit')
check(qualification?.status === 'qualified' &&
  qualification?.schema === 'PRE-RICH-EEV-USDM-DIRECT-V1-QUALIFICATION-v0.1',
  'EV1-EV7 qualification exists')
check(
  /^[0-9a-f]{64}$/i.test(qualification?.evidenceHash ?? '') &&
    digestWithoutEvidenceHash(qualification) === qualification?.evidenceHash,
  'Original qualification digest matches its exact artifact',
)
check(
  /^[0-9a-f]{64}$/i.test(sourceSet?.evidenceHash ?? '') &&
    digestWithoutEvidenceHash(sourceSet) === sourceSet?.evidenceHash,
  'Source-set digest matches its exact artifact',
)
// The qualification artifact is not itself a deployment approval.
// Approval is evaluated only from the independent signed approval artifact below.
check(oracle?.status === 'MATERIALIZED' &&
  oracle?.network === 'cardano-preprod' &&
  oracle?.oracleState?.utxo === deployment?.oracleConfiguration?.utxo,
  'Oracle State identity is bound to deployment')
check(b2?.network === 'cardano-preprod' &&
  typeof b2?.controlAddress === 'string' &&
  typeof b2?.controlPolicyId === 'string' &&
  typeof b2?.controlTokenNameHex === 'string',
  'B2 control singleton is deployed and identified')
const deploymentApproval = approvedQualification?.deploymentApproval
check(approvedQualification?.status === 'qualified' &&
  approvedQualification?.schema === 'PRE-RICH-EEV-USDM-DIRECT-V1-QUALIFICATION-v0.1' &&
  /^[0-9a-f]{64}$/i.test(approvedQualification?.evidenceHash ?? '') &&
  digestWithoutEvidenceHash(approvedQualification) === approvedQualification?.evidenceHash,
  'Approved qualification artifact exists and its digest matches the exact artifact')
check(deploymentApproval?.status === 'DEPLOYMENT_APPROVED' &&
  deploymentApproval?.profileVersion === 'PRE-RICH-EEV-USDM-DIRECT-V1' &&
  /^[0-9a-f]{64}$/i.test(deploymentApproval?.evidenceHash ?? ''),
  'Approved qualification carries the direct-USDM deployment approval')
check(
  deploymentApproval?.qualificationEvidenceHash === qualification?.evidenceHash &&
  approvedQualification?.governance?.approvalInputQualificationHash === qualification?.evidenceHash &&
  approvedQualification?.governance?.approvalEvidenceHash === deploymentApproval?.evidenceHash &&
  approvedQualification?.governance?.approvalInputSourceSetHash === sourceSet?.evidenceHash &&
  approvedQualification?.governance?.approvalInputDeploymentHash === deployment?.evidenceHash &&
  approvedQualification?.governance?.approvalInputOracleStateHash === oracle?.evidenceHash &&
  deploymentApproval?.candidateId === 'PRE-RICH-EEV-USDM-DIRECT-V1:' + deployment?.utxos?.pool &&
  deploymentApproval?.sourceSetId === sourceSet?.schema + ':' + sourceSet?.evidenceHash &&
  approvedQualification?.sourceSet?.poolInputReference === deployment?.utxos?.pool &&
  approvedQualification?.sourceReference === 'cardano:preprod/utxo/' + deployment?.utxos?.pool &&
  approvalSnapshotDigestMatches(approvedQualification, qualification, sourceSet, deployment, oracle),
  'Approval digest is bound to the original qualification, current source-set, deployment, Oracle State, exact Pool candidate, actor, run, and commit')
const providerPath = process.env.PREPROD_ISSUE_ADMISSION_PROVIDER_MODULE?.trim()
check(Boolean(providerPath) && await exists(providerPath),
  'Production authoritative Issue provider is configured',
  providerPath ? undefined : 'Only the provider boundary exists; do not manufacture EEV, ProtectedCapital, viability or admission in the browser')

const blockers = checks.filter(c => c.status === 'blocked' || c.status === 'missing_or_invalid')
const report = {
  schema: 'IMMORTAL-PREPROD-FIRST-ISSUE-READINESS-v0.1',
  network: 'cardano-preprod',
  status: blockers.length === 0 ? 'READY_FOR_WALLET_REVIEW' : 'BLOCKED',
  checks,
  blockers,
  safety: {
    transactionsSubmitted: false,
    walletSigned: false,
    meaning: 'This is a read-only evidence gate. READY_FOR_WALLET_REVIEW is not an authorization to submit a transaction.',
  },
}
report.reportDigest = createHash('sha256')
  .update(JSON.stringify(report))
  .digest('hex')

console.log(JSON.stringify(report, null, 2))
if (blockers.length > 0) process.exitCode = 2
