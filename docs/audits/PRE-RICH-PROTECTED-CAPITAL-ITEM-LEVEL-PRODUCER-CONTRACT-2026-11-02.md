# PRE-RICH — ProtectedCapital Item-Level Producer Contract

**Date:** 2026-11-02  
**Branch:** `work/immortal-green-closure`  
**Baseline HEAD:** `57bc4bf48a17d68e0a500e00c73675ca7e8ab497`  
**Status:** PROPOSED PRODUCER CONTRACT — NOT IMPLEMENTED / NOT CERTIFIED  
**Scope:** Evidence contract for deriving PRE-RICH ProtectedCapital from atomic, source-authorized obligation and protection records.  
**Change class:** Documentation only. No code, economic constants, V3, Reveal, validators, workflows, deployment configuration, or on-chain state are changed.

---

## 1. Purpose and decision

The current Issue admission path carries six aggregate ProtectedCapital components, a generic source reference, accounting inputs, and V3 carrier bindings. It validates non-negativity, total equality, and state/carrier binding. Those checks do not establish the economic identity, completeness, canonical R7 class, payer/beneficiary, valuation basis, or disjointness of the underlying amounts.

This contract defines the missing **item-level producer boundary**. Its output is a replayable evidence packet from which the six existing component aggregates can be derived and checked. The producer must not invent obligations, risk coefficients, cost bounds, horizons, valuation rules, or economic classifications.

### Decision

Adopt a two-layer evidence model:

1. **Atomic source records** describe the actual ticket, payout, locked allocation, accepted future payment, cost declaration, protection requirement, or source observation.
2. **Canonical accounting allocations** classify each economic commitment exactly once under R7 and link it to the applicable ProtectedCapital component and valuation rule.

Cost observations and unresolved-ticket accounting values are attached as evidence/reconciliation attributes; they are not automatically additional ProtectedCapital items.

The producer may emit an executable six-component aggregate only when every included amount has authoritative item-level support, every material commitment in the declared source perimeter has been enumerated, and the R7 partition is complete and disjoint. Unknown, stale, omitted, duplicate, or unclassifiable material must fail closed.

## 2. Governing invariants retained

The contract preserves the current economic model. It introduces no new economic rule.

```text
ProtectedCapital =
    CrystallizedLiabilities
  + WorstCaseExposure
  + SafetyCapital
  + ReserveProtection
  + LockedJackpot
  + MandatoryFutureCosts

C          = EEV - ProtectedCapital
RawSurplus = max(0, C)
```

R7 is the normative two-sided partition:

```text
ProtectedCapital = value(L1) + value(L2) + value_worstcase_Ω(L3)
```

- **L1:** accepted, crystallized obligations due but not settled.
- **L2:** CAR / value conditionally committed to a future allocation. For PRE-RICH, funded-and-locked Jackpot is only a candidate instantiation; other conditional allocations need an explicit profile rule.
- **L3:** unresolved exposure valued at worst case over the declared scenario set.
- **L4:** settled obligations; retained in history, not live ProtectedCapital.
- **L5:** expired rights/liabilities; retained in history, not live ProtectedCapital.
- **L6:** any material but unrepresented or unclassifiable commitment. L6 must be empty in an executable state.

Every included commitment must be allocated to exactly one of L1/L2/L3. L4/L5 records cannot contribute to live ProtectedCapital. L6, missing classifications, or unknown material source populations block the dependent action.

### 2.1 Existing distinctions that must not collapse

- `UnresolvedReserve` is the face-price accounting/reconciliation value of unresolved tickets. It is not a second ProtectedCapital addend.
- `WorstCaseExposure` is the PRE-RICH profile's deterministic unresolved-ticket protection amount, derived from the complete unresolved population and the existing 500× maximum normal payout rule.
- `EffectivePool` is a liquidity view, not EEV, a partition cell, or ProtectedCapital.
- `C` is signed capacity. It must not be clamped before the Economic Gate. `RawSurplus` is a derived non-negative residual, not a partition item.
- The cost surface `X(P)=499P+Fs(P)+Fr(P)+Fc(P)` is a capacity/hysteresis condition, not a second ProtectedCapital ledger. A payment represented in this cost surface must be cross-reconciled with any future-cost commitment; it must not be counted twice.
- Observed or benchmark execution cost is not automatically a future protocol obligation.

## 3. Producer boundary and output levels

### 3.1 Input domains

The producer must enumerate, at minimum, the source domains relevant to the selected profile:

| Domain | Required source population | Present qualification boundary |
|---|---|---|
| Live ticket population | Canonical ticket identity, class, price, and authoritative lifecycle status for the same snapshot | Existing projection/carrier checks reconcile class counts and unresolved reserve; exhaustive source coverage remains to be proven. |
| Crystallized payouts | Winning revealed tickets that remain unpaid, with exact payout amounts and claim/expiry status | B1 `ppPendingLiabilities` / V3 `v3CrystallizedLiabilities` are aggregate representations; ticket-to-aggregate population proof is still required. |
| Conditional allocations | Funded-and-locked Jackpot and any other profile-authorized conditional future allocation | Jackpot is a candidate L2 record only after an authorized funding/lock transition. |
| Future-cost commitments | Contractual or normative obligations that the protocol/profile actually undertakes to pay | No aggregate OPEX or cost benchmark qualifies without payer, beneficiary, trigger, commitment authority, horizon, and bounded valuation. |
| Protection requirements | SafetyCapital and ReserveProtection source/policy records | Semantics, perimeter, valuation, and disjointness are not yet sufficiently typed. |
| Other material commitments | Refunds, guarantees, relayer/service obligations, mandatory distribution/recovery costs, or any other profile-created commitment | If material and not classifiable, record as L6 and block; absence from an existing field is not proof of zero. |
| Asset-side references | Exact approved EEV source snapshot and any cross-ledger transfers relevant to the commitment snapshot | Current `PRE-RICH-EEV-USDM-DIRECT-V1` is limited to physical tUSDM in the exact B1 PrizePool UTxO. |

The producer's census must state the exact query/source scope, contract or policy identifiers, time/slot boundary, pagination/cursor completion, and source freshness. It must not silently treat a partial query or an unavailable source as an empty population.

### 3.2 Output layers

The output is divided into four separately hashed layers:

1. **Source evidence manifest** — the sources queried, their authority, snapshot boundary, completeness result, freshness, and raw evidence digests.
2. **Atomic item ledger** — one logical identity per economic right/commitment or protection requirement, with immutable snapshot-specific record digest.
3. **Allocation and reconciliation ledger** — one canonical R7 allocation per included economic commitment, lifecycle deltas, component mapping, exclusions, and overlap witnesses.
4. **Aggregate certificate candidate** — the derived six components, accounting reconciliation values, signed capacity, derivation trace, and producer attestation.

The aggregate certificate is only a candidate input to the existing admission authority. This document does not claim that the current authority verifies this proposed packet.

## 4. Atomic item record contract

The following is a proposed logical schema, not a committed TypeScript API or a new on-chain datum. Field names may be adapted during implementation without changing the evidence requirements.

```ts
type EvidenceRef = {
  sourceReference: string
  verificationReference: string
  evidenceDigest: string
  sourceTimestamp: string
  observedAt: string
  validUntil?: string
  authorityId: string
  sourceVersion: string
}

type Amount = {
  quantity: string              // exact integer/decimal string; never float
  unit: string                  // e.g. approved USDM subunit
  assetId?: string              // exact policy/name or other canonical asset identity
}

type R7Cell = "L1" | "L2" | "L3" | "L4" | "L5" | "L6"

type ProtectedCapitalComponent =
  | "crystallizedLiabilities"
  | "worstCaseExposure"
  | "safetyCapital"
  | "reserveProtection"
  | "lockedJackpot"
  | "mandatoryFutureCosts"

type AtomicCommitmentItem = {
  itemId: string                // stable logical identity across snapshots
  recordDigest: string          // digest of this exact snapshot record
  itemKind: string              // typed by the source/profile registry
  identityReference: string    // ticket, claim, allocation, contract, tx, or obligation id
  snapshotReference: string
  profileId: string
  contractVersion: string
  derivationVersion: string

  lifecycle: {
    sourceStatus: string        // source-native status; do not synthesize from absence
    effectiveAt?: string
    triggerReference?: string
    predecessorItemId?: string
    successorItemId?: string
  }

  parties: {
    payer?: string
    beneficiary?: string
    protocolBorne: boolean
    commitmentAuthorityReference?: string
  }

  obligation: {
    amount: Amount
    acceptedAt?: string
    dueAt?: string
    horizonReference?: string
    actionOrEvent: string
    cohortReference?: string
  }

  allocation: {
    r7Cell: R7Cell
    classificationRuleReference: string
    pcComponent?: ProtectedCapitalComponent
    countedAmount: Amount
    valuationRuleReference: string
    overlapSetId: string
  }

  evidence: EvidenceRef[]
}
```

### 4.1 Identity and amount rules

