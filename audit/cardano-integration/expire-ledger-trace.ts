/**
 * Real Yaci/Cardano EXPIRE realization trace for Pending, Revealed Loss and
 * Revealed Win pre-states. Revealed fixtures are synthetic state fixtures; they
 * do not claim an end-to-end Reveal transaction.
 *
 * C3 target:
 *   expired PrizeDatum + B1PrizePool
 *     -> atomic EXPIRE
 *     -> PrizeDatum consumed (no continuing PrizeValidator output)
 *     -> pool reserve/count released exactly once
 *     -> ticket NFT remains independently held by its owner
 *
 * This is conformance evidence, not new economic policy.
 */

import {
  CML,
  Constr,
  Data,
  Lucid,
  Blockfrost,
  getAddressDetails,
  scriptFromNative,
  mintingPolicyToId,
  validatorToScriptHash,
  validatorToAddress,
  applyParamsToScript as evolutionApplyParamsToScript,
  type Script,
  type UTxO,
} from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import { buildB1PrizePool, buildScriptsFromLucid, prizeValidatorFactory } from '../../src/loadValidator'
import {
  assertCanonicalTransitionBinding,
  type CanonicalTransitionEvidence,
} from '../../Adapter/CARDANO/observation/CanonicalTransitionEvidence'
import { defaultPrizeTable, rowPayoutTotal } from '../../src/gameRules'

const API = 'http://127.0.0.1:8080/api/v1'
const SEED =
  'test test test test test test test test test test test test test test test test test test test test test test test sauce'

const PRICE_USDM = 100n
const TOTAL_LIQUIDITY_USDM = 100_000n
const EXPIRE_CASE = process.env.IMMORTAL_EXPIRE_CASE ?? 'pending'
if (!['pending', 'revealed-loss', 'revealed-win'].includes(EXPIRE_CASE)) {
  throw new Error('Unsupported IMMORTAL_EXPIRE_CASE: ' + EXPIRE_CASE)
}
const EXPIRE_BACKEND = process.env.IMMORTAL_EXPIRE_AIKEN_V3 === '1'
  ? 'aiken-v3'
  : 'haskell-v2'
const TICKET_NAME_HEX = Array.from(
  new TextEncoder().encode(`RF-${EXPIRE_BACKEND}-${EXPIRE_CASE}`),
).map((byte) => byte.toString(16).padStart(2, '0')).join('')
const EXPIRE_ROW1_TIER = EXPIRE_CASE === 'revealed-win' ? 1 : 0
const EXPIRE_ROW2_TIER = 0
const EXPIRE_PAYOUT_USDM = EXPIRE_CASE === 'revealed-win'
  ? BigInt(rowPayoutTotal(defaultPrizeTable, EXPIRE_ROW1_TIER, EXPIRE_ROW2_TIER, Number(PRICE_USDM)))
  : 0n
const EXPIRE_PRE_RESERVE = EXPIRE_CASE === 'pending' ? PRICE_USDM : 0n
const EXPIRE_PRE_COUNT = EXPIRE_CASE === 'pending' ? 1n : 0n
const EXPIRE_PRE_LIABILITIES = EXPIRE_PAYOUT_USDM
// This trace exercises EXPIRE only. Bind the validator to the same explicit
// synthetic Oracle State singleton identity used by the other Yaci fixtures;
// this is not evidence of a live or authoritative Oracle.
const ORACLE_STATE_TOKEN_NAME_HEX = '4f5241434c45'
const MAINCHAIN_REF = new Uint8Array(32)
const GAME_VERSION = new TextEncoder().encode('V1')

function c(index: number, fields: any[] = []): any {
  return new Constr(index, fields)
}


/**
 * Lucid 0.6.5 records scripts from readFrom(), but its collectFrom() path
 * constructs PlutusScriptWitness.new_script(script). For this local-ledger
 * conformance trace, switch only the two known reference-backed spend hashes
 * to the CML reference witness constructor. Keep all other scripts on Lucid's
 * original path and restore the constructor immediately after completion.
 */
async function completeWithReferenceScriptWitnesses<T>(
  expectedScriptHashes: string[],
  build: () => Promise<T>,
): Promise<T> {
  const expected = new Set(expectedScriptHashes.map((hash) => hash.toLowerCase()))
  const witnessClass = CML.PlutusScriptWitness as unknown as {
    new_script: (script: any) => any
    new_ref: (hash: any) => any
  }
  if (typeof witnessClass.new_ref !== 'function') {
    throw new Error('CML PlutusScriptWitness.new_ref is unavailable in the pinned Lucid runtime')
  }
  const descriptor = Object.getOwnPropertyDescriptor(witnessClass, 'new_script')
  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new Error('CML PlutusScriptWitness.new_script is not patchable for the bounded reference-witness probe')
  }
  const originalNewScript = descriptor.value as (script: any) => any
  const referenced = new Set<string>()

  Object.defineProperty(witnessClass, 'new_script', {
    ...descriptor,
    value: (script: any) => {
      const hash = script.hash()
      const hashHex = hash.to_hex().toLowerCase()
      if (!expected.has(hashHex)) {
        return originalNewScript.call(witnessClass, script)
      }
      referenced.add(hashHex)
      console.log(JSON.stringify({
        expireReferenceWitnessIntercepted: hashHex,
        scriptBytes: typeof script.to_bytes === 'function' ? script.to_bytes().length : null,
      }))
      return witnessClass.new_ref(hash)
    },
  })

  try {
    const result = await build()
    const missing = [...expected].filter((hash) => !referenced.has(hash))
    if (missing.length > 0) {
      throw new Error(
        'Lucid did not route every EXPIRE script through a reference witness: ' +
        missing.join(', '),
      )
    }
    console.log(JSON.stringify({
      expireReferenceWitnesses: 'CML.new_ref',
      referencedScriptHashes: [...referenced].sort(),
      inlineFallbackForExpectedScripts: false,
    }))
    return result
  } finally {
    Object.defineProperty(witnessClass, 'new_script', descriptor)
  }
}

function hashJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? v.toString() : v))
    .digest('hex')
}


type ExpireBuilderPhase = 'complete' | 'sign'

function cborHexByteLength(serialized: unknown): number | null {
  if (typeof serialized !== 'string') return null
  const hex = serialized.startsWith('0x') ? serialized.slice(2) : serialized
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) return null
  return hex.length / 2
}

function completedCandidateCbor(candidate: unknown): { bytes: number | null; source: string } {
  const value = candidate as {
    toCBOR?: () => string
    toTransaction?: () => { to_bytes?: () => Uint8Array }
  } | null
  if (value && typeof value.toCBOR === 'function') {
    return { bytes: cborHexByteLength(value.toCBOR()), source: 'toCBOR' }
  }
  if (value && typeof value.toTransaction === 'function') {
    const transaction = value.toTransaction()
    if (typeof transaction.to_bytes === 'function') {
      return { bytes: transaction.to_bytes().length, source: 'toTransaction().to_bytes()' }
    }
  }
  return { bytes: null, source: 'unavailable' }
}

async function traceExpireBuilder<T>(
  stage: string,
  phase: ExpireBuilderPhase,
  operation: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now()
  console.log(JSON.stringify({
    expireBuilderDiagnostic: 'start',
    stage,
    phase,
    transactionSizeLimitBytes: 16_384,
  }))
  try {
    const candidate = await operation()
    let measurement: { bytes: number | null; source: string }
    let measurementError: string | undefined
    try {
      measurement = completedCandidateCbor(candidate)
    } catch (error) {
      measurement = { bytes: null, source: 'measurement-error' }
      measurementError = error instanceof Error ? error.message : String(error)
    }
    console.log(JSON.stringify({
      expireBuilderDiagnostic: 'success',
      stage,
      phase,
      elapsedMs: Date.now() - startedAt,
      cborBytes: measurement.bytes,
      cborMeasurement: measurement.source,
      bytesOverCardanoLimit: measurement.bytes === null ? null : Math.max(0, measurement.bytes - 16_384),
      transactionSizeLimitBytes: 16_384,
      ...(measurementError ? { measurementError } : {}),
    }))
    return candidate
  } catch (error) {
    console.error(JSON.stringify({
      expireBuilderDiagnostic: 'failure',
      stage,
      phase,
      elapsedMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: (error instanceof Error ? error.message : String(error)).slice(0, 2000),
      transactionSizeLimitBytes: 16_384,
      outcome: 'rethrow-original-error',
    }))
    throw error
  }
}

function recordExpireCborSerialization(stage: string, serialized: string): string {
  const bytes = cborHexByteLength(serialized)
  console.log(JSON.stringify({
    expireBuilderDiagnostic: 'serialized-cbor',
    stage,
    cborBytes: bytes,
    bytesOverCardanoLimit: bytes === null ? null : Math.max(0, bytes - 16_384),
    transactionSizeLimitBytes: 16_384,
  }))
  return serialized
}

function expireScriptDiagnostic(name: string, script: Script | undefined) {
  if (!script) return { name, present: false, scriptHash: null, scriptBytes: null }
  return {
    name,
    present: true,
    type: script.type,
    scriptHash: validatorToScriptHash(script).toLowerCase(),
    scriptBytes: Buffer.from(script.script, 'hex').length,
  }
}

/**
 * Inspect the outer definite-length CBOR byte-string envelope without
 * altering the original script bytes. The raw hex is retained separately.
 */
function inspectCborByteString(hex: string) {
  const bytes = Buffer.from(hex, 'hex')
  if (bytes.length === 0) {
    return {
      present: false,
      encodedBytes: 0,
      majorType: null,
      additionalInfo: null,
      headerBytes: null,
      declaredPayloadBytes: null,
      availablePayloadBytes: 0,
      trailingBytes: null,
      payloadSha256: null,
    }
  }

  const initial = bytes[0]
  const majorType = initial >> 5
  const additionalInfo = initial & 0x1f
  let headerBytes = 1
  let declaredPayloadBytes: bigint | null = null

  if (additionalInfo < 24) {
    declaredPayloadBytes = BigInt(additionalInfo)
  } else if (additionalInfo === 24 && bytes.length >= 2) {
    declaredPayloadBytes = BigInt(bytes[1])
    headerBytes = 2
  } else if (additionalInfo === 25 && bytes.length >= 3) {
    declaredPayloadBytes = BigInt(bytes.readUInt16BE(1))
    headerBytes = 3
  } else if (additionalInfo === 26 && bytes.length >= 5) {
    declaredPayloadBytes = BigInt(bytes.readUInt32BE(1))
    headerBytes = 5
  } else if (additionalInfo === 27 && bytes.length >= 9) {
    declaredPayloadBytes = bytes.readBigUInt64BE(1)
    headerBytes = 9
  }

  const availablePayloadBytes = Math.max(0, bytes.length - headerBytes)
  const safeLength = declaredPayloadBytes !== null &&
    declaredPayloadBytes <= BigInt(Number.MAX_SAFE_INTEGER)
  const complete = majorType === 2 &&
    safeLength &&
    BigInt(availablePayloadBytes) >= declaredPayloadBytes!
  const payload = complete
    ? bytes.subarray(headerBytes, headerBytes + Number(declaredPayloadBytes))
    : null

  return {
    present: true,
    encodedBytes: bytes.length,
    majorType,
    additionalInfo,
    headerBytes,
    declaredPayloadBytes: declaredPayloadBytes?.toString() ?? null,
    availablePayloadBytes,
    trailingBytes: complete
      ? availablePayloadBytes - Number(declaredPayloadBytes)
      : null,
    payloadSha256: payload
      ? createHash('sha256').update(payload).digest('hex')
      : null,
  }
}
function ref(u: UTxO): string {
  return u.txHash + '#' + u.outputIndex
}

