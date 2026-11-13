/**
 * Counter identity / lookalike characterization on the isolated local Yaci ledger.
 *
 * Ordinary payment outputs are created with the canonical Counter payment
 * script hash and a distinct staking credential. Creation does not execute
 * CounterValidator. Two such outputs are then spent independently through
 * the compiled CounterValidator while the canonical-address output stays unspent.
 *
 * This does NOT execute MintPolicy, mint a Ticket NFT, or prove duplicate supply.
 */
import {
  CML, Data, Lucid, Blockfrost, getAddressDetails, validatorToAddress,
  validatorToScriptHash, type Script, type UTxO,
} from '@lucid-evolution/lucid'
import { readFileSync, writeFileSync } from 'node:fs'

const API = 'http://127.0.0.1:8080/api/v1'
const WALLET_PATH = '/tmp/immortal-yaci-test-wallet.json'
const EVIDENCE_PATH = 'audit/yaci-evidence/counter-lookalike-identity-characterization.json'
const COUNTER_LOVELACE = 3_000_000n

type EvaluationResult = {
  redeemer_tag: string
  redeemer_index: number
  ex_units: { mem: number; steps: number }
}
type EvaluationResponse = {
  fault?: unknown
  result?: { EvaluationResult?: Record<string, { memory: number; steps: number }> }
  message?: string
}
const jsonReplacer = (_key: string, value: unknown) => typeof value === 'bigint' ? value.toString() : value
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
async function waitFor<T>(fn: () => Promise<T>, predicate: (value: T) => boolean, label: string): Promise<T> {
  for (let i = 0; i < 60; i += 1) {
    const value = await fn()
    if (predicate(value)) return value
    await wait(1000)
  }
  throw new Error('Timed out waiting for ' + label)
}
async function evaluateYaciTx(txCbor: string): Promise<EvaluationResult[]> {
  const cbor = txCbor.startsWith('0x') ? txCbor.slice(2) : txCbor
  if (!/^[0-9a-fA-F]+$/.test(cbor) || cbor.length % 2 !== 0) throw new Error('Yaci evaluator received invalid transaction CBOR')
  const response = await fetch(API + '/utils/txs/evaluate/utxos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cbor }),
  })
  const raw = await response.text()
  let parsed: EvaluationResponse
  try { parsed = JSON.parse(raw) as EvaluationResponse } catch { parsed = { message: raw } }
  if (!response.ok || parsed.fault || !parsed.result?.EvaluationResult) {
    throw new Error('Yaci Counter evaluation failed (HTTP ' + response.status + '): ' + raw.slice(0, 4000))
  }
  return Object.entries(parsed.result.EvaluationResult).map(([pointer, units]) => {
    const [redeemer_tag, index] = pointer.split(':')
    return {
      redeemer_tag,
      redeemer_index: Number(index),
      ex_units: { mem: Math.ceil(Number(units.memory) * 1.01), steps: Math.ceil(Number(units.steps) * 1.01) },
    }
  })
}
function datumInteger(utxo: UTxO, expected: bigint, label: string): void {
  if (!utxo.datum) throw new Error(label + ' has no inline datum')
  const datum = Data.from(utxo.datum)
  if (typeof datum !== 'bigint' || datum !== expected) throw new Error(label + ' datum mismatch')
}
async function spendLookalike(
  lucid: any, script: Script, address: string, input: UTxO, label: string,
): Promise<Record<string, unknown>> {
  datumInteger(input, 0n, label + ' input')
  const tx = await lucid.newTx()
    .collectFrom([input], Data.void())
    .attach.SpendingValidator(script)
    .pay.ToContract(address, { kind: 'inline', value: Data.to(1n) }, { lovelace: COUNTER_LOVELACE })
    .complete({ localUPLCEval: false })
  const signed = await tx.sign.withWallet().complete({ localUPLCEval: false })
  const evaluation = await evaluateYaciTx(signed.toCBOR())
  if (evaluation.length !== 1 || evaluation[0].redeemer_tag !== 'spend') {
    throw new Error(label + ' did not produce exactly one evaluated spending redeemer')
  }
  const txHash = await signed.submit()
  await lucid.awaitTx(txHash)
  const outputs = (await lucid.utxosAt(address)).filter((utxo: UTxO) => utxo.txHash === txHash)
  if (outputs.length !== 1) throw new Error(label + ' did not produce exactly one lookalike continuation')
  datumInteger(outputs[0], 1n, label + ' continuation')
  const cbor = signed.toCBOR().replace(/^0x/i, '')
  return {
    label, inputReference: input.txHash + '#' + input.outputIndex,
    outputReference: outputs[0].txHash + '#' + outputs[0].outputIndex,
    datumBefore: '0', datumAfter: '1', txHash,
    cborBytes: Buffer.from(cbor, 'hex').length, evaluation,
  }
}
async function main(): Promise<void> {
  const wallet = JSON.parse(readFileSync(WALLET_PATH, 'utf8')) as { purpose?: string; address?: string; seed?: string }
  if (wallet.purpose !== 'ephemeral-local-devnet-only' || !wallet.address || !wallet.seed) {
    throw new Error('Refusing wallet not explicitly marked ephemeral local-devnet-only')
  }
  const latest = await (await fetch(API + '/blocks/latest')).json() as { slot?: number; time?: number }
  if (!Number.isSafeInteger(latest.slot) || !Number.isSafeInteger(latest.time) ||
      (latest.slot ?? -1) < 0 || (latest.time ?? 0) <= 0) throw new Error('Invalid Yaci slot/time anchor')
  const slotConfig = { zeroTime: latest.time! * 1000, zeroSlot: latest.slot!, slotLength: 1000 }
  const provider = new Blockfrost(API, '') as Blockfrost & { evaluateTx: (tx: string) => Promise<EvaluationResult[]> }
  provider.evaluateTx = evaluateYaciTx
  const lucid = await Lucid(provider, 'Preprod', { slotConfig })
  lucid.selectWallet.fromSeed(wallet.seed)
  const walletAddress = await lucid.wallet().address()
  if (walletAddress !== wallet.address) throw new Error('local Yaci wallet does not match wallet manifest')
  const walletPaymentHash = getAddressDetails(walletAddress).paymentCredential?.hash
  if (!walletPaymentHash || walletPaymentHash.length !== 56) throw new Error('Cannot derive ephemeral wallet payment hash')

  const artifact = JSON.parse(readFileSync('plutus/out/counterValidator.plutus.json', 'utf8')) as { type?: string; cborHex?: string }
  if (artifact.type !== 'PlutusScriptV2' || !artifact.cborHex) throw new Error('Generated CounterValidator artifact is missing')
  const counterScript = { type: 'PlutusV2', script: artifact.cborHex } as Script
  const counterHash = validatorToScriptHash(counterScript).toLowerCase()
  const canonicalAddress = validatorToAddress('Preprod', counterScript)
  const lookalikeAddress = CML.BaseAddress.new(
    0,
    CML.StakeCredential.from_scripthash(CML.ScriptHash.from_hex(counterHash)),
    CML.StakeCredential.from_keyhash(CML.Ed25519KeyHash.from_hex(walletPaymentHash)),
  ).to_address().to_bech32()
  const lookalikeDetails = getAddressDetails(lookalikeAddress)
  if (lookalikeAddress === canonicalAddress ||
      lookalikeDetails.paymentCredential?.type !== 'Script' ||
      lookalikeDetails.paymentCredential.hash.toLowerCase() !== counterHash ||
      lookalikeDetails.stakeCredential?.type !== 'Key') {
    throw new Error('Lookalike address does not preserve Counter payment credential with distinct stake credential')
  }

  const bootstrap = await lucid.newTx()
    .pay.ToContract(canonicalAddress, { kind: 'inline', value: Data.to(0n) }, { lovelace: COUNTER_LOVELACE })
    .pay.ToContract(lookalikeAddress, { kind: 'inline', value: Data.to(0n) }, { lovelace: COUNTER_LOVELACE })
    .pay.ToContract(lookalikeAddress, { kind: 'inline', value: Data.to(0n) }, { lovelace: COUNTER_LOVELACE })
    .complete({ localUPLCEval: false })
  const bootstrapSigned = await bootstrap.sign.withWallet().complete({ localUPLCEval: false })
  const bootstrapHash = await bootstrapSigned.submit()
  await lucid.awaitTx(bootstrapHash)

  const canonicalOutputs = (await lucid.utxosAt(canonicalAddress)).filter((u) => u.txHash === bootstrapHash)
  const lookalikes = (await lucid.utxosAt(lookalikeAddress))
    .filter((u) => u.txHash === bootstrapHash).sort((a, b) => a.outputIndex - b.outputIndex)
  if (canonicalOutputs.length !== 1 || lookalikes.length !== 2) {
    throw new Error('Expected one canonical-shaped Counter output and two lookalikes')
  }
  datumInteger(canonicalOutputs[0], 0n, 'canonical Counter-shaped output')
  for (const [i, utxo] of lookalikes.entries()) datumInteger(utxo, 0n, 'lookalike ' + i)
  const canonicalRef = canonicalOutputs[0].txHash + '#' + canonicalOutputs[0].outputIndex
  const canonicalBefore = await lucid.utxosAt(canonicalAddress)
  if (canonicalBefore.length !== 1 || canonicalBefore[0].txHash !== bootstrapHash) {
    throw new Error('Exact canonical-address query did not see exactly one Counter-shaped UTxO')
  }

  const first = await spendLookalike(lucid, counterScript, lookalikeAddress, lookalikes[0], 'lookalike-1')
  const second = await spendLookalike(lucid, counterScript, lookalikeAddress, lookalikes[1], 'lookalike-2')
  const canonicalAfter = await lucid.utxosAt(canonicalAddress)
  if (canonicalAfter.length !== 1 ||
      canonicalAfter[0].txHash + '#' + canonicalAfter[0].outputIndex !== canonicalRef) {
    throw new Error('Lookalike spends changed or consumed canonical Counter UTxO')
  }
  datumInteger(canonicalAfter[0], 0n, 'canonical Counter after lookalike spends')

  const evidence = {
    schema: 'IMMORTAL_COUNTER_LOOKALIKE_YACI_V1',
    environment: 'local-yaci-devnet',
    source: {
      repository: process.env.GITHUB_REPOSITORY ?? null,
      ref: process.env.GITHUB_REF ?? null,
      commitSha: process.env.GITHUB_SHA ?? null,
      runId: process.env.GITHUB_RUN_ID ?? null,
      runUrl: process.env.RUN_URL ?? null,
    },
    purpose: 'Test compiled CounterValidator on alternate-staking addresses while exact canonical-address observation still sees one UTxO',
    walletPurpose: wallet.purpose,
    counterScriptHash: counterHash,
    canonicalAddress,
    lookalikeAddress,
    samePaymentScriptHash: true,
    differentFullAddress: true,
    bootstrapTxHash: bootstrapHash,
    canonicalCounter: {
      reference: canonicalRef, datum: '0', remainsUnspent: true,
      exactAddressUtxoCountAfter: canonicalAfter.length,
    },
    lookalikeInputReferences: lookalikes.map((u) => u.txHash + '#' + u.outputIndex),
    acceptedSpends: [first, second],
    classification: 'COUNTER_LOOKALIKE_SPENDS_ACCEPTED_CANONICAL_COUNTER_UNTOUCHED',
    limitations: [
      'The Yaci trace executes only CounterValidator; it does not execute MintPolicy or mint a Ticket NFT.',
      'The paired Plutus CEK fixture executes MintPolicy against a lookalike address but is not native-ledger Issue evidence.',
      'This synthetic local-Yaci result is not Preprod/mainnet qualification.',
    ],
  }
  writeFileSync(EVIDENCE_PATH, JSON.stringify(evidence, jsonReplacer, 2) + '\n')
  console.log(JSON.stringify({
    counterLookalikeYaci: 'CHARACTERIZATION_COMPLETED',
    canonicalCounterRemainsUnspent: true,
    acceptedLookalikeSpends: [first, second].map((x) => (x as { txHash: string }).txHash),
    evidence: EVIDENCE_PATH,
  }, jsonReplacer, 2))
}
await main().catch((error) => {
  console.error('[Counter lookalike Yaci characterization]', error)
  process.exitCode = 1
})
