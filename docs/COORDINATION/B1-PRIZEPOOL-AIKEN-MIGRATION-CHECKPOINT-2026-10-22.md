# B1PrizePool Aiken Migration — Claim Contract Checkpoint

**Date:** 2026-10-23  
**Branch:** `work/immortal-green-closure`  
**Status:** specification + compiling accounting slice; no deployable Aiken B1PrizePool validator is implemented or qualified by this document.

## Decision

The active Claim trace is hybrid, not all-Aiken: the Prize validator candidate is Aiken Plutus V3, while the B1PrizePool validator is currently compiled from `plutus/B1PrizePool.hs` and executed as Plutus V2. The isolated project `poc/aiken-reveal-parity` explicitly describes itself as a Reveal parity harness, not a deployable validator. Do not label the Claim path all-Aiken until a deployable B1PrizePool Aiken validator is wired into the real topology and passes ledger tests.

Do not modify the already-passing V3 carrier, the economic rules, or the existing Haskell validator while building the candidate.

## Current `TicketClaimed` contract extracted from Haskell

The following are existing requirements to preserve, not new rules:

1. Global guards still apply: pre-state solvency, exactly one pool authority NFT across inputs and outputs (including own input/output), and exactly one input from the pool script.
2. `claimedAmount > 0` and `claimedAmount <= ppPendingLiabilities(pre)`.
3. Exactly one decodable Prize validator input and exactly one decodable Prize validator output are located by the existing helper semantics.
4. Input Prize status is `Revealed`; output Prize status is `Claimed`.
5. Ticket policy and ticket name are unchanged between Prize input and output.
6. Prize amount is unchanged between input and output, and equals the Claim redeemer's `claimedAmount`.
7. The transaction is signed by the payment key controlling the input that carries exactly one unit of the ticket NFT.
8. A payment output to that owner must have canonical oracle-valued USDM amount exactly equal to the Prize datum's `pdPrizeAmount`. Preserve the current oracle valuation semantics; do not replace it with a lovelace or raw token comparison.
9. Canonical oracle-valued pool input minus pool output must equal `claimedAmount`.
10. Continuing Pool datum preserves `ppUnresolvedReserve`, `ppUnresolvedTicketCount`, `ppLockedJackpot`, `ppJackpotThreshold`, `ppSuspendedClasses`, and `ppPrizeHash`.
11. `ppTotalLiquidity(post) = ppTotalLiquidity(pre) - claimedAmount`.
12. `ppPendingLiabilities(post) = ppPendingLiabilities(pre) + EconomicKernel.liabilityClaimDelta(claimedAmount)`.
13. Post-state solvency must hold.

## Important distinction

The contract contains two different value checks: (a) the owner payout is valued using `Economic.totalUsdmValue`; (b) the physical Pool input/output delta is valued using `Economic.poolUsdmValue`. A port must preserve those canonical valuation paths and their oracle/state bindings. Do not simplify either check to a single-asset comparison unless a separate governed change explicitly changes the economic contract.

The existing `B1PrizePoolDatum` Aiken type declaration in the Reveal parity harness is only a schema declaration; it is not evidence of a working Pool validator. Haskell's `solvencyInvariant` delegates into the universal economic state/kernel, so a port must reproduce that exact calculation or establish differential equivalence using canonical fixtures. A superficial `TicketClaimed`-only validator would omit the global guards and other state transitions required by the deployed Pool contract.

## Progress recorded on 2026-10-23