- `itemId` identifies the logical economic right/commitment across snapshots. It must be derived from a real source identity or an explicitly governed source key; it must not be a random per-run identifier.
- `recordDigest` identifies the exact snapshot-specific content. A changed status or amount creates a different record digest while preserving the logical `itemId`.
- Amounts use exact integer/decimal representations and a declared unit. No floating-point arithmetic or implicit FX conversion is permitted.
- A single item represents one indivisible economic obligation for accounting purposes. If a source combines multiple distinct obligations, the producer must split them into distinct item identities before allocation.
- The same amount cannot be allocated twice under two different `itemId` values merely because it appears in two source systems. A shared `overlapSetId` and source reconciliation must expose such aliases.
- A source record is not authoritative merely because it is signed or returned by an API. Its authority, scope, freshness, and relationship to the actual commitment must be explicit.

### 4.2 Classification rules

Exactly one R7 cell is assigned to each live economic commitment:

| R7 cell | Item-level acceptance rule | Live ProtectedCapital effect |
|---|---|---|
| L1 | An accepted, crystallized, unpaid amount, supported by the canonical event and current unpaid state | Included once as the accepted outstanding amount. |
| L2 | A conditional allocation that has become binding under an explicit profile rule and an authorized funding/lock transition | Included once while the commitment remains locked/binding. |
| L3 | An unresolved exposure whose scenario set and worst-case valuation are defined by the profile | Included once at the existing deterministic worst-case valuation. |
| L4 | Exact settlement is evidenced | Excluded from live ProtectedCapital; retain settlement history and transition evidence. |
| L5 | Final expiry/release is evidenced and no claim can be revived | Excluded from live ProtectedCapital; retain expiry history and transition evidence. |
| L6 | Material commitment is known or cannot safely be classified | No executable aggregate; fail closed. |

The producer must not infer L1/L2/L3 solely from a V3 field name. In particular, `MandatoryFutureCosts` must be decomposed into individual obligations and classified by their actual accepted/conditional/unresolved status. The source record's legal/economic effect and applicable profile rule decide the class.

## 5. Protection-requirement records

A risk/safety requirement is not automatically an accepted payment obligation. It therefore needs a separate record type until its economic meaning and R7 relationship are explicitly governed.

```ts
type ProtectionRequirementCandidate = {
  requirementId: string
  recordDigest: string
  component: "safetyCapital" | "reserveProtection"
  semanticDefinitionReference: string
  profileId: string
  valuationRuleReference?: string
  amount?: Amount
  sourceEvidence: EvidenceRef[]
  perimeter: string[]
  horizonReference?: string
  releaseOrRevalidationRuleReference?: string
  disjointnessEvidence: string[]
  r7Classification?: R7Cell
  qualificationStatus: "unresolved" | "qualified" | "rejected"
}
```

Rules:

1. An unresolved protection requirement is visible in the evidence packet but cannot be silently promoted to a qualified PC amount.
2. `SafetyCapital` requires a normative safety property, exact perimeter, authoritative source/derivation, profile binding, and proof that it is not already represented by L1/L2/L3 or another component.
3. `ReserveProtection` requires a typed reserve meaning, valuation rule, source/freshness, horizon and release/revalidation semantics. If statistical, its model, horizon, and confidence criterion must be explicit. A statistical estimate is not a deterministic guarantee by label alone.
4. Neither field may be equated by assumption with `UnresolvedReserve`, `WorstCaseExposure`, CAR/Jackpot, or the other protection field.
5. The candidate is qualified only when its exact R7 mapping and non-overlap with every other PC item are evidenced. Until then, the producer must report the aggregate as unqualified and the dependent admission must not use it as certified capacity.

This contract does not decide the unresolved semantics or invent a formula for either field.

## 6. Cost evidence and future-cost commitment contract

Cost evidence is kept separate from the item ledger because measurement and commitment are different facts.

```ts
type CostEvidenceRecord = {
  costEvidenceId: string
  recordDigest: string
  costClass:
    | "OBSERVED_EXECUTION_COST"
    | "BENCHMARK_COST"
    | "MANDATORY_COST_DECLARATION"
    | "LOCKED_VALUE"
    | "OPTIONAL_INFRA_COST"
  action:
    | "SALE_MINT"
    | "REVEAL_LOSS"
    | "REVEAL_WIN"
    | "CLAIM"
    | "EXPIRE"
    | "TREASURY_DISTRIBUTION"
    | "BEACON_ROUND"
    | "BASELINE"
    | "EVENT_PROCESSING"
    | "STATE_QUERY"
    | "RECOVERY"
    | "RELAYER_BATCHER"
  amount: Amount
  payer?: string
  beneficiary?: string
  consumed: boolean
  recoverable: boolean
  protocolBorne: boolean
  commitmentReference?: string
  measurementReference?: string
  shapeSpaceReference?: string
  horizonReference?: string
  futureObligation: boolean
  evidence: EvidenceRef[]
}
```

### 6.1 Cost admission rule

A cost amount may contribute to `MandatoryFutureCosts` only when all of the following are established:

- the protocol/profile is the actual payer or has explicitly assumed the payment;
- the beneficiary and triggering action/service are identified;
- the commitment is mandatory and remains outstanding or is a bounded future commitment;
- the applicable transaction/operational shape space and valuation rule are declared;
- source and measurement/contract evidence are replayable;
- the item is mapped to exactly one R7 cell;
- the same payment is not already represented by another protected item or counted twice through `Fs/Fr/Fc`, maintenance, OPEX, or a cost-surface aggregate.

Observed and benchmark costs alone do not create future obligations. Optional infrastructure, caller-paid Cardano execution, recoverable locked value, and a protocol usage fee are not automatically protocol-borne future costs.

### 6.2 Required cost reconciliation

For every cost item, the packet must explicitly relate it to the existing cost surface:

- `Fs(P)`: SALE/MINT, only to the extent the protocol bears it;
- `Fr(P)`: REVEAL_WIN / REVEAL_LOSS, only to the extent the protocol bears it;
- `Fc(P)`: CLAIM, only to the extent the protocol bears it;
- EXPIRE, Treasury distribution, Beacon/round observation, baseline, event processing, state queries, recovery, and relayer/batcher costs: only where a real protocol commitment exists.

The cost surface remains a separate gate/capacity input. A `costEvidenceId` may reference the same underlying obligation represented by an atomic commitment item, but the reference itself must not create a second counted amount.

For the same future payment, the packet must show one canonical economic identity, one R7 allocation, and the explicit relationship between the `MandatoryFutureCosts` contribution and `Fs/Fr/Fc` / OPEX gate inputs. The producer must reject unexplained duplicate contribution.

## 7. Lifecycle and transition-delta evidence

A snapshot-only aggregate is insufficient to prove that rights move between commitment classes exactly once. The producer must carry transition evidence for each material lifecycle movement.

```ts
type CommitmentTransitionEvidence = {
  transitionId: string
  itemId: string
  action: string
  transactionReference: string
  beforeSnapshotReference: string
  afterSnapshotReference: string
  beforeRecordDigest: string
  afterRecordDigest: string
  fromR7Cell?: R7Cell
  toR7Cell?: R7Cell
  amountBefore: Amount
  amountAfter: Amount
  deltaReference: string
  evidence: EvidenceRef[]
}
```

Existing PRE-RICH lifecycle expectations are preserved:

- unresolved ticket: L3;
- winning Reveal: L3 → L1 for the actual crystallized payout, with the existing worst-case exposure released;
- losing Reveal: L3 → L5, with no new payout liability;
- final Expire: L3 → L5, with the exact permitted release;
- Claim: L1 → L4, with the exact payout settlement;
- funded/locked Jackpot: candidate L2 only after the authorized funding transition;
- Jackpot win/payout: the same locked amount leaves L2 and becomes the corresponding L1 unpaid payout obligation exactly once; settlement later moves L1 → L4.

A state cannot retain the same amount simultaneously in L3 and L1, or L2 and L1. A transition packet must bind before/after snapshots, item identity, transaction reference, exact amount delta, and the source/verification digests.

## 8. Aggregation contract

The producer derives aggregates from the item ledger; it must not accept six caller-supplied numbers as the authoritative source of their own provenance.

### 8.1 Derivation order

1. Resolve the profile, contract version, derivation version, and exact snapshot boundary.
2. Enumerate all source domains and prove each declared census completed.
3. Normalize source evidence into stable atomic item identities.
4. Reconcile aliases across sources and collapse duplicate views of the same economic identity.
5. Classify every material commitment into exactly one of L1/L2/L3/L4/L5/L6.
6. Validate each lifecycle transition and each valuation rule.
7. Qualify or reject safety/reserve requirement records separately.
8. Reconcile cost evidence with mandatory future-cost items and the cost surface.
9. Derive the six existing component aggregates from qualified allocations only.
10. Compare derived totals with independent B1/V3/on-chain accounting aggregates where available.
11. Compute and retain signed `C = EEV - ProtectedCapital`; derive `RawSurplus` only afterward.
12. Hash the complete packet and bind its digest to the snapshot, profile, derivation version, state/carrier binding, and authoritative approval.

### 8.2 Component-to-item derivation

