/**
 * Controlled Preprod-only probe for an authentic Pyth Lazer ADA/USD update.
 *
 * Default mode fetches the signed payload and resolves the configured Pyth
 * State only; it does not build, sign, or submit any Cardano transaction.
 *
 * With PYTH_SUBMIT_PREPROD=true, a dedicated Preprod wallet funds the probe
 * address, then spends that output in one transaction that also references the
 * Pyth State and performs the Pyth zero-withdrawal. The native ledger therefore
 * evaluates both the Pyth verification script and our consumer script.
 *
 * This probe is isolated from PRE-RICH, Issue, MintPolicy, Treasury valuation,
 * the production Oracle State, V3 carrier and Reveal semantics.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  applyParamsToScript,
  Blockfrost,
  credentialToRewardAddress,
  Data,
  Lucid,
  validatorToAddress,
  validatorToScriptHash,
  type Script,
  type UTxO,
} from '@lucid-evolution/lucid'
import { Client, preprod } from '@evolution-sdk/evolution'
import { PythLazerClient } from '@pythnetwork/pyth-lazer-sdk'
import {
  PYTH_PRO_CONTRACT_ADDRESSES_SOURCE,
  validatePythPreprodPolicyId,
} from './pythPreprodConfig.mts'
import {
  getPythScriptHash,
  getPythState,
} from '@pythnetwork/pyth-lazer-cardano-js'

type BlueprintValidator = {
  title?: string
  compiledCode?: string
}

type Blueprint = {
  preamble?: { plutusVersion?: string }
  validators?: BlueprintValidator[]
}

const ROOT = process.cwd()
const BLUEPRINT_PATH = resolve(ROOT, 'poc/aiken-pyth-ada-usd/plutus.json')
const EVIDENCE_PATH = resolve(ROOT, 'audit/preprod-issue/pyth-native-ledger-probe.json')
const PREPROD = 'Preprod' as const
const FEED_ID_ADA_USD = 16

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(name + ' is required')
  return value
}

function sha256Hex(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function validHex(value: string, length: number, name: string): string {
  const normalized = value.trim().replace(/^0x/i, '').toLowerCase()
  if (normalized.length !== length || !/^[0-9a-f]+$/.test(normalized)) {
    throw new Error(name + ' must be exactly ' + length + ' hexadecimal characters')
  }
  return normalized
}

async function fetchSignedUpdate(token: string): Promise<Buffer> {
  const lazer = await PythLazerClient.create({ token, webSocketPoolConfig: {} })
  try {
    const latest = await lazer.getLatestPrice({
    channel: 'fixed_rate@200ms',
    formats: ['solana'],
    jsonBinaryEncoding: 'hex',
    priceFeedIds: [FEED_ID_ADA_USD],
    properties: ['price', 'exponent'],
  })
  const raw = latest.solana?.data
  if (!raw || !/^[0-9a-f]+$/i.test(raw) || raw.length % 2 !== 0) {
    throw new Error('Pyth Lazer did not return a valid hex-encoded signed update')
  }
  const update = Buffer.from(raw, 'hex')
    if (update.length === 0) throw new Error('Pyth Lazer signed update is empty')
    return update
  } finally {
    lazer.shutdown()
  }
}

async function writeEvidence(evidence: Record<string, unknown>): Promise<void> {
  await mkdir(resolve(ROOT, 'audit/preprod-issue'), { recursive: true })
  await writeFile(EVIDENCE_PATH, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify(evidence, null, 2))
}

async function main(): Promise<void> {
  const policyId = validatePythPreprodPolicyId(required('PYTH_CARDANO_POLICY_ID'))
  const lazerToken = required('PYTH_LAZER_TOKEN')
  const readClient = Client.make(preprod).withKoios({
    baseUrl: 'https://preprod.koios.rest/api/v1',
  })
  const pythState = await getPythState(policyId, readClient)
  const pythWithdrawScriptHash = validHex(getPythScriptHash(pythState), 56, 'Pyth withdraw script hash')
  const signedUpdate = await fetchSignedUpdate(lazerToken)

  const stateUnit = policyId + Buffer.from('Pyth State', 'utf8').toString('hex')
  const common = {
    schema: 'immortal-pyth-native-ledger-probe-v1',
    network: 'cardano-preprod',
    probe: 'Pyth Pro/Lazer ADA/USD signed-update consumer, feed ID 16',
    pythProduct: 'Pyth Pro (formerly Pyth Lazer); not Pyth Core',
    pythPolicyId: policyId,
    pythPolicyIdSource: PYTH_PRO_CONTRACT_ADDRESSES_SOURCE,
    pythPolicyIdPinnedToPublishedPreprodDeployment: true,
    priceFeedId: FEED_ID_ADA_USD,
    priceFeedPair: 'ADA/USD',
    quoteCurrency: 'USD',
    usdmConversion: 'NOT_APPLIED',
    pythStateUnit: stateUnit,
    pythStateResolvedFrom: 'Pyth SDK via Koios',
    pythWithdrawalScriptHash: pythWithdrawScriptHash,
    signedUpdateBytes: signedUpdate.length,
    signedUpdateSha256: sha256Hex(signedUpdate),
    signedUpdateHexStored: false,
    productionIssuePathChanged: false,
    productionOracleChanged: false,
    treasuryValuationChanged: false,
    v3OrRevealChanged: false,
  }

  if (process.env.PYTH_SUBMIT_PREPROD !== 'true') {
    await writeEvidence({
      ...common,
      status: 'PREPARED_NOT_SUBMITTED',
      ledgerGateA: 'NOT_PROVEN',
      message: 'Real signed update fetched; no wallet was loaded and no transaction was built, signed, or submitted.',
    })
    return
  }

  const projectId = (
    process.env.BLOCKFROST_PROJECT_ID ??
    process.env.VITE_BLOCKFROST_PROJECT_ID ??
    ''
  ).trim()
  if (!projectId) throw new Error('BLOCKFROST_PROJECT_ID or VITE_BLOCKFROST_PROJECT_ID is required for submission')
  const mnemonic = required('PYTH_PREPROD_TEST_MNEMONIC')

  const provider = new Blockfrost('https://cardano-preprod.blockfrost.io/api/v0', projectId)
  const lucid = await Lucid(provider, PREPROD)
  lucid.selectWallet.fromSeed(mnemonic)
  const walletAddress = await lucid.wallet().address()
  if (!walletAddress.startsWith('addr_test1')) {
    throw new Error('Configured test wallet did not resolve to a Cardano testnet address')
  }

  const blueprint = JSON.parse(await readFile(BLUEPRINT_PATH, 'utf8')) as Blueprint
  if (blueprint.preamble?.plutusVersion !== 'v3') {
    throw new Error('Expected a Plutus V3 Aiken blueprint')
  }
  const blueprintValidator = (blueprint.validators ?? []).find((validator) =>
    validator.title?.startsWith('pyth_signed_update_ledger_probe.spend'),
  )
  if (!blueprintValidator?.compiledCode || !/^[0-9a-f]+$/i.test(blueprintValidator.compiledCode)) {
    throw new Error('Could not find compiled pyth_signed_update_ledger_probe.spend in Aiken blueprint')
  }

  const probeValidator: Script = {
    type: 'PlutusV3',
    script: applyParamsToScript(blueprintValidator.compiledCode, [policyId]),
  }
  const probeAddress = validatorToAddress(PREPROD, probeValidator)
  const derivedProbeHash = validatorToScriptHash(probeValidator)

  // Re-resolve the exact State NFT with Lucid's own UTxO type. The Pyth SDK's
  // typed UTxO is used to decode the authenticated datum above; do not assume
  // its reference-field shape matches Lucid's.
  const pythStateUtxo = await lucid.utxoByUnit(stateUnit)
  if (!pythStateUtxo) {
    throw new Error('Configured Pyth State NFT could not be resolved through the Preprod provider')
  }
  if ((pythStateUtxo.assets[stateUnit] ?? 0n) !== 1n) {
    throw new Error('Resolved Pyth State UTxO does not contain exactly one configured Pyth State NFT')
  }
  if (!pythStateUtxo.scriptRef) {
    throw new Error('Pyth State UTxO has no reference script; refusing to guess an alternative witness source')
  }
  const pythRefScriptHash = validatorToScriptHash(pythStateUtxo.scriptRef)
  if (pythRefScriptHash !== pythWithdrawScriptHash) {
    throw new Error('Pyth State reference script hash does not match the withdraw-script hash in its authenticated datum')
  }

  const rewardAddress = credentialToRewardAddress(PREPROD, {
    type: 'Script',
    hash: pythWithdrawScriptHash,
  })

  // Reuse an unspent probe output after an interrupted run; otherwise fund a
  // fresh no-datum output. A failed proof does not consume the script input.
  let probeUtxo: UTxO | undefined = (await lucid.utxosAt(probeAddress)).find((utxo) =>
    (utxo.assets.lovelace ?? 0n) >= 3_000_000n &&
    !utxo.datum &&
    !utxo.datumHash,
  )
  let fundingTxHash: string | null = null

  if (!probeUtxo) {
    const fundBuilder = await lucid
      .newTx()
      .pay.ToAddress(probeAddress, { lovelace: 5_000_000n })
      .complete()
    const signedFunding = await fundBuilder.sign.withWallet().complete()
    fundingTxHash = await signedFunding.submit()
    await lucid.awaitTx(fundingTxHash)
    probeUtxo = (await lucid.utxosAt(probeAddress)).find((utxo) =>
      utxo.txHash === fundingTxHash &&
      (utxo.assets.lovelace ?? 0n) >= 3_000_000n &&
      !utxo.datum &&
      !utxo.datumHash,
    )
    if (!probeUtxo) {
      throw new Error('Funding transaction confirmed but its unique no-datum probe output was not observed')
    }
  }

  // Fetch again after funding so the validity interval is paired with a recent
  // signed payload, rather than reusing an update that aged during setup.
  const freshUpdate = await fetchSignedUpdate(lazerToken)
  const updateHex = freshUpdate.toString('hex')
  const now = Date.now()
  const validFromMs = now - 15_000
  const validToMs = now + 60_000

  const buildProof = (payloadHex: string) =>
    lucid
      .newTx()
      .collectFrom([probeUtxo!], Data.void())
      .attach.SpendingValidator(probeValidator)
      .readFrom([pythStateUtxo])
      .withdraw(rewardAddress, 0n, Data.to([payloadHex]))
      .validFrom(validFromMs)
      .validTo(validToMs)

  // A one-byte mutation is evaluated locally and never submitted. This checks
  // that the local transaction evaluator rejects a modified payload; it is not
  // claimed as a native-ledger negative result.
  const tampered = Buffer.from(freshUpdate)
  tampered[0] = tampered[0] ^ 1
  let localTamperedPayloadRejected = false
  let localNegativeReason = ''
  try {
    await buildProof(tampered.toString('hex')).complete({ localUPLCEval: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/script|evaluat|validator|withdraw|redeemer|pyth|signature|uplc|execution/i.test(message)) {
      throw new Error('Tampered-payload local negative case failed for a non-script reason: ' + message)
    }
    localTamperedPayloadRejected = true
    localNegativeReason = message.slice(0, 400)
  }
  if (!localTamperedPayloadRejected) {
    throw new Error('Local evaluator accepted the one-byte-mutated signed payload; refusing to submit the positive case')
  }

  const unsigned = await buildProof(updateHex).complete({ localUPLCEval: true })
  const signed = await unsigned.sign.withWallet().complete()
  const signedCbor = signed.toCBOR()
  const verificationTxCborBytes = Buffer.from(signedCbor, 'hex').length
  const verificationTxHash = await signed.submit()
  await lucid.awaitTx(verificationTxHash)

  let redeemers: unknown = null
  let redeemersObservation = 'NOT_FETCHED'
  try {
    const response = await fetch(
      'https://cardano-preprod.blockfrost.io/api/v0/txs/' + verificationTxHash + '/redeemers',
      { headers: { project_id: projectId } },
    )
    if (response.ok) {
      redeemers = await response.json()
      redeemersObservation = 'OBSERVED_FROM_BLOCKFROST'
    } else {
      redeemersObservation = 'UNAVAILABLE_HTTP_' + response.status
    }
  } catch (error) {
    redeemersObservation = 'UNAVAILABLE_' + (error instanceof Error ? error.message : String(error))
  }

  await writeEvidence({
    ...common,
    pythStateReference: pythStateUtxo.txHash + '#' + pythStateUtxo.outputIndex,
    signedUpdateBytes: freshUpdate.length,
    signedUpdateSha256: sha256Hex(freshUpdate),
    status: 'PREPROD_LEDGER_ACCEPTED',
    ledgerGateA: 'POSITIVE_NATIVE_LEDGER_CASE_PASSED',
    pythStateReferenceScriptHash: pythRefScriptHash,
    probeValidatorHash: derivedProbeHash,
    probeValidatorAddress: probeAddress,
    probeInputReference: probeUtxo.txHash + '#' + probeUtxo.outputIndex,
    fundingTransactionHash: fundingTxHash,
    verificationTransactionHash: verificationTxHash,
    verificationTransactionCborBytes: verificationTxCborBytes,
    verificationTransactionConfirmed: true,
    localTamperedPayloadRejected,
    localNegativeReason,
    nativeLedgerNegativeCase: 'NOT_RUN',
    executionUnitsObservation: redeemersObservation,
    redeemers,
    signatureVerificationMeaning: 'Pyth withdraw validator executed in the same confirmed transaction as the consuming Plutus V3 probe.',
    sourceAuthenticationQualification: 'Pyth-signature integrity for this update only; not a claim of feed liveness or general market truth.',
    usdmConversion: 'NOT_APPLIED',
    issueAuthorized: false,
    timestampUtc: new Date().toISOString(),
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exit(1)
})
