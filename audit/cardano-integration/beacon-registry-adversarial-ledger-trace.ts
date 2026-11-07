/**
 * B0 adversarial Registry realization on the isolated local Yaci devnet.
 *
 * This deliberately exercises only synthetic local-devnet data and the
 * repository's current BeaconRegistry V2 script. It does not use a user's
 * wallet, Preprod credentials, production keys or mainnet.
 *
 * The trace proves ledger-level behavior for three distinct gaps:
 *  - arbitrary creation of multiple Pending outputs at the Registry address;
 *  - publication authenticated only by the relayer PKH selected in that
 *    freely-created Pending datum;
 *  - a balanced RegistryPublish that changes the Registry output Value.
 *
 * A separate Pending record has brRound != btRound(target); if accepted by
 * RegistryPublish it documents the validator's current missing round invariant.
 * These outcomes are CHARACTERIZATION, not approval of the behavior.
 */

import {
  Blockfrost,
  Constr,
  Data,
  getAddressDetails,
  Lucid,
  validatorToAddress,
  validatorToScriptHash,
  type Script,
  type UTxO,
} from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import { deriveBeacon, toHex } from '../../src/beacon'

const API = 'http://127.0.0.1:8080/api/v1'
const WALLET_PATH = '/tmp/immortal-yaci-test-wallet.json'
const STARTING_PENDING_LOVELACE = 6_000_000n
const REDUCED_READY_LOVELACE = 5_000_000n
const VALUE_DELTA_RETURN_LOVELACE = 1_000_000n
const FIXED_OTHER_RELAYER_PKH = 'ff'.repeat(28)

type EvaluationResult = {
  redeemer_tag: string
  redeemer_index: number
  ex_units: { mem: number; steps: number }
}

type EvaluationResponse = {
  fault?: unknown
  result?: {
    EvaluationResult?: Record<string, { memory: number; steps: number }>
  }
  message?: string
}

type DecodedRegistry = {
  round: bigint
  targetRound: bigint
  status: number
  relayerPkh: string
  beaconValue: string
  mcHash: string
  materiosContext: string
}

const jsonReplacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value

function hashJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value, jsonReplacer))
    .digest('hex')
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  label: string,
): Promise<T> {
  for (let i = 0; i < 60; i += 1) {
    const value = await fn()
    if (predicate(value)) return value
    await wait(1000)
  }
  throw new Error('Timed out waiting for ' + label)
}

function asBigInt(value: unknown, label: string): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value)
  if (value && typeof value === 'object' && 'int' in value) {
    return BigInt(String((value as { int: unknown }).int))
  }
  throw new Error('invalid integer in Registry datum: ' + label)
}

function asHex(value: unknown, label: string): string {
  if (typeof value === 'string') return value.toLowerCase()
  if (value && typeof value === 'object' && 'bytes' in value) {
    return String((value as { bytes: unknown }).bytes).toLowerCase()
  }
  throw new Error('invalid byte string in Registry datum: ' + label)
}

function decodeRegistry(utxo: UTxO): DecodedRegistry {
  if (!utxo.datum) throw new Error('Registry UTxO has no datum: ' + utxo.txHash)
  const datum = Data.from(utxo.datum) as unknown as { index?: number; fields?: unknown[] }
  if (datum.index !== 0 || !Array.isArray(datum.fields) || datum.fields.length !== 7) {
    throw new Error('Registry datum is not the canonical seven-field constructor')
  }
  const target = datum.fields[1] as { index?: number; fields?: unknown[] }
  const status = datum.fields[2] as { index?: number }
  if (target.index !== 0 || !Array.isArray(target.fields) || target.fields.length !== 4) {
    throw new Error('BeaconTarget does not have four canonical fields')
  }
  if (typeof status.index !== 'number') throw new Error('Registry status constructor missing')
  return {
    round: asBigInt(datum.fields[0], 'brRound'),
    targetRound: asBigInt(target.fields[1], 'btRound'),
    status: status.index,
    relayerPkh: asHex(datum.fields[6], 'brRelayerPkh'),
    beaconValue: asHex(datum.fields[3], 'brBeaconValue'),
    mcHash: asHex(datum.fields[4], 'brMcHash'),
    materiosContext: asHex(datum.fields[5], 'brMateriosContext'),
  }
}

