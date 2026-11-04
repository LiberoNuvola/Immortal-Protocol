# PRE-RICH Treasury — Category Ledger Operational Specification

**Date:** 2026-11-04  
**Status:** IMPLEMENTATION / CONFORMANCE SPECIFICATION — NON-NORMATIVE POLICY ADDENDUM  
**Branch:** `work/immortal-green-closure`  
**Baseline inspected:** `69013f3701f6353df7a88481335e32c03de9134d`  
**Related source audit:** [PRE-RICH Treasury — Category Ledger & Flow Conformance Map](./PRE-RICH-TREASURY-CATEGORY-LEDGER-CONFORMANCE-MAP-2026-11-04.md)  
**Boundary:** PRE-RICH application accounting and Cardano implementation. This document does not amend IMMORTAL constitutional/kernel semantics, R7 v3.0.0, or any frozen PRE-RICH economic parameter.

## 1. Purpose and interpretation

This document turns the already-established PRE-RICH accounting direction into an implementation-facing conformance contract. It distinguishes:

1. **economic category** — what a value is assigned to and what it may fund;
2. **accounting state** — the authenticated balance, reservation, commitment and available amount attributed to that category;
3. **custody** — the actual UTxOs/scripts/addresses holding the assets;
4. **economic obligation or budget** — the claim, reserve, mandatory cost or authorized reward allocation the category supports;
5. **execution/evidence** — the transaction and independent observation proving the movement.

These are related but not interchangeable. A category label in a datum does not prove custody. A wallet balance does not prove category availability. A calculator input does not prove a Treasury debit. A destination address does not prove that the source category was authorized.

The target is **one PRE-RICH protocol-controlled Treasury with internal category accounting**, plus specialized contract-controlled custody positions such as B1 PrizePool. It is not a set of independent Treasury authorities and does not require all assets to sit in one physical UTxO.

The specification records existing policy and implementation gaps. It does not choose any allocation percentage, create a new distribution trigger, grant an operator entitlement, or define an additional R7 delta.

## 2. Closed architectural baseline

The following are treated as established PRE-RICH application direction:

- Player payments enter the protocol-controlled Treasury; there is no personal founder/team/operator entitlement.
- The Treasury → PrizePool funding direction is protocol-controlled under `PRE-RICH/docs/GAME-ECONOMY.md` §15.
- The B1 PrizePool is a specialized custody/enforcement position for game liquidity and game liabilities, not a second general Treasury or independent economic authority.
- The Prize category is the source accounting position for PrizePool funding and winner claims. A Claim is not funded from an unspecified external budget.
- The PRE-holder staking model uses the same PRE-RICH Treasury accounting source; it does not introduce a second on-chain staking pool and does not lock holder PRE.
- Maintenance/OPEX is limited to costs that are both mandatory and actually assumed as protocol-paid obligations. Chain execution fees are not automatically Maintenance.
- The historical `75/10/10/5` split is HISTORICAL / NON-CANONICAL. No replacement percentage is inferred from legacy source.
- PRE-RICH holder staking, contributor/governance rewards, relayer compensation and game-winner payouts are distinct economic flows.

The current policy therefore does **not** leave an open choice between protocol-funded Treasury → PrizePool and arbitrary third-party funding. The open work is to make the already-specified source, category debit, destination credit and resulting state enforceable and independently reconstructible.

## 3. Category model: meaning, custody and current evidence

