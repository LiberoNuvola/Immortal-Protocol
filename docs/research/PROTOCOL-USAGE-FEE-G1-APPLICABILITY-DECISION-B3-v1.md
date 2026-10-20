# IMMORTAL — G1 Fee-Bearing Applicability Decision Record B3 v1

**Classification:** non-normative decision record / implementation-readiness gate  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-20  
**Status:** OPEN — no deployment fee-bearing classes selected  
**Scope:** G1 only. No production code, economic formula, deployment profile, or fee-bearing action set is created by this record.

## 1. Decision to be made

For a specific deployment/profile, declare which use or transition classes are fee-bearing. The declaration is a deployment/application contract constrained by IMMORTAL's universal fee semantics. It is not an Adapter-side economic decision and must not become a second economic state machine.

The existing workflow's candidate predicate remains:

`FeeBearing(S,A,Profile) ∈ {true,false}`

This record does **not** instantiate that predicate for any class. No class is fee-bearing merely because it appears in the candidate matrix.

## 2. Source-grounded candidate classes — not selected

The Notion page **10 — Fee-Bearing Transition Matrix & Final Protocol/Adapter Separation Check v0.1** lists these places where a deployment might attach a fee-bearing declaration:

| Candidate class | Source boundary | G1 status in this record |
|---|---|---|
| Generic state-changing economic action | Profile/deployment may declare applicability | UNSELECTED |
| Protocol instantiation / integration use | Deployment may declare usage policy | UNSELECTED |
| Cardano transaction execution | Native chain execution cost is distinct from Protocol Usage Fee | NOT A PROTOCOL-FEE DECLARATION; execution-cost boundary only |
| Oracle/reference observation | Reference admissibility and evidence path | UNSELECTED; evidence collection alone does not imply a fee |
| Application-specific ticket purchase | Application/deployment decides; application economics remain outside universal IMMORTAL semantics | UNSELECTED; PRE-RICH is not promoted to universal semantics |
| Application-specific reveal / claim | Application/deployment decides; crystallized obligations cannot be silently reduced | UNSELECTED; no change to Reveal/Claim semantics |
| Governance / upgrade action | Usage policy only if expressly permitted by the applicable contract | UNSELECTED |

This table records the source's candidate categories; it does not rank them, recommend them, or convert them into a policy.

## 3. Required fields for an eventual declaration

A deployment declaration is not ready for implementation until the authorized decision record identifies, at minimum:

- **Profile/deployment identity and version** to which the declaration applies.
- **Canonical action/usage-class identifiers**; prose labels alone are insufficient for deterministic enforcement.
- **Applicability mapping** for each in-scope class, with explicit `true` or `false`; missing/unknown entries must remain unconfigured and must not silently default to fee-bearing.
- **Authority/source of the declaration** and its version/evidence reference.
- **Effective-state/version binding** so a stale declaration cannot authorize a transition against a different profile.
- **Boundary tests** showing that declared fee-bearing classes create at most one Protocol Usage Fee obligation, and declared non-fee-bearing classes create none.
- **Explicit exclusion** of native `ChainExecutionCost` from the Protocol Usage Fee declaration.

These are interface/readiness requirements for recording the decision, not a new economic rule or an assertion that such a producer already exists.

## 4. Non-negotiable separation constraints

Any future G1 declaration must preserve the existing workflow boundaries:

1. `ProtocolUsageFee != ChainExecutionCost`; `TotalCost = ProtocolUsageFee + ChainExecutionCost`.
2. The Adapter settles and supplies chain-specific evidence; it does not independently decide fee applicability.
3. Fee applicability cannot bypass `K_c`, ProtectedCapital, liabilities, viability, or atomicity.
4. A fee cannot be implemented by reducing an already-crystallized obligation.
5. Fee-bearing status does not define the fee amount, reference unit, settlement asset, beneficiary, accounting classification, or reward budget. Those remain separate open gates.
6. No change to V3 or Reveal semantics is part of G1 closure.

## 5. Fail-closed implementation posture

Until a deployment-specific declaration is authorized and bound to a profile version:

- G1 remains **OPEN**.
- No production fee-bearing class is inferred from the candidate matrix.
- No fee is inferred from the existence of a payment path, treasury output, reference observation, or chain transaction.
- No fee type or call site should be frozen as production-ready on the strength of this record.
- Absence of a declaration is **UNCONFIGURED**, not an implicit `true` or a fabricated `false` policy. Any implementation gate must reject a claim of fee conformance while the declaration is unconfigured.

## 6. Closure checklist

- [ ] Deployment/profile explicitly identified.
- [ ] Authorized selection of fee-bearing classes recorded.
- [ ] All relevant classes mapped explicitly; unknown values rejected.
- [ ] Action/class identifiers tied to the canonical transition contract.
- [ ] Declaration version/evidence bound to the state/profile used by the transition.
- [ ] Negative and positive conformance tests specified for the selected classes.
- [ ] Adapter execution cost remains a separate cost category.
- [ ] No V3/Reveal semantic changes introduced.

## 7. Decision

**G1: OPEN — NOT CLOSED.**

The source material establishes where applicability may be declared and who owns that decision. It does not select the deployment's fee-bearing classes. This record deliberately preserves that unresolved decision for the project authority instead of inventing a policy.

**Verification limits:** documentation-only analysis. No code, tests, CI run, deployment, or on-chain behavior was changed or verified.