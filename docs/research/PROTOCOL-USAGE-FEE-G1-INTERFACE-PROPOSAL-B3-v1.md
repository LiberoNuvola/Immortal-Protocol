# IMMORTAL — G1 Fee Applicability Interface Proposal B3 v1

**Classification:** design-only / non-normative / not implementation-authorizing  
**Target branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-20  
**Status:** PROPOSAL RECORDED — G1 OPEN; no fee-bearing classes selected  
**Change scope:** documentation only. No production types, call sites, tests, CI, deployment, or on-chain behavior changed.

## 1. Purpose and boundary

This proposal records the smallest logical interface that could carry a deployment/profile-specific G1 fee-applicability declaration after the project authority resolves the open decisions. It does not create that authority, select the classes, or make a declaration active.

The declaration answers only:

> For this identified deployment/profile version and canonical usage class, has Protocol Usage Fee applicability been explicitly declared true or false by an authorized source?

It does **not** answer:
- what fee amount is owed;
- what reference unit or price source is admissible;
- how a target amount is converted to a settlement amount;
- which asset or address receives settlement;
- whether a fee was actually received;
- how received value is classified in accounting;
- whether any value is available for rewards or distribution.

Keep the existing separation:

`ProtocolUsageFee != ChainExecutionCost`

`TotalCost = ProtocolUsageFee + ChainExecutionCost`

IMMORTAL owns universal fee semantics; a deployment/profile declares applicability within those semantics; the Adapter performs chain-specific settlement and supplies settlement evidence. The Adapter must not independently choose applicability or add a second protocol fee.

## 2. Cross-branch triangulation

The following existing work informs the interface shape but is not imported as fee authority.

| Source | Useful result | Reuse boundary |
|---|---|---|
| `work/immortal-green-closure:src/protocolDeclaration.ts` | Observation declarations carry protocol identity, observation time, evidence references, canonical-state reference, source and scope. | Shape/provenance analogy only. Its own comments say observation/presentation, not economic authority. |
| `work/immortal-green-closure:src/publicActionAvailability.ts` | Availability is produced by an authoritative observation layer; UI state should not infer protocol admissibility. | Action availability is not fee applicability. `available=true` must not imply fee-bearing; unavailable must not imply exempt. |
| `work/immortal-green-closure:docs/COORDINATION/FRONT-IMMORTAL-TREASURY-FEE.md` | Universal fee meaning is separate from Cardano settlement, treasury destination and accounting classification. No universal Treasury field/custody mechanism was authorized. | Do not reuse PRE-RICH treasury percentages, thresholds, addresses or Jackpot semantics. |
| `work/immortal-green-closure:docs/COORDINATION/NOTION-MAP-IMPLEMENTATION-CROSSWALK-v0.1.md` | Fee, Treasury/accounting and optional reward budget are distinct stages; mapping docs do not override canonical specs. | Navigation/crosswalk evidence only, not a normative declaration. |
| `main:docs/COORDINATION/FRONT-FEE-GOVERNANCE-BUILD-INCENTIVES.md` and `FEE-INCENTIVE-ADVERSARIAL-LAB-v0.1.md` | Fee derivation and reward functions remain separate; no numeric policy or reward allocation is selected. | No fee formula, reward rule, governance threshold or authority can be inferred. |
| Current branch: `PROTOCOL-USAGE-FEE-G1-APPLICABILITY-DECISION-B3-v1.md` | Candidate classes remain unselected; explicit mappings, profile binding and fail-closed readiness are required. | Governing branch-local research record; G1 remains OPEN. |
| Current branch: `PROTOCOL-USAGE-FEE-G1-DECLARATION-SEAM-AUDIT-B3-v1.md` | No inspected existing surface is a canonical fee-applicability producer. | Targeted audit only, not proof of repository-wide absence. |

**Cross-branch conclusion:** reuse the general lessons of provenance, canonical state binding and separation of public presentation from authority. Do not reuse any existing declaration or application policy as a G1 authorization contract without a separately approved semantic and authority contract.

## 3. Minimum logical declaration envelope

The following is a field-level proposal, not a TypeScript/Haskell type and not a claim that these fields already exist.

| Logical field | Purpose | Current decision status |
|---|---|---|
| Deployment/profile identity | Identifies the exact context to which applicability belongs. | Required concept; canonical representation OPEN. |
| Deployment/profile version or immutable revision reference | Prevents silently applying a declaration to a different profile revision. | Required concept; binding method OPEN. |
| Canonical usage-class identifier | Deterministic identity for the class being declared; prose-only labels are insufficient for enforcement. | Required concept; class registry and IDs OPEN. |
| Explicit applicability value | Records `true` or `false` for a declared class. | Required concept; no class values selected. |
| Declaration revision/version | Identifies the declaration revision being evaluated. | Required concept; versioning scheme OPEN. |
| Effective profile/state binding | Shows which canonical profile/state context the declaration applies to and allows stale or mismatched declarations to be rejected. | Required concept; exact state reference and freshness rules OPEN. |
| Declaring authority/source reference | Identifies the source that claims authority to make the declaration. | Required concept; authorized source not selected here. |
| Authority/evidence reference | Allows verification of the declaration's provenance under a separately specified admissibility rule. | Required concept; proof/signature format and verification policy OPEN. |

