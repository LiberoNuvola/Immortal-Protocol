use aiken/collection/list
use aiken/crypto.{ScriptHash}
use aiken/interval
use cardano/address.{Script}
use cardano/transaction
use immortal/reveal_context.{reveal_context_structure_is_valid}
use immortal/reveal_context_guards.{RevealPoolState}
use immortal/reveal_transition.{reveal_state_transition_is_valid}
use immortal/reveal_types

/// Canonical default prize table used by the current Haskell fixture producer.
/// This entrypoint is an isolated Plutus V3 prototype, not a deployable replacement.
const prize_table =
  immortal/reveal_rules.PrizeTable {
    tier_1: 2,
    tier_2: 5,
    tier_3: 10,
    tier_4: 200,
    tier_5: 1000,
  }

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

fn pool_state(pool: reveal_types.B1PrizePoolDatum) -> RevealPoolState {
  RevealPoolState {
    total_liquidity: pool.total_liquidity,
    pending_liabilities: pool.pending_liabilities,
    unresolved_reserve: pool.unresolved_reserve,
    unresolved_ticket_count: pool.unresolved_ticket_count,
    locked_jackpot: pool.locked_jackpot,
    jackpot_threshold: pool.jackpot_threshold,
    suspended_classes: pool.suspended_classes,
    prize_hash: pool.prize_hash,
  }
}

fn finite_upper_bound(tx: transaction.Transaction) -> Option<Int> {
  when tx.validity_range.upper_bound.bound_type is {
    interval.Finite(bound) -> Some(bound)
    _ -> None
  }
}

/// Resolves the spent Prize datum, unique continuing Prize output, and the
/// unique PrizePool input/output from the typed transaction context. It then
/// applies the canonical pure Reveal transition checks. Hashed datums are
/// resolved from the transaction datum witnesses; absent/unresolvable datums
/// fail closed. This validator remains an isolated Plutus V3 parity prototype.
pub fn reveal_transaction_is_valid(
  tx: transaction.Transaction,
  own_ref: transaction.OutputReference,
  input_datum: reveal_types.PrizeDatum,
  player_secret: ByteArray,
) -> Bool {
  when transaction.find_input(tx.inputs, own_ref) is {
    None -> False
    Some(own_input) ->
      when own_input.output.address.payment_credential is {
        Script(own_script_hash) -> {
          let pool_hash = input_datum.prize_pool_hash
          expect Some(raw_own_datum) = datum_data(tx, own_input.output)
          expect resolved_input_datum: reveal_types.PrizeDatum = raw_own_datum
          expect Some(prize_output) = only_script_output(tx.outputs, own_script_hash)
          expect Some(raw_prize_output_datum) = datum_data(tx, prize_output)
          expect output_datum: reveal_types.PrizeDatum = raw_prize_output_datum
          expect Some(pool_input) = only_script_input(tx.inputs, pool_hash)
          expect Some(raw_pool_before) = datum_data(tx, pool_input.output)
          expect pool_before_datum: reveal_types.B1PrizePoolDatum = raw_pool_before
          expect Some(pool_output) = only_script_output(tx.outputs, pool_hash)
          expect Some(raw_pool_after) = datum_data(tx, pool_output)
          expect pool_after_datum: reveal_types.B1PrizePoolDatum = raw_pool_after
          and {
            resolved_input_datum == input_datum,
            reveal_context_structure_is_valid(tx, own_ref, input_datum),
            reveal_state_transition_is_valid(
              prize_table,
              input_datum,
              output_datum,
              player_secret,
              finite_upper_bound(tx),
              pool_state(pool_before_datum),
              pool_state(pool_after_datum),
              own_script_hash,
            ),
          }
        }
        _ -> False
      }
  }
}

validator pre_rich_reveal {
  spend(
    datum_opt: Option<reveal_types.PrizeDatum>,
    action: reveal_types.PrizeAction,
    own_ref: transaction.OutputReference,
    self: transaction.Transaction,
  ) {
    expect Some(input_datum) = datum_opt
    when action is {
      reveal_types.Reveal(player_secret) ->
        reveal_transaction_is_valid(self, own_ref, input_datum, player_secret)
      _ -> False
    }
  }

  else(_) {
    False
  }
}
