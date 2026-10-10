/** 
 * One-time Preprod deployment of the V3 economic-state carrier singleton.
 *
 * Local/admin boundary only: DEPLOYER_MNEMONIC is never used by the browser.
 * The policy identity is derived from an explicitly selected seed UTxO.
 * The initial datum is supplied explicitly; this helper never invents state.
 *
 * Required:
 *   VITE_BLOCKFROST_PROJECT_ID
 *   DEPLOYER_MNEMONIC
 *   V3_CARRIER_TOKEN_NAME_HEX
 *   V3_CARRIER_INITIAL_DATUM_CBOR
 *   ISSUE_AUTHORITY_PUBLIC_KEY
 *
 * Optional:
 *   V3_CARRIER_SEED_TX_HASH
 *   V3_CARRIER_SEED_OUTPUT_INDEX
 *   V3_CARRIER_LOVELACE (default 3000000)
 */
import 'dotenv/config'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createPublicKey } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyParamsToScript, Blockfrost, Constr, Data, Lucid, validatorToAddress, mintingPolicyToId, type Script, type UTxO } from '@lucid-evolution/lucid'
import { buildPreRichPreprodInitialDatum } from '../src/preprodV3InitialDatum'

type ScriptEnvelope = { type: string; cborHex: string }

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLUTUS_OUT = resolve(REPO_ROOT, 'plutus', 'out')

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(name + ' is required')
  return value
}

function loadArtifact(path: string, label: string): ScriptEnvelope {
  const envelope = JSON.parse(readFileSync(path, 'utf8')) as ScriptEnvelope
  if (envelope.type !== 'PlutusScriptV2' || !/^[0-9a-f]+$/i.test(envelope.cborHex)) {
    throw new Error('invalid ' + label + ' artifact')
  }
  return envelope
}

function validateInitialV3Datum(initialDatumCbor: string): void {
  const canonical = buildPreRichPreprodInitialDatum()
  if (initialDatumCbor.toLowerCase() !== canonical.toLowerCase()) {
    throw new Error(
      'V3_CARRIER_INITIAL_DATUM_CBOR must exactly match the canonical PRE-RICH Preprod deployment profile datum',
    )
  }
  if (initialDatumCbor.length / 2 !== 116) {
    throw new Error('V3 initial datum must be exactly 116 bytes')
  }
}

function selectedSeed(
  utxos: UTxO[],
  txHash: string | undefined,
  outputIndex: number | undefined,
): UTxO {
  const matches = utxos.filter((u) =>
    (!txHash || u.txHash === txHash) &&
    (outputIndex === undefined || u.outputIndex === outputIndex),
  )
  if (matches.length !== 1) {
    throw new Error(
      'V3 carrier deployment requires exactly one explicit seed UTxO; ' +
      'set V3_CARRIER_SEED_TX_HASH and V3_CARRIER_SEED_OUTPUT_INDEX',
    )
  }
  return matches[0]
}

