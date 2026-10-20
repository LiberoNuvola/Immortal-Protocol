# IMMORTAL — Protocol Usage Fee G1 Authority and Resolution Contract
## B3 research artifact v1

**Status:** PROPOSAL — DESIGN ONLY — G1 OPEN  
**Target branch:** `work/b3-materios-provenance-evidence`  
**Normative effect:** None. This document does not approve fee-bearing classes, establish an authority mechanism, or authorize production execution.  
**Scope:** Specify the minimum contract needed to resolve a deployment/profile's G1 fee-applicability declaration and feed its result into the existing canonical transition.

---

## 1. Purpose

G1 answers one narrowly scoped question:

> For this canonical usage/action class, under this exact deployment/profile revision and applicable state context, is the action class declared fee-bearing or fee-exempt?

G1 is not the fee amount, settlement asset, price/reference, affordability calculation, settlement receipt, accounting classification, or reward-allocation policy. Those remain separate gates in the fee workflow.

This contract is a design proposal derived from the existing IMMORTAL Constitution, State Transition Specification, Conformance Specification, and the existing fee workflow/interface/audit artifacts. It is not a new normative source and must not override their source hierarchy.

## 2. Architecture already established

The following boundaries are treated as already decided in the referenced architecture:

1. There is one **Protocol Usage Fee** category. It is distinct from chain execution cost:
   `TotalCost = ProtocolUsageFee + ChainExecutionCost`.
2. IMMORTAL owns universal fee semantics, economic admissibility, and safety constraints. A deployment/profile supplies the applicability choices within those constraints.
3. The Adapter performs chain-specific settlement and provides settlement/execution evidence. It must not independently decide fee applicability or introduce a second Protocol Usage Fee.
4. G1 is an input to the existing canonical transition, not an independent admission route or UI/Adapter-only gate.
5. Any fee obligation must be derived before the complete candidate post-state is evaluated. Existing Safe, `K_c`, liability, viability, and atomicity requirements remain in force.
6. A fee declaration or receipt does not by itself classify value as ProtectedCapital, RawSurplus, distributable value, or reward budget.
7. PRE-RICH is an application/conformance case, not the source of universal IMMORTAL fee semantics.
8. No fee-bearing class, fee amount, denomination, reference source, rounding rule, or affordability policy is selected by this document.

## 3. Contract boundary and conceptual records

The names and fields below are logical design terms, not a claim that matching production types already exist.

### 3.1 G1 declaration

A declaration should identify, at minimum:

- **protocol identity** — the protocol/semantic domain to which the declaration belongs;
- **deployment/profile identity** — the deployment and profile to which the declaration applies;
- **profile/declaration revision** — an explicit revision identifier, bound to the exact profile version;
- **canonical usage-class ID** — a stable class identifier from a canonical registry;
- **applicability value** — explicitly `true` (fee-bearing) or `false` (fee-exempt);
- **action mapping** — the canonical rule that maps the candidate action/transition to the usage class;
- **state/context binding** — the applicable canonical state or required state fingerprint/context, where the governing specification requires it;
- **declaration source reference** — a resolvable reference to the declaration's source;
- **authority reference** — a reference to the mechanism by which the declaration's authority is to be verified;
- **evidence reference** — a reference to the evidence used by that verification;
- **version/domain binding** — enough explicit versioning and domain separation to prevent reuse under a different protocol, profile, class, or semantic version.

A digest, URI, source reference, timestamp, or evidence object is not itself proof of authority. A declaration becomes authoritative only if the canonical authority-verification predicate accepts it.

### 3.2 Canonical usage-class registry

A registry is required to prevent ambiguous or implementation-local class naming. Its contract must define:

- stable canonical class IDs;
- the canonical action/transition mapping for each class;
- registry version and compatibility rules;
- how an unknown, duplicated, or conflicting class mapping is represented.

This document does **not** choose the registry format, add class IDs, or declare any class fee-bearing. The candidate classes in prior inventories remain candidates only.

### 3.3 Authority-verification result

The authority-verification mechanism must return a verifiable result that binds the declaration to the exact protocol, deployment/profile revision, class, applicability value, and relevant state/context.

The verifier must rely on an explicitly approved canonical authority mechanism. This proposal does not invent a signer, key model, quorum, committee, governance process, signature format, or off-chain trust root. Those details must be sourced from an already-approved mechanism or remain an explicit normative decision.

Project-owner approval of a specification and runtime authority verification are different things. Approval can authorize a design decision; it does not, by itself, establish a production-verifiable declaration unless the canonical authority mechanism says so.

### 3.4 Resolution result

The G1 resolver should produce a typed result rather than a default boolean:

- `DECLARED_TRUE` — an applicable, valid, authoritative declaration explicitly says fee-bearing;
- `DECLARED_FALSE` — an applicable, valid, authoritative declaration explicitly says fee-exempt;
- `UNCONFIGURED` — no applicable declaration is available;
- `INVALID` — a declaration exists but fails a required structural, mapping, binding, or authority check;
- `STALE` — a declaration does not match the required current profile/declaration revision or state/context;
- `CONFLICTING` — more than one incompatible declaration or mapping is applicable;
- `REVOKED` — the canonical authority mechanism establishes that the declaration has been revoked.

These are proposed interface states, not an assertion that all are implemented today. Exact treatment of stale, conflicting, and revoked declarations must be reconciled with the approved authority mechanism and canonical transition rules before production use.

No missing, malformed, stale, conflicting, or unverifiable declaration may be silently coerced to `true` or `false`. In particular, `UNCONFIGURED` does not mean fee-bearing and does not mean fee-exempt.

## 4. Resolution procedure

The proposed resolver performs the following checks in order:

1. **Identify the candidate action** using the canonical action/transition representation, not a UI label or Adapter-specific guess.
2. **Resolve the canonical usage class** through the versioned registry and its approved action mapping.
3. **Resolve the exact deployment/profile revision** applicable to the candidate transition.
4. **Find the declaration** for that protocol, deployment/profile revision, usage class, and required state/context.
5. **Validate structure and bindings**, including identity, versions, action mapping, domain separation, and required state/context.
6. **Verify authority** through the approved canonical authority-verification predicate. Evidence presence alone is insufficient.
7. **Check freshness, conflict, and revocation** according to the approved registry and authority mechanism.
8. **Return one typed resolution state** with references to the declaration and verification evidence. Preserve enough deterministic information for independent reproduction.

The resolver must not query an unapproved source to fill gaps, infer applicability from historical behavior, use UI availability as authority, or let the Adapter choose a fallback.

## 5. Integration with the canonical transition

G1 must be integrated as authoritative input to the existing transition path. It must not create a second admission pipeline.

The intended conceptual ordering is:

`canonical state → authoritative input verification (including G1) → obligation/exposure derivation → candidate delta → complete post-state → Safe → K_c → accept/reject → atomic commit → history`

For a `DECLARED_TRUE` result, the fee obligation must be derived in the existing obligation/exposure phase, before the candidate post-state and its safety/admissibility checks. G1 itself does not determine the fee amount; later fee stages must provide a separately valid settlement amount and satisfy their own requirements.

For `DECLARED_FALSE`, no Protocol Usage Fee obligation is derived **for that class under that exact valid declaration**. This does not waive chain execution costs or any other independently established obligation.

For `UNCONFIGURED`, `INVALID`, `STALE`, `CONFLICTING`, or `REVOKED`, this proposal does not authorize the transition to proceed as fee-bearing or fee-exempt. The precise execution outcome must follow the Constitution's and State Transition Specification's treatment of missing/unverified authoritative truth; any more specific G1 rule must be explicitly approved and conformant with those canonical requirements. A fail-closed outcome is the recommended design pending that decision, not a newly approved policy in this document.

No G1 result may bypass Safe, `K_c`, liability-first accounting, protected capital, viability, or atomicity. The accepted transition and the state effects of any fee obligation must remain part of the same canonical atomic transition.

## 6. Separate evidence domains

The implementation must not conflate:

### Declaration-authority evidence
Evidence that the applicable declaration is authentic under the approved authority mechanism, current, unambiguous, and bound to the right profile/class/state context.

### Fee-settlement evidence
Evidence that a settlement was attempted or completed, including the relevant chain transaction/receipt and chain execution facts.

A successful settlement receipt does not prove that the action was correctly declared fee-bearing. A valid declaration does not prove that a fee was settled. Accounting classification and any reward-budget certification remain later, separate stages.

## 7. Determinism, reproducibility, and audit output

A G1 resolution record should make independently reproducible at least:

- protocol and deployment/profile identity;
- exact profile and declaration revisions;
- canonical class ID and registry version;
- candidate action/transition identity and required state/context binding;
- resolved status and explicit applicability value, when one exists;
- declaration, authority-verification, and evidence references;
- validation outcomes and the reason for any non-resolved status;
- resolver/contract version and domain-separated derivation identity.

Do not treat a timestamp, digest, log line, CI success, or evidence receipt alone as authority. The output must be independently verifiable under the approved predicates and the canonical versioning rules.

## 8. Conformance candidates

The following are proposed test obligations. They do not claim that tests have been implemented or passed.

