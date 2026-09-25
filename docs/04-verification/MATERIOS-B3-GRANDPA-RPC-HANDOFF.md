# Materios B3 — standard GRANDPA RPC handoff

> Reference-only handoff. This document does not claim that the upstream Materios node has been modified.

## Finding

The locked Polkadot SDK provides the standard GRANDPA RPC:

`grandpa_proveFinality(blockNumber)`

which returns SCALE-encoded `FinalityProof<Block::Header>`.

The same RPC module also provides:

`grandpa_subscribeJustifications`

The current Materios node already depends on `sc-consensus-grandpa-rpc` but its `create_full` RPC assembly does not currently merge that module.

## Exact SDK proof object

The SDK's `FinalityProof<Header>` contains:

- `block: Header::Hash` — the block whose justification is supplied;
- `justification: Vec<u8>` — SCALE-encoded `GrandpaJustification<Header>`;
- `unknown_headers: Vec<Header>` — ordered headers between the requested block and the justification target.

The RPC therefore returns an outer proof object, not the inner justification directly.

The inner `GrandpaJustification` contains:

- `round: u64`;
- `commit`;
- `votes_ancestries`.

The existing IMMORTAL GRANDPA verifier operates on that inner justification and separately verifies ancestry.

## Materios service wiring

The current Materios `new_partial()` already creates:

`grandpa_block_import`

and:

`grandpa_link`.

The standard SDK wiring uses:

```rust
let justification_stream = grandpa_link.justification_stream();
let shared_authority_set = grandpa_link.shared_authority_set().clone();
let shared_voter_state = sc_consensus_grandpa::SharedVoterState::empty();

let finality_proof_provider =
    sc_consensus_grandpa::FinalityProofProvider::new_for_service(
        backend.clone(),
        Some(shared_authority_set.clone()),
    );
```

The same `shared_voter_state` must be passed to the GRANDPA voter and retained for the RPC setup.

The RPC dependencies then carry:

```rust
grandpa: GrandpaDeps {
    shared_voter_state,
    shared_authority_set,
    justification_stream,
    subscription_executor,
    finality_provider,
},
```

where `GrandpaDeps` is the node-RPC-side dependency container.

## Minimal upstream change

The Materios node should merge the standard GRANDPA RPC module into `create_full` rather than implementing a second finality protocol.

Conceptually:

```rust
use sc_consensus_grandpa_rpc::Grandpa;

module.merge(
    Grandpa::new(
        subscription_executor,
        shared_authority_set,
        shared_voter_state,
        justification_stream,
        finality_proof_provider,
    )
    .into_rpc(),
)?;
```

The exact type aliases/import paths should follow the crate's current API at the Materios-locked SDK revision.

The node's existing `FullDeps<C, P>` must therefore be extended with the GRANDPA RPC dependencies.

## B3 evidence contract

The adapter must request the proof for the exact block number belonging to the exact checkpoint under verification.

A valid capture binds:

`requestedBlockNumber -> requestedBlockHash`

by fetching the header at the checkpoint hash and requiring the proof's target/covered block relation to match the checkpoint.

The proof transport is untrusted evidence.

It must not be interpreted as:

- proof of canonicality merely because the RPC returned bytes;
- proof that the caller selected the canonical checkpoint;
- proof that the authority set supplied separately is authentic.

Independent verification remains mandatory.

## Relation to the existing IMMORTAL verifier

The expected pipeline is:

```
grandpa_proveFinality(blockNumber)
          |
          v
SCALE FinalityProof<Block::Header>
          |
          +--> outer block hash
          |
          +--> inner GrandpaJustification bytes
          |
          +--> unknown ancestry headers
          |
          v
independent SCALE decode
          |
          v
existing GRANDPA verifier
          |
          +--> target hash/number
          +--> signer uniqueness
          +--> signatures
          +--> quorum
          +--> ancestry
          |
          v
verified finality result
```

The existing verifier's current trust boundary still requires a verified authority state. Therefore POC-1 remains incomplete until the authority-set provenance/transition boundary is independently authenticated.

## Failure modes that must stay explicit

- RPC unavailable: transport failure, not finality failure;
- RPC returns `null`: no finality proof available;
- proof target differs from requested checkpoint: reject;
- malformed outer SCALE: reject;
- malformed inner justification SCALE: reject;
- invalid signatures/quorum/ancestry: reject;
- authority-set provenance unresolved: remain OPEN;
- proof from a non-canonical block: reject at the outer checkpoint/finality binding layer.

## Current status

- Standard `grandpa_proveFinality` primitive: **FOUND**
- Exact outer `FinalityProof` shape: **FOUND**
- IMMORTAL transport client: **IMPLEMENTED**
- Upstream Materios node exposing standard GRANDPA RPC: **NOT PRESENT IN CURRENT `main` RPC ASSEMBLY**
- Upstream RPC patch: **DEFINED / NOT APPLIED**
- Independent GRANDPA decode/verification: **IN PROGRESS**
- Canonical authority-set provenance: **OPEN**
- Real finalized Materios proof fixture: **OPEN**
