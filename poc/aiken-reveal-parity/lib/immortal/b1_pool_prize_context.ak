/// Authenticated Prize-context resolvers for the B1 PrizePool migration candidate.
///
/// These helpers only resolve a unique Prize input/output at the configured
/// Prize script hash and decode its datum. Callers must still enforce each
/// action's status, identity, mint/burn, signatures, expiry, oracle and payout
/// rules. This module is not a validator entry point.
use aiken/collection/list
use aiken/crypto.{ScriptHash}
use aiken/interval
use cardano/assets.{AssetName, PolicyId}
use cardano/assets
use cardano/address.{Script, from_script}
use cardano/transaction
use immortal/reveal_types.{BeaconPending, BeaconReady, BeaconTarget, Claimed, Pending, Revealed, PrizeDatum}

pub type ResolvedPrizeInput {
  ResolvedPrizeInput {
    input: transaction.Input,
    datum: PrizeDatum,
  }
}

pub type ResolvedPrizeOutput {
  ResolvedPrizeOutput {
    output: transaction.Output,
    datum: PrizeDatum,
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
    Some(raw) ->
      if raw is PrizeDatum {
        Some(raw)
      } else {
        None
      }
    None -> None
  }
}

pub fn only_prize_input(
  tx: transaction.Transaction,
  prize_hash: ScriptHash,
) -> Option<ResolvedPrizeInput> {
  when list.filter(tx.inputs, fn(input) {
    input.output.address.payment_credential == Script(prize_hash)
  }) is {
    [input] ->
      when decode_prize_datum(tx, input.output) is {
        Some(datum) -> Some(ResolvedPrizeInput { input, datum })
        None -> None
      }
    _ -> None
  }
}

pub fn only_prize_output(
  tx: transaction.Transaction,
  prize_hash: ScriptHash,
) -> Option<ResolvedPrizeOutput> {
  when list.filter(tx.outputs, fn(output) {
    output.address.payment_credential == Script(prize_hash)
  }) is {
    [output] ->
      when decode_prize_datum(tx, output) is {
        Some(datum) -> Some(ResolvedPrizeOutput { output, datum })
        None -> None
      }
    _ -> None
  }
}

/// Verifies that the resolved consumed Prize datum is exactly the datum supplied
/// by the spending validator, preventing a caller-supplied pre-state mismatch.
pub fn resolved_prize_input_matches(
  tx: transaction.Transaction,
  own_ref: transaction.OutputReference,
  prize_hash: ScriptHash,
  expected: PrizeDatum,
) -> Bool {
  when transaction.find_input(tx.inputs, own_ref) is {
    Some(own_input) ->
      own_input.output.address.payment_credential == Script(prize_hash)
        && when only_prize_input(tx, prize_hash) is {
          Some(resolved) ->
            resolved.input.output_reference == own_ref
              && resolved.datum == expected
          None -> False
        }
    None -> False
  }
}


/// Mirrors the B1PrizePool TicketIssued Prize-output checks. The Pool datum
/// accounting and global authority/solvency guards remain separate predicates.
pub fn ticket_issued_prize_context_is_valid(
  tx: transaction.Transaction,
  prize_hash: ScriptHash,
  action_price: Int,
) -> Bool {
  when only_prize_output(tx, prize_hash) is {
    Some(after) ->
      action_price > 0
        && after.datum.status == Pending
        && after.datum.prize_amount == 0
        && after.datum.ticket_policy != #""
        && after.datum.ticket_name != #""
        && assets.quantity_of(
          tx.mint,
          after.datum.ticket_policy,
          after.datum.ticket_name,
        ) == 1
        && after.datum.price_usdm == action_price
    None -> False
  }
}


const test_prize_hash: ScriptHash = #"09"
const test_other_hash: ScriptHash = #"08"

fn test_prize_datum() -> PrizeDatum {
  PrizeDatum {
    ticket_policy: #"0a",
    ticket_name: #"01",
    player_commitment: #"0102",
    price_usdm: 100,
    commitment: #"0304",
    game_version: #"7631",
    ticket_nonce: 1,
    prize_amount: 0,
    payment_policy: #"0b",
    payment_name: #"02",
    status: Pending,
    result: #"00",
    prize_tier: 0,
    beacon_target: BeaconTarget {
      network_id: 0,
      round: 0,
      mainchain_ref: #"00",
      version: #"7631",
    },
    beacon_status: BeaconPending,
    beacon_value: #"00",
    mc_hash: #"00",
    materios_context: #"00",
    prize_pool_hash: test_other_hash,
    issued_at: 1,
    expires_at: 1000,
    row1_tier: 0,
    row2_tier: 0,
  }
}

