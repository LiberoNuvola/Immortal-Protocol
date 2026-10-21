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

### 9.4 Governance ruleset registry and current replay source check

A second source check found a more precise reusable building block than a generic governance-event schema:

- `IMMORTAL/governance/RulesetRegistry.hs` defines an append-only `RulesetRegistry`, immutable version entries, a commitment string, an effective-from timestamp and a supersession link. `registerRuleset` rejects a conflicting definition for an existing version and requires monotonic extension; `rulesetCompatible` checks that a registered version's commitment matches.
- `IMMORTAL/governance/GovernanceCommitment.hs` computes a SHA-256 digest over the canonical commitment preimage for a canonical governance event, and `GovernanceAuthorization.rulesetAuthorizationValid` combines registered ruleset/version compatibility with the event commitment and effective ruleset.
- `IMMORTAL/governance/GovernanceDecisionWitness.hs`, `GovernanceCanonicalizationWitness.hs` and `GovernanceCanonicalReplay.hs` provide typed decision/canonicalization records and explicit handlers for finalization, adoption, conformance and canonicalization on this branch. The canonical replay checks that the canonicalization decision-record reference matches the finalized `DecisionRecord` reference.

These are concrete versioning, commitment and replay components, not merely conceptual patterns. They are the strongest existing candidates to inspect before proposing anything new. However, their current declared domain is governance rulesets and governance proposal lifecycle. The inspected types do not expose a G1 usage-class declaration, profile/deployment binding, applicability value, or a predicate that passes that declaration into the economic transition. A governance `rulesetCommitment` cannot be presumed to commit to a G1 fee policy unless its payload and consumer explicitly establish that relationship.

#### Branch-source correction regarding GOV-28

The older `docs/COORDINATION/GOV-28_CANONICAL_REPLAY_MISMATCH.md` describes the four GOV-18 acts as unsupported by replay. That statement does not match the current source fetched from this target branch: `GovernanceEventSchema.hs` includes the four distinct payload/event types, and `GovernanceCanonicalReplay.hs` has dedicated handlers for them. Treat the coordination note as historical/stale relative to these source files unless a current test or commit proves otherwise. This correction is limited to the target branch's inspected files; it is not a claim that all governance conformance issues are closed. The implementation still has separate state/projection semantics, so no broader governance GREEN claim is made here.

#### Reuse assessment

| Candidate | Reuse decision for G1 |
|---|---|
| `RulesetRegistry` immutable version + commitment pattern | **Candidate to reuse** for policy identity/versioning only if the approved G1 policy can be represented and consumed without changing governance semantics or conflating governance ruleset version with economic profile version. |
| Canonical event commitment and replay | **Candidate to reuse** for recording/replaying a project-owner decision if an existing, conformant event type and actor-authority path can represent the owner decision. Current inspected actor authorization has no explicit project-owner actor class; do not silently map the owner to `System`, `Proposer`, or another role. |
| `DecisionRecord` / `CanonicalizationRecord` | **Not a direct G1 declaration**. These are governance lifecycle witnesses, not fee applicability records. |
| `EconomicProfile.epVersion` | **Candidate binding coordinate**, but it is a profile version, not a policy digest or authority proof. |
| `EconomicAdmissionWitness` and `CanonicalTransitionEvidence` | **Candidate downstream binding seam**, but currently lack G1 policy identity/applicability fields and validation against an independently resolved approved policy. |

The current project-owner clarification means G1 must not be blocked on community voting. Consequently, reuse of the existing governance lifecycle is appropriate only if it can record the owner's present decision under an already-authorized path without falsely requiring community voting or inventing an actor role. If it cannot, do not bend the existing lifecycle to fit; identify the minimal canonical decision-record path consistent with the Constitution and obtain explicit owner approval for any normative gap.

The smallest next source-backed question is now: **Can the existing ruleset commitment/version machinery represent a project-owner-approved G1 policy as a canonical, profile-bound input, and can the existing economic admission path verify and consume that exact commitment before obligation derivation?** Until both halves are demonstrated, G1 remains OPEN.


### 9.5 Exact economic admission seam — profile, gate and Issue witness

A focused read of the target-branch runtime boundary narrows the missing link further. The files below were fetched directly from `work/b3-materios-provenance-evidence` during this audit:

