#!/usr/bin/env node
/**
 * Public, unauthenticated ADA/USD spot reference collection.
 * This is CEX market data, not a decentralized oracle and not a USDM peg feed.
 * No account, API key, wallet, transaction, or chain write is used.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const SCALE = 8n
const SOURCES = [
  {
    id: 'coinbase-exchange',
    venue: 'Coinbase Exchange',
    url: 'https://api.exchange.coinbase.com/products/ADA-USD/ticker',
    parse(data) {
      return { last: data.price, bid: data.bid, ask: data.ask, sourceTime: data.time ?? null }
    },
  },
  {
    id: 'kraken',
    venue: 'Kraken',
    url: 'https://api.kraken.com/0/public/Ticker?pair=ADAUSD',
    parse(data) {
      if (Array.isArray(data.error) && data.error.length) throw new Error('KRAKEN_API_ERROR:' + data.error.join(';'))
      const ticker = Object.values(data.result ?? {})[0]
      if (!ticker) throw new Error('KRAKEN_TICKER_MISSING')
      return { last: ticker.c?.[0], bid: ticker.b?.[0], ask: ticker.a?.[0], sourceTime: null }
    },
  },
  {
    id: 'bitstamp',
    venue: 'Bitstamp',
    url: 'https://www.bitstamp.net/api/v2/ticker/adausd/',
    parse(data) {
      return { last: data.last, bid: data.bid, ask: data.ask, sourceTime: data.timestamp ?? null }
    },
  },

  {
    id: 'crypto-com',
    venue: 'Crypto.com Exchange',
    url: 'https://api.crypto.com/v2/public/get-ticker?instrument_name=ADA_USD',
    parse(data) {
      const ticker = data.result?.data?.[0]
      if (data.code !== 0 || !ticker || ticker.i !== 'ADA_USD') throw new Error('CRYPTO_COM_ADA_USD_TICKER_MISSING')
      return { last: ticker.a, bid: ticker.b, ask: ticker.k, sourceTime: ticker.t }
    },
  },
  {
    id: 'btse',
    venue: 'BTSE Spot',
    url: 'https://api.btse.com/spot/api/v3.2/price?symbol=ADA-USD',
    parse(data) {
      const ticker = Array.isArray(data) ? data.find((x) => x.symbol === 'ADA-USD') : null
      if (!ticker) throw new Error('BTSE_ADA_USD_TICKER_MISSING')
      return { last: ticker.lastPrice, index: ticker.indexPrice, bid: null, ask: null, sourceTime: null }
    },
  },
  {
    id: 'gemini',
    venue: 'Gemini',
    url: 'https://api.gemini.com/v1/pubticker/adausd',
    parse(data) {
      return { last: data.last, bid: data.bid, ask: data.ask, sourceTime: null }
    },
  },
  {
    id: 'bitfinex',
    venue: 'Bitfinex',
    url: 'https://api-pub.bitfinex.com/v2/ticker/tADA:USD',
    parse(data) {
      if (!Array.isArray(data) || data.length < 10) throw new Error('BITFINEX_TICKER_SHAPE_INVALID')
      return { bid: data[0], ask: data[2], last: data[6], sourceTime: null }
    },
  },
]

const sha256 = (raw) => createHash('sha256').update(raw, 'utf8').digest('hex')

function toScaled(value) {
  const text = String(value ?? '')
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text)
  if (!match) throw new Error('PRICE_DECIMAL_INVALID:' + text)
  const fraction = (match[2] ?? '').padEnd(Number(SCALE), '0').slice(0, Number(SCALE))
  return BigInt(match[1]) * 10n ** SCALE + BigInt(fraction || '0')
}
function fromScaled(value) {
  const whole = value / (10n ** SCALE)
  const fraction = (value % (10n ** SCALE)).toString().padStart(Number(SCALE), '0').replace(/0+$/, '')
  return fraction ? whole.toString() + '.' + fraction : whole.toString()
}

async function collect(source) {
  const observedAt = new Date().toISOString()
  try {
    const response = await fetch(source.url, {
      headers: { accept: 'application/json', 'user-agent': 'IMMORTAL-Protocol-read-only-market-observer/1.0' },
      signal: AbortSignal.timeout(20_000),
    })
    const rawBody = await response.text()
    const evidence = {
      url: source.url,
      status: response.status,
      responseDate: response.headers.get('date'),
      bodyBytes: Buffer.byteLength(rawBody),
      bodySha256: sha256(rawBody),
      rawBody,
    }
    if (!response.ok) return { id: source.id, venue: source.venue, status: 'SOURCE_UNAVAILABLE', error: 'HTTP_' + response.status, observedAt, evidence }
    const parsed = source.parse(JSON.parse(rawBody))
    const last = toScaled(parsed.last)
    const bid = parsed.bid === null || parsed.bid === undefined ? null : toScaled(parsed.bid)
    const ask = parsed.ask === null || parsed.ask === undefined ? null : toScaled(parsed.ask)
    const index = parsed.index === null || parsed.index === undefined ? null : toScaled(parsed.index)
    if (last <= 0n || (bid !== null && bid <= 0n) || (ask !== null && ask <= 0n) ||
        (bid !== null && ask !== null && ask < bid) || (index !== null && index <= 0n)) {
      throw new Error('ADA_USD_TICKER_VALUES_INVALID')
    }
    return {
      id: source.id,
      venue: source.venue,
      market: 'ADA/USD',
      marketType: 'CENTRALIZED_EXCHANGE_SPOT',
      status: 'MATCHED',
      observedAt,
      sourceTime: parsed.sourceTime,
      bidUsd: bid === null ? null : fromScaled(bid),
      askUsd: ask === null ? null : fromScaled(ask),
      lastUsd: fromScaled(last),
      midUsd: bid === null || ask === null ? null : fromScaled((bid + ask) / 2n),
      indexUsd: index === null ? null : fromScaled(index),
      bidAskAvailable: bid !== null && ask !== null,
      evidence,
    }
  } catch (error) {
    return {
      id: source.id,
      venue: source.venue,
      market: 'ADA/USD',
      status: 'SOURCE_UNAVAILABLE',
      error: error instanceof Error ? error.message : String(error),
      observedAt,
    }
  }
}

async function main() {
  const argv = process.argv.slice(2)
  const index = argv.indexOf('--out')
  const outPath = index >= 0 && argv[index + 1]
    ? resolve(argv[index + 1])
    : resolve('audit/oracles/ada-usd-public-references-readonly.json')
  const startedAt = new Date().toISOString()
  const results = await Promise.all(SOURCES.map(collect))
  const successful = results.filter((x) => x.status === 'MATCHED')
  const evidence = {
    schema: 'immortal-ada-usd-public-cex-reference-v1',
    classification: 'CEX_ADA_USD_MARKET_REFERENCES_NOT_DECENTRALIZED_ORACLE',
    network: 'off-chain-public-market-data',
    pair: 'ADA/USD',
    startedAt,
    completedAt: new Date().toISOString(),
    summary: {
      sourceCount: SOURCES.length,
      successfulSourceCount: successful.length,
      unavailableSourceCount: results.length - successful.length,
      bidAskMidRangeUsd: successful.filter((x) => x.midUsd !== null).length
        ? {
            min: successful.filter((x) => x.midUsd !== null).map((x) => Number(x.midUsd)).reduce((a, b) => Math.min(a, b)).toFixed(8),
            max: successful.filter((x) => x.midUsd !== null).map((x) => Number(x.midUsd)).reduce((a, b) => Math.max(a, b)).toFixed(8),
          }
        : null,
      lastPriceRangeUsd: successful.length
        ? {
            min: successful.map((x) => Number(x.lastUsd)).reduce((a, b) => Math.min(a, b)).toFixed(8),
            max: successful.map((x) => Number(x.lastUsd)).reduce((a, b) => Math.max(a, b)).toFixed(8),
          }
        : null,
    },
    sources: results,
    limitations: [
      'These are centralized-exchange spot tickers, not decentralized oracle feeds.',
      'Each exchange is a separate venue, but all may share correlated global crypto market conditions.',
      'Bid/ask midpoint and last trade are not a guaranteed executable price for a particular order size.',
      'This dataset only provides ADA/USD references. Any USDM/USD cross-rate must combine it with a separately qualified USDM/ADA venue observation and must preserve both timestamps and fees.',
      'No USD/USDM peg, issuer reserve, redemption, EEV, oracle quorum, or deployment qualification is produced.',
    ],
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: successful.length ? 'READ_ONLY_ADA_USD_REFERENCE_COMPLETE' : 'READ_ONLY_ADA_USD_REFERENCE_UNAVAILABLE',
    output: outPath,
    summary: evidence.summary,
    completedAt: evidence.completedAt,
  }, null, 2))
}
main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_ADA_USD_REFERENCE_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
