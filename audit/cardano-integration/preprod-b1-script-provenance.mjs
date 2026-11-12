import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import {
  Data,
  getAddressDetails,
  mintingPolicyToId,
  scriptFromNative,
  validatorToAddress,
  validatorToScriptHash,
} from '@lucid-evolution/lucid'

import { buildScriptsFromLucid } from '../../src/loadValidator'
import { PREPROD_TUSDM_CANDIDATE_UNIT } from '../../Adapter/CARDANO/observation/DirectUsdmEev'
import { decodeOracleStateDatum } from './preprod-oracle-state-datum.mjs'

const EVIDENCE_DIR = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'
const EXPECTED_WALLET_ADDRESS = process.env.PREPROD_WALLET_ADDRESS?.trim()
const OUTPUT = `${EVIDENCE_DIR}/preprod-b1-script-provenance.json`

// These names are the fixed deployment identities used by the read-only
// Oracle-State and direct-USDM bootstrap paths. No signing or submission occurs.
const ORACLE_STATE_TOKEN_NAME_HEX = '4f5241434c45' // ORACLE
const POOL_TOKEN_NAME_HEX = '504f4f4c2d444952454354' // POOL-DIRECT

const INPUT_FILES = [
  'ogmios-preprod-context.json',
  'preprod-wallet-utxo.json',
  'preprod-prize-validator-utxo.json',
  'preprod-b1-pool-utxo.json',
]

const SOURCE_FILES = [
  'plutus/B1PrizePool.hs',
  'plutus/PrizeValidator.hs',
  'plutus/BeaconRegistry.hs',
  'plutus/GameRules.hs',
  'plutus/Types.hs',
  'plutus/export/Export.hs',
  'src/loadValidator.ts',
  'src/gameRules.ts',
  'Adapter/CARDANO/serialization/ScriptSerialization.ts',
  'audit/cardano-integration/preprod-direct-oracle-state-bootstrap.mjs',
  'audit/cardano-integration/preprod-direct-usdm-bootstrap.mjs',
]

const FACTORY_PAIRS = [
  {
    name: 'B1PrizePool',
    runtime: 'src/plutusScripts/b1PrizePoolFactory.plutus.json',
    exported: 'plutus/out/b1PrizePoolFactory.plutus.json',
  },
  {
    name: 'PrizeValidator',
    runtime: 'src/plutusScripts/prizeValidatorFactory.plutus.json',
    exported: 'plutus/out/prizeValidatorFactory.plutus.json',
  },
]

