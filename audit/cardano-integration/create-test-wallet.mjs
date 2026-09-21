import { Lucid, generateSeedPhrase } from '@lucid-evolution/lucid'
import { writeFileSync } from 'node:fs'

const seed = generateSeedPhrase()
const lucid = await Lucid(undefined, 'Preprod')
lucid.selectWallet.fromSeed(seed)

const address = await lucid.wallet().address()

writeFileSync('/tmp/immortal-yaci-test-wallet.json', JSON.stringify({
  purpose: 'ephemeral-local-devnet-only',
  address,
  seed,
}, null, 2), { mode: 0o600 })

console.log(address)
