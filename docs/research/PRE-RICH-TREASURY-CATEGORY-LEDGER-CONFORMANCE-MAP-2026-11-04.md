# PRE-RICH Treasury — Category Ledger & Flow Conformance Map

**Date:** 2026-11-04  
**Status:** NON-NORMATIVE SOURCE AUDIT / IMPLEMENTATION GAP MAP  
**Branch:** work/immortal-green-closure  
**Inspected HEAD:** 59714f713a15eaf55de8e243d08fdc9d02e658da  
**Scope:** PRE-RICH application Treasury, category accounting, custody, PrizePool, Maintenance/OPEX and PRE-holder rewards.  
**Exclusion:** this document does not define a universal IMMORTAL Treasury, Protocol Usage Fee, allocation policy, category percentage, new R7 delta, or new authority.

## 1. Executive result

The intended PRE-RICH model is **one protocol-controlled Treasury with multiple accounting categories**, not four independent Treasury authorities. The PRE staking balance is explicitly an internal accounting partition of that same Treasury; no second on-chain staking pool is intended.

The B1 PrizePool is a distinct contract-controlled custody position with its own UTxO and game-liability state. It is not a second general Treasury. Its purpose is to hold and enforce the portion of value used to support Prize/Jackpot game obligations.

However, the current repository does **not** establish a complete persisted category ledger for Prize, Reserve, Maintenance, Reward and PRE staking. In particular:
- ticket-sale receipts are paid into the Treasury address;
- ticket issue records unresolved-ticket reserve in the PrizePool datum without moving the PrizePool's physical assets;
- the B1 FundTreasury validator action proves the post-funding Pool value against its datum, but does not prove that the new value came from the canonical Treasury;
- the only inspected Yaci FundTreasury transaction is a synthetic test-wallet funding path, not a Treasury-to-PrizePool transfer;
- the production-facing Claim builder and B1 validator disagree on the required physical PrizePool asset decrease;
- the PRE staking calculator consumes an already supplied Treasury staking balance; it does not authenticate its source or execute a distribution;
- the old four-way Treasury percentage validator and relayer calculation code remain present, but the relayer's current worker is explicitly fail-closed and its regression test protects that boundary.

Therefore the Treasury design direction is supported at the **application accounting-model level**, but the current category balances, category movements and source-specific outflows are not yet certified as a complete on-chain ledger.

## 2. One Treasury does not mean one UTxO

The logical protocol-controlled Treasury is represented by a script address and may contain multiple UTxOs. This is distinct from the specialized B1 PrizePool singleton UTxO.

Current sale path:
1. src/mint.ts resolves TREASURY_ADDRESS or falls back to derivedTreasuryAddress.
2. getTreasuryDatum reads the datum from the first datum-bearing Treasury UTxO it finds. It requires at least one such UTxO, but does not establish a unique canonical datum-bearing UTxO.
3. The Issue transaction creates a new Treasury output containing the ticket's exact USDM-equivalent settlement basket.
4. In the same transaction, the B1 PrizePool input is continued with its physical Value unchanged, while its datum increases unresolved-ticket reserve and count.
5. MintPolicy.atomicTreasuryPaymentValid verifies exactly one output at the Treasury script hash and checks its USDM-equivalent value against the ticket price. Its separate Pool check requires unchanged physical Pool Value and the exact reserve/count increase.

This is an atomic pairing of **Treasury receipt + PrizePool risk reservation**. The reserve update is not a second physical deposit or a second EEV inflow.

Source references:
- [src/mint.ts](../../src/mint.ts)
- [plutus/MintPolicy.hs](../../plutus/MintPolicy.hs)
- [plutus/B1PrizePool.hs](../../plutus/B1PrizePool.hs)
- [PRE-RICH Game Economy](../../PRE-RICH/docs/GAME-ECONOMY.md)

### Treasury-address consistency caveat

The sale path honours the configured TREASURY_ADDRESS before falling back to the derived address. By contrast, the legacy src/treasuryPage.ts deposit/refresh page derives its address directly from treasuryValidator and does not import the configured override. If a deployment override differs from the directly derived address, the page's displayed/deposit address can diverge from the sale path. The actual deployment environment value was not visible in this source audit, so this is a **conditional identity/configuration risk**, not a claim that the deployed addresses currently differ.

