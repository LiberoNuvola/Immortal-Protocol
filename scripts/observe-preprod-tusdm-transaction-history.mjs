#!/usr/bin/env node
/**
 * Read-only Koios transaction reconstruction for the PRE-RICH approved-tUSDM
 * candidate script UTxOs. No price is calculated and no transaction is built,
 * signed, submitted, or otherwise changed.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { CANDIDATE_GROUPS, KOIOS, TUSDM_UNIT } from './observe-preprod-tusdm-script-identities.mjs'

export const SOURCE_PROBE = Object.freeze({
  workflowRunId: '44024359684',
  workflowRunUrl: 'https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/44024359684',
  artifactId: '14302780991',
  sourceCommit: '3af84d94aab8e8e9ca81b9749ccae79a683fc26f',
  chainTip: { absSlot: '139210016', hash: 'd72ad9b0315b8b9710bde1c8979f9d5138f167c86ac1719f9a855aca3f8e264a', blockNo: 5421984 },
})
export const TARGET_ORDER_SCRIPT = '23dd4b7985eed99dd312068598488095a71d089f022593458755f702'
export const HIGH_ACTIVITY_SCRIPT = '2025f0de96b0a8f2d29462a3b186cc480e22b14c0ace2490469ad305'
const OUTPUT = process.env.SCRIPT_TX_HISTORY_OUTPUT ?? 'audit/preprod-evidence/tusdm-script-transaction-history.json'
const TIMEOUT_MS = 45_000
const MAX_RETRIES = 3
const sha256 = value => createHash('sha256').update(value).digest('hex')
const hashJson = value => sha256(Buffer.from(JSON.stringify(value), 'utf8'))

function txHash(value, label = 'TX_HASH') {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) throw new Error(label + '_INVALID')
  return value.toLowerCase()
}
export function scriptHash(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{56}$/i.test(value)) throw new Error('SCRIPT_HASH_INVALID')
  return value.toLowerCase()
}
function sourceTxHashes(groups) {
  const hashes = []
  for (const group of groups) {
    for (const ref of group.previousOutRefs) {
      const m = /^([0-9a-f]{64})#(?:0|[1-9]\d*)$/i.exec(ref)
      if (!m) throw new Error('SOURCE_OUTREF_INVALID')
      hashes.push(m[1].toLowerCase())
    }
  }
  return hashes
}

/** All 23dd4 spends; two txs per distinct high-activity 2025f0 datum;
 * three spends for other scripts; every current source UTxO creation tx. */
export function selectRelevantTransactions(redeemerHistory, groups = CANDIDATE_GROUPS) {
  const selected = new Map()
  const add = (hash, reason) => {
    const id = txHash(hash)
    const entry = selected.get(id) ?? { txHash: id, reasons: [] }
    if (!entry.reasons.includes(reason)) entry.reasons.push(reason)
    selected.set(id, entry)
  }
  for (const hash of sourceTxHashes(groups)) add(hash, 'CURRENT_CANDIDATE_UTXO_CREATION')
  for (const group of redeemerHistory) {
    const script = scriptHash(group.scriptHash)
    const entries = Array.isArray(group.redeemers) ? group.redeemers : []
    const unique = new Map()
    for (const item of entries) {
      if (typeof item.txHash !== 'string') continue
      const id = txHash(item.txHash)
      if (!unique.has(id)) unique.set(id, item)
    }
    const records = [...unique.entries()]
    let chosen = []
    if (script === TARGET_ORDER_SCRIPT) {
      chosen = records.slice(0, 20).map(([id]) => id)
    } else if (script === HIGH_ACTIVITY_SCRIPT) {
      const byDatum = new Map()
      for (const [id, item] of records) {
        const key = item.datumHash ?? 'NO_DATUM_HASH'
        const list = byDatum.get(key) ?? []
        if (list.length < 2) list.push(id)
        byDatum.set(key, list)
      }
      chosen = [...byDatum.values()].flat()
    } else {
      chosen = records.slice(0, 3).map(([id]) => id)
    }
    for (const id of chosen) add(id, 'HISTORICAL_SPEND:' + script)
  }
  return [...selected.values()]
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
        url, method, status: response.status, date: response.headers.get('date'),
        bodyBytes: Buffer.byteLength(raw), bodySha256: sha256(Buffer.from(raw, 'utf8')),
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
  const row = Array.isArray(json) ? json[0] : json
  const absSlot = String(row?.abs_slot ?? row?.absolute_slot ?? '')
  const hash = String(row?.hash ?? row?.block_hash ?? '').toLowerCase()
  const blockNo = Number(row?.block_no ?? row?.block_height)
  if (!/^\d+$/.test(absSlot) || !/^[0-9a-f]{64}$/.test(hash) || !Number.isSafeInteger(blockNo)) throw new Error('KOIOS_TIP_INVALID')
  return { absSlot, hash, blockNo, evidence }
}

