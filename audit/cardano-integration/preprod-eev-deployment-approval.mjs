import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const inputPath = process.env.PREPROD_EEV_QUALIFICATION ?? 'audit/preprod-evidence/preprod-direct-usdm-qualification.json'
const outputPath = process.env.PREPROD_EEV_APPROVAL ?? 'audit/preprod-evidence/preprod-direct-usdm-deployment-approval.json'
const expectedEnvironment = 'PRE_RICH_B1_APPROVAL'

function required(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(field + ' is required')
  return value.trim()
}

function digestObject(value) {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex')
}

if (process.env.GITHUB_ACTIONS !== 'true') {
  throw new Error('deployment approval can only be issued inside GitHub Actions')
}
if (required(process.env.APPROVAL_ENVIRONMENT, 'APPROVAL_ENVIRONMENT') !== expectedEnvironment) {
  throw new Error('deployment approval must execute inside PRE_RICH_B1_APPROVAL environment')
}
if (required(process.env.APPROVE_DEPLOYMENT, 'APPROVE_DEPLOYMENT') !== 'YES') {
  throw new Error('deployment approval requires explicit APPROVE_DEPLOYMENT=YES')
}

let qualification
try {
  qualification = JSON.parse(await readFile(inputPath, 'utf8'))
} catch {
  throw new Error('qualified direct-USDM EEV artifact is required')
}

if (qualification?.status !== 'qualified') throw new Error('EEV qualification must be qualified')
if (qualification?.deploymentApproval != null) throw new Error('EEV qualification already carries deployment approval')
if (!Array.isArray(qualification?.qualifiedProperties) || qualification.qualifiedProperties.length !== 7) {
  throw new Error('qualification must carry EV1-EV7')
}
for (const key of ['EV1','EV2','EV3','EV4','EV5','EV6','EV7']) {
  if (!qualification.evidence?.[key]?.reference || !/^[0-9a-fA-F]{64}$/.test(qualification.evidence[key].digest)) {
    throw new Error('qualification evidence is incomplete: ' + key)
  }
}
if (!/^[0-9a-fA-F]{64}$/.test(qualification.evidenceHash ?? '')) {
  throw new Error('qualification evidenceHash is invalid')
}

const now = new Date().toISOString()
const approval = {
  schema: 'PRE-RICH-EEV-USDM-DIRECT-V1-DEPLOYMENT-APPROVAL-v0.1',
  status: 'DEPLOYMENT_APPROVED',
  candidateId: 'direct-usdm-preprod:' + qualification.sourceSet.poolInputReference,
  sourceSetId: 'source-set:' + qualification.sourceSet.sourceEvidenceHash,
  profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
  evidenceHash: qualification.evidenceHash.toLowerCase(),
  qualifiedProperties: qualification.qualifiedProperties,
  excludedProperties: qualification.excludedProperties,
  testSuiteVersion: qualification.testSuiteVersion,
  failureMatrixVersion: qualification.failureMatrixVersion,
  validFrom: now,
  validUntilOrRevalidationRule: 'LIVE_UTXO_REVALIDATION; revalidate exact source UTxO before each Issue',
  authorization: {
    mode: 'GITHUB_PROTECTED_ENVIRONMENT',
    environment: expectedEnvironment,
    workflow: process.env.GITHUB_WORKFLOW ?? 'pre-rich-b1-eev-deployment-approval',
    runId: required(process.env.GITHUB_RUN_ID, 'GITHUB_RUN_ID'),
    actor: required(process.env.GITHUB_ACTOR, 'GITHUB_ACTOR'),
    repository: required(process.env.GITHUB_REPOSITORY, 'GITHUB_REPOSITORY'),
    commit: required(process.env.GITHUB_SHA, 'GITHUB_SHA'),
    approvedAt: now,
  },
  qualificationReference: inputPath,
  qualificationEvidenceHash: qualification.evidenceHash.toLowerCase(),
}
approval.approvalEvidenceHash = digestObject(approval)
await writeFile(outputPath, JSON.stringify(approval, null, 2) + '\\n')
console.log(JSON.stringify({ status: approval.status, candidateId: approval.candidateId, profileVersion: approval.profileVersion, evidenceHash: approval.evidenceHash, approvalEvidenceHash: approval.approvalEvidenceHash, outputPath }, null, 2))