- `IMMORTAL/state/EconomicProfile.hs` (blob `e4eccd67bec97543b802aa15ff1b2719c9c18bde`) defines `EconomicProfile` with `epVersion`, `epClassPrices`, and `epMaxNormalPayoutMultiplier`. `profileValid` validates those fields, but this type has no G1 declaration, fee-bearing transition map, policy commitment, or authority provenance. Thus `epVersion` alone cannot bind a G1 policy.
- `IMMORTAL/kernel/EconomicGate.hs` (blob `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127`) explicitly describes `EconomicGateInput` as an interface, not an authority declaration. Its inputs cover truth verification, EEV freshness, obligation completeness, EEV, available executable liquidity, and required immediate liquidity. `economicGate` checks those predicates and solvency; it has no G1 policy identity or fee-applicability result. The module also says concrete `K_c` certification is external and atomic commit/history remain downstream obligations.
- `Adapter/CARDANO/runtime/EconomicAdmission.ts` (blob `5949c1f5b60091f2b5f9b0a59d4274887b7151d2`) defines `EconomicAdmissionWitness` with `gateVersion`, `decisionReference`, `authoritativeObservationReference`, action class/fingerprint, pre/post-state hashes, EEV, and authenticated liquidity references/values. Its validator requires these identifiers and binds liquidity to inputs, but there is no G1 policy reference, approved-policy commitment, or fee-applicability verifier.
- `src/preRichIssueAdmissionBridge.ts` (blob `5538aa3473e4e831f71df9c62feb3247d4743be3`) enforces the qualified EEV profile `PRE-RICH-EEV-USDM-DIRECT-V1`, deployment approval, EV1–EV7 evidence, Issue coordinates, truth/freshness/obligation/Ω flags, ProtectedCapital provenance, viability evidence, and input/action/state bindings. This is strong EEV and Issue-admission qualification; it does not resolve a G1 fee policy.
- `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` (blob `dee0d5bcf29e5b75b33b70438b43ff54ad1419bf`) checks the Haskell decision against the authoritative observation and emits `gateVersion: 'pre-rich-economic-gate-v1'`. The inspected witness construction carries no G1 policy commitment and the provider has no visible G1 resolver/verifier.
- `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts` (blob `4c5f81a76edb14dbcf59412c6b0500c749264883`) expressly calls itself evidence-only. It validates that `profileVersion` and other identifiers are non-empty, then binds action and pre/post-state fingerprints plus transaction reference. It does not establish that `profileVersion` equals a policy-approved profile revision or authenticate any fee applicability declaration.

#### Ordering implication

The documented canonical transition order puts authoritative input verification before obligation/exposure derivation. Therefore a G1 policy that changes whether an action incurs a protocol usage fee must be resolved and verified at that authoritative-input boundary, before the relevant obligation set is derived—not added later as an adapter settlement choice. The inspected economic gate and Issue bridge already enforce other authoritative inputs, but the source above does not show a G1 policy result being supplied to or consumed by that derivation.

This conclusion is deliberately narrow: these files establish the missing fields/predicate at the inspected surfaces, not a proof that no other file anywhere in the repository could implement it. The previously inspected governance registry remains a possible version/commitment primitive, but no bridge from that primitive to the economic gate was found in these concrete admission surfaces.

#### Updated reuse decision

1. Reuse `EconomicProfile.epVersion` only as an existing profile coordinate; do not treat it as a G1 commitment.
2. Reuse `RulesetRegistry` only if a concrete, approved policy payload can be committed and the runtime can resolve that exact payload without conflating governance ruleset version and profile version.
3. Place any G1 verification at the existing authoritative-input boundary before obligation derivation; do not let Cardano Adapter, frontend, or relayer choose fee applicability.
4. Preserve the current project-owner authority decision as a normative decision made now; do not require future community voting, invent an actor class, or claim that a human decision is already runtime-verifiable.
5. Keep G1 **OPEN** until evidence demonstrates the whole chain: owner-approved policy record → immutable identity/commitment → exact profile/deployment/action binding → runtime verification before obligation derivation → resulting obligation enters existing Safe/`K_c`/atomic transition checks.

