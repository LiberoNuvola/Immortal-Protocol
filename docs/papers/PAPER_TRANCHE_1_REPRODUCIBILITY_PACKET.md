# Paper Tranche 1 — Reproducibility Packet Register

**Status:** P3 partial — one bounded unit-test result is recorded and source-pinned; the release packet is NOT closed and no native-ledger evaluation is certified by this file.
**Workstream:** WORKSTREAM A — V1 + Paper Tranche 1.
**Branch:** work/immortal-green-closure.
**Purpose:** define the packet structure required to reproduce the manuscript's bounded claims without promoting historical, simulated, fixture-based, or undocumented results into current deployment evidence.

## 1. Release identity

Complete only after the source snapshot and evidence artifacts have been collected and reviewed.

| Field | Required value | Current status |
|---|---|---|
| Manuscript version | Exact version and content hash | OPEN |
| Traceability matrix | Exact commit and blob SHA | OPEN until release snapshot |
| Repository | LiberoNuvola/Immortal-Protocol | Recorded |
| Evaluation branch | Exact branch used for all reported results | Must be verified at packet freeze |
| Evaluation commit | Full immutable commit SHA | OPEN |
| Normative corpus | Paths and SHA-256/blob identifiers for every cited normative artifact | OPEN |
| Toolchain | Exact compiler, package manager, runtime, ledger evaluator and dependency versions used | OPEN |
| Network context | Network name, observation time/slot, endpoint/client version, where applicable | OPEN |
| Packet manifest | Machine-readable manifest with artifact paths, hashes, claim IDs and evidence class | OPEN |

Do not use a moving branch name as the sole identifier for a reproducibility claim. Preserve the full commit SHA and bind each artifact to it.

## 2. Claim-to-artifact register

Use the claim IDs in PAPER_TRANCHE_1_TRACEABILITY.md. Add one row per artifact, not merely one row per test suite.

| Claim ID | Artifact / path | Command or collection procedure | Source commit | Artifact SHA-256 | Outcome | Evidence class | Reviewer note |
|---|---|---|---|---|---|---|---|
| C1 | Formal corpus and verification status | Record exact, reproducible inspection/build procedure if applicable | OPEN | OPEN | OPEN | MATHEMATICAL PROOF / NORMATIVE | Mathematical baseline does not certify implementation |
| C2 | Safety/progress theorem and residual-obligation sources | Record exact source artifact and verification procedure | OPEN | OPEN | OPEN | MATHEMATICAL PROOF | Do not recast as a liveness test |
| C3 | Economic kernel and conservation specification | Record exact test command and inputs for any mechanical claim | OPEN | OPEN | OPEN | NORMATIVE / MECHANICAL, as applicable | Conservation does not establish profile exhaustiveness |
| C4 | Bounded transition/refinement tests | Record exact test name, command, full log and source snapshot | OPEN | OPEN | OPEN | MECHANICAL / TEST | Historical run evidence must remain labelled historical |
| C5 | Production-path Reveal ledger witness | Transaction hash, exact CBOR, consumed UTxOs, epoch-specific protocol parameters, era/epoch timing, SystemStart, evaluator version and full result | OPEN | OPEN | OPEN | LEDGER EXECUTION WITNESS or OPEN | Do not mark complete until a qualifying submitted transaction is evaluated |
| C6 | Beacon trust model and version-specific evidence | Exact B1/B3 specification, deployment artifact and relevant test/evidence | OPEN | OPEN | OPEN | NORMATIVE / MECHANICAL / PREPROD, as applicable | B3 is not achieved by architecture or test scaffolding alone |
| C7 | External audit/readiness statement | Link exact current readiness statement | OPEN | N/A | Not supported as a positive claim | OPEN / NOT PROVEN | Do not claim independent external audit or mainnet readiness |
| C8 | Profile, environment, valuation and adapter obligations | Bind each obligation to its evidence or explicit unresolved state | OPEN | OPEN | OPEN | Mixed; classify each artifact separately | Do not infer profile completeness from universal theory |

