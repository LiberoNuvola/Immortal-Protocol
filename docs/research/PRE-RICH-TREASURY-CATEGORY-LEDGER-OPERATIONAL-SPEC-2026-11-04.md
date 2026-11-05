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

## 11. Canonical accounting state versus custody — source-level architecture finding

This section records the current implementation boundary and the next carrier design. It does not adopt a new economic allocation rule or authorize a new authority.

### 11.1 What the current Treasury datum actually represents

At the audited branch HEAD, `plutus/Types.hs::TreasuryDatum` contains:

- a lovelace threshold;
- four destination script hashes (Prize, Stake, Reserve and Maintenance);
- four percentage fields.

It contains **no** category balances, asset identities, receipt sequence, category posting, source debit or custody reconciliation. `plutus/Treasury.hs` exposes only `TreasuryAction = Distribute`; its validator calculates percentages over the lovelace value of the consumed input and checks four script-hash outputs. It is therefore a legacy distribution configuration, not the PRE-RICH category ledger and not a multi-asset accounting state.

The UI helper `src/treasuryPage.ts::treasuryDatum()` constructs a sample datum with four equal percentage fields and zero script hashes. That sample is a legacy/demo surface; it is not a canonical allocation decision.

### 11.2 What the current Issue transaction authenticates

The current sale path:

1. derives the Treasury address from the unparameterized `treasuryValidator`;
2. reads the UTxO set at that address and applies the datum-consistency guard;
3. creates one Treasury output for the sale settlement basket in the same transaction as ticket mint and PrizePool reservation;
4. relies on `MintPolicy.atomicTreasuryPaymentValid` to require exactly one output at the Treasury script hash and verify its USDM-equivalent value against the ticket price.

The on-chain sale predicate authenticates the **existence and value** of the Treasury output. It does not decode or authenticate the Treasury datum, does not spend/update a Treasury accounting-state UTxO, and does not post the receipt to Prize, Reserve, Maintenance, Reward or PRE-holder staking.

Accordingly, the code added in this workstream establishes:
- exact script-derived Treasury address and deployment-pin equality;
- returned UTxO address consistency;
- deterministic off-chain selection only when observed datum representations are consistent.

It does **not** establish:
- authenticated category balances;
- authoritative category posting;
- source-category debit;
- category availability or spend authorization;
- an on-chain Treasury state transition.

The helper is deliberately named `selectConsistentTreasuryDatum`: datum consistency must not be mistaken for state authentication.

### 11.3 Existing state-carrier precedent and missing Treasury carrier

The repository already uses singleton-carrier patterns for the B1 PrizePool, V3 economic-state carrier and B2 control carrier. Their deployment identities are configured separately and observers require exactly one matching singleton UTxO.

No equivalent Treasury accounting marker/token, unique Treasury ledger-state reference, category-balance datum or Treasury state-continuation validator was found in the inspected current branch.

The current Treasury is one logical protocol-controlled custody domain and may consist of multiple UTxOs. It must not be modeled as “whichever Treasury UTxO was first returned by the provider”. The Genesis PRE bootstrap observer is a separate, PRE-specific admission reader: its exactly-one-PRE-bearing-UTxO requirement is not a general Treasury accounting inventory and cannot be reused as the category-ledger reader.

### 11.4 Recommended implementation topology — one ledger state, multiple custody outputs

The implementation target should be **one logical Treasury accounting state**, identified by one authenticated singleton state reference, alongside the Treasury's physical custody UTxOs. The singleton carrier is a ledger-state anchor, not a second treasury, pool or economic authority.

Recommended properties:

- one unique marker identifies the current Treasury accounting-state UTxO; exactly one such state must be observable;
- the state datum records category postings in native asset units, keyed by exact asset identity (policy ID + asset name; ADA separately), not merely a fiat/USDM scalar;
- physical custody remains independently observable as a set of UTxOs; ledger balances must reconcile to that set and every UTxO/source reference must be accounted for;
- category accounting and custody location remain separate: an internal Treasury → PrizePool movement must not create a second copy of the same asset in an aggregate perimeter;
- state sequence/reference and transition evidence must make replay, stale-state and duplicate-posting attempts fail closed;
- updates are accepted only as part of the same authenticated economic transition that creates the corresponding physical outputs/inputs; the state carrier itself does not acquire allocation authority;
- category availability is derived through the authoritative economic/obligation checks. A raw category balance or a caller-supplied `availableBalance` does not by itself authorize spending.

