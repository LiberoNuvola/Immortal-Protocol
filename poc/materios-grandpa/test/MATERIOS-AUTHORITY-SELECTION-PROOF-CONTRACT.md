# Materios Authority-Selection Proof Contract

> Non-normative proof-boundary contract for the IMMORTAL/Materios integration.
> This document does not implement or reimplement the Materios selector.

## Purpose

The proof boundary must establish that an advertised Materios authority set is the result of the authoritative Materios runtime authority-selection procedure for one exact execution context. The selection function alone is insufficient because the runtime has state-dependent branches before and after the vendor selector.

IMMORTAL authenticates the resulting transition; it does not independently recompute the Materios committee-selection algorithm.

## Canonical execution-context requirement

The proof MUST bind the execution context in which the runtime made the authority-selection decision, not merely the serialized selector inputs.

For the current Materios runtime, the context MUST distinguish at least:

- runtime identity/version, including the runtime profile/code identity required by the proof system;
- canonical execution block hash/number at which the selection decision was made;
- a canonical state commitment covering runtime storage reads that can affect the decision;
- genesis_utxo;
- exact serialized AuthoritySelectionInputs bytes, or an unambiguous commitment to those bytes;
- Cardano epoch nonce and sidechain epoch;
- the selection path taken by the runtime, including whether an active PinnedCommittee override was used or the normal Ariadne path was executed;
- relevant runtime liveness/current-committee state when the normal path is used;
- resulting authority set and its identity.

This follows from the current upstream runtime implementation: Config::select_authorities first checks the committed PinnedCommittee override; otherwise it sanitizes inputs, reads candidate liveness and the current block number, applies ContributionWindowEnabled / CoreEvictionEnabled / BreakGlassAuraKeys / current-committee / SlackInvariantEnabled state, then invokes the vendor selector and finally applies live-quorum and growth-slack guards. Therefore genesis_utxo + AuthoritySelectionInputs + sidechain_epoch -> committee is not, by itself, a complete canonicality statement.

The proof MUST establish which branch executed and authenticate the state used by that branch. IMMORTAL MUST NOT reproduce these runtime branches in TypeScript as a substitute for authenticated runtime execution.

## Current runtime state witness set

For the current upstream runtime, a canonical-state witness must cover the exact storage reads that can influence the result.

For the **PinnedCommittee** branch this includes, at minimum:

- `OrinqReceipts::PinnedCommittee`, including member keys and `until_epoch`;
- the queried `sidechain_epoch`;
- runtime identity/version and execution block/state commitment.

When the pin is inactive and the **normal Ariadne path** executes, the witness additionally includes:

- `OrinqReceipts::ContributionWindowEnabled`;
- `OrinqReceipts::CoreEvictionEnabled`;
- `OrinqReceipts::BreakGlassFloorEnabled`;
- `OrinqReceipts::BreakGlassAuraKeys`;
- `OrinqReceipts::SlackInvariantEnabled`;
- `SessionValidatorManagement::CurrentCommittee`;
- `OrinqReceipts::CandidateFirstSelected` for the candidate accounts consulted by the liveness filter;
- `OrinqReceipts::LastAuthoredBlock` for the candidate accounts consulted by the liveness filter.

The normal path also reads the canonical execution block number and the authoritative selector's input bytes, then invokes the vendor selector with `Sidechain::genesis_utxo()`, the sanitized inputs and the sidechain epoch. The post-selection guards can therefore depend on both the pre-selection state and the selected committee.

The proof format does not need to expose implementation-specific storage-key hashes as semantic fields if its authenticated state commitment unambiguously commits to the exact runtime state at the execution block. However, a proof implementation MUST provide a verifiable state witness for every runtime read that can affect the branch/result; an opaque claim that “the state was canonical” is insufficient.

This gives B3 a concrete minimal target: **canonical runtime code identity + execution block/state commitment + branch witness + exact input witness + authenticated runtime execution + resulting committee**.

## Runtime API finding: canonical target narrowed

A direct inspection of the current upstream runtime and the session-validator-management pallet resolves an important ambiguity.

Materios exposes:

`SessionValidatorManagementApi::calculate_committee(authority_selection_inputs, sidechain_epoch)`

through the runtime API. The runtime implementation delegates directly to:

`SessionCommitteeManagement::calculate_committee(...)`

and the pallet implementation of `calculate_committee` delegates directly to:

`T::select_authorities(authority_selection_inputs, sidechain_epoch)`

with no alternate committee algorithm in between.

Therefore the runtime API is **not merely the vendor Ariadne selector**. Its execution enters the same authoritative `Config::select_authorities` implementation that contains the state-dependent Materios branches and post-selection guards described above.

This does **not** close B3. The remaining problem is provenance of the execution itself: the proof must establish that this runtime API call was executed by the canonical Materios runtime/code at the claimed canonical block/state, with the exact SCALE input bytes, and that its returned committee is the authenticated result. A locally invoked runtime API call without canonical state/finality/code binding remains an execution result, not a publisher-independent canonical-state proof.

### Consequence for the proof architecture

The preferred execution target can now be stated precisely:

`SessionValidatorManagementApi::calculate_committee`

with:

- exact SCALE-encoded `AuthoritySelectionInputs`;
- exact `sidechain_epoch`;
- canonical execution block hash/number;
- runtime version/code identity;
- authenticated state commitment for all reads performed by `Config::select_authorities`;
- returned committee bytes.

This is preferable to reproducing `select_authorities` in TypeScript. It also avoids claiming that a vendor-only call proves the runtime's PinnedCommittee, liveness, slack, quorum, or break-glass branches.

## Execution-proof transport finding

A second triangulation against the current Polkadot SDK and the Materios node narrows the transport problem.

The Substrate/Polkadot SDK client exposes `ProofProvider::execution_proof(hash, method, call_data)`, which executes a runtime call against the state at a specified block hash and returns both the runtime result and a `StorageProof`. The same client also exposes `read_proof` for ordinary state reads. This is a native client capability, not a TypeScript reconstruction of execution. citeturn0search0turn0search1

The Materios node already depends on `sc-client-api`, and its RPC layer receives the concrete client instance through `FullDeps`. Its current `create_full` implementation exposes system, Orinq Receipts and MOTRA RPCs, but does not currently expose a generic execution-proof RPC. Therefore the remaining gap is now concrete: **the node has the underlying client-side proof primitive available through its Substrate dependency, but the current public Materios RPC surface does not expose that primitive.**

This is materially better than treating execution proof as an unknown capability. The implementation question is now whether to add a narrowly scoped Materios B3 proof RPC that:

1. accepts a canonical block hash, runtime API method and SCALE call bytes;
2. obtains the result plus execution proof from the node's `ProofProvider`;
3. returns the proof packet without asserting canonicality by itself;
4. lets the independent verifier validate the proof against the finalized block/state root and the bound runtime identity.

The RPC itself MUST remain an untrusted transport boundary. Adding an endpoint does not make its response canonical; the independent verifier must still verify finality, state-root binding, runtime identity and execution proof semantics.

The SDK documentation also establishes that runtime identity is exposed through `sp_api::Core::version` and that runtime execution is tied to the runtime/code associated with the relevant state. citeturn0search9turn0search10

### Transport status

**FOUND / NARROWED:**

- native `ProofProvider::execution_proof`: available;
- Materios node `sc-client-api` dependency: present;
- Materios custom RPC surface: present;
- existing generic execution-proof RPC: not found in the inspected current node RPC;
- independent proof verification: still to implement;
- finality + state-root + runtime-code binding: still to implement.

No claim of B3 closure is made.

## Bound statement

A valid authority-selection proof MUST bind, at minimum:

- the proof-system identity/version;
- the chain/runtime identity and execution runtime identity/version;
- the exact genesis_utxo context used by the authoritative selector;
- the exact serialized AuthoritySelectionInputs bytes, or an unambiguous commitment to those bytes;
- the canonical execution block and state commitment required to establish that those inputs were actually consumed by the authoritative runtime;
- the Cardano epoch nonce used by the selector, when the L1/Ariadne regime is active;
- the sidechain epoch;
- the exact authority-selection regime:
  - normal L1/Ariadne-driven selection; or
  - the explicit pinned-committee regime;
