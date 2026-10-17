/// Isolated Claim parity seam derived from PrizeValidator.validateClaim and
/// B1PrizePool's TicketClaimed branch. This module is not a transaction validator:
/// owner-signature, oracle payout valuation, actual UTxO discovery, and value
/// preservation must be supplied by a typed-context entrypoint before deployment.
use aiken/crypto.{ScriptHash}
use immortal/reveal_types.{Claimed, PrizeDatum, Revealed, B1PrizePoolDatum}

/// Mirrors the Claim transition's datum and accounting invariants. External
/// booleans are deliberately explicit so a test cannot accidentally imply that
/// an oracle check or owner-signature check has already been implemented.
pub fn claim_state_transition_is_valid(
  old_prize: PrizeDatum,
  next_prize: PrizeDatum,
  old_pool: B1PrizePoolDatum,
  next_pool: B1PrizePoolDatum,
  own_script_hash: ScriptHash,
  pool_script_hash: ScriptHash,
  finite_upper_bound: Option<Int>,
  owner_signed: Bool,
  exact_payout_verified: Bool,
  prize_value_preserved: Bool,
  own_input_count: Int,
  pool_input_count: Int,
  own_output_count: Int,
  pool_output_count: Int,
) -> Bool {
  let payout = old_prize.prize_amount
  let prize_identity_preserved =
    old_prize.ticket_policy == next_prize.ticket_policy
      && old_prize.ticket_name == next_prize.ticket_name
      && old_prize.player_commitment == next_prize.player_commitment
      && old_prize.price_usdm == next_prize.price_usdm
      && old_prize.commitment == next_prize.commitment
      && old_prize.game_version == next_prize.game_version
      && old_prize.ticket_nonce == next_prize.ticket_nonce
      && old_prize.payment_policy == next_prize.payment_policy
      && old_prize.payment_name == next_prize.payment_name
      && old_prize.beacon_target.network_id == next_prize.beacon_target.network_id
      && old_prize.beacon_target.round == next_prize.beacon_target.round
      && old_prize.beacon_target.mainchain_ref == next_prize.beacon_target.mainchain_ref
      && old_prize.beacon_target.version == next_prize.beacon_target.version
      && old_prize.beacon_status == next_prize.beacon_status
      && old_prize.beacon_value == next_prize.beacon_value
      && old_prize.mc_hash == next_prize.mc_hash
      && old_prize.materios_context == next_prize.materios_context
      && old_prize.prize_pool_hash == next_prize.prize_pool_hash
      && old_prize.prize_pool_hash == pool_script_hash
      && old_prize.issued_at == next_prize.issued_at
      && old_prize.expires_at == next_prize.expires_at
      && old_prize.row1_tier == next_prize.row1_tier
      && old_prize.row2_tier == next_prize.row2_tier
      && old_prize.result == next_prize.result
      && old_prize.prize_tier == next_prize.prize_tier
      && old_prize.prize_amount == next_prize.prize_amount

  let pool_accounting_preserved =
    old_pool.prize_hash == own_script_hash
      && next_pool.prize_hash == own_script_hash
      && next_pool.total_liquidity == old_pool.total_liquidity - payout
      && next_pool.pending_liabilities == old_pool.pending_liabilities - payout
      && next_pool.unresolved_reserve == old_pool.unresolved_reserve
      && next_pool.unresolved_ticket_count == old_pool.unresolved_ticket_count
      && next_pool.locked_jackpot == old_pool.locked_jackpot
      && next_pool.jackpot_threshold == old_pool.jackpot_threshold
      && next_pool.suspended_classes == old_pool.suspended_classes
      && next_pool.total_liquidity >=
        next_pool.pending_liabilities + next_pool.unresolved_reserve + next_pool.locked_jackpot

  and {
    old_prize.status == Revealed,
    next_prize.status == Claimed,
    payout > 0,
    when finite_upper_bound is {
      Some(bound) -> bound <= old_prize.expires_at
      None -> False
    },
    owner_signed,
    exact_payout_verified,
    prize_value_preserved,
    own_input_count == 1,
    pool_input_count == 1,
    own_output_count == 1,
    pool_output_count == 1,
    prize_identity_preserved,
    pool_accounting_preserved,
  }
}


