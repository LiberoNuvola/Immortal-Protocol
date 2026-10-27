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
