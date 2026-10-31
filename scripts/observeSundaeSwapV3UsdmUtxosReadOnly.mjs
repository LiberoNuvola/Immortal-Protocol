#!/usr/bin/env node
/**
 * Read-only acquisition of SundaeSwap V3 pool UTxOs containing exact Moneta USDM.
 * This first-stage observer preserves raw inline datum JSON/CBOR. It deliberately
 * does not decode or qualify pool state until a real Koios fixture is reviewed.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { SUNDAE_V3_POOL_SCRIPT_HASH, validateSundaeV3PoolUtxo, reconcileSundaeV3PoolWithApi } from './lib/sundaeV3PoolDatum.mjs'
import { dirname, resolve } from 'node:path'

const KOIOS = 'https://api.koios.rest/api/v1'
const USDM = {
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
}
const V3_POOL_SCRIPT_HASH = 'e0302560ced2fdcbfcb2602697df970cd0d6a38f94b32703f51c312b'
const PAGE_SIZE = 1000
const MAX_PAGES = 20

function sha256(raw) {
  return createHash('sha256').update(raw).digest('hex')
}
function argValue(argv, flag, fallback) {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve(fallback)
}
function quantityOf(row, unit) {
  const asset = (row.asset_list ?? []).find((a) =>
    String(a.policy_id ?? '').toLowerCase() + String(a.asset_name ?? '').toLowerCase() === unit)
  return BigInt(String(asset?.quantity ?? '0'))
}
async function requestPage(offset) {
  const url = KOIOS + '/asset_utxos?payment_cred=eq.' + V3_POOL_SCRIPT_HASH +
    '&limit=' + PAGE_SIZE + '&offset=' + offset
  const startedAt = new Date().toISOString()
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      _asset_list: [[USDM.policyId, USDM.assetNameHex]],
      _extended: true,
    }),
    signal: AbortSignal.timeout(45_000),
  })
  const rawBody = await response.text()
  const completedAt = new Date().toISOString()
  const evidence = {
    url, method: 'POST', status: response.status,
    responseDate: response.headers.get('date'),
    startedAt, completedAt,
    bodyBytes: Buffer.byteLength(rawBody),
    bodySha256: sha256(rawBody),
    rawBody,
  }
  if (!response.ok) throw Object.assign(new Error('KOIOS_ASSET_UTXOS_HTTP_' + response.status), { evidence })
  let json
  try { json = JSON.parse(rawBody) } catch {
    throw Object.assign(new Error('KOIOS_ASSET_UTXOS_JSON_INVALID'), { evidence })
  }
  if (!Array.isArray(json)) throw Object.assign(new Error('KOIOS_ASSET_UTXOS_SHAPE_INVALID'), { evidence })
  return { json, evidence }
}

async function main() {
  const argv = process.argv.slice(2)
  const outPath = argValue(argv, '--out', 'audit/oracles/sundaeswap-v3-usdm-utxos-readonly.json')
  const apiPath = argValue(argv, '--api', 'audit/api/sundaeswap-usdm-readonly.json')
  const startedAt = new Date().toISOString()
  const pages = []
  const rows = []
  let complete = false
  try {
    for (let offset = 0; offset < PAGE_SIZE * MAX_PAGES; offset += PAGE_SIZE) {
      const page = await requestPage(offset)
      pages.push(page.evidence)
      rows.push(...page.json)
      if (page.json.length < PAGE_SIZE) {
        complete = true
        break
      }
    }
    if (!complete) throw new Error('KOIOS_SUNDAE_V3_PAGE_CAP_REACHED_INCOMPLETE')
  } catch (error) {
    const failure = {
      schema: 'immortal-sundaeswap-v3-usdm-utxo-acquisition-v1',
      network: 'cardano-mainnet',
      exactAsset: USDM,
      poolScriptHash: V3_POOL_SCRIPT_HASH,
      source: 'Koios Mainnet exact-asset UTxO query',
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'SOURCE_UNAVAILABLE_OR_INCOMPLETE',
      error: error instanceof Error ? error.message : String(error),
      failedRequest: error?.evidence ?? null,
      pages,
      candidateCount: rows.length,
      candidates: rows,
    }
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, JSON.stringify(failure, null, 2) + '\n', 'utf8')
    console.error(JSON.stringify({ status: failure.status, error: failure.error, candidateCount: rows.length }))
    process.exitCode = 1
    return
  }

  const usdmUnit = USDM.policyId + USDM.assetNameHex
  const apiEvidence = JSON.parse(await readFile(apiPath, 'utf8'))
  if (apiEvidence.network !== 'cardano-mainnet' || apiEvidence.exactAsset?.policyId !== USDM.policyId ||
      apiEvidence.exactAsset?.assetNameHex !== USDM.assetNameHex) throw new Error('SUNDAE_API_ASSET_OR_NETWORK_MISMATCH')
  const apiV3Anchor = (apiEvidence.protocolValidatorAnchors ?? []).find((x) => x.version === 'V3')
  const apiV3PoolHash = apiV3Anchor?.validators?.find((x) => x.title === 'pool.spend')?.hash
  if (apiV3PoolHash !== SUNDAE_V3_POOL_SCRIPT_HASH) throw new Error('SUNDAE_API_V3_SCRIPT_HASH_MISMATCH')
  const apiV3Pools = (apiEvidence.pools ?? []).filter((pool) => pool.version === 'V3')
  const candidates = rows.map((row) => ({
    utxoRef: String(row.tx_hash).toLowerCase() + '#' + String(row.tx_index),
    address: row.address ?? null,
    paymentCredential: String(row.payment_cred ?? '').toLowerCase(),
    paymentCredentialMatchesOfficial: String(row.payment_cred ?? '').toLowerCase() === V3_POOL_SCRIPT_HASH,
    valueLovelaceRaw: String(row.value ?? '0'),
    exactUsdmQuantityRaw: quantityOf(row, usdmUnit).toString(),
    assets: row.asset_list ?? [],
    datumHash: row.datum_hash ?? null,
    inlineDatumCborHex: row.inline_datum?.bytes ?? null,
    inlineDatumJson: row.inline_datum?.value ?? null,
    referenceScript: row.reference_script ?? null,
    blockHeight: row.block_height ?? null,
    blockTime: row.block_time ?? null,
    epochNo: row.epoch_no ?? null,
  })).map((candidate) => {
    const datumValidation = validateSundaeV3PoolUtxo(candidate)
    const apiPool = datumValidation.datum
      ? apiV3Pools.find((pool) => String(pool.id).toLowerCase() === datumValidation.datum.identifier)
      : null
    const apiReconciliation = reconcileSundaeV3PoolWithApi(datumValidation, apiPool)
    return { ...candidate, datumValidation, apiReconciliation }
  })
  const matchedPoolIds = new Set(candidates
    .filter((candidate) => candidate.datumValidation.status === 'MATCH')
    .map((candidate) => candidate.datumValidation.datum.identifier))
  const apiOnlyPoolIds = apiV3Pools.filter((pool) => !matchedPoolIds.has(String(pool.id).toLowerCase()))
    .map((pool) => pool.id)
  const evidence = {
    schema: 'immortal-sundaeswap-v3-usdm-utxo-acquisition-v1',
    classification: 'SUNDAESWAP_V3_POOL_DATUM_VALUE_AND_API_RECONCILIATION_NOT_PRICE_QUALIFICATION',
    network: 'cardano-mainnet',
    exactAsset: USDM,
    poolScriptHash: V3_POOL_SCRIPT_HASH,
    source: 'Koios Mainnet exact-asset UTxO query + same-run official SundaeSwap API',
    startedAt,
    completedAt: new Date().toISOString(),
    acquisition: {
      endpoint: '/asset_utxos',
      queryFilter: { payment_cred: 'eq.' + V3_POOL_SCRIPT_HASH },
      exactAssetFilter: { policyId: USDM.policyId, assetNameHex: USDM.assetNameHex },
      pageSize: PAGE_SIZE,
      pageCount: pages.length,
      completePagination: complete,
      rawPages: pages,
    },
    apiSource: {
      startedAt: apiEvidence.startedAt,
      completedAt: apiEvidence.completedAt,
      exactUsdmPoolCount: apiEvidence.exactUsdmPoolCount,
      v3PoolCount: apiV3Pools.length,
      queryEvidence: apiEvidence.queryEvidence,
    },
    summary: {
      rowCount: rows.length,
      paymentCredentialMatchCount: candidates.filter((x) => x.paymentCredentialMatchesOfficial).length,
      inlineDatumCount: candidates.filter((x) => x.inlineDatumJson).length,
      datumHashCount: candidates.filter((x) => x.datumHash).length,
      structuralMatchCount: candidates.filter((x) => x.datumValidation.status === 'MATCH').length,
      unqualifiedCount: candidates.filter((x) => x.datumValidation.status !== 'MATCH').length,
      apiMatchedCount: candidates.filter((x) => x.apiReconciliation.status === 'MATCH').length,
      apiMismatchCount: candidates.filter((x) => x.apiReconciliation.status !== 'MATCH').length,
      apiV3PoolCount: apiV3Pools.length,
      apiOnlyPoolCount: apiOnlyPoolIds.length,
    },
    apiOnlyPoolIds,
    candidates,
    limitations: [
      'This observer only captures exact-USDM UTxOs at the official SundaeSwap V3 pool payment script hash.',
      'The strict V3 PoolDatum decoder validates the 8-field datum, CIP-68 222 pool NFT, canonical asset pair, exact USDM, protocol-fee treatment and exact pool Value composition.',
      'Same-run official API reconciliation checks pool identifier, CIP-68 333 LP asset identity, pair, reserve quantities and circulating LP supply.',
      'No price, peg, oracle, EEV or deployment qualification is produced.',
      'Read-only public Koios query only; no wallet, signing, transaction submission or chain write.',
    ],
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_SUNDAESWAP_V3_USDM_RECONCILIATION_COMPLETE',
    output: outPath,
    summary: evidence.summary,
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_SUNDAESWAP_V3_UTXO_ACQUISITION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