## 3. Reproduction record template

For every executed command or collection procedure, preserve a separate record containing:

- Record ID and claim ID(s).
- Purpose and exact repository commit SHA.
- Working directory and exact command.
- Environment variables required (names and non-secret configuration only; never publish credentials).
- Toolchain and dependency versions.
- Inputs, fixture IDs and transaction IDs.
- Start and end time (UTC).
- Exit code and outcome.
- Complete stdout/stderr artifact paths and SHA-256 values.
- Evidence class: proof, normative, test, simulation, observation, or ledger execution witness.
- What the result supports and what it does not support.
- Known environment failures or missing prerequisites.
- Independent reproduction status.

A missing log, exit code, commit binding, or input identity must be recorded as missing; do not reconstruct it from a summary.

## 4. Controlled rejection — executed, bounded unit-test evidence

The existing mismatch case was selected and executed:
- Test: `rejects an inadmissible refinement instead of normalizing it as canonical` in `src/__tests__/differentialActionReplay.test.ts`.
- Mutation: frozen prize = 250 subunits; settlement = 249 subunits.
- Expected behavior: `claimRefinementAdmissible` returns `false`.
- Implementation locus: `PRE-RICH/src/PreRichClaimRefinement.ts`, exact settlement equality check.
- Application-policy anchor: `PRE-RICH/docs/GAME-ECONOMY.md`, §10, crystallized payout immutability.
- Targeted command: `npx vitest run src/__tests__/differentialActionReplay.test.ts`.

A dedicated workflow now exists at `.github/workflows/paper-tranche-1-controlled-rejection.yml`. On pushes to this branch that touch the relevant test/source/lock/workflow files, it runs the targeted Vitest suite and uploads an artifact containing the test log, exit code, exact commit SHA, Node/npm/Vitest versions, and SHA-256 hashes of the lockfile and key sources. It can also be started manually with `workflow_dispatch`.

**Execution status: PASS for the targeted test suite; artifact inspected through the Actions job log.** Run [39454356498](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39454356498), run number 1, completed successfully on branch `work/immortal-green-closure`, commit `9ad8ccd7e1dd1d6a9c9846106fcdf836f58a06ea`. The log records `npm ci` success, Node `v22.23.3`, npm `10.9.9`, Vitest `1.6.1`, 1 test file passed, 4 tests passed, and exit code 0. The uploaded artifact is [paper-tranche-1-controlled-rejection-9ad8ccd7e1dd1d6a9c9846106fcdf836f58a06ea](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39454356498/artifacts/12278239769); artifact ZIP SHA-256: `34201119240fde4aabe0af4afcc26837be7fe42366417f76f9c53cce7d398de7`. The source metadata includes lockfile SHA-256 `cc0127455cef590dede303ddfc1d1321e52914a96d595e6be015baaffad58ced`, test SHA-256 `9666de0b43e1a418c0d1364ff5eddae15f2009b72eb7f9337730e3d87dcce6b7`, and claim-refinement SHA-256 `6eb126587497e53865ee69556f66fca7e8f54df9d8482ae5f04239719928f667`.

The `npm ci` log also reported 7 dependency audit findings (2 moderate, 3 high, 2 critical). No automated dependency upgrade or lockfile mutation was performed in this evidence-only step; these findings require a separate scoped triage before making any dependency-security claim.

The recorded pass applies to the complete four-test Vitest file, including the 250-versus-249 mismatch rejection assertion. It is unit-test evidence only; it is not an emulator, Preprod, or native Cardano ledger witness. The overall P3 packet and Reveal witness gate remain open.

## 5. Source snapshot pin and release-freeze obligations

