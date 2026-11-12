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

This is a direct algebraic consequence of the current pre-state check and the frozen 500× payout cap. It assumes all prices, liabilities and Pool accounting values use the same B1 USDM sub-unit scale.

For an arbitrary mixed outcome path, define q as the aggregate face price of prior tickets already revealed, X as their aggregate crystallized payout, and x_i as the actual payout of the next ticket priced at p_i. The exact current precheck is:

```
x_i <= E_free - F + q - X
```

Equivalently, the precheck passes iff:

```
E_free >= F - q + X + x_i
```

The all-maximum sequence substitutes X = 500q and x_i = 500p_i, yielding the stricter condition derived above. If an earlier ticket pays less than 500×, X is smaller and more effectivePool remains for later Reveals. This is why the finding is specific to the all-maximum path and not a blanket denial of later Reveal.

#### Reveal / Claim / Expire interleavings

- **Claim:** B1 Claim decreases `ppTotalLiquidity` and `ppPendingLiabilities` by the same claimed amount. Therefore `E_free = ppTotalLiquidity - ppPendingLiabilities - ppLockedJackpot` is unchanged. Claim settles a known liability but does not create additional net Reveal headroom for the remaining Pending set.
- **Pending Expire:** removes that ticket's face price from F without paying a prize or reducing Pool liquidity. The remaining cohort WCE and the set of possible final ticket prices must be recomputed for the smaller Pending set. Expiry cannot increase the required all-maximum headroom; for the frozen ticket ladder (1–100 USDM), removing even a small ticket also frees its 500× exposure from the WCE requirement.
- **Revealed-ticket Expire:** under the current B1 path, releases the exact unclaimed crystallized payout liability while Pool liquidity is unchanged. This increases `E_free` by the released liability and can improve later Reveal headroom. It is not equivalent to Claim, which transfers assets and reduces both liquidity and liability.

These are state-accounting consequences of the inspected B1 transitions. They do not replace a complete transaction-level interleaving test across the Prize and B1 validators.

A loss, a smaller payout or an expiry is less demanding than the all-maximum path. A Claim does not replenish this net headroom.

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

Additional existing test artifacts were inspected:

- plutus/test/RevealSchemaFixtures.hs compiles and evaluates PrizeValidator (not B1PrizePool) in a synthetic Plutus V2 CEK context. It exercises a positive reveal, zero-payout loss, a tier-pair grid and a mutation that reduces effectivePool to zero. Its standard fixture has substantial headroom; it does not run a multi-ticket sequence at the exact 500× boundary or prove the B1 PrizePool validator's cumulative path.
- src/__tests__/immortal-cardano-reveal-emulator-b1.mjs constructs a real single-ticket Prize + B1 Reveal transaction for emulator evaluation. Its default Pool fixture has substantial surplus (1,000,000 liquidity units against small liabilities/reserve) and derives a winning payout, but it does not test a cohort of sequential 500× outcomes at the WCE boundary.
- src/__tests__/immortal-reveal-conformance.test.ts and the transaction-boundary fixtures check state mapping/deltas; they do not establish the missing full-cohort maximum-payout affordability condition.

Agent B independently reviewed this finding at shared-branch source baseline `6c1e4477877ee666fe0567166350636205be7ee3` and confirmed the §3.2 arithmetic against both B1 and PrizeValidator predicates. B found no counterexample to the 500× amount bound under the explicit assumptions that every normal payout is validator-computed and capped at 500×, and every Pending ticket is represented exactly once in the aggregate face exposure. B also confirmed that this amount bound is distinct from full pathwise Reveal affordability. See Agent B's review in [Issue #41 comment 6817708454](https://github.com/LiberoNuvola/Immortal-Protocol/issues/41#issuecomment-6817708454).

Following the review, Agent B added four pure-mirror characterization cases in commit `5b5285ed8d9328f0e911c17ec39755397ce184b8`:
- eight 1-USDM tickets at 4,000 USDM: first seven 500× prechecks pass; the eighth fails at 499 versus 500;
- 4,001 USDM supports all eight maximum payouts, with the final precheck exactly 500;
- tickets priced 1 and 100 USDM fail at exact WCE in either order; 100 USDM of extra headroom supports both orders;
- an earlier payout of 499 on a 1-USDM ticket can leave enough effectivePool for a later 500 payout at the exact aggregate WCE boundary.

