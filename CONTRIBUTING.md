# Contributing to IMMORTAL

Thank you for contributing to IMMORTAL.

IMMORTAL is an experimental open-source protocol. The repository contains universal protocol material, adapters, applications, implementations, proofs, tests and historical research. Contributions must preserve those boundaries.

## Before contributing

Start with:

1. `README.md`
2. `docs/EXECUTIVE-SUMMARY.md`
3. `docs/README.md`
4. `docs/00-normative/01_CONSTITUTION_FINAL.md`
5. the relevant adapter/application documentation
6. the relevant conformance and audit records

## Contribution principles

- Do not silently promote application policy into universal protocol semantics.
- Do not silently promote experimental code into normative authority.
- Do not claim implementation conformance without evidence.
- Keep proofs, tests, implementation and policy distinguishable.
- Update cross-references when moving documentation.
- Preserve historical material under the archive when it remains useful for traceability.
- Prefer small, reviewable changes.

## Protocol changes

Changes to the universal layer require explicit classification and stronger review.

A useful change description should state:

- affected layer;
- normative or non-normative status;
- affected definitions/invariants;
- required proof or evidence changes;
- compatibility/migration implications.

## Adapter changes

Adapter changes must explain how the concrete environment continues to preserve the applicable IMMORTAL predicates.

## Application changes

Application changes belong in the application layer unless they reveal a genuine missing universal abstraction.

## Evidence

When reporting a result, state exactly what was executed or proved. Do not turn a reference-model result into a validator claim.

## Governance

Governance is an evolution process. It does not replace proof, testing, conformance review or independent audit.

## License

See the repository licensing inventory and applicable license/NOTICE files. Third-party dependencies remain subject to their upstream licenses.
