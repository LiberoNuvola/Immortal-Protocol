# IMMORTAL — EXP-06/12 Update-Authority Predicate & Prior-Art Decision Gate

**Date:** 2026-11-04  
**Status:** research decision record / non-normative / no implementation authorized  
**Branch:** `work/immortal-green-closure`  
**Baseline:** `2b63e58b84a78b243fd6a7782a49eb68b7c0bdf8`  
**Scope:** authority to activate, change, deactivate, revoke and reactivate source/feed/policy entries in a future IMMORTAL registry; reusable implications for EXP-06/12.  
**Non-regression:** no change to GOV-02 permissions, GOV-27 semantics, GOV-30 options, the universal economic kernel, Cardano Oracle State, V3, Reveal, EEV, Issue Admission, PRE-RICH parameters, Cormia AEP/PNC, Materios semantics, or Arb W1/W2/W3.

## 1. Decision result

**No production update-authority model is qualified by the evidence reviewed. The authority gate remains OPEN.**

The existing Multi-Oracle snapshot/currentness code is a useful fail-closed consumer boundary, but it does not provide its own production trust root or currentness provider. The signed snapshot key is caller-supplied; the injected currentness provider's `VERIFIED` status is still an assertion unless its authority and evidence are independently authenticated. Process-local high-water marks do not provide durable rollback protection across restarts.

The existing IMMORTAL Governance framework is a candidate *decision-process owner*, not yet a production authority anchor for registry updates. The inspected canonical event schema carries an `actorClass`, not an authenticated actor identity/credential proof. Governance events require non-empty `EvidenceRef` values, but that is structural presence, not authentication or substantive appraisal. Vote payloads contain an `EntityId`; the inspected boundary does not cryptographically bind that identifier to the submitter's credential. The governance model can compute quorum/approval and replay decision records, but those calculations do not by themselves authenticate the actors or establish a live on-chain governance state.

Accordingly:

- do not reuse the existing Cardano Oracle State publisher as registry authority;
- do not treat a signed snapshot as proof of authorization or currentness;
- do not treat GOV-27 evidence references as authenticated evidence;
- do not promote the current Governance `actorClass` matrix into an actor-authentication mechanism;
- do not select a fixed key, signer set, quorum, challenge period, bond, administrator, or governance threshold in this research record;
- do not call any candidate permissionless unless both the update authorization and the canonical current state can be independently verified.

The immediate deliverable is a **semantic acceptance predicate and an evidence gate**, not a new registry service, schema, signer, contract, or Adapter implementation.

## 2. The claims that must remain separate

An update to the future registry involves at least six independent claims:

1. **Registry identity:** the state object is the intended registry for the exact application/profile/network.
2. **Transition validity:** the proposed successor is structurally valid, uniquely follows the exact predecessor, and binds its version, sequence and digest.
3. **Update authorization:** the actor or governance process was authorized to perform this exact operation over this exact scope under the active ruleset.
4. **Registry currentness:** the consumed state is the canonical current head and includes the effective revocation state; stale/replayed states cannot be accepted after restart.
5. **Source observation authenticity:** a price/provider observation is authentic under its own source-specific verification contract.
6. **Consumer reliance/admission:** the consuming profile accepts the verified registry/evidence for its intended use; an economic transition still passes the applicable IMMORTAL gate.

Passing one predicate does not imply any of the others. In particular, a valid source signature does not authorize IMMORTAL to list that source; a valid governance decision does not prove the source's price observation; and a current registry head does not prove the economic usefulness of an asset.

## 3. Candidate semantic predicate (not a wire schema)

For a proposed change \(\Delta\), the future acceptance rule should be expressible conceptually as:

`UpdateAuthorized(Δ) = Jurisdiction ∧ ActorAuthentication ∧ OperationPermission ∧ ExactChangeBinding ∧ ActiveRuleset ∧ IndependentlyVerifiableDecision`

The registry consumer must additionally establish:

