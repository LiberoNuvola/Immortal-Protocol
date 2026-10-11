# IMMORTAL — EXP-11 Deterministic Auction / Allocation Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Investigate deterministic allocation mechanisms without letting caller order, observer choice, or implementation incidental behavior become an unstated allocation rule.

## Candidate boundary

A future allocation mechanism must make its allocation rule explicit before execution.

The boundary requires:

1. the candidate set is explicit;
2. the resource/budget available to allocate is explicit;
3. the allocation rule/version is explicit;
4. the result is deterministic for the same certified inputs;
5. an unresolved tie cannot be silently broken by iteration order;
6. total allocation cannot exceed the certified allocatable amount.

This boundary deliberately does not select a canonical auction algorithm or tie-break policy.

## Open questions

- auction vs non-auction allocation;
- eligibility constraints;
- objective function;
- tie-breaking;
- partial fills;
- fairness/priority semantics;
- interaction with governance and risk budgets.

No allocation authority is granted by this research boundary.

## Status

**EXP-11: RESEARCH BOUNDARY READY / ALLOCATION RULE OPEN.**
