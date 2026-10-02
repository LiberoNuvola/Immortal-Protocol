# PRE-RICH — Live V3 Economic State Carrier Gap

Date: 2026-09-26
Scope: first real PRE-RICH Issue on Cardano Preprod
Status: OPEN — deployment/runtime implementation required

## Finding

The authoritative Issue producer is now implemented in Haskell, but the live observation source required by that producer does not yet exist on-chain.

The existing B1PrizePool UTxO is not a lossless V3 economic state carrier.

plutus/B1LegacyAdapter.hs explicitly distinguishes aggregate compatibility projection from lossless V3 projection. The lossless projection rejects states that require unresolved tickets, class composition, non-zero protected-capital components, historical control, or Jackpot lifecycle information.

The B1 datum therefore must not be promoted to canonical V3 authority by filling missing fields with zeroes.

## Exact missing state

The live Issue admission needs an authoritative V3 pre-state containing:

- crystallized liabilities
- unresolved reserve
- unresolved ticket count
- SafetyCapital
- ReserveProtection
- MandatoryFutureCosts
- ticket-class state
- CurrentActiveClass
- HighestClassEverActivated
- Jackpot state

The Haskell source of truth is IMMORTAL/state/EconomicStateV3.hs.

## Required implementation

Introduce a separate application-owned V3 economic-state singleton, independent of Treasury, B1PrizePool, GenesisRegimeCarrier and BeaconRegistry.

The carrier must:
1. contain one canonical V3 economic state;
2. have a unique deployment-derived singleton identity;
3. expose the exact state through an on-chain datum/reference input;
4. have an authenticated lifecycle/version boundary;
5. make concurrent stale-state use fail closed;
6. bind Issue/Reveal/Claim/Expire transitions to the consumed or referenced state;
7. preserve the existing IMMORTAL economic admission path rather than reimplementing economics in TypeScript.

## Why a separate carrier is necessary

The existing GenesisRegimeCarrier deliberately contains regime identity and Genesis lifecycle information only. It must not be overloaded into a general economic-state object.

The B1PrizePool remains the concrete executable-liquidity/accounting surface.

The new carrier would provide the missing canonical V3 state observation surface while B1 continues to provide the concrete Pool/settlement surface.

Observation boundary:

V3 State Carrier + B1 PrizePool + Oracle + authenticated external evidence
→ PreRichEconomicAdmission
→ EconomicAdmissionWitness
→ Cardano Issue transaction

## First-issue initialization

No initial V3 state may be invented in the frontend.

The initial carrier state must be established by a deployment/Genesis transition whose exact state is explicitly specified and reproducible. Test vectors such as GoldenVectors.baseState are conformance fixtures only and must not be promoted to live authority.

## Non-regression

Do not:
- derive SafetyCapital/ReserveProtection/MandatoryFutureCosts from the legacy B1 datum;
- infer class history from UI state;
- use Treasury balance as a substitute for V3 state;
- reuse a test fixture as live authority;
- add a second economic algorithm in TypeScript;
- let the browser manufacture the carrier state or EEV.

## Acceptance witness

The gap closes only when all of the following exist on Preprod:
1. deployed V3 state-carrier script/policy;
2. exact singleton UTxO and datum;
3. reproducible decode into V3EconomicState;
4. exact binding to the Issue admission decision;
5. successful first DEMETER/CIP-30 Issue;
6. post-transaction carrier and B1 Pool states;
7. persisted transaction/UTxO evidence.

Until then the first-user Issue path remains correctly fail-closed.
## 2026-09-28 source reconciliation

A deeper branch-local census corrected the previous implementation classification. The V3 carrier is present on the current closure branch, under PRE-RICH/onchain/, not PRE-RICH/profile/:

- PRE-RICH/onchain/V3EconomicStateCarrier.hs
- PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs
- PRE-RICH/onchain/PreRichRegimeState.hs
- PRE-RICH/onchain/GenesisRegimeCarrier.hs

The carrier validator provides a singleton-token boundary and requires exactly one script input/output, preservation of carrier value, valid V3 state, and monotonic state version (after = before + 1). The one-shot mint policy binds initial minting to a deployment seed input.

This changes the status from missing implementation to implemented carrier / open economic-authority binding.

Critical remaining gap: the carrier currently validates structural state continuity, but does not bind the carrier transition to the corresponding Issue/Reveal/Claim/Expire decision, candidate post-state, decision fingerprint, or authenticated economic admission witness. It also does not establish EEV or ProtectedCapital provenance.

The separate PreRichIssueDecision still receives idiPreState, idiPreEEV, idiCandidateEEV, liquidity and truth/freshness booleans as explicit inputs. That is a decision function, not proof that those values originated from the deployed carrier or a qualified EEV source.

Required closure chain:

V3 carrier UTxO → authenticated pre-state → Haskell economic decision → exact action/post-state binding → Cardano transition → post-state carrier evidence

Separately:

qualified EEV source → EV1–EV7 evidence → Issue decision

No new economic rule is introduced. No B1/Treasury value is promoted to EEV. No TypeScript economic authority is added.

**STATUS: 🟢 V3 CARRIER IMPLEMENTATION PRESENT · 🔴 CARRIER→DECISION BINDING OPEN · 🔴 EEV SOURCE OPEN · 🟡 LIQUIDITY BINDING IMPLEMENTED / LEDGER EVIDENCE OPEN**
