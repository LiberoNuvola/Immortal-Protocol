# IMMORTAL — Contributor Reward NFT Boundary v1

**Classification:** research / non-normative
**Branch:** `work/b3-materios-provenance-evidence`
**Date:** 2026-10-11

## Purpose

Define the smallest safe semantic boundary for a future Contributor Reward NFT without turning a contribution credential into economic or governance authority.

## Canonical relation

The evidence path is:

`Contribution`
→ `Build/CI evidence`
→ `review/acceptance`
→ `canonical ContributionRecord`
→ `CredentialEligibility`

Economic reward remains a separate path:

`ContributionRecord`
→ `RewardEligibility`
→ `RewardAllocation`

The credential and the reward may reference the same verified contribution record, but neither path may redefine the other.

## Credential semantics

A future Contributor Reward NFT may attest that a canonical contribution record satisfied an already-authorized evidence predicate.

The credential therefore carries an attestation relation:

`Credential ≈ Attestation(ContributionRecord, EvidenceContract, RuleVersion)`

It does not by itself mean:

- economic entitlement;
- governance weight;
- voting authority;
- Treasury authority;
- evidence authority;
- protocol ownership;
- permanent contributor status.

Any such utility requires an explicit future normative rule.

## Required evidence identity

A credential candidate must be bound to:

1. canonical contribution identifier;
2. contributor identity or authorized pseudonymous identity;
3. evidence reference;
4. acceptance/review state;
5. evidence-contract version;
6. derivation/rule version;
7. issuance state or canonical issuance reference;
8. correction/revocation relation where applicable.

No credential may be minted solely from self-declared activity.

## Correction and contestability

The design must support the case where an accepted contribution is later corrected, revoked, or invalidated.

The required semantic property is:

`corrected ContributionRecord -> future reward/eligibility no longer derived from the invalid state`

A previous credential is not silently rewritten. A future canonical mechanism must define whether correction is represented by revocation, supersession, or another explicitly authorized state transition.

The choice is OPEN.

## Transferability

Transferability is OPEN.

Until a normative rule exists, the credential must not be assumed transferable, non-transferable, or economically tradable.

## Reward separation

The NFT must not be used as an implicit payment primitive.

The economic path remains:

`AuthenticatedRevenue`
→ `AccountingClassification`
→ `CertifiedRewardBudget`
→ `RewardAllocation`

and is independently constrained by the canonical economic gates.

Holding the NFT does not bypass those gates.

## Anti-capture invariants

The credential path must reject designs in which:

- contributors self-certify their own evidence;
- the credential mints itself from reward output;
- holding a credential changes the definition of contribution;
- holding a credential changes the reward function;
- credential holders alter the reward budget;
- a beneficiary acquires governance authority from reward receipt;
- contribution identity can be split to multiply eligibility without an authorized rule.

## Promotion gate

Promotion from research candidate to canonical primitive requires:

1. an authorized normative rule for credential meaning;
2. a canonical contribution/evidence contract;
3. correction/revocation semantics;
4. explicit identity and issuance semantics;
5. explicit transferability decision;
6. independent conformance tests;
7. proof that the credential cannot create economic or governance authority outside its declared domain.

**Status: RESEARCH CANDIDATE — NOT CANONICAL.**
