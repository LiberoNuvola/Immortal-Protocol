# Agent A — FundTreasury QNE candidate falsification: Oracle revaluation and physical-asset non-monotonicity

**Date:** 2026-11-09  
**Branch:** work/immortal-green-closure  
**Exact branch HEAD inspected:** 2520fb8ed254407c6f72dac35a711f165684d4c5  
**Classification:** SOURCE-DERIVED COUNTEREXAMPLE / CANDIDATE REJECTION — NON-NORMATIVE  
**Owner:** Agent A — PRE-RICH economics, EEV and admission policy  
**Scope:** B1 FundTreasury validator, Oracle valuation, Direct-USDM EEV and R1/QNE. No production/test/ABI/V3/Reveal/500×/deployment changes.

## 1. Executive disposition

The prior Agent A audit correctly found that FundTreasury does not require direct tUSDM monotonicity. This follow-up makes the defect stronger and more precise:

**The current B1 FundTreasury branch does not prove that any new physical value entered the Pool at all.**

It requires the *Oracle-valued scalar* of the continuing Pool output to exceed the prior datum's ppTotalLiquidity. It does not require:
- the continuing Pool Value to be greater than or equal to the consumed Pool Value;
- exact equality of the input and output physical assets except the singleton Pool token;
- the tUSDM quantity to be non-decreasing;
- the input Pool datum's ppTotalLiquidity to equal the input Value revalued against the same Oracle State used for the transition.

Therefore the current action admits two classes of transitions that are not direct-EEV-monotone:

1. **Pure revaluation:** physical Pool Value is unchanged, but a newer accepted Oracle quote makes its recomputed output ppTotalLiquidity greater than the old input datum.
2. **Asset substitution:** physical tUSDM is removed/reduced and another Oracle-valued asset (e.g. ADA) is added; the output's total Oracle valuation can remain greater than the old datum even though Direct-USDM EEV falls.

This is a source-level counterexample to treating the current FundTreasury validator branch as a universal direct-USDM QNE witness. It is not merely a missing test or missing integration.

**Revised disposition:** FundTreasury as currently implemented is **REJECTED AS-IS AS AN R1/QNE WITNESS** for the Direct-USDM first-Issue profile. A redesigned/strengthened funding transition may be reconsidered only after separate implementation authority and Agent B review.

## 2. Exact source evidence

The following branch blobs were fetched at the inspected HEAD:

| Source | Blob SHA | Relevant fact |
|---|---|---|
| plutus/B1PrizePool.hs | 175be60b8f01ef214c92d7527191bcebb66ad656 | FundTreasury checks output oracle-valued total is greater than the previous datum; no input/output physical Value monotonicity check |
| plutus/Economic.hs | e50366a65ce34e9433d5ff179dfc03a35a24c1a1 | totalUsdmValue prices each nonzero asset using a matching fresh Oracle quote; poolUsdmValue removes only the Pool singleton NFT |
| plutus/Types.hs | 60caeb747018b512e8e6ae7d8a100bb7023863d9 | FundTreasury action is described as a Treasury deposit; comment is not a physical deposit invariant |
| Adapter/CARDANO/observation/DirectUsdmEev.ts | 0c6fa421a2655a2e84610f8ae4dae2a002120cbf | Direct EEV is derived from the exact physical tUSDM quantity; no Oracle price is applied |
| PRE-RICH/onchain/PreRichEconomicAdmission.hs | a654587114beec997d97d59810d1fb648facf365 | V3 Economic Admission has no FundTreasury action or direct physical asset witness input |

## 3. What the validator compares — and what it does not

For FundTreasury, B1PrizePool constructs:

    recalcLiq = Economic.poolUsdmValue(
      txInfo,
      configuredOracleState,
      configuredOraclePublisher,
      poolPolicy,
      poolName,
      continuingPoolValue
    )

and requires:

    ppTotalLiquidity(after) == recalcLiq
    ppTotalLiquidity(after) > ppTotalLiquidity(before)

It also requires the following datum fields to be unchanged:
- pending liabilities;
- unresolved face-price reserve;
- unresolved ticket count;
- locked Jackpot and Jackpot threshold;
- suspended classes and Prize validator hash.

It checks post-state solvency. These checks preserve the represented accounting fields, but they do not bind the physical input and output asset vectors monotonically.

Critically, the branch does **not** contain any equivalent of:

    continuingPoolValue >= consumedPoolValue

nor:

    tUSDM_quantity(continuingPoolValue)
      >= tUSDM_quantity(consumedPoolValue)

The separate MintPolicy Issue check's exact Value equality is not reused by FundTreasury; the FundTreasury branch has its own action predicate.

## 4. Counterexample A — pure Oracle revaluation, no new physical deposit

Let:
- V be the exact physical Pool Value after removing the Pool singleton NFT;
- q0 be the Oracle quote used when the input Pool datum's previous ppTotalLiquidity L0 was established;
- q1 be a different quote from the configured publisher, valid/fresh for the FundTreasury transaction;
- Val(V,q) be Economic.totalUsdmValue for V under quote set q.

Suppose the same physical Value is retained:

    PoolValue_after = PoolValue_before = V

