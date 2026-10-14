# B-R1 — Risk Assessment → Protection Requirement: implementation audit

**Date:** 2026-10-14  
**Branch inspected:** `work/immortal-green-closure`  
**Scope:** trace the existing economic decision path; no economic semantics changed.  
**Status:** `FINDING CONFIRMED — NORMATIVE BRIDGE NOT IMPLEMENTED`

## Executive finding

The current implementation has a complete *deterministic* protection path, but no executable bridge that selects or derives a protection requirement from a distinct risk assessment/regime.

The PRE-RICH profile supplies `epMaxNormalPayoutMultiplier = 500`. The V3 kernel derives class-aware exposure from that profile, adds it to `ProtectedCapital`, and checks post-state solvency. The universal kernel then protects the supplied `uesWorstCaseExposure`. The admission layer projects the candidate state and calls the Economic Gate, then requires an externally supplied Ω-successor boolean.

The statistical reserve formula appears in PRE-RICH documentation, explicitly classified as statistical risk capital and not deterministic worst-case protection. The inspected universal state has no separate risk-assessment result, regime identifier, statistical confidence input, or protection-requirement object. No executable selector connecting these concepts was found in the inspected path.

This audit does **not** establish that a dynamic regime was never prototyped elsewhere. It establishes that the current path inspected here does not implement that bridge.

## Trace evidence

| Stage | Observed implementation | Result |
|---|---|---|
| Application parameters | `PRE-RICH/onchain/PreRichEconomicProfile.hs`: `epMaxNormalPayoutMultiplier = 500` | 500 is a PRE-RICH parameter, not a universal literal in this path |
| Class-aware exposure | `IMMORTAL/kernel/EconomicKernel.hs`: `worstCaseExposure profile s = epMaxNormalPayoutMultiplier profile * totalClassExposure profile (v3Classes s)` | Deterministic worst-case exposure is derived |
| V3 protected capital | Same file: liabilities + worst-case exposure + safety capital + reserve protection + locked Jackpot + mandatory future costs | Worst-case exposure is always included |
| Universal protected capital | `IMMORTAL/kernel/UniversalEconomicKernel.hs`: `uesWorstCaseExposure` is added to protected capital | The universal layer does not choose a risk regime; it protects the supplied amount |
| Universal state | `IMMORTAL/state/UniversalEconomicState.hs` contains unresolved reserve/count, worst-case exposure, safety capital, reserve protection, mandatory costs and additional protected capital | No explicit risk assessment or protection-requirement field |
| Economic Gate | `IMMORTAL/kernel/EconomicGate.hs` checks authoritative truth, fresh EEV, complete obligations, immediate liquidity and universal solvency; viability additionally consumes a Boolean for Ω successors | Gate enforces supplied predicates; it does not calculate the risk regime |
| PRE-RICH admission | `PRE-RICH/onchain/PreRichEconomicAdmission.hs` performs transition → projection → Economic Gate and viability check | No risk-regime selection between projection and gate |
| Statistical model | `PRE-RICH/docs/ECONOMIC-ALGORITHM.md` defines `UnresolvedReserve(N) = N × μ + Z × σ × sqrt(N)` and explicitly says this is statistical risk capital, not deterministic worst-case protection | Documentation is not an executable selector |

## Canonical constraints recovered

1. `IMMORTAL/docs/CONSTITUTION.md` states that a statistical risk model does not become a deterministic guarantee merely because it is conservative.
2. The same Constitution requires safety to be evaluated on the candidate post-state and forbids treating obligations or viability capital as discretionary surplus.
3. `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` defines the universal gates as Economic Gate → Viability Gate → Policy Selector → Atomic Execution; a policy selector cannot enlarge the safe action set.
4. PRE-RICH's current documented 500× payout cap and the existing worst-case exposure checks must not be silently weakened by adding an undocumented regime switch.

## Conclusion

The current code conforms to a **worst-case protection path**. It does not yet conform to an executable **dynamic risk-regime path** because the risk assessment → protection requirement mapping is not represented in the inspected state/kernel/admission interfaces.

No implementation change should replace or discount `uesWorstCaseExposure` based on statistical reserve until an applicable normative specification defines:
- the admissible risk-assessment inputs and their authoritative provenance;
- the protection-requirement mapping and its preconditions;
- the permitted regime transitions, including hysteresis and failure/unknown-data behavior;
- whether statistical capital is additional to, or can ever substitute for, any deterministic requirement, and under exactly what proof obligations;
- the Ω/viability certificate and negative conformance cases.

These are not values this implementation audit may invent. Existing closed PRE-RICH parameters remain unchanged.

## Next implementation work (non-semantic)

1. Add tests that pin the current behavior: changing statistical-only documentation/input must not reduce worst-case protected capital; missing or unverified regime evidence must fail closed if a future interface is introduced.
2. Build a conformance matrix for the future bridge: regime input → derived protection requirement → projected protected capital → Economic Gate → Ω viability → atomic transition.
3. Only after the normative mapping is found or formally approved, implement the narrow bridge and tests. Do not change V3 transition semantics or Reveal while doing this audit.

## Source links

- [EconomicKernel.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/IMMORTAL/kernel/EconomicKernel.hs)
- [UniversalEconomicKernel.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/IMMORTAL/kernel/UniversalEconomicKernel.hs)
- [UniversalEconomicState.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/IMMORTAL/state/UniversalEconomicState.hs)
- [EconomicGate.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/IMMORTAL/kernel/EconomicGate.hs)
- [PreRichEconomicAdmission.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/onchain/PreRichEconomicAdmission.hs)
- [PreRichEconomicProfile.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/onchain/PreRichEconomicProfile.hs)
- [ECONOMIC-ALGORITHM.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/docs/ECONOMIC-ALGORITHM.md)
- [IMMORTAL Constitution](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/IMMORTAL/docs/CONSTITUTION.md)
- [Universal Economic Model](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md)
