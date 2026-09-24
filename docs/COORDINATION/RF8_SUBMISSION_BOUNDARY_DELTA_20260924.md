# IMMORTAL — RF8 Submission Boundary Delta 2026-09-24

## New evidence

The repository already contains `src/__tests__/rf8-submission-boundary.test.ts`.

Before this delta it proved only that direct Lucid `signTx/submitTx` calls were confined to `src/txHelpers.ts`, and that `txHelpers.ts` used the Cardano adapter.

The test has now been strengthened on branch `work/immortal-green-closure`.

Commit:

`261450175d097dd28442dff0a9f2e13c48c9899b`

## Added regression properties

### 1. Economic orchestrators must use the economic path

The test enumerates:

- `src/mint.ts`
- `src/gameFlow.ts`

and requires:

- presence of `submitEconomic`;
- absence of a generic `signAndSubmitTx(...)` path inside the economic orchestrator source;
- absence of direct adapter `.submit(...)` inside the economic orchestrator source.

This currently covers the canonical SALE/MINT and Reveal/Claim/Expire orchestration modules.

### 2. Generic and economic helpers remain distinct

The test verifies that `src/txHelpers.ts` contains both:

- `signAndSubmitTx` → generic adapter submission;
- `signAndSubmitEconomicTx` → economic adapter submission.

This is intentional because non-economic protocol operations such as BeaconRegistry creation/publication still legitimately use the generic path.

## Triangulated caller result

Current source inspection identified generic submission callers in:

- `src/createRound.ts` → creates a BeaconRegistry Pending UTxO;
- `src/registryFlow.ts` → publishes BeaconRegistry Pending → Ready.

These are not currently classified as economic mutation surfaces.

Current economic paths are:

- SALE/MINT → `submitEconomic`
- REVEAL → `submitEconomic`
- CLAIM → `submitEconomic`
- EXPIRE → `submitEconomic`

Compatibility wrappers `src/claim.ts` and `src/claimFlow.ts` delegate to canonical Claim and explicitly reject missing economic admission.

## Remaining RF8 gap

This closes an important **repository-level off-chain reachability sub-property**, but it does not close RF8 as a whole.

Still open:

1. exhaustive classification of every transaction constructor outside the identified flows;
2. binding of `EconomicAdmissionWitness.stateHash` and decision reference to the exact canonical V3 pre/post-state and action;
3. proof that the witness admission relation is the same admissibility relation used by the canonical Economic Gate;
4. validator-by-validator refinement for SALE/REVEAL/CLAIM/EXPIRE;
5. negative tests proving malformed/stale admission witnesses cannot authorize a semantically different transaction;
6. Cardano ledger evidence for the final transition.

## Important architectural finding

The generic adapter path is not itself evidence of an RF8 violation.

There are legitimate non-economic operations that need generic submission.

The RF8 property is therefore better expressed as:

> Every economically material mutation must cross `submitEconomic`; non-economic infrastructure transitions may use `submit`.

That is now encoded as a regression test for the current canonical economic orchestrators.

## Status

RF8-A Off-chain economic submission boundary:
**STRONG IMPLEMENTATION + REGRESSION EVIDENCE**

RF8-B Complete no-side-door/refinement:
**OPEN**

No economic constants or protocol semantics changed.
