# IMMORTAL — Universal Kernel Consumer Inventory (Initial)
Date: 2026-10-28
Branch: `work/immortal-green-closure`
Status: **INITIAL / INCOMPLETE — not a certification or complete call-graph proof**

## Scope
Map known consumers and boundaries for `UniversalEconomicState`, `UniversalEconomicKernel`, `EconomicGate`, the V3 compatibility kernel, and the proof obligations around concrete `K_c` and admissible successors `Ω`. This document does not change economic semantics, constants, transition rules, or adapter policy.

## Source anchors inspected on this branch
- `IMMORTAL/state/UniversalEconomicState.hs` — blob `f89fe04c8aad8ca9c5e544fa9c145a38d157826f`
- `IMMORTAL/kernel/UniversalEconomicKernel.hs` — blob `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785`
- `IMMORTAL/kernel/EconomicGate.hs` — blob `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127`
- `PRE-RICH/onchain/PreRichEconomicProjection.hs` — blob `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13`
- `PRE-RICH/onchain/PreRichEconomicAdmission.hs` — blob `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a`
- `IMMORTAL/state/STATE-FIELD-OWNERSHIP.md` — blob `af6fd3cf0f904b1e45aa58e6b464797b4a3fed8c`
- `IMMORTAL/docs/ECONOMIC-GATE-CARDANO-CONFORMANCE-MATRIX.md` — blob `01b536b395a9dddef78cc342031451880165005f`
- `docs/COORDINATION/RF8_NO_SIDE_DOOR_SURFACE_AUDIT_20260924.md` — blob `4ef56cb9d3a70bf848c38816a067c7c44dc67957`
- `docs/COORDINATION/RF8_ECONOMIC_SURFACE_REACHABILITY_DELTA_20260924.md` — blob `b907396af1aad311b241eed3694546040cc693e2`

## Consumer / boundary inventory

| Consumer or surface | Current role | Classification | Evidence / limitation |
|---|---|---|---|
| `UniversalEconomicKernel` | Computes ProtectedCapital, RawSurplus, non-negativity and solvency | Universal kernel | Pure arithmetic over aggregate state; no chain API in the inspected module. These predicates do not themselves establish `K_c`. |
| `EconomicGate` | Checks verified-truth/freshness/completeness flags, immediate liquidity, and candidate solvency | Universal decision interface | Flags are supplied by callers. Gate comments explicitly state it does not manufacture truth, freshness, obligation coverage, or an Ω certificate. |
| `viabilityGate` / `executionAdmissible` | Consumes booleans for safe post-state and all relevant Ω successors in certified kernel | Universal interface / proof boundary | Boolean witness only; no enumeration of Ω, decision procedure for membership in `K_c`, or proof is implemented here. |
| `PreRichEconomicProjection.projectPreRichState` | Converts V3/profile state to universal aggregate; rejects inconsistent/unknown class data | PRE-RICH profile boundary | Knows ticket classes, profile payout multiplier, class exposure, and locked Jackpot. Correctly fail-closed in inspected path; full equivalence across all actions still requires tests/proof. |
| `PreRichEconomicAdmission.preRichEconomicAdmission` | Composes V3 transition, projection, Economic Gate and viability input | PRE-RICH admission consumer | Receives truth/freshness/completeness and Ω result as arguments; caller provenance and whole-program reachability remain to be demonstrated. |
| `EconomicStateV3` / `EconomicKernel` / `EconomicTransitionV3` | Rich compatibility state and profile-aware transition/economic rules | Legacy/V3 + application profile | Must remain for compatibility until action-by-action equivalence is demonstrated; not all fields belong in universal state. |
| `B1LegacyAdapter` / `plutus/B1PrizePool.hs` | Legacy Cardano datum translation and on-chain pool solvency | Cardano adapter / compatibility | Uses the universal state/kernel for selected checks, while preserving Cardano- and PRE-RICH-specific datum and lifecycle logic. Not evidence of a second adapter's equivalence. |
| `plutus/MintPolicy.hs` | Sale/mint and atomic treasury/pool checks | Cardano on-chain mutation surface | RF8 audit reports independent checks rather than proven invocation of one canonical Economic Gate. |
| `plutus/PrizeValidator.hs` | Reveal/Claim/Expire lifecycle checks | Cardano on-chain mutation surface | RF8 audit reports direct lifecycle/accounting checks; whole-program canonical-gate reachability remains open. |
| `plutus/Treasury.hs` | Treasury value movement/distribution | Cardano on-chain mutation surface | Separate economic surface; canonical-gate call path not proven by the cited audit. |
| `Adapter/REFERENCE/ReferenceAdapter.hs` | Deterministic replay of V3 actions and expected states | Reference/conformance harness | Replays V3 transitions; by itself does not prove a chain-neutral UniversalEconomicState contract or infinite-horizon viability. |
| `IMMORTAL/conformance/RefinementV3.hs`, `ProtectedCapitalConformance.hs`, `plutus/test/ProjectionBoundaryConformanceTest.hs` | Refinement and local preservation/conformance evidence | Tests / proof support | Local invariants and finite action vectors are useful but explicitly not infinite-horizon viability proofs. |
| Cardano observation / off-chain projections | Build observed state and candidate transactions | Off-chain evidence/adapter boundary | Must not be treated as economic authority; on-chain paths and authenticated evidence remain authoritative. |

