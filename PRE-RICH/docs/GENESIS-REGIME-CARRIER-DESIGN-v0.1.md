# PRE-RICH Genesis Regime Carrier — Minimal On-Chain Design v0.1

**Status:** DESIGN / CONFORMANCE TARGET — PHASE-1 APPLICATION CARRIER IMPLEMENTED; CARDANO CARRIER NOT YET IMPLEMENTED  
**Branch:** `work/immortal-green-closure`  
**Date:** 2026-09-22

## 1. Why this exists

The Notion mapping and current repository agree on the semantic regime chain:

`PRE_GENESIS → GENESIS → ACTIVE → QUIESCENT`

and on the frozen Genesis predicate:

`verified PRE Treasury economic value >= 4,000 USDM`.

The repository already contains `PreRichGenesisAdmission.hs`, exposed by `pre-rich-plutus.cabal`. That module verifies the economic admission predicate.

The missing implementation surface is narrower:

> a canonical application state carrier that can be consumed exactly once and transitioned atomically from PRE_GENESIS to GENESIS.

Phase 1 now exists as a pure PRE-RICH profile carrier (`PreRichRegimeState`) and fail-closed transition seam. It is intentionally not the final Cardano datum: the singleton identity, transition nonce/version, Treasury binding and transaction-reference binding described below remain open for the ledger implementation.

No new economic predicate is introduced by this document.

## 2. Existing boundary that must be reused

Authoritative candidate admission:

`GenesisTreasuryObservation → genesisPredicate`

The observation already binds:
- Treasury identity;
- source regime evidence;
- PRE asset identity;
- Treasury state;
- authenticated/fresh Oracle evidence;
- PRE quantity;
- verified PRE→USDM price;
- Oracle precision.

The existing function computes the value in canonical USDM sub-units and compares against `4000 * 100`.

The off-chain TypeScript admission mirror must not become a second authority.

## 3. Required state carrier

The smallest candidate is an **application-owned singleton regime UTxO**, separate from the PrizePool and separate from the Treasury.

Conceptual datum:

```
PreRichRegimeDatum
  regime              :: PRE_GENESIS | GENESIS | ACTIVE | QUIESCENT
  transitionNonce     :: Integer
  canonicalTreasury   :: identity/reference
  stateVersion        :: Integer
  lastTransitionRef   :: transition identity
```

The exact serialization and identity fields remain an implementation-design task.

### Why a separate carrier

- `B1PrizePoolDatum` has no regime field and is explicitly a PrizePool accounting state.
- `TreasuryDatum` is a legacy distribution datum and does not authenticate Genesis valuation.
- Neither can safely be overloaded to mean PRE-RICH regime.
- The regime transition must not silently alter PrizePool liquidity.
- The carrier gives the ledger a unique state object whose consumption provides the concurrency/idempotence boundary required by P0.

## 4. Candidate action

Minimum action surface:

```
ActivateGenesis
```

The action must contain no user-selected economic amount.

A candidate transaction consumes the unique PRE_GENESIS regime UTxO and produces exactly one GENESIS regime UTxO.

## 5. On-chain validation contract

For `ActivateGenesis`, the validator must independently establish:

1. current carrier regime is `PRE_GENESIS`;
2. exactly one carrier input is consumed;
3. exactly one continuing carrier output exists;
4. output regime is exactly `GENESIS`;
5. transition nonce/version advances deterministically;
6. canonical Treasury identity is preserved;
7. canonical PRE asset identity is preserved;
8. the Treasury observation is bound to the transaction's authenticated evidence;
9. Oracle evidence is fresh and valid under the existing economic Oracle mechanism;
10. verified Treasury PRE value satisfies the frozen `>= 4,000 USDM` predicate;
11. no PrizePool accounting field is implicitly increased by the transition;
12. no bootstrap value is silently reclassified as PrizePool liquidity;
13. a second submission against the consumed PRE_GENESIS state cannot succeed;
14. stale/conflicting evidence cannot authorize the transition;
15. the resulting state is exactly GENESIS.

The validator must fail closed when any required evidence is absent.

## 6. Concurrency model

The singleton carrier is the state-consumption boundary:

`PRE_GENESIS(U0) → GENESIS(U1)`

Two candidates built from U0 may race.

At most one can consume U0 successfully.

After U0 is consumed:
- the other candidate must fail, or
- recompute against the new canonical state.

No duplicate Genesis transition may exist.

This directly instantiates the T2/P0 concurrency rule without introducing a keeper authority.

## 7. Permissionless liveness

The transition remains permissionless.

The protocol does **not** require a privileged Genesis operator.

Operational chain:

