import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { Data } from '@lucid-evolution/lucid'

const KOIOS = (process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1').replace(/\/$/, '')
const OUTPUT = process.env.PREPROD_CHARLI3_OBSERVATION_PATH ??
  'audit/preprod-evidence/charli3-preprod-feed-observation.json'

const FEEDS = [
  {
    pair: 'USDM/USD',
    baseSymbol: 'USDM',
    quoteSymbol: 'USD',
    address: 'addr_test1wr0q3fr83cr0zv4gfdvzcquqzy242hgmvt7ey2d938rtwugyc76x9',
    policyId: '424f268a65632944ddfe17967208178082058cbe9044f53aee28697d',
    tokenNameHex: '4f7261636c6546656564',
    documentedMaxAgeMs: 3_600_000n,
    documentedFrequencyMs: 3_600_000n,
    documentedSignatoriesPool: 2,
    documentedRequiredSignatories: 1,
  },
  {
    pair: 'ADA/USD',
    baseSymbol: 'ADA',
    quoteSymbol: 'USD',
    address: 'addr_test1wzn5ee2qaqvly3hx7e0nk3vhm240n5muq3plhjcnvx9ppjgf62u6a',
    policyId: '1116903479e7320b8e4592207aaebf627898267fcd80e2d9646cbf07',
    tokenNameHex: '4f7261636c6546656564',
    documentedMaxAgeMs: 1_800_000n,
    documentedFrequencyMs: 1_800_000n,
    documentedSignatoriesPool: 1,
    documentedRequiredSignatories: 1,
  },
]

const OFFICIAL_CONFIG_URL = 'https://docs.charli3.io/oracles/resources/networks/preprod'
const DATUM_SPEC_URL = 'https://docs.charli3.io/oracles/overview/datum-standard'

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function hashJson(value) {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item), 'utf8')
    .digest('hex')
}

function normalizeData(value, depth = 0) {
  if (depth > 32) return { kind: 'blocked', reason: 'MAX_DATUM_NESTING_DEPTH' }
  if (value === null || value === undefined) return null
  if (typeof value === 'bigint') return { kind: 'integer', value: value.toString() }
  if (typeof value === 'number') {
    return Number.isSafeInteger(value)
      ? { kind: 'integer', value: String(value) }
      : { kind: 'number', value: String(value) }
  }
  if (typeof value === 'string') return { kind: 'text', value }
  if (typeof value === 'boolean') return { kind: 'boolean', value }
  if (value instanceof Uint8Array) {
    return { kind: 'bytes', hex: Buffer.from(value).toString('hex') }
  }
  if (Array.isArray(value)) return { kind: 'list', items: value.map(item => normalizeData(item, depth + 1)) }
  if (value instanceof Map) {
    return {
      kind: 'map',
      entries: [...value.entries()].map(([key, val]) => [
        normalizeData(key, depth + 1),
        normalizeData(val, depth + 1),
      ]),
    }
  }
  if (typeof value === 'object') {
    const constructorIndex =
      Number.isInteger(value.index) ? value.index :
      Number.isInteger(value.constr) ? value.constr :
      Number.isInteger(value.constructor) ? value.constructor :
      null
    if (constructorIndex !== null && Array.isArray(value.fields)) {
      return {
        kind: 'constructor',
        index: constructorIndex,
        fields: value.fields.map(item => normalizeData(item, depth + 1)),
      }
    }
    if (Array.isArray(value.map)) {
      return {
        kind: 'map',
        entries: value.map.map(pair => {
          if (Array.isArray(pair)) return [
            normalizeData(pair[0], depth + 1),
            normalizeData(pair[1], depth + 1),
          ]
          return [
            normalizeData(pair?.k, depth + 1),
            normalizeData(pair?.v, depth + 1),
          ]
        }),
      }
    }
    if (Array.isArray(value.list)) {
      return { kind: 'list', items: value.list.map(item => normalizeData(item, depth + 1)) }
    }
    if ('int' in value) return { kind: 'integer', value: String(value.int) }
    if (typeof value.bytes === 'string') return { kind: 'bytes', hex: value.bytes.toLowerCase() }
    return {
      kind: 'object',
      fields: Object.fromEntries(Object.entries(value)
        .filter(([key]) => key !== 'constructor')
        .map(([key, val]) => [key, normalizeData(val, depth + 1)])),
    }
  }
  return { kind: 'unsupported', type: typeof value }
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return
  visit(node)
  if (node.kind === 'constructor') for (const field of node.fields ?? []) walk(field, visit)
  else if (node.kind === 'list') for (const item of node.items ?? []) walk(item, visit)
  else if (node.kind === 'map') {
    for (const [key, val] of node.entries ?? []) {
      walk(key, visit)
      walk(val, visit)
    }
  } else if (node.kind === 'object') {
    for (const value of Object.values(node.fields ?? {})) walk(value, visit)
  }
}