`RegistryCurrent(Head) ∧ NoRollback ∧ RevocationOverlayCurrent`

These are separate predicates. This notation is an analytical contract, not a proposed universal type or serialization format.

A change may be accepted only when all of the following are demonstrated:

- **Jurisdiction:** the governing authority explicitly covers the target registry, consumer/profile, network and operation class. Governance permission in one domain must not silently transfer into another.
- **Actor authentication:** the event signer/submitter is bound to an authenticated identity or to a verifiable governance/authority credential. A role label such as `Reviewer`, `System` or `Voter` is not authentication.
- **Operation-specific permission:** the authority is entitled to perform the requested operation (add, bind/replace, deactivate, revoke, or reactivate) over the exact source/feed/policy scope. Permission to propose is not permission to approve or enact.
- **Exact change binding:** the authorization decision commits to the predecessor identity/version/sequence/digest, the exact successor change, target tuple(s), operation type, applicable policy/ruleset version and effective activation point. A generic approval reference is insufficient if it can be replayed for a different change.
- **Ruleset and policy binding:** the governing rule and consumer policy are identified, immutable/versioned for the decision, and valid at the stated activation point. A policy identifier alone is not proof that the policy was authorized or active.
- **Independent appraisal:** required evidence is verified under an identified verifier implementation and appraisal policy. The verifier's output is evidence for a relying authority; it does not change the policy or approve its own authority.
- **Currentness and replay resistance:** the consumer independently verifies the canonical current registry head and effective revocation overlay. Durable anti-rollback cannot depend only on an in-memory high-water mark.
- **Historical reconstructability:** a later verifier can determine which authority, key, policy, decision and registry head were valid at the relevant time, including around rotation, suspension, compromise and revocation.
- **Recovery:** the system defines how to recover if the authority root or its signing key is compromised or unavailable. Recovery must not rely exclusively on the potentially compromised predecessor key.

Missing or unverifiable proof yields **UNVERIFIABLE**. An explicit scope mismatch, unauthorized operation, invalid transition, replay, revoked tuple or conflicting state yields **REJECTED**. No absence is interpreted as permission.

## 4. Operation-specific lifecycle distinctions

The future authority policy must not collapse registry operations into a generic `update`:

| Operation | Minimum semantic distinction to preserve | Open policy question |
|---|---|---|
| Add | Introduces a previously absent exact source/feed/pair/direction/policy tuple | Who may approve a new tuple and its source-specific evidence contract? |
| Bind / replace | Changes an existing source/feed or asset-pair binding and must identify both old and new values | Is this a new admission, a migration, or both? What historical statements remain valid? |
| Deactivate | Stops future use without necessarily claiming historical evidence was fraudulent | What effective point and consumer behavior apply? |
| Revoke | Marks a tuple or authority as no longer acceptable under a defined reason/scope/time | Is revocation prospective, retroactive, or bounded by an evidenced compromise interval? |
| Reactivate | Re-enables a previously deactivated/revoked tuple through a new explicit decision | Existing research requires revocation tombstones not to disappear silently within the same policy version; the policy/version and reactivation rule remain open. |
| Rotate authority/key | Changes who can authorize future changes while preserving historical verification | What proves old/new continuity, activation time, emergency recovery and the status of ambiguous-window statements? |

The operation semantics, effective-time rules and recovery path must be decided before an executable update predicate is implemented. This record chooses none of them.

## 5. Prior-art comparison — selective reuse, not wholesale adoption

### 5.1 TUF — key roles, delegation and rollback-resistant metadata

The current TUF specification (v1.0.37, updated 8 October 2026) separates Root, Targets, Snapshot and Timestamp roles. Root metadata delegates scoped signing authority and thresholds to other roles; metadata is versioned and expires; clients reject rollback; root rotation is checked through both the previously trusted and successor root thresholds, preserving a traceable chain of trust.

**Useful for IMMORTAL:** scoped delegation, separation of offline root authority from operational signing roles, version/expiry binding, threshold verification as an explicitly chosen profile parameter, and old-root/new-root continuity during rotation.

