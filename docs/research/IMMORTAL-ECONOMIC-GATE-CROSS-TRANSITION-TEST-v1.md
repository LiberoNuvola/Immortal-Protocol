# IMMORTAL Universal Kernel — Cross-Transition Contract Test v3

**Branch:** `b1-hardening`  
**Classification:** synthetic offline arithmetic contract with an added Haskell test-suite path; CI outcome not yet verified.  
**Normative source inspected on this branch:** `IMMORTAL/kernel/UniversalEconomicKernel.hs` and `IMMORTAL/state/UniversalEconomicState.hs`.

## Branch-accuracy correction

The earlier draft described the separate `EconomicGate.hs` interface as if it were present in the `b1-hardening` module inventory. The current `b1-hardening` `plutus/pre-rich-plutus.cabal` fetched for this work does not list `EconomicGate` among exposed modules and does not include the `economic-gate-tests` suite found on a different repository revision. This test therefore limits itself to the universal-kernel functions actually present on this branch. It does not claim to execute or mirror the separate Economic Gate.

## What is tested

### Python mirror

The offline Python script contains nine synthetic cases and 31 assertions covering:
- ProtectedCapital as the sum of six protected obligation/capital components;
- RawSurplus clamped to `max(0, EEV - ProtectedCapital)`;
- rejection of negative state components and negative EEV by the solvency invariant;
- exact solvency boundary (`EEV == ProtectedCapital`);
- distinction between zero RawSurplus and insolvency;
- changes to mandatory future costs and their effect on protected capital;
- zero state and positive-surplus cases.

### Haskell implementation test

The existing `plutus/test/UniversalEconomicKernelTest.hs` was extended with ten assertions against the actual exported Haskell functions `protectedCapital`, `rawSurplus`, `nonNegativeState`, and `solvencyInvariant`. The new vectors explicitly verify:
- `ProtectedCapital = 45` and `RawSurplus(EEV=60) = 15` for the chosen state;
- exact solvency boundary and one-unit-below rejection;
- RawSurplus clamping is not itself a solvency decision;
- a negative exposure is rejected by the solvency predicate even when RawSurplus remains positive;
- increasing mandatory future costs moves ProtectedCapital from 45 to 50.

The Haskell test source has been committed, and the CI workflow now has a separate job to build and run `universal-economic-kernel-tests`. **The GitHub Actions result has not been verified yet**, so this is not reported as a passing Haskell/Plutus test.

The labels Underwrite, Claim, and Expire identify test families only. They do not prescribe transition deltas or assert that a concrete application transition is implemented.

## Reproduce

Python mirror:

```bash
python3 scripts/immortal-economic-gate-cross-transition.py
```

Haskell suite (from the repository's `plutus/` directory, using the pinned project toolchain):

```bash
cabal build universal-economic-kernel-tests
cabal test universal-economic-kernel-tests --test-show-details=direct
```

The Python script emits `immortal-economic-gate-cross-transition-report.json`.

## Evidence boundary

The Python test mirrors the kernel arithmetic; the Haskell suite calls the real Haskell kernel functions. Neither alone establishes Plutus on-chain evaluation, adapter conformance, Aegis integration value, or production safety. The Haskell workflow is configured but its run result must be inspected before calling it green.

## Next gate

Confirm the Haskell CI job actually builds and passes. If it fails, fix only the kernel test/toolchain wiring and preserve V3/Reveal semantics. If it passes, use the same versioned vectors as the basis for a source-grounded differential experiment; do not claim cross-transition semantics or Aegis product value without a qualified economic perimeter and an approved real scenario.