The PRE Genesis observer independently requires exactly one PRE-bearing Treasury UTxO. Multiple PRE-bearing UTxOs therefore fail closed in that observer; it does not aggregate them into one canonical PRE balance.

Source references:
- [src/config.ts](../../src/config.ts)
- [src/treasuryPage.ts](../../src/treasuryPage.ts)
- [src/genesisTreasuryObservation.ts](../../src/genesisTreasuryObservation.ts)

## 3. Category-by-category accounting and custody map

| Category / flow | Intended accounting role | Physical custody or state found | EEV and obligation treatment | Current conformance classification |
|---|---|---|---|---|
| **Ticket receipts / general Treasury intake** | One central Treasury intake for player payments; no personal founder/team/operator entitlement | Script-address outputs created by the atomic Issue transaction; potentially multiple Treasury UTxOs | New value enters the Treasury custody perimeter. The paired PrizePool reserve update is a liability/risk record, not another asset inflow. | **Source-level path exists.** Canonical Treasury address/deployment binding and full category posting are not proven by this map. |
| **Prize allocation / B1 PrizePool** | Prize category is made available to the specialized PrizePool by protocol-controlled funding; winners are paid from the Prize accounting | B1 PrizePool singleton UTxO plus datum: ppTotalLiquidity, ppPendingLiabilities, ppUnresolvedReserve, ppUnresolvedTicketCount, ppLockedJackpot and control fields | Treasury→PrizePool is an internal reallocation only in a combined EEV perimeter that includes both sides. The final Pool→claimant payment is an external outflow and must reduce Pool assets while settling the corresponding accepted liability. | **Incomplete.** No current production builder was found that consumes a canonical Treasury UTxO as the FundTreasury source. Claim builder/validator mismatch is present. |
| **Reserve / unresolved ticket reserve** | Protected capacity, not free Treasury spendable value | B1 stores the per-ticket unresolved reserve and count. The legacy Treasury datum also has a separate reserve destination/percentage, but that is historical distribution machinery. | B1 unresolved reserve is distinct from deterministic worst-case exposure and from any general Reserve Protection requirement. It is not an available maintenance/reward budget. | **Partially represented in B1.** No complete Treasury-side Reserve sub-ledger or exhaustive reconciliation to R7 has been proven. |
| **Jackpot** | Separate, locked, protected Prize-related capital | ppLockedJackpot in the B1 PrizePool datum | Must be deducted/protected exactly once; unavailable for ordinary claims, Maintenance/OPEX or rewards before its permitted payout transition. | **B1 field exists.** Current funding/payout transition completeness and global classification are separate conformance questions; a positive scalar alone is not proof of provenance. |
| **Maintenance / mandatory OPEX** | Pay only mandatory costs the protocol has actually undertaken to bear | No current Maintenance balance/counter or current spend builder was identified in the inspected PRE-RICH application path. Maintenance script hash/percentage fields exist only in the legacy TreasuryDatum distribution mechanism. | A Cardano fee/min-UTxO or wallet-paid cost is not automatically a protocol Maintenance liability. A cost is protocol-borne only when the protocol actually assumes it; any payment must consume an authorized budget/obligation. | **Not implemented as a demonstrated category ledger.** No authenticated opening balance, budget authority, debit path or paid-service evidence identified. |
| **PRE holder rewards / staking** | Non-custodial snapshot reward distribution funded from the same Treasury's internal staking-accounting balance | src/preStaking.ts defines PreTreasuryStakingAccount.availableBalance; calculation consumes that caller-supplied value. PRE remains in holder wallets; snapshot → entitlement → PRE distribution. No second on-chain staking pool. | The staking-accounting amount must be authenticated and classified before entitlement calculation. Calculation is not itself a Treasury debit or payout. | **Calculator implemented only.** No authenticated Treasury balance reader, allocation authority, persistent epoch ledger or direct/claim distribution path is established here. The current code only accepts linear, while the governing PRE staking choice remains OPEN. |
| **Relayer execution reward** | Optional bounded payment for a permitted execution facilitator, only if separately authorized | Historical percentage calculation remains defined in relayer/relayer.js; current treasuryWorker sums Treasury lovelace and then logs that distribution is disabled pending canonical EconomicAdmission | Not an automatic entitlement and not interchangeable with PRE-holder staking or Contributor Rewards. | **Fail-closed operational boundary.** src/__tests__/rf8-treasury-relayer-boundary.test.ts checks that the worker does not sign, submit or invoke the percentage calculator. |
| **Genesis PRE bootstrap** | A specific PRE-RICH admission predicate using the central Treasury, not a transfer into PrizePool | Read-only observer requires exactly one PRE-bearing Treasury UTxO and an authenticated Oracle State; Genesis admission checks the verified PRE/USDM threshold. | Bootstrap PRE is not automatically PrizePool liquidity and must not be added to PrizePool EEV absent a real transfer and qualifying Pool observation. | **Observation/admission only.** It neither moves funds nor creates a category transfer. |

