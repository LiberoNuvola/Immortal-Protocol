# IMMORTAL / PRE-RICH — Repository-Wide Branch & Evidence Checkpoint

**Source-code tree snapshot (GitHub API):** 2026-10-21; active source HEADs refreshed to green `1300b79d7460f2abcd79767d5d16dd2564aad064` (commit timestamp 17:46:31 UTC), B3 `2778d3e107f45ee15157fff8ef894905a72070ea`, and main `97b09a38742098f17a61eb07734c401aeedccc06`. The all-branch listing and recursive tree responses for green/B3/main were refreshed; all three trees were non-truncated. The checkpoint commit itself is coordination-only and follows this code snapshot.  
**Checkpoint branch:** work/immortal-green-closure  
**Classification:** coordination/audit record only; not a normative specification, deployment approval, merge authorization, or protocol-semantic decision.

## 0. Executive state

This audit recursively inventoried the Git tree of all **25 existing branches**, including tracked path, blob SHA and file size, then compared branch paths and blob identities. Full Git tree responses for main, work/immortal-green-closure and work/b3-materios-provenance-evidence were non-truncated. Targeted content inspection covered the highest-impact active-front records, workflow definitions, issue/PR metadata and Notion checkpoints.

**Coverage limit:** the recursive census is exhaustive for tracked file identity and branch deltas. It is not a claim that every line of every historical file has already received a fresh semantic code review. The branch matrix classifies each ref, while the workstream sections identify what is implemented, what has actually been evidenced, and what remains open. Do not translate “file exists” into “feature proven.”

### Current source anchors

| Ref | HEAD at snapshot | Commit time (UTC) | Tracked files | Role |
|---|---|---|---:|---|
| main | 97b09a38742098f17a61eb07734c401aeedccc06 | 2026-10-21 05:37:43 | 756 | public/default baseline |
| work/immortal-green-closure | 1300b79d7460f2abcd79767d5d16dd2564aad064 | 2026-10-21 17:46:31 | 940 | active cross-system closure / checkpoint branch |
| work/b3-materios-provenance-evidence | 2778d3e107f45ee15157fff8ef894905a72070ea | 2026-10-21 12:50:37 | 997 | active Workflow B / Materios evidence branch |
| b1-hardening | c561393e7eb842529aeaa272377e5afe0138d085 | 2026-10-17 16:38:44 | 359 | isolated B1 experiments / hardening research |
| feat/pre-rich-game-ui | 9ba77f967fa8f40395bef8c6cee77bf449d94dad | 2026-10-07 04:29:30 | 759 | DApp presentation/UI lane |

**Do not promote either active work branch wholesale into main.** Tree comparisons found:
- Green vs main: 549 identical path/blob pairs; 196 green-only paths; 12 main-only paths; 195 shared paths with different blob SHAs.
- B3 vs main: 561 identical path/blob pairs; 254 B3-only paths; 13 main-only paths; 182 shared paths with different blob SHAs.
- Green vs B3: 750 identical path/blob pairs; 102 green-only paths; 159 B3-only paths; 88 shared paths with different blob SHAs.

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
| work/immortal-green-closure | 1300b79d7460 | 2026-10-21 | 940 | Active cross-system closure and canonical checkpoint host: B1/EEV/direct-USDM, B2/Issue, JEV, P2.8, Workflow C/papers, Pyth quote diagnosis and portability. |

## 2A. File-by-file recursive manifests and comparison against main

The links below open the **recursive Git tree JSON for the exact commit snapshot** of each of the 25 existing refs. Each manifest exposes all tracked file paths, blob SHAs, object type/mode and sizes, subject to the Git tree endpoint's response; all 25 responses were checked and were non-truncated. The manifest link is the reproducible file inventory, not a content review of every line.

The comparison columns mean: **same** = same path and blob SHA as main; **shared changed** = path is in both but blob SHA differs; **branch-only** = path exists only on that ref; **main-only** = path in main absent from that ref. These categories exactly account for each branch's tree size. Counts are branch-relative, not a safety or merge score. Main's own row is the baseline.

