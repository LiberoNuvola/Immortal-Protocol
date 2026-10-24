import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import WebSocket from 'ws'

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
  if (typeof address !== 'string' || address.length === 0) throw new Error('Yaci input address is missing')
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) throw new Error('Yaci input address has mixed Bech32 case')

  const clean = address.toLowerCase()
  if (/^[0-9a-f]+$/.test(clean) && clean.length % 2 === 0) return clean
  if (clean.length > 200) throw new Error('Yaci input address exceeds supported Cardano Bech32 envelope size')

  const separator = clean.lastIndexOf('1')
  if (separator <= 0 || separator + 7 > clean.length) throw new Error('Yaci input address is not valid Bech32')

  const hrp = clean.slice(0, separator)
  const encoded = clean.slice(separator + 1)
  const values = []
  for (const char of encoded) {
    const value = BECH32_INDEX.get(char)
    if (value === undefined) throw new Error('Yaci input address contains invalid Bech32 character')
    values.push(value)
  }

  const hrpBytes = [...new TextEncoder().encode(hrp)]
  const hrpExpanded = [...hrpBytes.map(byte => byte >> 5), 0, ...hrpBytes.map(byte => byte & 31)]
  if (bech32Polymod([...hrpExpanded, ...values]) !== 1n) throw new Error('Yaci input address has invalid Bech32 checksum')
  if (hrp !== 'addr' && hrp !== 'addr_test') throw new Error('Yaci input address has unsupported Cardano address HRP')

  const payload = values.slice(0, -6)
  const bytes = convertBits(payload, 5, 8, false)
  if (bytes.length === 0) throw new Error('Yaci input address decodes to empty bytes')
  return Buffer.from(bytes).toString('hex')
}

const transition = await readJson(EVIDENCE_DIR + '/reveal-transition.json')
const txHash = transition.transactionRef
if (typeof txHash !== 'string' || !/^[0-9a-f]{64}$/i.test(txHash)) throw new Error('Reveal transition packet has invalid transactionRef')
if (!Array.isArray(transition.consumedUtxos) || transition.consumedUtxos.length === 0) throw new Error('Reveal transition lacks consumed input references')
if (new Set(transition.consumedUtxos).size !== transition.consumedUtxos.length ||
    transition.consumedUtxos.some((ref) => typeof ref !== 'string' || !/^[0-9a-f]{64}#[0-9]+$/i.test(ref))) {
  throw new Error('Reveal consumed input references are malformed or duplicated')
}

const txCbor = await requireFile(EVIDENCE_DIR + '/reveal-tx.cbor')
if (typeof transition.txCbor !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(transition.txCbor)) {
  throw new Error('Reveal transition packet lacks valid transaction CBOR hex')
}
if (!Buffer.from(transition.txCbor, 'hex').equals(txCbor)) {
  throw new Error('Reveal transition txCbor does not match reveal-tx.cbor byte-for-byte')
}
const pparams = await requireFile(EVIDENCE_DIR + '/reveal-protocol-parameters.json')
const pparamsJson = JSON.parse(pparams.toString('utf8'))

// Lucid's normalized Yaci response omits protocolVersion.major on this provider
// (the cost-model arrays are still present). Qualify the era from Yaci's raw,
// Blockfrost-compatible endpoint rather than guessing or hardcoding PV11.
const rawPparamsResponse = await fetch(API + '/epochs/latest/parameters')
if (!rawPparamsResponse.ok) {
  throw new Error('Yaci /epochs/latest/parameters failed: HTTP ' + rawPparamsResponse.status)
}
const rawPparams = await rawPparamsResponse.json()
const protocolMajor = Number(rawPparams?.protocol_major_ver)
const protocolMinor = Number(rawPparams?.protocol_minor_ver)
if (!Number.isInteger(protocolMajor) || protocolMajor !== 11) {
  throw new Error('P2.8 currently requires Conway/PV11; raw Yaci protocol_major_ver=' + String(rawPparams?.protocol_major_ver))
}
if (!Number.isInteger(protocolMinor) || protocolMinor < 0) {
  throw new Error('Yaci raw protocol_minor_ver is missing or invalid: ' + String(rawPparams?.protocol_minor_ver))
}
const integerParameter = (field) => {
  const value = rawPparams?.[field]
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && /^\d+$/.test(value)
      ? Number(value)
      : NaN
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error('Yaci raw protocol parameter is missing or invalid: ' + field + '=' + String(value))
  }
  return parsed
}
const numericParameter = (field) => {
  const value = rawPparams?.[field]
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : NaN
  if (!Number.isFinite(parsed)) {
    throw new Error('Yaci raw numeric protocol parameter is missing or invalid: ' + field + '=' + String(value))
  }
  return parsed
}
const unitIntervalParameter = (field) => {
  const value = numericParameter(field)
  if (value < 0 || value > 1) {
    throw new Error('Yaci raw unit interval is outside [0,1]: ' + field + '=' + String(value))
  }
  return value
}

