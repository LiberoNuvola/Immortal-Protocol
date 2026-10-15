use aiken/collection/list
use aiken/crypto.{ScriptHash}
use cardano/address.{Script, VerificationKey}
use cardano/transaction
use cardano/transaction.{Input, Output, OutputReference, Transaction}
use immortal/reveal_types.{PrizeDatum}

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
      status: immortal/reveal_types.Pending,
      result: #"",
      prize_tier: 0,
      beacon_target: immortal/reveal_types.BeaconTarget {
        network_id: 0,
        round: 0,
        mainchain_ref: #"",
        version: #"",
      },
      beacon_status: immortal/reveal_types.BeaconPending,
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