A dedicated accounting-state carrier separate from the sale receipt output is the cleaner fit for the current `MintPolicy.singleScriptOutputValue` rule: placing both a continuing state output and a receipt output at the same Treasury script hash would currently make that helper see more than one Treasury output. The exact script/address boundary and one-time marker policy still require a deployment/migration design; this is a recommended topology, not yet an adopted normative or on-chain decision.

### 11.5 Posting boundary — do not infer policy

The existing PRE-RICH policy fixes the direction of protocol-controlled Treasury → PrizePool funding and makes the Prize accounting position its source. It does not authorize a legacy percentage split.

The following rules must remain explicit before implementation:
- sale receipt is proven as a Treasury inflow; its exact posting to a spendable category must follow an adopted classification rule. Do not silently assume a fixed share or that receipt automatically makes the entire amount available for PrizePool funding;
- Treasury → PrizePool must bind the authorized Prize source, physical Treasury input, exact Pool credit, category/custody post-state and replay protection in one transition;
- winner Claim is a final external Prize disbursement and must reconcile the physical Pool debit with the corresponding liability settlement. R7 PA5 remains OPEN / NON-CERTIFIABLE; this document adds no asset-side R7 delta;
- Maintenance is posted only for a mandatory protocol-paid obligation and authorized budget;
- PRE-holder staking remains distinct from contributor/governance Reward and legacy relayer compensation. Its source amount and distribution authority remain OPEN.

### 11.6 Required implementation order

1. Run a read-only Preprod inventory for the exact validator-derived Treasury address and classify all UTxOs (datum/no-datum, asset units, references, script identity). Determine whether legacy holdings require migration; do not assume the old address is empty.
2. Freeze the implementation-level state-carrier and migration boundary without changing category economics or creating a second authority.
3. Define the minimal asset-qualified datum and singleton identity; add validator/policy tests for unique state, monotonic continuation, stale state, duplicate posting and unrepresented custody.
4. Bind Issue receipts and Treasury → PrizePool funding to the state continuation and physical settlement in the same transaction.
5. Keep the current Direct-USDM EEV profile PrizePool-only until a separately qualified aggregate source-set exists.
6. Resolve Claim asset-side settlement/R7 PA5 separately before claiming complete end-to-end category-ledger certification.

**Status:** Treasury script identity and observed-datum consistency are implemented; the canonical Treasury accounting-state carrier and category postings are NOT IMPLEMENTED. No balance, category allocation, marker asset, new validator, new threshold or R7 delta has been invented in this section.


### 11.7 Read-only Preprod Treasury inventory evidence — 2026-11-04