No production code, tests, CI, deployment, V3 carrier, or Reveal semantics were changed by this follow-up.

### 9.6 Haskell Issue decision path — exact pre-obligation boundary

The follow-up traced the actual Haskell producer rather than relying only on interface names. These files were fetched from the same target branch:

- `PRE-RICH/onchain/PreRichEconomicAdmission.hs` (blob `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a`): `preRichEconomicAdmission` receives the fixed `EconomicProfile`, pre-state/action, pre- and candidate-EEV, executable/required liquidity, and Boolean inputs `truthVerified`, `eevFresh`, `obligationsComplete`, and `allOmegaSuccessorsInCertifiedKernel`. It checks `transitionValid`, constructs the candidate with `transition`, projects the candidate, then passes the supplied completeness Boolean to `EconomicGateInput` and runs `executionAdmissible`. It does not derive the obligation set itself or resolve a G1 policy.
- `PRE-RICH/onchain/PreRichIssueDecision.hs` (blob `ec37ea8e656fa399f1e57e2404e0c6a2c5b5ccee`): `IssueDecisionInput` accepts `idiObligationsComplete` as an input. `produceIssueDecision` constructs `Issue (idiClass input) (idiPrice input)` and calls admission with the statically selected `preRichEconomicProfileV1`. The resulting decision includes state/action fingerprints and the supplied completeness flag, but no G1 policy reference, commitment, or fee-applicability result.
- `PRE-RICH/onchain/PreRichEconomicProfile.hs` (blob `17487e50226a63061dfbf8500130a947bf5df62c`): the deployed source-level profile is `epVersion = 1`, class prices 1/2/3/5/10/25/50/100, and the 500 multiplier. It is a ticket-price/payout profile, not a usage-fee applicability policy.
- `IMMORTAL/kernel/EconomicKernel.hs` (blob `229972487522da6392ff29aa97581096ebc0ff15`): the inspected kernel derives class exposure from profile price and ticket class state, computes worst-case exposure using `epMaxNormalPayoutMultiplier`, computes ProtectedCapital, RawSurplus and solvency. The inspected exported functions contain no protocol usage fee policy or fee-bearing action classification.
- `IMMORTAL/state/EconomicStateV3.hs` (blob `632b3bc5f38be8f5a7f5f8de8187447bc0be33ba`): the V3 state/profile types expose ticket class and economic/control state. The inspected state shape does not itself represent a G1 declaration or policy commitment.
- `relayer/authoritativeIssueRefinementEnvelope.js` (blob `009669b9a997ebfd26a63ffe36f0d187d6be5585`) explicitly calls itself a transport contract, not an oracle or cryptographic verifier. It validates that external refinement inputs include a `derivationVersion`, verification/source references and truth/freshness/completeness flags, but does not validate a G1 policy.
- `relayer/preprodIssueObservationProvider.js` (blob `ff55cfa0bc28ac8a1d3f46bb52dc88ee980950b5`) validates and shapes observed values into the `IssueDecisionInput`; it states that the reader is responsible for obtaining the canonical V3 state/carrier and authenticated Oracle/Pool observations. It does not add a fee-policy decision.

#### Consequence for ordering and completeness

This establishes a more exact gap than “the witness lacks a field”: the Haskell Issue path receives `obligationsComplete` from upstream as a Boolean, then uses it as a gate condition. The inspected Issue producer does not itself prove that the upstream obligation inventory includes a G1 fee obligation whenever the approved policy says the Issue transition is fee-bearing. Merely setting `idiObligationsComplete = True`, attaching a `derivationVersion`, or emitting a valid `IssueDecision` does not establish that missing semantic link.

The code also has a concrete existing profile selected in `produceIssueDecision`; the present G1 audit does not authorize replacing it, adding a fee to the ticket price, or changing the Issue transition. Whether the fee is an obligation and how it affects settlement must follow a separately approved G1 policy and the existing liability-first/ProtectedCapital/`K_c` rules. No fee amount, class, destination, or accounting classification is inferred here.

#### Smallest next investigation

Trace the producer of `IssueDecisionInput` and the concrete source that sets `idiObligationsComplete`, including its obligation inventory and derivation version. Determine whether that source can supply a version-bound, independently verified G1 policy result before it asserts completeness. If no such binding exists, document the minimal missing predicate at that upstream authoritative-input boundary; do not patch the Haskell Boolean gate or invent a parallel fee calculator.

