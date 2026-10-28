# IMMORTAL SDK — Cross-Branch Inventory (Discovery v0.1)

**Classification:** non-normative engineering inventory; no protocol authority.
**Date:** 2026-10-27
**Status:** first-pass inventory; no SDK implementation or branch consolidation authorized by this document.
**Working branch:** `work/immortal-green-closure`

## Purpose and guardrails

Determine which existing IMMORTAL components can be exposed through a small, versioned SDK without duplicating the normative economic kernel or merging unreviewed branch snapshots.

This inventory is cross-branch. Branch-relative file presence is not proof of semantic correctness or merge readiness. Historical audit branches are treated as evidence sources, not as implementation targets. Do not cherry-pick a branch wholesale based only on file names or CI-green status.

No change is proposed to:
- IMMORTAL economic semantics or canonical specifications;
- PRE-RICH application policy, ticket ladder, payout, Jackpot, or expiry;
- Cardano V3 carrier or Reveal semantics;
- Agent A's EEV/USD/USDM source qualification and Issue-admission ownership;
- Agent C's Materios/B3 finality and provenance work (Materios remains paused);
- transaction submission, wallet signing, EEV approval, or deployment authority.

## Branch landscape observed

GitHub branch search returned the following relevant current or historical refs:

| Branch | Inventory role | Initial treatment |
|---|---|---|
| `work/immortal-green-closure` | Primary integration snapshot | SDK inventory source of truth for current Cardano integration and cross-environment vectors; verify live HEAD before implementation |
| `work/b3-materios-provenance-evidence` | Agent C / B3 evidence work | Read-only inventory; do not duplicate Materios work or merge its full divergent snapshot |
| `fix/cardano-lab-yaci-info` | Narrow Cardano lab diagnostics | Historical branch; compare exact commits before reusing |
| `fix/preprod-eev-approval-pin` | EEV approval pin + V3/Reveal diagnostics | Agent A-related / diagnostic material; do not absorb EEV policy into SDK |
| `release/issue-admission-boundary-squash` | Admission boundary snapshot | Candidate historical evidence; prefer current integration branch after checking exact code lineage |
| `review/treasury-readonly-observer` | Treasury observation diagnostics | Candidate observer/test material; no SDK dependency on deployment configuration |
| `audit/p2-8-b1-cardano-ledger-runner` | Native ledger evaluator and evidence packet | P2.8 evidence source only; do not wrap a false/ambiguous PASS as SDK success |
| `audit/adapter-sale-conformance` | Earlier adapter/kernel implementation | Historical baseline; not a direct merge target |
| `copilot/fix-real-preprod-reveal-job` | Single workflow adjustment | Narrow historical patch; unrelated to SDK core |

**Important:** several audit branches are substantially divergent from the integration branch. GitHub compare results showed broad histories and duplicate path names; this inventory therefore does not treat branch ancestry, “ahead/behind” counts, or file presence as proof of equivalence. Before reusing any file, pin its exact branch and commit, inspect its tests, and compare behavior to the current integration implementation.

## Existing component inventory

### A. Chain-neutral semantic core — reuse candidate, do not reimplement

| Component | Current path on `work/immortal-green-closure` | Observed contract / maturity | SDK disposition |
|---|---|---|---|
| Universal reference vectors | `Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json` | Chain-neutral fixtures for ProtectedCapital/RawSurplus and related boundaries; file marks itself `executable-seed`, with some vectors pending | Candidate for public conformance package after schema/status validation |
| Haskell reference evaluator | `Adapter/REFERENCE/export/ReferenceEconomicConformance.hs` | Reads portability vectors and emits normalized conformance output using the UniversalEconomicKernel | Keep as reference implementation/tooling; don't replace with TS reimplementation |
| V3 economic kernel | `IMMORTAL/kernel/EconomicKernel.hs` | Plutus-oriented kernel; current state/profile remain structurally coupled to PRE-RICH concepts | Normative implementation, not a second SDK kernel |
| V3 transition | `IMMORTAL/kernel/EconomicTransitionV3.hs` | State/action transition and invariant checks | Expose only through a stable wrapper after consumer/conformance mapping |
| V3 state | `IMMORTAL/state/EconomicStateV3.hs` | Includes ticket classes, control state and Jackpot state | Known profile/application coupling; no destructive extraction as part of SDK discovery |
| Canonical state adapter type | `Adapter/CARDANO/serialization/CanonicalEconomicState.ts` | Chain-neutral economic shape and non-negative validation, but stored under CARDANO | Good candidate to relocate/re-export only after dependency audit; no immediate move |

### B. Adapter boundary — existing API candidates

| Component | Path | Existing responsibility | SDK disposition |
|---|---|---|---|
| Cardano execution port | `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` | Lucid sign/submit boundary; verifies declared admission inputs against completed transaction inputs | Adapter-specific implementation; preserve wallet authority and fail-closed behavior |
| Economic admission witness | `Adapter/CARDANO/runtime/EconomicAdmission.ts` | Explicit witness required for economically material submission; does not compute EEV/ProtectedCapital/viability | Define transport type only; do not elevate witness shape into economic authority |
| Economic observation | `Adapter/CARDANO/observation/EconomicObservation.ts` | Validates an already-derived canonical state and returns a typed result | Reusable pattern for observation interface; source-specific trust checks remain adapter-owned |
| Script serialization | `Adapter/CARDANO/serialization/ScriptSerialization.ts` | Converts Lucid script envelopes and applies script parameters | Cardano-only package surface |
| Direct USDM observation | `Adapter/CARDANO/observation/PreprodDirectUsdmObservation.ts` and related tests | PRE-RICH/Preprod-specific evidence collection | Do not put in universal SDK core; Agent A owns source qualification |

