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
const approval = await jsonFile(
  issueEvidenceDir + '/eev-deployment-approval.json',
  'Separate EEV deployment approval',
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
check(approval?.status === 'DEPLOYMENT_APPROVED' &&
  approval?.profileVersion === 'PRE-RICH-EEV-USDM-DIRECT-V1' &&
  /^[0-9a-f]{64}$/i.test(approval?.evidenceHash ?? ''),
  'Approval artifact binds the direct-USDM profile and evidence digest')
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
