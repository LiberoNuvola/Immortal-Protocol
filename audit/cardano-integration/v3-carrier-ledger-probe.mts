/** Ledger-native V3 carrier mint probe against the local Yaci Conway devnet.
 * Intentionally bypasses Lucid UPLC evaluation: the signed transaction is submitted
 * to the real local Cardano node, so acceptance/rejection comes from ledger semantics.
 */
import { readFileSync } from 'node:fs'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, mintingPolicyToId, type Script } from '@lucid-evolution/lucid'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const TOKEN_NAME_HEX = '45434f4e4f4d49435354415445' // ECONOMICSTATE

const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8'))
const provider = new Blockfrost(API, '')
// Yaci Store's evaluator response is not compatible with Lucid 0.6.5's Blockfrost
// response parser, and Lucid's local evaluator rejects this valid Value encoding
// before submission. Supply a bounded transaction-level budget for this diagnostic
// probe; the native Cardano ledger still evaluates the actual script on submission.
;(provider as unknown as { evaluateTx: () => Promise<unknown> }).evaluateTx = async () => [
  { redeemer_tag: 'mint', redeemer_index: 0, ex_units: { mem: 10_000_000, steps: 5_000_000_000 } },
]
const lucid = await Lucid(provider, 'Preprod')
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
  // Use the bounded evaluation budget above; ledger validation remains authoritative.
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
