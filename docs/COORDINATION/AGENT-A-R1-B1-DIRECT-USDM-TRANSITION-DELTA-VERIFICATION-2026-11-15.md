# Agent A — B1 transition deltas against Direct-USDM EEV

**Date:** 2026-11-15  
**Branch:** `work/immortal-green-closure`  
**Inspected HEAD:** `4d28365c2c9a044772bc9c53540753108a3fbdbb`  
**Classification:** SOURCE-BASED DELTA / REFINEMENT AUDIT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Purpose:** Derive exact R1 margin conditions for every current B1 PrizePool action under the approved physical Direct-USDM EEV profile.  
**Non-effects:** read-only source inspection only; no tests, code, validator, ABI, workflow, wallet, transaction, or ledger state changed or executed.

## 1. Executive disposition

The full B1 action surface has now been reconciled with the Direct-USDM valuation function. The exact condition for a candidate transition to preserve the R1 buffer is:

```text
b(S) = EEV_direct(S) - ProtectedCapital(S)

Δb >= 0  iff  ΔEEV_direct >= ΔProtectedCapital
```

The earlier qualitative concerns are now reducible to action-specific inequalities. Existing code proves full physical Pool Value preservation for Issue, Expire and the sale MintPolicy reservation. It does **not** prove the required direct-tUSDM condition for Reveal, Claim or FundTreasury. The lifecycle maintenance transition is pure and currently cannot consume/continue the authenticated B1 Pool UTxO, so it is not yet a deployed QNE action.

**R1 remains OPEN.** The equations do not change the first Issue disposition: Issue is not itself QNE; it is admissible only when the exact post-Issue state remains within the certified safe set, preserving the full 500× obligation.

## 2. Authoritative Direct-USDM unit conversion

The deployed direct observation helper uses:

```text
EEV_direct(q) = floor(q_atomic × 100 / 1,000,000)
```

where `q_atomic` is the quantity of the exact qualified tUSDM unit in the exact PrizePool UTxO, and EEV is expressed in IMMORTAL USDM sub-units (100 per USDM).

Consequently:

```text
1 USDM       = 1,000,000 tUSDM atomic units
1 RU         = 10,000 tUSDM atomic units
x RU         = x × 10,000 tUSDM atomic units
```

The physical Direct-USDM valuation is not `ppTotalLiquidity`, not `Economic.poolUsdmValue`, and not an arbitrary sum of oracle-valued assets. The approved observation profile reads the exact tUSDM quantity and fails closed on other unqualified positive Pool assets.

For a transition from quantity `q_in` to `q_out`:

```text
ΔEEV_direct =
  floor(q_out × 100 / 1,000,000)
  - floor(q_in × 100 / 1,000,000)
```

All conditions below apply to this integer-valued delta, not to a display price or an oracle total.

## 3. Exact ProtectedCapital deltas under PRE-RICH V1

For one unresolved ticket with price `P > 0`, the V1 worst-case exposure is `500 × P`. The relevant transition deltas are:

| B1 action | Change in represented obligations / ProtectedCapital |
|---|---:|
| TicketIssued(P) | `+500P` unresolved WCE |
| TicketRevealed(P,Y) | `Y − 500P`: unresolved WCE released and crystallized liability `Y` created |
| TicketClaimed(Y) | `−Y`: crystallized liability settled |
| TicketExpired(Pending) | `−500P`: unresolved right/face reserve and WCE released |
| TicketExpired(Revealed Win) | `−Y`: unpaid crystallized liability released |
| TicketExpired(Revealed Loss) | `0`: no positive liability remains |
| FundTreasury | `0`: no represented obligation changes |
| EnterQuiescent / MaintainQuiescent | `0`: the pure lifecycle helper changes only regime/nonce |

For any candidate QNE witness action, the necessary margin condition is `ΔEEV_direct >= ΔProtectedCapital`. This is a transition-local condition; full VC3 additionally requires representation and safety preservation for every authoritative Ω successor.

## 4. Source-level action verification

### 4.1 TicketIssued(P) — physical Pool Value preservation established

The B1 PrizePool branch verifies the face reserve/count increments and unchanged datum fields. Independently, `MintPolicy.atomicPoolReservationValid` finds the unique Pool input/output pair and requires:

