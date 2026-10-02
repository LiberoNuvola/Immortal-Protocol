# PRE-RICH PRE Staking — Deterministic Calculator

**Status:** IMPLEMENTED / APPLICATION-LEVEL  
**Scope:** PRE-RICH only.  
**IMMORTAL impact:** none.

## Purpose

The first implementation boundary is deliberately chain-neutral. It calculates snapshot-based PRE reward entitlements without custody, locking or a staking contract.

## Canonical calculation

For the current evaluation baseline:

`W_i = B_i(snapshot)`

and:

`reward_i = floor(R × W_i / ΣW)`

All arithmetic uses JavaScript `bigint` so token quantities are not rounded through floating-point numbers.

## Guarantees

- snapshot identity is explicit;
- PRE asset identity is explicit;
- Treasury staking-accounting epoch must equal snapshot epoch;
- duplicate beneficiaries are rejected;
- negative balances/Treasury staking-accounting balances are rejected;
- zero-balance beneficiaries receive no entitlement;
- no eligible weight + non-zero pool fails closed;
- total distributed reward never exceeds the Treasury staking-accounting balance;
- integer remainder is reported as `undistributedDust`;
- completed epochs can be rejected before a second distribution.

## Deliberate non-goals

This calculator does not decide:

- snapshot cadence;
- eligibility policy;
- reward-pool source;
- final weight function;
- Cardano address classification;
- direct vs claim settlement;
- production persistence.

Those remain PRE-RICH decisions.

## Cardano boundary

A future Cardano implementation must reconstruct the snapshot from authoritative ledger evidence and then feed the canonical result into this calculator.

The calculator must not infer balances from browser state or user-supplied claims.

Cardano native tokens are ledger-native, but outputs containing custom tokens also require ADA to satisfy the minimum-ADA requirement. Therefore the later settlement layer must account for output funding and transaction size. Cardano documents transaction fees as size-dependent and `maxTxSize` as a protocol parameter. This implementation does not alter either. 


## Treasury model correction

PRE-RICH has **one Treasury**. There is no separate on-chain staking reward pool.

The staking calculation consumes the Treasury's **separately accounted staking balance** inside that same Treasury. The accounting separation is semantic/accounting separation, not a second wallet, contract or custody location.

Therefore:

```
single PRE Treasury
├─ existing Treasury accounting categories
└─ staking-reward accounting balance
       ↓
snapshot weights
       ↓
PRE entitlements
```

The source amount remains subject to whatever PRE-RICH Treasury accounting rules govern that category. This calculator does not invent a percentage, source, or transfer from another pool.
