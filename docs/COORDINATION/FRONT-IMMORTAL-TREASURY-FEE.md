# IMMORTAL — Treasury & Protocol Revenue Boundary Front

**Date:** 2026-09-22  
**Branch:** `work/immortal-green-closure`  
**Status:** OPEN / TRIANGULATED — no normative decision yet

## Why this front exists

A protocol-level usage fee is already being designed for IMMORTAL. If IMMORTAL ultimately receives protocol revenue, the system needs an explicit protocol-controlled destination and an accounting boundary for that inflow. The existence of a destination does **not** by itself make the balance ProtectedCapital, RawSurplus, or distributable value.

## Triangulation

### 1. Current shared coordination register

The architecture boundary says IMMORTAL owns universal economic semantics while the Adapter performs chain-specific settlement. PRE-RICH owns application policy. The coordination register also explicitly prohibits importing PRE-RICH economic policy into IMMORTAL.

Implication: any IMMORTAL treasury/revenue concept must be protocol-level and asset/application agnostic at the semantic layer. It must not reuse PRE-RICH Treasury/Jackpot semantics.

### 2. Notion — Economic Usage Fee & Adapter Settlement Workflow v0.1

The existing fee workflow is explicitly scoped to **IMMORTAL Protocol + Cardano Adapter**, with PRE-RICH outside scope. It establishes:

- one Protocol Usage Fee category per transition;
- IMMORTAL defines fee semantics;
- Adapter performs settlement;
- `ProtocolUsageFee != ChainExecutionCost`;
- `TotalCost = ProtocolUsageFee + ChainExecutionCost`;
- no fee payment may bypass `K_c`, ProtectedCapital, liabilities, viability, or atomicity.

This confirms that the fee is already an intended IMMORTAL-level economic concept, not merely an Adapter fee.

### 3. Notion — Fee Ownership Matrix

The existing ownership matrix assigns the existence/meaning of the Protocol Usage Fee to IMMORTAL and chain representation/settlement to the Adapter. It explicitly says the Adapter cannot introduce a second protocol fee and cannot acquire economic authority.

Therefore a treasury destination cannot be defined as an Adapter policy that changes the meaning of the fee.

### 4. Notion — Reference Unit / Fee Affordability Formalization

The current design distinguishes:

- user-paid Protocol Usage Fee;
- protocol-borne execution/future mandatory costs.

It states that a user-paid protocol fee does **not** become mandatory OPEX merely because it exists, and that a fee destination is **not RawSurplus by definition**. A protocol-controlled destination/staking reward mechanism is already contemplated.

This is the critical accounting boundary for the Treasury front.

### 5. Notion — EconomicFeeTarget / PRE settlement decision record

The existing design discusses a protocol-controlled Treasury intake for the concrete PRE settlement candidate, while explicitly keeping PRE as a deployment settlement asset rather than a universal IMMORTAL denomination.

Therefore a concrete deployment may have a treasury intake without making PRE or PRE-RICH Treasury a universal IMMORTAL primitive.

## Current conclusion

The triangulated evidence supports opening a dedicated **IMMORTAL Treasury & Protocol Revenue Boundary** front.

It does **not** yet justify declaring a normative universal `Treasury` state field or a specific custody mechanism.

The safe conceptual model is:

`User / Integrator`
→ `Protocol Usage Fee`
→ `protocol-controlled destination`
→ `Treasury / settlement custody`

with separate treatment for:

`ChainExecutionCost`

and with no automatic transformation:

`FeeInflow → ProtectedCapital`

or

`FeeInflow → RawSurplus`

or

`FeeInflow → unrestricted distribution`.

## Questions to close

1. What exactly constitutes **IMMORTAL-owned protocol revenue** versus a fee merely transported/settled by an Adapter?
2. Is a Treasury a universal semantic concept, an abstract protocol-controlled destination, or only a deployment representation?
3. Which balances are protected obligations, operating reserves, distributable surplus, or neutral custody balances?
4. Under what conditions may Treasury value enter the economic state?
5. Under what conditions may value leave the Treasury?
6. Can governance authorize spending without bypassing Economic Gate / ProtectedCapital?
7. How are custody, accounting identity, asset denomination and chain representation separated?
8. How are protocol fees and chain execution costs prevented from being double-counted?
9. What evidence proves that a received fee was actually credited to the protocol-controlled destination?
10. How does the model generalize beyond Cardano and beyond PRE?

## Non-regression rules

- Do not import PRE-RICH Jackpot/Treasury semantics into IMMORTAL.
- Do not treat treasury balance as RawSurplus merely because it is protocol-controlled.
- Do not treat treasury balance as ProtectedCapital unless the canonical accounting says it is protecting a defined obligation.
- Do not let the Adapter choose economic allocation.
- Do not introduce numerical fee values here.
- Do not create a new authority path through Treasury governance.
- Preserve the existing distinction between Protocol Usage Fee and ChainExecutionCost.