function intValue(node) {
  if (node?.kind !== 'integer' || !/^-?\d+$/.test(node.value)) return null
  try { return BigInt(node.value) } catch { return null }
}

function mapValue(mapNode, key) {
  if (mapNode?.kind !== 'map') return null
  const found = mapNode.entries.find(([k]) => intValue(k) === BigInt(key))
  return found ? found[1] : null
}

function bytesHex(node) {
  if (node?.kind === 'bytes' && typeof node.hex === 'string') return node.hex.toLowerCase()
  return null
}

function bytesText(node) {
  const hex = bytesHex(node)
  if (hex === null || hex.length % 2 !== 0) return null
  const bytes = Buffer.from(hex, 'hex')
  const text = bytes.toString('utf8')
  return Buffer.from(text, 'utf8').equals(bytes) && /^[\x20-\x7e]*$/.test(text)
    ? text
    : null
}

function scaleDecimal(integer, precision) {
  if (integer === null || precision === null || precision < 0n || precision > 18n) return null
  const negative = integer < 0n
  const raw = (negative ? -integer : integer).toString()
  if (precision === 0n) return (negative ? '-' : '') + raw
  const digits = raw.padStart(Number(precision) + 1, '0')
  const split = digits.length - Number(precision)
  return (negative ? '-' : '') + digits.slice(0, split) + '.' + digits.slice(split)
}

function timestampToMs(raw) {
  if (raw === null || raw < 0n) return { timestampMs: null, unit: 'INVALID_OR_MISSING' }
  // Plutus POSIXTime is commonly represented in milliseconds. Charli3's
  // documentation also contains a seconds-shaped example, so preserve and
  // explicitly report the magnitude-based normalization rather than hiding it.
  if (raw >= 1_000_000_000_000n && raw < 100_000_000_000_000n) {
    return { timestampMs: raw, unit: 'MILLISECONDS_MAGNITUDE' }
  }
  if (raw >= 1_000_000_000n && raw < 1_000_000_000_000n) {
    return { timestampMs: raw * 1_000n, unit: 'SECONDS_MAGNITUDE' }
  }
  return { timestampMs: null, unit: 'AMBIGUOUS_MAGNITUDE' }
}

function findPriceMaps(normalized) {
  const found = []
  walk(normalized, node => {
    if (node.kind === 'constructor' && node.index === 2 &&
        node.fields?.length === 1 && node.fields[0]?.kind === 'map') {
      found.push(node.fields[0])
    }
  })
  return found
}

function findExtendedMaps(normalized) {
  const found = []
  walk(normalized, node => {
    if (node.kind === 'constructor' && node.index === 1 &&
        node.fields?.length === 1 && node.fields[0]?.kind === 'map') {
      found.push(node.fields[0])
    }
  })
  return found
}

