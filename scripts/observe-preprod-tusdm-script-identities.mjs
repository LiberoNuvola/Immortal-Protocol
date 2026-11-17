#!/usr/bin/env node
/**
 * Read-only Koios probe for unresolved Cardano Preprod script identities
 * that held exact approved PRE-RICH tUSDM plus ADA in census #44022980895.
 *
 * It captures deployed script bytes and redeemer history, and rechecks prior
 * source out-references. It does not classify a script as a DEX, derive price,
 * or build/sign/submit any transaction.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export const SOURCE_CENSUS = Object.freeze({
  workflowRunId: '44022980895',
  workflowRunUrl: 'https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/44022980895',
  sourceCommit: '979eb2d852e97bdac5c90722f2134a0ecb3148d5',
  artifactId: '14301518451',
  artifactZipSha256: 'a2c022bcff9e0667d846cff49cd437e211ae7fe0114b774de903030bdb5062a4',
  observation: '49 exact approved tUSDM+ADA script UTxOs across 11 payment credentials; 49/49 independent exact out-reference rechecks',
})

export const KOIOS = 'https://preprod.koios.rest/api/v1'
export const TUSDM_UNIT = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d'

export const CANDIDATE_GROUPS = Object.freeze([
  {
    scriptHash: 'f2936eb84c9ef8e151edc9547e93dfc3b526cb5d1ff0a5eba871094d',
    previousOutRefs: ['266be3e419e46a793699e1703c06e8be4494da14b042e7f57bb4aaaef0878737#0'],
  },
  {
    scriptHash: '2025f0de96b0a8f2d29462a3b186cc480e22b14c0ace2490469ad305',
    previousOutRefs: [
      'af922ce91dc8338e6e21873b0f96fb10e103ad5b829f6944a1aa00db83f68be3#0',
      'e546cb9018c81afd3f9b32178da50c15c013297c567ee54e2aa5fac3aa78e902#0',
      '7165477370054faa38011330f80e6d7af99606085ba323bd9bfd928c6f35e63f#0',
    ],
  },
  {
    scriptHash: '82c7ebfa6f4a42c12de4c0a32a8d4c7641c041eb282e45a835983de2',
    previousOutRefs: [
      '797eaa1dd6dd740c123570476433d80f7463dae9b22d2d797f0586077ec4b281#0',
      '607f3da989774b24c5efbeaddd6f3717c0da39c7c1dfa52b81fbc8c90138fbe1#0',
      '79310d1418281a91cc94f515210b8cbfb92551caab2ca150c10415a946dc66b2#0',
      '2cc26e5dfb7b6abec9d75d24e75f6cb674129dccd5aa9216ef9f6f2972d6ea00#0',
      'b59fb61ff467f0a9e06db71f9844ac0c80b6c2a6e5a33562711a9e4b984a4180#0',
      'a5c387848ae7021903844dc2bb5438406104f5e343515a0c9122a80c0e8cc12b#0',
      '8297aa11344083ede3a81c4c9e897a92f643e083131337a5b166d7c2d5ec2a3b#0',
      'f416ea7cfb318f3113efe8b0f81a0e65bd2a40707eb8f192629474cad174ac94#0',
      '750ec0ec1b90eb60945734067ea46a1700b7c6f98a3b2dca80ade6d71325b9de#0',
      'c5e23936bfd28e60295754f9199b730bb1b17bf00e4b9e163e02e72137d686af#0',
      'd92a3461817b3ca0743bcbe5cbc5a5d691361d5e26eb3c21dfd16e37020f4aea#0',
      '3b508af1a663ca8177a508b1a8c61b019121dba33f9f917c98aa52b559d2e5ef#0',
      '833b1c346de2fb2aefd80b805bf6ae8993805957c19086dd19f0029a090ad762#0',
      '16f01ec3b53b008a003c4828b1cfdb31aea5f87f42afb04af0faeb280d3a264f#0',
      '87632ad7eeafa61115d321feb02f1950cda34aa3d60a6999c574037d2cce81e0#0',
      '44ef41e9992b085daec7089f07120057c2da751d1f11bae6c978b59238f3b5f5#0',
      'e8c3098f611a7d3f91bfcfb318537cefb476ad7fb5643ce5bc4f14addbf915bc#0',
      '17b92be26d970c69d07a34478a57b92649064a5c1226f071daa31c8e8f291ee9#0',
    ],
  },
  {
    scriptHash: 'f9f5e152efd44a03e7dd3b35eb9535a7e2890119db42bd7d67924960',
    previousOutRefs: [
      'ab150c75c759edb5d24cb22b59334706f24c66eb9846e2a2ccb8dd544ad6e11a#0',
      'f56c7caa443be83ae5e769c6179052217963e15cee000ab955e01a860cf81d62#0',
      'b71a018d8cfddac3e2909d900c0c105140b78f0b0ebf102398f2ab43d3e5e299#0',
    ],
  },
  {
    scriptHash: '23dd4b7985eed99dd312068598488095a71d089f022593458755f702',
    previousOutRefs: [
      '60bca668f28f9c2e9e560a1dd399e7702c4c15afe57ac8879fb898848f0ef5db#0',
      '7119fc43e2a474f0d9930f80ce83a1b152fdc3ccf5feca12ea48f71213b9eb14#0',
    ],
  },
])

export const CONTROL_GROUPS = Object.freeze([
  { scriptHash: 'a15ce9d82d2f67645fc624e2edac03c6f1c106d0ad1af5815a3b14ad', priorResearchLabel: 'Masumi Payment Service V2 parameterized vested-pay / payment escrow' },
  { scriptHash: '2d6abca32e4b22b59e948ef22dfe682017de917a9ec088aa1bc3c64e', priorResearchLabel: 'Masumi Payment Service V2 unparameterized vested-pay blueprint hash' },
  { scriptHash: '4fff649fb4372ec3c408b6f0468d74e4d319904cde27fd3f00910a52', priorResearchLabel: 'x402 generic Cardano payment test script reference' },
  { scriptHash: 'ee3e164b3cb7a7bc8adfd6e8bdf82af9ec4a8be132ef7c4fc9941f51', priorResearchLabel: 'IMMORTAL B1 PrizePool script control' },
  { scriptHash: 'fd75e24c9ea915ce8e48d3ff1d0c54ad09cc01191c24416ad7dba4a3', priorResearchLabel: 'Previously observed Hydra Head-shaped token/control; not classified as a DEX' },
  { scriptHash: '94bca9c099e84ffd90d150316bb44c31a78702239076a0a80ea4a469', priorResearchLabel: 'Previously observed Seedelf-associated credential; not classified as a DEX' },
])

const ALL_HASHES = [...new Set([
  ...CANDIDATE_GROUPS.map(x => x.scriptHash),
  ...CONTROL_GROUPS.map(x => x.scriptHash),
])]
const OUTPUT = process.env.SCRIPT_IDENTITY_OUTPUT ??
  'audit/preprod-evidence/tusdm-script-identity-probe.json'
const TIMEOUT_MS = 45_000
const MAX_RETRIES = 3
const sha256 = value => createHash('sha256').update(value).digest('hex')
const hashJson = value => sha256(Buffer.from(JSON.stringify(value), 'utf8'))

function validHash(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{56}$/i.test(value)) throw new Error(label + '_INVALID')
  return value.toLowerCase()
}
function parseOutRef(value) {
  const m = /^([0-9a-f]{64})#(0|[1-9]\d*)$/i.exec(value)
  if (!m) throw new Error('OUTREF_INVALID')
  return { txHash: m[1].toLowerCase(), index: Number(m[2]) }
}
function rowOutRef(row) {
  const txHash = String(row?.tx_hash ?? '').toLowerCase()
  const index = Number(row?.tx_index)
  if (!/^[0-9a-f]{64}$/.test(txHash) || !Number.isSafeInteger(index) || index < 0) throw new Error('UTXO_INFO_OUTREF_INVALID')
  return txHash + '#' + index
}

async function requestJson(path, { method = 'GET', body, fetchImpl = fetch } = {}) {
  const url = KOIOS + path
  let lastError
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method,
        headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      const raw = await response.text()
      const evidence = {
        url, method, status: response.status,
        date: response.headers.get('date'),
        bodyBytes: Buffer.byteLength(raw),
        bodySha256: sha256(Buffer.from(raw, 'utf8')),
      }
      if (!response.ok) {
        const error = Object.assign(new Error('KOIOS_HTTP_' + response.status), { evidence })
        if (![429, 500, 502, 503, 504].includes(response.status)) throw error
        lastError = error
      } else {
        let json
        try { json = JSON.parse(raw) } catch {
          throw Object.assign(new Error('KOIOS_RESPONSE_JSON_INVALID'), { evidence })
        }
        return { json, evidence }
      }
    } catch (error) {
      lastError = error
      if (attempt === MAX_RETRIES - 1) break
    }
    await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)))
  }
  throw lastError ?? new Error('KOIOS_REQUEST_FAILED')
}

async function readTip(fetchImpl) {
  const { json, evidence } = await requestJson('/tip', { fetchImpl })
  const tip = Array.isArray(json) ? json[0] : json
  const absSlot = String(tip?.abs_slot ?? tip?.absolute_slot ?? '')
  const hash = String(tip?.hash ?? tip?.block_hash ?? '').toLowerCase()
  const blockNo = Number(tip?.block_no ?? tip?.block_height)
  if (!/^\d+$/.test(absSlot) || !/^[0-9a-f]{64}$/.test(hash) || !Number.isSafeInteger(blockNo) || blockNo < 0) throw new Error('KOIOS_TIP_INVALID')
  return { absSlot, hash, blockNo, blockTime: tip.block_time ?? null, evidence }
}

export function normalizeScriptInfo(row, expectedHash) {
  const scriptHash = validHash(row?.script_hash, 'SCRIPT_INFO_HASH')
  if (scriptHash !== expectedHash) throw new Error('SCRIPT_INFO_HASH_MISMATCH')
  const creationTxHash = String(row?.creation_tx_hash ?? '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(creationTxHash)) throw new Error('SCRIPT_CREATION_TX_INVALID')
  const type = String(row?.type ?? '')
  if (!['native', 'plutusV1', 'plutusV2', 'plutusV3'].includes(type)) throw new Error('SCRIPT_TYPE_UNSUPPORTED')
  const bytesHex = String(row?.bytes ?? '').toLowerCase()
  if (!/^(?:[0-9a-f]{2})+$/.test(bytesHex)) throw new Error('SCRIPT_BYTES_INVALID')
  const size = Number(row?.size)
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error('SCRIPT_SIZE_INVALID')
  return {
    scriptHash, creationTxHash, type,
    byteLength: bytesHex.length / 2,
    reportedSerializedSize: size,
    scriptBytesSha256: sha256(Buffer.from(bytesHex, 'hex')),
    scriptBytesHex: bytesHex,
    nativeScriptValue: type === 'native' ? (row.value ?? null) : null,
  }
}

export function summarizeRedeemers(raw, expectedHash) {
  if (!Array.isArray(raw)) throw new Error('SCRIPT_REDEEMERS_RESPONSE_INVALID')
  const row = raw.find(x => String(x?.script_hash ?? '').toLowerCase() === expectedHash)
  const entries = Array.isArray(row?.redeemers) ? row.redeemers : []
  const purposes = {}
  const txHashes = new Set()
  const redeemers = entries.map(entry => {
    const purpose = String(entry?.purpose ?? 'unknown')
    purposes[purpose] = (purposes[purpose] ?? 0) + 1
    const txHash = String(entry?.tx_hash ?? '').toLowerCase()
    if (/^[0-9a-f]{64}$/.test(txHash)) txHashes.add(txHash)
    return {
      txHash: /^[0-9a-f]{64}$/.test(txHash) ? txHash : null,
      txIndex: entry?.tx_index ?? null,
      purpose,
      datumHash: typeof entry?.datum_hash === 'string' ? entry.datum_hash.toLowerCase() : null,
      executionMemory: entry?.unit_mem ?? null,
      executionSteps: entry?.unit_steps ?? null,
      fee: entry?.fee ?? null,
    }
  })
  return {
    scriptHash: expectedHash,
    redeemerCount: entries.length,
    distinctTransactions: txHashes.size,
    purposeCounts: purposes,
    redeemers: redeemers.slice(0, 300),
    truncated: redeemers.length > 300,
  }
}

export function inspectCurrentUtxo(row, group) {
  const outRef = rowOutRef(row)
  if (!group.previousOutRefs.includes(outRef)) throw new Error('UNEXPECTED_UTXO_REFERENCE')
  if (String(row?.payment_cred ?? '').toLowerCase() !== group.scriptHash) throw new Error('UTXO_PAYMENT_CREDENTIAL_MISMATCH')
  const lovelace = BigInt(String(row?.value ?? '0'))
  const assets = {}
  for (const asset of row?.asset_list ?? []) {
    const unit = String(asset?.policy_id ?? '').toLowerCase() + String(asset?.asset_name ?? '').toLowerCase()
    if (!/^[0-9a-f]{56,120}$/.test(unit) || assets[unit] !== undefined) throw new Error('UTXO_ASSET_LIST_INVALID')
    assets[unit] = BigInt(String(asset.quantity))
  }
  const tusdm = assets[TUSDM_UNIT] ?? 0n
  const datumBytes = String(row?.inline_datum?.bytes ?? '').toLowerCase()
  const datumHash = String(row?.inline_datum?.hash ?? row?.datum_hash ?? '').toLowerCase()
  if (lovelace <= 0n || tusdm <= 0n) throw new Error('UTXO_NO_LONGER_HAS_ADA_AND_APPROVED_TUSDM')
  if (!/^[0-9a-f]{64}$/.test(datumHash) || !/^(?:[0-9a-f]{2})+$/.test(datumBytes)) throw new Error('UTXO_INLINE_DATUM_MISSING_OR_INVALID')
  return {
    status: 'LIVE_SOURCE_UTXO_REOBSERVED',
    outRef,
    paymentCredential: group.scriptHash,
    address: row.address ?? null,
    lovelace: lovelace.toString(),
    approvedTusdmAtomic: tusdm.toString(),
    datumHash,
    datumBytesSha256: sha256(Buffer.from(datumBytes, 'hex')),
    datumCborHex: datumBytes,
  }
}

export async function observe({ fetchImpl = fetch } = {}) {
  const startedAt = new Date().toISOString()
  const before = await readTip(fetchImpl)

  const infoResponse = await requestJson('/script_info', {
    method: 'POST',
    body: { _script_hashes: ALL_HASHES },
    fetchImpl,
  })
  if (!Array.isArray(infoResponse.json)) throw new Error('SCRIPT_INFO_RESPONSE_INVALID')
  const infoByHash = new Map(infoResponse.json.map(row => [String(row?.script_hash ?? '').toLowerCase(), row]))
  const scriptInfo = ALL_HASHES.map(hash => {
    const row = infoByHash.get(hash)
    if (!row) return { scriptHash: hash, status: 'BLOCKED_SCRIPT_INFO_NOT_FOUND' }
    try { return { status: 'SCRIPT_INFO_OBSERVED', ...normalizeScriptInfo(row, hash) } }
    catch (error) { return { scriptHash: hash, status: 'BLOCKED_SCRIPT_INFO_INVALID', reason: error.message } }
  })

  const redeemerHistory = []
  for (const group of CANDIDATE_GROUPS) {
    try {
      const { json, evidence } = await requestJson(
        '/script_redeemers?_script_hash=' + encodeURIComponent(group.scriptHash),
        { fetchImpl },
      )
      redeemerHistory.push({ ...summarizeRedeemers(json, group.scriptHash), requestEvidence: evidence })
    } catch (error) {
      redeemerHistory.push({
        scriptHash: group.scriptHash,
        status: 'BLOCKED_REDEEMER_HISTORY',
        reason: error.message,
        requestEvidence: error.evidence ?? null,
      })
    }
  }

  const refs = CANDIDATE_GROUPS.flatMap(group => group.previousOutRefs.map(outRef => ({ group, outRef })))
  const utxoRechecks = []
  for (let offset = 0; offset < refs.length; offset += 40) {
    const batch = refs.slice(offset, offset + 40)
    const { json, evidence } = await requestJson('/utxo_info', {
      method: 'POST',
      body: { _utxo_refs: batch.map(x => x.outRef), _extended: true },
      fetchImpl,
    })
    if (!Array.isArray(json)) throw new Error('UTXO_INFO_RESPONSE_INVALID')
    for (const item of batch) {
      const matches = json.filter(row => rowOutRef(row) === item.outRef)
      if (matches.length !== 1) {
        utxoRechecks.push({ status: 'BLOCKED_SOURCE_UTXO_NOT_UNIQUE_LIVE', outRef: item.outRef, scriptHash: item.group.scriptHash, matchCount: matches.length, requestEvidence: evidence })
        continue
      }
      try {
        utxoRechecks.push({ ...inspectCurrentUtxo(matches[0], item.group), scriptHash: item.group.scriptHash, requestEvidence: evidence })
      } catch (error) {
        utxoRechecks.push({ status: 'BLOCKED_SOURCE_UTXO', outRef: item.outRef, scriptHash: item.group.scriptHash, reason: error.message, requestEvidence: evidence })
      }
    }
  }

  const after = await readTip(fetchImpl)
  const candidateScriptHashes = new Set(CANDIDATE_GROUPS.map(x => x.scriptHash))
  const candidateScriptInfo = scriptInfo.filter(x => candidateScriptHashes.has(x.scriptHash))
  const controlScriptInfo = scriptInfo.filter(x => !candidateScriptHashes.has(x.scriptHash))
  // Koios may not retain every unrelated historical control script. Only the
  // five scripts that actually held the approved tUSDM+ADA candidates are
  // required for this discovery. Missing optional controls remain visible.
  const candidateScriptInfoBlocked = candidateScriptInfo.filter(x => x.status !== 'SCRIPT_INFO_OBSERVED').length
  const controlScriptInfoMissing = controlScriptInfo.filter(x => x.status !== 'SCRIPT_INFO_OBSERVED').length
  const redeemerBlocked = redeemerHistory.filter(x => x.status === 'BLOCKED_REDEEMER_HISTORY').length
  const utxoBlocked = utxoRechecks.filter(x => x.status !== 'LIVE_SOURCE_UTXO_REOBSERVED').length
  const manifest = {
    schema: 'IMMORTAL-PREPROD-TUSDM-SCRIPT-IDENTITY-PROBE-v1',
    operation: {
      mode: 'READ_ONLY',
      walletLoaded: false,
      transactionBuilt: false,
      transactionSigned: false,
      transactionSubmitted: false,
      stateChanged: false,
    },
    network: 'cardano-preprod',
    sourceCensus: SOURCE_CENSUS,
    startedAt,
    completedAt: new Date().toISOString(),
    tipBefore: { absSlot: before.absSlot, hash: before.hash, blockNo: before.blockNo },
    tipAfter: { absSlot: after.absSlot, hash: after.hash, blockNo: after.blockNo },
    snapshotConsistency: before.absSlot === after.absSlot && before.hash === after.hash,
    candidateScriptGroups: CANDIDATE_GROUPS.map(x => ({ scriptHash: x.scriptHash, priorOutRefCount: x.previousOutRefs.length })),
    controlScriptGroups: CONTROL_GROUPS,
    scriptInfo: {
      requestEvidence: infoResponse.evidence,
      expectedScriptHashes: ALL_HASHES.length,
      returnedScriptRows: infoResponse.json.length,
      observations: scriptInfo,
    },
    candidateRedeemerHistory: redeemerHistory,
    sourceOutRefRechecks: {
      requested: refs.length,
      liveReobserved: utxoRechecks.filter(x => x.status === 'LIVE_SOURCE_UTXO_REOBSERVED').length,
      blocked: utxoBlocked,
      observations: utxoRechecks,
    },
    summary: {
      candidateScriptCount: CANDIDATE_GROUPS.length,
      candidateScriptInfoObserved: candidateScriptInfo.filter(x => x.status === 'SCRIPT_INFO_OBSERVED').length,
      candidateScriptInfoBlocked,
      controlScriptInfoObserved: controlScriptInfo.filter(x => x.status === 'SCRIPT_INFO_OBSERVED').length,
      controlScriptInfoMissing,
      scriptInfoObserved: scriptInfo.filter(x => x.status === 'SCRIPT_INFO_OBSERVED').length,
      scriptInfoBlocked: candidateScriptInfoBlocked,
      redeemerHistoryQueried: redeemerHistory.length,
      redeemerHistoryBlocked: redeemerBlocked,
      sourceOutRefsRequested: refs.length,
      sourceOutRefsLive: utxoRechecks.filter(x => x.status === 'LIVE_SOURCE_UTXO_REOBSERVED').length,
      sourceOutRefsBlocked: utxoBlocked,
    },
    classification: {
      scriptIdentityResolved: false,
      dexPoolProven: false,
      swapSemanticsProven: false,
      priceProduced: false,
      quoteQualified: false,
      usdUsdmConversionQualified: false,
      issueAuthorized: false,
      note: 'Public script bytes, redeemer history and live UTxO re-observations are discovery evidence only; no script is promoted to a DEX or price source by the presence of tUSDM and ADA.',
    },
  }
  manifest.evidenceHash = hashJson(manifest)
  return manifest
}

async function main() {
  const manifest = await observe()
  await mkdir(dirname(resolve(OUTPUT)), { recursive: true })
  await writeFile(resolve(OUTPUT), JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest, null, 2))
  if (manifest.summary.candidateScriptInfoBlocked ||
      manifest.summary.redeemerHistoryBlocked ||
      manifest.summary.sourceOutRefsBlocked) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().catch(error => {
    console.error(JSON.stringify({ status: 'BLOCKED', error: error.message, evidence: error.evidence ?? null }))
    process.exitCode = 1
  })
}
