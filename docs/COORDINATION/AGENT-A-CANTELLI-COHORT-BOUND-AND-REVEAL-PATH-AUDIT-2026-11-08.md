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

**Potentially solves:** a compact, exact, dependence-robust upper bound for the *static aggregate payout* of one pre-specified fixed set spanning multiple active Beacon rounds that share one B1 Pool, using only a small number of integer operations and profile-committed rational constants.

**Does not solve:**

- the trustworthiness of each ticket's marginal randomness distribution or the Beacon's conditional unpredictability;
- an exact/tight path-risk model: the sufficient condition `S ≤ E0` is conservative and only covers a fixed cohort with no additional Pool-draining Issue or other outflow during resolution;
- rolling/adaptive Issue interleavings after any relevant outcome becomes available; §8 covers only the fixed aggregate set across active rounds whose membership and marginal-law assumptions were fixed at the valid pre-outcome risk boundary;
- heterogeneous profile versions without per-ticket or dominating moment bounds, and a shared lifetime risk budget across repeated risk epochs;
- a qualified derivation of `C=E0` from authenticated B1 Pool state plus any additional IMMORTAL protected-capital requirements;
- lifetime risk-budget allocation across multiple cohorts, model versioning, concurrency and replay;
- preservation of the separate deterministic floor for known liabilities, Jackpot, fees, safety capital and any mandatory backstop;
- the fact that PRE-RICH V1 still enforces 500× and `RiskProtectionBridge` is not wired into production admission.

A Cantelli-bound profile would be a distinct probabilistic application guarantee. It cannot be described as retaining the current unconditional 500× protection for every unresolved ticket.

## 6. Required next feasibility gates

1. For any rolling/adaptive Issue design, establish conditional moment bounds over the full adversarial information history and prove risk-budget spending / capital non-overlap; the static multi-round fixed-set Reveal lemma is now recorded in §8.
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

## 8. Multi-round shared-pool aggregation and adaptive-Issue boundary

### 8.1 Multiple active rounds can be one static risk perimeter

For a single B1 PrizePool, the relevant static set is not one Beacon round at a time. At a qualified admission boundary, define (U^*) as **all Pending tickets backed by that same Pool across every active BeaconTarget / round whose membership is fixed before any corresponding outcome becomes available to an adversarial ticket holder**. Include every ticket in that frozen set exactly once, whatever its round; already-Revealed payouts are represented in crystallised pending liabilities and are not added again as unresolved random payout. Pending tickets that may later Expire can remain in the set: including their potential payout is conservative. A ticket whose Beacon is already Ready at a later admission/refresh boundary cannot be treated as a fresh unconditional draw merely because it remains Pending: it must remain covered by its earlier frozen risk epoch or have a valid conditional-moment bound (§8.2).

Let:

- (F^* = \sum_{i\in U^*} P_i), the aggregate unresolved face value;
- (E^*) be the authenticated B1 `effectivePool` at the same ledger cut, after crystallised pending liabilities, the full unresolved face reserve and locked Jackpot are deducted;
- (S^* = \sum_{i\in U^*} X_i), the aggregate potential payout of that complete fixed set.

If every ticket in (U^*) has the same canonical Classic-6 marginal distribution, then:

`E[S*] = μF*` and `Var(S*) ≤ σ²(F*)²`, even with arbitrary dependence **between tickets and between rounds**. The same Cantelli expression and exact integer predicate in §§3.1–3.2 therefore apply with `F=F*` and `C=E*`. The set must be global to the Pool: calculating a separate bound for each Beacon round against the same (E^*), and then treating those bounds as if each round had separate capital, would reuse both capital and risk budget. The source supports this perimeter: MintPolicy binds each new ticket's `pdPrizePoolHash` to the configured B1 PrizePool hash, and `atomicPoolReservationValid` requires the single Pool input/output to increase the aggregate `ppUnresolvedReserve` by exactly that ticket's price. B1 `effectivePool` then subtracts that one aggregate reserve. Thus multiple rounds using the same configured pool hash share one ledger-accounted reserve, not separate per-round balances.

The fixed-set Reveal-path result also extends without a new proof assumption about round labels. Compute:

```text
R_max(U*) = Σ_i max(0, X_i − P_i) + max_i min(X_i, P_i)
          ≤ S*
```

