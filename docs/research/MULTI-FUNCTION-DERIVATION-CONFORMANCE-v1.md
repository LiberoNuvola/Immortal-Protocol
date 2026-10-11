# IMMORTAL — Multi-Function Generalized Derivation Conformance v1

**Classification:** research / architectural conformance
**Branch:** `work/b3-materios-provenance-evidence`
**Date:** 2026-10-11

## Purpose

Extend the generalized derivation contract from a conceptual common shape to a reusable conformance target across multiple function families, without creating a universal policy authority.

## Common contract

Every derived result must be traceable to:

`B = (D, R, I, L, E, V, C, X)`

and to the pipeline:

`Explore → CandidateSet → Certify → Adopt(existing authorized path)`

The same machinery may host multiple families while preserving their distinct semantics.

## Conformance families

The current research families are:

- Fee target;
- Reward budget;
- Code contribution reward;
- Review contribution reward;
- governance eligibility/membership;
- profile-scoped adaptive parameters;
- future multi-adapter semantic derivations.

Sharing the machinery does not make the functions economically equivalent.

## Required invariants

### I1 — Domain isolation

Each family has an authorized domain `D`. A candidate from one family cannot silently widen another family.

### I2 — Rule identity

Every result carries an immutable or otherwise verifiable `Version` binding to the authorized derivation rule.

### I3 — Evidence binding

A result is not admissible when required evidence is missing, stale, malformed, or unverifiable.

### I4 — Bounds

Declared limits are checked independently of the algorithm that generated the candidate.

### I5 — Non-sovereignty

The derivation engine cannot alter its own rule, evidence predicate, domain, limits, or authority path.

### I6 — Search transparency

The engine must distinguish declared search space from the portion actually explored. Partial search is not a complete normative universe.

### I7 — Adoption separation

Candidate generation/certification cannot itself mutate canonical state. Adoption occurs only through an already-authorized path.

### I8 — Adapter semantic preservation

When a result is realized on different chains, each Adapter may change representation/serialization but must preserve the universal semantic result and rule identity.

## Conformance matrix

| Family | Derived object | Evidence gate | Bound gate | Authority path |
|---|---|---|---|---|
| Fee | FeeTarget | certified economic/transition inputs | authorized fee bounds | existing economic transition |
| Reward | RewardTarget | verified contribution + budget | certified RewardBudget | existing reward settlement path |
| Governance | Eligibility/weight candidate | authorized governance evidence | governance limits | existing governance adoption |
| Multi-adapter | Universal Result | certified inputs + rule version | semantic invariants | adapter settlement only |

This matrix is a research conformance target, not a declaration that all rows are currently implemented.

## Promotion gate

The generalized layer may be promoted only when independent tests show:

1. multiple families use the same boundary;
2. one family cannot mutate another family's rules;
3. partial search cannot become a complete normative claim;
4. evidence failures become `UNVERIFIABLE`;
5. bound violations become `REJECTED`;
6. result adoption remains separate;
7. adapter representations preserve semantic result identity.

**Status: OPEN RESEARCH / CONFORMANCE TARGET.**
