# PRE-RICH — ProtectedCapital Component Provenance Audit

**Date:** 2026-11-02  
**Branch:** `work/immortal-green-closure`  
**Base HEAD inspected:** `ac3f3e364a0487da07ca2164a81e3a40a17082f4`  
**Status:** AUDIT ONLY — NOT CERTIFIED  
**Scope:** `SafetyCapital`, `ReserveProtection`, `MandatoryFutureCosts`  
**Change class:** documentation only; no V3, Reveal, validator, workflow, or on-chain state change.

---

## 1. Executive result

The three components are present in the V3 data model, are included in the `ProtectedCapital` arithmetic, are carried into the universal economic state, and are protected from accidental loss across the current Issue/Reveal/Claim/Expire transition model.

That proves **representation, arithmetic inclusion, and local preservation**. It does not prove that the values originate from authoritative economic obligations, that each value represents a distinct category, or that all applicable obligations have been included exactly once.

The current evidence therefore supports:

| Requirement | Result | Reason |
|---|---|---|
| Field representation | IMPLEMENTED | Three independent V3 integer fields exist. |
| Arithmetic inclusion | IMPLEMENTED | All three are added to `ProtectedCapital`. |
| Non-negativity | IMPLEMENTED | Kernel, projection, and carrier reject negative values. |
| Lifecycle preservation | IMPLEMENTED / BOUNDED | Existing V3 actions preserve the fields; this is not a source proof. |
| Authoritative source per component | OPEN | The projection receives primitive values from an injected observation source; no field-specific origin proof is enforced. |
| Semantic perimeter / typed classification | OPEN | No executable type or witness identifies the economic items represented by each field. |
| Pairwise disjointness | UNPROVEN | No evidence establishes that the same obligation or amount is not in more than one component. |
| Exhaustive coverage | OPEN | No complete inventory proves that every material obligation is represented. |
| B1 legacy round-trip | FAIL-CLOSED | Non-zero components cannot be silently projected to the legacy B1 datum. |

**Gate conclusion:** PC-04 (provenance) remains **UNPROVEN**; PC-02 (no double counting) remains **UNPROVEN**; PC-01 (coverage) remains **OPEN**. The three values must not be treated as certified merely because the current issue-admission witness contains them.

This audit does not introduce a new formula, threshold, coefficient, or economic policy.

---

## 2. Current code path and what it actually proves

### 2.1 State and kernel

- `IMMORTAL/state/EconomicStateV3.hs` stores `v3SafetyCapital`, `v3ReserveProtection`, and `v3MandatoryFutureCosts` as independent `Integer` fields.
- `IMMORTAL/kernel/EconomicKernel.hs` includes each field exactly once in the current arithmetic expression:

  `ProtectedCapital = CrystallizedLiabilities + WorstCaseExposure + SafetyCapital + ReserveProtection + LockedJackpot + MandatoryFutureCosts`

  The solvency predicate checks that the fields are non-negative and that EEV covers the computed total. It does not inspect the source, category, contractual status, or overlap of the three values.
- `IMMORTAL/state/STATE-FIELD-OWNERSHIP.md` classifies all three as universal IMMORTAL primitives. This establishes the intended **semantic ownership** of the concepts, not the concrete PRE-RICH source, value, or partition proof.

### 2.2 Transition and conformance

- `IMMORTAL/kernel/EconomicTransitionV3.hs` implements Issue, Reveal, Claim, and Expire. These actions do not create or update the three components.
- `IMMORTAL/conformance/ProtectedCapitalConformance.hs` checks that the three values remain equal before and after the covered lifecycle transitions. Its own comment characterizes this as a local preservation property, not a viability proof.
- `protectedCapitalPartitionExact` checks an arithmetic sum. Arithmetic equality cannot establish that the inputs describe distinct underlying obligations.

### 2.3 Cardano observation and V3 carrier

- `PRE-RICH/src/PreRichCardanoObservationProjection.ts` requires the three values in `ProjectionInput` and labels them “Authoritative protected-capital observations”. They enter as primitive `bigint` values. The input has no per-component source reference, obligation identifier, semantic class, horizon, payer, or non-overlap witness.
- `PRE-RICH/onchain/PreRichEconomicProjection.hs` forwards the three values into `UniversalEconomicState`; it verifies non-negativity and the ticket-class decomposition, not their independent origin.
- `PRE-RICH/onchain/V3EconomicStateCarrier.hs` validates non-negativity and binds the numeric values into the canonical V3 state representation. A carrier signature proves acceptance of the bound state update; it does not prove that a given amount is the correct value for a given economic category.

