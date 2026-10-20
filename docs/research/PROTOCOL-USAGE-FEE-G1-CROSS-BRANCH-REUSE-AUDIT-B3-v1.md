# Protocol Usage Fee — Cross-Branch Reuse Audit (G1)
**Date:** 2026-10-20  
**Destination:** `work/b3-materios-provenance-evidence`  
**Status:** branch inventory and targeted cross-branch comparison complete; detailed file-level review remains selective  
**Scope:** determine whether existing work on other repository branches can advance G1 applicability without changing fee policy, production code, V3, or Reveal.

## 1. Method and limitation
Enumerated the repository's 25 branches and compared each non-target branch against `work/b3-materios-provenance-evidence` using GitHub compare metadata. Then fetched and read representative admission, transition-evidence, governance-authorization, treasury/fee, RF8, Materios provenance, and B-R1 protection artifacts from the most relevant branches.

This is **not** a claim that every file and every commit in all 25 branches has been read line-by-line. The comparison gives a branch-level change inventory; the file-level review below is targeted to likely reuse surfaces. GitHub code search is indexed against the default branch, so branch-specific conclusions were grounded in explicit branch refs and fetched paths, not assumed from default-branch search results.

No code, test, CI, deployment, or on-chain behavior was changed by this audit.

## 2. Branch inventory
Branches enumerated:
- `audit/adapter-sale-conformance`
- `audit/claim-b1-conformance`
- `audit/kernel-invalid-class-fail-closed`
- `audit/p2-8-b1-baseline-size-2026-09-21`
- `audit/p2-8-b1-cardano-ledger-runner`
- `audit/p2-8-b1-inline-haskell-uplc-diagnostic-2026-09-21`
- `audit/p2-8-b1-inline-runtime-diagnostic-2026-09-21`
- `audit/p2-8-b1-lucid-evolution-2026-09-21`
- `audit/p2-8-b1-reference-budget-diagnostic-2026-09-21`
- `audit/p2-8-b1-reference-scripts-2026-09-21`
- `audit/p2-8-reveal-size-2026-09-21`
- `b1-hardening`
- `backup/main-before-curated-promotion-2026-09-24`
- `copilot/fix-real-preprod-reveal-job`
- `feat/pre-rich-game-ui`
- `fix/cardano-lab-yaci-info`
- `main`
- `merge/workflow-b-closed-main`
- `ops/b2-preprod-new-workflow`
- `ops/b2-preprod-zero-input-dispatch`
- `ops/expose-b2-preprod-dispatch`
- `release/issue-admission-boundary-squash`
- `release/public-main-curated-2026-09-24`
- `work/b3-materios-provenance-evidence` (target)
- `work/immortal-green-closure`

The P2.8 diagnostic branches largely share the same older baseline and specialize in ledger/runtime/size debugging. They are not the first reuse source for G1 policy. The more promising research surfaces are listed below.

## 3. Reusable findings

### A. `release/public-main-curated-2026-09-24` — strongest admission/evidence binding reference
Relevant files:
- `Adapter/CARDANO/runtime/EconomicAdmission.ts`
- `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts`
- `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts`

Observed reusable patterns:
- explicit canonical action class (Issue/Reveal/Claim/Expire) in an admission witness;
- action fingerprint, pre-state fingerprint, and candidate post-state fingerprint;
- binding admission witness to canonical transition evidence;
- protocol/profile/adapter version and environment metadata;
- evidence validator checks digest-shaped fingerprints and rejects mismatches.

Limit:
- these artifacts bind a Cardano submission/admission witness to transition evidence; they do **not** implement a universal Protocol Usage Fee applicability declaration, select fee-bearing classes, authenticate a G1 declaring authority, or prove that a declaration is included in the normative economic transition.
- Treat as interface/conformance precedent only; do not copy the Cardano-specific witness wholesale into IMMORTAL.

### B. `audit/p2-8-b1-reference-scripts-2026-09-21` — useful boundary and governance precedent
Relevant files:
- `Adapter/CARDANO/runtime/EconomicAdmission.ts`
- `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts`
- `IMMORTAL/governance/GovernanceAuthorization.hs`
- coordination and conformance artifacts.

Observed:
- adapter admission witness explicitly states that the Adapter does not calculate EEV, ProtectedCapital, viability, or the economic gate;
- canonical transition evidence is explicitly evidence-only and not economic authority;
- governance authorization checks event/actor-class compatibility, non-empty evidence references, registered ruleset version, and commitment matching.

Limit:
- the inspected `GovernanceAuthorization.hs` is a narrow event/actor-class validator, not a complete G1 authority model. It does not by itself settle who may declare fee applicability or how revocation/staleness/profile binding work.
- Reuse the separation principle and validation categories, not its actor classes or authorization semantics.

### C. `b1-hardening` — universal economic kernel / profile separation precedent
Branch comparison exposed:
- `IMMORTAL/kernel/UniversalEconomicKernel.hs`
- `IMMORTAL/state/UniversalEconomicState.hs`
- `IMMORTAL/state/EconomicProfile.hs` (reported in the branch comparison; exact file presence must be checked before reuse)
- Economic Gate and cross-transition conformance work.

The fetched `UniversalEconomicKernel.hs` computes ProtectedCapital from explicit liability/exposure/safety/reserve/future-cost components, derives RawSurplus as `max 0 (EEV - ProtectedCapital)`, and checks non-negativity and solvency. This reinforces that fee inflows or declarations must not be used as a side door around existing protected-capital and solvency invariants.

