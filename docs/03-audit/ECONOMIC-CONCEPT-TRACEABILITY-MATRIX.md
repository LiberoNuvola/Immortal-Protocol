# Economic Concept Traceability Matrix

**Status:** audit / non-normative  
**Version:** current `work/immortal-green-closure`  
**Purpose:** trace critical economic concepts from authoritative definition to specialization, implementation, tests and evidence.

## Universal concepts

| Concept | Canonical source | Implementation | Verification | Status |
|---|---|---|---|---|
| `ProtectedCapital` | `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` | `IMMORTAL/kernel/EconomicKernel.hs` | `plutus/test/GoldenVectorsTest.hs` + kernel conformance corpus | **TRACEABLE** |
| `EEV` | `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` | profile/state inputs to `EconomicKernel` | Golden vectors / deployment evidence | **TRACEABLE; authoritative producer remains profile/adapter concern** |
| `RawSurplus = max(0, EEV-ProtectedCapital)` | `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` | `IMMORTAL/kernel/EconomicKernel.hs` | kernel tests / PRE-RICH Jackpot tests | **TRACEABLE** |
| `K*` | `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` + `03_ECONOMIC_KERNEL_FINAL.md` | certified `K_c`, not runtime computation of `K*` | CK1–CK8 / T4 / T6 / conformance corpus | **FORMALIZED** |
| `K_c` | `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md` | deployment/profile supplied concrete kernel | certification/evidence obligations | **FORMALIZED + DEPLOYMENT OBLIGATION** |
| `Ω` | `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` + Ω specification | adapter/profile authoritative event envelope | Ω completeness certification | **FORMALIZED + ADAPTER OBLIGATION** |
| Protected partition | `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` | V3 economic state fields | conservation / accounting certification | **TRACEABLE** |

## PRE-RICH application concepts

| Concept | Canonical source | Implementation | Tests | Status |
|---|---|---|---|---|
| `KA=8, KC=4, KD=4` | `PRE-RICH/docs/GAME-ECONOMY.md` + Constitution | `src/preRichHysteresis.ts` | `src/__tests__/preRichHysteresis.test.ts`, conformance binding | **CLOSED / TESTED** |
| Price ladder | `PRE-RICH/docs/GAME-ECONOMY.md` | application profile / UI | payout/unit tests + application tests | **CLOSED / TRACEABLE** |
| Genesis = 1 USDM | PRE-RICH Game Economy | application profile | application/conformance tests | **TRACEABLE** |
| PRE Treasury >= 4000 USDM | PRE-RICH Game Economy / Constitution | deployment profile/evidence | deployment admission evidence | **TRACEABLE; live evidence separate** |
| Maximum normal payout = 500×P | PRE-RICH Game Economy | `EconomicKernel.payoutSufficient` + transition | `GoldenVectorsTest.hs` | **CLOSED / TESTED** |
| `WorstCaseExposure(P,N)=500×P×N` | PRE-RICH Game Economy + Economic Algorithm | `EconomicKernel.worstCaseExposure` | Golden vectors / conformance | **TRACEABLE** |
| `HighestClassEverActivated` monotonicity | PRE-RICH Constitution / Game Economy | `EconomicTransitionV3.hs`, `preRichHysteresis.ts` | hysteresis + binding tests | **CLOSED / TESTED** |
| Jackpot policy | PRE-RICH Game Economy / Economic Algorithm | `PRE-RICH/src/PreRichJackpotPolicy.ts` | `preRichJackpotPolicy.test.ts` | **CLOSED where defined; payout mode explicitly OPEN** |
| Expiry finality | PRE-RICH Constitution / Economic Algorithm | `PRE-RICH/src/PreRichExpiryPolicy.ts`, expiry evidence | expiry policy/evidence tests | **SEMANTICS CLOSED; exact horizon OPEN** |
| Exact expiry horizon | PRE-RICH application profile | `preRichExpiryPolicyV1` currently provides 2h..300d bounds + state-derived formula | `preRichExpiryPolicy.test.ts` | **OPEN NORMATIVE DECISION / IMPLEMENTATION PRESENT** |

## Important boundary findings

### 1. No universal Jackpot primitive

The universal model deliberately uses **Conditional Allocation Reserve (CAR)**. Jackpot is PRE-RICH terminology. The current implementation respects that boundary.

### 2. No universal 500× rule

The 500× maximum payout is correctly application-specific PRE-RICH policy. The universal kernel receives an economic profile rather than hard-coding the ladder.

### 3. Hysteresis is correctly application-specific

`KA/KC/KD` are not part of the universal mathematical kernel. They are implemented by the PRE-RICH controller and bound by tests.

### 4. Expiry is the only current semantic/documentation tension found in this pass

The PRE-RICH documents state that the **exact ticket lifetime remains open**, while a concrete `preRichExpiryPolicyV1` already exists and is tested.

This is not evidence that the formula is wrong. It means the implementation currently represents a **profile candidate / provisional policy**, while normative closure of the exact horizon remains pending.

Therefore the implementation MUST NOT be treated as proof that the exact horizon is already constitutionally frozen.

## Authority rule

When implementation and documentation disagree, resolve the discrepancy against the authority hierarchy in `docs/DOCUMENTATION-AUTHORITY-MATRIX.md`. Do not silently promote implementation behaviour into normative policy.
