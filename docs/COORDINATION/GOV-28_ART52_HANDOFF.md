# GOV-28 — Art. 52/53 Conflict Protection Handoff

Date: 2026-09-23
Branch: `work/immortal-green-closure`

## Source triangulation

Direct current-branch inspection of `docs/CONSTITUTION.md` verified:

- Art. 52 requires protection against replay, cross-round/cross-game substitution, stale checkpoints, duplicate canonicalization, double claim, and conflicting root acceptance.
- Art. 53 requires one-shot canonicalization: a round cannot be finalized twice with different roots except through an explicitly defined compatible protocol upgrade; valid canonicalization is monotonic.

This is constitutional evidence, not a new governance decision.

## GOV-28 consequence

The existing predecessor check proves chain continuity but does **not** prove conflict protection.

Required implementation/conformance property:

`same canonical predecessor + incompatible successors -> at most one canonical successor`

Additional negative twins:

1. same round + second canonicalization with a different root -> REJECT;
2. replay of an already-consumed canonicalization identity -> REJECT;
3. stale governance checkpoint used as canonicalization basis -> REJECT;
4. two structurally valid successors sharing a predecessor but conflicting in canonical state/root -> REJECT.

## Boundary rule

Do not invent a new serialization, hash field, or database structure solely from Art. 52/53.

First identify the existing canonical state/root identity and canonicalization identity already used by the implementation. Then implement the smallest uniqueness/conflict witness over that identity.

## Current classification

- Constitutional requirement: VERIFIED.
- GOV-28-E implementation: OPEN.
- No normative governance parameters changed.
- No economic semantics changed.

## Next agent action

Inspect current governance canonicalization/adoption tests and locate the existing state/root identity. Add the smallest negative conflict test and, if supported by the existing model, the corresponding replay/reference test.