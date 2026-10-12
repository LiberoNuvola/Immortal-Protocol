# IMMORTAL Universal Kernel — Cross-Transition Contract Test v2

**Branch:** `b1-hardening`  
**Classification:** synthetic offline research test; not Haskell/Plutus execution.  
**Normative source inspected on this branch:** `IMMORTAL/kernel/UniversalEconomicKernel.hs` and `IMMORTAL/state/UniversalEconomicState.hs`.

## Branch-accuracy correction

The previous draft described the separate `EconomicGate.hs` interface as if it were present in the `b1-hardening` module inventory. The current `b1-hardening` `plutus/pre-rich-plutus.cabal` fetched for this work does not list `EconomicGate` among exposed modules and does not include the `economic-gate-tests` suite found on a different repository revision. This version therefore limits itself to the universal-kernel functions actually present on this branch. It does not claim to execute or mirror the separate Economic Gate.

## What is tested

Nine synthetic cases cover:
- ProtectedCapital as the sum of the six protected obligation/capital components;
- RawSurplus clamped to `max(0, EEV - ProtectedCapital)`;
- rejection of negative state components and negative EEV by the solvency invariant;
- exact solvency boundary (`EEV == ProtectedCapital`);
- distinction between zero RawSurplus and insolvency;
- changes to mandatory future costs and their effect on protected capital;
- zero state and positive surplus cases.

The labels Underwrite, Claim, and Expire identify test families only. They do not prescribe transition deltas or assert that a concrete application transition is implemented.

## Reproduce

```bash
python3 scripts/immortal-economic-gate-cross-transition.py
```

The script emits `immortal-economic-gate-cross-transition-report.json`.

## Evidence boundary

The script mirrors universal-kernel arithmetic in Python; it is not Haskell/Plutus execution. It does not establish adapter conformance, Aegis integration value, or production safety.

## Next gate

Wire these cases into the actual Haskell test suite available on `b1-hardening` (or extend that suite using the existing kernel modules), run the Haskell tests in CI, and compare Python and Haskell results from the same versioned vectors. Only after this passes should transition-specific projections be added, with an explicit approved economic perimeter.