**G1 remains OPEN.** This source-backed finding covers the inspected Issue decision chain only; it does not claim that every action path or every repository file has been exhaustively audited.


### 9.7 Concrete Preprod producer — completeness is transported, not derived here

The next trace followed the actual producer composition through `relayer/preprodIssueAdmissionProvider.js`, `relayer/preprodIssueObservationProvider.js`, `relayer/preprodIssueObservationReader.js`, and `relayer/authoritativeIssueRefinementEnvelope.js` on the target branch.

- **`relayer/preprodIssueAdmissionProvider.js`** (blob `PLACEHOLDER`): it chooses either a caller-supplied `authoritySource`, or `fetchSignedIssueAuthority` when URL and public-key configuration are present. If neither is configured, it still accepts `runtimeInputs.authoritativeInputs` directly. The direct path is not required by this module to pass through the signed-authority fetcher or the refinement-envelope validator.
- **`relayer/preprodIssueObservationReader.js`** (blob `e934caca34a99d4521968d6d04ebd0305f8b53f8`): the reader requires the authoritative values and checks that `obligationsComplete` is a Boolean. It then copies that value into `decisionInput.obligationsComplete`. Its required-key list does not include `derivationVersion`, `sourceReference`, `verificationReference`, or a G1 policy identity/commitment; it does not derive an obligation inventory or test whether a G1 fee obligation is present.
- **`relayer/preprodIssueObservationProvider.js`** (blob `ff55cfa0bc28ac8a1d3f46bb52dc88ee980950b5`): this layer checks required Issue fields and observation-reference consistency, then passes the decision input to Haskell. It does not strengthen the meaning or provenance of `obligationsComplete`.
- **`relayer/authoritativeIssueRefinementEnvelope.js`** (blob `009669b9a997ebfd26a63ffe36f0d187d6be5585`): a separate validator requires `verificationReference`, `sourceReference`, `derivationVersion`, `verificationStatus === 'VERIFIED'`, freshness metadata and Boolean flags. Its own comment says it is a transport contract, not an oracle or cryptographic verifier. In the inspected Preprod producer chain, the reader/provider do not import or invoke this validator, and even a validated envelope would not by itself prove that a G1 fee obligation was included in the completeness claim.

The separate provenance note `docs/audits/PRE-RICH-ISSUE-ADMISSION-PROVENANCE.md` independently describes the concrete authoritative EEV/protected-capital/refinement producer and end-to-end admission evidence as **OPEN**. It explicitly prohibits manufacturing `obligationsComplete` locally or treating test fixtures as live economic evidence. That supports the conclusion that a typed Boolean and references are not, alone, a completeness proof.

#### Exact finding

The inspected chain has an upstream transport point for the claim, but no demonstrated semantic derivation of that claim:

`runtimeInputs.authoritativeInputs / authoritySource → obligationsComplete: Boolean → IssueDecisionInput → EconomicGate`

No inspected link proves:

`approved G1 policy + exact Issue action/context → obligation inventory including any required G1 fee → independently verified completeness claim`.

This is a **missing proof/binding in the inspected source path**, not proof that every supplied claim is false. A correctly authenticated upstream producer may exist outside these files, but the current call chain does not require or verify its G1-specific completeness semantics. Likewise, the presence of `derivationVersion` in the separate envelope type cannot be treated as bound to the Boolean unless the producer validates and consumes that envelope and binds its derivation to the actual obligation inventory and policy revision.

#### Minimal closure seam

Before any implementation change, identify the configured live `authoritySource`/signed-authority producer and inspect its concrete output and verification path. The source-backed acceptance condition for G1 should then be stated narrowly: the authoritative completeness result must be bound to the exact approved G1 policy revision and candidate Issue action, and to the obligation inventory derived under that policy, before it is passed into the existing gate. If the existing producer cannot prove that relation, record that missing predicate at the upstream authoritative-input boundary. Do not patch the Haskell Boolean gate, add a parallel fee calculator, or alter V3/Reveal.

**Status remains G1 OPEN.** This audit still makes no selection of fee-bearing classes and authorizes no production implementation.
