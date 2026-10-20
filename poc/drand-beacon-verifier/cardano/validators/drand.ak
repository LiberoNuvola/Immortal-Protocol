use cardano/transaction.{OutputReference, Transaction}
use immortal/drand-beacon-verifier/drand.{BeaconWitness, verify_quicknet_signature}

/// Isolated validator prototype: a spend succeeds only when the redeemer's
/// pinned Quicknet round/signature/public-key tuple verifies cryptographically.
/// This validator is not integrated into PRE-RICH and has no production datum
/// or round-selection policy.
validator drand_beacon_verifier {
  spend(
    _datum: Option<Data>,
    witness: BeaconWitness,
    _own_ref: OutputReference,
    _context: Transaction,
  ) {
    expect True =
      verify_quicknet_signature(
        witness.round,
        witness.signature,
        witness.public_key,
      )
    ()
  }
}
