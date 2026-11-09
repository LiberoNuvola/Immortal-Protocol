# Agent A — FundTreasury as a candidate R1/QNE witness: accounting-basis audit

**Date:** 2026-11-09  
**Branch:** work/immortal-green-closure  
**Exact branch HEAD inspected:** 6dc178b0ab3040facf581667acaea009f80a7c2f  
**Classification:** SOURCE-DERIVED CANDIDATE REVIEW — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Owner:** Agent A — PRE-RICH economics, EEV and admission policy  
**Scope:** B1 FundTreasury, direct-tUSDM EEV, first V1 Issue and R1/T-MARGIN QNE. No edits to production, tests, V3, Reveal, 500×, datum/redeemer ABI or deployment.

## 1. Executive result — a relevant existing action was missing from the prior route list

The B1 PrizePool validator already has a FundTreasury action. It is distinct from the V3 Issue action and from the pure lifecycle EnterQuiescent/MaintainQuiescent actions.

At the B1 accounting boundary, FundTreasury:
- requires one Pool input and one continuing Pool output;
- recomputes the output's ppTotalLiquidity from the actual output Value through Economic.poolUsdmValue;
- requires output ppTotalLiquidity greater than input ppTotalLiquidity;
- leaves pending liabilities, unresolved face reserve/count and Jackpot fields unchanged;
- requires post-transition solvency.

This makes FundTreasury a **candidate monotone funding action in the B1 oracle-valued accounting model**. It deserves to be considered alongside Hold/Quiesce as a potential conservative action.

However, it is **not currently demonstrated to be a QNE witness for the first Preprod Issue's R1 buffer**, because the two paths use different EEV bases:

- B1 FundTreasury values the continuing Pool through Economic.poolUsdmValue and a configured Oracle State/publisher.
- The first-Issue Direct-USDM EEV profile counts only the exact physical tUSDM quantity in the exact B1 Pool UTxO, without applying an oracle price.

The B1 action proves that the Oracle-valued total increases. It does not prove that the physical tUSDM quantity used by the R1 direct-EEV profile is non-decreasing. Therefore the candidate has **not** discharged QNE under the actual first-Issue EEV contract.

## 2. Exact source chain

Fetched from work/immortal-green-closure at the inspected HEAD:

| Source | Blob SHA | Finding |
|---|---|---|
| plutus/B1PrizePool.hs | 175be60b8f01ef214c92d7527191bcebb66ad656 | FundTreasury validator branch |
| plutus/Types.hs | 60caeb747018b512e8e6ae7d8a100bb7023863d9 | Action comment: Treasury deposits funds; actual increase checked on-chain |
| Adapter/CARDANO/observation/DirectUsdmEev.ts | 0c6fa421a2655a2e84610f8ae4dae2a002120cbf | Direct physical tUSDM quantity → USDM sub-units; no Oracle price |
| PRE-RICH/onchain/PreRichEconomicAdmission.hs | a654587114beec997d97d59810d1fb648facf365 | V3 economic admission has no B1 FundTreasury or direct lifecycle action input |
| PRE-RICH/onchain/PreRichIssueDecision.hs | d7ef01b841fc28a5e5085f8cfe473b7cc8e92e09 | First-Issue decision constructs the fixed V1 Issue path |
| IMMORTAL/kernel/EconomicGate.hs | c9682c2c1c3b522280e2abe6fe2b91a86fec1287 | Gate takes normalized EEV and externally verified evidence; it does not define the relationship between the two accounting sources |

Related existing test/trace sources:
- src/__tests__/b1-invariants.test.ts — blob 8ee30bd44de17707a8585310936e08fb37d1123c;
- audit/cardano-integration/fund-treasury-oracle-valuation-trace.ts — blob 50d02073edc7d22c9655aefa5cd1cf3615925313.

The trace is a test/diagnostic script targeting local Yaci. Its source includes an ADA-only Pool, an ADA price quote and an ADA deposit. This audit did not execute that script or claim its ledger evidence as a new run.

## 3. What B1 FundTreasury actually enforces

