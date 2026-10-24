# IMMORTAL — Universal Kernel Boundary / Consumer Map

**Date:** 2026-10-24  
**Branch reviewed:** `work/immortal-green-closure`  
**Source HEAD:** `70a0b0cc3ef9136c9e2972a085b27d8705c9ff5f`  
**Role:** source-level coordination evidence; non-normative. It cannot replace the IMMORTAL Constitution, Economic Kernel, Architecture specifications, or adapter contracts.

## Purpose and classification

This is a focused map of the universal economic state/gate path and its most important Cardano consumers. It narrows C6.2 and RF8, but is **not** a complete whole-repository call graph and does not close either obligation. Only source files were fetched and inspected. No Haskell/Plutus/TypeScript test or ledger run was executed as part of this map.

## Canonical chain and projection

| Layer | Exact source blob | Observed responsibility | Evidence limit |
|---|---|---|---|
| Universal state | `IMMORTAL/state/UniversalEconomicState.hs` — `f89fe04c8aad8ca9c5e544fa9c145a38d157826f` | Defines the chain-neutral aggregate state; application-specific class/Jackpot structures are intentionally omitted. | State type alone proves no source authenticity or execution. |
| Universal arithmetic/invariants | `IMMORTAL/kernel/UniversalEconomicKernel.hs` — `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785` | Exposes `protectedCapital`, `rawSurplus`, `nonNegativeState`, `solvencyInvariant`; `RawSurplus = max 0 (EEV - ProtectedCapital)`. | Arithmetic and predicates are not a certified viable-kernel certificate. |
| Gate / viability interface | `IMMORTAL/kernel/EconomicGate.hs` — `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127` | `economicGate` consumes truth/freshness/completeness/liquidity inputs and candidate state; `viabilityGate` consumes safe-post-state and all-Ω-successors-in-certified-kernel booleans; `executionAdmissible` composes them. | The module explicitly states the booleans must already be bound to authoritative mechanisms; it does not itself authenticate them or provide CK1–CK8 proof. |
| PRE-RICH projection | `PRE-RICH/onchain/PreRichEconomicProjection.hs` — `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13` | Projects V3/application state into universal aggregates; `projectionBoundaryEquivalent` compares protected capital, surplus and solvency predicates between V3 and universal forms. | Projection equivalence is not proof that every concrete validator calls the projection. |
| PRE-RICH admission composition | `PRE-RICH/onchain/PreRichEconomicAdmission.hs` — `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a` | Composition path: structural transition validation → candidate V3 state → projection → supplied EEV/liquidity/evidence booleans → `executionAdmissible`. | A callable composition module is not proof that every production validator or mint path reaches it. |

## Concrete mutation/consumer surfaces

All source blob identities below were fetched from the same green branch ref during this review.

