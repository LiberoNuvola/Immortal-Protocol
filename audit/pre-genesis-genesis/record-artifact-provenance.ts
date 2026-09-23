import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const evidencePath = 'audit/yaci-evidence/genesis-carrier-transition.json'
const artifacts = [
  'plutus/out/genesisRegimeCarrier.plutus.json',
  'plutus/out/genesisCarrierMintPolicy.plutus.json',
]

const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
const carrierArtifact = JSON.parse(readFileSync(artifacts[0], 'utf8'))
const carrierPolicyArtifact = JSON.parse(readFileSync(artifacts[1], 'utf8'))
const lucid = await Lucid.new(new Blockfrost('http://127.0.0.1:8080/api/v1', ''), 'Preprod')
const sha256File = (path: string) =>
  createHash('sha256').update(readFileSync(path)).digest('hex')

const carrierScriptHash = lucid.utils.validatorToScriptHash({
  type: 'PlutusV2',
  script: carrierArtifact.cborHex,
})
const carrierPolicyId = lucid.utils.mintingPolicyToId({
  type: 'PlutusV2',
  script: carrierPolicyArtifact.cborHex,
})

const transitionTxCbor = evidence.transitionTxCbor
if (typeof transitionTxCbor !== 'string' || transitionTxCbor.length === 0) {
  throw new Error('Genesis transition evidence must contain transaction CBOR')
}

// Parse the exact signed transaction CBOR with Lucid/CML and inspect the
// witness set. This binds the generated validator bytes to the script bytes
// actually carried by the submitted transaction, rather than only comparing
// precomputed script-hash fields in the evidence packet.
const parsedTx = lucid.fromTx(transitionTxCbor) as any
const coreTx = parsedTx.txComplete
const witnessSet = coreTx?.witness_set?.()
const plutusV2Scripts = witnessSet?.plutus_v2_scripts?.()
const observedScripts: string[] = []
if (plutusV2Scripts) {
  for (let i = 0; i < plutusV2Scripts.len(); i += 1) {
    observedScripts.push(Buffer.from(plutusV2Scripts.get(i).to_bytes()).toString('hex'))
  }
}
const generatedCarrierCbor = carrierArtifact.cborHex.toLowerCase()
const witnessScriptPresent = observedScripts.includes(generatedCarrierCbor)
const witnessScriptHashes = observedScripts.map((script) =>
  lucid.utils.validatorToScriptHash({ type: 'PlutusV2', script }),
)
const witnessIdentityBound = witnessScriptPresent &&
  witnessScriptHashes.includes(carrierScriptHash)

if (!witnessScriptPresent) {
  throw new Error('Signed Genesis transition does not carry the generated Genesis carrier PlutusV2 script bytes')
}
if (!witnessIdentityBound) {
  throw new Error('Signed Genesis transition witness script does not resolve to the generated Genesis carrier script hash')
}

evidence.artifactProvenance = {
  sourceCommit: process.env.GITHUB_SHA ?? 'unknown',
  artifacts: Object.fromEntries(
    artifacts.map((path) => [path, sha256File(path)]),
  ),
  binding: {
    transitionTransactionRef: evidence.transitionTransactionRef,
    transitionTxCborPresent: true,
    witnessScriptPresent,
    witnessIdentityBound,
    observedPlutusV2ScriptHashes: witnessScriptHashes,
  },
}

if (evidence.artifactProvenance.sourceCommit === 'unknown') {
  throw new Error('GITHUB_SHA is required for artifact provenance binding')
}
if (carrierScriptHash !== evidence.carrier.scriptHash) {
  throw new Error(
    `Generated Genesis carrier script hash mismatch: generated=${carrierScriptHash}, evidence=${evidence.carrier.scriptHash}`,
  )
}
if (carrierPolicyId !== evidence.carrier.policyId) {
  throw new Error(
    `Generated Genesis carrier mint policy mismatch: generated=${carrierPolicyId}, evidence=${evidence.carrier.policyId}`,
  )
}
writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify(evidence.artifactProvenance, null, 2))
