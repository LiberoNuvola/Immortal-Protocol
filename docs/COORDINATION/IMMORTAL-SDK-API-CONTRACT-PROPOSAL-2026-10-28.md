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
- `transactionReference`: chain-specific identifier/reference with explicit phase semantics (candidate body ID, accepted submit receipt, or independently observed ledger transaction); earlier phases must not imply later assurance.
- `sourceReferences[]`: evidence locators, each with source type and observation time where the source provides it.
- `assurance`: an explicit evidence level and verifier identity/version, never a caller-supplied claim that automatically grants authority.
- `limitations[]`: unresolved checks such as source authenticity, freshness, profile qualification, or ledger inclusion.

The current `CanonicalTransitionEvidence.ts` is only a structural validator. Before exporting it, the contract must define schema versioning, fingerprint algorithm and canonicalization, timestamp semantics, environment vocabulary, and the difference between *claimed* and *verified* assurance. A well-formed digest string is not a cryptographic proof; a transaction reference is not proof of ledger inclusion; a timestamp alone is not proof of freshness.

#### Phase split required before runtime export

The current combined evidence shape contains `transactionRef` without declaring its phase. A candidate Cardano transaction ID may be derivable from a completed body before wallet signature; that candidate ID is not evidence of signature, submit receipt, ledger inclusion or finality. The schema must distinguish a `candidateTransactionId`, a `submittedTransactionRef`, and an independently observed/confirmed ledger result (or define equally explicit phase semantics) rather than overload one unqualified field. Do not fabricate placeholder references.

The candidate contract should separate two records:

1. **Pre-sign transition-intent binding** — a versioned, immutable record for the canonical action class, action fingerprint, pre-state fingerprint, candidate post-state fingerprint, environment/profile, authoritative admission reference and verifiers. It can be checked before wallet authorization. This binding alone does not prove the transaction body implements the claimed action; the adapter still must bind the actual completed transaction body to its declared inputs and the transition-specific input/output/action mapping.
2. **Submit/settlement observation evidence** — a record that captures the adapter's actual submission receipt and independently obtained chain observations (including environment and observed block/slot where available). If the transaction ID was already computed from the completed body, retain its candidate phase separately; a returned submit receipt is still not proof of ledger inclusion or finality.

The repository already has `CardanoObservedTransitionEvidence.ts` as a candidate for the observed side. It deliberately names its hashes as *observation fingerprints*, not canonical V3 state fingerprints, and currently has no explicit schema-version or independently verified ledger-finality field. Reuse or adapt it only with an explicit mapping to the canonical evidence record; do not merge the two identities or relabel observation hashes as canonical fingerprints.

Keep the phases explicit: build candidate → derive a candidate body ID if supported → validate admission/intent and completed transaction binding → wallet signature → submit and capture the actual receipt → independently observe/verify the declared ledger result. A successful earlier phase never implies success of a later one.

**Current production-wiring status:** call-site inspection found the general `assertEconomicAdmissionMatchesCanonicalEvidence` and Issue-specific `assertIssueAdmissionMatchesCanonicalEvidence` exercised by tests but not called by all production economic submission paths; `CardanoExecutionAdapter.submitEconomic` does not currently accept the combined evidence object. The fingerprint equality regression therefore validates a helper contract, not a universal runtime gate. Keep this explicit until the pre-sign/post-submit split, ownership and transition-specific mappings have been approved and wired into Issue/Reveal/Claim/Expire.

#### Action-fingerprint provenance matrix (current evidence, not approval)