### C. Evidence boundary — reuse candidate, with authenticity caveats

| Component | Path | Existing responsibility | SDK disposition |
|---|---|---|---|
| Canonical transition evidence | `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts` | Binds action, protocol/profile/adapter versions, pre/post-state fingerprints and transaction reference; validates shape and uniqueness | Strong candidate for a chain-neutral evidence schema after moving out of CARDANO namespace and adding schema versioning |
| Admission/evidence binding | `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts` | Checks action class and pre/post hashes agree between admission witness and evidence | Candidate for shared conformance test; it binds fields but does not prove their cryptographic truth |
| Preprod Issue provider | `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` | Composes live observation, signed authority evidence and Haskell admission | Deployment-specific composition; must remain outside generic SDK core |
| P2.8 materializer + native runner | `audit/cardano-integration/materialize-p28-ledger-context.mjs`, `audit/cardano-ledger-runner/YaciUTxO.hs` | Builds ledger context and decodes Yaci UTxOs for native evaluation | Not yet an SDK acceptance API. Existing reference-script context limitations mean this path must not be described as a successful ledger proof until repaired and revalidated |

### D. Cross-environment adapter experiments — research-only

| Branch/path | Finding | SDK disposition |
|---|---|---|
| `work/b3-materios-provenance-evidence:Adapter/MIDNIGHT/IntentBoundary.ts` | Chain-neutral intent/admission boundary draft for a research-only Midnight adapter | Review as a design example, not production code |
| `work/b3-materios-provenance-evidence:Adapter/MIDNIGHT/ExecutionEvidenceBoundary.ts` | Typed finalized receipt and evidence binding; explicitly imports no Midnight runtime types | Potential pattern for adapter-neutral receipt contract; status remains research-only |
| `work/b3-materios-provenance-evidence:poc/materios-orynq-bridge/src/anchor-verified-evidence.ts` | Uses Orynq SDK to prepare/submit a Materios receipt from an exact header/state-root/storage-value evidence scope | Keep as Agent C / Materios-specific POC; do not import Orynq dependency into IMMORTAL SDK core |
| `work/b3-materios-provenance-evidence:poc/materios-orynq-bridge/package.json` | Private package `immortal-materios-orynq-bridge`, Orynq SDK dependency, own typecheck/test scripts | Demonstrates local package pattern only; not a general SDK package boundary |

## Cross-branch findings

1. **No existing public IMMORTAL SDK package was identified in this first-pass inventory.** The root `package.json` is an application/tooling package with Vite, Vitest, Lucid dependencies and operational scripts; it does not currently define an SDK export surface.
2. **Useful pieces already exist.** The highest-value candidates are canonical conformance vectors, the reference evaluator, canonical state validation, observation/admission interfaces, canonical transition evidence, and the cross-environment adapter contract.
3. **They are currently scattered and inconsistently named.** Some chain-neutral types live under `Adapter/CARDANO`; some reference/conformance pieces live under `Adapter/REFERENCE`; evidence schema and adapter-specific evidence are not yet cleanly separated.
4. **Do not create a second economic kernel.** The SDK should call or bind to existing normative/reference implementations and their conformance vectors. A TypeScript mirror of Plutus/Haskell economic logic would create a second authority.
5. **Do not make “evidence SDK” imply proof.** A schema-valid receipt is not cryptographic authenticity, a workflow exit code is not semantic success, and simulation is not deployment certification.
6. **Do not move Agent A/C responsibilities into the SDK.** SDK interfaces may accept qualified EEV or verified external-evidence envelopes, but must not invent prices, approve EEV, infer GRANDPA set IDs, or relax finality verification.
7. **No code relocation is justified yet.** First produce a module dependency map and compatibility tests, then select a minimal export façade.

## Proposed MVP shape (design only)

- `@immortal/core` (name provisional): versioned chain-neutral types, action/admission result contracts, canonical evidence schema, strict validation/error vocabulary, conformance-vector loading. No economic-policy duplication.
- `@immortal/adapter-cardano`: wrapper around existing Cardano execution/observation/serialization interfaces; explicit separation between wallet signing, observation, and evidence.
- `@immortal/conformance`: canonical vectors and runner adapters that compare normalized outcomes; a green workflow alone is insufficient.
- External bridges (e.g. Materios/Orynq, Midnight) remain optional adapter packages and must not become dependencies of core.

This is a proposed boundary, not a commitment to publish these exact package names.

## Acceptance criteria before implementation

- [ ] Enumerate all active branch heads and pin the exact SHA for each selected candidate.
- [ ] Map imports/dependencies and list consumers for every candidate module.
- [ ] Identify duplicate/near-duplicate definitions across current and historical branches.
- [ ] Run the existing relevant tests/conformance vectors on the selected integration SHA.
- [ ] Define schema and package versioning/compatibility policy.
- [ ] Demonstrate that SDK output cannot override normative Haskell/Plutus decisions.
- [ ] Separate shape validation, cryptographic verification, ledger execution, and deployment certification in types and result states.
- [ ] Confirm no Agent A or C ownership is duplicated.
- [ ] Only then propose a small façade and its tests; no new branch unless integration requires it.