function summarizeAssets(raw) {
  const assets = {}
  for (const item of Array.isArray(raw) ? raw : []) {
    const policy = String(item?.policy_id ?? '').toLowerCase()
    const name = String(item?.asset_name ?? '').toLowerCase()
    const quantity = String(item?.quantity ?? '')
    if (!/^[0-9a-f]{56}$/.test(policy) || !/^[0-9a-f]{0,64}$/.test(name) || !/^-?\d+$/.test(quantity)) continue
    const unit = policy + name
    assets[unit] = (BigInt(assets[unit] ?? '0') + BigInt(quantity)).toString()
  }
  return assets
}

function summarizeEndpoint(row, targetHashes) {
  const payment = row?.payment_addr ?? {}
  const credential = String(payment?.cred ?? '').toLowerCase()
  const assets = summarizeAssets(row?.asset_list)
  const inlineValue = row?.inline_datum?.value ?? null
  const candidateScript = targetHashes.has(credential)
  const tx = String(row?.tx_hash ?? '').toLowerCase()
  const index = Number(row?.tx_index)
  return {
    outRef: /^[0-9a-f]{64}$/.test(tx) && Number.isSafeInteger(index) ? tx + '#' + index : null,
    address: payment?.bech32 ?? null,
    paymentCredential: credential || null,
    isCandidateScript: candidateScript,
    lovelace: String(row?.value ?? '0'),
    approvedTusdmAtomic: assets[TUSDM_UNIT] ?? '0',
    assets,
    datumHash: typeof row?.datum_hash === 'string' ? row.datum_hash.toLowerCase() : null,
    inlineDatumHash: inlineValue === null ? null : hashJson(inlineValue),
    inlineDatumValue: candidateScript ? inlineValue : undefined,
    referenceScriptHash: row?.reference_script?.hash ?? null,
  }
}

function summarizePlutusContract(item) {
  const input = item?.input ?? {}
  const redeemer = input?.redeemer ?? {}
  const datum = input?.datum ?? {}
  const ref = item?.spends_input
  return {
    scriptHash: String(item?.script_hash ?? '').toLowerCase(),
    address: item?.address ?? null,
    spendsInput: ref ? String(ref.tx_hash ?? '').toLowerCase() + '#' + String(ref.tx_index ?? '') : null,
    validContract: item?.valid_contract ?? null,
    scriptSize: item?.size ?? null,
    purpose: redeemer?.purpose ?? null,
    fee: redeemer?.fee ?? null,
    executionUnit: redeemer?.unit ?? null,
    redeemerDatumHash: redeemer?.datum?.hash ?? null,
    redeemerDatumValue: redeemer?.datum?.value ?? null,
    spentDatumHash: datum?.hash ?? null,
    spentDatumValue: datum?.value ?? null,
  }
}

