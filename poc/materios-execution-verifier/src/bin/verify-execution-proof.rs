use std::env;
use std::fs;
use std::process;

use immortal_materios_execution_verifier::{verify_execution_proof, ExecutionProofInput};

const COMMITTEE_RUNTIME_API: &str =
    "SessionValidatorManagementApi_calculate_committee";

fn decode_hex(value: &str, field: &str) -> Result<Vec<u8>, String> {
    let clean = value.trim().strip_prefix("0x").unwrap_or(value.trim());

    if clean.len() % 2 != 0 {
        return Err(format!("{field}: odd hex length"));
    }

    if !clean.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err(format!("{field}: invalid hex"));
    }

    hex::decode(clean).map_err(|error| format!("{field}: invalid hex: {error}"))
}

fn read_hex_file(path: &str, field: &str) -> Result<Vec<u8>, String> {
    let value = fs::read_to_string(path).map_err(|error| format!("read {path}: {error}"))?;
    decode_hex(&value, field)
}

fn run() -> Result<(), String> {
    let args: Vec<String> = env::args().collect();

    if args.len() != 8 {
        return Err(
            "usage: verify-execution-proof <state-root.hex> <proof-scale.hex> <runtime.wasm> <expected-runtime-code-hash.hex> <method.txt> <call-data.hex> <expected-result.hex>"
                .into(),
        );
    }

    let state_root = read_hex_file(&args[1], "state root")?;
    let proof_scale = read_hex_file(&args[2], "SCALE execution proof")?;
    let runtime_wasm =
        fs::read(&args[3]).map_err(|error| format!("read {}: {error}", args[3]))?;
    let expected_runtime_code_hash =
        read_hex_file(&args[4], "expected runtime code hash")?;
    let method = fs::read_to_string(&args[5])
        .map_err(|error| format!("read {}: {error}", args[5]))?;
    let call_data = read_hex_file(&args[6], "runtime call data")?;
    let expected_result = read_hex_file(&args[7], "expected runtime result")?;

    if state_root.len() != 32 {
        return Err(format!("state root must be 32 bytes, got {}", state_root.len()));
    }
    if expected_runtime_code_hash.len() != 32 {
        return Err(format!(
            "expected runtime code hash must be 32 bytes, got {}",
            expected_runtime_code_hash.len()
        ));
    }
    if runtime_wasm.is_empty() {
        return Err("runtime WASM is empty".into());
    }
    if method.trim() != COMMITTEE_RUNTIME_API {
        return Err(format!(
            "runtime method must be exactly {COMMITTEE_RUNTIME_API}"
        ));
    }

    let verified_result = verify_execution_proof(ExecutionProofInput {
        state_root: state_root
            .as_slice()
            .try_into()
            .map_err(|_| "state root must be 32 bytes".to_string())?,
        proof_scale: &proof_scale,
        runtime_wasm: &runtime_wasm,
        expected_runtime_code_hash: expected_runtime_code_hash
            .as_slice()
            .try_into()
            .map_err(|_| "expected runtime code hash must be 32 bytes".to_string())?,
        method: COMMITTEE_RUNTIME_API,
        call_data: &call_data,
        expected_result: &expected_result,
    })
    .map_err(|error| format!("B3-C execution-proof verification failed: {error}"))?;

    println!("B3_C_STATE_ROOT_PROOF_VERIFIED=true");
    println!("B3_C_RUNTIME_WASM_HASH_VERIFIED=true");
    println!("B3_C_EXACT_METHOD_VERIFIED=true");
    println!("B3_C_EXACT_CALL_DATA_VERIFIED=true");
    println!("B3_C_EXPECTED_RESULT_MATCHED=true");
    println!("B3_C_EXECUTION_PROOF_VERIFIED=true");
    println!("B3_C_VERIFIED_RESULT_HEX=0x{}", hex::encode(verified_result));

    Ok(())
}

fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_prefixed_and_unprefixed_hex() {
        assert_eq!(decode_hex("0x0102", "value").unwrap(), vec![1, 2]);
        assert_eq!(decode_hex("0102", "value").unwrap(), vec![1, 2]);
    }

    #[test]
    fn rejects_odd_length_hex() {
        assert!(decode_hex("0xabc", "value")
            .unwrap_err()
            .contains("odd hex length"));
    }

    #[test]
    fn rejects_non_hex_input() {
        assert!(decode_hex("0xzz", "value")
            .unwrap_err()
            .contains("invalid hex"));
    }
}
