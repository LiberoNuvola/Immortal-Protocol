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
