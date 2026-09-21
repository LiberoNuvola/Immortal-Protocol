# IMMORTAL — V3 ↔ Cardano Semantic Equivalence Register

**Status:** OPEN — B6 implementation/conformance
**Branch:** `work/immortal-green-closure`
**Purpose:** record the exact refinement obligations between the chain-neutral V3 economic model and the Cardano/PRE-RICH realization. This document is evidence/conformance material; it does not redefine canonical economics.

## 1. Refinement target

For implementation state σ and canonical V3 state S, the implementation must establish a deterministic refinement relation ρ(σ,S) and satisfy the RF1–RF11 obligations defined by the current refinement conformance specification.

For an implementation action, the required direction is:

`ρ(σ,S) ∧ Commit(σ,a_impl,σ')`

→ there exists a canonical action/evidence pair compatible with S;

→ the canonical candidate post-state is admissible;

→ the realized Cardano state refines that post-state.

No conclusion of full equivalence is made until RF1–RF11 and the no-side-door condition are demonstrated.

## 2. Action-by-action map

| V3 action | Canonical V3 requirement | Cardano realization observed | Current status |
|---|---|---|---|
| `Issue cid price` | profile price exact; class exists; `classSaleable(S,cid)`; unresolved reserve/count increment; class exposure increment | B1 `TicketIssued priceUsdm`: exact PrizeDatum price binding, Ticket NFT mint, unresolved reserve/count increment, post-state solvency | **PARTIAL / NOT EQUIVALENT** — B1 does not directly encode or enforce V3 class activation/saleability. |
| `Reveal cid payout` | profile payout bound; unresolved class member; reserve release; liability crystallization; post-state structural validity | PrizeValidator derives deterministic result/payout; B1 decreases reserve/count and increases pending liability; both require continuing outputs and accounting consistency | **PARTIAL / STRONGER-CONSTRAINT DIVERGENCE** — B1 also requires `payout <= effectivePool(pre)`, which is not the same predicate as V3 structural transition + post-state solvency. |
| `Claim amount` | positive; amount ≤ crystallized liabilities; liability decreases | PrizeValidator additionally proves ownership/signature, expiry window, exact settlement value via oracle and atomic B1 liability/liquidity reduction | **PARTIAL** — environment/settlement predicates are downstream requirements and must be represented in the admissibility/conformance envelope. |
| `Expire cid` | reserve/count decrease for an unresolved member | Prize lifecycle uses explicit per-ticket `pdExpiresAt`; expired claim is prohibited and late reveal has no economic effect | **PARTIAL / MODEL-EVIDENCE GAP** — current aggregate V3 action does not itself carry ticket identity or crystallized `expiresAt`; eligibility must enter through an explicit refinement boundary. |

## 3. Concrete divergence A — Issue / class saleability

Current V3 `Issue cid price` checks the profile price, class existence and `classSaleable(S,cid)` before applying the issue delta.

Current B1 `TicketIssued priceUsdm` checks price binding, NFT mint, aggregate reserve/count transitions and post-state solvency. The observed validator path does not directly reconstruct `CurrentActiveClass`, `HighestClassEverActivated`, or the PRE-RICH class-saleability predicate.

**Interpretation:** a Cardano transaction can refine V3 Issue only if the application/Adapter evidence path proves the class-saleability precondition before commit, or if the validator is extended to enforce it. Silent reliance on UI/relayer intent would violate RF8.

**Current decision:** do not modify validator economics here. This is an explicit B6 conformance gap.

## 4. Concrete divergence B — Reveal / immediate executable liquidity

The current Cardano B1 Reveal path checks:

`payout <= effectivePool(pre)`

with:

`effectivePool(pre) = totalLiquidity - pendingLiabilities - unresolvedReserve - lockedJackpot`

The chain-neutral V3 transition checks the profile payout bound and post-state structural validity; the current B5 admission bridge checks universal ProtectedCapital/solvency plus external Gate/Viability witnesses.

These predicates are not algebraically identical.

### Counterexample

One unresolved 1-unit ticket, no crystallized liabilities, no locked Jackpot:

- `EEV = 500`
- `unresolvedReserve = 1`
- `payout = 500`

V3 post-state ProtectedCapital can equal 500, so post-state solvency can hold exactly.

B1 pre-reveal effective pool is `500 - 1 = 499`, so the Cardano validator rejects a 500-unit payout.

**Conclusion:** the canonical Economic Gate now exposes an explicit, chain-neutral immediate-executable-liquidity condition. The Gate does not replace the validator predicate; it requires a verified execution envelope when the action needs immediate settlement. The Cardano `payout <= effectivePool(pre)` check can therefore be represented as an Adapter-side execution-liquidity witness rather than as a new economic formula.

This is a B5/B6 interface question, not a reason to weaken B1 or V3.

## 5. Concrete divergence C — Claim / settlement environment

V3 `Claim amount` is an economic liability transition. Cardano Claim additionally depends on ticket ownership, claimant signature, expiry eligibility, exact settlement-value equivalence under the active oracle, atomic B1 liability/liquidity reduction, and ticket-NFT preservation.

**Required refinement:** the external action/evidence envelope must prove all environment predicates required for a committed Claim. The Adapter may transport and verify those facts but cannot turn them into a second economic model.

## 6. Concrete divergence D — Expire / per-ticket lifetime

The current V3 action is aggregate: `Expire cid`.

The Cardano PrizeDatum carries a per-ticket `pdExpiresAt` crystallized at issuance. Current A1 architecture says expiry duration is DApp/profile-defined, deterministic from authoritative issuance state, then crystallized into the ticket.

