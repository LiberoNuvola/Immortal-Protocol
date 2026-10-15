use aiken/crypto
use aiken/primitive/bytearray
use immortal/reveal_rules.{classify_row_tier}

/// Mirrors GameRules.rowTierFromIndex. Valid outcome indexes are 0..19999.
pub fn row_tier_from_index(outcome: Int) -> Int {
  if outcome < 0 || outcome >= 20_000 {
    fail
  } else if outcome < 17_500 {
    0
  } else if outcome < 19_200 {
    1
  } else if outcome < 19_800 {
    2
  } else if outcome < 19_980 {
    3
  } else if outcome < 19_999 {
    4
  } else {
    5
  }
}

/// Mirrors GameRules.rowOutcomeIndex, including rejection sampling at 60000.
pub fn row_outcome_index(seed: ByteArray, row: Int) -> Int {
  draw_row_outcome(seed, row, 0)
}

fn draw_row_outcome(seed: ByteArray, row: Int, attempt: Int) -> Int {
  if attempt >= 256 {
    fail
  } else {
    let prefix = bytearray.push(bytearray.push(#"", attempt), row)
    let digest = crypto.sha2_256(bytearray.concat(prefix, seed))
    let draw = bytearray.at(digest, 0) * 256 + bytearray.at(digest, 1)
    if draw < 60_000 {
      draw % 20_000
    } else {
      draw_row_outcome(seed, row, attempt + 1)
    }
  }
}

fn triple_bytes(symbol: Int) -> ByteArray {
  bytearray.push(
    bytearray.push(bytearray.push(#"", symbol), symbol),
    symbol,
  )
}

/// Mirrors GameRules.lossTriple: choose an ordered non-triple from 120 slots.
fn loss_triple(outcome: Int) -> ByteArray {
  let rank = outcome % 120
  let first = rank / 24 + 1
  let pair_rank = rank % 24
  let excluded = (first - 1) * 6
  let pair_index = if pair_rank < excluded { pair_rank } else { pair_rank + 1 }
  let second = pair_index / 5 + 1
  let third = pair_index % 5 + 1
  bytearray.concat(
    bytearray.from_int_big_endian(first, 1),
    bytearray.concat(
      bytearray.from_int_big_endian(second, 1),
      bytearray.from_int_big_endian(third, 1),
    ),
  )
}

/// Mirrors GameRules.rowSymbolsFromIndex.
pub fn row_symbols_from_index(outcome: Int) -> ByteArray {
  let tier = row_tier_from_index(outcome)
  if tier == 0 {
    loss_triple(outcome)
  } else {
    triple_bytes(tier)
  }
}

/// Mirrors GameRules.generateSymbols: two independently sampled rows.
pub fn generate_symbols(symbols_seed: ByteArray) -> ByteArray {
  bytearray.concat(
    row_symbols_from_index(row_outcome_index(symbols_seed, 1)),
    row_symbols_from_index(row_outcome_index(symbols_seed, 2)),
  )
}

/// Mirrors the existing six-symbol summary tier; canonical payout tiers are per row.
pub fn classify_tier(symbols: ByteArray) -> Int {
  if bytearray.length(symbols) < 6 {
    0
  } else {
    let first = classify_row_tier(bytearray.slice(symbols, 0, 2))
    let second = classify_row_tier(bytearray.slice(symbols, 3, 5))
    if first >= second { first } else { second }
  }
}

test row_outcome_boundary_loss() {
  row_tier_from_index(17_499) == 0
}

test row_outcome_boundary_tier_one() {
  row_tier_from_index(17_500) == 1
}

test row_outcome_boundary_tier_two() {
  row_tier_from_index(19_200) == 2
}

test row_outcome_boundary_tier_four() {
  row_tier_from_index(19_980) == 4
}

test row_outcome_boundary_tier_five() {
  row_tier_from_index(19_999) == 5
}

test row_outcome_index_matches_fixed_vector_row_one() {
  row_outcome_index(
    #"0068b5e1ecdfa738c16201c0f5f103bf2edc65805688c1c095fe6c3f728197cc",
    1,
  ) == 13_641
}

test row_outcome_index_matches_fixed_vector_row_two() {
  row_outcome_index(
    #"0068b5e1ecdfa738c16201c0f5f103bf2edc65805688c1c095fe6c3f728197cc",
    2,
  ) == 17_482
}

test loss_row_mapping_matches_existing_algorithm() {
  row_symbols_from_index(0) == #[1, 1, 2]
}

test winning_row_mapping_matches_existing_algorithm() {
  row_symbols_from_index(19_999) == #[5, 5, 5]
}

test full_symbols_match_fixed_vector() {
  generate_symbols(
    #"0068b5e1ecdfa738c16201c0f5f103bf2edc65805688c1c095fe6c3f728197cc",
  ) == #[4, 2, 5, 4, 3, 1]
}

test summary_tier_is_max_of_two_row_tiers() {
  classify_tier(#[1, 1, 1, 3, 3, 3]) == 3
}
