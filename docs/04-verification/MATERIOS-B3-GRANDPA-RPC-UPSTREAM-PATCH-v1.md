# Materios B3-A — upstream GRANDPA RPC wiring patch v1

Status: **WORKSTREAM B / NOT APPLIED / evidence-infrastructure only**

## Purpose

Expose the standard Substrate GRANDPA RPC on the current Materios node so B3-A can obtain a real FinalityProof<Block::Header> without introducing a second finality protocol.

This patch does **not**:
- modify GRANDPA consensus semantics;
- modify authority selection;
- reimplement the Materios selector;
- change IMMORTAL V3, Reveal, or economic semantics;
- declare the returned bytes canonical.

## Grounding

The current Materios node already:
- depends on sc-consensus-grandpa-rpc;
- constructs grandpa_block_import and grandpa_link;
- runs the GRANDPA voter;
- uses the pinned polkadot-stable2409-4 SDK family.

The current partnerchain/node/src/rpc.rs does not merge the standard GRANDPA RPC and the current service-side RPC builder does not pass the GRANDPA dependencies into create_full.

The pinned SDK's canonical integration constructs:
- grandpa_link.justification_stream();
- grandpa_link.shared_authority_set().clone();
- SharedVoterState::empty();
- FinalityProofProvider::new_for_service(backend.clone(), Some(shared_authority_set.clone()));

then passes these through GrandpaDeps and merges Grandpa::new(...).into_rpc().

## Exact patch

### 1. partnerchain/node/src/rpc.rs

Add the GRANDPA dependency types:

`rust
use sc_consensus_grandpa::{
    FinalityProofProvider,
    GrandpaJustificationStream,
    SharedAuthoritySet,
    SharedVoterState,
};
pub use sc_rpc::SubscriptionTaskExecutor;
`

Add:

`rust
pub struct GrandpaDeps<B> {
    pub shared_voter_state: SharedVoterState,
    pub shared_authority_set: SharedAuthoritySet<
        Block::Hash,
        <Block as sp_runtime::traits::Block>::Header::Number,
    >,
    pub justification_stream: GrandpaJustificationStream<Block>,
    pub subscription_executor: SubscriptionTaskExecutor,
    pub finality_provider: std::sync::Arc<FinalityProofProvider<B, Block>>,
}
`

Extend FullDeps with:

`rust
pub grandpa: GrandpaDeps<B>,
pub backend: std::sync::Arc<B>,
`

and make create_full generic over B with the backend bound required by FinalityProofProvider.

Inside create_full, merge the standard SDK handler:

`rust
use sc_consensus_grandpa_rpc::{Grandpa, GrandpaApiServer};

let GrandpaDeps {
    shared_voter_state,
    shared_authority_set,
    justification_stream,
    subscription_executor,
    finality_provider,
} = grandpa;

module.merge(
    Grandpa::new(
        subscription_executor,
        shared_authority_set,
        shared_voter_state,
        justification_stream,
        finality_provider,
    )
    .into_rpc(),
)?;
`

No custom RPC method or custom finality format is introduced.

### 2. partnerchain/node/src/service.rs

Immediately after grandpa_block_import and grandpa_link are created, retain the RPC-side handles:

`rust
let justification_stream = grandpa_link.justification_stream();
let shared_authority_set = grandpa_link.shared_authority_set().clone();
let shared_voter_state = SharedVoterState::empty();

let finality_proof_provider =
    sc_consensus_grandpa::FinalityProofProvider::new_for_service(
        backend.clone(),
        Some(shared_authority_set.clone()),
    );
`

Change the RPC builder to receive the SDK-provided subscription executor:

`rust
let rpc_extensions_builder = {
    let client = client.clone();
    let pool = transaction_pool.clone();
    let backend = backend.clone();

    move |subscription_executor: sc_rpc::SubscriptionTaskExecutor| {
        let deps = crate::rpc::FullDeps {
            client: client.clone(),
            pool: pool.clone(),
            backend: backend.clone(),
            grandpa: crate::rpc::GrandpaDeps {
                shared_voter_state: shared_voter_state.clone(),
                shared_authority_set: shared_authority_set.clone(),
                justification_stream: justification_stream.clone(),
                subscription_executor,
                finality_provider: finality_proof_provider.clone(),
            },
        };

        crate::rpc::create_full(deps).map_err(Into::into)
    }
};
`

When constructing the final GrandpaParams, reuse the same state handle:

`rust
shared_voter_state: shared_voter_state.clone(),
`

and keep the original grandpa_link in the voter setup.

## Acceptance evidence

The patch is considered operational only when a real Materios node built from the patched source can satisfy all of:

1. grandpa_proveFinality(block_number) returns non-null data for a finalized block.
2. The returned bytes decode as the pinned SDK FinalityProof<Block::Header>.
3. The outer proof binds to the requested checkpoint block/hash.
4. The inner GRANDPA justification is extracted and independently verified.
5. The authority set/set-id used for the justification is independently established.
6. Required ancestry is independently verified.
7. Only after the above does the IMMORTAL side compose the result toward VerifiedAuthoritySetTransition.

A successful RPC response alone is **not** B3-A proof.

## Rollout rule

This document is a handoff for the Materios operator/upstream node repository. It is intentionally kept on Workstream B and is not promoted to main merely because the patch is specified.

If applied upstream, the resulting node build/commit must be recorded as evidence alongside:
- node commit SHA;
- runtime/spec version;
- exact checkpoint hash/number;
- returned FinalityProof bytes/hash;
- authority set/set-id;
- independent verifier result.

## Source anchors

Pinned SDK API shape:
- sc-consensus-grandpa-rpc::Grandpa::new(...);
- sc-consensus-grandpa-rpc::GrandpaApiServer;
- sc-consensus-grandpa::FinalityProofProvider::new_for_service(...);
- sc_service::SpawnTasksParams::rpc_builder: Fn(SubscriptionTaskExecutor) -> ...

Materios current integration points:
- partnerchain/node/src/rpc.rs
- partnerchain/node/src/service.rs
- partnerchain/node/Cargo.toml

This remains an infrastructure patch proposal until a real node build and real finalized proof fixture exist.
