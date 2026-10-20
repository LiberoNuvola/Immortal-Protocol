use aiken/builtin
use aiken/crypto/bls12_381/g2

/// drand Quicknet's BLS signature hash-to-curve domain separation tag.
/// This is scheme-specific and must not be replaced with the generic RFC9380 DST.
const quicknet_dst = "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_"

/// Minimal witness shape used only by the isolated validator prototype.
pub type BeaconWitness {
  round: Int,
  signature: ByteArray,
  public_key: ByteArray,
}

/// Verify a Quicknet unchained beacon signature over SHA-256(round_be_u64).
///
/// Signature is a compressed G1 point (48 bytes); public_key is a compressed
/// G2 point (96 bytes). Invalid point encodings fail closed through the Plutus
/// uncompress builtins. This function is an isolated PoC and is not wired into
/// the PRE-RICH Beacon registry or any production validator.
pub fn verify_quicknet_signature(
  round: Int,
  signature: ByteArray,
  public_key: ByteArray,
) -> Bool {
  if round < 1 || round > 18446744073709551615 {
    False
  } else {
    let round_be_u64 = builtin.integer_to_bytearray(True, 8, round)
    let message = builtin.sha2_256(round_be_u64)
    let hash_point = builtin.bls12_381_g1_hash_to_group(message, quicknet_dst)
    let signature_point = builtin.bls12_381_g1_uncompress(signature)
    let public_key_point = builtin.bls12_381_g2_uncompress(public_key)
    let signature_pairing =
      builtin.bls12_381_miller_loop(signature_point, g2.generator)
    let message_pairing =
      builtin.bls12_381_miller_loop(hash_point, public_key_point)

    builtin.bls12_381_final_verify(signature_pairing, message_pairing)
  }
}

test round_42_uses_big_endian_u64() {
  builtin.integer_to_bytearray(True, 8, 42) == #"000000000000002a"
}

test quicknet_hash_to_curve_is_deterministic() {
  let round_bytes = builtin.integer_to_bytearray(True, 8, 42)
  let message = builtin.sha2_256(round_bytes)
  let point_a = builtin.bls12_381_g1_hash_to_group(message, quicknet_dst)
  let point_b = builtin.bls12_381_g1_hash_to_group(message, quicknet_dst)

  builtin.bls12_381_g1_equal(point_a, point_b)
}
