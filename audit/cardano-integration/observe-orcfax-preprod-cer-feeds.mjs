import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import {
  ORCFAX_PREPROD,
  decodeFspCurrentFsHash,
  deriveUsdUsdmCrossRate,
  exactOutRef,
  hasExactAssetQuantity,
  inspectOrcfaxCerDatum,
} from './orcfaxPreprodFeedObservation.mjs'

const KOIOS = (process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1').replace(/\/$/, '')
const OUTPUT = process.env.ORCFAX_PREPROD_OBSERVATION_PATH ??
  'audit/preprod-evidence/orcfax-preprod-feed-observation.json'
const PAGE_SIZE = 1_000
const MAX_PAGES = 20
const MAX_RETRIES = 3
const RETRYABLE = new Set([429, 500, 502, 503, 504])

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function hashJson(value) {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item), 'utf8')
    .digest('hex')
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function tipObject(raw) {
  const tip = Array.isArray(raw) ? raw[0] : raw?.data ?? raw
  const blockTime = Number(tip?.block_time)
  const blockNo = Number(tip?.block_no)
  const absSlot = Number(tip?.abs_slot)
  const hash = String(tip?.hash ?? tip?.block_hash ?? '').toLowerCase()
  if (
    !Number.isSafeInteger(blockTime) || blockTime <= 0 ||
    !Number.isSafeInteger(blockNo) || blockNo < 0 ||
    !Number.isSafeInteger(absSlot) || absSlot < 0 ||
    !/^[0-9a-f]{64}$/.test(hash)
  ) {
    throw new Error('KOIOS_TIP_MALFORMED')
  }
  return {
    blockTimeSeconds: String(blockTime),
    blockTimeMs: BigInt(blockTime) * 1_000n,
    blockNo,
    blockHash: hash,
    absSlot: String(absSlot),
    era: tip?.era ?? null,
  }
}

async function koiosGetTip() {
  const response = await fetch(KOIOS + '/tip', { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error('KOIOS_TIP_HTTP_' + response.status)
  return tipObject(await response.json())
}

/**
 * Koios script_utxos is a read-only query. The POST body contains the exact
 * script hash; query pagination is bounded and repeated pages fail closed.
 */
async function fetchScriptPage(scriptHash, offset) {
  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
  })
  const url = KOIOS + '/script_utxos?' + query.toString()
  let lastError
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ _script_hashes: [scriptHash], _extended: true }),
      })
      if (!response.ok) {
        const error = new Error('KOIOS_SCRIPT_UTXOS_HTTP_' + response.status + '_HASH_' + scriptHash)
        if (!RETRYABLE.has(response.status)) throw error
        lastError = error
      } else {
        const rows = await response.json()
        if (!Array.isArray(rows)) throw new Error('KOIOS_SCRIPT_UTXOS_MALFORMED_RESPONSE_' + scriptHash)
        return rows
      }
    } catch (error) {
      lastError = error
      if (attempt === MAX_RETRIES - 1) break
    }
    await wait(500 * (attempt + 1))
  }
  throw lastError ?? new Error('KOIOS_SCRIPT_UTXOS_QUERY_FAILED_' + scriptHash)
}

async function fetchAllScriptUtxos(scriptHash) {
  const records = []
  const seenRefs = new Set()
  let pageCount = 0
  let complete = false
  let paginationError = null

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const offset = page * PAGE_SIZE
    const rows = await fetchScriptPage(scriptHash, offset)
    pageCount += 1
    if (rows.length > PAGE_SIZE) {
      paginationError = 'KOIOS_RETURNED_MORE_ROWS_THAN_REQUESTED_PAGE_SIZE'
      break
    }

    let addedThisPage = 0
    for (const row of rows) {
      const outRef = exactOutRef(row)
      if (seenRefs.has(outRef)) {
        paginationError = 'PAGINATION_RETURNED_A_DUPLICATE_OUTREF'
        break
      }
      seenRefs.add(outRef)
      records.push(row)
      addedThisPage += 1
    }
    if (paginationError) break
    if (rows.length < PAGE_SIZE) {
      complete = true
      break
    }
    if (addedThisPage === 0) {
      paginationError = 'PAGINATION_DID_NOT_ADVANCE'
      break
    }
  }

  if (!complete && !paginationError) paginationError = 'MAXIMUM_SCRIPT_UTXO_PAGES_REACHED'
  return { records, pageCount, complete, paginationError }
}

function datumHex(utxo) {
  const raw = utxo?.inline_datum?.bytes
  return typeof raw === 'string' && /^(?:[0-9a-fA-F]{2})+$/.test(raw) ? raw.toLowerCase() : null
}

function assetRows(utxo) {
  return Array.isArray(utxo?.asset_list) ? utxo.asset_list : []
}

