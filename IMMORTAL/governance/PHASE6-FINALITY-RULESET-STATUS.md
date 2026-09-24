# GOV-18 → Phase 6 Status

## Closed at implementation level in this package
- Explicit challenge object and lifecycle.
- Challenge can open only during the deterministic 3-day finality window.
- Challenge resolution is one-way.
- Finalization requires the challenge window to have expired.
- Any upheld/open challenge blocks finalization; rejected challenges permit finalization after expiry.
- Canonicalization is an explicit state transition.
- Governance ruleset is represented as a versioned immutable object.
- A ruleset change is treated as an amendment requiring a new proposal/version.
- Commitment algorithm is explicitly identified as SHA-256.
- Canonical commitment input is deterministic.
- Independent Python replay reference is supplied and does not import the Haskell implementation.

## Remaining conformance gates
1. Wire the canonical event object directly into the authoritative state transition function rather than carrying `(CanonicalEvent, GovernanceEvent)` as two parallel values.
2. Implement actual SHA-256 bytes/hex commitment and deterministic UTF-8 serialization in the production implementation.
3. Bind actor authorization and evidence resolution to the canonical event.
4. Enforce ruleset immutability from event application, not only through predicates.
5. Add a complete independent replay equivalence suite across randomized finite event histories.
6. Run the repository's real Haskell build/test environment and record the evidence.
7. Integrate the final files into `b1-hardening` once repository write access is available.

## Claim boundary
The package is a conformance candidate and test artifact. It is not a deployment certificate and does not prove the repository implementation is formally verified.
