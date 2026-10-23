/// Exact isolated port of the current Haskell B1 -> universal solvency projection.
/// Reference:
/// - plutus/B1LegacyAdapter.hs: legacyB1ToUniversalEconomicState
/// - IMMORTAL/kernel/UniversalEconomicKernel.hs: solvencyInvariant
///
/// This is a parity slice, not a complete B1PrizePool spending validator.
/// PRE-RICH profile v1 fixes worst-case exposure at 500 * unresolved_reserve.
/// Legacy B1 maps locked_jackpot to additional protected capital; the other
/// universal protected-capital fields are zero in this projection.
use immortal/reveal_types.{B1PrizePoolDatum}

const max_normal_payout_multiplier = 500

pub fn b1_pool_solvency_is_valid(d: B1PrizePoolDatum) -> Bool {
  let worst_case_exposure = max_normal_payout_multiplier * d.unresolved_reserve
  let protected_capital =
    d.pending_liabilities + worst_case_exposure + d.locked_jackpot

  d.total_liquidity >= 0
    && d.pending_liabilities >= 0
    && d.unresolved_reserve >= 0
    && d.unresolved_ticket_count >= 0
    && d.locked_jackpot >= 0
    && protected_capital >= 0
    && d.total_liquidity >= protected_capital
}

test solvency_accepts_exact_protected_capital_boundary() {
  b1_pool_solvency_is_valid(
    B1PrizePoolDatum {
      total_liquidity: 6_500,
      pending_liabilities: 1_000,
      unresolved_reserve: 10,
      unresolved_ticket_count: 1,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    },
  )
}

test solvency_rejects_one_subunit_below_protected_capital() {
  !b1_pool_solvency_is_valid(
    B1PrizePoolDatum {
      total_liquidity: 6_499,
      pending_liabilities: 1_000,
      unresolved_reserve: 10,
      unresolved_ticket_count: 1,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    },
  )
}

test solvency_rejects_negative_liabilities() {
  !b1_pool_solvency_is_valid(
    B1PrizePoolDatum {
      total_liquidity: 10_000,
      pending_liabilities: -1,
      unresolved_reserve: 0,
      unresolved_ticket_count: 0,
      locked_jackpot: 0,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    },
  )
}

test solvency_rejects_negative_unresolved_count() {
  !b1_pool_solvency_is_valid(
    B1PrizePoolDatum {
      total_liquidity: 10_000,
      pending_liabilities: 0,
      unresolved_reserve: 0,
      unresolved_ticket_count: -1,
      locked_jackpot: 0,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    },
  )
}

test solvency_includes_locked_jackpot_as_protected_capital() {
  !b1_pool_solvency_is_valid(
    B1PrizePoolDatum {
      total_liquidity: 1_000,
      pending_liabilities: 0,
      unresolved_reserve: 0,
      unresolved_ticket_count: 0,
      locked_jackpot: 1_001,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    },
  )
}

test solvency_rejects_negative_reserve_even_if_arithmetic_passes() {
  !b1_pool_solvency_is_valid(
    B1PrizePoolDatum {
      total_liquidity: 0,
      pending_liabilities: 0,
      unresolved_reserve: -1,
      unresolved_ticket_count: 0,
      locked_jackpot: 0,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    },
  )
}
