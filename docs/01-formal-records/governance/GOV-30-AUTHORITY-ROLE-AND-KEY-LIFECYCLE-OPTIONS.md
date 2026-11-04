> **FORMAL GOVERNANCE RECORD — NON-NORMATIVE BY ITSELF.** This document records an analysis and a set of unresolved design options. It does not amend the Constitution, canonical specifications, existing normative decisions, or deployed application semantics.

# GOV-30 — Authority Roles & Key Lifecycle Options

## Status

**DISCUSSION DRAFT — NO NORMATIVE DECISION / NO IMPLEMENTATION AUTHORIZED**

This record follows the EXP-06 / EXP-12 trust-root audit on `work/immortal-green-closure` (baseline `c00f5ade42bc7c509977bb247171f97d77cce57a`). Its purpose is to make the open decision surface explicit before any reusable authority model is specified.

It does not define a new envelope, key registry, issuer service, trust-anchor store, signer, quorum, cryptoperiod, revocation rule, timestamp authority, or migration procedure. It does not authorize key creation, replacement, rotation, deployment, or on-chain change.

## 1. Executive synthesis

The current gap is not simply “we need a public key field”. Several different questions are currently easy to collapse into one:

1. **Integrity and origin authentication:** do these exact bytes verify under a public key?
2. **Issuer attribution:** which issuer identity is represented by that key, and is that issuer entitled to make this class of statement?
3. **Appraisal:** which verifier evaluated the evidence, under which appraisal policy, and with what result?
4. **Reliance:** which relying authority accepts that issuer, verifier, result, policy and context for this particular use?
5. **Protocol admission:** does the IMMORTAL normative gate permit the proposed transition given the authenticated and appraised inputs?
6. **Execution and settlement:** did the selected adapter execute the admitted transition, and what independently checkable evidence records the outcome?

A successful signature answers only the first question unless the protocol separately binds and validates the remaining relationships. Likewise, a structurally present evidence reference is not proof that the referenced object exists, is authentic, or satisfies a substantive appraisal rule.

The central design requirement is therefore **separation of responsibilities and explicit binding between them**, not the immediate creation of a universal authority service.

## 2. Role vocabulary to keep distinct

The following is a working vocabulary for analysis. It is not yet a canonical schema.

| Role | Responsibility | Output or decision |
|---|---|---|
| Evidence producer / attester | Produces claims, measurements, observations or other evidence about a subject or event | Evidence object |
| Issuer | Makes and signs an attributable statement; its identity is distinct from the key material used to sign | Signed statement |
| Key custodian / signer operator | Protects and operates signing material on behalf of an issuer or delegated principal | Signature operation and custody evidence |
| Verifier / appraiser | Checks signature and provenance as applicable, evaluates evidence against an identified appraisal policy | Appraisal result |
| Verifier-policy authority | Controls which appraisal policy a verifier is configured to apply | Policy version / policy authorization |
| Relying authority | Decides whether a particular issuer, verifier and appraisal result are acceptable for a defined use and context | Reliance decision |
| IMMORTAL admission gate | Applies protocol-level normative constraints to already qualified inputs and proposed transitions | Admission / rejection / unverifiable outcome |
| Adapter executor | Maps an admitted transition to a concrete ledger or external system and reports execution evidence | Execution / settlement evidence |

### 2.1 Roles are logical, not necessarily separate services

One entity may perform more than one role, and multiple entities may cooperate in one role. This does not remove the need to record which responsibility was performed and which policy governed it.

For example, an issuer may operate its own signer and verifier. That arrangement can be valid under a chosen trust model, but it does not make issuer, signer, appraiser and relying authority synonymous. A relying authority may also operate a verifier while retaining a separate policy for deciding whether to rely on that verifier's result.

The design must decide which role combinations are acceptable for each authority class. This document does not impose universal separation-of-duty rules.

## 3. Existing implementation boundary: PRE-RICH Issue

The current PRE-RICH Issue path is a concrete application-specific trust anchor, not a universal IMMORTAL issuer lifecycle.

The source audit recorded the following:

- The off-chain Issue verifier receives an externally configured Ed25519 public key through `ISSUE_AUTHORITY_PUBLIC_KEY`.
- That configured key is used to verify both the signed Issue payload and the carrier-binding signature.
- The V3 deployment helper derives the parameterized carrier validator from the same configured public key. The on-chain carrier validator checks the carrier-binding signature against that deployment parameter.
- The Issue payload binds application-specific references and digests, including Counter/control/Pool/carrier references, observation and decision references, pre-state/action/post-state digests, EEV evidence and deployment-approval/source-set binding.
- `authorityVersion = '1'` is a contract/schema version in the current payload; it is not an issuer identity or key identifier.
- The audited verifier does not currently bind a signed issuer identity, key identifier, relying-party audience, appraisal-policy identity, key validity interval, revocation status or supersession statement.
- Freshness is currently checked using the verifier host's `Date.now()`.
- The off-chain verifier checks the full Issue payload. The Plutus carrier validator checks the carrier-binding signature; it does not independently re-appraise the complete EEV payload.
- The V3 public key is a validator deployment parameter. Replacing it changes the parameterized script identity and therefore the relevant address/deployment identity; rotation is not equivalent to changing an environment variable.
- The existing ephemeral-key Ed25519 test proves positive and negative verifier behavior for test fixtures, not production key custody or signer deployment.
- GOV-27 evidence references are structural references. They do not, by themselves, authenticate evidence objects or issuer identities.

These findings are scoped to the audited PRE-RICH implementation and audit head. They must not be generalized into claims about every IMMORTAL consumer.

Related records: [GOV-25 — Cryptographic Commitment](GOV-25-CRYPTOGRAPHIC-COMMITMENT.md), [GOV-26 — Binding & Validity](GOV-26-BINDING-AND-VALIDITY.md), [GOV-27 — Authorization, Evidence & Ruleset Binding](GOV-27-AUTHORIZATION-EVIDENCE-RULESET.md), [GOV-28 — Full Governance Conformance](GOV-28-FULL-GOVERNANCE-CONFORMANCE.md), and the [EXP-06/12 trust-root audit harness](../../../audit/algorithmic-governability/README.md).

## 4. Open design options

The options below are alternatives to evaluate, not recommendations already adopted.

### 4.1 Issuer identity and key binding

**Option A — application-configured key.** Each consumer profile configures a public key and treats it as the issuer trust anchor for a narrowly defined action. This resembles the current Issue path. It is comparatively simple, but issuer identity, key lifecycle and cross-consumer reuse remain external or implicit unless separately specified.

**Option B — governed issuer-to-key binding.** A governed record binds an issuer identity to one or more key identifiers, with explicit scope and lifecycle. Consumers resolve the binding according to an accepted trust policy. This makes identity and succession explicit but requires a governance process, canonical identity rules, history and failure semantics.

**Option C — delegated trust chain.** A consumer trusts an issuer through an endorser, certificate authority or other delegated trust chain. This can scale across many issuers, but introduces path validation, delegation scope, trust-anchor governance and dependency on the chosen trust infrastructure.

Unresolved questions include issuer namespace, uniqueness, delegation, cross-profile identity reuse, key identifier semantics and how an issuer proves authority for a particular statement class.

### 4.2 Key-purpose separation

**Option A — one key for multiple signature purposes.** This minimizes key inventory and operational complexity, but makes compromise and policy boundaries broader.

**Option B — distinct keys by purpose or authority domain.** This narrows the effect of a compromised key and makes purpose-specific custody possible, at the cost of additional key lifecycle and configuration.

**Option C — hybrid.** A root or governance key authorizes subordinate purpose-specific keys, while application keys sign operational statements.

RFC 9943 §9.4 says Issuers and Transparency Services MUST protect private signing keys, avoid using keys for more than one purpose, and rotate keys at a cryptoperiod appropriate to the algorithm and domain-specific regulation. This is relevant prior art, not an automatic IMMORTAL parameter or a decision that the present PRE-RICH key must be changed. The exact boundary between an issuer statement signature and an on-chain carrier-binding signature remains a decision.

### 4.3 Verifier and appraisal-policy authority

**Option A — consumer-operated verifier.** Each application profile operates or configures its own verifier and appraisal policy. This aligns local responsibility with local risk, but can create policy duplication.

**Option B — shared verifier, consumer-specific reliance.** A shared verifier produces an appraisal result, while each relying consumer independently decides whether that result is acceptable. This separates evidence appraisal from application authorization.

