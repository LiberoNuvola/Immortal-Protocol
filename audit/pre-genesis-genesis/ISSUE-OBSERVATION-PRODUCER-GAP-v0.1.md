# Issue Observation Producer Gap — 2026-09-26

## Finding

The Issue economic producer and transport already exist, but the current branch has no concrete implementation of the buildDecisionContext(runtimeInputs) producer consumed by relayer/issueAdmissionProvider.js.

Current chain:

Preprod Counter/Pool observations
-> observation/refinement producer [OPEN]
-> IssueDecisionInput
-> PreRichIssueDecision.produceIssueDecision
-> issue-admission executable
-> EconomicAdmissionWitness
-> mintSerialNFTWithAuthoritativeAdmission
-> CIP-30

## Existing components

- PRE-RICH/profile/PreRichIssueDecision.hs: canonical economic producer.
- plutus/export/IssueAdmission.hs: executable JSON boundary.
- relayer/issueAdmissionProvider.js: transport/adaptation boundary.
- src/preRichIssueAdmissionBridge.ts: runtime/evidence binding.
- src/mint.ts: provider invocation path.

## Required producer boundary

The missing component is observation/refinement only. It must:

1. locate the exact deployed Preprod Counter singleton;
2. locate the exact deployed B1 PrizePool singleton;
3. decode authenticated datum/value state;
4. obtain the authoritative V3 pre-state/carrier observation;
5. obtain authenticated Pool USDM valuation;
6. construct the complete IssueDecisionInput without reimplementing economic admission;
7. preserve one observation reference end-to-end;
8. reject fixtures and mismatched UTxO references.

Adapter/CARDANO/observation/EconomicObservation.ts validates an already-derived canonical state; it does not derive PRE-RICH V3 state from deployed Cardano UTxOs. Therefore this gap belongs at the observation/refinement boundary, not in IMMORTAL economics or the browser.

## Acceptance witness

A real Preprod packet containing exact Counter/Pool references, canonical V3 pre-state, observation reference/time, and authenticated Pool valuation must execute issue-admission without fixture/synthetic values and remain bound to the same evidence packet.

**STATUS: OPEN — concrete Preprod observation/refinement producer missing.**
