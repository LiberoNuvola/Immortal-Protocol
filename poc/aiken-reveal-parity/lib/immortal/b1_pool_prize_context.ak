/// Authenticated Prize-context resolvers for the B1 PrizePool migration candidate.
///
/// These helpers only resolve a unique Prize input/output at the configured
/// Prize script hash and decode its datum. Callers must still enforce each
/// action's status, identity, mint/burn, signatures, expiry, oracle and payout
/// rules. This module is not a validator entry point.
use aiken/collection/list
use aiken/crypto.{ScriptHash}
use cardano/assets.{AssetName, PolicyId}
use cardano/assets
use cardano/address.{Script, from_script}
use cardano/transaction
use immortal/reveal_types.{BeaconPending, BeaconTarget, Pending, PrizeDatum}

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
