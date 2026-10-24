/** Diagnostic-only comparison of V3 parameter encodings.
 * Builds/evaluates two otherwise identical mint transactions and NEVER signs or submits.
 * This is not protocol evidence and does not alter the production policy or Reveal.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, mintingPolicyToId, type Script } from '@lucid-evolution/lucid'
import { sanitizeEvaluationDiagnosticText } from './sanitize-yaci-evaluation-error.mjs'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const TOKEN_NAME_HEX = '45434f4e4f4d49435354415445'
const OUTPUT = 'audit/yaci-evidence/v3-parameter-encoding-comparison.json'

const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8'))
const lucid = await Lucid(new Blockfrost(API, ''), 'Preprod')
lucid.selectWallet.fromSeed(wallet.seed)
const address = await lucid.wallet().address()
const utxos = await lucid.wallet().getUtxos()
if (!utxos.length) throw new Error('V3 parameter comparison wallet has no UTxOs')
const seed = utxos[0]
const artifact = JSON.parse(readFileSync('plutus/out/v3EconomicStateCarrierMintPolicy.plutus.json', 'utf8'))
if (artifact.type !== 'PlutusScriptV2' || typeof artifact.cborHex !== 'string') {
  throw new Error('invalid generated V3 carrier mint policy artifact')
}

const seedParam = new Constr(0, [new Constr(0, [seed.txHash]), BigInt(seed.outputIndex)])
const variants = [
  { id: 'typed-token-name-direct', tokenParam: TOKEN_NAME_HEX },
  { id: 'legacy-builtin-data-wrapper', tokenParam: new Constr(0, [TOKEN_NAME_HEX]) },
]
const results = []
for (const variant of variants) {
  try {
    const policy: Script = {
      type: 'PlutusV2',
      script: applyParamsToScript(artifact.cborHex, [seedParam, variant.tokenParam]),
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
      variant: variant.id,
      policyId,
      scriptBytes: Buffer.from(policy.script, 'hex').length,
      txBuilt: true,
      signed: false,
      submitted: false,
      result: 'EVALUATION_AND_BUILD_PASS',
    })
    // Deliberately do not sign or submit this transaction.
    void tx
  } catch (error) {
    results.push({
      variant: variant.id,
      txBuilt: false,
      signed: false,
      submitted: false,
      result: 'EVALUATION_OR_BUILD_FAIL',
      error: sanitizeEvaluationDiagnosticText(String(error?.message ?? error), 1200),
    })
  }
}
const evidence = {
  schema: 'IMMORTAL-V3-PARAM-ENCODING-COMPARISON-v1',
  observedAt: new Date().toISOString(),
  classification: 'DIAGNOSTIC_ONLY_NOT_LEDGER_EVIDENCE',
  sourceArtifactSha256: createHash('sha256').update(artifact.cborHex).digest('hex'),
  seedRef: seed.txHash + '#' + seed.outputIndex,
  provider: '@lucid-evolution/provider@0.2.4',
  noTransactionSignedOrSubmitted: true,
  noProtocolOrV3RevealSemanticsChanged: true,
  results,
  interpretation: 'A successful complete() is provider-evaluation/build evidence only; neither variant is submitted.',
}
mkdirSync('audit/yaci-evidence', { recursive: true })
writeFileSync(OUTPUT, JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify(evidence, null, 2))
if (results.length !== 2) process.exitCode = 1