// Canonical synthetic Claim state used only by this pure transition test seam.
fn claim_prize(status: immortal_reveal_status, row1_tier: Int) -> PrizeDatum {
  PrizeDatum {
    ticket_policy: #"a1",
    ticket_name: #"01",
    player_commitment: #"02",
    price_usdm: 100,
    commitment: #"03",
    game_version: "classic-6-v1",
    ticket_nonce: 7,
    prize_amount: 200,
    payment_policy: #"04",
    payment_name: #"05",
    status,
    result: #"010203",
    prize_tier: 3,
    beacon_target: immortal_reveal_types.BeaconTarget {
      network_id: 0,
      round: 42,
      mainchain_ref: #"010203",
      version: #"7631",
    },
    beacon_status: immortal_reveal_types.BeaconPending,
    beacon_value: #"06",
    mc_hash: #"07",
    materios_context: #"08",
    prize_pool_hash: #"aa",
    issued_at: 1_000,
    expires_at: 9_000,
    row1_tier,
    row2_tier: 2,
  }
}

fn claim_pool(liquidity: Int, liabilities: Int) -> B1PrizePoolDatum {
  B1PrizePoolDatum {
    total_liquidity: liquidity,
    pending_liabilities: liabilities,
    unresolved_reserve: 100,
    unresolved_ticket_count: 4,
    locked_jackpot: 50,
    jackpot_threshold: 500,
    suspended_classes: 0,
    prize_hash: #"bb",
  }
}

fn run_claim_transition(
  next_row1_tier: Int,
  owner_signed: Bool,
  payout_verified: Bool,
  value_preserved: Bool,
  upper_bound: Option<Int>,
  pool_inputs: Int,
  next_liquidity: Int,
  next_liabilities: Int,
) -> Bool {
  claim_state_transition_is_valid(
    claim_prize(immortal_reveal_types.Revealed, 1),
    claim_prize(immortal_reveal_types.Claimed, next_row1_tier),
    claim_pool(10_000, 200),
    claim_pool(next_liquidity, next_liabilities),
    #"bb",
    #"aa",
    upper_bound,
    owner_signed,
    payout_verified,
    value_preserved,
    1,
    pool_inputs,
    1,
    1,
  )
}

test claim_accepts_exact_state_and_accounting_transition() {
  run_claim_transition(1, True, True, True, Some(9_000), 1, 9_800, 0)
}

test claim_rejects_missing_owner_signature() {
  !run_claim_transition(1, False, True, True, Some(9_000), 1, 9_800, 0)
}

test claim_rejects_unqualified_or_inexact_settlement() {
  !run_claim_transition(1, True, False, True, Some(9_000), 1, 9_800, 0)
}

test claim_rejects_changed_prize_value() {
  !run_claim_transition(1, True, True, False, Some(9_000), 1, 9_800, 0)
}

test claim_rejects_expiry_after_deadline() {
  !run_claim_transition(1, True, True, True, Some(9_001), 1, 9_800, 0)
}

test claim_rejects_unbounded_validity_interval() {
  !run_claim_transition(1, True, True, True, None, 1, 9_800, 0)
}

test claim_rejects_mutated_row_tier() {
  !run_claim_transition(2, True, True, True, Some(9_000), 1, 9_800, 0)
}

test claim_rejects_duplicate_pool_inputs() {
  !run_claim_transition(1, True, True, True, Some(9_000), 2, 9_800, 0)
}

test claim_rejects_wrong_pool_liquidity_delta() {
  !run_claim_transition(1, True, True, True, Some(9_000), 1, 9_799, 0)
}

test claim_rejects_wrong_pool_liability_delta() {
  !run_claim_transition(1, True, True, True, Some(9_000), 1, 9_800, 1)
}
