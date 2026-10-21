use std::collections::{BTreeMap, BTreeSet};
use std::io::{self, Read};

use codec::Decode;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sp_core::{
    ed25519,
    hashing::{blake2_256, twox_128},
    Blake2Hasher, H256,
};
use sp_runtime::{
    generic::Header as SubstrateHeader,
    traits::{BlakeTwo256, Hash as _, Header as _},
    StateVersion,
};
use sp_state_machine::{backend::Backend, InMemoryBackend};

const EXPECTED_CHAIN_ID: &str = "materios_preprod_v6";
const EXPECTED_GENESIS_HASH: &str =
    "0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf";
const EXPECTED_RAW_SPEC_SHA256: &str =
    "77877aa63358af6cf0c78a3b106ac2d295da575973bec1c3ff51d53b3fa65aaa";
const EXPECTED_RAW_SPEC_SIZE: usize = 1_063_592;
const EXPECTED_RAW_TOP_ENTRIES: usize = 63;
const EXPECTED_RUNTIME_CODE_SHA256: &str =
    "438747fce96411c4fe5d4c02d725993573093937aa14e39104036e5b7811d99f";
const EXPECTED_RUNTIME_CODE_SIZE: usize = 526_789;
const SOURCE_REPOSITORY: &str = "Flux-Point-Studios/materios";
const SOURCE_COMMIT: &str = "bc1465d85e033001bc86175b85d60f2e5c353413";
const SOURCE_FIXTURE: &str = "tools/launch-preflight/fixtures/preprod-v6-raw.json.gz";

// These are an independent source-level cross-check for the keys encoded in
// Grandpa::Authorities. Their actual weights are deliberately read from the
// raw genesis storage rather than inferred from Rust source.
const EXPECTED_GRANDPA_KEYS: [&str; 4] = [
    "c05b56dab7a8701871a8be75aed6e2ad8c5eb5ff935ddd2b00eeca7299af35b1",
    "4558853422164939eca690f21f76a614f7957352e01a448a4986ca3d55d98f23",
    "4dc9c8f9bd37df2bb9223458c897b000fe4362958da6eeb6413b93dcfbabe2ba",
    "750d4ba2a831a30d419009f2d8bc1ef1e6fc6f673c7a2b5b500a2b7f2a68458e",
];

fn decode_hex(field: &str, value: &str) -> Result<Vec<u8>, String> {
    let clean = value.strip_prefix("0x").unwrap_or(value);
    if clean.len() % 2 != 0 || !clean.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(format!("{field}: expected even-length hexadecimal bytes"));
    }
    hex::decode(clean).map_err(|e| format!("{field}: invalid hex: {e}"))
}

fn hex_bytes(bytes: &[u8]) -> String {
    format!("0x{}", hex::encode(bytes))
}

fn storage_value_key(pallet: &[u8], item: &[u8]) -> Vec<u8> {
    let mut key = Vec::with_capacity(32);
    key.extend_from_slice(&twox_128(pallet));
    key.extend_from_slice(&twox_128(item));
    key
}

fn decode_all<T: Decode>(field: &str, bytes: &[u8]) -> Result<T, String> {
    let mut input = bytes;
    let value = T::decode(&mut input).map_err(|e| format!("{field}: invalid SCALE: {e}"))?;
    if !input.is_empty() {
        return Err(format!("{field}: trailing bytes after SCALE value"));
    }
    Ok(value)
}