- a commitment to the evidence establishing that regime;
- the pinned committee expiry epoch, when the pinned-committee regime is active;
- the resulting authority set;
- the predecessor authority set, when the proof represents an authority-set transition;
- the activation block/height and set identifiers required by the surrounding transition protocol.

The proof verifier MUST reject a statement when any bound context is absent, malformed, inconsistent, or incompatible with the expected proof system.

## Authority boundary

The authoritative selector remains external to IMMORTAL.

The intended flow is:

Materios authoritative selector -> authenticated proof/attestation -> VerifiedAuthoritySetTransition -> IMMORTAL finality/authority consumers

IMMORTAL MUST NOT replace the selector with a TypeScript implementation merely to make the proof executable.

A structural proof object or test double is evidence of the boundary shape only. It is not evidence that the real Materios selector produced the advertised authority set.

## Selection, enactment and finality are distinct facts

The proof boundary MUST distinguish three separate claims:

1. **Selection:** the Materios runtime produced the advertised committee candidate for the target sidechain epoch (or explicitly used the pinned-committee regime).
2. **Enactment:** that committee was stored/enacted as the next/current committee by the session-validator-management path for the exact epoch.
3. **Finality:** a GRANDPA justification was produced under the authority set that was actually authoritative for the finalized target.

A valid proof MUST NOT infer (2) merely from (1), nor (3) merely from observing the selected committee. In the upstream runtime, `select_authorities` feeds `Call::set`, `NextCommittee` is persisted, and rotation later promotes it to `CurrentCommittee`; the session/GRANDPA layer supplies the effective `SetId` context.

In particular, a B3/M6 composition proof must establish the relationship between:
- `fromSetId` and the authority set that finalized the relevant target;
- `toAuthorities` and the committee enacted for the stated epoch;
- `toSetId` and the resulting GRANDPA/session authority context;
- the stated activation block and the finalized evidence supporting the transition.

The local IMMORTAL verifier may bind these identifiers and hashes, but the protocol-specific proof of the selection-to-enactment-to-finality relationship remains external.

## Exact-input requirement

The proof producer must establish the exact authority-selection regime before relating inputs to the resulting set. A pinned-committee transition is not an Ariadne selection result, even when the resulting authority bytes are identical.

The proof producer must execute against the same semantic input domain used by the authoritative Materios runtime. In particular, the proof must not silently substitute:

- a locally reconstructed candidate list;
- a different genesis context;
- a different epoch nonce;
- a different sidechain epoch;
- a different runtime/profile configuration;
- or a simplified weighting/sampling rule.

If canonical serialization is required, the serialization format and version must itself be bound by the proof-system identity.

## Verification result

The only production-consumable result is a branded/typed verified transition equivalent to the repository's existing VerifiedAuthoritySetTransition boundary.

Unverified statements, synthetic vectors, and test doubles MUST remain outside that trust boundary.

## Current status

This contract closes the specification of the proof boundary, not the proof itself.

Still required for real Materios evidence:

1. authoritative selector execution from the canonical Rust/WASM/runtime implementation, including the state-dependent branch taken by Config::select_authorities;
2. an authenticated proof or independently verifiable attestation;
3. a real finalized-block/authority-set fixture;
4. verification that the authenticated output becomes the repository's VerifiedAuthoritySetTransition;
5. replay evidence tying the proof to the exact bound execution context;
6. a real finalized Materios fixture containing the canonical runtime identity, execution block/state commitment, selection inputs, and storage values required to reproduce the selected branch;
7. a node-side or otherwise independently verifiable execution-proof transport for `SessionValidatorManagementApi::calculate_committee`, if the canonical Materios node does not expose one directly.

Until those artifacts exist, Materios authority-selection/finality provenance remains OPEN.

## Non-goals

This document does not:

- define new Materios economics;
- define a new authority-selection algorithm;
- authorize IMMORTAL to select authorities;
- treat verify(){ return true; } test doubles as production verification;
- promote synthetic GRANDPA evidence to real Materios evidence.


