# GOV-24 — Canonical Serialization & Commitment Boundary

## Status
**GOV-24 PACKAGE PREPARED — CRYPTOGRAPHIC ALGORITHM NOT YET FROZEN**

GOV-22 made semantic payload part of the canonical event. GOV-23 added
independent replay vectors. GOV-24 freezes the representation boundary.

## Canonical order
1. event_id
2. proposal_id
3. ruleset_version
4. event_type
5. actor_class
6. timestamp
7. payload
8. payload_commitment
9. predecessor
10. evidence_refs
11. status

The representation is explicitly ordered and encoded at the byte boundary as
UTF-8. Haskell `Show` is not used for the event envelope.

## Critical boundary
This milestone does NOT claim a cryptographic commitment is implemented.
Before closure, a later milestone must freeze exact escaping, normalization,
field encoding, hash algorithm, digest encoding, commitment scope, and golden
byte/digest vectors.

## Required properties
- deterministic serialization
- cross-language byte equality
- mutation changes committed bytes
- identical events yield identical bytes
- malformed/non-canonical representations are rejected
- commitment verification is language-independent

## Non-claims
No actor authorization, evidence validity, ruleset authorization, complete
cross-language equivalence, or deployment conformance is claimed here.
