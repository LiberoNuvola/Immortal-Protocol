# CAES Prior-Art Deep-Pass Handoff — 2026-09-23

Non-normative coordination only.

## New findings

1. LiDO (PLDI 2024) shows that liveness can be reduced to safety via refinement when the model explicitly contains a pacemaker/environment state. This supports keeping IMMORTAL R4 hypotheses explicit rather than hiding them inside a generic validity bit.
Source: https://flint.cs.yale.edu/certikos/publications/lido.html

2. CertiKOS/DeepSpec provides a strong prior art for certified abstraction layers and vertical/horizontal composition. Therefore layered refinement is not itself a novelty claim.
Source: https://flint.cs.yale.edu/certikos/framework.html

3. A July 2026 certificate-carrying transformation paper uses an untrusted producer plus a trusted fail-closed checker that recomputes semantic side conditions under an observation lens. This directly informed a hardening of the CAES audit lab.
Source: https://arxiv.org/abs/2607.00563

## Concrete audit-lab hardening

The CAES certificate previously contained a producer-supplied transitionValid boolean. That is now removed.

The lab checker instead requires the existing local boundary witnesses:
- V3 transition validity;
- RefinementV3 exactness;
- C13 semantic encoding validity;
- explicit liveness hypotheses;
- common transition/state identity.

This is an audit-only verification experiment. No normative economics changed.

## New candidate concept

ObservationLens: an explicit declaration of what semantic fields are compared at each refinement boundary. The same lens must be used when claiming equivalence between V3, adapter and ledger witnesses.

Potential property:
TransitionIdentityPreserved(T, ObservationLens).

## Coordination

Keep this experiment on the audit branch. Do not promote it to Green Closure until the checker can independently recompute or cryptographically authenticate the local witnesses rather than trusting producer booleans.

Cross-review against C13, C14 and C15 before promotion. No green status implied.