function nativePolicy(keyHash: string): Script {
  return scriptFromNative({
    type: 'all',
    scripts: [{ type: 'sig', keyHash }],
  } as any)
}

function datumFields(utxo: UTxO): any[] {
  const raw = utxo.datum
  if (!raw) throw new Error('UTxO datum missing')
  const parsed = Data.from(raw) as any
  if (!parsed || !Array.isArray(parsed.fields)) {
    throw new Error('UTxO datum fields unavailable')
  }
  return parsed.fields
}

function bigintField(fields: any[], index: number): bigint {
  const value = fields[index]
  const candidate =
    typeof value === 'bigint'
      ? value
      : value && typeof value === 'object' && value.int !== undefined
        ? BigInt(value.int)
        : null
  if (candidate === null) throw new Error('datum integer field missing: ' + index)
  return candidate
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  label: string,
): Promise<T> {
  for (let i = 0; i < 30; i += 1) {
    const value = await fn()
    if (predicate(value)) return value
    await wait(1000)
  }
  throw new Error('Timed out waiting for ' + label)
}

function poolDatum(
  prizeHash: string,
  liquidity: bigint,
  reserve: bigint,
  count: bigint,
  liabilities: bigint,
): any {
  return c(0, [
    liquidity,
    liabilities,
    reserve,
    count,
    0n,
    10_000n,
    0n,
    prizeHash,
  ])
}

function prizeDatum(
  ticketPolicyId: string,
  prizePoolHash: string,
  issuedAt: bigint,
  expiresAt: bigint,
): any {
  const revealed = EXPIRE_CASE !== 'pending'
  const summaryTier = Math.max(EXPIRE_ROW1_TIER, EXPIRE_ROW2_TIER)
  return c(0, [
    ticketPolicyId,
    TICKET_NAME_HEX,
    '22'.repeat(32),
    PRICE_USDM,
    '33'.repeat(32),
    '5641',
    1n,
    EXPIRE_PAYOUT_USDM,
    '',
    '',
    c(revealed ? 1 : 0),
    revealed ? '66'.repeat(32) : '',
    BigInt(summaryTier),
    c(0, [0n, 0n, '00'.repeat(32), '5641']),
    c(revealed ? 1 : 0),
    revealed ? '77'.repeat(32) : '',
    '44'.repeat(32),
    '55'.repeat(32),
    prizePoolHash,
    issuedAt,
    expiresAt,
    BigInt(EXPIRE_ROW1_TIER),
    BigInt(EXPIRE_ROW2_TIER),
  ])
}

const provider = new Blockfrost(API, '')

type EvaluationUTxO = {
  txHash: string
  outputIndex: number
  address: string
  assets: Record<string, bigint>
  datumHash?: string | null
  datum?: string | null
  scriptRef?: { type: string; script: string } | null
}
type EvaluationRedeemer = {
  redeemer_tag: string
  redeemer_index: number
  ex_units: { mem: number; steps: number }
}
type YaciEvaluationResponse = {
  fault?: unknown
  result?: { EvaluationResult?: Record<string, { memory: number; steps: number }> }
  message?: string
}

const latestBlock = await (await fetch(API + '/blocks/latest')).json() as {
  slot: number
  time: number
}
if (
  !Number.isSafeInteger(latestBlock.slot) ||
  latestBlock.slot < 0 ||
  !Number.isSafeInteger(latestBlock.time) ||
  latestBlock.time <= 0
) {
  throw new Error('Yaci /blocks/latest lacks slot/time: ' + JSON.stringify(latestBlock))
}
const latestBlockTimeMs = latestBlock.time < 100_000_000_000
  ? latestBlock.time * 1000
  : latestBlock.time
if (!Number.isSafeInteger(latestBlockTimeMs) || latestBlockTimeMs <= 0) {
  throw new Error('Yaci /blocks/latest has invalid normalized time: ' + JSON.stringify(latestBlock))
}
const devnetSlotConfig = {
  zeroTime: latestBlockTimeMs,
  zeroSlot: latestBlock.slot,
  slotLength: 1000,
}
console.log(JSON.stringify({
  expireTimeAnchor: 'yaci-latest-block',
  latestBlockSlot: latestBlock.slot,
  latestBlockTimeRaw: latestBlock.time,
  latestBlockTimeMs,
  slotLengthMs: 1000,
}))

const EX_UNITS_SAFETY_MARGIN_BPS = 100
const EX_UNITS_DENOMINATOR = 10_000n
let expireEvaluationEvidence: {
  measured: EvaluationRedeemer[]
  budgeted: EvaluationRedeemer[]
  safetyMarginBps: number
} | null = null

function withExUnitsSafetyMargin(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Yaci returned invalid execution units: ' + String(value))
  }
  return Number(
    (BigInt(value) * (EX_UNITS_DENOMINATOR + BigInt(EX_UNITS_SAFETY_MARGIN_BPS))
      + EX_UNITS_DENOMINATOR - 1n) / EX_UNITS_DENOMINATOR,
  )
}