**Option C — independent or multi-party appraisal.** Multiple verifiers or reviewers contribute evidence to an appraisal. This can reduce dependence on one verifier, but requires a decision about disagreement, independence, quorum and failure handling.

A committee or threshold verifier is not automatically the protocol's relying authority. PRE-RICH B2 currently supplies a separate application-specific off-chain committee verifier; the audit found it is not the V3 Issue trust root and does not establish an on-chain Plutus quorum for the relevant transition. It is prior art for a distinct mechanism, not a generic threshold decision.

For every option, the policy authority must be distinguishable from the verifier that executes the policy. Otherwise, a verifier's ability to report a result can be confused with authority to change the criteria under which that result is accepted.

### 4.4 Scope, audience and action binding

A future signed statement or appraisal result may need to bind some or all of the following, depending on the domain:

- issuer identity and key identifier;
- subject / object identity and network or deployment domain;
- action class and permitted operation;
- intended consumer or audience;
- appraisal-policy identity and version;
- evidence-set identity or digest;
- relevant pre-state, action and post-state commitments;
- issue time, validity interval or freshness challenge;
- lifecycle reference such as supersession or revocation.

This is a decision checklist, not a field list to copy into a universal envelope. Each field must have a stated semantic owner and validation rule. An identifier without a resolver or governed binding does not establish authorization. A policy identifier without an authenticated policy version does not establish which rules were applied.

### 4.5 Activation, rotation and historical verification

Three broad transition patterns need evaluation:

1. **Externally managed trust configuration:** a relying consumer changes its configured trusted key. This is simple operationally but risks silent or non-auditable trust changes unless the change itself is governed and recorded.
2. **Signed succession statement:** an already trusted authority signs a transition to a successor key, with explicit activation semantics and a verifiable history. This requires rules for the case where the predecessor is compromised or unavailable.
3. **Independent governance transition:** an authorized governance process approves the new key and its scope without relying solely on the predecessor key. This can handle compromise, but requires a clearly established governance authority and an auditable activation boundary.

All patterns must answer separately:
- when the new key becomes valid for new statements;
- whether the old key remains valid for historical statements;
- which evidence proves the transition and its activation point;
- how verifiers reproduce the trust decision later;
- what happens to statements signed during an ambiguous transition window.

A key rotation must not erase the ability to validate historical statements. “The signature verifies today” and “the signer was authorized at the statement's relevant time” are different claims.

**PRE-RICH-specific constraint:** because the V3 public key is embedded as a validator parameter, a key change affects script identity/address. Any future rotation would therefore need an explicit application migration and continuity design, covering old and new carrier instances and historical observations. This record does not select such a migration.

### 4.6 Revocation, retirement and compromise

The following states must not be treated as synonyms:

- **retired:** no longer used for new statements under normal operation;
- **superseded:** replaced by a successor under an accepted transition;
- **revoked:** no longer accepted under a defined revocation rule;
- **compromised:** the key or its custody is believed to have been exposed, potentially invalidating statements within a defined interval;
- **suspended / disputed:** temporarily not accepted while an issue is investigated.

A policy must decide whether compromise invalidates all historical signatures, only signatures after a known compromise time, or a narrower set supported by evidence. It must also define how the compromise time is established, communicated, audited and applied by relying consumers.

RFC 9943 §9.4.2 explicitly discusses communicating key compromise so that signed statements can be rejected or receipts ignored, while leaving revocation strategies out of scope. It therefore highlights the need for a policy but does not supply IMMORTAL's revocation model.

### 4.7 Time and freshness

The current Issue verifier's host-clock check is an implementation-specific freshness mechanism. A reusable protocol must decide what “fresh” means for each evidence type and which time source or challenge mechanism supports that claim.

Options include:
- timestamps checked under a stated clock-trust and skew model;
- nonce/challenge-based freshness, requiring replay state;
- chain slot, epoch or other externally verifiable ordering evidence;
- combinations where evidence recency and appraisal-result freshness are checked separately.

No universal duration, clock-skew tolerance, expiry interval or trusted time authority is selected here. Such values depend on the evidence source, application risk and governing decision. A verifier's local clock must not silently become a universal trust root.

## 5. Allocation of responsibility across IMMORTAL and consumers

