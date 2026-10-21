/// Isolated Pyth Lazer ADA/USD consumer boundary.
///
/// This module intentionally preserves the raw signed-feed price and exponent.
/// It does NOT convert that quote into the current IMMORTAL USDM sub-unit oracle
/// price: the governed conversion/rounding relationship has not been qualified.
use aiken/collection/list
use aiken/interval
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction}
use pyth
use types/u32
use types/u64
use types/u8

pub const ada_usd_feed_id = 16

/// Reuse the existing PRE-RICH/Economic one-hour source-age bound.
/// Pyth timestamps are microseconds; Cardano validity bounds are milliseconds.
pub const canonical_oracle_max_age_ms = 3_600_000
pub const canonical_oracle_max_age_us = canonical_oracle_max_age_ms * 1_000

pub type AdaUsdEvidence {
  AdaUsdEvidence {
    price: Int,
    exponent: Int,
    update_timestamp_us: Int,
    feed_update_timestamp_us: Int,
  }
}

/// Datum that a candidate consumer must bind to the quote read from the
/// transaction. Matching these fields proves the datum did not substitute a
/// different raw price or exponent. This is still only the isolated probe datum.
pub type AdaUsdBinding {
  AdaUsdBinding {
    price: Int,
    exponent: Int,
    update_timestamp_us: Int,
    feed_update_timestamp_us: Int,
  }
}

fn timestamp_is_fresh(timestamp_us: Int, upper_bound_ms: Int) -> Bool {
  let upper_bound_us = upper_bound_ms * 1_000
  and {
    timestamp_us <= upper_bound_us,
    upper_bound_us - timestamp_us <= canonical_oracle_max_age_us,
  }
}

/// Select the single ADA/USD feed and apply the existing one-hour freshness
/// boundary to both the update timestamp and that feed's own update timestamp.
/// Missing or duplicate ADA/USD records, missing price/exponent/timestamp, and
/// non-positive prices fail closed. Raw price/exponent are not normalized here.
pub fn select_fresh_ada_usd(
  update: pyth.PriceUpdate,
  upper_bound_ms: Int,
) -> Option<AdaUsdEvidence> {
  let update_timestamp_us = u64.as_int(update.timestamp_us)
  let matching_feeds = list.filter(
    update.feeds,
    fn(feed) { u32.as_int(feed.feed_id) == ada_usd_feed_id },
  )

  when matching_feeds is {
    [feed] ->
      when feed.price is {
        Some(Some(price)) ->
          when feed.exponent is {
            Some(exponent) ->
              when feed.feed_update_timestamp is {
                Some(Some(feed_timestamp)) -> {
                  let feed_update_timestamp_us = u64.as_int(feed_timestamp)
                  if
                    price > 0
                      && timestamp_is_fresh(update_timestamp_us, upper_bound_ms)
                      && timestamp_is_fresh(feed_update_timestamp_us, upper_bound_ms)
                  {
                    Some(
                      AdaUsdEvidence {
                        price,
                        exponent,
                        update_timestamp_us,
                        feed_update_timestamp_us,
                      },
                    )
                  } else {
                    None
                  }
                }
                _ -> None
              }
            None -> None
          }
        _ -> None
      }
    _ -> None
  }
}

/// Read the update from the authenticated Pyth State reference input and the
/// Pyth withdraw-script redeemer. The transaction must also execute Pyth's
/// zero-withdrawal verification script; `pyth.get_updates` parses its payload
/// and relies on that separate script for signature verification.
///
/// A missing/malformed Pyth state, or missing withdraw redeemer, fails closed
/// in the upstream library. Non-singleton update lists or non-finite validity
/// upper bounds are explicitly rejected here.
pub fn verified_ada_usd_from_transaction(
  pyth_policy_id: PolicyId,
  self: Transaction,
) -> Option<AdaUsdEvidence> {
  let updates = pyth.get_updates(pyth_policy_id, self)
  when updates is {
    [update] ->
      when self.validity_range.upper_bound.bound_type is {
        interval.Finite(upper_bound_ms) ->
          select_fresh_ada_usd(update, upper_bound_ms)
        _ -> None
      }
    _ -> None
  }
}

