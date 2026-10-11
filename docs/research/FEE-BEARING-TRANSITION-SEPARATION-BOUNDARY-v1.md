# IMMORTAL — Fee-Bearing Transition Separation Boundary v1

**Classification:** research / architectural conformance
**Branch:** `work/b3-materios-provenance-evidence`
**Date:** 2026-10-12

## Purpose

Turn the existing fee workflow's Layer A / Layer B / Layer C separation into an executable boundary without selecting a fee amount, settlement asset, oracle, rounding rule, or deployment parameter.

## Canonical separation

A fee-bearing candidate is modeled as:

`TransitionCandidate(S,A) → EconomicFeeTarget → validated settlement amount → Adapter realization → atomic commit`

The fee is a property of the transition. It is **not** a parallel economic lifecycle.

The chain execution cost remains a distinct observation:

`TotalCost = ProtocolUsageFee + ChainExecutionCost`

The Adapter cannot use its execution cost to rewrite the EconomicFeeTarget.

## Required boundary properties

1. **Single fee identity:** one Protocol Usage Fee category per fee-bearing transition.
2. **Distinct chain cost:** ChainExecutionCost remains a separate chain-level cost/evidence field.
3. **Target immutability:** settlement construction cannot mutate the EconomicFeeTarget.
4. **Reference fail-closed:** missing/invalid reference cannot produce an arbitrary settlement.
5. **Conversion fail-closed:** an unrepresentable or out-of-bounds amount cannot be silently accepted.
6. **Safety precedence:** fee payment cannot make an otherwise unsafe transition admissible.
7. **Atomicity:** a fee-bearing transition cannot commit a fee separately from its required canonical transition.
8. **No fee state machine:** adding fee data does not create a second canonical economic state lifecycle.
9. **Adapter non-sovereignty:** Cardano settlement mechanics may realize the contract but cannot redefine its economic meaning.

## What remains open

This boundary does not choose:

- a universal fee denomination or amount;
- a concrete settlement asset;
- a concrete oracle/reference source;
- freshness/deviation parameters;
- rounding direction or error bounds;
- a concrete affordability policy;
- a canonical fee-bearing application transition.

Those remain deployment/normative decisions in their existing workflow.

**Status: RESEARCH / CONFORMANCE BOUNDARY ONLY.**
