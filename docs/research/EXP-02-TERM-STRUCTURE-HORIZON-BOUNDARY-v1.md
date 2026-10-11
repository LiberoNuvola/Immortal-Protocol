# IMMORTAL — EXP-02 Term Structure / Time Horizon Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Investigate how a future IMMORTAL generalization can represent economic obligations, costs and risk over an explicit time horizon without silently replacing one horizon with another.

The current corpus already distinguishes mandatory future costs, expiry times and application/profile policy. This expansion asks whether the temporal dimension can become a reusable semantic axis.

## Candidate boundary

A horizon-sensitive computation should carry an explicit horizon/domain rather than relying on an implicit default.

At minimum the boundary requires:

1. the horizon is explicitly identified;
2. quantities claimed to be horizon-dependent identify the horizon they use;
3. a result cannot silently mix quantities from incompatible horizons;
4. expiry timing remains distinct from an economic-risk horizon;
5. missing horizon evidence is not converted into a default or unlimited horizon.

No universal duration, discount rate, term structure, forecasting model or time-weighting function is introduced.

## Existing anchors

The current IMMORTAL state already contains `MandatoryFutureCosts`, while PRE-RICH keeps ticket expiry as application/profile policy. The economic algorithm also requires future economic obligations to be accounted for before acceptance.

These anchors justify a temporal boundary but do not define a generalized term-structure algorithm.

## Open questions

- Which temporal domains are universal versus profile-specific?
- Are horizons discrete slots, timestamps, intervals, or abstract periods?
- How do obligations spanning multiple horizons compose?
- Can future-cost evidence be rolled forward?
- How does horizon selection interact with Ω and viability?
- Is any discounting economically admissible?

No production term-structure engine is introduced.

## Status

**EXP-02: RESEARCH BOUNDARY READY / TERM-STRUCTURE SEMANTICS OPEN.**