| Existing component | Required item-level source |
|---|---|
| `crystallizedLiabilities` | Sum of qualified L1 unpaid accepted payout items, reconciled to B1 `ppPendingLiabilities` / V3 `v3CrystallizedLiabilities`. |
| `worstCaseExposure` | Deterministic PRE-RICH valuation of the complete qualified L3 unresolved-ticket population using the existing profile rule. The per-ticket price reserve is a reconciliation attribute, not a second amount. |
| `lockedJackpot` | Qualified L2 Jackpot items supported by the authorized funding/lock state; reconcile to B1 `ppLockedJackpot` / V3 Jackpot state. |
| `safetyCapital` | Qualified protection-requirement items only after the semantic, R7, valuation, source, and disjointness gates in Section 5 pass. |
| `reserveProtection` | Qualified reserve-requirement items only after the semantic, R7, valuation, source, horizon, and disjointness gates in Section 5 pass. |
| `mandatoryFutureCosts` | Sum of individually evidenced protocol-borne future-cost commitments classified under L1/L2/L3 as appropriate; exclude observations and costs paid by other parties. |

A component value of zero must be supported by a complete, authoritative census showing that no qualifying item exists in that component's declared perimeter. Missing or failed source evidence is not a zero.

### 8.3 Reconciliation-only fields

The packet may carry, but must not add again to ProtectedCapital:

- `unresolvedReserve`: sum of unresolved ticket face prices, reconciled with ticket identities and B1/V3 aggregate;
- `unresolvedTicketCount`: count of canonical unresolved ticket identities;
- execution-cost observations and benchmarks;
- `EffectivePool` and other immediate-liquidity views;
- historical L4/L5 records;
- asset and transfer references outside the approved EEV profile.

### 8.4 Aggregate certificate candidate

The output should include:

```ts
type ProtectedCapitalProducerPacket = {
  profileId: string
  contractVersion: string
  derivationVersion: string
  snapshotReference: string
  snapshotSlotOrTime: string
  sourceManifestDigest: string
  itemLedgerDigest: string
  allocationLedgerDigest: string
  transitionEvidenceDigest: string
  componentTotals: Record<ProtectedCapitalComponent, Amount>
  accountingInputs: {
    unresolvedReserve: Amount
    unresolvedTicketCount: string
  }
  r7Totals: Record<R7Cell, Amount>
  cSigned: Amount
  rawSurplus: Amount
  completenessStatus: "complete" | "incomplete"
  qualificationStatus: "qualified" | "unqualified"
  unresolvedFindings: string[]
  producerIdentity: string
  producerSignatureReference: string
}
```

This is an evidence contract only. The current `ProtectedCapitalProvenance` and Issue authority do not yet consume or validate this item-level packet.

## 9. Fail-closed conditions

The producer must return an unqualified packet and the dependent admission must reject when any of the following applies:

1. A required source is unavailable, stale, ambiguous, incomplete, or not authoritative for the asserted fact.
2. A query/census is partial, cursor exhaustion is not demonstrated, or source scope does not cover the declared profile perimeter.
3. A live ticket or commitment cannot be assigned exactly one logical identity.
4. A material commitment is omitted, unknown, duplicated, or left in L6.
5. The same economic amount appears in multiple R7 cells or more than one PC component without an explicit, proven disjoint partition.
6. A live obligation is assigned to L4/L5 without exact settlement/expiry evidence.
7. An L2 allocation has no authorized funding/lock transition and explicit profile rule.
8. L3 is not derived from the complete authoritative unresolved population.
9. `SafetyCapital` or `ReserveProtection` lacks typed semantics, source, valuation, R7 mapping, or disjointness.
10. `MandatoryFutureCosts` lacks an actual protocol-borne commitment, payer, beneficiary, trigger, horizon, valuation evidence, or non-overlap proof.
11. An observed/benchmark/optional cost is promoted to a mandatory future cost without commitment authority.
12. A cost-surface input and a future-cost item refer to the same payment but the accounting relationship is unresolved.
13. Before/after lifecycle evidence does not reconcile exact item and aggregate deltas.
14. The independently derived totals do not reconcile with the same-snapshot B1/V3 aggregates.
15. Any digest, version, state hash, profile, source reference, or signature binding is mismatched.

The fail-closed outcome is not a zero valuation and not a guessed fallback. It is an explicit unresolved finding.

## 10. Producer acceptance tests

The first implementation of this contract must provide deterministic replay fixtures for the following tests. These are evidence requirements, not new economic rules.

