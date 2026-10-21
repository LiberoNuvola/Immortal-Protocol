# Protocol Usage Fee G1 — Canonical Transition Entry-Point Audit B3 v1
**Date:** 2026-10-20  
**Target branch:** `work/b3-materios-provenance-evidence`  
**Status:** targeted source trace complete for the inspected canonical kernel and PRE-RICH Issue admission path; G1 remains OPEN  
**Scope:** locate the narrowest existing authoritative-input/admission seam for a future G1 declaration. Documentation only.

## 1. Source files inspected on the target branch
- `IMMORTAL/kernel/EconomicGate.hs` — blob `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127`
- `IMMORTAL/kernel/EconomicTransitionV3.hs` — blob `62c2980a821cdcfc33a33e15a09617256ab8753c`
- `IMMORTAL/state/EconomicProfile.hs` — blob `e4eccd67bec97543b802aa15ff1b2719c9c18bde`
- `IMMORTAL/state/UniversalEconomicState.hs` — blob `f89fe04c8aad8ca9c5e544fa9c145a38d157826f`
- `PRE-RICH/onchain/PreRichEconomicAdmission.hs` — blob `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a`
- `Adapter/CARDANO/runtime/EconomicAdmission.ts` — blob `5949c1f5b60091f2b5f9b0a59d4274887b7151d2`
- `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts` — blob `a73f343ad12186e3d5fc7f31802b4202c899f29f`
- `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts` — blob `4c5f81a76edb14dbcf59412c6b0500c749264883`
- `src/preRichIssueAdmissionBridge.ts` — blob `5538aa3473e4e831f71df9c62feb3247d4743be3`
- `src/authoritativeIssueAdmissionProducer.ts` — blob `d45adc23f78349c8537d8d3aa3c5c01da7d8ed6f`
- `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` — blob `dee0d5bcf29e5b75b33b70438b43ff54ad1419bf`
- Normative references: `docs/00-normative/01_CONSTITUTION_FINAL.md`, `04_STATE_TRANSITION_SPECIFICATION.md`, `07_CONFORMANCE_SPECIFICATION_FINAL.md`.

This is a source-level trace of these concrete files, not a claim that the entire repository call graph has been exhaustively proven.

## 2. Observed current path

### 2.1 Structural V3 transition
`EconomicTransitionV3.transitionValid` validates profile structure, pre-state invariants, the candidate transition, post-state invariants and monotone control history. `V3Action` is the action sum `Issue | Reveal | Claim | Expire`.

In the inspected implementation, `EconomicProfile` contains a profile version, class-price table, and maximum normal payout multiplier. It does not carry a Protocol Usage Fee applicability declaration or a fee-class registry.

### 2.2 PRE-RICH economic admission composition
`preRichEconomicAdmission` performs:
1. non-negative pre-EEV check;
2. `transitionValid`;
3. candidate `transition`;
4. fail-closed projection to `UniversalEconomicState`;
5. construction of `EconomicGateInput`;
6. `executionAdmissible` (Economic Gate and viability condition);
7. return an admission witness or `Nothing`.

The gate input contains booleans for authoritative truth verification, EEV freshness and obligation completeness, plus EEV and immediate executable-liquidity values. Its own comments say the interface does not manufacture truth, freshness, or obligation coverage. In the inspected path there is no G1 declaration input, no fee applicability resolver, and no fee obligation derivation step.

### 2.3 Adapter witness and evidence binding
`EconomicAdmissionWitness` carries a canonical action class, action fingerprint, pre-state hash, candidate post-state hash, observation/decision references, and authenticated pool/liquidity references. `EconomicAdmissionTransitionBinding` checks that the evidence packet matches the witness's action and pre/post-state identifiers.

The canonical transition evidence validator checks field presence and fingerprint format/binding. Its comments explicitly say it is evidence-only and not an economic authority. These fields are useful for binding a future decision to a transition; they do not decide G1.

### 2.4 Producer boundary
`src/authoritativeIssueAdmissionProducer.ts` is an adapter boundary around an externally authoritative producer; it explicitly does not derive EEV, ProtectedCapital, viability, or gate booleans. `HaskellIssueAdmissionProvider.ts` is the server/relayer-side adapter for a Haskell Issue decision and binds that decision to observed Cardano inputs.

This means it would be inaccurate to say that the repository has no Issue-admission producer pathway at all. The precise finding is narrower: **the inspected producer/admission pathway is PRE-RICH Issue-specific and does not produce or validate a universal Protocol Usage Fee G1 declaration**. Its existence does not authorize fee applicability.

## 3. Canonical insertion constraint
The normative transition specification requires:
`canonical state → authoritative input verification → obligation/exposure derivation → candidate delta → complete post-state → Safe → K_c viability → accept/reject → atomic commit → history`.

Therefore, if a future approved G1 declaration affects an action, it cannot be added merely as:
- a UI/action-availability flag;
- an Adapter-only surcharge;
- a post-admission receipt check;
- an unrelated second fee transition; or
- an unverified boolean passed into `EconomicGateInput`.

The minimal compatible conceptual seam is the existing **authoritative input verification and obligation/exposure derivation path before candidate post-state construction**. A G1 resolver would have to produce a verified applicability result bound to the canonical action class and exact deployment/profile version. If applicability is true, the resulting fee obligation must be included in the same complete candidate post-state and evaluated by the existing safety/`K_c`/atomic-commit path. If false, that result must be explicitly declared and verified rather than inferred from absence. The exact encoding, authority predicate and failure semantics remain unapproved design decisions.

