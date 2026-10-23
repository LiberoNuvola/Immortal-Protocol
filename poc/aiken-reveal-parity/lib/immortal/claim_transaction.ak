/// Transaction-context Claim implementation for the isolated Aiken V3 parity harness.
///
/// This module mirrors PrizeValidator.validateClaim over typed Cardano transaction
/// data. It is not wired to a Preprod deployment; V2->V3 compatibility, the paired
/// B1PrizePool validator/hash topology, and ledger-valid parity remain separate gates.
use aiken/collection/list
use aiken/crypto.{ScriptHash, VerificationKeyHash}
use cardano/assets.{AssetName, PolicyId}
use aiken/interval
use cardano/address.{Script, VerificationKey, from_verification_key}
use cardano/assets
use cardano/transaction
use immortal/reveal_types.{B1PrizePoolDatum, BeaconReady, BeaconTarget, Claimed, PrizeDatum, Revealed}

const usdm_precision = 1_000_000
const ada_min_utxo_lovelace = 1_600_000
const oracle_max_age_ms = 3_600_000

/// Field order matches Adapter/CARDANO/observation/OracleTypes.hs.
pub type OracleDatum {
  OracleDatum {
    asset_policy: PolicyId,
    asset_name: AssetName,
    price: Int,
    timestamp: Int,
    publisher: VerificationKeyHash,
  }
}

fn datum_data(tx: transaction.Transaction, output: transaction.Output) -> Option<Data> {
  when output.datum is {
    transaction.InlineDatum(data) -> Some(data)
    transaction.DatumHash(hash) -> transaction.find_datum(tx.outputs, tx.datums, hash)
    transaction.NoDatum -> None
  }
}

fn decode_prize_datum(tx: transaction.Transaction, output: transaction.Output) -> Option<PrizeDatum> {
  when datum_data(tx, output) is {
    Some(raw) -> {
      expect decoded: PrizeDatum = raw
      Some(decoded)
    }
    None -> None
  }
}

fn decode_pool_datum(tx: transaction.Transaction, output: transaction.Output) -> Option<B1PrizePoolDatum> {
  when datum_data(tx, output) is {
    Some(raw) -> {
      expect decoded: B1PrizePoolDatum = raw
      Some(decoded)
    }
    None -> None
  }
}

fn count_script_inputs(inputs: List<transaction.Input>, script_hash: ScriptHash) -> Int {
  list.length(list.filter(inputs, fn(input) {
    input.output.address.payment_credential == Script(script_hash)
  }))
}

fn count_script_outputs(outputs: List<transaction.Output>, script_hash: ScriptHash) -> Int {
  list.length(list.filter(outputs, fn(output) {
    output.address.payment_credential == Script(script_hash)
  }))
}

fn only_script_input(inputs: List<transaction.Input>, script_hash: ScriptHash) -> Option<transaction.Input> {
  when list.filter(inputs, fn(input) {
    input.output.address.payment_credential == Script(script_hash)
  }) is {
    [input] -> Some(input)
    _ -> None
  }
}

fn only_script_output(outputs: List<transaction.Output>, script_hash: ScriptHash) -> Option<transaction.Output> {
  when list.filter(outputs, fn(output) {
    output.address.payment_credential == Script(script_hash)
  }) is {
    [output] -> Some(output)
    _ -> None
  }
}

fn finite_upper_bound(tx: transaction.Transaction) -> Option<Int> {
  when tx.validity_range.upper_bound.bound_type is {
    interval.Finite(bound) -> Some(bound)
    _ -> None
  }
}

