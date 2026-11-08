# Agent A — dependence-robust cohort bound and Reveal-path feasibility

**Date:** 2026-11-08  
**Branch:** `work/immortal-green-closure`  
**Classification:** RESEARCH / MATHEMATICAL FEASIBILITY ONLY — NOT NORMATIVE, NOT PRODUCTION CONFORMANCE  
**Scope:** PRE-RICH Scratch & Win statistical cohort candidate; no D3 Arb Agent integration.

## 1. Finding

The exact Classic-6 ticket-level payout PMF has closed-form first and second moments. These moments permit a much smaller, integer-only **Cantelli upper-bound predicate** than the exact N-fold payout convolution.

Unlike the earlier exact-convolution capacity frontier, this bound does **not** require independence between different tickets. It does require every ticket's payout to retain the canonical Classic-6 marginal distribution under the adopted randomness/commitment assumptions.

This is a candidate for a constant-size on-chain arithmetic check, not an approved risk policy. It does not by itself solve the current Reveal-order, capital-perimeter, or Beacon-authenticity gaps.

## 2. Exact moment derivation

The current canonical source is `PRE-RICH/docs/GAME-ECONOMY.md` §3.1: two independent rows, each sampled uniformly from the 20,000-slot domain, and the ticket payout is the row-payout sum capped at 500× price.

From the exact ticket-level counts in that table:

- Mean multiplier: `μ = 20799 / 32000 = 0.64996875`.
- Second raw moment: `E[Y²] = 180693501 / 4000000`.
- Variance: `σ² = 9164987571 / 204800000 ≈ 44.750915874023434`.
- Standard deviation: `σ ≈ 6.689612535`.

These values are recomputed from the exact 15-outcome ticket-level PMF; they are not the historical one-row distribution or the rounded old `μ≈0.65, σ≈6.676` pair.

## 3. Dependence-robust Cantelli bound

Let ticket i have face price `P_i` and payout `X_i = P_i Y_i`, where each `Y_i` has the canonical marginal distribution. Define `F = Σ P_i` for the unresolved cohort and `S = Σ X_i` for its aggregate eventual payout.

Then:

- `E[S] = μ F`.
- For arbitrary cross-ticket dependence, Cauchy–Schwarz gives `Var(S) ≤ (Σ SD(X_i))² = σ² F²`.
- For `C > μF`, the one-sided Cantelli inequality therefore gives:

  `Pr(S > C) ≤ σ² F² / (σ² F² + (C − μF)²)`.

This is an upper bound, not an estimate of the actual tail probability. It is valid for any joint dependence between tickets **provided the individual ticket marginals remain the stated PMF**. It does not assume that tickets are mutually independent.

### 3.1 Exact integer predicate

Let the approved risk ceiling be represented by a rational `ε = a/b`, with `0 < a < b`. Let `C` and `F` both be represented in the same integer USDM sub-unit scale. The condition that the Cantelli upper bound is at most ε is exactly equivalent to:

```text
D = 32000*C - 20799*F

require D > 0

5 * (b-a) * 9164987571 * F^2
    <= a * D^2
```

The inequality is exact integer arithmetic: no floating point, square root, FFT, Monte Carlo result, or caller-supplied statistical scalar is required. A Plutus implementation would still need CEK/resource and complete-transaction measurements; none has been run for this candidate.

### 3.2 Illustrative Genesis-only bound

For illustration only, let `C = 4,000 USDM` be the entire available payout budget for the cohort after all other encumbrances, and let each unresolved ticket cost `P=1 USDM`.

| Lifetime tail ceiling ε | Largest N satisfying the Cantelli bound | Bound at N | Bound at N+1 |
|---:|---:|---:|---:|
| 0.1% | 18 | 0.091070% | 0.101492% |
| 0.5% | 42 | 0.497693% | 0.521720% |
| 1.0% | 59 | 0.982797% | 1.016384% |

At ε=0.1%, this is a dependence-robust bound of 18 rather than the deterministic V1 count of 8 under the same hypothetical C. It is much more conservative than the prior independent-ticket exact-convolution result of 3,579. These numbers are **conditional research outputs**, not authorised sale limits and not an unconditional 500× guarantee.