const ledgerCostModels = {}
for (const model of ['PlutusV1', 'PlutusV2', 'PlutusV3']) {
  const normalized = pparamsJson?.costModels?.[model]
  const raw = rawPparams?.cost_models_raw?.[model]
  if (!Array.isArray(normalized) || !Array.isArray(raw) || normalized.length !== raw.length) {
    throw new Error('Yaci/Lucid cost-model shape mismatch for ' + model +
      ': normalized=' + String(Array.isArray(normalized) ? normalized.length : 'missing') +
      ', raw=' + String(Array.isArray(raw) ? raw.length : 'missing'))
  }
  if (raw.some((value) => !Number.isSafeInteger(value)) ||
      JSON.stringify(normalized) !== JSON.stringify(raw)) {
    throw new Error('Yaci/Lucid cost-model values do not match exactly for ' + model)
  }
  ledgerCostModels[model] = raw
}

const pvtSecurityGroup = unitIntervalParameter('pvtpp_security_group')
if (rawPparams.pvt_p_p_security_group !== undefined &&
    unitIntervalParameter('pvt_p_p_security_group') !== pvtSecurityGroup) {
  throw new Error('Yaci pool security-group parameter aliases disagree')
}

// Canonical Cardano Ledger Conway PParams JSON. Every scalar is mapped from the
// same raw Yaci response; no defaults or inferred economic/ledger values are used.
const ledgerPparams = {
  txFeePerByte: integerParameter('min_fee_a'),
  txFeeFixed: integerParameter('min_fee_b'),
  maxBlockBodySize: integerParameter('max_block_size'),
  maxTxSize: integerParameter('max_tx_size'),
  maxBlockHeaderSize: integerParameter('max_block_header_size'),
  stakeAddressDeposit: integerParameter('key_deposit'),
  stakePoolDeposit: integerParameter('pool_deposit'),
  poolRetireMaxEpoch: integerParameter('e_max'),
  stakePoolTargetNum: integerParameter('n_opt'),
  poolPledgeInfluence: numericParameter('a0'),
  monetaryExpansion: unitIntervalParameter('rho'),
  treasuryCut: unitIntervalParameter('tau'),
  protocolVersion: { major: protocolMajor, minor: protocolMinor },
  minPoolCost: integerParameter('min_pool_cost'),
  utxoCostPerByte: integerParameter('coins_per_utxo_size'),
  costModels: ledgerCostModels,
  executionUnitPrices: {
    priceMemory: numericParameter('price_mem'),
    priceSteps: numericParameter('price_step'),
  },
  maxTxExecutionUnits: {
    memory: integerParameter('max_tx_ex_mem'),
    steps: integerParameter('max_tx_ex_steps'),
  },
  maxBlockExecutionUnits: {
    memory: integerParameter('max_block_ex_mem'),
    steps: integerParameter('max_block_ex_steps'),
  },
  maxValueSize: integerParameter('max_val_size'),
  collateralPercentage: integerParameter('collateral_percent'),
  maxCollateralInputs: integerParameter('max_collateral_inputs'),
  poolVotingThresholds: {
    motionNoConfidence: unitIntervalParameter('pvt_motion_no_confidence'),
    committeeNormal: unitIntervalParameter('pvt_committee_normal'),
    committeeNoConfidence: unitIntervalParameter('pvt_committee_no_confidence'),
    hardForkInitiation: unitIntervalParameter('pvt_hard_fork_initiation'),
    ppSecurityGroup: pvtSecurityGroup,
  },
  dRepVotingThresholds: {
    motionNoConfidence: unitIntervalParameter('dvt_motion_no_confidence'),
    committeeNormal: unitIntervalParameter('dvt_committee_normal'),
    committeeNoConfidence: unitIntervalParameter('dvt_committee_no_confidence'),
    updateToConstitution: unitIntervalParameter('dvt_update_to_constitution'),
    hardForkInitiation: unitIntervalParameter('dvt_hard_fork_initiation'),
    ppNetworkGroup: unitIntervalParameter('dvt_ppnetwork_group'),
    ppEconomicGroup: unitIntervalParameter('dvt_ppeconomic_group'),
    ppTechnicalGroup: unitIntervalParameter('dvt_pptechnical_group'),
    ppGovGroup: unitIntervalParameter('dvt_ppgov_group'),
    treasuryWithdrawal: unitIntervalParameter('dvt_treasury_withdrawal'),
  },
  committeeMinSize: integerParameter('committee_min_size'),
  committeeMaxTermLength: integerParameter('committee_max_term_length'),
  govActionLifetime: integerParameter('gov_action_lifetime'),
  govActionDeposit: integerParameter('gov_action_deposit'),
  dRepDeposit: integerParameter('drep_deposit'),
  dRepActivity: integerParameter('drep_activity'),
  minFeeRefScriptCostPerByte: numericParameter('min_fee_ref_script_cost_per_byte'),
}
await writeFile(EVIDENCE_DIR + '/protocol-parameters-raw.json', JSON.stringify(rawPparams, null, 2) + '\n')
const epochLatest = await requireFile(EVIDENCE_DIR + '/epoch-latest.json')
const epochLatestJson = JSON.parse(epochLatest.toString('utf8'))
const yaciInfo = (await requireFile(EVIDENCE_DIR + '/yaci-devkit-info.txt')).toString('utf8')

