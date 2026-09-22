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
