# IMMORTAL — EXP-01…EXP-12 Universal / Profile / Adapter Ownership Matrix v1

**Date:** 2026-11-04  
**Status:** research synthesis; non-normative; no EXP contract promoted or implementation authorized  
**Active IMMORTAL branch:** `work/immortal-green-closure`  
**Source head before this record:** `2b63e58b84a78b243fd6a7782a49eb68b7c0bdf8`  
**Related authority crosswalk:** [EXP-06/12 Authority-Class & Responsibility Crosswalk v1](./EXP-06-12-AUTHORITY-CLASS-RESPONSIBILITY-CROSSWALK-v1.md)  
**Purpose:** determine, for each EXP axis, which properties can be universal IMMORTAL contracts and which decisions belong to application/profile, chain adapter or consumer runtime.

> This is not an EXP specification, a normative amendment, a promotion decision, or a new implementation roadmap. It reconciles existing normative IMMORTAL rules with non-normative EXP research boundaries and consumer crosswalks. Existing semantics prevail; unresolved questions remain OPEN.

## 1. Executive determination

The twelve EXPs are not twelve new IMMORTAL modules, and they are not twelve algorithms that should be copied into every adapter or application.

They are **twelve semantic axes**. Each axis may contain four different kinds of property:

1. **Universal IMMORTAL contract:** a chain-neutral invariant or relation necessary to preserve the existing economic constitution across applications.
2. **Profile-owned semantics:** the meaning, classification, parameters, source eligibility, policy, or decision rule that depends on the application and its declared economic profile.
3. **Adapter responsibility:** faithful acquisition, transport, representation, verification hooks, feasibility and realization of system-specific facts; never ownership of the universal economic meaning.
4. **Consumer/runtime responsibility:** domain event interpretation, task/strategy orchestration, local observation, profile selection, or execution scheduling under an already authorized boundary.

A fifth category is deliberately retained:

5. **OPEN research / governance decision:** a candidate boundary whose owner, completeness, or normative meaning has not yet been decided. It must not be promoted merely because a structural test passes.

### 1.1 The central rule

A property is universal only if it can be stated without importing a particular application's vocabulary, payout formula, source hierarchy, time window, controller thresholds, risk appetite, auction objective, counterparty law, or chain mechanics.

For example:

- “Every accepted economic obligation must be represented before the creating action is executable” is universal (Constitution §3; I1).
- “These eight PRE-RICH ticket classes have this payout seniority and a 500× multiplier” is application policy.
- “The Cardano transaction must preserve exact UTxO references, policy IDs, asset names, datums and transaction-body binding” is adapter-specific.
- “A Cormia task is assigned to this worker and scheduled on this machine” is consumer/runtime semantics.

The same discipline applies to all EXPs. A reusable boundary does not mean the full algorithm, policy or authority is universal.

## 2. Canonical ownership layers

| Layer | Owns | Does not own |
|---|---|---|
| **IMMORTAL universal kernel and normative contracts** | Obligation coverage; protected-capital integrity; RawSurplus definition; post-state safety; viability gate against certified concrete `K_c`; Ω authority/completeness obligation; atomicity; determinism; single settlement; expiry finality; historical monotonicity where specified; C-COMP for economic composition | Application ticket/task/market semantics, asset whitelist, oracle choice, source ranking, auction objective, strategy, legal novation requirements, provider API details |
| **Application / economic profile** | Domain object taxonomy; claim triggers/payoffs/caps; eligible assets and valuation policy; application time horizons; regime controller parameters; netting eligibility/consent; novation rules; risk appetite/budget; allocation objective and tie-break; evidence classes and required assurance for its domain | Weakening or bypassing IMMORTAL invariants; redefining universal ProtectedCapital/RawSurplus/Ω/atomicity/expiry semantics |
| **Chain / venue / provider adapter** | Exact source-specific identifiers, observations, timestamps, cursors, proofs, UTxOs/orders/fills/fees/positions; transaction or API encoding; external feasibility; submission and resulting execution evidence | Defining economic truth, creating obligations, deciding eligibility, calculating universal admission, choosing profile policy, granting Principal or governance authority |
| **Consumer runtime / application** | Domain event lifecycle, task/strategy orchestration, local projections, profile selection, operational scheduling, action proposal construction and recovery | Self-authorizing, turning partial observations into zero, making simulation a realized event, overriding policy or economic admission |
| **Governance / accountable authority** | Adoption of normative rules and profile policy within its jurisdiction; appointment/delegation of authorities under explicit rules | Treating technical access, keys, maintainership, tokens, verification or execution as an unbounded economic override |

