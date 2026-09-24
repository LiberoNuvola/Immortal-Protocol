# IMMORTAL — B4 / RF5 ProtectedCapital Evidence Delta 2026-09-24

## Triangulated result

The current branch contains a complete local V3 → Universal protected-capital boundary:

`PRE-RICH V3 state → projectPreRichState → UniversalEconomicState → UniversalEconomicKernel.protectedCapital → EconomicGate`

The projection is explicitly fail-closed and validates:

- profile validity;
- V3 non-negativity;
- class uniqueness;
- known class IDs;
- per-class exposure = canonical price × unresolved count;
- unresolved reserve = class decomposition;
- unresolved count = class decomposition.

The projected universal state contains only the application-neutral quantities consumed by the universal kernel.

## Existing executable evidence

### `IMMORTAL/conformance/ProtectedCapitalConformance.hs`

Provides:

- lifecycle delta checks for Reveal / Claim / Expire;
- preservation of SafetyCapital;
- preservation of ReserveProtection;
- preservation of MandatoryFutureCosts;
- preservation of locked Jackpot protection;
- exact protected-capital partition;
- V3/Universal protected-capital boundary equivalence.

### `plutus/test/ProtectedCapitalConformanceTest.hs`

Already executes non-zero protected components, including:

- SafetyCapital = 11
- ReserveProtection = 13
- MandatoryFutureCosts = 17
- locked Jackpot = 19

and verifies V3/Universal boundary equivalence.

It also verifies the expected local lifecycle deltas and rejects a 501× payout preservation witness.

### `plutus/test/ProjectionBoundaryConformanceTest.hs`

Verifies:

- multi-class V3 → Universal equivalence;
- exact Universal ProtectedCapital arithmetic;
- exact RawSurplus;
- locked Jackpot projection into additional protected capital;
- aggregate mismatch fail-closed behavior;
- duplicate class rejection;
- unknown class rejection;
- inconsistent class exposure rejection;
- negative protected-capital components rejection.

### `PRE-RICH/profile/PreRichEconomicProjection.hs`

The normative implementation boundary exposes:

`projectionBoundaryEquivalent`

which directly compares:

- V3 ProtectedCapital vs Universal ProtectedCapital;
- V3 RawSurplus vs Universal RawSurplus;
- V3 solvency invariant vs Universal solvency invariant.

The function explicitly does **not** claim Economic Gate soundness, viability, atomicity, or full Cardano/V3 equivalence.

## PC matrix

| PC requirement | Evidence | Status |
|---|---|---|
| PC-01 Coverage | Universal kernel contains all protected components; projection carries all components; non-zero conformance fixtures exist | STRONG LOCAL |
| PC-02 No double counting | Exact partition + V3/Universal equality; unresolved reserve/count are represented but not included in ProtectedCapital | PARTIAL — no ledger/end-to-end proof |
| PC-03 No-hidden-exposure defect boundary | Per-class exposure and aggregate reserve/count are checked fail-closed before projection | STRONG LOCAL |
| PC-04 Provenance | Projection requires explicit observed/provided protected components, but no cryptographic provenance chain is established here | OPEN / PARTIAL |
| PC-05 Unit/perimeter consistency | Existing conformance exercises exact Integer/reference-unit boundary and Jackpot projection | PARTIAL — ledger unit evidence still separate |
| PC-06 Adapter preservation | Generic `CanonicalEconomicState` validates universal shape, but no executable universal-state → adapter-state preservation function currently exists | OPEN |
| PC-07 Derived/accounting separation | Profile projection derives class exposure; universal kernel consumes aggregate protected quantities | STRONG IMPLEMENTATION / PARTIAL PROOF |

## Important non-regression observation

The current architecture does **not** count `unresolvedReserve` itself as an additional ProtectedCapital component.

Instead:

- unresolved reserve is an aggregate obligation representation;
- worst-case exposure is derived from the unresolved class decomposition;
- ProtectedCapital uses worst-case exposure plus crystallized liabilities and separately protected components.

This is consistent with the current universal kernel formula and the projection boundary.

No legacy 75/10/10/5 model or new economic constant was introduced.

## Remaining B4/RF5 closure blockers

1. Adapter-level preservation from UniversalEconomicState to the concrete Cardano observation/serialization boundary.
2. Authentic provenance of SafetyCapital / ReserveProtection / MandatoryFutureCosts.
3. Ledger evidence showing the protected components survive an actual economic transition exactly as predicted.
4. Full action-by-action B4 correspondence for SALE / REVEAL / CLAIM / EXPIRE.

## Status

B4 / RF5 local projection and accounting boundary:
**SUBSTANTIAL IMPLEMENTATION + CONFORMANCE EVIDENCE**

B4 / RF5 complete cross-layer closure:
**OPEN**
