/** Diagnostic control: evaluate the canonical Genesis carrier mint policy with the same minimal Preprod transaction shape. */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyParamsToScript,
  Blockfrost,
  Constr,
  Data,
  Lucid,
  mintingPolicyToId,
  type Script,
  type UTxO,
} from '@lucid-evolution/lucid'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactPath = resolve(ROOT, 'plutus', 'out', 'genesisCarrierMintPolicy.plutus.json')

const required = (name: string) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(name + ' is required')
  return value
}

const load = (path: string) => {
  const x = JSON.parse(readFileSync(path, 'utf8'))
  if (x.type !== 'PlutusScriptV2' || !x.cborHex) throw new Error('invalid artifact: ' + path)
  return x.cborHex as string
}

const refData = (u: UTxO) => new Constr(0, [u.txHash, BigInt(u.outputIndex)])

async function main() {
  const projectId = (process.env.BLOCKFROST_PROJECT_ID ?? process.env.VITE_BLOCKFROST_PROJECT_ID ?? '').trim()
  if (!projectId) throw new Error('BLOCKFROST_PROJECT_ID (or VITE_BLOCKFROST_PROJECT_ID) is required')
  const mnemonic = required('DEPLOYER_MNEMONIC')
  const tokenNameHex = required('V3_CARRIER_TOKEN_NAME_HEX').toLowerCase()

  const lucid = await Lucid(
    new Blockfrost('https://cardano-preprod.blockfrost.io/api/v0', projectId),
    'Preprod',
  )
  lucid.selectWallet.fromSeed(mnemonic)

  const txHash = process.env.V3_CARRIER_SEED_TX_HASH?.trim()
  const indexRaw = process.env.V3_CARRIER_SEED_OUTPUT_INDEX?.trim()
  const index = indexRaw ? Number(indexRaw) : undefined
  const utxos = await lucid.wallet().getUtxos()
  const matches = utxos.filter((u) =>
    (!txHash || u.txHash === txHash) &&
    (index === undefined || u.outputIndex === index),
  )
  if (matches.length !== 1) throw new Error('diagnostic requires exactly one explicit seed UTxO')
  const seed = matches[0]

  const factory = load(artifactPath)
  const policy: Script = {
    type: 'PlutusV2',
    script: applyParamsToScript(factory, [
      refData(seed),
      new Constr(0, [tokenNameHex]),
    ]),
  }
  const policyId = mintingPolicyToId(policy)
  const unit = policyId + tokenNameHex

  await lucid
    .newTx()
    .collectFrom([seed])
    .mintAssets({ [unit]: 1n }, Data.void())
    .attach.MintingPolicy(policy)
    .pay.ToAddress(await lucid.wallet().address(), { lovelace: 2_000_000n, [unit]: 1n })
    .complete({ localUPLCEval: false })

  console.log(JSON.stringify({
    result: 'GENESIS_MINT_POLICY_REMOTE_EVALUATION_PASSED',
    submitted: false,
    seedRef: seed.txHash + '#' + seed.outputIndex,
    policyId,
    unit,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