- [x] Added `poc/aiken-reveal-parity/lib/immortal/b1_pool_types.ak` as an isolated accounting migration slice with three tests: exact transition accepted, reserve mutation rejected, and payout exceeding pending liability rejected.
- [x] Added `.github/workflows/aiken-b1-pool-slice.yml`, pinned to Aiken `v1.1.22`, running `aiken check` and `aiken build`.
- [x] GitHub Actions run [#1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39897916470) on commit `78a3747277f7dd2a9e9aedd3dab8d8baafe9d3a2` succeeded. The harness tests/type-checking and isolated V3 prototype build both passed.
- [x] Removed the duplicate Aiken `B1PrizePoolDatum` declaration from `b1_pool_types.ak`; it now imports the canonical harness schema from `immortal/reveal_types`.
- [x] GitHub Actions run [#2](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39898385512) on commit `b69507765199c50d7cea2a73f42e3bff95f14eb1` succeeded after that schema-reuse refactor.
- [x] Tightened `pool_claim_transition_is_valid` in [`claim_transaction.ak`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/poc/aiken-reveal-parity/lib/immortal/claim_transaction.ak): payout must be positive and no greater than the old pending liabilities; accounting transition checks liquidity and liabilities deltas; reserve, unresolved ticket count, locked jackpot, jackpot threshold, suspended classes, and prize hash must remain invariant as specified by the slice.
- [x] GitHub Actions run [#3](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899115433) on commit `c1cf860c6587e74181a793b9188c0be605393b9b` succeeded. Job `aiken-check` completed successfully, including isolated harness tests/type checking and the isolated V3 prototype build.
- [ ] The new slice is still not a deployable validator and does not by itself implement the transaction-context Claim checks, authenticated oracle valuation, pool authority NFT checks, or universal solvency invariant. Run #3 is compile/harness evidence only, not on-ledger parity or deployment evidence.
- [x] Added focused negative unit tests in `b1_pool_types.ak` for zero payout and mutations of locked jackpot, jackpot threshold, and suspended classes (commit `8449da9a7be12f7f34e6c1c8679093172c00195f`). These tests are committed; their own post-change Aiken workflow result has not yet been verified, so they are not counted as passing evidence yet.

## Required implementation sequence

- [ ] Establish exact Haskell/Aiken Data encoding compatibility for `B1PrizePoolDatum`, `B1PrizePoolAction`, and all nested types.
- [ ] Port or reuse the governed, chain-neutral solvency invariant without introducing new coefficients, thresholds, or fallback behavior.
- [ ] Implement a deployable B1PrizePool Aiken validator with compatible parameters, datum, redeemers, and script purpose; do not treat the Reveal parity harness as deployable without an explicit architecture change.
- [ ] Add differential fixtures for valid and invalid `TicketClaimed` transactions.
- [ ] Negative tests: missing/duplicate Prize input or output, wrong status, changed ticket identity, altered payout, absent owner signature, NFT not held by the signing owner, wrong owner payment, wrong pool value delta, duplicate/missing pool token, multiple pool inputs/outputs, wrong accounting fields, insolvent post-state.
- [x] Add targeted negative tests for the newly added slice guards: zero payout, payout above pending liabilities, and mutations of locked jackpot, jackpot threshold, and suspended classes. The new tests were committed in `8449da9a7be12f7f34e6c1c8679093172c00195f`; see CI status note below.
- [ ] Positive test: valid revealed ticket, exact payout, valid owner signature, canonical oracle valuation, exact Pool accounting transition, solvent post-state.
- [ ] Run the compiled Aiken Pool validator on the local ledger with the Aiken Prize validator and compare accepted/rejected outcomes to the existing Haskell implementation on identical fixtures.
- [ ] Bind the generated Aiken artifact and its hash into the integration workflow; only then make the Aiken Pool path active.
- [ ] Keep the Haskell diagnostic opt-in until differential parity is demonstrated. Remove the Haskell runtime dependency only after every active consumer is migrated and CI proves the replacement.

## Gate / acceptance criteria

**Not GREEN** until all of the following are evidenced: buildable deployable Aiken Pool validator; encoding compatibility; positive and negative ledger twins; parity against Haskell on the same fixtures; workflow uses the fresh Aiken artifact; no stale Plutus JSON fallback; V3 carrier unchanged and still independently passing.

This checkpoint records the current migration boundary and acceptance criteria. It does not claim implementation, parity, or deployment.