async function evaluateYaciTx(
  tx: string,
  additionalUTxOs: EvaluationUTxO[] = [],
): Promise<EvaluationRedeemer[]> {
  const cbor = tx.startsWith('0x') ? tx.slice(2) : tx
  if (!/^[0-9a-fA-F]+$/.test(cbor) || cbor.length % 2 !== 0) {
    throw new Error('Yaci received invalid transaction CBOR: ' + cbor.slice(0, 80))
  }

  const additionalUtxoSet = additionalUTxOs.map((utxo) => [
    { txId: utxo.txHash, index: utxo.outputIndex },
    {
      address: utxo.address,
      value: {
        ada: { lovelace: Number(utxo.assets.lovelace ?? 0n) },
        ...Object.entries(utxo.assets)
          .filter(([unit]) => unit !== 'lovelace')
          .reduce<Record<string, Record<string, number>>>((assets, [unit, amount]) => {
            const policyId = unit.slice(0, 56)
            const assetName = unit.slice(56)
            assets[policyId] ??= {}
            assets[policyId][assetName] = Number(amount)
            return assets
          }, {}),
      },
      ...(utxo.datumHash ? { datumHash: utxo.datumHash } : {}),
      ...(utxo.datum ? { datum: utxo.datum } : {}),
      ...(utxo.scriptRef
        ? {
            script: {
              [utxo.scriptRef.type === 'PlutusV1'
                ? 'plutus:v1'
                : utxo.scriptRef.type === 'PlutusV3'
                  ? 'plutus:v3'
                  : 'plutus:v2']: utxo.scriptRef.script,
            },
          }
        : {}),
    },
  ])

  const response = await fetch(API + '/utils/txs/evaluate/utxos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cbor,
      ...(additionalUtxoSet.length ? { additionalUtxoSet } : {}),
    }),
  })
  const raw = await response.text()
  let parsed: YaciEvaluationResponse
  try {
    parsed = JSON.parse(raw) as YaciEvaluationResponse
  } catch {
    parsed = { message: raw }
  }
  if (!response.ok || parsed.fault || !parsed.result?.EvaluationResult) {
    throw new Error(
      `Yaci EXPIRE evaluation failed (HTTP ${response.status}): ${raw.slice(0, 3500)}`,
    )
  }
  return Object.entries(parsed.result.EvaluationResult).map(([pointer, data]) => {
    const [redeemer_tag, redeemer_index] = pointer.split(':')
    return {
      redeemer_tag,
      redeemer_index: Number(redeemer_index),
      ex_units: { mem: Number(data.memory), steps: Number(data.steps) },
    }
  })
}

const providerWithEvaluation = provider as Blockfrost & {
  evaluateTx: (tx: string, additionalUTxOs?: EvaluationUTxO[]) => Promise<EvaluationRedeemer[]>
}
providerWithEvaluation.evaluateTx = async (tx, additionalUTxOs = []) => {
  const measured = await evaluateYaciTx(tx, additionalUTxOs)
  const budgeted = measured.map((redeemer) => ({
    ...redeemer,
    ex_units: {
      mem: withExUnitsSafetyMargin(redeemer.ex_units.mem),
      steps: withExUnitsSafetyMargin(redeemer.ex_units.steps),
    },
  }))
  if (budgeted.length > 0) {
    const pointers = budgeted.map((x) => `${x.redeemer_tag}:${x.redeemer_index}`).sort()
    const spendIndices = budgeted.map((x) => x.redeemer_index)
    if (
      budgeted.length !== 2 ||
      budgeted.some((x) =>
        x.redeemer_tag !== 'spend' ||
        !Number.isSafeInteger(x.redeemer_index) ||
        x.redeemer_index < 0
      ) ||
      new Set(spendIndices).size !== 2
    ) {
      throw new Error('EXPIRE expected exactly two distinct spending redeemers with valid input indices; got ' + JSON.stringify(budgeted))
    }
    // Redeemer indices are assigned against the full sorted transaction input
    // list, including any wallet input added during coin selection. Do not
    // assume that the two script inputs occupy indices 0 and 1.
  }
  expireEvaluationEvidence = {
    measured,
    budgeted,
    safetyMarginBps: EX_UNITS_SAFETY_MARGIN_BPS,
  }
  console.log(JSON.stringify({
    expireDiag: 'yaci-evaluate',
    measured,
    budgeted,
    safetyMarginBps: EX_UNITS_SAFETY_MARGIN_BPS,
  }))
  return budgeted
}

const lucid = await Lucid(providerWithEvaluation, 'Preprod', {
  slotConfig: devnetSlotConfig,
})
lucid.selectWallet.fromSeed(SEED)

const address = await lucid.wallet().address()

// Keep reference-script UTxOs outside the spending wallet's coin-selection
// address. Otherwise they can be selected as funding inputs while also being
// supplied to readFrom(), invalidating the intended reference-script binding.
const referenceLucid = await Lucid(providerWithEvaluation, 'Preprod', {
  slotConfig: devnetSlotConfig,
})
referenceLucid.selectWallet.fromSeed(SEED, { accountIndex: 1 })
const referenceAddress = await referenceLucid.wallet().address()
if (referenceAddress === address) {
  throw new Error('reference-script receiver must be isolated from the spending wallet')
}
const details = getAddressDetails(address)
const keyHash = details.paymentCredential?.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')

const testPolicy = nativePolicy(keyHash)
const testPolicyId = mintingPolicyToId(testPolicy)
const poolTokenNameHex = '504f4f4c'
const liquidityTokenNameHex = '5553444d'
const poolUnit = testPolicyId + poolTokenNameHex
const liquidityUnit = testPolicyId + liquidityTokenNameHex
const ticketUnit = testPolicyId + TICKET_NAME_HEX

const scripts = buildScriptsFromLucid(
  {
    ...lucid,
    utils: {
      validatorToScriptHash,
      mintingPolicyToId,
      validatorToAddress: (script: Script) => validatorToAddress('Preprod', script),
    },
  },
  defaultPrizeTable,
  keyHash,
  testPolicyId,
  ORACLE_STATE_TOKEN_NAME_HEX,
  testPolicyId,
  poolTokenNameHex,
)