| Transition | Current source found | What it establishes | Remaining boundary |
|---|---|---|---|
| Issue | `PRE-RICH/onchain/PreRichIssueDecision.hs::produceIssueDecision` derives `actionHash = digest(joinFields [canonicalIssueAction action, preHash, postHash])`; the Haskell provider transports the decision fingerprint and the Issue builder places it in the signed V3 carrier redeemer. | A canonical, pre-transition Issue-decision fingerprint source exists. | The V3 carrier signature/binding remains its own contract; a string equality in an SDK evidence helper is not a substitute for it or for on-chain validation. |
| Reveal | `audit/cardano-integration/reveal-ledger-trace.ts` builds an observed `hashJson` fingerprint from action class, input references, ticket/game fields and result after the local Yaci transaction is observed. | A deterministic audit observation fingerprint for that fixture and environment. | It is not a production pre-sign admission fingerprint, and its harness is explicitly not the production economic-admission path. |
| Claim | `audit/cardano-integration/claim-ledger-trace.ts` builds an observed `hashJson` fingerprint from the ticket, pool, owner-ticket and oracle references plus settlement/game fields after the local Yaci trace. | A deterministic audit observation fingerprint for that fixture and environment. | It is not a production pre-sign admission fingerprint; it must not be copied into a live admission witness. |
| Expire | `audit/cardano-integration/expire-ledger-trace.ts` builds an observed `hashJson` fingerprint from ticket/pool inputs, policy/name, price and expiry after the local Yaci trace. | A deterministic audit observation fingerprint for that fixture and environment. | It is not a production pre-sign admission fingerprint; it must not be copied into a live admission witness. |

The production `src/gameFlow.ts` Reveal/Claim/Expire functions accept an `EconomicAdmissionWitness` and submit through the adapter, but this source audit did not find an application-level canonical action-fingerprint producer equivalent to the Haskell Issue decision. Those transitions need explicit producer ownership and transaction-body mapping before a universal pre-sign binding can be wired. Do not normalize the audit `hashJson` formulas into a universal algorithm by assumption, change V3 semantics, or infer authority from a digest.


#### Production transaction-body mapping audit (source inspection, not a conformance claim)

This table records the currently assembled application transaction shape found in the production builders. It is a **source map for review**, not a guarantee that the runtime checks every element. Lucid completion can add wallet/fee inputs and change outputs; those must be classified explicitly rather than mistaken for protocol transition state.

| Action | Explicit protocol spending inputs passed to `submitEconomic` | Explicit reference inputs / external read context in builder | Application-declared outputs | Existing checks observed before submit | Unresolved binding boundary |
|---|---|---|---|---|---|
| **Issue** | Counter; B1 PrizePool; optional V3 carrier when `requireCarrierBinding` is enabled | BeaconRegistry, Oracle State, optional B2 Control as read inputs | Counter continuation; Pending Prize output; PrizePool continuation; Treasury payment; ticket NFT delivery; optional V3 carrier continuation | Authoritative Issue witness validation; explicit input subset check; completed Treasury-settlement check; completed validity upper bound; Treasury minimum-ADA check | The evidence helper is not passed to `submitEconomic`. The carrier redeemer carries the admitted fingerprint/signature when the optional carrier-bound path is active, but the adapter does not independently verify the full action/output map. Extra completed-body inputs are not classified. |
| **Reveal** | Prize UTxO; B1 PrizePool | PrizeValidator and B1PrizePool reference-script UTxOs; Beacon data is read during construction | Updated PrizeDatum (result/tier/payout and Revealed status); updated PrizePool datum | Datum/status checks, beacon and player-commitment validation, deterministic result construction; adapter checks declared inputs and authenticated liquidity-source binding | No production canonical pre-sign action-fingerprint producer or evidence argument at the adapter boundary; current audit `hashJson` is post-transition/local-Yaci evidence. The adapter does not validate the completed output/datum/redeemer map against the witness. Extra inputs are not classified. |
| **Claim** | Prize UTxO; B1 PrizePool; owner ticket NFT UTxO | PrizeValidator and B1PrizePool reference-script UTxOs; wallet ownership and settlement quote/value read during construction | Claimed PrizeDatum; updated PrizePool datum; settlement payout to the validator-derived enterprise address; returned ticket NFT to the buyer address | Revealed/status and expiry checks; positive payout and pending-liability checks; exact settlement quote/value validation; adapter input and liquidity-source checks | No production canonical pre-sign action-fingerprint producer or evidence argument at the adapter boundary. Completed output/payout/ticket-return mapping is not independently checked by the adapter; extra inputs are not classified. |
| **Expire** | Prize UTxO; B1 PrizePool | PrizeValidator and B1PrizePool reference-script UTxOs | Prize collateral ADA to permissionless executor; updated PrizePool datum; no new Prize UTxO is declared | Pending status, positive price/expiry, reserve/count checks, Prize UTxO non-lovelace asset rejection, `validFrom(expiresAt)`; adapter input and liquidity-source checks | No production canonical pre-sign action-fingerprint producer or evidence argument at the adapter boundary. Completed outputs and validity interval are not collectively bound to the admission witness by the adapter; extra inputs are not classified. |

