import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import WebSocket from 'ws'

const txHash = process.env.PREPROD_TX_HASH?.trim()?.toLowerCase()
const evidenceDir = process.env.PREPROD_LEDGER_EVIDENCE_DIR ?? 'audit/cardano-ledger-runner/evidence'
const koios = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const ogmiosEndpoint = process.env.DEMETER_OGMIOS_URL?.trim()
const walletAddress = process.env.PREPROD_WALLET_ADDRESS?.trim()
const explicitAuthenticatedEndpoint = process.env.DEMETER_OGMIOS_AUTHENTICATED_URL?.trim()
const credentials = [
  ['DEMETER_API_KEY_PRIMARY', process.env.DEMETER_API_KEY_PRIMARY?.trim()],
  ['DEMETER_API_KEY_ALIAS', process.env.DEMETER_API_KEY_ALIAS?.trim()],
  ['DEMETER_API_KEY', process.env.DEMETER_API_KEY?.trim()],
].filter(([, value], index, all) => value && all.findIndex(([, candidate]) => candidate === value) === index)

if (!txHash || !/^[0-9a-f]{64}$/.test(txHash)) throw new Error('PREPROD_TX_HASH must be a 64-hex transaction hash')
if (!ogmiosEndpoint) throw new Error('DEMETER_OGMIOS_URL is required')
if (!credentials.length) throw new Error('No Demeter credential is configured')
if (!walletAddress) throw new Error('PREPROD_WALLET_ADDRESS is required')
await mkdir(evidenceDir, { recursive: true })

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const textBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n', 'utf8')

async function koiosPost(path, body) {
  const response = await fetch(koios + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`Koios ${path} failed: HTTP ${response.status}: ${text.slice(0, 1000)}`)
  try { return JSON.parse(text) } catch { throw new Error(`Koios ${path} returned non-JSON`) }
}

const txInfoList = await koiosPost('/tx_info', { _tx_hashes: [txHash] })
if (!Array.isArray(txInfoList) || txInfoList.length !== 1) throw new Error('KOIOS_TX_INFO_NOT_FOUND')
const txInfo = txInfoList[0]
if (String(txInfo.tx_hash).toLowerCase() !== txHash) throw new Error('KOIOS_TX_HASH_MISMATCH')
const txEpoch = Number(txInfo.epoch_no)
const absoluteSlot = BigInt(String(txInfo.absolute_slot))
if (!Number.isSafeInteger(txEpoch) || txEpoch < 0) throw new Error('KOIOS_TX_EPOCH_INVALID')

const cborList = await koiosPost('/tx_cbor', { _tx_hashes: [txHash] })
if (!Array.isArray(cborList) || cborList.length !== 1 || String(cborList[0].tx_hash).toLowerCase() !== txHash) {
  throw new Error('KOIOS_TX_CBOR_NOT_FOUND_OR_MISMATCH')
}
const txCborHex = String(cborList[0].cbor).replace(/^0x/i, '')
if (!/^[0-9a-f]+$/i.test(txCborHex) || txCborHex.length === 0 || txCborHex.length % 2 !== 0) {
  throw new Error('KOIOS_TX_CBOR_INVALID')
}
const txCbor = Buffer.from(txCborHex, 'hex')

const economicInputs = Array.isArray(txInfo.inputs) ? txInfo.inputs : []
if (!economicInputs.length) throw new Error('KOIOS_TX_HAS_NO_SPENDING_INPUTS')
const refs = economicInputs.map(input => {
  const h = String(input.tx_hash ?? '').toLowerCase()
  const i = Number(input.tx_index)
  if (!/^[0-9a-f]{64}$/.test(h) || !Number.isSafeInteger(i) || i < 0 || i > 65535) {
    throw new Error('KOIOS_INPUT_REFERENCE_INVALID')
  }
  return `${h}#${i}`
})
if (new Set(refs).size !== refs.length) throw new Error('KOIOS_INPUT_REFERENCES_DUPLICATED')

