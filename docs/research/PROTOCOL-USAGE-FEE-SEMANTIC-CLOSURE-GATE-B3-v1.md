# IMMORTAL — Protocol Usage Fee Semantic Closure Gate B3 v1

**Classification:** non-normative research / readiness gate  
**Branch:** work/b3-materios-provenance-evidence  
**Date:** 2026-10-20  
**Purpose:** identify which existing fee-workflow decisions must be closed before production interfaces are introduced. This document does not decide those open questions.

## Source basis

This gate is derived from the existing Notion fee workflow pages 02, 08, 09, 10, 12 and 13, plus the branch-local contract inventory and minimal interface map:

- [02 — EconomicFeeTarget → SettlementAmount](https://app.notion.com/p/3e0c4454d6d58186b0edca25c1330d41)
- [08 — Parameter Selection Boundary & Cardano Adapter Settlement Conformance](https://app.notion.com/p/3e0c4454d6d581209701ffaf4c830408)
- [09 — Existing State Machine + Cardano Settlement Conformance Overlay](https://app.notion.com/p/3e0c4454d6d5815cb608e8f3d7882803)
- [10 — Fee-Bearing Transition Matrix](https://app.notion.com/p/3e0c4454d6d581dbbff3fff71321aa95)
- [12 — Reference Unit, Target Function & Fee Affordability](https://app.notion.com/p/3e0c4454d6d5810789fcdf7aa7e8aba3)
- [13 — Fee Amount Discovery & First-Ticket Learning Constraint](https://app.notion.com/p/3e0c4454d6d581aabf29f21e688b4fb3)
- [Branch-local interface map](PROTOCOL-USAGE-FEE-MINIMAL-INTERFACE-MAP-B3-v1.md)

## Closure gates

| Gate | Established boundary | Decision/evidence still required | State |
|---|---|---|---|
| G1 — Applicability | `FeeBearing(S,A,Profile)` is a profile/deployment declaration. The Adapter cannot independently decide fee applicability. | Declare the fee-bearing action/usage classes for the chosen deployment. The candidate matrix does not make every listed action fee-bearing. | OPEN |
| G2 — Economic target | `EconomicFeeTarget(S,A,Profile) ∈ U`; IMMORTAL owns economic meaning. PRE is not the universal reference unit. | Specify the authorized target function/parameterization and the deployment's reference-unit instantiation. No amount or formula is selected here. | OPEN |
| G3 — Reference admissibility | Reference evidence must identify the asset and unit/direction and satisfy the chosen provenance/freshness/admissibility contract. A reference input is evidence, not economic authority. | Select and document the concrete reference design, deterministic selection, provenance checks and deployment parameters. | OPEN |
| G4 — Conversion | Settlement must be representable and must not silently change the economic target. Invalid conversion cannot be replaced with a guessed value. | Specify rounding/selection, conversion bounds, minimum-unit behavior and exact invalid-result semantics. | OPEN |
| G5 — Atomic transition | Fee is a condition of the existing canonical transition, not a parallel economic state machine. Invalid required settlement prevents commit. | Demonstrate integration with the existing transition and stale-state revalidation, without modifying V3/Reveal semantics as part of this research task. | OPEN |
| G6 — Receipt evidence | A settlement attempt does not prove that the intended destination received the intended amount. | Bind authenticated transaction/output evidence to obligation, asset, amount and destination. | OPEN |
| G7 — Accounting classification | Receipt does not itself determine accounting classification. Treasury balance alone does not imply ProtectedCapital, RawSurplus or distributable revenue. | Define the canonical classification rule and its evidence producer. | OPEN |
| G8 — Reward budget | Reward allocation is downstream of classified revenue and separately certified budget. | Specify authorization and limits for any reward budget before claiming end-to-end reward closure. | OPEN |
| G9 — Adapter surcharge | Baseline separation is one Protocol Usage Fee plus distinct native ChainExecutionCost. | If an extra adapter surcharge is desired, classify it separately first; it is not assumed by this document. | CONDITIONAL |

## Implementation readiness

Production fee types and call-site wiring are **not ready to be frozen** while G1–G4 remain open. G5 must be established before any fee-bearing transition can be claimed conformant. G6–G8 are additional gates for claims about received revenue, accounting and rewards. G9 is relevant only if an additional surcharge is explicitly pursued.

This ordering does not require invented numbers. An unconfigured deployment remains unconfigured until its authorized decisions and evidence exist. Missing inputs must remain explicitly open rather than being supplied implicitly by the Adapter, application code or test fixtures.

## Invariants retained

1. `ProtocolUsageFee != ChainExecutionCost`.
2. `TotalCost = ProtocolUsageFee + ChainExecutionCost`.
3. The Adapter realizes settlement and supplies chain evidence; it does not redefine the economic target.
4. Fee settlement cannot bypass `K_c`, ProtectedCapital, crystallized liabilities, viability or atomicity.
5. Observed execution cost is evidence, not economic authority, and cannot retroactively create safety.
6. Fee proceeds do not automatically become RawSurplus or a reward budget.
7. PRE-RICH payment semantics are not promoted into universal IMMORTAL semantics.
8. No second fee state machine is introduced.
9. V3 carrier and Reveal semantics remain untouched by this research gate.

## Explicit non-decisions

This document does not choose fee-bearing classes, fee formula or amount, reference unit, price source, freshness/deviation parameters, rounding rule, settlement asset, beneficiary, reward policy, or any additional surcharge. It does not claim tests, CI, deployment or live-chain conformance.

**Status: SEMANTIC READINESS GATE DOCUMENTED — ALL OPEN DECISIONS REMAIN OPEN.**
