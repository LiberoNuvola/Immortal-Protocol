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