function decodeFeed(datumHex, feed, tipMs) {
  if (typeof datumHex !== 'string' || !/^(?:[0-9a-fA-F]{2})+$/.test(datumHex)) {
    return { status: 'BLOCKED_DATUM_MISSING_OR_INVALID_CBOR', blockers: ['DATUM_MISSING_OR_INVALID_CBOR'] }
  }

  let decoded
  try {
    decoded = Data.from(datumHex)
  } catch (error) {
    return {
      status: 'BLOCKED_DATUM_DECODE_FAILED',
      blockers: ['DATUM_DECODE_FAILED'],
      decoderError: error instanceof Error ? error.message : String(error),
      datumCborSha256: sha256(Buffer.from(datumHex, 'hex')),
      datumCborHex: datumHex.toLowerCase(),
    }
  }

  const normalized = normalizeData(decoded)
  const priceMaps = findPriceMaps(normalized)
  const extendedMaps = findExtendedMaps(normalized)
  const priceRecords = priceMaps.map((map, index) => {
    const rawPrice = intValue(mapValue(map, 0))
    const rawTimestamp = intValue(mapValue(map, 1))
    const rawExpiry = intValue(mapValue(map, 2))
    const precision = intValue(mapValue(map, 3))
    const baseId = bytesHex(mapValue(map, 4))
    const quoteId = bytesHex(mapValue(map, 5))
    const baseSymbol = bytesText(mapValue(map, 6))
    const quoteSymbol = bytesText(mapValue(map, 7))
    const baseName = bytesText(mapValue(map, 8))
    const quoteName = bytesText(mapValue(map, 9))
    const timestamp = timestampToMs(rawTimestamp)
    const expiry = timestampToMs(rawExpiry)
    const ageMs = timestamp.timestampMs === null ? null : tipMs - timestamp.timestampMs
    const notFuture = ageMs !== null && ageMs >= 0n
    const fresh = notFuture && ageMs <= feed.documentedMaxAgeMs
    const notExpired = expiry.timestampMs !== null && expiry.timestampMs > tipMs
    const pairMatches = baseSymbol === feed.baseSymbol && quoteSymbol === feed.quoteSymbol
    const positivePrice = rawPrice !== null && rawPrice > 0n
    const validPrecision = precision !== null && precision >= 0n && precision <= 18n
    const blockers = []
    if (rawPrice === null) blockers.push('MISSING_OR_NON_INTEGER_PRICE')
    else if (!positivePrice) blockers.push('NONPOSITIVE_PRICE')
    if (rawTimestamp === null) blockers.push('MISSING_TIMESTAMP')
    else if (timestamp.timestampMs === null) blockers.push('AMBIGUOUS_TIMESTAMP_MAGNITUDE')
    else if (!notFuture) blockers.push('FUTURE_TIMESTAMP')
    else if (!fresh) blockers.push('STALE_TIMESTAMP')
    if (rawExpiry === null) blockers.push('MISSING_EXPIRY')
    else if (expiry.timestampMs === null) blockers.push('AMBIGUOUS_EXPIRY_MAGNITUDE')
    else if (!notExpired) blockers.push('EXPIRED_PRICE_RECORD')
    if (!validPrecision) blockers.push('MISSING_OR_UNSUPPORTED_PRECISION')
    if (!pairMatches) blockers.push('EXPECTED_BASE_QUOTE_SYMBOLS_NOT_MATCHED')
    return {
      index,
      rawPrice: rawPrice?.toString() ?? null,
      precision: precision?.toString() ?? null,
      exactDecimalText: validPrecision && positivePrice ? scaleDecimal(rawPrice, precision) : null,
      baseId,
      quoteId,
      baseSymbol,
      quoteSymbol,
      baseName,
      quoteName,
      priceDirection: baseSymbol && quoteSymbol ? quoteSymbol + ' per ' + baseSymbol : null,
      rawTimestamp: rawTimestamp?.toString() ?? null,
      timestampInterpretation: timestamp.unit,
      timestampMs: timestamp.timestampMs?.toString() ?? null,
      ageMs: ageMs?.toString() ?? null,
      freshWithinDocumentedWindow: Boolean(fresh),
      rawExpiry: rawExpiry?.toString() ?? null,
      expiryInterpretation: expiry.unit,
      expiryMs: expiry.timestampMs?.toString() ?? null,
      notExpiredAtChainTip: Boolean(notExpired),
      pairIdentityMatchesOfficialFeed: pairMatches,
      positivePrice,
      blockers,
    }
  })

  const matches = priceRecords.filter(record =>
    record.baseSymbol === feed.baseSymbol && record.quoteSymbol === feed.quoteSymbol,
  )
  const allExtendedFields = extendedMaps.map(map => ({
    providerId: intValue(mapValue(map, 0))?.toString() ?? null,
    dataSourceCount: intValue(mapValue(map, 1))?.toString() ?? null,
    dataSignatoriesCount: intValue(mapValue(map, 2))?.toString() ?? null,
    providerSignature: bytesText(mapValue(map, 3)),
  }))

  const blockers = []
  if (matches.length !== 1) blockers.push(matches.length === 0 ? 'EXPECTED_PRICE_PAIR_NOT_FOUND' : 'DUPLICATE_EXPECTED_PRICE_PAIR')
  else blockers.push(...matches[0].blockers)
  if (allExtendedFields.length === 0) blockers.push('EXTENDED_PROVIDER_AND_SIGNATORY_METADATA_NOT_FOUND')
  return {
    status: 'OBSERVED_NOT_QUALIFIED',
    datumCborSha256: sha256(Buffer.from(datumHex, 'hex')),
    datumCborHex: datumHex.toLowerCase(),
    normalizedDatum: normalized,
    priceRecords,
    extendedMetadata: allExtendedFields,
    expectedPair: { baseSymbol: feed.baseSymbol, quoteSymbol: feed.quoteSymbol, direction: feed.quoteSymbol + ' per ' + feed.baseSymbol },
    expectedPairMatchCount: matches.length,
    freshnessPolicy: {
      documentedMaxAgeMs: feed.documentedMaxAgeMs.toString(),
      documentedFrequencyMs: feed.documentedFrequencyMs.toString(),
      timestampInterpretationRule: 'Magnitude normalization is reported explicitly; the datum remains unqualified until units are confirmed from the deployed validator/decoder contract.',
    },
    blockers,
  }
}

