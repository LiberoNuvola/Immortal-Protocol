# Materios B3 — concrete node RPC patch handoff

> Reference handoff for the Materios upstream node. This file does not claim that the upstream node has been modified.

## Verified upstream surface

Inspected on `Flux-Point-Studios/materios` `main`:

- `partnerchain/node/src/rpc.rs` blob: `30827863c7b8f6fb507b008cee9f572ec48fe06f`
- `partnerchain/node/Cargo.toml` blob: `8e657cf1430c618a639f7a62fbc5a783ae5f647f`
- `partnerchain/node/src/service.rs` blob: `f7e38b7b3f78ee3cfe9f316d00840bd039ad9d6c`

The node already depends on `sc-client-api` and receives the concrete `TFullClient` through `FullDeps<C, P>`.

The exact locked Polkadot SDK exposes:

`ProofProvider::execution_proof(hash, method, call_data) -> Result<(Vec<u8>, StorageProof), ...>`

and:

`ExecutorProvider::executor() -> &Executor`

with:

`CallExecutor::prove_execution(at_hash, method, call_data)`.

## Minimal implementation

Add the following dependency to the node module imports:

```rust
use sc_client_api::ExecutorProvider;
use sp_runtime::traits::Block as BlockT;
```

Extend the RPC client bound with:

```rust
C: ExecutorProvider<Block>
    + ProvideRuntimeApi<Block>
    + HeaderBackend<Block>
    + HeaderMetadata<Block, Error = BlockchainError>
    + Send
    + Sync
    + 'static,
```

Then register one narrow method in `create_full`:

```rust
use codec::Encode;

#[derive(serde::Serialize)]
struct CommitteeExecutionProof {
    block_hash: Block::Hash,
    runtime_api_method: &'static str,
    call_data_hex: String,
    result_hex: String,
    proof_scale_hex: String,
}

const B3_METHOD: &str =
    "SessionValidatorManagementApi_calculate_committee";

module.register_method(
    "materios_b3_calculateCommitteeProof",
    |params, _, _| {
        let (at, call_data_hex): (Block::Hash, String) = params.parse()?;

        let call_data_hex = call_data_hex.strip_prefix("0x")
            .ok_or_else(|| jsonrpsee::types::ErrorObjectOwned::owned(
                -32602,
                "call_data_hex must be 0x-prefixed",
                None::<()>,
            ))?;

        let call_data = hex::decode(call_data_hex).map_err(|_| {
            jsonrpsee::types::ErrorObjectOwned::owned(
                -32602,
                "call_data_hex is invalid hex",
                None::<()>,
            )
        })?;

        let (result, proof) = client
            .executor()
            .prove_execution(at, B3_METHOD, &call_data)
            .map_err(|e| {
                jsonrpsee::types::ErrorObjectOwned::owned(
                    -32000,
                    e.to_string(),
                    None::<()>,
                )
            })?;

        Ok(CommitteeExecutionProof {
            block_hash: at,
            runtime_api_method: B3_METHOD,
            call_data_hex: format!("0x{}", hex::encode(call_data)),
            result_hex: format!("0x{}", hex::encode(result)),
            proof_scale_hex: format!("0x{}", hex::encode(proof.encode())),
        })
    },
)?;
```

The exact jsonrpsee registration shape should be adjusted to the crate's current API if the local compiler requires the async registration variant. The essential operation is invariant: parse the exact block hash + exact SCALE call bytes, call `client.executor().prove_execution(...)`, and SCALE-encode the returned `StorageProof`.

## Dependency note

The node currently demonstrates use of `hex::decode` elsewhere in the workspace but does not list `hex` directly in `partnerchain/node/Cargo.toml`. Add a direct `hex` dependency (workspace version if already defined) rather than relying on a transitive dependency.

`codec` / `parity-scale-codec` should likewise be added directly to the node crate if not already available through its workspace dependency list.

## Deliberate non-features

This endpoint must NOT:

- select authorities itself;
- reproduce `Config::select_authorities`;
- call `state_call` and compare a locally reimplemented selector;
- declare the result canonical/finalized/verified;
- infer GRANDPA finality from block existence;
- accept a different runtime API method on this B3 endpoint.

The endpoint is transport only.

## Independent verification boundary

The IMMORTAL verifier must bind:

`finalized block -> header.stateRoot -> runtime code identity -> exact method/call bytes -> StorageProof -> execution result`

before treating the returned authority set as verified execution evidence.

The proof endpoint alone therefore does not close B3.

## Current exact upstream execution primitive

At Polkadot SDK revision:

`polkadot-stable2409-4 / c455194a2ae2f613c1c671e00dbf397b83ed8171`

`ProofProvider::execution_proof` and `CallExecutor::prove_execution` are present in the SDK source. This is the native execution-proof primitive used by this handoff.

## Status

- Node-side RPC transport: **PATCH DEFINED / NOT APPLIED TO UPSTREAM**
- Immortal TS transport client: **IMPLEMENTED**
- Immortal Rust execution verifier: **IMPLEMENTED PoC / CI gate active**
- Real finalized Materios execution-proof fixture: **OPEN**
- Runtime source/deployment correspondence: **OPEN**
- GRANDPA finality composition: **OPEN**
- B3 canonicality: **OPEN**
