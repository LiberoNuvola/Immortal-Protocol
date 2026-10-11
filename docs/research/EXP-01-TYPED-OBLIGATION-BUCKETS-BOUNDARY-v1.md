# IMMORTAL — EXP-01 Typed Obligation Buckets Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Make the already-existing ProtectedCapital component interface explicit as the first IMMORTAL expansion axis without inventing a new obligation taxonomy, reserve formula, coefficient, or economic authority.

## Existing semantic components

The current canonical implementation exposes the following protected-capital inputs:

- `CrystallizedLiabilities`
- `WorstCaseExposure`
- `SafetyCapital`
- `ReserveProtection`
- `MandatoryFutureCosts`
- `additionalProtected`

The current implementation also preserves the locked Jackpot fields across the V3 lifecycle. This boundary deliberately does not reinterpret `additionalProtected` as a new semantic category.

## Interface

The existing partition relation is:

`ProtectedCapital = liabilities + exposure + safety + reserveProtection + futureCosts + additionalProtected`

The boundary treats each input as a separately named component and requires explicit representation before summation.

This is an interface/conformance contract, not a proof that the represented components are exhaustive or mutually disjoint.

## Required properties

1. A component may not disappear silently at the representation boundary.
2. A missing protected component is not converted to surplus.
3. Units and valuation provenance remain the responsibility of the existing economic/observation boundary.
4. The numeric PRE-RICH multiplier remains profile/application-scoped.
5. The boundary does not infer semantic meaning for an otherwise unclassified amount.
6. Locked Jackpot protection remains separately preserved by the existing state-preservation contract.

## Fail-closed interpretation

If a required component cannot be represented or verified for the applicable transition, downstream economic authorization must remain unavailable rather than treating the missing amount as zero protected capital.

## Non-claims

This boundary does not prove:

- exhaustive coverage of all future protected obligations;
- absence of double counting;
- a new reserve formula;
- universality of the PRE-RICH 500 multiplier;
- a new Treasury rule;
- a new economic state machine.

## Status

**EXP-01-light: CONFORMANCE BOUNDARY READY / ECONOMIC COMPLETENESS OPEN.**
