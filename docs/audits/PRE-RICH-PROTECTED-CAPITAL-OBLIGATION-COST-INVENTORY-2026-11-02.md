# PRE-RICH — ProtectedCapital Obligation & Cost Inventory

**Date:** 2026-11-02  
**Branch:** `work/immortal-green-closure`  
**Audited HEAD before this document:** `8c19fbe7218e63b2691ea30f3875567b09b41baf`  
**Status:** INVENTORY / RECONCILIATION — NOT CERTIFIED  
**Scope:** Current PRE-RICH obligations, assets, protocol-borne future costs, and their relationship to `SafetyCapital`, `ReserveProtection`, and `MandatoryFutureCosts`.  
**Change class:** Documentation only. No economic constants, code, V3, Reveal, validators, workflows, deployment, or on-chain state are changed.

---

## 1. Executive result

The existing sources allow a useful inventory of the economic items that may affect ProtectedCapital. They do **not** yet establish a complete, authoritative, duplicate-free producer for all such items.

This audit separates four kinds of records that must not be collapsed:

1. **Accepted obligations / commitments** — an enforceable economic right or future outflow.
2. **Risk protection requirements** — capital buffers required by a declared deterministic or statistical policy.
3. **Execution and operating costs** — amounts observed or benchmarked, which become protected future costs only when the protocol/profile has actually assumed them.
4. **Asset and liquidity movements** — value entering or leaving Treasury/PrizePool; a transfer between protocol-controlled UTxOs is not new protocol value.

### Gate summary

| Area | Current finding |
|---|---|
| L1 crystallized winning liabilities | Concrete B1/V3 representation exists; population and source reconciliation still required. |
| L2 conditional allocation / Jackpot | Locked Jackpot is a candidate L2 item after authorized funding; payout must transfer it to ordinary liability exactly once. |
| L3 unresolved ticket exposure | Deterministic PRE-RICH 500× derivation exists if the unresolved-ticket population is complete and authoritative. |
| Unresolved ticket reserve | Price-sum accounting/reconciliation input; not a second ProtectedCapital addend. |
| SafetyCapital | Required PrizePool safety-capital concept is recognized; concrete source, derivation, and perimeter remain unproven. |
| ReserveProtection | Protected category exists; its relation to statistical reserve, unresolved accounting reserve, CAR, and other buffers remains untyped/unproven. |
| MandatoryFutureCosts | Only genuine protocol-borne commitments qualify; complete item inventory, bounds, and disjointness from Fs/Fr/Fc remain open. |
| Sale proceeds / Treasury / PrizePool | The on-chain sale path pays Treasury and reserves the ticket in B1 without increasing PrizePool liquidity. Treasury assets are outside the current direct-Pool EEV profile until separately transferred/qualified. |
| Cardano execution and OPEX | Evidence framework exists; numerical benchmark and deployment cost-bearer classification remain open. |

**Overall:** this inventory narrows PA1–PA7 and PC-01/PC-02/PC-04, but does not certify them.

---

## 2. Canonical accounting boundary

The current PRE-RICH implementation computes:

```text
ProtectedCapital =
    CrystallizedLiabilities
  + WorstCaseExposure
  + SafetyCapital
  + ReserveProtection
  + LockedJackpot
  + MandatoryFutureCosts

RawSurplus = max(0, EEV - ProtectedCapital)
C          = EEV - ProtectedCapital
```

The six-term code sum is an implementation decomposition. R7 still requires each underlying obligation to map to exactly one canonical commitment class, with exhaustive coverage and disjointness evidence.

For PRE-RICH the current candidate two-sided partition is:

- **L1:** crystallized, accepted but unpaid winning payouts;
- **L2:** authorized conditional future allocation, with funded-and-locked Jackpot as the current candidate;
- **L3:** unresolved tickets, valued at the deterministic maximum normal payout under the PRE-RICH profile;
- **L4/L5:** settled / expired items, removed from the live protected commitment set after the final transition;
- **L6:** any material but unrepresented or unclassifiable obligation; executable admission must fail closed.

The accounting input `UnresolvedReserve` is not an additional L1/L2/L3 ProtectedCapital cell. It records unresolved ticket price value and reconciles the observed population; the corresponding deterministic worst-case requirement is a separate quantity.

