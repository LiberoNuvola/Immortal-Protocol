#!/usr/bin/env node
/**
 * Read-only Koios observer for exact Moneta USDM candidates at the official
 * Minswap V2 mainnet pool validator address.
 *
 * This is a discovery/evidence collector, NOT a pool datum decoder or price
 * oracle. It preserves raw UTxO/datum bytes and transaction context so a
 * separately reviewed decoder can validate pool identity and reserves.
 *
 * Usage:
 *   KOIOS_MAINNET_URL=https://api.koios.rest/api/v1 node scripts/observeMinswapV2UsdmUtxosReadOnly.mjs
 *   node scripts/observeMinswapV2UsdmUtxosReadOnly.mjs --out audit/oracles/minswap-v2-usdm-utxos.json
 *
 * Network reads only. No wallet, signing, submission, refresh or ledger write.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const BASE = (process.env.KOIOS_MAINNET_URL ?? 'https://api.koios.rest/api/v1').replace(/\/$/, '')
const ADDRESS = 'addr1z84q0denmyep98ph3tmzwsmw0j7zau9ljmsqx6a4rvaau66j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq777e2a'
const ASSET = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
})
const V2_POOL_SCRIPT_HASH = 'ea07b733d932129c378af627436e7cbc2ef0bf96e0036bb51b3bde6b'
// Official deployed/mainnet/script.json: poolAuthenAsset.
const V2_POOL_AUTH_NFT = Object.freeze({
  policyId: 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c',
  assetNameHex: '4d5350',
})
const MAX_TX_LOOKUPS = 500

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex')
const exactUnit = ASSET.policyId + ASSET.assetNameHex

function outputPath(argv) {
  const i = argv.indexOf('--out')
  return i >= 0 && argv[i + 1]
    ? resolve(argv[i + 1])
    : resolve('audit/oracles/minswap-v2-usdm-utxos-readonly.json')
}

async function readJson(path, body) {
  const response = await fetch(BASE + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const raw = await response.text()
  const evidence = {
    url: BASE + path,
    method: body === undefined ? 'GET' : 'POST',
    status: response.status,
    responseDate: response.headers.get('date'),
    bodySha256: sha256(raw),
    rawBody: raw,
  }
  if (!response.ok) throw Object.assign(new Error('KOIOS_HTTP_' + response.status + ' ' + path), { evidence })
  let json
  try { json = JSON.parse(raw) } catch {
    throw Object.assign(new Error('KOIOS_NON_JSON_RESPONSE ' + path), { evidence })
  }
  return { json, evidence }
}

const ADA_POLICY = ''
const ADA_NAME = ''
const MIN_POOL_ADA_LOVELACE = 4_500_000n

function plutusConstr(value, label) {
  if (!value || typeof value !== 'object' || !Number.isInteger(value.constructor) || !Array.isArray(value.fields)) {
    throw new Error('MIN_SWAP_V2_DATUM_INVALID_CONSTR:' + label)
  }
  return value
}

function plutusBytes(value, label) {
  if (!value || typeof value !== 'object' || typeof value.bytes !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value.bytes)) {
    throw new Error('MIN_SWAP_V2_DATUM_INVALID_BYTES:' + label)
  }
  return value.bytes.toLowerCase()
}

function plutusInt(value, label) {
  const raw = value && typeof value === 'object' && value.int !== undefined ? value.int : value
  if (!(typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'bigint') || !/^-?\\d+$/.test(String(raw))) {
    throw new Error('MIN_SWAP_V2_DATUM_INVALID_INT:' + label)
  }
  return BigInt(raw)
}

function decodeV2PoolDatum(value) {
  const root = plutusConstr(value, 'PoolDatum')
  if (root.constructor !== 0 || root.fields.length !== 10) {
    throw new Error('MIN_SWAP_V2_POOL_DATUM_SHAPE_UNSUPPORTED')
  }
  const decodeAsset = (raw, label) => {
    const asset = plutusConstr(raw, label)
    if (asset.constructor !== 0 || asset.fields.length !== 2) throw new Error('MIN_SWAP_V2_ASSET_SHAPE_INVALID:' + label)
    return { policyId: plutusBytes(asset.fields[0], label + '.policyId'), assetNameHex: plutusBytes(asset.fields[1], label + '.assetName') }
  }
  return {
    assetA: decodeAsset(root.fields[1], 'assetA'),
    assetB: decodeAsset(root.fields[2], 'assetB'),
    totalLiquidity: plutusInt(root.fields[3], 'totalLiquidity'),
    reserveA: plutusInt(root.fields[4], 'reserveA'),
    reserveB: plutusInt(root.fields[5], 'reserveB'),
  }
}

function assetUnit(asset) {
  return asset.policyId + asset.assetNameHex
}

function compareBytesHex(a, b) {
  return Buffer.compare(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}

function expectedLpAssetName(assetA, assetB) {
  const hashAsset = (asset) => createHash('sha3-256')
    .update(Buffer.from(assetUnit(asset), 'hex'))
    .digest()
  return createHash('sha3-256')
    .update(Buffer.concat([hashAsset(assetA), hashAsset(assetB)]))
    .digest('hex')
}

function validateV2Candidate(utxo, assets, datumJson) {
  const reasons = []
  let datum = null
  try { datum = decodeV2PoolDatum(datumJson) } catch (error) {
    reasons.push(error instanceof Error ? error.message : String(error))
  }
  const nftUnit = V2_POOL_AUTH_NFT.policyId + V2_POOL_AUTH_NFT.assetNameHex
  const nftQuantity = BigInt(assets.find((a) => a.unit === nftUnit)?.quantityRaw ?? '0')
  if (nftQuantity !== 1n) reasons.push('POOL_AUTH_NFT_QUANTITY_NOT_ONE')
  if (!datum) return { status: 'UNQUALIFIED_DATUM', reasons, datum: null, lpAsset: null }

  const usdmInPair = assetUnit(datum.assetA) === exactUnit || assetUnit(datum.assetB) === exactUnit
  if (!usdmInPair) reasons.push('USDM_NOT_IN_DATUM_ASSET_PAIR')
  if (datum.assetA.policyId === datum.assetB.policyId
    ? compareBytesHex(datum.assetA.assetNameHex, datum.assetB.assetNameHex) >= 0
    : compareBytesHex(datum.assetA.policyId, datum.assetB.policyId) >= 0) {
    reasons.push('DATUM_ASSET_PAIR_NOT_CANONICALLY_SORTED')
  }

  const lpAssetName = expectedLpAssetName(datum.assetA, datum.assetB)
  const lpUnit = V2_POOL_AUTH_NFT.policyId + lpAssetName
  const lpQuantity = BigInt(assets.find((a) => a.unit === lpUnit)?.quantityRaw ?? '0')
  if (lpQuantity <= 0n) reasons.push('DERIVED_LP_ASSET_MISSING_OR_NONPOSITIVE')

  const quantityOf = (unit) => {
    if (unit === ADA_POLICY + ADA_NAME) return BigInt(String(utxo.value ?? '0'))
    return BigInt(assets.find((a) => a.unit === unit)?.quantityRaw ?? '0')
  }
  const amountA = quantityOf(assetUnit(datum.assetA)) -
    (assetUnit(datum.assetA) === ADA_POLICY + ADA_NAME ? MIN_POOL_ADA_LOVELACE : 0n)
  const amountB = quantityOf(assetUnit(datum.assetB)) -
    (assetUnit(datum.assetB) === ADA_POLICY + ADA_NAME ? MIN_POOL_ADA_LOVELACE : 0n)
  if (amountA !== datum.reserveA) reasons.push('RESERVE_A_VALUE_MISMATCH')
  if (amountB !== datum.reserveB) reasons.push('RESERVE_B_VALUE_MISMATCH')
  if (datum.totalLiquidity <= 0n || datum.reserveA <= 0n || datum.reserveB <= 0n) reasons.push('NONPOSITIVE_POOL_DATUM_VALUES')

  return {
    status: reasons.length === 0 ? 'MATCH' : 'UNQUALIFIED',
    reasons,
    datum: {
      assetA: datum.assetA,
      assetB: datum.assetB,
      totalLiquidityRaw: datum.totalLiquidity.toString(),
      reserveARaw: datum.reserveA.toString(),
      reserveBRaw: datum.reserveB.toString(),
    },
    lpAsset: { policyId: V2_POOL_AUTH_NFT.policyId, assetNameHex: lpAssetName, quantityRaw: lpQuantity.toString() },
    valueReserveARaw: amountA.toString(),
    valueReserveBRaw: amountB.toString(),
    poolAuthNftQuantityRaw: nftQuantity.toString(),
  }
}

function assetsFor(utxo) {
  const list = Array.isArray(utxo.asset_list) ? utxo.asset_list : []
  return list.map((asset) => ({
    policyId: String(asset.policy_id ?? '').toLowerCase(),
    assetNameHex: String(asset.asset_name ?? '').toLowerCase(),
    quantityRaw: String(asset.quantity ?? ''),
    unit: String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase(),
  }))
}

async function main() {
  const startedAt = new Date().toISOString()
  // Koios is PostgREST-backed: use explicit limit/offset paging and retain
  // every page's raw response evidence. A full page triggers another request.
  const PAGE_SIZE = 1000
  const MAX_UTXO_PAGES = 20
  const utxoPages = []
  const allUtxos = []
  for (let page = 0; page < MAX_UTXO_PAGES; page += 1) {
    const offset = page * PAGE_SIZE
    const response = await readJson(
      '/address_utxos?limit=' + PAGE_SIZE + '&offset=' + offset,
      { _addresses: [ADDRESS], _extended: true },
    )
    if (!Array.isArray(response.json)) throw new Error('KOIOS_ADDRESS_UTXOS_SHAPE_INVALID')
    utxoPages.push({
      page,
      offset,
      returnedCount: response.json.length,
      response: response.evidence,
    })
    allUtxos.push(...response.json)
    if (response.json.length < PAGE_SIZE) break
    if (page === MAX_UTXO_PAGES - 1) {
      throw new Error('KOIOS_ADDRESS_UTXOS_PAGE_CAP_REACHED_INCOMPLETE')
    }
  }

  const invalidAddressRows = allUtxos.filter((u) =>
    String(u.address ?? '') !== ADDRESS ||
    String(u.payment_cred ?? '').toLowerCase() !== V2_POOL_SCRIPT_HASH
  )
  if (invalidAddressRows.length > 0) {
    throw new Error('KOIOS_V2_VALIDATOR_IDENTITY_MISMATCH:' + invalidAddressRows.length)
  }

  const candidates = allUtxos
    .map((u) => {
      const assets = assetsFor(u)
      const usdm = assets.filter((a) => a.unit === exactUnit)
      return { u, assets, usdm }
    })
    .filter((x) => x.usdm.length > 0)

  const txHashes = [...new Set(candidates.map((x) => String(x.u.tx_hash ?? '').toLowerCase()).filter(Boolean))]
  if (txHashes.length > MAX_TX_LOOKUPS) throw new Error('TX_LOOKUP_SAFETY_LIMIT_EXCEEDED:' + txHashes.length)

  const txContext = {}
  for (const txHash of txHashes) {
    const txResponse = await readJson('/tx_info', { _tx_hashes: [txHash] })
    const rows = Array.isArray(txResponse.json) ? txResponse.json : []
    txContext[txHash] = {
      response: txResponse.evidence,
      transaction: rows.find((x) => String(x.tx_hash ?? '').toLowerCase() === txHash) ?? null,
    }
  }

  const observed = candidates.map(({ u, assets, usdm }) => {
    const txHash = String(u.tx_hash ?? '').toLowerCase()
    const tx = txContext[txHash]?.transaction
    return {
      utxoRef: txHash + '#' + String(u.tx_index),
      address: u.address ?? ADDRESS,
      valueLovelaceRaw: String(u.value ?? ''),
      assets,
      exactUsdmQuantityRaw: usdm[0].quantityRaw,
      poolAuthNftQuantityRaw: assets.find((a) => a.unit === V2_POOL_AUTH_NFT.policyId + V2_POOL_AUTH_NFT.assetNameHex)?.quantityRaw ?? '0',
      poolAuthNftValidated: assets.find((a) => a.unit === V2_POOL_AUTH_NFT.policyId + V2_POOL_AUTH_NFT.assetNameHex)?.quantityRaw === '1',
      datumValidation: validateV2Candidate(u, assets, u.inline_datum?.value ?? null),
      datumHash: u.datum_hash ?? null,
      inlineDatumCborHex: u.inline_datum?.bytes ?? null,
      inlineDatumJson: u.inline_datum?.value ?? null,
      referenceScript: u.reference_script ?? null,
      transactionContext: tx ? {
        txHash: tx.tx_hash ?? txHash,
        blockHash: tx.block_hash ?? null,
        blockHeight: tx.block_height ?? null,
        epochNo: tx.epoch_no ?? null,
        absoluteSlot: tx.absolute_slot ?? tx.slot_no ?? null,
        blockTime: tx.block_time ?? tx.tx_timestamp ?? null,
      } : null,
      qualification: 'USDM_UTXO_CANDIDATE_ONLY_POOL_DATUM_AND_AUTHENTICITY_NOT_YET_VALIDATED',
    }
  })

  const evidence = {
    schema: 'immortal-minswap-v2-usdm-utxo-observation-v2',
    classification: 'READ_ONLY_UTXO_AND_V2_POOL_DATUM_RECONCILIATION_NOT_ORACLE_QUALIFICATION',
    network: 'cardano-mainnet',
    startedAt,
    completedAt: new Date().toISOString(),
    provider: { name: 'Koios', baseUrl: BASE },
    target: {
      protocol: 'MinswapV2',
      poolValidatorAddress: ADDRESS,
      expectedPoolScriptHash: V2_POOL_SCRIPT_HASH,
      expectedPoolAuthenticationNft: V2_POOL_AUTH_NFT,
      exactAsset: ASSET,
    },
    acquisition: {
      endpoint: '/address_utxos',
      extended: true,
      requestEvidence: utxoPages.map((page) => page.response),
      returnedUtxoCount: allUtxos.length,
      validatorIdentityCheck: { expectedPaymentCredential: V2_POOL_SCRIPT_HASH, validatedRows: allUtxos.length, invalidRows: invalidAddressRows.length },
      pagination: { pageSize: PAGE_SIZE, maxPages: MAX_UTXO_PAGES, pages: utxoPages, complete: utxoPages.length > 0 && utxoPages[utxoPages.length - 1].returnedCount < PAGE_SIZE },
      exactUsdmCandidateCount: observed.length,
      transactionLookups: txHashes.length,
      transactionContextResponses: Object.fromEntries(Object.entries(txContext).map(([hash, value]) => [hash, value.response])),
    },
    candidates: observed,
    limitations: [
      'The validator address is a discovery boundary; a matching USDM asset does not by itself prove that an output is a valid Minswap V2 pool.',
      'A candidate is MATCH only when the exact Pool NFT, canonical USDM-containing asset pair, derived LP asset, positive datum values and datum reserve-vs-Value checks all pass.',
      'The decoder supports the published 10-field Minswap V2 PoolDatum constructor shape only; unsupported or missing Koios inline datum JSON fails closed as unqualified.',
      'Koios is one indexed view of the Cardano ledger; optional Blockfrost/Maestro checks remain separate provider observations, not independent market venues.',
      'This output is not a USD/USDM price, peg proof, oracle quote, EEV evidence, or deployment approval.',
      'Only read-only HTTP requests are issued; no wallet, signing, transaction submission, oracle refresh, or chain write occurs.',
    ],
  }

  const out = outputPath(process.argv.slice(2))
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_UTXO_OBSERVATION_COMPLETE',
    output: out,
    candidateCount: observed.length,
    transactionContexts: txHashes.length,
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_UTXO_OBSERVATION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    apiEvidence: error?.evidence ?? null,
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
