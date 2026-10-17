/**
 * Isolated Plutus V3 Aiken script publication probe on the local Yaci Conway ledger.
 *
 * This tests only publication/serialization of the Aiken Reveal spend entrypoint.
 * It does not spend a Reveal datum, replace the Haskell Plutus V2 validator, or
 * declare Reveal protocol behavior equivalent. Full transaction-size, native
 * ledger acceptance, and reference-output binding are checked from the exact CBOR.
 */
import {
  CML,
  Blockfrost,
  Lucid,
  validatorToScriptHash,
  type Script,
} from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { bindPublishedReferenceScript } from './revealReferenceScripts'

const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'
const WALLET_FILE = '/tmp/immortal-yaci-test-wallet.json'
const BLUEPRINT_PATH = 'poc/aiken-reveal-parity/plutus.json'
const EVIDENCE_PATH = 'audit/yaci-evidence/aiken-reference-script-publication.json'
const EXPECTED_TITLE = 'reveal.pre_rich_reveal.spend'
const REFERENCE_LOVELACE = 2_000_000n

const fail = (message: string): never => { throw new Error(message) }
const bytes = (cborHex: string): number => {
  const hex = cborHex.replace(/^0x/i, '')
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return fail('Expected valid hexadecimal transaction CBOR')
  }
  return hex.length / 2
}

const blueprint = JSON.parse(readFileSync(BLUEPRINT_PATH, 'utf8')) as {
  preamble?: { plutusVersion?: string }
  validators?: Array<{ title?: string; compiledCode?: string; hash?: string }>
}
if (blueprint.preamble?.plutusVersion !== 'v3') {
  fail('Aiken Reveal publication probe requires a blueprint targeting Plutus V3')
}
const matching = (blueprint.validators ?? []).filter((v) => v.title === EXPECTED_TITLE)
if (matching.length !== 1) {
  fail(`Expected exactly one ${EXPECTED_TITLE} blueprint entry; found ${matching.length}`)
}
const validator = matching[0]
if (!validator.compiledCode || !validator.hash ||
    validator.compiledCode.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(validator.compiledCode)) {
  fail('Aiken blueprint spend validator has missing/malformed compiledCode or hash')
}

const script: Script = { type: 'PlutusV3', script: validator.compiledCode }
const blueprintHash = validator.hash.toLowerCase()
const lucidityHash = validatorToScriptHash(script).toLowerCase()
if (lucidityHash !== blueprintHash) {
  fail(`Aiken blueprint/Lucid script hash mismatch: blueprint=${blueprintHash}, Lucid=${lucidityHash}`)
}

const wallet = JSON.parse(readFileSync(WALLET_FILE, 'utf8')) as { seed?: string }
if (!wallet.seed) fail('CI test-wallet seed missing; refusing to use a different signer')

const provider = new Blockfrost(API, '')
const latestResponse = await fetch(API + '/blocks/latest')
if (!latestResponse.ok) fail(`Yaci latest-block query failed: HTTP ${latestResponse.status}`)
const latestBlock = await latestResponse.json() as { slot?: number; time?: number }
if (!Number.isSafeInteger(latestBlock.slot) || (latestBlock.slot ?? -1) < 0 ||
    !Number.isSafeInteger(latestBlock.time) || (latestBlock.time ?? 0) <= 0) {
  fail('Yaci latest block lacks a valid slot/time: ' + JSON.stringify(latestBlock))
}
const slotConfig = {
  zeroTime: latestBlock.time! * 1000,
  zeroSlot: latestBlock.slot!,
  slotLength: 1000,
}

const lucid = await Lucid(provider, 'Preprod', { slotConfig })
lucid.selectWallet.fromSeed(wallet.seed)
const referenceLucid = await Lucid(provider, 'Preprod', { slotConfig })
referenceLucid.selectWallet.fromSeed(wallet.seed, { accountIndex: 1 })
const signingAddress = await lucid.wallet().address()
const referenceAddress = await referenceLucid.wallet().address()
if (signingAddress === referenceAddress) {
  fail('Reference-script receiver must be isolated from the spending wallet address')
}

const protocolParameters = await provider.getProtocolParameters()
const maxTxSize = Number(protocolParameters.maxTxSize)
if (!Number.isSafeInteger(maxTxSize) || maxTxSize <= 0) {
  fail('Yaci protocol parameters do not expose a valid maxTxSize')
}

console.log(JSON.stringify({
  aikenDiag: 'reference-script-publication-plan',
  validatorTitle: EXPECTED_TITLE,
  plutusVersion: 'v3',
  validatorHash: blueprintHash,
  compiledScriptBytes: bytes(script.script),
  maxTxSize,
  referenceAddress,
}, null, 2))

