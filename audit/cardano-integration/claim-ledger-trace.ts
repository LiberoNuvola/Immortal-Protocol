/**
 * C3 — real Yaci/Cardano Claim transition trace.
 *
 * Exercises a synthetic, explicitly non-production Revealed Prize state,
 * an authenticated fixture Oracle State reference input and B1PrizePool
 * accounting. This does not prove the production Issue-admission path.
 */

import { CML, Constr, Data, Lucid, Blockfrost, getAddressDetails, scriptFromNative, mintingPolicyToId, validatorToScriptHash, validatorToAddress, applyParamsToScript as evolutionApplyParamsToScript, type Script, type UTxO } from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import { beaconRegistryValidator, buildB1PrizePool, buildScriptsFromLucid, prizeTableToData, prizeValidatorFactory } from '../../src/loadValidator'
import { createCardanoExecutionAdapter } from '../../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import {
  defaultPrizeTable,
  rowPayoutTotal,
} from '../../src/gameRules'
import { toHex } from '../../src/beacon'
import { bindPublishedReferenceScript } from './revealReferenceScripts'
import {
  assertCardanoObservedTransitionBinding,
  type CardanoObservedTransitionEvidence,
} from '../../Adapter/CARDANO/observation/CardanoObservedTransitionEvidence'

const API = 'http://127.0.0.1:8080/api/v1'
const SEED =
  'test test test test test test test test test test test test test test test test test test test test test test test sauce'

const PRICE_USDM = 100n
const TICKET_NAME_HEX = '52462d5245414c2d52455645414c'
const ORACLE_STATE_TOKEN_NAME_HEX = '4f5241434c45' // ORACLE
const MAINCHAIN_REF = new Uint8Array(32)
const MATERIOS_CONTEXT = new Uint8Array(32)
const GAME_VERSION = new TextEncoder().encode('V1')

type NativeScript = { type: 'sig'; keyHash: string } | {
  type: 'all'
  scripts: NativeScript[]
}

function nativePolicy(lucid: any, keyHash: string): Script {
  return scriptFromNative({
    type: 'all',
    scripts: [{ type: 'sig', keyHash }],
  } as NativeScript)
}

function hashJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? v.toString() : v))
    .digest('hex')
}

function ref(u: UTxO): string {
  return u.txHash + '#' + u.outputIndex
}

function c(index: number, fields: any[] = []): any {
  return new Constr(index, fields)
}

function prizeDatum(
  ticketPolicyId: string,
  prizePoolHash: string,
  playerCommitmentHex: string,
  commitmentHex: string,
  beaconValueHex: string,
  issuedAt: bigint,
  expiresAt: bigint,
): any {
  return c(0, [
    ticketPolicyId,
    TICKET_NAME_HEX,
    playerCommitmentHex,
    PRICE_USDM,
    commitmentHex,
    toHex(GAME_VERSION),
    1n,
    0n,
    '',
    '',
    c(0),
    '',
    0n,
    c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]),
    c(1),
    beaconValueHex,
    '11'.repeat(32),
    toHex(MATERIOS_CONTEXT),
    prizePoolHash,
    issuedAt,
    expiresAt,
    0n,
    0n,
  ])
}

function poolDatum(prizeHash: string, liquidity: bigint, reserve: bigint, count: bigint, liabilities: bigint): any {
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

const wallet = JSON.parse(
  readFileSync('/tmp/immortal-yaci-test-wallet.json', 'utf8'),
)
const provider = new Blockfrost(API, '')

// Opt-in diagnostic-only construction allowance. The active node limit is captured
// unchanged; this mode may serialize an oversized candidate for inspection but
// exits before signing or submission. It never changes the ledger's protocol rules.
const claimReferenceDiagnostic = process.env.CLAIM_REFERENCE_DIAGNOSTIC === '1'
const getActiveProtocolParameters = provider.getProtocolParameters.bind(provider)
let activeProtocolParameters: any = null
provider.getProtocolParameters = async (...args: any[]) => {
  const params = await getActiveProtocolParameters()
  activeProtocolParameters = params
  return claimReferenceDiagnostic
    ? {
        ...params,
        // Lucid/provider versions differ on protocol-parameter casing. Override
        // both aliases for local CBOR construction only; ledger parameters stay untouched.
        maxTxSize: Math.max(Number(params.maxTxSize ?? params.max_tx_size ?? 0), 30_000),
        max_tx_size: Math.max(Number(params.max_tx_size ?? params.maxTxSize ?? 0), 30_000),
      }
    : params
}

// Yaci Store exposes the Blockfrost-compatible JSON evaluator, while the
// pinned Lucid Evolution provider needs evaluateTx supplied explicitly.
// Diagnostics only: tx shape and redeemer ExUnits, to compare evaluated vs final vs submitted tx.
const describeTx = (cborHex: string) => {
  const tx = CML.Transaction.from_cbor_hex(cborHex)
  const body = tx.body()
  const redeemers: Array<{ tag: number; index: number; mem: string; steps: string }> = []
  const rs = tx.witness_set().redeemers()
  const legacy = rs?.as_arr_legacy_redeemer()
  if (legacy) {
    for (let i = 0; i < legacy.len(); i++) {
      const r = legacy.get(i)
      redeemers.push({ tag: Number(r.tag()), index: Number(r.index()), mem: r.ex_units().mem().toString(), steps: r.ex_units().steps().toString() })
    }
  }
  const map = rs?.as_map_redeemer_key_to_redeemer_val()
  if (map) {
    const keys = map.keys()
    for (let i = 0; i < keys.len(); i++) {
      const key = keys.get(i)
      const val = map.get(key)
      if (val) redeemers.push({ tag: Number(key.tag()), index: Number(key.index()), mem: val.ex_units().mem().toString(), steps: val.ex_units().steps().toString() })
    }
  }
  return {
    txSha256: createHash('sha256').update(Buffer.from(cborHex, 'hex')).digest('hex'),
    bodyHash: CML.hash_transaction(body).to_hex(),
    bytes: cborHex.length / 2,
    fee: body.fee().toString(),
    ttl: body.ttl()?.toString() ?? null,
    redeemers,
  }
}

const providerWithEvaluation = provider as Blockfrost & {
  evaluateTx: (tx: string, additionalUTxOs?: Array<{
    txHash: string
    outputIndex: number
    address: string
    assets: Record<string, bigint>
    datumHash?: string
    datum?: string
    scriptRef?: { type: string; script: string }
  }>) => Promise<Array<{
    redeemer_tag: string
    redeemer_index: number
    ex_units: { mem: number; steps: number }
  }>>
}

// Keep Yaci's raw evaluator result separate from the budget returned to Lucid.
// The 1% margin is a transaction-construction allowance only: Claim's measured
// cost is recorded from this run, never inferred from the historical Reveal
// trace. Ledger submission remains authoritative. No validator/economic rule
// is changed by the construction margin.
const EX_UNITS_SAFETY_MARGIN_BPS = 100
const EX_UNITS_SAFETY_DENOMINATOR = 10_000n

function withExUnitsSafetyMargin(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Yaci returned invalid execution units: ' + String(value))
  }
  return Number(
    (BigInt(value) * BigInt(EX_UNITS_SAFETY_DENOMINATOR + BigInt(EX_UNITS_SAFETY_MARGIN_BPS)) 
      + EX_UNITS_SAFETY_DENOMINATOR - 1n) / EX_UNITS_SAFETY_DENOMINATOR,
  )
}

