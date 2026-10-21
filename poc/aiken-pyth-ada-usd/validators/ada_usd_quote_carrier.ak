/// Isolated Plutus V3 quote-carrier transition.
///
/// It binds a unique carrier singleton continuation to the ADA/USD quote
/// extracted from the Pyth-signed update in the same transaction. It is not
/// attached to production MintPolicy and cannot authorize a real PRE-RICH Issue.
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction.{OutputReference, Transaction}
use immortal/ada_usd_quote_carrier.{
  AdaUsdQuoteCarrierDatum,
  quote_carrier_transition_is_valid,
}

validator pyth_ada_usd_quote_carrier(
  pyth_policy_id: PolicyId,
  carrier_policy_id: PolicyId,
  carrier_asset_name: AssetName,
) {
  spend(
    datum_opt: Option<AdaUsdQuoteCarrierDatum>,
    _redeemer: Data,
    own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(_input_datum) = datum_opt
    quote_carrier_transition_is_valid(
      self,
      own_ref,
      pyth_policy_id,
      carrier_policy_id,
      carrier_asset_name,
    )
  }

  else(_) {
    False
  }
}