// Preserve byte-for-byte provenance from the factory generated earlier in this
// CI job to the exact Haskell V2 script returned by the existing builder.
// This is diagnostic only: it does not re-apply parameters or alter the script.
const prizeFactoryCborHex = prizeValidatorFactory.script
const haskellV2PrizeCborHex = scripts.prizeValidator.script
const prizeFactoryBytes = Buffer.from(prizeFactoryCborHex, 'hex')
const haskellV2PrizeBytes = Buffer.from(haskellV2PrizeCborHex, 'hex')
const haskellV2PrizeHash = validatorToScriptHash(scripts.prizeValidator).toLowerCase()
const sizeProvenance = {
  schema: 'immortal.cardano.prize-validator-size-provenance.v1',
  purpose: 'same-run Haskell V2 factory-to-parameterized-script byte provenance',
  source: {
    repository: process.env.GITHUB_REPOSITORY ?? null,
    workflow: process.env.GITHUB_WORKFLOW ?? null,
    ref: process.env.GITHUB_REF ?? null,
    commitSha: process.env.GITHUB_SHA ?? null,
    runId: process.env.GITHUB_RUN_ID ?? null,
  },
  execution: {
    environment: 'local-yaci-devnet',
    selectedExpireBackend: EXPIRE_BACKEND,
    expireCase: EXPIRE_CASE,
    capturedValidator: 'canonical-haskell-v2-before-any-aiken-override',
    transactionSizeLimitBytes: 16_384,
  },
  parameters: {
    registryScriptHashHex: scripts.registryHash,
    prizeTable: {
      tier1: defaultPrizeTable.tier1,
      tier2: defaultPrizeTable.tier2,
      tier3: defaultPrizeTable.tier3,
      tier4: defaultPrizeTable.tier4,
      tier5: defaultPrizeTable.tier5,
    },
    oracleStatePolicyIdHex: testPolicyId,
    oracleStateTokenNameHex: ORACLE_STATE_TOKEN_NAME_HEX,
    oraclePublisherPkhHex: keyHash,
  },
  factory: {
    type: prizeValidatorFactory.type,
    byteLength: prizeFactoryBytes.length,
    sha256: createHash('sha256').update(prizeFactoryBytes).digest('hex'),
    cborByteStringEnvelope: inspectCborByteString(prizeFactoryCborHex),
    cborHex: prizeFactoryCborHex,
  },
  parameterizedPrizeValidator: {
    type: scripts.prizeValidator.type,
    byteLength: haskellV2PrizeBytes.length,
    sha256: createHash('sha256').update(haskellV2PrizeBytes).digest('hex'),
    scriptHash: haskellV2PrizeHash,
    cborByteStringEnvelope: inspectCborByteString(haskellV2PrizeCborHex),
    cborHex: haskellV2PrizeCborHex,
  },
  localOnly: true,
}
const sizeProvenancePath =
  `audit/yaci-evidence/expire-script-size-provenance-haskell-v2-${EXPIRE_CASE}.json`
writeFileSync(sizeProvenancePath, JSON.stringify(sizeProvenance, null, 2))
console.log(JSON.stringify({
  expireScriptSizeProvenance: {
    path: sizeProvenancePath,
    sourceSha: sizeProvenance.source.commitSha,
    factoryBytes: sizeProvenance.factory.byteLength,
    factorySha256: sizeProvenance.factory.sha256,
    parameterizedBytes: sizeProvenance.parameterizedPrizeValidator.byteLength,
    parameterizedSha256: sizeProvenance.parameterizedPrizeValidator.sha256,
    parameterizedScriptHash: sizeProvenance.parameterizedPrizeValidator.scriptHash,
    localOnly: true,
  },
}, null, 2))

/**
 * Select the Aiken Plutus V3 Expire implementation only when explicitly enabled
 * by the local integration workflow. The existing B1PrizePool validator remains
 * Plutus V2 and is rebound to the selected Prize validator hash.
 */
const aikenExpireV3 = process.env.IMMORTAL_EXPIRE_AIKEN_V3 === '1'
if (aikenExpireV3) {
  const blueprint = JSON.parse(readFileSync('poc/aiken-reveal-parity/plutus.json', 'utf8')) as {
    preamble?: { plutusVersion?: string }
    validators?: Array<{ title?: string; compiledCode?: string; hash?: string }>
  }
  if (blueprint.preamble?.plutusVersion !== 'v3') {
    throw new Error('Aiken Expire requires a Plutus V3 blueprint')
  }
  const matches = (blueprint.validators ?? []).filter(v => v.title === 'reveal.pre_rich_reveal.spend')
  if (matches.length !== 1 || !matches[0].compiledCode || !matches[0].hash) {
    throw new Error('Expected one compiled Aiken Prize validator for Expire')
  }
  const aikenUnparameterizedScript = { type: 'PlutusV3', script: matches[0].compiledCode } as Script
  const aikenBlueprintHash = validatorToScriptHash(aikenUnparameterizedScript).toLowerCase()
  if (aikenBlueprintHash !== matches[0].hash.toLowerCase()) {
    throw new Error('Aiken blueprint and Lucid unparameterized Expire hashes do not match')
  }
  const aikenPrizeScript = {
    type: 'PlutusV3',
    script: evolutionApplyParamsToScript(
      matches[0].compiledCode,
      [testPolicyId, ORACLE_STATE_TOKEN_NAME_HEX, keyHash],
    ),
  } as Script
  const aikenPrizeHash = validatorToScriptHash(aikenPrizeScript).toLowerCase()
  const aikenBoundPoolScript = buildB1PrizePool(
    aikenPrizeHash,
    keyHash,
    testPolicyId,
    ORACLE_STATE_TOKEN_NAME_HEX,
    testPolicyId,
    poolTokenNameHex,
  ) as unknown as Script
  const aikenBoundPoolHash = validatorToScriptHash(aikenBoundPoolScript).toLowerCase()
  Object.assign(scripts, {
    prizeValidator: aikenPrizeScript,
    prizeHash: aikenPrizeHash,
    b1PrizePool: aikenBoundPoolScript,
    b1PrizePoolHash: aikenBoundPoolHash,
    prizeAddress: validatorToAddress('Preprod', aikenPrizeScript),
    b1PrizePoolAddress: validatorToAddress('Preprod', aikenBoundPoolScript),
  })
  console.log(JSON.stringify({
    aikenExpireDiag: 'aiken-v3-selected',
    plutusVersion: 'v3',
    aikenPrizeHash,
    aikenPrizeScriptBytes: Buffer.from(aikenPrizeScript.script, 'hex').length,
    boundPoolHash: aikenBoundPoolHash,
    boundPoolScriptType: aikenBoundPoolScript.type,
    boundPoolScriptBytes: Buffer.from(aikenBoundPoolScript.script, 'hex').length,
    transactionSizeLimitBytes: 16384,
    localOnly: true,
  }, null, 2))
}