fn test_prize_output(
  hash: ScriptHash,
  datum: transaction.Datum,
) -> transaction.Output {
  transaction.Output {
    address: from_script(hash),
    value: assets.from_lovelace(3_000_000),
    datum,
    reference_script: None,
  }
}

fn test_prize_input(
  ref: transaction.OutputReference,
  hash: ScriptHash,
  datum: transaction.Datum,
) -> transaction.Input {
  transaction.Input {
    output_reference: ref,
    output: test_prize_output(hash, datum),
  }
}

fn test_prize_ref(index: Int) -> transaction.OutputReference {
  transaction.OutputReference {
    transaction_id: transaction.placeholder.id,
    output_index: index,
  }
}

fn test_prize_tx(
  inputs: List<transaction.Input>,
  outputs: List<transaction.Output>,
) -> transaction.Transaction {
  transaction.Transaction {
    inputs,
    reference_inputs: [],
    outputs,
    fee: 0,
    mint: assets.zero,
    certificates: [],
    withdrawals: [],
    validity_range: transaction.placeholder.validity_range,
    extra_signatories: [],
    redeemers: [],
    datums: transaction.placeholder.datums,
    id: transaction.placeholder.id,
    votes: [],
    proposal_procedures: [],
    current_treasury_amount: None,
    treasury_donation: None,
  }
}


fn test_prize_tx_with_mint(
  inputs: List<transaction.Input>,
  outputs: List<transaction.Output>,
  mint: assets.Value,
) -> transaction.Transaction {
  transaction.Transaction {
    inputs,
    reference_inputs: [],
    outputs,
    fee: 0,
    mint,
    certificates: [],
    withdrawals: [],
    validity_range: transaction.placeholder.validity_range,
    extra_signatories: [],
    redeemers: [],
    datums: transaction.placeholder.datums,
    id: transaction.placeholder.id,
    votes: [],
    proposal_procedures: [],
    current_treasury_amount: None,
    treasury_donation: None,
  }
}

test prize_context_resolves_unique_input_and_output() {
  let datum = test_prize_datum()
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(datum))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
  )
  when only_prize_input(tx, test_prize_hash) is {
    Some(resolved) -> resolved.datum == datum && resolved.input.output_reference == ref
    None -> False
  }
    && when only_prize_output(tx, test_prize_hash) is {
      Some(resolved) -> resolved.datum == datum
      None -> False
    }
    && resolved_prize_input_matches(tx, ref, test_prize_hash, datum)
}

test prize_context_rejects_duplicate_prize_inputs() {
  let datum = test_prize_datum()
  let tx = test_prize_tx(
    [
      test_prize_input(test_prize_ref(0), test_prize_hash, transaction.InlineDatum(datum)),
      test_prize_input(test_prize_ref(1), test_prize_hash, transaction.InlineDatum(datum)),
    ],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
  )
  when only_prize_input(tx, test_prize_hash) is {
    None -> True
    Some(_) -> False
  }
}

test prize_context_rejects_duplicate_prize_outputs() {
  let datum = test_prize_datum()
  let tx = test_prize_tx(
    [test_prize_input(test_prize_ref(0), test_prize_hash, transaction.InlineDatum(datum))],
    [
      test_prize_output(test_prize_hash, transaction.InlineDatum(datum)),
      test_prize_output(test_prize_hash, transaction.InlineDatum(datum)),
    ],
  )
  when only_prize_output(tx, test_prize_hash) is {
    None -> True
    Some(_) -> False
  }
}

test prize_context_rejects_missing_input_datum() {
  let tx = test_prize_tx(
    [test_prize_input(test_prize_ref(0), test_prize_hash, transaction.NoDatum)],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(test_prize_datum()))],
  )
  when only_prize_input(tx, test_prize_hash) is {
    None -> True
    Some(_) -> False
  }
}