/// Mirrors the canonical Haskell ticketOwnerPkh scan: select the first
/// input carrying exactly one ticket NFT, then require a public-key credential.
/// Preserve the reference's first-match behavior rather than adding a new
/// duplicate-ticket rejection rule in the Aiken migration.
fn ticket_owner(
  inputs: List<transaction.Input>,
  ticket_policy: PolicyId,
  ticket_name: AssetName,
) -> Option<VerificationKeyHash> {
  when inputs is {
    [] -> None
    [input, ..rest] ->
      if assets.quantity_of(input.output.value, ticket_policy, ticket_name) == 1 {
        when input.output.address.payment_credential is {
          VerificationKey(owner) -> Some(owner)
          Script(_) -> None
        }
      } else {
        ticket_owner(rest, ticket_policy, ticket_name)
      }
  }
}

/// Non-aborting equivalent of Haskell fromBuiltinData for OracleDatum.
fn decode_oracle_datum(raw: Data) -> Option<OracleDatum> {
  if raw is OracleDatum {
    Some(raw)
  } else {
    None
  }
}

fn valid_oracle_timestamp(timestamp: Int, now: Int) -> Bool {
  timestamp <= now && now - timestamp <= oracle_max_age_ms
}

fn oracle_quote_matches(
  oracle: OracleDatum,
  expected_policy: PolicyId,
  expected_name: AssetName,
  expected_publisher: VerificationKeyHash,
  now: Int,
) -> Bool {
  oracle.asset_policy == expected_policy
    && oracle.asset_name == expected_name
    && oracle.publisher == expected_publisher
    && valid_oracle_timestamp(oracle.timestamp, now)
    && oracle.price >= 0
}

fn claim_window_open(expires_at: Int, upper_bound: Option<Int>) -> Bool {
  when upper_bound is {
    Some(bound) -> bound <= expires_at
    None -> False
  }
}

fn exact_claim_settlement(paid: Option<Int>, required: Int) -> Bool {
  when paid is {
    Some(amount) -> required > 0 && amount == required
    None -> False
  }
}

/// Search reference inputs for the configured Oracle State singleton plus a
/// datum matching the requested asset, configured publisher, and freshness.
fn oracle_price_for(
  refs: List<transaction.Input>,
  tx: transaction.Transaction,
  state_policy: PolicyId,
  state_name: AssetName,
  publisher: VerificationKeyHash,
  asset_policy: PolicyId,
  asset_name: AssetName,
  now: Int,
) -> Option<Int> {
  when refs is {
    [] -> None
    [ref_input, ..rest] -> {
      let output = ref_input.output
      if assets.quantity_of(output.value, state_policy, state_name) != 1 {
        oracle_price_for(rest, tx, state_policy, state_name, publisher, asset_policy, asset_name, now)
      } else {
        when datum_data(tx, output) is {
          Some(raw) -> {
            // Haskell fromBuiltinData returns Nothing for malformed OracleDatum
            // and continues scanning; preserve that behavior with a soft cast.
            when decode_oracle_datum(raw) is {
              Some(oracle) ->
                if oracle_quote_matches(oracle, asset_policy, asset_name, publisher, now) {
                  Some(oracle.price)
                } else {
                  oracle_price_for(rest, tx, state_policy, state_name, publisher, asset_policy, asset_name, now)
                }
              None ->
                oracle_price_for(rest, tx, state_policy, state_name, publisher, asset_policy, asset_name, now)
            }
          }
          None ->
            oracle_price_for(rest, tx, state_policy, state_name, publisher, asset_policy, asset_name, now)
        }
      }
    }
  }
}

fn ceiling_div_nonnegative(numerator: Int, denominator: Int) -> Int {
  if numerator <= 0 {
    0
  } else {
    (numerator + denominator - 1) / denominator
  }
}

