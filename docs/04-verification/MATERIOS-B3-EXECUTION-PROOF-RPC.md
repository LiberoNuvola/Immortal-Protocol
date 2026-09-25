# Materios B3 execution-proof RPC reference

> Reference-only implementation note. This document does not modify the Materios upstream node.

## Native path

The locked Polkadot SDK exposes:

`ProofProvider::execution_proof(block_hash, method, call_data)`

and the concrete Materios client implementation delegates it directly to:

`self.executor.prove_execution(block_hash, method, call_data)`.

The `CallExecutor` interface defines `prove_execution` as a no-state-changing execution that returns `(Vec<u8>, StorageProof)`. The node therefore does not need to reproduce the runtime selector or construct trie proofs manually.

## Recommended narrow RPC

```text
materios_b3_calculateCommitteeProof(block_hash, call_data_hex)
```

Request:

- exact block hash;
- exact SCALE call bytes for `SessionValidatorManagementApi_calculate_committee`.

Response:

- block hash;
- runtime API method identifier;
- exact call bytes;
- exact runtime result bytes;
- exact SCALE-encoded `StorageProof`;
- runtime version observed at the same block.

## Node-side implementation boundary

A minimal node RPC implementation can be built around a client bound by:

- `sp_api::ProvideRuntimeApi<Block>`;
- `sp_blockchain::HeaderBackend<Block>`;
- `sc_client_api::ExecutorProvider<Block>`.

The handler should call the client's native executor proof method for the supplied block/method/call-data tuple and SCALE-encode the returned `StorageProof` for transport.

The handler must not:

- call the proof `canonical` or `verified`;
- infer GRANDPA finality from the fact that the block exists;
- substitute `state_call` plus a locally computed selector result;
- reconstruct Materios authority-selection logic outside the runtime;
- accept a different method than the canonical committee runtime API on the B3 endpoint.


## Input-commitment binding

The B3 evidence packet MUST distinguish the exact SCALE bytes of the authority-selection input from the full Runtime API call bytes.

- `authoritySelectionInputsHex` = exact `AuthoritySelectionInputs.encode()` bytes.
- `selectionInputsHash` = `blake2_256(authoritySelectionInputsHex)`.
- `callDataHex` = exact SCALE bytes supplied to `SessionValidatorManagementApi_calculate_committee`.

Materios' `pallet-session-validator-management` computes `selection_inputs_hash = blake2_256(decoded_data.encode())` inside `create_inherent` and includes that hash in the mandatory `Call::set` written into the block. The hash is not a standalone storage item, so B3 must recover it from the canonical block's encoded `Call::set` and compare it against the externally obtained exact input bytes.

This prevents a relayer from substituting a different `AuthoritySelectionInputs` value while presenting a valid execution proof.

The binding is:

`canonical block -> SessionValidatorManagement::set.selection_inputs_hash -> exact AuthoritySelectionInputs bytes -> blake2_256 match -> Runtime API call -> StorageProof`

The extraction of `Call::set` is now specified as a narrow raw-block decoding step. In the currently vendored Materios runtime, `SessionCommitteeManagement` is pallet index `14` and `set` is call index `0`. The inherent is an unsigned SCALE extrinsic (version byte `0x04`), so the decoder identifies `0x04 0x0e 0x00` and takes the final 32 bytes of that call as the fixed `SizedByteString<32>` hash field. The decoder must find exactly one matching inherent and fail closed on malformed, missing, or duplicate matches.

This pallet/call index is a runtime-bound constant, not a generic Substrate assumption. The B3 packet already binds the execution to the exact deployed runtime code hash/spec version; if a runtime upgrade changes the call layout or index, the extraction must be treated as OPEN until the new runtime metadata/source is independently re-triangulated.

A normal `state_call` result does not establish that the supplied inputs were the inputs carried by the canonical inherent.

## Schema update

The current IMMORTAL transport envelope is `materios-execution-proof-v2`. Version 2 adds the explicit `authoritySelectionInputsHex` and `selectionInputsHash` fields so the on-chain commitment can be checked without conflating input bytes with the complete Runtime API call payload.

## Independent verifier

The receiving verifier must independently bind:

`finalized header → stateRoot → deployed runtime identity → exact call bytes → execution proof → execution result`

before composing the result into the IMMORTAL verified authority-transition boundary.

## On-chain commitment extraction implementation

`poc/materios-checkpoint/src/selectionCommitment.ts` implements the narrow extraction above, and `MateriosRpc.getSelectionInputsCommitment(blockHash)` obtains the raw extrinsics through `chain_getBlock` at the exact requested block before decoding them.

The implementation deliberately does not:
- execute or reimplement authority selection;
- infer finality;
- validate committee semantics;
- treat an RPC response as canonical without the independent finality/state/proof layers.

The extracted hash is the exact on-chain commitment that must equal `blake2_256(AuthoritySelectionInputs.encode())` before the execution proof can be composed into B3.

## Current evidence

SDK-level checks confirm that the exact Polkadot SDK revision resolved by Materios contains both the `ProofProvider::execution_proof` surface and the `CallExecutor::prove_execution` primitive. The Materios node's current custom RPC surface does not expose this proof operation.

Therefore the missing artifact is a thin node transport addition plus the real finalized proof fixture. No selector reimplementation is required.