# IMMORTAL — EXP Cross-Function Conformance v1

**Classification:** research / executable conformance target  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Verify that EXP-01…EXP-12 can be treated as distinct instances of the same generalized derivation boundary without collapsing their domain, rule, evidence, bounds or authority.

This artifact does not introduce economic parameters, governance rules, or production semantics.

## Common boundary

Each EXP family is modeled as:

`B = (D, R, I, L, E, V, C, X)`

and must preserve:

`Explore → CandidateSet → Certify → Adopt(existing authorized path)`

## Required cross-family properties

- **Domain isolation:** an EXP candidate cannot silently become a candidate of another EXP family.
- **Rule identity:** each derived result retains its declared rule version.
- **Evidence binding:** missing evidence is `UNVERIFIABLE`.
- **Bounds:** an explicit out-of-bound condition is `REJECTED`.
- **Non-sovereignty:** the derivation engine cannot rewrite the boundary that authorizes it.
- **Adoption separation:** certification does not itself mutate canonical state.
- **Search transparency:** this harness does not infer complete coverage from a partial candidate set.
- **Adapter neutrality:** the common derivation result exists before chain-specific encoding.

## EXP catalog

EXP-01 Typed obligations / seniority  
EXP-02 Term structure / time horizon  
EXP-03 Asset eligibility / valuation / haircut provenance  
EXP-04 Composition of profiles  
EXP-05 Abstract contingent claims  
EXP-06 Evidence-as-input  
EXP-07 Regime / hysteresis  
EXP-08 Netting / offset  
EXP-09 Obligation transfer / novation  
EXP-10 Explicit risk budget  
EXP-11 Deterministic auction / allocation  
EXP-12 Observer / authority split

## Promotion boundary

A passing cross-function toy demonstrates architectural reuse only. It does **not** close the individual EXP semantics, production implementation, institutional authorization, or real evidence requirements.