const utxoList = await koiosPost('/utxo_info', {
  _utxo_refs: refs,
  _extended: true,
})
if (!Array.isArray(utxoList) || utxoList.length !== refs.length) throw new Error('KOIOS_UTXO_INFO_INCOMPLETE')
const returnedRefs = utxoList.map(u => String(u.tx_hash).toLowerCase() + '#' + Number(u.tx_index))
for (const ref of refs) if (!returnedRefs.includes(ref)) throw new Error('KOIOS_UTXO_SET_MISMATCH:' + ref)

const epochParamsList = await (async () => {
  const response = await fetch(koios + '/epoch_params?_epoch_no=' + txEpoch, {
    headers: { accept: 'application/json' },
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`Koios /epoch_params failed: HTTP ${response.status}: ${text.slice(0, 1000)}`)
  try { return JSON.parse(text) } catch { throw new Error('KOIOS_EPOCH_PARAMS_NON_JSON') }
})()
if (!Array.isArray(epochParamsList) || epochParamsList.length !== 1) throw new Error('KOIOS_EPOCH_PARAMS_NOT_FOUND')
const epochParams = epochParamsList[0]
if (Number(epochParams.epoch_no) !== txEpoch) throw new Error('KOIOS_EPOCH_PARAMS_EPOCH_MISMATCH')
if (String(epochParams.era) !== 'Babbage') throw new Error('PREPROD_TX_NOT_IN_BABBAGE_ERA:' + String(epochParams.era))

function amountArray(utxo) {
  const amounts = [{ unit: 'lovelace', quantity: String(utxo.value) }]
  for (const asset of Array.isArray(utxo.asset_list) ? utxo.asset_list : []) {
    const policy = String(asset.policy_id ?? '').toLowerCase()
    const name = String(asset.asset_name ?? '').toLowerCase()
    if (!/^[0-9a-f]{56}$/.test(policy) || name.length > 64 || !/^[0-9a-f]*$/.test(name)) {
      throw new Error('KOIOS_ASSET_UNIT_INVALID:' + policy + name)
    }
    amounts.push({ unit: policy + name, quantity: String(asset.quantity ?? '0') })
  }
  return amounts
}

function bech32ToHex(address) {
  const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  const index = new Map([...charset].map((c, i) => [c, i]))
  const polymod = values => {
    const generators = [0x3b6a57b2n,0x26508e6dn,0x1ea119fan,0x3d4233ddn,0x2a1462b3n]
    let chk = 1n
    for (const value of values) {
      const top = chk >> 25n
      chk = ((chk & 0x1ffffffn) << 5n) ^ BigInt(value)
      for (let bit = 0n; bit < 5; bit++) if ((top & (1n << BigInt(bit))) !== 0n) chk ^= generators[bit]
    }
    return chk
  }
  const convertBits = values => {
    let acc=0,bits=0
    const out=[]
    for(const value of values){
      acc=((acc<<5)|value)&0x7ffffff
      bits+=5
      while(bits>=8){bits-=8;out.push((acc>>bits)&255)}
    }
    if(bits>=5 || ((acc<<(8-bits))&255)!==0) throw new Error('INVALID_BECH32_PADDING')
    return out
  }
  const clean=address.toLowerCase()
  const sep=clean.lastIndexOf('1')
  if (sep<=0) throw new Error('INVALID_BECH32_ADDRESS')
  const hrp=clean.slice(0,sep)
  if(hrp!=='addr'&&hrp!=='addr_test') throw new Error('UNSUPPORTED_ADDRESS_HRP')
  const vals=[]
  for(const ch of clean.slice(sep+1)){ const v=index.get(ch); if(v===undefined) throw new Error('INVALID_BECH32_CHARACTER'); vals.push(v) }
  const hb=[...new TextEncoder().encode(hrp)]
  if(polymod([...hb.map(x=>x>>5),0,...hb.map(x=>x&31),...vals])!==1n) throw new Error('INVALID_BECH32_CHECKSUM')
  return Buffer.from(convertBits(vals.slice(0,-6))).toString('hex')
}

const normalizedInputs = utxoList.map(u => {
  if (!u.address || u.value == null) throw new Error('KOIOS_UTXO_MISSING_ADDRESS_OR_VALUE')
  if (u.reference_script) throw new Error('REFERENCE_SCRIPT_INPUT_REQUIRES_NATIVE_BODY:' + u.tx_hash + '#' + u.tx_index)
  return {
    tx_hash: String(u.tx_hash).toLowerCase(),
    output_index: Number(u.tx_index),
    address: u.address,
    ledger_address_hex: bech32ToHex(u.address),
    amount: amountArray(u),
    data_hash: u.datum_hash ?? null,
    inline_datum: u.inline_datum?.bytes ?? null,
    reference_script_hash: null,
    collateral: false,
    reference: false,
  }
})

function openOgmios() {
  return new Promise((resolve, reject) => {
    function authEndpoint(base, key) {
      if (explicitAuthenticatedEndpoint) return explicitAuthenticatedEndpoint
      const url = new URL(base)
      if (!url.hostname.endsWith('.dmtr.host') && !url.hostname.endsWith('.demeter.run')) {
        throw new Error('authenticated endpoint fallback requires Demeter hostname')
      }
      url.hostname = key + '.' + url.hostname
      return url.toString()
    }
    const headerName = 'dmtr-api-key'
    const attempts = []
    let pos = 0
    const tryNext = () => {
      if (pos >= credentials.length) return reject(new Error('DEMETERV7_AUTH_FAILED:' + attempts.join(',')))
      const [label,key] = credentials[pos++]
      const socket = new WebSocket(ogmiosEndpoint, { headers: { [headerName]: key } })
      const timer = setTimeout(() => { socket.close(); reject(new Error('OGMIOS_OPEN_TIMEOUT')) }, 30000)
      socket.once('open', () => { clearTimeout(timer); resolve({socket,label,attempts:[...attempts,label+':header=connected']}) })
      socket.once('error', error => { clearTimeout(timer); attempts.push(label+':error=' + error.message); tryNext() })
      socket.once('unexpected-response', (_req,res) => {
        clearTimeout(timer)
        attempts.push(label+':status=' + res.statusCode)
        if(res.statusCode!==401){ reject(new Error('OGMIOS_HTTP_' + res.statusCode)); return }
        try {
          const fallback=new WebSocket(authEndpoint(ogmiosEndpoint,key))
          const ft=setTimeout(()=>{fallback.close();tryNext()},30000)
          fallback.once('open',()=>{clearTimeout(ft);resolve({socket:fallback,label,attempts:[...attempts,label+':authenticated-endpoint=connected']})})
          fallback.once('error',()=>{clearTimeout(ft);tryNext()})
        } catch { tryNext() }
      })
    }
    tryNext()
  })
}

const {socket:ogmios, label:credentialLabel} = await openOgmios()
let rpcId=1
const pending=new Map()
function rpc(method,params={}){
  return new Promise((resolve,reject)=>{
    const id='immortal-p28-'+rpcId++
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('OGMIOS_RPC_TIMEOUT:'+method))},30000)
    pending.set(id,{resolve,reject,timer,method})
    ogmios.send(JSON.stringify({jsonrpc:'2.0',method,params,id}))
  })
}
ogmios.on('message',raw=>{
  const response=JSON.parse(raw.toString())
  if(!response.id||!pending.has(response.id)) return
  const item=pending.get(response.id); pending.delete(response.id); clearTimeout(item.timer)
  if(response.error) item.reject(new Error('Ogmios '+item.method+': '+JSON.stringify(response.error)))
  else item.resolve(response.result)
})
const [startTime, eraSummaries, tip] = await Promise.all([
  rpc('queryNetwork/startTime'),
  rpc('queryLedgerState/eraSummaries'),
  rpc('queryNetwork/tip'),
])
ogmios.close()

