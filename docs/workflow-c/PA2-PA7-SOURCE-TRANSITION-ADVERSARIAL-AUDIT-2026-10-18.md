# PA2 / PA7 — Source-to-Transition Adversarial Audit

**Date:** 2026-10-18  
**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Authorized branch:** `release/public-main-curated-2026-09-24`  
**Audit starting HEAD:** `279ee036fcfafcbd3a360070d01f15b78bc82675`  
**Prior CI checkpoint:** [C6 R1 finite certificate checker #25](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39153488547), SUCCESS on that exact SHA.  
**Result:** `BLOCKED — PROFILE EXHAUSTIVENESS, R7 RECONCILIATION AND INDEPENDENT PA7 REVIEW UNPROVEN`.

This report records source-backed gaps; it does not certify PA2, PA7, R1, R7, Ω, L6, S0, or deployment conformance. No normative semantics are amended.

## 1. Scope and evidence limits

The authorized branch's commit page identified HEAD `279ee036fcfafcbd3a360070d01f15b78bc82675`, whose parent is `7ae34445db58c3eb7dcd9840c51e7019fd10851c`. CI run #25 completed successfully against the same SHA. No local checkout was available, so local/uncommitted working-tree status and local test execution cannot be claimed. No workflow dispatch/rerun, merge, release, deployment, transaction or mint was performed.

The existing CI verifies source pins, the R7 cell ontology, 32 curated component rows and 15 curated source surfaces, then runs bounded Node tests. Its audit result remains `MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN`, with `closureEligible=false`. It establishes consistency of the reviewed checklist, not completeness of the economic universe.

## 2. Normative anchor and falsifier

R7 source: `docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` (pinned blob `9ebe7c55fb5de26aa9c8e1d0f17e466c91855c3e`).

R7 defines `EEV = value(A1) + value_net(A2)`; `PC_R7 = value(L1) + value(L2) + value_worstcase_Ω(L3)`; and `RawSurplus = max(0, EEV - ProtectedCapital)`, which is a derived boundary, not a cell. PC1–PC7 require exhaustive/disjoint asset and commitment partitions, only the A4↔L3 cross-side link, separate ℌ, deterministic valuations (Ω-worst-case for L3), permitted deltas only, and L6 empty in every executable state.

R7 §6 proves T-CONS-GAP: an omitted material commitment X undercounts ProtectedCapital by value(X) and overstates RawSurplus by the same amount, while conservation among recorded cells still holds. Therefore a green internal conservation check cannot imply PA2. R7 §7 defines PA2 as an enumeration of all profile-created economic content mapped exactly once, and PA7 as an adversarial review seeking an omitted commitment class.

## 3. Source-to-transition findings

### 3.1 The V3 action space does not itself cover all normative economic deltas

`IMMORTAL/kernel/EconomicTransitionV3.hs` (blob `62c2980a821cdcfc33a33e15a09617256ab8753c`) defines exactly four action constructors: `Issue`, `Reveal`, `Claim`, and `Expire`.

R7's permitted deltas additionally include `verify: A3 → A1 | A2`, `stale: A1 | A2 → A3`, and `realise: A4 → A1 | A2 | ∅` paired with resolution of the linked L3 exposure, as well as generic `represent`, `settle`, `expire`, and `resolve`. The four-action aggregate type does not prove that these environment/adapter transitions are bound to canonical T and covered by Ω. This is a demonstrated coverage gap at the inspected boundary, not proof no other adapter paths exist.

Concrete counterexamples to assuming transition completeness:
- freshness can lapse (`stale`) and reduce EEV without changing V3 aggregate state;
- verification can change qualified EEV but is not a V3 action;
- contingent asset realization can correlate with liability resolution but is not represented as a complete paired event in the V3 action type;
- `Expire TicketClass` carries no ticket identity, issuance/expiry timestamps or expiry-eligibility witness;
- `Claim Integer` carries no ticket identity, owner/signature or observed terminal settlement;
- `Reveal TicketClass Integer` is aggregate and does not by itself bind per-ticket commitment/result proof, Beacon readiness, expiry state or frozen ticket identity.

These are gaps between aggregate transitions and richer application refinements. They must not be “fixed” here by changing normative semantics or claiming that the existence of refinement types proves the deployed route invokes them.

### 3.2 Admission conditions are caller-supplied premises at the inspected boundary

`PRE-RICH/profile/PreRichEconomicAdmission.hs` (blob `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a`) receives `truthVerified`, `eevFresh`, `obligationsComplete`, and `allOmegaSuccessorsInCertifiedKernel` as Boolean arguments. This function passes them into the gate; it does not itself derive their truth from authenticated observations or enumerate the profile obligation universe / Ω.

This is an interface-premise gap. It does not establish that every caller is insecure, but caller wiring must be independently shown to be authoritative and fail-closed before this boundary can support VC4/VC5.

### 3.3 Projection equality is not domain completeness

`PRE-RICH/profile/PreRichEconomicProjection.hs` (blob `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13`) folds over supplied class rows, rejecting duplicate/unknown classes and checking class-derived reserve/count/exposure equalities. The fold's empty-list base case succeeds and the fold itself does not establish that every canonical profile class occurs exactly once. A separate TypeScript Cardano projection has an exact-eight-class check, but that separate path does not prove every authoritative admission/deployment path invokes it.

Thus a subset can be internally consistent while an economic class/right is absent from its input domain. The inspected source does not establish that every upstream caller accepts such a subset; this falsifies the inference “aggregate equalities imply exhaustive class coverage,” not a claim of a reproduced live exploit.

### 3.4 Finite fixtures do not authenticate a deployed ticket universe

Current tests exercise synthetic registry perturbations (missing rows, duplicate cell, duplicate accounting key, source drift, bad anchors, premature promotion). Those are useful checker regressions. They do not enumerate the source universe, prove all execution entry points are catalogued, attest a complete authoritative ticket set, prove Ω containment, establish live S0, or prove L6 empty in every executable state.

## 4. R7 cell-by-cell reconciliation status

Status terms: **partial** means a source-grounded candidate exists but a proof boundary remains open; **unreconciled** means available evidence does not establish the mapping; **not proven** is not the same as false.

| Cell | Rule / source | Producers/components inspected | Evidence available | Counterexample / missing proof | Status |
|---|---|---|---|---|---|
| **A1** | Verified liquid executable value; R7 §2.1, EEV contract | Cardano observation, executable UTxO observer, Treasury→PrizePool funding | Pinned sources; direct EEV profile restricts value to canonical USDM in exact qualified B1 PrizePool UTxO | No authenticated deployment-bound EV1–EV7 package/live S0; Genesis Treasury is not automatically PrizePool liquidity | **PARTIAL** |
| **A2** | Verified conversion/haircut net value | Settlement conversion policy | Application requires supported settlement to preserve frozen USDM value; direct EEV scope excludes conversion valuation | No complete applicable valuation evidence for this direct profile; no haircut/oracle assumed | **OUTSIDE DIRECT EEV PROFILE; GENERAL CELL OPEN** |
| **A3** | Unverified/stale value excluded; C16 | Freshness lapse / stale observation | Normative fail-closed rule | No V3 action binds freshness lapse to canonical state/acceptance; freshness source and EEV effect not shown here | **UNRECONCILED** |
| **A4** | Contingent asset paired with L3 | External realization and linked L3 resolution | Normative pairing explicit | No complete event-to-T pairing, disjointness proof or authoritative Ω successor coverage | **BLOCKED (PA3/PA4/Ω)** |
| **A5** | Non-economic/informational holdings excluded | Non-qualified asset classification | Direct EEV profile excludes unqualified holdings | Complete authoritative asset-domain classification missing; exclusion from EEV alone is not PC1 proof | **PARTIAL** |
| **L1** | Pending accepted obligation included in PC; settle→L4 or authorized expiry→L5 | Issue/Reveal; aggregate Claim/Expire; per-ticket refinements | Aggregate fields and refinement source files pinned | Aggregate totals cannot prove per-ticket exactly-once lifecycle; aggregate actions omit ticket-level inputs | **PARTIAL** |
| **L2** | CAR conditionally committed future allocation | Potential future allocation/funding path | Normative cell defined | PRE-RICH CAR applicability and mapping of PC add-ons to CAR not demonstrated; assigning one would invent semantics | **UNRECONCILED / GOVERNANCE BLOCKER** |
| **L3** | Worst-case incremental liability over Ω, not statistical expectation | Issue creates exposure; Reveal/Expire reduce exposure; A4 resolution pairs here | PRE-RICH specifies `WorstCaseExposure(P,N)=500×P×N`; V3 structural class checks exist | Ω not bound to all authoritative successors; class sums do not prove Ω completeness; add-on disjointness open | **PARTIAL** |
| **L4** | Settled obligations excluded after terminal settlement | Claim | Claim refinement specifies owner/right/payout constraints | V3 aggregate decrement does not prove atomic observed settlement or per-ticket terminal record/no replay | **PARTIAL** |
| **L5** | Expired rights excluded after final, irreversible expiry | Expire | Expiry policy crystallized at issuance; refinement source exists | Aggregate class expiry does not prove specific right was eligible/expired exactly once/never revived | **PARTIAL** |
| **L6** | Unrepresented exposure empty in every executable state; PC7 | All economic-right creation/transform/settlement paths | Caller-supplied `obligationsComplete` and finite checks | Boolean premise is not exhaustive-right inventory; synthetic finite states cannot prove universal emptiness | **NOT PROVEN / HARD BLOCKER** |
| **ℌ** | Historical monotone facts separate from asset/liability cells and not valued in EEV/PC | Historical issue/reveal/claim/expiry/transfer facts | Separate ledger symbol and selected state fields identified | No exhaustive history schema or ledger provenance; lifecycle metadata is not itself a historical accounting value | **PARTIAL; SEPARATE FROM CELLS** |

The normative expression remains exactly `PC_R7 = L1 + L2 + worstcase_Ω(L3)`. It is not demonstrated that the V3/Universal expression—crystallized liabilities + class-derived worst-case exposure + `SafetyCapital` + `ReserveProtection` + `MandatoryFutureCosts` + locked Jackpot—equals this expression without omission or double counting.

## 5. ProtectedCapital components and other transitions

| Component/rule | Current implementation evidence | Why open |
|---|---|---|
| `SafetyCapital` | Explicit V3 and Universal fields | No authoritative L1/L2/L3 assignment or disjointness proof; no invented cell assignment |
| `ReserveProtection` | Explicit V3 and Universal fields | Same unresolved mapping/possible overlap |
| `MandatoryFutureCosts` | Explicit V3 and Universal fields | Does not automatically qualify as CAR/L2; classification is normative/governance |
| Locked Jackpot | Projected once into additional protected capital; application says locked and paid exactly once | No R7 cell or proof against overlap with L2/L3 |
| Statistical reserve | Separate field and distinct EffectivePool use | Statistical risk model is not R7's Ω-worst-case L3 |
| Sale atomicity | Application couples NFT mint + Treasury payment + unresolved reservation | No end-to-end evidence that deployed adapter transaction binds all legs atomically |
| Ticket transfer | Identity-preserving policy and certified-ticket representation | No ledger-derived complete ticket universe/exactly-once right-transfer proof attached |
| Treasury Genesis | Bootstrap condition specified | Not automatically executable PrizePool liquidity; no live qualified UTxO evidence |
| Settlement conversion | Frozen USDM value-preservation rule | Decimal/rounding/minimum-UTxO and observed settlement evidence incomplete for a deployed profile |

## 6. Adversarial omission candidates

These are attack classes to try to falsify completeness, not claims that a live on-chain instance was observed.

1. **Additional right-bearing token/state:** an NFT/datum or application record carries a claim/redemption right but is absent from the projection/register; aggregates may agree if the observer and projection both omit it.
2. **Missing canonical class:** supplied rows satisfy internal sums while one class is absent; every authoritative ingestion path must enforce exact domain coverage.
3. **Terminal state lost/replayed:** a claimed/expired ticket remains in an aggregate or disappears without L4/L5 history; aggregate totals cannot distinguish these cases.
4. **Jackpot double count/omission:** an amount may be included as locked Jackpot and again as CAR/future liability; removing it without classification may under-protect.
5. **Future obligation represented only as metric:** mandatory cost is recorded without the matching right classified in L1/L2/L3.
6. **Stale observation with unchanged V3 aggregate:** EEV falls/disqualifies while V3 fields remain unchanged.
7. **Non-atomic sale/funding:** mint/payment/reservation or Jackpot payout legs are split across different observation cuts.
8. **New excluded asset/commitment:** a contract/token enters the real perimeter without a corresponding Env/domain classification.
9. **Entry point bypasses refinement:** lower-level aggregate action executes without the application proof object, despite a sibling refinement module existing.
10. **Optimistic Boolean premise:** `obligationsComplete=true` or `allOmegaSuccessorsInCertifiedKernel=true` lacks source-bound evidence.
11. **A4/L3 mismatch:** realization lacks linked L3 resolution, or L3 resolves without the corresponding A4 event.
12. **Winning payout recomputed:** aggregate Reveal/Claim amount is not bound by itself to immutable ticket payout and identity.
13. **Expiry policy drift:** the expiry used is not the policy/version crystallized at Issue.
14. **Narrowed Ω/Env:** omitted event class makes a finite model appear complete only within an under-declared perimeter. R3 explicitly does not claim coverage outside Env.
15. **Missing history interpreted as absence:** lack of observation is misread as no outstanding right, implying L6 empty.

These are structural failure patterns/open proof obligations found from source reading; this audit did not demonstrate a live on-chain exploit.

## 7. V3 / R1 binding readiness

R1 requires an instantiated `(S, A, Accept, Ω, T, Safe)`, executable `χ`, a witness selector `Wit`, VC2/VC3 proofs, acceptance compatibility VC4, sound Ω/perimeter VC5, and deployment-declared initial state S0 witness VC6, plus implementation conformance. The aggregate transition, projection and caller Booleans do not themselves provide these artifacts.

R3 requires declared Env, exclusions, event boundary conditions, `Real_Env ⊆ Ω` successor containment, residual-risk statement, discovery failure path, and P1–P8 evidence. A finite test of selected cases is not a universal over-approximation proof.

## 8. Governance / authoritative evidence needed

1. **R7 classification:** authoritative classification and disjointness semantics for SafetyCapital, ReserveProtection, MandatoryFutureCosts and locked Jackpot, reconciled to `PC_R7=L1+L2+worstcase_Ω(L3)`. No assumption is made whether any add-on is a distinct obligation, duplicates an existing cell, is outside PC, or is another abstraction requiring equivalence proof.
2. **CAR applicability:** authoritative rule for whether/how L2 is instantiated and the transitions that produce it.
3. **Closed right/content universe:** canonical definition of profile-created rights, assets, contracts, datums, currencies, records and history entries that can affect execution, plus reproducible extraction from authoritative adapter/ledger boundaries.
4. **Transition coverage:** authoritative map from executable entry points and environmental deltas (including stale/verify/realise) to canonical T, with proof admitted paths enforce the respective refinement.
5. **Ω package:** deployment-bound Env P1–P8 with exclusions, sound abstraction, residual risks and fail-closed discovery response.
6. **Live EEV/S0 and binding:** EV1–EV7, exact qualified PrizePool UTxO observation, authenticated source/derivation references, S0 provenance and concrete Accept/adapter binding to deployed code. Source hashes alone do not authenticate deployment.
7. **Independent PA7:** independent reviewer scope, attacks attempted, findings/counterexamples, source/transition coverage rationale and attestation. This report is not its own independent review.

## 9. Gate status

| Gate | Status | Basis |
|---|---|---|
| PA1 | PARTIAL | Cell ontology/known components recorded; exhaustive profile instantiation absent |
| **PA2** | **OPEN** | No authoritative complete enumeration of all economic content with exact-once cell mapping |
| PA3 | OPEN | A4↔L3 pairing/disjointness proof absent |
| PA4 | OPEN | Full per-cell valuation and Ω-worst-case L3 not discharged |
| PA5 | OPEN | Every actual execution path not proved to preserve R7 deltas |
| PA6 | OPEN | L6 not proved empty in every executable state |
| **PA7** | **OPEN** | No independently attested adversarial omission review |
| R1/R7 | OPEN | R1 E1–E8 and R7 PA1–PA7 not evidenced for deployment |
| V3 binding readiness | **NOT READY** | Aggregate action space/refinement, authoritative Accept/Ω/EEV/S0 and PC add-on classification unresolved |

## 10. Reproduction and explicit limits

The branch's existing CI executes:

```sh
node scripts/check-r1-canonical-source.mjs
node scripts/check-v3-universal-projection.mjs
node scripts/check-r1-economic-inventory.mjs
node --test test/check-r1-finite-certificate.test.mjs test/check-r1-canonical-source.test.mjs test/check-v3-universal-projection.test.mjs test/check-r1-economic-inventory.test.mjs
```

Run #25 passed on SHA `279ee036fcfafcbd3a360070d01f15b78bc82675`, but that run establishes only mechanical checks and 48/48 bounded Node tests. No local test, Haskell/Cabal build, formal proof-assistant run, adapter end-to-end test, live observation, deployment-authenticity check or on-chain S0 was performed as part of this audit.

**Conclusion:** the next blocker is not another registry row. It is an authoritative closed universe of economic rights and transition entry points, followed by normative classification of PC add-ons, deployment-bound Ω/EEV/S0 evidence, and genuinely independent PA7 review. Keep the gates open until these artifacts exist.


## 11. Supplemental authorized-branch entry-point trace — 2026-10-18

This section extends the same audit artifact with additional direct path tracing after the original commit. It does not change the verdict or claim complete call-graph closure.

### Exact runtime and call-site sources read

The following current-branch sources were inspected directly:

| Path | Blob SHA | Observed role | Trace result |
|---|---|---|---|
| `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` | `67ba372b5f1357b02c73a5f45e6107011b1ce9ed` | Common Cardano sign/submit adapter | `submitEconomic` validates an admission witness then calls the infrastructure submit method; infrastructure submit itself performs `signTx` and `submitTx`. |
| `Adapter/CARDANO/runtime/EconomicAdmission.ts` | `38b73a608639e9bc1426b21766e9a0b69040ddf9` | Runtime admission witness validator | Checks witness shape, action class, pre/post/action digests, source input set, authenticated Pool reference/value correlation and observed liquidity amount. It does not independently recompute economic state, derive EEV, or prove Ω. |
| `src/txHelpers.ts` | `9a335b507a41cc5c5ba00567f2ee57e03da02f42` | Generic and economic submission helpers | `signAndSubmitTx` uses `submitInfrastructure`; `signAndSubmitEconomicTx` uses `submitEconomic`. The helper surface itself remains callable by application modules. |
| `src/mint.ts` | `d1642d233e4fddf0ce17b5a0c4c19b7e9e93e099` | Issue transaction construction | The inspected flow builds Counter spend, ticket mint, B1 PrizePool reservation/continuation, Treasury payment, pending PrizeDatum and ticket delivery in one candidate transaction; submission calls `submitEconomic(..., 'Issue')`. It requires a supplied admission witness and issuance-expiry inputs. |
| `src/gameFlow.ts` | `8afabe9f2f2b29eaa76abc5e49e2dc3ef53ba966` | SyncBeacon + Reveal/Claim/Expire | Exported canonical economic orchestrators are `revealPrize`, `claimPrize`, `expirePrize`; direct submission call-sites for those actions use `signAndSubmitEconomicTx` with their respective action class. `syncBeacon` uses generic `signAndSubmitTx`, consistent with its Beacon/registry support role rather than direct liability settlement. |
| `src/claim.ts` | `3efb4b3168613e69e73de4b420194ec3a70f4a9d` | Claim UI compatibility wrapper | Requires a non-empty exact settlement value and supplied admission; delegates to canonical `gameFlow.claimPrize`. |
| `src/claimFlow.ts` | `ebf13f88de7494b675b11292c06164892e3ae93e` | Legacy Claim facade | Requires settlement value and admission; delegates to canonical Claim; has no fixed-quantity fallback. |
| `src/registryFlow.ts` | `42be0fec8c3d75d7a567bfea31c4e716234513d7` | Beacon registry publisher | Publishes a ready Beacon through the generic infrastructure helper; it is not itself proof that economics are admitted. |
| `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts` | `a73f343ad12186e3d5fc7f31802b4202c899f29f` | Admission ↔ canonical evidence binding | Compares action, pre-state and post-state fingerprints; the module explicitly does not compute economic truth or fingerprints. |
| `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts` | `4c5f81a76edb14dbcf59412c6b0500c749264883` | Evidence packet structure | Validates non-empty fields, digest syntax and transaction ref; schema validation does not prove that the evidence is true or corresponds to deployed code. |
| `Adapter/CARDANO/observation/CardanoObservedTransitionEvidence.ts` | `87721fe1bc2abc98ba129c7dd13af7bc0707e624` | Observed transition packet | Records observed pre/post UTxO fingerprints and transaction refs; it explicitly distinguishes these from canonical V3-state fingerprints. |

### What the existing path guards really establish

`src/__tests__/rf8-submission-boundary.test.ts` (blob `f741dc01bad30466d469ed333c33bfce772086ba`) recursively scans TypeScript files under `src/` for direct `.signTx()` / `.submitTx()` calls, permits the shared `src/txHelpers.ts` boundary, and checks known Mint/Reveal/Claim/Expire orchestrators for use of the economic submission path.

This is meaningful evidence for that declared scan root and those expected call-sites. It is not a whole-repository call-graph proof: it does not scan all relevant roots such as `relayer/`, `audit/`, `plutus/`, scripts or generated/runtime entry points; it also does not prove that a transaction passed to `submitEconomic` was computed from the witness's fingerprints, nor that every external invocation of the adapter uses that entry point. A second script named `scripts/check-economic-mutator-surface.mjs` and a broader RF8 source checker were found in the read-only commit `765af53acec61746af0dc9117db93bbe8bbffe77`, but those files are not present in the authorized branch's `scripts/` directory at this audit head and have not been counted as active gate coverage.

The existing `EconomicAdmission.test.ts` exercises missing/malformed admission, mismatched action class, input/source mismatch, liquidity overstatement, duplicate UTxO observation, freshness and Pool-reference/value mismatch. These are useful negative cases for the helper contracts. They are not proof that all production transaction constructors have been identified or that an admission witness originates in an authoritative economic producer.

### Reproducible omission counterexamples (scope-bounded)

1. **Scan-root omission:** the test's enumerator is rooted at `src/`; an additional direct signer/submission call inserted under a different production root would not be visited by that particular test. This is a control-scope counterexample, not evidence that a current live economic mutation presently bypasses the adapter.
2. **Admission witness non-derivation:** the adapter witness validator accepts a structurally valid `admitted: true` object if its fields and associated observed liquidity satisfy local checks. It does not recompute `Accept`, `ProtectedCapital`, `T`, or `Ω`. Therefore the existence of the runtime witness schema is not itself proof that an authoritative producer generated the witness. The repository's own PRE-RICH Issue provenance records the authoritative Issue producer boundary as an open item; until that producer and its evidence binding are proved, tests that construct sample witnesses remain synthetic.
3. **Transition packet binding limit:** canonical evidence binding checks equal fingerprints and action class, while observed Cardano evidence fingerprints UTxOs/datums separately from canonical V3-state identity. No source read here proves a universal refinement relation `ρ` linking every committed transaction to exactly one canonical `T(S,a,ω)`.
4. **Environmental delta omission:** V3 `Issue/Reveal/Claim/Expire` do not encode the R7 `stale/verify/realise` deltas; the EEV observation/freshness boundary can change admissibility with unchanged V3 aggregate state. The R3 worksheet's thirteen elements all remain OPEN for the concrete profile.

### Normative basis for the blocker (not an invented requirement)

The gap is already specified by the controlling normative sources:
- Constitution `docs/00-normative/01_CONSTITUTION_FINAL.md` §6: Ω completeness relative to declared perimeter E is a profile/adapter admission obligation, not a theorem.
- `docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md` §§2, 4, 8: defines successor containment, requires the 13 contract elements, and forbids using the Ω completeness claim as its own evidence.
- `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md` §§1–3: every committed action must satisfy `Accept`, be related to canonical `T), stay inside Ω/Kc, and commit atomically.
- `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md` C5b/C18: every committed implementation step must relate to exactly one canonical transition; no unrelated committed step is permitted.
- `docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` PA2/PA7: the profile must enumerate all created economic content exactly once and undergo an adversarial omission review.

These sources provide the closure obligation, not the missing profile-specific universe itself. No current normative file establishes a closed manifest of every code path, event class, asset/right schema and transition origin for this deployed PRE-RICH profile.

### Updated conclusion

The current branch can establish a **bounded application submission path map** for Issue/Reveal/Claim/Expire and identify several adapter/evidence seams. It cannot derive an authoritative exhaustive production entry-point universe from a complete normative manifest, and it cannot prove Ω, EEV/Accept authority, complete ticket universe, L6 emptiness, or V3-to-ledger refinement universally. No code/test modification is justified without first authorizing and binding the missing profile/domain contract. PA2 and PA7 remain OPEN; C14, C17, C5b/C18, R1 E1–E8 and R7 PA1–PA7 remain not discharged.


## 12. Minimum falsifiable closure plan and authority register — 2026-10-18

This section records additional direct reads from the authorized branch and converts the identified gaps into an ordered evidence plan. It does not change normative rules, claim profile completeness, or treat this audit as PA7.

### 12.1 Authority register: what exists and what it authorizes

The blob SHAs below are the current authorized-branch file blobs read during this pass. “Normative” means the file explicitly declares that status; the GitHub read establishes content and location, not separate cryptographic proof of governance approval or deployment binding.

| Source | Blob SHA | Declared authority/status | What it authorizes | What it does not establish |
|---|---|---|---|---|
| `docs/00-normative/01_CONSTITUTION_FINAL.md` | `744357df17bd07972dcbeeadbd752fb2e740e196` | Normative, root authority, v3.0.0 | Ω is complete only relative to declared perimeter E; live viability needs deployment-bound S0 ∈ Kc; implementation conformance is not a theorem. | PRE-RICH's concrete E, S0, Kc, or approval provenance. |
| `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md` | `a549e35855509aa32ce6462d638aa17d54cd1e6a` | Normative, v3.0.0 | Accept requires complete, verified, fresh authoritative inputs and exhaustive obligation/exposure accounting; accepted transitions use authoritative Ω or sound over-approximation; coupled deltas commit atomically. | The concrete PRE-RICH event domain, action inventory, or evidence of each committed transaction's refinement. |
| `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md` | `269dd421aaeebdb9b9176d7d0957914976bb77f8` | Normative, v3.0.0 | C5b/C-EXEC, C14 Ω, C15 S0, C17 partition, C18 exactly-one canonical transition refinement. | That the current deployment satisfies those obligations. |
| `docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md` | `1543ee6b0de15f491eddb872fb6f7d6df7a5f7f3` | Normative, v3.0.0 | Ω completeness relative to E; thirteen required contract elements; authority, event domain, actor independence, adversaries, repetition, correlation, timing, concurrency, liquidity/oracle failures, boundary, unknown events, failure behaviour; anti-circularity. | That a real PRE-RICH Env exists or covers real permitted events. |
| `docs/02-certification/OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md` | `17a30c6db680987c615ee334d6cf0cb2adbc5db0` | Normative, certification layer, v3.0.0 | P1–P8 evidence package; containment rather than equality; fail-closed options on discovery; explicit statement that no document can prove Env matches the whole world. | Any actual deployment P1–P8 package; real-adapter conformance is explicitly not discharged here. |
| `docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` | `9ebe7c55fb5de26aa9c8e1d0f17e466c91855c3e` | Normative, certification layer, v3.0.0 | PC1–PC7; A1–A5/L1–L6 semantics; A4↔L3 contingency link; separate ℌ; permitted deltas; conditional conservation; PA1–PA7 profile obligations. | Exhaustiveness of the PRE-RICH content universe. It explicitly says profile exhaustiveness requires PA1–PA7. |
| `docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md` | `882fe7c64166ca1e394bf6e96bec9ebf90f7e6f8` | Audit record, v3.0.0 | Records missing artifacts: R2 lacks RF1–RF11 deployment evidence, R3 lacks real Env/P1–P8, R7 lacks PA2 and PA7, R1/R9 lack profile/deployment evidence. | A normative substitute, an approved profile manifest, or proof any obligation has since been discharged. |
| `docs/01-formal-records/10_FINAL_AUDIT_CLOSURE_MATRIX.md` | `aef619695dda73599a9eb67e0195388e44913f68` | Audit record, v3.0.0 | Separates model proof from deployment conformance; R2 not dischargeable from theory alone, R3 instance partial, R7 partial. | Runtime or on-chain conformance. |
| `docs/01-formal-records/08_FORMAL_PROOF_REGISTER_FINAL.md` | `3cda86558f5a70950fbc52e2354d3970d7eb22e6` | Proof register, v3.0.0 | Labels T8 as conditional on implementation evidence; T10/P1–P8 as profile/adapter obligation; PC1–PC7/PA1–PA7 as profile obligation. | An instantiated proof or authenticated evidence for this deployment. |
| This audit | `c00ab943f575d355f2e24a315e1347aef4119226` | Audit record | Existing source-to-transition findings and bounded path evidence. | Independent review or exhaustive source closure. |

**Authority finding:** the repository contains normative general rules for the accounting partition and Ω contract. The missing authority is not another generic theorem. It is the *approved PRE-RICH profile instantiation*: the closed economic-content and event domain, the procedure for discovering/classifying new content, and its binding to the actual implementation and deployment. No authorized profile manifest or governance decision was found in the files inspected that completes those items. A file's “Normative” label alone does not identify the authorized decision-maker or prove that a new profile decision has been approved.

### 12.2 Explicit unresolved normative decisions (do not infer)

1. **Closed economic-content universe:** approve the complete PRE-RICH classes of assets, economic rights, commitments/future obligations, ticket states, event types, and historical facts; define the classification rule for an element not yet enumerated; and define how the inventory is extracted from all protocol/application entry points and ledger state. This is the missing authority required by PA1/PA2 and C17.
2. **CAR applicability:** R7 normatively defines L2 as CAR, and the canonical transition spec requires atomicity for any affected CAR component. The unresolved question is whether/how CAR is instantiated by this PRE-RICH profile and which concrete content is in its scope. Do not infer “not applicable” from the absence of a runtime field, nor map it to another cell by analogy.
3. **Additional protected fields:** assign `SafetyCapital`, `ReserveProtection`, `MandatoryFutureCosts`, Jackpot-related amounts, and other observed fields to canonical economic content/cells only where an approved profile rule establishes their identity, disjointness, valuation and transition effects. Implementation names are not an authority for cell classification.
4. **A4↔L3 and ℌ:** specify the identity key and paired atomic transition evidence linking each contingent asset to its unresolved exposure; specify historical monotone facts recorded in ℌ and prove disjointness from current assets and commitments.
5. **L6 emptiness:** define the authoritative inventory/extraction and rejection procedure that makes an unrepresented commitment block execution, then demonstrate it on every executable transition path. Conservation over already-recorded cells is insufficient (T-CONS-GAP).
6. **Env/Ω/S0/deployment binding:** declare Env and exclusions, the authoritative Ω producer, P1–P8, abstraction over-approximation if applicable, discovery/fail-closed and recertification rules, real S0 ∈ Kc, and exact deployment/version/address references. The authority to approve the profile declaration must be identified through an existing authorized governance process; no specific actor or approved decision was established by this source review.
7. **PA7 independence:** identify a reviewer/process independent of the author of the domain inventory and evidence packet, with a reproducible review record and explicit unresolved findings. This audit cannot self-certify PA7 by writing this section.

These are blockers, not invitations to invent decisions in code. The general normative documents establish the requirements and evidence shape; they do not silently instantiate PRE-RICH.

### 12.3 Ordered minimum closure sequence

The sequence below is dependency-ordered, not a new normative priority system.

| Step | Required artifact/action | Falsifiable acceptance condition | Gate effect if absent |
|---|---|---|---|
| 0 | Identify the existing authorized profile/governance approval process and approved PRE-RICH profile decision, or obtain that decision through the authorized process. | An independently identifiable approved decision fixes profile scope and authority; proposed material is not treated as approved. | PA2/PA7 remain BLOCKED by authority. |
| 1 | Publish the profile's closed economic-content inventory and extraction/classification procedure (PA1/PA2). | Each discovered asset/right/commitment/event/ticket state/history item maps to exactly one authorized class/cell or is explicitly rejected as outside the approved perimeter; unknown classes cannot silently pass. | PA2 and C17 remain OPEN. |
| 2 | Resolve CAR applicability, add-on field classification, A4↔L3 identity/pairing, ℌ disjointness, expiry/settlement/history and L6 enforcement in the approved profile. | PA3/PA5/PA6 can be traced to approved definitions and executable rejection/transition behavior; no analogy-only mapping. | R7 PA3/PA5/PA6 remain OPEN; do not use conservation as a substitute. |
| 3 | Derive a complete source-to-transition inventory from the repository's actual tree and executable surfaces, not from a hand-maintained list alone; include app, adapter, scripts, relayer, validators, generated artifacts, CI/runtime entry points and externally callable submission interfaces that actually exist. | A reproducible scanner/inventory has declared roots and exclusions; every economic submit/mutator resolves to a single canonical action and exactly one T transition under ρ, or is shown non-economic with evidence. RF1–RF11 and C5b/C18 are reconciled. | R2, C5b/C18 remain OPEN. Existing RF8 scan is bounded to `src/`. |
| 4 | Bind the approved profile to real deployment evidence: EEV EV1–EV7, authoritative B1 PrizePool UTxO and canonical USDM identity, freshness/snapshot slot, S0, Kc certificate E1–E8, Env/Ω P1–P8, contract/version/address/transaction references. | Independent reproduction reaches the same verified source facts from the referenced deployment; hashes/fingerprints are checked as integrity links, not treated as truth/authenticity by themselves. | R1/R3/R8/R9 and C14/C15/C16 remain OPEN or BLOCKED as applicable. |
| 5 | Only after Steps 0–4, implement minimum automatic controls justified by the approved profile: full-root mutation-boundary scan, exact transition mapping/refinement checks, class-universe coverage, L6 fail-closed regressions and omission mutations. | Deliberately injected unclassified rights, unpaired A4/L3, bypass submitter, missing refinement, wrong-ticket terminal settlement, narrowed Ω and false provenance each fail for the specific authorized reason; existing tests remain intact. | Static tests remain bounded evidence, not closure. |
| 6 | Complete PA1–PA6 evidence and submit the packet to a separate reviewer for PA7. | Reviewer can reproduce the inventory and challenge omissions; review outcome, dissent, exceptions and residual risks are recorded. | PA7 remains OPEN until actual independent review occurs. |

### 12.4 Adversarial falsification matrix

These are proposed falsification experiments, not findings of live exploits. Do not add implementation tests for a proposed classification until the corresponding profile rule is approved.

| Hypothesis being challenged | Counterexample / reproducible mutation | Expected evidence if the control is valid | Current status |
|---|---|---|---|
| Every economic right is classified | Add a new right-bearing NFT/datum field or class row without updating the approved universe. | Inventory extraction detects it; admission rejects or requires approved reclassification; PA2 review records the outcome. | NOT RUN — no approved exhaustive profile inventory. |
| Every commitment is represented | Add an obligation X while leaving all recorded cells and their deltas unchanged. | PC2/L6 check rejects; a conservation-only check is expected to pass and therefore is not accepted as the control. | OPEN — T-CONS-GAP is proved; profile detector not evidenced. |
| Every mutator uses one economic boundary | Place a direct signer/submitter in a production root outside `src/`, or call the adapter without the economic path. | Full-root scan and runtime/API boundary test fail with a path and symbol; exceptions require an explicit normative non-economic classification. | PARTIAL — current RF8 scan covers `src/` only. |
| Each committed step refines exactly one T | Produce a transaction/evidence pair with matching caller-supplied fingerprints but no derivation to canonical pre/post state. | Refinement verifier fails despite matching hashes; each accepted ledger step has one and only one T witness. | NOT RUN — current fingerprint binding does not prove truth/refinement. |
| Terminal state belongs to the correct ticket | Replay a Claim/Expire/settlement datum against another ticket identity or repeat a terminal action. | Ticket identity, owner/rights, expiry finality and exactly-once settlement checks reject the mutation. | PARTIAL — refinement modules exist; universal call-path invocation is not established. |
| Ω covers all events admitted by Env | Remove a permitted event class or correlated combination from Ω while leaving the Env declaration unchanged. | P1–P5/abstraction evidence detects under-approximation or admission fails; unknown event follows the approved fail-closed procedure. | NOT RUN — no real PRE-RICH P1–P8 package. |
| Evidence provenance is authentic | Replace a source reference, deployment address, snapshot slot or producer identity while retaining a syntactically valid digest/fingerprint. | Verification resolves the reference to the authoritative source and checks signature/identity/slot/version bindings; schema validation alone fails to satisfy the test. | NOT RUN — no complete deployment-bound evidence packet reviewed here. |

### 12.5 Verification performed in this pass

- Re-read the authorized branch's Constitution, State Transition Specification, Conformance Specification, Ω contract, R3 perimeter specification, R7 accounting certification, Residual Obligation Register, Closure Matrix and Formal Proof Register. Blob SHAs are recorded in §12.1.
- Compared the authorized branch to the previous HEAD: branch is identical to `f5de317e0a9158dc1aac4883312414608e22187f`; compared with `eedf13e7afbcb996d8d2aeec531a078637613047`, it is ahead by one commit and that commit modifies only this audit report (+53/−0 before this addendum).
- Queried combined commit status for `f5de317e…` and `eedf13e…`; both returned empty status arrays. Queried the connector's commit-associated workflow-run endpoint for both; it returned no runs. That endpoint is documented as PR-triggered-only, so this does not establish that no Actions run exists. No CI pass for the current SHA is established by these responses.
- No build, local test, formal proof-assistant execution, deployment observation, live UTxO verification, on-chain transaction or manual workflow dispatch was performed in this pass.

### 12.6 Status after this addendum

| Gate / property | Status | Reason |
|---|---|---|
| Normative general accounting rules PC1–PC7 and T-CONS-GAP | VERIFIED | Normative definitions and the omission theorem are present in R7; the theorem remains conditional on profile obligations. |
| PRE-RICH economic universe / PA2 | BLOCKED | No approved exhaustive profile inventory/classification procedure found. |
| Independent PA7 | BLOCKED | Requires the approved inventory and a separate reviewer; neither can be replaced by this audit. |
| R7 as a whole | PARTIAL | General accounting semantics exist; profile instantiation, PA2/PA7 and related PA evidence remain outstanding. |
| R3 / Ω for real PRE-RICH Env | BLOCKED | General contract and P1–P8 schema exist; real Env and deployment evidence do not. |
| R1 / certified Kc | BLOCKED | Concrete profile certificate E1–E8 not evidenced here. |
| C5b/C18 / execution refinement | PARTIAL | Application paths are mapped in bounded scope; complete source universe and per-commit canonical refinement are not proved. |
| EEV / S0 / live deployment binding | BLOCKED | No complete authoritative EV1–EV7 + S0 + deployment-bound evidence packet verified here. |
| Independent review package | PARTIAL | This report provides reproducible source references and falsification plan; it is not the independent review outcome. |

**Stop condition:** the next required step is not another code-level guess or a self-declared manifest. It is an identifiable authorized PRE-RICH profile/governance decision covering the economic universe, CAR applicability and classification procedure. Until that exists, do not invent mappings or claim PA2/PA7 closure. Once approved, the subsequent technical inventory, deployment evidence and independent PA7 review can proceed without changing V3/Issue/Reveal/Claim/Expire semantics.


## 13. Supplemental profile-authority verification — 2026-10-18

A second targeted read found an important qualification to §12: the current authorized branch does contain a normative PRE-RICH application economics baseline. The blocker is therefore **not** “there is no PRE-RICH policy.” The narrower, still-blocking gap is that this application baseline is not a complete R7 accounting-cell inventory and does not identify a separately authorized approval process for that inventory.

### 13.1 Additional current-branch sources

| Source | Blob SHA on authorized branch | Declared status | Result |
|---|---|---|---|
| `PRE-RICH/docs/GAME-ECONOMY.md` | `3431169896aea420e7f8bff3c1932abed2c358ac` | “normative PRE-RICH application economic specification”; semantic status “CLOSED application baseline” | VERIFIED as the application-policy authority for its stated rules: Classic-6, ticket ladder, 500× normal payout cap, class contraction, Jackpot activation/funding/payout, settlement value preservation, ticket identity/transfer, single-use claim and final expiry mechanism. It is not a PA1/PA2 exhaustive mapping of every asset/right/commitment/event to exactly one R7 cell. |
| `docs/01-formal-records/09_DECISION_REGISTER_FINAL.md` | `fed7e54483e9ce328da69a4e41cae1dd3d4a3792` | Decision record, v3.0.0 | Explicitly carries forward CAR as the universal “Conditional Allocation Reserve” abstraction and says no governance mechanism is specified (who may upgrade/how is profile-scoped). It does not resolve which concrete PRE-RICH balance/commitment, if any, instantiates CAR for R7 L2 or who approves a new R7 inventory. |
| `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` | `04c79bc3d5397e70668de547e14bf4801fa358ce` | Normative, v3.0.0 | Defines CAR as a universal abstraction for value conditionally committed to a future allocation; Jackpot is application-specific terminology. CAR is included in ProtectedCapital when the applicable protection predicate says so. This does not itself map Jackpot to CAR. |
| `IMMORTAL/state/EconomicProfile.hs` | `e4eccd67bec97543b802aa15ff1b2719c9c18bde` | Implementation | Defines profile version, class prices and maximum normal payout multiplier. It is a typed parameter record, not an exhaustive inventory of economic rights, liabilities, event classes or R7 cells. |
| `IMMORTAL/state/STATE-FIELD-OWNERSHIP.md` | `af6fd3cf0f904b1e45aa58e6b464797b4a3fed8c` | Explicitly non-normative implementation/conformance boundary; document metadata names another branch | Useful for locating fields and their claimed ownership, but not authority for normative R7 classification or profile approval. |
| `docs/02-certification/REFINEMENT_CONFORMANCE_SPECIFICATION.md` | `163fa6a1e38c81f8e629a34ad1dd545459cb5d17` | Normative, certification layer, v3.0.0 | RF2 requires every implementation operation that can commit to map to a canonical action; RF8 requires a whole-program enumeration of every state-mutating path. It explicitly rejects sample-only coverage. |

### 13.2 What the application authority closes — and what it does not

The current `GAME-ECONOMY.md` does settle multiple PRE-RICH semantic decisions. Those closed decisions must be treated as authoritative and must not be reopened merely because implementation/conformance work remains. In particular, the baseline includes the Classic-6 two-row mechanism, ticket-level payout derived from row results and capped at 500×P, deterministic state-derived Jackpot activation/funding, full locked-balance Jackpot payout exactly once, immutable crystallized payouts, ticket transfer/identity, single-use claims and final expiry semantics. The exact expiry number remains a deployment/application parameter.

However, the following distinction remains mandatory:

- **Application-policy closure:** the named mechanics and lifecycle rules in `GAME-ECONOMY.md` are the current PRE-RICH semantic baseline.
- **R7 partition closure:** every economic content item created, held, promised, settled, expired or historically retained by those mechanics must still be classified under PC1–PC7 and mapped to exactly one applicable cell, except the declared A4↔L3 contingency relation.
- **Deployment conformance:** actual UTxOs, datums, assets, rights and transitions must be tied to that classification and the live deployment.

The first does not imply the second or third.

### 13.3 CAR and protected-field decision boundary

The normative sources establish CAR as a universal abstraction and L2 as the corresponding class of conditionally committed value. They do **not** establish that PRE-RICH's Jackpot balance, Jackpot funding gap, unresolved-ticket reserve, SafetyCapital, ReserveProtection or MandatoryFutureCosts is identical to CAR. `GAME-ECONOMY.md` describes those PRE-RICH quantities and rules, while `STATE-FIELD-OWNERSHIP.md` is explicitly non-normative and cannot authorize a cell assignment.

Therefore the required decision is now precise: **approve the mapping, disjointness and valuation of each concrete PRE-RICH protected quantity to R7's canonical cells (including whether any quantity instantiates CAR/L2), and identify the existing authority/process that approves this profile-level accounting classification.** No code comment, field name, existing projection or successful solvency test can substitute for that decision.

### 13.4 Repository search limitations and source provenance

The GitHub code-search index returned several hits anchored to commit `765af53acec61746af0dc9117db93bbe8bbffe77`, which is not the authorized branch HEAD. Those hits were not treated as current-branch evidence. Paths from that search that returned 404 when fetched at the authorized branch were excluded as unavailable in the current branch. The sources listed in §13.1 were fetched directly from `release/public-main-curated-2026-09-24` and have current-branch blob SHAs.

This is a targeted source review, not a proof that every repository path or external governance record has been enumerated. No complete approved R7 mapping, profile approval record, real Env/Ω P1–P8 package, deployment-bound S0/Kc evidence or independent PA7 outcome was found in the sources examined.

### 13.5 Revised gate interpretation

| Property | Status | Refined reason |
|---|---|---|
| PRE-RICH application semantic baseline | VERIFIED | The current branch's `GAME-ECONOMY.md` declares a closed normative application baseline. |
| R7 profile cell mapping / PA1–PA2 | BLOCKED | The application baseline does not enumerate all economic content and map every item to R7 cells under PC1–PC3. |
| CAR/L2 instantiation in PRE-RICH | BLOCKED | CAR's universal meaning is normative, but the concrete profile mapping and valuation are not authorized by the inspected sources. |
| Profile approval authority/process | BLOCKED | Decision Register explicitly leaves governance mechanism profile-scoped and does not identify an approved process/decision for this accounting inventory. |
| PA7 | BLOCKED | Independent omission review must follow the authoritative inventory; this audit is not the independent reviewer. |
| RF2/RF8 whole-program transition coverage | OPEN | Normative requirement is explicit; complete whole-program inventory and conformance evidence remain absent. |

**Next stop condition:** do not ask for a generic new PRE-RICH policy or reopen already closed game mechanics. The minimum missing decision is a profile-level **R7 accounting instantiation and approval authority** for the existing closed application baseline. Once an existing authorized process is identified and that mapping is approved, the technical work can resume with field-by-field inventory, path coverage, deployment evidence and independent PA7 review.


## 14. Whole-program transition inventory — supplemental direct-path pass, 2026-10-18

### 14.1 Remote scope and method

At the start of this pass, GitHub comparison returned `identical` for base commit `07639d93afc1b4162483c66ff723552fb236bea1` and the authorized branch ref. Comparing the branch with `eedf13e7afbcb996d8d2aeec531a078637613047` returned `ahead_by=3`, `behind_by=0`; the only changed path is this audit document (193 additions, 0 deletions at that comparison). This verifies the ref-to-commit relationship through GitHub's compare endpoint, not a local working tree. No local checkout or complete repository tree enumeration API was available in this pass. Therefore the following is an expanded, source-backed inventory of directly fetched paths, not a claim that every path in the repository has been enumerated.

The GitHub code-search index returned hits at commit `765af53acec61746af0dc9117db93bbe8bbffe77`, which is not the authorized branch HEAD. Those hits were treated only as discovery leads. The following key paths were fetched explicitly at `release/public-main-curated-2026-09-24`; missing paths were excluded as active source evidence.

### 14.2 Directly verified surfaces

| Surface / blob SHA | Entry point and state/effect | Canonical transition mapping | Enforcement and tests/evidence | Gap / certainty |
|---|---|---|---|---|
| `IMMORTAL/kernel/EconomicTransitionV3.hs` — `62c2980a821cdcfc33a33e15a09617256ab8753c` | Pure transition function over aggregate V3 state; constructors are `Issue TicketClass Integer`, `Reveal TicketClass Integer`, `Claim Integer`, `Expire TicketClass`. | Direct mapping exists for the four aggregate V3 actions only. | `transitionValid` checks structural pre/post state, nonnegative fields and monotonic class history. | The action payloads do not identify a concrete ticket for Claim/Expire and do not encode R7's separate stale/verify/realise deltas. Aggregate transition typing does not prove ledger-level refinement. **Direct source fact; whole-program coverage unproven.** |
| `PRE-RICH/profile/PreRichEconomicAdmission.hs` — `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a` | Admission function accepts supplied EEV, liquidity and Boolean premises `truthVerified`, `eevFresh`, `obligationsComplete`, `allOmegaSuccessorsInCertifiedKernel`. | Wraps structural V3 transition, projects candidate state, then invokes the economic gate. | Fails closed on several missing/inconsistent states within the function. | The function's signature receives truth/freshness/completeness/Ω assertions as arguments; this module alone does not derive those claims from authoritative sources or enumerate the economic universe. **Direct source fact; caller provenance unresolved.** |
| `PRE-RICH/profile/PreRichEconomicProjection.hs` — `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13` | Folds supplied class rows to derive aggregate exposure/reserve/count values. | Projection of V3 aggregate state into the universal model; not itself a committed ledger action. | Rejects duplicate/unknown classes and invalid/nonnegative field constraints; the fold's empty-list base case returns zero totals. | The fold does not by itself prove that every authoritative profile class/right is supplied exactly once. Any separate exact-domain check only helps if every admission/deployment path invokes it. **Direct source fact; caller coverage unresolved.** |
| `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` — `67ba372b5f1357b02c73a5f45e6107011b1ce9ed` | `submitInfrastructure` signs and submits; `submitEconomic` validates an admission witness and then delegates to infrastructure submission. | Economic actions are labelled Issue/Reveal/Claim/Expire at this boundary; generic infrastructure submission is a separate route. | `EconomicAdmission.ts` — `38b73a608639e9bc1426b21766e9a0b69040ddf9` validates witness shape, action class, digest formats, source input set and Pool/value correlation. | Witness validation does not independently recompute EEV, ProtectedCapital, Accept, canonical T or Ω; equality/format of caller-supplied fingerprints is not a derivation proof. **Direct source fact.** |
| `src/txHelpers.ts` — `9a335b507a41cc5c5ba00567f2ee57e03da02f42`; `src/mint.ts` — `d1642d233e4fddf0ce17b5a0c4c19b7e9e93e099`; `src/gameFlow.ts` — `8afabe9f2f2b29eaa76abc5e49e2dc3ef53ba966` | App submission helper; Issue constructor; Reveal/Claim/Expire orchestrators. | Issue uses `submitEconomic(..., 'Issue')`; Reveal/Claim/Expire use `signAndSubmitEconomicTx` with action-specific labels. `syncBeacon` uses generic infrastructure submission. | `src/__tests__/rf8-submission-boundary.test.ts` — `f741dc01bad30466d469ed333c33bfce772086ba` scans TypeScript under `src/` for direct `signTx`/`submitTx` calls and checks known orchestrators. | The test's root is `src/`, not the whole repository. It establishes a bounded scan and selected call-site expectations, not an exhaustive whole-program call graph or authoritative witness production. **Test source inspected; test execution not performed in this pass.** |
| `src/claimFlow.ts` — `ebf13f88de7494b675b11292c06164892e3ae93e` | Legacy Claim facade delegates to canonical Claim after requiring exact settlement quantity and an admission witness. | Delegates to canonical `claimPrize`; no fixed-quantity fallback in the inspected facade. | Rejects absent settlement value/admission in its local wrapper. | Does not independently prove correct ticket ownership, canonical admission derivation or that all callers enter this facade. **Direct source fact; caller coverage unresolved.** |
| `src/registryFlow.ts` — `42be0fec8c3d75d7a567bfea31c4e716234513d7`; `relayer/registryPublisher.js` — `97dfe72897ccf56596f2debe25077bcd213c03d4` | App registry publisher and separate relayer function `publishBeacon`; relayer directly calls `lucid.signTx` and `lucid.submitTx`. Registry state moves Pending → Ready after checks on round, game/config/protocol/commitment fields. | Appears to be Beacon/registry support, not one of the four V3 economic actions. Its influence on an authoritative economic input and its canonical classification must be explicit; do not assume it is economically irrelevant solely from its name. | Registry datum and validator checks are present in the application publisher; no whole-program test proving every relayer path is non-economic or bound to a canonical environmental delta was verified here. | Direct submission outside `src/` is confirmed. This is a **scan-root counterexample** to treating the existing `src/` test as whole-program coverage, not proof of a live economic bypass. **Direct source fact; economic classification open.** |
| `audit/cardano-integration/reveal-ledger-trace.ts` — `7c570c249c009422d8bb7793bc24c94eb3e19247`; `audit/cardano-integration/expire-ledger-trace.ts` — `561adc8105a648100bba6d595a25bedca5865262` | Integration/lab scripts construct and submit Reveal/Expire transactions using an adapter port whose `signTx`/`submitTx` callbacks call Lucid directly. They record observed UTxOs, transaction references, and replay outcomes. | Test/observation realization for Reveal/Expire; the scripts use generic `submitInfrastructure` rather than the application `submitEconomic` route. | Both scripts include explicit stale/duplicate replay rejection checks; Expire checks ticket NFT quantity and reserve/liquidity effects. The Reveal script records test-asset valuation and protocol parameters. | These are laboratory traces, not proof of the production orchestrator's authoritative admission path. The test scripts themselves are outside the `src/` scan root; no execution occurred in this pass, and their recorded evidence was not independently re-queried from a running Yaci instance. **Direct source fact; execution/evidence status not verified here.** |
| `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts` — `4c5f81a76edb14dbcf59412c6b0500c749264883`; `EconomicAdmissionTransitionBinding.ts` — `a73f343ad12186e3d5fc7f31802b4202c899f29f`; `CardanoObservedTransitionEvidence.ts` — `87721fe1bc2abc98ba129c7dd13af7bc0707e624` | Evidence schemas validate canonical fingerprints/digest syntax and separately observed UTxO/datums fingerprints. | Binds declared action and fingerprint fields; observed-ledger evidence is not itself the canonical V3 state. | Shape, digest syntax and equality checks exist. | No verified proof in these modules derives each observed ledger transition from exactly one canonical `T(S,a,ω)`; matching fingerprints can be syntactically valid while provenance/derivation remains false or absent. **Direct source fact.** |
| `.github/workflows/cardano-ledger-audit.yml` — `4b9553b365fcf596bc9bd6e404aede456b0c2f77` | A manually dispatchable/push-triggered Cardano ledger audit workflow; includes a `cabal build cardano-ledger-runner` step and a safe-stall check. | Infrastructure/ledger audit workflow, not a declared mapping of every economic app transition to canonical T. | Workflow source was read. | This is only one workflow file found by direct path; the repository tree and all workflow triggers were not exhaustively enumerated. No run was dispatched or verified for this pass. **Workflow source verified; run outcome NOT VERIFIED.** |

### 14.3 Whole-program RF2/RF8 interpretation

- **RF2:** the four constructors in `EconomicTransitionV3.hs` define a bounded aggregate action type, not the set of every operation the deployed program can commit. Each submitter, relayer action, script, validator/minting policy path, adapter environmental update and externally callable transaction constructor must be mapped to a canonical action or explicitly shown not to be an economic transition under the approved profile.
- **RF8:** the existing test scans `src/` only. Direct Lucid submit calls exist in the separately fetched `relayer/registryPublisher.js` and the lab traces under `audit/cardano-integration/`. The latter are test/observation paths; the relayer path is registry publication and requires a source-backed classification. These observations falsify the claim that the existing test alone proves whole-program scan coverage. They do **not**, by themselves, establish a production economic side door.
- The index-discovered scripts `scripts/check-rf8-production-boundary.mjs` and `scripts/check-economic-mutator-surface.mjs` returned 404 when fetched at the authorized branch and are not counted as active controls. Similarly, index hits for `.github/workflows/immortal-cardano-preprod.yml` and `.github/workflows/issue-admission-boundary-ci.yml` returned 404 at this ref. The only directly confirmed workflow in this pass is `.github/workflows/cardano-ledger-audit.yml`; this is not evidence that it is the only workflow.
- No repository tree listing was available through the inspected GitHub actions. Thus this pass cannot certify that all Haskell, TypeScript, Plutus/Aiken, generated, script, workflow, relayer, observer, provider, or external interface paths have been enumerated. A repeatable tree-root enumeration and source-to-transition scanner remain required for RF2/RF8.

### 14.4 Counterexample status matrix

| Counterexample | Current source/test evidence | Enforcement conclusion | Status |
|---|---|---|---|
| 1. Additional NFT/datum carries an unregistered economic right | Projection and bounded registry checks exist; no approved exhaustive right inventory or end-to-end test of unknown right-bearing assets was verified. | No proof that every production admission path detects and rejects or reclassifies it. | **NOT VERIFIED / PA2 BLOCKED** |
| 2. Omitted obligation X while recorded cells still conserve | R7 §6 gives T-CONS-GAP; the theorem itself explains why recorded-cell conservation can still hold. | No universal runtime L6 inventory/enforcement demonstrated. | **THEOREM VERIFIED; PROFILE CONTROL NOT VERIFIED** |
| 3. Submitter outside `src/` | Direct Lucid submission exists in `relayer/registryPublisher.js`; lab trace scripts also call submit outside `src/`. | Existing `src/`-rooted test cannot see these paths. Relayer's economic classification and all other roots remain open. | **SCAN-ROOT LIMIT VERIFIED; LIVE BYPASS NOT ESTABLISHED** |
| 4. Matching fingerprints without canonical derivation | Evidence modules compare digests/fingerprints and explicitly separate observed UTxO fingerprints from canonical V3-state fingerprints. | No universal refinement witness `ρ` from each committed ledger transaction to exactly one `T(S,a,ω)` established. | **GAP VERIFIED; INJECTED COUNTEREXAMPLE NOT RUN** |
| 5. Wrong-ticket Claim/Expire or replay | V3 aggregate `Claim Integer`/`Expire TicketClass` lack ticket identity; Reveal/Expire lab scripts contain replay-rejection assertions and Expire checks ticket NFT quantity. | These lab checks do not prove production Claim/Expire invocation coverage or universal ticket identity binding. | **PARTIAL SOURCE EVIDENCE; TESTS NOT RUN HERE** |
| 6. Ω narrower than Env | Normative Ω contract/R3 requires an Env-relative containment argument and P1–P8; no real PRE-RICH P1–P8 packet verified. | No proof the admitted implementation Ω over-approximates every event admitted by the concrete Env. | **NOT VERIFIED / R3 BLOCKED** |
| 7. Valid digest but false provenance | Evidence schemas check field presence/hex syntax and equality; no independently verified signature/source/deployment/version chain was attached in this pass. | Digest syntax and equality are integrity-format checks, not truth or authenticity proofs. | **NOT VERIFIED / DEPLOYMENT BINDING BLOCKED** |

### 14.5 Runtime, CI, and evidence boundary

- GitHub combined status for `07639d93afc1b4162483c66ff723552fb236bea1` returned an empty `statuses` array. The connector's `fetch_commit_workflow_runs` endpoint returned an empty list and is documented as returning only pull-request-triggered runs. Therefore CI associated with the current commit is **NOT VERIFIED**; an empty response is not evidence that no Actions run exists.
- No local checkout, working-tree status, build, test, formal proof-assistant run, workflow dispatch, Yaci execution, on-chain observation, or independent review was performed in this pass.
- The lab trace source files describe how they would generate evidence artifacts, but their source presence is not evidence that the trace ran now or that its artifacts correspond to the currently deployed code. EV1–EV7, canonical USDM identity and exact qualified B1 PrizePool UTxO, observation slot/freshness, S0, R1/Kc E1–E8, and Env/Ω P1–P8 remain unverified.
- No evidence packet or digest is accepted as proof of truth absent independently checkable source, identity, derivation, version, and deployment bindings.

### 14.6 Updated stop condition and gate status

This pass adds direct evidence of an out-of-`src/` registry relayer submission path and of out-of-`src/` laboratory submission traces. It does not close the whole-program inventory or establish that the relayer is a production economic bypass. The next technical action that could be performed without changing economics is a reproducible full-tree inventory and per-entrypoint call graph. The next **normative** action remains the same blocker: an already authorized process must approve the PRE-RICH R7 content/cell classification and identify the authority/process for that approval. Do not infer CAR/L2 mapping, classify Jackpot by analogy, or treat this audit as PA7.

| Gate | Status after this pass | Basis |
|---|---|---|
| PRE-RICH application policy baseline | **VERIFIED AS DECLARED IN SOURCE** | `PRE-RICH/docs/GAME-ECONOMY.md` is normative and declares the application baseline closed. |
| R7 profile mapping / PA2 | **BLOCKED** | No approved exhaustive content-to-cell mapping or classification authority found in inspected sources. |
| CAR/L2 | **BLOCKED** | Universal CAR/L2 semantics exist; concrete PRE-RICH instantiation remains unapproved/unproven. |
| RF2 | **OPEN** | Aggregate action type mapped; all committed operations not exhaustively enumerated. |
| RF8 | **OPEN** | Bounded `src/` test exists; out-of-root submitters/traces confirmed; whole-program classification/coverage absent. |
| PA7 | **BLOCKED** | Requires independent omission review after approved inventory; this report is not independent review. |
| Env/Ω/S0 | **BLOCKED / NOT VERIFIED** | No real profile-bound Env/P1–P8 or deployment-bound S0 evidence verified. |
| R1/Kc | **BLOCKED / NOT VERIFIED** | No concrete E1–E8 certificate verified in this pass. |
| EV1–EV7 | **NOT VERIFIED** | No complete authenticated deployment-bound evidence packet verified. |
| Build/tests/CI | **NOT VERIFIED FOR THIS HEAD** | No execution was performed; queried status/workflow endpoints returned empty results with documented coverage limits. |



## 15. Owner authority resolution and R7 decision proposal (2026-10-18)

### 15.1 Decision authority for this project phase

The project owner explicitly stated in the current Workflow C session that, because no community or other governance body currently exists, the owner is the sole normative decision authority for IMMORTAL/PRE-RICH at this stage. This resolves the prior question of *who* can approve a profile-level R7 mapping for this phase: the project owner. No committee, quorum, signer set, DAO vote, or external approval path is inferred.

This is an owner instruction recorded by this working audit; it does not alter the universal model or the already-closed PRE-RICH application baseline. Technical analysis can recommend and evidence a mapping; only the owner can approve the proposed profile classification. PA7 remains an independent-review obligation and is not satisfied by owner approval or by this report.

### 15.2 Proposed R7 content-to-cell mapping for owner decision

The following is a **proposal for owner review, not yet an approved profile instantiation**. The classification rule is to map the underlying economic content exactly once, not to map variable names or reserve counters mechanically. Canonical R7 cells and deltas remain those in `docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` (PC1–PC7); PRE-RICH application semantics remain those in `PRE-RICH/docs/GAME-ECONOMY.md`.

| Economic content / source-backed concept | Proposed R7 treatment | Boundary and evidence still required |
|---|---|---|
| Canonical USDM physically present in the exact qualified B1 PrizePool UTxO, verified and fresh | **A1**; included in direct-profile EEV | Exact UTxO, canonical asset identity, observation slot/freshness, deployment binding and EV1–EV7 evidence must be authenticated. Genesis Treasury is not automatically PrizePool liquidity. |
| USDM-convertible or haircut-valued assets | **A2 only if** a declared, supported conversion/haircut valuation is actually in scope | The direct EEV profile excludes ADA/PRE liquidation, oracle-derived conversion, and invented haircuts/slippage. Do not manufacture an A2 value to fill the cell. |
| Present but unverified or stale assets | **A3**, excluded from EEV until verified/fresh | Must distinguish actual stale/unverified holdings from assets outside the direct profile perimeter; a freshness lapse must be bound to the canonical transition/fail-closed path. |
| Asset whose value depends on an unresolved external event | **A4**, excluded from EEV, with its economic contingency represented on the liability side as the paired **L3** exposure | Identify the event, the contingent asset and matching liability-resolution event. No such pair is presumed merely because an external dependency exists. |
| Non-economic/informational holdings | **A5**, excluded from EEV | Do not classify every non-USDM token as A5 merely because it is excluded from this direct EEV profile. An excluded asset may require a different classification if it is stale, contingent, or otherwise economic. |
| Accepted, crystallized/pending winning payout obligation not yet settled | **L1** | The frozen payout/right and pending amount must be bound to the canonical ticket identity and counted exactly once. |
| Unrevealed ticket exposure by class price P and unresolved count N | **L3**, valued by the normative Ω-worst-case; PRE-RICH baseline gives `WorstCaseExposure(P,N) = 500 × P × N` | The Ω envelope must cover the authoritative event perimeter and the complete ticket/class universe. The statistical `UnresolvedReserve(N)` is not a substitute for worst-case L3 and must not be added as a second copy of the same exposure. |
| Funded, locked Jackpot awaiting its conditional future payout | **Candidate for L2/CAR**, because R7 L2 is conditionally committed future allocation and PRE-RICH says Jackpot liquidity is protected/locked until the winning transition | **Owner decision required:** confirm this mapping and its exact boundary against L1 and L3. The application-specific label “Jackpot” is not by itself a universal classification, and the same locked amount must not be counted in multiple cells. |
| Settled obligations | **L4** as a terminal/excluded liability category; no longer included in ProtectedCapital | Require observed, atomic settlement and exactly-once ticket/right evidence. Historical occurrence belongs in ℌ where applicable, not as a live L4 liability amount in ProtectedCapital. |
| Expired rights/obligations | **L5** as a final/excluded liability category; no return path | Require eligibility, identity, finality and replay/non-revival evidence for each right. |
| Any material obligation/right not representable in A/L cells | **L6 counterexample**; the creating action must be non-executable | L6 is not a reserve bucket to price and carry. PC7 requires it empty in every executable state; the current caller-supplied `obligationsComplete` flag does not prove this. |
| Monotone history: issuance/reveal/settlement/expiry/transfer and `HighestClassEverActivated` | **ℌ**, separate from asset/liability cells and never valued in EEV or ProtectedCapital | Complete schema and ledger provenance remain to be proven. Current-state counters must not be confused with historical facts. |

### 15.3 Non-cell implementation aggregates: no automatic addition to ProtectedCapital

The following implementation/application quantities are **not additional R7 cells** and must not be summed into `ProtectedCapital` merely because their names contain “capital”, “reserve”, “cost”, or “Jackpot”:

- `SafetyCapital`
- `ReserveProtection`
- `MandatoryFutureCosts`
- `StatisticalReserve` / `UnresolvedTicketReserve`
- `LockedJackpotLiquidity` as an implementation bucket

Each amount must be traced to the underlying economic rights/commitments it represents and then classified once into L1, L2 or L3 (or shown not to be a commitment covered by R7). A computed buffer or policy guard may remain a separate control variable, but its value cannot be added to the normative R7 sum without proving distinct, non-overlapping protected content. In particular:

```
ProtectedCapital_R7 = value(L1) + value(L2) + value_worstcase_Ω(L3)
RawSurplus          = max(0, EEV - ProtectedCapital_R7)
```

These expressions are unchanged. Statistical reserve remains a distinct statistical risk model and cannot replace deterministic Ω-worst-case exposure. Locked Jackpot liquidity is deducted exactly once in the PRE-RICH EffectivePool invariant; that application-level accounting statement does not, by itself, prove its canonical R7 cell.

### 15.4 Decisions still required from the owner

1. **Confirm or reject Jackpot → L2/CAR** for the funded/locked pre-payout amount, including the exact point at which a won Jackpot becomes L1.
2. **Approve the classification principle for add-ons:** classify underlying content once; never add SafetyCapital, ReserveProtection, MandatoryFutureCosts or a statistical reserve as a second liability unless distinct content and non-overlap are demonstrated.
3. **Confirm the direct EEV perimeter:** only verified canonical USDM in the exact qualified B1 PrizePool UTxO is A1/EEV for `PRE-RICH-EEV-USDM-DIRECT-V1`; other assets do not become A2/A5 by default.
4. **Keep PA2 blocked until the exhaustive inventory exists:** this proposed table is not evidence that every asset, obligation, NFT/datum right, transition, relayer, adapter or external interface has been enumerated.
5. **Keep PA7 blocked pending an independent omission review** of the completed inventory and the owner-approved mapping.

No R7 cell mapping is marked approved by this section. No code or economic semantics were changed. Build, tests, CI, live S0, Ω/P1–P8, R1/Kc and EV1–EV7 remain subject to the evidence limits recorded above.
