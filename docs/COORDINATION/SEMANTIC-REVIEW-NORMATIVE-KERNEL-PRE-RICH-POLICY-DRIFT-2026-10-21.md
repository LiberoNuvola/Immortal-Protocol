# Semantic Review — IMMORTAL Universal Kernel, PRE-RICH Projection, and Normative Source Drift

**Review date:** 2026-10-21  
**Review ID:** `SEM-NORMATIVE-KERNEL-PRE-RICH-POLICY-DRIFT-2026-10-21`  
**Protocol-source snapshot:** `3373b3044b9c251da1ec217d128f5dcb3c87c894`  
**Scope:** static review of the canonical IMMORTAL normative corpus, the chain-neutral economic gate, PRE-RICH's V3-to-universal projection, the Cardano Adapter observation boundary, and current economic-policy status labels. No protocol source, normative policy or conformance workflow was changed or rerun.

## Executive disposition

The reviewed source code has a coherent **application-neutral aggregate boundary**: the universal kernel does not contain PRE-RICH ticket classes or Jackpot lifecycle, and the PRE-RICH projection moves the locked Jackpot amount into `additionalProtectedCapital` while checking equality of the V3 and universal `ProtectedCapital`, `RawSurplus` and solvency functions for projected states. Test source covers representative Issue/Reveal/Claim/Expire and locked-Jackpot cases plus fail-closed invalid projections.

Two distinct issues remain:

1. **Normative-document drift:** current PRE-RICH sources disagree about whether Jackpot payout mode and exact expiry duration are open decisions. The current `GAME-ECONOMY.md` and the reconciled decision register close the mechanism/payout decisions, but `PRE-RICH/docs/CONSTITUTION.md` and `PRE-RICH/docs/ECONOMIC-ALGORITHM.md` retain the old `OPEN-01/OPEN-02` statements. Because the Constitution is presented as the application constitution and sits higher in the stated source-of-truth hierarchy than Game Economy, this must be reconciled explicitly; the audit must not resolve the conflict by silently choosing one file.
2. **Conformance is still partial:** the source-level projection equivalence is not the same as end-to-end IMMORTAL → PRE-RICH → Adapter → Cardano equivalence. The conformance matrix itself keeps Economic Gate integration/authority bindings, viability certification and full Cardano equivalence OPEN. The Adapter observation helper validates canonical shape and a non-negative timestamp; its successful return is not an authenticity/freshness/obligation-completeness certificate.

## A. Canonical normative corpus — universal semantics

The root normative documents identify themselves as the authoritative IMMORTAL v3.0.0 corpus. The core boundaries are consistent:

- `docs/00-normative/01_CONSTITUTION_FINAL.md` declares IMMORTAL chain- and application-neutral, requires canonical authority instead of discretionary infrastructure authority, and makes expiry final.
- `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` defines `RawSurplus = max(0, EEV − ProtectedCapital)` as an accounting boundary, not an authorization to distribute or execute. It explicitly keeps `CAR` as the universal conditional-allocation abstraction and `Jackpot` as PRE-RICH-specific terminology.
- `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md` distinguishes the mathematical viability kernel `K*` from the deployment-supplied certified concrete kernel `K_c`. Its non-claims explicitly say the corpus does not prove `K* ≠ ∅` universally, that a certified `K_c` exists for every profile, or that any adapter has complete `Ω` coverage.
- `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md`, `05_INVARIANTS_CONSERVATION_FINAL.md` and `07_CONFORMANCE_SPECIFICATION_FINAL.md` require canonical state, authoritative inputs, complete post-state, post-state safety, a certified `K_c`, atomic coupled transitions and evidence-backed refinement/conformance. An adapter observation or an economic gate interface alone cannot establish those properties.

This is an important universal/app-specific separation, not a policy defect: PRE-RICH's class ladder, price profile, reserve formula and Jackpot lifecycle must remain owned by the PRE-RICH profile and cannot become IMMORTAL constants.

## B. V3 → UniversalEconomicState projection — source boundary is coherent

### Static mapping checked

`IMMORTAL/state/UniversalEconomicState.hs` holds only application-neutral aggregates: crystallized liabilities, unresolved reserve/count, worst-case exposure, safety capital, reserve protection, mandatory future costs and additional protected capital.

`IMMORTAL/kernel/UniversalEconomicKernel.hs` computes universal protected capital as:

`liabilities + worstCaseExposure + safetyCapital + reserveProtection + mandatoryFutureCosts + additionalProtectedCapital`

