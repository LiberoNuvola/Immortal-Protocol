# Workflow C — IMMORTAL V2 Autonomous Verification & Execution

**Status:** DESIGN / RECONCILIATION ONLY  
**Reference date:** 2026-10-18  
**Normative authority:** none; this folder records a work programme and evidence boundaries. It does not amend the IMMORTAL Constitution, Economic Kernel, Economic Algorithm, adapter specifications, or PRE-RICH rules.

## Purpose

Build one chain-independent IMMORTAL reference instance for which a non-empty viability certificate can be independently recalculated. The reference instance is not a claim that PRE-RICH is deployed, that Cardano has been certified, or that an unbounded-horizon theorem has been established.

## Scope: C0–C10

- **C0–C5 — foundation and reconciliation:** recover the source-of-truth hierarchy, align the reference profile with existing normative and implementation artifacts, record assumptions and evidence provenance, and preserve explicit unresolved decisions.
- **C6 — reference profile and action-space adequacy:** define the chain-independent state/action/transition profile and demonstrate that its action space is not artificially restricted to make the viability set empty or trivially safe.
- **C7 — complete Ω declaration:** enumerate all 13 contract elements, identify the authority that fixes Ω, and declare the perimeter E.
- **C8 — concrete non-empty Kc:** specify an admissible initial state S0 and a certificate/witness that establishes the intended membership claim.
- **C9 — independent checker:** recompute predicates and certificate conditions from canonical inputs. Do not trust proposer-supplied booleans as proof.
- **C10 — reproducible evidence packet:** pin the source commit, command, inputs, outputs, result, limitations, and hashes so another party can repeat the check.

## Closure criterion

Workflow C is not closed until the evidence supports all of the following:

1. S0 is admissible and χ(S0) = 1.
2. VC2 and VC3 are discharged under the declared profile.
3. S0 ∈ Kc ⊆ K* under T-NV-CHAIN, with the exact meaning of Kc and K* stated.
4. Ω is complete, its fixing authority is identified, and perimeter E is declared.
5. An independent checker recomputes the claim from source inputs.
6. A reproducible command/evidence packet records commit, result, assumptions and limitations.

Finite tests do not prove an infinite-horizon property. A passing structural fixture does not establish cryptographic verification. A successful adapter/chain test does not by itself prove the chain-independent viability claim.

## Current blocking finding

**C6 remains NOT CERTIFIED.** The repository has a universal economic state/accounting kernel, but the examined implementation does not yet provide a complete chain-independent economic action/transition relation plus a concrete non-vacuous viability witness. The V3 audit's restricted action graph is not a universal theorem about IMMORTAL. No economic action, coefficient, threshold, Safe set, Ω, or normative rule may be invented to close this gap.

The immediate split is:
- **C6-A:** define the reference-profile architecture using existing semantics and explicit interfaces.
- **C6-B:** resolve the substantive economic action/transition semantics and produce a valid non-empty Kc witness. This is a stop condition until supported by existing normative authority or an explicit architecture decision.
- **C6-C:** bind the profile and certificate to a B3-style provenance/evidence packet and independent checker.

## Source-of-truth hierarchy

1. IMMORTAL Constitution
2. Economic Kernel
3. Economic Algorithm
4. Architecture specifications
5. Cardano Adapter specification
6. PRE-RICH Constitution
7. Application Specification
8. Game Economy rules
9. Implementation
10. Tests
11. Evidence

Lower-level code or fixtures cannot silently override higher-level normative sources.

## Non-goals and hard constraints

- No changes to V3 or Reveal semantics.
- No change to economic constants, protected capital, Safe, Ω, or the normative corpus without an explicit architecture decision.
- No new branch as part of this work.
- No Cardano deployment, mint, spend, or redeployment as part of Workflow C.
- No claim of GREEN/certified without the corresponding evidence.
- No use of NoOp, rejection, or SAFE STALL as an invented economic action to force a non-empty viability set.
- Do not assume EEV is constant.
- Do not infer real cryptographic verification from packet shape, cross-field consistency, transport success, or self-attested booleans.

## Existing repository anchors

The following artifacts are relevant inputs, not by themselves closure evidence:

- `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md`
- `docs/02-certification/NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md`
- `docs/02-certification/OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md`
- `docs/02-certification/LIVENESS_AND_PROGRESS_PROOF_SPECIFICATION.md`
- `IMMORTAL/kernel/UniversalEconomicKernel.hs`
- `IMMORTAL/state/UniversalEconomicState.hs`
- `PRE-RICH/onchain/PreRichLifecycleTransition.hs`
- `docs/audits/V3-VIABILITY-AUDIT-2026-10-05.md`
- `docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md` (on the B3 workstream)
- B3 witness/root-proof boundary tests and Materios proof handoff documents (on the B3 workstream)

## Evidence vocabulary

- **SPECIFICATION:** normative or architectural contract is written down.
- **STRUCTURAL:** schema, field presence, and cross-reference checks passed.
- **SYNTHETIC:** fixture or generated example passed; no live source is implied.
- **TRANSPORT-CAPTURED:** remote response/artifact was obtained; its contents are not yet independently verified.
- **CRYPTOGRAPHICALLY-VERIFIED:** proof signatures, quorum, ancestry, authority transitions and state/storage proof are independently checked as required by the proof type.
- **MODEL-CERTIFIED:** the independent checker verifies the declared chain-independent model claim under stated assumptions.
- **DEPLOYED/CHAIN-OBSERVED:** actual deployment or ledger state is independently observed. This is separate from MODEL-CERTIFIED.

Never promote a result to a stronger label without evidence that satisfies the stronger label's requirements.
