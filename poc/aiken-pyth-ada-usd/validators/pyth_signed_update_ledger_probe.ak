/// Native Cardano ledger probe for an authentic Pyth Lazer ADA/USD update.
///
/// This validator is deliberately not connected to PRE-RICH, MintPolicy,
/// Issue, the quote carrier, or production economics. A spend of an output at
/// this address requires the Pyth zero-withdrawal and this consumer in the
/// same transaction. Pyth's deployed withdrawal script validates the signed
/// update; this consumer independently enforces feed selection and freshness.
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}
use aiken/interval
use pyth
use immortal/ada_usd_probe.{select_fresh_ada_usd}

validator pyth_signed_update_ledger_probe(pyth_policy_id: PolicyId) {
  spend(
    datum_opt: Option<Data>,
    _redeemer: Data,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    // The runner intentionally funds the probe address with no datum.
    expect None = datum_opt

    when pyth.get_updates(pyth_policy_id, self) is {
      [update] ->
        when self.validity_range.upper_bound.bound_type is {
          interval.Finite(upper_bound_ms) ->
            when select_fresh_ada_usd(update, upper_bound_ms) is {
              Some(evidence) -> evidence.price > 0
              None -> False
            }
          _ -> False
        }
      _ -> False
    }
  }

  else(_) {
    False
  }
}