const evaluateYaciTx = async (
  tx: string,
  additionalUTxOs: Array<{
    txHash: string
    outputIndex: number
    address: string
    assets: Record<string, bigint>
    datumHash?: string
    datum?: string
    scriptRef?: { type: string; script: string }
  }> = [],
) => {
  const cbor = tx.startsWith('0x') ? tx.slice(2) : tx
  if (!/^[0-9a-fA-F]+$/.test(cbor) || cbor.length % 2 !== 0) {
    throw new Error(
      `Yaci transaction evaluation received non-hex transaction CBOR: ${cbor.slice(0, 80)}`,
    )
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
  const rawResponse = await response.text()
  let result: {
    fault?: unknown
    result?: {
      EvaluationResult?: Record<string, { memory: number; steps: number }>
    }
    message?: string
  }
  try {
    result = JSON.parse(rawResponse) as typeof result
  } catch {
    result = { message: rawResponse }
  }

  if (!response.ok || result.fault || !result.result?.EvaluationResult) {
    throw new Error(
      `Yaci transaction evaluation failed (HTTP ${response.status}): ${rawResponse.slice(0, 4000)}`,
    )
  }

  return Object.entries(result.result.EvaluationResult).map(
    ([pointer, data]) => {
      const [redeemer_tag, redeemer_index] = pointer.split(':')
      return {
        redeemer_tag,
        redeemer_index: Number(redeemer_index),
        ex_units: { mem: Number(data.memory), steps: Number(data.steps) },
      }
    },
  )
}

const claimEvaluationFallbacks: Array<Record<string, unknown>> = []
const claimAikenV3Mode = process.env.IMMORTAL_CLAIM_AIKEN_V3 === '1'
let allowAikenNegativeDiagnosticBudget = false

function structuredYaciScriptEvaluationFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  const prefix = 'Yaci transaction evaluation failed (HTTP 400): '
  if (!message.startsWith(prefix)) return false
  let outer: any
  try {
    outer = JSON.parse(message.slice(prefix.length))
  } catch {
    return false
  }
  if (outer?.status_code !== 400 || outer?.error !== 'Bad Request' ||
      typeof outer?.message !== 'string') return false
  let ogmios: any
  try {
    ogmios = JSON.parse(outer.message)
  } catch {
    return false
  }
  const failures = ogmios?.result?.EvaluationFailure?.data
  return ogmios?.servicename === 'ogmios' &&
    ogmios?.methodname === 'EvaluateTx' &&
    Array.isArray(failures) &&
    failures.length > 0 &&
    failures.every((failure: any) =>
      typeof failure?.error?.data?.validationError === 'string' &&
      Array.isArray(failure?.error?.data?.traces),
    )
}