| Case | Candidate check | Expected property |
|---|---|---|
| Explicit true | Valid declaration for exact class/profile/context | Resolves `DECLARED_TRUE`; fee obligation enters existing obligation derivation |
| Explicit false | Valid explicit exemption for exact class/profile/context | Resolves `DECLARED_FALSE`; no Protocol Usage Fee obligation for that class |
| Missing declaration | No declaration for the applicable class/profile | Resolves `UNCONFIGURED`; no inferred boolean |
| Unknown class | Class absent from canonical registry | No inferred mapping; non-resolved result |
| Invalid authority | Authority predicate does not verify | No authoritative applicability result |
| Wrong profile revision | Declaration is bound to another profile/deployment revision | Non-resolved result |
| Wrong state/context | Required binding does not match candidate transition | Non-resolved result |
| Duplicate/conflicting declarations | Incompatible applicable values are present | Explicit conflict; no arbitrary winner |
| Stale declaration | Revision/freshness check fails | Explicit stale result; execution consequence follows approved rule |
| Revoked declaration | Approved mechanism reports revocation | Explicit revoked result |
| Adapter disagreement | Adapter proposes a different applicability value | Canonical G1 result governs; Adapter cannot override it |
| UI-only declaration | Frontend availability claims a class is exempt/fee-bearing without authoritative input | Not accepted as authority |
| Liability/safety regression | Fee is added to the candidate transition | Existing liability, Safe, `K_c`, viability and atomicity checks still apply |
| Evidence separation | Receipt exists but declaration authority is absent, or vice versa | One evidence domain cannot substitute for the other |
| Deterministic replay | Same canonical inputs and versions are replayed | Same resolution and derivation result |

The final test suite and exact conformance mapping must be approved against the canonical C2/C3/C5b/C6/C7/C11 requirements and any additional applicable clauses. This table is a proposal, not a substitute for those specifications.

## 9. Decisions still required

Before G1 can be declared closed, the following require explicit resolution through the canonical decision process:

1. Approve or revise the canonical usage-class registry and action mappings. No fee-bearing classes are selected here.
2. Identify the already-approved authority predicate/mechanism that can authorize and verify declarations. If none exists, the mechanism is an open normative decision; do not invent one in implementation.
3. Define revision, freshness, conflict, and revocation semantics consistent with the canonical authority source.
4. Confirm the execution outcome for each non-resolved state, consistent with the constitutional rule that missing/unverified authoritative truth cannot be treated as verified input.
5. Approve the exact profile/deployment/state binding requirements.
6. Specify the canonical transition integration and the obligation fields needed for post-state derivation without creating a second state machine.
7. Approve the conformance matrix and require end-to-end evidence that the canonical path—not merely a synthetic resolver—enforces G1.
8. Keep downstream fee amount, price reference, conversion, affordability, settlement, accounting, and reward decisions in their separate gates. G1 closure does not close G2–G8.

## 10. Exit criteria

G1 may be considered ready for implementation only when:

- class identity and action mapping are canonical and versioned;
- explicit true/false declarations are bound to the exact deployment/profile revision and applicable context;
- the declaration authority mechanism is already approved and independently verifiable;
- unresolved, stale, conflicting, and revoked cases have approved outcomes;
- the result is consumed by the existing canonical transition before post-state safety/admissibility checks;
- declaration-authority evidence and settlement evidence remain separate;
- conformance tests exercise the real transition path and demonstrate the required properties;
- no Adapter, frontend, relayer, or application-only route can override or bypass the canonical result.

G1 remains **OPEN** until these criteria are satisfied and the relevant decisions are recorded in the canonical source hierarchy.

## 11. Scope and change discipline

This artifact is documentation-only. It does not change source code, tests, CI, deployment, fee parameters, application rules, or the canonical Constitution/State Transition/Conformance Specifications. It does not touch the V3 carrier or Reveal semantics.

**Conclusion:** The missing piece is not another fee formula or an Adapter-side boolean. It is an approved, verifiable declaration-authority contract connected to the existing canonical transition. This proposal defines the seam and the questions to resolve without pretending that the authority mechanism or fee-bearing classes have already been approved.


## 12. Current project decision authority — clarification

**Project-owner clarification, recorded 20 October 2026:** because there is currently no active community governance and no published paper, the founder/project owner is the sole human decision-maker for present project decisions. Future community governance is a separate workstream and is not a prerequisite for deciding G1 now.

For this workstream, the project owner may explicitly approve or reject normative G1 choices, including the class mapping and applicability values. The approved decision must be recorded with its scope and revision in the canonical source hierarchy. This does not give an Adapter, frontend, relayer, or implementation discretionary power to invent or alter the decision.

The owner decision and its runtime enforcement remain distinct:
- **Owner decision:** the human-authorized normative choice.
- **Canonical record:** the versioned record of what was decided, for which profile/classes, and from when.
- **Runtime predicate:** the concrete implementation check that verifies it is consuming the exact approved record and rejects/safe-stalls if the required authoritative input is missing, invalid, conflicting, or stale, in accordance with the canonical transition specification.

This contract does not require a community vote, quorum, committee, or future governance process for the current decision. It also does not invent a signature scheme or claim that runtime binding is already implemented. The next technical task is to reuse the simplest existing canonical versioning and verification surfaces that satisfy the Constitution and transition rules; only if those surfaces cannot provide the required binding should a new mechanism be proposed for explicit approval.

The future governance design is deliberately out of scope. G1 can progress under the current project-owner authority without pretending that future community governance is already operational.
