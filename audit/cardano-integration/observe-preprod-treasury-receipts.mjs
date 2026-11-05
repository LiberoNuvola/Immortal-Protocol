#!/usr/bin/env node

import 'dotenv/config'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Emulator, Lucid } from 'lucid-cardano'
import { buildScriptsFromLucid, treasuryValidator } from '../../src/loadValidator.ts'
import { defaultPrizeTable } from '../../src/gameRules.ts'
import {
  assertTreasuryAddressOutputCrossCheck,
  buildTicketSaleReceiptJournal,
  deriveTreasuryAddressOutputs,
} from './treasury-receipt-journal.mjs'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const PAGE_SIZE = 1000
const TX_BATCH_SIZE = 4
const OUTPUT_PATH = process.env.TREASURY_RECEIPT_JOURNAL_OUTPUT
  ?? 'audit/preprod-evidence/treasury-ticket-sale-receipt-journal.json'
const FROM_BLOCK_HEIGHT = Number(process.env.TREASURY_RECEIPT_FROM_BLOCK_HEIGHT ?? '0')
const REQUEST_DELAY_MS = Number(process.env.KOIOS_REQUEST_DELAY_MS ?? '120')

function requiredEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  throw new Error('TREASURY_RECEIPT_CONFIG_REQUIRED: set one of ' + keys.join(', '))
}

function assertHex(value, length, label) {
  const normalized = String(value ?? '').toLowerCase()
  if (!new RegExp('^[0-9a-f]{' + length + '}$').test(normalized)) {
    throw new Error(label + '_INVALID_HEX')
  }
  return normalized
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex')
}

function delay() {
  return new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS))
}

const responseDigests = []
let requestCount = 0

async function requestJson(endpoint, { method = 'GET', payload, query } = {}) {
  const url = new URL(KOIOS + '/' + endpoint)
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value))
  }
  const response = await fetch(url, {
    method,
    headers: payload == null ? { accept: 'application/json' } : {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: payload == null ? undefined : JSON.stringify(payload),
  })
  const raw = await response.text()
  requestCount += 1
  responseDigests.push({
    endpoint: method + ' /' + endpoint,
    requestIndex: requestCount,
    sha256: sha256(raw),
    status: response.status,
  })
  if (!response.ok) throw new Error('KOIOS_' + endpoint.toUpperCase() + '_HTTP_' + response.status)
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('KOIOS_' + endpoint.toUpperCase() + '_INVALID_JSON')
  }
  await delay()
  return parsed
}

