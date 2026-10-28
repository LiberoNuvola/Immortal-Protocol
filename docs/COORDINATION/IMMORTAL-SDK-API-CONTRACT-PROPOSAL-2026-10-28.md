# IMMORTAL SDK — API Contract Proposal (Draft)

**Status:** REVIEW DRAFT — NOT AN APPROVED PUBLIC API  
**Date:** 2026-10-28  
**Working branch:** `work/immortal-green-closure`  
**Scope:** API boundaries and compatibility contract only. This document does not implement a package, change protocol semantics, certify an adapter, or authorize deployment.

## 1. Decision requested

Review the proposed SDK boundary before any public package facade is implemented. The goal is to expose existing canonical contracts without duplicating the normative economic kernel, laundering evidence into authority, or hiding incomplete conformance.

**Recommended sequencing:** approve package ownership and evidence semantics first; implement only after V08/V09 release-gate criteria and schema compatibility tests are agreed.

## 2. Candidate package ownership

| Candidate package | May expose | Must not do |
|---|---|---|
| `@immortal/core` | Versioned, chain-neutral data contracts; structural validators; typed references to evidence | Reimplement the Haskell economic kernel in TypeScript; approve EEV; claim source authenticity, freshness, viability, or ticket admission from shape validation |
| `@immortal/adapter-cardano` | Cardano observations/projections, transaction-building/execution boundary, wallet hand-off and fail-closed submission contracts | Sign without explicit wallet authority; bypass current admission; convert an observation into deployment approval; claim generic chain neutrality |
| `@immortal/conformance` | Portability vectors, normalized reference-runner invocation, test/evidence manifests and qualification status | Mark full portability green while required vectors remain pending; substitute a boolean gate for a concrete certificate |

Package names are provisional and require repository/package-owner approval. Existing files remain in place initially; no mass moves or new parallel implementation are proposed.

## 3. Candidate public contracts

The following are *contract sketches*, not code to copy into runtime packages before review.

### 3.1 Versioned transition evidence envelope

Proposed minimum fields:

- `schemaVersion`: explicit, immutable schema identifier (initial candidate: `immortal.transition-evidence/v1`).
- `chain` and `environment`: identify the chain and distinguish local Yaci, Preprod, Mainnet, or other declared environments.
- `action`: action identifier from a versioned action vocabulary; unknown values fail closed.
- `preStateFingerprint` and `postStateFingerprint`: digest-encoded fingerprints with declared algorithm/encoding.
- `transactionReference`: chain-specific transaction/observation reference where applicable.
- `sourceReferences[]`: evidence locators, each with source type and observation time where the source provides it.
- `assurance`: an explicit evidence level and verifier identity/version, never a caller-supplied claim that automatically grants authority.
- `limitations[]`: unresolved checks such as source authenticity, freshness, profile qualification, or ledger inclusion.

The current `CanonicalTransitionEvidence.ts` is only a structural validator. Before exporting it, the contract must define schema versioning, fingerprint algorithm and canonicalization, timestamp semantics, environment vocabulary, and the difference between *claimed* and *verified* assurance. A well-formed digest string is not a cryptographic proof; a transaction reference is not proof of ledger inclusion; a timestamp alone is not proof of freshness.

#### Phase split required before runtime export

The current combined evidence shape contains `transactionRef`, although a transaction reference and ledger result are not yet available at the pre-sign decision point. Do not reuse this full object as the only pre-sign contract or fabricate a placeholder transaction reference.

The candidate contract should separate two records:

1. **Pre-sign transition-intent binding** — a versioned, immutable record for the canonical action class, action fingerprint, pre-state fingerprint, candidate post-state fingerprint, environment/profile, authoritative admission reference and verifiers. It can be checked before wallet authorization. This binding alone does not prove the transaction body implements the claimed action; the adapter still must bind the actual completed transaction body to its declared inputs and the transition-specific input/output/action mapping.
2. **Post-submit settlement/observation evidence** — a separate record created after submission, carrying the real transaction reference and evidence from the declared chain source (including environment and observed block/slot where available). Ledger inclusion/finality must be a separately verified claim, not inferred from a submitted transaction id.

Keep the phases explicit: build candidate → validate admission/intent and completed transaction binding → wallet signature → submit → obtain the actual transaction reference → observe/verify the declared ledger result. A successful earlier phase never implies success of a later one.

**Current production-wiring status:** call-site inspection found the general `assertEconomicAdmissionMatchesCanonicalEvidence` and Issue-specific `assertIssueAdmissionMatchesCanonicalEvidence` exercised by tests but not called by all production economic submission paths; `CardanoExecutionAdapter.submitEconomic` does not currently accept the combined evidence object. The fingerprint equality regression therefore validates a helper contract, not a universal runtime gate. Keep this explicit until the pre-sign/post-submit split, ownership and transition-specific mappings have been approved and wired into Issue/Reveal/Claim/Expire.

