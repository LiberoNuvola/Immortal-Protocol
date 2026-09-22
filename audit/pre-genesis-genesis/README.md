# PRE-GENESIS → GENESIS Stress Laboratory

**Status:** experimental / evidence harness, not normative.

## Purpose
Exercise the frozen PRE-RICH Genesis boundary under dynamic PRE price paths, Treasury observations, dumps, stale observations, wrong destinations and duplicate submissions.

The lab does not invent a stability period or a second threshold.

Canonical application boundary used by the harness:
- Genesis ticket price: 1 USDM.
- Genesis bootstrap predicate: verified PRE Treasury value >= 4,000 USDM.
- PRE-GENESIS → GENESIS is permissionless and must be independently revalidated.
- Genesis bootstrap evidence/value is not automatically PrizePool liquidity.

The price × quantity calculation is scenario instrumentation only. It is not a new canonical oracle or valuation rule. A real deployment must replace it with the verified Treasury valuation path.

## Required properties
1. `< 4000` cannot activate Genesis.
2. `= 4000` is an activation candidate.
3. `> 4000` is an activation candidate.
4. stale/unverified valuation cannot activate Genesis.
5. wrong Treasury cannot activate Genesis.
6. a candidate based on an old observation is rejected after a conflicting/new observation.
7. a second transition from GENESIS is rejected.
8. Genesis activation does not silently increase PrizePool liquidity.
9. a PRE price dump after committed Genesis does not retroactively change the committed regime.
10. every scenario emits a reproducible JSON evidence trace.

## Run
`node audit/pre-genesis-genesis/stress-lab.mjs`

Passing this lab is not on-chain conformance proof.