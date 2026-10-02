# PRE-RICH PRE Snapshot Reward Model

**Status:** DRAFT / OPEN ECONOMIC DECISION  
**Scope:** PRE-RICH application only  
**IMMORTAL impact:** none; this document does not modify the IMMORTAL Economic Kernel.

## 1. Purpose

Define a PRE-RICH reward mechanism in which users retain PRE in their own wallets and eligibility is determined from a canonical balance snapshot.

This is intentionally distinct from the IMMORTAL usage-fee distribution mechanism. IMMORTAL has no native protocol token; its fee mechanism must not be interpreted as token staking.

## 2. Core model

```
PRE balance in user wallet
        ↓
canonical snapshot
        ↓
eligibility
        ↓
stake weight
        ↓
Treasury staking-accounting allocation
        ↓
PRE distribution / airdrop
```

No PRE is required to be deposited into a staking contract.

No custody, lock, unstake or slashing mechanism is implied by this specification.

## 3. Snapshot semantics

For a reward epoch `e`, define a canonical snapshot `s_e`.

For each eligible holder `i`:

- `B_i(s_e)` = PRE balance attributable to the holder at the snapshot;
- `W_i(s_e)` = stake weight derived from that balance;
- `R_e` = reward amount allocated to the epoch;
- `W_total(s_e) = Σ_i W_i(s_e)`.

The snapshot is the authoritative input to the distribution calculation for that epoch.

Transfers after the snapshot do not retroactively change the entitlement established by that snapshot.

## 4. Distribution

Subject to the final weight function and eligibility rules:

```
Reward_i(e) = R_e × W_i(s_e) / W_total(s_e)
```

The resulting reward is distributed to the address/ledger identity established by the snapshot.

A recipient does not need to move or lock the underlying PRE balance to receive the reward.

## 5. Explicit separation boundaries

### PRE staking

```
PRE ownership → snapshot → reward entitlement
```

### IMMORTAL usage-fee mechanism

```
protocol usage → usage fee → configured economic distribution
```

The latter is not token staking because IMMORTAL has no native token.

### Governance

PRE staking weight and governance voting weight are separate concepts unless a future PRE-RICH governance specification explicitly composes them.

## 6. Fail-closed requirements

A reward epoch must not be distributable when:

- the snapshot identity is ambiguous;
- the PRE asset identity is not authenticated;
- holder balances cannot be reconstructed from authoritative chain evidence;
- the eligibility rule is unavailable;
- the weight function/version is unavailable;
- the Treasury staking-accounting amount is not authenticated;
- the total eligible weight cannot be deterministically calculated;
- a recipient entitlement cannot be reproduced from the canonical snapshot.

## 7. Anti-double-distribution

Each reward epoch must have a unique canonical identifier.

Distribution state must make it impossible to treat the same epoch as two independent reward epochs.

A retry of a failed distribution must preserve the same epoch, snapshot, Treasury staking-accounting balance and entitlement calculation rather than creating a second entitlement.

## 8. Still OPEN

The following economic choices are deliberately **not** invented here:

1. Snapshot cadence / epoch duration.
2. Eligibility threshold.
3. Whether weight is linear, capped, sublinear or tiered.
4. Treasury accounting source.
5. Treasury staking-accounting amount or allocation percentage.
6. Whether excluded addresses/assets exist.
7. Distribution mechanism: direct airdrop, claim, or another non-custodial settlement path.
8. Treatment of PRE held by protocol-controlled or liquidity-pool addresses.
9. Exact canonical balance reconstruction rule.
10. Final rounding / dust policy.

## 9. Important non-goals

This specification does not:

- introduce an IMMORTAL token;
- modify IMMORTAL economics;
- route IMMORTAL usage fees into PRE staking;
- create a custodial staking contract;
- define governance voting power;
- imply that PRE must be locked.

## 10. Closure target

The implementation should only begin after the OPEN economic parameters above are resolved in PRE-RICH application governance/specification.

The intended final chain is:

```
authoritative PRE balances
→ canonical snapshot
→ deterministic weight
→ authenticated Treasury staking-accounting balance
→ deterministic entitlement
→ non-custodial distribution
→ distribution evidence
```
