# Agent A — B1 Direct-USDM Claim / FundTreasury compiled CEK characterization

**Date:** 2026-11-15  
**Branch:** work/immortal-green-closure  
**Classification:** TEST-ONLY COMPILED PLUTUS CEK CHARACTERIZATION; SYNTHETIC TXINFO; NO PRODUCTION VALIDATOR CHANGE  
**Implementation:** test, Cabal registration and Haskell workflow step committed; exact-head CI not yet independently observed. Final test-file cleanup commit: 35e6d3bff7b64b7951b0ed783d133c01c640c7d1.

## 1. Unit-basis correction

The B1 datum, claimedAmount, and Economic.poolUsdmValue are denominated in **USDM sub-units**. The Direct-USDM profile computes the same sub-unit scale from physical tUSDM atomic units:

    floor(atomicQuantity * 100 / 1,000,000)

There are 100 USDM sub-units per IMMORTAL reference unit (RU). A CEK test must therefore compare the Direct-USDM delta and ProtectedCapital delta on one consistent basis before reporting RU. The test suite returns Direct-USDM **sub-units** from its conversion helper and divides by 100 only when expressing the result in RU.

## 2. Claim settlement-medium characterization

The current test evaluates the compiled PrizeValidator Claim predicate and the compiled B1 TicketClaimed predicate against the same balanced synthetic TxInfo.

### Inputs and outputs

- Pool input: the exact Pool singleton, 4,000,000 approved tUSDM atomic units and 10,000,000 lovelace. Direct-USDM EEV is 400 sub-units.
- Pool continuing output: the same singleton, 2,000,000 approved tUSDM atomic units and the same ADA. Direct-USDM EEV is 200 sub-units.
- The Pool datum moves from `ppTotalLiquidity=400`, `ppPendingLiabilities=200` to `ppTotalLiquidity=200`, liabilities 0.
- The source input contains one foreign native asset. That asset is paid to the ticket owner; the remaining 2,000,000 tUSDM atomic units are returned as source change.
- The ticket owner receives no physical tUSDM. The foreign-asset Oracle quote makes the owner output worth exactly 200 USDM sub-units.
- Pool/ticket singleton NFTs continue and all ADA/native-asset quantities balance across the shared TxInfo.

### Accepted predicates and correct R1 interpretation

Both compiled validator predicates accept the same transaction context. The Pool's Oracle-valued amount decreases from 400 to 200 sub-units, matching the crystallized Claim amount of 200.

The physical Direct-USDM delta is:
```text
ΔEEV_direct = 200 − 400 = −200 sub-units
ΔProtectedCapital = −200 sub-units
Δb = ΔEEV_direct − ΔProtectedCapital = 0
```

Therefore this particular Claim fixture **does not violate the local R1 non-erosion inequality**. It demonstrates a separate settlement-medium fact: the owner can receive an Oracle-equivalent foreign asset rather than physical tUSDM while the Pool's direct tUSDM EEV decreases by exactly the liability released. Whether Claim must pay a particular physical asset is a separate application settlement-policy decision; this test does not establish such a rule.

**Interpretation correction:** the current test's printed label `OBSERVED GAP` / `Claim counterexample` is broader than the numeric result supports. The Claim fixture is a balanced settlement-medium characterization, not a direct-EEV margin-breach counterexample. Do not cite it as evidence that Claim fails `ΔEEV_direct ≥ ΔProtectedCapital`.

This remains a synthetic CEK characterization, not a submitted Cardano transaction or proof of deployed Preprod behavior.
 
## 3. FundTreasury counterexample

The new test evaluates the compiled B1 PrizePool validator with FundTreasury.

### Inputs and outputs