## Findings

1. **A chain-neutral arithmetic core exists.** The inspected universal state and kernel do not import Cardano or Materios-specific APIs.
2. **The projection is not universal code.** PRE-RICH's class decomposition, profile multiplier and Jackpot state are deliberately handled at the application boundary. This is the correct ownership separation, but its preservation properties must be tested against the V3 reference for every canonical action.
3. **The gate is not an evidence oracle.** `EconomicGateInput` accepts booleans and EEV/liquidity values from upstream. Correctness depends on authenticated, fresh, complete and consistently bound evidence from the caller.
4. **No certified concrete `K_c` is established by the inspected code.** The viability API consumes a boolean for the Ω-successor condition. The required profile-specific model, successor relation, membership decision procedure and refinement/proof evidence remain open.
5. **Ω remains an external proof obligation.** Finite transition tests and local ProtectedCapital monotonicity do not establish that every relevant successor remains inside a safe set for an unbounded horizon.
6. **The Cardano implementation is not a cross-chain proof.** A second adapter must consume the same canonical economic vectors and demonstrate equivalent accept/reject results, while separately proving its state translation, finality, authority and atomicity assumptions.
7. **There is a related whole-program admission gap.** The RF8 audit identifies MintPolicy, B1PrizePool, PrizeValidator and Treasury as separate mutation surfaces and states that universal canonical-gate reachability has not been demonstrated. This is relevant to universal-kernel integrity but is not, by itself, proof of an economic-rule defect.

## Required next evidence (no new algorithm or parameters)

1. Complete the repository-wide import/call-site census on the exact current branch HEAD, including Haskell, TypeScript, Plutus validators, scripts, tests and workflow-generated entry points. Record path, symbol, caller, callee, classification and source SHA.
2. For each canonical action (Issue, Reveal, Claim, Expire), bind the same input and post-state to V3 and Universal projections and compare all universal economic outputs, not just compilation or a handful of examples.
3. Trace the provenance of every `EconomicGateInput` field to an authenticated producer; establish where `truthVerified`, `eevFresh`, `obligationsComplete`, available liquidity and the Ω witness are computed and validated.
4. Recover the existing normative specification for `(S, A, Accept, Ω, T, Safe)`, identify the intended definition of `K_c`, and write the exact proof obligation and falsifying counterexample strategy. Do not fill missing definitions by inventing parameters.
5. Demonstrate that each economically material Cardano mutation surface either reaches the canonical admission boundary or document the normative reason and equivalent enforcement proof for a separate path.
6. Only after the reference vectors and trust boundaries are stable, run a second adapter against the identical vectors and record per-vector accept/reject equivalence plus adapter-specific trust assumptions.

## Non-claims
- This is not a complete call-graph inventory.
- It does not claim a certified `K_c`, a complete `Ω`, or infinite-horizon safety.
- It does not authorize refactoring V3, changing kernel semantics, creating another branch, or selecting a new adapter.
- It does not establish that current branch HEAD equals the source anchors above; verify HEAD before extending this inventory.


## 2026-10-28 — Targeted source-level reachability pass

This section records exact file/blob anchors fetched from `work/immortal-green-closure`. These are **file blob SHAs**, not a claim about the branch HEAD SHA. The connector's code search indexes the default branch, so this pass uses explicit branch-ref file reads for the paths below. It is targeted evidence, not an exhaustive repository-wide import/call graph.

### Exact source anchors

