# Materios B3 — Composition Test Contract v1

Status: **TEST CONTRACT / NOT EVIDENCE / B3 NOT APPROVED**

Scope: define conformance tests for composing already-defined B3 evidence boundaries. This document does not implement a new protocol, change selector semantics, establish a trust root, or promote synthetic fixtures to live evidence.

Explicit non-goals:
- no changes to V3, Reveal, PRE-RICH economics, Issue/Reveal/Claim, or the Materios selector;
- no new round-selection policy, authority-selection algorithm, threshold, coefficient, or fallback;
- no inference that a storage proof, receipt, drand signature, RPC response, or test fixture establishes GRANDPA finality;
- no operator-node assumptions where no operator route is available.

## 1. Composition boundary

B3 composition is valid only when each evidence object is verified by its own existing verifier and all cross-object bindings agree. The composition layer must not replace verification with matching labels or caller-supplied booleans.

Required evidence categories:

1. **Canonical checkpoint** — chain identity/genesis identity, block hash and number, and state root from the selected canonical observation.
2. **Receipt/storage evidence** — receipt identifier and storage proof bound to the same checkpoint/state root; verified using the existing storage-proof path.
3. **GRANDPA finality evidence** — standard SCALE `FinalityProof`, inner justification, authority set/set id, and ancestry bridge; independently verified by the existing GRANDPA verifier.
4. **Authority-transition evidence** — exact from/to set identities, set IDs, activation block hash/number, selection-input commitment extracted from the canonical block, and native runtime execution-proof packet; must cross `VerifiedAuthoritySetTransition`.
5. **External randomness evidence, if used by the caller** — drand chain identity, round, signature and randomness fields verified by the existing drand verifier. This is a separate input and does not certify Materios finality or authority provenance.

A category not required by a specific consumer must be explicitly marked out of scope by that consumer. It must not be silently treated as verified.

## 2. Binding invariants

Tests must assert, using canonical byte/hash comparisons rather than display strings where applicable:

- chain identity and genesis hash match the configured trust context;
- checkpoint block hash and block number refer to the same observation;
- state root used by a storage proof equals the checkpoint state root;
- receipt/storage proof identifiers and proof bytes are attached to the same evidence packet digest;
- outer GRANDPA `FinalityProof.block` equals the inner justification commit target hash;
- the inner target number and the verified ancestry bridge agree with the requested checkpoint and finalized target;
- GRANDPA signatures and weighted quorum verify against the exact authenticated authority set and set id;
- authority-transition `fromSetId` and from-authority-set identity equal the currently trusted state;
- authority-transition `toSetId` equals `fromSetId + 1`, as required by the existing authority-transition boundary;
- selection input bytes, their hash, the canonical block commitment, runtime identity/code hash, execution call bytes, execution result and native execution proof remain bound to the same target block;
- no transition is promoted to trusted authority state until the existing `VerifiedAuthoritySetTransition` boundary succeeds;
- any evidence digest covers the exact serialized evidence packet and its version/format identifiers.

This list restates binding and verification boundaries already present in the repository; it does not define how a committee is selected or when a consumer should request a drand round.

## 3. Required negative tests

Each test must fail closed and return a stable, diagnosable failure category. The test suite should assert rejection, not a particular internal error string unless that error code is already part of the public contract.

| Mutation | Expected result |
|---|---|
| Change checkpoint hash but retain original block number | Reject checkpoint/evidence binding |
| Change checkpoint number but retain original hash | Reject checkpoint/evidence binding |
| Change state root while retaining storage proof | Reject storage proof binding |
| Change receipt ID while retaining proof packet/digest | Reject packet binding or digest |
| Change outer GRANDPA target hash only | Reject outer/inner target mismatch |
| Change inner target number or omit required ancestry header | Reject target/ancestry bridge |
| Remove, alter or duplicate a signer; use wrong set ID | Reject GRANDPA verification unless the actual verifier establishes valid quorum under the correct set |
| Substitute a later/current authority set for the historical set | Reject authority provenance; do not infer history from current state |
| Change `fromSetId`, `toSetId`, or from-authority identity | Reject authority transition |
| Change runtime identity, call bytes, result bytes or proof while retaining the old packet digest | Reject execution-proof packet binding |
| Supply only a derived committee list or ordinary state-call result without native execution proof | Keep B3-A OPEN |
| Reuse a valid storage proof with a different checkpoint | Reject cross-object binding |
| Supply valid drand evidence but no Materios finality proof | Keep Materios finality OPEN |
| Replay an otherwise valid packet under a different chain/genesis/checkpoint context | Reject context binding |
| Omit any required evidence category or provide a synthetic witness in a live-evidence slot | Fail closed; do not promote status |

## 4. Fixture classes and status discipline

Tests must label fixture provenance explicitly:

- **Synthetic/unit fixture:** useful for parser, mutation and control-flow tests only. Never counts as live proof.
- **Recorded external response:** proves what an endpoint returned at a recorded time; does not by itself prove canonicality or finality.
- **Independently verified live witness:** only eligible for promotion after all applicable cryptographic, checkpoint, ancestry and authority-transition checks pass and its immutable artifact/digest is recorded.

A test using an always-valid crypto stub is a unit test of control flow, not cryptographic verification evidence. It must never be described as a real GRANDPA signature/quorum proof.

## 5. Acceptance gates

- **B3-B storage gate:** live storage proof verifies against a captured state root and the receipt/checkpoint binding is preserved.
- **B3-A finality gate:** a real GRANDPA proof is acquired and independently verifies against the exact target and authenticated authority state.
- **B3-A authority-transition gate:** canonical selection commitment and native runtime execution proof are bound to the same block, and the result crosses `VerifiedAuthoritySetTransition`.
- **B3 composition gate:** all required evidence categories pass their existing verifier and all shared bindings match.
- **Overall B3:** remains **OPEN / NOT APPROVED** until B3-A finality and authority-transition gates are satisfied with real evidence. B3-B PASS alone is insufficient.

## 6. Current known limitation

The currently observed public Materios RPC surfaces have not supplied a GRANDPA justification in the scanned range, and `grandpa_proveFinality` has returned method-not-found on the tested endpoints. This is evidence of the tested RPC surface only, not evidence that Materios blocks are unfinalized. Do not rerun identical scans as a substitute for acquiring a proof-capable source.

If no public proof source or operator-provided witness is available, record the acquisition blocker and preserve the existing verified receipt/storage-proof use case separately. Do not manufacture a finality witness or silently weaken the gate.

## 7. Change-control boundary

This contract adds no implementation behavior. Any code changes must:
1. stay on `work/b3-materios-provenance-evidence`;
2. preserve existing V3, Reveal and economic semantics;
3. use real external proof bytes for any live-evidence claim;
4. keep synthetic fixtures visibly segregated;
5. leave B3 OPEN unless the acceptance gates above are demonstrated.
