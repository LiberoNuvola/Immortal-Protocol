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

## New finding: Treasury migration is a direct dependency

The historical Treasury implementation is not a safe implementation target for Genesis activation.

The inspected Treasury datum/validator uses legacy percentage allocation fields (`tdPrizePct`, `tdStakePct`, `tdReservePct`, `tdMaintenancePct`) and a `Distribute` action. The Treasury validator derives distribution amounts from the input balance and requires a fixed 10000 basis-point split.

The current Treasury distribution specification explicitly classifies that percentage model as retired migration debt and requires V3 liability-first accounting instead.

Therefore the Genesis transition must **not** be implemented by reusing the legacy `Treasury.Distribute` path or by treating its threshold field as the Genesis predicate.

The required Genesis predicate is a verified economic-value condition. The legacy Treasury validator's `tdThreshold` is not sufficient evidence of that predicate.

This creates a concrete dependency:

`verified Treasury PRE value`
→ `canonical V3-compatible Treasury observation`
→ `Genesis predicate`
→ `Genesis transition`

The Treasury migration/conformance front therefore has to be resolved before Genesis activation can be declared operationally closed.

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
7. Legacy Treasury percentage/distribution path presented as Genesis evidence → reject.

## Important non-regression

Do not add a second Genesis threshold.
Do not import Genesis activation into IMMORTAL universal kernel semantics.
Do not infer that `GENESIS_TICKET_PRICE_USDM` is itself an activation predicate.
Do not use the existence of a Treasury UTxO as proof that its balance is PrizePool liquidity.
Do not reuse legacy Treasury percentage allocation as Genesis activation logic.
Do not mark this front CLOSED until an actual transition trace exists.

## Next deterministic action

Map the exact PRE-RICH on-chain state datum/validator that should carry the regime boundary, then map the V3-compatible Treasury observation needed by the predicate. Only after those two boundaries are explicit should the minimum transition/revalidation surface be implemented, followed by positive and negative ledger evidence.

**No economic parameter changed by this document.**

## 2026-09-22 P0/T2 reconciliation

The Notion T2 conformance specification and P0 liveness contract were fetched directly on 2026-09-22 and add no new economic rule. For PRE-GENESIS -> GENESIS they require the same chain: verified Genesis predicate, permissionless invocation, independent on-chain revalidation, atomic state consumption, idempotence/concurrency rejection, stale/conflicting-state rejection, and SAFE STALL/re-discovery when nobody submits.

The repository phase-1 `PreRichRegimeState` implements only the pure application carrier seam. It is therefore correctly classified as partial implementation, not P0 conformance. The final carrier still needs a canonical singleton identity plus transition/version binding and authenticated Treasury/Oracle evidence references.

A direct current-branch tree inspection found existing singleton patterns for B1 PrizePool and Oracle, but no already-defined canonical Genesis regime singleton policy/name. Consequently no identity has been invented. This preserves the T2/P0 authority boundary: deployment identity must be established before the Cardano validator can claim a unique canonical regime UTxO.

The Cardano Adapter Sale remains green on the latest observed run. The Reveal emulator remains open; its latest canonical-limit failure is execution-budget exhaustion, while the earlier high-budget differential probe remains the stronger isolation evidence for the B1 `Value/valueOf` evaluation path. These fronts are independent of Genesis semantics.

## Current closure classification

- Genesis admission predicate: GREEN at semantic/conformance seam.
- Genesis application carrier: IMPLEMENTED phase 1.
- Genesis Cardano singleton identity: OPEN.
- Genesis atomic on-chain transition: OPEN.
- P0 transition conformance: OPEN.
- Reveal evaluator/runtime compatibility: OPEN.
- No economic parameter changed.


## 2026-09-22 canonical identity search result

A second targeted search was run across the current repository branch for a pre-existing Genesis regime/state singleton, state token, regime identity, or equivalent canonical UTxO binding. The search found existing canonical identity patterns for the Oracle State and B1 PrizePool, but no Genesis-specific policy/name, regime-state token, or already-defined singleton datum/validator that can be reused without inventing a new authority surface.

The current P0/T2 text likewise specifies that at most one transition may consume the canonical state and that stale/conflicting submissions must be rejected, but it does not itself define a concrete Cardano asset identity for PRE-GENESIS/GENESIS. Therefore the correct closure state remains **Genesis Cardano singleton identity OPEN**. No validator identity or policy ID is being fabricated from deployment guesses.

