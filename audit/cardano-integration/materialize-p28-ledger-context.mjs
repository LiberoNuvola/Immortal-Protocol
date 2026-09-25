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
  const match = text.match(new RegExp('^\\s*' + label + '\\s*:\\s*(.+)$', 'im'))
  return match?.[1]?.trim() ?? null
}

function extractInfoNumber(text, label) {
  const raw = extractInfoValue(text, label)
  if (raw === null || !/^-?\\d+(?:\\.\\d+)?$/.test(raw)) return null
  return raw
}

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_INDEX = new Map([...BECH32_CHARSET].map((char, index) => [char, index]))

function bech32Polymod(values) {
  const generators = [0x3b6a57b2n, 0x26508e6dn, 0x1ea119fan, 0x3d4233ddn, 0x2a1462b3n]
  let chk = 1n
  for (const value of values) {
    const top = chk >> 25n
    chk = ((chk & 0x1ffffffn) << 5n) ^ BigInt(value)
    for (let bit = 0n; bit < 5n; bit += 1n) {
      if ((top & (1n << bit)) !== 0n) chk ^= generators[Number(bit)]
    }
  }
  return chk
}

function convertBits(values, fromBits, toBits, pad) {
  let acc = 0
  let bits = 0
  const maxv = (1 << toBits) - 1
  const maxAccBits = fromBits + toBits - 1
  const maxAcc = (1 << maxAccBits) - 1
  const result = []

  for (const value of values) {
    if (value < 0 || value >> fromBits !== 0) throw new Error('invalid bech32 data value')
    acc = ((acc << fromBits) | value) & maxAcc
    bits += fromBits
    while (bits >= toBits) {
      bits -= toBits
      result.push((acc >> bits) & maxv)
    }
  }

  if (pad) {
    if (bits > 0) result.push((acc << (toBits - bits)) & maxv)
  } else {
    if (bits >= fromBits) throw new Error('invalid bech32 padding')
    if (((acc << (toBits - bits)) & maxv) !== 0) throw new Error('non-zero bech32 padding')
  }

  return result
}

function cardanoAddressToLedgerHex(address) {
  if (typeof address !== 'string' || address.length === 0) {
    throw new Error('Yaci input address is missing')
  }

  if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
    throw new Error('Yaci input address has mixed Bech32 case')
  }

  const clean = address.toLowerCase()

  if (/^[0-9a-f]+$/.test(clean) && clean.length % 2 === 0) {
    return clean
  }

  if (clean.length > 200) {
    throw new Error('Yaci input address exceeds supported Cardano Bech32 envelope size')
  }

  const separator = clean.lastIndexOf('1')
  if (separator <= 0 || separator + 7 > clean.length) {
    throw new Error('Yaci input address is not valid Bech32')
  }

  const hrp = clean.slice(0, separator)
  const encoded = clean.slice(separator + 1)
  const values = []
  for (const char of encoded) {
    const value = BECH32_INDEX.get(char)
    if (value === undefined) throw new Error('Yaci input address contains invalid Bech32 character')
    values.push(value)
  }

  const hrpBytes = [...new TextEncoder().encode(hrp)]
  const hrpExpanded = [
    ...hrpBytes.map(byte => byte >> 5),
    0,
    ...hrpBytes.map(byte => byte & 31),
  ]

  if (bech32Polymod([
    ...hrpExpanded,
    ...values,
  ]) !== 1n) {
    throw new Error('Yaci input address has invalid Bech32 checksum')
  }

  if (hrp !== 'addr' && hrp !== 'addr_test') {
    throw new Error('Yaci input address has unsupported Cardano address HRP')
  }

  const payload = values.slice(0, -6)
  const bytes = convertBits(payload, 5, 8, false)
  if (bytes.length === 0) throw new Error('Yaci input address decodes to empty bytes')

  return Buffer.from(bytes).toString('hex')
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
const economicInputs = utxos.inputs.filter(
  (input) => input.collateral !== true && input.reference !== true,
)
const observedRefs = economicInputs.map((input) => {
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

const observedWithLedgerAddresses = {
  ...utxos,
  inputs: utxos.inputs.map((input) => {
    if (typeof input.address !== 'string') {
      throw new Error('Yaci consumed input lacks address')
    }
    return {
      ...input,
      ledger_address_hex: cardanoAddressToLedgerHex(input.address),
    }
  }),
}
const timing = {
  startTimeRaw: extractInfoValue(yaciInfo, 'Start Time'),
  slotLengthRaw: extractInfoNumber(yaciInfo, 'Slot Length'),
  epochLengthRaw: extractInfoNumber(yaciInfo, 'Epoch Length'),
}
if (Object.values(timing).some((value) => value === null)) {
  throw new Error('Yaci timing provenance is incomplete; refusing to materialize packet')
}
if (Number.isNaN(Date.parse(timing.startTimeRaw))) {
  throw new Error('Yaci Start Time is not a parseable ISO-8601 timestamp')
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
    observed: observedWithLedgerAddresses,
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
  input_classification: {
    total_inputs: utxos.inputs.length,
    economic_inputs: economicInputs.length,
    collateral_inputs: utxos.inputs.filter((input) => input.collateral === true).length,
    reference_inputs: utxos.inputs.filter((input) => input.reference === true).length,
  },
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
, 'im'))
  return match?.[1]?.trim() ?? null
}