## Next step

Continue the read-only cross-branch audit of exact branch heads, package manifests, module consumers and tests. Update the central coordination checkpoint with this inventory. Do not start a new SDK implementation branch or refactor the kernel yet.


## Follow-up: consumer map and P2.8 closure check (2026-10-27)

A second pass used GitHub code search on the default branch as a **read-only corroboration source**, while retaining `work/immortal-green-closure` as the implementation surface per `docs/IMMORTAL-SYSTEM-MAP.md`. Default-branch search is not a substitute for pinning and rechecking the working branch head before implementation.

### Observed consumer map

| Candidate | Direct consumers located by code search | Consequence |
|---|---|---|
| `CanonicalEconomicState.ts` | `EconomicObservation.ts`, `src/__tests__/immortal-reveal-conformance.test.ts`, `audit/cardano-integration/preprod-conformance-binding.mjs` | It is not isolated: moving it requires updating app tests and evidence-source lists, not just the observation module |
| `CanonicalTransitionEvidence.ts` | `EconomicAdmissionTransitionBinding.ts`, `src/preRichIssueAdmissionBridge.ts`, `src/__tests__/caes-transition-closure.test.ts`, `audit/cardano-integration/reveal-ledger-trace.ts`, `audit/cardano-integration/expire-ledger-trace.ts` | A shared evidence contract would touch Issue-admission and lifecycle evidence paths; use a compatibility façade first, not a file move |
| `CardanoExecutionAdapter.ts` | `src/txHelpers.ts`, `src/mint.ts`, `src/adSettlement.ts`, lifecycle trace runners, adapter and CAES tests | It is a real application integration boundary already. SDK MVP should wrap it without changing its signing/submission semantics |
| `EconomicAdmissionTransitionBinding.ts` | `src/__tests__/caes-transition-closure.test.ts`, its own regression test, and Issue-admission composition | Preserve current pre-sign binding and negative-twin coverage; do not conflate structural matching with cryptographic verification |
| Portability vector JSON + Haskell reference evaluator | Search found the vector/evaluator files and docs referencing them, but no reliable direct import of the JSON from a TypeScript package was found | Treat this as a separate conformance-tooling surface; inspect its execution workflow before proposing package exports |

### Duplicate-definition and packaging findings

- The root `package.json` is an app/tooling manifest with Vite, Vitest, Lucid and operational scripts; no explicit public SDK export surface was identified.
- The canonical economic state is chain-neutral by its stated semantics but physically located in `Adapter/CARDANO/serialization`. That is a naming/layout mismatch, not sufficient reason for a refactor.
- Canonical transition evidence carries protocol/profile/adapter versions and fingerprints but currently uses broad strings for fields such as action class and environment. A future schema should tighten enums/normalization only through a versioned compatibility proposal.
- The current evidence validator proves shape and field binding only. It must not return a status named `verified` or `finalized` unless an independent verifier has actually established that property.
- Code search did not establish any duplicate canonical economic-state definition that can safely be removed. No delete/rename is proposed.

### P2.8 check: not closed by documentation or a green workflow label

The currently visible system/status documents continue to classify typed Ledger Reveal evaluation as **IN PROGRESS** and full P2.8 evidence as requiring an exact-head native report. The Reveal remediation document explicitly distinguishes reference-script size relief from script execution success and ledger acceptance. The workflow source invokes the native evaluator, but that fact alone does not prove the latest run produced an acceptable report.

I could not establish from the available run evidence in this pass that a fresh exact-head P2.8 packet had produced either:
- `LEDGER_ALIGNED_EVALUATION_SUCCESS` with actual redeemer results/ExUnits; or
- a genuine ledger-originated script failure with complete, hash-bound context.

Therefore I do **not** reopen implementation or call P2.8 closed based on a workflow status. Keep the existing remediation path and obtain the latest run ID, exact head SHA, artifact digest and `ledger-evaluation-report.json` before changing the evaluator. This preserves the earlier user report of a green lab run as a lead to verify, not as evidence already inspected.

### Current recommendation

Proceed to a dependency-map/conformance audit, not a broad refactor:
1. Pin the active branch head and the exact source SHA for each candidate.
2. Collect the current test names and workflow invocations for the five candidate seams above.
3. Build a package/export proposal with no moves initially.
4. Run the relevant existing conformance tests at that exact head.
5. Keep P2.8 and SDK readiness as separate statuses.


## Follow-up: test/workflow map (2026-10-27)

This pass inspected the actual files through the active branch ref `work/immortal-green-closure`. The connector returned content/blob SHAs for each file, but did not expose the branch ref's commit SHA directly; therefore the file-level pins below are reproducible blob identities, not a claim that the active branch HEAD has been pinned. Resolve the exact HEAD SHA before implementation or reporting a test result.

### Contract tests and their current role

