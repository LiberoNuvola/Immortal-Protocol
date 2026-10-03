# State Machine Traceability Matrix

**Status:** NON-NORMATIVE AUDIT / TRACEABILITY  
**Scope:** PRE-RICH economic lifecycle on the current `work/immortal-green-closure` branch  
**Audit date:** 2026-10-03

## Purpose

This matrix traces the principal economic lifecycle transitions:

`ISSUE → REVEAL → CRYSTALLIZE → CLAIM → EXPIRE`

from normative semantics through implementation, tests, CI/evidence, and open gaps.

It does **not** create new economic semantics. Where the implementation differs from the universal model, the difference is classified rather than silently promoted to canon.

## Authority

- Universal IMMORTAL semantics: `docs/00-normative/01_CONSTITUTION_FINAL.md`, `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md`
- PRE-RICH application semantics: `PRE-RICH/docs/GAME-ECONOMY.md`
- V3 transition model: `IMMORTAL/kernel/EconomicTransitionV3.hs`
- Cardano prize realization: `plutus/PrizeValidator.hs`
- V3 ↔ Universal projection evidence: `plutus/test/ProjectionBoundaryConformanceTest.hs`
- Expiry profile/evidence: `PRE-RICH/src/PreRichExpiryPolicy.ts`, `PRE-RICH/src/PreRichExpiryEvidence.ts`

## Transition matrix

| Transition | Preconditions | State transformation | Required invariants | Implementation | Tests / evidence | Status |
|---|---|---|---|---|---|---|
| **ISSUE** | Canonical class exists; supplied price equals profile price; class is saleable; economically coupled sale must be atomic. | Add one unresolved ticket; increase unresolved reserve by price; increase class unresolved count/exposure. | Obligations represented before execution; post-state valid; protected-capital boundary preserved. | `EconomicTransitionV3.transition Issue`; application Issue admission in `src/mint.ts`; Cardano B1 sale path. | `GoldenVectors.hs`; `ProtectedCapitalConformanceTest.hs`; `ProjectionBoundaryConformanceTest.hs`; Issue decision/admission tests. | **CLOSED semantically; conformance/evidence ongoing** |
| **REVEAL** | Ticket unresolved; canonical class exists; payout satisfies PRE-RICH payout rule; randomness/evidence verified; expiry boundary respected. | Remove one unresolved obligation/reserve/exposure; crystallize winning payout; result/payout becomes immutable. | No new exposure; crystallized liability represented; payout cannot later be recomputed/reduced; late reveal cannot create claimability. | `EconomicTransitionV3.transition Reveal`; `PrizeValidator.validateReveal`; PrizeDatum crystallization fields. | `ProjectionBoundaryConformanceTest.hs`; Reveal refinement/safety tests; predeploy checks; Cardano conformance/evidence paths. | **CLOSED semantically; validator/evidence boundary remains a verification surface** |
| **CRYSTALLIZE** | Reveal has produced a deterministic winning result and economic capacity has been checked. | Freeze payout into crystallized/pending liability; ticket result and payout become immutable. | Liability must be represented; later treasury/pool/class changes cannot alter frozen payout. | Crystallization is represented inside the Reveal transition and PrizeDatum state rather than as a separate `V3Action`. | Projection boundary tests explicitly assert Reveal increases crystallized liabilities by exact payout; PrizeValidator/Types enforce post-reveal frozen fields. | **SEMANTICALLY CLOSED; implementation is a sub-transition of REVEAL, not an independent action** |
| **CLAIM** | Positive amount; amount does not exceed crystallized liability; ticket ownership/signature and settlement predicates must pass in Cardano realization; expiry must not have elapsed. | Reduce crystallized liability by exactly settled amount. | Atomic settlement; no unresolved-ticket mutation; frozen payout/value preserved; no double settlement. | `EconomicTransitionV3.transition Claim`; `PrizeValidator.validateClaim`; B1 PrizePool coordination. | `GoldenVectors.hs`; `ProjectionBoundaryConformanceTest.hs`; Claim validator/conformance tests; predeploy checks. | **CLOSED semantically; settlement/admission evidence remains deployment-specific** |
| **EXPIRE** | Ticket remains unresolved and current validity interval is at/after crystallized `pdExpiresAt`; no claim/reveal may resurrect the right. | Release unresolved reserve/exposure exactly once; consume unresolved ticket; no crystallized liability is created. | No claim after expiry; no new liability; no resurrection; late reveal has zero economic effect; dissolution occurs once. | `EconomicTransitionV3.transition Expire` models aggregate economic delta; `PrizeValidator.validateExpire` enforces ticket-level expiry and no continuing PrizeDatum. | Expiry policy tests; expiry evidence tests; `ProjectionBoundaryConformanceTest.hs`; predeploy checks for EXPIRE/`pdExpiresAt`. | **SEMANTICALLY CLOSED; ticket-level identity/expiry is an explicit refinement boundary** |

