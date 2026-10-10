use codec::{Decode, Encode};
use sp_core::Blake2Hasher;
use sp_runtime::StateVersion;
use sp_state_machine::{
    backend::Backend, prove_read, read_proof_check, InMemoryBackend, StorageProof,
};

/// Inputs required to independently verify one Substrate storage read proof.
///
/// The caller is responsible for binding `state_root` to the exact historical
/// block header and for binding the storage key/value to the intended
/// application record. This verifier does not decide block finality, authority
/// provenance, runtime identity, or canonicality.
pub struct StorageProofInput<'a> {
    pub state_root: [u8; 32],
    pub proof_scale: &'a [u8],
    pub storage_key: &'a [u8],
    pub expected_value: &'a [u8],
}

/// Verify that `storage_key` resolves to exactly `expected_value` under
/// `state_root` using the native Polkadot SDK trie proof verifier.
///
/// The function fails closed on malformed SCALE, trailing bytes, an invalid
/// proof/root binding, an unavailable key, or a value mismatch.
pub fn verify_storage_proof(input: StorageProofInput<'_>) -> Result<(), String> {
    if input.proof_scale.is_empty() {
        return Err("SCALE StorageProof is empty".into());
    }

    let mut encoded = input.proof_scale;
    let proof = StorageProof::decode(&mut encoded)
        .map_err(|e| format!("invalid SCALE StorageProof: {e}"))?;

    if !encoded.is_empty() {
        return Err("trailing bytes after SCALE StorageProof".into());
    }

    let values = read_proof_check::<Blake2Hasher, _>(
        input.state_root.into(),
        proof,
        std::iter::once(input.storage_key),
    )
    .map_err(|e| format!("storage proof verification failed: {e}"))?;

    match values.get(input.storage_key) {
        Some(Some(actual)) if actual == input.expected_value => Ok(()),
        Some(Some(_)) => Err("authenticated storage value does not match expected value".into()),
        Some(None) => Err("storage key is absent from authenticated state".into()),
        None => Err("authenticated proof result omitted requested storage key".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> (Vec<u8>, Vec<u8>, Vec<u8>, [u8; 32]) {
        let state_version = StateVersion::default();
        let backend = <InMemoryBackend<Blake2Hasher>>::from((
            vec![(
                None,
                vec![(b"anchor".to_vec(), Some(b"anchor-record".to_vec()))],
            )],
            state_version,
        ));

        let root = backend.storage_root(std::iter::empty(), state_version).0;

        let proof = prove_read(backend, &[&b"anchor"[..]]).expect("fixture proof");
        (
            b"anchor".to_vec(),
            b"anchor-record".to_vec(),
            proof.encode(),
            root.into(),
        )
    }

    #[test]
    fn accepts_valid_storage_proof_and_exact_value() {
        let (key, value, proof, root) = fixture();

        verify_storage_proof(StorageProofInput {
            state_root: root,
            proof_scale: &proof,
            storage_key: &key,
            expected_value: &value,
        })
        .expect("valid proof must verify");
    }

    #[test]
    fn rejects_wrong_state_root() {
        let (key, value, proof, _) = fixture();

        let result = verify_storage_proof(StorageProofInput {
            state_root: [0x11; 32],
            proof_scale: &proof,
            storage_key: &key,
            expected_value: &value,
        });

        assert!(result
            .expect_err("wrong root must be rejected")
            .contains("storage proof verification failed"));
    }

    #[test]
    fn rejects_wrong_storage_key() {
        let (_, value, proof, root) = fixture();
        let wrong_key = b"wrong-anchor";

        let result = verify_storage_proof(StorageProofInput {
            state_root: root,
            proof_scale: &proof,
            storage_key: wrong_key,
            expected_value: &value,
        });

        assert!(result.is_err());
    }

    #[test]
    fn rejects_wrong_expected_value() {
        let (key, _, proof, root) = fixture();
        let wrong_value = b"tampered-anchor-record";

        let result = verify_storage_proof(StorageProofInput {
            state_root: root,
            proof_scale: &proof,
            storage_key: &key,
            expected_value: wrong_value,
        });

        assert_eq!(
            result,
            Err("authenticated storage value does not match expected value".into())
        );
    }

    #[test]
    fn rejects_malformed_scale_proof() {
        let result = verify_storage_proof(StorageProofInput {
            state_root: [0x11; 32],
            proof_scale: &[0x04],
            storage_key: b"anchor",
            expected_value: b"anchor-record",
        });

        assert!(result
            .expect_err("malformed proof must be rejected")
            .starts_with("invalid SCALE StorageProof:"));
    }

    #[test]
    fn rejects_trailing_bytes_after_scale_proof() {
        let (_, _, mut proof, root) = fixture();
        proof.push(0xff);
        let result = verify_storage_proof(StorageProofInput {
            state_root: root,
            proof_scale: &proof,
            storage_key: b"anchor",
            expected_value: b"anchor-record",
        });

        assert_eq!(
            result,
            Err("trailing bytes after SCALE StorageProof".into())
        );
    }
}