// Yaci Store 0.12.0-beta5 does not implement Blockfrost-compatible GET /genesis.
// Obtain timing and era parameters from the same local devnet's Ogmios ledger queries;
// do not synthesize genesis values or infer them from wall-clock time.
const OGMIOS_WS = process.env.YACI_OGMIOS_WS ?? 'ws://127.0.0.1:1337'
const ogmios = new WebSocket(OGMIOS_WS)
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Ogmios WebSocket open timeout: ' + OGMIOS_WS)), 15000)
  ogmios.once('open', () => { clearTimeout(timer); resolve() })
  ogmios.once('error', error => { clearTimeout(timer); reject(error) })
})
let ogmiosRpcId = 1
const pendingOgmios = new Map()
function ogmiosRpc(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = 'immortal-p28-' + ogmiosRpcId++
    const timer = setTimeout(() => {
      pendingOgmios.delete(id)
      reject(new Error('Ogmios RPC timeout: ' + method))
    }, 15000)
    pendingOgmios.set(id, { resolve, reject, timer, method })
    ogmios.send(JSON.stringify({ jsonrpc: '2.0', method, params, id }))
  })
}
ogmios.on('message', raw => {
  let response
  try { response = JSON.parse(raw.toString()) } catch { return }
  if (!response.id || !pendingOgmios.has(response.id)) return
  const item = pendingOgmios.get(response.id)
  pendingOgmios.delete(response.id)
  clearTimeout(item.timer)
  if (response.error) item.reject(new Error('Ogmios ' + item.method + ': ' + JSON.stringify(response.error)))
  else item.resolve(response.result)
})
let ogmiosStartTime
let ogmiosEraSummaries
try {
  ;[ogmiosStartTime, ogmiosEraSummaries] = await Promise.all([
    ogmiosRpc('queryNetwork/startTime'),
    ogmiosRpc('queryLedgerState/eraSummaries'),
  ])
} finally {
  ogmios.close()
}
const systemStartMs = Date.parse(String(ogmiosStartTime))
if (!Number.isFinite(systemStartMs) || systemStartMs <= 0) {
  throw new Error('Ogmios queryNetwork/startTime returned an invalid timestamp: ' + String(ogmiosStartTime))
}
const latestEpochNumber = Number(epochLatestJson.epoch ?? epochLatestJson.epoch_no)
if (!Number.isSafeInteger(latestEpochNumber) || latestEpochNumber < 0 || !Array.isArray(ogmiosEraSummaries)) {
  throw new Error('Cannot qualify current epoch against Ogmios era summaries')
}
const activeEra = ogmiosEraSummaries.find(item => {
  const startEpoch = Number(item.start?.epoch ?? 0)
  const endEpoch = item.end?.epoch == null ? null : Number(item.end.epoch)
  return latestEpochNumber >= startEpoch && (endEpoch == null || latestEpochNumber < endEpoch)
})
if (!activeEra) throw new Error('Ogmios era summary missing for current Yaci epoch ' + latestEpochNumber)
const epochLength = Number(activeEra.parameters?.epochLength)
const slotLengthSeconds = Number(activeEra.parameters?.slotLength?.milliseconds) / 1000
if (!Number.isSafeInteger(epochLength) || epochLength <= 0) throw new Error('Ogmios epochLength invalid')
if (!Number.isFinite(slotLengthSeconds) || slotLengthSeconds <= 0) throw new Error('Ogmios slotLength invalid')
const genesis = {
  system_start: Math.floor(systemStartMs / 1000),
  epoch_length: epochLength,
  slot_length: slotLengthSeconds,
}
for (const field of ['system_start', 'epoch_length', 'slot_length']) {
  if (!Number.isSafeInteger(genesis[field]) || genesis[field] <= 0) {
    throw new Error('Ogmios-derived genesis field is invalid: ' + field + '=' + String(genesis[field]))
  }
}
const genesisResponse = {
  source: 'Ogmios queryNetwork/startTime + queryLedgerState/eraSummaries on local Yaci devnet',
  startTime: String(ogmiosStartTime),
  currentEpoch: latestEpochNumber,
  activeEra,
  values: genesis,
}

