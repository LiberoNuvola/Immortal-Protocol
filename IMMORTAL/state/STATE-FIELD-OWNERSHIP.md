# IMMORTAL — V3 State Field Ownership Matrix

**Status:** implementation/conformance boundary; non-normative
**Branch:** `work/immortal-green-closure`
**Date:** 2026-09-21

## Purpose

`EconomicStateV3` is currently a rich compatibility state used by the PRE-RICH application and Cardano conformance layer. This document prevents its application-shaped fields from being mistaken for universal IMMORTAL law while preserving the existing V3 interface.

## Field classification

| V3 field/type | Current ownership | Universal meaning | Action |
|---|---|---|---|
| `v3CrystallizedLiabilities` | IMMORTAL universal primitive | Protected obligation already crystallized | Retain in Universal state |
| `v3UnresolvedReserve` | Universal aggregate, application-derived | Ring-fenced unresolved obligation reserve | Retain as aggregate; source remains profile/application |
| `v3UnresolvedTicketCount` | Universal aggregate, application-derived | Count of unresolved obligations represented by the application | Retain as aggregate; source remains profile/application |
| `v3SafetyCapital` | IMMORTAL universal primitive | Protected safety capital | Retain in Universal state |
| `v3ReserveProtection` | IMMORTAL universal primitive | Protected reserve component | Retain in Universal state |
| `v3MandatoryFutureCosts` | IMMORTAL universal primitive | Protected mandatory future-cost component | Retain in Universal state |
| `v3Classes :: [TicketClassState]` | PRE-RICH/profile-shaped extension | Per-class obligation decomposition | Keep outside universal state; project only what is universal |
| `TicketClassState.tcsClassId` | PRE-RICH/profile-shaped | Application class identifier | Never promote to universal law |
| `TicketClassState.tcsIssued` | PRE-RICH/application | Application issuance count | Keep in profile state |
| `TicketClassState.tcsUnresolved` | PRE-RICH/application | Per-class unresolved count | Keep in profile state; aggregate only at boundary |
| `TicketClassState.tcsExposure` | Derived/profile-specific | Per-class exposure under profile payout model | Validate at profile boundary; feed aggregate worst-case exposure |
| `TicketClassState.tcsCap` | PRE-RICH/application | Application class cap | Keep in profile policy/state |
| `TicketClassState.tcsSaleable` | PRE-RICH/application | Application saleability policy | Keep in profile/application |
| `v3Control` / `EconomicControlState` | PRE-RICH/control-policy-shaped | Application activation/history control | Keep outside universal state unless a future universal control primitive is separately specified |
| `ecsCurrentActiveClass` | PRE-RICH policy state | Application activation frontier | Do not promote to universal canon |
| `ecsHighestClassEverActivated` | PRE-RICH policy/history | Application monotonic class history | Do not promote to universal canon |
| `v3Jackpot` / `JackpotState` | PRE-RICH/application | Game-specific protected Jackpot lifecycle | Keep outside universal state; only protected amount may cross as additional protected capital |
| `JackpotStatus` | PRE-RICH/application | Game-specific jackpot lifecycle state | Never universalize without separate decision |
| `jsThreshold` | PRE-RICH/application | Game-specific activation/funding threshold | Keep in application policy |
| `jsCycle` | PRE-RICH/application | Game-specific lifecycle counter | Keep in application state |
| `jsLockedAmount` | Application source, universal economic contribution | Protected liquidity that cannot be treated as free surplus | Project to universal protected-capital aggregate where applicable |

## Current bridge

```text
PRE-RICH V3 rich state
        │
        │ validate profile / class decomposition
        ▼
PreRichEconomicProjection
        │
        ├── unresolved reserve
        ├── unresolved count
        ├── worst-case exposure
        ├── crystallized liabilities
        ├── SafetyCapital
        ├── ReserveProtection
        ├── MandatoryFutureCosts
        └── application-protected amount (e.g. locked Jackpot)
        ▼
UniversalEconomicState
        │
        ▼
UniversalEconomicKernel / EconomicGate / Viability
```

## Refactoring rule

Do not rewrite `EconomicStateV3` into a universal-only struct in one step. First move consumers to `UniversalEconomicState` where they need only universal economic quantities. Preserve V3 for application/refinement compatibility until action-by-action equivalence is demonstrated.

## Closed boundary

The current distinction is consistent with the repository architecture and classification records: IMMORTAL owns universal economic semantics; Adapter owns chain realization/evidence; PRE-RICH owns ticket classes, game rules, Jackpot lifecycle and deployment policy.

Implementation/conformance gaps may remain without changing ownership. Any proposal to promote a PRE-RICH field into universal IMMORTAL state requires a separate explicit normative decision.