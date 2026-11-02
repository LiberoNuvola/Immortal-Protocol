# PRE-RICH profile mapping for R7 PA1–PA7 — ProtectedCapital

**Date:** 2026-11-02  
**Branch audited:** `work/immortal-green-closure`  
**Baseline HEAD before this document:** `7741f833fb0d7689d6c2458466cdea9a4ffba8f0`  
**Classification:** PROFILE CONFORMANCE AUDIT / EVIDENCE MAPPING — NOT CERTIFIED  
**Scope:** Instantiate the canonical R7 two-sided accounting partition for PRE-RICH and assess PA1–PA7 against the current repository implementation.  
**Non-scope:** No changes to economic constants, V3, Reveal, validators, deployment workflows, or on-chain state.

---

## 1. Executive verdict

The PRE-RICH profile can now be mapped to concrete candidate asset and commitment classes. That is not the same as discharging R7's profile certification.

| Artifact | Current result | Why |
|---|---|---|
| **PA1 — concrete partition instantiation** | **PARTIAL** | The main asset/obligation classes are identified. L2 and several V3 protection fields still need typed profile semantics. |
| **PA2 — exhaustive coverage** | **OPEN / NOT PROVEN** | The exact EEV profile is narrow, but a complete inventory of every protocol-controlled asset and every protocol-borne obligation has not been established. |
| **PA3 — disjointness** | **UNPROVEN** | Some separations are explicit; no evidence proves the four independently stored protection fields are non-overlapping. |
| **PA4 — deterministic valuation** | **PARTIAL** | Direct-USDM EEV and ticket worst-case exposure have deterministic derivations. Safety/reserve/future-cost valuations are not fully instantiated. |
| **PA5 — permitted transition deltas** | **OPEN / PARTIAL EVIDENCE** | Issue/Reveal/Claim/Expire lifecycle deltas are specified and tested locally; funding, Jackpot/CAR, Treasury allocation and the full external asset-observation path are not covered by one closed transition inventory. |
| **PA6 — L6 empty in executable states** | **PARTIAL / NOT DISCHARGED** | Unknown/duplicate/noncanonical classes fail closed, but this does not prove that every real commitment is present in the observed inputs. |
| **PA7 — adversarial omitted-commitment review** | **PARTIAL / OPEN** | Known attacks are enumerated and some are rejected by current code; completeness and overlap attacks remain live. |

**Conclusion:** PA1's profile map is recoverable; PA1–PA7 are not jointly certified. The most material remaining proof is not another arithmetic check. It is a complete, source-authorized inventory of the asset perimeter and commitment population, coupled with disjoint component provenance.

## 2. Governing accounting model

R7 defines two separate partitions. PRE-RICH must instantiate both:

```text
EEV = value(A1) + value_net(A2)

ProtectedCapital =
    value(L1)
  + value(L2)
  + value_worstcase_Ω(L3)

RawSurplus = max(0, EEV - ProtectedCapital)
```

The signed difference `C = EEV - ProtectedCapital` must remain visible to the economic gate. `RawSurplus` is a derived non-negative residual, not a partition cell.

The current V3 kernel additionally stores the following implementation decomposition:

```text
ProtectedCapital =
    CrystallizedLiabilities
  + WorstCaseExposure
  + SafetyCapital
  + ReserveProtection
  + LockedJackpot
  + MandatoryFutureCosts
```

This six-term implementation sum is not itself the R7 partition proof. Every term must be assigned to exactly one canonical commitment class (L1/L2/L3), or the represented state must fail closed until that classification exists.

## 3. PA1 — PRE-RICH candidate partition

### 3.1 Asset side: A1–A5

