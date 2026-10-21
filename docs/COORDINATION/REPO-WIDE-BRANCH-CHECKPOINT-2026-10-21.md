# IMMORTAL / PRE-RICH — Repository-Wide Branch & Evidence Checkpoint

**Source-tree snapshot:** 2026-10-21; branch tips captured through 14:29 UTC (16:29 Europe/Rome), listed in Section 0. The checkpoint was committed and linked from Notion after that tree census.  
**Checkpoint branch:** work/immortal-green-closure  
**Classification:** coordination/audit record only; not a normative specification, deployment approval, merge authorization, or protocol-semantic decision.

## 0. Executive state

This audit recursively inventoried the Git tree of all **25 existing branches**, including tracked path, blob SHA and file size, then compared branch paths and blob identities. Full Git tree responses for main, work/immortal-green-closure and work/b3-materios-provenance-evidence were non-truncated. Targeted content inspection covered the highest-impact active-front records, workflow definitions, issue/PR metadata and Notion checkpoints.

**Coverage limit:** the recursive census is exhaustive for tracked file identity and branch deltas. It is not a claim that every line of every historical file has already received a fresh semantic code review. The branch matrix classifies each ref, while the workstream sections identify what is implemented, what has actually been evidenced, and what remains open. Do not translate “file exists” into “feature proven.”

### Current source anchors

| Ref | HEAD at snapshot | Commit time (UTC) | Tracked files | Role |
|---|---|---|---:|---|
| main | 97b09a38742098f17a61eb07734c401aeedccc06 | 2026-10-21 05:37:43 | 756 | public/default baseline |
| work/immortal-green-closure | b68c1bd5ae4289df700847b406214dc6a9b4d6a2 | 2026-10-21 14:29:49 | 937 | active cross-system closure / checkpoint branch |
| work/b3-materios-provenance-evidence | 2778d3e107f45ee15157fff8ef894905a72070ea | 2026-10-21 12:50:37 | 997 | active Workflow B / Materios evidence branch |
| b1-hardening | c561393e7eb842529aeaa272377e5afe0138d085 | 2026-10-17 16:38:44 | 359 | isolated B1 experiments / hardening research |
| feat/pre-rich-game-ui | 9ba77f967fa8f40395bef8c6cee77bf449d94dad | 2026-10-07 04:29:30 | 759 | DApp presentation/UI lane |

**Do not promote either active work branch wholesale into main.** Tree comparisons found:
- Green vs main: 549 identical path/blob pairs; 193 green-only paths; 12 main-only paths; 195 shared paths with different blob SHAs.
- B3 vs main: 561 identical path/blob pairs; 254 B3-only paths; 13 main-only paths; 182 shared paths with different blob SHAs.
- Green vs B3: 750 identical path/blob pairs; 99 green-only paths; 159 B3-only paths; 88 shared paths with different blob SHAs.

These counts are not merge-safety metrics. A shared filename with different content is a conflict to inspect. A branch-only file is not necessarily ready to port. Transfers must be scoped and verified against the exact target HEAD.

## 1. Operating rules

1. Normative hierarchy stays: IMMORTAL Constitution → Economic Kernel → Economic Algorithm → architecture specifications → Cardano Adapter specification → PRE-RICH Constitution → application specification → Game Economy rules → implementation → tests → evidence. This checkpoint is a navigation and coordination record, not an authority above those sources.
2. Record separately: source present; focused tests pass at an exact SHA; local/emulator/devnet evidence; Preprod evidence; confirmed on-chain effect; production/mainnet qualification.
3. A passing harness, compile, uploaded artifact, approval document or workflow setup alone does not prove a real ticket mint or a trustless chain proof.
4. No branches were created or deleted in this audit. Historical audit refs stay as forensic evidence until a separate reviewed cleanup decision.
5. No wholesale merge or cherry-pick between the two active work branches. For each transfer, record source commit/blob, target commit/blob, reason, regression test, completed run and the limit of the result.
6. Do not change V3 or Reveal semantics, economic rules, constants, thresholds, fees, or Materios authority-selector semantics as part of this organizational work. Do not invent missing policy decisions.
7. Preserve the USDM requirement: it is the accounting/pricing unit. Other assets may cover a payment only where the existing authoritative on-chain valuation proves their USDM value. An ADA/USD or Pyth quote is not automatically a USDM-denominated quote.