| Category | Economic meaning and permitted use | Custody / state currently found | Current gap |
|---|---|---|---|
| **Treasury intake / receipts** | Protocol-controlled receipt of player payments and other explicitly accepted inflows. Receipt is not, by itself, proof that the value is spendable by any category. | Issue creates a Treasury output with the ticket's exact USDM-equivalent settlement basket. Treasury may be represented by multiple UTxOs at the same script address. | No complete persisted category posting/reconciliation is demonstrated. The classification of a receipt into a spendable category must be authenticated; it cannot be inferred from the Treasury address alone. |
| **Prize** | PRE-RICH accounting source for PrizePool funding and game-winner claims. | B1 PrizePool singleton UTxO with datum fields for total liquidity, pending winning liabilities, unresolved-ticket reserve/count and locked Jackpot. | No production FundTreasury builder consuming an authenticated canonical Treasury source was found. The B1 validator does not prove Treasury provenance. Claim builder and validator disagree on the Pool's physical asset debit. |
| **Reserve / protection** | Protected accounting capacity for the obligations/exposures required by the PRE-RICH profile. It is not an unencumbered maintenance/reward budget. | B1 has `ppUnresolvedReserve`, `ppUnresolvedTicketCount`, and `ppLockedJackpot`. These fields represent different concepts and must not be collapsed. | No complete Treasury-side Reserve category ledger or reconciliation with R7 ProtectedCapital has been demonstrated. |
| **Jackpot (protected Prize sub-position)** | Funded/locked Prize-related capital; unavailable for ordinary claims, Maintenance, OPEX or Reward before its permitted payout transition. | `ppLockedJackpot` in the B1 PrizePool datum. | Field exists; all category/custody transitions and aggregate EEV treatment still require conformance evidence. It must be protected exactly once. |
| **Maintenance / OPEX** | Payment of mandatory costs the protocol has actually undertaken to bear. Future mandatory obligations enter protection before new discretionary promises. | No active Maintenance category balance, authenticated budget state or production spend builder was found in the audited PRE-RICH application path. | Missing opening balance, obligation/budget authority, beneficiary/service evidence and category debit path. |
| **Reward — contributor/governance** | A budget for separately authorized allocations. A Treasury balance alone does not create reward authority or a spendable reward budget. | A research-only IMMORTAL boundary exists on `work/b3-materios-provenance-evidence`: `ProtocolRevenueReceived → AccountingClassification → CertifiedRewardBudget → RewardAllocation`. | The research boundary is non-normative and is not a current PRE-RICH on-chain category or production implementation. PRE-RICH adoption and budget authority remain open. |
| **PRE-holder staking reward** | PRE-RICH-specific snapshot-based, non-custodial PRE distribution using the same Treasury accounting source. It is not contributor reward and not custodial staking. | `src/preStaking.ts` calculates entitlements from caller-supplied `PreTreasuryStakingAccount.availableBalance`; holder PRE remains in wallets. | Source amount, allocation rule, authenticated Treasury reader, snapshot cadence, eligibility, weighting and direct-vs-claim distribution remain open. The calculator neither posts a Treasury debit nor distributes funds. |
| **Relayer execution compensation** | Optional facilitator compensation only if separately authorized and bounded. It is not PRE-holder staking, contributor reward or game prize. | Legacy percentage calculation remains in source; current `treasuryWorker` is fail-closed and the RF8 test prevents signing/submission and use of the legacy calculator. | No active payment authority/path is established. Do not revive the historical percentage calculation. |

### 3.1 Reserve taxonomy — avoid double counting

The following are not synonyms:

- **unresolved-ticket reserve**: B1 accounting reservation for tickets that have not yet been revealed; it is not the full deterministic worst-case exposure;
- **worst-case exposure**: the PRE-RICH application bound over unresolved obligations;
- **pending winning liabilities**: crystallized, unclaimed payout commitments;
- **locked Jackpot**: separately protected Prize-related capital;
- **general Reserve protection**: any other profile-required protected capacity, which needs its own definition and evidence before it can be counted.

A single amount must not be counted in more than one of these positions. In particular, `ppUnresolvedReserve`, deterministic exposure and `ppLockedJackpot` cannot be treated as interchangeable balances or added without the profile's disjointness proof.

### 3.2 Reward taxonomy — do not collapse destinations

- **winner payout** is a Prize liability discharged from Prize/PrizePool accounting;
- **PRE-holder staking** is a PRE-RICH snapshot entitlement using the same Treasury accounting source;
- **contributor/governance reward** is a different reward-budget concept whose generic accounting boundary remains research/non-normative on the IMMORTAL branch;
- **relayer compensation** is optional execution facilitation and currently fail-closed.

No shared generic `Reward` scalar may silently aggregate these four flows.

## 4. Required accounting representation

The implementation must provide an authenticated category state inside the single PRE-RICH Treasury accounting model. The exact on-chain encoding is an implementation decision; the following are minimum semantic fields, not a mandate for one datum layout:

1. **Treasury identity** — canonical script hash/address, network/deployment identity, datum/version identity and the authenticated set of Treasury-controlled UTxOs.
2. **Category identity** — stable category and subcategory identifier, including asset identity. Prize, Reserve, Maintenance, general Reward, PRE staking and any optional relayer compensation must not share an ambiguous label.
3. **Balance state** — classified amount by asset, plus the amount already protected, committed or allocated. An amount is not available merely because it is physically held at the Treasury address.
4. **Source event** — receipt, internal reallocation, liability recognition, release, or final disbursement, with source UTxO/account state and provenance.
5. **Destination event** — destination UTxO or beneficiary, exact asset quantity, and the resulting category/custody state.
6. **Commitment link** — the liability, mandatory cost, reserve, reward budget or epoch entitlement created, consumed or released.
7. **Authorization** — applicable PRE-RICH policy/profile version, authenticated Economic Gate admission where required, and the precise input/state binding. Observer or relayer output is evidence, not spending authority.
8. **EEV membership** — explicit accounting-perimeter membership and duplicate-exclusion treatment for source and destination.
9. **Replay/concurrency key** — unique transaction/event/claim/epoch identity and proof that the prior canonical input or entitlement cannot be consumed twice.
10. **Independent reconstruction** — ledger/provider evidence, transaction hash/CBOR, datum/redeemer and a verifier that reconstructs classification from authenticated identities and events, not caller-supplied labels.

Balances must remain asset-typed. Heterogeneous assets may not be summed into a monetary category or EEV total without the selected, qualified valuation profile and its precision/rounding rules. The current Direct-USDM profile is not interchangeable with B1's generic Oracle basket valuation.

## 5. Operational transition matrix

| Transition | Required accounting effect | Physical custody effect | Current status |
|---|---|---|---|
| **Ticket Issue / sale** | Record one Treasury receipt; atomically create ticket identity and the B1 unresolved-ticket reserve/count entry. Do not treat the B1 datum update as a second asset inflow. Category posting of sale receipts must be explicit and authenticated. | Buyer settlement basket is paid to Treasury; B1 PrizePool physical Value remains unchanged while its reserve/count datum increases. | Source-level Issue path exists. It does not itself prove a completed Prize category transfer into B1. |
| **Treasury → PrizePool funding** | Debit the PRE-RICH Prize category and credit the PrizePool position by the same qualified amount; preserve all protected obligations and controls. | Consume a canonical Treasury-controlled input and create/continue the B1 PrizePool output with the funded physical Value and matching datum. | Policy direction is closed; source provenance/enforcement is missing. Current B1 validator checks Pool value/datum consistency and increased liquidity but does not prove the canonical Treasury source. Synthetic Yaci trace uses a test wallet. |
| **Reveal** | Release the exact unresolved-ticket reserve and recognize the crystallized winning liability (or zero payout) according to the frozen PRE-RICH lifecycle. | PrizePool physical Value is preserved; B1 datum changes reserve/count/liability. | Builder and validator represent this state transition; do not call the liability update an asset inflow/outflow. |
| **Claim** | Discharge the specific crystallized Prize liability exactly once and debit Prize/PrizePool accounting by the same amount. | PrizePool physical asset value must decrease by the certified claim amount while the claimant receives the exact settlement basket in the same atomic transaction. | Builder currently reduces datum liquidity/liability but continues the Pool UTxO with unchanged physical Value; validator requires the physical Pool value delta. Source-level mismatch, not a newly observed live Preprod failure. |
| **Expire** | Release the applicable unresolved reserve or unpaid winning liability exactly once; do not create a new payout right. | Current B1 action semantics preserve Pool physical assets for expiry; only accounting reservations/liabilities change. | Existing semantics/code path; category ledger reconciliation still required. |
| **Maintenance payment** | Recognize the mandatory protocol-paid obligation and consume the authorized Maintenance amount. | Pay only the authorized beneficiary/service from the Maintenance category/source. | No demonstrated active Maintenance budget or payment builder. Wallet-paid/user-paid chain execution costs stay outside this category unless the protocol has explicitly assumed them. |
| **PRE-holder staking distribution** | Consume an authenticated PRE staking-accounting amount and close one epoch entitlement exactly once. | PRE remains in holder wallets until the distribution/claim; no second pool or mandatory lock is created. | Calculator only; source, amount, epoch rules and settlement path remain open. |
| **Contributor/governance reward** | Create a budget only after the relevant accounting classification and explicit authorization; allocation must not exceed the certified budget. | Final payment consumes the authorized reward source. | Research boundary only; not adopted into PRE-RICH production accounting. |
| **Genesis PRE observation** | No category debit or credit; observation/admission only. | No movement of PRE and no automatic movement to PrizePool. | Read-only observer. Genesis PRE bootstrap is not PrizePool liquidity. |
| **Chain execution fee** | Remains an execution cost of the transaction submitter unless the protocol has actually undertaken the obligation. | Paid by the wallet/source specified by the Adapter transaction. | Do not relabel automatically as Maintenance/OPEX. |