function registryDatum(args: {
  brRound: number
  targetRound: number
  mainchainRefHex: string
  versionHex: string
  status: 0 | 1
  beaconValueHex?: string
  mcHashHex?: string
  materiosContextHex?: string
  relayerPkh: string
}): Constr {
  return new Constr(0, [
    BigInt(args.brRound),
    new Constr(0, [
      0n,
      BigInt(args.targetRound),
      args.mainchainRefHex,
      args.versionHex,
    ]),
    new Constr(args.status, []),
    args.beaconValueHex ?? '',
    args.mcHashHex ?? '',
    args.materiosContextHex ?? '',
    args.relayerPkh,
  ])
}

async function evaluateYaciTx(txCbor: string): Promise<EvaluationResult[]> {
  const cbor = txCbor.startsWith('0x') ? txCbor.slice(2) : txCbor
  if (!/^[0-9a-fA-F]+$/.test(cbor) || cbor.length % 2 !== 0) {
    throw new Error('Yaci evaluator received invalid transaction CBOR')
  }
  const response = await fetch(API + '/utils/txs/evaluate/utxos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cbor }),
  })
  const raw = await response.text()
  let parsed: EvaluationResponse
  try {
    parsed = JSON.parse(raw) as EvaluationResponse
  } catch {
    parsed = { message: raw }
  }
  if (!response.ok || parsed.fault || !parsed.result?.EvaluationResult) {
    throw new Error(
      'Yaci Registry evaluation failed (HTTP ' + response.status + '): ' + raw.slice(0, 4000),
    )
  }
  return Object.entries(parsed.result.EvaluationResult).map(([pointer, units]) => {
    const [redeemer_tag, index] = pointer.split(':')
    const margin = (value: number) => Math.ceil(value * 1.01)
    return {
      redeemer_tag,
      redeemer_index: Number(index),
      ex_units: {
        mem: margin(Number(units.memory)),
        steps: margin(Number(units.steps)),
      },
    }
  })
}