The PRE-RICH economic specification says player payments enter protocol-controlled Treasury, removes the old fixed 75/10/10/5 split from canon, and separately requires Treasury→PrizePool funding to preserve liabilities, unresolved reserve, deterministic exposure, locked Jackpot, safety capital and all other mandatory invariants. See [GAME-ECONOMY §§8, 14–15](../../PRE-RICH/docs/GAME-ECONOMY.md).

The PRE staking triangulation states that the Treasury staking balance is an internal accounting partition, not a second wallet/contract/pool. It also leaves the amount/source rule, snapshot cadence, eligibility, weight and distribution mechanism open. See [PRE staking triangulation](../architecture/PRE-RICH-PRE-STAKING-TRIANGULATION-2026-09-29.md), [open decisions](../architecture/PRE-RICH-PRE-STAKING-OPEN-DECISIONS.md) and [calculator boundary](../architecture/PRE-RICH-PRE-STAKING-CALCULATOR.md).

## 4. Critical correction: B1 FundTreasury is not yet a proven Treasury→PrizePool transfer

The B1 validator's FundTreasury branch:
- requires a continuing Pool output;
- recomputes USDM-equivalent liquidity from that output's physical Value through Economic.poolUsdmValue;
- requires ppTotalLiquidity to equal that recomputed value;
- requires liquidity to increase;
- preserves the other B1 accounting/control fields and checks post-state solvency.

But the branch does **not** check that one of the transaction's funding inputs belongs to the canonical Treasury script/address, nor that the funding asset is debited from a Treasury-controlled source. The B1 validator only proves the continuing Pool's value/datum consistency and solvency.

The inspected audit/cardano-integration/fund-treasury-oracle-valuation-trace.ts is a local-Yaci test harness with a synthetic test wallet, test minting policy, test Oracle State and synthetic Pool. For the funding transition it collects the Pool input, reads the Oracle reference input and creates a larger continuing Pool output. Lucid obtains the additional value from the test wallet; no canonical Treasury UTxO is consumed. The trace is useful evidence for the Pool's Oracle valuation behavior, but its action label FundTreasury does not establish Treasury provenance.

A current production builder for FundTreasury consuming an authenticated Treasury input was not found in the inspected runtime paths:
- src/mint.ts uses B1 TicketIssued;
- src/gameFlow.ts builds Reveal, Claim and Expire;
- the FundTreasury construction appears in the synthetic Yaci audit harness, not in the inspected production sale/game-flow builder.

This leaves a concrete semantic distinction to close: is Pool funding permitted as a third-party donation, or must a funding transition debit the canonical Treasury? The existing PRE-RICH specification describes Treasury funding as protocol-controlled. The current B1 validator does not prove that source. This audit does **not** choose a new donation policy or change the validator; it records the provenance gap.

Source references:
- [B1PrizePool.hs — FundTreasury](../../plutus/B1PrizePool.hs)
- [FundTreasury Yaci trace](../../audit/cardano-integration/fund-treasury-oracle-valuation-trace.ts)
- [MintPolicy atomic sale](../../plutus/MintPolicy.hs)

## 5. Claim: physical asset debit mismatch

The current src/gameFlow.ts::claimPrize:
1. subtracts the claimed amount from B1 datum ppTotalLiquidity;
2. subtracts it from ppPendingLiabilities;
3. continues the B1 PrizePool output with utxoAssets(b1ppUtxo), i.e. the same physical Value as the input;
4. pays the settlement basket separately to the claimant.

