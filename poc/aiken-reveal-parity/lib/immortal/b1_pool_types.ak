use aiken/crypto.{ScriptHash}

/// Wire-compatible B1 PrizePool schema extracted from plutus/Types.hs.
/// Constructor order and field order are part of the on-chain Data API.
/// This module is a migration slice, not a deployable validator.
pub type B1PrizePoolDatum {
  B1PrizePoolDatum {
    total_liquidity: Int,
    pending_liabilities: Int,
    unresolved_reserve: Int,
    unresolved_ticket_count: Int,
    locked_jackpot: Int,
    jackpot_threshold: Int,
    suspended_classes: Int,
    prize_hash: ScriptHash,
  }
}

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