| Seam | Test / evidence file | What it presently checks | SDK implication |
|---|---|---|---|
| Canonical economic state + PRE-RICH Reveal projection | `src/__tests__/immortal-reveal-conformance.test.ts` (blob `f7cff6732ffe20a2ae47b12f05ba49a5abbd9bda`) | Projects observed B1 state into `CanonicalEconomicState`, validates units/decomposition, and exercises the Reveal transition shape | Keep as compatibility contract; do not treat its TypeScript projection as independent normative authority |
| Admission ↔ transition evidence | `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.test.ts` (blob `e387c46e87fb0a5151e53851fcb65da13a2d82aa`) | Matching action, pre-state, post-state and 32-byte fingerprints; negative twins for malformed/mismatched values | Direct candidate for core contract tests, with explicit distinction between structural binding and authenticity |
| Observed transition binding | `Adapter/CARDANO/observation/CardanoObservedTransitionEvidence.test.ts` (blob `88f1d5d3911bdccbfa91f3683ec08434e78008eb`) | Action, pre/post observation fingerprints and transaction reference must match | Adapter-specific evidence contract; keep environment label and trust level explicit |
| Economic submission boundary | `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts` (blob `c7a2e880eb394582e31fd677bca088bbb429bb10`) | Requires admission, checks completed transaction input binding, pool identity/value, action and liquidity, and fails before signing on invalid witnesses | Preserve pre-sign negative-twin coverage; never let SDK schema validation itself authorize signing |
| Reference portability vectors | `Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json` (blob `18334f0a12a333c4da796e9c15fe93454c2dd1cf`) | V01–V07 and V10 have some executable expected values; V08/V09 remain pending and the file labels itself `executable-seed` | Not yet a complete certified conformance suite; status/pending vectors must remain visible |
| Haskell reference evaluator | `Adapter/REFERENCE/export/ReferenceEconomicConformance.hs` (blob `1e45fddd856005e4d7721d6107bc84b7c90381fd`) | Reads the vector JSON and emits normalized reference results for vectors with supported shapes | Conformance tool, not a public runtime API; run against the canonical Haskell kernel and record exact toolchain/SHA before package design |

### Existing workflow entry points

| Workflow | Invocation / scope observed on active branch | Evidence boundary |
|---|---|---|
| `.github/workflows/adapter-sale-conformance.yml` (blob `1fa2d9a2370f64c7a3b005fb96bda588439f5b20`) | Push on `work/immortal-green-closure`; runs the focused Vitest boundary group, `immortal-cardano-adapter-conformance.test.ts`, Preprod observation, Issue-admission tests, and RF8 production-boundary audit; separate frontend build job | Best existing grouped contract-test gate for Cardano SDK façade, but contains Agent A/EEV-adjacent tests and must not be reinterpreted as EEV approval or end-to-end ledger proof |
| `.github/workflows/immortal-cardano-preprod.yml` (blob `799f550c265d8fcc152441df9819d7cc5637b56f`) | Push paths include Adapter/audit/Plutus files; runs live Preprod context probe and `immortal-reveal-conformance.test.ts`, then binds observation to exact conformance snapshot; manual inputs can enable V3 observation or direct-USDM evidence bootstrap | Separate live observation/evidence from local contract conformance. Do not dispatch privileged/bootstrap inputs as part of SDK discovery |
| `.github/workflows/immortal-cardano-lab.yml` (blob `45d7f987efdc62980258381ddb5e9691dcc2c8eb`) | Push on working branch; compiles Plutus, starts Yaci devnet, runs lifecycle traces, materializes P2.8 context, runs native decoder conformance and the native Ledger evaluator, uploads evidence | Integration/evaluator evidence, not a package unit test. Do not call P2.8 closed until exact-head report and byte-binding artifact are inspected |

### What remains before SDK implementation

1. Pin the actual working branch HEAD SHA using a Git ref/commit endpoint (the current connector surface returned branch name and file blob SHAs but not its resolved commit SHA).
2. Execute the focused tests at that SHA, rather than infer a pass from workflow definitions or prior CI.
3. Add a conformance harness for the portability vector file that fails explicitly on pending vectors rather than silently skipping them; keep pending-vector status non-green for a claim of full portability closure.
4. Establish the Haskell reference evaluator's canonical build/run command and capture normalized output + toolchain fingerprint.
5. Draft a compatibility façade and API contract tests only after the above; no file moves and no parallel TypeScript kernel.
6. Keep P2.8 acceptance separate: inspect the exact-head `ledger-evaluation-report.json`, report binding, reference-input UTxOs and actual redeemer outcomes.

**Status after this pass:** test/workflow map recorded from branch-resolved files; exact branch HEAD SHA and fresh test execution remain unverified. No code, test, workflow, or protocol semantics changed.


## Follow-up: executable reference conformance hardening (2026-10-27)

A concrete gap was found while inspecting `Adapter/REFERENCE/export/ReferenceEconomicConformance.hs`: it printed actual and expected fields but did not compare them, silently skipped unhandled executable vectors, represented V05's protected-capital decomposition as a single aggregate field, and did not execute V07's nested locality cases. That meant the script's output was diagnostic, not a fail-closed conformance gate.

Changes made on the existing working branch:
- The evaluator now compares actual kernel results with each available expected value and exits non-zero on mismatch.
- An executable vector with an unsupported shape now fails instead of being silently ignored.
- V05 builds `UniversalEconomicState` from the six supplied protected-capital components, so the kernel must reproduce the expected aggregate.
- V07's nested locality cases are now executed independently.
- V10 now routes its CAR + other protected-capital aggregate through the canonical `UniversalEconomicKernel` instead of duplicating `max(0, EEV - PC)` in the runner.
- Pending vectors are printed explicitly, and the final marker says `PASS_EXECUTABLE_VECTORS` with a pending count, not full portability closure.
- Added a step to `.github/workflows/immortal-cardano-lab.yml` after canonical Plutus setup to run this evaluator and persist `audit/yaci-evidence/reference-conformance.txt`.