---

## 3. Inventory of current economic obligations and protection items

| Item | Trigger / economic meaning | Current source or representation | Accounting treatment | Evidence status / unresolved point |
|---|---|---|---|---|
| **Crystallized winning payout** | A winning Reveal freezes an accepted payout that remains unpaid. | B1 `ppPendingLiabilities`; V3 `v3CrystallizedLiabilities`; exact ticket datum/status and payout amount. | **L1.** Enter once at crystallization; decrease once at Claim or valid expiry. | Aggregate representation exists. Must reconcile all revealed-winning/unclaimed tickets to the Pool aggregate and exact ticket identities. |
| **Unresolved ticket worst-case exposure** | Every Pending/BeaconReady ticket may still produce a payout up to the PRE-RICH maximum. | Ticket population + canonical class price + unresolved status; V3 per-class state; kernel `worstCaseExposure`. | **L3.** `500 × Σ(classPrice × unresolvedCount)` for the PRE-RICH profile. | Derivation is deterministic. Completeness of the ticket population and authoritative status set remain required. |
| **Unresolved ticket price reserve** | Accounting representation of the face prices of unresolved tickets. | B1 `ppUnresolvedReserve`; V3 `v3UnresolvedReserve`; ticket `pdPriceUsdm` values. | Reconciliation/liquidity input: `Σ(ticket price)`. **Not another ProtectedCapital addend.** | B1 cross-checks sum and count against tickets. Do not add it again beside worst-case exposure. |
| **Locked Jackpot** | A conditional application allocation becomes binding after the authorized funding transition and is locked until the winning transition. | B1 `ppLockedJackpot`; V3 `jsLockedAmount` and Jackpot lifecycle; approved Jackpot funding state. | Candidate **L2** while locked. Funding is constrained by `NewJackpot <= RawSurplus` and the post-state Economic Gate. | Policy is defined; authoritative funding transition / live on-chain lifecycle evidence remains open. Prove no amount is simultaneously in another PC cell. |
| **Jackpot payout after win** | The locked balance is paid once; the paid amount becomes an ordinary crystallized/pending payout obligation. | Jackpot state transition + payout transaction + B1/V3 post-state. | Move the same amount from **L2 → L1**. Reduce locked Jackpot and create the corresponding liability atomically. | Explicit policy lifecycle. A state that counts the same amount as both locked Jackpot and crystallized liability is duplicate accounting. |
| **SafetyCapital** | Required PrizePool safety capital / protected safety buffer. | V3 `v3SafetyCapital`; projection input; universal state field. | Intended ProtectedCapital component; canonical L1/L2/L3 cell and exact perimeter not yet instantiated. | Semantic label exists. No concrete producer, full derivation, authoritative source, or disjointness witness established. |
| **ReserveProtection** | A protected reserve/buffer required by the applicable economic/risk policy. | V3 `v3ReserveProtection`; projection input; universal state field. | Intended ProtectedCapital component; exact commitment class and relation to other reserve concepts are open. | Do not assume this is the B1 unresolved ticket reserve, the statistical reserve formula, CAR, or a copy of SafetyCapital. Typed meaning and valuation remain open. |
| **MandatoryFutureCosts** | Future economic outflows genuinely assumed by the protocol/profile. | V3 `v3MandatoryFutureCosts`; `ProtectedCapitalProvenance`; future-cost declarations and accepted cost evidence. | Protected commitment only to the extent the protocol is actually obligated to bear it. The item must be assigned to the appropriate R7 commitment class by its trigger/commitment semantics. | Field exists; complete schedule, authoritative contracts, cost bounds, and non-overlap with `Fs/Fr/Fc` and OPEX remain open. |
| **Other material commitments** | Any promised or mandatory outflow not represented in the six-term map. | Complete protocol/application contract inventory, Treasury/Pool state, ticket lifecycle, deployment/operational commitments. | **L6 until classified.** No executable state may silently omit it. | Completeness is not demonstrated; absence of an observed field is not proof of zero obligation. |
| **Settled payouts** | A crystallized right has been paid. | Canonical Claim transaction / settled ticket state. | **L4.** No longer a live protected liability after exact settlement. | Requires exact-once transition evidence and replay/history. |
| **Expired rights** | A pending ticket or unpaid right reaches the final expiry transition. | Ticket `expiresAt`, authoritative time interval, B1 expiry accounting. | **L5.** Release the exact represented reserve/liability once; no later reveal may revive a claim. | Semantic finality is closed; ledger-aligned expiry conformance remains separate. |