## Important findings

### 1. CRYSTALLIZE is not a sixth ledger action

The V3 economic model exposes `Issue`, `Reveal`, `Claim`, and `Expire`. Crystallization is the irreversible economic consequence of a winning Reveal: the payout moves into crystallized liabilities and is frozen.

Therefore the lifecycle notation

`REVEAL → CRYSTALLIZE → CLAIM`

is semantically useful, but the current implementation correctly realizes crystallization inside `REVEAL` rather than inventing a second action.

### 2. Universal IMMORTAL vs PRE-RICH policy boundary is clean

The universal Constitution requires:
- obligations represented before execution;
- liability-first protection;
- atomic validate/compute/post-state/commit semantics;
- deterministic derivations;
- final expiry with no resurrection.

PRE-RICH additionally defines application-specific rules such as:
- KA/KC/KD;
- ticket price ladder;
- 500×P maximum normal payout;
- Classic-6 distribution;
- state-derived expiry profile;
- Jackpot policy.

These application rules must remain outside the universal kernel.

### 3. The main real conformance boundary is ticket identity

`EconomicTransitionV3` is an aggregate economic transition model. Its `Reveal cid payout` and `Expire cid` actions operate on a class and aggregate unresolved counts/reserve.

The Cardano `PrizeValidator` works at ticket identity level, with `PrizeDatum`, `pdExpiresAt`, ownership, randomness/evidence, and continuing-output constraints.

This is not automatically a contradiction. It is a **refinement boundary**. The conformance obligation is to prove that the ticket-level predicates refine the aggregate economic delta without weakening the universal safety rules.

### 4. Expiry policy is now closed at the mechanism level

PRE-RICH currently declares `preRichExpiryPolicyV1` with:
- MIN = 2 hours;
- MAX = 300 days;
- horizon derived deterministically from verified issuance-state pressure;
- `expiresAt = issuedAt + H`.

Those bounds are PRE-RICH application parameters, not IMMORTAL constants. The mechanism is closed; changing the application profile would be an explicit policy change.

### 5. Jackpot status

The current PRE-RICH Game Economy specification now closes Jackpot payout mode as full current locked-balance payout exactly once. This is application policy and does not belong in the universal state machine.

## Evidence interpretation

A passing transition/unit test proves the tested predicate over its fixture/model. It does **not** by itself prove:
- live ledger acceptance;
- completeness of the authoritative environment envelope Ω;
- correctness of external randomness/oracle assumptions;
- equivalence of aggregate V3 state and every ticket-level realization.

Those require the corresponding adapter, ledger, and evidence gates.

## Open items

1. **Ticket-level refinement proof:** explicitly bind ticket identity, `pdExpiresAt`, and per-ticket lifecycle to the aggregate V3 transition deltas.
2. **Reveal/Claim/Expire Cardano evidence:** keep unit/model conformance separate from actual ledger acceptance evidence.
3. **Issue atomicity evidence:** demonstrate the coupled ticket mint + Treasury payment + unresolved reservation boundary on the declared Cardano realization.
4. **Ω/refinement perimeter:** publish the environment assumptions used by the deployment when claiming conformance.
5. **No semantic reopening:** implementation gaps must not be used to silently change the closed PRE-RICH policy.

## Audit conclusion

The state machine is **semantically coherent at the current documented abstraction boundary**. The remaining work is primarily refinement/evidence: proving that ticket-level Cardano execution faithfully realizes the aggregate economic transitions and that each claimed live property has corresponding ledger evidence.

This document is an audit aid only and is not a source of economic authority.
