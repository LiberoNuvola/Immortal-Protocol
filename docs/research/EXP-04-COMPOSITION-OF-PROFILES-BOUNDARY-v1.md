# IMMORTAL — EXP-04 Composition of Profiles Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Investigate whether independently declared IMMORTAL economic profiles can be composed without merging application authority, silently changing profile semantics, or creating precedence rules that were never authorized.

This expansion generalizes the existing architecture:

`Application → Application Economic Profile → IMMORTAL → Adapter`

The current repository already represents application economic parameters through `EconomicProfile`, while PRE-RICH supplies its own concrete `PreRichEconomicProfile`. Composition is therefore a research question above the current single-profile realization, not a request to change PRE-RICH.

## Existing evidence

The current `EconomicProfile` contains:

- a profile version;
- application class/price declarations;
- an application-scoped maximum normal payout multiplier.

The PRE-RICH profile is explicitly application-scoped. The state ownership matrix also keeps PRE-RICH class decomposition and Jackpot policy outside universal IMMORTAL state.

These facts support a composition boundary, but do not yet define a canonical composition algorithm.

## Candidate boundary

A composed configuration is admissible only when:

1. each contributing profile remains explicitly identifiable;
2. each profile has an explicit version;
3. every composed parameter has an unambiguous owner;
4. conflicting declarations are detected rather than silently overridden;
5. composition does not grant one profile new governance or economic authority over another;
6. the resulting configuration can be deterministically reconstructed from the declared inputs.

No precedence rule is assumed. No implicit "last writer wins" rule is introduced.

## Separation of concerns

Composition is distinct from:

- profile-local economic policy;
- universal kernel interpretation;
- governance authority;
- adapter settlement;
- runtime observation.

A composition mechanism must not turn a convenience merge operation into a new normative authority.

## Open semantic questions

Still OPEN:

- whether profiles may share a namespace/domain;
- whether composition is only for orthogonal policy modules or also for complete economic profiles;
- whether conflicts are always rejection or may be resolved by an explicitly governed precedence relation;
- whether shared protected capital can ever be composed across profiles, and under what ring-fencing proof;
- how version compatibility is defined.

Until these are explicitly decided, no production profile composition type should be introduced.

## Minimal adversarial conformance

The bounded harness checks only the following research properties:

- separate profile identity is preserved;
- versions remain explicit;
- ambiguous key collisions are rejected;
- composition order cannot silently select a winner;
- profile data does not acquire governance authority merely by being composed.

Passing this harness is evidence for the boundary only. It does not prove economic soundness, shared-capital safety, or production composition.

## Status

**EXP-04: RESEARCH BOUNDARY READY / COMPOSITION SEMANTICS OPEN.**