Therefore the conformance boundary must carry evidence establishing that the specific unresolved economic right being expired has crossed its own `expiresAt`.

A class-level aggregate transition without that witness is insufficient to establish RF3/RF9 by itself.

**No new expiry number is introduced here.** This is a representation/refinement obligation.

## 7. Legacy B1 projection boundary

`B1LegacyAdapter.legacyB1ToAggregateV3View` collapses all unresolved reserve into one class and maps locked Jackpot into the V3 Jackpot field.

This is acceptable only as a compatibility projection for the represented legacy aggregate. It is not a lossless V3 refinement for class composition, class activation history, non-zero SafetyCapital, non-zero ReserveProtection, non-zero MandatoryFutureCosts, or full Jackpot lifecycle state.

The existing fail-closed `v3ToLegacyB1` checks correctly prevent unsupported state from being silently projected.

## 8. RF obligation status

| RF | Current evidence | Status |
|---|---|---|
| RF1 State correspondence | V3 / PRE-RICH projection and current Adapter aggregate | PARTIAL |
| RF2 Action correspondence | action map + source audit | OPEN |
| RF3 Transition correspondence | replay/projection tests for Issue/Reveal/Claim/Expire | PARTIAL |
| RF4 Obligation correspondence | aggregate reserve + liabilities checks | PARTIAL |
| RF5 Protected-capital correspondence | V3 ↔ universal aggregate witness | PARTIAL / IMPLEMENTATION EVIDENCE |
| RF6 Ω correspondence | Gate/Viability requires external certified-Ω witness | OPEN |
| RF7 Safety preservation | local solvency/conformance tests | PARTIAL |
| RF8 Gate/no-side-door | DApp submit path partly routed through Adapter; whole-program proof open | OPEN |
| RF9 Expiry preservation | validator lifecycle logic exists; per-ticket V3 expiry refinement open | OPEN |
| RF10 Atomicity | B1/Prize coupling tested; complete execution proof open | PARTIAL |
| RF11 Determinism/history | deterministic GameRules/transition tests exist; complete audit open | PARTIAL |

## 9. Current conclusion

The current system demonstrates **substantial bounded conformance evidence**, but not full V3 ↔ Cardano semantic equivalence.

Next actions:

1. close the executable-liquidity interface between B5 and B6;
2. ensure Issue class-saleability is part of committed action evidence;
3. bind Claim/Expire to the environment evidence required by their lifecycle semantics;
4. close RF8 by enumerating every economic-state-mutating implementation path;
5. repeat action-by-action differential replay after those bridges are connected.

**No universal economic formula is changed by this register.**
## 10. RF8 — economic transaction path enumeration

Current TypeScript source audit identified these transaction-producing paths:

| Path | Economic state mutation | Submission boundary | Current result |
|---|---|---|---|
| `src/mint.ts` | Ticket sale / B1 `TicketIssued` / PrizeDatum issuance | `createCardanoExecutionAdapter` directly | submit centralized; construction remains in DApp code |
| `src/gameFlow.ts` | SyncBeacon, Reveal, Claim and associated B1 updates | `signAndSubmitTx` → Cardano Adapter | submit centralized; construction remains in DApp code |
| `src/txHelpers.ts` | reusable claim transaction helper | `createCardanoExecutionAdapter` | submit centralized |
| `src/registryFlow.ts` | Beacon registry state, not direct economic liability state | `signAndSubmitTx` | adapter-routed, non-economic support path |
| `src/createRound.ts` | round/registry state, not direct economic liability state | `signAndSubmitTx` | adapter-routed, non-economic support path |

Current source inspection found no direct `lucid.signTx(...)` or `lucid.submitTx(...)` in the three TypeScript economic orchestrators `mint.ts`, `gameFlow.ts`, and `txHelpers.ts`.

A regression test now enforces this boundary for those files. This is evidence for the TypeScript side of RF8, not a whole-program proof: Plutus validator paths, dynamically loaded modules and any future transaction constructors still require enumeration.

### Adapter-scope residual

The Cardano Adapter specification describes transaction construction as an Adapter responsibility where applicable, while the current application code still constructs Lucid transactions in `src/mint.ts` and `src/gameFlow.ts` before handing the built transaction to the Adapter for signing/submission.

This is therefore a remaining **Adapter responsibility-scope gap**, but it does not create a second economic authority by itself. The current immediate safety boundary is preserved because signing/submission is centralized and on-chain validators still enforce their own predicates.

Do not silently migrate all transaction construction in this front: it may affect many application consumers and is not required to prove the economic semantics yet. It remains an explicit follow-on conformance task.
## 2026-09-21 — Expire Refinement Delta

V3 remains an aggregate class-level action (`Expire cid`), while the Cardano PrizeDatum carries ticket-specific `pdExpiresAt` and the B1 PrizePool transition releases exactly that ticket's `pdPriceUsdm` reserve.

A new PRE-RICH refinement witness makes the missing relation explicit:
- the selected ticket must belong to the aggregate class;
- its price must equal the canonical profile price for that class;
- the transaction time must be at or after the ticket's crystallized expiry;
- exactly one unresolved ticket is consumed;
- exactly one ticket-price reserve is released;
- no liability is created by expiry.

Files:
- PRE-RICH/profile/PreRichExpireRefinement.ts
- src/__tests__/preRichExpireRefinement.test.ts

This is a refinement/evidence layer, not a replacement for on-chain enforcement and not a proof of arbitrary-ticket selection authority. The Cardano B1 validator remains responsible for transaction-level enforcement of its own predicate.