# Agent A — PRE-RICH Treasury Reserve accounting crosswalk

**Date:** 2026-11-12  
**Branch:** `work/immortal-green-closure`  
**Inspected baseline HEAD:** `3a1665f6a9b7121f69bc1cfc8b3bd2bb9415fa40`  
**Classification:** NON-NORMATIVE ACCOUNTING / ECONOMIC CROSSWALK — NO POLICY OR IMPLEMENTATION AUTHORITY  
**Owner:** Agent A — IMMORTAL / PRE-RICH economic boundary  
**Review requested:** Agent B — kernel, Plutus and Cardano accounting/conformance boundary  
**Scope:** PRE-RICH Treasury Reserve category, its possible relationship to protected capital, and the physical Treasury → B1 PrizePool funding boundary.  
**Explicit exclusions:** D3 Arb Agent, changes to IMMORTAL kernel semantics, V1 500×, KA/KC/KD, R7, V3, Reveal, Registry, datum/redeemer ABI, deployment, wallet signing, transaction submission and ledger state.

## 1. Executive disposition

This note addresses one narrow gap left open by the existing Treasury category-ledger specification: the repository uses the term **Treasury Reserve** for a protected accounting category, and separately contains a typed **ReserveProtection** component in the V3 economic state, but no source-level or ledger evidence currently establishes that these are the same object.

They must remain separate until an explicit, asset-typed, non-overlapping mapping is adopted and verified.

The central conclusions are:

1. A Treasury Reserve category is an **accounting classification of assets held within the protocol-controlled Treasury**. Its existence does not prove a balance, physical custody, availability, or permission to spend.
2. `v3ReserveProtection` is a **protected-capital requirement component** in the V3 economic state. The kernel adds it to `ProtectedCapital`; it is not a Treasury UTxO, asset balance, allocation instruction, or proof of backing.
3. B1's `ppUnresolvedReserve` is the nominal face-price reservation for Pending tickets. It is neither Treasury Reserve nor WCE.
4. The current V1 worst-case exposure (WCE) is a deterministic bound derived separately from unresolved ticket prices: `500 × Σ(Pᵢ × Nᵢ)`. It is not a statistical estimate.
5. The Classic-6 statistical assessment is a model output. It is not cash, not a category balance and not `ReserveProtection`. The current V1 path remains deterministic and does not admit statistical substitution.
6. A Treasury Reserve can potentially increase V1 ticket capacity **only when a qualified asset is physically transferred into the exact B1 PrizePool perimeter** and all source debit, destination credit, accounting and solvency conditions are enforced. A Treasury category posting alone cannot do this.

**Disposition:** preserve all existing economic semantics. Treat Treasury Reserve ↔ `ReserveProtection` as an unresolved correspondence, not an implemented mapping. No percentages, triggers, opening balance, risk ceiling, or new capital rule are selected here.

## 2. Existing source hierarchy and work already completed

This note is deliberately not a replacement for earlier work:

- `PRE-RICH/docs/GAME-ECONOMY.md` is the closed PRE-RICH economic baseline. It defines the 500× maximum normal payout, WCE, liability-first accounting, the unresolved-ticket statistical reference, and the separation of the Genesis bootstrap from PrizePool liquidity.
- `docs/research/PRE-RICH-TREASURY-CATEGORY-LEDGER-OPERATIONAL-SPEC-2026-11-04.md` is the non-normative implementation/conformance contract for the single logical Treasury and internal categories. Its §3.1 expressly separates unresolved-ticket reserve, WCE, pending winning liabilities, locked Jackpot and any general Reserve protection. It states that a Treasury-side Reserve ledger and reconciliation with R7 `ProtectedCapital` have not been demonstrated.
- `docs/COORDINATION/AGENT-A-R1-ADAPTIVE-ISSUE-CAPACITY-AND-TRANSITION-MATRIX-2026-11-08.md` already covers the statistical cohort, capacity frontier, candidate RiskModes and the non-retroactive boundary. This note does not repeat or supersede that work.
- `docs/COORDINATION/AGENT-A-R1-DYNAMIC-MARGIN-STATISTICAL-RESERVE-BASELINE-2026-11-06.md` and `docs/COORDINATION/AGENT-A-R1-TRAJECTORY-TO-RISK-MODE-SELECTION-CONTRACT-PROPOSAL-2026-11-07.md` cover the statistical/dynamic-risk line. The word “Reserve” in those materials must not be read as evidence of a funded Treasury category.
- Agent B's `AGENT-B-R1-STATISTICAL-ISSUE-BINDING-CONTRACT-PROPOSAL-2026-11-08.md` and `AGENT-B-CARDANO-COHORT-ACCUMULATOR-FREEZE-FEASIBILITY-2026-11-08.md` are technical proposals, not authorization to replace V1's deterministic floor.
- GitHub Issue #41, “PRE-RICH Treasury receipt journal and batch-settlement carrier,” already owns the read-only receipt journal and Treasury carrier feasibility work. It explicitly says that no receipt may be assigned automatically to Prize, Reserve, Maintenance or PRE-holder staking until a PRE-RICH-owned posting rule is approved. This note does not duplicate the Issue #41 journal/carrier work.

