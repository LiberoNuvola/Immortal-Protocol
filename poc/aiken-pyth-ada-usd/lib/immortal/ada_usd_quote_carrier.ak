/// Isolated quote-carrier transition for binding a Pyth ADA/USD update.
///
/// This is a feasibility probe only. It is not wired to the production MintPolicy.
/// A valid transition preserves the carrier UTxO's identity/value and writes
/// exactly the raw ADA/USD tuple extracted by the Pyth transaction update.
use aiken/collection/list
use aiken/crypto.{ScriptHash}
use aiken/interval
use cardano/address.{Script}
use cardano/assets as cardano_assets
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction
use cardano/transaction.{Input, Output, OutputReference, Transaction}
use immortal/ada_usd_probe.{
  AdaUsdBinding,
  binding_matches,
  select_fresh_ada_usd,
}
use pyth
use types/u32
use types/u64
use types/u8

pub type AdaUsdQuoteCarrierDatum {
  AdaUsdQuoteCarrierDatum {
    quote: Option<AdaUsdBinding>,
  }
}

fn datum_data(tx: Transaction, output: Output) -> Option<Data> {
  when output.datum is {
    transaction.InlineDatum(data) -> Some(data)
    transaction.DatumHash(hash) -> transaction.find_datum(tx.outputs, tx.datums, hash)
    transaction.NoDatum -> None
  }
}

fn decode_carrier_datum(tx: Transaction, output: Output) -> Option<AdaUsdQuoteCarrierDatum> {
  when datum_data(tx, output) is {
    Some(raw) ->
      if raw is AdaUsdQuoteCarrierDatum {
        Some(raw)
      } else {
        None
      }
    None -> None
  }
}

fn unique_script_input(
  inputs: List<Input>,
  script_hash: ScriptHash,
) -> Option<Input> {
  when list.filter(
    inputs,
    fn(input) { input.output.address.payment_credential == Script(script_hash) },
  ) is {
    [input] -> Some(input)
    _ -> None
  }
}

fn unique_script_output(
  outputs: List<Output>,
  script_hash: ScriptHash,
) -> Option<Output> {
  when list.filter(
    outputs,
    fn(output) { output.address.payment_credential == Script(script_hash) },
  ) is {
    [output] -> Some(output)
    _ -> None
  }
}

fn sum_quantities(quantities: List<Int>) -> Int {
  list.foldl(quantities, 0, fn(quantity, total) { quantity + total })
}

fn singleton_input_quantity(
  inputs: List<Input>,
  policy: PolicyId,
  name: AssetName,
) -> Int {
  sum_quantities(
    list.map(
      inputs,
      fn(input) { cardano_assets.quantity_of(input.output.value, policy, name) },
    ),
  )
}

fn singleton_output_quantity(
  outputs: List<Output>,
  policy: PolicyId,
  name: AssetName,
) -> Int {
  sum_quantities(
    list.map(
      outputs,
      fn(output) { cardano_assets.quantity_of(output.value, policy, name) },
    ),
  )
}

/// Pure conformance boundary used by the carrier transition and the
/// adversarial unit tests. The output datum must equal the raw quote selected
/// from exactly one fresh ADA/USD record in the Pyth update.
pub fn quote_carrier_datum_matches_update(
  carrier_datum: AdaUsdQuoteCarrierDatum,
  update: pyth.PriceUpdate,
  upper_bound_ms: Int,
) -> Bool {
  when carrier_datum.quote is {
    None -> False
    Some(expected) ->
      when select_fresh_ada_usd(update, upper_bound_ms) is {
        Some(actual) -> binding_matches(expected, actual)
        None -> False
      }
  }
}

/// Shared state-transition predicate. The production wrapper derives each
/// argument directly from the actual transaction; tests mutate one invariant
/// at a time to ensure the wrapper's decision cannot silently omit a guard.
pub fn quote_carrier_transition_shape_is_valid(
  script_input_count: Int,
  script_output_count: Int,
  singleton_input_total: Int,
  singleton_output_total: Int,
  same_address: Bool,
  same_value: Bool,
  input_datum_valid: Bool,
  output_quote_matches: Bool,
) -> Bool {
  and {
    script_input_count == 1,
    script_output_count == 1,
    singleton_input_total == 1,
    singleton_output_total == 1,
    same_address,
    same_value,
    input_datum_valid,
    output_quote_matches,
  }
}

