# IMMORTAL — EXP-06 Evidence-as-Input Boundary v1

**Classification:** research / architectural conformance  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Define the EXP-06 research boundary for using certified evidence as an input to a derivation without allowing the derivation engine to manufacture, weaken or self-authorize the evidence contract.

## Boundary

`EvidenceBoundInput = (sourceReference, observationReference, evidenceDigest, evidenceVersion, verificationStatus)`

The derived function may consume evidence only when its provenance and verification status are externally supplied and version-bound.

## Required properties

- missing evidence → `UNVERIFIABLE`;
- malformed or unverifiable evidence → `UNVERIFIABLE`;
- altered evidence identity/digest → reject or invalidate the dependent result;
- evidence source does not become normative authority merely by being an input;
- evidence cannot redefine the rule, domain, bounds or adoption path;
- evidence version remains distinguishable from derivation-rule version.

## Non-sovereignty

EXP-06 does not create an evidence oracle or a second authority system.

`Evidence → Input`

does not imply:

`Evidence → RuleAuthority`

and does not permit:

`Evidence → SelfCertification`.

## Promotion gate

The boundary is promoted only when executable tests demonstrate provenance binding, version separation, fail-closed handling of missing/invalid evidence and preservation of the existing authorized adoption path.

**Status: OPEN RESEARCH / CONFORMANCE TARGET.**