function findEra(summary, slot) {
  const eras = Array.isArray(summary) ? summary : []
  for (const item of eras) {
    const start = BigInt(String(item.start?.slot ?? item.start?.absoluteSlot ?? item.start?.time?.slot ?? 0))
    const endRaw = item.end?.slot ?? item.end?.absoluteSlot ?? item.end?.time?.slot
    const end = endRaw == null ? null : BigInt(String(endRaw))
    if (slot >= start && (end == null || slot < end)) return item
  }
  return null
}
const targetEra = findEra(eraSummaries, absoluteSlot)
if (!targetEra) throw new Error('OGMIOS_ERA_FOR_TX_SLOT_NOT_FOUND')
const targetEraName = String(targetEra.era ?? targetEra.name ?? epochParams.era)
if (targetEraName !== 'babbage' && targetEraName !== 'Babbage') throw new Error('OGMIOS_TX_ERA_MISMATCH:' + targetEraName)

const epochLength = Number(targetEra.epochLength ?? targetEra.epoch_size ?? targetEra.slotsPerEpoch)
const slotLength = Number(targetEra.slotLength ?? targetEra.slotLengthSeconds ?? targetEra.slot_length ?? 0)
if (!Number.isSafeInteger(epochLength) || epochLength <= 0) throw new Error('OGMIOS_EPOCH_LENGTH_INVALID')
if (!Number.isFinite(slotLength) || slotLength <= 0) throw new Error('OGMIOS_SLOT_LENGTH_INVALID')