function observedUtxo(utxo, extra = {}) {
  return {
    outRef: exactOutRef(utxo),
    address: utxo.address ?? null,
    lovelace: String(utxo.value ?? ''),
    blockHeight: Number.isSafeInteger(Number(utxo.block_height)) ? Number(utxo.block_height) : null,
    blockTimeSeconds: Number.isSafeInteger(Number(utxo.block_time)) ? String(utxo.block_time) : null,
    datumCborSha256: datumHex(utxo) ? sha256(Buffer.from(datumHex(utxo), 'hex')) : null,
    ...extra,
  }
}

async function observeFsp(tip) {
  const queried = await fetchAllScriptUtxos(ORCFAX_PREPROD.fspScriptHash)
  const fspUnit = ORCFAX_PREPROD.fspScriptHash + ORCFAX_PREPROD.fspTokenNameHex
  const matches = queried.records.filter(utxo => hasExactAssetQuantity(assetRows(utxo), fspUnit, 1n))
  const output = {
    scriptHash: ORCFAX_PREPROD.fspScriptHash,
    expectedTokenUnit: fspUnit,
    tokenNameHex: ORCFAX_PREPROD.fspTokenNameHex,
    query: {
      rowCount: queried.records.length,
      pageCount: queried.pageCount,
      complete: queried.complete,
      paginationError: queried.paginationError,
    },
    singletonCount: matches.length,
    chainTip: { blockNo: tip.blockNo, blockHash: tip.blockHash, blockTimeSeconds: tip.blockTimeSeconds },
  }

  if (!queried.complete) {
    return {
      ...output,
      status: 'BLOCKED_FSP_SCAN_INCOMPLETE',
      blockers: ['FSP_SCRIPT_UTXO_SCAN_INCOMPLETE'],
    }
  }
  if (matches.length !== 1) {
    return {
      ...output,
      status: 'BLOCKED_FSP_SINGLETON_NOT_UNIQUE',
      candidateOutRefs: matches.slice(0, 10).map(utxo => exactOutRef(utxo)),
      blockers: [matches.length === 0 ? 'FSP_SINGLETON_TOKEN_NOT_FOUND' : 'FSP_SINGLETON_TOKEN_AMBIGUOUS'],
    }
  }

  const fsp = matches[0]
  const cbor = datumHex(fsp)
  if (!cbor) {
    return {
      ...output,
      status: 'BLOCKED_FSP_DATUM_MISSING',
      candidate: observedUtxo(fsp),
      blockers: ['FSP_INLINE_DATUM_MISSING_OR_MALFORMED'],
    }
  }

  let currentFsScriptHash
  try {
    currentFsScriptHash = decodeFspCurrentFsHash(cbor)
  } catch (error) {
    return {
      ...output,
      status: 'BLOCKED_FSP_DATUM_INVALID',
      candidate: observedUtxo(fsp),
      blockers: [error instanceof Error ? error.message : String(error)],
    }
  }

  const matchesDocumentation = currentFsScriptHash === ORCFAX_PREPROD.documentedFsScriptHash
  return {
    ...output,
    status: matchesDocumentation ? 'OBSERVED' : 'OBSERVED_NOT_QUALIFIED',
    candidate: observedUtxo(fsp, {
      tokenUnit: fspUnit,
      currentFsScriptHash,
      documentedFsScriptHash: ORCFAX_PREPROD.documentedFsScriptHash,
      fspDatumCborSha256: sha256(Buffer.from(cbor, 'hex')),
    }),
    currentFsScriptHash,
    documentedFsScriptHash: ORCFAX_PREPROD.documentedFsScriptHash,
    matchesDocumentation,
    blockers: matchesDocumentation ? [] : ['FSP_FS_HASH_DIFFERS_FROM_DOCUMENTED_ACTIVE_HASH'],
  }
}

function inspectFeedOutput(utxo, expectedFeedPrefix, tipMs) {
  const cbor = datumHex(utxo)
  if (!cbor) return null
  try {
    const inspected = inspectOrcfaxCerDatum(cbor, {
      expectedFeedPrefix,
      chainTipTimeMs: tipMs,
      maximumAgeMs: ORCFAX_PREPROD.maximumAgeMs,
    })
    if (!inspected.feedIdMatches) return null
    return {
      ...observedUtxo(utxo, {
        fsTokenUnit: null,
        feedDatumCborSha256: inspected.datumCborSha256,
      }),
      inspection: inspected,
    }
  } catch {
    // Non-CER and historical test datums at the same script are not promoted.
    return null
  }
}