## 2. Complete inventory of the 25 existing branches

Counts refer to tracked file blobs on each observed branch HEAD, not files changed since main. The classification is an operational recommendation; it is not authorization to delete or merge any ref.

| Existing branch | HEAD (short SHA) | Tip date (UTC) | Files | Classification and assignment |
|---|---|---|---:|---|
| audit/adapter-sale-conformance | 272413a38bb8 | 2026-09-21 | 331 | Historical SALE boundary test snapshot. Preserve as evidence; compare only. |
| audit/claim-b1-conformance | 1e64ec9f31ba | 2026-09-20 | 328 | Historical B1 Claim conformance snapshot; no fresh implementation work here. |
| audit/kernel-invalid-class-fail-closed | 50e80bd17874 | 2026-09-21 | 329 | Historical fail-closed kernel CI fixture; selectively reuse tests as evidence/input. |
| audit/p2-8-b1-baseline-size-2026-09-21 | d73f39199ae5 | 2026-09-21 | 329 | Historical P2.8 baseline/transaction-size measurement; do not replay without a new hypothesis. |
| audit/p2-8-b1-cardano-ledger-runner | 9ec325e1ca7b | 2026-09-26 | 563 | P2.8 runner and typed-context diagnostic snapshot; reference implementation, not current target. |
| audit/p2-8-b1-inline-haskell-uplc-diagnostic-2026-09-21 | b7cb39a70875 | 2026-09-21 | 330 | Historical Haskell UPLC diagnostic; preserve provenance/logs. |
| audit/p2-8-b1-inline-runtime-diagnostic-2026-09-21 | f84b37ad14d4 | 2026-09-21 | 330 | Historical runtime diagnostic parallel to the Haskell UPLC branch. |
| audit/p2-8-b1-lucid-evolution-2026-09-21 | ace1e78bca47 | 2026-09-21 | 331 | Historical Lucid/Scalus evaluator diagnostic; provider evaluation is not native-ledger execution. |
| audit/p2-8-b1-reference-budget-diagnostic-2026-09-21 | 259d7dc21f13 | 2026-09-21 | 330 | Historical reference-script/budget diagnostic; retain as diagnostic record. |
| audit/p2-8-b1-reference-scripts-2026-09-21 | c55b6e82d765 | 2026-09-23 | 459 | Older reference-script and CAES research snapshot; do not merge wholesale. |
| audit/p2-8-reveal-size-2026-09-21 | 3afb09b341e4 | 2026-09-21 | 328 | Historical Reveal transaction-size diagnostic; use for byte-size regression reference only. |
| b1-hardening | c561393e7eb8 | 2026-10-17 | 359 | Aegis prototypes / hardening experiments. Keep research labelled; demonstration parameters are not approved policy. |
| backup/main-before-curated-promotion-2026-09-24 | d861329e4ff8 | 2026-09-24 | 199 | Historical backup. Read/restore if needed; no active development/promotion. |
| copilot/fix-real-preprod-reveal-job | 3c845c20314f | 2026-10-21 | 756 | Tree was blob-identical to main at snapshot. The branch name alone does not evidence a distinct fix. |
| feat/pre-rich-game-ui | 9ba77f967fa8 | 2026-10-07 | 759 | UI lane for issue #22. Restrict current work to presentation/assets/UX; isolate protocol/provider diffs. |
| fix/cardano-lab-yaci-info | b8530c26ab40 | 2026-10-10 | 751 | Narrow Yaci/CI diagnostic snapshot. Source for selective validation, not a general merge target. |
| main | 97b09a387420 | 2026-10-21 | 756 | Public baseline. Promote only scoped reviewed PRs with exact-head evidence. |
| merge/workflow-b-closed-main | 7bca8d91b65d | 2026-10-21 | 762 | Head of open draft PR #35. Keep as governance-bootstrap sandbox/draft; not the canonical B3 lane. |
| ops/b2-preprod-new-workflow | 30f7cb46b6d7 | 2026-10-14 | 755 | Historical B2/JEV workflow experiment; provenance/reference only. |
| ops/b2-preprod-zero-input-dispatch | 151834415a1d | 2026-10-09 | 749 | Historical zero-input dispatcher variant; do not revive as a parallel implementation. |
| ops/expose-b2-preprod-dispatch | b2a1a1471328 | 2026-10-09 | 749 | Historical dispatch exposure variant; compare only for any missing narrowly-scoped change. |
| release/issue-admission-boundary-squash | 5b04f0c005bc | 2026-10-10 | 751 | Historical focused Issue Admission squash/CI reference; newer work exists elsewhere. |
| release/public-main-curated-2026-09-24 | 04f2684244dd | 2026-10-19 | 489 | Older curated snapshot with useful Workflow C maps/schema/tests. Reference or selectively port documentation; not a merge target. |
| work/b3-materios-provenance-evidence | 2778d3e107f4 | 2026-10-21 | 997 | Active B3/Workflow B lane: Materios finality, authority provenance, historical storage proof acquisition/verification and boundary conformance. |
| work/immortal-green-closure | b68c1bd5ae42 | 2026-10-21 | 937 | Active cross-system closure and canonical checkpoint host: B1/EEV/direct-USDM, B2/Issue, JEV, P2.8, Workflow C/papers, Pyth quote diagnosis and portability. |

