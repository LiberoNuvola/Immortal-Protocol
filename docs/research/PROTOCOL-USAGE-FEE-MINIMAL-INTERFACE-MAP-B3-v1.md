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

## Branch-local typed-contract verification (2026-10-20)

The following implementation surfaces were fetched from this exact branch. This is a targeted contract check, not a proof over every repository file.

| Surface | Concrete contract found | Fee-interface implication |
|---|---|---|
| `IMMORTAL/kernel/EconomicTransitionV3.hs` | `V3Action = Issue | Reveal | Claim | Expire`; transition validates application-economic state changes | No Protocol Usage Fee obligation or settlement result is carried by the V3 action/transition interface inspected. No V3 change is proposed. |
| `IMMORTAL/kernel/UniversalEconomicKernel.hs` | `protectedCapital`, `rawSurplus`, non-negative state and solvency invariant | Provides universal protected-capital/surplus primitives, not a fee-target or fee-obligation producer. |
| `Adapter/CARDANO/serialization/CanonicalEconomicState.ts` | Canonical state fields for liabilities, reserve, exposure, safety capital, reserve protection, future costs and additional protected capital | No fee obligation, reference, settlement amount, revenue receipt or accounting classification field. |
| `Adapter/CARDANO/runtime/EconomicAdmission.ts` | `EconomicAdmissionWitness` binds action/state hashes, EEV, authenticated pool valuation, executable liquidity and required immediate liquidity | Existing authoritative admission/liquidity witness is not a typed Protocol Usage Fee contract; do not reinterpret its EEV or pool valuation as fee amount. |
| `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` | Infrastructure submission and economically gated submission; verifies admission-bound inputs are present in completed transaction | Provides a submission gate, not fee calculation, settlement construction, or fee-revenue receipt classification. |
| `Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts` | Issue-specific qualification/deployment approval, protected-capital provenance and viability evidence | Issue admission evidence does not instantiate the universal fee interface. |
| `src/config.ts` and `src/mint.ts` | `TICKET_PAYMENT_LOVELACE = 1_000_000`; PRE-RICH sale path pays the configured Treasury address | Concrete application settlement only; not an IMMORTAL-wide fee target or USDM valuation. |
| `plutus/Types.hs`, `plutus/Treasury.hs`, `plutus/Economic.hs` | Application datum/treasury and B1 economic primitives; USDM accounting-unit comments distinguish USDM from ADA | These contracts must not be promoted into universal fee semantics without an approved specification. |
| `audit/algorithmic-governability/fee-bearing-transition-separation-boundary.mjs` | Structural harness uses opaque target/amount values and validates explicit status predicates | Tests separation/fail-closed shape; it does not derive an economic target or settlement amount. |
| `audit/algorithmic-governability/reward-treasury-boundary.mjs` | Structural harness checks externally supplied receipt/accounting/budget facts | Does not produce canonical accounting classification or calculate a reward budget. |

**Verified result:** in these branch-local surfaces, no typed, production Protocol Usage Fee producer or end-to-end obligation-to-settlement-to-receipt contract was identified. Existing state, admission, application-payment and audit-harness types are useful adjacent boundaries, but none is a safe substitute for the missing universal contract. This conclusion is limited to the listed surfaces and the earlier targeted call-site inventory; it is not a claim that every file in the repository was exhaustively searched.

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
