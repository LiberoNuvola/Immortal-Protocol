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


## 5. Direct source comparison — current Materios verifier (2026-10-22)

Exact files inspected on `work/b3-materios-provenance-evidence`:
- `poc/materios-grandpa/src/verifier.ts` (blob `b6831e4b9f52e244e98d8f02fb1c10f025da2728`)
- `poc/materios-grandpa/src/authority.ts` (blob `b6aab2acb434490dc0809af92195bab1ca98d86c`)
- `poc/materios-checkpoint/src/capture-finalized.ts` (blob `bd9bf935ca70e31b4d0e66c345bf3e55b4ae0250`)
- `poc/materios-checkpoint/src/rpc.ts` (blob `d1edb50d02ff5ea8176e987644a2d3a8b1d188b9`)

### Confirmed good properties

- `verifyFinality` explicitly compares checkpoint `chainId` and `genesisHash` with the supplied trusted authority state, binds justification target hash/number to the checkpoint, checks signer uniqueness, signature validity, authority membership, weighted quorum, and optionally ancestry.
- Authority transitions are intended to flow through `trustedAuthorityStateFromVerifiedTransition`, which checks the transition marker/hash and binds chain/genesis, source set id, and source authority-set identity.
- Capture code explicitly labels RPC data and raw GRANDPA bytes as untrusted evidence; `grandpa_proveFinality` documentation correctly warns that the embedded justification may target a descendant and that the proof's requested block and unknown-header path must be independently bound.
- The upstream equivocation test suite is substantially richer than a simple one-signature-per-voter model, including multiple signed precommits, forks, target-height relabelling and ancestry relationships.

### Remaining trust-boundary issue to resolve before claiming permissionless bootstrap

The current TypeScript `TrustedAuthorityState` is a structural interface. `validateAuthorityState` checks shape only; it does not establish provenance. The interface's `trust?: never` and comments about a verified-transition construction boundary are compile-time/API conventions, not a cryptographic proof that the initial state came from an authenticated Materios genesis/checkpoint. A caller can construct a structurally valid object literal unless all call sites and the deployment boundary enforce a separately authenticated bootstrap.

This is not a finding that signature/quorum code is wrong. It is a finding that **the first trusted authority state is still the root-of-trust decision**. The transition function can preserve a valid trust chain after a verified transition, but cannot manufacture trust in its initial `current` state. Required follow-up:
1. Locate and audit every production/test call site that creates `TrustedAuthorityState`.
2. Define the authenticated bootstrap source for Materios genesis hash, initial GRANDPA set id, and authority list; bind all three together.
3. Make the API boundary make unverified bootstrap construction explicit and impossible to confuse with verified state (for example, a runtime-checked opaque constructor/brand backed by verified bootstrap evidence, not just a TS interface).
4. Add adversarial tests showing an arbitrary caller-supplied authority set cannot be promoted to trusted state merely by passing shape validation.
5. Preserve chain-id/genesis mismatch tests, but do not treat those checks as proof that the expected identity itself was authentic.

### Differential decision

Do not port Orynq's Midnight set-length assumptions. Reuse its adversarial test concepts and compare semantics one by one. The immediate priority is bootstrap provenance and the boundary between `AuthoritySetEvidence`, `TrustedAuthorityState`, and verified transition results, before optimizing set-walk performance or declaring B3-A closed.


## 6. Test-fixture limitation found during call-site audit

Inspected current-branch test sources:
- `poc/materios-grandpa/test/authority-boundary.integration.test.ts` (blob `846f87bff3662e3df19779e245a53ffebf2d58d4`)
- `poc/materios-grandpa/test/authority-transition.test.ts` (blob `2e09654529c131539bc4782c530469592b0a0d4c`)
- package scripts in `poc/materios-grandpa/package.json` (blob `d514aa014da08be31a8d33a6c1583203613be597`)

The integration test constructs `currentTrustedState()` directly as a plain object and passes it into the transition function. Its proof-verifier stub returns `true`; finality's crypto stub also returns `true). The transition unit test explicitly labels its proof verifier as a structural test stub that does not verify Materios committee derivation. These are useful boundary/shape tests, but they cannot establish a production-authenticated genesis bootstrap or cryptographic committee transition.

This confirms the next step should not be to add another nominal “trusted state” fixture. It should be to define the real bootstrap evidence format and production verifier boundary, then keep synthetic fixtures clearly separated from production-qualified evidence. The package declares `npm test`, `npm run build`, and `npm run typecheck`; **none of these commands was executed in this review**, so no test-pass claim is made.


## 7. Added fail-closed identity regression tests (2026-10-22)

Two regression tests were appended to `poc/materios-grandpa/test/verifier.test.ts` on the existing B3 branch:
- `e1d1042e545c96ac456ef3d6476bc1d674e2c4fa`: reject mismatched checkpoint genesis hash with otherwise matching authority keys, set ID and synthetic quorum.
- `b2930473e73a6edfe947b0480306dd2d79f27645`: reject mismatched chain label under the same synthetic fixture.

These test cases exercise already-existing guards, not a new authenticated bootstrap. They intentionally use the pre-existing synthetic `alwaysValidCrypto` stub, so neither case demonstrates real GRANDPA signature verification or resistance to an adversary who supplies both the checkpoint and initial trusted state. Test execution/CI evidence is **not yet recorded**. B3-A remains OPEN.
