# CAES Prior-Art / Cross-Session Handoff — 2026-09-23

> Non-normative operational addendum. This file is a coordination handoff; it does not change IMMORTAL or PRE-RICH semantics.

## Current research finding

The prior-art pass now identifies established precedents for:
- cross-layer compositional refinement (POPL 2025 three-dimensional refinement algebra);
- Plutus translation certification;
- proof-carrying transactions;
- economic state machines;
- formal economic security;
- proof-carrying / recursive state transitions;
- explicit liveness/enabledness boundaries.

Therefore novelty must not be claimed for any one of those mechanisms.

## Current CAES experimental target

The isolated audit branch audit/p2-8-b1-reference-scripts-2026-09-21 is now the CAES Transition Lab.

The experiment is deliberately non-normative and asks whether existing IMMORTAL witnesses can be composed into one transition-level certificate without duplicating economic semantics:

EconomicTransitionV3.transitionValid
-> RefinementV3.refinementExact
-> C13 semantic encoding
-> C14 artifact identity
-> explicit liveness hypotheses
-> eventual authenticated ledger event.

### Candidate property

TransitionIdentityPreserved(T):

1. same canonical predecessor identity;
2. same canonical action identity;
3. same canonical successor identity;
4. same rule/profile identity;
5. same concrete artifact identity where applicable;
6. same serialized action/state identity;
7. same authenticated ledger event identity when available.

A composition witness must reject the case where every local witness is individually valid but the witnesses refer to different transitions.

## Important distinction

This is not a proposal to add new economic rules or a new proof system.

It is a research experiment about provenance/refinement composition.

The adapter remains non-authoritative for economic admissibility.

## Research sources to keep in the prior-art matrix

- POPL 2025 — Three-Dimensional Refinement Algebra:
  https://popl25.sigplan.org/details/POPL-2025-popl-research-papers/64/Unifying-compositional-verification-and-certified-compilation-with-a-three-dimensiona
- Plutus translation certification:
  https://doi.org/10.1016/j.scico.2023.103051
- Proof-carrying transaction proposal:
  https://ethresear.ch/t/native-proof-verification/24798
- Ethereum EIP proof-carrying transaction discussion:
  https://eips.ethereum.org/EIPS/eip-8079
- Axionomy economic state machine:
  https://github.com/BiomaAI/axionomy
- Rain economic state machine:
  https://act65.github.io/rain/
- COGENT certified compilation:
  https://arxiv.org/abs/1601.05520

## Coordination instruction

Do not move the CAES experiment into work/immortal-green-closure yet.

When the audit experiment demonstrates a non-duplicative, independently checkable transition-identity property, cross-review it against C13/C14/C15 before any promotion.

No green status is implied by this handoff.