**Not supplied by TUF:** the initial authority of IMMORTAL's root, the social/governance legitimacy of that root, the rules for deciding whether a price source belongs in IMMORTAL's registry, or a permissionless source-admission predicate. TUF assumes an initially trusted root. It is therefore a strong *key-lifecycle and metadata-security pattern*, not a permissionless governance solution.

Reference: https://theupdateframework.github.io/specification/latest/

### 5.2 RATS — evidence appraisal separated from reliance

IETF RFC 9334 separates an Attester that produces Evidence, a Verifier that appraises Evidence under a policy and produces Attestation Results, and a Relying Party that applies its own policy to decide whether to allow an action. It also distinguishes evidence freshness from appraisal-result freshness and describes timestamp, nonce and epoch-based approaches.

**Useful for IMMORTAL:** the role separation and the notion that the relying consumer must independently appraise the verifier's result. It maps well to EXP-06/12 and to the new cross-consumer responsibility matrix.

**Not supplied by RATS:** the authority that may update IMMORTAL's source registry, the canonical registry head, a concrete trust root, or a durable revocation/rollback mechanism. RFC 9334 is an informational architecture, not an adopted IMMORTAL policy.

Reference: https://www.rfc-editor.org/rfc/rfc9334.html

### 5.3 SCITT — signed statements and transparency receipts

IETF RFC 9943 (2026, Proposed Standard) defines issuer-signed statements and registration with a Transparency Service that returns a receipt proving registration/inclusion in a verifiable data structure. The relying party must know the Transparency Service identity/key to validate receipts; the service also applies its registration policy.

**Useful for IMMORTAL:** immutable/auditable statement identity, signed issuer claims, registration receipts, and traceable evidence history for source-admission decisions and key-lifecycle events.

**Not supplied by SCITT:** authority for the IMMORTAL policy itself, permission to activate a source, or the consumer's independent decision to rely on the issuer/verifier. A receipt establishes transparency-service registration/inclusion under its trust model; it is not an IMMORTAL economic admission or a substitute for the update-authorization predicate. SCITT also does not choose IMMORTAL's revocation policy.

Reference: https://www.rfc-editor.org/rfc/rfc9943.html

### 5.4 Cardano CIP-1694 — native governance, but a different jurisdiction

CIP-1694 defines Cardano ledger governance with distinct Constitutional Committee, DRep and SPO roles and action-specific ratification requirements. It supports on-chain committee updates and other ledger governance transitions. Its Info action is explicitly not ratified/enacted and has no protocol effect.

**Useful for IMMORTAL:** a concrete example of jurisdiction-scoped, action-specific governance and on-chain state transitions whose ratification requirements depend on the action type.

**Not supplied automatically:** IMMORTAL application authority over arbitrary source/feed/policy entries. Cardano's protocol governance is not identical to IMMORTAL's economic/source governance. Treating a Cardano Info action, a DRep poll, or a token vote as a binding IMMORTAL registry update would be incorrect without a separate adopted bridge and proof that the relevant authority action is effective.

Reference: https://cips.cardano.org/cips/cip1694

### 5.5 Existing IMMORTAL Governance / GOV-27 / GOV-30

The current inspected surfaces already separate event authorization, evidence-reference presence and ruleset compatibility:

- `GovernanceAuthorization.hs` maps event types to actor classes.
- `GovernanceEventSchema.hs` carries `actorClass`, a payload, commitment, predecessor and `EvidenceRef` values.
- `GovernanceCommitment.hs` checks the canonical SHA-256 commitment.
- `RulesetRegistry.hs` maintains an immutable, monotonically appended ruleset history.
- `Governance.hs` models snapshots, votes, quorum/approval calculations, delegation and lifecycle.
- GOV-27 explicitly states that evidence references are structural and that actor identity authentication and cryptographic evidence authenticity are not proven.
- GOV-30 is explicitly a discussion draft and records issuer identity/key binding, policy/audience, lifecycle, revocation, historical validation and production custody as open.

