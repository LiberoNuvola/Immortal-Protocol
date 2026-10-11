# IMMORTAL — EXP-10 Explicit Risk Budget Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Separate an explicitly declared risk budget from realized exposure and from ProtectedCapital, so that a future risk-budget mechanism cannot silently become an economic reserve or an automatic permission to exceed exposure.

## Candidate boundary

The research model distinguishes:

`RiskBudget`  
`RealizedExposure`  
`ProtectedCapital`

A candidate admission relation may consume only declared budget, while realized exposure remains an observed/derived state quantity.

The following are intentionally **not** defined:

- a universal risk-budget formula;
- a risk appetite coefficient;
- a mapping from risk budget to payout;
- automatic budget expansion;
- automatic conversion of unused budget into surplus.

When the budget is absent or unverified, the boundary must not manufacture a budget value.

## Open questions

- Who declares/approves the budget?
- Is budget global, per profile, per asset, per action, or per horizon?
- How does budget interact with Ω and viability?
- How is budget released after exposure crystallizes or expires?
- Can statistical reserve contribute to budget?
- What evidence proves budget freshness and authority?

## Status

**EXP-10: RESEARCH BOUNDARY READY / RISK-BUDGET SEMANTICS OPEN.**