| Concern | Candidate owner | Boundary |
|---|---|---|
| Role vocabulary and distinctions between evidence, appraisal, reliance, admission and execution | IMMORTAL / EXP-06 / EXP-12 | Generic semantic contract; does not mandate one key technology |
| Authenticated binding between an issuer, key, statement scope and lifecycle | IMMORTAL generic contract, once governed | Defines what must be established; profile supplies concrete identifiers and mechanisms |
| Appraisal-policy semantics and evidence-specific acceptance criteria | Domain / consumer profile | The policy's authority and version must be explicit |
| Application action classes, audience, contract references and EEV requirements | PRE-RICH profile | No leakage of PRE-RICH mechanics into universal IMMORTAL |
| Chain-specific key parameters, script identity, activation and historical ledger proof | Cardano adapter / PRE-RICH deployment profile | Must preserve the generic contract while respecting ledger constraints |
| Worker/task identity, execution delegation and operational task budgets | Cormia | Does not create a second economic or protocol authority kernel |
| Observation provenance and authority-set transition evidence | Materios-facing evidence adapter / profile | Evidence/proof verification is distinct from decision authority |
| Arbitration or trading strategy decisions | Arb Agent consumer profile | It consumes authorized data and admission; it does not become the authority root by virtue of executing a strategy |

The generic IMMORTAL layer should specify the relationships that a consumer must establish and the conditions under which missing or unverifiable relationships fail closed. It should not impose Cardano addresses, Ed25519 payload formats, a central registry product, a specific hardware custody model, a committee size, or an application-specific risk threshold.

## 6. Decision sequence before schema or implementation

The following decisions should be made in order. Later choices depend on earlier ones.

1. **Authority classes:** identify which classes of statements and actions need an issuer, appraiser, relying authority or governance authorization. Do not assume one universal authority class.
2. **Identity and delegation:** choose issuer identity semantics, key identifiers, delegation and namespace boundaries.
3. **Role combinations:** decide which actors may combine issuer, signer, verifier, policy-owner and relying-authority roles for each class.
4. **Scope and policy binding:** decide how action, subject, audience, evidence set and appraisal policy are identified and bound.
5. **Lifecycle:** choose activation, succession, retirement, revocation, suspension and compromise semantics.
6. **Historical validation:** decide how a later verifier reconstructs which key and policy were authoritative at the relevant time.
7. **Time and freshness:** select evidence-specific time/challenge models and their trust assumptions.
8. **Recovery and migration:** define application-specific migration where authority material is pinned into an on-chain script or other immutable deployment identity.
9. **Operational assurance:** determine what production custody, signer operation, independent observation and deployment evidence is required before claiming a trust root is live.

No implementation should skip these decisions by turning a current environment variable, a test key, a committee configuration or a structural evidence reference into a universal authority policy.

## 7. Interim disposition

Until the decisions above are made:

- retain the current PRE-RICH Issue trust path as an **application-specific existing mechanism**; do not silently generalize it;
- keep generic EXP-06 authenticated appraisal and EXP-12 authority lifecycle **OPEN**;
- do not create a universal issuer/key registry, trust service or signer as a presumed solution;
- do not rotate, replace or re-purpose the current Issue/V3 key, alter the V3 carrier parameter, or initiate an on-chain migration under this record;
- do not treat B2 committee attestations, Materios authority-transition interfaces or GOV-27 evidence references as interchangeable trust roots;
- report production key custody, signer operation and live deployment as unverified until their own evidence exists.

This is a containment statement about the current design gap, not a new normative rejection rule for existing consumers.

## 8. Prior art and limits of adoption

### RFC 9334 — RATS Architecture

