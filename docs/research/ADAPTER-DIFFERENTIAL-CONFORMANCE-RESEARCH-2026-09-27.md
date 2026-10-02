# Adapter Differential Conformance — Research Pass — 2026-09-27

## Classification

**Research / non-normative.**

## Research target

Determine whether IMMORTAL can strengthen Adapter conformance by comparing independent implementations against a semantic/reference contract without allowing the reference harness to become a new economic authority.

## External pattern

Differential-testing systems commonly:

- define a semantic contract;
- drive multiple independent implementations;
- compare normalized outputs;
- preserve mismatches as deterministic regression cases;
- replay the same vectors after implementation changes;
- add mutation/fuzz lanes around the contract.

A current example is SP-DIFFER, which compares independent implementations against a vendored reference flow and stores reproducible mismatch cases.

Reference:
https://github.com/shuv-amp/sp-differ

Formal-model-guided blockchain conformance research also uses two complementary directions:

- model-generated traces checked against the implementation;
- implementation-generated traces checked against the model.

Reference:
https://arxiv.org/html/2501.08550v1

## Proposed IMMORTAL use

Use the pattern only for **conformance**, never for authority.

Reference layers:

`Canonical semantic contract`
→ normalized action/result vector
→ Adapter implementation A
→ Adapter implementation B / native ledger oracle
→ differential comparison

Examples of normalized facts:

- datum/redeemer decoding;
- exact action classification;
- required inputs;
- validity interval interpretation;
- reference-script selection;
- expected fail-closed condition;
- serialized transaction size;
- native evaluator result.

## Critical non-authority rule

The differential oracle must not decide:

- EEV;
- ProtectedCapital;
- Economic Gate admission;
- viability;
- canonical external Beacon state.

Those remain owned by the authoritative semantic layers.

## Recommended first harness

Start with pure/serialization boundaries before live ledger execution:

1. canonical fixtures;
2. deterministic input normalization;
3. Adapter output normalization;
4. mismatch artifact;
5. replay test;
6. adversarial mutation;
7. optional native-ledger oracle lane.

This is compatible with the existing evidence hierarchy and can strengthen F3/B6 without changing economics.

## Status

**Research finding: viable pattern.**

No implementation is authorized by this note; a concrete harness should be specified against the existing Adapter conformance contract first.
