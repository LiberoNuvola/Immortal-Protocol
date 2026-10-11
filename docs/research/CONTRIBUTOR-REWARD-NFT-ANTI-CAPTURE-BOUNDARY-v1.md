# IMMORTAL — Contributor Reward NFT Anti-Capture Boundary v1

**Classification:** research / credential-boundary conformance  
**Branch:** `work/b3-materios-provenance-evidence`

## Purpose

Make the Contributor Credential / Reward NFT boundary executable without choosing an NFT standard, transferability rule, reward amount, voting right, Treasury right, or canonical chain.

## Required separation

`VerifiedContribution → ContributionRecord → CredentialEligibility`

is distinct from:

`ContributionRecord → RewardEligibility → RewardAllocation`.

The credential is an attestation surface. It is not, by itself, a source of economic or governance authority.

## Negative properties

A credential must not be able to:

- manufacture a reward budget;
- redefine the contribution evidence predicate;
- self-authorize its own issuance;
- acquire governance or Treasury authority merely by possession;
- convert a corrected/revoked contribution into continuing eligibility.

## Promotion

Passing this boundary is evidence of separation only. Canonical NFT schema, metadata, transferability, revocation, settlement adapter and any rights attached to ownership remain open decisions.