### 2.4 Issue-admission producer boundary

The current branch contains the Haskell Issue producer transport and the admission bridge:

1. `HaskellIssueAdmissionProvider.ts` receives an injected `observationSource`.
2. That source supplies `decisionInput`, the protected-capital provenance object, the observation references, and a carrier binding signature.
3. The Haskell producer evaluates the supplied `decisionInput`.
4. The provider compares the six component values and total returned by Haskell with the values supplied by the observation source.
5. The resulting witness uses the V3 carrier reference as the `ProtectedCapitalProvenance.sourceReference`.
6. Runtime validation checks non-negativity, six component values, sum equality, and bindings to the carrier / viability witness.

This is useful integrity and transport enforcement. The missing step is upstream: the current contract does not itself establish **why** the observation source is authoritative for each of the three components or **which unique economic items** its values represent.

The authority signature checked by this provider binds `stateHash`, `actionFingerprint`, and `postStateHash`. It does not, by itself, supply three independent component-origin attestations or a signed partition witness. The carrier reference is a state reference, not a component-level provenance record.

The current `ProtectedCapitalProvenance` object contains a generic `sourceReference`, six aggregate component amounts, two accounting inputs, and a total. It does not contain an executable classification/disjointness proof for each component.

---

## 3. Component-by-component findings

### 3.1 SafetyCapital

**Current semantic label:** protected safety capital / Required PrizePool Safety Capital.

**Established:**
- The concept is recognized in the economic model and decision register.
- The V3 field is included in `ProtectedCapital`.
- The field is non-negative and preserved by the supported V3 lifecycle transitions.

**Not established:**
- The exact economic perimeter of the amount.
- The rule or derivation that produces the amount for a concrete PRE-RICH state.
- Whether it is a distinct deterministic safety buffer, a floor implied by an existing exposure rule, or a value already included in another protection component.
- Whether the amount is sourced from the PrizePool, Treasury, a policy calculation, or another authoritative state. The field name does not establish the answer.

**Required closure evidence:** a normative rule defining the safety property and perimeter; a deterministic derivation or authenticated source for the concrete amount; a state/profile binding; and explicit proof that the represented economic content is not already covered by WorstCaseExposure, ReserveProtection, LockedJackpot, MandatoryFutureCosts, or crystallized liabilities.

No new numerical formula or safety coefficient is inferred by this audit.

### 3.2 ReserveProtection

**Current semantic label:** protected reserve component / Required Reserve Protection.

**Established:**
- A distinct field exists and is added to `ProtectedCapital`.
- The economic register distinguishes unresolved accounting reserve, deterministic worst-case exposure, statistical reserve, and CAR as different concepts.
- The register expressly rejects silently adding statistical reserve to worst-case exposure through a universal formula.

**Not established:**
- Whether this field represents a deterministic reserve, a statistical risk reserve, CAR-backed conditional allocation, or a different reserve class.
- Its valuation perimeter, horizon, confidence criterion (if statistical), release conditions, or update authority.
- Its independence from WorstCaseExposure, UnresolvedReserve, SafetyCapital, LockedJackpot, and other protected values.

**Required closure evidence:** an explicit typed classification of the reserve; the applicable profile/policy and valuation rule; source and freshness evidence; horizon/perimeter definition; and a disjointness proof against every other protected component. If it is statistical, the distribution/model, horizon, and confidence criterion must be declared. A statistical reserve must not be promoted to a deterministic guarantee without an explicit rule.

In particular, `UnresolvedReserve` remains an accounting representation of unresolved ticket value; it must not be added as an extra ProtectedCapital term merely because a reserve field exists. WorstCaseExposure is a different amount with a different role.

### 3.3 MandatoryFutureCosts

**Current semantic label:** known mandatory future economic outflows.

**Established by the fee/cost decision records:**
- `ObservedExecutionCost` and `MandatoryFutureCost` are different concepts.
- `OPEX_observed ≠ OPEX_committed`.
- Only costs that the protocol is genuinely obligated to bear and has contractually or normatively assumed may contribute to MandatoryFutureCost / ProtectedCapital.
- `Fs(P)`, `Fr(P)`, and `Fc(P)` enter the capacity/cost model only to the extent that the corresponding settlement, reveal, or claim cost is genuinely protocol-borne.
- User-/relayer-/operator-borne costs do not become protocol liabilities solely because they are observed.
- Locked or recoverable value (including min-UTxO value) is not automatically consumed OPEX.
- A single observed transaction or benchmark is evidence, not proof of the worst-case cost envelope.

