# Agent A — B1 Direct-USDM Claim / FundTreasury compiled CEK characterization

**Date:** 2026-11-15  
**Branch:** work/immortal-green-closure  
**Classification:** TEST-ONLY COMPILED PLUTUS CEK CHARACTERIZATION; SYNTHETIC TXINFO; NO PRODUCTION VALIDATOR CHANGE  
**Implementation:** test, Cabal registration and Haskell workflow step committed; exact-head CI not yet independently observed. Final test-file cleanup commit: 35e6d3bff7b64b7951b0ed783d133c01c640c7d1.

## 1. Unit-basis correction

The B1 datum, claimedAmount, and Economic.poolUsdmValue are denominated in **USDM sub-units**. The Direct-USDM profile computes the same sub-unit scale from physical tUSDM atomic units:

    floor(atomicQuantity * 100 / 1,000,000)

There are 100 USDM sub-units per IMMORTAL reference unit (RU). A CEK test must therefore compare the Direct-USDM delta and ProtectedCapital delta on one consistent basis before reporting RU. The test suite returns Direct-USDM **sub-units** from its conversion helper and divides by 100 only when expressing the result in RU.

## 2. Claim counterexample

The new test evaluates both the compiled PrizeValidator Claim predicate and the compiled B1 TicketClaimed predicate against the same synthetic TxInfo.

### Inputs and outputs

- Exact Pool input: Pool singleton 1, approved tUSDM 4,000,000 atomic units, ADA 10,000,000 lovelace. Physical Direct-USDM = 400 sub-units = 4 RU.
- Pool input datum: ppTotalLiquidity=400, ppPendingLiabilities=200.
- Claim amount: 200 sub-units = 2 RU.
- Pool continuing output: Pool singleton 1, tUSDM 0, one foreign native asset, ADA 10,000,000. The configured Oracle values the foreign asset at 200 sub-units; output ppTotalLiquidity=200, liabilities 0.
- Ticket owner input carries the ticket NFT and is a transaction signatory.
- Owner payment contains the ticket NFT, 2,000,000 tUSDM atomic units and ADA. The same tUSDM Oracle quote values this payout at 200 sub-units. The PrizeDatum continues as Claimed, preserving its own Value.
- Remaining 2,000,000 tUSDM atomic units are returned as source change. The foreign asset is transferred from the source input into the Pool output. All assets and ADA are balanced across inputs and outputs.

### Accepted validator predicates and economic result

The B1 Oracle-valued Pool delta is 400 − 200 = 200 sub-units, equal to the claimed amount. PrizeValidator values the owner's settlement at exactly 200 sub-units and verifies owner identity/signature, ticket status, expiry and PrizeDatum continuation. The fixture is constructed so that both compiled validator predicates can accept the same transaction context.

The Direct-USDM physical Pool balance, however, falls from 400 to 0 sub-units:

- ΔEEV_direct = −400 sub-units = −4 RU.
- ΔProtectedCapital = −200 sub-units = −2 RU.
- Therefore ΔEEV_direct < ΔProtectedCapital: the margin erodes by 200 sub-units = 2 RU.

This is a synthetic CEK characterization of the current accepted predicate surface, not a submitted Cardano transaction. It shows that the current Oracle-valued delta does not entail the physical Direct-USDM bound.

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

**CI status:** exact-head Haskell workflow completion has not been independently observed. Do not describe either new case as executed or PASS until the workflow completes successfully on the final branch head.

## 5. Correction to the earlier Reveal unit description

The existing B1RevealHeadroomTest.hs formula returns USDM sub-units, not RU. Its −501 result is **−501 USDM sub-units = −5.01 RU**, while the corresponding ProtectedCapital change is **−500 sub-units = −5 RU**. The test helper and assertion labels have been renamed to reflect the returned sub-unit scale. The mathematical non-erosion violation remains unchanged: −501 < −500 on the same basis.

## 6. Disposition

- Reveal: existing compiled dual-validator CEK characterization demonstrates accepted ΔEEV_direct=−501 sub-units against ΔProtectedCapital=−500 sub-units.
- Claim: new balanced shared-TxInfo compiled CEK counterexample characterizes accepted −400 sub-units direct EEV against −200 sub-units ProtectedCapital.
- FundTreasury: new balanced compiled CEK counterexample characterizes accepted Oracle-value increase while direct EEV falls by 100 sub-units and ProtectedCapital is unchanged.
- Expire remains the Value-preserving positive control from the source audit.
- Issue remains the exact Pool-Value-preserving control in the compiled MintPolicy suite.

These findings establish test cases against the current compiled predicate implementations; they do not establish Preprod/Mainnet behavior or on-chain exploitability. No production validator, MintPolicy, V3, Reveal semantics, datum/redeemer ABI, 500× rule, EEV profile, economic constant, wallet, deployment or ledger state changed. R1/Kc/Ω remains OPEN; Agent B's B1 Registry identity P0 remains a separate blocker; first real Preprod Issue remains **NO-GO**.
