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

### Operational constraint — no private Materios node or upstream changes

For the current IMMORTAL work, a self-hosted Materios node or an upstream RPC patch is **not an available execution path**. The implementation must use only the interfaces and evidence that Materios already exposes publicly. The node-wiring recipe above is reference material, not an action item for this project.

The 2026-10-20 live run confirms the current public surfaces return finalized heads and useful storage-read proofs, but do not provide a consumable GRANDPA finality proof through the paths tested:
- `grandpa_proveFinality(blockNumber)`: reported unavailable by the finalized-state capture;
- `chain_getBlock(...).justifications`: `null` on both public RPC URLs at the observed finalized head and no GRANDPA justification found in the 768-block scan.

This does not prove that Materios consensus lacks GRANDPA finality. It proves only that the current public interfaces do not supply the required proof to this workflow. We must not ask the user to operate a node, imply that we can patch Materios, or treat an unverified RPC response as canonical evidence.

### Available paths and their exact scope

1. **Materios receipts + native storage proof — usable now.** Continue using the existing public receipt/Firehose/events path and independently verify the storage proof against the captured state root. This establishes the receipt/storage claim covered by that proof, not GRANDPA finality or publisher-independent Beacon canonicality.
2. **A third-party proof publisher/relayer — only if an actual public source is identified.** The IMMORTAL verifier can accept proof bytes without contacting Materios, but the publisher must deliver real GRANDPA justification bytes and enough authenticated authority-set/transition evidence. No such public source has yet been demonstrated; do not mark this route available until a live fixture is captured.
3. **A different public randomness beacon — a separate design option.** A public beacon such as a threshold beacon or a VRF-backed service may replace the randomness input only after its verification and Cardano integration are specified and tested. It does not prove Materios receipt authenticity, Materios state, or Materios finality; those claims must remain separate.
4. **Keep the current authorized-publisher B1 boundary and defer B3.** This is the honest fallback if no independently verifiable public proof source can be demonstrated. It is not publisher-independent canonicality and must be labelled accordingly.

### Decision for this branch

Do not implement a self-hosted-node workaround. First exhaust the already-existing public Materios receipt/anchor interfaces and record exactly which evidence classes they support. In parallel, evaluate a genuinely available external source for the missing Beacon/randomness requirement, keeping randomness authenticity distinct from remote-chain finality. B3 remains OPEN until the selected path supplies verifiable evidence for every claim it makes.

### B3 consequence

That node wiring is reference material only and is not an available route for this project. B3 can advance only if a public interface or independently identified public proof publisher supplies SDK-native `FinalityProof` bytes and authenticated authority-set/transition evidence. Even then, the IMMORTAL side must independently decode the outer proof, bind its target block/hash, decode and verify the inner GRANDPA justification against the authenticated authority-set state, and connect that finality result to the selection/enactment transition.

Status remains:

**standard RPC dependency FOUND; node registration/wiring NOT PRESENT in current upstream main; no private-node/upstream-patch route available to this project; public proof fixture OPEN.**

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

Do not change Materios's attestor and do not weaken the B3-A trust boundary. The IMMORTAL-side verifier, finality-proof decoder, and conformance tests are present, but the public RPC surface still does not provide a usable proof. The previously described operator-controlled node/upstream-registration route is NOT available to this project and is not an action item. Continue only with public interfaces or an independently identified public proof publisher. Until real proof bytes are captured and independently checked against authenticated authority-set provenance, B3-A remains **OPEN** even though B3-B is **PASS**.

## Live Preprod re-check — 2026-10-21 (IMMORTAL run #75)