The 2026-11-09 A↔B checkpoint records that Issue #41 is orthogonal to the R1/S0 QNE work: a receipt journal is not a QNE witness, a Prize category credit, a Treasury → Pool authorization, or a statistical admission path.

## 3. Five different objects that must not be conflated

| Object | Current meaning | What it is not |
|---|---|---|
| **Treasury Reserve category** | A PRE-RICH internal accounting category intended to classify protected capacity held within the protocol Treasury. | Not a physical wallet/UTxO by definition; not automatically spendable; not `ReserveProtection`. |
| **`v3ReserveProtection` / `ReserveProtection`** | A distinct V3 protected-capital component. The kernel adds its amount to `ProtectedCapital`. | Not proof that a matching amount exists in Treasury or PrizePool custody; not a Reserve category balance. |
| **`ppUnresolvedReserve`** | B1's aggregate face-price reservation for unrevealed/Pending tickets, equal to the sum of their ticket prices. | Not the Treasury Reserve; not full WCE; not free liquidity. |
| **WCE** | The deterministic PRE-RICH V1 maximum normal payout exposure, derived as 500 times unresolved face exposure. | Not a probabilistic mean/quantile and not an independently held cash bucket. |
| **Statistical risk assessment** | A model result for an explicitly defined population/cohort and assumptions. | Not capital, not a Treasury posting, not a Reserve asset, and not an automatic ProtectedCapital delta. |

Other protected positions remain separate: crystallized/pending winning liabilities, locked Jackpot, SafetyCapital and mandatory future costs.

### 3.1 What the current source actually computes

The inspected `IMMORTAL/kernel/EconomicKernel.hs` computes:

```text
ProtectedCapital =
    CrystallizedLiabilities
  + WorstCaseExposure
  + SafetyCapital
  + ReserveProtection
  + LockedJackpot
  + MandatoryFutureCosts

RawSurplus = max(0, EEV - ProtectedCapital)
```

The same module derives:

```text
WorstCaseExposure =
  maxNormalPayoutMultiplier × totalClassExposure
```

For PRE-RICH V1, the profile multiplier is 500.

Separately, B1's `effectivePool` is:

```text
effectivePool =
    ppTotalLiquidity
  - ppPendingLiabilities
  - ppUnresolvedReserve
  - ppLockedJackpot
```

These functions have different purposes and are not interchangeable:

- V1 `solvencyInvariant` checks whether EEV covers `ProtectedCapital`.
- B1 `effectivePool` represents the Pool amount after crystallized liabilities, the nominal unresolved-ticket reserve and locked Jackpot are deducted. It is used by B1 transition checks, including Reveal affordability.
- `ppUnresolvedReserve` is not added as a separate term to the V1 `ProtectedCapital` formula. The face reserve is accounted for in the B1 effective-pool calculation; WCE is independently included in protected capital. Do not “correct” this by adding or subtracting the face reserve again in the WCE equation.

The B1 validator's `solvencyInvariant` passes `ppTotalLiquidity` as the EEV argument to the universal kernel with the legacy B1 projection. This does not make B1's Oracle-valued liquidity amount identical to the separate Direct-USDM physical EEV profile.

### 3.2 Reveal affordability at the exact WCE boundary — confirmed source-level mismatch, fix OPEN

The pre-Reveal affordability condition is present in more than one layer:

- `plutus/B1PrizePool.hs::TicketRevealed` checks `payout <= effectivePool(datum)` before applying the same transition's face-reserve release and pending-liability increase.
- `plutus/PrizeValidator.hs` independently checks the same bound against the input B1 Pool datum before accepting the Reveal.
- `PRE-RICH/src/PreRichRevealRefinement.ts` mirrors the same pre-Reveal effective-pool condition.

The exact ticket price is bound to the consumed PrizeDatum, and the B1 branch releases that price and increases pending liabilities atomically in the post-state. However, the affordability comparison uses the pre-state effective pool without adding back the face reserve that the same transaction releases.

Define:

```
F       = Σ P_i                       (all currently Pending ticket face value)
E_free  = ppTotalLiquidity
          - ppPendingLiabilities
          - ppLockedJackpot
q       = Σ P_j for tickets already revealed at 500×
p_i     = price of the next ticket to Reveal
```

Immediately before this Reveal, the unresolved face reserve is F - q, and already crystallized liabilities include 500 × q for the all-maximum path. Therefore:

```
effectivePool_before = E_free - 500 × q - (F - q)
                     = E_free - F - 499 × q
```

The current validator requires:

```
500 × p_i <= E_free - F - 499 × q
```

or equivalently:

```
E_free >= F + 499 × q + 500 × p_i
```

Because q <= F - p_i, the largest requirement for a chosen last ticket is reached when every other Pending ticket has already paid its 500× maximum:

```
E_free >= 500 × F + p_i
```

To guarantee that every possible Reveal ordering can complete even when every ticket pays its maximum, the sufficient and necessary headroom across possible last tickets is:

```
E_free >= 500 × F + max(P_i)
```

This is a direct algebraic consequence of the current pre-state check and the frozen 500× payout cap. It assumes all prices, liabilities and Pool accounting values use the same B1 USDM sub-unit scale. A loss, a smaller payout or an expiry is less demanding than the all-maximum path. A Claim reduces both ppTotalLiquidity and ppPendingLiabilities by the same amount, so it does not replenish this net headroom.

#### Exact Genesis illustration

For eight 1-USDM Genesis tickets:

- F = 8 USDM;
- WCE = 500 × F = 4,000 USDM;
- max(P_i) = 1 USDM;
- current pre-Reveal path condition = 4,001 USDM.

At exactly 4,000 USDM, the WCE/ProtectedCapital admission inequality accepts eight tickets, but after seven 500-USDM maximum Reveals, the last ticket sees only 499 USDM of effectivePool and its 500-USDM payout is rejected.

The exact-boundary capacity comparison is therefore:

| Qualified B1 accounting liquidity after pending-liability/Jackpot deductions | WCE admission inequality | Full all-maximum Reveal path under current pre-check |
|---:|---:|---:|
| 4,000 USDM | 8 tickets | 7 tickets |
| 5,000 USDM | 10 tickets | 9 tickets |
| 6,000 USDM | 12 tickets | 11 tickets |

For a homogeneous ticket price P, the two frontiers are respectively floor(E_free / (500P)) and floor((E_free - P) / (500P)). For mixed prices, the WCE admission inequality remains 500F <= E_free, while the current all-order Reveal condition additionally requires max(P_i) headroom.

#### Test-coverage finding

The current TypeScript B1 mirror in src/__tests__/b1-invariants.test.ts does not implement the Plutus pre-Reveal affordability guard inside applyTicketRevealed; its Reveal tests check the post-transition solvency predicate. Its “full lifecycle preserves worst-case solvency” case reveals losses and 1× wins, not an all-500× sequence at the WCE boundary.

The separate PRE-RICH/src/PreRichRevealRefinement.ts does contain the pre-Reveal guard, and src/__tests__/preRichRevealRefinement.test.ts tests an above-pool rejection and a 500× payout with substantial surplus. It does not test the exact WCE boundary, a repeated all-maximum Reveal sequence, mixed ticket prices, or every possible last-ticket ordering.

This is therefore not a live transaction failure or a claim that the implementation has already been tested against this adversarial sequence. The source predicates and arithmetic are clear; exact Plutus/Yaci adversarial conformance remains to be run by an authorized test task.

#### Disposition

The discrepancy is now treated as a concrete source-level accounting/liveness question, not merely an unverified suspicion. It is not an authorization to weaken the Reveal check, change the B1 datum, or add an arbitrary Reserve margin.

