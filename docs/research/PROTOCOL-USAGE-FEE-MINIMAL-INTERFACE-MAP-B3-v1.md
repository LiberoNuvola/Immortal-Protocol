# IMMORTAL — Protocol Usage Fee Minimal Interface Map B3 v1

**Classification:** non-normative research / interface mapping  
**Branch:** work/b3-materios-provenance-evidence  
**Scope:** map existing responsibilities and evidence gaps. No fee formula, deployment parameter, authority path, or economic policy is selected.

## Finding

The repository and Notion describe a coherent conceptual chain:

`FeeObligation → SettlementAmount → ProtocolRevenueReceived → AccountingClassification → CertifiedRewardBudget → RewardAllocation`

The fee workflow separately describes:

`EconomicFeeTarget(S,A,Profile) ∈ U → admissible PriceReference → bounded SettlementAmount`

and preserves:

`ProtocolUsageFee != ChainExecutionCost`
`TotalCost = ProtocolUsageFee + ChainExecutionCost`

This is an architectural contract, not proof that a production fee producer and end-to-end settlement path are implemented.

## Evidence triangulation

- [Economic Usage Fee & Adapter Settlement Workflow v0.1](https://app.notion.com/p/3e0c4454d6d581f9b78fd05de6ea7763): OPEN; IMMORTAL owns fee semantics, the Adapter realizes settlement and reports native chain costs; PRE-RICH is out of scope for the universal design.
- [02 — EconomicFeeTarget → SettlementAmount Specification v0.1](https://app.notion.com/p/3e0c4454d6d58186b0edca25c1330d41): OPEN; exact rounding and invalid-conversion recovery remain undecided.
- [08 — Parameter Selection Boundary & Cardano Adapter Settlement Conformance v0.1](https://app.notion.com/p/3e0c4454d6d581209701ffaf4c830408): semantic boundary stable; deployment parameters and Cardano conformance open.
- [09 — Existing State Machine + Cardano Settlement Conformance Overlay v0.1](https://app.notion.com/p/3e0c4454d6d5815cb608e8f3d7882803): fee cannot commit when required evidence is unverifiable; a reference input is evidence, not economic authority.
- [10 — Fee-Bearing Transition Matrix v0.1](https://app.notion.com/p/3e0c4454d6d581dbbff3fff71321aa95): whether an action is fee-bearing remains a deployment/profile decision.
- [12 — Reference Unit, Target Function & Fee Affordability Formalization v0.1](https://app.notion.com/p/3e0c4454d6d5810789fcdf7aa7e8aba3): abstract reference unit is stable as a concept; exact unit, target parameter, action classes, valuation source and conversion bounds remain open.
- [13 — Fee Amount Discovery & First-Ticket Learning Constraint v0.1](https://app.notion.com/p/3e0c4454d6d581aabf29f21e688b4fb3): observations are evidence, not economic authority; numerical parameters and update rule remain open.
- Repository [Treasury / Protocol Revenue / Reward Accounting Boundary](TREASURY-REWARD-ACCOUNTING-BOUNDARY-v1.md) already separates receipt, accounting classification and reward-budget certification.
- Repository [Treasury/Fee coordination front](../COORDINATION/FRONT-IMMORTAL-TREASURY-FEE.md) records the universal fee representation gap and explicitly classifies the PRE-RICH sale payment as application settlement.

## Minimal interface responsibilities

| Boundary | Required contract | Owner | Status from inspected evidence |
|---|---|---|---|
| Fee-bearing declaration | Declare which profile/action classes incur a fee | Profile/deployment, constrained by IMMORTAL | OPEN |
| Fee obligation / target | One obligation derived under an authorized, versioned rule in abstract unit U | IMMORTAL | Producer/type not established in inspected code |
| Reference admissibility | Asset identity, provenance, time/freshness and admissible domain | IMMORTAL defines rules; profile/Adapter provide evidence | Fee-specific deployed contract not established |
| Bounded conversion | Representable amount under declared conversion and rounding bounds; explicit invalid result | IMMORTAL defines semantics; Adapter realizes asset units | Production producer not established |
| Chain execution cost | Separate native cost observation; cannot alter fee target | Adapter | Native mechanisms exist; fee-contract conformance not established |
| Atomic fee-bearing transition | Required fee settlement cannot be bypassed; safety gate remains authoritative | IMMORTAL semantics + Adapter realization | Universal fee integration not established |
| Revenue receipt | Independent evidence that the intended destination received the intended amount | Adapter observation, verified against contract | Universal obligation-to-receipt binding not established |
| Accounting classification | Canonical classification before funds are considered available | IMMORTAL accounting rules | Conceptual boundary exists; universal producer not established |
| Reward budget/allocation | Budget is separately certified and bounded by available revenue | Authorized accounting/reward path | Structural harness exists; production producer not established |

## Invariants retained from the existing design

1. One Protocol Usage Fee obligation per declared fee-bearing transition; no second protocol fee in the Adapter.
2. `ProtocolUsageFee` and `ChainExecutionCost` remain distinct.
3. Fee payment cannot bypass `K_c`, ProtectedCapital, crystallized liabilities, viability or atomicity.
4. Invalid or unverifiable reference/conversion cannot be silently replaced by zero, a guessed minimum, or an Adapter-selected target.
5. An accepted discrete settlement must satisfy declared conversion bounds; unrepresentability is explicit.
6. A cost cannot be counted simultaneously as protocol fee, chain cost and mandatory future OPEX without evidence that these are distinct components.
7. Obligation and settlement construction do not prove receipt.
8. A Treasury destination does not itself determine accounting classification.
9. Revenue receipt does not itself authorize a reward budget.

These are design constraints, not claims that implementation conformance has already been proven.

## Smallest safe closure sequence

1. Identify or explicitly record the absence of a branch-local universal fee producer.
2. Define the typed/versioned input and output contract at the IMMORTAL/Adapter boundary, without selecting numerical values.
3. Bind reference admissibility, conversion, rounding and explicit failure semantics.
4. Prove that required fee-bearing transitions cannot commit without a valid obligation and settlement.
5. Bind transaction/output evidence to receipt, then receipt to canonical accounting classification.
6. Only then certify any available reward budget and run focused tests; report local tests separately from live-ledger evidence.

## Explicit non-decisions

This map does not select a fee formula, amount, action class, price source, freshness/deviation bound, rounding mode, affordability threshold, Treasury destination, reward policy or new authority path. It does not add a universal Treasury state field, promote PRE-RICH payment semantics into IMMORTAL, or change V3/Reveal. No tests, CI runs or live-chain execution are claimed.

**Status:** interface responsibilities mapped; universal producer and end-to-end conformance remain OPEN. Documentation only.