**Cross-action boundary confirmed in `CardanoExecutionAdapter.submitEconomic`:** the adapter checks that each caller-declared protocol input is present in the completed spending-input collection. It does not require the full actual input set to equal that list, because Lucid can select wallet/fee inputs, and it currently does not classify those additional inputs. It also does not accept a phase-specific transition-intent binding or verify a transition-specific output map. Therefore the existing check is a useful subset check, not complete transaction/economic-state binding.

**Safe sequencing before runtime integration:**
1. Assign canonical pre-sign fingerprint ownership/canonicalization per transition; do not reuse post-transition audit hashes as live authorization.
2. Define a reviewed classification for protocol state inputs, reference inputs, wallet/fee inputs and change outputs; preserve legitimate wallet balancing without allowing unexplained economic state inputs.
3. Define per-action body predicates for the expected state inputs, redeemer/action, validity interval, outputs, value/datum transitions, payout/ticket delivery and any carrier binding that is applicable.
4. Split pre-sign transition intent from post-submit/observed-ledger evidence, then pass the pre-sign binding through the production adapter and verify that negative twins stop before wallet signing.

Until those owners and predicates are approved, this matrix does not authorize changing V3/Reveal semantics, inventing fingerprints, changing economic policy or closing V08/V09.

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


## 11. Proposed pre-sign intent and completed-body predicates (review gate; not approved API)

**Status: draft for maintainer review; this section authorizes no runtime/API change.** It records required relationships and known builder behavior; it does not introduce an economic algorithm, fingerprint formula, protocol rule, or conformance claim.

### 11.1 Phase-separated candidate records

The candidate contract has three distinct phases and must not overload one transaction reference:

1. **Pre-sign transition intent.** A versioned record identifies action class, chain/environment/profile, authoritative admission reference, canonical action facts, canonical pre-state and candidate post-state fingerprints, and producer/canonicalization provenance for every fingerprint. It references the approved transition-predicate profile. It contains no submission receipt and makes no claim of ledger inclusion.
2. **Completed-body binding.** After Lucid completion and before wallet signing, the adapter inspects the actual transaction body and evaluates spending inputs, reference inputs, redeemers, validity interval, fee, outputs, values and datums against the intent and approved transition-predicate profile. Where the adapter derives a candidate transaction ID from the completed body, its phase must be explicitly labelled as a candidate ID. The body itself—not a caller-provided parallel list—is the object being checked.
3. **Submit/settlement observation.** After submission, retain the actual receipt and independently observed ledger evidence as separate phases. Neither a candidate body ID nor a successful submit receipt proves ledger inclusion, confirmation or finality.

Candidate schema identifiers and field names require review before export. The existing CanonicalTransitionEvidence record remains settlement/evidence-oriented and must not be reused unchanged as the pre-sign record while transactionRef phase semantics are implicit.

### 11.2 Required provenance and fail-closed behavior