## 6. EEV and two-sided conservation

Two accounting views must be kept separate:

**A. Current PRE-RICH Direct-USDM EEV profile.** It observes the qualified physical USDM asset in the exact B1 PrizePool UTxO and reconciles it with `ppTotalLiquidity`. It does not automatically include the other Treasury UTxOs. The profile's current scope must not be broadened by inference.

**B. Future aggregate Treasury + PrizePool perimeter.** If/when both custody positions are included in one aggregate EEV source-set, a Treasury → PrizePool transfer is an internal custody reallocation: the asset is counted once across the combined perimeter, not once at source and again at destination. The source debit and destination credit must reconcile.

For either perimeter, distinguish:

- an internal category/custody reallocation (no creation of aggregate EEV);
- a liability/reserve recognition or release (change on the commitment side);
- a final external disbursement (asset leaves the protocol perimeter and the corresponding commitment/budget is settled).

The R7 v3.0.0 decomposition is two-sided: EEV describes executable assets, while ProtectedCapital describes commitments. Its current permitted deltas do not yet express a generic asset-side outflow to an external claimant. Do not silently redefine `settle` as an asset debit and do not publish a new delta name as canonical. PA5 remains OPEN / NON-CERTIFIABLE until the asset-side settlement semantics and conservation proof are explicitly resolved.

## 7. IMMORTAL EXP crosswalk — reuse boundaries, not application policy

| EXP axis | Relevance to this ledger | Boundary |
|---|---|---|
| **EXP-01 — obligation classification / seniority** | Identify crystallized claims, unresolved obligations, mandatory costs and authorized reward commitments as distinct classes. | The PRE-RICH game/liability classifications remain profile-specific; do not infer a universal ranking from category names. |
| **EXP-03 — asset identity / eligibility / valuation provenance** | Bind each balance and movement to the exact asset identity, quantity, precision and approved valuation evidence. | Cardano policy IDs, token names, UTxOs and Oracle transport stay in the Cardano Adapter/profile; they are not universal kernel fields. |
| **EXP-05 — abstract contingent claims** | Ticket issue → reveal → crystallized entitlement → single claim settlement is an application instance of the contingent-claim lifecycle. | Game payout tiers, ticket prices, 500× bound and expiry values remain PRE-RICH policy. |
| **EXP-06 — Evidence-as-Input** | Receipt, source UTxO, category classification, admission witness and settlement observation must be independently reconstructible evidence. | Evidence producer/observer does not acquire category-allocation or spending authority. |
| **EXP-07 — regime / hysteresis** | Only relevant where the PRE-RICH profile controls saleability or category availability from verified economic regime state. | Keep its regime/hysteresis abstraction distinct; do not import PRE-RICH KA/KC/KD or ticket-class semantics into Cormia or the universal kernel. |
| **EXP-08 — netting / offset** | Category accounting must not silently net unlike obligations, protected amounts or category deficits. | Gross obligations and protected exclusions remain explicit unless a separately authorized, proven netting rule applies. |
| **EXP-10 — risk budget** | Separate operational execution budgets from economic exposure, category reserves, mandatory cost coverage and reward budgets. | CPU/GPU/time quotas are not capital; a balance or service allowance is not an economic risk budget. |
| **EXP-12 — observer / authority separation** | Observers reconstruct evidence; the Economic Gate/profile authority determines admissibility; the Adapter executes; the independent verifier checks. | A relayer, calculator, observer, wallet UI or data provider cannot classify revenue, authorize a budget or create a spend entitlement. |