`IMMORTAL/kernel/EconomicKernel.hs` computes PRE-RICH V3 protected capital from crystallized liabilities, class-aware worst-case exposure, safety capital, reserve protection, locked Jackpot and mandatory future costs.

`PRE-RICH/onchain/PreRichEconomicProjection.hs`:
- rejects an invalid profile or negative state;
- rejects duplicate/unknown ticket classes and class exposure not equal to `price × unresolved`;
- derives exposure from the profile's maximum payout multiplier;
- checks the aggregate unresolved reserve and unresolved count against class-wise sums;
- maps `jsLockedAmount (v3Jackpot s)` into universal `uesAdditionalProtectedCapital`;
- defines `projectionBoundaryEquivalent` to compare V3 and universal `ProtectedCapital`, `RawSurplus` and solvency predicates.

The mapping is appropriately application-owned; it does not leak Jackpot semantics into the universal type. `PRE-RICH/onchain/PreRichEconomicAdmission.hs` composes structural transition validation, the fail-closed projection, explicit EEV/executable-liquidity inputs, `EconomicGate` and an explicit `Ω/K_c` successor result. Its comments correctly state that caller-supplied booleans are an interface and must be tied to upstream verified evidence.

### Existing test source and its scope

`plutus/test/ProjectionBoundaryConformanceTest.hs` includes:
- equality of the V3/universal protected-capital boundary;
- exact raw-surplus value checks;
- Issue/Reveal/Claim/Expire component deltas;
- explicit locked-Jackpot preservation;
- fail-closed cases for inconsistent reserve/count, duplicate/unknown classes, inconsistent class exposure and negative protected components.

`.github/workflows/immortal-economic-gate-conformance.yml` defines `cabal test economic-gate-tests`. This review read the test/workflow source but did not rerun it. These tests establish a bounded projection test contract; they do not themselves prove current Actions success, authenticated production observations, a certified `K_c`, complete `Ω`, or full Cardano ledger equivalence.

The `IMMORTAL/docs/ECONOMIC-GATE-CARDANO-CONFORMANCE-MATRIX.md` (non-normative audit matrix) correctly states that the universal aggregate boundary is additive and that full V3 → PRE-RICH → Adapter → Cardano equivalence, authoritative observation provenance, and viability certification remain OPEN. That does not contradict local projection equality; it describes the wider, still-unproved composition boundary.

## C. Adapter observation semantics — shape validation is not authority

`Adapter/CARDANO/serialization/CanonicalEconomicState.ts` deliberately validates the non-negative shape of the already-derived chain-neutral state. It does not derive EEV or certify application-specific decomposition.

`Adapter/CARDANO/observation/EconomicObservation.ts` rejects negative `observedAt` and validates the state shape, then returns `{ ok: true, observation }`. Its optional `stateHash` is not checked by this function, and the function does not check a freshness window, signer, canonical transaction reference, authenticated datum provenance or complete obligations. Its own comments say the Adapter accepts an **already-derived** state and does not interpret PRE-RICH policy.

That boundary is acceptable as a structural helper only. Any caller or dashboard must not interpret `ok: true` from this helper as proof of authoritative truth, current freshness, direct-USDM qualification, or Issue authorization. Those claims require the explicit authoritative observation/refinement and certificate gates documented in the current conformance matrix and B1 Issue review.

## D. Normative policy-source drift — requires an explicit reconciliation record

The following statements conflict in the currently pinned green snapshot:

| Source | Current label | Review interpretation |
|---|---|---|
| `PRE-RICH/docs/CONSTITUTION.md` | “The approved payout-mode policy remains open”; “Exact duration remains open” | Stale / conflicts with later policy closure; this file is presented as the project/application Constitution |
| `PRE-RICH/docs/ECONOMIC-ALGORITHM.md` | Jackpot section says `OPEN-01 controls payout mode`; expiry section says `OPEN-02` is exact ticket lifetime | Stale open-decision labels remain visible in application algorithm prose |
| `PRE-RICH/docs/GAME-ECONOMY.md` | Semantic status CLOSED; full current locked-Jackpot payout exactly once; expiry mechanism CLOSED; exact lifetime is DApp/profile parameter | Current effective PRE-RICH application policy in the refreshed source snapshot |
| `docs/03-audit/ECONOMIC-ALGORITHM-CONFORMANCE-MATRIX.md` | OPERATIONAL / NON-NORMATIVE; “no unresolved normative economic decisions” in the represented Game Economy baseline; explicitly supersedes the former three-item list | Current reconciliation/coordination evidence, not a higher normative source by itself |
| Notion Control Center / checkpoint §10.23 | Reconciles old `OPEN SET` and decision-register snapshots to A1/A2/A3 closure | Historical Notion headers are preserved as provenance, but the PRE-RICH Constitution and Algorithm file still need an explicit pointer/status correction |