| Test | Positive condition | Required adversarial mutation |
|---|---|---|
| Identity uniqueness | One stable logical item per actual commitment | Duplicate the same ticket/claim/contract under a second item ID; reject alias/overlap. |
| Census completeness | All declared source pages/cursors and source domains are exhausted | Truncate a source page, omit a provider, or return an unavailable source; do not treat as empty. |
| L1 reconciliation | Every pending accepted unpaid payout appears once and sums to the aggregate | Omit one winning unclaimed ticket or include one twice; reject. |
| L2 authorization | Locked Jackpot item follows the authorized funding/lock event | Insert a locked amount without the authorizing transition; reject. |
| L3 completeness | Full unresolved set reconciles count, face-price reserve, and worst-case value | Omit a pending ticket, duplicate it, or move it to L1 without a Reveal event; reject. |
| L2 → L1 lifecycle | Same locked amount transfers into payout liability exactly once | Leave the amount in both buckets or remove it from both; reject. |
| Settlement/expiry | Exact L1/L3 release is tied to the terminal action | Reuse a settled/expired item as live or revive an expired right; reject. |
| SafetyCapital | Typed rule, source, R7 cell, valuation, and disjointness all exist | Reuse WorstCaseExposure or Jackpot amount as SafetyCapital; reject. |
| ReserveProtection | Typed reserve model and perimeter are explicit | Relabel unresolved ticket reserve/statistical estimate as the field without a governed rule; reject. |
| Future cost | Protocol-borne commitment and item valuation are evidenced | Change payer to caller/third party or remove commitment authority; do not count. |
| Cost overlap | One economic payment has one canonical identity and reconciled cost-surface reference | Count the same payment in MandatoryFutureCosts and as a second independent cost item; reject. |
| Same-snapshot binding | Evidence, aggregates, carrier, and approval share the exact snapshot/profile/version | Substitute a stale snapshot or another Pool/UTxO/state digest; reject. |
| L6 emptiness | Every material commitment is classified | Inject an unknown material outflow; reject rather than default to zero. |
| Replay determinism | Same inputs and versions produce byte-identical canonical packet/digests | Reorder source response records; canonicalization must yield the same result. |

Acceptance requires all positive cases and all adversarial cases to pass. A passing local fixture does not certify live Preprod source completeness or deployment approval.

## 11. Current code boundary — what exists and what is missing

| Existing artifact | Current behavior evidenced in repository | Producer-contract gap |
|---|---|---|
| `PRE-RICH/src/PreRichCardanoObservationProjection.ts` | Receives aggregate `safetyCapital`, `reserveProtection`, and `mandatoryFutureCosts` values as primitive `bigint` inputs. | No atomic source schedule or item-level classification is part of the projection input. |
| `src/preRichIssueAdmissionBridge.ts` | `ProtectedCapitalProvenance` carries a generic `sourceReference`, six components, unresolved reserve/count, and total; validates sum, non-negativity, and V3 carrier binding. | No per-item identities, source/verification digest list, payer/beneficiary, R7 cell, valuation, or no-overlap witness. |
| `Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts` | Requires exactly six non-negative component values and checks aggregate consistency / source bindings. | It validates aggregate shape and binding, not economic completeness or the meaning of each aggregate. |
| `IMMORTAL/state/EconomicStateV3.hs` / kernel | Stores six component values and includes each once in the arithmetic ProtectedCapital sum. | Arithmetic inclusion does not prove source provenance, R7 coverage, or semantic disjointness. |
| `IMMORTAL/conformance/ProtectedCapitalConformance.hs` | Covers arithmetic/state properties and preservation behavior. | Does not establish the complete real-world source population or item-level overlap absence. |
| B1 Pool / ticket state | Provides ticket, pending liability, unresolved reserve/count, and locked Jackpot aggregates. | Cross-source identity-level reconciliation and complete source census remain evidence obligations. |

The generic source reference and carrier signature remain useful integrity bindings. They are not substitutes for semantic evidence. The current Issue admission witness must not be described as item-level certified provenance.

## 12. PRE-RICH-specific constraints retained

### 12.1 Ticket price reserve and worst-case exposure

For every unresolved ticket, preserve both facts without adding both to ProtectedCapital:

- face-price reserve attribute used for reconciliation: the exact ticket price in USDM;
- deterministic protection valuation: the existing PRE-RICH 500× maximum normal payout exposure.

The sum of ticket face prices must reconcile to B1 `ppUnresolvedReserve` / V3 `v3UnresolvedReserve`, and ticket count must reconcile to the corresponding aggregate. The deterministic exposure must use the same complete unresolved set and canonical class-price profile. This contract does not change the multiplier or introduce a statistical coefficient.

The Game Economy statistical expression `N μ + Z σ √N` remains a separately typed statistical-risk model. It must not be copied into `ReserveProtection` or added to deterministic worst-case exposure without an explicit governed profile decision.

### 12.2 Treasury and Pool boundary

The observed Ticket Issue sale path distinguishes Treasury payment from B1 PrizePool liquidity:

- ticket-sale payment is directed to Treasury;
- B1 ticket reservation preserves `ppTotalLiquidity` while increasing unresolved reserve/count;
- therefore Ticket Issue is not proof that the same sale proceeds have increased direct-Pool EEV;
- Treasury assets remain outside `PRE-RICH-EEV-USDM-DIRECT-V1` until an actual qualified transfer places value into the exact measured Pool UTxO;
- when Treasury funds the Pool, the producer must record the transfer as one asset movement, not duplicate the same asset as both Treasury and Pool value.

