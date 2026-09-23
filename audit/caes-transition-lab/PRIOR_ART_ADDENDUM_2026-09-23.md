# CAES Prior-Art Addendum — 2026-09-23

## Compositional refinement

POPL 2025, "Unifying Compositional Verification and Certified Compilation with a Three-Dimensional Refinement Algebra", presents a Coq framework whose refinement algebra spans program modules, abstraction levels, and state components. Cross-layer compositional refinement is therefore established prior art.

Source: https://popl25.sigplan.org/details/POPL-2025-popl-research-papers/64/Unifying-compositional-verification-and-certified-compilation-with-a-three-dimensiona

**Use for IMMORTAL:** do not claim cross-layer refinement as novel. Test whether the same compositional idea can be instantiated around a normative economic transition and carried through adapter/ledger boundaries.

## Proof-carrying transactions

Ethereum research and EIP material now explicitly discuss proof-carrying transaction formats carrying proof material and public-value commitments.

Sources:
- https://ethresear.ch/t/native-proof-verification/24798
- https://eips.ethereum.org/EIPS/eip-8079

**Use for IMMORTAL:** prefer "economic transition witness" or "cross-boundary transition certificate" rather than claiming "proof-carrying transaction" as novel.

## Economic state machines

Axionomy describes a closed economic state machine in which exchanges are the state-changing events and proposal/search systems do not own economic truth. Rain Protocol also describes an Economic State Machine Interpreter.

Sources:
- https://github.com/BiomaAI/axionomy
- https://act65.github.io/rain/

**Use for IMMORTAL:** economic state machine is not a distinctive class name. These systems nevertheless reinforce proposal != authority and explicit transition preconditions/invariant preservation.

## Certified compilation pattern

COGENT demonstrates a top-level compiler certificate assembled from language-level meta proofs plus per-program translation validation.

Source: https://arxiv.org/abs/1601.05520

**Use for IMMORTAL:** the CAES experiment should compose heterogeneous local witnesses rather than force one monolithic checker to re-prove every boundary.

## Candidate experimental property

Define:

TransitionIdentityPreserved(T) =
- same canonical predecessor identity;
- same canonical action identity;
- same canonical successor identity;
- same rule/profile identity;
- same concrete artifact identity where applicable;
- same serialized action/state identity;
- same authenticated ledger event identity when available.

The audit experiment should reject a certificate when local witnesses are individually valid but refer to different transitions.

This is a provenance/composition property, not a new economic rule.
