import { createHash } from 'node:crypto'
import WebSocket from 'ws'

function cborHead(buffer, offset) {
  if (offset >= buffer.length) throw new Error('CBOR_TRUNCATED')
  const b = buffer[offset]
  const ai = b & 31
  if (ai < 24) return { major: b >> 5, ai, headEnd: offset + 1, length: ai }
  if (ai === 24) return { major: b >> 5, ai, headEnd: offset + 2, length: buffer[offset + 1] }
  if (ai === 25) return { major: b >> 5, ai, headEnd: offset + 3, length: buffer.readUInt16BE(offset + 1) }
  if (ai === 26) return { major: b >> 5, ai, headEnd: offset + 5, length: buffer.readUInt32BE(offset + 1) }
  if (ai === 27) {
    const n = buffer.readBigUInt64BE(offset + 1)
    if (n > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('CBOR_LENGTH_TOO_LARGE')
    return { major: b >> 5, ai, headEnd: offset + 9, length: Number(n) }
  }
  return { major: b >> 5, ai, headEnd: offset + 1, length: null }
}

function skipCbor(buffer, offset) {
  const h = cborHead(buffer, offset)
  if (h.ai === 31) {
    if (h.major === 4 || h.major === 5) {
      let p = h.headEnd
      for (;;) {
        if (p >= buffer.length) throw new Error('CBOR_INDEFINITE_TRUNCATED')
        if (buffer[p] === 0xff) return p + 1
        p = skipCbor(buffer, p)
        if (h.major === 5) p = skipCbor(buffer, p)
      }
    }
    throw new Error('CBOR_UNSUPPORTED_INDEFINITE')
  }
  if (h.major === 0 || h.major === 1 || h.major === 7) return h.headEnd
  if (h.major === 2 || h.major === 3) {
    const end = h.headEnd + h.length
    if (end > buffer.length) throw new Error('CBOR_BYTES_TRUNCATED')
    return end
  }
  if (h.major === 4) {
    let p = h.headEnd
    for (let i = 0; i < h.length; i++) p = skipCbor(buffer, p)
    return p
  }
  if (h.major === 5) {
    let p = h.headEnd
    for (let i = 0; i < h.length; i++) {
      p = skipCbor(buffer, p)
      p = skipCbor(buffer, p)
    }
    return p
  }
  if (h.major === 6) return skipCbor(buffer, h.headEnd)
  throw new Error('CBOR_UNSUPPORTED_MAJOR:' + h.major)
}

export function txHashFromSignedCbor(txCborHex) {
  const bytes = Buffer.from(txCborHex, 'hex')
  const top = cborHead(bytes, 0)
  if (top.major !== 4 || top.length === null || top.length < 2) throw new Error('CARDANO_TX_NOT_ARRAY')
  const bodyStart = top.headEnd
  const bodyEnd = skipCbor(bytes, bodyStart)
  const body = bytes.subarray(bodyStart, bodyEnd)
  return createHash('blake2b512').update(body).digest().subarray(0, 32).toString('hex')
}

export class KoiosOgmiosProvider {
  constructor(koiosUrl, ogmiosUrl, apiKey) {
    this.koiosUrl = koiosUrl.replace(/\/$/, '')
    this.ogmiosUrl = ogmiosUrl
    this.apiKey = apiKey
    this.data = { url: this.koiosUrl, projectId: '' }
  }

  async koiosPost(path, body) {
    const response = await fetch(this.koiosUrl + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await response.text()
    if (!response.ok) throw new Error('KOIOS_' + path.replace(/^\//, '').toUpperCase() + '_HTTP_' + response.status + ':' + text.slice(0, 500))
    return JSON.parse(text)
  }

  async koiosGet(path) {
    const response = await fetch(this.koiosUrl + path, { headers: { accept: 'application/json' } })
    const text = await response.text()
    if (!response.ok) throw new Error('KOIOS_' + path.replace(/^\//, '').toUpperCase() + '_HTTP_' + response.status + ':' + text.slice(0, 500))
    return JSON.parse(text)
  }

  mapUtxo(u) {
    if (!u.address || u.value == null) throw new Error('KOIOS_UTXO_MISSING_ADDRESS_OR_VALUE')
    const assets = { lovelace: BigInt(String(u.value)) }
    for (const a of Array.isArray(u.asset_list) ? u.asset_list : []) {
      const policy = String(a.policy_id ?? '').toLowerCase()
      const name = String(a.asset_name ?? '').toLowerCase()
      if (!/^[0-9a-f]{56}$/.test(policy) || !/^[0-9a-f]{0,64}$/.test(name)) throw new Error('KOIOS_ASSET_UNIT_INVALID')
      assets[policy + name] = BigInt(String(a.quantity ?? '0'))
    }
    const inlineDatum = u.inline_datum?.bytes ?? null
    const r = u.reference_script
    const scriptRef = typeof r === 'string'
      ? r.replace(/^0x/i, '')
      : r?.bytes ?? r?.cbor ?? r?.script?.bytes ?? r?.script?.cbor ?? undefined
    return {
      txHash: String(u.tx_hash).toLowerCase(),
      outputIndex: Number(u.tx_index),
      assets,
      address: String(u.address),
      datumHash: u.datum_hash ?? undefined,
      datum: inlineDatum ?? undefined,
      scriptRef: scriptRef ? String(scriptRef).replace(/^0x/i, '') : undefined,
    }
  }

  async getProtocolParameters() {
    const tip = (await this.koiosPost('/tip', {}))[0]
    const epoch = Number(tip?.epoch ?? tip?.epoch_no)
    if (!Number.isSafeInteger(epoch)) throw new Error('KOIOS_TIP_EPOCH_INVALID')
    const rows = await this.koiosGet('/epoch_params?_epoch_no=' + epoch)
    if (!Array.isArray(rows) || rows.length !== 1) throw new Error('KOIOS_EPOCH_PARAMS_NOT_FOUND')
    const p = rows[0]
    return {
      minFeeA: Number(p.min_fee_a),
      minFeeB: Number(p.min_fee_b),
      maxTxSize: Number(p.max_tx_size),
      maxValSize: Number(p.max_val_size),
      keyDeposit: BigInt(p.key_deposit),
      poolDeposit: BigInt(p.pool_deposit),
      priceMem: Number(p.price_mem),
      priceStep: Number(p.price_step),
      maxTxExMem: BigInt(p.max_tx_ex_mem),
      maxTxExSteps: BigInt(p.max_tx_ex_steps),
      coinsPerUtxoByte: BigInt(p.coins_per_utxo_size ?? p.coins_per_utxo_byte ?? 0),
      collateralPercentage: Number(p.collateral_percent),
      maxCollateralInputs: Number(p.max_collateral_inputs),
      costModels: p.cost_models,
      minfeeRefscriptCostPerByte: Number(p.min_fee_ref_script_cost_per_byte ?? 0),
    }
  }

  async getUtxos(address) {
    const rows = await this.koiosPost('/address_utxos', { _addresses: [address], _extended: true })
    return Array.isArray(rows) ? rows.map(u => this.mapUtxo(u)) : []
  }

  async getUtxosWithUnit(address, unit) {
    return (await this.getUtxos(address)).filter(u => (u.assets[unit] ?? 0n) > 0n)
  }

  async getUtxosByOutRef(outRefs) {
    const refs = outRefs.map(x => x.txHash + '#' + x.outputIndex)
    const rows = await this.koiosPost('/utxo_info', { _utxo_refs: refs, _extended: true })
    return Array.isArray(rows) ? rows.map(u => this.mapUtxo(u)) : []
  }

  async getDatum(datumHash) {
    const rows = await this.koiosPost('/datum_info', { _datum_hashes: [datumHash] })
    if (!Array.isArray(rows) || rows.length !== 1 || !rows[0].bytes) throw new Error('KOIOS_DATUM_NOT_FOUND')
    return rows[0].bytes
  }

  async getDelegation() {
    return { poolId: null, rewards: 0n }
  }

  async getCurrentSlot() {
    const tip = (await this.koiosPost('/tip', {}))[0]
    const slot = tip?.abs_slot ?? tip?.absolute_slot
    return Number(slot)
  }

  async awaitTx(txHash) {
    for (let i = 0; i < 60; i++) {
      const rows = await this.koiosPost('/tx_status', { _tx_hashes: [txHash] })
      if (Array.isArray(rows) && rows[0] && Number(rows[0].num_confirmations ?? 0) > 0) return true
      await new Promise(r => setTimeout(r, 2000))
    }
    throw new Error('KOIOS_TX_CONFIRMATION_TIMEOUT:' + txHash)
  }

  openOgmios() {
    const endpoint = this.ogmiosUrl
    const key = this.apiKey
    return new Promise((resolve, reject) => {
      const explicit = process.env.DEMETER_OGMIOS_AUTHENTICATED_URL?.trim()
      const target = explicit || endpoint
      const headers = explicit ? {} : { 'dmtr-api-key': key }
      const socket = new WebSocket(target, { headers })
      const timer = setTimeout(() => {
        socket.close()
        reject(new Error('OGMIOS_OPEN_TIMEOUT'))
      }, 30000)
      socket.once('open', () => {
        clearTimeout(timer)
        resolve(socket)
      })
      socket.once('error', error => {
        clearTimeout(timer)
        reject(error)
      })
      socket.once('unexpected-response', (_req, response) => {
        clearTimeout(timer)
        reject(new Error('OGMIOS_HTTP_' + response.statusCode))
      })
    })
  }

  async submitTx(tx) {
    const txHash = txHashFromSignedCbor(tx)
    const socket = await this.openOgmios()
    try {
      const id = 'immortal-submit-' + Date.now().toString(36)
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('OGMIOS_SUBMIT_TIMEOUT')), 30000)
        const onMessage = raw => {
          const response = JSON.parse(raw.toString())
          if (response.id !== id) return
          clearTimeout(timer)
          socket.off('message', onMessage)
          if (response.error) reject(new Error('OGMIOS_SUBMIT:' + JSON.stringify(response.error)))
          else resolve(response.result ?? null)
        }
        socket.on('message', onMessage)
        socket.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'submitTransaction',
          params: { transaction: { cbor: tx } },
          id,
        }))
      })
      void result
    } finally {
      socket.close()
    }
    return txHash
  }
}
