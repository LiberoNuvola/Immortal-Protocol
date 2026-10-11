# AG-01 — Executable Algorithmic Governability Conformance Matrix v1

**Classification:** governance conformance / research evidence, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Map the existing AG-01 authority-boundary requirements onto executable repository evidence
without introducing a new governance algorithm.

The governing property remains:

> No executable algorithmic path can obtain more authority than the constitutional/ruleset
> boundary already grants it.

## Existing executable surfaces

The repository already exposes:

- `GovernanceAuthorization.authorizationValid`;
- `GovernanceAuthorization.evidenceValid`;
- `GovernanceAuthorization.rulesetAuthorizationValid`;
- `GovernanceConformance.lifecycleEventAdmissible`;
- `GovernanceCanonicalReplay.replayCanonical`;
- `RulesetRegistry.registerRuleset`;
- canonical commitment validation;
- dedicated GOV-18 lifecycle handlers.

The existing governance tests are reusable and should be extended only where a current
obligation is genuinely uncovered.

## Conformance matrix

| AG | Requirement | Existing executable evidence | Remaining closure |
|---|---|---|---|
| AG-01 | Candidate cannot self-authorize | actor/event matrix + negative role mismatch test | add explicit negative candidate-path vector |
| AG-02 | Candidate cannot weaken an invariant | governance gate + state/lifecycle validation surfaces | adversarial invariant weakening vector |
| AG-03 | Environment is input, not authority | canonical event payload + replay | explicit environment-derived candidate vector |
| AG-04 | Ruleset identity is bound to decision | ruleset compatibility + commitment checks | independent replay vector with mutated commitment/version |
| AG-05 | Amendment distinct from operational adaptation | immutable RulesetRegistry + amendment requirement tests | explicit operational-vs-amendment replay trace |
| AG-06 | Verified candidate becomes canonical only through atomic transition | canonical replay + dedicated lifecycle handlers | full candidate→canonical negative/positive trace |
| AG-07 | Deterministic replay | canonical replay deterministic test | independent second implementation/replay artifact |
| AG-08 | Stale/incompatible ruleset rejected | ruleset version/commitment validation | stale-effective-time vector |
| AG-09 | Application policy cannot silently become universal law | state/profile ownership map | executable profile-boundary mutation test |
| AG-10 | External authority/provenance explicit | evidenceRefs + authorization + canonical event | provenance-required end-to-end replay vector |

## Immediate executable delta

The existing `GovernanceCanonicalEventTest.hs` already covers:

- canonical commitment correctness;
- predecessor binding;
- actor-role mismatch rejection;
- incompatible commitment rejection;
- unregistered ruleset rejection;
- replay determinism;
- direct collapsed lifecycle rejection.

The existing `GovernancePhase6Test.hs` already covers:

- lifecycle timing boundaries;
- ruleset immutability;
- amendment separation;
- commitment algorithm declaration.

Therefore this work does **not** justify creating a parallel governance engine or
duplicating the existing tests.

The smallest next test addition is a dedicated AG-01 negative matrix that reuses the current
authorization/replay APIs and asserts that a result cannot promote itself into an authorized
event merely by changing its own actor class, ruleset commitment, or lifecycle target.

## Required negative vectors

At minimum, the executable matrix should reject:

1. valid payload + unauthorized actor class;
2. valid actor + mutated ruleset commitment;
3. valid ruleset + unregistered ruleset version;
4. valid event + predecessor mismatch;
5. valid operational event + direct transition to canonical state;
6. adopted/approved result attempting to bypass the dedicated lifecycle predecessor chain.

These are tests of existing boundaries, not new governance policy.

## Evidence discipline

A passing test establishes bounded executable conformance only.

It does not prove:

- constitutional completeness;
- real-chain governance execution;
- universal non-sovereignty under arbitrary future code;
- correctness of a human/community governance process outside the executable boundary.

Those remain separate evidence layers.

## Closure condition

AG-01 can move from OPEN only when:

`normative authority boundary + executable negative tests + deterministic replay + evidence provenance`

are all present for AG-01..AG-10, with no result-dependent self-promotion path.

Current status: **OPEN / executable negative evidence advancing**.