export function summarizeTransaction(row, targetHashes = new Set(CANDIDATE_GROUPS.map(x => x.scriptHash))) {
  const hash = txHash(String(row?.tx_hash ?? ''), 'TX_INFO_HASH')
  const inputs = (row.inputs ?? []).map(x => summarizeEndpoint(x, targetHashes))
  const outputs = (row.outputs ?? []).map(x => summarizeEndpoint(x, targetHashes))
  const contracts = (row.plutus_contracts ?? []).map(summarizePlutusContract)
  const inputTusdm = inputs.reduce((n, x) => n + BigInt(x.approvedTusdmAtomic), 0n)
  const outputTusdm = outputs.reduce((n, x) => n + BigInt(x.approvedTusdmAtomic), 0n)
  return {
    txHash: hash,
    blockHash: row.block_hash ?? null,
    blockHeight: row.block_height ?? null,
    epoch: row.epoch_no ?? null,
    absoluteSlot: row.absolute_slot ?? null,
    timestampUnixSeconds: row.tx_timestamp ?? null,
    txSizeBytes: row.tx_size ?? null,
    feeLovelace: row.fee ?? null,
    validContract: row.valid_contract ?? null,
    inputCount: inputs.length,
    outputCount: outputs.length,
    referenceInputCount: (row.reference_inputs ?? []).length,
    collateralInputCount: (row.collateral_inputs ?? []).length,
    inputAdaLovelace: inputs.reduce((n, x) => n + BigInt(x.lovelace), 0n).toString(),
    outputAdaLovelace: outputs.reduce((n, x) => n + BigInt(x.lovelace), 0n).toString(),
    inputTusdmAtomic: inputTusdm.toString(),
    outputTusdmAtomic: outputTusdm.toString(),
    netTusdmAtomic: (outputTusdm - inputTusdm).toString(),
    candidateScriptInputs: inputs.filter(x => x.isCandidateScript),
    candidateScriptOutputs: outputs.filter(x => x.isCandidateScript),
    // All endpoint summaries retain exact ADA/native-asset Values and public
    // destination credentials so counterpart flows can be audited without
    // inferring them from aggregate transaction totals.
    allInputEndpoints: inputs,
    allOutputEndpoints: outputs,
    // Preserve every non-candidate endpoint that holds the approved tUSDM.
    // This makes the recipient side visible when a candidate escrow closes,
    // without retaining unrelated wallet UTxOs or claiming a market swap.
    relevantInputEndpoints: inputs.filter(x => x.isCandidateScript || BigInt(x.approvedTusdmAtomic) > 0n),
    relevantOutputEndpoints: outputs.filter(x => x.isCandidateScript || BigInt(x.approvedTusdmAtomic) > 0n),
    otherInputCount: inputs.filter(x => !x.isCandidateScript).length,
    plutusContracts: contracts,
    metadataKeys: row.metadata && typeof row.metadata === 'object' ? Object.keys(row.metadata) : [],
    metadataHash: row.metadata ? hashJson(row.metadata) : null,
  }
}