The EEV profile remains narrow and unchanged by this contract.

### 12.3 Legacy Treasury splits

The historical 75/10/10/5 distribution percentages remain non-canonical. Legacy percentage fields or code paths do not prove a mandatory maintenance reserve, future cost, or protected component. A distribution enters the producer only when an actual governing rule/commitment, payer, beneficiary, trigger, and amount valuation are established.

## 13. PA1–PA7 closure contribution

| Proof obligation | What this contract supplies | What still must be produced |
|---|---|---|
| PA1 — concrete partition | Atomic item model, exactly-one R7 allocation, typed component map | Approved semantic mapping for SafetyCapital, ReserveProtection, and each future-cost class. |
| PA2 — exhaustive coverage | Source manifest and census-completeness requirements | Actual exhaustive census over all relevant assets, tickets, and protocol-borne commitments. |
| PA3 — disjointness | Stable identities, overlap sets, lifecycle transition ledger, cross-cost reconciliation | Replayable no-overlap witness across all actual items and six aggregate components. |
| PA4 — deterministic valuation | Amount/unit and valuation-rule evidence requirements | Approved deterministic derivations/bounds for all non-zero protection and future-cost items. |
| PA5 — transition deltas | Before/after transition evidence schema and exact lifecycle mappings | Complete profile operation set and replay of each material transition, including non-ticket allocations. |
| PA6 — L6 empty | Explicit fail-closed rules and unknown-commitment handling | Evidence that the actual source census has no unrepresented material commitment. |
| PA7 — adversarial review | Required mutation/replay test matrix | Executed evidence packet and independent review of completeness/overlap attacks. |

The producer contract narrows the implementation target; it does not close PA1–PA7 by documentation alone.

## 14. Implementation sequence and stop conditions

The implementation should proceed in this order, with each stage producing evidence before the next is treated as complete:

1. **Source registry and census manifest:** enumerate authoritative sources, scopes, freshness rules, and completeness/watermark behavior.
2. **Atomic ledger for already typed items:** implement exact ticket, crystallized payout, and locked Jackpot identities and aggregate reconciliations without changing their economic semantics.
3. **Cost commitment ledger:** normalize observations separately from actual protocol-borne future commitments; preserve links to Fs/Fr/Fc and OPEX evidence.
4. **Protection-requirement qualification:** do not activate SafetyCapital or ReserveProtection producer values until their semantic rules, R7 mapping, source and no-overlap evidence are governed.
5. **Aggregate derivation and replay:** derive the six components from qualified allocations, compare with existing aggregates, and generate a deterministic signed evidence packet.
6. **Admission integration proposal:** only after the standalone producer passes adversarial replay should a separate, minimal code change be proposed for the admission boundary.

Stop before stage 6 if source completeness, R7 mapping, valuation, or disjointness remains unresolved. No direct change to V3, Reveal, validator, or on-chain semantics is authorized by this contract.

## 15. Final status

**Producer contract: DEFINED AT DOCUMENTATION LEVEL.**  
**Item-level producer implementation: PARTIAL — pure ticket-ledger builder, Koios Preprod page enumerator, and read-only census CLI are implemented; provider attestation/snapshot pinning, L2 lifecycle source, full producer qualification, and aggregate admission integration are NOT IMPLEMENTED.**  
**SafetyCapital / ReserveProtection qualification: OPEN.**  
**MandatoryFutureCosts itemization: OPEN.**  
**PA1–PA7: NOT CERTIFIED.**  
**Current Issue admission aggregate witness: useful integrity/binding evidence, NOT item-level economic provenance.**

The pure ticket-ledger builder is now present at `PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts`, with adversarial conformance tests at `PRE-RICH/tests/conformance/PC-item-ledger-source-census.conformance.test.ts`. It reconciles a caller-supplied census against L1/L3 B1 aggregates and deliberately marks source completeness authority as unverified. It preserves exact USDM sub-units for L1 items; if the aggregate cannot be represented as a whole IMMORTAL reference unit, it returns a blocking finding rather than rounding/truncating. Two 2.5-USDM items can be aggregated exactly as 5 reference units, while a single 2.5-USDM aggregate remains unrepresentable by the current integer bridge. This does not change the current projection or V3 unit semantics. The next valid engineering deliverable is the separate read-only PrizeValidator address enumerator with provider-specific pagination and signed source-manifest verification. It must report unresolved sources and classification gaps rather than manufacture values for them.


## 16. Follow-on provider enumerator and live-ticket source boundary