The current B1 branch checks the pre-state solvency before action dispatch. For FundTreasury, it decodes the Oracle State reference and computes:

    recalcLiq =
      Economic.poolUsdmValue(
        txInfo,
        configuredOracleState,
        configuredOraclePublisher,
        Pool policy/name,
        continuingPoolValue
      )

It then requires:
- a decodable continuing Pool datum;
- ppTotalLiquidity(after) == recalcLiq;
- ppTotalLiquidity(after) > ppTotalLiquidity(before);
- equality of ppPendingLiabilities;
- equality of ppUnresolvedReserve;
- equality of ppUnresolvedTicketCount;
- equality of ppLockedJackpot, ppJackpotThreshold, ppSuspendedClasses and ppPrizeHash;
- post-state solvencyInvariant.

Thus, for the **B1 accounting quantity**, ProtectedCapital components represented by these unchanged fields do not grow in this transition, while ppTotalLiquidity rises. On that same valuation basis, the B1 buffer increases.

The spending validator does not impose a separate authority-signature check for a named Treasury operator in this branch. A contributor still has to supply and sign whatever inputs fund the continuing Pool output. The type comment describes the action as a Treasury deposit, but the branch itself authenticates the resulting ledger Value and Oracle valuation rather than a distinct donor identity.

## 4. Why this is not yet the first-Issue QNE proof

### 4.1 The EEV bases are not interchangeable

The direct adapter derives EEV from the exact tUSDM unit:

    EEV_direct = floor(
      tUSDM_atomic_quantity × 100 / 1,000,000
    )

It rejects unqualified positive native-asset units, apart from explicitly allowed non-economic units. It does not mark ADA or another asset using an Oracle.

By contrast, B1 FundTreasury requires the oracle-derived ppTotalLiquidity to rise. The validator branch shown above does not compare the complete Pool input Value and output Value for monotonicity, nor does it require:

    tUSDM_quantity_after >= tUSDM_quantity_before

A Pool output can therefore have a higher Oracle-valued total without the source establishing that direct physical tUSDM EEV increased. For example, an ADA deposit with an accepted ADA quote raises ppTotalLiquidity in the existing test trace, while it does not add any tUSDM units to the direct-USDM EEV quantity. More generally, the Oracle valuation and physical direct-tUSDM balance are separate predicates.

The exact first-Issue profile cannot simply substitute B1's Oracle-valued ppTotalLiquidity for its Direct-USDM EEV without reopening the adopted EEV/Option B authority boundary.

### 4.2 No transaction-bound bridge into the R1 witness

PreRichEconomicAdmission projects a V3 state and calls the Economic Gate for a V3 action. The function has no B1 FundTreasury action, no exact Pool input/output reference pair, and no FundTreasury-derived direct-EEV witness object.

The existing B1 validator and the Direct-USDM adapter are separate source paths. The current R1 certificate would need to bind them to the same exact canonical Pool transition and show that the amount used by b = EEV − ProtectedCapital is the same quantity the B1 validator protects.

### 4.3 Availability is not guaranteed by permissionless submission

A public contribution action is not the same as a guaranteed always-available witness. FundTreasury needs an external contributor and positive input Value. Permissionless means that no named operator is required to authorize the contribution; it does not prove that a donor with sufficient funds exists at every state.

For R1/VC3 and T-MARGIN, the witness selector must be defined for every state in the certified region. If donor/input availability is part of the action's preconditions, it must be represented in the concrete action model and Ω, not assumed.

## 5. Conditional R1 arithmetic if a direct-EEV monotone fund action were proved

Let the current direct-EEV margin be:

    b0 = EEV_direct_before − ProtectedCapital_before

For a candidate funding transition, assume — this is a proof obligation, not a current source fact — that:
1. the exact physical tUSDM quantity in the authenticated Pool UTxO cannot decrease;
2. the quantity increase is converted exactly through the Direct-USDM unit/scale rule;
3. every represented liability and ProtectedCapital component is unchanged;
4. the candidate post-state is safe and retains complete obligation representation.

Then:

    EEV_direct_after >= EEV_direct_before
    ProtectedCapital_after = ProtectedCapital_before
    Δb >= 0

Under those premises, the funding transition would be a plausible QNE witness for that funding step. It would not make Issue(0,1) itself non-eroding. Instead, a candidate Issue could remain in the margin-defined certified region if sufficient buffer exists before it.

