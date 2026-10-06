# PRE-RICH Game Economy

**Role:** normative PRE-RICH application economic specification

**Semantic status:** CLOSED except for the three explicitly listed open policies.

**Implementation/evidence:** tracked separately; gaps do not reopen closed semantics.

## 1. Frozen baseline

```text
KA = 8
KC = 4
KD = 4

Ticket ladder:
1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM

Genesis ticket = 1 USDM
Genesis bootstrap = verified PRE Treasury >= 4000 USDM
Maximum normal payout = 500 × P
WorstCaseExposure(P,N) = 500 × P × N
RawSurplus = max(0, EEV − ProtectedCapital)
```

These are application-level frozen semantics.

## 2. Accounting and protected liquidity

Accounting is liability-first. Protected obligations precede discretionary surplus.

For an accounting asset A:

```text
EffectivePool(A) =
    TotalLiquidity(A)
  - PendingWinningLiabilities(A)
  - UnresolvedTicketReserve(A)
  - LockedJackpotLiquidity(A)
```

The corresponding safety invariant is:

```text
PendingWinningLiabilities
+ UnresolvedTicketReserve
+ LockedJackpotLiquidity
<= TotalLiquidity
```

Jackpot liquidity is deducted exactly once.

The Genesis PRE bootstrap position is not automatically PrizePool liquidity.

## 3. Normal prize economics

PRE-RICH retains five winning tiers:

| Tier | Base multiplier | Effective payout |
|---:|---:|---:|
| 1 | 2 | 1 × P |
| 2 | 5 | 2.5 × P |
| 3 | 10 | 5 × P |
| 4 | 200 | 100 × P |
| 5 | 1000 | 500 × P |

Therefore:

```text
MaximumNormalPayout(P) = 500 × P
```

A winning payout is determined at reveal and becomes immutable at crystallization.

### 3.1 Surplus, class activation and prize capacity

Protocol economic strength can improve player economics in **two distinct regimes**.

First, while the ticket ladder can still expand, a stronger verified economic state can permit a higher `CurrentActiveClass`. Because normal prizes are proportional to ticket price `P`, the absolute prize amounts then increase automatically.

Second, after the maximum ticket class and the required Jackpot regime are already active, class progression can no longer express additional economic surplus. The recovered PRE-RICH economic design calls this the **mature surplus regime** and assigns the remaining adaptive role to **AWRA — Adaptive Win Rate Algorithm**.

The deterministic base payout remains:

```text
Prize(P, tier) = BaseMultiplier(tier) × P / 2

BaseMultiplier =
  Tier 1 → 2
  Tier 2 → 5
  Tier 3 → 10
  Tier 4 → 200
  Tier 5 → 1000

MaximumNormalPayout(P) = 500 × P
```

### 3.2 Mature surplus and AWRA

Define the economic boundary:

```text
RawSurplus = max(0, EEV − ProtectedCapital)
```

The historical economic-algorithm checkpoint also defined the candidate distribution floor:

```text
C = V − L − E − J − R − M − O
X(P) = 499P + Fs + Fr + Fc
DS = max(0, C − KD × X(Pcurrent))
```

`DS` is the candidate amount that may be used only after preserving the safety/continuity floor. It is **not** an automatic entitlement to spend and must still pass the post-state Economic Gate and Viability checks.

When all ticket classes are already active and the required Jackpot state is already funded/protected, further surplus cannot create a new ticket class. In that mature state, the intended adaptive consumer is AWRA.

AWRA may improve future-ticket economics through an explicitly authorised, deterministic configuration. The recovered design identified the following objective dimensions:

- win probability `W = P(payout > 0)`;
- profit-win probability `G = P(payout > ticket)`;
- probability of two row wins `D`;
- probability of payout at least `5×`;
- expected value `EV`;
- variance / `σ`;
- tail risk;
- required reserve.

AWRA is therefore **not** a hidden multiplier controlled by the operator. It is a state-dependent application policy that may choose only among authorised configurations whose projected post-state remains safe.

Hard constraints:

```text
crystallised payouts             unchanged
unresolved worst-case protection  preserved
locked Jackpot                    preserved
Reserve / Maintenance / O         preserved
500 × P ceiling                   preserved
post-state Economic Gate          required
Viability                         required
```

The change applies only to tickets whose result has not yet been crystallised. Once a ticket is crystallised, later surplus changes, AWRA changes or class changes cannot rewrite its payout.

### 3.3 What is frozen and what is not

**Frozen today:** the base five-tier payout table, the `500 × P` normal ceiling, the class ladder, liability-first accounting and the protected-capital / `RawSurplus` boundary.

**Recovered but not numerically frozen:** the mature-surplus AWRA function itself. The historical checkpoints explicitly state that an AWRA optimum had not yet been established and that the preferred approach was a Pareto frontier or explicit lexicographic priorities under hard solvency constraints.

Thus the current base table remains the canonical configuration until an AWRA policy is explicitly parameterised, versioned and adopted. See `PRE-RICH/docs/AWRA-SURPLUS-MODE-DESIGN.md` for the recovered design record.

## 4. Unresolved-ticket reserve

Every unrevealed ticket consumes economic capacity. The reference statistical model is:

```text
UnresolvedReserve(N) = N × μ + Z × σ × sqrt(N)
```

Genesis reference values remain:

```text
μ ≈ 0.65 USDM
σ ≈ 6.676 USDM
Z ≈ 3.09
```

Reference Genesis distribution:

```text
Loss        75%
1 USDM      17%
2.5 USDM     6%
5 USDM       1.8%
100 USDM     0.19%
500 USDM     0.01%
```

This is a statistical risk model, not a deterministic guarantee and does not replace deterministic worst-case protection.

## 5. Classes and exposure

Saleability is derived from verified post-sale economic state; an administrator does not manually enable an economically unsafe class.

```text
CurrentActiveClass
HighestClassEverActivated
```

`CurrentActiveClass` may contract. `HighestClassEverActivated` is monotonic.

Concrete contraction:

```text
100 → 50 → 25 → 10 → 5 → 3 → 2 → 1 → HALT
```

Suspension affects new sales only. Existing tickets and crystallized liabilities remain valid.

For class price `P` and unresolved count `N`:

```text
WorstCaseExposure(P,N) = 500 × P × N
```

Class-aware exposure or an equivalent deterministic mechanism is required; aggregate unresolved count alone is insufficient when ticket prices differ.

## 6. Hysteresis

The application hysteresis semantics are CLOSED:

```text
KA = 8
KC = 4
KD = 4
```

Remaining implementation, simulation or conformance work does not reopen these parameters.

## 7. Jackpot

The Jackpot is economically separate from the five normal symbols and must not alter their probability distribution. It is separate, protected and locked.

Reference maturity model:

```text
M = 500 × HighestClassEverActivated
J1 = 10 × M
J2 = 20 × M
J3 = 50 × M
J4 = 100 × M
J5 = 250 × M
```

Funding:

```text
NewJackpot <= RawSurplus
```

Activation requires the target locked liquidity and a solvent resulting state.

Payout safety:

```text
JackpotPayout <= LockedJackpotLiquidity
```

The choice between threshold payout and full current locked-balance payout is OPEN-01.

Jackpot assignment is cryptographically verifiable and non-discretionary. After payout, the paid amount becomes a normal pending liability and the Jackpot bucket is reduced exactly once. `HighestClassEverActivated` remains monotonic.

There is no fixed canonical Jackpot allocation rate. A future allocation rule is OPEN-03 only if an explicit allocation rule is actually required.

## 8. Treasury and historical allocation

Player payments enter protocol-controlled Treasury; no personal founder/team/operator entitlement exists.

The former:

```text
75 / 10 / 10 / 5
```

allocation is **HISTORICAL / NON-CANONICAL** and is not a current economic rule.

## 9. Settlement and value preservation

Prize values are frozen in USDM. Settlement in USDM, ADA or another supported asset is permitted only when verified conversion preserves the frozen USDM economic value.

The validation profile must address, where applicable:

- asset identity;
- price validity;
- freshness;
- decimal handling;
- deterministic rounding;
- minimum-UTxO treatment;
- rejection of stale or malformed data.

A crystallized prize cannot be reduced by changing settlement asset.

## 10. Reveal, crystallization and claim

```text
Reveal
  ↓
Verify randomness/evidence
  ↓
Derive result
  ↓
Determine tier / Jackpot result
  ↓
Check economic capacity
  ↓
Freeze payout where winning
```

A crystallized payout is immutable. Treasury movements, PRE valuation, class suspension, governance changes and later pool changes cannot recompute it.

Claims are single-use economic transitions.

```text
CLAIM ≠ BURN
```

Claiming does not require NFT destruction.

## 11. Expiry

Expiry is final:

- no claim after expiry;
- no new liability after expiry;
- unresolved reserve is released exactly once where applicable;
- an expired unclaimed winning right is released exactly once;
- a late historical reveal may preserve historical information;
- a late reveal cannot create claimability or revive the dissolved right;
- the expired payment commitment dissolves.

Only the exact ticket lifetime is OPEN-02.

## 12. Transferability and ticket identity

Tickets are transferable. Transfer does not alter ticket identity, commitment, round, game configuration or future result. The economic right follows the ticket and transfer cannot duplicate the claim.

A revealed but unclaimed winning ticket may remain transferable where permitted; its crystallized payout remains attached to the ticket.

## 13. Retention and voluntary burn

A claimed ticket may remain as a historical collectible. Burning is voluntary and provides no refund, bonus or additional economic right.

## 14. Sale atomicity

The intended economic sale transition is:

```text
Ticket mint
    +
Treasury payment
    +
PrizePool unresolved-ticket reservation
```

These economically coupled effects must be atomic or realized through an equivalent mechanism that preserves the same invariant. Off-chain bookkeeping cannot substitute for the required economic enforcement.

## 15. Treasury → PrizePool funding

Treasury funding of PrizePool is protocol-controlled and must preserve:

- crystallized liabilities;
- unresolved reserve;
- deterministic exposure;
- locked Jackpot;
- safety capital;
- all other mandatory economic invariants.

## 16. Operations and governance boundary

Operational observation/recovery is a liveness function. It cannot alter outcomes, economic rights, randomness, payouts or protocol truth.

Governance may operate only within the application authority permitted by IMMORTAL and cannot assign individual winners, Jackpot recipients, alter crystallized payouts, bypass solvency for a chosen transaction or create privileged personal Treasury entitlement.

## 17. Open set — exactly three

1. **OPEN-01 — Jackpot payout mode:** threshold payout vs full current locked-balance payout.
2. **OPEN-02 — Exact ticket expiry duration.**
3. **OPEN-03 — Future Jackpot allocation policy, only if an explicit allocation rule is actually required.**

No other application economic policy is OPEN.
