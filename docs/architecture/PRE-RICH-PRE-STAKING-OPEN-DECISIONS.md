# PRE-RICH PRE Staking — Open Decision Closure

**Status:** RESEARCH / DECISION REGISTER  
**Scope:** PRE-RICH application only.  
**IMMORTAL:** no change.

## 1. Existing precedent

PRE-RICH governance specifications already use:

```
voting weight = linear PRE balance at canonical snapshot
```

This establishes an existing application-level precedent for snapshot-bound, linear PRE weighting. It does **not** make linear weighting canonical for PRE staking.

## 2. Proposed baseline for evaluation

For PRE staking, the cleanest baseline to evaluate is:

```
W_i(e) = B_i(s_e)
```

where `B_i(s_e)` is the holder's authenticated PRE balance at epoch snapshot `s_e`.

Then:

```
R_i(e) = R_e × W_i(e) / ΣW_j(e)
```

This preserves exact proportionality and makes the entitlement reproducible from the snapshot.

**Decision status:** OPEN — evaluation candidate, not yet normative.

## 3. Why the baseline is attractive

It has four useful properties:

1. **Non-custodial:** no token lock is required.
2. **Deterministic:** the entitlement follows directly from canonical balances.
3. **Conservative:** it does not introduce a new nonlinear economic rule.
4. **Already familiar:** PRE-RICH governance has an existing snapshot/linear-weight pattern.

These are architectural observations, not a claim that the model is economically optimal.

## 4. Alternatives that must be explicitly rejected or selected

### A. Linear

`W=B`

Simple and proportional. Existing PRE-RICH governance precedent.

### B. Capped

`W=min(B,C)`

Reduces marginal weight above a cap, but introduces a concentration policy.

### C. Sublinear

`W=B^α`, `0<α<1`

Reduces concentration while preserving monotonicity, but adds a nonlinear parameter and precision/rounding requirements.

### D. Tiered

`W=f(B)` with explicit balance bands.

Adds discrete policy boundaries and discontinuities.

No alternative is selected by this document.

## 5. Snapshot cadence

OPEN.

The implementation must define a canonical epoch identifier and an unambiguous snapshot point. Cardano itself uses epoch-based snapshots for protocol staking calculations, demonstrating that snapshot-bound accounting is compatible with the underlying chain model. This is only an implementation reference, not a requirement for PRE-RICH.

## 6. Treasury accounting source

OPEN.

The staking amount must come from the single PRE-RICH Treasury's applicable accounting state. There is no separate on-chain staking pool.

If a future rule derives the staking-accounting amount from application revenue or another Treasury flow, that relationship must be explicitly specified at the PRE-RICH application layer and reconciled with the Treasury's canonical accounting.

## 7. Eligibility

OPEN.

At minimum the specification must define:

- asset identity;
- minimum balance, if any;
- treatment of treasury/protocol addresses;
- treatment of liquidity-pool or exchange addresses;
- whether contracts can qualify;
- whether one address equals one beneficiary.

## 8. Distribution mechanism

OPEN.

Two broad non-custodial patterns remain possible:

### Direct distribution

The system constructs a transaction sending the calculated PRE amount to every eligible recipient.

### Claim distribution

The snapshot creates a canonical entitlement record; each recipient later claims the entitlement.

Claim distribution can reduce the size of a single distribution transaction, while direct distribution is operationally simpler for recipients. The choice must account for Cardano UTxO/min-ADA and transaction-size constraints.

Cardano native tokens are ledger-tracked assets and token-bearing outputs require ADA, so a mass PRE distribution must explicitly account for output size and min-ADA requirements. citeturn0search2turn0search3

## 9. Anti-gaming requirements

The snapshot must freeze the entitlement.

Required properties:

- post-snapshot transfers do not alter the closed epoch;
- the same balance cannot generate two entitlements for one epoch;
- the same epoch cannot be distributed twice;
- reward calculations are reproducible from the canonical snapshot;
- failed distribution retries do not create a second reward epoch.

## 10. Airdrop semantics

The user's intended model is:

```
holder keeps PRE
       ↓
snapshot
       ↓
reward entitlement
       ↓
PRE airdrop
```

Therefore the underlying PRE is **not** transferred into a staking contract.

This is conceptually closer to snapshot-based reward distribution than to custodial staking.

## 11. Important separation

```
PRE-RICH PRE staking
    PRE balance → snapshot → reward

IMMORTAL usage fee
    protocol use → fee → configured economic destination
```

Neither mechanism should inherit the other's parameters.

## 12. Current closure state

### Architecturally established

- non-custodial model;
- snapshot-bound entitlement;
- PRE-specific application ownership;
- no IMMORTAL token;
- anti-double-distribution requirement;
- authenticated balance requirement;
- deterministic entitlement requirement.

### Still requiring explicit PRE-RICH decision

- weight function;
- cadence;
- eligibility;
- Treasury accounting source;
- reward amount/allocation;
- direct vs claim distribution;
- contract/LP/exchange treatment;
- rounding and dust;
- canonical balance reconstruction.

## 13. Next implementation gate

Do **not** implement a production staking contract yet.

The next safe implementation is a chain-neutral deterministic calculator plus conformance tests, parameterized by the unresolved rules above. This allows the accounting boundary to be tested without prematurely making an economic decision.