## 4. Exact gap, not a speculative implementation
The following are absent from the inspected fee path:
1. A universal canonical usage-class identifier/registry shared by the fee declaration and the action being admitted.
2. A fee-specific declaration producer/resolver for deployment/profile + revision + explicit true/false applicability.
3. A canonical predicate that authenticates the declaring authority/source and binds the declaration to the relevant profile/version and applicable state/context.
4. A defined deterministic resolution policy for absent, stale, conflicting, revoked, malformed or mismatched declarations.
5. A fee-obligation derivation that runs before the complete candidate post-state and safety/`K_c` checks.
6. End-to-end conformance evidence proving the declaration cannot be bypassed through an alternate admission or settlement path.

The inspected files do not prove these mechanisms exist under another name elsewhere in the repository; the finding is scoped to the source paths listed above.

## 5. Reuse and non-reuse
Reuse:
- canonical action and pre/post-state fingerprint binding;
- explicit profile/version metadata in transition evidence;
- authoritative-input verification before economic admission;
- fail-closed behavior for incomplete or unqualified inputs;
- existing single-transition atomicity and conformance boundary.

Do not reuse as G1 authority:
- `EconomicAdmissionWitness.admitted: true` by itself;
- an evidence digest, URI, signature-shaped field or successful CI run without a verified authority predicate;
- PRE-RICH Issue-specific provider logic as a universal IMMORTAL fee rule;
- action availability or presentation declarations;
- Adapter-selected fee applicability.

## 6. G1 status and next gate
**G1 remains OPEN. No fee-bearing class is selected.** No production types, Haskell/TypeScript logic, tests, CI, deployment or on-chain behavior were changed.

Before implementation, the project authority must resolve the normative applicability/authority contract without inventing economic values or delegating fee policy to the Adapter. After that decision, the implementation can be constrained to the existing canonical path and tested against absent, explicit-false, explicit-true, stale, conflicting, revoked, wrong-profile and bypass scenarios. Those are candidate conformance cases, not yet normative acceptance semantics.


## 7. Exact source-order refinement — conceptual seam versus implementable seam

A fresh exact-branch read of the named source files narrows the insertion finding above. The normative sequence remains authoritative, but the current implementation's concrete order and data structures matter:

1. `PRE-RICH/onchain/PreRichEconomicAdmission.hs` (`d8360b608f3bb32b7c74000de3ca3b5e3a907a9a`) rejects negative pre-EEV, calls `transitionValid`, computes `transition profile preState action` to obtain `candidateV3`, projects that candidate to `candidateUniversal`, and only then constructs `EconomicGateInput` and invokes `executionAdmissible`.
2. The admission function receives `truthVerified`, `eevFresh`, `obligationsComplete`, and the Ω-successor condition as arguments. It does not derive those authority facts internally and does not resolve G1.
3. `EconomicTransitionV3.hs` (`62c2980a821cdcfc33a33e15a09617256ab8753c`) represents only `Issue | Reveal | Claim | Expire` and application-state deltas. `EconomicProfile.hs` carries version, ticket-class prices and payout multiplier, but no protocol-fee applicability map or protocol usage-class registry.
4. `UniversalEconomicState.hs` (`f89fe04c8aad8ca9c5e544fa9c145a38d157826f`) contains liability, reserve, unresolved-count, worst-case-exposure and protected-capital aggregates; it contains no typed Protocol Usage Fee obligation, settlement target or settlement result.
5. `EconomicAdmissionWitness` in `Adapter/CARDANO/runtime/EconomicAdmission.ts` (`5949c1f5b60091f2b5f9b0a59d4274887b7151d2`) binds action and state fingerprints, EEV, authenticated pool valuation, executable liquidity and required immediate liquidity. It does not carry the G1 declaration or a fee-obligation derivation. The evidence bridge is binding/validation, not the missing economic calculation.

### Consequence

There is a **normative sequencing seam**—authoritative-input verification and exhaustive obligation/exposure derivation before candidate-delta/post-state checks—but no ready-made typed **implementation seam** in the inspected PRE-RICH/V3 path. In the current code, the candidate V3 state is already computed before the economic gate, and neither the V3 state nor its universal projection represents a distinct protocol-fee obligation.

Therefore it would be incorrect to close the gap by merely passing another boolean into `EconomicGateInput`, treating `obligationsComplete=true` as fee applicability, or adding a post-admission receipt check. Such changes would not demonstrate that a fee obligation is represented in the complete candidate post-state and checked by the same safety/`K_c`/atomic-transition path.

Before implementation, the approved G1 contract must identify how a verified result influences the existing canonical action and full candidate post-state while preserving the documented separation of universal IMMORTAL fee semantics from PRE-RICH application semantics. This audit does **not** prescribe a new state field, mutate `V3Action`, choose a fee-bearing class, or alter V3/Reveal semantics. The precise representation and transition integration remain design/authority questions; once approved, they require an end-to-end refinement/conformance demonstration.

This refinement is consistent with the [existing-authority reuse audit](PROTOCOL-USAGE-FEE-G1-EXISTING-AUTHORITY-REUSE-AUDIT-B3-v1.md) §9.18: version/commitment/fingerprint primitives are reusable bindings, not a G1 authority or obligation implementation.

**Result:** insertion order is identified; implementation seam is **NOT READY**. G1 remains OPEN. Source-only read, documentation update only; no code, tests, CI, deployment, V3 carrier, or Reveal behavior changed.
