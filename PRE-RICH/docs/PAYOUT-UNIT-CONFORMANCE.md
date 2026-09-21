# PRE-RICH Payout Unit Conformance

Status: CLOSED — false positive resolved by unit triangulation
Branch: work/immortal-green-closure

## Finding and correction

The previous checkpoint incorrectly evaluated `prizeAmountForTier` with `priceUsdm = 1` and therefore appeared to truncate the canonical 2.5 USDM tier-2 payout to 2.

That interpretation was wrong.

The current PRE-RICH Cardano-facing implementation represents USDM amounts in **100 sub-units per USDM**. The current `src/mint.ts` explicitly documents:

```
1 USDM = 100 sub-units
DEFAULT_PRICE_USDM = 100
```

The current Adapter/settlement evidence also maps canonical reference-unit prices into USDM sub-units, e.g. class 0 → 1 RU → 100 USDM sub-units.

Therefore Genesis is represented as:

```
priceUsdm = 100
```

and the current arithmetic gives:

```
tier 1: 2 × 100 / 2 = 100 sub-units = 1 USDM
tier 2: 5 × 100 / 2 = 250 sub-units = 2.5 USDM
tier 3: 10 × 100 / 2 = 500 sub-units = 5 USDM
tier 4: 200 × 100 / 2 = 10,000 sub-units = 100 USDM
tier 5: 1000 × 100 / 2 = 50,000 sub-units = 500 USDM
```

The 500× cap is therefore also exact:

```
500 × 100 = 50,000 sub-units = 500 USDM
```

## Result

There is **no payout-unit truncation bug** in the current implementation under the established 100-sub-unit representation.

The earlier OPEN finding was a unit-interpretation error, not a code defect.

No code change is required.

## Remaining evidence

The unit boundary should still be covered by executable conformance vectors:

- Genesis 1 USDM → 100 sub-units;
- tier 2 → 250 sub-units;
- tier 5 → 50,000 sub-units;
- all ladder prices map exactly;
- Plutus and TypeScript agree;
- Cardano settlement preserves exact USDM equivalence.

These are conformance tests, not a reopened economic-policy decision.
