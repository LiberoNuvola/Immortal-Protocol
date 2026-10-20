# IMMORTAL — Protocol Usage Fee Call-Site & Producer Inventory B3 v1

**Classification:** research / implementation inventory; non-normative  
**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Branch inspected:** `work/b3-materios-provenance-evidence`  
**Scope:** targeted inventory of known fee, payment, treasury, adapter-settlement, and generalized-derivation surfaces. This is not a claim of exhaustive whole-repository static analysis.

## Executive finding

Within the inspected artifacts, the repository contains (1) a concrete PRE-RICH ticket-sale payment path, (2) Cardano economic-admission and transaction-input binding, and (3) structural fee/revenue/reward boundary harnesses. These are different responsibilities.

**No universal IMMORTAL Protocol Usage Fee producer was located in this targeted inventory.** In particular, the inspected fee-boundary harness receives an opaque target and settlement amount and checks structural separation/fail-closed conditions; it does not derive the amount from certified economic inputs. This finding is scoped to the files listed below and does not prove that no relevant implementation exists elsewhere in the repository.

The universal fee's normative rule/target, reference-unit and conversion contract, and proof of settlement conformance therefore remain open on the inspected evidence.

## Inventory

### A. PRE-RICH application payment — concrete, but not the universal fee

**Files**
- `src/mint.ts`
- `src/config.ts`

**Observed**
- `src/mint.ts` documents one transaction combining serial NFT minting, a pending Prize UTxO, Treasury payment, and B1PrizePool state update.
- The file explicitly says the current B1 launch settlement is 1 ADA / 1,000,000 lovelace and is **not** the USDM economic valuation; the canonical economic price remains `pdPriceUsdm`.
- The path requires a configured Oracle State singleton reference and describes the MintPolicy as valuing the exact Treasury payment through the canonical Economic oracle path.
- `src/config.ts` defines `TICKET_PAYMENT_LOVELACE = 1_000_000`, a deployment/application settlement constant.

**Classification**
- This is evidence of a PRE-RICH ticket sale/payment path and an application-level atomic transaction invariant.
- It is not, by itself, evidence of a chain-neutral IMMORTAL `ProtocolUsageFee` producer.
- The lovelace payment constant must not be treated as a USDM valuation or universal fee formula.

### B. Cardano admission and transaction binding — validation/settlement boundary, not fee derivation

**Files**
- `Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts`
- `Adapter/CARDANO/runtime/EconomicAdmission.ts`
- `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`
- `src/preRichIssueAdmissionBridge.ts`

**Observed**
- The admission modules validate evidence/witness fields and bind economic admission to referenced inputs and liquidity observations.
- The execution adapter checks that declared admission inputs are present in the actual transaction body and rejects duplicate/missing references.
- The inspected admission surfaces concern authoritative Issue/economic evidence and Cardano transaction correspondence. They do not establish a universal fee-target calculation in the code reviewed.

**Classification**
- These surfaces may supply important admission and settlement conformance evidence.
- Do not classify them as the missing universal fee producer without a concrete call-site that derives and passes a certified fee result.

### C. Structural fee-transition harness — boundary checks, not production calculation

**File**
- `audit/algorithmic-governability/fee-bearing-transition-separation-boundary.mjs`

**Observed**
- The fixture supplies opaque values such as `economicFeeTarget: 'target-opaque'` and `settlementAmount: 'amount-opaque'`.
- It checks separation between Protocol Usage Fee and ChainExecutionCost, required own-data fields, canonical transition identity, reference/conversion status, and fail-closed behavior.
- The harness can accept a supplied candidate as committed when its structural predicates pass; it does not compute the target or settlement amount from authenticated economic state.

**Classification**
- Structural/conformance harness.
- Not a production fee function, oracle, asset conversion implementation, or proof of live Cardano fee settlement.

### D. Treasury and reward surfaces — legacy application policy and structural accounting boundary

**Files**
- `src/treasuryPolicy.ts`
- `plutus/Treasury.hs`
- `audit/algorithmic-governability/reward-treasury-boundary.mjs`
- `docs/COORDINATION/FRONT-IMMORTAL-TREASURY-FEE.md`
- `docs/COORDINATION/FRONT-FEE-GOVERNANCE-BUILD-INCENTIVES.md`
- `docs/COORDINATION/FEE-INCENTIVE-ADVERSARIAL-LAB-v0.1.md`