A pre-sign intent may carry an action fingerprint only when its canonical producer, producer version, canonicalization identifier and digest algorithm/encoding are identified and approved. This proposal deliberately defines no new fingerprint formula.

- **Issue:** preserve the existing Haskell Issue-decision source and applicable V3 carrier binding as their own contracts. Do not replace or weaken either with a string comparison.
- **Reveal, Claim and Expire:** the available local-Yaci hashJson values remain observed-trace fingerprints, not live authorization fingerprints. Until a production canonical producer and canonicalization contract is owned, reviewed and tested for each action, its production pre-sign binding is unavailable and the universal gate remains blocked.
- A missing producer, unknown schema/action, absent provenance, stale or mismatched admission, mismatched chain/environment/profile, unresolved body input/output, or predicate failure must stop before wallet signing and transaction submission.
- Do not derive an economic post-state fingerprint from transaction-body bytes by assumption. The transition-state fingerprint and transaction-body identity answer different questions and need an explicit reviewed relation.

### 11.3 Body input/output classification contract

Every actual spending input must resolve to exactly one reviewed class; the adapter must never silently classify unexplained inputs as wallet balancing.

| Class | Required treatment |
|---|---|
| Protocol state input | Must match an expected transition role and exact approved UTxO reference. The protocol-state input set must have no missing or unexplained members. |
| Wallet-balance input | Allowed only when independently resolved as controlled by the connected wallet and not one of the protocol state inputs. Merely appearing in Lucid's completed body is not evidence of wallet ownership. |
| Reference input | Kept separate from spending inputs; role and identity must match the approved builder/predicate profile. A reference input cannot satisfy a required spending-input role. |
| Protocol output/payment | Must satisfy the transition's semantic output role, destination, asset/value and datum constraints using existing builder/validator semantics. The right amount sent to the wrong destination is not equivalent. |
| Wallet change output | Allowed only under the reviewed change-address/ownership and value-accounting rule. It must not absorb, omit or relabel a protocol payment, ticket NFT, carrier or state continuation. |
| Fee / validity fields | Inspected as explicit body fields and checked against existing action and wallet/deployment policy. This proposal invents no fee ceiling or validity rule; any missing policy remains an open gate rather than an assumed pass. |

Compare protocol roles semantically, not by assumed output index. The approved mapping must state whether roles are distinct outputs or may intentionally be combined. If role assignment is ambiguous, fail closed. Datum interpretation and redeemer discriminants must use the pinned schema and existing action semantics; this proposal does not prescribe a new CBOR canonicalization.

### 11.4 Per-transition predicate inventory to approve

These are the minimum fields already identified by the production-builder audit. The table is a review inventory, not a claim that the adapter currently enforces them.

| Action | Required protocol spending roles | Required semantic output/body checks before signing |
|---|---|---|
| **Issue** | Counter; B1 PrizePool; V3 carrier only when the existing carrier-binding path requires it | Counter continuation; Pending Prize; PrizePool continuation; Treasury payment and existing minimum-ADA constraint; ticket NFT delivery; applicable V3 carrier continuation/binding; existing completed-body upper-validity check. Preserve the authoritative Issue witness and existing Treasury settlement checks. |
| **Reveal** | Prize UTxO; B1 PrizePool | Existing Reveal redeemer; Prize continuation has the existing deterministic result/tier/payout and Revealed status; PrizePool continuation matches the builder's expected datum/value transition. Keep beacon and player-commitment checks. Do not change Reveal semantics or promote a post-Yaci trace hash into pre-sign authority. |
| **Claim** | Prize UTxO; B1 PrizePool; owner ticket NFT UTxO | Existing Claim redeemer; Prize datum reaches the existing Claimed state; PrizePool continuation matches the expected transition; payout matches validated settlement quote/value and validator-derived destination; ticket NFT is returned to the buyer address. Preserve existing status, expiry, positive-payout and pending-liability checks. |
| **Expire** | Prize UTxO; B1 PrizePool | Existing Expire redeemer; collateral ADA delivered to the permissionless executor; PrizePool continuation matches expected transition; no replacement Prize output; existing expiry lower-bound condition is present and not weakened. Preserve current rejection of non-lovelace assets in the expiring Prize UTxO. |