Commits on `work/immortal-green-closure`:
- Initial fail-closed assertions: `a170c9270d6cbdc9684402fec5ad66e1eb7cc62f`
- Workflow invocation: `d226dab0f504935413588a937b630714defed21d`
- Decomposition/locality coverage and parser corrections: `60248611d763b98de0fe12727d48928ce59bb296`, `db67f9add287757cd00a1dc0d85670886121c74c`, `2ec76f308170aec2842b49903d0f806e59d1ff17`
- Final CAR-through-kernel adjustment: `bde369cb23853f7a31f330d87a232211b1c606f6`

The current branch comparison confirms `work/immortal-green-closure` is exactly at `bde369cb23853f7a31f330d87a232211b1c606f6`. The exposed status endpoint currently returns no status checks for that SHA; this is **not** evidence that the new step passed. The runner could not be executed locally in this environment. The CI step is now configured to execute it; inspect the actual lab run and uploaded `reference-conformance.txt` before declaring the change validated. V08/V09 remain pending and overall portability conformance remains incomplete.

No economic semantics, V3 carrier, Reveal semantics, EEV authority, Materios trust boundary, wallet signing, deployment, or transaction submission was changed.


## Follow-up: exact-head SDK readiness and V08 transition-owner audit (2026-10-27)

### Exact working ref
The GitHub branch endpoint resolves `work/immortal-green-closure` to commit `776963a143bea02def3f231d5834f347460f6609` (commit message: `docs(coordination): record inspected P2.8 ledger evidence packet`). This live ref supersedes the older SHA recorded in the first-pass inventory. The inspection below is source-only; it does not claim a fresh build or test run.

### V08: transition owner not found in the universal kernel
Exact-head source inspection confirms:
- `IMMORTAL/state/UniversalEconomicState.hs` is an application-neutral aggregate containing liabilities, unresolved reserve/count, exposure, and protected-capital components. It contains no lifecycle state, ticket status, action type, or expiry timestamp.
- `IMMORTAL/kernel/UniversalEconomicKernel.hs` exports arithmetic/invariant functions only: `protectedCapital`, `rawSurplus`, `nonNegativeState`, and `solvencyInvariant`. It does not define a universal state transition.
- `Adapter/REFERENCE/export/ReferenceEconomicConformance.hs` runs those aggregate economic predicates against portability vectors; it is not a lifecycle-transition runner.
- `IMMORTAL/kernel/EconomicTransitionV3.hs` does implement `Issue`, `Reveal`, `Claim`, and `Expire`, but its state/action contract is explicitly V3/profile-shaped: it imports `EconomicStateV3`, `EconomicProfile`, class state and the PRE-RICH economic kernel. Treating this as the universal lifecycle model would collapse the documented universal/profile boundary.
- `PRE-RICH/src/PreRichExpiryPolicy.ts` and `PreRichExpiryEvidence.ts` define profile-owned expiry horizon/evidence, not a universal IMMORTAL lifecycle automaton.
- `verification/finite_model_checks.py::expiry_absorbing_check` is explicitly an abstract finite model, not implementation evidence.

**Finding:** the canonical universal executable transition owner required to close V08 is not present in the inspected universal state/kernel/reference-runner path. The V3 transition is a candidate refinement implementation, not a substitute for that missing universal contract. V08 therefore remains pending; do not wire the abstract check into the reference runner and call it implementation conformance, and do not import PRE-RICH's numeric horizon into IMMORTAL.

### SDK disposition from this audit
The SDK can advance in parallel only on non-authoritative scaffolding:
1. Document the public API contract and package boundaries without moving files.
2. Define a versioned, chain-neutral envelope for transition evidence, explicitly distinguishing shape validation from cryptographic authenticity and source/freshness verification.
3. Map each proposed public export to its existing canonical implementation and owning conformance test.
4. Keep a release gate that fails full-conformance qualification while V08/V09 are pending; the harness must report executable-vector pass and pending-vector count separately.
5. Do not create a TypeScript economic-kernel mirror, universal transition API, new package facade, or adapter claims until the canonical transition contract and certificate acceptance criteria are resolved.

### V09 interaction
V09 remains a certification blocker, not an SDK packaging task. The SDK may represent certificate references/evidence in a typed envelope, but cannot generate or assert the missing concrete `K_c` certificate, instantiate `S, A, Ω, T, Safe`, or turn booleans into a proof.

**Next actionable gate:** finish the API/export-to-test map and run the existing focused CI on an exact SHA; in parallel, escalate the V08 universal transition-contract gap as an architecture decision rather than silently treating V3 as universal. No code, protocol semantics, transaction, wallet, deployment, V3 carrier, Reveal, EEV, or Materios work was changed by this audit.


## Follow-up: SDK export-to-implementation-to-test map (2026-10-27)