At S0, with no pre-existing protected obligations, the exact amount condition for one class-0 ticket is:

    b_after_funding >= 500 RU

Equivalently, if b0 is the current margin and the funding increases direct EEV by D RU, then:

    D >= max(0, 500 − b0)

After the class-0 Issue, the existing source-derived margin delta is −500 RU; the post-Issue margin is b_after_funding − 500. It remains non-negative when the funding precondition above holds.

This is a useful distinction: **FundTreasury could potentially serve as the conservative QNE witness, while Issue is a separately admitted action that consumes a bounded amount of already-funded margin.** R1 does not require falsely labelling Issue as non-eroding if a different valid witness action preserves the certificate region.

That conditional argument is not yet a deployment certificate. It still requires S1, an always-available/accepted witness action, the full authoritative Ω, a total χ/Wit, VC1–VC6, exact action/Pool binding and deployment evidence E1–E10.

## 6. Minimum proof requirements before promoting this candidate

No code or policy change is recommended until the specification authority and Agent B review the following:

1. **Same EEV basis:** demonstrate that the FundTreasury post-state increases or preserves the exact direct tUSDM quantity used by R1, not merely Oracle-valued ppTotalLiquidity.
2. **Physical Value monotonicity:** bind the exact Pool input/output and require a direct asset comparison or an independently proven equivalent property; do not infer it from a scalar Oracle valuation.
3. **Asset authority:** bind the exact Preprod tUSDM policy/name/network and current qualification record. An increase in an unqualified asset does not increase VerifiedUSDM.
4. **Atomic accounting:** preserve every liability, face reserve, Jackpot and other protected component, and bind the candidate datum to the same continuing Pool UTxO.
5. **Permissionless action model:** establish that any party can fund the Pool without a named privileged operator, while explicitly modelling the required donor inputs/resources. Do not claim guaranteed availability if it depends on an absent donor.
6. **Ω proof:** include chain reorganisation/finality, asset-identity/qualification changes, transaction failure, timing, concurrency, source revocation and every other economically material event in the declared perimeter; prove the action remains non-eroding for every successor.
7. **Joint R1 boundary:** connect the B1 transition, Direct-USDM observation and candidate R1 state to one canonical transition/Pool out-reference and verify all commitments at the same ledger cut.
8. **Execution acceptance:** show the actual on-chain B1 action and the R1 witness selector share the same semantics and that the candidate action can be executed within the declared resource envelope.

A future implementation might tighten the existing FundTreasury asset-monotonicity rule or define a separately typed direct-USDM funding transition. Both would be protocol/validator changes and require a separately authorized path/ABI review. This report selects neither.

## 7. Corrected route inventory and disposition

| Candidate route | New conclusion |
|---|---|
| True Hold / Quiescent | Existing pure lifecycle predicate exists, but it is not reachable from Genesis S0, not wired to admission, and does not prove Ω |
| Capital-accreting Issue | Still not a route: current Issue preserves Pool Value and increases ProtectedCapital by 500 RU |
| **Existing B1 FundTreasury** | New candidate: monotone in B1 Oracle-valued ppTotalLiquidity; not proven monotone in first-Issue Direct-USDM EEV; donor availability and R1 wiring remain open |
| Different inductive certificate | Still theoretically possible, but requires a total χ/Wit and VC1–VC6 over authoritative Ω |
| Statistical cohort profile | Separately governed guarantee; not a substitute for first V1 R1/QNE or universal Ω safety |

**Final disposition:** FundTreasury is a real existing action and a better-founded candidate for a capital-accreting QNE witness than inventing a new generic no-op. But its present oracle-valued liquidity predicate is not equivalent to the exact direct-tUSDM EEV contract, its physical asset monotonicity is not established, and an external donor is not guaranteed. It is therefore **CANDIDATE ONLY — NOT QNE-CERTIFIED**. R1/Kc/Ω remains OPEN; Issue #37 remains BLOCKED.

No production source, test, workflow, parameter, datum/redeemer ABI, V3, Reveal, 500×, wallet, transaction, approval, deployment or ledger state was changed or executed.
