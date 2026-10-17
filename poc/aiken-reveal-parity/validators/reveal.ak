use cardano/transaction
use immortal/expire_transaction
use immortal/reveal_transaction
use immortal/reveal_types

/// Plutus V3 Prize validator entrypoint. Reveal and Expire dispatch to their
/// transition implementations; the B1PrizePool validator and economic rules are unchanged.
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
      reveal_types.Expire ->
        expire_transaction.expire_transaction_is_valid(self, own_ref, input_datum)
      _ -> False
    }
  }

  else(_) {
    False
  }
}
