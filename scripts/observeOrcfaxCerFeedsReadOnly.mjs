#!/usr/bin/env node
/**
 * Read-only Orcfax Mainnet CER observer for ADA-USD and ADA-USDM.
 * Resolves the FS script through the official FSP state NFT, then reads the
 * FS-token UTxOs and validates feed-id prefix, rational datum and freshness.
 * No wallet, signing, transaction, oracle refresh, or chain write.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { decodeFspDatum, decodeFsDatum } from './lib/orcfaxCerDatum.mjs'

const BASE = (process.env.KOIOS_MAINNET_URL ?? 'https://api.koios.rest/api/v1').replace(/\/$/, '')
const FEED_CONFIG_URL = 'https://raw.githubusercontent.com/orcfax/cer-feeds/main/feeds/mainnet/cer-feeds.json'
const FSP_POLICY = '8793893b5dda6a513ba63c80e9d7b2d4f108060c11979bfc7d863ff0'
const FSP_ASSET_NAME = '000de140'
const TARGETS = [
  { pair: 'ADA-USD', feedPrefix: 'CER/ADA-USD/' },
  { pair: 'ADA-USDM', feedPrefix: 'CER/ADA-USDM/' },
]
const PAGE_SIZE = 1000
const MAX_PAGES = 10
const sha256 = (raw) => createHash('sha256').update(raw, 'utf8').digest('hex')

function outputPath(argv) {
  const i = argv.indexOf('--out')
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve('audit/oracles/orcfax-cer-mainnet-readonly.json')
}

async function fetchRaw(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { accept: 'application/json', 'user-agent': 'IMMORTAL-Agent-A-Orcfax-readonly/1.0', ...(options.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  })
  const rawBody = await response.text()
  const evidence = {
    url,
    method: options.method ?? 'GET',
    status: response.status,
    responseDate: response.headers.get('date'),
    etag: response.headers.get('etag'),
    bodyBytes: Buffer.byteLength(rawBody),
    bodySha256: sha256(rawBody),
    rawBody,
  }
  if (!response.ok) throw Object.assign(new Error('HTTP_' + response.status + ':' + url), { evidence })
  let json
  try { json = JSON.parse(rawBody) } catch {
    throw Object.assign(new Error('JSON_INVALID:' + url), { evidence })
  }
  return { json, evidence }
}

async function koios(path, body) {
  return fetchRaw(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function assetUtxos(policyId, assetNameHex) {
  const pages = []
  const rows = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const offset = page * PAGE_SIZE
    const r = await koios('/asset_utxos?limit=' + PAGE_SIZE + '&offset=' + offset, {
      _asset_list: [[policyId, assetNameHex]],
      _extended: true,
    })
    if (!Array.isArray(r.json)) throw new Error('KOIOS_ASSET_UTXOS_SHAPE_INVALID')
    pages.push({ page, offset, returnedCount: r.json.length, response: r.evidence })
    rows.push(...r.json)
    if (r.json.length < PAGE_SIZE) {
      return { rows, pages, paginationComplete: true }
    }
  }
  return { rows, pages, paginationComplete: false }
}

function assetsFor(utxo) {
  return (Array.isArray(utxo.asset_list) ? utxo.asset_list : []).map((x) => ({
    policyId: String(x.policy_id ?? '').toLowerCase(),
    assetNameHex: String(x.asset_name ?? '').toLowerCase(),
    quantityRaw: String(x.quantity ?? ''),
  }))
}

function quantity(utxo, policyId, assetNameHex) {
  const item = assetsFor(utxo).find((x) => x.policyId === policyId && x.assetNameHex === assetNameHex)
  return item ? BigInt(item.quantityRaw) : 0n
}

async function main() {
  const startedAt = new Date().toISOString()
  const out = outputPath(process.argv.slice(2))
  const responseEvidence = []
  try {
    const configResponse = await fetchRaw(FEED_CONFIG_URL)
    responseEvidence.push(configResponse.evidence)
    const definitions = configResponse.json?.feeds ?? []
    const feedDefinitions = Object.fromEntries(TARGETS.map((t) => {
      const definition = definitions.find((x) => x.pair === t.pair && x.type === 'CER')
      if (!definition) throw new Error('ORCFAX_FEED_DEFINITION_MISSING:' + t.pair)
      return [t.pair, definition]
    }))

    const fspScan = await assetUtxos(FSP_POLICY, FSP_ASSET_NAME)
    responseEvidence.push(...fspScan.pages.map((x) => x.response))
    if (!fspScan.paginationComplete) throw new Error('ORCFAX_FSP_PAGINATION_INCOMPLETE')
    const fspCandidates = fspScan.rows.filter((u) => quantity(u, FSP_POLICY, FSP_ASSET_NAME) === 1n)
    const fspDecoded = []
    const fspInvalid = []
    for (const u of fspCandidates) {
      try {
        const datum = decodeFspDatum(u.inline_datum?.value ?? null)
        fspDecoded.push({
          utxo: u,
          fsScriptHash: datum.fsScriptHash,
          utxoRef: String(u.tx_hash ?? '').toLowerCase() + '#' + String(u.tx_index),
          paymentCredential: String(u.payment_cred ?? '').toLowerCase(),
        })
      } catch (e) {
        fspInvalid.push({ utxoRef: String(u.tx_hash ?? '') + '#' + String(u.tx_index), reason: e instanceof Error ? e.message : String(e) })
      }
    }
    const fsHashes = [...new Set(fspDecoded.map((x) => x.fsScriptHash))]
    if (fsHashes.length !== 1) throw new Error('ORCFAX_FSP_FS_SCRIPT_HASH_CARDINALITY:' + fsHashes.length)
    const fsScriptHash = fsHashes[0]

    const fsScan = await assetUtxos(fsScriptHash, '')
    responseEvidence.push(...fsScan.pages.map((x) => x.response))
    if (!fsScan.paginationComplete) throw new Error('ORCFAX_FS_PAGINATION_INCOMPLETE')

    const feedRows = Object.fromEntries(TARGETS.map((t) => [t.pair, []]))
    const invalidTargetRows = []
    const allDecodedCount = { decoded: 0, malformed: 0 }
    for (const u of fsScan.rows) {
      if (quantity(u, fsScriptHash, '') !== 1n) continue
      let datum
      try {
        datum = decodeFsDatum(u.inline_datum?.value ?? null)
        allDecodedCount.decoded += 1
      } catch (e) {
        allDecodedCount.malformed += 1
        invalidTargetRows.push({
          utxoRef: String(u.tx_hash ?? '').toLowerCase() + '#' + String(u.tx_index),
          reason: e instanceof Error ? e.message : String(e),
        })
        continue
      }
      const target = TARGETS.find((t) => datum.feedId.startsWith(t.feedPrefix))
      if (!target) continue
      const utxoRef = String(u.tx_hash ?? '').toLowerCase() + '#' + String(u.tx_index)
      const reasons = []
      if (String(u.payment_cred ?? '').toLowerCase() !== fsScriptHash) reasons.push('FS_PAYMENT_CREDENTIAL_MISMATCH')
      if (quantity(u, fsScriptHash, '') !== 1n) reasons.push('FS_TOKEN_QUANTITY_NOT_ONE')
      const ageMs = Date.now() - Number(datum.createdAtMs)
      feedRows[target.pair].push({
        utxoRef,
        address: u.address ?? null,
        paymentCredential: String(u.payment_cred ?? '').toLowerCase(),
        datumHash: u.datum_hash ?? null,
        inlineDatumCborHex: u.inline_datum?.bytes ?? null,
        feedId: datum.feedId,
        createdAtMs: datum.createdAtMs.toString(),
        createdAtIso: Number.isSafeInteger(Number(datum.createdAtMs)) ? new Date(Number(datum.createdAtMs)).toISOString() : null,
        ageMsAtCapture: ageMs,
        numeratorRaw: datum.numerator.toString(),
        denominatorRaw: datum.denominator.toString(),
        statementValid: reasons.length === 0,
        reasons,
        transactionHash: String(u.tx_hash ?? '').toLowerCase(),
        transactionIndex: Number(u.tx_index),
      })
    }

    const txHashes = [...new Set(TARGETS.flatMap((t) => feedRows[t.pair].map((x) => x.transactionHash)).filter(Boolean))]
    const txContext = {}
    for (const hash of txHashes) {
      const r = await koios('/tx_info', { _tx_hashes: [hash] })
      responseEvidence.push(r.evidence)
      const tx = Array.isArray(r.json) ? r.json.find((x) => String(x.tx_hash ?? '').toLowerCase() === hash) : null
      txContext[hash] = tx ? {
        blockHash: tx.block_hash ?? null,
        blockHeight: tx.block_height ?? null,
        epochNo: tx.epoch_no ?? null,
        absoluteSlot: tx.absolute_slot ?? tx.slot_no ?? null,
        blockTime: tx.block_time ?? tx.tx_timestamp ?? null,
      } : null
    }

    for (const target of TARGETS) {
      for (const row of feedRows[target.pair]) row.transactionContext = txContext[row.transactionHash] ?? null
      feedRows[target.pair].sort((a, b) => Number(b.createdAtMs) - Number(a.createdAtMs))
    }

    const summaries = {}
    for (const target of TARGETS) {
      const rows = feedRows[target.pair]
      summaries[target.pair] = {
        statementCount: rows.length,
        validStatementCount: rows.filter((x) => x.statementValid).length,
        latestCreatedAtIso: rows[0]?.createdAtIso ?? null,
        latestAgeMs: rows[0]?.ageMsAtCapture ?? null,
        duplicateStatementCount: Math.max(0, rows.length - 1),
        feedDefinition: feedDefinitions[target.pair],
      }
    }

    const result = {
      schema: 'immortal-orcfax-cer-mainnet-readonly-v1',
      classification: 'ONCHAIN_ORACLE_STATEMENT_OBSERVATION_NOT_USDM_PEG_OR_EEV_QUALIFICATION',
      network: 'cardano-mainnet',
      startedAt,
      completedAt: new Date().toISOString(),
      source: { name: 'Orcfax', documentation: 'https://github.com/orcfax/docs/blob/main/docs/developer-manual/consume.md', feedConfigUrl: FEED_CONFIG_URL },
      deployment: {
        fspPolicyId: FSP_POLICY,
        fspAssetNameHex: FSP_ASSET_NAME,
        fsScriptHash,
        fspUtxoCount: fspDecoded.length,
        fspInvalidCount: fspInvalid.length,
      },
      acquisition: {
        provider: 'Koios',
        baseUrl: BASE,
        fspPagination: { complete: fspScan.paginationComplete, pages: fspScan.pages.map(({ response, ...x }) => ({ ...x, bodySha256: response.bodySha256 })) },
        fsPagination: { complete: fsScan.paginationComplete, pages: fsScan.pages.map(({ response, ...x }) => ({ ...x, bodySha256: response.bodySha256 })) },
        fsTokenUtxoCount: fsScan.rows.length,
        decodedFsStatementCount: allDecodedCount.decoded,
        malformedFsDatumCount: allDecodedCount.malformed,
        transactionContextCount: txHashes.length,
      },
      summary: summaries,
      feeds: feedRows,
      fspCandidates: fspDecoded.map((x) => ({
        utxoRef: x.utxoRef,
        paymentCredential: x.paymentCredential,
        fsScriptHash: x.fsScriptHash,
        datumHash: x.utxo.datum_hash ?? null,
        inlineDatumCborHex: x.utxo.inline_datum?.bytes ?? null,
      })),
      invalidRows: { fsp: fspInvalid, fs: invalidTargetRows },
      rawResponses: responseEvidence,
      limitations: [
        'The ADA-USD feed is an Orcfax on-chain CER statement whose published feed registry describes CEX sourcing and median calculation; it is an oracle aggregate, not a raw exchange quote.',
        'The ADA-USDM feed registry describes DEX sourcing and weighted-mean calculation; it is not an independent venue and must not be treated as issuer redemption or USDM/USD peg proof.',
        'The current UTxO is accepted only when the FSP/FS token and payment credential checks pass and the feed id has the exact required prefix.',
        'No ADA/USDM orientation conversion, price averaging, confidence threshold, peg decision, EEV valuation or deployment approval is performed.',
        'Only public Koios/GitHub reads are made; no wallet, signing, transaction, oracle refresh or chain write occurs.',
      ],
    }

    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
    const complete = TARGETS.every((t) => feedRows[t.pair].length === 1 && feedRows[t.pair][0].statementValid)
    console.log(JSON.stringify({
      status: complete ? 'READ_ONLY_ORCFAX_CER_FEEDS_COMPLETE' : 'READ_ONLY_ORCFAX_CER_FEEDS_PARTIAL',
      output: out,
      summary: summaries,
      fsTokenUtxoCount: fsScan.rows.length,
      decodedFsStatementCount: allDecodedCount.decoded,
      completedAt: result.completedAt,
    }, null, 2))
    if (!complete) process.exitCode = 1
  } catch (error) {
    const result = {
      schema: 'immortal-orcfax-cer-mainnet-readonly-v1',
      classification: 'ONCHAIN_ORACLE_STATEMENT_OBSERVATION_NOT_USDM_PEG_OR_EEV_QUALIFICATION',
      network: 'cardano-mainnet',
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'READ_ONLY_ORCFAX_CER_FEEDS_FAILED',
      error: error instanceof Error ? error.message : String(error),
      failedResponse: error?.evidence ?? null,
      rawResponses: responseEvidence,
    }
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
    console.error(JSON.stringify({ status: result.status, error: result.error, output: out }, null, 2))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main()
}
