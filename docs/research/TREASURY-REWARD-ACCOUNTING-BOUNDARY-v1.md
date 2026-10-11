# IMMORTAL — Treasury / Protocol Revenue / Reward Accounting Boundary v1

**Classification:** research / non-normative
**Branch:** `work/b3-materios-provenance-evidence`
**Date:** 2026-10-11

## Purpose

Freeze a non-normative accounting boundary for protocol revenue and future contributor/governance rewards without importing PRE-RICH Treasury semantics into the IMMORTAL kernel.

## Semantic chain

The smallest safe chain is:

`FeeObligation`
→ `SettlementAmount`
→ `ProtocolRevenueReceived`
→ `AccountingClassification`
→ `CertifiedRewardBudget`
→ `RewardAllocation`

Each stage has a different meaning.

### FeeObligation

The amount economically owed by a fee-bearing protocol transition under an already-authorized Fee Function.

It is not a Cardano execution fee.

### SettlementAmount

The concrete amount and representation settled by the Adapter.

It is chain-specific.

### ProtocolRevenueReceived

An authenticated observation that the protocol-controlled destination actually received the intended settlement amount.

Receipt evidence is distinct from the fee calculation itself.

### AccountingClassification

A canonical classification of received value before it can be considered available for rewards.

The classification may distinguish, as authorized by the future accounting rule:

- protected value;
- reserved value;
- mandatory cost coverage;
- neutral custody;
- available protocol revenue.

The Treasury destination alone does not determine the classification.

### CertifiedRewardBudget

A bounded amount made available for an authorized reward function after accounting classification.

The invariant is:

`RewardBudget <= AvailableProtocolRevenue`

and:

`RewardAllocation <= RewardBudget`

No numeric ratio is introduced here.

## Non-regression boundaries

This model does not:

- import PRE-RICH Jackpot/Treasury percentages;
- restore historical `75/10/10/5`;
- define a new universal fee amount;
- make Treasury balance synonymous with ProtectedCapital;
- make Treasury balance synonymous with RawSurplus;
- give an Adapter authority to allocate protocol revenue;
- give a reward algorithm authority over Treasury accounting.

## Governance / algorithm / adapter split

The safe separation is:

`Constitution / canonical accounting rules`
→ `authorized governance of functions and bounds`
→ `deterministic algorithmic derivation`
→ `Adapter settlement`
→ `independent evidence`

The algorithm may derive a reward only after receiving a certified budget.

It cannot create that budget by observing its own reward output or by changing the accounting classification.

## Treasury as destination versus state

A future Treasury may be represented as:

- an abstract protocol-controlled destination at the semantic layer;
- a concrete custody/UTxO/account representation at the Adapter layer.

These are not interchangeable.

The research boundary therefore avoids introducing a universal Treasury state field until the canonical accounting model explicitly requires one.

## Contributor reward relationship

The safe composition is:

`ProtocolRevenueReceived`
→ `AccountingClassification`
→ `CertifiedRewardBudget`
→ `RewardAllocation`
→ `optional Contributor Credential reference`

The credential is an attestation layer; it does not authorize the preceding accounting transitions.

## Failure semantics

Missing or unverifiable receipt evidence must not create a spendable reward budget.

Invalid accounting classification must fail closed.

A zero certified reward budget yields zero reward allocation.

Protected or reserved value is not available merely because it is held by a protocol-controlled destination.

## Promotion gate

The Treasury/revenue boundary remains research until:

1. protocol revenue semantics are normatively adopted;
2. receipt evidence is defined;
3. accounting classifications are canonical;
4. reward-budget authorization is defined;
5. custody/adapter representation is separated from semantic accounting;
6. independent adversarial tests cover feedback-loop and budget-inflation attacks.

**Status: RESEARCH / BOUNDARY CONSOLIDATED — NO NORMATIVE ECONOMIC CHANGE.**
