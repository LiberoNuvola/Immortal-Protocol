# PRE-RICH PRE Staking — Triangulation 2026-09-29

## Result

The PRE-RICH architecture has **one Treasury**. PRE staking must not introduce a second on-chain reward pool.

The correct model is:

```
Single PRE Treasury
      ↓
canonical Treasury accounting
      ↓
staking-reward accounting balance
      ↓
PRE holder snapshot
      ↓
deterministic weight
      ↓
entitlement
      ↓
PRE distribution / airdrop
```

The staking accounting balance is a semantic/accounting partition inside the Treasury, not a second wallet, contract or custody location.

## Evidence triangulation

### 1. Current PRE-RICH economic canon

Current PRE-RICH documentation establishes:

- Genesis = 1 USDM;
- verified PRE Treasury bootstrap >= 4,000 USDM;
- liability-first accounting;
- ProtectedCapital;
- RawSurplus = max(0, EEV - ProtectedCapital);
- bootstrap PRE is not automatically PrizePool liquidity;
- old 75/10/10/5 distribution is historical/superseded and must not be promoted back to normative status.

Therefore the staking mechanism cannot assume a fixed historical Treasury percentage.

### 2. Governance precedent

PRE-RICH governance specifications establish snapshot-bound PRE voting weight and explicitly use linear PRE balance at the canonical snapshot.

This is a strong application-level precedent for:

```
snapshot → balance → deterministic weight
```

It does not by itself make linear weighting canonical for staking.

### 3. User-defined staking requirement

The intended PRE-RICH mechanism is:

- PRE remains in the user's wallet;
- a snapshot determines entitlement;
- no PRE lock is required;
- rewards are distributed in PRE.

Therefore this is snapshot-based non-custodial reward accounting, not custodial token staking.

### 4. IMMORTAL separation

IMMORTAL has no native token.

IMMORTAL usage-fee accounting and PRE-RICH holder rewards are distinct mechanisms. No PRE staking rule should be added to the IMMORTAL Economic Kernel.

Existing usage-fee documents contain historical/parallel language about a PRE staking reward mechanism. That language belongs to the IMMORTAL fee-settlement discussion and must not be silently reinterpreted as the PRE-RICH holder-snapshot mechanism.

## What is closed

- single Treasury;
- separate internal Treasury accounting is permitted;
- no second staking pool;
- no PRE custody/locking;
- snapshot-bound entitlement;
- post-snapshot transfers do not rewrite a closed epoch;
- deterministic calculation;
- anti-double-distribution requirement;
- application-level ownership;
- IMMORTAL kernel remains unchanged.

## What remains open

1. Exact Treasury accounting rule that makes PRE available for holder distribution.
2. Weight function for staking.
3. Snapshot cadence.
4. Eligibility and treatment of Treasury/LP/exchange/contract addresses.
5. Distribution path: direct airdrop vs claim.
6. Rounding/dust policy.
7. Whether an epoch entitlement is derived from the entire staking-accounting balance or only a defined amount/flow from Treasury accounting.
8. Exact evidence required to prove the Treasury accounting state at the epoch boundary.

## Important economic boundary

The calculator must **not** decide how much the Treasury should allocate to staking.

It consumes an already-authorized, authenticated Treasury accounting amount and computes holder entitlements from the snapshot.

Thus:

```
Treasury accounting rule
        ↓
authenticated staking amount
        ↓
snapshot + weight rule
        ↓
entitlements
```

The calculator is not the authority that creates the Treasury allocation.

## Historical contamination guard

The former:

```
75% PrizePool / 10% Reserve / 10% Stake / 5% Maintenance
```

is explicitly treated as historical/superseded and is not a candidate default.

No percentage is inferred from it.

## Implementation consequence

The current chain-neutral calculator is valid only as a **consumer of a Treasury accounting amount**.

The next integration boundary is therefore not a new reward pool. It is:

```
canonical Treasury state
→ authorized staking-accounting amount
→ PRE snapshot reader
→ deterministic entitlement calculator
→ distribution evidence
```

No production staking contract is required merely to implement this model.