if (!scripts.prizeAddress || !scripts.b1PrizePoolAddress) {
  throw new Error('failed to derive Prize/B1PrizePool addresses')
}

console.log(JSON.stringify({
  expireScriptDiagnostics: {
    backend: EXPIRE_BACKEND,
    expireCase: EXPIRE_CASE,
    prizeValidator: expireScriptDiagnostic('parameterized-prize-validator', scripts.prizeValidator),
    b1PrizePool: expireScriptDiagnostic('parameterized-b1-prize-pool', scripts.b1PrizePool),
  },
  transactionSizeLimitBytes: 16_384,
}, null, 2))

// EXPIRE evaluates pdExpiresAt against the transaction validity range; it
// does not establish the DApp/profile expiry horizon. Keep this fixture focused
// on the EXPIRE transition and align its expiry marker with recent Yaci time so
// the validity lower bound remains inside the node's available era-history.
const expiresAt = BigInt(latestBlockTimeMs) - 10_000n
const issuedAt = 0n // placeholder for this synthetic pre-state, not issuance evidence

const prePrizeDatum = prizeDatum(
  testPolicyId,
  scripts.b1PrizePoolHash,
  issuedAt,
  expiresAt,
)

const prePoolDatum = poolDatum(
  scripts.prizeHash,
  TOTAL_LIQUIDITY_USDM,
  EXPIRE_PRE_RESERVE,
  EXPIRE_PRE_COUNT,
  EXPIRE_PRE_LIABILITIES,
)

const postPoolDatum = poolDatum(
  scripts.prizeHash,
  TOTAL_LIQUIDITY_USDM,
  0n,
  0n,
  0n,
)

const bootstrap = await traceExpireBuilder('bootstrap-mint-and-fixture-outputs', 'complete', () => lucid
  .newTx()
  .mintAssets(
    {
      [poolUnit]: 1n,
      [liquidityUnit]: TOTAL_LIQUIDITY_USDM,
      [ticketUnit]: 1n,
    },
    Data.void(),
  )
  .attach.MintingPolicy(testPolicy)
  .pay.ToContract(
    scripts.b1PrizePoolAddress as string,
    { kind: 'inline', value: Data.to(prePoolDatum) },
    {
      lovelace: 5_000_000n,
      [poolUnit]: 1n,
      [liquidityUnit]: TOTAL_LIQUIDITY_USDM,
    },
  )
  .pay.ToContract(
    scripts.prizeAddress as string,
    { kind: 'inline', value: Data.to(prePrizeDatum) },
    { lovelace: 3_000_000n },
  )
  .pay.ToAddress(address, { lovelace: 2_000_000n, [ticketUnit]: 1n })
  .addSigner(address)
  .complete())

const bootstrapSigned = await traceExpireBuilder(
  'bootstrap-mint-and-fixture-outputs',
  'sign',
  () => bootstrap.sign.withWallet().complete(),
)
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)

const prizeUtxos = await waitFor(
  () => lucid.utxosAt(scripts.prizeAddress as string),
  (xs) => xs.some((u) => u.txHash === bootstrapHash && u.assets.lovelace === 3_000_000n),
  'bootstrapped expired Prize UTxO',
)
const poolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.txHash === bootstrapHash && u.assets[poolUnit] === 1n),
  'bootstrapped B1PrizePool UTxO',
)
const walletUtxos = await lucid.utxosAt(address)
if (!walletUtxos.some((u) => u.assets[ticketUnit] === 1n)) {
  throw new Error('ticket NFT was not delivered to the holder')
}

const prizeUtxo = prizeUtxos.find(
  (u) => u.txHash === bootstrapHash && u.assets.lovelace === 3_000_000n,
)
const poolUtxo = poolUtxos.find(
  (u) => u.txHash === bootstrapHash && u.assets[poolUnit] === 1n,
)
if (!prizeUtxo || !poolUtxo) {
  throw new Error('EXPIRE bootstrap did not materialize its exact Prize and Pool outpoints')
}

// EXPIRE uses the published reference scripts below. Lucid's
// attach.SpendingValidator registers each validator in config.scripts so
// collectFrom can resolve the script; the CML witness shim below turns the
// resulting Plutus witness into Ref(hash), so the validator bytes are not
// serialized in the spending transaction.
const prizeReferenceTx = await traceExpireBuilder(
  'publish-prize-reference-script',
  'complete',
  () => lucid
    .newTx()
    .pay.ToAddressWithData(
      referenceAddress,
      undefined,
      { lovelace: 2_000_000n },
      scripts.prizeValidator as Script,
    )
    .complete({ localUPLCEval: false }),
)
const prizeReferenceSigned = await traceExpireBuilder(
  'publish-prize-reference-script',
  'sign',
  () => prizeReferenceTx.sign.withWallet().complete(),
)
const prizeReferenceHash = await prizeReferenceSigned.submit()
await lucid.awaitTx(prizeReferenceHash)

