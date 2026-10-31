#!/usr/bin/env node
/**
 * Read-only exact-USDM discovery at the official CSWAP ADA/USDM pool address.
 * Captures raw UTxO + datum evidence; no transaction or wallet operations.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const KOIOS = 'https://api.koios.rest/api/v1'
const USDM = {
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
}
const POOL = {
  venue: 'CSWAP',
  poolAddress: 'addr1z8ke0c9p89rjfwmuh98jpt8ky74uy5mffjft3zlcld9h7ml3lmln3mwk0y3zsh3gs3dzqlwa9rjzrxawkwm4udw9axhs6fuu6e',
  poolPaymentCredential: 'ed97e0a1394724bb7cb94f20acf627abc253694c92b88bf8fb4b7f6f',
  lpPolicyId: '16c66059d8ed65d35a64b229e34bfcd01899de45379a35c3aa74c7a5',
  poolScriptVersion: 'PlutusV3',
}
const PAGE_SIZE = 1000
const MAX_PAGES = 5
const sha256 = (raw) => createHash('sha256').update(raw, 'utf8').digest('hex')

function int(value, name) {
  const raw = String(value?.int ?? '')
  if (!/^-?\d+$/.test(raw)) throw new Error('CSWAP_DATUM_' + name + '_INT_INVALID')
  return BigInt(raw)
}
function bytes(value, name) {
  if (!value || typeof value.bytes !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value.bytes)) {
    throw new Error('CSWAP_DATUM_' + name + '_BYTES_INVALID')
  }
  return value.bytes.toLowerCase()
}
function decodePoolDatum(value) {
  if (!value || value.constructor !== 0 || !Array.isArray(value.fields) || value.fields.length !== 8) {
    throw new Error('CSWAP_POOL_DATUM_SHAPE_UNSUPPORTED')
  }
  const f = value.fields
  return {
    balance: int(f[0], 'BALANCE'),
    feeNumerator: int(f[1], 'FEE_NUMERATOR'),
    assetA: { policyId: bytes(f[2], 'ASSET_A_POLICY'), assetNameHex: bytes(f[3], 'ASSET_A_NAME') },
    assetB: { policyId: bytes(f[4], 'ASSET_B_POLICY'), assetNameHex: bytes(f[5], 'ASSET_B_NAME') },
    lpPolicyId: bytes(f[6], 'LP_POLICY'),
    lpNameHex: bytes(f[7], 'LP_NAME'),
  }
}
function decodeAscii(hex) {
  if (!/^(?:[0-9a-f]{2})*$/i.test(hex)) return null
  const bytes = hex.match(/.{2}/g) ?? []
  const text = bytes.map((x) => String.fromCharCode(parseInt(x, 16))).join('')
  return /^[\x20-\x7e]*$/.test(text) ? text : null
}
function assetUnit(asset) {
  return String(asset?.policyId ?? '').toLowerCase() + String(asset?.assetNameHex ?? '').toLowerCase()
}

async function fetchPage(offset) {
  const url = KOIOS + '/asset_utxos?address=eq.' + encodeURIComponent(POOL.poolAddress) +
    '&limit=' + PAGE_SIZE + '&offset=' + offset
  const startedAt = new Date().toISOString()
  const response = await fetch(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ _asset_list: [[USDM.policyId, USDM.assetNameHex]], _extended: true }),
    signal: AbortSignal.timeout(90_000),
  })
  const rawBody = await response.text()
  const evidence = {
    url, method: 'POST', status: response.status,
    responseDate: response.headers.get('date'),
    startedAt, completedAt: new Date().toISOString(),
    bodyBytes: Buffer.byteLength(rawBody), bodySha256: sha256(rawBody), rawBody,
  }
  if (!response.ok) throw Object.assign(new Error('KOIOS_CSWAP_ASSET_UTXOS_HTTP_' + response.status), { evidence })
  let json
  try { json = JSON.parse(rawBody) } catch {
    throw Object.assign(new Error('KOIOS_CSWAP_ASSET_UTXOS_JSON_INVALID'), { evidence })
  }
  if (!Array.isArray(json)) throw Object.assign(new Error('KOIOS_CSWAP_ASSET_UTXOS_SHAPE_INVALID'), { evidence })
  return { json, evidence }
}

async function fetchDatum(datumHash) {
  const url = KOIOS + '/datum_info'
  const startedAt = new Date().toISOString()
  const response = await fetch(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ _datum_hashes: [datumHash] }),
    signal: AbortSignal.timeout(60_000),
  })
  const rawBody = await response.text()
  const evidence = {
    url, method: 'POST', datumHash, status: response.status,
    responseDate: response.headers.get('date'),
    startedAt, completedAt: new Date().toISOString(),
    bodyBytes: Buffer.byteLength(rawBody), bodySha256: sha256(rawBody), rawBody,
  }
  if (!response.ok) throw Object.assign(new Error('KOIOS_CSWAP_DATUM_INFO_HTTP_' + response.status), { evidence })
  const json = JSON.parse(rawBody)
  if (!Array.isArray(json)) throw Object.assign(new Error('KOIOS_CSWAP_DATUM_INFO_SHAPE_INVALID'), { evidence })
  const datum = json.find((x) => String(x.hash ?? x.datum_hash ?? '').toLowerCase() === datumHash.toLowerCase()) ?? null
  return { datum, evidence }
}

async function main() {
  const argv = process.argv.slice(2)
  const index = argv.indexOf('--out')
  const outPath = index >= 0 && argv[index + 1]
    ? resolve(argv[index + 1])
    : resolve('audit/cswap/cswap-usdm-pool-readonly.json')
  const startedAt = new Date().toISOString()
  const pages = []
  const datumInfo = []
  const rows = []
  let completePagination = false
  let error = null

  try {
    for (let offset = 0; offset < PAGE_SIZE * MAX_PAGES; offset += PAGE_SIZE) {
      const page = await fetchPage(offset)
      pages.push(page.evidence)
      rows.push(...page.json)
      if (page.json.some((row) => String(row.address ?? '') !== POOL.poolAddress)) {
        throw new Error('KOIOS_CSWAP_ADDRESS_FILTER_RETURNED_FOREIGN_ROW')
      }
      if (page.json.length < PAGE_SIZE) {
        completePagination = true
        break
      }
    }
    if (!completePagination) throw new Error('KOIOS_CSWAP_POOL_PAGE_CAP_REACHED_INCOMPLETE')

    for (const row of rows) {
      if (!row.inline_datum?.value && row.inline_datum?.hash) {
        const resolved = await fetchDatum(row.inline_datum.hash)
        datumInfo.push(resolved.evidence)
        row.resolved_datum = resolved.datum
      }
    }
  } catch (e) {
    error = {
      message: e instanceof Error ? e.message : String(e),
      evidence: e?.evidence ?? null,
    }
  }

  const candidates = rows.map((row) => {
    const paymentCredential = String(row.payment_cred ?? '').toLowerCase()
    const datumValue = row.inline_datum?.value ?? row.resolved_datum?.value ?? null
    let datum = null
    let datumError = null
    if (datumValue) {
      try { datum = decodePoolDatum(datumValue) }
      catch (e) { datumError = e instanceof Error ? e.message : String(e) }
    }
    const assets = (row.asset_list ?? []).map((asset) => ({
      policyId: String(asset.policy_id ?? '').toLowerCase(),
      assetNameHex: String(asset.asset_name ?? '').toLowerCase(),
      quantityRaw: String(asset.quantity ?? '0'),
    }))
    const usdmQuantityRaw = assets.find((asset) => assetUnit(asset) === USDM.policyId + USDM.assetNameHex)?.quantityRaw ?? '0'
    const reserveA = datum
      ? assetUnit(datum.assetA) === '' ? String(row.value ?? '0') : assets.find((asset) => assetUnit(asset) === assetUnit(datum.assetA))?.quantityRaw ?? '0'
      : null
    const reserveB = datum
      ? assetUnit(datum.assetB) === '' ? String(row.value ?? '0') : assets.find((asset) => assetUnit(asset) === assetUnit(datum.assetB))?.quantityRaw ?? '0'
      : null
    return {
      utxoRef: String(row.tx_hash ?? '') + '#' + String(row.tx_index ?? ''),
      address: row.address ?? null,
      paymentCredential,
      paymentCredentialMatchesOfficial: paymentCredential === POOL.poolPaymentCredential,
      valueLovelaceRaw: String(row.value ?? '0'),
      assets,
      exactUsdmQuantityRaw: usdmQuantityRaw,
      datumHash: row.inline_datum?.hash ?? row.datum_hash ?? null,
      inlineDatumBytes: row.inline_datum?.bytes ?? null,
      datumValue,
      datum,
      datumError,
      reserveARaw: reserveA,
      reserveBRaw: reserveB,
      lpName: datum ? decodeAscii(datum.lpNameHex) : null,
      blockHeight: row.block_height ?? null,
      blockTime: row.block_time ?? null,
    }
  })

  const evidence = {
    schema: 'immortal-cswap-usdm-pool-readonly-v1',
    classification: 'EXACT_USDM_POOL_UTXO_DISCOVERY_NOT_FULL_CONTRACT_QUALIFICATION',
    network: 'cardano-mainnet',
    source: {
      name: 'CSWAP',
      officialPoolAddress: POOL.poolAddress,
      officialPoolPaymentCredential: POOL.poolPaymentCredential,
      officialCswapLpPolicyId: POOL.lpPolicyId,
      contractRegistry: 'StricaHQ/cardano-contracts-registry projects/cswap.json',
      poolAddressSource: 'cswapsystems/DefiLlama-Adapters projects/cswap-dex/index.js',
      datumParserReference: 'cardananium/cquisitor src/utils/protocols/cswap/cswap.ts',
    },
    exactAsset: USDM,
    startedAt,
    completedAt: new Date().toISOString(),
    status: error ? 'SOURCE_UNAVAILABLE_OR_INCOMPLETE' : 'READ_ONLY_CSWAP_POOL_DISCOVERY_COMPLETE',
    error,
    acquisition: {
      endpoint: '/asset_utxos',
      addressFilter: POOL.poolAddress,
      exactAssetFilter: { policyId: USDM.policyId, assetNameHex: USDM.assetNameHex },
      pageSize: PAGE_SIZE,
      maxPages: MAX_PAGES,
      completePagination,
      pages,
      datumInfo,
    },
    summary: {
      candidateCount: candidates.length,
      officialPaymentCredentialMatches: candidates.filter((x) => x.paymentCredentialMatchesOfficial).length,
      decodedPoolDatumCount: candidates.filter((x) => x.datum && !x.datumError).length,
      usdmQuantityTotalRaw: candidates.reduce((sum, x) => sum + BigInt(x.exactUsdmQuantityRaw), 0n).toString(),
    },
    candidates,
    limitations: [
      'The pool datum parser is based on public reverse-engineered field positions and must be reconciled with official contract behavior before price qualification.',
      'Fee denominator and exact swap arithmetic are not yet verified from the deployed PlutusV3 script; do not infer them from the fee numerator alone.',
      'The pool UTxO exact asset composition, LP policy/name, balance field semantics and reserve/value invariants require further validation.',
      'No price, peg, oracle, EEV or deployment qualification is produced.',
      'Koios read-only queries only; no wallet, signing, transaction submission or chain write.',
    ],
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({ status: evidence.status, output: outPath, summary: evidence.summary, error, completedAt: evidence.completedAt }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'READ_ONLY_CSWAP_OBSERVER_FAILED', error: error instanceof Error ? error.message : String(error) }))
  process.exitCode = 1
})