const utxoResponse = await fetch(API + '/txs/' + txHash + '/utxos')
if (!utxoResponse.ok) throw new Error('Yaci /txs/{hash}/utxos failed: HTTP ' + utxoResponse.status)
const utxos = await utxoResponse.json()
const transactionMetadataResponse = await fetch(API + '/txs/' + txHash)
if (!transactionMetadataResponse.ok) {
  throw new Error('Yaci transaction metadata lookup failed: HTTP ' + transactionMetadataResponse.status)
}
const transactionMetadataRaw = await transactionMetadataResponse.text()
const transactionMetadata = JSON.parse(transactionMetadataRaw)
if (typeof transactionMetadata.hash !== 'string' ||
    transactionMetadata.hash.toLowerCase() !== txHash.toLowerCase()) {
  throw new Error('Yaci transaction metadata hash does not match Reveal transactionRef')
}
const transactionSlot = transactionMetadata.slot
const transactionBlockHeight = transactionMetadata.block_height
if (!Number.isSafeInteger(transactionSlot) || transactionSlot < 0) {
  throw new Error('Yaci transaction metadata lacks a valid absolute slot')
}
if (!Number.isSafeInteger(transactionBlockHeight) || transactionBlockHeight < 0) {
  throw new Error('Yaci transaction metadata lacks a valid block height')
}

const blockResponse = await fetch(API + '/blocks/' + transactionBlockHeight)
if (!blockResponse.ok) {
  throw new Error('Yaci block metadata lookup failed: HTTP ' + blockResponse.status)
}
const blockMetadataRaw = await blockResponse.text()
const blockMetadata = JSON.parse(blockMetadataRaw)
if (typeof blockMetadata.hash !== 'string' || !/^[0-9a-f]{64}$/i.test(blockMetadata.hash)) {
  throw new Error('Yaci block metadata lacks a valid block hash')
}
if (!Number.isSafeInteger(blockMetadata.number) || blockMetadata.number !== transactionBlockHeight ||
    !Number.isSafeInteger(blockMetadata.height) || blockMetadata.height !== transactionBlockHeight) {
  throw new Error('Yaci transaction/block height binding mismatch')
}
if (!Number.isSafeInteger(blockMetadata.slot) || blockMetadata.slot !== transactionSlot) {
  throw new Error('Yaci transaction/block absolute slot binding mismatch')
}
if (!Number.isSafeInteger(blockMetadata.time) || blockMetadata.time <= 0) {
  throw new Error('Yaci block metadata lacks a valid Unix timestamp in seconds')
}

