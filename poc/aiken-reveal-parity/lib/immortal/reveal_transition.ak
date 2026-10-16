use aiken/crypto.{ScriptHash}
use aiken/primitive/bytearray
use immortal/beacon
use immortal/game_rules
use immortal/reveal_context_guards.{reveal_pool_transition_is_valid, reveal_window_open, RevealPoolState}
use immortal/reveal_rules.{PrizeTable, classify_row_tier, row_payout_total}
use immortal/reveal_types.{BeaconReady, Pending, PrizeDatum, Revealed}

/// Mirrors PrizeValidator.validateReveal's state-transition semantics.
///
/// This is a pure datum/pool predicate. Transaction input/output uniqueness,
/// actual UTxO association, inline/hash datum decoding and value preservation
/// remain separately checked by reveal_context.reveal_context_structure_is_valid.
pub fn reveal_state_transition_is_valid(
  table: PrizeTable,
  input: PrizeDatum,
  output: PrizeDatum,
  player_secret: ByteArray,
  upper_bound: Option<Int>,
  pool_before: RevealPoolState,
  pool_after: RevealPoolState,
  own_prize_hash: ScriptHash,
) -> Bool {
  let target = input.beacon_target
  let encoded_target =
    beacon.encode_beacon_target(
      beacon.BeaconTarget {
        network_id: target.network_id,
        round_id: target.round,
        mainchain_ref: target.mainchain_ref,
        version: target.version,
      },
    )
  let expected_player_commitment =
    beacon.player_commitment(target.round, input.ticket_nonce, player_secret)
  let ticket_binding =
    beacon.ticket_commitment(
      input.ticket_name,
      input.player_commitment,
      input.game_version,
      input.ticket_nonce,
      input.price_usdm,
      encoded_target,
    )
  let expected_beacon =
    beacon.derive_beacon(
      target.network_id,
      target.round,
      target.mainchain_ref,
      input.mc_hash,
      input.materios_context,
      target.version,
    )
  let final_seed =
    beacon.derive_ticket_seed(
      target.round,
      input.ticket_nonce,
      player_secret,
      input.beacon_value,
      input.game_version,
    )
  let symbols_seed = beacon.derive_symbols_seed(final_seed)
  let symbols = game_rules.generate_symbols(symbols_seed)
  let expected_result =
    crypto.sha2_256(
      bytearray.concat(
        beacon.field(crypto.sha2_256(symbols_seed)),
        beacon.field(symbols),
      ),
    )
  let row1_tier = classify_row_tier(bytearray.slice(symbols, 0, 2))
  let row2_tier = classify_row_tier(bytearray.slice(symbols, 3, 5))
  let summary_tier = game_rules.classify_tier(symbols)
  let payout =
    row_payout_total(table, row1_tier, row2_tier, input.price_usdm)
  and {
    reveal_window_open(input.expires_at, upper_bound),
    input.status == Pending,
    input.beacon_status == BeaconReady,
    bytearray.length(input.beacon_value) > 0,
    input.beacon_value == expected_beacon,
    input.player_commitment == expected_player_commitment,
    input.commitment == ticket_binding,
    bytearray.length(symbols) == 6,

    input.ticket_policy == output.ticket_policy,
    input.ticket_name == output.ticket_name,
    input.player_commitment == output.player_commitment,
    input.price_usdm == output.price_usdm,
    input.commitment == output.commitment,
    input.game_version == output.game_version,
    input.ticket_nonce == output.ticket_nonce,
    input.payment_policy == output.payment_policy,
    input.payment_name == output.payment_name,
    input.beacon_target == output.beacon_target,
    input.prize_pool_hash == output.prize_pool_hash,
    input.issued_at == output.issued_at,
    input.expires_at == output.expires_at,

    output.status == Revealed,
    output.beacon_status == BeaconReady,
    output.beacon_value == input.beacon_value,
    output.mc_hash == input.mc_hash,
    output.materios_context == input.materios_context,
    output.result == expected_result,
    output.prize_tier == summary_tier,
    output.row1_tier == row1_tier,
    output.row2_tier == row2_tier,
    output.prize_amount == payout,

    input.prize_pool_hash == output.prize_pool_hash,
    pool_before.prize_hash == own_prize_hash,
    pool_after.prize_hash == own_prize_hash,
    reveal_pool_transition_is_valid(
      payout,
      own_prize_hash,
      pool_before,
      pool_after,
    ),
  }
}
