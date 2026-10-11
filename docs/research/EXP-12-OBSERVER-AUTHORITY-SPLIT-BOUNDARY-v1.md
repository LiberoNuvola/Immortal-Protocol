# IMMORTAL — EXP-12 Observer vs Authority Split Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Generalize an architectural separation already visible across IMMORTAL: an observer may report evidence/facts, but observation alone does not create protocol authority.

## Candidate boundary

The research model separates:

`Observation → Evidence → Authorization`

An observer may:

- collect or report an observation;
- attach provenance;
- expose uncertainty/staleness;
- be one candidate evidence source.

An observer may not, merely by producing an observation:

- redefine the governing rule;
- change the authoritative state;
- grant itself economic authority;
- grant itself governance authority;
- suppress a required competing or independent verification path.

Authority must come from the separately defined authorization boundary.

Missing, stale, conflicting, or unverified observation therefore remains a boundary condition rather than a reason to infer authority.

## Existing architectural anchor

The repository already treats relayer/keeper/operator components as executor/observer roles rather than economic authority, and the B3 work explicitly separates observation from authoritative finality/evidence.

This EXP axis extracts that separation as a reusable generalization; it does not replace the existing B3 or Governance contracts.

## Boundary conformance

The executable boundary requires:

- an explicitly verified observation identity;
- an explicit provenance/evidence reference for that observation;
- a separately supplied authorization boundary with its own authority reference;
- preservation of those identities across the authorization result;
- fail-closed behavior when verification, provenance, or authority identity is missing.

Mutation of observation identity remains distinguishable from the separately supplied authority identity. This is an identity/provenance check only; it does not define which authority is institutionally valid.

## Open questions

- Which evidence classes can be single-source?
- When is corroboration mandatory?
- How are competing observers resolved?
- Which authority transitions are explicit governance decisions?
- How is observer misbehavior contested or revoked?

## Status

**EXP-12: RESEARCH BOUNDARY READY / AUTHORITY SEMANTICS OPEN.**