Source run: [Materios B3 execution-proof verifier — run #75](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39545521252).

Commit under test: `d50bc98b28f1b8286804825ef2fe529b2d5930f4`.

### Confirmed results

- `verifier`: **PASS** (`cargo fmt --check` and Rust tests).
- `finalized-state-capture`: **PASS as extraction only**; captured finalized block `2377963`, hash `0xdc6ae22ae6dcb45cf20baaddbf3a1bf1b90aaa150b8025ae99198bc4a0b52262`, state root `0xad7bdbc7038b02b906467cca6dd52f372fcaa4492442fdd64066ac97091dbeeb`.
- `live-storage-proof`: **PASS**; artifact `materios-b3b-live-storage-proof` (ID `12321248280`) validates the exact receipt storage read proof with 10 proof nodes. Receipt ID: `0x9d50f29cbdf389aa37268afde8aaa536fd305a461a6cd77574d4b7ff23c4a78f`; certified block: `2377963`.
- `real-grandpa-witness`: **FAIL / B3-A OPEN**; the 768-block scan ended with `NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_DENSE_SCAN`.

The newly instrumented RPC probe records the same limitation on both `https://materios.fluxpointstudios.com/rpc` and `https://materios.fluxpointstudios.com/preprod-rpc`: `grandpa_proveFinality(2377963)` returns JSON-RPC `-32601 Method not found`, while `chain_getBlock(finalizedHash).justifications` is `null`.

The finalized-state artifact (ID `12321138478`) captures `finality_proof.status = unavailable`; it also records authority set ID `4213` and five authorities from RPC state. Those authority values are not authenticated by this capture. Reading them is not a substitute for a finality proof or proof of authority-set provenance.

### Source-level cross-check

The current Materios upstream source at commit [`f1c8b400a229258298236d9337247135b6c1112e`](https://github.com/Flux-Point-Studios/materios/commit/f1c8b400a229258298236d9337247135b6c1112e) is consistent with the observed RPC response: [`partnerchain/node/src/rpc.rs`](https://github.com/Flux-Point-Studios/materios/blob/f1c8b400a229258298236d9337247135b6c1112e/partnerchain/node/src/rpc.rs) registers the System, Orinq Receipts, and MOTRA RPC modules, but does not merge the standard GRANDPA RPC module. [`partnerchain/node/src/service.rs`](https://github.com/Flux-Point-Studios/materios/blob/f1c8b400a229258298236d9337247135b6c1112e/partnerchain/node/src/service.rs) contains GRANDPA consensus/service wiring, and `partnerchain/node/Cargo.toml` includes `sc-consensus-grandpa-rpc`.

This supports a transport-surface diagnosis, not a claim that Materios lacks GRANDPA consensus finality: the current public RPC assembly does not expose the needed proof route, and the public block responses sampled by CI do not carry justifications.

### Decision and next acceptance gate

Materios remains useful for receipt lookup and independently verified storage-read proofs, but those proofs must remain separate from finality claims. B3-A stays **OPEN** and overall B3 is **NOT APPROVED**. Do not use `chain_getFinalizedHead`, authority data returned by the same RPC, or a storage proof alone as a replacement for independently verified GRANDPA finality.

The next admissible path is an independently identified public proof publisher or externally operated archive RPC that returns actual `FinalityProof` / GRANDPA justification bytes for an exact checkpoint, followed by independent verification of the outer proof, inner justification, ancestry, signatures, quorum, and authenticated authority-set transitions. No private Materios node, upstream patch, or weakening of the trust boundary is assumed. If no such public interface is found, scope Materios to receipts/storage and use a separate finality source for the remaining requirements.

## Archive-source availability probe — 2026-10-21 (IMMORTAL run #77)

Source run: [Materios B3 execution-proof verifier — run #77](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39546610725).

Commit under test: `d6b30227303afe2192463b1e4236918cbac26680`.

- `verifier`: **PASS**.
- `finalized-state-capture`: **PASS as extraction only**.
- `live-storage-proof`: **PASS**.
- `real-grandpa-witness`: **FAIL / B3-A OPEN**, as required by the missing proof.
- The safe probe reported `archiveRpcConfigured: false`; the existing GitHub Actions secret `MATERIOS_ARCHIVE_RPC` is not configured for this workflow. No secret value or endpoint URL was printed.
- Both named public RPC sources again reported `grandpa_proveFinality` as JSON-RPC `-32601 / method-not-found` and `chain_getBlock(...).justifications = null`.
- The dense scan ended with `NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_DENSE_SCAN`.

### Operational conclusion

At this revision, the only published Materios RPC URLs found in the repository are the primary `/rpc` and legacy `/preprod-rpc` endpoints. The gateway's public `/chain-info` route exposes metadata and a finalized block number but is not a GRANDPA-proof publisher. The optional archive-RPC secret is absent. Therefore there is no already-configured alternate public archive/proof source available to this workflow. This is an evidence-based operational limitation, not proof that no third-party or future public proof publisher could exist.

Do not treat `chain_getFinalizedHead`, the authority list read from the same RPC, a committee receipt certificate, or a storage read proof as a replacement for a verified GRANDPA finality proof. Keep Materios scoped to receipt/storage evidence while B3-A remains **OPEN**; only reopen finality qualification when an independently identified public endpoint produces actual `FinalityProof` or GRANDPA justification bytes bound to an exact checkpoint and the authority-set transition chain can be authenticated.


## Public-surface and upstream issue review — 2026-10-21 (IMMORTAL run #78)

Source run: [Materios B3 execution-proof verifier — run #78](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39547923965).
Commit under test: `212bd831b7dc59bbd28fd85c97850946182c6db3`.

- `verifier`: **PASS**; formatting and Rust tests passed.
- `finalized-state-capture`: **PASS as extraction only**.
- `live-storage-proof`: **PASS**; independent native storage-proof verification completed.
- `real-grandpa-witness`: **FAIL / B3-A OPEN**.
- Public primary RPC reported finalized block 2,378,225; legacy RPC reported 2,378,226 at a later observation. Both returned `grandpa_proveFinality` as `-32601 method-not-found` and `chain_getBlock(...).justifications = null`.
- The collector scanned blocks 2,377,458–2,378,226 (769 blocks) and found no FRNK justification. `MATERIOS_ARCHIVE_RPC` remains unconfigured.
- Unlike runs #76–#77, the collector now writes a bounded JSON diagnostic with the scan manifest before returning nonzero. Artifact upload succeeded: [materios-real-grandpa-witness artifact](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39547923965/artifacts/12322611342), ZIP SHA-256 `0c872a33b868cdfcbeb5fa61889a26a630d0af2a8fbf4012175ef51d7d41fcec`. This is evidence of what this RPC exposed over this scan window, not evidence that consensus finality is absent.
- `Materios Canonical Evidence & Finality Boundary` run #150 passed: [run #150](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39547923974).

### Upstream commits/issues triangulation

The latest observed upstream Materios `main` commit is [`f1c8b400a229258298236d9337247135b6c1112e`](https://github.com/Flux-Point-Studios/materios/commit/f1c8b400a229258298236d9337247135b6c1112e), dated 2026-10-20. The current `partnerchain/node/src/rpc.rs` still registers System, Orinq Receipts and MOTRA without merging the standard GRANDPA RPC module. The current open upstream PR scan found no GRANDPA/finality/RPC exposure change; the only open PR matching authority/committee terms was [PR #97](https://github.com/Flux-Point-Studios/materios/pull/97), a raw-genesis committee guard, not a finality-proof publisher. Recent merged receipt/committee changes therefore do not supply the missing proof transport.

Two additional upstream issues matter to the trust model but must not be overstated:

- [Issue #105](https://github.com/Flux-Point-Studios/materios/issues/105) documents a preprod-v6 committee-selection rule that can read a moving Cardano epoch while it is still current. It says history may fail to re-verify from genesis; it also explicitly says no replay identified a concrete failing block. This is an unresolved authority-transition reproducibility risk, not proof that a specific observed block is invalid.
- [Issue #107](https://github.com/Flux-Point-Studios/materios/issues/107) and [issue #112](https://github.com/Flux-Point-Studios/materios/issues/112) discuss small-order / publicly forgeable authority keys in launch-preflight and the raw-genesis guard. They are additional authority-key qualification concerns, not evidence that the live authority set captured by IMMORTAL contains such a key.

The operator-kit public endpoints provide receipts, attestations, liveness heartbeats and related services, but the published README does not describe a GRANDPA justification/finality-proof publishing API. No independent public proof publisher was identified in this review.

### Current decision

**B3-B storage-proof path: PASS. B3-A GRANDPA finality and authenticated authority transition: OPEN. Overall B3: NOT APPROVED.** The drand Plutus V3 PoC is a separate result: it proves that a real Quicknet BLS signature can be verified by the isolated local Cardano script, but it does not authenticate Materios blocks or committee transitions.

Do not spend further cycles increasing the scan window against the same two RPC surfaces unless their capabilities change. The next evidence-producing action is to identify a genuinely reachable public proof source that returns SDK-native `FinalityProof` / justification bytes and a path to authenticated authority-set transitions. Otherwise, keep Materios claims limited to receipts and storage proofs, and keep randomness-source claims separate from Materios finality.


## Fresh CI + upstream recheck — 2026-10-23 (B3 verifier run #104)

Source runs:
- [Materios B3 execution-proof verifier — run #104](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986), commit `11fae8a1f030bcbe177eab6ee2ae99a96f080ca6`.
- [Materios Canonical Evidence & Finality Boundary — run #159](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665932), same commit.

Observed CI:
- Canonical Evidence & Finality Boundary: **SUCCESS**. Runtime authenticity guard tests and corrected expectations pass.
- B3 execution-proof verifier: Rust verifier tests/formatting **PASS**; finalized-state capture **PASS as extraction only**; live storage proof **PASS**; real GRANDPA witness job **FAIL**, leaving B3-A **OPEN**.
- Both public RPC endpoints (`/rpc`, `/preprod-rpc`) returned the same finalized head at height 2,409,483 during this run. Both returned `grandpa_proveFinality` as JSON-RPC `-32601 / method-not-found`; the finalized block's `justifications` field was `null`.
- The collector scanned heights 2,408,715–2,409,483 (769 block heights) and found no FRNK justification. It wrote and uploaded a bounded negative diagnostic artifact: [run #104 artifact](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986/artifacts/12493185719). This proves only what these RPC responses exposed during this bounded observation; it does not prove absence of GRANDPA consensus finality.

### Upstream state rechecked

- Materios `main` is now observed at [`7d5c36e7dcd60824d84353e93df5d4a03c9c6c30`](https://github.com/Flux-Point-Studios/materios/commit/7d5c36e7dcd60824d84353e93df5d4a03c9c6c30), dated 2026-10-21.
- The live source [`partnerchain/node/src/rpc.rs`](https://github.com/Flux-Point-Studios/materios/blob/7d5c36e7dcd60824d84353e93df5d4a03c9c6c30/partnerchain/node/src/rpc.rs) still merges only System, Orinq Receipts and MOTRA RPC modules; it does not register the standard GRANDPA RPC module.
- [Upstream issue #50](https://github.com/Flux-Point-Studios/materios/issues/50), requesting the narrow execution-proof RPC `materios_b3_calculateCommitteeProof`, is **closed**, but its issue record has no comments and the current RPC source does not contain that registration. Closure alone is not implementation evidence. This endpoint would provide execution proof for authority-selection inputs; it is not itself a substitute for GRANDPA finality proof.
- No code or configuration change has been made to Materios upstream by this audit.

### Decision / next action

Do **not** repeat a larger scan against the same two RPC URLs while their capabilities remain unchanged. The current failure is source availability, not a demonstrated defect in the GRANDPA signature verifier. Next evidence-producing path: find an already reachable, independent public proof publisher/archive that returns SDK-native GRANDPA `FinalityProof` or justification bytes and supports an authenticated authority-transition chain. If none exists, B3-A remains **OPEN**, Materios claims stay scoped to receipts/storage proofs, and overall B3 remains **NOT APPROVED**. Do not infer finality from `chain_getFinalizedHead`, authority data served by the same RPC, storage proofs, or operator attestations.
