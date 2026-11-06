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

#
## Economic Admission Unit Boundary — Direct-USDM EEV

The signed `PRE-RICH-EEV-USDM-DIRECT-V1` source reports physical USDM amounts
in **USDM sub-units**. The authority signature authenticates those raw values;
the provider checks both `preEEV` and `candidateEEV` against the exact
direct-USDM observation for the same B1 PrizePool UTxO before normalization.

Before invoking the canonical Haskell Issue producer, the observation reader
preserves the signed source amounts and converts EEV to IMMORTAL reference
units using exact integer division:

`EEV_reference_units = EEV_USDM_subunits / 100`

The conversion fails closed when the signed amount is not divisible by 100.
No floor, ceiling, rounding, oracle price or additional valuation is introduced
at this boundary.

Immediate executable liquidity is a separate quantity. For the PRE-RICH V1
direct-USDM profile, `availableExecutableLiquidity` and
`requiredImmediateLiquidity` remain in **USDM sub-units** and are compared
without dividing either value by 100. The two unit domains are therefore:

| Admission input | Unit basis |
|---|---|
| `preEEV` / `candidateEEV` used by the Haskell economic kernel | IMMORTAL reference units |
| `availableExecutableLiquidity` / `requiredImmediateLiquidity` | USDM sub-units |

This is an adapter unit conversion only; it changes no economic formula,
ProtectedCapital component, payout parameter, EEV source perimeter or
immediate-liquidity rule.


# Remaining evidence

The unit boundary should still be covered by executable conformance vectors:

- Genesis 1 USDM → 100 sub-units;
- tier 2 → 250 sub-units;
- tier 5 → 50,000 sub-units;
- all ladder prices map exactly;
- Plutus and TypeScript agree;
- Cardano settlement preserves exact USDM equivalence.

These are conformance tests, not a reopened economic-policy decision.
