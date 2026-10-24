/** V3 carrier mint probe against the local Yaci Conway devnet.
 * localUPLCEval:false disables Lucid's local UPLC evaluator, but does not bypass
 * provider-side transaction evaluation during complete(). The transaction is only
 * submitted to the ledger if provider evaluation and transaction completion succeed.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, mintingPolicyToId, type Script } from '@lucid-evolution/lucid'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const TOKEN_NAME_HEX = '45434f4e4f4d49435354415445' // ECONOMICSTATE


// Diagnostic-only tap: record the actual response to Lucid's Plutus evaluation
// request without changing the request/response or logging transaction bytes.
const EVALUATION_EVIDENCE_PATH = 'audit/yaci-evidence/v3-provider-evaluation-response.json'
const originalFetch = globalThis.fetch.bind(globalThis)
let evaluationRequestNumber = 0

globalThis.fetch = async (input, init = {}) => {
  const rawUrl = typeof input === 'string' ? input : String(input?.url ?? input)
  const method = String(init.method ?? 'GET').toUpperCase()
  if (method !== 'POST' || !rawUrl.includes('/utils/txs/evaluate/utxos')) {
    return originalFetch(input, init)
  }

  const requestNumber = ++evaluationRequestNumber
  const headers = init.headers && typeof init.headers === 'object' ? init.headers : {}
  const contentType = headers['Content-Type'] ?? headers['content-type'] ?? null
  const requestBody = typeof init.body === 'string' ? init.body : ''
  let parsedRequest = null
  try { parsedRequest = JSON.parse(requestBody) } catch {}
  const cbor = typeof parsedRequest?.cbor === 'string' ? parsedRequest.cbor : ''
  const validCborHex = cbor.length > 0 && cbor.length % 2 === 0 && /^[0-9a-f]+$/i.test(cbor)
  const requestSummary = {
    requestNumber,
    method,
    path: '/utils/txs/evaluate/utxos',
    contentType,
    requestBodyJsonParsed: parsedRequest !== null,
    requestBodyKeys: parsedRequest && typeof parsedRequest === 'object' && !Array.isArray(parsedRequest)
      ? Object.keys(parsedRequest)
      : [],
    cborHexCharacters: cbor.length,
    cborHexValid: validCborHex,
    cborSha256: validCborHex
      ? createHash('sha256').update(cbor, 'hex').digest('hex')
      : null,
    additionalUtxoSetPresent: Array.isArray(parsedRequest?.additionalUtxoSet)
      && parsedRequest.additionalUtxoSet.length > 0,
  }

  const writeObservation = (responseSummary) => {
    const evidence = {
      schema: 'IMMORTAL-YACI-V3-PROVIDER-RESPONSE-DIAGNOSTIC-v1',
      observedAt: new Date().toISOString(),
      classification: 'DIAGNOSTIC_ONLY',
      provider: '@lucid-evolution/provider@0.2.4',
      endpointBase: API,
      noRawTransactionCborStored: true,
      noRawResponseBodyStored: true,
      request: requestSummary,
      response: responseSummary,
      noProtocolOrV3RevealSemanticsChanged: true,
    }
    mkdirSync('audit/yaci-evidence', { recursive: true })
    writeFileSync(EVALUATION_EVIDENCE_PATH, JSON.stringify(evidence, null, 2) + '\n')
  }

  let response
  try {
    response = await originalFetch(input, init)
  } catch (error) {
    writeObservation({
      transportFailure: true,
      errorClass: String(error?.name ?? 'Error'),
      timedOut: String(error?.name ?? '') === 'TimeoutError',
    })
    throw error
  }

  let raw = ''
  let parsed = null
  let jsonParsed = false
  try {
    raw = await response.clone().text()
    try { parsed = JSON.parse(raw); jsonParsed = true } catch {}
  } catch (error) {
    writeObservation({
      httpStatus: response.status,
      httpOk: response.ok,
      contentType: response.headers.get('content-type'),
      responseReadFailure: true,
      errorClass: String(error?.name ?? 'Error'),
    })
    return response
  }

  const result = parsed && typeof parsed === 'object' ? parsed.result : undefined
  const resultKeys = result && typeof result === 'object' && !Array.isArray(result)
    ? Object.keys(result)
    : []
  writeObservation({
    httpStatus: response.status,
    httpOk: response.ok,
    contentType: response.headers.get('content-type'),
    responseBytes: Buffer.byteLength(raw),
    responseSha256: createHash('sha256').update(raw).digest('hex'),
    jsonParsed,
    topLevelKeys: parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? Object.keys(parsed)
      : [],
    resultValueType: result === null ? 'null' : typeof result,
    resultKeys,
    evaluationResultPresent: Boolean(
      result && typeof result === 'object'
      && Object.prototype.hasOwnProperty.call(result, 'EvaluationResult')
    ),
    cannotCreateEvaluationContextPresent: Boolean(
      result && typeof result === 'object'
      && Object.prototype.hasOwnProperty.call(result, 'CannotCreateEvaluationContext')
    ),
    faultFieldPresent: Boolean(parsed && typeof parsed === 'object'
      && Object.prototype.hasOwnProperty.call(parsed, 'fault')),
    errorFieldType: parsed && typeof parsed === 'object' ? typeof parsed.error : 'absent',
    messageFieldType: parsed && typeof parsed === 'object' ? typeof parsed.message : 'absent',
  })
  return response
}


const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8'))
const lucid = await Lucid(new Blockfrost(API, ''), 'Preprod')
lucid.selectWallet.fromSeed(wallet.seed)

const address = await lucid.wallet().address()
const utxos = await lucid.wallet().getUtxos()
if (utxos.length === 0) throw new Error('V3 ledger probe wallet has no UTxOs')

const seed = utxos[0]
const artifact = JSON.parse(
  readFileSync('plutus/out/v3EconomicStateCarrierMintPolicy.plutus.json', 'utf8'),
)
if (artifact.type !== 'PlutusScriptV2' || typeof artifact.cborHex !== 'string') {
  throw new Error('invalid generated V3 carrier mint policy artifact')
}

const policy: Script = {
  type: 'PlutusV2',
  script: applyParamsToScript(artifact.cborHex, [
    new Constr(0, [new Constr(0, [seed.txHash]), BigInt(seed.outputIndex)]),
    new Constr(0, [TOKEN_NAME_HEX]),
  ]),
}
const policyId = mintingPolicyToId(policy)
const unit = policyId + TOKEN_NAME_HEX

const tx = await lucid
  .newTx()
  .collectFrom([seed])
  .mintAssets({ [unit]: 1n }, Data.void())
  .attach.MintingPolicy(policy)
  .pay.ToAddress(address, { lovelace: 2_000_000n, [unit]: 1n })
  .complete({ localUPLCEval: false })

const signed = await tx.sign.withWallet().complete()
const txHash = await signed.submit()
await lucid.awaitTx(txHash)

console.log(JSON.stringify({
  result: 'V3_CARRIER_LEDGER_ACCEPTED',
  evaluator: 'Cardano ledger via Yaci devnet',
  txHash,
  seedRef: seed.txHash + '#' + seed.outputIndex,
  policyId,
  unit,
}, null, 2))
