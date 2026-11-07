use aiken/collection/list
use aiken/crypto.{ScriptHash}
use aiken/interval
use cardano/address.{Script}
use cardano/transaction
use immortal/reveal_types.{BeaconPending, BeaconReady, Pending, Revealed, PrizeDatum, PrizeStatus, B1PrizePoolDatum}

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

fn own_datum_matches(
  tx: transaction.Transaction,
  own_ref: transaction.OutputReference,
  expected: PrizeDatum,
) -> Bool {
  when transaction.find_input(tx.inputs, own_ref) is {
    Some(input) ->
      when datum_data(tx, input.output) is {
        Some(raw) -> {
          expect decoded: PrizeDatum = raw
          decoded == expected
        }
        None -> False
      }
    None -> False
  }
}

/// Mirrors the two accounting branches of PrizeValidator.validateExpire:
/// Pending releases one ticket-price reserve/count; Revealed releases only the
/// frozen unpaid payout liability, leaving reserve/count unchanged.
fn expiry_pool_delta_is_valid(
  status: PrizeStatus,
  price_usdm: Int,
  prize_amount: Int,
  pending_before: Int,
  pending_after: Int,
  reserve_before: Int,
  reserve_after: Int,
  count_before: Int,
  count_after: Int,
) -> Bool {
  let pending_expiry =
    status == Pending
      && reserve_before >= price_usdm
      && count_before > 0
      && pending_after == pending_before
      && reserve_after == reserve_before - price_usdm
      && count_after == count_before - 1
  let revealed_expiry =
    status == Revealed
      && prize_amount >= 0
      && pending_before >= prize_amount
      && pending_after == pending_before - prize_amount
      && reserve_after == reserve_before
      && count_after == count_before
  pending_expiry || revealed_expiry
}

fn expiry_status_is_valid(input_datum: PrizeDatum) -> Bool {
  when input_datum.status is {
    Pending ->
      (input_datum.beacon_status == BeaconPending
        || input_datum.beacon_status == BeaconReady)
        && input_datum.prize_amount == 0
    Revealed ->
      input_datum.beacon_status == BeaconReady
        && input_datum.prize_amount >= 0
    _ -> False
  }
}

test pending_expiry_releases_exact_reserve_and_count() {
  expiry_pool_delta_is_valid(Pending, 100, 0, 40, 40, 300, 200, 3, 2)
}

test pending_expiry_rejects_non_exact_reserve_release() {
  !expiry_pool_delta_is_valid(Pending, 100, 0, 40, 40, 300, 199, 3, 2)
}

test revealed_loss_expiry_preserves_pool_accounting() {
  expiry_pool_delta_is_valid(Revealed, 100, 0, 40, 40, 300, 300, 2, 2)
}

test revealed_win_expiry_releases_exact_unpaid_liability() {
  expiry_pool_delta_is_valid(Revealed, 100, 200, 400, 200, 300, 300, 2, 2)
}

test revealed_win_expiry_rejects_wrong_liability_release() {
  !expiry_pool_delta_is_valid(Revealed, 100, 200, 400, 199, 300, 300, 2, 2)
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
        own_datum_matches(tx, own_ref, input_datum),
        list.length(prize_inputs) == 1,
        list.length(prize_outputs) == 0,
        list.length(pool_inputs) == 1,
        list.length(pool_outputs) == 1,
        input_datum.status == Pending || input_datum.status == Revealed,
        expiry_status_is_valid(input_datum),
        input_datum.price_usdm > 0,
        when finite_lower_bound(tx) is {
          Some(lower) -> lower >= input_datum.expires_at
          None -> False
        },
        when only_script_input(tx.inputs, pool_hash) is {
          Some(pool_input) ->
            when only_script_output(tx.outputs, pool_hash) is {
              Some(pool_output) ->
                when datum_data(tx, pool_input.output) is {
                  Some(raw_before) -> {
                    expect before: B1PrizePoolDatum = raw_before
                    when datum_data(tx, pool_output) is {
                      Some(raw_after) -> {
                        expect after: B1PrizePoolDatum = raw_after
                        and {
                          before.prize_hash == prize_hash,
                          after.prize_hash == prize_hash,
                          after.prize_hash == before.prize_hash,
                          after.total_liquidity == before.total_liquidity,
                          after.pending_liabilities == before.pending_liabilities,
                          expiry_pool_delta_is_valid(
                            input_datum.status,
                            input_datum.price_usdm,
                            input_datum.prize_amount,
                            before.pending_liabilities,
                            after.pending_liabilities,
                            before.unresolved_reserve,
                            after.unresolved_reserve,
                            before.unresolved_ticket_count,
                            after.unresolved_ticket_count,
                          ),
                          after.locked_jackpot == before.locked_jackpot,
                          after.jackpot_threshold == before.jackpot_threshold,
                          after.suspended_classes == before.suspended_classes,
                        }
                      }
                      None -> False
                    }
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
