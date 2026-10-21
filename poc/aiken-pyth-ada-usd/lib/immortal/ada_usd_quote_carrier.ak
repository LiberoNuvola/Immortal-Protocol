/// Isolated quote-carrier transition for binding a Pyth ADA/USD update.
///
/// This is a feasibility probe only. It is not wired to the production MintPolicy.
/// A valid transition preserves the carrier UTxO's identity/value and writes
/// exactly the raw ADA/USD tuple extracted by the Pyth transaction update.
use aiken/collection/list
use aiken/crypto.{ScriptHash}
use cardano/address.{Script}
use cardano/assets as assets
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction
use cardano/transaction.{Input, Output, OutputReference, Transaction}
use immortal/ada_usd_probe.{
  AdaUsdBinding,
  binding_matches,
  verified_ada_usd_from_transaction,
}

pub type AdaUsdQuoteCarrierDatum {
  AdaUsdQuoteCarrierDatum {
    quote: Option<AdaUsdBinding>,
  }
}

fn datum_data(tx: Transaction, output: Output) -> Option<Data> {
  when output.datum is {
    transaction.InlineDatum(data) -> Some(data)
    transaction.DatumHash(hash) -> transaction.find_datum(tx.outputs, tx.datums, hash)
    transaction.NoDatum -> None
  }
}

fn decode_carrier_datum(tx: Transaction, output: Output) -> Option<AdaUsdQuoteCarrierDatum> {
  when datum_data(tx, output) is {
    Some(raw) ->
      if raw is AdaUsdQuoteCarrierDatum {
        Some(raw)
      } else {
        None
      }
    None -> None
  }
}

fn unique_script_input(
  inputs: List<Input>,
  script_hash: ScriptHash,
) -> Option<Input> {
  when list.filter(
    inputs,
    fn(input) { input.output.address.payment_credential == Script(script_hash) },
  ) is {
    [input] -> Some(input)
    _ -> None
  }
}

fn unique_script_output(
  outputs: List<Output>,
  script_hash: ScriptHash,
) -> Option<Output> {
  when list.filter(
    outputs,
    fn(output) { output.address.payment_credential == Script(script_hash) },
  ) is {
    [output] -> Some(output)
    _ -> None
  }
}

fn singleton_input_count(
  inputs: List<Input>,
  policy: PolicyId,
  name: AssetName,
) -> Int {
  list.length(
    list.filter(
      inputs,
      fn(input) { assets.quantity_of(input.output.value, policy, name) == 1 },
    ),
  )
}

fn singleton_output_count(
  outputs: List<Output>,
  policy: PolicyId,
  name: AssetName,
) -> Int {
  list.length(
    list.filter(
      outputs,
      fn(output) { assets.quantity_of(output.value, policy, name) == 1 },
    ),
  )
}

/// The carrier state may start with no quote or the preceding quote; each
/// transition must replace it with the tuple extracted from the current Pyth
/// update. Replay within the accepted freshness window remains allowed, just
/// as in the documented upstream Pyth model. This probe introduces no nonce
/// or new economics.
pub fn quote_carrier_transition_is_valid(
  tx: Transaction,
  own_ref: OutputReference,
  pyth_policy_id: PolicyId,
  carrier_policy_id: PolicyId,
  carrier_asset_name: AssetName,
) -> Bool {
  when transaction.find_input(tx.inputs, own_ref) is {
    None -> False
    Some(own_input) ->
      when own_input.output.address.payment_credential is {
        Script(own_hash) -> {
          let script_inputs = list.filter(
            tx.inputs,
            fn(input) { input.output.address.payment_credential == Script(own_hash) },
          )
          let script_outputs = list.filter(
            tx.outputs,
            fn(output) { output.address.payment_credential == Script(own_hash) },
          )

          and {
            // This transition must spend/re-emit the one carrier singleton.
            list.length(script_inputs) == 1,
            list.length(script_outputs) == 1,
            singleton_input_count(tx.inputs, carrier_policy_id, carrier_asset_name) == 1,
            singleton_output_count(tx.outputs, carrier_policy_id, carrier_asset_name) == 1,
            when unique_script_input(tx.inputs, own_hash) is {
              Some(carrier_input) ->
                when unique_script_output(tx.outputs, own_hash) is {
                  Some(carrier_output) ->
                    and {
                      carrier_output.address == carrier_input.output.address,
                      carrier_output.value == carrier_input.output.value,
                      when decode_carrier_datum(tx, carrier_input.output) is {
                        Some(_before) -> True
                        None -> False
                      },
                      when decode_carrier_datum(tx, carrier_output) is {
                        Some(after) ->
                          when after.quote is {
                            None -> False
                            Some(expected) ->
                              when verified_ada_usd_from_transaction(pyth_policy_id, tx) is {
                                Some(actual) -> binding_matches(expected, actual)
                                None -> False
                              }
                          }
                        None -> False
                      },
                    }
                  None -> False
                }
              None -> False
            },
          }
        }
        _ -> False
      }
  }
}