| Surface | Source blob | Direct universal-kernel/gate reference observed | Classification |
|---|---|---|---|
| SALE / mint | `plutus/MintPolicy.hs` — `0d59fc05b4c11873984fffd10014bd46d8470509` | Imports local `Economic` and types; no direct import of `UniversalEconomicKernel` or `EconomicGate` observed. Sale path uses local atomic Treasury/payment and pool-reservation checks. | Independent economic admission/refinement surface; canonical-gate equivalence remains unproved. |
| Pool lifecycle | `plutus/B1PrizePool.hs` — `106368b510a52447aa3de7ce951cf615466fc5e8` | Imports `UniversalEconomicKernel` and `UniversalEconomicState`; local `solvencyInvariant` wraps `UniversalEconomicKernel.solvencyInvariant` and is used at validator/action points. | Universal solvency is connected, but this does not establish that each action follows the full candidate-state → gate → viability sequence. |
| Reveal / Claim / Expire | `plutus/PrizeValidator.hs` — `2455f8283d87ff74a94b1b8bca1d1f96d60ae8b2` | Imports local economic/game rules; no direct `EconomicGate` or `UniversalEconomicKernel` reference observed. Dispatches to `validateReveal`, `validateClaim`, `validateExpire`. | Independent lifecycle predicate surface; refinement and no-bypass proof remain open. |
| Legacy pool | `plutus/PrizePool.hs` — `54c7ba920d89e2c6c43ecf09eb5359b180c9469c` | No direct universal-kernel/gate reference observed; module defines its own `mkValidator`. | Must be classified as live/legacy/unreachable by consumer and script-deployment references; cannot be excluded by filename alone. |
| Treasury distribution | `plutus/Treasury.hs` — `8313ed0672ce2a18c6156fce01db0ea75efddd1c` | Uses Treasury types and a `Distribute` action; no universal-kernel/economic-admission import observed. | Separate economic value-movement surface; common admissibility/refinement not proved. |
| Issuance counter | `plutus/CounterValidator.hs` — `29d3bcf6d6a4a0b4348cfa5e17a61ec822093870` | Monotonic counter validator; no direct universal-gate reference observed. | Supporting state integrity; classify its economic consequences via transaction graph before determining whether it is merely supporting. |
| Beacon registry | `plutus/BeaconRegistry.hs` — `184f4178139dde01845853dcc0ab51371949ec9b` | Registry state/round validator; no direct universal-gate reference observed. | Trust-mode/context boundary; do not assume economic neutrality without classifying reachable transitions. |
| Cardano serialized state boundary | `Adapter/CARDANO/serialization/CanonicalEconomicState.ts` — `4754f76d1b6c30f0e6c6032f0e85e82756210c71` | Chain-neutral aggregate type and `validateCanonicalEconomicState`. | Shape validation cannot prove where values came from or that they are fresh. |
| Cardano observation wrapper | `Adapter/CARDANO/observation/EconomicObservation.ts` — `18d3cb05181b20929fe744d2f1e21fb78c94df88` | `acceptEconomicObservation` rejects negative timestamps and calls the state-shape validator. | `stateHash` is optional and not recomputed by this function; `observedAt` is not checked for age; source enum is metadata. This function is a structure/shape acceptor, not a source-authenticity, hash-binding or freshness verifier. Callers must not promote its `ok: true` to authenticated observation. |

## Existing conformance evidence and its limit

- `plutus/test/CardanoUniversalBoundaryConformanceTest.hs` — blob `48d2ba96e21648978bf1b13474b4b2e715e2b34e`: exercises projection/boundary predicates in a test harness; it is not a runtime call-graph proof.
- `plutus/test/EconomicAdmissionTest.hs` — blob `b6bc5f4fcadfd1393a09ffa49c5997dd6d044186`: tests the admission composition; source existence/test vectors alone do not establish every validator uses that composition.
- `audit/cardano-integration/preprod-conformance-binding.mjs` — blob `7e96ea2d5b29ad974b804961b48ebdc290675457`: hashes selected normative/projection/test sources into a conformance binding. Hash binding is provenance of files, not proof of universal call reachability.
- `docs/COORDINATION/RF8_NO_SIDE_DOOR_SURFACE_AUDIT_20260924.md` — blob `4ef56cb9d3a70bf848c38816a067c7c44dc67957` and `RF8_ECONOMIC_SURFACE_REACHABILITY_DELTA_20260924.md` — blob `b907396af1aad311b241eed3694546040cc693e2` already identify the same unresolved gate/refinement reachability issue. This map consolidates their relevant current source identities rather than claiming a fresh test result.

## C6.2 / RF8 status and next proof

**Status: BLOCKED_INTERNAL for complete consumer-map closure; RF8 OPEN.** The map above covers the principal known surfaces, but is not the required complete consumer/call-site graph for all canonical types and all deployed script references.

The next action is to finish exact-head source/call-site inventory for:
1. all references and imports of `UniversalEconomicState`, `UniversalEconomicKernel`, `EconomicGate`, `PreRichEconomicAdmission` and `CanonicalEconomicState`;
2. all build/export/script-address consumers that determine which validators are actually compiled/deployed/consumed;
3. every canonical action (SALE, REVEAL loss/win, CLAIM, EXPIRE, Jackpot lifecycle, Treasury distribution, class/control transitions) and its concrete entrypoint;
4. one negative bypass regression per economically material route, plus a source/call-graph check that fails if a new path is added without a classification.

No validator should be changed simply to make imports uniform. If existing architecture deliberately uses local validator predicates, prove each predicate is a semantics-preserving refinement of the same canonical admissibility relation. Until then, no economic universalization, no change to economic constants, and no GREEN claim.
