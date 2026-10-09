/**
 * One-time Preprod deployment of the authenticated PRE-RICH control carrier.
 *
 * This deployment surface is separate from the V3 economic-state carrier.
 * It authorizes only CurrentActiveClass / HighestClassEverActivated as a
 * dedicated PRE-RICH application state reference.
 *
 * Required:
 *   BLOCKFROST_PROJECT_ID (or VITE_BLOCKFROST_PROJECT_ID)
 *   DEPLOYER_MNEMONIC
 *   PREPROD_CONTROL_TOKEN_NAME_HEX
 *   PREPROD_CONTROL_SEED_TX_HASH (optional deterministic override)
 *   PREPROD_CONTROL_SEED_OUTPUT_INDEX (optional deterministic override)
 *
 * Optional:
 *   PREPROD_CONTROL_LOVELACE (default 3000000)
 *   PREPROD_CONTROL_AUTHORITY_PKH (defaults to deployer payment key hash)
 *
 * The control token name is intentionally deployment-supplied. It is not
 * hard-coded in source.
 */
import 'dotenv/config'
import {
  applyParamsToScript,
  Blockfrost,
  Constr,
  Data,
  Lucid,
  mintingPolicyToId,
  validatorToAddress,
  getAddressDetails,
  PubKeyHash,
  type Script,
  type UTxO,
} from '@lucid-evolution/lucid'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

type ScriptEnvelope = {
  type: string
  cborHex: string
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLUTUS_OUT = resolve(REPO_ROOT, 'plutus', 'out')

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(name + ' is required')
  return value
}

function loadArtifact(path: string, label: string): ScriptEnvelope {
  const envelope = JSON.parse(readFileSync(path, 'utf8')) as ScriptEnvelope
  if (
    envelope.type !== 'PlutusScriptV2' ||
    !/^[0-9a-f]+$/i.test(envelope.cborHex)
  ) {
    throw new Error('invalid ' + label + ' artifact')
  }
  return envelope
}

function deterministicSeed(utxos: UTxO[], minimumLovelace: bigint): UTxO {
  const eligible = utxos
    .filter((utxo) => (utxo.assets.lovelace ?? 0n) >= minimumLovelace)
    .sort((a, b) =>
      a.txHash.localeCompare(b.txHash) ||
      a.outputIndex - b.outputIndex,
    )
  if (eligible.length === 0) {
    throw new Error(
      'PRE-RICH control deployment found no deterministic wallet seed UTxO with sufficient lovelace',
    )
  }
  return eligible[0]
}

function selectedSeed(utxos: UTxO[], txHash: string, outputIndex: number): UTxO {
  const matches = utxos.filter(
    (utxo) =>
      utxo.txHash === txHash &&
      utxo.outputIndex === outputIndex,
  )
  if (matches.length !== 1) {
    throw new Error(
      'PRE-RICH control deployment requires exactly one explicit seed UTxO',
    )
  }
  return matches[0]
}

function buildInitialDatum(policyId: string, tokenNameHex: string): string {
  return Data.to(
    new Constr(0, [
      0n, // CurrentActiveClass — Preprod profile starts at class 0.
      0n, // HighestClassEverActivated — Preprod profile starts at class 0.
      0n, // stateVersion
      0n, // transitionNonce
      policyId,
      tokenNameHex,
    ]),
  )
}