### 3.1 Ticket lifecycle: one ticket, one live commitment class

The expected commitment progression is:

```text
Unresolved ticket (L3)
   ├── winning Reveal ──> crystallized unpaid payout (L1)
   ├── losing Reveal ───> no payout liability; unresolved exposure released
   └── final Expire ────> expired right (L5)

Crystallized unpaid payout (L1)
   ├── Claim ───────────> settled (L4)
   └── valid Expire ────> expired/released (L5)
```

A ticket cannot remain in the unresolved population after its Reveal has crystallized the outcome. A paid or expired right cannot be revived. This lifecycle is also the anti-double-counting rule between L3, L1, L4, and L5.

### 3.2 Jackpot lifecycle: one locked balance, one future payout

The PRE-RICH policy defines a state-derived Jackpot floor and funding need. It does not define a fixed allocation percentage. Once funded and locked, the balance is protected. On the winning transition, the full current locked balance is paid exactly once and becomes an ordinary crystallized/pending liability.

Therefore, for the same economic amount:
- before funding: no locked Jackpot liability exists;
- after funding and before winning: the amount is represented as locked Jackpot / candidate L2;
- after the winning payout becomes due: it leaves the locked Jackpot bucket and enters the unpaid payout liability / L1;
- after settlement: it leaves L1 and is settled / L4.

No transition may leave the same amount active in both L2 and L1.

---

## 4. Cost and OPEX inventory

The fee/cost decisions distinguish an observed execution cost from a future economic cost assumed by the protocol:

```text
ObservedExecutionCost != MandatoryFutureCost
OPEX_observed         != OPEX_committed
```

The available benchmark framework distinguishes:
- `OBSERVED_EXECUTION_COST` — measurement of a specific execution;
- `BENCHMARK_COST` — reproducible measurement over declared fixtures;
- `MANDATORY_COST_DECLARATION` — a future cost assumed by the profile/protocol contract;
- `LOCKED_VALUE` — recoverable or structurally locked value, not automatically consumed cost;
- `OPTIONAL_INFRA_COST` — optional service cost, not protocol-borne by default.