function claimContextShapeMismatch(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)

  // Known Yaci/Scalus native representation mismatch.
  const yaciShapeMismatch =
    message.includes('Yaci transaction evaluation failed') &&
    message.includes('KnownTypeUnliftingError') &&
    message.includes('Expected type ByteString, got VCon(Data')
  if (yaciShapeMismatch) return true

  // Ogmios EvaluateTx nests its JSON response inside the Yaci HTTP error JSON.
  // Parse both envelopes instead of matching escaped quotes in raw text.
  const prefix = 'Yaci transaction evaluation failed (HTTP 400): '
  if (!message.startsWith(prefix)) return false

  let outer: any
  try {
    outer = JSON.parse(message.slice(prefix.length))
  } catch {
    return false
  }
  if (
    !outer ||
    outer.status_code !== 400 ||
    outer.error !== 'Bad Request' ||
    typeof outer.message !== 'string'
  ) return false

  let ogmios: any
  try {
    ogmios = JSON.parse(outer.message)
  } catch {
    return false
  }
  if (
    ogmios?.servicename !== 'ogmios' ||
    ogmios?.methodname !== 'EvaluateTx' ||
    !Array.isArray(ogmios?.result?.EvaluationFailure?.data)
  ) return false

  return ogmios.result.EvaluationFailure.data.some((failure: any) => {
    const validationError = failure?.error?.data?.validationError
    const traces = failure?.error?.data?.traces
    return typeof validationError === 'string' &&
      validationError.includes('Type mismatch: expected: bytestring; actual: data') &&
      validationError.includes('(builtin equalsByteString)') &&
      /\(con bytestring #[0-9a-f]+\)/i.test(validationError) &&
      /\(con data \(B #[0-9a-f]+\)\)/i.test(validationError) &&
      Array.isArray(traces) &&
      traces.length === 0
  })
}

async function boundedClaimFallbackExUnits(
  cbor: string,
  additionalUTxOsCount: number,
  fallbackReason = 'Yaci Scalus KnownTypeUnliftingError: PubKeyHash/ByteString context representation',
): Promise<Array<{
  redeemer_tag: string
  redeemer_index: number
  ex_units: { mem: number; steps: number }
}>> {
  // This is only a transaction-construction fallback for the documented
  // Scalus/Yaci context-shape failure. The final Cardano ledger submission is
  // still authoritative and each positive/negative Claim is verified there.
  // The Lucid Blockfrost provider omits maxTxExecutionUnits in this Yaci setup,
  // so read the active node values from its protocol-parameters endpoint rather
  // than inventing budgets or reusing a budget from a different transition.
  const response = await fetch(API + '/epochs/latest/parameters')
  const raw = await response.text()
  if (!response.ok) {
    throw new Error(
      'Claim fallback could not read active protocol parameters (HTTP ' +
      response.status + '): ' + raw.slice(0, 1200),
    )
  }
  let active: Record<string, unknown>
  try {
    active = JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new Error('Claim fallback received invalid protocol-parameters JSON: ' + raw.slice(0, 1200))
  }
  const activeNested = (
    active.max_tx_execution_units ??
    active.maxTxExecutionUnits ??
    active.max_tx_ex_units ??
    active.maxTxExUnits ??
    {}
  ) as Record<string, unknown>
  const normalizedLimits = (
    (protocolParameters as any).maxTxExecutionUnits ??
    (protocolParameters as any).max_tx_execution_units ??
    (protocolParameters as any).maxTxExUnits ??
    {}
  ) as Record<string, unknown>
  const maxMemory = Number(
    active.max_tx_ex_mem ?? active.maxTxExMem ??
    activeNested.memory ?? activeNested.mem ?? activeNested.ex_mem ??
    normalizedLimits.memory ?? normalizedLimits.mem ?? normalizedLimits.ex_mem,
  )
  const maxSteps = Number(
    active.max_tx_ex_steps ?? active.maxTxExSteps ??
    activeNested.steps ?? activeNested.cpu ?? activeNested.ex_steps ??
    normalizedLimits.steps ?? normalizedLimits.cpu ?? normalizedLimits.ex_steps,
  )
  if (!Number.isSafeInteger(maxMemory) || maxMemory <= 0 ||
      !Number.isSafeInteger(maxSteps) || maxSteps <= 0) {
    throw new Error(
      'Claim fallback cannot resolve active execution limits; top-level keys=' +
      Object.keys(active).sort().join(',') +
      '; nested limit keys=' + Object.keys(activeNested).sort().join(',') +
      '; normalized limit keys=' + Object.keys(normalizedLimits).sort().join(','),
    )
  }

  const description = describeTx(cbor)
  const spendingRedeemers = description.redeemers.filter((r) => r.tag === 0)
  if (spendingRedeemers.length !== 2) {
    throw new Error(
      'Claim evaluator fallback expected exactly two spending redeemers; found ' +
      spendingRedeemers.length,
    )
  }

  // Two spending validators are exercised atomically. Allocate 45% of each
  // active transaction budget to each redeemer (90% total); the node's
  // validation result, not this allowance, determines Claim conformance.
  const perRedeemer = {
    mem: Math.floor(maxMemory * 0.45),
    steps: Math.floor(maxSteps * 0.45),
  }
  const tagNames: Record<number, string> = {
    0: 'spend',
    1: 'mint',
    2: 'certificate',
    3: 'withdrawal',
    4: 'vote',
    5: 'propose',
  }
  const result = spendingRedeemers.map((r) => {
    const redeemer_tag = tagNames[r.tag]
    if (!redeemer_tag) {
      throw new Error('Unsupported Claim redeemer tag: ' + r.tag)
    }
    return {
      redeemer_tag,
      redeemer_index: r.index,
      ex_units: { ...perRedeemer },
    }
  })
  claimEvaluationFallbacks.push({
    txSha256: description.txSha256,
    reason: fallbackReason,
    source: 'active maxTxExecutionUnits; 45% per spending redeemer, 90% aggregate',
    protocolParametersEndpoint: API + '/epochs/latest/parameters',
    activeProtocolParameters: {
      max_tx_ex_mem: String(maxMemory),
      max_tx_ex_steps: String(maxSteps),
    },
    protocolExecutionLimits: { memory: maxMemory, steps: maxSteps },
    assignedPerRedeemer: perRedeemer,
    redeemers: result.map((r) => ({
      tag: r.redeemer_tag,
      index: r.redeemer_index,
      exUnits: r.ex_units,
    })),
    additionalUTxOsSuppliedByLucid: additionalUTxOsCount,
    ledgerSubmissionRemainsAuthoritative: true,
  })
  console.log(JSON.stringify({
    claimDiag: fallbackReason.startsWith('Aiken Claim negative twin:')
      ? 'aiken-negative-construction-budget'
      : 'scalus-context-shape-fallback',
    fallbackReason,
    additionalUTxOsSuppliedByLucid: additionalUTxOsCount,
    txSha256: description.txSha256,
    protocolExecutionLimits: { memory: maxMemory, steps: maxSteps },
    assignedPerRedeemer: perRedeemer,
    redeemerIndexes: result.map((r) => r.redeemer_index),
    ledgerSubmissionRemainsAuthoritative: true,
  }))
  return result
}

let lastClaimAdditionalUTxOs: Parameters<typeof evaluateYaciTx>[1] = []

providerWithEvaluation.evaluateTx = async (tx, additionalUTxOs = []) => {
  const cbor = tx.startsWith('0x') ? tx.slice(2) : tx
  lastClaimAdditionalUTxOs = additionalUTxOs
  let measured: Awaited<ReturnType<typeof evaluateYaciTx>>
  try {
    measured = await evaluateYaciTx(cbor, additionalUTxOs)
  } catch (error) {
    // Lucid supplies reference-input UTxOs here when a transaction uses readFrom().
    // They are already bound into the CBOR transaction. For this one exact
    // Scalus PubKeyHash/ByteString context-shape failure, bypass evaluator-based
    // budgeting even when those reference UTxOs are present; the node's actual
    // submission remains mandatory and authoritative for every Claim result.
    if (claimContextShapeMismatch(error)) {
      return await boundedClaimFallbackExUnits(cbor, additionalUTxOs.length)
    }
    // Aiken returns a generic false result rather than Haskell trace markers.
    // For deliberate negative twins only, use a bounded construction-only budget
    // after structured Plutus evaluation failure so the native ledger gets the
    // final decision. The flag is never enabled for the positive Claim.
    if (
      claimAikenV3Mode &&
      allowAikenNegativeDiagnosticBudget &&
      structuredYaciScriptEvaluationFailure(error)
    ) {
      return await boundedClaimFallbackExUnits(
        cbor,
        additionalUTxOs.length,
        'Aiken Claim negative twin: bounded ExUnits supplied only to reach authoritative ledger rejection after structured validator evaluation failure',
      )
    }
    throw error
  }
  const budgeted = measured.map((redeemer) => ({
    ...redeemer,
    ex_units: {
      mem: withExUnitsSafetyMargin(redeemer.ex_units.mem),
      steps: withExUnitsSafetyMargin(redeemer.ex_units.steps),
    },
  }))
  if (measured.length > 0) {
    console.log(JSON.stringify({
      claimDiag: 'yaci-evaluate',
      tx: describeTx(cbor),
      yaciMeasuredExUnits: measured,
      yaciBudgetedExUnits: budgeted,
      safetyMarginBps: EX_UNITS_SAFETY_MARGIN_BPS,
    }))
  }
  return budgeted
}

// validTo() converts ms to slots with this table; the 'Preprod' default does not match the devnet genesis.
// Anchor = latest Yaci block (slot, time); slot length is the Yaci devkit default (1.0 s, see bootstrap log).
const DEVNET_SLOT_LENGTH_MS = 1000
const latestBlock = await (await fetch(API + '/blocks/latest')).json() as {
  slot: number
  time: number
}
if (!Number.isSafeInteger(latestBlock.slot) || latestBlock.slot < 0 ||
    !Number.isSafeInteger(latestBlock.time) || latestBlock.time <= 0) {
  throw new Error('Yaci /blocks/latest lacks slot/time: ' + JSON.stringify(latestBlock))
}
const latestBlockTimeMs = latestBlock.time < 100_000_000_000
  ? latestBlock.time * 1000
  : latestBlock.time
const devnetSlotConfig = {
  zeroTime: latestBlockTimeMs,
  zeroSlot: latestBlock.slot,
  slotLength: DEVNET_SLOT_LENGTH_MS,
}
const lucid = await Lucid(providerWithEvaluation, 'Preprod', { slotConfig: devnetSlotConfig })
const protocolParameters = await provider.getProtocolParameters()
const jsonReplacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value
console.log(JSON.stringify({
  protocolParametersCostModelLengths: Object.fromEntries(
    Object.entries(protocolParameters.costModels ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v]),
  ),
}, null, 2))
lucid.selectWallet.fromSeed(SEED)

const address = await lucid.wallet().address()
if (wallet.address !== address) {
  throw new Error('Claim fixture wallet file address does not match the configured Yaci test seed')
}

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
const keyHash = details.paymentCredential && details.paymentCredential.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')
const referencePaymentHash = getAddressDetails(referenceAddress).paymentCredential?.hash
if (!referencePaymentHash || referencePaymentHash === keyHash) {
  throw new Error('reference receiver must have a different payment credential from the Claim owner')
}

const testPolicy = nativePolicy(lucid, keyHash)
const testPolicyId = mintingPolicyToId(testPolicy)
const poolTokenNameHex = '504f4f4c'
const liquidityTokenNameHex = '5553444d'
const poolUnit = testPolicyId + poolTokenNameHex
const liquidityUnit = testPolicyId + liquidityTokenNameHex
const ticketUnit = testPolicyId + TICKET_NAME_HEX

// Reveal does not consume Oracle state, but the parameterized validators require
// a non-empty singleton identity. Use the deterministic fixture policy here;
// production Oracle identity remains deployment-configured.
const fixtureOracleStatePolicyId = testPolicyId

const scripts = buildScriptsFromLucid(
  { ...lucid, utils: { validatorToScriptHash, mintingPolicyToId, validatorToAddress: (script: Script) => validatorToAddress('Preprod', script) } },
  defaultPrizeTable,
  keyHash,
  fixtureOracleStatePolicyId,
  ORACLE_STATE_TOKEN_NAME_HEX,
  testPolicyId,
  poolTokenNameHex,
)
// Retain the original Haskell V2 artifact for the parameterization diagnostic,
// even when the transaction trace below selects the Aiken V3 candidate.
const canonicalHaskellPrizeScript = scripts.prizeValidator as Script

/**
 * Explicit local-lab-only route for exercising the typed-context Aiken Claim
 * validator. Selection happens before the Prize reference script is published,
 * so this route never tries to publish the oversized Haskell PrizeValidator.
 * The real B1PrizePool V2 validator is rebound to the exact parameterized Aiken
 * Prize hash, preserving cross-datum/address consistency.
 */
const aikenClaimV3Candidate = process.env.IMMORTAL_CLAIM_AIKEN_V3 === '1'
if (aikenClaimV3Candidate) {
  const blueprint = JSON.parse(readFileSync('poc/aiken-reveal-parity/plutus.json', 'utf8')) as {
    preamble?: { plutusVersion?: string }
    validators?: Array<{ title?: string; compiledCode?: string; hash?: string }>
  }
  if (blueprint.preamble?.plutusVersion !== 'v3') {
    throw new Error('Aiken Claim candidate requires a Plutus V3 blueprint')
  }
  const matches = (blueprint.validators ?? []).filter(v => v.title === 'reveal.pre_rich_reveal.spend')
  if (matches.length !== 1 || !matches[0].compiledCode || !matches[0].hash) {
    throw new Error('Expected one compiled Aiken Prize validator in the blueprint')
  }
  const unparameterized = { type: 'PlutusV3', script: matches[0].compiledCode } as Script
  if (validatorToScriptHash(unparameterized).toLowerCase() !== matches[0].hash.toLowerCase()) {
    throw new Error('Aiken blueprint unparameterized validator hash mismatch')
  }
  const aikenPrizeScript = {
    type: 'PlutusV3',
    script: evolutionApplyParamsToScript(
      matches[0].compiledCode,
      [fixtureOracleStatePolicyId, ORACLE_STATE_TOKEN_NAME_HEX, keyHash],
    ),
  } as Script
  const aikenPrizeHash = validatorToScriptHash(aikenPrizeScript).toLowerCase()
  const aikenBoundPoolScript = buildB1PrizePool(
    aikenPrizeHash,
    keyHash,
    fixtureOracleStatePolicyId,
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
    claimCandidate: 'parameterized-aiken-v3-selected-before-reference-publication',
    canonicalHaskellValidatorModified: false,
    existingV3CarrierModified: false,
    productionOracleQualified: false,
    plutusVersion: 'v3',
    aikenPrizeHash,
    aikenPrizeBytes: Buffer.from(aikenPrizeScript.script, 'hex').length,
    aikenBoundPoolHash,
    transactionSizeLimitBytes: Number(protocolParameters.maxTxSize),
    localYaciOnly: true,
    deploymentGateClosed: true,
  }, null, 2))
}

