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

## Independent verifier

The receiving verifier must independently bind:

`finalized header → stateRoot → deployed runtime identity → exact call bytes → execution proof → execution result`

before composing the result into the IMMORTAL verified authority-transition boundary.

## Current evidence

SDK-level checks confirm that the exact Polkadot SDK revision resolved by Materios contains both the `ProofProvider::execution_proof` surface and the `CallExecutor::prove_execution` primitive. The Materios node's current custom RPC surface does not expose this proof operation.

Therefore the missing artifact is a thin node transport addition plus the real finalized proof fixture. No selector reimplementation is required.