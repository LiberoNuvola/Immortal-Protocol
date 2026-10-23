/// Authenticated Prize-context resolvers for the B1 PrizePool migration candidate.
///
/// These helpers only resolve a unique Prize input/output at the configured
/// Prize script hash and decode its datum. Callers must still enforce each
/// action's status, identity, mint/burn, signatures, expiry, oracle and payout
/// rules. This module is not a validator entry point.
use aiken/collection/list
use aiken/crypto.{ScriptHash}
use cardano/address.{Script}
use cardano/transaction
use immortal/reveal_types.{PrizeDatum}

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
