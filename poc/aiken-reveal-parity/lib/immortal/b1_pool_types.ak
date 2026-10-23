use immortal/b1_pool_solvency.{b1_pool_solvency_is_valid}
use immortal/reveal_types.{B1PrizePoolDatum}

/// Haskell constructor order is compatibility-sensitive:
/// FundTreasury=0, TicketIssued=1, TicketRevealed=2,
/// TicketClaimed=3, TicketExpired=4.
pub type B1PrizePoolAction {
  FundTreasury
  TicketIssued(Int)
  TicketRevealed(Int)
  TicketClaimed(Int)
  TicketExpired
}

/// Deterministic accounting slice only; not a replacement for the validator.
/// Input authentication, signatures, oracle values, NFTs, datum uniqueness,
/// and the universal solvency invariant must be checked by the validator.
pub fn claim_accounting_transition_matches(
  before: B1PrizePoolDatum,
  after: B1PrizePoolDatum,
  claimed_amount: Int,
) -> Bool {
  claimed_amount > 0
    && claimed_amount <= before.pending_liabilities
    && after.total_liquidity == before.total_liquidity - claimed_amount
    && after.pending_liabilities == before.pending_liabilities - claimed_amount
    && after.unresolved_reserve == before.unresolved_reserve
    && after.unresolved_ticket_count == before.unresolved_ticket_count
    && after.locked_jackpot == before.locked_jackpot
    && after.jackpot_threshold == before.jackpot_threshold
    && after.suspended_classes == before.suspended_classes
    && after.prize_hash == before.prize_hash
}

test claim_accounting_accepts_exact_transition() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 87_500,
      pending_liabilities: 0,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  claim_accounting_transition_matches(before, after, 12_500)
}

test claim_accounting_rejects_changed_pool_reserve() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 87_500,
      pending_liabilities: 0,
      unresolved_reserve: 999,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  !claim_accounting_transition_matches(before, after, 12_500)
}

test claim_accounting_rejects_amount_above_pending_liability() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 87_000,
      pending_liabilities: -500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  !claim_accounting_transition_matches(before, after, 13_000)
}

test claim_accounting_rejects_zero_payout() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  !claim_accounting_transition_matches(before, after, 0)
}

test claim_accounting_rejects_changed_locked_jackpot() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 87_500,
      pending_liabilities: 0,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 501,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  !claim_accounting_transition_matches(before, after, 12_500)
}

test claim_accounting_rejects_changed_jackpot_threshold() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 87_500,
      pending_liabilities: 0,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_001,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  !claim_accounting_transition_matches(before, after, 12_500)
}

test claim_accounting_rejects_changed_suspended_classes() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 87_500,
      pending_liabilities: 0,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 1,
      prize_hash: #"001122",
    }
  !claim_accounting_transition_matches(before, after, 12_500)
}

test claim_accounting_rejects_changed_unresolved_ticket_count() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 87_500,
      pending_liabilities: 0,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 1,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  !claim_accounting_transition_matches(before, after, 12_500)
}

test claim_accounting_rejects_changed_prize_hash() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 87_500,
      pending_liabilities: 0,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"aabbcc",
    }
  !claim_accounting_transition_matches(before, after, 12_500)
}

test claim_accounting_rejects_wrong_liquidity_delta() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 100_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 87_499,
      pending_liabilities: 0,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  !claim_accounting_transition_matches(before, after, 12_500)
}



/// Combines the isolated accounting transition with the existing B1 solvency
/// projection on both datum states. This remains a pure test-harness predicate;
/// it does not validate transaction context, NFT authority, or oracle values.
pub fn pool_claim_transition_with_solvency_is_valid(
  before: B1PrizePoolDatum,
  after: B1PrizePoolDatum,
  claimed_amount: Int,
) -> Bool {
  b1_pool_solvency_is_valid(before)
    && b1_pool_solvency_is_valid(after)
    && claim_accounting_transition_matches(before, after, claimed_amount)
}

test claim_transition_composes_accounting_and_solvency() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 600_000,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 587_500,
      pending_liabilities: 0,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  pool_claim_transition_with_solvency_is_valid(before, after, 12_500)
}

