# Beacon 4 — Independence, Conflict and Degraded-Mode Matrix v1

## Classification

**Research / non-normative.** Beacon 4 remains a hypothesis/research track. This document does not make B4 normative, does not set a quorum, and does not make B4 a prerequisite for B1/B2/B3 closure.

## 1. Security property

The proposed additional property over B3 is:

> A canonicality result is accepted only when multiple proof paths provide genuinely independent corroboration according to explicitly declared independence assumptions.

Redundancy alone does not count. Two wrappers over the same assertion are one trust source.

## 2. Independence dimensions

Each candidate proof path should be evaluated independently on these dimensions:

| Dimension | Question |
|---|---|
| Implementation | Is the verifier/prover implemented independently? |
| Operator | Are the signing/serving operators independent? |
| Infrastructure | Are hosts, networks and failure domains independent? |
| Source acquisition | Do the paths acquire evidence independently? |
| Cryptographic | Are witnesses/proof systems independently generated? |
| Governance | Can one actor rewrite/disable all paths accepted by the policy? |

A path is not automatically independent merely because its software package has a different name.

## 3. Candidate path matrix

| Path | Role | Current classification |
|---|---|---|
| Materios / B3 | external consensus/finality | baseline B3 path |
| Independent consensus verifier | re-verification of the same checkpoint | OPEN |
| Independent state-proof path | state corroboration | OPEN |
| Cardano / Mithril-side evidence | Cardano anchor/state corroboration | CANDIDATE |
| External oracle/data network | external observation corroboration | CANDIDATE |
| IMMORTAL Provider | evidence provider/verifier | OPEN; cannot self-certify its own economic input |

## 4. Evidence-path scoring is not yet frozen

No numerical score, weighted sum, or “majority wins” rule is authorized by this document.

Before any quorum is frozen, research must answer:
- which independence dimensions are mandatory;
- which failures can be tolerated;
- whether independence is conjunctive or class-based;
- how correlated infrastructure failures are treated;
- how a compromised source that agrees with another source is handled.

## 5. Conflict matrix

| Situation | Required result |
|---|---|
| All required paths agree and satisfy independence assumptions | Candidate canonical result |
| Optional path unavailable | Apply only a previously declared degraded-mode rule |
| Required path unavailable | No canonical result unless an authorized new-round policy explicitly permits degradation |
| Paths disagree | **CONFLICT / NO CANONICAL RESULT** |
| One path malformed | Reject that path; apply explicit quorum policy; never silently substitute |
| Replay/equivocation detected | Reject affected evidence |
| Anchor/state inconsistency | Reject |
| Stale evidence | Reject or enter an explicitly defined stale state; never silently reuse |
| Independence cannot be demonstrated | No B4 acceptance |

No conflict path may silently fall back to B3 for an already-created B4 round.

## 6. Trust-mode freeze

The trust mode is selected before the round commitment.

Example:

`Round R -> B4`

Once committed:
- loss of a B4 path does not retroactively rewrite the round as B3/B2/B1;
- a weaker mode may be selected only for a new round under an explicit policy;
- the resulting mode and evidence expectations must be part of the round context.

## 7. IMMORTAL Provider boundary

IMMORTAL may be an evidence provider/verifier only when its output is:
- reproducible from public inputs;
- independently challengeable;
- separated from the economic decision path where necessary;
- not derived from the same IMMORTAL economic result that it is being asked to certify.

Therefore:

`IMMORTAL economic calculation != proof of its own external input`

The provider must not count as an additional independent root merely because it is a separate component.

## 8. Research tests

Before B4 promotion, implement adversarial cases for:
- same source presented through multiple wrappers;
- shared infrastructure outage;
- correlated operator compromise;
- stale-but-consistent sources;
- contradictory roots;
- equivocation between two checkpoints;
- duplicated evidence under different identifiers;
- one-path Byzantine response;
- loss of an optional path;
- loss of a mandatory path;
- attempted retroactive trust-mode downgrade.

Expected outcomes must be deterministic and explicit.

## 9. Promotion gate

Beacon 4 can leave **HYPOTHESIS / OPEN** only when all are present:

1. deterministic verifier;
2. explicit independence assumptions;
3. explicit conflict semantics;
4. explicit degraded-mode semantics;
5. adversarial tests;
6. reproducible evidence showing a security property beyond B3.

No quorum number is invented by this document.

## 10. Non-regression

Beacon 4 must not:
- alter IMMORTAL economic semantics;
- replace ProtectedCapital, Economic Gate or Viability;
- turn governance into proof;
- treat multiple identical sources as independent merely because they are separately reachable;
- become a prerequisite for the first real PRE-RICH ticket;
- modify V3, Reveal or existing B3 semantics.

## 11. Status

**OPEN / research contract.**