## Recommended next action

Map the existing repository representations of:

`ProtocolUsageFee`, fee destination, treasury, protocol-controlled balance, reserve, ProtectedCapital, RawSurplus, staking/reward destination, and settlement outputs.

Then produce the smallest typed boundary:

`ProtocolRevenue`
→ `ProtocolControlledDestination`
→ `AccountingClassification`

without yet deciding numerical fee amounts or distribution policy.

**Coordination handoff:** other session should inspect this front before introducing overlapping treasury/fee semantics.


## 2026-09-22 — Current-branch representation map

A direct fetch against work/immortal-green-closure was used for the concrete repository artifacts; historical/default-branch search hits were not treated as current truth.

### Observed representations

| Artifact | Current role | Boundary classification |
|---|---|---|
| src/treasuryPolicy.ts | fixed Lovelace threshold + percentage split + relayer minimum | PRE-RICH / deployment policy legacy; must not be promoted to universal IMMORTAL fee or revenue semantics |
| plutus/Treasury.hs | on-chain distribution validator enforcing datum threshold, percentage sum and protocol-script destinations | Cardano application/deployment realization; not evidence of a universal IMMORTAL Treasury primitive |
| plutus/Types.hs::TreasuryDatum | threshold, four destination script hashes and percentage fields | application/adapter representation |
| src/config.ts::TREASURY_ADDRESS / SALE_ADDRESS | concrete Cardano destination configuration | adapter/deployment representation |
| src/mint.ts Treasury payment | atomic PRE-RICH sale settlement output in the same Cardano transaction | PRE-RICH application settlement, not yet a universal ProtocolUsageFee realization |
| EconomicKernel.hs | universal ProtectedCapital / RawSurplus arithmetic | IMMORTAL universal accounting authority; no Treasury balance should be inserted here without canonical classification |
| explicit ProtocolUsageFee type/field | not found in the directly inspected current-branch artifacts | OPEN representation gap |

### Important result

The current branch therefore contains a real Cardano/PRE-RICH Treasury mechanism, but the requested universal boundary is still absent as a typed IMMORTAL concept. This is consistent with the front's OPEN status.

The existing percentage policy (prizePct, stakePct, reservePct, relayer/minimum values) must remain isolated from any future universal protocol-revenue semantics. No numerical value was promoted, renamed or reused.

### Smallest safe next boundary

Before introducing a universal Treasury state field, the next artifact should be an evidence/specification mapping that distinguishes:

1. ProtocolRevenue — economic category owned by IMMORTAL;
2. ProtocolControlledDestination — abstract destination identity, independent of Cardano address form;
3. AccountingClassification — obligation/protected reserve/operating cost/neutral custody/residual surplus, with classification supplied by canonical economics rather than inferred from destination;
4. AdapterSettlement — Cardano-specific output/UTxO realization;
5. Evidence — proof that the intended revenue was actually credited.

No implementation change is justified yet from this mapping alone.

Status: REPRESENTATION MAP COMPLETE / NORMATIVE BOUNDARY STILL OPEN.

## 2026-09-24 — Current-branch Treasury conformance re-triangulation

Fresh inspection of the current closure branch at ref `046eb7ffd307dd84605087ddd5ae7f738af23453` confirms that `plutus/Treasury.hs` is still a four-destination percentage validator. It requires the datum percentages to sum to 10000 basis points and checks prize, stake, reserve and maintenance outputs.

The current PRE-RICH normative specification, however, explicitly classifies the former `75 / 10 / 10 / 5` allocation as **HISTORICAL / NON-CANONICAL** and states that player payments enter protocol-controlled Treasury without a fixed current allocation rule. The same specification defines Treasury→PrizePool funding as protocol-controlled and subject to the economic invariants.

Therefore the correct classification is **not** “Treasury semantics are closed by the existing validator”. The concrete validator is a **legacy/application Cardano realization whose conformance to the current PRE-RICH policy is OPEN** unless a current caller/transition proves that its percentage fields are no longer the canonical distribution authority.

This finding does **not** justify changing the validator yet. First prove its live usage surface:

1. all current callers/builders of `TreasuryAction = Distribute`;
2. whether `src/treasuryPolicy.ts` is still used by an economically material flow;
3. whether Treasury→PrizePool funding is now the canonical path;
4. whether any deployed artifact derives its authority from the four percentage fields.

If the four-way split is live in an economically material path, it is a concrete conformance blocker. If it is unreachable/legacy, quarantine it explicitly rather than refactoring economic semantics.

### Non-regression

