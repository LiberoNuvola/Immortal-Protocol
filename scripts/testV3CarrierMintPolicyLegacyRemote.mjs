/** Diagnostic control: evaluate the same V3 mint policy with legacy lucid-cardano. */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { Blockfrost, Constr, Data, Lucid, applyParamsToScript } from 'lucid-cardano'

const required = (name) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(name + ' is required')
  return value
}

const load = (path) => {
  const x = JSON.parse(readFileSync(path, 'utf8'))
  if (x.type !== 'PlutusScriptV2' || !x.cborHex) throw new Error('invalid artifact')
  return { type: 'PlutusV2', script: x.cborHex }
}

const refData = (u) => new Constr(0, [u.txHash, BigInt(u.outputIndex)])

async function main() {
  const projectId = (process.env.BLOCKFROST_PROJECT_ID ?? process.env.VITE_BLOCKFROST_PROJECT_ID ?? '').trim()
  if (!projectId) throw new Error('BLOCKFROST_PROJECT_ID (or VITE_BLOCKFROST_PROJECT_ID) is required')
  const mnemonic = required('DEPLOYER_MNEMONIC')
  const tokenNameHex = required('V3_CARRIER_TOKEN_NAME_HEX').toLowerCase()

  const lucid = await Lucid.new(new Blockfrost('https://cardano-preprod.blockfrost.io/api/v0', projectId), 'Preprod')
  lucid.selectWalletFromSeed(mnemonic)
  const seedTxHash = process.env.V3_CARRIER_SEED_TX_HASH?.trim()
  const seedIndexRaw = process.env.V3_CARRIER_SEED_OUTPUT_INDEX?.trim()
  const seedIndex = seedIndexRaw ? Number(seedIndexRaw) : undefined
  const utxos = await lucid.wallet.getUtxos()
  const matches = utxos.filter((u) => (!seedTxHash || u.txHash === seedTxHash) && (seedIndex === undefined || u.outputIndex === seedIndex))
  if (matches.length !== 1) throw new Error('diagnostic requires exactly one explicit seed UTxO')
  const seed = matches[0]

  const factory = load('plutus/out/v3EconomicStateCarrierMintPolicy.plutus.json')
  const policy = {
    type: 'PlutusV2',
    script: applyParamsToScript(factory.script, [refData(seed), new Constr(0, [tokenNameHex])]),
  }
  const policyId = lucid.utils.mintingPolicyToId(policy)
  const unit = policyId + tokenNameHex

  await lucid.newTx()
    .collectFrom([seed])
    .mintAssets({ [unit]: 1n }, Data.void())
    .attachMintingPolicy(policy)
    .payToAddress(await lucid.wallet.address(), { lovelace: 2_000_000n, [unit]: 1n })
    .complete()

  console.log(JSON.stringify({ result: 'V3_MINT_POLICY_LEGACY_REMOTE_EVALUATION_PASSED', submitted: false, seedRef: seed.txHash + '#' + seed.outputIndex, policyId, unit }, null, 2))
}
main().catch((e) => { console.error(e); process.exit(1) })
