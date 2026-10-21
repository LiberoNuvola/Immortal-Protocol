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