const report = {
  schema: 'IMMORTAL-PREPROD-B1-SCRIPT-PROVENANCE-v0.1',
  status: 'BLOCKED',
  classification: 'HISTORICAL_CANDIDATE_NOT_YET_REVALIDATED',
  network: 'cardano-preprod',
  workflow: {
    runId: process.env.GITHUB_RUN_ID ?? null,
    commit: process.env.GITHUB_SHA ?? null,
  },
  observedSnapshot: null,
  inputEvidence: {},
  sourceEvidence: {},
  factoryArtifacts: {},
  observed: {},
  derived: {},
  checks: [],
  limitations: [
    'Read-only provenance derivation. No transaction is built, signed, submitted, or deployed.',
    'A successful script/address match does not establish a live Prize ticket or a submitted Preprod Reveal.',
    'Pool asset identity is recorded separately from EEV qualification; this gate does not certify tUSDM decimals, market value, or deployment approval.',
    'Oracle State is used only as the current script parameter identity and publisher binding; its ADA valuation semantics are not promoted to direct-USDM EEV.',
  ],
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function addCheck(id, passed, details = {}) {
  report.checks.push({ id, passed: Boolean(passed), ...details })
  if (!passed) {
    throw new Error(`PROVENANCE_CHECK_FAILED:${id}`)
  }
}

function exactRef(utxo, label) {
  if (
    !utxo ||
    typeof utxo.txHash !== 'string' ||
    !/^[0-9a-fA-F]{64}$/.test(utxo.txHash) ||
    !Number.isSafeInteger(utxo.index) ||
    utxo.index < 0
  ) {
    throw new Error(`${label} has no exact transaction reference`)
  }
  return `${utxo.txHash.toLowerCase()}#${utxo.index}`
}

function amountForUnit(value, unit) {
  if (typeof unit !== 'string' || unit.length < 56) return 0n
  const policyId = unit.slice(0, 56).toLowerCase()
  const assetName = unit.slice(56).toLowerCase()
  const raw = value?.[policyId]?.[assetName] ?? 0
  try {
    return BigInt(raw)
  } catch {
    throw new Error(`Malformed quantity for native asset ${unit}`)
  }
}

function fieldInteger(value, label) {
  try {
    const raw = value && typeof value === 'object' && 'int' in value
      ? value.int
      : value
    if (typeof raw === 'bigint') return raw
    if (typeof raw === 'number' && Number.isSafeInteger(raw)) return BigInt(raw)
    if (typeof raw === 'string' && /^-?\d+$/.test(raw)) return BigInt(raw)
  } catch {
    // Fall through to the explicit malformed-field error.
  }
  throw new Error(`Pool datum ${label} is not an integer`)
}

function fieldHex(value, label) {
  if (typeof value !== 'string' || !/^(?:[0-9a-fA-F]{2})*$/.test(value)) {
    throw new Error(`Pool datum ${label} is not a valid byte string`)
  }
  return value.toLowerCase()
}

function scriptCredential(address, label) {
  const details = getAddressDetails(address)
  const credential = details?.paymentCredential
  if (!credential?.hash || credential.type !== 'Script') {
    throw new Error(`${label} is not a script-payment address`)
  }
  return credential.hash.toLowerCase()
}

async function readEvidenceJson(name) {
  const path = `${EVIDENCE_DIR}/${name}`
  const bytes = await readFile(path)
  const parsed = JSON.parse(bytes.toString('utf8'))
  report.inputEvidence[name] = {
    sha256: sha256(bytes),
    bytes: bytes.length,
  }

  const sidecarName = `${name}.sha256`
  const sidecarPath = `${EVIDENCE_DIR}/${sidecarName}`
  const sidecar = (await readFile(sidecarPath, 'utf8')).trim().split(/\s+/)[0]
  addCheck(`input-sha256:${name}`, sidecar === report.inputEvidence[name].sha256, {
    expected: sidecar,
    actual: report.inputEvidence[name].sha256,
  })
  return parsed
}

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true })
  if (!EXPECTED_WALLET_ADDRESS) {
    throw new Error('PREPROD_WALLET_ADDRESS is required')
  }

  const [context, walletPacket, prizePacket, poolPacket] = await Promise.all(
    INPUT_FILES.map(readEvidenceJson),
  )

  const snapshot = context.acquired_ledger_state
  report.observedSnapshot = snapshot ?? null

  addCheck('preprod-network',
    context?.source?.network === 'cardano-preprod' &&
    walletPacket?.source?.network === 'cardano-preprod' &&
    prizePacket?.source?.network === 'cardano-preprod' &&
    poolPacket?.source?.network === 'cardano-preprod',
    { network: context?.source?.network ?? null },
  )
  addCheck('same-acquired-ledger-state', Boolean(snapshot?.id) &&
    [
      walletPacket?.source?.acquiredLedgerState,
      prizePacket?.source?.acquiredLedgerState,
      poolPacket?.source?.acquiredLedgerState,
    ].every(point => point?.slot === snapshot.slot && point?.id === snapshot.id),
    { snapshot },
  )
  addCheck('stable-prize-and-pool-observations',
    prizePacket.tipStable === true && poolPacket.tipStable === true &&
    prizePacket.tipBefore?.id === snapshot.id && prizePacket.tipAfter?.id === snapshot.id &&
    poolPacket.tipBefore?.id === snapshot.id && poolPacket.tipAfter?.id === snapshot.id,
    { prizeTipStable: prizePacket.tipStable, poolTipStable: poolPacket.tipStable },
  )

  const walletAddress = walletPacket?.wallet?.address
  const prizeAddress = prizePacket?.prizeValidator?.address
  const poolAddress = poolPacket?.pool?.address
  addCheck('wallet-address-binding',
    walletAddress === EXPECTED_WALLET_ADDRESS && walletPacket?.wallet?.status === 'FUNDED',
    { walletAddress, expectedWalletAddress: EXPECTED_WALLET_ADDRESS, walletStatus: walletPacket?.wallet?.status },
  )
  addCheck('historical-address-explicitly-labelled',
    prizePacket?.source?.addressProvenance === 'HISTORICAL_DEPLOYMENT_CANDIDATE_REVALIDATION_REQUIRED' &&
    poolPacket?.source?.addressProvenance === 'HISTORICAL_DEPLOYMENT_CANDIDATE_REVALIDATION_REQUIRED',
    { prize: prizePacket?.source?.addressProvenance, pool: poolPacket?.source?.addressProvenance },
  )

  const walletPaymentCredential = getAddressDetails(walletAddress)?.paymentCredential
  if (!walletPaymentCredential?.hash || walletPaymentCredential.type !== 'Key') {
    throw new Error('Observed deployment wallet does not resolve to a payment key credential')
  }
  const walletPaymentKeyHash = walletPaymentCredential.hash.toLowerCase()

  const nativeAuthorityPolicy = scriptFromNative({
    type: 'all',
    scripts: [{ type: 'sig', keyHash: walletPaymentKeyHash }],
  })
  const derivedAuthorityPolicyId = mintingPolicyToId(nativeAuthorityPolicy).toLowerCase()
  const oracleStateUnit = derivedAuthorityPolicyId + ORACLE_STATE_TOKEN_NAME_HEX
  const poolAuthorityUnit = derivedAuthorityPolicyId + POOL_TOKEN_NAME_HEX

  const oracleStateCandidates = (walletPacket.utxos ?? []).filter(
    utxo => amountForUnit(utxo.value, oracleStateUnit) > 0n,
  )
  addCheck('single-wallet-derived-oracle-state',
    oracleStateCandidates.length === 1 &&
    amountForUnit(oracleStateCandidates[0]?.value, oracleStateUnit) === 1n,
    { derivedAuthorityPolicyId, oracleStateUnit, candidateCount: oracleStateCandidates.length },
  )

  const oracleStateUtxo = oracleStateCandidates[0]
  if (!oracleStateUtxo?.datum) throw new Error('Oracle State singleton has no inline datum')
  const oracleStateRef = exactRef(oracleStateUtxo, 'Oracle State UTxO')
  const oracleDatum = decodeOracleStateDatum(oracleStateUtxo.datum, {
    expectedPublisherPkh: walletPaymentKeyHash,
  })
  addCheck('oracle-publisher-is-wallet-key',
    oracleDatum.publisherPkh === walletPaymentKeyHash,
    { oracleStateRef, publisherPkh: oracleDatum.publisherPkh, walletPaymentKeyHash },
  )

  if (!Array.isArray(poolPacket.utxos) || poolPacket.utxos.length !== 1) {
    throw new Error(`Expected exactly one observed B1 Pool UTxO; got ${poolPacket.utxos?.length ?? 'non-array'}`)
  }
  const poolUtxo = poolPacket.utxos[0]
  const poolUtxoRef = exactRef(poolUtxo, 'B1 Pool UTxO')
  addCheck('pool-reference-is-historical-candidate',
    poolUtxoRef === poolPacket.historicalCandidateUtxoReference &&
    poolPacket.historicalCandidateUtxoPresent === true,
    { poolUtxoRef, historicalCandidateUtxoReference: poolPacket.historicalCandidateUtxoReference },
  )

  const poolAuthorityQuantity = amountForUnit(poolUtxo.value, poolAuthorityUnit)
  addCheck('pool-authority-is-wallet-derived-singleton',
    poolAuthorityQuantity === 1n,
    { poolAuthorityUnit, poolAuthorityQuantity: poolAuthorityQuantity.toString() },
  )
  const directUsdmQuantity = amountForUnit(poolUtxo.value, PREPROD_TUSDM_CANDIDATE_UNIT)
  addCheck('pool-carries-configured-tusdm-candidate', directUsdmQuantity > 0n,
    { directUsdmUnit: PREPROD_TUSDM_CANDIDATE_UNIT, atomicQuantity: directUsdmQuantity.toString() },
  )

  if (typeof poolUtxo.datum !== 'string' || poolUtxo.datum.length === 0) {
    throw new Error('B1 Pool UTxO has no inline datum bytes')
  }
  const poolDatum = Data.from(poolUtxo.datum)
  if (poolDatum?.index !== 0 || !Array.isArray(poolDatum.fields) || poolDatum.fields.length !== 8) {
    throw new Error('Observed Pool datum is not the expected eight-field B1 constructor-0 datum')
  }
  const poolDatumPrizeHash = fieldHex(poolDatum.fields[7], 'ppPrizeHash')
  report.observed.poolDatum = {
    constructor: poolDatum.index,
    fieldCount: poolDatum.fields.length,
    fields: poolDatum.fields.map((field, index) => index === 7
      ? poolDatumPrizeHash
      : fieldInteger(field, `field[${index}]`).toString()),
    ppPrizeHash: poolDatumPrizeHash,
  }

  const oracleStatePolicyId = derivedAuthorityPolicyId
  const poolTokenPolicyId = derivedAuthorityPolicyId
  const lucidCompat = {
    utils: {
      validatorToScriptHash,
      mintingPolicyToId,
      validatorToAddress: script => validatorToAddress('Preprod', script),
    },
  }

  const scripts = buildScriptsFromLucid(
    lucidCompat,
    undefined,
    walletPaymentKeyHash,
    oracleStatePolicyId,
    ORACLE_STATE_TOKEN_NAME_HEX,
    poolTokenPolicyId,
    POOL_TOKEN_NAME_HEX,
  )

  const observedPrizeHash = scriptCredential(prizeAddress, 'Observed PrizeValidator address')
  const observedPoolHash = scriptCredential(poolAddress, 'Observed B1 Pool address')
  const observedPoolUtxoHash = scriptCredential(poolUtxo.address, 'Observed B1 Pool UTxO address')

  report.observed = {
    walletAddress,
    walletPaymentKeyHash,
    oracleState: {
      unit: oracleStateUnit,
      utxo: oracleStateRef,
      publisherPkh: oracleDatum.publisherPkh,
      timestampMs: oracleDatum.timestampMs.toString(),
      priceUsdmSubunitsPerLovelace: oracleDatum.priceUsdmSubunitsPerLovelace,
    },
    prize: {
      address: prizeAddress,
      scriptHash: observedPrizeHash,
      utxoCount: prizePacket.utxoCount,
    },
    pool: {
      address: poolAddress,
      scriptHash: observedPoolHash,
      utxoAddressScriptHash: observedPoolUtxoHash,
      utxo: poolUtxoRef,
      authorityUnit: poolAuthorityUnit,
      authorityQuantity: poolAuthorityQuantity.toString(),
      directUsdmUnit: PREPROD_TUSDM_CANDIDATE_UNIT,
      directUsdmAtomicQuantity: directUsdmQuantity.toString(),
    },
  }

  report.derived = {
    oracleStatePolicyId,
    oracleStateTokenNameHex: ORACLE_STATE_TOKEN_NAME_HEX,
    oraclePublisherPkh: walletPaymentKeyHash,
    poolAuthorityPolicyId: poolTokenPolicyId,
    poolAuthorityTokenNameHex: POOL_TOKEN_NAME_HEX,
    prizeHash: scripts.prizeHash,
    prizeAddress: scripts.prizeAddress,
    b1PrizePoolHash: scripts.b1PrizePoolHash,
    b1PrizePoolAddress: scripts.b1PrizePoolAddress,
  }

  for (const pair of FACTORY_PAIRS) {
    const runtimeBytes = await readFile(pair.runtime)
    const exportedBytes = await readFile(pair.exported)
    const runtimeJson = JSON.parse(runtimeBytes.toString('utf8'))
    const exportedJson = JSON.parse(exportedBytes.toString('utf8'))
    const sameBytes = runtimeBytes.equals(exportedBytes)
    const plutusV2 = runtimeJson.type === 'PlutusScriptV2' && exportedJson.type === 'PlutusScriptV2'
    const sameCbor = runtimeJson.cborHex === exportedJson.cborHex
    report.factoryArtifacts[pair.name] = {
      runtimePath: pair.runtime,
      runtimeSha256: sha256(runtimeBytes),
      exportedPath: pair.exported,
      exportedSha256: sha256(exportedBytes),
      cborHexSha256: sha256(Buffer.from(runtimeJson.cborHex ?? '', 'utf8')),
      cborHexLength: runtimeJson.cborHex?.length ?? null,
      byteIdentical: sameBytes,
      sameCborHex: sameCbor,
      type: runtimeJson.type,
    }
    addCheck(`factory-artifact-parity:${pair.name}`, sameBytes && sameCbor && plutusV2, {
      runtimePath: pair.runtime,
      exportedPath: pair.exported,
      byteIdentical: sameBytes,
      sameCborHex: sameCbor,
      plutusV2,
    })
  }

  for (const path of SOURCE_FILES) {
    const bytes = await readFile(path)
    report.sourceEvidence[path] = {
      sha256: sha256(bytes),
      bytes: bytes.length,
    }
  }

  addCheck('observed-prize-address-matches-current-factory',
    observedPrizeHash === scripts.prizeHash && prizeAddress === scripts.prizeAddress,
    { observedAddress: prizeAddress, derivedAddress: scripts.prizeAddress, observedHash: observedPrizeHash, derivedHash: scripts.prizeHash },
  )
  addCheck('pool-datum-prize-hash-matches-current-prize-factory',
    poolDatumPrizeHash === scripts.prizeHash && poolDatumPrizeHash === observedPrizeHash,
    { poolDatumPrizeHash, observedPrizeHash, derivedPrizeHash: scripts.prizeHash },
  )
  addCheck('observed-pool-address-matches-current-parameterized-factory',
    observedPoolHash === scripts.b1PrizePoolHash && poolAddress === scripts.b1PrizePoolAddress,
    { observedAddress: poolAddress, derivedAddress: scripts.b1PrizePoolAddress, observedHash: observedPoolHash, derivedHash: scripts.b1PrizePoolHash },
  )
  addCheck('pool-utxo-resides-at-observed-pool-script',
    poolUtxo.address === poolAddress && observedPoolUtxoHash === observedPoolHash,
    { utxoAddress: poolUtxo.address, observedPoolAddress: poolAddress },
  )

  report.status = 'PASS'
  report.classification = 'CURRENT_PARAMETERIZED_SCRIPT_PROVENANCE_MATCHED'
  report.meaning = 'The exact Preprod Prize and B1 Pool script payment credentials are reproduced by the current checked-in Plutus V2 factory artifacts, using the wallet-derived Oracle/Pool singleton policy, current PrizeTable, and the authenticated Oracle publisher identity observed in the same acquired ledger snapshot.'
}