async function koiosGetTip() {
  const response = await fetch(KOIOS + '/tip', { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error('KOIOS_TIP_HTTP_' + response.status)
  const raw = await response.json()
  const tip = Array.isArray(raw) ? raw[0] : raw?.data ?? raw
  const blockTime = Number(tip?.block_time)
  const blockNo = Number(tip?.block_no)
  if (!Number.isSafeInteger(blockTime) || blockTime <= 0 || !Number.isSafeInteger(blockNo)) {
    throw new Error('KOIOS_TIP_MALFORMED')
  }
  return {
    blockTime: String(blockTime),
    blockTimeMs: BigInt(blockTime) * 1_000n,
    blockNo,
    blockHash: String(tip.hash ?? tip.block_hash ?? '').toLowerCase(),
    absSlot: String(tip.abs_slot ?? ''),
    era: tip.era ?? null,
  }
}

async function observeFeed(feed, tip, observedAt) {
  try {
    const response = await fetch(KOIOS + '/address_info', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ _addresses: [feed.address] }),
    })
    if (!response.ok) throw new Error('KOIOS_ADDRESS_INFO_HTTP_' + response.status)
    const rows = await response.json()
    const info = rows?.find(row => row?.address === feed.address)
    if (!info || !Array.isArray(info.utxo_set)) {
      return {
        pair: feed.pair,
        status: 'BLOCKED_EXACT_ADDRESS_NOT_OBSERVED',
        address: feed.address,
        officialIdentity: { policyId: feed.policyId, tokenNameHex: feed.tokenNameHex },
        blockers: ['EXACT_FEED_ADDRESS_NOT_RETURNED_BY_KOIOS'],
      }
    }

    const exactUnit = feed.policyId + feed.tokenNameHex
    const matches = info.utxo_set.filter(utxo => {
      const assets = utxo.asset_list ?? []
      return assets.some(asset =>
        String(asset.policy_id ?? '').toLowerCase() === feed.policyId &&
        String(asset.asset_name ?? '').toLowerCase() === feed.tokenNameHex &&
        BigInt(asset.quantity) === 1n,
      )
    })
    const base = {
      pair: feed.pair,
      address: feed.address,
      officialIdentity: {
        feedNftUnit: exactUnit,
        policyId: feed.policyId,
        tokenNameHex: feed.tokenNameHex,
        sourceReference: OFFICIAL_CONFIG_URL,
        datumSpecReference: DATUM_SPEC_URL,
      },
      configuredNetwork: 'cardano-preprod',
      chainTip: { blockNo: tip.blockNo, blockHash: tip.blockHash, absSlot: tip.absSlot, blockTime: tip.blockTime, era: tip.era },
      observedAt,
      exactFeedNftUtxoCount: matches.length,
      officialFeedMetadata: {
        documentedMaxAgeMs: feed.documentedMaxAgeMs.toString(),
        documentedFrequencyMs: feed.documentedFrequencyMs.toString(),
        signatoriesPool: feed.documentedSignatoriesPool,
        requiredSignatories: feed.documentedRequiredSignatories,
        note: 'These parameters are transcribed from the linked official Preprod documentation. The observation itself does not verify that the provider is still operating.',
      },
    }
    if (matches.length !== 1) {
      return {
        ...base,
        status: 'BLOCKED_FEED_NFT_NOT_UNIQUE',
        blockers: [matches.length === 0 ? 'FEED_NFT_NOT_PRESENT_AT_DOCUMENTED_ADDRESS' : 'MULTIPLE_FEED_NFT_UTXOS_AT_DOCUMENTED_ADDRESS'],
        unrelatedUtxoCountAtAddress: info.utxo_set.length,
      }
    }

    const utxo = matches[0]
    const datumHex = utxo.inline_datum?.bytes
    const outRefValid = /^[0-9a-fA-F]{64}$/.test(String(utxo.tx_hash ?? '')) &&
      Number.isInteger(Number(utxo.tx_index)) && Number(utxo.tx_index) >= 0
    if (!outRefValid) {
      return { ...base, status: 'BLOCKED_INVALID_OUTREF', blockers: ['KOIOS_UTXO_OUTREF_INVALID'] }
    }
    if (typeof datumHex !== 'string' || !/^(?:[0-9a-fA-F]{2})+$/.test(datumHex)) {
      return {
        ...base,
        status: 'BLOCKED_DATUM_MISSING',
        outRef: String(utxo.tx_hash).toLowerCase() + '#' + Number(utxo.tx_index),
        blockers: ['FEED_NFT_HAS_NO_VALID_INLINE_DATUM'],
      }
    }
    return {
      ...base,
      outRef: String(utxo.tx_hash).toLowerCase() + '#' + Number(utxo.tx_index),
      lovelace: String(utxo.value),
      datum: decodeFeed(datumHex, feed, tip.blockTimeMs),
    }
  } catch (error) {
    return {
      pair: feed.pair,
      status: 'BLOCKED_OBSERVATION_ERROR',
      address: feed.address,
      officialIdentity: { policyId: feed.policyId, tokenNameHex: feed.tokenNameHex },
      blockers: [error instanceof Error ? error.message : String(error)],
    }
  }
}