export async function observe({ fetchImpl = fetch } = {}) {
  const startedAt = new Date().toISOString()
  const before = await readTip(fetchImpl)
  const redeemerHistory = []
  for (const group of CANDIDATE_GROUPS) {
    try {
      const { json, evidence } = await requestJson('/script_redeemers?_script_hash=' + encodeURIComponent(group.scriptHash), { fetchImpl })
      const row = Array.isArray(json) ? json.find(x => String(x?.script_hash ?? '').toLowerCase() === group.scriptHash) : null
      const items = Array.isArray(row?.redeemers) ? row.redeemers : []
      redeemerHistory.push({
        scriptHash: group.scriptHash,
        redeemerCount: items.length,
        redeemers: items.map(x => ({
          txHash: typeof x?.tx_hash === 'string' ? x.tx_hash.toLowerCase() : null,
          datumHash: typeof x?.datum_hash === 'string' ? x.datum_hash.toLowerCase() : null,
          purpose: x?.purpose ?? null,
        })),
        requestEvidence: evidence,
      })
    } catch (error) {
      redeemerHistory.push({ scriptHash: group.scriptHash, status: 'BLOCKED_REDEEMER_HISTORY', reason: error.message, requestEvidence: error.evidence ?? null })
    }
  }

  const selected = selectRelevantTransactions(redeemerHistory)
  const targetHashes = new Set(CANDIDATE_GROUPS.map(x => x.scriptHash))
  const transactions = []
  const txErrors = []
  for (let offset = 0; offset < selected.length; offset += 20) {
    const batch = selected.slice(offset, offset + 20)
    try {
      const { json, evidence } = await requestJson('/tx_info', {
        method: 'POST',
        body: {
          _tx_hashes: batch.map(x => x.txHash),
          _inputs: true, _metadata: true, _assets: true,
          _withdrawals: false, _certs: false, _scripts: true, _bytecode: false,
        },
        fetchImpl,
      })
      if (!Array.isArray(json)) throw new Error('KOIOS_TX_INFO_RESPONSE_INVALID')
      const byHash = new Map(json.map(x => [String(x?.tx_hash ?? '').toLowerCase(), x]))
      for (const item of batch) {
        const row = byHash.get(item.txHash)
        if (!row) {
          txErrors.push({ txHash: item.txHash, status: 'BLOCKED_TX_INFO_NOT_FOUND', reasons: item.reasons, requestEvidence: evidence })
          continue
        }
        try {
          transactions.push({ ...summarizeTransaction(row, targetHashes), selectionReasons: item.reasons, requestEvidence: evidence })
        } catch (error) {
          txErrors.push({ txHash: item.txHash, status: 'BLOCKED_TX_INFO_INVALID', reason: error.message, reasons: item.reasons, requestEvidence: evidence })
        }
      }
    } catch (error) {
      for (const item of batch) txErrors.push({ txHash: item.txHash, status: 'BLOCKED_TX_INFO_QUERY', reason: error.message, reasons: item.reasons, requestEvidence: error.evidence ?? null })
    }
  }

  const after = await readTip(fetchImpl)
  const manifest = {
    schema: 'IMMORTAL-PREPROD-TUSDM-TX-HISTORY-RECONSTRUCTION-v1',
    mode: { readOnly: true, walletLoaded: false, transactionBuilt: false, transactionSigned: false, transactionSubmitted: false, stateChanged: false },
    network: 'cardano-preprod',
    sourceProbe: SOURCE_PROBE,
    startedAt,
    completedAt: new Date().toISOString(),
    tipBefore: { absSlot: before.absSlot, hash: before.hash, blockNo: before.blockNo },
    tipAfter: { absSlot: after.absSlot, hash: after.hash, blockNo: after.blockNo },
    snapshotConsistency: before.absSlot === after.absSlot && before.hash === after.hash,
    selection: {
      requestedTransactions: selected.length,
      sourceCreationTransactions: selected.filter(x => x.reasons.includes('CURRENT_CANDIDATE_UTXO_CREATION')).length,
      targetOrderSpendTransactions: selected.filter(x => x.reasons.includes('HISTORICAL_SPEND:' + TARGET_ORDER_SCRIPT)).length,
      highActivitySpendTransactions: selected.filter(x => x.reasons.includes('HISTORICAL_SPEND:' + HIGH_ACTIVITY_SCRIPT)).length,
      entries: selected,
    },
    redeemerHistory: redeemerHistory.map(x => ({
      scriptHash: x.scriptHash, redeemerCount: x.redeemerCount,
      uniqueTransactions: new Set((x.redeemers ?? []).map(r => r.txHash)).size,
      status: x.status ?? 'OBSERVED',
    })),
    txInfo: {
      returnedTransactions: transactions.length,
      blockedTransactions: txErrors.length,
      errors: txErrors,
      transactions,
    },
    classification: {
      targetOrderScriptHash: TARGET_ORDER_SCRIPT,
      targetOrderTransactionsReconstructed: transactions.filter(x => x.selectionReasons.includes('HISTORICAL_SPEND:' + TARGET_ORDER_SCRIPT)).length,
      transactionSemanticsResolved: false,
      dexPoolProven: false,
      swapSemanticsProven: false,
      priceProduced: false,
      quoteQualified: false,
      usdUsdmConversionQualified: false,
      issueAuthorized: false,
      note: 'Transaction-level input/output and redeemer traces are discovery evidence only. No validator is classified as a DEX or price source without proving its transition semantics and market-source contract.',
    },
  }
  manifest.evidenceHash = hashJson(manifest)
  return manifest
}

async function main() {
  const manifest = await observe()
  await mkdir(dirname(resolve(OUTPUT)), { recursive: true })
  await writeFile(resolve(OUTPUT), JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify({
    status: 'OBSERVED',
    requestedTransactions: manifest.selection.requestedTransactions,
    returnedTransactions: manifest.txInfo.returnedTransactions,
    blockedTransactions: manifest.txInfo.blockedTransactions,
    targetOrderTransactionsReconstructed: manifest.classification.targetOrderTransactionsReconstructed,
    sourceTipStable: manifest.snapshotConsistency,
    evidenceHash: manifest.evidenceHash,
    evidencePath: OUTPUT,
  }, null, 2))
  if (manifest.txInfo.errors.length > 0) process.exitCode = 1
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().catch(error => {
    console.error(JSON.stringify({ status: 'BLOCKED', error: error.message, evidence: error.evidence ?? null }))
    process.exitCode = 1
  })
}
