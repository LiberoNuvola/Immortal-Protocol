#!/usr/bin/env node
/**
 * First-stage, read-only MuesliSwap AMM pool discovery for exact Moneta USDM.
 * Uses the two official mainnet pool addresses published in the MuesliSwap
 * pool-contract repository. Preserves raw datum JSON/CBOR before decoding.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
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
const POOL_NFT_POLICY_ID = '909133088303c49f3a30f1cc8ed553a73857a29779f6c6561cd8093f'
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

async function fetchPoolNftPage(poolNft, offset) {
  const path = '/asset_utxos?limit=' + PAGE_SIZE + '&offset=' + offset
  const url = KOIOS + path
  const startedAt = new Date().toISOString()
  const response = await fetch(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      _asset_list: [[POOL_NFT_POLICY_ID, poolNft.assetNameHex]],
      _extended: true,
    }),
    signal: AbortSignal.timeout(90_000),
  })
  const rawBody = await response.text()
  const evidence = {
    url, method: 'POST', poolNftUnit: POOL_NFT_POLICY_ID + poolNft.assetNameHex,
    status: response.status, responseDate: response.headers.get('date'),
    startedAt, completedAt: new Date().toISOString(),
    bodyBytes: Buffer.byteLength(rawBody), bodySha256: sha256(rawBody), rawBody,
  }
  if (!response.ok) throw Object.assign(new Error('KOIOS_MUESLI_POOL_NFT_UTXOS_HTTP_' + response.status), { evidence })
  let json
  try { json = JSON.parse(rawBody) } catch {
    throw Object.assign(new Error('KOIOS_MUESLI_POOL_NFT_UTXOS_JSON_INVALID'), { evidence })
  }
  if (!Array.isArray(json)) throw Object.assign(new Error('KOIOS_MUESLI_POOL_NFT_UTXOS_SHAPE_INVALID'), { evidence })
  return { json, evidence }
}
async function fetchDatumInfo(datumHash) {
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
  if (!response.ok) throw Object.assign(new Error('KOIOS_MUESLI_DATUM_INFO_HTTP_' + response.status), { evidence })
  let json
  try { json = JSON.parse(rawBody) } catch {
    throw Object.assign(new Error('KOIOS_MUESLI_DATUM_INFO_JSON_INVALID'), { evidence })
  }
  if (!Array.isArray(json)) throw Object.assign(new Error('KOIOS_MUESLI_DATUM_INFO_SHAPE_INVALID'), { evidence })
  return { json, evidence }
}
async function main() {
  const argv = process.argv.slice(2)
  const outPath = argValue(argv, '--out', 'audit/oracles/muesliswap-usdm-utxos-readonly.json')
  const supercardanoPath = argValue(argv, '--supercardano', 'audit/indexer/supercardano-usdm-readonly.json')
  const startedAt = new Date().toISOString()
  const pages = []
  const candidates = []
  const poolNftUtxos = []
  const datumInfoRequests = []
  let complete = false
  let discovery = null
  let discoveredPoolNfts = []
  const addressCredentials = ADDRESSES.map((target) => ({
    ...target,
    paymentCredential: decodeAddressPaymentCredential(target.address),
  }))
  const uniquePaymentCredentials = [...new Set(addressCredentials.map((x) => x.paymentCredential))]
  if (uniquePaymentCredentials.length !== 1) throw new Error('MUESLI_POOL_ADDRESS_PAYMENT_CREDENTIALS_DIVERGE')
  const poolScriptHash = uniquePaymentCredentials[0]

  try {
    discovery = JSON.parse(await readFile(supercardanoPath, 'utf8'))
    const usdmUnit = USDM.policyId + USDM.assetNameHex
    if (discovery.network !== 'cardano-mainnet' || String(discovery.unit ?? '').toLowerCase() !== usdmUnit) {
      throw new Error('MUESLI_SUPERCARDANO_DISCOVERY_ASSET_OR_NETWORK_MISMATCH')
    }

    discoveredPoolNfts = [...new Set((discovery.pools ?? [])
      .filter((pool) => pool.venue === 'muesliswap' && String(pool.key ?? '').startsWith('muesliswap:'))
      .map((pool) => String(pool.key).slice('muesliswap:'.length).toLowerCase())
      .filter((unit) => unit.length === 120 && unit.slice(0, 56) === POOL_NFT_POLICY_ID)
      .map((unit) => unit.slice(56)))]
    if (discoveredPoolNfts.length === 0) {
      throw new Error('MUESLI_SUPERCARDANO_DISCOVERY_HAS_NO_POOL_NFTS_UNDER_OFFICIAL_POLICY')
    }

    complete = true
    const seenRefs = new Set()
    for (const assetNameHex of discoveredPoolNfts) {
      let nftComplete = false
      for (let offset = 0; offset < PAGE_SIZE * MAX_PAGES; offset += PAGE_SIZE) {
        const page = await fetchPoolNftPage({ assetNameHex }, offset)
        pages.push({ poolNftUnit: POOL_NFT_POLICY_ID + assetNameHex, ...page.evidence })
        for (const row of page.json) {
          const ref = String(row.tx_hash ?? '').toLowerCase() + '#' + String(row.tx_index ?? '')
          if (seenRefs.has(ref)) continue
          seenRefs.add(ref)
          const assets = row.asset_list ?? []
          const nftUnit = POOL_NFT_POLICY_ID + assetNameHex
          const nftAsset = assets.find((asset) =>
            String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase() === nftUnit)
          if (!nftAsset) continue
          const record = {
            requestedPoolNftUnit: nftUnit,
            utxoRef: ref,
            address: row.address ?? null,
            paymentCredential: String(row.payment_cred ?? '').toLowerCase(),
            paymentCredentialMatchesOfficial: String(row.payment_cred ?? '').toLowerCase() === poolScriptHash,
            poolNftQuantityRaw: String(nftAsset.quantity ?? '0'),
            valueLovelaceRaw: String(row.value ?? '0'),
            assets,
            datumHash: row.datum_hash ?? null,
            inlineDatumCborHex: row.inline_datum?.bytes ?? null,
            inlineDatumJson: row.inline_datum?.value ?? null,
            blockHeight: row.block_height ?? null,
            blockTime: row.block_time ?? null,
            epochNo: row.epoch_no ?? null,
          }
          poolNftUtxos.push(record)
          const containsUsdm = assets.some((asset) =>
            String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase() === usdmUnit)
          if (containsUsdm) {
            const addressTarget = addressCredentials.find((target) => target.address === row.address)
            candidates.push({
              ...record,
              addressId: addressTarget?.id ?? 'pool-nft-output-at-unlisted-address',
              exactUsdmQuantityRaw: String(assets.find((asset) =>
                String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase() === usdmUnit)?.quantity ?? '0'),
            })
          }
        }
        if (page.json.length < PAGE_SIZE) {
          nftComplete = true
          break
        }
      }
      if (!nftComplete) {
        complete = false
        throw new Error('KOIOS_MUESLI_POOL_NFT_PAGE_CAP_REACHED_INCOMPLETE:' + assetNameHex)
      }
    }
    // Pool outputs often carry only a datum hash. Resolve those hashes through
    // Koios /datum_info and retain the exact raw response before decoding.
    const uniqueDatumHashes = [...new Set(candidates.map((candidate) => candidate.datumHash).filter(Boolean))]
    const datumByHash = new Map()
    for (const datumHash of uniqueDatumHashes) {
      const response = await fetchDatumInfo(datumHash)
      datumInfoRequests.push(response.evidence)
      const datum = response.json.find((entry) => String(entry.hash ?? entry.datum_hash ?? '').toLowerCase() === datumHash.toLowerCase()) ?? null
      datumByHash.set(datumHash, datum)
    }
    for (const candidate of candidates) {
      const datum = candidate.datumHash ? datumByHash.get(candidate.datumHash) : null
      candidate.resolvedDatumBytes = datum?.bytes ?? null
      candidate.resolvedDatumJson = datum?.value ?? null
      candidate.datumResolutionStatus = datum
        ? 'DATUM_INFO_RESOLVED'
        : candidate.inlineDatumJson ? 'INLINE_DATUM_AVAILABLE' : 'DATUM_INFO_NOT_FOUND'
    }
  } catch (error) {
    complete = false
    const failure = {
      schema: 'immortal-muesliswap-usdm-utxo-acquisition-v2',
      network: 'cardano-mainnet',
      exactAsset: USDM,
      poolNftPolicyId: POOL_NFT_POLICY_ID,
      source: 'Koios Mainnet exact Pool NFT UTxO queries, with discovery from SuperCardano and policy pinned to official Muesli deployment',
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'SOURCE_UNAVAILABLE_OR_INCOMPLETE',
      error: error instanceof Error ? error.message : String(error),
      failedRequest: error?.evidence ?? null,
      discoverySource: discovery ? {
        source: discovery.source,
        startedAt: discovery.startedAt,
        completedAt: discovery.completedAt,
        rawResponses: discovery.rawResponses,
      } : null,
      discoveredPoolNfts,
      officialAddresses: addressCredentials,
      expectedPoolPaymentCredential: poolScriptHash,
      poolNftUtxoCount: poolNftUtxos.length,
      pages,
      poolNftUtxos,
      datumInfoRequests,
      candidates,
    }
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, JSON.stringify(failure, null, 2) + '\n', 'utf8')
    console.error(JSON.stringify({ status: failure.status, error: failure.error, candidateCount: candidates.length }))
    process.exitCode = 1
    return
  }

  const discoveryStatus = candidates.length > 0
    ? 'CURRENT_USDM_POOL_NFT_UTXOS_FOUND'
    : 'NO_CURRENT_USDM_POOL_NFT_UTXOS_FOR_DISCOVERED_POOL_NFTS'
  const evidence = {
    schema: 'immortal-muesliswap-usdm-utxo-acquisition-v2',
    classification: 'RAW_EXACT_USDM_POOL_NFT_UTXO_DISCOVERY_NOT_DATUM_QUALIFICATION',
    network: 'cardano-mainnet',
    exactAsset: USDM,
    poolNftPolicyId: POOL_NFT_POLICY_ID,
    source: 'Koios Mainnet exact Pool NFT UTxO queries, with discovery from SuperCardano and policy pinned to official Muesli deployment',
    officialDeploymentSource: 'MuesliSwapTeam/muesliswap-cardano-pool-contracts dex/plutus/pool.addr, pool_without_stake_key.addr, and nft_policyid',
    startedAt,
    completedAt: new Date().toISOString(),
    status: discoveryStatus,
    discoverySource: {
      name: discovery.source?.name ?? 'SuperCardano',
      startedAt: discovery.startedAt,
      completedAt: discovery.completedAt,
      asOfBlockHeight: discovery.sourceMeta?.asOfBlockHeight ?? discovery.sourceMeta?.token?.asOf?.height ?? null,
      rawResponseHashes: (discovery.rawResponses ?? []).map((x) => x.bodySha256),
    },
    acquisition: {
      endpoint: '/asset_utxos',
      poolNftPolicyId: POOL_NFT_POLICY_ID,
      discoveredPoolNftCount: discoveredPoolNfts.length,
      queriedPoolNftUnits: discoveredPoolNfts.map((assetNameHex) => POOL_NFT_POLICY_ID + assetNameHex),
      exactAssetFilterAppliedLocally: { policyId: USDM.policyId, assetNameHex: USDM.assetNameHex },
      expectedPoolPaymentCredential: poolScriptHash,
      officialAddresses: addressCredentials,
      pageSize: PAGE_SIZE,
      maxPages: MAX_PAGES,
      completePagination: complete,
      poolNftUtxoCount: poolNftUtxos.length,
      datumInfoRequestCount: datumInfoRequests.length,
      rawPages: pages,
      rawDatumInfoResponses: datumInfoRequests,
    },
    summary: {
      discoveredPoolNftCount: discoveredPoolNfts.length,
      poolNftUtxoCount: poolNftUtxos.length,
      candidateCount: candidates.length,
      exactUsdmCandidateCount: candidates.length,
      officialPaymentCredentialMatchCount: candidates.filter((x) => x.paymentCredentialMatchesOfficial).length,
      poolNftQuantityExactlyOneCount: candidates.filter((x) => x.poolNftQuantityRaw === '1').length,
      inlineDatumCount: candidates.filter((x) => x.inlineDatumJson).length,
      datumHashCount: candidates.filter((x) => x.datumHash).length,
      datumInfoResolvedCount: candidates.filter((x) => x.datumResolutionStatus === 'DATUM_INFO_RESOLVED').length,
      distinctAddresses: [...new Set(candidates.map((x) => x.address))].length,
    },
    poolNftUtxos,
    datumInfoRequests,
    candidates,
    limitations: [
      'SuperCardano pool rows are discovery hints only. Each exact Pool NFT unit is re-queried from Koios Mainnet before its current UTxO is recorded.',
      'The Pool NFT policy is pinned to the official MuesliSwap deployment. Each candidate payment credential is compared with the official pool script hash decoded from both official pool addresses.',
      'PoolDatum, LP token, reserve and fee validation are not yet implemented; inline datum JSON/CBOR and hash-resolved datum JSON/CBOR are preserved first.',
      'A SuperCardano pool row without a current Koios UTxO is not counted as a current pool. It may be stale, spent, or associated with an unrecognized script version.',
      'No price, peg, oracle, EEV or deployment qualification is produced.',
      'Read-only public Koios queries only; no wallet, signing, transaction submission or chain write.',
    ],
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: discoveryStatus,
    output: outPath,
    summary: evidence.summary,
    completedAt: evidence.completedAt,
  }, null, 2))
}
main().catch((error) => {
  console.error(JSON.stringify({ status: 'READ_ONLY_MUESLISWAP_UTXO_ACQUISITION_FAILED', error: String(error) }))
  process.exitCode = 1
})