Candidate resolution families for independent review (none selected):
1. make the same-transition face-reserve release available to the payout affordability calculation, by evaluating the exact post-release amount;
2. retain the current pre-state check and make admission reserve the additional max(P_i) path headroom;
3. demonstrate that an already-authorized, separately typed protected-capital component necessarily supplies the extra headroom in every valid B1 state.

Any resolution must preserve exact price binding, 500× payout cap, liability-first accounting, non-overlap, and atomic Issue/Reveal/Claim/Expire behavior. No code or policy fix is selected here.

This finding also affects how illustrative WCE capacity may be described: the 8/10/12 values are the current WCE admission frontier, not yet a demonstrated full all-maximum Reveal-liveness frontier.

### 3.3 The current B1/V3 representation boundary

The V3 economic state and `PreRichEconomicProjection` carry `v3ReserveProtection` as its own field and project it into the universal economic state.

The inspected `B1LegacyAdapter` currently projects legacy B1 into the universal state with SafetyCapital, ReserveProtection and MandatoryFutureCosts set to zero. Its reverse projection rejects a V3 state with non-zero `v3ReserveProtection` (as well as non-zero SafetyCapital or MandatoryFutureCosts).

Therefore the generic V3/kernel component exists, but the current legacy B1 datum does not demonstrate a corresponding Treasury Reserve balance or a non-zero B1 ReserveProtection representation. Do not infer that the value is live in B1 merely because the universal/V3 model contains the field.

## 4. Why Treasury Reserve cannot automatically cover a “statistical tail miss” in V1

The concern about underestimating the worst part of the payout distribution is legitimate as a model-risk question, but the V1 economic guarantee already uses the hard per-ticket payout cap.

For unresolved face exposure:

```text
F = Σ(Pᵢ × Nᵢ)
WCE = 500 × F
```

The canonical Classic-6 model describes the distribution of outcomes *within* that payout bound. Its exact ticket-level mean and standard deviation are useful for statistical analysis, but they do not increase the maximum payout permitted by the V1 game rule.

If:
- the payout cap is 500×;
- the validator enforces the payout cap;
- all Pending ticket commitments are included in the unresolved exposure;

then the **aggregate maximum payout amount** cannot exceed WCE. A Classic-6 PMF that underestimates the frequency of large wins does not, by itself, increase the maximum permitted normal payout above that amount.

However, this amount-bound statement is not by itself proof that the current B1 Reveal path can execute every possible sequence of maximum outcomes. As described in §3.2, B1 checks each payout against `effectivePool` before releasing that ticket's face-price reserve. At the exact WCE boundary, the final maximum payout may fail this separate precondition. This is a possible source-level admission-versus-Reveal headroom mismatch and remains OPEN for independent review; it must not be hidden by saying that the WCE inequality alone proves full pathwise payout liveness.

Consequently, while V1's 500× protection remains mandatory:

- the statistical model must not reduce WCE;
- a statistical statistic must not be placed into `ReserveProtection` merely because it is called a reserve;
- a Treasury Reserve balance is not a substitute for resolving the admission-versus-Reveal headroom proof;
- a Reserve intervention for a normal tail-frequency event would not address this distinct pre-Reveal accounting condition.

This does not claim that WCE covers every possible protocol risk. Asset depeg, settlement failure, implementation defects, unrepresented liabilities, unauthorized outflows or compromised randomness/contract assumptions are separate risk classes. They require their own typed obligations, evidence and policy. They must not be silently folded into a generic “statistical tail” Reserve.

### Future probabilistic or hybrid profile

A future profile that relaxes the current pathwise 500× requirement for new tickets would be a different application guarantee. Its risk ceiling, horizon, model, complete pre-outcome cohort, lifetime budget, capital allocation and enforcement must be approved and bound before new commitments.

A future hybrid profile could consider a separately defined deterministic backstop for a precisely named uncovered risk component. No current policy selects that construction. The current statistical cohort proposals remain non-normative; they do not activate statistical Issue admission, alter existing tickets or authorize use of Treasury Reserve.

## 5. When a Treasury Reserve could have an economically meaningful use

There are three distinct candidate uses. They are not approved spending permissions.

### A. Physical liquidity relocation to B1 PrizePool