**Observed**
- `src/treasuryPolicy.ts` explicitly marks its percentage policy as deprecated legacy/migration compatibility and says it is not an authoritative V3 economic rule and must not be imported by production economic flows.
- `plutus/Treasury.hs` implements a datum-driven lovelace distribution validator with threshold, percentage-sum and payout checks. This is a concrete Treasury validator, not proof of the universal IMMORTAL protocol-fee semantics.
- The reward/Treasury harness states that it introduces no reward amount, percentage, or allocation formula; the available-revenue relationship is supplied as an externally certified fact.
- The coordination/research documents separate fee semantics from reward policy and leave candidate fee/reward functions non-normative.

**Classification**
- Do not promote legacy PRE-RICH Treasury percentages to IMMORTAL rules.
- A Treasury receipt or protocol-controlled destination does not by itself classify the amount as ProtectedCapital, RawSurplus, available revenue, or reward budget.

### E. Generalized derivation contract — reusable architecture, not an instantiated fee producer

**File**
- `docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md`

**Observed**
- The document defines a non-normative boundary for derived results: authorized domain, declared rule, certified inputs, limits, evidence, version, contestability, and exit/fail-closed behavior.
- It names `EconomicFeeTarget(S,A)` as one possible function family and separates universal derivation from adapter encoding and chain settlement.
- It states that reuse of derivation machinery does not imply reuse of authority or semantics.

**Classification**
- Architecture/contract only. It does not instantiate a frozen production fee rule, target parameters, reference-unit conversion, or Cardano settlement proof.

## Evidence matrix

| Responsibility | Evidence found in inspected artifacts | Status from this inventory |
|---|---|---|
| PRE-RICH ticket payment | `src/mint.ts`, `src/config.ts` | Concrete application/deployment path |
| Authoritative Issue admission | Cardano admission and bridge modules | Validation/binding surface; not fee derivation |
| Universal Protocol Usage Fee producer | No concrete producer located in this targeted file set | **Not established** |
| Fee vs ChainExecutionCost distinction | Fee-bearing transition harness and coordination docs | Structural principle represented |
| Target/amount derived from certified state | Harness uses opaque supplied values | **Not established** |
| Reference-unit and asset conversion contract | Discussed in fee governance/Notion work; not instantiated by the inspected harness | **Not established** |
| Treasury distribution | Legacy TS policy and datum-driven Plutus validator | Concrete but application/legacy-scoped; not universal fee semantics |
| Reward budget from verified available revenue | Structural reward/Treasury harness with externally supplied certification fields | Boundary check only; production producer not established |
| Live Cardano fee settlement evidence | Not established by these source artifacts alone | **Not established by this inventory** |

## Notion triangulation retained as design context

The existing coordination map records the intended chain:

`Protocol Usage Fee → valuation/settlement contract → Treasury/accounting boundary → optional authorized reward budget`

It also preserves the distinction `ProtocolUsageFee != ChainExecutionCost` and prohibits silently promoting `src/treasuryPolicy.ts` percentages to IMMORTAL. The following Notion design records were identified in the prior fee traceability work:

- Economic Usage Fee & Adapter Settlement Workflow v0.1: https://app.notion.com/p/3e0c4454d6d581f9b78fd05de6ea7763
- Fee Ownership Matrix: https://app.notion.com/p/3e0c4454d6d581d89274e3009a371806
- Parameter Selection Boundary & Cardano Adapter Settlement Conformance: https://app.notion.com/p/3e0c4454d6d581209701ffaf4c830408
- Existing State Machine + Cardano Settlement Conformance Overlay: https://app.notion.com/p/3e0c4454d6d5815cb608e8f3d7882803
- Reference Unit, Target Function & Fee Affordability Formalization: https://app.notion.com/p/3e0c4454d6d5810789fcdf7aa7e8aba3

These records are design context; they do not substitute for implementation or execution evidence.

## Closure sequence — no policy invention

1. Continue call-site tracing from the inspected payment and admission surfaces to identify any existing producer/consumer contract for a universal fee.
2. If a producer exists elsewhere, verify its branch-local implementation, exact call-site, certified inputs, versioned rule and output type before connecting it.
3. If no producer is found after a broader bounded inventory, register the producer as an implementation gap rather than inventing a formula.
4. Keep denomination/reference, conversion, affordability, atomicity and adapter conformance as separate proof obligations.
5. Only after a concrete implementation path is identified, run the focused tests and record exact commands/results. No tests or CI runs are claimed by this inventory.

## Change and claim boundary

- Documentation-only inventory; no code, economic rule, parameter, threshold, fee amount, reward policy, or authority path changed.
- No new branch created.
- No V3 or Reveal semantics touched.
- No test, CI, or live-chain execution performed for this report.
- “Not established” means the inspected artifacts do not prove the claim; it is not a universal assertion that the capability cannot exist elsewhere.