The current source snapshot used for cross-document review is commit `2be7c4616d427021a2e5ab67719fab4d05ee50e2`, tree `5c62b74d37198d7f0313a805bcee990afed47db3`, on `work/immortal-green-closure`. The machine-readable manifest records Git blob SHAs for the manuscript, matrix, packet, threat model, normative kernel, conservation rules, application policy and certification dossiers. The controlled-rejection policy anchor is `PRE-RICH/docs/GAME-ECONOMY.md`, Git blob SHA `41f69f7c7e7d31a776a92dcd942a3098848947fb` in that snapshot.

This is a pinned source snapshot, **not a final publication release**. The manifest was subsequently updated in commit `b25127dc690daf6a00013cbe9b8eff41dbbb3234`, so its current blob does not belong to the earlier snapshot. A final bundle must name the snapshot/archive explicitly and preserve all cited artifacts.

The controlled-rejection GitHub artifact expires on **2027-01-18** (90-day retention from the run). Archive the artifact and complete job logs into the publication bundle before expiry. Git blob SHAs identify repository objects and must not be mislabeled as SHA-256 checksums of raw file bytes.

## 6. Native-ledger witness gate

A build, emulator result, local Yaci trace, fixture, workflow definition, or live wallet/pool observation is not a substitute for the required native-ledger witness.

For a production-path Reveal claim, the packet must bind, at minimum:

- The submitted Cardano Preprod transaction hash.
- The exact transaction CBOR and its hash.
- The exact consumed UTxOs and relevant datum/redeemer context.
- The applicable epoch-specific protocol parameters.
- Era/epoch timing and SystemStart.
- Validator/script artifacts and hashes.
- Native cardano-ledger evaluator version and complete result.
- Source commit and construction/evaluation procedure.
- Classification confirming this is the intended production path, not a generated test-policy transaction.

**Current status: OPEN pending a qualifying witness and successful native evaluation.** Do not change V3 or Reveal semantics as a documentation-only attempt to satisfy this gate.

## 7. Final packet acceptance checklist

- [ ] Manuscript, matrix and cited code/spec artifacts are bound to one exact commit snapshot or each historical snapshot is explicitly distinguished.
- [ ] Every reported test has an exact command, inputs, exit code, full log and hash.
- [ ] Historical run 36221378619 / run 44 at head ae4fcc020dff326e8a3ea75c0e07e380a5451bc6 remains labelled as historical evidence; it is not relabelled as current-head evidence.
- [ ] At least one already-specified controlled rejection is captured and reproducible.
- [ ] Any native-ledger execution claim has a qualifying submitted production-path transaction and exact ledger context.
- [ ] Negative, unavailable and unexecuted evidence is included, not omitted.
- [ ] The packet manifest is machine-readable and binds artifact hashes to claim IDs.
- [ ] A reviewer can reproduce the bounded claims from published instructions without secrets or undocumented local state.
- [ ] Manuscript claims are rechecked against the final evidence matrix before freezing.
- [ ] Final manuscript, matrix, manifest and packet archive have exact hashes.

## 8. Primary references

- Machine-readable evidence manifest: `evidence/PAPER_TRANCHE_1_EVIDENCE_MANIFEST.json` (provisional; not a frozen release manifest).
- Paper Tranche 1 draft: IMMORTAL_EVIDENCE_BOUNDED_ECONOMIC_SAFETY_DRAFT.md
- Claim-to-evidence traceability matrix: PAPER_TRANCHE_1_TRACEABILITY.md
- Verification Status: ../03-audit/VERIFICATION_STATUS.md
- Residual Obligation Register: ../03-audit/RESIDUAL_OBLIGATION_REGISTER.md
- Preprod Conformance Dossier: ../02-certification/IMMORTAL-PREPROD-CONFORMANCE-DOSSIER.md
- End-to-End Evidence Dossier: ../02-certification/END-TO-END-EVIDENCE-DOSSIER.md
- P2.8 Ledger Evaluation Dossier: ../02-certification/P2.8-LEDGER-EVALUATION-DOSSIER.md

**Scope guard:** this register is a template, not a completed reproducibility packet. It does not assert that tests were rerun, a controlled rejection was captured, or a native-ledger witness exists.