The current effective decision register documented elsewhere in the checkpoint is:
- A1: state-derived expiry mechanism CLOSED; PRE-RICH V1 profile bounds 2 hours–300 days are application parameters, not IMMORTAL constants; on-chain `issuedAt`/`expiresAt` binding is still an implementation/conformance blocker.
- A2: full current locked Jackpot balance paid exactly once CLOSED.
- A3: no fixed Jackpot allocation percentage; default funding is the minimum state-derived gap to the floor CLOSED.

**No new economic decision is proposed by this review.** The discrepancy must not reopen those semantic choices by default, nor should an audit note silently rewrite a higher-level application Constitution. Recommended next governance action is a narrowly scoped, versioned documentation reconciliation: state which later dated decision supersedes `OPEN-01/OPEN-02`, explicitly mark the old labels as historical/superseded, and update the source-of-truth index without changing current game mechanics. The normative owner should approve that source-label reconciliation before edits to the Constitution itself.

There is a second, smaller authority-label inconsistency: `IMMORTAL/docs/ECONOMIC-ALGORITHM.md` declares itself a **NON-NORMATIVE INTEGRATIVE READER GUIDE** at the top, but its final status paragraph calls the algorithm “normative protocol logic.” The file also points readers to `docs/00-normative/` as canonical. This should be clarified as an authority-label fix, not a semantic change.

## SHA-pinned source register

All SHAs below are blob identities at protocol-source snapshot `3373b3044b9c251da1ec217d128f5dcb3c87c894`.