function selectFeed(prefix, label, matchingStatements, scan) {
  const freshCandidates = matchingStatements.filter(item => item.inspection.freshCandidate)
  const common = {
    expectedFeedPrefix: prefix,
    matchingStatementCount: matchingStatements.length,
    freshCandidateCount: freshCandidates.length,
    matchingStatements: matchingStatements
      .slice()
      .sort((a, b) => {
        const left = BigInt(a.inspection.createdAtMs)
        const right = BigInt(b.inspection.createdAtMs)
        return left === right ? a.outRef.localeCompare(b.outRef) : (left > right ? -1 : 1)
      })
      .slice(0, 20),
    scan: {
      scriptHash: scan.scriptHash,
      rowCount: scan.query.rowCount,
      pageCount: scan.query.pageCount,
      complete: scan.query.complete,
      paginationError: scan.query.paginationError,
    },
  }

  if (!scan.query.complete) {
    return { ...common, status: 'BLOCKED_SCRIPT_SCAN_INCOMPLETE', blockers: ['FS_SCRIPT_UTXO_SCAN_INCOMPLETE'] }
  }
  if (freshCandidates.length === 0) {
    const reason = matchingStatements.length === 0
      ? 'EXPECTED_FRESH_FEED_STATEMENT_NOT_FOUND'
      : 'NO_FRESH_FEED_STATEMENT_WITHIN_MAXIMUM_AGE'
    return { ...common, status: 'OBSERVED_NOT_QUALIFIED', blockers: [reason] }
  }
  if (freshCandidates.length > 1) {
    return { ...common, status: 'BLOCKED_AMBIGUOUS_FRESH_FEED', blockers: ['MULTIPLE_FRESH_STATEMENTS_FOR_EXPECTED_FEED_PREFIX'] }
  }
  return {
    ...common,
    status: 'FRESH_CANDIDATE_NOT_QUALIFIED',
    selectedCandidate: freshCandidates[0],
    blockers: [],
  }
}

async function observeFsScript(fsHash, tip) {
  const queried = await fetchAllScriptUtxos(fsHash)
  const fsTokenUnit = fsHash
  const fsTokenOutputs = queried.records.filter(utxo =>
    hasExactAssetQuantity(assetRows(utxo), fsTokenUnit, 1n),
  )
  const adaUsd = []
  const adaUsdm = []
  let malformedDatumCount = 0

  for (const utxo of fsTokenOutputs) {
    const cbor = datumHex(utxo)
    if (!cbor) {
      malformedDatumCount += 1
      continue
    }
    const usdCandidate = inspectFeedOutput(utxo, ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd, tip.blockTimeMs)
    if (usdCandidate) adaUsd.push(usdCandidate)
    const usdmCandidate = inspectFeedOutput(utxo, ORCFAX_PREPROD.expectedFeedPrefixes.adaUsdm, tip.blockTimeMs)
    if (usdmCandidate) adaUsdm.push(usdmCandidate)
  }

  const scan = {
    scriptHash: fsHash,
    tokenNameHex: '',
    tokenUnit: fsTokenUnit,
    tokenOutputCount: fsTokenOutputs.length,
    malformedOrMissingDatumCount: malformedDatumCount,
    query: {
      rowCount: queried.records.length,
      pageCount: queried.pageCount,
      complete: queried.complete,
      paginationError: queried.paginationError,
    },
  }
  return {
    scan,
    adaUsd: selectFeed(ORCFAX_PREPROD.expectedFeedPrefixes.adaUsd, 'ADA-USD', adaUsd, scan),
    adaUsdm: selectFeed(ORCFAX_PREPROD.expectedFeedPrefixes.adaUsdm, 'ADA-USDM', adaUsdm, scan),
  }
}

async function writeManifest(manifest) {
  const base = { ...manifest }
  delete base.evidenceHash
  manifest.evidenceHash = hashJson(base)
  await mkdir(OUTPUT.split('/').slice(0, -1).join('/') || '.', { recursive: true })
  await writeFile(OUTPUT, JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest, null, 2))
}

