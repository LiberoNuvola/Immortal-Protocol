# IMMORTAL — RF8 Economic Surface Reachability Delta
Date: 2026-09-24
Branch: `work/immortal-green-closure`

## Purpose

Follow-up to `RF8_NO_SIDE_DOOR_SURFACE_AUDIT_20260924.md`.

This pass inspects the current closure-branch source directly, focusing on whether the economically material Cardano surfaces actually invoke one canonical Economic Gate, rather than merely enforcing compatible local predicates.

No economic semantics are changed.

## Direct current-branch observations

### 1. MintPolicy is an independent economic admission surface

Current `plutus/MintPolicy.hs` defines `mkPolicy` and, for the sale path, independently requires:

- exactly one counter input and counter advancement;
- exactly one serial ticket NFT mint;
- valid Pending `PrizeDatum`;
- `atomicTreasuryPaymentValid`;
- `atomicPoolReservationValid`.

The two atomic helpers independently reconstruct/check the Treasury and B1 pool economic consequences.

The source does not show a call from `mkPolicy` into a callable universal `EconomicGate` abstraction.

### 2. B1PrizePool directly invokes universal solvency, but not a named canonical admission gate

Current `plutus/B1PrizePool.hs` imports:

- `Economic`;
- `EconomicKernel`;
- `UniversalEconomicKernel`;
- `UniversalEconomicState`;
- `B1LegacyAdapter`;
- `PreRichEconomicProfile`.

Its top-level `mkValidator` first checks:

`UniversalEconomicKernel.solvencyInvariant`

through the local `solvencyInvariant` wrapper, then dispatches action-specific economic transitions.

This is materially stronger than a purely local B1 invariant: the B1 validator is now connected to the universal solvency layer.

However, the inspected source still does not establish that every B1 economic action passes through one canonical sequence:

`candidate post-state → ProtectedCapital → RawSurplus → Economic Gate → Viability → Safe Action`.

The action branches contain their own transition predicates and then re-check `solvencyInvariant`.

### 3. PrizeValidator is another independent economic mutation surface

Current `plutus/PrizeValidator.hs` dispatches:

- `SyncBeacon`;
- `Reveal playerSecret`;
- `Claim`;
- `Expire`.

Reveal, Claim and Expire directly enforce pool-accounting relationships and lifecycle conditions.

Reveal checks, among other things:

- payout ≤ effective pool before reveal;
- pending-liability increase;
- unresolved-reserve decrease;
- pool liquidity preservation;
- unresolved-ticket-count decrement.

Claim checks:

- exact claimant payment;
- pool liquidity reduction;
- pending-liability reduction;
- reserve/count preservation.

Expire checks:

- expiry boundary;
- zero payout for unrevealed tickets;
- reserve release;
- count release;
- no continuing PrizeDatum.

The inspected dispatch is direct:

`PrizeAction → validateReveal / validateClaim / validateExpire`.

No canonical `EconomicGate` call is visible in this validator source.

### 4. Treasury is a particularly important RF8 gap

Current `plutus/Treasury.hs` exposes `mkValidator` with a `Distribute` action.

The current implementation computes:

- total lovelace from its own input;
- threshold;
- percentage basis;
- four percentage-derived amounts;
- required payments to four script hashes.

It does not import `EconomicKernel`, `UniversalEconomicKernel`, `UniversalEconomicState`, or the current Economic Admission boundary in the inspected source.

Therefore the current Treasury implementation is not yet evidenced as participating in the same canonical economic-admissibility chain as B1PrizePool.

This is not merely a missing symbol search. It is a direct current-source observation of a separate economic validator implementation.

## Triangulated conclusion

The earlier RF8 audit was conservative. The current source inspection sharpens it:

**RF8 remains OPEN, and the evidence gap is now localized.**

There is meaningful universal-kernel integration in B1PrizePool via `UniversalEconomicKernel.solvencyInvariant`, but the current branch does not yet provide evidence that:

1. MintPolicy sale admission;
2. B1PrizePool action transitions;
3. PrizeValidator Reveal/Claim/Expire;
4. Treasury distribution

all share one canonical economic admission/gate path.

The strongest presently observable pattern is **multiple validators independently enforcing economically related predicates**, with B1PrizePool additionally invoking universal solvency.

That is not equivalent to proof of a single canonical Economic Gate with no side doors.

## What to build next

Do not invent a new economic abstraction merely to satisfy RF8.

First build a **static reachability matrix** from canonical transition to concrete validator entry points:

| Surface | Entry | Universal kernel call observed | Economic Admission observed | Canonical transition binding | Negative bypass regression |
|---|---|---:|---:|---:|---:|
| SALE | MintPolicy.mkPolicy | No direct gate observed | local Treasury/Pool checks | Partial | Missing |
| SALE | B1PrizePool TicketIssued | Yes: solvencyInvariant | Not established | Partial | Missing |
| REVEAL | PrizeValidator.validateReveal | No direct universal gate observed | Not established in validator | Partial | Missing |
| REVEAL | B1PrizePool TicketRevealed | Yes: solvencyInvariant | Not established | Partial | Missing |
| CLAIM | PrizeValidator.validateClaim | No direct universal gate observed | Not established in validator | Partial | Missing |
| CLAIM | B1PrizePool TicketClaimed | Yes: solvencyInvariant | Not established | Partial | Missing |
| EXPIRE | PrizeValidator.validateExpire | No direct universal gate observed | Not established in validator | Partial | Missing |
| EXPIRE | B1PrizePool TicketExpired | Yes: solvencyInvariant | Not established | Partial | Missing |
| TREASURY | Treasury.mkValidator/Distribute | No | No | Open | Missing |

The next proof should establish the intended architecture rather than assume it:

`canonical action
→ rho/refinement
→ economic admission
→ concrete validator predicate
→ transaction witness
→ ledger observation`.

If the intended architecture deliberately permits multiple local validator predicates, RF8 must instead prove that every such predicate is a refinement of the same canonical admissibility relation and that no economically admissible state transition can be introduced outside it.

## Non-regression

- No KA/KC/KD change.
- No ticket-ladder change.
- No 500× change.
- No Jackpot semantic change.
- No expiry semantic change.
- No maxTxSize change.
- No claim of RF8 closure.
- No claim of CI-green.
- No claim of ledger evidence from source inspection.

**Status: RF8 OPEN / SURFACE REACHABILITY SHARPENED / NO NORMATIVE CHANGE.**

## 2026-09-25 — Current-tree validator surface census

Current Git tree at the closure HEAD was enumerated directly. The Plutus module set currently contains seven validator/policy entrypoint files:

`MintPolicy.hs`, `B1PrizePool.hs`, `PrizePool.hs`, `PrizeValidator.hs`, `Treasury.hs`, `BeaconRegistry.hs`, `CounterValidator.hs`.

Source inspection at the same HEAD shows:

| Surface | Entry | Economic role | Named EconomicGate reference | Universal kernel reference | Classification |
|---|---|---|---:|---:|---|
| SALE | `MintPolicy.mkPolicy` | ticket mint + sale atomicity | No | No | economic mutation surface / local refinement |
| POOL | `B1PrizePool.mkValidator` | pool accounting + lifecycle | No | Yes | economic mutation surface / universal solvency integration |
| LEGACY POOL | `PrizePool.mkValidator` | legacy pool validator | No | No | requires caller/use classification |
| LIFECYCLE | `PrizeValidator.mkValidator` | Reveal / Claim / Expire | No | No | economic mutation surface / local refinement |
| TREASURY | `Treasury.mkValidator` | legacy distribution | No | No | legacy/application economic surface |
| BEACON | `BeaconRegistry.mkValidator` | beacon registry state | No | No | protocol/application state surface; economic role must stay bounded |
| COUNTER | `CounterValidator.mkValidator` | monotonic issuance counter | No | No | supporting state surface; not independently classified as universal economic authority |

This census confirms that RF8 cannot be discharged by checking only for a single symbol reference. The current implementation deliberately has multiple validator-level enforcement surfaces.

### Consequence for RF8

The proof target is now more precise:

`canonical economic admissibility relation`
→ `profile/refinement witness`
→ `each economically material concrete validator predicate`
→ `paired state consumption / atomicity`
→ `ledger evidence`

where every economic surface must either:

1. invoke the canonical admissibility relation directly; or
2. be proved a semantics-preserving refinement of the same relation, including negative bypass coverage.

The current census therefore strengthens the **evidence requirement** without forcing an architectural rewrite.

### Immediate follow-up

Next autonomous pass should inspect every current caller/reference of `PrizePool.mkValidator`, `Treasury.mkValidator` and `CounterValidator.mkValidator`, then classify each as live economic path, supporting state path, or legacy/unreachable surface. No validator should be modified merely to make the census homogeneous.

**Status:** RF8 OPEN / CURRENT-TREE CENSUS COMPLETED / NO NORMATIVE CHANGE.