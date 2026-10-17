use cardano/transaction

/// Test-only PrizePool spend stub for exercising the isolated Aiken Reveal
/// validator against the native Yaci ledger. This is not a production pool
/// validator and must never be used in a deployable topology.
validator pool_stub {
  spend(
    _datum: Option<Data>,
    _redeemer: Data,
    _own_ref: transaction.OutputReference,
    _self: transaction.Transaction,
  ) {
    True
  }

  else(_) {
    False
  }
}
