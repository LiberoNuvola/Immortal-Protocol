/** Ledger-native V3 carrier mint probe against the local Yaci Conway devnet.
 * Intentionally bypasses Lucid UPLC evaluation: the signed transaction is submitted
 * to the real local Cardano node, so acceptance/rejection comes from ledger semantics.
 */
import { readFileSync } from 'node:fs'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, mintingPolicyToId, type Script, type UTxO } from '@lucid-evolution/lucid'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const TOKEN_NAME_HEX = '45434f4e4f4d49435354415445' // ECONOMICSTATE

const provider = new Blockfrost(API, '')

// The pinned Lucid Evolution provider used by the lab does not expose the
// Blockfrost-compatible evaluation method, while Yaci Store does. Wire the
// evaluator directly to Yaci's Blockfrost-compatible endpoint so Lucid can
// obtain execution units without evaluating the script locally.
const providerWithEvaluation = provider as Blockfrost & {
  evaluateTx: (tx: string, additionalUTxOs?: UTxO[]) => Promise<Array<{
    redeemer_tag: string
    redeemer_index: number
    ex_units: { mem: number; steps: number }
  }>>
}
providerWithEvaluation.evaluateTx = async (tx, additionalUTxOs) => {
  const payload = {
    cbor: tx,
    ...(additionalUTxOs?.length
      ? {
          additionalUtxoSet: additionalUTxOs.map((utxo) => ({
            input: {
              transaction: { id: utxo.txHash },
              index: utxo.outputIndex,
            },
            output: {
              address: utxo.address,
              value: utxo.assets,
              datum: utxo.datum,
              datumHash: utxo.datumHash,
              scriptRef: utxo.scriptRef,
            },
          })),
        }
      : {}),
  }
  const response = await fetch(`${API}/utils/txs/evaluate/utxos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await response.json() as {
    fault?: unknown
    result?: {
      EvaluationResult?: Record<string, { memory: number; steps: number }>
    }
    message?: string
  }
  if (!response.ok || result.fault || !result.result?.EvaluationResult) {
    throw new Error(
      `Yaci transaction evaluation failed: ${result.message ?? JSON.stringify(result)}`,
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

const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8'))
const lucid = await Lucid(providerWithEvaluation, 'Preprod')
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