test prize_context_rejects_mismatched_spending_datum() {
  let datum = test_prize_datum()
  let altered = PrizeDatum {
    ticket_policy: datum.ticket_policy,
    ticket_name: datum.ticket_name,
    player_commitment: datum.player_commitment,
    price_usdm: 101,
    commitment: datum.commitment,
    game_version: datum.game_version,
    ticket_nonce: datum.ticket_nonce,
    prize_amount: datum.prize_amount,
    payment_policy: datum.payment_policy,
    payment_name: datum.payment_name,
    status: datum.status,
    result: datum.result,
    prize_tier: datum.prize_tier,
    beacon_target: datum.beacon_target,
    beacon_status: datum.beacon_status,
    beacon_value: datum.beacon_value,
    mc_hash: datum.mc_hash,
    materios_context: datum.materios_context,
    prize_pool_hash: datum.prize_pool_hash,
    issued_at: datum.issued_at,
    expires_at: datum.expires_at,
    row1_tier: datum.row1_tier,
    row2_tier: datum.row2_tier,
  }
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(datum))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
  )
  !resolved_prize_input_matches(tx, ref, test_prize_hash, altered)
}


/// Compares fields that define the ticket's immutable identity across a
/// Pool-observed transition. Action-specific code must separately validate
/// status, payout, beacon/result fields, expiry, minting, signatures and value.
pub fn same_prize_identity(before: PrizeDatum, after: PrizeDatum) -> Bool {
  // Match the normative Haskell Pool identity predicate exactly. Price,
  // status, payout, Pool binding and all other action fields are validated
  // separately by the relevant action guard; do not broaden identity here.
  before.ticket_policy == after.ticket_policy
    && before.ticket_name == after.ticket_name
}

/// Resolves the unique consumed and continuing Prize outputs, then verifies
/// that the ticket identity and Pool binding are preserved. This deliberately
/// does not assert that a particular action/status transition is valid.
pub fn unique_prize_transition_preserves_identity(
  tx: transaction.Transaction,
  prize_hash: ScriptHash,
  expected_pool_hash: ScriptHash,
) -> Bool {
  when (only_prize_input(tx, prize_hash), only_prize_output(tx, prize_hash)) is {
    (Some(before), Some(after)) ->
      before.datum.prize_pool_hash == expected_pool_hash
        && after.datum.prize_pool_hash == expected_pool_hash
        && same_prize_identity(before.datum, after.datum)
    _ -> False
  }
}

test prize_identity_accepts_action_fields_changing() {
  let before = test_prize_datum()
  let after = PrizeDatum {
    ticket_policy: before.ticket_policy,
    ticket_name: before.ticket_name,
    player_commitment: before.player_commitment,
    price_usdm: before.price_usdm,
    commitment: before.commitment,
    game_version: before.game_version,
    ticket_nonce: before.ticket_nonce,
    prize_amount: 250,
    payment_policy: before.payment_policy,
    payment_name: before.payment_name,
    status: Revealed,
    result: #"aa",
    prize_tier: 2,
    beacon_target: before.beacon_target,
    beacon_status: BeaconReady,
    beacon_value: #"bb",
    mc_hash: #"cc",
    materios_context: #"dd",
    prize_pool_hash: before.prize_pool_hash,
    issued_at: before.issued_at,
    expires_at: before.expires_at,
    row1_tier: 2,
    row2_tier: 1,
  }
  same_prize_identity(before, after)
}

test prize_identity_rejects_ticket_name_mutation() {
  let before = test_prize_datum()
  let after = PrizeDatum {
    ticket_policy: before.ticket_policy,
    ticket_name: #"ff",
    player_commitment: before.player_commitment,
    price_usdm: before.price_usdm,
    commitment: before.commitment,
    game_version: before.game_version,
    ticket_nonce: before.ticket_nonce,
    prize_amount: before.prize_amount,
    payment_policy: before.payment_policy,
    payment_name: before.payment_name,
    status: before.status,
    result: before.result,
    prize_tier: before.prize_tier,
    beacon_target: before.beacon_target,
    beacon_status: before.beacon_status,
    beacon_value: before.beacon_value,
    mc_hash: before.mc_hash,
    materios_context: before.materios_context,
    prize_pool_hash: before.prize_pool_hash,
    issued_at: before.issued_at,
    expires_at: before.expires_at,
    row1_tier: before.row1_tier,
    row2_tier: before.row2_tier,
  }
  !same_prize_identity(before, after)
}

test prize_transition_requires_configured_pool_binding() {
  let datum = test_prize_datum()
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(datum))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
  )
  !unique_prize_transition_preserves_identity(tx, test_prize_hash, test_prize_hash)
}