async function main() {
  const observedAt = new Date().toISOString()
  const blockers = []
  let tip
  try {
    tip = await koiosGetTip()
  } catch (error) {
    const result = {
      schema: 'IMMORTAL-CHARLI3-PREPROD-FEED-OBSERVATION-v1',
      status: 'BLOCKED_CHAIN_TIP_UNAVAILABLE',
      operation: { mode: 'READ_ONLY', signed: false, submitted: false, stateChanged: false },
      observedAt,
      sourceReferences: { officialFeedConfig: OFFICIAL_CONFIG_URL, datumSpec: DATUM_SPEC_URL },
      blockers: [error instanceof Error ? error.message : String(error)],
    }
    await mkdir(OUTPUT.split('/').slice(0, -1).join('/') || '.', { recursive: true })
    result.evidenceHash = hashJson(result)
    await writeFile(OUTPUT, JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = 1
    return
  }

  const feedResults = await Promise.all(FEEDS.map(feed => observeFeed(feed, tip, observedAt)))
  for (const result of feedResults) {
    if (result.status !== 'OBSERVED_NOT_QUALIFIED') blockers.push(...(result.blockers ?? []))
    if (result.datum?.status === 'OBSERVED_NOT_QUALIFIED') blockers.push(...(result.datum.blockers ?? []))
  }

  const manifest = {
    schema: 'IMMORTAL-CHARLI3-PREPROD-FEED-OBSERVATION-v1',
    status: 'OBSERVED_NOT_QUALIFIED',
    operation: { mode: 'READ_ONLY', signed: false, submitted: false, stateChanged: false },
    network: 'cardano-preprod',
    sourceReferences: { officialFeedConfig: OFFICIAL_CONFIG_URL, datumSpec: DATUM_SPEC_URL },
    observedAt,
    chainTip: {
      blockNo: tip.blockNo,
      blockHash: tip.blockHash,
      absSlot: tip.absSlot,
      blockTime: tip.blockTime,
      blockTimeMs: tip.blockTimeMs.toString(),
      era: tip.era,
    },
    externalContext: {
      providerCurrentOperationStatusIndependentlyVerified: false,
      currentFeedPublicationAndPublisherTrustIndependentlyVerified: false,
      marketPriceTruthProvenByThisObservation: false,
      networkSourceNote: 'This artifact is a read-only observation of the documented feed NFTs and inline datums. It does not certify the provider is active, a datum is correct, or a feed is safe for settlement.',
    },
    feeds: feedResults,
    blockers: [...new Set(blockers)],
  }
  manifest.evidenceHash = hashJson(manifest)
  await mkdir(OUTPUT.split('/').slice(0, -1).join('/') || '.', { recursive: true })
  await writeFile(OUTPUT, JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest, null, 2))
  if (feedResults.some(result => result.status === 'BLOCKED_OBSERVATION_ERROR')) process.exitCode = 1
}

await main()