/// The carrier state may start with no quote or the preceding quote; each
/// transition must replace it with the tuple extracted from the current Pyth
/// update. Replay within the accepted freshness window remains allowed, just
/// as in the documented upstream Pyth model. This probe introduces no nonce
/// or new economics.
pub fn quote_carrier_transition_is_valid(
  tx: Transaction,
  own_ref: OutputReference,
  pyth_policy_id: PolicyId,
  carrier_policy_id: PolicyId,
  carrier_asset_name: AssetName,
) -> Bool {
  when transaction.find_input(tx.inputs, own_ref) is {
    None -> False
    Some(own_input) ->
      when own_input.output.address.payment_credential is {
        Script(own_hash) -> {
          let script_inputs = list.filter(
            tx.inputs,
            fn(input) { input.output.address.payment_credential == Script(own_hash) },
          )
          let script_outputs = list.filter(
            tx.outputs,
            fn(output) { output.address.payment_credential == Script(own_hash) },
          )

          when unique_script_input(tx.inputs, own_hash) is {
            None -> False
            Some(carrier_input) ->
              when unique_script_output(tx.outputs, own_hash) is {
                None -> False
                Some(carrier_output) -> {
                  let input_datum_valid =
                    when decode_carrier_datum(tx, carrier_input.output) is {
                      Some(_) -> True
                      None -> False
                    }

                  let output_quote_matches =
                    when decode_carrier_datum(tx, carrier_output) is {
                      Some(after) ->
                        when pyth.get_updates(pyth_policy_id, tx) is {
                          [update] ->
                            when tx.validity_range.upper_bound.bound_type is {
                              interval.Finite(upper_bound_ms) ->
                                quote_carrier_datum_matches_update(after, update, upper_bound_ms)
                              _ -> False
                            }
                          _ -> False
                        }
                      None -> False
                    }

                  quote_carrier_transition_shape_is_valid(
                    list.length(script_inputs),
                    list.length(script_outputs),
                    singleton_input_quantity(tx.inputs, carrier_policy_id, carrier_asset_name),
                    singleton_output_quantity(tx.outputs, carrier_policy_id, carrier_asset_name),
                    carrier_output.address == carrier_input.output.address,
                    carrier_output.value == carrier_input.output.value,
                    input_datum_valid,
                    output_quote_matches,
                  )
                }
              }
          }
        }
        _ -> False
      }
  }
}



fn fixture_feed(
  feed_id: Int,
  price: Option<Option<Int>>,
  exponent: Option<Int>,
  feed_update_timestamp_us: Option<Option<Int>>,
) -> pyth.Feed {
  pyth.Feed {
    feed_id: u32.from_int(feed_id),
    price,
    best_bid_price: None,
    best_ask_price: None,
    publisher_count: None,
    exponent,
    confidence: None,
    funding_rate: None,
    funding_timestamp: None,
    funding_rate_interval: None,
    market_session: None,
    ema_price: None,
    ema_confidence: None,
    feed_update_timestamp: when feed_update_timestamp_us is {
      Some(Some(value)) -> Some(Some(u64.from_int(value)))
      Some(None) -> Some(None)
      None -> None
    },
  }
}

fn fixture_update(timestamp_us: Int, feed_timestamp_us: Int) -> pyth.PriceUpdate {
  pyth.PriceUpdate {
    timestamp_us: u64.from_int(timestamp_us),
    channel_id: u8.from_int(3),
    feeds: [
      fixture_feed(
        16,
        Some(Some(69_500_000)),
        Some(-8),
        Some(Some(feed_timestamp_us)),
      ),
    ],
  }
}

fn fixture_carrier_datum(
  price: Int,
  exponent: Int,
  update_timestamp_us: Int,
  feed_timestamp_us: Int,
) -> AdaUsdQuoteCarrierDatum {
  AdaUsdQuoteCarrierDatum {
    quote: Some(
      AdaUsdBinding {
        price,
        exponent,
        update_timestamp_us,
        feed_update_timestamp_us: feed_timestamp_us,
      },
    ),
  }
}

