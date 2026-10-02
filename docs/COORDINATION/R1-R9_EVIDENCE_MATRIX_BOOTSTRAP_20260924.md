# IMMORTAL — R1–R9 Evidence Matrix Bootstrap
Date: 2026-09-24

## Purpose

Operational evidence matrix, not a normative specification. It tests the claim that R2 should be treated as the sole critical internal closure block rather than assuming that claim.

## Triangulated basis

Sources used:
1. current working-branch coordination file;
2. current repository search/results for refinement and transition evidence;
3. attached external roadmap analysis;
4. current Cardano Developer Portal documentation for transaction/redeemer/CBOR semantics and provider surfaces.

The attached analysis correctly identifies evidence/conformance as the present bottleneck, but its calendar estimate and its conclusion that Gate 41 should simply be abandoned are not treated as established facts.

## Evidence model

For each R-front distinguish:
- N = normative requirement identified;
- I = implementation exists;
- P = positive test/evidence exists;
- R = negative/regression evidence exists;
- F = refinement/formal proof exists;
- A = adapter/ledger evidence exists;
- E = external/independent evidence exists.

A front is not considered DISCHARGED merely because I or P is true.

## Initial matrix

| Front | Current repository signal | Immediate evidence question | Preliminary status |
|---|---|---|---|
| R1 | Kernel/profile/refinement artifacts exist | Which concrete profile instance is certified end-to-end, and which evidence packet binds it? | NEEDS AUDIT |
| R2 | V3 transition/refinement/semantic witness artifacts exist | Map RF1–RF11 individually; distinguish positive tests from regression/negative proof and identify missing witnesses | NEEDS AUDIT |
| R3 | Adapter and Cardano integration work exists | Which Omega/state outcomes are covered by observed ledger evidence, not only simulation? | NEEDS EVIDENCE |
| R4 | Liveness is explicitly distinguished from local safety | Identify concrete actor/substrate assumptions and the evidence boundary | OPEN |
| R5 | Governance/upgrade material exists | Identify an executed upgrade/governance transition and its evidence; documentation alone is insufficient | OPEN |
| R6 | Composition is documented as a later/secondary obligation | No reason to treat this as a mainnet prerequisite until the single-system evidence baseline is established | DEFERRED, NOT CLOSED |
| R7 | Accounting/partitioning work exists | Verify one canonical treasury/partition model against implementation and evidence | NEEDS AUDIT |
| R8 | Economic submission boundary + mutation inventory + transition-evidence binding now have implementation/regression coverage | Verify canonical fingerprint provenance, exact cross-validator identity, Treasury membership, and ledger refinement; infrastructure submission is explicitly separated from economic submission | PARTIAL / NEEDS EVIDENCE |
| R9 | Oracle/evaluation completeness is an evidence front | Establish what constitutes complete Omega coverage and which outcomes remain unmodeled | NEEDS EVIDENCE |

## State-boundary finding

The current branch still contains PRE-RICH-shaped state concepts in V3, including TicketClassState, EconomicControlState and JackpotState. At the same time, concrete class prices and payout multiplier have already been externalized through EconomicProfile.

Therefore the present architectural condition should be described as:

**parameter separation improved; semantic/state separation incomplete.**

Do not perform destructive extraction until consumers, specifications and tests are mapped.

## Gate 41 disposition

Gate 41 is not a reason to stop R2/B4/B5/B6 work. However, it should not be described as disposable historical trivia either. Its remaining gap is narrowly defined: acquisition of the historical mint-purpose witness / serialized witness-bearing transaction artifact.

Operational rule:
- continue a bounded primary-artifact recovery sweep;
- do not spend further effort interpreting the 3 ADA or 10 ADA semantics without the primary witness;
- if the primary artifact remains unavailable after the bounded sweep, record an external-artifact dependency and freeze interpretation.

## Mainnet-readiness rule

Do not convert the attached 6–12 month estimate into a project planning commitment. The repository evidence is not yet sufficient to derive a calendar estimate.

Instead, first complete this matrix with concrete artifacts and dependencies. Only then derive remaining work from measured gaps.

## Next operational sequence

1. Populate R2 RF1–RF11 evidence rows, including the new RF8 admission/fingerprint boundary.
2. Audit state-boundary consumers before any extraction.
3. Continue B4/B5/B6 in parallel.
4. Run one bounded Gate 41 primary-witness recovery sweep.
5. Audit R1/R3/R7/R8/R9 using the same evidence taxonomy.
6. Keep governance as an active front; do not defer it merely because Gate 41 exists.
7. Recompute mainnet-readiness only from the resulting evidence matrix.

## Non-regression

This document changes no economic constant, validator rule, governance rule, transaction-size limit, or canonical semantic decision.
