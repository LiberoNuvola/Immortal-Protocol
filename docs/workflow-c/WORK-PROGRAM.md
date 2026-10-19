# Workflow C — Work Programme and Exit Gates

This file tracks the work programme. It is not a new normative specification.
The canonical C0–C10 front numbering is taken from [the controlling Notion Workflow C page](https://app.notion.com/p/3fdc4454d6d581378702e9ae9d9fee85). Detailed state/predicate/transition/provenance/checking artifacts are local technical sub-work; they must not redefine those canonical IDs.

## Canonical front register

| Front | Canonical deliverable | Current disposition |
|---|---|---|
| C0 — Inventory/dependencies | Reconcile Notion, authorized branch/HEAD, CI, artifacts and environment/evidence class. | **PARTIAL.** Exact-head runs and 43-source catalog are reproducible; semantic authority/conflict reconciliation and cross-environment separation continue. |
| C1 — Trust boundary | Bind each input to proposer, verifier, proof, identity/version, freshness, canonical state and conflict/replay behavior. | **PARTIAL.** State/predicate source maps exist; network/script/asset/data/freshness and end-to-end trust-boundary proof remain open. |
| C2 — Independent verification | Separate proof validity, source finality/canonicality and semantic correctness; adversarially verify evidence. | **PARTIAL / NOT CERTIFIED.** Predicate inventory and strict manifest structure are source/structural checks, not cryptographic proof validation, source finality or semantic truth. |
| C3 — Autonomy/liveness | Demonstrate permissionless/operator-gated transitions, triggers, observable proof, outcome/finality and unattended resumption. | **INCONCLUSIVE.** `C3-AUTONOMY-LIVENESS-OBSERVABILITY-MATRIX.md` maps trigger/proof/action/finality gaps. A passing checker workflow is not evidence that a subsequent scheduled JEV run consumed a prompt, registered its own result and resumed without a user message. |
| C4 — PRE-RICH transaction economics | Compare sponsorship, application balance/settlement and batching; measure TxFee, ExecutionCost, RequiredLockedValue and relayer compensation separately. | **OPEN / RESEARCH.** No fee policy frozen and no on-ledger atomic SALE/MINT cost/acceptance packet claimed by the C6 finite-checker runs. |
| C5 — Acceptance evidence | Show malformed/stale/conflicting inputs cannot force an inadmissible action; bind pre-state, observed ledger post-state, transaction ref, cost vector and reproduction. | **OPEN / PARTIAL SUPPORT ONLY.** C10 mechanical packets do not establish DApp→Adapter SALE/MINT admission or no-bypass conformance on ledger. |
| C6 — Reference profile/action space | Instantiate chain-independent `M=(𝒮,Act,A,Accept,Ω,T,Safe)` and identify viable action space. | **BLOCKED / NOT CERTIFIED.** No authorized complete universal action relation or concrete non-empty Kc witness. |
| C7 — Ω/perimeter completeness | Instantiate all 13 contract elements, fixing authority, environment `E`, exclusions and soundness rationale. | **OPEN.** Worksheet remains checklist-only; authoritative perimeter/event-envelope completeness is not established. |
| C8 — Concrete Kc and initial S0 | Reproducible admissible `S0`, `χ(S0)=1`, witness and discharged VC2/VC3/VC6. | **BLOCKED.** No independently qualified non-empty profile-specific Kc certificate. |
| C9 — Independent certificate checker | Recompute profile/certificate predicates; reject producer-only booleans and malformed/stale/conflicting evidence. | **PARTIAL / MECHANICAL.** Structural validator and finite regressions pass; universal economic predicates and Kc theorem are not independently recomputed/certified. |
| C10 — Reproducibility/evidence record | Pin exact SHA, command, inputs/outputs, hashes, results, assumptions and limitations; preserve a rerunnable packet. | **PARTIAL / MECHANICALLY VERIFIED.** Latest packet has exact run binding, six command/status records, source hashes and independent artifact digest verification; profile/model certificate remains open. |

## Technical sub-work crosswalk

The legacy headings in `C0-C5-SOURCE-MAP.md` are technical map indices, not canonical Workflow C front IDs. Their precise relationship is recorded in `NOTION-CANONICAL-FRONT-CROSSWALK.md`. In particular, local map 3 (transition semantics) is not canonical C3 (autonomy/liveness), local map 4 (evidence/provenance) is not canonical C4 (transaction economics), and local map 5 (reproducible checking) is not canonical C5 (acceptance evidence).

## Execution order

1. Reconcile C0–C5 against the current source-of-truth hierarchy and existing repository artifacts.
2. Complete C6-A as a profile/interface description without inventing economic behavior.
3. In parallel, prepare C6-C/C7/C9/C10 evidence plumbing using the B3 packet and verifier-boundary patterns.
4. Keep C6-B and C8 blocked until an authorized substantive transition relation and a valid witness can be demonstrated.
5. Run the independent checker against the exact committed profile; preserve its raw output and hashes.
6. Report each gate as OPEN, BLOCKED, STRUCTURAL, VERIFIED, or CLOSED with evidence links. Never convert a design note into a pass. The first GitHub Actions entrypoint attempt created failed runs with zero jobs/logs; that unvalidated workflow file was removed. Do not claim tests passed until a supported execution path produces raw output.

## Stop conditions

Stop and request an explicit architecture decision if closure requires any of the following:
- adding an economic action that is not authorized by the current normative corpus;
- changing the Safe set, Ω, economic constants, EEV semantics, or transition costs;
- treating a PRE-RICH-specific lifecycle operation as universal IMMORTAL semantics;
- using SAFE STALL, NoOp, or rejection as a substantive viability action;
- weakening the independent-verification requirement;
- claiming an infinite-horizon result from finite exploration alone.

## Acceptance packet

A completed C10 packet must include:
- repository and full commit SHA;
- profile/version identifier and exact Ω/E declaration;
- canonical S0 and its hash;
- checker source/version and exact invocation;
- raw checker output and exit status;
- certificate/witness bytes and digest;
- assumptions, exclusions and known limitations;
- independent rerun result, with any discrepancy preserved rather than overwritten.

## 2026-10-19 — C6-A/C6-C structural manifest gate (exact-SHA checkpoint)

- **Authorized branch:** `release/public-main-curated-2026-09-24`.
- The C6 R1 workflow now executes `node --test docs/workflow-c/validate-profile-manifest.test.mjs` and watches the profile schema, validator and test files in both push and pull-request path filters.
- The manifest validator was aligned with `profile.schema.json`'s `additionalProperties: false` contract: undeclared fields are rejected at the root, model, certificate, Ω declaration, each Ω element, initial state and evidence packet. Adversarial regression coverage exercises all seven locations.
- **Exact-head evidence:** [C6 R1 finite certificate checker #27](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39200103664) succeeded on `13664f8dd5a31576415758ce12778ab2dd05648e`. Manifest structural tests: **6/6 pass**. Existing R1/source-binding/projection/inventory suite: **48/48 pass**. Source snapshot checks and inventory gate completed without checker errors.
- **Boundary:** inventory reports `closureEligible=false` and `MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN`. These tests establish structural/finite mechanical evidence only. They do not prove Ω completeness, PA2/PA7 exhaustiveness, source authenticity, economic transition semantics, a live S0, or non-empty Kc.
- **Next:** continue the Workflow C C0–C5 reconciliation and C6-C evidence binding without changing normative semantics. C6-B/C8 remain blocked until an authorized substantive transition relation and concrete non-empty Kc witness are established.

## 2026-10-19 — C10 run-scoped mechanical packet verified

- **Authorized branch / tested SHA:** `release/public-main-curated-2026-09-24` / `30b3a34618e2a0726a25dfd12f7b6ae27220d1bf`.
- **Workflow run #29:** [39200314704](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39200314704) — **SUCCESS**, exact matching SHA.
- **Artifact:** [workflow-c-mechanical-evidence-39200314704-1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39200314704/artifacts/12162788947), ID `12162788947`, size 8,251 bytes, GitHub ZIP SHA-256 `ed5a6754458e7376109771c4dede732ed1a168e4b566f819543b85ea812e0dc6`; expiry 2026-11-18.
- **Packet verification:** downloaded and extracted the artifact. It contains `canonical-source.json`, `v3-universal-projection.json`, `r1-economic-inventory.json`, `profile-manifest-tests.tap`, `finite-r1-tests.tap`, and `evidence-manifest.json`. Independently recomputed SHA-256 and byte lengths for all five payload files; all five matched the manifest. Independently recomputed the ZIP digest; it matched GitHub's artifact digest.
- **Observed test evidence:** profile-manifest structural suite **6/6 pass**; R1/source-binding/projection/inventory suite **48/48 pass**. Source snapshot/inventory checks returned no checker errors.
- **Classification boundary:** `MECHANICAL_EVIDENCE_ONLY_NOT_PROFILE_CERTIFICATION`. The inventory checker explicitly reports `closureEligible=false` / `MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN`. Artifact integrity establishes which bytes were preserved, not truth/completeness of the economic universe, Ω completeness, PA2/PA7, authoritative S0, an authorized universal transition relation, Kc non-emptiness or deployment conformance.
- **Status update:** C10's run-scoped packet generation, upload, retrieval and internal digest cross-check are now **MECHANICALLY VERIFIED for run #29**. Model/profile certification remains open; C6-B/C8 blocked and C7/PA2/PA7 remain open.

## 2026-10-19 — C10 command/status and source-digest packet verified

- **Corrective history:** artifact from run #31 uploaded successfully but independent retrieval found the manifest invalid JSON because newline/exit-status escaping was over-escaped. The workflow was corrected in commit `c943c16b948fe67a7a81c13a79e8db03be56eefc`; the defect is not hidden behind the earlier green job status.
- **Exact-head verification:** [C6 R1 finite certificate checker #32](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39200776171) — **SUCCESS** on `c943c16b948fe67a7a81c13a79e8db03be56eefc`.
- **Artifact:** [workflow-c-mechanical-evidence-39200776171-1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39200776171/artifacts/12162634765), ID `12162634765`, size 10,573 bytes, ZIP SHA-256 `387d9552a4e36a9e30b2330dc8912d10c04835b73cafc8765ee04fb3186df9c2`, expires 2026-11-18.
- **Independent packet validation:** artifact downloaded and extracted; `evidence-manifest.json` parses as JSON and binds `refs/heads/release/public-main-curated-2026-09-24`, exact SHA, run ID, attempt and URL. All five command records report **PASS / exitStatus 0**; the corresponding exit-status files are present. All 19 named source files are recorded as captured with byte lengths and SHA-256 digests. Independently recomputed the ZIP SHA-256; it matches GitHub's digest.
- **Tests:** profile-manifest structural regressions **6/6 pass**; finite R1/source-binding/projection/inventory suite **48/48 pass**. Runtime in packet: Node `v22.23.3`, Linux x64.
- **Unchanged certification boundary:** manifest classification remains `MECHANICAL_EVIDENCE_ONLY_NOT_PROFILE_CERTIFICATION`; inventory audit remains `closureEligible=false` / `MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN`. C6-B/C8 are still blocked on authorized substantive transition semantics and a concrete non-empty Kc witness; C7 and PA2/PA7 remain open. This packet records reproducibility/integrity, not a viability proof.

## 2026-10-19 — C10 packet builder regression-tested and latest artifact verified

- **Authorized branch:** `release/public-main-curated-2026-09-24`.
- Factored the packet generator into `scripts/build-workflow-c-mechanical-evidence.mjs` and added `scripts/test-workflow-c-mechanical-evidence.mjs`; the workflow now tests status parsing, exact run binding, command/output digests, source-file hashes, missing outputs/sources, malformed status and nonzero command status.
- **Exact-head run #34:** [39201078250](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201078250) — **SUCCESS** on `3947bd25fc9ec6d3677202c25c41a45de35615f3`. Manifest-builder tests **6/6 pass**; profile-manifest tests **6/6 pass**; finite R1/source-binding/projection/inventory tests **48/48 pass**.
- **Artifact:** [workflow-c-mechanical-evidence-39201078250-1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201078250/artifacts/12163489246), ID `12163489246`, size 11,538 bytes, ZIP SHA-256 `7e8d9b23b89d3cededa5aaeadbda891f039b61cc1eaf3740911085ae25dc692e`, expiry 2026-11-18.
- **Independent verification:** downloaded/extracted packet; `evidence-manifest.json` parses and binds the exact branch, SHA, run ID/attempt and URL. All six checks are `PASS` with exit status `0`; all six output files and status records hash-match the manifest. All 22 expected source paths are captured with digests and none are missing. Independently recalculated the ZIP digest; it matches GitHub.
- **Classification boundary unchanged:** `MECHANICAL_EVIDENCE_ONLY_NOT_PROFILE_CERTIFICATION`; checker still returns `closureEligible=false` / `MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN`. This closes only the reproducibility mechanics for the configured finite gate, not the C6-B/C8 profile theorem, Ω completeness, PA2/PA7 exhaustiveness, authenticated S0 or non-empty Kc.
- **Next Workflow C action:** continue C0–C5 source reconciliation and C6-C binding without inventing action semantics. If the only route to a non-empty Kc still requires a new substantive action or altered Ω/Safe/economic rules, stop for an explicit architecture decision.

## 2026-10-19 — C0 canonical source coverage and C10 packet verified

- **Authorized branch:** `release/public-main-curated-2026-09-24`.
- Expanded the C10 digest catalog by 17 existing files that the current Workflow C source map names: the final Constitution, Universal Economic Model and Economic Kernel; Ω and liveness/non-vacuity contracts; Workflow C README/transfer/C0–C5/C6/C7/profile/B3/R1 schema docs; and the chain-neutral Universal Economic Kernel/State. The two universal state/kernel paths were already part of the workflow change triggers; 15 additional existing paths now trigger both push and pull-request conformance runs. No source from Green Closure or another branch was copied into this branch.
- Added a regression asserting the canonical Workflow C source-map set remains in the manifest catalog. The standalone evidence-builder suite is now **7 tests**.
- **Exact-head run #36:** [39201337935](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201337935) — **SUCCESS** on `376c4f0cd092ff64a5f458004e3861cdaf80141b`.
- **Packet:** [workflow-c-mechanical-evidence-39201337935-1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201337935/artifacts/12164161373), ID `12164161373`, 12,698 bytes, SHA-256 `216099df9c503cf9ecbd7760cabdd53e55a5984181949447f30d630cc4b7d95f`, expires 2026-11-18.
- **Independent verification:** the retrieved packet binds the exact branch/SHA/run; all six commands have `PASS` and exit status `0`; each output and exit-status file matches its manifest digest; all **39/39 source paths** are `CAPTURED`; the ZIP digest independently matches GitHub. Tests: profile-manifest **6/6**, finite R1/source-binding/projection/inventory **48/48**, manifest builder **7/7**.
- **C0 boundary:** presence/hash coverage is stronger provenance, not semantic authority validation. The map still needs source-by-source reconciliation of each predicate's authority, inputs, decision procedure, version and evidence obligation. No normative rule was changed.
- **Unchanged blocker:** run #36 still reports `closureEligible=false` / `MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN`. C6-B/C8 remain blocked on authorized transition semantics and a concrete non-empty Kc witness; C7 remains open. The next work remains C0–C5 semantic reconciliation/C2 predicate mapping, without inventing model behavior.
## 2026-10-19 — C2 predicate inventory source-mapped

- Added `docs/workflow-c/C2-PREDICATE-INVENTORY.md`, anchored to the canonical Constitution, Universal Economic Model, Economic Kernel, Ω completeness contract, and R1/R3/R4/R8 certification specifications. It separates normative definition from profile instantiation, executable decision procedure, independent proof, and implementation evidence.
- The inventory maps the core model tuple, state/action domain, Accept, Ω/E, T, Safe, fixed-point/Kc membership, Wit, CK1–CK8/VC1–VC6, protected accounting, QNE/non-eroding witness, S0/non-vacuity, and eligible-action/liveness boundary. It preserves every unresolved profile procedure as OPEN or BLOCKED.
- This is source mapping only. It does not create a policy, action, coefficient, Safe/Ω definition, or profile certificate; C6-B/C8 remain blocked until authorized semantics and a concrete non-empty witness exist.

## 2026-10-19 — C2 inventory and C10 packet verified at exact head

- **Authorized branch:** `release/public-main-curated-2026-09-24`.
- **Exact-head workflow:** [C6 R1 finite certificate checker #38](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201635345) — **SUCCESS** on `6ddfcf2d1d3dc300d60035174b42408e8d67d5a6`, which contains `docs/workflow-c/C2-PREDICATE-INVENTORY.md` and the catalog regression.
- **Test results:** strict profile-manifest structure **6/6 pass**; finite R1/source-binding/projection/inventory **48/48 pass**; C10 evidence-builder regressions **7/7 pass**. All six configured commands are marked `PASS` with exit status `0`.
- **Artifact:** [workflow-c-mechanical-evidence-39201635345-1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201635345/artifacts/12164161875), ID `12164161875`, 12,777 bytes, ZIP SHA-256 `abe0e8470a623ce03043fad55c20a936779829606789be0eabb0dba4255331a2`, expiry 2026-11-18.
- **Independent inspection:** downloaded ZIP hash matches GitHub; JSON parses and binds ref/SHA/run/attempt; all six output files and exit-status files match manifest sizes/hashes; all **40/40** source paths are `CAPTURED`.
- **C2 conclusion:** normative predicate/proof obligations are source-mapped; profile-level domains, decisions, and substantive transition relation remain open. This does not establish CK/VC discharge.
- **Unchanged blocker:** `MECHANICAL_EVIDENCE_ONLY_NOT_PROFILE_CERTIFICATION`; inventory remains `closureEligible=false` / `MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN`. C6-B/C8 still require an authorized substantive transition relation and concrete non-empty Kc witness; C7/Ω completeness remains open. No economic action, coefficient, Safe set, Ω semantics, or normative rule was introduced.

## 2026-10-19 — C1 canonical-state field register

- Added `docs/workflow-c/C1-CANONICAL-STATE-FIELD-REGISTER.md` from the exact branch source for `UniversalEconomicState.hs` and `UniversalEconomicKernel.hs`. It distinguishes eight concrete Integer fields from the normative full state `𝒮`.
- Source-observed points: `EEV` is an external function argument; `History` appears in the canonical model but not in this record; unresolved reserve and unresolved ticket count are checked non-negative but are not included in the current `protectedCapital` sum. This is recorded as an open mapping question, not labeled automatically correct or defective.
- Added the field register to the C10 source-hash catalog, provenance regression and both workflow path triggers.
- This is source reconciliation only. No economic formula, field layout, action or normative semantics were changed. C1 stays PARTIAL; C6-B/C8 remain blocked and C7 remains open.

## 2026-10-19 — C1 state-field register exact-head verification

- **Authorized branch / tested SHA:** `release/public-main-curated-2026-09-24` / `b8553cfbcaea4f0c8369a35de130f91344d66bc4`.
- **C6 R1 finite checker run #40:** [39201925040](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201925040) — **SUCCESS**, exact SHA.
- **Artifact:** [workflow-c-mechanical-evidence-39201925040-1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201925040/artifacts/12164127436), ID `12164127436`, 12,842 bytes, ZIP SHA-256 `7bc4b61c7875d0050af9a8dc0df01fb5d55a64757bda23eb965a26aeb3aea944`, expires 2026-11-18.
- **Independent packet verification:** ZIP digest matches GitHub; manifest binds the exact branch/commit/run; all six command/output records and status files match their hashes, every command is `PASS` with exit status `0`, all **41/41** catalogued source paths are `CAPTURED`. Test outputs: profile-manifest **6/6**, finite R1/source-binding/projection/inventory **48/48**, C10 manifest builder **7/7**.
- **C1 register:** `docs/workflow-c/C1-CANONICAL-STATE-FIELD-REGISTER.md` records the eight-field chain-neutral aggregate and exact kernel consumption. It flags untyped integer units/provenance, external EEV binding, absent History field, and the unresolved role of unresolved reserve/ticket count as profile-completeness questions, not automatically as code defects.
- **Scope boundary:** this is source reconciliation plus mechanical/provenance evidence. It does not establish that the aggregate is complete for `𝒮`, prove canonical state refinement, or discharge CK/VC. The inventory remains `closureEligible=false` / `MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN`; C6-B/C8 blocked and C7 Ω instantiation open. No normative semantics changed.

## 2026-10-19 — C3 autonomy/liveness transition matrix source-mapped

- Added `docs/workflow-c/C3-AUTONOMY-LIVENESS-OBSERVABILITY-MATRIX.md` as a non-normative inventory tied to canonical Notion C3. It separates candidate generation, universal action admission, PRE-RICH pure transitions, SALE/MINT ledger acceptance and the JEV scheduled loop.
- The matrix records exact evidence classes and gaps: pure `transition` function outputs do not prove caller permission, signer/relayer policy, ledger confirmation/finality, or no-intervention behavior. It explicitly does not change or certify V3/Reveal/Claim/Expire semantics.
- The artifact is added to the C10 source-hash catalog, provenance regression and both push/PR path triggers. Catalog target is 43 paths; the exact-head C6 run following this commit must verify that all are captured.
- **Disposition:** canonical C3 remains **INCONCLUSIVE** until the next scheduled JEV iteration demonstrably consumes the newest valid prompt and records/resumes without a user message. Canonical C4/C5 stay open for SALE/MINT economics and ledger-bound acceptance evidence.

## 2026-10-19 — C3 automation/branch alignment rechecked

- **Authorized Workflow C branch:** `release/public-main-curated-2026-09-24`; latest checked head before this documentation update: `a7d1662c177ed2344edf00d6aba5e9085701d80e`.
- **Exact-head mechanical evidence:** [C6 R1 finite checker #43](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39202593332) succeeded on the exact head. Structural suite **6/6**, finite R1/source-binding/projection/inventory **48/48**, evidence-manifest builder **7/7**. Artifact [12164905158](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39202593332/artifacts/12164905158) is 12,972 bytes, SHA-256 `cafdeac77fb337c7e48360fba2cc11915b36f8b0dff48f4da323898a0bdc098c`.
- **Live C3 blocker:** the workspace automation record `JEV Autonomous Execution Loop` was observed disabled. Its stored prompt still names `work/immortal-green-closure`, not the authorized Workflow C branch. The branch-specific C6 checker has push/PR triggers; its green result does not invoke or prove a scheduled ChatGPT→Notion execution.
- **Action boundary:** no automation was enabled or retargeted here. That recurring execution-control change must not be implied by documentation or CI; until a branch-aligned scheduled iteration is observed consuming the newest prompt, registering its result, and resuming on a later iteration without a user message, C3 remains **INCONCLUSIVE / BLOCKED**.
- **Non-regression:** this is evidence-status reconciliation only. No universal action, Safe/Ω semantics, economic rule, V3/Reveal semantics or on-chain state changed.

## 2026-10-19 — JEV loop enabled on the authorized Workflow C branch

- The existing recurring workspace task was renamed 'Workflow C / JEV Autonomous Execution Loop', enabled, and its stored prompt was branch-aligned to release/public-main-curated-2026-09-24. Cadence remains hourly in Europe/Rome. The prompt refuses to execute against Green Closure or another branch, requires exact-head/run/artifact checks and keeps all core/economic/V3/Reveal/on-chain boundaries.
- This is an execution-control configuration change, not evidence that the automation has run. At the latest check, the stored last_run_time still referred to 2026-10-18T17:40:12Z; the first post-enable run remains NOT OBSERVED.
- C3 remains INCONCLUSIVE: require two linked scheduled iterations: first consumes the newest Workflow C branch-bound prompt and registers its exact outcome in Notion; the following run consumes that result and resumes without a user message. A green C6 finite-checker run is not this evidence.
- No protocol implementation, normative/economic semantics, V3/Reveal code, deployment or on-chain state changed.