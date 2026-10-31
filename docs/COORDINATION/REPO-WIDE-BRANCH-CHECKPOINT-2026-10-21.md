# IMMORTAL / PRE-RICH — Repository-Wide Branch & Evidence Checkpoint

**Pinned recursive-tree census (GitHub API, 2026-10-21; historical baseline, NOT current HEAD):** the manifest baseline used green `1300b79d7460f2abcd79767d5d16dd2564aad064` (commit timestamp 17:46:31 UTC), B3 `2778d3e107f45ee15157fff8ef894905a72070ea`, and main `97b09a38742098f17a61eb07734c401aeedccc06`. The full tree responses for green/B3/main were non-truncated at census time. Section 10.17 records that green subsequently advanced by 14 commits and that the candidate Pyth conversion files were added after the pinned green source anchor. Do NOT use the green census SHA or its file counts as current source state. Later coordination-only commits also advance the green branch tip; those commits do not constitute protocol test evidence. A discrepancy remains between the pinned main SHA and PR #19's reported base SHA; reconcile it before any promotion.  
**Checkpoint branch:** work/immortal-green-closure  
**Classification:** coordination/audit record only; not a normative specification, deployment approval, merge authorization, or protocol-semantic decision.

## 0. Executive state

This audit recursively inventoried the Git tree of all **25 existing branches**, including tracked path, blob SHA and file size, then compared branch paths and blob identities. Full Git tree responses for main, work/immortal-green-closure and work/b3-materios-provenance-evidence were non-truncated. Targeted content inspection covered the highest-impact active-front records, workflow definitions, issue/PR metadata and Notion checkpoints.

**Coverage limit:** the recursive census is exhaustive for tracked file identity and branch deltas. It is not a claim that every line of every historical file has already received a fresh semantic code review. The branch matrix classifies each ref, while the workstream sections identify what is implemented, what has actually been evidenced, and what remains open. Do not translate “file exists” into “feature proven.”

### Pinned source anchors for the original tree census (not current HEAD)

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

## 4. Work allocation and closure predicates (legacy grouping; see current dispatch board §10.16)

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
**State (refreshed 2026-10-21):** isolated Pyth ADA/USD source-boundary feasibility is now `TESTED_BOUNDED` on exact source SHA `2106daa5f4c93c20cbe2479ae9fa08db0d8f59f6`: Actions run [39659905806](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39659905806) completed both jobs successfully, covering synthetic Aiken source-boundary tests, Plutus V3 consumer compilation and strict TypeScript typecheck of the guarded native-ledger runner. Artifact `pyth-ada-usd-probe-2106daa5f4c93c20cbe2479ae9fa08db0d8f59f6` (ID `12374150310`, SHA-256 `4ca4299f029ba3d80e6ef7f288be000014fe097a286d73c919009c2e6cc0d9dc`). Current runner/workflow/consumer blobs are identical to those tested. This is a software gate only: the run used no secrets and submitted no transaction.
  
The candidate rational conversion and synthetic vectors remain isolated. Haskell quote-carrier/conversion suites passed on earlier commit `fb51e0201061e2510f0ed7f2b278f1b16d45c797` in run [39647416504](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39647416504); the additional cross-module assertion recorded in the Pyth design dossier does not have a verified current-head PASS in this audit. Crucially, `plutus/MintPolicy.hs` still values Treasury through `Economic.totalUsdmValue` / the legacy Oracle State quote and does not consume the Pyth candidate. The USD/USDM ratio, exponent/resource bound and production source-to-economic-value binding remain **OPEN**.

**Next:** do not repeat the same synthetic compile/typecheck. A new evidence step must be a real signed-update native-ledger probe with the exact Pyth State identity and a transaction/evidence packet; the workflow is manual-only and defaults `submit_preprod=false`. Any submission requires deliberate dispatch and the dedicated Preprod test wallet. After that, separately close the governed unit-conversion contract, negative source-substitution cases, and the actual MintPolicy quote-carrier binding. Do not use this experiment to bypass direct-USDM EEV or change V3/Reveal semantics.

**Closure:** genuine signed-update acceptance and native-ledger tampered-payload rejection, exact source-to-MintPolicy quote binding, approved conversion/units, negative vectors, and current-head integration evidence. Until then: **TESTED_BOUNDED / PRODUCTION BINDING OPEN**.
  
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
**State (refreshed 2026-10-21):** the green branch now contains `preRichExpiryPolicyV1` with application/profile bounds 2 hours..300 days and a deterministic issuance-state-derived horizon, and the UI passes this policy to the Issue builder. The canonical A1 Notion decision closes the architectural mechanism but leaves numeric duration as DApp/profile parameters, not an IMMORTAL universal constant. Do not reopen the universal decision or invent another number. **P-06 remains `INTEGRATION_BLOCKED`**, because the client currently sets `issuedAt` from `Date.now()` and the inspected on-chain MintPolicy/B1 `TicketIssued` paths do not bind `pdIssuedAt` / `pdExpiresAt` to the approved policy and authoritative issuance snapshot. PrizeValidator checks the stored boundary later, not its origin.

**Next:** close the on-chain mint-time/policy/state binding contract without changing V3/Reveal semantics, add adversarial direct-transaction cases proving arbitrary/future/past expiry is rejected, then run current-head expiry conformance and verify the bound output on a fresh Preprod Issue. Keep Issue #20 open until its full acceptance evidence exists.

### W12 — B1 hardening / Aegis prototypes
**Target:** b1-hardening.  
**State:** useful prototype and test work exists, but Notion marks some caps/ranges as demonstration parameters, not approved policy.  
**Next:** retain research labels, run hypothesis tests only, never transfer experimental parameters into the normative kernel and do not merge this branch wholesale.

## 5. Current Issues and PRs — live metadata refresh 2026-10-21

| Item | Target lane | Current state / action |
|---|---|---|
| [Issue #20 — authoritative ticket expiry policy](https://github.com/LiberoNuvola/Immortal-Protocol/issues/20) | green | Open. A1 mechanism is architecturally closed; green has a state-derived V1 profile. Remaining gate is on-chain `issuedAt`/`expiresAt` binding to the verified policy/state plus fresh Preprod acceptance. |
| [Issue #21 — cross-environment conformance/minimal second adapter](https://github.com/LiberoNuvola/Immortal-Protocol/issues/21) | green | Open, non-blocking research; reuse existing portability vectors and methodology. |
| [Issue #22 — scratch-and-win UI](https://github.com/LiberoNuvola/Immortal-Protocol/issues/22) | feat/pre-rich-game-ui | Open, UI-only scope. Isolate provider/protocol/V3 adjacent changes from visual acceptance. |
| [PR #19 — Cardano lab/conformance repair](https://github.com/LiberoNuvola/Immortal-Protocol/pull/19) | head green → base main | Open, non-draft, `mergeable=false`. PR head tracks `work/immortal-green-closure`, the same branch holding this checkpoint, so every documentation commit advances the PR head. **Timestamped metadata snapshot:** at 2026-10-21 19:27:48 UTC, GitHub reported head `0ce27b7a2a45c264dd8531eee6ab6221953826c8`, base SHA `8c6873e1d50115659727c82c294426b9a946f1fa`, 405 changed files, 49,909 additions, 2,204 deletions. This snapshot becomes stale as soon as the checkpoint branch advances; it is not the current head assertion after this edit. The last compare showed the PR base was 9 commits behind the pinned `main` SHA. This broad PR is not a CI-only patch or a scoped promotion; refresh live metadata and inspect the exact candidate diff before any decision, and do not merge wholesale. |
| [PR #23 — game-first DApp](https://github.com/LiberoNuvola/Immortal-Protocol/pull/23) | feat/pre-rich-game-ui → main | Open draft, mergeable metadata true; head `9ba77f967fa8f40395bef8c6cee77bf449d94dad`; base SHA `8c6873e1d50115659727c82c294426b9a946f1fa`; 27 paths. It includes provider/runtime/V3-adjacent work, so UI-only acceptance does not approve those paths. |
| [PR #28 — Yaci lab lifecycle](https://github.com/LiberoNuvola/Immortal-Protocol/pull/28) | fix/cardano-lab-yaci-info → main | Open non-draft, mergeable metadata true; head `b8530c26ab40531f7f8b7965dc6f74bd05ec7850`; base SHA `aafad1d24ff678253a045e27114c7e544b2060c3`; 3 paths including V3 mint policy and integration workflow. Security-sensitive review remains required. |
| [PR #35 — evidence-gated contribution gate](https://github.com/LiberoNuvola/Immortal-Protocol/pull/35) | merge/workflow-b-closed-main → main | Open draft, mergeable metadata true; head `7bca8d91b65d7af1261d8b7cc4f28f496a73fcba`; base SHA is the pinned main `97b09a38742098f17a61eb07734c401aeedccc06`; 14 paths. Keep draft pending trusted-base/governance review and exact-head native-ledger evidence. |

**Metadata interpretation:** mergeability metadata is not security or correctness approval. Compare responses with large path lists are capped; they do not replace complete tree manifests. No PR has been merged, rebased or rewritten as part of this refresh.

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

## 8. Priority order (snapshot; see current dispatch board §10.16)

1. Re-read this checkpoint at restart; fetch current HEAD for green/B3/main and latest relevant run status.
2. Record current exact-head CI results at source SHA `1300b79d7460f2abcd79767d5d16dd2564aad064`: Integration Lab cancelled after partial fixture/evidence work; V3 fast cancelled before carrier execution although ledger smoke passed; Kernel regression cancelled before tests; Reveal failed during build, so its negative ledger cases are inconclusive; Haskell and B2 remained in progress at the last query; five other named workflows completed successfully. Re-fetch statuses before decisions and do not describe this as green.
3. First ticket remains blocked: reconcile direct-USDM pool observation, source/unit binding, Treasury output/minimum-UTxO requirements, runtime/service endpoint and final transaction body. Do not mint merely to create a milestone.
4. Prove the unattended JEV loop: current source SHA, fresh prompt, bounded execution/decline, exact result registration and subsequent scheduled consumption.
5. Materios needs new-source evidence: no same-endpoint probe rerun until archive/peer/source inputs change. Leave B3 fail-closed.
6. Keep PR #35 draft and PR #19 unmerged until exact-scope review, current required checks and explicit governance review.
7. Selective transfers only: source SHA/blob → target SHA/blob → reason → focused regression → completed run. No wholesale green/B3, hardening, release or audit merges.
8. UI issue #22 remains isolated on feat/pre-rich-game-ui; portability issue #21 stays research/non-blocking on green; expiry issue #20 remains open for on-chain policy/timestamp binding and Preprod acceptance, not for inventing a universal lifetime.
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
| P-02 | Pyth quote carrier → actual MintPolicy price consumption | `work/immortal-green-closure` | `TESTED_BOUNDED` for isolated software feasibility at `2106daa5…` (run #39659905806); **PRODUCTION BINDING OPEN**. `MintPolicy.hs` still calls `Economic.totalUsdmValue` via legacy Oracle State; USD/USDM ratio/resource bound and source-to-economics binding remain OPEN. The signed-update Preprod transaction was not run by that software gate. | Do not repeat the same synthetic gate. Next: separately execute the guarded genuine signed-update ledger probe, then close the governed unit conversion and exact quote-carrier → MintPolicy binding with negative substitution cases and transaction evidence. |
| P-03 | Cardano Reveal transaction size / reference scripts / witness conversion | `work/immortal-green-closure` | `INTEGRATION_BLOCKED`: prior measured Reveal tx ~17,571 B vs 16,384 B limit; instrumentation did not prove reference-witness conversion; do not re-run unchanged diagnosis | Re-read exact latest builder output and workflow steps; new run only when it captures CBOR sizes, reference inputs/witness mode and script-source fingerprints |
| P-04 | Native Cardano ledger P2.8 / typed context evidence | `work/immortal-green-closure` | `INTEGRATION_BLOCKED`: prior exact-head lab #2029 cancelled before real ledger/economic Reveal/Claim and typed P2.8 gates | Refresh latest run/job steps; first broken step only; preserve real packet requirements `tx.cbor`, `utxo.json`, `pparams.json`, `epoch-info.json`, `system-start.json`, `manifest.json`; no synthetic context substituted |
| P-05 | B2 control singleton / authoritative provider integration | `work/immortal-green-closure` | `IMPLEMENTED_UNPROVEN` / `INTEGRATION_BLOCKED`: prior B2 Control #447 still in progress at last read and first Issue admission depends on authoritative control fields | Refresh exact run and current provider; require exact singleton/control identity and negative cases on intended execution boundary |
| P-06 | PRE-RICH expiry policy → authoritative on-chain Issue binding | `work/immortal-green-closure` (Issue #20) | `INTEGRATION_BLOCKED`: green has `preRichExpiryPolicyV1` (2h..300d application/profile bounds) and state-derived crystallization, but client `Date.now()` supplies `issuedAt`; inspected MintPolicy/B1 TicketIssued paths do not constrain `pdIssuedAt`/`pdExpiresAt` to that policy/state. main still has the generic policy interface without V1 bounds. | Bind the timestamp and policy/state derivation to the exact authorized Issue transaction; add malicious datum/time negative tests; run current-SHA conformance and prove fresh Preprod acceptance. Do not alter V3/Reveal semantics or invent a universal horizon. |
| P-07 | Cross-environment conformance and minimal second adapter | `work/immortal-green-closure` (Issue #21) | `RESEARCH`: explicit non-blocking issue, and Reference methodology remains DRAFT/OPEN | Keep it non-blocking to first ticket; make canonical fixtures/projections/versioning usable before any second adapter claim |
| P-08 | PRE-RICH game UI scratch-and-win | `feat/pre-rich-game-ui` (Issue #22) | `REVIEW_REQUIRED`: UI branch has older provider/Issue/V3 adjacent code; isolate protocol diffs | UI-only build/visual/accessibility acceptance on own SHA; review provider/protocol diffs separately |
| P-09 | Workflow B / Materios B3-A raw GRANDPA finality witness | `work/b3-materios-provenance-evidence` | `BLOCKED`: last checkpoint probe failed closed because zero raw justification acquired; a bounded probe is not proof data is globally unavailable | Do not repeat unchanged public-RPC probe; require a changed input such as confirmed proof-retaining archive/full node, independently identified peer or upstream witness |
| P-10 | Materios B3-B historical storage proof | `work/b3-materios-provenance-evidence` (some collector/verifier files previously noted on green; verify exact cross-branch presence) | `BLOCKED`: real StateRoot + exact historical Anchors value + state_getReadProof not yet produced for target block 1856408 | Use exact archive RPC preflight; capture header/state/value/proof at exact block hash; independently verify pinned Rust trie proof; finality remains a distinct gate |
| P-11 | Materios execution proof / upstream Issue #50 | `work/b3-materios-provenance-evidence` | `INTEGRATION_BLOCKED / UPSTREAM CLOSURE DISCREPANCY`: issue #50 is closed, but current upstream main's `partnerchain/node/src/rpc.rs` (blob `30827863c7b8f6fb507b008cee9f572ec48fe06f`) exposes only System, Orinq and MOTRA and does not register `materios_b3_calculateCommitteeProof`; no matching PR/commit or closure explanation was recovered by the bounded live search. | Determine exactly why #50 was closed and whether the implementation exists on another/older ref; verify the exact method and a real block-bound non-synthetic execution-proof fixture before changing the workstream state. Do not reimplement selector or run unchanged public RPC probes. |
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
| Live branch names | 25 branches returned; continuation query returned zero additional names and `cursor=null`; independently reconciled against §10.24 | Branch-name pagination complete for this connector query |
| Recursive manifests | **COMPLETE structural census in §10.24**: 25 current branch HEADs enumerated; all 25 recursive tree responses `truncated=false` | Snapshot HEADs and per-branch counts are recorded in §10.24. The census commit is followed only by checkpoint-document updates that do not change tracked paths; re-census after any code/path change |
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

1. **Completed for branch names and recursive trees:** §10.24 records all 25 branch HEADs and counts, with all recursive responses non-truncated. Remaining structural work is to compute the global cross-branch unique blob SHA union and a path-to-SHA variance matrix, and reconcile current PR head/base refs against those branch anchors.
2. Materialize a machine-readable audit ledger keyed by `{ref, commit, path, blob_sha, category, semantic_review_state, evidence_links}`. File names alone cannot be classified as reviewed.
3. Prioritize semantic reads in this order: normative IMMORTAL and PRE-RICH canon; EconomicKernel/Haskell/TypeScript projections; MintPolicy/Pyth path; Sale/Issue admission/Treasury/EEV; Reveal/V3/reference-script/P2.8; all workflow YAML and shell/JS runners; B1/B2/B3 verifiers and Materios collectors; governance and fee boundaries; all remaining historical blobs by SHA-deduplicated content group.
4. For Actions, query latest run per active workflow on exact current **protocol-source** HEAD, inspect jobs and decisive logs; record attempt, skipped steps and artifacts. Documentation-only checkpoint commits do not establish protocol test evidence. Do not infer success from workflow conclusion alone.
5. Refresh PR #19 and #35 metadata/diffs, and upstream Materios issue #50/commits, before making promotion or repeat-work decisions.
6. Continue Notion discovery via direct linked pages from the Control Center and topic searches; preserve history. Update only the Control Center index with the final checkpoint commit after the commit SHA is known.
7. After these steps, rerun consistency checks and only then publish global unique-blob/semantic-coverage numbers. The branch-name and live recursive-tree census is complete (§10.24), but the correct overall audit state remains **PARTIAL — structural inventory complete; exhaustive semantic review, current Actions evidence and Notion decision reconciliation remain OPEN**.

### 10.10 Change log

- `2026-10-21`: Added universal roadmap and cross-workstream register U-01..U-17 and applied Cardano/Materios register P-01..P-17; added state vocabulary, dependency tracks, no-repeat rules, Notion discovery links and explicit coverage/access limitations. Documentation-only update on `work/immortal-green-closure`.
- `2026-10-21`: Added SHA-keyed core/kernel and P-06 expiry binding review; reconciled the older coverage ledger with §10.24's completed live recursive-tree census. Global unique-blob union and exhaustive semantic review remain open.


### 10.11 Live issue/PR refresh — 2026-10-21

- The current GitHub branch search returned 25 names; a second request using cursor `MjU` returned no additional names and `cursor=null`. Section §10.24 now records the complete live recursive-tree census for all 25 refs (`truncated=false`). The global cross-branch unique-blob total remains **not recalculated**.
- Issue #20 remains open. Its current body says the existing deployed Prize UTxO was observed expired (`Prize: reveal window closed`, trace `PT5`) and must not be reopened/altered; a fresh authoritative `PreRichExpiryPolicy` plus verified issuance state is required before the first new Preprod Issue. Do not redeploy the existing topology or invent a horizon. [Issue #20](https://github.com/LiberoNuvola/Immortal-Protocol/issues/20).
- Issue #21 remains open and expressly non-blocking to Cardano closure. Its existing work packages already call for adapter obligations, mapping Cardano, deterministic chain-neutral vectors, a chain-independent reference runner, selection of one materially different execution environment, and identical-vector comparison with normalized evidence. Reuse this issue/plan; do not create a duplicate portability issue. [Issue #21](https://github.com/LiberoNuvola/Immortal-Protocol/issues/21).
- Issue #22 remains open and UI-only. It prohibits changing economic semantics/V3, bypassing `AuthoritativeIssueAdmissionProvider`, fabricating EEV/ProtectedCapital/viability/admission in the browser, or weakening fail-closed behavior. [Issue #22](https://github.com/LiberoNuvola/Immortal-Protocol/issues/22).
- PR #19 remains open and is reported `mergeable=false` by the connector. Its wide heterogeneous diff must not be promoted as one unit. PR #35 remains open and draft; the PR body itself states bootstrap/governance review is required and contains a changed V3 carrier mint-policy implementation for future deployment, even though spending-validator/Reveal semantics are stated unchanged. Keep draft pending trusted-base/governance review, exact required checks and scope-specific ledger evidence. [PR #19](https://github.com/LiberoNuvola/Immortal-Protocol/pull/19) · [PR #35](https://github.com/LiberoNuvola/Immortal-Protocol/pull/35).
- Latest decisive exact-source Actions evidence retrieved directly by the connector is still associated with source SHA `1300b79d7460f2abcd79767d5d16dd2564aad064`, not the new documentation-only checkpoint commit: Integration Lab run `39646784077` / attempt 1 completed `cancelled`; V3 Fast Ledger run `39646783837` / attempt 1 completed `cancelled`; Emulator Reveal run `39646783971` / attempt 1 completed `failure`. The checkpoint commit is not a new protocol-source test result.
- The connector's PR search identifies open PRs #19 and #35, and issue search identifies #20–#22 as open. This query scope does not establish the full closed-PR/issue history; a history-wide reconciliation remains open.


### 10.12 PR discovery follow-up — current open-PR search

A subsequent open-PR search exposed two additional open PRs that were not listed in the prior checkpoint table and must be reconciled before any merge/promotion decision:

- [PR #28 — keep Yaci devnet alive through integration smoke test](https://github.com/LiberoNuvola/Immortal-Protocol/pull/28): currently open and connector-reported `mergeable=true`. This does not establish that its diff is safe or that its fix is represented on the exact active HEAD. Compare its focused diff and current-head workflow evidence with the existing Yaci changes in green and PR #19 before deciding whether it contains any unique work. Do not merge as part of this audit.
- [PR #23 — make DApp game-first while preserving verification](https://github.com/LiberoNuvola/Immortal-Protocol/pull/23): currently open, draft, connector-reported `mergeable=true`. Reconcile it with Issue #22 and branch `feat/pre-rich-game-ui`; verify UI-only scope and isolate any provider/protocol changes before considering promotion. Keep draft until its own acceptance criteria and source diff are reviewed.

Open-PR search now returned #19, #35, #28 and #23. `mergeable=true` is GitHub metadata only and is not a correctness or policy approval. The open PR/issue query remains a current search result rather than a complete closed-history audit.


### 10.13 PR diff-scope and decisive Actions-step audit — 2026-10-21

This section records a targeted diff review of the four currently surfaced open PRs and the exact steps of three recent decisive Actions runs. It does not constitute a complete closed-history audit.

#### Open PRs — current head/base and changed-path scope

| PR | Current state | Changed paths observed | Audit disposition |
|---|---|---|---|
| [#19](https://github.com/LiberoNuvola/Immortal-Protocol/pull/19) — CI/conformance gates | Open, non-draft, connector reports `mergeable=false` | Broad: dozens of workflow YAMLs, shared setup actions, Cardano observation/runtime/provider code, kernel/governance, Reference Adapter vectors, PRE-RICH on-chain code, tests, audit scripts and docs | **Do not promote wholesale.** It is not a CI-only PR despite its title. Split/review each security/economic boundary independently; verify exact current head, base, required checks and no-regression tests. Its broad scope overlaps other PRs including #28/#35. |
| [#23](https://github.com/LiberoNuvola/Immortal-Protocol/pull/23) — game-first DApp | Open, draft, connector reports `mergeable=true` | 27 changed paths reported: `.env.example`, admission/provider/runtime code, V3 carrier, issue-admission Plutus, relayer, UI bridge, styles/assets and ecosystem page | **Keep draft.** This is not purely visual: the diff touches provider/runtime/V3 and IssueAdmission. Compare its shared paths with #19 and #35 and isolate UI-only work from authority/provider changes. Issue #22 remains its UX contract, not permission to bypass admission. |
| [#28](https://github.com/LiberoNuvola/Immortal-Protocol/pull/28) — keep Yaci alive | Open, non-draft, connector reports `mergeable=true` | 3 paths: `.github/workflows/immortal-cardano-lab.yml`, `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs`, `audit/cardano-integration/v3-carrier-ledger-probe.mts` | **Focused but security-sensitive.** It changes CI lifecycle capture and the V3 mint policy from `AssocMap` extraction to exact `txInfoMint == singleton ownCs tokenName 1`; do not infer correctness from mergeability. Preserve the already-passed V3 behavior as a regression oracle; do not change V3 during this audit. Compare its exact patch with #19/#35 and current target branch. |
| [#35](https://github.com/LiberoNuvola/Immortal-Protocol/pull/35) — evidence-gated contribution PR gate | Open, draft, connector reports `mergeable=true` | 14 paths reported, including contribution gate/template, governance CI, Cardano lab, V3 mint policy, P2.8 materializer, V3 ledger probe and docs | **Keep draft.** Process/gov-control-plane changes plus V3 policy and ledger instrumentation are heterogeneous. The gate is a process classifier, not a protocol certificate. Require trusted-base review, exact-head checks and separate review of every protocol-sensitive path before promotion. |

The changed-path results are retrieved from the paginated PR filename API; PR patch content was inspected for the overlapping critical paths. No PR was changed or merged. `mergeable=true` is GitHub's mergeability metadata, not security approval.

#### Actions: exact source commit, job and decisive steps

All three runs below are bound to source SHA `1300b79d7460f2abcd79767d5d16dd2564aad064` and attempt 1; they are not tests of the later documentation-only checkpoint commits.

- **Integration Lab** [run 39646784077](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077), job `119384332143` (`devnet-integration`), conclusion `cancelled`. Steps 1–24 completed successfully, including setup/build, Yaci startup, isolated Aiken Reveal candidate publication and positive/negative ledger twins. Crucially, step 25 real Cardano ledger smoke, step 26 Yaci cost-model probe, step 27 native V3 carrier, step 29 active Aiken V3 Reveal trace, steps 30–33 economic traces (FundTreasury, TicketIssued 500x, Expire, Claim), and steps 36–44 (P2.8 context materialization, UTxO decoder, P2.8 gate, footprint, invariant/admission/settlement/predeploy gates) were **skipped**. An evidence packet was uploaded (artifact `immortal-cardano-lab-evidence`, 57,889 bytes) and a JEV registry/prompt was generated from actual step outcomes. Therefore this run demonstrates setup plus isolated Aiken twins and evidence plumbing, **not** the native economic Reveal/Claim/P2.8 acceptance path.
- **V3 Fast Ledger** [run 39646783837](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783837), job `119384331577` (`v3-carrier-ledger`), conclusion `cancelled`. V3 artifact generation/verification and the real Cardano ledger smoke transaction passed (step 16); the actual V3 carrier ledger execution (step 17) was cancelled. Artifacts `immortal-v3-plutus-build-log` (1,126 bytes) and `immortal-v3-carrier-fast-evidence` (20,852 bytes) exist. This is not a V3 carrier pass because the decisive step did not complete; it does not overturn earlier historical V3 PASS evidence, but it adds no new pass.
- **Emulator Reveal** [run 39646783971](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783971), job `119384333198` (`emulator-reveal`), conclusion `failure`. Fresh Plutus build/artifact binding and isolated emulator smoke passed (steps 8–11); step 12 `Run real PRE-RICH Reveal emulator conformance` failed. Steps 13–14 budget probe and transaction-size component measurement passed but are explicitly diagnostic-only, not acceptance evidence. No artifacts were listed for this run. This confirms the Reveal blocker remains open; diagnostic success does not make the failed acceptance test pass.

#### Updated no-repeat rule

Do not rerun the same cancelled lab and report a generic green result. The next lab run should be authorized only after the intended execution predicates are explicit and the workflow will not skip the required native transaction, economic transitions and P2.8 packet. Do not repeat the Reveal budget probe as acceptance evidence; use it only when a changed, falsifiable hypothesis is attached to the run. For V3, preserve its prior known-good evidence and investigate only the new run's cancellation/trigger path; do not change V3 semantics.


### 10.14 Shared-path collision matrix for open PRs

The open PRs overlap on security- or runtime-sensitive paths; treat them as competing patches until the exact target-base comparison is complete:

| Shared path / concern | PRs touching it | Required treatment |
|---|---|---|
| `.github/workflows/immortal-cardano-lab.yml` | #19, #28, #35 | Three-way compare exact patch and target HEAD; confirm lifecycle, conditions and skipped acceptance steps; no workflow result from one head transfers to another. |
| `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs` | #28, #35 (and broad adjacent V3 changes in #19) | Preserve V3 semantics; review the exact-mint constraint and negative twins on the exact candidate commit; do not merge an entire PR just to obtain the policy change. |
| `audit/cardano-integration/v3-carrier-ledger-probe.mts` | #28, #35 | Confirm probe's observed inputs, ledger endpoint and evidence packet provenance; a probe script passing is not a carrier execution pass unless its decisive transaction step completes. |
| `.env.example`, `HaskellIssueAdmissionProvider.ts`, `EconomicAdmission.ts`, V3 carrier/IssueAdmission path | #19 and #23; adjacent authority and evidence paths in #35 | Separate presentation-only edits from provider/authority changes. Browser or relayer data must not become authoritative EEV/admission merely because UI flow needs it. |
| Contribution gate, workflow permissions, and PR declaration | #35, with CI-policy overlap in #19 | Gate must be evaluated against trusted base policy and exact head SHA; it is not a normative change approval or a substitute for required CI/security review. |

**Minimum promotion sequence (not executed):** (1) compare each PR to its current base SHA; (2) resolve shared-path conflicts as individual reviewed changes; (3) run required workflows on the exact proposed target SHA; (4) verify critical negative cases and provenance-bound evidence; (5) only then consider separate promotion under repository governance. No merge, cherry-pick or branch mutation was performed by this audit.


## 10.15 Focused semantic review — Issue admission / EEV authority (2026-10-21)

This is a targeted source review, not a full line-by-line review of all tracked blobs. File identity was fetched from the named refs; findings below are bounded to the inspected source text.

| Source | Ref / blob SHA | Observation | Classification |
|---|---|---|---|
| `src/preRichIssueAdmissionBridge.ts` | `work/immortal-green-closure` / `8e594655f68fb3c9f267703a85474e6fd1f25f8e` | Adds candidate-specific EEV qualification, requires `DEPLOYMENT_APPROVED` and profile `PRE-RICH-EEV-USDM-DIRECT-V1`, and binds approval source to the exact Pool UTxO reference. | Implemented fail-closed checks in source; concrete live authority evidence remains separate. |
| `src/authoritativeIssueAdmissionProducer.ts` | `work/immortal-green-closure` / `d45adc23f78349c8537d8d3aa3c5c01da7d8ed6f` | Defines an injected producer boundary and explicitly does not derive EEV, ProtectedCapital, viability, or gate booleans. | Interface/adapter only; does not itself materialize an authoritative source. |
| `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` | `work/immortal-green-closure` / `f0c794892104b25e64e94f402c1dd0f5d604364e` | Runs a Haskell decision producer and compares state/action/post-state digests against signed authority binding; requires a supplied observation source and direct-USDM value. | Binding/verification logic present; authority signature, source qualification, and live observation still require concrete evidence. |
| `relayer/preprodIssueObservation.js` | `work/immortal-green-closure` / `737b63f38848e73274bd47ef0d7500db6d2d4392` | Discovers exact Counter and B1 PrizePool UTxOs, validates datum shape and timestamps, but receives `poolUsdmValue` and `authoritativeStateProducer` as inputs. | Observation boundary only; it does not prove the supplied valuation is derived from qualified canonical USDM units. |
| `plutus/Economic.hs` | `work/immortal-green-closure` / `e50366a65ce34e9433d5ff179dfc03a35a24c1a1` | `poolUsdmValue` belongs to a conversion path using `totalUsdmValue` / `oraclePriceFor`; source comments describe asset-specific oracle valuation, not a raw USDM-only quantity read. | Confirms the critical distinction: do not treat `poolUsdmValue` as `VerifiedUSDM` under the direct-USDM profile without a separately qualified derivation. |
| `src/preRichIssueAdmissionBridge.ts` | `main` / `8d0fb18b8423fd93a232e370e97b7cc352322ed3` | Older bridge accepts an `EconomicAdmissionWitness` and checks the authenticated Pool input and valuation match, without the additional EEV deployment-approval/profile contract present on green. | Material branch delta; do not port wholesale. |
| `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs` | `work/immortal-green-closure` / `b778d8a559d4050a565ac5f49a8d5cccb5451b42` | Seed consumption plus exact singleton mint constraint. | Frozen V3 semantics; preserve. |
| `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs` | `main` / `b88e901576071024bb2b02f6c5d066900ed35e2a` | Same intended seed/exact-token constraint expressed through `AssocMap` helper functions. | Different implementation/blob; no semantic change authorized by this audit. |

### Consequence and next evidence gate

1. The green branch has stronger admission-boundary checks than `main`, but those checks do not themselves make the injected producer, source signatures, EEV derivation, or Pool liquidity observation authoritative.
2. `PRE-RICH-EEV-USDM-DIRECT-V1` must derive the verified quantity of canonical USDM physically present in the exact qualified B1 PrizePool UTxO. The existing `Economic.poolUsdmValue` path is a general oracle-conversion function and must not be substituted for that direct quantity.
3. Keep the Issue blocker open until a concrete, authenticated observation and qualification packet bind: canonical USDM asset identity, exact Pool UTxO, quantity, snapshot slot/time, source and verification references, derivation version, evidence digest, EV1–EV7, and deployment approval.
4. No code, workflow, policy, branch, deployment, or ledger state was changed as part of this focused review. This review adds no new runtime or Preprod evidence and does not certify a real Issue.



### 10.16 Canonical work dispatch — branch ownership, dependency tracks and exit gates

**Single source of work allocation.** U-01..U-17 and P-01..P-17 remain the canonical task IDs. W0..W12 in §4 are legacy grouping aliases, not additional backlogs; §8 is a historical priority snapshot. Use this dispatch board for day-to-day routing. Rows below describe dependencies within a lane, not a global priority ranking: the Cardano first-Issue path and the B3/Materios proof path are distinct active tracks and must not silently block one another. Notion's 11 October decision to keep B3-A as an immediate workstream remains compatible with this map. Audit status stays **PARTIAL**; this plan neither certifies source behavior nor authorizes implementation, merge, deployment or ledger action.

#### Branch ownership — one lane per existing branch

| Branch | Assigned lane | Included work | Keep out |
|---|---|---|---|
| `work/immortal-green-closure` | Primary coordinator + first Cardano closure + universal roadmap | Checkpoint; P-01/05/15/16 Issue, EEV, B2/control, wallet and qualified-liquidity boundaries; P-02 Pyth/MintPolicy investigation; P-03/04 Reveal/P2.8; P-06 expiry decision; P-13 Gate 41; P-17 declarations; U-01..13, U-15..17 as coordination and universal work. | No bulk imports from B3/UI/Aegis/audit snapshots. No invented expiry, fee, threshold or USD/USDM ratio. Keep V3/Reveal semantics frozen. |
| `work/b3-materios-provenance-evidence` | External-proof lane | P-09 GRANDPA/finality witness; P-10 historical storage proof; P-11 execution proof/upstream #50; P-12 Workflow B evidence gates; U-14 Beacon 4 research only. | No duplicate B3 implementation in green; no unchanged zero-witness probe; Beacon 4 does not replace B3. |
| `feat/pre-rich-game-ui` | UI-only lane | P-08 / Issue #22: presentation, accessibility, interaction and UI-only tests. | Provider, admission, EEV, oracle, validator, V3 or wallet-authority changes are not UI-only. Browser must not bypass fail-closed admission. |
| `b1-hardening` | Aegis/hardening research | P-14 and relevant U-06 governance/hardening experiments with explicit research labels. | Prototype parameters are not normative policy; no import into kernel without explicit decision and conformance evidence. |
| `merge/workflow-b-closed-main` | Existing PR #35 sandbox only | Trusted-base, contribution-gate and governance CI review. | Not the canonical B3 implementation lane; harness passes are not proof of Materios finality or real Issue admission. Keep draft pending exact-scope review. |
| `main` | Public baseline / reviewed release target | Read baseline; accept only individually scoped and approved promotions. | No direct development or wholesale synchronization from green/B3. |
| `audit/*`, `ops/*`, backup/release snapshots, `fix/cardano-lab-yaci-info`, `copilot/fix-real-preprod-reveal-job` | Historical evidence / diagnostic reference | Reuse only a uniquely relevant blob, artifact or falsifiable regression hypothesis, preserving its SHA/run identity. | No parallel active implementation, automatic cherry-pick or branch deletion. |

Before acting, refresh the actual source HEAD and PR head/base. The branch table is a snapshot, not proof that a historical fix is currently present.

#### Dependency tracks and exit gates — independent lanes may progress in parallel

| Execution lane / dependency | IDs / lane | Next action | Exit gate |
|---|---|---|---|
| 0 — Control | W0 | Keep checkpoint and Notion index synchronized; maintain evidence ledger keyed by exact SHA. | Audit can leave PARTIAL only after live ref/manifest verification, unique-blob review ledger, Actions/PR/issue refresh and Notion reconciliation. |
| Cardano critical path — first Issue | P-01 + P-05 + P-15 + P-16 + P-06 expiry binding | Bind the exact B1 PrizePool UTxO, canonical USDM identity/quantity, qualified EEV packet, control singleton, deployment approval, live endpoint, policy-derived expiry bound to the observed pre-state and final transaction body/post-state. | Authenticated observation + EV1–EV7 + approved direct-USDM derivation + exact final body + wallet signature + confirmed ledger effect + independent reconciliation. Until then: **BLOCKED / NOT ISSUED**. |
| Dependent Cardano acceptance lane | P-04 → P-03; separately P-02 | Make the P2.8 packet/typed context and real native economic steps actually run; diagnose Reveal bytes/reference-witness binding only from fresh builder output. Trace Pyth into MintPolicy only after currency-unit semantics are decided. | Same-SHA native transaction/economic traces and packet; Reveal within ledger size limit. Builds, emulator, budget probes and synthetic vectors alone do not close acceptance. |
| **Active independent proof lane — Materios/B3** | P-09 → P-10; P-11/P-12 separately | Acquire changed-source GRANDPA witness; acquire exact block/hash StateRoot + historical key/value proof; verify independently; refresh upstream #50 only for new commits/witnesses. Keep PR #35 process gates separate. | Proofs cryptographically verify for the stated block and state; finality, storage and execution claims remain distinct. No witness, no B3 closure. |
| Independent design lane — universal semantics/portability | U-01 + U-02 → U-04 → U-03 → U-05 | Map normative definitions to code/projections/consumers; protect universal kernel from PRE-RICH-specific types; freeze deterministic reference vectors before viability proof or second-adapter comparison. | Same vectors and normalized evidence; explicit infinite-horizon proof obligations. Docs or finite tests do not certify viability/portability. |
| Independent operations lane — autonomous evidence | U-08 first; U-12/U-13 research; U-17 infrastructure | Observe a full JEV cycle and a subsequent scheduled cycle; keep AI an untrusted candidate generator and sponsorship as measured research. | Next cycle consumes latest registered prompt without a user message; otherwise autonomy remains inconclusive. |
| Decision lane — policy/governance | U-06/U-07; coordinate P-06 only through canon | Reconcile source-of-truth decisions and distinguish frozen from open choices. | Explicit approved decision and conformance tests; no invented fee, expiry duration, freshness threshold or currency ratio. |
| Separate product/research/release lane | P-08; U-09/U-10/U-14/U-15/U-16; P-07/P-13/P-14 | Isolate UI, declarations, paper claims, CAROB THREE, Gate 41, Beacon 4 and second-adapter work in their assigned lanes. | Claims link to exact evidence; research remains labelled until its own proof gate is met. |

#### PR routing — no wholesale promotion

- **#19:** broad, heterogeneous; review scoped changes only.
- **#23:** draft and not purely UI; separate provider/runtime/V3 changes from visual work.
- **#28:** focused but touches V3 policy and lab workflow; security-sensitive review, with V3 semantics frozen.
- **#35:** draft process gate overlaps P2.8/V3 evidence paths; process acceptance is not protocol acceptance.
- Promotion requires current base/head SHA, isolated changed-path scope, completed required checks on the exact candidate SHA, negative-case/evidence provenance review and governance clearance. GitHub `mergeable=true` is not approval.

#### No-repeat rules

Do not repeat the same zero-witness B3-A probe, Reveal size/budget diagnosis or cancelled Integration Lab without a changed source/input and a falsifiable hypothesis. Do not re-run Pyth parsing tests to answer whether MintPolicy consumes the quote. Do not treat UI progress, generated indexes, PR harnesses or an approval-workflow setup as protocol acceptance.

**Current declaration:** branch ownership and execution routing are now consolidated here; the audit remains **PARTIAL**; no code, branch topology, protocol semantics, deployment or ledger state was changed by this organizational update.



### 10.17 Live recheck after work-dispatch consolidation — 2026-10-21

This refresh records only facts rechecked directly against the current GitHub connector responses. It supersedes older statements only where stated; historical evidence remains pinned to its original SHA.

#### Branch census and active anchors

- Branch search returned exactly 25 names. A second request using continuation cursor `MjU` returned zero names and `cursor=null`. The currently exposed branch-name set is therefore complete for this connector query.
- The previous green source anchor `1300b79d7460f2abcd79767d5d16dd2564aad064` is a pinned historical source snapshot, not current HEAD. PR #19 head tracks the live green branch and therefore advances with each checkpoint commit; do not use the SHA written in an earlier checkpoint snapshot as current. The most recent metadata snapshot is recorded in §5 and must be refreshed before any promotion decision.
- Compare from old green source anchor to current green head reports 14 commits ahead, 0 behind, and a connector-limited changed-file list of 10 entries. The reported paths include new `PythAdaUsdConversionCandidate.ts` and tests, new `plutus/PythAdaUsdConversion.hs` and tests, changes to the Haskell conformance workflow/Cabal suite, a Pyth design-gate document, and this checkpoint. The 10-path response is not treated as a complete path manifest.
- The B3 branch comparison against pinned SHA `2778d3e107f45ee15157fff8ef894905a72070ea` reported identical; the comparison using `main` and pinned SHA `97b09a38742098f17a61eb07734c401aeedccc06` also reported identical. **Anchor discrepancy:** PR #19 metadata separately reports base SHA `8c6873e1d50115659727c82c294426b9a946f1fa`. Until this difference is reconciled through direct ref-head evidence, do not claim that `main` has been fully refreshed or use the conflicting anchor to authorize promotion.
- Recursive manifests and unique-blob counts have not been re-downloaded/recomputed for all 25 current refs. The branch-name census is complete for the query; whole-repository structural and semantic audit status remains **PARTIAL**.

#### PR #19 is the green branch's broad review container

Live metadata reports PR #19 open, non-draft, base `main`, head `work/immortal-green-closure`, connector `mergeable=false`, 402 changed files, 49,138 additions, 2,204 deletions, last updated `2026-10-21T18:53:07Z`. Consequently the documentation-only checkpoint commit is part of the head of an already broad and heterogeneous PR. Keep #19 unmerged; this is not a scoped approval for any code or for the dispatch document as an independently reviewed PR. Do not resolve this by creating a branch or splitting/merging anything during the organizational audit.

PR #23 remains open/draft, base `main`, head `feat/pre-rich-game-ui`, 27 changed files. PR #28 remains open/non-draft, head `fix/cardano-lab-yaci-info`, three changed files and V3/workflow overlap. PR #35 remains open/draft, head `merge/workflow-b-closed-main`, 14 changed files and explicit governance-bootstrap restrictions. Their mergeability metadata does not authorize promotion.

#### P-02 / Pyth conversion candidate status refresh

| Source | Current green branch blob SHA | Updated classification |
|---|---|---|
| `Adapter/CARDANO/observation/PythAdaUsdConversionCandidate.ts` | `ee2b4600c41ddde1b6f0ddf3c9b973259b395a16` | Candidate exact-rational formula only. Requires caller-supplied USD-per-USDM rational and exponent bound; explicitly not production-authoritative. |
| `Adapter/CARDANO/observation/PythAdaUsdConversionCandidate.test.ts` | `0e21939d349e6b8331cfc4849836f8639ffcdad6` | Synthetic parity/non-parity, exponent and invalid-input vectors exist. Test source does not itself prove the current-head suite passed. |
| `plutus/PythAdaUsdConversion.hs` | `43dbe58ab19c3e748bf34af2c77ff97cdd42253c` | Haskell candidate with exact integer/rational arithmetic and caller-supplied USD/USDM ratio/bound; not production-authoritative. |
| `plutus/test/PythAdaUsdConversionTest.hs` | `e30ff098e7b7db32950efac3633dfcb70c49573f` | Synthetic differential vectors exist; no acceptance inference without a run bound to the current code SHA. |
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | `atomicTreasuryPaymentValid` still calls `Economic.totalUsdmValue`; the candidate module is not used by the MintPolicy price-equality path. |
| `audit/pre-genesis-genesis/PYTH-MINTPOLICY-PRICE-BINDING-DESIGN-20261021.md` | `80285b3dcc32c05959b903b399e9717957139925` | Design explicitly remains NOT APPROVED / NOT IMPLEMENTED IN PRODUCTION and identifies same-transaction price substitution as the key binding risk. |

Accordingly P-02 remains **IMPLEMENTED_UNPROVEN / DESIGN DECISION OPEN**, not production-connected or ledger-verified. The new candidate work is meaningful progress and should be preserved; do not repeat parser/formula work. The next P-02 step is to refresh the exact-head conformance run and keep its results labelled as bounded synthetic/differential evidence, while the normative USD/USDM ratio/bound decision and actual MintPolicy quote binding remain separate blockers. No change to `MintPolicy.hs`, the legacy `Economic.totalUsdmValue` path, or protocol semantics is authorized by this organizational refresh.

#### Actions current-head result

A fetch of commit-associated workflow runs for `dfe818d6758679fef220182e1fe0f5bd134e28bd` returned an empty list under that connector's PR-triggered-run scope. This is **not** evidence that no workflow ran for prior code commits: it means the latest documentation-only commit has no runs surfaced by that query. No current-head Pyth or native-ledger acceptance result was found by this targeted recheck.

**Current declaration:** work dispatch is consolidated and the branch name set has been rechecked; source-head reconciliation, 25-tree refresh, unique-blob ledger, full PR/issue history, current relevant Actions results and Notion semantic review are still open. Overall repository audit remains **PARTIAL**.



### 10.18 SHA-keyed review ledger and live branch divergence — 2026-10-21

This section is a reproducible ledger for the targeted green delta discovered after the pinned tree census. “Fetched” means identity/content was retrieved; it does not mean a semantic review or test run. “Scoped review” applies only to the function/section named below. It is not the full-repository review ledger.

#### A. Live ref comparison — promotion warning

Current connector anchors: `main = 97b09a38742098f17a61eb07734c401aeedccc06`; `work/immortal-green-closure = ce01e136a57478dc3bdbf880aa8c84abfdee3918`; `work/b3-materios-provenance-evidence = 2778d3e107f45ee15157fff8ef894905a72070ea`; `feat/pre-rich-game-ui = 9ba77f967fa8f40395bef8c6cee77bf449d94dad`; `fix/cardano-lab-yaci-info = b8530c26ab40531f7f8b7965dc6f74bd05ec7850`; `merge/workflow-b-closed-main = 7bca8d91b65d7af1261d8b7cc4f28f496a73fcba`.

| Comparison (base → head) | Connector result | Interpretation |
|---|---|---|
| `main` → green | `diverged`; green ahead 1,750 / behind 9; compare endpoint returned 300 file entries | Large divergent history and capped file response. Do not treat the 300 entries as a complete path manifest, or green as a scoped PR. |
| `main` → B3 | `diverged`; B3 ahead 1,711 / behind 9; compare endpoint returned 300 file entries | B3 is a separate divergent lane; no bulk merge/synchronization. |
| `main` → UI | `diverged`; UI ahead 38 / behind 9; 27 paths returned | PR #23 still contains provider/runtime/V3-adjacent paths; keep protocol changes outside UI-only acceptance. |
| `main` → Yaci fix branch | `diverged`; ahead 4 / behind 5; 3 paths returned | PR #28 needs its base/head refreshed and exact diffs re-reviewed before promotion. |
| `main` → PR #35 head | `ahead`; 18 commits / 14 paths returned; PR remains draft | Exact current main is its recorded base, but it includes the V3 policy/P2.8 probe overlap; mergeability is not approval. |

PR base/head metadata adds two important cautions:
- Historical PR #19 metadata snapshot from the earlier refresh (402 paths / 49,177 additions; head then `ce01e136...`) is superseded by §5's later metadata snapshot. The durable findings remain: PR #19 is open, non-draft and `mergeable=false`; its base SHA `8c6873e1d50115659727c82c294426b9a946f1fa` was 9 commits behind the pinned `main` SHA in the last compare; it carries green's broad history and is not a scoped CI patch. Do not merge it wholesale.
- PR #23 also reports base SHA `8c6873e1...` (9 commits behind current main); PR #28 reports base SHA `aafad1d24ff678253a045e27114c7e544b2060c3` (5 commits behind current main). PR #35 reports base SHA equal to current pinned main. This is a stale-base/reconciliation issue, not a license to rebase, merge or rewrite refs during this audit.

Branch name search returned 25 names; querying its cursor `MjU` yielded zero additional names and `cursor=null`. This closes the branch-name pagination question for the available connector query, but not the current tree/unique-blob enumeration.

#### B. Targeted green source-delta ledger

The prior pinned green code anchor is `1300b79d7460f2abcd79767d5d16dd2564aad064`. Comparing that SHA with current green returned 14 commits ahead, 0 behind, and ten changed-path records from the compare endpoint. The following rows bind review classification to the exact current blob SHA.

| Path | Current blob SHA | Review state | Finding / limitation |
|---|---|---|---|
| `Adapter/CARDANO/observation/PythAdaUsdConversionCandidate.ts` | `ee2b4600c41ddde1b6f0ddf3c9b973259b395a16` | `SCOPED_SEMANTIC_REVIEW` | Exact integer/rational candidate conversion uses raw price and exponent; USD-per-USDM numerator/denominator and exponent limit are caller-supplied. Candidate/test-only; no production authority. The exponent limit itself is not frozen here and has no intrinsic upper bound in this candidate helper. |
| `Adapter/CARDANO/observation/PythAdaUsdConversionCandidate.test.ts` | `0e21939d349e6b8331cfc4849836f8639ffcdad6` | `SOURCE_REVIEWED_TEST_NOT_RUN` | Synthetic parity/non-parity, fractional-ratio, exponent and fail-closed vectors are present. Source inspection is not evidence they passed on current head. |
| `plutus/PythAdaUsdConversion.hs` | `43dbe58ab19c3e748bf34af2c77ff97cdd42253c` | `SCOPED_SEMANTIC_REVIEW` | Haskell integer/rational counterpart; explicitly candidate-only and requires caller-supplied ratio/bound. Recursive power-of-ten cost depends on the supplied bound; freeze/resource-bound that input before any on-chain integration. |
| `plutus/test/PythAdaUsdConversionTest.hs` | `e30ff098e7b7db32950efac3633dfcb70c49573f` | `SOURCE_REVIEWED_TEST_NOT_RUN` | Synthetic Haskell formula vectors cover parity/non-parity and invalid inputs. No current-head run result established here. |
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | `SCOPED_CALL_PATH_REVIEW` | `atomicTreasuryPaymentValid` still values the exact Treasury output through `Economic.totalUsdmValue`. It does not call the new Pyth conversion candidate or read its result. |
| `plutus/Economic.hs` | `e50366a65ce34e9433d5ff179dfc03a35a24c1a1` | `SCOPED_CALL_PATH_REVIEW` | The existing value conversion still obtains prices via `oraclePriceFor`; this is a general oracle conversion, not direct canonical-USDM quantity. See §10.15 for the same source identity and its Issue/EEV consequence. |
| `audit/pre-genesis-genesis/PYTH-MINTPOLICY-PRICE-BINDING-DESIGN-20261021.md` | `0db67eceec333ec4ba4339d8b927eb5d7bc4dc69` | `PARTIAL_DOCUMENT_REVIEW` | Current design gate includes a bounded software-gate PASS for the isolated Pyth probe and reiterates that genuine signed-update Preprod acceptance, native-ledger tampered-signature rejection, and production MintPolicy binding remain OPEN. This is not a line-by-line review of the whole document. |
| `plutus/PythQuoteCarrierBinding.hs` | `669b99a0e4564504012bda8402b706d0ae7a9a9b` | `FETCHED_NOT_SEMANTICALLY_REVIEWED` | Exact source identity retrieved; content still needs a separate call-path and adversarial-predicate review if needed. |
| `plutus/test/PythQuoteCarrierBindingTest.hs` | `d494f7cf8966cc92ecb120d1c16b8881414651ab` | `FETCHED_NOT_SEMANTICALLY_REVIEWED` | Exact source identity retrieved; do not count as reviewed/green based on existence. |
| `plutus/pre-rich-plutus.cabal` | `3f06a8d28fc121ea19aa591db73f7ff19ef12c31` | `PARTIAL_BUILD-MAP_REVIEW` | The candidate module and suite are registered in the package file; full Cabal file and dependency/build behavior have not received a separate complete review here. |
| `.github/workflows/immortal-haskell-conformance.yml` | `63c87a2b96adad83f9ae1b212310692a7a2690ac` | `WORKFLOW_SOURCE_REVIEWED_RUN_NOT_VERIFIED` | The workflow includes Pyth quote binding and candidate conversion test suites; push path targets green, PR path targets `b1-hardening`. No passing workflow on the current candidate SHA was established by this refresh. |
| `.github/workflows/adapter-sale-conformance.yml` | `1fa2d9a2370f64c7a3b005fb96bda588439f5b20` | `FETCHED_NOT_SEMANTICALLY_REVIEWED` | Two changed lines identified by the compare endpoint; full effect and current-head run remain to review. |

This ledger accounts for the twelve exact source identities above, including two contextual call-path files. Only rows marked `SCOPED_SEMANTIC_REVIEW`, `SCOPED_CALL_PATH_REVIEW`, or `WORKFLOW_SOURCE_REVIEWED_RUN_NOT_VERIFIED` received the limited source-level review stated; none is a whole-repository semantic audit. It deliberately does not assign a numerical coverage percentage.

#### C. Work dispatch impact

1. **Do not duplicate Pyth formula/parser work.** The exact-rational candidate and synthetic vector source exists. The remaining P-02 work is (a) formally decide the USD/USDM relationship and an admissible exponent/resource bound, (b) verify the exact carrier-to-MintPolicy binding, and (c) run the required suites on a named current source SHA. The production price-equality path remains legacy Oracle State-based.
2. **Keep the first Issue blocked until direct-USDM EEV is separately proven.** Nothing in P-02 substitutes for direct observation of canonical USDM in the exact qualified B1 PrizePool UTxO.
3. **Keep PR #19/#23/#28/#35 out of wholesale promotion.** Refreshing the true current target base and reviewing security-sensitive shared paths is required before any promotion decision. No rebase, cherry-pick, merge, branch deletion, deployment or ledger transaction is authorized or performed by this section.
4. **Audit exit remains OPEN.** The next review slices should be selected by changed unique blob SHA, prioritized as: source-of-truth normative files/kernel projections; remaining Pyth quote-binding module/tests; B1/EEV/admission and exact endpoint wiring; Reveal/reference-script/P2.8 runners; B3 collectors/verifiers; then workflow and historical blob groups. Capture for every slice the exact ref/commit/path/blob SHA, the sections actually read, test run (if any), result and residual uncertainty.

**Current declaration (superseded by §10.24 structural census):** branch-name pagination and all 25 live recursive tree responses are confirmed; targeted Pyth/kernel/expiry call-path reviews are recorded by blob SHA; current branch divergence and stale PR bases are surfaced. Global unique-blob SHA union, all-blob semantic ledger, full current Actions history and remaining Notion decision-page reconciliation are still **PARTIAL / OPEN**.



### 10.19 Normative/kernel slice + P-06 expiry binding status — 2026-10-21

This is a targeted semantic review of the highest-priority universal/application boundary and the live expiry call path. It supersedes the old P-06 statement in §10.4 that the policy is blocked only because a duration decision may be absent. It does **not** declare full semantic coverage.

#### A. SHA-keyed core source review

| Source | Current green blob SHA | Review scope / finding | Classification |
|---|---|---|---|
| `docs/00-normative/01_CONSTITUTION_FINAL.md` | `744357df17bd07972dcbeeadbd752fb2e740e196` | Normative root: declares abstract `K*` separately from deployment-certified concrete `K_c`; requires `K_c ⊆ Safe` and `K_c ⊆ Pre(K_c)`, authoritative Ω/perimeter, atomicity, final expiry, and no conformance circularity. | `NORMATIVE_SOURCE_REVIEWED` |
| `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md` | `269dd421aaeebdb9b9176d7d0957914976bb77f8` | C5/C5a/C5b require a declared certified `K_c`, proof/model/disclosure and refinement evidence; C14/17 require Ω completeness and exhaustive obligation partition. | `NORMATIVE_SOURCE_REVIEWED` |
| `IMMORTAL/docs/CONSTITUTION.md` | `744b69ad8ea4414ef90dde90da0ad394e013f88e` | Explicitly marked NON-NORMATIVE reader guide and points back to the canonical root authority. | `AUTHORITY_ALIAS_CHECKED` |
| `IMMORTAL/state/UniversalEconomicState.hs` | `f89fe04c8aad8ca9c5e544fa9c145a38d157826f` | Application-neutral aggregate excludes class ladder/control/Jackpot lifecycle; application-specific policy must be projected before the universal gate. | `SCOPED_SEMANTIC_REVIEW` |
| `IMMORTAL/kernel/UniversalEconomicKernel.hs` | `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785` | Computes ProtectedCapital, RawSurplus, non-negativity and solvency; it is a predicate implementation, not a proof/certificate that any deployment's `K_c` is inductive. | `SCOPED_SEMANTIC_REVIEW` |
| `IMMORTAL/kernel/EconomicGate.hs` | `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127` | Separates immediate executable liquidity from EEV; truth/freshness/obligation booleans are declared inputs and comments explicitly require an external authority/refinement layer. `viabilityGate` consumes an all-successors boolean and does not construct a viability proof. | `SCOPED_SEMANTIC_REVIEW` |
| `IMMORTAL/kernel/EconomicKernel.hs` | `229972487522da6392ff29aa97581096ebc0ff15` | PRE-RICH V3 kernel carries class-aware worst-case exposure, protected capital, reserve/liability deltas, saleability and invariants. | `SCOPED_SEMANTIC_REVIEW` |
| `PRE-RICH/onchain/PreRichEconomicAdmission.hs` | `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a` | Composes transition validity → candidate state → projection → Economic Gate; requires caller-supplied truth/freshness/completeness/all-Ω booleans. The composition code does not itself authenticate those claims. | `SCOPED_SEMANTIC_REVIEW` |
| `PRE-RICH/onchain/PreRichEconomicProjection.hs` | `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13` | Fails closed on invalid profile/state, duplicate class, class exposure mismatch and aggregate reserve/count mismatch; its own comment limits equivalence to selected ProtectedCapital/RawSurplus/solvency predicates, not viability/atomicity/full Cardano equivalence. | `SCOPED_SEMANTIC_REVIEW` |
| `PRE-RICH/onchain/PreRichIssueDecision.hs` | `ec37ea8e656fa399f1e57e2404e0c6a2c5b5ccee` | Builds a canonical Issue candidate and hashes pre-state/action/post-state, but consumes an `IssueDecisionInput`; authority, provenance and signature verification remain external boundary obligations. | `SCOPED_SEMANTIC_REVIEW` |
| `Adapter/CARDANO/serialization/CanonicalEconomicState.ts` | `4754f76d1b6c30f0e6c6032f0e85e82756210c71` | Adapter-facing canonical type excludes PRE-RICH fields and validates shape/non-negativity; type validation alone is not economic-admissibility or authenticity proof. | `SCOPED_SEMANTIC_REVIEW` |

**Interpretation:** the abstraction boundary is materially represented in source, while the constitutional proof obligations remain open. Do not label the existence of these pure predicates as a certified `K_c`, proof of infinite-horizon viability or a fully trustless deployment.

#### B. Expiry decision vs implementation vs on-chain enforcement

The Notion page “2026-09-21 — A1/A2/A3 Policy Closure — Ticket Expiry & Jackpot” records A1 as **mechanism/architecture CLOSED**: lifetime is not an IMMORTAL universal number; each DApp/profile may define a deterministic, state-derived policy and crystallize `expiresAt = issuedAt + H`. It explicitly labels historical 365-day values non-canonical. The issue #20 comment history also records 24h/7d as withdrawn and the subsequent formula-first note; do not resurrect either historical proposal as normative.

| Source | Ref / blob SHA | Finding | Evidence status |
|---|---|---|---|
| `PRE-RICH/docs/GAME-ECONOMY.md` | green `41f69f7c7e7d31a776a92dcd942a3098848947fb`; main `3431169896aea420e7f8bff3c1932abed2c358ac` | Green declares `preRichExpiryPolicyV1`, MIN=2 hours, MAX=300 days and a deterministic state-derived horizon as V1 application/profile parameters. Main retains the closed mechanism while stating numeric profile values remain deployment/application configuration. | Real branch delta; do not generalize the green profile values to IMMORTAL or assume main already contains them. |
| `PRE-RICH/src/PreRichExpiryPolicy.ts` | green `4191763a53124f7d6736bd09694eab660d1faef4`; main `883a47dfc4823ac65c9bbfb9b0354d7719e905c5` | Green defines `preRichExpiryPolicyV1`, clamps derived horizon to 2h..300d, and computes reserve-pressure from `unresolvedReserve / EEV`; main exports only the generic policy interface/helper and does not define V1 numeric parameters. | Green implementation present; no current-head test pass claimed. |
| `src/main.ts` | green `819b199356c6d407af511ed1dbf7fa1ad5ceddc0` | The DApp passes `preRichExpiryPolicyV1` to the Issue builder. | Source call path reviewed. |
| `src/mint.ts` | green `b9b1a7f4846e4cfdf8862368421b8ce7cf8b1534` | Fails closed if expiry policy or authoritative issuance-state snapshot is absent; when the authoritative V3 carrier path is required, it derives state fields from the observed carrier plus the authority witness's `stateHash` and `preEEV`. However, `issuedAtMs = BigInt(Date.now())` is derived from the client clock. | Source path reviewed; issuer-clock binding is a residual blocker. |
| `src/__tests__/preRichExpiryPolicy.test.ts` | green `304244f8189423d21f80bde312ef6ce6b1a6bff2` | Covers deterministic crystallization, min/max clamping and invalid policy/state examples. | Test source reviewed; no current-head passing run verified in this review. |
| `src/__tests__/preRichExpiryEvidence.test.ts` | green `3607ac07a4131d53e7e3d1c74a3f22d277092268` | Covers validity-range expiry eligibility and late-reveal inertness over a fixture-bound expiry. | Test source reviewed; no current-head passing run verified in this review. |
| `.github/workflows/pre-rich-expiry-conformance.yml` | green `a5b5019c85fe3b18abdefcdef7060c9bfe95e553` | Defines a Vitest job for expiry tests, with push filters for green; the existence of workflow/test source is not a recorded run result. | Workflow source inspected; run result unverified. |
| `plutus/MintPolicy.hs` | green `0d59fc05b4c11873984fffd10014bd46d8470509` | `newPrizeDatumValid` validates ticket/pool/commitment/fresh-state/beacon fields but does not constrain `pdIssuedAt` or `pdExpiresAt` to the declared expiry policy or current transaction validity range. The ticket commitment also excludes these fields. | Scoped on-chain call-path review — critical missing binding. |
| `plutus/B1PrizePool.hs` | green `106368b510a52447aa3de7ce951cf615466fc5e8` | `TicketIssued` validates positive price, pending prize, ticket identity/mint and accounting transition; it does not constrain issued/expiry timestamps to the policy-derived horizon. | Scoped on-chain call-path review — critical missing binding. |
| `plutus/PrizeValidator.hs` | green `3e35eeadf3fbb6ace4e8b288106a5ed8f687e66b` | Reveal/Claim enforce the `pdExpiresAt` validity boundary; Expire enforces the lower validity bound and releases reserve. Continuing transitions preserve `pdIssuedAt`/`pdExpiresAt`. These checks consume the stored boundary but do not authenticate where it came from at mint. | Scoped on-chain call-path review. |

**P-06 current classification (supersedes §10.4's prior status):** `INTEGRATION_BLOCKED — on-chain policy/time binding`, not “duration decision absent.” The green DApp uses a profile policy, but a client can supply arbitrary `issuedAt`/`expiresAt` values at datum construction; the inspected MintPolicy and B1 TicketIssued paths do not enforce that those values came from the profile policy and verified issuance snapshot. The on-chain lifecycle later enforces the provided `expiresAt`, which is not equivalent to proving the expiry policy at issuance. The client-clock `Date.now()` is an additional time-authority concern.

**Required closure order (no code change authorized by this audit):**
1. Define and document the on-chain binding predicate for the issuance time, derived horizon and exact verified pre-transition state. The application/profile may use its declared bound values; do not invent a universal IMMORTAL horizon.
2. Add negative conformance cases for caller-chosen distant-future expiry, stale/past issuedAt, arbitrary `expiresAt`, and mismatch between policy-derived and datum values. Verify that the actual MintPolicy/B1 transaction path rejects them, not only the DApp helper.
3. Confirm the time source/validity interval convention for `issuedAt` under Cardano; remove reliance on an untrusted browser wall clock as authority.
4. Run expiry conformance on a named current source SHA, then verify the exact datum/transaction and post-state on a fresh Preprod Issue. The existing expired Prize UTxO remains immutable and must not be reused or reopened.

#### C. Universal-vs-application work routing after this review

- U-01/U-03 remain proof/design work: current kernel and gate implement predicates/interfaces, not the required concrete `K_c` certificate or infinite-horizon proof.
- U-02 remains a controlled architecture extraction task: PRE-RICH V3/profile owns class-specific decomposition and Jackpot state, which are projected into the generic aggregate. Do not perform a destructive refactor before consumer/vector equivalence is evidenced.
- P-01 remains blocked by direct-USDM EEV, authoritative producer/source, final transaction binding and real Preprod evidence.
- P-06 remains blocked as described above. Its next task is the missing on-chain policy/time binding, not another generic expiry formula.
- V3/Reveal semantics and the existing expired Preprod topology remain untouched.

**Audit scope declaration:** these are targeted source reads bound to the listed blobs and call paths. The live branch-name/recursive-tree census is now complete (§10.24), but the global cross-branch unique-blob union, full semantic ledger and current-head Actions refresh remain open; no whole-repository coverage percentage is claimed.



### 10.20 Pyth isolated probe — current software gate evidence (2026-10-21)

The Pyth evidence layer has advanced, but only at the isolated code-feasibility gate. This section binds the observed result to the exact source commit and artifact; it does not promote source authenticity or MintPolicy price binding to PASS.

| Evidence item | Identity | Result and scope |
|---|---|---|
| Source commit tested | `2106daa5f4c93c20cbe2479ae9fa08db0d8f59f6` | Source for `scripts/testPythSignedUpdatePreprod.mts`, `.github/workflows/pyth-native-ledger-probe.yml`, and the isolated Aiken signed-update consumer was fetched by SHA. The current green runner/workflow/validator blobs are identical to those at this commit: runner `fdfb24b90bba739c17bb4afcd4c6f51c0cc7406a`, workflow `5c0a4264ab48878a54b21f18a1188e4126a3a37d`, validator `5df4c0f9ee3833e7a0ac6454001e712a8b935823`. |
| GitHub Actions run | [39659905806](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39659905806) | Both jobs completed successfully: isolated Aiken synthetic source-boundary tests + Plutus V3 consumer compilation, and Node 24 strict TypeScript typecheck of the guarded native-ledger runner. No secrets were required and no transaction was submitted. |
| Job IDs | `119429895721`; `119429896145` | All steps in both jobs returned `success`, including toolchain pinning, synthetic tests, build, artifact capture and runner typecheck. |
| Artifact | `pyth-ada-usd-probe-2106daa5f4c93c20cbe2479ae9fa08db0d8f59f6` (ID `12374150310`) | Size 15,009 bytes; SHA-256 `4ca4299f029ba3d80e6ef7f288be000014fe097a286d73c919009c2e6cc0d9dc`; artifact is currently not expired and its reported expiry is 2026-11-20 19:14:54 UTC. |
| Current runner | `scripts/testPythSignedUpdatePreprod.mts`, blob `fdfb24b90bba739c17bb4afcd4c6f51c0cc7406a` | Default mode fetches a genuine signed Lazer update, resolves the selected Pyth State and writes `PREPARED_NOT_SUBMITTED`; it does not load a wallet or build/sign/submit a transaction. Explicit `submit_preprod=true` is needed for the isolated positive ledger probe. |
| Current manual-only workflow | `.github/workflows/pyth-native-ledger-probe.yml`, blob `5c0a4264ab48878a54b21f18a1188e4126a3a37d` | `workflow_dispatch` only; `submit_preprod` defaults false; dedicated test wallet and service secrets required for submission. No automatic production/Issue path. |

**Pyth classification after this new evidence:**
- `Aiken synthetic tests + Plutus V3 build + runner typecheck`: `TESTED_BOUNDED` at source commit `2106daa...`.
- Genuine signed-update positive acceptance on Cardano Preprod: **NOT OBSERVED** by this run.
- Native-ledger rejection of a tampered signature/payload: **NOT OBSERVED**; the runner's local mutated-payload rejection is not an on-chain negative proof.
- Quote-carrier → actual `plutus/MintPolicy.hs` price-equality path: **NOT BOUND**; MintPolicy still calls `Economic.totalUsdmValue`.
- USD/USDM source/ratio/resource-bound decision and token/source coverage: **OPEN**.
- Production Issue, Treasury, EEV and V3/Reveal path: **UNCHANGED**.

Therefore update P-02 from “candidate sources exist, software run not verified” to **“isolated software feasibility gate passed; genuine signed-update ledger proof and production source-to-economics binding remain open.”** Do not repeat the same synthetic Aiken/build/typecheck job unchanged; next new evidence must be a real signed-update native-ledger transaction with exact deployment State identity and transaction/evidence packet, followed by a separately governed conversion and actual MintPolicy binding. The explicit transaction submission is guarded and was not performed as part of this audit.



### 10.21 Materios B3 live-evidence reconciliation and next acquisition gate — 2026-10-21

This update reconciles the B3 branch against the current Workflow B / Materios triangulation page. The B3 branch comparison against pinned source SHA <code>2778d3e107f45ee15157fff8ef894905a72070ea</code> returned <code>identical</code> (0 ahead / 0 behind). The source artifacts below remain the same pinned implementation/evidence tooling; the recent activity in the B3 decision page is a record of observed acquisition failures, not a new implementation milestone. This is an evidence and work-routing update only.

#### A. Exact current B3 source inventory (bounded)

| Source on <code>work/b3-materios-provenance-evidence</code> | Blob SHA | What is actually present | Qualification |
|---|---|---|---|
| <code>docs/04-verification/MATERIOS-B3-GRANDPA-RPC-UPSTREAM-PATCH-v1.md</code> | <code>5a929ce0795a89391580aa439bab3920e252fd88</code> | Detailed patch specification for wiring the standard Substrate GRANDPA RPC on the upstream Materios node. The document explicitly says NOT APPLIED to Materios. | Handoff/specification, not a deployed endpoint. |
| <code>poc/materios-checkpoint/src/capture-anchor.ts</code> | <code>b99d24ec77c3e617f3b923600a73d86526884668</code> | Fail-closed collector binds header, StateRoot, exact Anchor storage key/value and <code>state_getReadProof</code> to an exact block hash. It records remaining proof/finality tasks. | Evidence capture only; it does not authenticate finality. |
| <code>poc/materios-checkpoint/src/rpc.ts</code> | <code>74f983d5980f25452c6517024528528fdbbfce43</code> | RPC client exposes GRANDPA finality proof/justification extraction and execution-proof request paths; it treats responses as untrusted inputs. | Consumer/transport boundary; endpoint capability and witness acquisition remain environmental dependencies. |
| <code>poc/materios-execution-verifier/src/storage.rs</code> | <code>9b7432f629668aaca5cf7e4db5e26c62ccc22d76</code> | Uses pinned Polkadot SDK proof verification to bind StateRoot, proof, exact key and expected value. | Independent storage-proof verifier source exists; it needs the real target witness. |
| <code>audit/materios-b3/archive-rpc-preflight.mjs</code> | <code>4ca293a0cad972d13429b46dd6e9f450621a005e</code> | Requires the supplied archive RPC to serve header/state root, historical value and read-proof nodes at one exact block hash. | Correct preflight gate; not proof that a usable archive endpoint currently exists. |
| <code>audit/algorithmic-governability/b3-a-witness-packet-boundary.mjs</code> | <code>2365e1656027d7c117405d751928940662126ddc</code> | Validates evidence packet shape and cross-field block/hash binding. Its source explicitly says it does not verify cryptography or establish a real witness. | TESTED_BOUNDED packet boundary only; never classify as B3-A finality PASS. |

#### B. Triangulated acquisition result and evidence classes

The Notion page [MATERIOS B3-A — Authority Transition Triangulation](https://app.notion.com/p/3f6c4454d6d581e5b818f9ab312fce7e) contains the latest 2026-10-21 acquisition entries. The relevant result is a source-specific failure, not a claim that Materios lacks GRANDPA finality:

- Public HTTP and WebSocket endpoints tested at <code>materios.fluxpointstudios.com</code> do not advertise or implement <code>grandpa_proveFinality</code>, <code>grandpa_subscribeJustifications</code>, or <code>grandpa_unsubscribeJustifications</code>; direct calls return <code>-32601 Method not found</code>. The tested public block responses have <code>justifications: null</code>.
- The public RPC method catalogue does not advertise the required standard GRANDPA proof APIs or <code>state_getCode</code>; a separate public gateway discovery response exposed only one bootnode.
- A dense scan of 769 blocks over <code>2,381,088–2,381,856</code> did not capture a raw GRANDPA <code>FRNK</code> justification. The returned head/set-id are untrusted RPC observations, not a certificate. Do not repeat the same scan against the same endpoints/parameters and call the absence global.
- The published snapshot manifest points to <code>materios-preprod-rocksdb-20261016T093001Z.tar.gz</code> (advertised 3.58 GiB), but a read-only ranged GET returned HTTP 404. No archive was downloaded or unpacked; this proves only that this specific URL was unavailable in that test.
- A bounded live storage-inclusion verifier passed against a supplied root/value in a separate run. This does **not** authenticate that root as finalized, and does not close the exact historical state witness for anchor block <code>1856408</code>. The public endpoint had earlier reported <code>UnknownBlock: State already discarded</code> for historical state at that anchor.
- The B3-A witness-packet boundary checks schema/cross-field correspondence only; the real justification, historical authority-set/set-id, transition input commitment, native selector/execution proof, ancestry and quorum still require independently verifiable bytes tied to the exact target.

Evidence sources preserved by the Notion record include:
- public RPC dense scan #39590324041, artifact 12341295881, SHA-256 <code>56c8d7f5c77de9108d5f2993a1dcd7edcbd0c63fb5bb39399117356d11528e31</code>;
- later dense scan / B3-B scoped proof #39590352022, artifact 12342350690, SHA-256 <code>6fdef44520add9fcbf00a37d2789a93ced4cd920a4826c9185d8cb5cac8abd14</code>;
- WebSocket GRANDPA probe #39592480972, artifact 12342328397, SHA-256 <code>9557340a51dc9a279136853a0ffaaa3a5fe1126297293f8f91fafdaac4936f4d</code>;
- gateway peer discovery #39593013066, artifact 12341638901, SHA-256 <code>71d05518456821fcaf342a7f78bd46907aec1ffea325d803ed25cf7449037b42</code>;
- snapshot-pointer availability check #39593881158, artifact 12342744743, SHA-256 <code>b2cce9169cdb321cf37916484aef02a75bdaea126299e26cf5e5c54667dabd88</code>.

The run IDs/artifacts above are carried over from the current Notion evidence register, not freshly rerun by this document update. Their stated scope limits remain in force.

#### C. B3 work routing — no-repeat and dependency discipline

**P-09 / B3-A — <code>BLOCKED_NO_PUBLIC_GRANDPA_WITNESS</code>.** Keep the primary lane on <code>work/b3-materios-provenance-evidence</code>. The next acquisition task is to identify an already-operating, verifiable justification-retaining Full Node/archive or an authorized existing Materios FullClient source and test its actual proof capability. The existing upstream patch document is specified but NOT APPLIED to Materios; a public deployment-intent statement is not endpoint evidence. Do not silently turn this into a new local node operation, another public-RPC scan or a new trust protocol.

Required real packet remains:
<code>exact target header/block hash → genuine GRANDPA justification → historical authority set + set-id → selection/enactment inputs and commitment → native execution evidence → ancestry/quorum → independent verification → VerifiedAuthoritySetTransition</code>.
Do not infer the authority set from a later observed set (the Notion page warns that the observed later set ID 3976/4220 does not establish the historical set for block 1856408).

**P-10 / B3-B — <code>BLOCKED</code> for the exact historical anchor witness.** Keep the already-built collector and pinned Rust verifier. Next executable gate requires a historical-state-capable RPC that can return, for the exact block hash 1856408:
<code>header.stateRoot + Anchors[anchor_id] exact historical value + state_getReadProof</code>.
Then independently verify the trie proof against that root. Do not substitute a recent/live storage-inclusion proof for the historical anchor proof, and never treat inclusion as finality.

**P-11 / Materios execution proof and upstream dependency.** Preserve the existing client/verifier boundary and check upstream issues/commits only when a new endpoint, witness or source revision is identified. Do not reimplement the selector in TypeScript or repeat the old RPC probe without a new input.

**P-12 / Workflow B and PR #35.** Continue to classify harness successes as bounded source/boundary evidence. PR #35 remains an open draft governance/process sandbox, not B3 proof and not the canonical B3 branch.

#### D. Cross-lane interpretation

The B3 acquisition gate is independent of P-01 first Issue. It may progress in parallel, but it must not be “closed” by success in P-2.8, Pyth, a packet-shape test or the DApp Issue path. No change to V3, Reveal, EEV, expiry, the universal kernel, or B3 trust semantics is required or authorized by this organizational reconciliation.

**Current B3 disposition:** B3-A finality/authority witness OPEN; B3-B exact historical anchor witness OPEN; bounded storage inclusion and packet-shape conformance are separately scoped; operator/upstream RPC wiring is specified but not applied. No new transaction, witness, code modification or deployment resulted from this update.



### 10.22 Upstream Materios issue #50 — closed issue, RPC implementation discrepancy (2026-10-21)

This is a source-reconciliation finding, not a protocol-code change. Upstream issue [Flux-Point-Studios/materios#50](https://github.com/Flux-Point-Studios/materios/issues/50), “B3: expose finalized execution proof via materios_b3_calculateCommitteeProof RPC”, is **CLOSED** (created 2026-09-26 18:26:52 UTC; closed 2026-09-26 18:32:36 UTC). Its body specifies a node-side RPC that wraps existing Substrate execution-proof machinery, bound to exact block hash, runtime method and SCALE call data, without reimplementing Materios authority selection. Requested acceptance includes method registration, exact ProofProvider::execution_proof(...) use, tests and a real finalized-block execution-proof fixture.

However, current upstream main content inspected in this refresh does not substantiate that implementation as shipped:

| Upstream source | Current main blob SHA | Observed source fact | Classification |
|---|---|---|---|
| partnerchain/node/src/rpc.rs | 30827863c7b8f6fb507b008cee9f572ec48fe06f | create_full merges only Substrate System, OrinqReceipts and MotraRpc. No materios_b3_calculateCommitteeProof method or proof-RPC module registration is present in this file. | CURRENT_MAIN_DOES_NOT_SATISFY_ISSUE_ACCEPTANCE_AS_WRITTEN |
| partnerchain/node/src/service.rs | 33298f0fbce45ea7f333728302ee8080eaf12ec8 | The service type includes FullClient, constructs GrandpaBlockImport/grandpa_link and runs GRANDPA. This establishes available internal node components only, not an exposed execution-proof RPC. | DEPENDENCY_PRESENT / RPC_NOT_WIRED_IN_INSPECTED_PATH |
| partnerchain/node/Cargo.toml | efcacffc9412c239370b81449b08e9198adaf8d2 | Depends on sc-consensus-grandpa-rpc, but that dependency is not registered in inspected rpc.rs; the issue asks for a separate Materios execution-proof transport, not just a GRANDPA justification endpoint. | DEPENDENCY_PRESENT / REQUESTED_METHOD_UNVERIFIED |

The live issue fetch returned no comments. The bounded upstream PR search for the exact method / “execution proof” returned no matching PR, and a commit search did not recover a landing commit. **This does not prove that no PR/branch ever existed or explain why the issue was closed.** It means the closed status alone cannot be used as evidence that its acceptance criteria were met. The closure reason remains unknown with the currently inspected sources.

#### Required resolution — P-11 stays OPEN

1. Retrieve the issue timeline/closing event and inspect any linked commit/PR/ref if available; do not infer completion from state=closed.
2. Compare the current public upstream main with the exact ref/build actually running the Materios Preprod v6 endpoint. Verify whether the expected method is in that deployed binary, and whether its response binds at block hash, runtime method and callData to the returned result/proof bytes.
3. If the method exists only on a historical/other ref, record exact ref + commit and compare it with the target runtime before considering any dependency upgrade. If no implementation can be located, classify the upstream item as closed-but-acceptance-unverified and keep the existing IMMORTAL consumer/verifier boundary; do not silently recreate the RPC.
4. After transport is established, obtain a real execution-proof fixture at a concrete block and independently verify it under the existing proof contract. This still does not replace B3-A's independent GRANDPA finality/ordered authority-transition witness.

**No-repeat:** do not repeat public GRANDPA scans already shown unable to return justifications, and do not infer execution proof from availability of FullClient, an RPC dependency, a closed issue, or a packet-shape harness.

**Dispatch consequence:** P-11 remains INTEGRATION_BLOCKED / UPSTREAM CLOSURE DISCREPANCY on work/b3-materios-provenance-evidence. It is a distinct acquisition/integration gate from P-09 B3-A finality and P-10 B3-B historical storage. B3 remains a parallel lane; no change to V3, Reveal, the IMMORTAL kernel or protocol trust semantics is required by this finding. No upstream or IMMORTAL code has been modified by this audit entry.



### 10.23 Notion decision-register reconciliation — 2026-10-21

A reconciliation was performed between the current GitHub policy/profile sources and the dated Notion records. This section exists to prevent stale OPEN labels from becoming duplicate work items.

| Notion source | Historical label found | Current effective classification | Disposition |
|---|---|---|---|
| [2026-09-21 A1/A2/A3 Policy Closure — Ticket Expiry & Jackpot](https://app.notion.com/p/3e2c4454d6d5812c9514e16afeded763) | A1–A3 explicitly CLOSED at the semantic/architectural application-policy layer; numeric expiry is not an IMMORTAL universal constant. | Canonical policy decision. | Preserve; implementation/conformance remains separate. |
| [03 — Open Decisions & Roadmap](https://app.notion.com/p/3d9c4454d6d581738bf2c461a8694a2e) | An older “OPEN SET — esattamente 3” lists Jackpot payout mode, exact ticket expiry duration and future allocation. | Stale historical snapshot that conflicts with the later A1/A2/A3 closure and current green Game Economy spec. | Do not treat those three bullets as current normative choices. Direct targeted editing of this long Notion page was rejected with a validation error, so the page was not overwritten; a current reconciliation pointer must live in the PRE-RICH Control Center. |
| [09 — Definitive Decision Register](https://app.notion.com/p/3d9c4454d6d5811e8bece49c16cf2c9d) | Its 14 September snapshot repeats those three choices as OPEN, although later sections contain CLOSED conclusions for expiry mechanics and payout/release behavior. | Historic register snapshot, not an authoritative current open-work list without its later reconciliation entries. | Keep historic decisions intact; avoid spawning new policy design work from the old header list. |
| `PRE-RICH/docs/GAME-ECONOMY.md` on green | Current policy closure table declares expiry mechanism and Jackpot decisions CLOSED; exact profile values remain application/deployment scope. | Green application-policy source currently names `preRichExpiryPolicyV1` with 2h..300d profile bounds. | The branch delta must be respected; main still has the generic policy boundary without the green V1 bound implementation. |
| Issue #20 | Open issue says an authoritative profile policy/state and real Preprod acceptance are required. | **IMPLEMENTATION/INTEGRATION blocker**, not a request to invent a universal duration. | Close only after on-chain policy/time/state binding, adversarial transaction negatives and a fresh Issue/Reveal acceptance packet. |

The result must be stated as **three closed semantic/application decisions with conformance residuals**, not three still-open normative questions:
- A1: state-derived profile expiry mechanism is closed; for current green V1 the application bounds are 2 hours..300 days, but those bounds are not IMMORTAL constants. On-chain issuance binding remains open (see §10.19).
- A2: full currently locked Jackpot balance paid exactly once is the current PRE-RICH policy.
- A3: no fixed Jackpot allocation percentage; default funding is the minimum state-derived gap to the current floor.

This reconciles policy ownership only; it does not close Issue #20, certify the current branch on Preprod, or approve a release. For the larger review, Notion's historical pages remain useful provenance, but the Control Center and this checkpoint must identify which dated decision has current authority. Overall audit is still **PARTIAL / OPEN**.



### 10.24 Complete live branch tree census — 2026-10-21

A fresh GitHub REST branch list returned **25 branches**. The recursive tree endpoint was fetched for every listed branch HEAD, and all 25 tree responses returned `truncated=false`. The table below is the live structural manifest summary, not the semantic audit ledger. `Entries` includes both file blobs and tree entries; `Blob files` counts paths whose entry type is blob; `distinct blob SHAs (within branch)` deduplicates repeated content within that one tree only.

| Existing branch | HEAD SHA at census | Tree entries | Blob files | Distinct blob SHAs within branch | Truncated |
|---|---|---:|---:|---:|---|
| `audit/adapter-sale-conformance` | `272413a38bb882ad1313ea63491697c11b8e8b38` | 383 | 331 | 320 | false |
| `audit/claim-b1-conformance` | `1e64ec9f31ba50e04e36b4576ba66d73bfefc0a8` | 377 | 328 | 317 | false |
| `audit/kernel-invalid-class-fail-closed` | `50e80bd1787412bc62a582d95c8fb653bd2baa3a` | 380 | 329 | 318 | false |
| `audit/p2-8-b1-baseline-size-2026-09-21` | `d73f39199ae53e79e415daa68d91fe2cd92a62c2` | 380 | 329 | 318 | false |
| `audit/p2-8-b1-cardano-ledger-runner` | `9ec325e1ca7be43d573ce71560824d9134e1bea1` | 635 | 563 | 557 | false |
| `audit/p2-8-b1-inline-haskell-uplc-diagnostic-2026-09-21` | `b7cb39a708755f7bd0b3faccca79b3f4e5f58b1c` | 381 | 330 | 319 | false |
| `audit/p2-8-b1-inline-runtime-diagnostic-2026-09-21` | `f84b37ad14d4c7bf5ad6141ae624c71c469ba5f9` | 381 | 330 | 319 | false |
| `audit/p2-8-b1-lucid-evolution-2026-09-21` | `ace1e78bca47562b7cbecb7f47ddb45de9f89bfc` | 384 | 331 | 320 | false |
| `audit/p2-8-b1-reference-budget-diagnostic-2026-09-21` | `259d7dc21f135c1af9ec6e6c8418cdc074618300` | 381 | 330 | 319 | false |
| `audit/p2-8-b1-reference-scripts-2026-09-21` | `c55b6e82d76551c267d91078f48750ce5c469750` | 524 | 459 | 453 | false |
| `audit/p2-8-reveal-size-2026-09-21` | `3afb09b341e44ef3ba4541be74b4bd227cda36b4` | 377 | 328 | 317 | false |
| `b1-hardening` | `c561393e7eb842529aeaa272377e5afe0138d085` | 418 | 359 | 350 | false |
| `backup/main-before-curated-promotion-2026-09-24` | `d861329e4ff85ed8255176717de9d54f93ad871f` | 228 | 199 | 190 | false |
| `copilot/fix-real-preprod-reveal-job` | `3c845c20314f952a859db3e48fdba948cebc8607` | 853 | 756 | 749 | false |
| `feat/pre-rich-game-ui` | `9ba77f967fa8f40395bef8c6cee77bf449d94dad` | 858 | 759 | 742 | false |
| `fix/cardano-lab-yaci-info` | `b8530c26ab40531f7f8b7965dc6f74bd05ec7850` | 848 | 751 | 744 | false |
| `main` | `97b09a38742098f17a61eb07734c401aeedccc06` | 853 | 756 | 749 | false |
| `merge/workflow-b-closed-main` | `7bca8d91b65d7af1261d8b7cc4f28f496a73fcba` | 859 | 762 | 755 | false |
| `ops/b2-preprod-new-workflow` | `30f7cb46b6d798919f6ba323770a78ed27ac596c` | 852 | 755 | 748 | false |
| `ops/b2-preprod-zero-input-dispatch` | `151834415a1db922b008eabe93b224cfd83d3b14` | 846 | 749 | 742 | false |
| `ops/expose-b2-preprod-dispatch` | `b2a1a14713289a6a82eb59b4d3483d891eb797ab` | 846 | 749 | 742 | false |
| `release/issue-admission-boundary-squash` | `5b04f0c005bc983dd9be6427d78ff232e0240f20` | 848 | 751 | 744 | false |
| `release/public-main-curated-2026-09-24` | `04f2684244ddbf26946980ab764e4336fd2ab0a7` | 557 | 489 | 483 | false |
| `work/b3-materios-provenance-evidence` | `2778d3e107f45ee15157fff8ef894905a72070ea` | 1110 | 997 | 991 | false |
| `work/immortal-green-closure` | `337da0e6bb01f8e6373ae441be74867ddc79c1e7` | 1067 | 947 | 941 | false |

**Aggregate structural result:** 15,626 tree-entry occurrences across the 25 trees; 13,767 blob-path occurrences; 13,547 branch-local distinct-blob counts when summed across branches. The final number is **not** the number of globally unique blob SHAs because identical SHAs are shared between branches. The exact cross-branch unique SHA union and path-to-SHA variance matrix are not yet recomputed; no global unique-blob count is claimed.

The census supersedes earlier non-current file counts such as green 940. The exact green HEAD at census was `337da0e6...`; the following checkpoint-only update changes the checkpoint blob but adds/removes no file path, so tree/file counts remain unchanged while the HEAD SHA advances. This census closes **branch-name and recursive-tree pagination/structural inventory**; it does not close semantic review, historical PR/issue reconciliation, current-head Actions review or Notion source reconciliation. No branch was created/deleted and no code or runtime state was changed.



### 10.25 Census reconciliation and next audit unit — 2026-10-21

Section 10.24 supersedes older statements in §§10.8–10.11 and §10.19 that the live recursive-tree refresh was still pending. All 25 current branch HEAD trees were fetched and are non-truncated. The tracked structural census is therefore **COMPLETE** for that snapshot.

The remaining structural task is not another branch-name search: it is the **global union of blob SHAs across all 25 tree manifests**, plus path-to-SHA variance and an explicit link from each review record to its exact blob SHA. The aggregate 13,547 figure in §10.24 is a sum of per-branch distinct SHA counts and must not be mistaken for global uniqueness.

Next audit slice:
1. Reconcile the current branch heads against the census snapshot. Current branch tip can advance via documentation-only checkpoint commits without changing tracked path counts; do not let that obscure protocol-source SHA.
2. Compute the global unique-blob denominator from the 25 complete tree payloads. If the connector cannot expose/store the raw tree payloads for machine deduplication, record that access limitation rather than inferring the union from aggregate counts.
3. Extend the semantic ledger only with source reads bound to exact blob SHA and explicit review scope; prioritize Pyth quote binding, B1 EEV/Issue admission, Reveal/P2.8 runners, and B3 proof verifiers.
4. Refresh latest Actions on the exact protocol-source SHA separately from checkpoint-only commits. The structural census does not upgrade any test, ledger or Preprod claim.

No protocol code, test, workflow, branch topology or ledger state was modified.


### 10.26 Global blob-SHA deduplication ledger — 2026-10-21

The 25 branch HEAD trees captured for this census have now been merged into a single path/SHA index. Each tree response was re-fetched from the exact pinned commit in the branch inventory and returned `truncated=false`. The resulting machine-readable artifact is:

- [REPO-WIDE-BLOB-LEDGER-2026-10-21.json](REPO-WIDE-BLOB-LEDGER-2026-10-21.json)
- Ledger commit: `b3cc28b108d4a99054184fe82ec16b2ee4958313`

| Global identity measure | Verified result |
|---|---:|
| Branch HEADs in snapshot | 25 |
| Recursive tree-entry occurrences | 15,626 |
| Blob-path occurrences across branch trees | 13,767 |
| Sum of branch-local distinct blob SHA counts | 13,547 |
| **Globally unique blob SHA identities** | **1,811** |
| Unique paths across all branch trees | 1,275 |
| Unique path/SHA pairs (path content variants) | 1,874 |
| Paths with more than one SHA across branches | 337 |
| Semantic reviews completed by this census | 0 |

The 1,811 global count is computed by taking the union of actual blob SHA values, not by summing branch-local distinct counts. The path/SHA matrix records the exact branch set for each content version at a path; the SHA ledger links each immutable content identity to its observed paths and branches. Size consistency was checked for each repeated SHA.

**Scope and interpretation:** this closes the cross-branch blob identity and path-variance census for the pinned snapshot. It does not mean 1,811 blobs have been semantically reviewed. Every semantic-ledger entry is explicitly initialized as `NOT_REVIEWED`; no semantic classifications, test conclusions, or release approvals are inferred from file identity. The snapshot's green HEAD is `3373b3044b9c251da1ec217d128f5dcb3c87c894`; the ledger/checkpoint commits that follow are coordination-only and must not be represented as new protocol-source or CI evidence.

**Next gate:** use the immutable blob SHA as the review unit; record review scope, normative layer, branch/path context, evidence references, result and unresolved dependency. Prioritize the Pyth-to-`MintPolicy` quote binding, B1 direct-USDM EEV / authoritative Issue admission, Reveal/P2.8 size and execution evidence, and B3/Materios authority/finality and historical-state proof boundaries. Refresh Actions separately on each exact protocol-source SHA. Overall audit remains **PARTIAL / OPEN**. No protocol logic, V3/Reveal semantics, branch topology, ledger state, or deployment was changed by this census.


### 10.27 Semantic review slice 1 — Pyth source-to-MintPolicy binding — 2026-10-21

A scoped static review has been recorded against the exact blob SHAs in protocol-source snapshot `3373b3044b9c251da1ec217d128f5dcb3c87c894`.

- Review record: [SEMANTIC-REVIEW-PYTH-MINTPOLICY-BINDING-2026-10-21.md](SEMANTIC-REVIEW-PYTH-MINTPOLICY-BINDING-2026-10-21.md)
- Review commit: `fa32e2ac776855c149a75b9075e671a84dfec0e4`
- Updated machine ledger: [REPO-WIDE-BLOB-LEDGER-2026-10-21.json](REPO-WIDE-BLOB-LEDGER-2026-10-21.json)
- Ledger status-update commit: `aaa01626676055493526fc0831eb05d56f30a923` (clarifies scoped static-review counts versus fully qualified semantic closure)

**Finding F-PYTH-01 — source price is not bound to the production settlement predicate.** `MintPolicy.atomicTreasuryPaymentValid` calls `Economic.totalUsdmValue`, which selects quotes through the configured legacy Oracle State reference-input path. The current MintPolicy call graph does not require or read `PythQuoteCarrierBinding.extractBoundPythAdaUsdQuote` and does not consume the Pyth conversion candidate. Thus Pyth verification and the legacy quote can remain separate facts; the intended quote-substitution gap remains open.

**Finding F-PYTH-02 — USD/USDM conversion is still an unapproved normative choice.** The conversion candidate accepts the USD-per-USDM ratio and exponent bound as explicit inputs but is not wired into production valuation. No parity assumption, new rounding behavior, or conversion parameter is authorized by this review.

**Finding F-PYTH-03 — carrier binding code is not yet production/native-ledger proof.** The helper enforces carrier shape and exact continuation identity/value, while the isolated Aiken carrier binds the datum to the selected raw Pyth tuple. Authenticity still requires the Pyth verification script to execute in the same transaction, and MintPolicy does not currently force that carrier spend.

**Finding F-PYTH-04 — synthetic conformance is not end-to-end acceptance.** Reviewed unit/candidate tests use fixtures; the cross-module D=1/1 vector is test-only. This review did not dispatch the manual native-ledger probe, re-run CI, or submit a Cardano transaction. Historical run references were not refreshed and are not reclassified as current evidence.

| Ledger measure after scoped review | Result |
|---|---:|
| Globally unique blob SHA identities | 1,811 |
| SHA entries with scoped static-review records | 16 |
| SHA entries still `NOT_REVIEWED` | 1,795 |
| Full semantic audit complete | No — `PARTIAL / OPEN` |

The ledger now points the 16 reviewed blob identities to this review record and lists the relevant findings per SHA. A scoped static review only applies to the exact immutable content identities recorded; it does not make a source path globally reviewed across other historical versions.

**Next gate:** keep the Pyth issue blocked until the source-of-truth hierarchy approves the USD/USDM conversion contract, the exact transaction-bound quote is used by the Treasury valuation predicate, and positive/negative combined V2/V3 native-ledger transactions establish the source binding and resource fit. No change to protocol code, conversion policy, V3/Reveal semantics, branch topology, runtime or ledger state resulted from this review.


### 10.28 Semantic review slice 2 — B1 direct-USDM EEV and Issue admission — 2026-10-21

A targeted source/evidence review is recorded in [SEMANTIC-REVIEW-B1-EEV-ISSUE-ADMISSION-2026-10-21.md](SEMANTIC-REVIEW-B1-EEV-ISSUE-ADMISSION-2026-10-21.md), review commit `b61aebd95abb4fa7c3774d6eddcb4cd9e6902367`. The machine ledger update is commit `7ab7f818bae1363ba8cec7794c224848e7a552c6`.

#### Corrected evidence classification for P-01

GitHub Actions run [#39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) completed successfully and uploaded artifact `immortal-preprod-eev-approved` (artifact ID `12324421376`). The artifact was downloaded and inspected. It contains:
- EV1–EV7 qualification and a separate `DEPLOYMENT_APPROVED` decision for profile `PRE-RICH-EEV-USDM-DIRECT-V1`;
- candidate-bound source UTxO `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`;
- physical direct-USDM amount `1000000000` atomic units and derived EEV `100000` IMMORTAL USDM sub-units by `floor(atomicQuantity * 100 / 1000000)`;
- source observation time `2026-10-21T05:57:26.613Z`, approval `validFrom=2026-10-21T05:57:26.889Z` and freshness rule `LIVE_UTXO_REVALIDATION`.

The approval workflow head was `main` `97b09a38742098f17a61eb07734c401aeedccc06`; its workflow YAML explicitly checked out the qualification pipeline at pinned source commit `0e5fa575f84e3759655b6d0a3492b2f0b79aa446`. Keep workflow-head provenance distinct from the code ref used for the qualification scripts. The run's deployment manifests report `reusedExisting=true` and no bootstrap transaction hash.

**Interpretation:** do not continue to label the direct-USDM EEV deployment approval itself “missing.” It is established for that recorded candidate/snapshot. The same artifact explicitly says it does not authorize Issue admission and requires revalidation of the exact UTxO plus authenticated control state, ProtectedCapital, viability/liquidity and the authoritative Issue decision. The live status of the Pool UTxO was not re-queried during this review.

#### Current residual blockers

1. **P-01 remains BLOCKED for end-to-end Issue**, not for existence of an EEV approval. No current green-source successful Direct-USDM conformance run was established in this review; workflow `.github/workflows/pre-rich-direct-usdm-conformance.yml` defines Vitest, strict TypeScript boundary checks, authority/admission conformance and browser build, but these must be evidenced at the exact current protocol-source SHA. The approval workflow's step list itself did not run those tests.
2. The exact real Issue transaction is still not evidenced from the intended wallet. The builder/minimum-UTxO/Treasury-output price-equality boundary and the live `/issue-admission` authority response must be captured in one completed transaction evidence packet. Approval artefact, factory, or endpoint presence alone cannot close this.
3. Existing green admission code has fail-closed cross-bindings for the Pool candidate, Counter, B2 control state, V3 carrier, signed Haskell state/action/post-state digests, ProtectedCapital components, viability proof set and EV1–EV7. Those are static source findings, not proof that the production endpoint is currently wired, fresh or invoked for an accepted user transaction.

#### Ledger state after the second scoped review

| Measure | Result |
|---|---:|
| Globally unique blob SHA identities | 1,811 |
| Entries with a scoped static review record (Pyth + B1) | 37 |
| Entries still `NOT_REVIEWED` | 1,774 |
| Fully qualified semantic closures | 0 |
| Full semantic audit | `PARTIAL / OPEN` |

The ledger marks the B1 source/test/workflow blobs by exact SHA and links them to this review. Test files marked `REVIEWED_TEST_SOURCE_RUN_NOT_CONFIRMED_CURRENT_GREEN_SHA` were statically inspected; their presence/digests are not represented as execution evidence. No protocol source, workflow, V3/Reveal semantics, branch topology, current ledger state or deployment was modified by this review.


### 10.29 Semantic review slice 3 — Reveal reference-witness binding and P2.8 — 2026-10-21

Scoped review: [SEMANTIC-REVIEW-P28-REVEAL-REFERENCE-SCRIPTS-2026-10-21.md](SEMANTIC-REVIEW-P28-REVEAL-REFERENCE-SCRIPTS-2026-10-21.md), review commit `0744227cb575bee5c50557f5f43be5bf26d00eb9`. The deduplicated ledger records the exact reviewed blob identities in commit `cd9c9301ccf5dd9ee2ec9e432638a7b7c5c93681`.

#### Freshly inspected Actions evidence — retain both outcomes separately

- [PRE-RICH Emulator Reveal #39646783971](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783971), source SHA `1300b79d7460f2abcd79767d5d16dd2564aad064`, failed before the canonical Reveal spending transaction was built. The error occurs at `prize-reference-complete:start`, while completing the transaction that publishes the PrizeValidator reference script: the publication transaction measured `16782` bytes against `maxTxSize=16384` (398 bytes over). This is not a measurement of the final Reveal transaction. The diagnostic-only size probe raises its local size ceiling to 100000, gets through publication, then fails during Reveal construction with `Spend[0] attempted to instantiate a non-polymorphic term` before final CBOR/counters are emitted; negative cases stop at build and are `INCONCLUSIVE_NOT_SUBMIT_REJECTION`, not ledger-rejection evidence.
- [IMMORTAL Cardano Integration Lab #39646784077](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077), same source SHA, ended `cancelled`. Yaci startup and isolated Aiken Reveal fixture twins completed, but the real Cardano smoke, V3 carrier execution, economic Reveal/Claim/Expire/FundTreasury traces, raw P2.8 context materialization, typed UTxO decoder and native P2.8 gate were skipped. Artifact `12367697468` is setup/fixture evidence, not native economic or P2.8 acceptance.

The checkpoint's historical Preprod Reveal builder measurement of ~17,571 bytes and the 16,782-byte PrizeValidator reference-script publication transaction belong to different paths/fixtures. Do not conflate their numbers. Both relevant constructions are over the 16,384-byte bound; no protocol-limit increase is permitted.

#### Source-to-CBOR binding finding

`audit/cardano-integration/revealReferenceScripts.ts` has a strong final-CBOR assertion helper: publication transaction CBOR binds the exact reference UTxO output, and the completed transaction must contain the expected reference inputs, expected spending inputs/redeemers and continuing outputs, embed zero Plutus scripts, and fit the active size ceiling. The Yaci `reveal-ledger-trace.ts` uses these helpers.

The actual `audit/cardano-integration/preprod-real-reveal.mjs` runner calls `.readFrom([prizeReferenceUtxo, poolReferenceUtxo])` and checks the signed transaction's serialized size, but does not call either binding helper and does not inspect/assert that the final witness set contains zero embedded Plutus scripts or that both reference UTxOs are exact outputs of verified publication transaction CBOR. Source-level `.readFrom` tests therefore do not close reference-witness conversion on the real Preprod builder.

No relevant Reveal builder, P2.8 workflow, reference-script helper or core Reveal validator SHA changed between source snapshot `1300b79d…` (the above exact-head runs) and `3373b3044b9c…`; this review did not rerun an unchanged hypothesis.

#### Closure gates and current status

P-03 Reveal size/reference-witness binding and P-04 native Cardano-ledger P2.8 remain **`OPEN / INTEGRATION_BLOCKED`**. The next meaningful candidate is a narrow, reviewed builder/evidence update that invokes the verified published-reference binding and final-CBOR assertions in the actual Preprod path, records size / active maxTxSize / exact reference inputs / embedded-script counts before signing, then proves `<= 16384` bytes. Only a transaction that passes that gate should proceed to native context materialization and the full `tx.cbor + utxo.json + pparams.json + epoch-info.json + system-start.json + manifest.json` packet. The real Preprod workflow requires explicit dispatch with `run_reveal=true`; no dispatch was performed here.

#### Ledger update after slice 3

| Measure | Result |
|---|---:|
| Globally unique blob SHA identities | 1,811 |
| Entries with scoped static review records (Pyth + B1 + P2.8) | 51 |
| Entries still `NOT_REVIEWED` | 1,760 |
| Fully qualified semantic closures | 0 |
| Full semantic audit | `PARTIAL / OPEN` |

Fourteen source/workflow/test/evidence-contract SHA entries were added to this slice. The core `B1PrizePool.hs` and `PrizeValidator.hs` identities were compared across snapshots but deliberately remain `NOT_REVIEWED` semantically. No protocol source, workflow, V3/Reveal semantics, branch topology, Preprod transaction or ledger state was changed.


### 10.30 Semantic review slice 4 — Materios B3-A/B/C proof boundaries — 2026-10-21

Scoped review: [SEMANTIC-REVIEW-MATERIOS-B3-PROOF-BOUNDARIES-2026-10-21.md](SEMANTIC-REVIEW-MATERIOS-B3-PROOF-BOUNDARIES-2026-10-21.md), review commit `7cc94a392103678be5dc779cc754d8ec1051d497`. Ledger update with 20 exact B3 source/workflow/design SHA entries: `3763d75212b94036767550e1d127997a56f8ef27`.

#### New verification of the latest acquisition artifact

P2P probe [#39601026951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951) completed with `NO_RAW_GRANDPA_PROOF_CAPTURED` and uploaded artifact [`12346387679`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951/artifacts/12346387679). The artifact was downloaded and inspected read-only:
- expected and observed genesis hashes match (`0x0e46e33f…849f7bf`);
- requested block 1,856,408 / hash `0x7db6da35…4cfdf44e` has a reconstructed header hash match;
- no `FRNK` justification was attached to the exact target, and the artifact contains zero captured GRANDPA justifications;
- native Smoldot warp-sync logs are fixed at block 97,069 for 350 seconds (36 observations: 22 in progress, 14 idle);
- the reported current/finalized HTTP head is explicitly marked an untrusted observation only.

Artifact ZIP SHA-256: `ae98dadea115687f01ef6db3f30bd1ced8dc501651932ecd3a3ecdfd287a3dfa`. The capture implementation and core GRANDPA/B3 verifier blobs used by this run match the current B3 HEAD `2778d3e107f45ee15157fff8ef894905a72070ea`; the run's workflow file has since gained a one-shot push trigger and documentation changed. The result remains relevant to the same acquisition implementation, but is not labelled as a CI run on the current B3 HEAD.

**Interpretation:** this is a source-specific failure of the pinned P2P acquisition path under its bounded observation window. It does not establish that no existing archive/full node or authorized Materios FullClient can provide a justification. Do not repeat the same probe/scan unchanged.

#### B3-A, B3-B and B3-C remain independent proof gates

- **P-09 / B3-A — `BLOCKED_NO_PUBLIC_GRANDPA_WITNESS`.** The collector extracts real `FRNK` bytes from the RPC transport; the IMMORTAL verifier checks signatures, quorum, set-id and ancestry against a supplied trusted authority state. The separate `VerifiedAuthoritySetTransition` gate must authenticate how that historically applicable authority set was selected. The capture artifact has no justification to feed to the verifier.
- **P-10 / B3-B — `BLOCKED_EXACT_HISTORICAL_ANCHOR_WITNESS`.** The anchor collector requires a historical-state-capable `MATERIOS_ARCHIVE_RPC`, reads header/storage/read-proof at one exact block hash and fails if `proof.at` mismatches. The native Rust trie verifier validates a supplied state root/key/value, but synthetic fixture success cannot bind that root to the target block's independently verified finality.
- **P-11 / B3-C — `INTEGRATION_BLOCKED / UPSTREAM CLOSURE DISCREPANCY`.** Issue [#50](https://github.com/Flux-Point-Studios/materios/issues/50) remains closed with zero comments, but current upstream `main` `partnerchain/node/src/rpc.rs` blob `30827863c7b8f6fb507b008cee9f572ec48fe06f` does not register `materios_b3_calculateCommitteeProof`; the existing IMMORTAL patch spec is still marked `NOT APPLIED`. A closed issue, `FullClient`, dependency declaration or a client transport stub is not proof that the RPC is in the deployed node. Do not reimplement the selector in TypeScript.

#### Next executable source change / acquisition gate

Do not change the trust protocol and do not create another duplicate B3 implementation in green. First identify a concrete, already-operating archive/full node or authorized existing Materios FullClient source with proof-retention capability. Then acquire the exact block's genuine GRANDPA justification and exact historical state proof as separate evidence; independently authenticate the applicable authority transition; and resolve the exact upstream #50 implementation/deployment ref before attempting a block-bound execution-proof fixture. Beacon 4 research does not substitute for B3.

#### Ledger state after slice 4

| Measure | Result |
|---|---:|
| Globally unique blob SHA identities | 1,811 |
| Entries with scoped static-review records (Pyth + B1 + P2.8 + B3) | 71 |
| Entries still `NOT_REVIEWED` | 1,740 |
| Fully qualified semantic closures | 0 |
| Full semantic audit | `PARTIAL / OPEN` |

Twenty SHA entries were reviewed as source/workflow/design artifacts; the actual witness artifact is separately bound by run/artifact/hash in the review. Test-source identities were not represented as test execution. No IMMORTAL protocol code, upstream Materios code, branch topology, proof semantics, ledger state or deployment was modified.


### 10.31 Semantic review slice 5 — universal kernel boundary and policy-source drift — 2026-10-21

Review record: [SEMANTIC-REVIEW-NORMATIVE-KERNEL-PRE-RICH-POLICY-DRIFT-2026-10-21.md](SEMANTIC-REVIEW-NORMATIVE-KERNEL-PRE-RICH-POLICY-DRIFT-2026-10-21.md), commit `d2784efac6c09521e1e1a386ba9e134525269a49`. Ledger update: `f9844076aa3db61d0038ad59886cf3669ce9272a`.

#### Static kernel-mapping result

The reviewed mapping is coherent at the represented projection boundary: `PreRichEconomicProjection.hs` validates the profile and class aggregation, checks unresolved reserve/count against class-wise values, derives worst-case exposure from the profile payout bound, and maps locked Jackpot amount into universal `additionalProtectedCapital`. Its conformance predicate compares V3 and universal `ProtectedCapital`, `RawSurplus` and solvency functions. Test source `ProjectionBoundaryConformanceTest.hs` includes Issue/Reveal/Claim/Expire deltas, locked-Jackpot preservation and malformed-state rejections.

This is **not** closure of the wider economic boundary. The canonical IMMORTAL v3.0.0 corpus explicitly keeps `K_c` certification and `Ω) completeness as profile/deployment obligations and does not claim a universal non-empty viability kernel. The conformance matrix retains OPEN for authoritative observation provenance, Economic Gate integration/authority binding, viability certification and full V3 → PRE-RICH → Adapter → Cardano equivalence. The Adapter `EconomicObservation.ts` only validates non-negative time and canonical-state shape; `ok: true` is not proof of truth/authenticity/freshness.

The projection/gate test sources and workflow were statically inspected but not rerun in this review.

#### Confirmed normative source-label conflict

The current green snapshot still has a documentation conflict:
- `PRE-RICH/docs/GAME-ECONOMY.md` and the reconciled current decision register mark A1 expiry mechanism and A2 Jackpot payout mode CLOSED, A3 no fixed allocation percentage CLOSED as unnecessary, with exact expiry numeric bounds retained as application/profile parameters.
- `PRE-RICH/docs/CONSTITUTION.md` still says Jackpot payout mode is OPEN and exact duration is OPEN.
- `PRE-RICH/docs/ECONOMIC-ALGORITHM.md` still references `OPEN-01` for payout mode and `OPEN-02` for exact lifetime.
- `IMMORTAL/docs/ECONOMIC-ALGORITHM.md` calls itself a NON-NORMATIVE reader guide at its header but calls the algorithm “normative protocol logic” in its closing status paragraph.

This is **normative source-label drift**, not an instruction to reopen the economic decisions or alter current payout/expiry mechanics. Because the PRE-RICH Constitution is presented as the project/application constitution and sits above Game Economy in the stated source-of-truth hierarchy, its stale OPEN labels cannot be silently ignored. The next governance-document task is to have the normative owner approve a narrow, versioned supersession pointer to the dated A1/A2/A3 closure, mark the older OPEN labels as historical/superseded, and clarify the IMMORTAL reader guide's authority label. No such source document was edited by this audit slice.

#### Ledger state after slice 5

| Measure | Result |
|---|---:|
| Globally unique blob SHA identities | 1,811 |
| Entries with scoped static-review records | 98 |
| Entries still `NOT_REVIEWED` | 1,713 |
| Fully qualified semantic closures | 0 |
| Full semantic audit | `PARTIAL / OPEN` |

Twenty-seven exact blob identities were reviewed; all are linked to this review record in the machine ledger. Test-source identities are not counted as test execution, and no policy or conformance status has been declared closed by this source review. No protocol code, normative source text, branch topology, workflow run or ledger state was changed.


### 10.32 Semantic review slice 6 — P-06 on-chain expiry policy binding — 2026-10-21

Review record: [SEMANTIC-REVIEW-P06-ONCHAIN-EXPIRY-POLICY-BINDING-2026-10-21.md](SEMANTIC-REVIEW-P06-ONCHAIN-EXPIRY-POLICY-BINDING-2026-10-21.md), commit `822dbb67762115bb86f2ae5cb76866990f01cb7d`. Ledger update: `c61755df9e6c590e6e424c9a44097849dd0459c7`.

**P-06 remains `OPEN / INTEGRATION_BLOCKED`, and Issue [#20](https://github.com/LiberoNuvola/Immortal-Protocol/issues/20) remains open.** This is not a request to invent or change the ticket lifetime. The PRE-RICH V1 policy exists, with policy ID `pre-rich-expiry-v1`, version 1, state-derived horizon, and application bounds 2 hours–300 days.

The reviewed source boundary is now precise:
- `src/mint.ts` fails closed if the expiry policy/state are absent and crystallizes timestamps before building the PrizeDatum. However, it accepts a caller-provided `expiryPolicy` object, permits caller-provided `expiryIssuanceState` (whose own source comments assign verification responsibility to the caller), and takes `issuedAtMs` from the DApp process clock. The generic expiry helper checks determinism and input shape; it does not authenticate the policy, state hash or source snapshot.
- On-chain `PrizeDatum` contains `pdIssuedAt` / `pdExpiresAt`, but has no policy ID/version, horizon or issuance-state commitment.
- `MintPolicy.newPrizeDatumValid` validates ticket identity, price commitment, clean Pending/BeaconPending shape and registry round, but does not bind the timestamps to an authorized policy/snapshot or the issuance validity interval.
- `B1PrizePool.TicketIssued` binds the minted NFT, Pending PrizeDatum, price, reserve and solvency, but not expiry provenance.
- `PrizeValidator` enforces the stored time boundary for Reveal/Claim/Expire and preserves timestamps on later continuing datums. That proves enforcement of the value stored, not that the value was authorized at creation.

Unit-test sources exercise V1 horizon derivation, clamps and lifecycle predicates with fixtures; the Issue refinement evidence schema does not include expiry policy binding. The expiry workflow is TypeScript/Vitest-only, not a Plutus on-chain binding test. Its pull-request path filter names legacy `PRE-RICH/tests/conformance/*` paths while the reviewed current tests live under `src/__tests__/*`; this filter discrepancy is included as an evidence-routing issue. No workflow was dispatched in this review and no test run is claimed.

#### Closure gates

1. At the authoritative Issue boundary, select the authorized PRE-RICH V1 policy rather than treating any deterministic caller-supplied policy as authorized.
2. Bind `issuedAt` to the approved transaction-time/validity contract and `expiresAt` to the exact policy result computed from the same authenticated pre-Issue snapshot.
3. Make the policy/version and snapshot commitment verifiable by the on-chain issuance validators; a non-empty off-chain `issuanceStateHash` is not itself authentication.
4. Add negative on-chain vectors for arbitrary/future `issuedAt`, expiry before issuance, bounds violations, altered policy/state binding and timestamps inconsistent with the authorized policy; correct the PR path filter and run tests at the exact SHA.
5. Only after those gates, obtain a new provider-backed Preprod Issue and follow-on lifecycle evidence. Do not alter the already-expired historic ticket or redeploy existing topology as an audit shortcut.

#### Ledger state after slice 6

| Measure | Result |
|---|---:|
| Globally unique blob SHA identities | 1,811 |
| Entries with scoped static-review records | 113 |
| Entries still `NOT_REVIEWED` | 1,698 |
| Fully qualified semantic closures | 0 |
| Full semantic audit | `PARTIAL / OPEN` |

Sixteen expiry-related blob identities were reviewed; 15 were previously `NOT_REVIEWED`. Existing review references were preserved in evidence references. Review counts still mean static inspection only, not test execution or closure. No protocol source, policy semantics, workflow, branch topology, Preprod state or ledger state was changed.


### 10.33 Semantic review slice 7 — B2 control carrier single-signer boundary — 2026-10-21

Review record: [SEMANTIC-REVIEW-B2-CONTROL-SINGLE-SIGNER-BOUNDARY-2026-10-21.md](SEMANTIC-REVIEW-B2-CONTROL-SINGLE-SIGNER-BOUNDARY-2026-10-21.md), review-document commit [`063f0469daed175e35771506b46456a6b3583ed6`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/063f0469daed175e35771506b46456a6b3583ed6). Machine ledger status was updated for the ten exact source/test/workflow blob identities listed by that review. This is a static review on the frozen source snapshot `3373b3044b9c251da1ec217d128f5dcb3c87c894`; it does not rebase the census onto documentation-only HEADs.

**Finding:** the current Plutus control carrier is authenticated by a single configured `PubKeyHash`, not by the off-chain Beacon B2 committee threshold. `ActivateControl` / `ContractControl` validate monotonic state shape and non-empty decision/observation references, but those references are not cryptographically bound to a verified quorum payload and the activation predicate described by the candidate design is not independently evaluated by the validator. The off-chain `services/beacon-b2-verifier` verifies synthetic Ed25519 quorum envelopes but is not bound into the Plutus transition guard. This is a single-key authority boundary, not an evidenced trustless/permissionless committee path.

The one-time mint policy enforces seed consumption and the exact singleton mint field, but not the carrier-script destination; placement into the carrier is performed by the deployment builder. The off-chain observer fails closed on singleton/datum/configuration shape, but its mocked-UTxO tests are not on-chain transition tests.

**CI/evidence finding:** `.github/workflows/pre-rich-b2-control-conformance.yml` omits `PRE-RICH/onchain/**` from its push filter and excludes those files from its artifact cache key. A source-only edit to the carrier can therefore miss automatic conformance and leave the conformance artifact cache key unchanged. The separate B2 Preprod deployment workflow is manual-only and was not dispatched here. The conformance job builds/exports the artifacts and runs off-chain TypeScript/Node suites; no Plutus carrier-specific negative-vector execution is evidenced by this review.

#### Ledger state after slice 7

| Measure | Result |
|---|---:|
| Globally unique blob SHA identities in the pinned census | 1,811 |
| Entries with scoped static-review records | 123 |
| Entries still `NOT_REVIEWED` | 1,688 |
| Fully qualified semantic closures | 0 |
| Full semantic audit | `PARTIAL / OPEN` |

The semantic ledger now links ten additional blob identities to this slice. A source review is not test execution, native-ledger proof, B2 deployment approval or permissionless-authority qualification. B2's authority model must be explicitly resolved under the existing source-of-truth hierarchy before any trustless/permissionless claim; no new control rule or quorum protocol is invented here. No protocol code, B2 transition semantics, V3/Reveal semantics, workflow, branch topology, transaction or deployment was changed by this review.


### 10.34 Protocol-source SHA and Actions evidence refresh — 2026-10-21

**Refresh performed after the global blob ledger and semantic-review slices 1–7 were already present in repository history.** Do not repeat the global deduplication task as if it were still pending: §10.26 and `REPO-WIDE-BLOB-LEDGER-2026-10-21.json` record the pinned census result of 1,811 globally unique blob SHA identities, 1,275 unique paths, 1,874 path/SHA pairs, and 337 paths with multiple SHA variants. The pinned ledger is a historical immutable-source census, not a claim about the branch's current documentation tree.

#### Source-anchor reconciliation

A GitHub compare of protocol-source anchor `3373b3044b9c251da1ec217d128f5dcb3c87c894` against current green HEAD `bb3d5472779f768dfe2980bac3d8c9b66a32fa7e` reports 24 commits ahead, 0 behind. The compare's changed-file set is documentation/coordination only: the global blob ledger, central checkpoint, and scoped semantic-review records. No protocol source, test, workflow, V3/Reveal semantics or deployment artifact was changed by those commits. Therefore `3373b304...` remains the reviewed protocol-source anchor for the findings below; `bb3d547...` is the current documentation branch tip, not a new protocol-evidence SHA.

#### GitHub Actions attached to the exact protocol-source anchor

A fresh query for workflow runs with `head_sha=3373b3044b9c251da1ec217d128f5dcb3c87c894` returned five completed runs:

| Workflow | Run | Result |
|---|---:|---|
| Protocol Declaration Conformance | [39663657006](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39663657006) | SUCCESS |
| IMMORTAL Portability Conformance | [39663657346](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39663657346) | SUCCESS |
| Algorithmic Governability Adversarial Lab | [39663657001](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39663657001) | SUCCESS |
| Documentation Link Check | [39663656998](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39663656998) | SUCCESS |
| Cardano Adapter Sale Conformance | [39663657049](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39663657049) | SUCCESS |

The query returned five runs total for this SHA. These are real results on the exact anchor, but they do **not** establish a passing current run for Pyth-to-MintPolicy binding, B1 direct-USDM EEV/authoritative Issue admission, Reveal/P2.8 native execution or B3/Materios proof verification. No workflow was dispatched as part of this refresh. Do not upgrade any of those gates based on the five successes above.

#### Updated gate state

- **Global blob identity census:** COMPLETE for the pinned snapshot; 1,811 unique blob SHAs. Keep the immutable ledger as the denominator for existing scoped reviews.
- **Semantic review:** seven scoped review slices recorded; full audit remains `PARTIAL / OPEN`, with zero fully qualified semantic closures.
- **Actions evidence refresh:** partial. Five exact-anchor runs verified; relevant specialized workflows and evidence chains remain individually unproven unless their own exact-SHA run/artifact/ledger evidence exists.
- **Next work unit:** refresh each specialized workflow/evidence chain independently at the correct source SHA, starting with Pyth production binding and the existing B1/EEV, Reveal/P2.8 and B3/Materios blockers. Record only observed runs and artifacts; do not dispatch deployment, mint or mutate protocol semantics as an audit shortcut.

This section is a coordination/evidence update only. No protocol code, test, workflow, branch topology, on-chain state, mint, merge or deployment was changed.


### 10.35 Specialized gate evidence refresh — 2026-10-21

This update follows the seven existing semantic-review slices; it does not repeat the global SHA census. Green branch reconciliation confirms that `work/immortal-green-closure` is exactly at checkpoint commit `8467e90883d87003516157850d9be16ef0a67106`. Compared with reviewed protocol-source anchor `3373b3044b9c251da1ec217d128f5dcb3c87c894`, green is 25 commits ahead and 0 behind; the added commit set is the immutable blob ledger, checkpoint, and scoped review records only. Keep `3373b304...` as the reviewed protocol-source anchor. Do not use the documentation HEAD as if it were a new protocol-test SHA.

#### Exact evidence refresh

| Gate / evidence | Exact observation | Current classification |
|---|---|---|
| **Pyth quote → production MintPolicy** | SHA-pinned source review `SEM-PYTH-MINTPOLICY-BINDING-2026-10-21`: `plutus/MintPolicy.hs` blob `0d59fc05b4c11873984fffd10014bd46d8470509` calls `Economic.totalUsdmValue` through `atomicTreasuryPaymentValid`; it does not consume `extractBoundPythAdaUsdQuote` or `pythAdaUsdToUsdmSubunitsCandidate`. `plutus/Economic.hs` blob `e50366a65ce34e9433d5ff179dfc03a35a24c1a1` selects publisher/freshness-bound legacy `OracleQuote` values from the authenticated Oracle State domain. | **BLOCKER CONFIRMED**. Pyth carrier and conversion candidate are not a production dependency. USD/USDM denomination and rounding contract are not authorized. |
| **Pyth native-ledger workflow** | `.github/workflows/pyth-native-ledger-probe.yml` blob `5c0a4264ab48878a54b21f18a1188e4126a3a37d` is manual-only. It accepts a verified Pyth policy ID and has `submit_preprod=false` by default; submission of two test-only Preprod transactions requires explicit opt-in. No run was dispatched during this audit. | **NOT EXECUTED ON CURRENT SOURCE**. Candidate Aiken/unit tests or a correctly shaped quote are not proof of a genuine signed update being consumed by production MintPolicy. |
| **B1 direct-USDM EEV approval** | Run [#39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) completed successfully: job `approve`, all 14 listed operational steps successful. Exact workflow head is `main` / `97b09a38742098f17a61eb07734c401aeedccc06`; the YAML explicitly checked out protocol snapshot `0e5fa575f84e3759655b6d0a3492b2f0b79aa446`. Artifact [`immortal-preprod-eev-approved`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679/artifacts/12324421376), ID `12324421376`, 8,831 bytes, digest `sha256:d219db29890d55e3a63dd9a7ff3b0f04ec53e710a7e77688c8a48610c06d094c`. It records EV1–EV7, `DEPLOYMENT_APPROVED`, source UTxO `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`, physical quantity `1,000,000,000` atomic units, and derived `100,000` IMMORTAL USDM sub-units at observation time `2026-10-21T05:57:26.613Z`. | **HISTORICAL CANDIDATE QUALIFIED / APPROVED; NOT CURRENT ISSUE AUTHORITY**. The evidence requires live exact-UTxO revalidation immediately before admission. The workflow does not establish that a Ticket NFT was issued to the intended user, and its SHA/checkout distinction must be retained. |
| **B1 first real Issue admission** | The EEV workflow itself has no Issue submission. Static admission review still requires current live Pool/Counter/B2/V3 bindings, signed authoritative Issue decision, ProtectedCapital, a concrete viability/Kc-Ω certificate, and exact liquidity evidence. | **BLOCKED / NOT ESTABLISHED**. Do not equate `DEPLOYMENT_APPROVED` EEV with an authorized or successful Issue transaction. |
| **Reference-script publication prerequisite / Reveal size** | Run [#39646783971](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783971), source SHA `1300b79d7460f2abcd79767d5d16dd2564aad064`, failed while completing the PrizeValidator reference-script publication transaction at `2026-10-21T17:51:08Z`: **16,782 bytes** against `maxTxSize=16,384` (398 over). The final Reveal-spending CBOR was not produced/measured by this canonical run. An enlarged local-size diagnostic subsequently passed script publication but failed in local UPLC evaluation before emitting final CBOR. The reviewed builder/workflow/validator blobs relevant to this failure are unchanged at source anchor `3373b304...`. | **INTEGRATION_BLOCKED**. First measure the compiled script and publication transaction boundary; then separately build/measure Reveal. Do not increase `maxTxSize` or change Reveal/V3 semantics. |
| **Real Cardano integration / native P2.8** | Run [#39646784077](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077), same source SHA `1300b79...`, was **cancelled**. Artifact [`immortal-cardano-lab-evidence`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077/artifacts/12367697468), ID `12367697468`, 57,889 bytes, preserves setup and isolated candidate fixtures; real ledger smoke, economic Reveal, context materialization, typed UTxO decode and P2.8 gate were skipped. The Preprod builder still lacks the final-CBOR assertion that proves reference-script witness conversion. | **P2.8 OPEN / INTEGRATION_BLOCKED**. Next run only after a narrow builder change captures final CBOR size, exact reference-inputs, embedded-script count and script/redeemer binding; then require the exact five-file native context packet plus manifest. No Preprod transaction was submitted by this audit. |
| **Materios B3-A finality witness** | Run [#39601026951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951), source SHA `3719db8655cc212deec7736641ac85d235bbf5c5`, built the pinned Smoldot client and uploaded [artifact `materios-smoldot-p2p-finality-evidence`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951/artifacts/12346387679), ID `12346387679`, 6,802 bytes, digest `sha256:ae98dadea115687f01ef6db3f30bd1ced8dc501651932ecd3a3ecdfd287a3dfa`. The proof-availability verdict failed: zero raw GRANDPA justifications were captured for target block 1,856,408 / hash `0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e`. | **B3-A BLOCKED FOR THIS ACQUISITION PATH**. This does not prove global unavailability; change the evidence source to a confirmed proof-retaining archive/full node or authorized witness before probing again. |
| **Materios B3-B historical storage proof** | No same-block packet has been recovered for target header `stateRoot`, exact `OrinqReceipts::Anchors[anchor_id]` SCALE value, and `state_getReadProof` at the identical target hash, followed by independent native trie verification. | **BLOCKED / NO REAL TARGET PROOF**. Local synthetic trie tests do not close the live historical-state requirement. |
| **Materios B3-C execution proof transport** | Current inspected upstream `partnerchain/node/src/rpc.rs` does not register `materios_b3_calculateCommitteeProof`; upstream issue #50 is closed with zero comments, and the local upstream patch specification explicitly remains NOT APPLIED. | **INTEGRATION_BLOCKED / UPSTREAM CLOSURE DISCREPANCY**. Resolve exact upstream/deployed ref and transport provenance; do not implement a duplicate selector in IMMORTAL TypeScript. |

#### Exact operational sequence from these results

1. **Pyth:** preserve the blocker. Resolve the normative USD/USDM denomination and rational/rounding contract through the source-of-truth hierarchy before wiring candidate quote data into production sale logic. Then add cross-binding negative cases and obtain native-ledger evidence using a genuine signed Pyth update. Do not dispatch the guarded Preprod submission as an audit shortcut.
2. **B1:** preserve the historical EV1–EV7 qualification but re-observe and revalidate the exact live Pool UTxO when preparing admission. The first real Issue is a separate gate; concrete viability/Kc-Ω, authoritative control, exact transaction value/UTxO inputs and intended-wallet on-chain output remain required.
3. **Reveal/P2.8:** first address the builder's final serialized-CBOR/reference-script-witness assertion without changing validator or transaction semantics. Re-measure against the active 16,384-byte limit; only a fitting transaction can proceed to the exact-context native ledger evaluator.
4. **B3:** do not repeat unchanged public-RPC/Smoldot probes. Change the acquisition source first; acquire and separately verify finality, exact historical storage proof, and runtime execution proof.

#### Non-regression and status

- Overall repository audit: **PARTIAL / OPEN**.
- Pyth production binding: **BLOCKER CONFIRMED**; unit policy **OPEN**; native signed-update proof **NOT YET EVIDENCED**.
- EEV: **historical candidate qualification and deployment approval confirmed**; first Issue **NOT ESTABLISHED**.
- Reveal size / final witness conversion: **INTEGRATION_BLOCKED**; P2.8 native exact-context evaluation **NOT ESTABLISHED**.
- B3-A / B3-B / B3-C: **BLOCKED** for the distinct evidence requirements above.
- Connector combined commit-status responses were empty for queried SHAs; this interface does not expose a fresh push-run inventory through that response. Therefore absence from that response is **not** treated as proof that no Actions runs exist. The exact workflow run/job/artifact evidence listed above is the basis for the classifications.
- This update adds no protocol source, tests, workflow logic, branch, deployment, ledger transaction, mint, merge, or change to V3/Reveal/economic semantics.


### 10.36 Pull-request and promotion reconciliation — 2026-10-21

Read-only refresh of PR #19 and PR #35 after section 10.35. No PR was edited, approved, marked ready, closed or merged.

#### PR #19 — broad CI/integration repair PR

- [PR #19 — fix(ci): unblock Cardano lab and conformance gates](https://github.com/LiberoNuvola/Immortal-Protocol/pull/19)
- State: **OPEN**, non-draft, unmerged; GitHub connector reports **mergeable=false**.
- Exact head: `work/immortal-green-closure` / `3220e3c3ece764cc4b6308b39e1df6c977a53344`.
- Exact base: `main` / `8c6873e1d50115659727c82c294426b9a946f1fa`.
- Current diff: **413 files**, 117,442 additions, 2,204 deletions. This has expanded from the previously recorded 405-file snapshot.
- Categorized changed paths: 44 workflow YAML files, 2 GitHub Actions, 37 protocol/on-chain/kernel files, 22 Adapter files, 45 audit/runner files, 45 PoC files, 33 application `src/` paths, 16 relayer files, 68 docs, 3 JSON/data files, and 98 other/root/support paths.
- Reviews exposed by the current connector call: zero formal review submissions and zero inline review threads returned; one historical issue comment was returned. Treat this as “no review evidence surfaced by this query,” not as a code approval or an exhaustive proof that nobody reviewed elsewhere.
- Disposition: **DO NOT PROMOTE / HOLD FOR SCOPED REVIEW**. The PR is non-mergeable and combines production-facing source, many workflows, adapter/relayer, audit tools, governance and documentation. A successful unrelated conformance run does not authorize this aggregate diff. First refresh the exact cause of `mergeable=false`, partition the changed paths into independent scope/evidence groups without creating branches, and obtain exact-head CI/review evidence for each production-facing group. Do not resolve this by merging, rebasing, cherry-picking or broad force-updating.

#### PR #35 — Workflow B contribution gate

- [PR #35 — feat(governance): add evidence-gated contribution PR gate](https://github.com/LiberoNuvola/Immortal-Protocol/pull/35)
- State: **OPEN / DRAFT**, unmerged; GitHub connector reports `mergeable=true`.
- Exact head: `merge/workflow-b-closed-main` / `7bca8d91b65d7af1261d8b7cc4f28f496a73fcba`.
- Exact base: `main` / `97b09a38742098f17a61eb07734c401aeedccc06`.
- Diff: 14 files, 1,668 additions, 44 deletions. Includes contribution-evidence/algorithmic-governability workflows, control-plane scripts/docs, P2.8 materialization tooling, and `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs` plus `audit/cardano-integration/v3-carrier-ledger-probe.mts`.
- The PR body itself says **keep as draft** until the governance control plane has been reviewed and the target branch's enforcement rules have been deliberately configured and verified. Reviews/inline threads surfaced by the connector: zero.
- Disposition: **KEEP DRAFT / DO NOT MARK READY OR MERGE**. Mergeability is not proof that repository governance rules are configured or that the control plane resists bypass. Require a deliberate review of branch protections/rulesets, bypass actors/permissions, event/path classification, evidence SHA binding, challenge handling and fail-closed behavior. Review the included V3 carrier mint-policy change as its own protocol-surface boundary; do not infer it is authorized just because the contribution PR labels its other changes non-semantic.

#### Branch and promotion rule

The two PRs have different targets and evidence purposes; neither is an acceptable substitute for closing Pyth→MintPolicy, current B1 Issue admission, native Reveal/P2.8 or Materios B3 proof evidence. Preserve both existing PR states and branch topology. The latest checkpoint commit `3220e3c3ece764cc4b6308b39e1df6c977a53344` is document-only; it does not improve the PRs' protocol-test qualification.

**Overall promotion decision: HOLD.** PR #19 requires scope partition and exact failure/readiness diagnosis. PR #35 remains a governance draft until target enforcement is verified. Overall audit remains **PARTIAL / OPEN**. No PR state, branch, protocol source, workflow, deployment, ledger transaction, mint or protocol semantics were changed.


### 10.37 Exact-head Actions and main ruleset check — 2026-10-21

This final consistency pass uses live GitHub REST responses and is scoped to read-only evidence.

#### Current checkpoint SHA / generic push Actions

Current work/immortal-green-closure HEAD: eb129b7563c62363ccfd880b2bae38057fd9eff7. The branch compares as 27 commits ahead and 0 behind the reviewed protocol-source anchor 3373b3044b9c251da1ec217d128f5dcb3c87c894; the changed-file set versus that anchor remains limited to the global blob ledger, this central checkpoint and seven semantic-review records.

Five push-triggered Actions runs completed successfully at this exact documentation checkpoint SHA:

| Workflow | Run | Result |
|---|---:|---|
| Algorithmic Governability Adversarial Lab | [39678425283](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39678425283) | SUCCESS |
| IMMORTAL Portability Conformance | [39678425380](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39678425380) | SUCCESS |
| Documentation Link Check | [39678425142](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39678425142) | SUCCESS |
| Cardano Adapter Sale Conformance | [39678425066](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39678425066) | SUCCESS |
| Protocol Declaration Conformance | [39678425147](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39678425147) | SUCCESS |

These runs validate their own workflow scopes and are associated with a documentation-only SHA. They do not resolve the Pyth/MintPolicy production binding, do not constitute a new first-user Issue/EEV acceptance, do not close Reveal/P2.8 native-ledger execution, and do not supply missing Materios B3 witnesses. They must not be cited as evidence that protocol-source code changed or the specialist gates passed.

#### PR #19 live mergeability refresh

The direct GitHub Pull Request API now reports [PR #19](https://github.com/LiberoNuvola/Immortal-Protocol/pull/19) as OPEN, non-draft, unmerged, head eb129b7563c62363ccfd880b2bae38057fd9eff7, base main at 8c6873e1d50115659727c82c294426b9a946f1fa, 413 changed files, 1,792 commits in the PR history, mergeable=false and mergeable_state=dirty. The head advanced automatically when this branch's documentation checkpoint moved; the latest head must replace the previous 3220e3c3... snapshot in any current PR assessment.

The exact merge-conflict files were not surfaced by the API call used in this audit. Classification remains HOLD / NON-MERGEABLE; do not infer a conflict-free or promotable state from CI successes.

#### PR #35 and actual main ruleset

[PR #35](https://github.com/LiberoNuvola/Immortal-Protocol/pull/35) remains OPEN / DRAFT at head 7bca8d91b65d7af1261d8b7cc4f28f496a73fcba, base main at 97b09a38742098f17a61eb07734c401aeedccc06, 14 changed files. Its explicit request to remain draft until governance controls are reviewed is still binding.

GitHub repository ruleset [Protect main](https://github.com/LiberoNuvola/Immortal-Protocol/rules/23959424) was fetched directly and reports enforcement=active, target branch ~DEFAULT_BRANCH, and no bypass actors. It protects against non-fast-forward updates and deletion and requires linear history. However its pull_request parameters require 0 approving reviews, do not require code-owner review, do not require approval of the last push and do not require review-thread resolution. Its required_status_checks list is empty. The ruleset read is successful; direct branch-protection endpoint access returned HTTP 403, so this finding is limited to the accessible repository ruleset and does not claim that no other administrative settings exist.

Therefore the repository does have an active ruleset, but the reviewed ruleset alone does not enforce an approval gate or any required status-check gate. PR #35 MUST REMAIN DRAFT until the governance control plane and deliberately selected target-branch controls are reviewed and configured. This audit does not change those repository settings.

#### Final scope / decision

- Current documentation checkpoint HEAD and its five generic runs: verified.
- Global SHA ledger and recursive branch-tree census: previously completed for the pinned snapshot; no recensus performed.
- PR #19: HOLD, open/non-mergeable, large aggregate diff; exact conflict files not identified.
- PR #35: KEEP DRAFT, active main ruleset observed but approval/status-check requirements are currently zero in that ruleset.
- Specialist gates: Pyth→MintPolicy BLOCKER CONFIRMED; EEV qualification/approval historical candidate only and Issue not established; Reveal/P2.8 INTEGRATION_BLOCKED; Materios B3-A/B/C BLOCKED.
- Overall audit: PARTIAL / OPEN.

Only the checkpoint document was changed by this update. No code, test or workflow was altered; no PR setting, branch, merge, rebase, deployment, mint or on-chain transaction was changed.


### 10.38 USDM unit semantics and external feed/issuer identity — 2026-10-22

Decision record: [PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md](../../audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md), amended in documentation-only commit [dc08a4d290a47d3dce3a8bea87d1dfc7192db641](https://github.com/LiberoNuvola/Immortal-Protocol/commit/dc08a4d290a47d3dce3a8bea87d1dfc7192db641). The amendment adds an external-source and asset-identity cross-check; it does **not** approve a unit conversion or authorize production implementation.

#### Reconciled facts

- The archived Constitution defines USDM as PRE-RICH's canonical economic unit and says that non-USDM payment assets require verified conversion (Articles 5 and 16). The PRE-RICH system spec fixes 100 sub-units per unit and requires exact asset identity, valid/fresh price data, decimal handling, deterministic rounding, minimum-UTxO treatment and fail-closed rejection. These sources do not explicitly say that one accounting USDM is exactly one USD.
- EEV Valuation Contract R9 states that universal safety theorems are relative to the adapter-supplied valuation. The adapter must authenticate its source and derivation; R9 does not prove market-price truth for an arbitrary oracle datum.
- Current public issuer documentation is not a substitute for on-chain asset identity: [Cardano's USDM overview](https://cardano.org/stablecoins/) describes 1:1 USD backing, while [NBX's issuer terms updated 17 July 2026](https://nbx.com/en/usdm-terms) explicitly distinguish EEA NBX-issued USDM from Moneta-issued USDM, with separate reserves and no cross-liability. This does not establish that all tokens called USDM are interchangeable or trade at exactly par at all times.
- [Pyth Pro's feed catalogue](https://docs.pyth.network/price-feeds/pro/price-feed-ids) distinguishes Pro/Lazer IDs from Pyth Core IDs. This review has not established a Pyth Pro quote whose source definition is bound to the exact Cardano USDM policy ID intended for this application. A ticker or generic symbol is insufficient evidence of that mapping.
- No live or authorized direct ADA/USDM quote was qualified by this review. Historical or DEX-derived feed listings do not establish a current, trusted production valuation path.

#### Recommended normative disposition — proposal only

Separate **the protocol's USDM accounting unit** from **any Cardano-native token whose ticker is USDM**. The normative owner must explicitly decide whether the accounting unit is USD-denominated; the decision cannot be inferred from the ticker, a reserve statement, or a stablecoin issuer's redemption terms.

- If the intended meaning is one USD-denominated accounting unit, specify that relationship in the normative source-of-truth hierarchy. Then preserve raw Pyth ADA/USD price/exponent and implement exact rational conversion with the approved rounding contract. This still does not automatically value a physical USDM token at par: its exact policy ID/name and valuation rule remain required.
- If USDM means a token-relative unit, require a source-qualified, fresh USD/USDM ratio or an exact asset/USDM feed bound to the relevant Cardano asset identity.
- Under either route, only the exact quote authenticated by the Pyth/quote-carrier validator may be consumed by the production Treasury equality predicate; the legacy Oracle State price must not be an unbound fallback in a Pyth-authoritative path.

This is a recommendation awaiting normative approval, not a selected protocol rule.

#### Gate state and next dependency

- Pyth quote → production MintPolicy: **BLOCKER CONFIRMED**.
- USD/USDM denomination and conversion: **NORMATIVE DECISION OPEN**.
- Native signed Pyth update + source-to-economics binding: **NOT ESTABLISHED**.
- No protocol implementation, unit constant, asset mapping, workflow, branch topology, V3/Reveal semantics or on-chain state changed in this pass.

Next decision dependency: approve the meaning of the USDM accounting unit under the existing source-of-truth hierarchy. Until then, changing MintPolicy to consume the Pyth candidate would embed an unapproved economic rule and remains prohibited.


### 10.39 Decision-register crosswalk — USDM denomination is not implied by DEC-3 — 2026-10-22

This section reconciles the new Pyth unit-conversion memo with the existing Notion source-of-truth records. It does not create or approve a new normative rule.

#### Existing decisions and their actual scope

| Canonical record | Existing status | What it establishes | What it does NOT establish |
|---|---|---|---|
| Notion `02 — Decision Log`, DEC-3 | `CLOSED` | USDM is the economic/reference unit; settlement in another supported asset must equal the required USDM-equivalent amount under a verified valuation contract; under/overpayment is invalid. | It does not state that one accounting USDM equals exactly one USD, nor does it select an ADA/USD → USDM conversion formula. |
| Notion `09 — Definitive Decision Register`, D-10 | `OPEN` | Multi-asset valuation/settlement remains an unresolved decision area. | It does not itself choose the eligible asset set or source/feed mapping. |
| Notion `09 — Definitive Decision Register`, D-11 | `OPEN` | Oracle authorization, freshness and latency remain unresolved. | It does not qualify a specific Pyth feed, issuer, policy ID, asset mapping or production quote path. |
| Notion `09 — Definitive Decision Register`, D-13 | `OPEN` | Governance authorization remains an unresolved decision area. | It does not allow an implementation or adapter to silently choose economic truth. |
| Notion `GOV-02 — Authority / Permission Matrix v0.1` | Boundary specification | PRE-RICH application policy is owned at the application layer; adapters implement chain-specific policy/realization and verify external evidence assumptions; normative changes require the designated governance process. | It does not authorize a maintainer to settle a missing denomination rule by code. |
| `PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md` | `RESEARCHED / NORMATIVE DECISION OPEN / NO IMPLEMENTATION AUTHORIZED` | Records options A/B/C, exact-rational candidate math and the missing feed/asset identity evidence. | It is not an adopted decision and does not select A, B or C. |

#### Work routing — no duplicate decision ID

Treat the unresolved question as a **decision residue within existing D-10/D-11**, with governance authority checked against D-13/GOV-02. Do not invent a new D-number, assume DEC-3 means USD parity, or reopen DEC-3's exact-equivalence rule. The specific choice to be governed is:

> What source-qualified relationship, if any, maps the PRE-RICH accounting unit “USDM” to USD for valuation of non-USDM assets, and what exact Cardano asset identity/quote must be accepted as physical settlement in canonical USDM?

The decision record must explicitly choose and justify one of the already documented alternatives:
- **A — USD-denominated accounting unit/parity:** only if the normative owner explicitly defines the relationship; the physical Cardano USDM asset still requires exact policy ID/name and its own treatment.
- **B — independent USD/USDM ratio:** requires a second authenticated, fresh source/ratio and defined failure behavior.
- **C — source quote already denominated in USDM:** requires exact asset/feed identity and source authorization; a ticker is insufficient.

The decision must identify the normative owner/approval path, canonical source file and version, effective scope (PRE-RICH only vs IMMORTAL-wide), and conformance fixtures. Until that is adopted, do not change `OracleQuote`, `Economic.totalUsdmValue`, MintPolicy or any unit constant.

#### Dependency and parallelism

1. **Normative decision:** resolve the existing D-10/D-11 residue under D-13/GOV-02. This is the blocker for choosing a production conversion formula, not a blocker for unrelated B3/Materios evidence acquisition.
2. **Feed/asset qualification:** in parallel, gather source metadata only—exact Pyth feed identifier/type, signed-update format, target asset policy ID/name, token decimals and freshness model. Evidence collection may not presume that the feed is economically admissible.
3. **Versioned conversion contract:** after the normative choice, freeze exact rational fields, exponent/resource bounds, rounding, overflow and fail-closed rules.
4. **Production binding:** only then bind the authenticated quote to the exact MintPolicy treasury-equality predicate and run cross-script/native-ledger negative cases.
5. **Separate first-Issue gate:** EEV direct-USDM revalidation and authoritative Issue admission remain independent blockers; no conversion decision alone authorizes Issue.

**Classification:** source-of-truth crosswalk reviewed; normative choice **OPEN**; implementation **NOT AUTHORIZED**; global semantic audit **PARTIAL / OPEN**. No issue, branch, protocol code, workflow, deployment or ledger state was changed.



### 10.40 Feed and settlement-asset metadata inventory — 2026-10-22

Read-only source inventory; this is not a quote qualification or economic decision.

- `src/config.ts` blob `37c75e237e4c47ab2ea3f04f43f76ad57bf71636`: defines PRE identity, Oracle State and ticket/control IDs, but no canonical USDM settlement policy ID/name or Pyth feed ID.
- `.env.example` blob `e0d934726a30e787ff74469ba8cb79ab0a026424`: `DIRECT_USDM_UNIT` is commented, not an approved identity.
- `PREPROD-PRE-MATERIALIZATION-GATE-v0.1.md` blob `ceae73da4511e33184b4a4f3ffc370942645946d`: the explicit policy/name is for PRE, not USDM.
- `PYTH-MINTPOLICY-PRICE-BINDING-DESIGN-20261021.md` blob `0db67eceec333ec4ba4339d8b927eb5d7bc4dc69`: feed ID 16 is ADA/USD; the memo keeps USD/USDM denomination open.
- `PythQuoteCarrierBinding.hs` blob `669b99a0e4564504012bda8402b706d0ae7a9a9b`: raw quote binding candidate; not used by deployed MintPolicy.
- `PythAdaUsdConversion.hs` blob `43dbe58ab19c3e748bf34af2c77ff97cdd42253c`: rational candidate needs an explicit USD-per-USDM ratio and exponent bound; not wired into production.
- `preprod-real-reveal.mjs` blob `996e8615af2902f2d254fb99a7b4a620b6e74fd4`: uses hardcoded fixture values and a zero-filled oracle-policy placeholder; diagnostic harness only.

**Dispatch:** obtain the exact USDM policy ID/name from an authenticated target-network observation; confirm token units; identify the exact Pyth feed type/ID and signed-update verification path; record freshness and failure rules. Do not infer asset identity from ticker or from PRE's policy. Do not treat ADA/USD as ADA/USDM. No conversion option is selected, and no production implementation is authorized. B3/Materios remains an independent active lane. Audit remains **PARTIAL / OPEN**.


### 10.41 Live PR refresh — 2026-10-22

The branch-name query returned 25 names; the continuation query at cursor `MjU` returned zero more and `cursor=null`. This closes name pagination only, not current-tree or semantic review.

- **PR #19:** OPEN, non-draft, non-mergeable; head `d7c115e93cf570d26ec7cd5d77524e866e7ddf08`, base `8c6873e1d50115659727c82c294426b9a946f1fa`, 413 files (+117,644/−2,204). HOLD; do not promote as a whole.
- **PR #23:** OPEN/DRAFT, mergeable; head `9ba77f967fa8f40395bef8c6cee77bf449d94dad`, base `8c6873e...`, 27 files. Keep draft; UI diff has provider/runtime/V3-adjacent scope.
- **PR #28:** OPEN, mergeable; head `b8530c26ab40531f7f8b7965dc6f74bd05ec7850`, base `aafad1d24ff678253a045e27114c7e544b2060c3`, 3 files. Hold for exact security-sensitive diff review.
- **PR #35:** OPEN/DRAFT, mergeable; head `7bca8d91b65d7af1261d8b7cc4f28f496a73fcba`, base `97b09a38742098f17a61eb07734c401aeedccc06`, 14 files. Keep draft pending governance-control and V3 boundary review.

Live compare says current `main` is `97b09a38742098f17a61eb07734c401aeedccc06`; PR #19/#23 bases are 9 commits behind, PR #28 base is 5 behind, and PR #35 base matches. Current green is 32 commits ahead / 0 behind protocol-source anchor `3373b3044b9c251da1ec217d128f5dcb3c87c894`; the compare response lists only 10 coordination/evidence paths. Keep that protocol-source anchor for existing evidence.

No PR or branch state changed. Audit remains **PARTIAL / OPEN**.

### 10.42 USDM/Pyth execution dispatch — 2026-10-22

Operational allocation only. This section does not amend DEC-3, select a denomination model, qualify a feed, authorize a conversion, or authorize protocol implementation.

#### A. Normative lane — W1-A

**Target:** existing decision records in the Notion Control Center; canonical synthesis/checkpoint on `work/immortal-green-closure`.

- Keep DEC-3 **CLOSED**: USDM is the reference/accounting unit and other supported settlement assets must satisfy exact equivalence under a verified valuation contract. Do not derive (1\ USDM = 1\ USD) from DEC-3.
- Route the unresolved denomination/source question into existing **D-10** (multi-asset valuation/settlement) and **D-11** (oracle authorization/freshness/latency), under the approval boundary of **D-13/GOV-02**. Do not create a duplicate D-number or silently close a decision in implementation.
- The authorized decision record must name the normative owner/approval path, canonical source and version, scope (PRE-RICH-only or IMMORTAL-wide), the selected existing option (A/B/C), failure behavior, and conformance fixtures. Until approved: no conversion formula, unit constant, `OracleQuote`, `Economic.totalUsdmValue`, or MintPolicy semantics may change.

#### B. Parallel evidence lane — W1-B

**Target:** existing source inventory/evidence records; no new branch.

Collect evidence without asserting economic admissibility:

1. **Settlement asset:** exact target network; authenticated observation/transaction reference; qualified UTxO tx hash/output index; USDM policy ID and asset-name bytes/hex; token decimals/unit; observed quantity; evidence timestamp/slot. Do not use ticker text as identity.
2. **Pyth candidate:** exact product/type and feed ID; pair and quote denomination; publisher/source metadata; price and exponent representation; signed-update format and verification path; update timestamp/slot and the provider's validity/freshness metadata. Record which values are source facts and which still need normative authorization.
3. **Traceability:** source URL or API reference, captured response/artifact digest, retrieval time, network and implementation/version identifiers. A listing or unsigned/static fixture is discovery material, not production qualification.

Existing source facts at this checkpoint: `src/config.ts` blob `37c75e237e4c47ab2ea3f04f43f76ad57bf71636` does not define canonical USDM policy/name or Pyth feed ID; `.env.example` blob `e0d934726a30e787ff74469ba8cb79ab0a026424` leaves `DIRECT_USDM_UNIT` commented; the inspected Pyth feed ID 16 is ADA/USD, not ADA/USDM. These facts do not identify the intended USDM token or qualify a feed.

#### C. Conditional engineering lanes

- **W1-C conversion contract:** blocked on normative approval. After approval, define exact integer/rational arithmetic, exponent bounds, rounding, overflow, freshness validation and fail-closed behavior strictly from the approved rule; add positive and adversarial conformance vectors.
- **W1-D production quote binding:** blocked on W1-A, W1-B and W1-C. Demonstrate that the authenticated quote consumed by the production MintPolicy is the same quote/asset/denomination accepted by the approved contract. Test wrong-feed, wrong-asset, stale update, malformed signature/update, incorrect exponent and payment under/over the exact amount. Require native-ledger evidence on an exact source SHA; evaluator-only tests are insufficient.
- **W2 B1 first Issue:** remains an independent gate. Requalify direct-USDM EEV from the exact qualified PrizePool UTxO and prove authoritative admission, candidate-transaction binding, wallet signature and ledger confirmation. No conversion decision by itself authorizes Issue.
- **W3 Reveal/P2.8:** continue only on the previously assigned branch/workflow from the dispatch board; isolate transaction size and reference-script witness evidence. Do not alter V3 or Reveal semantics.
- **W4 Materios/B3:** continue on `work/b3-materios-provenance-evidence` as an independent acquisition/verification lane. A change of acquisition source must carry a reproducible hypothesis and real witness evidence; do not repeat a failed GRANDPA witness attempt without one.
- **W0/W5 coordination:** record a status change only with the exact source/target SHA, relevant blob IDs, focused test command/run, evidence artifact and limitations. A passing generic CI run or a documentation-only commit does not close a specialist gate.

#### Closure predicates and current state

| Work item | Required closure evidence | State |
|---|---|---|
| W1-A denomination/source decision | Approved existing decision record, explicit scope and conformance fixtures | **OPEN — no option selected** |
| W1-B asset/feed inventory | Authenticated target-network asset identity plus source-qualified feed/update metadata and evidence digest | **IN PROGRESS — ticker/feed ID alone insufficient** |
| W1-C conversion contract | Versioned arithmetic and failure contract traced to the approved decision | **BLOCKED on W1-A** |
| W1-D MintPolicy binding | Exact quote-to-predicate binding plus adversarial native-ledger results | **BLOCKED on W1-A/B/C** |
| W2 first Issue | Live EEV direct-USDM, authoritative admission, transaction binding and confirmed ledger result | **BLOCKED independently** |
| W3 Reveal/P2.8 | Under-limit transaction and actual reference-script witness evidenced on target ledger | **OPEN / INTEGRATION-BLOCKED** |
| W4 Materios/B3 | Authentic witness captured and cryptographically verified at the required trust boundary | **OPEN / BLOCKED** |
| W5 semantic audit | SHA-pinned review record and evidence-based classification per critical blob | **PARTIAL / OPEN** |

**Boundary:** metadata acquisition may proceed immediately. No conversion option, price parity, token identity, oracle authorization, freshness threshold, or production binding is approved by this dispatch. No protocol source, workflow, branch topology, deployment, V3/Reveal semantics, or ledger state is changed by this record. Overall audit remains **PARTIAL / OPEN**.

### 10.43 EEV asset identity and Pyth source facts — 2026-10-22

This is a source-evidence correction to the interpretation of the historical EEV approval artifact. It does not change the artifact or revoke/alter on-chain state. It narrows what that artifact proves.

#### Exact asset in historical EEV artifact

GitHub Actions run [39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) emitted artifact `immortal-preprod-eev-approved`, artifact ID `12324421376`, SHA-256 `d219db29890d55e3a63dd9a7ff3b0f04ec53e710a7e77688c8a48610c06d094c`. The artifact's `preprod-direct-usdm-source-set.json` and deployment/qualification manifests state:

- Network: `cardano-preprod`.
- Candidate source UTxO: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`, at `addr_test1wrhru9jt8jm600y2mltw300c9tu7cj5tuyew7lz0ex2p75gja592e`.
- Asset unit in the file: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`.
- Decoded native asset identity: policy ID `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9`; asset-name hex `0014df10745553444d`; CIP-68 label 333 followed by `tUSDM`.
- Recorded physical quantity `1000000000` atomic units; the artifact assumes six ledger decimals and derives `100000` IMMORTAL USDM sub-units (1,000 accounting units at 100 sub-units per unit).
- Observation time `2026-10-21T05:57:26.613Z`, chain-tip slot `136879045`; the artifact's own freshness model is `LIVE_UTXO_REVALIDATION`.

The exact unit matches the preprod `tUSDM` identity published in the x402 Cardano scheme specification. That specification separately identifies mainnet USDM as policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`, asset name `0014df105553444d`, and explicitly states that both policy ID and asset name differ on Preprod; it names the Preprod suffix as `tUSDM` ([x402 Cardano scheme, lines 318–320](https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_cardano.md#L318-L320)). Cardano's CIP-68 description identifies label 333 as the user-facing fungible-token form, with label 100 used for its reference token ([Cardano CIP-68 glossary](https://cardano.org/glossary/cip-68/)).

**Classification:** the historical artifact identifies and quantifies the Preprod `tUSDM` test asset. It does **not**, by itself, establish that this test token is normatively admitted as the canonical settlement asset for the PRE-RICH accounting unit, nor does it prove equivalence to mainnet USDM. A network-specific Preprod test-asset mapping requires explicit source-of-truth approval. If the deployment is intended to prove use of issuer USDM rather than a test surrogate, this artifact is the wrong asset identity for that claim.

The source-set observation is from 21 October, not a current spend-status check. Its stated `LIVE_UTXO_REVALIDATION` rule still requires a fresh lookup of the exact out-reference immediately before Issue admission and transaction binding. Do not reuse its approval as current live-UTxO evidence.

#### Pyth feed identity and verification mechanics

Official Pyth/Cardano material identifies numeric feed ID `16` in the Pyth Pro/Lazer integration as `ADA/USD`, with USD quote and exponent `-8`; the Pyth Terminal catalog reports three minimum publishers and a `fixed_rate@200ms` minimum channel ([Pyth Terminal ADA/USD feed](https://app.pyth.com/explore/Crypto.ADA%2FUSD); [Cardano Developer Portal Pyth integration](https://developers.cardano.org/docs/build/integrate/oracles/pyth/)). Pyth Core and Pyth Pro feed-ID catalogues are distinct, so an ID must always be recorded together with its product/type and network.

The Cardano integration guide describes fetching a signed update off-chain and verifying it on-chain via the Pyth withdrawal-script path. It also warns that signature verification alone does not enforce freshness; the application/validator must check the update timestamp if a freshness window is required. This is technical behavior, not authorization of feed 16 for USDM valuation and not a governance-approved threshold.

The historical EEV artifact's separate legacy Oracle State record has empty `assetPolicyHex`/`assetNameHex` and null `timestampMs`, with `authorityKind=DEPLOYMENT_WALLET_SIGNED`; the deployment manifest labels it a compatibility oracle for the existing fixed Preprod ADA settlement path. It is not proof of a Pyth-signed ADA/USD or ADA/USDM quote and does not bind a quote to MintPolicy.

#### Corrected dispatch

1. **W1-B asset identity:** technical Preprod candidate is now identified as `tUSDM`; determine/approve whether this exact test asset is the canonical network-specific settlement unit for Preprod. Mainnet USDM remains a distinct asset identity.
2. **W1-B Pyth inventory:** feed 16 is established as ADA/USD under Pyth Pro/Lazer, not ADA/USDM. Continue gathering the deployed Pyth State identity, exact signed-update format/path and relevant transaction/evidence references; no quote is qualified by this catalog evidence.
3. **W1-A D-10/D-11/D-13:** the policy question is now concrete: whether and under what scope a Preprod `tUSDM` surrogate represents the protocol accounting unit, and what source-qualified relation admits non-USDM asset valuation. Decision authority must be explicit; DEC-3 remains CLOSED without implying USD parity.
4. **W1-C/W1-D:** remain blocked until the preceding normative and source-qualification gates close. Do not route feed 16 into MintPolicy as a shortcut.
5. **W2 first Issue:** keep blocked until the exact Pool UTxO is revalidated live, the accepted Preprod asset identity is approved, and the admission/transaction/ledger binding is demonstrated.

**Status correction:** historical EEV qualification/approval exists for its exact recorded candidate and evidence digest; current live revalidation is **NOT ESTABLISHED by that artifact alone**. Qualification of the test asset as the normative Preprod settlement unit is **OPEN**. Production Pyth→MintPolicy binding is **BLOCKED**. No code, workflow, branch topology, V3/Reveal semantics, deployment or ledger transaction was modified. Audit remains **PARTIAL / OPEN**.

### 10.44 Exact Pyth Pro Preprod identity and current probe boundary — 2026-10-22

Read-only source review of the exact current Green source blobs. This is not signed-update ledger acceptance and does not bind Pyth into production Issue settlement.

#### Pyth Pro deployment identity

The official Pyth Pro (Lazer) contract-address page lists Cardano Preprod as `c7d51d897fdfceb7682f4a1a9ef428a027ec0582cadee158429f7e45`; its linked explorer target is explicitly a Cardano minting-policy page: [Pyth Pro contract addresses](https://docs.pyth.network/price-feeds/pro/contract-addresses#cardano), [Preprod policy explorer](https://preprod.cexplorer.io/policy/c7d51d897fdfceb7682f4a1a9ef428a027ec0582cadee158429f7e45). This is the source-qualified Pyth Pro candidate policy ID for the Preprod probe, not proof that a transaction used it or that a live State UTxO was successfully resolved in this pass. Pyth Core is a separate product/deployment; do not substitute its policy.

#### Exact source review and bounded existing CI evidence

- `poc/aiken-pyth-ada-usd/lib/immortal/ada_usd_probe.ak`, blob `9f314ddcde19fb7a795dc282bb7a076791a685a9`: isolated consumer selects exactly one feed ID 16 (ADA/USD), checks positive price and both update/feed-update timestamps against the transaction validity upper bound using a one-hour constant, and preserves raw price/exponent. These are source checks and synthetic unit tests; the module is explicitly a probe, not the deployed quote carrier or production MintPolicy.
- `poc/aiken-pyth-ada-usd/validators/ada_usd_probe.ak`, blob `e2cd17e520917162e5540f3669c1ed4121f579a6`: isolated V3 consumer matches its datum to the tuple extracted from the signed update; no PRE-RICH issue path is called.
- `plutus/PythQuoteCarrierBinding.hs`, blob `669b99a0e4564504012bda8402b706d0ae7a9a9b`: candidate Haskell helper checks unique carrier input/output, singleton conservation, zero mint/burn, datum decodability, and address/Value continuity; it extracts the continuation tuple. The helper itself does **not** verify the Pyth signature or independently enforce the feed ID/freshness rule; it relies on the exact carrier validator also executing in the same transaction. It is not currently called by MintPolicy.
- `plutus/MintPolicy.hs`, blob `0d59fc05b4c11873984fffd10014bd46d8470509`, and `plutus/Economic.hs`, blob `e50366a65ce34e9433d5ff179dfc03a35a24c1a1`: scoped call-path review confirms `atomicTreasuryPaymentValid` still calls `Economic.totalUsdmValue`, whose `oraclePriceFor` uses legacy Oracle State reference inputs. There is no Pyth quote-carrier → production Treasury-equality binding.
- `.github/workflows/pyth-ada-usd-probe.yml`, blob `2d310e43052261436f9342ce46dc024e0696b0e3`, and run [#39659905806](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39659905806) at source SHA `2106daa5f4c93c20cbe2479ae9fa08db0d8f59f6`: both jobs succeeded for synthetic tests/build and type-checking the guarded runner. Artifact [#12374150310](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39659905806) contains source/compile evidence. This run did not execute `pyth-native-ledger-probe.yml`, did not fetch a genuine signed update, and did not submit a transaction.
- `.github/workflows/pyth-native-ledger-probe.yml`, blob `5c0a4264ab48878a54b21f18a1188e4126a3a37d`: explicit manual inputs are `pyth_policy_id` and `submit_preprod`; submission defaults to false. The runner `scripts/testPythSignedUpdatePreprod.mts`, blob `fdfb24b90bba739c17bb4afcd4c6f51c0cc7406a`, has a no-submit mode that resolves the configured Pyth State and fetches an authentic Lazer update, producing `PREPARED_NOT_SUBMITTED`. Setting submission true would use the dedicated test mnemonic, fund a probe output and submit test transactions; it is a distinct explicit action and remains unperformed.

#### Fresh UTxO check — limitation, not a pass

The historical EEV artifact remains dated 2026-10-21 and cannot prove current out-reference status. I attempted a current lookup of `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0` through the available explorer/API interfaces, but this session did not expose a successful live Koios `POST /address_info` or `POST /utxo_info` response; the container also has no direct network/DNS access. Therefore the current UTxO is **NOT VERIFIED** here. Do not mark the source spent or unspent by inference.

The existing source-set runner `audit/cardano-integration/preprod-direct-usdm-source-set.mjs`, blob `9cf28d31bf72e0aea6c077538e97e7399ed0d04b`, already performs the correct exact-ref check via Koios, checks the pool singleton and configured asset unit, captures a fresh tip/time and fail-closes unless the exact UTxO is the single live row. The existing EEV approval workflow `.github/workflows/pre-rich-b1-eev-approval.yml`, blob `a9d9efe08cf34ac5c67db29dc78088f60c44ebee`, runs observation, qualification and then creates a new `DEPLOYMENT_APPROVED` artifact under the `PREPROD-EEV-APPROVAL` environment. It is an approval workflow, not merely a read-only query; do not rerun it as a substitute for a separately scoped freshness observation or without the intended approval action.

#### Dispatch

1. Use `c7d51d897fdfceb7682f4a1a9ef428a027ec0582cadee158429f7e45` only as the documented Pyth Pro Preprod policy candidate for the isolated probe. First use manual native-ledger workflow with `submit_preprod=false` to obtain actual Pyth State resolution + genuine signed-update digest, not as a ledger proof.
2. If and when explicitly authorized, run the same isolated probe with `submit_preprod=true` and the dedicated test wallet to prove native-ledger signature acceptance and tampered-update rejection. This demonstrates only the Pyth probe, not PRE-RICH MintPolicy binding.
3. Independently obtain fresh EEV source observation using the exact qualified B1 Pool and deployment-approved `tUSDM` unit. Reconcile asset-policy approval before treating `tUSDM` as the accounting settlement unit. Do not reuse the prior snapshot.
4. After normative D-10/D-11 authorization, implement and test the exact carrier-to-MintPolicy equality binding. Until then, no production conversion or MintPolicy change is authorized.

**Status:** Pyth signed-update Preprod acceptance **NOT RUN / OPEN**; Haskell carrier → MintPolicy binding **NOT IMPLEMENTED**; current EEV UTxO liveness **NOT VERIFIED IN THIS PASS**; first Issue **BLOCKED**. No code, workflow, branch topology, wallet action, deployment, V3/Reveal semantics or ledger transaction was modified. Audit remains **PARTIAL / OPEN**.

### 10.45 Native-ledger probe acceptance scope and execution capability — 2026-10-22

Focused review of `scripts/testPythSignedUpdatePreprod.mts` blob `fdfb24b90bba739c17bb4afcd4c6f51c0cc7406a` and `.github/workflows/pyth-native-ledger-probe.yml` blob `5c0a4264ab48878a54b21f18a1188e4126a3a37d`. No workflow was dispatched in this pass; the connected GitHub actions available to this task expose read/inspection and rerun operations but no `workflow_dispatch` creation action. A manual workflow run must not be inferred from a successful source review.

#### Actual runner behavior

- With `submit_preprod=false` (workflow default), the runner resolves the configured Pyth State through the SDK/Koios, fetches a genuine Lazer signed update and writes `PREPARED_NOT_SUBMITTED` evidence including the policy ID, State NFT unit, withdrawal-script hash, signed-update length and digest. It does not load a wallet, build/sign a Cardano transaction or submit anything. This is the correct first live, read-only probe, conditional on the required Pyth Lazer secret and an explicit manual dispatch.
- With `submit_preprod=true`, the runner may first send a funding transaction to create a probe output if none is available, then submits exactly one positive Pyth-verification transaction and waits for confirmation. Thus "two transactions" means funding + positive verification when funding is needed; it does **not** mean positive + negative verification.
- The one-byte-mutated update is passed to `complete({ localUPLCEval: true })` and must fail before the positive transaction is submitted. This is a **local evaluator negative case**, not a transaction rejected by a remote/native Cardano ledger. The result JSON correctly records `nativeLedgerNegativeCase: NOT_RUN`.
- Consequently a confirmed positive probe demonstrates that the Pyth withdrawal verifier and isolated V3 consumer executed in the same confirmed transaction for that update. It does not yet demonstrate native-ledger rejection of a tampered update, feed liveness/truth, the normative USD/USDM relation, PRE-RICH Issue authorization, or the production MintPolicy binding.

#### Current operational limitation

- Workflow dispatch has **NOT BEEN RUN** in this session. The available GitHub tool surface does not expose workflow-dispatch; no substitute API write was attempted.
- A live EEV source revalidation also has **NOT BEEN RUN**; the historical out-reference remains unresolved here. The correct script exists, but it needs the real Preprod deployment manifest, target-approved `PREPROD_TUSDM_UNIT` and a live Koios response. Do not use the approval workflow as a read-only substitute, because it re-qualifies and materializes deployment approval.
- No test-wallet mnemonic, Pyth token, Blockfrost credential or approval secret was read, emitted or supplied by this pass.

#### Next execution path and honest closure states

1. Manually dispatch `Pyth Signed Update — Preprod Ledger Probe` from the exact intended Green SHA, policy input `c7d51d897fdfceb7682f4a1a9ef428a027ec0582cadee158429f7e45`, `submit_preprod=false). Inspect its artifact: require `PREPARED_NOT_SUBMITTED`, authenticated State UTxO reference, reference-script hash, signed-update digest and no transaction hashes.
2. Separately run a genuinely read-only exact B1 PrizePool out-reference check using the already present source-set script with the real deployment manifest and explicitly approved Preprod asset unit. Save tip/slot, query timestamp, exact txHash#index, physical asset quantity and digest; reject cached prior observations.
3. Only after that artifact is reviewed should the owner explicitly authorize the test-wallet submission mode. Its expected result is a positive native-ledger verification plus local tampered-payload rejection, not native negative rejection.
4. Treat native-ledger tampered-payload rejection as a distinct, still-missing test obligation. Do not call it complete based on the current runner output. Any new test shape must be reviewed for its resource consumption, fees and failed-transaction behavior before any further test-wallet submission.
5. Continue to block production quote-to-MintPolicy integration until W1-A (approved existing D-10/D-11 decision under D-13/GOV-02), source identity/quote qualification and exact on-chain binding are closed.

**State:** no-submit Pyth run **NOT DISPATCHED**; positive Pyth ledger probe **NOT RUN**; native-ledger negative **NOT RUN**; EEV live out-reference **NOT VERIFIED**; first Issue **BLOCKED**. No code, workflow, branch topology, wallet action, deployment, V3/Reveal semantics or ledger state was changed. Audit remains **PARTIAL / OPEN**.



### 10.46 Three-agent execution model — fronts, subfronts, branch ownership and checkpoint protocol — 2026-10-22

**Purpose and authority.** This section turns the existing U-*/P-* task IDs and §10.16 branch map into three accountable work fronts. It does not create a competing backlog, invent new task IDs, approve an open economic/governance decision, or authorize code promotion, deployment, wallet use or ledger submission. Existing IDs and source-of-truth hierarchy remain canonical. The three agents are work owners, not protocol authorities: unresolved normative choices must stay OPEN until the already-designated governance path resolves them.

#### Agent A — Economic truth, USDM/Pyth, EEV and the first Issue

**Primary branch:** `work/immortal-green-closure`  
**Accountable lane:** P-01 / P-02 / P-05 / P-06 / P-15 / P-16 and the related U-/decision crosswalks already named in §10.16.  
**Mission:** establish the authenticated economic inputs and their exact binding to Issue admission; do not declare the first real Issue ready until all dependencies and ledger evidence agree.

| Subfront | Required work | Acceptance / stop condition |
|---|---|---|
| A1 — Unit and governance truth | Reconcile DEC-3, D-10, D-11, D-13/GOV-02 and the canonical specs. Keep the accounting unit USDM distinct from the physical settlement token. Explicitly record that neither DEC-3 nor the Pyth ADA/USD feed implies 1 USDM = 1 USD. | Named decision and evidence source are explicit. No duplicate decision ID and no inferred peg, haircut, rate, rounding rule or freshness threshold. |
| A2 — Direct-USDM EEV | Revalidate the exact candidate B1 PrizePool out-reference live; verify network, policy ID, asset-name bytes, quantity, contract/derivation versions and source slot/time. Produce/reconcile EV1–EV7, evidence digest and deployment approval only under the approved profile. | Fresh authenticated observation and reproducible evidence packet. A historical artifact or old UTxO observation is not liveness. Do not invoke a workflow that materializes approval as if it were read-only. |
| A3 — Pyth source and native-ledger evidence | Use the existing signed-update probe first in preparation-only mode (`submit_preprod=false`). Capture exact policy/State identity, feed identity, signed payload digest and runner output. Separate native-ledger positive acceptance from the still-missing native-ledger negative case. | Prepared artifact is labelled `PREPARED_NOT_SUBMITTED`; only report on-chain acceptance if a confirmed ledger transaction and exact transaction evidence exist. The isolated feed ID 16 is ADA/USD, not ADA/USDM. |
| A4 — Quote-to-MintPolicy binding | After the governed unit/source decision, trace the exact authenticated quote through its consumer to the Treasury payment equality check. Review negative source-substitution cases and current-head integration. Do not accept a carrier helper or a parallel legacy oracle value as a binding. | The quote verified on-chain is the quote actually used by MintPolicy, under an approved currency-unit contract. Until proven, production binding remains OPEN/BLOCKED. |
| A5 — B2 Issue Admission and expiry | Verify authoritative live observation/provider wiring, control singleton, qualified liquidity and every final transaction input/output after builder completion. Keep the policy-derived `issuedAt`/`expiresAt` binding work for Issue #20 in scope, without altering V3/Reveal. | Exact final body, wallet signature, confirmed ledger inclusion, NFT and independent post-state reconciliation. Until all are present, first Issue = BLOCKED / NOT ISSUED. |

**A's boundaries:** no unapproved Preprod transaction; no invented USDM/USD conversion; no redesign of the economic algorithm; no V3/Reveal changes; no dependency on B3 being complete. A reports exact source/target blobs, live observation slot/time, run IDs, transaction IDs and evidence digests—not just conclusions.

#### Agent B — Cardano execution evidence, P2.8 / Reveal / Claim and isolated UI

**Primary implementation branch:** `work/immortal-green-closure` for Cardano runner/builder/integration-test work.  
**Separate product branch:** `feat/pre-rich-game-ui` for UI-only work, kept isolated from protocol/provider diffs.  
**Accountable lane:** P-03 / P-04 / P-08 and the related Cardano native-ledger, reference-script and adapter-boundary work already identified in §10.16.

| Subfront | Required work | Acceptance / stop condition |
|---|---|---|
| B1 — Reveal transaction size and reference-witness diagnosis | Reproduce the current builder output from an exact source SHA; report the serialized transaction byte count, the 16,384-byte ledger limit, script/reference witness placement and each byte-saving delta. Inspect whether the intended reference-script conversion actually survives through the final completed transaction. | A concrete, reproducible builder-level fix plus exact-size assertion and focused regression test. Do not raise the ledger limit, infer a fix from missing diagnostic markers, or change Reveal/V3 semantics. |
| B2 — P2.8 native execution | Make the real economic Reveal/Claim, typed context decoding and P2.8 materialization stages execute in order. Classify each result as synthetic fixture, local Yaci, Preprod or mainnet. Preserve SAFE_STALL when the required real packet is absent. | Completed current-head run with same-SHA raw context, typed decode, native economic trace and evidence packet. A cancelled lab, candidate build or fixture twins do not close P2.8. |
| B3 — Cardano integration and adapter conformance | Repair harness/lifecycle/observation issues only when a fresh failing step and falsifiable hypothesis identify them. Keep wallet-prefunding, provider readiness and minimum-UTxO constraints explicit. Use historical `audit/*`, `ops/*` and `fix/cardano-lab-yaci-info` refs only as read-only evidence unless a narrowly scoped change is reviewed. | Same-head focused test/run and evidence at the level claimed. No cross-branch bulk import; no changes to economic authorization semantics. |
| B4 — PRE-RICH UI | On `feat/pre-rich-game-ui`, work only on layout, artwork/assets, accessibility, responsive behavior, copy and interaction tests. Keep provider/admission/runtime/V3-adjacent changes separate for independent review. | UI acceptance and fail-closed behavior preserved; visual/UI PASS is not Issue or protocol PASS. |

**B's boundaries:** do not edit `plutus/MintPolicy.hs`, economic formulas, Pyth valuation policy or authoritative Issue semantics without an explicit hand-off from A and the required normative decision. Never modify the V3 carrier or Reveal validator semantics to make tests pass. B3/Materios is not a prerequisite for P2.8, and P2.8 is not evidence for B3.

#### Agent C — Materios B3 proofs, Workflow B, autonomy and universal claims

**Primary external-proof branch:** `work/b3-materios-provenance-evidence`.  
**Coordination/universal research branch:** `work/immortal-green-closure`, only in non-overlapping files and after checking the current HEAD.  
**Governance sandbox:** `merge/workflow-b-closed-main` is review-only for existing PR #35; keep it draft.  
**Accountable lane:** P-09 / P-10 / P-11 / P-12; U-01..U-05, U-08, U-09/U-10, U-12/U-13/U-14, U-15..U-17 and the Workflow C / paper / portability items already listed in §10.16. These remain separate subfronts, not a new combined gate.

| Subfront | Required work | Acceptance / stop condition |
|---|---|---|
| C1 — B3-A finality / authority provenance | Acquire a raw GRANDPA/FRNK justification through a materially different, identified proof-retaining source. Bind it to the exact target header and validate the ordered, genesis-rooted authority transitions using the existing verifier. | Raw justification acquired and independently verifies for the claimed block. Do not repeat the same zero-witness probe without changed source/input. Do not weaken the verifier or Materios authority-selector semantics. |
| C2 — B3-B historical storage proof | Obtain the exact historical header StateRoot and the proof for the existing `Anchors[anchor_id]` key/value at the target block; validate offline with the pinned Rust verifier. | Root, exact key/value and proof all match. Receipt/anchor identity does not prove finality; B3-B remains separate from B3-A. |
| C3 — B3-C execution / upstream dependency | Verify execution provenance and investigate upstream issue #50 only against new commits, witnesses or a confirmed upstream method. | Independent reproducible execution evidence. Do not infer a deployed or registered method from a similarly named source function. |
| C4 — Workflow B / contribution gate | Keep P-12 workflow evidence on B3 and review the existing PR #35's exact 14-path diff, trusted-base preflight and governance preconditions. | Workflow harness success is scoped to its harnesses only. PR #35 remains DRAFT until governance and exact-head acceptance are separately proven; no merge from this work. |
| C5 — JEV / Workflow C autonomy | Validate prompt provenance, bounded execution/safe decline, exact run/commit registration and then a subsequent scheduled cycle that consumes the latest result without a user message. | Two linked cycles are observed. A manually triggered run, a successful prompt generator or one completed partial lab remains INCONCLUSIVE. |
| C6 — Universal Kc/Ω, portability, papers and declarations | Reconcile normative definitions against projection/consumer code, freeze references/vectors only through the designated authority, verify second-adapter vectors and bind every paper claim to exact evidence. Keep Gate 41, declarations and Beacon 4 as their existing subfronts; Beacon deployment stays out of scope while quorum/attestation format is unfrozen. | Claim-to-evidence map and exact release snapshot are reproducible. Finite tests, documentation or research prototypes do not prove universal viability, portability, autonomy or production readiness. |
| C7 — Aegis / hardening research | Use `b1-hardening` only for labelled research and hypothesis tests. | No prototype cap/range becomes normative and no Aegis parameters are imported into the economic kernel without an approved decision and conformance evidence. |

**C's boundaries:** do not duplicate B3 implementations on green or first-Issue work on B3. Keep finality, historical storage validity, execution provenance and contribution governance as distinct claims. Do not deploy Beacon 4 or change B3 selector semantics during the coordination split.

#### Shared hand-off rules — mandatory for all three agents

1. **Read before acting:** current checkpoint §§0–3, §10.16, this §10.46 and the latest section for the assigned front; then refresh the actual branch HEAD, relevant file blobs, latest workflow runs and PR base/head. Snapshot SHAs in the earlier census are not current HEADs.
2. **One owner per code surface:** the agent named above owns its subfront's code/test surface. Before touching a shared or cross-lane file, record the dependency in the checkpoint and coordinate an explicit hand-off. If the work crosses ownership, first deliver a minimal evidence-backed diagnosis; do not silently take over another front.
3. **Existing branches only:** no new branch, no branch deletion, no force push/rebase, no merge, no wholesale cherry-pick, and no direct implementation on `main`. Historical `audit/*`, `ops/*`, backup/release and redundant `copilot/*` refs are read-only evidence until a narrowly scoped exception is reviewed. PR #19 remains HOLD; PR #35 remains DRAFT.
4. **Checkpoint update is part of every work item:** after each meaningful status change (source change, test/run result, new blocker, approved decision, acquired proof or failed acquisition), the owner must update the canonical checkpoint on `work/immortal-green-closure`. Append a dated subsection or make the smallest targeted change to the owning front; record task IDs, owner, source branch + exact SHA/blob, action/run ID, artifact digest/transaction ID where applicable, result, limits/non-claims, dependency and next action. Do not update status merely because files exist.
5. **Single-writer protocol for the checkpoint:** fetch the latest checkpoint blob immediately before editing; use its current blob SHA for the GitHub contents update. If another agent has advanced the checkpoint, refetch and reapply the small append—never overwrite a newer update with a stale copy. Use append-only additions for new evidence; retain earlier entries as history.
6. **Status vocabulary:** `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `TESTED_BOUNDED`, `VERIFIED`, `CLOSED`. `TESTED_BOUNDED` means only the named scope passed. `VERIFIED` requires the explicit acceptance evidence for that subfront. `CLOSED` requires all exit predicates and dependencies satisfied. Failure to acquire evidence is recorded as a precise blocker, not as proof that no source can ever provide it.
7. **Notion synchronization:** after the canonical checkpoint commit, append a short index/status note to the existing Notion Control Center, with section number and link to the exact GitHub commit. Notion remains an index/history and must not become a second implementation plan.
8. **Definition of done for an agent iteration:** updated source or a falsifiable no-code diagnosis; focused validation on exact SHA; evidence/artifact refs; explicit what the result does and does not prove; checkpoint updated and then re-fetched to verify; relevant Notion pointer updated. If the iteration is blocked, the same reporting is required, with the missing capability/source and a non-duplicative next step.
9. **Independent progress:** A's first-Issue gate, B's Cardano P2.8 gate and C's B3 proof gate can advance in parallel. No agent may make its status depend on another lane unless §10.16 or a governed decision explicitly states that dependency.
10. **Safety and honest execution:** do not claim a workflow dispatch, wallet signature, deployment or ledger transaction unless its returned result and exact evidence exist. Preparation-only probes stay labelled as preparation; read-only observation must be distinguished from workflows that submit or materialize approvals.

#### First execution sequence

- **A — first:** close the identity/governance questions that can be resolved from existing authoritative sources; separately attempt the read-only current EEV out-reference observation using the existing approved source contract. Do not submit the Pyth or Issue transaction.
- **B — first:** reproduce the current Reveal builder transaction from exact current HEAD and establish where the byte budget/witness conversion fails; only then make a narrow builder-level correction and run focused tests.
- **C — first:** select a materially different, identified Materios proof source before any repeated probe; document preflight evidence for B3-A and B3-B separately. In parallel, audit JEV status without claiming unattended autonomy until the subsequent scheduled cycle completes.

**Baseline at dispatch time:** checkpoint source blob before this addition = `6042a41a4bc203caa0a14b35bae6b738676bf364`. Current high-level states remain as previously recorded: first Issue BLOCKED; Pyth native-ledger positive and negative NOT RUN; MintPolicy binding NOT IMPLEMENTED; Reveal/P2.8 INTEGRATION-BLOCKED; Materios B3 OPEN/BLOCKED; JEV autonomy INCONCLUSIVE; universal/paper claims OPEN. This section assigns ownership and reporting, not completion. Overall audit remains **PARTIAL / OPEN**.


### 10.47 Agent B — diagnostic-only CBOR capture for Reveal size probe — 2026-10-22

**Owner:** Agent B (P-03 / P-04).  
**Status:** IN_PROGRESS; source change committed, exact-head Actions still running when this note was written.

#### Baseline evidence and diagnosis

- PRE-RICH Emulator Reveal Conformance run [#39646783971](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783971), source SHA 1300b79d7460f2abcd79767d5d16dd2564aad064, failed at the PrizeValidator reference-script publication step: publication transaction size 16,782 > 16,384 by 398 bytes. The final Reveal spending transaction was not yet built on the canonical path.
- The same run's diagnostic size probe enlarged its local maxTxSize to 100,000, then failed in local script evaluation before CBOR measurement: “Spend[0] attempted to instantiate a non-polymorphic term”. This evaluator/CEK error is separate from size acceptance and gave no final serialized witness census.
- Static source review showed audit/cardano-integration/reveal-ledger-trace.ts already emits final-CBOR reference-input and Plutus-witness counts through revealDiag, but the latest Integration Lab [#39646784077](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077) was cancelled before the real economic Reveal/P2.8 steps. The app/Preprod runner still lacks the same final-CBOR assertion; do not infer reference-witness conversion from readFrom(...) source syntax alone.
- Acceptance contract remains [P2.8 Reveal remediation v0.1](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/audits/P2.8-REVEAL-REFERENCE-SCRIPT-REMEDIATION-v0.1.md): actual transaction <= 16,384 bytes; no inline fallback; exact context must subsequently enter native Cardano-ledger evaluation.

#### Narrow diagnostic change

Commit [2bc9ac350f36f9e721d43b772231966d4ab4a8a6](https://github.com/LiberoNuvola/Immortal-Protocol/commit/2bc9ac350f36f9e721d43b772231966d4ab4a8a6) changes only src/__tests__/immortal-cardano-reveal-emulator-b1.mjs (new blob 73de3bbe06cea49fa69875b8502c935915c89966, previous blob d9112597f1c0d534604df238738e043522cc0670):

1. When and only when P2_8_B1_SIZE_PROBE=1, the legacy Lucid builder uses complete({ nativeUplc: false }) to avoid the known native evaluator path during the diagnostic attempt. It exits after logging and before signing/submission; this is not acceptance or ledger evidence. Whether this produces CBOR is being checked by the exact-head run.
2. The size probe now reports serialized byte count, body/witness-set sizes, spending inputs, reference-input outrefs, counts and CBOR byte sizes for embedded Plutus V1/V2/V3 witnesses, and the script/datum/redeemer component diagnostics. It no longer asserts without inspection that reference scripts are absent from the witness set.

No validator, V3 carrier, protocol parameter, economic rule, production transaction builder, workflow definition or ledger state was changed. The patch is a measurement aid, not the fix for the 398-byte overrun.

#### Exact-head validation in progress

- [PRE-RICH Emulator Reveal Conformance #960 / run 39722987266](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39722987266), source SHA 2bc9ac350f36f9e721d43b772231966d4ab4a8a6; at update time the job was still in progress before the fresh Plutus build and Reveal steps.
- [IMMORTAL Cardano Integration Lab #2033 / run 39722987352](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39722987352), same source SHA; at update time dependency installation was still in progress. Its later stages must still be classified individually; they are not implied to pass by workflow startup.

**Next action:** inspect the exact-head emulator result for the reference-script publication step first. The 16,782-byte result belongs to that publication transaction, not to final Reveal. Separately inspect whether the diagnostic attempt logs final Reveal CBOR, the actual two reference inputs and embedded Plutus script counts. If it still cannot emit CBOR, record that distinct failure and do not dispatch an identical rerun.

**Current status:** P-03 INTEGRATION_BLOCKED; P-04 INTEGRATION_BLOCKED; no transaction submitted by this Agent B step. The result expected from this change is improved diagnosis only, not closure.


Checkpoint maintenance note (2026-10-22): Documentation Link Check run [39722987246](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39722987246) identified the stale relative path above. It was corrected from `../audit/...` (which resolved under `docs/`) to `../../audit/...` (repository-root `audit/`). This is a documentation-link correction only; it does not alter P-03/P-04 status or protocol source.


### 10.48 Agent A intake triangulation — 2026-10-22

This section records the required read-only hand-off verification before the next Agent A economic/Issue action. It consolidates already-existing evidence only; it does not qualify a new asset/feed, approve a conversion, perform a successful live UTxO revalidation, or authorize an Issue.

#### Checkpoint and Notion alignment

- GitHub checkpoint source was fetched from `work/immortal-green-closure`; source HEAD immediately before this append was `59727bacd13464c05cd601d5e2c8dec98ed271bd`. The previous checkpoint entry §10.47 belongs to Agent B and is preserved unchanged.
- Notion [PRE-RICH — Control Center](https://app.notion.com/p/3d9c4454-d6d5-81e6-80d5-e5d3f3a9df79) was fetched at 2026-10-22 04:28:02 UTC. It indexed §10.46 / commit `485e7843392448ecac8e243223aaec3f5d79f98b`; it was therefore behind Agent B's later §10.47 source update. After this canonical checkpoint commit, append a short pointer to the exact latest GitHub commit in the existing Control Center. Notion remains an index, not a competing work plan.
- Notion [02 — Decision Log](https://app.notion.com/p/3d9c4454-d6d5-81f6-b1df-f9bd9fa360fb) marks DEC-3 CLOSED for the USDM reference/accounting unit and exact value-equivalence contract. It does not define 1 USDM = 1 USD. The unresolved denomination/source choice remains with existing D-10/D-11 under D-13/GOV-02; no new decision ID or implementation permission is inferred.

#### Source triangulation — Agent A fronts

| Front | Evidence from current repository plus decision records | Classification |
|---|---|---|
| P-01 — first Issue / direct-USDM EEV | Historical approval run [39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) generated EV1–EV7 and `DEPLOYMENT_APPROVED` for `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0` at 2026-10-21 05:57:26 UTC, slot 136879045. That snapshot does not prove the exact out-reference remains live/unspent, and an EEV approval does not authorize Issue. | **BLOCKED — live source and end-to-end Issue not established** |
| P-02 — Pyth quote → MintPolicy | Pyth Pro/Lazer feed 16 is ADA/USD, not ADA/USDM. `MintPolicy.atomicTreasuryPaymentValid` still calls `Economic.totalUsdmValue`, and `Economic.oraclePriceFor` reads the legacy Oracle State quote. Carrier binding and exact-rational conversion are isolated candidates, not production-bound. | **TESTED_BOUNDED — production binding OPEN/BLOCKED** |
| P-05 — B2 control / authoritative admission | Provider/control code exists, but exact live control identity, authenticated current observation, qualified liquidity and final transaction-body/input binding still need same-head evidence. | **IMPLEMENTED_UNPROVEN / INTEGRATION_BLOCKED** |
| P-06 — expiry binding | The application V1 expiry profile exists, but the mint path must bind `issuedAt`/`expiresAt` to the approved policy/state and authorized transaction; Issue #20 remains open. | **INTEGRATION_BLOCKED** |
| P-15 — EEV perimeter / qualified asset | The historical direct-USDM artifact describes Preprod `tUSDM`: policy `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9`, asset-name hex `0014df10745553444d`, reported six ledger decimals and quantity `1000000000`. The record does not approve this test asset as the canonical Preprod accounting unit; it also does not establish mainnet identity or liquidation value for ADA/PRE. | **HISTORICALLY OBSERVED; CURRENT LIVENESS AND NORMATIVE MAPPING OPEN** |
| P-16 — Cardano settlement / wallet / Claim | Source and conformance evidence exists, but current public runtime identity, authoritative user-wallet signing, exact final transaction-body binding and matching confirmed on-chain output have not been established by this source review. | **TESTED_BOUNDED AT SOURCE LEVEL; REAL USER ISSUE NOT ESTABLISHED** |

The controlling EEV perimeter remains `PRE-RICH-EEV-USDM-DIRECT-V1`. Its existing `audit/cardano-integration/preprod-direct-usdm-source-set.mjs` requires the real deployment manifest and explicit `PREPROD_TUSDM_UNIT`, then queries the exact B1 Pool address through Koios and fails closed unless the precise out-reference is uniquely live and holds the configured pool singleton and physical asset. This session attempted an external read-only lookup but DNS/network resolution was unavailable; therefore no live unspent/spent result is claimed. Do not replace the source contract with a hand-built query or cached EEV.

Do not run `.github/workflows/pre-rich-b1-eev-approval.yml` as if it were a read-only freshness check: it re-observes, re-qualifies EV1–EV7 and materializes deployment approval. The public EEV approval artifact remains historical until an exact-current source-set observation is captured and reviewed.

#### Current-head CI and operational limits

- The prior current-head run at `485e7843392448ecac8e243223aaec3f5d79f98b` passed Adapter Sale [39722513685](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39722513685), Portability [39722513821](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39722513821), Governability [39722513626](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39722513626) and Protocol Declaration [39722513662](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39722513662).
- Documentation Link Check failed on `485e7843` and `56ab9f77` due to a bad relative link in this checkpoint; Agent B's subsequent correction commit `59727bacd13464c05cd601d5e2c8dec98ed271bd` fixed the path. The current-head docs result at pre-append HEAD `59727bacd13464c05cd601d5e2c8dec98ed271bd` is [run 39723133255](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723133255) with conclusion `success`.
- Isolated Pyth software CI [39659905806](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39659905806) passed synthetic Aiken checks/build and TypeScript typecheck only. The Pyth native-ledger workflow was not dispatched; positive native-ledger acceptance and native-ledger tampered-update rejection remain **NOT RUN**.
- Live PR #19 read immediately before this append: OPEN, draft=false, mergeable=false, 413 changed files, head `59727bacd13464c05cd601d5e2c8dec98ed271bd`, base `8c6873e1d50115659727c82c294426b9a946f1fa`. It remains a broad review surface; no bulk promotion or merge is authorized by this intake.

#### First Agent A sequence

1. Keep DEC-3 closed and route denomination/source policy to D-10/D-11 under D-13/GOV-02; no USD/USDM parity inference.
2. Resolve whether this network-specific Preprod `tUSDM` identity is governed as the representation of the accounting unit; until approved, physical observation and normative admissibility must remain separate claims.
3. Once the asset identity, deployment manifest and source contract are available, run the existing read-only exact-out-reference observation, record fresh tip/slot, retrieval timestamp, `txHash#index`, physical quantity and evidence digest, then re-fetch/verify that exact output against the actual final Issue transaction.
4. Separately retain the Pyth probe in preparation-only mode until an explicit approved test-wallet action and necessary credentials exist. Do not claim Pyth signature acceptance without a confirmed transaction.
5. Keep B2 control, expiry binding, quote-to-MintPolicy binding and confirmed first Issue as separate acceptance gates.

No USDM/USD parity, conversion, oracle authorization, expiry rule, code promotion, workflow dispatch, wallet action, ledger submission, deployment, V3/Reveal change or ledger-state change is authorized by this intake. Overall audit remains **PARTIAL / OPEN**.


### 10.49 Agent B — correct legacy Lucid diagnostic option and second exact-head run — 2026-10-22

**Owner:** Agent B (P-03/P-04).  
**Status:** source correction committed; exact-head Reveal run is IN PROGRESS at checkpoint append time.

#### Result of first diagnostic attempt

PRE-RICH Emulator Reveal Conformance [run #39722987266](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39722987266) completed failure on source SHA 2bc9ac350f36f9e721d43b772231966d4ab4a8a6.

- The prior 16,782-byte failure is now classified correctly as the PrizeValidator reference-script publication transaction, not the final Reveal spending transaction; that publication transaction was 398 bytes above the 16,384-byte limit.
- The size-probe attempt still did not emit CBOR/counters; error was “Spend[1] attempted to instantiate a non-polymorphic term” before the measurement block.
- The workflow’s diagnostic step appeared success only because it has continue-on-error: true; the log itself ends with “Process completed with exit code 1”. This is NOT a successful measurement.
- Source inspection confirmed the repository pins lucid-cardano@0.10.11; the previous probe passed the Evolution-style localUPLCEval option into this legacy builder API, so it did not disable the setting this implementation actually reads. The legacy API exposes nativeUplc for this path.

#### Narrow correction and exact source identity

Commit [f2dd0384ba3d43d02cac40b970a03b771bf4c894](https://github.com/LiberoNuvola/Immortal-Protocol/commit/f2dd0384ba3d43d02cac40b970a03b771bf4c894) changes only src/__tests__/immortal-cardano-reveal-emulator-b1.mjs (blob 92282f9b92e00dac2ba9f1249e9e81285ba39ef3). In the size probe only, the builder now passes { nativeUplc: false } rather than { localUPLCEval: false }. The probe returns before signing/submission, remains diagnostic-only, and must not be used as transaction acceptance/ledger evidence.

No protocol validator, economic rule, V3 carrier, Reveal semantics, production builder, workflow or ledger state was modified.

#### Exact-head validation started

- [PRE-RICH Emulator Reveal Conformance #39723673393](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723673393) is running on exact source SHA f2dd0384ba3d43d02cac40b970a03b771bf4c894. At checkpoint append time its setup/build pipeline was not yet at the Reveal steps.
- [IMMORTAL Cardano Integration Lab #39723673382](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723673382) ended cancelled before giving current-head native P2.8 evidence. This does not change P-04 status.
- The automatic current-head Documentation Link Check [#39723673456](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723673456) passed on f2dd0384.

**Next action:** read run #39723673393 after completion. If nativeUplc:false allows a serialized CBOR, inspect exact transaction bytes, expected two reference inputs and embedded Plutus V1/V2/V3 counts. Otherwise record the actual exception and stop repeating the same no-result probe. Do not infer reference-witness correctness from a structural test or a step-level continue-on-error PASS.

**Current verdict:** PrizeValidator reference-script publication tx = previously observed 16,782 / 16,384 bytes; final Reveal CBOR size is NOT YET MEASURED; fresh diagnostic result on nativeUplc:false is pending; native P2.8 NOT ESTABLISHED; P-03/P-04 remain INTEGRATION_BLOCKED; no transaction submitted by this Agent B step. Overall audit remains PARTIAL / OPEN.


### 10.50 Agent A — fresh live observation of the direct-USDM Pool out-reference — 2026-10-22

This is a fresh **read-only liveness observation** of the exact historical EEV candidate. It does not change the source contract, qualify `tUSDM` as the normative accounting unit, re-run EV1–EV7 qualification, materialize deployment approval, or authorize an Issue.

#### Exact observation evidence

- Collector source: `audit/cardano-integration/preprod-eev-liveness-observation.mjs`, blob `0e8d65d9897cecc3afe20659907d10fe438a0582`.
- Workflow: `.github/workflows/preprod-eev-liveness-observation.yml`, blob `d480f342c6c2cf2ab14d6355e0f64e39b6581906`.
- Exact-head run [39723715470](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723715470), source SHA `da22220ba19a7590f3d6b3d3403c401ced54773b), completed **success**. This is collector execution success, and the artifact's domain status below is the actual observation result.
- Artifact: [preprod-eev-liveness-da22220…](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723715470/artifacts/12402475397), ID `12402475397`, artifact ZIP SHA-256 `ba3a1ca39f7d4dd02daa7164b74cf618114e8f1241813742ec56a222113adf1c`.
- Observation interval: `2026-10-22T04:40:56.215Z`–`2026-10-22T04:40:57.630Z`.
- Koios endpoint: `https://preprod.koios.rest/api/v1/address_info`; exact address row returned: 1; exact `txHash#index` match count: **1**.
- Source out-reference: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`.
- Pool address: `addr_test1wrhru9jt8jm600y2mltw300c9tu7cj5tuyew7lz0ex2p75gja592e`.
- Live observed output: 5,000,000 lovelace; Pool singleton quantity **1**; physical candidate asset quantity **1,000,000,000** atomic units. Asset-list SHA-256 `6db7809ba6d2f7ed26cbf1ace737b2ccb62a13e00e4f7f9837b3bb8947077428`; inline datum SHA-256 `713c19f73c32fb981cc048102deedbaa13549a4c714495839fdd8d80898eb3e7`; raw address response SHA-256 `b1f6e6faa1e79ed828fac55c0e84d4118beb48b541f1361cc83f0d3f4007f8a6`.
- Chain tip before and after query was identical: hash `5f6990ecbca633400da6e69850bb8ed114ff5d05b2b8220eb8013461033e4b88`, absolute slot `136960849`, block height `5320729`, Conway era (tip block time `1792644049`).

The artifact result is `LIVE_CANDIDATE_OUTREF_AND_ASSETS_MATCH`. No economic conversion was applied; the observer did not mint or sign anything; no wallet, approval secret or deployment workflow was used.

#### Classification impact for Agent A

| Front / sub-gate | Updated classification | Exact meaning |
|---|---|---|
| P-01 — exact source out-reference liveness | **VERIFIED (time-bounded observation)** | The specified UTxO was present once at the observed Preprod tip and carried the configured historical Pool singleton and physical asset quantity during this observation interval. This result expires as a liveness claim as the chain advances. |
| P-15 — physical candidate asset in the Pool | **OBSERVED LIVE; NORMATIVE MAPPING OPEN** | The exact asset unit is now confirmed on the candidate UTxO, but it remains the Preprod `tUSDM` candidate. The observation does not approve it as the protocol's Preprod accounting unit or equate it to mainnet USDM. |
| P-01 — EV1–EV7/current admission | **NOT REQUALIFIED / BLOCKED** | This collector only observes exact out-reference liveness and physical asset facts. It is not the source-set qualification pipeline, it does not create `DEPLOYMENT_APPROVED`, and it does not bind EEV to an authoritative Issue decision. |
| P-02 — Pyth → MintPolicy | **UNCHANGED: PRODUCTION BINDING OPEN** | No Pyth feed, signature, quote carrier or MintPolicy was part of this observation. |
| P-05 / P-06 / P-16 — admission, expiry and real Issue | **UNCHANGED: INTEGRATION BLOCKED** | No control-state admission, transaction body, expiry, wallet signature, minted NFT or confirmed Issue transaction was evaluated. |

#### Next action

1. Keep DEC-3 closed and resolve the Preprod asset representation/denomination only through existing D-10/D-11 and D-13/GOV-02. Do not infer parity from the live token.
2. After the normative asset identity and required deployment source contract are approved, re-run the existing `preprod-direct-usdm-source-set.mjs` using the actual deployment manifest to create a fresh `OBSERVED_NOT_QUALIFIED` source-set. Do not treat this read-only observation as a substitute for EV1–EV7 requalification.
3. Only after fresh source-set evidence is reviewed may the separately controlled qualification/approval process be considered. Do not use the approval workflow as a read-only observer.
4. Continue to block first Issue until qualified EEV, authoritative B2 admission, final transaction-body/input binding, policy-derived expiry and confirmed ledger/post-state evidence all agree.

**Safety boundary:** no issue of tokens, USD/USDM conversion, oracle authorization, deployment approval, code promotion, wallet signature, workflow dispatch into an approval workflow, or ledger transaction was performed by this observation. Overall status remains **PARTIAL / OPEN**.


### 10.50 Agent B — corrigendum: classify 16,782 bytes as reference-script publication, not Reveal spend — 2026-10-22

**Correction of evidence classification; protocol status does not improve.**

The source and logs show that run [#39646783971](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783971) fails at prize-reference-complete:start, in the builder for payToAddressWithData(referenceAddress, { scriptRef: prizeScript }, ...). That is the transaction publishing the PrizeValidator reference-script UTxO. Its serialized transaction is 16,782 bytes against 16,384; it fails before the canonical Reveal-spending transaction is built. Therefore the figure 16,782 must NOT be cited as the final Reveal spending transaction size.

When the diagnostic profile lifts its local size limit to 100,000, it can publish the reference scripts and advance to Reveal construction, but then fails in local UPLC evaluation before producing final CBOR or witness counters. The actual Reveal spending transaction size and whether embedded script witnesses are absent remain NOT MEASURED by this emulator probe. A separate historical Preprod builder result of ~17,571 bytes remains a distinct path/evidence item and must not be mixed into the 16,782-byte publication result.

The same classification correction is reflected in the semantic dossier [SEMANTIC-REVIEW-P28-REVEAL-REFERENCE-SCRIPTS-2026-10-21.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/SEMANTIC-REVIEW-P28-REVEAL-REFERENCE-SCRIPTS-2026-10-21.md), updated in commit [ca935dbc2c1ad267cff09d5699b71016c00c5df7](https://github.com/LiberoNuvola/Immortal-Protocol/commit/ca935dbc2c1ad267cff09d5699b71016c00c5df7) (blob 1e78c5434b44fa009ca0623039ffd970ad9255df). The correction to the canonical checkpoint is commit [1491e6145caf13f6c33eb04295786ff2bf6b8b06](https://github.com/LiberoNuvola/Immortal-Protocol/commit/1491e6145caf13f6c33eb04295786ff2bf6b8b06) (checkpoint blob d5b3997b344aa7e8a1919f8a93134b81d8bfd5a5).

Separately, the corrected diagnostic parameter nativeUplc: false is under exact-head validation in [PRE-RICH Emulator Reveal #39723673393](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723673393), source SHA f2dd0384ba3d43d02cac40b970a03b771bf4c894. At this section's append time, the run remained in Setup canonical Plutus CI and had not reached the Reveal steps; no positive diagnostic result is yet claimed.

**Next sequence:** (1) read the f2dd0384... run through publication and Reveal diagnostic; (2) record raw validator bytes plus publication CBOR/size at the publication boundary; (3) obtain final Reveal spending CBOR and inspect exact reference inputs and embedded Plutus witness counts; (4) only then choose a narrow byte-size/builder remediation, keeping validator/V3/Reveal semantics unchanged. P-03/P-04 remain **INTEGRATION_BLOCKED**; no ledger transaction was submitted.


### 10.51 Agent B — measured diagnostics at the reference-script publication boundary — 2026-10-22

**Owner:** Agent B (P-03/P-04). Status: instrumentation committed; exact-head validation pending.

#### New evidence from the nativeUplc diagnostic attempt

Run [PRE-RICH Emulator Reveal #39723673393](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723673393), source SHA f2dd0384ba3d43d02cac40b970a03b771bf4c894, completed failure. Its canonical path again failed while completing the PrizeValidator reference-script publication transaction at 16,782 / 16,384 bytes. The size-profile path passed publication under its local diagnostic-only ceiling but then failed Reveal completion with “Blockfrost not set. Can't calculate ex units” after passing nativeUplc:false to the legacy builder. No final Reveal CBOR was emitted; step-level green was due to continue-on-error and is not a successful size measurement.

#### Source change for publication boundary observability

Commit [3f3016fbc6af6c5d5572c7b6b99bdd097d66bcee](https://github.com/LiberoNuvola/Immortal-Protocol/commit/3f3016fbc6af6c5d5572c7b6b99bdd097d66bcee) changes only src/__tests__/immortal-cardano-reveal-emulator-b1.mjs (blob b5bf9cbdc97b0201942b5ee2f30fe0f3b58f5bd2).

Before the first publication transaction’s complete(), the test now prints:
- raw byte lengths for the parameterized PrizeValidator and B1PrizePool scripts;
- factory script byte lengths and each script hash;
- the active emulator maxTxSize.

In diagnostic-only size mode, it also measures the serialized CBOR length of the PrizeValidator and B1PrizePool publication transactions when each builder completes. These are explicitly labelled publication transaction sizes, not Reveal spending size. The canonical path logs script payload lengths before hitting its real 16,384-byte publication limit, which makes the current blocker measurable even when complete() rejects.

This patch does not alter validator bytecode, protocol parameters, economics, V3/Reveal semantics, production builder, workflow configuration or ledger state. The test still uses only an in-memory emulator fixture.

#### Exact-head validation started

- [PRE-RICH Emulator Reveal Conformance #39724168595](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39724168595) runs on source SHA 3f3016fbc6af6c5d5572c7b6b99bdd097d66bcee.
- [IMMORTAL Cardano Integration Lab #39724168616](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39724168616) is the companion current-head lab; no native P2.8 result is established yet.
- At the first post-dispatch inspection, both were queued/pending; no measurements from this new instrumentation are claimed yet.

**Next action:** retrieve the run logs. The key first result is raw parameterized script length; the diagnostic run must then report each complete publication transaction size. Do not interpret publication size as Reveal spending size. After the publication blocker is measured, the Reveal final-CBOR path remains a separate issue because legacy Lucid cannot use nativeUplc:false in this emulator without a Blockfrost evaluator. Do not inject synthetic ExUnits into an acceptance path or call such evidence a ledger result.

**Current verdict:** PrizeValidator publication transaction previously measured at 16,782 / 16,384; fresh script payload lengths and independent publication CBOR sizes are pending; final Reveal spending CBOR NOT MEASURED; native P2.8 NOT ESTABLISHED; P-03/P-04 remain **INTEGRATION_BLOCKED**; no real ledger transaction was submitted. Overall audit remains **PARTIAL / OPEN**.


### 10.52 Agent A — Issue authority freshness fail-closed guard and current-head B2 audit — 2026-10-22

This section records one narrow Issue-authority hardening patch and the current source review of B2 admission/expiry. It does not authorize Issue, select an economic conversion, or change V3/Reveal.

#### Bounded fail-closed correction and exact CI evidence

- `relayer/signedIssueAuthority.js` changed from blob `3ae7d7cd2c125345f647f28adf3e08f7e88db2af` to `bf3c93307c168661b592ed1aaf35f861d342896e` in commit [`1055ad08116b6959f523ff31bff5fc7287a09070`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/1055ad08116b6959f523ff31bff5fc7287a09070). The verifier now rejects absent/null `expected.currentObservedAt` instead of skipping future/stale checks.
- `relayer/signedIssueAuthority.test.js` changed from blob `a01916989e62af65dd1b01cc1bd914bc3d86af9b` to `c9bc1acd02ca4d2bca4c70c1682208d1bfc5f52f` in commit [`a8d2b4a0a779dab06aef87ffd5b7e354b2e0aa8f`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/a8d2b4a0a779dab06aef87ffd5b7e354b2e0aa8f). Added a regression for omitted verification time.
- Exact-head [Issue Admission Boundary CI run 39724296403](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39724296403) completed **SUCCESS** on `a8d2b4a0a779dab06aef87ffd5b7e354b2e0aa8f`: adapter boundary suite, rejection of caller-supplied authority inputs, signed authority/EEV digest binding, envelope end-to-end, first-Issue evidence-chain gate, syntax check and strict adapter typecheck passed.

**Scope limit:** production `fetchSignedIssueAuthority` currently supplies `currentObservedAt: Date.now()`; the change closes only the optional-field bypass. It does not turn a local wall clock into an authenticated Cardano clock. The payload's signed `freshnessWindow` is currently required to be positive but has no source-of-truth governed maximum and is supplied by the authority signer. Do not claim freshness-policy closure: no threshold has been invented or approved here.

#### Current B2 / expiry / transaction-body source review

- `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` blob `0d885efc470b725bfe89d0c1080bf530d362b70d` reads spending inputs from the completed Lucid transaction body and rejects if declared required inputs are missing, duplicated or uninspectable before signing. This is a real fail-closed check.
- **G2 remains PARTIAL:** its documented set relation is inclusion, not equality. The body may contain additional wallet/fee inputs, and the admission witness does not bind a final transaction-body digest or classify each additional spending input. No test/run here proves that arbitrary extra script inputs are rejected. Do not describe the final body as completely bound.
- The existing `assertExecutableLiquidityObservationFresh(observation,currentObservedAt,maxAge)` helper in `Adapter/CARDANO/observation/ExecutableLiquidityObservation.ts` blob `f7add943fe56d19c031f2672a6d27a267d8ca970` checks future/stale observations for caller-provided clock and horizon. Generic `assertEconomicAdmission` does not call it directly. The signed Issue path performs its own time-window check, but the current time is local `Date.now()` and the freshness window is authority-supplied. G3 is therefore **PARTIALLY IMPLEMENTED / POLICY OPEN**, not closed.
- `PRE-RICH/src/PreRichExpiryPolicy.ts` blob `4191763a53124f7d6736bd09694eab660d1faef4` defines the existing application/profile V1 horizon bounds (2 hours to 300 days) and deterministic horizon from its supplied issuance-state snapshot. This is not a new universal IMMORTAL duration.
- `src/mint.ts` blob `b9b1a7f4846e4cfdf8862368421b8ce7cf8b1534` still sets `issuedAtMs = BigInt(Date.now())`, crystallizes expiry from a caller-supplied or carrier-derived snapshot, and validates the completed Treasury output, validity upper bound and min-ADA before `submitEconomic`. The inspected production MintPolicy/B1 TicketIssued path does not prove that the stored `issuedAt`/`expiresAt` originated from the authorized snapshot/policy. P-06 remains **INTEGRATION_BLOCKED**; no V3/Reveal semantics were changed.
- `src/preRichIssueAdmissionBridge.ts` blob `8e594655f68fb3c9f267703a85474e6fd1f25f8e` binds EEV qualification/deployment approval to the exact Pool reference and checks certificate/evidence fields. The signed-envelope verifier validates signature, required field shape and internal cross-bindings. It does not independently fetch and re-hash the live source files/evidence bytes for EV1–EV7; G4's byte-level recomputation remains open.

#### Agent A status after this slice

| Item | State |
|---|---|
| P-01 exact direct-USDM candidate out-reference liveness | **VERIFIED for the 2026-10-22T04:40:56Z observation window only** — run [39723715470](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723715470), artifact [12402475397](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723715470/artifacts/12402475397). EV1–EV7 are not requalified by that read-only run. |
| P-01 first Issue / EV1–EV7 current qualification | **BLOCKED** — requires normative Preprod asset identity, fresh source-set and separately authorized qualification/approval, then transaction and ledger reconciliation. |
| P-02 Pyth → production MintPolicy | **TESTED_BOUNDED / PRODUCTION BINDING OPEN** — still legacy Oracle State valuation; feed 16 is ADA/USD; unit/quote decision open. |
| P-05 B2 admission | **IMPLEMENTED_UNPROVEN / G2 PARTIAL** — required input containment exists, complete final-body binding and extra-input classification remain open. |
| P-06 expiry | **INTEGRATION_BLOCKED** — profile exists, but on-chain origin binding remains unproven. |
| P-15 qualified asset/liquidity perimeter | **HISTORICAL/PHYSICAL tUSDM OBSERVED LIVE; NORMATIVE MAPPING OPEN** — no parity assumption, no ADA/PRE liquidation qualified. |
| P-16 first wallet Issue / final settlement | **NOT ESTABLISHED** — no wallet-signature/confirmed Issue transaction or independent post-state evidence is claimed. |

#### Next executable steps and safety boundary

1. Keep the new clock-presence regression; do not equate it with trustless time or a governed freshness horizon.
2. Route freshness-window governance through the existing D-11/D-13/GOV-02 source-of-truth path; do not set a max age here.
3. To close G2, specify and test an explicit policy for permitted additional fee/funding inputs, then bind/reconcile all actual final-body inputs and outputs. Coordinate before editing the shared adapter submission boundary.
4. To close G4/G5, recompute approved evidence digests from retrieved canonical bytes and later compare the confirmed transaction's actual inputs/outputs and post-state; receipt-only evidence is insufficient.
5. P-06 needs a policy/state → `issuedAt`/`expiresAt` predicate at the authorized Issue boundary, backed by adversarial direct-transaction tests; do not relax or edit V3/Reveal to achieve it.
6. No Issue, wallet action, approval workflow, deployment, conversion, or ledger transaction was performed in this slice.

Overall audit remains **PARTIAL / OPEN**.


### 10.52 Agent B — fresh compiled validator size exceeds the Cardano publication ceiling; artifact drift recorded — 2026-10-22

**Owner:** Agent B (P-03/P-04). **Status:** measured blocker; root-cause investigation remains OPEN.

#### Exact-head instrumentation result

PRE-RICH Emulator Reveal Conformance [run #39724168595](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39724168595) ran the fresh-export workflow and failed in canonical mode during PrizeValidator reference-script publication. The log at 2026-10-22T04:49:53Z reports the following from the script instances actually loaded after the fresh Plutus build/export:

| Measurement | Value |
|---|---:|
| Fresh PrizeValidator factory script payload bytes | 16,559 |
| Fresh parameterized PrizeValidator script payload bytes | **16,688** |
| Canonical reference-publication size guard result | 16,782 / 16,384 bytes |
| Diagnostic unsigned/complete PrizeValidator publication CBOR measured with local size ceiling 100,000 | **16,879 bytes** |
| Fresh B1PrizePool factory script payload bytes | 11,357 |
| Fresh parameterized B1PrizePool script payload bytes | 11,513 |
| Diagnostic B1PrizePool publication CBOR measured with local size ceiling 100,000 | 11,704 bytes |

The parameterized PrizeValidator payload alone is 304 bytes larger than the 16,384-byte transaction maximum, before output encoding, fee/change and transaction metadata. Thus the single reference-script publication cannot fit within the current size ceiling in this measured build. The canonical builder's failure at 16,782 and the diagnostic CBOR size of 16,879 are both over the cap; preserve both readings as different observations from the normal and diagnostic construction profiles rather than merging the numbers. The diagnostic profile's 100,000-byte limit is local instrumentation only, not protocol acceptance.

#### Fresh-build artifact mismatch against tracked JSON

The workflow explicitly ran the fresh Plutus export and then copied those generated files to the test consumer before running the fixture. Its log records these fresh JSON SHA-256 digests:

- PrizeValidator factory JSON: b9e7a4dddc802e7db7c549dc591effa4ac05c6e2b40a42d94390c92915538695
- B1PrizePool factory JSON: 85ee9ee816b8081f34e91ea738597cf40e67db17e1b3105393ced0d533cbc615

By contrast, the Git-tracked factory JSON blobs currently fetched from the checkpoint branch have materially smaller cborHex payloads:

| Tracked path | Blob SHA | Tracked factory payload bytes | Fresh build payload bytes |
|---|---|---:|---:|
| src/plutusScripts/prizeValidatorFactory.plutus.json | 183ebe92b31924aa19799dff8ec687b9b9bb9a22 | 9,760 | 16,559 |
| src/plutusScripts/b1PrizePoolFactory.plutus.json | 9efbac15e5dbf8ed5c2133ce0c6068c2c43c8de6 | 7,543 | 11,357 |

This is an artifact/source drift signal that requires reconciliation: the size gate must be evaluated against the freshly exported artifact derived from current Plutus source, not the smaller checked-in JSON copied before build. The mismatch by itself does not identify whether the cause is source evolution, compiler/build configuration, or stale generated artifacts; don't edit/replace deployed artifacts or claim equivalence without reviewing the export path and source/build identity.

#### What this proves and does not prove

- **Proven for this current run's generated artifact:** the parameterized PrizeValidator script payload (16,688 bytes) already exceeds the ledger transaction size limit. Publishing it as one reference script cannot meet the 16,384-byte bound in this build.
- **Not proven:** a final Reveal-spending transaction size. The diagnostic path did publish both reference scripts under its local 100,000-byte ceiling, but then failed during Reveal completion with “Blockfrost not set. Can't calculate ex units” after nativeUplc was disabled. No final Reveal CBOR or witness count was emitted.
- **Not proven:** a successful on-ledger publication, an accepted Reveal, or native P2.8 evaluation. All these measurements are from the in-memory emulator; no real ledger submission occurred in this Agent B run.
- The earlier ~17,571-byte Preprod builder observation remains a different evidence path and is not merged with the 16,782 / 16,879 publication-transaction observations.

#### Next controlled action

1. Reconcile generated source/build identities: inspect export-scripts compiler and artifact-generation parameters against the tracked JSON SHA and exact Haskell source. Record exact build/compiler versions and script hashes before replacing any generated file.
2. Since the fresh parameterized payload alone exceeds the limit, do not spend more runs optimizing only the publication transaction wrapper. Identify a semantics-preserving compiler/serialization optimization hypothesis or prepare a separately reviewed architectural proposal. No validator/V3/Reveal semantic change is authorized by these measurements.
3. Independently resolve how to obtain final Reveal CBOR without using fabricated ExUnits. The current legacy emulator path with nativeUplc:false requires Blockfrost, which is not configured; do not claim final-spend sizing until a real evaluator path or a rigorously bounded non-acceptance diagnostic is explicitly established.
4. Keep P-03/P-04 INTEGRATION_BLOCKED, the 16,384-byte ceiling unchanged and the review focused on the exact current source/build. No deploy, real transaction, merge, or validator semantics change was performed.

Overall audit remains **PARTIAL / OPEN**.


### 10.53 Agent B — Claim owner/signatory traversal reduction candidate — 2026-10-22

**Status:** source candidate committed; exact-head compilation/conformance pending. This is not a closed semantic review.

#### Why this candidate was selected

The current fresh build makes the shared PrizeValidator factory 16,559 bytes and its parameterized script 16,688 bytes, beyond the publication ceiling. The current Claim implementation derives the ticket owner from typed TxInfo for the payout address, but also traverses raw TxInfo input/value maps independently via rawTicketOwnerHash/rawOwnerSigned for owner-signature membership. Git history shows the raw owner/signature path had been refactored before; txSignedBy was later avoided because Yaci/Scalus Plutus V2 evaluation reported a raw Data/ByteString mismatch at signatory membership.

#### Narrow source change

Commit [d6c9fd34d91933197c9d73e9caf3342b3d549623](https://github.com/LiberoNuvola/Immortal-Protocol/commit/d6c9fd34d91933197c9d73e9caf3342b3d549623) changes only plutus/PrizeValidator.hs (blob a13eba943016af35a7fc39ac568a39d0b7a1be19). It removes the duplicate raw-input owner/value-map parser and changes the Claim owner signature expression to:
- derive maybeOwner once from typed TxInfo using the existing ticketOwnerPkh lookup (already the input to claimantValue);
- decode signatories from raw BuiltinData, preserving the raw-Data equality route rather than using txSignedBy;
- check whether toBuiltinData maybeOwner is a member of those raw signatories.

The intent is to preserve the on-ledger predicate “the current ticket owner is a transaction signer” while eliminating a second parser over the raw input list and Value maps. The function/validator bytecode and validator hash necessarily change if the build differs. This source refactor is a candidate only: exact equivalence for all accepted and rejected Claim contexts has NOT YET BEEN ESTABLISHED. It must not be treated as a deployment-ready or semantically closed change. No V3 carrier or Reveal predicate was edited; no live reference script or ledger state was changed.

#### Exact-head validations triggered

The following Actions were automatically created for exact source SHA d6c9fd34d91933197c9d73e9caf3342b3d549623:

- [PRE-RICH Emulator Reveal Conformance #39725072071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725072071)
- [IMMORTAL Cardano Integration Lab #39725072011](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725072011)
- [IMMORTAL Haskell Semantic Conformance #39725072040](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725072040)

At checkpoint append time these were still in progress/pending. The previous generic passes do not validate this source change. Await exact-head results and inspect fresh generated artifact hashes and parameterized PrizeValidator bytes.

#### Acceptance before treating the candidate as usable

1. Exact-head Plutus build and semantic conformance pass.
2. Fresh compiled PrizeValidator factory and parameterized bytes are smaller enough that the canonical single-reference-script publication transaction actually fits within maxTxSize 16,384, with a reasonable recorded margin. A smaller file alone is not sufficient.
3. Add or run explicit Claim owner/signature positive and negative context cases proving the same owner/payout/signatory behavior for the exact source. A generic compile/pass or Reveal fixture does not establish Claim equivalence.
4. Re-run canonical Reveal without local parameter changes. Only then can the workflow progress past reference publication; final Reveal CBOR and native P2.8 remain separate gates.
5. Since the validator script hash changes, do not promote it or update a deployed reference-script UTxO without separate identity reconciliation and a reviewed, authorized deployment procedure.

**Current verdict:** candidate in validation; fresh build size delta NOT YET AVAILABLE; Claim equivalence NOT YET PROVEN; canonical publication and final Reveal size NOT YET CLOSED; P-03/P-04 remain **INTEGRATION_BLOCKED**. Overall audit remains **PARTIAL / OPEN**.


### 10.54 Agent B — forensic lineage: stale tracked Plutus JSON versus current source closure — 2026-10-22

**Status:** source of drift identified; size/conformance result for the Claim owner-reuse candidate remains pending. No validator logic changed in this section.

#### Exact comparison

- The Git-tracked `src/plutusScripts/prizeValidatorFactory.plutus.json` blob `183ebe92b31924aa19799dff8ec687b9b9bb9a22` contains a `cborHex` payload of 9,760 bytes. Its last history entry on the public/main lineage is the 2026-09-24 release commit `25d083703d07f36e8ed31bf3e5947a4cded5c6a2`; the tracked JSON did not change as the working Plutus source evolved in October.
- The canonical current-branch source before the Claim owner-reuse candidate was `plutus/PrizeValidator.hs` blob `3e35eeadf3fbb6ace4e8b288106a5ed8f687e66b` (35,836 source characters), versus the Sep-24 release-line source blob `52aaea8c964b12fc167908b1417481c4beaad4ce` (27,182 characters). The source history on `work/immortal-green-closure` includes Claim raw-context fixes and size experiments on 2026-10-11 through 2026-10-17. The existing tracked JSON was not regenerated alongside that source lineage.
- The tracked B1PrizePool factory JSON blob `9efbac15e5dbf8ed5c2133ce0c6068c2c43c8de6` contains a 7,543-byte `cborHex` payload; the fresh current-source build measured 11,357 factory payload bytes and 11,513 parameterized bytes. The current working source graph includes added on-chain dependency modules and changed source roots in `plutus/pre-rich-plutus.cabal` (current blob `3f06a8d28fc121ea19aa591db73f7ff19ef12c31`, 10,551 characters; release-line blob `36c3cb21706f54d6dace802321eb2d8c4ffe3a09`, 5,613 characters). This is a source/dependency-closure drift signal, not a one-file encoding discrepancy.
- The compiler dependency is **not** the explanation found so far: current `cabal.project` pins Plutus at commit `48e9bf08f439e7223de713b5b71696fcd81cffc3`, and the upstream Git tag `1.67.0.0` resolves to that exact same commit. The project file changed from a tag reference to its commit SHA, not to a different Plutus revision.
- The export program serializes `PrizeValidator.compiledValidatorFactory` and `B1PrizePool.compiledValidatorFactory` via `serialiseCompiledCode`. The emulator workflow rebuilds these artifacts from the current checkout and copies the fresh exports into its consumer workspace. Therefore size/acceptance conclusions must use the fresh run payloads, not the older committed JSON.

#### Consequence and constraints

The measured 16,559-byte fresh PrizeValidator factory and 16,688-byte parameterized script are the valid current-source measurements for the pre-Claim-reuse candidate. The 16,782-byte canonical publication attempt and 16,879-byte diagnostic publication CBOR are separate construction profiles and both exceed the 16,384-byte ledger limit. The smaller tracked JSON is not evidence of a publishable current validator.

The current exact-head candidate [`d6c9fd34d91933197c9d73e9caf3342b3d549623`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/d6c9fd34d91933197c9d73e9caf3342b3d549623) reduces one redundant raw owner/value-map traversal in Claim. Its size delta must be taken only from fresh build output; source line count or artifact file size alone is not acceptance. Wait for current-head Reveal and Haskell semantic conformance runs, then record the new factory and parameterized bytes plus exact run/compiler artifact hashes. Claim owner/signature equivalence remains OPEN until explicit positive/negative cases pass.

No tracked artifact was overwritten, no deployed hash was changed, no V3/Reveal predicate was changed, and no ledger transaction was submitted. P-03/P-04 remain **INTEGRATION_BLOCKED**; overall audit remains **PARTIAL / OPEN**.


### 10.54 Agent B — size result after Claim owner traversal reduction — 2026-10-22

**Exact source under test:** [d6c9fd34d91933197c9d73e9caf3342b3d549623](https://github.com/LiberoNuvola/Immortal-Protocol/commit/d6c9fd34d91933197c9d73e9caf3342b3d549623).  
**Status:** source compiles and export completes; canonical PrizeValidator reference publication still fails by 2 bytes; Claim semantic verification pending.

#### New exact-head generated sizes

PRE-RICH Emulator Reveal Conformance [run #39725072071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725072071) completed failure on the exact candidate SHA. Fresh Plutus export and artifact binding succeeded. The fixture's fresh measurements are:

| Measurement | Previous generated artifact at run #39724168595 | Candidate at run #39725072071 |
|---|---:|---:|
| PrizeValidator factory script payload | 16,559 B | 16,024 B |
| Parameterized PrizeValidator script payload | 16,688 B | **16,153 B** |
| Canonical publication size guard | 16,782 B | **16,386 B** |
| Diagnostic complete publication CBOR under local 100,000 ceiling | 16,879 B | **16,344 B** |
| B1PrizePool factory payload | 11,357 B | 11,357 B |
| Parameterized B1PrizePool payload | 11,513 B | 11,513 B |
| Diagnostic Pool publication CBOR | 11,704 B | 11,704 B |

The candidate reduced the parameterized PrizeValidator by 535 bytes. The canonical builder now fails with “Maximum transaction size of 16384 exceeded. Found: 16386”, 2 bytes over. The diagnostic unsigned publication CBOR is 16,344 bytes, but that does not override the canonical size guard: it omits/does not model all bytes included by the builder's completion estimate, and is not an accepted or signed ledger transaction. No maxTxSize was changed.

#### Final Reveal size is still not available

With the local diagnostic ceiling raised to 100,000, both reference-script publication CBOR measurements can be emitted; construction then reaches Reveal. Reveal completion fails with “Blockfrost not set. Can't calculate ex units” under the legacy lucid-cardano@0.10.11 builder when nativeUplc:false is set for this diagnostic. Consequently the final Reveal-spending CBOR, actual embedded script witness count and reference-input census are still **NOT MEASURED** by this emulator workflow. A green diagnostic step due to continue-on-error is not a pass.

#### Semantic-validation status

The Claim owner/signature traversal source reduction is promising for script size but is **not yet semantically closed**. The current IMMORTAL Haskell Semantic Conformance run [#39725072040](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725072040) and Integration Lab [#39725072011](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725072011) were still running at checkpoint append time; no results from them are implied. The current Haskell Reveal fixture primarily evaluates Reveal contexts and does not yet provide a positive full Claim path for the changed ownerSigned expression. No deployment/reference-UTxO update is authorized or performed.

**Next action:** remove only the logically redundant Claim conjunct pdStatus datum /= Claimed, which is subsumed by the preceding pdStatus datum == Revealed, and run fresh exact-head export/size and regression gates. This targets a source-level no-op predicate rather than changing economics, Claim ownership, signature requirements, Reveal semantics or V3. Then add/execute explicit Claim owner-signature positive and negative evidence before treating the owner-traversal optimization as ready.

**Current verdict:** parameterized PrizeValidator 16,153 B; canonical publication 16,386 / 16,384 B; final Reveal spending CBOR NOT MEASURED; Claim equivalence NOT YET PROVEN; P-03/P-04 remain **INTEGRATION_BLOCKED**; no real-ledger transaction submitted. Overall audit remains **PARTIAL / OPEN**.


### 10.55 Agent B — remove unreachable Claim status guard and rerun exact-head size gate — 2026-10-22

**Owner:** Agent B (P-03/P-04). Status: candidate source change committed; exact-head runs in progress.

#### Change

Commit [af56179fba836229f9a4463bbcd82ef619cec0f8](https://github.com/LiberoNuvola/Immortal-Protocol/commit/af56179fba836229f9a4463bbcd82ef619cec0f8) changes only plutus/PrizeValidator.hs from blob a13eba943016af35a7fc39ac568a39d0b7a1be19 to 2455f8283d87ff74a94b1b8bca1d1f96d60ae8b2. It removes the Claim condition pdStatus datum /= Claimed, which is unreachable after the immediately preceding condition pdStatus datum == Revealed succeeds for a valid typed PrizeStatus. It does not change Claim economics, owner extraction, signatory membership, Reveal predicates, V3 or protocol constants. Nevertheless it changes compiled code and must be checked by fresh export and conformance before retaining as an optimization.

#### Triggered exact-head Actions

- [PRE-RICH Emulator Reveal Conformance #39725693094](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693094), exact source SHA af56179fba836229f9a4463bbcd82ef619cec0f8; was in canonical Plutus setup when inspected.
- [IMMORTAL Haskell Semantic Conformance #39725693412](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693412), exact same source SHA; was in Haskell setup when inspected.
- [IMMORTAL Cardano Integration Lab #39725693023](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693023) was cancelled after the new push due to the workflow concurrency group. It provides no integration result for af56179f.

For context, the immediately prior exact-head result on d6c9fd34d91933197c9d73e9caf3342b3d549623 was: parameterized PrizeValidator 16,153 B; canonical publication builder guard failed at 16,386 / 16,384 B (2 over), while diagnostic unsigned publication CBOR was 16,344 B under a local ceiling 100,000. The final Reveal spending CBOR remained unmeasured because the legacy diagnostic builder failed with “Blockfrost not set. Can't calculate ex units.” The redundant-guard removal is intended to gain margin; no new size result is claimed until af56179f is freshly exported and run.

**Next action:** read exact-head run #39725693094 for fresh script payload and canonical publication guard; read #39725693412 for source-level conformance. Preserve the 16,384-byte limit and do not infer Claim semantic equivalence from a smaller script alone. Explicit Claim owner-signature positive/negative evidence remains open. No deployment, reference-script update or ledger submission was performed.

**Current verdict:** exact size after the redundant-guard removal NOT YET MEASURED; Claim owner/signature equivalence NOT YET PROVEN; final Reveal spending CBOR NOT MEASURED; P-03/P-04 remain **INTEGRATION_BLOCKED**; overall audit **PARTIAL / OPEN**.


### 10.55 Agent B — Haskell V2 Claim test marker alignment and current validation dispatch — 2026-10-22

**Owner:** Agent B (P-03/P-04).  
**Status:** test correction committed; Haskell V2 Claim trace not yet observed to completion.

#### Claim owner/signature candidate and size delta

The exact-source emulator run [#39725072071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725072071) for source SHA `d6c9fd34d91933197c9d73e9caf3342b3d549623` fresh-built and exported successfully, but canonical PrizeValidator reference publication failed its size guard. The diagnostic had emitted a Prize publication CBOR of 16,344 bytes under a local maxTxSize of 100,000; this is diagnostic-only and does not supersede the canonical builder guard (16,386 / 16,384). Subsequent Reveal construction stopped at `Blockfrost not set. Can't calculate ex units`, so final Reveal spend CBOR remains NOT MEASURED.

Commit [`af56179fba836229f9a4463bbcd82ef619cec0f8`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/af56179fba836229f9a4463bbcd82ef619cec0f8) removes the logically redundant Claim conjunct `pdStatus datum /= Claimed` directly after `pdStatus datum == Revealed`. This is source-level predicate simplification only. The exact-head run [PRE-RICH Emulator Reveal #39725693094](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693094) was still in setup/build as of this section. **No fresh size delta for af56179f is claimed yet.**

#### Haskell V2 Claim trace and marker alignment

The Cardano Integration Lab has a new, separate `Execute Haskell V2 Claim owner-signature conformance candidate` step in addition to the existing Aiken V3 Claim trace. It runs `audit/cardano-integration/claim-ledger-trace.ts` with `IMMORTAL_CLAIM_AIKEN_V3=0`, relying on the freshly exported Haskell PrizeValidator artifact and the script's positive Claim plus five negative twins. In the compact-label Haskell V2 validator, Claim's owner-signature failure is marker `54` and settlement/payout failure marker `59`; the existing Aiken path uses different descriptive markers. The source-level marker mismatch was corrected in commit [`144a809899bedea17e9937fd0f43bb31a35465c4`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/144a809899bedea17e9937fd0f43bb31a35465c4), blob `cced077c9ba001feeda21c59aa8be7f2333be45c`, by choosing the expected marker according to the selected validator mode. Without this, a valid ledger rejection could have been incorrectly classified as inconclusive because the expected Aiken trace text would not match Haskell V2's compact label.

Exact-head validation dispatch:
- [IMMORTAL Cardano Integration Lab #39725914240](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725914240), source SHA `144a809899bedea17e9937fd0f43bb31a35465c4`, was pending at section append time; it includes the current Haskell V2 Claim trace-marker correction.
- [PRE-RICH Emulator Reveal Conformance #39725693094](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693094), source SHA `af56179fba836229f9a4463bbcd82ef619cec0f8`, was in progress and is the specific run to inspect for the fresh export size after the redundant guard was removed.
- [IMMORTAL Haskell Semantic Conformance #39725693412](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693412), same source SHA `af56179f...`, was still in its setup phase. Its pure/source conformance scope is not a substitute for the live Claim owner/signature trace.
- The prior integration run [#39725706061](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725706061) was still running on pre-marker-fix commit `d54f896cae349f846a3447acfd6e8406f2bb6245`; if it reports Haskell Claim results, interpret expected-marker classification against that older trace code, not the corrected marker implementation.

#### Acceptance gates remain separate

1. Fresh-export factory and parameterized script sizes from exact current source, followed by canonical publication below 16,384 with a recorded margin; diagnostic CBOR alone is not acceptance.
2. Haskell V2 Claim positive transition succeeds on local Yaci; missing-owner signer negative twin is rejected with marker `54` or explicitly classified native ledger failure; settlement-negative cases prove their expected branches.
3. No V3/Reveal semantics changed. The reduced Claim owner path remains a candidate until the new source and claim trace results complete.
4. Final Reveal-spending CBOR and native P2.8 still need their own exact transaction, UTxO, PParams, EpochInfo, SystemStart and ledger-evaluation packet.

No production/preprod transaction was submitted and no live reference script was replaced. **P-03/P-04 remain INTEGRATION_BLOCKED; overall audit remains PARTIAL / OPEN.**


### 10.56 Agent B — Haskell V2 Claim trace blocked by superseded run; corrected marker run queued — 2026-10-22

**Owner:** Agent B (P-03/P-04). **Status:** marker correction committed; corrected local-Yaci Claim test in progress. No semantic PASS claimed yet.

#### Run #39725706061 disposition

[IMMORTAL Cardano Integration Lab #39725706061](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725706061), source SHA `d54f896cae349f846a3447acfd6e8406f2bb6245`, finished as `cancelled`. Its steps show that `Setup canonical Plutus CI` was cancelled; the fresh export, Yaci launch, Claim steps and P2.8 stages were skipped. The workflow later hit its fail-closed guard `Enforce successful Aiken build for Claim candidate` because the required setup/build outcome was not success; this reflects cancellation of the prerequisite, not evidence that Aiken or Haskell Claim semantics failed. The Haskell V2 Claim candidate step was skipped. This run contributes no ledger/conformance result.

#### Corrected test and replacement dispatch

- The Haskell V2 Claim test path now selects expected traces by validator mode in [commit `144a809899bedea17e9937fd0f43bb31a35465c4`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/144a809899bedea17e9937fd0f43bb31a35465c4), source blob `cced077c9ba001feeda21c59aa8be7f2333be45c`. It expects compact Haskell V2 marker `54` for owner-signature failure and `59` for Claim payout/settlement failure, while retaining Aiken's descriptive markers when the Aiken mode is selected.
- Replacement [IMMORTAL Cardano Integration Lab #39725914240](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725914240) checks out SHA `144a809899bedea17e9937fd0f43bb31a35465c4`; it was `in_progress` with Plutus cache restore in progress at the time of this update. The Haskell V2 Claim candidate step cannot be considered executed until its own step outcome and artifact/log evidence are observed.
- The exact source size run [PRE-RICH Emulator Reveal #39725693094](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693094) on `af56179fba836229f9a4463bbcd82ef619cec0f8` completed fresh artifact export/binding and smoke, but had not advanced past the cache-save step at last check; therefore the effect of removing Claim's redundant `pdStatus /= Claimed` conjunct on canonical publication size is not yet measured in the available step summaries.
- [IMMORTAL Haskell Semantic Conformance #39725693412](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693412), also on `af56179f...`, was in the `Historical PRE policy UPLC decode` step; it has not supplied a completed exact-head conformance result yet.

#### Current acceptance boundary

The last completed fresh-size observation is still the pre-redundant-guard candidate [run #39725072071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725072071): parameterized PrizeValidator 16,153 B; canonical publication guard 16,386 / 16,384 B (2 B over); diagnostic publication CBOR 16,344 B under local maxTxSize 100,000; final Reveal-spending CBOR NOT MEASURED. Keep those values attributed to `d6c9fd34...` only; no newer measurement is claimed.

**Next action:** obtain the current-head step outcomes/logs for run #39725693094, run #39725693412 and replacement Lab #39725914240. On the corrected Lab, require the Haskell V2 Claim positive case plus all five negative twins, especially `missing-owner-required-signer`, to finish with the expected actual branch evidence. Until then, Claim owner/signature equivalence remains OPEN, P-03/P-04 remain `INTEGRATION_BLOCKED`, and overall audit remains **PARTIAL / OPEN**.


### 10.56 Agent B — PrizeValidator publication passes in emulator; second reference publication exposes fixture funding defect — 2026-10-22

**Exact source:** af56179fba836229f9a4463bbcd82ef619cec0f8. **Status:** publication size gate improved; canonical fixture blocked at second publication by available input.

Run [PRE-RICH Emulator Reveal Conformance #39725693094](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693094) completed failure on the exact head. Fresh build/export and artifact binding passed. Fresh script metrics:

| Measurement | Previous source d6c9fd34 | Current source af56179f |
|---|---:|---:|
| PrizeValidator factory payload | 16,024 B | **15,977 B** |
| Parameterized PrizeValidator payload | 16,153 B | **16,106 B** |
| Canonical first reference publication completion | Passed size guard, then local emulator submit/confirmation | Same current run now passes |
| Diagnostic PrizeValidator publication CBOR | 16,344 B | **16,297 B** |
| Parameterized B1PrizePool | 11,513 B | 11,513 B |
| Diagnostic B1PrizePool publication CBOR | 11,704 B | 11,704 B |

The redundant Claim status guard removal lowered both PrizeValidator factory and parameterized payloads by another 47 bytes. The canonical path now completes, signs, submits and awaits the PrizeValidator reference publication in the in-memory emulator. It then fails during construction of the B1PrizePool reference publication with “Insufficient input in transaction”. The log shows lucid.wallet.getUtxos() as an empty list immediately before that second publication. This is a test-fixture funding/coin-selection blocker uncovered only after the size gate moved; it is not a Reveal validator rejection.

The diagnostic-only run with local maxTxSize 100,000 publishes both references but fails building Reveal with “Blockfrost not set. Can't calculate ex units”; no final Reveal CBOR is emitted. No real Cardano ledger transaction was submitted in this workflow.

#### Next test-harness correction

Add a second ADA-only initial UTxO on the same emulator wallet address to keep funding available for the second reference-script publication after the first setup/publication sequence. Do not change validators or transaction-size parameters. Rerun exact-head canonical test and confirm it reaches the Reveal-spending construction before recording any reveal-size conclusion. A local emulator confirmation remains bounded evidence only; native P2.8 and Claim owner/signature equivalence remain OPEN.

**Current verdict:** first reference-script publication passes the in-memory emulator at current generated size; second reference publication is BLOCKED by fixture funding; final Reveal spending CBOR NOT MEASURED; native P2.8 NOT ESTABLISHED; P-03/P-04 remain **INTEGRATION_BLOCKED**; overall audit **PARTIAL / OPEN**.


### 10.57 Agent B — preserve emulator funding across both reference-script publications — 2026-10-22

**Owner:** Agent B (P-03/P-04). Status: fixture correction committed; fresh exact-head validation pending.

#### Triggering evidence

PRE-RICH Emulator Reveal run [#39725693094](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693094), source SHA af56179fba836229f9a4463bbcd82ef619cec0f8, completed with the new PrizeValidator publication size below the builder guard. It submitted and awaited that publication in the in-memory Emulator, then failed during B1PrizePool reference publication with “Insufficient input in transaction”; diagnostic logs showed no wallet UTxOs before the second publication. With the publication-size blocker removed, this fixture funding/coin-selection condition becomes the next obstacle.

#### Narrow fixture-only correction

Commit [5208318cb6ed51875ae2bae53364486f57dcaa37](https://github.com/LiberoNuvola/Immortal-Protocol/commit/5208318cb6ed51875ae2bae53364486f57dcaa37) changes only src/__tests__/immortal-cardano-reveal-emulator-b1.mjs (new blob 305d3e6123311d22c09122e0cc49a47ee9fa560d, prior blob b5bf9cbdc97b0201942b5ee2f30fe0f3b58f5bd2). A second ADA-only UTxO is now seeded to the same wallet address, separate from the NFT-bearing setup UTxO, so the second publication has independent fixture funding if the legacy emulator path consumes the first change output. It does not change validator bytecode, transaction-size limits, economic state, Reveal/V3 semantics or any live/preprod ledger state.

#### Exact-head next test

The new source SHA is 5208318cb6ed51875ae2bae53364486f57dcaa37. The automatically triggered [PRE-RICH Emulator Reveal Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/workflows/pre-rich-emulator-reveal.yml) must show whether both reference-script publications and the canonical Reveal builder progress with the 16,384-byte ceiling. Do not assume this passes because a new funding UTxO exists; inspect its actual logs. If Reveal then fails during local UPLC evaluation, record that as the next distinct blocker; do not bypass it or fabricate execution units.

**Current verdict:** PrizeValidator size gate now passes through first publication in the in-memory emulator at current source; second-publication funding correction is pending validation; final Reveal spending CBOR NOT MEASURED; native P2.8 NOT ESTABLISHED; Claim owner/signature equivalence NOT YET PROVEN. P-03/P-04 remain **INTEGRATION_BLOCKED**; no real-ledger transaction submitted; audit **PARTIAL / OPEN**.


### 10.58 Agent B — isolate reference-publication payers after legacy coin selection drains fixture wallet — 2026-10-22

**Owner:** Agent B (P-03/P-04). **Status:** fixture-only correction committed; exact-head emulator run in progress.

#### Evidence and refinement of §10.57

The exact-head run [PRE-RICH Emulator Reveal #39725693094](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693094), source `af56179fba836229f9a4463bbcd82ef619cec0f8`, now shows the PrizeValidator reference publication completes and is submitted in the in-memory Emulator after the redundant Claim predicate was removed. Fresh payload: PrizeValidator factory 15,977 B; parameterized script 16,106 B. The same run then failed at B1PrizePool reference publication with `Insufficient input in transaction`; the main wallet's UTxO list was empty after the first publication. This confirms that the publication path can consume the available wallet value (including its change) while keeping within the local serialization ceiling, leaving no payer input for the second script.

The intermediate single-extra-UTxO idea at commit [`5208318cb6ed51875ae2bae53364486f57dcaa37`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/5208318cb6ed51875ae2bae53364486f57dcaa37) leaves that funding on the same wallet address, so the same legacy coin-selection path may consume it too. A newer, isolated fixture correction was therefore made rather than treating the intermediate idea as proven.

#### Narrow isolated-payer change

Commit [`218f4f32b802a2f969e71f77ab9e7ad3afc478a4`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/218f4f32b802a2f969e71f77ab9e7ad3afc478a4) changes only `src/__tests__/immortal-cardano-reveal-emulator-b1.mjs` (new blob `3c57391cd3254365d9ee7de4a952f48254a5671f`). It seeds two independent emulator-only fee wallets with 3,000,000 lovelace each and uses one publisher for the PrizeValidator reference-script transaction and another for the B1PrizePool reference-script transaction. The script-holder address stays separate from both publishers and the ticket/game wallet. This avoids making either publication depend on the previous transaction's change output and prevents a publication from consuming the ticket/game wallet merely to fund infrastructure.

This change touches only the emulator fixture funding/transaction construction; no Plutus validator, economic logic, V3/Reveal semantics, protocol limit, production builder or deployed reference UTxO was changed. No real/preprod transaction was submitted.

#### Exact-head verification started

- [PRE-RICH Emulator Reveal Conformance #39726613822](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726613822), source SHA `218f4f32b802a2f969e71f77ab9e7ad3afc478a4`, is running. Its logs must prove that both isolated publication transactions complete and submit, and show remaining game-wallet UTxOs, before claiming this fixture blocker is cleared.
- [IMMORTAL Cardano Integration Lab #39726613781](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726613781), same SHA, was pending at the last check; it must be observed separately for the Haskell V2 Claim positive/negative twins. The previous Lab/Reveal runs on intermediate commits do not prove the isolated-payer version.

#### Exit predicates

1. Both reference-script publication transactions complete/submit in canonical emulator mode at `maxTxSize=16384`, with the actual serialized sizes recorded.
2. The fixture does not drain the game wallet needed for later Reveal setup; both reference UTxOs are uniquely identified and remain read-only inputs to Reveal.
3. The actual Reveal-spending CBOR must still be measured independently. A diagnostic-only path that raises local `maxTxSize` and stops before signing/submission is not acceptance.
4. The later Yaci/native P2.8 packet remains a separate gate.

**Current verdict:** the prior exact-head PrizeValidator payload measurement (16,106 B) is below the script size seen before the redundant Claim guard was removed, but the current canonical two-publication run is pending. Final Reveal-spend CBOR remains NOT MEASURED; native P2.8 is NOT ESTABLISHED; Claim owner/signature equivalence is OPEN. P-03/P-04 remain **INTEGRATION_BLOCKED**, overall audit **PARTIAL / OPEN**.


### 10.58 Agent B — exact run IDs for the second-reference funding fixture — 2026-10-22

The fixture-only funding correction from §10.57 has triggered these exact-head workflows on source SHA 5208318cb6ed51875ae2bae53364486f57dcaa37:

- [PRE-RICH Emulator Reveal Conformance #39726370402](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370402): still in progress at Setup canonical Plutus CI at the last read; no new test result yet.
- [IMMORTAL Cardano Integration Lab #39726370427](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370427): still in progress at Setup canonical Plutus CI at the last read; no native P2.8 result yet.

On the same SHA, general CI already returned SUCCESS for Documentation Link Check [#39726370505](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370505), IMMORTAL Portability Conformance [#39726370417](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370417), Algorithmic Governability Adversarial Lab [#39726370360](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370360) and Protocol Declaration Conformance [#39726370468](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370468). These do not certify the Reveal/P2.8 gate.

Baseline remains run [#39725693094](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39725693094) on source af56179fba836229f9a4463bbcd82ef619cec0f8: PrizeValidator publication passed in the in-memory emulator at 16,106-byte parameterized script payload; the second B1PrizePool publication then failed for missing input. The new ADA-only fixture UTxO is meant to address that exact setup blocker. Await actual step logs before marking it resolved.

**Current verdict:** new exact-head result pending; final Reveal spending CBOR NOT MEASURED; Claim owner/signature equivalence NOT YET PROVEN; native P2.8 NOT ESTABLISHED; P-03/P-04 remain **INTEGRATION_BLOCKED**; audit **PARTIAL / OPEN**.


### 10.59 Agent B — both reference publications pass; Reveal construction now stops at Pool script evaluator — 2026-10-22

**Exact source:** 5208318cb6ed51875ae2bae53364486f57dcaa37. **Status:** publication/funding fixture gates passed in-memory; Reveal evaluation remains blocked.

#### Exact-head result

PRE-RICH Emulator Reveal Conformance [run #39726370402](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370402) completed failure after the fixture funding correction.

Fresh export metrics are unchanged from the source-equivalent validator version:
- PrizeValidator factory payload 15,977 B; parameterized 16,106 B; published reference transaction diagnostic CBOR 16,297 B under local maxTxSize 100,000.
- B1PrizePool factory payload 11,357 B; parameterized 11,513 B; publication transaction diagnostic CBOR 11,740 B on this exact run (the preceding run recorded 11,704 B; retain the current exact run's measurement and do not merge transaction-byte observations across fixture revisions).

The canonical test now completes, submits and awaits both PrizeValidator and B1PrizePool reference-script publications in the in-memory Emulator. The second publication is no longer blocked by insufficient input, confirming the additional ADA-only genesis UTxO fixes that fixture obstacle.

The canonical Reveal spending builder then fails during local Plutus evaluation with “Spend[1] attempted to instantiate a non-polymorphic term”. Spend[1] corresponds to the second spending input in the Reveal fixture, the B1PrizePool script. The negative input-binding twins also fail at build stage and remain INCONCLUSIVE_NOT_SUBMIT_REJECTION; no ledger-originated rejection is claimed.

The diagnostic-only size profile uses maxTxSize 100,000 and gets through both script-publication transactions, but Reveal completion then fails with “Blockfrost not set. Can't calculate ex units” after nativeUplc is disabled on the legacy Lucid builder. The final Reveal-spending CBOR and its embedded-script witness census therefore remain NOT MEASURED.

Companion [IMMORTAL Cardano Integration Lab #39726370427](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370427) was cancelled before providing native P2.8 acceptance; it contributes no current-head ledger proof.

#### Next diagnostic scope

Inspect the B1PrizePool Claim/Reveal value and singleton checks, using the exact evaluator error and existing historical probes to isolate the failing operation. Separate a Lucid/Scalus evaluator limitation from an on-chain validator predicate failure. Do not change the B1PrizePool or Reveal acceptance conditions, do not change V3, and do not substitute fabricated ExUnits or treat local emulator publication as Cardano-ledger acceptance. Any code change must have an explicit non-regression hypothesis and current-head tests.

**Current verdict:** both reference-script publication transactions pass only in-memory emulator setup; canonical Reveal spending construction FAILS in local evaluator at Spend[1]; final Reveal CBOR NOT MEASURED; native P2.8 NOT ESTABLISHED; Claim owner/signature equivalence NOT YET PROVEN; P-03/P-04 remain **INTEGRATION_BLOCKED**. No real Cardano ledger transaction was submitted. Overall audit **PARTIAL / OPEN**.


### 10.59 Agent B — latest completed size-fixture result: both reference publications pass; Reveal evaluator remains blocker — 2026-10-22

**Owner:** Agent B (P-03/P-04). **Status:** both publication transactions observed in the in-memory emulator; Reveal spend CBOR still not produced.

#### Exact evidence from the funding-corrected source

[PRE-RICH Emulator Reveal Conformance #39726370402](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370402), source SHA `5208318cb6ed51875ae2bae53364486f57dcaa37`, reached a new boundary:

- Fresh PrizeValidator factory payload: **15,977 B**; parameterized script: **16,106 B**.
- With the separate ADA-only funding UTxO on the wallet, the canonical profile completed and submitted both PrizeValidator and B1PrizePool reference-script publication transactions at active `maxTxSize=16,384`. After the first publication, the logged game-wallet UTxO had 289,812,455 lovelace; the subsequent Pool publication also completed/submitted. This is bounded in-memory emulator evidence, not Preprod or ledger-native publication evidence.
- The canonical Reveal-spending transaction then failed during legacy local UPLC evaluation: `Spend[1] attempted to instantiate a non-polymorphic term`. This happens before Reveal CBOR serialization/signing/submission. It is the primary next diagnostic blocker.
- In the separate size-probe profile (local maxTxSize 100,000, diagnostic-only), Prize publication CBOR measured **16,297 B** and Pool publication CBOR **11,740 B**. Reveal construction then failed with `Blockfrost not set. Can't calculate ex units`, because the legacy diagnostic path asks for a remote evaluator that is not configured. Neither diagnostic failure yields final Reveal-spend CBOR.
- The negative Reveal scenarios still report `INCONCLUSIVE_NOT_SUBMIT_REJECTION stage=build`; they have not established ledger-originated rejection.

#### Current exact-head fixture variant

The current branch contains the narrower, separate-publisher fixture in commit [`218f4f32b802a2f969e71f77ab9e7ad3afc478a4`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/218f4f32b802a2f969e71f77ab9e7ad3afc478a4), which gives the Prize and Pool reference publications independent 3,000,000-lovelace payer UTxOs instead of using the game wallet or its change. This avoids relying on a wallet's change output and bounds the emulator-only fees. Its exact-head [PRE-RICH Emulator Reveal #39726613822](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726613822) and [IMMORTAL Cardano Integration Lab #39726613781](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726613781) were still in setup as of this checkpoint update; the previous #39726370402 measurements belong only to source SHA 5208318….

#### Next acceptance step

The next useful step is no longer to optimize reference-script publication payload. The current parameterized script and two reference publications now fit within the emulator's serialization/size constraints. The next work must isolate the local CEK failure on the actual Reveal spending transaction without altering Reveal/V3 semantics, and must produce a final spending CBOR using an explicitly justified evaluator or bounded non-acceptance construction method. Do not treat `nativeUplc:false` plus missing Blockfrost as sizing evidence; do not fabricate ExUnits; do not raise the protocol maxTxSize.

**Current verdict:** in-memory reference publication: bounded PASS on SHA 5208318…; canonical Haskell Reveal evaluation: FAIL before final-CBOR serialization; diagnostic final Reveal CBOR: NOT MEASURED; native P2.8: NOT ESTABLISHED; P-03/P-04 remain **INTEGRATION_BLOCKED**; audit **PARTIAL / OPEN**. No production/preprod transaction was submitted.


### 10.60 Agent B — schedule isolated Pool Value evaluator diagnostic — 2026-10-22

**Owner:** Agent B (P-03/P-04). Status: diagnostic workflow step committed; exact-head run queued.

The exact-head emulator result in [run #39726370402](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370402) showed both reference-script publications completing and being confirmed in the in-memory Emulator after the second ADA-only fixture UTxO was added. Canonical Reveal construction then failed at local evaluation with “Spend[1] attempted to instantiate a non-polymorphic term”; the second spending input is the B1PrizePool script. Negative input-binding twins stop at build and remain INCONCLUSIVE_NOT_SUBMIT_REJECTION. The final Reveal CBOR was not emitted.

The separate size diagnostic sets nativeUplc:false, gets through both publications, but cannot complete Reveal because legacy Lucid requires a Blockfrost evaluator to calculate ExUnits and none is configured. This is a diagnostic capability gap, not evidence of script rejection or acceptance.

#### New narrowly-scoped workflow diagnostic

Commit [269240e0aa946136f6ad324785297f0ff286d50b](https://github.com/LiberoNuvola/Immortal-Protocol/commit/269240e0aa946136f6ad324785297f0ff286d50b) changes only .github/workflows/pre-rich-emulator-reveal.yml (blob 431c435bdae986a5d41e268eab58b29b64a76911). It adds a separate step setting P2_8_B1_POOL_VALUE_PROBE=1, P2_8_B1_BUDGET_PROBE=1 and P2_8_B1_SIZE_PROBE=1, labelled diagnostic-only with continue-on-error. The existing test code's Pool-only probe spends the Pool input with its reference script while deliberately omitting the Prize output; it is intended to distinguish a failure in singletonPoolTokenValid/valueOf from reaching the ordinary “no prize output” semantic rejection. It must never be treated as acceptance or ledger evidence.

The exact-head workflow [PRE-RICH Emulator Reveal #39727002870](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39727002870) was queued when this record was appended. The earlier source result is a distinct run and is not replaced by queueing this diagnostic.

**Next action:** inspect the exact run's Pool-only classification/error. If it identifies the existing evaluator fault, research the legacy evaluator/API and existing history before any validator change. Preserve the 16,384-byte protocol limit, existing acceptance predicates, V3 and Reveal semantics; do not supply fabricated ExUnits. Any candidate fix requires exact-head source tests and must keep the Claim owner/signature equivalence question open until explicit positive and negative Claim contexts are tested.

**Current verdict:** both reference publications pass only in-memory setup; canonical Reveal local evaluation remains FAILED at the B1PrizePool Spend[1] path; final Reveal CBOR NOT MEASURED; native P2.8 NOT ESTABLISHED; Claim owner/signature equivalence NOT YET PROVEN; P-03/P-04 remain INTEGRATION_BLOCKED. No real Cardano ledger transaction was submitted. Audit remains PARTIAL / OPEN.


### 10.60 Agent B — isolated-publisher funding input was underfunded; classify pre-build failure precisely — 2026-10-22

**Owner:** Agent B. **Status:** fixture hypothesis rejected by current-head evidence; replacement value not yet selected/validated.

[PRE-RICH Emulator Reveal Conformance #39726613822](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726613822), exact source SHA `218f4f32b802a2f969e71f77ab9e7ad3afc478a4`, completed `failure`. Fresh Plutus export, artifact binding and isolated emulator smoke passed, but all three profiles (canonical, diagnostic budget, diagnostic size) failed at `prize-reference-complete:start` with `InputsExhaustedError`. The isolated payer UTxO of 3,000,000 lovelace did not cover the builder's reference-script output/minimum-value plus fee requirements; this occurred before serialized publication CBOR or a size comparison existed.

Therefore this run does **not** show the independent publisher fix passed or failed the 16,384-byte limit. It establishes only that the fixture funding amount is insufficient for this library's reference-script-output requirements. The previously observed result remains the exact source `5208318...` run #39726370402: both reference publications completed in the in-memory Emulator, then the local Reveal evaluator failed at Spend[1] before final-CBOR serialization; its diagnostic route then failed because Blockfrost was not configured.

No validator or protocol limit was changed. Do not infer publication size from the `InputsExhaustedError` path. Next use an isolated publisher UTxO funded above the library's required output minimum and fee (derived/reported from the exact builder/PParams, not guessed), then re-run the canonical publication and final Reveal-size diagnostic. Since the Haskell V2 Claim candidate is included in the current Integration Lab, avoid touching its triggering source/workflow until that run reaches the Claim step or concludes, unless a blocker requires it.

**Current verdict:** current isolated-payer run: pre-build `InputsExhaustedError`, CBOR NOT PRODUCED; previous emulator run: both refs published, Haskell Reveal evaluator failed; final Reveal-spend CBOR NOT MEASURED; native P2.8 NOT ESTABLISHED; P-03/P-04 remain **INTEGRATION_BLOCKED**, overall audit **PARTIAL / OPEN**.


### 10.61 Agent B — reconcile isolated publication wallets with the Pool-only probe run — 2026-10-22

A source inspection after §10.60 found an intervening commit already present on the current test source: [218f4f32b802a2f969e71f77ab9e7ad3afc478a4](https://github.com/LiberoNuvola/Immortal-Protocol/commit/218f4f32b802a2f969e71f77ab9e7ad3afc478a4), “test(p2.8): isolate reference publication fee wallets”. This supersedes the simpler second-UTxO adjustment as the current intended fixture design. It:
- seeds a dedicated 3 ADA emulator UTxO for a PrizeValidator publication wallet;
- seeds a separate dedicated 3 ADA emulator UTxO for a B1PrizePool publication wallet;
- uses independent publisher wallets, separate from the game wallet and reference-script holder;
- selects those publisher wallets for the respective reference-script transactions, isolating near-limit publication fee/coin-selection from the game wallet.

The previous exact run [#39726370402](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726370402) on SHA 5208318... confirmed both publications after the additional ADA-only game-wallet input, but stopped at Reveal's Spend[1] evaluator failure. It did NOT test the isolated-publisher-wallet revision.

The later workflow/diagnostic commit [269240e0aa946136f6ad324785297f0ff286d50b](https://github.com/LiberoNuvola/Immortal-Protocol/commit/269240e0aa946136f6ad324785297f0ff286d50b) includes the publisher-wallet separation and adds the Pool-only evaluator probe step. Exact-head run [PRE-RICH Emulator Reveal #39727002870](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39727002870) is still IN_PROGRESS at Setup canonical Plutus CI at last inspection, with no new test/log evidence at the Reveal stage. Do not use it as evidence that the new wallet separation or Pool probe passed.

#### Status and next action

Historical handoff [SESSION-2026-09-22-7ed-HANDOFF.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/SESSION-2026-09-22-7ed-HANDOFF.md) already records a high-budget Pool-only probe as EVALUATOR_VALUE_FAILURE / NonConstrScrutinized at the B1PrizePool Value/valueOf path on its historical source snapshot. Current B1PrizePool source uses explicit AssocMap lookup inside assetAmount rather than the old valueOf call, so the historical root-cause label is supporting context only, not a current-source reproduction. The exact current Pool-only probe should establish whether the same evaluator issue persists on current compiled source; no production validator change is authorized by the historical note.

**Current verdict:** current publisher-wallet separation and Pool-only probe run pending/stalled in setup; no new evaluation evidence; both reference publications passed the prior in-memory run; canonical Reveal Spend[1] evaluator blocker remains; final Reveal CBOR NOT MEASURED; native P2.8 NOT ESTABLISHED; Claim owner/signature equivalence NOT PROVEN. P-03/P-04 remain INTEGRATION_BLOCKED, no real ledger transaction submitted, overall audit PARTIAL / OPEN.


### 10.61 Agent B — isolated Pool Value probe did not reach Plutus evaluation — 2026-10-22

**Owner:** Agent B (P-03/P-04). **Status:** probe run completed failure before reference publication; no CEK classification was produced.

The exact probe run [PRE-RICH Emulator Reveal #39727002870](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39727002870), source SHA `269240e0aa946136f6ad324785297f0ff286d50b`, completed failure. Its canonical, budget and size profiles all failed at `prize-reference-complete:start` with `InputsExhaustedError`; the size profile had local `maxTxSize=100000` but still failed before creating/serializing the publication transaction. The workflow's Pool-only diagnostic step has `continue-on-error`; that does not imply its probe reached `singletonPoolTokenValid/valueOf`. No `POOL_VALUE_PROBE` classification or Reveal CBOR/witness measurement was emitted.

This run adds no new evidence about the original `Spend[1] attempted to instantiate a non-polymorphic term`; that prior error was observed only in the 5208318… fixture after both references were published. It also does not prove the reference-script size bound: the isolated publisher was still funded with only 3,000,000 lovelace, insufficient for the ref-script output requirements/fee as observed in run #39726613822.

**Next action:** let current Integration Lab [#39726613781](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726613781), source SHA 218f4f32…, advance through Claim Haskell V2. After its Claim step/result is observed, correct the emulator fixture funding on the isolated publisher wallets using a value derived from the exact protocol's minimum-UTxO/output calculation plus fee margin; then rerun the distinct Pool-only probe. Do not infer ExUnits, script failure or ledger acceptance from `InputsExhaustedError`.

**Current verdict:** isolated Pool-only evaluation NOT REACHED; final Reveal-spending CBOR NOT MEASURED; native P2.8 NOT ESTABLISHED; Claim owner/signature result pending in Lab #39726613781. P-03/P-04 remain **INTEGRATION_BLOCKED**; overall audit **PARTIAL / OPEN**.


### 10.62 Agent B — publisher fee input exhaustion and updated Pool evaluator classification — 2026-10-22

**Evidence:** Pool-only diagnostic workflow run [#39727002870](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39727002870), source SHA 269240e0aa946136f6ad324785297f0ff286d50b, reached its newly added diagnostic step but failed before the diagnostic Pool branch could run. The size-probe profile logged a 16,106-byte parameterized PrizeValidator and then InputsExhaustedError at prize-reference-complete. The latest source already isolated the reference publisher wallets, but they each had only 3 ADA. An output carrying a 16KB script plus fee/change could consume more than that remainder can fund.

#### Test-only correction

Commit [fb1dec848505f67c922c722db708712a6744f581](https://github.com/LiberoNuvola/Immortal-Protocol/commit/fb1dec848505f67c922c722db708712a6744f581) changes only src/__tests__/immortal-cardano-reveal-emulator-b1.mjs (blob f052b44ca4782dd0513c6c27067df38fa34622cf):
- each dedicated emulator-only publisher UTxO is increased from 3 ADA to 10 ADA, so publication fee and valid change are covered without using the game wallet;
- the Pool-only diagnostic classification recognizes the current observed “attempted to instantiate a non-polymorphic term” evaluator error as an evaluator failure;
- the diagnostic label now names the current direct assetAmount/AssocMap lookup path rather than the old valueOf helper.

No production transaction builder, validator logic, V3/Reveal semantics, protocol size limit, or ledger state changed.

#### Exact-head validation

New workflow [PRE-RICH Emulator Reveal #39727481872](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39727481872) was queued on exact source SHA fb1dec848505f67c922c722db708712a6744f581. It must demonstrate that publication can be completed with the isolated 10 ADA fee source, then report what the Pool-only diagnostic actually sees. Do not infer success until the log has reached the diagnostic step and printed its classification.

**Current verdict:** current probe run #39727002870 did not reach Pool-only test due to publisher funding; fresh exact-head run #39727481872 pending; canonical Reveal still fails at local evaluator Spend[1] on the last completed main profile; final Reveal spending CBOR NOT MEASURED; native P2.8 NOT ESTABLISHED; Claim owner/signature equivalence NOT PROVEN. P-03/P-04 remain **INTEGRATION_BLOCKED**, no real transaction submitted, audit **PARTIAL / OPEN**.


### 10.62 Agent B — Haskell V2 Claim trace starts but transaction build is 27 bytes over limit — 2026-10-22

**Owner:** Agent B (P-03/P-04). **Status:** Claim semantic result INCONCLUSIVE; builder stops at size guard before signature or submission.

#### Exact run evidence

[IMMORTAL Cardano Integration Lab #39726613781](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39726613781), exact source SHA `218f4f32b802a2f969e71f77ab9e7ad3afc478a4`, ran steps through `Execute Haskell V2 Claim owner-signature conformance candidate`. The log confirms the runner selected `IMMORTAL_CLAIM_AIKEN_V3=0`, built the synthetic Revealed-state fixture and enumerated inputs for Prize, B1PrizePool, ticket NFT and both malformed/valid Oracle State references. Parameterization diagnostics gave 16,111 bytes for both legacy and Evolution serialized script variants, with different hashes/CBOR representations. Before it could execute the valid Claim or missing-owner-signature negative twin, Lucid Evolution `complete()` threw:

`TxBuilderError: Max transaction size of 16384 exceeded. Found: 16411`

This is **27 bytes over** and occurred before the transaction was signed/submitted. The Haskell V2 Claim step was configured `continue-on-error: true`; its GitHub step conclusion `success` is not an acceptance result. The actual log is a build/size failure, so no positive Claim or on-ledger negative Claim result is inferred. The parent Integration Lab run was later cancelled by a newer push; cancellation does not convert the candidate into a pass.

#### Consequence and next action

Claim owner/signature semantics remain **NOT PROVEN**. The current candidate's Claim transaction body/resource footprint must be inspected in a construction-only diagnostic that emits final CBOR and exact input/reference/witness counts without fabricating ExUnits or submitting an over-limit transaction. Any eventual remediation must fit within the unchanged 16,384-byte ceiling; do not loosen that guard. Only once the transaction is buildable within the protocol size limit can the positive Claim and `missing-owner-required-signer` negative twin meaningfully qualify the owner-signature optimization.

This result is separate from the Reveal blocker: the prior 16,782-byte observation belongs to PrizeValidator reference-script publication on an earlier source; on SHA 5208318… both reference publications pass the emulator, then Reveal local UPLC evaluation fails before final-CBOR serialization. The final Reveal-spending CBOR and native P2.8 packet are still NOT MEASURED/NOT ESTABLISHED.

**Current verdict:** Haskell V2 Claim build = FAIL at 16,411 / 16,384 bytes; Claim semantics = INCONCLUSIVE; Reveal final-spend CBOR = NOT MEASURED; P-03/P-04 remain **INTEGRATION_BLOCKED**; no Cardano Preprod/mainnet transaction submitted; overall audit **PARTIAL / OPEN**.


### 10.63 Agent A — Pyth deployment pin and source-byte EEV gate — 2026-10-22

This update closes two bounded evidence-integrity gaps. It does not connect Pyth to production `MintPolicy`, requalify or reapprove EEV, alter economic semantics, or submit a ledger transaction.

#### P-02 — pin the isolated probe to official Pyth Pro Preprod identity

- Added `scripts/pythPreprodConfig.mts` and `scripts/pythPreprodConfig.test.mts`. The runner now fails closed unless the supplied 56-hex policy ID is the published **Pyth Pro (formerly Lazer) Cardano Preprod** deployment ID `c7d51d897fdfceb7682f4a1a9ef428a027ec0582cadee158429f7e45`, and records the source URL in its evidence.
- Sources: [Pyth Pro contract addresses](https://docs.pyth.network/price-feeds/pro/contract-addresses) lists that ID specifically for Cardano Preprod; [Pyth Pro Cardano consumer guide](https://docs.pyth.network/price-feeds/pro/integrate-as-consumer/cardano) identifies feed ID **16** as ADA/USD and states that Pyth's withdraw script verifies signatures but does not itself enforce freshness.
- Test rejects alternate 56-hex policies and malformed identifiers. The synthetic identity test passed in run [39738882819](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39738882819); that workflow still failed in its TypeScript step due a malformed shell line continuation, which was corrected in commit [`a04ebd0150b193390e76a3c74636b31ea31524af`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/a04ebd0150b193390e76a3c74636b31ea31524af).
- Latest exact runner/build run [39739575067](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39739575067) completed **SUCCESS** on `a04ebd0150b193390e76a3c74636b31ea31524af`: the official policy-ID positive/negative guard, strict runner typecheck, Aiken source-boundary tests, Plutus V3 consumer build and pinned-artifact manifest all passed. This is source/type/build conformance only, not a Pyth signed-update ledger transaction.
- **Non-claims:** no signed update from Pyth was fetched in a manual native-ledger run here; no transaction was submitted; no Pyth value was consumed by production MintPolicy; feed 16 is ADA/USD, not ADA/USDM. The separate Pyth-native-ledger workflow remains manual-only.

#### P-01 — re-hash EV1–EV7 against current repository bytes in Issue readiness

- `audit/cardano-integration/preprod-first-issue-readiness.mjs` now checks each of EV1–EV7 against the exact expected source reference and SHA-256 of the referenced file bytes in the current checkout. Missing evidence, changed source bytes, wrong reference, malformed digest or missing source fail closed.
- Test `audit/cardano-integration/preprod-first-issue-readiness.test.mjs` now creates a valid fixture from exact current source bytes and then proves an altered EV2 digest blocks readiness even after the qualification JSON's own `evidenceHash` is recomputed.
- Exact [Issue Admission Boundary CI run 39739270131](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39739270131) on commit `d015feff85120cbce6136a6aa8eaf3dca68dc118` completed **SUCCESS**, including the new positive/negative readiness checks, signed-envelope verification and strict adapter typecheck.
- This validates the **preflight verifier and its test fixture**. It does not re-run EEV qualification on a live source-set, approve deployment, prove economic truth, or assert the historical approval artifact still matches the present candidate. The existing historical approval was produced by run [39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) on branch `main` at SHA `97b09a38742098f17a61eb07734c401aeedccc06`; no new approval was produced here.

#### Safety boundary and current front classification

| Front | Result from this slice |
|---|---|
| P-01 / EV integrity | **Readiness check strengthened; live EV1–EV7 requalification and deployment approval still BLOCKED** pending approved asset identity, current source-set and independent approval |
| P-02 / Pyth | **Probe identity pinned; static/Aiken build passed; typecheck rerun pending**; still ADA/USD probe only and not connected to MintPolicy |
| P-05 / B2 | **G2 remains PARTIAL**; declared-input containment does not classify all extra wallet/fee inputs or bind the complete transaction body |
| P-06 / expiry | **INTEGRATION_BLOCKED**; authorized origin of `issuedAt`/`expiresAt` not established on-chain |
| P-15 / asset perimeter | **Historical tUSDM candidate observed live; normative accounting mapping remains OPEN** |
| P-16 / first wallet Issue | **NOT ESTABLISHED**; no authorized signature, confirmed Issue transaction or independent post-state reconciliation |

No policy coefficient, freshness horizon, USDM conversion or USD parity assumption was introduced. V3 and Reveal semantics were not changed. No wallet signing, approval workflow, deployment or ledger transaction was performed by these changes.


### 10.64 Agent B — correct Pool Value probe context and distinguish size/evaluator findings — 2026-10-22

**Owner:** Agent B (P-03/P-04). **Status:** new bounded diagnostic running on exact current HEAD; no final Reveal CBOR yet.

#### Latest completed source/run evidence

[PRE-RICH Emulator Reveal Conformance #39738698776](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39738698776) ran source SHA `f4d66958631a0affe57fb3748f5e1045623c4a65` and concluded failure.

- On the canonical emulator profile, both reference-script publication transactions were built/signed/submitted to the **in-memory emulator**, and both `prize-reference-complete` and `pool-reference-complete` passed at configured `maxTxSize=16384`. This is bounded emulator fixture evidence only, not a Preprod/mainnet publication proof.
- The diagnostic profile (which overrides the size ceiling to 100,000 **only for diagnosis**) reported serialized publication transaction sizes: PrizeValidator **16,297 B** with parameterized script payload 16,106 B, and B1PrizePool **11,704 B** with parameterized script payload 11,513 B. These values describe each script's publication transaction, **not** the later Reveal-spending transaction.
- Canonical Reveal construction failed locally with `Spend[0] attempted to instantiate a non-polymorphic term` before the final Reveal CBOR was emitted. The final Reveal transaction size/reference-witness census remains **NOT MEASURED**.
- The previous Pool-only probe stopped with `B1PrizePool: exactly one decodable prize input required`. That is a malformed probe context: it had deliberately omitted the Prize input. The action-level trace shows the preceding pre-solvency, singleton-token Value lookup and own-Pool-input guards ran on that bounded input, but does not localize the failure in the complete Reveal transaction.
- The size diagnostic using legacy Lucid's `nativeUplc: false` then stopped with `Blockfrost not set. Can't calculate ex units`. This is a missing evaluator path, not an ExUnits measurement or ledger verdict. Do not fabricate ExUnits.

#### Narrow diagnostic changes on the current branch

- [Commit `62d46f648451ab3beb44d0d2c3fa122a99bc4d48`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/62d46f648451ab3beb44d0d2c3fa122a99bc4d48), test blob `7fa0a93f1423633e90f0418313110f101331cd72`, corrected the Pool probe's semantic-failure classifier.
- [Commit `4671302479ed56638dd99366bb9a43260b130f4e`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/4671302479ed56638dd99366bb9a43260b130f4e), test blob `dc16733a8eb6ffd4ada176d0183c25dbf7b80c4e`, strengthens the diagnostic context: adds a decodable Prize input and continuing output but intentionally omits its redeemer, so the builder evaluates only the B1PrizePool Plutus redeemer; supplies a deliberately mismatched Pool redeemer price so a successful early Value path should terminate at the expected Pool semantic guard. The invalid transaction is never signed or submitted.
- [Commit `2e73bb6a295c41a5c69b0308430311af23747015`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/2e73bb6a295c41a5c69b0308430311af23747015), test blob `23abb187017de6b2df87be224f385792401298a9`, fixes the diagnostic budget-overrun regex so the expected `Mem -n` / `CPU -n` form is recognized.

No validator, Reveal/V3 semantics, economic rules, production builder, workflow configuration or protocol size limit was changed.

#### Exact-head validation

- [PRE-RICH Emulator Reveal Conformance #39777010469](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777010469) is running on source SHA `2e73bb6a295c41a5c69b0308430311af23747015`. Its exact-head Reveal and Pool diagnostic outcomes are pending.
- [IMMORTAL Cardano Integration Lab #39777010375](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777010375) is in progress on the same SHA. It must be evaluated by individual execution steps; workflow startup does not establish native P2.8 acceptance.
- Documentation Link Check [#39777010290](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777010290) passed on this SHA.

#### Next action and exit criteria

1. Read the exact-head Pool Value probe classification. `EXPECTED_SEMANTIC_STOP_AFTER_VALUE_GUARDS` would show only that this emulator diagnostic reached the deliberately mismatched price guard, not transaction acceptance. An evaluator failure/budget overrun/unclassified failure remains bounded diagnostic failure.
2. Read the canonical Reveal error independently. Do not use a Pool-probe outcome to label the full Reveal error without a source/trace binding.
3. The final Reveal-spend CBOR and witness census are still required. `nativeUplc: false` is not viable here without a qualified evaluator, and no arbitrary ExUnits may be inserted to force serialization. A construction-only partial body, if used later, must be labelled as such and not mistaken for final CBOR or a size PASS.
4. Keep native Cardano-ledger P2.8 context and the exact tuple `tx.cbor + utxo.json + pparams.json + epoch-info.json + system-start.json + manifest.json` as the independent next acceptance gate.

**Current verdict:** reference-script publication = bounded in-memory emulator pass on the named fixture; canonical Reveal evaluator = FAIL before final-CBOR serialization; final Reveal-spending size/reference-witness status = NOT MEASURED; native P2.8 = NOT ESTABLISHED; P-03/P-04 remain **INTEGRATION_BLOCKED**. No Preprod/mainnet transaction was submitted by this Agent B step. Overall audit remains **PARTIAL / OPEN**.


### 10.65 Agent B — Pool Value guard isolation confirmed; Prize isolation result pending — 2026-10-22

**Owner:** Agent B (P-03/P-04 and related Cardano resource evidence). **Status:** Pool probe = `TESTED_BOUNDED`; full Reveal = `INTEGRATION_BLOCKED`; complementary Prize-only probe was added but has not reached its test step in the latest workflow run.

#### Exact completed probe result

In PRE-RICH Emulator Reveal Conformance [run #39777010469](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777010469), source SHA `2e73bb6a295c41a5c69b0308430311af23747015`, the revised Pool-only probe printed:

- `POOL_VALUE_PROBE EXPECTED_SEMANTIC_STOP_AFTER_VALUE_GUARDS`
- Error: `Spend[1] ... Trace B1PrizePool: reveal input price mismatch`

The test supplied a decodable Prize input and continuing output but deliberately set `TicketRevealed(priceUsdm + 1)`, did not supply a Prize redeemer, and did not sign or submit the diagnostic transaction. The Pool validator advanced through its preceding solvency/singleton-token-Value/Pool-input checks and reached the deliberately mismatched Prize-input price guard. This is bounded local evaluator evidence that the old Pool-only Value-path hypothesis is not reproduced on this current compiled path. It is **not** a passing complete Reveal, negative ledger rejection, or native P2.8 result.

The same run independently failed the canonical full Reveal at `Spend[0] attempted to instantiate a non-polymorphic term` before final Reveal CBOR serialization. This differs from the Pool-only probe's deliberately reached semantic stop at `Spend[1]`, so the next probe should isolate PrizeValidator rather than continue to modify the Pool diagnostic.

#### Complementary PrizeValidator isolation diagnostic

Commits [`cb9825d20cacdddca98d8a1cd6bf554287b0c2bf`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/cb9825d20cacdddca98d8a1cd6bf554287b0c2bf) and [`f008440cbc6673c82dd5e82c8b3ffec51d95edc6`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/f008440cbc6673c82dd5e82c8b3ffec51d95edc6) add a second diagnostic-only path:

- It spends the Prize UTxO with the canonical Reveal redeemer, keeps the Pool input/output as context without a Pool redeemer, and preserves both continuing datums.
- It calls legacy Lucid `.complete()` only. It never signs or submits. Its output explicitly scopes results to PrizeValidator local evaluation, not complete two-script Reveal acceptance.
- The test is designed to classify whether `Spend[0]` still errors when the Pool validator is not locally invoked. It does not alter either validator, the protocol rules, or the 16,384-byte limit.

Exact-head [PRE-RICH Emulator Reveal #39777906146](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777906146) is on SHA `f008440cbc6673c82dd5e82c8b3ffec51d95edc6`. At the latest read, its job had not progressed beyond `Setup canonical Plutus CI`; therefore the new Prize-only result is **PENDING**, not success/failure. No log evidence was emitted for the new diagnostic yet. Do not infer a result merely from the workflow's queued/in-progress status or from another diagnostic step marked green under `continue-on-error`.

#### Separate Claim resource result from the preceding Integration Lab

The exact-source [IMMORTAL Cardano Integration Lab #39777010375](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777010375), SHA `2e73bb6a295c41a5c69b0308430311af23747015`, later ended `cancelled`. Its Haskell V2 Claim owner-signature candidate reached transaction completion and logged `Max transaction size of 16384 exceeded. Found: 16411` (27 bytes over) before signature/submission. The workflow step conclusion `success` was only because the step has `continue-on-error: true`; the raw log contains the error. Claim owner/signature semantics remain **NOT PROVEN** and this is a separate resource blocker from Reveal.

#### Current verdict and next action

- Reference-script publication: bounded in-memory emulator pass; diagnostic publication sizes remain 16,297 B (PrizeValidator) and 11,704 B (B1PrizePool) on the exact fixture where logged. Those figures are not final Reveal spend size.
- Pool local Value/singleton guard path: `TESTED_BOUNDED` through the intentionally mismatched input-price guard.
- PrizeValidator local evaluator: **PENDING** current-head isolation probe.
- Canonical full Reveal: still fails at `Spend[0]` before final CBOR; size/reference-witness census **NOT MEASURED**.
- Legacy `nativeUplc: false` route remains unavailable for full construction because Blockfrost is not configured (`Can't calculate ex units`); do not fabricate ExUnits.
- Native Cardano-ledger P2.8 remains **NOT ESTABLISHED**; P-03/P-04 stay **INTEGRATION_BLOCKED**; Claim resource/owner-signature proof remains open.
- No Preprod/mainnet transaction was sent by these Agent B diagnostics. Overall audit remains **PARTIAL / OPEN**.

**Next action:** inspect [run #39777906146](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777906146) at the Prize-only step if it advances. In parallel, do not rerun the Pool-only probe unchanged; its bounded guard isolation has already been established. Any next Reveal-size work must emit an explicitly labelled construction-only result or final CBOR, without inventing ExUnits or treating a partial builder body as a final transaction.


### 10.66 Agent B — PrizeValidator local evaluator isolation reproduces Spend[0] crash — 2026-10-22

**Owner:** Agent B (P-03/P-04). **Status:** legacy local-evaluator failure isolated to PrizeValidator; no final Reveal CBOR; native P2.8 remains OPEN.

#### Exact-head evidence

PRE-RICH Emulator Reveal Conformance [run #39777906146](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777906146), exact source SHA `f008440cbc6673c82dd5e82c8b3ffec51d95edc6`, completed FAILURE.

1. The canonical Reveal path failed with `Spend[0] attempted to instantiate a non-polymorphic term` before signing/submission and before final spending-transaction CBOR was emitted.
2. The Pool-only path printed `POOL_VALUE_PROBE EXPECTED_SEMANTIC_STOP_AFTER_VALUE_GUARDS`; its deliberate redeemer price mismatch was reached after the preceding Pool Value/singleton checks. This result is bounded, local-emulator diagnostic evidence only.
3. The new complementary Prize-only path printed `PRIZE_VALIDATOR_PROBE PRIZE_EVALUATOR_FAILURE`, with the same `Spend[0] attempted to instantiate a non-polymorphic term`. Its transaction retained the real fixture Pool input/output as context but supplied no Pool redeemer, so only the PrizeValidator was selected for local evaluation. The diagnostic never signed/submitted the candidate.

This localizes the observed compatibility/runtime fault to the legacy `lucid-cardano@0.10.11` local UPLC evaluation of the current compiled PrizeValidator fixture; it does **not** prove that Cardano-ledger/Yaci would reject the transaction. The Pool-only probe does not reproduce the same fault before its deliberate semantic stop. No inference is made that the Pool validator is fully correct from that bounded probe.

#### Remaining serialization boundary

- Both reference-script publication transactions continued to fit and complete in the in-memory emulator under the diagnostic size ceiling: PrizeValidator publication 16,297 B; B1PrizePool publication 11,704 B. These are publication transactions, not final Reveal spend size.
- With `P2_8_B1_SIZE_PROBE=1`, legacy `nativeUplc:false` still cannot complete the full transaction because no Blockfrost evaluator is configured: `Blockfrost not set. Can't calculate ex units`. Therefore final Reveal spending CBOR, embedded script witness counts, reference-input census and final total size remain **NOT MEASURED**. Do not fabricate ExUnits and do not classify the diagnostic step's `continue-on-error` conclusion as acceptance.
- The step does not submit a transaction. No production validator or economic semantics, V3 carrier, maximum transaction-size parameter or production builder was changed.

#### Route decision and next action

The repository already contains `audit/cardano-integration/reveal-ledger-trace.ts`, an Evolution Lucid + Yaci path that binds the two reference-script publication transactions, serializes the built Reveal CBOR, runs `assertRevealUsesReferenceScripts`, asks Yaci to evaluate that exact CBOR for ExUnits and emits `revealDiag` records. The current `immortal-cardano-lab.yml` no longer calls this script; it runs the isolated Aiken V3 Reveal candidate path instead. Before adding another harness or changing any validator, determine whether this existing trace can be executed under the current Lab bootstrap in its canonical Haskell mode (`IMMORTAL_REVEAL_AIKEN_V3` unset/false), without changing V3 semantics or deploying/submitting to Preprod. If the trace is already runnable from the current environment, use the existing exact script rather than creating a parallel builder. Its local Yaci transaction would still be a devnet trace, not a real Preprod transaction, and must be labelled accordingly.

**Current verdict:** Pool local Value path = `TESTED_BOUNDED` through the deliberate semantic stop; Prize local evaluator = `PRIZE_EVALUATOR_FAILURE`; canonical Haskell V2 Reveal = local evaluator failure before final CBOR; final Reveal size/reference-witness binding = **NOT MEASURED**; native P2.8 = **NOT ESTABLISHED**; P-03/P-04 remain **INTEGRATION_BLOCKED**. Overall audit remains **PARTIAL / OPEN**.


### 10.67 Agent B — active Aiken V3 economic transitions pass local Yaci through Expire; P2.8 pending — 2026-10-22

**Owner:** Agent B (P-03/P-04). **Status:** bounded local-Yaci transition trace passed through Expire; Claim and native P2.8 stages remain in progress.

#### Exact current Integration Lab evidence

[IMMORTAL Cardano Integration Lab #39777884299](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777884299) runs exact source SHA `cb9825d20cacdddca98d8a1cd6bf554287b0c2bf`; current checked-out workflow is `.github/workflows/immortal-cardano-lab.yml` blob `be7013485ebe67dd94ddc776fd38607b18fbc4d1`. The job has passed these completed steps with effective step conclusion `success`:

- Step 24 — isolated Aiken V3 Reveal loss/win and negative ledger twins.
- Step 25 — local Cardano ledger smoke transaction.
- Step 27 — V3 carrier against native Cardano ledger. This is a separate component; this run has not changed the carrier.
- Step 28 — Aiken V3 Reveal native-ledger preflight.
- Step 29 — active Aiken V3 economic Reveal transition trace.
- Step 30 — FundTreasury canonical Oracle valuation trace.
- Step 31 — TicketIssued 500× solvency-boundary trace.
- Step 32 — Aiken V3 economic Expire transition trace.

Step 29 executes the existing `audit/cardano-integration/reveal-ledger-trace.ts` with `IMMORTAL_REVEAL_AIKEN_V3=1`, using Lucid Evolution and local Yaci rather than the legacy `lucid-cardano@0.10.11` local UPLC evaluator. The trace contains final-CBOR reference-script assertions, Yaci evaluator ExUnit measurement/coverage, active protocol size/ExUnit checks, transaction submission, observed continuing outputs and replay rejection. This run’s step conclusion `success` is the bounded integration result for that local candidate trace.

#### Explicit scope / non-claims

This success must not be re-labelled as a production Haskell V2 PrizeValidator pass, a Cardano Preprod transaction, a production Issue, or unconditional universal/V3 equivalence:

- The candidate in step 29 is the isolated Aiken Plutus V3 Prize validator plus the existing parameterized B1PrizePool Plutus V2 validator. The production migration is still not authorized.
- The harness is local Yaci Conway/devnet with synthetic test state, deterministic beacon/player secrets, an identity-only fixture Oracle State, and a 1:1 test-liquidity asset. The trace explicitly records `productionOracleQualified=false` and that canonical production `Economic.poolUsdmValue` is not evaluated by the fixture valuation.
- The step-24 isolated candidate test uses a test-only always-true Pool stub; its PASS must remain separate from step 29’s active trace with the real Haskell B1PrizePool V2 validator.
- No Preprod/mainnet transaction or deployment was performed by this Lab run.

#### Remaining current-run gates

At the checkpoint update, step 33 `Execute real economic Claim transition trace` was in progress. Step 37 `Materialize raw Yaci ledger context for P2.8` and step 38 `Run native Yaci UTxO decoder conformance` were still pending, as was step 39 `Run P2.8 ledger evidence gate against this lab packet`. Therefore **P2.8 remains OPEN** until the exact Reveal transaction/context packet passes the current-source native Cardano-ledger runner. Do not infer its result from step 29’s success.

This provides a viable Evolution/Yaci path around the legacy PrizeValidator local-evaluator error for the isolated Aiken candidate, but does not erase the separate observed legacy Haskell V2 local evaluator failure at `Spend[0]` recorded in §10.66. No V3 carrier, Reveal economic semantics, protocol constants, or production validator source changed.

**Current verdict:** active candidate Reveal + FundTreasury/TicketIssued/Expire = `TESTED_BOUNDED` on local Yaci; economic Claim = `IN_PROGRESS`; native P2.8 = `PENDING`; Haskell V2 legacy emulator evaluator path remains `PRIZE_EVALUATOR_FAILURE`; P-03/P-04 remain **INTEGRATION-BLOCKED** pending complete evidence and current-head ledger evaluation. Overall audit remains **PARTIAL / OPEN**.


### 10.68 Agent B — Aiken V3 Claim passes local Yaci; P2.8 context materialized; native decoder in progress — 2026-10-22

**Owner:** Agent B (P-04). **Status:** local candidate lifecycle trace passed through Claim; native decoder active; Cardano-ledger evaluation pending.

Current run [IMMORTAL Cardano Integration Lab #39777884299](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777884299), source SHA `cb9825d20cacdddca98d8a1cd6bf554287b0c2bf), has reached these completed steps:

- Step 33 — `Execute real economic Claim transition trace`: completed with effective conclusion `success` on the configured Aiken V3 candidate route and local Yaci.
- Step 37 — `Materialize raw Yaci ledger context for P2.8`: `success`. The materializer binds the exact `reveal-tx.cbor` bytes to `reveal-transition.json` and Yaci's observed transaction metadata/consumed inputs, then writes raw UTxO, protocol parameter, epoch-info and system-start evidence files.
- Step 38 — `Run native Yaci UTxO decoder conformance`: still `in_progress` at this checkpoint snapshot.
- Step 39 — `Run P2.8 ledger evidence gate against this lab packet`: still `pending`.

Step 35, `Execute Haskell V2 Claim owner-signature conformance candidate`, has also completed at the workflow step-summary level. Because it is explicitly `continue-on-error: true`, its displayed effective `success` is not enough to infer owner-signature acceptance; the raw job log must classify whether it built within the size bound and where the negative twins were rejected. The prior exact-source run #39777010375 logged 16,411 bytes (>16,384) in this Haskell V2 Claim path; this new run's diagnostic remains to be read.

#### Scope and interpretation

The successful Aiken V3 Claim trace is a local-Yaci candidate run, not proof of production Claim authority/settlement or a real user's Issue. The P2.8 context materialization success confirms the fixture's raw packet was extracted and linked; it does not mean the native Cardano-ledger evaluator passed. The current active decoder and next ledger gate must use the exact packet on this exact run, not substitute another transaction or a synthetic context.

**Current verdict:** candidate Aiken V3 Reveal/FundTreasury/TicketIssued/Expire/Claim = `TESTED_BOUNDED` on local Yaci; P2.8 raw materializer = `PASS`; native UTxO decoder = `IN_PROGRESS`; native Cardano-ledger evidence gate = `PENDING`; Haskell V2 Claim owner/signature classification = `PENDING_RAW_LOG_REVIEW`. Production migration remains unauthorized; P-03/P-04 overall remain **INTEGRATION-BLOCKED** until the exact native ledger gate and other requirements are satisfied. Overall audit remains **PARTIAL / OPEN**.


### 10.69 Agent B — static preflight risk: native Yaci UTxO decoder does not currently accept reference-script bodies — 2026-10-22

**Owner:** Agent B (P-04). **Classification:** STATIC RISK / NOT YET CONFIRMED BY CURRENT P2.8 GATE. This note does not replace the live step outcome.

#### Exact source facts

- Current decoder `audit/cardano-ledger-runner/YaciUTxO.hs` blob `1fae63fa61186a92ca14f46f3ba1b61132275c07`, pinned Conway ledger API source family in `audit/cardano-ledger-runner/cabal.project` blob `d47821bea92205a15af3fd2de3d8c4e3a49cc2c6`.
- In `parseInput`, the current code rejects a UTxO carrying both `reference_script_hash` and `script_ref` with `REFERENCE_SCRIPT_BODY_UNSUPPORTED`; if only the hash is present it rejects with `REFERENCE_SCRIPT_BODY_MISSING`. When no reference script exists, it constructs `BabbageTxOut addr maryValue datum SNothing`.
- The isolated executable `yaci-utxo-test` is sourced from `TestYaciUTxO.hs` blob `1fea1724909aa27e372fd1e42170ccd76766e653`; its primary fixture has `script_ref: null` and `reference_script_hash: null`. Therefore a test-suite PASS alone would not show that script-bearing reference inputs from the current P2.8 packet decode as typed Conway UTxOs.
- The current P2.8 materializer `audit/cardano-integration/materialize-p28-ledger-context.mjs` blob `4978257d28f2104c5fc9b96a9b37f2f0ba4a4816` preserves the Yaci transaction's raw input records (plus an address-hex field), and the Conway runner is expected to construct the consumed UTxO set from this packet. Since the final Reveal uses two reference-script inputs, those real input records may exercise exactly this unsupported branch.

This is a **falsifiable static risk**, not yet the observed current-run failure: the current Integration Lab [#39777884299](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777884299) still shows step 38 `Run native Yaci UTxO decoder conformance` as `in_progress`, and step 39 `Run P2.8 ledger evidence gate against this lab packet` as `pending`. We have not received the raw output of step 39, so do not claim it failed or that P2.8 is blocked specifically by this reason yet.

#### Next action after the current run yields a result

1. Read the actual step 38/39 log and the packet’s exact `utxo.json`/manifest from the uploaded lab artifact after the run completes.
2. If step 39 confirms `REFERENCE_SCRIPT_BODY_UNSUPPORTED` / `REFERENCE_SCRIPT_BODY_MISSING` on the actual reference-script inputs, implement a narrowly scoped native decoder for exact Yaci `script_ref` type/body on Conway, preserving Plutus V2/V3 language and bytes, checking the declared hash, and storing a typed `StrictMaybe (Script ConwayEra)` in the `BabbageTxOut` instead of silently using `SNothing`. Add regression fixtures for both a script-bearing reference input and a no-script input, including wrong/missing hash and unsupported script type rejection.
3. Do not modify `audit/cardano-ledger-runner/**` until this run finishes; the active Integration Lab watches that path and could be cancelled by a new code push. After a confirmed failure, rerun the exact-current workflow only after the patch is narrowly implemented and reviewable.

**Current verdict:** materializer step 37 = PASS; decoder step 38 = IN PROGRESS; P2.8 native ledger gate step 39 = PENDING. Decoder incompatibility is a **static risk pending live confirmation**, not a declared failure. P-04 remains **INTEGRATION-BLOCKED** until exact current-packet native Cardano-ledger evaluation closes. Overall audit remains **PARTIAL / OPEN**.


### 10.70 Agent B — P2.8 native typed context decoded; ledger evaluation returns two non-Plutus failures — 2026-10-22

**Owner:** Agent B (P-04). **Source/run:** [IMMORTAL Cardano Integration Lab #39777884299](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39777884299), source SHA `cb9825d20cacdddca98d8a1cd6bf554287b0c2bf`. **Final workflow conclusion:** failure.

#### P2.8 exact packet result

The completed job log establishes:

- Step 37, raw Yaci context materialization: PASS.
- Step 38, native Yaci UTxO decoder conformance: PASS. This directly resolves the static risk in §10.69 for this packet; do not continue to label reference-script decoding as an unconfirmed blocker.
- Step 39, P2.8 ledger evidence gate: the runner accepted the exact run/commit/manifest/transaction/time/CBOR bindings and decoded the transaction, consumed UTxOs, PParams, EpochInfo and SystemStart into native Conway Ledger types.
- The ledger evaluation completed against the bound packet, with 2 redeemer entries, 0 successes, 2 failures, 0 Plutus execution failures, 0 ledger-context failures and 2 “other ledger failures”. The runner emitted `RESULT: LEDGER_ALIGNED_EVALUATION_FAILURE` and an explicit typed failure report. Thus step 39's workflow step is green because the gate successfully produced/classified its evidence packet; **the Reveal transaction itself did not pass ledger evaluation**.
- Raw evidence directory reports `tx.cbor` 32,147 bytes and `reveal-transition.json` 22,914 bytes as materialized artifacts; those are packet-file sizes, not the Cardano serialized transaction size. The current exact packet is linked by the run's manifest and evaluation binding.

This is a useful advance: P2.8 is no longer blocked on inability to decode script-bearing reference UTxOs or on missing raw context. The remaining blocker is the specific two-redeemer typed ledger failure. Before any code change, inspect `ledger-evaluation-report.json` and the per-redeemer JSON from the exact artifact to classify each failure (spending vs reference/other ledger conditions) and tie it to the exact input/redeemer. Do not infer a Plutus validator rejection: the log explicitly reports zero Plutus execution failures.

#### Separate predeploy structural failure

Step 45, predeploy structural gate, failed for a separate compilation defect in `export/IssueAdmission.hs` around line 175: `A.eitherDecode =<< BL.getContents` has type `BL.ByteString -> Either String ...`, while the bind expects an IO action. The compiler expected `BL.ByteString -> IO (Either ...)` and found `BL.ByteString -> Either String (Either ...)`. This is a concrete Haskell IO/decoder integration mismatch, not a protocol/economic decision. It blocked `cabal build exe:issue-admission`; do not conflate it with P2.8 or change Issue semantics to address it.

#### Scope / next actions

1. Retrieve the exact artifact for run #39777884299 and read the full ledger evaluation report/per-redeemer JSON; classify the two failures without changing protocol code first.
2. Fix the `IssueAdmission.hs` input-decoding IO mismatch narrowly in the implementation branch that owns this executable, then run its direct build/test and the exact current predeploy gate.
3. Keep the historical legacy Haskell V2 Claim path separate: its earlier builder failed at 16,411 bytes (27 over the ledger maximum) before submission. The current run's green step 35 is `continue-on-error`-wrapped and is not proof that Haskell V2 Claim passed size or owner-signature evaluation.
4. No change to V3 carrier, Reveal semantics, economic rules, protocol limits, production deployment or ledger state is authorized by these results.

**Current verdict:** raw P2.8 packet = materialized; native decoder = PASS; exact native typed context = decoded; ledger evaluation = COMPLETED / FAILED (2 other ledger failures, 0 Plutus execution failures); predeploy structure = FAILED at `IssueAdmission.hs:175`; P-04 remains **INTEGRATION-BLOCKED** pending per-redeemer classification and closure of separate predeploy blocker. Overall audit remains **PARTIAL / OPEN**.



### 10.71 Agent A — EEV qualification and deployment approval required at Issue provider boundary — 2026-10-22

**Owner:** Agent A (P-01/P-16 Issue admission boundary). **Classification:** fail-closed input-contract hardening; no change to normative economics or protocol transitions.

#### Finding and narrow correction

At the current branch before this fix, `relayer/preprodIssueAdmissionProvider.js` rejected a wrong EEV `profileVersion` only when the field was present. An observation with a missing `eevQualification`, missing `deploymentApproval`, missing status, or missing profile did not fail at this provider's own qualification check. The deeper default signed-authority path validates approval and signature/digest bindings, but the provider boundary itself did not express the complete required precondition; injected authority-source functions could expose that gap.

The provider now fails closed unless all three conditions are explicit:
- EEV qualification `status === qualified`;
- nested deployment approval `status === DEPLOYMENT_APPROVED`;
- approval profile `PRE-RICH-EEV-USDM-DIRECT-V1`.

Commits: [provider guard `436072c5`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/436072c5413c153741883b85558d74cf40b74cdb) · [regression cases `bd520121`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/bd520121e086bff865d07ca86779847c527f5cad).

#### Verification and limits

[Issue Admission Boundary CI #39825094344](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39825094344) completed **SUCCESS** on exact source SHA `bd520121e086bff865d07ca86779847c527f5cad`. The provider test now exercises missing qualification, unqualified status, absent approval, pending approval and wrong-profile cases using a local synthetic Lucid fixture. This is source/test evidence only, not a live EEV certificate or a ledger Issue.

This new guard does **not** replace the signed authority's cryptographic signature/digest validation, prove current EV1–EV7 against live Preprod bytes, create `DEPLOYMENT_APPROVED`, or close the missing authoritative R1/Kc certificate. The source does not choose a policy for USD/USDM, quote freshness, additional transaction inputs or ticket expiry. P-01/P-16 remain **BLOCKED** pending authoritative current EEV evidence and the remaining issue-admission/ledger requirements.

No branch was created; no wallet action or transaction was submitted; no V3/Reveal semantics, economic constants, or normative decision was changed. Overall audit remains **PARTIAL / OPEN**.

## 10.18 — B3 upstream GRANDPA verifier triangulation (2026-10-22)

**Classification:** coordination/research update only. Non-normative. No B3 closure, runtime-semantic change, branch creation, merge, or deployment is authorized by this entry.

### Upstream source inspected

- Detailed compatibility review on B3 branch: [B3-A-ORYNQ-GRANDPA-COMPATIBILITY-REVIEW-2026-10-22.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/B3-A-ORYNQ-GRANDPA-COMPATIBILITY-REVIEW-2026-10-22.md) (B3 branch commit `2980eca0be16b3337727f8fdafb61e480aa660d2`).
- `Flux-Point-Studios/orynq-sdk` commit `90fc397111a98b2d6fe47771e82003cdcaa429d5` (merge PR #141; 2026-10-22 10:19:47 UTC), especially `packages/anchors-midnight/src/grandpa.ts`.
- Related commits: `4f78fa4206e14492e54de5fcde5b4901c7ad716a` (documents cross-chain/set-ID trust assumption), `0f7cc83caceedc5ab7f91eca2ed2687a376e4188` (equivocation signatures and lowest precommit), `f33c39f203c8cb34a7a1d7830f59678552e570db` (set-start and cross-chain equivocation handling).
- Materios upstream commits reviewed previously: `bc1465d85e033001bc86175b85d60f2e5c353413` (no-secret-keys launch preflight), `ff6bac7cee17259c95b3a4960487419d66384415` (genesis committee guard), `f1217d7b9e4942a0e7f4283cc0dce74cbac89877` (Ariadne/follower epoch rule), and `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` (sccache CI policy).
- Current B3 source contract remains `poc/materios-grandpa/test/MATERIOS-AUTHORITY-SELECTION-PROOF-CONTRACT.md`; extraction path remains `poc/materios-checkpoint/src/capture-finalized.ts`.

### Findings

1. **Reusable, not drop-in.** Orynq's `justifiedTarget` and `verifyFinality` provide valuable adversarial test patterns: valid equivocation handling, signed precommit distinctions, set-change boundaries, ancestry continuity, exact response-count checks and bounded work. The implementation is explicitly `anchors-midnight`; its `SET_LENGTH = 300`, checkpoint assumptions and `DEFAULT_MAX_SET_CHANGES = 2016` are Midnight-specific. Do not copy these constants or its set-transition assumptions into Materios.
2. **Cross-chain replay is a real trust boundary.** GRANDPA signatures bind round and set ID, not chain ID/genesis. A mathematically valid justification is not by itself proof that it belongs to Materios. The upstream verifier documents a trust assumption that honest keys do not sign under the same set ID on another chain. B3 must make the relevant Materios genesis/chain identity and authority-history trust anchor explicit, and must not silently claim publisher-independent cross-chain identity from GRANDPA signatures alone.
3. **Authority provenance remains open.** Materios preflight/genesis checks improve the assurance of a launched chain but do not retroactively prove a historical transition. The advertised authority set must be bound to a trusted checkpoint and verified transition history; the runtime authority-selection proof remains a separate authenticated-execution concern.
4. **Current capture is transport, not proof.** `capture-finalized.ts` explicitly extracts the node's finalized head, header, state root, runtime code/version, authority list/set ID and attempts `grandpa_proveFinality`. It labels finality proof verification, authority-set transition proof, runtime execution proof and source reproducibility as open. A successful capture or WebSocket probe is not finality evidence.
5. **B3 remains fail-closed.** The existing checkpoint records the latest B3 P2P probe as failing due to unavailable raw GRANDPA justification, consistent with fail-closed behavior. Do not rerun the same endpoint without a changed source/peer/archive condition and do not upgrade a capability probe into a finality result.

### Next actions — Agent C

- Compare Orynq's verifier logic and adversarial tests against the existing Materios PoC without importing Midnight-specific constants or trust assumptions.
- Add/confirm explicit regression cases for: same keys and set IDs across distinct genesis/chain identities; wrong checkpoint/genesis; invalid or relabelled set-change block; equivocation signatures; malformed/oversized ancestry; mismatched RPC response counts; and finality proof target differing from the requested block.
- Keep the two-stage contract: authenticated finality/authority/ancestry first, then StateRoot → exact storage key/value. Keep B3-C execution/runtime identity and runtime-source correspondence separate.
- Do not claim a complete trustless fix for chain identity unless a protocol-level authenticated identity binding is demonstrated; otherwise record the remaining trust assumption explicitly.
- Preserve PR #35 as draft and keep Workflow B/JEV results classified by exact commit, run and evidence type.

**Status after this update:** upstream verifier research advanced; B3-A/B/C remain OPEN. No Materios finality proof was independently verified by this update.


### 10.72 Agent A — historical EEV approval is not reproducible against its recorded workflow commit — 2026-10-22

**Owner:** Agent A (P-01/P-16 readiness). **Classification:** provenance audit; no approval/deployment/ledger action.

#### Exact source-identity comparison

Inspected the historical EEV artifact bundle from workflow run [39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679). Its approval metadata records workflow commit `97b09a38742098f17a61eb07734c401aeedccc06` on `main`, with approval reference `github-actions:environment/PREPROD-EEV-APPROVAL/run/39552468679`. I compared the seven EV source paths declared by the current readiness gate at the current `work/immortal-green-closure` branch with the exact recorded workflow commit.

| Evidence | Current green blob | Exists at recorded approval commit? | Result |
|---|---|---|---|
| EV1 — EEV contract | `292a2adb4137209f02e5a55477a5eef676d974e9` | Yes; same blob | Path identity matches |
| EV2 — `DirectUsdmEev.ts` | `10616024e007cf9a18707047e89e84990cfc093b` | **No (404)** | Cannot reproduce from recorded commit |
| EV3 — direct-USDM source-set producer | `9cf28d31bf72e0aea6c077538e97e7399ed0d04b` | **No (404)** | Cannot reproduce from recorded commit |
| EV4 — EEV conversion tests | `3bfcce27425c04f91ee80b9326fa8a0d165490ee` | **No (404)** | Cannot reproduce from recorded commit |
| EV5 — exact Pool binding tests | `2acbf841c4318fdf7bc502f715129b06e8623079` | **No (404)** | Cannot reproduce from recorded commit |
| EV6 — OMEGA completeness contract | `1543ee6b0de15f491eddb872fb6f7d6df7a5f7f3` | Yes; same blob | Path identity matches |
| EV7 — accounting partition certification | `9ebe7c55fb5de26aa9c8e1d0f17e466c91855c3e` | Yes; same blob | Path identity matches |

The four missing-path results are exact content-API 404 responses for the recorded approval commit, not merely different blob hashes. Therefore the historical approval artifact cannot be treated as reproducible evidence that EV1–EV7 were sourced from the current green implementations. This does not by itself prove the economic calculation is false; it proves the claimed source provenance does not join across the approval commit and current implementation.

The current readiness script now hashes the actual EV1–EV7 file bytes and requires equality with each qualification artifact digest. Its existing synthetic regression demonstrates fail-closed behavior for a changed EV2 digest, but that fixture is not a run against the historical approval bundle or a fresh live qualification.

#### Consequence / next gate

- **P-01 remains BLOCKED; P-16 remains NOT ISSUED.** Do not reuse the historical `DEPLOYMENT_APPROVED` artifact as current approval or claim the readiness gate is satisfied.
- Required sequence: materialize a new source-set from a live, exact Pool UTxO; generate a fresh EV1–EV7 qualification against the current reviewed source bytes; then obtain a new separately authorized approval bound to that exact qualification/source-set/deployment/Oracle State and workflow commit. Revalidate the Pool UTxO again at admission. This checkpoint does not invoke the approval workflow or manufacture any certificate.
- The physical `tUSDM` candidate still does not by itself close the normative canonical-USDM/valuation decision. No USD/USDM parity, freshness threshold, expiry policy or additional-input rule is inferred here.
- No branch was created; no wallet action, transaction, approval workflow, V3/Reveal semantic change, or normative decision occurred.

**Status:** provenance mismatch concretely confirmed; fresh live evidence and governed re-approval remain outstanding. Overall audit remains **PARTIAL / OPEN**.


## 10.19 — Materios GRANDPA bootstrap trust-boundary audit (2026-10-22)

Direct comparison completed against the existing Materios GRANDPA verifier and Orynq's upstream adversarial test suite. Detailed evidence: [B3-A Orynq GRANDPA Compatibility Review](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/B3-A-ORYNQ-GRANDPA-COMPATIBILITY-REVIEW-2026-10-22.md) (updated commit `7739836e30e1ab210d05f75ab56164af49857b71`).

**Confirmed:** the verifier checks checkpoint chain ID/genesis against the supplied authority state, exact justification target, signatures, distinct signers, authority membership, weighted quorum, and optional ancestry. The capture client explicitly treats RPC output and raw finality bytes as untrusted transport evidence.

**New blocker to close:** `TrustedAuthorityState` is currently a structural TypeScript interface; `validateAuthorityState` validates shape, not provenance. The transition function can carry forward an authenticated trust chain only if its initial `current` state was genuinely authenticated. The genesis hash + initial set id + authority list bootstrap must therefore be independently anchored and all creation call sites audited. A configured `chain_id` string or compile-time type is not sufficient evidence of chain identity.

**Next actions (B3 branch):**
1. Enumerate every creation/call site for `TrustedAuthorityState` and trace whether it can receive RPC/caller-supplied data.
2. Specify and implement the authenticated Materios bootstrap boundary without changing consensus semantics.
3. Add fail-closed tests for arbitrary/unverified initial authority state, cross-chain reused keys/set IDs, wrong genesis, stale checkpoint, and transition gaps.
4. Differentially map Orynq tests to Materios tests; adapt only protocol-general cases, not Midnight's 300-block set-length assumptions.
5. Run the relevant verifier test suite and record exact command, commit SHA, and output before changing status.

**Status remains OPEN:** B3-A is not closed until bootstrap provenance and real Materios finality material are verified. B3-B exact storage inclusion and B3-C execution proof remain separate and open. No deployment/on-chain transaction; PR #35 remains draft; V3/Reveal semantics untouched.


## 10.18 P2.8 Reveal size — Aiken candidate vs canonical production path (2026-10-22)

**Classification:** diagnostic/checkpoint clarification only. This section does not authorize a validator switch, change Reveal semantics, change the V3 carrier, or relax Cardano's 16,384-byte transaction limit.

### Finding confirmed from workflow source

The current `.github/workflows/pre-rich-emulator-reveal.yml` on `work/immortal-green-closure` runs `cabal run exe:export-scripts`, then copies fresh artifacts from `plutus/out/` into `src/plutusScripts/` before invoking `src/__tests__/immortal-cardano-reveal-emulator-b1.mjs`. The canonical test therefore consumes freshly exported Haskell/Plutus artifacts, not the isolated Aiken prototype. Relevant source:
- [Reveal conformance workflow](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/pre-rich-emulator-reveal.yml)
- [Haskell PrizeValidator](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/PrizeValidator.hs)
- [Aiken parity workflow](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/aiken-reveal-parity.yml)
- [Aiken prototype README and acceptance gates](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/poc/aiken-reveal-parity/README.md)

### Evidence distinction

- The latest canonical fixture measurement reported a parameterized Haskell `PrizeValidator` of **16,688 bytes**, already **304 bytes above** the 16,384-byte transaction ceiling before transaction-envelope overhead. The diagnostic publication transaction measured **16,879 bytes** with the local diagnostic size limit raised; it was not an accepted ledger transaction. The complete final Reveal-spend transaction measurement remains open for this current fixture.
- The isolated Aiken Reveal candidate has previously measured **5,502 bytes** of compiled script and passed a local Yaci publication (5,809-byte transaction) and integrated Reveal fixture (1,245-byte transaction) using an Aiken **Plutus V3** PrizeValidator reference script plus the real parameterized Haskell **Plutus V2** B1PrizePool validator. These are candidate-path results, not canonical Haskell V2 results or production evidence.
- The Aiken package explicitly targets Plutus V3; the canonical production Haskell validator targets Plutus V2. The parity harness is marked isolated/not deployable and its own measurement report says full transaction size, CPU/memory, and native-ledger acceptance are not established by the compiled-script lower-bound report. V2/V3 compatibility and full behavior/state-effect equivalence remain open.
- Therefore, the earlier Aiken work did **not** silently fix the current canonical Haskell artifact. It demonstrated a potentially much smaller alternative path, but it has not met the acceptance gates required to replace the canonical validator.

### Next actions — no duplicate run without a new hypothesis

1. Keep the canonical Haskell V2 failure visible and retain the 16,384-byte ceiling. Do not change V3 carrier or Reveal/economic semantics.
2. Continue only in the isolated Aiken candidate lane: finish the integrated negative twin with the real B1PrizePool validator, broaden canonical Haskell/Aiken differential checks over decisions and state effects, and complete the V2-to-V3 target-ledger compatibility review.
3. Measure final signed CBOR for publication and positive/negative Reveal transactions, plus CPU/memory against authoritative protocol limits, on the exact candidate SHA. A script-byte lower bound or synthetic fixture alone is insufficient.
4. Only after all gates pass, make a separately reviewed migration decision and then bind the accepted candidate into a dedicated deployment/conformance workflow. Do not redirect the current canonical workflow prematurely.
5. Keep the current probe and canonical Reveal run as separate evidence records: a failure while publishing the reference script is not a measurement of the final Reveal spend transaction.

## 10.20 — Integrated Aiken Reveal wrong-secret twin: source audit (2026-10-22)

**Agent B source audit; no ledger result inferred.** Re-read the current branch implementation rather than repeating the old “add the negative twin” task.

### What is already implemented

- `audit/cardano-integration/reveal-ledger-trace.ts` selects the isolated Aiken Plutus V3 Prize validator only when `IMMORTAL_REVEAL_AIKEN_V3=1`, then parameterizes and hash-binds the real B1PrizePool Plutus V2 validator to that Aiken Prize hash.
- The same trace builds and submits a wrong-secret twin using the same Prize and Pool UTxOs and the two bound reference scripts. It does this before the valid Reveal consumes those UTxOs.
- The negative twin uses the positive transaction's ExUnits only to construct the adversarial transaction. It checks the active `maxTxSize`, calls `submit()`, classifies the rejection as validator/ledger-related, and checks that both original inputs remain unspent.
- `.github/workflows/immortal-cardano-lab.yml` runs this trace with `IMMORTAL_REVEAL_AIKEN_V3=1` in both the Reveal preflight and active Reveal trace steps. The separate `aiken-reveal-ledger-probe.ts` still uses a test-only pool stub and must not be mistaken for the real-pool negative twin.

### Current classification

- **Implementation:** present in source; do not add a duplicate negative-twin implementation.
- **Runtime evidence:** OPEN until a successful run of the exact current branch/commit is inspected and its `audit/yaci-evidence/reveal-transition.json` / JEV registry artifacts confirm the wrong-secret submission reached Yaci and was rejected for validator execution.
- **Scope:** synthetic local Yaci fixture only. This does not close Haskell/Aiken equivalence, V2/V3 compatibility, production USDM/EEV qualification, CPU/memory qualification, or the canonical Haskell 16,384-byte blocker.
- **Protected invariants:** no change to the Haskell validator, existing V3 carrier, Reveal/economic semantics, transaction-size ceiling, branches, or production deployment.

### Next action

Inspect the latest `IMMORTAL Cardano Integration Lab` run on `work/immortal-green-closure` and its exact commit. If it predates the integrated-negative implementation or lacks a run on the current commit, run the existing workflow once; do not create a new probe or rerun the obsolete Haskell size probe. If it fails, classify the exact failing stage from the artifact/log before editing code. Do not declare this gate GREEN from source inspection alone.



## 10.20 — B3-A identity regressions committed, unexecuted (2026-10-22)

Agent C added two fail-closed tests to `poc/materios-grandpa/test/verifier.test.ts` on `work/b3-materios-provenance-evidence`: mismatched genesis (`e1d1042e545c96ac456ef3d6476bc1d674e2c4fa`) and mismatched chain label (`b2930473e73a6edfe947b0480306dd2d79f27645`). Full review at [B3-A GRANDPA Compatibility Review](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/B3-A-ORYNQ-GRANDPA-COMPATIBILITY-REVIEW-2026-10-22.md), commit `6a1eb3884b82042a0ad6b268890fba10d3f7a3bd`.

**Evidence class:** regression source committed, test run NOT OBSERVED. These tests exercise existing mismatch guards under a synthetic crypto stub; they do not authenticate the initial authority state, prevent cross-chain replay if both checkpoint and trusted state are adversary-controlled, or establish live Materios finality. B3-A/B/C remain OPEN. Next: run exact-SHA test/build/typecheck, audit runtime bootstrap creation, obtain independently authenticated genesis/set provenance. No deployment; PR #35 draft; V3/Reveal untouched.


## 10.21 — B3 bootstrap call-site audit: no authenticated initial authority source wired (2026-10-22)

Agent C audited the exact B3 branch source/call paths and updated the [B3-A GRANDPA compatibility review](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/B3-A-ORYNQ-GRANDPA-COMPATIBILITY-REVIEW-2026-10-22.md).

### Confirmed call paths

- `verifyFinality` accepts caller-supplied `TrustedAuthorityState`; validation checks structure, not provenance.
- `verifyMateriosFinalityAgainstTransition` receives `currentTrusted` from its caller and cannot authenticate its origin.
- Transition state construction checks a transition against the current state, but does not authenticate the initial state.
- The transition proof verifier is an injected dependency; no production verifier is currently wired. Synthetic accepting stubs in tests are not cryptographic evidence.
- Checkpoint capture and RPC code explicitly carry untrusted evidence; neither provides a verified genesis-to-authority bootstrap.

### Decision

Do not add a nominal runtime brand or constructor without an actual independently authenticated source: it would falsely imply trust. No in-repository operational constructor was found that authenticates the tuple `(Materios genesis hash, initial GRANDPA set ID, initial authority list)` together. This remains an explicit external trust assumption and a blocker to permissionless B3-A qualification.

### Gate status

- B3 source/call-site audit: complete for audited files.
- Initial authenticated bootstrap: **OPEN / BLOCKER**.
- Production authority-transition proof verifier: **OPEN / BLOCKER**.
- Identity regression tests: source committed, execution not yet observed.
- B3-A/B/C remain OPEN. No deployment or on-chain transaction; PR #35 remains draft; V3/Reveal untouched.
- Do not mark GREEN until a real bootstrap source/verifier is implemented and `npm test`, `npm run build`, and `npm run typecheck` pass on the exact candidate SHA.


## 10.22 — B3 bootstrap route refined: reproduce genesis, then verify forward (2026-10-22)

Agent C found published Materios v6 discovery inputs: chain ID `materios_preprod_v6`, reported genesis hash `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`, hosted raw chain spec [chain-spec-v6-raw.json](https://materios.fluxpointstudios.com/releases/chain-spec-v6-raw.json), and Cardano genesis UTxO `13313ea0119e0c4330f64f1809159064a371a1bbf2050b1fe13d5492280dca50#0`. Official operator references: [SPO onboarding](https://docs.fluxpointstudios.com/materios-partner-chain/spo-onboarding), [node requirements](https://docs.fluxpointstudios.com/materios-partner-chain/node-requirements).

These public docs and hosted bytes are **discovery sources only**; no independent chain-spec hash/reconstruction was performed and the initial authority list/set ID remain unverified.

### Recommended route

1. Download the exact raw chain spec and obtain its full checksum; verify the downloaded bytes independently.
2. Reconstruct the genesis trie/header with the pinned Substrate SDK and recompute the genesis hash; compare against the independently reviewed/pinned expected identity.
3. Extract/decode `pallet_grandpa::Authorities` from the reconstructed genesis state (or verify a storage proof against the recomputed genesis state root), binding chain ID + genesis hash + initial set ID + authority list as one bootstrap object.
4. Verify real GRANDPA finality and every authority transition forward; then compose with the existing canonical runtime/authority-selection execution proof.
5. Add reproducibility and adversarial tests for changed chain spec, wrong hash, altered authority bytes, wrong set ID and cross-chain mismatch.

This is a concrete trust-minimized route, not trustless-from-nothing: the intended genesis identity still needs an explicit independently reviewed software/configuration trust anchor, unless a verified Cardano-enforced bootstrap commitment is implemented. Neither authenticated bootstrap route is currently implemented in the audited path.

Report updated at [B3-A GRANDPA review](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/B3-A-ORYNQ-GRANDPA-COMPATIBILITY-REVIEW-2026-10-22.md), commit [`cab075e8`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/cab075e84b105633005ac2769ee515a4c961fd78).

**Status unchanged:** authenticated bootstrap OPEN/BLOCKER; production transition proof verifier OPEN/BLOCKER; identity tests committed but not run; B3-A/B/C OPEN. No deploy or on-chain tx; PR #35 draft; V3/Reveal untouched.


### 10.23 — B3-A source/release artifact triangulation (2026-10-22)

Follow-up verified the hosted Materios release index reports `chain-spec-v6-raw.json` at 1,063,592 bytes, while public repository `Flux-Point-Studios/materios` commit `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` contains `chain-spec/chain-spec-raw.json` at 614,373 bytes. These are not interchangeable without a provenance/derivation proof. The repo's `.fluxpoint-spec-lock.json` SHA-256 (`4328b0ee893357524ad91c5f2dfc0c962ba8dcfa92e239fb061b8c903161926d`) is not the hosted release checksum. Official docs expose only truncated checksum `77877aa6…65aaa`; available fetch tools cannot retrieve the exact bytes of `SHA256SUMS` due content-type rejection, and text extraction is not byte-preserving. No hash or genesis reconstruction claimed.

**B3 status remains unchanged:** bootstrap OPEN/BLOCKER; production transition proof verifier OPEN/BLOCKER; identity regressions committed but not run; B3-A/B/C OPEN. Next step: fetch exact hosted release bytes on a byte-preserving runner, verify full SHA256SUMS entry, archive bytes/digest/provenance, then independently reconstruct genesis with pinned Substrate SDK and extract initial GRANDPA authorities/set ID. No deployment/transaction; PR #35 remains draft; V3/Reveal untouched. Full findings: [B3-A GRANDPA review](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/B3-A-ORYNQ-GRANDPA-COMPATIBILITY-REVIEW-2026-10-22.md).


### 10.24 — Byte-preserving B3-A acquisition script prepared (2026-10-22)

Added `scripts/b3/fetch-materios-genesis-artifacts.sh` plus `docs/research/B3-A-MATERIOS-GENESIS-ARTIFACT-ACQUISITION.md` on `work/b3-materios-provenance-evidence`. Script commit `192389b5b9dd955b7a8b015ec8fecbeae1d9e7c1`; instructions commit `8babab0577bb8a2c0c2ec7a81f6723c0d04bc100`. It downloads the exact release manifest and JSON with curl, requires a single full SHA-256 entry for the exact filename, hashes downloaded bytes, fails closed on mismatch and preserves evidence on failure. It is **prepared but not executed** because this environment's web fetchers cannot retrieve the raw manifest. No digest/genesis/GRANDPA authority proof claimed. Publisher manifest and JSON share a host, so manifest match alone is not independent authenticity. Bootstrap remains OPEN/BLOCKER. No tests/deploy/transaction; V3/Reveal untouched.

See [acquisition procedure](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/B3-A-MATERIOS-GENESIS-ARTIFACT-ACQUISITION.md) and [B3-A review](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/B3-A-ORYNQ-GRANDPA-COMPATIBILITY-REVIEW-2026-10-22.md).


### 10.25 — Agent C parallel-front dispatch and evidence refresh (2026-10-24)

**Classification:** coordination/evidence refresh; no normative decision, deployment, wallet action, or ledger transaction. V3/Reveal semantics and economic rules were not modified.

#### Source and branch identity observed

- Canonical checkpoint read immediately before this append: blob `08797a29780deb2306cab029726b4c621bc92f44`; this append is conditional on that exact blob to avoid overwriting another agent's update.
- B3 workflow run [#39933665986](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986) ran at source commit `11fae8a1f030bcbe98eab6ee2ae99a96f080ca6` on `work/b3-materios-provenance-evidence` (run metadata/artifacts bind the branch and SHA).
- Workflow B / contribution PR [#35](https://github.com/LiberoNuvola/Immortal-Protocol/pull/35) is OPEN + DRAFT, base `main` at `97b09a38742098f17a61eb07734c401aeedccc06`, head `merge/workflow-b-closed-main` at `7bca8d91b65d7af1261d8b7cc4f28f496a73fcba`; the reviewed diff has 14 paths. Mergeable metadata is not approval.
- Current file/blob reads performed on the named B3 and green refs are recorded below by blob SHA. The available branch-search response returns branch names but not commit tips; do not mislabel a file blob SHA as a branch HEAD. The last B3 workflow head is an exact run source, not a guarantee that the branch has not advanced since. The Notion Aegis page's HEAD (`87a34c42ee76c0ca6beef3f74db0833488838014`, 2026-10-12) is historical, not a verified current tip.

#### C1–C4 — Materios proofs and Workflow B

| ID | Status | Evidence and limit | Next concrete action |
|---|---|---|---|
| C1 / P-09 B3-A | **BLOCKED** | Run [#39933665986](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986), source `11fae8a1...`: verifier job PASS; real-witness job FAIL. Log reports both public endpoints return JSON-RPC `-32601 method-not-found` for `grandpa_proveFinality`, `justificationsKind=null`, then `NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_DENSE_SCAN`. Artifact [12493185719](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986/artifacts/12493185719), digest `sha256:1254dc6a2425c4339be35f722118d4d8b925e30be205403ad77b730dc280ac72`, records the failed acquisition; it is not a finality proof. | Execute the already-prepared byte-preserving genesis artifact acquisition only on a runner with access to the exact release bytes/manifest; verify chain spec/genesis/initial authority provenance before any trust bootstrap. No repeated identical public RPC scan. |
| C2 / P-10 B3-B | **PARTIAL** | In the same run, `live-storage-proof` job passed capture, typecheck and native Rust verification; artifact [12492463295](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986/artifacts/12492463295), digest `sha256:2c78c35352fdce044049cbe50a000702ae1705b6430f26a61dcb02e4e825c26a`. This is scoped storage-proof evidence only; it does not authenticate the historical StateRoot through B3-A finality. | Inspect/preserve the artifact's exact block hash, `proof.at`, StateRoot, key/value and native-verifier output; add any missing mismatched-root/key/value/block negative fixtures only after checking current tests. |
| C3 / P-11 B3-C | **BLOCKED** | Upstream Materios `partnerchain/node/src/rpc.rs` was previously checked at current upstream source and has no registered `materios_b3_calculateCommitteeProof` or standard GRANDPA RPC assembly. The B3 handoff file blob on the B3 branch is `1d1646fbf1e37ae44b3ba2c876fe391f1e2072f9`; it explicitly describes a proposed, NOT-APPLIED upstream patch. | Recheck only new upstream commits/PRs or a newly identified endpoint; otherwise prepare a minimal exact source diff and evidence request for upstream, without reimplementing the authority selector in TypeScript. |
| C4 / P-12 Workflow B | **PARTIAL** | PR #35 remains DRAFT, base/head as above. Its 14-path diff includes contribution-gate workflows, templates/docs, a model harness and a V3 mint-policy source change; the PR description states the governance gate is a draft/bootstrap and requires separate human review. CI harness evidence is not cryptographic B3 proof or repository-policy enforcement. | Keep draft. Reconcile trusted-base preflight and actual target-branch rules; record required approvals/status checks and exact-head results before any promotion discussion. |

#### C5–C15 — independent workstreams

| ID | Status | Evidence observed | Next action / acceptance gap |
|---|---|---|---|
| C5 / U-08 JEV | **INCONCLUSIVE** | Current green-ref workflow file blob `3f22c38f17426872b33068137c59919ef73192fe`, `.github/workflows/jev-materios-live-ingress.yml`, is triggered by `workflow_dispatch` only. It records observation metadata and uploads a registry, but explicitly does not verify GRANDPA, storage proofs or canonicality. | Inspect actual run history and registry artifacts; no unattended-autonomy claim until a subsequent scheduled cycle consumes the latest result without a user message. |
| C6.1 / U-01 universal definitions | **PARTIAL** | Green-ref blobs: `IMMORTAL/kernel/UniversalEconomicKernel.hs` = `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785`; `IMMORTAL/state/UniversalEconomicState.hs` = `f89fe04c8aad8ca9c5e544fa9c145a38d157826f`; `EconomicGate.hs` = `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127`. The concrete kernel currently exposes ProtectedCapital, RawSurplus, non-negative-state and solvency predicates; this does not instantiate a certified `K_c`. | Complete the normative-definition → implementation → projection → test map; classify each property as proved, tested, or open. |
| C6.2 / U-02 universal/application boundary | **BLOCKED** | The state type says application-specific ticket classes, activation policy, Jackpot lifecycle and payout tables are absent; the consumer/call graph has not been proven complete in this dispatch. | Finish consumer/call-site inventory and classify every field/type before any extraction. |
| C6.3 / U-03 infinite-horizon viability | **BLOCKED** | Certification spec blob `32b54c73f6676467d197e8f6635155e4752cc17e` explicitly says full R1 discharge requires profile instantiation `(S,A,Accept,Ω,T,Safe)` and a decision procedure for `S ∈ K_c`. | Write the profile-specific proof obligation/counterexample plan; no certificate claim from finite tests. |
| C6.4 / U-04 Reference Adapter | **PARTIAL** | `Adapter/REFERENCE/docs/CONFORMANCE-METHODOLOGY.md` blob `5ef77e7ac0791130a28fc36eb5d420c86d6b4fb1` is DRAFT / OPEN DECISION; it specifies deterministic fixtures and comparison after every transition. Existing Cardano conformance test blob `68d9f9613a56ffe86a35e2c05c86667ed0da26a9` describes synthetic/executable adapter evidence, not live ledger proof. | Inventory fixture schema and current vectors; propose missing versioning/error taxonomy without declaring the draft normative. |
| C6.5 / U-05 multi-adapter | **PARTIAL** | Adapter README/research lists multiple adapters and distinct trust assumptions; no equal-vector second-adapter certification was established here. | Build a trust-model/readiness matrix and select no new implementation until U-04 vectors and candidate trust assumptions are reviewable. |
| C7 / U-09 public observability | **PARTIAL** | Transparency contract blob `c97d67341677e5e04f757bea7b1e3c8931017606` requires authoritative declaration, explicit trust mode, evidence reference/time/freshness, and fail-closed handling. Contract existence does not prove live UI/API binding. | Trace UI/API fields to actual declaration/observation sources and add fail-closed regressions for missing, stale and mismatched evidence. |
| C8 / U-10 paper claims | **BLOCKED** | No fresh complete claim-to-evidence/release snapshot was established in this dispatch; prior checkpoint classifies Paper Tranche 1 as not ready. | Inventory each claim against exact source/test/run/artifact and retain limitations; do not submit until existing gates pass. |
| C9 / U-12 Strategy Explorer | **NOT RUN** | No current-head execution of the candidate-generation → canonical-kernel verification → safe-decline path was observed in this dispatch. | Inspect existing implementation and tests; run focused cases only after exact source/run availability is established. AI remains untrusted and non-normative. |
| C10 / U-13 fee sponsorship | **NOT RUN** | No fresh measured cost vectors or wallet-signing/atomicity evidence were produced. | Inventory existing studies; separate network fee, protocol fee and locked ADA; mark simulated values as simulated. |
| C11 / U-14 Beacon 4 | **PARTIAL** | Research-only lane; no approved quorum/attestation format or independent-source correlation evidence was demonstrated. | Document source independence/conflict assumptions; no deployment and no replacement for B3. |
| C12 / U-15 IMMORTAL V5 public surface | **PARTIAL** | Ecosystem entry-point doc blob `c9a2e86298c569f0c22fdfde151e229462f797c8` separates protocol, adapter, application and execution environment, and disclaims production certification. Live site/DApp conformance was not tested. | Compare current public assets/routes and UI copy against the canonical contract; report precise discrepancies. |
| C13 / U-16 CAROB THREE | **BLOCKED** | No current repository-level evidence was retrieved to establish whether referenced material is code in this repository, an external project, or conceptual linkage. | Locate authoritative project/repository references and record the boundary without merging rules or state. |
| C14 / U-17 artifact reuse | **PARTIAL** | No exact-current-head fingerprint regression run was executed in this dispatch. Existing workflow/CI evidence cannot by itself prove all reuse paths are keyed to exact source/toolchain fingerprints. | Trace cache/artifact keys and add a mismatch regression; require exact fingerprint before reuse. |
| C15 / P-14 Aegis/hardening | **PARTIAL** | Notion work program reports the 2026-10-12 branch snapshot as historical and states the Python mirror/Haskell kernel and Aegis differential hypothesis had not yet been proven at that time. Current hardening branch tip was not returned by branch search; no fresh branch test was run. | Re-read current branch files/HEAD in an environment exposing ref tips; run mirror-vs-Haskell vectors and label Aegis comparisons as synthetic until the real validator boundary is exercised. |

#### Execution limits and shared constraints

- The runner environment used for this review cannot clone/fetch GitHub through its local shell (DNS/network unavailable). GitHub connector reads and existing CI logs/artifacts were used instead; no claim of a local test execution is made.
- The branch-search connector returned branch names but not their commit SHAs. Known exact refs above are workflow/PR-bound SHAs; source blob SHAs are explicitly identified as blobs, not commit tips.
- No code patch or new workflow dispatch was performed by this review. No transaction, deployment, merge, rebase, cherry-pick, or branch creation/deletion occurred.
- Global states remain OPEN where proof/decision criteria are unmet. Next priority order: (1) byte-preserving Materios genesis artifact acquisition + authenticated bootstrap; (2) inspect B3-B artifact's exact block/root/key/value independently; (3) verify JEV run sequence/registry and schedule dependency; (4) complete U-02 consumer map and U-04 fixture inventory; (5) build the U-10 claim-to-evidence matrix; (6) exact-head refresh for Aegis and artifact reuse.



## 10.25 — Agent B live refresh: Yaci/Lucid, Treasury Observer, credentials and swap path (2026-10-24)

**Classification:** operational evidence refresh; coordination only. No economic rules, V3/Reveal semantics, scripts, validators, ledger state, branch topology or deployment configuration were changed by this section.

### A. Exact run / branch / PR state

- Repository: `LiberoNuvola/Immortal-Protocol`.
- PR #36: [Treasury read-only observer](https://github.com/LiberoNuvola/Immortal-Protocol/pull/36), OPEN / DRAFT, base `main` at `97b09a38742098f17a61eb07734c401aeedccc06`, head `review/treasury-readonly-observer` at `f46e118dd76e0752e26e0fa46ce85404aae2847b`.
- Integration Lab run [#40064065979](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40064065979), run number 2113, completed **failure** on that exact head. The diagnostic shell correction worked: unlike run #40042037100, curl reached the endpoint.
- Step summary: fresh Haskell/Plutus artifact generation PASS; Yaci startup/readiness PASS; devnet smoke transaction PASS; cost-model probe PASS; evaluation endpoint diagnostic completed (diagnostic-only); V3 carrier provider evaluation FAILED; Reveal, FundTreasury, Expire, raw P2.8 materialization and downstream native gates SKIPPED. Step 20's green conclusion is not compatibility evidence because it is `continue-on-error: true`.
- Same-SHA sibling runs [Protocol Declaration Conformance #40064065980](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40064065980) and [Algorithmic Governability #40064065989](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40064065989) completed successfully for their own scopes; they do not close B1 provider integration.
- Evidence artifact [immortal-cardano-lab-evidence, ID 12549495517](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40064065979/artifacts/12549495517), size 10,919 bytes, digest `sha256:5712d6c207013bf275a475e1743fee1d56d3dc5b9b26f5c89fb0106c0d23213b`, not expired at observation time.
- The workflow declares `concurrency.group=-github-workflows-immortal-cardano-lab-yml-${{ github.ref }}` and `cancel-in-progress: true`. Do not dispatch or rerun while another same-ref lab run is active; re-check concurrency immediately before any future dispatch.

### B. Yaci / Lucid provider diagnosis

- The endpoint diagnostic sends `POST http://localhost:8080/api/v1/utils/txs/evaluate`, `Content-Type: application/cbor`, body `{}`.
- Observed result at 2026-10-24T05:17:26Z: HTTP 400, curl exit 0, 86-byte JSON response, keys `status_code,error,message`, response `{"status_code":400,"error":"Bad Request","message":"Invalid Hexadecimal Character: {"}`.
- Classification: **diagnostic only**. The empty payload is not a valid CBOR transaction; this response establishes endpoint reachability and a parser complaint, not the valid transaction request/response contract.
- Yaci startup log explicitly reports `Yaci Store tx evaluator mode: ogmios`; Ogmios starts at the local configured endpoint. Therefore the effective evaluator mode is observed, not inferred from docs.
- The cost-model probe passed and confirmed the expected vector shape/lengths for its bounded check (including Plutus V2 length 332). This proves protocol-parameter and cost-model retrieval, not provider evaluation.
- V3 step fails in `@lucid-evolution/provider/dist/index.js:529` while handling `evaluate`: `TypeError: Cannot use 'in' operator to search for 'EvaluationResult' in undefined`; Lucid wraps it as `EvaluatorError`, evaluator `provider`. The stack identifies an undefined provider-returned object; it does not yet reveal whether the endpoint route, request encoding, response content type/schema, or Ogmios-backed evaluator response causes it.
- `localUPLCEval: false` does not bypass provider evaluation. No exunits fabricated; no evaluator bypass; no V3 or Reveal source changes.
- Next diagnostic should use a genuine unsigned transaction CBOR already built in the local devnet trace and call the exact endpoint with the expected body encoding. In parallel, inspect the installed `@lucid-evolution/provider` 0.6.x implementation and compare required route, headers, CBOR representation, response JSON schema and error handling. Keep request/response fixtures non-secret and bounded. First use a read-only source/log inspection; run a new workflow only after checking current run status/concurrency and declaring a new falsifiable diagnostic hypothesis.

### C. B2 workflow reliability

- Run #2113 verifies Haskell/Plutus export, Yaci persistence until steps execute, HTTP readiness, local-ledger smoke and artifact upload. It does not verify V3 provider evaluation or Reveal because the V3 step fails before those consumers.
- The previously broken diagnostic shell continuation is corrected on `f46e118dd76e0752e26e0fa46ce85404aae2847b`; this run proves the diagnostic now reaches Yaci and returns a bounded response.
- Yaci CLI lifecycle workaround remains in place: no `yaci-devkit info` or version invocation while the node is running. Readiness is via HTTP endpoint.
- Redaction currently targets `ed25519e_sk[[:alnum:]]+` before log stdout and in-place before artifact upload. This is only a single token-format pattern; it is not a complete credential-format audit. The run output/artifact must still be reviewed for seeds, JSON wallet files, alternate secret encodings and accidental environment dumps.

### D. Credential/artifact incident

- Historical run [#40006508503](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40006508503) still has an unexpired `immortal-cardano-lab-evidence` artifact, ID `12525975775`, 23,459 bytes, digest `sha256:8c0e65a9f45d5e50e3379049eb028decab989d41177b8d8b0ee05cbc44e511c8`.
- Prior log review identified ephemeral devnet signing-key material. Treat that credential as compromised and never reproduce it. Available connector actions do not expose artifact deletion/retention mutation, so removal or access restriction is **OWNER ACTION REQUIRED**.
- Perimeter evidence so far is consistent with ephemeral local-Yaci/devnet test-wallet material; the inspected logs do not establish exposure of a user wallet/Preprod signing key. This is not proof that the key was never reused. Repository owner must confirm the wallet derivation source and non-reuse, rotate/revoke any reusable material if applicable, inspect all historic artifacts/logs, and remove/restrict the compromised artifact where supported.
- Required hardening test: synthetic fixtures for every known secret representation (including the exact ephemeral key serialization observed, without using real values), asserting redaction before stdout and artifact creation. Add negative tests that scan prepared artifacts for seed phrases, secret-key prefixes, known wallet JSON field names, and raw seed/private-key files. Do not claim the current regex closes this gate.

### E. Treasury read-only observer

- PR #36 remains OPEN / DRAFT. Its workflow is manual, has `permissions: contents: read`, uses GitHub environment `DEMETER`, Koios Preprod and does not contain sign/submit/bootstrap calls. **It was not dispatched.**
- Observer script derives the Plutus V2 script hash and address from `src/plutusScripts/treasury.plutus.json`, hashes the source artifact, compares the derived address to `PREPROD_TREASURY_ADDRESS`, optionally cross-checks `PREPROD_TREASURY_SCRIPT_HASH`, requests `POST /address_utxos`, validates returned address rows, aggregates lovelace and configured canonical tUSDM atomic quantity, and hashes the evidence object.
- Gaps from static inspection: no explicit request timeout/retry/rate-limit classification; no chain slot/tip field in the observation (only runner `observedAt`); asset row shape assumes `asset_list` entries contain `policy_id`, `asset_name`, and `quantity`; output is one timestamped observation without an independent reproducibility comparison. Add bounded timeout + explicit HTTP/network failure classification, capture provider tip/slot (or mark unavailable), validate transaction hashes/indices/quantities/assets before BigInt aggregation, and add synthetic schema tests before promoting it.
- The environment variable `DEMETER / vars.VITE_TREASURY_ADDRESS` cannot be read through the available connector. Therefore configured address to derived address matching is **BLOCKED — EXTERNAL**. Owner must independently compare the value against the exact deployment artifact/release and report only match/mismatch (do not disclose secrets). Do not run the observer until that gate is satisfied.
- The script correctly states `authorizedReleaseProven=false`, `canonicalTreasuryDeploymentProven=false`, `liquidationRouteVerified=false`, `swapExecuted=false`, `qneProven=false`. It must not be presented as EEV or PrizePool evidence.

### F. Preprod / bootstrap / evidence classes

- `audit/pre-genesis-genesis/derive-preprod-treasury-address.mts` sets `verifiedOnLedger:false` and `ledgerReference:null`; it derives an address from a local artifact via a local endpoint. It is **local derivation**, not a Preprod Treasury UTxO observation.
- `audit/cardano-integration/preprod-real-reveal.mjs` contains hardcoded fixture-like economic/oracle constants and, when supplied with the Preprod seed and invoked, signs/submits bootstrap and reference-script publication transactions and then a Reveal unless the deploy-only path stops before Reveal. This workflow/script was not run as part of this audit. It must remain outside the allowed execution path absent a separate explicit operational authorization.
- Local Yaci smoke transaction proves local devnet transaction acceptance only. It does not establish Preprod deployment or canonical Treasury identity.
- Historical EEV approval artifact remains bound to its historical source ref/time; it does not authorize a current Issue and does not prove an actual user Ticket NFT was minted.

### G. Treasury swap / liquidation path

- Targeted GitHub code search for `Minswap Treasury swap`, `SundaeSwap Treasury` and `swap tADA tUSDM` returned no matching code results on the repository's default-branch search index. This is not proof of global absence or all-branch absence.
- Static review of `plutus/Treasury.hs` shows the `Distribute` validator checks threshold, percentage split and lovelace payments to four script hashes. It does not implement a DEX route, quote, asset sale, swap, min-output constraint or execution-cost guard.
- Status: no verified implementation or completed swap evidence found within this scoped check. Classify as **NOT_PROVEN / implementation gap suspected** until all existing branches/history and DEX-related files/workflows have been searched systematically. No swap was built, signed or submitted. tADA/tUSDM balances and the read-only observer do not imply a liquidation capability.
- Technical interface needed from Agent A/C before any implementation: explicitly named DEX adapter/route, asset-unit identities, quote validity and source, minimum output/slippage bound under an approved policy, fee/execution budget, failure/partial-fill behavior, and evidence fields. This is a dependency proposal, not a new economic rule or implementation.

### H. B-front status matrix at this refresh

| Front | Status | Exact evidence / reason | Next owner action |
|---|---|---|---|
| B1 — Yaci/Lucid evaluation | **RED — FAILED** | Run #40064065979 on `f46e118d...`; diagnostic returns HTTP 400 only for malformed empty payload; V3 fails at provider response handling. | Agent B: isolate valid-CBOR request/response schema, preserve V3/Reveal semantics. |
| B2 — Yaci lifecycle / workflow | **YELLOW — PARTIAL** | Run #2113: setup, readiness, local smoke, cost model, artifact upload pass; evaluation consumer fails. | Agent B: correct diagnostic contract and fail classification; no rerun without concurrency check. |
| B3 — credential/artifact safety | **BLOCKED — EXTERNAL** | Historic run #2086 artifact still unexpired and accessible; current redaction covers one key syntax only. | Repository owner: inspect/remove or restrict historic artifact, confirm no key reuse; Agent B: add synthetic redaction/scan tests. |
| B4 — Treasury Observer | **YELLOW — PARTIAL / BLOCKED — EXTERNAL** | Static path reviewed; no workflow execution; configured address variable not independently readable; no explicit fetch timeout/tip slot. | Owner verifies configured address; Agent B adds bounded read-only robustness tests after branch review. |
| B5 — on-chain evidence distinctions | **YELLOW — PARTIAL** | Local Yaci smoke success and local address derivation only; no evidence of canonical Treasury deployment or first real ticket from this run. | Record each real claim against exact network, transaction/UTxO, slot and verifier. |
| B6 — Treasury swap/liquidation | **NOT_PROVEN** | No route found by targeted indexed search; Treasury.hs only implements distribution of lovelace. | Complete branch/history search; report interface gaps to Agent A/C. |
| B7 — coordination | **YELLOW — PARTIAL** | This refresh binds exact branch, commit, run, step/log, artifact ID/digest and owner actions. | Reconcile latest checkpoint/Notion index after commit; keep historical snapshots immutable. |

### I. Next three actions

1. **Agent B:** inspect installed `@lucid-evolution/provider` at the exact lockfile version and build a valid-CBOR, local-devnet-only provider contract diagnostic using the existing workflow's transaction CBOR; compare exact route and schema, without bypassing evaluation.
2. **Repository owner:** contain historical artifact `12525975775` from run #2086 and confirm the devnet key material was never reused; add formal redaction/scan fixtures before another lab publication.
3. **Repository owner + Agent B:** independently verify `DEMETER / vars.VITE_TREASURY_ADDRESS` matches the address derived from the exact approved Treasury artifact, then add observer timeout/schema/tip tests before any manual observer dispatch.

**Current overall classification:** PARTIAL / OPEN. No GREEN upgrade. No on-chain Preprod action. V3 carrier and Reveal source/semantics remain unchanged.

## Agent A — economy / EEV / Treasury / first Issue baseline — 2026-10-24

**Branch verified:** the previously mentioned short name green is not an existing branch. The active branch consistent with the coordination checkpoint is work/immortal-green-closure, implementation baseline before this note b6379b6284c92fb6c1e992767d88af827d03c582. No branch was created or switched. The Treasury review branch review/treasury-readonly-observer remains a source/reference branch; no wholesale merge was performed.

### Six-front status matrix (source inspection + available exact-run evidence)

| Front | State | Available work / evidence | Current blocker | Minimum closure proof |
|---|---|---|---|---|
| P-01 — EEV / EV1–EV7 / R1-Kc qualification | **BLOCKED** | Direct-USDM producer and EV1–EV7 qualification scripts exist; profile is PRE-RICH-EEV-USDM-DIRECT-V1. Historical liveness observation run [39723715470](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39723715470) only established time-bounded existence of the historical Pool candidate. | Physical Preprod candidate is tUSDM; its normative mapping to the protocol's canonical accounting USDM is still unapproved. Historical approval bundle is not reproducible from its recorded workflow commit for EV2–EV5. No fresh qualified source-set + separately authorized approval bound to current bytes. | Governed asset identity; fresh exact live Pool source-set; EV1–EV7 content/digest and provenance verification; fresh qualification and separately authorized deployment approval bound to the exact source/deployment/workflow SHA. |
| P-02 — Pyth → MintPolicy price authenticity | **PARTIAL / BLOCKED for production binding** | Pyth/Aiken synthetic build and TypeScript checks are documented; a native-ledger workflow was not shown as dispatched in the current evidence record. | Feed 16 is ADA/USD; no approved mapping establishes it as a USDM quote. Production MintPolicy quote/signature/unit binding and positive + tampered native-ledger acceptance/rejection remain unproven. | Approved denomination/source decision; exact quote carrier and feed binding; freshness rules from existing normative policy; native-ledger positive and tampered-update twins on exact SHA. |
| P-05 — Authoritative Issue admission | **IMPLEMENTED / UNPROVEN** | Fail-closed bridge, signed authority/envelope checks, exact Pool/Counter references, and EEV qualification/profile guards exist; Issue Admission Boundary CI has historically passed on specific SHAs. | No current production wiring that independently authenticates control/EEV/liquidity and binds the admission to the actual final transaction body; evidence digests are shape-checked in some bridge paths rather than recomputed from retrieved canonical bytes. | Current authority sources and R1/Kc certificate; byte-level evidence recomputation; actual candidate-body/input binding before signature; governed freshness source/policy; fail-closed consumer integration. |
| P-06 — expiry origin and Issue-boundary binding | **INTEGRATION BLOCKED** | PRE-RICH/src/PreRichExpiryPolicy.ts defines profile V1 expiry horizon and deterministic derivation from a supplied issuance snapshot. | src/mint.ts still uses local Date.now() for issued-at and does not prove that on-chain issuedAt/expiresAt derive from the authorized snapshot/policy at the Issue boundary. | Bind issuance snapshot/policy output to datum and validity interval at the actual mint boundary; negative ledger/transaction tests; no new horizon rule. |
| P-15 — Treasury inventory / direct-USDM asset perimeter / asset→USDM capability | **PARTIAL; normative perimeter BLOCKED** | Read-only observers exist: observe-configured-preprod-treasury.mjs, observe-preprod-treasury-inventory.mjs; manual workflows observe-configured-preprod-treasury.yml and observe-preprod-treasury-inventory.yml exist. treasury-liquidation-simulation.yml runs integer-only scenario simulation and explicitly treats inputs as scenario/external evidence. | Read-only observer workflow requires configured Treasury address/script hash/binding reference in the DEMETER environment. Inventory balance does not prove canonical deployment, route, executable proceeds, or swap. Existing simulation is not a live DEX quote or transaction. tUSDM identity remains unapproved. | Run observer manually with reviewed configuration and inspect artifact; classify all native assets by exact unit; separately produce route/quote evidence before any future authorized simulation; no transaction signing/submission without explicit authorization. |
| P-16 — first real Issue and wallet settlement | **BLOCKED / NOT ISSUED** | DApp/Issue bridge and readiness/evidence gates exist; devnet integration traces are not the personal Preprod flow. | No fresh current EEV qualification + authoritative admission + verified final body binding + wallet signature + confirmed transaction/post-state + ticket NFT verified in the intended user's wallet. | Complete the entire Preprod path and independently observe confirmed transaction, minted ticket unit/quantity and recipient UTxO. Until then the Issue button must remain fail-closed. |

### Agent A — direct-USDM regression hardening, 2026-10-24

- Commit [b6379b62](https://github.com/LiberoNuvola/Immortal-Protocol/commit/b6379b6284c92fb6c1e992767d88af827d03c582) adds three tests to Adapter/CARDANO/observation/DirectUsdmEev.test.ts: negative physical quantity rejected; ADA/PRE-like unrelated units cannot substitute for the expected direct-USDM unit; malformed ticker-like asset identity rejected.
- Exact-SHA workflows triggered by this commit are **pending** at checkpoint time, including [PRE-RICH Direct-USDM Conformance #40066013357](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013357), [Issue Admission Boundary CI #40066013305](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013305), and [IMMORTAL Cardano Integration Lab #40066013291](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013291). Do not call these tests verified until their exact-SHA runs conclude successfully.
- This patch is negative-test hardening only; it does not authorize tUSDM as canonical USDM, create EV1–EV7 qualification/approval, authenticate Pyth, or establish a real Issue.

### Explicit evidence boundaries

- The direct-USDM EEV conversion currently uses 6 atomic decimals for the Preprod candidate and maps whole tokens to 100 IMMORTAL USDM subunits. This is an implementation/profile conversion for the candidate, **not a governed statement that the candidate is canonical USDM**.
- The source-set producer requires PREPROD_TUSDM_UNIT and an exact live Pool out-reference; it emits OBSERVED_NOT_QUALIFIED. The EEV approval workflow is a separately gated manual approval workflow and has not been dispatched by this audit.
- Treasury scenario simulation labels USER_SUPPLIED_SCENARIO versus OBSERVED_EXECUTION, but its inputs are supplied parameters; do not infer an executed swap from SCENARIO_PASS.
- No wallet signature, approval dispatch, DEX transaction, or funds movement was performed in this pass.


### 10.26 — Agent C erratum: exact B3 run source SHA (2026-10-24)

Section 10.25 contains a transcription error in the B3 workflow source SHA. The exact `head_sha` reported by run [#39933665986](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986) and its artifacts is `11fae8a1f030bcbe177eab6ee2ae99a96f080ca6`, not `11fae8a1f030bcbe98eab6ee2ae99a96f080ca6`. This erratum corrects the identifier only; it does not alter the evidence classification or claim a newer branch HEAD. The B3 run's verifier and live-storage jobs passed; the real GRANDPA witness job failed with `NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_DENSE_SCAN`. Current checkpoint blob was re-fetched before this append; preceding Agent A additions are preserved.


### Agent A — exact-SHA test results update — 2026-10-24

The direct-USDM regression commit b6379b6284c92fb6c1e992767d88af827d03c582 has now been tested by the following exact-head workflows:

- [PRE-RICH Direct-USDM Conformance #40066013357](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013357) — **SUCCESS**.
- [Issue Admission Boundary CI #40066013305](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013305) — **SUCCESS**.
- [IMMORTAL Portability Conformance #40066013361](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013361) — **SUCCESS**.
- [IMMORTAL Layer Boundary Conformance #40066013352](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013352), [Protocol Declaration Conformance #40066013349](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013349), [Algorithmic Governability Adversarial Lab #40066013316](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013316), and [Documentation Link Check #40066013307](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013307) — **SUCCESS**.
- [Cardano Adapter Sale Conformance #40066013310](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013310) — **CANCELLED**, not a pass.
- [IMMORTAL Cardano Integration Lab #40066013291](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013291), [PRE-RICH B2 Control Carrier Conformance #40066013339](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013339), [IMMORTAL Haskell Semantic Conformance #40066013328](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013328), [Kernel Invalid-Class Fail-Closed Audit #40066013304](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013304), and [IMMORTAL Cardano Preprod Context #40066013302](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013302) were still pending/in progress at this check. They are not evidence of a green full closure gate.

The test patch is verified for its focused direct-USDM suite and Issue Admission Boundary CI. The economic/operational conclusions remain unchanged: tUSDM is an observed physical candidate, not yet the governed canonical accounting asset; EV1–EV7 current qualification, deployment approval, and real wallet Issue remain blocked. No approval workflow or financial transaction was invoked.


### 10.27 — Agent C: inspect B3-B live artifact fields (2026-10-24)

Artifact [12492463295](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986/artifacts/12492463295) was downloaded and its ZIP contents inspected, including `MateriosB3BLiveStorageProof.json` and the four raw hex inputs. The ZIP is 7,992 bytes per GitHub artifact metadata, SHA-256 `2c78c35352fdce044049cbe50a000702ae1705b6430f26a61dcb02e4e825c26a`. The evidence JSON records `evidence_sha256=0xf596953cb94a0b1a92c02fa63c759d707340591b82aa23a7fe45c65bba15fb73`.

**Observed packet fields:** network `materios_preprod`; certified/observed block number `2409483`; block hash `0x6ee0dde8e6d7d1a4ecb599cbaa34ab4064b13e0c6f683948fbbf263ad81fff28`; StateRoot `0xd832cf37f026d63675d3b5a6e85ce2c64a35b7d9e1a5e71b95a058e30aeb3793`; `read_proof.at` equals that block hash; proof node count 10; receipt ID `0x09f6bec6aff0c3b90c08848cebd4f8ccfd87ce6a1d187baf9fabd914feb22f44`. Transport flags report finalized-head observation covers the observed block, storage key derived from receipt ID, value present, and `proof_at_matches_observed_block_hash=true`. The exact-head Rust verifier log reports `B3_B_STORAGE_PROOF_VALID=true`, `B3_B_STORAGE_VALUE_MATCH=true`, `B3_B_STATE_ROOT_BOUND=true`, `B3_B_RESULT=PASS`.

**Strict limitation:** this closes the narrow cryptographic storage-proof check against the supplied observed StateRoot, not authenticated finality of that StateRoot. The receipt certification field reports `signers: 0`; a nonzero `certHash` is not a signer/finality proof. Therefore C2/P-10 remains **PARTIAL** in the end-to-end B3 composition until the target header/root is anchored by independently verified B3-A finality and the exact canonical anchor/receipt semantics are reconciled. No finality claim is inferred from the RPC's finalized-head response.

This inspection used the existing run/artifact only; no redundant workflow was launched. No source code or protocol semantics were changed.


### 10.28 — Agent C: Materios upstream delta recheck (2026-10-24)

Read-only recheck of `Flux-Point-Studios/materios` via GitHub connector:

- Latest commit returned by the upstream repository query remains merge commit `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30`, dated 2026-10-21, for Rust sccache/CI.
- Recent listed changes include CI caching, launch-preflight guards, genesis-committee guard, IDP window handling and db-sync follower integration; none of those commit summaries is a GRANDPA justification/RPC implementation.
- Current upstream code search for `grandpa_proveFinality` returned no matches; prior targeted inspection of `partnerchain/node/src/rpc.rs` found no registered `materios_b3_calculateCommitteeProof` or standard GRANDPA RPC assembly. This is evidence of no identified implementation in the inspected source, not proof that no private/operator archive source exists.
- No new relevant upstream proof/finality PR was returned in the targeted query. No source was modified upstream and no identical RPC scan was rerun.

**C3 remains BLOCKED / INTEGRATION_BLOCKED.** Next action stays: acquire a genuinely new authorized archive/FullClient proof source or obtain upstream implementation plus deployed endpoint evidence. Do not infer execution proof from a closed issue, dependency, similarly named client method or observation-only endpoint.


### 10.29 — Agent C: C1–C15 parallel-front refresh — 2026-10-24

**Classification:** read-only source/evidence audit and dispatch refresh. No protocol code, V3/Reveal semantics, economic policy, branch topology, deployment, wallet, or ledger state changed in this pass.

#### Exact source identities

- Current green branch HEAD immediately before this append: `d06a8f449fd43eeac4bdc293b18f054b1e37268f`; current checkpoint blob fetched immediately before update: `101af10c8d915fa55c87b1d71f2a7e886b46cef0`.
- Current B3 branch HEAD: `722aef11c5f557897bbf8a51774cfec7a89af3f3`. Compared with run #39933665986 source `11fae8a1f030bcbe177eab6ee2ae99a96f080ca6`, it is one documentation-only commit changing `docs/04-verification/MATERIOS-B3-GRANDPA-RPC-HANDOFF.md`; the B3 verifier/test blobs inspected below are unchanged.
- Current governance branch HEAD: `7bca8d91b65d7af1261d8b7cc4f28f496a73fcba`; PR #35 remains OPEN/DRAFT, base `main` at `97b09a38742098f17a61eb07734c401aeedccc06`, 14 changed paths.
- Current `b1-hardening` HEAD: `c561393e7eb842529aeaa272377e5afe0138d085`, unchanged from its 2026-10-17 tip.
- The recursive green tree is complete/non-truncated: 1,094 entries. The recursive B3 tree is complete/non-truncated: 1,114 entries. The hardening tree is complete/non-truncated: 418 entries. These are tree inventories, not semantic review of every file.

#### C1–C4 — B3 proofs and Workflow B

| ID | Status | Freshly checked evidence | Next action / boundary |
|---|---|---|---|
| C1 / P-09 B3-A | **BLOCKED** | Exact B3 run #39933665986: verifier PASS; finalized-state extraction PASS; live witness job FAIL. Artifact #12493185719 is a failed-acquisition diagnostic, not finality evidence. Verifier tests cover unknown/duplicate signer, quorum, checkpoint hash/number, chain/genesis mismatch and several ancestry cases. | Do not repeat the same public RPC scan. Acquire an authorized, materially different justification-retaining source; independently authenticate genesis identity and initial authority state before trusting later transitions. |
| C2 / P-10 B3-B | **PARTIAL** | Existing artifact #12492463295 (ZIP digest `sha256:2c78c35352fdce044049cbe50a000702ae1705b6430f26a61dcb02e4e825c26a`) records block 2409483, hash `0x6ee0dde8e6d7d1a4ecb599cbaa34ab4064b13e0c6f683948fbbf263ad81fff28`, matching `proof.at`, StateRoot and a native verifier PASS. Receipt certification has `signers: 0`; this is not authenticated finality. | Keep storage validity separate from finality. Add missing mismatch fixtures only after current tests are checked; final end-to-end closure depends on C1 and canonical anchor/receipt semantics. |
| C3 / P-11 B3-C | **BLOCKED** | Current B3 tree still contains a reference-only/not-applied upstream RPC handoff. Prior upstream check found no registered `materios_b3_calculateCommitteeProof` or standard GRANDPA RPC assembly. No newly identified upstream implementation was found in this pass. | Revisit only after a new upstream commit/PR or identified authorized source; otherwise hand upstream the minimal patch and deployment-evidence request. Do not implement the authority selector in TypeScript. |
| C4 / P-12 Workflow B | **PARTIAL** | PR #35 metadata and body rechecked; it remains OPEN/DRAFT and requires independent governance enforcement review. Its own supporting CI is harness evidence, not protocol proof or active repository-policy enforcement. | Preserve draft; reconcile target ruleset, required reviews/checks and exact-head evidence before any readiness or promotion decision. |

#### C5–C15 — independent lanes

| ID | Status | Freshly checked evidence | Next action / boundary |
|---|---|---|---|
| C5 / U-08 JEV | **INCONCLUSIVE** | `.github/workflows/jev-materios-live-ingress.yml` blob `3f22c38f17426872b33068137c59919ef73192fe` is `workflow_dispatch` only. It captures an observation and registry metadata, not GRANDPA/storage validity. Registry fixture `audit/jev/registry-run-1718-attempt-2.json` is historical (run 38615595908, commit `e6909bcd83d4a833ecbb9f1efbdea6630873d9f1`). | Inspect current run/registry chronology and prove a subsequent scheduled cycle consumes the latest result without user input. No autonomy claim from this fixture or a manual ingress. |
| C6.1 / U-01 kernel | **PARTIAL** | Current blobs: `UniversalEconomicKernel.hs` `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785`; `UniversalEconomicState.hs` `f89fe04c8aad8ca9c5e544fa9c145a38d157826f`; `EconomicGate.hs` `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127`. Concrete functions cover ProtectedCapital, RawSurplus, non-negative state and solvency predicates; this is not a certified concrete kernel. | Map normative property → implementation → projection → tests, with proved/tested/open labels. |
| C6.2 / U-02 boundary | **BLOCKED** | State type intentionally omits ticket classes, activation policy, Jackpot lifecycle and payout tables; a complete consumer/call-site map is not evidenced. | Complete tree-wide consumer/call-site classification before extraction; no destructive refactor. |
| C6.3 / U-03 Kc/Ω | **BLOCKED** | Existing certification spec requires profile instantiation `(S,A,Accept,Ω,T,Safe)` and a decision procedure for `S ∈ K_c`; finite tests do not discharge this. | Write explicit proof obligations and counterexample plan; do not claim infinite-horizon viability. |
| C6.4 / U-04 Reference Adapter | **PARTIAL** | `Adapter/REFERENCE/docs/CONFORMANCE-METHODOLOGY.md` blob `5ef77e7ac0791130a28fc36eb5d420c86d6b4fb1` remains DRAFT/OPEN. Portability vector file `18334f0a12a333c4da796e9c15fe93454c2dd1cf` identifies itself as `executable-seed`. | Inventory vector coverage, fixture versioning and error taxonomy; preserve draft authority status. |
| C6.5 / U-05 multi-adapter | **PARTIAL** | Adapter README and research list multiple chains/trust models, but no equal-vector second-adapter certification was established. | Build a trust-model/readiness matrix and compare only after reference fixtures are reviewable. |
| C7 / U-09 public observability | **PARTIAL** | `docs/04-guides/15_PUBLIC_TRANSPARENCY_CONTRACT_v0.1.md` blob `c97d67341677e5e04f757bea7b1e3c8931017606` and lifecycle matrix blob `517b13c483c3623e361110bdf004fd64f69cc401` define explicit trust mode, evidence reference/time/freshness and UNKNOWN/HALTED handling. This pass did not verify live UI/API bindings. | Trace public fields to authoritative declarations and add missing/stale/mismatched evidence tests. |
| C8 / U-10 paper | **BLOCKED** | `docs/papers/PAPER_TRANCHE_1_RELEASE_AUDIT.md` blob `16ccbb4b837941474f41f5ac0e1e00394a94adf6` says NOT READY TO SUBMIT. Traceability matrix blob `143a09f276f8c3c1ecaf87b8d0230d6b51685cc5` distinguishes proof, normative closure, test evidence, Preprod observation and ledger witness. Manifest blob `3b9b48730d7f3e8fa0c867df9e2bda0ab338b7e7` is provisional and not a frozen release. | Refresh each claim against exact current source/run/artifact and prepare a single reproducible release snapshot; no submission yet. |
| C9 / U-12 Strategy Explorer | **NOT RUN** | Current green tree contains `state-explorer.html` blob `7d070b45bcb8a2477ea5813dc8ba151cdbe6ae3c`, which explicitly calls itself conceptual/read-only and not a runtime oracle. No dedicated `StrategyExplorer/README.md` path exists in the current tree. | Identify actual candidate-generation implementation, if any; verify canonical-kernel gate and safe decline before calling this implemented. AI remains untrusted. |
| C10 / U-13 sponsorship | **NOT RUN** | No dedicated fee-sponsorship study/code path was identified in the current green tree scan; Notion Workflow C describes it as a hypothesis. No fresh measured cost vectors or wallet-signing/atomicity evidence were produced. | Locate any external/current study; otherwise record implementation gap and keep sponsor, network fee, protocol fee and locked ADA distinct. |
| C11 / U-14 Beacon 4 | **PARTIAL** | Still research-only; no approved quorum/attestation format or source-independence/conflict policy was evidenced. | Document independence/correlation assumptions; no deployment and no substitution for B3. |
| C12 / U-15 public surface | **PARTIAL** | Ecosystem entrypoint blob `c9a2e86298c569f0c22fdfde151e229462f797c8` separates protocol, adapter, application and execution environment and disclaims production certification. No live website/DApp conformance run was performed. | Compare live public routes/copy with canonical declarations; report precise overclaims, if any. |
| C13 / U-16 CAROB THREE | **BLOCKED** | The complete current green tree scan found no CAROB THREE path. This does not establish whether the project exists externally or is only conceptual. | Find an authoritative repository/project reference and record the boundary; no rules/state imports. |
| C14 / U-17 artifact reuse | **PARTIAL** | No dedicated all-path fingerprint regression was executed. A workflow/cache declaration is not itself proof that every reuse path is bound to exact source/toolchain inputs. | Trace actual cache/artifact keys and add a mismatch regression in the owning path; classify any existing test evidence by exact SHA. |
| C15 / P-14 Aegis | **PARTIAL** | `b1-hardening` HEAD unchanged since 2026-10-17. `AEGIS-IMMORTAL-ADAPTIVE-ADMISSION-EXPERIMENT-v1.md` labels the comparison synthetic/offline and says it does not execute the Aegis Aiken predicate or a Cardano transaction. Workflow `aegis-immortal-adaptive-experiment.yml` only runs the illustrative Python experiment. | Run the existing experiment on an authorized runner and review current fixtures; keep results synthetic and parameters non-normative. No import into the kernel. |

#### Execution record and limits

- Read-only actions executed: current refs/HEADs; complete recursive tree inventories for green/B3/hardening; exact file/blob inspection for B3 verifier/authority tests, genesis trust manifest, B3 proof workflow, JEV ingress/registry tests, universal kernel/state/gate, reference vectors/methodology, transparency contract/lifecycle, paper release audit/traceability/manifest, ecosystem entrypoint/state explorer, and Aegis experiment/workflow; PR #35 metadata; existing B3 workflow jobs/artifact metadata and failed-job logs.
- Existing test evidence was inspected but **no new test command or workflow dispatch was executed in this cycle**. The available GitHub integration exposes GET/read and rerun actions, but no workflow-dispatch action; local shell access to GitHub was previously unavailable. Do not report a new test PASS. Current B3 code/test blobs are unchanged from the exact run #39933665986 source; that run remains the applicable existing evidence.
- No code patch was made because the current test runner/dispatch route was unavailable and a test-file push would trigger the B3 workflow's repeated public RPC probe; do not manufacture a redundant scan merely to run unit tests.
- Notion pages fetched: PRE-RICH Control Center (last returned update 2026-10-24T05:26:11Z) and Workflow C (last returned update 2026-10-18T11:13:11Z). Workflow C remains DESIGN/RECONCILIATION ONLY OPEN. The connected-source Notion search is unavailable under current workspace entitlement; no claim of cross-source Notion/Slack/GitHub triangulation is made.
- No branch created/deleted; no merge, rebase, force-push, cherry-pick, deployment, wallet operation, transaction or protocol-semantic change.

**Overall status:** PARTIAL. C1/C3 remain externally blocked; C2 is a scoped storage-proof PASS but end-to-end PARTIAL; C5 autonomy remains INCONCLUSIVE; universal viability/portability and Paper Tranche 1 remain OPEN. Next order: (1) authorized genesis/GRANDPA source; (2) finish U-02 consumer map and U-04 fixture inventory; (3) inspect live JEV run chronology and registry scheduling; (4) refresh U-10 claim/evidence map; (5) trace U-09 public UI bindings; (6) exact-head fingerprint and Aegis validation when a runner is available.


### 10.30 — Agent C: Materios Receipt lineage / current-ref recheck — 2026-10-24

**Purpose:** assess the upstream announcement “Full provenance lineage traced end-to-end for every Materios Receipt is now LIVE on our explorer” against the current upstream source and IMMORTAL's open B3 obligations. This is a scoped source review, not an assertion that every live Receipt has been independently verified.

#### Exact refs and source identities observed

- IMMORTAL <code>work/immortal-green-closure</code> HEAD at review start: <code>60bc25f6c381b0d4494dc74381683859a5216eaa</code> (commit message: <code>docs(coordination): record Agent A Treasury observer source audit</code>, 2026-10-24T05:38:27Z). The central checkpoint file blob fetched from this branch is <code>edbdd5d2387d38caf60e4666411ffc5515e8090d</code>.
- IMMORTAL <code>work/b3-materios-provenance-evidence</code> HEAD: <code>722aef11c5f557897bbf8a51774cfec7a89af3f3</code>. Existing B3 verifier evidence remains bound to workflow run #39933665986 / source SHA <code>11fae8a1f030bcbe177eab6ee2ae99a96f080ca6</code>; the branch tip includes a documentation-only update to the GRANDPA handoff, not a new witness.
- IMMORTAL <code>main</code> HEAD observed: <code>97b09a38742098f17a61eb07734c401aeedccc06</code>.
- IMMORTAL <code>merge/workflow-b-closed-main</code> HEAD: <code>7bca8d91b65d7af1261d8b7cc4f28f496a73fcba</code>; PR #35 remains OPEN/DRAFT, base <code>main</code> at <code>97b09a38742098f17a61eb07734c401aeedccc06</code>, head <code>merge/workflow-b-closed-main</code>; no merge or governance promotion performed.
- Materios upstream <code>main</code> HEAD: <code>7d5c36e7dcd60824d84353e93df5d4a03c9c6c30</code>, dated 2026-10-21T09:20:18Z (merge of CI sccache PR #110). No post-HEAD code change implementing GRANDPA RPC was identified in the inspected source.
- Upstream file blob SHAs at that HEAD: <code>tools/explorer/app.py</code> = <code>fc7e8f045f9319c2aa6ceb11c83ec5fc5f5076a1</code>; <code>tools/explorer/chain.py</code> = <code>18d79766bb49efdd89c6c10ff14c928dd6a3411a</code>; <code>tools/materios-verify/materios_verify/core.py</code> = <code>bcd21c3c942e3a3b7fbac234865b69050283831a</code>; <code>tools/explorer/static/app.js</code> = <code>b5c214e943dfff17237f837e65fbbbb9a922a270</code>.

#### C0 — lineage source audit

| Lineage element | Source / verification method found | Classification and limit |
|---|---|---|
| Receipt identity and on-chain fields | <code>/api/receipt/{receipt_id}</code> queries <code>OrinqReceipts.Receipts</code>; returns content, schema, locator, manifest, safety, monitor and attestation-evidence hashes plus availability certificate hash. | **On-chain query surface identified**; live Receipt samples/count not obtained in this pass. |
| Availability certificate / certificate hash | <code>verify_receipt</code> reads <code>availability_cert_hash</code> from Receipt storage and queries current committee members/threshold. | Hash and current committee are queried; this code path does not independently prove certificate signers or authenticate the initial/transitioned authority set. |
| Context-bound checkpoint leaf | Core verifier computes SHA-256 over <code>"materios-checkpoint-v1" || chain_id || receipt_id || cert_hash</code>. | **Locally recomputed** by the slow verifier. |
| Anchor and Merkle root | Slow path scans <code>AnchorSubmitted</code> events, queries <code>OrinqReceipts.Anchors</code>, and can reconstruct a batch from certified events. | **On-chain queries + local reconstruction**; bounded scan window and historical pruning can cause misses. |
| Merkle inclusion | Exact single-leaf root/leaf equality, batch-history reconstruction or on-chain reconstruction is used. | Some paths verify a root relationship; a supplied sibling-proof is not used for every possible batch path. Coverage requires test evidence. |
| Manifest integrity | If a matching local batch manifest exists, its canonical JSON hash is recomputed and compared with the anchor's manifest hash. If no manifest is available, step 6 is explicitly marked passed with a warning. | **Conditional verification; missing manifest is fail-open at this step**, so this is not a universal mandatory manifest-integrity proof. |
| <code>AvailabilityCertified</code> event | Slow path scans a bounded block range and compares event certificate hash to Receipt storage. If the event is not found in the range, step 7 is marked passed with a warning. | **Conditional event cross-check; missing event is fail-open at this step**, not proof the event exists or matches. |
| Cardano L1 anchor | The explorer's pre-indexed fast path returns a Cardano transaction hash and <code>verified_at</code> from the blob-gateway verification index. The inspected slow-path <code>verify_receipt</code> has no Cardano L1 anchor-verification step. | **Operator/index-provided claim in fast path; not independently verified by the inspected slow verifier.** |
| Finality / GRANDPA justification | The inspected Receipt verifier does not verify a GRANDPA justification, authenticated genesis trust anchor, or authority transition. | **Absent from this lineage verifier.** Must remain a separate B3-A/B3-C obligation. |
| Freshness / cache | Receipt, anchor, and verification endpoints use caches; receipt/anchor details use 30 seconds or permanent cache, while the verification-index fast path trusts the index response. | Cache/index freshness and publisher independence require explicit validation. |
| Coverage of every Receipt | <code>/api/receipts</code> exposes pagination (max 100/page); <code>/api/verify/{id}</code> verifies one ID at a time. No evidence in this audit proves every historical/current/pending/stale/failed Receipt was individually verified. | **NOT PROVEN**. The announcement's “every Receipt” coverage claim is not independently established by repository source alone. |

#### High-priority C0 finding — pre-indexed verification fast path can overstate verification

In <code>tools/explorer/app.py</code>, <code>/api/verify/{receipt_id}</code> queries <code>{BLOB_GATEWAY_URL}/verification/{clean_id}</code>. When the response status is HTTP 200, the handler returns <code>verified: true</code> and synthesizes nine <code>pass</code> steps from fields in that index response. The inspected path does not compare those values against a fresh on-chain Receipt, recompute the checkpoint leaf, verify the Merkle proof/manifest, cross-check the <code>AvailabilityCertified</code> event, verify the Cardano transaction, or verify GRANDPA finality before emitting those pass statuses. A stale or incorrectly populated index record could therefore be presented as a fully verified lineage by this route. This is a source-level risk finding; no live exploitation or bad production record is claimed.

The slow path delegates to <code>verify_receipt</code>, but that function also treats a missing manifest as supplementary/pass and a missing event within the bounded scan as supplementary/pass. Its <code>FULLY_VERIFIED</code> result therefore means the implemented Receipt/checkpoint checks passed under those code-path conditions; it must not be interpreted as GRANDPA finality, authority-transition authentication, or independently proven Cardano anchoring.

#### Live explorer and Notion limits

- Direct reads of <code>https://materios.fluxpointstudios.com/</code>, <code>/api/chain-info</code>, <code>/api/receipts?limit=2</code>, and a verification endpoint were attempted through the available web reader; the host was reported inaccessible to that reader. Therefore this pass **did not** verify the deployed explorer's current UI, runtime API responses, current Receipt count, or all-Receipt coverage. Source code on GitHub and the live deployment must not be conflated.
- Notion search/fetch was available. “MATERIOS B3-A — Authority Transition Triangulation — 11 Oct 2026” still records the real cryptographic witness/finality boundary OPEN; “Workflow C — IMMORTAL V2 Autonomous Verification & Execution v0.1” remains DESIGN/RECONCILIATION ONLY — OPEN; the PRE-RICH Control Center's 2026-10-22 note says the genesis trust anchor and initial authority set are not yet authenticated. These agree with, and do not supersede, the GitHub evidence boundaries.
- No upstream file was modified, no external issue/PR was created, and no live RPC scan was repeated.

#### C0 impact on B3

| Front | Result after this review | What the lineage announcement changes |
|---|---|---|
| C0 Receipt provenance | **PARTIAL / SOURCE AUDIT** | Adds a useful explorer evidence surface, but “every Receipt” coverage and live deployment behavior are not independently demonstrated; fast-path and missing-evidence fail-open cases need upstream correction or a stronger consumer verifier. |
| C1 / P-09 B3-A GRANDPA | **BLOCKED** | No justification/FinalityProof bytes or authenticated authority transitions supplied by the inspected lineage. |
| C2 / P-10 B3-B storage proof | **PARTIAL** | No change to existing storage-proof result; its supplied StateRoot remains unauthenticated for finality purposes until C1 is closed. |
| C3 / P-11 B3-C authority selection | **BLOCKED** | Receipt lineage does not prove canonical selector execution or bind selector inputs/result to an authenticated transition. |
| C4 / P-12 Workflow B | **PARTIAL** | Must consume explicit verifier results and provenance digests, not the explorer's display label or a gateway's HTTP-200 record. |
| C5–C15 | **No status upgrade from this finding** | Keep the latest status matrix in §10.29; a Receipt lineage feature does not discharge kernel, JEV autonomy, adapter, paper, public UI, sponsorship, Beacon, CAROB THREE, artifact reuse or Aegis obligations. |

#### Required upstream handoff — minimum safe contract

Ask the Materios explorer/blob-gateway owner to provide:

1. A versioned, immutable verification record keyed by exact Receipt ID and chain genesis, containing raw Receipt/certificate data, certificate signer identities and signed payload or independently verifiable attestation bytes, checkpoint leaf, Merkle siblings and leaf index, anchor ID/root/manifest bytes, event block/hash, Cardano transaction bytes or transaction ID plus independently queryable inclusion evidence, and timestamps/source block hashes.
2. A verifier result generated from those raw materials, with per-step result and explicit <code>NOT_RUN</code> / <code>MISSING</code> / <code>STALE</code> states. HTTP 200 or record existence must never imply every step passed.
3. The verification-index record digest, schema/verifier version, source block hash, creation time and refresh/freshness policy; consumers must be able to reject stale or mismatched records.
4. A separate GRANDPA evidence interface returning SDK-compatible SCALE <code>FinalityProof&lt;Header&gt;</code> / FRNK justification bytes and required ancestry headers for an exact target, plus a reproducible authenticated-genesis/authority-transition chain. Receipt lineage is not a substitute.
5. A bounded export/list of the complete Receipt-ID universe and statuses, with pagination/snapshot semantics, so a verifier can enumerate and report coverage rather than sampling only recent/certified entries.

IMMORTAL should consume this as untrusted evidence and independently verify each cryptographic claim. Do not make the explorer itself a trust anchor.

#### No local code change / no new test run

This review is source-level and uses existing artifacts only. The connected GitHub capability exposed repository reads and file updates but no workflow-dispatch action or local shell/test runner; no new unit test, live workflow, transaction or upstream patch was executed. The last relevant B3 proof workflow remains run #39933665986 on source SHA <code>11fae8a1f030bcbe177eab6ee2ae99a96f080ca6</code>: verifier and B3-B storage proof passed, real GRANDPA witness acquisition failed. Do not upgrade it based on this source review.

**Overall Agent C status remains PARTIAL.** C0 is now classified as PARTIAL with concrete source-level overclaim risks; C1 and C3 remain externally blocked; C2 remains a narrow storage-proof PASS but end-to-end PARTIAL; C4 remains governance PARTIAL; C5 remains INCONCLUSIVE; C6.1/C6.4/C6.5/C7/C11/C12/C14/C15 remain PARTIAL; C6.2/C6.3/C8/C13 remain BLOCKED; C9/C10 remain NOT RUN. See §10.29 for the per-front evidence and next actions, supplemented by this C0 finding. The single highest-leverage next action is to obtain a new authorized source that returns real GRANDPA justification bytes and an authenticated genesis/authority-transition chain; independently, upstream should correct the explorer's verification-index fast path and fail-open missing-manifest/event semantics.


### 10.31 — Agent C: Independent GRANDPA source search / next evidence path — 2026-10-24

**Scope:** continue the B3-A unblock attempt after §10.30 without repeating the same RPC scan or changing protocol code.

- Re-read upstream Materios `main` at `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30`. Current `partnerchain/node/src/rpc.rs` blob `30827863c7b8f6fb507b008cee9f572ec48fe06f` still merges only System, Orinq Receipts and MOTRA. No public upstream PR was found in the scoped GitHub search for a GRANDPA justification RPC.
- Upstream issue [#50](https://github.com/Flux-Point-Studios/materios/issues/50), `materios_b3_calculateCommitteeProof`, is closed with `state_reason=not_planned` and zero comments. It is about runtime execution-proof transport for committee selection, **not** a GRANDPA finality justification; it cannot be treated as a substitute for B3-A.
- IMMORTAL's existing handoff `docs/04-verification/MATERIOS-B3-GRANDPA-RPC-HANDOFF.md` (B3 branch blob `1d1646fbf1e37ae44b3ba2c876fe391f1e2072f9`) already documents two compatible acquisition paths: `grandpa_proveFinality(blockNumber)` and fallback `chain_getBlock(finalizedHash).justifications` with engine ID `FRNK`. Both remain transport only; verify SCALE decoding, target binding, signer uniqueness/signatures/quorum, ancestry, and authenticated authority-set provenance.
- Existing run #39933665986 (source `11fae8a1f030bcbe177eab6ee2ae99a96f080ca6`) observed `grandpa_proveFinality` as `-32601 method-not-found` on both known public RPC URLs and no FRNK justification in the bounded 769-height scan. This negative result is limited to those endpoints and scan window; it does not prove the network has no justifications.
- Searches of the current upstream repository for published alternative RPC URLs/GRANDPA proof archives and scoped open PRs/issues did not identify a verified independent source. This is a search result, not proof that no private validator/archive source exists.
- **Next evidence-producing action:** request from an authorized Materios full/archive-node operator either (a) the exact SCALE-encoded `FinalityProof<Header>` / GRANDPA justification and ancestry for a named finalized block, or (b) a signed operational endpoint/source commitment that can be independently queried. Bind it to chain genesis, block hash/number and runtime/spec version; acquire the authority-transition proof back to the authenticated genesis set. If unavailable, keep B3-A BLOCKED and do not widen the same RPC scan.
- **No code change, deployment, on-chain operation, or test run** was performed in this continuation. No B3 status is upgraded.



## 10.26 — Agent B: valid-CBOR provider contract and Yaci log redaction hardening (2026-10-24)

**Classification:** integration diagnosis + CI security hardening. No economic rules, V3 carrier logic, Reveal semantics, validator code, or Preprod state were changed. The code changes are limited to the CI workflow, an isolated local-devnet evaluation probe, and a shared Yaci-log sanitizer with synthetic tests.

### A. Exact PR state and runs

- PR #36 remains OPEN / DRAFT; branch `review/treasury-readonly-observer`.
- New commit: [`75427c3813aa2e77aad84970ed5298fde6d333ca`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/75427c3813aa2e77aad84970ed5298fde6d333ca).
- Files in the commit:
  - `.github/workflows/immortal-cardano-lab.yml`
  - `audit/cardano-integration/yaci-evaluation-contract-probe.mts`
  - `audit/cardano-integration/sanitize-yaci-log.mjs`
  - `audit/cardano-integration/sanitize-yaci-log.test.mjs`
- The older Integration Lab [#40066734558](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066734558), SHA `fb3164cb7d3fa4bce839f38fb4b14548d3cc78f9`, was still generating Plutus artifacts and had not started Yaci. After the sanitizer commit, GitHub marked it **cancelled** at 2026-10-24T05:45:22Z, before Yaci startup.
- Replacement Integration Lab [#40067396869](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40067396869), SHA `75427c3813aa2e77aad84970ed5298fde6d333ca`, is **IN PROGRESS**. Its sanitizer test passed before dependency installation/Yaci, then it entered Haskell setup. Provider evaluation has not run yet. No result is inferred from the workflow being in progress.
- Same-SHA Protocol Declaration Conformance [#40067396823](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40067396823) and Algorithmic Governability [#40067396831](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40067396831) completed successfully for their scopes only.
- Green checkpoint branch run group at `41dd9b084c9d0ccaad1303a3583a364815a4bf95` completed success for Documentation Link Check [#40067538838], Portability [#40067538854], Algorithmic Governability [#40067538805], Protocol Declaration [#40067538806], and Adapter Sale [#40067538810]. These checks do not close Yaci provider compatibility.

### B. Provider contract confirmed from the versioned sources

- Immortal's lockfile resolves `@lucid-evolution/lucid@0.6.5` with `@lucid-evolution/provider@0.2.4`.
- The pinned provider implementation ([source at release commit](https://github.com/Anastasia-Labs/lucid-evolution/blob/69cb625e5fc6ac61656c7fa50c5260cf35f945ff/packages/provider/src/blockfrost.ts)) issues `POST /utils/txs/evaluate/utxos`, `Content-Type: application/json`, body `{"cbor":"<transaction CBOR as hex>" }`, and reads `result.EvaluationResult`.
- Yaci DevKit `v0.12.0` config ([`download.properties`](https://github.com/bloxbean/yaci-devkit/blob/v0.12.0/applications/cli/config/download.properties)) pins Yaci Store `2.0.7`. The versioned [`TxUtilController`](https://github.com/bloxbean/yaci-store/blob/v2.0.7/components/submit/src/main/java/com/bloxbean/cardano/yaci/store/submit/controller/TxUtilController.java) exposes:
  - `POST /utils/txs/evaluate` for a CBOR-content-type body;
  - `POST /utils/txs/evaluate/utxos` for JSON containing hex text `cbor`.
- Its [`TxEvaluationService`](https://github.com/bloxbean/yaci-store/blob/v2.0.7/components/submit/src/main/java/com/bloxbean/cardano/yaci/store/submit/service/TxEvaluationService.java) wraps v5 evaluator success in `result.EvaluationResult`, matching the consumer shape Lucid expects when evaluation succeeds.
- Therefore, prior diagnostic run #2113 did **not** test the provider's actual route: it sent invalid `{}` as `application/cbor` to `/utils/txs/evaluate`. Its HTTP 400 was reachability/parser evidence only, not compatibility evidence.
- The new probe builds an unsigned, no-Plutus transaction locally and in memory, compares Lucid's JSON route with the classic route, and invokes the locked provider's own `evaluateTx`. It records endpoint status, bounded response schema/error summaries, CBOR length/hash and evidence path. It never signs or submits this probe transaction, invents exunits, or alters V3/Reveal semantics.
- **Known minor diagnostic defect:** the current `evaluatorModeMatch` regular expression has an escaping error and can report `NOT_RECORDED` even when the log contains the evaluator mode. The raw sanitized Yaci log remains available to inspect, but the structured mode field must be treated as invalid until corrected. Defer this correction until run #40067396869 completes, because the workflow has `cancel-in-progress: true` and another branch update would cancel the active run.

### C. Credential/artifact finding and fix

- A direct scan of the still-unexpired artifact from run #2086 (ID `12525975775`) found 40 unique 121-character tokens in the `ed25519e_sk...` format in `yaci.log`, next to Payment Key / Staking Key labels. Values and fingerprints were not copied into logs, comments, or evidence.
- A separate scan of the prior run #2113 artifact (ID `12549495517`) found no `ed25519e_sk` tokens—the existing regex covered that key format—but one `Mnemonic:` field still contained the local test-wallet phrase. This violates the artifact no-seed rule even though the phrase belongs to the local-devnet test fixture. No phrase is reproduced here.
- New shared sanitizer `sanitize-yaci-log.mjs` removes ANSI CSI codes before pattern processing, redacts `Mnemonic:` phrases, redacts labelled Payment/Staking Key tokens, and redacts unlabelled `ed25519e_sk...` tokens.
- Synthetic regression `sanitize-yaci-log.test.mjs` verifies each category with fake, non-secret values. Run #40067396869 step `Verify Yaci log sanitizer with synthetic fixtures` completed **success** before Yaci startup.
- The workflow uses the shared sanitizer for timeout output and sanitizes the log in place before stdout/artifact upload. If final sanitization fails, it deletes the raw log rather than uploading it and marks failure.
- **Security remains BLOCKED — OWNER ACTION REQUIRED:** artifacts #2086 and #2113 are not retroactively repaired by source changes; the connector still provides no artifact deletion action. Owner to remove/restrict access to both artifacts if supported, confirm that the generated devnet keys and local wallet fixture were never reused, and rotate/revoke any reusable credential. No conclusion of “no real key reuse” can be drawn from repository evidence alone.

### D. State update

| Gate | Status at this refresh | Evidence / blocker |
|---|---|---|
| Valid-CBOR provider contract | **YELLOW — TEST IN PROGRESS** | Run #40067396869 has not yet reached Yaci/provider evaluation; exact route/schema are grounded in pinned source, runtime result pending. |
| Evaluator mode in structured evidence | **YELLOW — PARTIAL** | Raw log can evidence mode; new probe's mode regex needs correction after the active run finishes. |
| New Yaci log sanitizer | **GREEN — TESTED BOUNDED** | Synthetic test passed in run #40067396869 before Yaci startup; artifact-level verification of this replacement run remains pending. |
| Historical artifacts | **BLOCKED — EXTERNAL** | Artifacts #2086 and #2113 remain available and require owner containment. |
| V3 / Reveal | **UNCHANGED** | No validator/source/semantic edits; the replacement run has not yet reached V3. |
| Treasury Observer / Preprod address | **BLOCKED — EXTERNAL** | No observer dispatch; `DEMETER / vars.VITE_TREASURY_ADDRESS` still needs independent owner verification. |

### E. Next actions

1. Let run #40067396869 reach the valid-CBOR probe; inspect actual HTTP responses, provider result/error, evaluator mode in the sanitized log and artifact digest. Do not rerun before checking concurrency.
2. After that run completes, fix mode extraction on the existing PR branch, then run focused sanitizer and Integration Lab tests only after checking no active same-ref run.
3. Repository owner contains artifacts #12525975775 and #12549495517 and confirms non-reuse of any exposed credentials. The Treasury Observer remains disabled until the configured address is independently verified.

**Overall classification:** PARTIAL / OPEN. The sanitizer regression passed, but Yaci provider evaluation on the new head has not yet been observed. No Preprod transaction, signing, bootstrap, mint, swap or Treasury action was performed.


## 10.27 — Agent B B6 correction: Treasury scenario simulator exists; real DEX route remains unproven (2026-10-24)

**Classification:** bounded code/test audit across branch trees plus local execution of the simulator's existing synthetic test suite. No DEX, route, swap, Treasury operation, or Preprod transaction was constructed or submitted.

### What exists

The current `work/immortal-green-closure` tree at `eab461e7b7cfe3c4ca37c9c5987f055212116c3a` contains:
- [Manual workflow: `treasury-liquidation-simulation.yml`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/treasury-liquidation-simulation.yml)
- [Simulator: `treasury-liquidation-simulation.mjs`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/cardano-integration/treasury-liquidation-simulation.mjs)
- [Synthetic tests: `treasury-liquidation-simulation.test.mjs`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/cardano-integration/treasury-liquidation-simulation.test.mjs)
- [Route blocker / evidence limitations: `TREASURY-LIQUIDATION-SIMULATION-ROUTE-BLOCKER-2026-10-22.md`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/TREASURY-LIQUIDATION-SIMULATION-ROUTE-BLOCKER-2026-10-22.md)

The workflow is manual-only and takes explicit input values for asset quantity/scale, asset value removed from EEV, gross USDM proceeds, execution costs, pre-sale EEV and ProtectedCapital. The script performs deterministic integer arithmetic, creates a digest, and checks net proceeds / post-buffer conditions. It expressly states that this is arithmetic over supplied inputs, not DEX/AMM execution; `OBSERVED_EXECUTION` is only a caller-supplied label and external evidence must independently substantiate it.

### Test evidence

I reconstructed the exact simulator and test file contents from the verified branch files into a temporary local test directory and ran:

`node --test treasury-liquidation-simulation.test.mjs`

Result: **5/5 tests passed** (scenario pass, buffer erosion, negative post-buffer, missing input rejection, and costs exceeding gross proceeds). This is a local test of the checked source contents; it is not a GitHub Actions run or any on-chain/DEX evidence. The manual workflow was not dispatched.

### Branch-wide structural search

Fetched non-truncated recursive Git trees for all 26 refs returned by the repository's current branch listing. The explicit liquidation simulator workflow/script/test/blocker paths are present on `work/immortal-green-closure`; the other 25 reviewed branch tree snapshots did not contain similarly named swap/DEX/liquidation implementation paths. This is a path-level census, not a line-by-line semantic audit of all historical blobs, and does not prove no swap logic could exist under a differently named file or external adapter.

Targeted indexed code searches for Minswap, SundaeSwap, `swapExact`, `swapAssets`, and `tADA tUSDM` returned no implementation matches on the indexed default-branch content. Combined with the inspected `plutus/Treasury.hs` (legacy `Distribute` only), no concrete route was found that binds a Treasury-owned asset input, a specific DEX/AMM pool/route, min-USDM output/slippage protection, execution costs, and the received USDM to one transaction.

### Updated B6 state

- **Scenario arithmetic simulator:** IMPLEMENTED; its five synthetic tests pass locally.
- **Treasury DEX/AMM integration:** NOT_PROVEN / no verified route found in the checked scope.
- **Actual swap execution / net proceeds / ledger transaction evidence:** NOT_PROVEN.
- **Treasury deployment identity/custody:** remains separately blocked; the historic route-blocker document explains that artifact-derived Treasury candidates returned zero UTxOs while the deployment-configured `VITE_TREASURY_ADDRESS` is not independently exposed in public source. Do not infer the Treasury address from holders or balances.
- **QNE or economic viability:** not proven by one scenario. No new economic policy or pricing/route assumption has been introduced.

**Next step:** ask Agent A/C to supply the governed asset valuation and execution-cost contract and an independently evidenced Treasury identity; then select a concrete route only if already authorized. Any later route proof must bind exact transaction CBOR/hash, Treasury-owned input UTxO, pool/route identity, minimum output, actual received canonical USDM, fees, and authenticated post-state EEV/ProtectedCapital. Until that evidence exists, the simulator remains a scenario calculator, not liquidation readiness.


### 10.32 — Agent C: live HEAD refresh, B3-B artifact integrity, and C0–C15 execution register — 2026-10-24

**Nature of this update:** fresh GitHub reads plus download and digest verification of one existing B3-B artifact; no new protocol test or workflow dispatch. Classifications below use the mandate vocabulary. They do not upgrade source inspection to execution evidence.

#### Current refs reconfirmed

| Ref | Observed HEAD | Role / decision |
|---|---|---|
| `work/immortal-green-closure` | `a41e69d654cd63672c84242d332e5322f8ec622b` | Coordination/checkpoint; latest observed commit classifies Treasury liquidation as scenario-only. |
| `work/b3-materios-provenance-evidence` | `722aef11c5f557897bbf8a51774cfec7a89af3f3` | B3 evidence; no later witness-producing change observed. |
| `review/treasury-readonly-observer` | `75427c3813aa2e77aad84970ed5298fde6d333ca` | Treasury read-only observer; no dispatch or Preprod observation performed. |
| `main` | `97b09a38742098f17a61eb07734c401aeedccc06` | Protected public baseline; unchanged in this refresh. |
| `merge/workflow-b-closed-main` | `7bca8d91b65d7af1261d8b7cc4f28f496a73fcba` | PR #35 head; no promotion. |
| `b1-hardening` | `c561393e7eb842529aeaa272377e5afe0138d085` | Aegis/hardening evidence lane; historical experiment is synthetic/offline. |
| Materios upstream `main` | `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` | The upstream RPC/source revision checked for C0–C3. |

Checkpoint file blob before this append: `af01260dde3ffc68bc4c4b16d172938978e20864`. PR #35 was re-read: OPEN, DRAFT, unmerged. No branch was created or deleted, no merge/rebase/cherry-pick/force push occurred.

#### C2 — B3-B artifact integrity recheck

Downloaded existing GitHub Actions artifact [#12492463295](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39933665986/artifacts/12492463295), `materios-b3b-live-storage-proof`.

- ZIP SHA-256 recomputed from downloaded bytes: `2c78c35352fdce044049cbe50a000702ae1705b6430f26a61dcb02e4e825c26a`, matching the GitHub artifact digest exactly.
- Extracted JSON: `MateriosB3BLiveStorageProof.json`, size 14,841 bytes; raw JSON SHA-256 `10d96b214ff267c096e99acb597d532b8d9cdd94017f2fc9876d91eaac77e5fb`.
- Internal `evidence_sha256` is `f596953cb94a0b1a92c02fa63c759d707340591b82aa23a7fe45c65bba15fb73`; re-computation over the JSON object with that digest field omitted, pretty-printed with a trailing newline (the artifact's declared convention), matches exactly.
- Claimed receipt ID: `0x09f6bec6aff0c3b90c08848cebd4f8ccfd87ce6a1d187baf9fabd914feb22f44`.
- Certified block and observed finalized head both report height `2409483`, hash `0x6ee0dde8e6d7d1a4ecb599cbaa34ab4064b13e0c6f683948fbbf263ad81fff28`; StateRoot `0xd832cf37f026d63675d3b5a6e85ce2c64a35b7d9e1a5e71b95a058e30aeb3793`.
- `read_proof.at` matches that same block hash; the artifact declares 10 nodes and contains 10; storage key is 80 bytes and storage value 330 bytes. The artifact's `transport_checks` record these structural/binding checks.
- **Caveat:** the artifact's `receipt.certification.signers` field is `0`. This recheck did not interpret that field as a verified signer set and did not re-run the native cryptographic verifier. The prior exact-source workflow job records B3-B native verification as PASS, but the observation itself is not a GRANDPA proof, certificate-signature validation, or complete C2 closure.

**C2 classification remains PARTIAL.** Work performed: artifact downloaded, ZIP digest and internal JSON digest re-computed; key block/hash/root/key/value/node relationships checked structurally. Test re-execution in this cycle: NOT_RUN. Closure still requires independently reproducible StateRoot/storage proof verification tied to authenticated finality and authority provenance, without promoting B3-B to B3-A.

#### C5 — JEV workflow boundary recheck

- Workflow blob on green: `.github/workflows/jev-materios-live-ingress.yml` = `3f22c38f17426872b33068137c59919ef73192fe`; script blob `scripts/build-jev-materios-registry.mjs` = `986ba29a8944952aaa8870226510869f4bf6018d`.
- The workflow is `workflow_dispatch` only. It extracts and records an observation, then builds an observation-only registry. The registry builder explicitly marks GRANDPA finality, storage proof and canonicality as skipped absent independent verifier inputs, and exits nonzero when overall result is not PASS. The workflow sets `continue-on-error: true` on that registry-build step, then uploads any produced registry and explicitly states that extraction is not finality/canonicality.
- This is **not** proof of autonomous scheduling or end-to-end JEV verification. The tolerated non-PASS result is consistent with the workflow's declared observation-only role, but a green workflow status must not be re-labelled as a successful JEV verification cycle. No dispatch, live observation or new registry build was run.

**C5 remains INCONCLUSIVE.** Next closure action: exact-head run chronology plus a demonstrated no-user-input scheduled/triggered consumer cycle that consumes the newest valid registry; prove stale, duplicate, missing and failed registry cases remain non-positive.

#### C0–C15 register at the refs above

| ID / front | Branch and observed ref | Current status | Evidence and operations in this pass | Blocker / exact next action and closure condition |
|---|---|---|---|---|
| **C0 Receipt provenance** | Materios `main` `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` | **PARTIAL** | Re-fetched source blobs: `tools/explorer/app.py` `fc7e8f045f9319c2aa6ceb11c83ec5fc5f5076a1`; `tools/explorer/chain.py` `18d79766bb49efdd89c6c10ff14c928dd6a3411a`; `tools/materios-verify/materios_verify/core.py` `bcd21c3c942e3a3b7fbac234865b69050283831a`; `tools/explorer/static/app.js` `b5c214e943dfff17237f837e65fbbbb9a922a270`. The §10.30 source risks remain present in the same source revision. | External repo: prepare a minimal proposal + regression vectors for index fast-path not implying crypto PASS and missing manifest/event => non-positive; verify full Receipt universe/pagination and Cardano inclusion/finality before any universal claim. Do not patch upstream without authorization. Close only on per-Receipt recomputation and complete coverage. |
| **C1 B3-A GRANDPA** | B3 `722aef11c5f557897bbf8a51774cfec7a89af3f3`; upstream `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` | **BLOCKED_EXTERNAL** | Existing run #39933665986 remains tied to source `11fae8a1f030bcbe177eab6ee2ae99a96f080ca6`; witness job failed. No new source or witness found. | Request authorized archive/full-node operator for a real SCALE `FinalityProof<Header>` / FRNK justification plus ancestry for an exact block; authenticate genesis and every authority transition; independent signatures/quorum/target verification must pass. |
| **C2 B3-B storage** | B3 `722aef11c5f557897bbf8a51774cfec7a89af3f3` | **PARTIAL** | Artifact #12492463295 ZIP digest and internal JSON digest rechecked; block, hash, StateRoot, proof key/value and 10-node count bind structurally. Prior exact-run native proof job PASS. | Re-run proof verifier from captured bytes in a reproducible runner, tie target to C1 authenticated finality and authority state; explain/validate `signers: 0` field. Until then not end-to-end. |
| **C3 authority selection / B3-C** | B3 `722aef11c5f557897bbf8a51774cfec7a89af3f3`; upstream main above | **BLOCKED_EXTERNAL** | Proof contract reread. Upstream issue #50 is closed `not_planned`; current `partnerchain/node/src/rpc.rs` blob `30827863c7b8f6fb507b008cee9f572ec48fe06f` does not register the execution-proof RPC. Execution proof and GRANDPA finality remain different claims. | Authorized upstream/endpoint path must return runtime execution proof for exact block/method/input/result and state witness; bind runtime code/version and canonical finality/transition. No local selector substitute. |
| **C4 Workflow B / promotion** | green `a41e69d654cd63672c84242d332e5322f8ec622b`; PR #35 head `7bca8d91b65d7af1261d8b7cc4f28f496a73fcba`; main `97b09a38742098f17a61eb07734c401aeedccc06` | **PARTIAL** | PR #35 confirmed OPEN/DRAFT/unmerged. No promotion. | Reconcile exact base/head evidence; verify policy checks on the trusted base after governance/bootstrap review. Do not mark ready or merge; closure is a reviewed, reproducible gate rather than draft metadata. |
| **C5 JEV autonomy** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **INCONCLUSIVE** | Manual ingress workflow and observation-only registry source reviewed; no dispatch or live cycle. | Demonstrate scheduled/automatic cycle and downstream consumption of latest valid registry; inject stale/missing/duplicate/failing records and prove none produce a positive overall result. |
| **C6.1 universal kernel** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **PARTIAL** | Normative kernel distinguishes abstract safety/viability and certified under-approximation obligations; implementation blobs previously noted in §10.29. | Map normative property → implementation → state projection → tests; run chain-neutral fixtures. No claim of certified concrete `K_c` absent CK1–CK8 evidence. |
| **C6.2 consumer/boundary map** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **BLOCKED_INTERNAL** | Checkpoint records consumer map incomplete; no exhaustive tree-wide call-site map was executed in this pass. | Enumerate actual type/function imports and consumers on exact green HEAD; classify universal/profile/adapter/evidence/legacy, then attach one contract and tests per consumer. |
| **C6.3 Kc/Ω viability** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **BLOCKED_INTERNAL** | Normative `03_ECONOMIC_KERNEL_FINAL.md` explicitly requires effective membership and CK1–CK8 as conformance obligations, not a theorem from finite tests. | Produce proof/inductive invariant or sound finite-domain certificate over authoritative Ω plus non-vacuity and acceptance-compatible inductiveness; any missing economic policy remains a decision, not an invented constant. |
| **C6.4 reference adapter** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **PARTIAL** | Reference conformance methodology remains draft/open; executable seed vectors do not certify an operational adapter. | Inventory vector coverage, typed errors, serialization and deterministic replay; run exact-head contract suite. |
| **C6.5 multi-adapter** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **PARTIAL** | Multiple adapter/trust-model documents exist; no equivalent second adapter conformance evidence revalidated. | Identify implemented adapters from source, run the same canonical vectors against at least one distinct adapter; documents alone do not count. |
| **C7 public observability** | green `a41e69d654cd63672c84242d332e5322f8ec622b` / upstream explorer revision above | **PARTIAL** | Public transparency contract defines freshness/UNKNOWN/HALTED concepts, but live UI/API-to-source bindings not rechecked. C0 explorer has explicit source-level overclaim risks in §10.30. | Trace each public state/badge/API response to verified evidence object; stale/missing/mismatch test cases must not render verified. |
| **C8 Paper Tranche 1** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **BLOCKED_INTERNAL** | `PAPER_TRANCHE_1_RELEASE_AUDIT.md` blob `16ccbb4b837941474f41f5ac0e1e00394a94adf6` says NOT READY; claim traceability/manifest remain provisional. | Refresh every claim at exact current sources/runs/artifact digests; archive a frozen release snapshot and complete related-work review; do not submit claims depending on missing native Reveal or B3 evidence. |
| **C9 Strategy Explorer** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **NOT_RUN** | Existing `state-explorer.html` is explicitly conceptual/read-only; no target execution was run. | Locate actual candidate strategy execution implementation; otherwise create only existing-spec tests and retain NOT_RUN until a valid runtime output exists. |
| **C10 fee sponsorship** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **NOT_RUN** | No dedicated verified implementation/test evidence was found in the prior tree scan; no signing/transaction executed. | Confirm if a normative implementation exists; else record implementation gap, specify test plan from existing requirements (replay/auth/limits/atomicity), no funds or transactions. |
| **C11 Beacon 4** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **PARTIAL** | Research/architecture present; no governed quorum/attestation format or deployed instance evidenced. | Obtain normative quorum/identity/conflict policy decision; test exact parser/verifier once frozen, and independently verify deployment status. |
| **C12 public surface** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **PARTIAL** | Entry-point documentation separates protocol/adapter/application but no live website/DApp conformance run was executed. | Map visible claims, labels and links to canonical sources; fix mismatches only in repository/branch under control; retain historical evidence. |
| **C13 CAROB THREE** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **BLOCKED_EXTERNAL** | No CAROB THREE code/spec path in current green tree scan. | Obtain authoritative repo or specification reference; then verify data provenance, local governance and AI certainty contract without importing PRE-RICH economic rules. |
| **C14 artifact reuse/provenance** | green `a41e69d654cd63672c84242d332e5322f8ec622b` | **PARTIAL** | Revalidated B3-B artifact ZIP + internal evidence digest, but no repository-wide exact-head artifact/cache fingerprint regression run. | Build manifest linking artifact→source SHA→workflow run/attempt→schema/toolchain/digest→claim; add stale/mismatch regression and run it on exact HEAD. |
| **C15 Aegis/replay/idempotency** | `b1-hardening` `c561393e7eb842529aeaa272377e5afe0138d085`; cross-review baseline green above | **PARTIAL** | Prior Aegis experiment explicitly synthetic/offline; does not execute Aiken predicate or Cardano transaction. No execution run in this pass. | Run existing synthetic experiment on authorized runner, then adversarial replay/duplicate-consumed-state tests on relevant implementation; do not claim deployed security from model output. |

#### Execution and limitation record

- Executed: read current branch listing (all accessible IMMORTAL branches listed by API), re-read checkpoint, re-read PR #35 metadata, re-fetched four Materios explorer/verifier source files and verified their blob SHAs, re-read JEV workflow and registry builder, downloaded B3-B artifact #12492463295 and recomputed ZIP and JSON digests, structurally cross-checked exact block/state-root/storage key/value/proof-node fields.
- Existing evidence inspected: B3 proof run #39933665986 and its artifact metadata; prior B3-C contract and upstream issue #50; current JEV source; Paper Tranche 1 release audit; current kernel normative specification; Treasury observer files/branch.
- Test/workflow execution in this pass: **NOT_RUN**. The available GitHub connector does not expose workflow dispatch or general repository shell execution. Downloaded-artifact verification is a local integrity check, not a re-execution of the native storage proof verifier.
- No upstream code modification, new PR, deployment, on-chain transaction, wallet operation, signature, Treasury run or branch promotion occurred.

**Agent C overall status remains PARTIAL.** There are concrete new verifications for repository HEADs and B3-B artifact integrity, but no C0–C15 front is upgraded to PASS by this pass. The highest-leverage independent work is C6.2 consumer mapping/C14 evidence manifest; external request stays necessary for C1/C3. This register is non-normative and does not supersede the source-of-truth hierarchy.

## 10.XXX — 2026-10-24 Agent A: Notion governance-authority crosswalk for USDM / EEV

**Classification:** source triangulation only; no normative decision adopted.

- Notion `02 — Decision Log` closes DEC-3 only as the rule that USDM is the economic/reference unit and other supported settlement assets must satisfy exact USDM equivalence under a verified valuation contract. DEC-3 does not identify a specific Cardano token and does not establish USD/USDM parity.
- Notion `09 — Definitive Decision Register` lists D-10 multi-asset as OPEN, D-11 oracle authorization/freshness/latency as OPEN, and D-13 governance authorization as OPEN.
- Notion `GOV-02 — Authority / Permission Matrix` prohibits maintainers from unilaterally redefining canonical economic semantics and requires applicable adoption gates before canonicalization. `PRE-RICH Governance Architecture v0.1` says it is a future/specification architecture rather than an active DAO, and that specification authority is retained by the project owner during the current development phase.
- The connected-source search for Slack/Drive/etc. was unavailable because Notion connector search requires Business access. Findings are therefore limited to accessible Notion pages and repository evidence; no claim of exhaustive connected-source coverage.

**Next action:** route a scoped decision proposal to the currently authorized specification owner and record adoption through the applicable canonicalization process. The proposal must separately resolve: (1) accounting-unit semantics, (2) exact Cardano policy ID + asset name permitted as physical `VerifiedUSDM`, and (3) any USD/USDM or oracle conversion rule. Agent A must not infer or adopt any of these values.

**Gate status unchanged:** candidate `tUSDM` remains `OBSERVED_NOT_QUALIFIED`; P-01/P-02/P-16 remain blocked. Do not dispatch EEV approval before the asset/denomination decision and current evidence chain are complete. No protocol code, economic constants, V3/Reveal semantics, workflow dispatch, approval, wallet signature, transaction, or on-chain state changed.

Source links:
- Notion DEC-3: https://app.notion.com/p/3d9c4454d6d581f6b1dff9bd9fa360fb
- Notion D-10/D-11/D-13: https://app.notion.com/p/3d9c4454d6d5811e8bece49c16cf2c9d
- Notion GOV-02: https://app.notion.com/p/3dfc4454d6d58107828eedf372de5242
- Notion PRE-RICH Governance Architecture: https://app.notion.com/p/3dfc4454d6d58194aa72cfb27d234166
- Repository decision record: `audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md`


### 10.33 — Agent C: universal kernel consumer map and reachability limits — 2026-10-24

**Purpose:** register the new scoped C6.2/RF8 consumer map and its exact source anchors. The new map is evidence mapping, not normative text or a closure claim.

- New document: [`docs/COORDINATION/UNIVERSAL-KERNEL-CONSUMER-MAP-2026-10-24.md`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/UNIVERSAL-KERNEL-CONSUMER-MAP-2026-10-24.md); blob `03944ff08b6712ec1a39c7a9de06261965d40320`; introduced by commit `94f9991f2d5f6377e97f0f67e8f114758d4e7d5c`.
- The map pins green source refs inspected from `70a0b0cc3ef9136c9e2972a085b27d8705c9ff5f`; the latest coordination-only green HEAD moves to the map commit. It records the universal aggregate type, `UniversalEconomicKernel`, `EconomicGate`, PRE-RICH projection/admission, Cardano `CanonicalEconomicState` and `EconomicObservation`, plus the main concrete Plutus mutation surfaces and test files.
- Exact call-boundary conclusion: `PreRichEconomicAdmission` composes structural transition, candidate state, projection, externally supplied truth/freshness/completeness/liquidity booleans and `executionAdmissible`; its existence does not show all production validators reach it. `B1PrizePool` calls universal solvency, but `MintPolicy`, `PrizeValidator`, `Treasury` and legacy `PrizePool` do not show direct `EconomicGate` calls in the reviewed sources. A predicate/import mismatch alone does not prove unsoundness; it means the common-gate/refinement relation is not yet proven.
- `Adapter/CARDANO/observation/EconomicObservation.ts` accepts a shape-valid canonical state, rejects negative timestamps, and retains optional `stateHash`; that function does not recompute the hash, authenticate origin or test age. Its documented input contract assumes an already-derived state, so callers must prove/bind that precondition rather than calling the wrapper itself an authenticated observation.
- Existing RF8 audits `RF8_NO_SIDE_DOOR_SURFACE_AUDIT_20260924.md` and `RF8_ECONOMIC_SURFACE_REACHABILITY_DELTA_20260924.md` already described missing whole-program reachability evidence. This map consolidates source identities and localizes next steps; it does not invent a new economic abstraction, amend policy or change any validator.
- **C6.2 remains BLOCKED_INTERNAL; RF8 remains OPEN.** The map does not exhaust every type consumer, script export/address/deployment ref, or deployed-path edge. No tests or workflows were executed as part of this source-map pass. Exact closure still requires whole-tree consumer/build/export reachability classification plus a negative bypass regression for each economically material path; if local predicates are intentional, show each is a semantics-preserving refinement of the same canonical admissibility relation.

**No protocol code, V3/Reveal semantics, economic constants or governance states changed.** No merge/promotion, deployment, on-chain action, or Materios upstream modification was performed.

### Agent A CI follow-up — exact-SHA results completed (2026-10-24)

On source SHA `69ff7b75e9d88672f34e12dd2719e644db02afb0`, all five checks completed successfully: [Documentation Link Check #40068368967](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068368967), [Algorithmic Governability Adversarial Lab #40068369014](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068369014), [Cardano Adapter Sale Conformance #40068369065](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068369065), [Protocol Declaration Conformance #40068369098](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068369098), and [IMMORTAL Portability Conformance #40068369200](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068369200).

**Scope limitation:** this closes conformance/documentation CI for that exact SHA only. It does not change the status of EEV qualification, physical `tUSDM` identity, oracle denomination, Treasury execution, expiry binding, or first real Issue. P-01/P-02/P-05/P-06/P-15/P-16 remain gated by the evidence and decisions listed above. The operational handoff records this result in commit [f764987f](https://github.com/LiberoNuvola/Immortal-Protocol/commit/f764987f584c3510622ede1830b7da0120ca5cbc).


### Agent A CI follow-up — checkpoint SHA verified (2026-10-24)

All five relevant conformance/documentation workflows completed successfully on checkpoint source SHA `3afdacba14cf224fafb1142ad6deb755f267bb93`:
- [Documentation Link Check #40068710183](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068710183) — success
- [Algorithmic Governability Adversarial Lab #40068710333](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068710333) — success
- [Protocol Declaration Conformance #40068710131](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068710131) — success
- [Cardano Adapter Sale Conformance #40068710120](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068710120) — success
- [IMMORTAL Portability Conformance #40068710077](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068710077) — success

This confirms CI for the updated checkpoint itself. It does not qualify the physical `tUSDM` asset, close the normative USDM denomination decision, produce fresh EV1–EV7, authorize EEV approval, prove Treasury liquidation, or establish a real wallet Issue. P-01/P-02/P-05/P-06/P-15/P-16 remain gated by their recorded evidence and decisions. No protocol code, V3/Reveal semantics, workflow dispatch, approval, wallet signature, transaction, or on-chain state was changed.


### 10.34 — Agent C: consumer export reachability, exact-SHA CI scope, and Materios patch proposal — 2026-10-24

**Current ref at start of this appendix:** `work/immortal-green-closure` was `65b30757205bad8fe05be783be8fcb445bd7cd62` before the consumer-map follow-up commit. This appendix is documentation-only; no normative or runtime files were changed.

#### C6.2/RF8 — export consumer follow-up

- Extended [`UNIVERSAL-KERNEL-CONSUMER-MAP-2026-10-24.md`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/UNIVERSAL-KERNEL-CONSUMER-MAP-2026-10-24.md). Its refreshed blob SHA is `1645a8fab08868b351c2f4149fb9737f92720d66`, created by commit `d2c1b6569310aee988e3153d712535dfaecf16ad`.
- `plutus/export/Export.hs` blob `b33cd08b2d9dc6800215e771f18d561c87bc34c7` imports/emits the active B1 factory set but not legacy `PrizePool.hs`. Classify legacy PrizePool as **not emitted by current Export.hs**; do not infer it has never been deployed or that no historical UTxO/address references it.
- `src/loadValidator.ts` blob `004c8d2281da0cb062b2e7387b597b6bd7578ae3` imports the frontend B1 factory envelopes. Six generated/frontend Plutus artifacts were fetched and their blob IDs matched pairwise (Treasury, CounterValidator, B1PrizePool factory, MintPolicy factory, PrizeValidator factory, BeaconRegistry). This is source-file equality, not proof of a fresh local build or on-chain deployment identity.
- The repo's `scripts/predeploy-check.mjs` blob `efc0eecb6ddb37ad63528d3dc15953ab7898970c` contains the required build/export/CBOR synchronization/TypeScript gate, but the gate was **NOT_RUN** in this pass because no local checkout/shell runner was available. No attempt was made to bypass this limitation.

#### Exact-SHA CI results and boundary

The relevant new completed CI runs checked out code-bearing SHA `e3dbacc7da4d7488c1bd9ba11df80bdbcc377267` (the subsequent changes from that revision through `65b3075...` and this checkpoint appendix are documentation-only):

- [Cardano Adapter Sale Conformance #4617](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068561581): **SUCCESS**. Jobs `economic-conformance` and `frontend-build` completed successfully. Logs include 99 passing Vitest tests in 13 files, separate Cardano adapter-conformance run, observation and relayer checks, and 25 passing Issue admission bridge/provider tests; frontend `npm run build` also passed.
- [Protocol Declaration Conformance #3438](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40068561563): **SUCCESS**. Four files / 16 tests passed; `npx tsc --noEmit` passed.
- `scripts/check-rf8-production-boundary.mjs` blob `84c14ec9758ec49602290a8e811ac2cb63debd7f` reported `RF8 PRODUCTION BOUNDARY CHECK: PASS`. Its actual scope is restricted to TypeScript/JavaScript direct `.signTx()`/`.submitTx()` calls under `src`, `Adapter/CARDANO`, and `relayer`, plus source-level assertions that `mint.ts` and `gameFlow.ts` use the EconomicAdmission submission helpers. It does **not** establish all validator paths invoke the universal gate or that every local on-chain predicate is a semantics-preserving refinement.
- GitGuardian result on the same checks context was **NEUTRAL**, explaining the pull request exceeded the scan-size limit. It is not evidence of a clean secret scan.

Therefore these tests support the exact-SHA off-chain boundary and conformance scope, but do not close RF8 or C6.2. Keep **C6.2 = BLOCKED_INTERNAL / RF8 = OPEN** pending full consumer + script-address/export/deployment reachability map and negative bypass regression for each economically material action. C6.1/C6.3 and all other C0–C15 statuses remain unchanged by these runs.

#### C0 — upstream fail-closed proposal prepared, not applied

Created two review-only artifacts on the IMMORTAL coordination branch:

- [Fail-closed proposal](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/MATERIOS-EXPLORER-FAIL-CLOSED-PROPOSAL-2026-10-24.md), blob `3a54c940fff47dd09267f1de388c8635c4b0af42`.
- [Unified diff proposal](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/patches/MATERIOS-EXPLORER-FAIL-CLOSED-2026-10-24.patch), blob `b098dd2ba46b8651f38870a49dec1e574773d9b8`; 8 hunks; declared hunk line counts structurally checked against the text.

The proposal targets exact upstream base `Flux-Point-Studios/materios@7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` and covers the verification-index fast path, missing-manifest/event handling, report classification requiring explicit default-false flags for GRANDPA finality, authenticated authority-set provenance and Cardano L1 inclusion, and negative regression vectors. It deliberately keeps reports partial until those missing proof implementations are real and independently wired. It does **not** implement a GRANDPA verifier, authority transition verifier or Cardano inclusion verifier.

**Testing/application status:** no upstream checkout was available to run `git apply --check`, pytest or UI tests; patch integration, all proposed tests and upstream CI remain **NOT_RUN**. The diff's hunk-count check is only text-structure validation, not patch-application validation. Materios upstream was not modified; no issue/PR was published. C0 remains **PARTIAL**, not closed. An authorized maintainer should apply/review the proposal on a disposable upstream checkout, execute the named tests and broader verifier/explorer CI, and preserve a fail-closed public UI for `PARTIALLY_VERIFIED`.

#### No-go / unchanged boundaries

No tests were run locally in this pass. No protocol code, V3/Reveal semantics, economic constants, canonical authority set, branch topology, governance or deployment state changed. No wallet/transaction/signature, external workflow dispatch, merge/promotion or direct upstream update occurred. No status in C0–C15 was upgraded based solely on the added documents or the code-bearing SHA CI listed above.


### 10.35 — Agent C: Notion reconciliation, JEV scheduler contradiction, evidence manifest, and C0–C15 status normalization — 2026-10-24

#### Refs rechecked before this update

- `work/immortal-green-closure` HEAD before this checkpoint append: `754f0fde613fa172fa9ce6964858ae47177090a9`.
- `work/b3-materios-provenance-evidence`: `722aef11c5f557897bbf8a51774cfec7a89af3f3`.
- `review/treasury-readonly-observer`: advanced to `565851fdaa356ef4e82e6abc909664cf1854ca83`; its latest change is a diagnostic evidence capture in `audit/cardano-integration/v3-carrier-ledger-probe.mts`. Agent C did not edit this branch; see branch commit and respective agent handoff for interpretation.
- `main`: `97b09a38742098f17a61eb07734c401aeedccc06`.
- `merge/workflow-b-closed-main`: `7bca8d91b65d7af1261d8b7cc4f28f496a73fcba`.
- `b1-hardening`: `c561393e7eb842529aeaa272377e5afe0138d085`.
- Materios upstream `main`: `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30`.
- PR #35 remains OPEN/DRAFT/unmerged. No branch topology or governance change performed.

#### C14 — scoped reusable-evidence manifest added

Created [`docs/COORDINATION/AGENT-C-EVIDENCE-REUSE-MANIFEST-2026-10-24.md`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/AGENT-C-EVIDENCE-REUSE-MANIFEST-2026-10-24.md), current blob `9b20cd334c4bf62085452cf04cd534bea83d4a29`, commit `754f0fde613fa172fa9ce6964858ae47177090a9`.

It catalogues the B3-B storage artifact, two code-bearing exact-SHA conformance runs, five exact-HEAD CI runs on `2869177...`, five CI runs on the documentation commit `4b352381...`, the Materios C0 source review/patch proposal, six generated/frontend script artifact pairs, and the current JEV schedule contradiction. The item-level table separates reusable claims from limitations and explicitly records `NOT_RUN` where proof/tests were not executed. The catalogue is **scoped**, not yet the complete automated repository-wide evidence index; C14 remains PARTIAL.

Latest exact-HEAD workflows observed on `4b3523814713690b64abd1629601e3bd0f097401` were all SUCCESS:
- [Cardano Adapter Sale Conformance #40069566957](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069566957)
- [Protocol Declaration Conformance #40069566966](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069566966)
- [IMMORTAL Portability Conformance #40069566940](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069566940)
- [Algorithmic Governability Adversarial Lab #40069566994](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069566994)
- [Documentation Link Check #40069566942](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069566942)

Those workflows ran before the manifest was extended at `754f0fde...`; the intervening changes are documentation-only. They do not prove any external Materios claim, live transaction, deployment, economic approval, or C6.2 closure.

#### Notion triangulation and precise status deltas

Notion is treated here as project-state/work-program evidence, not a cryptographic trust anchor. Relevant pages and last-edit dates observed:
- [Autonomous Verification Control Plane](https://app.notion.com/p/3e2c4454d6d5819cbec1c6edede714b3?pvs=204), 2026-10-24 05:52 UTC.
- [Workflow C — Autonomous Verification & Execution](https://app.notion.com/p/3fdc4454d6d581378702e9ae9d9fee85?pvs=204), 2026-10-18.
- [CAROB Repository Gate](https://app.notion.com/p/3efc4454d6d58118bc68e3013e3260b1?pvs=204) and [CAROB E14 requirements](https://app.notion.com/p/3efc4454d6d5816085c2e7e8d7b4a1c3?pvs=204), 2026-10-04.
- [IMMORTAL V2 Strategy Exploration](https://app.notion.com/p/3f0c4454d6d58148b23bdda21d3e1349?pvs=204), 2026-10-08.
- [Economic Usage Fee & Adapter Settlement Workflow](https://app.notion.com/p/3e0c4454d6d581f9b78fd05de6ea7763?pvs=204) and [Fee-Bearing Transition Matrix](https://app.notion.com/p/3e0c4454d6d581dbbff3fff71321aa95?pvs=204), 2026-09-19.
- [Beacon 4 workflow](https://app.notion.com/p/3f3c4454d6d5813aa9b2f9b78a324336?pvs=204), 2026-10-11; [B1 hardening work program](https://app.notion.com/p/3f7c4454d6d581e78e38f8983b12ed54?pvs=204), 2026-10-12.
These workspace pages help classify scope and open decisions; the checked CAROB pages identify themselves as research/gate documents, not implementation verification.

**C5 status change: INCONCLUSIVE → BLOCKED_INTERNAL.**
- The Control Plane page asserts that an hourly JEV automation was enabled, but an actual current task-state query returned that task disabled, with its last run at `2026-10-19T07:42:01Z`; the saved operating prompt authorizes only `release/public-main-curated-2026-09-24`, which conflicts with this mandate’s branch `work/immortal-green-closure`. The two-step required autonomous loop (first scheduled run consumes a branch-bound prompt and records its exact result; second scheduled run resumes from that record without user input) remains unobserved.
- Repo-side JEV workflow `.github/workflows/jev-materios-live-ingress.yml` is manual `workflow_dispatch` and explicitly says it only extracts a checkpoint; it does not verify GRANDPA, storage proof or canonicality. Registry generation intentionally marks those missing checks skipped/NOT_RUN and returns non-PASS.
- No scheduler was enabled/retargeted and no workflow was dispatched in this pass. Next action requires explicit, coherent branch authorization for the existing scheduler, then observe two complete scheduled iterations with branch-bound prompt, run, registry, artifact digest and Notion registration. Do not infer autonomy from a workflow schema or green build.

**C9 status change: NOT_RUN → NOT_APPLICABLE for IMMORTAL V1 closure.**
- Notion labels Strategy Exploration an IMMORTAL V2 future draft and explicitly says it is not part of V1 closure and must not introduce scope creep.
- Current `state-explorer.html` blob `7d070b45bcb8a2477ea5813dc8ba151cdbe6ae3c` is read-only conceptual explanatory UI, not a candidate-strategy runtime or oracle.
- No strategy execution was run. Keep the V2 idea in the roadmap, but do not manufacture a V1 runtime/test to close this front. If/when V2 receives an authorized implementation scope, define candidates, execution boundary, state fixtures and expected results first.

**C10 status change: NOT_RUN → BLOCKED_INTERNAL.**
- Notion’s fee workflow is marked CONSOLIDATED only for observed-cost learning and has explicit OPEN numerical/parameterization questions; the fee-bearing transition matrix remains OPEN and Workflow C describes sponsorship versus application balance as research alternatives, not a frozen decision.
- No current repository source/test establishes an implemented Cardano fee-sponsorship product. Tests/transactions: NOT_RUN; no funds or transactions were used.
- Next action: reconcile Fee Ownership/Transition Matrix, cost model and signed-transaction authorization boundary against normative source hierarchy; submit any exact unresolved policy questions to the owner. Once an authorized specification exists, add offline replay/auth/limits/error tests and only then run them. Do not invent fee coefficients, sponsor commitments, or an alternative transaction-signing path.

**C13 status change: BLOCKED_EXTERNAL → BLOCKED_INTERNAL (research gate).**
- The previously reported absence of CAROB code in IMMORTAL’s tracked tree remains true, but current Notion material makes the actual gate explicit: Repository Gate says **DEFERRED / do not create a repository** until E1–E4 prove a domain-blind capability, domain substitution, adapter blindness, and REJECT preservation; E14 says Carob first needs a domain profile, evidence semantics, scope/authority rules, conformance vectors and existing-stack integration mappings, not a new runtime.
- Therefore an unknown upstream code repository is not the immediate blocker. The blocker is incomplete internal E1–E4/profile/conformance work, and creating a Carob repo or importing PRE-RICH semantics would violate the current decision. No repo was created and no new AI certainty/voting threshold was invented.
- Next action: continue within CAROB’s authorized research/workspace scope with E1–E4 and a replayable cross-domain reject-preservation fixture; field pipeline/NFT criteria follow the profile decision, not before it.

#### Current C0–C15 status register

| ID | Current classification | Status delta vs §10.32 | Closure-critical next action |
|---|---|---|---|
| C0 Receipt provenance | **PARTIAL** | unchanged | Maintainer-reviewed application/tests of the fail-closed proposal against the exact Materios base; then independently verify finality, authority transitions, L1 inclusion and full Receipt coverage. |
| C1 B3-A GRANDPA | **BLOCKED_EXTERNAL** | unchanged | Authorized full/archive-node operator supplies real SCALE finality proof/FRNK justification and ancestry; verify target, signatures/quorum and authenticated authority transitions. |
| C2 B3-B storage | **PARTIAL** | unchanged | Re-run native verifier from the artifact bytes on a reproducible runner and bind the target to authenticated finality; interpret `signers=0` without overclaim. |
| C3 B3-C authority selection | **BLOCKED_EXTERNAL** | unchanged | Real exact-block runtime execution proof plus genesis-bound authority-transition chain; no local selector. |
| C4 Workflow B / promotion | **PARTIAL** | unchanged | Reconcile PR #35 candidate refs and review fail-closed gates; no merge/promotion. |
| C5 JEV autonomy | **BLOCKED_INTERNAL** | INCONCLUSIVE → BLOCKED_INTERNAL | Resolve scheduler disabled/branch mismatch; observe two consecutive scheduled branch-bound iterations and evidence registration. |
| C6.1 Universal kernel | **PARTIAL** | unchanged | Map invariants to implementations and run chain-neutral fixture set; CK1–CK8 certificate remains open. |
| C6.2 Consumer/boundary map | **BLOCKED_INTERNAL** | unchanged | Complete all type/action/script-export/address/deployment consumers; prove per-action refinement and add negative bypass regressions. |
| C6.3 Kc/Ω viability | **BLOCKED_INTERNAL** | unchanged | Produce the required invariant/certificate over authoritative Ω and prove non-vacuity/inductiveness without invented constants. |
| C6.4 Reference adapter | **PARTIAL** | unchanged | Run the full reference-adapter contract suite at a pinned code head with serialization/error/replay evidence. |
| C6.5 Multi-adapter | **PARTIAL** | unchanged | Run shared canonical vectors against a second implemented adapter; documentation alone is insufficient. |
| C7 Public observability | **PARTIAL** | unchanged | Trace every public badge/value to a verified evidence object and test stale/missing/mismatched cases. |
| C8 Paper Tranche 1 | **BLOCKED_INTERNAL** | unchanged | Freeze claims against exact source/test/artifact refs; release audit currently says NOT READY. |
| C9 Strategy Explorer for V1 | **NOT_APPLICABLE** | NOT_RUN → NOT_APPLICABLE | Retain as future V2 roadmap only; re-open after a specific authorized V2 implementation scope. |
| C10 Fee sponsorship | **BLOCKED_INTERNAL** | NOT_RUN → BLOCKED_INTERNAL | Resolve normative ownership/parameterization choices first; implementation/security tests remain NOT_RUN. |
| C11 Beacon 4 | **PARTIAL** | unchanged | Keep HYPOTHESIS/OPEN; freeze quorum/schema via authorized governance before verifier/deployment claims. |
| C12 Public surface | **PARTIAL** | unchanged | UI/API/status labels must distinguish implemented/tested/verified/deployed/live with a traceable source. |
| C13 CAROB THREE | **BLOCKED_INTERNAL** | BLOCKED_EXTERNAL → BLOCKED_INTERNAL | E1–E4/profile/conformance research; repository gate remains deferred, no new repo. |
| C14 Evidence reuse | **PARTIAL** | unchanged | Extend the scoped manifest to all evidence-producing workflows and machine-enforce source/digest/freshness matching. |
| C15 Aegis | **PARTIAL** | unchanged | Execute the existing adversarial runner against the real relevant implementation; synthetic/offline model evidence remains scoped only. |

#### Test / operation log for this continuation

- **Executed:** re-fetched current branch list, current checkpoint, C0 source proposal, universal consumer map, scoped evidence manifest; queried actual JEV scheduler status; fetched current Notion Workflow C, Control Plane, Carob Repository Gate/E14, Strategy Explorer, fee workflow, Beacon 4 and Aegis pages; queried exact workflow status on SHA `4b352381...`.
- **Existing CI observed:** five workflows on `4b352381...` were SUCCESS (links above); their scope is recorded in the evidence manifest. Prior detailed code-bearing CI at `e3dbacc...` remains a separate exact-SHA observation.
- **Tests run in this continuation:** no local test suite, native B3 verifier, predeploy check, upstream Materios tests, JEV ingress or JEV scheduled run was executed. Mark all of those NOT_RUN.
- **Side effects:** docs-only IMMORTAL coordination commits; no protocol implementation/normative change, no direct upstream Materios update, no scheduler activation/retarget, no merge, promotion, deploy, wallet, signature, transaction or funds operation.

**Overall Agent C remains PARTIAL.** Concrete progress now includes a fail-closed Materios proposal (not applied), C6.2 source map plus export reachability, a scoped C14 evidence-reuse manifest, a fresh authenticated artifact-digest check, exact-SHA CI triangulation, and a resolved C5 automation-state contradiction. External B3-A/C source evidence and internal C6 consumer/viability, C8 claims, C10 specification and CAROB E1–E4 remain open.


### 10.36 — Agent C: public-surface claim-to-evidence and runtime wiring map — 2026-10-24

- New source-level map: [`docs/COORDINATION/PUBLIC-SURFACE-CLAIM-MAP-2026-10-24.md`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/PUBLIC-SURFACE-CLAIM-MAP-2026-10-24.md), blob `45336a1960fe49a25deba182b32155d98ce84389`, added in commit `d7ed23e1b3832ce543ec077203d296f6b6b0c0fc`.
- Static public claim review: root `live.html` is explicit that blank values mean missing evidence, and it reports B3 canonicality/witness and Reveal as open/pending. `web/verification-lab.html` is explanatory rather than a verifier. `web/status.html` carries a dated snapshot label `main @ 8c6873e · 2026-10-02 04:51 UTC` and separates working evidence on green; do not interpret its published status as a current live-head report.
- Wallet/Treasury observation: `src/live.ts` uses a user-triggered CIP-30/Lucid/Blockfrost path to query configured addresses and sum PRE assets; missing config is explicit. The observed-at value is local wall-clock time, and the rendered totals are not bound to a block hash/slot, UTxO reference list, StateRoot, finality proof or verifier digest in this source. No wallet was connected or live observation run.
- Dynamic Protocol Declaration integration gap: current green `src/main.ts` blob `819b199356c6d407af511ed1dbf7fa1ad5ceddc0` has zero source occurrences of `mountProtocolDeclaration`, `observePreRichProtocolDeclaration`, `declarationPublishable`, `protocolDeclarationObservation`, or `publicProtocolSurface`. `src/ui.ts` blob `de77a57b5e7609d31a6b3d0612277f43c12a4979` also has none. Helpers/types/tests exist separately but are not wired to the principal DApp entrypoint at this ref.
- Those declaration helpers do not independently establish canonicality: `declarationPublishable` is a nonempty-shape check; the observation helper accepts lifeState/status/optional Beacon as caller-supplied inputs, emits a local timestamp, and uses a tx/output reference but does not verify inclusion/finality. The rendering helper uses `textContent` safely, but assumes its input was already authoritative.
- **C7 and C12 remain PARTIAL.** Inspected static copy does not justify an unapproved change; its open/frozen evidence labels are explicit. The actionable gap is runtime declaration wiring plus cryptographic/freshness/source binding for provider observations. Tests and live site verification in this pass: **NOT_RUN**. Browser, wallet, Blockfrost and Cardano runtime were not invoked.
- Acceptance route: decide whether the declaration helper is to remain intentionally unused in V1 or be wired only after its authoritative inputs and verifier contract are specified; add negative cases for stale/missing/ambiguous/mismatched source state; then validate the published surface against exact source and evidence refs. Do not turn local timestamp or provider query into a finality claim.
- No protocol code, public HTML copy, C0 patch, economic logic, V3/Reveal semantics or deployment was changed in this review. C7/C12 status did not upgrade.



### 10.37 — Agent C: current-ref checkpoint/C0 confirmation and execution boundary — 2026-10-24

**Checkpoint read first:** current file blob `76fc02962af3248268175159714c97ca182c492e`; its tail already contains sections 10.35 and 10.36, including the current C0–C15 status register and recent C6.2/C7/C12 work. Those newer entries supersede older summaries where they differ. No status is upgraded merely by rereading them.

#### Exact-ref reconfirmation

- IMMORTAL coordination branch: `work/immortal-green-closure`; checkpoint blob immediately before this append: `76fc02962af3248268175159714c97ca182c492e`. The latest branch-visible coordination state includes §10.36; prior known checkpoint commit `41dd9b084c9d0ccaad1303a3583a364815a4bf95` is not treated as the current tip solely because it was cited in an earlier mandate.
- Materios upstream `main`: `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30`. Latest repository commit search remains on the 21 Oct 2026 sccache/CI merge; no later source commit surfaced in the current query.
- Re-fetched current source blobs: `tools/explorer/app.py` `fc7e8f045f9319c2aa6ceb11c83ec5fc5f5076a1`; `tools/materios-verify/materios_verify/core.py` `bcd21c3c942e3a3b7fbac234865b69050283831a`; B3 `poc/materios-checkpoint/src/rpc.ts` `74f983d5980f25452c6517024528528fdbbfce43`; B3 authority proof contract remains present and continues to prohibit a local selector substitute.
- Exact Materios source review reconfirmed the `/api/verify/{receipt_id}` index fast path: any HTTP 200 from `/verification/{id}` yields `verified: true` and nine synthetic `pass` statuses. The exception path silently falls through to scanning. This remains a source-level fail-open defect/risk; no live exploitation or deployment behavior is asserted.
- The existing source review still identifies slow-path missing-manifest and missing-event cases as warning-plus-pass, and does not implement independent GRANDPA finality, authority-transition authentication, or Cardano L1 inclusion verification. “Every Receipt lineage is live” is therefore not independently demonstrated by this source snapshot.
- Search of the IMMORTAL traceability matrix on `main` found existing formal results including shared-reserve counterexample T18 and composition obligations C-COMP/X1–X7; this is documentation evidence, not a substitute for executing universal-kernel conformance fixtures. C6.1 remains PARTIAL, C6.2 remains BLOCKED_INTERNAL, and C6.3 remains BLOCKED_INTERNAL per §10.35.
- Current open PR search still surfaces PR #35 as draft/bootstrap and PR #36 as a draft read-only Treasury observer; neither is merged or evidence of deployment. Do not change governance state or run the observer until its own configuration prerequisite is independently satisfied.

#### Action in this cycle

- **Executed:** re-read the current checkpoint and exact Materios source files; inspected the full fast-path handler; searched the current IMMORTAL traceability matrix and open PR set.
- **Files changed:** this checkpoint only.
- **Tests / workflows / RPC:** `NOT_RUN`; no local runner was available in this connector-only pass, and no repeated scan was sent to the already-known RPC endpoints.
- **Side effects:** no upstream edit, no PR/issue created, no branch created/deleted, no merge/promotion, no deployment, no wallet/signature/transaction, no economic or V3/Reveal semantic change.
- **Status delta:** none. C0 remains PARTIAL; C1 and C3 remain BLOCKED_EXTERNAL; C2 remains PARTIAL; all C4–C15 labels remain as listed in §10.35 and §10.36. This section adds fresh source confirmation, not closure evidence.

**Next concrete actions:** (1) prepare/maintainer-review the smallest upstream C0 fail-closed patch plus negative tests for HTTP-200 stale/index-only responses, missing manifest, missing event, and unavailable Cardano/GRANDPA verification; do not publish it without authorization; (2) continue C6.2 consumer-map completion and negative bypass regressions on the assigned IMMORTAL branch; (3) keep C1/C3 waiting on a new authorized evidence source rather than repeating unchanged RPC scans.


### 10.37 — Agent B: valid-CBOR provider contract, V3-response capture and artifact security (2026-10-24)

**Classification:** operational evidence refresh; no economic rules, validator, V3 carrier semantics, Reveal semantics, Preprod state or deployment configuration changed. Checkpoint-only commit on `work/immortal-green-closure`.

#### B1 — Evidence that separates generic provider compatibility from the V3 failure

- PR #36 is OPEN / DRAFT at `review/treasury-readonly-observer`, head `565851fdaa356ef4e82e6abc909664cf1854ca83`, base `main` at `97b09a38742098f17a61eb07734c401aeedccc06`.
- Integration Lab [#40067396869](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40067396869), source `75427c3813aa2e77aad84970ed5298fde6d333ca`, completed **failure**. Its valid-CBOR provider-contract step passed using an unsigned, no-Plutus local transaction: both the standard JSON endpoint `/utils/txs/evaluate/utxos` and the classic CBOR endpoint `/utils/txs/evaluate` returned HTTP 200 and `result.EvaluationResult`. The probe transaction was not signed or submitted.
- The same run's V3 carrier probe still failed with `EvaluatorError: Cannot use 'in' operator to search for 'EvaluationResult' in undefined` from `@lucid-evolution/provider/dist/index.js:529`. Reveal and all later dependent gates were skipped. Therefore the provider routes can handle the tested ordinary transaction; the cause is not yet identified for the script-bearing V3 request. Do not call this a V3 ledger rejection.
- Commit `565851fdaa356ef4e82e6abc909664cf1854ca83` adds a diagnostic-only tap to `audit/cardano-integration/v3-carrier-ledger-probe.mts` (blob `534a8dfac42dad4254617b615554b51460b3d58c`). It observes only the actual `POST /utils/txs/evaluate/utxos` response metadata/schema, status, content type, response hash and request CBOR length/hash; it stores no raw CBOR or raw response body and returns the original response unchanged.
- Run [#40069579992](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069579992), job `120799915902`, was still **in progress** at the last API check and had not advanced beyond `Generate fresh Plutus validator artifacts`. Sanitizer-fixture tests, project dependency install, isolated lab dependency install, Haskell setup and Plutus native dependency setup were successful; Yaci startup, evaluation contract verification, V3 request/response capture and Reveal had not run. Job logs were unavailable. The actual V3 response-capture result is **PENDING**.
- Do not start a competing Integration Lab while #40069579992 remains active: the workflow uses `cancel-in-progress: true`. If the run remains before Yaci with no progress, the repository owner should inspect/cancel it through GitHub Actions UI before deciding whether to retry; the currently available connector does not expose a cancel operation.

#### B3 — Sanitizer regression and artifact-level result

- Directly downloaded artifact from #40067396869, ID `12550099229`, contained 11 files; `yaci.log` was 33,270 bytes. The log showed 40 `[REDACTED_SIGNING_KEY]` markers and one `[REDACTED_MNEMONIC]` marker; scans found no raw `ed25519e_sk` tokens, no raw 12–24-word mnemonic sequence, and no ANSI CSI escape sequences. No secret values or fingerprints were reproduced.
- The sanitizer's synthetic-fixture step passed in the workflow. Classification: **GREEN — TESTED BOUNDED for artifact #12550099229 only**.
- Historical artifacts remain an external containment task: run #2086 artifact ID `12525975775` was previously found to contain raw ephemeral devnet signing keys; run #2113 artifact ID `12549495517` was previously found to contain a local-devnet mnemonic. Both were unexpired on the last artifact-list check. The code correction cannot retroactively sanitize those ZIPs; available connector actions cannot delete or change artifact retention. **Owner action:** restrict/delete both artifacts where supported, confirm no credential reuse, and rotate/revoke any material that was reused or not strictly ephemeral. No secrets are reproduced in this checkpoint.

#### B4 — Treasury observer remains blocked

- PR #36 observer workflow was not dispatched. It binds `DEMETER / vars.VITE_TREASURY_ADDRESS` to its configured path; that variable cannot be independently read by the available connector. Owner must verify address/script-hash/release binding before any dispatch.
- The green-branch observer variant uses an address/hash plus caller-supplied `PREPROD_TREASURY_BINDING_REFERENCE`, and explicitly labels that reference `CALLER_SUPPLIED_NOT_CRYPTOGRAPHICALLY_VERIFIED`. It does not make the deployment reference authoritative by itself.
- Static review gaps remain: explicit Koios timeout, transport/rate-limit classification and slot/tip evidence. Runner wall-clock `observedAt` alone is not a chain slot. Status stays **YELLOW / BLOCKED — EXTERNAL**; no Preprod read workflow was run in this pass.

#### B6 — Swap/liquidation evidence boundary

- Cross-branch recursive path census covered 26 existing branch trees, each returned `truncated=false`. The only paths named for DEX/swap/liquidation were the scenario simulator, its tests, manual simulation workflow and route-blocker note on `work/immortal-green-closure`; no matching route files were found in the other 25 tree snapshots. This is a path-level audit, not proof about external integrations or differently named code.
- The simulator's five synthetic tests passed locally. The simulator performs arithmetic over caller-supplied asset value removed, gross USDM proceeds, costs, pre-EEV and ProtectedCapital; it does not query or execute a DEX/AMM route, build/sign/submit a swap, or authenticate actual proceeds. No DEX route, confirmed swap, net-proceeds ledger evidence or QNE proof is established.
- `plutus/Treasury.hs` remains the legacy lovelace distribution validator; it does not contain a Treasury asset swap action. B6 remains **NOT_PROVEN for executable liquidation**.

#### Green-branch exact-head conformance status

On green HEAD `000991ee3bf417f4ab5b65344148b4e17796a590`, all five following bounded workflows completed success: [Algorithmic Governability #40069993736](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069993736), [Documentation Link Check #40069993727](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069993727), [Cardano Adapter Sale #40069993715](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069993715), [Protocol Declaration #40069993753](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069993753), and [Portability #40069993728](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069993728). A subsequent coordination-only green HEAD `3b3d05b804a27546d3d3fd0e4ee80b7963a4aea4` also completed those five workflow scopes successfully (runs #40070281237, #40070281224, #40070281227, #40070281238, #40070281261). These are conformance/documentation results, not evidence that the PR Cardano lab passed, that Reveal executed, or that a Treasury swap occurred.

**Overall Agent B status:** PARTIAL / OPEN. Generic Yaci evaluation of a valid no-Plutus transaction is verified; actual V3 provider response/ledger acceptance is pending, Reveal remains skipped, historical artifact containment remains owner-blocked, the Treasury Observer remains blocked on independent deployment binding, and executable Treasury liquidation is NOT_PROVEN. No Preprod transaction, signature, bootstrap, mint, swap or deployment was performed.

### 10.48 — Agent C: C6.2 negative bypass regression contract — 2026-10-24

**Action:** extended the existing universal-kernel consumer map with a concrete action-by-action negative regression contract. This is coordination/test-specification work only; it does not alter normative economics or validator behavior.

- Updated [docs/COORDINATION/UNIVERSAL-KERNEL-CONSUMER-MAP-2026-10-24.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/UNIVERSAL-KERNEL-CONSUMER-MAP-2026-10-24.md), new blob `c36eab650b02f00b0c26c29d6c6bff17a5c3f456`, commit `d97cb25aeb7177bcb5480b9a28c3f3c4adb4ba9a`.
- Added required negative cases for SALE/mint, pool lifecycle, REVEAL, CLAIM, EXPIRE, Treasury distribution, Beacon/control transitions and counter/supporting-state mutation. Each row names the existing entrypoint and the evidence needed; action scope remains subject to existing normative sources.
- Specified a source-map guard that must enumerate canonical type/gate consumers, active exports/factories, script hash/address and deployment-manifest consumers, and fail on an unclassified new economic path. The existing `check-rf8-production-boundary.mjs` is explicitly not sufficient for this purpose because it only restricts off-chain direct signing/submission.
- **Verification:** re-fetched the source map before editing and used its current blob SHA as the update precondition. The update API returned the commit/blob above. No local checkout/shell runner was available, so the updated file still requires a post-write re-fetch and exact-SHA test/build execution before its content or tests are considered verified.
- **Tests/build/export/deployment:** NOT_RUN. No validator/source/test code changed; no branch topology, economics, V3/Reveal semantics, workflow, deployment, wallet or ledger state changed.

**Status:** C6.2 remains **BLOCKED_INTERNAL / RF8 OPEN**. This narrows the test obligation but does not provide negative-regression execution or complete address/deployment reachability evidence. C0 remains PARTIAL and C1/C3 remain BLOCKED_EXTERNAL; no C0 patch was applied upstream.


## 10.26 — Agent B follow-up: valid-CBOR contract probe PASS does not close V3 evaluation (2026-10-24)

**New evidence after §10.25.** Exact source commit: PR #36 head `565851fdaa356ef4e82e6abc909664cf1854ca83` (`ci: capture sanitized V3 provider evaluation response`). No changes to economic semantics, V3 logic, Reveal logic or Preprod operations are implied.

### Run #2119 — valid local-CBOR endpoint contract

- Run [#40067396869](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40067396869), head `75427c3813aa2e77aad84970ed5298fde6d333ca`, completed **failure**.
- Step 21, `Verify Yaci evaluation contract with valid local transaction CBOR`, passed. Evidence artifact ID `12550099229`, digest `sha256:0bf42c08d24477bf343e7ebd5442504a62b9787ca09aacc5e2316ba8030454e9`.
- A locally built unsigned, no-Plutus transaction (376 hex characters; SHA-256 `cf676e6e4596e7179e8bdc6f2751ebbeffddc21ee244b87453a98e587dc46823`) was not signed, submitted or used to mutate the ledger.
- Both `POST /utils/txs/evaluate/utxos` with JSON `{cbor: ...}` and `POST /utils/txs/evaluate` with the transaction CBOR text returned HTTP 200, JSON response (162 bytes), top-level keys `type,version,servicename,methodname,result`, and `result.EvaluationResult`. Direct `provider.evaluateTx(cbor)` returned an array of length 0. This verifies the endpoint/provider's no-Plutus happy path only; it does **not** prove Plutus script evaluation or V3 acceptance.
- Despite that step passing, step 22 V3 carrier still failed at `@lucid-evolution/provider/dist/index.js:529` with `Cannot use 'in' operator to search for 'EvaluationResult' in undefined`; Reveal and downstream steps were skipped. The blocker is therefore narrower than a generally wrong endpoint route/schema: investigate the script-bearing transaction's request/response, redeemer/evaluation context, additional UTxO set, and provider error parsing.

### New V3 response tap — pending verification

- Head `565851fdaa356ef4e82e6abc909664cf1854ca83` adds sanitized response observation in `audit/cardano-integration/v3-carrier-ledger-probe.mts`, storing request path/content-type/body keys, CBOR length/hash, HTTP status, content type, response byte count/hash and response-shape flags; it does not store raw CBOR or raw response body.
- Current Integration Lab run [#40069579992](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40069579992), run #2120, is **IN_PROGRESS** at `Generate fresh Plutus validator artifacts`. It has not reached the provider probe, so no conclusion is available yet. Do not launch a same-ref run while this job is active; the workflow uses `cancel-in-progress: true`.
- Static issue found in the new contract probe: the evaluator-mode regex is written `/Yaci Store tx evaluator mode:\\s*([a-z]+)/i`, which matches a literal backslash plus `s` rather than whitespace. Its evidence artifact will report `NOT_RECORDED` even when the startup log clearly reports `ogmios`. Fix this only after run #2120 completes, to avoid cancelling its evidence run; add a synthetic regression for the mode parser.
- `audit/cardano-integration/package.json` pins `@lucid-evolution/lucid` 0.6.5 but there is no committed isolated `audit/cardano-integration/package-lock.json` at the inspected ref; `npm install --prefix audit/cardano-integration` therefore does not provide a lockfile-backed transitive resolution. Add a lockfile and use `npm ci --prefix audit/cardano-integration` in a separately reviewed reproducibility fix, after the active run.

### Updated B1 status

- Endpoint reachability and the no-Plutus provider happy path: **GREEN for that narrow claim only**.
- Plutus-script evaluation/provider contract: **RED / OPEN** until the current V3 response tap reveals a valid, bounded result and V3 transaction completes without evaluator bypass.
- The diagnostic must not be promoted to successful Plutus evaluation, V3 ledger acceptance, Reveal acceptance, or Preprod evidence.

### Agent A — USDM candidate identity, authority boundary, and current-head CI — 2026-10-24

**Classification:** read-only source triangulation + coordination checkpoint. This entry does not make a normative decision and does not authorize implementation, approval, bootstrap, or a real Issue.

#### 1. Current exact-SHA conformance evidence

Current `work/immortal-green-closure` HEAD at the start of this update: `89405ca9b138aab541299d9e403011515030688f`. The five bounded conformance/documentation workflows on that exact SHA `89405ca9b138aab541299d9e403011515030688f` completed successfully:

- [Cardano Adapter Sale Conformance #40071007156](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071007156) — SUCCESS
- [IMMORTAL Portability Conformance #40071007079](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071007079) — SUCCESS
- [Algorithmic Governability Adversarial Lab #40071007105](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071007105) — SUCCESS
- [Documentation Link Check #40071007071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071007071) — SUCCESS
- [Protocol Declaration Conformance #40071007108](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071007108) — SUCCESS

These results establish only those workflow scopes at this exact SHA. They do not prove current live UTxO liveness, fresh EV1–EV7 qualification, EEV deployment approval, a Treasury swap, or a confirmed wallet Issue.

#### 2. Exact Preprod test-asset identity cross-check

The active repository bootstrap workflow and `Adapter/CARDANO/observation/DirectUsdmEev.ts` pin the candidate as:

- Network: `cardano-preprod`
- Policy ID: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9`
- Asset name hex: `0014df10745553444d`
- Combined unit: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`

The official [x402 Cardano scheme specification](https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_cardano.md) explicitly says the Preprod `tUSDM` policy ID and asset name differ from mainnet USDM. The [Cardano Foundation x402 demo](https://github.com/cardano-foundation/x402-cardano-demo) separately identifies its SDK Preprod `tUSDM` and Masumi's `tUSDM` as distinct tokens. [Moneta's published policy-ID page](https://moneta.global/policy-id/) identifies its mainnet USDM as policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`, asset name `0014df105553444d`.

**Interpretation limit:** this identifies the configured x402 Preprod test asset and distinguishes it from the published mainnet asset. It does not prove issuer-backed USD redemption, market parity, or automatic admissibility as the protocol's canonical settlement asset. A governance decision may explicitly scope a test asset to Preprod, but that scope must be recorded rather than inferred from the ticker.

#### 3. Normative decision crosswalk

The accessible Notion `02 — Decision Log` records DEC-3 as **CLOSED at the economic-semantic level**: USDM is the reference unit and settlement through another supported asset must equal the required USDM amount under a verified valuation contract. That closed principle does not itself choose a specific network token or establish a USD/USDM conversion rule.

The repository's USDM conversion memo remains `RESEARCHED / NORMATIVE DECISION OPEN / NO IMPLEMENTATION AUTHORIZED`. Options remain:
- A — governed USD/USDM parity or fixed ratio;
- B — independently verified USD/USDM conversion;
- C — authenticated quote already denominated in USDM.

The decision must also distinguish the accounting unit from the exact physical Cardano asset eligible as `VerifiedUSDM`. The repository governance crosswalk says the project owner currently retains specification authority during this development phase and that agents must not adopt these values unilaterally.

Decision tracker: [Issue #37 — canonical USDM unit, Cardano asset identity, and USD conversion rule](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37). On this update, the Issue is OPEN and assigned to `LiberoNuvola`; a read-only identity cross-check comment is recorded at [issue comment #6381041422](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6381041422). No authority decision was present in the Issue at the last check.

#### 4. Current gate disposition and exact next actions

- `tUSDM = OBSERVED_NOT_QUALIFIED`; physical observation and normative admissibility remain separate.
- P-01/P-02/P-16 remain blocked; EEV approval remains inactive for the current candidate.
- No fresh live exact-PrizePool source-set / EV1–EV7 requalification was executed in this pass.
- No treasury liquidation, workflow bootstrap/approval dispatch, wallet signature, deployment, transaction, or on-chain state change occurred.
- V3, Reveal semantics, economic constants, and production price-consumption behavior were not changed.

**Next actions:** (1) the authorized specification owner records the permitted Preprod asset identity/scope and separately adopts the USD/USDM rule or selects an authorized source already denominated in USDM; (2) only after that decision, re-observe the exact qualified B1 PrizePool UTxO and regenerate source-set/EV1–EV7 evidence against current repository bytes; (3) evaluate EEV deployment approval and authoritative Issue admission as separate gates; (4) verify a confirmed Issue and the expected Ticket NFT in the intended wallet. Connected-source search for Slack/Drive/email was unavailable to this pass because the Notion connector requires Business access; this entry therefore makes no claim about those unsearched surfaces.

### Agent A — fresh exact Preprod EEV candidate liveness observation — 2026-10-24

**Classification:** fresh read-only liveness and physical-asset observation only. Not normative asset approval, EV1–EV7 requalification, EEV deployment approval, or Issue authorization.

#### Run and source provenance

- Observer-only source commit: [`64fe7471caefc7f27d006cd814b50d4c76d6f64c`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/64fe7471caefc7f27d006cd814b50d4c76d6f64c). The only executable-file change was a comment above the imports; no observer logic changed.
- Read-only workflow: [PRE-RICH Preprod EEV — Read-only UTxO Liveness #40071991887](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991887) — SUCCESS.
- Artifact: [`preprod-eev-liveness-64fe7471caefc7f27d006cd814b50d4c76d6f64c`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991887/artifacts/12551587799), ID `12551587799`, created 2026-10-24 06:53:46 UTC, SHA-256 over the returned address-info object `b1f6e6faa1e79ed828fac55c0e84d4118beb48b541f1361cc83f0d3f4007f8a6`.
- Query interval: `2026-10-24T06:53:44.331Z` to `2026-10-24T06:53:45.810Z`.
- Both tip reads returned the same Preprod tip: block height `5,328,917`, absolute slot `137,141,557`, block hash `be70535dcf88a78e8b39b8daf233e02f23dbc6aab851b7e32b115778739d21fa`, block time `2026-10-24T06:52:37Z`.

#### Observed physical facts

Exact historical candidate UTxO: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0` at the configured B1 PrizePool address `addr_test1wrhru9jt8jm600y2mltw300c9tu7cj5tuyew7lz0ex2p75gja592e`.

- Exact out-reference match count: **1**.
- Observation status: `LIVE_CANDIDATE_OUTREF_AND_ASSETS_MATCH`.
- Lovelace quantity: `5,000,000`.
- Configured Pool singleton quantity: `1`.
- Candidate physical Preprod `tUSDM` atomic quantity: `1,000,000,000`.
- Inline datum present; datum bytes SHA-256: `713c19f73c32fb981cc048102deedbaa13549a4c714495839fdd8d80898eb3e7`.
- Asset-list SHA-256: `6db7809ba6d2f7ed26cbf1ace737b2ccb62a13e00e4f7f9837b3bb8947077428`.

#### Scope limit and disposition

The observation confirms that this exact historical out-reference and the expected singleton/physical candidate asset were present in the sampled Preprod state. It does **not** establish that the candidate token is normatively admitted as `VerifiedUSDM`, that the physical token has USD redemption parity, or that the output qualifies as the protocol's economic EEV. No economic conversion was applied by this observer; no EV1–EV7 qualification, deployment approval, transaction construction/signature/submission, or on-chain mutation occurred.

Keep `tUSDM = OBSERVED_NOT_QUALIFIED`; keep the USD/USDM choice A/B/C open; keep P-01/P-02/P-16 blocked. The observation does not establish fresh SourceSet/EV1–EV7 evidence or authoritative Issue admission.

#### Same-commit workflow reconciliation

On observer commit `64fe7471caefc7f27d006cd814b50d4c76d6f64c`, these five conformance/documentation gates all completed SUCCESS:
- [Cardano Adapter Sale Conformance #40071991794](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991794)
- [Documentation Link Check #40071991770](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991770)
- [Algorithmic Governability Adversarial Lab #40071991779](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991779)
- [Protocol Declaration Conformance #40071991824](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991824)
- [IMMORTAL Portability Conformance #40071991773](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991773)

The same push also ran [IMMORTAL Cardano Preprod Context #40071991781](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991781), which completed SUCCESS for its read-only Preprod context/boundary-conformance job; the manual-only V3 observation, deployment, direct-USDM bootstrap and real Reveal jobs were all SKIPPED. [Security Credential Boundary #40071991768](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991768) completed SUCCESS. [IMMORTAL Cardano Integration Lab #40071991767](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991767) remained in progress at the last check in its `devnet-integration` job; no result is claimed until it completes. That lab is not the user's personal Preprod ticket flow.

**Next gate:** the authorized specification owner must decide whether this exact Preprod test asset is allowed as the Preprod representation of the accounting unit and separately adopt a USD/USDM rule. Only after those decisions should the project re-run the full direct-USDM source-set/EV1–EV7 qualification and evaluate approval/admission separately. No kernel, economic constants, V3 or Reveal semantics changed.

### Agent A — first-Issue settlement builder: exact-head TS evidence and remaining ledger gate — 2026-10-24

**Classification:** current source + exact-head off-chain conformance evidence. Not live Issue authorization or on-chain settlement proof.

#### Current implementation truth (avoid repeating the superseded fixed-ADA claim)

The current source on observer commit `64fe7471caefc7f27d006cd814b50d4c76d6f64c` does **not** use the legacy fixed `TICKET_PAYMENT_LOVELACE` as the Issue settlement amount:

- `src/issueSettlement.ts` blob `7729346aca2bd0be3065e4994ff3ff947b12379e` decodes legacy OracleDatum and the additive OracleQuoteSet, validates exact asset identity, publisher, freshness, precision and exact integer-valued USDM-subunit equality, and derives buyer-selected quantities only from authenticated quotes.
- `src/mint.ts` blob `b9b1a7f4846e4cfdf8862368421b8ce7cf8b1534` calls `deriveAdaIssueSettlementLovelace` for ADA-only settlement or `buildIssueSettlementAssets` for an explicitly supplied basket; it checks the completed Treasury Value, output-specific minimum ADA and finite validity upper bound before adapter submission.
- `src/__tests__/issueSettlementConformance.test.ts` blob `211d0caf760609bdc01de12035f45087c699a9fb` supplies synthetic tests for datum schema, exact quotes, stale/future/mismatched publisher rejection, quote-set duplicates, basket equality, completed output, TTL and minimum ADA.
- `plutus/MintPolicy.hs` blob `0d59fc05b4c11873984fffd10014bd46d8470509` continues to require `Economic.totalUsdmValue(TreasuryOutput) == pdPriceUsdm`; `plutus/Economic.hs` blob `e50366a65ce34e9433d5ff179dfc03a35a24c1a1` continues to value every non-zero output asset using a matching Oracle quote, the fixed economic ADA exclusion and existing integer ceiling conversion.
- Predeploy gate source `scripts/predeploy-check.mjs` blob `efc0eecb6ddb37ad63528d3dc15953ab7898970c` keeps settlement construction and script build/export synchronization in the release gate.

#### Exact-head conformance evidence

[Cardano Adapter Sale Conformance #40071991794](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991794) completed SUCCESS on the same observer commit. Its `economic-conformance` job passed the focused Vitest command including `src/__tests__/issueSettlementConformance.test.ts`, adapter admission/provider tests, RF8 boundary audit and other bounded conformance tests. Its `frontend-build` job passed `npm run build`.

This demonstrates the current TypeScript builder/conformance path and build. It does **not** establish Haskell Plutus compile/export, generated artifact synchronization/sizes, native-ledger execution of the quote-set payment, the actual deployed Oracle State datum constructor, or an authenticated quote-source truth contract.

#### Next execution gate and scope

[IMMORTAL Cardano Integration Lab #40071991767](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991767) was still running at the last check, with `Setup canonical Plutus CI` complete and `Generate fresh Plutus validator artifacts` active. No Plutus/native-ledger conclusion is claimed until it completes.

The source-level implementation blocker has therefore narrowed: the old fixed-ADA builder is superseded by a quote-derived settlement builder, and its focused TypeScript tests/frontend build have passed on the cited exact SHA. The remaining first-Issue settlement gates are:
1. complete exact-head Plutus build/test/export and script/hash/size re-audit;
2. observe and decode the **currently deployed** Oracle State datum by its exact singleton UTxO, confirming whether it is the legacy single-quote constructor or the new quote-set constructor and which authorized quotes it actually contains;
3. produce evidence that a concrete Treasury basket passes both the completed-transaction-body check and the authoritative Plutus equality check on a native ledger;
4. keep EEV profile qualification and canonical Preprod `tUSDM` admission separate from ordinary ticket payment settlement.

No Oracle datum was written, no deployment, wallet signature, transaction or real Issue was performed, and no V3/Reveal/economic semantics changed. The read-only EEV liveness result in the immediately preceding section is not a quote-source observation and does not discharge any of these settlement gates.

### Agent A — live Oracle singleton is legacy-schema and freshness-blocked — 2026-10-24

**Classification:** read-only current Preprod wallet-UTxO observation plus datum/source inspection. No Oracle update, signature, transaction or approval was performed.

#### Exact current singleton evidence

Artifact from [IMMORTAL Cardano Preprod Context #40071991781](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991781): [artifact #12550799091](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991781/artifacts/12550799091). Its `preprod-wallet-utxo.json` records observation time `2026-10-24T06:54:07.531Z`, Preprod slot `137141641`, tip hash `dcbb882597282b9fa759a2c99bb013866284efe3efe954eca2e95c33a0a5635d`, and the following singleton:

- Exact UTxO: `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`.
- Singleton unit: `9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e4f5241434c45` (policy `9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e`, token name hex `4f5241434c45`, quantity 1).
- This identity and exact out-reference match the Oracle State recorded in historical EEV artifact [#12324421376](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679/artifacts/12324421376), so this is not an inferred ticker match.
- Inline datum CBOR: `d8799f404018641b000001a11c98ac9e581c69fe256b67d8f11822a34b250ab8ba271bdedb513daf99e618b6bc89ff`; datum CBOR SHA-256 `aeb64ac953285ef1dcf2aa017ee09bbe94ffc93c7ddb177b29e579a9078191b2`.

The datum decodes structurally to **legacy OracleDatum constructor 0** with exactly one quote: ADA identity (empty policy and asset name), integer quote `100`, timestamp `1791481130142` ms, configured publisher `69fe256b67d8f11822a34b250ab8ba271bdedb513daf99e618b6bc89`. It is not the additive `OracleQuoteSet` constructor 1; therefore this deployed datum does not supply the quote set needed to value mixed ADA/token settlement baskets.

#### Freshness finding

- Quote timestamp: **2026-10-08 17:38:50.142 UTC**.
- Wallet-UTxO observation time: **2026-10-24 06:54:07.531 UTC**.
- Observed quote age: **1,343,717,389 ms = 373.255 hours**.
- Existing maximum age in `src/issueSettlement.ts`, `audit/cardano-integration/oracleQuoteSetObservation.mjs`, and `Adapter/CARDANO/observation/OracleTypes.hs`: **3,600,000 ms = 1 hour**.

Thus this current Oracle quote is over the existing freshness limit by `1,340,117,389` ms. The current Issue settlement builder's freshness guard should reject this ADA quote as stale; the Plutus validity/freshness predicate remains authoritative as well. The Oracle datum's quote/publisher fields alone do not prove external price-source truth: the repository observation helper expressly records `sourceTruthProven: false` and `sourceQualificationStatus: NOT_PROVEN_BY_DATUM_ALONE`.

#### Why rerunning the existing bootstrap is not a refresh

In `audit/cardano-integration/preprod-direct-oracle-state-bootstrap.mjs`, when exactly one Oracle State singleton already exists, the workflow sets `reusedExisting = true` and uses the existing inline datum; the fresh `Date.now()` timestamp and datum construction are only in the no-existing-singleton branch. Therefore rerunning that bootstrap will not refresh this quote. An update/republication mechanism and its authorization/source contract must be separately reviewed before any state-changing operation. No such operation was run here.

#### First-Issue gate impact

This is a concrete settlement blocker **independent of** the open normative decision about whether the physical Preprod `tUSDM` may count as `VerifiedUSDM` for the EEV profile. Even if that identity decision were adopted, the Issue path would still need a currently fresh, publisher-matched, source-qualified quote in the deployed Oracle State and, for non-ADA baskets, a deployed quote-set datum with all required asset quotes. The existing TypeScript builder/conformance success does not make this old live datum fresh or turn constructor 0 into constructor 1.

Keep the gates separate:
- `tUSDM = OBSERVED_NOT_QUALIFIED`; A/B/C USD/USDM decision remains open.
- Current Oracle datum = legacy ADA-only quote, stale under the existing one-hour guard; multi-asset quote set not present in this UTxO.
- No EEV approval, Oracle update, bootstrap transaction, wallet signature, Issue transaction or on-chain mutation occurred.
- V3, Reveal semantics and economic conversion/freshness constants remain unchanged.

**Next safe action:** use the existing dedicated read-only Oracle quote-set observation path (which reports shape, timestamp, publisher match and freshness but never claims external-price truth) to materialize a structured current-state artifact; then separately plan and authorize any legitimate quote refresh/source-verification path. Do not rerun the existing bootstrap expecting it to update an existing singleton.



### Agent A — fresh Oracle re-observation, configuration gap, and completed lab evidence — 2026-10-24

**Classification:** fresh read-only Preprod observation plus exact CI/workflow evidence. No on-chain update, wallet signature, treasury movement, deployment, or Issue transaction was attempted.

#### Read-only Oracle observation

[Oracle Quote-Set Read-Only Observation #40074119480](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40074119480) ran on commit `d61e3fbde1dcfa8914d31ff98c7d26c63bd2e316`.

- **Bootstrap-wallet Koios observer: SUCCESS**; structured artifact [#12552830349](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40074119480/artifacts/12552830349).
- Observation chain tip: block `5,329,007`, absolute slot `137,143,580`, observed at `2026-10-24T07:26:20Z`.
- Exact historical singleton remains `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`; datum SHA-256 remains `aeb64ac953285ef1dcf2aa017ee09bbe94ffc93c7ddb177b29e579a9078191b2`.
- Fresh classification: `schema=legacy-single-quote`, constructor 0, one ADA quote, `fresh=false`, blocker `STALE_TIMESTAMP`; quote age `1,345,649,858 ms` (~373.79 hours) against the existing one-hour maximum. `sourceTruthProven=false`, `externalPriceSourceVerified=false`, `configuredPublicPagesRuntimeIdentityProven=false`, `multiAssetSettlementAuthorisedByThisObservation=false`.
- Observation operation flags: `signed=false`, `submitted=false`, `stateChanged=false`.

The second job, [Observe the exact configured Preprod Oracle singleton](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40074119480/job/120813721476), failed during **configuration validation before it queried the configured singleton**. Its log reports these missing required values: `BLOCKFROST_PROJECT_ID`, `ORACLE_STATE_ADDRESS`, `ORACLE_STATE_POLICY_ID`, `ORACLE_STATE_TOKEN_NAME_HEX`, and `ORACLE_PUBLISHER_PKH`. No artifact was produced by that job. Do not treat the bootstrap-wallet observation as proof of the public Pages runtime configuration, and do not fill these fields from guessed identity data. The exact configured observation needs its approved runtime configuration and Blockfrost credential before it can run.

#### Integration Lab reconciliation

The preceding [IMMORTAL Cardano Integration Lab #40071991767](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991767) **completed SUCCESS** on SHA `64fe7471caefc7f27d006cd814b50d4c76d6f64c`. It passed the native Yaci UTxO decoder, resource audit, invariant/provenance guards, Claim address binding, predeploy structural gate, evidence-packet checks and Notion-ledger publisher test. **P2.8 qualification correction:** the evidence-gate command exited successfully as a program and wrote a report, but that report is `LEDGER_ALIGNED_EVALUATION_FAILURE`, with two `MissingScript` failures, zero Plutus execution failures, zero context failures and two other ledger failures. The workflow-step SUCCESS therefore proves report generation, not successful validator execution or semantic A/B closure. Its sanitized packet is [artifact #12552077534](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991767/artifacts/12552077534). This remains a successful devnet/native-ledger lab, not a real ticket issuance to the user's wallet.

The comment-only observer trigger created a new exact-head [Integration Lab run #40074119471](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40074119471) on SHA `d61e3fbde1dcfa8914d31ff98c7d26c63bd2e316`. At this checkpoint update it is **IN_PROGRESS**, with `Setup canonical Plutus CI` active; no conclusion is claimed for this second run. On the same SHA, frontend build, documentation links, economic conformance, conformance, declaration conformance, credentials/security, and read-only Preprod context checks have passed. The configured Oracle observation is the one failed job due to missing configuration; manual/preprod mutation jobs were skipped.

#### Disposition and next gate

Keep `tUSDM = OBSERVED_NOT_QUALIFIED`; Issue #37 remains the open normative decision for exact asset identity and USD/USDM rule. Independently, the observed Oracle state remains a stale legacy single-quote datum and the exact configured runtime observer remains blocked on missing configuration. No qualification, EEV approval, settlement authorization, or first Issue is inferred from the CI pass.

Next safe steps: supply the authorized runtime values and Blockfrost credential for the configured read-only observer; separately resolve Oracle quote-source truth and a legitimate, authorized quote-refresh/quote-set deployment path. Do not rerun the existing bootstrap as a presumed refresh, and do not change V3, Reveal, kernel constants, or economic semantics.


### Agent A — P2.8 evaluation report is MissingScript, not a validator execution result — 2026-10-24

**Classification:** exact artifact and log inspection of successful workflow run [#40071991767](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991767), commit `64fe7471caefc7f27d006cd814b50d4c76d6f64c`. This is a correction to interpreting the step's CI conclusion; no validator or ledger state was changed.

#### Actual evaluator output

The evidence artifact [#12552077534](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991767/artifacts/12552077534) contains `ledger-evaluation-report.json` with **two failures**, one for each spending redeemer:
- redeemer index 0: `MissingScript`, script hash `2ae08dc31517cd5c7790e3b9fca44fa7b6a3e440d3ff4251969e7785`;
- redeemer index 1: `MissingScript`, script hash `fb2e439f4b12621e7548c59b22b3e4c0009475ab6ce904d400233c6a`.

The same job log records `REDEEMER_ENTRIES=2`, `REDEEMER_SUCCESSES=0`, `REDEEMER_FAILURES=2`, `PLUTUS_EXECUTION_FAILURES=0`, `LEDGER_CONTEXT_FAILURES=0`, `OTHER_LEDGER_FAILURES=2`, `RESULT: LEDGER_ALIGNED_EVALUATION_FAILURE`. The runner prints `ACCEPTANCE: B` for the typed-failure report, but the actual failure class is `MissingScript`, not a `ValidationFailure` produced by executing a validator.

The manifest is additionally marked `script_artifacts: null`, `typed_context_ready: false`, `reference_inputs: 0`. Accordingly, this packet does **not** prove a Plutus execution result or the documented B outcome of a ledger-originated script failure for the exact Reveal context. It is not evidence that the economic validator failed or passed; it shows the evaluator could not find the scripts for the two spending purposes.

#### Registry interpretation problem

The generated `verification-registry.json` reports `overallResult: PASS` and `P2.8.LEDGER.EVIDENCE.GATE: PASS` because its evidence is linked to the workflow step's successful process exit. That step status does not distinguish "report generation succeeded" from "semantic acceptance achieved". Therefore the registry PASS must not be promoted as P2.8 A/B acceptance. The lab may still be reported as a successful workflow run for its other traces/tests, with this evaluator criterion explicitly open.

#### Next action and ownership boundary

Route the bounded fix to the evidence/evaluator owner (Agent B): inspect why the exact transaction packet reaches `evaluateConwayTx` without scripts for the two spending purposes; preserve manifest and context binding; then either materialize the exact script/reference witness inputs required by the same submitted transaction or classify the run as SAFE_STALL / non-acceptance. Extend registry generation/tests so `P2.8.LEDGER.EVIDENCE.GATE` cannot show PASS solely from a zero-exit process when the report has `MissingScript` or `PLUTUS_EXECUTION_FAILURES=0`. Do not change V3/Reveal semantics, validator code, transaction meaning, or economic rules to force a PASS.

**P2.8 disposition:** workflow run SUCCESS; native evaluator report `LEDGER_ALIGNED_EVALUATION_FAILURE`; required P2.8 semantic A/B acceptance remains **OPEN** pending exact script-bearing context and report-aware classification.


### Agent A — P2.8 MissingScript root-cause trace: reference-script UTxOs omitted from evaluator context — 2026-10-24

**Classification:** read-only source/CBOR/CI-log cross-check from run [#40071991767](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991767), workflow SHA `64fe7471caefc7f27d006cd814b50d4c76d6f64c`. This is a strongly supported evaluator-context root-cause candidate; the fix has not yet been implemented or rerun.

#### Exact reference inputs and validator hashes

The exact serialized Reveal transaction in `reveal-tx.cbor` / `tx.cbor` is 1,245 bytes and has **zero embedded Plutus scripts** in its witness set (the log's `reference-script-raw-cbor` reports V1/V2/V3 script counts all zero). Its body includes these two reference inputs, which the workflow itself recorded immediately before finalization:

- `080181411c7b96e555ff40f21b7720dd2874abcf32a1fe05330b54859377bdee#0` — PrizeValidator reference input, Plutus V3, script hash `fb2e439f4b12621e7548c59b22b3e4c0009475ab6ce904d400233c6a`.
- `b3a5a61fe2ed92ed539b0306995dc9e42dd20a08e87266be24e3bbdf603fbcf5#0` — B1PrizePool reference input, Plutus V2, script hash `2ae08dc31517cd5c7790e3b9fca44fa7b6a3e440d3ff4251969e7785`.

Those hashes exactly match the two `MissingScript` hashes in `ledger-evaluation-report.json` (B1PrizePool at spending redeemer index 0, PrizeValidator at index 1).

#### Materializer/decoder mismatch

- `audit/cardano-integration/materialize-p28-ledger-context.mjs` fetches `/txs/{hash}/utxos`, verifies the consumed input refs, then serializes only that response's `observed.inputs` as the evaluator UTxO context. Its manifest computes `input_classification.reference_inputs` by counting `utxos.inputs.filter(input => input.reference === true)`; the saved manifest reports **0 reference inputs**, even though the transaction CBOR and trace logs prove two are present.
- `audit/cardano-ledger-runner/YaciUTxO.hs` decodes only `root.observed.inputs` into the ledger `UTxO` map. Its reference-script handling explicitly rejects a non-null `script_ref` as `REFERENCE_SCRIPT_BODY_UNSUPPORTED`, and the constructed `BabbageTxOut` hardcodes the reference-script field to `SNothing`.
- The report then records `MissingScript` for the exact two scripts referenced by those out-refs. This is consistent with the native evaluator receiving spending inputs and redeemers but not the reference-script UTxOs/reference script bodies needed to resolve those scripts.

#### Required bounded repair / verification

Assign the evidence/evaluator repair to Agent B. Decode the exact transaction body to enumerate reference inputs; fetch each exact reference UTxO from the local Yaci ledger with its script reference and provenance; include them in the typed ledger UTxO context; implement/verify native decoding of the script-reference body so the ledger evaluator can resolve the correct V2/V3 script hashes. Fail closed if a referenced UTxO is missing, the reference script hash does not match the redeemer-required hash, or script bytes/version are not decoded faithfully.

Then rerun the same evidence-bound native ledger evaluator. Acceptance requires either a fully successful ledger evaluation with ExUnits or a genuine ledger-originated validator failure for the exact Reveal transaction. `MissingScript` or missing context must remain non-acceptance/SAFE_STALL. Update the JEV registry to derive the P2.8 check from the semantic evaluator report, not merely a zero exit code from report generation. Do not change validator code, V3/Reveal semantics, transaction meaning, economics or production behavior to manufacture a PASS.

**Status:** root cause strongly supported by exact matching refs/hashes and source-level omission, but the repair and exact-head retest remain open. The currently running later devnet lab run must be allowed to complete; no changes to `audit/cardano-integration/**` were made in this action.

### Agent B — certification manifest structural gate — 2026-10-24

**Classification:** structural CI evidence only. This entry records the fail-closed manifest validator and its exact-head GitHub Actions run. It does not change any protocol, economic, deployment, ledger, or certification status.

#### Exact implementation and workflow evidence

- Branch: `work/immortal-green-closure`
- Commit: `f828dcfa253756da91dbe5de483c7ac0528a2bb7`
- Commit message: `Add fail-closed certification manifest gate`
- Workflow run: [IMMORTAL Certification Manifest Validation #40078996418](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40078996418)
- Workflow conclusion: `success`
- Job: `manifest-validation` — `success`
- Verified steps: manifest JSON parsing; fail-closed checker tests; current manifest validation; explicit confirmation that `--require-closure` remains rejected.
- Local test suite on the same committed implementation: 5 passed, 0 failed.
- Manifest: `docs/02-certification/IMMORTAL-CLOSURE-EVIDENCE-MANIFEST.json`
- Checker: `scripts/immortal-certification-gate.mjs`
- Regression tests: `scripts/test-immortal-certification-gate.mjs`

#### What this evidence establishes

The structural validator accepts the current manifest, rejects malformed manifest inputs, rejects a gate marked `GREEN` without runtime verification, and does not permit `--require-closure` to certify the project. All seven manifest gates remain `OPEN`.

This run demonstrates only that the structural checks and fail-closed behavior passed on the exact commit above. It does not independently authenticate workflow artifacts or their digests, prove native Cardano validator execution, establish real Preprod Reveal success, verify Materios finality/storage proofs, establish ProtectedCapital provenance, or certify EEV/Kc/Ω and RF8 conditions.

#### Certification-manifest reconciliation

The canonical `FINALIZATION-CERTIFICATION-MANIFEST-20260925.md` remains unchanged because no closure predicate has been satisfied by this structural workflow. Its existing gates remain open, including P2.8 native evaluator, Reveal budget, Materios/B3, B4/B5/B6, RF8 whole-program, and independent assurance. `Protocol Usage Fee` remains `OPEN POLICY`.

No changes were made to V3 or Reveal semantics, economic constants, payout bounds, expiry rules, oracle rules, authority selection, or protocol limits.

#### Next step

Continue with the existing evidence-specific blockers and record each result against its exact commit, workflow, artifact or live observation, and scope. Do not promote a successful structural CI run into a runtime or live-ledger certification.



### Agent C — Mitsuro integration and certification-gate reconciliation — 2026-10-24

**Classification:** read-only audit delta; no Mitsuro connection or runtime isolation has been demonstrated. No deployment, wallet action, or autonomous write is authorized by this entry.

#### Current remote state observed
- Branch `work/immortal-green-closure` HEAD at audit: `3301fcf7d14be000799e4ffad41dfbf620ebac8d`; GitHub reports `protected: false`.
- Branch `work/b3-materios-provenance-evidence` HEAD: `722aef11c5f557897bbf8a51774cfec7a89af3f3`; GitHub reports `protected: false`.
- `main` HEAD: `97b09a38742098f17a61eb07734c401aeedccc06`; protected.
- Ruleset `Protect main` is active, but currently requires 0 approving reviews and lists no required status checks.
- Exact-name repository code search for `Mitsuro` returned no matches. This establishes only that the current GitHub code-search query found no match, not that no external deployment/configuration exists.

#### Mitsuro boundary
The reviewed Mitsuro documentation describes centralized tool authorization, but autonomous mode permits configured tools without per-call prompting. Its tool-system documentation explicitly distinguishes filesystem-root/path policy from an OS sandbox; Hive architecture also treats the service environment as a security boundary until a stronger child-worker boundary is deployed. Therefore a prompt, workspace path, or “read-only” instruction is not evidence of OS-level isolation.

**Integration status: NOT CONNECTED / NOT QUALIFIED.** The available evidence does not identify a live Mitsuro instance connected to this repository, the actual service account, effective filesystem/network permissions, secret exposure, or an isolated runtime test. Do not integrate Mitsuro as a repository writer until those controls are externally enforced and tested. Initial role should be read-only analysis with no write-capable GitHub token, no wallet/production secrets, and a disposable checkout.

#### Certification gate: corrected interpretation of current branch
The earlier red-team report’s statement that no separately named closure workflow was found is stale against the current branch inventory. Current branch has `.github/workflows/immortal-certification-gate.yml`, `scripts/immortal-certification-gate.mjs`, tests, and `docs/02-certification/IMMORTAL-CLOSURE-EVIDENCE-MANIFEST.json`.

The current checker is **structural/fail-closed only**:
- it requires manifest schema/policy/repository identity and the seven G1–G7 gates;
- it requires declared evidence classes for each gate;
- it rejects any gate marked GREEN/CLOSED because runtime verification is not enabled;
- `--require-closure` deliberately fails with “contratti di prova runtime non sono ancora implementati”;
- current manifest lists G1–G7 as OPEN and their evidence arrays are empty.

Therefore a structural workflow exists, but the evidence-backed repo-wide certification/promotion gate is still incomplete. It does not yet authenticate exact-head workflow run IDs, artifact digests/freshness, evidence provenance, or source-file hashes as an end-to-end closure predicate. Do not mark F11.5 closed.

#### Exact-head CI observation
On `3301fcf7d14be000799e4ffad41dfbf620ebac8d`:
- IMMORTAL Portability Conformance #40079905223: success.
- Algorithmic Governability Adversarial Lab #40079905216: success.
- JEV Verification Registry Contract #40079905132: success.
- Protocol Declaration Conformance #40079905140: success.
- Cardano Adapter Sale Conformance #40079905119: success.
- IMMORTAL Cardano Preprod Context #40079905086: success.
- Security Credential Boundary #40079905065: success.
- Documentation Link Check #40079905066: success.
- IMMORTAL Cardano Integration Lab #40079905198: failure. The `Run native Yaci UTxO decoder conformance` step failed; downstream P2.8 evidence/resource/invariant gates were skipped. The JEV operational prompt generation step also failed, although its generator tests passed.
- Cardano Ledger Audit Runner #40079905149 was still in progress at the time of this audit; no conclusion inferred.

These statuses are not economic qualification, native-ledger acceptance, or authorization for first Issue.

#### Next bounded actions
1. Inspect exact failure output for native Yaci UTxO decoder conformance and JEV operational prompt generation; repair only with a scoped, evidence-backed change and re-run exact-head CI.
2. Obtain actual Mitsuro deployment/configuration evidence from the operator; do not infer connectivity from upstream docs.
3. Test OS-level read/write/network/secret boundaries in a disposable environment before any writer integration.
4. Extend the certification checker only after a reviewed contract is agreed: exact source SHA, canonical workflow/run IDs, artifact digest and freshness, evidence class/provenance, and fail-closed mismatch handling. Keep structural CI separate from runtime certification.
5. Reconcile branch protection and required status checks through an explicitly authorized GitHub administration action; the repository branch is currently unprotected.


#### Agent C follow-up — exact failures inspected after checkpoint update

- Integration Lab #40079905198, job `devnet-integration`:
  - `Run native Yaci UTxO decoder conformance` fails to compile at `audit/cardano-ledger-runner/YaciUTxO.hs:54:55`.
  - Compiler diagnostic: `Illegal type: ‘11’ Perhaps you intended to use DataKinds` at `natVersion @11`. This is a language-extension/compiler configuration issue in the decoder harness; it is not evidence about reference-script correctness yet.
  - `Generate JEV operational prompt from validated registry` fails because the generated prompt exceeds 7,000 characters. The builder deliberately refuses truncation to preserve safety boundaries. This is a separate bounded JEV prompt-size issue; tests of the prompt generator passed but the live registry instance exceeds the cap.
  - Subsequent P2.8 ledger evidence/resource/invariant steps were skipped after the decoder compile failure. Do not classify this as a validator pass/fail.
- Cardano Ledger Audit Runner #40079905149 was still compiling the runner during the last observation; no final conclusion recorded.
- Agent C has not modified the decoder or prompt generator: both are outside the Mitsuro integration audit scope and require Agent B/JEV owner to make the scoped fix. Do not alter V3/Reveal semantics or economic policy.

### Agent A — fresh read-only EEV candidate revalidation — 2026-10-24 16:11 UTC

**Classification:** read-only exact-out-reference revalidation. No economic conversion, EV1–EV7 qualification, deployment approval, wallet signature, transaction construction/submission, or ledger mutation occurred.

#### Exact run and source provenance

- Existing read-only workflow: [PRE-RICH Preprod EEV — Read-only UTxO Liveness, run #40071991887](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991887), **attempt 2**, completed successfully.
- Rerun job: `120920654993`; completion/log timestamp: `2026-10-24T16:11:17Z`.
- Source commit checked out by this observation: `64fe7471caefc7f27d006cd814b50d4c76d6f64c`.
- Observer source blob on that commit and on the current `work/immortal-green-closure` ref is identical: `44b84bd3bb1cd12a2b3d6ce9c00f9b8f98bd9df3`. This confirms the observation logic is still the same tracked source; it does not make the older workflow commit the current branch HEAD.
- Artifact: [preprod-eev-liveness artifact #12566815005](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40071991887/artifacts/12566815005), 1,428 bytes, created `2026-10-24T16:11:17Z`, expiry `2026-11-23T16:11:17Z`. GitHub-reported SHA-256 of the uploaded ZIP: `67a389aab1fd42f9505af4508b656a6890b380d07c25b822cb02c566eeec9234`. The observation's address-info response digest remains `b1f6e6faa1e79ed828fac55c0e84d4118beb48b541f1361cc83f0d3f4007f8a6`.

#### Re-observed physical state

- Network: `cardano-preprod`.
- Exact candidate out-reference: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`.
- Configured B1 PrizePool address: `addr_test1wrhru9jt8jm600y2mltw300c9tu7cj5tuyew7lz0ex2p75gja592e`.
- Observer result: `LIVE_CANDIDATE_OUTREF_AND_ASSETS_MATCH`; exact out-reference match count `1`.
- Physical quantities: `5,000,000` lovelace, Pool singleton quantity `1`, candidate Preprod `tUSDM` quantity `1,000,000,000` atomic units.
- Chain tip was stable across the observation: block height `5,330,469`, absolute slot `137,175,074`, hash `6b89c57c1666534cf763030643e7620bbe25f2b9adce997f4b90c1a7c2e9b589` (block time reported by Koios: `1792858274`).

#### Disposition

This revalidates liveness and physical asset presence for the **same historical candidate out-reference** at the later sampled tip. It does not prove a fresh EV1–EV7 source-set, governed canonical-USDM identity, USD/USDM conversion, executable liquidation value, ProtectedCapital/R1-Kc viability, or deployment approval. It also does not prove that the out-reference will still be live at a future Issue admission; the exact input must be revalidated again at that boundary.

Keep `tUSDM = OBSERVED_NOT_QUALIFIED`, keep the A/B/C USD–USDM rule open, and keep P-01/P-02/P-16 blocked. No approval or bootstrap workflow was dispatched. No protocol code, economics, V3/Reveal semantics, or branch topology changed.

### Agent A — EEV approval evidence-integrity hardening and exact-SHA CI — 2026-10-24

**Classification:** off-chain approval-evidence integrity hardening only. No valuation rule, canonical asset identity, economic constant, EEV value, or deployment authorization was selected or changed.

#### Implementation

- Commit `c21f4dabb07c94137831e7de084f21f6c3634b3c` updates `audit/cardano-integration/preprod-direct-usdm-approve.mjs`.
- The approval producer now recomputes the content hashes for the source-set, deployment manifest, Oracle State manifest, and EEV qualification; a digest field with valid hex syntax is not sufficient.
- Before generating `DEPLOYMENT_APPROVED`, it checks EV1–EV7 canonical references and verifies each digest against the current repository source bytes.
- It also verifies the Preprod Oracle State singleton identity against the deployment's Oracle configuration and binds the qualification's source-set facts (asset unit, physical quantity, derived sub-units, Pool address/out-reference and freshness model) back to the exact hashed source-set.
- New module `audit/cardano-integration/eev-approval-integrity.mjs` and regression `audit/cardano-integration/eev-approval-integrity.test.mjs` cover artifact-content mutation, non-canonical EV references, mismatching current-source digests and missing source bytes. The focused test is included in `.github/workflows/pre-rich-direct-usdm-conformance.yml`.

#### Exact-head evidence

Final code/workflow commit: `8c8bffde05b80a31ccb628c2be7275d5be91bb8b`.

- [PRE-RICH Direct-USDM Conformance #40110916650](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40110916650) — SUCCESS. The approval-integrity step, source-script syntax checks, focused direct-USDM tests, authority/admission conformance and browser build passed. The new Node test reported `eev-approval-integrity: artifact hashes, canonical EV references and current source digests verified; tampering rejected`.
- [Cardano Adapter Sale Conformance #40110916668](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40110916668) — SUCCESS.
- [Protocol Declaration Conformance #40110916573](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40110916573) — SUCCESS.
- [Documentation Link Check #40110916616](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40110916616) — SUCCESS.
- [Algorithmic Governability Adversarial Lab #40110916688](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40110916688) — SUCCESS.
- [IMMORTAL Portability Conformance #40110916553](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40110916553) — SUCCESS.

#### Scope and remaining blocker

This closes the identified hash-recomputation gap in the **EEV approval producer's manifest/source validation path** for the exact tested SHA. It does not itself authenticate issuer redemption or establish that the candidate asset is the protocol's canonical accounting USDM. It does not select USD/USDM alternative A/B/C, prove the candidate's market/redeemable value, create a qualified live EV1–EV7 certificate, authorize deployment, certify R1/Kc/Ω viability, or authorize a real Issue.

Issue #37 remains the source of the unresolved normative decision. Keep `tUSDM = OBSERVED_NOT_QUALIFIED`; keep EEV approval inactive and P-01/P-02/P-16 blocked until the competent specification authority records the exact Preprod asset scope and the USD/USDM rule. No approval workflow, bootstrap, wallet signature, or financial transaction was invoked by this work.

### Agent A — approval-producer integration regression — 2026-10-24 16:20 UTC

**Classification:** synthetic integration test of the privileged approval producer. The test used temporary fixture manifests and a synthetic token only; it did not invoke GitHub's privileged approval workflow, use a wallet seed, or submit any transaction.

#### Exact-head result

- Final tested source/workflow SHA: `9fb3755a547b69a47ec1d403f65fb114b3dae4e2`.
- [PRE-RICH Direct-USDM Conformance #40111096223](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40111096223) — **SUCCESS**.
- Step `Verify EEV approval evidence integrity` passed both:
  - `eev-approval-integrity.test.mjs`: valid artifact hashes and canonical EV1–EV7 references pass; changed artifact content, non-canonical source references, changed EV digests and missing source bytes reject.
  - `preprod-direct-usdm-approve.test.mjs`: a fully synthetic but internally consistent manifest chain produces a temporary approval artifact; changing the source-set after hashing is rejected; changing EV2's digest and re-hashing the outer qualification is still rejected against the current repository source bytes.
- Other steps in the same workflow passed the direct-USDM unit tests, strict provider typecheck, authority/admission conformance, script syntax checks and browser build.

#### What is and is not closed

The approval producer's content-integrity check is now exercised end-to-end with synthetic fixtures on this exact SHA. This does not prove the external authority's economic truth, a live newly qualified EV1–EV7 artifact, the canonical-USDM governance decision, R1/Kc/Ω viability, or deployment approval. The synthetic test artifact exists only in temporary test storage and is removed by the test.

The normative blocker recorded in [Issue #37](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37) remains open: exact Preprod asset eligibility and USD/USDM option A/B/C must still be explicitly adopted by the specification authority. No privileged EEV approval workflow or bootstrap was dispatched. Keep `tUSDM = OBSERVED_NOT_QUALIFIED`; keep P-01/P-02/P-16 blocked.

### Agent A — authority decision and fresh Preprod EV1–EV7 qualification — 2026-10-24 17:21 UTC

#### Normative decision adopted

The specification authority explicitly decided that the exact configured tUSDM candidate may be admitted as a physical `VerifiedUSDM` asset **for the Cardano Preprod `PRE-RICH-EEV-USDM-DIRECT-V1` profile only**:

- Policy ID: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9`.
- Asset name hex: `0014df10745553444d`.
- Full unit: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`.

The decision removes the *normative asset-eligibility* blocker for this exact Preprod profile. It does not make this token a mainnet asset, establish issuer redemption or market-price guarantees, define `1 USDM = 1 USD`, or select USD/USDM conversion option A/B/C. That separate conversion decision remains open.

Normative record: [decision memo commit f9207cf](https://github.com/LiberoNuvola/Immortal-Protocol/commit/f9207cf927d1345fa955c21c5ba22d84e1e5765a). The direct-USDM source-set producer now hard-enforces this exact asset unit. The read-only liveness observer labels it as normatively eligible only for this Preprod profile.

#### Fresh live observation and EV1–EV7 qualification

- [Read-only exact-out-reference observation #3](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40115634476) — SUCCESS, same source unit and exact Pool out-reference.
- [PRE-RICH Preprod EEV — Source Qualification Only #1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40115758508) — **SUCCESS** on source/workflow SHA `657dce68ab386680f79928c18d1d39e5aabe0cfa`.
- Exact B1 PrizePool out-reference: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`; live match count: 1.
- Pool singleton quantity: `1`; physical exact Preprod tUSDM quantity: `1,000,000,000` atomic units.
- Declared direct-USDM profile derivation: `floor(1,000,000,000 × 100 / 1,000,000) = 100,000` IMMORTAL USDM sub-units.
- EV1–EV7 digests were recomputed from the current repository sources and checked against the qualification artifact.
- Qualification evidence hash: `488cb982534f2f2c00dca1adadc59b30573fff9566b6c206e6588a6047112545`.
- Artifact: [preprod-eev-qualified-source-657dce68ab386680f79928c18d1d39e5aabe0cfa](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40115758508/artifacts/12568351314).

The qualification artifact has `status: qualified` and `deploymentApproval: null`. The source-set remains an observation artifact with deployment approval pending. This is an explicit separation between source/EV1–EV7 qualification and deployment authorization.

#### Current gate status

- **Preprod physical-asset eligibility:** NORMATIVELY ACCEPTED for the exact unit above.
- **Live source-set / EV1–EV7:** QUALIFIED by the exact workflow and artifact above.
- **EEV deployment approval:** NOT CREATED by this work; remains a separate privileged gate.
- **USD/USDM conversion A/B/C:** OPEN. Any flow depending on an unselected USD/USDM conversion must fail closed.
- **Authoritative Issue admission / Ticket delivery:** NOT AUTHORIZED by this qualification.

No bootstrap, treasury sale, signing, transaction construction/submission or real Issue was performed by the qualification workflow. The old approved artifact was used only to restore the existing deployment and Oracle identity manifests; its historical source-set and qualification were deleted before fresh re-observation, and no old approved-qualification artifact was reused as the new result.

### Exact Preprod asset allowlist regression — 2026-10-24

The source-set producer now rejects any `PREPROD_TUSDM_UNIT` other than the exact authority-approved Preprod unit, before reading deployment manifests or querying the network. Regression test `audit/cardano-integration/preprod-direct-usdm-source-set.test.mjs` proves a different native-asset unit is rejected for the explicit normative identity guard.

- [PRE-RICH Direct-USDM Conformance #118](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40115896625) — SUCCESS on `05d32bb0de374e4726361380b67754f4a1073716`.
- The direct-USDM tests passed (10 + 22 tests), the approval-integrity tests passed, and the new asset-identity rejection regression passed.
- This is a code/conformance guard only; it does not grant deployment approval or select USD/USDM conversion option A/B/C.

### USD/USDM source gate reconciliation — 2026-10-26 (Agent A)

This section reconciles the current source-search result with the conversion decision memo. It is a source-discovery / coordination update only; it does not qualify a feed, change economic semantics, or authorize code/deployment/Issue changes.

- **Decision:** Option B remains the selected architecture: independently verify USD per exact Moneta USDM alongside ADA/USD. No fixed 1:1 assumption is authorized.
- **Pyth catalogue:** the live catalogue query returned `Crypto.USDM/USD` (Pyth Pro ID 609), described as Mountain Protocol USD and marked inactive; `Crypto.NAV.USDM/RESERVES` (ID 3326) is a reserves pair, not USD per USDM; and `Crypto.NAV.USDM1/USD` (ID 3324) identifies USD M1, not the target token. None qualifies as the required second leg. This is a scoped catalogue observation, not a claim that no provider could ever list a suitable feed.
- **Charli3:** its official site says hosted oracle operations ceased in May 2026. Its open-source code may be considered only as a separately governed/operator-run implementation; it is not a currently qualified hosted source.
- **Orcfax candidate:** configured exact pair path exists as `CER/ADA-USD/3` (USD per ADA) and `CER/ADA-USDM/3` (USDM per ADA). Candidate cross-rate is `USD/USDM = (USD/ADA) / (USDM/ADA)`, but only when both observations are authenticated, exact-asset-bound, fresh and timestamp-compatible under an approved contract. The public explorer's surfaced `ADA-USDM` value was 27 days old at retrieval and the selected fact was dated 2026-06-14; `ADA-USD` material was around two months old and its selected fact dated 2026-06-18. With a configured 3600-second heartbeat, those observations fail freshness and must not be used for settlement.
- **Current classification:** source discovery has found an Orcfax *candidate path*, not a qualified live feed pair. Need exact current feed/datum identity, publication/liveness evidence on Cardano, source/provenance and aggregation policy, timestamp/freshness/skew constraints, precision/exponent handling and a reproducible Preprod witness before implementation.
- **No-repeat routing:** Agent A owns this source qualification gate. Do not ask Agent B to alter the Pyth carrier/V3/Reveal or production `MintPolicy` while the source/contract gate remains open. Do not rerun the same static Pyth catalogue query unchanged; next evidence must be fresh feed-specific ledger/source bytes or a confirmed provider/operational response.
- **Fail-closed:** no guessed feed ID, ticker-only asset identity, reserve feed substituted as a market price, stale quote, hardcoded peg, or off-chain-only quote may satisfy Issue settlement. Keep any USD/USDM-dependent flow blocked until the conversion source and versioned contract are approved.

Evidence pointers: [Pyth USDM catalogue query](https://pyth.dourolabs.app/v1/symbols?query=USDM); [Orcfax ADA-USDM feed](https://explorer.orcfax.io/feeds/CER/ADA-USDM/facts/5cbbb7ee-a232-4f36-844a-5c00ceaeb645); [Orcfax ADA-USD feed](https://explorer.orcfax.io/feeds/CER/ADA-USD/facts/11aa4839-0760-4079-8d0d-524e16d8d3eb); [Orcfax live explorer](https://explorer.orcfax.io/).

No production code, Oracle schema, `OracleQuote`, `Economic.totalUsdmValue`, `MintPolicy`, V3/Reveal semantics, deployment, EEV approval, wallet signature, or Issue authorization was changed by this update.

### Orcfax current explorer re-check — 2026-10-26 (Agent A)

A fresh public-web re-check of the Orcfax Explorer still lists `CER/ADA-USDM/3` and `CER/ADA-USD/3` as sponsored feeds, but both latest-value entries are displayed as **4 months old** and the page reports **+0 published facts today (UTC)**. This is current indexed/public explorer evidence, not a direct ledger query; treat it as a strong stale-publication warning, not as a cryptographic proof that no on-chain update exists. Source: [Orcfax Explorer](https://explorer.orcfax.io/).

**Disposition:** the candidate pair is not settlement-usable on currently surfaced evidence. The next task is not to recalculate the cross-rate or repeat catalogue searches: acquire current exact feed UTxOs/facts and independently validate their on-chain publication times and datum identity, or record `BLOCKED_NO_FRESH_ORCFAX_FACT` if no fresh observation can be obtained. The required heartbeat remains the configured 3600 seconds until the authorized contract says otherwise; do not relax it to accommodate stale data. Option B stays selected and unimplemented; fail closed. No production code or protocol semantics changed.



### Orcfax Preprod deployment evidence gap — 2026-10-26 (Agent A)

A check of Orcfax's published integration deployment table records its Fact Statement Pointer as deployed on mainnet and preview, but `preprod: n/a`; preview feeds marked `showcase` are not Preprod qualification. Source: [Orcfax consuming statements](https://docs.orcfax.io/consume). This documentation can lag the live network and is not direct ledger proof, so the finding is **missing canonical deployment evidence**, not proof that no independent deployment exists.

Combined with public Explorer facts for `CER/ADA-USDM/3` and `CER/ADA-USD/3` surfaced as months old ([USDM leg](https://explorer.orcfax.io/feeds/CER/ADA-USDM/facts/5cbbb7ee-a232-4f36-844a-5c00ceaeb645), [USD leg](https://explorer.orcfax.io/feeds/CER/ADA-USD/facts/11aa4839-0760-4079-8d0d-524e16d8d3eb)), Orcfax remains **candidate only / BLOCKED** for USD/USDM settlement. Required before reconsideration: exact current feed UTxOs and datum identities for both legs, current validator/FSP authenticity, publication timestamps within the governed 3600-second heartbeat, compatible timestamp-skew policy, precision handling, and a reproducible network-specific witness. Do not infer Preview equals Preprod, do not relax freshness, and do not change production economics, MintPolicy, Oracle schema, V3/Reveal or Issue/deployment gates. Option B remains selected; no USD/USDM implementation is approved.


### Orcfax consumer-authenticity acceptance criteria — 2026-10-27 (Agent A)

Primary Orcfax integration docs make the feed gate more specific: the consumer must authenticate the FSP reference-input token and FS script/token, parse the statement inline datum, validate the expected versioned feed-ID prefix, enforce `created_at` freshness against its transaction validity/business window, and decode CER values as an exact `num/denom` rational. A datum at a script address alone is not proof of authenticity. See [Orcfax consumer verification guide](https://docs.orcfax.io/consume). Its deployment table still lists `preprod: n/a`, with FSP hashes for Preview and Mainnet only; this is a documentation gap to verify on-chain, not proof that no independent deployment exists.

**Agent A disposition:** Orcfax remains candidate-only / blocked. Required before qualification: exact current network-specific FSP and FS identity/token evidence, both fresh ADA-USD and ADA-USDM statements within the existing 3600-second heartbeat, exact Moneta USDM identity, rational scale/direction, bounded inter-feed timestamp skew, and reproducible direct-ledger witnesses. Do not treat Explorer labels as authentication, infer Preview = Preprod, or implement the cross-rate until these conditions are proven. No code or economic semantics changed; Option B remains selected and Issue stays fail-closed.


### Alternate source discovery route — DEX reserves + authenticated ADA/USD — 2026-10-27 (Agent A)

In parallel with the blocked Orcfax path, Agent A will evaluate whether a market-implied USD/USDM rate can be derived from exact on-chain ADA/USDM pool reserves plus the authenticated ADA/USD leg. This remains Option B (separate verification) and does not assume parity. Public dashboards such as [Cardanoscan stablecoins](https://cardanoscan.io/stablecoins) and [DanoNight](https://danonight.com/cardano/stablecoins) are discovery only; their estimates are not settlement evidence. DanoNight describes its displayed method as deepest ADA pool plus CoinGecko ADA/USD, so its output cannot be imported directly as a trustless source.

**Not approved for implementation.** Required evidence: exact Preprod pool UTxO, AMM/datum semantics, asset identities/decimals, reserves and fees, liquidity/manipulation resistance, quote direction, freshness, authenticated ADA/USD binding, timestamp/transaction binding, exact rational arithmetic, and a governed aggregation/selection rule. If these cannot be specified and independently verified, classify `BLOCKED_NO_QUALIFIED_USD_USDM_SOURCE`; no change to economics or production code. See the [USD/USDM decision memo](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md).


### DEX candidate narrowed to Minswap — mainnet discovery only (Agent A, 2026-10-27)

Minswap is the first pool family to inspect because Moneta's current guide describes its ADA/USDM pool as the deepest USDM venue; Minswap API documentation identifies verified USDM with 6 decimals. A third-party GeckoTerminal result exposes a mainnet pool-contract lead but not a canonical current UTxO/datum and not a Preprod identity. These are discovery leads only. Next: query exact Preprod asset identity and actual live Preprod pool UTxOs, while keeping the mainnet pool candidate separately scoped. Do not transfer addresses or identities across networks; do not use dashboard prices as settlement inputs. See [memo §22](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md).


### Agent A — Minswap Preprod discovery gate (2026-10-27)

The official Minswap SDK documents a testnet adapter that queries V2 pools by exact asset pair. Moneta's published USDM identity is explicitly labelled Mainnet; it must not be assumed to be the Preprod asset. This review did not obtain a direct Preprod pool UTxO or datum, so no DEX source is qualified. Next: verify the exact Preprod USDM asset first, then perform a read-only Minswap V2 pool lookup and preserve the pool variant, UTxO reference, inline datum, reserves, fees, slot and evidence digest. If the asset is absent on Preprod, mark this route unavailable for that network. No production or protocol semantics changed; Option B remains unimplemented and Issue remains fail-closed. See memo section 23.


### Preprod test-token identity recovered from existing B1 workflow — 2026-10-27 (Agent A)

The existing B1 EEV workflow and source-set verifier already pin Preprod tUSDM to `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`. This is the test token used by the direct-tUSDM EEV profile, not Moneta's Mainnet USDM (`c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad` + `0014df105553444d`). Minswap V2 is documented as deployed on Preprod and its SDK supports exact-pair pool lookup; a read-only ADA/tUSDM pool lookup can test integration mechanics, but even a successful result cannot qualify the USD/USDM settlement conversion. No live pool UTxO/datum was acquired in this step. Keep Option B blocked and fail-closed; no production code or semantics changed. See memo section 24.


### Agent A — Minswap API network boundary and no-assumption gate (2026-10-27)

Minswap's documented public metrics API is explicitly Mainnet (`api-mainnet-prod.minswap.org`), so do not use it to claim a Preprod pool or UTxO. The official SDK offers an exact-pair V2 lookup with a Preprod provider, and Minswap's V2 contracts are deployed on Preprod; executing that read-only lookup requires a configured provider credential and still needs direct ledger verification of the returned pool UTxO/datum. Repository issue #37 remains authoritative: tUSDM is `OBSERVED_NOT_QUALIFIED`; do not qualify it from ticker, balance, branding or CI. No live Preprod pool witness was acquired here; no production code or semantics changed. See memo section 25.

### Agent A — read-only Minswap Preprod tUSDM pool observer added; live witness pending (2026-10-27)

To advance the DEX discovery gate without using Mainnet analytics as Preprod evidence, Agent A added a scoped observer on this existing branch:

- Script: [observe-minswap-preprod-tusdm-pool.mjs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/cardano-integration/observe-minswap-preprod-tusdm-pool.mjs)
- Workflow: [minswap-preprod-tusdm-observation.yml](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/minswap-preprod-tusdm-observation.yml)
- Pair is fixed to ADA + the exact configured Preprod tUSDM unit `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`; it does not reuse Moneta Mainnet USDM identity.
- If the Minswap V2 SDK returns a pool, the observer re-queries its exact address/out-reference with Koios and requires one live match, equal inline datum bytes, and matching live lovelace/tUSDM amounts. Missing or mismatching evidence fails closed. A V2 miss is not generalized to all Minswap variants.
- No transaction construction, signing, submission, deployment approval, or Issue authorization is performed. Output qualification is permanently `OBSERVED_NOT_QUALIFIED`.

**Live execution result (2026-10-27):** [run #40457199176](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457199176) succeeded; [artifact ID 12713226154](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457199176/artifacts/12713226154) records `NO_EXACT_ADA_TUSDM_PAIR_FOUND_IN_MINSWAP_V2`. Through Koios public `POST /asset_utxos`, the observer found 455 UTxOs carrying the configured V2 pool-authentication asset at the Minswap V2 payment credential; all 455 decoded and none matched the exact ADA / configured Preprod tUSDM pair. Parse rejects: 0. Tip before/after was stable at block 5,340,313 / slot 137,396,789, hash `52889995bf1e22c56180aa76e41475684832b4af24693030ac6f7fdd6285f93f`. Observation time `2026-10-27T05:46:39.548Z`; evidence SHA-256 `aeb1559b58961a2d9b3be0dce2eebafc04af1cbfb3d0eb1edfe7731bfc0fa689`. There was no pair candidate, so no exact out-reference requery was possible. This is a successful live negative finding for Minswap V2 only, not proof that no Minswap V1/Stableswap/other DEX pool exists, and not a USD/USDM conversion witness.

**Decision-record synchronization:** the normative memo §4 records Option B selected by protocol authority on 2026-10-26. Issue #37's original description still carries older A/B/C-open wording; Agent A added a follow-up comment documenting that chronology and the remaining unqualified source/consumer-contract gates: [issue comment](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6434260357). The Preprod eligibility decision does not imply mainnet identity, issuer redemption, or a USD parity claim.

No production or protocol semantics changed. Do not touch OracleQuote, `Economic.totalUsdmValue`, MintPolicy, V3, Reveal, economic constants, EEV approval, or Issue admission as part of this discovery step.



### Agent A — Minswap Preprod exact-pair observation runs #4/#5 verified (2026-10-27)

Cross-checked the actual GitHub Actions run metadata, job steps, and uploaded JSON artifact on the existing `work/immortal-green-closure` branch. No new branch and no Blockfrost credential were required.

- [Run #4](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457199176), source commit `87a353923d4fd3076459ecc9959a7f2ef9faba9b`, SUCCESS. Its only job completed the Koios query/recheck step and uploaded artifact ID [12713226154](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457199176/artifacts/12713226154). Scope: Minswap V2 authentication-token UTxOs only; 455 V2 pool UTxOs decoded; zero exact ADA / pinned Preprod tUSDM candidates.
- [Run #5](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457502253), source commit `7151b3c629adda5bf1c6358578c9249926bc5838`, SUCCESS. Its only job completed the Koios V1/V2/configured-StableSwap scan and uploaded artifact ID [12712673330](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457502253/artifacts/12712673330). The retrieved artifact JSON reports schema `MINSWAP-PREPROD-POOL-OBSERVATION-v3`, 969 tUSDM UTxOs scanned for V1 credential matches (0), 455 V2 pool-auth UTxOs decoded (0 parse rejects; 0 exact pairs), and 3 SDK-configured Preprod StableSwap pools (0 include exact test tUSDM).
- Run #5 evidence SHA-256: `46fea0a1a2c8e86cc98b2111b1bcb8f06ff0b7d202390bd88c17a4bef6d56386`. Koios tip advanced during observation from block 5,340,321 / slot 137,396,991 to block 5,340,324 / slot 137,397,011. Classify this as a bounded live query interval, not an atomic single-slot snapshot.
- Guardrails recorded in the artifact: read-only public Koios; no signing/submission; no use of Mainnet Moneta-USDM identity; no USD/USDM conversion qualification; no parity assumption. The result is `OBSERVED_NOT_QUALIFIED`, not a qualified source for valuation or Issue admission.
- The search is limited to the exact pinned Preprod test tUSDM and the SDK-configured Minswap V1, V2 and three StableSwap sets. It does not exclude other DEXes, unconfigured pools or markets, and it says nothing about Mainnet Moneta USDM. No V3/Reveal/economic semantics changed.

The observer and workflow are present on the work branch; they are not in `main` at this checkpoint. Do not treat these green Actions jobs as promotion, conversion qualification, or first-Issue evidence. Existing later entries for runs #8/#10 provide expanded external-script discovery; preserve their chronology and distinct evidence scopes.

### Agent A — expanded live tUSDM scan and exact external-script rechecks (2026-10-27)

Latest observer: [Minswap Preprod run #40458245138](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458245138), [artifact ID 12713512727](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458245138/artifacts/12713512727). Current result remains `NO_EXACT_ADA_TUSDM_PAIR_FOUND_IN_MINSWAP_V1_V2_CONFIGURED_STABLESWAP`; qualification remains `OBSERVED_NOT_QUALIFIED`.

- Exact Preprod tUSDM UTxOs scanned: 969. Address checksum decode failures: 0. Encoded payment-credential vs Koios mismatch: 0.
- Minswap V1 credential matches: 0. Minswap V2: 455 pool-auth UTxOs decoded, 0 parse rejects, 0 exact ADA/tUSDM pair. Configured Preprod StableSwap pools: 3, 0 include exact test tUSDM.
- Koios tip was unchanged through run #8: block 5,340,350 / slot 137,397,443 / hash `61c6385399a9b1601f1c535cc848272d3b1f12bffd94afc9ae0c75865f44c7b6`. Evidence SHA-256: `ef572fbfeaae493ed6e065b7e79d552358f4ce168153260c81ebc8b2adac659d`.
- The scan found 15 non-Minswap script-credential groups holding tUSDM. Two external candidates excluding the known B1 PrizePool were re-queried by exact address/out-ref and their live assets/datum matched: `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0` (100,000,000 tUSDM atomic; 1,015,788,430 lovelace; 14 other native units) and `f27b6b913bebca852dfbb8ec4585ec5925c1d04ed05ea9cb96720712c9df11cd#1` (123 tUSDM atomic; 2,521,350 lovelace; 5 other native units). Both are marked `LIVE_SCRIPT_UTXO_RECHECKED_NOT_CLASSIFIED_AS_POOL`; protocol semantics remain unproven. Do not treat them as DEX pools or price feeds absent protocol-specific witnesses.
- The known B1 PrizePool out-ref `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0` is explicitly excluded from the external-candidate set by its Pool singleton unit.

This resolves the present discovery attempt for the exact ADA / pinned Preprod tUSDM pair across the SDK-configured Minswap V1, V2 and StableSwap sets only. It does not prove no alternative DEX exists and supplies no USD/USDM price. Option B remains the selected approach, but no qualifying conversion source/consumer contract is approved; no parity is assumed, no transaction was built/signed/submitted, and EEV approval/Issue remain gated. The detailed evidence is in memo §28.

### Agent A — expanded live tUSDM scan and exact external-script rechecks (2026-10-27)

Latest observer: [Minswap Preprod run #40458245138](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458245138), [artifact ID 12713512727](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458245138/artifacts/12713512727). Current result remains `NO_EXACT_ADA_TUSDM_PAIR_FOUND_IN_MINSWAP_V1_V2_CONFIGURED_STABLESWAP`; qualification remains `OBSERVED_NOT_QUALIFIED`.

- Exact Preprod tUSDM UTxOs scanned: 969. Address checksum decode failures: 0. Encoded payment-credential vs Koios mismatch: 0.
- Minswap V1 credential matches: 0. Minswap V2: 455 pool-auth UTxOs decoded, 0 parse rejects, 0 exact ADA/tUSDM pair. Configured Preprod StableSwap pools: 3, 0 include exact test tUSDM.
- Koios tip was unchanged through run #8: block 5,340,350 / slot 137,397,443 / hash `61c6385399a9b1601f1c535cc848272d3b1f12bffd94afc9ae0c75865f44c7b6`. Evidence SHA-256: `ef572fbfeaae493ed6e065b7e79d552358f4ce168153260c81ebc8b2adac659d`.
- The scan found 15 non-Minswap script-credential groups holding tUSDM. Two external candidates excluding the known B1 PrizePool were re-queried by exact address/out-ref and their live assets/datum matched: `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0` (100,000,000 tUSDM atomic; 1,015,788,430 lovelace; 14 other native units) and `f27b6b913bebca852dfbb8ec4585ec5925c1d04ed05ea9cb96720712c9df11cd#1` (123 tUSDM atomic; 2,521,350 lovelace; 5 other native units). Both are marked `LIVE_SCRIPT_UTXO_RECHECKED_NOT_CLASSIFIED_AS_POOL`; protocol semantics remain unproven. Do not treat them as DEX pools or price feeds absent protocol-specific witnesses.
- The known B1 PrizePool out-ref `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0` is explicitly excluded from the external-candidate set by its Pool singleton unit.

This resolves the present discovery attempt for the exact ADA / pinned Preprod tUSDM pair across the SDK-configured Minswap V1, V2 and StableSwap sets only. It does not prove no alternative DEX exists and supplies no USD/USDM price. Option B remains the selected approach, but no qualifying conversion source/consumer contract is approved; no parity is assumed, no transaction was built/signed/submitted, and EEV approval/Issue remain gated. The detailed evidence is in memo §28.

### Agent A — asset-name anti-spoofing caveat for external script candidates (2026-10-27)

A focused source check of external candidate `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0` found a native-asset name `HydraHeadV2` under policy `4f7a59304309bf7059fe7a3ed4fb9daaaa842dd7da1521cf38d56faf`. This does **not** authenticate it as a genuine Hydra Head or a DEX pool. Hydra's own upstream security scenarios explicitly show a counterfeit `HydraHeadV2` token under a permissive minting policy; its policy ID must match the real Head's policy: [official Hydra security scenario](https://github.com/cardano-scaling/hydra/blob/e016d0a20d59ba1e7d34b7074ac0eeeed65201d1/hydra-cluster/src/Hydra/Cluster/SecurityScenarios.hs#L178-L186). Keep the output `LIVE_SCRIPT_UTXO_RECHECKED_NOT_CLASSIFIED_AS_POOL` until policy/script derivation and protocol-specific witnesses are validated. The second external candidate is likewise unidentified. Details are recorded in memo §29; no production semantics changed.

### Agent A — corrected external asset-name diagnostics and run #10 recheck (2026-10-27)

The read-only observer now reports exact asset-name hex, printable UTF-8 labels and atomic quantities for external script candidates. Fix commit `32d68ea35095d7a126aaf9518cfb05b891c6ee81` was validated by [Minswap run #10](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40459277681), [artifact ID 12713143990](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40459277681/artifacts/12713143990) — SUCCESS. Result remains `NO_EXACT_ADA_TUSDM_PAIR_FOUND_IN_MINSWAP_V1_V2_CONFIGURED_STABLESWAP`; evidence SHA-256 `7d532a1fc50154543997e49c2d22a3a70b1264b9af1582debea3b0ff5f083002`.

- Minswap V1: 969 exact Preprod tUSDM UTxOs scanned, 0 known pool-credential matches.
- Minswap V2: 455 pool-auth UTxOs decoded, 0 parse rejects, 0 exact ADA/tUSDM pair.
- Configured Preprod StableSwap: 3 pools, 0 contain exact tUSDM.
- External script out-ref `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0` rechecked with matching datum/value; holds 100,000,000 tUSDM atomic, 1,015,788,430 lovelace, BTC asset quantity 129,720, plus policy-bound tokens including a name `HydraHeadV2`. Token name is not protocol authentication; the upstream Hydra project documents a counterfeit `HydraHeadV2` token risk. Keep this output unclassified as a pool.
- External script out-ref `f27b6b913bebca852dfbb8ec4585ec5925c1d04ed05ea9cb96720712c9df11cd#1` rechecked with matching datum/value; it contains 123 tUSDM atomic, 2,521,350 lovelace, and other tokens `SIRIUS-B` 123, `RIGEL` 123, `SIRIUS-A` 246, `VEGA` 231, `USDr` 14,436,931. Protocol identity/market semantics remain unknown. Both script UTxOs are only `LIVE_SCRIPT_UTXO_RECHECKED_NOT_CLASSIFIED_AS_POOL`.

**Temporal bound:** this run's Koios tip moved from block 5,340,390 / slot 137,398,081 to block 5,340,393 / slot 137,398,118. This is a bounded query interval, not an atomic snapshot. Exact external out-references were re-queried and their datum/value witnesses matched at re-query time.

Memo §30 records detailed values. Conversion qualification remains blocked: Option B approach selected, no USD/USDM source/consumer contract qualified, no parity assumed, no transaction signed/submitted, EEV approval/Issue remain gated.

### Agent A — Mainnet Moneta-USDM discovery is fail-closed; latest scan pending (2026-10-27)

Mainnet Moneta USDM is distinct from Preprod test tUSDM. The canonical Mainnet unit is `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d` (6 decimals).

- [Run #40459726791](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40459726791): Koios `/asset_utxos` returned HTTP 504 on broad global USDM-holder discovery; result was `OBSERVATION_FAILED_CLOSED`, not a negative pool finding.
- [Run #40544836774](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40544836774): syntax error in the request helper; no on-chain result.
- [Run #40545003507](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545003507): the unbounded V1 script UTxO request timed out; result `OBSERVATION_FAILED_CLOSED`, no on-chain conclusion.
- Corrected observer now uses bounded Koios retry/timeouts and 100-row pagination for the exact Mainnet USDM unit, then filters by the pinned Minswap V1 payment credential. [Run #40546067834](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40546067834) is still pending at this checkpoint update. Read its final artifact before recording a conclusion.

No failed/pending run can be interpreted as “no pool found”. The Preprod finding remains limited to the configured Minswap V1/V2/StableSwap sets for exact test tUSDM; `tUSDM = OBSERVED_NOT_QUALIFIED`. No parity is assumed, no USD/USDM conversion source or consumer contract is qualified, and no transaction/EEV approval/Issue is authorized.

**External script token-name caveat (memo §29):** one rechecked Preprod script UTxO contains an asset named `HydraHeadV2` under a policy not authenticated as a genuine Hydra Head. Hydra's upstream security scenario explicitly warns that a counterfeit asset may reuse this token name; token name alone is not protocol identity. Keep both external script UTxOs `LIVE_SCRIPT_UTXO_RECHECKED_NOT_CLASSIFIED_AS_POOL` until exact policy/script derivation and protocol-specific witnesses establish semantics.

### Agent A/C — fresh Materios GRANDPA target confirms repeated inferred set-ID mismatch (2026-10-27)

Cross-checked the completed [Materios B3 execution-proof run #40548408573](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573), pinned to source head `a66493791dc426a4a6a213fd1dc5b9b7a34b84e7`. Rust verifier, finalized-state capture and live storage-proof jobs passed; the real GRANDPA witness job failed cryptographic finality verification. Artifacts: [real witness ID 12754441369](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573/artifacts/12754441369), raw JSON SHA-256 `7bd6f51b606f2e9edb9a606c3b1e0c6d5b9b1968749f22a040685de17e92b270`; [finalized-state capture ID 12753497694](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573/artifacts/12753497694).

- Fresh finalized target block `2471424`, hash `dcf28d0d21715e914000db6f10e216c8702fc39cd3275368746da3158cf2d16c`; exact-target runtime authority API returned set ID `4352` and five authorities.
- Raw 574-byte FRNK justification: round `46478`, four precommits, all target the exact commit target, no ancestry headers.
- Independent reparse and independent Python `cryptography` Ed25519 verification: all 4/4 signatures verify under inferred candidate set ID `4261`; 0/4 verify under observed `4352`. All four signer keys belong to the observed five-authority list. Bounded candidate search `4096..4352` found only `4261`. This repeats the same mismatch on a fresh target and strengthens diagnostic reproducibility; it does not authenticate set ID 4261 or finality.
- Authority-transition witness was not found in the dense scan `2470400..2471424`; `provenance_verified=false`, B3-A remains OPEN. Public RPC still returns METHOD_NOT_FOUND for `state_getCode` and `grandpa_proveFinality`; WebSocket raw justification capture/header binding succeeded.
- Do not trust the inferred ID, weaken the verifier, or rerun an identical boundary wait. Next useful action is a specific upstream/operator query about the observed set-ID/signature conflict, plus obtaining a genesis-rooted transition proof or an RPC route exposing verifiable runtime-code/execution/finality evidence. Details: [central coordination §45.23](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/IMMORTAL_WORK_COORDINATION.md).

No live transaction or receipt was submitted. No V3/Reveal or production semantics were changed.

### Agent A — runtime WASM acquisition path corrected after fresh Materios capture (2026-10-27)

The fresh GRANDPA witness artifact showed that `state_getCode` returns `-32601 Method not found` on the public Materios RPC. This is an observer bug, not proof that runtime WASM is unavailable: Substrate exposes the runtime code under the `:code` storage key. On `work/immortal-green-closure`, `MateriosRpc.getRuntimeCode(at)` now queries `state_getStorage("0x3a636f6465", exactBlockHash)` and fails closed if absent; tests now assert that exact method/key/hash. Commits: fix `b7fe03ea03eaa66a02a55b9e4fd55e3ad411a99f`, tests `6e576c28ef179f8ac8b7ebaa4ac086b761d2384e`.

- [Materios Canonical Evidence & Finality Boundary #178](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551713798) — SUCCESS.
- [Documentation Link Check #2522](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551713799) — SUCCESS.
- [Materios B3 execution-proof verifier #124](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551714015) was pending when recorded; inspect it before claiming the checkpoint RPC tests passed.

This improves runtime-code acquisition only. The WASM remains untrusted until its hash is anchored to a trusted runtime identity/state proof. It does not solve the repeated GRANDPA set-ID mismatch: fresh block 2471424 signatures verify 4/4 under inferred 4261 and 0/4 under runtime-returned 4352. B3-A remains OPEN; no live transaction.

### Agent A — live confirmation of runtime WASM acquisition fix; witness job still blocked (2026-10-27)

The corrected `:code` query was exercised by [Materios B3 execution-proof run #124](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551714015). Overall workflow result: FAILURE because this branch's GRANDPA capture job lacks the separate WebSocket probe step and direct `grandpa_subscribeJustifications` returned `METHOD_NOT_FOUND`. Rust verifier tests and live storage-proof jobs passed; finalized-state capture passed.

Finalized-state artifact [12754214870](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551714015/artifacts/12754214870), JSON SHA-256 `1ad442dc1a9d01aefb0dce85aa150ffbb6697b26df327db4d96bf53bbb6d6e82`, confirms runtime WASM was acquired via exact `:code` storage at finalized block `2471591` / hash `1ca50d7ccf0156c34a0942b4020af15b52d6a2edf9bddb4523ac362d136d4636`. Byte length `857434`; SHA-256 `4f4ee403ab22cd1f35c96aebaa2ba37508611e976a603e6b22b2ea03ec68f3d2`; Blake2-256 `98cab6b1b3d84179fdb252ce281e842310a48461c5e8ea802ea5fd5b33c91c7b`. These are observed byte hashes, not an independently trusted runtime identity. Set ID remains `4352`; `grandpa_proveFinality` remains unavailable. Agent C's separate B3 branch has the WebSocket probe and independently reproduces the 4261-vs-4352 signature mismatch; see central coordination §45.23–45.24.

Next: Agent C should review the small `:code` fix/test commits `b7fe03e` and `6e576c2` already documented in its branch coordination note, rather than Agent A duplicating the B3 WebSocket workflow. No protocol semantics changed; B3-A remains OPEN.

### Agent A — refined external candidate #1 identification from official Hydra source (2026-10-27)

Follow-up source check found that external out-ref `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0` has payment credential `fd75e24c9ea915ce8e48d3ff1d0c54ad09cc01191c24416ad7dba4a3`, which the official Hydra `script-hashes.json` maps to the **Hydra Head validator v2.2.0**; an upstream Preprod address test uses the same hash. See [official hash map](https://github.com/cardano-scaling/hydra/blob/c304b9ad793836d4105d7ca38fcd8572b5cb9672/hydra-chain-observer/script-hashes.json) and [Preprod test](https://github.com/v0d1ch/hydra.registry/blob/dd2baa3f154c1f787411cc17cd3216699db72588/api/test/L1HeadScanSpec.hs).

Correct interpretation: this payment script is consistent with an official Hydra Head V2.2.0 Preprod output; the `HydraHeadV2` name alone still does not authenticate the token minting policy, whose derivation is parameterized. This is **not a DEX pool** and its ADA/BTC/tUSDM balances are not a market reserve/quote. The exact token policy/seed derivation and datum semantics remain unverified. The second external script candidate remains unidentified. Memo §31 contains the correction; no conversion or production gate changes.

### Agent A — both strongest external script candidates now mapped to protocol validators (2026-10-27)

- Candidate `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0`, payment credential `fd75e24c9ea915ce8e48d3ff1d0c54ad09cc01191c24416ad7dba4a3`, matches the official Hydra Head validator hash for version 2.2.0. Treat it as a Hydra Head state output, not a DEX pool; the token policy's seed derivation remains unverified. See memo §31.
- Candidate `f27b6b913bebca852dfbb8ec4585ec5925c1d04ed05ea9cb96720712c9df11cd#1`, payment credential `94bca9c099e84ffd90d150316bb44c31a78702239076a0a80ea4a469`, matches the public Seedelf Wallet validator v1 and is independently listed in the Cardano Contracts Registry. Its tUSDM/ADA/native-token quantities are wallet holdings, not pool reserves or a quote. See [Seedelf constants](https://github.com/logical-mechanism/Seedelf-Wallet/blob/5abd547032782caeb5253229e86cc30204db0af5/seedelf-data/api/src/constants.rs), [registry entry](https://github.com/StricaHQ/cardano-contracts-registry/blob/c72a37d31c4eddd31655f9386c70265b8795dd93/projects/seedelf.json), and memo §32.
- Both out-references and their datum/value evidence matched the independent Koios re-read. Both are now identified as non-DEX protocol outputs; no market price is inferred from their holdings.

This resolves the two strongest external script candidates surfaced by the broad tUSDM scan, while the configured Minswap V1/V2/StableSwap exact-pair result remains negative. It does not exhaust all Cardano DEXes and does not qualify any USD/USDM source. Option B remains selected but unqualified; no parity, transaction, EEV approval, or Issue authorization.


### Agent A — Mainnet Moneta-USDM run #4 inspected: CANCELLED, no on-chain conclusion (2026-10-27)

Inspected [run #40546067834](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40546067834), source commit `f3dcf7458397598dc73b521d90cd2ae8abbab44c`, job logs and artifact ID [12754795928](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40546067834/artifacts/12754795928). Checkout, Node setup, JSR configuration and SDK installation completed. The query step was cancelled at the workflow's 20-minute timeout while the observer was running; the uploaded observation JSON is empty (0 bytes). There is no valid Mainnet pool result in this run.

Source inspection of `audit/cardano-integration/observe-minswap-mainnet-moneta-usdm.mjs` (blob `c724fd8a4fcac41f17c2a1f05015e19c140859f4`) shows the observer pages the exact Mainnet Moneta-USDM asset UTxOs in 100-row batches, bounded at 25,000 rows, with up to four attempts and 45-second request timeouts, then separately scans the Minswap V2 pool-auth asset and configured pool candidates. The log does not expose which exact request remained pending at cancellation; excessive scan duration is a plausible operational cause, not a confirmed diagnosis.

Classification: `CANCELLED / NO RESULT`; never interpret this artifact as `NO_EXACT_ADA_MONETA_USDM_PAIR_FOUND`. Do not rerun an identical scan unchanged. Next step should add bounded progress/diagnostic markers and a fail-closed incomplete-scan artifact or otherwise reduce the query scope with a justified, exact-asset strategy, while retaining the distinction between a completed negative scan and an incomplete query. Mainnet Moneta-USDM remains distinct from Preprod tUSDM; a discovered pool would still be `OBSERVED_NOT_QUALIFIED`, not USD/USDM conversion approval. No parity, transaction, EEV approval or Issue is authorized.


### CI triage — shared head `cc374da958bc5e7017779974dbb29ef998d06f8d` (2026-10-27)

Agent A reviewed the workflow results without changing protocol code or opening a branch.

- [Genesis Regime Carrier Conformance #40562305967](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562305967) — **FAILURE** at step 12, `Run V3 economic state carrier binding tests`. Exact compiler error from job log: `test/V3EconomicStateCarrierBindingTest.hs:18` imports `PlutusTx (toBuiltin)`, but the test-suite component cannot load hidden package `plutus-tx-1.67.0.0`; Cabal suggests adding `plutus-tx` to that component's `build-depends`. This is a test-component dependency/build wiring failure, not evidence of a V3 semantic or ledger failure. **Owner: Agent B** (V3 carrier/test boundary); add the dependency only to the relevant test-suite stanza, then rerun this workflow. Agent A did not edit the component to avoid overlapping the V3 owner.
- [IMMORTAL Cardano Integration Lab #40562306009](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562306009), [Haskell Semantic Conformance #40562305760](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562305760), and [Kernel Invalid-Class Fail-Closed Audit #40562306000](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562306000) were still reported `in_progress` by the Actions API during this review. Their log-download endpoint returned expired/missing log blobs, so no result is inferred from that retrieval failure; recheck run status/artifacts before classifying.
- Documentation Link Check #40562306123, Algorithmic Governability Adversarial Lab #40562305855, IMMORTAL Portability Conformance #40562305871, and Protocol Declaration Conformance #40562305992 were successful at this shared head. Portability's green workflow does **not** close pending V08/V09 vectors; retain the narrower status from §45.28.

**Disposition:** no change to V3, Reveal, economic semantics, wallet signing, or transaction submission. The carrier blocker is assigned to Agent B; Agent A continues the EEV/authoritative Issue path after the pending lab results are available.


### CI follow-up — shared head `cc374da958bc5e7017779974dbb29ef998d06f8d` final outcomes (2026-10-27)

Rechecked completed Actions runs and read the full job logs for the Cardano Lab, Haskell conformance, kernel audit and carrier workflow.

- [IMMORTAL Cardano Integration Lab #40562306009](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562306009) — **SUCCESS**, exact head `cc374da958bc5e7017779974dbb29ef998d06f8d`; evidence artifact [12763368218](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562306009/artifacts/12763368218), uploaded ZIP SHA-256 `eb663d6dea959f4450081427fe8f0e1df402d77c3b12f7d13c51721e94418d15`. The native ledger runner printed zero redeemer, Plutus execution, ledger-context and other ledger failures in the report-generation summary, and the JEV operational prompt generator tests passed. **Do not close P2.8 solely from workflow success or that summary**: its own gate requires the exact `ledger-evaluation-report.json`, typed redeemer outcomes/ExUnits, raw context materialization, native UTxO decoder result and their bindings. The uploaded packet is the next source to inspect before P2.8 is classified PASS/FAIL/BLOCKED.
- [IMMORTAL Haskell Semantic Conformance #40562305760](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562305760) — **FAILURE** at “Normalized Reference economic output”. The executable compiled, then failed opening `Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json` because the workflow runs it with working directory `plutus/`. The runner uses a repo-root-relative path. This is a deterministic path/cwd integration defect, not an observed economic-vector mismatch. **Owner: Agent B**, which owns the reference conformance evaluator introduced in the recent fail-closed change. Minimal correction should make the vector path valid from the workflow's `plutus/` working directory (or deliberately set a single documented working directory), then rerun; retain fail-closed assertions and V08/V09 pending status.
- [Kernel Invalid-Class Fail-Closed Audit #40562306000](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562306000) — **SUCCESS**. Logs show the negative twins for invalid classes, mismatched exposures, negative capital components, invalid pre-state and failed conformance evidence all passed fail-closed.
- [Genesis Regime Carrier Conformance #40562305967](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562305967) — **FAILURE**: test component `v3-economic-state-carrier-binding-tests` imports `PlutusTx (toBuiltin)`, but `plutus-tx` is absent from that test suite's own `build-depends`. **Owner: Agent B**; no Agent A edit to the V3-owned component.

Successful companion checks at the same source head: Documentation Link Check #40562306123, Algorithmic Governability Adversarial Lab #40562305855, IMMORTAL Portability Conformance #40562305871, and Protocol Declaration Conformance #40562305992. The portability workflow remains a limited executable-vector pass; it does not resolve V08/V09.

**Agent A disposition:** this follow-up is evidence triage only. The two build/conformance defects are assigned to Agent B; no duplicate patch, new branch, semantic change, wallet signing, or transaction submission was performed. First-ticket EEV/Authoritative Issue Admission remains independently gated.


### P2.8 evidence artifact inspection — run #40562306009 (2026-10-27)

Agent A downloaded and inspected artifact [12763368218](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562306009/artifacts/12763368218), ZIP SHA-256 `eb663d6dea959f4450081427fe8f0e1df402d77c3b12f7d13c51721e94418d15`, from exact head `cc374da958bc5e7017779974dbb29ef998d06f8d`.

- `ledger-evaluation-report.json` contains two redeemer entries, both `status: success` with ExUnits (spending redeemer indexes 1 and 2). Its SHA-256 is `848b18828633ec18f02e0973bf5d50dfd077ee439dcf00d46fe862170c3a731c`.
- `ledger-evaluation-binding.txt` binds transaction CBOR SHA-256 `97145e1d742aa3bf09d034f6eeb7e6da0e3c7eeab9d1c64d49f6d5058a76ce37`, protocol parameters, UTxO snapshot, epoch info, system start and evaluation report by content hashes.
- `verification-registry.json` reports PASS for `P2.8.CONTEXT.MATERIALIZATION`, `P2.8.YACI.UTXO.DECODER`, and `P2.8.LEDGER.EVIDENCE.GATE`; the registry explicitly limits this evidence to the exact commit/run and local Yaci context, not Preprod/mainnet. The manifest classifies the context as `raw-yaci-context-materialized` on `local-yaci-devnet` / Conway protocol major 11.
- `reference-conformance.txt` records V01–V07 and V10 as executable-vector PASS but V08 (`pending-schema-extraction`) and V09 (`pending-certified-kernel-fixture`) as pending.
- The resource audit reports observed max transaction size 16,384 bytes and measured candidate transaction/script sizes for this run; these measurements do not qualify unrelated production transaction paths.

**Disposition correction:** for this exact local Yaci evidence packet, P2.8's report-aware native-ledger evidence gate is now supported as **PASS**, rather than merely inferred from the workflow's exit code. This closes only the scoped P2.8 local run; it does not close V08/V09, the historical canonical Haskell Reveal-size issue, Haskell/Aiken semantic equivalence, production Preprod qualification, EEV, or first Issue. Do not change V3/Reveal semantics.


## 45.34 AGENT A — ADAPTER SALE + SDK CHECKS AT EXACT HEAD 324bc48 (2026-10-27)

Rechecked Actions runs created for the SDK export-map update at exact source HEAD `324bc48ffb1ae44853044fea1812628541cc2032`.

- [Cardano Adapter Sale Conformance #40579658987](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579658987) — **SUCCESS**. Both `economic-conformance` and `frontend-build` jobs completed successfully. The economic job passed the focused `AuthoritativeIssueAdmission.test.ts`, `preRichIssueAdmissionBridge.test.ts`, and `HaskellIssueAdmissionProvider.test.ts` suites, plus the repository-wide RF8 production-boundary audit. Frontend `npm run build` also passed. This is contract/build evidence on the exact SHA, not an EEV approval, live Preprod Issue, or wallet transaction.
- [IMMORTAL Portability Conformance #40579659046](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579659046) — **SUCCESS** for its two TypeScript suites. It does not execute the Haskell reference evaluator; V08/V09 remain pending.
- [Protocol Declaration Conformance #40579659067](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579659067) — **SUCCESS**, including protocol declaration tests and typecheck.
- [Documentation Link Check #40579659055](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579659055) and [Algorithmic Governability Adversarial Lab #40579659182](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579659182) — **SUCCESS**.
- The duplicate Adapter Sale run #40579636315 on the earlier inventory commit was cancelled after the exact-HEAD run started; no failure is inferred from that cancellation.

**Agent A disposition:** the focused Issue-admission contract tests are green, so the next blocker is not this TypeScript boundary suite. Live Issue still requires fresh Preprod observation, qualified current EEV evidence and current deployment approval/admission binding; none is established by these tests. No wallet signing, transaction submission, protocol change, V3/Reveal edit, new branch or EEV approval occurred.

## 45.35 AGENT A — FRESH PREPROD DIRECT-USDM EEV RE-OBSERVATION (2026-10-28)

Read-only qualification job [#40397642433, attempt 2](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40397642433) was re-run to refresh the previously stale live observation. **SUCCESS** at 2026-10-28 04:08 UTC. It executed the exact-pool read, EV1–EV7 qualification, evidence-integrity checks, and uploaded artifact [12791302528](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40397642433/artifacts/12791302528). Source-run SHA: `01e4d76eedf1a86cc08ab98326c1bf12d0086a9e`. The qualification workflow and its three critical source/integrity scripts have the same blob SHAs on current `work/immortal-green-closure`: workflow `c0c1b07cf25bc84f9d359462016263ca27b2d0da`, source-set producer `4fb265e9f1430f785af4e47276427570ed1dee8e`, qualification producer `bb88050e3ccb0b349eb01afd013ecb22e8027502`, integrity checker `af1de856e7edce1e738e0d0e5c6879c0bce8b6ed`.

### Observed physical-source evidence

- `preprod-direct-usdm-source-set.json` — `status: OBSERVED_NOT_QUALIFIED`, `observedAt: 2026-10-28T04:08:51.170Z`, evidence hash `5de6f96952edb612482c013609f0b31ff0773fe4451a425a7bfc4e43591e43cc`.
- Exact B1 PrizePool UTxO remains `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`, at `addr_test1wrhru9jt8jm600y2mltw300c9tu7cj5tuyew7lz0ex2p75gja592e`, with the expected pool singleton and exact Preprod tUSDM unit `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`.
- Direct physical quantity: `1,000,000,000` atomic units; profile derivation `floor(1,000,000,000 × 100 / 1,000,000) = 100,000` IMMORTAL USDM subunits, rounding `FLOOR`.
- `preprod-direct-usdm-qualification.json` — `status: qualified`, EV1–EV7 all present, qualification evidence hash `4a8cd8181690a5801b017318e5fdbb48215c090907a77087cbcb07f88b67ebba`; this qualification artifact explicitly has `deploymentApproval: null` and governance `deploymentApprovalStatus: PENDING`.
- Current artifact ZIP SHA-256: `fc5130f09bbf0ce8a3098542add8c780033a579a439318cc60dc96476edd3554`. Qualification JSON SHA-256: `6b330b07b76321c68a50d4545800a8a19ae0c0e544fc4a48735e0c278f4209b5`; source-set JSON SHA-256: `65d30b37b5d86488b6f05ae0d141471d4ee3652c2f0b8d63c264fe098817c0c7`.

### Boundaries and next gate

This refresh proves the source UTxO and the direct-USDM EV1–EV7 derivation at the observation timestamp only. It does **not** create `DEPLOYMENT_APPROVED`, certify USD/USDM parity or conversion, resolve the R1/`K_c` certificate, produce a current signed Issue-authority binding, authorize Issue admission, or issue/purchase a Ticket NFT. The source-set remains `OBSERVED_NOT_QUALIFIED` pending the separate deployment-approval decision.

The same artifact shows the materialized Oracle State manifest's `datumSemantics.timestampMs: null` with `maxAgeMs: 3600000`; therefore its price timestamp cannot currently support a freshness claim. Keep the USD/USDM conversion route blocked independently of direct physical tUSDM qualification. Do not infer a peg or conflate the Preprod test token with Mainnet Moneta USDM. No wallet signing, transaction submission, approval, economic-semantic change, V3/Reveal edit, new branch, SDK duplication, or Materios work occurred.

## 45.36 AGENT A — ORACLE STATE DATUM DECODE + LIVE FRESHNESS OBSERVATION (2026-10-28)

### Code defect fixed and tested

The existing-on-chain branch in `audit/cardano-integration/preprod-direct-oracle-state-bootstrap.mjs` previously checked that the Oracle State singleton had an inline datum but left its local `oracleTimestamp` unset. It therefore emitted `datumSemantics.timestampMs: null` even though the datum had a timestamp. This was a manifest-materialization defect, not evidence that the chain datum had no timestamp.

- Added `audit/cardano-integration/preprod-oracle-state-datum.mjs` to decode constructor 0 / five-field Oracle State datum and validate asset identity, configured price, publisher hash and non-negative timestamp.
- Added `audit/cardano-integration/preprod-oracle-state-datum.test.mjs` with positive decode and fail-closed tests for invalid CBOR, constructor/field count, negative timestamp, unexpected price, asset and publisher.
- The bootstrap now decodes and checks the actual UTxO datum for both reused and newly materialized states. It records the on-chain timestamp; it does not manufacture a fresh timestamp for an old datum.
- Added `audit/cardano-integration/preprod-oracle-state-liveness.mjs`, a read-only exact-singleton observer. `.github/workflows/preprod-eev-qualification.yml` now runs it before EV1–EV7 re-qualification; it records actual timestamp age and freshness status without failing or rewriting a stale timestamp to appear fresh.
- Added a fail-closed Oracle timestamp freshness check to `audit/cardano-integration/preprod-first-issue-readiness.mjs`. Its regression suite now verifies that missing and stale timestamps block readiness; the test fixtures use a currently fresh synthetic timestamp only for the valid path.
- The direct-USDM conformance workflow runs both new regression suites.

### Live Preprod evidence — exact commit `dd3f0cded40e115b70210872914322e5d6ed678e`

Read-only EEV qualification run [#40632174413](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632174413) completed **SUCCESS** at 2026-10-28 04:25 UTC. Its exact artifact is [12792161360](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632174413/artifacts/12792161360), ZIP SHA-256 `39495bdac71131d6cb0796a669e679a1462383dc017d8dd639289ac0f5b8b561`.

- Exact live Oracle State singleton: `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`; policy/unit and publisher identity match the deployment manifest.
- The decoded on-chain datum timestamp is `1791481130142` = **2026-10-08T17:38:50.142Z**. Observed at `2026-10-28T04:25:03.595Z`; age `1,680,373,453 ms` = **19.4488 days**, while configured `maxAgeMs = 3,600,000` (one hour).
- Observer status is explicitly `freshnessStatus: STALE`, `withinMaxAge: false`. Chain tip observed through Koios: Conway block `5,343,954`, hash `34180d6fb6294f478ff8b56a264231559b4408b803eb1cffb60605361c5afbfa`.
- The observer did **not** mutate the UTxO or refresh its timestamp. The configured datum's value of `100` USDM subunits per lovelace remains a fixed Preprod compatibility quote, not a current independently authenticated market observation.

### EEV and Issue gate disposition

The same exact run re-observed the direct-USDM source and successfully re-qualified EV1–EV7:

- Source-set `observedAt: 2026-10-28T04:25:05.301Z`, Pool UTxO `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`, physical tUSDM `1,000,000,000` atomic units, derivation `100,000` IMMORTAL USDM subunits; source-set evidence hash `4748b7b905a2c2150d6dc65e524b9d1f81076d4b2dad71b95076d26193255d1f`.
- Qualification status `qualified`, all EV1–EV7 present, qualification evidence hash `7e7392c1d196a76d20ded3e6db3167a26d72f24fd00d4d9080296e879beef204`. `deploymentApproval: null` / `deploymentApproval: PENDING` remains unchanged.
- All six current-commit workflows passed: [PRE-RICH Preprod EEV — Source Qualification Only #40632174413](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632174413), [Cardano Adapter Sale #40632174433](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632174433), [IMMORTAL Portability #40632174444](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632174444), [Protocol Declaration #40632174403](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632174403), [Algorithmic Governability #40632174448](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632174448), and [Documentation Link Check #40632174505](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632174505).

**Disposition:** physical direct-tUSDM EV1–EV7 qualification is current as of its observation time. Oracle quote freshness is independently **BLOCKED / STALE**; the first-Issue readiness gate now rejects this state. Do not reset the on-chain timestamp with the same hardcoded quote, treat a read as a price update, infer USD/USDM parity, or mistake EEV qualification for `DEPLOYMENT_APPROVED` or Authoritative Issue Admission. No EEV approval, wallet signature, transaction submission, V3/Reveal change, SDK duplication, new branch or Materios work occurred.

## 45.37 AGENT A — EXTERNAL ORACLE SOURCE-TRUTH GATE + FRESHNESS FAIL-CLOSED (2026-10-28)

### Guard added after the timestamp-only check

The Oracle contract separates a fresh timestamp from proof that the external price source is truthful. The live Oracle State is a deployment-wallet-signed **fixed compatibility quote**, not a separately qualified external ADA/USD or USD/USDM feed. A recent timestamp alone must not make that quote usable for settlement.

- `audit/cardano-integration/preprod-oracle-state-liveness.mjs` now puts the existing quote-inspection vocabulary into the materialized manifest: `qualification.externalPriceSourceVerified: false`, `sourceQualificationStatus: NOT_PROVEN_BY_DATUM_ALONE`, and explicit limitations on publisher trust and settlement authorization. It hashes the resulting exact manifest. The script remains read-only and preserves the datum timestamp.
- `audit/cardano-integration/preprod-first-issue-readiness.mjs` now verifies the Oracle State manifest's own `evidenceHash` against its exact contents, and independently requires `qualification.externalPriceSourceVerified === true` in addition to the timestamp being present, non-future and within `maxAgeMs`. A fresh-looking timestamp or a rehashed but unqualified compatibility quote no longer passes the source gate.
- `audit/cardano-integration/preprod-first-issue-readiness.test.mjs` now uses a synthetically qualified Oracle fixture only for the positive logic test and has a negative twin for `externalPriceSourceVerified: false`, in addition to missing/stale/future timestamp paths. The fixture is test-only; it is not live Oracle qualification.
- No source provider, quote, trust level, economic formula or protocol constant was invented or approved.

### Live Preprod recheck after observer classification update

[PRE-RICH Preprod EEV — Source Qualification Only #40632702232](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632702232), exact SHA `d63e5945299fbf36ebd0f2e2362e5c7e395442cf`, completed **SUCCESS**. Artifact [12791913625](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632702232/artifacts/12791913625), ZIP SHA-256 `39495bdac71131d6cb0796a669e679a1462383dc017d8dd639289ac0f5b8b561`.

- Oracle State exact singleton remains `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`.
- Datum timestamp remains `1791481130142` (`2026-10-08T17:38:50.142Z)); observed age `1,680,713,628 ms` against `maxAgeMs = 3,600,000`. Observer status remains `STALE` / `withinMaxAge: false`.
- Oracle manifest explicitly records `externalPriceSourceVerified: false` and `sourceQualificationStatus: NOT_PROVEN_BY_DATUM_ALONE`; this is now machine-readable instead of existing only in narrative.
- The exact B1 PrizePool UTxO was observed again at `2026-10-28T04:30:45.394Z`; the direct tUSDM quantity remained `1,000,000,000` atomic units / `100,000` IMMORTAL USDM subunits. EV1–EV7 qualified successfully, with qualification evidence hash `862f9f4dd354014001e8193cdb5c8ea4f4ff2a73788b77fd4025b4be0d774dc5`; approval remains null.

### Exact-head conformance on `1b85b9195db72de25d554799ad08f8a1cf7eb57b`

The additional source-truth guard and its tests passed the following exact-head workflows:
- [Issue Admission Boundary CI #40632765589](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765589) — SUCCESS, including the first-Issue readiness evidence-chain test.
- [PRE-RICH Direct-USDM Conformance #40632765585](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765585) — SUCCESS, including Oracle datum and readiness regressions.
- [Cardano Adapter Sale Conformance #40632765577](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765577) — SUCCESS, both economic conformance and frontend build.
- [IMMORTAL Portability #40632765642](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765642), [Protocol Declaration #40632765597](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765597), [Algorithmic Governability #40632765551](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765551), [Documentation Link Check #40632765542](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765542), and [Security Credential Boundary #40632765652](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765652) — SUCCESS.
- [IMMORTAL Cardano Preprod Context #40632765747](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765747) — SUCCESS. The separate [IMMORTAL Cardano Integration Lab #40632765612](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632765612) was still in progress at last check and is not classified here.

**Disposition:** direct physical tUSDM EV1–EV7 qualification remains green; current Oracle quote freshness is **STALE**, and external price-source truth is **NOT PROVEN**. First-Issue readiness is therefore **BLOCKED** independently of the EEV result and independently of any deployment approval. Do not refresh the timestamp without a genuinely authenticated new quote, infer USD/USDM parity, approve deployment, or submit a transaction. No wallet signing, transaction submission, V3/Reveal semantics, SDK packaging or Materios work changed.

## 45.38 AGENT A — CHARLI3 PREPROD FEED OBSERVATION: BOTH DOCUMENTED RECORDS STALE (2026-10-28)

### Read-only network observation

Added `audit/cardano-integration/observe-charli3-preprod-usdm-usd.mjs` and `.github/workflows/charli3-preprod-feed-observation.yml` to read the exact feed-NFT UTxOs at the network-specific addresses published by Charli3, inspect inline datum CBOR and record freshness without signing, submitting, or mutating chain state.

- Official feed config: [Charli3 Preprod network feed identities](https://docs.charli3.io/oracles/resources/networks/preprod).
- Official datum format: [Charli3 Datum Standard](https://docs.charli3.io/oracles/overview/datum-standard). The datum schema permits optional price identity/precision fields; those fields cannot be inferred when absent.
- First read-only run [#40633373252](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633373252) — **SUCCESS**, exact source SHA `f0e0a4b553694a0e5bd8b0530597339b372e2d48`; artifact [12792262931](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633373252/artifacts/12792262931). Manifest SHA-256 `aac6dccb27cc65b3a945f5d69e07059cc7c51f06904daef0bc9601f28d6cd910`; artifact ZIP SHA-256 `1d57202ea11379ff799aaff93c91bd83583a40f0b858cabb0b82a78ff7a92674`.
- Chain tip: Conway block `5,343,991`, hash `5342077fdccf874aa8b23c9b212f46ed37d3308fe6e97658b2a2669385d2b8a5`, chain-tip time `2026-10-28T04:37:34Z`.

### Exact feed-NFT observations

**USDM/USD**
- Officially documented feed identity was found as a unique live NFT at `addr_test1wr0q3fr83cr0zv4gfdvzcquqzy242hgmvt7ey2d938rtwugyc76x9`, exact out-reference `a71629ca1ef04971c27856830d5f4d5517462783df6c214357ca45e7be1777e5#1`; NFT unit `424f268a65632944ddfe17967208178082058cbe9044f53aee28697d4f7261636c6546656564`.
- Datum contains a positive integer `rawPrice: 894250000`, but the price precision and base/quote identity metadata are absent from the observed PriceMap. The timestamp is `1708484427386` = **2024-02-21T03:00:27.386Z**; its expiry is `2024-02-21T04:00:27.386Z`. At the 2026-10-28 observation the timestamp is about **980 days old** and the record expired. Published maximum age is 1 hour.
- Blockers: `STALE_TIMESTAMP`, `EXPIRED_PRICE_RECORD`, `MISSING_OR_UNSUPPORTED_PRECISION`, `EXPECTED_BASE_QUOTE_SYMBOLS_NOT_MATCHED`, no extended provider/signatory metadata. This value cannot be used for USD/USDM conversion.

**ADA/USD**
- Officially documented feed identity was found as a unique live NFT at `addr_test1wzn5ee2qaqvly3hx7e0nk3vhm240n5muq3plhjcnvx9ppjgf62u6a`, exact out-reference `6f518a1d46d9bcb00ca0a62cf467e111fe27a66deaf294db4472b0fe46014f52#1`; NFT unit `1116903479e7320b8e4592207aaebf627898267fcd80e2d9646cbf074f7261636c6546656564`.
- Datum contains `rawPrice: 407740`, but again lacks precision and base/quote identity metadata. Timestamp `1765707459510` = **2025-12-14T10:17:39.510Z**; expiry `2025-12-14T10:47:39.510Z**. The record is about **318 days old** and expired. Published maximum age is 30 minutes.
- Blockers: `STALE_TIMESTAMP`, `EXPIRED_PRICE_RECORD`, `MISSING_OR_UNSUPPORTED_PRECISION`, `EXPECTED_BASE_QUOTE_SYMBOLS_NOT_MATCHED`, no extended provider/signatory metadata. This datum cannot currently provide a qualified fresh ADA/USD leg.

### Interpretation and correction

Both feed-NFT UTxOs exist at the exact addresses in the official Preprod config, but their currently stored data are stale and expired. NFT presence alone does not establish the publisher’s current operation, datum authenticity, market truth or a safe settlement source. The probe therefore classifies the observation as `OBSERVED_NOT_QUALIFIED`; it does not infer a price scale, identity, USD/USDM conversion or provider liveness.

A small summary defect was found after this first run: stale/expiry/precision blockers were visible on each price record but were not all propagated into the top-level blocker list. It is fixed by commit `7105fae1dd84ca5977590d2ef53fdb751f3e7470` (`fix(oracle-audit): surface stale Charli3 record blockers`), which also adds explicit per-feed `status: OBSERVED_NOT_QUALIFIED`. The new read-only observation run [#40633551365](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633551365) was **in progress at checkpoint time**; its final result must be checked before marking the fix verified.

Current general CI on exact SHA `7105fae1dd84ca5977590d2ef53fdb751f3e7470` passed:
- [Cardano Adapter Sale #40633551405](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633551405)
- [IMMORTAL Portability #40633551404](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633551404)
- [Protocol Declaration #40633551388](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633551388)
- [Algorithmic Governability #40633551295](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633551295)
- [Documentation Link Check #40633551367](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633551367)
- [Security Credential Boundary #40633551393](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633551393)

**Disposition:** Charli3 is an on-chain-observed but **unqualified / stale** candidate; no current market-price source was found by this probe. Do not use the old datum, infer a 1:1 peg, or change the production Oracle/MintPolicy. USD/USDM conversion and first-Issue readiness remain blocked. No signing, submission, approval, V3/Reveal, SDK or Materios changes were made.

## 45.39 AGENT A — CHARLI3 BLOCKER SUMMARY RECHECK AFTER DECODER REPORTING FIX (2026-10-28)

Read-only re-observation run [#40633551365](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633551365) completed **SUCCESS** on exact code SHA `7105fae1dd84ca5977590d2ef53fdb751f3e7470`. Artifact [12793000182](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40633551365/artifacts/12793000182), ZIP size 2,613 bytes, artifact-manifest file SHA-256 `cd1e8ece74a8f3d8168f733487eae663fdf61d390ca3de939e2e752703c32f95`, evidence hash `0d1e5ca30fd1502ea6907945fce26638256b8b5c5bc1931df6e4cf09120f2176`.

The fix is verified: both feed entries now explicitly return `status: OBSERVED_NOT_QUALIFIED`, and stale/expiry/precision/identity blockers aggregate to the top-level manifest and each datum.

At the re-observation time `2026-10-28T04:39:47.642Z`, chain tip was Conway block `5,343,992`, hash `6a6f0953364ecd356ab3871d495ef487634d20f4d5c7156abc2b6cdeb4d89c58`.
- USDM/USD exact out-ref remains `a71629ca1ef04971c27856830d5f4d5517462783df6c214357ca45e7be1777e5#1`; timestamp age is `84,677,900,614 ms`, and expiry elapsed in February 2024.
- ADA/USD exact out-ref remains `6f518a1d46d9bcb00ca0a62cf467e111fe27a66deaf294db4472b0fe46014f52#1`; timestamp age is `27,454,868,490 ms`, and expiry elapsed in December 2025.
- Top-level blockers now include `STALE_TIMESTAMP`, `EXPIRED_PRICE_RECORD`, `MISSING_OR_UNSUPPORTED_PRECISION`, `EXPECTED_BASE_QUOTE_SYMBOLS_NOT_MATCHED`, `EXPECTED_PRICE_PAIR_NOT_FOUND`, and `EXTENDED_PROVIDER_AND_SIGNATORY_METADATA_NOT_FOUND`.

This confirms an on-chain feed identity is present, but the on-chain record carries no usable fresh rate and lacks price-precision/pair fields. It is neither a qualified ADA/USD leg nor a qualified USD/USDM leg. Do not use the raw integer price fields without a declared precision and exact base/quote identity; do not infer an exchange rate from symbol in the feed address alone. Current Oracle remains blocked, EEV qualification is separate, and the first Issue remains unauthorized.

## 45.40 AGENT A — R1/K_c CONCRETE CERTIFICATE AUDIT (2026-10-28)

### Normative requirement (not a runtime boolean)

Current source of truth: `docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` (blob `32b54c73f6676467d197e8f6635155e4752cc17e`), with `docs/02-certification/NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md` (blob `3befe38974c963d8701a93bd21131999973f3dbc`).

R1 is explicitly **not discharged** by the universal model or finite test fixtures. A concrete deployment must instantiate `(𝒮, A, Accept, Ω, T, Safe)`, provide an executable/deterministic characteristic predicate `χ` and witness selector `Wit`, discharge VC1–VC6, and bind the certificate to the declared initial state `S₀). The normative package enumerates E1–E10: E1 profile instantiation; E2 `χ`; E3 `Wit`; E4 VC2 safety; E5 VC3 inductiveness including all `ω ∈ Ω`; E6 VC4 acceptance; E7 authoritative/over-approximated Ω perimeter; E8 `S₀` non-vacuity witness; E9 conservatism/liveness cost; E10 SHA-256 digest of E2/E3 bound to deployment version. All six VC proof records and all ten E evidence records are required. R8 also requires the non-eroding-action/QNE check (or an explicit valid obstruction disposition); a constant safety margin or finite abstract model does not replace it.

### Current code/fixture audit

- Current `relayer/signedIssueAuthority.js` blob `bf3c93307c168661b592ed1aaf35f861d342896e` validates the external signed Issue authority envelope, requires VC1–VC6 and E1–E10 reference/digest fields, enforces Preprod deployment binding, and binds the certificate's carrier reference/state hash, EEV snapshot and ProtectedCapital source to the signed authority payload. It is a schema + signature + deployment-binding gate; it does **not** retrieve the referenced E1–E10 bytes or mechanically prove the mathematical claims from those references.
- Current `relayer/signedIssueAuthority.test.js` blob `c9bc1acd02ca4d2bca4c70c1682208d1bfc5f52f` supplies `proof://VC1...`, `evidence://E1...`, synthetic repeated SHA-shaped strings and a synthetic certificate digest. Those tests correctly exercise envelope signature/failure/binding contracts, but they are not a concrete R1 certificate and must not be cited as evidence that VC1–VC6 or E1–E10 are true for Preprod.
- Current `audit/preprod-issue/` tracked files are the initial-state, live-carrier and Issue/carrier-binding gap reports. No deployment-bound `K_c` certificate package (E1–E10 / VC1–VC6) is tracked there; `audit/preprod-evidence/` is generated workflow evidence, not a checked-in certificate.
- Current `audit/cardano-integration/preprod-first-issue-readiness.mjs` blob `456cc66b2aaf3c9b32711616edc07e0d6fa302f0` checks for a provider module, a syntactically valid authority URL/key, EEV evidence/approval and Oracle source/freshness. It does not currently acquire and validate a fresh signed Issue authority envelope containing a current deployment-bound `K_c` certificate. URL/key presence alone must not be interpreted as certificate availability.

### End-to-end authority producer boundary

A current source audit of `relayer/issueAuthorityServer.js` (blob `69348a48d3848368936d6c8540629ba4ef50b266`) and `relayer/preprodIssueObservationReader.js` (blob `77892b31de00d6f7eefd7955b5cfd410d7e36caf`) confirms the in-repository server is only a live observation/transport bridge. It reads exact Counter, Pool, B2 control and V3 carrier UTxOs, then calls the separately configured `ISSUE_AUTHORITY_SOURCE_URL` using `ISSUE_AUTHORITY_PUBLIC_KEY`; the reader expressly does not calculate EEV, ProtectedCapital or viability. The repository therefore has a signed-authority **consumer/verifier** and a server bridge, but no in-repo producer that creates the concrete profile `K_c` proof package. This is an intentional separation, not permission to synthesize those values in the relayer.

The preflight gate's checks that an authority URL and PEM key are syntactically present are configuration checks only. They are not proof that the external endpoint is deployed, responds with a current signed envelope, or possesses E1–E10/VC1–VC6 certification. Production readiness must remain blocked until that live envelope is obtained and matched against independently observed current refs and state hashes.


### Exact disposition and safe next gate

**R1 / concrete `K_c`: BLOCKED / NOT CERTIFIED.** Do not set `allOmegaSuccessorsCertified=true`, do not accept a certificate merely because its fields/digests have the expected shape, and do not manufacture `S₀`, `χ`, `Wit`, QNE or proof refs from GoldenVectors/finite model tests.

The safe integration step is to make first-Issue readiness consume a **fresh, signed authority envelope for the exact current live candidate** and verify its signature and binding against independently observed Counter, Pool, B2 control, V3 carrier, direct-USDM snapshot and ProtectedCapital provenance; the external certification package must identify verifiable E1–E10 and VC1–VC6 artifacts and the profile's QNE/non-vacuity evidence. The certificate's on-chain binding must be for the actual carrier state hash and EEV snapshot, not a stale placeholder. This is a design/verification gate, not permission to create or approve such a certificate in CI.

This R1 finding is independent of current Oracle blockers: the bootstrap Oracle quote is stale and external price-source truth remains unproven; physical direct-tUSDM EV1–EV7 qualification does not close R1. No signer, protected environment, external endpoint, certificate artifact, wallet signature, transaction, V3/Reveal semantics or economic rule was changed.

## 45.41 AGENT A — CHAIN-TIP-BASED ORACLE FRESHNESS RECHECK (2026-10-28)

### Fresh qualification run and source evidence

After changing `preprod-oracle-state-liveness.mjs` to classify quote age against Koios Preprod chain-tip `block_time` (rather than runner wall-clock time), [PRE-RICH Preprod EEV — Source Qualification Only #40637931429](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931429) completed **SUCCESS** on exact SHA `949b431874517df7981e0dc284b507fd4b2c07d3`. Artifact [12793977696](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931429/artifacts/12793977696), ZIP SHA-256 `d952e66af6f8d041caf24a4a920070e74d00a176526910ebde52c8df42433887`.

The qualification workflow performed the read-only Oracle State datum decode, then re-observed the exact B1 PrizePool and requalified EV1–EV7:

- Oracle State remains `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`, policy `9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e`, token name `ORACLE`, publisher PKH `69fe256b67d8f11822a34b250ab8ba271bdedb513daf99e618b6bc89`.
- Datum holds the legacy ADA/lovelace quote at `100` IMMORTAL USDM subunits per lovelace; on-chain timestamp `1791481130142` = `2026-10-08T17:38:50.142Z`.
- Using the observed Cardano chain tip (Conway block `5,344,111`, hash `c245a48c9930d1c1ab9bf04a5062f1dd66c445e0125f71bcc907b90f58b7c288`, chain time `2026-10-28T05:25:50Z)), observed quote age is `1,684,019,858 ms`, versus `maxAgeMs = 3,600,000`. Status stays `STALE`; `withinMaxAge = false`. The runner time is recorded separately and does not drive the freshness calculation.
- Manifest evidence hash `70c73e5ced3b95d98cf94308e19d1836bc38132248dfa3d3286a9c89e2766c05`; source-set observation `2026-10-28T05:26:00.354Z`, exact Pool UTxO `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`, physical tUSDM `1,000,000,000` atomic units, derived `100,000` IMMORTAL USDM subunits, source-set hash `32e27f364ae7923a765a25b55953b67bd2c58a79a3fe1a6947ae42b9c1fcd534`.
- Qualification hash `2d54ceddb89586bd682b91324e5341ebaf940f86e894db40fcebcf967e366336`; EV1–EV7 all qualified for the direct physical tUSDM profile. `deploymentApproval: null` / `PENDING` remains unchanged.

### Runtime Oracle identity remains unobservable

The updated trigger ran [Oracle Quote-Set Read-Only Observation #40637931450](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931450). Its **bootstrap-wallet read-only job passed** and confirmed the same legacy single ADA quote is stale (`STALE_TIMESTAMP`, `LEGACY_SCHEMA_SUPPORTS_ONLY_ONE_ASSET_QUOTE`), with `sourceTruthProven: false`, `externalPriceSourceVerified: false`, and `configuredPublicPagesRuntimeIdentityProven: false`.

The separate job intended to inspect the configured public/runtime Oracle failed its configuration gate before querying the chain: `BLOCKFROST_PROJECT_ID`, `ORACLE_STATE_ADDRESS`, `ORACLE_STATE_POLICY_ID`, `ORACLE_STATE_TOKEN_NAME_HEX`, and `ORACLE_PUBLISHER_PKH` are all absent from the workflow's configured secrets/vars. No observation artifact was produced for the public-runtime Oracle identity. This is an explicit configuration/identity gap, not evidence that the runtime uses the bootstrap singleton.

### Exact-head CI and disposition

On exact SHA `949b431874517df7981e0dc284b507fd4b2c07d3`, these bounded checks passed: [Cardano Adapter Sale #40637931448](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931448), [IMMORTAL Portability #40637931483](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931483), [Protocol Declaration #40637931414](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931414), [Algorithmic Governability #40637931437](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931437), [Documentation Link Check #40637931396](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931396), [Security Credential Boundary #40637931421](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931421), [IMMORTAL Cardano Preprod Context #40637931392](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931392). The separate [IMMORTAL Cardano Integration Lab #40637931425](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40637931425) was still in progress at last check.

**Disposition:** direct physical tUSDM EV1–EV7 qualification is green at its observation timestamp; deployment approval remains absent. Oracle freshness is definitively stale even against ledger time; the fixed quote's external source is unqualified; and the configured public-runtime Oracle identity cannot be observed until its five configuration values are provisioned. Do not change the old timestamp to simulate an update, use Charli3's stale/metadata-incomplete feed records, infer USD/USDM parity, or treat these read-only checks as authorization. No approval, wallet signature, transaction submission, V3/Reveal change, new branch, SDK duplication or Materios work occurred.

## 45.42 AGENT A — HISTORICAL EEV APPROVAL RECONCILIATION (2026-10-28)

A read-only search of the `main` branch's Action history found a real prior protected approval that must be preserved in the record: [PRE-RICH B1 EEV Deployment Approval #39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) completed **SUCCESS** on 2026-10-21 05:57 UTC. Its artifact is [`immortal-preprod-eev-approved`, ID 12324421376](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679/artifacts/12324421376).

The artifact's `preprod-direct-usdm-approved-qualification.json` records:
- `deploymentApproval.status = DEPLOYMENT_APPROVED`, profile `PRE-RICH-EEV-USDM-DIRECT-V1`, exact Pool candidate `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`.
- Approval `validFrom = 2026-10-21T05:57:26.889Z`, environment reference `github-actions:environment/PREPROD-EEV-APPROVAL/run/39552468679`, actor `LiberoNuvola`.
- Approval evidence hash `afd20f53321b624b0e38261fbbf6c8f52ce50a6b52c77d5268f049d7f140b1ab`; it binds qualification hash `d093617ae4d16d24cce9732bca34fa2ac261a361537dd75397159eeef3759c0b`, source-set hash `7645d64514b17f025d0ff5f3ba0780cbee88a4331e77a57e7d07cb0862e8da00`, deployment hash `a3202a182b6613969d5bfa8320af1ea1b9045e77013f3eef01c40f8a6a24eae4`, and Oracle State manifest hash `cf6c9784c805b77eb6550795c5cdbc13973c98d3a81381594cd89510d4f8f374`.
- That approved artifact's Oracle datum manifest had `timestampMs: null`; the source-set was observed on 2026-10-21. It predates the decoder/freshness/source-truth gates and cannot be treated as proof that the Oracle price source was fresh or qualified.

The 2026-10-28 read-only qualification artifact on SHA `949b431874517df7981e0dc284b507fd4b2c07d3` has a **different** source-set hash `32e27f364ae7923a765a25b55953b67bd2c58a79a3fe1a6947ae42b9c1fcd534`, qualification hash `2d54ceddb89586bd682b91324e5341ebaf940f86e894db40fcebcf967e366336`, and Oracle evidence hash `70c73e5ced3b95d98cf94308e19d1836bc38132248dfa3d3286a9c89e2766c05`. Its newly generated qualification correctly has `deploymentApproval: null`: the current read-only run did not create or copy approval.

**Correct interpretation:** a protected `DEPLOYMENT_APPROVED` historical record exists for the same exact Pool out-ref/profile; it must not be described as never having existed. However, it is tied to older evidence digests and does not satisfy the present first-Issue readiness gate's exact evidence binding. Whether the earlier candidate-level approval can be reused via the declared `LIVE_UTXO_REVALIDATION` rule or must be renewed is a governance/conformance question; do not silently rebind old approval to new hashes. Regardless, current Issue readiness remains **BLOCKED** independently because the live compatibility Oracle quote is stale, external price-source truth is unproven, the public Pages runtime Oracle identity cannot currently be observed (five repo variables/secrets missing), and the concrete R1/`K_c` authority package is not certified. No new approval, wallet signing, transaction submission, V3/Reveal change, new branch or Materios work occurred.


## 45.43 AGENT B — PRE-SIGN TRANSITION/BODY-BINDING REVIEW GATE (2026-10-28)

The SDK API contract proposal now records a review-only candidate for the pre-sign transition-intent and completed-body contract with three separated phases: pre-sign intent/admission provenance; inspection of the completed Lucid body before wallet signing; and submit receipt plus independently observed ledger evidence.

The draft specifies role classification for protocol state inputs, wallet-balance inputs, reference inputs, protocol outputs/payments, wallet change, fees and validity fields. It records per-transition predicate inventories for Issue/Reveal/Claim/Expire and adversarial positive/negative cases; negative twins must prove that signing and submission are never called.

Guardrails: no fingerprint formula, digest encoding, fee ceiling, validity rule or economic rule was invented. Issue retains its Haskell decision source and applicable V3 carrier binding; V3 and Reveal semantics are unchanged. Reveal/Claim/Expire local-Yaci trace hashes remain observations, not production pre-sign authorization. No runtime code, adapter API signature, public package, wallet action or transaction changed.

V08/V09 remain open. Concrete R1/K_c, Oracle source/freshness and EEV/Issue-admission gates remain independent. Agent A's Oracle/EEV front was not duplicated; Materios remains paused.

**STATUS: DRAFT CONTRACT DETAIL RECORDED; REVIEW GATES MADE TESTABLE; RUNTIME INTEGRATION STILL BLOCKED ON APPROVAL/PROVENANCE.**


## 45.44 AGENT B — ADDITIONAL SPENDING-INPUT CLASSIFICATION GATE (2026-10-28)

### Runtime increment

`Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` now keeps the existing check that every declared protocol input is present, and classifies any additional spending inputs against the selected wallet's own UTxO listing. An extra body input that is not in that list—or an unavailable, failed or malformed wallet UTxO listing—causes `submitEconomic` to reject before signing or submission. The wallet UTxO query is only required when additional body inputs exist.

Regression cases added to `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts`:
- allow an extra input when the exact reference is returned by the connected wallet UTxO list;
- reject an extra input not returned by that list;
- reject extra inputs when the wallet UTxO list cannot be read.

### Scope and remaining blockers

This closes only the *unclassified additional spending-input* sub-gap. It does not bind the full output/datum/redeemer/value/mint/validity map to the pre-sign intent, and wallet-list membership alone does not prove that an extra input is economically inert. Full transition-body binding and fingerprint producer/canonicalization ownership remain open. No CI-green claim is made until the latest-head workflows are observed. No V3 carrier, Reveal, economic-kernel, R1/K_c or Agent A Oracle/EEV semantics were changed; Materios remains paused.

**STATUS: EXTRA-INPUT CLASSIFICATION IMPLEMENTED WITH FOCUSED REGRESSIONS; COMPLETE BODY BINDING STILL OPEN.**


## 45.45 AGENT B — INPUT-CLASSIFICATION CI EVIDENCE (2026-10-28)

Verified workflow evidence on exact HEAD `cf9a39cef0098c49b97d10353e2069a60bf59df6`, which contains the adapter change `962ea8cdb10e8ea6a81c33ece95fb3238cabc776` and regression-test change `2ef7616a98975aa7fb61e4b1a984b3c22493d42e`:

- [Cardano Adapter Sale Conformance #40639261291](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40639261291) — **SUCCESS**. Both `economic-conformance` and `frontend-build` succeeded. The economic-conformance job ran the focused `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts` test file in its Vitest command and passed.
- [IMMORTAL Portability Conformance #40639261384](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40639261384) — SUCCESS.
- [Algorithmic Governability Adversarial Lab #40639261305](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40639261305) — SUCCESS.
- [Protocol Declaration Conformance #40639261328](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40639261328) — SUCCESS.
- [Documentation Link Check #40639261306](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40639261306) — SUCCESS.
- [Security Credential Boundary #40639261315](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40639261315) — SUCCESS.
- [IMMORTAL Cardano Preprod Context #40639261330](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40639261330) — IN_PROGRESS at observation time.
- [IMMORTAL Cardano Integration Lab #40639261321](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40639261321) — PENDING at observation time.

This is successful focused regression/build evidence for additional-input classification. It does not prove all transaction outputs/datums/redeemers/validity are bound to the admission, and it does not establish a Preprod transaction or close V08/V09/R1/K_c.

## 45.46 AGENT B — PARALLEL SDK + MATERIOS/ORYNQ COMPATIBILITY PASS (2026-10-28)

### SDK / Cardano pre-sign boundary

Current observed integration branch HEAD: `31e264169e16b95955d25de0cacdd9b173352fca` (`docs(coordination): record pre-sign input mutation guard`). It includes the narrow additional-input classification and pre-sign input-mutation guard.

Exact-HEAD GitHub Actions checks observed on `31e264169e16b95955d25de0cacdd9b173352fca`:
- [Declaration conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40740245236) — SUCCESS.
- [Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40740245053) — SUCCESS.
- [No-result-dependent-authority](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40740244832) — SUCCESS.
- [Economic conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40740244727) — SUCCESS.
- [Frontend build](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40740244727) — SUCCESS.
- [Documentation link check](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40740244663) — SUCCESS.

GitGuardian returned neutral because the scan was skipped for size; do not describe this as a security scan pass. The pre-sign check remains limited to the spending-input reference set. Full body-to-intent binding for protocol outputs, datums, redeemers, asset values, mint/burn, fees and validity remains open; V08/V09 and the independent R1/K_c and Oracle/EEV gates remain open.

### Materios / Orynq upstream compatibility audit

Read-only inspection of Flux Point Studios' `orynq-sdk` main confirms `@fluxpointstudios/orynq-sdk-anchors-materios` version `0.7.0` in `packages/anchors-materios/package.json` and its changelog. The existing IMMORTAL bridge on `work/b3-materios-provenance-evidence` still pins `0.6.2` in both `poc/materios-orynq-bridge/package.json` and its lockfile.

Compatibility findings:
- The bridge uses `MateriosProvider`, `merkleRoot`, `prepareBlobData`, and `submitCertifiedReceipt`; the 0.7.0 package entry point continues to export those names and additionally exports `resolveInclusion`, `MateriosSubmissionError`, and the Merkle proof helpers.
- The bridge does not currently branch on `err.code` or implement its own resubmission loop; its top-level handler reports the error message and exits. Therefore the documented breaking change from numeric `err.code` to the string `"not-landed"` has no identified direct call-site collision in this bridge.
- 0.7.0 changes the core dependency to `@fluxpointstudios/orynq-sdk-core@^0.4.0` and strengthens submission/inclusion recovery semantics. A dependency bump must update the lockfile and be validated with install, typecheck and deterministic bridge tests before adoption.
- The new `resolveInclusion` must only be used to resolve an `inclusion-unknown` result; a `MateriosCertificationError` after a landed receipt must never trigger receipt resubmission. No automatic retry behavior is added in this audit pass.

No package version or lockfile was changed in this pass because an installable 0.7.0 lockfile and local test execution were not available through this read-only GitHub review. Do not claim the bridge has been upgraded or runtime-tested against 0.7.0.

### Coordination / guardrails

This is a parallel compatibility audit, not a resumption of the blocked B3-A/B3-B proof claim. Materios remains an optional Agent C bridge, separate from the SDK core and Cardano pre-sign work. No V3/Reveal semantics, economic rules, Agent A Oracle/EEV logic, signing, deployment or on-chain submission changed. No new branch was created.

**STATUS: SDK narrow pre-sign regressions have exact-HEAD CI evidence; full transaction-body binding remains open. Orynq 0.7.0 compatibility has been source-audited but not installed or runtime-tested; dependency upgrade remains gated on reproducible lockfile and test evidence.**


### 45.47 POST-CHECKPOINT CI RECHECK — CURRENT SDK HEAD (2026-10-28)

The central checkpoint commit `89b815dcfa090652d1152a79953924f719ba7af4` has now completed the following exact-HEAD workflows successfully:

- [Cardano Adapter Sale Conformance #40743839461](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40743839461) — SUCCESS.
- [Protocol Declaration Conformance #40743839447](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40743839447) — SUCCESS.
- [IMMORTAL Portability Conformance #40743839216](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40743839216) — SUCCESS.
- [Algorithmic Governability Adversarial Lab #40743839180](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40743839180) — SUCCESS.
- [Documentation Link Check #40743839165](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40743839165) — SUCCESS.

These five workflows are the complete set returned by the Actions API for this exact SHA at the time of this recheck. No separate No-result-dependent-authority run was returned for this SHA; do not infer that gate passed from the other workflows. GitGuardian's previously observed skipped/neutral scan is not a security pass.

The upstream Orynq commit list was rechecked; latest remains `d1e1548682d33a430c0f42ac53f88f01a652fefe` (PR #220 flaky-test stabilization). No newer upstream commit was returned. IMMORTAL's Materios bridge remains pinned to 0.6.2 pending a reproducible 0.7.0 lockfile plus install/typecheck/test evidence.

**Next technical gate:** complete-body semantic binding remains the highest-priority SDK blocker. Do not change the Haskell fingerprint source, infer a fingerprint/canonicalization, or label V08/V09 closed without an approved per-action predicate profile and negative tests proving rejection before signing/submission. The current successful workflows do not constitute Preprod ticket settlement or close R1/K_c, Oracle or EEV gates.


## 45.48 AGENT A — ORACLE DATUM TIMESTAMP DECODED; QUOTE STILL STALE (2026-10-28)

### Exact-head evidence

The read-only workflow [PRE-RICH Preprod EEV — Source Qualification Only #40632174413](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40632174413) completed SUCCESS on `work/immortal-green-closure` at source commit `dd3f0cded40e115b70210872914322e5d6ed678e`. It is deliberately a source-qualification workflow, not an approval or Issue transaction workflow.

- Oracle datum decoder tests: 6/6 passed, including decoding the timestamp already present in the on-chain datum, and rejecting malformed CBOR, wrong constructor/field count, negative timestamps and mismatched price/asset/publisher.
- The read-only observer queried the exact configured Oracle State singleton `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0` and decoded timestamp `1791481130142` ms. It records the actual value rather than substituting runner wall-clock time.
- At the observed Cardano chain time in this run, `timestampAgeMs=1680373453` versus `maxAgeMs=3600000`; classification is `STALE` and `withinMaxAge=false`. This is a genuine live freshness blocker, not a parser defect.
- The exact PrizePool UTxO was re-observed as `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`. Its direct physical tUSDM qualification produced `verifiedUsdmSubunits=100000`, with EV1–EV7 qualified for `PRE-RICH-EEV-USDM-DIRECT-V1` and qualification hash `7e7392c1d196a76d20ded3e6db3167a26d72f24fd00d4d9080296e879beef204`.
- The source-set explicitly remains `OBSERVED_NOT_QUALIFIED` and the new qualification has `deploymentApproval: null` / approval `PENDING`. The workflow verifies there is no approval in this generated artifact and uploads source qualification evidence only (artifact ID `12792161360`, SHA-256 `39495bdac71131d6cb0796a669e679a1462383dc017d8dd639289ac0f5b8b561`).

### Disposition

The original producer defect is closed: an existing Oracle State singleton's inline datum is now decoded and its timestamp is validated. The on-chain timestamp has **not** been refreshed; the quote remains stale by roughly 19.45 days against a one-hour maximum. A fresh timestamp would not by itself prove external price-source truth: this is still a deployment-wallet-signed fixed compatibility quote, and the separate observation of the configured public Pages/runtime Oracle identity remains blocked by missing runtime configuration values, as recorded in §45.41.

Do not bootstrap over or silently migrate the singleton, alter its datum, infer USD/USDM parity, or invoke privileged approval from this source-only result. Keep first-Issue readiness BLOCKED until the live Oracle quote/source, public-runtime identity, current evidence binding and R1/K_c authority package meet their existing gates. No wallet signature, deployment approval, transaction submission, V3/Reveal semantics change, new branch, or Materios work occurred.



### 45.48 CURRENT BRANCH TIP RECONCILIATION — 2026-10-28

A new branch-tip commit appeared after the prior CI checkpoint:

- Current observed `work/immortal-green-closure` HEAD: `e144a35161cdf6eb0928877343e753a11247858a`
- Commit: [docs: pin Issue authority source and deployment evidence census](https://github.com/LiberoNuvola/Immortal-Protocol/commit/e144a35161cdf6eb0928877343e753a11247858a)
- Its change is documentation-only. It pins an authority-source/deployment/artifact census and keeps VC1–VC6/E1–E10, U-03, U-02/RF8, and the concrete authority deployment qualification OPEN. It does not claim that a signed envelope proves its asserted economic facts.

Exact-HEAD Actions recheck for `e144a35161cdf6eb0928877343e753a11247858a` returned these five completed successful workflows:
- [Algorithmic Governability Adversarial Lab #40749078320](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40749078320) — SUCCESS.
- [Documentation Link Check #40749078036](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40749078036) — SUCCESS.
- [Protocol Declaration Conformance #40749078062](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40749078062) — SUCCESS.
- [IMMORTAL Portability Conformance #40749078294](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40749078294) — SUCCESS.
- [Cardano Adapter Sale Conformance #40749078258](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40749078258) — SUCCESS.

This is documentation/conformance evidence only, not proof of complete transaction-body binding, production authority qualification, first-ticket Preprod settlement, or closure of R1/K_c, Oracle or EEV. The branch-tip census in the newer commit supersedes the older HEAD SHA recorded in earlier checkpoint paragraphs; retain older SHAs as historical evidence, not as the current ref.

### Parallel Materios/Orynq recheck

The latest upstream commit returned by the Orynq repository API remains `d1e1548682d33a430c0f42ac53f88f01a652fefe` (2026-10-28, PR #220 test stabilization); no newer upstream commit was returned. The IMMORTAL bridge branch remains at `cfb2de037da07396e32748e09c1f8438c96c5397` and pins `@fluxpointstudios/orynq-sdk-anchors-materios@0.6.2`. Its current source imports the four audited exports and has no custom error-code branch or resubmission loop. Keep 0.7.0 adoption gated on reproducible lockfile generation and executable install/typecheck/test evidence; do not infer runtime compatibility from source exports alone.

**Current work disposition:** preserve both open tracks separately. SDK: next gate is an approved per-action body predicate profile plus pre-sign negative tests; authority source/certificate/deployment evidence is a separate gate. Materios: continue source-level compatibility analysis only until a deterministic install/test environment is available. No new branch, transaction, signature, deployment or V3/Reveal/economic semantics change was made in this pass.


### 45.49 MATERIOS 0.7.0 MIGRATION GATE — PRESERVE POST-LANDING FAILURE EVIDENCE (2026-10-28)

A deeper read of the current bridge's live submission path and the upstream 0.7.0 README/changelog found an additional migration requirement:

- The bridge calls `submitCertifiedReceipt(...)` with certification and optional anchor waits. Its top-level `main().catch(...)` currently prints only `error.message` and sets a nonzero exit code.
- In upstream 0.7.0, `MateriosCertificationError` explicitly means the receipt was already stored/submitted, but a later certification or anchor wait failed. The error carries the submission result and stage. The upstream contract says **never resubmit** this error.
- The current bridge does not implement a retry loop, so no direct duplicate-resubmission path was found. However, its top-level error handler would not preserve the carried receipt result/tx hash/stage in the machine-readable evidence output if a 0.7.0 certification wait fails after landing.
- Upstream 0.7.0 also specifies that `inclusion-unknown` must be settled via `resolveInclusion(provider, error)`, while `not-landed` is the only class safe to resubmit with the same receipt ID. No such typed recovery logic is currently implemented in the bridge.

**Required before adopting 0.7.0:** add a typed, sanitized error disposition path and regression tests. For `MateriosCertificationError`, preserve the submission result, receipt ID/transaction hash, failure stage, and certification/anchor status without retrying. For `inclusion-unknown`, resolve finalized inclusion before classifying the submission. Only `not-landed` may be retried, with the exact same receipt ID and payload. Keep raw signer material and private RPC/gateway configuration out of logs. Test each error class with mocked SDK errors before any live submission.

This is a concrete compatibility/test requirement, not a claim that 0.7.0 has been installed or that runtime tests passed. Package/lockfile remain pinned to 0.6.2 until reproducible installation and test execution are available. No code, branch, signature or transaction was changed in this audit.

### 45.50 MULTI-ORACLE IMPLEMENTATION GAP — CODE AUDIT (2026-10-28)

A read-only source audit was completed and recorded in `audit/pre-genesis-genesis/MULTI-ORACLE-IMPLEMENTATION-GAP-20261028.md` (commit `05525cb5aec37e3e071de65c3bec612f9698ec2e`).

Findings:
- `Adapter/CARDANO/observation/OracleTypes.hs` supports an additive `OracleQuoteSet` data constructor for multiple asset-specific quotes in one Oracle State datum. This is multi-asset storage, not proof of independent multi-oracle aggregation.
- `plutus/Economic.hs` `oraclePriceFor` still accepts a single configured publisher parameter and checks the selected quote against it. A quote set with observations from different publishers cannot currently be treated as a quorum through this entry point.
- `Economic.totalUsdmValue` consumers identified: `plutus/MintPolicy.hs`, `plutus/B1PrizePool.hs`, and `plutus/PrizeValidator.hs`; changes to oracle resolution must be conformance-tested across all of them.
- `plutus/test/EconomicOracleTest.hs` already includes a multi-asset quote-set vector, duplicate-identity rejection, and a characterization test documenting that the configured legacy Oracle State remains authoritative over an unqualified candidate quote.
- USD/USDM remains unresolved at source/implementation level despite Option B being selected; no parity assumption is permitted.

Disposition: documentation-only, non-normative. No quorum, threshold, freshness, source-weight or fallback rule selected. No economic kernel, V3/Reveal, transaction, deployment approval or branch topology changed. Next gate is source-registry/verification-predicate design and ledger-level conformance vectors, with transaction-size and execution-budget measurements before any production integration.



### 45.51 CURRENT SDK VECTORS + MATERIOS RECOVERY TESTS (2026-10-29)

This entry records concrete work on the existing two branches; it does not promote either branch or close upstream/deployment gates.

#### IMMORTAL SDK / authoritative Issue vector

- Commit [`f2c54ef0da3a4da34569586aa3a88c60731ffa84`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/f2c54ef0da3a4da34569586aa3a88c60731ffa84) fixes the Haskell test's explicit `Prelude` import by bringing `Maybe(Nothing, Just)` into scope. No decision semantics, economic kernel, validator or V3/Reveal code changed.
- Added `scripts/verify-issue-decision-vectors.mjs` (commit [`55a8fb9bb1f74a226069bc5a4e873424298245e5`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/55a8fb9bb1f74a226069bc5a4e873424298245e5)) and wired it after `issue-decision-tests` in `.github/workflows/immortal-haskell-conformance.yml` (commit [`64041cbb4cfbcf418770d02497c5f71903e6dfd0`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/64041cbb4cfbcf418770d02497c5f71903e6dfd0)). The independent Node consumer checks one fixed Haskell-produced Issue decision vector, recomputes SHA-256 with Char8-compatible ASCII bytes, and validates the action preimage composition.
- Golden vector pinned by the consumer: pre-state digest `f4023fbcd4876200c00daa2c947b0836aa7b25b81b4113c61d034214b6c4e42d`; candidate-state digest `0a456146eff69a6a2f6c86d473ca95cced7eccd523dbb66124a635c7cece2fa6`; Issue action fingerprint `f075c7d9b87f1f4361cd02f15f67cef55d44e27918516409899b49e89e5b3303`. The consumer also pins the canonical strings and exact `Issue|0|1|preHash|postHash` preimage.
- Exact run [IMMORTAL Haskell Semantic Conformance #40817809315](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40817809315) was queued on current source `64041cbb4cfbcf418770d02497c5f71903e6dfd0` at the time of this checkpoint. Earlier run [#40816830724](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40816830724) on `f2c54ef` remained in progress and had not yet reported a result for the Issue vector step. **Do not claim this test gate GREEN until the new exact-HEAD run completes.**
- The current Node consumer proves one checked-in vector agrees across the Haskell producer and independent SHA-256 calculation. It does not prove universal canonicalization, full completed-transaction-body binding, authority truth or pre-sign enforcement for every action.

#### Materios/Orynq bridge on existing Agent C branch

- Current observed `work/b3-materios-provenance-evidence` HEAD: [`366946245f51812da1e4aa6a23754706a2463212`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/366946245f51812da1e4aa6a23754706a2463212).
- Added typed, sanitized error disposition and no-resubmit handling for `MateriosCertificationError`; `inclusion-unknown` only proceeds through `resolveInclusion` when the installed SDK exports it; `not-landed` is retry-eligible only when `safeToResubmit` is true and the receipt ID exactly matches the deterministic planned ID; `dispatch` and unknown failures fail closed. No automatic retry loop has been added. Top-level fatal logging emits only an allow-listed error type/code and does not print raw messages, causes, signer material or private URLs.
- Added five deterministic regression tests and made bridge CI run `npm run typecheck` and `npm test` immediately after pinned dependency installation and before contacting Materios. Exact run [Materios Orynq Evidence Bridge #40817432814](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40817432814) completed **SUCCESS** on this exact HEAD. All steps passed: pinned install; TypeScript typecheck; bridge tests; read-only RPC preflight; capture at the exact witness block; Rust verifier tests; independent state-root/storage-proof/exact key/value verification; sanitized witness and receipt-plan materialization; and dry-run Orynq receipt-plan generation.
- Artifact `materios-b3-verified-witness-and-orynq-plan` (artifact ID `12873630117`, 4,434 compressed bytes) contains two outputs. The verified witness file is 12,804 bytes with SHA-256 `dc64f92b7f58456efd5cef7ccbf58ec780b80b19bed69d35588f809d2954e4cc`; the sanitized Orynq plan is 609 bytes with SHA-256 `c124d1870a3f8688df45c32e0da09b854557f2e62b892621bdd340461fa5b4c1`. The target reported by the capture is block `2492392`, hash `0xd1547a8790783aec416722879b68f2156cdedc119bb6e59456240b2366cab4e9`, state root `0x964531e00b17b52b0e983fcc15443efa43ff8746a2b11eecaca82a845096817f`; the Rust verifier confirmed the exact key/value proof against that state root. The sanitized plan records content hash `0xa64f7fee902685ba2cbad87897a1859bd84d87cd0b357d8bca680d71fc736abd` and deterministic receipt ID `0xc2df44a4029562b978da11e76a446aaea398a8d176eeee6d0b75126496af3f74` (one chunk, 12,152-byte payload).
- Finality boundary remains explicit: the witness labels its `chain_getFinalizedHead` response as untrusted until independently verified. This run verifies the storage proof against the supplied header state root; it does **not** independently establish GRANDPA finality. No live Materios receipt was submitted.
- The bridge package and lockfile deliberately remain pinned to SDK `0.6.2`. Upstream GitHub source says `0.7.0`, while the public npm search result currently lists the installed package at `0.6.2`; a publishable/installable `0.7.0` tarball has not been confirmed. See [public npm package catalog](https://www.npmjs.com/search?q=keywords%3Aorynq). Do not claim the new resolver path was executed against published 0.7.0.
- The bridge CI is a read-only proof capture / deterministic test / dry-run path. No live Materios receipt was submitted; no signer was used; independent GRANDPA finality remains outside what this bridge proves.

#### Unchanged blockers and boundaries

- Full transaction-body-to-intent binding remains open: protocol outputs, datums, redeemers, asset values, mint/burn, fees and validity still require approved, versioned per-action predicate profiles plus pre-sign rejection twins. This increment does not close V08/V09.
- The independent `R1/K_c`, Oracle qualification, current EEV/deployment approval and first PRE-RICH Issue on Cardano Preprod remain separate gates. The stale configured Oracle quote noted in §45.48 has not been refreshed by this work.
- No new branch, wallet signature, live transaction, deployment approval, V3/Reveal semantic change, economic-kernel change, or Agent A Oracle/EEV implementation change occurred.


### 45.52 ISSUE VECTOR FOLLOW-UP + LEDGER LAB RESULT (2026-10-29)

#### Issue test compile correction

The exact run [IMMORTAL Haskell Semantic Conformance #40817809315](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40817809315) completed FAILURE on `64041cbb4cfbcf418770d02497c5f71903e6dfd0`. The first correction imported `Maybe (Nothing, Just)`; the next compiler failure showed that the test's explicit `PreRichIssueDecision` import still omitted the `IssueDecision` record selectors used by the vector checks. Commit [`ca2e9c15eaaf64751091a28f9f563f1b5a1dca13`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/ca2e9c15eaaf64751091a28f9f563f1b5a1dca13) now imports `IssueDecision (..)`. This is test-import scope only; no producer, economic, validator, V3 or Reveal logic changed.

The golden hashes were independently recomputed using SHA-256 over the exact ASCII/Char8 preimages and match the pinned values in §45.51:
- pre-state: `f4023fbcd4876200c00daa2c947b0836aa7b25b81b4113c61d034214b6c4e42d`;
- candidate state: `0a456146eff69a6a2f6c86d473ca95cced7eccd523dbb66124a635c7cece2fa6`;
- Issue action fingerprint: `f075c7d9b87f1f4361cd02f15f67cef55d44e27918516409899b49e89e5b3303`.

Run [#40820152084](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40820152084) was in progress on SHA `ca2e9c15eaaf64751091a28f9f563f1b5a1dca13` at last poll, still in Haskell setup before the Issue vector step. Do not call the Issue vector gate GREEN until this step and the independent Node consumer finish successfully.

The branch advanced concurrently to `bc0a6ac0d3e545524252368af8df4bd23840ded3` through five later Agent A Oracle registry/test/workflow commits (`60528a9`, `6cde82d`, `8016019`, `eb59f10`, `bc0a6ac`). The Issue test fix is an ancestor of the current tip; those intervening commits change Oracle/relayer scope rather than the Issue vector test. Preserve Agent A's changes and do not overwrite that work.

#### Cardano Integration Lab

[IMMORTAL Cardano Integration Lab #40816830711](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40816830711) completed **SUCCESS** on SHA `f2c54ef0da3a4da34569586aa3a88c60731ffa84`. Its job passed the Ogmios evaluator qualification, real Cardano ledger smoke transaction, active Aiken V3 economic Reveal transition trace, FundTreasury canonical Oracle valuation trace, and native Yaci UTxO decoder conformance. Treat this as Integration Lab evidence for that SHA, not as evidence that a user-owned PRE-RICH ticket was bought on Preprod.

A newer [Integration Lab #40820152076](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40820152076) was in progress on `ca2e9c1` at the last poll. The first Lab run's success does not replace the pending run's result if exact-SHA coverage is required.

**Disposition:** keep SDK Issue fingerprint/canonical-body binding, Agent A's Oracle registry work, R1/K_c and EEV/deployment approval as distinct gates. No branch topology changes, live wallet signature, Preprod ticket purchase, or V3/Reveal semantics change occurred in this increment.


### 45.53 ISSUE CANONICAL SERIALIZATION FIX + EXACT-HEAD CI PENDING (2026-10-29)

The Haskell run [#40820152084](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40820152084) completed **FAILURE** after the record-selector import fix. The failure was not a hash mismatch: the first test, `canonical Jackpot inactive serialization`, failed before the Haskell-produced vectors or Node consumer ran.

Source review identified the cause in `PRE-RICH/onchain/PreRichIssueDecision.hs`: the recursive `classes` serializer appended a trailing `|` after the final class, while the outer `joinFields` already inserted the separator before the following control state. That produced a non-canonical double separator. The fix separates class-field rendering from inter-class separators and emits no trailing separator. The multi-class golden in `plutus/test/PreRichIssueDecisionTest.hs` also omitted one canonical field (the Jackpot threshold zero); it now expects the complete ordered field sequence.

- Commit [`304bb53f6b49177aa029c4b806e1a0088fda60b1`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/304bb53f6b49177aa029c4b806e1a0088fda60b1): fix trailing separator in Issue canonical state serialization.
- Commit [`1f58942fa486ecaafdae5993ec5259b19b042fb2`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/1f58942fa486ecaafdae5993ec5259b19b042fb2): correct the multi-class canonical vector. This exact source revision includes both changes.
- Exact-revision Haskell conformance [#40823466348](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40823466348) is running on `1f58942`; at checkpoint time it is in Haskell setup, so the Issue test and independent Node vector consumer are **not yet verified green**.
- Exact-revision Cardano Integration Lab [#40823466339](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40823466339) is running on the same SHA and is still restoring the Cabal/Plutus build state.
- Earlier Integration Lab [#40820152076](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40820152076) completed **SUCCESS** on `ca2e9c1`, but that does not substitute for the newer exact-revision lab.

The patch is confined to the application-owned canonical serializer and its conformance fixture. It does not alter economic admission rules, state transitions, validator logic, V3/Reveal semantics, EEV/Oracle logic, or branch topology. Do not mark the Issue fingerprint gate GREEN until the new Haskell test and Node consumer have both passed on an observed run.


### 45.54 ISSUE FIX FOLLOW-UP POLL + CURRENT CI LIMITS (2026-10-29 05:51 UTC)

The prior Haskell run [#40820152084](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40820152084) failed at the first assertion, `canonical Jackpot inactive serialization`, before it emitted any ISSUE_VECTOR values. This run was on `ca2e9c15`, before the serializer correction. The observed corrective commits are:

- [`304bb53f6b49177aa029c4b806e1a0088fda60b1`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/304bb53f6b49177aa029c4b806e1a0088fda60b1) removes the trailing class separator from `canonicalV3State`, avoiding the extra separator when the outer serializer joins the control state.
- [`1f58942fa486ecaafdae5993ec5259b19b042fb2`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/1f58942fa486ecaafdae5993ec5259b19b042fb2) corrects the multi-class golden string to include the zero Jackpot threshold field.

As of this poll, branch `work/immortal-green-closure` HEAD is [`7f44012546b34cecc6923cebea25d0543eb47b46`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/7f44012546b34cecc6923cebea25d0543eb47b46). The commits after `1f58942` observed in the branch history concern Oracle currentness, anti-rollback, revocation, tests, and documentation; no later Issue serializer/test edit was observed. Preserve those concurrent Agent A changes.

The corrective-revision runs remain **in progress**, not green:
- [Haskell Semantic Conformance #40823466348](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40823466348), SHA `1f58942`: the last observed active step was “Beacon commitment cross-language conformance”; the Issue decision serialization/admission step was still pending. The job-log endpoint returned `BlobNotFound` while the run was active, so no result for the Issue vector or independent Node consumer is available yet.
- [Cardano Integration Lab #40823466339](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40823466339), same SHA: setup, Ogmios qualification, V3 Reveal reference-script publication, FundTreasury canonical Oracle valuation, and the TicketIssued 500x solvency boundary trace had passed; native Yaci UTxO decoder conformance was still active. Its job-log endpoint likewise had no published log blob during this poll.
- The earlier [Integration Lab #40820152076](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40820152076) is **SUCCESS** on `ca2e9c1`; it is useful earlier-revision evidence, not a substitute for the new run on the serializer fix.

**Next gate:** observe the completion of the Haskell and Integration Lab runs before updating the Issue-vector gate. To mark the Haskell gate GREEN, require the Issue Haskell test and `scripts/verify-issue-decision-vectors.mjs` both to pass. To claim a user-owned PRE-RICH ticket, separately require the actual Preprod admission certificate/deployment approval, wallet signature and confirmed on-chain issue transaction. No new wallet signature, live Preprod ticket purchase, or V3/Reveal semantic change is evidenced by this poll.


### 45.55 MULTI-ORACLE CURRENTNESS + PYTH OBSERVATION BOUNDARY (2026-10-29)

This is a coordination/evidence update only. It does not supersede protocol decisions, approve a feed, or close a production gate.

#### Multi-oracle registry and liveness

- The registry authority decision remains **OPEN**. The current Oracle State singleton is not a multi-oracle registry; a feed catalogue or signed observation does not establish authority to admit/revoke IMMORTAL source/feed/policy tuples.
- The observational contract is recorded in [MULTI-ORACLE-LIVENESS-REPORT-CONTRACT-v0.1-20261029.md](../../audit/pre-genesis-genesis/MULTI-ORACLE-LIVENESS-REPORT-CONTRACT-v0.1-20261029.md). It separates registry currentness, endpoint availability, observation integrity, measured freshness, optional divergence, and downstream policy evaluation. It defines no universal `healthy` boolean, threshold, aggregation, or fallback.
- The external-candidate boundary is recorded in [MULTI-ORACLE-EXTERNAL-CANDIDATE-BOUNDARY-AUDIT-20261029.md](../../audit/pre-genesis-genesis/MULTI-ORACLE-EXTERNAL-CANDIDATE-BOUNDARY-AUDIT-20261029.md), including the exact branch source review of the Pyth probe. Pyth observation verification and IMMORTAL source admission remain separate proof obligations.

#### Pyth observation verifier — exact source findings

- `scripts/testPythSignedUpdatePreprod.mts`, blob `0a2c62dab3296b7209bf9812f251254069ee082e`, fetches a genuine signed Pyth Pro/Lazer ADA/USD update and resolves the Pyth State through SDK/Koios. With the default no-submit mode it records `PREPARED_NOT_SUBMITTED` before wallet loading or transaction construction/signing/submission.
- `.github/workflows/pyth-native-ledger-probe.yml`, blob `5c0a4264ab48878a54b21f18a1188e4126a3a37d`, is manual-only; `submit_preprod` defaults false. This review did not dispatch it, access secrets, or submit a transaction. The connected GitHub actions interface has no workflow-dispatch creation action, so do not claim a live preparation artifact.
- `poc/aiken-pyth-ada-usd/lib/immortal/ada_usd_probe.ak` is isolated and uses feed ID 16 (ADA/USD), retaining raw price/exponent. No USD/USDM conversion or parity is implied.
- `plutus/PythQuoteCarrierBinding.hs` extracts a bound raw quote tuple but is not wired into production MintPolicy. `plutus/MintPolicy.hs` continues to value Treasury through `Economic.totalUsdmValue` and the legacy Oracle State path.
- A preparation-only run, when manually executed with the configured Pyth Lazer credential, would evidence successful state resolution and payload retrieval for that run only. It would not prove ledger signature acceptance/rejection, feed truth/liveness, IMMORTAL registry authority, USD/USDM denomination, or production quote-to-MintPolicy binding. The `submit_preprod=true` wallet-funded ledger path is a separate action and remains unperformed.

#### Routing / non-regression

1. Do not add a second parser, quote carrier, synthetic conversion test, or duplicate workflow. The next distinct external evidence step is an authorized manual dispatch of the existing workflow with `submit_preprod=false`.
2. Keep the source-admission authority gate open until an independently verifiable update-authorization predicate is established.
3. No signer set, quorum, aggregation, fallback, threshold, USD/USDM conversion, or provider/feed approval is selected.
4. No changes to V3, Reveal, EEV, Issue Admission, economic consumers, universal-kernel semantics, or Materios; no new branch or on-chain action.



## Agent C checkpoint — Issue authority proof producer still external/unverified (2026-10-29)

**Branch head at entry:** `b2d92d88f3a43b24d088ebb67376d04a76a7e1fe`.  
**Audit record:** [Universal Kernel Consumer Inventory](UNIVERSAL-KERNEL-CONSUMER-INVENTORY-2026-10-28.md), section “Follow-up deployment-artifact search”.

### New verified findings
- The current `.env.example` leaves `ISSUE_AUTHORITY_SOURCE_URL` and `ISSUE_AUTHORITY_PUBLIC_KEY` as commented placeholders; no concrete endpoint/deployment identity is committed there.
- `src/authoritativeIssueAdmissionProducer.ts` is dependency injection only and explicitly does not compute EEV, ProtectedCapital, viability or Gate truth.
- `src/remoteAuthoritativeIssueAdmissionProvider.ts` is an HTTP transport client; it accepts a returned admitted witness but does not independently prove the certificate.
- `relayer/issueAuthorityServer.js` composes Cardano observation and Haskell admission around an upstream authority URL. The upstream certificate producer/verifier has not been identified in the repository tree.
- The local signed-envelope path verifies signature, freshness, state/input binding and artifact-reference/digest structure; that is not independent validation of VC1–VC6, E1–E10, or Ω evidence P1–P8.

### Required external hand-off
The authority-service owner must provide: (1) source repository or immutable deployment artifact; (2) deployment version/identity and public-key fingerprint; (3) resolver for VC1–VC6 and E1–E10 references; (4) independent verifier/version and machine-readable results; (5) Ω perimeter package P1–P8 bound to the same model/deployment version. Do not request or commit private key material. If unavailable, classify the external dependency as unverified and keep first-user Issue fail-closed.

### CI snapshot for parent commit
At `b2d92d88f3a43b24d088ebb67376d04a76a7e1fe`, green: IMMORTAL Portability Conformance, Protocol Declaration Conformance, PRE-RICH B2 Control Carrier Conformance, Cardano Adapter Sale Conformance, Documentation Link Check, Algorithmic Governability Adversarial Lab. IMMORTAL Haskell Semantic Conformance, Cardano Integration Lab and Kernel Invalid-Class Fail-Closed Audit were still running at the time of observation. Preprod Context completed successfully, but reveal/deployment jobs were skipped. These results do not discharge Kc, concrete Ω completeness, proof-content verification, infinite-horizon viability, or the first real Preprod ticket.

**Scope guard:** no economic rules/constants, V3, Reveal semantics, branch topology, secrets, or ledger state changed. No workflow was manually dispatched and no transaction was submitted.


## Upstream Materios / Orynq / Flux Point delta — 2026-10-29 (Agent C)

Read-only upstream review completed against the public GitHub commit histories. This section records candidate reuse only; it does not certify upstream code for IMMORTAL or authorize a wholesale SDK upgrade.

### Upstream commits observed

- `Flux-Point-Studios/orynq-sdk` latest observed head: `d1e1548682d33a430c0f42ac53f88f01a652fefe` (2026-10-28). The 2026-10-28 release merged verifier hardening (#215), conduct sink-boundary honesty (#216), Materios WebSocket deadlines/recovery (#211), and package versioning (#218); a later merge (#220) fixes a randomized test flake in Midnight submission tests.
- Verifier hardening commit `14bb540bbebd5e82710c01aa3ff72af106cfb855`: Merkle verification now binds index and authenticated leaf count; expected Merkle root binds proof to the caller's anchored tree; partial disclosure is explicitly unbound and returns no disclosed data; rolling-hash sequences must be contiguous; trace events are hashed once during Cardano bundle verification. These are strong candidate regression requirements for any local provenance verifier, but are not a substitute for IMMORTAL's Materios B3 finality, historical storage, or runtime execution proofs.
- Materios adapter commit `931f41c30f184e77ed64ef7f8316dc59a789d7f6` (PR #211): adds bounded connection/submission waits, exact retry classification (`not-landed`, `inclusion-unknown`, `dispatch`), reconciliation after lost watches, finalized-storage settlement via `resolveInclusion`, and duplicate-safe same-payload recovery. The release note says `anchors-materios` 0.7.0 is a minor release but carries a migration note: callers must not assume a pool-refusal numeric code remains in `err.code`.
- `Flux-Point-Studios/materios` latest observed commit remains `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` dated 2026-10-21; no newer Materios-node commits were returned by the current history query.
- `Flux-Point-Studios/fluxpoint-plugins` advanced on 2026-10-29: `bf800d60dd758e7eb2082396a6667f121b551332` (#225) adds native proof/repair/replay safeguards, pinned Compact native verification controls, mutation ratchets, and repair evidence constraints; `fefe5db10fb168671c9d01d94d82a8b957045563` (#227) preserves once-only resumes and exact worktree bases; `175c0a79f9a998b5fe1e212b511dd490ec06f4a8` (#228) records measured role-effort data and version bumps. These are engineering-process/tooling candidates, not Materios protocol proofs or IMMORTAL economic evidence.

### Relevance and non-transfer boundaries

1. **Potentially reusable now as review criteria:** tree-bound Merkle proofs; authenticated leaf count/index; strict disclosure binding; contiguous sequence enforcement; explicit inclusion-unknown handling; idempotent recovery against the same payload; finite, surfaced timeouts and retained causes.
2. **Not established by these commits:** a real GRANDPA justification for IMMORTAL's target block; a finalized historical storage proof for the exact anchor; registration/availability of the Materios-native committee selector RPC; canonical runtime/WASM binding; or Ω/Kc/viability proof production for PRE-RICH Issue admission.
3. **No direct package integration was established in this pass.** GitHub code search returned no matching references to `@fluxpointstudios/orynq-sdk-anchors-materios` or `MateriosProvider` in the searched IMMORTAL code index. Search indexes/default-branch scope make this a bounded negative result, not proof of absence on every branch. Do not add the SDK as a dependency until the target branch's package manifests, lockfile, adapter boundary, and tests are inspected together.
4. **No semantic replacement:** do not substitute Orynq receipts/Merkle proofs for the separate B3-A finality, B3-B historical-state, or B3-C execution-proof obligations in `SEMANTIC-REVIEW-MATERIOS-B3-PROOF-BOUNDARIES-2026-10-21.md`. Preserve the existing fail-closed classification until the required native evidence is acquired and independently verified.
5. **Next scoped implementation step:** inspect the exact `work/b3-materios-provenance-evidence` source and current green branch dependency graph side-by-side; map each candidate SDK primitive to an existing call site and test; then propose only a minimal adapter-level patch with regression tests. No dependency upgrade, branch operation, workflow dispatch, transaction, or runtime/economic change was performed in this pass.



## B3 code-to-upstream mapping — follow-up inspection 2026-10-29

The targeted source/test inspection of `work/b3-materios-provenance-evidence` confirms the following before any SDK integration:

- `poc/materios-checkpoint/src/selectionCommitment.ts` already extracts the unique `SessionCommitteeManagement::set` inherent and fails closed on absent, duplicate, or truncated matching extrinsics. Its comments explicitly state that extraction alone does not prove canonicality/finality or execute the selector.
- `poc/materios-checkpoint/src/runtimeApi.ts` constructs the `calculate_committee` call data by concatenating supplied SCALE inputs with the SCALE u64 epoch. It explicitly does not synthesize the authority-selection inputs.
- `poc/materios-checkpoint/src/executionProof.ts` validates packet shape, input-hash/call-data bindings, packet identity and runtime-code binding; its module contract explicitly says this is not cryptographic trie/runtime/finality proof verification.
- Existing `test-executionProof.ts` has regression coverage for hash tampering, packet identity changes, exact call-data binding, malformed context, and selection-commitment matching. `test-rpc-b3.ts` covers exact RPC method/parameters, missing and duplicate GRANDPA justifications, and unique on-chain selection-input extraction. `test-rpc-capabilities.ts` correctly distinguishes a missing method from an unknown/malformed RPC catalogue.

### Decision

Do **not** add `@fluxpointstudios/orynq-sdk-anchors-materios` 0.7.0 as a dependency to the main PRE-RICH application at this stage. Its relevant retry/reconciliation behavior belongs to the submission/anchor adapter path; the B3 POC's critical unresolved boundary is independent verification of proof contents, exact finalized block/state binding, and canonical runtime identity. Adding a package alone would not close that boundary and could introduce its documented error-code migration.

Next code change should be scoped to the B3 POC after the independent verifier interface and evidence fixtures are identified: add a verifier-facing contract/test proving that the supplied proof packet is rejected unless the verifier result binds the same chain/genesis, finalized block hash and number, state root, runtime code hash, call data, result, and selection-input commitment. This is a proposed test obligation, not evidence that such a verifier currently exists. Keep B3-A/B/C classifications separate; do not upgrade the SDK or change economics, V3, Reveal, branch topology, or on-chain state as a shortcut.



## Agent C (Claude Code session) — external certificate-producer search, local-verifier boundary and Kc/Ω status — 2026-10-30

Section numbers in this file are duplicated across agents; this entry is deliberately unnumbered and is cited by heading and commit. It extends, and does not contradict, the earlier "Agent C checkpoint — Issue authority proof producer still external/unverified (2026-10-29)" entry. Evidence was collected 2026-10-29 on `work/immortal-green-closure` at `d0a36be` (the `387c00f` delta touches none of the files cited below) and on the branches named. Classification vocabulary: PRESENT / SPECIFIED / TESTED_BOUNDED / VERIFIED / OPEN / NOT_RUN.

### 1. Result in one paragraph

No implementation, owner, repository, deployment or key custodian of the external service that produces the Issue authority envelope and its viability certificates was found. The viability proof set (VC1–VC6, E1–E10, EV1–EV7) is therefore **NOT VERIFIED**; concrete Kc is **NOT CERTIFIED**; Ω completeness against the declared perimeter is **OPEN**; and no step toward a first real Preprod Issue is evidenced as closed by anything executed here. A signed, correctly shaped envelope is evidence that the key holder signed it, not that the certificates it references are valid.

### 2. Search coverage (bounded)

- Green source: grep of the code and docs for producer/certificate/viability/authority terms and for every use of `ISSUE_AUTHORITY_*`.
- All 27 branches: the current recursive git tree of each (REST, none truncated), matched by path against authority/producer/certificate/viability/prover/signer/service/deployment-file patterns; plus the 25-branch path/SHA ledger dated 2026-10-21. Content was grepped on green only, not on every branch.
- `LiberoNuvola/Carob-Three-Project` (11 files, last commit 2026-10-04): no match.
- Notion: two searches; no page names the service owner, repository or deployment. The only relevant statement is the "Issue Admission Boundary Audit — 10 Oct 2026" finding that repository source does not prove the external signed authority service is deployed or used for first-user Issue.
- Limits: private repositories, other organisations, deployed infrastructure and secrets are not visible from this session (Actions secrets API returned 403 through the proxy; not retried). A negative result here is a bounded negative, not proof the service does not exist.

### 3. What exists in the repository (PRESENT)

- `relayer/issueAuthorityServer.js` — downstream HTTP adapter (`POST /issue-admission`, `GET /healthz`, exact-origin CORS). It requires `ISSUE_AUTHORITY_SOURCE_URL`/`ISSUE_AUTHORITY_URL` and `ISSUE_AUTHORITY_PUBLIC_KEY`; it is not the producer.
- `relayer/signedIssueAuthority.js` — client: `GET` upstream with query parameters, then `verifySignedIssueAuthorityEnvelope`.
- `relayer/preprodIssueAuthorityEnvelope.js` — `signIssueAuthorityEnvelope`, a signing **library** that never computes EEV, ProtectedCapital or viability. Its only callers are `relayer/preprodIssueAuthorityEnvelope.test.js`; there is no server, CLI or workflow around it, and no `ISSUE_AUTHORITY_PRIVATE_KEY` consumer other than that function.
- On-chain: `PRE-RICH/onchain/V3EconomicStateCarrier.hs` (`bindingAuthorityValid`) verifies one Ed25519 signature by a single deploy-time key (`scripts/deployV3Carrier.mts` takes it from `ISSUE_AUTHORITY_PUBLIC_KEY`) over `actionClass|decisionReference|observationReference|stateHash|actionFingerprint|postStateHash`. Nothing on-chain consumes VC/E/EV evidence. Per `FIRST-REAL-PREPROD-TICKET-READINESS-20261021.md` Track B, this is authority-backed admission, not permissionless closure.
- `.env.example` leaves both authority variables commented; no concrete endpoint or deployment is recorded anywhere in the tree.

### 4. What the local verifier does and does not check

Checked (and exercised by the tests in §5): envelope schema/version, `actionClass = Issue`, outer Ed25519 signature over the canonical payload, carrier-binding signature, exact equality of the Counter/B2-control/Pool/carrier references, class/price/unit/observation reference, freshness window against local wall clock, ProtectedCapital component sum, the viability certificate's binding to carrier reference/`stateHash`/EEV snapshot/ProtectedCapital source, and — in `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` — equality of Pool value, `preEEV`, `candidateEEV` and `observedAt` with the directly observed physical USDM. The Haskell `issue-admission` decision digests are recomputed and compared with the signed ones.

Not checked (OPEN):

- VC1–VC6, E1–E10 and EV1–EV7 are `{reference, digest}` pairs validated only as a non-empty string and 64 hex characters. Nothing dereferences the reference, recomputes the digest, or checks that the artifact establishes χ, safety inclusion, inductiveness, acceptance compatibility, envelope soundness or non-vacuity.
- `truthVerified`, `eevFresh`, `obligationsComplete` and `allOmegaSuccessorsCertified` are booleans asserted by the signer. The Haskell decision takes them as inputs; `viabilityCertificate` never enters Haskell and is forwarded to the witness unchanged.
- All fixtures are synthetic (`proof://VC1`, repeated-digit digests). They test the shape of the contract, not any real certificate.

### 5. Executed evidence (TESTED_BOUNDED), green `d0a36be`, Node v22.22.0, `npm ci` clean

- PASS: `node relayer/signedIssueAuthority.test.js`; `node relayer/preprodIssueAuthorityEnvelope.test.js`; `node --test relayer/preprodIssueObservationReader.test.js` (5/5); `relayer/preprodIssueAdmissionProvider.test.mjs` via `tsx` (exit 0).
- PASS: vitest, 4 files / 30 tests — `src/__tests__/preRichIssueAdmissionBridge.test.ts` (17), `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.test.ts` (3), `Adapter/CARDANO/runtime/__tests__/AuthoritativeIssueAdmission.test.ts` (5), `relayer/preprodIssueObservationProvider.test.js` (5).
- Did not load under this harness (not failures of assertions, and not referenced by any workflow or `package.json` script): `relayer/authoritativeIssueRefinementEnvelope.test.js` and `relayer/issueAdmissionProvider.test.js` (`require('vitest')` from CommonJS), `relayer/preprodIssueObservation.test.js` (parse error under vitest 1.6.1). Classified NOT_RUN.
- NOT_RUN: the Haskell `issue-admission` executable and Plutus conformance (no `ghc`/`cabal` in this container); any live Preprod, Blockfrost or authority-endpoint call.
- None of this is evidence that a producer exists or that any certificate is valid.

### 6. Kc and Ω status

- `docs/audits/V3-VIABILITY-AUDIT-2026-10-05.md` (green, B3): QNE ABSENT; concrete Kc NOT CERTIFIED; under the literal four-action closure K* is empty; root cause is the missing lifecycle action with Accept/Ω/T/Safe/QNE semantics. `docs/workflow-c/C6-RECONCILIATION.md` (release snapshot 2026-10-18): NOT CERTIFIED.
- R1 finite checker (`scripts/check-r1-finite-certificate.mjs`, only on `release/public-main-curated-2026-09-24` at `04f2684`; checker SHA-256 `27f933aaac9dfba9068648c4a82bfb745f88e882e2043fe30803d7af8ae6a63c`, test SHA-256 `a15caaac57ca078345a8ba4fe311742a92901c1877acb145735c9b4985db1a1a`): its 8-test regression suite passes standalone (8/8, synthetic model, `node --test`). Its own schema document limits this to test/mechanical evidence relative to a supplied finite model, with S0 authenticity, Ω-versus-reality, action-space completeness, transition refinement and R7 exhaustiveness external. No branch contains both this checker and `relayer/issueAuthorityServer.js`; nothing in the Issue path calls or consumes the checker's output.
- `docs/workflow-c/C7-OMEGA-WORKSHEET.md` (release branch): all 13 Ω contract elements OPEN. `docs/research/OMEGA-EXECUTION-ADMISSIBILITY-REVIEW-B3-v1.md` (B3, 2026-10-20): evidence producer OPEN — blocking.
- C6.3 / U-03 remains BLOCKED on the profile instantiation `(S,A,Accept,Ω,T,Safe)` and a decision procedure for `S ∈ K_c` (certification-spec requirement recorded in the C6 register), and on the lifecycle-action decision named in the 2026-10-05 audit §13 and `docs/workflow-c/C6-RECONCILIATION.md`; this entry selects nothing. Correction: an earlier draft of this entry labelled that decision "paths A/B/C"; no such labelling exists for C6 (the A/B/C options in this file belong to the Pyth→USDM unit-conversion decision).

### 7. External hand-off list (restates existing requirements; invents no semantics, commits no keys)

1. Identify the producer: owner, repository, deployment, and custodian of the Ed25519 private key; publish the public-key fingerprint and bind it to the deployed V3 carrier address.
2. Publish the content-addressed artifacts behind each VC1–VC6, E1–E10 and EV1–EV7 digest, per `CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` and the EEV qualification contract.
3. Provide a verifier independent of the signer that dereferences those artifacts, recomputes the digests, and re-checks χ, safety inclusion, inductiveness, acceptance compatibility, envelope soundness and non-vacuity.
4. Declare the Ω perimeter and the authority that fixes it against the 13 C7 elements; supply the profile instantiation `(S,A,Accept,Ω,T,Safe)` and decide the lifecycle action (2026-10-05 audit §13; `docs/workflow-c/C6-RECONCILIATION.md`) so a QNE witness can exist.
5. For the first real Preprod ticket: the A1–A3 steps and closure criteria in `FIRST-REAL-PREPROD-TICKET-READINESS-20261021.md`, with the settlement-builder status recorded by Agent A on 2026-10-24 (source-level narrowing only; ledger gate and quote freshness still open).

### 8. Findings carried from the 2026-10-25 pass (earlier session; commits cited)

- B3 `poc/materios-grandpa` at `722aef1`: `tsc` exit 0; vitest 15 files / 149 tests pass; the two chain-identity regression tests ("B3-A chain identity regression", "B3-A chain label regression" in `poc/materios-grandpa/test/verifier.test.ts`) are load-bearing per mutation testing of the `CHAIN_ID_MISMATCH` and `GENESIS_HASH_MISMATCH` checks. The branch has since advanced to `3669462`; those results were not re-run at the new tip. This is TESTED_BOUNDED and says nothing about a real GRANDPA proof, historical storage proof or runtime execution proof for anchor block 1856408.
- The recorded B3-B live-storage artifact (run `39933665986`) concerns block 2409483, not the anchor 1856408; it must not be cited for the anchor.
- PR #35 (head `19aff55`, still draft): the red contribution gate is the designed fail-closed BOOTSTRAP_REVIEW_REQUIRED result. `CONTROL_PLANE_PATTERNS` covers `.github/workflows/`, `audit/algorithmic-governability/`, `CONTRIBUTING.md` and `docs/00-normative/` but not `PRE-RICH/onchain/` or `audit/cardano-integration/`, so such files can reach the reduced path (possible scope gap). The PR also carries a V3 carrier mint-policy change and Reveal diagnostics that are outside a governance PR's scope; that is an owner decision, not made here.

### 9. Not done

No key, endpoint, deployment, transaction, workflow dispatch, economic rule, V3, Reveal or branch-topology change. `AGENTS.md` versus §10.46 remains an owner reconciliation item.



## B3-C independent execution verifier — correction and exact evidence review (2026-10-30)

This section corrects the tentative wording in the 2026-10-29 “B3 code-to-upstream mapping” note that described the independent verifier interface as not yet identified. A dedicated Rust verifier already exists on `work/b3-materios-provenance-evidence`; the remaining gap is its end-to-end composition and real evidence, not the absence of a verifier implementation.

### Existing implementation confirmed at B3 HEAD

Observed B3 branch HEAD: `366946245f51812da1e4aa6a23754706a2463212`.

- `poc/materios-execution-verifier/src/lib.rs` exposes `verify_execution_proof(ExecutionProofInput)`. It strictly decodes SCALE `StorageProof`, rejects trailing bytes, binds supplied runtime WASM to the expected Blake2-256 code hash, runs `execution_proof_check` against the supplied state root and exact runtime method/call bytes, and requires the reproduced result to equal the expected result.
- The verifier README explicitly limits its claim: it does not establish GRANDPA finality, block canonicality, deployed-runtime provenance, source/build reproducibility, selector-input semantics, or the surrounding authority transition.
- `poc/materios-checkpoint/src/executionProof.ts` remains a transport/structural validator. It binds packet identity, selection-input hash, call data and declared runtime hash; its own contract correctly disclaims cryptographic trie/runtime/finality verification.
- `test-executionProof.ts` covers structural mutations and local bindings. The Rust crate tests malformed/empty/trailing SCALE proof cases and runtime hash mismatch. These are focused verifier/unit tests, not a live execution-proof witness.

### Workflow evidence inspected

The B3 execution-verifier workflow includes a Rust verifier test job, finalized-state capture, live GRANDPA witness acquisition and native B3-B storage-proof verification. It does **not** currently show a workflow step that takes a captured native execution-proof packet, supplies the exact authenticated state root and trusted runtime artifact to `verify_execution_proof`, and emits a machine-readable B3-C verification result bound back to the TypeScript packet identity and the same finalized checkpoint. This is the specific composition/integration gap to close; do not create a second verifier.

Observed historical [Materios B3 execution-proof verifier #127](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551843291), on B3 SHA `875087e3b92b21486175e0e83e84706abd14a06c`:
- Rust verifier formatting and unit tests: **SUCCESS**.
- Finalized-state capture: **SUCCESS**.
- Live B3-B storage-proof capture and native verification: **SUCCESS**.
- GRANDPA witness acquisition found a raw FRNK candidate at block `2471424`, hash `0xdcf28d0d21715e914000db6f10e216c8702fc39cd3275368746da3158cf2d16c`, round `46478`, set ID `4352`, with four precommits; independent cryptographic verification: **FAIL**; transition witness: **not found**. The job correctly failed closed.
- Both tested public RPC endpoints returned `grandpa_proveFinality` method-not-found and no block justifications at their finalized head. A separate WebSocket probe captured raw historical FRNK material, but raw capture is not a valid finality proof.

The later Orynq evidence bridge run #29 on B3 HEAD `3669462` is a different workflow and must not be represented as a B3-A/B/C verifier pass.

### Required next increment

1. Keep the existing Rust verifier as the cryptographic execution engine; add only a narrowly scoped composition adapter/test that checks its successful result is bound to the exact packet fields: chain/genesis, finalized block hash+number, state root, runtime code hash, method, call data, result, selection-input commitment and packet/evidence digest.
2. The composition must consume independently verified checkpoint/finality and runtime-provenance outputs; it must not turn packet metadata or caller booleans into proof.
3. Add mutation tests for each cross-object binding and a machine-readable result that distinguishes structural packet validation, native execution-proof verification, and outer B3-A finality/runtime provenance.
4. Keep synthetic fixtures explicitly synthetic. Do not mark B3-C live PASS until an actual captured execution proof has been independently verified and bound to the exact checkpoint/runtime. B3-A remains OPEN because the observed real GRANDPA candidate failed cryptographic verification and no transition witness was found; B3-B's historical success does not close B3 overall.

**Scope:** audit/checkpoint correction only. No code, selector semantics, economics, V3, Reveal, branch topology, workflow dispatch, secrets, or on-chain state changed.


## Agent B — exact Aiken V3 Reveal ledger evidence and legacy V2 emulator classification (2026-10-30)

**Current branch HEAD when recorded:** `e90b4cb48473b71fb7e7484f4f3440f65bab3130`.  
**Evidence source:** [IMMORTAL Cardano Integration Lab #40944935457](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40944935457), exact workflow SHA `f5b7c3c8ab49e1da23669a0665c81d5fb96320e3`. The following source blobs were compared between that run SHA and current HEAD and are unchanged: `src/__tests__/immortal-cardano-reveal-emulator-b1.mjs`, `.github/workflows/pre-rich-emulator-reveal.yml`, `audit/cardano-integration/reveal-ledger-trace.ts`, `audit/cardano-integration/aiken-reveal-ledger-probe.ts`, and `audit/cardano-integration/aiken-reference-script-publication-probe.ts`.

### Active Reveal path — TESTED_BOUNDED on local Yaci

- The active economic Reveal trace uses the isolated Aiken Plutus V3 Prize validator plus the real parameterized Haskell Plutus V2 B1PrizePool validator. This is the path explicitly described in the Integration Lab's JEV record; it is not the legacy Haskell V2 Prize Reveal emulator.
- The signed transaction reported `revealSerializedBytes = 1245`, with active Yaci/Cardano `maxTxSize = 16384` and `belowMaxTxSize = true`. This is the full serialized signed Reveal transaction, not merely a script payload or reference-script publication transaction.
- The trace recorded Yaci-measured ExUnits for both spends and assigned budgets that covered those measurements: spend 0 measured 2,262,871 memory / 490,505,264 steps, assigned 2,285,500 / 495,410,317; spend 1 measured 1,396,961 / 590,652,705, assigned 1,410,931 / 596,559,233. Aggregate protocol execution limits were not exposed in the trace's parameter object (`protocolExecutionLimits: null`); do not infer aggregate-limit certification from budget coverage alone.
- The workflow step outputs for active Aiken Reveal spend, positive ledger twin, non-zero winning twin and wrong-secret negative twin were all `success`. The wrong-secret twin reached ledger submission and was rejected by Yaci; the source trace verifies the original Prize and Pool inputs remain unspent after rejection.
- The native Yaci integration lab, V3 carrier ledger gate, economic Reveal/Expire trace, FundTreasury valuation trace, TicketIssued 500x boundary trace, Claim trace, P2.8 UTxO decoder and P2.8 evidence gate all completed successfully in this run. The Lab uploaded its evidence packet: artifact `12931111477`.
- Scope limit: this is synthetic-fixture/local-Yaci evidence. It is not Preprod, mainnet, production wallet, production PrizePool qualification, or full Haskell/Aiken semantic parity.

### Legacy Haskell V2 emulator — FAILED diagnostic, not the active Reveal path

The separate [PRE-RICH Emulator Reveal Conformance #40944935520](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40944935520) rebuilt fresh Plutus artifacts and passed its emulator smoke, but the Haskell V2 Prize Reveal conformance failed during transaction construction with:

`Spend[0] attempted to instantiate a non-polymorphic term`.

Its three negative cases stopped at build and were labelled `INCONCLUSIVE_NOT_SUBMIT_REJECTION`; they are not ledger rejection evidence. The diagnostic size probe deliberately lifted emulator `maxTxSize` to 100,000 and measured a 16,297-byte Prize reference-script publication transaction (and 11,704-byte Pool publication transaction). These are publication transactions, not the subsequent Reveal spend; the raised limit means the diagnostic cannot establish canonical Cardano size acceptance. The separate V2 Prize evaluator probe repeats the non-polymorphic-term failure.

### Agent B disposition

1. Keep the successful Aiken V3 + B1PrizePool V2 path as the active local-ledger Reveal evidence. Preserve its measured signed transaction size and Yaci acceptance/rejection observations.
2. Keep the Haskell V2 Prize emulator failure visible as a legacy diagnostic failure. Do not relabel it PASS, treat its build-stage negative cases as ledger rejection, or let it overwrite the active Aiken V3 evidence.
3. Do not change V3, Reveal semantics, economic rules, Cardano's 16,384-byte limit, or the active path to work around the legacy evaluator error. Any future V2 repair requires an isolated diagnosis of the evaluator/runtime/schema mismatch and its own exact-head evidence.
4. The remaining production blockers are unchanged: live Preprod deployment/evidence, qualified real USDM state and authoritative Issue Admission, certified R1/Kc/Ω viability evidence, and an actual user-wallet signature/confirmed ticket Issue transaction.

**Scope of this entry:** evidence classification and coordination documentation only. No source-code, workflow semantics, key, secret, branch topology or on-chain state changed.


## Agent B — first-user Issue submission phase and live-app path audit (2026-10-30)

**Source commit:** [`68f51116e5c3cfca18864ce010e0fcddb5935180`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/68f51116e5c3cfca18864ce010e0fcddb5935180) on `work/immortal-green-closure`.

### Active browser path verified

- The current `src/main.ts` Buy Ticket handler calls `mintSerialNFTWithAuthoritativeAdmission`, not the legacy helper. It observes the live V3 carrier, derives class-saleability evidence from that state, loads the deployment-bound V3 validator factory, obtains the remote Issue provider and submits through the existing authoritative Issue entry point.
- `mintSerialNFTWithAuthoritativeAdmission` forces both `requireV3CarrierBinding: true` and `requireB2ControlBinding: true`. The live DApp path therefore requests the existing carrier and B2 bindings; this audit did not change those predicates.
- The legacy `src/tickets.ts::buyTickets` still calls the lower-level `mintSerialNFT`. Its old `src/legacyBindings.ts` caller supplies no mint options, and `buyTickets` rejects missing options before reaching mint. Current `src/main.ts` does not import that legacy binding. Do not treat this stale helper as the active first-user Issue path; keep it fail-closed and out of the production flow.

### Submission versus confirmation correction

The active UI previously set the gate label to `ADMITTED` and displayed “submitted and confirmed” immediately after the adapter returned a transaction reference. The production submission adapter calls the provider's `submitTx` and returns its transaction reference; it does not await ledger inclusion. The UI then makes a wallet UTxO observation separately, but the earlier text claimed confirmation before that observation.

Commit `68f51116` changes only the post-submit presentation:
- gate label becomes `SUBMITTED`;
- text says the configured provider accepted the submission and the app is checking the connected wallet for the resulting ticket;
- the existing wallet-ticket observation remains the next step.

This is a phase-honesty correction only. It does not change admission, transaction construction, signing, submission, economic rules, V3, Reveal, or any on-chain semantics.

### Exact-head CI

For exact SHA `68f51116e5c3cfca18864ce010e0fcddb5935180`, the following jobs completed **SUCCESS**:
- [Protocol Declaration #41004817386](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41004817386)
- [Documentation Link Check #41004817360](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41004817360)
- [IMMORTAL Portability #41004817375](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41004817375)
- [Algorithmic Governability #41004817311](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41004817311)
- [Cardano Adapter Sale #41004817320](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41004817320): both frontend build and economic conformance succeeded.
- [PRE-RICH Action Refinement #41004817471](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41004817471)

At the time of this entry, [IMMORTAL Cardano Integration Lab #41004817474](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41004817474) and [PRE-RICH B2 Control Carrier #41004817334](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41004817334) were still in Plutus toolchain setup. They are PENDING, not green or failed; poll their exact run records before updating the result.

### Preprod evidence boundary

The latest observed [Preprod Context run #40936394084](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40936394084) completed its `preprod-context` job successfully, but `preprod-v3-carrier-observation`, `preprod-deploy`, `direct-usdm-preprod-bootstrap` and `real-preprod-reveal` were all **SKIPPED**. It supplies context only; it does not evidence a new V3 observation, deployment, bootstrap, Reveal or ticket Issue on Preprod.

The first real Issue remains blocked by the separately recorded external authority/certificate-producer dependency and the still unverified concrete `K_c` / Ω viability package. No wallet signature or transaction was performed by this pass.

**Disposition:** submission-phase UI wording corrected and bounded exact-head CI partially green; two Plutus CI jobs pending at checkpoint time; no Preprod deployment or first-user ticket proved.


## Agent B checkpoint — Pyth automatic probe and credential boundary (2026-10-30)

**Commits:**
- Workflow push automation and scoped paths: [`ba0d0160669890fe5c3ddde267e6ddf2f6200739`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/ba0d0160669890fe5c3ddde267e6ddf2f6200739).
- Corrected workflow copy of the already-pinned Pyth Preprod policy ID: [`15077fee5581c5be2ffc1554059a06aa37c00a15`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/15077fee5581c5be2ffc1554059a06aa37c00a15).
- Runner now preserves a machine-readable blocked-state artifact when the Lazer credential is absent: [`47870a75e2f752f53605bcc168d231d9088dfe8b`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/47870a75e2f752f53605bcc168d231d9088dfe8b).

### Workflow and exact-head evidence

- `.github/workflows/pyth-native-ledger-probe.yml` is now push-triggered only on `work/immortal-green-closure` and only for the enumerated Pyth runner, workflow, Aiken consumer, and dependency paths. `workflow_dispatch` remains available in the YAML; GitHub's default-branch requirement still applies before the UI dispatcher can be used from the repository Actions page. No scheduled trigger has been added.
- The workflow's pinned policy ID now exactly matches `scripts/pythPreprodConfig.mts`. The isolated Pyth workflow verified the published policy constant and type-checked the guarded native-ledger runner successfully.
- [Isolated Pyth ADA/USD Probe #41005329580](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005329580): **SUCCESS**. The two jobs passed: synthetic Aiken source-boundary tests, isolated Plutus V3 build, artifact metadata capture, official policy-ID test, and TypeScript type-check. Build artifact: `12955173057`, status `COMPILED_PROBE_ONLY`; compiled Plutus blueprint hash `70c53ca8bcfab8d04726ecfd56e3256b47941d7f0620837a91966b5b08cf1a29`. This is compile/synthetic-test evidence only, not signature or native-ledger acceptance.
- [Pyth Signed Update — Preprod Ledger Probe #41005329555](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005329555): expected fail-closed result because repository secret `PYTH_LAZER_TOKEN` is absent/empty. Aiken compilation succeeded. The runner wrote and uploaded artifact `12955003583`, containing `status=BLOCKED_MISSING_REQUIRED_SECRET`, `signedUpdateFetched=false`, `pythStateResolved=false`, `walletLoaded=false`, `transactionBuilt=false`, `transactionSigned=false`, `transactionSubmitted=false`, and `ledgerGateA=NOT_PROVEN`. The job then exits nonzero with `PYTH_LAZER_TOKEN is required`; the fail-closed status is not relabelled as a probe pass.
- In that run `PYTH_SUBMIT_PREPROD=false`; the test mnemonic and Blockfrost project ID were empty. No wallet was loaded and no transaction was built, signed, or submitted.

### Remaining external prerequisite and evidence limits

- The next prerequisite is to configure the repository Actions secret `PYTH_LAZER_TOKEN` with the Pyth Pro/Lazer credential. Do not paste the token into chat or commit it. The safe push mode does not require the test mnemonic or Blockfrost key; those remain relevant only to the separately guarded manual submit path.
- Once the secret exists, the next Pyth push should fetch a real signed update and emit `PREPARED_NOT_SUBMITTED`. This would prove payload retrieval and Pyth State resolution for that run only; it would not prove native-ledger signature acceptance, feed truth/liveness, IMMORTAL registry admission, USD/USDM conversion, or production MintPolicy binding.
- `workflow_dispatch` still requires the workflow to be present on `main` before appearing in the Actions UI; this branch-only push automation does not solve that default-branch publication requirement. Do not merge the full work branch to accomplish it: branch divergence remains broad and unrelated.
- No Pyth feed is approved, no USD/USDM parity is assumed, no production Oracle/MintPolicy/Issue path is wired, and no on-chain state changed. No changes were made to V3 or Reveal semantics, EEV, Issue Admission, economic rules, or Materios.

**Disposition:** branch-scoped automatic observation workflow is active; synthetic/build conformance is green; native signed-update probe is correctly blocked by the missing Lazer secret and retains an auditable failure artifact. The authority and production-integration gates remain open.


## Agent B — independent DoD gate review: Flux Point `fluxpoint-plugins` (2026-10-30)

**Reviewed upstream:** [`Flux-Point-Studios/fluxpoint-plugins`](https://github.com/Flux-Point-Studios/fluxpoint-plugins), `main` at `175c0a79f9a998b5fe1e212b511dd490ec06f4a8`, manifest version `fluxpoint 1.49.0` (Apache-2.0). This is newer than the older 1.42.0 directory snapshot referenced by the shared post. Repository's current Immortal branch HEAD during this review: `e3660316643c755a96acbf612f955bffcb786847`.

### Relevant capabilities verified in source

- One plugin supports Claude Code and Codex. Loop mode uses SessionStart, PostToolUse, PreCompact and Stop hooks; it runs a repo-owned `scripts/harness.sh --changed` after edits and `--full` at eligible stops. Bash gate execution is attested from observed runtime hook results for declared exact commands, not merely from an agent's prose.
- Proof-strength ratchets cover proof escape hatches, theorem/specification statements and assumption sets; the Aiken/eUTxO and TypeScript/Python builder taxonomies require named property tests or explicit reasoned waivers.
- Cardano-specific checks include `plutus-budget.py` for compiled Aiken script size and configured/measured execution budgets, and `blueprint-guard.py` for builder-produced PlutusData against CIP-57 datum/redeemer schemas in a fresh `plutus.json`.
- Graph mode enforces typed node contracts and refuses a mutating node that certifies its own work. On Codex, native graph Workflow execution is unavailable; the documented subagent fallback records `degraded-subagents` provenance. The Stop-hook loop gate itself is supported by both runtimes.

### Critical boundaries — do not oversell the gate

1. The runtime hook is not an independent cryptographic authority. The repo's `scripts/harness.sh`, manifests and baselines remain part of the trust base. The gate is dormant if the repo has no harness; `FPL_DISABLE=1` is an explicit kill switch; default `FPL_MAX_BLOCKS=3` yields a checkpoint after three blocked stops. `WORK.md` and local evidence are reviewable but not tamper-proof. CI, protected branch rules and independent review remain necessary.
2. `plutus-budget.py` reads `compiledCode` length from Aiken `plutus.json`; this is script-payload size, not the complete signed transaction CBOR size. It uses defaults only as fallback and must receive the target network's current `cardano-cli query protocol-parameters` JSON for authoritative limits. Execution units are transaction/context measurements; the tool correctly reports absent measurements as unmeasured rather than passed. It cannot replace the already existing full-transaction Yaci CBOR/ExUnits evidence pipeline.
3. `blueprint-guard.py` checks data-shape conformance only. Opaque `Data` schemas are explicitly reported as opaque/blind, and unsupported schema constructs are `UNCHECKED`, not conformant. CIP-57 conformance does not prove economic semantics, validator correctness, phase-1 acceptance or a ledger execution.
4. The attack taxonomy is a coverage/specification floor: it requires a named test or an explicit waiver. It does not itself execute every eUTxO attack against Yaci/Preprod or prove that a named test is a valid adversarial control. Keep actual ledger twins and independent red-team/evidence review.
5. Optional Blaster verification is a pinned Lean/SMT bridge with explicit solver trust; upstream documentation says it does not reconstruct kernel proofs or provide a Cardano ledger model.

### Fit against IMMORTAL at the reviewed HEAD

The Immortal tree had no Fluxpoint plugin/config/manifests, no root `WORK.md` and no root `scripts/harness.sh`. The repository already has extensive GitHub Actions, formal/conformance suites, a Cardano Integration Lab, P2.8 evidence gates, and Aiken projects nested under `poc/` rather than a root `aiken.toml`. Therefore a blind `/fluxpoint:init` would not automatically discover/cover the full protocol topology; the repo-specific harness must explicitly call the existing checks and point the Aiken budget/blueprint gates at the correct nested project roots.

### Agent B recommendation

**Adopt as an additional local/session DoD control, not as a replacement for GitHub Actions or ledger evidence.** A safe pilot should:
- pin the plugin to a reviewed version/commit and install its Codex hook integration in the actual coding-agent environment;
- create a short, fast local `--changed`/Stop contract and a repo-specific `--full` contract that delegates to existing tests, Haskell/Plutus builds, nested Aiken checks and the existing evidence classifiers rather than duplicating their commands;
- arm the Aiken eUTxO taxonomy and the TypeScript builder taxonomy against existing real tests, marking only genuinely inapplicable cases with explicit reviewed waivers;
- run `plutus-budget.py`/CIP-57 conformance only on the actual generated Aiken blueprint(s), supply current target-network protocol parameters, and leave full transaction size, measured Yaci ExUnits, Preprod and authoritative Issue proofs to their existing gates;
- require branch-protected CI and independent review for changes to the harness, manifests, ratchet baselines and waivers.

**Disposition:** positive technical fit; no blind plugin install, no harness scaffold and no source/workflow changes made in this review. Do not claim “agents cannot grade their own work” as a security guarantee until the repo-specific harness and protected CI trust base are actually installed and tested.

## Agent C checkpoint — B3-C native execution-proof integration (2026-10-30)

**Branch:** `work/immortal-green-closure` (existing branch; no branch created).  
**Source HEAD at this entry:** `d77ebbe25b6b1b89e91318e4debdd18b01a13349`.  
**Scope:** connect the existing TypeScript `materios-execution-proof-v2` packet path to the existing Rust `verify_execution_proof` implementation. No changes to V3, Reveal semantics, IMMORTAL economics, Cardano on-chain state, or the independent GRANDPA verifier.

### Implemented integration

- Added `poc/materios-execution-verifier/src/bin/verify-execution-proof.rs`, a narrow CLI adapter over the existing Rust library function. It pins the method to `SessionValidatorManagementApi_calculate_committee`, passes the exact state root, SCALE proof, WASM, expected Blake2-256 code hash, call data and result into the existing verifier, and emits a machine-readable success marker plus the reproduced result.
- Added `poc/materios-checkpoint/src/capture-verify-execution-proof.ts`. It selects one exact target block, checks the RPC-reported finalized height and hash-at-height observation, reads block header/runtime/proof data at that same hash, extracts the unique `SessionCommitteeManagement::set` input commitment from the same block's extrinsics, checks the `materios-execution-proof-v2` packet and its exact call-data/input bindings, then invokes the existing Rust verifier and checks the reproduced result against the TypeScript packet.
- Added package command `capture:verify:execution`.
- Added opt-in `live-execution-proof` job to `.github/workflows/materios-b3-execution-verifier.yml`, controlled by workflow-dispatch input `run_live_execution_proof` (default false). Ordinary CI separately runs Rust and TypeScript tests. The workflow's existing GRANDPA RPC probe heredoc was restored after the prior run exposed a malformed shell block.
- Added `docs/04-verification/MATERIOS-B3-C-EXECUTION-PIPELINE.md` with inputs, outputs and trust boundaries.

### Evidence and current CI classification

- The existing TypeScript packet tests, RPC B3 tests and TypeScript typecheck completed **SUCCESS** in Materios B3 workflow run [#131](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005713620), at source SHA `3d1b5d4760cc35553951e4d36ea08336a92acf11`. That run predates the current Rust formatting correction and is not evidence that the new Rust CLI compiled.
- Run [#132](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005749782), source SHA `547f745f7c0f0c305792ab6e3bc54c3af5bbd319`, found a `rustfmt` mismatch in the new CLI; `cargo test` was consequently skipped. Its older GRANDPA probe also ran the JS body as shell and failed; the workflow heredoc was repaired in that branch revision. This run is not a successful B3-C verifier test.
- The CLI was formatted and committed in `d77ebbe25b6b1b89e91318e4debdd18b01a13349`. The new Materios B3 workflow run for that exact SHA is [#41005869822](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005869822); it was still pending when this checkpoint entry was written. Do not mark Rust conformance green until that exact-head run completes its formatting and test jobs.
- Other exact-head checks already completed on `d77ebbe...`: [Documentation Link Check #41005869847](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005869847), [IMMORTAL Portability #41005869915](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005869915), and [Algorithmic Governability #41005869817](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005869817) completed **SUCCESS**. Protocol Declaration and Cardano Adapter Sale were still running at the time of the update.

### Required context for an actual live B3-C capture

The opt-in job requires the exact authoritative values to be configured as GitHub repository variables: `MATERIOS_B3_AUTHORITY_SELECTION_INPUTS_HEX`, `MATERIOS_B3_SIDECHAIN_EPOCH`, `MATERIOS_B3_CARDANO_EPOCH_NONCE_HEX`, `MATERIOS_B3_GENESIS_UTXO_HEX`, `MATERIOS_B3_SELECTION_PATH_KIND`, `MATERIOS_B3_SELECTION_PATH_EVIDENCE_HASH`, `MATERIOS_B3_AUTHORITY_COMMITMENT`; `MATERIOS_B3_SELECTION_PATH_UNTIL_EPOCH` is required only for a pinned path. `MATERIOS_B3_BLOCK_HASH` may pin the exact committee-transition block and is recommended when the latest finalized head does not contain the set inherent. The script fails closed on missing inputs, an absent/duplicate inherent, a non-matching selection commitment, a block mismatch, or a failed native proof check. No selection inputs are generated or guessed by the script.

### Trust boundary / status

A successful Rust check would establish only that the native execution proof reproduces the expected result against the supplied state root and supplied WASM bytes. The current collector's RPC finalized-head/header and hash-at-height checks are still node observations; they do not independently authenticate the header or GRANDPA finality. The runtime bytes' Blake2-256 is matched to the packet but canonical deployment/source-build correspondence remains OPEN. GRANDPA finality/authority transition, runtime deployment provenance, authority-selection semantics/enactment, and full B3 composition all remain separate OPEN predicates. The live capture has not been run and no real B3-C PASS is claimed in this entry.

**Disposition:** TypeScript-to-Rust execution-proof integration is present in source; exact-head Rust conformance and a live proof artifact are pending. Keep B3-A finality separate. No change to V3, Reveal, economics, other chain adapters, or on-chain state.



## Agent B addendum — Pyth build-evidence package integrity (2026-10-30)

- Commit [`2df11a826877182b1e487a6330f0a6280cf1b776`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/2df11a826877182b1e487a6330f0a6280cf1b776) fixes the isolated Pyth build artifact packaging by including `aiken.toml`, which was previously named in `SHA256SUMS` but omitted from the uploaded archive.
- Exact-head [Isolated Pyth ADA/USD Probe #41006171183](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41006171183): **SUCCESS** on both jobs. Aiken synthetic tests and Plutus V3 compilation passed; official Pyth Preprod policy-ID verification and TypeScript type-check of the native-ledger runner passed.
- Artifact `12954779275` (`pyth-ada-usd-probe-2df11a826877182b1e487a6330f0a6280cf1b776`) downloaded and inspected. It contains `aiken.toml`, `aiken.lock`, `plutus.json`, `build-manifest.json`, and `SHA256SUMS`. All three checksums independently verified **OK**:
  - `aiken.toml`: `ecd2615377622857982fea7de81e81eb664d8fc31866a8067ed976fc5054397b`
  - `aiken.lock`: `bfecbc5440e3c386bcc8e382daa13d1d6695c8d0ede8003cf88bc19a4e423e07`
  - `plutus.json`: `70c53ca8bcfab8d04726ecfd56e3256b47941d7f0620837a91966b5b08cf1a29`
- Manifest reports `status=COMPILED_PROBE_ONLY`, `plutusVersion=v3`, and six blueprint validator entries. This remains compilation/synthetic-test evidence only; it does not establish Pyth signed-update retrieval, signature verification, native-ledger acceptance, source authority, USD/USDM conversion, or production MintPolicy binding.
- The native-ledger probe remains blocked at its last exact-head execution by missing/empty repository secret `PYTH_LAZER_TOKEN`; artifact `12955003583` explicitly records `BLOCKED_MISSING_REQUIRED_SECRET` and confirms no wallet or transaction action. No token can be configured through the current GitHub integration; it must be added in repository Settings → Secrets and variables → Actions. Do not expose it in chat or source control.
- No transaction, wallet signature, feed approval, production wiring, or on-chain state change occurred. No changes to V3/Reveal semantics, EEV, Issue Admission, economic rules, or Materios.

**Disposition:** build evidence is now complete and checksum-verifiable. Native signed-update observation remains externally blocked solely by the absent Lazer credential; keep that gate open.

## Agent C checkpoint — B3-C exact-head CI, live B3-B proof and upstream RPC blocker (2026-10-30)

**Branch:** `work/immortal-green-closure`.  
**Code under test:** `d77ebbe25b6b1b89e91318e4debdd18b01a13349`.  
**Checkpoint HEAD before this entry:** `022bb4131f2d94e457f2c33a55968db9b7084512`.  
**Scope:** B3-C integration conformance, B3-B live storage evidence classification, upstream Materios node capability audit. No V3, Reveal, economic, authority-selection or on-chain state changes.

### Exact-head Materios B3 workflow #41005869822

Source SHA: `d77ebbe25b6b1b89e91318e4debdd18b01a13349`.

- `verifier`: **SUCCESS** — `cargo fmt --all -- --check` passed; `cargo test` passed. Test output: 10 library tests and 3 CLI parsing tests passed, 0 failed.
- `checkpoint-typescript`: **SUCCESS** — checkpoint/B3-C typecheck, `test:execution-proof`, and `test:rpc-b3` passed.
- `finalized-state-capture`: **SUCCESS** — finalized state/header/runtime evidence captured and uploaded. Its payload explicitly reports GRANDPA finality proof unavailable; capture is extraction only.
- `live-storage-proof`: **SUCCESS** — B3-B live proof capture, native Rust proof verification, and artifact upload all passed.
- `real-grandpa-witness`: **FAIL** — the two public RPC endpoints returned `chain_getBlock.justifications = null`; `grandpa_proveFinality` was unavailable; `grandpa_subscribeJustifications` returned JSON-RPC `-32601 Method not found`. No GRANDPA cryptographic witness was acquired.
- `live-execution-proof`: **SKIPPED** — the manual dispatch input `run_live_execution_proof` was false. No live B3-C execution proof was attempted.

The overall run is **FAIL** because the independent real-GRANDPA witness job failed, not because the Rust B3-C CLI tests failed. Do not summarize the overall run as green.

Run: [Materios B3 #41005869822](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005869822).

### B3-B live storage result — narrow claim only

Artifact: [materios-b3b-live-storage-proof, ID 12955811042](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41005869822/artifacts/12955811042). The artifact was downloaded and its JSON inspected.

Authenticated by the Rust verifier at the observed block/state root:
- receipt storage key derived from the receipt ID;
- exact value present under the exact storage key;
- SCALE proof accepted by the native Substrate trie verifier;
- proof result bound to the observed header state root;
- 10 proof nodes / 3,035 proof SCALE bytes.

The packet reports receipt ID `0xeacc4944b81b823d46f6dd02a237038a75f3a599626e2781db67d02aec44633a`, observed state block `2507142`, block hash `0x55dc66cf3f96c18bd944e70e8b6c24113b4e8361514325bb333397472d5b5a3d`, and non-zero `availabilityCertHash`.

**Important semantic limit:** the auto-discovery path in `capture-storage-proof.ts` selects a ReceiptRecord because its `availabilityCertHash` is non-zero and uses the finalized-state snapshot block for the storage read. It does not bind that block to an independently observed `AvailabilityCertified` event or prove signer quorum. The artifact's `receipt.certification.signers = 0` is hard-coded by the collector in this path; it is not a measured signer count. Therefore this artifact proves the storage key/value/state-root relation and the presence of a non-zero certificate-hash field only. It does **not** prove certificate validity, signer count, quorum, or GRANDPA finality. Do not use it as certification or B3-A evidence.

### Upstream Materios B3-C RPC blocker — verified source

The IMMORTAL TypeScript collector calls the documented narrow method:

`materios_b3_calculateCommitteeProof(block_hash, call_data_hex)`.

A fresh audit of [Flux-Point-Studios/materios main at `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30`](https://github.com/Flux-Point-Studios/materios/tree/7d5c36e7dcd60824d84353e93df5d4a03c9c6c30) found that `partnerchain/node/src/rpc.rs` registers only `System`, `OrinqReceipts`, and `MotraRpc`. The upstream node source has no `materios_b3_calculateCommitteeProof` registration, no `ProofProvider`/execution-proof endpoint, and no `ExecutorProvider` wiring in its existing `FullDeps`. Upstream branch search found no `execution proof` branch; PR searches found no matching `prove_execution`, `ProofProvider`, or `B3` PR.

The RPC contract in `docs/04-verification/MATERIOS-B3-EXECUTION-PROOF-RPC.md` is therefore **proposed, not deployed**. Its implementation requires an upstream Materios node change to access the native SDK execution-proof provider, whitelist the exact committee Runtime API method, return the exact result plus SCALE StorageProof, deploy to Preprod, and verify the method on the public RPC. A conventional `state_call` plus `state_getReadProof` is not a substitute for native execution proof.

### Current disposition / next gate

- IMMORTAL B3-C source integration: **implemented**.
- Rust CLI format and tests: **PASS**.
- TypeScript packet/RPC conformance: **PASS**.
- B3-B live storage relation: **PASS**, with the narrow scope stated above.
- B3-A independent GRANDPA finality: **OPEN / blocked by unavailable public RPC justification evidence**.
- B3-C live execution proof: **BLOCKED_UPSTREAM_RPC_NOT_DEPLOYED**; the live job remains opt-in and was not dispatched.
- Full B3 composition and authority-transition provenance: **OPEN**.

Next required dependency is upstream Flux Point node implementation/deployment of the native proof RPC, followed by a confirmed capability check and an opt-in IMMORTAL live execution-proof run. Do not create a second verifier, reconstruct selector semantics, or change V3/Reveal to work around this dependency.

## Agent C checkpoint — B3-B certification-indexed capture and exact-block signer corroboration (2026-10-30)

**Source HEAD for this change:** `c0b42f005ae13ab1a756c7abdc04cb6d2ccd6cb5`.  
**Workflow:** [Materios B3 #41006875990](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41006875990).  
**Artifact:** [B3-B live storage proof #12956085640](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41006875990/artifacts/12956085640).

### Collector correction

The earlier auto-discovery path selected a ReceiptRecord with a non-zero availability certificate hash and used the latest finalized observation block as a stand-in certification block. It left signer count at a hard-coded zero. That was adequate only for a narrow storage inclusion demonstration and was explicitly not certification evidence.

The collector now obtains the exact certification metadata from the Materios events indexer endpoint `/receipt-attestors?receiptId=...`. It fails closed unless:
- the returned receipt ID matches;
- the indexer says certified;
- certification block, block hash and certificate hash are well-formed;
- signer_count is positive and matches the signer list;
- all signer addresses are valid SS58 strings and unique;
- the indexed block hash matches `chain_getBlockHash(certified_at_block)`;
- the returned header number matches that block;
- the node-reported finalized head covers it;
- the exact ReceiptRecord at that block contains the same availability certificate hash;
- the storage proof for the exact key/value verifies natively against that block header's state root.

The previously unused signer-count placeholder was removed; the JSON evidence now records the actual indexer-reported signer list, count, source and explicit non-claims. The indexer contract is backed by the current Flux Point gateway source, which decodes the event-indexer response in [materios-gateway src/routes/trace.ts](https://github.com/Flux-Point-Studios/materios-gateway/blob/main/src/routes/trace.ts).

### Exact-head result

For source SHA `c0b42f005ae13ab1a756c7abdc04cb6d2ccd6cb5`:
- `checkpoint-typescript`: **SUCCESS**.
- `verifier`: **SUCCESS** — formatting and all Rust tests passed (10 library + 3 CLI parsing tests).
- `live-storage-proof`: **SUCCESS** — live Preprod capture and native Rust storage proof verification passed.
- `finalized-state-capture`: **SUCCESS**.
- `real-grandpa-witness`: **FAILURE**.
- `live-execution-proof`: **SKIPPED**; no B3-C live call made because the upstream node RPC is still not deployed and manual dispatch remained false.

Overall workflow #41006875990 is **FAILURE** because of the independent GRANDPA witness job. Do not relabel the overall workflow as green.

### B3-B artifact facts

- Receipt ID: `0x279c26e797ac8aab732344a7702ba5e985e420c0677232a833bff60c2d1791b7`.
- Indexed certification block: `2507143`.
- Certification block hash: `0xb61e01165006e4b5ab56fb90a0fbc726fcf62d65179121eed1788899d0763f6c`.
- `cert_hash`: `0x289e0df9266767040b43682f6a9e122f79034cbefe7e449db5ac8b4aef59164d`.
- Header state root: `0x15d3bd860ec9f9b6ce04da19f13eefecd7c00e687e9e3241eb912b37656fa1e7`.
- Indexer-reported signers: **3**, three distinct SS58 identities; the signers-list length matches signer_count.
- Native verifier: 10 proof nodes and exact key/value/stateRoot relation, all B3-B success markers emitted.

### Remaining trust boundary

The signer identities/count are still supplied by the events indexer. Their signatures are **not independently verified** by this capture, and the active quorum threshold is **not independently derived/checked**. The node's finalized-head observation and RPC hash-at-height are not an independent GRANDPA justification. Thus classify the result as **INDEXER-CORROBORATED CERTIFICATE + NATIVE STORAGE PROOF VERIFIED**, not cryptographic signer-quorum or GRANDPA finality verification.

The preceding entry's warning about run #132 and its `signers=0` placeholder remains historically accurate for artifact #12955811042. It is superseded for the new collector and artifact #12956085640 only; do not retroactively rewrite the old evidence.

**Next work:** independently verify the indexed signer identities/signatures against the attestation records and the exact committee/quorum at block 2507143; separately obtain and verify a real GRANDPA justification; keep B3-C live execution proof blocked until the upstream Materios native execution-proof RPC is deployed. No V3, Reveal, economic, or on-chain changes.

## Agent C checkpoint — authenticated committee membership and threshold at B3-B certification block (2026-10-30)

**Source commit:** `582ffb737162649862e9fdee519ab4cdb3e87569`.  
**Exact-head workflow:** [Materios B3 #41007657185](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41007657185).  
**Artifact:** [B3-B live storage proof #12955808846](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41007657185/artifacts/12955808846).

### Additional verified state

The B3-B collector now reads the exact block-end `OrinqReceipts.CommitteeMembers` and `OrinqReceipts.AttestationThreshold` values at certification block 2507143. It decodes the SS58 indexer signer addresses (prefix 42, checksum verified) into AccountId32 and checks them against the on-chain committee list. The capture also requires the signer count to meet the exact threshold read from storage.

Exact observed values:
- Committee size: **68**.
- On-chain `AttestationThreshold`: **3** (`0x03000000` SCALE u32).
- Indexer-reported signers: **3**; all three decoded AccountId32 values appear in the committee set.
- Receipt, committee and threshold keys/values are all included in the same-block proof packet.

### Exact-head workflow result

For source SHA `582ffb737162649862e9fdee519ab4cdb3e87569`:
- `checkpoint-typescript`: **SUCCESS** — typecheck, execution packet tests, RPC tests, and new SS58/committee evidence tests.
- `verifier`: **SUCCESS** — formatting; 10 library tests + 3 execution-proof CLI tests + 4 generic storage CLI tests = **17 passed, 0 failed**.
- `live-storage-proof`: **SUCCESS** — capture plus native Rust verification of ReceiptRecord, CommitteeMembers and AttestationThreshold storage proofs against the same certification-block state root.
- `finalized-state-capture`: **SUCCESS**.
- `real-grandpa-witness`: **FAILURE** — public node still does not expose justifications; the two endpoints returned null `chain_getBlock.justifications`, and `grandpa_subscribeJustifications` returned `-32601 Method not found`.
- `live-execution-proof`: **SKIPPED** — still blocked until upstream Materios deploys the native B3-C RPC.

Overall workflow #41007657185 remains **FAILURE** because of the independent GRANDPA witness job. Do not summarize the run as green.

### Stronger but bounded B3-B classification

The evidence now proves the receipt's storage relation, exact certification block/hash and cert_hash, plus the block-end committee and threshold storage values. It also proves that the indexer-reported signer list has three distinct, checksum-valid addresses which map to members of the authenticated 68-account committee and that 3 meets the authenticated block-end threshold 3.

Classification:
**INDEXER-REPORTED SIGNER SET + RUST-AUTHENTICATED BLOCK-END COMMITTEE/THRESHOLD + NATIVE RECEIPT STORAGE PROOF VERIFIED.**

It still does **not** authenticate `System.Events` or independently verify the exact `AttestationRecorded` calls; it does not verify individual signer signatures; it does not reconstruct any committee mutations ordered within the certification block; and it does not authenticate GRANDPA finality. The committee and threshold are explicitly block-end state, not a proof of the state at each attestation dispatch.

### Technical correction

The old `verify-storage-proof` CLI hard-coded an 80-byte storage-key width, matching the ReceiptRecord Blake2_128Concat map but rejecting plain 32-byte Substrate StorageValue keys. This run validates the generic CLI correction: storage keys are now any non-empty byte string, while state root, SCALE proof, exact key/value and trie-root checks remain strict. Existing B3-B markers are preserved, and generic Substrate proof markers were added.

### Next closure task

Authenticate and decode the exact `System.Events` storage proof(s) for the receipt's `AttestationRecorded` records, compare the event signer set with the indexer response, and reconstruct event-time committee/threshold ordering. This remains separate from B3-A GRANDPA finality and from B3-C native execution proof. No V3, Reveal, economic, or on-chain changes.

## Agent C addendum — B3-C scope correction and upstream RPC disposition (2026-10-30)

**Source branch:** `work/immortal-green-closure`.  
**Evidence reviewed:** current IMMORTAL source and workflow, exact-head Materios B3 run #41007657185, upstream `Flux-Point-Studios/materios` source at `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30`, and upstream issue #50.  
**Scope:** status correction and external dependency classification only. No code, V3, Reveal, economics, authority-selector semantics, external repository, or on-chain state changed by this addendum.

### Exact-head evidence supersedes the earlier pending Rust entry

[Materios B3 #41007657185](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41007657185), source SHA `582ffb737162649862e9fdee519ab4cdb3e87569`, completed these jobs:

- `verifier`: **SUCCESS** — `cargo fmt` and `cargo test`; 17 Rust tests passed (10 library, 3 execution-proof CLI, 4 generic storage CLI), 0 failed.
- `checkpoint-typescript`: **SUCCESS** — typecheck, execution-proof packet tests, B3 RPC tests, attestation-evidence tests.
- `live-storage-proof`: **SUCCESS** — live Preprod capture and native verification of ReceiptRecord, CommitteeMembers and AttestationThreshold proofs against the same certification-block StateRoot.
- `finalized-state-capture`: **SUCCESS** — extraction artifact only; no independent GRANDPA witness.
- `real-grandpa-witness`: **FAILURE** — both public RPC endpoints returned null `chain_getBlock.justifications`; `grandpa_subscribeJustifications` returned `-32601 Method not found`; no cryptographic GRANDPA witness was produced.
- `live-execution-proof`: **SKIPPED** — manual dispatch remained false; no live execution-proof RPC call was made.

The workflow's overall result remains **FAILURE** because the independent GRANDPA witness job failed. This does not negate the successful Rust/B3-B jobs, and the successful subjobs do not turn the entire workflow green.

### Upstream B3 execution-proof RPC is an explicit closed dependency

The proposed method `materios_b3_calculateCommitteeProof(block_hash, call_data_hex)` is still absent from upstream Materios main. The current upstream `partnerchain/node/src/rpc.rs` at commit `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` registers only `System`, `OrinqReceipts`, and `MotraRpc`; it does not register the B3 proof handler or wire the SDK executor proof provider.

Upstream [issue #50](https://github.com/Flux-Point-Studios/materios/issues/50), which requested this exact node-side RPC, is **CLOSED** with state reason **`not_planned`** (2026-09-26). The source search found no matching implementation commit, branch or pull request. This is stronger than merely saying the endpoint has not yet been observed: the requested upstream work item was closed as not planned, and the current node source still lacks the handler.

No upstream issue was reopened and no change was made to the external Flux Point repository. The IMMORTAL manual live job must remain undispatched until a separately authorized node implementation/deployment (or an explicitly reviewed equivalent endpoint using the same native SDK `ProofProvider::execution_proof` semantics) is available. Setting GitHub repository variables alone cannot satisfy this missing node capability.

### Important B3 classification correction

The Rust CLI and TypeScript collector are useful, tested **preparatory native execution-witness infrastructure**. They are not, by themselves, the B3-C proof described in `docs/IMMORTAL-SYSTEM-MAP.md`.

The system map defines:
`B3-A + B3-B → succinct/ZK proof → Cardano verification`.

The current native pipeline stops after off-chain verification of the Substrate execution proof against a supplied stateRoot/WASM. It does not produce a succinct/SNARK/ZK proof, define and prove the complete public-input relation combining authenticated finality/state/application value/Beacon context, or provide a Cardano Plutus verifier accepting that proof. No proof system has been selected by this implementation.

Correct status:
- IMMORTAL native execution-witness collector/CLI: **IMPLEMENTED**.
- Rust and TypeScript conformance at exact SHA `582ffb...`: **PASS**.
- Live native execution-witness acquisition: **BLOCKED_UPSTREAM_RPC_NOT_DEPLOYED**.
- B3-A independent GRANDPA finality: **OPEN**.
- B3-B state/storage proof: **PASS within the recorded receipt/committee/threshold scope**, with attestation events/signature verification and dispatch-time ordering still open as separately recorded above.
- Full B3-C succinct/ZK relation and Cardano verification: **OPEN / proof system not selected**.
- Full B3 publisher-independent Beacon: **OPEN**.

The earlier Agent C entry about the `d77ebbe...` CLI formatting/run being pending is superseded for native Rust conformance by #41007657185. Its caveat that native execution-proof checking alone does not authenticate finality/runtime canonicality remains valid. Do not retroactively change earlier artifacts or claim the live B3-C job passed.

## Agent B addendum — Pyth Pro feed entitlement probe (2026-10-30, latest)

**Commits on `work/immortal-green-closure`:**
- `84caec2c5ea9e4c152bc4082eaf022cfa28a7b30`: moved signed-update fetch ahead of Pyth State decoding and added datum diagnostics. The first revision temporarily referenced a helper not exported by the pinned published SDK; that was caught by CI before native execution.
- `ebe4c04785098db23b47259bfa0e7cbb27715908`: corrected the import to the pinned published Evolution SDK API. Exact-head TypeScript type-check passed.
- `e18c111f426ae333b3d85a830100c32500496f7f`: writes machine-readable evidence for failed signed-update retrieval, with the response sanitized and no secret or signed payload stored.

### Exact-head evidence

- [Pyth Signed Update — Preprod Ledger Probe #41008762196](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41008762196): native read-only runner reached Pyth Pro and received HTTP **403**:
  `Not entitled: feed 16 (no grant accepts this feed (asset type 'crypto', instrument type 'spot'))`.
- Artifact `12956797007`, `pyth-native-ledger-probe-e18c111f426ae333b3d85a830100c32500496f7f`, records:
  - `status=BLOCKED_PYTH_FEED_ENTITLEMENT`
  - `failureClass=FEED_ENTITLEMENT_REQUIRED`
  - `tokenConfigured=true`, `tokenValueExposed=false`
  - `signedUpdateFetched=false`, `pythStateResolved=false`
  - `walletLoaded=false`, `transactionBuilt=false`, `transactionSigned=false`, `transactionSubmitted=false`
  - `issueAuthorized=false`, `ledgerGateA=NOT_PROVEN`.
- [Isolated Pyth ADA/USD Probe #41008762385](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41008762385): both jobs succeeded. Official Preprod policy-ID guard, TypeScript strict type-check, synthetic Aiken tests, and isolated Plutus V3 compile passed.
- This supersedes the older missing-secret-only observation above. GitHub Actions did inject the configured secret (masked in logs); Pyth denied access to ADA/USD feed ID 16. Do not describe the current blocker as a missing repository secret or a bad token.
- The earlier `State NFT datum is not a Constr` failure has not yet been retested after the fetch-first ordering, because the feed-entitlement rejection occurs before Pyth State resolution. It remains unclassified, not fixed or proven.
- `PYTH_SUBMIT_PREPROD=false`; no wallet credentials were injected. No transaction, signature, ledger acceptance, feed approval, USD/USDM conversion, production Oracle/MintPolicy/Issue wiring, or on-chain change occurred. V3/Reveal, EEV, Issue Admission, economic rules and Materios were not modified.

### External prerequisite

Pyth Pro's current FAQ states that each access token has permissions for asset types, minimum channel and optionally specific feed IDs; it directs customers to their account manager to adjust them. Request an entitlement that explicitly covers **Crypto / spot / feed ID 16 (ADA/USD)** and the required channel `fixed_rate@200ms` (or confirm an allowed slower channel before changing the probe). The Pyth Terminal public pricing page lists Free as view-only/no API access, Starter as API access for crypto symbols with up to 1-second updates, and Pro as broader asset coverage with higher frequency. These plan descriptions do not prove that this particular token has the required grant.

Until Pyth adjusts or confirms the token grant, stop calling the price endpoint. Once entitlement is confirmed, rerun the existing read-only probe; do not enable the manual submission path. The State-datum compatibility check and native-ledger signature verification remain future gates.

**Disposition:** build/typecheck green; native probe correctly fail-closed at Pyth feed entitlement; no on-chain effects. This is an external data-access blocker, not evidence that ADA/USD was cryptographically verified or accepted by the Cardano ledger.

## Agent C addendum — live B3-B receipt lifecycle event proofs (2026-10-30)

**Exact workflow evidence:** [Materios B3 execution-proof verifier #41009622074](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41009622074), source SHA `bd1740356f42e70d4484ea3d61d97ece261f720d`.  
**Current branch HEAD at this checkpoint update:** `f4ef39536033ec983c8b571166228dcb5249c59b`.  
**Scope:** live receipt/storage/event proof acquisition and evidence classification. No upstream Materios changes, no V3/Reveal/economic changes, and no on-chain transaction was submitted by this workflow.

### Exact live B3-B evidence

The workflow completed with these job outcomes:

- `live-storage-proof`: **SUCCESS**.
- `verifier`: **SUCCESS** — Rust formatting and test suite passed.
- `checkpoint-typescript`: **SUCCESS** — TypeScript typecheck, execution-proof packet tests, RPC B3 tests, and attestation-event decoding/membership tests passed.
- `finalized-state-capture`: **SUCCESS** — extraction artifact only; it is not independent GRANDPA verification.
- `real-grandpa-witness`: **FAILURE** — public Materios RPC did not return a usable GRANDPA justification; see the open B3-A boundary below.
- `live-execution-proof`: **SKIPPED** — the opt-in native execution-proof RPC remains unavailable upstream.

The overall workflow conclusion is therefore **FAILURE**, due to the separate `real-grandpa-witness` job. Do not relabel the overall run green; the successful B3-B storage/event subjob is independently useful and exact-head evidence.

### Receipt and event lifecycle

- Receipt ID: `0xbd395bad8cc65bde234537a5e306de71ec3e693407ce402653ebdb8004584e28`.
- Certification block: `2507448`, hash `0xed7ffb3524c1713225ed1a6024ecdb1e60ce6f762a8e394830dd3aec5fff4511`.
- Receipt submission event: block `2507447`, event index 27.
- Three `AttestationRecorded` events: block `2507448`, event indices 3, 5 and 7; counts 1, 2, 3; each reports threshold 3.
- `AvailabilityCertified`: block `2507448`, event index 22; its `cert_hash` matches the indexer and on-chain ReceiptRecord.
- Committee snapshot at certification block: 68 members. On-chain `AttestationThreshold` value: 3.
- The three event-derived AccountId32 values, when decoded from SS58 prefix 0, exactly match the three indexer signer identities decoded from SS58 prefix 42. Comparison is on the underlying 32-byte AccountId, with SS58 checksum validation; text order is not treated as semantic.
- No `CommitteeUpdated`, `CommitteeMemberJoined`, or `CommitteeMemberLeft` event was found after `ReceiptSubmitted` through certification.

### Full interval proof verification — material improvement

The collector captured the complete `System.Events` storage value for **every block** from submission through certification, not only blocks with relevant events. The manifest `attestation-events/proof-blocks.json` contains exactly:

| Block | Hash | Read proof |
|---:|---|---|
| 2507447 | `0xf9d4126f624cdf56611f4968c9702f28612ee11f5a848a2dd38c7349478e236a` | Rust PASS |
| 2507448 | `0xed7ffb3524c1713225ed1a6024ecdb1e60ce6f762a8e394830dd3aec5fff4511` | Rust PASS |

Coverage is contiguous, two of two blocks, with no gaps. The workflow invoked the native Rust `verify-storage-proof` CLI for every `System.Events` proof and for the live ReceiptRecord, CommitteeMembers and AttestationThreshold proofs. The post-verification gate then required the manifest count/range to match the receipt lifecycle and required the event-derived AccountId32 signer set to equal the indexer set. Both checks passed.

Artifact: [materios-b3b-live-storage-proof #12957097122](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41009622074/artifacts/12957097122). The report status is `SYSTEM_EVENTS_STORAGE_PROOFS_RUST_VERIFIED_SIGNER_SET_MATCHED`; signer-set mismatch is `null`; committee mutation count is zero.

### Limits that remain open

This is a strong **B3-B live state/storage/event proof result for this receipt and the two-block lifecycle**, not full Beacon/finality certification:

1. The read proofs authenticate the supplied `stateRoot` values. Their binding to canonical finalized headers is still open until an independent GRANDPA justification and authority-transition chain is verified.
2. The metadata decoder retained the `ApplyExtrinsic` phase variant but did not retain its u32 extrinsic index in the JSON report. The event storage is authenticated, but individual signed extrinsic inclusion/signatures are not independently verified by this artifact.
3. The indexer reports signer identities; the observed event-derived AccountId32 set matches those identities and all event count/threshold fields match. This does not independently validate the three attester signatures or prove the full cryptographic quorum predicate.
4. B3-A independent GRANDPA finality remains **OPEN**. The live GRANDPA job failed because public RPC justifications were absent / unsupported.
5. Full B3-C succinct/ZK proof generation and Cardano-side verification remain **OPEN**; the local Rust native execution-witness verifier is only preparatory infrastructure, and its live RPC path is not deployed upstream.

**Disposition:** B3-B receipt, committee, threshold and full-lifecycle `System.Events` read proofs are **PASS for the recorded receipt**, including native Rust verification and signer-set agreement. GRANDPA finality, individual attester signature verification, source/runtime canonicality, and full B3-C remain open. The subsequent workflow edit at `f4ef3953...` also corrects the diagnostic so unavailable historical state no longer makes the two RPC endpoints appear to have different genesis hashes; that diagnostic correction is not part of run #41009622074 and must be exercised by the next run.

## Agent B addendum — Pyth Terminal free API trial route (2026-10-30)

The entitlement blocker has a newly documented self-serve path that should be attempted before any paid upgrade or account-manager escalation:

- Pyth's official Developer Hub page for [Pyth Terminal](https://docs.pyth.network/pro/pyth-terminal) explicitly says Terminal can generate a **free Pyth Pro API trial key**, instantly and without a credit card. The Explore pages advertise a **14-day trial**.
- The official [ADA/USD feed page](https://app.pyth.com/explore/Crypto.ADA%2FUSD) confirms the exact required feed: `Crypto.ADA/USD`, feed ID `16`, asset class `Crypto`, instrument `Spot`, status `Stable`, minimum channel `fixed_rate@200ms`, 24/7 coverage.
- The official [Pyth Pro FAQ](https://docs.pyth.network/pro/faq) says token grants can restrict asset type, minimum channel and optional feed IDs; when access is not granted, Pyth returns HTTP 403/not-entitled. It says permissions can be adjusted through the account manager.
- Distinguish the temporary free API trial from the permanent **Free** plan on the pricing page: that permanent plan is view-only/no API. The Starter tier lists API access to all crypto symbols and up to one-second frequency; Pro includes wider asset classes and higher frequency. Do not assume a specific account has a grant merely because an API key exists.

### Next operator action

1. In the authenticated Pyth Terminal, open the ADA/USD feed page above and activate **Start free trial** / the trial prompt (the Terminal sign-up flow requires login).
2. After activation, retrieve the current API key from the Terminal. If the trial issues a different key, replace the repository Actions secret `PYTH_LAZER_TOKEN` with that key; never paste it into chat, workflow logs, or source control.
3. Only after activation, run the existing read-only native probe once. A successful API call should move past `BLOCKED_PYTH_FEED_ENTITLEMENT`; it still must not be called a cryptographic or native-ledger pass until state resolution and subsequent explicit ledger verification are independently demonstrated.
4. If the trial token still receives 403 for feed 16 at `fixed_rate@200ms`, stop retries and ask Pyth support/account management to grant `crypto` + `spot` + feed ID `16` at the required channel. The Terminal lists `data@dourolabs.xyz` for support.

**Evidence boundary:** the existence of a 14-day trial and the ADA/USD feed metadata are documented; no evidence yet proves that the user's account has activated the trial or that its token will carry the exact grant. The last native run `41008762196` remains `BLOCKED_PYTH_FEED_ENTITLEMENT`; artifact `12956797007` is unchanged. No further endpoint retries were made. No wallet, transaction, on-chain state or production integration was touched.

## Agent C addendum — repeated B3-B live proof and corrected RPC retention diagnostic (2026-10-30)

**Exact workflow:** [Materios B3 #41009886923](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41009886923), source SHA `f4ef39536033ec983c8b571166228dcb5249c59b`. This run exercised the post-verification report correction and the revised endpoint diagnostic.

### Second independent live receipt cycle

- `live-storage-proof`: **SUCCESS**.
- `verifier`: **SUCCESS** (Rust formatting and tests).
- `checkpoint-typescript`: **SUCCESS**.
- `finalized-state-capture`: **SUCCESS**.
- `real-grandpa-witness`: **FAILURE**.
- `live-execution-proof`: **SKIPPED**.
- Overall workflow: **FAILURE**, solely because the separate GRANDPA witness job failed.

The collector selected a newer certified receipt, not the previous run's record:

- Receipt ID: `0x592ab8d50aec2d3d5b37ebe8b2364d4e2f388e36f6ce5b963c80363d1ea3d17d`.
- Certification block: `2507539`.
- Certification hash: `0x528e2bc1ba1db0c5e08de462fc234dc97ae6b8e4a45f3718eebcb4390fc50cff`.
- `cert_hash`: `0xfc7b86cf8aecae3e96632133c76832725d59a289a8c8ea57e1a62b97f6743b9b`.
- Receipt submission block: `2507538`.
- Read proofs for complete `System.Events` values in both blocks were captured and passed native Rust verification.
- Event-derived AccountId32 signer set matched the events-indexer signer set; three `AttestationRecorded` events had counts 1, 2, 3 and threshold 3; no committee mutation was present in the interval.
- Artifact [materios-b3b-live-storage-proof #12957042030](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41009886923/artifacts/12957042030) records `SYSTEM_EVENTS_STORAGE_PROOFS_RUST_VERIFIED_SIGNER_SET_MATCHED`, contiguous two-block proof coverage and post-Rust-verification semantics.

### Endpoint-retention diagnosis corrected and verified

The earlier diagnostic placed genesis acquisition inside one broad try block. A pruned historical state read then discarded the already-known genesis from the observation and misleadingly printed `MATERIOS_RPC_ENDPOINTS_SAME_GENESIS=false`.

The revised diagnostic records genesis, historical block hash, header, storage and read-proof outcomes independently. In run #41009886923 it established:

- both `/preprod-rpc` and `/rpc` have the same genesis hash `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`;
- both return the same block hash for height `2507143`;
- both can return that block's header, but both report `UnknownBlock: State already discarded` for historical storage/read-proof retrieval at that old height;
- the receipt selector found a more recent certified receipt at block `2507539`, whose historical ReceiptRecord, CommitteeMembers, AttestationThreshold and read proof were successfully retrieved.

This means the endpoints are not different networks. They share the same chain/genesis and a bounded historical-state retention limitation. The selector's recent-receipt/archive-aware behavior is therefore essential; do not retry a pruned receipt indefinitely or substitute latest state for historical state.

### Current disposition

B3-B native storage and event-proof capture has now passed on **two distinct live certified receipt lifecycles**, including full contiguous `System.Events` proofs and signer-set agreement. The exact claims remain bounded:
- authenticated storage values and event vectors against the supplied block state roots: **PASS for the two recorded receipt cycles**;
- finality/canonical block-root binding by independent GRANDPA witness: **OPEN**;
- individual attester signatures / individual extrinsic signatures: **OPEN / NOT VERIFIED**;
- full Beacon proof and B3-C succinct/ZK proof plus Cardano verification: **OPEN**.

The GRANDPA witness job remains the sole failing subjob in both exact runs #41009622074 and #41009886923. Do not report the overall workflow as successful until B3-A is independently verified.

## Agent C addendum — B3-A RPC capability diagnostic and justification-retention blocker (2026-10-30)

**Exact workflow:** [Materios B3 execution-proof verifier #41010549260](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010549260), source SHA `a291e6576cd28b128889a433eaa8c82f53d60d64`.  
**Branch at append:** `085a2b7761388857a0666c87de36b511c7fbe571`.  
**Scope:** B3-A capability diagnosis and evidence retention. No upstream repository changed, no new endpoint/hostname guessed, no authority/finality policy changed.

### Exact run outcome

Run #41010549260 completed **FAILURE** overall because the `real-grandpa-witness` job failed to obtain a justification. Its other relevant jobs completed **SUCCESS**:

- `verifier`: SUCCESS (Rust formatting and verifier tests).
- `checkpoint-typescript`: SUCCESS.
- `finalized-state-capture`: SUCCESS (state/runtime extraction only, not independent finality).
- `live-storage-proof`: SUCCESS (the B3-B storage and attestation-event proof pipeline).
- `real-grandpa-witness`: FAILURE (no justification source exposed by the public RPC).
- `live-execution-proof`: SKIPPED (separate B3-C upstream native proof RPC remains absent).

The failure now uploads [artifact #12957004506](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010549260/artifacts/12957004506), containing `MateriosGrandpaRpcCapabilityDiagnostic.json`. It is not an empty or absent witness artifact.

### Machine-readable RPC observations

The diagnostic was inspected from the uploaded ZIP and reports:

- Chain: `materios_preprod_v6`.
- RPC: `https://materios.fluxpointstudios.com/rpc`.
- Genesis hash: `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`.
- RPC-reported finalized head: block `2507635`, hash `0x5f8f6f64e8b3b8c84d8a0ede719a8a6166feaba469ecfcf2228c05be82a5e706`, stateRoot `0x837b80abb4689452b83f2424ab2efd41c8a1cb3401920a6c333b39e524053860`.
- Dense recent block scan: heights `2506867..2507635`, **769 blocks**, zero FRNK justifications returned by `chain_getBlock.justifications`.
- `grandpa_proveFinality(finalizedHeight)`: JSON-RPC `-32601 Method not found`.
- `grandpa_subscribeJustifications`: JSON-RPC `-32601 Method not found`.
- Both public HTTP RPC routes `/rpc` and `/preprod-rpc` return `justifications: null` on the current finalized head and the same finalized-head hash. The previously corrected endpoint-retention diagnostic also established same genesis and same historical block hash between the routes; their difference is historical state pruning, not a separate network.

The file status is `BLOCKED_GRANDPA_RPC_METHODS_NOT_EXPOSED`. It explicitly sets `cryptographic_finality_verified=false`, `authority_set_provenance_verified=false`, `overall_b3a_status=OPEN`. This is an observed capability diagnosis, not a finality proof.

### Upstream source and advertised sync-node distinction

Current public upstream `Flux-Point-Studios/materios` main was observed at repository update `2026-10-21T09:20:25Z`. Relevant source blobs:

- `partnerchain/node/src/rpc.rs`: `30827863c7b8f6fb507b008cee9f572ec48fe06f`. Its `create_full` registers only `System`, `OrinqReceipts`, and `MotraRpc`; it does not merge a GRANDPA RPC module.
- `partnerchain/node/src/service.rs`: `33298f0fbce45ea7f333728302ee8080eaf12ec8`. GRANDPA is active; `GRANDPA_JUSTIFICATION_PERIOD` is 512 and the service wires `justification_import`, `justification_sync_link`, and `justification_generation_period`. This is evidence that the node service handles GRANDPA justification import/generation, **not** that the public HTTP/WSS API exposes those objects or retains them for arbitrary historical RPC retrieval.
- `docs/OPERATOR_KIT.md`: `d637bbd281f90819b53fde25018b1f6cf4ddae3d`. It describes an FPS-side justification-pruning ban loop, recommends a snapshot-to-tip bootstrap to skip already-pruned heights, and says FPS are also deploying a justification-retaining public sync node. The document does not name a dedicated sync-node URL, RPC port, readiness status, or JSON-RPC capability contract. File history shows this note was added in June 2026; it is not a verified current endpoint announcement.
- The operator kit README's published read/write endpoint remains `wss://materios.fluxpointstudios.com/rpc`; it does not document a second sync-node RPC address.

The separate upstream issue [#50](https://github.com/Flux-Point-Studios/materios/issues/50) is **CLOSED / not_planned**, but its title is specifically `materios_b3_calculateCommitteeProof` (the B3-C native execution-proof RPC). Do **not** treat that issue as the GRANDPA-RPC decision or reopen it to solve this different blocker.

### Current disposition and next required external evidence

- B3-B receipt/committee/threshold/System.Events proofs: **PASS for the two distinct receipt lifecycles already recorded above**; later exact-head rerun #41010549260 also re-ran the same current receipt lifecycle and passed.
- B3-A independent GRANDPA finality: **BLOCKED_RPC_METHODS_NOT_EXPOSED**. No justification artifact has been produced.
- B3-C live execution-proof RPC: remains separately blocked upstream and opt-in skipped.
- The announced public sync node is **UNVERIFIED / endpoint not published in current public documentation**. No guessed subdomain was probed.

To resume B3-A without changing protocol semantics, the next required input is a confirmed FPS sync-node endpoint and its supported retrieval contract (P2P-only vs RPC; `chain_getBlock.justifications`, `grandpa_proveFinality`, or another documented justification retrieval path; retention window and chain/genesis). Alternatively, an authorized archive-capable Materios full node can be brought up from the documented snapshot-to-tip path and used to capture future justifications, but its output still must pass the existing independent authority-set/finality verifier. A finalized-head hash, a GRANDPA period constant, or an RPC-reported finalized label is not a substitute.

**No finality PASS is claimed.** The diagnostic pipeline now retains explicit machine-readable evidence for this upstream interface blocker and the ordinary workflow remains red until B3-A is genuinely verified.

## Agent C addendum — Flux Point DoD pilot exact-head verification (2026-10-30)

**Exact successful workflow:** [Flux Point DoD Pilot #41010944867](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010944867).  
**Source SHA:** 38a13d8acf77479d2934d521b1802c47e757f750.  
**Scope:** repository-local DoD harness plus the existing Materios Rust verifier. No protocol-semantic, V3, Reveal, economic, Preprod, on-chain, or upstream Flux Point changes.

### Exact step evidence

The single job "Local DoD harness + B3-C Rust tests" completed SUCCESS with every substantive step successful:

1. Root dependencies installed with npm ci --no-audit --no-fund.
2. Materios checkpoint dependencies installed.
3. bash scripts/harness.sh --full — SUCCESS.
4. Scoped Node-native edit gate on src/__tests__/b1-invariants.test.ts — SUCCESS.
5. Scoped Vitest edit gate on Adapter/CARDANO/observation/DirectUsdmEev.test.ts — SUCCESS.
6. Rust toolchain and cache setup — SUCCESS.
7. cargo fmt --manifest-path poc/materios-execution-verifier/Cargo.toml --all -- --check — SUCCESS.
8. cargo test --manifest-path poc/materios-execution-verifier/Cargo.toml — SUCCESS.

Other exact-head CI triggered by the same commit also completed SUCCESS:
- [Documentation Link Check #41010944819](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010944819)
- [Algorithmic Governability #41010944828](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010944828)
- [IMMORTAL Portability #41010944911](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010944911)
- [Protocol Declaration #41010944874](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010944874)
- [Cardano Adapter Sale #41010944839](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010944839)

### Interpretation and explicit limits

This is a successful exact-head integration test of the repository-owned harness and two native scoped-test dispatch paths. It also re-validates the current Rust execution/storage verifier test suite. The harness now has a working CI proof that its declared local commands and file-to-runner routing execute successfully.

It does not establish:
- that the Flux Point plugin has been installed on a developer workstation; project Codex/Claude settings only configure activation after the developer installs the marketplace plugin;
- that plugin hooks ran inside this GitHub Actions runner (the workflow runs the repo harness directly);
- full integration of Flux Point's Aiken eUTxO attack taxonomy, CIP-57 blueprint guard, Plutus budget ratchet, graph mode, or Blaster;
- Haskell/Plutus build or generated Haskell–Aiken parity, Yaci ledger evidence, full transaction CBOR, execution-unit measurements, Preprod deployment, or first-ticket Issue.

The earlier upstream plugin review and local trust-boundary cautions remain in force: the harness itself is part of the trust base; retain independent required GitHub Actions and review of the harness/gate declarations.

**Disposition:** repository-side DoD pilot PASS at SHA 38a13d8. It is an additional local evidence gate, not a security guarantee and not a replacement for the dedicated protocol/ledger/Preprod gates.

## Agent B — Flux Point DoD pilot implementation (2026-10-30)

The independent source review recorded earlier is now implemented as a bounded repository-side Loop/DoD pilot.

### Repo-side changes

- `.fluxpoint-gates.json` binds the full DoD predicate to `scripts/harness.sh --full`.
- The harness explicitly scopes Vitest discovery to `src/`, `Adapter/` and `PRE-RICH/`, sends the Node-native test suites to `tsx --test`, and runs the Genesis Treasury top-level assertion fixture directly with `tsx`. It does not sweep the separately locked `poc/materios-grandpa` package into the root Vitest run.
- The `--changed <file>` path dispatches to the native runner: Node-native `node:test`, direct assertion fixture, or Vitest. Unknown/unmapped paths remain fail-closed.
- `.github/workflows/fluxpoint-dod-pilot.yml` runs `--full`, independently exercises one Node-native and one Vitest `--changed` path, then runs Rust formatting and `cargo test` for `poc/materios-execution-verifier`.
- Repository activation files are present at `.codex/config.toml` and `.claude/settings.json`; operational instructions are documented in `docs/04-verification/FLUXPOINT-DOD-PILOT.md`.

### Fixture fixes exposed by the first native test pass

The first native Node run surfaced stale fixture inputs/expectations, not a production V3 regression:
- `src/__tests__/immortal-cardano-replay.test.ts`: expected class caps were `1` while the fixture's authoritative input declared `10`; the observed post-state also changed issue counters for classes untouched by Reveal.
- `src/__tests__/immortal-prerich-reveal-transaction-fixture.test.ts`: the active class was marked saleable even though `issued=1` equalled `cap=1`. Its fixture cap is now `10`.

Only test fixture/expected values were changed. No V3 projection code, Reveal implementation, IMMORTAL economic rule, Plutus validator, or on-chain semantics were changed.

### Exact-head CI result

[Flux Point DoD Pilot #41010944867](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010944867) completed **SUCCESS** at `38a13d8acf77479d2934d521b1802c47e757f750`. The single job passed:
1. `scripts/harness.sh --full`;
2. scoped Node-native edit gate (`src/__tests__/b1-invariants.test.ts`);
3. scoped Vitest edit gate (`Adapter/CARDANO/observation/DirectUsdmEev.test.ts`);
4. Rust formatting check;
5. native Materios execution-verifier Rust tests.

The same exact SHA also passed Documentation Link Check, Algorithmic Governability, IMMORTAL Portability, Protocol Declaration, and Cardano Adapter Sale conformance. Agent C independently recorded the exact run in the preceding checkpoint addendum.

### Runtime activation and remaining scope

The Codex/Claude project settings **enable** Flux Point after a developer installs the marketplace/plugin on that machine. The machine-level install commands were not run by GitHub Actions or this ChatGPT session; no claim is made that local Stop or PostToolUse hooks are already active. The reviewed upstream manifest is `fluxpoint 1.49.0` at `175c0a79f9a998b5fe1e212b511dd490ec06f4a8`; that is a review reference, not a technical version pin on marketplace installation.

This is not yet the full feature set: there is no root `WORK.md` or locked `.fluxpoint-spec.json`, no mapped eUTxO `.fluxpoint-attacks.json` taxonomy, no Plutus budget/CIP-57 blueprint manifest, no Blaster gate and no graph-mode campaign. These require a real obligation-to-test mapping and review, not blanket declarations. The harness deliberately leaves Haskell/Plutus, generated Haskell–Aiken parity, Yaci/ledger execution, complete transaction CBOR and measured ExUnits, Preprod deployment and first Issue to their dedicated workflows/evidence gates. The GHC/Cabal-dependent differential test is not silently counted as passing.

The harness and gate declarations remain part of the trust base and can be changed by contributors. Maintain independent required GitHub Actions and review on harness/gate/baseline changes.

**No Preprod deployment or PRE-RICH Issue is established by this pilot. No wallet signing or transaction submission was performed.**



## Agent C addendum — B3 evidence-layer review and Flux Point boundary assessment (2026-10-30)

**Reviewed exact live run:** [Materios B3 execution-proof verifier #41010549260](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010549260), source SHA `a291e6576cd28b128889a433eaa8c82f53d60d64`. This is a field-level review of the retained run artifacts and the current B3 workflow/probe source, not a new live run.

### B3-B — what the artifacts actually establish

Artifact [materios-b3b-live-storage-proof #12957705428](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010549260/artifacts/12957705428) was downloaded and inspected. It records:

- Receipt `0x592ab8d50aec2d3d5b37ebe8b2364d4e2f388e36f6ce5b963c80363d1ea3d17d`, certification block **2507539**, block hash `0x528e2bc1ba1db0c5e08de462fc234dc97ae6b8e4a45f3718eebcb4390fc50cff`, and cert hash `0xfc7b86cf8aecae3e96632133c76832725d59a289a8c8ea57e1a62b97f6743b9b`.
- The receipt storage read proof contains 10 proof nodes and was passed to the native Rust storage-proof verifier by the workflow.
- The complete metadata-decoded `System.Events` storage values for both blocks **2507538** (ReceiptSubmitted) and **2507539** (AvailabilityCertified) have read proofs independently verified by Rust against the supplied state root at each exact block.
- The event-derived three-signer AccountId32 set matches the events-indexer signer set; the on-chain committee snapshot and threshold (3) were read at certification block 2507539; no committee mutation event was found in the authenticated two-block interval.
- The artifact's transport checks record the certification block/hash binding, receipt storage binding, committee/threshold snapshot and signer membership checks as true.

**Keep the limits explicit:** the artifact itself sets `signatures_independently_verified=false` and `quorum_threshold_independently_verified=false` for the indexer certification; individual attester/extrinsic signatures are not independently verified. Most importantly, the supplied block state roots are **not independently bound to GRANDPA finality** by this job. Therefore B3-B storage/event proof verification is PASS for this captured receipt lifecycle, but it is not a canonical/finalized Materios claim.

### B3-A — exact current blocker and WebSocket probe status

Artifact [materios-grandpa-witness-diagnostic #12957004506](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010549260/artifacts/12957004506) records:

- chain `materios_preprod_v6`, genesis `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`;
- finalized-head observation at block **2507635**, hash `0x5f8f6f64e8b3b8c84d8a0ede719a8a6166feaba469ecfcf2228c05be82a5e706`;
- 769 recent blocks scanned (2506867–2507635), with no FRNK justification in `chain_getBlock.justifications`;
- `grandpa_proveFinality` and `grandpa_subscribeJustifications` both return JSON-RPC `-32601 Method not found`.

The job table confirms `real-grandpa-witness` failed and `live-execution-proof` was skipped; the Rust verifier, checkpoint TypeScript, finalized-state capture and B3-B live storage-proof jobs succeeded. This is an interface/capability failure, not a failed cryptographic verification of a captured justification: no justification was obtained.

**Important source/run distinction:** the current B3 workflow file (blob `48f755fb6cea5cf4d2f291fc0f716319cf79865b`) now contains a read-only WebSocket capability/candidate probe step before witness capture, using `poc/materios-checkpoint/src/probe-websocket-rpc-capabilities.mjs` (blob `8ccdf8c6f80c2e92ffa3baa0887c7064903a6965`). That probe checks the WebSocket RPC catalogue, `grandpa_proveFinality`, `grandpa_subscribeJustifications`, and can retain raw FRNK payload bytes plus hashes as **unverified acquisition evidence**. However, run #41010549260's recorded job steps do **not** include that new WebSocket probe step. Do not describe the new probe as live-tested or as having found a justification until a subsequent exact-head workflow run records its step and artifact.

### B3-C — missing upstream input, not missing local verifier

The Rust crate `poc/materios-execution-verifier` exists and its format/tests passed in the exact-head DoD pilot #41010944867. Its execution verifier requires an exact state root, SCALE proof, runtime WASM plus expected code hash, runtime method, call-data bytes and expected result. It deliberately does not establish finality or that the supplied WASM is the deployed runtime at the target block.

The remaining B3-C dependency is a real, reproducible upstream execution-proof acquisition path for the exact Materios target (proof bytes, target block/state root, runtime identity and exact API input/output), not another local verifier. The previous upstream issue #50 concerns `materios_b3_calculateCommitteeProof` and is closed/not planned; it must not be conflated with the distinct GRANDPA justification RPC gap.

### Flux Point applicability decision

- **Native Command Binding:** do not duplicate or replace IMMORTAL's evidence packet. Flux Point binds a worker's reported shell readings to local native CLI journals/transcripts; it is useful for auditing agent-executed commands, but it does not authenticate Materios RPC responses, state roots, GRANDPA finality, runtime identity or chain storage proofs. The B3 evidence boundary remains the existing Rust verifier plus explicit source/target provenance.
- **Exact worktree bases:** retain as a future Graph-mode hardening candidate if/when a multi-agent graph is introduced. The existing A/B/C work remains on its assigned branches; no graph campaign is currently required to close the live B3 blockers.
- No second verifier, new branch, wholesale merge, or changes to V3, Reveal, economic rules or Materios authority-selector semantics are warranted by this review.

### Current evidence matrix

| Layer | Current classification | What would change it |
|---|---|---|
| B3-B receipt/committee/events storage proofs | **PASS — bounded to recorded receipt lifecycle and supplied state roots** | Keep exact artifacts and Rust verification; finality remains a separate layer |
| B3-A GRANDPA justification acquisition | **BLOCKED — public HTTP methods absent; 769-block scan had no FRNK justification** | Run the current WebSocket probe at exact HEAD; if no payload, obtain a confirmed FPS archive/sync-node contract or authorized archive-capable node |
| B3-A authority-set provenance | **OPEN** | Authenticate the authority set at the proof target and verify the transition chain; current-head fallback remains diagnostic/untrusted |
| B3-C native execution proof | **OPEN / SKIPPED in #41010549260** | Obtain exact upstream proof artifact and bind runtime WASM identity, state root, method, calldata and expected result |
| Flux Point Native Command Binding | **NOT ADOPTED for chain evidence** | Optional later use for agent shell-command provenance only |
| Flux Point exact worktree base | **DEFERRED** | Revisit with a real locked Graph campaign |

**Next bounded action:** execute the current B3 workflow at its exact current branch HEAD so the newly added WebSocket probe is actually run and its JSON artifact retained. Inspect its catalogue, genesis match, candidate block/header, raw FRNK payload status and hashes. If it yields a payload, feed it only through the existing GRANDPA verifier and keep authority-set provenance fail-closed. If it does not, request the confirmed FPS archive/sync-node endpoint and retention contract; do not guess a hostname or treat the RPC finalized label as proof.

**No B3-A/B3-C closure is claimed. No Preprod ticket, wallet action or on-chain protocol change was performed.**


## Agent C addendum — Materios B3 historical snapshot and GRANDPA set-id investigation (2026-10-31)

**Scope:** autonomous, read-only investigation on Agent C branch `work/b3-materios-provenance-evidence`. No request was sent to Flux Point Studios. No protocol, V3, Reveal, economic or authority-selector semantics were changed.

### Snapshot / archive finding

The official Preprod snapshot opens only with its stored pruning mode **`Constrained(256)`**. An attempted `--state-pruning archive` open was explicitly rejected as an incompatible pruning-mode change. Do not describe this snapshot as archive-capable and do not try to rewrite its RocksDB metadata: pruned historical states cannot be restored by changing the mode.

A bounded isolated FULL-role diagnostic now starts from the checksum-verified snapshot using `--state-pruning 256`, loopback RPC, mock main-chain follower solely for service startup, zero peers and no block import. It verifies the expected genesis and a target block inside the retained 256-block window. This is a historical-state availability test only, not an archive node or an independent finality source.

### Exact witness result — run #41165134861

[Materios B3 execution-proof verifier #41165134861](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41165134861), commit `07a9fce5dd1ac584a8b2cf0221e104e312bdb041):

- The WebSocket FRNK candidate at block **2509824** was bound to the exact local snapshot header and block hash. The public HTTP route did **not** match the WebSocket candidate; the evidence records `LOCAL_SNAPSHOT_RPC` binding and `public_http_cross_route_matched=false`. This fallback is explicitly diagnostic and does not hide the HTTP discrepancy.
- The snapshot's runtime API at block 2509824 returned five GRANDPA authorities, weight 1 each, and **set ID 4434** (raw SCALE `0x5211000000000000`).
- Signature verification under set ID 4434: **0/4 valid**.
- A bounded diagnostic search found set ID **4343**, under which **4/4** signatures verify and the signed weight is **4/5**. This candidate is **UNTRUSTED diagnostic only**; it is not an authenticated authority set and must not be substituted for 4434.
- The parent block and the five preceding block states (2509819–2509824) all return set ID **4434**. The 4343 candidate does not appear in that six-block state window. A simple parent/post-state off-by-one explanation is therefore not supported.
- `authority_transition_provenance=false`; B3-A remains **OPEN**. No finality or canonicality PASS is claimed.

The same run's Rust verifier, live storage-proof job and finalized-state capture succeeded. The real GRANDPA witness job failed as expected because the exact runtime set ID does not verify the captured signatures.

### Follow-up diagnostic in progress

Commit `b3093bc26d74b5526fa3e4bfd8ac2753bf862e9b` adds a read-only `grandpa_roundState` observation against public HTTP and the isolated local snapshot RPC, alongside the runtime API set-ID evidence. This may distinguish the node's live GRANDPA voter view from the runtime's stored set ID. It is an untrusted observation, not a trust anchor. The exact-head workflow is [#41165523804](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41165523804); at checkpoint update time, the live witness job is still running. The companion evidence-boundary workflow is green, including GRANDPA TypeScript build/tests.

### Current B3 classification

| Layer | Classification | Evidence / next condition |
|---|---|---|
| Snapshot retained state | **PASS — bounded 256-block window** | Checksum-verified snapshot, expected genesis and exact local header/hash; not archive |
| B3-A raw FRNK acquisition | **PASS — candidate acquired** | WebSocket payload captured; local snapshot header/hash binding; public HTTP mismatch explicitly recorded |
| B3-A cryptographic finality | **FAIL under runtime set ID 4434** | Diagnostic 4343 gives 4/4 and 4/5 but remains untrusted |
| B3-A authority-set provenance | **OPEN** | Need reconcile runtime set ID, live voter set and authenticated transition history |
| B3-B storage proof | **PASS — bounded to captured receipt lifecycle/state roots** | Existing Rust verification remains separate from GRANDPA finality |
| B3-C execution proof | **OPEN** | No change in this investigation |

**Next bounded action:** inspect the `grandpa_roundState` diagnostic from run #41165523804. If the live voter set reports 4343 while runtime state reports 4434, record a concrete node/runtime consensus-state discrepancy and keep B3-A OPEN. If it reports 4434, investigate why the attached FRNK justification verifies only under 4343 and whether the payload is stale or from another finality context. Do not accept 4343 without authenticated authority-set provenance.

**No external request, archive-node installation, Preprod transaction, wallet signature or on-chain change was performed.**


## Agent C addendum — GRANDPA voter RPC capability and digest-window probe (2026-10-31)

### Exact result — run #41165523804

[Materios B3 execution-proof verifier #41165523804](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41165523804), commit `b3093bc26d74b5526fa3e4bfd8ac2753bf862e9b`, completed **FAIL** only at `Capture and verify real Materios GRANDPA witness`. The verifier, live storage-proof and finalized-state-capture jobs succeeded. The snapshot state probe succeeded; the raw WebSocket FRNK candidate at block **2509824** was again acquired and bound to the exact snapshot header/hash.

The resulting artifact [materios-real-grandpa-witness #13029127688](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41165523804/artifacts/13029127688) records:
- runtime set ID **4434**, five authorities, four precommits, round **1253**;
- signature verification under 4434: **FAIL / INVALID_SIGNATURE**;
- the only matching localized-payload set ID in the diagnostic search is **4343**, with all 4/4 signatures valid and the existing full verifier yielding 4/5 signed weight plus ancestry — explicitly **UNTRUSTED diagnostic only**;
- parent state and all six states 2509819–2509824 return 4434;
- the authority set is read at the exact proof target, but `provenance_verified=false`;
- transition witness not found; B3-A remains **OPEN**.

### Why `grandpa_roundState` cannot resolve this through current Materios RPC

The probe tried `grandpa_roundState` on both public HTTP and the local snapshot RPC. Both return JSON-RPC `-32601 Method not found`.

This is explained by the official Materios source, not by a probe bug:
- `partnerchain/node/src/rpc.rs` constructs the node's full RPC module by registering only System, OrinqReceipts and MOTRA. It does not register the standard GRANDPA RPC handler.
- `partnerchain/node/src/service.rs` starts the GRANDPA voter task when enabled, but that voter state is not exported through the custom `create_full` RPC module.
- The isolated snapshot node is also started without peers and cannot provide a live peer-synchronized voter view.

Therefore do not repeat `grandpa_roundState` probes or treat the missing method as a GRANDPA consensus failure. Current public Materios gateway and node RPC interfaces do not expose this observer endpoint. No upstream request was made.

### Cryptographic payload encoding cross-check

The pinned upstream Polkadot SDK implementation of `sp_consensus_grandpa::localized_payload` explicitly encodes `(message, round, set_id)`. IMMORTAL's existing `encodeLocalizedPrecommitPayload` uses that same order and SCALE-u64 encoding. The 4343 match remains a cryptographic diagnostic only; it does not prove that 4343 was the authorized set for block 2509824.

### Next autonomous probe

Commit `ac93e256d93bb7386a79563c6a0497f78e8409a6` extends the snapshot probe to retain the target header digest, runtime version and any FRNK consensus digest logs in the retained 256-block header window. Commit `eb0edb2f794dd808f773a3dd8fb475233db82263` fixes the JSON-RPC parameter construction for those header queries.

Exact-head workflow [#41173448645](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41173448645) is running. It will show whether the candidate header/window carries GRANDPA scheduled/forced-change logs and identify the runtime version used at the target. This is a bounded diagnostic; a 256-block window cannot reconstruct 91 earlier set transitions. If no relevant digest logs occur in the window, the next work must shift to a verifiable historical header/digest acquisition path and genesis-anchored replay, not guessed set IDs.

**Current classification:** B3-A witness acquisition PASS (candidate only); signature verification under exact runtime set 4434 FAIL; set 4343 diagnostic only; authority-set provenance OPEN; B3-B remains bounded PASS; B3-C unchanged OPEN. No protocol semantics, V3, Reveal, economic rules, or authority-selector behavior changed. No external request, wallet action or on-chain transaction occurred.


## Agent C addendum — GRANDPA target header and retained digest-window result (2026-10-31)

Exact-head workflow [#41173470032](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41173470032), commit `eb0edb2f794dd808f773a3dd8fb475233db82263`, completed with the GRANDPA witness step failing as expected under runtime set ID 4434. The snapshot probe itself passed and produced artifact [materios-snapshot-state-probe #13031732332](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41173470032/artifacts/13031732332).

The exact target header at block **2509824** is:
- hash `0x0f3b29d5c6285fdfe92e4f4ba8dfc13904c78b9a43fa6a4a7bf952da5d4d913e`;
- state root `0x52885158fd5b31e72f262a70d6def97191bb4b727a30252e694a99949f1adea7`;
- runtime `materios`, `specVersion=242`, `implVersion=1`, `transactionVersion=6`;
- digest logs contain Aura slot, McHash and Aura seal entries; no FRNK consensus log.

The snapshot probe scanned every header from **2509569 through 2509824** (256 blocks) and found **zero** FRNK consensus digest logs. Thus the candidate target block itself does not carry a visible GRANDPA ScheduledChange/ForcedChange digest, and there is no such digest in the immediately preceding retained header window. This narrows the one-block transition hypothesis but cannot exclude older transitions outside the window.

The runtime API still returns `GrandpaApi_current_set_id = 4434` and five authorities at the exact target state. The raw justification signatures still match only diagnostic set ID 4343. The runtime version is recorded so future runtime-code identity comparisons can be made against the deployed code. No canonicality/finality PASS is inferred from the local snapshot.

### Follow-up

Commit `1683b38d0ac137df81192f8910d18ee044bd513c` adds exact-target raw storage reads for `Grandpa.CurrentSetId`, `Grandpa.Authorities`, `Grandpa.PendingChange`, `Grandpa.Stalled` and `PalletSession.CurrentIndex`, then compares the two GRANDPA runtime API values with their raw storage values. Commit `84ed1ebebfb4f5d4293966c7a4d5fb32a7591018` corrects the session pallet storage prefix to the runtime alias `PalletSession`.

Exact-head workflow [#41173729276](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41173729276) is running. Its purpose is to establish whether the runtime API agrees with direct storage and whether a PendingChange/Stalled value exists at the target. Even a clean storage match does not authenticate the active GRANDPA voter set; it only establishes what the target state commits.

**B3-A remains OPEN.** The absence of FRNK logs in the 256-block window plus the 91-set-ID mismatch points to a historical voter/runtime divergence or a mismatched justification attachment, but neither is proven yet. Next work depends on direct storage and pending-change evidence, then historical header/digest replay if needed. No external request, node authority action, protocol semantic change, wallet signature or on-chain transaction occurred.


## Agent C addendum — Exact GRANDPA state/storage consistency at block 2509824 (2026-10-31)

Exact-head workflow [#41173729276](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41173729276), commit `84ed1ebebfb4f5d4293966c7a4d5fb32a7591018`, completed with the GRANDPA witness verification failing, while the local snapshot probe succeeded. Artifact [materios-snapshot-state-probe #13031998285](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41173729276/artifacts/13031998285) provides direct storage evidence at exact target block 2509824.

### Exact target storage findings

- `GrandpaApi_current_set_id`: `0x5211000000000000` (SCALE little-endian u64 = **4434**).
- Direct `Grandpa.CurrentSetId` storage at the target hash returns the same hex value.
- `GrandpaApi_grandpa_authorities` and direct `Grandpa.Authorities` storage return the same encoded five-authority list.
- `Grandpa.PendingChange`: absent (`null`).
- `Grandpa.Stalled`: absent (`null`).
- `PalletSession.CurrentIndex`: `0x52110000` (SCALE little-endian u32 = **4434**).
- Target runtime is `specVersion=242`; source commit `ea86448d4aed4c1fc99d4e355e09ac280a3e4bbe` is the public Materios runtime source declaring spec 242.
- The target header and preceding 255 headers contain **zero FRNK consensus digest logs**.

The artifact's two booleans `current_set_id_api_matches_storage` and `authorities_api_matches_storage` are false only because the shell helper serializes JSON-RPC string results as JSON-quoted strings and the jq comparison compares quoted JSON text with raw hex. The raw values visibly match exactly. This is an evidence-formatting bug, not a state mismatch. A follow-up patch will decode the JSON string before comparing and will record the decoded storage values.

### Interpretation

At the target block the runtime state is internally consistent: current set ID, authorities and session index all agree; no pending authority change or stalled marker exists. Combined with no FRNK digest in the retained 256-header window, this does **not** support a one-block pending-transition explanation for the 4434/4343 discrepancy.

The raw witness signatures still match set ID 4343 only as an untrusted diagnostic, whereas exact target runtime/storage state commits to 4434. Therefore the acquired FRNK payload cannot currently be accepted as a valid finality proof for this target under the committed runtime state. A stale/misbound justification attachment or a deeper runtime/voter consensus divergence remains possible; neither is yet proven.

### Next bounded actions

1. Correct the probe's JSON string unwrapping so API/storage equality booleans are true when raw values match.
2. Query the same exact candidate block over both public WebSocket routes (`/preprod-rpc` and `/rpc`) and compare header hash, raw FRNK payload hash, and justification bytes. This tests whether the discrepancy is route-specific.
3. Test whether the snapshot retains historical block headers well before the 256-block state window. If so, use the existing headers to reconstruct the GRANDPA FRNK scheduled/forced-change history from the genesis authority set; if not, keep B3-A OPEN and identify an independent historical-header source.

**B3-A remains OPEN.** No 4343 promotion, no authority-set substitution, no external request, no on-chain transaction and no changes to V3, Reveal, economic rules or authority-selector semantics.


## Agent C addendum — Cross-route FRNK candidate comparison and historical header availability (2026-10-31)

Exact-head workflow [#41174092250](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41174092250), commit `063ae9c33ebe95c2e3d500523008690c04da470a`, completed with GRANDPA witness verification failing under runtime set ID 4434. Its WebSocket route-comparison artifact [#13031773132](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41174092250/artifacts/13031773132) was inspected.

### Cross-route result

Both:
- `wss://materios.fluxpointstudios.com/preprod-rpc`
- `wss://materios.fluxpointstudios.com/rpc`

return the same exact candidate for block **2509824**:
- same genesis hash and chain identity;
- same target block hash `0x0f3b29d5c6285fdfe92e4f4ba8dfc13904c78b9a43fa6a4a7bf952da5d4d913e`;
- same header and state root;
- same single FRNK payload, 574 bytes, SHA-256 `6b26b94c600b9b59ce7f80300873a28f5ab50dd9a0cda85be1cfff73938b7c1d`;
- both routes report finalized-head observation 2521983;
- neither route advertises/accepts GRANDPA proof RPC methods.

This rules out a discrepancy isolated to the `/preprod-rpc` WebSocket route. It does not distinguish a shared gateway/node stale-justification issue from a deeper consensus/runtime divergence.

### Historical block header retention

The same snapshot probe successfully retrieved and recorded raw headers at blocks:
- 2508824 (1,000 before target);
- 2499824 (10,000 before);
- 2409824 (100,000 before);
- 2009824 (500,000 before);
- 1509824 (1,000,000 before).

All five headers were available despite the snapshot's `Constrained(256)` **state** pruning mode. The official Materios gateway source `src/routes/explorer-chain.ts` also documents that raw block headers are retained and can be queried without historical `state_getRuntimeVersion`. This gives us a viable path to reconstruct GRANDPA authority changes from historical headers, rather than relying on unavailable historical state.

The sampled headers had no FRNK digest logs, but sampling alone does not establish the complete transition history.

### Next action

Commit `11d17e2eff1465fdc72ecea1f229dd157348f533` changes the snapshot node's log filter to `grandpa=debug` and captures the GRANDPA voter startup log line `Starting new voter with set ID ...`. This should reveal the node's persisted GRANDPA authority-set ID from its own auxiliary voter state, independently of the runtime API read. Exact-head workflow [#41174445548](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41174445548) is queued.

If the local node's persisted voter set ID is 4343 while runtime storage is 4434, record a concrete snapshot aux-state/runtime-state discrepancy; if it is 4434, the shared WebSocket FRNK candidate is not valid under the local node's current set. In either case, retain fail-closed status until the full historical digest chain is reconstructed and the proof passes.

**B3-A remains OPEN.** No 4343 promotion, no external request, no authority action, no transaction and no changes to protocol semantics, V3, Reveal or economic rules.


## Agent C addendum — Snapshot-persisted GRANDPA voter set contradicts runtime set ID (2026-10-31)

Exact-head workflow [#41174445548](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41174445548), commit `11d17e2eff1465fdc72ecea1f229dd157348f533`, completed with the real GRANDPA witness verification failing as before. The snapshot-state artifact [materios-snapshot-state-probe #13032587479](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41174445548/artifacts/13032587479) now includes the node's GRANDPA voter startup logs, collected with `-linfo,grandpa=debug`.

### Snapshot node's persisted voter state

The official Materios node, started from the checksum-verified snapshot in isolated FULL role (0 peers, no block import), logged:

- `Starting new voter with set ID 4343`;
- voter rounds 1263, 1264 and 1265 under set ID 4343;
- round 1264 completed with finality target **block 2509826**;
- precommit weight for round 1264: **5/5 actual**, threshold 4/5.

This is a direct observation of the snapshot node's **persisted GRANDPA authority-set state**, loaded from its local GRANDPA auxiliary data. It is independent of the `GrandpaApi_current_set_id` runtime API query.

### Exact contradiction at the same snapshot

At target block **2509824**:
- runtime API and direct `Grandpa.CurrentSetId` storage: **4434**;
- `PalletSession.CurrentIndex`: **4434**;
- direct `Grandpa.Authorities` storage matches runtime API's five authorities;
- `Grandpa.PendingChange` and `Grandpa.Stalled`: absent;
- the raw FRNK justification for block 2509824 has all four signatures valid under set ID **4343**, not 4434;
- the snapshot node's persisted voter set is **4343** and it finalizes block 2509826 in that set.

Therefore the 4343 match is not merely a mathematical search candidate: it matches the snapshot's persisted GRANDPA voter state and the set used by its completed finality round. Conversely, the runtime state at the same block is 91 set IDs ahead. This is a concrete **runtime-state / persisted-voter-state divergence inside the published snapshot**.

**Trust boundary:** the snapshot node is isolated and has no peers; its aux voter state is a source observation, not an independently authenticated statement of the live network's canonical voter set. It may represent the snapshot publisher's persisted state, including a stale aux database. Do not promote 4343 as canonical solely from this log. The raw WebSocket candidate and snapshot voter log agree, but the runtime state disagrees.

### Strongest next investigation

The official Materios source's GRANDPA pallet increments `CurrentSetId` when `on_new_session` successfully schedules a change, and emits the corresponding FRNK digest in the block header. The snapshot has raw headers available at sampled heights as far back as **block 1509824**, despite state pruning 256. This opens an autonomous path:

1. scan the retained historical headers from genesis to block 2509824;
2. verify each header hash and parent link, anchored to the known genesis hash and exact target hash;
3. decode every FRNK ScheduledChange / ForcedChange digest and replay the set-ID transitions;
4. compare the replayed set ID and final authority list with runtime storage (4434) and snapshot voter aux state (4343);
5. only then decide whether the snapshot aux state is stale, the runtime set counter is divergent, or the header chain contains missing/malformed authority-change evidence.

The 256-block digest window had zero FRNK logs, and sampled headers at 2508824, 2499824, 2409824, 2009824 and 1509824 were all retrievable. A full historical scan is the next decisive step. The existing verifier remains fail-closed; no change to set-ID selection or signature verification has been made.

**B3-A remains OPEN.** No authority set is promoted as canonical, no external request was sent, and no V3, Reveal, economic, authority-selector, wallet or on-chain behavior was changed.


## Agent C addendum — Follow-up after unavailable GRANDPA voter RPC and direct storage cross-check (2026-10-31)

- Exact run [#41165523804](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41165523804), SHA `b3093bc26d74b5526fa3e4bfd8ac2753bf862e9b`, completed **FAIL** at the real witness gate. The added `grandpa_roundState` diagnostic returned `-32601 Method not found` on both the public HTTP endpoint and the isolated local snapshot RPC. It did not reveal the live voter set ID; do not describe it as a voter/runtime mismatch.
- The same run again confirmed target/parent runtime API set ID `4434`, five authorities, and `INVALID_SIGNATURE` for the four-precommit FRNK candidate. The six-block historical window remained `4434` throughout. Candidate `4343` remains a diagnostic-only signing-payload match and is not authenticated.
- Exact-head workflow [#41175139511](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41175139511), SHA `f156289fc4b7e8c553411c1ca7a9c6341669936c`, was superseded/cancelled during the snapshot probe when the next commit landed. Its dual WebSocket probe artifacts did complete: both `wss://materios.fluxpointstudios.com/preprod-rpc` and `wss://materios.fluxpointstudios.com/rpc` connected, matched the expected genesis, exposed 85 RPC methods, did not advertise GRANDPA proof/subscription methods, and returned the same unverified historical FRNK candidate at block 2509824. No finality claim follows from this.
- Commit `f156289fc4b7e8c553411c1ca7a9c6341669936c` added a direct `state_getStorage` comparison for `Grandpa.CurrentSetId` against `GrandpaApi_current_set_id`. During review, the initial key constant in the new TypeScript diagnostic was found to omit the second-seed xxhash64 half of each Twox128 component. It was corrected to the full 32-byte key in commit `493256dfa9201891396f504d9af9b60e230bc439`, before accepting any result. The pre-existing snapshot probe also reads raw `CurrentSetId`, `Authorities`, `PendingChange`, `Stalled` and `Session.CurrentIndex` storage using full Twox128-derived keys and records API/storage equality.
- Current exact-head run [#41175284220](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41175284220), SHA `493256dfa9201891396f504d9af9b60e230bc439`, is in progress. Its real-witness job has passed both WebSocket acquisition steps and is running the checksum-verified snapshot probe. It then runs the genesis-anchored raw-header/FRNK digest-history scan before the witness verifier. The scan is bounded to the exact target hash, recomputes every header hash and parent link from genesis, and replays FRNK scheduled/forced authority-change logs; it is evidence for reconstruction, not finality by itself.
- The companion evidence-boundary workflow for SHA `493256dfa9201891396f504d9af9b60e230bc439` completed successfully, including `poc/materios-grandpa` tests and TypeScript build.

**Current classification remains:** B3-A **OPEN**. `grandpa_roundState` is unavailable; runtime-vs-raw-storage comparison and genesis-anchored digest replay are pending exact-head artifacts. Do not infer or accept set ID 4343. No V3/Reveal/economic semantics, wallet or on-chain state changed.


## Agent C live run update — snapshot probe passed, digest replay executing (2026-10-31)

Exact-head run [#41175284220](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41175284220), SHA `493256dfa9201891396f504d9af9b60e230bc439`:

- Both WebSocket acquisition routes completed successfully.
- The checksum-verified snapshot probe completed **SUCCESS** using the stored `Constrained(256)` mode. It ran the runtime API and raw-storage cross-checks at the exact target block; the resulting artifact will be inspected before interpreting equality or mismatch.
- The next step, `Reconstruct GRANDPA authority changes from genesis-anchored headers`, is currently **in progress**. It must complete before the witness verification step can consume the digest-history artifact.
- The real witness verifier has not yet run in this exact-head job. No B3-A closure is claimed.


## Agent C addendum — Historical header scan transport boundary and current replay run (2026-10-31)

### Public RPC scan attempt

A separate read-only workflow [#41175490373](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41175490373) attempted the genesis-to-target header scan against `https://materios.fluxpointstudios.com/rpc`, using the previously captured snapshot evidence fixture. It verified the first 256 headers, then the next `chain_getBlockHash` batch returned JSON-RPC `-32999: RPC rate limit exceeded`. The artifact [#13032950229](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41175490373/artifacts/13032950229) records this as FAIL. Therefore the public HTTP RPC is not a viable transport for the complete 2.5M-header replay at the current request budget. No authority conclusion is drawn from this failed scan.

The exact snapshot evidence fixture is now retained at `docs/04-verification/MATERIOS-SNAPSHOT-STATE-PROBE-2509824.json`, derived from snapshot artifact #13032587479. It pins the target hash, runtime authorities, runtime/storage set ID 4434, absent PendingChange/Stalled values, and snapshot voter startup set ID 4343. The fixture's authority SCALE bytes were corrected to the exact 201-byte value from the artifact after the first public scan caught a four-hex-character transcription omission.

### Current local-snapshot replay

The local-snapshot path remains the primary scan source. Exact-head workflow [#41175284220](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41175284220), commit `493256dfa9201891396f504d9af9b60e230bc439`, has:
- verifier: SUCCESS;
- live storage proof: SUCCESS;
- finalized-state capture: SUCCESS;
- snapshot retained-state probe: SUCCESS (completed 06:08:53Z);
- genesis-anchored GRANDPA digest replay: IN PROGRESS (started 06:08:53Z).

Agent C's parallel commit `f156289fc4b7e8c553411c1ca7a9c6341669936c` adds an exact-target `Grandpa.CurrentSetId` direct-storage comparison to the witness capture. Follow-up commit `493256dfa9201891396f504d9af9b60e230bc439` corrects its Twox128 storage key to the complete 32-byte `Twox128("Grandpa") ++ Twox128("CurrentSetId")` key. These are diagnostics only; no verifier set selection or consensus semantics changed.

**Next action:** wait for the local snapshot digest replay artifact. Compare replayed ScheduledChange/ForcedChange count and final authority list against runtime set 4434 and persisted voter set 4343. If the scan is interrupted by the workflow timeout, increase the bounded job timeout or split the scan into resumable ranges; do not substitute the rate-limited public RPC or weaken hash/parent-link checks.

**B3-A remains OPEN.** The snapshot voter/runtime contradiction is confirmed as an observation, not yet reconciled with the full genesis-to-target header history.


## Agent C addendum — Genesis-anchored GRANDPA digest replay completed (2026-10-31)

Exact-head workflow [#41175284220](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41175284220), source branch `work/b3-materios-provenance-evidence`, commit `493256dfa9201891396f504d9af9b60e230bc439`, completed the local-snapshot replay and uploaded artifact [materios-grandpa-digest-history #13032599446](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41175284220/artifacts/13032599446).

### Replay evidence

The artifact reports `status=PASS` and `GENESIS_ANCHORED_HEADER_CHAIN_AND_FRNK_DIGEST_SCAN_PASS` for `materios_preprod_v6`:
- scanned blocks 0 through 2,509,824 inclusive (2,509,825 headers);
- recomputed every header hash and verified every parent link;
- verified the configured genesis hash and exact target hash;
- found 4,434 FRNK consensus logs: 4,408 ScheduledChange and 26 ForcedChange, with zero unknown FRNK variants;
- replayed set ID from genesis set 0 to **4434**;
- replayed authority list matches the exact-target runtime authority list;
- runtime set ID is **4434**; snapshot GRANDPA voter auxiliary set ID remains **4343**.

Artifact SHA-256: `25d037ed938ae954ce8d5aa0abd60daeb1554739232a4fe2f1ba935aa304de02`. The replay uses the genesis authority list pinned to `Flux-Point-Studios/materios` source commit `ea86448d4aed4c1fc99d4e355e09ac280a3e4bbe`. Its trust scope is header-chain continuity and FRNK transition reconstruction from the pinned genesis, not finality proof acceptance by itself.

### Narrowed discrepancy

The 4,343rd replayed change (set ID 4343) is at block **2,455,115**. The 4,434th (set ID 4434) is at block **2,509,528**. Thus set 4343 was superseded by 91 subsequent set changes before target block **2,509,824**. The authority list at the set-4343 transition is byte-for-byte/member-for-member the same five-key list as the replayed set 4434 list; the set ID nevertheless differs and is part of the GRANDPA localized signing payload.

The captured target justification is round 1253, commits to the exact target hash at block 2,509,824, and has four precommits. Its signatures fail under replayed/runtime set ID 4434; the bounded localized-payload diagnostic finds all four signatures valid only with set ID 4343. The snapshot voter startup log also reports set ID 4343. This is consistent with stale GRANDPA voter auxiliary state being used to produce or retain a justification for a later block, but the causal path is not yet proven.

The exact-target witness artifact [#13032584596](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41175284220/artifacts/13032584596) still reports `cryptographic_finality=false`, `authority_transition_provenance=false`, and overall B3-A `OPEN`. The genesis-anchored replay does not upgrade the justification to valid finality.

### Next bounded investigation

1. Inspect the exact source implementation and artifact generation path for the digest replay, including the genesis-authority pin, FRNK SCALE decoding, ScheduledChange enactment semantics, and hash/parent-link verification; preserve this as a reproducible verifier test.
2. Capture and compare raw justifications around the set-4343 interval, the set-4434 transition at block 2,509,528, target 2,509,824, and the snapshot voter round target 2,509,826. Verify each only against the set ID active at its exact target according to replay.
3. Determine whether the public RPC's target justification is stale/misbound, or whether the node's persisted voter aux state is stale and continuing to sign/finalize under 4343 despite runtime set 4434. Do not infer this from the startup log alone.
4. Keep B3-A OPEN until a justification for the exact target verifies under the replayed active set and its transition provenance is independently accepted.

No authority set is substituted, no V3/Reveal or protocol semantics are changed, no external request is made, and no on-chain action occurs.


### Follow-up review of the replay implementation and genesis anchor

A source-level review of `poc/materios-grandpa/src/scan-grandpa-digest-history.mjs` and its imported `hashMateriosHeader` helper confirms that the scan:
- encodes each Substrate header in canonical SCALE field order and hashes it with Blake2b-256;
- compares the recomputed hash with `chain_getBlockHash` at every height;
- checks each header's parent hash against the immediately preceding verified header;
- decodes FRNK ScheduledChange and ForcedChange SCALE payloads with length/trailing-byte checks.

The separate `genesis-trust-manifest-preprod-v6.json` is `VERIFIED`: it records a recomputed genesis hash matching the configured anchor and GRANDPA authorities decoded from hash-bound raw genesis storage and cross-checked against the pinned Materios source. It explicitly still marks post-genesis authority-transition history and post-genesis GRANDPA finality as unverified. The digest scanner currently pins the same four genesis authorities directly in source rather than loading the manifest at runtime; a future hardening test should assert exact equality to the manifest and pin its digest.

The scanner's set counter is the number of ScheduledChange plus ForcedChange logs. Review of the full artifact shows all 4,408 ScheduledChange logs have delay 0; all 26 ForcedChange logs have delay 30 and occur before block 534,962, with each `median_last_finalized + delay` at least 370 blocks before its digest header. Therefore the delayed forced changes have already passed their enactment boundary well before the set-4343 transition at block 2,455,115 and the target at 2,509,824. This supports the late-height set-ID mapping in this artifact, while a general-purpose replay should still model and test enactment semantics explicitly rather than relying on this chain-specific distribution.

**Additional next-step focus:** the target justification is for round 1253 and exact block 2,509,824; the isolated snapshot voter log says set 4343 and round 1264 finalized block 2,509,826 with 5/5 weight. Capture raw signed blocks/justifications at 2,455,115 (set-4343 activation), 2,455,116, 2,509,528 (set-4434 activation), 2,509,824, and 2,509,826 from both public WebSocket routes and the isolated snapshot where available. Bind every proof to its exact header and verify only under the set ID active at that height. This should distinguish a stale retained justification from a voter process that continues to operate with stale auxiliary set state. Do not treat the local snapshot's mock main-chain follower as validator evidence; the probe runs isolated and its warning explicitly labels that mode development-only.


## Agent C addendum — five-block GRANDPA witness window and signer-set diagnostics (2026-10-31)

### Exact-target acquisition

The read-only matrix workflow [#41176176923](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41176176923), commit `8498b9ff7bd16786b0061b6ef04372ca77e98784`, completed successfully for all five requested targets. Each job acquired the target over the public WebSocket RPC and independently fetched the same target over public HTTP RPC. All five comparisons reported `HEADER_BOUND_BOTH_ROUTES`: the genesis identity matched, target number/hash matched, and canonical header fields matched across the two routes.

| Target block | Hash | WebSocket FRNK | HTTP FRNK | Raw WS justification SHA-256 |
|---:|---|---:|---:|---|
| 2,455,115 | `bee05dbe7e3f712c129603fc0e32c744b3af38aba69836bed66c9ce6b7982ff8` | 1 | 0 | `500d24d5a9b111d074e2ce5b7eb062bf20ca32effe5e2904e5106ebbdffdd48c` |
| 2,455,116 | `08d636928c9180958cc014807a7bcf29b748b4bc2bf159c8a9104b0ae5bd096b` | 0 | 0 | — |
| 2,509,528 | `fe39a600a08a402546464f105c321ec07bab4670cb779c04b5a79b7e8a96dd5e` | 1 | 0 | `021dda878d042cccdffa4c1c5ebf05eca7d84e0db3c28ae11df955c6b0ee4fa7` |
| 2,509,824 | `0f3b29d5c6285fdfe92e4f4ba8dfc13904c78b9a43fa6a4a7bf952da5d4d913e` | 1 | 0 | `6b26b94c600b9b59ce7f80300873a28f5ab50dd9a0cda85be1cfff73938b7c1d` |
| 2,509,826 | `ad5479c405ee2f4ebf29c345c072e311037294acbba48ff1a4850b161c7a13da` | 0 | 0 | — |

Artifacts (run #41176176923):
- block 2,455,115: artifact #13033446328, SHA-256 `f8c5da94176f97b2cc8a5d6e19f6ca1a8a8a45a18c206193919bfdef174c2c8b`
- block 2,455,116: artifact #13033290833, SHA-256 `d96fc444df409b2f6768a6583a24eb8597169f5c8f1e251ec4c8b03f1256b579`
- block 2,509,528: artifact #13033305816, SHA-256 `54f41bb89627b8e2c48af136e276ea1ebdc9dd3e951b51e14651ebacac24c59c`
- block 2,509,824: artifact #13032806285, SHA-256 `a2b007d729d2a110daf3ca4055586216e5fe20710059634062d031394ef00759`
- block 2,509,826: artifact #13032887077, SHA-256 `9d3030393cfe79d66c7811f16bc7d4e0a1c59b92364f65de6067d01a738929bb`

The HTTP route returned the exact headers but no FRNK justification at any of the five targets; the WebSocket route exposed raw justifications at 2,455,115, 2,509,528 and 2,509,824. Therefore the HTTP route's missing `justifications` field is an acquisition-path limitation, not evidence that those target headers lack a GRANDPA justification. The two routes are header-consistent, but their justification availability differs.

### Localized-signature diagnostic across the three captured justifications

The three raw FRNK payloads were SCALE-decoded. Each commits to the exact requested target hash and number and contains four precommits. Exhaustive Ed25519 localized-payload checks over candidate set IDs 0..4999 found all four signatures valid only at:
- block 2,455,115: round 2542, candidate set ID **4251** (4/4);
- block 2,509,528: round 2542, candidate set ID **4342** (4/4);
- block 2,509,824: round 1253, candidate set ID **4343** (4/4).

None of these three payloads verifies under candidate set ID 4434. The four signer public keys are members of the five-key authority list observed at the 2,509,824 target, but this diagnostic does not authenticate historical authority membership or the active set at the earlier blocks. Candidate IDs are cryptographic localized-payload matches, not promoted trust anchors.

This materially strengthens the stale-voter hypothesis: at the exact 2,509,824 target, the previously captured local snapshot runtime API and direct storage both report set ID 4434, while the exact-target justification's four signatures match set ID 4343. The local snapshot voter startup log also reports set ID 4343. However, the two earlier witnesses match 4251 and 4342 respectively, and both carry round 2542; the target witness carries round 1253. The round discontinuity and historical active-set mapping still require explanation.

### Important correction to digest replay interpretation

The existing `scan-grandpa-digest-history.mjs` computes `replayed_set_id_from_change_logs` by simply counting every ScheduledChange plus ForcedChange digest. It verifies header continuity and FRNK SCALE decoding, but it does **not** model scheduled/forced enactment, pending changes, cancellation/supersession, or the exact state transition timing at each target. Therefore the per-height values 4343 at block 2,455,115 and 4434 at block 2,509,528 are digest-log ordinals, not yet independently established active GRANDPA set IDs. The target runtime value 4434 at block 2,509,824 is independently observed from the local snapshot state probe; it must not be retroactively assumed for the earlier targets.

A follow-up read-only attempt to query historical runtime API/storage state from the public HTTP endpoint returned `UnknownBlock: State already discarded` at all five targets. This confirms historical state pruning on that public route. The local snapshot evidence remains available only for the exact target 2,509,824.

### Next bounded work

1. Correct the replay model to enact ScheduledChange and ForcedChange according to GRANDPA semantics, including parent/target boundary timing, and test against exact-target runtime observations where retained state exists. Do not call a digest count an active set ID.
2. Obtain historical state from a source that actually retains it (the existing isolated snapshot, if it contains those heights, or another already-configured archive source); do not infer historical state from public HTTP's pruned responses.
3. Explain why the 2,455,115 and 2,509,528 payloads use round 2542 while the 2,509,824 payload uses round 1253, and whether those proofs were emitted by different voter instances or after a voter restart.
4. Keep B3-A OPEN. No justification has yet been accepted against a genesis-rooted, correctly enacted historical authority-set chain. No external request to Flux Point was made; acquisition used only existing public RPC endpoints. No transactions or on-chain changes occurred.


### Historical state availability check completed

The read-only state-window workflow [#41176475742](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41176475742) completed successfully across all five target/parent pairs. The RPC successfully returned block hashes, but every `state_call(GrandpaApi_current_set_id)`, `state_call(GrandpaApi_grandpa_authorities)`, and `state_getStorage(Grandpa.CurrentSetId)` request at those historical hashes returned `UnknownBlock: State already discarded`. This includes 2,509,824, so the public HTTP archive route cannot independently reproduce even the previously observed exact-target runtime state. The existing local snapshot evidence for 2,509,824 remains the only available state observation in this workstream.

State-window artifacts:
- 2,455,115: #13033047374, SHA-256 `924163d951fd44d5ea8120faaf87bc333d9773ab4d51e528d756c78bc65a0b2d`
- 2,455,116: #13033830813, SHA-256 `1e272e04cfc5f26f26cc1afa8230a494dd08d084e616f747e999a6cf1787182f`
- 2,509,528: #13033771109, SHA-256 `417412f6d378271c804a5407cbb489486b48fb4c307e98409e73a74583f9784a`
- 2,509,824: #13033610786, SHA-256 `5a454df8a158d82828f3ec8a14a314ff7467546aa8c12035acb68db1505ca44b`
- 2,509,826: #13033396901, SHA-256 `382ec0d09a89ab82463233f788e95a88e95074e306f7712e84ebb95f30077beb`

This is a confirmed historical-state retention boundary, not evidence for any set ID. The next valid route is to inspect the already checksum-verified local snapshot at the earlier heights, if it contains the required historical state, or use an already-configured archive source. Do not retry the same pruned public HTTP state calls as though they were likely to recover.


### Cross-reference: signature-matched set IDs map to earlier digest ordinals

The candidate set IDs from the three raw justifications were cross-referenced against the genesis-anchored FRNK event array in artifact #13032599446. Each candidate ID corresponds exactly to the same 1-based ordinal event in the replay:

| Candidate signer set ID | Matching FRNK event block | Witness block | FRNK event ordinal at witness block | Ordinal lag |
|---:|---:|---:|---:|---:|
| 4251 | 2,405,335 | 2,455,115 | 4343 | 92 |
| 4342 | 2,454,515 | 2,509,528 | 4434 | 92 |
| 4343 | 2,455,115 | 2,509,824 | 4434 | 91 |

For each candidate event authority list, all four precommit signer keys are present in its five-member authority list. The four signatures also verify under that candidate event ordinal as the localized GRANDPA set ID. This is a much tighter historical association than an unconstrained numerical search: the matching IDs map to concrete earlier FRNK authority-change events and their decoded authority lists.

At target 2,509,824, the local snapshot independently reports runtime API and direct `Grandpa.CurrentSetId` storage value 4434, while the snapshot GRANDPA voter starts at set 4343 and completes round 1264 at block 2,509,826. The exact-target justification at 2,509,824 is round 1253 and is cryptographically compatible with set 4343. The candidate 4343 maps to the authority-change event at block 2,455,115, 54,709 blocks before the target. This is strong evidence of a voter process operating roughly 91 authority-set transitions behind runtime state.

This still does not prove the exact transition enactment chain or the node's internal persistence/recovery bug. The public HTTP historical state is pruned; the official snapshot uses `Constrained(256)`; the workflow confirmed `MATERIOS_ARCHIVE_RPC` is not configured. The two earlier historical target-state values cannot currently be queried from either existing public HTTP state or that snapshot's retained state window.

The remaining causal question is now narrow: why does the GRANDPA voter persist/replay set 4343 while runtime state is 4434, and why do earlier raw justifications show the same approximately 92-event lag (4251 and 4342) with round 2542 before the round resets to 1253? Treat this as a probable stale GRANDPA voter auxiliary-state / catch-up defect, not as a proven root cause until a retained-state or node-internal voter-state trace demonstrates the transition path. B3-A remains OPEN.


### Upstream Materios source cross-check — documented warp/state-sync set-ID hazard

A read-only inspection of the public Materios source at commit `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` found an explicit warning in `tools/launch-preflight/README.md` (committee rule 9) and `tools/launch-preflight/launch_preflight.py:2661-2679`:

- genesis must have `Grandpa.CurrentSetId = 0` and exactly one `Grandpa.SetIdSession` entry (set 0 from session 0);
- the preflight explicitly warns that a GRANDPA client starts from genesis set ID 0, while a node that warp- or state-syncs takes the runtime's set ID and can therefore hold a different set ID from the one peers use to sign votes and justifications.

The same source's `partnerchain/node/src/service.rs:228-244` unconditionally configures `WarpSyncConfig::WithProvider(warp_sync)`, with the provider built from `grandpa_link.shared_authority_set()`. Its voter startup at lines 367-395 uses `SharedVoterState::empty()` and starts `run_grandpa_voter`.

This is directly relevant to the observed 4434 runtime / 4343 voter split and makes a warp/state-sync authority-set initialization mismatch a concrete upstream hypothesis, not a generic guess. It does **not** yet prove that the published snapshot was created by warp sync or that warp sync caused this exact stale auxiliary state: our snapshot probe is isolated, has no peers, runs with `Constrained(256)`, and uses a mock main-chain follower only to start local RPC.

Next source-level test: trace how the pinned Substrate `sc-consensus-grandpa` version initializes `grandpa_link.shared_authority_set()` from restored auxiliary DB versus runtime/warp proof, then add a fail-closed diagnostic comparing (a) runtime `Grandpa.CurrentSetId`, (b) restored GRANDPA voter/authority-set ID, and (c) set ID carried by the exact proof. Do not modify Materios upstream, V3, Reveal, or any on-chain state. B3-A remains OPEN.


### Pinned GRANDPA implementation trace — persisted auxiliary state is the voter input

The Materios `partnerchain/Cargo.lock` pins `sc-consensus-grandpa 0.30.0` to Polkadot SDK commit `c455194a2ae2f613c1c671e00dbf397b83ed8171` (`polkadot-stable2409-4`). Source inspection at that exact commit establishes the following startup path:

1. Materios `partnerchain/node/src/service.rs:117-123` creates `grandpa_block_import` and `grandpa_link` via `sc_consensus_grandpa::block_import`.
2. Pinned `sc-consensus-grandpa/src/lib.rs:562-575` calls `aux_schema::load_persistent` against the backend AuxStore. The genesis runtime API is supplied only as the fallback closure if persistent data is absent.
3. Pinned `aux_schema.rs:362-380`: when GRANDPA DB version 3 and `AUTHORITY_SET_KEY` exist, the loader decodes the persisted `AuthoritySet` and `VoterSetState` and returns them directly. It does not compare the persisted set ID with runtime `Grandpa.CurrentSetId`.
4. Pinned `lib.rs:450-454` exposes this persistent set through `LinkHalf.shared_authority_set()`; Materios `service.rs:228-244` uses it to construct the warp-sync provider, and `service.rs:378-395` passes the same link to the GRANDPA voter.

This gives a concrete mechanism for the observed split: a restored DB can load voter/authority auxiliary state at set 4343 while the runtime state at the same chain height reports 4434, because the startup loader trusts the persisted GRANDPA AuxStore state and performs no runtime-set consistency check. The snapshot log's `Starting new voter with set ID 4343` is therefore consistent with the aux-store value being used as the voter set. Combined with the upstream preflight's explicit warp/state-sync warning, stale or divergent GRANDPA auxiliary authority state is now the leading root-cause hypothesis.

**What remains unproven:** we have not extracted the exact `AUTHORITY_SET_KEY` bytes from the published snapshot RocksDB, nor identified the event/import/warp-sync path that left them at 4343 while runtime storage reached 4434. The isolated snapshot log is a strong observation of the loaded voter set, not a raw AuxStore proof. The next test should capture the aux key and decoded voter state from the snapshot DB itself, then compare it byte-for-byte with runtime `Grandpa.CurrentSetId` and the active-set chain. Do not "repair" the snapshot or synthesize a new set ID; keep B3-A OPEN until the source of divergence is proven.


### AuxStore key semantics confirmed against the exact pinned SDK source

A further read-only inspection of paritytech/polkadot-sdk at the exact Materios lockfile commit c455194a2ae2f613c1c671e00dbf397b83ed8171, file substrate/client/consensus/grandpa/src/aux_schema.rs, confirms the exact persisted data contract:

- VERSION_KEY = b'grandpa_schema_version' stores the GRANDPA AuxStore schema version; current version is 3.
- AUTHORITY_SET_KEY = b'grandpa_voters' stores SCALE-encoded AuthoritySet<Block::Hash, NumberFor<Block>>. Its decoded set_id, current authority list, and pending standard/forced changes are the key evidence needed.
- SET_STATE_KEY = b'grandpa_completed_round' stores SCALE-encoded VoterSetState<Block>, including the completed-round state used to restart the voter.
- Both are loaded through AuxStore::get_aux(key); the loader does not read these values from runtime storage.
- On schema version 3, load_persistent decodes grandpa_voters and grandpa_completed_round and returns the persisted values. The genesis authority provider is used only when no supported persisted authority set is found. The version-3 path contains no comparison against runtime Grandpa.CurrentSetId.

This confirms the correct extraction target and prevents a misleading approach: state_getStorage cannot expose these AuxStore keys, and a generic search of runtime pallet storage is not the right test. The exact raw key/value bytes should be read from the snapshot's database through the matching SDK backend's AuxStore::get_aux implementation, or through a small read-only diagnostic linked to the exact pinned sc-client-db/SDK revision. Do not assume a raw RocksDB column/key layout until the pinned backend implementation and database source configuration have been checked.

**Next bounded action:** obtain an already-local copy of the published snapshot (no new request/download to Flux Point), identify the exact database backend/configuration and use a read-only AuxStore reader to dump:
1. schema version;
2. raw and SHA-256 digests of grandpa_voters and grandpa_completed_round;
3. decoded authority-set set_id, current authorities, and pending changes;
4. decoded voter state and last completed round.

The diagnostic must not open the database for writes, run migrations, or mutate the snapshot. If a safe read-only backend cannot be established, stop and request a local copy/export from the operator rather than using RocksDB repair/open tools on the original. Compare the decoded aux set ID to the independently observed runtime set ID 4434 and the exact-target justification candidate 4343. Keep B3-A OPEN; this establishes the extraction method, not the root cause.


### Evidence-status correction in the Agent C state-window workflow

Commit `7b6cd4d5322ccc3ea1fc3225b379adfc08ea6c81` updates `.github/workflows/materios-grandpa-state-window.yml` so the artifact no longer labels a run `CAPTURED` when all historical state reads failed. Each parent/target record now classifies its result as `STATE_CAPTURED`, `HISTORICAL_STATE_PRUNED`, or `PARTIAL_STATE_UNAVAILABLE`; the top-level status is derived from both records. This is an evidence-integrity correction only: no RPC scope, target heights, chain state, runtime behavior, or protocol semantics changed. The push-triggered workflow result must be checked before treating this patch as CI-verified.


## Agent A addendum — Pyth Pro Moneta reserve feed identified; no USD/USDM unit feed (2026-10-31)

**Scope:** read-only catalog reconciliation for P-02 / USD-USDM Option B. No code, economic parameter, workflow, wallet, or on-chain state changed.

### Public Pyth Pro Symbology result

A read-only query to the public Symbology & Reference Data endpoint `GET https://pyth.dourolabs.app/v1/symbols?query=USDM` returned these relevant rows:

| Feed | Pyth Pro ID | Exact description | State | Type | Quote | Min publishers | Min channel |
|---|---:|---|---|---|---|---:|---|
| `Crypto.NAV.USDM/RESERVES` | **3326** | US DOLLAR MONETA / RESERVES | stable | NAV | USD | 2 | fixed_rate@200ms |
| `Crypto.USDM/USD` | **609** | MOUNTAIN PROTOCOL USD / US DOLLAR | inactive | crypto | USD | 1 | fixed_rate@200ms |
| `Crypto.NAV.USDM1/USD` | **3324** | US DOLLAR M1 / US DOLLAR | stable | NAV | USD | 2 | fixed_rate@200ms |

Feed 3326 metadata: exponent -8; 24/7 schedule; Terminal page https://app.pyth.com/explore/Crypto.NAV.USDM%2FRESERVES; catalog endpoint https://pyth.dourolabs.app/v1/symbols?query=USDM%2FRESERVES. Pyth's Symbology documentation defines `nav` as net asset values of tokenized funds: https://docs.pyth.network/pro/symbology-reference. It is therefore not a unit spot quote for one USDM token.

Feed 609 is explicitly Mountain Protocol USD, not Moneta USDM, and is inactive. Feed 3324 is US Dollar M1, not the Moneta token. No active public catalog row for a Moneta `Crypto.USDM/USD` unit-price feed was found in this query.

### Reserve value reconciliation warning

Pyth Terminal showed approximately **11,571,398.61 USD** for feed 3326. The Moneta Proof of Reserves page currently exposed in the available web capture shows **9,609,507.48 USD** total reserve balance and **9,609,507.48 USDM** circulating supply, with a "Verified on-chain · today" label: https://moneta.global/transparency/.

The arithmetic difference between the displayed values is **1,961,891.13 USD (~20.42%)**, but this is **not a demonstrated contemporaneous divergence**: the Moneta page snapshot in the web index is marked as crawled approximately two months before the Pyth inspection, and the extracted page does not expose a precise observation timestamp. The values may refer to different observation times or definitions. Treat this only as an unresolved cross-source reconciliation item, not as a confirmed oracle error. Obtain raw Pyth update timestamps and the exact Moneta on-chain reserve datum before comparing them. Neither value may be converted into a USD-per-USDM price by assumption.

### Relation to existing Pyth probe and IMMORTAL

- Existing exact-head native Pyth probe #41008762196 tested feed ID 16 (ADA/USD) and failed closed with `403 FEED_ENTITLEMENT_REQUIRED`; it did not establish entitlement for the NAV asset class or feed ID 3326. No further authenticated endpoint call or workflow dispatch was made.
- Existing Pyth carrier feasibility remains software-only. `plutus/MintPolicy.hs` still consumes the legacy Oracle State quote; no Pyth production binding to MintPolicy is evidenced.
- Feed 3326 may be investigated as a reserve-attestation cross-check only after raw signed update, source/publisher provenance, exact timestamps and freshness are acquired, and the 20.42% arithmetic cross-source difference (not proven contemporaneous) is explained.
- Feed 3326 does not close Option B (USD/USDM per unit), does not establish issuer redemption parity, and does not alter direct-USDM EEV qualification. VerifiedUSDM remains the qualified token quantity physically present in the exact B1 PrizePool UTxO.
- Do not confuse Pyth Pro numeric feed IDs with Pyth Core 32-byte Hermes IDs; the Pyth Pro Cardano guide documents the pull/update flow and requires consumer-side freshness checks: https://developers.cardano.org/docs/build/integrate/oracles/pyth/.

### Exact read-only acquisition path if Pyth grants the feed

Pyth Pro documents `POST https://pyth-lazer.dourolabs.app/v1/latest_price` as the authenticated latest-update endpoint. A feed-3326 read should request channel `fixed_rate@200ms` (its catalog minimum) and capture at least `price`, `exponent`, `publisherCount` and `feedUpdateTimestamp`, plus the signed payload format actually supported by the existing Cardano verifier. Pyth documents 403 as credentials not granting access to the requested feed; the previous feed-16 403 therefore cannot be generalized as a result for ID 3326. No API request was made because current entitlement for the NAV feed is not established. Do not expose or paste API secrets into chat, and do not modify the existing Agent B runner merely to probe this candidate.

API references: https://docs.pyth.network/pro/api/rest · https://docs.pyth.network/api-reference/real-time-prices/latest-price.

**Disposition:** Moneta reserve NAV feed **IDENTIFIED / NOT QUALIFIED FOR ECONOMIC USE**; Moneta USDM/USD unit feed **NOT FOUND IN THE PUBLIC CATALOG QUERY**; Option B **OPEN**. Preserve existing branch ownership: no duplicate Pyth consumer or new converter, and no Agent B/V3/Reveal changes.

Issue #37 record: https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6540194166.


### Exact AuxStore physical location and read-only opening hazard

Read-only inspection of the pinned Polkadot SDK commit c455194a2ae2f613c1c671e00dbf397b83ed8171, in substrate/client/db/src/lib.rs and substrate/client/db/src/utils.rs, establishes:

- The full-node database has 13 columns; `columns::AUX` is numeric column 8.
- `Backend<Block>::get_aux(key)` is exactly `storage.db.get(columns::AUX, key)`; `insert_aux` writes to the same column.
- For the pinned SDK lockfile, `kvdb-rocksdb` is version 0.19.0.
- The normal `sc-client-db::utils::open_database` path is unsuitable for an evidence-preserving read: it invokes `maybe_migrate_to_type_subdir`, the RocksDB opener invokes `upgrade_db` and `update_version`, and `check_database_type` writes metadata if the DB type marker is missing. Do not use that path against the source snapshot.

A local runtime/container inspection found only previously downloaded small GitHub Actions evidence ZIPs and extracted JSON artifacts. The approximately 2.39 GB published Materios snapshot is not present in the active working filesystem, so no AuxStore bytes can be extracted in this session. No new snapshot download or request to Flux Point was made.

The SDK's AUX column and key contract are now exact, but a safe raw reader is not yet approved. The candidate route is to use a separately opened RocksDB secondary/read-only view (or an immutable working copy) with the exact 13 column-family names `col0` through `col12`, read key bytes `grandpa_schema_version`, `grandpa_voters`, and `grandpa_completed_round` from column 8, and never call the SDK migration/open helper on the source. Before implementation, verify that the pinned kvdb-rocksdb 0.19.0 API supports this read-only/secondary mode and that the snapshot actually uses RocksDB rather than ParityDB. The SDK supports both database backends; the snapshot's backend must be established from its files/configuration, not guessed.

B3-A remains OPEN. The physical storage contract is now known; the source database itself is still unavailable, and the stale-AuxStore diagnosis remains a leading hypothesis rather than a proven root cause.


## Agent A — Pyth Pro Cardano entitlement path (2026-10-31)

A fresh review of the official Intersect onboarding announcement identified a concrete access route for the existing Pyth Pro investigation:

- Intersect announced on 2026-06-17 a free one-year Pyth Pro subscription for every project building on Cardano, described as full access with no usage caps.
- Published onboarding path: contact `genia@dourolabs.xyz`, provide the project name and what is being built; Pyth issues the API key and onboarding support.
- Official announcement: https://www.intersectmbo.org/news/pyth-pro-on-cardano-subscription-offer
- Pyth API-key guidance: https://docs.pyth.network/pro/acquire-api-key

IMMORTAL-specific status:
- The protected `PYTH_LAZER_TOKEN` was configured in the project environment and its authentication succeeded in the prior probe. The probe of feed ID 16 (ADA/USD) returned `403 FEED_ENTITLEMENT_REQUIRED`; this is a feed-entitlement result, not an authentication failure.
- That result does not establish entitlement for feed ID 3326. The current key's feed entitlements should be checked using the documented `GET /v1/symbols?entitled_only=true` filter, then the Pyth team should confirm that the existing Cardano project key is covered by the one-year offer and whether it includes `Crypto.NAV.USDM/RESERVES` (ID 3326, asset type `nav`).
- If entitlement is granted, the next read-only acquisition is the signed feed-3326 update on `fixed_rate@200ms`, preserving raw price, exponent, publisher count, feed-update timestamp and signed payload. No authenticated request to feed 3326 has been made in this pass.
- Feed 3326 remains a reserve NAV cross-check only, not a USD-per-USDM unit quote. It cannot close Option B or change direct-USDM EEV.

Issue #37 access-route record: https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6540273424.

**Disposition unchanged:** Option B selected; no qualified USD/USDM unit-price source; Pyth feed 3326 not qualified for economic use; no code, consumer, Oracle schema, Kernel, V3, Reveal, deployment, EEV approval, wallet signature, or on-chain state changed. Do not dispatch or modify Agent B's runner for this Agent A entitlement check.


## Agent A — Pyth feed-16 entitlement failure revalidated from actual run logs; feed 3326 still untested (2026-10-31)

Re-opened GitHub Actions run [#41008762196](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41008762196), commit `e18c111f426ae333b3d85a830100c32500496f7f`, and decoded job logs.

- `PYTH_LAZER_TOKEN` was present in the protected Actions environment; logs redact its value.
- `PYTH_SUBMIT_PREPROD=false`; no wallet was loaded and no transaction was built, signed, or submitted.
- The isolated Aiken consumer checks/build completed successfully.
- The latest-price call failed HTTP 403 with the precise reason: `Not entitled: feed 16 (no grant accepts this feed (asset type 'crypto', instrument type 'spot'))`.
- The evidence artifact was uploaded by the run. The denial is specific to feed 16 (ADA/USD, crypto/spot). It is not evidence of an authentication failure, a signature-verifier failure, or a Cardano deployment-policy failure.
- Feed 3326 is a NAV instrument. It has **not** been requested with this key; entitlement for asset type `nav` remains UNKNOWN. Do not infer that feed 16's denial applies to feed 3326.

Current official Pyth access guidance:
- [Pyth Terminal](https://docs.pyth.network/pro/pyth-terminal) currently documents a self-serve free API trial token, generated in the browser without a credit card.
- [Pyth entitled-only symbols API](https://docs.pyth.network/api-reference/price-feeds/symbols) documents `GET /v1/symbols?entitled_only=true`; a bearer token is required and only feeds covered by the key are returned.
- [Intersect Cardano offer](https://www.intersectmbo.org/news/pyth-pro-on-cardano-subscription-offer), 2026-06-17, offers one year of Pyth Pro access to Cardano projects through onboarding at `genia@dourolabs.xyz`.
- [Pyth API access notice](https://pyth.substack.com/p/api-access-is-changing), 2026-05-26, says real-time API access requires Starter or Pro. Treat the Cardano offer as a separate ecosystem onboarding route; do not assume it changed the existing key's entitlement automatically.

**Next safe gate:** obtain a valid eligible credential via Pyth Terminal trial or the Cardano offer; then perform only the authenticated read-only entitled-catalog query and determine whether feed 3326 is included. Do not call latest-price for feed 3326 before confirming entitlement. Even if entitled, 3326 remains a reserve NAV cross-check, not a USD-per-USDM unit quote.

Issue #37 evidence record: https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6540317004.

**Disposition unchanged:** Option B selected; no qualified USD/USDM unit-price source; EEV direct-USDM remains independent; no production code, Oracle schema, consumer, Kernel, V3, Reveal, EEV approval, deployment, signature, or on-chain state changed.


## Agent C — GRANDPA historical-state workflow classifier correction; prior green run invalid for state classification (2026-10-31)

Re-inspected GitHub Actions run [#41176475742](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41176475742), whose head commit was `257c151a7aa7835b3f4211bb3b9116d1557a8605`.

- All five matrix jobs completed successfully, but this only confirmed that each job produced and uploaded an artifact.
- The artifact for target block 2,509,824 (#13033610786; SHA-256 `5a454df8a158d82828f3ec8a14a314ff7467546aa8c12035acb68db1505ca44b`) contained `UnknownBlock: State already discarded` for all three parent and target reads: `GrandpaApi_current_set_id`, `GrandpaApi_grandpa_authorities`, and `Grandpa.CurrentSetId`.
- Despite those failures, the old workflow wrote top-level `status: "CAPTURED"` and omitted per-block `state_status`. Therefore run #41176475742 is **not** evidence that historical state was captured; its green conclusion must not be used as a state-availability result.
- Commit `7b6cd4d5322ccc3ea1fc3225b379adfc08ea6c81` corrects the classifier: each parent/target is classified as `STATE_CAPTURED`, `HISTORICAL_STATE_PRUNED`, or `PARTIAL_STATE_UNAVAILABLE`; the top-level status is derived from both. This is an evidence-integrity correction only.
- Added a workflow comment clarifying that job success means artifact capture, while `evidence.status` carries the state result. Commit `cf5b41f86bb69c5e277d52cfbb91d933e4148cdd` was pushed to `work/b3-materios-provenance-evidence` to trigger a fresh run on the corrected workflow. A new run/artifact has **not yet been independently observed** in this checkpoint.

The historical-state blocker remains: public RPC can return historical headers, but its historical runtime/storage state is pruned. The raw snapshot AuxStore remains the required next evidence source. No source snapshot was downloaded or modified; no request was sent to Flux Point; no Materios runtime, GRANDPA, V3, Reveal, chain, or protocol semantics were changed.

**Disposition:** B3-A remains OPEN. The stale-AuxStore hypothesis remains leading but unproven until the original AuxStore bytes are read and decoded. Do not treat the prior green workflow run as proof of historical state capture.


## Agent C — read-only RocksDB API research and limits of version evidence (2026-10-31)

Continued the exact-version AuxStore extraction research without opening or modifying any snapshot.

- The pinned Materios SDK dependency remains `kvdb-rocksdb 0.19.0`. The target crate's exact 0.19.0 source/API could not be retrieved through the available source index during this pass; therefore no 0.19.0 API is claimed as verified.
- The published `kvdb-rocksdb 0.20.0` source documents `DatabaseConfig.secondary: Option<PathBuf>`, opens its secondary via `DB::open_cf_as_secondary`, and maps columns to `col0..`. This is evidence for 0.20.0 only, not proof that the pinned 0.19.0 has the same API or behavior. Do not transplant the 0.20.0 sample into an extractor until 0.19.0 source is confirmed.
- The 0.20.0 implementation also makes clear that `Database::open` chooses primary vs secondary based on configuration; secondary requires a separate path. It is not a generic immutable-image reader. For the pinned version, the safe route remains unselected pending exact source/API verification and identification of the snapshot's actual backend.
- GitHub Actions connector access can inspect known runs/jobs/artifacts but did not expose a general workflow-run listing or dispatch action in this pass. The push-trigger commit `cf5b41f86bb69c5e277d52cfbb91d933e4148cdd` exists, but a fresh run/artifact has not been independently verified. Do not infer a run outcome from the commit alone.
- No snapshot was downloaded, no archive was requested from Flux Point, and no source snapshot or database was opened. No repository runtime code, GRANDPA logic, V3, Reveal, or chain state was changed.

**Next exact gates:** (1) obtain the original snapshot through an already-authorized local source, without contacting Flux Point from this workflow; (2) identify backend and column-family metadata from the supplied copy; (3) verify the exact `kvdb-rocksdb 0.19.0`/underlying RocksDB API against its pinned source; (4) extract only AUX column 8 keys to a separate evidence file, preserving the original snapshot hash. Until then, AuxStore values and the stale-state cause remain unproven.


## Agent C — viable independent RocksDB read-only route identified, source snapshot still absent (2026-10-31)

Further dependency/source research refines the AuxStore extraction route:

- The pinned `kvdb-rocksdb 0.19.0` depends on the Rust `rocksdb 0.21.0` wrapper; this exact dependency pair is corroborated by the published dependency-resolution report for `sc-client-db`/Polkadot SDK. See [try-runtime-cli issue #118](https://github.com/paritytech/try-runtime-cli/issues/118).
- The Rust RocksDB wrapper has an explicit `open_cf_for_read_only` API; its documentation specifies read-only opening of named column families. The wrapper changelog also records earlier support for read-only and secondary access methods, predating 0.21.0. See [RocksDB API docs](https://docs.rs/rocksdb/latest/rocksdb/struct.DBCommon.html) and [wrapper changelog](https://docs.rs/crate/rust-rocksdb/latest/source/CHANGELOG.md).
- This yields a safer independent candidate than relying on `kvdb-rocksdb 0.19.0`'s higher-level `Database::open`: use the exact underlying `rocksdb 0.21.0` API with read-only access, after verifying the snapshot's backend and exact column-family names. This is still a candidate implementation route, not an executed or tested extractor. The current docs URL resolves the latest API documentation; exact 0.21.0 docs/source were not directly retrievable in this pass.
- The AUX column index 8 and keys `grandpa_schema_version`, `grandpa_voters`, and `grandpa_completed_round` remain grounded in the pinned SDK's `sc-client-db` implementation, not inferred from the snapshot.
- No local copy of the 2.39 GB snapshot exists in the current working filesystem. No download or external request was made. No DB was opened, no source snapshot was altered, and no runtime/protocol/V3/Reveal/on-chain state was changed.

**Implementation gate:** only after an authorized local snapshot copy is made available, first hash and inspect its archive manifest/backend metadata; then list the RocksDB column families without mutation, open the copy with the pinned `rocksdb 0.21.0` read-only API, and extract only the three AUX keys from column 8. Preserve original archive/database hashes and emit a separate extraction manifest. If backend or CF layout differs, stop rather than guessing.

The new classifier trigger commit `cf5b41f86bb69c5e277d52cfbb91d933e4148cdd` still has no independently observed workflow run in the available GitHub connector surface; do not claim the rerun passed.


## Agent C — exact pinned RocksDB 0.21.0 read-only API verified (2026-10-31)

The previous implementation gate is narrowed by inspecting the exact upstream Rust wrapper tag `v0.21.0`, not the latest docs:

- GitHub source `rust-rocksdb/rust-rocksdb`, tag `v0.21.0`, file `src/db.rs`, blob `1cd44ac9dcac9f09e3837ca37c9fc6c8dfb36cfa`.
- The pinned wrapper source defines `DBWithThreadMode::open_cf_for_read_only(opts, path, cfs, error_if_log_file_exist)` and `open_cf_descriptors_read_only(opts, path, cfs, error_if_log_file_exist)`; both route through internal `AccessType::ReadOnly`. It also defines `open_for_read_only`. This directly verifies the API exists in exact `rocksdb 0.21.0`.
- The source also defines read methods `get_cf` / `get` (plus iterator APIs), so a separate minimal extractor can open the known AUX CF read-only and retrieve the three known keys without using `sc-client-db::utils::open_database`.
- This confirms the low-level read-only API candidate from the prior note. It does **not** establish the snapshot backend, CF names, whether its RocksDB lock/WAL state permits opening read-only, or that the proposed extractor builds/runs against the snapshot. Do not claim a successful open or extraction.
- The corrected historical-state workflow is present on Agent C branch at blob `054c6d092c06931b51f28122a13e5c1a78673eb1`; it computes per-parent/target `state_status` and derives top-level status. Connector lookup for commit `cf5b41f86bb69c5e277d52cfbb91d933e4148cdd` still returned no PR-triggered workflow runs (the connector wrapper is filtered to PR-triggered runs), so a fresh push-triggered run remains unverified.
- This addendum was committed to `work/immortal-green-closure`; no snapshot, external Flux Point request, chain operation, or runtime/V3/Reveal change was made.

**Next gate:** when an authorized local snapshot copy is supplied, verify its archive hash/backend/CF metadata first, then compile a tiny standalone extractor pinned to `rocksdb = "=0.21.0"` and open only the copy with `open_cf_for_read_only`; stop on any backend/CF mismatch. Keep B3-A OPEN until the AUX bytes and GRANDPA state decode are actually observed.


## 10.31 — Agent A: expanded multi-oracle / market-data reconnaissance (2026-10-31)

This pass broadens the USD/USDM source search beyond Pyth. Exact Mainnet Moneta asset identity remains policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`, asset name `0014df105553444d`.

### DIA — Cardano-native custom-feed candidate
- Official custom-oracle process supports selecting assets, sources/pools, methodology (MAIR/VWAPIR), update frequency, deviation trigger and heartbeat: https://www.diadata.org/docs/guides/how-to-guides/request-a-custom-oracle
- Public MIT/Aiken Cardano integration includes feeder and read-only indexer. Consumers authenticate Pair UTxOs via Pair NFT. Reading an already-published feed on-chain is free; feed updates charge a configurable prepaid ADA protocol fee.
- DIA's 2026-08-10 close-out states only one continuously published Mainnet feed (ARS/USDT) and 16 distinct feeds on Preview. Custom NAV/additional feed requests may be separately negotiated/priced: https://github.com/diadata-org/dia-cardano-oracle/blob/main/docs/milestones/close-out-report.md
- Candidate request: custom USDM/USD feed bound to the exact Moneta asset, with disclosed source venues, methodology, liquidity, outlier controls, heartbeat and total costs. No request submitted.

### Orcfax — direct ADA/USDM feed exists, but is stale
- Mainnet `CER/ADA-USDM/3` exists; source DEX, schedule 1h or 2%, sponsored. Explorer latest displayed fact was ~27 days old; selected fact 2026-06-14: https://explorer.orcfax.io/feeds/CER/ADA-USDM/facts/5cbbb7ee-a232-4f36-844a-5c00ceaeb645
- Mainnet `CER/ADA-USD/3` exists; source CEX, schedule 1h or 1%, sponsored. Explorer latest displayed fact was ~2 months old; selected fact 2026-06-18: https://explorer.orcfax.io/feeds/CER/ADA-USD/facts/11aa4839-0760-4079-8d0d-524e16d8d3eb
- These two legs could mathematically derive USD/USDM only after direction, precision, timestamp compatibility and current liveness are established. They are not currently qualified. No direct USDM/USD feed found. Mainnet explorer's active-feed count does not prove freshness of each feed: https://explorer.orcfax.io/

### Free/public market-data observers (not independent oracle consensus)
- GeckoTerminal documents Cardano token-address pool lookup, pool/trade and simple token-price endpoints; public tier 10 calls/min: https://api.geckoterminal.com/docs/index.html
- DEX Screener documents token/pair APIs; pair lookup limit up to 300 requests/min: https://docs.dexscreener.com/api/reference
- CoinGecko identifies `USDM-2` as Moneta USDM in Cardano ecosystem with matching contract prefix `c48cb...`, distinct from Mountain Protocol USDM: https://www.coingecko.com/en/coins/usdm-2
- CoinGecko contract-address API requires Pro API key; public webpage visibility is not free API entitlement: https://docs.coingecko.com/reference/coins-contract-address
- DeFiLlama tracks Moneta USDM and displayed peg $1 / market cap $13.33m as of 2026-10-28: https://defillama.com/stablecoin/moneta-usdm
- API/dashboard count is not source independence: many may repackage overlapping DEX pools. Count upstream venues and source overlap, not dashboards.
- Exact token pool API responses were not retrievable through current web tools; no current pool count, reserves, volume or depth is asserted.

### Charli3
- Current docs describe a separate Cardano Token Data API with multi-DEX aggregation across 7+ DEXs: https://docs.charli3.io/
- Pull Oracle remains marked “Upgrade Coming Soon”: https://charli3.io/products/pull-oracle
- Developer Portal showed zero active oracle feeds: https://portal.charli3.io/dev/feeds
- Token API remains observational market data, not a qualified signed/on-chain feed.

### Next gates
1. Query GeckoTerminal and DEX Screener with exact policy+asset unit; collect pool address, DEX, reserves, volume, depth, timestamps and token orientation.
2. Inspect Orcfax ADA-USDM and ADA-USD current on-chain facts/archive; verify actual liveness.
3. Obtain DIA technical specification and quote for custom Moneta USDM/USD Cardano feed.
4. Keep Pyth feed 3326 NAV separate from a per-token USD quote.
5. Do not count dashboards derived from the same pools as independent sources.

**Disposition:** no qualified USD/USDM source; Option B remains open; no Oracle consumer/PriceReference/kernel change, EEV approval, R1/Kc certificate, signature, deployment or transaction. V3/Reveal untouched. Detailed research recorded in Issue #37 comment https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6541417739.


## 10.32 — Agent A: exact Moneta USDM pool discovery and Minswap read-only data path (2026-10-31)

- Minswap's official API documentation lists the exact Moneta USDM asset as verified: policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`, asset name `0014df105553444d`, ticker USDM, 6 decimals, `is_verified=true`. API base `https://api-mainnet-prod.minswap.org`; documented endpoints include asset/pool metrics, price/volume/TVL timeseries, `only_verified` and protocol filters: https://docs.minswap.org/developer/minswap-apis
- Official Minswap SDK documents pool price feed and historical pool data, with Blockfrost, self-hosted Minswap Syncer and Maestro adapters: https://github.com/minswap/sdk. This is a first-party read-only path, but remains the same upstream DEX venue as other Minswap indexers.
- GeckoTerminal ADA/USDM Minswap V2 pool page crawled 2026-10-31 reports pool ID `f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171`, reserves 1,920,379.61 ADA / 372,524.42 USDM, liquidity ~$744,859.75, 24h volume ~$71,110.66, 164 transactions and quote ~0.1927 USDM/ADA. Page: https://www.geckoterminal.com/cardano/pools/f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171
- This is a meaningful exact-token market observation and a possible ADA/USD × ADA/USDM route. GeckoTerminal's displayed ADA USD valuation is not an independent primary ADA/USD source; no USD/USDM is qualified from these data alone.
- Additional observations: MIN/USDM Minswap V2 page crawled today (~$190k liquidity, ~$2.3k 24h volume); USDCx/USDM page is older (~1 month; snapshot ~$176.8k liquidity, ~$8.8k volume); USDA/USDM page shows only ~$890 liquidity and ~$46 volume / 1 transaction. Do not treat older/tiny pools as current or reference-grade.
- Correction: DanoNight tracker explicitly says `Last updated 2026-08-09`; its displayed USDM $1.001, reserve balances and deepest-ADA-pool estimates are historical, not current 2026-10-31 data. Methodology lead only (deepest ADA pool, then CoinGecko ADA/USD): https://danonight.com/cardano/stablecoins
- **Next safe work:** read-only collector using Minswap API/SDK for exact policy+asset match, V1/V2/Stable pools, IDs, reserves, token orientation, fees, price/volume/TVL time series; compare against direct on-chain UTxOs. Separate venue independence from API/indexer independence. For a two-leg derivation, obtain independent ADA/USD and aligned timestamps.
- Issue #37 detailed record: https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6542044437
- No API collector code, Oracle consumer, PriceReference, economic kernel, EEV approval, R1/Kc certificate, wallet signature, deployment or transaction was changed/executed. Option B remains OPEN/UNQUALIFIED; V3/Reveal untouched.



## 10.33 — Agent A: primo collector Minswap USDM read-only aggiunto (2026-10-31)

- Aggiunto `scripts/collectMinswapUsdmReadOnly.mjs` su `work/immortal-green-closure`; commit iniziale `cf19730c30f3c5883cd5dc598e6e3004ed5bf5fb`, seguito da correzione `48b057e018092d296e7c0d2ca82ae61ffeb3c754`.
- Il collector usa esclusivamente API pubbliche Minswap: GET asset catalog e pool metrics query POST, poi GET per metrics e serie storiche price/volume/TVL dei pool trovati. Nessun endpoint di transazione, wallet, firma o refresh.
- Identità vincolante: policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad` + asset name `0014df105553444d`; verifica inoltre decimals=6. Il ticker USDM è solo metadata, mai criterio di inclusione.
- Interroga separatamente `Minswap`, `MinswapV2` e `MinswapStable`; la ricerca pool non limita i counterparties a token verificati, quindi il filtro esatto USDM viene applicato localmente e non perde pool solo perché l'altro asset non è verificato.
- Registra timestamp di raccolta, HTTP Date, URL/metodo/status, SHA-256 del body grezzo, cursor/pagine, asset orientation, LP asset ID, metriche e serie storiche. Output predefinito: `audit/oracles/minswap-usdm-readonly.json`; nessun dato viene inviato al protocollo.
- Limiti espliciti nell'artefatto: API/indexer ≠ osservazione diretta UTxO; Minswap API e GeckoTerminal non sono venue indipendenti; metriche in USD dipendono dalla metodologia di valorizzazione Minswap e non sono feed indipendente USD/USDM.
- **Stato verifica:** codice aggiunto ma non ancora eseguito né testato su una macchina/rete. La lettura API live non è stata ottenuta dagli strumenti di questa sessione; non dichiarare pool count, liveness o raccolta riuscita. Il collector non implementa ancora il confronto con UTxO on-chain diretti.
- Prossimo gate: eseguire in ambiente repo con Node compatibile, ispezionare l'output e le risposte/limitazioni API; poi aggiungere una seconda osservazione on-chain read-only via provider già autorizzato e confrontare pool ID, reserve quantities e block/slot. Nessuna credenziale va committata.
- **Disposition invariata:** nessuna fonte USD/USDM qualificata; Option B OPEN/UNQUALIFIED; nessun EEV approval, R1/Kc certificate, Oracle consumer, PriceReference o kernel change; nessuna firma, deploy o transazione; V3/Reveal intatti.


## 10.34 — Agent A: Minswap V2 UTxO observer (2026-10-31)

- Added `scripts/observeMinswapV2UsdmUtxosReadOnly.mjs` on `work/immortal-green-closure`.
- Latest source commit: `cb24f4649f133c6b4d1cb724385840023348de51`.
- The script queries Koios Mainnet address UTxOs at the official Minswap V2 pool address, filters the exact USDM policy and asset name, and records raw quantities, datum bytes/hash, UTxO reference, HTTP Date, response SHA-256 and transaction block/slot context when available.
- Candidate discovery only: pool NFT/authentication identity and datum/reserve consistency are not yet decoded or qualified. V1 and StableSwap scans remain open.
- Not executed in a network-enabled runtime. No live candidate count, UTxO, slot or reserve is claimed. No reconciliation result exists yet.
- No wallet, signature, transaction, refresh, deployment, chain write, economic rule, Kernel, Oracle consumer, EEV/R1/Kc, V3, Reveal or Materios change. Option B remains UNQUALIFIED.


## 10.35 — Agent A: hardening Minswap V2 UTxO observation (2026-10-31)

- Source review found the first Koios `address_utxos` request did not paginate explicitly; a single response could be incomplete.
- Commit `a5d78cbf59d380c99ff93bace2680465ab99093c` adds explicit PostgREST `limit=1000` / `offset` pagination, per-page raw-body evidence and metadata, and a fail-closed 20-page safety cap.
- Commit `71a94a06aee644a00493cd73b2ac23e4e0cd5d1e` validates every returned UTxO's exact address and payment credential against the published Minswap V2 validator hash before filtering USDM candidates.
- Official V2 source review confirms PoolDatum asset pair and reserve fields; pool validation checks derived LP asset, pool authentication NFT, and reserve consistency with output Value (including ADA min-pool-ADA treatment). No datum decoder or Pool NFT authentication implementation has been added yet.
- Source changes are not runtime verification. The observer remains unexecuted against live Koios in this session; no live UTxO count, reserve, slot or reconciliation result is claimed. V1 and StableSwap remain separate.
- Issue #37 update: https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6542230028
- Option B remains UNQUALIFIED; no price/oracle consumer, EEV, R1/Kc, Kernel, V3, Reveal, Materios, wallet, signature, transaction, refresh, deployment or chain write changed.


## 10.36 — Agent A: exact Minswap V2 Pool NFT identity added (2026-10-31)

- Official Minswap V2 `deployed/mainnet/script.json` identifies `poolAuthenAsset`: policy `f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c`, asset name hex `4d5350` (`MSP`). The deployed script file also identifies the same policy as `lpPolicyId`.
- Commit `fdecdd300e83ae1b60726d92b56c34e7040d2764` adds this exact NFT identity to the read-only observer and records raw quantity plus an exact-quantity-1 boolean for each USDM UTxO candidate.
- This is a pool-authentication signal, not full qualification. Datum decoding, pair validation, derived LP asset validation and reserve-vs-Value reconciliation remain open.
- No live scan or runtime test in this session; no current pool count, reserve, price or match claimed.
- Issue #37 update: https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6542234509
- Option B remains UNQUALIFIED; no protocol/economic/Oracle/EEV/R1-Kc/Kernel/V3/Reveal/Materios changes, wallet, signature, transaction, refresh, deployment or chain write.


## 10.37 — Agent A: reconciliation specification aligned with observer hardening (2026-10-31)

- Updated `docs/COORDINATION/MINSWAP_USDM_READONLY_RECONCILIATION.md` in commit `96fad86952ba9ad0ec84e21b1a829761027a8723`.
- The spec now records explicit Koios paging/fail-closed behavior, V2 payment-credential verification, and the exact deployed Pool authentication NFT identity from official `deployed/mainnet/script.json`.
- Remaining critical gate is still contract-bound datum decoding plus pool pair / LP identity / reserve-vs-Value validation, followed by live read-only execution and evidence capture. No decoder or live execution is claimed.
- Option B remains UNQUALIFIED; no protocol/economic/Oracle/EEV/R1-Kc/Kernel/V3/Reveal/Materios changes or ledger actions.


## 10.38 — Agent A: Minswap V2 PoolDatum decoding and reserve checks (2026-10-31)

- Added a strict decoder for the official 10-field V2 `PoolDatum` JSON constructor and checks for the configured pool batching Script credential, canonical asset ordering, exact USDM pair membership, Pool NFT quantity 1, derived LP asset identity/presence, positive liquidity/reserves, exact allowed Value composition, and reserve-vs-Value consistency.
- The reserve check uses the official V2 `min_pool_ada = 4,500,000` lovelace adjustment when ADA is one of the pair assets.
- Relevant commits: `ff427eb` (datum decoder), `e5a08bb` (exact Value composition/reserve checks), `d756d2c` (integer parser correction), `7ff55f5` (batching stake credential validation).
- Official source basis: V2 `types.ak`, `utils.ak`, `pool_validation.ak`, `pool_validator.ak`, and deployed Mainnet params/script files.
- **Not runtime-verified:** no Node fixture/test run and no live Koios query in this session. Koios `inline_datum.value` representation must be checked against captured fixtures; unsupported/missing data stays unqualified. No pool count/reserve/API-chain match is claimed.
- Issue #37 update: https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6542398466
- Option B remains UNQUALIFIED. No wallet, signature, transaction, refresh, deployment, chain write, Oracle consumer, EEV/R1-Kc, Kernel, V3, Reveal or Materios change.


## 10.39 Agent A — Minswap V2 decoder fixture harness (2026-10-31)

- Pure Minswap V2 decoder and candidate validator are now exported from `scripts/observeMinswapV2UsdmUtxosReadOnly.mjs`; a direct-execution guard prevents import-time network activity.
- Added `scripts/observeMinswapV2UsdmUtxosReadOnly.test.mjs` with synthetic fixtures covering the 10-field PoolDatum shape, exact-USDM candidate, batching stake credential, Pool NFT quantity, derived LP asset, reserve/Value mismatch, unexpected assets and missing USDM.
- Official-source cross-check: Minswap V2 `PoolDatum` has ten fields; `min_pool_ada=4,500,000`; LP asset name derivation uses SHA3-256; deployed Mainnet script.json confirms the pool batching Script hash 1eae…; params.json separately confirms the pool address Key stake hash 5256…. Official source paths are documented in `docs/COORDINATION/MINSWAP_USDM_READONLY_RECONCILIATION.md`.
- Added isolated GitHub Actions workflow `.github/workflows/minswap-v2-observer-tests.yml` to run only the synthetic decoder suite on relevant pushes/PRs; workflow commit `58188c06c4dc26a9707699bd6933f5502da3e9aa`. Verified green: Actions run 41203141441, job decoder-fixtures, commit 58188c06c4dc26a9707699bd6933f5502da3e9aa; logs show all 9/9 tests passed (Vitest 1.6.1, Node 22.23.4; suite duration 414 ms).
- **Evidence limit:** fixture suite is committed but not yet evidenced as executed; fixtures are synthetic, not a captured Koios response. Koios `inline_datum.value` compatibility and any live UTxO/API reconciliation remain unverified.
- Current commits: observer export/guard `edb75e3c2a524eb34c7deb04323de501cface042`; synthetic test file `a77a96c2268d1131bf7e4525aacc6fe2e5ac8083`, test correction `3de91c44ccead5ad4b4125c1ef24e3c4be61cd35`; reconciliation spec `d29da344907b5344e9922817fa62dd66f621c90d`.
- Scope unchanged: Agent A only. No V3, Reveal, Materios, Kernel, Oracle consumer, EEV, R1/Kc, wallet, deployment, transaction, oracle refresh or chain-write changes. Option B remains unqualified.


## 10.40 Agent A — Minswap V2 synthetic decoder CI result (2026-10-31)

- GitHub Actions run **41203141441** for workflow .github/workflows/minswap-v2-observer-tests.yml completed with conclusion **success**.
- Job decoder-fixtures: checkout, Node 22 setup, npm ci, and focused Vitest command all succeeded.
- Exact source commit tested: 58188c06c4dc26a9707699bd6933f5502da3e9aa.
- Logs confirm **1 test file passed; 9 tests passed**, Vitest 1.6.1, Node 22.23.4, suite duration 414 ms.
- This is synthetic-fixture unit evidence only. No captured Koios Mainnet datum, real UTxO candidate, reserve snapshot, market quote, USD/USDM peg, oracle qualification, EEV qualification or deployment approval is implied.
- Next gate: capture a real read-only Koios response (including inline datum bytes/value), verify its actual JSON shape against the decoder, then reconcile against Minswap API observations. Keep source and market evidence distinct.


## 10.41 Agent A — Koios Mainnet read-only acquisition and timeout (2026-10-31)

- The first read-only Mainnet observer job, Actions run 41203284220, received HTTP 504 from Koios `POST /address_utxos?limit=1000&offset=0` after approximately 121 seconds. Error body SHA-256: `bef140a1a96994029153dca8c00b1750b9a5a764fb9db2dc68d7bb40e8a29e8a`; no UTxO rows, datum or artifact were produced.
- Classification: `SOURCE_UNAVAILABLE` (provider timeout), not zero pool candidates and not a decoder failure.
- Observer updated at commit `0d916ec531b47cc5116aa34f2379bc607679b8d8` to use exact-asset `POST /asset_utxos` with `_asset_list: [[policyId, assetNameHex]]`, `_extended: true`, and PostgREST address equality filter for the official Minswap V2 address. This avoids scanning every UTxO at the shared validator address.
- Reconciliation specification records the failed attempt and targeted retry method at commit `3cf57979ab7da8107c6adc3000bcb4600902ad7a`.
- A new push-triggered run is expected for the exact-asset query. Do not infer success until its run, job logs and evidence artifact are inspected. No chain writes, wallet operations, oracle refresh, or economic qualification.


## 10.42 Agent A — Real Koios datum fixture and credential correction (2026-10-31)

- The targeted exact-USDM/address-filtered Koios Mainnet observer succeeded in Actions run 41203478980 and returned 31 UTxO candidates. Artifact ID 13043376113; artifact ZIP digest `2c4ac5bc51cb1db194bc3e388d0b06c555cd003f3b12ff53d9ede58dfd74ffb6`.
- The actual datum revealed `pool_batching_stake_credential = Inline(ScriptCredential(hash))`, constructor path `Constr 0 -> Constr 1 -> bytes`, hash `1eae96baf29e27682ea3f815aba361a0c6059d45e4bfbe95bbd2f44a`.
- Prior decoder incorrectly treated this as VerificationKeyCredential and compared it to `52563c…`. Official deployment files distinguish the two: `deployed/mainnet/script.json` says `poolBatchingCredential` is Script `1eae…`; `deployed/mainnet/params.json` says `poolStakeCredential` is Key `5256…`. The captured output stake address decodes to Key `5256…`.
- Observer corrected at `2677b299dc8c01b07d1fbaef5857b15894c4986d`; synthetic fixture updated at `8e535af40be1310a6bd257c12a6e28b70806c7b2`.
- Preserved the first real Koios datum, raw CBOR, UTxO Value/assets, datum hash, tx/block context and response provenance in `scripts/fixtures/minswap-v2-usdm-mainnet-2026-10-31.json` (commit `5a0d20505a51a84d116dfcb68f9df09d5da509aa`). Added an end-to-end real-fixture assertion to the Vitest suite (commit `6ce1eaa89156b75d9a7d857643c5d56c94e6bbe8`).
- The corrected real-fixture test has not yet run. The latest push should trigger the focused CI and read-only observer; inspect both before classifying any candidates. 31 is an acquisition count, not a count of valid pools.
- Scope remains Agent A only. No V3, Reveal, Materios, Kernel, Oracle consumer, EEV, R1/Kc, wallet, deployment, transaction, or chain-write changes.


## 10.43 Agent A — Minswap V2 retained fee accounting correction (2026-10-31)

- Review of official `minswap/minswap-dex-v2/lib/amm_dex_v2/order_validation.ak` shows datum reserves and Value reserves are intentionally distinct. In successful swaps, datum reserve increments by `swap_amount - earned_fee_in`, while Value reserve increments by full `swap_amount`; the difference retains earned fees in the UTxO Value.
- The previous strict equality check was incorrect. Observer updated at `d51859c506d7384754b2f17e9f2bb237bf530548` to require Value reserve >= datum reserve, report the surplus separately, and fail closed only when Value is below the datum reserve. ADA-pair lovelace now uses the analogous lower bound; non-ADA pairs still require exact min pool ADA.
- Tests expanded at `b7422cfa3b34a6a9e50263db249fd14bf95fff5e` to cover retained fee surplus, under-reserved Value and ADA-pair fee surplus. The real captured Mainnet datum fixture remains included.
- The earlier 7 MATCH / 24 UNQUALIFIED classification from run 41203746686 used the superseded exact-equality rule and is withdrawn. Await run 41204050705 (latest test suite) and the corresponding read-only Mainnet observer result before stating current counts.
- No economic kernel, DApp, V3, Reveal, Materios, Oracle consumer, EEV or R1/Kc semantics were changed.


## 10.44 Agent A — First 31-pool Mainnet V2 structural reconciliation (2026-10-31)

- Actions run 41204050705 completed successfully. Focused Vitest suite: **12/12 passed**, including the captured real Koios datum fixture, retained fee surplus and ADA-pair lower-bound cases.
- Read-only Koios observer: **31 exact-USDM UTxOs** at the official Minswap V2 pool address, **31 transaction contexts**, **31 MATCH / 0 UNQUALIFIED**, zero validation reasons. This corrects the earlier 7/31 result, which used the superseded equality assumption and is withdrawn.
- Evidence artifact ID `13043641385`, ZIP SHA-256 `38ee9388333e85a1765493cbc879b48bca2a42e9758534893e4897eac86acacc`; JSON SHA-256 `db5b109eb4638eac10434f5b3d120b57c526d55f2d4f7de837c8aea1434ecbcb`. Run URL: https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41204050705
- Scope of MATCH is structural pool identity + datum/Value consistency under Minswap's fee-retention semantics. It is not an oracle price, USDM/USD peg, independent market venue, EEV evidence or deployment approval. Minswap API collection and cross-indexer corroboration remain open.
- Per-candidate qualification label clarified at `3c500e192389c16c87eee2e3bb3db9534876f498` to say `POOL_IDENTITY_AND_RESERVE_STRUCTURE_MATCH_NOT_ORACLE_QUALIFICATION`; the rerun triggered by this change is pending.


## 10.45 Agent A — confirmed structural census and Minswap API collection gate (2026-10-31)

- Run 41204297344 (source commit `3c500e192389c16c87eee2e3bb3db9534876f498`) succeeded: 12 tests passed; 31 current exact-USDM UTxOs, 31 transaction contexts, 31 MATCH, 0 reasons, complete one-page pagination. All 31 qualification labels correctly state structural pool match only, not oracle qualification.
- Artifact ID `13043476858`, ZIP digest `57ce6478ecedec6fb522271eedba921ed3a5c62904a567cb94c55fe671674af0`; extracted JSON digest `76b74901b312a4754673dacfa7f2d787bc0baeb3c94fe7259f88242f7370a8c8`.
- Minswap API collector updated at `b087bc8d2cc9e9f84d5c586f481f7a25a0379380` to key records by `protocol + LP asset id`, preventing a duplicate LP identity across protocol families from silently overwriting another result.
- Workflow now includes a separate read-only Minswap API collection job, commit `d34f2a61f5e7651324317acdfbfb7cd63f420b48`; no transaction endpoints, signing or chain writes. First collection result pending.
- Market-source qualification remains open. Minswap API and GeckoTerminal are not independent market venues; cross-indexer comparison and an independent venue/oracle remain separate requirements.


## 10.46 Agent A — Minswap API census and automated cross-source gate (2026-10-31)

- Initial full-history API collection hit HTTP 429 at the first per-pool history request; response body said retry in one minute. No artifact was produced. This is API rate limiting, not source absence.
- Collector changed at `e39f977b0ad75c12761b50966ae6e2264e4ed509`: current pool metrics are collected by default; per-pool history is opt-in via `--with-history`. The earlier fix `b087bc8d2cc9e9f84d5c586f481f7a25a0379380` preserves protocol family in pool identity keys.
- Metrics-only collection succeeded in run 41204489438: exact verified USDM (decimals 6); 43 total pools (31 MinswapV2, 8 Minswap V1, 4 Stable). History deliberately deferred. API artifact ID `13044046954`, ZIP digest `f716856f91f59b521accc4749a25673ef067037fbdf57af6fc107c7bd6346a0e`.
- Manual same-run artifact comparison against Koios found 31/31 MinswapV2 LP identity matches and 31/31 exact unordered pair matches. This is not a price or oracle qualification.
- Added deterministic reconciler `scripts/reconcileMinswapV2UsdmApiOnchainReadOnly.mjs` (commit `13662f56fdf44834bb76967e73e5baba7bb2295a`) and same-run dependent workflow job (commit `d4283fe12e25d315165c88379e9db99d5d372564`). Automated result pending.


## 10.47 Agent A — automated 31/31 Minswap API / Koios reconciliation (2026-10-31)

- Same-run automated workflow 41204657669 succeeded on source commit `d4283fe12e25d315165c88379e9db99d5d372564`. The dependent reconciler downloaded the API and Koios artifacts and compared exact LP asset IDs plus unordered asset-pair identity.
- Summary: Koios candidates 31; structurally matched 31; API pools all protocols 43; API MinswapV2 31; matched 31; on-chain only 0; API only 0; pair mismatch 0; unqualified 0; duplicate API LP IDs 0.
- Reconciliation artifact ID `13044411182`, ZIP digest `b0c2d9b3c93f9e4c6098eb7c7303ad080ed30d77fbac7cc959617ec87ebfc339`; JSON digest `c01872590804b698dd5ad6adb1328809ea4139467320bdc5abf50a4bbbc07c80`.
- Source windows: API 13:14:27.946Z–13:14:28.758Z; Koios 13:14:29.034Z–13:15:46.121Z. Near-aligned but not atomic. Raw response hashes and times are retained in source artifacts.
- This closes the first V2 pool-set/asset-pair identity reconciliation. It does not qualify API USD metrics, price/peg, independent venue/oracle, EEV or deployment. Minswap API + GeckoTerminal are one DEX venue; Koios is an indexer view of the same ledger, not another market venue. Historical price/volume series remain deferred due rate limiting.


## 10.47 Agent A — SuperCardano independent indexer path (2026-10-31)

- Researched public Cardano market-data paths. SuperCardano exposes unauthenticated exact-unit token/pool and settled-trade endpoints. Its published methodology says pool states are read from its own Cardano node after 15-block settlement; it currently uses its own decoded Minswap V2 pool reader for token price, with WingRiders V2 and Dano Finance readers still being qualified. Its USD display uses DexHunter ADA/USD, so do not count its USD number as independent.
- A direct public endpoint discovery read for exact Moneta USDM unit surfaced multiple venues in the pool list: Minswap V1/V2, WingRiders V2, SundaeSwap V3, VyFi, MuesliSwap, CSWAP, Splash and Danogo CLMM; trade rows also showed Minswap V2, WingRiders V2 and Danogo CLMM. These are discovery observations; pool freshness and venue decoder coverage require artifact review.
- Added `scripts/collectSuperCardanoUsdmReadOnly.mjs` at `a895f3c45d0deb6437e6c015181cac26c07cd658`, capturing exact-asset token/pool and trade JSON, raw response hashes, response headers, source metadata, per-venue counts, and explicit caveats. Added CI job at `7551db57f37b4ddb7d9c395ae2932c52c48485d2` (read-only GET only). First CI result pending.
- Added source independence taxonomy and cost/access classification to `docs/COORDINATION/MINSWAP_USDM_READONLY_RECONCILIATION.md` at `e628500f7260bf1f0608e95951e79c450d3b4172`.
- Other candidates recorded: DanoNight own db-sync daily scan (public page, CoinGecko ADA/USD dependency); GeroWallet free UI but Nexus developer market data paid add-on; DexHunter partner API requires key and is an aggregator, not a venue; Cardanoscan free API key supports chain data but not DEX market pricing.
- Multi-source must be assessed across venue, indexer, market methodology, USD reference and issuer reserve dimensions. No API count alone qualifies an oracle quorum.


## 10.48 Agent A — SuperCardano live artifact and venue/trade coverage (2026-10-31)

- SuperCardano exact-USDM collector succeeded in Actions run 41221859296, source block 14,140,510, source `stale=false`. Artifact ID `13050446694`, ZIP SHA-256 `4586f94d439f43d9ee71554abcd397bce0a40e6ee2104ab6e85327a5393e14c2`; extracted JSON SHA-256 `b3c220e155950608fbc34e1b600054e9b72c6b8bfd712fe0ee0d41afed3b59d2`.
- 81 USDM pool records across 9 venues: Minswap V2 31, Danogo CLMM 12, Sundae V3 10, Minswap V1 8, WingRiders V2 6, VyFi 5, Splash 5, MuesliSwap 3, CSWAP 1. These include historical/old rows, not 81 live pools. Minswap V2 freshness relative to source as-of: 5 under 24h, 5 from 1–7d, 21 over 7d.
- 50 latest trade rows: Minswap V2 32, Danogo CLMM 13, WingRiders V2 5; all Level B. Flags: converted 22, multiHop 9, batchImpact 2. Token price is ADA-denominated; source methodology says own price surface currently reads Minswap V2, and USD conversion uses DexHunter ADA/USD.
- Raw token response SHA-256 `e6052504d1a3b70e98d583ec9ea1bfb1797da990d6ed012542305d74327fc413`; raw trades response SHA-256 `23d71b9d3856c52f32b45a5e8429abcfabe6f9986472f6c94e5a847b280f4c52`.
- Reconciler extended to compare SuperCardano Minswap V2 pool keys, pair order and reserves against Koios candidates. First run 41221859296 failed only due a missing comma syntax error in the reconciler limitations array; raw source artifacts downloaded successfully. Syntax fixed at `16cd0484482ec61a3ac24e62dafbab8847ce83f1`; next full push run 41221976475 is in progress to produce corrected multi-indexer comparison.
- Workflow conditions changed to run same-snapshot read-only acquisition jobs on every relevant push (the previous `head_commit.modified` conditional was observed to skip required jobs). No wallet/signing/transactions/chain writes.


## 10.49 Agent A — three-source Minswap V2 structural reconciliation green (2026-10-31)

- Corrected Actions run **41221976475** succeeded on commit `16cd0484482ec61a3ac24e62dafbab8847ce83f1`. Decoder suite: **12/12 tests passed** (370 ms). Koios, Minswap API and SuperCardano acquisition jobs all succeeded; dependent reconciler succeeded.
- Koios: 31 exact-USDM UTxOs at official Minswap V2 address, all structural MATCH.
- Minswap API: 31 V2 pool records (43 across V1/V2/Stable total).
- SuperCardano: 31 Minswap V2 pool records within 81 USDM pool records across 9 venue families.
- Cross-indexer comparison: **31/31 exact pool identity + asset pair + datum reserve matches** between Koios PoolDatum/UTxO and SuperCardano; 0 onchain-only, 0 SuperCardano-only, 0 pair mismatches, 0 reserve mismatches, 0 duplicate IDs. Minswap API vs Koios remains 31/31 exact LP identity + pair matches.
- Reconciliation artifact ID `13050372165`, ZIP SHA-256 `37fb204a00072b38364b2e44662cdd6b7b20d0d7e47d12b166f0624d764bd950`, JSON SHA-256 `92e2a20265ce6db8331db61ee2eb959e41fdad086cc527977be8755cbe3a4c07`.
- Same-run evidence artifacts: Koios `13050436975` / digest `74bba8e5846e3c1936bff777d0664703e917c07a283b85b8d17d3f36ba9eb09f`; Minswap API `13049768317` / digest `afb00e2af4e6103862f372d7f847546e0b43e9b7a36762a68c0f453e466d6b69`; SuperCardano `13050850055` / digest `147a61eefffab293dc52879a94456595ea517be1c966c1575dc02823571e4b5c`.
- Interpretation: structural pool identity/reserve serialization is corroborated by an independent on-chain indexer. This is not an independent venue, USD price source, USDM/USD peg, issuer reserve, or oracle quorum. The 81 SuperCardano pool rows include historical records; per-venue freshness is mandatory. Other DEX pool contracts still need independent identity/decoder gates.
- Reconciliation spec updated at `c8a310b83b70999a68c63dced4978e89d24f926a`.


## 10.50 Agent A — Danogo CLMM official pool identity gate (2026-10-31)

- Official public SDK `dano-finance/clmm-sdk` inspected. Mainnet pool NFT policy / pool script hash: `d8b69fc53637bcfadbc4469083f706bc293f4d9d2296646c5ca167bb`; pool script reference UTxO `64d111b957e7d7848ffdde5149aa77fa4090a7fa1ad0ac108067900614848501#0`; protocol config reference UTxO `2cafd7c92f7093e5229af274be83dea660b0590b4174bbed79ba662b44fbd1ee#0`.
- Official SDK's `PoolDatum` has 12 fields including pair, LP fee, platform fees, total swap fee, sqrt lower/upper price bounds, min changes, circulating LP and last withdraw epoch. Its SDK discovers pool outputs via unique NFT under the pool script policy and quantity 1, then decodes datum and Value reserves.
- Added `scripts/observeDanogoClmmUsdmReadOnly.mjs` at `c3f0c4cd643d3f21c19bfe5af4f9024973e7c7b1`; it takes exact Danogo pool NFT IDs from same-run SuperCardano, queries Koios `/asset_utxos`, validates NFT quantity/cardinality, datum schema, exact USDM pair and raw Value reserve match. It records credential, datum CBOR/hash and block/time; no wallet/signing/transactions/chain writes.
- Added CI job `read-only-danogo-clmm-observation` at workflow commit `437881f6150733531519a3809725eb285b1ae722`, dependent on the same-run SuperCardano discovery artifact. First run pending.
- Interpretation boundary: Danogo is a separate venue; its CLMM price cannot be inferred from a simple reserve ratio. Need decode current sqrt range, active liquidity and fee math before using it for executable/marginal price evidence. No USD/peg/oracle qualification.


## 10.51 Agent A — Danogo CLMM 12/12 structural match and DanoNight triangulation (2026-10-31)

- Danogo observer corrected and passed in run **41222679601**, source commit `774f5fed4d49452f5bcc288412178db7dfd25975`. Syntax-check gate for all read-only observers/reconcilers passed; Minswap V2 decoder suite also passed 12/12.
- Danogo result: 12/12 discovered pool NFTs have exactly one current Koios UTxO; 12/12 payment credentials match official pool script hash `d8b69f…`; 12/12 inline datums decode under official 12-field schema; 12/12 exact USDM pair; 12/12 active reserve pairs match SuperCardano after official SDK fee semantics. Zero missing/cardinality/datum/active-reserve mismatches.
- First Danogo attempt run 41222319647 had wrong tokenX/Y decoder (SDK uses two-element Plutus lists, not constructors). Second attempt run 41222462250 compared raw Value with active reserves and produced 11 false mismatches. Official SDK `calculateConcentratedPoolSwap` defines active reserves as Value minus platformFeeX/Y and, for tokenX=ADA, minus 3 ADA + totalSwapFee. Observer now follows that exact convention.
- Danogo artifact ID `13050861231`, ZIP digest `7f7cafed23f1e7dfa738fbe2eea2bfd5efabce6390986fbbe50620e673b556e0`, JSON digest `1f1f6af61a272fa6cdec40e22788cbce2f426a6c76215667e10711e96d66d0d4`.
- Three ADA-paired pools have `lastWithdrawEpoch` behind current epoch. The SDK can add a staking reward amount when a staking reference UTxO is supplied; observer does not fetch it, so reward amount is explicitly zero-assumed and the three are flagged. Do not use as executable CLMM quotes. Pool freshness: 5 under 24h, 2 from 1–7d, 5 over 7d; old pool rows are not automatically active liquidity.
- DanoNight public db-sync tracker research: last updated 2026-10-30; USDM 5.1600 ADA/token, indicative USD $0.991 and +0.17% vs stablecoin basket median. It uses own `cardano-db-sync` and deepest ADA pool across Minswap/WingRiders, but USD conversion uses CoinGecko ADA/USD and daily cadence. This is a separate indexer/market calculation, not a separate DEX venue or independent USD source. SuperCardano's 2026-10-31 Minswap V2 ADA quote 5.094192535… is not directly comparable (different as-of and venue selection); no averaging or depeg claim.
- Docs updated at `6fc1b2ccbcc50fb812a9f2e796081fe87e7022ca`.
