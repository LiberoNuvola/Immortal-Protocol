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

fn singleton_input_count(
  inputs: List<Input>,
  policy: PolicyId,
  name: AssetName,
) -> Int {
  list.length(
    list.filter(
      inputs,
      fn(input) { cardano_assets.quantity_of(input.output.value, policy, name) == 1 },
    ),
  )
}

fn singleton_output_count(
  outputs: List<Output>,
  policy: PolicyId,
  name: AssetName,
) -> Int {
  list.length(
    list.filter(
      outputs,
      fn(output) { cardano_assets.quantity_of(output.value, policy, name) == 1 },
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

          and {
            // This transition must spend/re-emit the one carrier singleton.
            list.length(script_inputs) == 1,
            list.length(script_outputs) == 1,
            singleton_input_count(tx.inputs, carrier_policy_id, carrier_asset_name) == 1,
            singleton_output_count(tx.outputs, carrier_policy_id, carrier_asset_name) == 1,
            when unique_script_input(tx.inputs, own_hash) is {
              Some(carrier_input) ->
                when unique_script_output(tx.outputs, own_hash) is {
                  Some(carrier_output) ->
                    and {
                      carrier_output.address == carrier_input.output.address,
                      carrier_output.value == carrier_input.output.value,
                      when decode_carrier_datum(tx, carrier_input.output) is {
                        Some(_before) -> True
                        None -> False
                      },
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
                      },
                    }
                  None -> False
                }
              None -> False
            },
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