/// Mirrors Economic.totalUsdmValue for an aggregated output Value.
/// Each non-zero asset must have its own matching authenticated oracle entry.
/// ADA excludes the fixed min-UTxO quantity; all other asset quantities are valued.
fn value_entries_usdm(
  entries: List<(PolicyId, AssetName, Int)>,
  tx: transaction.Transaction,
  state_policy: PolicyId,
  state_name: AssetName,
  publisher: VerificationKeyHash,
  now: Int,
) -> Option<Int> {
  when entries is {
    [] -> Some(0)
    [(policy, name, quantity), ..rest] -> {
      if quantity == 0 {
        value_entries_usdm(rest, tx, state_policy, state_name, publisher, now)
      } else {
        when oracle_price_for(
          tx.reference_inputs,
          tx,
          state_policy,
          state_name,
          publisher,
          policy,
          name,
          now,
        ) is {
          None -> None
          Some(price) -> {
            let economic_quantity =
              if policy == assets.ada_policy_id && name == assets.ada_asset_name {
                if quantity > ada_min_utxo_lovelace {
                  quantity - ada_min_utxo_lovelace
                } else {
                  0
                }
              } else {
                quantity
              }
            let converted = ceiling_div_nonnegative(economic_quantity * price, usdm_precision)
            when value_entries_usdm(rest, tx, state_policy, state_name, publisher, now) is {
              Some(rest_value) -> Some(converted + rest_value)
              None -> None
            }
          }
        }
      }
    }
  }
}

fn value_usdm(
  value: assets.Value,
  tx: transaction.Transaction,
  state_policy: PolicyId,
  state_name: AssetName,
  publisher: VerificationKeyHash,
  now: Int,
) -> Option<Int> {
  value_entries_usdm(
    assets.flatten(value),
    tx,
    state_policy,
    state_name,
    publisher,
    now,
  )
}

/// PrizeValidator.validateClaim values the aggregate of all outputs to the
/// claimant's enterprise address (no stake credential), not a caller-provided
/// amount and not an assumed USDM-only balance.
fn claimant_value(outputs: List<transaction.Output>, owner: VerificationKeyHash) -> assets.Value {
  let recipient = from_verification_key(owner)
  list.foldl(outputs, assets.zero, fn(output, accumulated) {
    if output.address == recipient {
      assets.merge(accumulated, output.value)
    } else {
      accumulated
    }
  })
}

fn prize_identity_preserved(old: PrizeDatum, next: PrizeDatum, pool_hash: ScriptHash) -> Bool {
  and {
    old.ticket_policy == next.ticket_policy,
    old.ticket_name == next.ticket_name,
    old.player_commitment == next.player_commitment,
    old.price_usdm == next.price_usdm,
    old.commitment == next.commitment,
    old.game_version == next.game_version,
    old.ticket_nonce == next.ticket_nonce,
    old.payment_policy == next.payment_policy,
    old.payment_name == next.payment_name,
    old.beacon_target.network_id == next.beacon_target.network_id,
    old.beacon_target.round == next.beacon_target.round,
    old.beacon_target.mainchain_ref == next.beacon_target.mainchain_ref,
    old.beacon_target.version == next.beacon_target.version,
    old.beacon_status == next.beacon_status,
    old.beacon_value == next.beacon_value,
    old.mc_hash == next.mc_hash,
    old.materios_context == next.materios_context,
    old.prize_pool_hash == next.prize_pool_hash,
    old.prize_pool_hash == pool_hash,
    old.issued_at == next.issued_at,
    old.expires_at == next.expires_at,
    old.row1_tier == next.row1_tier,
    old.row2_tier == next.row2_tier,
    old.result == next.result,
    old.prize_tier == next.prize_tier,
    old.prize_amount == next.prize_amount,
  }
}