| Path | Blob SHA | Classification |
|---|---|---|
| `docs/00-normative/01_CONSTITUTION_FINAL.md` | `744357df17bd07972dcbeeadbd752fb2e740e196` | `REVIEWED_STATIC_CANONICAL_CONSTITUTION` |
| `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` | `04c79bc3d5397e70668de547e14bf4801fa358ce` | `REVIEWED_STATIC_UNIVERSAL_APP_POLICY_BOUNDARY` |
| `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md` | `535274985e822c32854236520ef4b68b88cb77d8` | `REVIEWED_STATIC_KERNEL_THEOREMS_AND_NONCLAIMS` |
| `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md` | `a549e35855509aa32ce6462d638aa17d54cd1e6a` | `REVIEWED_STATIC_POSTSTATE_AND_KC_GATE` |
| `docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md` | `e78a1e9584966d18498a385a0c2da6edae06ef7c` | `REVIEWED_STATIC_OBLIGATION_AND_CONSERVATION_INVARIANTS` |
| `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md` | `269dd421aaeebdb9b9176d7d0957914976bb77f8` | `REVIEWED_STATIC_REFINEMENT_AND_EVIDENCE_REQUIREMENTS` |
| `IMMORTAL/docs/CONSTITUTION.md` | `744b69ad8ea4414ef90dde90da0ad394e013f88e` | `REVIEWED_NON_NORMATIVE_GUIDE_WITH_CANONICAL_POINTER` |
| `IMMORTAL/docs/ECONOMIC-KERNEL.md` | `869959e638d9ea0533fddbd5386600df23aae2a9` | `REVIEWED_NON_NORMATIVE_KERNEL_GUIDE` |
| `IMMORTAL/docs/ECONOMIC-ALGORITHM.md` | `3d6e6cadb79b73f5aaab599819e5882ddc21e896` | `REVIEWED_STATIC_CONFLICTING_AUTHORITY_LABELS` |
| `PRE-RICH/docs/CONSTITUTION.md` | `009ac8f86eb9be7f3be3a27b93cbb9ba6b772483` | `REVIEWED_STATIC_STALE_OPEN_DECISION_LABELS` |
| `PRE-RICH/docs/ECONOMIC-ALGORITHM.md` | `ab4db387987eecd952e40ddcabd3b7faeddf65cb` | `REVIEWED_STATIC_STALE_OPEN_01_OPEN_02_LABELS` |
| `PRE-RICH/docs/GAME-ECONOMY.md` | `41f69f7c7e7d31a776a92dcd942a3098848947fb` | `REVIEWED_STATIC_CURRENT_POLICY_CLOSURE` |
| `IMMORTAL/state/UniversalEconomicState.hs` | `f89fe04c8aad8ca9c5e544fa9c145a38d157826f` | `REVIEWED_STATIC_CHAIN_NEUTRAL_STATE_SCHEMA` |
| `IMMORTAL/kernel/UniversalEconomicKernel.hs` | `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785` | `REVIEWED_STATIC_UNIVERSAL_PROTECTED_CAPITAL_FORMULA` |
| `IMMORTAL/kernel/EconomicKernel.hs` | `229972487522da6392ff29aa97581096ebc0ff15` | `REVIEWED_STATIC_V3_PROFILE_BOUNDARY` |
| `IMMORTAL/kernel/EconomicGate.hs` | `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127` | `REVIEWED_STATIC_EXPLICIT_EEV_LIQUIDITY_AND_KC_GATE` |
| `PRE-RICH/onchain/PreRichEconomicProjection.hs` | `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13` | `REVIEWED_STATIC_FAIL_CLOSED_V3_TO_UNIVERSAL_PROJECTION` |
| `PRE-RICH/onchain/PreRichEconomicAdmission.hs` | `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a` | `REVIEWED_STATIC_GATE_COMPOSITION_REQUIRES_TRUSTED_CALLER_INPUTS` |
| `PRE-RICH/onchain/PreRichIssueDecision.hs` | `ec37ea8e656fa399f1e57e2404e0c6a2c5b5ccee` | `REVIEWED_STATIC_CANONICAL_ISSUE_DECISION_PRODUCER` |
| `IMMORTAL/state/EconomicStateV3.hs` | `632b3bc5f38be8f5a7f5f8de8187447bc0be33ba` | `REVIEWED_STATIC_PROFILE_RICH_STATE_SCHEMA` |
| `Adapter/CARDANO/serialization/CanonicalEconomicState.ts` | `4754f76d1b6c30f0e6c6032f0e85e82756210c71` | `REVIEWED_STATIC_SHAPE_VALIDATION_NOT_TRUTH_CERTIFICATION` |
| `Adapter/CARDANO/observation/EconomicObservation.ts` | `18d3cb05181b20929fe744d2f1e21fb78c94df88` | `REVIEWED_STATIC_NON_AUTHORITATIVE_OBSERVATION_WRAPPER` |
| `plutus/test/ProjectionBoundaryConformanceTest.hs` | `0fe51f1bd841135068f1957860727948242df297` | `REVIEWED_TEST_SOURCE_NOT_RERUN_IN_THIS_SLICE` |
| `plutus/test/EconomicGateTest.hs` | `28d6b0ac63c6a49ce30b0004656757442a56e7fa` | `REVIEWED_TEST_SOURCE_NOT_RERUN_IN_THIS_SLICE` |
| `.github/workflows/immortal-economic-gate-conformance.yml` | `e3769b4151c21e777da15d6ed59d40d0ceeffde1` | `REVIEWED_WORKFLOW_TEST_GATE_NOT_DISPATCHED_HERE` |
| `IMMORTAL/docs/ECONOMIC-GATE-CARDANO-CONFORMANCE-MATRIX.md` | `01b536b395a9dddef78cc342031451880165005f` | `REVIEWED_NON_NORMATIVE_OPEN_CONFORMANCE_MATRIX` |
| `docs/03-audit/ECONOMIC-ALGORITHM-CONFORMANCE-MATRIX.md` | `a55b735b499f2ef60834956cb6afe5512c7ac59d` | `REVIEWED_NON_NORMATIVE_POLICY_RECONCILIATION` |

## Closure gates

1. Obtain an explicit governance-approved supersession note for the PRE-RICH Constitution and Economic Algorithm's stale `OPEN-01/OPEN-02` text, pointing to the dated A1/A2/A3 decision closure and preserving historical provenance.
2. Clarify the IMMORTAL algorithm guide's self-contradictory normative/non-normative label without changing any formula.
3. Keep direct source authority, observation freshness, obligation completeness, `K_c` certification and full `Ω) coverage in the upstream evidence/conformance gates; a structurally valid observation or a projection equality test is not enough.
4. Rerun the economic-gate conformance suite and preserve results at the exact source SHA when a suitable test run is next executed. Continue to leave end-to-end Cardano equivalence OPEN until the B1/Pyth/Reveal and native ledger gates are evidenced.

**Current verdict:** universal kernel/profile decomposition **STATICALLY COHERENT AT THE REVIEWED PROJECTION BOUNDARY**; V3-to-Cardano and authority/evidence integration **OPEN**; PRE-RICH `OPEN-01/OPEN-02` source-label conflict **CONFIRMED**; no new normative choice authorized. Overall audit remains **PARTIAL / OPEN**. This review changed documentation only; no protocol source, economic parameter, policy decision, workflow run, branch topology or ledger state changed.
