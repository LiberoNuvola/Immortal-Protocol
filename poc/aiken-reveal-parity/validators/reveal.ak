use cardano/transaction
use immortal/reveal_transaction
use immortal/reveal_types

/// Thin Plutus V3 entrypoint. Validation logic is kept in lib so the parity
/// tests exercise the same function used by the validator.
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
        reveal_transaction.reveal_transaction_is_valid(self, own_ref, input_datum, player_secret)
      _ -> False
    }
  }

  else(_) {
    False
  }
}