Limit:
- it is not a fee applicability producer and does not close G1.
- No change to V3/Reveal or protected-capital semantics is proposed.

### D. `work/immortal-green-closure` — fee ownership, no-side-door and evidence maturity
Relevant documents:
- `docs/COORDINATION/FRONT-IMMORTAL-TREASURY-FEE.md`
- `docs/COORDINATION/FRONT-FEE-GOVERNANCE-BUILD-INCENTIVES.md`
- `docs/COORDINATION/RF8_NO_SIDE_DOOR_SURFACE_AUDIT_20260924.md`
- `docs/papers/B3_EVIDENCE_MATURITY_AUDIT.md`
- `docs/COORDINATION/B-R1-PROTECTION-INTERFACE-CONTRACT-20261014.md`
- `audit/jev/MATERIOS-EVIDENCE-INGRESS-v0.1.md`

Reusable conclusions:
- no normative universal Treasury field/custody policy has been authorized;
- fee revenue, ChainExecutionCost, ProtectedCapital, RawSurplus, mandatory costs, and reward budget must remain distinct;
- fee/reward coupling is exploratory and cannot silently create a circular incentive rule;
- unknown, stale, unauthenticated, incomplete, or profile-incompatible evidence cannot weaken protection;
- evidence registries and artifact digests do not themselves establish authority or cryptographic truth;
- a gate must bind evidence to operation, network, checkpoint, and relevant protocol/configuration version, and fail closed on missing or mismatched required evidence;
- RF8's whole-program no-side-door proof was still open in that audit. Do not treat a passing local test or a UI declaration as proof that every economic mutation reaches the canonical gate.

### E. `main`, `fix/cardano-lab-yaci-info`, `merge/workflow-b-closed-main`, `ops/b2-preprod-new-workflow`, `release/issue-admission-boundary-squash`
The branch diffs expose the same family of `issue-admission-boundary-ci.yml` and `EconomicAdmission.test.ts` changes, with some branch-specific changes to the V3 carrier mint policy or Materios ingress. These are useful regression/admission references but do not establish G1 declaration authority. Their shared ancestry means they should not be counted as independent proofs.

### F. `feat/pre-rich-game-ui`
The diff includes changes to `EconomicAdmission.ts`, `HaskellIssueAdmissionProvider.ts`, `IssueAdmission.hs`, and V3 carrier binding tests. Useful for understanding the application-level issue-admission boundary. It remains PRE-RICH/Cardano-specific and is not a universal fee declaration seam.

### G. B3 provenance branch and Materios artifacts
The B3/Green Closure evidence-maturity material is directly relevant to provenance discipline: distinguish observation, verified proof, authority/finality, and deployment conformance. This supports the G1 requirement that a declaration's evidence reference is not equivalent to authenticated declaring authority.

The reviewed Materios ingress contract explicitly says that recording an artifact does not cryptographically verify its claims and that JEV itself does not authorize a transaction. Reuse this evidence-class separation; do not assume Materios receipts supply the missing fee declaration authority.

## 4. What we can safely reuse for G1
1. **Canonical identity binding pattern:** bind a declaration to a stable profile/deployment version and canonical action class, with state/transition identity where the governing specification requires it.
2. **Evidence/authority separation:** keep declaration authority verification distinct from validating that an evidence packet exists, is hashed, or matches a transition.
3. **Admission boundary pattern:** the Adapter may enforce presence and binding of an authoritative admission witness, but must not define fee applicability or calculate universal economic truth.
4. **Fail-closed evidence rules:** missing, stale, conflicting, untrusted, or profile-mismatched declarations cannot be silently interpreted as fee-bearing or fee-exempt.
5. **No-side-door conformance:** eventual tests must prove fee obligation inclusion in the canonical candidate transition before Safe/`K_c` and atomic commit, and must reject alternate admission paths.
6. **Reuse existing transition evidence rather than inventing a second state machine:** G1 should be a verified input to the existing canonical transition, not an independent fee transition.

## 5. What cannot be imported
- PRE-RICH Treasury, Jackpot, ticket ladder, or settlement asset semantics as universal IMMORTAL rules.
- Cardano-only admission witness types as universal protocol types without a separate normative specification.
- Governance event actor classes as a ready-made fee-declaration authority.
- Presence of a digest, signature-shaped field, evidence URI, CI pass, or registry record as proof of authority unless a canonical verifier/predicate validates it.
- Any candidate action class as fee-bearing without the G1 profile/deployment decision.
- Any fee amount, price function, coefficient, threshold, reward policy, or declaration signer invented by engineering.
- Changes to V3/Reveal semantics.

## 6. Current G1 conclusion
**G1 remains OPEN.** The branch sweep found reusable admission/evidence-binding and fail-closed patterns, but no inspected artifact establishes the missing universal fee-applicability declaration producer plus its canonical authority predicate and integration into the existing economic transition.

The most useful next step is a targeted source-level trace on the target branch:
1. map the canonical action-class source and its relation to the profile/deployment identity;
2. map the authoritative input verification predicate used by the canonical transition;
3. determine the narrowest place a G1 declaration can enter that existing verified-input path;
4. prove fee obligations are derived before candidate post-state safety/`K_c` checks;
5. define the negative cases for absent, stale, conflicting, revoked, and profile-mismatched declarations without inventing policy;
6. only after the normative authority/decision is explicit, write implementation and conformance tests.

No fee-bearing class has been selected by this audit. No normative decision has been made. No production code or tests have been changed.