| Branch | Snapshot SHA | Tracked files | Same as main | Shared changed | Branch-only | Main-only | Complete recursive manifest |
|---|---|---:|---:|---:|---:|---:|---|
| `audit/adapter-sale-conformance` | `272413a38bb8` | 331 | 224 | 89 | 18 | 443 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/272413a38bb882ad1313ea63491697c11b8e8b38?recursive=1) |
| `audit/claim-b1-conformance` | `1e64ec9f31ba` | 328 | 224 | 86 | 18 | 446 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/1e64ec9f31ba50e04e36b4576ba66d73bfefc0a8?recursive=1) |
| `audit/kernel-invalid-class-fail-closed` | `50e80bd17874` | 329 | 224 | 87 | 18 | 445 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/50e80bd1787412bc62a582d95c8fb653bd2baa3a?recursive=1) |
| `audit/p2-8-b1-baseline-size-2026-09-21` | `d73f39199ae5` | 329 | 224 | 86 | 19 | 446 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/d73f39199ae53e79e415daa68d91fe2cd92a62c2?recursive=1) |
| `audit/p2-8-b1-cardano-ledger-runner` | `9ec325e1ca7b` | 563 | 460 | 77 | 26 | 219 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/9ec325e1ca7be43d573ce71560824d9134e1bea1?recursive=1) |
| `audit/p2-8-b1-inline-haskell-uplc-diagnostic-2026-09-21` | `b7cb39a70875` | 330 | 224 | 86 | 20 | 446 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/b7cb39a708755f7bd0b3faccca79b3f4e5f58b1c?recursive=1) |
| `audit/p2-8-b1-inline-runtime-diagnostic-2026-09-21` | `f84b37ad14d4` | 330 | 224 | 86 | 20 | 446 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/f84b37ad14d4c7bf5ad6141ae624c71c469ba5f9?recursive=1) |
| `audit/p2-8-b1-lucid-evolution-2026-09-21` | `ace1e78bca47` | 331 | 224 | 86 | 21 | 446 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/ace1e78bca47562b7cbecb7f47ddb45de9f89bfc?recursive=1) |
| `audit/p2-8-b1-reference-budget-diagnostic-2026-09-21` | `259d7dc21f13` | 330 | 224 | 86 | 20 | 446 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/259d7dc21f135c1af9ec6e6c8418cdc074618300?recursive=1) |
| `audit/p2-8-b1-reference-scripts-2026-09-21` | `c55b6e82d765` | 459 | 310 | 115 | 34 | 331 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/c55b6e82d76551c267d91078f48750ce5c469750?recursive=1) |
| `audit/p2-8-reveal-size-2026-09-21` | `3afb09b341e4` | 328 | 224 | 86 | 18 | 446 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/3afb09b341e44ef3ba4541be74b4bd227cda36b4?recursive=1) |
| `b1-hardening` | `c561393e7eb8` | 359 | 224 | 91 | 44 | 441 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/c561393e7eb842529aeaa272377e5afe0138d085?recursive=1) |
| `backup/main-before-curated-promotion-2026-09-24` | `d861329e4ff8` | 199 | 92 | 64 | 43 | 600 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/d861329e4ff85ed8255176717de9d54f93ad871f?recursive=1) |
| `copilot/fix-real-preprod-reveal-job` | `3c845c20314f` | 756 | 756 | 0 | 0 | 0 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/3c845c20314f952a859db3e48fdba948cebc8607?recursive=1) |
| `feat/pre-rich-game-ui` | `9ba77f967fa8` | 759 | 728 | 20 | 11 | 8 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/9ba77f967fa8f40395bef8c6cee77bf449d94dad?recursive=1) |
| `fix/cardano-lab-yaci-info` | `b8530c26ab40` | 751 | 747 | 4 | 0 | 5 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/b8530c26ab40531f7f8b7965dc6f74bd05ec7850?recursive=1) |
| `main` | `97b09a387420` | 756 | 756 | 0 | 0 | 0 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/97b09a38742098f17a61eb07734c401aeedccc06?recursive=1) |
| `merge/workflow-b-closed-main` | `7bca8d91b65d` | 762 | 748 | 8 | 6 | 0 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/7bca8d91b65d7af1261d8b7cc4f28f496a73fcba?recursive=1) |
| `ops/b2-preprod-new-workflow` | `30f7cb46b6d7` | 755 | 755 | 0 | 0 | 1 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/30f7cb46b6d798919f6ba323770a78ed27ac596c?recursive=1) |
| `ops/b2-preprod-zero-input-dispatch` | `151834415a1d` | 749 | 745 | 4 | 0 | 7 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/151834415a1db922b008eabe93b224cfd83d3b14?recursive=1) |
| `ops/expose-b2-preprod-dispatch` | `b2a1a1471328` | 749 | 744 | 5 | 0 | 7 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/b2a1a14713289a6a82eb59b4d3483d891eb797ab?recursive=1) |
| `release/issue-admission-boundary-squash` | `5b04f0c005bc` | 751 | 750 | 1 | 0 | 5 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/5b04f0c005bc983dd9be6427d78ff232e0240f20?recursive=1) |
| `release/public-main-curated-2026-09-24` | `04f2684244dd` | 489 | 329 | 102 | 58 | 325 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/04f2684244ddbf26946980ab764e4336fd2ab0a7?recursive=1) |
| `work/b3-materios-provenance-evidence` | `2778d3e107f4` | 997 | 561 | 182 | 254 | 13 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/2778d3e107f45ee15157fff8ef894905a72070ea?recursive=1) |
| `work/immortal-green-closure` | `1300b79d7460` | 940 | 549 | 195 | 196 | 12 | [Tree JSON](https://api.github.com/repos/LiberoNuvola/Immortal-Protocol/git/trees/1300b79d7460f2abcd79767d5d16dd2564aad064?recursive=1) |

**Census total:** 13,760 tracked-blob entries across the 25 branch snapshots, including repeated files shared by different branches. The live green branch advanced after source snapshot `1300b79...` only because this coordination checkpoint was committed; its manifest link deliberately pins the pre-checkpoint source snapshot used for the current-head CI evidence. The checkpoint update itself changes documentation only. All counts were obtained from GitHub recursive tree responses; the table intentionally does not substitute “file exists” for “test/evidence passed.” A semantic review of historical file contents is scoped by risk and listed work fronts rather than claimed complete.

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
**State:** design/research only; not approved or implemented in production. `plutus/PythQuoteCarrierBinding.hs` now contains an isolated Haskell Plutus V2 transaction-topology extractor, with synthetic adversarial vectors in `plutus/test/PythQuoteCarrierBindingTest.hs`; current source HEAD `1300b79d7460f2abcd79767d5d16dd2564aad064` adds `ViewPatterns` to the helper. It checks a unique carrier input/output, authority-singleton conservation and no mint/burn, address and physical-Value preservation, and decodable carrier datums, then returns the raw price/exponent/timestamps without unit conversion. Crucially, it is **not called by `plutus/MintPolicy.hs`**: `atomicTreasuryPaymentValid` still values the Treasury output through `Economic.totalUsdmValue` / the legacy Oracle State quote. The current-head Haskell Semantic Conformance run #329 is still in progress; synthetic context tests do not prove Pyth signature validity or native-ledger acceptance.

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

JEV is **INCONCLUSIVE** until one unattended cycle is observed: prompt retrieval → bounded execution or safe decline → result registration with exact run/commit → next scheduled cycle consumes the latest prompt and records its own result without a user message. Older run [39201592387](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201592387), attempt 2, failed prompt generation with ENOENT. Later run #2027 on source HEAD b68c1bd5... successfully executed the prompt generator/test and Notion registration steps, but the overall lab was cancelled before completing its integration gates; this does not demonstrate the next scheduled unattended iteration.

**Next:** check whether freshness-guard candidate 05bee2e4a0fafe00568b08dc963e5b287196d2f1 is present and tested on current green HEAD; reconcile with ingress provenance fix 765af53acec61746af0dc9117db93bbe8bbffe77; run focused tests and one completed workflow, then observe the next scheduled unattended iteration. No autonomy claim from setup, upload, or user-triggered execution.

### W5 — P2.8 native Cardano runner / integration lab
**Target:** work/immortal-green-closure.  
Sources exist: `audit/cardano-ledger-runner/Main.hs`, `TypedPacketDecode.hs`, `audit/cardano-integration/materialize-p28-ledger-context.mjs` and a dedicated workflow. Prior investigation found Conway PParams normalization missing; commit `68cccb4b421d3d776469567afb99027eabc024f6` addressed that area. Integration run [#2027](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289296) was cancelled at Yaci Store readiness; its Claim candidate build failed and P2.8 evidence steps were skipped. Exact-head run [#2029](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077) on `1300b79d7460f2abcd79767d5d16dd2564aad064` has now **completed cancelled**. Logs show Yaci Store started, the isolated Aiken V3 Reveal candidate built/published, and its local positive/negative fixture twins passed; however the real Cardano ledger smoke step, economic Reveal/Claim traces, raw-context materialization, typed UTxO decode and P2.8 gate were skipped. Evidence artifact [12367697468](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077/artifacts/12367697468) was uploaded (ZIP SHA-256 `b6f04350917aa98d207d9f3d67fbb84ca7abb21a2a76e2d712a95582f4bb5234`), and the JEV registry/prompt plus Notion registration steps completed. This is useful fixture/provenance evidence, not a current-head P2.8 or real economic-transition pass. No current-head P2.8 pass is established.

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

**Observed PR lab result:** run [#2005](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39591157626) passed the native V3 carrier step but failed at the real economic Reveal transition; P2.8 decoder/evidence steps were skipped. This is a failure of the scoped candidate run, not permission to alter Reveal semantics. **Next:** review the exact 14-path diff and trusted-base preflight, investigate the failing run within existing non-regression boundaries, and reconsider the PR only after governance review and named required checks are configured.

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
| PR #19 — Cardano lab/conformance repair | head green, base main | Open, `mergeable=false`; refreshed GitHub metadata shows 1,726 commits and 398 changed files. Current head SHA is `1300b79d7460f2abcd79767d5d16dd2564aad064`. The PR is broad and must not be merged as one package; split into narrowly scoped PR work only after exact diff and base/trust review. |
| PR #35 — evidence-gated contribution PR gate | merge/workflow-b-closed-main | Open draft bootstrap; keep draft pending trust-base governance review, branch-protection configuration and exact-head native-ledger evidence. |

## 6. Actions evidence observed at the snapshot

- Green HEAD b68c1bd5... had newly triggered workflows still **queued** in the latest API result, including Adapter Sale Conformance [#4285](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289392), Haskell conformance [#327](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289466), V3 carrier fast ledger gate [#221](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289538), emulator Reveal conformance [#954](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289467), portability [#1886](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289462) and Integration Lab [#2027](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289296). Pending is not success.
- Latest B3 P2P probe [#9](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951): failure due to absence of raw GRANDPA justification, consistent with fail-closed.
- Materios WebSocket probe [#6](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39595137122): success for probe capability/classification, not finality.
- Workflow B run [#406](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39556373367): success for the 48-harness scope only.
- EEV approval run [39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679): success at main SHA 97b09a...; must be re-bound to exact live qualified UTxOs and candidate first-Issue transaction.
- Paper controlled-rejection run [39454356498](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39454356498): bounded unit tests only; not native Reveal proof.
- P2.8/JEV run [39201592387](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39201592387), attempt 2: failed prompt generation (ENOENT); not a current-head P2.8 pass.

Follow-up to the queue snapshot: run [#2027](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39617289296) ended **cancelled** at Yaci Store readiness; the Claim candidate build also failed, while P2.8 steps were skipped. PR #35 integration run [#2005](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39591157626) passed native V3 carrier but failed the real economic Reveal transition; its P2.8 steps were skipped. JEV prompt-generation and Notion registration steps succeeded on #2027, but the unattended next-cycle condition remains unproven.

**Live exact-head refresh — green source-code SHA `1300b79d7460f2abcd79767d5d16dd2564aad064` (status APIs refreshed through 2026-10-21 17:53 UTC):** the tree census remains main 756, green 940 and B3 997 tracked blobs, with all 25 manifest responses non-truncated. The exact-head Integration Lab [#2029](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077) ended **cancelled** after local Aiken Reveal build/publication/fixture twins and evidence/JEV prompt registration, while real ledger smoke, economic Reveal/Claim traces and P2.8 steps were skipped. V3 Carrier Fast Ledger [#223](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783837) ended **cancelled** after the Cardano-ledger smoke transaction succeeded but before the V3 carrier execution step completed. Kernel Invalid-Class [#3675](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783893) ended **cancelled before its regression suite**. PRE-RICH Emulator Reveal [#956](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783971) ended **failure** at build stage: `Spend[0] attempted to instantiate a non-polymorphic term`; its negative cases were marked inconclusive at build and do not establish ledger rejection. Haskell Semantic Conformance [#329](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784015) and B2 Control Carrier [#447](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783847) remained **in progress** on the last query. Completed-success exact-head runs: Algorithmic Governability [#4257](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784085), Documentation Link Check [#1956](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783881), Portability [#1892](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783861), Adapter Sale [#4291](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783956), and Protocol Declaration [#3099](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783866). This mixed state is **not GREEN**. No result here proves Pyth production binding, P2.8, a live Issue, the unattended JEV cycle, or Materios finality.

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
2. Record current exact-head CI results at source SHA `1300b79d7460f2abcd79767d5d16dd2564aad064`: Integration Lab cancelled after partial fixture/evidence work; V3 fast cancelled before carrier execution although ledger smoke passed; Kernel regression cancelled before tests; Reveal failed during build, so its negative ledger cases are inconclusive; Haskell and B2 remained in progress at the last query; five other named workflows completed successfully. Re-fetch statuses before decisions and do not describe this as green.
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


## 10. 2026-10-21 — Universal roadmap, cross-workstream register and audit coverage ledger

> **Audit scope marker:** This addition expands the checkpoint from branch/tree coordination into a repo-wide workstream map. It does **not** claim completion of a fresh semantic review of every unique blob, every historical workflow log, or every Notion page. The structural and content-review coverage limits are explicit below. No protocol code, application code, validator, test, workflow, or normative specification was changed by this audit update.

### 10.1 Live repository facts checked for this update

- Repository: `LiberoNuvola/Immortal-Protocol`; default branch `main`; authenticated connector reports push/admin access at the time of check.
- Live branch search returned 25 branch names: the same count as the earlier checkpoint. The search response exposes a cursor, so this update treats the 25 names as the currently returned set but does not claim a separately verified all-pages REST listing beyond the returned result.
- The checkpoint blob SHA retrieved before this update was `9448c5dfec5b644da4197a04486cccb83c75ae77`; that is the parent content version for this documentation-only update. Its audited source-code snapshot remains distinct from this checkpoint commit.
- Notion PRE-RICH Control Center was fetched successfully. Its 2026-10-21 block still points to the prior checkpoint-only commit `cab00e9f4a92d75946add7feedba56b2768c9aca` and repeats the earlier 25-branch/13,760-entry snapshot. The Control Center must be reconciled to the commit produced by this update before this checkpoint can be called synchronized.
- A direct attempt to use the connector's generic GitHub URL fetch for REST branch/tag/Actions endpoints was rejected as an unsupported URL. Therefore live tags, full PR pagination, all Actions runs and full artifact/log pagination were not independently recomputed in this pass. See coverage register below.

### 10.2 Audit status vocabulary

Use the following state labels consistently. They describe the evidence level reached, not an impression of maturity.

| Status | Meaning | Minimum supporting evidence |
|---|---|---|
| `NOT_STARTED` | No substantiated work found yet | Search/review record establishes absence within a named scope only; never infer global absence from one search |
| `RESEARCH` | Question or candidate route investigated | Dated research artifact and stated limitations |
| `DESIGN` | Proposed architecture/spec exists | Versioned design; not proof of implementation |
| `IMPLEMENTED_UNPROVEN` | Relevant source exists and is wired to the intended path only partially or not yet evidenced end-to-end | Exact branch/SHA/path and call-path review |
| `TESTED_BOUNDED` | Named tests passed for a declared limited scope | Test/run ID and exact commit; no implication of runtime correctness |
| `INTEGRATION_BLOCKED` | A required integration step fails, is skipped/cancelled, or lacks required upstream input | Exact run/step/log or external input contract |
| `RUNTIME_EVIDENCE` | Concrete runtime or ledger observation exists | Network/environment, transaction/block/state reference and evidence packet |
| `PREPROD_VERIFIED` | Required deployment-specific Preprod acceptance predicate has been observed | Exact deployment, transaction/state, source SHA and verifier result |
| `CERTIFIED` | Explicit certification criterion has been met | Named authority/standard, complete required packet and independent verification |
| `BLOCKED` | Progress depends on a specific missing decision or external witness | Decision owner/source or exact missing witness/input |
| `SUPERSEDED` | A newer artifact replaces a prior artifact for the same named purpose | Explicit equivalence/supersession note; preserve older evidence |
| `ARCHIVED` | Preserved only for provenance/forensics | Historical ref/blob/run identity and no active implementation claim |

### 10.3 Workstream register — universal and cross-system scope

The target branch is the single coordination destination for new work in that lane. This table does not authorize code changes; code work still requires its own scope and evidence gate.

| ID | Workstream / desired result | Layer / type | Primary existing branch | Verified state at audit snapshot | Dependencies / blocked by | Closure predicate / next action |
|---|---|---|---|---|---|---|
| U-01 | Universal IMMORTAL constitution, economic kernel and state-transition canon | Universal / normative + formal | `work/immortal-green-closure` for coordination; canonical source remains `docs/00-normative/` | `DESIGN` + partial `IMPLEMENTED_UNPROVEN`; formal mathematical definitions exist, but the existence of a kernel is not a concrete certified implementation | Normative hierarchy; concrete refinement and evidence | Map canonical definitions to concrete kernel, projections and transition tests; keep `K*` distinct from concrete `K_c`; prove the applicable post-fixed-point/refinement properties before any safety claim |
| U-02 | Prevent PRE-RICH-specific concepts leaking into universal kernel | Universal/Application boundary / architecture | `work/immortal-green-closure` | `BLOCKED` on full consumer map; prior coordination identifies V3-shaped class/control/Jackpot structures | Consumer/call-graph inventory, V3 conformance regression corpus | Build usage map for all consumers and classify each field/type as universal, profile, adapter or legacy; no destructive extraction until equivalence is evidenced |
| U-03 | Infinite-horizon viability / certified concrete kernel | Universal / formal verification | `work/immortal-green-closure` | `BLOCKED` / `DESIGN`; local invariants are not infinite-horizon viability proof | Normative safety model, admissible outcome set `Ω`, concrete `K_c`, refinement proof | Record an explicit proof obligation and counterexample strategy; no certification from finite tests alone |
| U-04 | Reference Adapter and differential conformance | Universal/Adapter / test architecture | `work/immortal-green-closure` | `DESIGN`; `Adapter/REFERENCE/docs/CONFORMANCE-METHODOLOGY.md` is DRAFT/OPEN | Canonical fixture schema, state projection, versioning, failure taxonomy, evidence packet | Freeze fixture serialization and deterministic reference execution; compare state after every transition and preserve adversarial cases; then run one candidate adapter against same vectors |
| U-05 | Multi-adapter roadmap: Cardano, Bitcoin, Substrate/Materios, EVM, Solana, Cosmos/CosmWasm | Adapter research | `work/immortal-green-closure` for roadmap; research artifacts remain in their own existing paths | `RESEARCH`/`DESIGN`, except Cardano implementation is descriptive of current first adapter; other adapters are not certified | U-04 shared fixtures; per-adapter trust model; real chain evidence | Do not implement all adapters in parallel. Select next adapter only after candidate trust assumptions, invariant enforcement and differential proof are compared on equal vectors |
| U-06 | Governance / upgrades / canonical evolution without hidden economic authority | Universal/governance | `b1-hardening` for existing governance implementation research; green for cross-workstream register | `DESIGN` / partially implemented; Notion contains GOV-01..GOV-18 maps and chain-neutral skeleton references | Canonical authority hierarchy, explicit frozen vs open parameters, governance conformance/replay | Trace all governance claims to current normative spec, implementation and tests; no vote/signature alone counts as truth or conformance |
| U-07 | Protocol Usage Fee and settlement-cost boundary | Universal + Adapter / normative design | `work/immortal-green-closure` | `DESIGN` / `BLOCKED` on explicit decisions; Notion workflow explicitly OPEN and scopes PRE-RICH out for now | Fee ownership matrix; EconomicFeeTarget → SettlementAmount; valuation/freshness/rounding; Kc and ProtectedCapital invariants | Keep protocol fee separate from chain execution cost; do not invent amount/percentage; close design decision before implementation |
| U-08 | Unattended JEV / Workflow C autonomous verification cycle | Automation/governance of evidence | `work/immortal-green-closure` | `INTEGRATION_BLOCKED` / `INCONCLUSIVE`; Notion Workflow C is DESIGN/RECONCILIATION ONLY OPEN | Fresh prompt provenance; bounded execution/safe decline; result registry; exact run/commit; next scheduled cycle | Observe one complete cycle and the next scheduled cycle consuming the latest registered prompt without a user message; otherwise do not claim autonomy |
| U-09 | Public declaration, observability and lifecycle status | Cross-system / observability | `work/immortal-green-closure` | Partial `IMPLEMENTED_UNPROVEN`; declaration vocabulary exists but live freshness/evidence binding remain open in coordination history | Canonical state binding, transaction/action ref, source, scope, stale/unavailable handling | Verify against real observations, not UI/button intent; stale or unavailable evidence must be visibly represented |
| U-10 | Paper/research publication and claim-to-evidence | Research/release | `work/immortal-green-closure` | `BLOCKED`; previous checkpoint says Paper Tranche 1 NOT READY TO SUBMIT | Reproducible release snapshot, related-work screening, native Reveal witness, dependency triage | Link each publication claim to exact artifact/run/source and preserve non-claims; do not submit until existing acceptance gates pass |
| U-11 | Cross-system composition, upgrades and migration safety | Universal / formal architecture | `work/immortal-green-closure` | `DESIGN` / `REVIEW_REQUIRED`; white paper treats composition and upgrades as separate certification questions | Composition model, state transfer, outstanding liabilities, evidence continuity | Inventory source-of-truth specs, find implementation/tests, write explicit gaps; never infer composed safety from component safety |
| U-12 | Strategy Explorer / AI-assisted candidate generation | Automation / research | `work/immortal-green-closure` | `DESIGN` / `RESEARCH`; Workflow C states AI/Explorer may generate candidates but cannot be normative authority | JEV loop, verified evidence boundary, kernel gate, bounded execution | Keep AI optional and untrusted; verify every candidate through canonical kernel and evidence, safe-decline on uncertainty |
| U-13 | PRE-RICH fee sponsorship, user friction and execution-cost study | Application/Adapter research | `work/immortal-green-closure` | `RESEARCH`; Workflow C compares sponsorship, application balance and batching as hypotheses, not decisions | Actual cost vectors; user wallet signing; atomicity/ticket identity semantics; protocol-fee separation | Compare measured alternatives; a sponsor changes who pays network fee, not the fee itself; no silent transaction/body authorization assumptions |
| U-14 | Beacon 4 multi-proof corroboration / adaptive trust | PRE-RICH evidence research, not universal core | `work/b3-materios-provenance-evidence` for research lane; exact target to reconcile with current front | `RESEARCH` / `OPEN`; Notion explicitly says hypothesis only and not a B3 replacement | Independent proof sources, correlation/conflict policy, governed quorum if any, B3 boundary | Preserve as exploratory; do not assume independence/quorum nor promote to production B3 until evidence and policy are explicit |
| U-15 | Protocol public surface / V5 DApp ecosystem boundary | Product/ecosystem / docs | `work/immortal-green-closure` | `REVIEW_REQUIRED`; coordination file includes IMMORTAL V5 and ecosystem surface | Canonical architecture map, declared evidence scope, application/adapter boundary | Confirm current website/DApp documents and code paths against canonical stack; do not let UX labels overstate trust guarantees |
| U-16 | CAROB THREE and non-PRE-RICH experiment links | Adjacent research/application | `work/immortal-green-closure` as index only until repository mapping complete | `REVIEW_REQUIRED`; Notion search surfaced CAROB THREE conformance/interoperability/evidence pages | Determine if same repository/codebase, external project, or conceptual work only | Record project boundary and references; do not silently merge its rules or state into IMMORTAL universal canon |
| U-17 | Maintenance automation and reproducible artifact reuse | CI/infrastructure | `work/immortal-green-closure` | `TESTED_BOUNDED` by earlier recorded work, but current-head state must be refreshed | Exact source/project/toolchain fingerprint and exact-head workflow evidence | Preserve rule: reuse compiled artifacts only on exact fingerprint; rerun tests/evidence and never confuse cache reuse with certification |

### 10.4 Workstream register — PRE-RICH, Cardano, B3 and applied system

| ID | Workstream / desired result | Primary existing branch | Verified state in prior checkpoint snapshot (must refresh before action) | Dependencies and next concrete step |
|---|---|---|---|---|
| P-01 | First real Issue / B1 EEV direct-USDM / Authoritative Issue Admission | `work/immortal-green-closure` | `BLOCKED`: exact source UTxOs, qualified PrizePool, direct USDM quantity, live endpoint, Treasury output/min-UTxO and final tx-body price binding not yet evidenced end-to-end | Refresh branch/SHA and live run; re-observe exact source set; bind approval to slot/time, contract and derivation versions; check final transaction body against current authoritative source; no mint just for milestone |
| P-02 | Pyth quote carrier → actual MintPolicy price consumption | `work/immortal-green-closure` | `IMPLEMENTED_UNPROVEN`: `PythQuoteCarrierBinding.hs` plus synthetic tests exist; prior checkpoint says `MintPolicy.hs` still consumes legacy Oracle State; USD/USDM conversion decision open | Refresh current source; trace actual validator call path; require canonical unit contract and proof binding before any change |
| P-03 | Cardano Reveal transaction size / reference scripts / witness conversion | `work/immortal-green-closure` | `INTEGRATION_BLOCKED`: prior measured Reveal tx ~17,571 B vs 16,384 B limit; instrumentation did not prove reference-witness conversion; do not re-run unchanged diagnosis | Re-read exact latest builder output and workflow steps; new run only when it captures CBOR sizes, reference inputs/witness mode and script-source fingerprints |
| P-04 | Native Cardano ledger P2.8 / typed context evidence | `work/immortal-green-closure` | `INTEGRATION_BLOCKED`: prior exact-head lab #2029 cancelled before real ledger/economic Reveal/Claim and typed P2.8 gates | Refresh latest run/job steps; first broken step only; preserve real packet requirements `tx.cbor`, `utxo.json`, `pparams.json`, `epoch-info.json`, `system-start.json`, `manifest.json`; no synthetic context substituted |
| P-05 | B2 control singleton / authoritative provider integration | `work/immortal-green-closure` | `IMPLEMENTED_UNPROVEN` / `INTEGRATION_BLOCKED`: prior B2 Control #447 still in progress at last read and first Issue admission depends on authoritative control fields | Refresh exact run and current provider; require exact singleton/control identity and negative cases on intended execution boundary |
| P-06 | Expiry duration policy for first Preprod Issue | `work/immortal-green-closure` (Issue #20) | `BLOCKED`: expiry semantics may be implemented; exact duration remains open unless an approved source-of-truth value exists | Search canonical PRE-RICH policy/decision history; if none exists record OPEN and do not choose a duration |
| P-07 | Cross-environment conformance and minimal second adapter | `work/immortal-green-closure` (Issue #21) | `RESEARCH`: explicit non-blocking issue, and Reference methodology remains DRAFT/OPEN | Keep it non-blocking to first ticket; make canonical fixtures/projections/versioning usable before any second adapter claim |
| P-08 | PRE-RICH game UI scratch-and-win | `feat/pre-rich-game-ui` (Issue #22) | `REVIEW_REQUIRED`: UI branch has older provider/Issue/V3 adjacent code; isolate protocol diffs | UI-only build/visual/accessibility acceptance on own SHA; review provider/protocol diffs separately |
| P-09 | Workflow B / Materios B3-A raw GRANDPA finality witness | `work/b3-materios-provenance-evidence` | `BLOCKED`: last checkpoint probe failed closed because zero raw justification acquired; a bounded probe is not proof data is globally unavailable | Do not repeat unchanged public-RPC probe; require a changed input such as confirmed proof-retaining archive/full node, independently identified peer or upstream witness |
| P-10 | Materios B3-B historical storage proof | `work/b3-materios-provenance-evidence` (some collector/verifier files previously noted on green; verify exact cross-branch presence) | `BLOCKED`: real StateRoot + exact historical Anchors value + state_getReadProof not yet produced for target block 1856408 | Use exact archive RPC preflight; capture header/state/value/proof at exact block hash; independently verify pinned Rust trie proof; finality remains a distinct gate |
| P-11 | Materios execution proof / upstream Issue #50 | `work/b3-materios-provenance-evidence` | `IMPLEMENTED_UNPROVEN` for consumer boundary; upstream witness/verification open | Fetch upstream repository Issue #50 current state and any later commits; do not reimplement selector or rerun old RPC without new witness |
| P-12 | Workflow B contribution gate / PR #35 | `work/b3-materios-provenance-evidence` / existing `merge/workflow-b-closed-main` draft ref | `INTEGRATION_BLOCKED`: earlier Workflow B #406 passed only its 48 registered harnesses; PR #35 draft is not equivalent to end-to-end evidence | Refresh PR exact diff, trusted-base/governance gates and current-head native ledger run; keep draft absent explicit clearance |
| P-13 | Gate 41 / PRE-Snek / Genesis / liquidity provenance | `work/immortal-green-closure` | `REVIEW_REQUIRED`: Notion records closed substeps and open output mapping, seed/min-ADA, 3 ADA reconciliation, upstream deployment graph and first-curve replay | Reconcile current Git objects and applicable mainnet evidence before repeating closed lineage analysis; no generated assumptions |
| P-14 | B1 hardening / Aegis prototypes | `b1-hardening` | `RESEARCH`; experimental caps/ranges are not normative policy | Keep research tagged; enumerate tested hypotheses and prohibit import to economic kernel without explicit normative decision |
| P-15 | EEV perimeter, liquidation horizon and qualified assets | `work/immortal-green-closure` | `BLOCKED` / evidence boundary open; direct-USDM profile excludes unverified ADA/PRE liquidation and invented haircuts/slippage | Keep the declared profile; re-observe actual qualified UTxO and asset identity; no assumptions added |
| P-16 | Cardano sale/claim integration and public wallet authority | `work/immortal-green-closure` | Bounded source/test evidence exists; real user wallet path not established in prior snapshot | Revalidate DApp → wallet/CIP-30 signing → admission → exact transaction → ledger observation; never expose seed/private keys |
| P-17 | Public declaration freshness and proof binding | `work/immortal-green-closure` | `IMPLEMENTED_UNPROVEN`; vocabulary/IDLE mapping exists but live scope/freshness proof remains open | Bind declaration to exact source/state/action reference and observation age; UI intent is not evidence |

### 10.5 Priority and dependency plan

The plan deliberately preserves two primary tracks and three supporting tracks:

1. **Track A — application execution:** P-01 → P-05/EEV/control binding → P-04 native P2.8 context → P-03 Reveal evidence and later Claim/lifecycle evidence. This ordering is subject to refreshed exact-head evidence; do not assume P2.8 automatically resolves an economic policy question.
2. **Track B — universal semantics/conformance:** U-01 + U-02 inventory → U-04 Reference fixtures/projections → U-03 concrete-kernel/viability proof obligations → U-05 candidate adapter comparison. Do not wait for every adapter before advancing universal reference semantics; do not claim portability based on architecture docs alone.
3. **Track C — autonomous evidence:** U-08 JEV loop first; then U-12 Strategy Explorer only as untrusted candidate generation; fee-sponsorship study U-13 stays research until actual costs and user-signing boundaries are measured.
4. **Track D — external canonical proof:** P-09 → P-10 and P-11 as separate GRANDPA finality, historical-state/storage and runtime execution proof gates; only then consider PRE-RICH B3 anchor/registry consumption. U-14 Beacon 4 remains research and cannot replace B3.
5. **Track E — protocol sustainability/governance:** U-07 fee boundary and U-06 governance are related but neither can bypass universal economics. Freeze no numeric fee or governance parameter without authoritative decision and adversarial/conformance evidence.

### 10.6 Work already completed or previously closed — do not repeat unchanged

- Full recursive path/blob inventory was previously run for the 25 branch snapshots in the checkpoint; the current branch-name count was rechecked as 25. Do not repeat the full inventory unless any ref changed or a missing-page/cursor condition requires completing pagination.
- Several audit branches explicitly represent historical diagnostic hypotheses for P2.8/Reveal; treat them as evidence inputs, not active parallel implementations.
- Workflow B run #406 was recorded as a 48-harness pass only; do not cite it as real B3 witness or real PRE-RICH Issue evidence.
- Prior B3-A probe #9 produced zero raw GRANDPA justification; do not rerun the same source/parameters. Change archive/peer/witness input first.
- B3-B collector and pinned Rust verifier are designed to bind exact StateRoot/key/value/proof; the missing item is the real archive-served witness, not another local trie verifier implementation.
- Pyth carrier binding/test artifact exists, but that does not establish `MintPolicy.hs` consumption; trace actual binding rather than adding another converter.
- Cached Plutus artifact reuse was explicitly required in the Notion operating rule when source/project/toolchain fingerprint matches; reuse does not skip tests, current-SHA checks, evidence, or deployment qualification.
- PRE-RICH expiry semantic mechanism and expiry tests were previously described as existing; do not decide its numeric duration by importing a stale ad-freshness horizon.
- Existing Beacon 4 / multi-proof corroboration is exploratory; do not create a competing B3 architecture or assume quorum.
- Prior file/tree count `13,760` and source SHA trio in the earlier entry are historical snapshot values, not asserted live counts for this update.

### 10.7 Notion discovery index and current discrepancies

Fetched successfully during this audit update:

- [PRE-RICH — Control Center](https://app.notion.com/p/3d9c4454d6d581e680d5e5d3f3a9df79) — the top checkpoint block still references prior checkpoint commit `cab00e9f...`; update the pointer after the GitHub checkpoint commit succeeds.
- [Workflow C — IMMORTAL V2 Autonomous Verification & Execution v0.1](https://app.notion.com/p/3fdc4454d6d581378702e9ae9d9fee85) — explicitly DESIGN/RECONCILIATION ONLY; JEV next-cycle remains an acceptance gate.
- [IMMORTAL / PRE-RICH — End-to-End System Map & Continuity Checkpoint](https://app.notion.com/p/3e2c4454d6d5817b964bec41aaee041f) — long continuity page includes B3-B collector/verifier milestones, Beacon 4 and second-adapter research (Moriarty/Midnight) absent from the short current checkpoint summary.
- [03 — Open Decisions & Roadmap](https://app.notion.com/p/3d9c4454d6d581738bf2c461a8694a2e) — discovered by workspace search; full text not reviewed in this update.
- [IMMORTAL — Economic Usage Fee & Adapter Settlement Workflow v0.1](https://app.notion.com/p/3e0c4454d6d581f9b78fd05de6ea7763) — explicitly OPEN; Protocol Usage Fee separate from ChainExecutionCost; PRE-RICH settlement is out of scope of that design workflow.
- [GOV-11 — Governance Conformance Specification & Integration Map v0.1](https://app.notion.com/p/3dfc4454d6d58161a3aad7409be7d35a) — governance architecture/integration map exists; latest implementation and frozen/open statuses still require branch-level reconciliation.
- Workspace keyword search also found focused pages for PRE-Snek/Gate 41/Oracle/EEV, Beacon 4, B1 hardening, governance current state, CAROB THREE interoperability/evidence, Fee Ownership Matrix, EconomicFeeTarget→SettlementAmount and Bitcoin Adapter research. Their discovery establishes they exist in workspace search, not that every page has been semantically reviewed.

### 10.8 Structural, semantic and source-access coverage ledger

| Coverage dimension | Current result | Interpretation / remaining work |
|---|---|---|
| Live branch names | 25 returned by current branch search; response exposes cursor `MjU` | Same count as prior inventory; separately prove whether cursor is continuation or completion via API/listing evidence before asserting full pagination |
| Recursive manifests | Prior checkpoint links 25 non-truncated tree JSON results and contains per-branch path/blob inventories at historical source snapshot | This update did not redownload and recompute all 25 trees. Reuse the pinned manifest only while branch heads match; otherwise refresh changed refs and reconcile counts |
| Current unique blob count | NOT RECALCULATED | Requires obtaining every live tree, validating every path/blob pair and deduplicating by blob SHA |
| Semantic review, all unique blobs | NOT COMPLETED / NOT MEASURED | Existing focused inspections are not an exhaustive content review. Create a machine-verifiable blob-SHA review ledger before claiming a percentage |
| Critical current artifacts | PARTIAL TARGETED REVIEW | Checkpoint, work-coordination register, universal white paper, architecture map, Adapter index/reference method, Bitcoin trust model, fee front, Workflow C and selected Notion pages were read or sampled; this is not a complete semantic audit of all critical source and workflow files |
| Current Actions inventory/logs/artifacts | NOT RECALCULATED | Generic Actions REST URL fetch was rejected by the connector; prior checkpoint runs are historical only. Use supported workflow-specific fetch/run/job/log methods for targeted current evidence and register inaccessible pagination separately |
| Issues/PRs | Partial | Current search confirmed issues #20–#22; PR search returned no normalized `pull_requests` field in that response and therefore is inconclusive, not evidence of no PRs. PRs #19/#35 remain historical checkpoint records pending targeted refresh |
| Notion | Partial | Control Center plus selected Workflow C, system map, fee and GOV pages fetched; full workspace/linked-page semantic coverage not completed |
| Git history | Partial | Prior commits are referenced by existing records; a full ref-by-ref commit ancestry/diff history pass remains outstanding |
| Deployment/ledger | No new deployment/transaction performed | This audit generated no new runtime/ledger evidence; any prior ledger evidence remains bound to its own historical transaction/run/source |

**Semantic coverage percentage:** intentionally **NOT CLAIMED**. Denominator must be the number of unique live blob SHAs after complete tree enumeration; numerator must count unique blobs actually inspected semantically under a recorded SHA and review class. Counting paths, searches or documents alone would inflate coverage.

### 10.9 Audit limitations and exact next steps

1. Complete live-ref pagination and acquire current HEAD SHA for each branch, relevant tags and PR head/base references. Recompute manifest counts using blob SHA as the deduplication key and check algebraic path counts per branch.
2. Materialize a machine-readable audit ledger keyed by `{ref, commit, path, blob_sha, category, semantic_review_state, evidence_links}`. File names alone cannot be classified as reviewed.
3. Prioritize semantic reads in this order: normative IMMORTAL and PRE-RICH canon; EconomicKernel/Haskell/TypeScript projections; MintPolicy/Pyth path; Sale/Issue admission/Treasury/EEV; Reveal/V3/reference-script/P2.8; all workflow YAML and shell/JS runners; B1/B2/B3 verifiers and Materios collectors; governance and fee boundaries; all remaining historical blobs by SHA-deduplicated content group.
4. For Actions, query latest run per active workflow on exact current HEAD, inspect jobs and decisive logs; record attempt, skipped steps and artifacts. Do not infer success from workflow conclusion alone.
5. Refresh PR #19 and #35 metadata/diffs, and upstream Materios issue #50/commits, before making promotion or repeat-work decisions.
6. Continue Notion discovery via direct linked pages from the Control Center and topic searches; preserve history. Update only the Control Center index with the final checkpoint commit after the commit SHA is known.
7. After these steps, rerun consistency checks and only then publish live branch/blob/semantic-coverage numbers. Until then the correct overall audit state is **PARTIAL — structured workstream map materialized; exhaustive semantic review and live evidence refresh remain OPEN**.

### 10.10 Change log

- `2026-10-21`: Added universal roadmap and cross-workstream register U-01..U-17 and applied Cardano/Materios register P-01..P-17; added state vocabulary, dependency tracks, no-repeat rules, Notion discovery links and explicit coverage/access limitations. Documentation-only update on `work/immortal-green-closure`.


### 10.11 Live issue/PR refresh — 2026-10-21

- The current GitHub branch search returned these 25 names and an opaque continuation cursor `MjU`; a second request with that cursor returned no additional branch names and `cursor=null`. This supports 25 branch names for that connector search, while full current tree/manifests and current unique-blob total remain **not recalculated**.
- Issue #20 remains open. Its current body says the existing deployed Prize UTxO was observed expired (`Prize: reveal window closed`, trace `PT5`) and must not be reopened/altered; a fresh authoritative `PreRichExpiryPolicy` plus verified issuance state is required before the first new Preprod Issue. Do not redeploy the existing topology or invent a horizon. [Issue #20](https://github.com/LiberoNuvola/Immortal-Protocol/issues/20).
- Issue #21 remains open and expressly non-blocking to Cardano closure. Its existing work packages already call for adapter obligations, mapping Cardano, deterministic chain-neutral vectors, a chain-independent reference runner, selection of one materially different execution environment, and identical-vector comparison with normalized evidence. Reuse this issue/plan; do not create a duplicate portability issue. [Issue #21](https://github.com/LiberoNuvola/Immortal-Protocol/issues/21).
- Issue #22 remains open and UI-only. It prohibits changing economic semantics/V3, bypassing `AuthoritativeIssueAdmissionProvider`, fabricating EEV/ProtectedCapital/viability/admission in the browser, or weakening fail-closed behavior. [Issue #22](https://github.com/LiberoNuvola/Immortal-Protocol/issues/22).
- PR #19 remains open and is reported `mergeable=false` by the connector. Its wide heterogeneous diff must not be promoted as one unit. PR #35 remains open and draft; the PR body itself states bootstrap/governance review is required and contains a changed V3 carrier mint-policy implementation for future deployment, even though spending-validator/Reveal semantics are stated unchanged. Keep draft pending trusted-base/governance review, exact required checks and scope-specific ledger evidence. [PR #19](https://github.com/LiberoNuvola/Immortal-Protocol/pull/19) · [PR #35](https://github.com/LiberoNuvola/Immortal-Protocol/pull/35).
- Latest decisive exact-source Actions evidence retrieved directly by the connector is still associated with source SHA `1300b79d7460f2abcd79767d5d16dd2564aad064`, not the new documentation-only checkpoint commit: Integration Lab run `39646784077` / attempt 1 completed `cancelled`; V3 Fast Ledger run `39646783837` / attempt 1 completed `cancelled`; Emulator Reveal run `39646783971` / attempt 1 completed `failure`. The checkpoint commit is not a new protocol-source test result.
- The connector's PR search identifies open PRs #19 and #35, and issue search identifies #20–#22 as open. This query scope does not establish the full closed-PR/issue history; a history-wide reconciliation remains open.