The fourth case is important: this is not a blanket inability to Reveal at the WCE boundary. It is a restriction on the all-maximum sequence, and the outcome path affects whether the later precheck passes. These cases are committed in `src/__tests__/b1-invariants.test.ts` and documented in [Issue #41 comment 6817888729](https://github.com/LiberoNuvola/Immortal-Protocol/issues/41#issuecomment-6817888729). The suite is explicitly a **pure TypeScript mirror**, not Plutus execution.

At the latest run-state check during this update, the push-triggered lab `43177763646` was still `in_progress`; its pure invariant suite step had not yet started. No CI PASS is claimed. Even a successful pure suite will not replace the required dual-validator adversarial Plutus/Yaci evidence.

This is therefore not a live transaction failure or a claim that the implementation has already been tested against this adversarial sequence. The source predicates and arithmetic are clear; exact dual-validator Plutus/Yaci adversarial conformance remains to be run by an authorized test task.

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


## 12. Reveal headroom resolution candidates — technical assessment, not a decision

This section separates the confirmed source predicate from possible resolutions. It does not authorize a change to V1, WCE, either validator, datum/redeemer ABI, deployment or on-chain state.

### 12.1 Exact transition equation

For the consumed B1 Pool state, define:

- L = ppTotalLiquidity;
- C = ppPendingLiabilities;
- F = ppUnresolvedReserve, the face-price sum of all Pending tickets;
- J = ppLockedJackpot;
- p = pdPriceUsdm of the exact consumed Pending PrizeDatum;
- x = validator-computed payout for that ticket.

The current pre-Reveal predicate in both plutus/B1PrizePool.hs and plutus/PrizeValidator.hs is:

x <= L - C - F - J

The same transaction releases the exact ticket face reserve and crystallizes the payout:

- L' = L;
- C' = C + x;
- F' = F - p;
- J' = J.

Therefore the post-transition effective pool is:

effectivePool' = L - (C + x) - (F - p) - J

and a release-aware affordability condition is:

x <= (L - C - F - J) + p

which is exactly equivalent to:

effectivePool' >= 0.

The p term must come only from the consumed PrizeDatum. B1 independently checks that the TicketRevealed redeemer price equals the consumed PrizeDatum price and that the reserve decrement is exact; the PrizeValidator already has the same consumed PrizeDatum available. A caller-supplied amount or an unrelated datum/output price is not acceptable.

### 12.2 Why the release-aware condition preserves the V1 amount-solvency bound

For the current B1 legacy projection, the generic SafetyCapital, ReserveProtection and MandatoryFutureCosts fields are zero. The B1 pre-state solvency invariant therefore includes:

L >= C + 500 F + J

The PrizeValidator derives x from the canonical game rules, whose normal payout is capped at:

0 <= x <= 500 p

and the consumed ticket is one member of the Pending set, so 0 < p <= F.

After Reveal, the protected-capital requirement is:

C + x + 500(F - p) + J

Because x <= 500p, this is no greater than C + 500F + J, already covered by the pre-state solvency invariant. The existing B1 validator also explicitly checks solvencyInvariant on the continuing datum.

The release-aware affordability predicate is likewise implied by the same pre-state bound:

(L - C - F - J) + p >= 499 F + p >= 500 p >= x

where the middle inequality follows from F >= p.

So, under the inspected V1 assumptions, changing the two duplicated pre-Reveal checks from x <= effectivePool_pre to x <= effectivePool_pre + p does not increase the aggregate normal payout bound, weaken the 500× WCE invariant, or allow an under-solvent Pool to enter Reveal. It removes the extra one-ticket face-reserve obstruction created by checking affordability before accounting for the exact reserve release that occurs in that same atomic transaction.

This is an algebraic/source-level argument, not an execution proof. It must be validated against the compiled canonical Plutus V2 scripts and the same ledger transaction context before adoption.

### 12.3 Candidate comparison

| Candidate | What it changes | Assessment |
|---|---|---|
| A. Release-aware Reveal affordability | In both B1 and PrizeValidator, check the exact payout against pre-state effectivePool plus the consumed ticket's exact face reserve; retain pre/post solvencyInvariant, exact reserve/liability deltas and 500× payout cap. | Preferred candidate for the next technical proof. It aligns the affordability predicate with the atomic transition already specified in both validators. No new datum field, capital category, WCE coefficient or Treasury assumption is needed. It does change the Reveal precondition and validator scripts, so it remains unselected while the current Reveal semantics are frozen. |
| B. Add admission headroom | Keep the current pre-Reveal check and require new Pending cohorts to hold WCE plus a further headroom amount, ideally the maximum price in the exact Pending set. | Preserves the existing Reveal predicate, but B1 datum stores only aggregate face reserve and count—not the maximum Pending price. A fixed global 100-USDM margin could be conservative but would change TicketIssued admission/capital utilization and require a transition/migration analysis for already-Pending tickets. It does not repair an already-admitted exact-boundary cohort. |
| C. Treasury Reserve / ReserveProtection funding | Introduce a separately authenticated capital source or protected component. | Not presently available: no Treasury Reserve → v3ReserveProtection or B1 datum mapping is implemented. It would require a new custody, category, non-overlap and representation proof. It must not be used as a relabeling of ppUnresolvedReserve or as an accounting-only substitute for a physical Pool transfer. |

Candidate A is the smallest conceptual correction because it does not invent new reserve capital or change the 500× maximum. It is not an approved policy choice and is not an instruction to implement while the freeze remains in force.

### 12.4 Required dual-validator ledger matrix before any decision

The next test must spend the exact Prize input and exact B1 PrizePool input in one transaction, evaluating the canonical Haskell Plutus V2 PrizeValidator and B1PrizePool validator against the same TxInfo. Pure TypeScript mirrors and isolated Aiken/V3 stubs do not satisfy this requirement.

1. Homogeneous exact boundary: 8 Pending tickets at 1 USDM, L - C - J = 4,000 USDM, all eight payout at 500×. The current precheck should reproduce the seventh-pass/eighth-fail baseline; a candidate A build should accept all eight sequential Reveals while preserving pre/post solvency.
2. Mixed prices and order: one 1-USDM and one 100-USDM Pending ticket at exact WCE, tested in both Reveal orders. Both candidate orders must complete; a below-cap first payout must retain the previously characterized behavior.
3. Negative controls: pre-state WCE insolvency; malformed or mismatched consumed-ticket price; inexact reserve decrement; inexact liability increment; wrong continuing Prize/Pool datum; payout above 500×; duplicate/missing Pool or Prize inputs/outputs. Every invalid twin must reject.
4. Claim interleavings: Reveal then Claim, and Claim between subsequent Reveals. Confirm that Pool liquidity and crystallized liability decline by the same paid amount, that effectivePool does not gain artificial headroom from Claim, and that the 500× invariant remains true.
5. Pending Expire interleavings: expire one Pending ticket before/between Reveals; prove exact face-reserve/count release, reduced remaining WCE and no new crystallized liability.
6. Revealed Expire interleavings: expire an unclaimed Revealed ticket before/between further Reveals; prove exact liability release and the resulting effective-pool increase.
7. Execution integrity: use the same authenticated asset/Oracle perimeter as the selected B1 fixture; assert exact Value continuity and datum accounting, collect both redeemer outcomes, execution units, transaction CBOR size and reproducible evidence packet.

No item in this matrix has been established by the current four pure-mirror characterization tests.

### 12.5 CI evidence update — run #43177763646

The push-triggered workflow completed with job-level devnet-integration: success on commit 5b5285ed8d9328f0e911c17ec39755397ce184b8.

The repository test log records 192 tests passed, 0 failed. It includes the four new checks under the suite explicitly named “B1 Reveal headroom characterization (pure mirror; not Plutus execution)”:
- exact 4,000-USDM boundary: seven maximum reveals pass and the eighth precheck fails;
- 4,001 USDM supports all eight;
- mixed 1/100-USDM prices need the maximum ticket price as order-independent headroom;
- the all-maximum qualification (a prior 499 payout can leave capacity for a later 500 payout).

This verifies the arithmetic characterization in the repository test runner. It does not execute either canonical Reveal validator on the ledger, and it does not implement Candidate A.

Sub-check qualification: the generated JEV verification registry records HASKELL_PENDING_EXPIRE_OUTCOME, HASKELL_REVEALED_LOSS_EXPIRE_OUTCOME and HASKELL_REVEALED_WIN_EXPIRE_OUTCOME as failure, even though the diagnostic workflow steps completed and the overall job succeeded. Those Haskell V2 Expire outcomes must not be represented as PASS; their cause needs a separate inspection of the linked step evidence. The Aiken/V3 and pure-mirror results do not override those classifications.

Run: https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43177763646  
Agent B characterization commit: https://github.com/LiberoNuvola/Immortal-Protocol/commit/5b5285ed8d9328f0e911c17ec39755397ce184b8

### 12.6 Current disposition

- Source-level mismatch: CONFIRMED.
- Four-case pure mirror characterization: PASS (192/192 repository pure suite).
- Canonical dual-validator maximum-Reveal ledger sequence: NOT RUN / NOT PROVEN.
- Candidate A: TECHNICALLY PREFERRED FOR THE NEXT PROOF / NOT APPROVED / NOT IMPLEMENTED.
- Candidate B: AVAILABLE AS A MORE CONSERVATIVE ADMISSION DESIGN / NOT SPECIFIED.
- Treasury Reserve or ReserveProtection as a fix: NOT AVAILABLE ON CURRENT REPRESENTATION.
- V1 500×, WCE amount bound, datum/redeemer ABI, V3, current Reveal semantics, deployment and ledger state: UNCHANGED.

This section is a non-normative engineering assessment only.


## 13. B1 Reveal CEK characterization — current evidence boundary

Agent B added a dedicated Haskell test suite, `plutus/test/B1RevealHeadroomTest.hs`, configured as Cabal target `b1-reveal-headroom-tests` and invoked by the IMMORTAL Cardano Integration Lab before Yaci startup.

### What the new suite actually executes

The fixture applies the real `B1PrizePool.compiledValidatorFactory` and passes a synthetic, typed Plutus V2 `ScriptContext` to `PlutusTx.Test.evaluateCompiledCode`. It executes the canonical B1 `TicketRevealed` branch through the Plutus CEK evaluator; it is not a TypeScript mirror.

It covers:
- 8 tickets at 1 USDM each and 4,000 USDM liquidity: seven 500× Reveal checks accepted, eighth rejected;
- 4,001 USDM: all eight accepted;
- mixed 1/100-USDM prices in both orders at exact WCE, with the final maximum Reveal rejected;
- the largest-ticket-price headroom for both mixed orders;
- a zero-payout loss before a later maximum payout at exact WCE.

The amounts are in USDM sub-units (100 = 1 USDM). These fixtures characterize the existing predicate; they do not implement or evaluate Candidate A.

### CI attempt and correction

The first workflow attempt, [IMMORTAL Cardano Integration Lab #43182563437](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43182563437), ended with job conclusion `failure` at step `Execute B1 Reveal headroom through canonical Plutus V2 CEK`.

The diagnostic is a Haskell compile error, not a validator execution result: GHC reported `GHC-62330 Illegal underscores in integer literals` because the test file at that commit did not enable `NumericUnderscores`. The earlier source compilation and universal economic conformance steps passed; the CEK executable itself did not compile, so no CEK case ran. The dependent Aiken/Claim gate also failed because the job stopped before the Aiken setup sequence; the remaining Yaci and P2.8 steps were skipped.

Agent B corrected the test-only source by adding the missing language pragma in commit `7b2bc56da911c0af66517c71a39e5f877679b14f`:
https://github.com/LiberoNuvola/Immortal-Protocol/commit/7b2bc56da911c0af66517c71a39e5f877679b14f

The current branch source contains that pragma. I have not verified a successful post-fix CI run yet; therefore the CEK suite remains **implemented but not yet CI-validated**. The compile failure must not be reported as a semantic B1 validator failure or as a passing CEK test.

### Remaining gap to the requested dual-validator proof

The new suite evaluates **B1PrizePool only**. Although its synthetic context contains a matching Prize input and continuing Prize output, it does not execute `PrizeValidator` against the same `TxInfo`. Therefore it does not prove the atomic dual-validator transaction.

The next conformance step remains:
1. construct one shared typed `TxInfo` with exact Prize and B1 Pool inputs and both continuing outputs;
2. evaluate the current canonical PrizeValidator V2 and B1PrizePool V2 CEK programs independently against their corresponding spending purposes but that same transaction context;
3. assert both accept/reject outcomes agree for the homogeneous and mixed-price cases;
4. include payout derivation, exact ticket price binding, reserve/liability deltas, invalid twins, and Claim/Pending-Expire/Revealed-Expire interleavings;
5. only after synthetic dual-CEK parity, move to native ledger/Yaci or Cardano-ledger evaluation with the exact transaction and context.

This is still CEK-level synthetic evidence until step 5; it is not Preprod or native-ledger evidence.

### Updated disposition

- Source-level WCE/pre-Reveal headroom mismatch: **CONFIRMED**.
- TypeScript pure-mirror characterization: **PASS (192/192 in run #43177763646)**.
- B1 canonical Plutus V2 CEK suite: **AUTHORED; FIRST CI ATTEMPT COMPILE-BLOCKED; TEST-ONLY PRAGMA FIX COMMITTED; POST-FIX PASS NOT YET VERIFIED**.
- PrizeValidator + B1PrizePool evaluated against one shared transaction context: **NOT YET TESTED**.
- Native Yaci/Cardano-ledger dual-validator sequence: **NOT RUN / NOT PROVEN**.
- Candidate A: **TECHNICALLY PREFERRED FOR THE NEXT PROOF / NOT APPROVED / NOT IMPLEMENTED**.
- V1 500×, WCE amount bound, datum/redeemer ABI, V3, canonical Reveal semantics, deployment and on-chain state: **UNCHANGED**.


## 14. Shared-TxInfo dual-validator CEK characterization — authored, not yet verified

After confirming that the existing PrizeValidator CEK fixture already constructs canonical Reveal inputs (Beacon, player commitment, ticket commitment, symbols, row tiers and payout), Agent A extended the dedicated B1 headroom test suite with a dual-validator characterization.

**Test-only commit:** `42c626d4b0db92716d3db7bedb6b896874995952`  
**Follow-up type-inference cleanup:** `4b321c63702bdd34ad5f369a4ad3187ec3a470d8`  
**File:** `plutus/test/B1RevealHeadroomTest.hs`

### Context construction and validator execution

For each Reveal step, the test constructs one typed Plutus V2 `TxInfo` containing:
- one exact Prize script input and its continuing Prize output;
- one exact B1 Pool script input and its continuing Pool output;
- the matching ticket NFT, Pool authority NFT and typed datums.

It then creates two `ScriptContext` values that reuse that same `TxInfo` object, changing only the spending purpose:
- `Spending prizeRef`: evaluates `PrizeValidator.compiledValidatorFactory`;
- `Spending poolRef`: evaluates `B1PrizePool.compiledValidatorFactory`.

The PrizeDatum fields and Reveal payout are built with the repository's canonical Beacon and GameRules functions and the current `defaultPrizeTable`; the fixture includes actual canonical tier-5/500× outcomes. This is not a stubbed payout injected into the datum.

### Characterization matrix added

- 8 × 1-USDM tickets, exact 4,000-USDM WCE: both canonical CEK evaluations accept the first seven maximum Reveals and reject the eighth under the current pre-Reveal predicate.
- 8 × 1-USDM, 4,001 USDM liquidity: both accept all eight maximum Reveals.
- 1/100-USDM mixed ticket prices at exact WCE, both orders: both validators accept the first maximum Reveal and reject the final one.
- Mixed prices with the largest ticket price of headroom: both validators accept both Reveals in either order.
- Canonical zero-payout LOSS followed by a 500× winning Reveal at exact aggregate WCE: both validators accept both transitions.

The sequence builds a new synthetic transaction context for each Reveal transition, updating the Pool datum after each prior step. It does not put multiple Prize spends into one transaction; each actual Reveal transition still has one Prize UTxO and one Pool UTxO consumed.

### Evidence boundary

This is a **shared-TxInfo dual-validator synthetic CEK test**, stronger than testing either validator alone and stronger than a TypeScript mirror. It is not a balanced/serialized Cardano transaction, not a native Cardano-ledger validation, not Yaci, not Preprod, and supplies no native-ledger ExUnits or transaction CBOR evidence.

The new suite has been pushed to the shared branch, but I have not yet verified a successful CI execution of commit `4b321c63702bdd34ad5f369a4ad3187ec3a470d8`. Therefore its status is **AUTHORED / CI RESULT NOT YET VERIFIED**, not PASS.

Claim, Pending Expire and Revealed Expire interleavings are also not yet covered by this shared-TxInfo dual-validator test. They remain separate follow-up cases.

### Updated disposition

- TypeScript pure-mirror characterization: **PASS (192/192 in run #43177763646)**.
- B1-only canonical Plutus V2 CEK suite: **AUTHORED; first CI attempt compile-blocked; missing NumericUnderscores pragma corrected by Agent B in 7b2bc56; successful post-fix run not yet verified**.
- PrizeValidator + B1PrizePool shared-TxInfo CEK sequence: **AUTHORED in 42c626d / 4b321c; CI result not yet verified**.
- Native Yaci/Cardano-ledger dual-validator sequence: **NOT RUN / NOT PROVEN**.
- Claim / Pending Expire / Revealed Expire dual-validator interleavings: **NOT YET TESTED**.
- Candidate A release-aware affordability: **NOT APPROVED / NOT IMPLEMENTED**.
- V1 500×, WCE, datum/redeemer ABI, V3, current Reveal semantics, deployment and on-chain state: **UNCHANGED**.