async function main() {
  const observedAt = new Date().toISOString()
  const base = {
    schema: 'IMMORTAL-ORCFAX-PREPROD-CER-OBSERVATION-v1',
    operation: { mode: 'READ_ONLY', signed: false, submitted: false, stateChanged: false },
    network: 'cardano-preprod',
    sourceReferences: {
      deployments: ORCFAX_PREPROD.deploymentsReference,
      consumerIntegration: ORCFAX_PREPROD.consumerReference,
    },
    expectedDeployment: {
      version: 'v1',
      statusInDeploymentsDoc: 'Active',
      fspScriptHash: ORCFAX_PREPROD.fspScriptHash,
      documentedFsScriptHash: ORCFAX_PREPROD.documentedFsScriptHash,
      constitutionScriptHash: ORCFAX_PREPROD.constitutionScriptHash,
      arweavePackageStatus: 'TBA',
    },
    officialDocumentationConflict: {
      deploymentsTableSaysPreprodActive: true,
      consumerTableListsPreprodAsNA: true,
      blocker: 'ORCFAX_PREPROD_DOCUMENTATION_CONFLICT',
    },
    observedAt,
    freshnessPolicy: {
      clock: 'Koios Preprod chain-tip block_time',
      maximumAgeMs: ORCFAX_PREPROD.maximumAgeMs.toString(),
      feedIdRule: 'feed_id must begin with the official expected prefix including the trailing slash',
      timestampRule: 'Accept only the POSIX-millisecond shape documented by the Orcfax v1 CER example; never guess seconds from magnitude.',
    },
    externalQualification: {
      externalPublisherAndSourceTruthVerified: false,
      exactMonetaUsdmCardanoAssetIdentityBound: false,
      archivalProvenanceVerified: false,
      crossRateApprovedForSettlement: false,
      note: 'This observation is discovery evidence only. It cannot authorize the quote for IMMORTAL settlement.',
    },
  }

  let tip
  try {
    tip = await koiosGetTip()
  } catch (error) {
    const manifest = {
      ...base,
      status: 'BLOCKED_CHAIN_TIP_UNAVAILABLE',
      blockers: [error instanceof Error ? error.message : String(error)],
    }
    await writeManifest(manifest)
    process.exitCode = 1
    return
  }

  const chainTip = {
    blockNo: tip.blockNo,
    blockHash: tip.blockHash,
    absSlot: tip.absSlot,
    blockTimeSeconds: tip.blockTimeSeconds,
    blockTimeMs: tip.blockTimeMs.toString(),
    era: tip.era,
  }

  let fsp
  try {
    fsp = await observeFsp(tip)
  } catch (error) {
    const manifest = {
      ...base,
      chainTip,
      status: 'BLOCKED_FSP_OBSERVATION_ERROR',
      blockers: [error instanceof Error ? error.message : String(error)],
    }
    await writeManifest(manifest)
    process.exitCode = 1
    return
  }

  if (!fsp.currentFsScriptHash) {
    const manifest = {
      ...base,
      chainTip,
      fsp,
      status: 'BLOCKED_CURRENT_FS_SCRIPT_HASH_UNAVAILABLE',
      blockers: [...(fsp.blockers ?? []), 'CURRENT_FS_SCRIPT_HASH_NOT_VERIFIED'],
    }
    await writeManifest(manifest)
    process.exitCode = 1
    return
  }

  let feeds
  try {
    feeds = await observeFsScript(fsp.currentFsScriptHash, tip)
  } catch (error) {
    const manifest = {
      ...base,
      chainTip,
      fsp,
      status: 'BLOCKED_FS_OBSERVATION_ERROR',
      blockers: [error instanceof Error ? error.message : String(error)],
    }
    await writeManifest(manifest)
    process.exitCode = 1
    return
  }

  let crossRateCandidate = null
  if (
    feeds.adaUsd.status === 'FRESH_CANDIDATE_NOT_QUALIFIED' &&
    feeds.adaUsdm.status === 'FRESH_CANDIDATE_NOT_QUALIFIED'
  ) {
    try {
      crossRateCandidate = deriveUsdUsdmCrossRate(
        feeds.adaUsd.selectedCandidate.inspection,
        feeds.adaUsdm.selectedCandidate.inspection,
      )
    } catch (error) {
      crossRateCandidate = {
        status: 'BLOCKED_CROSS_RATE_DERIVATION',
        blockers: [error instanceof Error ? error.message : String(error)],
      }
    }
  }

  const blockers = [
    'ORCFAX_PREPROD_DOCUMENTATION_CONFLICT',
    'ORCFAX_PREPROD_ARCHIVAL_PACKAGE_NOT_DOCUMENTED',
    'EXTERNAL_FEED_PROVENANCE_AND_PUBLISHER_TRUST_NOT_INDEPENDENTLY_VERIFIED',
    'EXACT_MONETA_USDM_LEDGER_ASSET_IDENTITY_NOT_BOUND_TO_FEED',
    'CROSS_RATE_GOVERNANCE_AND_ISSUE_CONSUMER_CONTRACT_NOT_APPROVED',
    ...(fsp.blockers ?? []),
    ...(feeds.adaUsd.blockers ?? []),
    ...(feeds.adaUsdm.blockers ?? []),
    ...(crossRateCandidate?.blockers ?? []),
  ]

  const manifest = {
    ...base,
    status: 'OBSERVED_NOT_QUALIFIED',
    chainTip,
    fsp,
    currentFsScan: feeds.scan,
    feeds: {
      adaUsd: feeds.adaUsd,
      adaUsdm: feeds.adaUsdm,
    },
    crossRateCandidate,
    blockers: [...new Set(blockers)],
  }
  await writeManifest(manifest)
  if (!feeds.scan.query.complete || fsp.status.startsWith('BLOCKED')) process.exitCode = 1
}

await main()