### 2.1 Normative anchors already closed in IMMORTAL

This classification is constrained by existing normative material, not a redesign:

- Constitution §2: no founder, developer, administrator, operator, relayer, publisher, adapter or frontend gets discretionary economic authority merely by operating infrastructure.
- Constitution §3 / I1: accepted obligations and material unresolved exposure are represented before the creating action becomes executable; unrepresentable exposure blocks execution.
- Constitution §4 / I2–I3: protected value cannot be reclassified as surplus; `RawSurplus = max(0, EEV − ProtectedCapital)`.
- Constitution §§5–6 / I4–I5: accepted transitions satisfy post-state safety and the certified concrete viability kernel; Ω cannot be narrowed by callers or adapters.
- Constitution §8 / I6: coupled economic deltas commit atomically.
- Invariants I7–I10: deterministic derivation for identical authoritative inputs; single settlement; expiry finality; historical monotonicity where defined.
- C-COMP X1–X7 / X5b: shared economic resources and correlated composition require an explicit composed-system certificate and joint gate; local certificates do not compose automatically.

The normative decision register explicitly leaves identity/Sybil mechanisms and governance mechanism profile-scoped; it also keeps PRE-RICH constants and mechanics application-specific. The final audit matrix separates normative closure from implementation evidence and deployment dependencies.

## 3. EXP-01…EXP-12 classification matrix

The “universal kernel” column names the reusable invariant or contract boundary, not a promise that the complete EXP algorithm is implemented or normatively closed.

