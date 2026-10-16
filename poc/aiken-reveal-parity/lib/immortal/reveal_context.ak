use aiken/collection/list
use aiken/crypto.{ScriptHash}
use cardano/address.{Script, VerificationKey, from_script}
use cardano/assets as assets
use cardano/transaction
use cardano/transaction.{Input, Output, OutputReference, Transaction}
use immortal/reveal_types.{BeaconPending, BeaconTarget, Pending, PrizeDatum}

/// Counts transaction inputs whose payment credential is the given script hash.
fn count_script_inputs(inputs: List<Input>, script_hash: ScriptHash) -> Int {
  list.length(
    list.filter(
      inputs,
      fn(input) {
        input.output.address.payment_credential == Script(script_hash)
      },
    ),
  )
}

/// Counts transaction outputs whose payment credential is the given script hash.
fn count_script_outputs(outputs: List<Output>, script_hash: ScriptHash) -> Int {
  list.length(
    list.filter(
      outputs,
      fn(output) {
        output.address.payment_credential == Script(script_hash)
      },
    ),
  )
}

/// Returns the only output locked by a script hash, if and only if it is unique.
fn unique_script_output(outputs: List<Output>, script_hash: ScriptHash) -> Option<Output> {
  when list.filter(
    outputs,
    fn(output) {
      output.address.payment_credential == Script(script_hash)
    },
  ) is {
    [output] -> Some(output)
    _ -> None
  }
}

/// Structural Reveal guard over Aiken's typed Cardano transaction and Prize datum.
/// The PrizePool hash is sourced from the decoded PrizeDatum, not supplied as a
/// separate caller-controlled argument.
///
/// Still intentionally incomplete: it does not decode/validate pool datums,
/// redeemer semantics, commitments, payout, or pool accounting deltas.
pub fn reveal_context_structure_is_valid(
  tx: Transaction,
  own_ref: OutputReference,
  datum: PrizeDatum,
) -> Bool {
  let expected_pool_hash = datum.prize_pool_hash
  when tx.inputs |> list.find(fn(input) { input.output_reference == own_ref }) is {
    None -> False
    Some(own_input) ->
      when own_input.output.address.payment_credential is {
        Script(own_script_hash) ->
          and {
            count_script_inputs(tx.inputs, own_script_hash) == 1,
            count_script_outputs(tx.outputs, own_script_hash) == 1,
            when unique_script_output(tx.outputs, own_script_hash) is {
              Some(continuing) -> continuing.value == own_input.output.value
              None -> False
            },
            count_script_inputs(tx.inputs, expected_pool_hash) == 1,
            count_script_outputs(tx.outputs, expected_pool_hash) == 1,
          }
        VerificationKey(_) -> False
      }
  }
}

test empty_transaction_fails_closed() {
  !reveal_context_structure_is_valid(
    transaction.placeholder,
    OutputReference {
      transaction_id: transaction.placeholder.id,
      output_index: 0,
    },
    PrizeDatum {
      ticket_policy: #"",
      ticket_name: #"",
      player_commitment: #"",
      price_usdm: 0,
      commitment: #"",
      game_version: #"",
      ticket_nonce: 0,
      prize_amount: 0,
      payment_policy: #"",
      payment_name: #"",
      status: Pending,
      result: #"",
      prize_tier: 0,
      beacon_target: BeaconTarget {
        network_id: 0,
        round: 0,
        mainchain_ref: #"",
        version: #"",
      },
      beacon_status: BeaconPending,
      beacon_value: #"",
      mc_hash: #"",
      materios_context: #"",
      prize_pool_hash: #"",
      issued_at: 0,
      expires_at: 0,
      row1_tier: 0,
      row2_tier: 0,
    },
  )
}

// Synthetic typed transaction fixtures for the context guard.
// These exercise Aiken's actual cardano/transaction structures, but are not
// serialized ledger transactions and do not replace Yaci/native-ledger tests.

fn context_fixture_output(script_hash: ScriptHash, value: assets.Value) -> Output {
  Output {
    address: from_script(script_hash),
    value,
    datum: transaction.NoDatum,
    reference_script: None,
  }
}

fn context_fixture_input(
  output_reference: OutputReference,
  script_hash: ScriptHash,
  value: assets.Value,
) -> Input {
  Input {
    output_reference,
    output: context_fixture_output(script_hash, value),
  }
}

fn context_fixture_datum(pool_hash: ScriptHash) -> PrizeDatum {
  PrizeDatum {
    ticket_policy: #"a1",
    ticket_name: #"01",
    player_commitment: #"02",
    price_usdm: 100,
    commitment: #"03",
    game_version: "classic-6-v1",
    ticket_nonce: 7,
    prize_amount: 0,
    payment_policy: #"04",
    payment_name: #"05",
    status: Pending,
    result: #"",
    prize_tier: 0,
    beacon_target: BeaconTarget {
      network_id: 0,
      round: 42,
      mainchain_ref: #"010203",
      version: #"7631",
    },
    beacon_status: BeaconPending,
    beacon_value: #"06",
    mc_hash: #"07",
    materios_context: #"08",
    prize_pool_hash: pool_hash,
    issued_at: 1_000,
    expires_at: 9_000,
    row1_tier: 0,
    row2_tier: 0,
  }
}

const context_fixture_own_hash: ScriptHash = #"06"
const context_fixture_pool_hash: ScriptHash = #"09"

fn context_fixture_own_ref() -> OutputReference {
  OutputReference {
    transaction_id: transaction.placeholder.id,
    output_index: 0,
  }
}

