import { Data } from 'lucid-cardano'

/**
 * PRE-RICH B1 Issue settlement construction.
 *
 * The legacy OracleDatum constructor contains one asset quote; the additive
 * OracleQuoteSet constructor can carry several asset-specific quotes inside
 * the same authenticated singleton. Every nonzero asset in the actual
 * Treasury output still requires an exact, fresh, publisher-matched quote,
 * including ADA for the minimum-UTxO component.
 *
 * This module only prevalidates the requested integer basket and verifies the
 * completed transaction body. MintPolicy/Economic remain authoritative on-chain.
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
 * Decode all quotes from the authenticated Oracle datum. Legacy constructor 0
 * yields one quote; constructor 1 yields the asset-specific quote list.
 */
export function decodeOraclePriceReferences(raw: unknown): OraclePriceReference[] {
  const datum = parseDatum(raw)
  const constructor = datumConstructorIndex(datum)
  const fields = datumFields(datum)
  if (!fields) throw new Error('OracleDatum fields are missing or malformed')

  if (constructor === 0) {
    return [decodeOracleQuoteRecord(datum)]
  }
  if (constructor !== 1 || fields.length !== 1 || !Array.isArray(fields[0])) {
    throw new Error('OracleQuoteSet constructor or quote list is invalid')
  }
  return (fields[0] as unknown[]).map(decodeOracleQuoteRecord)
}

/**
 * Decode a requested asset price from legacy constructor 0 or additive
 * constructor 1. The requested asset must occur exactly once in a quote set.
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

  const matches = decodeOraclePriceReferences(raw).filter(
    quote => quote.assetPolicyHex === expectedPolicy && quote.assetNameHex === expectedName,
  )
  if (matches.length !== 1) {
    throw new Error(`OracleQuoteSet must contain exactly one quote for requested asset; found ${matches.length}`)
  }
  return matches[0]
}

/**
 * Backward-compatible ADA quote accessor. On the additive quote-set schema,
 * this selects only the exact ADA (empty policy/name) quote; it does not treat
 * an arbitrary quote as ADA or relax the on-chain publisher/freshness checks.
 */
export function decodeAdaOraclePriceReference(raw: unknown): AdaOraclePriceReference {
  return decodeOraclePriceReference(raw, '', '')
}

/**
 * Resolve and validate an asset quote for the DApp basket editor. This is an
 * option/preflight helper only; Plutus revalidates the quote against the
 * transaction validity upper bound when the settlement is executed.
 */
