/** Ledger-native V3 carrier mint probe against the local Yaci Conway devnet.
 * The Lucid/Aiken and Yaci/Scalus evaluators have incompatible behavior for this
 * compiled Haskell policy's Value case. This probe uses a clearly declared, bounded
 * execution-unit budget fixture only to finish transaction construction; the real
 * local Cardano ledger still authoritatively evaluates and accepts/rejects the script.
 */
import { readFileSync } from 'node:fs'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, mintingPolicyToId, type Script } from '@lucid-evolution/lucid'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const TOKEN_NAME_HEX = '45434f4e4f4d49435354415445' // ECONOMICSTATE

const ledgerBudgetEvaluator = {
  name: 'yaci-native-ledger-budget-fixture',
  async evaluate({ context }: { context: { protocolParameters: { maxTxExMem: bigint; maxTxExSteps: bigint } } }) {
    const { maxTxExMem, maxTxExSteps } = context.protocolParameters
    if (maxTxExMem <= 0n || maxTxExSteps <= 0n) {
      throw new Error('Yaci protocol parameters do not provide a positive transaction execution budget')
    }
    // Conservative fixed budget (75% of the observed transaction maxima), not
    // measured execution cost. The ledger performs the actual script evaluation.
    return [{
      redeemer_tag: 'mint' as const,
      redeemer_index: 0,
      ex_units: {
        mem: Number((maxTxExMem * 3n) / 4n),
        steps: Number((maxTxExSteps * 3n) / 4n),
      },
    }]
  },
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
  .complete({ localUPLCEval: true, evaluator: ledgerBudgetEvaluator })

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