but the currently referenced Oracle State carries a valid quote such that:

    Val(V,q1) > L0

The FundTreasury output datum can then set:

    ppTotalLiquidity_after = Val(V,q1)

All explicit FundTreasury conditions are consistent with this:
- output datum equals the recomputed value;
- recomputed value exceeds the old datum L0;
- protected accounting fields remain unchanged;
- pre/post solvency can hold.

No physical token or ADA has been added to the Pool. The reported increase is a revaluation, not a funding inflow.

The input datum is not checked against Val(V,q1) using the same current Oracle reference before comparing the output. Thus this transition can turn a quote change into apparent Pool funding.

This counterexample is conditional only on the configured publisher having a different valid quote available for the assets in V. The validator source does not prohibit a changed quote or require a physical deposit to accompany it.

## 5. Counterexample B — physical tUSDM decreases while the Oracle-valued total increases

The Direct-USDM EEV adapter observes only:

    EEV_direct = floor(
      tUSDM_atomic_quantity × 100 / 1,000,000
    )

It does not mark ADA or another asset to tUSDM/USD.

FundTreasury's Economic.poolUsdmValue, by contrast, values every non-zero asset in the Pool Value using a matching quote from the current Oracle State. Its pool helper removes only the singleton Pool NFT before valuation. The remaining native assets are all part of the Oracle-valued total.

Therefore a candidate continuing output can, at the source predicate level:
- contain fewer units of the exact tUSDM asset;
- contain more of another asset with a matching valid Oracle quote;
- produce a total Oracle valuation greater than the old ppTotalLiquidity datum;
- retain all protected accounting datum fields and pass the scalar output-solvency condition, subject to the selected values.

The validator does not require the missing tUSDM units to be replaced one-for-one or at all. Any such exchange can be offset in the scalar valuation by another asset's quote/value.

Hence it is possible in principle for:

    ppTotalLiquidity_after > ppTotalLiquidity_before

while:

    EEV_direct_after < EEV_direct_before

This is exactly the direction a universal QNE witness may not permit.

## 6. Why this also breaks the earlier “B1 accounting monotonicity” interpretation

The prior report described FundTreasury as monotone in the B1 Oracle-valued accounting quantity. That phrase was too strong.

The implementation enforces a **local scalar condition on one transition**: output ppTotalLiquidity must equal the output Value's current Oracle valuation and be greater than the input datum's old ppTotalLiquidity.

It does not establish that the scalar increase corresponds to:
- increased physical Pool assets;
- increased direct tUSDM quantity;
- increased executable settlement liquidity;
- a non-eroding value under every future Oracle/market/environment successor.

It is therefore more accurate to call the present branch **Oracle-revaluation-compatible Pool accounting**, not a proven capital-accretion action.

## 7. Requirements for any future funding witness

A new or strengthened funding path would need, at minimum:

1. **Exact asset monotonicity:** bind the consumed and continuing Pool UTxO and enforce non-decrease of the exact qualified tUSDM quantity for this Direct-USDM profile.
2. **No substitution loophole:** explicitly specify which other assets may enter/leave, and ensure none can replace VerifiedUSDM in the R1 buffer.
3. **Physical funding evidence:** require a demonstrable positive contribution from transaction inputs/external sources if the action is semantically called a deposit; do not infer it from revaluation.
4. **Oracle separation:** do not let a changed quote alone create a positive funding delta. Bind old and new valuation semantics or avoid using Oracle-valued totals as the direct-EEV witness.
5. **Same-cut binding:** bind input/output Pool out-refs, datum hashes, asset identity, exact physical quantities, EEV derivation and protected-capital projection to one transaction and ledger cut.
6. **Ω robustness:** cover source revocation, quote expiry/change, ledger rollback/finality, timing, concurrency, asset qualification changes and all other economically material events; prove the selected action remains non-eroding.
7. **Availability:** model who supplies positive funding inputs. Permissionless access does not guarantee the existence of a donor at every certified state.

These are design requirements, not authorization to add the checks. A change would alter the B1 validator's acceptance language and requires an explicit path/ABI review, implementation slot and Agent B's independent security review.

## 8. Corrected R1 route disposition

| Candidate | Disposition |
|---|---|
| Current B1 FundTreasury | **Rejected as-is** as a Direct-USDM QNE witness: pure revaluation and physical asset substitution are not prevented by current checks |
| Strengthened Direct-USDM funding action | Possible future candidate only, after exact asset monotonicity, same-cut binding, Ω and availability proofs |
| Existing Quiescent lifecycle action | Still not reachable from Genesis S0 or bound to authoritative Ω/admission |
| Issue(0,1) | Still erodes the direct-USDM buffer by exactly 500 RU at S0 |
| Statistical cohort profile | Separate guarantee/policy path; cannot replace universal R1/Kc/Ω |

**Final disposition:** no current action has yet been shown to provide a reachable, always-defined, permissionless, direct-EEV-monotone and authoritative-Ω-closed witness for S0. This does **not** prove T-EROSION globally or K* = ∅. It means the present R1/Kc deployment certificate is still missing.

No code, tests, workflows, parameters, ABI, V3, Reveal, 500×, wallet, transaction, deployment or ledger state was changed or executed.
