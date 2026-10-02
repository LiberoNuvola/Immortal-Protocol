# IMMORTAL — R2 RF1–RF11 Recovery Delta
Date: 2026-09-24

## New triangulated finding

The RF taxonomy is partially recoverable from the authoritative Notion M5 implementation/conformance trail.

M5 states that the next artifact is an implementation conformance matrix RF1–RF11 and explicitly records:
- RF8 — no-side-door: NOT DISCHARGED.
- RF5 — protected-capital correspondence: NOT DISCHARGED.
- RF2/RF3: NOT DISCHARGED; no complete rho + action/transition proof.
- RF4/RF9/RF10/RF11: partial evidence from existing B1 checks/tests, but no v3.0.0 conformance certificate.
- intended chain: SPEC → rho → implementation state → EconomicKernel → concrete PRE-RICH state → Cardano Adapter → evidence.

Therefore the earlier conclusion is refined: RF1–RF11 are not wholly unrecoverable, but their complete numbered definitions are still not available as one canonical RF list in the repository/search results.

## Correlated implementation evidence

Repository commit 41d2ec26afcdbb21d4dacce4beac2ff39e99d267 contains the CAES composition witness:
- v3TransitionValid
- refinementExact
- semanticEncodingValid

Each false witness is explicitly rejected and tested negatively.

This demonstrates a fail-closed composition boundary. It does not prove the underlying witness claims.

## B4/B5 conformance correlation

The Notion B4/B5 surgical pass records:
- PC-01 Coverage OPEN
- PC-02 No double counting UNPROVEN
- PC-03 no-hidden-exposure defect boundary identified
- PC-04 Provenance UNPROVEN
- PC-05 Unit/perimeter consistency PARTIAL
- PC-06 Adapter preservation OPEN
- PC-07 Derived/accounting separation PARTIAL
- B5 action-by-action Cardano equivalence and all-path gate evidence pending
- B6 V3/Cardano semantic equivalence OPEN

These findings materially reinforce the M5 RF5/RF8/RF2/RF3 status.

## T2 conformance specification

Notion T2 defines G1–G8 as implementation/conformance requirements and explicitly says the specification does not itself prove implementation conformance. Requirements include:
- ledger-verifiable transitions;
- fail-closed behavior;
- canonical state-derived economic values;
- atomicity;
- deterministic negative/boundary testing;
- evidence separating emulator/reference-model results from ledger/on-chain proof.

## Current classification

R2 remains OPEN / CLOSING EVIDENCE, not DISCHARGED.

Do not assign a full RF1–RF11 score until the crystallized v3.0.0 verification package or canonical M5 artifact containing the complete RF definitions is recovered.

## Next action

Search Library for the crystallized v3.0.0 verification package and M5 implementation-conformance artifacts. Then extract the exact RF1–RF11 definitions and map each requirement to N/I/P/R/F/A/E evidence.

No economic or architectural semantics are changed.