if (!scripts.prizeAddress || !scripts.b1PrizePoolAddress) {
  throw new Error('failed to derive Prize/B1PrizePool addresses')
}

function toEvolutionData(value: any): any {
  if (typeof value === 'bigint' || typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(toEvolutionData)
  if (value instanceof Map) {
    return new Map([...value.entries()].map(([k, v]) => [toEvolutionData(k), toEvolutionData(v)]))
  }
  if (value && typeof value.index === 'number' && Array.isArray(value.fields)) {
    return new Constr(value.index, value.fields.map(toEvolutionData))
  }
  throw new Error('unsupported Data value in parameterization differential')
}

const legacyPrizeScriptHex = (canonicalHaskellPrizeScript as any).script
const differentialParams = [
  validatorToScriptHash({
    type: 'PlutusV2',
    script: (beaconRegistryValidator as any).script,
  } as any),
  toEvolutionData(prizeTableToData(defaultPrizeTable)),
  fixtureOracleStatePolicyId,
  ORACLE_STATE_TOKEN_NAME_HEX,
  keyHash,
]
const evolutionPrizeScriptHex = evolutionApplyParamsToScript(
  (prizeValidatorFactory as any).script,
  differentialParams,
)
console.log(JSON.stringify({
  parameterizationDifferential: {
    legacyBytes: Buffer.from(legacyPrizeScriptHex, 'hex').length,
    evolutionBytes: Buffer.from(evolutionPrizeScriptHex, 'hex').length,
    legacyHash: validatorToScriptHash({ type: 'PlutusV2', script: legacyPrizeScriptHex } as any),
    evolutionHash: validatorToScriptHash({ type: 'PlutusV2', script: evolutionPrizeScriptHex } as any),
    identicalCbor: legacyPrizeScriptHex === evolutionPrizeScriptHex,
  },
}, null, 2))



const ADA_PRICE_USDM_SUBUNITS = 10_000n
const MIN_UTXO_LOVELACE = 1_600_000n
const POOL_LOVELACE = 7_000_000n
const ROW1_TIER = 5
const ROW2_TIER = 0
const PRIZE_AMOUNT = BigInt(
  rowPayoutTotal(defaultPrizeTable, ROW1_TIER, ROW2_TIER, Number(PRICE_USDM)),
)
const PRE_POOL_LIQUIDITY = (
  (POOL_LOVELACE - MIN_UTXO_LOVELACE) * ADA_PRICE_USDM_SUBUNITS
  + 1_000_000n - 1n
) / 1_000_000n

if (PRIZE_AMOUNT <= 0n || PRIZE_AMOUNT > 500n * PRICE_USDM) {
  throw new Error('Claim fixture payout violates the canonical normal-payout bound')
}
if (PRIZE_AMOUNT !== 50_000n || PRE_POOL_LIQUIDITY !== 54_000n) {
  throw new Error(
    'Unexpected Claim fixture derivation: payout=' + PRIZE_AMOUNT +
    ', poolLiquidity=' + PRE_POOL_LIQUIDITY,
  )
}

// The on-chain PrizeValidator's claimAddress is an enterprise address built
// from the ticket owner's payment credential, not necessarily the full wallet
// address (which may include a stake credential).
const networkId = Number((details as any).networkId ?? 0)
const enterprise = CML.EnterpriseAddress.new(
  networkId,
  CML.Credential.new_pub_key(CML.Ed25519KeyHash.from_hex(keyHash)),
)
const claimantAddress = enterprise.to_address().to_bech32(
  networkId === 1 ? 'addr' : 'addr_test',
)
if (claimantAddress === address) {
  throw new Error(
    'Claim fixture requires a distinct wallet/base address and PrizeValidator enterprise claimant address',
  )
}

// Synthetic fixture timestamps are anchored to the current Yaci block, not
// local wall-clock time. Oracle freshness is checked against the tx validity
// upper bound by Economic.validOracleTimestamp.
const fixtureIssuedAt = BigInt(latestBlockTimeMs)
const fixtureOracleTimestamp = BigInt(latestBlockTimeMs)
const fixtureExpiresAt = BigInt(latestBlockTimeMs + 600_000)
const oracleStateUnit = fixtureOracleStatePolicyId + ORACLE_STATE_TOKEN_NAME_HEX
const poolPolicyId = testPolicyId
const ticketPolicyId = testPolicyId

const playerCommitmentHex = '22'.repeat(32)
const commitmentHex = '33'.repeat(32)
const fixtureBeaconHex = '44'.repeat(32)
const fixtureResultHex = '55'.repeat(32)
const fixtureMcHashHex = '66'.repeat(32)
const fixtureGameVersionHex = toHex(GAME_VERSION)
const fixtureMateriosContextHex = toHex(MATERIOS_CONTEXT)

// PrizeDatum field order follows plutus/Types.hs. This fixture enters at
// Revealed to isolate Claim semantics; it does not claim that this datum was
// produced by a preceding production Issue/Reveal path.
const revealedPrizeDatum = c(0, [
  ticketPolicyId,                         // pdTicketPolicy
  TICKET_NAME_HEX,                        // pdTicketName
  playerCommitmentHex,                    // pdPlayerCommitment
  PRICE_USDM,                             // pdPriceUsdm
  commitmentHex,                          // pdCommitment
  fixtureGameVersionHex,                 // pdGameVersion
  1n,                                     // pdTicketNonce
  PRIZE_AMOUNT,                           // pdPrizeAmount
  '',                                     // pdPaymentPolicy
  '',                                     // pdPaymentName
  c(1),                                   // Revealed
  fixtureResultHex,                       // pdResult
  BigInt(Math.max(ROW1_TIER, ROW2_TIER)), // pdPrizeTier
  c(0, [0n, 0n, toHex(MAINCHAIN_REF), fixtureGameVersionHex]),
  c(1),                                   // BeaconReady
  fixtureBeaconHex,
  fixtureMcHashHex,
  fixtureMateriosContextHex,
  scripts.b1PrizePoolHash,
  fixtureIssuedAt,
  fixtureExpiresAt,
  BigInt(ROW1_TIER),
  BigInt(ROW2_TIER),
])

const prePoolDatum = poolDatum(
  scripts.prizeHash,
  PRE_POOL_LIQUIDITY,
  0n, // unresolved reserve is zero after Reveal
  0n, // unresolved ticket count is zero after Reveal
  PRIZE_AMOUNT,
)
const postPoolDatum = poolDatum(
  scripts.prizeHash,
  PRE_POOL_LIQUIDITY - PRIZE_AMOUNT,
  0n,
  0n,
  0n,
)
const oracleDatum = c(0, [
  '', // ADA currency symbol
  '', // ADA token name
  ADA_PRICE_USDM_SUBUNITS,
  fixtureOracleTimestamp,
  keyHash,
])

console.log(JSON.stringify({
  claimFixture: 'synthetic-revealed-state',
  claimStatus: 'Revealed',
  ticketOwnerPaymentKeyHash: keyHash,
  walletAddress: address,
  claimantEnterpriseAddress: claimantAddress,
  oracleMode: 'synthetic-yaci-test-fixture-not-production-authority',
  oracleAdaPriceUsdmSubunitsPerLovelace: ADA_PRICE_USDM_SUBUNITS.toString(),
  priceUsdm: PRICE_USDM.toString(),
  row1Tier: ROW1_TIER,
  row2Tier: ROW2_TIER,
  prizeAmount: PRIZE_AMOUNT.toString(),
  maxNormalPayout: (500n * PRICE_USDM).toString(),
  poolInputLovelace: POOL_LOVELACE.toString(),
  poolInputCanonicalAdaValue: PRE_POOL_LIQUIDITY.toString(),
  fixtureExpiry: fixtureExpiresAt.toString(),
}))

const bootstrap = await lucid
  .newTx()
  .mintAssets(
    {
      [poolUnit]: 1n,
      [ticketUnit]: 1n,
      [oracleStateUnit]: 2n,
    },
    Data.void(),
  )
  .attach.MintingPolicy(testPolicy)
  .pay.ToContract(
    scripts.b1PrizePoolAddress as string,
    { kind: 'inline', value: Data.to(prePoolDatum) },
    {
      lovelace: POOL_LOVELACE,
      [poolUnit]: 1n,
    },
  )
  .pay.ToContract(
    scripts.prizeAddress as string,
    { kind: 'inline', value: Data.to(revealedPrizeDatum) },
    { lovelace: 3_000_000n },
  )
  .pay.ToAddress(
    address,
    { lovelace: 2_000_000n, [ticketUnit]: 1n },
  )
  // Two fixture UTxOs deliberately carry the same singleton unit so the
  // Claim scan can exercise malformed-first/valid-second and malformed-only
  // reference-input cases. This is synthetic test state, not a production
  // singleton deployment or economic qualification.
  .pay.ToAddressWithData(
    referenceAddress,
    { kind: 'inline', value: Data.to(42n) },
    { lovelace: 2_000_000n, [oracleStateUnit]: 1n },
  )
  .pay.ToAddressWithData(
    referenceAddress,
    { kind: 'inline', value: Data.to(oracleDatum) },
    { lovelace: 2_000_000n, [oracleStateUnit]: 1n },
  )
  .addSigner(address)
  .complete({ localUPLCEval: false })

const bootstrapSigned = await bootstrap.sign.withWallet().complete({ localUPLCEval: false })
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)

