use aiken/collection/list
use aiken/crypto.{ScriptHash}
use aiken/interval
use cardano/address.{Script}
use cardano/transaction
use immortal/reveal_types.{BeaconPending, BeaconReady, Pending, PrizeDatum, B1PrizePoolDatum}

/// Resolves inline or transaction-witness datums without accepting missing data.
fn datum_data(tx: transaction.Transaction, output: transaction.Output) -> Option<Data> {
  when output.datum is {
    transaction.InlineDatum(data) -> Some(data)
    transaction.DatumHash(hash) -> transaction.find_datum(tx.outputs, tx.datums, hash)
    transaction.NoDatum -> None
  }
}

fn only_script_input(
  inputs: List<transaction.Input>,
  script_hash: ScriptHash,
) -> Option<transaction.Input> {
  when list.filter(
    inputs,
    fn(input) { input.output.address.payment_credential == Script(script_hash) },
  ) is {
    [input] -> Some(input)
    _ -> None
  }
}

fn only_script_output(
  outputs: List<transaction.Output>,
  script_hash: ScriptHash,
) -> Option<transaction.Output> {
  when list.filter(
    outputs,
    fn(output) { output.address.payment_credential == Script(script_hash) },
  ) is {
    [output] -> Some(output)
    _ -> None
  }
}

fn finite_lower_bound(tx: transaction.Transaction) -> Option<Int> {
  when tx.validity_range.lower_bound.bound_type is {
    interval.Finite(bound) -> Some(bound)
    _ -> None
  }
}

/// Implements the existing PrizeValidator.validateExpire state transition.
/// It consumes the Prize datum (no continuing Prize output) and releases exactly
/// one ticket price from unresolved reserve and one unresolved ticket count.
/// All other pool datum fields remain unchanged. No economic rule is introduced.
pub fn expire_transaction_is_valid(
  tx: transaction.Transaction,
  own_ref: transaction.OutputReference,
  input_datum: PrizeDatum,
) -> Bool {
  let own_hash = when transaction.find_input(tx.inputs, own_ref) is {
    Some(input) -> when input.output.address.payment_credential is {
      Script(hash) -> Some(hash)
      _ -> None
    }
    None -> None
  }
  when own_hash is {
    None -> False
    Some(prize_hash) -> {
      let pool_hash = input_datum.prize_pool_hash
      let prize_inputs = list.filter(tx.inputs, fn(input) {
        input.output.address.payment_credential == Script(prize_hash)
      })
      let prize_outputs = list.filter(tx.outputs, fn(output) {
        output.address.payment_credential == Script(prize_hash)
      })
      let pool_inputs = list.filter(tx.inputs, fn(input) {
        input.output.address.payment_credential == Script(pool_hash)
      })
      let pool_outputs = list.filter(tx.outputs, fn(output) {
        output.address.payment_credential == Script(pool_hash)
      })
      and {
        list.length(prize_inputs) == 1,
        list.length(prize_outputs) == 0,
        list.length(pool_inputs) == 1,
        list.length(pool_outputs) == 1,
        input_datum.status == Pending,
        input_datum.beacon_status == BeaconPending || input_datum.beacon_status == BeaconReady,
        input_datum.price_usdm > 0,
        input_datum.prize_amount == 0,
        when finite_lower_bound(tx) is {
          Some(lower) -> lower >= input_datum.expires_at
          None -> False
        },
        when only_script_input(tx.inputs, pool_hash) is {
          Some(pool_input) ->
            when only_script_output(tx.outputs, pool_hash) is {
              Some(pool_output) ->
                when datum_data(tx, pool_input.output) is {
                  Some(raw_before) ->
                    when raw_before is {
                      before: B1PrizePoolDatum -> when datum_data(tx, pool_output) is {
                        Some(raw_after) -> when raw_after is {
                          after: B1PrizePoolDatum ->
                            and {
                              before.prize_hash == prize_hash,
                              after.prize_hash == prize_hash,
                              after.prize_hash == before.prize_hash,
                              after.total_liquidity == before.total_liquidity,
                              after.pending_liabilities == before.pending_liabilities,
                              before.unresolved_reserve >= input_datum.price_usdm,
                              after.unresolved_reserve == before.unresolved_reserve - input_datum.price_usdm,
                              before.unresolved_ticket_count > 0,
                              after.unresolved_ticket_count == before.unresolved_ticket_count - 1,
                              after.locked_jackpot == before.locked_jackpot,
                              after.jackpot_threshold == before.jackpot_threshold,
                              after.suspended_classes == before.suspended_classes,
                        }
                      }
                      None -> False
                    }
                  None -> False
                }
              None -> False
            }
          None -> False
        },
      }
    }
  }
}
