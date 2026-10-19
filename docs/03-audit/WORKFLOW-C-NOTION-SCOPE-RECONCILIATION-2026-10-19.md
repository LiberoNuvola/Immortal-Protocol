# Workflow C — Notion Scope Reconciliation & Exact-Head Evidence

**Date:** 2026-10-19  
**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Exclusive working branch:** `work/immortal-green-closure`  
**Implementation checkpoint for JEV freshness guard:** `254dcbf34757d34a750a860f46cc50ef7f3c01ab`  
**Purpose:** reconcile the operational fronts with the canonical Workflow C specification in Notion. This register is non-normative; it does not promote external workstreams into Workflow C merely because their workflows run on the same branch.

## 1. Notion sources and reconciliation result

1. [Workflow C — IMMORTAL V2 Autonomous Verification & Execution v0.1](https://app.notion.com/p/3fdc4454d6d581378702e9ae9d9fee85) — last edited 2026-10-18T11:13:11Z. This page defines C0–C5 and later adds C6–C10. Status in Notion: **OPEN / DESIGN / RECONCILIATION ONLY**. Its latest C6 findings say no ready-made chain-independent action/transition profile was found; C6 remains blocked and C7–C10 remain downstream open.
2. [IMMORTAL — Autonomous Verification Control Plane v0.1](https://app.notion.com/p/3e2c4454d6d5819cbec1c6edede714b3) — last edited 2026-10-18T20:30:56Z. The latest operational prompt recorded in the fetched page is for Integration Lab run #1906 on commit `13a06b8ec9f6a770b08f8f8d5f5ebe24612d4c5c`, whose registry overall result is **FAIL** and whose P2.8 ledger evidence gate is **FAIL**. This is older than the Oct 19 GitHub head and is not current execution evidence.
3. [2026-09-21 — IMMORTAL Multi-Front Workflow Checkpoint](https://app.notion.com/p/3e2c4454d6d5813f939a-ed777ba175b0) is historical context, not the authority for today's run outcomes.
4. [IMMORTAL / PRE-RICH — Governance Current State — GOV-28](https://app.notion.com/p/3e4c4454d6d581b8b65dc86ce89e49c0) records the governance lifecycle reconciliation. That workstream remains separate from Workflow C's declared C0–C10 fronts.

**Authority split:** Notion Workflow C supplies scope and unresolved design/evidence gates; GitHub branch/commit and completed Actions steps supply code and execution facts. A Notion prompt's insertion order is not evidence recency. The control-plane snapshot must be reconciled to the exact GitHub SHA and run timestamps before a later scheduled execution consumes it.

## 2. Canonical Workflow C fronts

### C0 — Inventory and dependencies
**IN SCOPE.** Align Notion, current branch/HEAD, CI, artifacts and evidence. Explicitly classify source/specification, local test, devnet, ledger evaluation and Preprod evidence. Do not create branches or duplicate existing JEV checks.

### C1 — Trust boundary
**IN SCOPE.** Bind producer inputs to source, network, contract/script, asset, datum/redeemer, version, canonical state and freshness; classify stale state, replay, equivocation and conflicting sources. A prompt warning is a guard instruction, not an implementation-level verifier.

### C2 — Independent verification
**IN SCOPE.** Reuse the existing B3 evidence/provenance architecture where suitable, while separating proof shape, cryptographic proof validity, source finality and semantic correctness. B3's boundary tests and packet schema are not themselves a real cryptographic witness. No wholesale merge of the divergent B3 branch.

### C3 — Autonomy and liveness
**IN SCOPE.** Establish the observable loop: retrieve newest valid prompt → bounded authorised execution or explicit decline → record exact result → next scheduled run consumes the new result without a user message. A passing prompt-generator test does not close end-to-end autonomy.

### C4 — PRE-RICH transaction economics
**IN SCOPE, RESEARCH / NO NEW POLICY DECISION.** Compare fee sponsorship, application balance/settlement and batching as hypotheses with separate measured cost vectors. The first acceptance fixture named by the Workflow C specification is the existing atomic SALE/MINT path through DApp → Adapter, observed on the ledger. Do not substitute Reveal, alter V3/Reveal semantics, or silently select a fee/refund policy.

### C5 — Acceptance evidence
**IN SCOPE.** Prove non-admissible, stale, malformed or contradictory input cannot force an economic transition; bind admitted pre-state, adapter inputs, observed post-state, transaction reference, artifact hashes, version and limitations. Distinguish unit, devnet, native ledger and Preprod evidence. No gate is GREEN based on documentation, compilation or a commit alone.

### C6 — Universal reference profile and action-space adequacy
**IN SCOPE / BLOCKED.** Notion's Oct 18 review says the approved normative corpus does not currently define a ready-made chain-independent `(S, A, Accept, Ω, T, Safe)` profile or substantive QNE action. The four V3 actions are application-specific and the restricted graph is non-viable under the audit's stated finite-capacity assumptions. The PRE-RICH lifecycle/QNE helper consumes caller-provided Ω witnesses and does not establish Ω soundness. Do not invent an action or disguise NoOp/rejection/SAFE STALL as one.

### C7 — Ω declaration and completeness
**IN SCOPE / BLOCKED DOWNSTREAM OF C6.** The profile must declare and justify all 13 fields of the existing Ω completeness contract. Do not narrow Ω to make a certificate pass.

### C8 — Concrete Kc and initial-state certificate
**IN SCOPE / BLOCKED DOWNSTREAM OF C6.** Requires a concrete profile, admissible S₀, χ(S₀)=1, appropriate CK/VC witnesses, and a non-empty Kc ⊆ K*. The existence theorem for K* or finite/random test results is not a concrete certificate.

### C9 — Independent certificate checker
**IN SCOPE / OPEN, DESIGN DEPENDENCY NOT YET SATISFIED.** The checker must recompute predicates from complete profile/certificate data and reject missing, stale, contradictory or producer-only boolean witnesses. Do not implement a checker around invented profile semantics.

### C10 — Reproduction and evidence record
**IN SCOPE / OPEN.** Bind a reproducible command, inputs, hashes, version, exact commit, result and limitations into the existing evidence ledger. Model proof, checker conformance, adapter conformance and deployment evidence remain distinct.

## 3. Reclassification of the previous A–G operational fronts

| Previous front | Relationship to Workflow C | Scope decision |
|---|---|---|
| **A — P2.8 / native Yaci decoder** | Supports C0/C1/C5 evidence integrity and the existing JEV registry, but native P2.8 qualification is a separate Cardano evidence gate. | **Supporting dependency, not a standalone exclusive C front.** Keep its result exact-SHA scoped. |
| **B — whole-program expiry / PA2 / PA7 / L1→L5** | A substantive PRE-RICH/economic lifecycle conformance investigation. It may inform C1/C5 when constructing acceptance evidence, but is not one of C0–C10's exclusive targets. | **Outside the exclusive C lane; preserve as a separate blocker.** Do not continue it under the guise of C6. |
| **C — Kernel Invalid-Class workflow** | A bounded kernel regression is useful evidence but does not provide the concrete universal Kc/Ω/action relation required by C6–C8. | **Supporting test only; not a C6 certificate.** |
| **D — Declaration / portability** | General protocol and adapter conformance, not named as an independent Workflow C front. | **Supporting CI; not a separate C front.** |
| **E — GOV-28** | Governance canonical-event/replay lifecycle conformance has its own requirements and status. | **Separate workstream. Do not mix it into C's autonomy/Kc closure.** |
| **F — Preprod / Reveal / integration** | C4 names SALE/MINT as the first transaction fixture. The Workflow C C6–C10 reference instance is explicitly chain-independent and separate from Cardano/Reveal. | **Reveal and deployment are outside the exclusive C lane. SALE/MINT observation is an in-scope dependency for C4/C5.** |
| **G — docs links / boundary / provenance** | Provenance and evidence recording are part of C0/C5/C10, but generic link-check CI is not its own C front. | **Use as evidence/support; do not equate link-check success with C closure.** |

## 4. Workflow C-specific implementation delta completed on 2026-10-19

The explicit C0/C3 gap highlighted in the Notion Workflow C page was the missing stale-prompt/freshness guard in the current branch's JEV prompt generator.

- Commit `fa8ad4cd56c3971cdbdf8af340bb4d857eb26642`: added two prompt instructions comparing prompt commit/ref/run against current branch HEAD and the newest relevant Actions runs, and warned that Notion insertion order is not execution recency.
- Commit `254dcbf34757d34a750a860f46cc50ef7f3c01ab`: added three focused regression assertions while preserving the existing shared-run-URL size regression test.
- [JEV Verification Registry Contract run #28](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39197937569), exact SHA `254dcbf34757d34a750a860f46cc50ef7f3c01ab`: **SUCCESS**. The prompt-generator test step passed, as did the registry contract's named steps.
- The prompt freshness mechanism here is an explicit guard in the generated operational instructions, not a cryptographic runtime attestation. End-to-end JEV autonomy remains **INCONCLUSIVE** until an unattended later iteration demonstrably consumes the newest prompt, inspects the matching current evidence, records its own result, and schedules/continues the next loop.
- Integration Lab run [#1909](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39197937539) on the same SHA was still in progress at this checkpoint; its JEV prompt-generation and later evidence-publication steps had not yet concluded.

## 5. Current scope status

| C front | Current state |
|---|---|
| C0 | **PARTIAL** — repo and exact-head CI reconciled; Notion's last registered prompt was stale relative to the Oct 19 GitHub head. |
| C1 | **PARTIAL** — stale-prompt warning added and tested; it is not a substitute for independent evidence validation/freshness enforcement. |
| C2 | **OPEN** — B3 supplies reusable verification/provenance patterns, but does not provide a current production cryptographic witness. |
| C3 | **PARTIAL / INCONCLUSIVE** — prompt freshness guard test passed; unattended prompt-consumption/result-registration loop not yet observed. |
| C4 | **OPEN / RESEARCH** — SALE/MINT DApp → Adapter observed acceptance evidence and sponsorship-vs-balance comparison remain distinct next gates; no fee policy is frozen here. |
| C5 | **PARTIAL** — exact-head JEV generator test passed; overall evidence packet and actual result registration must be checked from run #1909 before any higher status. |
| C6 | **BLOCKED** — profile/action semantics decision absent; do not invent a universal action. |
| C7 | **BLOCKED DOWNSTREAM** — Ω completeness depends on profile/perimeter. |
| C8 | **BLOCKED DOWNSTREAM** — concrete Kc/S₀/VC certificate unavailable. |
| C9 | **OPEN DOWNSTREAM** — checker depends on a concrete profile/certificate contract. |
| C10 | **OPEN** — evidence reproducibility/registration must bind actual completed execution and limits. |

**Next action:** observe the terminal results and generated artifacts of Integration Lab #1909 on the exact SHA above; reconcile the control-plane ledger only from actual step outcomes. Then continue C0/C3/C5 JEV loop acceptance. C6–C10 cannot be certified until the unresolved profile/action boundary is explicitly decided; no economic semantics, V3/Reveal, or branch topology is changed by this report.