- Do **not** restore or reinterpret `75/10/10/5`.
- Do **not** introduce a replacement allocation percentage.
- Do **not** promote the validator's four percentage fields into IMMORTAL economics.
- Do **not** change ProtectedCapital/RawSurplus semantics to accommodate the legacy validator.

**Status:** TREASURY FRONT OPEN / LEGACY VALIDATOR CONFORMANCE UNRESOLVED / USAGE-SURFACE AUDIT REQUIRED.


## 2026-09-24 — Usage-surface pass on current economic flows

Direct current-branch inspection of the principal economic flow files shows an important narrowing result:

- `src/mint.ts` uses the Treasury as a concrete PRE-RICH sale settlement output and reads the Treasury datum, but the inspected sale path does **not** import or call `src/treasuryPolicy.ts` and does not invoke `TreasuryAction = Distribute`.
- `src/gameFlow.ts`, `src/registryFlow.ts`, `src/createRound.ts` and `src/claimFlow.ts` showed no direct `TreasuryAction/Distribute` or `calculateTreasuryDistribution` references in the inspected current-branch content.
- `src/treasuryPolicy.ts` nevertheless still contains a concrete distribution policy (relayer/prize/stake/reserve) and therefore remains a potential legacy side surface until repository-wide current-ref usage is exhaustively established.
- `plutus/Treasury.hs` remains a four-destination percentage validator, but the currently inspected PRE-RICH sale path only pays the Treasury contract; it does not establish that the four-way distribution validator is the authority for current sale economics.

This is **not** a closure claim. It changes the immediate classification from “known live four-way allocation path” to **“legacy distribution surface; live economic usage not yet proven.”**

### Next smallest verification

Search the exact closure ref for all imports/call sites of:

- `TreasuryAction` / `Distribute`;
- `treasuryPolicy` / `calculateTreasuryDistribution`;
- the compiled `treasury.plutus.json` artifact and any builder that spends its UTxO.

If no current economic caller exists, quarantine the validator/policy as legacy instead of modifying economics. If a caller exists, bind that caller to the current PRE-RICH Treasury/PrizePool semantics before any conformance promotion.

**Status:** TREASURY FRONT NARROWED / FOUR-WAY DISTRIBUTION LIVE USAGE UNPROVEN / NO NORMATIVE CHANGE.

## 2026-09-25 — Fee front re-triangulation against current Cardano fee model

Fresh external verification against current Cardano documentation confirms that native Cardano transaction fees are a chain-level mechanism computed from protocol parameters, including the per-byte and fixed components. Cardano documentation also distinguishes transaction fees from the protocol's treasury/reward mechanism. Therefore native Cardano fees cannot be treated as IMMORTAL Protocol Usage Revenue merely because an IMMORTAL transaction incurs them.

Current external evidence:
- Cardano minimum transaction fee is parameterized from transaction size and protocol parameters (minFeeA / minFeeB).
- Transaction fees are collected at the chain level and participate in Cardano's epoch reward/treasury accounting.
- The Adapter therefore has a chain-specific execution-cost observation surface, while IMMORTAL must separately define any Protocol Usage Fee.

This reinforces the existing invariant:

ProtocolUsageFee != ChainExecutionCost

and:

TotalCost = ProtocolUsageFee + ChainExecutionCost.

### New accounting boundary clarified

The Treasury/Capture problem must be split into four distinct states:

FeeObligation
→ SettlementAmount
→ ProtocolRevenueReceived
→ AccountingClassification

Only the first two belong to the fee-bearing transition contract itself. Receipt of value at a protocol-controlled destination is a separate observation/accounting event. Destination control alone does not determine whether the received value is ProtectedCapital, reserved value, available revenue, or RawSurplus.

### Current implementation finding

Direct current-branch inspection still finds no canonical universal ProtocolUsageFee type/field in the inspected IMMORTAL kernel/adapter artifacts. The concrete PRE-RICH Treasury mechanisms remain application/deployment representations. This is an OPEN representation gap, not a reason to add a fee field to universal economic state immediately.

### Next autonomous work

1. Build a repository-wide current-ref usage map for all Treasury/distribution surfaces and distinguish live economic callers from legacy code.
2. Derive the minimal abstract fee/revenue interface from the existing Notion fee workflow without choosing numeric values.
3. Determine whether protocol revenue is a neutral custody balance, an accounting category, or an economic state input, using the canonical economics rather than destination identity.
4. Trace the existing PRE settlement candidate only as a deployment case; do not promote PRE or PRE-RICH Treasury rules into IMMORTAL.
5. Keep any reward-budget model downstream of revenue classification and independently authorized.

**Status:** FEE SEMANTICS OPEN / FEE CAPTURE & ACCOUNTING OPEN / CARDANO NATIVE FEE DISTINCTION VERIFIED EXTERNALLY / NO NORMATIVE CHANGE.