const prizeUtxos = await waitFor(
  () => lucid.utxosAt(scripts.prizeAddress as string),
  (xs) => xs.some((u) =>
    u.txHash === bootstrapHash &&
    u.assets.lovelace === 3_000_000n &&
    !u.assets[ticketUnit],
  ),
  'bootstrapped Revealed Prize input',
)
const poolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) =>
    u.txHash === bootstrapHash && u.assets[poolUnit] === 1n,
  ),
  'bootstrapped B1PrizePool input',
)
const walletUtxos = await lucid.utxosAt(address)
const ticketUtxo = walletUtxos.find((u) =>
  u.txHash === bootstrapHash && u.assets[ticketUnit] === 1n,
)
const oracleReferenceUtxos = await lucid.utxosAt(referenceAddress)
// Bootstrap output order is pool, Prize, ticket, malformed Oracle State, valid Oracle State.
const malformedOracleUtxo = oracleReferenceUtxos.find((u) =>
  u.txHash === bootstrapHash && u.outputIndex === 3 && u.assets[oracleStateUnit] === 1n,
)
const oracleUtxo = oracleReferenceUtxos.find((u) =>
  u.txHash === bootstrapHash && u.outputIndex === 4 && u.assets[oracleStateUnit] === 1n,
)
const prizeUtxo = prizeUtxos.find((u) =>
  u.txHash === bootstrapHash &&
  u.assets.lovelace === 3_000_000n &&
  !u.assets[ticketUnit],
)
const poolUtxo = poolUtxos.find((u) =>
  u.txHash === bootstrapHash && u.assets[poolUnit] === 1n,
)
if (!ticketUtxo || !oracleUtxo || !malformedOracleUtxo || !prizeUtxo || !poolUtxo) {
  throw new Error('Claim fixture did not materialize its exact bootstrap outpoints')
}
if (ticketUtxo.address !== address || ticketUtxo.assets[ticketUnit] !== 1n) {
  throw new Error('Claim fixture ticket NFT is not held by the expected payment credential')
}
if (oracleUtxo.datum === undefined) {
  throw new Error('Claim fixture Oracle State UTxO has no datum')
}

const preStateFingerprint = hashJson({
  prizeRef: ref(prizeUtxo),
  prizeDatum: prizeUtxo.datum,
  poolRef: ref(poolUtxo),
  poolDatum: poolUtxo.datum,
  ticketRef: ref(ticketUtxo),
  malformedOracleRef: ref(malformedOracleUtxo),
  oracleRef: ref(oracleUtxo),
})

console.log('[CLAIM-DIAG] input Prize=' + ref(prizeUtxo))
console.log('[CLAIM-DIAG] input Pool=' + ref(poolUtxo))
console.log('[CLAIM-DIAG] owner ticket=' + ref(ticketUtxo))
console.log('[CLAIM-DIAG] malformed Oracle State reference=' + ref(malformedOracleUtxo))
console.log('[CLAIM-DIAG] valid Oracle State reference=' + ref(oracleUtxo))

// Publish both current reference scripts separately from the wallet address.
const prizeReferenceTx = await lucid
  .newTx()
  .pay.ToAddressWithData(
    referenceAddress,
    undefined,
    { lovelace: 2_000_000n },
    scripts.prizeValidator as Script,
  )
  .complete({ localUPLCEval: false })
const prizeReferenceSigned = await prizeReferenceTx.sign.withWallet().complete({ localUPLCEval: false })
const prizeReferenceHash = await prizeReferenceSigned.submit()
await lucid.awaitTx(prizeReferenceHash)

const poolReferenceTx = await lucid
  .newTx()
  .pay.ToAddressWithData(
    referenceAddress,
    undefined,
    { lovelace: 2_000_000n },
    scripts.b1PrizePool as Script,
  )
  .complete({ localUPLCEval: false })
const poolReferenceSigned = await poolReferenceTx.sign.withWallet().complete({ localUPLCEval: false })
const poolReferenceHash = await poolReferenceSigned.submit()
await lucid.awaitTx(poolReferenceHash)

const referenceUtxos = await lucid.utxosAt(referenceAddress)
const prizeReferenceUtxo = referenceUtxos.find((u) => u.txHash === prizeReferenceHash)
const poolReferenceUtxo = referenceUtxos.find((u) => u.txHash === poolReferenceHash)
if (!prizeReferenceUtxo || !poolReferenceUtxo) {
  throw new Error('Claim reference-script UTxOs were not materialized on Yaci')
}
// Bind each reference input to the exact accepted publishing transaction CBOR.
// Provider-side scriptRef metadata alone is not proof that the expected bytes
// were published at this output index and address.
const prizeReferenceInput = bindPublishedReferenceScript({
  purpose: 'PrizeValidator',
  publishedTxCbor: prizeReferenceSigned.toCBOR(),
  expectedScript: scripts.prizeValidator as Script,
  referenceAddress,
  utxo: prizeReferenceUtxo,
})
const poolReferenceInput = bindPublishedReferenceScript({
  purpose: 'B1PrizePool',
  publishedTxCbor: poolReferenceSigned.toCBOR(),
  expectedScript: scripts.b1PrizePool as Script,
  referenceAddress,
  utxo: poolReferenceUtxo,
})
if (
  validatorToScriptHash(prizeReferenceInput.scriptRef as Script) !==
    validatorToScriptHash(scripts.prizeValidator as Script) ||
  validatorToScriptHash(poolReferenceInput.scriptRef as Script) !==
    validatorToScriptHash(scripts.b1PrizePool as Script)
) {
  throw new Error('Claim reference-script hash mismatch')
}

const payoutLovelace = MIN_UTXO_LOVELACE +
  (PRIZE_AMOUNT * 1_000_000n) / ADA_PRICE_USDM_SUBUNITS
const poolOutputLovelace = POOL_LOVELACE -
  (PRIZE_AMOUNT * 1_000_000n) / ADA_PRICE_USDM_SUBUNITS

if (
  (payoutLovelace - MIN_UTXO_LOVELACE) * ADA_PRICE_USDM_SUBUNITS / 1_000_000n !== PRIZE_AMOUNT ||
  poolOutputLovelace < MIN_UTXO_LOVELACE
) {
  throw new Error('Claim fixture cannot represent its exact payout under the configured synthetic ADA quote')
}

type ClaimVariant = {
  label: string
  expectedTraceMarkers: string[]
  mutateRowTier?: boolean
  settlementUsdm?: bigint
  extraSettlementOutput?: boolean
  ticketNftReceiver?: string
  includeOwnerSigner?: boolean
  oracleMode?: 'malformed-then-valid' | 'malformed-only'
}