fn context_fixture_pool_ref(index: Int) -> OutputReference {
  OutputReference {
    transaction_id: transaction.placeholder.id,
    output_index: index,
  }
}

test typed_context_accepts_unique_prize_and_pool_with_preserved_value() {
  let own_ref = context_fixture_own_ref()
  let own_value = assets.from_lovelace(5_000_000)
  let pool_value = assets.from_lovelace(10_000_000)
  let own_input = context_fixture_input(own_ref, context_fixture_own_hash, own_value)
  let pool_input = context_fixture_input(
    context_fixture_pool_ref(1),
    context_fixture_pool_hash,
    pool_value,
  )
  let tx = Transaction {
    inputs: [own_input, pool_input],
    reference_inputs: [],
    outputs: [
      context_fixture_output(context_fixture_own_hash, own_value),
      context_fixture_output(context_fixture_pool_hash, pool_value),
    ],
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
  reveal_context_structure_is_valid(tx, own_ref, context_fixture_datum(context_fixture_pool_hash))
}

test typed_context_rejects_duplicate_pool_input() {
  let own_ref = context_fixture_own_ref()
  let own_value = assets.from_lovelace(5_000_000)
  let pool_value = assets.from_lovelace(10_000_000)
  let tx = Transaction {
    inputs: [
      context_fixture_input(own_ref, context_fixture_own_hash, own_value),
      context_fixture_input(context_fixture_pool_ref(1), context_fixture_pool_hash, pool_value),
      context_fixture_input(context_fixture_pool_ref(2), context_fixture_pool_hash, pool_value),
    ],
    reference_inputs: [],
    outputs: [
      context_fixture_output(context_fixture_own_hash, own_value),
      context_fixture_output(context_fixture_pool_hash, pool_value),
    ],
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
  !reveal_context_structure_is_valid(tx, own_ref, context_fixture_datum(context_fixture_pool_hash))
}

test typed_context_rejects_missing_pool_output() {
  let own_ref = context_fixture_own_ref()
  let own_value = assets.from_lovelace(5_000_000)
  let pool_value = assets.from_lovelace(10_000_000)
  let tx = Transaction {
    inputs: [
      context_fixture_input(own_ref, context_fixture_own_hash, own_value),
      context_fixture_input(context_fixture_pool_ref(1), context_fixture_pool_hash, pool_value),
    ],
    reference_inputs: [],
    outputs: [context_fixture_output(context_fixture_own_hash, own_value)],
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
  !reveal_context_structure_is_valid(tx, own_ref, context_fixture_datum(context_fixture_pool_hash))
}

test typed_context_rejects_duplicate_prize_output() {
  let own_ref = context_fixture_own_ref()
  let own_value = assets.from_lovelace(5_000_000)
  let pool_value = assets.from_lovelace(10_000_000)
  let tx = Transaction {
    inputs: [
      context_fixture_input(own_ref, context_fixture_own_hash, own_value),
      context_fixture_input(context_fixture_pool_ref(1), context_fixture_pool_hash, pool_value),
    ],
    reference_inputs: [],
    outputs: [
      context_fixture_output(context_fixture_own_hash, own_value),
      context_fixture_output(context_fixture_own_hash, own_value),
      context_fixture_output(context_fixture_pool_hash, pool_value),
    ],
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
  !reveal_context_structure_is_valid(tx, own_ref, context_fixture_datum(context_fixture_pool_hash))
}

test typed_context_rejects_changed_prize_value() {
  let own_ref = context_fixture_own_ref()
  let own_value = assets.from_lovelace(5_000_000)
  let pool_value = assets.from_lovelace(10_000_000)
  let changed_value = assets.from_lovelace(5_000_001)
  let tx = Transaction {
    inputs: [
      context_fixture_input(own_ref, context_fixture_own_hash, own_value),
      context_fixture_input(context_fixture_pool_ref(1), context_fixture_pool_hash, pool_value),
    ],
    reference_inputs: [],
    outputs: [
      context_fixture_output(context_fixture_own_hash, changed_value),
      context_fixture_output(context_fixture_pool_hash, pool_value),
    ],
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
  !reveal_context_structure_is_valid(tx, own_ref, context_fixture_datum(context_fixture_pool_hash))
}

test typed_context_rejects_pool_hash_not_bound_by_datum() {
  let own_ref = context_fixture_own_ref()
  let own_value = assets.from_lovelace(5_000_000)
  let pool_value = assets.from_lovelace(10_000_000)
  let tx = Transaction {
    inputs: [
      context_fixture_input(own_ref, context_fixture_own_hash, own_value),
      context_fixture_input(context_fixture_pool_ref(1), context_fixture_pool_hash, pool_value),
    ],
    reference_inputs: [],
    outputs: [
      context_fixture_output(context_fixture_own_hash, own_value),
      context_fixture_output(context_fixture_pool_hash, pool_value),
    ],
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
  !reveal_context_structure_is_valid(tx, own_ref, context_fixture_datum(#"08"))
}

test typed_context_rejects_missing_own_input() {
  let own_ref = context_fixture_own_ref()
  let own_value = assets.from_lovelace(5_000_000)
  let pool_value = assets.from_lovelace(10_000_000)
  let tx = Transaction {
    inputs: [
      context_fixture_input(context_fixture_pool_ref(1), context_fixture_pool_hash, pool_value),
    ],
    reference_inputs: [],
    outputs: [context_fixture_output(context_fixture_pool_hash, pool_value)],
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
  !reveal_context_structure_is_valid(tx, own_ref, context_fixture_datum(context_fixture_pool_hash))
}