For every row, the approved predicate profile must define how expected semantic outputs are present, correctly assigned and not duplicated while allowing independently validated wallet change. It must define exact datum fields/values from the existing builder and pinned schema, not guessed output positions or a new interpretation of economic policy.

### 11.5 Minimum adversarial conformance matrix

Before wiring this contract through every production submit path, add positive and negative twins for each action. All negative tests must assert that signing and submission were never called.

- **Inputs:** missing required protocol input; wrong UTxO for a role; duplicate input; unexplained extra protocol/state input; a reference input incorrectly used as a spending input; a valid independently resolved wallet-balance input as the positive control.
- **Outputs and value:** missing/duplicated protocol continuation; altered datum/status/result/tier/payout; altered asset quantity; wrong Treasury/payout/executor/buyer destination; missing or misdirected ticket NFT; unintended replacement Prize on Expire; valid change to the approved wallet destination as a positive control.
- **Redeemer and validity:** wrong action/redeemer, missing required expiry bound, weakened or mismatched interval, or action/interval inconsistent with the existing builder.
- **Provenance and phase:** unknown schema/action; absent fingerprint producer/canonicalization; admission/action/state mismatch; environment/profile mismatch; post-submit observation offered as pre-sign authorization; candidate body ID treated as a submit receipt; submit receipt treated as ledger confirmation.
- **Mutation ordering:** a body modified after validation must not be the body subsequently signed. Bind validation to the exact completed body passed to the wallet-signing port, not to a different object or parallel declaration.

### 11.6 Decision gate before implementation

Review and close the following before runtime integration: (a) canonical fingerprint producer/encoding ownership per action; (b) exact protocol-versus-wallet input and protocol-versus-change output classification; (c) versioned per-action input/redeemer/validity/output/datum/value predicate profiles; (d) phase-separated record and compatibility policy; and (e) negative twins proving failure before signing/submission.

Until then this is a concrete contract proposal, not implementation or approval. V08/V09 remain open; concrete Issue certificate R1/K_c, Oracle qualification and EEV remain independent gates. No V3, Reveal, economic-kernel or Agent A-owned Oracle/EEV semantics are changed by this document.


### 11.7 Implemented increment — additional spending-input classification (2026-10-28)

A narrow runtime increment is now present in `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`:

- The adapter still requires each declared protocol spending input to exist in the completed transaction body.
- It now also inspects every additional actual spending input. If extras exist, it obtains the selected wallet's UTxO list and requires each exact canonical `txHash#outputIndex` reference to appear there.
- If the wallet UTxO listing is unavailable, fails, is malformed, contains duplicate references, or omits any extra body input, economic submission stops before calling either the wallet-signing port or the submit port.
- The check is conditional on extra inputs; transactions with no additional inputs do not need the wallet listing call.
- Positive/negative tests in `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts` cover a wallet-listed additional input, an extra input not present in the wallet list, and an unavailable wallet UTxO listing.

This narrows the prior gap: unexplained additional spending inputs are no longer silently accepted as wallet balancing inputs. It does **not** close completed-body binding. The check classifies extra-input references using the connected wallet's own UTxO listing; it does not yet bind semantic outputs, datums, redeemers, values, mint/burn or validity to an approved transition intent, nor does wallet-list membership alone establish that an extra input is economically inert. Those remain explicit gates. Do not describe this increment as full transaction binding or as closing V08/V09.

This increment leaves the existing economic admission, Haskell Issue fingerprint source, V3 carrier, Reveal semantics, economic policy and Agent A's Oracle/EEV work unchanged.