async function buildClaimTx(variant: ClaimVariant) {
  const nextPrizeFields = (Data.from(Data.to(revealedPrizeDatum)) as any).fields.slice()
  nextPrizeFields[10] = c(2) // Claimed
  if (variant.mutateRowTier) {
    nextPrizeFields[21] = BigInt(ROW1_TIER - 1)
  }
  const nextPrizeDatum = new Constr(0, nextPrizeFields)

  const nextPoolDatum = poolDatum(
    scripts.prizeHash,
    PRE_POOL_LIQUIDITY - PRIZE_AMOUNT,
    0n,
    0n,
    0n,
  )

  const settlementUsdm = variant.settlementUsdm ?? PRIZE_AMOUNT
  const settlementLovelace = MIN_UTXO_LOVELACE +
    (settlementUsdm * 1_000_000n) / ADA_PRICE_USDM_SUBUNITS

  const oracleInputs = variant.oracleMode === 'malformed-only'
    ? [malformedOracleUtxo as UTxO]
    : [malformedOracleUtxo as UTxO, oracleUtxo as UTxO]

  let builder = lucid
    .newTx()
    .readFrom([prizeReferenceInput, poolReferenceInput, ...oracleInputs])
    // The validated script witnesses are supplied by the reference-script UTxOs
    // included above. Do not attach the full validator bytes to this transaction:
    // Claim must stay under Cardano's 16,384-byte transaction limit.
    .collectFrom([prizeUtxo as UTxO], Data.to(c(2)))
    .collectFrom([poolUtxo as UTxO], Data.to(c(3, [PRIZE_AMOUNT])))
    .collectFrom([ticketUtxo as UTxO])
    .pay.ToContract(
      scripts.prizeAddress as string,
      { kind: 'inline', value: Data.to(nextPrizeDatum) },
      (prizeUtxo as UTxO).assets,
    )
    .pay.ToContract(
      scripts.b1PrizePoolAddress as string,
      { kind: 'inline', value: Data.to(nextPoolDatum) },
      {
        lovelace: poolOutputLovelace,
        [poolUnit]: 1n,
      },
    )
    // PrizeValidator's claimAddress is payment-credential-only. Settlement
    // goes to that enterprise address; a valid Claim returns the ticket NFT
    // to the owner's original wallet/base address, kept economically separate.
    .pay.ToAddress(
      claimantAddress,
      { lovelace: settlementLovelace },
    )

  // This extra ADA-only output deliberately overpays in aggregate while leaving
  // the first settlement output exact. B1's per-output check passes its first
  // matching output, while PrizeValidator sums outputs before valuation and
  // must reject the resulting aggregate overpayment.
  if (variant.extraSettlementOutput) {
    // PrizeValidator first combines claimant outputs with sumValuesToAddress;
    // totalUsdmValue then subtracts min-UTxO once from the aggregate. Therefore
    // this second 1.7 ADA output makes the aggregate payout exceed the exact
    // first output, while B1's per-output check still accepts that first output.
    builder = builder.pay.ToAddress(
      claimantAddress,
      { lovelace: MIN_UTXO_LOVELACE + 100_000n },
    ) as any
  }

  builder = builder
    .pay.ToAddress(
      variant.ticketNftReceiver ?? address,
      { lovelace: 2_000_000n, [ticketUnit]: 1n },
    )

  if (variant.includeOwnerSigner !== false) {
    builder = builder.addSigner(address)
  }

  return builder
    .validFrom(latestBlockTimeMs + 1_000)
    .validTo(latestBlockTimeMs + 120_000)
    .complete({ localUPLCEval: false })
}

