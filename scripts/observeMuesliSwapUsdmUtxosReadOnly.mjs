#!/usr/bin/env node
/**
 * First-stage, read-only MuesliSwap AMM pool discovery for exact Moneta USDM.
 * Uses the two official mainnet pool addresses published in the MuesliSwap
 * pool-contract repository. Preserves raw datum JSON/CBOR before decoding.
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
const ADDRESSES = [
  {
    id: 'muesli-pool-mainnet-stake-address',
    address: 'addr1z9cy2gmar6cpn8yymll93lnd7lw96f27kn2p3eq5d4tjr7rshnr04ple6jjfc0cvcmcpcxmsh576v7j2mjk8tw890vespzvgwd',
  },
  {
    id: 'muesli-pool-mainnet-enterprise-address',
    address: 'addr1w9cy2gmar6cpn8yymll93lnd7lw96f27kn2p3eq5d4tjr7qkh3tzd',
  },
]
const PAGE_SIZE = 1000
const MAX_PAGES = 20

function sha256(raw) {
  return createHash('sha256').update(raw).digest('hex')
}
function argValue(argv, flag, fallback) {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve(fallback)
}
async function fetchAddressPage(address, offset) {
  const url = KOIOS + '/asset_utxos?address=eq.' + encodeURIComponent(address) +
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
  const evidence = {
    url, method: 'POST', status: response.status,
    responseDate: response.headers.get('date'),
    startedAt, completedAt: new Date().toISOString(),
    bodyBytes: Buffer.byteLength(rawBody),
    bodySha256: sha256(rawBody),
    rawBody,
  }
  if (!response.ok) throw Object.assign(new Error('KOIOS_MUESLI_ASSET_UTXOS_HTTP_' + response.status), { evidence })
  let json
  try { json = JSON.parse(rawBody) } catch {
    throw Object.assign(new Error('KOIOS_MUESLI_ASSET_UTXOS_JSON_INVALID'), { evidence })
  }
  if (!Array.isArray(json)) throw Object.assign(new Error('KOIOS_MUESLI_ASSET_UTXOS_SHAPE_INVALID'), { evidence })
  return { json, evidence }
}
async function main() {
  const argv = process.argv.slice(2)
  const outPath = argValue(argv, '--out', 'audit/oracles/muesliswap-usdm-utxos-readonly.json')
  const startedAt = new Date().toISOString()
  const pages = []
  const candidates = []
  const addressResults = []
  let complete = true
  try {
    for (const target of ADDRESSES) {
      const addressStart = candidates.length
      let addressComplete = false
      for (let offset = 0; offset < PAGE_SIZE * MAX_PAGES; offset += PAGE_SIZE) {
        const page = await fetchAddressPage(target.address, offset)
        pages.push({ addressId: target.id, address: target.address, ...page.evidence })
        for (const row of page.json) {
          candidates.push({
            addressId: target.id,
            utxoRef: String(row.tx_hash).toLowerCase() + '#' + String(row.tx_index),
            address: row.address ?? null,
            paymentCredential: row.payment_cred ?? null,
            valueLovelaceRaw: String(row.value ?? '0'),
            assets: row.asset_list ?? [],
            datumHash: row.datum_hash ?? null,
            inlineDatumCborHex: row.inline_datum?.bytes ?? null,
            inlineDatumJson: row.inline_datum?.value ?? null,
            blockHeight: row.block_height ?? null,
            blockTime: row.block_time ?? null,
            epochNo: row.epoch_no ?? null,
          })
        }
        if (page.json.length < PAGE_SIZE) {
          addressComplete = true
          break
        }
      }
      if (!addressComplete) complete = false
      addressResults.push({
        addressId: target.id,
        address: target.address,
        candidateCount: candidates.length - addressStart,
        paginationComplete: addressComplete,
      })
    }
  } catch (error) {
    complete = false
    const failure = {
      schema: 'immortal-muesliswap-usdm-utxo-acquisition-v1',
      network: 'cardano-mainnet',
      exactAsset: USDM,
      source: 'Koios Mainnet exact-asset UTxO query at official MuesliSwap pool addresses',
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'SOURCE_UNAVAILABLE_OR_INCOMPLETE',
      error: error instanceof Error ? error.message : String(error),
      failedRequest: error?.evidence ?? null,
      addressResults,
      pages,
      candidates,
    }
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, JSON.stringify(failure, null, 2) + '\n', 'utf8')
    console.error(JSON.stringify({ status: failure.status, error: failure.error, candidateCount: candidates.length }))
    process.exitCode = 1
    return
  }
  const evidence = {
    schema: 'immortal-muesliswap-usdm-utxo-acquisition-v1',
    classification: 'RAW_EXACT_USDM_POOL_UTXO_DISCOVERY_NOT_DATUM_QUALIFICATION',
    network: 'cardano-mainnet',
    exactAsset: USDM,
    source: 'Koios Mainnet exact-asset UTxO query at official MuesliSwap pool addresses',
    officialDeploymentSource: 'MuesliSwapTeam/muesliswap-cardano-pool-contracts dex/plutus/pool.addr and pool_without_stake_key.addr',
    startedAt,
    completedAt: new Date().toISOString(),
    acquisition: {
      endpoint: '/asset_utxos',
      exactAssetFilter: { policyId: USDM.policyId, assetNameHex: USDM.assetNameHex },
      pageSize: PAGE_SIZE,
      maxPagesPerAddress: MAX_PAGES,
      completePagination: complete,
      addresses: addressResults,
      rawPages: pages,
    },
    summary: {
      candidateCount: candidates.length,
      inlineDatumCount: candidates.filter((x) => x.inlineDatumJson).length,
      datumHashCount: candidates.filter((x) => x.datumHash).length,
      distinctAddresses: [...new Set(candidates.map((x) => x.address))].length,
    },
    candidates,
    limitations: [
      'This first-stage observer captures only exact-USDM UTxOs at the two official MuesliSwap AMM pool addresses.',
      'PoolDatum, pool NFT, LP token, reserve and fee validation are not yet implemented; raw inline datum JSON/CBOR is preserved first.',
      'MuesliSwap API DNS lookup was unavailable in a separate job; this on-chain read is an independent path and does not depend on that API.',
      'No price, peg, oracle, EEV or deployment qualification is produced.',
      'Read-only public Koios queries only; no wallet, signing, transaction submission or chain write.',
    ],
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_MUESLISWAP_USDM_UTXO_ACQUISITION_COMPLETE',
    output: outPath,
    summary: evidence.summary,
    completedAt: evidence.completedAt,
  }, null, 2))
}
main().catch((error) => {
  console.error(JSON.stringify({ status: 'READ_ONLY_MUESLISWAP_UTXO_ACQUISITION_FAILED', error: String(error) }))
  process.exitCode = 1
})