No field above independently establishes authorization merely by being present. In particular, a non-empty source, evidence reference, revision, or digest is not itself proof that the source was authorized. The mechanism that verifies authority must be specified separately before implementation.

Do not mandate a particular signature scheme, governance process, credential format, hash format, storage location, or issuer. None is selected by this proposal.

## 4. Resolution semantics

For a given profile version and canonical usage class, a future evaluator must be able to distinguish:

- **DECLARED_TRUE** — an admissible, authorized declaration explicitly maps the class to `true`.
- **DECLARED_FALSE** — an admissible, authorized declaration explicitly maps the class to `false`.
- **UNCONFIGURED** — declaration missing, class missing, value unknown, profile/version mismatch, stale binding, duplicate/conflicting entries, or provenance/authority not verifiable under the eventually approved rules.
- **INVALID** — a declaration is malformed or contradictory under the eventually approved schema.

These are proposed interface states, not existing runtime states or a chosen policy for any action class.

Fail-closed rule for conformance: `UNCONFIGURED` or `INVALID` must not be treated as `DECLARED_TRUE`, and must not be silently normalized into an authorized exemption. A deployment cannot claim G1 conformance until its applicable declaration is authorized and correctly bound. The runtime response for an attempted action while unconfigured—such as rejection or an explicit non-conformance outcome—must be settled in the implementation contract; this document does not wire a call site.

## 5. Cardinality and consistency checks to specify

Before implementation, the canonical contract should state how to reject or resolve:
- duplicate entries for the same profile revision and canonical class;
- conflicting `true` and `false` values;
- unknown class identifiers;
- declarations bound to another deployment/profile revision;
- stale or mismatched effective-state references;
- missing or unverifiable authority/provenance;
- a class mapping that changes without a declaration revision change.

The intended property is deterministic evaluation of one applicable declaration, not an invented conflict-resolution policy. This proposal does not choose precedence, amendment authority, revocation semantics, or activation timing.

## 6. Required separations

The future data/control flow must not collapse these independent questions:

1. **Action availability:** may the UI present an action as available now?
2. **G1 applicability:** is the usage class explicitly declared fee-bearing for this deployment/profile?
3. **Economic target:** if fee-bearing, what obligation follows from the approved economic semantics?
4. **Settlement:** what chain-specific transaction/output settles that obligation?
5. **Receipt evidence:** was the intended amount actually credited?
6. **Accounting classification:** how is received revenue classified by canonical economics?
7. **Reward budget/allocation:** is any value separately authorized and available for that purpose?

The candidate conceptual chain remains:

`G1 declaration → (if explicitly fee-bearing) economic fee obligation → settlement amount → adapter settlement → receipt evidence → accounting classification`

This is a separation map, not a production pipeline. No automatic inference is permitted from one stage to the next.

In particular, fee receipt does not automatically make value `ProtectedCapital`, `RawSurplus`, distributable value, or a reward budget. A treasury destination or PRE-RICH payment path does not establish G1 applicability.

## 7. Conformance cases to require later

No tests are added by this document. When an authorized contract exists, its conformance suite should cover at least:

- authorized explicit `true` for a selected class;
- authorized explicit `false` for a selected class;
- missing declaration and missing class mapping;
- unknown class identifier;
- profile/version mismatch and stale state binding;
- malformed or unverifiable provenance;
- conflicting duplicate mappings;
- declaration revision changes;
- separation from UI action availability;
- separation from native `ChainExecutionCost`;
- at most one Protocol Usage Fee obligation per applicable transition, consistent with the source workflow;
- no mutation of V3 or Reveal semantics.

Positive tests must not be written against hypothetical fee-bearing classes before those classes are selected by the project authority.

## 8. Decisions still required from the project authority

This proposal intentionally leaves unresolved:

1. Which deployment/profile is the first target for G1.
2. Which canonical usage classes are in scope and the explicit `true/false` mapping for each.
3. Which source is authorized to issue or amend the declaration.
4. What evidence/proof format establishes that authority and how it is verified.
5. How profile version, canonical state, declaration revision and effective time are bound.
6. What revocation, replacement and activation rules apply.
7. What exact runtime outcome is required when G1 is unconfigured or invalid.
8. Which canonical transition contract supplies the usage-class identifier.

These are real decision gaps, not fields to fill with assumptions. The candidate transition matrix does not select the classes by itself.

## 9. Decision/status

**G1 remains OPEN.** This document proposes an interface boundary only. It does not authorize a fee, instantiate any class mapping, choose an authority mechanism, add production code, close any economic gate, or establish a deployment-ready fee path.

**Non-regression:** no V3 changes; no Reveal semantic changes; no new branch; no invented fee formula, numeric parameter, treasury policy, reward rule or authority mechanism.

**Verification limits:** the proposal is based on targeted reads of the named branch artifacts and existing fee research documents. It is not a whole-repository proof of absence. No tests, CI, deployment or on-chain behavior were run or changed.
