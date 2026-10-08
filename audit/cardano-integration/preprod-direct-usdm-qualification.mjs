import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const EVIDENCE_DIR = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'
const DEPLOYMENT_MANIFEST =
  process.env.PREPROD_DEPLOYMENT_MANIFEST ??
  EVIDENCE_DIR + '/preprod-direct-usdm-deployment.json'
const SOURCE_SET =
  process.env.PREPROD_DIRECT_USDM_SOURCE_SET ??
  EVIDENCE_DIR + '/preprod-direct-usdm-source-set.json'

const PROFILE_VERSION = 'PRE-RICH-EEV-USDM-DIRECT-V1'
const CONTRACT_VERSION = '3.0.0'
const DERIVATION_VERSION = 'direct-usdm-v1'

const REPO_FILES = {
  EV1: 'docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md',
  EV2: 'Adapter/CARDANO/observation/DirectUsdmEev.ts',
  EV3: 'audit/cardano-integration/preprod-direct-usdm-source-set.mjs',
  EV4: 'Adapter/CARDANO/observation/DirectUsdmEev.test.ts',
  EV5: 'Adapter/CARDANO/observation/PreprodDirectUsdmObservation.test.ts',
  EV6: 'docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md',
  EV7: 'docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md',
}

const EV_REFS = {
  EV1: REPO_FILES.EV1 + '#EV1-Source-specification-and-verification-predicate',
  EV2: REPO_FILES.EV2 + '#direct-usdm-v1',
  EV3: REPO_FILES.EV3 + '#LIVE_UTXO_REVALIDATION',
  EV4: REPO_FILES.EV4 + '#deterministic-floor-conversion',
  EV5: REPO_FILES.EV5 + '#exact-pool-binding-failure-matrix',
  EV6: REPO_FILES.EV6 + '#external-truth-failure-and-shock-perimeter',
  EV7: REPO_FILES.EV7 + '#PA1-PA7-accounting-partition-certification',
}

function digestFile(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

function digestObject(value) {
  return createHash('sha256')
    .update(
      JSON.stringify(value, (_key, item) =>
        typeof item === 'bigint' ? item.toString() : item,
      ),
      'utf8',
    )
    .digest('hex')
}

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(field + ' is required')
  }
  return value.trim()
}

function requireHexDigest(value, field) {
  const digest = requiredString(value, field)
  if (!/^[0-9a-fA-F]{64}$/.test(digest)) {
    throw new Error(field + ' must be a 32-byte hex digest')
  }
  return digest.toLowerCase()
}

const gitCommit = requiredString(process.env.GITHUB_SHA, 'GITHUB_SHA')
const workflowRun = requiredString(process.env.GITHUB_RUN_ID, 'GITHUB_RUN_ID')
const directUsdmUnit = requiredString(
  process.env.PREPROD_TUSDM_UNIT,
  'PREPROD_TUSDM_UNIT',
)

await mkdir(EVIDENCE_DIR, { recursive: true })

let deployment
let sourceSet
try {
  deployment = JSON.parse(await readFile(DEPLOYMENT_MANIFEST, 'utf8'))
} catch {
  throw new Error('real direct-USDM Preprod deployment manifest is required')
}
try {
  sourceSet = JSON.parse(await readFile(SOURCE_SET, 'utf8'))
} catch {
  throw new Error('real direct-USDM source-set evidence is required')
}

if (deployment?.network !== 'cardano-preprod') {
  throw new Error('deployment manifest is not for Cardano Preprod')
}
if (deployment?.profileCandidate !== PROFILE_VERSION) {
  throw new Error('deployment manifest profileCandidate is not the direct-USDM profile')
}
if (deployment?.assets?.directUsdmUnit !== directUsdmUnit) {
  throw new Error('deployment direct-USDM asset does not match the configured unit')
}
if (sourceSet?.profileVersion !== PROFILE_VERSION) {
  throw new Error('source-set profileVersion is not the direct-USDM profile')
}
if (sourceSet?.source?.directUsdmUnit !== directUsdmUnit) {
  throw new Error('source-set direct-USDM asset does not match the configured unit')
}
if (sourceSet?.source?.kind !== 'CARDANO_LIVE_UTXO') {
  throw new Error('source-set is not a live Cardano UTxO source')
}
if (sourceSet?.source?.b1PrizePoolUtxo !== deployment?.utxos?.pool) {
  throw new Error('source-set Pool reference does not match deployment manifest')
}
if (sourceSet?.source?.b1PrizePoolAddress !== deployment?.topology?.b1PrizePoolAddress) {
  throw new Error('source-set Pool address does not match deployment manifest')
}
if (sourceSet?.source?.poolSingletonUnit !== deployment?.assets?.poolUnit) {
  throw new Error('source-set Pool singleton does not match deployment manifest')
}
if (sourceSet?.freshness?.model !== 'LIVE_UTXO_REVALIDATION') {
  throw new Error('direct-USDM qualification requires LIVE_UTXO_REVALIDATION')
}
if (sourceSet?.derivation?.version !== DERIVATION_VERSION) {
  throw new Error('source-set derivation version is not direct-usdm-v1')
}
if (sourceSet?.derivation?.rounding !== 'FLOOR') {
  throw new Error('direct-USDM qualification requires conservative FLOOR rounding')
}
if (
  sourceSet?.deploymentApproval?.status !== 'PENDING' ||
  sourceSet?.status !== 'OBSERVED_NOT_QUALIFIED'
) {
  throw new Error('source-set must be the fresh pre-qualification state')
}

