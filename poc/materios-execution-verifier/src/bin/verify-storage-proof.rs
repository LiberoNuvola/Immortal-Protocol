use std::env;
use std::fs;

use immortal_materios_execution_verifier::{verify_storage_proof, StorageProofInput};

fn decode_hex_file(path: &str) -> Result<Vec<u8>, String> {
    let raw = fs::read_to_string(path).map_err(|e| format!("read {path}: {e}"))?;
    let value = raw.trim().strip_prefix("0x").unwrap_or(raw.trim());

    if value.len() % 2 != 0 {
        return Err(format!("{path}: odd hex length"));
    }

    if !value.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err(format!("{path}: invalid hex"));
    }

    let mut out = Vec::with_capacity(value.len() / 2);

    for i in (0..value.len()).step_by(2) {
        let byte = u8::from_str_radix(&value[i..i + 2], 16)
            .map_err(|e| format!("{path}: invalid hex at {i}: {e}"))?;
        out.push(byte);
    }

    Ok(out)
}

fn validate_storage_key(storage_key: &[u8]) -> Result<(), String> {
    if storage_key.is_empty() {
        return Err("storage key must not be empty".into());
    }
    // Substrate trie keys are not fixed-width: plain StorageValue keys are
    // typically 32 bytes, while Blake2_128Concat StorageMap keys are longer.
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();

    if args.len() != 5 {
        return Err(
            "usage: verify-storage-proof <state-root.hex> <storage-key.hex> <storage-value.hex> <proof-scale.hex>"
                .into(),
        );
    }

    let state_root = decode_hex_file(&args[1])?;
    let storage_key = decode_hex_file(&args[2])?;
    let storage_value = decode_hex_file(&args[3])?;
    let proof_scale = decode_hex_file(&args[4])?;

    if state_root.len() != 32 {
        return Err(format!("state root must be 32 bytes, got {}", state_root.len()).into());
    }
    validate_storage_key(&storage_key)?;

    verify_storage_proof(StorageProofInput {
        state_root: state_root.as_slice().try_into().expect("32 bytes checked"),
        proof_scale: &proof_scale,
        storage_key: &storage_key,
        expected_value: &storage_value,
    })
    .map_err(|e| format!("Substrate storage proof verification failed: {e}"))?;

    println!("SUBSTRATE_STORAGE_PROOF_VALID=true");
    println!("SUBSTRATE_STORAGE_KEY_BYTES={}", storage_key.len());
    println!("SUBSTRATE_STORAGE_VALUE_BYTES={}", storage_value.len());
    println!("SUBSTRATE_STATE_ROOT_BOUND=true");

    // Preserve the original B3-B markers for existing receipt-proof log
    // consumers. The same generic verifier also accepts plain StorageValue
    // keys such as OrinqReceipts.CommitteeMembers and AttestationThreshold.
    println!("B3_B_STORAGE_PROOF_VALID=true");
    println!("B3_B_STORAGE_KEY_EXISTS=true");
    println!("B3_B_STORAGE_VALUE_MATCH=true");
    println!("B3_B_STATE_ROOT_BOUND=true");
    println!("B3_B_RESULT=PASS");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_plain_storage_value_key_width() {
        assert_eq!(validate_storage_key(&[0x11; 32]), Ok(()));
    }

    #[test]
    fn accepts_concat_storage_map_key_width() {
        assert_eq!(validate_storage_key(&[0x22; 80]), Ok(()));
    }

    #[test]
    fn rejects_empty_storage_key() {
        assert_eq!(
            validate_storage_key(&[]),
            Err("storage key must not be empty".into())
        );
    }

    #[test]
    fn accepts_arbitrary_nonzero_storage_key_width() {
        assert_eq!(validate_storage_key(&[0x33; 47]), Ok(()));
    }
}