This is the clearest path compatible with V1's existing 500× guarantee.

If the protocol has an authenticated, non-encumbered Treasury Reserve asset balance, a future approved policy could authorize some of that balance to be transferred to the canonical B1 PrizePool. After a valid physical transfer and independent qualification, the exact asset may increase the B1 Pool's eligible capital and therefore its capacity to support additional WCE.

This is **not** a ReserveProtection adjustment. It is a real custody movement:

1. consume an authenticated Treasury-controlled source input;
2. prove the source category debit is authorized;
3. transfer the exact asset unit/quantity;
4. increase the physical value of the exact B1 PrizePool output;
5. update the B1 state consistently and enforce post-state solvency;
6. reject replay, duplicate source consumption and category substitution;
7. independently reconstruct source debit, destination credit and the resulting EEV perimeter.

The policy direction Treasury → PrizePool is already established in `GAME-ECONOMY.md` §15. The implementation remains incomplete: the audited B1 `FundTreasury` path checks Pool value/datum consistency and Oracle-derived liquidity growth, but does not authenticate a canonical Treasury input or Prize-category debit. The synthetic Yaci trace's funding input is a test wallet. It is not a qualified Treasury settlement.

For the current `PRE-RICH-EEV-USDM-DIRECT-V1` profile, only qualified physical tUSDM in the exact B1 PrizePool UTxO counts. A Reserve category label or an Oracle-valued increment is not a substitute.

### B. Funding a separately defined protected obligation

A future specification might define a named protection requirement and decide that a portion of Treasury assets must be held against it. This would need:

- a precise obligation/risk identity and scope;
- its own asset/unit and valuation boundary;
- a rule for required amount and duration;
- evidence that the obligation is not already represented by WCE, pending liability, Jackpot, SafetyCapital or mandatory future costs;
- a separate custody/perimeter proof;
- explicit release/replenishment rules.

Only then could the protocol assess whether a corresponding V3 `ReserveProtection` term is appropriate. A protected-capital term is a *requirement*, not the asset that satisfies it. The same Treasury asset must not be counted once as an available balance and again as independent backing for a second protected component.

No such mapping is adopted here.

### C. Contingency cover for risks outside V1 WCE

The Treasury Reserve might eventually be a source of funds for an explicitly defined non-WCE event, but “model underestimation” alone is not a sufficient trigger while V1's deterministic cap remains enforceable.

A contingency path would need a named event, a verifiable proof, an authorized maximum, a recipient/destination, a source-category debit, atomic settlement and a rule for whether/how the reserve is replenished. It must not change crystallized player rights or authorize a keeper/relayer/administrator to make discretionary payments.

No event trigger or amount is selected here.

## 6. Capacity effect: source of new capital versus reclassification

A Treasury Reserve posting alone does not increase B1 EEV. Nor does moving an asset between internal categories create aggregate value.

For illustration only, assume the exact B1 PrizePool has qualified liquidity/EEV in one consistent USDM accounting unit, with no other obligations or protected components, and every ticket costs 1 USDM:

| Qualified B1 liquidity/EEV | V1 WCE admission inequality `E ≥ 500N` | All-maximum Reveal path under current pre-check `E ≥ 500N + 1` |
|---:|---:|---:|
| 4,000 USDM | 8 tickets | 7 tickets |
| 5,000 USDM | 10 tickets | 9 tickets |
| 6,000 USDM | 12 tickets | 11 tickets |

The two columns are deliberately separate. The first is only the `ProtectedCapital` / WCE admission inequality; the second also includes the extra face-reserve margin implied by the current B1 pre-Reveal affordability check. These are source-derived arithmetic frontiers, not a current live capacity reading and not a claim that a real Preprod ticket can be issued or revealed.

This is not an interpretation of the 4,000-USDM Genesis bootstrap. The bootstrap is a separate Treasury admission concept and is not automatically B1 PrizePool liquidity.

If 1,000 USDM already held in Treasury is physically moved to B1:

- B1's pool-only qualified EEV can increase by 1,000 USDM, provided the asset itself qualifies;
- Treasury custody decreases by the same exact quantity;
- in a future combined Treasury + PrizePool EEV perimeter, aggregate EEV does not increase;
- the same 1,000 USDM must not be counted at both source and destination.