test claim_transition_rejects_insolvent_pre_state() {
  let before =
    B1PrizePoolDatum {
      total_liquidity: 512_999,
      pending_liabilities: 12_500,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  let after =
    B1PrizePoolDatum {
      total_liquidity: 500_499,
      pending_liabilities: 0,
      unresolved_reserve: 1_000,
      unresolved_ticket_count: 2,
      locked_jackpot: 500,
      jackpot_threshold: 5_000,
      suspended_classes: 0,
      prize_hash: #"001122",
    }
  !pool_claim_transition_with_solvency_is_valid(before, after, 12_500)
}

/// Pure accounting-only transition for FundTreasury. The validator must separately
/// prove the oracle-recomputed continuing value and transaction-context guards.
pub fn pool_fund_treasury_transition_matches(
  before: B1PrizePoolDatum,
  after: B1PrizePoolDatum,
) -> Bool {
  after.total_liquidity > before.total_liquidity
    && after.pending_liabilities == before.pending_liabilities
    && after.unresolved_reserve == before.unresolved_reserve
    && after.unresolved_ticket_count == before.unresolved_ticket_count
    && after.locked_jackpot == before.locked_jackpot
    && after.jackpot_threshold == before.jackpot_threshold
    && after.suspended_classes == before.suspended_classes
    && after.prize_hash == before.prize_hash
    && b1_pool_solvency_is_valid(before)
    && b1_pool_solvency_is_valid(after)
}

test fund_treasury_accepts_liquidity_increase_only() {
  let before = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 1_000, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  let after = B1PrizePoolDatum { total_liquidity: 601_000, pending_liabilities: 12_500, unresolved_reserve: 1_000, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  pool_fund_treasury_transition_matches(before, after)
}

test fund_treasury_rejects_accounting_mutation() {
  let before = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 1_000, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  let after = B1PrizePoolDatum { total_liquidity: 601_000, pending_liabilities: 12_499, unresolved_reserve: 1_000, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  !pool_fund_treasury_transition_matches(before, after)
}

/// Pure datum accounting for TicketIssued. NFT mint, Prize output uniqueness,
/// datum/redeemer binding, and authenticated transaction context are not checked here.
pub fn pool_ticket_issued_transition_matches(
  before: B1PrizePoolDatum,
  after: B1PrizePoolDatum,
  price_usdm: Int,
) -> Bool {
  price_usdm > 0
    && after.total_liquidity == before.total_liquidity
    && after.pending_liabilities == before.pending_liabilities
    && after.unresolved_reserve == before.unresolved_reserve + price_usdm
    && after.unresolved_ticket_count == before.unresolved_ticket_count + 1
    && after.locked_jackpot == before.locked_jackpot
    && after.jackpot_threshold == before.jackpot_threshold
    && after.suspended_classes == before.suspended_classes
    && after.prize_hash == before.prize_hash
    && b1_pool_solvency_is_valid(before)
    && b1_pool_solvency_is_valid(after)
}

test ticket_issued_accepts_exact_reserve_and_count_delta() {
  let before = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 1_000, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  let after = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 1_100, unresolved_ticket_count: 3, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  pool_ticket_issued_transition_matches(before, after, 100)
}

test ticket_issued_rejects_wrong_reserve_delta() {
  let before = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 1_000, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  let after = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 1_099, unresolved_ticket_count: 3, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  !pool_ticket_issued_transition_matches(before, after, 100)
}

/// Pure datum accounting for TicketRevealed. Prize status/identity, effective-pool
/// payout bound, and transaction-context uniqueness remain validator responsibilities.
pub fn pool_ticket_revealed_transition_matches(
  before: B1PrizePoolDatum,
  after: B1PrizePoolDatum,
  price_usdm: Int,
  payout: Int,
) -> Bool {
  before.unresolved_ticket_count > 0
    && price_usdm > 0
    && payout >= 0
    && after.total_liquidity == before.total_liquidity
    && after.pending_liabilities == before.pending_liabilities + payout
    && after.unresolved_reserve == before.unresolved_reserve - price_usdm
    && after.unresolved_ticket_count == before.unresolved_ticket_count - 1
    && after.locked_jackpot == before.locked_jackpot
    && after.jackpot_threshold == before.jackpot_threshold
    && after.suspended_classes == before.suspended_classes
    && after.prize_hash == before.prize_hash
    && b1_pool_solvency_is_valid(before)
    && b1_pool_solvency_is_valid(after)
}

test ticket_revealed_accepts_exact_accounting_delta() {
  let before = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 1_000, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  let after = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_600, unresolved_reserve: 900, unresolved_ticket_count: 1, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  pool_ticket_revealed_transition_matches(before, after, 100, 100)
}

test ticket_revealed_rejects_negative_payout_or_wrong_liability() {
  let before = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 1_000, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  let after = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_599, unresolved_reserve: 900, unresolved_ticket_count: 1, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  !pool_ticket_revealed_transition_matches(before, after, 100, 100)
}

/// Pure datum accounting for TicketExpired. Expiry time, Pool-script binding,
/// and Pending/zero-payout Prize checks must be enforced by the full validator.
pub fn pool_ticket_expired_transition_matches(
  before: B1PrizePoolDatum,
  after: B1PrizePoolDatum,
  price_usdm: Int,
) -> Bool {
  before.unresolved_ticket_count > 0
    && price_usdm > 0
    && after.total_liquidity == before.total_liquidity
    && after.pending_liabilities == before.pending_liabilities
    && after.unresolved_reserve == before.unresolved_reserve - price_usdm
    && after.unresolved_reserve >= 0
    && after.unresolved_ticket_count == before.unresolved_ticket_count - 1
    && after.locked_jackpot == before.locked_jackpot
    && after.jackpot_threshold == before.jackpot_threshold
    && after.suspended_classes == before.suspended_classes
    && after.prize_hash == before.prize_hash
    && b1_pool_solvency_is_valid(before)
    && b1_pool_solvency_is_valid(after)
}

test ticket_expired_accepts_exact_reserve_release() {
  let before = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 1_000, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  let after = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 900, unresolved_ticket_count: 1, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  pool_ticket_expired_transition_matches(before, after, 100)
}

test ticket_expired_rejects_reserve_underflow() {
  let before = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: 50, unresolved_ticket_count: 2, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  let after = B1PrizePoolDatum { total_liquidity: 600_000, pending_liabilities: 12_500, unresolved_reserve: -50, unresolved_ticket_count: 1, locked_jackpot: 500, jackpot_threshold: 5_000, suspended_classes: 0, prize_hash: #"001122" }
  !pool_ticket_expired_transition_matches(before, after, 100)
}
