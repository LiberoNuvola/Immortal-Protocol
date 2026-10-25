/** Test-only differential diagnosis for the V3 carrier mint policy.
 * Runs only against the disposable Yaci devnet. Never use these policies on Preprod.
 * Each variant is submitted to the native Cardano ledger and its outcome is recorded.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, mintingPolicyToId, type Script } from '@lucid-evolution/lucid'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const TOKEN_NAME_HEX = '45434f4e4f4d49435354415445'
const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8'))
const provider = new Blockfrost(API, '')
;(provider as unknown as { evaluateTx: () => Promise<unknown> }).evaluateTx = async () => [
  { redeemer_tag: 'mint', redeemer_index: 0, ex_units: { mem: 10_000_000, steps: 5_000_000_000 } },
]
const lucid = await Lucid(provider, 'Preprod')
lucid.selectWallet.fromSeed(wallet.seed)
const address = await lucid.wallet().address()

const variants = [
  { name: 'always-pass', path: 'plutus/out/v3DiagnosticAlwaysPass.plutus.json' },
  { name: 'typed-seed-param-only', path: 'plutus/out/v3DiagnosticTypedSeedParamOnly.plutus.json' },
  { name: 'typed-token-name-param-only', path: 'plutus/out/v3DiagnosticTypedTokenNameParamOnly.plutus.json' },
  { name: 'seed-param-only', path: 'plutus/out/v3DiagnosticSeedParamOnly.plutus.json' },
  { name: 'token-name-param-only', path: 'plutus/out/v3DiagnosticTokenNameParamOnly.plutus.json' },
  { name: 'context-inputs-only', path: 'plutus/out/v3DiagnosticContextInputsOnly.plutus.json' },
  { name: 'seed-only', path: 'plutus/out/v3DiagnosticSeedOnly.plutus.json' },
  { name: 'mint-only', path: 'plutus/out/v3DiagnosticMintOnly.plutus.json' },
] as const
const results: Array<Record<string, unknown>> = []

for (const variant of variants) {
  try {
    const utxos = await lucid.wallet().getUtxos()
    if (utxos.length === 0) throw new Error('diagnostic wallet has no UTxOs')
    const seed = utxos[0]
    const artifact = JSON.parse(readFileSync(variant.path, 'utf8'))
    if (artifact.type !== 'PlutusScriptV2' || typeof artifact.cborHex !== 'string') {
      throw new Error('invalid diagnostic artifact: ' + variant.path)
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
    const tx = await lucid.newTx()
      .collectFrom([seed])
      .mintAssets({ [unit]: 1n }, Data.void())
      .attach.MintingPolicy(policy)
      .pay.ToAddress(address, { lovelace: 2_000_000n, [unit]: 1n })
      .complete({ localUPLCEval: false })
    const signed = await tx.sign.withWallet().complete()
    const txHash = await signed.submit()
    await lucid.awaitTx(txHash)
    results.push({ variant: variant.name, outcome: 'ACCEPTED_BY_NATIVE_LEDGER', txHash, seedRef: seed.txHash + '#' + seed.outputIndex, policyId })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // Keep the actual evaluator diagnosis, not only the large serialized script/base64 prefix.
    const marker = 'The plutus evaluation error is:'
    const markerAt = message.lastIndexOf(marker)
    const diagnostic = markerAt >= 0 ? message.slice(markerAt, markerAt + 1000) : message.slice(-1200)
    results.push({ variant: variant.name, outcome: 'REJECTED_OR_ERRORED', error: diagnostic })
  }
}

mkdirSync('audit/yaci-evidence', { recursive: true })
writeFileSync('audit/yaci-evidence/v3-diagnostic-results.json', JSON.stringify({
  purpose: 'isolated differential diagnosis only; not deployment evidence',
  network: 'disposable local Yaci devnet',
  variants: results,
}, null, 2) + '\n')
console.log(JSON.stringify(results.map(({ variant, outcome, txHash, seedRef, policyId, error }) =>
  ({ variant, outcome, txHash, seedRef, policyId, error })), null, 2))
