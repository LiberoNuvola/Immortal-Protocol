# CAES Transition Lab — Experimental Audit Branch

Status: **experimental / non-normative**.

This branch was repurposed from the retired P2.8-B.1 reference-script audit branch to experiment with a verification-layer idea motivated by prior-art research:

- a transition witness binds a pre-state, action, post-state and rule identity;
- an independent checker verifies the witness without constructing the transition itself;
- liveness hypotheses are explicit metadata, not silently treated as safety;
- the checker rejects stale/wrong/replayed transition witnesses.

This lab does **not** change IMMORTAL economics, PRE-RICH policy, Cardano validators, or production execution paths.

The experiment is deliberately structural. It is inspired by proof-certificate work in model checking, where a producer emits checkable evidence and a trusted checker validates that evidence, and by state-transition proof systems that verify a transition between committed states. See the research notes recorded outside the normative protocol.

## Hypothesis

A CAES transition should be representable as:

`preState + action + ruleId + postState + livenessHypotheses`

with a small deterministic checker:

`verifyWitness(witness) -> accept | reject`

The checker must not trust the producer's claim that the transition is valid.

## Deliberate boundary

This experiment does **not** yet:

- define a new economic rule;
- derive EEV or executable liquidity;
- replace `EconomicTransitionV3`;
- claim Cardano semantic equivalence;
- claim a production certificate format;
- introduce cryptographic proof systems.

The next experiment, if this shape survives review, is to bind the witness to the existing canonical V3 transition/refinement objects rather than creating a parallel economic model.