## 4. Preconditions that are not yet established

### 4.1 Marginal randomness / commit-before-beacon

The source path does establish a useful ordering property:

- `plutus/MintPolicy.hs` accepts a fresh pending PrizeDatum only when the matching BeaconRegistry is still `BeaconPending`.
- The ticket binds the player commitment, game version, nonce, price and exact BeaconTarget.
- `plutus/PrizeValidator.hs::validateReveal` later receives the player secret and derives the ticket seed from round, nonce, secret, published beacon and game version.

This means the player commitment is created before the Registry is Ready for that target. It does **not** by itself prove that the eventual Beacon is unbiased, unpredictable, ungrindable or independent of adversarial inputs.

`plutus/BeaconRegistry.hs` explicitly states that the on-chain validator does not independently verify an external Materios receipt; it checks the configured relayer's signature and that the stored Beacon is the deterministic hash of the supplied target/context. Consequently, the canonical ticket marginal distribution is not yet a trustless ledger theorem. The authorised relayer / Materios evidence boundary and the B2 randomness qualification remain material assumptions.

The Cantelli predicate is invalid as an admission guarantee if an adversary can choose or bias the Beacon after seeing ticket commitments, if the player can grind a ticket secret after the Beacon is known, or if a ticket's conditional marginal distribution differs from the canonical PMF.

### 4.2 Reveal order and the actual B1 cash-flow predicate

`plutus/B1PrizePool.hs` defines the available `effectivePool` from physical Pool liquidity minus crystallised pending liabilities, unresolved face-price reserve and locked Jackpot liquidity. On `TicketRevealed`, the validator:

1. requires the actual payout to be no greater than the pre-transition `effectivePool`;
2. increases pending liabilities by the exact payout;
3. releases the ticket's face-price unresolved reserve;
4. preserves total physical Pool liquidity.

Thus the available amount changes by `effectivePool_after = effectivePool_before − payout + ticket_price`, but the payout affordability test is applied **before** the ticket-price reserve is released.

The player secret is supplied to Reveal. Once the Beacon is Ready, the ticket holder can compute that ticket's deterministic result before submitting Reveal, so Reveal timing/order is a strategic path variable. Selectively expiring a losing ticket does not increase the sum of its fixed payouts (a loss is zero), but it can alter the timing of reserve releases.

**An exact fixed-cohort Reveal-order requirement can be derived.** Let `E0` be the B1 `effectivePool` after all tickets in the cohort have been issued and before its first Reveal. For a fixed payout vector `X_i` and ticket prices `P_i`, the minimum initial amount required so that every possible Reveal ordering passes B1's pre-transition affordability check is:

```text
R_max = max over permutations π and prefixes k of
        [ X_(π_k) + Σ_(j<k)(X_(π_j) − P_(π_j)) ]

      = Σ_i max(0, X_i − P_i) + max_i min(X_i, P_i)
```

For any prefix, previous tickets with positive net payout `X_i−P_i` increase the required starting capital; tickets with non-positive net payout do not make a later Reveal harder. The maximum is attained by putting all positive-net tickets before the current ticket that maximizes the remaining term. This yields the closed form above. An exploratory permutation check over 600 randomly generated fixed-cohort vectors with up to six tickets matched the closed form against full permutation enumeration; this was not a repository test or a formal implementation test.

The path requirement is bounded by total eventual payout:
```text
R_max
  = Σ_i max(0, X_i−P_i) + max_i min(X_i,P_i)
  ≤ Σ_i [max(0, X_i−P_i) + min(X_i,P_i)]
  = Σ_i X_i
  = S
```

Therefore `S ≤ E0` is a simple sufficient condition for every permitted Reveal order and Pending Expire interleaving to pass the B1 pre-Reveal payout-affordability check. At each Reveal, prior payouts have been deducted and prior face reserves released; an Expire releases additional face reserve. Since the current payout plus all previous payouts cannot exceed `S`, it remains affordable from `E0` or the larger current effective pool.