const evidence = {}
for (const [key, path] of Object.entries(REPO_FILES)) {
  const body = await readFile(path, 'utf8')
  evidence[key] = {
    reference: EV_REFS[key],
    digest: digestFile(body),
  }
}

const qualifiedProperties = [
  'EV1',
  'EV2',
  'EV3',
  'EV4',
  'EV5',
  'EV6',
  'EV7',
]

const excludedProperties = [
  'non-tUSDM assets',
  'unstated liquidation routes',
  'stale or ambiguous Pool observations',
  'equivocating or unavailable source states',
  'deployment authority not separately approved',
]

const verificationReference =
  'github-actions:run/' + workflowRun + '@' + gitCommit

const snapshot = {
  profileVersion: PROFILE_VERSION,
  contractVersion: CONTRACT_VERSION,
  derivationVersion: DERIVATION_VERSION,
  directUsdmUnit,
  deploymentManifestReference: DEPLOYMENT_MANIFEST,
  sourceSetReference: SOURCE_SET,
  deploymentEvidenceHash: requireHexDigest(
    deployment?.evidenceHash,
    'deployment.evidenceHash',
  ),
  sourceSetEvidenceHash: requireHexDigest(
    sourceSet?.evidenceHash,
    'sourceSet.evidenceHash',
  ),
  evidence,
}

const qualification = {
  schema: 'PRE-RICH-EEV-USDM-DIRECT-V1-QUALIFICATION-v0.1',
  status: 'qualified',
  contractVersion: CONTRACT_VERSION,
  sourceReference: 'cardano:preprod/utxo/' + sourceSet.source.b1PrizePoolUtxo,
  verificationReference,
  derivationVersion: DERIVATION_VERSION,
  snapshotReference: 'sha256:' + digestObject(snapshot),
  evidence,
  qualifiedProperties,
  excludedProperties,
  testSuiteVersion: 'pre-rich-direct-usdm-conformance-v1',
  failureMatrixVersion: 'pre-rich-direct-usdm-failure-matrix-v1',
  deploymentApproval: null,
  sourceSet: {
    statusAtQualification: sourceSet.status,
    directUsdmUnit,
    poolAddress: sourceSet.source.b1PrizePoolAddress,
    poolInputReference: sourceSet.source.b1PrizePoolUtxo,
    observedPhysicalAtoms: sourceSet.derivation.atomicQuantity,
    observedUsdmSubunits: sourceSet.derivation.verifiedUsdmSubunits,
    freshnessModel: sourceSet.freshness.model,
    sourceEvidenceHash: sourceSet.evidenceHash,
  },
  governance: {
    qualificationMeaning:
      'EV1-EV7 have been mechanically checked against the concrete source-set and current repository evidence. This artifact does not grant deployment approval.',
    deploymentApprovalStatus: 'PENDING',
    requiredNextStep:
      'A separately authorized deployment decision must promote this exact candidate/profile/evidence hash to DEPLOYMENT_APPROVED before Issue admission.',
  },
}

qualification.evidenceHash = digestObject(qualification)

const output = EVIDENCE_DIR + '/preprod-direct-usdm-qualification.json'
await writeFile(output, JSON.stringify(qualification, null, 2) + '\n')

console.log(
  JSON.stringify(
    {
      status: qualification.status,
      profileVersion: qualification.schema,
      directUsdmUnit,
      poolInputReference: qualification.sourceSet.poolInputReference,
      qualifiedProperties: qualification.qualifiedProperties,
      deploymentApproval: 'PENDING',
      evidenceFile: output,
      evidenceHash: qualification.evidenceHash,
    },
    null,
    2,
  ),
)
