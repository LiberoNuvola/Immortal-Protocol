# IMMORTAL — Fee Incentives for Governance & Build Front

**Date:** 2026-09-22  
**Status:** RESEARCH / OPEN / TRIANGULATED  
**Relation:** extends the existing Treasury/Fee front; does not replace it.

## Triangulated finding

The existing IMMORTAL research explicitly identifies the Protocol Usage Fee as a candidate **algorithmically derivable parameter**, while also identifying governance rewards and code-contribution rewards as candidate adaptive incentives.

The current research master records:

- `EconomicFeeTarget(S,A)` as a candidate derivable function;
- `VoteReward = h(S, participation_state)`;
- `ReviewReward = j(S, verified_contribution)`;
- `CodeContributionReward = k(S, accepted_contribution)`;
- `RewardBudget = r(S)`;
- governance approval of derivation functions rather than autonomous algorithmic authority;
- reward farming, Sybil, spam, coalition and contribution-inflation as explicit attack surfaces.

The fee workflow independently establishes that Protocol Usage Fee semantics belong to IMMORTAL, settlement belongs to the Adapter, and fee revenue must not be confused with ChainExecutionCost, ProtectedCapital, RawSurplus or mandatory OPEX.

## The idea to explore

The fee may potentially become part of an **incentive economy** supporting:

1. governance participation;
2. verified review/evidence work;
3. verified code/build contributions;
4. maintenance/infrastructure contributions;
5. other explicitly recognized useful work.

This is an **exploration**, not a decision that fees must be distributed this way.

A useful conceptual decomposition is:

`ProtocolUsageFee`
→ `ProtocolRevenue`
→ `RewardBudget`
→ `verified contribution/governance reward`

subject to an independent safety/accounting boundary.

## Critical distinction

The fee itself should not become:

`fee = vote payment`

or

`fee = developer salary`

as an implicit universal rule.

Instead:

`FeeFunction`
and
`RewardFunction`

are separate functions under a common economic/accounting contract.

The first determines what economic usage is owed.

The second determines whether, and under what pre-authorized conditions, some protocol-controlled revenue can fund incentives.

That separation prevents a feedback loop in which:

`more governance` → `more rewards` → `higher fee` → `more governance`

is silently introduced by the algorithm.

## Governance incentive research

Candidate reward dimensions:

- participation;
- verified review;
- evidence production;
- proposal quality;
- accepted governance contribution.

A reward for merely clicking/voting is not equivalent to a reward for verified useful contribution. These must be tested separately.

Existing governance authority remains normative: the reward algorithm cannot grant itself governance authority, change quorum/approval rules, or redefine who is eligible.

## Build incentive research

Candidate:

`CodeContributionReward = k(VerifiedContribution, AcceptedContribution, Evidence)`

The important word is **verified**.

The system should not reward:

- raw commit count;
- lines of code;
- arbitrary PR volume;
- self-declared contribution;
- activity generated solely to farm rewards.

Potential evidence layers:

`Contribution`
→ `Build/CI evidence`
→ `review/acceptance`
→ `canonical contribution record`
→ `reward eligibility`

The reward should therefore follow accepted contribution evidence rather than activity alone.

## Anti-gaming laboratory

At minimum test:

- Sybil governance identities;
- vote farming;
- proposal spam;
- review spam;
- fake/low-value PRs;
- dependency churn to manufacture contribution;
- collusion between reviewers and contributors;
- self-review;
- circular rewards;
- contribution splitting;
- withholding useful work until a reward rule changes;
- reward-function gaming;
- fee-volume manipulation intended to increase reward budget.

The key invariant candidate is:

> **The mechanism that measures contribution cannot unilaterally define what counts as valuable contribution.**

That choice must remain institutionally declared/versioned.

## Algorithmic governability boundary

The existing master research gives the appropriate architecture:

`Constitution / limits`
→ `Governance approves function and bounds`
→ `Algorithm derives value`
→ `Adapter settles`
→ `Evidence`

Therefore a reward algorithm may calculate a reward **only inside an already authorized domain**.

It must not autonomously decide:

- what governance is;
- what constitutes legitimate work;
- who has authority;
- what evidence is valid;
- its own budget;
- its own reward function;
- its own limits.

This is the same non-sovereignty boundary already being tested for the Fee Function.

## Treasury connection

This front also clarifies why the Treasury front matters.

A protocol-controlled revenue balance is not automatically distributable.

The future model should distinguish at least:

`RevenueReceived`
→ `AccountingClassification`
→ `Protected / Reserved / Available`
→ `RewardBudget`
→ `RewardAllocation`

with each transition subject to the appropriate Economic Gate and evidence.

No reward should be allowed to consume protected value merely because the algorithm labels it a reward.

## Research status

**Protocol Usage Fee:** semantic boundary consolidated; derivation function OPEN.

**Fee as incentive source:** RESEARCH / OPEN.

**Governance reward:** RESEARCH / OPEN.

**Build/contribution reward:** RESEARCH / OPEN.

**Reward budget:** RESEARCH / OPEN.

**Treasury → reward-budget accounting boundary:** OPEN.

**Anti-Sybil / anti-farming proof:** OPEN.

**Algorithmic non-sovereignty:** existing master boundary applies.

## Next coordinated work

1. Map current repository governance/contribution evidence primitives.
2. Identify whether any reward or treasury implementation already exists before adding types.
3. Model `RewardBudget` without making it a new universal liability.
4. Build a toy adversarial reward model for governance and code contributions.
5. Test whether adaptive rewards create result-dependent authority or feedback loops.
6. Keep all numeric values and concrete reward percentages OPEN until evidence supports them.

**No economic or governance policy is changed by this front.**