The branch now contains a provider-specific read-only implementation:
- relayer/koiosProtectedCapitalSourceCensus.js
- relayer/koiosProtectedCapitalSourceCensus.test.js
- audit/cardano-integration/preprod-protected-capital-census.mjs
- PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts
- PRE-RICH/tests/conformance/PC-item-ledger-source-census.conformance.test.ts

The Koios reader pages PrizeValidator and B1 Pool UTxOs with explicit limit/offset and exact numeric Content-Range totals, resolves DatumHash-only records, retains response/datum digests, checks the reported Preprod tip before and after, and produces a local canonical source manifest. The CLI derives the deployed script topology from the supplied deployment environment, decodes the 23-field PrizeDatum and 8-field B1 Pool datum, retains unclassified outputs, and writes a read-only evidence packet. No transaction is signed or submitted.

**Provider trust remains open:** tip stability and page-total reconciliation do not pin all requests to the same Koios backend/database snapshot. The manifest explicitly reports providerAttestationVerified=false, providerSnapshotPinned=false, and sameBackendSnapshotVerified=false. Its digest is a local integrity digest, not a Koios signature or independent proof of source completeness.

**Ticket identity/custody:** the atomic Issue path delivers the Ticket NFT to the buyer and creates a separate PrizeDatum output at the PrizeValidator address. The census therefore takes the stable ticket identity from pdTicketPolicy/pdTicketName inside the datum; it does not expect the NFT to be held by the PrizeValidator UTxO.

**Lifecycle mapping:** a live positive Revealed payout remains L1 until Claim or valid Expire; losing Reveal maps L3 → L5 under the existing item-level lifecycle contract even while the datum may remain live until technical expiry; a positive Claimed datum maps to L4. Expire consumes the PrizeDatum UTxO, so an expiry event absent from the live scan requires transaction-history replay.

**Unit handling:** exact USDM sub-units are retained for each item. Fractional values such as 250 sub-units (2.5 USDM) are never rounded/truncated; a non-integral aggregate-to-reference-unit conversion is a blocking finding.

**Tests:** 15 Vitest item-ledger cases and 19 native Node Koios-reader tests are authored and wired into GitHub Actions. They have not yet been confirmed passing on an exact current-head run. The Preprod CLI has not been executed with current deployment configuration, and no live census has been produced.

Accordingly this implementation advances the engineering path but does not certify source completeness, L2, SafetyCapital, ReserveProtection, MandatoryFutureCosts, full ProtectedCapital, or PA1–PA7.

The item-ledger lifecycle classification follows the existing R7 mapping: a positive unpaid Reveal remains L1; a losing Reveal moves L3 → L5 (the PrizeDatum may remain live until technical expiry); Claim moves the accepted payout L1 → L4; technical Expire consumes the PrizeDatum and requires transaction-history replay to prove the resulting historical L5 transition.

The source census identifies a ticket by (pdTicketPolicy, pdTicketName) inside PrizeDatum. It does not expect the Ticket NFT in the PrizeValidator UTxO: the atomic Issue flow sends that NFT separately to the buyer.

## 17. CIP-32 inline datum and Koios datum_info handling

The census reader distinguishes a hash-reference datum from an inline datum:
- for a datum hash reference, Koios /datum_info returns the hash field and CBOR bytes; the reader recomputes Cardano Plutus datum hash with BLAKE2b-256 and requires an exact match;
- for a CIP-32 inline datum, inline CBOR bytes are present in the UTxO output itself and a separate datum_hash is not required. The reader computes a local digest for evidence, marks the hash comparison as INLINE_DATUM_HASH_NOT_APPLICABLE, and the CLI accepts it only when the source row is explicitly inline and has bytes;
- if neither a verified hash-reference datum nor an inline datum is available, the row remains missing/unclassified and the CLI stops.

The manifest digest binds datumBytesAvailableForAll, datumHashComparisonsVerified, datumHashComparisonRequiredCount, datumHashMismatchCount, and inlineDatumWithoutHashCount. Provider attestation, query snapshot pinning, and same-backend verification remain false.

Sources: CIP-32 and the Koios datum_info response type (hash, bytes). This prevents a false failure on the protocol's own inline PrizeDatum/Pool outputs without presenting inline bytes as a hash-reference proof.


### Latest test-bearing CI run

Run [41407914884](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41407914884) is queued on `fa096850801a4738648bb307673c2333bf0bbaa3` and contains the current 19 Node Koios-reader tests and 15 Vitest item-ledger tests. The current branch is eight commits ahead of that queued head; the compare delta consists only of Ogmios observer/workflow and documentation changes. The Koios reader, item-ledger builder, CLI and their conformance test files are unchanged since the queued head. No success is claimed until run 41407914884 completes.
