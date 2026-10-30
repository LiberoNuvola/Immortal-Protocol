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

## Runtime API call-data binding

For the locked Materios runtime, `ScEpochNumber` is the sidechain-domain newtype over `u64`. Therefore the canonical Runtime API argument encoding is:

`callDataHex = authoritySelectionInputsHex || SCALE_LE64(sidechainEpoch)`

where `authoritySelectionInputsHex` is already the exact SCALE encoding of the four-field `AuthoritySelectionInputs` struct.

The PoC builder in `poc/materios-checkpoint/src/runtimeApi.ts` does not construct or mutate the candidate data. It appends only the exact 8-byte SCALE encoding of the already-bound epoch. The execution-proof packet validator requires this exact equality, preventing a proof response from being associated with a different input set or epoch.

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

## Upstream node audit — 2026-10-30

The live upstream source was rechecked against `Flux-Point-Studios/materios` main at commit `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` (2026-10-21):

- [Pinned upstream node RPC implementation](https://github.com/Flux-Point-Studios/materios/blob/7d5c36e7dcd60824d84353e93df5d4a03c9c6c30/partnerchain/node/src/rpc.rs) currently registers `System`, `OrinqReceipts`, and `MotraRpc` only. Its `FullDeps` has a client and transaction pool; the B3 execution-proof handler and its executor access are not registered there.
- A source search of the upstream main tree found no `materios_b3_calculateCommitteeProof`, `ProofProvider`, `execution_proof`, or `prove_execution` implementation in the node.
- The upstream main branch tree was non-truncated (526 entries). A branch search for `execution proof` returned no matching branch; upstream PR search returned no exact `prove_execution`, `ProofProvider`, or `B3` PR match.

Therefore `materios_b3_calculateCommitteeProof(block_hash, call_data_hex)` remains a **proposed, not deployed** RPC contract. The IMMORTAL collector's client implementation is ready and typechecked, but it must not be run as a live proof capture against the current public node and must not treat a method-not-found response as a proof result.

### Required upstream delta

The node-side change belongs in the upstream Materios repository, not in IMMORTAL's client adapter. Extend the existing node RPC dependencies with the SDK executor access needed to call the already available native execution-proof primitive; register only the committee proof method; restrict it to the exact canonical Runtime API method; bind the requested block and runtime version; SCALE-encode the returned native `StorageProof`; and return the exact tuple specified above. Then deploy that node build to Materios Preprod and verify the endpoint on the public RPC before enabling the IMMORTAL live job.

Do not replace this with `state_call` plus a normal `state_getReadProof`, locally recompute the selector, or label a normal call result as an execution proof. Those paths do not provide the native execution witness required by B3-C.

