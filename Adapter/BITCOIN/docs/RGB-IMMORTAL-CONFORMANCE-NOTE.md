# Bitcoin / RGB Conformance Note — Economic Kernel Equivalence

**Status:** 🟡 research / conformance specification only
**Decision:** no RGB implementation authorized by this document
**Scope:** Path B from BITCOIN-TRUST-MODEL.md, tested against the current IMMORTAL universal economic boundary.

## 1. Purpose

This note turns the existing Bitcoin L1 audit into a falsifiable conformance target for the RGB/client-side-validation path.
It does not select RGB as the Bitcoin Adapter implementation.

> Can an RGB contract/schema plus its client-side validation evidence represent and reject exactly the economic conditions required by the current IMMORTAL universal kernel, without introducing a second economic authority?

A positive answer requires an explicit equivalence proof and executable evidence. A conceptual mapping is insufficient.

## 2. Current IMMORTAL reference boundary

The current universal state contains exactly eight economic components:
- crystallizedLiabilities
- unresolvedReserve
- unresolvedTicketCount
- worstCaseExposure
- safetyCapital
- reserveProtection
- mandatoryFutureCosts
- additionalProtectedCapital

ProtectedCapital = crystallizedLiabilities + worstCaseExposure + safetyCapital + reserveProtection + mandatoryFutureCosts + additionalProtectedCapital.
RawSurplus = max(0, EEV - ProtectedCapital).

The solvency predicate requires EEV >= 0, every protected-state component >= 0, and EEV >= ProtectedCapital.

## 3. Economic Gate requirements

The current Economic Gate requires: authoritative truth verified; EEV fresh; obligations complete; executable liquidity >= 0; required immediate liquidity >= 0; required immediate liquidity <= executable liquidity; and candidate post-state satisfying the universal solvency invariant.

The Viability Gate additionally requires a safe post-state and that every relevant Ω successor remains inside the declared certified concrete kernel.

The universal gate does not manufacture truth, freshness, obligation coverage or the Ω certificate. Those remain external verification/conformance obligations.

## 4. RGB candidate contract boundary

RGB documentation describes client-side validation as validation of relevant contract history by the parties receiving/processing it, with commitments anchored to Bitcoin. RGB state transitions are represented through client-side data and Bitcoin commitments/single-use seals.

This makes RGB structurally capable of expressing a state-transition validation layer, but it does not itself prove equivalence to IMMORTAL.

The candidate RGB contract must therefore deterministically and versionedly bind at least:
- the eight universal economic quantities;
- EEV and its freshness evidence;
- authoritative-truth verification evidence;
- obligation-completeness evidence;
- executable liquidity and required immediate liquidity;
- observation/decision reference and derivation/version identifiers;
- predecessor state and candidate post-state;
- action/domain identifier;
- Bitcoin anchor / seal linkage;
- terminal/non-terminal status.

## 5. Required rejection rules

An RGB realization cannot claim equivalence unless its validation procedure rejects at least:

R1 — any negative universal economic state component.
R2 — EEV < 0.
R3 — EEV < ProtectedCapital(candidate).
R4 — unverified authoritative truth.
R5 — stale EEV; no grace period.
R6 — incomplete obligations.
R7 — negative liquidity values or requiredImmediateLiquidity > availableExecutableLiquidity.
R8 — unsafe post-state.
R9 — uncertified Ω successor.
R10 — broken predecessor, contract-history or seal/anchor linkage.
R11 — duplicate/conflicting state transition violating single-use/state-transition rules.
R12 — unknown schema, kernel, derivation or transition version; no fallback interpretation.

## 6. Commitment is not economic proof

An RGB/Bitcoin anchor can establish that a particular client-side state transition was committed according to the RGB construction. It does not by itself prove IMMORTAL economic admission.

Two proofs are therefore required:
- P1 State-transition integrity: independent validation of predecessor, transition, seal and Bitcoin commitment.
- P2 IMMORTAL economic equivalence: the same inputs produce the same admissibility result and canonical post-state under the IMMORTAL reference implementation.

Both are mandatory for conformance.

## 7. Required equivalence corpus

For every supported test vector x, require RGBAccept(x) == IMMORTALAccept(x). For accepted vectors also require RGBPostState(x) == IMMORTALPostState(x) under canonical serialization/domain. Rejections must have semantically corresponding reasons.

Minimum corpus:
- solvent transition;
- exact solvency boundary;
- insolvent transition;
- negative-state mutation;
- stale EEV;
- unverified truth;
- incomplete obligations;
- insufficient immediate liquidity;
- unsafe post-state;
- uncertified Ω successor;
- replayed predecessor/seal;
- conflicting transition;
- unsupported version;
- reorged/invalidated Bitcoin anchor;
- confirmed valid transition;
- terminal expiry/dissolution where supported.

## 8. Reorg and finality

The Bitcoin Adapter must distinguish unconfirmed, confirmed, reorg-invalidated, superseded/conflicting and final observations according to a declared policy.

An unconfirmed anchor cannot automatically be treated as irreversible settlement evidence. The conformance corpus must contain an adversarial reorg/conflicting-anchor case.

## 9. EEV / oracle boundary

RGB must not become the economic oracle.

An RGB contract may carry authenticated evidence and bind it to a transition, but the conformance argument must identify the authority/verification predicate, freshness rule, derivation version and failure behavior.

If verification is delegated to a named publisher, the resulting path is B1 and must be classified as such. A publisher-independent claim requires an independently reproducible verifier and evidence.

## 10. Technology-selection gate

RGB remains a research candidate until P1 and P2 are demonstrated for the supported transition domain.

If the corpus exposes a semantic gap requiring an undeclared authority, that gap must be recorded rather than hidden inside the Adapter.

## 11. Current status

- RGB client-side validation: structurally compatible with the proposed Adapter boundary.
- RGB → IMMORTAL Economic Kernel equivalence: UNPROVEN.
- Bitcoin consensus → IMMORTAL economic admission: UNPROVEN.
- B1/B3 promotion: NOT AUTHORIZED.
- Implementation: NOT AUTHORIZED by this note.
- Next artifact: executable conformance corpus + verifier/proof boundary.

## 12. Non-contamination firewall

This note does not alter IMMORTAL economic constants, ProtectedCapital, Economic Gate, Viability Gate, PRE-RICH economics, Cardano Adapter semantics or Beacon semantics.

Any RGB-specific schema, verifier or runtime remains under Adapter/BITCOIN/.

## Sources

- RGB documentation on client-side validation and state transitions.
- Current IMMORTAL UniversalEconomicState.hs, UniversalEconomicKernel.hs and EconomicGate.hs.
- Bitcoin BIP repository for the status of proposed covenant/introspection primitives.

External-source interpretation remains distinct from the repository's canonical economic semantics.