### Branch hygiene conclusions

- The September P2.8/Reveal audit refs are evidence snapshots, not parallel candidates for merging.
- The ops/backup/release/fix refs remain historical unless a specific required file is missing from both active work branches and passes its target tests.
- The copilot branch is redundant at file-tree level with main in this snapshot; no task assigned until a distinct delta is established.
- The UI branch contains older provider/Issue/V3-adjacent source changes as well as UI assets. Keep new tasks UI-only unless those code differences get an independent review.
- b1-hardening stays isolated research. Do not copy experiment thresholds into the normative economic kernel.
- No deletion is proposed here.

## 3. Cross-branch conflicts requiring file-level review

The active branches overlap on critical boundaries. Highest-risk files include:
- .github/workflows/issue-admission-boundary-ci.yml
- .github/workflows/materios-b3-execution-verifier.yml
- .github/workflows/materios-b3-real-fixture-capture.yml
- .github/workflows/materios-evidence-conformance.yml
- .github/workflows/pre-rich-b1-eev-approval.yml
- Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts
- PRE-RICH/onchain/GenesisRegimeCarrier.hs
- plutus/B1PrizePool.hs
- poc/materios-checkpoint/package.json and src/rpc.ts
- poc/materios-checkpoint/src/capture-anchor.ts
- poc/materios-execution-verifier/Cargo.toml, src/lib.rs and src/storage.rs
- poc/materios-grandpa/src/capture-real-witness.ts
- src/preRichIssueAdmissionBridge.ts and its tests.

For each conflict, compare source and target blob hashes, inspect the diff and run focused tests on the destination HEAD. Do not pick “newest” content without verifying semantics. Keep the B3 proof trust boundary independent from first-ticket readiness.

## 4. Work allocation and closure predicates

### W0 — Repository coordination / canonical checkpoint
**Target:** work/immortal-green-closure. This document is the single repo-wide coordination checkpoint. Update it only when exact commit/run/evidence changes a status. Keep Notion Control Center as an index, not a competing full inventory.

### W1 — First real PRE-RICH Issue, B1 EEV and direct-USDM
**Target:** work/immortal-green-closure.  
**State:** guarded Issue flow, focused tests and an EEV approval workflow artifact exist; no verified end-to-end Issue from the intended user's wallet is established. Readiness record points to successful approval run [39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) on main SHA 97b09a...; that approval is not automatically bound to today's live UTxOs or candidate transaction.