This search result is now treated as a hard implementation boundary: the next Genesis implementation step must come from an existing canonical deployment/decision source or an explicit new application decision, not from inference from the B1 Pool NFT, Oracle singleton, Treasury address, or historical Snek Pool NFT.


## 2026-09-26 carrier/proof refinement

A targeted implementation inspection closed an earlier ambiguity about the Genesis carrier seam.

- `PRE-RICH/profile/GenesisRegimeCarrier.hs` is confirmed as the application-owned singleton lifecycle validator. It enforces PRE-GENESIS -> GENESIS, monotonic transition/state versions, exact carrier-token conservation, authenticated Treasury/Oracle reference inputs, fresh Oracle evidence, the Genesis predicate, and no PrizePool input/output in the transition.
- `PRE-RICH/profile/GenesisCarrierMintPolicy.hs` is confirmed as a one-shot mint authority parameterized by one concrete seed `TxOutRef`. Therefore the carrier policy ID is deployment-derived and must be recorded from the actual seed UTxO; it must not be guessed or copied from a test fixture.
- `audit/pre-genesis-genesis/genesis-carrier-ledger-trace.ts` is explicitly marked non-production and uses test identities/native policies. Its successful trace, when executed, is conformance evidence only and does not establish production identities.

This changes the closure classification from “carrier implementation absent” to “carrier implementation present; production deployment identity/evidence open”. The remaining Genesis gap is therefore deployment identity + real Preprod transition evidence, not invention of another validator.

## 2026-09-26 Issue admission refinement

The Issue runtime boundary was also inspected end-to-end.

- `src/preRichIssueAdmissionBridge.ts` requires an injected `AuthoritativeIssueAdmissionProvider` and fail-closes if the provider does not return a valid `EconomicAdmissionWitness`.
- `Adapter/CARDANO/runtime/EconomicAdmission.ts` independently binds the witness to the exact Counter/PrizePool inputs, the authenticated Pool USDM valuation, and the concrete executable-liquidity observation.
- `Adapter/CARDANO/observation/ExecutableLiquidityObservation.ts` requires the observed spendable liquidity to be the exact authenticated B1 PrizePool UTxO and value; no second liquidity oracle is introduced.
- Repository search found no production implementation of `AuthoritativeIssueAdmissionProvider`. The missing piece is therefore the authoritative producer/bridge from the existing PRE-RICH economic admission result to the runtime witness. Test-only witness constructors are not sufficient for the first real Preprod Issue.

No economic constants or Genesis semantics are changed by this refinement.

## Updated closure classification — 2026-09-26

- Genesis admission predicate: GREEN.
- Genesis carrier validator: IMPLEMENTED.
- Genesis carrier mint policy: IMPLEMENTED, deployment-parameterized.
- Genesis production singleton identity: OPEN — must be established from an actual deployment seed UTxO.
- Genesis real Preprod transition evidence: OPEN.
- Authoritative Issue admission producer: OPEN.
- Cardano Issue submission: BLOCKED only at the authoritative admission producer boundary once canonical Preprod Treasury/Pool inputs are available.

## 2026-09-26 Issue admission producer implementation

`Adapter/CARDANO/observation/AuthoritativeIssueAdmission.ts` now provides the production-side bridge that converts an already-authoritative Issue decision into `EconomicAdmissionWitness`. It fail-closes on action class, exact Pool input, exact authenticated Pool USDM value, and exact executable-liquidity source set.

`src/mint.ts` now accepts `authoritativeIssueAdmissionProvider` as the runtime path and requires `authoritativePoolUsdmValue` when that path is used. The browser therefore cannot silently substitute a local EEV/liquidity calculation.

CI coverage was added through `Adapter/CARDANO/observation/AuthoritativeIssueAdmission.test.ts` in the Cardano Adapter Sale conformance workflow.

### Remaining boundary

The runtime producer/bridge is now IMPLEMENTED. What remains OPEN is the upstream authoritative decision source itself: the service/relayer path that obtains the canonical V3 pre-state, evaluates the existing `PreRichEconomicAdmission` gate, and emits the signed/canonical decision artifact consumed by the producer. This must not be reimplemented as frontend economics.

Updated classification:
- Issue admission runtime producer: IMPLEMENTED.
- Authoritative economic decision source: OPEN.
- Exact Pool valuation source: existing canonical `Economic.poolUsdmValue` surface; runtime binding implemented.
- First real Preprod Issue: OPEN pending canonical decision artifact + live Pool/Treasury state.