// Opt-in Claim CBOR diagnosis. The raised maxTxSize above is construction-only:
// this path never signs, submits, or waits for the candidate transaction.
if (claimReferenceDiagnostic) {
  // Preserve evidence even when Lucid rejects the candidate inside complete()
  // before it can expose a Tx object/CBOR. This is the critical failure mode
  // the original diagnostic path did not report with enough context.
  let diagnosticTx: any
  try {
    diagnosticTx = await buildClaimTx({ label: 'reference-diagnostic' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const activeMaxTxSize = Number(
      activeProtocolParameters?.maxTxSize ??
      activeProtocolParameters?.max_tx_size ??
      16_384,
    )
    const failure = {
      claimDiag: 'reference-cbor-construction-failed',
      diagnosticOnly: true,
      signed: false,
      submitted: false,
      stage: 'Lucid complete() before CBOR serialization',
      actualProtocolMaxTxSize: activeMaxTxSize,
      constructionMaxTxSize: 30_000,
      providerProtocolParameterKeys: activeProtocolParameters
        ? Object.keys(activeProtocolParameters).sort()
        : [],
      providerReportedMaxTxSize: activeProtocolParameters?.maxTxSize ?? null,
      providerReportedMax_tx_size: activeProtocolParameters?.max_tx_size ?? null,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      error: message.slice(0, 5000),
      nextEvidenceRequired: 'Determine whether Lucid cached the active maxTxSize or rejected construction for a different reason.',
    }
    console.error('[CLAIM-DIAGNOSTIC-CONSTRUCTION-FAILURE] ' + JSON.stringify(failure))
    writeFileSync(
      'audit/yaci-evidence/claim-cbor-construction-failure.json',
      JSON.stringify(failure, null, 2),
    )
    throw new Error(
      'Claim diagnostic could not reach CBOR serialization; failure evidence written to audit/yaci-evidence/claim-cbor-construction-failure.json: ' +
      message.slice(0, 1200),
    )
  }
  const cbor = diagnosticTx.toCBOR()
  const parsed = CML.Transaction.from_cbor_hex(cbor)
  const body: any = parsed.body()
  const witness: any = parsed.witness_set()
  const scriptsByVersion = {
    plutusV1: witness.plutus_v1_scripts()?.len() ?? 0,
    plutusV2: witness.plutus_v2_scripts()?.len() ?? 0,
    plutusV3: witness.plutus_v3_scripts()?.len() ?? 0,
  }
  const refs: string[] = []
  const referenceInputs = body.reference_inputs?.()
  if (referenceInputs) {
    for (let i = 0; i < referenceInputs.len(); i++) {
      const input = referenceInputs.get(i)
      refs.push(input.transaction_id().to_hex() + '#' + input.index())
    }
  }
  const spendingInputs: string[] = []
  const inputs = body.inputs()
  for (let i = 0; i < inputs.len(); i++) {
    const input = inputs.get(i)
    spendingInputs.push(input.transaction_id().to_hex() + '#' + input.index())
  }
  const bytes = Buffer.from(cbor, 'hex')
  writeFileSync('audit/yaci-evidence/claim-tx-prebuilt-diagnostic.cbor', bytes)
  const summary = {
    claimDiag: 'reference-script-final-cbor',
    diagnosticOnly: true,
    signed: false,
    submitted: false,
    actualProtocolMaxTxSize: Number(activeProtocolParameters?.maxTxSize ?? activeProtocolParameters?.max_tx_size ?? 16_384),
    constructionMaxTxSize: 30_000,
    serializedBytes: bytes.length,
    overActualLimit: bytes.length > Number(activeProtocolParameters?.maxTxSize ?? activeProtocolParameters?.max_tx_size ?? 16_384),
    referenceInputs: refs,
    spendingInputs,
    embeddedPlutusScripts: scriptsByVersion,
    embeddedPlutusScriptTotal: scriptsByVersion.plutusV1 + scriptsByVersion.plutusV2 + scriptsByVersion.plutusV3,
    redeemers: describeTx(cbor).redeemers,
    txSha256: describeTx(cbor).txSha256,
    bodyHash: describeTx(cbor).bodyHash,
    cborArtifact: 'audit/yaci-evidence/claim-tx-prebuilt-diagnostic.cbor',
  }
  console.log('[CLAIM-DIAGNOSTIC-ONLY] ' + JSON.stringify(summary))
  process.exit(0)
}

const negativeResults: Array<Record<string, unknown>> = []

async function expectClaimRejected(variant: ClaimVariant): Promise<void> {
  let phase = 'Yaci validator evaluation during transaction completion'
  let cborHash: string | null = null
  try {
    allowAikenNegativeDiagnosticBudget = claimAikenV3Mode
    const tx = await buildClaimTx(variant)
    const signed = await tx.sign.withWallet().complete({ localUPLCEval: false })
    allowAikenNegativeDiagnosticBudget = false
    const cbor = signed.toCBOR()
    cborHash = createHash('sha256').update(Buffer.from(cbor, 'hex')).digest('hex')
    phase = 'ledger submission'
    const txHash = await signed.submit()
    phase = 'ledger confirmation'
    await lucid.awaitTx(txHash)
    throw new Error('CLAIM_NEGATIVE_TWIN_ACCEPTED:' + variant.label + ':' + txHash)
  } catch (error) {
    allowAikenNegativeDiagnosticBudget = false
    const message = error instanceof Error ? error.message : String(error)
    if (message.startsWith('CLAIM_NEGATIVE_TWIN_ACCEPTED:')) {
      throw error
    }

    const expectedMarker = variant.expectedTraceMarkers.find((marker) =>
      message.includes(marker),
    )
    const rejectedByYaciEvaluation =
      message.includes('Yaci transaction evaluation failed') ||
      message.includes('Yaci evaluation failed')
    const explicitPlutusFailure =
      phase === 'ledger submission' &&
      /The PlutusV[123] script failed/.test(message)
    const explicitAikenScriptFailure =
      claimAikenV3Mode &&
      phase === 'ledger submission' &&
      /validationtagmismatch|plutusfailure|script.*fail|plutus.*fail/i.test(message)
    const explicitScriptFailure = explicitPlutusFailure || explicitAikenScriptFailure
    const rejectedByLedger =
      phase === 'ledger submission' &&
      (/HTTP 400|Bad Request|script evaluation|validation failed|input.*(spent|not found)|already spent/i.test(message) ||
        explicitScriptFailure)

    // The native Cardano ledger error includes the failing script bytes but
    // does not reliably surface Plutus trace strings. Accept a negative twin
    // only when Yaci evaluation identifies the expected marker, or ledger
    // submission explicitly reports Plutus script failure. Record which level
    // of evidence was actually available; never label an unobserved trace as
    // branch-confirmed.
    if ((!rejectedByYaciEvaluation && !rejectedByLedger) ||
        (!expectedMarker && !explicitScriptFailure)) {
      throw new Error(
        'Negative twin "' + variant.label +
        '" did not prove its expected on-chain rejection (' + phase +
        ', expected one of ' + variant.expectedTraceMarkers.join(' | ') +
        '): ' + message,
      )
    }
    const branchEvidence = expectedMarker
      ? 'expected-trace-observed'
      : 'ledger-plutus-failure-trace-unavailable'

    negativeResults.push({
      label: variant.label,
      rejected: true,
      rejectedAt: rejectedByYaciEvaluation ? 'Yaci Plutus evaluation' : 'Yaci ledger submission',
      expectedTraceMarker: expectedMarker,
      branchEvidence,
      txCborSha256: cborHash,
      error: message.slice(0, 2500),
    })
    console.log(JSON.stringify({
      claimNegativeTwin: variant.label,
      rejected: true,
      rejectedAt: rejectedByYaciEvaluation ? 'Yaci Plutus evaluation' : 'Yaci ledger submission',
      expectedTraceMarker: expectedMarker,
      branchEvidence,
      txCborSha256: cborHash,
      error: message.slice(0, 900),
    }))
  }

  // A rejected transaction must not consume any of the three economic inputs.
  const [remainingPrize, remainingPool, remainingWallet] = await Promise.all([
    lucid.utxosAt(scripts.prizeAddress as string),
    lucid.utxosAt(scripts.b1PrizePoolAddress as string),
    lucid.utxosAt(address),
  ])
  if (
    !remainingPrize.some((u) => ref(u) === ref(prizeUtxo as UTxO)) ||
    !remainingPool.some((u) => ref(u) === ref(poolUtxo as UTxO)) ||
    !remainingWallet.some((u) => ref(u) === ref(ticketUtxo as UTxO))
  ) {
    throw new Error('Rejected Claim negative twin consumed a fixture input: ' + variant.label)
  }
}

await expectClaimRejected({
  label: 'mutated-row-tier',
  expectedTraceMarkers: ['61'],
  mutateRowTier: true,
})
await expectClaimRejected({
  label: 'settlement-underpayment',
  expectedTraceMarkers: [
    claimAikenV3Mode ? 'Prize: payout' : '59',
    'B1PrizePool: payout USDM value insufficient',
  ],
  settlementUsdm: PRIZE_AMOUNT - 1n,
  // Keep the NFT output away from the claimant credential so B1's per-output
  // payout checker cannot count the NFT-return output as part of the settlement.
  ticketNftReceiver: referenceAddress,
})
await expectClaimRejected({
  label: 'aggregate-settlement-overpayment',
  expectedTraceMarkers: [claimAikenV3Mode ? 'Prize: payout' : '59'],
  extraSettlementOutput: true,
})
await expectClaimRejected({
  label: 'missing-owner-required-signer',
  expectedTraceMarkers: [
    claimAikenV3Mode ? 'Prize: owner sig' : '54',
    'B1PrizePool: owner not signed',
  ],
  includeOwnerSigner: false,
})
await expectClaimRejected({
  label: 'malformed-oracle-without-valid-alternative',
  expectedTraceMarkers: [
    claimAikenV3Mode ? 'Prize: payout' : '59',
    'B1PrizePool: payout USDM value insufficient',
  ],
  oracleMode: 'malformed-only',
})

if (negativeResults.length !== 5) {
  throw new Error('Claim negative twins incomplete: ' + negativeResults.length + '/5 rejected')
}

const validTx = await buildClaimTx({ label: 'valid-claim' })
let signedClaim: any = null
const executionAdapter = createCardanoExecutionAdapter({
  signTx: async (tx: unknown) => {
    signedClaim = await (tx as any).sign.withWallet().complete({ localUPLCEval: false })
    // Evaluate before submit: a rejected ledger submission throws inside submitInfrastructure
    // and otherwise prevents us from collecting Ogmios per-redeemer diagnostics.
    try {
      const evaluated = await evaluateYaciTx(
        signedClaim.toCBOR(),
        lastClaimAdditionalUTxOs,
      )
      console.log('[CLAIM-POSITIVE-RAW-EVALUATION] ' + JSON.stringify({ result: evaluated }).slice(0, 3500))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[CLAIM-POSITIVE-RAW-EVALUATION-FAILURE] ' + JSON.stringify({
        scriptFailureVersion: message.match(/The PlutusV[123] script failed/)?.[0] ?? null,
        expectedClaimMarkers: [
          'Prize: claim prize input must be Revealed',
          'Prize: payout',
          'B1PrizePool: accounting must match actual value',
          'B1PrizePool: liquidity must increase',
          'B1PrizePool: owner not signed',
        ].filter((marker) => message.includes(marker)),
        error: message.slice(0, 3500),
      }))
    }
    return signedClaim
  },
  submitTx: async (signedTx: unknown) => (signedTx as any).submit(),
})
let submission: { transactionRef: string }
try {
  submission = await executionAdapter.submitInfrastructure(validTx)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  const signedCbor = signedClaim ? (signedClaim as any).toCBOR() as string : null
  const txBytes = signedCbor ? Buffer.from(signedCbor, 'hex') : null
  const txSummary = signedCbor ? describeTx(signedCbor) : null
  console.error('[CLAIM-POSITIVE-SUBMISSION-FAILURE] ' + JSON.stringify({
    stage: signedClaim ? 'ledger-submission' : 'signing-or-submission',
    serializedBytes: txBytes?.length ?? null,
    txSha256: txSummary?.txSha256 ?? null,
    bodyHash: txSummary?.bodyHash ?? null,
    redeemers: txSummary?.redeemers ?? null,
    scriptFailureVersion: message.match(/The PlutusV[123] script failed/)?.[0] ?? null,
    error: message.slice(0, 1800),
  }))
  throw error
}
const txHash = submission.transactionRef
if (!signedClaim) {
  throw new Error('Claim execution adapter did not retain the signed transaction')
}
const txCbor = signedClaim.toCBOR() as string
await lucid.awaitTx(txHash)

let replayRejected = false
let replayError = ''
try {
  await signedClaim.submit()
} catch (error) {
  replayRejected = true
  replayError = error instanceof Error ? error.message : String(error)
}
if (!replayRejected) {
  throw new Error('duplicate/stale Claim transaction was unexpectedly accepted')
}