const requiredGithubBinding = (name) => {
  const value = process.env[name]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Missing GitHub workflow provenance field: ' + name)
  }
  return value
}
const workflowBinding = {
  repository: requiredGithubBinding('GITHUB_REPOSITORY'),
  workflow: requiredGithubBinding('GITHUB_WORKFLOW'),
  ref: requiredGithubBinding('GITHUB_REF'),
  commit_sha: requiredGithubBinding('GITHUB_SHA'),
  run_id: requiredGithubBinding('GITHUB_RUN_ID'),
  run_attempt: requiredGithubBinding('GITHUB_RUN_ATTEMPT'),
}
if (!/^[0-9a-f]{40}$/i.test(workflowBinding.commit_sha)) {
  throw new Error('Invalid GitHub workflow commit SHA')
}
if (!/^[1-9][0-9]*$/.test(workflowBinding.run_id) ||
    !/^[1-9][0-9]*$/.test(workflowBinding.run_attempt)) {
  throw new Error('Invalid GitHub workflow run ID/attempt')
}

await writeFile(EVIDENCE_DIR + '/transaction-metadata.json', transactionMetadataRaw)
await writeFile(EVIDENCE_DIR + '/block-metadata.json', blockMetadataRaw)

const acquiredAt = new Date().toISOString()
const transactionObservation = {
  transaction_hash: txHash.toLowerCase(),
  slot: transactionSlot,
  block_height: transactionBlockHeight,
  block_number: blockMetadata.number,
  block_slot: blockMetadata.slot,
  block_hash: blockMetadata.hash.toLowerCase(),
  block_time_unix_seconds: blockMetadata.time,
  block_time_iso: new Date(blockMetadata.time * 1000).toISOString(),
  observed_at: acquiredAt,
  source: {
    transaction_endpoint: API + '/txs/' + txHash,
    block_endpoint: API + '/blocks/' + transactionBlockHeight,
  },
}

if (!Array.isArray(utxos.inputs) || utxos.inputs.length === 0) throw new Error('Yaci transaction UTxO response lacks consumed inputs')

const economicInputs = utxos.inputs.filter((input) => input.collateral !== true && input.reference !== true)
const observedRefs = economicInputs.map((input) => {
  if (typeof input.tx_hash !== 'string' || !Number.isSafeInteger(input.output_index)) throw new Error('Yaci consumed input lacks tx_hash/output_index')
  return input.tx_hash.toLowerCase() + '#' + input.output_index
})
const expectedRefs = transition.consumedUtxos.map((ref) => ref.toLowerCase())
if (new Set(observedRefs).size !== observedRefs.length ||
    expectedRefs.some((ref) => !observedRefs.includes(ref))) {
  const classify = (input) => ({
    ref: typeof input.tx_hash === 'string' && Number.isSafeInteger(input.output_index)
      ? input.tx_hash.toLowerCase() + '#' + input.output_index
      : null,
    collateral: input.collateral === true,
    reference: input.reference === true,
    addressPresent: typeof input.address === 'string',
  })
  throw new Error('Yaci consumed input set does not contain the exact Reveal transition inputs: ' +
    JSON.stringify({
      expectedRefs,
      observedRefs,
      rawInputs: utxos.inputs.map(classify),
      counts: { expected: expectedRefs.length, observedEconomic: observedRefs.length, raw: utxos.inputs.length },
    }))
}