The current Direct-USDM profile is Pool-specific and does not automatically include separate Treasury UTxOs. That is why a verified transfer can change the Pool-only measurement without creating new aggregate protocol wealth.

This is materially different from reclassifying an existing Treasury receipt from one internal category to another. Reclassification does not move an asset into B1 and cannot by itself increase B1 EEV.

## 7. Treasury receipt/category boundary

The category-ledger specification describes one logical protocol-controlled Treasury with internal accounting positions. Its categories are not separate independent Treasuries and category names alone do not prove custody or availability.

The current Issue #41 scope preserves these boundaries:

- the read-only receipt journal reconstructs TicketSale receipts and exact-asset custody;
- it is evidence, not an accounting authority;
- it does not assign Prize, Reserve, Maintenance or PRE-staking credits;
- the old 75/10/10/5 and legacy percentage mechanisms are historical/non-canonical and remain disabled;
- the current sale output does not prove that a receipt has been posted to a spendable Prize or Reserve sub-ledger;
- Treasury → B1 PrizePool remains a separate physical settlement with an authenticated source debit and destination credit requirement.

The latest recorded read-only observer evidence attached to Issue #41 (workflow run `42675553276`, branch commit `3a1665f6a9b7121f69bc1cfc8b3bd2bb9415fa40`) reports zero Treasury outputs, zero TicketSale receipts, zero category credits and zero spend authorizations for the exact configured deployment identity in that observation. Its full-history scan reached block 5,392,912. This is a time-bounded indexed observation, not a current live balance statement or proof of all Treasury history/finality. It does mean that this evidence does not support a claim that a Reserve category has already accumulated funds from live Preprod sales.

No automatic ticket-sale allocation to Reserve is adopted by this note.

## 8. Candidate accounting lifecycle — still requiring policy decisions

The following is a design checklist, not a new normative state machine.

| Stage | Required evidence before it can be treated as authoritative |
|---|---|
| Receipt | Exact sale transaction/output, network, canonical Treasury identity, exact asset unit/quantity and ticket mint linkage |
| Classification | PRE-RICH policy version and an explicit posting rule identifying which amount, in which asset, is assigned to Reserve |
| Protection/encumbrance | Named obligation or policy purpose, amount, scope, start/end/release condition and proof of non-overlap |
| Availability | Authenticated category state reconciled with physical custody and every existing reservation/commitment; a raw Treasury balance is insufficient |
| Transfer | Canonical source input, authorized category debit, exact destination output and atomic state/value reconciliation |
| Use/settlement | Verifiable event, permitted destination/beneficiary, single-use transition and exact source debit |
| Replenishment | A separately approved rule; no automatic percentage or discretionary operator action is inferred |
| Audit | Reconstructible transaction lineage, asset identity, category postings, commitments and EEV membership with duplicate exclusion |

At any future implementation stage, the accounting model should separate at least four layers:

1. **Physical custody:** what exact assets exist and where.
2. **Internal category classification:** which policy-defined accounting position owns each asset amount.
3. **Encumbrance/commitment:** which amount is already required or reserved for a named purpose.
4. **Execution authority:** whether a specific transition may move the asset and the exact evidence that makes it admissible.

A balance can be physically present but unclassified; classified but protected; protected but not available for another commitment; or authorized for a specific transfer. None of those states may be inferred from an observer total or a datum label alone.

No balance equation, availability formula, posting percentage, replenishment coefficient or trigger is fixed here. Those require the missing PRE-RICH posting policy, authenticated ledger representation and a complete EEV/ProtectedCapital disjointness proof.

## 9. Required coordination with Agent B

Agent B's existing statistical and cohort documents establish important technical boundaries:

- the statistical decision must bind one exact profile, Issue, complete pre-outcome cohort, B1 Pool snapshot, asset/valuation perimeter, model and lifetime risk budget;
- a cohort accumulator must be updated atomically with Issue, and the complete set must freeze before any included Beacon result becomes available;
- capital assigned to older/parallel epochs cannot be counted again;
- the current B1 `effectivePool` uses an Oracle-derived accounting value and is not equivalent to the narrow physical Direct-USDM EEV profile;
- the statistical proposal does not replace the current deterministic 500× V1 floor or establish a current admission path.

### Review questions for Agent B