| EXP | Universal IMMORTAL contract candidate | Profile-owned policy / semantics | Adapter responsibility | Consumer/runtime responsibility | Current maturity / disposition |
|---|---|---|---|---|---|
| **EXP-01 — Typed obligations / seniority** | Obligation identity, pre-action representation, conservation, exhaustive and mutually exclusive economic partition (C17), protected-capital integrity; missing material obligation must not become zero or surplus. | Domain-specific obligation classes, beneficiaries/debtors, maturity/discharge, priority and seniority ordering, equal-rank handling, additional protected categories. No universal taxonomy or rank numbers selected. | Preserve exact source facts, asset/unit identity, transaction or event references and evidence for profile classification; do not infer liability or priority from raw movements. | Map domain events to the declared obligation classes, retain gross lineage and prove the mapping complete for the applicable population. | Existing kernel has aggregate protected components, but this does not establish a complete universal obligation classifier. B3 EXP-01 bucket/seniority boundary is research; completeness and seniority semantics OPEN. |
| **EXP-02 — Term structure / time horizon** | A future obligation/cost that is economically material must be represented; temporal claims used together must carry compatible, explicit time semantics; no missing horizon may silently become unlimited. Existing expiry finality applies where the governing protocol/profile defines an expiry. | Horizon domains, maturity buckets, task/debt/order/funding windows, duration, discounting if allowed, time-weighting, forecasting and application expiry duration. No universal duration/discount rate selected. | Preserve source time, receipt time, slot/block/sequence and clock provenance separately; expose conversion and clock uncertainty. Do not silently convert slots, timestamps or venue periods. | Schedule timeouts, triggers, retries and local task leases; ensure runtime events are bound to the selected profile's time model. | Existing mandatory future costs and expiry anchors justify the boundary, not a universal term-structure algorithm. EXP-02 horizon semantics OPEN. |
| **EXP-03 — Asset identity / eligibility / valuation / haircut** | Keep stages distinct: identity ≠ eligibility ≠ valuation ≠ haircut ≠ executable liquidity ≠ ProtectedCapital. Required value/evidence cannot be fabricated; EEV evidence is adapter/profile-scoped under R9. | Eligible asset set, settlement asset, source/oracle policy, valuation horizon, haircut model, liquidity/depth assumptions, conversion and rounding policy, concentration/correlation policy. No universal whitelist, oracle or haircut selected. | Preserve exact native identity (e.g. Cardano policy ID + asset name), quantities/units, source observations, pool/account references, valuation evidence and executable-input facts. Do not treat ticker or display price as identity/value. | Select the applicable profile and consume the staged outputs; keep a wallet balance, pool observation or provider mark from becoming economic value without the required qualification. | EXP-03 eligibility and valuation boundary exists on B3. Concrete assets and valuation/haircut policies remain profile-owned and OPEN. Arb W2/W3 is identity-only; no economic valuation or gate invocation. |
| **EXP-04 — Composition of profiles** | No implicit authority inheritance or semantic precedence; economic composition involving shared resources, correlated environments or interleaving must satisfy normative C-COMP X1–X7 and a joint gate/certificate. | Profile namespace, compatibility, version rules, conflict resolution, orthogonal vs whole-profile composition, parameter ownership and whether/how shared capital may be ring-fenced. | Carry profile/version identity and exact underlying resource partition evidence; encode and execute only the already-defined composed transition. Adapter must not choose precedence. | Resolve only explicitly governed profile selection and deployment composition; do not use “last writer wins” or caller ordering to pick a policy. | C-COMP is normative; EXP-04 composition semantics are research/open. The B3 boundary correctly says no production composition type before questions are resolved. |
| **EXP-05 — Abstract contingent claims** | The generic established-right pattern is already present: verify right → settle once → reduce liability once. Single settlement, obligation coverage, atomicity, expiry and protected-capital rules continue to apply. | Claim type, trigger predicate, payoff function, cap (if applicable), settlement asset, establishment conditions, overlap/priority and event domain. No new universal ClaimSpec object or cap selected. | Preserve event, state, transaction, settlement and finality evidence; perform chain-native realization and prevent duplicate settlement under the existing contract. | Establish the claim using the authoritative domain event and policy; preserve immutable entitlement for settlement instead of recalculating it from later mutable state. | Generic Claim pattern is a current semantic anchor. The candidate generalized claim abstraction remains OPEN; PRE-RICH Claim semantics must not change. |
| **EXP-06 — Evidence-as-input** | Evidence cannot create its own rule or authority; derived results must bind the exact evidence identity/provenance/version and the governing rule version; absent or unverifiable required evidence cannot authorize a result. Evidence integrity, truth and authority remain distinct. | Evidence classes, permitted sources, required corroboration/independence, freshness policy, appraisal criteria, verifier independence and dispute/correction policy by domain. | Acquire and transport exact source-scoped observations, proofs, digests and coverage; preserve raw IDs and provenance; expose verifier hooks. Do not create a second universal evidence registry or certify source truth by transport. | Bind evidence to the exact task/order/claim/state and call the appropriate verifier/appraisal policy; do not promote API success or a Boolean flag to verified truth. | B3 EXP-06 boundary is OPEN RESEARCH / CONFORMANCE TARGET. Arb hand-off prohibits parallel EvidenceQualification; provider coverage is read-only and profile-specific. |
| **EXP-07 — Regime / hysteresis** | An observer or result-producing algorithm cannot rewrite the rule or self-authorize; state transitions must be deterministic against the declared inputs and governing policy. General safety, Ω and admission invariants still apply to resulting economic actions. | Regime classes, thresholds, activation/maintenance/contraction rules, hysteresis bands, observation windows, emergency/degraded modes and the action policy for each domain. No universal thresholds or regime machine selected. | Supply the exact time-series/ledger/telemetry observations and their provenance/currentness; do not decide the regime or change threshold policy. | Run the profile's controller, preserve prior-state/history and propose the resulting action under its mandate; do not allow a caller-provided state to override the deterministic controller. | B3 EXP-07 is explicitly a PRE-RICH hysteresis stress/conformance boundary reusing KA/KC/KD, not a generic threshold system. Deployment/generalization remains OPEN. |
| **EXP-08 — Netting / offset** | Gross obligations remain identifiable and auditable; no implicit offset or disappearance of protected obligations; conservation and partition completeness continue to apply. | Eligible obligation pairs, bilateral consent, unit/asset compatibility, timing, priority, collateral, reversibility and relationship to ProtectedCapital/WorstCaseExposure. No universal netting right or formula selected. | Preserve the gross source records, identities, units, scopes, horizons and settlement evidence; do not aggregate/net or infer offset from signs or matching values. | Apply only an explicitly authorized netting policy and retain gross history plus the resulting net record; otherwise leave gross records separate. | B3 EXP-08 boundary is research only; netting semantics OPEN. Arb S1 explicitly keeps typed gross OpenExposure and does not aggregate or net. |
| **EXP-09 — Obligation transfer / novation** | Obligation identity and economic conservation must survive an authorized change of responsible party; a reassignment must not silently create, erase or settle a claim. | Transferability, consent, novation authority, source/destination attestations, partial transfers, liability allocation, governing law and protected-capital reassignment. | Preserve source/destination identities, transfer event, exact terms and history; execute the relevant chain/venue change without inventing the legal transfer. | Determine whether the event is only an operational reassignment or a true obligation transfer; request required authorization/consent and preserve original lineage. | B3 EXP-09 boundary remains research/open. Cormia crosswalk explicitly says worker reassignment ≠ novation; Arb S1 owner changes do not create novation. |
| **EXP-10 — Explicit risk budget** | Keep RiskBudget ≠ RealizedExposure ≠ ProtectedCapital. A missing/unverified budget cannot be manufactured; a budget is not surplus, collateral or permission to weaken Safe/Ω. Any economic transition remains subject to existing IMMORTAL admission. | Budget issuer/approver, scope (global/profile/asset/action), measure/unit, horizon, limit, reservation/release, aggregation, concurrency and relation to policy risk appetite. No universal formula/coefficient selected. | Supply source observations and exact unit/scope/time references; do not derive the mandate or set budget from wallet balance, liquidity, capital or strategy output. | Track strategy/task allocations and observed exposure under the consumer's mandate; request IMMORTAL admission for economic transitions within IMMORTAL jurisdiction. | B3 EXP-10 boundary is research/open. Arb W3 correctly marks the risk-budget relation NOT_EVALUABLE when authority/measure/scope are absent. |
| **EXP-11 — Deterministic auction / allocation** | Where a protocol/profile declares allocation, same certified inputs and same rule version must yield the same result; total allocation cannot exceed the certified available amount; unresolved ties cannot be broken by incidental iteration order. | Candidate eligibility, objective, auction vs non-auction mechanism, fairness/priority, tie-break, partial fills, anti-Sybil assumptions and allocation authority. No canonical auction or tie-break selected. | Preserve candidate/resource facts, units, order-book/ledger state and execution results; reproduce the authorized allocation result during realization without changing its objective. | Run the profile allocation algorithm over the declared candidate set; disclose exclusions/search limits and produce a deterministic candidate for the existing adoption/authorization path. | B3 EXP-11 boundary is research/open; no allocation authority or production auction algorithm is created. Cormia/Arb allocators remain consumer-side. |
| **EXP-12 — Observer / authority split** | Observation does not create protocol/economic/governance authority. The observation identity and the separately authorized decision boundary must remain distinguishable; missing authority/provenance is not inferred. | Which institution/Principal/committee can authorize which action, required independence, delegation, issuer lifecycle, trust root, revocation, audience and relying-party policy. These are jurisdiction- and consumer-specific. | Report exact observations, proofs and execution evidence; do not turn the adapter, relayer, node, indexer, wallet or provider into authority merely because it supplies data. | Enforce the actual operational/financial mandate and relying decision; prevent observer, model or verifier from self-authorizing. | B3 EXP-12 says RESEARCH BOUNDARY READY / AUTHORITY SEMANTICS OPEN. GOV-02 remains the governance permission matrix; GOV-30 and the separate authority-class crosswalk do not close institutional authority. |

