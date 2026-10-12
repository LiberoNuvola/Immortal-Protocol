# IMMORTAL Economic Gate — Cross-Transition Contract Test v1

**Branch:** `b1-hardening`  
**Status:** synthetic offline conformance-contract experiment.  
**Reference interface:** existing `IMMORTAL/kernel/EconomicGate.hs` and `IMMORTAL/kernel/UniversalEconomicKernel.hs` (inspected source revision: `876bc54f8ee8f6e1dede226db8c367cca3ae620c`).

## Why this experiment exists

The previous adaptive-cap prototype used its own illustrative policy. This experiment instead tests the *shape of IMMORTAL's existing universal gate* across three transition families—Underwrite, Claim, and Expire—without changing the normative Haskell kernel or inventing application transition rules.

The mirrored checks are:
- authoritative truth verified;
- EEV fresh;
- obligations complete;
- available and required immediate liquidity non-negative;
- required liquidity no greater than available liquidity;
- candidate post-state non-negative and EEV at least ProtectedCapital;
- separate viability requirements for post-state safety and successor closure in the certified kernel.

ProtectedCapital follows the existing universal-kernel definition: crystallized liabilities + worst-case exposure + safety capital + reserve protection + mandatory future costs + additional protected capital.

## Reproduce

```bash
python3 scripts/immortal-economic-gate-cross-transition.py
```

The script writes `immortal-economic-gate-cross-transition-report.json` and asserts outcomes for nine synthetic cases, including:
- an admissible candidate;
- exposure that pushes ProtectedCapital above EEV;
- insufficient immediate liquidity despite a solvent candidate;
- an expiry-like action requiring zero immediate liquidity;
- stale EEV, incomplete obligations, unverified authoritative truth;
- a negative state component;
- an economically safe state whose viability proof is not established.

## What this establishes

It checks that the documented interface can express a common admission contract across several transition *families*, while keeping immediate economic admissibility separate from viability. It also checks that an action does not need positive RawSurplus merely to be admitted: zero immediate liquidity is permitted where required liquidity is zero, provided the other conditions hold.

## What this does not establish

- The script is a Python mirror of inspected predicates, not an execution of Haskell, Plutus, or Aiken.
- Scenario data are synthetic; they are not authenticated on-chain observations.
- Transition labels do not prescribe how Underwrite, Claim, or Expire changes state. Those deltas require an approved profile and source-grounded projection.
- This does not prove Aegis lacks these controls or that a bridge to Aegis is conformant.
- No economic parameters, thresholds, or production rules are added to IMMORTAL's normative kernel.

## Next gate

Run equivalent fixtures against the actual Haskell/Plutus implementation and compare the result with this contract test; then add transition-specific projections only where the source defines the transition and the economic perimeter is qualified. For Aegis, use the bridge's transition invariants and leave the projection `UNVERIFIABLE` until the accounting mapping is approved.
