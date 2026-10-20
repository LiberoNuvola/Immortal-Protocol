# IMMORTAL — G1 Existing Authority Reuse Audit
## B3 research artifact v1

**Status:** AUDIT COMPLETE / G1 OPEN  
**Target branch:** `work/b3-materios-provenance-evidence`  
**Scope:** Determine whether an already-defined canonical authority mechanism can be reused for runtime Protocol Usage Fee G1 declarations.  
**Effect:** Non-normative research only. No code, tests, CI, deployment, or economic semantics changed.

---

## 1. Question

The preceding G1 Authority and Resolution Contract identifies an unresolved dependency: G1 needs an authoritative declaration that maps a canonical action class to an explicit fee-bearing/fee-exempt value for an exact deployment/profile revision.

This audit asks whether the existing governance machinery already provides that runtime declaration-authority predicate, so that no new authority mechanism needs to be invented.

**Finding:** The repository contains a governance change-authorization architecture and canonical event model. The inspected materials do not establish that this is also a runtime authorization mechanism for individual G1 declarations. Governance approval, canonical adoption, runtime declaration verification, and transition admission remain distinct concerns.

## 2. Canonical constraints

### 2.1 Constitution §2

`docs/00-normative/01_CONSTITUTION_FINAL.md` (v3.0.0) states that no founder, developer, administrator, operator, relayer, publisher, adapter, or frontend gains discretionary economic authority merely by operating infrastructure. Canonical truth derives from defined verification predicates.

**Implication for G1:** a declaration cannot be accepted merely because it was published by the project owner, operator, adapter, frontend, or relayer. The applicable verification predicate must be identified and evaluated.

### 2.2 Canonical transition and failure behavior

`docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md` (v3.0.0) requires:
1. canonical state;
2. authoritative input verification;
3. obligation/exposure derivation;
4. candidate delta;
5. complete post-state;
6. Safe;
7. certified `K_c`;
8. accept/reject;
9. atomic commit;
10. history.

It defines acceptance in terms of complete, verified, fresh authoritative inputs and exhaustive obligation/exposure accounting. Missing or unverified authoritative truth results in **reject / safe stall**. Undefinedness is rejection.

**Implication for G1:** once the G1 declaration is established as a required authoritative input, the general failure behavior is already specified. A G1 implementation must not convert an unresolved status into an inferred true/false value.

### 2.3 Conformance boundary

`docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md` (v3.0.0) requires, among other things:
- C2: no forbidden infrastructure authority;
- C3: obligations represented before the creating action is executable;
- C5b / C-EXEC: every committed action is within the canonical execution predicate;
- C6: coupled transitions atomic;
- C7: deterministic, domain-separated, versioned derivations;
- C11: canonical truth uses a verification predicate;
- C18: every committed implementation step refines exactly one canonical transition.

The specification explicitly states that evidence establishes implementation conformance but does not create normative authority.

**Implication for G1:** a passing test, evidence packet, hash, receipt, or adapter binding cannot independently authorize a declaration. G1 needs both an approved normative authority basis and a conforming verification path.

## 3. Existing governance architecture inspected

### 3.1 Governance Implementation Contract — Phase 2

File: `docs/00-normative/GOVERNANCE_IMPLEMENTATION_CONTRACT_PHASE2.md`  
Blob observed on target branch: `bf42cf1c465cf9b6be768efed99594159793c2b9`

The contract defines:
- proposal classes and governance lifecycle parameters;
- an abstract canonical event containing `event_id`, `proposal_id`, `ruleset_version`, `event_type`, `actor_class`, `timestamp`, `payload_commitment`, `predecessor`, `evidence_refs`, and `status`;
- event validity as `SchemaValid ∧ AuthorizedTransition ∧ RulesetValid ∧ EvidenceValid ∧ PredecessorValid`;
- immutable ordered replay of canonical governance events;
- an explicit separation between governance approval, evidence, conformance, adoption, and canonicalization.

This is a reusable **design pattern** for versioned decisions and replayable records. It does not, in the inspected contract, define the G1-specific runtime predicate that authenticates a fee-applicability declaration against a deployment/profile/class/state context.

The governance contract also says it is an implementation-facing contract, not a conformance certificate.

### 3.2 Governance specification in Notion

The inspected Notion page `IMMORTAL / PRE-RICH — Governance Specification v0.1 — Release Candidate` describes governance as an evolution mechanism, separates approval from conformance and canonicalization, and gives the canonical event predicate and replay model. The fetched page metadata reported its verification state as **unverified**.

This page supports the conceptual separation but cannot, by itself, be treated as proof that a deployed runtime authority mechanism exists or is conformant.

### 3.3 Current Haskell governance implementation

File: `IMMORTAL/governance/Governance.hs`  
Blob observed on target branch: `eda9fe63438667eeff044f8ad109fc6d11c8a067`

