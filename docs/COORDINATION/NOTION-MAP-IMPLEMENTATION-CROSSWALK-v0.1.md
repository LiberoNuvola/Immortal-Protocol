# IMMORTAL — Notion Mapping → Repository Crosswalk v0.1

**Status:** TRIANGULATED / OPERATIONAL MAP  
**Date:** 2026-09-22  
**Branch:** `work/immortal-green-closure`

## Purpose

This document records the current Notion mapping that materially changes how repository work must be sequenced. It is a navigation/evidence artifact, not a normative source.

## 1. Canonical map now confirmed

The Notion workspace contains a large, layered specification/evidence graph. The active architecture is:

`IMMORTAL Constitution / Kernel → Economic Gate → Adapter → PRE-RICH application → Cardano evidence`

The major implementation fronts are not independent tickets; they form a dependency graph:

`Materios canonical evidence → B3 state authentication → Beacon → deterministic GameRules → canonical economic state → certified NFT state → lifecycle settlement`

In parallel:

`Observation / EEV → Economic Gate → Viability → Safe Action → Atomic Transition → ledger evidence`

## 2. Genesis finding

Notion sources confirm all of the following:

- PRE-RICH regimes are `PRE_GENESIS → GENESIS → ACTIVE → QUIESCENT`.
- Genesis trigger is the verified PRE Treasury value predicate `>= 4,000 USDM`.
- Invocation is permissionless.
- On-chain revalidation is mandatory.
- Safe stall is valid if nobody invokes.
- Bootstrap Treasury value is **not automatically PrizePool liquidity**.
- Duplicate/concurrent submissions must not duplicate the transition.

Repository triangulation now shows:

- `PRE-RICH/profile/PreRichGenesisAdmission.hs` already exists and is exposed by `plutus/pre-rich-plutus.cabal`.
- It is the correct application-side Plutus admission seam.
- `PreRichGenesisAdmission` verifies Treasury identity, source regime, PRE asset, Treasury state, Oracle verification/freshness and the value predicate.
- It does **not** carry or mutate a PRE-GENESIS/GENESIS state.
- No current-branch Genesis validator/state datum/action was found in the Plutus module tree.
- Therefore the remaining Genesis gap is **not the economic predicate**. It is the **canonical state carrier + atomic transition + on-chain concurrency/idempotence boundary**.

Do not create a second TS authority. The existing TS admission seam is evidence/off-chain tooling; the Plutus seam is the candidate authoritative contract.

## 3. Treasury / Oracle map

Current evidence graph:

`canonical Treasury UTxO → PRE quantity + authenticated Oracle reference → verified PRE→USDM value → Genesis predicate`

Existing `plutus/Economic.hs` supplies authenticated Oracle mechanics and freshness checks.

Notion qualification remains open for the deployment PRE→USDM source set/provider. Therefore:

- do not canonize a venue/feed merely because it is observable;
- do not use Snek/Splash evidence as an oracle by default;
- keep source qualification separate from the existing authenticated Oracle mechanism.

## 4. Snek / external-event map

Notion Gates 26–41 have already separated:

- Snek bonding-curve phase;
- graduation boundary;
- Splash post-graduation phase;
- pool identity from shared validator address;
- pool NFT / UTxO lineage;
- price continuity from lifecycle continuity.

Gate 41 fixes a State-0 anchor and deployment lineage work, but full historical replay remains open.

This work is evidence acquisition and source qualification. It must not silently become the Genesis oracle.

## 5. Economic Gate / state-boundary map

Notion T2 and the multi-front checkpoint confirm the universal transition chain:

`canonical state → authoritative inputs → obligations/exposure → candidate post-state → Safe → K_c viability → atomic commit → history`

The repository state-boundary audit confirms:

- universal economic aggregates already have a projection path;
- TicketClassState, activation control and Jackpot lifecycle are application-shaped;
- Jackpot remains PRE-RICH-owned;
- V3 should not be destructively rewritten before consumer/conformance mapping is complete.

Therefore B4/B5/B6 remain coupled: ProtectedCapital preservation and V3/Cardano equivalence must be proven action-by-action before any large V3 refactor.

## 6. Algorithmic governability map

The current Notion research has progressed beyond simple adaptive-search safety:

- SearchPolicy may adapt;
- ViabilityPredicate is institutionally declared/versioned;
- Recovery is pre-authorized and non-escalating;
- Monitor measures but does not define viability;
- competing monitors may diverge without transferring authority;
- result-dependent authority is explicitly prohibited;
- executable competing-monitor adversarial test remains open.

This remains research/conformance work, not a new economic primitive.

## 7. Fee / Treasury / incentive map

Notion now contains a full fee research chain:

`Protocol Usage Fee → valuation/settlement contract → Treasury/accounting boundary → optional authorized reward budget`

The key separation is:

`ProtocolUsageFee != ChainExecutionCost`

and reward logic must remain distinct from fee logic.

Build/governance rewards are candidate adaptive incentives only; no fixed distribution policy is canonized by this map.

## 8. Immediate repository queue

1. **Genesis:** locate or prove absence of the canonical PRE-GENESIS/GENESIS state carrier; do not invent a parallel economic state machine.
2. If absent, derive the smallest application-specific state carrier from T2/P0 and existing Cardano datum architecture before coding.
3. Bind the existing Plutus admission predicate to that state carrier and atomic transition.
4. Add negative tests for stale/wrong Treasury/wrong regime/duplicate/concurrent/reclassification.
5. Continue fresh Genesis admission CI.
6. Continue Cardano Reveal size/evaluator evidence independently; do not mix emulator budget failures with tx-size conclusions.
7. Continue B3-A/B Materios canonicality/state-authentication work.
8. Continue AG-01 executable conformance and independent replay.
9. Continue fee/Treasury accounting boundary without promoting `src/treasuryPolicy.ts` percentages to IMMORTAL.
10. Continue algorithmic-governability competing-monitor executable test.
11. Keep Snek/Splash evidence qualification separate from Genesis oracle canonization.

## 9. Anti-regression rule

Notion mapping is a navigation layer. It does not override repository canonical specifications or implementation evidence. Every code change still requires source classification and action-level conformance evidence.
