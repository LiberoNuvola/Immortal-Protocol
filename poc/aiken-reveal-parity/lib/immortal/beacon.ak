use aiken/crypto
use aiken/primitive/bytearray

const beacon_domain: ByteArray = "PRE-RICH/BEACON/V1"
const player_domain: ByteArray = "PRE-RICH/PLAYER/V1"
const game_domain: ByteArray = "PRE-RICH/GAME/V1"
const symbols_domain: ByteArray = "PRE-RICH/SYMBOLS/V1"
const ticket_domain: ByteArray = "PRE-RICH/TICKET/V2"

pub type BeaconTarget {
  BeaconTarget {
    network_id: Int,
    round_id: Int,
    mainchain_ref: ByteArray,
    version: ByteArray,
  }
}

/// Exact decimal ASCII encoding used by Haskell Beacon.integerToBytes.
pub fn integer_to_bytes(n: Int) -> ByteArray {
  if n < 0 {
    "0"
  } else if n == 0 {
    "0"
  } else {
    decimal_digits(n, #"")
  }
}

fn decimal_digits(n: Int, acc: ByteArray) -> ByteArray {
  if n == 0 {
    acc
  } else {
    let digit = bytearray.from_int_big_endian(48 + n % 10, 1)
    decimal_digits(n / 10, bytearray.concat(digit, acc))
  }
}

/// Exact length-prefix encoding used by Haskell Beacon.field.
pub fn field(bytes: ByteArray) -> ByteArray {
  bytearray.concat(integer_to_bytes(bytearray.length(bytes)), bytes)
}

pub fn field_integer(n: Int) -> ByteArray {
  field(integer_to_bytes(n))
}

pub fn player_commitment(round_id: Int, ticket_nonce: Int, player_secret: ByteArray) -> ByteArray {
  crypto.sha2_256(
    bytearray.concat(
      field(player_domain),
      bytearray.concat(
        field_integer(round_id),
        bytearray.concat(field_integer(ticket_nonce), field(player_secret)),
      ),
    ),
  )
}

pub fn encode_beacon_target(target: BeaconTarget) -> ByteArray {
  bytearray.concat(
    field_integer(target.network_id),
    bytearray.concat(
      field_integer(target.round_id),
      bytearray.concat(field(target.mainchain_ref), field(target.version)),
    ),
  )
}

pub fn ticket_commitment(
  ticket_id: ByteArray,
  player_commitment_value: ByteArray,
  game_version: ByteArray,
  nonce: Int,
  price_usdm: Int,
  beacon_target_encoded: ByteArray,
) -> ByteArray {
  crypto.sha2_256(
    bytearray.concat(
      field(ticket_domain),
      bytearray.concat(
        field(ticket_id),
        bytearray.concat(
          field(player_commitment_value),
          bytearray.concat(
            field(game_version),
            bytearray.concat(
              field(integer_to_bytes(nonce)),
              bytearray.concat(field(integer_to_bytes(price_usdm)), field(beacon_target_encoded)),
            ),
          ),
        ),
      ),
    ),
  )
}

/// Deterministic beacon derivation only; this does not prove mc_hash authenticity.
pub fn derive_beacon(
  network_id: Int,
  round_id: Int,
  mainchain_ref: ByteArray,
  mc_hash: ByteArray,
  materios_context: ByteArray,
  version: ByteArray,
) -> ByteArray {
  crypto.sha2_256(
    bytearray.concat(
      field(beacon_domain),
      bytearray.concat(
        field_integer(network_id),
        bytearray.concat(
          field_integer(round_id),
          bytearray.concat(
            field(mainchain_ref),
            bytearray.concat(
              field(mc_hash),
              bytearray.concat(field(materios_context), field(version)),
            ),
          ),
        ),
      ),
    ),
  )
}

pub fn derive_ticket_seed(
  round_id: Int,
  ticket_nonce: Int,
  player_secret: ByteArray,
  beacon: ByteArray,
  game_version: ByteArray,
) -> ByteArray {
  crypto.sha2_256(
    bytearray.concat(
      field(game_domain),
      bytearray.concat(
        field_integer(round_id),
        bytearray.concat(
          field_integer(ticket_nonce),
          bytearray.concat(
            field(player_secret),
            bytearray.concat(field(beacon), field(game_version)),
          ),
        ),
      ),
    ),
  )
}

pub fn derive_symbols_seed(ticket_seed: ByteArray) -> ByteArray {
  crypto.sha2_256(
    bytearray.concat(field(symbols_domain), field(ticket_seed)),
  )
}

test integer_zero_is_decimal_ascii() {
  integer_to_bytes(0) == "0"
}

test integer_positive_is_decimal_ascii() {
  integer_to_bytes(4207) == "4207"
}

test integer_negative_matches_haskell_zero_fallback() {
  integer_to_bytes(-7) == "0"
}

test player_commitment_matches_fixed_sha256_vector() {
  player_commitment(42, 7, #"aabbccdd")
    == #"10e3663bdbe4c976cb9713932fd43911d9921f2b078982cde94a169819ddfe01"
}

test beacon_target_encoding_matches_fixed_vector() {
  encode_beacon_target(
    BeaconTarget {
      network_id: 0,
      round_id: 42,
      mainchain_ref: #"010203",
      version: "v1",
    },
  ) == #"313032343233010203327631"
}

test ticket_commitment_matches_fixed_sha256_vector() {
  let player = player_commitment(42, 7, #"aabbccdd")
  let target =
    encode_beacon_target(
      BeaconTarget {
        network_id: 0,
        round_id: 42,
        mainchain_ref: #"010203",
        version: "v1",
      },
    )
  ticket_commitment(
    #"deadbeef",
    player,
    "classic-6-v1",
    7,
    100,
    target,
  ) == #"a909e5f9b93ba1cd52c8bb1688d867d113b152ffb6f44f168511865823105154"
}

test beacon_derivation_matches_fixed_sha256_vector() {
  derive_beacon(0, 42, #"010203", #"11223344", #"556677", "v1")
    == #"1054536eaef627806525ae3c396538a30e59335234b9658b6cdb75283d33b073"
}

test ticket_seed_matches_fixed_sha256_vector() {
  let beacon = #"1054536eaef627806525ae3c396538a30e59335234b9658b6cdb75283d33b073"
  derive_ticket_seed(42, 7, #"aabbccdd", beacon, "classic-6-v1")
    == #"9afa5ed16ff87e75a87c37a75402d7bb82c62cf17d999543a66379651758db5b"
}

test symbols_seed_matches_fixed_sha256_vector() {
  let ticket_seed = #"9afa5ed16ff87e75a87c37a75402d7bb82c62cf17d999543a66379651758db5b"
  derive_symbols_seed(ticket_seed)
    == #"0068b5e1ecdfa738c16201c0f5f103bf2edc65805688c1c095fe6c3f728197cc"
}