A read-only Koios inventory was executed by workflow [Observe Preprod Treasury Inventory #41872051973](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41872051973), on commit `1a397329ddfd0291898f90942926f57a615bc44f`. The run completed SUCCESS and uploaded artifact `preprod-treasury-inventory-observation` (artifact ID `13344053818`; ZIP digest `sha256:cba587240f790d9b3cdf51000af0d6792757be7a7376f69ff16e8e15957c8b40`). Observation timestamp: `2026-11-04T16:54:48.046Z` UTC.

The inventory covered the exact validator-derived current Treasury address and the historical artifact candidate initially identified before the 2026-09-05 artifact update:

| Scope | Address | Payment script hash | Address UTxOs | Same-script-hash UTxOs |
|---|---|---|---:|---:|
| Current artifact `plutus/out/treasury.plutus.json` | `addr_test1wpaz5k9ejt3f6y82ufu6araf8w6ymp20lqe0pq3mpxcewzq4mhrsw` | `7a2a58b992e29d10eae279ae8fa93bb44d854ff832f0823b09b19708` | 0 | 0 |
| Historical candidate artifact at commit `2d3277ecf89a1b2e7489c85795470b0777446691` | `addr_test1wp3534ewfhn88gduvs723k0x8eakdduf5rpsdhr823enzlqumm5u4` | `6348d72e4de673a1bc643ca8d9e63e7b66b789a0c306dc675473317c` | 0 | 0 |

For both script hashes, the Koios `script_utxos` query returned no UTxOs. The exact address inventory returned no `address_info` row, so Koios did **not** separately attest the address-level `script_address` flag or an address balance; the result is correctly represented as an empty returned UTxO set rather than as an independently certified zero account balance. There were therefore no Treasury datums (inline or hash-only) to decode in these two queried scopes.

Global asset discovery was also recorded, but it is not Treasury attribution:
- The exact tUSDM unit (policy `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9`, name `0014df10745553444d`) had 291 holder addresses; 15 were script addresses. Neither the current nor historical Treasury payment credential appeared in the script-hash inventory, and none of the 291 holder rows matched the exact current Treasury address.
- The canonical PRE asset policy/name query returned 0 holders; the tUSDM/PRE holder intersection was 0.
- tUSDM policy discovery returned two asset names. Exact identity matching of the target tUSDM unit is not issuer, redemption, or USDM-value certification.

**Interpretation:** this Preprod snapshot finds no UTxOs at either queried Treasury address and no UTxOs controlled by either queried Treasury payment script hash. It does not prove that every historical Treasury artifact/address ever deployed is empty, that no off-chain ledger exists, or that any other script address discovered by token-holder search belongs to PRE-RICH. No candidate script-address balance is attributed to Treasury. The inventory is an observational baseline for migration design, not a ledger-state initialization or deployment approval.

Artifact JSON SHA-256: `e2e6b3343c65c7713325e1ae0b4ca89dcc9a66b128031f738cba94a0da47631e` (1,530,909 bytes).

### 11.8 Repository artifact-history closure — same snapshot

After the inventory run, the Git history for both tracked Treasury artifact paths was inspected:

- `src/plutusScripts/treasury.plutus.json` has two content revisions: commit `2d3277ecf89a1b2e7489c85795470b0777446691` and commit `4ad9bcdb491b65af5bbb32a18756186a1ff0ecb5`.
- `plutus/out/treasury.plutus.json` has two content revisions: commit `e70480d9bac4c9678a1717da227e51120a35d978` and commit `4ad9bcdb491b65af5bbb32a18756186a1ff0ecb5`.
- The two paths at `4ad9bcdb491b65af5bbb32a18756186a1ff0ecb5` contain the same artifact blob / CBOR (3,096 hex characters); the two earlier path revisions contain the same older artifact blob / CBOR (3,078 hex characters).
- The current artifact-derived payment script hash is `7a2a58b992e29d10eae279ae8fa93bb44d854ff832f0823b09b19708`; the only other distinct artifact-derived hash in those tracked paths is `6348d72e4de673a1bc643ca8d9e63e7b66b789a0c306dc675473317c`.

Both distinct tracked artifact-derived script hashes were queried through Koios `script_utxos` in the same inventory run and both returned zero UTxOs, including any address variants with a different stake credential. Thus the inventory covers **all distinct Treasury validator artifacts present in the two tracked artifact paths in repository history**, not merely the two exact bech32 addresses.

This closes the migration inventory for the repository-tracked Treasury artifacts on the observed Preprod ledger. It still cannot rule out an undocumented artifact compiled outside the tracked paths, a manually deployed validator from another repository, another network, or an off-chain accounting record. No such external deployment is inferred. No migration datum, genesis category balance or initial ledger value is derived from the empty observation.

### 11.9 Revenue classification is not implied by the Treasury destination

The normative PRE-RICH source distinguishes the destination rule from the accounting classification:
- [GAME-ECONOMY §8](https://github.com/LiberoNuvola/Immortal-Protocol/blob/6ccba95866fb4ed046cff67b2582fcfd71fedcc4/PRE-RICH/docs/GAME-ECONOMY.md#8-treasury-and-historical-allocation) sends player payments into protocol-controlled Treasury and marks the old `75/10/10/5` split HISTORICAL / NON-CANONICAL.
- [GAME-ECONOMY §15](https://github.com/LiberoNuvola/Immortal-Protocol/blob/6ccba95866fb4ed046cff67b2582fcfd71fedcc4/PRE-RICH/docs/GAME-ECONOMY.md#15-treasury-prizepool-funding) closes Treasury → PrizePool as protocol-controlled, constrained by the economic invariants; it does not prescribe an initial percentage split or state that every sale receipt is immediately spendable PrizePool liquidity.
- [FRONT-IMMORTAL-TREASURY-FEE](https://github.com/LiberoNuvola/Immortal-Protocol/blob/6ccba95866fb4ed046cff67b2582fcfd71fedcc4/docs/COORDINATION/FRONT-IMMORTAL-TREASURY-FEE.md) classifies the legacy percentage validator as non-authoritative and keeps universal ProtocolUsageFee / revenue classification separate from the PRE-RICH sale settlement. The Notion Economic Usage Fee workflow itself explicitly excludes PRE-RICH from its scope.

The inspected normative/application sources do not define a current complete posting function from each PRE-RICH receipt type to Prize, Reserve, Maintenance, PRE-holder staking or another category. In particular, they do not authorize either (a) assigning 100% of gross ticket sale receipts to Prize or (b) reviving the historical four-way split. Prize as the authorized source of Treasury → PrizePool funding does not by itself settle how each incoming sale receipt is initially classified.

**Implementation gate:** before a receipt can increase a spendable category balance, an application-owned classification rule must specify the event type, source asset units, category credit, any protected/conditional part, and the evidence/authority that admits the posting. A destination address, a USDM-equivalent price, or a caller-supplied balance is not that rule. Do not invent a new spendable “unclassified” category either; any suspense/intake representation must be explicitly defined as non-spendable accounting evidence, not promoted silently into a new economic category.

Cross-layer non-regression:
- a PRE-RICH ticket-sale receipt is not automatically an IMMORTAL ProtocolUsageFee;
- PRE-RICH AppSurplus / Treasury is not a funding source for IMMORTAL contributor Reward or ProtocolTreasury;
- PRE-holder staking, contributor/governance Reward and legacy relayer compensation remain separate flows.

### 11.10 Treasury state-carrier integration boundary — candidate, not adopted

The current repository code exposes two concrete integration constraints:
1. `MintPolicy.singleScriptOutputValue` returns `Nothing` when more than one output uses the Treasury payment script hash. A sale transaction with both a continuing state-carrier output and a separate sale-receipt output at that same hash would therefore fail the existing atomic Treasury check.
2. `src/mint.ts::getTreasuryDatum` currently uses `selectConsistentTreasuryDatum`, which requires all observed Treasury UTxOs to carry one consistent datum. It cannot remain the state selector once a Treasury address contains a singleton ledger datum plus separate receipt/vault UTxOs.

A topology compatible with **one logical Treasury and one Treasury script/address** is a state-bearing singleton UTxO inside that same Treasury custody boundary, distinguished by one exact marker asset, while receipt/vault UTxOs remain separate outputs at the same address. This is a candidate design only:
- the marker would identify the state UTxO; it would not be a second pool, account authority, or economic category;
- the state datum would hold versioned asset-qualified category accounting, while physical custody would continue to be enumerated as independent UTxOs;
- the Treasury validator would need explicit state/receipt datum constructors and would require the unique marker input plus exactly one marker continuation for every category-changing transition;
- MintPolicy and the PRE-RICH Treasury selectors would have to distinguish the marker-bearing state output from the single sale-receipt output, rather than counting or comparing every Treasury output as equivalent;
- Treasury → PrizePool would spend the canonical state reference and the Prize custody input, debit the authorized Prize position, create the exact Pool credit and continue the state atomically. Internal movement must be reconciled as a custody change, not double-counted as new assets;
- Claim, Maintenance, PRE-holder staking and contributor Reward would require their own separately typed obligations/authorizations; this candidate design does not close those semantics or R7 PA5.

A separate accounting-carrier script/address remains an alternative only if a concrete size, script-complexity or validator boundary proves necessary; it must still be governed by the same single Treasury identity and cannot become a second Treasury authority.

No marker policy ID, marker token name, seed UTxO, datum encoding, category posting function, initial category balance, authority signature format or new script has been selected or created here. The current sale flow is not switched to this candidate design. It requires a dedicated implementation specification and conformance tests before code changes.

### 11.11 Reuse / prior implementation audit — selected active branches

A source/tree audit was performed against the following repository refs to look for an existing canonical Treasury accounting-state carrier, asset-qualified category balances, a transition journal, or a reusable posting implementation:

| Ref inspected | Treasury-related reusable material found | Classification |
|---|---|---|
| `main` — `97b09a38742098f17a61eb07734c401aeedccc06` | Legacy Treasury validator/datum, Genesis observer, read-only surfaces; no category ledger carrier | No accounting-state implementation found |
| `b1-hardening` — `c561393e7eb842529aeaa272377e5afe0138d085` | B1 PrizePool state and legacy Treasury validator | PrizePool is a separate liability/custody state, not the central Treasury ledger |
| `review/treasury-readonly-observer` — `e6a21b4287c6d39c7b07d08e7f527683b0b524bd` | `observe-configured-preprod-treasury.mjs`, paginated Koios address UTxO reader, exact artifact-derived address pin and script-hash check | Reusable read-only observation method; no category balances or posting authority |
| `work/b3-materios-provenance-evidence` — `cf5b41f86bb69c5e277d52cfbb91d933e4148cdd` | `TREASURY-REWARD-ACCOUNTING-BOUNDARY-v1.md`, `reward-treasury-boundary.mjs`, `treasury-legacy-isolation.mjs` | Research/non-normative revenue→classification→reward-budget boundary and legacy usage detector; not a PRE-RICH ledger or posting implementation |
| `release/public-main-curated-2026-09-24` — `04f2684244ddbf26946980ab764e4336fd2ab0a7` | Historical Treasury/Genesis and ledger-observation paths | No category ledger carrier found |

The existing V3 economic-state and B2 control singleton carriers are useful **structural precedents only**: they demonstrate explicit marker identity, one-state-UTxO observation, version/continuation checks and deployment evidence. They are not Treasury components, do not encode PRE-RICH category balances and must not be imported as an economic allocation rule. The B1 PrizePool singleton remains the separate specialized Prize liability/custody state.

The B3 research boundary is particularly relevant as a guardrail, not as an implementation to transplant. It models `FeeObligation → SettlementAmount → ProtocolRevenueReceived → AccountingClassification → CertifiedRewardBudget → RewardAllocation`; it explicitly says destination alone does not classify value, prohibits automatic mapping to ProtectedCapital/RawSurplus, and is marked research/non-normative. Its workflow is scoped to IMMORTAL Protocol + Adapter; PRE-RICH is out of scope. PRE-RICH AppSurplus/Treasury cannot become IMMORTAL ProtocolTreasury or a contributor-reward source.

**Reuse conclusion:** the only direct reuse justified now is the read-only observer discipline and generic singleton-carrier engineering pattern. No current inspected branch contains a Treasury category-ledger datum, unique Treasury ledger marker, posting transition, or asset-qualified category journal that can be reused without designing and adopting PRE-RICH-specific semantics. Do not copy the B3 reward-boundary test as a PRE-RICH posting rule.

**Audit scope limitation:** this is a documented audit of the named refs above, not a claim that every historical or private/unlisted repository branch, external deployment, or untracked artifact was exhaustively searched.

### 11.12 Legacy percentage-distribution isolation — CI evidence

The research/non-normative treasury legacy-isolation check was added to the current PRE-RICH Cardano Adapter Sale conformance workflow as an executable release-boundary guard. The exact current-branch run is [Cardano Adapter Sale Conformance #41874629934](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41874629934), commit `6908949ead1f6d786df1a30c0e38f809d6794e85`.

The `Run legacy Treasury distribution isolation audit` step completed SUCCESS and emitted:
- legacy Treasury policy ES-module import detection: PASS;
- legacy Treasury policy CommonJS import detection: PASS;
- unrelated economic-adapter import remains non-triggering: PASS;
- no active import/invocation/consumer call surface for legacy Treasury distribution in runtime/deployment tooling: PASS;
- legacy Treasury worker remains explicitly fail-closed pending canonical EconomicAdmission: PASS;
- final result: `ALL TREASURY LEGACY ISOLATION CHECKS PASSED`.

This is a source-call-surface/release-boundary result only. It does **not** remove or deactivate the historical `plutus/Treasury.hs` validator or its compiled artifact, prove that no old deployment exists on any network, or replace the migration/release isolation decision. The on-chain legacy surface remains identified and must not be used as the current PRE-RICH category-posting mechanism.

No percentage, replacement allocation, datum, validator, script hash or on-chain transaction changed.

### 11.13 Earlier PRE-RICH sale trace and category-credit boundary

The historical Notion audit `T5 — SALE Trace b1-hardening v0.1 — 12 September 2026` confirms the already-established application flow: each ticket SALE was built atomically with Ticket mint, Treasury payment, B1 PrizePool `TicketIssued` reservation, Counter transition and PrizeDatum. It describes a Treasury receipt output and a separate Pool datum update `unresolvedReserve += priceUsdm`; the physical Pool liquidity did not increase during TicketIssued. That trace established sale atomicity and the liability/reserve relationship; it did **not** establish an internal category-ledger credit.

The later Control Center accounting map is explicit about the distinction:
- `Ticket receipts` are an inflow to the **central Treasury**. The code proves a same-transaction Treasury output with the ticket-price value.
- The concurrent B1 `unresolvedReserve` update records the ticket commitment/risk. It is not another physical inflow and does not transfer liquidity to the PrizePool.
- `Prize / winner payout` is sourced from the Treasury's Prize accounting category and becomes available to the specialized PrizePool through controlled funding.
- The audit explicitly says the sale receipt does not prove that a Prize quota is automatically funded by the purchase.

This is consistent with the sequence in §11.9:
`Player payment → Treasury accounting → Prize allocation / PrizePool funding → established Prize liability → Claim from PrizePool`.

**Disposition:** the user-visible design of one Treasury and the Prize source for PrizePool funding is settled. The ticket-sale transaction proves a receipt into Treasury and a Pool liability/reserve update; it does not decide the later accounting classification/credit amount of that receipt. The posting/classification rule remains an explicit PRE-RICH policy/conformance input and cannot be filled by treating `priceUsdm` as an automatic Prize-category credit, by assuming 100% gross ticket revenue is Prize, or by reviving the historical percentage split. This section adds no new policy.

Sources:
- [T5 — SALE Trace b1-hardening v0.1 — 12 September 2026](https://app.notion.com/p/3d9c4454d6d5811993aff67da26e7ea1)
- [PRE-RICH — Control Center, Treasury category map and PA5 framing](https://app.notion.com/p/3d9c4454d6d581e680d5e5d3f3a9df79)
- [Current PRE-RICH GAME-ECONOMY](https://github.com/LiberoNuvola/Immortal-Protocol/blob/905ab45b9a8b6359f9206382c4a4389e6b8f368b/PRE-RICH/docs/GAME-ECONOMY.md)

### 11.14 Category bookkeeping versus physical distribution — target boundary clarification

The single-Treasury decision implies that Prize, Reserve/protection, Maintenance and PRE-holder staking are **accounting positions within one Treasury custody perimeter**, not automatically separate wallets, scripts or physical pools. A posting from one category to another is therefore a **bookkeeping reclassification**, not a transfer of assets. It must conserve the aggregate Treasury custody amount for each exact asset unit and must not create a new EEV inflow or outflow.

The distinction is:

1. **Receipt recognition:** identify the exact TicketSale payment received by the canonical Treasury. This is a factual, transaction-bound event.
2. **Category posting:** classify that receipt under an adopted PRE-RICH allocation rule. This changes the category ledger, not physical custody. The current sources still do not supply the full posting function; neither gross-price-to-Prize nor the legacy percentage split may be inferred.
3. **Physical settlement:** move assets across a custody boundary, for example Treasury → B1 PrizePool, or pay an externally held PRE-staking/reward entitlement or mandatory service obligation. This is a real Value movement and requires an authorized transaction.

**The distribution target is not a prerequisite for receipt recognition or an internal category posting.** Its economically useful role is to batch actual physical settlements/outflows so that the protocol does not create a separate transaction for every small allocation. Where category positions remain inside the same Treasury custody perimeter, there is no reason to create category-to-category transfers merely to make the accounting visible.

This does not mean an on-chain ledger update is free. If category balances are persisted in an authoritative on-chain datum, changing that datum consumes a ledger transition and therefore a Cardano transaction. The design should avoid an additional transaction solely for bookkeeping by integrating the required state continuation into an already-required TicketSale transition, or by consolidating multiple receipts and postings in one authorized batch transition. An off-chain observer journal can record and reconstruct receipts immediately, but it is evidence/derived state only: it cannot classify spendable balances, authorize an outflow or replace an on-chain economic check.

#### 11.14.1 Preferred integration candidate — receipt integrated into the Treasury state continuation

The cleanest candidate, subject to concurrency and transaction-budget tests, is one canonical Treasury state UTxO whose continuing output receives the TicketSale payment and advances the accounting state in the **same TicketSale transaction**. The payment remains physically in the one Treasury custody pool; the datum records the receipt event or a non-spendable pending-receipt accumulator until the PRE-RICH classification rule is available. This pending receipt representation is an event/clearing record, not a new spendable economic category.

This topology would not add a second transaction fee to each sale, but it is **not a drop-in change** to the current code:

- src/mint.ts::getTreasuryDatum currently reads the Treasury-address UTxO set and requires one consistent legacy datum. It does not select or authenticate a unique category-ledger state UTxO.
- The current sale builder emits a Treasury output containing the ticket payment and the legacy Treasury datum; it does not spend and continue a canonical accounting-state input.
- MintPolicy.singleScriptOutputValue accepts exactly one output at the Treasury payment credential, and atomicTreasuryPaymentValid currently requires the USDM-equivalent value of that entire output to equal priceUsdm. A state continuation carrying previously accumulated assets would make that equality incorrect.
- Before using this candidate, the Issue policy/validator boundary must authenticate the unique Treasury state input and its unique continuation, and verify the **net asset delta** (continuing Treasury output minus consumed Treasury state input) equals the exact TicketSale payment basket under the existing verified conversion/rounding rules. The transition must also reject stale state, duplicate state inputs, missing continuation, unauthorized asset additions and any value not represented by the state.
- The singleton state introduces contention: concurrent TicketSales would compete to consume the same Treasury state UTxO. This is a liveness/concurrency constraint to benchmark, not a reason to silently create a second Treasury authority.

If this candidate passes the transaction, validator, concurrency and replay tests, category bookkeeping can be updated as part of a sale already being submitted. No separate per-sale bookkeeping transaction is needed. The current code does not yet implement this topology.

#### 11.14.2 Compatibility fallback — receipt UTxOs followed by one target-triggered batch

If the singleton Treasury state causes unacceptable contention or transaction-size/script-cost pressure, preserve the present sale shape: one exact Treasury receipt output per TicketSale, with each receipt identified by its transaction hash/output reference and exact asset units. A read-only journal may index these receipts. When the adopted batch target or a safety-triggered settlement condition is met, one authorized transaction can consume a set of receipts, consolidate custody and post the corresponding category ledger state. The on-chain transition must reconstruct its totals from the actual consumed inputs; it cannot trust a relayer-provided total or a caller-supplied category label.

This fallback creates no category-specific wallet or pool. It delays the **on-chain consolidation/posting transaction**, not the observation of the receipt. The journal remains non-authoritative until the batch transition is validated on-chain. The batch size must also respect Cardano input, transaction-size and execution-unit limits; the economic target alone cannot force an oversized transaction.

#### 11.14.3 What the target may and may not gate

The target should gate only batchable physical settlement where waiting is economically safe. It must not:

- delay recording a TicketSale receipt;
- turn an unclassified receipt into a spendable category balance;
- create transfers among virtual Treasury categories that share the same custody pool;
- delay a PrizePool funding action when required to preserve solvency or an already-promised obligation;
- delay a crystallized winner Claim or another due mandatory payment;
- override ProtectedCapital, unresolved exposure, locked Jackpot, category budget or the applicable Economic Gate.

A target-triggered batch may combine several authorized settlements, but each output must still be debited from its correct category/sub-ledger and satisfy its own obligation/authorization. A target is an execution trigger, not an allocation formula or spending authority.

#### 11.14.4 Historical threshold is not promoted

The current relayer/relayer.js retains DEFAULT_THRESHOLD = 25_000_000n (25 ADA) and an environment override TREASURY_THRESHOLD. The same worker now returns after observation and explicitly fails closed because canonical EconomicAdmission is required. The old value belongs to the legacy percentage-distribution surface; the repository's FRONT-IMMORTAL-TREASURY-FEE.md classifies that surface as legacy/application policy and non-authoritative. Therefore 25 ADA is evidence of a historical operational threshold, **not proof that it is the currently adopted PRE-RICH batch target**. Do not reactivate it or combine it with the historical 75/10/10/5 split without an explicit decision record.

**Disposition:** architecture clarification only. Internal category accounting is separated from physical distribution; the batch target is retained for batchable outflows, not required for virtual category bookkeeping. The exact current target value/formula, the receipt classification function, the preferred carrier topology and all corresponding validator changes remain unadopted until their evidence/decision gates are closed. No category percentage, initial balance, new category, on-chain marker, validator, R7 delta, wallet action or transaction is introduced by this clarification.

### 11.15 Read-only TicketSale receipt journal — implementation contract

The first read-only receipt-journal implementation is tracked in [Issue #41 — Treasury receipt journal and batch-settlement carrier](https://github.com/LiberoNuvola/Immortal-Protocol/issues/41). It is deliberately an evidence/reconstruction component, not a category-ledger writer or settlement authority.

#### 11.15.1 Evidence acquisition

The observer derives the canonical Treasury address and script credential from the repository's unparameterized Treasury validator and derives the B1 PrizePool address/credential and Ticket mint policy from the same application topology. Deployment pins are compared exactly; a caller-provided alternate address or Ticket policy is not accepted.

The read-only Koios acquisition path is:

1. \`tip\` — capture one provider snapshot tip;
2. \`address_txs\` — enumerate transactions associated with the exact Treasury address, including transaction hashes that created outputs at that address and transaction hashes that consumed those outputs;
3. \`tx_info\` in bounded batches with inputs and assets enabled — retrieve transaction inputs, outputs, exact minted asset units, validity flag, block height, slot, timestamp and transaction identity;
4. \`address_outputs\` — an independent cross-check for output references, block/time, payment credential and provider spent flag;
5. \`tx_status\` — record provider-reported confirmation counts for recognized TicketSale transactions.

The journal derives the Treasury output set from the address transaction history and transaction facts, then cross-checks the dedicated address-output endpoint. This protects against a provider cursor-boundary omission without silently dropping a transaction output. A provider row not reconcilable to the transaction facts, a duplicate reference, an address/payment-credential mismatch, or inconsistent block/time/spend state is a hard failure.

The snapshot tip and raw response digests are retained. Confirmation counts are observations from Koios only; this implementation does not choose or claim a finality threshold.

#### 11.15.2 TicketSale recognition

An observed transaction is recognized as a TicketSale receipt only when all of the following hold:

- \`valid_contract = true\`;
- the exact validator-derived Ticket mint policy appears once in the minted asset list with quantity exactly \`+1\`;
- exactly one output is paid to the exact canonical Treasury payment credential **and** exact canonical Treasury address;
- exactly one B1 PrizePool input and one B1 continuation output are present under the expected PrizePool credential and exact PrizePool address;
- the receipt output reference is present in the reconstructed Treasury output history;
- the output block height and timestamp match the transaction's block facts.

A Treasury inflow without the exact Ticket mint linkage is retained as a separate **unclassified Treasury output**; it is not assigned to a TicketSale event and receives no category credit. A transaction that pays an alternate address with the same Treasury payment credential fails closed rather than being silently attributed to the canonical Treasury.

Each receipt has an idempotent event key equal to its transaction output reference (\`txHash#outputIndex\`). It records the Ticket asset unit, exact native settlement asset units and integer quantities, block/slot/time, Treasury output reference, B1 input/continuation references, datum metadata, provider evidence and lifecycle state.

#### 11.15.3 Spend lineage and limitations

A receipt marked spent is linked to the unique valid transaction whose inputs consume its exact output reference. The journal records whether that transaction retains value under the canonical Treasury address, moves it elsewhere, or cannot yet be reconstructed from the queried history. Multiple consumers and inconsistent spent flags fail closed.

The journal records **raw asset quantities only**. It does not:
- convert ADA or another asset into USDM;
- infer an EEV value, executable liquidation value or spendable balance;
- classify a receipt as Prize, Reserve, Maintenance, PRE-holder staking or another category;
- post an internal allocation or authorize a physical transfer;
- infer that a Treasury→PrizePool movement is a new inflow or outflow of aggregate EEV;
- trigger a batch target or submit/sign a transaction.

A current UTxO snapshot alone is not the full history: spent receipt links require the corresponding consumer transactions. A spent receipt without a consumer in the supplied history remains explicitly \`SPENT_CONSUMER_NOT_RECONSTRUCTED\`, not presumed settled.

#### 11.15.4 Code and conformance boundary

Current implementation files:

- \`audit/cardano-integration/treasury-receipt-journal.mjs\` — deterministic receipt classification and spend-lineage reconstruction;
- \`audit/cardano-integration/treasury-receipt-journal.test.mjs\` — fixture coverage for valid receipt, non-sale inflow, wrong Treasury address, duplicate/missing outputs, invalid mint quantity/contract, spent lineage, unresolved consumer, multiple consumers and history cross-check;
- \`audit/cardano-integration/observe-preprod-treasury-receipts.mjs\` — read-only Koios observer and deployment-topology pins;
- \`.github/workflows/adapter-sale-conformance.yml\` — runs the journal fixture suite on the current branch push path.

Run command when the required deployment pins are available:

\`node --import=tsx audit/cardano-integration/observe-preprod-treasury-receipts.mjs\`

The observer is not a deployment workflow and does not need a wallet, signing key or submit capability. It should only be run with verified Preprod topology values. No live observer result or current Treasury receipt count is asserted by this specification update.

**Disposition:** the deterministic fixture-level read-only journal contract and observer path are implemented in source. Runtime execution against the live Preprod history and CI results on the exact resulting branch commit remain separate evidence gates. No category posting rule, target value, category balance, spend authorization, marker, validator, R7 delta or on-chain transaction has been introduced.