#### Action-fingerprint provenance matrix (current evidence, not approval)

| Transition | Current source found | What it establishes | Remaining boundary |
|---|---|---|---|
| Issue | `PRE-RICH/onchain/PreRichIssueDecision.hs::produceIssueDecision` derives `actionHash = digest(joinFields [canonicalIssueAction action, preHash, postHash])`; the Haskell provider transports the decision fingerprint and the Issue builder places it in the signed V3 carrier redeemer. | A canonical, pre-transition Issue-decision fingerprint source exists. | The V3 carrier signature/binding remains its own contract; a string equality in an SDK evidence helper is not a substitute for it or for on-chain validation. |
| Reveal | `audit/cardano-integration/reveal-ledger-trace.ts` builds an observed `hashJson` fingerprint from action class, input references, ticket/game fields and result after the local Yaci transaction is observed. | A deterministic audit observation fingerprint for that fixture and environment. | It is not a production pre-sign admission fingerprint, and its harness is explicitly not the production economic-admission path. |
| Claim | `audit/cardano-integration/claim-ledger-trace.ts` builds an observed `hashJson` fingerprint from the ticket, pool, owner-ticket and oracle references plus settlement/game fields after the local Yaci trace. | A deterministic audit observation fingerprint for that fixture and environment. | It is not a production pre-sign admission fingerprint; it must not be copied into a live admission witness. |
| Expire | `audit/cardano-integration/expire-ledger-trace.ts` builds an observed `hashJson` fingerprint from ticket/pool inputs, policy/name, price and expiry after the local Yaci trace. | A deterministic audit observation fingerprint for that fixture and environment. | It is not a production pre-sign admission fingerprint; it must not be copied into a live admission witness. |

The production `src/gameFlow.ts` Reveal/Claim/Expire functions accept an `EconomicAdmissionWitness` and submit through the adapter, but this source audit did not find an application-level canonical action-fingerprint producer equivalent to the Haskell Issue decision. Those transitions need explicit producer ownership and transaction-body mapping before a universal pre-sign binding can be wired. Do not normalize the audit `hashJson` formulas into a universal algorithm by assumption, change V3 semantics, or infer authority from a digest.

### 3.2 Admission binding

Expose a binding result only as a relation between the supplied admission and the appropriate phase-specific evidence. The helper-level equality check now includes action class, action fingerprint and pre/post-state fingerprints; it is not currently wired as a universal production gate.

Preserve the pre-sign fail-closed boundary. Schema validation, fingerprint equality, or matching fields must never trigger wallet signing or transaction submission on their own. Do not claim production enforcement until the adapter/API receives and validates an explicit pre-sign intent binding and all economic submission paths pass it.

### 3.3 Canonical economic state

The chain-neutral state type may be exported only as a data contract and shape validator. The normative calculation authority remains `IMMORTAL/kernel/UniversalEconomicKernel.hs` and its declared reference conformance path. No second TypeScript implementation of `ProtectedCapital`, `RawSurplus`, or viability is proposed.

### 3.4 Cardano execution boundary

The Cardano package can expose the existing adapter boundary with explicit wallet/user consent and explicit preconditions. It must retain:
- authoritative admission as a prerequisite;
- completed transaction/input binding checks before signing;
- explicit environment and source labels;
- fail-closed behavior for missing, stale, or mismatched evidence;
- a clear separation between build, wallet signature, submission, and observed ledger result.

A successful build is not a signed transaction; a signed transaction is not a submitted transaction; submission is not ledger acceptance; local Yaci evidence is not Preprod/Mainnet evidence.

## 4. Assurance vocabulary — proposed, not yet normative

Avoid a single boolean `verified`. Represent each evidence dimension separately:

1. **STRUCTURE** — schema and field shapes validate.
2. **SOURCE_OBSERVED** — an identified source was read at a recorded time.
3. **PROFILE_QUALIFIED** — profile-specific qualification predicates and evidence checks passed.
4. **DEPLOYMENT_APPROVED** — the current authoritative deployment-approval artifact exists and binds the applicable source/profile/deployment.
5. **LEDGER_CONFIRMED** — the exact transaction is independently observed in the declared ledger environment.

These are not automatically cumulative: each level requires its own verifier and evidence. A source observation may be real while unqualified; profile qualification does not imply deployment approval; local ledger confirmation does not imply Preprod/Mainnet confirmation. This vocabulary is a proposal and must be reconciled with existing normative statuses before implementation.

For direct-USDM EEV, the SDK may carry an already qualified evidence reference. It must not calculate EEV from ADA/PRE/oracle prices, assert USD/USDM parity, or replace the separate deployment approval and R1/`K_c` gate.

## 5. Compatibility and release rules