/// Pool-side TicketRevealed context slice. It binds the action price to both
/// datums, requires Pending -> Revealed, preserves the normative ticket identity,
/// and derives payout from the continuing Prize datum. Pool accounting deltas,
/// solvency, authority NFT and oracle/value context remain separate checks.
pub fn ticket_revealed_prize_context_is_valid(
  tx: transaction.Transaction,
  prize_hash: ScriptHash,
  expected_pool_hash: ScriptHash,
  action_price_usdm: Int,
  pre_state_effective_pool: Int,
) -> Bool {
  when (only_prize_input(tx, prize_hash), only_prize_output(tx, prize_hash)) is {
    (Some(before), Some(after)) ->
      before.datum.prize_pool_hash == expected_pool_hash
        && after.datum.prize_pool_hash == expected_pool_hash
        && before.datum.status == Pending
        && after.datum.status == Revealed
        && same_prize_identity(before.datum, after.datum)
        && action_price_usdm > 0
        && before.datum.price_usdm == action_price_usdm
        && after.datum.price_usdm == action_price_usdm
        && after.datum.prize_amount >= 0
        && after.datum.prize_amount <= pre_state_effective_pool
    _ -> False
  }
}

fn test_revealed_datum(payout: Int) -> PrizeDatum {
  let before = test_prize_datum()
  PrizeDatum {
    ticket_policy: before.ticket_policy,
    ticket_name: before.ticket_name,
    player_commitment: before.player_commitment,
    price_usdm: before.price_usdm,
    commitment: before.commitment,
    game_version: before.game_version,
    ticket_nonce: before.ticket_nonce,
    prize_amount: payout,
    payment_policy: before.payment_policy,
    payment_name: before.payment_name,
    status: Revealed,
    result: #"aa",
    prize_tier: 1,
    beacon_target: before.beacon_target,
    beacon_status: BeaconReady,
    beacon_value: #"bb",
    mc_hash: #"cc",
    materios_context: #"dd",
    prize_pool_hash: before.prize_pool_hash,
    issued_at: before.issued_at,
    expires_at: before.expires_at,
    row1_tier: 1,
    row2_tier: 0,
  }
}

test ticket_revealed_context_accepts_bound_pending_to_revealed() {
  let before = test_prize_datum()
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(before))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(test_revealed_datum(250)))],
  )
  ticket_revealed_prize_context_is_valid(tx, test_prize_hash, test_other_hash, 100, 1_000)
}

test ticket_revealed_context_rejects_payout_above_pre_state_pool() {
  let before = test_prize_datum()
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(before))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(test_revealed_datum(1_001)))],
  )
  !ticket_revealed_prize_context_is_valid(tx, test_prize_hash, test_other_hash, 100, 1_000)
}

test ticket_revealed_context_rejects_wrong_action_price() {
  let before = test_prize_datum()
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(before))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(test_revealed_datum(250)))],
  )
  !ticket_revealed_prize_context_is_valid(tx, test_prize_hash, test_other_hash, 101, 1_000)
}

test ticket_revealed_context_rejects_negative_payout() {
  let before = test_prize_datum()
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(before))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(test_revealed_datum(-1)))],
  )
  !ticket_revealed_prize_context_is_valid(tx, test_prize_hash, test_other_hash, 100, 1_000)
}


/// Pool-side TicketClaimed Prize-datum slice. It checks Revealed -> Claimed,
/// preserves the normative ticket identity and payout, and binds the redeemer
/// amount to the consumed payout. Owner NFT/signature and canonical oracle-valued
/// payment plus Pool physical-value delta must be validated separately.
pub fn ticket_claimed_prize_context_is_valid(
  tx: transaction.Transaction,
  prize_hash: ScriptHash,
  expected_pool_hash: ScriptHash,
  claimed_amount: Int,
) -> Bool {
  when (only_prize_input(tx, prize_hash), only_prize_output(tx, prize_hash)) is {
    (Some(before), Some(after)) ->
      before.datum.prize_pool_hash == expected_pool_hash
        && after.datum.prize_pool_hash == expected_pool_hash
        && before.datum.status == Revealed
        && after.datum.status == Claimed
        && same_prize_identity(before.datum, after.datum)
        && before.datum.prize_amount > 0
        && before.datum.prize_amount == after.datum.prize_amount
        && claimed_amount == before.datum.prize_amount
    _ -> False
  }
}

