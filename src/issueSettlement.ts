import { Data } from 'lucid-cardano'

/**
 * PRE-RICH B1 Issue settlement construction.
 *
 * This is deliberately limited to the single authenticated ADA quote exposed
 * by the current OracleDatum/OracleState singleton. Token settlement is not
 * represented as supported here: the current on-chain valuation demands a
 * quote for every non-zero asset, including the ADA minimum-UTxO component.
 */
export const CANONICAL_ORACLE_PRECISION = 1_000_000n
export const CANONICAL_ADA_MIN_UTXO_LOVELACE = 1_600_000n
export const CANONICAL_ORACLE_MAX_AGE_MS = 3_600_000n

export type OraclePriceReference = {
  /** OracleDatum asset policy bytes, represented as lower-case hex. ADA = empty bytes. */
  assetPolicyHex: string
  /** OracleDatum asset name bytes, represented as lower-case hex. ADA = empty bytes. */
  assetNameHex: string
  /** Canonical integer quote used by Economic.totalUsdmValue. */
  price: bigint
  /** POSIX milliseconds, matching OracleDatum/OracleTypes.hs. */
  timestampMs: bigint
  /** OracleDatum publisher key hash, represented as hex. */
  publisherPkh: string
}

/** Narrow name retained for the current ADA-only Issue builder. */
export type AdaOraclePriceReference = OraclePriceReference

export type AdaIssueSettlementRequest = {
  targetUsdmSubunits: bigint
  quote: AdaOraclePriceReference
  expectedPublisherPkh: string
  nowMs: bigint
}

function parseDatum(raw: unknown): any {
  if (typeof raw !== 'string') return raw
  try {
    return Data.from(raw)
  } catch {
    throw new Error('Authenticated OracleDatum CBOR is invalid')
  }
}

function datumFields(value: any): any[] | null {
  return value && Array.isArray(value.fields) ? value.fields : null
}

function datumConstructorIndex(value: any): number | null {
  if (!value || typeof value !== 'object') return null
  const raw = value.index ?? value.constr
  if (raw === undefined) return null
  const index = Number(raw)
  return Number.isInteger(index) ? index : null
}

function datumBytes(value: any): string | null {
  const bytes = typeof value === 'string' ? value : value?.bytes
  return typeof bytes === 'string' ? bytes.toLowerCase() : null
}

function datumInteger(value: any): bigint | null {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value)
  if (value && typeof value.int !== 'undefined') {
    try {
      return BigInt(value.int)
    } catch {
      return null
    }
  }
  return null
}

function decodeOracleQuoteRecord(value: unknown): OraclePriceReference {
  if (datumConstructorIndex(value) !== 0) {
    throw new Error('OracleQuote constructor is invalid')
  }
  const fields = datumFields(value)
  if (!fields || fields.length !== 5) {
    throw new Error('OracleQuote must contain exactly five fields')
  }
  const assetPolicyHex = datumBytes(fields[0])
  const assetNameHex = datumBytes(fields[1])
  const price = datumInteger(fields[2])
  const timestampMs = datumInteger(fields[3])
  const publisherPkh = datumBytes(fields[4])
  if (
    assetPolicyHex === null ||
    assetNameHex === null ||
    price === null ||
    timestampMs === null ||
    publisherPkh === null
  ) {
    throw new Error('OracleQuote contains invalid field types')
  }
  return { assetPolicyHex, assetNameHex, price, timestampMs, publisherPkh }
}

/**
 * Decode a requested asset price from either legacy constructor 0
 * (five fields) or additive constructor 1 (a list of OracleQuote records).
 * The requested asset must occur exactly once in a quote set. This mirrors
 * lookupOracleQuote in OracleTypes.hs and never falls back to another asset.
 */
export function decodeOraclePriceReference(
  raw: unknown,
  expectedAssetPolicyHex: string,
  expectedAssetNameHex: string,
): OraclePriceReference {
  const datum = parseDatum(raw)
  const constructor = datumConstructorIndex(datum)
  const fields = datumFields(datum)
  if (!fields) throw new Error('OracleDatum fields are missing or malformed')

  const expectedPolicy = expectedAssetPolicyHex.toLowerCase()
  const expectedName = expectedAssetNameHex.toLowerCase()

  if (constructor === 0) {
    const quote = decodeOracleQuoteRecord(datum)
    if (quote.assetPolicyHex !== expectedPolicy || quote.assetNameHex !== expectedName) {
      throw new Error('OracleDatum asset identity does not match requested asset')
    }
    return quote
  }

  if (constructor !== 1 || fields.length !== 1 || !Array.isArray(fields[0])) {
    throw new Error('OracleQuoteSet constructor or quote list is invalid')
  }
  const quotes = (fields[0] as unknown[]).map(decodeOracleQuoteRecord)
  const matches = quotes.filter(
    quote => quote.assetPolicyHex === expectedPolicy && quote.assetNameHex === expectedName,
  )
  if (matches.length !== 1) {
    throw new Error(`OracleQuoteSet must contain exactly one quote for requested asset; found ${matches.length}`)
  }
  return matches[0]
}

export function decodeAdaOraclePriceReference(raw: unknown): AdaOraclePriceReference {
  return decodeOraclePriceReference(raw, '', '')
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (numerator < 0n) throw new Error('settlement numerator must be non-negative')
  if (denominator <= 0n) throw new Error('oracle price must be positive')
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator
}

