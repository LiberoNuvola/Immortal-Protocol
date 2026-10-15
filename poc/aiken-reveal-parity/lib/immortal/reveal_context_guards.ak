/// Pure transaction-context guards extracted from PrizeValidator.hs.
/// These predicates do not decode Cardano ScriptContext; they are parity
/// seams for differential fixtures before wiring a full V3 validator.

pub type RevealIdentity {
  RevealIdentity {
    ticket_policy: ByteArray,
    ticket_name: ByteArray,
    player_commitment: ByteArray,
    price_usdm: Int,
    commitment: ByteArray,
    game_version: ByteArray,
    ticket_nonce: Int,
    payment_policy: ByteArray,
    payment_name: ByteArray,
    target_network_id: Int,
    target_round: Int,
    target_mainchain_ref: ByteArray,
    target_version: ByteArray,
    prize_pool_hash: ByteArray,
    issued_at: Int,
    expires_at: Int,
  }
}

/// Relevant B1PrizePool datum fields read by validateReveal.
pub type RevealPoolState {
  RevealPoolState {
    total_liquidity: Int,
    pending_liabilities: Int,
    unresolved_reserve: Int,
    unresolved_ticket_count: Int,
    locked_jackpot: Int,
    jackpot_threshold: Int,
    suspended_classes: Int,
    prize_hash: ByteArray,
  }
}

pub fn reveal_window_open(expires_at: Int, upper_bound: Option<Int>) -> Bool {
  when upper_bound is {
    Some(bound) -> bound <= expires_at
    None -> False
  }
}

pub fn expire_window_open(expires_at: Int, lower_bound: Option<Int>) -> Bool {
  when lower_bound is {
    Some(bound) -> bound >= expires_at
    None -> False
  }
}

pub fn exactly_one_own_input(count: Int) -> Bool {
  count == 1
}

pub fn exactly_one_pool_input(count: Int) -> Bool {
  count == 1
}

pub fn exactly_one_continuing_prize_output(count: Int) -> Bool {
  count == 1
}

pub fn no_continuing_prize_output(count: Int) -> Bool {
  count == 0
}

/// The serialized value encodings are supplied by fixtures. This predicate
/// models valuePreserved's equality check, not Cardano Value decoding.
pub fn continuing_value_preserved(
  continuing_output_count: Int,
  input_value: ByteArray,
  output_value: ByteArray,
) -> Bool {
  continuing_output_count == 1 && input_value == output_value
}

/// Mirrors PrizeValidator.identityFieldsEq. Reveal result/tier/payout are
/// intentionally excluded because Reveal is the one transition that writes
/// those fields. This record contains only immutable identity fields.
pub fn identity_fields_preserved(old_identity: RevealIdentity, new_identity: RevealIdentity) -> Bool {
  old_identity.ticket_policy == new_identity.ticket_policy
    && old_identity.ticket_name == new_identity.ticket_name
    && old_identity.player_commitment == new_identity.player_commitment
    && old_identity.price_usdm == new_identity.price_usdm
    && old_identity.commitment == new_identity.commitment
    && old_identity.game_version == new_identity.game_version
    && old_identity.ticket_nonce == new_identity.ticket_nonce
    && old_identity.payment_policy == new_identity.payment_policy
    && old_identity.payment_name == new_identity.payment_name
    && old_identity.target_network_id == new_identity.target_network_id
    && old_identity.target_round == new_identity.target_round
    && old_identity.target_mainchain_ref == new_identity.target_mainchain_ref
    && old_identity.target_version == new_identity.target_version
    && old_identity.prize_pool_hash == new_identity.prize_pool_hash
    && old_identity.issued_at == new_identity.issued_at
    && old_identity.expires_at == new_identity.expires_at
}

/// Mirrors the Reveal branch of validateReveal's poolOk. Input count,
/// output uniqueness, datum decoding, and actual UTxO association remain
/// responsibilities of the future transaction-context validator.
pub fn reveal_pool_transition_is_valid(
  payout: Int,
  expected_prize_hash: ByteArray,
  old_pool: RevealPoolState,
  new_pool: RevealPoolState,
) -> Bool {
  payout >= 0
    && new_pool.prize_hash == expected_prize_hash
    && old_pool.prize_hash == expected_prize_hash
    && payout <= (old_pool.total_liquidity - old_pool.pending_liabilities - old_pool.unresolved_reserve - old_pool.locked_jackpot)
    && new_pool.pending_liabilities == old_pool.pending_liabilities + payout
    && new_pool.unresolved_reserve < old_pool.unresolved_reserve
    && new_pool.total_liquidity == old_pool.total_liquidity
    && new_pool.unresolved_ticket_count == old_pool.unresolved_ticket_count - 1
}

const identity_fixture =
  RevealIdentity {
    ticket_policy: #"a1",
    ticket_name: #"01",
    player_commitment: #"02",
    price_usdm: 100,
    commitment: #"03",
    game_version: "classic-6-v1",
    ticket_nonce: 7,
    payment_policy: #"04",
    payment_name: #"05",
    target_network_id: 0,
    target_round: 42,
    target_mainchain_ref: #"010203",
    target_version: "v1",
    prize_pool_hash: #"06",
    issued_at: 1_000,
    expires_at: 9_000,
  }