[RFC 9334](https://www.rfc-editor.org/rfc/rfc9334.html) provides a useful role model: an Attester produces Evidence; a Verifier appraises it under an appraisal policy and produces an Attestation Result; a Relying Party applies its own policy to decide whether to act. It also explicitly permits roles to be combined in one entity or distributed across entities. Its freshness discussion distinguishes evidence freshness from appraisal-result freshness and describes timestamp- and nonce-based patterns.

**Use here:** vocabulary and separation of evidence appraisal from application-specific reliance.

**Do not infer:** that RATS defines IMMORTAL's economic authority, issuer governance, key registry or revocation policy. RFC 9334 is an informational architecture, not an IMMORTAL implementation specification.

### RFC 9943 — SCITT Architecture

[RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html) is a 2026 IETF Proposed Standard for transparent signed statements. It binds issuer identity into the protected signed envelope, requires trust anchors and signature checks in its registration model, and addresses key-purpose separation, key rotation and compromise communication. Its own text leaves revocation strategies out of scope and does not define how all statement history is managed or how participants discover changes.

**Use here:** issuer identity bound to signed content, explicit trust anchors, auditable statement history, key-purpose separation and the need for compromise communication.

**Do not infer:** that IMMORTAL must deploy a SCITT Transparency Service, adopt COSE/CBOR, or inherit SCITT's registration model. These are candidate mechanisms, not selected architecture.

### Internal prior art

- **Materios GRANDPA authority transition:** useful distinction between untrusted authority-set evidence and a trusted state created only through a proof-verifier boundary, with chain/genesis, set continuity and activation context. The audited POC still exposes an injected verifier interface rather than a supplied concrete cryptographic proof verifier. It is not a general issuer/key registry.
- **PRE-RICH B2 Beacon committee:** useful application-specific off-chain member/threshold verification pattern. It is not the V3 Issue trust root and does not establish on-chain quorum enforcement for the audited transition.
- **GOV-25–GOV-28:** already separate commitment integrity, event validity, actor authorization, evidence-reference presence and ruleset compatibility. They should be composed with, not replaced by, issuer authentication and substantive evidence appraisal.

## 9. Explicit non-claims

This document does not claim that:

- production Issue signing keys or custody have been verified;
- an issuer/key registry or lifecycle currently exists;
- the current PRE-RICH Issue key is rotated, revoked, compromised or ready for rotation;
- the B2 committee is an IMMORTAL-wide authority;
- Materios currently supplies a concrete GRANDPA proof verifier through the audited POC;
- GOV-27 authenticates referenced evidence;
- a valid signature proves evidence truth, appraisal correctness, relying authority or economic admission;
- a green source-level conformance guard proves a production signer, live service, deployed validator or on-chain transaction.

**Disposition:** GOV-30 records the unresolved design space for EXP-06 / EXP-12. A subsequent normative decision must select the applicable authority classes and lifecycle rules before any generic schema or runtime implementation is proposed.


## 10. 2026-11-04 clarification — actor identity, credential and event binding

**Status:** semantic clarification / non-normative / no identity model, credential format or implementation authorized. This section narrows the open questions already identified above; it does not create a new governance matrix, identity registry or wire schema.

### 10.1 Identity terms that must not be conflated

The inspected Governance implementation has several different concepts which must remain distinct:

| Concept | Meaning | Current source boundary |
|---|---|---|
| **Governance representation entity** | The EntityId whose eligibility/weight is evaluated for a proposal snapshot; it is a protocol representation identifier, not proof of one unique human. | Vote.voter, proposal snapshot and delegation calculations in Governance.hs. |
| **Actor identity** | The protocol-level actor to whom a permission or mandate is attributed for a particular action. It may identify a person, organization, process or governed entity according to the eventual policy. | Not authenticated by the current CanonicalEvent path. |
| **Actor class** | A category used by the event-type authorization matrix (Proposer, Voter, Reviewer, System, etc.). | CanonicalEvent.actorClass; it is a permission classification, not an actor identity or credential. |
| **Credential / verification key** | Cryptographic material or a credential whose proof can establish control/possession or an issuer-backed claim under a specified trust model. | The generic Governance event path does not currently bind such a proof to an actor. |
| **Signer** | The key or signing service that produces a cryptographic signature. Its operator/custodian may differ from the actor whose decision is represented. | Role vocabulary in GOV-30 §3; no generic signer binding selected. |
| **Submitter / transport** | The process or service that submits an event to a repository, API, chain or canonical log. It may relay another actor's authorized statement. | Not represented as a separately authenticated principal in the current Governance event schema. |
| **Delegated actor** | An actor acting within an explicit authority delegated by another actor or mandate, with scope and lifecycle. | Delegation semantics exist in the governance model, but credential-to-delegation authentication and the accepted trust source remain open. |

GOV-06's separation of economic ownership, governance representation and human identity remains controlling: a wallet, address or EntityId is not automatically a unique human. **Credential authentication is not an anti-Sybil guarantee.** A signature can establish that a key signed a message under its cryptographic assumptions; it does not prove one-person-one-credential, legal identity, token ownership, account control, or authority to perform the action.

### 10.2 Separate claims required for a governance event

A future conforming event path must establish these claims independently. This is a semantic decomposition for analysis and testing, not a proposed serialization:

1. **Canonical event integrity:** exact canonical bytes, payload, predecessor, commitment and ruleset reference are internally consistent under GOV-25/26.
2. **Credential proof validity:** a signature or other credential proof verifies over the exact event/decision context and intended cryptographic purpose. A valid signature proves only what that proof mechanism is specified to prove.
3. **Credential-to-actor binding:** an independently accepted binding establishes that the credential was attributable to the claimed actor identity for the relevant purpose and time. A key identifier or certificate subject without an authenticated resolver/binding is insufficient.
4. **Actor-to-permission binding:** the authenticated actor is allowed to perform this event type and exact operation within the applicable jurisdiction, object/scope and active governance rules. This reuses GOV-02 P0–P5 and GOV-27's event/ruleset structure; it does not duplicate them.
5. **Representation or delegation binding:** where an event represents a governance EntityId (especially VoteCast), the authenticated acting actor must be shown to be that represented entity or an explicitly authorized delegate under the applicable proposal snapshot and delegation rules. A signature from actor B must not silently be recorded as a vote from entity A.
6. **Submission attribution:** if a relayer, adapter, agent or service submits an event for another actor, the record must preserve the distinction between decision actor, credential signer and transport submitter. Submission access alone grants no governance permission.
7. **Evidence appraisal:** each required evidence object must be resolvable and authenticated/appraised under its own accepted evidence contract. An EvidenceRef or its inclusion in a digest does not prove existence, authenticity, completeness or truth.
8. **Canonical decision and finality:** accepted decision, challenge/finality state and canonical history must satisfy GOV-28 and applicable rules. A valid actor signature does not itself finalize a proposal or enact a decision.
9. **Relying-context acceptance:** the relying authority must determine that the authenticated decision is effective for the target consumer, registry, network and operation. A governance event in one jurisdiction does not silently authorize another profile or economic transition.

No single credential, signature, actor label, evidence digest or CI result is sufficient to collapse these claims into one authorization assertion.

### 10.3 Special case — VoteCast and delegated representation

The current Vote payload contains voter as an EntityId, choice and castAt. The state transition checks snapshot weight, voting-window validity and duplicate/delegator restrictions. The canonical event additionally carries actorClass; it does not bind voter to an authenticated signer/submitter credential.

A later implementation must therefore answer, without assuming a human-identity model:

- Is the credential directly controlled by the represented EntityId, or is the entity represented through a governed delegate?
- If a delegate signs, what proof binds the delegate to the exact EntityId, proposal, voting window and delegated scope?
- How do snapshot eligibility, credential validity and delegation validity align at the relevant event time?
- How are revocation, key rotation and historical verification applied to a vote already included in a canonical decision?

These are conformance questions against the selected GOV-06/GOV-14 representation and delegation rules. This note does not choose a voting credential, identity provider, wallet-signature model, delegation depth or new voting rule.

The same principle applies to System, Reviewer, Delegate and other actor classes: a class name does not identify the concrete system/reviewer/delegate or authenticate the process that emitted the event.

### 10.4 Delegation, issuer and key custody

The relationship between actor and signer must be explicit when they are not the same:

- **Issuer** attributes a statement to an identity.
- **Key custodian / signer operator** protects or operates the signing material.
- **Delegated actor** acts under a bounded mandate.
- **Verifier / appraiser** checks the proof and relevant evidence.
- **Policy authority** controls the criteria.
- **Relying authority** decides whether the result is accepted for a stated use.
- **Submitter / adapter** transports the statement or realizes an already authorized action.

A role may be combined operationally only where applicable policy permits it; combining roles does not create additive authority. When a policy requires independence, multiple keys or endpoints under the same effective controller do not automatically constitute independent authorities.

Credential issuance, identity binding, delegation, key purpose, revocation, recovery and historical verification remain under the open GOV-30 decision sequence. No universal issuer, root, credential type or separation-of-duty rule is selected here.

### 10.5 Cross-consumer ownership and prior-art reuse

| Consumer / prior art | Reuse boundary | Must not be inferred |
|---|---|---|
| **IMMORTAL Governance** | GOV-02 remains the permission matrix; GOV-25/26 integrity and canonical validity; GOV-27 authorization/evidence/ruleset gates; GOV-28 replay/finality conformance. IMMORTAL EXP-06/12 states generic semantic relationships and fail-closed evidence requirements once approved. | Existing governance code or actorClass is not a production identity/credential resolver or authority root. |
| **PRE-RICH Issue / Cardano** | Reuse the exact existing application-specific signed Issue and V3 carrier-binding path only within its declared deployment. The Cardano Adapter preserves transaction, key-parameter and execution-evidence binding. | The configured Issue Ed25519 key is not a generic IMMORTAL governance key; wallet signature, script parameter or adapter submission does not establish universal actor authority. |
| **Cormia** | Cormia owns local operator consent, Project Mandate, task child authority, host identity and Runtime enforcement within its project/workspace scope. Its prior-art review identifies A2A for agent interoperability, Cedar/OPA for policy-decision engines, and UCAN/Biscuit as candidate attenuated-capability patterns to compare. | ADR-0009/0010 remain proposed, not production-enabled. Project Mandate is not financial Principal authority; tool/API credentials do not prove account ownership or authorize IMMORTAL economic actions. |
| **Arb Agent** | Arb supplies provider-specific read-only observations and mapping to IMMORTAL contracts. Its identity/account claims must be established at the appropriate consumer/deployment boundary. | S1 read-only status, CIP-30 connectivity or provider API credentials do not close D0 Principal/financial authority or D1 account/resource isolation; S2/S3 remain unauthorized. |
| **Materios** | Reuse the authority-set transition and proof-verifier boundary as chain-specific evidence, with the concrete verifier and historical witness independently supplied. | A node/adapter or unverified transition interface does not become IMMORTAL governance authority. |

TUF contributes scoped key roles and succession/rollback patterns but assumes an initial trusted root; RATS separates attestation, appraisal and reliance; SCITT contributes issuer-bound signed statements and transparency receipts but does not authorize IMMORTAL policy; A2A supports agent interoperability and declared authentication mechanisms but not project mandate authority; UCAN/Biscuit provide candidate delegated-capability patterns whose root identity and revocation source still require trust; Cedar/OPA separate policy decisions from authentication. These are references, not adopted components. No one of these systems supplies the complete IMMORTAL authority decision.

### 10.6 Required positive and negative conformance cases

Before a generic Governance credential path can be treated as implemented, the selected mechanism must demonstrate:

**Positive cases**
- credential proof verified against the exact canonical event/decision context;
- credential bound to actor identity and applicable time/purpose;
- actor permission matches the exact event, operation, jurisdiction and active ruleset;
- a vote's represented EntityId matches the authenticated actor or a valid, scoped delegate;
- a relayed submission preserves the original decision actor and does not promote the relayer;
- historical signatures remain verifiable under the authority state and policy applicable at event time.

**Negative / adversarial cases**
- actorClass label without actor/credential proof;
- valid signature from an unknown, wrong-scope, suspended or revoked credential;
- credential for one actor, proposal, profile, network, action or ruleset replayed in another context;
- vote whose voter differs from authenticated actor without valid delegation proof;
- transport submitter or adapter attempting to claim the decision actor's permission;
- credential verifies cryptographically but its holder lacks the required GOV-02 permission;
- changed or stale delegation, ruleset, revocation or canonical-history state;
- key rotation, compromise or recovery that cannot be independently reconstructed;
- attempt to infer human uniqueness, PRE ownership or financial Principal authority from credential validity alone.

A structural source guard is useful regression evidence but cannot substitute for cryptographic vectors, resolver/authority verification, full canonical replay, historical-state validation or deployment evidence.

### 10.7 Open decisions retained

This clarification does **not** select or authorize:

- a human-identity or proof-of-personhood model;
- a canonical EntityId namespace or actor-identity resolver;
- an issuer/key/credential registry or trust root;
- a signature envelope, algorithm, key custody provider or key-purpose policy;
- a delegation format, depth, revocation or recovery mechanism;
- a quorum, threshold, governance permission or independence rule;
- a universal timestamp, nonce, expiry or freshness interval;
- production signer custody, deployment, registry or on-chain change.

**Disposition:** GOV-02, GOV-06 and GOV-25–GOV-28 retain their existing scope. This section clarifies the missing actor/credential/event relationship for future EXP-06/12 conformance; it is not a new normative decision and authorizes no implementation.
