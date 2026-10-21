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

/// Captured genuine Quicknet round-42 vector, independently verified by the
/// off-chain drand-client@1.4.2 profile. These tests exercise the actual Plutus
/// BLS12-381 pairing verifier, not only hash-to-curve determinism.
test quicknet_round_42_real_signature_verifies() {
  verify_quicknet_signature(
    42,
    #"95a9f9f5b231b7714de1553105d8ffdf3dcda24cfdb1e689319bccf79a9c8ce430a91b811fbfaf763900bc998b5d686a",
    #"83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a",
  )
}

test quicknet_round_42_signature_rejected_for_round_43() {
  verify_quicknet_signature(
    43,
    #"95a9f9f5b231b7714de1553105d8ffdf3dcda24cfdb1e689319bccf79a9c8ce430a91b811fbfaf763900bc998b5d686a",
    #"83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76eae8991ef5ece45a",
  ) == False
}
