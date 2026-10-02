# Materios execution-proof verifier PoC

This crate verifies the native Substrate execution-proof artifact produced from Materios runtime execution.

## What it verifies

- exact SCALE decoding of `StorageProof`;
- runtime WASM identity by Blake2-256 hash;
- execution-proof validity against the supplied state root;
- exact runtime method and call-data execution;
- equality between the reproduced runtime result and the expected result.

The implementation uses the same Polkadot SDK release family and revision pinned by Materios.

## What it does not verify

This crate does not establish:

- GRANDPA finality of the block;
- that the block is canonical;
- that the supplied runtime WASM is the deployed Materios runtime at that block;
- source/build reproducibility of the runtime artifact;
- the semantics of `AuthoritySelectionInputs`;
- the correctness of the authority transition surrounding the API call.

Those are outer B3 verification layers.

## Intended composition

1. independently establish finalized block and its header/state root;
2. establish deployed runtime identity and match it to a trusted runtime artifact;
3. decode and verify the execution proof with `verify_execution_proof`;
4. bind the returned result to the exact `SessionValidatorManagementApi_calculate_committee` input bytes and sidechain epoch;
5. compose the verified result into `VerifiedAuthoritySetTransition`;
6. independently verify the surrounding GRANDPA authority-set transition/finality.

A successful call to this crate alone must never be labelled `canonical Materios state`.