async function postPagedRows(endpoint, payload, tipHeight) {
  const rows = []
  let offset = 0
  let pages = 0
  while (true) {
    const page = await requestJson(endpoint, {
      method: 'POST',
      payload,
      query: {
        limit: PAGE_SIZE,
        offset,
        order: endpoint === 'address_outputs'
          ? 'block_height.asc,tx_hash.asc,tx_index.asc'
          : 'block_height.asc,tx_hash.asc',
        block_height: 'lte.' + tipHeight,
      },
    })
    if (!Array.isArray(page)) throw new Error('KOIOS_' + endpoint.toUpperCase() + '_INVALID_RESPONSE')
    for (const row of page) {
      if (Number(row?.block_height) > tipHeight) {
        throw new Error('KOIOS_' + endpoint.toUpperCase() + '_ROW_AFTER_SNAPSHOT_TIP')
      }
      rows.push(row)
    }
    pages += 1
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return { rows, pages }
}

async function fetchTransactionInfo(txHashes) {
  const all = []
  const seen = new Set()
  let batches = 0
  for (let offset = 0; offset < txHashes.length; offset += TX_BATCH_SIZE) {
    const batch = txHashes.slice(offset, offset + TX_BATCH_SIZE)
    const rows = await requestJson('tx_info', {
      method: 'POST',
      payload: {
        _tx_hashes: batch,
        _inputs: true,
        _assets: true,
        _scripts: false,
        _metadata: false,
      },
    })
    if (!Array.isArray(rows)) throw new Error('KOIOS_TX_INFO_INVALID_RESPONSE')
    for (const row of rows) {
      const hash = String(row?.tx_hash ?? '').toLowerCase()
      if (!batch.includes(hash) || seen.has(hash)) {
        throw new Error('KOIOS_TX_INFO_UNEXPECTED_OR_DUPLICATE_HASH')
      }
      seen.add(hash)
      all.push(row)
    }
    for (const hash of batch) {
      if (!seen.has(hash)) throw new Error('KOIOS_TX_INFO_MISSING_HASH_' + hash)
    }
    batches += 1
  }
  return { rows: all, batches }
}

async function fetchConfirmationCounts(txHashes) {
  const counts = new Map()
  for (let offset = 0; offset < txHashes.length; offset += TX_BATCH_SIZE) {
    const batch = txHashes.slice(offset, offset + TX_BATCH_SIZE)
    const rows = await requestJson('tx_status', {
      method: 'POST',
      payload: { _tx_hashes: batch },
    })
    if (!Array.isArray(rows)) throw new Error('KOIOS_TX_STATUS_INVALID_RESPONSE')
    for (const row of rows) {
      const hash = String(row?.tx_hash ?? '').toLowerCase()
      const count = Number(row?.num_confirmations)
      if (!batch.includes(hash) || counts.has(hash) || !Number.isSafeInteger(count) || count < 1) {
        throw new Error('KOIOS_TX_STATUS_ROW_INVALID')
      }
      counts.set(hash, count)
    }
    for (const hash of batch) {
      if (!counts.has(hash)) throw new Error('KOIOS_TX_STATUS_MISSING_HASH_' + hash)
    }
  }
  return counts
}

const oraclePublisherPkh = assertHex(
  requiredEnv('VITE_ORACLE_PUBLISHER_PKH', 'ORACLE_PUBLISHER_PKH'),
  56,
  'ORACLE_PUBLISHER_PKH',
)
const oracleStatePolicyId = assertHex(
  requiredEnv('VITE_ORACLE_STATE_POLICY_ID', 'ORACLE_STATE_POLICY_ID'),
  56,
  'ORACLE_STATE_POLICY_ID',
)
const oracleStateTokenNameHex = requiredEnv(
  'VITE_ORACLE_STATE_TOKEN_NAME_HEX',
  'ORACLE_STATE_TOKEN_NAME_HEX',
).toLowerCase()
if (!/^(?:[0-9a-f]{2}){1,32}$/.test(oracleStateTokenNameHex)) {
  throw new Error('ORACLE_STATE_TOKEN_NAME_INVALID_HEX')
}
const poolTokenPolicyId = assertHex(
  requiredEnv('VITE_B1_POOL_TOKEN_POLICY_ID', 'B1_POOL_TOKEN_POLICY_ID'),
  56,
  'B1_POOL_TOKEN_POLICY_ID',
)
const poolTokenNameHex = requiredEnv(
  'VITE_B1_POOL_TOKEN_NAME_HEX',
  'B1_POOL_TOKEN_NAME_HEX',
).toLowerCase()
if (!/^(?:[0-9a-f]{2}){1,32}$/.test(poolTokenNameHex)) {
  throw new Error('B1_POOL_TOKEN_NAME_INVALID_HEX')
}
const expectedTicketPolicyId = assertHex(
  requiredEnv('VITE_TICKET_POLICY_ID', 'TREASURY_RECEIPT_EXPECTED_TICKET_POLICY_ID'),
  56,
  'EXPECTED_TICKET_POLICY_ID',
)
const configuredTreasuryAddress =
  process.env.VITE_TREASURY_ADDRESS?.trim()
  || process.env.TREASURY_RECEIPT_EXPECTED_TREASURY_ADDRESS?.trim()
  || ''

if (!Number.isSafeInteger(FROM_BLOCK_HEIGHT) || FROM_BLOCK_HEIGHT < 0) {
  throw new Error('TREASURY_RECEIPT_FROM_BLOCK_HEIGHT_INVALID')
}
if (!Number.isSafeInteger(REQUEST_DELAY_MS) || REQUEST_DELAY_MS < 0) {
  throw new Error('KOIOS_REQUEST_DELAY_MS_INVALID')
}

const lucid = await Lucid.new(new Emulator([]), 'Preprod')
const topology = buildScriptsFromLucid(
  lucid,
  defaultPrizeTable,
  oraclePublisherPkh,
  oracleStatePolicyId,
  oracleStateTokenNameHex,
  poolTokenPolicyId,
  poolTokenNameHex,
)
const treasuryAddress = lucid.utils.validatorToAddress(treasuryValidator)
const treasuryPaymentCredential = lucid.utils.validatorToScriptHash(treasuryValidator)
const b1PrizePoolAddress = topology.b1PrizePoolAddress
const b1PrizePoolPaymentCredential = topology.b1PrizePoolHash
const ticketPolicyId = String(topology.ticketPolicyId).toLowerCase()

if (!treasuryAddress || !b1PrizePoolAddress) throw new Error('TREASURY_RECEIPT_TOPOLOGY_ADDRESS_DERIVATION_FAILED')
if (configuredTreasuryAddress && configuredTreasuryAddress !== treasuryAddress) {
  throw new Error('TREASURY_RECEIPT_CONFIGURED_ADDRESS_MISMATCH')
}
if (ticketPolicyId !== expectedTicketPolicyId) {
  throw new Error('TREASURY_RECEIPT_DERIVED_TICKET_POLICY_MISMATCH')
}
if (!/^[0-9a-f]{56}$/.test(treasuryPaymentCredential) ||
    !/^[0-9a-f]{56}$/.test(b1PrizePoolPaymentCredential)) {
  throw new Error('TREASURY_RECEIPT_DERIVED_SCRIPT_CREDENTIAL_INVALID')
}

const artifactPaths = [
  'src/plutusScripts/treasury.plutus.json',
  'src/plutusScripts/counterValidator.plutus.json',
  'src/plutusScripts/beaconRegistry.plutus.json',
  'src/plutusScripts/prizeValidatorFactory.plutus.json',
  'src/plutusScripts/mintPolicyFactory.plutus.json',
  'src/plutusScripts/b1PrizePoolFactory.plutus.json',
  'src/loadValidator.ts',
  'src/gameRules.ts',
]
const artifactFingerprints = {}
for (const artifactPath of artifactPaths) {
  const bytes = await readFile(artifactPath)
  artifactFingerprints[artifactPath] = sha256(bytes)
}

const tipRows = await requestJson('tip')
if (!Array.isArray(tipRows) || tipRows.length !== 1) throw new Error('KOIOS_PREPROD_TIP_INVALID')
const tip = tipRows[0]
const tipHeight = Number(tip.block_no ?? tip.block_height)
if (!Number.isSafeInteger(tipHeight) || tipHeight < 0 || typeof tip.hash !== 'string') {
  throw new Error('KOIOS_PREPROD_TIP_FIELDS_INVALID')
}

const addressPayload = {
  _addresses: [treasuryAddress],
  // Koios address_outputs computes its lower cursor from the first tx in
  // the selected block and uses a strict greater-than comparison. Start one
  // block earlier, then apply the exact inclusive lower bound locally.
  _after_block_height: Math.max(-1, FROM_BLOCK_HEIGHT - 1),
}
const [addressOutputResult, addressTxResult] = await Promise.all([
  postPagedRows('address_outputs', addressPayload, tipHeight),
  postPagedRows('address_txs', addressPayload, tipHeight),
])

const filteredTreasuryOutputs = addressOutputResult.rows.filter((row) => Number(row?.block_height) >= FROM_BLOCK_HEIGHT)
const filteredAddressTransactions = addressTxResult.rows.filter((row) => Number(row?.block_height) >= FROM_BLOCK_HEIGHT)
const allTxHashes = [...new Set([
  ...filteredTreasuryOutputs.map((row) => String(row?.tx_hash ?? '').toLowerCase()),
  ...filteredAddressTransactions.map((row) => String(row?.tx_hash ?? '').toLowerCase()),
])]
if (allTxHashes.some((hash) => !/^[0-9a-f]{64}$/.test(hash))) {
  throw new Error('TREASURY_RECEIPT_ADDRESS_HISTORY_TX_HASH_INVALID')
}
allTxHashes.sort()

const transactionInfoResult = await fetchTransactionInfo(allTxHashes)
const observedAt = new Date().toISOString()
const derivedTreasuryOutputs = deriveTreasuryAddressOutputs({
  treasuryAddress,
  treasuryPaymentCredential,
  transactions: transactionInfoResult.rows,
})
const addressOutputCrossCheck = assertTreasuryAddressOutputCrossCheck({
  treasuryAddress,
  providerRows: filteredTreasuryOutputs,
  derivedRows: derivedTreasuryOutputs,
})
const journal = buildTicketSaleReceiptJournal({
  treasuryAddress,
  treasuryPaymentCredential,
  ticketPolicyId,
  b1PrizePoolAddress,
  b1PrizePoolPaymentCredential,
  addressOutputs: derivedTreasuryOutputs,
  transactions: transactionInfoResult.rows,
  observedAt,
  network: 'cardano-preprod',
})

const confirmationCounts = await fetchConfirmationCounts(
  [...new Set(journal.receiptEvents.map((event) => event.transactionHash))].sort(),
)
for (const event of journal.receiptEvents) {
  event.block.confirmations = confirmationCounts.get(event.transactionHash)
  event.block.confirmationProvider = 'Koios /tx_status'
}

journal.observation = {
  provider: 'Koios',
  baseUrl: KOIOS,
  snapshotTip: {
    hash: tip.hash,
    blockHeight: tipHeight,
    absoluteSlot: tip.abs_slot == null ? null : Number(tip.abs_slot),
    blockTimeUnix: tip.block_time == null ? null : Number(tip.block_time),
  },
  fromBlockHeightInclusive: FROM_BLOCK_HEIGHT,
  history: {
    treasuryAddressOutputRows: derivedTreasuryOutputs.length,
    addressOutputsEndpointCrossCheck: addressOutputCrossCheck,
    treasuryAddressOutputPages: addressOutputResult.pages,
    treasuryAddressTransactionRows: filteredAddressTransactions.length,
    treasuryAddressTransactionPages: addressTxResult.pages,
    uniqueTransactionHashes: allTxHashes.length,
    transactionInfoBatches: transactionInfoResult.batches,
  },
  derivedTopology: {
    treasuryAddress,
    treasuryPaymentCredential,
    b1PrizePoolAddress,
    b1PrizePoolPaymentCredential,
    ticketPolicyId,
    oraclePublisherPkh,
    oracleStatePolicyId,
    oracleStateTokenNameHex,
    poolTokenPolicyId,
    poolTokenNameHex,
    prizeTable: defaultPrizeTable,
  },
  artifactFingerprints,
  responseDigests,
  limitations: [
    'Koios responses are indexed observation evidence, not an independent ledger proof.',
    'TicketSale recognition requires a valid transaction under the exact derived Ticket policy, one exact Treasury output, and one B1 PrizePool input/continuation pair.',
    'Raw ADA/native-asset quantities are recorded without USDM valuation or category allocation.',
    'A spent receipt without a matching consuming transaction in the queried history is explicitly marked unresolved.',
    'Confirmation counts are provider-reported depth only; this observer defines no finality threshold.',
    'The journal grants no spend authority, category credit, posting policy or settlement authority.',
  ],
}

const outputDirectory = path.dirname(OUTPUT_PATH)
await mkdir(outputDirectory, { recursive: true })
await writeFile(OUTPUT_PATH, JSON.stringify(journal, null, 2) + '\n', 'utf8')
console.log(JSON.stringify({
  output: OUTPUT_PATH,
  snapshotBlockHeight: tipHeight,
  treasuryAddress,
  ticketPolicyId,
  summary: journal.summary,
  history: journal.observation.history,
}, null, 2))