async function main(): Promise<void> {
  const wallet = JSON.parse(readFileSync(WALLET_PATH, 'utf8')) as {
    purpose: string
    address: string
    seed: string
  }
  if (wallet.purpose !== 'ephemeral-local-devnet-only') {
    throw new Error('Refusing a wallet file not explicitly marked local-devnet-only')
  }

  const latestBlock = await (await fetch(API + '/blocks/latest')).json() as {
    slot: number
    time: number
  }
  if (!Number.isSafeInteger(latestBlock.slot) || latestBlock.slot < 0 ||
      !Number.isSafeInteger(latestBlock.time) || latestBlock.time <= 0) {
    throw new Error('Yaci latest block does not provide a valid slot/time anchor')
  }
  const slotConfig = {
    zeroTime: latestBlock.time * 1000,
    zeroSlot: latestBlock.slot,
    slotLength: 1000,
  }

  const provider = new Blockfrost(API, '') as Blockfrost & {
    evaluateTx: (tx: string) => Promise<EvaluationResult[]>
  }
  provider.evaluateTx = evaluateYaciTx

  const lucid = await Lucid(provider, 'Preprod', { slotConfig })
  lucid.selectWallet.fromSeed(wallet.seed)
  const address = await lucid.wallet().address()
  if (address !== wallet.address) throw new Error('local Yaci wallet address does not match wallet manifest')

  const keyHash = getAddressDetails(address).paymentCredential?.hash
  if (!keyHash || keyHash.length !== 56) throw new Error('could not derive test wallet payment key hash')

  const artifact = JSON.parse(readFileSync('plutus/out/beaconRegistry.plutus.json', 'utf8')) as {
    type?: string
    cborHex?: string
  }
  if (artifact.type !== 'PlutusScriptV2' || !artifact.cborHex) {
    throw new Error('canonical BeaconRegistry Plutus V2 artifact is missing or malformed')
  }
  const registryScript = { type: 'PlutusV2', script: artifact.cborHex } as Script
  const registryHash = validatorToScriptHash(registryScript)
  const registryAddress = validatorToAddress('Preprod', registryScript)

  const target = {
    networkId: 0,
    round: 42,
    mainchainRef: new TextEncoder().encode('B0-YACI-ROUND-42'),
    version: new TextEncoder().encode('V1'),
  }
  const mcHash = new TextEncoder().encode('B0-YACI-MATERIOS-COMMITMENT')
  const materiosContext = new TextEncoder().encode('B0-YACI-SYNTHETIC-CONTEXT')
  const beacon = await deriveBeacon(
    target.networkId,
    target.round,
    target.mainchainRef,
    mcHash,
    materiosContext,
    target.version,
  )
  const mainchainRefHex = toHex(target.mainchainRef)
  const versionHex = toHex(target.version)
  const mcHashHex = toHex(mcHash)
  const contextHex = toHex(materiosContext)
  const beaconHex = toHex(beacon)
  const otherRelayerPkh = FIXED_OTHER_RELAYER_PKH

  const pendingCanonical = registryDatum({
    brRound: target.round,
    targetRound: target.round,
    mainchainRefHex,
    versionHex,
    status: 0,
    relayerPkh: keyHash,
  })
  const pendingDuplicate = registryDatum({
    brRound: target.round,
    targetRound: target.round,
    mainchainRefHex,
    versionHex,
    status: 0,
    relayerPkh: otherRelayerPkh,
  })
  const pendingRoundMismatch = registryDatum({
    brRound: target.round - 1,
    targetRound: target.round,
    mainchainRefHex,
    versionHex,
    status: 0,
    relayerPkh: keyHash,
  })

  console.log(JSON.stringify({
    beaconRegistryB0: 'bootstrap-start',
    branchSha: process.env.GITHUB_SHA ?? null,
    yaciLatestSlot: latestBlock.slot,
    yaciLatestTime: latestBlock.time,
    registryHash,
    registryAddress,
    testWalletAddress: address,
    nominatedRelayerPkh: keyHash,
    purpose: 'local-test-wallet-only',
  }, null, 2))

  // Ordinary signed outputs only. No Registry minting policy, Registry spend,
  // deployment authority or prior authenticated state is involved.
  const bootstrapTx = await lucid
    .newTx()
    .pay.ToContract(registryAddress, { kind: 'inline', value: Data.to(pendingCanonical) }, {
      lovelace: STARTING_PENDING_LOVELACE,
    })
    .pay.ToContract(registryAddress, { kind: 'inline', value: Data.to(pendingDuplicate) }, {
      lovelace: STARTING_PENDING_LOVELACE,
    })
    .pay.ToContract(registryAddress, { kind: 'inline', value: Data.to(pendingRoundMismatch) }, {
      lovelace: STARTING_PENDING_LOVELACE,
    })
    .complete({ localUPLCEval: false })
  const bootstrapSigned = await bootstrapTx.sign.withWallet().complete({ localUPLCEval: false })
  const bootstrapCbor = bootstrapSigned.toCBOR()
  const bootstrapHash = await bootstrapSigned.submit()
  await lucid.awaitTx(bootstrapHash)

  const bootstrapOutputs = await waitFor(
    () => lucid.utxosAt(registryAddress),
    (utxos) => utxos.filter((utxo) => utxo.txHash === bootstrapHash).length === 3,
    'three permissionlessly-created Registry Pending outputs',
  )
  const created = bootstrapOutputs
    .filter((utxo) => utxo.txHash === bootstrapHash)
    .map((utxo) => ({ utxo, datum: decodeRegistry(utxo) }))
  const canonicalPending = created.find(({ datum }) =>
    datum.round === BigInt(target.round) && datum.status === 0 && datum.relayerPkh === keyHash,
  )
  const duplicatePending = created.find(({ datum }) =>
    datum.round === BigInt(target.round) && datum.status === 0 && datum.relayerPkh === otherRelayerPkh,
  )
  const mismatchedPending = created.find(({ datum }) =>
    datum.round === BigInt(target.round - 1) &&
    datum.targetRound === BigInt(target.round) &&
    datum.status === 0 &&
    datum.relayerPkh === keyHash,
  )
  if (!canonicalPending || !duplicatePending || !mismatchedPending) {
    throw new Error('bootstrap did not materialize all three distinct Pending Registry cases')
  }
  for (const { utxo } of created) {
    if (utxo.assets.lovelace !== STARTING_PENDING_LOVELACE) {
      throw new Error('unexpected Registry bootstrap output Value')
    }
  }

  // T01b: create a BeaconReady-shaped output with an ordinary wallet
  // payment. This deliberately does not consume a Registry UTxO, attach the
  // Registry validator, or establish any authenticated Registry provenance.
  const directReadyDatum = registryDatum({
    brRound: target.round,
    targetRound: target.round,
    mainchainRefHex,
    versionHex,
    status: 1,
    beaconValueHex: beaconHex,
    mcHashHex,
    materiosContextHex: contextHex,
    relayerPkh: otherRelayerPkh,
  })
  const directReadyTx = await lucid
    .newTx()
    .pay.ToContract(registryAddress, { kind: 'inline', value: Data.to(directReadyDatum) }, {
      lovelace: STARTING_PENDING_LOVELACE,
    })
    .complete({ localUPLCEval: false })
  const directReadySigned = await directReadyTx.sign.withWallet().complete({ localUPLCEval: false })
  const directReadyTxCbor = directReadySigned.toCBOR()
  const directReadyTxHash = await directReadySigned.submit()
  await lucid.awaitTx(directReadyTxHash)

  const directReadyOutputs = await waitFor(
    () => lucid.utxosAt(registryAddress),
    (utxos) => utxos.filter((utxo) => utxo.txHash === directReadyTxHash).length === 1,
    'one directly injected BeaconReady-shaped Registry output',
  )
  const directReadyMatches = directReadyOutputs.filter((utxo) => utxo.txHash === directReadyTxHash)
  if (directReadyMatches.length !== 1) {
    throw new Error('direct Ready injection did not create exactly one Registry output')
  }
  const directReadyUtxo = directReadyMatches[0]
  const directReadyDecoded = decodeRegistry(directReadyUtxo)
  if (
    directReadyDecoded.round !== BigInt(target.round) ||
    directReadyDecoded.targetRound !== BigInt(target.round) ||
    directReadyDecoded.status !== 1 ||
    directReadyDecoded.relayerPkh !== otherRelayerPkh ||
    directReadyDecoded.beaconValue !== beaconHex ||
    directReadyDecoded.mcHash !== mcHashHex ||
    directReadyDecoded.materiosContext !== contextHex ||
    directReadyUtxo.assets.lovelace !== STARTING_PENDING_LOVELACE
  ) {
    throw new Error('direct Ready injection did not preserve the exact expected seven-field datum and Value')
  }

  async function publish(
    pending: UTxO,
    brRound: number,
    continuationLovelace: bigint,
    returnAda: boolean,
  ): Promise<{ txHash: string; txCbor: string; ready: UTxO; evaluation: EvaluationResult[] }> {
    const nextDatum = registryDatum({
      brRound,
      targetRound: target.round,
      mainchainRefHex,
      versionHex,
      status: 1,
      beaconValueHex: beaconHex,
      mcHashHex,
      materiosContextHex: contextHex,
      relayerPkh: keyHash,
    })
    const txBuilder = lucid
      .newTx()
      .collectFrom([pending], Data.to(new Constr(0, [mcHashHex, contextHex])))
      .attach.SpendingValidator(registryScript)
      .pay.ToContract(registryAddress, { kind: 'inline', value: Data.to(nextDatum) }, {
        lovelace: continuationLovelace,
      })
    if (returnAda) {
      // Keep total ledger Value balanced while proving that the Registry script
      // itself does not require its continuing output Value to be preserved.
      txBuilder.pay.ToAddress(address, { lovelace: VALUE_DELTA_RETURN_LOVELACE })
    }
    txBuilder.addSigner(address)
    const tx = await txBuilder.complete({ localUPLCEval: false })
    const signed = await tx.sign.withWallet().complete({ localUPLCEval: false })
    const txCbor = signed.toCBOR()
    const evaluation = await evaluateYaciTx(txCbor)
    const txHash = await signed.submit()
    await lucid.awaitTx(txHash)
    const registryOutputs = await waitFor(
      () => lucid.utxosAt(registryAddress),
      (utxos) => utxos.some((utxo) => utxo.txHash === txHash),
      'Registry Ready continuation',
    )
    const ready = registryOutputs.find((utxo) => utxo.txHash === txHash)
    if (!ready) throw new Error('Registry Ready continuation missing after submit')
    return { txHash, txCbor, ready, evaluation }
  }

  // This publication is signed by the same key that the arbitrary creator
  // embedded in brRelayerPkh. The script has no separately pinned authority.
  // The Ready output drops one ADA; an equal ADA amount is paid to the wallet,
  // so the transaction remains ledger-balanced while the Registry Value delta
  // is proven on-chain.
  const valueDeltaPublish = await publish(
    canonicalPending.utxo,
    target.round,
    REDUCED_READY_LOVELACE,
    true,
  )
  const deltaReadyDatum = decodeRegistry(valueDeltaPublish.ready)
  const returnedWalletOutputs = (await lucid.utxosAt(address))
    .filter((utxo) => utxo.txHash === valueDeltaPublish.txHash)
  const returnedAda = returnedWalletOutputs.reduce(
    (sum, utxo) => sum + (utxo.assets.lovelace ?? 0n),
    0n,
  )
  if (valueDeltaPublish.ready.assets.lovelace !== REDUCED_READY_LOVELACE) {
    throw new Error('RegistryPublish did not create the requested reduced-Value continuation')
  }
  if (returnedAda < VALUE_DELTA_RETURN_LOVELACE) {
    throw new Error('the Value delta was not returned to the signer wallet')
  }
  if (deltaReadyDatum.status !== 1 || deltaReadyDatum.beaconValue !== beaconHex) {
    throw new Error('first RegistryPublish Ready datum did not contain the derived Beacon')
  }

  // The script accepts brRound as long as input/output preserve it; it does
  // not compare it with btRound(target). This is another explicit ledger
  // characterization of the missing cross-field predicate.
  const roundMismatchPublish = await publish(
    mismatchedPending.utxo,
    target.round - 1,
    STARTING_PENDING_LOVELACE,
    false,
  )
  const mismatchReadyDatum = decodeRegistry(roundMismatchPublish.ready)
  if (mismatchReadyDatum.round !== BigInt(target.round - 1) ||
      mismatchReadyDatum.targetRound !== BigInt(target.round) ||
      mismatchReadyDatum.status !== 1) {
    throw new Error('expected RegistryPublish round-mismatch characterization was not observed')
  }

  const remainingRegistryUtxos = await lucid.utxosAt(registryAddress)
  const duplicateStillPending = remainingRegistryUtxos.some((utxo) => {
    if (utxo.txHash !== duplicatePending.utxo.txHash ||
        utxo.outputIndex !== duplicatePending.utxo.outputIndex) return false
    const datum = decodeRegistry(utxo)
    return datum.status === 0 && datum.round === BigInt(target.round)
  })
  if (!duplicateStillPending) {
    throw new Error('the competing Pending Registry UTxO was unexpectedly consumed')
  }

  const evidence = {
    evidenceId: hashJson({
      fixture: 'B0-BEACON-REGISTRY-YACI-CHARACTERIZATION-V1',
      bootstrapHash,
      valueDeltaPublishHash: valueDeltaPublish.txHash,
      roundMismatchPublishHash: roundMismatchPublish.txHash,
    }),
    fixtureId: 'B0-BEACON-REGISTRY-YACI-CHARACTERIZATION-V1',
    classification: 'LOCAL_YACI_LEDGER_CHARACTERIZATION_ONLY',
    environment: 'local-yaci-devnet',
    branchSha: process.env.GITHUB_SHA ?? null,
    walletPurpose: wallet.purpose,
    testWalletAddress: address,
    relayerPkhNominatedByCreator: keyHash,
    registryScriptHash: registryHash,
    registryAddress,
    target: {
      networkId: target.networkId,
      round: target.round,
      mainchainRefHex,
      versionHex,
    },
    derivedBeaconHex: beaconHex,
    directReadyInjection: {
      txHash: directReadyTxHash,
      txCbor: directReadyTxCbor,
      outRef: directReadyUtxo.txHash + '#' + directReadyUtxo.outputIndex,
      lovelace: (directReadyUtxo.assets.lovelace ?? 0n).toString(),
      brRound: directReadyDecoded.round.toString(),
      btRound: directReadyDecoded.targetRound.toString(),
      status: directReadyDecoded.status,
      beaconHex: directReadyDecoded.beaconValue,
      mcHashHex: directReadyDecoded.mcHash,
      materiosContextHex: directReadyDecoded.materiosContext,
      relayerPkh: directReadyDecoded.relayerPkh,
      registrySpendExecuted: false,
      registryValidatorAttached: false,
      classification: 'LOCAL_YACI_DIRECT_READY_INJECTION_ONLY',
    },
    bootstrap: {
      txHash: bootstrapHash,
      txCbor: bootstrapCbor,
      outputs: created.map(({ utxo, datum }) => ({
        outRef: utxo.txHash + '#' + utxo.outputIndex,
        lovelace: (utxo.assets.lovelace ?? 0n).toString(),
        brRound: datum.round.toString(),
        targetRound: datum.targetRound.toString(),
        status: datum.status,
        nominatedRelayerPkh: datum.relayerPkh,
      })),
      classification: 'THREE_PENDING_UTXOS_CREATED_BY_ORDINARY_WALLET_TRANSACTION_WITHOUT_REGISTRY_VALIDATOR',
    },
    valueDeltaPublication: {
      txHash: valueDeltaPublish.txHash,
      txCbor: valueDeltaPublish.txCbor,
      consumedOutRef: canonicalPending.utxo.txHash + '#' + canonicalPending.utxo.outputIndex,
      consumedRegistryLovelace: STARTING_PENDING_LOVELACE.toString(),
      readyOutRef: valueDeltaPublish.ready.txHash + '#' + valueDeltaPublish.ready.outputIndex,
      readyRegistryLovelace: (valueDeltaPublish.ready.assets.lovelace ?? 0n).toString(),
      returnedSignerWalletLovelace: returnedAda.toString(),
      yaciEvaluation: valueDeltaPublish.evaluation,
      classification: 'BALANCED_LEDGER_TRANSACTION_ACCEPTED_WITH_REGISTRY_CONTINUATION_VALUE_DELTA',
    },
    roundMismatchPublication: {
      txHash: roundMismatchPublish.txHash,
      txCbor: roundMismatchPublish.txCbor,
      consumedOutRef: mismatchedPending.utxo.txHash + '#' + mismatchedPending.utxo.outputIndex,
      readyOutRef: roundMismatchPublish.ready.txHash + '#' + roundMismatchPublish.ready.outputIndex,
      brRound: mismatchReadyDatum.round.toString(),
      btRound: mismatchReadyDatum.targetRound.toString(),
      status: mismatchReadyDatum.status,
      yaciEvaluation: roundMismatchPublish.evaluation,
      classification: 'REGISTRY_PUBLISH_ACCEPTED_BRROUND_DIFFERENT_FROM_TARGET_ROUND',
    },
    remainingCompetingPending: {
      outRef: duplicatePending.utxo.txHash + '#' + duplicatePending.utxo.outputIndex,
      status: 0,
      brRound: duplicatePending.datum.round.toString(),
      btRound: duplicatePending.datum.targetRound.toString(),
      relayerPkh: duplicatePending.datum.relayerPkh,
      remainsUnspent: duplicateStillPending,
    },
    limitation: 'This local Yaci trace uses a deterministic ephemeral test wallet and synthetic fixture bytes. The direct Ready output is permissionlessly injected and is not an authenticated Registry instance; this does not prove PrizeValidator accepts a fake Ready SyncBeacon transaction. It is not an authenticated Preprod Registry identity, external Materios proof, independent B3 verification, production deployment, or authorization to issue a ticket.',
  }

  writeFileSync(
    'audit/yaci-evidence/beacon-registry-b0-yaci-characterization.json',
    JSON.stringify(evidence, jsonReplacer, 2) + '\n',
  )
  writeFileSync(
    'audit/yaci-evidence/beacon-registry-b0-yaci-value-delta.cbor',
    Buffer.from(valueDeltaPublish.txCbor.replace(/^0x/, ''), 'hex'),
  )
  writeFileSync(
    'audit/yaci-evidence/beacon-registry-b0-yaci-round-mismatch.cbor',
    Buffer.from(roundMismatchPublish.txCbor.replace(/^0x/, ''), 'hex'),
  )

  console.log(JSON.stringify({
    beaconRegistryB0Yaci: 'CHARACTERIZATION_COMPLETED',
    bootstrapHash,
    valueDeltaPublishHash: valueDeltaPublish.txHash,
    roundMismatchPublishHash: roundMismatchPublish.txHash,
    competingPendingStillUnspent: duplicateStillPending,
    registryValueBefore: STARTING_PENDING_LOVELACE.toString(),
    registryValueAfter: (valueDeltaPublish.ready.assets.lovelace ?? 0n).toString(),
    walletReturn: returnedAda.toString(),
    yaciEvidence: 'audit/yaci-evidence/beacon-registry-b0-yaci-characterization.json',
  }, null, 2))
}

await main().catch((error) => {
  console.error('[B0 BeaconRegistry Yaci characterization]', error)
  process.exitCode = 1
})
