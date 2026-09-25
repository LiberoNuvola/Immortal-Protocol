use codec::{Decode, Encode};
use sc_executor::WasmExecutor;
use sp_core::{
    hashing::blake2_256,
    traits::{RuntimeCode, WrappedRuntimeCode},
    Blake2Hasher,
};
use sp_io::SubstrateHostFunctions;
use sp_state_machine::{execution_proof_check, OverlayedChanges, StorageProof};

/// Inputs required to independently check one native Substrate execution proof.
///
/// The caller must obtain the expected runtime WASM from a trusted source and
/// bind its Blake2-256 hash to the deployment/source correspondence. This
/// function does not fetch network state and does not decide finality.
pub struct ExecutionProofInput<'a> {
    pub state_root: [u8; 32],
    pub proof_scale: &'a [u8],
    pub runtime_wasm: &'a [u8],
    pub expected_runtime_code_hash: [u8; 32],
    pub method: &'a str,
    pub call_data: &'a [u8],
    pub expected_result: &'a [u8],
}

/// Verify the native execution-proof artifact against an expected state root
/// and expected runtime WASM identity.
///
/// Success means the supplied runtime WASM reproduced the returned execution
/// result when evaluated over the authenticated proof backend. It does not
/// by itself prove that the block is finalized or that the supplied runtime
/// WASM is the network canonical runtime; those bindings belong to the outer
/// B3 verifier.
pub fn verify_execution_proof(
    input: ExecutionProofInput<'_>,
) -> Result<Vec<u8>, String> {
    if input.method.is_empty() {
        return Err("runtime method is empty".into());
    }
    if input.proof_scale.is_empty() {
        return Err("SCALE StorageProof is empty".into());
    }
    if input.runtime_wasm.is_empty() {
        return Err("runtime WASM is empty".into());
    }

    let actual_runtime_code_hash = blake2_256(input.runtime_wasm);
    if actual_runtime_code_hash != input.expected_runtime_code_hash {
        return Err("runtime WASM hash does not match expected runtime identity".into());
    }

    let mut encoded = input.proof_scale;
    let proof = StorageProof::decode(&mut encoded)
        .map_err(|e| format!("invalid SCALE StorageProof: {e}"))?;
    if !encoded.is_empty() {
        return Err("trailing bytes after SCALE StorageProof".into());
    }

    let executor: WasmExecutor<SubstrateHostFunctions> =
        WasmExecutor::builder().build();

    let code_fetcher = WrappedRuntimeCode(input.runtime_wasm.into());
    let runtime_code = RuntimeCode {
        code_fetcher: &code_fetcher,
        heap_pages: None,
        // RuntimeCode::hash is an executor cache identity. The verifier has
        // already bound the same runtime-code hash above.
        hash: input.expected_runtime_code_hash.to_vec().encode(),
    };

    let mut overlay = OverlayedChanges::default();

    let result = execution_proof_check::<Blake2Hasher, _>(
        input.state_root.into(),
        proof,
        &mut overlay,
        &executor,
        input.method,
        input.call_data,
        &runtime_code,
    )
    .map_err(|e| format!("execution proof verification failed: {e}"))?;

    if result != input.expected_result {
        return Err("authenticated execution result does not match expected result".into());
    }

    Ok(result)
}
