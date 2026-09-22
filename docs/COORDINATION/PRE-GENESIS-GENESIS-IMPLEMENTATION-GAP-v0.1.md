# PRE-RICH — PRE-GENESIS → GENESIS Implementation Gap Map v0.1

**Date:** 2026-09-22  
**Status:** TRIANGULATED / OPERATIONAL CONFORMANCE OPEN  
**Scope:** PRE-RICH application only; no IMMORTAL-wide semantic change.

## Finding

The current branch contains the semantic transition contract in `PRE-RICH/docs/PRE-GENESIS-GENESIS-TRANSITION-CONFORMANCE.md`, but the inspected runtime files do not yet expose a concrete PRE-GENESIS → GENESIS transition implementation.

Current evidence inspected:

- `PRE-RICH/docs/PRE-GENESIS-GENESIS-TRANSITION-CONFORMANCE.md` — defines the transition contract and required negative/evidence cases.
- `PRE-RICH/profile/PreRichEconomicProfile.hs` — supplies the application price ladder and 500x payout parameter; it contains no Genesis activation transition.
- `PRE-RICH/profile/PreRichEconomicAdmission.hs` — composes V3 transition validity, projection and IMMORTAL Economic Gate for economic actions; it does not itself implement the regime transition.
- `src/config.ts` — contains `GENESIS_TICKET_PRICE_USDM = 100` (the 1 USDM representation in current sub-units) and deployment addresses; it contains no Genesis activation predicate or state transition.

## Source reconciliation

The current branch conformance document freezes the Genesis activation predicate as verified PRE Treasury value >= 4,000 USDM and explicitly prohibits treating that condition as an automatic transfer of bootstrap value into PrizePool liquidity.

Historical/default-branch search results also show older documentation containing the same economic baseline, but those results are not treated as current-branch implementation truth. Direct fetches of several historical paths returned 404 on the working branch, so they are not used as implementation evidence.

## Required implementation boundary

The smallest implementation target is therefore not a new economic rule. It is an explicit application transition contract:

`PRE_GENESIS state`
→ `canonical Treasury observation`
→ `verified Genesis predicate`
→ `candidate Genesis state`
→ `on-chain revalidation`
→ `atomic transition`
→ `GENESIS state`

with the invariant:

`bootstrap evidence/value ≠ PrizePool liquidity`

unless a separate canonical application rule explicitly performs and accounts for that transfer.

## Negative cases that must be executable

1. Treasury value below threshold → reject.
2. Treasury observation stale or unverifiable → reject.
3. Wrong Treasury destination → reject.
4. Source regime already GENESIS / not PRE-GENESIS → reject.
5. Duplicate or concurrent transition → reject.
6. Attempted bootstrap-to-PrizePool reclassification without an authorized accounting transition → reject.

## Important non-regression

Do not add a second Genesis threshold.
Do not import Genesis activation into IMMORTAL universal kernel semantics.
Do not infer that `GENESIS_TICKET_PRICE_USDM` is itself an activation predicate.
Do not use the existence of a Treasury UTxO as proof that its balance is PrizePool liquidity.
Do not mark this front CLOSED until an actual transition trace exists.

## Next deterministic action

Map the exact PRE-RICH on-chain state datum/validator that should carry the regime boundary, then implement only the minimum transition/revalidation surface needed for the conformance document, followed by positive and negative ledger evidence.

**No economic parameter changed by this document.**