The IMMORTAL contributor-reward boundary `ProtocolRevenueReceived → AccountingClassification → CertifiedRewardBudget → RewardAllocation` remains a **research / non-normative** artifact on the separate B3 workstream. It is a useful semantic reference, not an adopted universal Treasury primitive and not current PRE-RICH implementation. PRE-RICH must not import it as policy without an explicit promotion/authority decision.

## 8. Closure sequence and evidence gates

1. **Canonical Treasury identity** — reconcile configured and derived Treasury address, script identity, canonical datum and the exact set of live Treasury UTxOs. The current Issue path uses the configured address override before the derived address, while the legacy Treasury page derives directly from the script; deployment identity must be checked rather than assumed.
2. **Category posting contract** — specify the exact authenticated category state and the rule by which each receipt is classified. No percentage, source amount or allocation rule is inferred. Unclassified receipt evidence must not create a spendable category budget.
3. **Prize funding conformance** — add/verify the source binding required by the already-closed Treasury → PrizePool policy, including canonical Treasury input, Prize category debit, physical Pool credit, matching post-state, liability/exposure preservation and replay protection.
4. **Claim asset-side semantics** — resolve the R7/kernel representation for the final PrizePool asset debit and claimant output; then make builder and validator agree and produce adversarial evidence.
5. **Reserve disjointness** — reconcile unresolved reserve, deterministic exposure, pending liabilities, Jackpot locked and any other Reserve Protection without omission or double counting.
6. **Maintenance ledger** — enumerate mandatory protocol-paid obligations and build an authenticated budget/debit path; prove payer and beneficiary/service evidence. Keep user/wallet execution costs separate.
7. **Reward/staking boundaries** — keep PRE-holder staking separate from contributor/governance and relayer rewards; close source amount, allocation authority, snapshot, eligibility, weighting and distribution decisions before any production epoch.
8. **Aggregate EEV and PA1–PA7** — construct the complete custody/source set, reconcile every category and liability, prove no omissions/double counting, and run adversarial category-substitution, replay and insufficient-budget tests.

## 9. Minimum adversarial conformance matrix

- Wrong or unconfigured Treasury address; configured-vs-derived identity mismatch.
- Multiple datum-bearing Treasury UTxOs with ambiguous canonical state.
- Treasury receipt whose asset identity or valuation is missing, stale, mismatched or unauthorized.
- Attempted PrizePool funding from a wallet or non-canonical source instead of the canonical Prize category.
- Prize category debit without matching Pool physical credit, and Pool credit without matching Prize debit.
- Double counting the same asset before and after Treasury → PrizePool reallocation.
- Attempted Claim with datum-only liquidity decrease and unchanged physical Pool Value.
- Claim payout/Pool debit/liability reduction amount mismatch or second claim replay.
- Reserve/Jackpot/ProtectedCapital substitution into Maintenance or Reward.
- Maintenance payout without an existing mandatory protocol-paid obligation and authorized budget.
- PRE staking distribution with caller-supplied or stale Treasury balance, wrong asset/epoch, duplicate epoch or duplicate beneficiary.
- Contributor reward allocation above budget or budget derived from protected/reserved value.
- Relayer/observer/calculator attempting to sign, submit or authorize a category movement without the canonical admission boundary.

## 10. Explicit non-regression

- No fixed Treasury percentage or 75/10/10/5 split is selected or revived.
- No new category-specific script/authority or separate PRE staking pool is created by this specification.
- No IMMORTAL kernel field, universal Treasury state, Protocol Usage Fee rule or reward policy is added.
- No R7 delta, PA criterion or conservation theorem is amended here.
- No change to PRE-RICH frozen game economics, Jackpot rules, V3, Reveal, Issue, expiry, ticket identity or governance authority.
- No code, transaction, key, signer, deployment or on-chain state is modified by this documentation work.

**Overall status:** SINGLE PRE-RICH TREASURY + INTERNAL CATEGORY ACCOUNTING / PRIZEPOOL SPECIALIZED CUSTODY — ARCHITECTURAL BASELINE CONFIRMED; AUTHENTICATED CATEGORY LEDGER, TREASURY-SOURCED PRIZE FUNDING, CLAIM ASSET DEBIT, MAINTENANCE AND REWARD/STAKING POSTINGS — IMPLEMENTATION / CONFORMANCE OPEN; PA5 OPEN / NON-CERTIFIABLE.
