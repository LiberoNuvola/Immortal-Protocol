# B3-A — Orynq GRANDPA Verifier Compatibility Review
Date: 2026-10-22
Classification: research / non-normative. This note does not alter the IMMORTAL kernel, Materios runtime semantics, or canonicality policy.

## Scope and exact upstream source

Reviewed `Flux-Point-Studios/orynq-sdk` at commit `90fc397111a98b2d6fe47771e82003cdcaa429d5`:
- `packages/anchors-midnight/src/grandpa.ts`
- `packages/anchors-midnight/src/__tests__/grandpa.test.ts`
- related commits `4f78fa4206e14492e54de5fcde5b4901c7ad716a`, `0f7cc83caceedc5ab7f91eca2ed2687a376e4188`, `f33c39f203c8cb34a7a1d7830f59678552e570db`.

Existing IMMORTAL references:
- `poc/materios-checkpoint/src/capture-finalized.ts`
- `poc/materios-checkpoint/src/rpc.ts`
- `poc/materios-grandpa/test/MATERIOS-AUTHORITY-SELECTION-PROOF-CONTRACT.md`
- `docs/research/B3-A-B-MATERIOS-FINALITY-STORAGE-TRIANGULATION-2026-09-27.md`
- `docs/04-verification/MATERIOS-B3-EXECUTION-PROOF-RPC.md`

## Findings

### 1. Reusable logic and adversarial cases

Orynq's verifier is a useful reference for:
- SCALE decoding of `FinalityProof` and `GrandpaJustification`;
- checking the commit target against the requested block through the proof's header ancestry;
- scheduled authority changes and ordered transitions;
- correct handling of two distinct signed precommits from one equivocator;
- preventing a set change at/before the current set's start;
- linear/bounded ancestry walking and verification work;
- malformed proofs, incomplete ancestry, wrong heights/hashes and mismatched RPC response counts.

These are candidate differential/regression tests for B3-A. They are not evidence that Materios finality is already verified.

### 2. Not drop-in for Materios

The module is explicitly named `anchors-midnight`. It uses `SET_LENGTH = 300` and `DEFAULT_MAX_SET_CHANGES = 2016`, based on Midnight's 30-minute GRANDPA sets. These constants and the predicted-set-end optimization must not be copied as Materios rules. Materios set changes must be located and authenticated from Materios headers/digests and the selected trust anchor; any search bound must fail closed without changing consensus semantics.

The verifier starts from caller-supplied `FinalityCheckpoint` entries and chooses the nearest checkpoint below the target. Thus its guarantee is conditional on the checkpoint and authority set being trusted. It is not a trustless genesis-to-tip proof unless the bootstrap checkpoint and every transition from it are independently authenticated.

### 3. Cross-chain replay / identity gap

GRANDPA precommit signatures bind the vote target, round and set ID, but do not directly bind chain ID or genesis. The Orynq commit `4f78fa42...` explicitly documents the risk: if another chain reuses keys and set IDs, its justification may verify under the walked set. The code's own stated trust assumption is that honest keys do not sign under the same set ID on another chain.

Therefore:
- successful signature and supermajority verification is not by itself proof of Materios identity;
- the capture packet's configured `chain_id` string is metadata, not cryptographic authentication;
- Materios genesis/chain identity must be bound to the trusted bootstrap checkpoint through an independently authenticated source or protocol-level commitment;
- if this cannot be proven, record the residual trust assumption explicitly and do not claim fully publisher-independent cross-chain replay resistance.

### 4. Existing Materios capture correctly remains transport-only

`capture-finalized.ts` reads `chain_getFinalizedHead`, fetches the exact header/runtime/version and GRANDPA authority list/set ID at that hash, and attempts `grandpa_proveFinality`. Its own packet marks independent proof decoding, authority transitions, runtime execution proof and WASM source reproducibility as open. The raw response and the RPC endpoint remain untrusted.

Also, `grandpa_proveFinality(height)` may return a `FinalityProof` whose justification target is a descendant of the requested block. The decoder must bind `proof.block` to the requested hash, verify the unknown-header path, then verify the embedded justification under the correct set. Passing the opaque bytes directly to a verifier that expects the justification target to equal the requested checkpoint is incorrect.

## Required B3 regression matrix

Before claiming B3-A closure, run the existing Materios harness with real proof material where available and add or confirm tests for:

1. Wrong trusted genesis/chain identity despite otherwise valid signatures.
2. Same GRANDPA keys and set IDs reused by a different chain; refuse unless the trust model explicitly accepts that assumption.
3. Wrong or stale initial authority checkpoint.
4. Invalid scheduled-change digest, wrong next authority list, skipped or relabelled set-change block.
5. Equivocation represented by distinct signatures over the same vote, including ordering variations and stray precommits off the commit base.
6. Wrong proof block hash, wrong target height, missing/reordered/duplicated ancestry headers, parent/hash mismatch.
7. Malformed SCALE, negative/zero/overflowing weights as applicable to the decoder, oversized proof/ancestry, bounded work.
8. RPC result count mismatch and missing/null proof; all must fail closed.
9. A real Materios proof accepted only after the checkpoint and transition path are authenticated.

Keep tests of the generic verifier separate from evidence that a specific Materios block is final.

## Boundary to B3-B and B3-C

The accepted proof chain remains:

`trusted Materios identity/checkpoint → GRANDPA justification + authority transitions + ancestry → finalized header → StateRoot → exact storage proof → exact key/value`

B3-C adds the distinct requirement:

`finalized state + deployed runtime/code identity + exact runtime API method and SCALE input → independently verified execution proof/result`

Do not treat storage inclusion as finality, or a valid runtime execution proof over an arbitrary state root as canonical execution.

## Current status

- Upstream verifier review: completed for the source and commits listed above.
- Reuse decision: reuse test patterns and protocol insights only; no blind code port.
- B3-A: OPEN — real Materios proof and trusted identity/authority bootstrap not independently verified here.
- B3-B: OPEN — exact storage inclusion against an authenticated finalized StateRoot remains separate.
- B3-C: OPEN — runtime/source correspondence and independently verified execution proof remain separate.
- PR #35: keep draft.
- No deployment, on-chain transaction, or production claim was made by this review.