**Next sequence**
1. Re-observe exact Counter, qualified B1 PrizePool, canonical USDM asset identity, Oracle State, B2 control singleton, V3 carrier and reference-script identity.
2. Bind approval to exact current source UTxOs, source slot/time, contract version and derivation version.
3. Verify actual DApp runtime endpoint and live /issue-admission server/upstream signed response. Source code, factory, or /healthz alone does not qualify production wiring.
4. Capture the completed Lucid body and prove the real Treasury output meets Cardano minimum-UTxO constraints and MintPolicy USDM-price equality. The readiness note identifies a builder/valuation mismatch: requested ADA payment 1,000,000 lovelace, reference min-UTxO parameter 1,600,000, Genesis target 100 USDM subunits. Do not submit a real first Issue until this is resolved with exact transaction evidence.
5. Bind wallet signature, final transaction identity, ledger inclusion, NFT issuance and post-state to an independent reconciliation.

**Closure evidence:** exact-head tests; exact current UTxO/asset identity; valid signed authority response; completed body; wallet-signed transaction; confirmed ledger transaction; independent post-state. Until then: **BLOCKED / NOT ISSUED**.

### W2 — Pyth price authenticity and asset-unit conversion
**Target:** work/immortal-green-closure.  
**State:** design/research only, not approved or implemented in production. Current Haskell MintPolicy values the Treasury output using the legacy Oracle State quote. Verifying a Pyth update in a separate consumer is not enough if MintPolicy can value that output using another quote. A transaction-bound quote carrier is a candidate only.

**Normative choice remains OPEN:** inspected sources do not establish 1 USDM = 1 USD and do not provide a canonical USD/USDM ratio. USD/ADA cannot silently be relabelled USDM/ADA; do not round Pyth raw price/exponent prematurely to an integer legacy quote.

**Next:** only after the source-of-truth hierarchy decides the currency relationship, define typed raw-price/exponent and exact rational conversion; bound exponent/resource assumptions; add adversarial source substitution, replay, stale data, duplicate-feed, units and rounding tests; prove that the Haskell V2 MintPolicy consumes the exact transaction-bound verified quote. Do not use the experiment to bypass direct-USDM EEV.

**Closure:** approved unit/source contract, Aiken/Haskell/TypeScript parity, negative vectors and actual ledger accept/reject evidence. Until then: **RESEARCH / DECISION OPEN**.

### W3 — B2 control state and Issue Admission
**Target:** work/immortal-green-closure.  
**State:** guarded provider/consumer and negative tests exist. Historical Issue Admission audit classifies the boundary as partial: declared protocol inputs must exist in the completed transaction, but extra wallet/fee inputs remain incompletely classified and final body identity is not bound into the admission witness. Freshness/current-time authority is not governed; evidence digest and independent post-state checks remain open. Live server configuration is not proved just by source code.

**Next:** verify actual provider deployment and endpoint configuration, classify all final transaction inputs/outputs after Lucid completion, bind body identity and evidence digest, and address freshness only via an explicit source-of-truth decision. No invented max-age.

**Closure:** exact-head boundary CI, adversarial extra-input tests, valid signed response for exact current state, confirmed Preprod Issue and independent state reconciliation.

### W4 — JEV autonomy / Workflow C
**Target:** work/immortal-green-closure.  
Workflow C is the Notion spec “Workflow C — IMMORTAL V2 Autonomous Verification & Execution v0.1,” explicitly **DESIGN / RECONCILIATION ONLY — OPEN**. It is not a single GitHub Actions workflow with a formal branch destination. Green is its working reconciliation reference, not merge authorization.

JEV is **INCONCLUSIVE** until one unattended cycle is observed: prompt retrieval → bounded execution or safe decline → result registration with exact run/commit → next scheduled cycle consumes the latest prompt and records its own result without a user message. Run [39201592387](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201592387), attempt 2, failed prompt generation with ENOENT; separate evidence registration cannot claim the full loop.

**Next:** check whether freshness-guard candidate 05bee2e4a0fafe00568b08dc963e5b287196d2f1 is present and tested on current green HEAD; reconcile with ingress provenance fix 765af53acec61746af0dc9117db93bbe8bbffe77; run focused tests and one completed workflow, then observe the next scheduled unattended iteration. No autonomy claim from setup, upload, or user-triggered execution.

