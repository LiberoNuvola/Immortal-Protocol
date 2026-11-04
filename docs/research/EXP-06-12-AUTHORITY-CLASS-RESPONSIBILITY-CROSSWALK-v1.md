# IMMORTAL — EXP-06 / EXP-12 Authority-Class & Responsibility Crosswalk v1

**Date:** 2026-11-04  
**Status:** research / architecture synthesis; non-normative; no new authority or implementation authorized  
**Active IMMORTAL baseline:** `work/immortal-green-closure` at `251907b197a59e57aa0e4fef32e0d1008330121b`  
**Purpose:** reconcile the existing governance permission model, EXP-06/12 boundaries, Cormia authority/action model, Materios evidence boundaries, and Arb S1 consumer constraints without creating a parallel authority system.

## 1. Executive result

There is no single universal thing called “authority” that can safely be represented by one key, role, credential, quorum or Boolean.

The inspected sources already describe distinct authority domains:

1. **Governance / jurisdiction:** who may change a rule, specification or policy, and within which layer.
2. **Principal / resource control:** who owns or controls an account, wallet, workspace or economically relevant resource.
3. **Operational mandate / action delegation:** who may perform which bounded actions, for whom, on which resources and for how long.
4. **Evidence / provenance:** who observed or asserted a fact, what exact object it concerns, and how it can be reconstructed.
5. **Issuer / signing:** which identity made a signed statement, and which key performed the signature.
6. **Verification / appraisal:** which verifier checked which proof or evaluated which evidence under which policy.
7. **Reliance:** who accepts a particular issuer, evidence class or appraisal result for a defined use.
8. **Economic admission:** whether a proposed economic transition is permitted by IMMORTAL within its declared economic jurisdiction.
9. **Execution / settlement:** which worker, wallet, adapter, relayer or ledger realizes an admitted action and what evidence records the result.

These are orthogonal responsibilities, not a rank ordering. One organization or process may perform several of them, but combining roles must not silently combine their powers. A successful signature, a valid proof, a verifier verdict, an operational mandate and an IMMORTAL admission result answer different questions.

**Main architectural conclusion:** the next reusable IMMORTAL contribution is a typed boundary between these domains and their evidence, not a universal issuer registry, evidence score, trust service, Principal system, committee or second economic gate.

## 2. Relationship to existing records — no duplicate GOV matrix

### 2.1 GOV-02 already defines governance permissions

