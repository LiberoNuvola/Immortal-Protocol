# B3 — Real Witness Promotion Boundary v1

**Classification:** research / evidence-promotion boundary

## Purpose

Prevent synthetic B3-A/B3-B/B3-C fixtures from being promoted accidentally to real Materios evidence.

A packet may cross the conformance schema boundary without being a cryptographic witness. Promotion to a real witness requires authenticated provenance and independently verifiable proof material.

## Minimum promotion requirements

A purported witness must explicitly identify:

- target checkpoint/header;
- authority transition context;
- finality/justification or equivalent consensus proof material;
- ancestry/quorum relation;
- StateRoot and authenticated storage value where applicable;
- execution proof where applicable;
- provenance/source references;
- verification result produced independently of the producer.

Synthetic fixtures, placeholders, or self-attested authority claims are not sufficient for promotion.

## Safety rule

`SyntheticFixture → NOT_A_REAL_WITNESS`

`RealSource + VerifiableProof + IndependentVerification → ELIGIBLE_FOR_WITNESS_REVIEW`

The latter still requires the actual reviewer/verification path; this document does not declare B3-A/B3-B/B3-C closed.