fn test_claimed_datum(payout: Int) -> PrizeDatum {
  let before = test_revealed_datum(payout)
  PrizeDatum {
    ticket_policy: before.ticket_policy,
    ticket_name: before.ticket_name,
    player_commitment: before.player_commitment,
    price_usdm: before.price_usdm,
    commitment: before.commitment,
    game_version: before.game_version,
    ticket_nonce: before.ticket_nonce,
    prize_amount: before.prize_amount,
    payment_policy: before.payment_policy,
    payment_name: before.payment_name,
    status: Claimed,
    result: before.result,
    prize_tier: before.prize_tier,
    beacon_target: before.beacon_target,
    beacon_status: before.beacon_status,
    beacon_value: before.beacon_value,
    mc_hash: before.mc_hash,
    materios_context: before.materios_context,
    prize_pool_hash: before.prize_pool_hash,
    issued_at: before.issued_at,
    expires_at: before.expires_at,
    row1_tier: before.row1_tier,
    row2_tier: before.row2_tier,
  }
}

test ticket_claimed_context_accepts_unchanged_payout() {
  let before = test_revealed_datum(250)
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(before))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(test_claimed_datum(250)))],
  )
  ticket_claimed_prize_context_is_valid(tx, test_prize_hash, test_other_hash, 250)
}

test ticket_claimed_context_rejects_changed_payout() {
  let before = test_revealed_datum(250)
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(before))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(test_claimed_datum(249)))],
  )
  !ticket_claimed_prize_context_is_valid(tx, test_prize_hash, test_other_hash, 250)
}

test ticket_claimed_context_rejects_wrong_claim_amount() {
  let before = test_revealed_datum(250)
  let ref = test_prize_ref(0)
  let tx = test_prize_tx(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(before))],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(test_claimed_datum(250)))],
  )
  !ticket_claimed_prize_context_is_valid(tx, test_prize_hash, test_other_hash, 249)
}


/// Pool-side TicketExpired Prize-context slice. The transaction's own finite
/// lower validity bound must reach expires_at; expiry is never accepted from a
/// caller-supplied timestamp. Pool reserve/count accounting remains a separate
/// predicate, and this helper is not a complete validator branch.
pub fn ticket_expired_prize_context_is_valid(
  tx: transaction.Transaction,
  prize_hash: ScriptHash,
  expected_pool_hash: ScriptHash,
) -> Bool {
  when only_prize_input(tx, prize_hash) is {
    Some(before) ->
      before.datum.prize_pool_hash == expected_pool_hash
        && before.datum.status == Pending
        && before.datum.prize_amount == 0
        && before.datum.price_usdm > 0
        && when tx.validity_range.lower_bound.bound_type is {
          interval.Finite(lower) -> lower >= before.datum.expires_at
          _ -> False
        }
    None -> False
  }
}


fn test_prize_tx_with_lower_bound(
  inputs: List<transaction.Input>,
  outputs: List<transaction.Output>,
  lower: Int,
) -> transaction.Transaction {
  transaction.Transaction {
    inputs,
    reference_inputs: [],
    outputs,
    fee: 0,
    mint: assets.zero,
    certificates: [],
    withdrawals: [],
    validity_range: interval.after(lower),
    extra_signatories: [],
    redeemers: [],
    datums: transaction.placeholder.datums,
    id: transaction.placeholder.id,
    votes: [],
    proposal_procedures: [],
    current_treasury_amount: None,
    treasury_donation: None,
  }
}

test ticket_expired_context_accepts_expired_pending_zero_payout() {
  let datum = test_prize_datum()
  let ref = test_prize_ref(0)
  let tx = test_prize_tx_with_lower_bound(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(datum))],
    [],
    1_000,
  )
  ticket_expired_prize_context_is_valid(tx, test_prize_hash, test_other_hash)
}

test ticket_expired_context_rejects_early_lower_bound() {
  let datum = test_prize_datum()
  let ref = test_prize_ref(0)
  let tx = test_prize_tx_with_lower_bound(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(datum))],
    [],
    999,
  )
  !ticket_expired_prize_context_is_valid(tx, test_prize_hash, test_other_hash)
}


test ticket_expired_context_rejects_wrong_pool_binding() {
  let datum = test_prize_datum()
  let ref = test_prize_ref(0)
  let tx = test_prize_tx_with_lower_bound(
    [test_prize_input(ref, test_prize_hash, transaction.InlineDatum(datum))],
    [],
    1_000,
  )
  !ticket_expired_prize_context_is_valid(tx, test_prize_hash, test_prize_hash)
}


