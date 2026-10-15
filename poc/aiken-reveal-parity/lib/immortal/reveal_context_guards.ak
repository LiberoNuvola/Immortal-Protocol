/// Pure transaction-context guards extracted from PrizeValidator.hs.
/// These predicates do not decode Cardano ScriptContext; they are the
/// parity seam for differential fixtures before wiring a full V3 validator.

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

/// Mirrors PrizeValidator.identityFieldsEq. Reveal result/tier/payout are
/// intentionally excluded because Reveal is the one transition that writes
/// those fields. This record contains only immutable identity fields.
pub fn identity_fields_preserved(before: RevealIdentity, after: RevealIdentity) -> Bool {
  before.ticket_policy == after.ticket_policy
    && before.ticket_name == after.ticket_name
    && before.player_commitment == after.player_commitment
    && before.price_usdm == after.price_usdm
    && before.commitment == after.commitment
    && before.game_version == after.game_version
    && before.ticket_nonce == after.ticket_nonce
    && before.payment_policy == after.payment_policy
    && before.payment_name == after.payment_name
    && before.target_network_id == after.target_network_id
    && before.target_round == after.target_round
    && before.target_mainchain_ref == after.target_mainchain_ref
    && before.target_version == after.target_version
    && before.prize_pool_hash == after.prize_pool_hash
    && before.issued_at == after.issued_at
    && before.expires_at == after.expires_at
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