1. Confirm or identify a source-level path that maps Treasury Reserve category balances into `v3ReserveProtection` or a B1 ReserveProtection field. The current inspected projection/legacy adapter appears not to provide one.
2. Confirm that `ReserveProtection` is treated as a required protected-capital term, not as a source/custody balance.
3. Cross-check the distinct roles of `ppUnresolvedReserve`, WCE, `effectivePool`, pending liabilities and Jackpot against the current B1/Kernel transition predicates.
4. Identify any case in which statistical capital `E*`, `C_other` or a cohort risk-budget amount could overlap a Treasury Reserve allocation and how a verifier would prove disjointness.
5. Identify any counterexample to the V1 conclusion that an exact 500× payout cap plus complete unresolved-ticket accounting already bounds all normal game payouts, independently of the PMF tail estimate.

No implementation or schema response is requested by this note.

## 10. Open decisions — not resolved by this document

The specification authority still needs to determine, in a separate decision process:

1. **Source:** which receipts or other authorized inflows may be classified into Treasury Reserve.
2. **Posting:** the exact amount/rule/asset basis of each Reserve credit. No portion of TicketSale revenue is assigned here.
3. **Meaning:** whether Treasury Reserve is held for future PrizePool liquidity, a distinct named obligation, or another explicitly scoped function. These uses must not be mixed.
4. **Availability:** how protected/allocated amounts are distinguished from any genuinely available amount, with a complete custody and liability reconciliation.
5. **Use trigger:** exact admissible event and transaction path for each future use.
6. **Replenishment:** whether a previously used amount is replenished, by which approved inflows and under what conditions.
7. **`ReserveProtection` mapping:** whether any Treasury category amount corresponds to that V3 protected-capital term, and the proof that the mapping is non-overlapping and representable in the deployed B1 profile.
8. **Statistical profile:** whether any future profile is S-OBSERVE, S-GATE, S-COHORT or S-HYBRID, and its model, horizon, risk ceiling, lifetime budget and capital allocation. The existing R1 proposals keep this OPEN.
9. **WCE / Reveal headroom proof:** reconcile the current `EEV >= ProtectedCapital` admission predicate with B1's pre-Release `payout <= effectivePool(datum)` check, including the final Pending ticket, mixed prices and arbitrary Reveal ordering.

Until those decisions and corresponding evidence exist, Treasury Reserve is a protected accounting-intent category without a demonstrated spendable balance/permission; `ReserveProtection` remains a distinct V3/kernel component without a demonstrated Treasury backing map.

## 11. Non-regression / explicit non-authorizations

- Do not change PRE-RICH V1 or the deterministic 500× WCE.
- Do not infer any Treasury allocation percentage, opening Reserve balance or automatic TicketSale posting.
- Do not restore the historical 75/10/10/5 distribution.
- Do not equate Treasury Reserve, `ReserveProtection`, `ppUnresolvedReserve`, WCE, `effectivePool`, Jackpot or the statistical assessment.
- Do not count Treasury and PrizePool custody twice in an aggregate EEV perimeter.
- Do not treat a category posting as a physical Treasury → PrizePool transfer.
- Do not use Oracle-valued `FundTreasury` growth as proof of Direct-USDM physical EEV or Treasury provenance.
- Do not change R7 deltas, the Economic Kernel, RiskProtectionBridge, PreRichEconomicAdmission, Economic Gate, B1 validator, V3, Reveal, Registry, datum/redeemer ABI, deployment or on-chain state under this document.
- Do not reinterpret the 4,000-USDM Genesis bootstrap as 4,000 USDM of B1 PrizePool tUSDM.
- Do not make a first-Issue, ticket-sale, reserve-spend or deployment claim from this research note.

**Overall status: TREASURY RESERVE CATEGORY INTENT EXISTS / AUTHENTICATED RESERVE LEDGER AND AVAILABLE BALANCE NOT PROVEN / RESERVE-TO-RESERVEPROTECTION MAPPING NOT PROVEN / TREASURY→B1 PHYSICAL SETTLEMENT NOT YET QUALIFIED / V1 500× UNCHANGED / B1 WCE-ADMISSION VS PRE-REVEAL HEADROOM MISMATCH CONFIRMED AT SOURCE LEVEL / FIX AND ADVERSARIAL CONFORMANCE OPEN.**
