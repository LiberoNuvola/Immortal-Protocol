import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { Blockfrost, Lucid } from '@lucid-evolution/lucid'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const OUTPUT = 'audit/yaci-evidence/evaluation-contract.json'
const TIMEOUT_MS = 10_000

// Apply a bounded timeout to Lucid's own provider request as well as the raw probes.
const originalFetch = globalThis.fetch.bind(globalThis)
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : String(input?.url ?? '')
  if (url.includes('/utils/txs/evaluate/utxos') && !init.signal) {
    return originalFetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
  }
  return originalFetch(input, init)
}

function topKeys(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value)
    : []
}

function responseSummary(path, status, contentType, raw, parsed, cbor, isJson) {
  const result = parsed && typeof parsed === 'object' ? parsed.result : undefined
  const messageValue = parsed && typeof parsed === 'object'
    ? (parsed.message ?? parsed.error ?? parsed.fault)
    : undefined
  let message = typeof messageValue === 'string' ? messageValue : null
  if (message) {
    message = message.split(cbor).join('[CBOR_REDACTED]').slice(0, 240)
  }
  return {
    path,
    httpStatus: status,
    httpOk: status >= 200 && status < 300,
    contentType: contentType ?? null,
    responseBytes: Buffer.byteLength(raw),
    isJson,
    topLevelKeys: topKeys(parsed),
    resultKeys: topKeys(result),
    evaluationResultPresent: Boolean(
      result && typeof result === 'object' &&
      Object.prototype.hasOwnProperty.call(result, 'EvaluationResult')
    ),
    message,
  }
}

async function postJsonContract(path, body, cbor) {
  try {
    const response = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const raw = await response.text()
    let parsed = null
    let isJson = false
    try { parsed = JSON.parse(raw); isJson = true } catch {}
    return responseSummary(path, response.status, response.headers.get('content-type'), raw, parsed, cbor, isJson)
  } catch (error) {
    return {
      path,
      httpStatus: null,
      httpOk: false,
      transportErrorClass: String(error?.name ?? 'Error'),
      timedOut: String(error?.name ?? '') === 'TimeoutError',
    }
  }
}

async function postClassicContract(path, cbor) {
  try {
    const response = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/cbor' },
      // Blockfrost's classic evaluate endpoint accepts the transaction as hex text.
      // This is an unsigned, no-Plutus transaction built locally and is never submitted.
      body: cbor,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const raw = await response.text()
    let parsed = null
    let isJson = false
    try { parsed = JSON.parse(raw); isJson = true } catch {}
    return responseSummary(path, response.status, response.headers.get('content-type'), raw, parsed, cbor, isJson)
  } catch (error) {
    return {
      path,
      httpStatus: null,
      httpOk: false,
      transportErrorClass: String(error?.name ?? 'Error'),
      timedOut: String(error?.name ?? '') === 'TimeoutError',
    }
  }
}

function classifyProviderError(error) {
  const message = String(error?.message ?? '')
  if (/Cannot use 'in' operator|EvaluationResult.*undefined/i.test(message)) return 'EVALUATION_RESULT_UNDEFINED'
  if (/404|not found/i.test(message)) return 'ROUTE_NOT_FOUND'
  if (/400|bad request|invalid hexadecimal/i.test(message)) return 'PROVIDER_BAD_REQUEST'
  if (/fetch failed|timeout|timed out|aborted/i.test(message)) return 'TRANSPORT_OR_TIMEOUT'
  if (/EvaluateTransaction fails/i.test(message)) return 'PROVIDER_RESULT_SCHEMA_REJECTED'
  if (/PROVIDER_RETURNED_NON_ARRAY/i.test(message)) return 'PROVIDER_RETURNED_NON_ARRAY'
  return 'PROVIDER_EVALUATION_ERROR'
}

const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8'))
if (wallet?.purpose !== 'ephemeral-local-devnet-only' || !wallet?.seed || !wallet?.address) {
  throw new Error('LOCAL_DEVNET_WALLET_FIXTURE_INVALID')
}

const provider = new Blockfrost(API, '')
const lucid = await Lucid(provider, 'Preprod')
lucid.selectWallet.fromSeed(wallet.seed)
const address = await lucid.wallet().address()
if (address !== wallet.address) throw new Error('LOCAL_DEVNET_WALLET_ADDRESS_MISMATCH')