The plutus/B1PrizePool.hs::TicketClaimed validator instead requires:
- the claimant payout to meet the exact USDM-equivalent prize;
- poolInputUsdm - poolOutputUsdm == claimedAmount;
- ppTotalLiquidity(post) = ppTotalLiquidity(pre) - claimedAmount;
- the pending-liability reduction through the corresponding Claim delta;
- the other protected/control fields to remain unchanged and post-state solvency to hold.

Therefore the source builder's continuing Pool Value does not satisfy the validator's required physical value delta for a positive claim. This is a source-level contradiction; it has **not** been described here as a fresh Preprod transaction failure or a newly run Yaci simulation.

The correction cannot be reduced to a datum-only decrement: the asset-side decrease, claimant output and liability settlement have to be atomic and source-attributed. It also cannot be certified solely by the existing scalar Claim tests.

Sources: [gameFlow.ts](../../src/gameFlow.ts) · [B1PrizePool.hs](../../plutus/B1PrizePool.hs) · [claim settlement address test](../../src/__tests__/claim-settlement-address.test.ts).

## 6. EEV perimeter: aggregate accounting versus current Direct-USDM observation

Keep these two scopes separate:

**Combined Treasury + PrizePool accounting perimeter.** If both Treasury custody and PrizePool custody are included in one aggregate EEV inventory, a Treasury→PrizePool transfer is a custody reallocation: the same asset must not be counted twice, and the transfer does not create new aggregate value.

**Current PRE-RICH Direct-USDM EEV profile.** The current PRE-RICH-EEV-USDM-DIRECT-V1 observation is bound to the exact B1 PrizePool UTxO and measures the qualified USDM asset physically present there. The reader requires the B1 ppTotalLiquidity datum to match that direct physical USDM value. It does not automatically add the separate Treasury UTxOs to this PrizePool-only observation.

Consequently, the current direct profile does not prove that the general Treasury has been included in EEV. When the Pool receives a transfer, its measured Pool balance increases; that is consistent with a Pool-only perimeter. A future aggregate Treasury+Pool perimeter would need a complete source-set and duplicate-exclusion proof before the same value could be treated as a mere internal reallocation.

Further, the B1 FundTreasury validator's Economic.poolUsdmValue uses the existing Oracle basket valuation path, while the current Direct-USDM profile deliberately avoids that generic Oracle valuation and counts only the qualified physical USDM asset. These two valuation profiles must not be silently treated as identical.

Sources: [DirectUsdmEev](../../Adapter/CARDANO/observation/DirectUsdmEev.ts) · [PreprodDirectUsdmObservation](../../Adapter/CARDANO/observation/PreprodDirectUsdmObservation.ts) · [R7 accounting partition](../02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md).

## 7. Legacy four-way Treasury distribution: present in source, not a proven current authority

The repository still contains:
- plutus/Treasury.hs and TreasuryDatum with Prize/Stake/Reserve/Maintenance script hashes and percentage fields;
- src/treasuryPolicy.ts, explicitly marked deprecated;
- legacy percentage calculation and a DISTRIBUTE_REDEEMER in relayer/relayer.js;
- src/treasuryPage.ts with an example datum assigning 25% to each of four historical destinations.

This is not a current canonical economic allocation:
- PRE-RICH GAME-ECONOMY.md classifies 75/10/10/5 as HISTORICAL / NON-CANONICAL;
- relayer/relayer.js::treasuryWorker is observation-only at the distribution point and explicitly logs that legacy distribution is disabled until an authoritative EconomicAdmission path is defined;
- src/__tests__/rf8-treasury-relayer-boundary.test.ts asserts the worker has no sign/submit call and does not invoke calculateDistribution.

Do not restore a historical percentage, infer a replacement split, or delete/refactor the legacy validator without a separate deployment/release-isolation decision. The source census establishes **legacy distribution code remains**, but does not prove the legacy distribution validator is the current economically active authority.

Sources: [Treasury.hs](../../plutus/Treasury.hs) · [treasuryPolicy.ts](../../src/treasuryPolicy.ts) · [relayer worker](../../relayer/relayer.js) · [RF8 regression](../../src/__tests__/rf8-treasury-relayer-boundary.test.ts).

## 8. R7 / PA1–PA7 consequence

R7 v3.0.0 is a normative two-sided decomposition:
- assets A1–A5 define executable/verified/contingent/informational asset content;
- liabilities L1–L6 define accepted, conditionally committed, unresolved, settled, expired and unrepresented commitments;
- its permitted deltas include settle: L1|L2→L4, but do not include a general asset outflow from A1/A2 to outside the protocol perimeter.