The inspected types include:
- `GovernanceEvent` constructors such as `ProposalSubmitted`, `ProposalClassified`, `StatusChanged`, `VoteCast`, `DelegationSet`, and `GatesSet`;
- a `GateResult` made of Boolean evidence, compatibility, conformance, and application-conformance gates;
- proposal status, vote, delegation, snapshot, and replay state.

These are governance-state and decision-process representations. In the inspected file, there is no G1 declaration type, no canonical fee-class registry, and no explicit runtime verifier that binds fee applicability to the exact protocol/profile revision, class, candidate action, and required state context. The gate Booleans alone do not establish the provenance or authority of a G1 declaration.

This is a scoped finding about the inspected file, not a claim that every repository path has been exhaustively searched.

## 4. Reuse classification

| Existing surface | Reusable for G1? | Boundary |
|---|---|---|
| Governance proposal/adoption lifecycle | Yes, as a possible route for approving a normative change | Does not automatically authenticate each runtime declaration |
| Canonical governance event schema and replay | Potentially, as an audit/versioning pattern | G1-specific payload, scope binding, and authority predicate are not established here |
| `actor_class`, `evidence_refs`, payload commitment | Potentially useful record fields | A reference or commitment is not authority proof by itself |
| Governance `GateResult` Boolean fields | No, not as standalone G1 authority | Booleans do not encode or prove the source/authority predicate |
| Runtime canonical input verification | Correct conceptual integration seam | A G1-specific authoritative input and verifier remain unidentified |
| Adapter/front-end/relayer evidence | Evidence transport only where conformant | Must not become the independent applicability authority |

## 5. What is already resolved vs still open

### Already resolved by canonical rules

1. Infrastructure role or publication alone cannot confer discretionary economic authority.
2. Authoritative inputs must be complete, verified, and fresh.
3. Missing/unverified authoritative truth rejects or safe-stalls.
4. Obligations/exposures must be derived before execution; accepted transitions must satisfy Safe and `K_c`.
5. Coupled state changes must commit atomically.
6. Evidence and conformance do not create normative authority.

### Still open for G1

1. Which canonical usage classes exist and how actions map to them.
2. Which already-approved authority mechanism can authorize the G1 declaration at runtime.
3. How the declaration is cryptographically or otherwise verifiably bound to its exact deployment/profile revision and relevant context, according to that mechanism.
4. How declaration revision, freshness, conflict, and revocation are resolved.
5. Whether a governance decision is needed to approve the G1 policy itself, and how that approved policy is materialized as runtime-verifiable input without confusing the two layers.
6. End-to-end evidence that the existing canonical transition consumes and enforces G1 before deriving the candidate post-state.

This audit does not prescribe a signature scheme, key, quorum, committee, governance shortcut, or new trust root.

## 6. Recommended next step

**Do not implement a new authority mechanism yet.** First identify an already-approved canonical authority predicate and its concrete runtime evidence path. If the repository cannot establish one for G1, record that as an explicit unresolved normative dependency and seek a decision through the applicable canonical change process.

The minimal evidence needed to close this audit would be a source-backed chain:

`approved authority mechanism → verifiable G1 declaration → exact profile/class/context binding → canonical authoritative-input verification → obligation derivation → Safe → K_c → atomic transition`

The chain must be demonstrated in the real canonical path; a synthetic resolver or governance approval record alone is insufficient.

## 7. Conclusion

**No existing G1 runtime authority mechanism was established by the inspected canonical specifications, governance contract, Notion governance release candidate, and Haskell governance types.** The governance machinery is potentially reusable for approving/versioning a normative policy, but it is not proven to be the runtime authority predicate for fee applicability.

G1 remains **OPEN**. This is a targeted audit, not proof of repository-wide absence. No fee-bearing class is selected and no production implementation is authorized by this document.


## 8. Clarification — current project decision authority

**Project-owner clarification, recorded 20 October 2026:** the project currently has no active community governance and no published paper. For present project decisions, the founder/project owner is the sole human decision-maker. Designing or completing the future community governance system is a separate workstream and is not a prerequisite for this G1 work.

This clarification resolves the *current human decision-authority question*: G1 policy choices can be explicitly approved by the project owner now, with the decision recorded in the canonical source hierarchy. It does **not** mean that a human approval statement automatically becomes a machine-verifiable runtime input. The runtime representation and verification path still have to bind the recorded decision to the exact policy/profile revision and canonical transition.

Accordingly, distinguish:
1. **Normative approval now:** the project owner explicitly decides the G1 policy and records the scope, revision, rationale, and effective point.
2. **Runtime enforcement:** the implementation consumes the approved, version-bound policy as an authoritative input and rejects/safe-stalls when required authoritative truth is absent, invalid, or stale.
3. **Future governance:** a separate workstream; not a blocker for present owner-approved decisions and not silently imported into G1.

No community vote, quorum, committee, signer set, or future governance procedure is required by this clarification. No cryptographic/runtime mechanism is invented here. The exact binding and verification method remains an implementation/conformance seam to close against the existing canonical rules.

