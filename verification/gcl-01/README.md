# GCL-01 design-only conformance corpus v0.1

**Status:** design-only, non-normative. Do not import these records into production state, validators, adapters, PRE-RICH economics or Cormia Runtime.

## Purpose

This corpus makes the candidate GCL-01 envelope executable as a set of boundary tests. It deliberately does not define a universal classifier, score, category scale, eligibility engine or authorization system.

## Files

- `gcl-01-conformance-v0.1.json`: versioned synthetic family, assignment, effect-binding, admission, transition and evidence-lineage fixtures.
- `../../src/__tests__/gcl01-conformance.test.ts`: Vitest conformance assertions for the candidate envelope.
- `../../.github/workflows/gcl-01-conformance.yml`: isolated CI entry point.

## Run

```sh
npx vitest run src/__tests__/gcl01-conformance.test.ts
```

## Contract boundaries exercised

1. Family identity is namespaced and version-pinned. A v2 family does not reinterpret a v1 assignment.
2. Explicit selection remains distinct from deterministic, evidence-derived, model-assisted and state-derived assignment.
3. Assignment is not eligibility, admission, permission or authorization.
4. Effect payloads remain owned by a versioned domain profile.
5. Admission decisions bind the exact subject, scope, action, assignment, effect binding and profile authority.
6. Transition policies preserve lineage and prohibit retroactive rewriting.
7. Evidence integrity checks reject duplicate references, malformed graphs, cycles, missing parents and scope substitution.
8. Evidence lineage preserves same-source events, model derivations, correlation groups and unknown relationships without inferring statistical independence from producer IDs.

## Not proven by this suite

- cryptographic signatures, key custody, delegation or revocation;
- statistical independence or scientific/actuarial adequacy;
- production profile correctness or trusted authority registries;
- IMMORTAL economic solvency, capital protection or settlement correctness;
- Cardano datum/validator representation, transaction size or execution cost;
- AEP/Cormia Runtime conformance.

The checks are reference-model conformance tests, not protocol adoption. Any future promotion requires an explicit decision and real application contracts.