test ticket_issued_context_accepts_exact_minted_pending_ticket() {
  let datum = test_prize_datum()
  let mint = assets.zero
    |> assets.add(datum.ticket_policy, datum.ticket_name, 1)
  let tx = test_prize_tx_with_mint(
    [],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
    mint,
  )
  ticket_issued_prize_context_is_valid(tx, test_prize_hash, 100)
}

test ticket_issued_context_rejects_missing_ticket_mint() {
  let datum = test_prize_datum()
  let tx = test_prize_tx_with_mint(
    [],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
    assets.zero,
  )
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, 100)
}

test ticket_issued_context_rejects_non_singleton_ticket_mint() {
  let datum = test_prize_datum()
  let mint = assets.zero
    |> assets.add(datum.ticket_policy, datum.ticket_name, 2)
  let tx = test_prize_tx_with_mint(
    [],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
    mint,
  )
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, 100)
}

test ticket_issued_context_rejects_action_price_mismatch() {
  let datum = test_prize_datum()
  let mint = assets.zero
    |> assets.add(datum.ticket_policy, datum.ticket_name, 1)
  let tx = test_prize_tx_with_mint(
    [],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
    mint,
  )
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, 101)
}


test ticket_issued_context_rejects_missing_prize_output() {
  let datum = test_prize_datum()
  let mint = assets.zero
    |> assets.add(datum.ticket_policy, datum.ticket_name, 1)
  let tx = test_prize_tx_with_mint([], [], mint)
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, 100)
}

test ticket_issued_context_rejects_duplicate_prize_outputs() {
  let datum = test_prize_datum()
  let mint = assets.zero
    |> assets.add(datum.ticket_policy, datum.ticket_name, 1)
  let output = test_prize_output(
    test_prize_hash,
    transaction.InlineDatum(datum),
  )
  let tx = test_prize_tx_with_mint([], [output, output], mint)
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, 100)
}


test ticket_issued_context_rejects_zero_action_price() {
  let datum = test_prize_datum()
  let mint = assets.zero
    |> assets.add(datum.ticket_policy, datum.ticket_name, 1)
  let tx = test_prize_tx_with_mint(
    [],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
    mint,
  )
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, 0)
}

test ticket_issued_context_rejects_non_pending_output() {
  let datum = test_revealed_datum(0)
  let mint = assets.zero
    |> assets.add(datum.ticket_policy, datum.ticket_name, 1)
  let tx = test_prize_tx_with_mint(
    [],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
    mint,
  )
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, datum.price_usdm)
}


fn test_prize_datum_with_issue_fields(
  ticket_policy: ByteArray,
  ticket_name: ByteArray,
  prize_amount: Int,
) -> PrizeDatum {
  PrizeDatum {
    ticket_policy,
    ticket_name,
    player_commitment: #"0102",
    price_usdm: 100,
    commitment: #"0304",
    game_version: #"7631",
    ticket_nonce: 1,
    prize_amount,
    payment_policy: #"0b",
    payment_name: #"02",
    status: Pending,
    result: #"00",
    prize_tier: 0,
    beacon_target: BeaconTarget {
      network_id: 0,
      round: 0,
      mainchain_ref: #"00",
      version: #"7631",
    },
    beacon_status: BeaconPending,
    beacon_value: #"00",
    mc_hash: #"00",
    materios_context: #"00",
    prize_pool_hash: test_other_hash,
    issued_at: 1,
    expires_at: 1000,
    row1_tier: 0,
    row2_tier: 0,
  }
}

test ticket_issued_context_rejects_nonzero_prize_amount() {
  let datum = test_prize_datum_with_issue_fields(#"0a", #"01", 1)
  let tx = test_prize_tx_with_mint(
    [],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
    assets.zero,
  )
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, 100)
}

test ticket_issued_context_rejects_empty_ticket_policy() {
  let datum = test_prize_datum_with_issue_fields(#"", #"01", 0)
  let tx = test_prize_tx_with_mint(
    [],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
    assets.zero,
  )
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, 100)
}

test ticket_issued_context_rejects_empty_ticket_name() {
  let datum = test_prize_datum_with_issue_fields(#"0a", #"", 0)
  let tx = test_prize_tx_with_mint(
    [],
    [test_prize_output(test_prize_hash, transaction.InlineDatum(datum))],
    assets.zero,
  )
  !ticket_issued_prize_context_is_valid(tx, test_prize_hash, 100)
}
