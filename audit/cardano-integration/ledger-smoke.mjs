import { Blockfrost, Lucid } from '@lucid-evolution/lucid'
import { readFileSync, writeFileSync } from 'node:fs'

const wallet = JSON.parse(readFileSync('/tmp/immortal-yaci-test-wallet.json', 'utf8'))
const lucid = await Lucid(
  new Blockfrost('http://127.0.0.1:8080/api/v1', ''),
  'Preprod',
)
lucid.selectWallet.fromSeed(wallet.seed)

const address = await lucid.wallet().address()
const utxos = await lucid.wallet().getUtxos()
const balance = utxos.reduce((sum, u) => sum + (u.assets.lovelace ?? 0n), 0n)

if (address !== wallet.address) throw new Error('wallet address mismatch')
if (utxos.length === 0 || balance <= 0n) {
  throw new Error(`Yaci wallet is not funded: address=${address} utxos=${utxos.length} balance=${balance}`)
}

const tx = await lucid
  .newTx()
  .pay.ToAddress(address, { lovelace: 1_000_000n })
  .complete()

const signed = await tx.sign.withWallet().complete()
const txCbor = signed.toCBOR()
const txHash = await signed.submit()
await lucid.awaitTx(txHash)

writeFileSync('audit/yaci-evidence/ledger-smoke.json', JSON.stringify({
  purpose: 'real-local-cardano-ledger-smoke',
  address,
  inputUtxos: utxos.length,
  inputBalance: balance.toString(),
  txHash,
  txCbor,
}, null, 2))

console.log(JSON.stringify({ address, txHash, txCbor }, null, 2))
