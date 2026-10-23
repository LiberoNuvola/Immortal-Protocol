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
- [x] Extended the generated differential test to construct `reveal_types.PrizeDatum` with typed Aiken fields and typed nested `BeaconTarget`, `PrizeStatus`, and `BeaconStatus`. [Aiken Reveal Parity run #39927478518](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39927478518) completed successfully on commit `0cc842f1412a3c980f176676961db88afa1bd334`; the `pending_prize_datum_serialisation_matches_haskell_fixture` test is reported PASS and `PARITY_EVIDENCE_GATE=success`. Important qualification: the same run explicitly reports an exact source/config/workflow cache hit and says PASS reflects previously validated artifacts, not fresh compiler execution in that run. Treat this as test evidence with cache provenance, not as a clean uncached compiler reproduction. Artifact SHA-256: `f583e285eb1e94f588e9557d415ce07d6ebcdaa3ee5b99cf4dcbaf6124422640` (artifact [12491088324](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39927478518/artifacts/12491088324)). The Plutus V2 probe fails specifically because Aiken `v1.1.22` rejects `plutus = "v2"` with `Aiken only supports Plutus V3`; this is a compiler-target limitation, not evidence that the Reveal source itself failed under V2. The probe should be interpreted as confirmation that this Aiken compiler cannot emit a Plutus V2 script. The production Haskell Prize validator remains V2, so any migration must explicitly target a supported V3 ledger/script path and prove deployment compatibility; do not treat the probe as parity or deployment evidence.
- [x] Added typed Aiken serialization comparisons for `reveal_types.BeaconTarget` and all eight fields of `reveal_types.B1PrizePoolDatum`, using the canonical Haskell-generated Plutus Data fixtures rather than hand-built `constr_data`. Both tests passed in [Aiken Reveal Parity run #39926041085](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39926041085) on commit `e5561c33cbf4cefb359a5254f46834d729fe7974`; the full workflow completed with `PARITY_EVIDENCE_GATE=success`. Artifact digest: `31301243859e9e0763deb479c6897e19f18c4e4bb789b4e543b9e2aad457f36d` (artifact [12490245607](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39926041085/artifacts/12490245607)). The run also records the isolated Plutus V2 compile probe as failed; the canonical harness remains Plutus V3, so version compatibility is still open. This evidence closes typed serialization checks for these two types only—not nested-type coverage, deployable Pool implementation, transaction-context parity, full transaction-size feasibility, or ledger equivalence.
- [ ] The new slice is still not a deployable validator and does not by itself implement the transaction-context Claim checks, authenticated oracle valuation, pool authority NFT checks, or universal solvency invariant. Passing unit/harness CI is not on-ledger parity or deployment evidence.
- [x] Added focused negative unit tests in `b1_pool_types.ak` for zero payout and mutations of locked jackpot, jackpot threshold, and suspended classes (commit `8449da9a7be12f7f34e6c1c8679093172c00195f`); Aiken B1 PrizePool Claim Slice run [#39899937537](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899937537) and Reveal Parity run [#39899937575](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899937575) succeeded.


- [x] Extended the canonical Haskell fixture producer in `plutus/test/RevealSchemaFixtures.hs` to emit Plutus Data encodings for all five `B1PrizePoolAction` constructors: `FundTreasury`, `TicketIssued 100`, `TicketRevealed 100`, `TicketClaimed 250`, and `TicketExpired`.
- [x] Extended `scripts/generate-aiken-schema-fixture-tests.mjs` to require those Haskell-produced fixtures and generate Aiken `serialise_data` differential tests for constructor tags and payloads; updated `.github/workflows/aiken-reveal-parity.yml` to fail closed if any action fixture is missing or malformed.
- [x] B1 action serialization differential tests passed on source commit `9a598e7d944974c1b1314e629a4caf4dccb4d860`: [Aiken Reveal Parity run #39917959260](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39917959260) completed successfully. The job generated canonical Haskell Plutus Data fixtures, generated Aiken tests from them, executed Haskell-to-Aiken serialization parity tests, compiled the package, and enforced the fail-closed evidence gate.
- [x] Follow-up hardening: declared `B1PrizePoolAction` in the shared Aiken schema and changed the generated differential tests to serialize its typed constructors rather than manually assembled `constr_data` values. Run [#39921802861](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39921802861) on `a21ec71aae7fb9893ecf1efe4c5fc1348f06f7c2` failed closed at transition-test generation because the schema generator introduced a partial `reveal_types` import combination; the five typed action tests themselves appeared in the Aiken output and passed, but the full job was not a pass. Commit `caeb70aa66e7728c71a40c8f6f134e9342aa0280` fixed constructor qualification, and run [#39922924213](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39922924213) confirmed all five typed action serialization tests pass, but the transition generator still rejected a valid partial-import state. Commit `55cedc077af8d8e6471ed22782af842e33dd4b8c` changed `scripts/generate-aiken-reveal-transition-tests.mjs` to add each missing import independently. The full workflow then passed on that exact source commit: [Aiken Reveal Parity run #39923646543](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39923646543), conclusion `success`; generated Haskell fixtures, generated Aiken tests, serialization parity, Aiken checks/build/size checks, and `PARITY_EVIDENCE_GATE=success` all passed. Artifact digest: `9788ae1ab7d1fc4782de66b5ddad7169ac6a49c8034bfdd24d347627581b73bf` (artifact [12488577951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39923646543/artifacts/12488577951)). This closes the typed action serialization + transition-test generation workflow blocker only; it does not prove complete datum/nested-type compatibility, a deployable Pool validator, transaction-context parity, or on-ledger equivalence.

- [x] Investigated the V2 probe failure in run #39927478518: Aiken `v1.1.22` rejects the project config `plutus = "v2"` with `Aiken only supports Plutus V3`. This is a compiler target limitation, not a failed test of Reveal semantics. Keep the canonical harness on V3; migration to a V3 deployment path still requires explicit ledger/network compatibility evidence and does not establish Haskell/Aiken parity.

- [x] Extended the canonical Haskell fixture producer and generated Aiken tests for all five enum constructors: `PrizeStatus.Pending`, `PrizeStatus.Revealed`, `PrizeStatus.Claimed`, `BeaconStatus.BeaconPending`, and `BeaconStatus.BeaconReady`. The full uncached workflow [Aiken Reveal Parity #39929348049](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39929348049) completed successfully on source commit `3a95f44d8367d2372ce6d08dfe1960a94c7fd17d`: `CACHE_HIT=false`, Haskell fixture generation, generated Aiken fixture tests, Aiken check/build, size checks and `PARITY_EVIDENCE_GATE=success`. Artifact SHA-256: `cbb98f6fe95372d747de083ce379e989165a9a42f3b49a7b981262d6c1d08f24` (artifact [12491531238](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39929348049/artifacts/12491531238)). This proves serialization of these enum constructors against the generated Haskell fixtures within the isolated harness only; it does not prove full nested-schema coverage, deployable Pool validator parity, actual transaction-size compliance, or on-ledger equivalence. The same run's V2 compatibility probe remains a compiler-target limitation (`Aiken only supports Plutus V3`).

- [x] Extended the schema-fixture generator to serialize the four `PrizeAction` cases using typed Aiken constructors (`SyncBeacon`, `Reveal(ByteArray)`, `Claim`, `Expire`) instead of manually assembled `constr_data`. The uncached [Aiken Reveal Parity run #39932262306](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39932262306) passed on commit `b2b736697adbfc942f4edfb4bf3335d9661ea2dc`: `CACHE_HIT=false`, all four B1 pool-action typed serialization tests passed, and `PARITY_EVIDENCE_GATE=success`. This improves constructor-level schema evidence only; it does not establish deployable Pool validator parity or on-ledger equivalence.
- [x] Follow-up uncached enum coverage: [Aiken Reveal Parity run #39929348049](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39929348049) passed with `CACHE_HIT=false` and checked the three `PrizeStatus` and two `BeaconStatus` constructors against canonical Haskell fixtures. Artifact digest: `cbb98f6fe95372d747de083ce379e989165a9a42f3b49a7b981262d6c1d08f24` (artifact [12491531238](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39929348049/artifacts/12491531238)).

## Required implementation sequence

- [ ] Establish exact Haskell/Aiken Data encoding compatibility for `B1PrizePoolDatum`, `B1PrizePoolAction`, and all nested types.
- [ ] Port or reuse the governed, chain-neutral solvency invariant without introducing new coefficients, thresholds, or fallback behavior.
- [ ] Implement a deployable B1PrizePool Aiken validator with compatible parameters, datum, redeemers, and script purpose; do not treat the Reveal parity harness as deployable without an explicit architecture change.
- [ ] Add differential fixtures for valid and invalid `TicketClaimed` transactions.
- [ ] Negative tests: missing/duplicate Prize input or output, wrong status, changed ticket identity, altered payout, absent owner signature, NFT not held by the signing owner, wrong owner payment, wrong pool value delta, duplicate/missing pool token, multiple pool inputs/outputs, wrong accounting fields, insolvent post-state.
- [x] Added targeted negative tests for zero payout, payout above pending liabilities, and mutations of locked jackpot, jackpot threshold, and suspended classes. Commit `8449da9a7be12f7f34e6c1c8679093172c00195f`; [Aiken B1 PrizePool Claim Slice run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899937537) and [Aiken Reveal Parity run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39899937575) succeeded on that commit.
- [x] Added further negative tests for changed unresolved-ticket count, changed prize hash, and incorrect liquidity delta in commit `4b61994724cf5201f64d47e50bbb9e6ff540a5e5`. All four post-change workflows succeeded on that exact commit: [Aiken B1 PrizePool Claim Slice #39901679341](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39901679341), [Aiken Reveal Parity #39901679365](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39901679365), [IMMORTAL Portability Conformance #39901679368](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39901679368), and [Documentation Link Check #39901679332](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39901679332).
- [x] Verified the canonical Haskell kernel defines `liabilityClaimDelta claimedAmount = negate (max 0 claimedAmount)`, so the slice's `pending_liabilities - payout` arithmetic matches this particular delta for positive payouts. This does not prove full validator parity.
- [ ] Positive test: valid revealed ticket, exact payout, valid owner signature, canonical oracle valuation, exact Pool accounting transition, solvent post-state.
- [ ] Run the compiled Aiken Pool validator on the local ledger with the Aiken Prize validator and compare accepted/rejected outcomes to the existing Haskell implementation on identical fixtures.
- [ ] Bind the generated Aiken artifact and its hash into the integration workflow; only then make the Aiken Pool path active.
- [ ] Keep the Haskell diagnostic opt-in until differential parity is demonstrated. Remove the Haskell runtime dependency only after every active consumer is migrated and CI proves the replacement.

## Gate / acceptance criteria

**Not GREEN** until all of the following are evidenced: buildable deployable Aiken Pool validator; encoding compatibility; positive and negative ledger twins; parity against Haskell on the same fixtures; workflow uses the fresh Aiken artifact; no stale Plutus JSON fallback; V3 carrier unchanged and still independently passing.

This checkpoint records the current migration boundary and acceptance criteria. It does not claim implementation, parity, or deployment.


## Audit follow-up — 2026-10-23

### Source-level confirmation

The current branch was re-read at `work/immortal-green-closure` before this note was added. The Aiken harness remains configured with `plutus = "v3"` and Aiken `v1.1.22`; its README explicitly describes it as an isolated parity prototype, not a deployable validator.

The existing Haskell `plutus/B1PrizePool.hs` Claim branch has mandatory global guards before dispatching on the action:
- pre-state `solvencyInvariant`;
- singleton pool authority NFT conserved as exactly one unit across inputs and outputs, including the own Pool input/output;
- exactly one input from the Pool script.

Its `TicketClaimed` branch additionally verifies the prize input/output, owner signature, oracle-valued claimant payout, physical Pool value delta using `Economic.poolUsdmValue`, immutable Pool fields, accounting deltas, and post-state solvency.

The Aiken `claim_transaction.ak` function is explicitly a Prize-validator transaction-context predicate. Its `pool_claim_transition_is_valid` helper checks only a subset of the Pool datum/accounting transition and explicitly defers the authority NFT, physical Pool value delta, and complete Pool validator responsibilities. It must not be treated as the Pool validator or as proof that the complete Claim path is all-Aiken.

### Implementation boundary

Do not solve this gap by adding a Claim-only replacement for `B1PrizePool.hs`, by weakening the existing Haskell checks, or by changing the passing V3 carrier. The next implementation unit is a complete, separately identifiable Aiken B1 PrizePool validator candidate that preserves every action branch (`FundTreasury`, `TicketIssued`, `TicketRevealed`, `TicketClaimed`, `TicketExpired`) and the global guards, then receives differential tests against the Haskell reference and real ledger/context validation.

The current Aiken package targets Plutus V3 while the production Haskell Pool validator targets Plutus V2. Deployment compatibility and the paired Prize/Pool script-hash topology remain explicit gates; typed serialization and isolated unit tests do not close them.

### Status after this audit

- Typed schema/action serialization: previously passing CI evidence remains valid for the tested schemas/actions only.
- Aiken Claim context predicate: prototype; not production/deployment evidence.
- Complete Aiken B1 PrizePool validator: **NOT IMPLEMENTED / NOT GREEN**.
- V2-to-V3 ledger compatibility, paired validator topology, differential transaction outcomes, and transaction-size feasibility: **OPEN**.


## Follow-up implementation — isolated B1 solvency slice (2026-10-23)

- Added `poc/aiken-reveal-parity/lib/immortal/b1_pool_solvency.ak` at commit `0bbcfb7a6117fa6319ec6dce9f346b185c4c80c0`.
- The function `b1_pool_solvency_is_valid` ports the existing legacy B1 projection into the universal solvency equation: protected capital = pending liabilities + (500 × unresolved reserve) + locked jackpot. It also checks non-negative liquidity, liabilities, unresolved reserve/count, and locked jackpot, matching the current `B1LegacyAdapter.legacyB1ToUniversalEconomicState` and `UniversalEconomicKernel.solvencyInvariant` projection.
- Six Aiken unit tests cover the exact solvency boundary, one sub-unit insolvency, negative liabilities, negative unresolved count, protected locked jackpot, and negative reserve.
- This is deliberately a pure, isolated parity slice. It is not yet wired into an on-chain Pool validator and does not prove transaction-context, authority-NFT, oracle valuation, paired-validator, or ledger parity.
- CI triggered on commit `0bbcfb7a6117fa6319ec6dce9f346b185c4c80c0`: [Aiken B1 PrizePool Claim Slice #39936351139](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39936351139) and [Aiken Reveal Parity #39936351134](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39936351134). Initial observation: both runs were pending/in progress; do not mark this addition PASS until the run results are checked.


### CI result for the solvency slice

- [Aiken B1 PrizePool Claim Slice run #39936351139](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39936351139) completed **SUCCESS** on the exact source commit `0bbcfb7a6117fa6319ec6dce9f346b185c4c80c0`. Both `aiken check` and `aiken build` steps passed with pinned Aiken `v1.1.22`.
- [Aiken Reveal Parity run #39936351134](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39936351134) was still in progress at the time of this update; it is not included in the PASS claim above.
- This closes only the compilation/unit-test gate for the isolated solvency slice. It does not close the complete Pool validator or deployment gates.


### CI follow-up — Reveal parity result confirmed (2026-10-23)

- [Aiken Reveal Parity run #39936351134](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39936351134) has now completed with conclusion **SUCCESS** on exact source commit `0bbcfb7a6117fa6319ec6dce9f346b185c4c80c0` (workflow run #191, push event, branch `work/immortal-green-closure`).
- Combined with [Aiken B1 PrizePool Claim Slice #39936351139](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39936351139), both workflows triggered by the solvency-slice commit are now confirmed successful.
- Evidence scope remains limited: the workflows prove isolated Aiken package checking/building and the tests/serialization gates encoded in each workflow. They do **not** prove a complete deployable Pool validator, Haskell/Aiken transaction acceptance parity, or ledger deployment.
- The Haskell reference remains the normative behavioral inventory. Any complete Aiken candidate must preserve all five action branches and the three global guards before comparing branch-level outcomes. Do not wire the pure solvency helper into a deployable path until its arithmetic and datum decoding are exercised in the full candidate with differential fixtures.
- Status remains **NOT GREEN**. Next gate: create a complete candidate only after the implementation maps every helper and branch in `plutus/B1PrizePool.hs` to the Aiken transaction context, with explicit V2→V3 and paired-validator deployment decisions; no production path switch and no changes to the passing V3 carrier.


## Implementation inventory — branch-by-branch Pool contract (2026-10-23)

This inventory was checked against `plutus/B1PrizePool.hs` at the current `work/immortal-green-closure` branch head. It is a requirements map for a future complete Aiken candidate, not an implementation claim.

### Global preconditions, before action dispatch

Every action must preserve all three existing global guards:

1. `solvencyInvariant datum` on the pre-state, using `B1LegacyAdapter` and the governed PRE-RICH profile.
2. `singletonPoolTokenValid`: the configured pool authority NFT totals exactly one unit across all inputs and all outputs, and exactly one unit is present in the own Pool input and continuing Pool output.
3. `countOwnInputs ctx == 1`: exactly one input spends the Pool script.

The continuing Pool output must resolve to exactly one decodable datum of the expected schema. This is a shared structural dependency, not an optional branch-specific check.

### Action matrix

| Action | Existing Haskell requirements that must survive the port |
| --- | --- |
| `FundTreasury` | Recompute the continuing Pool value through the existing authenticated oracle/value path; datum liquidity equals recomputed value and strictly increases; liabilities, reserve, unresolved count, locked jackpot, jackpot threshold, suspended classes, and prize hash are unchanged; post-state solvency holds. |
| `TicketIssued(price)` | Price is positive; exactly one decodable Prize output; status Pending and prize amount zero; ticket policy/name nonempty; matching Ticket NFT is minted in this transaction; datum price equals redeemer; liquidity/liabilities/locked jackpot/threshold/suspended classes/prize hash unchanged; unresolved count increases by one; reserve increases by the governed issue delta; post-state solvency holds. |
| `TicketRevealed(price)` | Positive unresolved count; exactly one Prize input and output; input is Pending; ticket identity and price are preserved; output status is Revealed; payout is nonnegative and no greater than the existing effective-pool calculation; Pool liquidity and protected fields remain unchanged; unresolved count decreases by one; reserve changes by the governed reveal delta; pending liabilities change by the governed reveal delta; post-state solvency holds. |
| `TicketClaimed(amount)` | Amount positive and no greater than pre-state pending liabilities; exactly one Prize input and output; input Revealed and output Claimed; ticket identity and prize amount are immutable; owner is derived from the ticket NFT input and signs; owner output has exactly the required oracle-valued USDM amount under the current equality check; physical Pool oracle-valued amount decreases by exactly the claim amount; reserve/count/locked jackpot/threshold/suspended classes/prize hash unchanged; liquidity decreases by amount; liabilities follow `liabilityClaimDelta`; post-state solvency holds. |
| `TicketExpired` | Positive unresolved count; exactly one decodable Prize input; transaction lower bound is at/after expiry; Prize datum binds to this Pool script; ticket is Pending with zero payout and positive price; liquidity/locked jackpot/threshold/suspended classes/prize hash unchanged; unresolved count decreases by one; reserve follows the governed expiry delta and remains nonnegative; liabilities unchanged; post-state solvency holds. |

### Helper-level dependencies to map explicitly

- Datum and action constructor/field order must remain compatible with the canonical Haskell Plutus Data fixtures.
- `findSingleContinuingDatum`, Prize input/output uniqueness, and the Pool script identity must be reproduced; merely matching datum arithmetic is insufficient.
- `Economic.totalUsdmValue` for claimant settlement and `Economic.poolUsdmValue` for the Pool delta are distinct normative calculations. Do not replace either with an assumed direct USDM balance or merge the two meanings.
- The Pool validator currently uses `PlutusLedgerApi.V2`; the isolated Aiken harness uses Plutus V3. Script-version and paired Prize/Pool hash topology are separate gates and must not be inferred from successful Aiken unit tests.
- Keep the existing Haskell validator as the behavioral reference until valid and invalid transaction twins have been run against both implementations on the same context/ledger fixtures.

### Gate status

- [x] Branch-level requirements inventoried from the Haskell reference.
- [ ] Full Aiken validator implements all five branches and global guards.
- [ ] Differential positive/negative transaction fixtures for all branches.
- [ ] Actual ledger/context acceptance parity and transaction-size feasibility.
- [ ] Explicitly governed V2-to-V3 and paired-validator deployment path.

Overall migration remains **NOT GREEN**. The inventory is deliberately documentation-only; it does not activate or replace any production validator.


## Composed Claim accounting + solvency slice (2026-10-23)

- Updated `poc/aiken-reveal-parity/lib/immortal/b1_pool_types.ak` at commit `e8a3ccd5d7768310befede651927414d040e678a`.
- Added `pool_claim_transition_with_solvency_is_valid`, a pure harness predicate that composes the existing Claim accounting transition with `b1_pool_solvency_is_valid` on both the pre- and post-datum.
- Added a positive test for an accounting-correct transition with solvent pre/post states and a negative test for an insolvent pre-state. This deliberately does not pretend a valid claim transition can turn a solvent state insolvent when liquidity and liabilities both decrease by the same amount.
- The helper remains isolated: no transaction context, authority NFT, ticket owner/signature, oracle valuation, physical Pool value delta, or on-chain validator has been added.
- Workflows triggered on exact commit `e8a3ccd5d7768310befede651927414d040e678a` were observed in progress at checkpoint time: [Aiken Reveal Parity](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39938987311), [Aiken B1 PrizePool Claim Slice](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39938987315), and [Documentation Link Check](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39938987422). Do not count this new composition as passing until the runs complete successfully.
- The branch-by-branch Haskell contract inventory is recorded above. The complete deployable Aiken Pool validator and all ledger/deployment parity gates remain **NOT GREEN**.

## CI follow-up — composed Claim accounting + solvency slice (2026-10-23)

The three workflows triggered by commit `e8a3ccd5d7768310befede651927414d040e678a` have now completed successfully:

- [Aiken Reveal Parity #39938987311](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39938987311): **SUCCESS**, exact head SHA `e8a3ccd5d7768310befede651927414d040e678a`.
- [Aiken B1 PrizePool Claim Slice #39938987315](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39938987315): **SUCCESS**.
- [Documentation Link Check #39938987422](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39938987422): **SUCCESS**.

This confirms the isolated composition and its workflow checks pass. Scope remains unchanged: no complete deployable Aiken B1PrizePool validator, no transaction-context/authority-NFT/oracle-value proof, no differential ledger twins, and no V2-to-V3 deployment decision. Overall migration status remains **NOT GREEN**. Do not change the passing V3 carrier or switch the production Pool path based on these results alone.

## CI follow-up — isolated accounting predicates for all B1 actions (2026-10-23)

Commit `9df672353b4e6e8dafd0aa6308eaef44f59b166c` adds pure datum-accounting predicates and focused tests for the four actions not covered by the existing Claim accounting slice:

- `FundTreasury`: liquidity increases; all other Pool datum accounting fields remain unchanged; pre/post projected solvency holds.
- `TicketIssued(price)`: positive price; reserve increases by exactly price; unresolved ticket count increases by one; other protected/accounting fields remain unchanged; pre/post solvency holds.
- `TicketRevealed(price)`: positive price, nonnegative payout, reserve decreases by price, unresolved count decreases by one, liabilities increase by payout, other protected fields remain unchanged; pre/post solvency holds.
- `TicketExpired`: positive price and unresolved count; reserve decreases by price and cannot underflow; unresolved count decreases by one; liabilities and other protected fields remain unchanged; pre/post solvency holds.

These are pure harness predicates only. They do not validate the transaction context, continuing datum uniqueness, Prize input/output uniqueness or status, NFT mint/authority, signatures, expiry bounds, oracle valuation, or the physical Pool value delta. They are not a deployable validator and must not be used to switch the production path.

### CI evidence on exact commit `9df672353b4e6e8dafd0aa6308eaef44f59b166c`

- [Aiken B1 PrizePool Claim Slice #39939965687](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39939965687): **SUCCESS**. Job `aiken-check`; pinned Aiken installation, isolated harness tests/type checking, and isolated V3 prototype build all passed.
- [Aiken Reveal Parity #39939965671](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39939965671): **SUCCESS**. Canonical Haskell fixture generation, generated Aiken tests, serialization parity, Aiken check/build/size steps, and parity evidence gate passed.
- [IMMORTAL Portability Conformance #39939965583](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39939965583): **SUCCESS**.
- [Cardano Adapter Sale Conformance #39939965578](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39939965578): **SUCCESS**.
- [Protocol Declaration Conformance #39939965574](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39939965574): **SUCCESS**.
- [Documentation Link Check #39939965618](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39939965618): **SUCCESS**.
- [Algorithmic Governability Adversarial Lab #39939965666](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39939965666): **SUCCESS**.
- [IMMORTAL Cardano Integration Lab #39939965624](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39939965624): was still **IN PROGRESS** at checkpoint update time; no result claimed.

Overall status remains **NOT GREEN**. The five action branches are now represented by pure accounting slices in the harness, but the full Aiken Pool validator, authenticated transaction-context checks, complete branch-level differential ledger fixtures, V2-to-V3 deployment compatibility, paired-validator topology, and actual integration-ledger evidence remain open. The already-passing V3 carrier and the Haskell reference were not changed.

## CI follow-up — negative accounting tests and integration lab (2026-10-23)

Commit `c30057d276b4f6ce3e47c04a701a19f6ba8da33f` adds seven negative tests to the pure accounting harness predicates in `poc/aiken-reveal-parity/lib/immortal/b1_pool_types.ak`. The change does not modify the Haskell reference validator or the already-passing V3 carrier.

All eight workflows triggered on this exact commit have now completed successfully:

- [Aiken B1 PrizePool Claim Slice #39941199103](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39941199103): **SUCCESS** — isolated harness tests/type-check and isolated V3 prototype build.
- [Aiken Reveal Parity #39941199219](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39941199219): **SUCCESS** — canonical Haskell fixture generation, serialization parity, build/size checks, and parity evidence gate.
- [IMMORTAL Cardano Integration Lab #39941199271](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39941199271): **SUCCESS** — the workflow's full job completed, including Yaci/native-ledger smoke checks and active traces for Reveal, FundTreasury with canonical oracle valuation, TicketIssued at the 500x solvency boundary, Expire, and Prize + Haskell B1PrizePool Claim; P2.8 ledger evidence gate and predeploy structural gate also passed.
- [Cardano Adapter Sale Conformance #39941199241](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39941199241): **SUCCESS**.
- [Protocol Declaration Conformance #39941199200](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39941199200): **SUCCESS**.
- [IMMORTAL Portability Conformance #39941199162](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39941199162): **SUCCESS**.
- [Algorithmic Governability Adversarial Lab #39941199154](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39941199154): **SUCCESS**.
- [Documentation Link Check #39941199134](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39941199134): **SUCCESS**.

Interpretation is deliberately scoped: these results validate the current CI and integration-lab scenarios. They do **not** establish that the isolated Aiken harness is a complete deployable B1 Pool validator, nor that it has full transaction-context parity with the Haskell validator across all five actions. The complete validator must still reproduce global guards, authority-NFT and Prize topology, signatures, expiry bounds, canonical physical-value/oracle deltas, and all branch-specific datum invariants. Differential positive/negative ledger twins, transaction-size feasibility, and the governed Plutus V2-to-V3 / paired-validator deployment path remain open.

Overall migration status remains **NOT GREEN**. Do not switch the production Pool path, change the Haskell reference, or modify the passing V3 carrier based on these workflow results alone.

## Next executable gate — transaction-context boundary (2026-10-23)

The follow-up inspection of the integration workflow and its exact run logs confirms an important scope boundary:

- The passing active Reveal, FundTreasury, TicketIssued, and Expire traces exercise the isolated Aiken V3 candidate path in the local Yaci lab.
- The step named **“Execute Aiken Prize + Haskell B1PrizePool Claim trace”** explicitly uses the Haskell B1PrizePool validator for the Pool leg. It is not evidence that an Aiken B1 Pool validator has executed Claim.
- The wrong-secret Reveal twin was submitted to Yaci and rejected by validator execution; the log records that original inputs were preserved. This is useful negative evidence for the isolated Aiken PrizeValidator + Haskell Pool composition, not full Pool migration parity.
- The reference-script publication probe's signed publication transaction is measured separately from the complete Reveal spending transaction. The publication pass must not be used to close the full production transaction-size or V2-to-V3 gates.

### Required implementation sequence

1. **Pool global context guard:** implement and test the canonical B1 Pool transaction-context checks against the typed Aiken transaction model: exactly one own Pool input, exactly one continuing Pool output with a decodable datum, and the Pool authority NFT singleton present exactly once in both transaction inputs and outputs and in the own Pool input/output. Keep the Haskell reference as the normative oracle for the behavior.
2. **Bind action accounting to authenticated context:** connect the existing pure five-action datum predicates to the authenticated pre/post datum and transaction context. Do not treat pure accounting predicates as validators.
3. **Add action-specific context guards:** reproduce Prize input/output uniqueness and datum identity, ticket mint/name matching for Issue, owner signature and canonical oracle-valued settlement for Claim, payout/effective-pool and status checks for Reveal, and lower-bound expiry finality for Expire. FundTreasury must use the existing canonical oracle/value recomputation, not a direct-balance assumption.
4. **Differential ledger twins:** for each action, run positive and adversarial negative transactions against the Aiken candidate and canonical Haskell reference using equivalent fixtures; record acceptance/rejection, context, script version, transaction bytes, ExUnits, and evidence hashes.
5. **Deployment gates remain independent:** prove full transaction-size feasibility and explicitly govern the Plutus V2-to-V3 and paired Prize/Pool validator/hash topology before any production-path switch.

Do not modify the already-passing V3 carrier, change economic semantics, or claim migration GREEN from the current integration-lab pass. The first implementation target is the global transaction-context guard, followed by wiring the action branches to it; the current isolated harness is not yet that validator.


## Implementation update — global Pool context guard slice (2026-10-23 19:15 UTC)

- [x] Hardened `poc/aiken-reveal-parity/lib/immortal/b1_pool_context.ak` in commit [`97809d19`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/97809d19ba11589c82fc2c7d2e414a695d82b24b): `pool_global_context_is_valid` now decodes the datum from the actual Pool input and requires it to equal the supplied pre-state datum before checking the continuing Pool output.
- [x] Added seven typed-transaction context tests: valid context; missing continuing output; duplicate Pool input; missing input datum; mismatched supplied pre-state; duplicate authority NFT outside the Pool output; authority NFT not preserved in the Pool output.
- [x] Aiken B1 PrizePool Claim Slice run [#13](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40009884509) on exact commit `97809d19ba11589c82fc2c7d2e414a695d82b24b` completed **SUCCESS**: `aiken check` and `aiken build` passed.
- [ ] Aiken Reveal Parity run [#197](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40009884366) and Integration Lab [#2088](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40009884371) were still running when this entry was written; record their final outcomes separately before treating them as evidence.
- [ ] This remains a tested **context-guard module**, not a deployable `B1PrizePool` validator. The guard is not yet wired into all five action branches, and the tests are synthetic typed-transaction fixtures rather than Yaci/native-ledger transaction twins. Do not declare the migration GREEN, switch the production Pool path, modify the Haskell reference, or touch the passing V3 carrier.


## Action-context binding review — 2026-10-23

Review of the normative branches in `plutus/B1PrizePool.hs` confirms that composing the global guard with the current pure accounting predicates is necessary but not sufficient. Before any candidate dispatcher can be treated as a validator, each branch must bind its amounts and post-state to authenticated transaction context:

| Action | Existing accounting predicate | Context that must be bound before acceptance |
|---|---|---|
| `FundTreasury` | liquidity increase + invariant fields + solvency | Recomputed canonical oracle-valued physical Pool output; it must equal post-datum liquidity. |
| `TicketIssued(priceUsdm)` | reserve/count deltas + solvency | Exactly one decodable Prize input at configured Prize hash; Pending, zero prize amount, valid ticket identity; `pdPriceUsdm == priceUsdm`; matching Ticket NFT mint in the same transaction. |
| `TicketRevealed(priceUsdm)` | reserve/liability/count deltas + solvency | Unique Prize input and output; Pending-to-Revealed status; immutable ticket identity; input/output price binding; payout derived from output Prize datum and bounded by pre-state effective pool. |
| `TicketClaimed(claimedAmount)` | liquidity/liability deltas + invariant fields + solvency | Unique Prize input/output; Revealed-to-Claimed status; unchanged ticket identity and payout; owner derived from the input holding exactly one ticket NFT and owner signature; canonical oracle-valued owner payment; canonical `Economic.poolUsdmValue` input/output delta exactly equal to claim amount. |
| `TicketExpired` | reserve/count release + solvency | Unique Prize input; transaction at/after `pdExpiresAt`; Prize datum bound to this Pool script hash; Pending status and zero payout; reserve release derived from Prize price. |

**Important:** the existing `price_usdm` and payout arguments used by any shared test helper are not authoritative merely because they are passed into a function. For `TicketRevealed`, payout comes from the continuing Prize datum; for `TicketExpired`, reserve release comes from the consumed Prize datum; for `TicketClaimed`, the owner and payout settlement are transaction-derived and oracle-valued. These bindings must be implemented in the candidate and tested against the Haskell reference, not replaced with caller-supplied values or raw token-balance comparisons.

Next safe coding gate: introduce action-specific Prize-context resolvers and positive/negative typed transaction fixtures, then compose each resolver with its existing accounting predicate. Do not add a production Pool validator entry point or claim full context parity until the five branches are wired and the candidate compiles. Production topology, Plutus V2/V3 compatibility, ledger twins, and full transaction-size feasibility remain independent open gates.


## Prize context resolver module added — 2026-10-23 19:18 UTC

- Added `poc/aiken-reveal-parity/lib/immortal/b1_pool_prize_context.ak` in commit [`7144de55`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/7144de55a181354083c31efd11281a2b14f6378a).
- The module resolves exactly one input/output at a configured Prize script hash, decodes inline or witness datums fail-closed, and can verify that the resolved consumed datum equals the datum supplied to the spending validator.
- This is a reusable helper only. It does not yet validate action-specific Prize status transitions, ticket NFT mint/burn, expiry, signatures, canonical oracle valuation, payout settlement, or the B1 Pool physical-value delta. It is not wired into the Pool validator (no deployable Aiken B1 Pool entrypoint exists yet).
- **Verification status:** commit exists on `work/immortal-green-closure`; an Actions run for this exact commit was not visible at checkpoint update time. Do not mark the module compiled until the Aiken check/build workflow reports success.
- Next: confirm Aiken compilation, then add tests for missing/duplicate Prize inputs and outputs, missing/unresolvable datums, and mismatched own datum; only then wire the resolver into the five action-specific transaction predicates.


## Prize resolver regression tests added — 2026-10-23 19:19 UTC

- Added five typed-transaction tests to `b1_pool_prize_context.ak` in commit [`cd42fcd5`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/cd42fcd5dcc52a801051768b175e5c23bafad888): unique input/output resolution, duplicate Prize input rejection, duplicate Prize output rejection, missing input datum rejection, and mismatch between the actual consumed datum and the supplied spending datum.
- The exact `cd42fcd5` Aiken B1 PrizePool Claim Slice run [#15](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40010383925) completed **successfully**: `aiken check` and `aiken build` both passed, including all five resolver regression tests.
- Commit [`018546fc`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/018546fc199baea6206ef484e525450118747324) added a reusable identity/transition helper and tests. Its exact Aiken workflow [#16](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40011306802) completed successfully, including `aiken check` and `aiken build`.
- A source comparison against `plutus/B1PrizePool.hs` then caught an important parity constraint: the normative Haskell identity predicate compares **only** `ticket_policy` and `ticket_name`; price, status, payout, Pool binding and other fields have separate action-specific guards. Commit [`93a92887`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/93a92887401cf32dbe8e39b7ea0b765301dc734b) narrows `same_prize_identity` to those exact two fields and changes the negative regression test to mutate the ticket name. Its exact workflow [#17](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40011390339) completed successfully, including `aiken check` and `aiken build`.
- `unique_prize_transition_preserves_identity` additionally checks configured Pool-hash binding; it does not validate the action-specific status transition, ticket NFT mint/burn, expiry, signatures, canonical oracle valuation, payout settlement, or B1 Pool physical-value delta.
- This remains context-resolution infrastructure, not a full action validator and not a deployed Pool candidate.


## TicketRevealed Prize-context slice added — 2026-10-23

- Commit [`288698e3`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/288698e35aa287b463d9083dde3d1fb5106be935) adds `ticket_revealed_prize_context_is_valid` to `b1_pool_prize_context.ak`.
- The helper resolves exactly one Prize input and output, requires configured Pool-hash binding on both datums, checks `Pending → Revealed`, compares ticket identity using only `ticket_policy` + `ticket_name` (matching the Haskell predicate), binds both datum prices to the action price, and reads payout from the continuing Prize datum while enforcing `0 <= payout <= pre_state_effective_pool`.
- Four focused tests cover the valid transition, payout above the pre-state pool, action-price mismatch, and negative payout.
- This is only the Prize-context slice. Pool datum accounting deltas, universal solvency, authority NFT, canonical oracle/value context and a full validator entry point remain separate requirements. It is not production parity by itself.
- Exact-SHA workflow [#18](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40011592171) for `288698e3` completed successfully, including `aiken check` and `aiken build`.
- The next commit [`5ab94fd7`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/5ab94fd7bae54ebdf7a03163dd34e1ba9edf0183) adds a TicketClaimed Prize-datum slice: `Revealed → Claimed`, stable ticket identity, positive unchanged payout and claimed amount bound to the consumed datum. Three tests cover valid unchanged payout, payout mutation, and redeemer amount mismatch. Its exact-SHA workflow result is pending verification.


## TicketClaimed CI failure and import fix — 2026-10-23

- The first workflow for commit [`5ab94fd7`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/5ab94fd7bae54ebdf7a03163dd34e1ba9edf0183), [run #19](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40011659890), failed during `aiken check`; the build step was skipped. Inspection identified the missing `Claimed` constructor import in `b1_pool_prize_context.ak`.
- Commit [`87260e35`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/87260e35e2f614382f2f25e48150e27d47946309) adds the missing import. This is a targeted compile fix; do not count TicketClaimed tests as passing until the exact-SHA Aiken workflow succeeds.


## Update 2026-10-23 — TicketExpired

- Commit `87260e35` passed Aiken workflow #20: `aiken check` and `aiken build` succeeded after adding the missing `Claimed` import.
- Commit `5d5a1b17` adds `ticket_expired_prize_context_is_valid`: unique Prize input, configured Pool binding, Pending status, zero payout, positive ticket price, and finite transaction lower bound at/after `expires_at`.
- This is a context helper, not a complete validator branch. Pool reserve/count accounting, solvency, authority NFT and physical-value context remain separate. The exact-SHA workflow for `5d5a1b17` still needs verification.

- The exact-SHA workflow [#21](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40012852721) for `5d5a1b17` completed successfully (`aiken check` and `aiken build`).
- Commit `93cca12a` adds two typed tests for the expiry lower-bound guard (valid at `expires_at`; rejected one unit earlier), with a finite transaction validity interval. The exact-SHA workflow is pending; do not count those tests as green until it completes.

- The first test-bearing commit `93cca12a` failed `aiken check` (the job log only exposes exit code 1, without a compiler diagnostic). Commit `34a19d8a` simplifies the test fixture to use `interval.after(lower)` instead of constructing the interval record inline. Its exact-SHA workflow must be checked before accepting the expiry tests.


## Expiry test verification — 2026-10-23 19:50 UTC

- The exact-SHA workflow [#23](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40013025297) for commit `34a19d8a` completed successfully. The finite-lower-bound expiry tests passed, and both `aiken check` and the isolated V3 prototype build succeeded. This closes the previously pending fixture/test verification; the original failure on `93cca12a` remains unexplained because its log had no compiler diagnostic.
- Commit [`f8cb7a58`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/f8cb7a582bab0dd8182f38da85a7f114cf80dea7) adds a negative regression test proving that `ticket_expired_prize_context_is_valid` rejects a datum whose configured Pool hash does not match the expected Pool hash.
- Its exact-SHA workflow [#24](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40014187720) completed successfully: `aiken check` and the isolated V3 prototype build both passed.
- Scope remains deliberately limited: expiry context and Pool accounting are separate pure/context slices. There is still no deployable Aiken B1PrizePool validator, and no claim of ledger-level or production parity follows from these harness results.


## TicketIssued Prize-context slice — 2026-10-23 20:00 UTC

- Commit [`51c8b1c8`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/51c8b1c8739a74f974d7212b94bbe641f4f9ded5) adds `ticket_issued_prize_context_is_valid` to `b1_pool_prize_context.ak`.
- The helper follows the Haskell `TicketIssued` Prize-side checks: exactly one decodable Prize output at the configured script hash; positive action price; output datum status `Pending`; zero prize amount; non-empty ticket policy and name; mint quantity for that exact ticket NFT equal to one; and Prize datum price equal to the action parameter.
- Four tests cover the valid exact mint, absent mint, mint quantity of two, and action-price mismatch.
- Exact-SHA Aiken workflow [#25](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40014335786) completed successfully: `aiken check` and isolated V3 prototype build passed.
- This helper checks only the Prize output and the matching mint quantity. It does not prove the mint is the only asset minted, does not verify any additional ticket-policy constraints, and does not replace Pool datum accounting, global solvency, authority NFT, or physical/oracle value guards. No deployable Aiken B1PrizePool entrypoint exists yet.


## TicketIssued resolver negative coverage — 2026-10-23 20:05 UTC

- Commit [`4ad39438`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/4ad394387b756ffcf4df84c67b486d8166404a21) adds two negative tests to `ticket_issued_prize_context_is_valid`: rejection when no Prize output is present and rejection when two outputs appear at the configured Prize script hash.
- The exact-SHA Aiken workflow [#26](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40017835789) is queued at the time of this checkpoint update. Do not count these two new tests as green until this exact run completes successfully.


## TicketIssued resolver negative tests verified — 2026-10-23

- Exact-SHA workflow [#26](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40017835789) for commit `4ad394387b756ffcf4df84c67b486d8166404a21` completed successfully.
- `aiken check` (including the isolated harness tests and type checking) and the isolated V3 prototype build both passed. The added `ticket_issued_context_rejects_missing_prize_output` and `ticket_issued_context_rejects_duplicate_prize_outputs` tests are now verified green on that exact source SHA.
- This closes the pending test status only. It does not make the Prize-context helper a deployable Pool validator, nor prove ledger-level parity or transaction-context coverage beyond the tested cases.
