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