## 4. The most important classification corrections

### 4.1 “Universal” does not mean “one data schema for every EXP”

The generalized derivation boundary `B = (D, R, I, L, E, V, C, X)` is useful as a **candidate architecture for controlled derivation**:

- domain and rule identity;
- certified inputs and declared limits;
- evidence contract and version;
- contestability and fail-closed exit.

It can be reused as a design checklist or implementation skeleton where it fits. It is not itself a universal algorithm, a complete authority model, or proof that all twelve EXPs share the same semantics.

A typed obligation, asset valuation, claim, regime transition, netting, novation, risk budget, auction and evidence appraisal have different mathematical objects and decision authorities. Forcing them into one homogeneous record would erase distinctions the EXP work is supposed to preserve.

### 4.2 Universal kernel versus application profile

The current `UniversalEconomicState` and `UniversalEconomicKernel` are intentionally aggregate and application-neutral. They expose canonical protected components and evaluate `ProtectedCapital`, `RawSurplus`, non-negative state and solvency.

That is not a universal classifier for arbitrary application events. The profile/consumer must map its detailed state into the universal aggregate and must supply evidence that the mapping is complete, sound and non-double-counting. C17 remains a conformance obligation: an incomplete partition can understate ProtectedCapital even where the arithmetic over represented buckets is correct.

