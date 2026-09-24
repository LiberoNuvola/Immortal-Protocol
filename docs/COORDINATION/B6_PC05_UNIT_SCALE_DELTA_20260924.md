# IMMORTAL — B6 / PC-05 Unit-Scale Delta 2026-09-24

## Finding

The branch contains two legitimate but different monetary conventions:

### Canonical V3 / profile state

`PRE-RICH/profile/PreRichEconomicProfile.hs` defines ticket prices as:

`1 / 2 / 3 / 5 / 10 / 25 / 50 / 100`

The V3 conformance vectors therefore operate in profile reference units.

### B1 Cardano datum

`plutus/Types.hs` explicitly states that all B1 PrizePool monetary fields are **USDM sub-units**, with:

`1 USDM = 100` sub-units.

### Current legacy B1 → Universal projection

`B1LegacyAdapter.legacyB1ToUniversalEconomicState` copies B1 monetary fields directly and multiplies unresolved reserve by the PRE-RICH 500x bound.

Therefore that UniversalEconomicState instance remains in B1 sub-unit scale.

### Current Cardano observation → V3 projection

`PRE-RICH/profile/PreRichCardanoObservationProjection.ts` converts:

- pending liabilities;
- unresolved reserve;
- locked Jackpot;

from USDM sub-units into profile reference units by dividing by 100.

Therefore that canonical V3 projection is in reference-unit scale.

## Consequence

`UniversalEconomicState` has no explicit monetary-unit tag.

The following two statements can therefore both be locally true:

- a Universal state represented in B1 sub-units;
- a Universal state represented in PRE-RICH reference units.

Because the Universal kernel is arithmetic over integers, this is safe only when **EEV, liabilities, exposure and all protected components use the same scale within a given evaluation**.

The current code does not expose this unit contract as a type-level invariant.

## Why this matters for B6

A future equivalence claim between:

`B1 validator → legacy universal state`

and

`V3/profile → universal state`

must include an explicit scale-conversion witness.

A raw numeric equality between the two UniversalEconomicState values would otherwise be meaningless.

Example:

- Genesis price in V3 = 1 reference unit;
- Genesis price in B1 datum = 100 sub-units;
- corresponding 500x exposure = 500 vs 50,000 respectively.

These are economically equivalent only after applying the 100× scale relation.

## Current disposition

This is **not** treated as an economic-rule change and no conversion was silently introduced into the validator.

It is classified as:

**PC-05 / B6: OPEN unit-contract evidence**

## Required closure artifact

Before declaring B6 numerical semantic equivalence, produce one explicit witness covering:

1. the monetary unit of the canonical V3/profile state;
2. the monetary unit of the concrete B1 datum;
3. the conversion factor;
4. EEV conversion;
5. every protected-capital component conversion;
6. payout / reserve / liability deltas;
7. exact equality after normalization into one common unit.

Only then should a V3 ↔ Cardano UniversalEconomicState equality be claimed.

## Non-regression

No constants, payout rules, validator rules, or state ownership semantics were changed.