**Not established:**
- A complete itemized inventory of future protocol-borne costs for the deployed PRE-RICH profile.
- Which party is contractually responsible for each cost.
- The amount, currency/unit, horizon, action class, and commitment status per item.
- Whether any cost is already included in `Fs/Fr/Fc`, another obligation, a liquidity requirement, or another ProtectedCapital component.

**Required closure evidence:** an itemized schedule of future obligations, the protocol-borne commitment for each item, a bounded valuation over the declared transaction/operational shape space, validity/revalidation conditions, and a cross-ledger non-overlap proof against all other protected fields and cost-surface entries.

The key anti-double-counting boundary is between `MandatoryFutureCosts` and `Fs/Fr/Fc` / Maintenance / OPEX. The same future payment must not be counted twice simply because it appears both as an action-specific cost and as a generic future-cost aggregate. Conversely, an observed cost that the protocol has not undertaken must not be added to ProtectedCapital.

---

## 4. Required partition and overlap rules

The three component names are not sufficient partition keys. Each amount needs a traceable set of underlying economic items and exactly one authoritative accounting classification.

At minimum, each item used to derive one of these components must be associated with:

- stable obligation / cost identifier and component identifier;
- semantic cell and economic effect;
- amount, unit, asset, valuation reference, and snapshot time;
- source and verification references, including digest;
- derivation rule/version and profile or policy version;
- payer and beneficiary / recipient;
- action or event class that makes the outflow due;
- commitment status (observed, optional, conditional, mandatory, already crystallized);
- horizon / due window and validity or revalidation rule;
- mapping to the relevant cost-surface entry, including whether it is already represented by `Fs`, `Fr`, or `Fc`;
- explicit partition/disjointness witness and an explanation of any shared funding pool that is not itself a duplicate obligation.

The final partition must satisfy all of the following:

1. **Coverage:** every economically material protected obligation required by the profile is represented, or execution is blocked.
2. **Single classification:** each underlying obligation is assigned once to its canonical protection class.
3. **No double counting:** a payment cannot be counted in two components without a separately justified, non-overlapping economic effect.
4. **Consistent perimeter:** EEV and all obligations use compatible asset, unit, time, and horizon boundaries.
5. **Deterministic/declared valuation:** deterministic requirements use deterministic bounds; statistical requirements declare their model and confidence assumptions.
6. **Delta closure:** creation, increase, settlement, cancellation, expiry, and reclassification of an obligation have explicit state-transition effects.
7. **Fail-closed admission:** missing, stale, unclassified, or conflicting evidence must not default to zero or to a caller-supplied “complete” flag.

This is the concrete evidence needed to discharge PA1–PA7 for these component categories; the document does not claim that the schema alone proves those properties.

---

## 5. Adversarial cases that must be rejected or resolved

| Case | Required behavior |
|---|---|
| Same reveal/claim cost included in both `Fr/Fc` and MandatoryFutureCosts | Reject duplicate accounting or prove distinct payers/effects. |
| User-paid or relayer-paid transaction cost inserted as protocol OPEX | Exclude unless a protocol-borne commitment is evidenced. |
| Observed cost treated as an obligation for all future actions | Reject without an approved bound/commitment rule. |
| Recoverable locked value or min-UTxO treated as spent OPEX | Reject absent evidence of irreversible consumption or protocol assumption. |
| Statistical reserve added to WorstCaseExposure without a declared distinct role | Reject pending model, horizon, confidence, and non-overlap rule. |
| ReserveProtection duplicates UnresolvedReserve or SafetyCapital | Reject duplicate content; do not infer independence from field names. |
| SafetyCapital duplicates part of WorstCaseExposure | Reject unless the two amounts protect demonstrably different economic effects. |
| One cost/obligation omitted from all components | Block admission under the completeness requirement. |
| Source reference points only to a V3 carrier containing the same unqualified values | Treat as state binding, not independent provenance. |
| Values are arithmetically consistent but component evidence is stale or unverified | Fail closed. |

---

## 6. Smallest safe next work package

No V3 or validator modification is required to advance this proof. The next work should be an evidence/producer task, in this order:

1. **Inventory sources:** identify the authoritative source for each safety, reserve, and future-cost item in the deployed PRE-RICH profile. Distinguish on-chain facts, approved policy parameters, contractual commitments, and observations.
2. **Freeze typed definitions:** classify SafetyCapital and ReserveProtection without inventing new numeric rules; classify MandatoryFutureCosts only from genuinely protocol-borne commitments.
3. **Build obligation/cost inventory:** enumerate every obligation/cost item, with payer, beneficiary, action, amount/unit, horizon, source, and commitment evidence.
4. **Reconcile overlaps:** cross-check liabilities, WorstCaseExposure, UnresolvedReserve (accounting-only), LockedJackpot, statistical outputs, `Fs/Fr/Fc`, Maintenance, OPEX, and the three fields.
5. **Produce signed partition evidence:** bind the unique item inventory, derivations, source digests, policy versions, and disjointness proof to the exact pre-state / carrier reference.
6. **Replay adversarial cases:** prove complete and duplicate-free accounting for all supported economic transitions and all declared obligation lifecycle events.

A generic source reference, arithmetic checksum, carrier signature, or `obligationsComplete=true` flag is not a substitute for these artifacts.

---

## 7. Source map

### Repository — inspected on `work/immortal-green-closure`

- [EconomicStateV3.hs](../../IMMORTAL/state/EconomicStateV3.hs)
- [STATE-FIELD-OWNERSHIP.md](../../IMMORTAL/state/STATE-FIELD-OWNERSHIP.md)
- [EconomicKernel.hs](../../IMMORTAL/kernel/EconomicKernel.hs)
- [EconomicTransitionV3.hs](../../IMMORTAL/kernel/EconomicTransitionV3.hs)
- [ProtectedCapitalConformance.hs](../../IMMORTAL/conformance/ProtectedCapitalConformance.hs)
- [PreRichEconomicProjection.hs](../../PRE-RICH/onchain/PreRichEconomicProjection.hs)
- [V3EconomicStateCarrier.hs](../../PRE-RICH/onchain/V3EconomicStateCarrier.hs)
- [PreRichCardanoObservationProjection.ts](../../PRE-RICH/src/PreRichCardanoObservationProjection.ts)
- [PreRichEconomicAdmission.hs](../../PRE-RICH/onchain/PreRichEconomicAdmission.hs)
- [preRichIssueAdmissionBridge.ts](../../src/preRichIssueAdmissionBridge.ts)
- [HaskellIssueAdmissionProvider.ts](../../Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts)
- [AuthoritativeIssueAdmission.ts](../../Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts)
- [PRE-RICH Issue Admission — Provenance Boundary](PRE-RICH-ISSUE-ADMISSION-PROVENANCE.md)
- [PRE-RICH PA1–PA7 Protected Capital Profile Mapping](PRE-RICH-PA1-PA7-PROTECTED-CAPITAL-PROFILE-MAPPING-2026-11-02.md)
- [PRE-RICH C1 Capacity / EEV / Protected Capital Reconciliation](PRE-RICH-C1-CAPACITY-EEV-PROTECTED-CAPITAL-RECONCILIATION-2026-11-02.md)

### Notion — decision sources consulted

- [IMMORTAL — Economic Canon & Parameter Boundary Register v0.1](https://app.notion.com/p/3e2c4454d6d581e39ad6e764d162dbd7)
- [2026-09-21 — B4 ProtectedCapital / B5 Gate Surgical Conformance Pass](https://app.notion.com/p/3e2c4454d6d581ceae8ee6bff128786d)
- [09 — Definitive Decision Register](https://app.notion.com/p/3d9c4454d6d5811e8bece49c16cf2c9d)
- [13 — Fee Amount Discovery, Cost Surface & First-Ticket Learning Constraint](https://app.notion.com/p/3e0c4454d6d581aabf29f21e688b4fb3)
- [14 — Fee Discovery Evidence Model, Benchmark Protocol & Parameter Update Rule](https://app.notion.com/p/3e0c4454d6d5811ab0d3fe7e93f18aab)
- [15 — Fee Benchmark Matrix, Worst-Case Cost Envelope & Safe First-Execution Contract](https://app.notion.com/p/3e0c4454d6d5812a951fd812d37ae11e)

**Research limitation:** Notion page search/fetch was available and used. Connected-workspace discussion search was not available because the connector requires Notion Business; no claim is made that Slack or other connected discussions were exhaustively searched.