test carrier_output_accepts_exact_fresh_signed_update_tuple() {
  let upper_bound_ms = 1_700_000_000_000
  let update_timestamp_us = upper_bound_ms * 1_000 - 1_000_000
  let feed_timestamp_us = update_timestamp_us - 10_000_000
  quote_carrier_datum_matches_update(
    fixture_carrier_datum(69_500_000, -8, update_timestamp_us, feed_timestamp_us),
    fixture_update(update_timestamp_us, feed_timestamp_us),
    upper_bound_ms,
  )
}

test carrier_output_rejects_a_substituted_price_or_exponent() {
  let upper_bound_ms = 1_700_000_000_000
  let update_timestamp_us = upper_bound_ms * 1_000 - 1_000_000
  let feed_timestamp_us = update_timestamp_us - 10_000_000
  let update = fixture_update(update_timestamp_us, feed_timestamp_us)
  and {
    !quote_carrier_datum_matches_update(
      fixture_carrier_datum(69_500_001, -8, update_timestamp_us, feed_timestamp_us),
      update,
      upper_bound_ms,
    ),
    !quote_carrier_datum_matches_update(
      fixture_carrier_datum(69_500_000, -7, update_timestamp_us, feed_timestamp_us),
      update,
      upper_bound_ms,
    ),
  }
}

test carrier_output_rejects_a_stale_update_even_if_fields_match() {
  let upper_bound_ms = 1_700_000_000_000
  let timestamp_us = upper_bound_ms * 1_000 - 3_600_000_001
  quote_carrier_datum_matches_update(
    fixture_carrier_datum(69_500_000, -8, timestamp_us, timestamp_us),
    fixture_update(timestamp_us, timestamp_us),
    upper_bound_ms,
  ) == False
}

test carrier_output_rejects_missing_quote() {
  let upper_bound_ms = 1_700_000_000_000
  let timestamp_us = upper_bound_ms * 1_000 - 1_000_000
  let datum = AdaUsdQuoteCarrierDatum { quote: None }
  let update = fixture_update(timestamp_us, timestamp_us)
  quote_carrier_datum_matches_update(datum, update, upper_bound_ms) == False
}

test carrier_transition_shape_accepts_all_preserved_invariants() {
  quote_carrier_transition_shape_is_valid(
    1, 1, 1, 1, True, True, True, True,
  )
}

test carrier_transition_shape_rejects_missing_or_duplicate_script_outputs() {
  and {
    !quote_carrier_transition_shape_is_valid(
      1, 0, 1, 1, True, True, True, True,
    ),
    !quote_carrier_transition_shape_is_valid(
      1, 2, 1, 1, True, True, True, True,
    ),
    !quote_carrier_transition_shape_is_valid(
      2, 1, 1, 1, True, True, True, True,
    ),
  }
}

test carrier_transition_shape_rejects_missing_or_duplicate_singleton() {
  and {
    !quote_carrier_transition_shape_is_valid(
      1, 1, 0, 1, True, True, True, True,
    ),
    !quote_carrier_transition_shape_is_valid(
      1, 1, 2, 1, True, True, True, True,
    ),
    !quote_carrier_transition_shape_is_valid(
      1, 1, 1, 0, True, True, True, True,
    ),
    !quote_carrier_transition_shape_is_valid(
      1, 1, 1, 2, True, True, True, True,
    ),
  }
}

test carrier_transition_shape_rejects_address_or_value_substitution() {
  and {
    !quote_carrier_transition_shape_is_valid(
      1, 1, 1, 1, False, True, True, True,
    ),
    !quote_carrier_transition_shape_is_valid(
      1, 1, 1, 1, True, False, True, True,
    ),
  }
}

test carrier_transition_shape_rejects_malformed_input_or_unbound_quote() {
  and {
    !quote_carrier_transition_shape_is_valid(
      1, 1, 1, 1, True, True, False, True,
    ),
    !quote_carrier_transition_shape_is_valid(
      1, 1, 1, 1, True, True, True, False,
    ),
  }
}

test authority_total_quantity_accepts_exactly_one() {
  sum_quantities([1]) == 1
}

test authority_total_quantity_rejects_additional_tokens_across_outputs() {
  and {
    sum_quantities([1, 2]) != 1,
    sum_quantities([1, 1]) != 1,
    sum_quantities([2]) != 1,
  }
}

test authority_total_quantity_rejects_missing_singleton() {
  sum_quantities([]) != 1
}