| Cell | R7 meaning | PRE-RICH profile instantiation | Admission treatment |
|---|---|---|---|
| **A1** | Verified liquid executable value | Physical direct tUSDM held in the exact live B1 PrizePool UTxO, under `PRE-RICH-EEV-USDM-DIRECT-V1` | Candidate EEV asset. Must bind exact asset unit, Pool singleton, address, UTxO reference, physical quantity, and freshness to the same observation. |
| **A2** | Verified value subject to a declared conversion/haircut, valued net | Empty in the current direct-USDM-only profile. No ADA/PRE/other asset is admitted through an unstated conversion or liquidation route. | Zero contribution unless a separately qualified, versioned conversion profile is approved. |
| **A3** | Value present but unverified, or stale | Any present quantity outside the approved direct-tUSDM predicate; stale/ambiguous Pool UTxOs; unavailable/equivocating source observations; unsupported assets. | Excluded from EEV; stale/unverified source fails closed. |
| **A4** | Value contingent on an unresolved event | No contingent asset value is currently admitted by the direct-USDM profile. If a future asset is collectible only after an unresolved event, it must be declared here and linked to the relevant L3 contingency. | No contribution to EEV before realization. |
| **A5** | Non-economic/informational holdings | Pool/Oracle/control singleton markers, policy/NFT identity markers, metadata, script identity, ticket NFT identity and historical/control facts, to the extent they carry no independently qualified economic value. | Not valued as EEV merely because they are present in a UTxO. Ticket rights are represented on the commitment side, not by pricing their NFT marker as protocol assets. |

**Important perimeter qualification:** A1 is deliberately narrow. The direct-USDM producer measures physical tUSDM in one exact B1 Pool UTxO; it does not establish that every other protocol-controlled UTxO is included in EEV. Treasury balances, ADA held for min-UTxO, PRE, other native assets, and any separate service/relayer balances remain outside this profile unless a new authoritative valuation path qualifies them. The profile must not describe this narrow EEV as a full multi-asset treasury valuation.

The historical approval run for this profile is evidence for its October 21 candidate only. A fresh source observation is still required before reuse at Issue admission.

### 3.2 Commitment side: L1–L6

| Cell | R7 meaning | PRE-RICH profile instantiation | Current representation / disposition |
|---|---|---|---|
| **L1** | Pending accepted obligations, due but not settled | Revealed winning-ticket payouts that are crystallized and remain unclaimed | `v3CrystallizedLiabilities`; B1 `ppPendingLiabilities` is described as the sum of crystallized, unclaimed winning payouts. Completeness and exact ticket-to-aggregate reconciliation remain evidence obligations. |
| **L2** | CAR / value conditionally committed to a future allocation | Candidate PRE-RICH instantiation: a Jackpot amount only after an authorized funding transition has made it binding and locked. Any other conditional future allocation must be represented here only under an explicit profile rule. | `jsLockedAmount(v3Jackpot)`; B1 `ppLockedJackpot`. This is a candidate mapping, not proof that all CAR/conditional allocations are represented. |
| **L3** | Unresolved exposure, valued at worst case over `Ω` | Every unresolved ticket in Pending/BeaconReady status, valued at PRE-RICH's maximum normal payout bound | Derived `WorstCaseExposure = 500 × Σ(classPrice × unresolvedCount)`. `v3UnresolvedReserve` is the price-based accounting representation used to derive/reconcile the unresolved population; it is **not** a second additive L3 or ProtectedCapital term. |
| **L4** | Settled obligations | Payouts already paid/claimed | Removed from ProtectedCapital after exact settlement. Historical proof/record may remain, but the settled amount is not a pending liability. |
| **L5** | Expired rights/liabilities | Ticket rights that have passed the canonical expiry transition and can no longer create a claim or payout obligation | Removed from ProtectedCapital after final expiry. A surviving NFT/record is not economic claimability. |
| **L6** | Unrepresented exposure; not executable | Any material obligation or protected amount not classified in L1/L2/L3, including an unknown commitment source, omitted ticket population, unclassified future cost, or unrepresented conditional allocation | No positive value is permitted in an executable state. If detected or not safely classifiable, the dependent action must reject/fail closed. |

### 3.3 V3 field mapping — do not force a one-to-one mapping where semantics are not typed