pub fn binding_matches(
  expected: AdaUsdBinding,
  actual: AdaUsdEvidence,
) -> Bool {
  and {
    expected.price == actual.price,
    expected.exponent == actual.exponent,
    expected.update_timestamp_us == actual.update_timestamp_us,
    expected.feed_update_timestamp_us == actual.feed_update_timestamp_us,
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

fn fixture_update(
  timestamp_us: Int,
  feeds: List<pyth.Feed>,
) -> pyth.PriceUpdate {
  pyth.PriceUpdate {
    timestamp_us: u64.from_int(timestamp_us),
    channel_id: u8.from_int(3),
    feeds,
  }
}

test accepts_one_fresh_ada_usd_record() {
  let update_timestamp_us = 1_700_000_000_000_000
  let feed_timestamp_us = update_timestamp_us - 10_000_000
  let update = fixture_update(
    update_timestamp_us,
    [
      fixture_feed(
        ada_usd_feed_id,
        Some(Some(69_500_000)),
        Some(-8),
        Some(Some(feed_timestamp_us)),
      ),
    ],
  )
  when select_fresh_ada_usd(update, 1_700_000_000_000) is {
    Some(evidence) ->
      and {
        evidence.price == 69_500_000,
        evidence.exponent == -8,
        evidence.update_timestamp_us == update_timestamp_us,
        evidence.feed_update_timestamp_us == feed_timestamp_us,
      }
    None -> False
  }
}

test rejects_update_older_than_canonical_one_hour_bound() {
  let upper_bound_ms = 1_700_000_000_000
  let too_old_us = upper_bound_ms * 1_000 - canonical_oracle_max_age_us - 1
  let update = fixture_update(
    too_old_us,
    [
      fixture_feed(
        ada_usd_feed_id,
        Some(Some(69_500_000)),
        Some(-8),
        Some(Some(too_old_us)),
      ),
    ],
  )
  select_fresh_ada_usd(update, upper_bound_ms) == None
}

test accepts_exact_existing_freshness_boundary() {
  let upper_bound_ms = 1_700_000_000_000
  let boundary_us = upper_bound_ms * 1_000 - canonical_oracle_max_age_us
  let update = fixture_update(
    boundary_us,
    [
      fixture_feed(
        ada_usd_feed_id,
        Some(Some(69_500_000)),
        Some(-8),
        Some(Some(boundary_us)),
      ),
    ],
  )
  select_fresh_ada_usd(update, upper_bound_ms) != None
}

test rejects_timestamp_after_transaction_validity_upper_bound() {
  let upper_bound_ms = 1_700_000_000_000
  let future_us = upper_bound_ms * 1_000 + 1
  let update = fixture_update(
    future_us,
    [
      fixture_feed(
        ada_usd_feed_id,
        Some(Some(69_500_000)),
        Some(-8),
        Some(Some(future_us)),
      ),
    ],
  )
  select_fresh_ada_usd(update, upper_bound_ms) == None
}

test rejects_recent_envelope_with_stale_feed_timestamp() {
  let upper_bound_ms = 1_700_000_000_000
  let recent_us = upper_bound_ms * 1_000 - 1_000
  let stale_feed_us = upper_bound_ms * 1_000 - canonical_oracle_max_age_us - 1
  let update = fixture_update(
    recent_us,
    [
      fixture_feed(
        ada_usd_feed_id,
        Some(Some(69_500_000)),
        Some(-8),
        Some(Some(stale_feed_us)),
      ),
    ],
  )
  select_fresh_ada_usd(update, upper_bound_ms) == None
}

test rejects_missing_ada_usd_feed() {
  let update = fixture_update(
    1_700_000_000_000_000,
    [
      fixture_feed(
        1,
        Some(Some(69_500_000)),
        Some(-8),
        Some(Some(1_700_000_000_000_000)),
      ),
    ],
  )
  select_fresh_ada_usd(update, 1_700_000_000_000) == None
}

test rejects_duplicate_ada_usd_feed_ids() {
  let timestamp = 1_700_000_000_000_000
  let feed = fixture_feed(
    ada_usd_feed_id,
    Some(Some(69_500_000)),
    Some(-8),
    Some(Some(timestamp)),
  )
  let update = fixture_update(timestamp, [feed, feed])
  select_fresh_ada_usd(update, 1_700_000_000_000) == None
}

test rejects_missing_price_exponent_or_feed_timestamp() {
  let timestamp = 1_700_000_000_000_000
  let missing_price = fixture_update(
    timestamp,
    [fixture_feed(ada_usd_feed_id, None, Some(-8), Some(Some(timestamp)))],
  )
  let missing_exponent = fixture_update(
    timestamp,
    [fixture_feed(ada_usd_feed_id, Some(Some(1)), None, Some(Some(timestamp)))],
  )
  let missing_feed_timestamp = fixture_update(
    timestamp,
    [fixture_feed(ada_usd_feed_id, Some(Some(1)), Some(-8), None)],
  )
  and {
    select_fresh_ada_usd(missing_price, 1_700_000_000_000) == None,
    select_fresh_ada_usd(missing_exponent, 1_700_000_000_000) == None,
    select_fresh_ada_usd(missing_feed_timestamp, 1_700_000_000_000) == None,
  }
}

test binding_must_match_the_exact_raw_quote() {
  let timestamp = 1_700_000_000_000_000
  let update = fixture_update(
    timestamp,
    [
      fixture_feed(
        ada_usd_feed_id,
        Some(Some(69_500_000)),
        Some(-8),
        Some(Some(timestamp)),
      ),
    ],
  )
  when select_fresh_ada_usd(update, 1_700_000_000_000) is {
    Some(actual) ->
      and {
        binding_matches(
          AdaUsdBinding {
            price: actual.price,
            exponent: actual.exponent,
            update_timestamp_us: actual.update_timestamp_us,
            feed_update_timestamp_us: actual.feed_update_timestamp_us,
          },
          actual,
        ),
        !binding_matches(
          AdaUsdBinding {
            price: actual.price + 1,
            exponent: actual.exponent,
            update_timestamp_us: actual.update_timestamp_us,
            feed_update_timestamp_us: actual.feed_update_timestamp_us,
          },
          actual,
        ),
        !binding_matches(
          AdaUsdBinding {
            price: actual.price,
            exponent: actual.exponent + 1,
            update_timestamp_us: actual.update_timestamp_us,
            feed_update_timestamp_us: actual.feed_update_timestamp_us,
          },
          actual,
        ),
      }
    None -> False
  }
}


/// Pure unit-conversion candidate for review only.
///
/// `usd_per_usdm_numerator / usd_per_usdm_denominator` is an explicit
/// rational D = USD per 1 USDM. This function does not choose D and is not
/// used by the quote-carrier validator. The caller supplies an exponent bound
/// rather than inheriting a new fixed economic parameter from this probe.
///
/// Conversion:
///   ceil((economic lovelace / 1e6 ADA/lovelace) *
///        (price * 10^exponent USD/ADA) * (100 subunits/USDM) / D)
///
/// The raw signed price/exponent should be kept intact until this final exact
/// rational conversion. Do not round the feed price to an integer first.
fn power_of_ten_loop(remaining: Int, accumulator: Int) -> Int {
  if remaining == 0 {
    accumulator
  } else {
    power_of_ten_loop(remaining - 1, accumulator * 10)
  }
}

fn positive_ceil_div(numerator: Int, denominator: Int) -> Int {
  (numerator + denominator - 1) / denominator
}

pub fn pyth_ada_usd_to_usdm_subunits(
  price: Int,
  exponent: Int,
  economic_lovelace: Int,
  usd_per_usdm_numerator: Int,
  usd_per_usdm_denominator: Int,
  maximum_absolute_exponent: Int,
) -> Option<Int> {
  let exponent_magnitude = if exponent < 0 { 0 - exponent } else { exponent }
  if
    price <= 0
      || economic_lovelace < 0
      || usd_per_usdm_numerator <= 0
      || usd_per_usdm_denominator <= 0
      || maximum_absolute_exponent < 0
      || exponent_magnitude > maximum_absolute_exponent
  {
    None
  } else {
    let scale = power_of_ten_loop(exponent_magnitude, 1)
    let numerator = if exponent < 0 {
      economic_lovelace * price * 100 * usd_per_usdm_denominator
    } else {
      economic_lovelace * price * scale * 100 * usd_per_usdm_denominator
    }
    let denominator = if exponent < 0 {
      1_000_000 * scale * usd_per_usdm_numerator
    } else {
      1_000_000 * usd_per_usdm_numerator
    }
    Some(positive_ceil_div(numerator, denominator))
  }
}

test rational_conversion_exact_one_usd_per_usdm() {
  // Synthetic quote: $1 / ADA; one economic ADA -> 100 subunits if D = $1/USDM.
  pyth_ada_usd_to_usdm_subunits(100_000_000, -8, 1_000_000, 1, 1, 18)
    == Some(100)
}

test rational_conversion_uses_raw_price_before_ceiling_rounding() {
  // Synthetic source: 0.695087 USD/ADA; 1.438 ADA -> 99.954... subunits,
  // which rounds upward once to 100. Pre-rounding the feed quote to 70 would
  // produce 101 under the legacy integer quote path for this quantity.
  pyth_ada_usd_to_usdm_subunits(69_508_700, -8, 1_438_000, 1, 1, 18)
    == Some(100)
}

test rational_conversion_does_not_assume_usdm_usd_parity() {
  // Synthetic D = 2 USD per USDM. One ADA worth exactly $1 -> 50 USDM subunits.
  pyth_ada_usd_to_usdm_subunits(100_000_000, -8, 1_000_000, 2, 1, 18)
    == Some(50)
}

test rational_conversion_supports_an_explicit_fractional_usdm_usd_ratio() {
  // Synthetic D = 3/2 USD per USDM. One ADA worth $1 -> ceil(100 / 1.5) = 67.
  pyth_ada_usd_to_usdm_subunits(100_000_000, -8, 1_000_000, 3, 2, 18)
    == Some(67)
}

test rational_conversion_supports_nonnegative_exponents_without_float_math() {
  // Synthetic price = 7 USD/ADA with exponent 0; one ADA -> 700 subunits under D=1.
  pyth_ada_usd_to_usdm_subunits(7, 0, 1_000_000, 1, 1, 18)
    == Some(700)
}

test rational_conversion_rejects_invalid_unit_ratio_amount_and_exponent() {
  and {
    pyth_ada_usd_to_usdm_subunits(100_000_000, -8, 1_000_000, 0, 1, 18) == None,
    pyth_ada_usd_to_usdm_subunits(100_000_000, -8, 1_000_000, 1, 0, 18) == None,
    pyth_ada_usd_to_usdm_subunits(100_000_000, -8, -1, 1, 1, 18) == None,
    pyth_ada_usd_to_usdm_subunits(100_000_000, -19, 1_000_000, 1, 1, 18) == None,
    pyth_ada_usd_to_usdm_subunits(0, -8, 1_000_000, 1, 1, 18) == None,
  }
}