### W5 — P2.8 native Cardano runner / integration lab
**Target:** work/immortal-green-closure.  
Sources exist: audit/cardano-ledger-runner/Main.hs, TypedPacketDecode.hs, audit/cardano-integration/materialize-p28-ledger-context.mjs and a dedicated workflow. Prior investigation found Conway PParams normalization missing; commit 68cccb4b421d3d776469567afb99027eabc024f6 addressed that area. Run 39201592387 attempt 2 failed in JEV prompt generation, so it is not evidence that every P2.8 stage passed on current HEAD.

**Next:** classify the first failing step from the latest completed current-head lab run. Keep SAFE_STALL when no real transaction packet exists. Raw context capture is not typed decoder success. Mark evidence as fixture, local Yaci ledger, Preprod or mainnet explicitly. Do not touch V3 or Reveal semantics to make a gate pass.

### W6 — B3-A Materios finality / authority provenance
**Target:** work/b3-materios-provenance-evidence.  
**State:** **OPEN / FAIL-CLOSED**. Current HEAD 2778d3e107f45ee15157fff8ef894905a72070ea. Latest P2P probe [#9](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951) failed as expected when no raw FRNK/GRANDPA justification was acquired. It hash-bound five historical headers including block 1,856,408, but acquired zero raw justifications; 13 other candidates did not return a block object during the bounded probe. Warp sync was classified stalled at block 97069. This does not prove every possible source lacks the data. WebSocket probe [#6](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39595137122) passed for capability/classification only, not finality proof.

**Next:** do not repeat the same public RPC/single-bootnode probe without changed input. Require a confirmed proof-retaining archive/full-state endpoint, a distinct usable peer/service with identity, or operator/upstream evidence. Then acquire raw justification, bind target header, validate genesis-rooted ordered authority transitions through the existing verifier to VerifiedAuthoritySetTransition. Do not weaken the verifier or alter Materios selector semantics.

### W7 — B3-B historical storage proof
**Target:** work/b3-materios-provenance-evidence.  
**State:** acquisition collector and offline verifier path exist; real historical proof remains blocked by retained historical state availability at target block 1,856,408. Required binding is exact header StateRoot, exact historical Anchors[anchor_id] key and value, and independent trie-proof verification by the pinned Rust verifier. B3-B storage-proof validity is separate from B3-A canonicality/finality.

**Next:** acquire an archive source meeting the existing preflight contract: historical header StateRoot, non-null exact storage value, non-empty state_getReadProof bound to the exact block hash. Verify offline. Receipt-to-anchor identity does not establish finality.

### W8 — Workflow B and contribution gate
**Workflow B target:** work/b3-materios-provenance-evidence.  
The workflow file workflow-b-boundary-conformance.yml is present on B3. Run #406 succeeded across its 48 registered harnesses. This is evidence for that harness set, not a real Materios justification, deployment, JEV autonomy or end-to-end PRE-RICH Issue.

**PR #35:** [draft bootstrap](https://github.com/LiberoNuvola/Immortal-Protocol/pull/35), head branch merge/workflow-b-closed-main, SHA 7bca8d91b65d7af1261d8b7cc4f28f496a73fcba. **Keep in draft.** Its merge guard requires governance control-plane review, deliberate main branch-protection setup and later trusted-base evaluation. The PR also changes the V3 carrier mint-policy source/compiled identity for future deployments; it is not merely documentation/CI. Supporting harness tests are not equivalent to a completed end-to-end ledger proof.

**Next:** review exact 14-path diff and trusted-base preflight; verify exact-head lab run 39591157626 and invalid-case results; reconsider only after governance review and named required checks have actually been configured.

### W9 — Workflow C universal profile, paper and portability
**Target:** work/immortal-green-closure.  
Workflow C maps/schema/tests also exist in curated historical branch release/public-main-curated-2026-09-24; use them selectively, not by merging the old snapshot. Universal Kc/Ω reference-profile certification, the Pyth unit/source decision and unattended JEV cycle remain open.

Paper Tranche 1 is **NOT READY TO SUBMIT**: P3 reproducibility/release snapshot, P5 related-work screening, native Reveal ledger witness and dependency triage remain open. Controlled-rejection run [39454356498](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39454356498) is bounded unit-test evidence only.

**Next:** reconcile cited blobs into one named release snapshot, archive and verify artifacts, update claim-to-evidence mappings, maintain non-claims. Do not claim universal safety, full implementation conformance, production solvency or mainnet readiness without exact proof.

**Portability issue #21:** non-blocking chain-neutral research in green, reusing existing portability conformance workflow/vectors. Do not change economic constants, replace Cardano or fold B3 into portability. A second adapter is not complete until it executes the same normative vectors with independent evidence.

### W10 — PRE-RICH DApp UI
**Target:** feat/pre-rich-game-ui for issue #22.  
**Scope:** game/presentation UX, artwork/assets, copy/layout, accessibility and responsive behavior. This branch contains older provider/Issue/V3-adjacent code changes alongside UI assets; do not package them into a UI patch without independent review.

**Closure:** UI build/tests and visual acceptance on its own ref, wallet signing and fail-closed behavior preserved. Any later integration must be a narrow reviewed PR with no economic/validator/Reveal semantic change.

### W11 — First Preprod ticket expiry policy
**Target:** work/immortal-green-closure, issue #20.  
**State:** expiry mechanisms/tests exist, but if the exact duration remains unresolved, it must be settled by the proper PRE-RICH policy authority. Do not invent one hour/365 days and do not import the advertising freshness horizon.

**Next:** search existing source-of-truth records and branch history first. If no approved value is present, record policy as OPEN; only implement after the decision, then prove end-to-end conformance.

### W12 — B1 hardening / Aegis prototypes
**Target:** b1-hardening.  
**State:** useful prototype and test work exists, but Notion marks some caps/ranges as demonstration parameters, not approved policy.  
**Next:** retain research labels, run hypothesis tests only, never transfer experimental parameters into the normative kernel and do not merge this branch wholesale.

## 5. Current Issues and PRs

| Item | Target lane | State / action |
|---|---|---|
| Issue #20 — authoritative ticket expiry policy | green | Reconcile existing source-of-truth decision first; no duration invented. |
| Issue #21 — cross-environment conformance/minimal second adapter | green | Non-blocking research using existing vectors. |
| Issue #22 — scratch-and-win UI | feat/pre-rich-game-ui | UI-only scope; isolate protocol/provider diffs. |
| PR #19 — Cardano lab/conformance repair | head green, base main | Open, mergeable=false; GitHub shows 1,720 commits and 395 changed files. Its inspected head SHA b68c1bd5... is broad and must not be merged as one package. Split into narrowly scoped PR work only after exact diff review. |
| PR #35 — evidence-gated contribution PR gate | merge/workflow-b-closed-main | Open draft bootstrap; keep draft pending trust-base governance review, branch-protection configuration and exact-head native-ledger evidence. |

## 6. Actions evidence observed at the snapshot

- Green HEAD b68c1bd5... had newly triggered workflows still **queued** in the latest API result, including Adapter Sale Conformance [#4285](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289392), Haskell conformance [#327](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289466), V3 carrier fast ledger gate [#221](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289538), emulator Reveal conformance [#954](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289467), portability [#1886](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289462) and Integration Lab [#2027](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289296). Pending is not success.
- Latest B3 P2P probe [#9](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951): failure due to absence of raw GRANDPA justification, consistent with fail-closed.
- Materios WebSocket probe [#6](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39595137122): success for probe capability/classification, not finality.
- Workflow B run [#406](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39556373367): success for the 48-harness scope only.
- EEV approval run [39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679): success at main SHA 97b09a...; must be re-bound to exact live qualified UTxOs and candidate first-Issue transaction.
- Paper controlled-rejection run [39454356498](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39454356498): bounded unit tests only; not native Reveal proof.
- P2.8/JEV run [39201592387](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201592387), attempt 2: failed prompt generation (ENOENT); not a current-head P2.8 pass.

Re-fetch the latest run before using any status in a new decision. These entries are a time-stamped evidence ledger; statuses may change.

## 7. Notion reconciliation

Preserve existing Notion pages as indexes/history; do not replace them wholesale:

- [PRE-RICH — Control Center](https://app.notion.com/p/3d9c4454d6d581e680d5e5d3f3a9df79) — hierarchy, coordination and links.
- [IMMORTAL / PRE-RICH — End-to-End System Map & Continuity Checkpoint](https://app.notion.com/p/3e2c4454d6d5817b964bec41aaee041f) — architecture map, with some older state entries.
- [Workflow C — IMMORTAL V2 Autonomous Verification & Execution v0.1](https://app.notion.com/p/3fdc4454d6d581378702e9ae9d9fee85) — explicit design-only state and JEV gate.
- [IMMORTAL — Autonomous Verification Control Plane v0.1](https://app.notion.com/p/3e2c4454d6d5819cbec1c6edede714b3) — JEV history; check every record against run/commit timestamps.
- [B1 Hardening Work Program](https://app.notion.com/p/3f7c4454d6d581e78e38f8983b12ed54) — hardening/research scope and no wholesale merge.
- [Issue Admission Boundary Audit](https://app.notion.com/p/3f5c4454d6d581999ac8d741d5153cd2) — G1–G7 boundary residuals; validate historical state against current source and run results.
- [Open Decisions & Roadmap](https://app.notion.com/p/3d9c4454d6d581738bf2c461a8694a2e) — decision register, paper and research residuals.

The older Notion checkpoint references 23 branches; GitHub returned **25** at this audit. A Notion “closed” label can mean the normative decision is closed while implementation, conformance or deployment evidence remains open. Compare the meaning of each status, not only its label.

## 8. Priority order

1. Re-read this checkpoint at restart; fetch current HEAD for green/B3/main and latest relevant run status.
2. Complete the exact-head CI queue for b68c1bd5...; classify each job independently. Do not describe pending runs as green.
3. First ticket remains blocked: reconcile direct-USDM pool observation, source/unit binding, Treasury output/minimum-UTxO requirements, runtime/service endpoint and final transaction body. Do not mint merely to create a milestone.
4. Prove the unattended JEV loop: current source SHA, fresh prompt, bounded execution/decline, exact result registration and subsequent scheduled consumption.
5. Materios needs new-source evidence: no same-endpoint probe rerun until archive/peer/source inputs change. Leave B3 fail-closed.
6. Keep PR #35 draft and PR #19 unmerged until exact-scope review, current required checks and explicit governance review.
7. Selective transfers only: source SHA/blob → target SHA/blob → reason → focused regression → completed run. No wholesale green/B3, hardening, release or audit merges.
8. UI issue #22 remains isolated on feat/pre-rich-game-ui; portability issue #21 stays research/non-blocking on green; expiry issue #20 stays open unless an approved source decision is found.
9. Paper remains NOT READY TO SUBMIT until exact release snapshot, native Reveal evidence and related-work screening gates are satisfied.
10. No branch deletions until a separate cleanup inventory links each branch to its last PR, workflow evidence, unique blobs and recovery value.

## 9. Closure record required for every work item

Record source-of-truth requirement, target branch, exact source SHA, workflow/run attempt, artifact checksum where applicable, evidence class (unit, integration, local ledger, Preprod, mainnet), result, limitations, next action and explicit closure predicate. Keep “implemented” and “proved” in separate fields.

A scoped PR is eligible for review only when its diff is limited to the assigned work, compatible with the normative hierarchy, tested on its exact head, and its evidence names the same source/run/commit. No real Preprod/mainnet success may be inferred from unit tests, an emulator, a workflow definition or artifact publication.

**Conclusion:** the complete recursive file-tree inventory covers all 25 existing refs; semantic and release closure remain incomplete. Active work is allocated to green for first-ticket/JEV/P2.8/Workflow C, B3 for Materios proof/Workflow B, feat/pre-rich-game-ui for UI issue #22, and b1-hardening for isolated research. Historical refs remain diagnostic evidence. No branch was created, deleted, merged or deployed by this checkpoint.
