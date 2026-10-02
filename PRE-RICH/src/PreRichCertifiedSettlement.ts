/**
 * PRE-RICH exact settlement quote boundary.
 *
 * The DApp may transport a concrete settlement asset bundle, but it cannot
 * declare its own economic value. The quote is an evidence envelope bound to
 * the observed PrizeAmount and an authoritative oracle reference; Cardano
 * revalidates the final settlement amount on-chain.
 */

export type SettlementAssetMap = Readonly<Record<string, bigint>>

export type CertifiedSettlementQuote = {
  assetMap: SettlementAssetMap
  expectedPrizeUsdmReferenceUnits: bigint
  oracleStateReference: string
  observedAt: bigint
}

export function certifySettlementQuote(
  assetMap: SettlementAssetMap,
  expectedPrizeUsdmReferenceUnits: bigint,
  oracleStateReference: string,
  observedAt: bigint,
): CertifiedSettlementQuote {
  if (expectedPrizeUsdmReferenceUnits <= 0n) {
    throw new Error('expected prize amount must be positive')
  }
  if (!oracleStateReference.trim()) {
    throw new Error('oracle state reference is required')
  }
  if (observedAt < 0n) throw new Error('observedAt must be non-negative')

  const entries = Object.entries(assetMap)
  if (entries.length === 0) throw new Error('settlement asset map cannot be empty')
  for (const [unit, quantity] of entries) {
    if (!unit.trim()) throw new Error('settlement asset unit cannot be empty')
    if (quantity <= 0n) throw new Error('settlement asset quantity must be positive')
  }

  return {
    assetMap: { ...assetMap },
    expectedPrizeUsdmReferenceUnits,
    oracleStateReference,
    observedAt,
  }
}

export function assertSettlementQuoteMatchesPrize(
  quote: CertifiedSettlementQuote,
  prizeAmountReferenceUnits: bigint,
): void {
  if (quote.expectedPrizeUsdmReferenceUnits !== prizeAmountReferenceUnits) {
    throw new Error('settlement quote does not match PrizeAmount')
  }
}