// No script executes in this publication transaction. The final signed CBOR is
// measured before submit, and oversized transactions fail closed without submit.
const unsigned = await lucid
  .newTx()
  .pay.ToAddressWithData(referenceAddress, undefined, { lovelace: REFERENCE_LOVELACE }, script)
  .complete({ localUPLCEval: false })
const unsignedCbor = unsigned.toCBOR()
const unsignedBytes = bytes(unsignedCbor)
if (unsignedBytes > maxTxSize) {
  fail(`Unsigned Aiken reference-script publication exceeds maxTxSize: ${unsignedBytes} > ${maxTxSize}`)
}

const signed = await unsigned.sign.withWallet().complete({ localUPLCEval: false })
const signedCbor = signed.toCBOR()
const signedBytes = bytes(signedCbor)
if (signedBytes > maxTxSize) {
  fail(`Signed Aiken reference-script publication exceeds maxTxSize: ${signedBytes} > ${maxTxSize}`)
}

const cmlTx = CML.Transaction.from_cbor_hex(signedCbor)
const bodyHash = CML.hash_transaction(cmlTx.body()).to_hex().toLowerCase()
const submittedTxHash = (await signed.submit()).toLowerCase()
if (bodyHash !== submittedTxHash) {
  fail(`Submitted transaction hash does not match measured body: cbor=${bodyHash}, node=${submittedTxHash}`)
}
await lucid.awaitTx(submittedTxHash)

// Yaci's transaction acceptance can precede address-UTxO indexing. Poll the
// indexer for the exact submitted output instead of treating a short indexing
// delay as a missing ledger output. This also gives the following smoke step
// time to observe the wallet change output before it selects fresh inputs.
let publishedUtxo: UTxO | undefined
for (let attempt = 0; attempt < 30; attempt += 1) {
  const candidateUtxos = await lucid.utxosAt(referenceAddress)
  publishedUtxo = candidateUtxos.find((utxo) => utxo.txHash.toLowerCase() === submittedTxHash)
  if (publishedUtxo) break
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
if (!publishedUtxo) {
  fail('Accepted Aiken reference-script transaction output was not indexed within 30 seconds')
}
const boundUtxo = bindPublishedReferenceScript({
  purpose: 'PrizeValidator',
  publishedTxCbor: signedCbor,
  expectedScript: script,
  referenceAddress,
  utxo: publishedUtxo,
})
if (!boundUtxo.scriptRef) fail('Reference-script CBOR binding did not materialize a local scriptRef')
const reboundHash = validatorToScriptHash(boundUtxo.scriptRef as Script).toLowerCase()
if (reboundHash !== blueprintHash) {
  fail(`Materialized reference script hash mismatch: expected=${blueprintHash}, actual=${reboundHash}`)
}
if (bytes(signedCbor) > maxTxSize) fail('Post-acceptance size check failed unexpectedly')

const scriptBytesSha256 = createHash('sha256')
  .update(Buffer.from(script.script, 'hex'))
  .digest('hex')
const report = {
  schema: 'immortal-aiken-reference-script-publication-v1',
  workflowStage: 'aiken-v3-reference-script-publication-only',
  validatorTitle: EXPECTED_TITLE,
  plutusVersion: 'v3',
  validatorHash: blueprintHash,
  compiledScriptBytes: bytes(script.script),
  compiledScriptSha256: scriptBytesSha256,
  protocolMaxTxSize: maxTxSize,
  unsignedTransactionBytes: unsignedBytes,
  signedTransactionBytes: signedBytes,
  signedTransactionSha256: createHash('sha256').update(Buffer.from(signedCbor, 'hex')).digest('hex'),
  publicationTransactionId: submittedTxHash,
  publicationBodyHash: bodyHash,
  referenceUtxo: {
    txHash: boundUtxo.txHash,
    outputIndex: boundUtxo.outputIndex,
    address: referenceAddress,
    scriptHash: reboundHash,
    scriptType: boundUtxo.scriptRef.type,
    scriptBytes: bytes(boundUtxo.scriptRef.script),
  },
  nativeLedger: {
    submission: 'accepted',
    confirmation: 'observed by Lucid awaitTx on local Yaci Conway devnet',
  },
  revealExecution: 'NOT_TESTED',
  fullRevealTransactionSize: 'NOT_MEASURED',
  cpuAndMemory: 'NOT_MEASURED',
  v2ToV3Compatibility: 'OPEN',
  deploymentGateClosed: true,
  limitations: [
    'Only the reference-script publication transaction is measured; this is not the complete Reveal spending transaction.',
    'No PrizeDatum is spent and the Aiken Reveal validator is not executed in this probe.',
    'Ledger acceptance proves publication of this script on the configured local Yaci devnet only.',
    'The canonical production Reveal validator remains Plutus V2; this isolated Aiken script targets Plutus V3.',
  ],
}
writeFileSync(EVIDENCE_PATH, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ aikenDiag: 'reference-script-publication-accepted', ...report }, null, 2))
