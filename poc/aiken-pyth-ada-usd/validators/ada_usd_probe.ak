/// Plutus V3 probe consumer for a Pyth-signed ADA/USD update.
///
/// This validator is deliberately isolated from PRE-RICH, MintPolicy and the
/// live Oracle State. A successful spend only proves that the caller's datum
/// matches the raw ADA/USD quote found via pyth.get_updates in this transaction.
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}
use immortal/ada_usd_probe.{AdaUsdBinding, binding_matches, verified_ada_usd_from_transaction}

validator pyth_ada_usd_probe(pyth_policy_id: PolicyId) {
  spend(
    datum_opt: Option<AdaUsdBinding>,
    _redeemer: Data,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(expected) = datum_opt
    when verified_ada_usd_from_transaction(pyth_policy_id, self) is {
      Some(actual) -> binding_matches(expected, actual)
      None -> False
    }
  }

  else(_) {
    False
  }
}
