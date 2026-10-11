# MATERIOS B3-A — Operator Evidence Acquisition Handoff v1

Status: **OPEN / OPERATOR ACTION REQUIRED**

This document is an operational handoff for Workstream B. It does not change IMMORTAL semantics, V3, Reveal, or the Materios selector.

## 1. Objective

Materialize the first real B3-A evidence packet by obtaining, from one compatible Materios node/runtime instance:

1. a real GRANDPA finality proof for the exact target block;
2. the authoritative GRANDPA authority set / set id used by that proof;
3. the exact authority-selection input commitment carried by the canonical block;
4. a native runtime execution proof for `SessionValidatorManagementApi_calculate_committee`;
5. the evidence needed to connect selection → enactment → finality → canonical finalized block.

B3-A remains OPEN until the resulting witness crosses IMMORTAL's `VerifiedAuthoritySetTransition` boundary.

## 2. What is already closed on the IMMORTAL side

The IMMORTAL repository already contains:

- GRANDPA justification structures and independent verification primitives;
- exact hash+number binding for the activation block;
- `toSetId = fromSetId + 1` as an invariant;
- extraction of the exact `selection_inputs_hash` from the canonical Materios `SessionCommitteeManagement::set` inherent;
- the `materios-execution-proof-v2` transport envelope;
- independent runtime-code binding and execution-proof packet validation;
- the evidence contract forbidding selector reimplementation and synthetic proofs.

No additional selector or TypeScript authority-selection implementation is required.

## 3. Current Materios boundary — transport is the only missing public surface

The current Materios node already depends on:

`sc-consensus-grandpa-rpc`

and already constructs:

`grandpa_block_import`
`grandpa_link`

while `partnerchain/node/src/rpc.rs` currently registers only:

- System RPC
- Orinq Receipts RPC
- MOTRA RPC

Therefore the standard GRANDPA RPC module and a B3 execution-proof RPC are **not exposed publicly**.

That is no longer treated as the primary blocker. The native Substrate client already implements:

`ProofProvider::execution_proof(block_hash, method, call_data)`

by delegating to:

`CallExecutor::prove_execution(hash, method, call_data)`

and a real Full Validator runs the concrete Materios `FullClient` locally.

**Primary acquisition path:** use the real operator node locally and obtain the stored GRANDPA justification and native execution proof from the local client; export the resulting witness as an immutable evidence artifact.

**Fallback only:** add public GRANDPA/proof transport to a pinned Materios node build.

## 4. Required node change A — standard GRANDPA RPC

Use the standard SDK integration already verified against the pinned Materios SDK line.

In `service.rs`, preserve the existing `grandpa_link` and create the shared state once:

```rust
let justification_stream = grandpa_link.justification_stream();
let shared_authority_set = grandpa_link.shared_authority_set().clone();
let shared_voter_state = sc_consensus_grandpa::SharedVoterState::empty();
let shared_voter_state2 = shared_voter_state.clone();
let finality_proof_provider =
    sc_consensus_grandpa::FinalityProofProvider::new_for_service(
        backend.clone(),
        Some(shared_authority_set.clone()),
    );
```

Pass those values through `rpc::FullDeps` / `rpc::GrandpaDeps` and merge:

```rust
sc_consensus_grandpa_rpc::Grandpa::new(
    subscription_executor,
    shared_authority_set,
    shared_voter_state,
    justification_stream,
    finality_proof_provider,
).into_rpc()
```

Reuse `shared_voter_state2` in `GrandpaParams` so the RPC and voter share the same voter state.

This is standard Substrate GRANDPA transport. It is not a new finality protocol.

## 5. Required node change B — narrow execution-proof transport

Expose one narrow method only:

`materios_b3_calculateCommitteeProof(block_hash, call_data_hex)`

The method MUST:

- accept the exact block hash;
- accept the exact SCALE call bytes;
- accept only the canonical runtime API method;
- call the node's native `ProofProvider::execution_proof`;
- return the exact runtime result bytes;
- return the exact SCALE-encoded `StorageProof`;
- include the block hash and runtime identity needed by the existing IMMORTAL packet.

The method MUST NOT:

- reimplement `calculate_committee`;
- compute a committee outside the runtime;
- substitute `state_call` for an execution proof;
- infer finality;
- label its own output canonical/verified;
- construct synthetic trie nodes.

The exact handler should be compiled against the pinned SDK in the Materios workspace. Do not promote a handwritten snippet to evidence merely because it type-checks conceptually.

## 6. Build and runtime acceptance

The modified Materios node is acceptable for evidence acquisition only after all of the following are true:

- node builds from a pinned/recorded source revision;
- existing System/Orinq/MOTRA RPCs still work;
- `grandpa_proveFinality(target_block)` returns a non-null standard finality proof;
- the returned outer proof binds to the requested target;
- the inner GRANDPA justification can be independently decoded;
- the GRANDPA set id and authority set used by the justification are recovered;
- `materios_b3_calculateCommitteeProof(target_hash, call_data_hex)` returns result + proof;
- the returned runtime identity is captured at the same block;
- the real block's `SessionCommitteeManagement::set` commitment is extracted;
- `selection_inputs_hash == blake2_256(AuthoritySelectionInputs.encode())`;
- execution result is bound to the same exact call bytes;
- the final packet is independently verified outside the Materios RPC.

A passing RPC smoke test is not B3-A GREEN.

## 7. Evidence packet target

The eventual B3-A packet must contain, at minimum:

```text
target block hash + number
state root
runtime identity / code hash
GRANDPA proof
GRANDPA set id
exact authority set
fromSetId
toSetId
fromAuthorities
toAuthorities
selection input bytes
selection_inputs_hash
canonical block commitment
activation block hash + number
execution proof
execution result
ancestry evidence
quorum verification result
authority-transition verification result
```

The packet must cross:

`VerifiedAuthoritySetTransition`

before B3-A can be promoted.

## 8. Hard stop conditions

Stop and mark OPEN if:

- the node exposes only a derived committee list;
- the result comes from a selector reimplementation;
- the finality proof is missing or cannot be independently verified;
- the historical authority set is inferred from a later/current set;
- the execution result is available without a native execution proof;
- the block-side selection commitment cannot be matched exactly;
- runtime identity is missing or ambiguous;
- any witness is synthetic.

## 9. Relationship to Workstream A

This handoff is isolated to Workstream B.

Do not change:

- V3 carrier;
- Reveal;
- Direct-USDM EEV;
- economic semantics;
- PRE-RICH Issue/Reveal/Claim path.

Any future B3 result may be integrated elsewhere only after independent proof and explicit promotion.

## 10. Current status

**IMMORTAL evidence boundary:** READY  
**Materios selector:** PRESENT  
**Full Validator operator route:** CONFIRMED IN OPERATOR KIT / EXECUTION REQUIRED  
**Local B3 CLI:** DESIGN FROZEN, NOT YET APPLIED TO MATERIOS  
**Native execution-proof capability:** PRESENT IN SDK / CLIENT  
**Public proof RPC:** ABSENT / FALLBACK ONLY  
**Real B3-A witness:** NOT YET MATERIALIZED  
**B3-A:** OPEN
