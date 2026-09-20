# GOV-25 — Cryptographic Commitment

## Status

**GOV-25 PACKAGE PREPARED — ALGORITHM FROZEN, BUILD BACKEND BINDING REMAINS**

## Frozen contract

GOV-25 freezes:

- algorithm: **SHA-256**
- input: exact canonical event representation from GOV-24
- input encoding: UTF-8
- digest encoding: lowercase hexadecimal
- digest length: 64 hexadecimal characters / 32 bytes
- one canonical event → one deterministic digest

The commitment scope is the complete canonical event byte sequence, not an
implementation-specific in-memory representation.

## Verification requirement

An implementation is conforming only if it reproduces the published golden
vectors byte-for-byte and digest-for-digest.

The vector suite includes mutations of every canonical envelope field. Each
mutation must produce a digest different from the baseline vector.

## Important implementation boundary

`GovernanceCommitment.hs` declares the frozen contract but intentionally does
not pretend that a concrete SHA-256 backend is already wired into the Haskell
build. That binding must be made against an approved dependency/backend and
then tested.

Therefore GOV-25 provides **cryptographic specification and independent
golden-vector evidence**, not yet a claim of Haskell implementation
conformance.

## Security boundary

SHA-256 authenticates integrity of the committed bytes; it does not establish:

- actor authorization;
- truth of evidence;
- validity of the ruleset;
- authority to transition governance state.

Those belong to subsequent governance validity gates.