This creates two different certification problems:
1. **Internal category/custody reallocation:** prove that the same physical asset is moved or reattributed without being duplicated in aggregate EEV; identify the source and destination categories and preserve all protected constraints.
2. **Final external disbursement:** prove that the correct category's asset balance physically decreases, the claimant/beneficiary receives the certified amount, and the corresponding liability/budget is settled atomically.

The current Claim path fails the physical asset-debit requirement at source level. The B1 FundTreasury path fails to prove Treasury provenance. The PRE staking calculator lacks an authenticated source/budget and distribution path. Maintenance has no demonstrated budget/debit ledger.

| R7 artifact | Current PRE-RICH evidence from this audit | Status |
|---|---|---|
| **PA1 — profile instantiation** | Known Treasury intake, B1 PrizePool, ticket reserves/liabilities, Jackpot scalar and snapshot reward calculator; other commitments/categories not exhaustively mapped | PARTIAL |
| **PA2 — exhaustiveness** | No complete set of all Treasury categories, UTxO custodians, rewards, mandatory costs and future commitments proved | OPEN |
| **PA3 — disjointness** | Internal Treasury/PrizePool custody and sub-account category mapping not yet reconciled against the global EEV set | OPEN |
| **PA4 — valuation** | Direct physical USDM Pool observation exists; legacy Oracle basket remains in B1 Funding/Claim valuation; other Treasury categories not fully valued/qualified | PARTIAL |
| **PA5 — delta closure** | Treasury→Pool provenance missing; external Claim asset debit mismatch; rewards and Maintenance debits not evidenced | OPEN / NON-CERTIFIABLE |
| **PA6 — L6 emptiness** | Unrepresented exposure outside the observed B1 counters/categories not excluded | OPEN |
| **PA7 — omitted-class adversarial review** | No complete adversarial pass over every Treasury category and outflow has been evidenced here | OPEN |

This is a profile-level mapping only. It does not amend R7's normative delta list or define a new delta name. A proposed asset-side debitClaim, disburse or category transfer representation must remain non-canonical until the model's semantics and conservation proof are explicitly adopted.

Source: [R7 Accounting Partition and Conservation Certification](../02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md).

## 9. Category ledger evidence contract — minimum fields to prove later

For each category and each economic movement, the future evidence packet should identify:

1. **Category identity:** category name/ID, PRE-RICH policy version and exact accounting role.
2. **Source custody:** exact input UTxO/reference or canonical internal-account state, controlling script/address identity and authenticated datum/version.
3. **Destination custody:** exact output UTxO/reference or beneficiary, asset policy/name and amount.
4. **Asset and valuation:** physical asset quantities, qualified valuation profile/oracle reference if required, precision and conversion result.
5. **Pre/post category state:** balances/available budget, protected/committed status and exact integer delta.
6. **Commitment pairing:** liability, reserve, CAR or budget entry created/settled/released by the movement; exact identity and single-use behavior.
7. **EEV perimeter:** whether source and destination are both inside the selected aggregate/per-profile perimeter; duplicate-exclusion rule.
8. **Economic Gate:** authenticated pre-state, transition, post-state, admissibility witness and exact consumed input binding.
9. **Atomicity and replay:** same-transaction pairing or equivalent proven mechanism; consumed-input/epoch/claim replay rejection.
10. **Independent reconstruction:** reproducible evidence from ledger/provider state, transaction CBOR/hash and a verifier that does not trust the caller's category labels.

A destination address alone does not prove the economic classification of an inflow. A datum category label alone does not prove custody or a debit. A calculator input alone does not prove that Treasury value was allocated, reserved or paid.

## 10. Ordered closure work (no policy invented)