**Useful for IMMORTAL:** existing governance lifecycle and ruleset/adoption vocabulary, canonical commitments, separate authorization/evidence/ruleset gates, and decision/conformance witnesses. Reuse these rather than duplicating GOV-02 P0–P5 or creating a second governance matrix.

**Critical limitation:** the inspected GOV-27 canonical event does not itself bind an authenticated actor credential to `actorClass`; a non-empty `EvidenceRef` is not an authenticated evidence object. The pure replay/quorum model is not, by itself, a production governance trust root or ledger-verifiable authority provider. It cannot be promoted to source-registry update authority without closing those authentication, evidence resolution, finality and deployment gaps.

Internal references:
- [GOV-27 — Authorization, Evidence & Ruleset Binding](../01-formal-records/governance/GOV-27-AUTHORIZATION-EVIDENCE-RULESET.md)
- [GOV-30 — Authority Roles & Key Lifecycle Options](../01-formal-records/governance/GOV-30-AUTHORITY-ROLE-AND-KEY-LIFECYCLE-OPTIONS.md)
- [EXP-06/12 Authority-Class & Responsibility Crosswalk](EXP-06-12-AUTHORITY-CLASS-RESPONSIBILITY-CROSSWALK-v1.md)
- [Multi-Oracle update-authority evaluation](../../audit/pre-genesis-genesis/MULTI-ORACLE-REGISTRY-UPDATE-AUTHORITY-EVALUATION-20261029.md)

## 6. Candidate disposition

| Candidate | Reusable contribution | Missing proof / dependency | Disposition |
|---|---|---|---|
| Existing external source registry | Could supply an independently governed current head if one is identified | No candidate has been shown to govern IMMORTAL's exact source/feed/policy tuples and revocations | Not qualified |
| TUF-style root/delegated roles | Key purpose, scope, succession, versioning, expiry and rollback resistance | Initial root authority and IMMORTAL source-admission policy remain external decisions | Reuse as design reference only |
| RATS role/appraisal model | Evidence → verifier appraisal → relying-party policy | Does not authorize registry changes or provide currentness | Reuse semantic separation |
| SCITT transparency service | Signed statements, registration receipts and audit history | Transparency registration is not source-admission authority; TS trust root and policy remain | Optional evidence-history reference; no deployment selected |
| Cardano CIP-1694 governance | On-chain action-specific ratification and committee lifecycle | Different jurisdiction; no approved bridge from Cardano governance actions to IMMORTAL source policy | Comparative reference only |
| Existing IMMORTAL Governance | Existing proposal/vote/finality/ruleset concepts | Authenticated actor credential, evidence resolution, effective canonical governance state and production proof not demonstrated by inspected path | Potential decision owner after qualification; not a current production trust root |
| Dedicated Cardano registry singleton | Unique state identity and ledger-enforced successor/current-head transitions | Does not prove who may authorize the source-set change; needs an approved update predicate and ledger-level proof | Target state pattern only; no implementation approved |
| Trusted currentness service | Could provide durable current-head/revocation state if independently anchored | Named operator, authority/key lifecycle, durable store, compromise/recovery and availability policy | Explicit fallback only; none selected |

## 7. Proposed acceptance test matrix before implementation

The tests below are requirements for a later approved implementation, not evidence that the behavior exists today.

### Positive vectors

1. An authorized update binds the exact predecessor and successor registry state, operation, target tuple and active policy/ruleset.
2. A valid authority rotation proves continuity and its activation point; historical statements remain verifiable under the historical authority state.
3. A valid revocation becomes effective at the stated verifiable point and appears in every subsequent currentness result.
4. A verifier can independently reconstruct the authority, policy, decision, registry head and evidence applicable to a historical consumer decision.
5. A currentness proof remains rollback-resistant after process restart and from a fresh independent verifier.

### Negative/adversarial vectors

