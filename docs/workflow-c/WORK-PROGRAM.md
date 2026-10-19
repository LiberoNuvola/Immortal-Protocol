# Workflow C — Work Programme and Exit Gates

This file tracks the work programme. It is not a new normative specification.

| Gate | Deliverable | Required evidence | Current disposition |
|---|---|---|---|
| C0 | Source-of-truth and scope map | Referenced normative artifacts and conflicts recorded | Reconciliation required; no normative changes authorized |
| C1 | Canonical reference state model | Field definitions, units, ownership and serialization contract | Reuse existing IMMORTAL state artifacts; verify alignment |
| C2 | Predicate inventory | Exact predicates, domains, assumptions and dependencies | Must be derived from normative sources, not invented |
| C3 | Transition semantics | Explicit action domain, preconditions, postconditions and costs | Open; no complete universal relation established by examined kernel |
| C4 | Evidence/provenance contract | Source, version, checkpoint, derivation, verifier and digest binding | Reuse B3 evidence-boundary patterns without claiming proof validity |
| C5 | Independent execution contract | Deterministic command, pinned toolchain, canonical input/output | Design/reconciliation only |
| C6 | Reference profile and action-space adequacy | Profile + explicit transition relation + non-vacuity argument | **BLOCKED / NOT CERTIFIED** |
| C7 | Ω completeness and perimeter E | All 13 elements, fixing authority, E and completeness rationale | Open; must bind to normative source |
| C8 | Initial state and non-empty Kc | Admissible S0, χ(S0)=1, witness/certificate and proof obligations | Open; no concrete Kc witness discharged |
| C9 | Independent checker | Checker recomputes claims from canonical inputs; adversarial tests | Structural manifest validation and adversarial tests wired into C6 CI; exact-head structural run passed; economic predicate checker remains separately bounded and does not authenticate profile semantics |
| C10 | Reproducibility packet | Commit, command, inputs, output, hashes, result, limitations | Open; packet must be generated from the actual checker run |

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

