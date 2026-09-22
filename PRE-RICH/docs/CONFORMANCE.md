# PRE-RICH Conformance

Application conformance is separate from IMMORTAL protocol conformance and Cardano adapter conformance.

| Requirement | Semantic | Implementation | Evidence |
|---|---|---|---|
| USDM denomination | CLOSED | PARTIAL/GAP as applicable | PARTIAL |
| class ladder | CLOSED | GAP/PARTIAL | PARTIAL |
| Genesis + 4000 USDM bootstrap | CLOSED | GAP/PARTIAL | PARTIAL |
| maximum payout 500 × P | CLOSED | GAP/PARTIAL | PARTIAL |
| five winning tiers and payout mapping | CLOSED | GAP/PARTIAL | PARTIAL |
| worst-case exposure 500 × P × N | CLOSED | GAP/PARTIAL | PARTIAL |
| liability-first accounting | CLOSED | GAP/PARTIAL | PARTIAL |
| protected locked Jackpot | CLOSED | GAP/PARTIAL | PARTIAL |
| Jackpot does not alter normal symbol probabilities | CLOSED | GAP/PARTIAL | PARTIAL |
| current class may contract | CLOSED | GAP/PARTIAL | PARTIAL |
| historical maximum monotonic | CLOSED | GAP/PARTIAL | PARTIAL |
| contraction ladder | CLOSED | GAP/PARTIAL | PARTIAL |
| hysteresis KA=8, KC=4, KD=4 | CLOSED | GAP/PARTIAL | PARTIAL |
| sale atomicity | CLOSED | GAP/PARTIAL | PARTIAL |
| reveal/result derivation | CLOSED | GAP/PARTIAL | PARTIAL |
| crystallized payout immutability | CLOSED | GAP/PARTIAL | PARTIAL |
| single claim / CLAIM ≠ BURN | CLOSED | GAP/PARTIAL | PARTIAL |
| final expiry semantics | CLOSED | GAP/PARTIAL | PARTIAL |
| exact expiry duration | CLOSED (policy boundary) | PARTIAL / DApp profile pending | MISSING |
| ticket transferability / identity | CLOSED | GAP/PARTIAL | PARTIAL |
| voluntary burn semantics | CLOSED | GAP/PARTIAL | PARTIAL |
| Jackpot funding <= RawSurplus | CLOSED | GAP/PARTIAL | PARTIAL |
| Jackpot payout <= LockedJackpotLiquidity | CLOSED | GAP/PARTIAL | PARTIAL |
| Jackpot payout mode | CLOSED (PRE-RICH policy) | PARTIAL / conformance pending | MISSING |
| non-discretionary Jackpot selection | CLOSED | GAP/PARTIAL | PARTIAL |
| Jackpot reset / liability accounting | CLOSED | GAP/PARTIAL | PARTIAL |
| settlement value preservation | CLOSED | GAP/PARTIAL | PARTIAL |
| future Jackpot allocation if required | CLOSED (no fixed allocation rate) | PARTIAL / conformance pending | MISSING |
| 75 / 10 / 10 / 5 allocation | HISTORICAL / NON-CANONICAL | HISTORICAL | VERIFIED as historical |

### Policy-closure note

The three rows above are intentionally separated from implementation/evidence status. Current PRE-RICH policy closure defines: expiry as a deterministic DApp/profile policy whose horizon is crystallized at issuance (not a canonical fixed 365-day value); Jackpot payout as full current locked-balance payout exactly once; and no fixed `JackpotAllocationRate`. Remaining implementation and ledger evidence gaps do not reopen those policy decisions.

Implementation or evidence gaps do not reopen CLOSED semantics.