fn pool_claim_transition_is_valid(
  tx: transaction.Transaction,
  pool_hash: ScriptHash,
  prize_hash: ScriptHash,
  payout: Int,
) -> Bool {
  if
    count_script_inputs(tx.inputs, pool_hash) != 1
      || count_script_outputs(tx.outputs, pool_hash) != 1
  {
    False
  } else {
    when only_script_input(tx.inputs, pool_hash) is {
      None -> False
      Some(pool_input) ->
        when only_script_output(tx.outputs, pool_hash) is {
          None -> False
          Some(pool_output) ->
            when decode_pool_datum(tx, pool_input.output) is {
              None -> False
              Some(old_pool) ->
                when decode_pool_datum(tx, pool_output) is {
                  None -> False
                  Some(next_pool) ->
                    and {
                      // Match the existing Haskell TicketClaimed accounting.
                      // These are parity guards, not a complete Pool validator.
                      payout > 0,
                      payout <= old_pool.pending_liabilities,
                      old_pool.prize_hash == prize_hash,
                      next_pool.prize_hash == prize_hash,
                      next_pool.total_liquidity == old_pool.total_liquidity - payout,
                      next_pool.pending_liabilities == old_pool.pending_liabilities - payout,
                      next_pool.unresolved_reserve == old_pool.unresolved_reserve,
                      next_pool.unresolved_ticket_count == old_pool.unresolved_ticket_count,
                      next_pool.locked_jackpot == old_pool.locked_jackpot,
                      next_pool.jackpot_threshold == old_pool.jackpot_threshold,
                      next_pool.suspended_classes == old_pool.suspended_classes,
                    }
                }
            }
        }
    }
  }
}

/// Claim's typed transaction-context predicate.
///
/// The B1PrizePool spending validator is independently responsible for the pool
/// singleton NFT, physical pool-value delta and its complete accounting checks.
/// This predicate mirrors the PrizeValidator Claim branch: exact claimant-value
/// conversion, owner signature, Prize value preservation, datum transition,
/// expiry, and cross-bound PrizePool datum accounting.
pub fn claim_transaction_is_valid(
  tx: transaction.Transaction,
  own_ref: transaction.OutputReference,
  input_datum: PrizeDatum,
  oracle_state_policy: PolicyId,
  oracle_state_name: AssetName,
  oracle_publisher: VerificationKeyHash,
) -> Bool {
  when transaction.find_input(tx.inputs, own_ref) is {
    None -> False
    Some(own_input) ->
      when own_input.output.address.payment_credential is {
        VerificationKey(_) -> False
        Script(own_hash) -> {
          let pool_hash = input_datum.prize_pool_hash
          let own_input_count_ok = count_script_inputs(tx.inputs, own_hash) == 1
          let own_output_count_ok = count_script_outputs(tx.outputs, own_hash) == 1
          let own_input_datum_ok =
            when decode_prize_datum(tx, own_input.output) is {
              Some(decoded) -> decoded == input_datum
              None -> False
            }
          let prize_output_ok =
            when only_script_output(tx.outputs, own_hash) is {
              None -> False
              Some(prize_output) ->
                when decode_prize_datum(tx, prize_output) is {
                  None -> False
                  Some(next_prize) ->
                    and {
                      prize_output.value == own_input.output.value,
                      input_datum.status == Revealed,
                      next_prize.status == Claimed,
                      input_datum.prize_amount > 0,
                      prize_identity_preserved(input_datum, next_prize, pool_hash),
                    }
                }
            }
          let expiry_ok = claim_window_open(input_datum.expires_at, finite_upper_bound(tx))
          let payment_ok =
            when ticket_owner(tx.inputs, input_datum.ticket_policy, input_datum.ticket_name) is {
              None -> False
              Some(owner) ->
                if !list.has(tx.extra_signatories, owner) {
                  False
                } else {
                  when finite_upper_bound(tx) is {
                    None -> False
                    Some(now) ->
                      exact_claim_settlement(
                        value_usdm(
                          claimant_value(tx.outputs, owner),
                          tx,
                          oracle_state_policy,
                          oracle_state_name,
                          oracle_publisher,
                          now,
                        ),
                        input_datum.prize_amount,
                      )
                  }
                }
            }
          and {
            own_input_count_ok,
            own_output_count_ok,
            own_input_datum_ok,
            prize_output_ok,
            expiry_ok,
            payment_ok,
            pool_claim_transition_is_valid(tx, pool_hash, own_hash, input_datum.prize_amount),
          }
        }
      }
  }
}