### Exact-head CI evidence
The live branch HEAD is now `74d37a0a27543546cb8e1254489af440f4b5032d`. Portability workflow run [#40578528997](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40578528997) completed **success** on that exact SHA. Job `conformance` passed:
- `npx vitest run src/__tests__/immortal-portability-conformance.test.ts`
- `node --import=tsx --test src/__tests__/immortal-cardano-universal-boundary.test.ts`

This proves those two bounded test suites pass at that SHA. It does **not** close V08/V09 or imply full portability certification; the tests explicitly preserve V08 and V09 as pending.

### Candidate export map (no package facade implemented)

| Proposed public surface | Canonical implementation/source today | Existing test/verification owner | Exposure decision / guardrail |
|---|---|---|---|
| Chain-neutral economic state type + shape validator | `Adapter/CARDANO/serialization/CanonicalEconomicState.ts` | `src/__tests__/immortal-reveal-conformance.test.ts`; projection boundary Haskell tests | Re-export candidate for `@immortal/core` only after dependency/import audit. Validation is shape/non-negativity only; not authenticity, freshness, EEV, viability or transition authorization. |
| Universal protected-capital/surplus reference behavior | `IMMORTAL/kernel/UniversalEconomicKernel.hs`; `IMMORTAL/state/UniversalEconomicState.hs` | `Adapter/REFERENCE/export/ReferenceEconomicConformance.hs`; portability workflow; `src/__tests__/immortal-portability-conformance.test.ts` | Haskell remains the reference authority. Do not add a TypeScript economic-kernel implementation. Publish vectors/runner tooling before any runtime wrapper. |
| Chain-neutral transition-evidence envelope | `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts` | `src/__tests__/canonical-transition-evidence.test.ts`; `audit/cardano-integration/expire-ledger-trace.ts` consumes it | Type/schema candidate for core after a schema-version field and clear authenticity boundary are specified. Current validator checks non-empty strings, digest shape, uniqueness and field equality; it does not recompute fingerprints or authenticate the transaction. |
| Admission-to-evidence binding | `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts` | `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.test.ts`; `src/__tests__/caes-transition-closure.test.ts` | Keep as evidence binding contract; never market it as economic admission or cryptographic proof. |
| Cardano execution/sign/submit adapter | `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`; `Adapter/CARDANO/runtime/EconomicAdmission.ts` | `src/__tests__/cardano-execution-adapter.test.ts`; `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts`; `src/__tests__/rf8-submission-boundary.test.ts` | Candidate for `@immortal/adapter-cardano`, preserving CIP-30 wallet signing and existing fail-closed submission boundary. Do not expose as a generic chain-neutral core operation. |
| Cardano observation/projection | `PRE-RICH/src/PreRichCardanoObservationProjection.ts`; `Adapter/CARDANO/observation/EconomicObservation.ts` | `src/__tests__/immortal-cardano-universal-boundary.test.ts`; Preprod observation test suites | Separate generic shape acceptance from PRE-RICH projection and source-authentication. Keep profile and deployment source qualification out of core. |
| Portability vectors + normalized runner | `Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json`; `Adapter/REFERENCE/export/ReferenceEconomicConformance.hs` | `src/__tests__/immortal-portability-conformance.test.ts`; `plutus/test/PortabilityVectorConformanceTest.hs`; workflow above | Candidate for `@immortal/conformance`. Pending vectors must cause a non-qualified release status; passing executable vectors alone is not full conformance. |
| V3 transition/actions | `IMMORTAL/kernel/EconomicTransitionV3.hs`; `IMMORTAL/state/EconomicStateV3.hs` | `IMMORTAL/conformance/RefinementV3.hs` and relevant Plutus conformance suites | Do not export as a universal transition API. Keep profile/V3 scope explicit until V08's universal transition contract is resolved. |
| Deployment-specific PRE-RICH Issue admission / direct-USDM evidence | `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` and Agent A's qualification artifacts | Agent A-owned EEV/Issue admission suites and privileged workflows | Not an SDK core export. SDK may transport an already qualified evidence envelope but cannot derive/approve EEV or bypass R1/Kc. |

### What is and is not now validated
- **Validated at exact SHA:** portability seed tests and Cardano universal-boundary observation tests pass in run #40578528997.
- **Source-mapped but not claimed newly executed here:** the evidence binding, Cardano execution adapter, admission, and CAES composition tests listed above.
- **Still open:** V08 universal transition owner/contract; V09 concrete certified `K_c`; export surface and schema versioning; package-level API/compatibility tests; full conformance qualification.
- **No package code or protocol semantics changed:** this update records evidence and ownership only.


## Follow-up: exact-head workflow gate + lifecycle contract cross-check (2026-10-28)

### Exact current HEAD and workflow results

The active branch resolved to `1b675e0c4c0a8dd6a61c158544872a67ef462426`. All five runs triggered by that exact SHA completed successfully:

- [IMMORTAL Portability Conformance #40580323631](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580323631): success; job `conformance`.
- [Cardano Adapter Sale Conformance #40580323842](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580323842): success; jobs `economic-conformance` and `frontend-build`.
- [Protocol Declaration Conformance #40580323669](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580323669): success; job `declaration-conformance`.
- [Algorithmic Governability Adversarial Lab #40580323684](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580323684): success; job `no-result-dependent-authority`.
- [Documentation Link Check #40580324022](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580324022): success.

This is exact-head CI evidence for these bounded workflows. It is not full portability closure, certified `K_c`, live Preprod qualification, or proof of a user-purchasable ticket.

### V08 cross-check: normative transition contract exists; universal executable owner still does not

Additional source inspection resolves an ambiguity in the earlier note:

- `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md` defines the normative canonical form `(S, a, ω) → S′ = T(S,a,ω)`, requires authoritative inputs, complete post-state, separate `Safe` and certified-`K_c` viability checks, fail-closed rejection, atomic commit and history recording.
- `PRE-RICH/onchain/PreRichLifecycleTransition.hs` is a concrete executable lifecycle boundary, but its own module contract makes it PRE-RICH/regime-specific. Its actions are `EnterQuiescent` and `MaintainQuiescent`; it does not define the universal ticket-expiry transition and must not be relabeled as that owner.
- `IMMORTAL/kernel/EconomicTransitionV3.hs` implements profile-coupled Issue/Reveal/Claim/Expire, not the universal `T` contract.
- `plutus/test/PreRichLifecycleTransitionTest.hs` tests the PRE-RICH lifecycle/QNE contract; it does not discharge universal V08 expiry-finality conformance.

**Updated conclusion:** V08 is not missing normative intent; it is missing an identified, canonical, executable universal transition contract/model that maps the normative `T` and expiry-finality invariant to implementation conformance. This needs an architecture/normative owner decision, not an SDK-only alias or a test against the wrong lifecycle.

### SDK gate decision

The five workflows are green on the current HEAD, so the documentation/test-mapping stage is validated. The next safe SDK step remains a **reviewable API-contract proposal only**: package ownership, public type/schema versioning, evidence trust labels, and compatibility expectations. Do not create package facades or a parallel TypeScript kernel while V08/V09 remain open. Keep V09 blocked on an instantiated concrete `K_c` certificate and evidence; no synthetic fixture or green CI can replace it.

No protocol semantics, economic constants, V3 carrier, Reveal semantics, Agent A EEV/Issue authority, wallet signing, deployment, transaction submission, or paused Materios work changed.


## Follow-up: reviewable SDK API contract proposal (2026-10-28)

Added [IMMORTAL SDK API Contract Proposal](IMMORTAL-SDK-API-CONTRACT-PROPOSAL-2026-10-28.md) as a draft-only design artifact; no package facade or runtime code was introduced.

The proposal records:
- candidate package ownership: `@immortal/core` for chain-neutral data contracts, `@immortal/adapter-cardano` for Cardano execution boundaries, and `@immortal/conformance` for vectors/runner/evidence;
- a versioned transition-evidence envelope with explicit environment, source references, verifier/assurance and limitations;
- a hard distinction between structural validity, source observation, profile qualification, deployment approval and exact-ledger confirmation;
- compatibility rules and fail-closed API tests;
- explicit gates for V08 universal executable transition ownership and V09 concrete `K_c` certification.

These names and assurance levels are proposals, not approved normative vocabulary. Reuse existing canonical statuses where available; do not introduce competing status semantics without review. The Haskell universal kernel remains the reference authority; no TypeScript mirror is proposed.

The branch was at `6a71021404d1d0a354cbe2d948bffb84b3a54bac` when its five bounded workflows completed successfully. The new proposal commit is `7f2466fbcba1049e608541e61b369c0c554ad094`; CI for the new documentation-only HEAD must be checked separately. Agent A's fresh direct-USDM source/EV1–EV7 qualification remains distinct from deployment approval: the artifact records `deploymentApproval: null` and `deploymentApprovalStatus: PENDING`.

**STATUS: API CONTRACT DRAFT AVAILABLE FOR REVIEW; NO SDK IMPLEMENTATION; V08/V09 AND PREPROD ISSUE AUTHORITY REMAIN OPEN.**


### Packaging constraint added after root-manifest inspection

The root `package.json` is an application/Vite manifest, and the inspected tree has no root `pnpm-workspace.yaml` or `lerna.json`. The proposed `@immortal/*` names are therefore logical ownership boundaries only, not existing packages. The API proposal now requires an explicit choice between an internal non-published module and a separately scoped real package/workspace; no package manager migration or public packaging is implied.


## Follow-up: admission-to-evidence action fingerprint binding (2026-10-28)

### Gap found and correction

Source review found that `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts` checked action class and pre/post-state fingerprints but did not compare `EconomicAdmissionWitness.actionFingerprint` with `CanonicalTransitionEvidence.actionFingerprint`.

The evidence-layer binding now compares the action fingerprint as well. Regression coverage:
- `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.test.ts` rejects a mismatched action fingerprint.
- `src/__tests__/caes-transition-closure.test.ts` verifies the composition rejects the mismatch before `signTx` and `submitTx`.
- The CAES positive fixture now models a completed Lucid transaction and exposes the actual declared pool input via `toTransaction().body().inputs()`, matching the adapter's existing fail-closed contract.
- `.github/workflows/adapter-sale-conformance.yml` now includes the CAES closure test in the adapter conformance gate.

### Exact-head evidence

All six bounded workflows below completed successfully on exact HEAD `2ef5c425da9762931ee440ba22ed12d40d9a3d85`:
- [Cardano Adapter Sale Conformance #40631890587](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890587) — both `economic-conformance` and `frontend-build` passed.
- [IMMORTAL Portability Conformance #40631890535](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890535).
- [Protocol Declaration Conformance #40631890534](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890534).
- [Algorithmic Governability Adversarial Lab #40631890649](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890649).
- [Documentation Link Check #40631890547](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890547).
- [PRE-RICH Direct-USDM Conformance #40631890559](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890559) — separate Agent A-owned qualification/conformance path.

This closes only the missing equality binding between the witness and its evidence record. It does not recompute or cryptographically authenticate the action fingerprint, prove ledger inclusion, qualify EEV, approve Issue, or discharge R1/`K_c`. V08/V09 remain open; the SDK API document remains a review draft. Agent A's Oracle State freshness and direct-USDM work is separate and was not duplicated. No V3 carrier, Reveal semantics, economic constants, or wallet/deployment authority changed.


## Follow-up: production wiring boundary for transition-evidence binding (2026-10-28)

A call-site audit on the current branch clarifies the reach of the action-fingerprint equality fix:

- `assertEconomicAdmissionMatchesCanonicalEvidence` is called from the CAES composition test and its focused tests; the production `CardanoExecutionAdapter.submitEconomic(...)` API does not accept a `CanonicalTransitionEvidence` argument and does not call this helper.
- `assertIssueAdmissionMatchesCanonicalEvidence` in `src/preRichIssueAdmissionBridge.ts` also validates matching Issue action/state/action fingerprint fields, but a repository call-site search found its direct tests rather than a call in the production Issue submission path.
- Production Issue still goes through `obtainAuthoritativeIssueAdmission` and `submitEconomic(..., 'Issue')`; Reveal/Claim/Expire similarly use the economic submission boundary without this evidence envelope.

Therefore, the action-fingerprint equality is now covered by focused unit/CAES regression tests, but it is **not yet a universal production pre-sign gate**. Section 45.38 records a tested binding contract, not runtime enforcement across every transition.

The next implementation decision is to define a separate pre-sign transition-intent/admission binding and a submit/settlement observation record with explicit phase semantics. A Cardano body-derived candidate ID may be computable before signature, but it is not a submit receipt or ledger confirmation. Reusing the current full `CanonicalTransitionEvidence` unchanged as a pre-sign object would leave that distinction implicit. Do not synthesize placeholder IDs, weaken validation, or retrofit all production flows without an agreed schema and explicit tests for Issue/Reveal/Claim/Expire. This does not alter V3/Reveal semantics, Agent A's EEV/Issue authority, or the current fail-closed input inspection in the adapter.


## Follow-up: phase-separated evidence API draft (2026-10-28)

The SDK API contract draft now makes the production-wiring gap explicit and proposes separating:
- a **pre-sign transition-intent/admission binding** with action class/fingerprint and canonical pre/post-state fingerprints; and
- a **post-submit settlement/observation evidence record** carrying the actual transaction reference and any independently verified ledger result.

The existing `CanonicalTransitionEvidence` includes `transactionRef` and is only structurally validated. A Cardano candidate body ID can be distinct from a returned submission receipt and an independently observed ledger transaction; the current schema does not declare which phase its field represents. Do not fabricate placeholder references or treat matching fields as runtime proof. Repository call-site inspection found the general and Issue-specific binding helpers in tests, but not wired through all production Issue/Reveal/Claim/Expire submission paths; `submitEconomic` currently does not accept that evidence envelope.

This remains draft architecture, not runtime implementation. The SDK API proposal now records this split as a release gate; do not change the adapter API or invent producer values until fingerprint ownership/canonicalization and transition-specific input/output binding have an agreed design.


## Follow-up: transition-specific fingerprint provenance (2026-10-28)

Read-only source review now distinguishes authoritative pre-sign decision fingerprints from post-transition observation fingerprints:
- **Issue:** the canonical Haskell Issue decision derives the action fingerprint from the canonical Issue action plus pre/post-state hashes; the Issue builder carries the admitted fingerprint and authority signature through the carrier redeemer.
- **Reveal / Claim / Expire:** the found `hashJson` fingerprints are built in local-Yaci audit trace scripts from fixture inputs and action-specific fields as observed around settlement. They are diagnostic transition-observation evidence, not producers for the production pre-sign admission witness.
- **Production mapping gap:** `src/gameFlow.ts` receives `EconomicAdmissionWitness` for Reveal/Claim/Expire but does not expose an application-level canonical action-fingerprint producer analogous to the Haskell Issue path. The adapter sees admission and concrete input references; the generalized evidence helper is not called by production paths.

The SDK draft now has an explicit transition-specific provenance matrix and a release gate for canonical fingerprint source ownership plus completed-transaction mapping. Do not transplant the harness `hashJson` formulas into production admission, claim universal fingerprint parity, or change V3 semantics. No runtime code was changed.

## Follow-up: production transaction-body mapping audit (2026-10-28)

A source-level map was added to the [SDK API contract proposal](IMMORTAL-SDK-API-CONTRACT-PROPOSAL-2026-10-28.md), covering the explicit Issue/Reveal/Claim/Expire spending inputs, reference inputs, application-declared outputs and existing pre-submit checks.

The common adapter gate only requires the caller-declared protocol spending inputs to be a subset of the completed Lucid body. It does not classify any additional wallet/fee inputs, bind the full output/datum/redeemer map to the admission witness, or receive a phase-specific transition-intent record. This is intentional partly because Lucid may add balancing inputs/outputs, but it leaves an explicit classification and transaction-body-binding design task before production evidence wiring.

The safe next gate is to approve (not guess) per-transition fingerprint ownership, protocol-vs-wallet/fee input classification, expected output/validity predicates and a phase-separated pre-sign/post-submit evidence contract. This remains an engineering/design gap, not a claim that current submission paths are universally bound to canonical transition evidence. No protocol or runtime code changed.