- `beforeValue == afterValue` (complete physical Cardano Value equality);
- unchanged `ppTotalLiquidity` and pending liabilities;
- exact unresolved reserve increment `+P`;
- exact unresolved count increment `+1`;
- unchanged Jackpot, threshold, suspended classes and PrizeHash.

Therefore the Issue transaction has `ΔEEV_direct = 0` for this exact Pool UTxO, assuming the input was qualified. Its ProtectedCapital delta is `+500P`, so `Δb = −500P`.

**Disposition:** not QNE; a candidate Issue must have enough pre-margin to cover `500P` and its exact post-state must be in `K_c`. This does not relax or replace 500×.

### 4.2 TicketRevealed(P,Y) — direct-USDM delta is not bounded

The B1 PrizePool branch verifies:

- the consumed PrizeDatum was Pending and output is Revealed;
- the payout is non-negative and within the pre-reveal effective Pool;
- `ppTotalLiquidity` is unchanged;
- unresolved reserve decreases by `P`;
- pending liabilities increase by `Y`;
- unresolved count decreases by one;
- post-state B1 solvency holds.

It does **not** require `txOutValue (ownInputResolved ctx) == ownOutputValue ctx`, nor does it bound the exact direct-tUSDM quantity in the continuing Pool output.

The PrizeValidator's `valuePreserved` predicate protects the PrizeDatum UTxO's own value. It is not a physical-Value equality check on the B1 PrizePool UTxO. The separate B1 Pool validator is the owner of that Pool transition and has no corresponding Value equality in its TicketRevealed branch.

The mathematical QNE requirement is:

```text
ΔEEV_direct >= Y - 500P
```

Since `0 <= Y <= 500P`, this permits a decrease of no more than the amount of worst-case exposure released beyond the crystallized liability. Current code does not check that inequality against direct tUSDM.

**Disposition:** Direct-USDM transition closure NOT ESTABLISHED. Unchanged `ppTotalLiquidity` is insufficient.

### 4.3 TicketClaimed(Y) — Oracle-valued loss is not Direct-USDM loss

The B1 PrizePool validator computes:

```text
poolInputUsdm  = Economic.poolUsdmValue(input Value)
poolOutputUsdm = Economic.poolUsdmValue(output Value)

poolInputUsdm - poolOutputUsdm == Y
```

`poolUsdmValue` removes the Pool singleton NFT and delegates to `totalUsdmValue`, which values each non-zero native asset with its authenticated Oracle quote. The claim branch also requires `ppTotalLiquidity` and pending liabilities to decrease by `Y`.

This does not prove that the exact direct-tUSDM balance decreases by no more than the amount represented by `Y`. An asset-composition substitution can preserve the required oracle-valued delta while reducing physical tUSDM by a different amount.

The R1 direct-USDM condition is:

```text
ΔEEV_direct >= -Y
```

