use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction
use immortal/claim_transaction
use immortal/expire_transaction
use immortal/reveal_transaction
use immortal/reveal_types

/// Parameterized Plutus V3 Prize-validator prototype.
///
/// Oracle identity and publisher parameters are consumed only by Claim. Reveal
/// and Expire continue to use their existing transition predicates unchanged.
/// This prototype is not yet deployed or wired into the production topology.
validator pre_rich_reveal(
  oracle_state_policy: PolicyId,
  oracle_state_name: AssetName,
  oracle_publisher: VerificationKeyHash,
) {
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
      reveal_types.Claim ->
        claim_transaction.claim_transaction_is_valid(
          self,
          own_ref,
          input_datum,
          oracle_state_policy,
          oracle_state_name,
          oracle_publisher,
        )
      _ -> False
    }
  }

  else(_) {
    False
  }
}
