# IMMORTAL — Fee Incentive Adversarial Lab v0.1

**Date:** 2026-09-22  
**Status:** RESEARCH / NON-NORMATIVE / OPEN  
**Front:** Protocol Usage Fee → Governance & Build Incentives

## Purpose

Test whether a future incentive mechanism funded by protocol-controlled revenue can create self-reinforcing gaming loops, capture, or result-dependent authority.

This document does **not** select a fee formula, reward formula, reward percentage, governance threshold, or distribution policy.

## Boundary under test

The candidate flow is:

ProtocolUsageFee → ProtocolRevenue → AccountingClassification → AvailableRevenue → RewardBudget → RewardAllocation

The fee function and reward function remain separate:

FeeFunction(S,A) → FeeTarget

RewardFunction(S,C,E) → RewardAmount

where C is an institutionally defined contribution class and E is certified evidence.

The reward function may only operate inside a pre-authorized domain and budget.

## Adversarial state variables

Use a toy state:

- R: protocol revenue available for incentives;
- B: authorized reward budget;
- N: number of governance participants;
- V: verified useful governance work;
- Q: submitted proposals/reviews;
- C: verified accepted code contribution;
- F: farming/spam activity;
- S: Sybil identities;
- K: collusion/cartel activity.

No numeric values are canonical.

## Candidate reward models

### Model G1 — participation

Reward = h(participation)

Attack question: can low-cost repeated participation increase rewards without increasing useful information?

Required test:
- split one real participant into many identities;
- repeat low-information votes;
- compare reward eligibility before/after Sybil multiplication.

### Model G2 — verified review/evidence

Reward = j(verifiedReview, evidence)

Attack question: can reviewers manufacture reciprocal or low-value evidence?

Required test:
- contributor/reviewer collusion;
- self-review;
- circular approval;
- duplicated evidence;
- review spam.

### Model B1 — accepted code contribution

Reward = k(acceptedContribution, evidence)

Attack question: can accepted contribution be manufactured through low-value changes?

Required test:
- commit splitting;
- PR splitting;
- dependency churn;
- generated code inflation;
- revert/reapply cycles;
- mutually approving contributors.

The intended evidence chain is:

Contribution → Build/CI evidence → independent review/acceptance → canonical contribution record → reward eligibility

## Core adversarial invariant

> The mechanism that measures contribution cannot unilaterally define what counts as valuable contribution.

Therefore the following must remain outside the reward algorithm:

- contribution domain;
- eligibility definition;
- evidence admissibility;
- acceptance authority;
- budget ceiling;
- reward-function family;
- amendment authority.

## Budget safety

Candidate accounting invariant:

RewardBudget ≤ AvailableProtocolRevenue

and, independently:

RewardAllocation ≤ RewardBudget

The reward mechanism must not infer availability from RawSurplus merely because revenue is protocol-controlled.

It must also not consume value classified as protected, reserved, or mandatory future cost.

## Feedback-loop tests

### Loop L1 — participation inflation

more activity → more rewards → more activity

Question: Does the mechanism distinguish useful participation from activity volume?

### Loop L2 — fee/reward circularity

higher activity → higher fee revenue → larger rewards → higher activity

Question: Can the reward system indirectly change the fee target or its own funding rule?

Invariant candidate: RewardFunction cannot modify FeeFunction, its domain, bounds, or authority.

### Loop L3 — governance capture

reward eligibility → influence → reward policy → greater reward eligibility

Invariant candidate: A reward recipient cannot acquire additional normative authority solely through receipt of rewards unless that authority is separately authorized by the governance constitution.

### Loop L4 — build cartel

accepted contribution → reward → greater influence → easier acceptance → reward

Required separation: reward receipt must not itself become evidence of contribution quality or acceptance authority.

## Result-dependent authority test

A reward outcome must never directly modify:

- quorum;
- approval threshold;
- proposal classification;
- evidence admissibility;
- reviewer authority;
- contribution definition;
- fee function;
- reward function.

If any future implementation does so, it requires an explicit constitutional/governance rule rather than algorithmic inference.

## Current conclusion

The research supports a two-stage accounting boundary:

ProtocolRevenue → AvailableForAuthorizedUse → RewardBudget

followed by a separate contribution-verification boundary:

VerifiedContribution → RewardEligibility → RewardAllocation

This is preferable to a direct Fee → Reward mapping because it makes accounting, authorization, contribution verification, and settlement independently auditable.

## Open evidence

Still required before any economic implementation:

1. repository mapping of canonical contribution/evidence records;
2. independent replay evidence for governance events;
3. exact Treasury accounting boundary;
4. adversarial execution tests;
5. Sybil/collusion/farming counterexamples;
6. evidence that reward receipt cannot create normative authority;
7. determination of whether any existing application Treasury policy can be reused without importing PRE-RICH semantics into IMMORTAL.

**No numeric parameter is proposed by this lab.**