const poolReferenceTx = await traceExpireBuilder(
  'publish-b1-prize-pool-reference-script',
  'complete',
  () => lucid
    .newTx()
    .pay.ToAddressWithData(
      referenceAddress,
      undefined,
      { lovelace: 2_000_000n },
      scripts.b1PrizePool as Script,
    )
    .complete({ localUPLCEval: false }),
)
const poolReferenceSigned = await traceExpireBuilder(
  'publish-b1-prize-pool-reference-script',
  'sign',
  () => poolReferenceTx.sign.withWallet().complete(),
)
const poolReferenceHash = await poolReferenceSigned.submit()
await lucid.awaitTx(poolReferenceHash)

const referenceUtxos = await lucid.utxosAt(referenceAddress)
const prizeReferenceUtxo = referenceUtxos.find((u) => u.txHash === prizeReferenceHash)
const poolReferenceUtxo = referenceUtxos.find((u) => u.txHash === poolReferenceHash)
if (!prizeReferenceUtxo || !poolReferenceUtxo) {
  throw new Error('EXPIRE reference-script UTxOs were not materialized on Yaci')
}

// Preserve the exact ledger output references while repairing only a missing
// provider-decoded scriptRef property, as in the existing Reveal trace.
const prizeReferenceInput = {
  ...prizeReferenceUtxo,
  scriptRef: prizeReferenceUtxo.scriptRef ?? scripts.prizeValidator,
}
const poolReferenceInput = {
  ...poolReferenceUtxo,
  scriptRef: poolReferenceUtxo.scriptRef ?? scripts.b1PrizePool,
}
if (
  validatorToScriptHash(prizeReferenceInput.scriptRef as Script) !==
    validatorToScriptHash(scripts.prizeValidator as Script) ||
  validatorToScriptHash(poolReferenceInput.scriptRef as Script) !==
    validatorToScriptHash(scripts.b1PrizePool as Script)
) {
  throw new Error('EXPIRE reference-script hash mismatch')
}

const nonLovelacePrizeAssets = Object.entries(prizeUtxo.assets).filter(
  ([unit, quantity]) => unit !== 'lovelace' && quantity !== 0n,
)
if (nonLovelacePrizeAssets.length > 0) {
  throw new Error('expired Prize UTxO unexpectedly carries non-ADA assets')
}

const preStateFingerprint = hashJson({
  prizeRef: ref(prizeUtxo),
  prizeDatum: prizeUtxo.datum,
  poolRef: ref(poolUtxo),
  poolDatum: poolUtxo.datum,
})

console.log(JSON.stringify({
  expireBuild: 'begin',
  expireCase: EXPIRE_CASE,
  expireBackend: EXPIRE_BACKEND,
  crystallizedPayoutUsdm: EXPIRE_PAYOUT_USDM.toString(),
  prizeInput: ref(prizeUtxo),
  poolInput: ref(poolUtxo),
  expiresAt: expiresAt.toString(),
  latestBlockSlot: latestBlock.slot,
  latestBlockTimeMs,
}))
const expireTx = await completeWithReferenceScriptWitnesses(
  [
    validatorToScriptHash(scripts.prizeValidator as Script),
    validatorToScriptHash(scripts.b1PrizePool as Script),
  ],
  () => traceExpireBuilder(
    `expire-spend-${EXPIRE_BACKEND}-${EXPIRE_CASE}`,
    'complete',
    () => lucid
      .newTx()
      .readFrom([prizeReferenceInput, poolReferenceInput])
      .attach.SpendingValidator(scripts.prizeValidator as Script)
      .attach.SpendingValidator(scripts.b1PrizePool as Script)
      .collectFrom([prizeUtxo], Data.to(c(3)))
      .collectFrom([poolUtxo], Data.to(c(4)))
      .pay.ToAddress(address, {
        lovelace: prizeUtxo.assets.lovelace ?? 0n,
      })
      .pay.ToContract(
        scripts.b1PrizePoolAddress as string,
        { kind: 'inline', value: Data.to(postPoolDatum) },
        poolUtxo.assets,
      )
      .addSigner(address)
      .validFrom(Number(expiresAt + 1_000n))
      .complete({ localUPLCEval: false }),
  ),
)

// This fixture qualifies the on-chain EXPIRE transition only. It does not
// claim an authoritative production Issue-admission witness or bypass that gate.
const signedExpire = await traceExpireBuilder(
  `expire-spend-${EXPIRE_BACKEND}-${EXPIRE_CASE}`,
  'sign',
  () => expireTx.sign.withWallet().complete(),
)
const txHash = await signedExpire.submit()
const txCbor = recordExpireCborSerialization(
  `expire-spend-${EXPIRE_BACKEND}-${EXPIRE_CASE}`,
  signedExpire.toCBOR(),
)
await lucid.awaitTx(txHash)

const postPoolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.txHash === txHash && u.assets[poolUnit] === 1n),
  'expired B1PrizePool UTxO',
)

const postPool = postPoolUtxos.find(
  (u) => u.txHash === txHash && u.assets[poolUnit] === 1n,
) as UTxO

const prePoolFields = datumFields(poolUtxo)
if (
  bigintField(prePoolFields, 1) !== EXPIRE_PRE_LIABILITIES ||
  bigintField(prePoolFields, 2) !== EXPIRE_PRE_RESERVE ||
  bigintField(prePoolFields, 3) !== EXPIRE_PRE_COUNT
) {
  throw new Error('EXPIRE fixture pre-state accounting does not match the selected case')
}
const poolAssetsAsEntries = (assets: Record<string, bigint>) =>
  Object.entries(assets)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([unit, quantity]) => [unit, quantity.toString()])
if (
  JSON.stringify(poolAssetsAsEntries(poolUtxo.assets)) !==
  JSON.stringify(poolAssetsAsEntries(postPool.assets))
) {
  throw new Error('EXPIRE changed the physical B1PrizePool UTxO value')
}