fn sha256_hex(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

fn verify_raw_genesis_spec(raw: &[u8]) -> Result<Value, String> {
    if raw.len() != EXPECTED_RAW_SPEC_SIZE {
        return Err(format!(
            "RAW_SPEC_SIZE_MISMATCH: expected {}, got {}",
            EXPECTED_RAW_SPEC_SIZE,
            raw.len()
        ));
    }

    let raw_sha256 = sha256_hex(raw);
    if raw_sha256 != EXPECTED_RAW_SPEC_SHA256 {
        return Err(format!(
            "RAW_SPEC_SHA256_MISMATCH: expected {}, got {}",
            EXPECTED_RAW_SPEC_SHA256,
            raw_sha256
        ));
    }

    let spec: Value =
        serde_json::from_slice(raw).map_err(|e| format!("raw chain spec is invalid JSON: {e}"))?;

    let chain_id = spec
        .get("id")
        .and_then(Value::as_str)
        .ok_or("raw chain spec is missing string field id")?;
    if chain_id != EXPECTED_CHAIN_ID {
        return Err(format!(
            "CHAIN_ID_MISMATCH: expected {EXPECTED_CHAIN_ID}, got {chain_id}"
        ));
    }

    let children = spec
        .pointer("/genesis/raw/childrenDefault")
        .and_then(Value::as_object)
        .ok_or("raw chain spec is missing genesis.raw.childrenDefault object")?;
    if !children.is_empty() {
        return Err(
            "UNSUPPORTED_GENESIS_CHILD_STORAGE: the pinned verifier requires an empty childrenDefault map"
                .into(),
        );
    }

    let top = spec
        .pointer("/genesis/raw/top")
        .and_then(Value::as_object)
        .ok_or("raw chain spec is missing genesis.raw.top object")?;

    if top.len() != EXPECTED_RAW_TOP_ENTRIES {
        return Err(format!(
            "GENESIS_TOP_ENTRY_COUNT_MISMATCH: expected {}, got {}",
            EXPECTED_RAW_TOP_ENTRIES,
            top.len()
        ));
    }

    let mut storage: Vec<(Vec<u8>, Option<Vec<u8>>)> = Vec::with_capacity(top.len());
    let mut decoded_top: BTreeMap<Vec<u8>, Vec<u8>> = BTreeMap::new();

    for (key_hex, value_json) in top {
        let key = decode_hex("genesis storage key", key_hex)?;
        let value_hex = value_json
            .as_str()
            .ok_or_else(|| format!("genesis storage value for {key_hex} is not a string"))?;
        let value = decode_hex("genesis storage value", value_hex)?;
        if decoded_top.insert(key.clone(), value.clone()).is_some() {
            return Err(format!(
                "DUPLICATE_GENESIS_STORAGE_KEY: {}",
                hex_bytes(&key)
            ));
        }
        storage.push((key, Some(value)));
    }

    let code_key = b":code".to_vec();
    let runtime_code = decoded_top
        .get(&code_key)
        .ok_or("GENESIS_RUNTIME_CODE_MISSING: raw state has no :code entry")?;

    if runtime_code.len() != EXPECTED_RUNTIME_CODE_SIZE {
        return Err(format!(
            "RUNTIME_CODE_SIZE_MISMATCH: expected {}, got {}",
            EXPECTED_RUNTIME_CODE_SIZE,
            runtime_code.len()
        ));
    }
    let runtime_code_sha256 = sha256_hex(runtime_code);
    if runtime_code_sha256 != EXPECTED_RUNTIME_CODE_SHA256 {
        return Err(format!(
            "RUNTIME_CODE_SHA256_MISMATCH: expected {}, got {}",
            EXPECTED_RUNTIME_CODE_SHA256,
            runtime_code_sha256
        ));
    }

    // Recompute the entire genesis trie from every raw key/value. This is not
    // a query to Materios RPC and does not trust a provider-reported state root.
    let state_version = StateVersion::V1;
    let backend =
        <InMemoryBackend<Blake2Hasher>>::from((vec![(None, storage)], state_version));
    let state_root = backend.storage_root(std::iter::empty(), state_version).0;
    let empty_extrinsics_root =
        BlakeTwo256::ordered_trie_root(Vec::<Vec<u8>>::new(), state_version);
    let genesis_header = SubstrateHeader::<u32, BlakeTwo256>::new(
        0,
        empty_extrinsics_root,
        state_root,
        H256::zero(),
        Default::default(),
    );
    let computed_genesis_hash = genesis_header.hash();
    let expected_genesis_hash =
        H256::from_slice(&decode_hex("expected genesis hash", EXPECTED_GENESIS_HASH)?);

    if computed_genesis_hash != expected_genesis_hash {
        return Err(format!(
            "GENESIS_HASH_MISMATCH: raw spec reconstructs {}, expected {}",
            hex_bytes(computed_genesis_hash.as_bytes()),
            EXPECTED_GENESIS_HASH
        ));
    }

    // Read GRANDPA authorities from the state whose complete map was just
    // rebound to the pinned genesis hash. No current RPC authority list is used.
    let authorities_key = storage_value_key(b"Grandpa", b"Authorities");
    let authorities_scale = decoded_top
        .get(&authorities_key)
        .ok_or("GENESIS_GRANDPA_AUTHORITIES_MISSING: raw genesis has no Grandpa::Authorities value")?;
    let authorities: Vec<(ed25519::Public, u64)> =
        decode_all("Grandpa::Authorities", authorities_scale)?;

    if authorities.len() != EXPECTED_GRANDPA_KEYS.len() {
        return Err(format!(
            "GENESIS_GRANDPA_AUTHORITY_COUNT_MISMATCH: source cross-check expects {}, raw state contains {}",
            EXPECTED_GRANDPA_KEYS.len(),
            authorities.len()
        ));
    }

    let mut seen = BTreeSet::new();
    let mut total_weight = 0u128;
    let mut authorities_json = Vec::with_capacity(authorities.len());

    for (index, (authority, weight)) in authorities.iter().enumerate() {
        if *weight == 0 {
            return Err("INVALID_GENESIS_GRANDPA_AUTHORITY_WEIGHT: zero weight".into());
        }
        let public_key = authority.0;
        let public_key_hex = hex::encode(public_key);
        if !seen.insert(public_key) {
            return Err("DUPLICATE_GENESIS_GRANDPA_AUTHORITY".into());
        }
        if public_key_hex != EXPECTED_GRANDPA_KEYS[index] {
            return Err(format!(
                "GENESIS_GRANDPA_KEY_MISMATCH_AT_INDEX_{index}: raw state {}, pinned source {}",
                public_key_hex, EXPECTED_GRANDPA_KEYS[index]
            ));
        }
        total_weight += *weight as u128;
        authorities_json.push(json!({
            "index": index,
            "public_key": format!("0x{public_key_hex}"),
            "weight": weight.to_string(),
        }));
    }

    let set_id_key = storage_value_key(b"Grandpa", b"CurrentSetId");
    let (set_id, set_id_provenance) = match decoded_top.get(&set_id_key) {
        Some(value) => (
            decode_all::<u64>("Grandpa::CurrentSetId", value)?,
            "explicit-genesis-storage-value",
        ),
        None => (0u64, "pallet-grandpa-genesis-default-value-query"),
    };
    if set_id != 0 {
        return Err(format!(
            "NONZERO_GENESIS_GRANDPA_SET_ID: expected protocol genesis set id 0, got {set_id}"
        ));
    }

    let mut report = json!({
        "schema_version": "materios-genesis-authority-bootstrap-v1",
        "status": "VERIFIED",
        "source": {
            "repository": SOURCE_REPOSITORY,
            "commit": SOURCE_COMMIT,
            "fixture": SOURCE_FIXTURE,
            "raw_spec_sha256": raw_sha256,
            "raw_spec_size_bytes": raw.len(),
        },
        "chain_id": chain_id,
        "expected_genesis_hash": EXPECTED_GENESIS_HASH,
        "computed_genesis_hash": hex_bytes(computed_genesis_hash.as_bytes()),
        "genesis_state_root": hex_bytes(state_root.as_bytes()),
        "genesis_header_number": 0,
        "state_version": 1,
        "raw_genesis_top_entry_count": top.len(),
        "runtime_code_length_bytes": runtime_code.len(),
        "runtime_code_sha256": runtime_code_sha256,
        "runtime_code_blake2_256": hex_bytes(&blake2_256(runtime_code)),
        "grandpa_authorities_storage_key": hex_bytes(&authorities_key),
        "grandpa_authorities_scale_hex": hex_bytes(authorities_scale),
        "grandpa_authorities": authorities_json,
        "grandpa_authority_count": authorities.len(),
        "grandpa_total_weight": total_weight.to_string(),
        "grandpa_current_set_id_storage_key": hex_bytes(&set_id_key),
        "grandpa_current_set_id": set_id,
        "grandpa_current_set_id_provenance": set_id_provenance,
        "claims": {
            "complete_raw_genesis_map_recomputed": true,
            "computed_genesis_hash_matches_configured_chain_anchor": true,
            "grandpa_authorities_decoded_from_hash_bound_genesis_storage": true,
            "grandpa_keys_cross_checked_against_pinned_source": true,
            "grandpa_weights_read_from_raw_genesis_storage": true,
            "grandpa_set_id_derived_from_explicit_storage_or_genesis_default": true,
            "post_genesis_grandpa_finality_verified": false,
            "authority_transition_history_verified": false,
            "materios_selection_transition_verified": false,
            "b3_a_closed": false,
        }
    });

    // Hash the deterministic manifest body before inserting its own digest.
    let manifest_bytes =
        serde_json::to_vec(&report).map_err(|e| format!("manifest serialization failed: {e}"))?;
    report["manifest_sha256"] = json!(sha256_hex(&manifest_bytes));

    Ok(report)
}

fn main() -> Result<(), String> {
    let mut raw = Vec::new();
    io::stdin()
        .read_to_end(&mut raw)
        .map_err(|e| format!("failed to read raw chain spec from stdin: {e}"))?;

    let report = verify_raw_genesis_spec(&raw)?;
    println!(
        "{}",
        serde_json::to_string_pretty(&report)
            .map_err(|e| format!("failed to serialize bootstrap report: {e}"))?
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn storage_keys_use_canonical_frame_twox_prefixes() {
        let authorities = storage_value_key(b"Grandpa", b"Authorities");
        let current_set = storage_value_key(b"Grandpa", b"CurrentSetId");
        assert_eq!(authorities.len(), 32);
        assert_eq!(current_set.len(), 32);
        assert_ne!(authorities, current_set);
    }

    #[test]
    fn rejects_a_raw_spec_with_the_wrong_pinned_size() {
        let bad = br#"{"id":"some_other_chain","genesis":{"raw":{"top":{},"childrenDefault":{}}}}"#;
        assert!(verify_raw_genesis_spec(&bad)
            .expect_err("wrong-sized raw input must reject")
            .contains("RAW_SPEC_SIZE_MISMATCH"));
    }

    #[test]
    fn requires_exact_pinned_raw_genesis_digest() {
        let mut bad = vec![0u8; EXPECTED_RAW_SPEC_SIZE];
        bad[0] = 1;
        assert!(verify_raw_genesis_spec(&bad)
            .expect_err("changed raw genesis must reject")
            .contains("RAW_SPEC_SHA256_MISMATCH"));
    }
}