| Current V3 / application quantity | R7 classification | Finding |
|---|---|---|
| `v3CrystallizedLiabilities` | L1, for accepted unpaid winning payouts | Semantically aligned; authoritative completeness must be proved. |
| `WorstCaseExposure(v3Classes)` | L3 | Deterministic derivation exists for the PRE-RICH 500× profile bound. The complete unresolved-ticket population remains a source/completeness obligation. |
| `v3UnresolvedReserve` | **Not a separate ProtectedCapital cell** | It is `Σ(price × unresolved count)`, an accounting base/reconciliation quantity. The current canon prohibits adding it again alongside WorstCaseExposure. |
| `jsLockedAmount(v3Jackpot)` | Candidate L2 | The PRE-RICH Jackpot policy says that once funded and locked it cannot be reduced/dissolved before the winning transition. Prove the locked amount is a binding conditional allocation and does not overlap with L1, L3, or another reserve. |
| `v3SafetyCapital` | Not yet assigned to L1/L2/L3 | Its protection perimeter, origin, horizon and disjointness are not defined sufficiently to map the aggregate field. Do not assume it is CAR/L2 merely from its name. |
| `v3ReserveProtection` | Not yet assigned to L1/L2/L3 | It may not be assumed equal to unresolved reserve, worst-case exposure, a statistical reserve, or CAR. A typed source/perimeter rule is absent. |
| `v3MandatoryFutureCosts` | Must be decomposed into L1/L2/L3 according to the actual commitment | A committed, accepted cost may be L1; a genuinely conditional allocation may be L2; a bounded unresolved cost exposure may be L3. The current aggregate field does not identify which applies. |
| `EffectivePool` | Outside the R7 partition | Immediate-spendability/liquidity view, not another asset or ProtectedCapital addend. |
| `RawSurplus` | Outside the partition | Residual derived from EEV and ProtectedCapital; never an asset or liability cell. |
| `HighestClassEverActivated`, Jackpot cycle/status, historical facts | Separate history/control ledger `ℌ` or application metadata | Not monetary assets or commitments by themselves. |

This table is the PA1 candidate map. The three fields `SafetyCapital`, `ReserveProtection`, and `MandatoryFutureCosts` cannot be assigned to a canonical cell solely by field name. Their amounts must be typed by their actual legal/economic effect and time horizon. Until then, PA1 is partial and PA2/PA3 cannot pass.

## 4. PA2 — Exhaustiveness argument

The minimum PRE-RICH content inventory is:

**Asset content to classify:** direct tUSDM in the qualified B1 Pool UTxO; any additional tUSDM or other assets in separate protocol-controlled UTxOs; ADA/MinUTxO; PRE and other native assets; Pool/Oracle/B2/control/ticket NFTs and singleton markers; metadata and scripts; and any future contingent receipt/recovery claim.

**Commitment content to classify:** revealed unpaid prizes; unresolved ticket payout exposure; funded/locked Jackpot; other conditional allocations; protocol-borne SALE/REVEAL/CLAIM/EXPIRE/treasury/Beacon/Oracle/relayer costs; other accepted refunds or payment promises; and any future outflow or guarantee the profile makes binding.

The following controls already exist and provide useful partial coverage:

- The TypeScript Cardano projection requires exactly eight canonical class states, unique class IDs 0–7, canonical ticket prices, unique unresolved ticket IDs, and equality between ticket-derived reserve/count and the B1 Pool aggregates.
- The V3 on-chain carrier validates the eight classes in canonical order, exact class exposure, non-negative aggregates, and equality of aggregate unresolved reserve/count to the class sums.
- The Haskell PRE-RICH projection rejects unknown/duplicate classes, invalid values, and reserve/count mismatches.
- The EEV profile explicitly excludes unsupported assets and unstated liquidation routes.

These controls do not enumerate every protocol-controlled UTxO or every protocol-borne obligation. In particular, the current EEV profile is a single-Pool direct-USDM profile, while the cost model, Jackpot/CAR and external-service obligations are not represented by one exhaustive, source-authorized liability registry.

**PA2 result: OPEN / NOT PROVEN.** The canonical candidate classes are identified, but the proof that every asset and commitment PRE-RICH can create appears exactly once in the inventory is missing.

## 5. PA3 — Disjointness and contingency-link argument

### Existing distinctions that are supported

