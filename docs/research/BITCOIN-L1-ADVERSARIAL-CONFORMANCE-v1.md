# Bitcoin L1 — Adversarial Boundary Conformance v1

**Classification:** research / adapter-boundary conformance  
**Branch:** `work/b3-materios-provenance-evidence`

## Purpose

Exercise the two concrete negative vectors required by the Bitcoin L1 capability audit without selecting a production asset protocol or inventing Bitcoin-side economic semantics.

The test separates:

`Bitcoin transaction validity/inclusion`

from:

`IMMORTAL economic admission + semantic post-state`.

## Vectors

### BTC-NEG-01 — Valid Bitcoin transaction without IMMORTAL admission

A transaction may be structurally valid and observed on-chain while carrying no authenticated IMMORTAL admission reference.

Expected classification:

`CHAIN-OBSERVED / IMMORTAL-ADMISSION-MISSING`

It must not be promoted to `ExecAccept`.

### BTC-NEG-02 — Valid inclusion with semantic post-state mismatch

A transaction may be validly included while the observed outputs do not correspond to the already-certified IMMORTAL semantic result.

Expected classification:

`CHAIN-OBSERVED / POST-STATE-MISMATCH`

It must not be treated as an equivalent execution.

### BTC-REORG-01 — Observation invalidated by reorg status

A previously observed inclusion whose finality/reorg condition is no longer satisfied must be downgraded rather than silently retained as canonical evidence.

Expected classification:

`OBSERVATION-DOWNGRADED / REORG-UNCERTAINTY`

## Boundary

This harness deliberately does not choose:

- RGB / Taproot Assets / Liquid / Elements;
- a Bitcoin covenant construction;
- a USD valuation source;
- an IMMORTAL finality depth;
- a universal Bitcoin fee/economic policy.

Those remain profile decisions/open research surfaces.
