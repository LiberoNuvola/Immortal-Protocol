# IMMORTAL — EXP-03 Asset Eligibility Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Define the reusable shape of asset eligibility without inventing a universal asset whitelist, valuation rule, haircut, liquidity assumption, or oracle policy.

## Eligibility relation

An asset may participate in an economically material path only when the applicable profile/deployment has already authorized:

`AssetIdentity + EvidenceContract + Valuation/SettlementSource`

The boundary checks that the observed asset identity and the declared profile identity agree.

## Separation

Asset eligibility is distinct from:

- valuation;
- liquidity;
- ProtectedCapital;
- protocol revenue classification;
- reward budget;
- governance authority.

Being eligible for observation does not imply that the asset is liquid, valued, protected, or distributable.

## Fail-closed behavior

The boundary returns **UNVERIFIABLE** when required identity/evidence is absent.

It returns **REJECTED** when the observed asset identity conflicts with the authorized profile identity.

No automatic haircut, oracle substitution, liquidation assumption, or fallback asset is introduced.

## Profile ownership

The concrete set of eligible assets remains profile/application scoped until an explicit normative IMMORTAL decision defines a universal set.

This preserves the existing IMMORTAL separation between universal semantic machinery and application-specific economic parameters.

## Status

**EXP-03-minimal: CONFORMANCE BOUNDARY READY / CONCRETE ASSET SET OPEN.**