`Predicate true → state discoverable → any eligible submitter → on-chain revalidation → atomic transition`

If nobody submits:

`PRE_GENESIS safe state → SAFE STALL`

The state remains discoverable and another submitter may retry later.

This is not an economic failure by itself.

## 8. Treasury / PrizePool non-double-counting

The transition must not perform:

`Treasury bootstrap → PrizePool liquidity`

merely because Genesis is activated.

Therefore the expected accounting delta is:

```
Regime: PRE_GENESIS → GENESIS
Treasury identity: preserved
Treasury bootstrap evidence: preserved/referenced
PrizePool liquidity: unchanged
ProtectedCapital: unchanged by regime transition alone
RawSurplus: unchanged by regime transition alone
```

Any later Treasury→PrizePool funding remains a separate application transition and must satisfy its own PrizePool validator/accounting rules.

## 9. Explicit non-goals

This carrier must NOT:

- define a new Genesis threshold;
- define a Genesis price different from 1 USDM;
- define a new Oracle source;
- choose a favorable PRE price;
- reuse legacy `Treasury.Distribute`;
- infer Genesis from Treasury UTxO existence alone;
- modify the universal IMMORTAL kernel;
- modify `B1PrizePoolDatum` solely to carry regime;
- turn Snek/Splash historical evidence into the Genesis oracle automatically;
- introduce automatic Treasury distribution;
- introduce Jackpot semantics into the regime state.

## 10. Required conformance tests before implementation is called closed

Positive:
- exact 4,000 USDM;
- above threshold;
- permissionless valid invocation;
- correct PRE_GENESIS → GENESIS output.

Negative:
- below threshold;
- stale Oracle;
- unverified Oracle;
- wrong Treasury;
- wrong PRE asset;
- wrong source regime;
- malformed Treasury state;
- duplicate carrier input;
- multiple carrier outputs;
- wrong output regime;
- stale state;
- concurrent second transition;
- bootstrap value incorrectly added to PrizePool;
- legacy Treasury percentage distribution presented as Genesis activation.

## 11. Remaining external qualification

The existing Oracle validator mechanism is an authenticated execution mechanism. The deployment-level canonical PRE→USDM source set/provider is still OPEN in Notion.

Therefore implementation can bind to an already-authenticated Oracle observation interface, but must not freeze a concrete market source until that evidence gate is closed.

## 12. Implementation order

1. Confirm exact Cardano datum serialization convention used by existing singleton validators.
2. Confirm whether a deployment-specific state identity/token already exists elsewhere; do not duplicate one.
3. If none exists, introduce the minimal regime carrier and singleton identity.
4. Implement `ActivateGenesis` validator using existing `PreRichGenesisAdmission` semantics rather than copying the predicate.
5. Add positive/negative emulator tests.
6. Add real-ledger transition trace.
7. Measure transaction size and execution budget.
8. Record accounting delta proving PrizePool is unchanged.
9. Only then classify the operational Genesis transition as conformant.

## Closure criterion

Genesis is not GREEN merely because `genesisPredicate` is GREEN.

The front closes only when:

`canonical PRE_GENESIS state → verified predicate → permissionless candidate → independent on-chain revalidation → atomic GENESIS state → concurrency rejection → accounting evidence`

is demonstrated reproducibly.


## 12.1 — Important implementation boundary discovered during carrier inspection

Direct inspection of the current Plutus surface confirms that `GenesisTreasuryObservation` is presently an **admission seam**, not yet an independently authenticated ledger observation.

Its fields are:
- identity/state/source/asset/oracle checks represented as boolean evidence flags;
- PRE quantity;
- verified PRE→USDM price;
- oracle precision.

The current `genesisPredicate` therefore proves only the predicate over an already-constructed observation. It does **not** by itself authenticate:
- which Treasury UTxO supplied `gtoPreQuantity`;
- which PRE asset quantity was read from that UTxO;
- which Oracle reference input supplied `gtoVerifiedPreUsdmPrice`;
- that the transaction's reference inputs correspond to those fields;
- that the observation is bound to the exact carrier transition.

This is not a reason to weaken or replace the predicate. It is the precise reason the final Cardano carrier validator must add an authenticated observation layer around the existing predicate.

The safe implementation shape is therefore:

```text
actual Treasury / Oracle reference inputs
        ↓
authenticated on-chain observation
        ↓
GenesisTreasuryObservation
        ↓
existing genesisPredicate
        ↓
ActivateGenesis transition
```

The boolean fields must not be treated as caller-supplied proof of facts that the validator never reconstructs.

**Classification:** ARCHITECTURE GAP / CLOSING, not a new economic decision.

**No new threshold, price, oracle source, or governance authority is introduced.**