| Cost class | Action / source | When it may enter `MandatoryFutureCosts` | What must be established | Current status |
|---|---|---|---|---|
| **Fs(P)** | SALE / MINT settlement or transaction cost | Only when the profile makes the cost a future obligation of the protocol. | Exact payer and beneficiary; action scope; payment/consumption; unit; deterministic or declared safety bound; relationship to the per-ticket cost surface. | OPEN — benchmark and payer/commitment classification. |
| **Fr(P)** | REVEAL_LOSS / REVEAL_WIN execution or settlement cost | Only when the protocol bears the reveal cost under an explicit contract. | Same fields as Fs; distinguish losing reveal from winning reveal where the execution shape/cost differs. | OPEN — benchmark and payer/commitment classification. |
| **Fc(P)** | CLAIM settlement cost | Only when the protocol promises to pay the claim cost. | Payer; claimant/beneficiary; action scope; amount/unit; bound and evidence; proof that frozen payout is not silently reduced. | OPEN — benchmark and payer/commitment classification. |
| **EXPIRE execution cost** | Permissionless expiry transaction | Only if the protocol itself commits to pay the cost; a caller-paid transaction fee is not automatically OPEX. | Who submits and pays; whether a protocol reimbursement exists; exact expiry action shape. | OPEN — measure if used / determine cost bearer. |
| **Treasury distribution cost** | Treasury → PrizePool or policy distribution | Only if the protocol has an actual obligation to execute/pay for this distribution. | Required frequency/trigger; payer; beneficiary; amount bound; transaction and operational evidence. | OPEN — benchmark / distribution OPEX only if mandatory. |
| **Beacon / round observation and publication** | Round-level observation/publication infrastructure | Only where the declared architecture requires the protocol to fund the service. | Required service, per-round trigger, provider/beneficiary, cost vector, duration/horizon, failure/recovery obligation. | OPEN — architecture-dependent. |
| **Baseline OPEX** | Persistent required service capacity | Only if a contractual or normative commitment makes the baseline cost protocol-borne. | Service and scope; actual payer; time horizon; conservative bound; service termination/revalidation conditions. | OPEN — no arbitrary preinitialized OPEX number. |
| **Event-processing OPEX** | Ticket/event processing | Only for required processing services the protocol has assumed. | Cost per declared event shape; frequency/volume domain; payer; reproducible measurements. | OPEN — event-proportional evidence. |
| **State-query OPEX** | Required state queries / observation operations | Only if required by the protocol contract and protocol-borne. | Query class, volume/domain, provider, payer, reproducible evidence and bound. | OPEN — source/architecture-dependent. |
| **Recovery OPEX** | Required recovery after an operational failure | Only if the protocol has assumed the recovery service/cost. | Failure domain, recovery obligation, payer, bounded action space and evidence. | OPEN — failure/recovery domain not fully closed. |
| **Relayer / batcher compensation** | Explicit third-party compensation | Only if a protocol/profile contract makes the protocol the payer. | Recipient, amount rule, action/volume scope, signed commitment, and whether it is already part of another fee. | OPEN — no implicit protocol obligation. |
| **Cardano TxFee / script execution** | Chain execution of a transaction | Not automatically. These are Adapter measurement/execution costs; only the contractually protocol-borne portion can become a future protected cost. | Separate actual transaction fee, script execution measurement, fee payer and any protocol reimbursement; prove no nested component is summed twice. | OPEN — actual Cardano benchmark values. |
| **MinUTxO / locked ADA / recoverable value** | Value required to create/maintain an output | Not automatically. Recoverable or transferred value is not the same as value consumed as OPEX. | Whether the value is recoverable, who owns it, release event, and whether it is truly irreversibly consumed. | Explicitly separate from spent cost; no automatic OPEX classification. |
| **Optional frontend/backend or infrastructure** | Optional service chosen by operator or user | No, unless the protocol explicitly assumes the obligation. | Mandatory status, contracting party, payer, and scope. | Exclude by default. |
| **Protocol Usage Fee** | Separate protocol fee contract, target `F*(S,A,Profile)` | Not automatically. A fee paid by the user is an inflow/settlement contract, not automatically a protocol future outflow. | Fee-bearing action class, payer, settlement asset/reference, beneficiary, effective version and no-retroactivity rule. | Exact amount/action classes/settlement policy remain deployment-level OPEN items. |

### 4.1 The PRE-RICH cost surface is not a second PC ledger

The application cost surface remains:

```text
X(P) = 499P + Fs(P) + Fr(P) + Fc(P)
```

It is used by the PRE-RICH capacity/hysteresis requirement. It is not itself a new ProtectedCapital component or a second asset/commitment ledger.

However, an action cost may also be represented as a future obligation in `MandatoryFutureCosts` when the protocol bears it. Where the same underlying future payment appears in both the capacity cost surface and the ProtectedCapital component map, the profile must state the distinct role of each use and prove that no duplicate payment/commitment is counted. The reconciliation must include at least:

- action class and exact action shape;
- payer and beneficiary;
- ticket/customer cohort or operational cohort;
- amount, unit, asset and valuation reference;
- due trigger and horizon;
- whether the payment is already included in `Fs`, `Fr`, `Fc`, maintenance/OPEX, or another protection field;
- whether the amount is observed, benchmarked, optional, conditional, or committed.

Do not add `Fs/Fr/Fc` to `MandatoryFutureCosts` merely because a benchmark observed them. Do not assume they are absent from `MandatoryFutureCosts` merely because they occur in `X(P)`. The protocol-borne commitment and the accounting role must be explicitly reconciled.

### 4.2 Cost-vector overlap

The benchmark sources identify a cost vector including transaction fee, execution cost, locked value, relayer/batcher compensation, and other explicit cost. These are separate evidence dimensions, not automatically additive cash outflows.

