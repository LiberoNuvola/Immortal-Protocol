/** Diagnostic: evaluate the V3 carrier mint policy with Lucid Evolution's local Conway-aware evaluator. */
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

type ScriptEnvelope = { type: string; cborHex: string }
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(name + ' is required')
  return value
}

function loadArtifact(path: string): ScriptEnvelope {
  const envelope = JSON.parse(readFileSync(path, 'utf8')) as ScriptEnvelope
  if (envelope.type !== 'PlutusScriptV2' || !/^[0-9a-f]+$/i.test(envelope.cborHex)) {
    throw new Error('invalid Plutus V2 artifact: ' + path)
  }
  return envelope
}

function selectedSeed(utxos: UTxO[], txHash?: string, outputIndex?: number): UTxO {
  const matches = utxos.filter((u) =>
    (!txHash || u.txHash === txHash) &&
    (outputIndex === undefined || u.outputIndex === outputIndex),
  )
  if (matches.length !== 1) throw new Error('diagnostic requires exactly one explicit seed UTxO')
  return matches[0]
}

async function main() {
  const projectId = (process.env.BLOCKFROST_PROJECT_ID ?? process.env.VITE_BLOCKFROST_PROJECT_ID ?? '').trim()
  if (!projectId) throw new Error('BLOCKFROST_PROJECT_ID (or VITE_BLOCKFROST_PROJECT_ID) is required')
  const mnemonic = required('DEPLOYER_MNEMONIC')
  const tokenNameHex = required('V3_CARRIER_TOKEN_NAME_HEX').toLowerCase()
  if (!/^[0-9a-f]+$/i.test(tokenNameHex)) throw new Error('V3_CARRIER_TOKEN_NAME_HEX must be hexadecimal')

  const provider = new Blockfrost('https://cardano-preprod.blockfrost.io/api/v0', projectId)
  const lucid = await Lucid(provider, 'Preprod')
  lucid.selectWallet.fromSeed(mnemonic)

  const protocolParameters = await provider.getProtocolParameters()
  const costModelLengths = Object.fromEntries(
    Object.entries(protocolParameters.costModels ?? {}).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.length : typeof value,
    ]),
  )
  console.log(JSON.stringify({ protocolVersion: protocolParameters.protocolVersion, costModelLengths }, null, 2))
  if (costModelLengths.PlutusV2 !== 332) {
    throw new Error('PREPROD_COST_MODEL_MISMATCH: expected current PlutusV2 length 332, observed ' + String(costModelLengths.PlutusV2))
  }

  const seedTxHash = process.env.V3_CARRIER_SEED_TX_HASH?.trim()
  const seedIndexRaw = process.env.V3_CARRIER_SEED_OUTPUT_INDEX?.trim()
  const seedIndex = seedIndexRaw ? Number(seedIndexRaw) : undefined
  if (seedIndex !== undefined && (!Number.isInteger(seedIndex) || seedIndex < 0)) {
    throw new Error('V3_CARRIER_SEED_OUTPUT_INDEX must be a non-negative integer')
  }

  const seed = selectedSeed(await lucid.wallet().getUtxos(), seedTxHash, seedIndex)
  const factory = loadArtifact(resolve(ROOT, 'plutus', 'out', 'v3EconomicStateCarrierMintPolicy.plutus.json'))
  const mintPolicy: Script = {
    type: 'PlutusV2',
    script: applyParamsToScript(factory.cborHex, [
      new Constr(0, [new Constr(0, [seed.txHash]), BigInt(seed.outputIndex)]),
      new Constr(0, [tokenNameHex]),
    ]),
  }
  const policyId = mintingPolicyToId(mintPolicy)
  const carrierUnit = policyId + tokenNameHex

  await lucid
    .newTx()
    .collectFrom([seed])
    .mintAssets({ [carrierUnit]: 1n }, Data.void())
    .attach.MintingPolicy(mintPolicy)
    .pay.ToAddress(await lucid.wallet().address(), { lovelace: 2_000_000n, [carrierUnit]: 1n })
    .complete({ localUPLCEval: true })

  console.log(JSON.stringify({
    result: 'V3_MINT_POLICY_LOCAL_EVALUATION_PASSED',
    submitted: false,
    evaluator: 'Lucid Evolution local evaluator',
    seedRef: seed.txHash + '#' + seed.outputIndex,
    policyId,
    carrierUnit,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
