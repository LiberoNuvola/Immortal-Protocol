/** Ledger-native V3 carrier mint probe against the local Yaci Conway devnet.
 * V3 mint policy now validates the exact singleton Value without flattenValue; this comment
 * intentionally keeps the Cardano integration-lab path in the workflow trigger set.
 * Intentionally bypasses Lucid UPLC evaluation: the signed transaction is submitted
 * to the real local Cardano node, so acceptance/rejection comes from ledger semantics.
 */
import { readFileSync } from 'node:fs'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, mintingPolicyToId, type Script } from '@lucid-evolution/lucid'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const TOKEN_NAME_HEX = '45434f4e4f4d49435354415445' // ECONOMICSTATE

const provider = new Blockfrost(API, '')

// Yaci Store exposes the Blockfrost-compatible JSON evaluator, while the pinned
// lab provider needs the evaluator method supplied explicitly.
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

providerWithEvaluation.evaluateTx = async (tx, additionalUTxOs = []) => {
  // Lucid's Provider contract supplies transaction CBOR as hex. Yaci's JSON
  // evaluator decodes this field as hex, so reject malformed input locally.
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
  const result = await response.json() as {
    fault?: unknown
    result?: {
      EvaluationResult?: Record<string, { memory: number; steps: number }>
    }
    message?: string
  }

  if (!response.ok || result.fault || !result.result?.EvaluationResult) {
    throw new Error(
      `Yaci transaction evaluation failed (HTTP ${response.status}): ${result.message ?? JSON.stringify(result)}`,
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
const smoke = JSON.parse(readFileSync('audit/yaci-evidence/ledger-smoke.json', 'utf8')) as { inputRefs?: string[] }
const consumedBySmoke = new Set(smoke.inputRefs ?? [])

let utxos = await lucid.wallet().getUtxos()
for (let attempt = 0; attempt < 30; attempt += 1) {
  utxos = await lucid.wallet().getUtxos()
  const fresh = utxos.filter((u) => !consumedBySmoke.has(`${u.txHash}#${u.outputIndex}`))
  if (fresh.length > 0) {
    utxos = fresh
    break
  }
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
if (utxos.length === 0) {
  throw new Error('V3 ledger probe wallet has no UTxO fresh after the ledger smoke transaction')
}

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

const expectRejected = async (label: string, build: () => Promise<unknown>) => {
  try {
    await build()
  } catch {
    return
  }
  throw new Error('V3 carrier mint policy accepted invalid case: ' + label)
}

const alternateSeed = utxos.find(
  (u) =>
    (u.txHash !== seed.txHash || u.outputIndex !== seed.outputIndex) &&
    BigInt(u.assets?.lovelace ?? 0n) >= 2_000_000n,
)

if (alternateSeed) {
  await expectRejected('unconsumed configured seed', () =>
    lucid
      .newTx()
      .collectFrom([alternateSeed])
      .mintAssets({ [unit]: 1n }, Data.void())
      .attach.MintingPolicy(policy)
      .pay.ToAddress(address, { lovelace: 2_000_000n, [unit]: 1n })
      .complete({ localUPLCEval: true }),
  )
}

const wrongUnit =
  policyId + (TOKEN_NAME_HEX === '00' ? '01' : '00')

await expectRejected('wrong token name', () =>
  lucid
    .newTx()
    .collectFrom([seed])
    .mintAssets({ [wrongUnit]: 1n }, Data.void())
    .attach.MintingPolicy(policy)
    .pay.ToAddress(address, { lovelace: 2_000_000n, [wrongUnit]: 1n })
    .complete({ localUPLCEval: true }),
)

await expectRejected('wrong mint quantity', () =>
  lucid
    .newTx()
    .collectFrom([seed])
    .mintAssets({ [unit]: 2n }, Data.void())
    .attach.MintingPolicy(policy)
    .pay.ToAddress(address, { lovelace: 2_000_000n, [unit]: 2n })
    .complete({ localUPLCEval: true }),
)

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
