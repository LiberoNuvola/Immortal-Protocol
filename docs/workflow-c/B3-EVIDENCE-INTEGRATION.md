# Workflow C × B3 Materios Provenance — Evidence Integration Boundary

**Status:** integration design only. This file does not claim a real Materios witness has been cryptographically verified.

## Why B3 matters to Workflow C

The B3 provenance work provides patterns for capturing, binding, verifying and classifying evidence while keeping the proposer separate from the verifier. Workflow C should reuse those patterns rather than reimplement provenance informally.

The integration is a boundary, not a wholesale merge of B3 history or its branch.

## Reusable patterns from B3

1. **Generalized derivation contract:** a candidate derivation records domain, rule, inputs, limits, evidence, version, contestability and exit. Exploration does not itself authorize adoption.
2. **Fail-closed verifier boundary:** when a cryptographic verifier is absent, a complete-looking claim remains UNVERIFIABLE.
3. **Witness packet integrity:** check packet schema and cross-field bindings without confusing structural integrity with cryptographic proof.
4. **Root-proof boundary:** bind checkpoint, state root, runtime identity, storage key, claimed value, storage proof, context and finality evidence; independently verify each proof component.
5. **Transport/cryptographic separation:** RPC output or a captured artifact is transport evidence until signatures, quorum, ancestry, authority provenance and storage proof are independently verified.
6. **Search transparency and non-sovereignty:** disclose explored domains, pruning and limits; exploration cannot expand its own authority, weaken safety predicates, change rule versions, increase budgets or bypass the authorized transition path.

## Workflow C packet binding

The C10 packet should bind at minimum:
- reference-profile identifier and version;
- normative source references and hashes;
- canonical state S0 and digest;
- Ω declaration, fixing authority and perimeter E;
- transition relation and rule version;
- certificate/witness bytes and digest;
- evidence provenance, source/checkpoint and verification status;
- independent checker implementation/version and invocation;
- checker output, exit status and limitations.

All fields must be independently checked for consistency. A digest establishes integrity of the bytes, not truth of the claim. A source reference establishes where evidence came from, not that the evidence is valid.

## Status mapping

- Schema/field presence only → STRUCTURAL.
- Synthetic fixtures → SYNTHETIC.
- Captured RPC response without proof verification → TRANSPORT-CAPTURED.
- Required cryptographic checks independently pass → CRYPTOGRAPHICALLY-VERIFIED.
- Independent checker verifies the chain-independent viability theorem under explicit assumptions → MODEL-CERTIFIED.
- Live chain state independently observed → CHAIN-OBSERVED.

These labels are independent dimensions where appropriate; e.g. cryptographic verification of a Materios checkpoint does not certify the economic model's Kc.

## Explicit non-claims

The existing B3 A-witness and C-root-proof boundary tests are structural/cross-reference checks, not a production cryptographic verifier. The Materios real-fixture contract remains a fixture schema until real-node finality, authority transition, runtime execution proof and state/storage proof are independently verified. A passing Workflow B boundary conformance run is not evidence of non-empty Kc.

## Safe integration sequence

1. Reference B3 files by immutable commit/path/hash in the evidence manifest.
2. Keep B3's cryptographic verification status separate from the C model certificate status.
3. Add a C checker adapter only after its input/output contract is fixed.
4. Test adversarial cases: missing proof, stale checkpoint, wrong authority set, inconsistent source/version, altered S0, altered Ω/E, fabricated booleans and digest mismatch.
5. Preserve all raw outputs and failure cases; never upgrade status by editing a summary.