async function main() {
  const projectId = (process.env.BLOCKFROST_PROJECT_ID ?? process.env.VITE_BLOCKFROST_PROJECT_ID ?? '').trim()
  if (!projectId) throw new Error('BLOCKFROST_PROJECT_ID (or VITE_BLOCKFROST_PROJECT_ID) is required')
  const mnemonic = required('DEPLOYER_MNEMONIC')
  const tokenNameHex = required('V3_CARRIER_TOKEN_NAME_HEX').toLowerCase()
  const initialDatumCbor = required('V3_CARRIER_INITIAL_DATUM_CBOR')
  const issueAuthorityPublicKeyPem = required('ISSUE_AUTHORITY_PUBLIC_KEY')
  const issueAuthorityJwk = createPublicKey(issueAuthorityPublicKeyPem).export({ format: 'jwk' }) as { x?: string }
  if (!issueAuthorityJwk.x) throw new Error('ISSUE_AUTHORITY_PUBLIC_KEY must be an Ed25519 public key')
  const authorityPublicKeyHex = Buffer.from(issueAuthorityJwk.x, 'base64url').toString('hex')
  if (authorityPublicKeyHex.length !== 64) {
    throw new Error('ISSUE_AUTHORITY_PUBLIC_KEY must encode a 32-byte Ed25519 public key')
  }

  if (!/^[0-9a-f]+$/i.test(tokenNameHex)) {
    throw new Error('V3_CARRIER_TOKEN_NAME_HEX must be hexadecimal')
  }
  validateInitialV3Datum(initialDatumCbor)

  const provider = new Blockfrost('https://cardano-preprod.blockfrost.io/api/v0', projectId)
  const lucid = await Lucid(provider, 'Preprod')
  lucid.selectWallet.fromSeed(mnemonic)

  const signerAddress = await lucid.wallet().address()
  const seedTxHash = process.env.V3_CARRIER_SEED_TX_HASH?.trim()
  const seedIndexRaw = process.env.V3_CARRIER_SEED_OUTPUT_INDEX?.trim()
  const seedIndex = seedIndexRaw === undefined || seedIndexRaw === '' ? undefined : Number(seedIndexRaw)
  if (seedIndex !== undefined && (!Number.isInteger(seedIndex) || seedIndex < 0)) {
    throw new Error('V3_CARRIER_SEED_OUTPUT_INDEX must be a non-negative integer')
  }

  const seed = selectedSeed(await lucid.wallet().getUtxos(), seedTxHash, seedIndex)

  const policyFactory = loadArtifact(
    resolve(PLUTUS_OUT, 'v3EconomicStateCarrierMintPolicy.plutus.json'),
    'V3 carrier mint policy',
  )
  const carrierFactory = loadArtifact(
    resolve(PLUTUS_OUT, 'v3EconomicStateCarrier.plutus.json'),
    'V3 carrier validator',
  )

  const mintPolicy: Script = {
    type: 'PlutusV2',
    script: applyParamsToScript(policyFactory.cborHex, [
      new Constr(0, [
      new Constr(0, [seed.txHash]),
      BigInt(seed.outputIndex),
    ]),
      new Constr(0, [tokenNameHex]),
    ]),
  }
  const policyId = mintingPolicyToId(mintPolicy)
  const carrierUnit = policyId + tokenNameHex

  const carrierValidator: Script = {
    type: 'PlutusV2',
    script: applyParamsToScript(carrierFactory.cborHex, [policyId, tokenNameHex, authorityPublicKeyHex]),
  }
  const carrierAddress = validatorToAddress('Preprod', carrierValidator)

  const lovelace = BigInt(process.env.V3_CARRIER_LOVELACE ?? '3000000')
  if (lovelace <= 0n) throw new Error('V3_CARRIER_LOVELACE must be positive')

  const tx = await lucid
    .newTx()
    .collectFrom([seed])
    .mintAssets({ [carrierUnit]: 1n }, Data.void())
    .attach.MintingPolicy(mintPolicy)
    .pay.ToContract(carrierAddress, { kind: 'inline', value: initialDatumCbor }, { lovelace, [carrierUnit]: 1n })
    .complete({ localUPLCEval: true })

  const signed = await tx.sign.withWallet().complete()
  const txHash = await signed.submit()
  await lucid.awaitTx(txHash)

  const matches = (await lucid.utxosAt(carrierAddress))
    .filter((u) => (u.assets[carrierUnit] ?? 0n) === 1n)
  if (matches.length !== 1) {
    throw new Error('submitted deployment but exact V3 singleton UTxO was not observed')
  }

  const carrier = matches[0]
  const evidence = {
    deployment: 'V3-ECONOMIC-STATE-CARRIER-PREPROD-001',
    network: 'Preprod',
    seedRef: seed.txHash + '#' + seed.outputIndex,
    policyId,
    carrierTokenNameHex: tokenNameHex,
    carrierUnit,
    carrierScriptAddress: carrierAddress,
    deploymentTransactionRef: 'cardano:tx/' + txHash,
    carrierStateReference: 'cardano:tx/' + carrier.txHash + '#' + carrier.outputIndex,
    carrierLovelace: lovelace.toString(),
    initialDatumCbor,
    initialDatumExplicit: true,
    signerAddress,
    issueAuthorityPublicKeyHex: authorityPublicKeyHex,
  }

  mkdirSync('audit/preprod-issue', { recursive: true })
  writeFileSync(
    'audit/preprod-issue/v3-carrier-deployment.json',
    JSON.stringify(evidence, null, 2) + '\\n',
  )
  console.log(JSON.stringify(evidence, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
