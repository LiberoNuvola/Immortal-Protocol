use aiken/collection/list
use aiken/crypto.{ScriptHash}
use cardano/address.{Script, VerificationKey}
use cardano/transaction
use cardano/transaction.{Input, Output, OutputReference, Transaction}

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

/// Structural Reveal guard over a real Aiken Cardano Transaction context.
///
/// This is intentionally NOT a complete validator: it does not decode PrizeDatum,
/// B1PrizePoolDatum or the Reveal redeemer, nor verify commitments, symbols, payout,
/// validity bounds, or pool accounting deltas. Those must be wired before parity
/// or deployability can be claimed.
pub fn reveal_context_structure_is_valid(
  tx: Transaction,
  own_ref: OutputReference,
  expected_pool_hash: ScriptHash,
) -> Bool {
  when tx.inputs |> list.find(fn(input) { input.output_reference == own_ref }) is {
    None -> False
    Some(own_input) ->
      when own_input.output.address.payment_credential is {
        Script(own_script_hash) ->
          and {
            // The spending input and continuing Prize output must be unambiguous.
            count_script_inputs(tx.inputs, own_script_hash) == 1,
            count_script_outputs(tx.outputs, own_script_hash) == 1,
            // Use Cardano's typed Value equality, not serialized fixture bytes.
            when unique_script_output(tx.outputs, own_script_hash) is {
              Some(continuing) -> continuing.value == own_input.output.value
              None -> False
            },
            // PrizePool must be spent and continued exactly once.
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
    #"",
  )
}