For example, script execution may be a measured contributor to the Cardano transaction fee rather than a second independent payment. The cost packet must show the actual decomposition and avoid summing a fee total and one of its internal measurement components twice.

---

## 5. Important source-boundary findings

### 5.1 Sale payment enters Treasury, not PrizePool EEV at Issue time

The current sources establish the following:

1. `PRE-RICH/docs/GAME-ECONOMY.md` defines the intended sale as one atomic/equivalent transition comprising ticket mint, Treasury payment, and PrizePool unresolved-ticket reservation. It also states that player payments enter protocol-controlled Treasury.
2. `plutus/MintPolicy.hs` validates an exact USDM-equivalent payment to the configured Treasury output through `Economic.totalUsdmValue`, and separately validates the Pool reservation.
3. The same sale path requires the Pool's physical `Value` before and after reservation to be equal; `ppTotalLiquidity` remains unchanged while `ppUnresolvedReserve` and the unresolved ticket count increase.
4. The B1 `TicketIssued` transition likewise leaves `ppTotalLiquidity` unchanged and increases unresolved reserve/count by the exact ticket price.

**Consequence:** ticket-sale proceeds are not automatically an increase in the B1 PrizePool's EEV at the instant of Issue. The sale payment is directed to Treasury; the Pool records the unresolved ticket reservation. Any later Treasury-to-PrizePool funding must be evidenced as a separate physical value movement.

Under the current `PRE-RICH-EEV-USDM-DIRECT-V1` profile, EEV is limited to direct tUSDM physically present in the exact live B1 PrizePool UTxO. Treasury balances, non-tUSDM ticket payment assets, ADA, PRE, and other UTxOs do not enter that EEV merely because they belong to the same protocol.

This avoids a false assumption that a sold ticket price is already part of PrizePool liquidity. It also creates a future cross-UTxO reconciliation requirement if the EEV perimeter is ever expanded: the same assets must not be counted in Treasury and PrizePool simultaneously.

### 5.2 Treasury funding is the physical liquidity movement

The B1 `FundTreasury` action recomputes the Pool's liquidity value from the actual continuing Pool output, requires the datum's `ppTotalLiquidity` to equal that recomputed value, and requires liquidity to increase. It preserves the current liabilities, unresolved reserve/count, locked Jackpot and other unchanged accounting fields during this funding operation.

This is the relevant value movement for the PrizePool EEV view. It must be tied to the exact observed Pool UTxO and direct tUSDM asset identity required by the EEV profile. A Treasury accounting balance or historical deposit event is not a substitute for observing the current physical Pool output.

### 5.3 Statistical reserve name collision

The current repository has two semantically distinct quantities using the phrase `UnresolvedReserve`:

- B1/V3 accounting reserve: exact sum of ticket prices for unresolved tickets, `Σ(ticket price)`;
- Game Economy section 4 statistical model: `N × μ + Z × σ × sqrt(N)`, explicitly described as a statistical risk model rather than a deterministic guarantee.

The current Economic Canon distinguishes **unresolved accounting reserve**, **worst-case exposure**, and **statistical reserve** as separate concepts. It also states that worst-case and statistical analysis are not interchangeable or automatically additive.

**Reconciliation rule for this inventory:**
- refer to the B1/V3 field as **UnresolvedTicketPriceReserve** when explaining its concrete on-chain accounting meaning;
- refer to `Nμ + Zσ√N` as **StatisticalRiskReserve**;
- keep deterministic `WorstCaseExposure` separately named;
- do not map `StatisticalRiskReserve` into `v3ReserveProtection` without an explicit typed profile decision, model/horizon/confidence declaration, and non-overlap proof.

This is a naming and profile-mapping issue; this audit does not select a value for `Z` or change any risk policy.

### 5.4 Jackpot and Treasury historical percentages

The current PRE-RICH Game Economy and decision records state that the historical `75/10/10/5` distribution is non-canonical and that no fixed Jackpot allocation percentage is canonical. The current `plutus/Treasury.hs` still contains percentage-based distribution logic through legacy datum fields.

