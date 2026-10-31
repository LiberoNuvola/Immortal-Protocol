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
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function sha256(raw) {
  return createHash('sha256').update(raw).digest('hex')
}
function argValue(argv, flag, fallback) {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve(fallback)
}

function bech32Polymod(values) {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i++) {
      if ((top >>> i) & 1) checksum ^= BECH32_GENERATORS[i]
    }
  }
  return checksum >>> 0
}
function decodeAddressPaymentCredential(address) {
  const lower = address.toLowerCase()
  const separator = lower.lastIndexOf('1')
  if (separator < 1) throw new Error('MUESLI_ADDRESS_BECH32_SEPARATOR_INVALID')
  const hrp = lower.slice(0, separator)
  const chars = lower.slice(separator + 1)
  const words = [...chars].map((char) => {
    const index = BECH32_CHARSET.indexOf(char)
    if (index < 0) throw new Error('MUESLI_ADDRESS_BECH32_CHAR_INVALID')
    return index
  })
  const expanded = [
    ...[...hrp].map((char) => char.charCodeAt(0) >>> 5),
    0,
    ...[...hrp].map((char) => char.charCodeAt(0) & 31),
  ]
  if (bech32Polymod([...expanded, ...words]) !== 1) throw new Error('MUESLI_ADDRESS_BECH32_CHECKSUM_INVALID')
  const data = words.slice(0, -6)
  let accumulator = 0
  let bits = 0
  const bytes = []
  for (const word of data) {
    accumulator = (accumulator << 5) | word
    bits += 5
    while (bits >= 8) {
      bits -= 8
      bytes.push((accumulator >>> bits) & 255)
    }
  }
  const raw = Buffer.from(bytes)
  if (raw.length < 29) throw new Error('MUESLI_ADDRESS_LENGTH_INVALID')
  const addressType = raw[0] >>> 4
  const networkId = raw[0] & 15
  if (![1, 3, 5, 7].includes(addressType) || networkId !== 1) {
    throw new Error('MUESLI_ADDRESS_NOT_MAINNET_SCRIPT_CREDENTIAL')
  }
  return raw.subarray(1, 29).toString('hex')
}

async function fetchAddressPage(scriptHash, offset) {
  const url = KOIOS + '/script_utxos?script_hash=eq.' + scriptHash +
    '&limit=' + PAGE_SIZE + '&offset=' + offset + '&extended=true'
  const startedAt = new Date().toISOString()
  const response = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(90_000),
  })
  const rawBody = await response.text()
  const evidence = {
    url, method: 'GET', status: response.status,
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
  let complete = false
  const addressCredentials = ADDRESSES.map((target) => ({
    ...target,
    paymentCredential: decodeAddressPaymentCredential(target.address),
  }))
  const uniquePaymentCredentials = [...new Set(addressCredentials.map((x) => x.paymentCredential))]
  if (uniquePaymentCredentials.length !== 1) throw new Error('MUESLI_POOL_ADDRESS_PAYMENT_CREDENTIALS_DIVERGE')
  const poolScriptHash = uniquePaymentCredentials[0]
  const scriptRows = []
  try {
    for (let offset = 0; offset < PAGE_SIZE * MAX_PAGES; offset += PAGE_SIZE) {
      const page = await fetchAddressPage(poolScriptHash, offset)
      pages.push(page.evidence)
      scriptRows.push(...page.json)
      if (page.json.length < PAGE_SIZE) {
        complete = true
        break
      }
    }
    if (!complete) throw new Error('KOIOS_MUESLI_SCRIPT_UTXOS_PAGE_CAP_REACHED_INCOMPLETE')
    const usdmUnit = USDM.policyId + USDM.assetNameHex
    for (const row of scriptRows) {
      const containsUsdm = (row.asset_list ?? []).some((asset) =>
        String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase() === usdmUnit)
      if (!containsUsdm) continue
      const addressTarget = addressCredentials.find((target) => target.address === row.address)
      candidates.push({
        addressId: addressTarget?.id ?? 'same-pool-script-other-address',
        utxoRef: String(row.tx_hash).toLowerCase() + '#' + String(row.tx_index),
        address: row.address ?? null,
        paymentCredential: String(row.payment_cred ?? '').toLowerCase(),
        paymentCredentialMatchesOfficial: String(row.payment_cred ?? '').toLowerCase() === poolScriptHash,
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
  } catch (error) {
    complete = false
    const failure = {
      schema: 'immortal-muesliswap-usdm-utxo-acquisition-v1',
      network: 'cardano-mainnet',
      exactAsset: USDM,
      source: 'Koios Mainnet script UTxO query at official MuesliSwap pool payment credential',
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'SOURCE_UNAVAILABLE_OR_INCOMPLETE',
      error: error instanceof Error ? error.message : String(error),
      failedRequest: error?.evidence ?? null,
      officialAddresses: addressCredentials,
      poolScriptHash,
      scriptUtxoCount: scriptRows.length,
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
    source: 'Koios Mainnet script UTxO query at official MuesliSwap pool payment credential',
    officialDeploymentSource: 'MuesliSwapTeam/muesliswap-cardano-pool-contracts dex/plutus/pool.addr and pool_without_stake_key.addr',
    startedAt,
    completedAt: new Date().toISOString(),
    acquisition: {
      endpoint: '/script_utxos',
      scriptHashFilter: poolScriptHash,
      exactAssetFilterAppliedLocally: { policyId: USDM.policyId, assetNameHex: USDM.assetNameHex },
      pageSize: PAGE_SIZE,
      maxPages: MAX_PAGES,
      completePagination: complete,
      officialAddresses: addressCredentials,
      scriptUtxoCount: scriptRows.length,
      rawPages: pages,
    },
    summary: {
      candidateCount: candidates.length,
      scriptUtxoCount: scriptRows.length,
      paymentCredentialMatchCount: candidates.filter((x) => x.paymentCredentialMatchesOfficial).length,
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