1. `UnresolvedReserve = Σ(price × unresolved count)` and `WorstCaseExposure = 500 × Σ(price × unresolved count)` are different quantities. The first is the accounting representation; the second is the profile-specific protection requirement. Adding both independently to ProtectedCapital would count the same unresolved-ticket population twice.
2. Ticket lifecycle states must be mutually exclusive: Pending/BeaconReady maps to L3; a winning Reveal moves the obligation to L1; Claim moves it to L4; a losing Reveal or final Expire moves the right to L5.
3. `EffectivePool` is not another ProtectedCapital addend. `RawSurplus` is not a partition cell.
4. The Jackpot is intended to be protected separately once funded/locked; the B1 datum comment describes its amount as separately reserved and not double-counted with liabilities. That comment is not, by itself, a transition-level disjointness proof.

### Missing disjointness witnesses

- No category/perimeter tag proves that `SafetyCapital`, `ReserveProtection`, `MandatoryFutureCosts`, and `LockedJackpot` represent mutually exclusive sets of commitments.
- No full ticket-to-L1/L3 population witness proves that a ticket cannot be simultaneously crystallized and unresolved, or omitted from both.
- No complete mapping exists from each protocol-borne `Fs/Fr/Fc` cost to its payer, beneficiary/cohort, time horizon and current `MandatoryFutureCosts` amount. The same future payment could otherwise be included in both the existing ProtectedCapital and the proposed class cost surface `X(P)`.
- No complete A4↔L3 evidence exists. The current EEV profile admits no contingent asset value; any later contingent recovery/receipt must be explicitly paired with the relevant L3 event and must not be counted as immediately executable A1.

**PA3 result: UNPROVEN.** The reserve/exposure distinction is settled; the independent component sets are not demonstrated disjoint.

## 6. PA4 — Valuation functions and units

| Cell / component | Required valuation | Current evidence |
|---|---|---|
| A1 | Exact direct tUSDM atomic quantity in the exact live B1 Pool UTxO, converted to IMMORTAL USDM subunits by the versioned conservative conversion rule | Direct-USDM source-set and EV1–EV7 qualification machinery exists; historical approval is not a fresh observation. |
| A2 | Declared deterministic conversion and conservative net value | Empty in the current profile. |
| A3/A4/A5 | Zero contribution to EEV unless and until the relevant verification/realization rule is satisfied | Explicit exclusions and fail-closed policy exist; full asset census remains open. |
| L1 | Exact pending, accepted, unpaid crystallized payout sum in the canonical USDM/reference unit | B1 `ppPendingLiabilities` and V3 field exist; source completeness and exact claim population still require proof. |
| L2 | Exact amount actually funded and conditionally committed, with the PRE-RICH Jackpot funding/lock rule and no-overlap evidence | `ppLockedJackpot`/`jsLockedAmount` exists; full lifecycle/transition evidence is incomplete. |
| L3 | `500 × Σ(class price × unresolved count)`, using the complete canonical unresolved set and the PRE-RICH profile payout ceiling | Deterministic kernel/projection derivation exists. It is not a statistical expectation. |
| L4/L5 | Zero in current ProtectedCapital after exact settlement/expiry; history is retained separately | Lifecycle semantics and transaction predicates exist; full cross-layer equivalence is not closed. |
| L6 | No valuation: any non-zero or unknown unrepresented commitment blocks the action | Fail-closed intent exists; exhaustive detection of every omitted category is not proven. |
| SafetyCapital / ReserveProtection / MandatoryFutureCosts | A deterministic source and valuation function for each typed obligation, using the same profile, unit and horizon | **Not instantiated sufficiently** to certify PA4. |

For the direct-USDM profile, the deployed conversion rule is versioned and uses FLOOR conversion from physical token atomic units to IMMORTAL USDM subunits. A successful historical workflow run observed 1,000,000,000 atomic tUSDM units and derived 100,000 USDM subunits. That historical value is not a current valuation; the exact UTxO must be revalidated before admission.

**PA4 result: PARTIAL.** Direct EEV, L1 representation, and L3 formula are defined; complete profile valuation for all commitment categories is not.

## 7. PA5 — Transition-delta closure

The R7 permitted movements are `represent`, `settle`, `expire`, `resolve`, `verify`, `stale`, and `realise`. The current PRE-RICH transition mapping is:

| PRE-RICH operation | R7 delta mapping | Current evidence / gap |
|---|---|---|
| `FundTreasury` | A1 increases by the actual verified asset value (or A2 only under a declared conversion); no liability is created by the deposit itself | B1 checks the continuing Pool value against recomputed liquidity and requires an increase. The direct-USDM profile still needs the exact observed source bound to the same state/decision. |
| `TicketIssued(P)` | `represent: ∅ → L3`; L3 increases by `500P`; unresolved reserve/count increase by `P/1` as accounting inputs | V3 Issue transition increments class unresolved exposure and reserve/count. Important: the B1 TicketIssued branch keeps `ppTotalLiquidity` unchanged. Do **not** assume ticket issue itself increases the B1 Pool's EEV; the actual sale settlement location/path must be separately identified. |
| Winning `TicketRevealed(P,y)` | `resolve: L3 → L1`; L3 decreases by `500P`, L1 increases by actual crystallized payout `y`; delta in ProtectedCapital is `y − 500P ≤ 0` | V3 transition and local protected-capital delta tests cover the arithmetic. End-to-end obligation completeness and EEV perimeter equivalence remain open. |
| Losing `TicketRevealed(P,0)` | `resolve: L3 → L5`; unresolved exposure is released and no new L1 liability is created | Lifecycle transition/validator evidence exists; full profile/adapter equivalence remains open. |
| `TicketClaimed(y)` | `settle: L1 → L4`; EEV must decrease by the exact settled value, while ProtectedCapital decreases by `y` | B1 claim path validates payout/continuing datum and the V3 transition decreases liabilities. The exact same-snapshot asset delta needs replayable evidence. |
| `TicketExpired(P)` | `expire: L3 → L5`; L3 decreases by `500P`, no claim/liability is created | V3 and B1 expiry predicates exist; end-to-end parity remains open. |
| Jackpot/CAR funding | A previously available residual becomes L2 only after a valid funding transition; it cannot consume already protected L1/L3 | PRE-RICH policy states `NewJackpot = FundingNeed(S)` and `NewJackpot ≤ RawSurplus`. No corresponding constructor exists in the current four-action V3 transition type or current B1 PrizePool action set. |
| Jackpot payout/reset or other conditional allocation | L2 → L4 on settlement, or L2 → L5 only under an authorized final release; asset-side EEV changes consistently | Full lifecycle/delta implementation and profile evidence are not established by the current ticket action set. |
| Treasury/AWRA distribution | An immediate payment settles its corresponding commitment and reduces assets; a new conditional allocation first creates L2 | No complete action inventory/delta proof is present in the current R7 profile mapping. |
| Source verification / staleness | `verify: A3 → A1/A2`; `stale: A1/A2 → A3`; `realise: A4 → A1/A2/∅` paired with resolution of L3 | EEV freshness/failure checks exist at the admission boundary; a full state-transition mapping for all asset-source changes remains open. |

The Haskell `V3Action` type currently contains only Issue, Reveal, Claim and Expire. The B1 Pool also supports FundTreasury and the four ticket actions. `ProtectedCapitalConformance` tests local lifecycle deltas and preserves SafetyCapital/ReserveProtection/MandatoryFutureCosts/Jackpot state across the ticket action set. It does not prove every possible PRE-RICH economic operation maps to the R7 delta set.

**PA5 result: OPEN / PARTIAL EVIDENCE.** The ticket lifecycle has useful delta evidence; the complete profile operation inventory, particularly Jackpot/CAR and allocation operations, is not closed.

## 8. PA6 — L6 emptiness / executability evidence

### Positive fail-closed controls at the audited branch

- The V3 carrier validates exactly eight classes in canonical order 0–7; rejects unknown, duplicate, negative, or malformed class state; verifies class exposure equals unresolved count × canonical price; and reconciles aggregate reserve/count to the class sums.
- The TypeScript Cardano projection requires eight canonical class records, unique IDs, canonical ticket prices, unique unresolved ticket IDs, and exact reserve/count reconciliation against the B1 Pool.
- The Haskell PRE-RICH projection rejects unknown/duplicate classes, negative amounts, exposure mismatches, and aggregate reserve/count mismatches.
- The current chain-neutral `EconomicKernel.classExposure` raises an error for an unknown class rather than silently assigning zero exposure.
- The legacy V3→B1 adapter rejects non-zero SafetyCapital, ReserveProtection, MandatoryFutureCosts and locked Jackpot because the legacy B1 datum cannot represent them losslessly.