### SDK revision check

The Materios `partnerchain/Cargo.lock` resolves `sc-client-api` to version `37.0.0` from Polkadot SDK tag `polkadot-stable2409-4` at commit `c455194a2ae2f613c1c671e00dbf397b83ed8171`. The exact upstream `substrate/client/api/src/proof_provider.rs` at that commit contains `ProofProvider::execution_proof(hash, method, call_data) -> (Vec<u8>, StorageProof)`. This removes the remaining version-drift concern for the native proof primitive: the capability is present in the exact SDK revision Materios locks, not only in current SDK documentation. citeturn390818search0

This still does not establish that the Materios node exposes the primitive through its public RPC interface, nor does it establish B3 canonicality. Those remain separate transport and verification obligations.


### Exact transport shape recommended

Because `StorageProof` implements SCALE `Encode`/`Decode` in the locked SDK, the B3 transport should carry the proof as one exact SCALE-encoded byte string (for example `0x`-prefixed hex), not as a JSON interpretation of individual trie nodes. This preserves the native proof object across the untrusted RPC boundary and lets the independent verifier decode the exact SDK type before proof checking. citeturn390818search0

For the first production-shaped Materios endpoint, prefer a narrowly scoped RPC contract over a generic arbitrary runtime-call prover:

`materios_b3_calculateCommitteeProof(block_hash, call_data_hex)`

with a response containing at minimum:

- the exact `block_hash` used;
- the exact runtime API method identifier `SessionValidatorManagementApi_calculate_committee`;
- the exact SCALE `call_data_hex` supplied to the runtime;
- the exact runtime `result_hex` returned by execution;
- the exact SCALE-encoded `StorageProof` bytes;
- the runtime version observed at that block.

The endpoint is transport only. It MUST NOT label its response `canonical`, `finalized`, `verified`, or equivalent. Finality, header/state-root binding, runtime identity/code correspondence, proof verification, and semantic decoding of the committee remain independent verifier responsibilities.

A generic endpoint can be considered later for tooling, but the B3 path should initially expose only the single runtime API required for authority-selection provenance. This keeps the proof surface narrow and makes accidental proofing of unrelated runtime calls impossible.


### StorageProof representation correction

The transport contract is now byte-exact with the locked SDK representation. `StorageProof` is a SCALE `Encode`/`Decode` type whose payload is a set of serialized trie nodes; the SDK explicitly provides conversion to a memory DB and compact-proof forms. Therefore `proofScaleHex` is the canonical transport field for the raw native proof bytes. A JSON array of independently interpreted trie nodes is not the normative wire representation. citeturn841891search6

This distinction matters for B3: transport may preserve the proof exactly, but proof verification still requires reconstructing/verifying the trie against the expected state root; the transport validator must never treat syntactically valid proof bytes as verified state. citeturn841891search6turn841891search8


## Independent verifier implementation boundary

A Rust verifier PoC now uses the same pinned Polkadot SDK revision as Materios and calls the SDK's `sp_state_machine::execution_proof_check` directly. The verifier:

1. decodes the exact SCALE `StorageProof` bytes;
2. checks the supplied runtime WASM against an expected Blake2-256 runtime-code identity;
3. reconstructs the proof-check backend against the supplied `stateRoot`;
4. executes the exact runtime method with the exact call bytes;
5. rejects when the reproduced result differs from the expected result.

This is the correct cryptographic boundary for the execution proof itself. The SDK documents `execution_proof_check` as the checker for proofs generated by `prove_execution`, and the checker explicitly receives the expected root, proof, runtime executor, method, call data and runtime code. citeturn526977search0turn635886search2

The verifier deliberately does **not** decide the outer canonicality predicates. A successful execution-proof check still needs an independently established finalized block/header, state-root binding, runtime-code deployment/source correspondence, exact method/input binding, and the surrounding GRANDPA authority-set/finality transition proof. This prevents the verifier from treating a valid proof over an arbitrary block or arbitrary runtime as canonical Materios state.

The Rust PoC is at `poc/materios-execution-verifier/`. It is a verification component, not a selector implementation and not yet a complete M6 verifier.