over **all** pending tickets in the shared Pool, regardless of BeaconTarget. If the set is frozen and no new Issue or other Pool-draining outflow occurs while it resolves, `S* ≤ E*` is sufficient for every Reveal/Expire ordering across all those rounds. Cantelli on `Pr(S* > E*)` then gives one conservative upper bound for any B1 pre-Reveal affordability failure of that whole static multi-round set. This is one joint risk perimeter, not one independent allowance per round.

For different game/profile versions, the common Classic-6 moments cannot be silently reused. A possible dependence-robust generalization is to bind a valid marginal mean `μ_i` and standard-deviation upper bound `σ_i` to each ticket/profile and use:

```text
M = Σ_i P_i μ_i
V_upper = (Σ_i P_i σ_i)^2
Pr(S > E) ≤ V_upper / (V_upper + (E − M)^2),  when E > M
```

This still allows arbitrary cross-ticket dependence, but only if each bound is valid for the relevant information set. A common, authenticated dominating moment envelope is another possible input. Neither heterogeneous-profile calculation nor its exact integer implementation has been built or benchmarked.

### 8.2 The fixed-set theorem does not authorize rolling re-admission

The multi-round extension is **static**. All tickets in (U^*) must belong to one pre-specified admission set whose marginal laws remain valid at the point the risk guarantee is established; the set is then resolved without additions or other Pool outflows. The commitment-before-Beacon property supports an unconditional marginal model at the appropriate pre-publication boundary, subject to the unresolved Beacon qualification.

It is not sound to take a later on-chain state after some Beacon results have become available to ticket holders, remove tickets already Revealed/Expired, and simply reapply the original unconditional `μ, σ` to whatever remains Pending. The remaining set and its information state can be outcome-selected. In particular, arbitrary dependence permits a ticket's conditional distribution to change sharply after another ticket is observed: as a simple limiting case, if two ticket multipliers are perfectly dependent (`Y₂=Y₁`), observing the first payout makes the second payout known, even though both had the same unconditional Classic-6 marginal. A marginal-only Cantelli calculation at that later state would incorrectly treat the second outcome as fresh.

For a rolling/adaptive admission design, the needed object is a **conditional** moment contract over the full adversarial information history (H_t), including information available privately to ticket holders and any permitted selection / withholding behaviour. If such a contract could establish, almost surely,

```text
M_t = Σ_(i in U_t) P_i μ_i(H_t)
V_t ≤ (Σ_(i in U_t) P_i σ_i(H_t))^2
E_t > M_t
```

then conditional Cantelli would bound the next risk event by `V_t / (V_t + (E_t − M_t)^2)`. Current code and evidence do not provide these conditional moments, do not let the Pool inspect ticket-holder private information, and do not establish that an already-Ready ticket remains a fresh marginal draw at a later admission boundary. The formula is a statement of the missing proof obligation, not an available implementation.

### 8.3 One lifetime risk budget and non-overlapping capital

Repeatedly granting the same `ε` to every Issue, every round or every state refresh would not define a global/lifetime ceiling. A possible specification contract would have to choose either:

1. one frozen aggregate admission set and one `ε_global` for the entire shared-Pool resolution; or
2. a versioned sequence of risk epochs with conditional event bounds `ε_j`, where `Σ_j ε_j ≤ ε_global` (or a separately proven global supermartingale / alpha-spending construction).

For overlapping epochs sharing one Pool, their capital budgets must also be demonstrably disjoint / ring-fenced, with `Σ_j C_j` no greater than genuinely available capital, or they must be covered by one joint aggregate bound. Merely recording per-cohort values `C_j` or `ε_j` while allowing them to reference the same unpartitioned `effectivePool` is not sufficient. No epsilon-allocation rule, capital-tranche mechanism, supermartingale, or conditional-randomness proof is currently specified or implemented.

### 8.4 Exact disposition

**Resolved at research level:** a fixed, pre-specified set of tickets spanning multiple active Beacon rounds and sharing one B1 Pool can use one dependence-robust aggregate Cantelli bound and one global Reveal-path lemma, provided the common marginal model is valid for that set.

**Still open:** admission of new tickets after any relevant outcomes are available; conditioning on adversarial/private information; heterogeneous profile versions; risk-budget spending over the protocol lifetime; non-overlapping capital allocation for overlapping epochs; and authenticated derivation of `E*`. A dynamic Issue rule cannot be called safe or permissionless/trustless from the static result alone.

No production code, tests, profile, risk parameter, 500× rule, RiskProtectionBridge, V3/Reveal semantics, authority, wallet, deployment or ledger state changed in this addendum.
