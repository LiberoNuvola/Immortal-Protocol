/** Diagnostic-only isolation matrix for the V3 TxOutRef evaluator failure.
 * Uses temporary diagnostic policies; never signs or submits transactions.
 * Production V3 and Reveal sources/semantics are not changed.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, mintingPolicyToId, type Script } from '@lucid-evolution/lucid'
import { sanitizeEvaluationDiagnosticText } from './sanitize-yaci-evaluation-error.mjs'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const TOKEN_NAME_HEX = '45434f4e4f4d49435354415445'
const OUTPUT = 'audit/yaci-evidence/v3-txoutref-isolation-matrix.json'

const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8'))
const lucid = await Lucid(new Blockfrost(API, ''), 'Preprod')
lucid.selectWallet.fromSeed(wallet.seed)
const address = await lucid.wallet().address()
const utxos = await lucid.wallet().getUtxos()
if (!utxos.length) throw new Error('V3 isolation matrix wallet has no UTxOs')
const seed = utxos[0]
const seedParam = new Constr(0, [new Constr(0, [seed.txHash]), BigInt(seed.outputIndex)])

const cases = [
  { id: 'no-context-baseline', file: 'plutus/out/v3DiagnosticNoContext.plutus.json', paramType: 'typed-txoutref' },
  { id: 'read-inputs-only', file: 'plutus/out/v3DiagnosticReadInputs.plutus.json', paramType: 'typed-txoutref' },
  { id: 'compare-seed-txoutref', file: 'plutus/out/v3DiagnosticCompareSeed.plutus.json', paramType: 'builtin-data' },
  { id: 'decode-seed-explicitly', file: 'plutus/out/v3DiagnosticDecodeSeed.plutus.json', paramType: 'builtin-data' },
  { id: 'raw-decode-seed-and-name', file: 'plutus/out/v3DiagnosticRawDecodeSeedAndName.plutus.json', paramType: 'builtin-data-two' },
  { id: 'raw-decode-seed-name-singleton', file: 'plutus/out/v3DiagnosticRawDecodeSeedAndNameSingleton.plutus.json', paramType: 'builtin-data-two' },
  { id: 'raw-decode-name-mint-only', file: 'plutus/out/v3DiagnosticRawDecodeNameMintOnly.plutus.json', paramType: 'raw-token-name-only' },
  { id: 'seed-consumed-only', file: 'plutus/out/v3DiagnosticSeedConsumedOnly.plutus.json', paramType: 'typed-txoutref' },
  { id: 'seed-consumed-serialized', file: 'plutus/out/v3DiagnosticSeedConsumedSerialized.plutus.json', paramType: 'typed-txoutref' },
  // Compare both Data encodings against a validator whose Haskell parameter is typed TokenName.
  { id: 'assocmap-mint-only-bare-bytes', file: 'plutus/out/v3DiagnosticAssocMapMintOnly.plutus.json', paramType: 'token-name-only-bare' },
  { id: 'singleton-mint-only-constr-bytes', file: 'plutus/out/v3DiagnosticSingletonMintOnly.plutus.json', paramType: 'token-name-only-constr' },
]
const results = []
const providerResponses = []
const originalFetch = globalThis.fetch.bind(globalThis)
let activeCase = 'setup'
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : String(input?.url ?? input)
  const method = String(init.method ?? 'GET').toUpperCase()
  const response = await originalFetch(input, init)
  if (method === 'POST' && url.includes('/utils/txs/evaluate/utxos')) {
    let raw = ''
    try { raw = await response.clone().text() } catch {}
    let parsed = null
    try { parsed = JSON.parse(raw) } catch {}
    const msg = parsed && typeof parsed.message === 'string'
      ? parsed.message
      : parsed && typeof parsed.error === 'string' ? parsed.error : ''
    providerResponses.push({
      case: activeCase,
      httpStatus: response.status,
      httpOk: response.ok,
      responseSha256: createHash('sha256').update(raw).digest('hex'),
      responseBytes: Buffer.byteLength(raw),
      topLevelKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed) : [],
      sanitizedMessage: sanitizeEvaluationDiagnosticText(msg, 1600),
    })
  }
  return response
}

for (const item of cases) {
  activeCase = item.id
  try {
    const artifact = JSON.parse(readFileSync(item.file, 'utf8'))
    if (artifact.type !== 'PlutusScriptV2' || typeof artifact.cborHex !== 'string') {
      throw new Error('invalid diagnostic policy artifact')
    }
    // Both direct typed-TokenName encodings are kept as independent probes:
    // bare bytestring Data versus Constr(0,[bytestring]) Data. The v9 run showed
    // that bare bytes still reaches the typed parameter as BuiltinData and fails
    // with "expected: bytestring; actual: data"; this matrix checks whether the
    // constructor-wrapped shape changes that failure. Raw BuiltinData cases are
    // separate and explicitly decode at the validator boundary.
    const nameParam = item.paramType === 'token-name-only-constr'
      ? new Constr(0, [TOKEN_NAME_HEX])
      : TOKEN_NAME_HEX
    const params = item.paramType.startsWith('token-name-only-') || item.paramType === 'raw-token-name-only'
      ? [nameParam]
      : [seedParam, nameParam]
    const policy: Script = {
      type: 'PlutusV2',
      script: applyParamsToScript(artifact.cborHex, params),
    }
    const policyId = mintingPolicyToId(policy)
    const unit = policyId + TOKEN_NAME_HEX
    const tx = await lucid.newTx()
      .collectFrom([seed])
      .mintAssets({ [unit]: 1n }, Data.void())
      .attach.MintingPolicy(policy)
      .pay.ToAddress(address, { lovelace: 2_000_000n, [unit]: 1n })
      .complete({ localUPLCEval: false })
    results.push({
      case: item.id,
      paramType: item.paramType,
      policyId,
      txBuilt: true,
      signed: false,
      submitted: false,
      result: 'EVALUATION_AND_BUILD_PASS',
    })
    void tx
  } catch (error) {
    const caughtError = sanitizeEvaluationDiagnosticText(String(error?.message ?? error), 1200)
    // Lucid 0.6.5 may throw a secondary "EvaluationResult in undefined" error
    // after the provider returns HTTP 400. Prefer the recorded, sanitized Yaci
    // response as the primary diagnostic and retain Lucid's wrapper error
    // separately so the matrix cannot misclassify the cause.
    const providerFailure = [...providerResponses].reverse().find(
      (response) => response.case === item.id && response.httpOk === false,
    )
    results.push({
      case: item.id,
      paramType: item.paramType,
      txBuilt: false,
      signed: false,
      submitted: false,
      result: 'EVALUATION_OR_BUILD_FAIL',
      providerHttpStatus: providerFailure?.httpStatus ?? null,
      providerResponseSha256: providerFailure?.responseSha256 ?? null,
      error: providerFailure?.sanitizedMessage ?? caughtError,
      wrapperError: providerFailure ? caughtError : null,
    })
  }
}

const evidence = {
  schema: 'IMMORTAL-V3-TXOUTREF-ISOLATION-MATRIX-v12',
  observedAt: new Date().toISOString(),
  classification: 'DIAGNOSTIC_ONLY_NOT_LEDGER_EVIDENCE',
  seedRef: seed.txHash + '#' + seed.outputIndex,
  provider: '@lucid-evolution/provider@0.2.4',
  noTransactionSignedOrSubmitted: true,
  noProductionV3OrRevealSemanticsChanged: true,
  cases: results,
  providerResponses,
  interpretation: 'Compare typed TxOutRef equality against serialized BuiltinData equality; compare both TokenName Data encodings for the typed parameter factories; compare raw BuiltinData parameter wrappers against equivalent typed validation logic, including the exact singleton Value predicate. All cases are diagnostic only.',
}
mkdirSync('audit/yaci-evidence', { recursive: true })
writeFileSync(OUTPUT, JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify(evidence, null, 2))
if (results.length !== cases.length) process.exitCode = 1