test claim_ceiling_div_rounds_up_fractional_usdm_subunit() {
  ceiling_div_nonnegative(1_000_001, usdm_precision) == 2
}

test claim_ceiling_div_keeps_exact_usdm_subunit() {
  ceiling_div_nonnegative(1_000_000, usdm_precision) == 1
}

test claim_ceiling_div_never_returns_negative_value() {
  ceiling_div_nonnegative(-1, usdm_precision) == 0
}

test claim_oracle_timestamp_rejects_future_value() {
  !valid_oracle_timestamp(10_001, 10_000)
}

test claim_oracle_timestamp_accepts_exact_max_age() {
  valid_oracle_timestamp(0, 3_600_000)
}

test claim_oracle_timestamp_rejects_stale_value() {
  !valid_oracle_timestamp(0, 3_600_001)
}

fn claim_test_oracle(
  policy: PolicyId,
  name: AssetName,
  price: Int,
  timestamp: Int,
  publisher: VerificationKeyHash,
) -> OracleDatum {
  OracleDatum {
    asset_policy: policy,
    asset_name: name,
    price,
    timestamp,
    publisher,
  }
}

test claim_window_accepts_exact_expiry_bound() {
  claim_window_open(9_000, Some(9_000))
}

test claim_window_accepts_before_expiry() {
  claim_window_open(9_000, Some(8_999))
}

test claim_window_rejects_after_expiry() {
  !claim_window_open(9_000, Some(9_001))
}

test claim_window_rejects_unbounded_upper_interval() {
  !claim_window_open(9_000, None)
}

test claim_settlement_requires_exact_positive_value() {
  exact_claim_settlement(Some(200), 200)
    && !exact_claim_settlement(Some(199), 200)
    && !exact_claim_settlement(Some(201), 200)
    && !exact_claim_settlement(None, 200)
    && !exact_claim_settlement(Some(0), 0)
}

test claim_oracle_requires_asset_identity_and_publisher() {
  let oracle = claim_test_oracle(#"aa", #"5553444d", 12, 9_000, #"bb")
  oracle_quote_matches(oracle, #"aa", #"5553444d", #"bb", 9_000)
    && !oracle_quote_matches(oracle, #"ab", #"5553444d", #"bb", 9_000)
    && !oracle_quote_matches(oracle, #"aa", #"4f54484552", #"bb", 9_000)
    && !oracle_quote_matches(oracle, #"aa", #"5553444d", #"bc", 9_000)
}

test claim_oracle_rejects_negative_price() {
  !oracle_quote_matches(
    claim_test_oracle(#"aa", #"5553444d", -1, 9_000, #"bb"),
    #"aa",
    #"5553444d",
    #"bb",
    9_000,
  )
}

test claim_context_rejects_missing_prize_input() {
  !claim_transaction_is_valid(
    transaction.placeholder,
    transaction.OutputReference {
      transaction_id: transaction.placeholder.id,
      output_index: 0,
    },
    PrizeDatum {
      ticket_policy: #"a1",
      ticket_name: #"01",
      player_commitment: #"02",
      price_usdm: 100,
      commitment: #"03",
      game_version: "v1",
      ticket_nonce: 1,
      prize_amount: 200,
      payment_policy: #"04",
      payment_name: #"05",
      status: Revealed,
      result: #"0607",
      prize_tier: 1,
      beacon_target: BeaconTarget {
        network_id: 0,
        round: 42,
        mainchain_ref: #"010203",
        version: #"7631",
      },
      beacon_status: BeaconReady,
      beacon_value: #"08",
      mc_hash: #"09",
      materios_context: #"0a",
      prize_pool_hash: #"0b",
      issued_at: 1_000,
      expires_at: 9_000,
      row1_tier: 1,
      row2_tier: 0,
    },
    #"aa",
    #"4f5241434c45",
    #"bb",
  )
}


test claim_oracle_decoder_returns_none_for_malformed_data() {
  decode_oracle_datum(42) == None
}
