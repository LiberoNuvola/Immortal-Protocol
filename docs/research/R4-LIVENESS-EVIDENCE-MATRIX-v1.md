# R4 — Liveness / Progress Evidence Matrix v1

**Classification:** certification/evidence contract, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Operationalize the existing normative L1-L4 / FM1-FM10 boundary without turning liveness
into a safety assumption or inventing new progress guarantees.

The normative contract remains:

`Condition → Observable Event → Wake-up/Rediscovery → Candidate Construction → Permissionless Invocation → Independent On-chain Revalidation → Atomic Transition → Canonical State`

## Evidence layers

| Layer | What must be shown |
|---|---|
| L1 Proposal availability | at least one eligible proposer exists and the declared bound can be evidenced |
| L2 Input availability | authoritative inputs become available within their declared freshness boundary |
| L3 Delivery/inclusion | admissible proposals are not indefinitely suppressed by the tested substrate conditions |
| L4 Decider availability | the deciding component becomes available without introducing discriminatory starvation |
| Stall observability | a real stall can be classified into the existing FM1-FM10 categories |
| Safe stall | no unsafe action is introduced merely to restore progress |
| Recovery | only already-authorized recovery is invoked |
| Revalidation | state/evidence are rechecked at commit time |
| Atomicity | partial economic state changes are not accepted |

## Classification boundary

Use only the existing R4 categories:

- FM1 correct safety stall;
- FM2 certificate defect;
- FM3 acceptance-path defect;
- FM4 input unavailability;
- FM5 proposer absence;
- FM6 delivery failure;
- FM7 decider unavailability;
- FM8 inclusion/finality failure;
- FM9 censorship;
- FM10 over-conservative certificate.

The exact category definitions remain those of the normative R4 proof specification.

## Evidence packet for a real incident

A stall/progress packet should bind:

- canonical pre-state/reference;
- expected eligible action;
- required authoritative inputs;
- observation timestamps;
- proposer/decider/delivery observations where available;
- gate result;
- selected R4 classification;
- recovery action, if any;
- final outcome;
- exact source/toolchain/runtime references.

## Negative conformance

The implementation must demonstrate that the following are rejected:

- weakening Safe to obtain progress;
- narrowing Ω to manufacture viability;
- enlarging Kc without a new certificate;
- allowing a relayer/operator to override admission;
- treating missing obligations as surplus.

A safe stall is preferable to an unsafe commit.

## Deployment boundary

The universal specification does not claim that L1-L4 hold in every deployment.

A deployment claiming progress must provide deployment-specific evidence for the declared
assumptions. Where such evidence is unavailable, the correct status is **NOT DISCHARGED**,
not GREEN and not a global liveness claim.

## Current status

- L1-L4 normative definitions: **CLOSED**
- T-PROG conditional theorem: **CONDITIONALLY PROVEN**
- FM1-FM10 taxonomy: **CLOSED**
- Real deployment evidence: **OPEN**
- Stall observability instrumentation: **OPEN**
- Safe recovery evidence: **OPEN**
