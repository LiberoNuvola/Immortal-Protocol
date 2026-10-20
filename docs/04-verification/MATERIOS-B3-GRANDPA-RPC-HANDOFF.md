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

The standard SDK wiring would use:

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

## Standard-node evidence route

The pinned Substrate SDK exposes block data as `SignedBlock`, whose `justifications` field is populated from the node's local blockchain backend. This gives the Adapter a second, non-Materios-specific evidence source:

```
chain_getBlock(finalized_hash)
        |
        +--> block.header
        |
        +--> justifications[[engine_id, encoded_justification]]
                         |
                         +--> engine `FRNK` (GRANDPA)
```

This route is preferable to treating the absence of `grandpa_proveFinality` as a missing protocol capability. It uses a standard Substrate read surface already present in the node stack. The response remains untrusted transport evidence: the Adapter must decode the GRANDPA justification and verify signatures, quorum, ancestry, and the authority-set provenance before crossing the B3-A verified boundary.

A block may legitimately have no stored justification. Therefore the implementation keeps `grandpa_proveFinality` as the first source and `chain_getBlock.justifications` as the fallback, rather than assuming every finalized block carries a justification.

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
- Independent GRANDPA SCALE decoding: **IMPLEMENTED**
- Independent GRANDPA signature/quorum/ancestry verification: **IMPLEMENTED against authenticated authority state**
- Standard outer FinalityProof decoding + checkpoint bridge verification: **IMPLEMENTED**
- Canonical authority-set provenance: **OPEN**
- Real finalized Materios proof fixture: **OPEN**

## Exact current-node integration point

A fresh inspection of Materios `partnerchain/node/src/service.rs` shows that the node already constructs:

- `grandpa_block_import`;
- `grandpa_link`;
- the GRANDPA network protocol;
- the GRANDPA voter.

The RPC builder currently captures only `client` and `transaction_pool`, then calls `crate::rpc::create_full(deps)`. It does not pass the GRANDPA link into RPC construction.

Therefore the missing wiring is narrower than adding GRANDPA consensus itself.

The service-side integration must retain/derive, before `grandpa_link` is moved into the voter:

```rust
let justification_stream = grandpa_link.justification_stream();
let shared_authority_set = grandpa_link.shared_authority_set().clone();
let shared_voter_state = SharedVoterState::empty();

let finality_proof_provider =
    sc_consensus_grandpa::FinalityProofProvider::new_for_service(
        backend.clone(),
        Some(shared_authority_set.clone()),
    );
```

and place those values into `FullDeps` for the RPC builder.

The existing voter setup must continue to receive the original `grandpa_link`; the RPC integration must not replace or duplicate the consensus link.

The node RPC module should then instantiate the SDK GRANDPA handler with:

```rust
sc_consensus_grandpa_rpc::Grandpa::new(
    subscription_executor,
    shared_authority_set,
    shared_voter_state,
    justification_stream,
    finality_proof_provider,
).into_rpc()
```

The exact `SubscriptionTaskExecutor` value comes from the RPC builder closure supplied by `spawn_tasks`.

### Important correction

The current Materios `node/Cargo.toml` **already contains**:

`sc-consensus-grandpa-rpc = { workspace = true }`

so no new dependency is required in the node crate. The blocker is registration/wiring, not dependency availability.

### Self-hosted route — no paid managed service required

The public Materios Gateway is a separate service layer. Its published README lists billing controls for selected gateway endpoints, but it does not publish `grandpa_proveFinality` as a paid API. The Materios node itself is published as open source and the project documents running a full node locally; full-validator operation is described as invite-only. Therefore there is no evidence in the published materials that B3-A requires paying for `grandpa_proveFinality` itself.

The practical non-managed route is to run a compatible Materios full node locally, wire the standard GRANDPA RPC into that node, and point the IMMORTAL Adapter at the local endpoint. This avoids dependence on the public RPC surface and does not change the cryptographic requirement: the Adapter still verifies the raw proof independently.

This is an infrastructure route, not a new consensus rule and not a bypass of the B3 evidence contract.

### B3 consequence

Once this wiring exists in a self-hosted or upstream build, the standard RPC can produce the SDK-native `FinalityProof` bytes. That still does not close B3: the IMMORTAL side must independently decode the outer proof, bind its target block/hash, decode and verify the inner GRANDPA justification against the authenticated authority-set state, and connect that finality result to the selection/enactment transition.

Status remains:

**standard RPC dependency FOUND; node registration/wiring NOT PRESENT in current upstream main; self-hosted integration is the actionable route; real proof fixture OPEN.**

## Live Preprod finding — 2026-10-11

A real finalized-state capture was executed against:

`https://materios.fluxpointstudios.com/preprod-rpc`

The live capture succeeded for the checkpoint envelope and recorded:

- finalized block: `2236627`
- finalized hash: `0xea192be56ca72c6824f824abe8dc55441681ff8fe3d12cd4a6de67628b0a027b`
- state root: `0x0d694f1102edd3214a61ace3027aaea594162680fd550aa984c075f434badef3`
- GRANDPA set id: `3976`
- GRANDPA authority count: `5`

The same capture reported:

`grandpa_proveFinality` → `unavailable`

This is an infrastructure/surface limitation of the public Preprod RPC, not a finality-verifier failure.

### Exact upstream wiring identified

The repository already depends on the pinned `sc-consensus-grandpa-rpc`, but the current `partnerchain/node/src/service.rs` does not construct a `FinalityProofProvider` or pass GRANDPA RPC dependencies into `node_rpc::FullDeps`.

