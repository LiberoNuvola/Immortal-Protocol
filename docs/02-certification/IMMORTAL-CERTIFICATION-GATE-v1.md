# IMMORTAL Certification Gate — v1

## Purpose

This check validates the structure of the closure evidence manifest and
protects against premature GREEN/CLOSED declarations.

It is not, by itself, an economic, cryptographic, deployment, or ledger
certification. A successful CI run only establishes that these structural
checks passed for the tested commit.

## Canonical manifest

`docs/02-certification/IMMORTAL-CLOSURE-EVIDENCE-MANIFEST.json`

The manifest records gates G1-G7. Their required evidence classes are
validated by `scripts/immortal-certification-gate.mjs`.

## Current limitations

The current checker deliberately rejects GREEN/CLOSED because the required
runtime evidence-verification contracts are not yet implemented here.
`--require-closure` must therefore fail.

The workflow does not independently authenticate GitHub Actions artifacts,
validate their GitHub-reported digests, prove ledger execution, verify
GRANDPA finality or storage proofs, establish ProtectedCapital provenance,
or certify the EEV/Kc/Ω economic conditions.

Those obligations remain open until independently reviewed verification
contracts and the required evidence exist.

## Interpretation

- A passing workflow means manifest structure and fail-closed behavior passed.
- It does not close any certification gate.
- It must not be treated as a substitute for the finalization certification
  manifest or as proof of a live-ledger observation.
- Do not change economic rules, protocol semantics, or gate requirements
  merely to obtain a green workflow.
