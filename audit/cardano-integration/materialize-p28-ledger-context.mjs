import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const EVIDENCE_DIR = process.argv[2] ?? 'audit/yaci-evidence'
const API = process.env.YACI_STORE_API ?? 'http://127.0.0.1:8080/api/v1'

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function requireFile(path) {
  try {
    return await readFile(path)
  } catch (error) {
    throw new Error('Missing required Yaci evidence file: ' + path + ' (' + error.message + ')')
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function extractInfoValue(text, label) {
  const match = text.match(new RegExp(label + '\\]?[^0-9]*([0-9]+(?:\\.[0-9]+)?)', 'i'))
  return match?.[1]?.trim() ?? null
}

const transition = await readJson(EVIDENCE_DIR + '/reveal-transition.json')
const txHash = transition.transactionRef
if (typeof txHash !== 'string' || !/^[0-9a-f]{64}$/i.test(txHash)) {
  throw new Error('Reveal transition packet has invalid transactionRef')
}
if (!Array.isArray(transition.consumedUtxos) || transition.consumedUtxos.length === 0) {
  throw new Error('Reveal transition lacks consumed input references')
}
if (new Set(transition.consumedUtxos).size !== transition.consumedUtxos.length ||
    transition.consumedUtxos.some((ref) => typeof ref !== 'string' || !/^[0-9a-f]{64}#[0-9]+$/i.test(ref))) {
  throw new Error('Reveal consumed input references are malformed or duplicated')
}

const txCbor = await requireFile(EVIDENCE_DIR + '/reveal-tx.cbor')
const pparams = await requireFile(EVIDENCE_DIR + '/reveal-protocol-parameters.json')
const epochLatest = await requireFile(EVIDENCE_DIR + '/epoch-latest.json')
const yaciInfo = (await requireFile(EVIDENCE_DIR + '/yaci-devkit-info.txt')).toString('utf8')

const utxoResponse = await fetch(API + '/txs/' + txHash + '/utxos')
if (!utxoResponse.ok) {
  throw new Error('Yaci /txs/{hash}/utxos failed: HTTP ' + utxoResponse.status)
}
const utxos = await utxoResponse.json()
if (!Array.isArray(utxos.inputs) || utxos.inputs.length === 0) {
  throw new Error('Yaci transaction UTxO response lacks consumed inputs')
}
const observedRefs = utxos.inputs.map((input) => {
  if (typeof input.tx_hash !== 'string' || !Number.isSafeInteger(input.output_index)) {
    throw new Error('Yaci consumed input lacks tx_hash/output_index')
  }
  return input.tx_hash.toLowerCase() + '#' + input.output_index
})
const expectedRefs = transition.consumedUtxos.map((ref) => ref.toLowerCase())
if (observedRefs.length !== expectedRefs.length ||
    new Set(observedRefs).size !== observedRefs.length ||
    expectedRefs.some((ref) => !observedRefs.includes(ref))) {
  throw new Error('Yaci consumed input set does not match the exact Reveal transition')
}
const timing = {
  startTimeRaw: extractInfoValue(yaciInfo, 'Start Time'),
  slotLengthRaw: extractInfoValue(yaciInfo, 'Slot Length'),
  epochLengthRaw: extractInfoValue(yaciInfo, 'Epoch Length'),
}
if (Object.values(timing).some((value) => value === null)) {
  throw new Error('Yaci timing provenance is incomplete; refusing to materialize packet')
}

await writeFile(EVIDENCE_DIR + '/tx.cbor', txCbor)
await writeFile(EVIDENCE_DIR + '/pparams.json', pparams)

await writeFile(
  EVIDENCE_DIR + '/utxo.json',
  JSON.stringify({
    schema: 'IMMORTAL-P2.8-YACI-UTXO-RAW-v0.1',
    transactionRef: txHash,
    source: {
      apiBase: API,
      endpoint: '/txs/' + txHash + '/utxos',
      kind: 'Yaci Store Blockfrost-compatible transaction UTxO response',
    },
    consumedUtxos: transition.consumedUtxos ?? [],
    observed: utxos,
  }, null, 2) + '\n',
)

await writeFile(
  EVIDENCE_DIR + '/epoch-info.json',
  JSON.stringify({
    schema: 'IMMORTAL-P2.8-YACI-EPOCH-RAW-v0.1',
    source: {
      endpoint: '/epochs/latest',
      apiBase: API,
      yaciDevkitInfo: 'yaci-devkit-info.txt',
    },
    latestEpochResponse: JSON.parse(epochLatest.toString('utf8')),
    timingSource: {
      ...timing,
    },
  }, null, 2) + '\n',
)

await writeFile(
  EVIDENCE_DIR + '/system-start.json',
  JSON.stringify({
    schema: 'IMMORTAL-P2.8-YACI-SYSTEM-START-RAW-v0.1',
    source: {
      command: 'yaci-devkit info',
      file: 'yaci-devkit-info.txt',
    },
    startTimeRaw: timing.startTimeRaw,
    rawInfo: yaciInfo,
  }, null, 2) + '\n',
)

const files = ['tx.cbor', 'utxo.json', 'pparams.json', 'epoch-info.json', 'system-start.json']
const hashes = {}
for (const file of files) {
  hashes[file] = sha256(await readFile(EVIDENCE_DIR + '/' + file))
}

const manifest = {
  schema: 'IMMORTAL-P2.8-B.1-ledger-evidence-v0.1',
  status: 'raw-yaci-context-materialized',
  network: 'local-yaci-devnet',
  era: 'Babbage',
  transaction_hash: txHash,
  inputs: transition.consumedUtxos ?? [],
  acquisition_source: {
    yaci_store_api: API,
    transaction_utxos_endpoint: API + '/txs/' + txHash + '/utxos',
    protocol_parameters_file: 'reveal-protocol-parameters.json',
    timing_file: 'yaci-devkit-info.txt',
    epoch_file: 'epoch-latest.json',
  },
  acquired_at: new Date().toISOString(),
  script_artifacts: transition.artifactHashes ?? null,
  sha256: hashes,
  materialization: {
    transaction: 'copied byte-for-byte from reveal-tx.cbor',
    protocol_parameters: 'copied byte-for-byte from reveal-protocol-parameters.json',
    utxo: 'fetched directly from Yaci Store for transactionRef; consumed input references cross-checked against Reveal trace',
    epoch_info: 'raw Yaci epoch/timing provenance only; not yet a typed EpochInfo',
    system_start: 'raw Yaci timing provenance only; not yet a typed SystemStart',
  },
  policy: {
    synthetic_context: false,
    typed_context_ready: false,
    evaluator_may_run: false,
  },
}

await writeFile(EVIDENCE_DIR + '/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({
  status: manifest.status,
  transactionRef: txHash,
  files,
  typedContextReady: false,
}, null, 2))