## 9. Existing versioning and runtime-binding surfaces — targeted follow-up

This follow-up inspects the existing profile, economic-gate, Cardano admission/evidence, Issue-admission, and governance surfaces on `work/b3-materios-provenance-evidence`. It is documentation-only and does not change production behavior.

### 9.1 Reusable surfaces found

| Existing surface | What it already provides | Why it does not close G1 by itself |
|---|---|---|
| `IMMORTAL/state/EconomicProfile.hs` — `EconomicProfile.epVersion` | A positive integer profile version; the profile currently carries class prices and the maximum normal payout multiplier. | There is no fee-applicability registry or explicit fee-bearing/exempt declaration in this profile type. `epVersion` is not itself a commitment to a G1 policy payload. |
| `IMMORTAL/kernel/EconomicGate.hs` — `EconomicGateInput` | Explicit checks for authoritative truth, EEV freshness, obligation completeness, liquidity bounds, solvency and viability composition. | Its own comments state that the Boolean inputs are an interface, not an authority declaration; callers must bind them to actual verification/refinement mechanisms. |
| `Adapter/CARDANO/runtime/EconomicAdmission.ts` — `EconomicAdmissionWitness` | Existing `gateVersion`, `decisionReference`, `authoritativeObservationReference`, action class/fingerprint and pre/post-state hashes; the validator fails closed on absent/malformed references and mismatched liquidity evidence. | It has no G1 declaration reference, approved policy/profile revision binding, or fee-applicability result. Non-empty references do not prove that the referenced policy is authorized. |
| `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts` | Evidence records include `protocolVersion`, `profileVersion`, `adapterVersion`, action and state fingerprints, and transaction reference. | `profileVersion` is checked only for non-emptiness here. The existing transition-binding assertion checks action/pre-state/post-state/transaction, not equality to an independently expected approved G1 policy/profile revision. The file explicitly describes itself as evidence-only, not economic authority. |
| `src/preRichIssueAdmissionBridge.ts` and `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` | An existing fail-closed authoritative Issue path binds the Haskell decision to observed action, EEV, liquidity, decision/observation references, ProtectedCapital provenance, carrier state, qualification evidence and deployment approval. | This is an Issue-admission path, not a general G1 usage-fee declaration verifier. The inspected witness types do not carry a G1 applicability declaration or a canonical G1 policy identity. Do not infer that this path closes G1 merely because it already verifies other authoritative inputs. |
| `docs/00-normative/GOVERNANCE_IMPLEMENTATION_CONTRACT_PHASE2.md` | A versioned, immutable/replayable canonical event design, including `ruleset_version`, `payload_commitment`, predecessor and evidence references; it distinguishes approval from evidence/conformance/canonicalization. | This is a governance event contract, not proof that a G1 declaration is consumable by the live economic transition. |
| `IMMORTAL/governance/Governance.hs` and `docs/COORDINATION/GOV-28_CANONICAL_REPLAY_MISMATCH.md` | Existing governance lifecycle/state machinery and a documented canonical replay mismatch. | The mismatch note states that the current replay implementation cannot consume the already-defined `DECISION_FINALIZED`, `ADOPTION_RECORDED`, `CONFORMANCE_RECORDED`, or `CANONICALIZED` events as canonical events. Therefore the governance path must not be assumed to provide a complete runtime G1 binding without resolving that separate, already-documented gap. |

### 9.2 Minimal reuse conclusion

The simplest *candidate direction* is to reuse the existing versioned profile identity and canonical decision/evidence references, then require the authoritative transition path to compare the G1 policy identity/revision and applicability declaration against the exact approved record for the candidate action and deployment context. This is a direction for further source-backed design, not an approved implementation specification.

The current surfaces do not yet establish all of the following as one verified chain:

`project-owner decision → canonical versioned G1 policy record → runtime verification of that exact record and context → G1 result consumed before obligation derivation → existing Safe / K_c / atomic transition`.

In particular, `profileVersion`, `gateVersion`, `decisionReference`, and `authoritativeObservationReference` are useful identifiers, but their presence alone does not authenticate the G1 policy or prove that the canonical transition consumed it. A governance event or evidence packet likewise cannot substitute for the runtime predicate.

### 9.3 Next closure step and boundaries

Before changing production code, identify the exact existing canonical decision-record and verification API that can supply the approved policy revision to the transition. Reconcile it with the documented GOV-28 replay mismatch rather than building a parallel registry or authority system. If no existing API can prove the binding, record the smallest missing predicate/interface and request the project owner's explicit normative decision before implementing it.

Do not add a new signer set, quorum, committee, signature scheme, registry, policy formula, fee-bearing class, or adapter-side authority. Do not alter V3, Reveal semantics, tests, CI, or deployment as part of this audit.

**Updated conclusion:** existing versioning and evidence surfaces are reusable building blocks, but no verified G1 runtime binding has been demonstrated. G1 remains **OPEN**; no fee-bearing class is selected and no production implementation is authorized by this audit.