Therefore:
- the legacy Treasury percentages are not a valid source for `SafetyCapital`, `ReserveProtection`, or `MandatoryFutureCosts`;
- `tdMaintenancePct` is not, by itself, a quantified mandatory future cost or a reserve proof;
- any remaining legacy distribution code is implementation/migration evidence, not a replacement for the current liability-first / ProtectedCapital rules.

### 5.5 EffectivePool is not ProtectedCapital

B1 computes:

```text
EffectivePool =
    ppTotalLiquidity
  - ppPendingLiabilities
  - ppUnresolvedReserve
  - ppLockedJackpot
```

That is an immediate-liquidity view using the unresolved ticket price reserve. The deterministic worst-case solvency requirement is evaluated separately through the 500× exposure. `EffectivePool` is not an extra ProtectedCapital term, and `RawSurplus` remains a derived residual rather than an asset or commitment cell.

---

## 6. What can and cannot be sourced today

| Source family | Items it can support | What it does not establish |
|---|---|---|
| Exact B1 PrizePool UTxO + direct tUSDM identity | Current Pool physical tUSDM for the narrow EEV profile; Pool liquidity datum cross-check. | Treasury assets, off-Pool assets, ADA/PRE liquidation, completeness of all protocol obligations. |
| Ticket datums + complete authoritative ticket population | Unresolved tickets, class/price, lifecycle status, and class-derived worst-case exposure. | Future OPEX, safety buffers, or other commitments unrelated to tickets. |
| B1 Pool datum + ticket lifecycle reconciliation | Pending winning liabilities, unresolved price reserve/count, locked Jackpot amount. | Independent category proof for SafetyCapital / ReserveProtection / MandatoryFutureCosts. |
| Jackpot state + authorized funding transition | The amount and status that is actually locked as Jackpot. | Any unfunded future Jackpot target as if it were already locked capital. |
| Cost evidence packet / benchmark | Observed cost vector for a specified fixture, version, shape and environment. | Protocol obligation or future safety bound unless a separate commitment and derivation rule is accepted. |
| Signed protocol/profile cost declaration | A future cost the protocol has committed to bear, within the declared scope. | Complete coverage of all costs unless the inventory itself is exhaustive and versioned. |
| V3 carrier / authority signature | Exact state binding and integrity of the carrier update. | Economic truth of a field's category, completeness of the underlying obligation population, or absence of overlap. |
| Legacy Treasury datum / percentage validator | Historical/compatibility execution path. | Current normative distribution policy or proof of maintenance cost/reserve. |

---

## 7. Required item-level evidence schema

The current aggregate `ProtectedCapitalProvenance` object carries six numbers, a generic source reference, two accounting inputs and a total. It does not yet provide the item-level partition witness needed by PA1–PA7.

Each future obligation, reserve requirement, or cost item used to derive a component should have:

1. stable `itemId` / obligation or cost identifier;
2. one canonical accounting component and R7 class;
3. amount, asset, unit and conversion/valuation reference;
4. source reference, verification reference, snapshot time/slot, digest and freshness/revalidation rule;
5. derivation / policy / profile / contract version;
6. payer and beneficiary / recipient;
7. action/event trigger and applicable ticket or operational cohort;
8. due horizon and status: observed, benchmarked, optional, conditional, committed, crystallized, settled or expired;
9. explicit `protocolBorne` decision and its authority;
10. mapping to `Fs`, `Fr`, `Fc`, Maintenance/OPEX, transaction execution, locked value, or an explicit exclusion;
11. delta/release behavior when created, settled, expired, cancelled or reclassified;
12. a disjointness witness proving the same economic payment/obligation is not represented elsewhere.

A source reference to the V3 carrier alone is a state binding, not an independent source proof for each component. A numeric equality or checksum is an integrity check, not an economic classification proof.

---

## 8. Smallest safe completion sequence

No code or economic rule change is needed to complete this inventory. The next evidence work should proceed in this order:

