# IMMORTAL — Generalized Derivation Contract v1

**Classification:** research / architectural contract, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Define one reusable boundary for algorithmically derived results across fee, reward, governance, policy and future multi-adapter functions without introducing a second economic state machine or granting the algorithm normative authority.

## Common boundary

A candidate derivation is represented by:

`B = (D, R, I, L, E, V, C, X)`

where:

- **D — Domain:** authorized problem space;
- **R — Rule:** institutionally declared derivation function;
- **I — Inputs:** certified state/environment inputs;
- **L — Limits:** non-bypassable bounds;
- **E — Evidence:** evidence/provenance contract;
- **V — Version:** immutable/versioned rule identity;
- **C — Contestability:** correction/review path;
- **X — Exit:** fail-closed/suspension behavior.

The algorithm may compute only inside a boundary whose eight components are externally defined and version-bound.

## Three-stage machine

```
Explore(CertifiedState, AuthorizedRuleSpace)
        ↓
CandidateSet
        ↓
Certify(candidate, Evidence)
        ↓
ADMISSIBLE | REJECTED | UNVERIFIABLE
        ↓
Adopt(candidate)
        ↓
existing authorized transition / governance path
```

`Adopt` is not an algorithmic side effect of `Explore` or `Certify`.

## Function families

The same derivation machinery may serve different semantic domains:

- `EconomicFeeTarget(S,A)`;
- `RewardBudget(S)`;
- `CodeContributionReward(C,E)`;
- `ReviewReward(C,E)`;
- governance membership/eligibility functions;
- profile-scoped adaptive parameters;
- candidate upgrade/rule-set trajectories;
- future chain-neutral functions realized through multiple adapters.

Reuse of machinery does not imply reuse of authority or semantics.

## Multi-adapter generalization

For a universal IMMORTAL function:

`UniversalDerivation(S, A, RuleVersion) → Result`

the adapter-specific stage is:

`Result → AdapterEncoding → ChainSettlement`.

The Adapter may differ in serialization, fees, validity intervals, proof transport or settlement asset. It must not redefine the universal function.

A multi-adapter implementation is conformant only when, for the same certified inputs and authorized rule version, each adapter realizes the same semantic result before chain-specific representation.

## Search-space transparency

An explorer must distinguish:

1. declared search domain;
2. candidate subset actually explored;
3. pruning criteria;
4. candidates excluded;
5. computational limits;
6. completeness/coverage claim.

`PARTIAL` search coverage cannot be represented as a complete normative universe.

## Fail-closed semantics

Missing or stale required evidence yields `UNVERIFIABLE`, not automatic authorization.

A candidate that violates a declared bound is `REJECTED`.

Only an admissible candidate may enter an existing authorized adoption path.

## Non-sovereignty invariants

The generalized layer must not be able to:

- expand its own domain;
- weaken its safe set;
- change its evidence predicate;
- change its rule version;
- increase its reward/fee budget;
- grant itself governance authority;
- convert a partial search into a complete normative claim;
- bypass the existing atomic transition.

## Contributor credential relation

A future Contributor Reward NFT is treated as a credential around a verified `ContributionRecord`.

`VerifiedContribution → ContributionRecord → CredentialEligibility`

and separately:

`ContributionRecord → RewardEligibility → RewardAllocation`.

No implication is assumed:

`Credential → EconomicAuthority`.

Any such relation would require an explicit future normative rule.

## Closure test

The generalized derivation layer is ready for promotion only when multiple function families share the same deterministic, version-bound, evidence-bound, fail-closed machinery and the tests demonstrate that no candidate can mutate the rule-space that authorizes it.

**Status: OPEN RESEARCH / PROTOTYPE-READY.**