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
  const utxosResponse = await readJson('/address_utxos', {
    _addresses: [ADDRESS],
    _extended: true,
  })
  if (!Array.isArray(utxosResponse.json)) throw new Error('KOIOS_ADDRESS_UTXOS_SHAPE_INVALID')

  const candidates = utxosResponse.json
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
    schema: 'immortal-minswap-v2-usdm-utxo-observation-v1',
    classification: 'READ_ONLY_UTXO_DISCOVERY_NOT_POOL_DECODING_NOT_ORACLE_QUALIFICATION',
    network: 'cardano-mainnet',
    startedAt,
    completedAt: new Date().toISOString(),
    provider: { name: 'Koios', baseUrl: BASE },
    target: {
      protocol: 'MinswapV2',
      poolValidatorAddress: ADDRESS,
      expectedPoolScriptHash: V2_POOL_SCRIPT_HASH,
      exactAsset: ASSET,
    },
    acquisition: {
      endpoint: '/address_utxos',
      extended: true,
      requestEvidence: utxosResponse.evidence,
      returnedUtxoCount: utxosResponse.json.length,
      exactUsdmCandidateCount: observed.length,
      transactionLookups: txHashes.length,
      transactionContextResponses: Object.fromEntries(Object.entries(txContext).map(([hash, value]) => [hash, value.response])),
    },
    candidates: observed,
    limitations: [
      'The validator address is a discovery boundary; a matching USDM asset does not by itself prove that an output is a valid Minswap V2 pool.',
      'Pool NFT/authentication asset and datum schema must be validated against the deployed V2 contract before reserve fields are accepted.',
      'No datum decoder or reserve interpretation is performed by this script.',
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