const pool_before =
  RevealPoolState {
    total_liquidity: 100_000,
    pending_liabilities: 1_000,
    unresolved_reserve: 500,
    unresolved_ticket_count: 8,
    locked_jackpot: 2_000,
    jackpot_threshold: 5_000,
    suspended_classes: 0,
    prize_hash: #"06",
  }

const pool_after =
  RevealPoolState {
    total_liquidity: 100_000,
    pending_liabilities: 1_350,
    unresolved_reserve: 400,
    unresolved_ticket_count: 7,
    locked_jackpot: 2_000,
    jackpot_threshold: 5_000,
    suspended_classes: 0,
    prize_hash: #"06",
  }

test reveal_accepts_finite_upper_bound_before_expiry() {
  reveal_window_open(9_000, Some(8_999))
}

test reveal_accepts_upper_bound_equal_to_expiry() {
  reveal_window_open(9_000, Some(9_000))
}

test reveal_rejects_upper_bound_after_expiry() {
  !reveal_window_open(9_000, Some(9_001))
}

test reveal_fails_closed_without_finite_upper_bound() {
  !reveal_window_open(9_000, None)
}

test expire_accepts_lower_bound_equal_to_expiry() {
  expire_window_open(9_000, Some(9_000))
}

test expire_accepts_lower_bound_after_expiry() {
  expire_window_open(9_000, Some(9_001))
}

test expire_rejects_lower_bound_before_expiry() {
  !expire_window_open(9_000, Some(8_999))
}

test expire_fails_closed_without_finite_lower_bound() {
  !expire_window_open(9_000, None)
}

test own_prize_input_must_be_unique() {
  exactly_one_own_input(1)
    && !exactly_one_own_input(0)
    && !exactly_one_own_input(2)
}

test pool_input_must_be_unique() {
  exactly_one_pool_input(1)
    && !exactly_one_pool_input(2)
}

test reveal_requires_one_continuing_prize_output() {
  exactly_one_continuing_prize_output(1)
    && !exactly_one_continuing_prize_output(0)
    && !exactly_one_continuing_prize_output(2)
}

test expire_requires_no_continuing_prize_output() {
  no_continuing_prize_output(0)
    && !no_continuing_prize_output(1)
}

test value_is_preserved_only_for_single_equal_value_output() {
  continuing_value_preserved(1, #"0102", #"0102")
    && !continuing_value_preserved(1, #"0102", #"0103")
    && !continuing_value_preserved(2, #"0102", #"0102")
    && !continuing_value_preserved(0, #"0102", #"0102")
}

test identity_fields_are_preserved() {
  identity_fields_preserved(identity_fixture, identity_fixture)
}

test identity_fields_reject_changed_ticket_name() {
  let changed = RevealIdentity { ..identity_fixture, ticket_name: #"ff" }
  !identity_fields_preserved(identity_fixture, changed)
}

test identity_fields_reject_changed_expiry() {
  let changed = RevealIdentity { ..identity_fixture, expires_at: 9_001 }
  !identity_fields_preserved(identity_fixture, changed)
}

test pool_accepts_consistent_reveal_transition() {
  reveal_pool_transition_is_valid(350, #"06", pool_before, pool_after)
}

test pool_accepts_zero_payout_for_a_revealed_loss() {
  let loss_after =
    RevealPoolState {
      ..pool_before,
      unresolved_reserve: 400,
      unresolved_ticket_count: 7,
    }
  reveal_pool_transition_is_valid(0, #"06", pool_before, loss_after)
}

test pool_rejects_negative_payout() {
  !reveal_pool_transition_is_valid(-1, #"06", pool_before, pool_after)
}

test pool_rejects_input_prize_hash_mismatch() {
  let changed = RevealPoolState { ..pool_before, prize_hash: #"ff" }
  !reveal_pool_transition_is_valid(350, #"06", changed, pool_after)
}

test pool_rejects_payout_above_effective_pool() {
  !reveal_pool_transition_is_valid(100_000, #"06", pool_before, pool_after)
}

test pool_rejects_wrong_liability_delta() {
  let changed = RevealPoolState { ..pool_after, pending_liabilities: 1_351 }
  !reveal_pool_transition_is_valid(350, #"06", pool_before, changed)
}

test pool_rejects_reserve_that_does_not_decrease() {
  let changed = RevealPoolState { ..pool_after, unresolved_reserve: 500 }
  !reveal_pool_transition_is_valid(350, #"06", pool_before, changed)
}

test pool_rejects_changed_liquidity() {
  let changed = RevealPoolState { ..pool_after, total_liquidity: 99_999 }
  !reveal_pool_transition_is_valid(350, #"06", pool_before, changed)
}

test pool_rejects_wrong_unresolved_count() {
  let changed = RevealPoolState { ..pool_after, unresolved_ticket_count: 8 }
  !reveal_pool_transition_is_valid(350, #"06", pool_before, changed)
}

test pool_rejects_prize_hash_mismatch() {
  let changed = RevealPoolState { ..pool_after, prize_hash: #"ff" }
  !reveal_pool_transition_is_valid(350, #"06", pool_before, changed)
}