These are meaningful rejection controls. The old Notion B4 audit's unknown-class-to-zero finding must be treated as historical for this branch: current audited code rejects unknown profile classes.

### What these controls do not prove

They do not prove that the observer has obtained **every** unresolved ticket/claim/commitment from the canonical ledger, that every service or cost promise has been represented, or that every non-zero protected component has an authenticated source. The V3 carrier's authority signature proves the carrier update authority, not that the signed economic observation is exhaustive or that each field has its proper R7 category.

**PA6 result: PARTIAL / NOT DISCHARGED.** Known malformed class states fail closed; L6 cannot be asserted empty until all profile asset and obligation classes have complete, authoritative enumeration.

## 9. PA7 — Adversarial omitted-commitment review

The following attacks must be included in the final profile suite:

| Adversarial case | Expected behavior | Current evidence |
|---|---|---|
| Omit an unresolved ticket while pool reserve/count remain unchanged | Reject on reserve/count mismatch | Projection checks exist; completeness of the underlying observed ticket set still needs a trustworthy source proof. |
| Duplicate a ticket ID or class ID | Reject | TypeScript projection rejects duplicate ticket IDs; Haskell projection/carrier reject duplicate class IDs. |
| Unknown/noncanonical class or price | Reject, never map exposure to zero | Current kernel, projection and carrier reject; positive current-code evidence. |
| Put one ticket in both unresolved L3 and crystallized L1 | Reject / fail audit | Lifecycle state/delta rules are defined; no full ticket-population disjointness witness has been produced. |
| Add the same amount to both WorstCaseExposure and UnresolvedReserve as PC addends | Reject accounting definition | Current kernel excludes UnresolvedReserve from PC; existing tests assert reserve is not substituted for worst-case exposure. |
| Duplicate Jackpot amount inside another PC component | Reject unless distinct commitment is proved | No complete category/disjointness witness. |
| Duplicate SafetyCapital or ReserveProtection inside a statistical reserve or worst-case requirement | Reject unless independently justified as a distinct dimension | Not proven; no typed origin/perimeter witness. |
| Omit a mandatory future protocol cost or count it twice in PC and `X(P)` | Reject / fail qualification | Cost evidence framework exists; no complete cost cohort/horizon mapping. |
| Treat MinUTxO/locked ADA or optional infrastructure as burned protocol OPEX without a contract | Reject classification | Fee evidence model explicitly distinguishes locked value, observed cost and mandatory protocol-borne cost. |
| Omit an asset outside the direct-USDM Pool UTxO but still claim full treasury EEV | Reject the full-treasury claim; direct profile remains narrow | Direct-USDM profile excludes unsupported assets; complete treasury asset census is not part of this profile. |
| Use stale, ambiguous or unspent-source evidence as A1 | Reject / fail closed | Direct-USDM source producer has exact live-UTxO revalidation; it must run at admission time. |
| Recreate a claim/liability after final expiry | Reject | Expiry finality is normative; current action-level equivalence evidence remains incomplete. |
| Introduce a Jackpot/CAR/treasury allocation without an R7 delta and gate | Reject / no execution | Current V3 ticket action set does not contain a complete Jackpot/CAR transition; this remains an open closure item. |

**PA7 result: PARTIAL / OPEN.** The review has found no basis to claim full coverage. Some concrete malformed-state attacks are already rejected, but the decisive T-CONS-GAP attack—an economically material commitment omitted from the enumerated partition while all recorded sums remain arithmetically consistent—has not been discharged for the whole PRE-RICH profile.

## 10. Exact closure boundary

No new economic formula or policy decision is required. The minimum additional evidence is:

1. **Typed profile registry:** every source item must declare its canonical cell (A1–A5 or L1–L6), unit, legal/economic meaning, owner/payer/beneficiary, event status, cohort, horizon, derivation version, source reference and digest.
2. **Complete asset inventory:** prove the current direct-USDM Pool source is the only asset entering this EEV profile, or enumerate and classify all additional protocol-controlled assets as A1/A2/A3/A4/A5. Do not label a single-Pool profile as total treasury EEV.
3. **Complete obligation inventory:** reconcile every Pending/BeaconReady/Winning/Claimed/Expired ticket and every Jackpot/CAR/treasury/service commitment to exactly one of L1–L6.
4. **Typed PC component mapping:** define whether each SafetyCapital, ReserveProtection and MandatoryFutureCosts amount is L1, L2 or L3 (or a separately justified typed decomposition); prove no aliases/overlaps with WorstCaseExposure, Jackpot, statistical-risk outputs or `X(P)`.
5. **Transition ledger:** enumerate every economically material action, including FundTreasury, Issue, Reveal, Claim, Expire, Jackpot funding/payout/reset, Treasury/AWRA distribution, and source verification/staleness; show its permitted R7 deltas and exact asset-side change.
6. **Replay and adversarial suite:** reproduce PA1–PA7 from one canonical state/observation, then run omission, duplication, stale-source, unknown-category, unit-mismatch, and lifecycle-boundary mutations.

The `PRE-RICH-C1-CAPACITY-EEV-PROTECTED-CAPITAL-RECONCILIATION-2026-11-02.md` audit supplies the capacity/EEV/cost-surface side of this work. This file supplies the R7 profile-partition side. They are complementary; neither claims final PA certification.

## 11. Sources of authority / evidence

### Repository — audited work branch

- [R7 accounting partition and conservation certification](../02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md)
- [V3 economic state](../../IMMORTAL/state/EconomicStateV3.hs)
- [V3 state field ownership](../../IMMORTAL/state/STATE-FIELD-OWNERSHIP.md)
- [PRE-RICH V3 → Universal projection](../../PRE-RICH/onchain/PreRichEconomicProjection.hs)
- [V3 carrier validation](../../PRE-RICH/onchain/V3EconomicStateCarrier.hs)
- [PRE-RICH Cardano observation projection](../../PRE-RICH/src/PreRichCardanoObservationProjection.ts)
- [V3 economic transitions](../../IMMORTAL/kernel/EconomicTransitionV3.hs)
- [ProtectedCapital kernel](../../IMMORTAL/kernel/EconomicKernel.hs)
- [ProtectedCapital conformance predicates](../../IMMORTAL/conformance/ProtectedCapitalConformance.hs)
- [B1 legacy adapter](../../plutus/B1LegacyAdapter.hs)
- [B1 Pool datum/actions](../../plutus/Types.hs)
- [B1 Pool validator](../../plutus/B1PrizePool.hs)
- [Direct-USDM C1 audit](PRE-RICH-C1-CAPACITY-EEV-PROTECTED-CAPITAL-RECONCILIATION-2026-11-02.md)

### Notion — existing decisions / audit record

- [IMMORTAL — Economic Canon & Parameter Boundary Register](https://app.notion.com/p/3e2c4454d6d581e39ad6e764d162dbd7) — especially B-R2 and the 5C/5D ProtectedCapital partition audit.
- [B4 ProtectedCapital / B5 Gate Surgical Conformance Pass](https://app.notion.com/p/3e2c4454d6d581ceae8ee6bff128786d)
- [A1/A2/A3 Policy Closure — Ticket Expiry & Jackpot](https://app.notion.com/p/3e2c4454d6d5812c9514e16afeded763)
- [13 — Fee Amount Discovery](https://app.notion.com/p/3e0c4454d6d581aabf29f21e688b4fb3)
- [14 — Fee Discovery Evidence Model](https://app.notion.com/p/3e0c4454d6d5811ab0d3fe7e93f18aab)
- [15 — Fee Benchmark Matrix](https://app.notion.com/p/3e0c4454d6d5812a951fd812d37ae11e)

**Disposition:** PA1 is instantiated as a candidate profile map. PA2, PA3, PA4, PA5, PA6 and PA7 retain explicit open evidence obligations. No normative formula, parameter, executable code, test, validator, workflow, branch structure or on-chain state was changed by this audit document.