try {
  await main()
} catch (error) {
  report.status = 'BLOCKED'
  report.classification = 'CURRENT_PARAMETERIZED_SCRIPT_PROVENANCE_NOT_ESTABLISHED'
  report.failure = error instanceof Error ? error.message : String(error)
  console.error(report.failure)
}

const body = JSON.stringify(report, null, 2) + '\n'
await mkdir(EVIDENCE_DIR, { recursive: true })
await writeFile(OUTPUT, body)
const digest = sha256(Buffer.from(body, 'utf8'))
await writeFile(`${OUTPUT}.sha256`, `${digest}  preprod-b1-script-provenance.json\n`)
console.log(JSON.stringify({
  status: report.status,
  classification: report.classification,
  snapshot: report.observedSnapshot,
  derivedPoolHash: report.derived?.b1PrizePoolHash ?? null,
  observedPoolHash: report.observed?.pool?.scriptHash ?? null,
  derivedPrizeHash: report.derived?.prizeHash ?? null,
  observedPrizeHash: report.observed?.prize?.scriptHash ?? null,
  checksPassed: report.checks.filter(check => check.passed).length,
  checksTotal: report.checks.length,
  failure: report.failure ?? null,
  evidence: OUTPUT,
  evidenceSha256: digest,
}, null, 2))

if (report.status !== 'PASS') process.exitCode = 1