const pparams = {
  txFeePerByte: epochParams.min_fee_a,
  txFeeFixed: epochParams.min_fee_b,
  maxBlockBodySize: epochParams.max_block_size,
  maxTxSize: epochParams.max_tx_size,
  maxBlockHeaderSize: epochParams.max_bh_size,
  stakeAddressDeposit: epochParams.key_deposit,
  stakePoolDeposit: epochParams.pool_deposit,
  poolRetireMaxEpoch: epochParams.max_epoch,
  stakePoolTargetNum: epochParams.optimal_pool_count,
  poolPledgeInfluence: epochParams.influence,
  monetaryExpansion: epochParams.monetary_expand_rate,
  treasuryCut: epochParams.treasury_growth_rate,
  protocolVersion: { major: epochParams.protocol_major, minor: epochParams.protocol_minor },
  minPoolCost: epochParams.min_pool_cost,
  utxoCostPerByte: Number(epochParams.coins_per_utxo_size ?? 0),
  costModels: epochParams.cost_models,
  executionUnitPrices: {
    priceMemory: epochParams.price_mem,
    priceSteps: epochParams.price_step,
  },
  maxTxExecutionUnits: { memory: epochParams.max_tx_ex_mem, steps: epochParams.max_tx_ex_steps },
  maxBlockExecutionUnits: { memory: epochParams.max_block_ex_mem, steps: epochParams.max_block_ex_steps },
  maxValueSize: epochParams.max_val_size,
  collateralPercentage: epochParams.collateral_percent,
  maxCollateralInputs: epochParams.max_collateral_inputs,
}

for(const [k,v] of Object.entries(pparams)) if(v===null||v===undefined) throw new Error('PPARAMS_MISSING:'+k)

const epochInfo = {
  schema: 'IMMORTAL-P2.8-OGMIOS-EPOCH-v0.1',
  targetEpoch: txEpoch,
  targetAbsoluteSlot: absoluteSlot.toString(),
  targetEra: 'Babbage',
  epochLength,
  slotLengthSeconds: slotLength,
  targetEraSummary: targetEra,
  acquiredFrom: 'Demeter/Ogmios queryLedgerState/eraSummaries',
}

const systemStart = {
  schema: 'IMMORTAL-P2.8-OGMIOS-SYSTEM-START-v0.1',
  startTimeRaw: String(startTime),
  source: 'Demeter/Ogmios queryNetwork/startTime',
}

