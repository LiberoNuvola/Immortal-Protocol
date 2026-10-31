#!/usr/bin/env node
/**
 * Read-only SaturnSwap Cardano mainnet orderbook observer for exact Moneta USDM / ADA.
 * Reads resting order UTxOs at the official 1%, legacy 4%, and V3 script addresses.
 * It never fills, cancels, signs, submits, or changes an order.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const KOIOS = 'https://api.koios.rest/api/v1'
const USDM = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
})
const USDM_UNIT = USDM.policyId + USDM.assetNameHex
const ADA_UNIT = ''
const PAGE_SIZE = 1000
const MAX_PAGES = 20
const DEPLOYMENTS = Object.freeze([
  {
    id: 'saturn-v2-mainnet-1pct',
    feePercentX100: 100,
    scriptHash: '73990b71041ceade6f867617f6ce9f187ab710ea2bf1ff8db7d0292f',
    address: 'addr1z9eejzm3qsww4hn0semp0akwnuv84dcsag4lrludklgzjt675jq4yvpskgayj55xegdp30g5rfynax66r8vgn9fldndsrfnae7',
    datumFields: 9,
    plutusVersion: 'V2',
  },
  {
    id: 'saturn-v2-mainnet-4pct-runoff',
    feePercentX100: 400,
    scriptHash: '1af84a9e697e1e7b042a0a06f061e88182feb9e9ada950b36a916bd5',
    address: 'addr1zyd0sj57d9lpu7cy9g9qdurpazqc9l4eaxk6j59nd2gkh4275jq4yvpskgayj55xegdp30g5rfynax66r8vgn9fldndsqzf5tn',
    datumFields: 9,
    plutusVersion: 'V2',
  },
  {
    id: 'saturn-v3-mainnet-1pct',
    feePercentX100: 100,
    scriptHash: '6023f59dce0064f1d6d27594dbea25bc4305a9f6a10f3a064037553a',
    address: 'addr1z9sz8avaecqxfuwk6f6efkl2yk7yxpdf76ss7wsxgqm42wh2l9cdyhc0eja9mxq0lgeer90edhlfymnxv2ym3szcetqsp0ume8',
    datumFields: 11,
    plutusVersion: 'V3',
  },
])

const sha256 = (raw) => createHash('sha256').update(raw, 'utf8').digest('hex')

function constr(value, expected, name) {
  if (!value || value.constructor !== expected || !Array.isArray(value.fields)) {
    throw new Error(name + '_CONSTR_' + expected + '_INVALID')
  }
  return value.fields
}
function bytes(value, name) {
  if (!value || typeof value.bytes !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value.bytes)) {
    throw new Error(name + '_BYTES_INVALID')
  }
  return value.bytes.toLowerCase()
}
function integer(value, name) {
  const raw = value?.int
  if (typeof raw !== 'string' && typeof raw !== 'number' && typeof raw !== 'bigint') {
    throw new Error(name + '_INT_INVALID')
  }
  const text = String(raw)
  if (!/^-?\d+$/.test(text)) throw new Error(name + '_INT_INVALID')
  return BigInt(text)
}
function decodeSwapDatum(value, expectedFieldCount) {
  const fields = constr(value, 0, 'SWAP_DATUM')
  if (fields.length !== expectedFieldCount) throw new Error('SWAP_DATUM_FIELD_COUNT_INVALID')
  constr(fields[0], 0, 'SWAP_OWNER_ADDRESS')
  const sellPolicy = bytes(fields[1], 'SELL_POLICY')
  const sellName = bytes(fields[2], 'SELL_NAME')
  const amountSell = integer(fields[3], 'AMOUNT_SELL')
  const buyPolicy = bytes(fields[4], 'BUY_POLICY')
  const buyName = bytes(fields[5], 'BUY_NAME')
  const amountBuy = integer(fields[6], 'AMOUNT_BUY')
  const expiry = fields[7]?.constructor === 1
    ? null
    : integer(constr(fields[7], 0, 'VALID_BEFORE_TIME')[0], 'VALID_BEFORE_TIME_VALUE')
  if (amountSell <= 0n || amountBuy <= 0n) throw new Error('SWAP_AMOUNT_NONPOSITIVE')
  const sellUnit = sellPolicy + sellName
  const buyUnit = buyPolicy + buyName
  if (sellUnit === buyUnit) throw new Error('SWAP_IDENTICAL_ASSETS')
  return {
    sellUnit,
    buyUnit,
    sellPolicy,
    sellName,
    buyPolicy,
    buyName,
    amountSellRaw: amountSell.toString(),
    amountBuyRaw: amountBuy.toString(),
    validBeforeTimeMs: expiry?.toString() ?? null,
    ownerPaymentCredential: bytes(constr(fields[0].fields[0], fields[0].fields[0]?.constructor, 'OWNER_PAYMENT_CREDENTIAL')[0], 'OWNER_PAYMENT_CREDENTIAL_HASH'),
  }
}

function formatRatio(numerator, denominator, decimals = 8) {
  if (denominator <= 0n) throw new Error('PRICE_DENOMINATOR_NONPOSITIVE')
  const scale = 10n ** BigInt(decimals)
  const rounded = (numerator * scale + denominator / 2n) / denominator
  const whole = rounded / scale
  const fraction = (rounded % scale).toString().padStart(decimals, '0').replace(/0+$/, '')
  return fraction ? whole.toString() + '.' + fraction : whole.toString()
}

function deriveQuote(deployment, utxo, datum, snapshotTimeMs) {
  const sell = BigInt(datum.amountSellRaw)
  const buy = BigInt(datum.amountBuyRaw)
  const expiry = datum.validBeforeTimeMs === null ? null : BigInt(datum.validBeforeTimeMs)
  const expired = expiry !== null && expiry <= BigInt(snapshotTimeMs)
  const sellIsUsdm = datum.sellUnit === USDM_UNIT
  const buyIsUsdm = datum.buyUnit === USDM_UNIT
  const sellIsAda = datum.sellUnit === ADA_UNIT
  const buyIsAda = datum.buyUnit === ADA_UNIT
  if (!(sellIsUsdm && buyIsAda) && !(sellIsAda && buyIsUsdm)) return null

  const availableSell = sellIsUsdm
    ? BigInt(String((utxo.asset_list ?? []).find((a) =>
      String(a.policy_id ?? '').toLowerCase() + String(a.asset_name ?? '').toLowerCase() === USDM_UNIT
    )?.quantity ?? '0'))
    : BigInt(String(utxo.value ?? '0'))
  const funded = availableSell >= sell
  const side = sellIsUsdm ? 'ASK_USDM_FOR_ADA' : 'BID_ADA_FOR_USDM'
  const numerator = sellIsUsdm ? buy : sell
  const denominator = sellIsUsdm ? sell : buy
  return {
    deployment: deployment.id,
    plutusVersion: deployment.plutusVersion,
    feePercentX100: deployment.feePercentX100,
    side,
    priceAdaPerUsdm: formatRatio(numerator, denominator),
    priceNumeratorRaw: numerator.toString(),
    priceDenominatorRaw: denominator.toString(),
    sellAmountRaw: sell.toString(),
    buyAmountRaw: buy.toString(),
    exactUsdmUnit: USDM_UNIT,
    utxoRef: String(utxo.tx_hash ?? '') + '#' + String(utxo.tx_index ?? ''),
    address: utxo.address ?? null,
    fundedByCurrentUtxo: funded,
    availableSellRaw: availableSell.toString(),
    expired,
    validBeforeTimeMs: datum.validBeforeTimeMs,
    datumOwnerPaymentCredential: datum.ownerPaymentCredential,
    blockHeight: utxo.block_height ?? null,
    blockTime: utxo.block_time ?? null,
  }
}

export {
  decodeSwapDatum,
  deriveQuote,
  formatRatio,
}

async function readAddress(address, deployment) {
  const pages = []
  const rows = []
  for (let offset = 0; offset < PAGE_SIZE * MAX_PAGES; offset += PAGE_SIZE) {
    const url = KOIOS + '/credential_utxos?limit=' + PAGE_SIZE + '&offset=' + offset
    const response = await fetch(url, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ _payment_credentials: [deployment.scriptHash], _extended: true }),
      signal: AbortSignal.timeout(45_000),
    })
    const raw = await response.text()
    const evidence = {
      url, method: 'POST', status: response.status,
      responseDate: response.headers.get('date'),
      bodySha256: sha256(raw), bodyBytes: Buffer.byteLength(raw), rawBody: raw,
    }
    pages.push(evidence)
    if (!response.ok) throw Object.assign(new Error('KOIOS_CREDENTIAL_UTXOS_HTTP_' + response.status), { pages })
    const json = JSON.parse(raw)
    if (!Array.isArray(json)) throw Object.assign(new Error('KOIOS_CREDENTIAL_UTXOS_SHAPE_INVALID'), { pages })
    rows.push(...json)
    if (json.length < PAGE_SIZE) return { rows, pages, complete: true }
  }
  return { rows, pages, complete: false }
}

async function main() {
  const argv = process.argv.slice(2)
  const outIndex = argv.indexOf('--out')
  const outPath = outIndex >= 0 && argv[outIndex + 1]
    ? resolve(argv[outIndex + 1])
    : resolve('audit/oracles/saturnswap-usdm-orderbook-readonly.json')
  const startedAt = new Date().toISOString()
  const snapshotTimeMs = Date.now()
  const observations = []
  const errors = []
  const deployments = []

  for (const deployment of DEPLOYMENTS) {
    try {
      const result = await readAddress(deployment.address, deployment)
      const orders = []
      const invalidRows = []
      for (const utxo of result.rows) {
        // A payment script can be used with different stake credentials, so the
        // validator payment credential is authoritative; do not pin the full
        // base address from one deployment example.
        if (String(utxo.payment_cred ?? '').toLowerCase() !== deployment.scriptHash) {
          invalidRows.push({ utxoRef: String(utxo.tx_hash ?? '') + '#' + String(utxo.tx_index ?? ''), reason: 'ORDER_SCRIPT_IDENTITY_MISMATCH' })
          continue
        }
        try {
          const decoded = decodeSwapDatum(utxo.inline_datum?.value, deployment.datumFields)
          const quote = deriveQuote(deployment, utxo, decoded, snapshotTimeMs)
          if (quote) orders.push(quote)
        } catch (error) {
          invalidRows.push({
            utxoRef: String(utxo.tx_hash ?? '') + '#' + String(utxo.tx_index ?? ''),
            reason: error instanceof Error ? error.message : String(error),
            datumHash: utxo.inline_datum?.hash ?? null,
            datumCbor: utxo.inline_datum?.bytes ?? null,
          })
        }
      }
      observations.push(...orders)
      deployments.push({
        id: deployment.id,
        feePercentX100: deployment.feePercentX100,
        scriptHash: deployment.scriptHash,
        address: deployment.address,
        rowCount: result.rows.length,
        directUsdmAdaOrderCount: orders.length,
        invalidRowCount: invalidRows.length,
        paginationComplete: result.complete,
        pages: result.pages,
        invalidRows,
      })
    } catch (error) {
      errors.push({
        deployment: deployment.id,
        error: error instanceof Error ? error.message : String(error),
        pages: error?.pages ?? [],
      })
    }
  }

  const active = observations.filter((x) => !x.expired && x.fundedByCurrentUtxo)
  const bids = active.filter((x) => x.side === 'BID_ADA_FOR_USDM').sort((a, b) =>
    BigInt(a.priceNumeratorRaw) * BigInt(b.priceDenominatorRaw) >
    BigInt(b.priceNumeratorRaw) * BigInt(a.priceDenominatorRaw) ? -1 : 1
  )
  const asks = active.filter((x) => x.side === 'ASK_USDM_FOR_ADA').sort((a, b) =>
    BigInt(a.priceNumeratorRaw) * BigInt(b.priceDenominatorRaw) <
    BigInt(b.priceNumeratorRaw) * BigInt(a.priceDenominatorRaw) ? -1 : 1
  )
  const evidence = {
    schema: 'immortal-saturnswap-usdm-orderbook-readonly-v1',
    classification: 'INDEPENDENT_CARDANO_CLOB_VENUE_ORDERBOOK_OBSERVATION_NOT_ORACLE_QUALIFICATION',
    network: 'cardano-mainnet',
    source: {
      name: 'SaturnSwap',
      method: 'Koios read-only UTxO acquisition + public on-chain SwapDatum decoding',
      contractSpec: 'https://github.com/Flux-Point-Studios/saturnswap-filler/blob/main/SPEC.md',
      contractType: 'eUTxO CLOB; not an AMM pool',
    },
    exactAsset: USDM,
    startedAt,
    completedAt: new Date().toISOString(),
    snapshotTimeMs,
    summary: {
      deploymentsQueried: DEPLOYMENTS.length,
      deploymentsWithSuccessfulRead: deployments.length,
      orderUtxosScanned: deployments.reduce((sum, x) => sum + x.rowCount, 0),
      directUsdmAdaOrders: observations.length,
      activeFundedBids: bids.length,
      activeFundedAsks: asks.length,
      expiredOrUnfundedOrders: observations.length - active.length,
      invalidRows: deployments.reduce((sum, x) => sum + x.invalidRowCount, 0),
      sourceErrors: errors.length,
      paginationComplete: deployments.length === DEPLOYMENTS.length && deployments.every((x) => x.paginationComplete),
      bestBidAdaPerUsdm: bids[0]?.priceAdaPerUsdm ?? null,
      bestAskAdaPerUsdm: asks[0]?.priceAdaPerUsdm ?? null,
    },
    bids,
    asks,
    allDirectOrders: observations,
    deployments,
    errors,
    limitations: [
      'Quotes are maker limit orders, not AMM marginal prices or guaranteed executable taker prices; fees, min-UTxO, partial-fill rules and order expiry affect execution.',
      'Only orders directly paired USDM/ADA are included in bid/ask. Token-token paths and multi-hop routes are excluded.',
      'The 4% legacy run-off book is kept separate and its fee rate is preserved; never blend it silently with the 1% deployments.',
      'SaturnSwap is an independent DEX venue (CLOB), but its orderbook is not a USD reference and does not prove the USDM/USD peg.',
      'Koios is the acquisition indexer; source identity comes from the published deployment script hashes and exact script addresses.',
      'No order is filled, cancelled, signed, submitted, refreshed, or modified. Only read-only HTTP requests are issued.',
    ],
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: errors.length === 0 && deployments.length === DEPLOYMENTS.length
      ? 'READ_ONLY_SATURNSWAP_ORDERBOOK_COMPLETE'
      : 'READ_ONLY_SATURNSWAP_ORDERBOOK_PARTIAL',
    output: outPath,
    summary: evidence.summary,
    completedAt: evidence.completedAt,
  }, null, 2))
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null
if (invokedPath === import.meta.url) main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_SATURNSWAP_ORDERBOOK_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
