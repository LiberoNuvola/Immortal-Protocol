# IMMORTAL — RF8 No-Side-Door Surface Audit
Date: 2026-09-24

## Purpose

Operational audit of the currently observable economic mutation surfaces. This is evidence mapping, not a claim that RF8 is discharged.

## Observed economic surfaces

1. `plutus/MintPolicy.hs`
   - Handles ticket minting and sale-related checks.
   - Repository comments state MintPolicy and B1PrizePool both enforce the atomic-sale invariant.
2. `plutus/B1PrizePool.hs`
   - Maintains pool liquidity, pending liabilities, unresolved reserve, locked Jackpot and solvency.
   - It is therefore an independent economic-state enforcement surface.
3. `plutus/PrizeValidator.hs`
   - Handles reveal/claim/expire lifecycle and cross-validates B1PrizePool state.
   - It is an independent lifecycle mutation surface.
4. `plutus/Treasury.hs`
   - Treasury distribution/value movement is a separate economic surface.
5. `plutus/B1LegacyAdapter.hs`
   - Provides legacy↔V3 projection.
   - Reverse projection is explicitly fail-closed for unsupported protected-capital and Jackpot state.
6. Off-chain `src/mint.ts` / `src/gameFlow.ts`
   - Construct candidate transactions.
   - Repository comments explicitly state that on-chain enforcement belongs to MintPolicy + B1PrizePool; therefore off-chain construction is not itself economic authority.

## Strong evidence already present

The B1LegacyAdapter is deliberately fail-closed:
- non-zero SafetyCapital → rejection;
- non-zero ReserveProtection → rejection;
- non-zero MandatoryFutureCosts → rejection;
- non-zero locked Jackpot → rejection;
- historical control mismatch → rejection;
- aggregate mismatch → rejection.

This is evidence against silent state collapse at that compatibility boundary.

The CAES composition certificate also rejects false supplied witnesses:
- v3TransitionValid;
- refinementExact;
- semanticEncodingValid.

## RF8 gap

The current evidence does NOT establish that every economically material mutation surface reaches one canonical Economic Gate.

In particular, the repository search does not currently expose a single callable `EconomicGate` / `economicGate` symbol that all MintPolicy, B1PrizePool, PrizeValidator and Treasury paths invoke.

This does not prove that no equivalent gate exists under another name; it means the required whole-program call-graph evidence has not been recovered.

Therefore:
**RF8 = OPEN / evidence required.**

## Required proof packet

For each economically material transition:
SALE, REVEAL LOSS, REVEAL WIN, CLAIM, EXPIRE, Jackpot activation/payout/reset, Treasury distribution, class transition and recovery:

- canonical V3 transition;
- rho/refinement mapping;
- concrete validator entry point;
- proof that canonical economic admissibility is evaluated;
- negative test showing a bypass path is rejected;
- transaction/ledger witness where applicable;
- call-graph or static reachability evidence showing no alternate economic path.

## Important distinction

A test that the current implementation passes is not sufficient. RF8 requires a regression property that fails if a new economic mutation path bypasses the canonical gate.

No economic semantics changed by this audit.
