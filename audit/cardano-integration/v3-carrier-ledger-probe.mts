/** Ledger-native V3 carrier mint probe against the local Yaci Conway devnet.
 * Local Lucid UPLC evaluation estimates execution units for transaction construction.
 * The probe passes only when the signed transaction is submitted and accepted by the
 * actual Yaci Cardano node (submit + awaitTx), which remains the final acceptance check.
 * Avoid the Yaci Store Scalus evaluation endpoint here: its observed evaluation failure
 * is not proof that the Cardano ledger rejects this policy.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, mintingPolicyToId, type Script } from '@lucid-evolution/lucid'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const TOKEN_NAME_HEX = '45434f4e4f4d49435354415445' // ECONOMICSTATE

const provider = new Blockfrost(API, '')

const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8'))
const lucid = await Lucid(provider, 'Preprod')
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
  // Local evaluation supplies ex-units; the node's subsequent acceptance is authoritative.
  .complete({ localUPLCEval: true })

console.log(JSON.stringify({
  result: 'V3_CARRIER_PROBE_PREPARED_FOR_LEDGER',
  seedRef: seed.txHash + '#' + seed.outputIndex,
  factoryScriptCborSha256: createHash('sha256').update(artifact.cborHex, 'hex').digest('hex'),
  policyId,
  unit,
  parameterEncoding: {
    seed: 'Constr(0, [Constr(0, [txHashBytes]), outputIndex])',
    tokenName: 'Constr(0, [tokenNameBytes])',
  },
}, null, 2))

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