For this fixed cohort, no additional Pool-draining Issue or other outflow during resolution, the event `R_max > E0` is contained in `S > E0`. Cantelli applied with `C=E0` therefore conservatively upper-bounds **B1 pre-Reveal payout-affordability failures across all Reveal/Expire orderings**. The bound may be loose because reserve releases can make some sequences succeed even when `S > E0`.

This does not automatically cover overlapping cohorts, other round admissions, new Issue interleavings, model-version changes, external Pool outflows, or a global lifetime risk budget. Those events must be included in one shared perimeter or allocated/proved without double-spending the same capital or risk budget.

For the illustrative table in §3.2, `C=4,000 USDM` must therefore mean the B1 pre-Reveal `effectivePool` (or a stricter value after other protected obligations), **after** pending liabilities, all unresolved face-price reserves and locked Jackpot are deducted. It is not gross Pool liquidity, Treasury bootstrap, or an independently available 4,000-USDM balance. This exact capital mapping still requires a qualified authenticated state and the wider IMMORTAL protection contract.

## 5. What this candidate solves — and what it does not

**Potentially solves:** a compact, exact, dependence-robust upper bound for the *static aggregate payout* of one fixed cohort, using only a small number of integer operations and profile-committed rational constants.

**Does not solve:**

- the trustworthiness of each ticket's marginal randomness distribution or the Beacon's conditional unpredictability;
- an exact/tight path-risk model: the sufficient condition `S ≤ E0` is conservative and only covers a fixed cohort with no additional Pool-draining Issue or other outflow during resolution;
- application of the same bound across overlapping cohorts, new Issue interleavings, different model versions or a shared lifetime risk budget;
- a qualified derivation of `C=E0` from authenticated B1 Pool state plus any additional IMMORTAL protected-capital requirements;
- lifetime risk-budget allocation across multiple cohorts, model versioning, concurrency and replay;
- preservation of the separate deterministic floor for known liabilities, Jackpot, fees, safety capital and any mandatory backstop;
- the fact that PRE-RICH V1 still enforces 500× and `RiskProtectionBridge` is not wired into production admission.

A Cantelli-bound profile would be a distinct probabilistic application guarantee. It cannot be described as retaining the current unconditional 500× protection for every unresolved ticket.

## 6. Required next feasibility gates

1. Extend the fixed-cohort sufficiency lemma to overlapping rounds/cohorts, new-Issue interleavings and all other permitted Pool transitions; bind the common capital perimeter and risk-budget composition.
2. Qualify the Beacon's source, unpredictability, bias resistance, ticket commitment timing and per-ticket marginal distribution against the actual configured Registry / Materios authority boundary.
3. Derive `C` from authenticated physical PrizePool value after all obligations, with face-price reserve and payout budget accounted for exactly once.
4. Implement a standalone reference calculator and exact-integer property tests; compare it with the exact convolution under independence and adversarial-dependence test cases. These tests were not run in this research note.
5. Benchmark the integer predicate and the full candidate transaction on the intended Plutus target before declaring it resource-feasible.
6. Only after those gates, ask the specification authority to select a new profile, lifetime/global ε and governance/versioning rules. Until then, PRE-RICH V1 remains unchanged and fail-closed.

## 7. Source crosswalk

- [Canonical Classic-6 PMF and moments](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/docs/GAME-ECONOMY.md)
- [Typed RiskProtectionBridge scaffold](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/IMMORTAL/kernel/RiskProtectionBridge.hs)
- [Ticket commitment and Beacon-pending Issue gate](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/MintPolicy.hs)
- [Secret-bound ticket seed and Reveal validation](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/PrizeValidator.hs)
- [Beacon Registry relayer / external receipt boundary](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/BeaconRegistry.hs)
- [B1 Pool reserve/liability and payout affordability](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/B1PrizePool.hs)
- [Earlier exact cohort-tail analysis](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6704197472)
- [Earlier cash-flow / first-passage sensitivity](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6704380744)

**Disposition:** mathematical candidate identified; production use blocked by randomness qualification, B1 Reveal-path/capital derivation, application-policy approval and on-chain resource evidence. No source code, test, parameter, profile, 500× rule, V3/Reveal semantics, wallet, deployment or ledger state changed.