- Every exported serialized contract has an explicit schema version.
- Additive optional fields may be compatible only if old consumers fail safely and unknown assurance claims are not elevated.
- Removing/renaming fields, changing canonicalization, digest semantics, action vocabulary, environment labels, or trust meaning requires a major version or a new schema identifier.
- Unknown schema versions, unknown actions, malformed evidence, missing required references, or conflicting bindings fail closed.
- Do not make a package release claim of “full IMMORTAL conformance” while V08/V09 or any required vector remain pending.
- Package API tests must test both positive cases and negative twins for unknown versions, mismatched fingerprints, wrong environment, stale/missing source evidence, and invalid trust transitions.
- Keep a source-to-export-to-test map and exact commit/toolchain fingerprint in every release evidence packet.

## 6. Required release gates before implementation/qualification

| Gate | Required evidence | Current disposition |
|---|---|---|
| Public export ownership | Approved package boundaries and owners | Proposal only |
| Evidence schema | Versioning, canonicalization, timestamp and trust semantics | Open |
| Pre-sign vs post-submit evidence | Separate intent/admission binding from actual transaction reference and ledger observation | Design proposed; runtime wiring open |
| Per-action fingerprint provenance | Canonical pre-sign fingerprint producer and transaction-body mapping for Issue/Reveal/Claim/Expire | Issue source mapped; Reveal/Claim/Expire production producer mapping open |
| Existing adapter contract tests | Exact-head focused CI and negative twins | Existing workflows green on previously pinned heads; recheck current head before implementation |
| V08 universal transition | Canonical executable owner mapped to normative `T` and expiry finality, with conformance tests | Open |
| V09 certified kernel | Concrete deployment/profile instance of `K_c`, declared `S,A,Ω,T,Safe`, CK/VC evidence and non-vacuity evidence where required | Open |
| Cardano release boundary | Build/sign/submit/ledger-result phases remain distinct; current admission required | Existing contract boundary; release tests required |
| Preprod Issue | Current qualified EEV, deployment approval, authoritative admission binding and exact ledger evidence | Separate Agent A/deployment gate; not SDK qualification |

## 7. Explicit non-goals

This proposal does not:
- close V08 or V09;
- instantiate or certify `K_c`;
- authorize or submit a PRE-RICH Issue transaction;
- infer Moneta USD/USDM parity or convert the test token into Mainnet evidence;
- modify KA/KC/KD, the price ladder, Genesis, treasury bootstrap, the 500× payout rule, V3 carrier, or Reveal semantics;
- resume Materios work;
- create a new branch or implement a public package facade.

## 8. Current evidence context (2026-10-28)

The working branch's five bounded workflows were green at exact HEAD `6a71021404d1d0a354cbe2d948bffb84b3a54bac`:
- [IMMORTAL Portability Conformance #40630780102](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40630780102)
- [Cardano Adapter Sale Conformance #40630780282](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40630780282)
- [Protocol Declaration Conformance #40630780182](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40630780182)
- [Algorithmic Governability Adversarial Lab #40630780202](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40630780202)
- [Documentation Link Check #40630780184](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40630780184)

This is bounded CI evidence, not full portability certification. Agent A's fresh direct-USDM observation/EV1–EV7 qualification is separately recorded in the repo-wide checkpoint; its artifact still has `deploymentApproval: null` and `deploymentApprovalStatus: PENDING`. The direct physical-source qualification does not approve Issue admission or resolve R1/`K_c`.

## 9. Review questions

1. Are the package ownership boundaries correct, especially keeping the Haskell kernel authoritative?
2. Which existing schema/status vocabulary is already normative and must be reused instead of introducing synonyms?
3. Who owns canonical fingerprinting and source/freshness verification?
4. Who is the normative/executable owner for universal transition/expiry conformance (V08)?
5. What deployment/profile will instantiate and certify `K_c` (V09)?
6. Which exact tests and release artifact will be mandatory before the first public SDK package?

**Recommendation:** approve/revise this contract first. Do not implement the public facade until the review questions affecting authority and conformance are resolved.


## 10. Repository packaging baseline (verified on current branch)

The root `package.json` is currently an application-level manifest (Vite app, Vitest, Cardano libraries and operational scripts). The repository tree contains a root `package.json` and a few nested manifests for specific tools, but no root `pnpm-workspace.yaml` or `lerna.json` was found in the inspected tree. Therefore the candidate package names above describe *logical ownership boundaries*, not existing publishable packages or a ready monorepo.

Before implementing packages, decide whether the first deliverable should be:
1. a non-published internal API module with contract tests, or
2. a real package/workspace with build output, export maps, dependency boundaries, versioning, package-level tests and publication/release evidence.

Do not turn the current Vite application's root manifest into a public SDK package by accident, and do not add a workspace/package manager migration as a side effect of the contract proposal. Any packaging change should be separately scoped and tested.