| Path | Blob SHA | Observed symbol / call-site evidence | Classification |
|---|---|---|---|
| `IMMORTAL/kernel/EconomicGate.hs` | `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127` | Exports `economicGate`, `viabilityGate`, `executionAdmissible`; `executionAdmissible` composes economic gate and viability gate. | Universal decision API; proof inputs are supplied values/booleans. |
| `PRE-RICH/onchain/PreRichEconomicAdmission.hs` | `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a` | Imports `EconomicGate`; runs V3 transition, projects candidate, constructs `EconomicGateInput`, checks universal solvency, then calls `executionAdmissible`. Parameters include `truthVerified`, `eevFresh`, `obligationsComplete`, and `allOmegaSuccessorsInCertifiedKernel`. | Concrete PRE-RICH composition, but upstream provenance and Ω certificate production are not established by this function. |
| `PRE-RICH/onchain/PreRichEconomicProjection.hs` | `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13` | Defines `projectPreRichState`; module also exposes a projection/solvency conformance predicate comparing V3 and universal solvency. | Profile-specific refinement boundary; a local equality is not full action-by-action or infinite-horizon proof. |
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | `mkPolicy` calls `atomicTreasuryPaymentValid` and `atomicPoolReservationValid` in sale path; no direct named `economicGate` call observed in this source. | Independent Cardano sale/mint enforcement surface; refinement to canonical admissibility not established here. |
| `plutus/B1PrizePool.hs` | `106368b510a52447aa3de7ce951cf615466fc5e8` | Imports `UniversalEconomicKernel`; local `solvencyInvariant` calls `UniversalEconomicKernel.solvencyInvariant`; `mkValidator` and multiple action branches invoke local solvency checks. | Universal solvency integration exists; this is not proof every action follows canonical Gate→Viability. |
| `plutus/PrizeValidator.hs` | `2455f8283d87ff74a94b1b8bca1d1f96d60ae8b2` | Has direct `validateReveal`, `validateClaim`, `validateExpire` branches in `mkValidator`; no direct named universal gate call observed in source. | Separate lifecycle/accounting enforcement surface; refinement proof remains open. |
| `plutus/Treasury.hs` | `8313ed0672ce2a18c6156fce01db0ea75efddd1c` | `mkValidator` handles `Distribute`; inspected module does not import the universal kernel/admission modules. | Separate treasury distribution surface; common canonical gate/refinement not evidenced. |
| `plutus/PrizePool.hs` | `54c7ba920d89e2c6c43ecf09eb5359b180c9469c` | Has its own `mkValidator`; caller/deployment reachability not resolved by this file read. | Legacy pool surface; usage classification still required. |
| `plutus/BeaconRegistry.hs` | `184f4178139dde01845853dcc0ab51371949ec9b` | Has a `mkValidator`; this inspection did not establish that it is an economic authority. | Supporting/protocol-state surface pending bounded role classification. |
| `plutus/CounterValidator.hs` | `29d3bcf6d6a4a0b4348cfa5e17a61ec822093870` | Has a `mkValidator`; this inspection did not establish a universal-gate call. | Supporting issuance-counter surface; determine whether atomic pairing is sufficient. |
| `src/mint.ts` | `b9b1a7f4846e4cfdf8862368421b8ce7cf8b1534` | Candidate sale transaction construction; no assertion here that off-chain code is authoritative. | Off-chain transaction builder; ledger validator remains authority. |
| `src/gameFlow.ts` | `cab3f9d1c7c971b4127f9ae61d1477dc93454fd9` | Candidate game/lifecycle flow construction. | Off-chain orchestration; must be paired with on-chain validation. |

### Reachability matrix (source-level, not certified)

| Action/surface | Concrete entry observed | Named universal admission call observed in entry | What the current evidence supports |
|---|---|---:|---|
| PRE-RICH admission composition | `preRichEconomicAdmission` | Yes, via `executionAdmissible` | The composition exists; caller trust, witness provenance, and all live-entry reachability are still open. |
| SALE | `MintPolicy.mkPolicy` | No | Atomic treasury/pool predicates are present; equivalence to the canonical relation is unproven. |
| Pool lifecycle/accounting | `B1PrizePool.mkValidator` | Universal solvency only | Shared solvency predicate is used; complete Gate→Viability/action binding is unproven. |
| REVEAL / CLAIM / EXPIRE | `PrizeValidator.mkValidator` → action validators | No | Local lifecycle/accounting predicates exist; canonical refinement and bypass regression are missing. |
| TREASURY | `Treasury.mkValidator` | No | Independent distribution logic; normative equivalence or justified separation is not evidenced. |
| Legacy pool | `PrizePool.mkValidator` | Not established | Need exact deployment/reference caller and live/unreachable classification. |
| Beacon / counter | `BeaconRegistry.mkValidator`, `CounterValidator.mkValidator` | Not established | Their economic materiality and atomic pairing need classification, not assumption. |

### Findings sharpened by this pass

1. The universal gate and the PRE-RICH admission composition exist as source code, but a function's existence is not proof that all economic mutations reach it.
2. The main open gap is now concretely split into (a) producer/provenance for gate inputs and Ω, (b) static reachability from all live economic entry points, and (c) a semantics-preserving refinement proof for paths that use local predicates instead of the named gate.
3. The Cardano validators remain separate on-chain enforcement surfaces. Off-chain builders are not authority, and reference replay is not a ledger-level or infinite-horizon certificate.
4. The current source pass does not identify or authorize a refactor. Do not homogenize validators by inserting a symbol solely to satisfy a search; first establish the normative relation and intended architecture.

### Next evidence needed

- Establish the exact branch HEAD through a ref/commit query before describing this inventory as HEAD-pinned; the file reads above only prove the returned path/blob versions on the named ref.
- Complete recursive-tree and call-site search on that exact SHA, including imports, all references to `preRichEconomicAdmission`, `executionAdmissible`, `viabilityGate`, `projectPreRichState`, and validator script compilation/deployment wiring.
- Trace each `EconomicGateInput` field to the authenticated source and show where Ω is derived or certified. A caller-provided Boolean is not itself a certificate.
- Add negative bypass regressions and per-action V3↔universal state/output vectors before considering a second adapter.
- Keep RF8, U-02 consumer/call graph, and U-03 certified infinite-horizon viability OPEN until the corresponding evidence exists.

**Status:** targeted source-level pass recorded; inventory remains **INCOMPLETE**; no tests executed in this pass; no protocol semantics or constants changed.