1. **Freeze the nomenclature:** distinguish `UnresolvedTicketPriceReserve`, `WorstCaseExposure`, and `StatisticalRiskReserve` in the profile evidence vocabulary; do not silently remap an existing field.
2. **Reconcile the cash-flow path:** preserve the distinction between sale payment into Treasury, Pool reservation, and later physical Treasury-to-Pool funding. Bind all three to exact transaction/UTxO observations.
3. **Inventory L1/L2/L3 populations:** replay ticket status and Jackpot lifecycle to prove exactly one live class per item and complete coverage.
4. **Itemize protocol-borne future costs:** list each required operational/action cost with payer, beneficiary, trigger, horizon, amount/unit, commitment, and evidence. Keep observed and optional costs out of MandatoryFutureCosts.
5. **Reconcile the cross-boundary cost surface:** test every item against `Fs/Fr/Fc`, transaction execution, locked value, Maintenance and OPEX; prove no double commitment and no missing mandatory outflow.
6. **Resolve SafetyCapital and ReserveProtection semantics:** identify the source and derivation of each amount, then prove its separate economic perimeter. Do not set new coefficients or adopt statistical reserve values by inference.
7. **Produce the signed, replayable partition packet:** bind item inventory, valuations, source digests, versions, R7 classes and transition deltas to the exact pre-state / carrier and candidate post-state.
8. **Run adversarial omission and overlap replay:** missing obligation, duplicate cost, user-paid cost reclassified as protocol-borne, stale measurement, unreconciled Treasury/Pool transfer, Jackpot overlap, and unresolved reserve / statistical reserve collision must fail closed.

---

## 9. Source map

### Repository — inspected on `work/immortal-green-closure`

- [PRE-RICH Game Economy](../../PRE-RICH/docs/GAME-ECONOMY.md)
- [B1 PrizePool validator](../../plutus/B1PrizePool.hs)
- [Mint Policy / atomic sale](../../plutus/MintPolicy.hs)
- [B1 / Treasury datum types](../../plutus/Types.hs)
- [Legacy Treasury validator](../../plutus/Treasury.hs)
- [Economic kernel](../../IMMORTAL/kernel/EconomicKernel.hs)
- [ProtectedCapital component provenance audit](PRE-RICH-PROTECTED-CAPITAL-COMPONENT-PROVENANCE-2026-11-02.md)
- [PA1–PA7 profile mapping](PRE-RICH-PA1-PA7-PROTECTED-CAPITAL-PROFILE-MAPPING-2026-11-02.md)
- [C1 capacity / EEV / ProtectedCapital reconciliation](PRE-RICH-C1-CAPACITY-EEV-PROTECTED-CAPITAL-RECONCILIATION-2026-11-02.md)

### Notion — decision and evidence sources consulted

- [IMMORTAL — Economic Canon & Parameter Boundary Register v0.1](https://app.notion.com/p/3e2c4454d6d581e39ad6e764d162dbd7)
- [09 — Definitive Decision Register](https://app.notion.com/p/3d9c4454d6d5811e8bece49c16cf2c9d)
- [2026-09-21 — A1/A2/A3 Policy Closure — Ticket Expiry & Jackpot](https://app.notion.com/p/3e2c4454d6d5812c9514e16afeded763)
- [13 — Fee Amount Discovery, Cost Surface & First-Ticket Learning Constraint](https://app.notion.com/p/3e0c4454d6d581aabf29f21e688b4fb3)
- [14 — Fee Discovery Evidence Model, Benchmark Protocol & Parameter Update Rule](https://app.notion.com/p/3e0c4454d6d5811ab0d3fe7e93f18aab)
- [15 — Fee Benchmark Matrix, Worst-Case Cost Envelope & Safe First-Execution Contract](https://app.notion.com/p/3e0c4454d6d5812a951fd812d37ae11e)
- [16 — First-Execution Cost Harness, Evidence Schema & Cardano Measurement Plan](https://app.notion.com/p/3e0c4454d6d581b1b549f632ce614a26)
- [17 — Worst-Case Cost Envelope Derivation, Safety Bound & Fee Non-Blocking Proof](https://app.notion.com/p/3e0c4454d6d581938c8cd93439b34eeb)

**Research limitation:** Notion page search/fetch was available. Connected-workspace discussion search was not available because the connector requires Notion Business; this report does not claim that Slack or other connected discussions were exhaustively searched.