Equivalent quantity form: the continuing Pool must retain enough qualified tUSDM that its integer Direct-USDM EEV has fallen by no more than `Y) RU. A stronger exact-settlement rule may require the physical tUSDM delta to equal `Y × 10,000` atomic units, but that is a distinct application settlement decision and is **not** inferred here.

**Disposition:** the present Oracle-valued pool delta is not a proof of the Direct-USDM QNE inequality. A direct quantity check or an equivalent conservative proof is missing.

### 4.4 TicketExpired — physical Pool Value preservation established

The B1 PrizePool TicketExpired branch verifies:

- the unique ticket/Pool relationship and exact accounting subtractions;
- the time boundary;
- unchanged `ppTotalLiquidity`, Jackpot, threshold, suspended-class mask and PrizeHash;
- explicit full Value equality: `txOutValue (ownInputResolved ctx) == ownOutputValue ctx`;
- non-negative obligations and post-state solvency.

Therefore `ΔEEV_direct = 0` for the qualified Pool UTxO.

For Pending expiry, `ΔProtectedCapital = −500P`; for Revealed winning expiry, `ΔProtectedCapital = −Y`; for Revealed loss expiry, it is zero. All have `Δb >= 0` at this boundary.

There is still a **refinement mismatch**: B1 supports Revealed Win expiry by releasing an unpaid crystallized liability; current `EconomicTransitionV3.Expire` only decreases unresolved reserve/count/exposure and does not reduce `v3CrystallizedLiabilities`. The physical delta is safe, but the canonical V3/universal state mapping is not yet total.

**Disposition:** direct-USDM quantity preservation is established in B1; the Revealed-expiry refinement mapping remains OPEN.

### 4.5 FundTreasury — Oracle increase does not prove tUSDM monotonicity

The FundTreasury branch recomputes `ppTotalLiquidity` from the continuing Pool Value using `Economic.poolUsdmValue`, requires it to exceed the previous datum value, preserves obligation fields and checks B1 solvency.

It does **not** check:

- that the exact tUSDM quantity in the output is at least the input quantity;
- that the full Pool Value is preserved except for a strictly positive tUSDM increment;
- that other oracle-priced assets have not replaced direct tUSDM.

This distinction is especially important because `plutus/Types.hs` contains a comment claiming that FundTreasury verifies an actual ADA increase by comparing Pool input/output values. The current `B1PrizePool.hs` implementation inspected here does not perform that complete Value-delta comparison; it verifies recomputed Oracle-valued output liquidity and datum consistency. Treat the code predicate, not the stale comment, as the actual validator behavior.

The QNE condition is:

```text
ΔEEV_direct >= 0
```

**Disposition:** Direct-USDM monotonicity NOT ESTABLISHED. The current Oracle-valued increase is insufficient.

## 5. Concrete source-level countermodel for the Claim predicate

The claim logic is not mathematically equivalent to a direct-USDM quantity constraint. Consider the following illustrative Value composition, with all amounts converted to common USDM sub-units and an authenticated Oracle quote for asset X:

| Value | Input Pool | Output Pool |
|---|---:|---:|
| Direct tUSDM EEV | 100 | 50 |
| Other Oracle-valued asset X | 0 | 49 |
| Total Oracle-valued Pool | 100 | 99 |

For `Y = 1`, the current Claim equality `poolInputUsdm - poolOutputUsdm == Y` can hold (100 − 99 = 1) while Direct-USDM EEV falls by 50, not 1. The continuing datum can correspondingly lower `ppTotalLiquidity` by 1 and lower pending liabilities by 1.

This is a **source-level countermodel**, not an executed transaction or proof that a specific deployed oracle currently quotes such an asset. It demonstrates the logical non-implication: an equality over the sum of Oracle-valued assets does not entail the same delta in one selected physical asset.

The Direct-USDM observation profile would reject an unqualified additional asset on a later qualification snapshot, but that later rejection does not make the current B1 Claim validator itself enforce the per-transition direct-quantity bound. For VC3, the admissible successor set must be closed at the transition boundary, not merely noticed by a later off-chain observation.

## 6. Required closure predicates — specification proposal only

The minimal mathematical requirements for the present Direct-USDM profile are:

| Action | Required per-transition proof |
|---|---|
| Issue(P) | Already present: full Pool Value equality; `ΔEEV_direct = 0`; post-state admission requires `b_pre >= 500P` |
| Reveal(P,Y) | Prove `EEV_direct(out) − EEV_direct(in) >= Y − 500P` |
| Claim(Y) | Prove `EEV_direct(out) − EEV_direct(in) >= −Y` |
| Expire Pending / Revealed | Already present full Pool Value equality; `ΔEEV_direct = 0` |
| FundTreasury | Prove `EEV_direct(out) >= EEV_direct(in)` |
| Lifecycle maintenance | Atomically preserve exact qualified Pool reference/value and lifecycle continuity; `ΔEEV_direct = 0` |

These predicates are requirements, not a patch proposal or authorization. A full-Value equality check may be stronger and simpler for some actions, but it must be reconciled with the intended settlement/payment mechanics. An exact tUSDM quantity check is the direct way to close the approved EEV profile; no conversion to Oracle-valued totals is interchangeable.

## 7. Consequences for the lifecycle-anchored R1 candidate

The candidate `Wit(S) = EnterQuiescent / MaintainQuiescent` remains structurally plausible, but the action alone cannot certify the real joint system while independent actors can submit Pool-mutating transactions.

A complete model must show that:

1. lifecycle maintenance is a real accepted transaction, not merely a pure Haskell state helper;
2. it serializes with the exact PrizePool UTxO and cannot race independent Pool mutations;
3. every other permissionless Pool action admitted in the same certified regime either satisfies its Direct-USDM inequality or is explicitly outside `Accept` under a governed, disclosed application policy;
4. ticket rights (Reveal, Claim and both expiry cases) remain represented and settle according to the frozen V1 contract;
5. the whole `Ω` includes concurrency, timing, oracle failure, UTxO replacement and external truth events, and is authoritative or soundly over-approximated.

This report does not decide to disable Reveal, Claim, Expire or FundTreasury. Nor does it authorize adding a new B1 redeemer/action, carrier, validator predicate or ABI constructor.

## 8. Final disposition

- Issue: exact physical Pool Value preservation confirmed by MintPolicy; QNE fails by `−500P`, as already recorded.
- Reveal: direct-EEV delta bound missing.
- Claim: current Oracle-valued delta does not imply direct-EEV delta bound.
- Pending/ Revealed Expire: exact physical Pool Value preservation confirmed; Revealed-expiry V3 refinement mapping missing.
- FundTreasury: Oracle-valued positive delta does not imply physical tUSDM monotonicity; Types comment overstates the implemented check.
- Lifecycle: pure predicate exists, but no transaction-bound atomic Pool lifecycle maintenance action exists.
- Authoritative Ω and VC1–VC6/E1–E10 remain absent.

**Decision:** this closes the algebra and identifies the exact source-level predicates that remain missing. It does not close R1/Kc/Ω. First real PRE-RICH Preprod Issue remains **NO-GO**, independently also blocked by B1 Registry identity P0.


## 9. Lifecycle carrier composition — exact on-chain limitation

The current `GenesisRegimeCarrier` is an application-owned singleton carrier, but its Plutus action set contains only `ActivateGenesis`. Its output predicate only accepts the tag transition `PreGenesis (0) → Genesis (1)`, increments nonce/version once, and preserves its singleton Value.

Critically, `mkValidator` also requires:

```text
not (anyScriptInput prizePoolHash txInfoInputs)
and
not (anyScriptOutput prizePoolHash txInfoOutputs)
```

So the deployed Genesis activation is expressly **not atomic with the B1 PrizePool**. This is a positive invariant for the existing Genesis edge, but it means that the existing carrier cannot serve as the joint Genesis→Active/Quiescent + Pool QNE transaction without a separately designed edge.

The separate `PreRichLifecycleTransition` module remains a pure transition/QNE helper; it is not imported by `GenesisRegimeCarrier`, `PreRichEconomicAdmission`, or the B1 PrizePool validator. The current source tree has no Plutus lifecycle maintenance validator/carrier that composes these states and scripts.

### Minimal transaction shape required for a future design (not authorized for implementation)

A candidate Quiescent maintenance transition would have to consume and continue, in **one Cardano transaction**:

1. the unique B1 PrizePool authority UTxO, with its complete physical Value and economic datum preserved;
2. the unique lifecycle singleton UTxO, changing only its approved regime/version/nonce fields;
3. the canonical V3 state carrier, either preserved exactly or bound to its exact state hash if the selected certificate includes it;
4. the control/authority singleton(s) required by the already-approved PRE-RICH profile.

Both the lifecycle validator and B1 Pool validator must independently reject missing, duplicate, stale or mismatched counterpart state. The B1 branch must require the exact continuing Pool Value, not an Oracle-valued proxy. This makes the Pool singleton a serialization point: competing Reveal/Claim/Expire/FundTreasury/Issue spends cannot be ordered independently of the lifecycle transition.

This needs an explicit accepted on-chain Pool action (for example, a new B1 lifecycle-maintenance redeemer branch) or another already-approved transaction mechanism that invokes the B1 validator. There is no current B1 redeemer branch that can consume/continue the Pool for a pure lifecycle nonce update. The separate Lifecycle carrier alone cannot spend the Pool, and a reference input alone does not serialize later Pool spends.

Any such design would be a B1/lifecycle protocol change, likely including a redeemer/action ABI update and a new script deployment. It must undergo script-size/transaction-size/CPU checks under Cardano limits. It does **not** require a new V3 economic constructor or a change to Reveal semantics, but it is not a zero-change implementation and is not authorized by this report.

The existing `ActivateGenesis` no-Pool-input/no-Pool-output invariant should remain intact for that existing transition. A new Active/Quiescent path must be separately specified rather than weakening Genesis activation's boundary.

**Disposition:** the lifecycle candidate now has a clear atomicity requirement. No currently deployed on-chain path meets it; the existing Genesis carrier is deliberately disjoint from the PrizePool.
