/// Transaction-context global guards for the B1 PrizePool migration candidate.
///
/// This module deliberately does not implement any action branch. It captures
/// the shared Haskell B1PrizePool guards so they can be wired to the five action
/// predicates only after the same-context tests pass. It is not a deployable
/// validator and does not replace the canonical Haskell reference.
use aiken/collection/list
use aiken/crypto.{ScriptHash}
use cardano/address.{Script}
use cardano/assets.{AssetName, PolicyId}
use cardano/assets
use cardano/transaction
use immortal/b1_pool_solvency.{b1_pool_solvency_is_valid}
use immortal/reveal_types.{B1PrizePoolDatum}

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

fn only_script_input(
  inputs: List<transaction.Input>,
  script_hash: ScriptHash,
) -> Option<transaction.Input> {
  when list.filter(inputs, fn(input) {
    input.output.address.payment_credential == Script(script_hash)
  }) is {
    [input] -> Some(input)
    _ -> None
  }
}

fn only_script_output(
  outputs: List<transaction.Output>,
  script_hash: ScriptHash,
) -> Option<transaction.Output> {
  when list.filter(outputs, fn(output) {
    output.address.payment_credential == Script(script_hash)
  }) is {
    [output] -> Some(output)
    _ -> None
  }
}

fn datum_data(tx: transaction.Transaction, output: transaction.Output) -> Option<Data> {
  when output.datum is {
    transaction.InlineDatum(data) -> Some(data)
    transaction.DatumHash(hash) -> transaction.find_datum(tx.outputs, tx.datums, hash)
    transaction.NoDatum -> None
  }
}

fn decode_pool_datum(
  tx: transaction.Transaction,
  output: transaction.Output,
) -> Option<B1PrizePoolDatum> {
  when datum_data(tx, output) is {
    Some(raw) ->
      if raw is B1PrizePoolDatum {
        Some(raw)
      } else {
        None
      }
    None -> None
  }
}

fn authority_amount_in_inputs(
  inputs: List<transaction.Input>,
  policy: PolicyId,
  name: AssetName,
) -> Int {
  when inputs is {
    [] -> 0
    [input, ..rest] ->
      assets.quantity_of(input.output.value, policy, name)
        + authority_amount_in_inputs(rest, policy, name)
  }
}

fn authority_amount_in_outputs(
  outputs: List<transaction.Output>,
  policy: PolicyId,
  name: AssetName,
) -> Int {
  when outputs is {
    [] -> 0
    [output, ..rest] ->
      assets.quantity_of(output.value, policy, name)
        + authority_amount_in_outputs(rest, policy, name)
  }
}

/// Pure form of the Haskell singletonPoolTokenValid invariant.
pub fn pool_authority_singleton_amounts_are_valid(
  input_total: Int,
  output_total: Int,
  own_input_amount: Int,
  own_output_amount: Int,
) -> Bool {
  input_total == 1
    && output_total == 1
    && own_input_amount == 1
    && own_output_amount == 1
}

test pool_authority_singleton_accepts_exact_own_input_and_output() {
  pool_authority_singleton_amounts_are_valid(1, 1, 1, 1)
}

test pool_authority_singleton_rejects_duplicate_input_authority() {
  !pool_authority_singleton_amounts_are_valid(2, 1, 1, 1)
}

test pool_authority_singleton_rejects_duplicate_output_authority() {
  !pool_authority_singleton_amounts_are_valid(1, 2, 1, 1)
}

test pool_authority_singleton_rejects_authority_outside_own_pool_input() {
  !pool_authority_singleton_amounts_are_valid(1, 1, 0, 1)
}

test pool_authority_singleton_rejects_authority_outside_own_pool_output() {
  !pool_authority_singleton_amounts_are_valid(1, 1, 1, 0)
}

/// Mirrors the shared pre-state solvency, unique Pool input, unique continuing
/// Pool output with decodable datum, and authority-NFT guards from B1PrizePool.hs.
/// Action-specific rules and physical/oracle value deltas remain out of scope.
pub fn pool_global_context_is_valid(
  tx: transaction.Transaction,
  own_ref: transaction.OutputReference,
  pool_hash: ScriptHash,
  pool_policy: PolicyId,
  pool_name: AssetName,
  before: B1PrizePoolDatum,
) -> Bool {
  when transaction.find_input(tx.inputs, own_ref) is {
    None -> False
    Some(own_input) ->
      if
        own_input.output.address.payment_credential != Script(pool_hash)
          || count_script_inputs(tx.inputs, pool_hash) != 1
          || count_script_outputs(tx.outputs, pool_hash) != 1
          || !b1_pool_solvency_is_valid(before)
      {
        False
      } else {
        when only_script_input(tx.inputs, pool_hash) is {
          None -> False
          Some(pool_input) ->
            when decode_pool_datum(tx, pool_input.output) is {
              None -> False
              Some(actual_before) ->
                if actual_before != before {
                  False
                } else {
                  when only_script_output(tx.outputs, pool_hash) is {
                    None -> False
                    Some(pool_output) ->
                      when decode_pool_datum(tx, pool_output) is {
                        None -> False
                        Some(after) ->
                          pool_authority_singleton_amounts_are_valid(
                            authority_amount_in_inputs(tx.inputs, pool_policy, pool_name),
                            authority_amount_in_outputs(tx.outputs, pool_policy, pool_name),
                            assets.quantity_of(pool_input.output.value, pool_policy, pool_name),
                            assets.quantity_of(pool_output.value, pool_policy, pool_name),
                          )
                            && b1_pool_solvency_is_valid(after)
                      }
                  }
                }
            }
        }
      }
  }
}


// Synthetic transaction-context fixtures. These prove the guard against Aiken's
// typed transaction model; they are not serialized ledger transactions.
use cardano/address.{from_script}

