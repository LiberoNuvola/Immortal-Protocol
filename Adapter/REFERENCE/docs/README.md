# IMMORTAL Reference Adapter

**Semantic status:** DRAFT / OPEN DECISION
**Role:** deterministic conformance/testing artifact.
**Deployment target:** none.
**Economic authority:** none.

## Authority
EconomicKernel.hs remains authoritative. The Reference Adapter is a derived artifact and MUST NOT redefine economic rules.

## Scope
The Reference Adapter provides deterministic fixture execution, canonical economic-state projection, transition-by-transition expected results, differential comparison and adversarial fixture coverage.

It does not provide consensus, finality, randomness authenticity, chain-specific transaction validity, reentrancy/rent/CU/gas guarantees or deployment certification.

## Architecture
Canonical fixture → EconomicKernel.hs → Reference execution → canonical economic-state projection → real-adapter execution → differential comparison.

The comparison target is canonical economic state, not transaction bytes or chain-specific data structures.

## Non-contamination rule
The Reference Adapter MUST NOT introduce a second set of formulas, constants, economic predicates or application policy. A thin wrapper around the existing kernel is preferred over an independently maintained reimplementation.

## Implementation gate
This document does not authorize implementation. If authorized later, the first step is the fixture/conformance methodology, not a new economic engine.

## Executable status

The first executable wrapper is now materialized at `Adapter/REFERENCE/ReferenceAdapter.hs`.

It is intentionally thin: `replay` and `replayValid` delegate every transition to `EconomicTransitionV3` and therefore to the canonical kernel. Expected post-states are compared field-by-field across the complete V3 state, including class, control and jackpot state.

The dedicated `ReferenceAdapterTest.hs` suite covers a canonical Issue → Reveal → Expire trace and rejects a mutated expected post-state. This establishes executable reference replay, but it is **not yet** a live-adapter differential PASS and does not certify any external chain.


## Differential witness

`Adapter/REFERENCE/export/ReferenceAdapterGolden.hs` provides a deterministic executable reference trace. `src/__tests__/reference-cardano-differential.test.ts` invokes it and compares the reference initial, Issue and Reveal states against the Cardano observation projection field-for-field.

This is fixture-level differential conformance only. It does not certify live-ledger execution, finality, randomness or Preprod deployment.
