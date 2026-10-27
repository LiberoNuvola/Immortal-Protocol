import { createHash } from 'node:crypto'
import {
  DexV1Constant,
  DexV2Constant,
  NetworkId,
  PoolV1,
  PoolV2,
  StableswapConstant,
} from '@minswap/sdk'

const NETWORK = 'cardano-preprod'
const KOIOS = (process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1').replace(/\/$/, '')
const TUSDM_UNIT = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d'
const TUSDM_POLICY = TUSDM_UNIT.slice(0, 56)
const TUSDM_NAME = TUSDM_UNIT.slice(56)
const ADA_UNIT = 'lovelace'
const IMMORTAL_B1_POOL_SINGLETON_UNIT = '9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e504f4f4c2d444952454354'
const V1_POOL_SCRIPT_HASH = bech32ScriptHashToHex(DexV1Constant.POOL_SCRIPT_HASH)
const EXPECTED_V1_POOL_SCRIPT_HASH = 'e1317b152faac13426e6a83e06ff88a4d62cce3c1634ab0a5ec13309'
const V2_CONFIG = DexV2Constant.CONFIG[NetworkId.TESTNET]
const V2_POOL_SCRIPT_HASH = V2_CONFIG.poolScriptHash.toLowerCase()
const V2_AUTH_UNIT = V2_CONFIG.poolAuthenAsset.toLowerCase()
const V2_AUTH_POLICY = V2_AUTH_UNIT.slice(0, 56)
const V2_AUTH_NAME = V2_AUTH_UNIT.slice(56)
const PAGE_SIZE = 500
const MAX_UTXOS = 25000

function bech32ScriptHashToHex(value) {
  const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  const separator = value.lastIndexOf('1')
  if (separator <= 0 || value.slice(0, separator) !== 'script') {
    throw new Error('MINSWAP_SCRIPT_HASH_BECH32_INVALID')
  }
  const encoded = value.slice(separator + 1)
  if (encoded.length <= 6) throw new Error('MINSWAP_SCRIPT_HASH_BECH32_TOO_SHORT')
  const data = []
  for (const char of encoded.slice(0, -6)) {
    const n = alphabet.indexOf(char)
    if (n < 0) throw new Error('MINSWAP_SCRIPT_HASH_BECH32_CHAR_INVALID')
    data.push(n)
  }
  let accumulator = 0
  let bits = 0
  const bytes = []
  for (const n of data) {
    accumulator = (accumulator << 5) | n
    bits += 5
    while (bits >= 8) {
      bits -= 8
      bytes.push((accumulator >> bits) & 0xff)
    }
  }
  if (bits >= 5 || ((accumulator << (8 - bits)) & 0xff) !== 0) {
    throw new Error('MINSWAP_SCRIPT_HASH_BECH32_PADDING_INVALID')
  }
  const result = Buffer.from(bytes).toString('hex')
  if (!/^[0-9a-f]{56}$/.test(result)) throw new Error('MINSWAP_SCRIPT_HASH_LENGTH_INVALID')
  return result
}

function sha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function normalizeHex(value) {
  const raw = typeof value === 'string' ? value : value?.bytes
  return typeof raw === 'string' ? raw.replace(/^0x/i, '').toLowerCase() : null
}

function tipSummary(tip) {
  if (!tip || tip.block_no == null || tip.abs_slot == null) {
    throw new Error('KOIOS_CHAIN_TIP_MISSING_REQUIRED_FIELDS')
  }
  return {
    blockNo: String(tip.block_no),
    slot: String(tip.abs_slot),
    blockHash: tip.hash ?? tip.block_hash ?? null,
  }
}

async function koiosGet(path) {
  const response = await fetch(KOIOS + path, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error('KOIOS_' + path.replace(/^\//, '').toUpperCase() + '_HTTP_' + response.status)
  return response.json()
}

async function koiosPost(path, body) {
  const response = await fetch(KOIOS + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error('KOIOS_' + path.split('?')[0].replace(/^\//, '').toUpperCase() + '_HTTP_' + response.status + ':' + text.slice(0, 250))
  }
  return JSON.parse(text)
}

function decodeLedgerAssets(assetList = [], lovelace) {
  const assets = { [ADA_UNIT]: String(lovelace) }
  for (const item of assetList) {
    if (!item || typeof item.policy_id !== 'string' || typeof item.asset_name !== 'string' || item.quantity === undefined) {
      throw new Error('KOIOS_LEDGER_ASSET_ROW_MALFORMED')
    }
    const unit = item.policy_id.toLowerCase() + item.asset_name.toLowerCase()
    if (Object.hasOwn(assets, unit)) throw new Error('KOIOS_DUPLICATE_ASSET_UNIT')
    assets[unit] = String(item.quantity)
  }
  return assets
}

function sdkValueFromRow(row) {
  const assets = decodeLedgerAssets(row.asset_list, row.value)
  return Object.entries(assets).map(([unit, quantity]) => ({ unit, quantity }))
}


const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

function bech32Polymod(values) {
  const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) checksum ^= generators[i]
  }
  return checksum >>> 0
}

function bech32HrpExpand(hrp) {
  const values = []
  for (const ch of hrp) values.push(ch.charCodeAt(0) >>> 5)
  values.push(0)
  for (const ch of hrp) values.push(ch.charCodeAt(0) & 31)
  return values
}

function convertBits(values, fromBits, toBits, pad) {
  let accumulator = 0
  let bits = 0
  const out = []
  const mask = (1 << toBits) - 1
  for (const value of values) {
    if (value < 0 || (value >>> fromBits) !== 0) throw new Error('BECH32_DATA_RANGE')
    accumulator = (accumulator << fromBits) | value
    bits += fromBits
    while (bits >= toBits) {
      bits -= toBits
      out.push((accumulator >>> bits) & mask)
    }
  }
  if (pad) {
    if (bits) out.push((accumulator << (toBits - bits)) & mask)
  } else if (bits >= fromBits || ((accumulator << (toBits - bits)) & mask) !== 0) {
    throw new Error('BECH32_INVALID_PADDING')
  }
  return out
}

function decodeCardanoShelleyPaymentCredential(address) {
  if (typeof address !== 'string') return null
  const separator = address.lastIndexOf('1')
  if (separator <= 0 || address.length - separator < 7) return null
  const hrp = address.slice(0, separator)
  const raw = address.slice(separator + 1).toLowerCase()
  const values = []
  for (const ch of raw) {
    const value = BECH32_CHARSET.indexOf(ch)
    if (value < 0) return null
    values.push(value)
  }
  if (bech32Polymod([...bech32HrpExpand(hrp), ...values]) !== 1) return null
  const payload = convertBits(values.slice(0, -6), 5, 8, false)
  if (payload.length < 29) return null
  const header = payload[0]
  const addressType = header >>> 4
  const paymentCredentialHex = Buffer.from(payload.slice(1, 29)).toString('hex')
  const scriptPaymentCredential = [1, 3, 5, 7].includes(addressType)
  const keyPaymentCredential = [0, 2, 4, 6].includes(addressType)
  if (!scriptPaymentCredential && !keyPaymentCredential) return null
  return {
    hrp,
    networkId: header & 15,
    addressType,
    scriptPaymentCredential,
    keyPaymentCredential,
    paymentCredentialHex,
  }
}

function rowOutRef(row) {
  return {
    txHash: String(row.tx_hash ?? '').toLowerCase(),
    outputIndex: Number(row.tx_index),
    address: String(row.address ?? ''),
  }
}

function requireValidOutRef(ref) {
  if (!/^[0-9a-f]{64}$/.test(ref.txHash) || !Number.isSafeInteger(ref.outputIndex) || ref.outputIndex < 0 || !ref.address) {
    throw new Error('KOIOS_POOL_OUTREF_OR_ADDRESS_INVALID')
  }
}

async function queryAssetUtxos(policy, name) {
  const all = []
  const seen = new Set()
  let offset = 0
  while (true) {
    const rows = await koiosPost('/asset_utxos?limit=' + PAGE_SIZE + '&offset=' + offset, {
      _asset_list: [[policy, name]],
      _extended: true,
    })
    if (!Array.isArray(rows)) throw new Error('KOIOS_ASSET_UTXOS_NOT_ARRAY')
    for (const row of rows) {
      const ref = rowOutRef(row)
      requireValidOutRef(ref)
      const key = ref.txHash + '#' + ref.outputIndex
      if (seen.has(key)) throw new Error('KOIOS_ASSET_UTXOS_DUPLICATE_OUTREF_ACROSS_PAGES')
      seen.add(key)
      all.push(row)
    }
    if (all.length > MAX_UTXOS) throw new Error('KOIOS_ASSET_UTXOS_EXCEED_GOVERNED_SCAN_BOUND')
    if (rows.length < PAGE_SIZE) break
    offset += rows.length
  }
  return all
}

async function findLiveOutRef(address, txHash, outputIndex) {
  const rows = await koiosPost('/address_utxos', { _addresses: [address], _extended: true })
  if (!Array.isArray(rows)) throw new Error('KOIOS_ADDRESS_UTXOS_NOT_ARRAY')
  return rows.filter((row) =>
    String(row.tx_hash ?? '').toLowerCase() === txHash &&
    Number(row.tx_index) === outputIndex &&
    String(row.address ?? '') === address
  )
}

function exactAdaTusdmPair(pool) {
  const pair = new Set([pool.assetA, pool.assetB])
  return pair.size === 2 && pair.has(ADA_UNIT) && pair.has(TUSDM_UNIT)
}

function observeV2Pool(row) {
  const ref = rowOutRef(row)
  requireValidOutRef(ref)
  if (String(row.payment_cred ?? '').toLowerCase() !== V2_POOL_SCRIPT_HASH) {
    throw new Error('KOIOS_V2_POOL_PAYMENT_CREDENTIAL_MISMATCH')
  }
  const datumHex = normalizeHex(row.inline_datum)
  if (!datumHex) throw new Error('KOIOS_V2_POOL_INLINE_DATUM_MISSING')
  const value = sdkValueFromRow(row)
  const pool = new PoolV2.State(
    NetworkId.TESTNET,
    ref.address,
    { txHash: ref.txHash, index: ref.outputIndex },
    value,
    datumHex,
  )
  const authQuantity = BigInt(value.find((item) => item.unit === V2_AUTH_UNIT)?.quantity ?? '0')
  if (authQuantity !== 1n) throw new Error('MINSWAP_V2_POOL_AUTHENTICATION_ASSET_QUANTITY_INVALID')
  return { row, ref, pool, datumHex, value }
}

function observeV1Pool(row) {
  const ref = rowOutRef(row)
  requireValidOutRef(ref)
  if (String(row.payment_cred ?? '').toLowerCase() !== V1_POOL_SCRIPT_HASH) {
    throw new Error('KOIOS_V1_POOL_PAYMENT_CREDENTIAL_MISMATCH')
  }
  const datumHash = String(row.datum_hash ?? '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(datumHash)) throw new Error('KOIOS_V1_POOL_DATUM_HASH_MISSING')
  const value = sdkValueFromRow(row)
  const pool = new PoolV1.State(ref.address, { txHash: ref.txHash, index: ref.outputIndex }, value, datumHash)
  const nfts = value.filter((item) => item.unit.startsWith(DexV1Constant.POOL_NFT_POLICY_ID))
  if (nfts.length !== 1 || BigInt(nfts[0].quantity) !== 1n) {
    throw new Error('MINSWAP_V1_POOL_NFT_IDENTITY_INVALID')
  }
  return { row, ref, pool, datumHash, value }
}

async function verifyV2Candidate(candidate) {
  const exact = await findLiveOutRef(candidate.ref.address, candidate.ref.txHash, candidate.ref.outputIndex)
  if (exact.length !== 1) {
    return {
      status: 'BLOCKED_OUTREF_NOT_UNIQUELY_LIVE',
      outRef: candidate.ref.txHash + '#' + candidate.ref.outputIndex,
      address: candidate.ref.address,
      exactKoiosMatches: exact.length,
    }
  }
  const direct = exact[0]
  const directDatumHex = normalizeHex(direct.inline_datum)
  const directAssets = decodeLedgerAssets(direct.asset_list, direct.value)
  const sdkAssets = Object.fromEntries(candidate.value.map((item) => [item.unit, String(item.quantity)]))
  const datumMatches = Boolean(directDatumHex && candidate.datumHex === directDatumHex)
  const assetsMatch =
    String(direct.payment_cred ?? '').toLowerCase() === V2_POOL_SCRIPT_HASH &&
    (directAssets[V2_AUTH_UNIT] ?? '0') === '1' &&
    (directAssets[TUSDM_UNIT] ?? '0') === (sdkAssets[TUSDM_UNIT] ?? '0') &&
    (directAssets[ADA_UNIT] ?? '0') === (sdkAssets[ADA_UNIT] ?? '0') &&
    BigInt(directAssets[TUSDM_UNIT] ?? '0') > 0n &&
    BigInt(directAssets[ADA_UNIT] ?? '0') > 0n
  return {
    status: datumMatches && assetsMatch ? 'OBSERVED_NOT_QUALIFIED' : 'BLOCKED_SDK_LEDGER_WITNESS_MISMATCH',
    address: candidate.ref.address,
    outRef: candidate.ref.txHash + '#' + candidate.ref.outputIndex,
    assetA: candidate.pool.assetA,
    assetB: candidate.pool.assetB,
    datumMatchesKoiosRequery: datumMatches,
    assetValueMatchesKoiosRequery: assetsMatch,
    reservesFromDatum: { reserveA: String(candidate.pool.reserveA), reserveB: String(candidate.pool.reserveB) },
    valueReserves: candidate.pool.valueReserves.map((value) => value.toString()),
    fees: {
      feeA: candidate.pool.feeA.map((value) => value.toString()),
      feeB: candidate.pool.feeB.map((value) => value.toString()),
      feeShare: candidate.pool.feeShare?.map((value) => value.toString()) ?? null,
    },
    totalLiquidity: String(candidate.pool.totalLiquidity),
    lpAsset: candidate.pool.lpAsset,
    directLedger: {
      blockHeight: direct.block_height == null ? null : String(direct.block_height),
      blockTime: direct.block_time == null ? null : String(direct.block_time),
      lovelace: directAssets[ADA_UNIT],
      tUsdmAtomic: directAssets[TUSDM_UNIT],
      poolAuthAtomic: directAssets[V2_AUTH_UNIT],
      allAssets: directAssets,
      inlineDatumCborHex: directDatumHex,
    },
    sdkDatumCborHex: candidate.datumHex,
  }
}

async function verifyV1Candidate(candidate) {
  const exact = await findLiveOutRef(candidate.ref.address, candidate.ref.txHash, candidate.ref.outputIndex)
  if (exact.length !== 1) {
    return {
      status: 'BLOCKED_OUTREF_NOT_UNIQUELY_LIVE',
      outRef: candidate.ref.txHash + '#' + candidate.ref.outputIndex,
      address: candidate.ref.address,
      exactKoiosMatches: exact.length,
    }
  }
  const direct = exact[0]
  const directDatumHash = String(direct.datum_hash ?? '').toLowerCase()
  const directAssets = decodeLedgerAssets(direct.asset_list, direct.value)
  const sdkAssets = Object.fromEntries(candidate.value.map((item) => [item.unit, String(item.quantity)]))
  const datumMatches = /^[0-9a-f]{64}$/.test(directDatumHash) && directDatumHash === candidate.datumHash
  const assetsMatch =
    String(direct.payment_cred ?? '').toLowerCase() === V1_POOL_SCRIPT_HASH &&
    directAssets[candidate.pool.nft] === '1' &&
    (directAssets[TUSDM_UNIT] ?? '0') === (sdkAssets[TUSDM_UNIT] ?? '0') &&
    (directAssets[ADA_UNIT] ?? '0') === (sdkAssets[ADA_UNIT] ?? '0') &&
    BigInt(directAssets[TUSDM_UNIT] ?? '0') > 0n &&
    BigInt(directAssets[ADA_UNIT] ?? '0') > 0n
  return {
    status: datumMatches && assetsMatch ? 'OBSERVED_NOT_QUALIFIED' : 'BLOCKED_SDK_LEDGER_WITNESS_MISMATCH',
    address: candidate.ref.address,
    outRef: candidate.ref.txHash + '#' + candidate.ref.outputIndex,
    assetA: candidate.pool.assetA,
    assetB: candidate.pool.assetB,
    datumHashMatchesKoiosRequery: datumMatches,
    assetValueMatchesKoiosRequery: assetsMatch,
    poolNft: candidate.pool.nft,
    reservesFromValue: { reserveA: String(candidate.pool.reserveA), reserveB: String(candidate.pool.reserveB) },
    directLedger: {
      blockHeight: direct.block_height == null ? null : String(direct.block_height),
      blockTime: direct.block_time == null ? null : String(direct.block_time),
      lovelace: directAssets[ADA_UNIT],
      tUsdmAtomic: directAssets[TUSDM_UNIT],
      poolNftAtomic: directAssets[candidate.pool.nft],
      datumHash: directDatumHash,
      allAssets: directAssets,
    },
  }
}

async function main() {
  if (V1_POOL_SCRIPT_HASH !== EXPECTED_V1_POOL_SCRIPT_HASH || !/^[0-9a-f]{56}$/.test(V2_POOL_SCRIPT_HASH)) {
    throw new Error('MINSWAP_TESTNET_CONFIG_INVALID')
  }
  // Sanity-check bech32 decoding against the SDK's canonical V2 script hash.
  if (bech32ScriptHashToHex(V2_CONFIG.poolScriptHashBech32) !== V2_POOL_SCRIPT_HASH) {
    throw new Error('MINSWAP_SCRIPT_HASH_DECODER_CROSSCHECK_FAILED')
  }

  const observedAt = new Date().toISOString()
  const rawTipBefore = await koiosGet('/tip')
  const tipBefore = tipSummary(Array.isArray(rawTipBefore) ? rawTipBefore[0] : rawTipBefore)

  const v2Rows = await koiosPost('/asset_utxos', {
    _asset_list: [[V2_AUTH_POLICY, V2_AUTH_NAME]],
    _extended: true,
  })
  if (!Array.isArray(v2Rows)) throw new Error('KOIOS_V2_AUTH_UTXOS_NOT_ARRAY')

  const v2PoolCredentialRows = v2Rows.filter((row) =>
    String(row.payment_cred ?? '').toLowerCase() === V2_POOL_SCRIPT_HASH
  )
  const decodedV2Pools = []
  let v2ParseRejected = 0
  for (const row of v2PoolCredentialRows) {
    try {
      decodedV2Pools.push(observeV2Pool(row))
    } catch {
      v2ParseRejected += 1
    }
  }
  const v2PairCandidates = decodedV2Pools.filter((candidate) => exactAdaTusdmPair(candidate.pool))

  const tusdmRows = await queryAssetUtxos(TUSDM_POLICY, TUSDM_NAME)
  const otherScriptCredentialGroups = new Map()
  let addressDecodeFailures = 0
  let paymentCredentialMismatches = 0
  let testnetAddressRows = 0
  for (const row of tusdmRows) {
    const decoded = decodeCardanoShelleyPaymentCredential(String(row.address ?? ''))
    if (!decoded) {
      addressDecodeFailures += 1
      continue
    }
    if (decoded.networkId === 0) testnetAddressRows += 1
    if (decoded.paymentCredentialHex !== String(row.payment_cred ?? '').toLowerCase()) {
      paymentCredentialMismatches += 1
      continue
    }
    if (!decoded.scriptPaymentCredential) continue
    const credential = decoded.paymentCredentialHex
    if (credential === V1_POOL_SCRIPT_HASH || credential === V2_POOL_SCRIPT_HASH) continue
    const list = otherScriptCredentialGroups.get(credential) ?? []
    list.push({ row, decoded })
    otherScriptCredentialGroups.set(credential, list)
  }
  const otherScriptCredentialSummary = [...otherScriptCredentialGroups.entries()]
    .map(([paymentCredential, entries]) => {
      const tokenRows = entries.map(({ row }) => {
        const assets = decodeLedgerAssets(row.asset_list, row.value)
        const otherUnits = Object.keys(assets).filter((unit) => unit !== ADA_UNIT && unit !== TUSDM_UNIT)
        return {
          outRef: String(row.tx_hash).toLowerCase() + '#' + Number(row.tx_index),
          address: String(row.address),
          addressType: entries[0].decoded.addressType,
          blockHeight: row.block_height == null ? null : String(row.block_height),
          blockTime: row.block_time == null ? null : String(row.block_time),
          tUsdmAtomic: String(assets[TUSDM_UNIT] ?? '0'),
          lovelace: String(assets[ADA_UNIT] ?? '0'),
          otherAssetCount: otherUnits.length,
          otherAssetUnits: otherUnits.slice(0, 8),
          datumHash: row.datum_hash ?? null,
          hasInlineDatum: Boolean(normalizeHex(row.inline_datum)),
          inlineDatumBytesLength: normalizeHex(row.inline_datum)?.length ? normalizeHex(row.inline_datum).length / 2 : 0,
        }
      })
      return {
        paymentCredential,
        utxoCount: entries.length,
        likelyPoolShapeCount: tokenRows.filter((row) => BigInt(row.tUsdmAtomic) > 0n && BigInt(row.lovelace) > 0n && row.otherAssetCount >= 1 && (row.hasInlineDatum || row.datumHash)).length,
        samples: tokenRows.slice(0, 3),
      }
    })
    .sort((a, b) => b.utxoCount - a.utxoCount)

  // Inspect external script UTxOs with a pool-like asset/datum shape without assuming they are DEX pools.
  // The known B1 PrizePool singleton is explicitly separated from these external candidates.
  const externalScriptCandidateRows = []
  for (const [paymentCredential, entries] of otherScriptCredentialGroups.entries()) {
    for (const { row, decoded } of entries) {
      const assets = decodeLedgerAssets(row.asset_list, row.value)
      const tUsdmAtomic = BigInt(assets[TUSDM_UNIT] ?? '0')
      const lovelace = BigInt(assets[ADA_UNIT] ?? '0')
      const otherUnits = Object.keys(assets).filter((unit) => unit !== ADA_UNIT && unit !== TUSDM_UNIT)
      const hasDatumEvidence = Boolean(normalizeHex(row.inline_datum) || row.datum_hash)
      const isKnownB1Pool = otherUnits.includes(IMMORTAL_B1_POOL_SINGLETON_UNIT)
      if (tUsdmAtomic <= 0n || lovelace <= 0n || otherUnits.length < 1 || !hasDatumEvidence || isKnownB1Pool) continue
      const outRef = rowOutRef(row)
      requireValidOutRef(outRef)
      externalScriptCandidateRows.push({
        paymentCredential,
        decoded,
        row,
        outRef,
        assets,
        otherUnits,
        tUsdmAtomic,
        lovelace,
      })
    }
  }
  externalScriptCandidateRows.sort((a, b) => {
    if (a.otherUnits.length !== b.otherUnits.length) return b.otherUnits.length - a.otherUnits.length
    if (a.tUsdmAtomic !== b.tUsdmAtomic) return a.tUsdmAtomic > b.tUsdmAtomic ? -1 : 1
    return a.outRef.txHash.localeCompare(b.outRef.txHash)
  })

  const externalScriptCandidateObservations = []
  for (const candidate of externalScriptCandidateRows.slice(0, 10)) {
    const exact = await findLiveOutRef(candidate.outRef.address, candidate.outRef.txHash, candidate.outRef.outputIndex)
    if (exact.length !== 1) {
      externalScriptCandidateObservations.push({
        status: 'BLOCKED_EXTERNAL_SCRIPT_OUTREF_NOT_UNIQUELY_LIVE',
        paymentCredential: candidate.paymentCredential,
        outRef: candidate.outRef.txHash + '#' + candidate.outRef.outputIndex,
        exactKoiosMatches: exact.length,
      })
      continue
    }
    const direct = exact[0]
    const directAssets = decodeLedgerAssets(direct.asset_list, direct.value)
    const originalDatumHex = normalizeHex(candidate.row.inline_datum)
    const directDatumHex = normalizeHex(direct.inline_datum)
    const datumHashMatches =
      (candidate.row.datum_hash ?? null) === (direct.datum_hash ?? null)
    const assetsMatch =
      String(direct.address ?? '') === candidate.outRef.address &&
      String(direct.payment_cred ?? '').toLowerCase() === candidate.paymentCredential &&
      (directAssets[TUSDM_UNIT] ?? '0') === candidate.tUsdmAtomic.toString() &&
      (directAssets[ADA_UNIT] ?? '0') === candidate.lovelace.toString() &&
      candidate.otherUnits.every((unit) => (directAssets[unit] ?? '0') === (candidate.assets[unit] ?? '0'))
    const datumMatches =
      originalDatumHex && directDatumHex
        ? originalDatumHex === directDatumHex
        : datumHashMatches
    externalScriptCandidateObservations.push({
      status: assetsMatch && datumMatches ? 'LIVE_SCRIPT_UTXO_RECHECKED_NOT_CLASSIFIED_AS_POOL' : 'BLOCKED_EXTERNAL_SCRIPT_WITNESS_MISMATCH',
      paymentCredential: candidate.paymentCredential,
      address: candidate.outRef.address,
      addressType: candidate.decoded.addressType,
      outRef: candidate.outRef.txHash + '#' + candidate.outRef.outputIndex,
      blockHeight: direct.block_height == null ? null : String(direct.block_height),
      blockTime: direct.block_time == null ? null : String(direct.block_time),
      tUsdmAtomic: String(directAssets[TUSDM_UNIT] ?? '0'),
      lovelace: String(directAssets[ADA_UNIT] ?? '0'),
      otherAssetUnits: Object.keys(directAssets).filter((unit) => unit !== ADA_UNIT && unit !== TUSDM_UNIT),
      datumHash: direct.datum_hash ?? null,
      datumHashMatchesFirstRead: datumHashMatches,
      inlineDatumMatchesFirstRead: Boolean(originalDatumHex && directDatumHex && originalDatumHex === directDatumHex),
      inlineDatumCborHex: directDatumHex,
      inlineDatumValue: direct.inline_datum?.value ?? null,
      assetsMatchFirstRead: assetsMatch,
      conclusion: 'Exact live output rechecked independently through Koios. Script identity/protocol semantics are not known from this check; do not call this a DEX pool without a protocol-specific witness.',
    })
  }

  const v1PoolCredentialRows = tusdmRows.filter((row) =>
    String(row.payment_cred ?? '').toLowerCase() === V1_POOL_SCRIPT_HASH
  )
  const decodedV1Pools = []
  let v1ParseRejected = 0
  for (const row of v1PoolCredentialRows) {
    try {
      decodedV1Pools.push(observeV1Pool(row))
    } catch {
      v1ParseRejected += 1
    }
  }
  const v1PairCandidates = decodedV1Pools.filter((candidate) => exactAdaTusdmPair(candidate.pool))

  const configuredStablePools = StableswapConstant.CONFIG[NetworkId.TESTNET]
  const stableTUsdmPools = configuredStablePools.filter((pool) =>
    pool.assets.some((asset) => asset.toLowerCase() === TUSDM_UNIT)
  )

  const poolObservations = []
  for (const candidate of v1PairCandidates) poolObservations.push({ protocol: 'Minswap V1', ...(await verifyV1Candidate(candidate)) })
  for (const candidate of v2PairCandidates) poolObservations.push({ protocol: 'Minswap V2', ...(await verifyV2Candidate(candidate)) })
  const mismatchCount = poolObservations.filter((item) => item.status.startsWith('BLOCKED_')).length

  const rawTipAfter = await koiosGet('/tip')
  const tipAfter = tipSummary(Array.isArray(rawTipAfter) ? rawTipAfter[0] : rawTipAfter)
  if (BigInt(tipAfter.slot) < BigInt(tipBefore.slot)) throw new Error('KOIOS_CHAIN_TIP_MOVED_BACKWARDS')
  const chainTipUnchanged = tipBefore.slot === tipAfter.slot && tipBefore.blockHash === tipAfter.blockHash
  const completedAt = new Date().toISOString()

  let status
  if (mismatchCount > 0) status = 'BLOCKED_POOL_OUTREF_OR_LEDGER_WITNESS_MISMATCH'
  else if (poolObservations.length > 0) status = 'OBSERVED_NOT_QUALIFIED'
  else status = 'NO_EXACT_ADA_TUSDM_PAIR_FOUND_IN_MINSWAP_V1_V2_CONFIGURED_STABLESWAP'

  const snapshot = {
    schema: 'MINSWAP-PREPROD-POOL-OBSERVATION-v3',
    network: NETWORK,
    status,
    qualification: 'OBSERVED_NOT_QUALIFIED',
    candidatePair: {
      assetA: ADA_UNIT,
      assetB: TUSDM_UNIT,
      tokenPolicyId: TUSDM_POLICY,
      tokenNameHex: TUSDM_NAME,
      tokenDecimals: 6,
    },
    discovery: {
      provider: 'Koios Preprod public API',
      readOnly: true,
      v1: {
        assetUtxosEndpoint: 'POST /asset_utxos (exact pinned tUSDM unit)',
        poolCredential: V1_POOL_SCRIPT_HASH,
        poolNftPolicy: DexV1Constant.POOL_NFT_POLICY_ID,
        liveTusdmUtxos: tusdmRows.length,
        rowsWithPoolCredential: v1PoolCredentialRows.length,
        decodedPoolStates: decodedV1Pools.length,
        rejectedRowsOrDatums: v1ParseRejected,
        exactPairCandidates: v1PairCandidates.length,
      },
      v2: {
        assetUtxosEndpoint: 'POST /asset_utxos (pool authentication asset)',
        poolAuthAsset: V2_AUTH_UNIT,
        poolCredential: V2_POOL_SCRIPT_HASH,
        rowsWithPoolCredential: v2PoolCredentialRows.length,
        decodedPoolStates: decodedV2Pools.length,
        rejectedRowsOrDatums: v2ParseRejected,
        exactPairCandidates: v2PairCandidates.length,
      },
      configuredStableswap: {
        sdkConfiguredPreprodPools: configuredStablePools.length,
        exactTusdmPairMembership: stableTUsdmPools.length,
        poolAssetLists: configuredStablePools.map((pool) => pool.assets),
      },
      otherScriptCredentialCandidates: {
        method: 'Decode and checksum-check Cardano Shelley address headers for each live UTxO carrying exact Preprod tUSDM; reconcile encoded payment credential with Koios payment_cred; exclude known Minswap V1/V2 credentials.',
        exactTUsdmUtxosScanned: tusdmRows.length,
        addressDecodeFailures,
        paymentCredentialMismatches,
        testnetAddressRows,
        nonMinswapScriptPaymentCredentialGroups: otherScriptCredentialGroups.size,
        groups: otherScriptCredentialSummary.slice(0, 25),
        externalScriptCandidatesAfterExcludingKnownB1Pool: {
          count: externalScriptCandidateRows.length,
          independentlyRequeried: externalScriptCandidateObservations.length,
          candidates: externalScriptCandidateObservations,
          meaning: 'Each candidate is an exact script-address UTxO holding tUSDM, ADA, another native asset and datum evidence, not an assertion that the script is a pool or DEX.',
        },
        knownImmortalB1PoolSingletonUnit: IMMORTAL_B1_POOL_SINGLETON_UNIT,
        limitation: 'A script credential plus tUSDM is only a candidate surface, not proof of a DEX pool. Each candidate requires protocol identification and exact out-reference/datum verification before classification.',
      },
      exactOutRefRequery: 'POST /address_utxos for exact-pair candidate(s) only',
      maxAssetUtxoScanRows: MAX_UTXOS,
      mutatingActions: false,
    },
    poolObservations,
    chainTip: { before: tipBefore, after: tipAfter },
    snapshotConsistency: {
      chainTipUnchanged,
      sameSlot: tipBefore.slot === tipAfter.slot,
      warning: chainTipUnchanged ? null : 'The chain advanced while separate read-only queries ran; treat this as a bounded observation interval, not an atomic same-slot snapshot.',
    },
    observedAt,
    completedAt,
    guardrails: {
      mainnetMonetaUsdmIdentityUsed: false,
      usdUsdmConversionQualified: false,
      noParityAssumption: true,
      noSigningOrSubmission: true,
      statusNote: 'Preprod tUSDM pool observation is test integration evidence only. It does not qualify a USD/USDM conversion or authorize EEV/Issue. A negative result only covers the SDK-configured Minswap V1, V2 and configured Stableswap sets scanned here.',
    },
  }
  snapshot.evidenceSha256 = sha256(snapshot)
  console.log(JSON.stringify(snapshot, null, 2))
  if (status === 'BLOCKED_POOL_OUTREF_OR_LEDGER_WITNESS_MISMATCH') process.exitCode = 1
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'OBSERVATION_FAILED_CLOSED',
    network: NETWORK,
    error: String(error?.message ?? error).slice(0, 500),
    note: 'No transaction was signed or submitted. This observer uses public Koios reads and does not log credentials.',
  }, null, 2))
  process.exitCode = 1
})