const context_test_pool_hash: ScriptHash = #"09"
const context_test_other_hash: ScriptHash = #"08"
const context_test_authority_policy: PolicyId = #"0a"
const context_test_authority_name: AssetName = #"01"

fn context_test_datum() -> B1PrizePoolDatum {
  B1PrizePoolDatum {
    total_liquidity: 600_000,
    pending_liabilities: 12_500,
    unresolved_reserve: 1_000,
    unresolved_ticket_count: 2,
    locked_jackpot: 500,
    jackpot_threshold: 5_000,
    suspended_classes: 0,
    prize_hash: #"001122",
  }
}

fn context_test_value() -> assets.Value {
  assets.from_lovelace(10_000_000)
    |> assets.add(context_test_authority_policy, context_test_authority_name, 1)
}

fn context_test_output(
  hash: ScriptHash,
  value: assets.Value,
  datum: transaction.Datum,
) -> transaction.Output {
  transaction.Output {
    address: from_script(hash),
    value,
    datum,
    reference_script: None,
  }
}

fn context_test_input(
  reference: transaction.OutputReference,
  hash: ScriptHash,
  value: assets.Value,
  datum: transaction.Datum,
) -> transaction.Input {
  transaction.Input {
    output_reference: reference,
    output: context_test_output(hash, value, datum),
  }
}

fn context_test_ref(index: Int) -> transaction.OutputReference {
  transaction.OutputReference {
    transaction_id: transaction.placeholder.id,
    output_index: index,
  }
}

fn context_test_tx(
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

test pool_context_accepts_unique_pool_and_authority_nft() {
  let datum = context_test_datum()
  let value = context_test_value()
  let own_ref = context_test_ref(0)
  let tx = context_test_tx(
    [context_test_input(own_ref, context_test_pool_hash, value, transaction.InlineDatum(datum))],
    [context_test_output(context_test_pool_hash, value, transaction.InlineDatum(datum))],
  )
  pool_global_context_is_valid(
    tx,
    own_ref,
    context_test_pool_hash,
    context_test_authority_policy,
    context_test_authority_name,
    datum,
  )
}

test pool_context_rejects_missing_continuing_output() {
  let datum = context_test_datum()
  let value = context_test_value()
  let own_ref = context_test_ref(0)
  let tx = context_test_tx(
    [context_test_input(own_ref, context_test_pool_hash, value, transaction.InlineDatum(datum))],
    [],
  )
  !pool_global_context_is_valid(tx, own_ref, context_test_pool_hash, context_test_authority_policy, context_test_authority_name, datum)
}

test pool_context_rejects_duplicate_pool_input() {
  let datum = context_test_datum()
  let value = context_test_value()
  let own_ref = context_test_ref(0)
  let tx = context_test_tx(
    [
      context_test_input(own_ref, context_test_pool_hash, value, transaction.InlineDatum(datum)),
      context_test_input(context_test_ref(1), context_test_pool_hash, value, transaction.InlineDatum(datum)),
    ],
    [context_test_output(context_test_pool_hash, value, transaction.InlineDatum(datum))],
  )
  !pool_global_context_is_valid(tx, own_ref, context_test_pool_hash, context_test_authority_policy, context_test_authority_name, datum)
}

test pool_context_rejects_missing_input_datum() {
  let datum = context_test_datum()
  let value = context_test_value()
  let own_ref = context_test_ref(0)
  let tx = context_test_tx(
    [context_test_input(own_ref, context_test_pool_hash, value, transaction.NoDatum)],
    [context_test_output(context_test_pool_hash, value, transaction.InlineDatum(datum))],
  )
  !pool_global_context_is_valid(tx, own_ref, context_test_pool_hash, context_test_authority_policy, context_test_authority_name, datum)
}

test pool_context_rejects_datum_argument_not_matching_input() {
  let actual = context_test_datum()
  let altered = B1PrizePoolDatum { ..actual, total_liquidity: 600_001 }
  let value = context_test_value()
  let own_ref = context_test_ref(0)
  let tx = context_test_tx(
    [context_test_input(own_ref, context_test_pool_hash, value, transaction.InlineDatum(actual))],
    [context_test_output(context_test_pool_hash, value, transaction.InlineDatum(actual))],
  )
  !pool_global_context_is_valid(tx, own_ref, context_test_pool_hash, context_test_authority_policy, context_test_authority_name, altered)
}

test pool_context_rejects_duplicate_authority_nft_outside_pool_output() {
  let datum = context_test_datum()
  let value = context_test_value()
  let own_ref = context_test_ref(0)
  let extra = context_test_output(context_test_other_hash, value, transaction.NoDatum)
  let tx = context_test_tx(
    [context_test_input(own_ref, context_test_pool_hash, value, transaction.InlineDatum(datum))],
    [
      context_test_output(context_test_pool_hash, value, transaction.InlineDatum(datum)),
      extra,
    ],
  )
  !pool_global_context_is_valid(tx, own_ref, context_test_pool_hash, context_test_authority_policy, context_test_authority_name, datum)
}

test pool_context_rejects_authority_nft_not_preserved_in_pool_output() {
  let datum = context_test_datum()
  let value = context_test_value()
  let no_authority = assets.from_lovelace(10_000_000)
  let own_ref = context_test_ref(0)
  let tx = context_test_tx(
    [context_test_input(own_ref, context_test_pool_hash, value, transaction.InlineDatum(datum))],
    [context_test_output(context_test_pool_hash, no_authority, transaction.InlineDatum(datum))],
  )
  !pool_global_context_is_valid(tx, own_ref, context_test_pool_hash, context_test_authority_policy, context_test_authority_name, datum)
}
