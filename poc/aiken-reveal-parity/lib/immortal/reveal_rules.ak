use aiken/primitive/bytearray

/// Mirrors the current Haskell GameRules.PrizeTable for parity testing only.
pub type PrizeTable {
  PrizeTable {
    tier_1: Int,
    tier_2: Int,
    tier_3: Int,
    tier_4: Int,
    tier_5: Int,
  }
}

/// Mirrors GameRules.classifyRowTier:
/// only three equal symbols in the canonical range 1..5 win a row.
pub fn classify_row_tier(row: ByteArray) -> Int {
  if bytearray.length(row) < 3 {
    0
  } else {
    let a = bytearray.at(row, 0)
    let b = bytearray.at(row, 1)
    let c = bytearray.at(row, 2)
    if a == b && b == c && a >= 1 && a <= 5 {
      a
    } else {
      0
    }
  }
}

fn base_for_tier(table: PrizeTable, tier: Int) -> Int {
  if tier == 1 {
    table.tier_1
  } else if tier == 2 {
    table.tier_2
  } else if tier == 3 {
    table.tier_3
  } else if tier == 4 {
    table.tier_4
  } else if tier == 5 {
    table.tier_5
  } else {
    0
  }
}

/// Mirrors GameRules.prizeAmountForTier; all monetary values are USDM sub-units.
pub fn prize_amount_for_tier(table: PrizeTable, tier: Int, price_usdm: Int) -> Int {
  if tier <= 0 || price_usdm <= 0 {
    0
  } else {
    base_for_tier(table, tier) * price_usdm / 2
  }
}

/// Mirrors GameRules.rowPayoutTotal, including the existing 500x cap.
pub fn row_payout_total(
  table: PrizeTable,
  row_1_tier: Int,
  row_2_tier: Int,
  price_usdm: Int,
) -> Int {
  let uncapped =
    prize_amount_for_tier(table, row_1_tier, price_usdm)
      + prize_amount_for_tier(table, row_2_tier, price_usdm)
  let cap = 500 * price_usdm
  if uncapped < cap {
    uncapped
  } else {
    cap
  }
}

/// Pure accounting predicate extracted from the existing Reveal cross-check.
/// This does not replace transaction-context validation in PrizeValidator.
pub fn pool_transition_is_consistent(
  payout: Int,
  old_liquidity: Int,
  new_liquidity: Int,
  old_pending_liabilities: Int,
  new_pending_liabilities: Int,
  old_unresolved_reserve: Int,
  new_unresolved_reserve: Int,
  locked_jackpot: Int,
  old_unresolved_count: Int,
  new_unresolved_count: Int,
) -> Bool {
  payout >= 0
    && payout <= old_liquidity - old_pending_liabilities - old_unresolved_reserve - locked_jackpot
    && new_pending_liabilities == old_pending_liabilities + payout
    && new_unresolved_reserve < old_unresolved_reserve
    && new_liquidity == old_liquidity
    && new_unresolved_count == old_unresolved_count - 1
}

const canonical_table =
  PrizeTable {
    tier_1: 2,
    tier_2: 5,
    tier_3: 10,
    tier_4: 200,
    tier_5: 1_000,
  }

test row_one_triple_is_tier_one() {
  classify_row_tier(#[1, 1, 1]) == 1
}

test row_five_triple_is_tier_five() {
  classify_row_tier(#[5, 5, 5]) == 5
}

test mixed_row_is_loss() {
  classify_row_tier(#[1, 2, 1]) == 0
}

test symbol_zero_is_not_a_prize_tier() {
  classify_row_tier(#[0, 0, 0]) == 0
}

test out_of_range_symbol_is_not_a_prize_tier() {
  classify_row_tier(#[6, 6, 6]) == 0
}

test short_row_is_loss() {
  classify_row_tier(#[2, 2]) == 0
}

test payout_for_loss_is_zero() {
  row_payout_total(canonical_table, 0, 0, 100) == 0
}

test payout_matches_existing_tier_formula() {
  // Tier 1: 2 * 100 / 2 = 100; tier 2: 5 * 100 / 2 = 250.
  row_payout_total(canonical_table, 1, 2, 100) == 350
}

test payout_obeys_existing_five_hundred_x_cap() {
  // Tier 4 + tier 5 would exceed the cap; do not alter the economic rule.
  row_payout_total(canonical_table, 4, 5, 100) == 50_000
}

test pool_accounting_accepts_consistent_reveal() {
  pool_transition_is_consistent(
    350,
    100_000,
    100_000,
    1_000,
    1_350,
    500,
    400,
    2_000,
    8,
    7,
  )
}

test pool_accounting_rejects_liquidity_change() {
  !pool_transition_is_consistent(
    350,
    100_000,
    99_999,
    1_000,
    1_350,
    500,
    400,
    2_000,
    8,
    7,
  )
}

test pool_accounting_rejects_payout_above_effective_pool() {
  !pool_transition_is_consistent(
    50_000,
    10_000,
    10_000,
    1_000,
    51_000,
    500,
    400,
    2_000,
    8,
    7,
  )
}