- Exact Pool input: Pool singleton 1, approved tUSDM 10,000,000 atomic units, ADA 10,000,000 lovelace. Physical Direct-USDM and Pool datum ppTotalLiquidity = 1,000 sub-units = 10 RU.
- External source input contains one foreign native asset plus ADA.
- Pool output: Pool singleton 1, tUSDM 9,000,000 atomic units, one foreign native asset and unchanged ADA; ppTotalLiquidity=2,000 sub-units.
- Source change returns 1,000,000 tUSDM atomic units plus unchanged ADA.
- The Oracle values 9,000,000 tUSDM atoms at 900 sub-units and the added foreign asset at 1,100 sub-units. Recomputed output Pool value is 2,000, strictly above the input datum's 1,000.
- The transaction's tUSDM, foreign native asset, Pool singleton and ADA quantities are balanced.

The compiled B1 predicate's Oracle-valued liquidity-increase and accounting checks can accept this context. Yet physical Direct-USDM changes from 1,000 to 900 sub-units:

- ΔEEV_direct = −100 sub-units = −1 RU.
- ΔProtectedCapital = 0.

FundTreasury is therefore not a Direct-USDM QNE witness on this action surface.

## 4. Implementation and verification boundary

Files:
- plutus/test/B1DirectUsdmTransitionCharacterizationTest.hs
- plutus/pre-rich-plutus.cabal — test suite b1-direct-usdm-transition-characterization-tests
- .github/workflows/immortal-haskell-conformance.yml — dedicated step for the new suite
- plutus/test/B1RevealHeadroomTest.hs — relabel existing Direct-USDM deltas in USDM sub-units, not RU

The Claim test evaluates the compiled PrizeValidator and B1PrizePool validators over one shared TxInfo. The FundTreasury test evaluates the compiled B1PrizePool validator. The source file expressly labels both as synthetic CEK-only, not native-ledger, Yaci or Preprod tests.

**CI status (updated 2026-11-17):** Haskell Semantic Conformance [run #43761278779, attempt 2](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43761278779) completed **SUCCESS**; job `haskell-conformance` (`133453250596`) passed all 33 steps, including `b1-direct-usdm-transition-characterization-tests`, `b1-reveal-headroom-tests`, and `mint-policy-b1-value-preservation-tests`. The run executed on test-source SHA `453871b1d9e79370f76ed1583d3c256fc7bf3aba`. The current shared branch HEAD is `d249501e70c2f852f50a96a611140233e3d04f43`; the 70-commit comparison contains no changes under `plutus/` and no change to `.github/workflows/immortal-haskell-conformance.yml`, so the tested Plutus/test/Cabal/workflow source remains unchanged at that HEAD. This is successful compiled CEK evidence only, not native-ledger, Yaci, Preprod or exploitability evidence.

## 5. Correction to the earlier Reveal unit description

The existing B1RevealHeadroomTest.hs formula returns USDM sub-units, not RU. Its −501 result is **−501 USDM sub-units = −5.01 RU**, while the corresponding ProtectedCapital change is **−500 sub-units = −5 RU**. The test helper and assertion labels have been renamed to reflect the returned sub-unit scale. The mathematical non-erosion violation remains unchanged: −501 < −500 on the same basis.

## 6. Disposition

- Reveal: existing compiled dual-validator CEK characterization demonstrates accepted ΔEEV_direct=−501 sub-units against ΔProtectedCapital=−500 sub-units.
- Claim: the balanced shared-TxInfo compiled CEK characterization passes with ΔEEV_direct = −200 sub-units and ΔProtectedCapital = −200 sub-units; it shows an Oracle-equivalent foreign-asset payout, not an R1 margin breach.
- FundTreasury: new balanced compiled CEK counterexample characterizes accepted Oracle-value increase while direct EEV falls by 100 sub-units and ProtectedCapital is unchanged.
- Expire remains the Value-preserving positive control from the source audit.
- Issue remains the exact Pool-Value-preserving control in the compiled MintPolicy suite.

These findings establish test cases against the current compiled predicate implementations; they do not establish Preprod/Mainnet behavior or on-chain exploitability. No production validator, MintPolicy, V3, Reveal semantics, datum/redeemer ABI, 500× rule, EEV profile, economic constant, wallet, deployment or ledger state changed. R1/Kc/Ω remains OPEN; Agent B's B1 Registry identity P0 remains a separate blocker; first real Preprod Issue remains **NO-GO**.