### 4.3 Universal gate versus evidence producer

The existing `EconomicGateInput` explicitly documents that its booleans are already-verified inputs. The gate does not manufacture truth, freshness or obligation completeness.

Therefore the following cannot be conflated:

- a data provider returning a value;
- an adapter transporting the value;
- a verifier authenticating or validating it;
- an appraiser judging it under a policy;
- a relying authority accepting it for a use;
- IMMORTAL deciding economic admissibility.

This is the EXP-06/12 connection to the authority-class crosswalk, not a request for a new universal service.

### 4.4 Universal admission versus adapter action vocabulary

The Cardano `EconomicAdmission.ts` still has the application-specific action set `Issue | Reveal | Claim | Expire` and B1 PrizePool-specific liquidity fields. It is not a generic economic action schema for Arb, Cormia or every future Cardano application.

The adapter may need additional *capabilities* and source-specific realization paths as IMMORTAL generalizes. It must not own the EXP semantics or simply relabel existing PRE-RICH actions as `Swap`, `TaskSettle` or another consumer action. Generic consumer contracts must be established first.

## 5. Consumer reconciliation

### 5.1 PRE-RICH

- Owns ticket classes, price ladder, 500× payout bound, jackpot lifecycle, GameRules, Issue/Reveal/Claim/Expire application transitions and PRE-RICH-specific control policy.
- Consumes IMMORTAL obligation, capital, viability, atomicity and evidence/admission boundaries.
- Its current Issue trust root is application-specific. Issuer identity/key ID, audience/policy binding, rotation/revocation and production custody remain open in GOV-30.
- No PRE-RICH constant is promoted into universal IMMORTAL.

### 5.2 Cormia

