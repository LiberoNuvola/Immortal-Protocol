import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const evidencePath = 'audit/yaci-evidence/genesis-carrier-transition.json'
const artifacts = [
  'plutus/out/genesisRegimeCarrier.plutus.json',
  'plutus/out/genesisCarrierMintPolicy.plutus.json',
]

const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
const sha256File = (path: string) =>
  createHash('sha256').update(readFileSync(path)).digest('hex')

evidence.artifactProvenance = {
  sourceCommit: process.env.GITHUB_SHA ?? 'unknown',
  artifacts: Object.fromEntries(
    artifacts.map((path) => [path, sha256File(path)]),
  ),
  binding: {
    transitionTransactionRef: evidence.transitionTransactionRef,
    transitionTxCborPresent: typeof evidence.transitionTxCbor === 'string' &&
      evidence.transitionTxCbor.length > 0,
  },
}

if (evidence.artifactProvenance.sourceCommit === 'unknown') {
  throw new Error('GITHUB_SHA is required for artifact provenance binding')
}
if (!evidence.artifactProvenance.binding.transitionTxCborPresent) {
  throw new Error('Genesis transition evidence must contain transaction CBOR')
}

writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify(evidence.artifactProvenance, null, 2))