const postPrizeUtxos = await waitFor(
  () => lucid.utxosAt(scripts.prizeAddress as string),
  (xs) => xs.some((u) =>
    u.txHash === txHash && u.assets.lovelace === 3_000_000n,
  ),
  'Claimed continuing Prize UTxO',
)
const postPoolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) =>
    u.txHash === txHash && u.assets[poolUnit] === 1n,
  ),
  'Claimed continuing B1PrizePool UTxO',
)
const postPrize = postPrizeUtxos.find((u) => u.txHash === txHash) as UTxO
const postPool = postPoolUtxos.find((u) => u.txHash === txHash && u.assets[poolUnit] === 1n) as UTxO

const postPrizeFields = Data.from(postPrize.datum as string) as any
if (postPrizeFields.index !== 0 || postPrizeFields.fields[10]?.index !== 2) {
  throw new Error('Claim did not materialize PrizeDatum status Claimed')
}
if (
  BigInt(postPrizeFields.fields[21]) !== BigInt(ROW1_TIER) ||
  BigInt(postPrizeFields.fields[22]) !== BigInt(ROW2_TIER)
) {
  throw new Error('Claim changed one or both immutable Row Tier fields')
}

const postPoolFields = (Data.from(postPool.datum as string) as any).fields
const postLiquidity = BigInt(postPoolFields[0])
const postLiabilities = BigInt(postPoolFields[1])
if (postLiquidity !== PRE_POOL_LIQUIDITY - PRIZE_AMOUNT) {
  throw new Error('Claim changed total Pool liquidity by an amount other than the exact payout')
}
if (postLiabilities !== 0n) {
  throw new Error('Claim did not release the exact pending liability')
}
if (
  BigInt(postPoolFields[2]) !== 0n ||
  BigInt(postPoolFields[3]) !== 0n
) {
  throw new Error('Claim unexpectedly changed unresolved reserve/count')
}

const observedPoolOutputLovelace = postPool.assets.lovelace ?? 0n
if (POOL_LOVELACE - observedPoolOutputLovelace !== PRIZE_AMOUNT * 1_000_000n / ADA_PRICE_USDM_SUBUNITS) {
  throw new Error('Claim physical Pool value delta does not equal the exact payout')
}

const walletAfter = await lucid.utxosAt(address)
const ticketQuantity = walletAfter.reduce(
  (sum, u) => sum + (u.assets[ticketUnit] ?? 0n),
  0n,
)
if (ticketQuantity < 1n) {
  throw new Error('Claim did not preserve ticket NFT ownership in the wallet')
}

const postStateFingerprint = hashJson({
  prizeRef: ref(postPrize),
  prizeDatum: postPrize.datum,
  poolRef: ref(postPool),
  poolDatum: postPool.datum,
  ticketQuantity: ticketQuantity.toString(),
})
const actionFingerprint = hashJson({
  actionClass: 'CLAIM',
  ticketInput: ref(prizeUtxo as UTxO),
  poolInput: ref(poolUtxo as UTxO),
  ownerTicketInput: ref(ticketUtxo as UTxO),
  ticketPolicyId,
  ticketNameHex: TICKET_NAME_HEX,
  payoutUsdmSubunits: PRIZE_AMOUNT,
  row1Tier: ROW1_TIER,
  row2Tier: ROW2_TIER,
  oracleReference: ref(oracleUtxo as UTxO),
})

const observedEvidence: CardanoObservedTransitionEvidence = {
  evidenceId: hashJson({
    fixtureId: 'C3-YACI-CLAIM-001',
    actionFingerprint,
    preStateFingerprint,
    postStateFingerprint,
    transactionRef: txHash,
  }),
  fixtureId: 'C3-YACI-CLAIM-001',
  actionClass: 'CLAIM',
  environment: 'local-yaci-devnet',
  preStateObservationFingerprint: preStateFingerprint,
  postStateObservationFingerprint: postStateFingerprint,
  actionObservationFingerprint: actionFingerprint,
  transactionRef: txHash,
}
assertCardanoObservedTransitionBinding(observedEvidence, {
  actionClass: 'CLAIM',
  environment: 'local-yaci-devnet',
  preStateObservationFingerprint: preStateFingerprint,
  postStateObservationFingerprint: postStateFingerprint,
  actionObservationFingerprint: actionFingerprint,
  transactionRef: txHash,
})

const evidence = {
  purpose: 'C3 real-local-yaci-cardano-claim-conformance',
  claimFixture: 'synthetic-revealed-state-not-production-issue-or-reveal-evidence',
  environment: 'local-yaci-devnet',
  bootstrapHash,
  transactionRef: txHash,
  txCbor,
  action: {
    actionClass: 'CLAIM',
    priceUsdm: PRICE_USDM.toString(),
    payoutUsdmSubunits: PRIZE_AMOUNT.toString(),
    row1Tier: ROW1_TIER,
    row2Tier: ROW2_TIER,
  },
  oracle: {
    reference: ref(oracleUtxo as UTxO),
    stateUnit: oracleStateUnit,
    publisherPkh: keyHash,
    assetPolicy: 'ADA',
    assetNameHex: '',
    priceUsdmSubunitsPerLovelace: ADA_PRICE_USDM_SUBUNITS.toString(),
    timestamp: fixtureOracleTimestamp.toString(),
    productionOracleQualified: false,
  },
  addresses: {
    ownerWalletAddress: address,
    PrizeValidatorClaimAddress: claimantAddress,
    samePaymentCredential: true,
  },
  preState: {
    prizeRef: ref(prizeUtxo as UTxO),
    poolRef: ref(poolUtxo as UTxO),
    ticketRef: ref(ticketUtxo as UTxO),
    fingerprint: preStateFingerprint,
  },
  postState: {
    prizeRef: ref(postPrize),
    poolRef: ref(postPool),
    fingerprint: postStateFingerprint,
  },
  observedCardanoTransitionEvidence: observedEvidence,
  accounting: {
    poolInputLiquidityUsdmSubunits: PRE_POOL_LIQUIDITY.toString(),
    poolOutputLiquidityUsdmSubunits: postLiquidity.toString(),
    pendingLiabilitiesBefore: PRIZE_AMOUNT.toString(),
    pendingLiabilitiesAfter: postLiabilities.toString(),
    physicalPoolInputLovelace: POOL_LOVELACE.toString(),
    physicalPoolOutputLovelace: observedPoolOutputLovelace.toString(),
    payoutLovelaceToClaimAddress: payoutLovelace.toString(),
    ticketNftQuantityAtWallet: ticketQuantity.toString(),
  },
  negativeTwins: negativeResults,
  evaluatorFallbacks: claimEvaluationFallbacks,
  replay: {
    rejected: replayRejected,
    error: replayError,
  },
  actionFingerprint,
  evidenceFingerprint: hashJson({
    bootstrapHash,
    txHash,
    actionFingerprint,
    preStateFingerprint,
    postStateFingerprint,
    negativeResults,
  }),
}

writeFileSync(
  'audit/yaci-evidence/claim-transition.json',
  JSON.stringify(evidence, null, 2),
)
writeFileSync(
  'audit/yaci-evidence/claim-tx.cbor',
  Buffer.from(txCbor, 'hex'),
)

const txUtxosResponse = await fetch(API + '/txs/' + txHash + '/utxos')
if (!txUtxosResponse.ok) {
  throw new Error('Yaci Claim tx/utxos query failed: ' + txUtxosResponse.status)
}
const txUtxos = await txUtxosResponse.json()
writeFileSync(
  'audit/yaci-evidence/claim-ledger-utxos.json',
  JSON.stringify(txUtxos, null, 2),
)

console.log(JSON.stringify({
  claimResult: 'PASS',
  transactionRef: txHash,
  bootstrapHash,
  consumedUtxos: [
    ref(prizeUtxo as UTxO),
    ref(poolUtxo as UTxO),
    ref(ticketUtxo as UTxO),
  ],
  producedUtxos: [ref(postPrize), ref(postPool)],
  payoutUsdmSubunits: PRIZE_AMOUNT.toString(),
  row1Tier: ROW1_TIER,
  row2Tier: ROW2_TIER,
  ticketQuantity: ticketQuantity.toString(),
  negativeTwinsRejected: negativeResults.length,
  evaluatorFallbacks: claimEvaluationFallbacks.length,
  replayRejected,
}, null, 2))
