# IMMORTAL — EXP-03 Asset Valuation / Haircut Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Extend EXP-03 beyond asset identity toward a separable valuation/haircut boundary, without selecting a universal valuation oracle, haircut percentage, liquidity model or settlement asset set.

## Candidate boundary

A value-bearing asset path must keep these facts distinct:

`AssetIdentity → Eligibility → ValuationEvidence → HaircutPolicy → ExecutableValue`

The boundary requires:

1. asset identity is explicit;
2. valuation evidence identifies its source/version;
3. haircut policy is explicitly declared when applicable;
4. no haircut may be silently invented from asset identity;
5. valuation evidence does not itself imply liquidity or ProtectedCapital treatment;
6. missing required valuation/haircut evidence produces **UNVERIFIABLE**.

No haircut number, oracle hierarchy, liquidity factor or concentration limit is introduced.

## Open questions

- universal versus profile-scoped asset sets;
- whether haircut is fixed, dynamic or state-derived;
- price-source independence;
- liquidity/depth requirements;
- rounding and settlement interaction;
- concentration/correlation risk.

## Status

**EXP-03-valuation: BOUNDARY READY / VALUATION & HAIRCUT SEMANTICS OPEN.**