The existing Notion record [GOV-02 — Authority / Permission Matrix v0.1](https://app.notion.com/p/3dfc4454d6d58107828eedf372de5242) defines governance permission classes P0–P5:

- P0 — permissionless participation;
- P1 — governance participation;
- P2 — maintainer / implementation authority;
- P3 — scientific / verification authority;
- P4 — canonicalization authority;
- P5 — narrowly scoped emergency authority.

It also defines the governance authority domains, layer-specific boundaries, conflict-of-interest invariants and the rule that permissions such as propose, review, vote, delegate, implement, merge, verify conformance and canonicalize are not interchangeable.

**This crosswalk does not replace, renumber or extend P0–P5.** GOV-02 primarily answers who may participate in or perform governance and implementation actions. The matrix below answers a different question: what kind of evidence, identity, appraisal, reliance or action authority is being claimed at a system boundary.

A reviewer under GOV-02 does not automatically become an issuer. A maintainer is not a source of economic truth. A canonicalization process does not become a financial Principal. A token vote does not qualify an oracle or prove account ownership.

### 2.2 GOV-30 supplies the role vocabulary

[GOV-30 — Authority Roles & Key Lifecycle Options](../01-formal-records/governance/GOV-30-AUTHORITY-ROLE-AND-KEY-LIFECYCLE-OPTIONS.md) is a discussion draft. It distinguishes evidence producer, issuer, key custodian/signer, verifier/appraiser, verifier-policy authority, relying authority, IMMORTAL admission gate and adapter executor, while preserving open questions about issuer identity, key purpose, lifecycle, revocation, freshness and historical verification.

This matrix makes the responsibilities and current consumer boundaries explicit. It does not select any of GOV-30's options or authorize an implementation.

### 2.3 EXP-06 / EXP-12 already have candidate boundaries

The read-only review of `work/b3-materios-provenance-evidence` found:

- [EXP-06 — Evidence-as-Input Boundary](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/EXP-06-EVIDENCE-AS-INPUT-BOUNDARY-v1.md): a derivation consumes an externally supplied, version-bound evidence identity and verification status; missing, malformed or unverifiable evidence remains UNVERIFIABLE; evidence does not become rule authority or self-certify.
- [EXP-12 — Observer vs Authority Split Boundary](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/EXP-12-OBSERVER-AUTHORITY-SPLIT-BOUNDARY-v1.md): observation, evidence and authorization remain separate; the boundary requires distinct observation and authority references, but does not decide which institution is valid.
- [Generalization Evidence Matrix B3](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/GENERALIZATION-EVIDENCE-MATRIX-B3-v1.md): the generic derivation and EXP harnesses test structural boundaries and fail-closed behavior; they do not establish production evidence verification or complete function-specific economic derivation.

These are existing research artifacts on a separate, divergent branch. They are reused as source references only; this commit does not merge or cherry-pick that branch.

## 3. Authority-class matrix

The class names below are analytical labels for cross-domain mapping. They are not permission IDs, a canonical enum, a wire schema, or an adopted IMMORTAL authority hierarchy.

| Class | Question answered / permitted responsibility | Evidence or binding needed | What it does **not** grant | Candidate owner / status |
|---|---|---|---|---|
| **GOVERNANCE_CHANGE** | Who may adopt, amend or retire a rule within a defined constitutional, protocol or application jurisdiction? | Applicable governance path; proposal and decision record; mandatory review, vote, evidence, adoption and canonicalization gates | Does not prove empirical truth, source authenticity, account ownership or runtime conformance | IMMORTAL governance for universal rules; subordinate application governance for exposed application parameters. GOV-02 P0–P5 is the existing permission baseline. |
| **PRINCIPAL_RESOURCE_CONTROL** | Who is the Principal, account owner/controller or legitimate controller of a resource? | Exact account/resource identity, ownership or control evidence, scope, environment, isolation and challenge/revocation path | API authentication, a wallet connection, public address, project role or provider account label alone does not establish beneficial ownership or financial authority | Principal and resource owner are consumer/deployment-specific. Arb D0 (Principal/financial authority) and D1 (account/resource isolation) remain OPEN. |
| **OPERATIONAL_MANDATE** | Who may perform bounded operational actions on behalf of a project or Principal, over which resources and for what duration? | Mandate identity/version, delegator, subject, action/resource scope, validity, constraints, child-authority attenuation and revocation/consent evidence | Project/task authority does not automatically grant financial custody, trading, withdrawal, protocol-rule or economic-gate authority | Cormia Project Mandate / Runtime / task child authority for project execution. ADR-0011/PNC work remains a separate open draft; PNC pins normative sources and grants zero capabilities. |
| **SOURCE_OBSERVER** | What did a sensor, provider, node, wallet, model or human actually observe or report? | Source/profile identity, exact subject/predicate/scope, observation reference, raw evidence, time/sequence semantics, uncertainty, coverage and provenance | Does not change canonical state, determine policy, establish truth outside its predicate, grant itself authority or authorize a consequential action | Consumer-specific source profile. Carob's G1.6 uses typed, predicate-scoped evidence authority; Arb S1 currently replays synthetic observations and has no live provider adapter. |
| **ISSUER_STATEMENT** | Which issuer makes an attributable statement or claim? | Signed statement, issuer identity, key identifier/binding, statement scope and intended purpose; lifecycle status where governed | Signature validity alone does not prove issuer entitlement, evidence truth, policy compliance or economic admissibility | Consumer trust profile and its governing authority. PRE-RICH Issue has an application-specific external Ed25519 key, but issuer identity/key ID and lifecycle remain open. |
| **KEY_CUSTODY_SIGNING** | Which key material performed a signature, and under what custody/operation boundary? | Cryptographic verification plus purpose, key-to-issuer binding, custody and operational evidence appropriate to the trust profile | A key is not an institution, Principal, governance body or policy. A public key does not establish who is authorized to use it | Signer/custodian selected by the issuer's governed trust profile. Production PRE-RICH key custody and signer deployment are NOT VERIFIED. |
| **PROOF_VERIFICATION** | Does a supplied cryptographic, consensus, inclusion, state or provenance proof verify against the declared trust inputs? | Exact proof, public inputs, chain/genesis/network, root/checkpoint, verifier implementation/version and verification result | Does not decide whether the proved fact is substantively relevant, whether the source is institutionally authorized, or whether an economic action is permitted | Proof-system / adapter verifier. Materios B3 distinguishes authority-transition and storage-proof checks; the audited authority-transition POC still exposes an injected verifier interface rather than supplying a concrete proof verifier. |
| **APPRAISAL** | Does the evidence satisfy a named evidence contract or domain appraisal policy for a particular claim? | Evidence class, verifier identity/method, policy identity/version, source scope, freshness, coverage, independence/correlation and explicit result/reasons | Does not change the policy, create a Principal, grant a mandate, or approve an IMMORTAL economic transition | Domain-specific verifier/profile. Cormia AEP's task verifier is specified in draft; the production task engine/verifier service is not established by the inspected crosswalk. |
| **POLICY_AUTHORITY** | Who is authorized to define the appraisal, source eligibility, conflict resolution, risk or action policy used by a consumer? | Governed policy owner, jurisdiction, policy version, adoption/effective status and immutable binding to the evaluation | A verifier, observer, AI model, maintainer or strategy cannot silently alter the policy because it produced a result | Consumer policy owner, subject to the superior normative layer. Carob agricultural source authority is predicate/policy-specific; PRE-RICH app policy is subordinate to IMMORTAL; Cormia PNC remains proposed. |
| **RELIANCE_DECISION** | Who accepts a specific issuer, source, proof or appraisal result for a defined downstream use? | Relying-party identity, intended audience/use, accepted profile/policy versions, exact appraisal/evidence references and decision record | Does not authenticate the source by itself, rewrite appraisal, or create economic authority outside the relying party's jurisdiction | Application/deployment relying authority. It must be explicit for each consumer; no universal relying registry is selected. |
| **ECONOMIC_ADMISSION** | Is a proposed economic transition admissible under IMMORTAL's universal kernel, profile, perimeter, obligations, protection, viability and composition requirements? | Authenticated/appraised inputs; declared profile and perimeter; obligation/exposure state; EEV/ProtectedCapital/liquidity and applicable certified-kernel/composition evidence | Does not own the Principal's account, select trading strategy, create source truth, authenticate provider APIs or execute the transaction | IMMORTAL owns economic admissibility only for the economic perimeter governed by IMMORTAL. Cormia AEP local non-economic tasks remain outside this gate. |
| **EXECUTION_AUTHORITY** | Which worker, strategy, wallet, relayer or adapter may attempt the admitted operation? | Explicit bounded mandate/capability, action and resource scope, admission result where economic, exact candidate action/transaction binding and replay protection | Does not alter canonical rules, relax admission, declare evidence true, or convert a candidate/simulation into a realized outcome | Consumer Runtime/worker and adapter under their respective mandates. Arb S1 is read-only; S2/S3 execution is not authorized. |
| **SETTLEMENT_FINALITY_EVIDENCE** | What happened after an action was submitted, and what evidence establishes execution, settlement or chain finality under the relevant system? | Provider/ledger event or transaction reference, stream/chain identity, sequence/checkpoint, finality/settlement rule, inclusion proof or independent reconciliation where required | Does not retroactively authorize the original action or prove that its economic admission was correct | Venue/ledger-specific profile and verifier; adapter transports/binds the evidence. Cardano finality and centralized-venue fill/settlement states are not interchangeable. |

### 3.1 Role combinations

The classes are logical responsibilities, not mandatory separate organizations or services. A party can be both issuer and observer, or a verifier can also operate the relying-party process, if the relevant policy permits it and the record preserves each role separately.

However:
- role accumulation does not create additive powers;
- the same actor cannot self-authorize merely by signing and verifying its own statement;
- when independence is required, multiple endpoints or keys controlled by the same source/custodian do not automatically count as independent;
- a conflict-of-interest or separation requirement must come from the relevant governed profile, not be invented as a universal threshold here.

## 4. Non-equivalence rules

The following pairs must remain distinct in every consuming application:

- governance permission **≠** evidence issuer authority;
- source authentication **≠** empirical truth;
- evidence existence or digest integrity **≠** evidence completeness;
- signature verification **≠** issuer authorization;
- proof verification **≠** appraisal correctness;
- appraisal result **≠** relying-party acceptance;
- relying-party acceptance **≠** IMMORTAL economic admission;
- Project Mandate **≠** financial Principal authority;
- API credential or wallet connection **≠** account ownership/control;
- observer / monitor / AI output **≠** policy authority;
- economic admission **≠** execution authorization;
- transaction submission **≠** execution success;
- execution success **≠** settlement finality;
- ledger finality **≠** economic admissibility;
- test fixture / source-level guard **≠** production custody, live service or deployed trust root.

These are composition safeguards. They are not a new acceptance score or a complete canonical authority policy.

## 5. System ownership and maturity crosswalk

This table maps the responsibility domains to the systems actually inspected. Status describes source/document evidence, not product readiness.

| System / layer | Owns or supplies | Must not be promoted into | Current evidence and open boundary |
|---|---|---|---|
| **IMMORTAL** | Universal economic semantics; obligations/exposure, ProtectedCapital, RawSurplus, viability, economic admission, composition; generic EXP-06 evidence input and EXP-12 observer/authority separation boundaries | Generic source ranking, consumer-specific Principal identity, provider credentials, or a universal issuer service assumed to exist | EXP-06/12 are research/conformance boundaries on the B3 branch. The active branch now has the Issue-specific trust-root reuse audit and GOV-30 options. Generic issuer/appraisal/reliance lifecycle remains OPEN. |
| **PRE-RICH** | Application game rules, application control, Issue/Reveal/Claim/Expire lifecycle and its application trust profile | Universal authority policy or universal economic constants | Issue uses an external configured Ed25519 key for the signed payload and V3 carrier binding. The V3 key is pinned as a deployment parameter. Issuer identity/key ID, audience/policy binding, rotation/revocation and production custody remain OPEN/NOT VERIFIED. B2 committee verification is a separate PRE-RICH mechanism, not the Issue trust root or a proven on-chain quorum. |
| **Cardano Adapter** | Cardano-specific observation, UTxO/value identity, proof/transport, canonical transaction construction/submission, chain execution and finality evidence | Owner of EXP semantics, universal economic gate or application strategy | Its shared capability must expand to support generalized IMMORTAL consumers, but current `EconomicAdmission.ts` remains PRE-RICH-shaped (`Issue/Reveal/Claim/Expire` and B1 PrizePool inputs). Do not relabel actions or push EXP rules into the adapter. |
| **Cormia Core / AEP** | Project/workspace identity, Project Mandate, task manifest/lifecycle, child authority, worker/verifier process, operational resources and task outcome | Financial Principal, IMMORTAL economic admission or universal authority registry | The 2 Nov EXP crosswalk and AEP/IMMORTAL jurisdiction contract are research drafts in open Cormia PR #2. PNC/ADR-0011 is separately proposed in open PR #1; PNC grants zero capabilities. Cormia's core must remain usable for local non-economic work without IMMORTAL. |
| **Arb Agent** | Provider-specific read-only observations, instrument/account mapping, per-stream replay, corrections, typed gross OpenExposure projections and consumer-side mapping | Price oracle, source/currentness registry, Principal authority, risk engine, IMMORTAL gate, financial mandate or actuator | Branch `Immortal-Protocol` at `298d5c974a0ef3180404aaf704e5fdf00751b05e` (4 Nov 2026): S1 reducer is synthetic-only; W1 is injected CIP-30 read-only; W2 consumes a serialized IMMORTAL observation; W3 is identity-only/consumer mapping. D0 Principal/financial authority and D1 account/resource isolation remain OPEN; S2/S3 are not authorized. |
| **Materios** | Chain-specific authority-transition, checkpoint, availability and storage-proof evidence, when concretely verified | Economic/governance decision authority or an issuer trust registry | The B3-A transition packet distinguishes checkpoint, authority transition, execution proof and selection commitment. The POC's concrete cryptographic proof verifier remains an injected interface; B3-B historical storage witness/final verification is a separate gate. |
| **Carob Three** | Agricultural evidence classes, uncertainty, predicate-specific source scope, conflict interpretation and domain policy | Universal source ranking, AI self-authority or Adapter-level conflict resolution | Notion G1.6 explicitly separates AUTHENTIC, CONSISTENT, AUTHORITATIVE FOR THIS DECISION and BIOLOGICAL TRUTH. Evidence authority is typed and scoped to predicates (e.g. delivered water volume), and unresolved conflict is non-authorizing. This is a domain research contract, not an IMMORTAL-wide ranking policy. |

### 5.1 Existing Arb / IMMORTAL prior art — mandatory reuse

The Arb repository's [IMMORTAL ↔ Arb Evidence and Economic Admission Crosswalk](https://github.com/LiberoNuvola/PRE-RICH-AEP-Arb-Agent/blob/Immortal-Protocol/docs/IMMORTAL-HANDOFF-CROSSWALK.md) and [Cross-Branch Prior-Art Audit](https://github.com/LiberoNuvola/PRE-RICH-AEP-Arb-Agent/blob/Immortal-Protocol/docs/BRANCH-PRIOR-ART-AUDIT-2026-11-03.md) already inventory and inspect the relevant internal prior art. The latter records 31 visible branch trees across IMMORTAL (27), Cormia (3) and Arb (1), with targeted source review; it explicitly is not a line-by-line audit or independent security certification.

Reuse and limits recorded there:

1. IMMORTAL `work/immortal-green-closure` has a multi-oracle source/registry and currentness prototype, including canonical payload hashing, signed snapshots, exact tuple matching and a revocation/currentness overlay. It is **not production-wired**: test identities are fixtures; the authority/currentness provider is unselected; process-local anti-rollback is not durable; no canonical source, quorum, aggregation or conversion policy is approved.
2. The same branch has multi-venue observation and PRE-RICH ProtectedCapital item-ledger/source-census prototypes. They are useful internal prior art, but one is market-source discovery rather than canonical EEV, while the other remains PRE-RICH ticket-specific and does not prove universal source authority or population completeness.
3. IMMORTAL `work/b3-materios-provenance-evidence` already contains EXP-06, EXP-12 and the generalized derivation boundary. Those files are separate-branch research prototypes, not production-complete authority semantics.
4. The remaining Arb contribution candidate is narrower: a provider-specific, provider-neutral-in-interface adapter for external broker/exchange account and trading-lifecycle records (balances, orders, fills, corrections, fees, positions, liabilities and settlement), where those source semantics are not already covered by an existing source contract.

**Therefore Arb must not create** a second generic EvidenceQualification certificate, multi-oracle/price registry, freshness/currentness service, authority system, economic kernel, Economic Gate or composition engine. A future provider adapter supplies source-scoped observations and collection coverage to the existing verification/admission contracts. Its credentials, endpoint access and account labels cannot close D0/D1.

## 6. Consumer evidence flow

A generic consumer path can be expressed as the following conceptual flow:

```text
Principal / resource control (where relevant)
        |
Operational mandate (where an action is requested)
        |
Source observation -> raw evidence + scope + provenance
        |
Issuer / signature check (if the source uses signed statements)
        |
Proof verification (if a cryptographic / consensus proof is required)
        |
Appraisal under a versioned consumer policy
        |
Relying authority accepts or rejects that result for this use
        |
If the proposed transition is economic and within IMMORTAL jurisdiction:
IMMORTAL Economic Admission / composition gate
        |
Bounded execution authority -> application Runtime / adapter
        |
External event / ledger result -> settlement and finality evidence
```

Not every application requires every step. For example, local non-economic Cormia work does not need IMMORTAL admission; a read-only Arb projection does not need execution authority; a cryptographic proof may be inapplicable to a provider API observation. Missing steps must be represented explicitly rather than silently inferred.

The key ordering is semantic, not a requirement to create a chain of separate microservices.

## 7. EXP cross-links and implications

| EXP | Authority/evidence consequence | Existing source boundary | What this matrix does not decide |
|---|---|---|---|
| **EXP-03 — asset identity / eligibility / valuation** | Exact asset identity, eligibility, valuation, haircut, liquidity and ProtectedCapital must not collapse into one claim | IMMORTAL asset boundaries; Cardano exact policy/name and UTxO observations; Arb W2/W3 identity-only mapping | Universal eligible asset set, oracle, haircut, valuation horizon or liquidation model |
| **EXP-04 — profile composition** | Composed profiles must not inherit authority or precedence implicitly | Existing profile-composition boundary and C-COMP X1–X7 | General composition algorithm or conflict precedence |
| **EXP-06 — evidence-as-input** | Derivations consume externally verified, version-bound evidence; missing/altered evidence is UNVERIFIABLE/rejected | B3 EXP-06 boundary and Arb Provider Evidence Adapter Contract | Universal issuer schema, independent verifier implementation or evidence registry |
| **EXP-07 — regime / hysteresis** | A monitor may report regime evidence but cannot select or rewrite the governing thresholds or authorize its own controller action | EXP-07 boundary and the no-result-dependent-authority harness | Universal regime thresholds or state machine |
| **EXP-08 — netting / offset** | Gross records remain distinct until a governed profile and the relevant IMMORTAL contract permit compatible netting | EXP-08 boundary; Arb S1 keeps typed gross OpenExposure and does not aggregate/net | Universal netting policy or cross-stream offset |
| **EXP-09 — transfer / novation** | A change of owner, worker or account label is not by itself an authorized obligation transfer | EXP-09 boundary; Cormia crosswalk says worker reassignment is not novation | Consent, liability transfer and novation semantics |
| **EXP-10 — explicit risk budget** | RiskBudget, RealizedExposure and ProtectedCapital remain separate; a source observation cannot create or enlarge the budget | EXP-10 boundary and Arb consumer mapping | Principal budget issuer, risk measure, limits, reservation and concurrency rules |
| **EXP-12 — observer / authority split** | Observation identity and authority identity are separately bound; observers and models cannot self-authorize | B3 EXP-12 boundary; Arb S1 invariant; Carob predicate-scoped authority model | Which institution or committee is trusted for each consumer and the complete key/issuer lifecycle |

## 8. Open decision register — owners, not invented solutions

| Open item | Decision owner / scope | Current state | Required next evidence or decision |
|---|---|---|---|
| Generic meaning and identity of issuer, verifier/appraiser and relying authority | IMMORTAL EXP-06/12, subject to constitutional governance | OPEN | Decide semantic distinctions and minimum bindings; do not start from a copied PRE-RICH payload schema |
| Permitted role combinations and required independence | Relevant governance authority + consumer profile | OPEN by class/profile | Identify conflict classes and when independent corroboration is necessary; no universal quorum or threshold is assumed |
| PRE-RICH Issue issuer identity, key ID, policy/audience scope, rotation and revocation | PRE-RICH deployment/governance under IMMORTAL constraints | OPEN | Governed lifecycle and migration decision; preserve V3 parameter/address consequences; production custody evidence |
| Cormia operational mandate and PNC lifecycle | Cormia project-owner / PNC governance | PR #1 and PR #2 remain OPEN drafts | Review/merge/adopt independently; prove Runtime enforcement and persistence. AEP economic jurisdiction JUR-01…06 is not silently adopted. |
| Arb Principal/account control and isolation (D0/D1) | Actual financial Principal and Arb deployment boundary | OPEN; required before S2/S3 | Ownership/control and account/resource isolation evidence; provider credentials are insufficient |
| Arb source/profile coverage and verification | Arb provider-specific profile + independent review | TEMPLATE_ONLY; no provider selected | Official provider semantics, coverage/retention, identity/sequence/correction model, independent evidence review |
| Materios concrete authority-transition and historical storage proof verification | Materios proof implementation / relevant chain deployment | OPEN at proof boundary | Concrete verifier implementation, exact real witness, root/checkpoint binding and independent verification |
| Carob evidence-source authority and conflict policy | Carob agricultural policy for each predicate/site/time scope | Research only | Predicate-specific qualification, uncertainty, independence and conflict adjudication; no global source-ranking policy |
| IMMORTAL/Cardano generalized action evidence contract | IMMORTAL semantics; Cardano Adapter implementation | Current witness still PRE-RICH-shaped | Define generic EXP contracts first; expand adapter capability without moving economic meaning into adapter or relabeling Issue/Reveal/Claim/Expire |

## 9. Recommended closure sequence

This order is intended to prevent duplicate systems and authority escalation. It does not authorize new schemas or production capabilities.

1. **Keep GOV-02 as the governance permission matrix.** Cross-reference it; do not clone P0–P5 into each consumer.
2. **Adopt a shared semantic vocabulary only after review.** Define how statement issuer, source observer, verifier/appraiser, policy authority, relying authority, Principal, operational mandate, economic admission and executor differ.
3. **Declare the consumer authority perimeter.** For each consumer, list the exact subject, action, resource, jurisdiction, evidence classes and policy owner. An unset authority is OPEN/UNVERIFIABLE, not implied from software access.
4. **Reuse existing evidence/proof primitives.** Resolve the exact source contract and proof verifier needed; keep source authentication, proof validity, appraisal and reliance as separate checks.
5. **Resolve D0/D1 before Arb paper/live scope.** S1 stays read-only; no trading, signing, withdrawal, provider credentials or S2/S3 activation.
6. **Resolve PRE-RICH Issue lifecycle through its own governed application migration.** Do not change the current key or V3 parameter through this research matrix.
7. **Only then define any generic EXP-06/12 contract shape and conformance suite.** Bind the contract to existing IMMORTAL adoption and gate paths; do not create an authority service just to hold a schema.
8. **Keep economic admission and adapter realization separate.** IMMORTAL admits the economic transition; the relevant adapter executes and returns independently checkable settlement/finality evidence.

## 10. Explicit non-claims

This document does not claim that:

- GOV-02 P0–P5 are the full universal evidence/issuer lifecycle;
- EXP-06 or EXP-12 is normatively closed or production-complete;
- the multi-oracle prototype has an approved production trust root or canonical source;
- the PRE-RICH Issue key's production custodian or signer deployment is known;
- B2 is a universal or on-chain quorum authority;
- Cormia PNC / AEP PR #1 or PR #2 is merged, adopted or production-enforced;
- Arb has a Principal, live provider, complete account observer, risk budget or execution mandate;
- Materios B3 proof verification is fully implemented or real historical evidence has closed;
- Carob source authority is a universal source-ranking policy;
- successful CI or structural fixtures prove live custody, source truth, production authority or actual settlement.

**Disposition:** this is a source-grounded classification and reuse map for EXP-06/12. The generic authority semantics remain OPEN. No new key, service, registry, threshold, quorum, policy, deployment or ledger action is introduced.
