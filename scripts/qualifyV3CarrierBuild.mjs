import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

const root = process.cwd()
const expectedCommit = process.env.GITHUB_SHA || ''
const actualCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim()

if (expectedCommit && actualCommit !== expectedCommit) {
  throw new Error('Checkout commit mismatch: expected ' + expectedCommit + ', got ' + actualCommit)
}

const sourcePaths = [
  '.github/workflows/v3-carrier-build-qualification.yml',
  '.github/actions/setup-plutus/action.yml',
  'PRE-RICH/onchain/V3EconomicStateCarrier.hs',
  'PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs',
  'PRE-RICH/src/PreRichPreprodDeploymentProfile.ts',
  'src/preprodV3InitialDatum.ts',
  'scripts/printV3InitialDatum.ts',
  'scripts/qualifyV3CarrierBuild.mjs',
  'scripts/deployV3Carrier.mts',
  'plutus/export/Export.hs',
  'plutus/pre-rich-plutus.cabal',
  'cabal.project',
  'package.json',
  'package-lock.json',
]

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const sourceBlobShas = {}

for (const path of sourcePaths) {
  sourceBlobShas[path] = execFileSync('git', ['rev-parse', 'HEAD:' + path], {
    encoding: 'utf8',
  }).trim()
}

const artifactPaths = [
  'plutus/out/v3EconomicStateCarrier.plutus.json',
  'plutus/out/v3EconomicStateCarrierMintPolicy.plutus.json',
]
const artifacts = {}

for (const path of artifactPaths) {
  const bytes = await readFile(resolve(root, path))
  let envelope
  try {
    envelope = JSON.parse(bytes.toString('utf8'))
  } catch (error) {
    throw new Error(path + ': invalid JSON envelope: ' + String(error))
  }

  if (envelope.type !== 'PlutusScriptV2') {
    throw new Error(path + ': expected PlutusScriptV2, got ' + String(envelope.type))
  }
  if (
    typeof envelope.cborHex !== 'string' ||
    envelope.cborHex.length === 0 ||
    envelope.cborHex.length % 2 !== 0 ||
    !/^[0-9a-f]+$/i.test(envelope.cborHex)
  ) {
    throw new Error(path + ': invalid CBOR hex payload')
  }

  const cborBytes = Buffer.from(envelope.cborHex, 'hex')
  if (cborBytes.length * 2 !== envelope.cborHex.length) {
    throw new Error(path + ': CBOR hex decoding length mismatch')
  }

  artifacts[basename(path)] = {
    path,
    type: envelope.type,
    fileBytes: bytes.length,
    fileSha256: sha256(bytes),
    cborBytes: cborBytes.length,
    cborSha256: sha256(cborBytes),
  }
}

const datumPath = 'audit/v3-carrier-build/v3-initial-datum.cbor.hex'
const datumText = (await readFile(resolve(root, datumPath), 'utf8')).trim()

if (!/^(?:[0-9a-f]{2})+$/i.test(datumText)) {
  throw new Error('Canonical initial V3 datum is not even-length hex')
}

const datumBytes = Buffer.from(datumText, 'hex')
if (datumBytes.length !== 116) {
  throw new Error('Canonical initial V3 datum must be 116 bytes, got ' + datumBytes.length)
}

const buildLogPath = 'plutus/v3-artifact-build.log'
const buildLog = await readFile(resolve(root, buildLogPath), 'utf8')
for (const moduleName of ['V3EconomicStateCarrier', 'V3EconomicStateCarrierMintPolicy']) {
  if (!buildLog.includes('Compiling ' + moduleName)) {
    throw new Error('Build log does not prove compilation of ' + moduleName)
  }
}

const manifest = {
  schema: 'IMMORTAL-PRE-RICH-V3-CARRIER-BUILD-QUALIFICATION-v1',
  classification: 'FRESH_BUILD_ONLY_NOT_DEPLOYMENT',
  sourceCommit: actualCommit,
  workflowRunId: process.env.GITHUB_RUN_ID || null,
  workflowRunAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
  nodeVersion: process.version,
  network: 'none',
  sourceBlobShas,
  artifacts,
  initialDatum: {
    path: datumPath,
    bytes: datumBytes.length,
    sha256: sha256(datumBytes),
  },
  buildLog: {
    path: buildLogPath,
    bytes: Buffer.byteLength(buildLog, 'utf8'),
    sha256: sha256(Buffer.from(buildLog, 'utf8')),
  },
  deployment: {
    attempted: false,
    transactionSubmitted: false,
    carrierSingletonCreated: false,
    issueAuthorityPublicKeyApplied: false,
  },
  limitations: [
    'The artifacts are unparameterized factories; this packet does not establish a deployed validator address or parameterized script hash.',
    'No deployment seed UTxO, wallet signing key, or Issue Authority public key is consumed by this workflow.',
    'A successful build is not proof of Preprod deployment, live singleton state, economic admission, or Issue authorization.',
  ],
}

const manifestPath = 'audit/v3-carrier-build/qualification.json'
await mkdir(resolve(root, 'audit/v3-carrier-build'), { recursive: true })
await writeFile(resolve(root, manifestPath), JSON.stringify(manifest, null, 2) + '\n')

console.log(JSON.stringify({
  status: 'FRESH_V3_BUILD_QUALIFIED',
  sourceCommit: manifest.sourceCommit,
  artifacts,
  initialDatumBytes: datumBytes.length,
  initialDatumSha256: sha256(datumBytes),
  buildLogSha256: manifest.buildLog.sha256,
  deploymentAttempted: false,
  transactionSubmitted: false,
}, null, 2))
