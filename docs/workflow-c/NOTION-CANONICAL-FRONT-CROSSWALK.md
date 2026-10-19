# Workflow C — Canonical Notion Front Crosswalk

**Status:** RECONCILIATION CONTROL / NON-NORMATIVE  
**Authorized branch:** `release/public-main-curated-2026-09-24`  
**Canonical control source:** [Workflow C — IMMORTAL V2 Autonomous Verification & Execution v0.1](https://app.notion.com/p/3fdc4454d6d581378702e9ae9d9fee85) (last edited 2026-10-18 11:13 UTC when checked during this reconciliation).

## Why this crosswalk is required

The Notion control page assigns the canonical C0–C5 numbers to **inventory/dependencies, trust boundary, independent verification, autonomy/liveness, PRE-RICH transaction economics, and acceptance evidence** respectively. The older repository file `C0-C5-SOURCE-MAP.md` used the same C0–C5 labels for a different set of technical review dimensions (state model, predicates, transition semantics, provenance and checking contract). Those labels cannot be treated as equivalent. This crosswalk makes the numbering unambiguous; the old file is retained as a technical source map and its headings are marked as local map indices below.

The canonical Notion page and the repository's constitutional/normative source hierarchy control scope and meaning. The branch's technical maps, code and tests are implementation/reconciliation evidence only. A file's name or local heading does not redefine the canonical workflow number.

## Canonical front register (authoritative numbering)

| Canonical front | Scope fixed by Notion | Existing branch artifacts that support it | Current disposition |
|---|---|---|---|
| **C0 — Inventory and dependencies** | Reconcile Notion, branch/HEAD, CI and evidence; distinguish source, tests, emulator, ledger and Preprod. | `C0-C5-SOURCE-MAP.md`, `C1-CANONICAL-STATE-FIELD-REGISTER.md`, `C2-PREDICATE-INVENTORY.md`, C10 exact-head packets. | **PARTIAL.** Exact branch/run evidence is reproducible; semantic source authority/conflict review and cross-environment separation remain ongoing. |
| **C1 — Trust boundary** | For each input, identify proposer, verifier, proof, decision owner and binding to network/script/asset/datum/redeemer/version/canonical state; handle replay, stale data, equivocation and conflicts. | `C1-CANONICAL-STATE-FIELD-REGISTER.md` maps state fields; `C2-PREDICATE-INVENTORY.md` maps predicate authority and input requirements; C10 packet records exact source hashes. | **PARTIAL / OPEN.** Field and predicate maps are not yet a full end-to-end trust-boundary proof. Asset/network/contract/input identity, freshness enforcement and adverse-source resolution must be bound for a selected profile. |
| **C2 — Independent verification** | Map existing B3 evidence; separate proof validity, source finality and semantic correctness; use adversarial fixtures. | `C2-PREDICATE-INVENTORY.md`; strict `validate-profile-manifest.mjs` structural rejection tests; C10 source/output hash catalog. B3 is an architectural source only; no wholesale transfer/merge. | **PARTIAL / NOT CERTIFIED.** The inventory and structural tests do not cryptographically validate a proof, establish source finality/canonicality, or prove economic semantic truth. Independent verifier and adversarial semantic twins remain open. |
| **C3 — Autonomy and liveness** | Inventory permissionless vs operator-gated transitions; record trigger, observable proof, action/outcome, timeout/finality and no-intervention behavior; AI/Strategy Explorer proposes but has no normative authority. | `C0-C5-SOURCE-MAP.md` technical transition material; `C3-AUTONOMY-LIVENESS-OBSERVABILITY-MATRIX.md`; JEV Control Plane record; exact-run workflow/artifacts. | **INCONCLUSIVE.** No reviewed evidence yet demonstrates an unattended scheduled iteration consuming the newest valid prompt, recording its result and continuing without a user message. This is not closed by a passing GitHub Actions job. |
| **C4 — PRE-RICH transaction economics** | Research fee sponsorship vs application balance/settlement and batching as hypotheses; distinguish TxFee, ExecutionCost, RequiredLockedValue and relayer compensation. First fixture is the existing atomic SALE/MINT DApp→Adapter path observed on ledger; no V3/Reveal changes. | Relevant adapter/economic architecture is upstream context; current C6 finite-checker CI is not C4 transaction-cost or ledger acceptance evidence. | **OPEN / RESEARCH.** No fee policy is frozen here; no cost comparison or qualified on-ledger SALE/MINT acceptance packet is claimed by the C6 finite-checker runs. |
| **C5 — Acceptance evidence** | Prove inadmissible/stale/malformed/conflicting inputs cannot force a transition; bind canonical pre-state and observed ledger post-state, TransactionRef, cost vector and reproduction. | C10 packet proves reproducibility of selected mechanical checker commands; `C1-CANONICAL-STATE-FIELD-REGISTER.md` and `C2-PREDICATE-INVENTORY.md` declare source gaps. | **OPEN / PARTIAL SUPPORT ONLY.** The current packet is not proof of DApp→Adapter admission or observed SALE/MINT ledger result, and does not prove the no-bypass condition. |
| **C6 — Reference profile and action-space adequacy** | Chain-independent `M=(𝒮,Act,A,Accept,Ω,T,Safe)`; a substantive accepted action and a viable witness. | `REFERENCE-PROFILE-CONTRACT.md`, `C6-RECONCILIATION.md`, manifest schema/validator, finite R1 gate. | **BLOCKED / NOT CERTIFIED.** Profile/action semantics cannot be invented; finite structural checks do not supply a viable action or non-empty Kc. |
| **C7 — Ω completeness and perimeter E** | Instantiate all 13 Ω contract elements, authority, environment perimeter, exclusions and completeness evidence. | `C7-OMEGA-WORKSHEET.md`, `16_OMEGA_COMPLETENESS_CONTRACT.md`, C2 predicate inventory. | **OPEN.** The worksheet is a checklist, not evidence of real perimeter/envelope completeness; narrowing Ω is not permitted. |
| **C8 — Initial state and non-empty Kc** | Concrete authoritative `S0`, `χ(S0)=1`, witness and VC2/VC3/VC6 discharge. | R1 certificate spec, non-vacuity specification and finite inventory checker. | **BLOCKED.** No current artifact independently establishes a valid non-empty profile-specific Kc. |
| **C9 — Independent certificate checker** | Recompute certificate predicates from canonical inputs; reject producer-only booleans or missing/stale/conflicting material. | Strict profile-manifest validator and adversarial structural tests; R1 finite check scripts. | **PARTIAL / MECHANICAL.** Structural and finite-inventory checks run, but no checker yet establishes the universal profile's economic predicates or Kc theorem. |
| **C10 — Reproducibility and evidence record** | Exact commit/profile/version, command, inputs/outputs, hashes, result, assumptions and limitations; register the artifact. | `build-workflow-c-mechanical-evidence.mjs`, its regression tests, C6 workflow and exact-run packets. | **PARTIAL / MECHANICALLY VERIFIED.** The configured run packet is self-described, command/output/source hashes are reproducible and artifacts have been independently checked. Model-certificate and deployment evidence remain absent. |

## Local technical-map crosswalk

The section labels formerly used in `C0-C5-SOURCE-MAP.md` are local technical dimensions, not the canonical Notion front numbers:

| Local technical dimension | Content | Canonical front(s) it supports |
|---|---|---|
| Technical map 0 — Scope and authority | Normative source hierarchy, claim boundary and profile perimeter | C0, C1, C5, C6–C7 |
| Technical map 1 — Canonical state representation | State schema, units, history, EEV and refinement | C1, C2, C5, C6, C8 |
| Technical map 2 — Predicate inventory | `Accept`, `Ω`, `T`, `Safe`, `χ`, `Wit`, CK/VC proof obligations | C1–C2, C5, C6–C9 |
| Technical map 3 — Transition semantics | Action domain, pre/post-state relation, complete successor relation | C2, C3, C5, C6, C8 |
| Technical map 4 — Evidence/provenance | Source, observation, version, verifier and digest bindings | C0–C2, C5, C9–C10 |
| Technical map 5 — Reproducible execution/checking | Pinned checker invocation, output and limits | C2, C5, C9–C10 |

**Important separation:** local technical map 3 is not canonical Workflow C3 autonomy/liveness; local technical map 4 is not canonical C4 economics; local technical map 5 is not canonical C5 acceptance evidence. They are supporting analyses only.

## Evidence checkpoint (2026-10-19)

- Canonical front numbering was checked against Notion's page dated 2026-10-18.
- Latest completed exact-head evidence before this crosswalk commit: [C6 R1 finite checker run #41](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39202009460), branch `release/public-main-curated-2026-09-24`, SHA `0eb03f8579dc1e67e5dcbb6568ccd98f57e97cb3`.
- Artifact `workflow-c-mechanical-evidence-39202009460-1` (ID `12163204857`) has SHA-256 `4e2e719595fd6d669080d2a9ccd4ce3a86b264cebc47ef4afc1f8f4f95c6b160`; downloaded and checked independently.
- That packet binds 41 source paths, six command records with exit status 0, and test results: manifest structure 6/6, finite R1/source-binding/projection/inventory 48/48, evidence-builder 7/7.
- Its classification remains `MECHANICAL_EVIDENCE_ONLY_NOT_PROFILE_CERTIFICATION`; the inventory returns `closureEligible=false`. This is source/packet integrity, not protocol GREEN.

## Rule for future updates

Update the canonical-front register using Notion's C0–C10 numbering. Technical maps may subdivide work but must not reuse the canonical front numbers as if they were identical. Do not transfer a status from one canonical front to another merely because the same source or CI run supports both.