1. Correct signature but unauthorized issuer/actor, unknown credential, wrong jurisdiction or wrong operation.
2. Approval for one tuple replayed against another tuple, registry, consumer, network or policy version.
3. Valid old snapshot with stale currentness checkpoint; decreasing registry/control sequence; same-sequence equivocation.
4. Revocation removed without a valid reactivation decision; reactivation without the required policy/version transition.
5. Evidence reference present but missing, unavailable, digest-mismatched, unauthenticated, stale or appraised under an unapproved policy.
6. Governance event with a claimed actor class but no credential proof, a mismatched actor/voter identity, or an invalid decision/finality witness.
7. Root/key compromise, unavailable predecessor, attempted emergency recovery under the compromised authority, or ambiguous activation interval.
8. Indexer/provider disagreement, incomplete currentness evidence, or no independently verifiable canonical state.

A structural JavaScript fixture test is not sufficient for currentness authority. The applicable proof must be checked by an independent verifier and, for a Cardano target, by ledger-level tests measuring transaction/script size and execution cost.

## 8. Closure order and ownership

1. **Jurisdiction decision — IMMORTAL governance:** identify which governing process may authorize changes to the universal source-admission contract versus a consumer/profile-specific source set. Keep GOV-02 P0–P5 as the existing governance permission baseline.
2. **Actor authentication — governance/identity boundary:** prove the actor or credential and its binding to the permitted governance role. Do not infer identity from `actorClass`, repository access, wallet connection or API credentials.
3. **Evidence appraisal and reliance — EXP-06/12:** resolve the evidence contract and independent verifier path; the relying consumer must state which verifier/policy result it accepts for this use.
4. **Update lifecycle — authority decision:** settle add/replace/deactivate/revoke/reactivate, rotation, compromise, recovery and historical-verification semantics, without choosing numerical thresholds by implication.
5. **Canonical currentness — registry/adapter profile:** independently prove the latest state and revocation overlay with durable anti-rollback.
6. **Executable conformance:** implement only the selected path and test the complete binding from governance decision to exact registry state transition.
7. **Consumer expansion:** only then allow Cardano Adapter and provider-specific consumers to consume the verified registry result. The Adapter transports and proves chain-specific facts; it does not define economic authority.

**Owners and exclusions:**
- IMMORTAL owns universal authority/evidence semantics and the economic admission boundary.
- The consumer/profile owns the concrete source eligibility and relying policy within its jurisdiction.
- Cardano Adapter owns Cardano state/transaction/proof realization, not the update policy.
- Cormia Project Mandate/PNC governs bounded project/task authority; neither is automatically a financial Principal or source-registry authority.
- Arb remains S1 read-only until D0 Principal/financial authority and D1 account/resource isolation are independently closed. Arb must not issue source-registry approvals.
- PRE-RICH Issue key identity/rotation remains its own governed application migration. Nothing in this record changes V3 key parameters or carrier addresses.

## 9. Explicit decision and next gate

**Decision:** keep the update-authority gate OPEN; adopt no signer, quorum, governance authority, external registry, Cardano singleton, transparency service or trusted service at this stage.

**Preferred research direction:** retain a governed decision as the source of permission, combine it with a TUF-like scoped key/lifecycle pattern where appropriate, use RATS-like verifier/relying separation, and use an auditable transparency/evidence trail where useful. A dedicated Cardano registry may later carry the canonical current state, but it must enforce a separately qualified update-authorization proof. This is a composition of proven responsibilities, not an assertion that any one prior-art system solves the entire problem.

**Exit condition:** the gate can close only when a named authority model and jurisdiction are approved, actor credentials and evidence are independently verifiable, exact change authorization is bound to canonical predecessor/successor state, key/revocation/recovery semantics are governed, currentness is durable against rollback, and positive/negative conformance evidence passes on the actual execution boundary.

Until then, no production currentness, source activation or registry-authority claim is permitted. No code, workflow, wallet, transaction, deployment or on-chain state was changed by this analysis.