// Check only outputs created by this EXPIRE transaction. Another trace may
// legitimately leave a separate Prize UTxO at the same validator address.
const expirePrizeOutputs = (await lucid.utxosAt(
  scripts.prizeAddress as string,
)).filter((u) => u.txHash === txHash)

if (expirePrizeOutputs.length !== 0) {
  throw new Error(
    'EXPIRE unexpectedly created a continuing Prize output: ' +
    expirePrizeOutputs.map(ref).join(', '),
  )
}

const postPoolFields = datumFields(postPool)
const postLiquidity = bigintField(postPoolFields, 0)
const postLiability = bigintField(postPoolFields, 1)
const postReserve = bigintField(postPoolFields, 2)
const postCount = bigintField(postPoolFields, 3)

if (postLiquidity !== TOTAL_LIQUIDITY_USDM) {
  throw new Error('EXPIRE changed total economic liquidity')
}
if (postLiability !== 0n) {
  throw new Error('EXPIRE created or preserved an unexpected liability')
}
if (postReserve !== 0n) {
  throw new Error('EXPIRE did not release the exact ticket reserve')
}
if (postCount !== 0n) {
  throw new Error('EXPIRE did not release exactly one unresolved ticket')
}

const walletAfter = await lucid.utxosAt(address)
const ticketQuantity = walletAfter.reduce(
  (sum, u) => sum + (u.assets[ticketUnit] ?? 0n),
  0n,
)
if (ticketQuantity !== 1n) {
  throw new Error('EXPIRE changed ticket NFT ownership/quantity')
}

const postStateFingerprint = hashJson({
  prizeRef: null,
  poolRef: ref(postPool),
  poolDatum: postPool.datum,
})

const actionFingerprint = hashJson({
  actionClass: 'EXPIRE',
  expireCase: EXPIRE_CASE,
  crystallizedPayoutUsdm: EXPIRE_PAYOUT_USDM,
  ticketInput: ref(prizeUtxo),
  poolInput: ref(poolUtxo),
  ticketPolicyId: testPolicyId,
  ticketNameHex: TICKET_NAME_HEX,
  priceUsdm: PRICE_USDM,
  expiresAt,
})

const evidence = {
  evidenceId: hashJson({
    fixtureId: `C3-YACI-EXPIRE-${EXPIRE_BACKEND.toUpperCase()}-${EXPIRE_CASE.toUpperCase()}`,
    actionFingerprint,
    preStateFingerprint,
    postStateFingerprint,
    transactionRef: txHash,
  }),
  fixtureId: `C3-YACI-EXPIRE-${EXPIRE_BACKEND.toUpperCase()}-${EXPIRE_CASE.toUpperCase()}`,
  actionClass: 'EXPIRE',
  protocolVersion: 'IMMORTAL-V3',
  profileVersion: 'PRE-RICH',
  adapterId: 'CARDANO-YACI',
  adapterVersion: 'yaci-devkit-0.12.0-beta5',
  environment: 'local-yaci-devnet',
  preStateFingerprint,
  postStateFingerprint,
  actionFingerprint,
  transactionRef: txHash,
}

const canonicalEvidence: CanonicalTransitionEvidence = evidence
assertCanonicalTransitionBinding(canonicalEvidence, {
  actionFingerprint,
  preStateFingerprint,
  postStateFingerprint,
  transactionRef: txHash,
})

let replayRejected = false
let replayError = ''
try {
  await signedExpire.submit()
} catch (error) {
  replayRejected = true
  replayError = error instanceof Error ? error.message : String(error)
}
if (!replayRejected) {
  throw new Error('stale/duplicate EXPIRE submission was unexpectedly accepted')
}

writeFileSync(
  `audit/yaci-evidence/expire-transition-${EXPIRE_BACKEND}-${EXPIRE_CASE}.json`,
  JSON.stringify({
    purpose: 'real-local-cardano-economic-expire',
    expireCase: EXPIRE_CASE,
    expireBackend: EXPIRE_BACKEND,
    bootstrapHash,
    transactionRef: txHash,
    txCbor,
    action: {
      actionClass: 'EXPIRE',
      expireCase: EXPIRE_CASE,
      crystallizedPayoutUsdm: EXPIRE_PAYOUT_USDM.toString(),
      priceUsdm: PRICE_USDM.toString(),
      expiresAt: expiresAt.toString(),
    },
    preState: {
      prizeRef: ref(prizeUtxo),
      poolRef: ref(poolUtxo),
      fingerprint: preStateFingerprint,
    },
    postState: {
      prizeRef: null,
      poolRef: ref(postPool),
      fingerprint: postStateFingerprint,
    },
    accounting: {
      totalLiquidity: postLiquidity.toString(),
      pendingLiabilities: postLiability.toString(),
      unresolvedReserve: postReserve.toString(),
      unresolvedTicketCount: postCount.toString(),
      ticketNftQuantity: ticketQuantity.toString(),
    },
    consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
    producedUtxos: [ref(postPool)],
    canonicalEvidence,
    yaciEvaluation: expireEvaluationEvidence,
    timeAnchor: {
      source: 'Yaci latest block',
      slot: latestBlock.slot,
      timeRaw: latestBlock.time,
      timeMs: latestBlockTimeMs,
      slotLengthMs: 1000,
      expiresAt: expiresAt.toString(),
      validFrom: (expiresAt + 1_000n).toString(),
      issuedAt: issuedAt.toString(),
    },
    replay: {
      rejected: replayRejected,
      error: replayError,
    },
  }, null, 2),
)

console.log(JSON.stringify({
  transactionRef: txHash,
  expireCase: EXPIRE_CASE,
  expireBackend: EXPIRE_BACKEND,
  crystallizedPayoutUsdm: EXPIRE_PAYOUT_USDM.toString(),
  bootstrapHash,
  consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
  producedUtxos: [ref(postPool)],
  ticketNftQuantity: ticketQuantity.toString(),
  replayRejected,
}, null, 2))