async function main() {
  const projectId =
    (
      process.env.BLOCKFROST_PROJECT_ID ??
      process.env.VITE_BLOCKFROST_PROJECT_ID ??
      ''
    ).trim()

  if (!projectId) {
    throw new Error(
      'BLOCKFROST_PROJECT_ID (or VITE_BLOCKFROST_PROJECT_ID) is required',
    )
  }

  const mnemonic = required('DEPLOYER_MNEMONIC')
  const tokenNameHex = required('PREPROD_CONTROL_TOKEN_NAME_HEX').toLowerCase()
  const seedTxHash = (process.env.PREPROD_CONTROL_SEED_TX_HASH ?? '').trim()
  const seedIndexRaw = (process.env.PREPROD_CONTROL_SEED_OUTPUT_INDEX ?? '').trim()
  const seedIndex = seedIndexRaw === '' ? null : Number(seedIndexRaw)

  if (
    !/^[0-9a-f]+$/i.test(tokenNameHex) ||
    tokenNameHex.length % 2 !== 0 ||
    tokenNameHex.length > 64
  ) {
    throw new Error(
      'PREPROD_CONTROL_TOKEN_NAME_HEX must be an even-length hex string representing at most 32 bytes',
    )
  }
  if (seedTxHash !== '' && !/^[0-9a-f]{64}$/i.test(seedTxHash)) {
    throw new Error('PREPROD_CONTROL_SEED_TX_HASH must be a 32-byte transaction hash when supplied')
  }
  if (seedIndex !== null && (!Number.isInteger(seedIndex) || seedIndex < 0)) {
    throw new Error('PREPROD_CONTROL_SEED_OUTPUT_INDEX must be a non-negative integer when supplied')
  }

  const provider = new Blockfrost(
    'https://cardano-preprod.blockfrost.io/api/v0',
    projectId,
  )
  const lucid = await Lucid(provider, 'Preprod')
  lucid.selectWallet.fromSeed(mnemonic)

  const signerAddress = await lucid.wallet().address()
  const signerDetails = getAddressDetails(signerAddress)
  const signerPaymentPkh = signerDetails.paymentCredential?.hash
  if (!signerPaymentPkh) {
    throw new Error('deploying wallet has no payment key hash')
  }
  const controlAuthorityPkh =
    (process.env.PREPROD_CONTROL_AUTHORITY_PKH ?? signerPaymentPkh).trim()
  if (!/^[0-9a-fA-F]{56}$/.test(controlAuthorityPkh)) {
    throw new Error('PREPROD_CONTROL_AUTHORITY_PKH must be a 28-byte payment key hash')
  }

  const lovelace = BigInt(
    process.env.PREPROD_CONTROL_LOVELACE ?? '3000000',
  )
  if (lovelace <= 0n) {
    throw new Error('PREPROD_CONTROL_LOVELACE must be positive')
  }

  const walletUtxos = await lucid.wallet().getUtxos()
  const seed =
    seedTxHash === '' || seedIndex === null
      ? deterministicSeed(walletUtxos, lovelace + 2_000_000n)
      : selectedSeed(walletUtxos, seedTxHash, seedIndex)

  const policyFactory = loadArtifact(
    resolve(
      PLUTUS_OUT,
      'preRichControlCarrierMintPolicy.plutus.json',
    ),
    'PRE-RICH control carrier mint policy',
  )
  const carrierFactory = loadArtifact(
    resolve(
      PLUTUS_OUT,
      'preRichControlCarrier.plutus.json',
    ),
    'PRE-RICH control carrier validator',
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
  const controlUnit = policyId + tokenNameHex

  const carrierValidator: Script = {
    type: 'PlutusV2',
    script: applyParamsToScript(carrierFactory.cborHex, [
      policyId,
      tokenNameHex,
      controlAuthorityPkh,
    ]),
  }

  const controlAddress = validatorToAddress(
    'Preprod',
    carrierValidator,
  )

  const initialDatum = buildInitialDatum(
    policyId,
    tokenNameHex,
  )

  const tx = await lucid
    .newTx()
    .collectFrom([seed], Data.void())
    .mintAssets(
      { [controlUnit]: 1n },
      Data.void(),
    )
    .attach.MintingPolicy(mintPolicy)
    .pay.ToContract(
      controlAddress,
      {
        kind: 'inline',
        value: initialDatum,
      },
      {
        lovelace,
        [controlUnit]: 1n,
      },
    )
    .complete()

  const signed = await tx.sign.withWallet().complete()
  const txHash = await signed.submit()
  await lucid.awaitTx(txHash)

  const matches = (await lucid.utxosAt(controlAddress)).filter(
    (utxo) => (utxo.assets[controlUnit] ?? 0n) === 1n,
  )

  if (matches.length !== 1) {
    throw new Error(
      'submitted B2 control deployment but exact singleton UTxO was not observed',
    )
  }

  const control = matches[0]
  const controlStateReference =
    'cardano:tx/' +
    control.txHash +
    '#' +
    control.outputIndex

  const evidence = {
    deployment: 'PRE-RICH-B2-CONTROL-PREPROD-001',
    network: 'Preprod',
    seedRef: seed.txHash + '#' + seed.outputIndex,
    policyId,
    controlTokenNameHex: tokenNameHex,
    controlUnit,
    controlScriptAddress: controlAddress,
    deploymentTransactionRef: 'cardano:tx/' + txHash,
    controlStateReference,
    controlLovelace: lovelace.toString(),
    initialDatum,
    initialControl: {
      currentActiveClass: '0',
      highestClassEverActivated: '0',
      stateVersion: '0',
      transitionNonce: '0',
    },
    signerAddress,
    controlAuthorityPkh,
    role: 'authenticated PRE-RICH application control state',
  }

  mkdirSync(resolve(REPO_ROOT, 'audit', 'preprod-issue'), {
    recursive: true,
  })
  writeFileSync(
    resolve(
      REPO_ROOT,
      'audit/preprod-issue/b2-control-deployment.json',
    ),
    JSON.stringify(evidence, null, 2) + '\n',
  )

  console.log(JSON.stringify(evidence, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
