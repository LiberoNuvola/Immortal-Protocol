# IMMORTAL — EXP-08 Netting / Offset Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Investigate whether independently established obligations may be netted without erasing the identity, provenance, or protected status of the underlying obligations.

This is a generalization axis only. No netting right is added to the current IMMORTAL or PRE-RICH economic semantics.

## Candidate boundary

A netting operation should be considered only when:

1. the obligations being offset are explicitly identified;
2. each obligation is independently admissible under its applicable rule;
3. the resulting net position is deterministically reproducible;
4. the underlying gross positions remain auditable;
5. netting cannot silently convert a protected obligation into discretionary surplus;
6. absence of an authorized netting relation is a non-admissible condition rather than an inferred offset.

No universal netting formula, priority rule, collateral rule, or eligibility relation is defined here.

## Open questions

- Which obligation classes may be offset?
- Is bilateral consent required?
- Can obligations with different settlement assets be netted?
- How are timing/horizon differences handled?
- How does netting interact with ProtectedCapital and WorstCaseExposure?
- Is netting reversible, and how is the gross history preserved?

## Status

**EXP-08: RESEARCH BOUNDARY READY / NETTING SEMANTICS OPEN.**
