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
