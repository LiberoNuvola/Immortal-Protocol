/**
 * Mirror of plutus/GameRules.hs.
 *
 * PRE-RICH Classic-6 is economically defined as two independent rows.
 * Each row samples one of 20,000 canonical outcome slots:
 *   17,500 loss / 1,700 tier1 / 600 tier2 / 180 tier3 / 19 tier4 / 1 tier5.
 *
 * A 16-bit draw accepts only values < 60,000, then applies modulo 20,000.
 * This is unbiased because 60,000 = 3 * 20,000.
 */

import { sha256, concatBytes } from './beacon'

export type PrizeTable = {
  tier1: number
  tier2: number
  tier3: number
  tier4: number
  tier5: number
}

export const defaultPrizeTable: PrizeTable = {
  tier1: 2,
  tier2: 5,
  tier3: 10,
  tier4: 200,
  tier5: 1000,
}

function baseForTier(t: PrizeTable, tier: number): number {
  if (tier === 1) return t.tier1
  if (tier === 2) return t.tier2
  if (tier === 3) return t.tier3
  if (tier === 4) return t.tier4
  if (tier === 5) return t.tier5
  return 0
}

export function prizeAmountForTier(
  table: PrizeTable,
  tier: number,
  priceUsdm: number,
): number {
  if (tier <= 0 || priceUsdm <= 0) return 0
  return Math.floor((baseForTier(table, tier) * priceUsdm) / 2)
}

export function rowPayoutTotal(
  table: PrizeTable,
  row1Tier: number,
  row2Tier: number,
  priceUsdm: number,
): number {
  return Math.min(
    prizeAmountForTier(table, row1Tier, priceUsdm)
      + prizeAmountForTier(table, row2Tier, priceUsdm),
    500 * priceUsdm,
  )
}

export function rowTierFromIndex(rowIndex: number): number {
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= 20_000) {
    throw new Error('row outcome index out of range')
  }
  if (rowIndex < 17_500) return 0
  if (rowIndex < 19_200) return 1
  if (rowIndex < 19_800) return 2
  if (rowIndex < 19_980) return 3
  if (rowIndex < 19_999) return 4
  return 5
}

export function classifyRowTier(symbols: Uint8Array): number {
  if (symbols.length < 3) return 0
  const [a, b, c] = symbols
  return (
    a !== undefined &&
    b !== undefined &&
    c !== undefined &&
    a === b &&
    b === c &&
    a >= 1 &&
    a <= 5
  ) ? a : 0
}

export function classifyTier(symbols: Uint8Array): number {
  if (symbols.length < 6) return 0
  const row1 = symbols.slice(0, 3)
  const row2 = symbols.slice(3, 6)
  return Math.max(classifyRowTier(row1), classifyRowTier(row2))
}

function outcomeToLossTriple(outcome: number): Uint8Array {
  const rank = outcome % 120
  const first = Math.floor(rank / 24) + 1
  const pairRank = rank % 24
  const excluded = (first - 1) * 6
  const pairIndex = pairRank < excluded ? pairRank : pairRank + 1
  const second = Math.floor(pairIndex / 5) + 1
  const third = (pairIndex % 5) + 1
  return new Uint8Array([first, second, third])
}

function outcomeToSymbols(outcome: number): Uint8Array {
  const tier = rowTierFromIndex(outcome)
  if (tier === 0) return outcomeToLossTriple(outcome)
  return new Uint8Array([tier, tier, tier])
}

async function nextRowOutcome(
  seed: Uint8Array,
  row: 1 | 2,
): Promise<number> {
  for (let attempt = 0; attempt < 256; attempt++) {
    const h = await sha256(
      concatBytes(
        new Uint8Array([row, attempt]),
        seed,
      ),
    )
    const u = h[0] * 256 + h[1]
    if (u < 60_000) return u % 20_000
  }
  throw new Error('GameRules: row randomness exhausted')
}

export async function generateSymbols(
  symbolsSeed: Uint8Array,
): Promise<Uint8Array> {
  const row1 = outcomeToSymbols(
    await nextRowOutcome(symbolsSeed, 1),
  )
  const row2 = outcomeToSymbols(
    await nextRowOutcome(symbolsSeed, 2),
  )
  return new Uint8Array([...row1, ...row2])
}

export async function resultBinding(
  digest: Uint8Array,
  symbols: Uint8Array,
  fieldFn: (bs: Uint8Array) => Uint8Array,
  sha: (d: Uint8Array) => Promise<Uint8Array>,
): Promise<Uint8Array> {
  return sha(concatBytes(fieldFn(digest), fieldFn(symbols)))
}
