# IMMORTAL — Economic Mutation Inventory (RF8/RF10) — 2026-09-24

Operational audit artifact; not normative.

## Current mutation surfaces

| Entry point | Class | Economic effect | Kernel/economic check | Current status |
|---|---|---|---|---|
| `MintPolicy.mkPolicy` — issue | ECONOMIC | ticket mint + reserve + Treasury payment | `Economic.totalUsdmValue`; Pool `solvencyInvariant` | PARTIAL / system proof open |
| `MintPolicy.mkPolicy` — exact burn | IDENTITY | ticket NFT -1 only | none | classify as identity-only unless another contract gives burn economic meaning |
| `PrizeValidator.validateSyncBeacon` | INFRA | BeaconPending → BeaconReady | none | non-economic lifecycle |
| `PrizeValidator.validateReveal` | ECONOMIC | reserve release + payout liability | pool cross-check; deterministic payout | PARTIAL |
| `PrizeValidator.validateClaim` | ECONOMIC | liability/liquidity - payout | `Economic.totalUsdmValue`; pool checks | PARTIAL |
| `PrizeValidator.validateExpire` | ECONOMIC | reserve/count release; no payout | pool cross-check | PARTIAL |
| `B1PrizePool / TicketIssued` | ECONOMIC | reserve + price; count +1 | `solvencyInvariant` | PARTIAL |
| `B1PrizePool / TicketRevealed` | ECONOMIC | reserve release; liability creation | kernel deltas + `solvencyInvariant` | PARTIAL |
| `B1PrizePool / TicketClaimed` | ECONOMIC | liquidity/liability reduction | oracle pool valuation + kernel delta + `solvencyInvariant` | PARTIAL |
| `B1PrizePool / TicketExpired` | ECONOMIC | reserve/count reduction | `solvencyInvariant` | PARTIAL |
| `Treasury / Distribute` | ECONOMIC CAPITAL | protocol-controlled lovelace distribution | direct threshold/percentage checks | OPEN canonical Gate membership |
| `CounterValidator` | SUPPORTING | serial counter n → n+1 | none | supporting identity evidence |
| `BeaconRegistry / RegistryPublish` | INFRA | beacon lifecycle mutation | relayer + deterministic beacon derivation | non-economic infrastructure |
| `createPendingRound` / `publishRoundBeacon` | INFRA BUILDER | registry creation/publication | builder + on-chain registry validation | outside economic mutation theorem |

## RF8 findings

1. Production PRE-RICH economic orchestrators in `src/mint.ts` and `src/gameFlow.ts` cross `submitEconomic()`.
2. The real-Yaci Reveal trace is a ledger-evidence harness and now uses `submitInfrastructure()` deliberately; it is not evidence of Economic Gate admission.
3. Treasury remains the largest unclosed economic mutation surface because its inspected validator path does not visibly participate in the current Economic Gate → Viability → Safe Action chain.
4. The exact single-ticket burn branch returns `True`; no evidence currently shows that burn itself releases liability or otherwise mutates canonical economic state.
5. The remaining system-level proof is exact ticket/Poll identity correspondence across PrizeValidator + B1PrizePool for each economic action.

## Required next packet

`pre-state → action → candidate post-state → exact Pool correspondence → value delta → validator predicates → admission witness → ledger evidence`

## Status

RF8 mutation inventory: SUBSTANTIALLY ADVANCED
RF8 global no-side-door theorem: OPEN
RF10 global atomicity theorem: OPEN
