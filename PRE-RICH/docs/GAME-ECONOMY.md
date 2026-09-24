# PRE-RICH Game Economy

**Role:** normative PRE-RICH application economic specification

**Semantic status:** CLOSED application baseline as reconciled by the current PRE-RICH decision register. Implementation/conformance is tracked separately; implementation gaps do not reopen closed semantics.

**Policy boundary note:** exact ticket lifetime is a DApp/profile parameter under the closed A1 mechanism; no universal numeric lifetime is imposed by IMMORTAL. Jackpot activation/funding/payout semantics are PRE-RICH application policy and are not universal IMMORTAL constants.

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

## 3. Normal prize economics — per-row tiers

PRE-RICH retains five **winning tiers per row**:

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

### 3.1 Canonical Classic-6 ticket model

The current PRE-RICH game is **Classic-6 with two independent rows**. Each row is sampled independently from a uniform 20,000-slot domain:

```text
0..17499       loss      87.5%
17500..19199   tier 1     8.5%
19200..19799   tier 2     3.0%
19800..19979   tier 3     0.9%
19980..19998   tier 4     0.095%
19999          tier 5     0.005%
```

A 16-bit draw is accepted only when `< 60000` and then reduced modulo `20000`. Because `60000 = 3 × 20000`, this reduction is uniform. Row 1 and row 2 use domain-separated inputs and are evaluated independently.

The canonical row payouts are the five tiers above. The ticket payout is the sum of the two row payouts, capped at `500 × P`. Therefore the five-tier table is a **row-level** table; it is not a complete list of ticket-level payout outcomes.

For the current two-row mechanism, the exact ticket-level distribution (excluding the single zero-payout loss line from the list of winning outcomes) is:

| Ticket payout | Exact pair count / 400,000,000 | Probability |
|---:|---:|---:|
| 0 × P | 306,250,000 | 76.5625% |
| 1 × P | 59,500,000 | 14.8750% |
| 2 × P | 2,890,000 | 0.7225% |
| 2.5 × P | 21,000,000 | 5.2500% |
| 3.5 × P | 2,040,000 | 0.5100% |
| 5 × P | 6,660,000 | 1.6650% |
| 6 × P | 612,000 | 0.1530% |
| 7.5 × P | 216,000 | 0.0540% |
| 10 × P | 32,400 | 0.0081% |
| 100 × P | 665,000 | 0.16625% |
| 101 × P | 64,600 | 0.01615% |
| 102.5 × P | 22,800 | 0.00570% |
| 105 × P | 6,840 | 0.00171% |
| 200 × P | 361 | 0.00009025% |
| 500 × P | 39,999 | 0.00999975% |

The exact first two moments of the current ticket distribution are:

```text
E[payout] = 0.64996875 × P
σ ≈ 6.689612535 × P
```

The earlier single-result reference distribution is historical material and must not be presented as the current Classic-6 ticket-level distribution. The current implementation and these exact combinatorial counts are the conformance target.

## 4. Unresolved-ticket reserve

Every unrevealed ticket consumes economic capacity. The reference statistical model is:

```text
UnresolvedReserve(N) = N × μ + Z × σ × sqrt(N)
```

For the current canonical Classic-6 **ticket-level** distribution:

```text
μ = 0.64996875 USDM per 1-USDM ticket
σ ≈ 6.689612535 USDM per 1-USDM ticket
Z = deployment/model parameter
```

The older `μ ≈ 0.65`, `σ ≈ 6.676` pair and the older `75/17/6/1.8/0.19/0.01` distribution describe the historical single-result model and are retained only as research/provenance material. They are not the current Classic-6 ticket-level payout distribution.

This remains a statistical risk model, not a deterministic guarantee, and does not replace deterministic worst-case protection.

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

The Jackpot is application-owned PRE-RICH policy. It is separate from the normal Classic-6 row distribution and must not alter the probability distribution of the two normal rows. It is protected and locked once funded.

Canonical activation is state-derived and deterministic; there is no independent scalar maturity ladder:

```text
StableLadder(S) :=
  CurrentActiveClass(S)
    = HighestClassEverActivated(S)
    = 100
  AND ActivationPredicate(100,S)
  AND NOT SuspensionPredicate(100,S)
```

Funding eligibility requires:

```text
StableLadder(S)
AND FundingNeed(S) > 0
AND Gate(S, JACKPOT_FUND) = ACCEPT
```

with:

```text
J_floor(S) = 500 × max(ΣP_normal, ΣP_saleable(S))
FundingNeed(S) = max(0, J_floor(S) − J_locked(S))
NewJackpot = FundingNeed(S)
```

Funding must additionally satisfy:

```text
NewJackpot <= RawSurplus(S')
```

and the resulting state must remain economically admissible. Once funded and locked, Jackpot liquidity cannot be reduced or dissolved before the winning transition.

Payout safety is:

```text
JackpotPayout <= LockedJackpotLiquidity
```

The current PRE-RICH payout mode is **full current locked-balance payout exactly once**. The paid amount becomes a normal crystallized/pending liability according to the application lifecycle, while the Jackpot bucket is reduced exactly once.

There is **no fixed canonical Jackpot allocation percentage**. The default funding operation is the minimum state-derived gap to the current floor; any surplus above that requirement remains RawSurplus.

The historical scalar maturity ladder `10/20/50/100/250 × M` and historical fixed allocation splits are non-canonical.

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

The exact ticket lifetime is **not a universal IMMORTAL number**. PRE-RICH/deployment must declare a deterministic `F_D(S_issuance)` policy and crystallize `expiresAt = issuedAt + H` at issuance. The mechanism is CLOSED; the numerical profile parameter remains deployment/application configuration and must not be silently fixed as universal canon.

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

## 17. Current policy closure state

| Topic | Current status |
|---|---|
| Classic-6 two-row result representation | CLOSED — current PRE-RICH application canon |
| Five winning tiers | CLOSED — per row |
| Ticket-level payout | CLOSED — sum of row payouts, capped at `500 × P` |
| Jackpot activation/funding mechanism | CLOSED — state-derived, deterministic, PRE-RICH-owned |
| Jackpot payout mode | CLOSED — full current locked-balance payout exactly once |
| Fixed Jackpot allocation percentage | CLOSED as unnecessary for the current policy |
| Ticket expiry mechanism | CLOSED — state-derived, DApp/profile-defined and crystallized at issuance |
| Exact expiry numeric profile value | DEPLOYMENT/APPLICATION PARAMETER — not an IMMORTAL universal constant |

No implementation or conformance gap in this section reopens a closed policy decision. Any future change to these semantics requires a new explicit PRE-RICH policy decision.