// The transition packet records the two economic script inputs. The submitted
// transaction may also consume wallet UTxOs for fees/change. Keep those real
// inputs in the ledger context, but fail closed if any unrecorded extra input
// is itself a script address (which could hide an additional script transition).
const expectedRefSet = new Set(expectedRefs)
const extraEconomicInputs = economicInputs.filter((input, index) => !expectedRefSet.has(observedRefs[index]))
const scriptAddressTypes = new Set([1, 3, 5, 7])
const unexpectedScriptInputs = extraEconomicInputs.filter((input) => {
  if (typeof input.address !== 'string') return true
  const addressHex = cardanoAddressToLedgerHex(input.address)
  if (addressHex.length < 2) return true
  const addressType = Number.parseInt(addressHex.slice(0, 2), 16) >> 4
  return scriptAddressTypes.has(addressType)
})
if (unexpectedScriptInputs.length > 0) {
  throw new Error('Reveal transaction contains unrecorded additional script inputs: ' +
    JSON.stringify(unexpectedScriptInputs.map((input) => ({
      tx_hash: input.tx_hash,
      output_index: input.output_index,
      address: input.address,
    }))))
}

const referenceInputs = utxos.inputs.filter((input) => input.reference === true)
const referenceUtxoDetails = await Promise.all(referenceInputs.map(async (input) => {
  if (typeof input.tx_hash !== 'string' || !Number.isSafeInteger(input.output_index)) {
    throw new Error('Yaci reference input lacks exact tx_hash/output_index')
  }
  const ref = input.tx_hash.toLowerCase() + '#' + input.output_index
  const response = await fetch(API + '/utxos/' + input.tx_hash + '/' + input.output_index)
  if (!response.ok) throw new Error('Yaci exact reference UTxO lookup failed for ' + ref + ': HTTP ' + response.status)
  const detail = await response.json()
  if (typeof detail.tx_hash !== 'string' || detail.tx_hash.toLowerCase() !== input.tx_hash.toLowerCase() ||
      detail.output_index !== input.output_index) {
    throw new Error('Yaci exact reference UTxO identity mismatch for ' + ref)
  }
  if (typeof detail.script_ref !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(detail.script_ref)) {
    throw new Error('Yaci exact reference UTxO lacks valid serialized script_ref bytes for ' + ref)
  }
  if (typeof detail.reference_script_hash !== 'string' ||
      typeof input.reference_script_hash !== 'string' ||
      detail.reference_script_hash.toLowerCase() !== input.reference_script_hash.toLowerCase()) {
    throw new Error('Yaci exact reference UTxO script hash mismatch for ' + ref)
  }
  return {
    ref,
    endpoint: API + '/utxos/' + input.tx_hash + '/' + input.output_index,
    script_ref_sha256: sha256(Buffer.from(detail.script_ref, 'hex')),
    reference_script_hash: detail.reference_script_hash.toLowerCase(),
    script_ref: detail.script_ref.toLowerCase(),
  }
}))
const referenceDetailByRef = new Map(referenceUtxoDetails.map((detail) => [detail.ref, detail]))
const observedWithLedgerAddresses = {
  ...utxos,
  inputs: utxos.inputs.map((input) => {
    if (typeof input.address !== 'string') throw new Error('Yaci consumed/reference input lacks address')
    const ref = typeof input.tx_hash === 'string' && Number.isSafeInteger(input.output_index)
      ? input.tx_hash.toLowerCase() + '#' + input.output_index
      : null
    const referenceDetail = input.reference === true ? referenceDetailByRef.get(ref) : null
    if (input.reference === true && !referenceDetail) throw new Error('Exact reference script evidence missing for ' + String(ref))
    return {
      ...input,
      ...(referenceDetail ? { script_ref: referenceDetail.script_ref } : {}),
      ledger_address_hex: cardanoAddressToLedgerHex(input.address),
    }
  }),
}

await writeFile(EVIDENCE_DIR + '/tx.cbor', txCbor)
await writeFile(EVIDENCE_DIR + '/pparams.json', JSON.stringify(ledgerPparams, null, 2) + '\n')

await writeFile(
  EVIDENCE_DIR + '/utxo.json',
  JSON.stringify({
    schema: 'IMMORTAL-P2.8-YACI-UTXO-RAW-v0.2-CONWAY',
    transactionRef: txHash,
    source: {
      apiBase: API,
      endpoint: '/txs/' + txHash + '/utxos',
      kind: 'Yaci Store Blockfrost-compatible transaction UTxO response',
    },
    consumedUtxos: transition.consumedUtxos,
    observed: observedWithLedgerAddresses,
  }, null, 2) + '\n',
)