The [IMMORTAL–Cormia EXP Crosswalk v1.0](https://github.com/LiberoNuvola/Cormia/blob/work/exp-generalization-crosswalk/docs/research/IMMORTAL_CORMIA_EXP_GENERALIZATION_CROSSWALK_v1.0.md) and [AEP–IMMORTAL Economic Jurisdiction Contract v0.1](https://github.com/LiberoNuvola/Cormia/blob/work/exp-generalization-crosswalk/docs/research/CORMIA_AEP_IMMORTAL_ECONOMIC_JURISDICTION_AND_EXP_CONFORMANCE_v0.1.md) already identify:
- authority/action composition (Cormia mandate and child authority);
- economic/resource composition (IMMORTAL only when the deployment enters that economic perimeter);
- governance/jurisdiction composition (IMMORTAL governance and proposed Cormia PNC).

The contracts remain research proposals in draft PRs #1 and #2. Local non-economic Cormia work, agent operations, project patronage and donated compute must not be forced through the IMMORTAL economic gate. Funded task obligations and shared protected economic resources require the relevant economic profile and C-COMP conditions.

### 5.3 Arb Agent

The Arb repository's [IMMORTAL hand-off crosswalk](https://github.com/LiberoNuvola/PRE-RICH-AEP-Arb-Agent/blob/Immortal-Protocol/docs/IMMORTAL-HANDOFF-CROSSWALK.md), [full branch prior-art audit](https://github.com/LiberoNuvola/PRE-RICH-AEP-Arb-Agent/blob/Immortal-Protocol/docs/BRANCH-PRIOR-ART-AUDIT-2026-11-03.md), [Provider Evidence Adapter Contract](https://github.com/LiberoNuvola/PRE-RICH-AEP-Arb-Agent/blob/Immortal-Protocol/docs/PROVIDER-EVIDENCE-ADAPTER-CONTRACT.md), and W3 consumer mapping already prohibit a parallel EvidenceQualification/source registry/economic gate.

Arb's remaining candidate contribution is provider-specific collection and mapping of external broker/exchange account and trading lifecycle records, with per-family coverage and source semantics. S1 remains synthetic/read-only; D0 Principal/financial authority and D1 account/resource isolation remain OPEN; S2/S3 are not authorized. Arb must consume IMMORTAL's generic EXP contracts when they are ready, not implement substitutes.

### 5.4 Materios

Materios supplies chain-specific proof and provenance evidence: authority-set transitions, checkpoints, execution evidence, storage proofs and, where completed, finality verification. A valid proof is not a governance decision, issuer appointment or economic admission. The inspected B3-A authority POC still has an injected proof-verifier interface rather than a concrete proof verifier; the historical B3-B storage witness is a separate evidence gate.

### 5.5 Carob Three

Carob owns agricultural predicate-specific evidence interpretation: source scope, uncertainty, independence/correlation and conflict resolution. Its G1.6 record explicitly separates authenticity, consistency, authority for a given decision and biological truth. This is a good consumer pattern for typed/scoped appraisal, not a universal IMMORTAL ranking of sensors, people, models or sources.

## 6. Reuse decisions and prohibited duplication

| Existing source or contract | Reuse | Do not recreate |
|---|---|---|
| Constitution + I1–I10 + accounting invariants | Universal economic safety and conservation requirements | Application-specific economic rules in the kernel |
| `UniversalEconomicState`, `UniversalEconomicKernel`, `EconomicGate` | Universal aggregate, ProtectedCapital/RawSurplus and admissibility boundary | A second economic kernel or Boolean gate in Arb/Cormia/adapter |
| C-COMP X1–X7 / X5b | Shared economic-resource partition, joint certificate and joint gate | A local “sum of gates” or independent composition engine |
| R9 / EV1–EV7 and source-qualification work | EEV/valuation source evidence and deployment qualification patterns | A second universal oracle or EEV qualification path |
| EXP-06 and EXP-12 B3 boundary research | Evidence-as-input and observer/authority separation | A second EvidenceQualification/authority system |
| GOV-02 P0–P5 | Existing governance permission boundary | A competing generic governance matrix inside each consumer |
| GOV-30 and the Authority-Class Crosswalk | Open issuer/key lifecycle options and responsibility vocabulary | A universal key registry, signer service or unapproved lifecycle implementation |
| Cormia mandate/PNC proposals | Operational authority and source-pinned project norms, subject to their own adoption/review | Financial Principal authority or economic kernel in Cormia Runtime |
| Arb S1 provider evidence contract | Provider-specific source assertion and per-family collection coverage | Multi-oracle/currentness service, generic trust score, risk engine or economic admission |
| Cardano observation and realization primitives | Exact chain-native facts, proofs, transaction construction and ledger evidence | EXP semantic ownership or PRE-RICH-shaped generic action relabelling |
| Materios proof boundaries | Consensus, storage and application provenance verification | Institutional or economic authority from proof validity alone |
| Carob G1.6 | Predicate-scoped evidence authority and explicit conflict state | Universal source rank or AI authority |

## 7. Promotion gates: when may a property become universal?

A proposed EXP property should be considered for normative universalization only after all applicable questions are answered:

1. **Invariant statement:** can it be stated without domain-specific labels, numerical parameters or source choices?
2. **Scope:** which action classes and economic perimeters does it govern, and which are explicitly outside?
3. **Ownership:** is it a universal kernel rule, profile policy, adapter evidence obligation, consumer runtime responsibility or governance decision?
4. **Non-interference:** does it preserve all existing I1–I10, Ω, `K_c`, C17, C-COMP, expiry, single settlement and atomicity requirements?
5. **Evidence:** what authoritative input establishes the premise, and who verifies it? A structural Boolean is not its own proof.
6. **Failure behavior:** what exact missing, stale, conflicting or unverifiable conditions prevent reliance/admission?
7. **Conformance:** are there positive, negative, boundary, replay and adversarial vectors for the property itself, not merely a generic envelope?
8. **Cross-domain test:** can at least two genuinely different application profiles consume the same semantic contract without importing one another's policies?
9. **Adapter neutrality:** does the semantic result exist before chain-specific encoding, and do separate adapters preserve the same result for the same certified inputs and rule version?
10. **Governance/adoption:** which existing authorized path adopts it? Certification and a green workflow do not themselves change canonical rules.

Passing a structural harness is a maturity milestone, not a normative promotion. The B3 Generalization Evidence Matrix's maturity ladder remains the correct discipline: concept specified → structural harness → function-specific derivation → authoritative input binding → function-specific conformance → cross-runtime differential conformance → operational evidence.

## 8. Recommended order of work

This order avoids building generic shells before semantic ownership is clear.

1. **Do not add twelve modules or one universal schema.** Keep EXP-01…EXP-12 as a catalog of semantic questions and separately tracked maturity.
2. **Close the universal/profile split for EXP-01–05** against the existing obligations, state, claim, asset and C-COMP contracts. These affect the economic meaning consumed by every profile.
3. **Finish EXP-06/12 trust and evidence semantics** using the Authority-Class Crosswalk and GOV-30; decide role bindings and evidence lifecycle before designing an envelope or registry.
4. **Keep EXP-07 profile-owned at the policy layer.** First test whether any regime properties beyond deterministic declared-policy execution are genuinely domain-neutral; do not generalize PRE-RICH's KA/KC/KD.
5. **Resolve EXP-08/09/10/11 only at their actual decision owners.** IMMORTAL can own conservation and admission constraints, but cannot select legal consent, risk appetite, budget issuer or auction objective without an adopted rule/profile.
6. **Run consumer conformance with Cormia, Arb and PRE-RICH** against the same IMMORTAL contract boundaries, keeping Cormia's non-economic Core and Arb S1 read-only.
7. **Expand Cardano Adapter capability only after generic consumer semantics exist.** Preserve the current PRE-RICH Issue/Reveal/Claim/Expire witness as an application path; do not broaden it by relabelling.

## 9. Explicit non-claims

This record does not claim that:

- all EXPs are normatively closed or production-implemented;
- the generic derivation boundary is one universal algorithm;
- the current aggregate kernel is a complete universal obligation classifier;
- a universal asset list, valuation oracle, haircut, time horizon, netting relation, novation rule, risk-budget formula, regime controller or auction mechanism has been selected;
- the B3 research branch is merged into the active branch;
- Cormia PR #1 / #2 is adopted or production-enforced;
- Arb has a Principal, provider, risk budget or execution authorization;
- Materios has completed all real proof/finality evidence;
- a Cardano Adapter capability extension can own EXP semantics;
- passing CI establishes production authority, evidence truth, deployed functionality or ledger settlement.

**Disposition:** the most accurate current architecture is a small set of universal IMMORTAL invariants and admission/conservation contracts, combined with versioned application profiles, source/chain-specific adapters and bounded consumer runtimes. EXP-01…EXP-12 are the research axes used to test and extend that architecture; they are not twelve copies of it.