const utxos = await lucid.wallet().getUtxos()
if (utxos.length === 0) throw new Error('LOCAL_DEVNET_WALLET_HAS_NO_UTXOS')

// A valid unsigned transaction is constructed in memory. No signature, submission,
// mint, bootstrap, or ledger mutation occurs in this diagnostic.
const tx = await lucid.newTx()
  .pay.ToAddress(address, { lovelace: 1_000_000n })
  .complete()
const cbor = tx.toCBOR()
if (typeof cbor !== 'string' || cbor.length === 0 || cbor.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(cbor)) {
  throw new Error('VALID_LOCAL_TRANSACTION_CBOR_NOT_PRODUCED')
}

const expectedLucidRoute = await postJsonContract(
  '/utils/txs/evaluate/utxos',
  { cbor },
  cbor,
)
const classicRoute = await postClassicContract('/utils/txs/evaluate', cbor)

let providerCall
try {
  const redeemers = await provider.evaluateTx(cbor)
  if (!Array.isArray(redeemers)) throw new Error('PROVIDER_RETURNED_NON_ARRAY')
  providerCall = {
    status: 'PASS',
    returnedRedeemerCount: redeemers.length,
    returnedArray: true,
  }
} catch (error) {
  providerCall = {
    status: 'FAIL',
    errorClass: String(error?.name ?? 'Error'),
    failureClass: classifyProviderError(error),
  }
}

const yaciLog = readFileSync('audit/yaci-evidence/yaci.log', 'utf8')
const evaluatorModeMatch = yaciLog.match(/Yaci Store tx evaluator mode:\\s*([a-z]+)/i)
const evaluatorMode = evaluatorModeMatch ? evaluatorModeMatch[1].toLowerCase() : 'NOT_RECORDED'

const evidence = {
  schema: 'IMMORTAL-YACI-LUCID-EVALUATION-CONTRACT-v1',
  observedAt: new Date().toISOString(),
  endpointBase: API,
  yaciEvaluatorMode: evaluatorMode,
  providerPackage: '@lucid-evolution/provider@0.2.4 (locked via @lucid-evolution/lucid@0.6.5)',
  providerExpectedRequest: {
    method: 'POST',
    path: '/utils/txs/evaluate/utxos',
    contentType: 'application/json',
    bodyShape: { cbor: '<unsigned transaction CBOR as hex string>' },
    successShape: 'result.EvaluationResult',
  },
  transactionFixture: {
    source: 'Lucid local Yaci wallet, built in memory',
    kind: 'unsigned no-Plutus transaction',
    cborHexCharacters: cbor.length,
    cborSha256: createHash('sha256').update(cbor, 'hex').digest('hex'),
    signed: false,
    submitted: false,
    ledgerMutation: false,
  },
  endpointComparisons: {
    lucidExpectedRoute: expectedLucidRoute,
    classicEvaluateRoute: classicRoute,
  },
  providerCall,
  interpretation: {
    providerContractPass: providerCall.status === 'PASS',
    provesPlutusScriptEvaluation: false,
    provesV3CarrierAcceptance: false,
    provesRevealAcceptance: false,
    noExUnitsInvented: true,
  },
}

mkdirSync('audit/yaci-evidence', { recursive: true })
writeFileSync(OUTPUT, JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify({
  status: providerCall.status,
  providerFailureClass: providerCall.status === 'FAIL' ? providerCall.failureClass : null,
  expectedRouteHttpStatus: expectedLucidRoute.httpStatus,
  expectedRouteEvaluationResultPresent: expectedLucidRoute.evaluationResultPresent ?? false,
  classicRouteHttpStatus: classicRoute.httpStatus,
  classicRouteEvaluationResultPresent: classicRoute.evaluationResultPresent ?? false,
  cborLength: cbor.length,
  cborSha256: evidence.transactionFixture.cborSha256,
  signed: false,
  submitted: false,
  evidencePath: OUTPUT,
}, null, 2))

if (providerCall.status !== 'PASS') {
  throw new Error('YACI_EVALUATION_CONTRACT_FAILED: ' + providerCall.failureClass)
}
