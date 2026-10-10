use std::env;
use std::io::{self, Read};

use codec::Encode;
use immortal_materios_execution_verifier::{verify_storage_proof, StorageProofInput};
use sp_state_machine::StorageProof;

fn require_hex(field: &str, value: &str) -> Result<Vec<u8>, String> {
    let clean = value.strip_prefix("0x").unwrap_or(value);
    if clean.len() % 2 != 0 || !clean.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(format!("{field}: expected 0x-prefixed even-length hex"));
    }
    hex::decode(clean).map_err(|e| format!("{field}: invalid hex: {e}"))
}

fn main() -> Result<(), String> {
    let args: Vec<String> = env::args().collect();
    if args.len() != 4 {
        return Err(
            "usage: verify-storage-witness <state_root_hex> <storage_key_hex> <expected_value_hex>"
                .into(),
        );
    }

    let state_root = require_hex("state_root", &args[1])?;
    if state_root.len() != 32 {
        return Err("state_root: expected exactly 32 bytes".into());
    }
    let storage_key = require_hex("storage_key", &args[2])?;
    let expected_value = require_hex("expected_value", &args[3])?;

    let mut stdin = String::new();
    io::stdin()
        .read_to_string(&mut stdin)
        .map_err(|e| format!("failed to read proof nodes: {e}"))?;

    let mut nodes = Vec::new();
    for (index, line) in stdin.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        nodes.push(require_hex(&format!("proof node[{index}]"), line)?);
    }
    if nodes.is_empty() {
        return Err("proof nodes: no nodes supplied".into());
    }

    // StorageProof itself is the SDK's canonical set representation.
    // Preserve that native semantic instead of inventing an extra duplicate-node rule.
    let proof = StorageProof::new(nodes);
    let proof_scale = proof.encode();

    verify_storage_proof(StorageProofInput {
        state_root: state_root
            .try_into()
            .map_err(|_| "state_root: expected 32 bytes".to_string())?,
        proof_scale: &proof_scale,
        storage_key: &storage_key,
        expected_value: &expected_value,
    })?;

    print!("0x{}", hex::encode(proof_scale));
    Ok(())
}