const manifest = {
  schema: 'IMMORTAL-P2.8-B.1-PREPROD-v0.2',
  status: 'raw-preprod-context-materialized',
  network: 'cardano-preprod',
  era: 'Babbage',
  transaction_hash: txHash,
  transaction_epoch: txEpoch,
  transaction_absolute_slot: absoluteSlot.toString(),
  source_of_truth: {
    transaction_cbor: 'Koios /tx_cbor',
    transaction_info: 'Koios /tx_info',
    consumed_utxos: 'Koios /utxo_info',
    protocol_parameters: 'Koios /epoch_params for exact transaction epoch',
    era_and_epoch_timing: 'Demeter/Ogmios /queryLedgerState/eraSummaries',
    system_start: 'Demeter/Ogmios /queryNetwork/startTime',
  },
  credential_label: credentialLabel,
  network_tip_observed: tip,
  typed_context_ready: false,
  synthetic_context: false,
}

await writeFile(evidenceDir + '/tx.cbor', txCbor)
await writeFile(evidenceDir + '/utxo.json', JSON.stringify({
  schema: 'IMMORTAL-P2.8-PREPROD-UTXO-v0.2',
  source: { provider: 'Koios', network: 'cardano-preprod', endpoint: koios + '/utxo_info' },
  transaction_hash: txHash,
  consumedUtxos: refs,
  observed: { inputs: normalizedInputs },
}, null, 2) + '\n')
await writeFile(evidenceDir + '/pparams.json', JSON.stringify(pparams, null, 2) + '\n')
await writeFile(evidenceDir + '/epoch-info.json', JSON.stringify(epochInfo, null, 2) + '\n')
await writeFile(evidenceDir + '/system-start.json', JSON.stringify(systemStart, null, 2) + '\n')
await writeFile(evidenceDir + '/preprod-raw-tx-info.json', JSON.stringify(txInfo, null, 2) + '\n')
await writeFile(evidenceDir + '/preprod-raw-tx-cbor.json', JSON.stringify(cborList[0], null, 2) + '\n')
await writeFile(evidenceDir + '/preprod-raw-utxo-info.json', JSON.stringify(utxoList, null, 2) + '\n')
await writeFile(evidenceDir + '/preprod-raw-epoch-params.json', JSON.stringify(epochParams, null, 2) + '\n')
await writeFile(evidenceDir + '/preprod-raw-ogmios-era-summaries.json', JSON.stringify(eraSummaries, null, 2) + '\n')
await writeFile(evidenceDir + '/preprod-raw-ogmios-tip.json', JSON.stringify(tip, null, 2) + '\n')
await writeFile(evidenceDir + '/preprod-raw-ogmios-start-time.json', JSON.stringify(startTime, null, 2) + '\n')

const hashedFiles = ['tx.cbor','utxo.json','pparams.json','epoch-info.json','system-start.json','preprod-raw-tx-info.json','preprod-raw-tx-cbor.json','preprod-raw-utxo-info.json','preprod-raw-epoch-params.json','preprod-raw-ogmios-era-summaries.json','preprod-raw-ogmios-tip.json','preprod-raw-ogmios-start-time.json']
manifest.sha256 = Object.fromEntries(await Promise.all(hashedFiles.map(async f => [f, sha256(await readFile(evidenceDir+'/'+f))])))
await writeFile(evidenceDir + '/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
manifest.sha256['manifest.json'] = sha256(await readFile(evidenceDir + '/manifest.json'))
await writeFile(evidenceDir + '/manifest.sha256', manifest.sha256['manifest.json'] + '  manifest.json\n')

console.log(JSON.stringify({
  status: manifest.status,
  transactionHash: txHash,
  transactionEpoch: txEpoch,
  transactionAbsoluteSlot: absoluteSlot.toString(),
  era: targetEraName,
  inputs: refs,
  pparamsEpoch: txEpoch,
  credential: credentialLabel,
  hashes: manifest.sha256,
}, null, 2))