function extractInfoNumber(text, label) {
  const raw = extractInfoValue(text, label)
  if (raw === null || !/^-?\\d+(?:\\.\\d+)?$/.test(raw)) return null
  return raw
}

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_INDEX = new Map([...BECH32_CHARSET].map((char, index) => [char, index]))

function bech32Polymod(values) {
  const generators = [0x3b6a57b2n, 0x26508e6dn, 0x1ea119fan, 0x3d4233ddn, 0x2a1462b3n]
  let chk = 1n
  for (const value of values) {
    const top = chk >> 25n
    chk = ((chk & 0x1ffffffn) << 5n) ^ BigInt(value)
    for (let bit = 0n; bit < 5n; bit += 1n) {
      if ((top & (1n << bit)) !== 0n) chk ^= generators[Number(bit)]
    }
  }
  return chk
}

function convertBits(values, fromBits, toBits, pad) {
  let acc = 0
  let bits = 0
  const maxv = (1 << toBits) - 1
  const maxAccBits = fromBits + toBits - 1
  const maxAcc = (1 << maxAccBits) - 1
  const result = []

  for (const value of values) {
    if (value < 0 || value >> fromBits !== 0) throw new Error('invalid bech32 data value')
    acc = ((acc << fromBits) | value) & maxAcc
    bits += fromBits
    while (bits >= toBits) {
      bits -= toBits
      result.push((acc >> bits) & maxv)
    }
  }

  if (pad) {
    if (bits > 0) result.push((acc << (toBits - bits)) & maxv)
  } else {
    if (bits >= fromBits) throw new Error('invalid bech32 padding')
    if (((acc << (toBits - bits)) & maxv) !== 0) throw new Error('non-zero bech32 padding')
  }

  return result
}

function cardanoAddressToLedgerHex(address) {
  if (typeof address !== 'string' || address.length === 0) {
    throw new Error('Yaci input address is missing')
  }

  if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
    throw new Error('Yaci input address has mixed Bech32 case')
  }

  const clean = address.toLowerCase()

  if (/^[0-9a-f]+$/.test(clean) && clean.length % 2 === 0) {
    return clean
  }

  if (clean.length > 200) {
    throw new Error('Yaci input address exceeds supported Cardano Bech32 envelope size')
  }

  const separator = clean.lastIndexOf('1')
  if (separator <= 0 || separator + 7 > clean.length) {
    throw new Error('Yaci input address is not valid Bech32')
  }

  const hrp = clean.slice(0, separator)
  const encoded = clean.slice(separator + 1)
  const values = []
  for (const char of encoded) {
    const value = BECH32_INDEX.get(char)
    if (value === undefined) throw new Error('Yaci input address contains invalid Bech32 character')
    values.push(value)
  }

  const hrpBytes = [...new TextEncoder().encode(hrp)]
  const hrpExpanded = [
    ...hrpBytes.map(byte => byte >> 5),
    0,
    ...hrpBytes.map(byte => byte & 31),
  ]

  if (bech32Polymod([
    ...hrpExpanded,
    ...values,
  ]) !== 1n) {
    throw new Error('Yaci input address has invalid Bech32 checksum')
  }

  if (hrp !== 'addr' && hrp !== 'addr_test') {
    throw new Error('Yaci input address has unsupported Cardano address HRP')
  }

  const payload = values.slice(0, -6)
  const bytes = convertBits(payload, 5, 8, false)
  if (bytes.length === 0) throw new Error('Yaci input address decodes to empty bytes')

  return Buffer.from(bytes).toString('hex')
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

const observedWithLedgerAddresses = {
  ...utxos,
  inputs: utxos.inputs.map((input) => {
    if (typeof input.address !== 'string') {
      throw new Error('Yaci consumed input lacks address')
    }
    return {
      ...input,
      ledger_address_hex: cardanoAddressToLedgerHex(input.address),
    }
  }),
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
    observed: observedWithLedgerAddresses,
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