export function validateIssueSettlementQuote(
  oracleDatum: unknown,
  assetUnit: string,
  expectedPublisherPkh: string,
  nowMs: bigint,
): OraclePriceReference {
  if (!expectedPublisherPkh.trim()) {
    throw new Error('Expected oracle publisher is required')
  }
  const quote = oracleQuoteForUnit(
    decodeOraclePriceReferences(oracleDatum),
    assetUnit.toLowerCase(),
    expectedPublisherPkh,
    nowMs,
  )
  if (quote.price <= 0n) {
    throw new Error(`Oracle quote for settlement asset ${assetUnit} must be positive`)
  }
  return quote
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

export type IssueSettlementAssetQuantities = Readonly<Record<string, bigint>>

export type BuildIssueSettlementAssetsRequest = {
  targetUsdmSubunits: bigint
  /** Native quantities chosen by the buyer. 'lovelace' is economic ADA excluding min-UTxO. */
  economicAssetQuantities: IssueSettlementAssetQuantities
  /** The inline datum from the exact authenticated Oracle State singleton UTxO. */
  oracleDatum: unknown
  expectedPublisherPkh: string
  nowMs: bigint
}

function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function unitIdentity(unit: string): { assetPolicyHex: string; assetNameHex: string } {
  if (unit === 'lovelace') return { assetPolicyHex: '', assetNameHex: '' }
  if (
    unit.length < 56 ||
    unit.length > 120 ||
    unit.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(unit)
  ) {
    throw new Error(`Settlement asset unit is not a canonical Cardano policy/name hex unit: ${unit}`)
  }
  return {
    assetPolicyHex: unit.slice(0, 56).toLowerCase(),
    assetNameHex: unit.slice(56).toLowerCase(),
  }
}

function oracleQuoteForUnit(
  quotes: readonly OraclePriceReference[],
  unit: string,
  expectedPublisherPkh: string,
  nowMs: bigint,
): OraclePriceReference {
  const identity = unitIdentity(unit)
  const matches = quotes.filter(
    quote => quote.assetPolicyHex === identity.assetPolicyHex && quote.assetNameHex === identity.assetNameHex,
  )
  if (matches.length !== 1) {
    throw new Error(`OracleQuoteSet must contain exactly one quote for settlement asset ${unit}; found ${matches.length}`)
  }

  const quote = matches[0]
  if (quote.price < 0n) throw new Error(`Oracle price is negative for settlement asset ${unit}`)
  if (quote.timestampMs < 0n || quote.timestampMs > nowMs) {
    throw new Error(`Oracle timestamp is invalid or in the future for settlement asset ${unit}`)
  }
  if (nowMs - quote.timestampMs > CANONICAL_ORACLE_MAX_AGE_MS) {
    throw new Error(`Oracle quote is stale for settlement asset ${unit}`)
  }
  if (
    !expectedPublisherPkh.trim() ||
    quote.publisherPkh.toLowerCase() !== expectedPublisherPkh.toLowerCase()
  ) {
    throw new Error(`Oracle publisher mismatch for settlement asset ${unit}`)
  }
  return quote
}

/**
 * Build a concrete Treasury output basket from quantities selected by the
 * buyer, using only quotes decoded from the authenticated Oracle State datum.
 * The builder adds the canonical ADA minimum-UTxO amount. It then mirrors the
 * exact on-chain integer conversion and requires equality with the USDM target.
 * This is a preflight check only; MintPolicy's on-chain equality remains final.
 */
export function buildIssueSettlementAssets(
  request: BuildIssueSettlementAssetsRequest,
): Record<string, bigint> {
  const {
    targetUsdmSubunits: target,
    economicAssetQuantities,
    oracleDatum,
    expectedPublisherPkh,
    nowMs,
  } = request
  if (target <= 0n) throw new Error('USDM settlement target must be positive')
  if (!expectedPublisherPkh.trim()) throw new Error('Expected oracle publisher is required')
  if (nowMs < 0n) throw new Error('Current time must be non-negative')

  const entries = Object.entries(economicAssetQuantities)
  if (entries.length === 0) throw new Error('Settlement asset quantities cannot be empty')

  const normalized = new Map<string, bigint>()
  let adaEconomic = 0n
  let economicAssetCount = 0

  for (const [rawUnit, quantity] of entries) {
    if (typeof quantity !== 'bigint') {
      throw new Error(`Settlement quantity for ${rawUnit} must be bigint`)
    }
    const unit = rawUnit.toLowerCase()
    if (normalized.has(unit)) {
      throw new Error(`Duplicate normalized settlement asset unit: ${unit}`)
    }
    if (unit === 'lovelace') {
      if (quantity < 0n) throw new Error('Economic ADA quantity cannot be negative')
      adaEconomic = quantity
      if (quantity > 0n) economicAssetCount += 1
      normalized.set(unit, quantity)
      continue
    }
    unitIdentity(unit)
    if (quantity <= 0n) throw new Error(`Settlement quantity for ${unit} must be positive`)
    normalized.set(unit, quantity)
    economicAssetCount += 1
  }

  if (economicAssetCount === 0) {
    throw new Error('Settlement basket must include at least one positive economic asset quantity')
  }

  const outputAssets: Record<string, bigint> = {
    lovelace: CANONICAL_ADA_MIN_UTXO_LOVELACE + adaEconomic,
  }
  for (const [unit, quantity] of normalized) {
    if (unit !== 'lovelace') outputAssets[unit] = quantity
  }

  const quotes = decodeOraclePriceReferences(oracleDatum)
  let valuedUsdmSubunits = 0n
  for (const [unit, quantity] of Object.entries(outputAssets)) {
    const quote = oracleQuoteForUnit(quotes, unit, expectedPublisherPkh, nowMs)
    const economicQuantity = unit === 'lovelace'
      ? (quantity > CANONICAL_ADA_MIN_UTXO_LOVELACE
        ? quantity - CANONICAL_ADA_MIN_UTXO_LOVELACE
        : 0n)
      : quantity
    valuedUsdmSubunits += ceilDiv(
      economicQuantity * quote.price,
      CANONICAL_ORACLE_PRECISION,
    )
  }

  if (valuedUsdmSubunits !== target) {
    throw new Error(
      `Settlement asset basket values to ${valuedUsdmSubunits} USDM sub-units; expected ${target}`,
    )
  }

  return outputAssets
}

/**
 * Derive a finite transaction validity deadline from the quote set actually
 * used to value the expected Treasury output.
 *
 * Economic.validOracleTimestamp validates each selected quote against the
 * transaction validity upper bound, not the local frontend clock. The Issue
 * body must therefore carry a finite TTL no later than the earliest quote's
 * existing timestamp + maxOracleAge. This adds no new freshness horizon.
 */
export function deriveIssueSettlementValidityUpperBoundMs(request: {
  treasuryAssets: Readonly<Record<string, bigint>>
  oracleDatum: unknown
  expectedPublisherPkh: string
  nowMs: bigint
}): bigint {
  const { treasuryAssets, oracleDatum, expectedPublisherPkh, nowMs } = request
  if (nowMs < 0n) throw new Error('Current time must be non-negative')

  const entries = Object.entries(treasuryAssets)
  if (entries.length === 0) throw new Error('Treasury settlement asset map cannot be empty')

  const quotes = decodeOraclePriceReferences(oracleDatum)
  let earliestDeadline: bigint | null = null
  for (const [rawUnit, quantity] of entries) {
    const unit = rawUnit.toLowerCase()
    if (typeof quantity !== 'bigint' || quantity <= 0n) {
      throw new Error(`Treasury settlement quantity for ${unit} must be positive`)
    }
    const quote = oracleQuoteForUnit(quotes, unit, expectedPublisherPkh, nowMs)
    const deadline = quote.timestampMs + CANONICAL_ORACLE_MAX_AGE_MS
    if (deadline <= nowMs) {
      throw new Error('Issue settlement quote has no future transaction-validity window')
    }
    if (earliestDeadline === null || deadline < earliestDeadline) {
      earliestDeadline = deadline
    }
  }

  if (earliestDeadline === null) {
    throw new Error('Issue settlement validity deadline could not be derived')
  }
  return earliestDeadline
}

export type DeriveSingleAssetIssueSettlementRequest = {
  targetUsdmSubunits: bigint
  /** Cardano unit: 'lovelace' or policyIdHex + assetNameHex. */
  assetUnit: string
  /** The inline datum from the exact authenticated Oracle State singleton UTxO. */
  oracleDatum: unknown
  expectedPublisherPkh: string
  nowMs: bigint
}

/**
 * Derive the largest integer quantity of one selected asset whose existing
 * canonical ceiling conversion equals the ticket's USDM-subunit target.
 * The function does not choose assets or assign prices: it only inverts the
 * authenticated on-chain quote and then validates the complete output basket,
 * including the ADA min-UTxO quote, through buildIssueSettlementAssets.
 */
export function deriveSingleAssetIssueSettlementQuantities(
  request: DeriveSingleAssetIssueSettlementRequest,
): Record<string, bigint> {
  const unit = request.assetUnit.toLowerCase()
  if (unit !== 'lovelace') unitIdentity(unit)
  if (request.targetUsdmSubunits <= 0n) {
    throw new Error('USDM settlement target must be positive')
  }

  const quotes = decodeOraclePriceReferences(request.oracleDatum)
  const quote = oracleQuoteForUnit(
    quotes,
    unit,
    request.expectedPublisherPkh,
    request.nowMs,
  )
  if (quote.price <= 0n) {
    throw new Error('Selected asset has no positive authenticated Oracle price')
  }

  const quantity =
    (request.targetUsdmSubunits * CANONICAL_ORACLE_PRECISION) / quote.price
  if (quantity <= 0n) {
    throw new Error('USDM target cannot be represented by a positive quantity of the selected asset')
  }

  const economicAssetQuantities = { [unit]: quantity }
  buildIssueSettlementAssets({
    targetUsdmSubunits: request.targetUsdmSubunits,
    economicAssetQuantities,
    oracleDatum: request.oracleDatum,
    expectedPublisherPkh: request.expectedPublisherPkh,
    nowMs: request.nowMs,
  })
  return economicAssetQuantities
}

function unwrapOption<T>(value: any): T | undefined {
  if (value == null) return undefined
  if (typeof value.is_some === 'function') {
    return value.is_some() ? value.unwrap() as T : undefined
  }
  return value as T
}

function collectionItems(value: any, label: string): any[] {
  if (Array.isArray(value)) return value
  if (value && typeof value.len === 'function' && typeof value.get === 'function') {
    const items: any[] = []
    for (let index = 0; index < Number(value.len()); index += 1) {
      items.push(value.get(index))
    }
    return items
  }
  throw new Error(`Completed Treasury ${label} collection is unavailable`)
}

function cmlByteSequenceHex(value: any, label: string): string {
  let raw = value
  if (raw && typeof raw.to_bytes === 'function') raw = raw.to_bytes()
  else if (raw && typeof raw.name === 'function') raw = raw.name()

  if (raw instanceof Uint8Array) return hexFromBytes(raw)
  if (Array.isArray(raw) && raw.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
    return hexFromBytes(Uint8Array.from(raw))
  }
  if (typeof raw === 'string' && raw.length % 2 === 0 && /^[0-9a-fA-F]*$/.test(raw)) {
    return raw.toLowerCase()
  }
  throw new Error(`Completed Treasury ${label} bytes are unavailable`)
}

function cmlInteger(value: any, label: string): bigint {
  if (value == null) throw new Error(`Completed Treasury ${label} is unavailable`)
  const raw = typeof value.to_str === 'function' ? value.to_str() : String(value)
  try {
    return BigInt(raw)
  } catch {
    throw new Error(`Completed Treasury ${label} is invalid`)
  }
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
 * Read the full Value from CML's completed transaction body and require an
 * exact map equality with the payment that was derived from the authenticated
 * quote set. This also rejects injected or omitted basket assets.
 */
function readCompletedTreasuryAssets(output: any): Record<string, bigint> {
  const value = output?.amount?.()
  const coin = cmlInteger(value?.coin?.(), 'ADA amount')
  const assets: Record<string, bigint> = { lovelace: coin }
  const multiasset = unwrapOption<any>(value?.multiasset?.())
  if (multiasset == null) return assets

  const policies = collectionItems(multiasset.keys?.(), 'policy IDs')
  for (const policy of policies) {
    const policyHex = cmlByteSequenceHex(policy, 'policy ID')
    const policyAssets = unwrapOption<any>(multiasset.get?.(policy))
    if (policyAssets == null) throw new Error('Completed Treasury policy has no asset map')
    const assetNames = collectionItems(policyAssets.keys?.(), 'asset names')
    for (const assetName of assetNames) {
      const assetNameHex = cmlByteSequenceHex(assetName, 'asset name')
      let amount: any
      if (typeof multiasset.get_asset === 'function') {
        amount = unwrapOption<any>(multiasset.get_asset(policy, assetName))
      }
      if (amount == null && typeof policyAssets.get === 'function') {
        amount = unwrapOption<any>(policyAssets.get(assetName))
      }
      const quantity = cmlInteger(amount, 'multi-asset quantity')
      if (quantity !== 0n) assets[policyHex + assetNameHex] = quantity
    }
  }
  return assets
}

function normalizeExpectedTreasuryAssets(expectedAssets: Readonly<Record<string, bigint>>): Record<string, bigint> {
  const normalized: Record<string, bigint> = {}
  for (const [rawUnit, quantity] of Object.entries(expectedAssets)) {
    const unit = rawUnit.toLowerCase()
    if (unit !== 'lovelace') unitIdentity(unit)
    if (typeof quantity !== 'bigint' || quantity <= 0n) {
      throw new Error(`Expected Treasury quantity for ${unit} must be a positive bigint`)
    }
    if (normalized[unit] !== undefined) {
      throw new Error(`Duplicate normalized expected Treasury unit: ${unit}`)
    }
    normalized[unit] = quantity
  }
  if (normalized.lovelace === undefined || normalized.lovelace < CANONICAL_ADA_MIN_UTXO_LOVELACE) {
    throw new Error('Expected Treasury output must include the canonical ADA min-UTxO floor')
  }
  return normalized
}

/**
 * Inspect the body returned by Lucid.complete(), not merely the output request.
 * Exactly one Treasury output must have the expected final Value, including all
 * token quantities and the ADA min-UTxO amount.
 */
export function assertCompletedTreasurySettlement(
  completedTx: any,
  treasuryAddress: string,
  expectedAssets: Readonly<Record<string, bigint>>,
): void {
  if (!treasuryAddress) throw new Error('Treasury address is required for completed-body conformance')
  const expected = normalizeExpectedTreasuryAssets(expectedAssets)
  const matches = completedOutputs(completedTx).filter((output) => {
    const address = output?.address?.()
    return typeof address?.to_bech32 === 'function' && address.to_bech32() === treasuryAddress
  })
  if (matches.length !== 1) {
    throw new Error(`Completed transaction must contain exactly one Treasury output; found ${matches.length}`)
  }

  const actual = readCompletedTreasuryAssets(matches[0])
  const expectedEntries = Object.entries(expected).sort(([a], [b]) => a.localeCompare(b))
  const actualEntries = Object.entries(actual).sort(([a], [b]) => a.localeCompare(b))
  if (
    expectedEntries.length !== actualEntries.length ||
    expectedEntries.some(([unit, quantity], index) =>
      actualEntries[index]?.[0] !== unit || actualEntries[index]?.[1] !== quantity
    )
  ) {
    throw new Error(
      `Completed Treasury Value does not match the derived settlement: expected ${JSON.stringify(expectedEntries, (_, value) => typeof value === 'bigint' ? value.toString() : value)}, actual ${JSON.stringify(actualEntries, (_, value) => typeof value === 'bigint' ? value.toString() : value)}`,
    )
  }
}

/** Backward-compatible ADA-only assertion retained for existing callers/tests. */
/**
 * Require that the finalized CML transaction body carries the exact finite
 * TTL selected from the authenticated settlement quote-set freshness window.
 */
export function assertCompletedIssueValidityUpperBound(
  completedTx: any,
  expectedTtlSlot: number,
): void {
  if (!Number.isSafeInteger(expectedTtlSlot) || expectedTtlSlot < 0) {
    throw new Error('Expected Issue TTL slot must be a non-negative safe integer')
  }
  const body = completedTx?.txComplete?.body?.()
  if (!body || typeof body.ttl !== 'function') {
    throw new Error('Completed Issue transaction validity TTL is unavailable')
  }
  const ttl = unwrapOption<any>(body.ttl())
  if (ttl == null) {
    throw new Error('Completed Issue transaction is missing a finite validity upper bound')
  }
  const actualTtlSlot = cmlInteger(ttl, 'validity upper-bound slot')
  if (actualTtlSlot !== BigInt(expectedTtlSlot)) {
    throw new Error(
      `Completed Issue TTL mismatch: expected slot ${expectedTtlSlot}, got ${actualTtlSlot}`,
    )
  }
}

export function assertCompletedTreasuryAdaSettlement(
  completedTx: any,
  treasuryAddress: string,
  expectedLovelace: bigint,
): void {
  if (expectedLovelace <= CANONICAL_ADA_MIN_UTXO_LOVELACE) {
    throw new Error('Treasury settlement must include the ADA minimum-UTxO floor and positive economic ADA')
  }
  assertCompletedTreasurySettlement(completedTx, treasuryAddress, { lovelace: expectedLovelace })
}