/**
 * Derive the ADA output value that Economic.totalUsdmValue maps to the exact
 * requested USDM sub-unit price. The output includes the protocol's ADA
 * min-UTxO quantity; only the economic ADA above that floor is valued on-chain.
 *
 * We choose the largest integer lovelace quantity whose canonical ceiling
 * conversion still equals the target. If the target is not representable with
 * the selected quote, the builder fails closed rather than introducing a new
 * rounding or haircut rule.
 */
export function deriveAdaIssueSettlementLovelace(
  request: AdaIssueSettlementRequest,
): bigint {
  const { targetUsdmSubunits: target, quote, expectedPublisherPkh, nowMs } = request
  if (target <= 0n) throw new Error('USDM settlement target must be positive')
  if (quote.assetPolicyHex !== '' || quote.assetNameHex !== '') {
    throw new Error('current Issue settlement supports only an authenticated ADA OracleDatum quote')
  }
  if (quote.price <= 0n) throw new Error('ADA oracle price must be positive')
  if (quote.timestampMs < 0n || quote.timestampMs > nowMs) {
    throw new Error('ADA oracle timestamp is invalid or in the future')
  }
  if (nowMs - quote.timestampMs > CANONICAL_ORACLE_MAX_AGE_MS) {
    throw new Error('ADA oracle quote is stale')
  }
  if (!expectedPublisherPkh.trim() || quote.publisherPkh.toLowerCase() !== expectedPublisherPkh.toLowerCase()) {
    throw new Error('ADA oracle publisher does not match the configured publisher')
  }

  // Invert the exact on-chain conversion:
  // ceil((economicLovelace * quote.price) / precision) == target.
  const economicLovelace = (target * CANONICAL_ORACLE_PRECISION) / quote.price
  if (economicLovelace <= 0n) {
    throw new Error('USDM target cannot be represented by an integer ADA settlement amount')
  }
  const converted = ceilDiv(
    economicLovelace * quote.price,
    CANONICAL_ORACLE_PRECISION,
  )
  if (converted !== target) {
    throw new Error('USDM target cannot be represented by the authenticated ADA quote')
  }
  if (
    ceilDiv((economicLovelace + 1n) * quote.price, CANONICAL_ORACLE_PRECISION) <= target
  ) {
    throw new Error('ADA settlement amount is not maximal for the canonical USDM conversion')
  }

  return CANONICAL_ADA_MIN_UTXO_LOVELACE + economicLovelace
}

function unwrapOption<T>(value: any): T | undefined {
  if (value == null) return undefined
  if (typeof value.is_some === 'function') {
    return value.is_some() ? value.unwrap() as T : undefined
  }
  return value as T
}

function countCollection(value: any): number | null {
  if (Array.isArray(value)) return value.length
  if (value && typeof value.len === 'function') return Number(value.len())
  return null
}

function completedOutputs(completedTx: any): any[] {
  const rawOutputs = completedTx?.txComplete?.body?.()?.outputs?.()
  if (Array.isArray(rawOutputs)) return rawOutputs
  if (rawOutputs && typeof rawOutputs.len === 'function' && typeof rawOutputs.get === 'function') {
    const outputs: any[] = []
    for (let index = 0; index < Number(rawOutputs.len()); index += 1) {
      outputs.push(rawOutputs.get(index))
    }
    return outputs
  }
  throw new Error('Completed Lucid transaction body outputs are unavailable')
}

/**
 * Inspect the transaction body produced by Lucid.complete(), not merely the
 * input request. Exactly one Treasury output must exist, it must carry the
 * expected ADA amount, and it must not contain any non-ADA assets.
 */
export function assertCompletedTreasuryAdaSettlement(
  completedTx: any,
  treasuryAddress: string,
  expectedLovelace: bigint,
): void {
  if (!treasuryAddress) throw new Error('Treasury address is required for completed-body conformance')
  if (expectedLovelace <= CANONICAL_ADA_MIN_UTXO_LOVELACE) {
    throw new Error('Treasury settlement must include the ADA minimum-UTxO floor and positive economic ADA')
  }

  const matches = completedOutputs(completedTx).filter((output) => {
    const address = output?.address?.()
    return typeof address?.to_bech32 === 'function' && address.to_bech32() === treasuryAddress
  })
  if (matches.length !== 1) {
    throw new Error(`Completed transaction must contain exactly one Treasury output; found ${matches.length}`)
  }

  const value = matches[0]?.amount?.()
  const coin = value?.coin?.()
  if (coin == null) throw new Error('Completed Treasury output ADA amount is unavailable')
  const coinString = typeof coin.to_str === 'function' ? coin.to_str() : String(coin)
  let actualLovelace: bigint
  try {
    actualLovelace = BigInt(coinString)
  } catch {
    throw new Error('Completed Treasury output ADA amount is invalid')
  }
  if (actualLovelace !== expectedLovelace) {
    throw new Error(`Completed Treasury output mismatch: expected ${expectedLovelace}, got ${actualLovelace}`)
  }

  const multiasset = unwrapOption<any>(value?.multiasset?.())
  if (multiasset != null) {
    const policies = typeof multiasset.keys === 'function' ? multiasset.keys() : null
    const count = countCollection(policies)
    if (count === null || count > 0) {
      throw new Error('Completed Treasury output unexpectedly contains non-ADA assets')
    }
  }
}