The missing step is therefore both to construct the provider from the existing `grandpa_link`/backend and to pass those dependencies through `node_rpc::FullDeps`, then merge the standard GRANDPA RPC:

`Grandpa::new(subscription_executor, shared_authority_set, shared_voter_state, justification_stream, finality_proof_provider).into_rpc()`

This is the standard API shape from the pinned `polkadot-stable2409-4` SDK. No new finality protocol or custom proof format is required.

### Acceptance after upstream deployment

A new real Preprod capture must show:

1. `grandpa_proveFinality(block_number)` returns non-null SCALE `FinalityProof<Block::Header>`.
2. The proof decodes independently.
3. Its target block is bound to the captured finalized checkpoint.
4. The embedded GRANDPA justification verifies against the authenticated authority set and set id.
5. All required ancestry headers verify.
6. Only after 1–5 may the result cross the IMMORTAL `VerifiedAuthoritySetTransition` boundary.

Until these conditions hold, B3-A remains OPEN.


### Exact upstream patch shape

**`partnerchain/node/src/rpc.rs`**

Extend `FullDeps` with a GRANDPA dependency bundle:

```rust
pub struct GrandpaDeps<B> {
    pub shared_voter_state: sc_consensus_grandpa::SharedVoterState,
    pub shared_authority_set:
        sc_consensus_grandpa::SharedAuthoritySet<
            <Block as sp_runtime::traits::Block>::Hash,
            <Block as sp_runtime::traits::Block>::Header::Number,
        >,
    pub justification_stream:
        sc_consensus_grandpa::GrandpaJustificationStream<Block>,
    pub subscription_executor:
        sc_rpc::SubscriptionTaskExecutor,
    pub finality_proof_provider:
        std::sync::Arc<
            sc_consensus_grandpa::FinalityProofProvider<B, Block>,
        >,
}
```

The `create_full` bounds must additionally provide the backend required by `FinalityProofProvider`, and the function must merge:

```rust
use sc_consensus_grandpa_rpc::{
    Grandpa,
    GrandpaApiServer,
};

module.merge(
    Grandpa::new(
        grandpa.subscription_executor,
        grandpa.shared_authority_set,
        grandpa.shared_voter_state,
        grandpa.justification_stream,
        grandpa.finality_proof_provider,
    )
    .into_rpc(),
)?;
```

**`partnerchain/node/src/service.rs`**

Immediately after `grandpa_block_import/grandpa_link` are created, derive:

```rust
let shared_authority_set =
    grandpa_link.shared_authority_set().clone();

let justification_stream =
    grandpa_link.justification_stream();

let shared_voter_state =
    sc_consensus_grandpa::SharedVoterState::empty();

let finality_proof_provider =
    sc_consensus_grandpa::FinalityProofProvider::new_for_service(
        backend.clone(),
        Some(shared_authority_set.clone()),
    );
```

Pass these into `crate::rpc::FullDeps`. Reuse the same `shared_voter_state` in `GrandpaParams` rather than constructing an unrelated second instance.

No selector logic, no new proof format, and no change to consensus rules is involved.

## Live Preprod re-check — 2026-10-20 (IMMORTAL run #74)

Source run:
https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39456195906

Commit under test: `06080f8cfd02afdd48d8751a428da17adf9737f3`.

### Confirmed results

- `verifier`: **PASS** (`cargo fmt --check` and Rust tests).
- `finalized-state-capture`: **PASS as extraction only**; captured block `2370597`, hash `0xe6819c1da3977dc101d96f616672a9668855f85ba677ca9591bd9b552a1646a0`.
- `live-storage-proof`: **PASS**; independently verified native storage proof against the captured state root (`B3_B_RESULT=PASS`).
- `real-grandpa-witness`: **FAIL / B3-A OPEN**; both public RPC surfaces returned `justifications: null` at the sampled finalized head and the 768-block scan found no attached GRANDPA justification.

The B3-B live capture selected receipt `0xa5e2ccaacb5965a57422ece5c887b62b4458c0c7f0ebd034f4353b2c929e7454`, recorded 10 proof nodes and 3,033 SCALE proof bytes, and uploaded artifact `materios-b3b-live-storage-proof` (artifact ID `12281211833`, SHA-256 `df953a86e27bf8ec0e01aaa589fbaa01d367897848d468e388b5341ca1bd7706`). This proves the storage-read proof path for that captured receipt; it does **not** prove GRANDPA finality or authority-set provenance.

The finalized-state capture reported `GRANDPA finality proof status: unavailable`. The later RPC probe in the same run observed finalized block `2370598` with hash `0xb3e3c04168e408fab78892c3653b0b022bbd195cfe0ea52417ba0856a9e63517`; both `/rpc` and `/preprod-rpc` returned `justifications: null`. These are separate observations made at different times, so the block-number difference is expected and is not itself a consistency failure.

### Decision

Do not change Materios's attestor and do not weaken the B3-A trust boundary. The IMMORTAL-side verifier, finality-proof decoder, and conformance tests are present, but the public RPC surface still does not provide a usable proof. The next executable route is an operator-controlled compatible Materios node exposing the standard GRANDPA RPC / local justification store, or a separately approved change to the upstream RPC registration. Until real proof bytes are captured and independently checked against authenticated authority-set provenance, B3-A remains **OPEN** even though B3-B is **PASS**.

