# IMMORTAL — Ω and Execution-Admissibility Review (B3)

**Branch:** `work/b3-materios-provenance-evidence`  
**Classification:** non-normative implementation/conformance review  
**Date:** 2026-10-20  
**Scope:** R3 of `ADVERSARIAL-REVIEW-TRACEABILITY-B3-v1.md`. No normative or implementation semantics changed.

## 1. Result

The repository does have an explicit economic admission interface and a concrete-kernel certification specification. The open problem is **not that the design has no place for Ω or no gate**. The open problem is binding the gate's inputs to a concrete authoritative evidence producer and discharging the profile-specific certificate and execution-refinement obligations.

Three distinct layers must not be conflated:

1. **Normative rule:** Ω is authoritative, callers cannot choose a convenient subset, and a concrete deployment must prove a sound over-approximation of its declared perimeter.
2. **Executable interface:** `EconomicGate` and `PreRichEconomicAdmission` combine booleans and candidate state into an admission decision.
3. **Evidence producer:** a concrete component must derive those booleans and values from canonical observations and reproducible proofs. The interface itself does not prove them.

## 2. Code-level trace

### `IMMORTAL/kernel/EconomicGate.hs`

`economicGate` rejects unless all of the following hold:
- authoritative truth verified;
- EEV fresh;
- obligations complete;
- available executable liquidity non-negative;
- required immediate liquidity non-negative and no greater than available liquidity;
- candidate state satisfies `solvencyInvariant` under the supplied EEV.

`viabilityGate` requires both the post-state safety boolean and the boolean asserting that all authoritative-Ω successors remain in certified `K_c`.

`executionAdmissible` composes the economic and viability gates. The module's own comments explicitly say the booleans are inputs to be bound by an external authoritative observation/refinement layer; atomic commit and history recording are downstream obligations.

### `PRE-RICH/onchain/PreRichEconomicAdmission.hs`

The PRE-RICH boundary:
1. rejects negative pre-EEV;
2. checks structural transition validity;
3. constructs the candidate V3 state;
4. fails closed if projection to `UniversalEconomicState` fails;
5. constructs `EconomicGateInput` from supplied values/booleans;
6. checks economic admissibility and the certified-Ω successor boolean;
7. returns an admission witness only if the composed predicate passes.

This is an explicit and useful composition boundary. However, the function signature accepts `truthVerified`, `eevFresh`, `obligationsComplete`, and `allOmegaSuccessorsInCertifiedKernel` as `Bool` inputs. The function cannot independently establish their provenance, correctness, or completeness.

### `docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md`

The normative certification layer specifies a certificate `Cert = ⟨id, version, M, χ, Wit, Bnd, Proofs⟩` and verification conditions:
- VC1: decidable characteristic predicate;
- VC2: safety inclusion;
- VC3: inductiveness across all `Ω` successors;
- VC4: acceptance compatibility;
- VC5: sound envelope / over-approximation of the declared perimeter;
- VC6: a concrete non-vacuity witness and declared initial state.

It explicitly says a concrete profile instantiation and a decision procedure for membership in `K_c` are missing artifacts for full discharge. The existence of the certificate schema does not discharge those artifacts for PRE-RICH or Materios.

### `docs/audits/PRE-RICH-ISSUE-ADMISSION-PROVENANCE.md`

The current Issue producer is explicitly classified **PRODUCER OPEN**. The document says the admission algorithm and observation surfaces exist, but no concrete authoritative producer currently supplies the complete evidence. It explicitly forbids locally manufacturing the verification booleans or treating unit fixtures as live decision sources.

The producer must bind canonical pre-state, candidate transition, EEV derivation/freshness, obligation completeness, executable liquidity to the exact consumed PrizePool UTxO, ProtectedCapital components, gate result, certified-Ω/viability result, state/action fingerprints, and replayable decision evidence.

## 3. R3 closure table

| Requirement | What exists | Current status |
|---|---|---|
| Separate structural transition validity from economic admissibility | V3 transition predicate plus `PreRichEconomicAdmission` | **Interface present** |
| Solvency and immediate-liquidity checks | `EconomicGate` | **Predicate implemented; live evidence binding not established by this module** |
| Ω authority and no caller-selected subset | Decision Register D4; normative model/certification contract | **Normative rule present** |
| Ω sound over-approximation of declared perimeter | VC5 and Ω completeness/perimeter contract references | **Deployment/profile proof remains required** |
| Certified `K_c` with soundness and inductiveness | Certificate schema and VC1–VC6 | **Schema specified; concrete PRE-RICH certificate not shown by these files** |
| Non-vacuous initial witness | VC6 | **Deployment obligation; not a universal theorem** |
| Truth/freshness/completeness booleans grounded in actual observations | Producer contract documented, but no concrete authoritative Issue producer | **OPEN — blocking** |
| Atomic commit and canonical history binding | Declared as downstream obligations | **Not proved by `executionAdmissible` alone** |
| Reproducible real Preprod Issue admission | Explicitly still open in provenance audit | **OPEN** |

## 4. Practical conclusion

The gate code should not be mistaken for a self-authenticating trustless decision. It is a predicate over inputs. The assurance claim becomes valid only when the profile's producer and certificate prove those inputs authoritative, fresh, complete, bound to the candidate transition and exact ledger observation, and sound with respect to the declared Ω perimeter.

This matches the generalized IMMORTAL architecture: the universal kernel owns the decision predicates; the application/profile and adapter provide qualified instantiation and evidence; neither may silently redefine the predicates.

## 5. Next closure step

The next step is not to add new economic rules to `EconomicGate`. It is to audit the existing observation-to-producer path against the required evidence tuple, mark each field as **ledger-derived**, **cryptographically verified**, **profile-derived**, or **not yet produced**, and ensure missing/ambiguous fields return failure rather than trusted booleans.

## Sources

- [EconomicGate.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/IMMORTAL/kernel/EconomicGate.hs)
- [PreRichEconomicAdmission.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/PRE-RICH/onchain/PreRichEconomicAdmission.hs)
- [Concrete Kernel Certification Specification R1](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md)
- [PRE-RICH Issue Admission Provenance](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/audits/PRE-RICH-ISSUE-ADMISSION-PROVENANCE.md)
- [IMMORTAL Decision Register](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/01-formal-records/09_DECISION_REGISTER_FINAL.md)