await writeFile(
  EVIDENCE_DIR + '/epoch-info.json',
  JSON.stringify({
    schema: 'IMMORTAL-P2.8-OGMIOS-EPOCH-v0.1',
    targetEpoch: latestEpochNumber,
    targetAbsoluteSlot: null,
    targetEra: String(activeEra.parameters?.era ?? 'Conway'),
    epochLength,
    slotLengthSeconds,
    targetEraSummary: activeEra,
    source: {
      endpoint: 'Ogmios queryLedgerState/eraSummaries',
      apiBase: OGMIOS_WS,
      yaciEpochEndpoint: API + '/epochs/latest',
    },
    latestEpochResponse: JSON.parse(epochLatest.toString('utf8')),
    genesisResponse,
    yaciDevkitInfo: yaciInfo,
    sourceOfTruth: 'Ogmios era summary matched to current epoch returned by Yaci Store',
  }, null, 2) + '\n',
)

await writeFile(
  EVIDENCE_DIR + '/system-start.json',
  JSON.stringify({
    schema: 'IMMORTAL-P2.8-OGMIOS-SYSTEM-START-v0.1',
    source: {
      endpoint: 'Ogmios queryNetwork/startTime',
      apiBase: OGMIOS_WS,
      yaciDevkitInfo: 'yaci-devkit-info.txt',
    },
    startTimeRaw: String(ogmiosStartTime),
    genesisSystemStart: genesis.system_start,
    rawInfo: yaciInfo,
  }, null, 2) + '\n',
)

const files = ['tx.cbor', 'reveal-transition.json', 'utxo.json', 'transaction-metadata.json', 'block-metadata.json', 'pparams.json', 'protocol-parameters-raw.json', 'epoch-info.json', 'system-start.json']
const hashes = {}
for (const file of files) hashes[file] = sha256(await readFile(EVIDENCE_DIR + '/' + file))

const manifest = {
  schema: 'IMMORTAL-P2.8-B.2-CONWAY-ledger-evidence-v0.2',
  status: 'raw-yaci-context-materialized',
  network: 'local-yaci-devnet',
  era: 'Conway',
  protocol_version_major: protocolMajor,
  transaction_hash: txHash,
  inputs: transition.consumedUtxos,
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
    protocol_parameters_raw_endpoint: API + '/epochs/latest/parameters',
    timing_source: OGMIOS_WS,
    protocol_parameters_raw_file: 'protocol-parameters-raw.json',
    timing_file: 'yaci-devkit-info.txt',
    epoch_file: 'epoch-latest.json',
  },
  acquired_at: acquiredAt,
  workflow_binding: workflowBinding,
  transaction_observation: transactionObservation,
  script_artifacts: transition.artifactHashes ?? null,
  reference_script_utxos: referenceUtxoDetails.map(({ ref, endpoint, script_ref_sha256, reference_script_hash }) => ({
    ref, endpoint, script_ref_sha256, reference_script_hash,
  })),
  sha256: hashes,
  materialization: {
    transaction: 'copied byte-for-byte from reveal-tx.cbor',
    reference_scripts: 'each exact reference input is fetched from Yaci /utxos/{txHash}/{index}; serialized script_ref bytes and reference_script_hash are bound into utxo.json and the manifest',
    protocol_parameters: 'canonical Conway PParams JSON mapped from raw Yaci protocol fields; Plutus cost-model arrays matched exactly against Lucid observation',
    protocol_parameters_raw: 'fetched directly from Yaci /epochs/latest/parameters; protocol_major_ver is the authoritative PV11 gate',
    utxo: 'fetched directly from Yaci Store for transactionRef; consumed input references cross-checked against Reveal trace',
    epoch_info: 'raw Yaci epoch/timing provenance; typed EpochInfo is constructed by the native runner',
    system_start: 'raw Yaci genesis timing provenance; typed SystemStart is constructed by the native runner',
  },
  policy: {
    synthetic_context: false,
    typed_context_ready: false,
    evaluator_may_run: true,
  },
}

await writeFile(EVIDENCE_DIR + '/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({
  status: manifest.status,
  transactionRef: txHash,
  files,
  typedContextReady: false,
  evaluatorMayRun: true,
}, null, 2))
