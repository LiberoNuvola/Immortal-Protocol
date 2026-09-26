# PRE-RICH — V3 Initial State Admission Gap

Date: 2026-09-26
Scope: first real PRE-RICH Issue on Cardano Preprod
Status: OPEN — explicit deployment profile required

## Finding

The V3 carrier implementation is now structurally deployable, but the repository does not contain a canonical live PRE-RICH initial V3 state.

The existing `IMMORTAL/conformance/GoldenVectors.hs` `baseState` is a conformance fixture with one class:

```text
TicketClassState 0 0 0 0 10 True
```

It is not a valid live carrier state because the production V3 carrier validator now requires exactly the eight canonical classes 0..7.

## Why the missing values cannot be invented

The V3 state contains application/deployment fields whose concrete initial values are not universal IMMORTAL constants:

- per-class `tcsCap`;
- per-class `tcsSaleable`;
- class issuance state;
- CurrentActiveClass / HighestClassEverActivated;
- SafetyCapital;
- ReserveProtection;
- MandatoryFutureCosts;
- Jackpot lifecycle fields.

The state-field ownership matrix explicitly classifies class caps and saleability as PRE-RICH/application state.

The hysteresis implementation also requires externally supplied exact capacity costs; it does not define a canonical deployment capacity table.

Therefore a test-vector value such as `cap = 10` must not silently become production policy.

## Required closure artifact

Before a real carrier singleton is deployed, the deployment must publish an explicit, reproducible initial-state declaration containing:

1. all eight canonical class records;
2. exact class caps;
3. exact issued/unresolved/exposure values;
4. exact saleability flags;
5. exact CurrentActiveClass;
6. exact HighestClassEverActivated;
7. exact SafetyCapital;
8. exact ReserveProtection;
9. exact MandatoryFutureCosts;
10. exact Jackpot state;
11. state version;
12. derivation/authority for every deployment-specific field;
13. deterministic serialization/CBOR evidence.

The deployment helper already requires the initial datum explicitly and has no fallback/default state.

## Non-regression

Do not:

- copy `GoldenVectors.baseState` into production;
- fill missing classes with guessed caps;
- derive protected-capital fields from Treasury balance;
- derive V3 state from the browser;
- use B1PrizePool as a lossless V3 substitute;
- promote test fixtures into deployment policy.

## Current consequence

The V3 carrier deployment helper is intentionally ready but cannot be submitted honestly until the explicit PRE-RICH deployment initial-state profile exists.

Once that profile is declared, the next executable sequence is:

```text
declared initial V3 state
→ deterministic datum encoding
→ deployment seed UTxO
→ one-shot carrier mint
→ exact singleton UTxO observation
→ Issue admission binding
→ DEMETER/CIP-30 first Issue
→ post-state evidence
```

This is a deployment-profile gap, not a missing IMMORTAL economic constant.
