import { Blockfrost, Lucid, generateSeedPhrase } from '@lucid-evolution/lucid'
import { writeFileSync } from 'node:fs'

const seed = generateSeedPhrase()
const lucid = await Lucid(
  new Blockfrost('http://127.0.0.1:8080/api/v1', ''),
  'Preprod',
)
lucid.selectWallet.fromSeed(seed)

const address = await lucid.wallet().address()

writeFileSync('/tmp/immortal-yaci-test-wallet.json', JSON.stringify({
  purpose: 'ephemeral-local-devnet-only',
  address,
  seed,
}, null, 2), { mode: 0o600 })

console.log(address)
