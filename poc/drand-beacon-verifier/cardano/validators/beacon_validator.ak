use cardano/transaction.{OutputReference, Transaction}
use immortal/drand-beacon-verifier/drand.{verify_quicknet_signature}

/// Isolated validator prototype: a spend succeeds only when the redeemer's
/// pinned Quicknet round/signature/public-key tuple verifies cryptographically.
/// This local record intentionally mirrors the public BeaconWitness wire shape
/// in lib/drand.ak; it avoids the Aiken v1.1.23 imported-record validator failure.
/// The tuple's field order and primitive types are unchanged.
pub type BeaconWitness {
  round: Int,
  signature: ByteArray,
  public_key: ByteArray,
}

validator drand_beacon_verifier {
  spend(
    _datum: Option<Data>,
    witness: BeaconWitness,
    _own_ref: OutputReference,
    _context: Transaction,
  ) {
    verify_quicknet_signature(
      witness.round,
      witness.signature,
      witness.public_key,
    )
  }

  else(_) {
    fail
  }
}