1. **Treasury identity:** reconcile sale, manual deposit/observation and Genesis observer to one authenticated deployment Treasury identity; record exact script hash, address, canonical datum and live UTxO/source-set.
2. **Category representation:** decide and specify how Prize, Reserve, Maintenance and Reward/staking are recorded inside the single Treasury accounting state. Do not create four new Treasury authorities or copy the legacy percentages.
3. **Prize funding:** determine whether the approved funding operation must consume a Treasury-owned input (as the current policy text suggests) or whether independent donations are separately allowed; then bind source, destination and Pool post-state atomically.
4. **Claim settlement:** reconcile the accepted R7 asset-side settlement semantics with the actual Pool Value delta and claimant output; only then implement the source/debit builder and verify against the validator.
5. **PRE-holder rewards:** define the authenticated Treasury staking balance, allocation authority, snapshot/eligibility/weight decisions and direct-versus-claim distribution before using the calculator for a real epoch.
6. **Maintenance:** enumerate only mandatory protocol-paid obligations, their authorized budget, payment beneficiary/service evidence and debit path; keep chain execution fees distinct.
7. **Aggregate EEV / PA2–PA7:** construct the complete source-set and category/liability ledger; prove no double counting, omissions, unrepresented exposures or cross-category spending.
8. **Adversarial conformance:** test replay, insufficient category balance, wrong source UTxO, category substitution, stale/missing observations, double claim, duplicate epoch distribution, Jackpot/Reserve drain and unexpected wallet-borne costs.

## 11. Non-regression and evidence boundary

- No fixed Treasury percentage is selected or inferred.
- The old 75/10/10/5 split remains HISTORICAL / NON-CANONICAL.
- PRE holder rewards, relayer execution rewards, generic contributor rewards and IMMORTAL Protocol Usage Fee are not interchangeable.
- ProtocolUsageFee is not ChainExecutionCost; PRE-RICH application Treasury rules are not universal IMMORTAL primitives.
- No R7 delta, kernel formula, V3, Reveal, Issue semantics, governance authority, key, signer, deployment or on-chain state is changed by this audit.
- The current-head source inspection is not a live Preprod Treasury inventory, a completed production FundTreasury transaction, a Claim simulation, or a category-ledger certification.
- No fresh CI was run as part of this document's source audit.

**Overall status: SINGLE TREASURY MODEL CONFIRMED AT PRE-RICH ACCOUNTING-INTENT LEVEL / CATEGORY LEDGER NOT YET PROVEN / FUNDING SOURCE AND CLAIM OUTFLOW CONFORMANCE OPEN / PA5 OPEN.**

## 12. Clarification: "Reward" is not one interchangeable category

The repository and adjacent research use the word Reward for several economically different things. They must remain separate:

| Reward meaning | Owner / scope | Source and custody model | Evidence/status |
|---|---|---|---|
| **PRE holder reward (PRE staking)** | PRE-RICH application | A non-custodial PRE wallet-balance snapshot consumes an authenticated internal staking-accounting amount from the single PRE-RICH Treasury. No separate on-chain pool or PRE lock is intended. | Calculator exists; source amount, allocation decision, snapshot/eligibility/weight and distribution path remain open. |
| **Contributor / governance reward budget** | Universal IMMORTAL protocol-revenue research, not PRE-RICH holder staking | The separate research boundary is ProtocolRevenueReceived → AccountingClassification → CertifiedRewardBudget → RewardAllocation. It requires RewardBudget ≤ AvailableProtocolRevenue and RewardAllocation ≤ RewardBudget; the destination alone does not create a budget. | Found only as NON-NORMATIVE research on work/b3-materios-provenance-evidence, not as a current PRE-RICH on-chain category or a production implementation on work/immortal-green-closure. |
| **Relayer execution reward** | Optional execution-facilitator compensation | Historically embedded in the legacy percentage calculation as a relayer amount/minimum; it is not a PRE holder entitlement. | Current relayer worker is fail-closed at distribution; no active payment path is proven. |
| **Prize winner payout** | PRE-RICH game economy | Paid from the Prize/PrizePool accounting position against a crystallized ticket liability. | Claim builder/validator asset-debit mismatch remains open. |

The contributor-reward research source is [TREASURY-REWARD-ACCOUNTING-BOUNDARY-v1.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/TREASURY-REWARD-ACCOUNTING-BOUNDARY-v1.md). It is explicitly research/non-normative and belongs to a different branch/workstream. It must not be silently imported into PRE-RICH or interpreted as proof that a general Reward sub-ledger already exists in the current Green Closure branch.

**Result:** the term Reward needs an explicit category identity and owner before it can enter the PRE-RICH category ledger. PRE holder staking, contributor/governance rewards, relayer compensation and game prizes are four different economic flows. No generic shared Reward balance is evidenced by the current PRE-RICH implementation.
