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
  EEV_EV3_BASKET_CONTRACT_FILE,
  EEV_REPO_FILES,
  EEV_ORACLE_SOURCE_QUALIFICATION_FILE,
  EEV_ORACLE_MAX_AGE_MS,
} from './eev-approval-integrity.mjs'
import { canonicalizeDirectUsdmBasket } from './preprod-direct-usdm-basket-contract.mjs'

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

async function fixture(directory, options = {}) {
  const evidence = {}
  for (const key of ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7']) {
    const bytes = await readFile(resolve(root, EEV_REPO_FILES[key]))
    evidence[key] = {
      reference: EEV_EVIDENCE_REFERENCES[key],
      digest: createHash('sha256').update(bytes).digest('hex'),
    }
  }

  const chainTip = {
    hash: 'e'.repeat(64),
    epoch_no: 326,
    era: 'Conway',
    abs_slot: 100,
    epoch_slot: 50,
    block_height: 10,
    block_no: 10,
    block_time: '1800000000',
  }
  const timestampMs = String(
    options.timestampMs ?? (BigInt(chainTip.block_time) * 1_000n - 60_000n),
  )
  const datumSemantics = {
    assetPolicyHex: '',
    assetNameHex: '',
    priceUsdmSubunitsPerLovelace: '100',
    scale: '1e6',
    timestampMs,
    maxAgeMs: EEV_ORACLE_MAX_AGE_MS.toString(),
  }
  const sourceQualification = {
    schema: 'IMMORTAL-PREPROD-ORACLE-SOURCE-QUALIFICATION-v1',
    status: 'QUALIFIED_EXTERNAL_SOURCE',
    network: 'cardano-preprod',
    externalPriceSourceVerified: true,
    configuredPublisherTrustIndependentlyEliminated: true,
    oracleState: { ...oracleIdentity },
    quote: {
      assetPolicyHex: datumSemantics.assetPolicyHex,
      assetNameHex: datumSemantics.assetNameHex,
      priceUsdmSubunitsPerLovelace: datumSemantics.priceUsdmSubunitsPerLovelace,
      timestampMs,
      publisherPkh: oracleIdentity.publisherPkh,
    },
    source: {
      sourceReference: 'https://prices.example.test/cardano-preprod/ada-usdm',
      verificationReference: 'https://evidence.example.test/verify/fixture-42',
    },
    freshness: {
      maxAgeMs: datumSemantics.maxAgeMs,
      chainTip: { ...chainTip },
    },
  }
  sourceQualification.evidenceHash = digestJson(sourceQualification)
  const sourceQualificationBytes = JSON.stringify(sourceQualification, null, 2) + '\n'
  const sourceQualificationEvidenceHash = createHash('sha256')
    .update(sourceQualificationBytes, 'utf8')
    .digest('hex')

  const oracle = seal({
    schema: 'IMMORTAL-PREPROD-ORACLE-STATE-DEPLOYMENT-v0.1',
    status: 'MATERIALIZED',
    network: 'cardano-preprod',
    authorityKind: 'DEPLOYMENT_WALLET_SIGNED',
    oracleState: { ...oracleIdentity },
    datumSemantics,
    qualification: {
      externalPriceSourceVerified: options.externalPriceSourceVerified ?? true,
      configuredPublisherTrustIndependentlyEliminated: options.publisherTrustEliminated ?? true,
      sourceQualificationStatus: options.sourceQualificationStatus ?? 'QUALIFIED_EXTERNAL_SOURCE',
      sourceQualificationEvidenceReference: EEV_ORACLE_SOURCE_QUALIFICATION_FILE,
      sourceQualificationEvidenceHash,
    },
    observation: {
      utxo: oracleIdentity.utxo,
      address: oracleIdentity.address,
      chainTip: { ...chainTip },
      freshnessStatus: 'FRESH',
      withinMaxAge: true,
      timestampAgeMs: (BigInt(chainTip.block_time) * 1_000n - BigInt(timestampMs)).toString(),
    },
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

  const poolAddress = deployment.topology.b1PrizePoolAddress
  const assetBasket = canonicalizeDirectUsdmBasket({
    poolOutputReference: poolRef,
    poolAddress,
    poolTokenUnit: poolUnit,
    approvedTusdmUnit: tusdmUnit,
    lovelace: '5000000',
    assetList: [
      {
        policy_id: tusdmUnit.slice(0, 56),
        asset_name: tusdmUnit.slice(56),
        quantity: '1000000000',
      },
      {
        policy_id: poolUnit.slice(0, 56),
        asset_name: poolUnit.slice(56),
        quantity: '1',
      },
    ],
  })
  const basketContractDigest = createHash('sha256')
    .update(await readFile(resolve(root, EEV_EV3_BASKET_CONTRACT_FILE)))
    .digest('hex')

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
      poolAssetBasketDigest: assetBasket.basketDigest,
    },
    assetBasket,
    implementation: {
      basketContractReference: EEV_EV3_BASKET_CONTRACT_FILE,
      basketContractDigest,
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
    chainTip: { ...chainTip },
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
      assetBasketDigest: assetBasket.basketDigest,
      basketContractReference: EEV_EV3_BASKET_CONTRACT_FILE,
      basketContractDigest,
    },
    governance: { deploymentApprovalStatus: 'PENDING' },
  })

  const dir = resolve(directory, 'audit/preprod-evidence')
  await Promise.all([
    saveJson(resolve(dir, 'preprod-oracle-source-qualification.json'), sourceQualification),
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

  const staleOracleRoot = resolve(temp, 'stale-oracle')
  const staleOracle = await fixture(staleOracleRoot, {
    timestampMs: (1_800_000_000_000n - EEV_ORACLE_MAX_AGE_MS - 1n).toString(),
  })
  const rejectedStaleOracle = runApproval(staleOracle.dir)
  assert.notEqual(rejectedStaleOracle.status, 0)
  assert.match(
    rejectedStaleOracle.stderr + rejectedStaleOracle.stdout,
    /Oracle State is stale against the source-set chain tip/,
  )

  const futureOracleRoot = resolve(temp, 'future-oracle')
  const futureOracle = await fixture(futureOracleRoot, {
    timestampMs: (1_800_000_000_000n + 1n).toString(),
  })
  const rejectedFutureOracle = runApproval(futureOracle.dir)
  assert.notEqual(rejectedFutureOracle.status, 0)
  assert.match(
    rejectedFutureOracle.stderr + rejectedFutureOracle.stdout,
    /Oracle State timestamp is later than the source-set chain tip/,
  )

  const unqualifiedOracleRoot = resolve(temp, 'unqualified-oracle')
  const unqualifiedOracle = await fixture(unqualifiedOracleRoot, {
    externalPriceSourceVerified: false,
    publisherTrustEliminated: false,
    sourceQualificationStatus: 'NOT_PROVEN_BY_DATUM_ALONE',
  })
  const rejectedUnqualifiedOracle = runApproval(unqualifiedOracle.dir)
  assert.notEqual(rejectedUnqualifiedOracle.status, 0)
  assert.match(
    rejectedUnqualifiedOracle.stderr + rejectedUnqualifiedOracle.stdout,
    /Oracle external price source is not independently qualified/,
  )

  const tamperedOracleSourceRoot = resolve(temp, 'tampered-oracle-source')
  const tamperedOracleSource = await fixture(tamperedOracleSourceRoot)
  const externalEvidencePath = resolve(
    tamperedOracleSource.dir,
    EEV_ORACLE_SOURCE_QUALIFICATION_FILE,
  )
  await writeFile(externalEvidencePath, '{"schema":"tampered"}\\n')
  const rejectedOracleSource = runApproval(tamperedOracleSource.dir)
  assert.notEqual(rejectedOracleSource.status, 0)
  assert.match(
    rejectedOracleSource.stderr + rejectedOracleSource.stdout,
    /Oracle source qualification evidence file digest does not match/,
  )

  const tamperedRoot = resolve(temp, 'tampered-manifest')
  const tampered = await fixture(tamperedRoot)
  const sourceSetPath = resolve(tampered.dir, 'preprod-direct-usdm-source-set.json')
  const sourceSet = JSON.parse(await readFile(sourceSetPath, 'utf8'))
  sourceSet.source.directUsdmUnit = 'f'.repeat(56) + '0014df10745553444d'
  await saveJson(sourceSetPath, sourceSet)
  const rejectedManifest = runApproval(tampered.dir)
  assert.notEqual(rejectedManifest.status, 0)
  assert.match(rejectedManifest.stderr + rejectedManifest.stdout, /sourceSet\.evidenceHash does not match its current content/)

  const counterfeitBasketRoot = resolve(temp, 'counterfeit-basket')
  const counterfeitBasket = await fixture(counterfeitBasketRoot)
  const counterfeitSourceSetPath = resolve(counterfeitBasket.dir, 'preprod-direct-usdm-source-set.json')
  const counterfeitSourceSet = JSON.parse(await readFile(counterfeitSourceSetPath, 'utf8'))
  const forgedBasket = structuredClone(counterfeitSourceSet.assetBasket)
  forgedBasket.positiveAssets.push({
    unit: 'b'.repeat(56) + '01',
    quantity: '1',
  })
  const forgedBasketPayload = { ...forgedBasket }
  delete forgedBasketPayload.basketDigest
  forgedBasket.basketDigest = createHash('sha256').update(JSON.stringify(forgedBasketPayload)).digest('hex')
  counterfeitSourceSet.assetBasket = forgedBasket
  counterfeitSourceSet.source.poolAssetBasketDigest = forgedBasket.basketDigest
  delete counterfeitSourceSet.evidenceHash
  seal(counterfeitSourceSet)
  await saveJson(counterfeitSourceSetPath, counterfeitSourceSet)

  const counterfeitQualificationPath = resolve(counterfeitBasket.dir, 'preprod-direct-usdm-qualification.json')
  const counterfeitQualification = JSON.parse(await readFile(counterfeitQualificationPath, 'utf8'))
  counterfeitQualification.sourceSet.assetBasketDigest = forgedBasket.basketDigest
  counterfeitQualification.sourceSet.sourceEvidenceHash = counterfeitSourceSet.evidenceHash
  delete counterfeitQualification.evidenceHash
  seal(counterfeitQualification)
  await saveJson(counterfeitQualificationPath, counterfeitQualification)

  const rejectedBasket = runApproval(counterfeitBasket.dir)
  assert.notEqual(rejectedBasket.status, 0)
  assert.match(
    rejectedBasket.stderr + rejectedBasket.stdout,
    /sourceSet canonical Direct-USDM asset basket is missing, malformed or tampered/,
  )

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
