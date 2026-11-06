# IMMORTAL / PRE-RICH — Repo-wide Coordination Baseline

**Date:** 2026-11-06  
**Classification:** coordination snapshot only; not a normative specification, deployment approval, security acceptance, merge authorization, or on-chain authorization.
**Coordination start ref:** `work/immortal-green-closure` @ `6c0014996e80b3421ca6a4cb6c237dc497413664` (verified from PR #19 before this documentation-only baseline was committed).

## 1. Purpose and precedence

This file is the current operating baseline for role ownership, branch lanes, path boundaries, dependencies, and evidence rules. It supplements the historical [repo-wide branch and evidence checkpoint](REPO-WIDE-BRANCH-CHECKPOINT-2026-10-21.md) and the [PRE-RICH Control Center](https://app.notion.com/p/3d9c4454d6d581e680d5e5d3f3a9df79). For assignments and write coordination, this 2026-11-06 baseline supersedes older coordination snapshots only where it explicitly changes them. Technical and normative source documents remain authoritative for protocol meaning.

Roles A–E are coordination responsibilities, not protocol agents, principals, signers, or economic authorities. An owner role is not proof of task acceptance; acceptance must be evidenced separately in the relevant issue/task record.

## 2. Verified repository and evidence snapshot

- Repository: `LiberoNuvola/Immortal-Protocol`; default branch `main`.
- At the coordination start, PR #19 was OPEN, not merged, and `mergeable=false`; its head was `6c0014996e80b3421ca6a4cb6c237dc497413664`, base `main` at `8c6873e1d50115659727c82c294426b9a946f1fa`, with 648 changed files and 3,449 commits reported by GitHub. Do not merge PR #19 wholesale; promote only narrowly reviewed, independently evidenced slices.
- The green branch is a shared A/B integration lane, not a release branch. `main` remains release-only. The B3 lane is separate. The Arb Agent is a sibling repository, not a sixth IMMORTAL branch.
- The Haskell Semantic Conformance run #42167342107 completed SUCCESS on exact commit `120ebeef3706592a42c8061c8eaec05b69fd4a1d`. This is valid evidence for that exact SHA and its source/test scope, not a blanket certificate for later branch heads.
- The compiled MintPolicy B1 physical-Value CEK checks on that run passed five cases: unchanged ADA/native-asset basket accepted; changed lovelace, changed native-asset quantity, added asset, and removed asset rejected. The fixture isolates the physical-value guard; it is not proof of positive-price sale qualification or phase-1 ledger validity.
- The expanded B-R1 scaffold suite passed 17 assertions on exact test commit `b27cbbb1e2c91e2bf4252a788ea26b50e2440e80` in run #42175554477. This validates the typed deterministic-only scaffold and its negative cases; it does not wire B-R1 into `PreRichEconomicAdmission` and does not issue a deployment-bound `K_c`/QNE certificate.
- QNE/S0 runs #42176338793 and #42177503315 were reported successful in the 6 November checkpoint. They are bounded counterexample/test evidence, not a complete viability or `K_c` certificate.
- The ProtectedCapital live census is bounded read-only evidence. Koios/Ogmios observed a concordant B1 Pool output at different chain tips; the report explicitly does not certify PA1–PA7, source exhaustiveness, full ProtectedCapital, R1/Kc, or Issue authorization.
- The observed Oracle State singleton is live but its quote is stale (about 28.5 days old against a one-hour configured maximum); `externalPriceSourceVerified=false`. Charli3 Preprod USDM/USD and ADA/USD records observed on 6 November are expired and do not qualify Option B.
- The latest verified PR #19 head at coordination start is not the SHA of every passing workflow above. No cross-SHA aggregation may be described as a single cumulative green certification.

## 3. Agent role register

### Agent A — Economy, sources, EEV, ProtectedCapital inputs, expiry, Treasury

**Primary objective:** unblock the first owner-purchased Cardano Preprod ticket. A retains the existing Agent A mandate; Issue #41 is an additional bounded Treasury-observation work package, not a transfer of Treasury ownership.

- **#37 — USD/USDM and first-Issue gates (P0):** pursue the adopted Option B without assuming parity; qualify a real source or separately governed exact derivation; freeze the versioned valuation contract before changing Oracle interfaces; re-observe and requalify the exact Pool snapshot; produce current EV1–EV7 and deployment-bound approval; support the same-candidate authoritative witness. Current disposition: USD/USDM source NOT QUALIFIED, Oracle stale/untrusted for price, current deployment approval NOT ESTABLISHED, `K_c`/R1 certificate MISSING, first real Issue BLOCKED.
- **ProtectedCapital PA1–PA7 / Ω inputs / source completeness (P0):** continue the existing item-level producer and PA1–PA7 mapping. Preserve unknowns as unknown; do not invent zero obligations, source completeness, independent providers, or valuation. Separate bounded address census from authoritative completeness, disjointness, item provenance, L2 lifecycle and L6 emptiness.
- **R1 / K_c evidence (P0):** coordinate the canonical risk/protection contract and concrete QNE/viability obligations with B. Do not create new coefficients, thresholds, regime formulas, HALT actions, or substitute statistical estimates for deterministic guarantees. The 17-case B-R1 scaffold PASS is not end-to-end integration or a certificate.
- **#20 — authoritative ticket expiry (P0):** deliver versioned `PreRichExpiryPolicy` and verified issuance-state snapshot; bind `issuedAt`/`expiresAt` to the authorized state. Do not invent a temporary horizon, reopen the expired ticket, or weaken PrizeValidator/B1 rules.
- **#41 — Treasury receipt journal and carrier (P1 parallel):** own the read-only TicketSale receipt journal, observer, fixtures, operational specification, and only the receipt-journal workflow wiring explicitly allocated to A. Latest recorded journal fixture count is 26; Node CI PASS and live Preprod observer execution are not established. The MintPolicy physical-value CEK proof is PASS on #42167342107 / `120ebeef...`, but is a separate bounded gate. Continue lineage, idempotency, current topology pins, live observer, and executable carrier comparison. No category posting, settlement authority, spending permission, allocation formula, or target selection is authorized.
- **Scientific paper (P1 parallel):** maintain the 2 November Agent A paper scope as an evidence/synthesis track that does not delay P0. Keep IMMORTAL and PRE-RICH white papers distinct; no unsupported novelty/security/solvency/formal-verification claims; map each claim to exact source SHA, test/run, artifact digest and (only when achieved) real Preprod evidence.

**A-owned path boundaries:**
- Expiry: `PRE-RICH/src/PreRichExpiryPolicy.ts`, `PRE-RICH/src/PreRichExpiryEvidence.ts`, and explicitly registered expiry tests/workflows.
- Treasury: `audit/cardano-integration/treasury-receipt-journal.mjs`, `audit/cardano-integration/treasury-receipt-journal.test.mjs`, `audit/cardano-integration/observe-preprod-treasury-receipts.mjs`, Treasury operational spec/evidence, and the specifically allocated receipt-journal integration in `.github/workflows/adapter-sale-conformance.yml`.
- #37 source-qualification / EV artifacts: A owns the work, but exact file paths must be enumerated and registered in the task record before any write. No broad ownership of `audit/**` is implied.
- A does not edit Plutus validators, `plutus/Types.hs`, V3/Reveal, Cardano Adapter transaction semantics, or B-owned workflows except through explicit reviewed coordination.

### Agent B — Cardano security, BeaconRegistry, Adapter/provider boundary, execution evidence

**Issue ownership:**
- **#43 — B0 BeaconRegistry adversarial review (P0):** characterize full lifecycle and trust boundaries before any new Issue authorization. Findings are source-level candidate gaps, not demonstrated exploits. Priority evidence: T01a/T01b direct Pending/Ready output creation; T02 full-wrapper Registry CEK; T04 full-wrapper PrizeValidator SyncBeacon CEK plus balanced Yaci twin; T05 first-match/reference-order behavior; T06 value continuity; T07 worker duplicate handling; T08 authenticated Preprod Registry deployment identity. T03 is only partial/ancestor CEK evidence. Do not change schema/ABI or remediate semantics inside the characterization task without a separately authorized follow-up.
- **#42 Package A — B42-A credential boundary (P0 deployment security):** remove browser use/injection of Blockfrost credentials; replace dynamic Vite env access with explicit public allowlist; configure a fixed server-side Preprod proxy with exact method/path/origin/bounds; preserve POST `/tx/submit` only for already user-signed CBOR; prove a secret canary is absent from every generated `dist/` file and test runtime proxy controls. Current source was still NOT IMPLEMENTED in the latest recorded audit; a static scanner PASS alone does not close it.
- **#42 Package B — B42-B provider qualification (P1, after B42-A design/tests):** add the smallest non-normative CardanoProviderProfile contract and fixtures covering provider identity/capabilities, collection completeness/pagination, snapshot/rollback consistency, provenance, failure semantics and purpose-specific qualification. Do not promote API availability into authority or count common-upstream endpoints as independent sources.
- **B0 / B1 / B2 Cardano execution:** own BeaconRegistry/Plutus/Adapter/Cardano Lab implementation and tests, within explicit path allowlists. Preserve frozen V3/Reveal and economic semantics. B2 vertical Issue → Beacon → Reveal → Claim and separate Expire flows run only after security, expiry and economic admission prerequisites are satisfied; report actual ledger evaluation/ExUnits or exact pre-submission failure.

**B-owned path boundaries:**
- B0: `plutus/BeaconRegistry.hs`; `plutus/Types.hs` only for the Registry datum/type boundary and only with cross-validator impact review; `src/registryDatum.ts`, `src/createRound.ts`, `src/registryFlow.ts`; `audit/algorithmic-governability/beacon-registry-commitment-gap-boundary.mjs`; focused B0 tests.
- B42-A: `src/config.ts`, `src/wallet.ts`, `src/live.ts`, `src/first-user.ts` (provider status only), `.env.example`, `blockfrost-proxy/**` within the issue allowlist, `src/__tests__/cardano-provider-secret-boundary.test.ts`, `scripts/security/credential-boundary-check.mjs`, `.github/workflows/security-credential-boundary.yml`, `.github/workflows/immortal-preprod-pages.yml`.
- B42-B: `Adapter/CARDANO/observation/CardanoProviderProfile.ts`, its tests, and `Adapter/CARDANO/docs/PROVIDER-QUALIFICATION-AND-EVIDENCE-INTEROPERABILITY-v0.1.md`.
- Cardano Lab/Plutus files only under task-specific changed-path manifests. A owns the Treasury/expiry/source files listed above. Do not silently absorb them.

**B write gate:** B remains READ-ONLY on the shared green branch until A/coordination records an explicit release comment with (1) release SHA, (2) paths released, (3) time/window, and (4) confirmation A has paused writes to those paths. B must then refetch HEAD and changed-path diff before writing. No parallel pushes to the shared ref.

### Agent C — Materios B3 finality, provenance and trust-model evidence

- Sole working lane: `work/b3-materios-provenance-evidence`.
- Scope: C1 authenticated genesis/bootstrap and authority-set provenance; C2 exact historical storage proof; C3 independent verifier feasibility; C4 precisely update the declared B1 trust model if an independent B3 witness is not obtained.
- New 6 November findings to carry forward: decode active `grandpa_voters`/AuxStore history and reconcile SSTs against CURRENT/MANIFEST/sequence/tombstones; do not infer historical authority weights from current set; distinguish forced changes because ordinary GRANDPA justifications may not bridge them; for a justification targeting block B, query authority state at the parent block B−1. For anchor 1856408, parent authority state is at 1856407. The collector regression for a transition exactly at B−1/B remains unimplemented.
- Exact B3-B target, pinned upstream version and archive preflight/sync/verifier procedure are preserved in [Agent C B3-B archive mission](AGENT-C-B3-B-ARCHIVE-NODE-MISSION-2026-11-06.md).
- C does not write A/B paths, IMMORTAL economics, shared Plutus contracts, V3/Reveal, or B2. B3 remains parallel and is not a prerequisite artificially imposed on the first Cardano ticket.

### Agent D — local development-agent/tooling enablement

- GitHub Issue [#39](https://github.com/LiberoNuvola/Immortal-Protocol/issues/39) is the mandate. D is not a protocol agent and gains no protocol authority.
- D0/D1: read-only discovery/prototype, repository/branch/SHA/CI observation, deterministic audit. D2 requires a dedicated isolated worktree, explicit branch/path allowlist and command allowlist. D3 recovery and D4 supervised queue follow only after their acceptance tests.
- No writes to A/B/C working trees, no auto-merge, branch cleanup, deployment, signing, wallet action, or on-chain action. Mitsuro/Hive/other components are not declared installed/operational without observable tests.

### Agent E — PRE-RICH-AEP-Arb-Agent / account and trading evidence

- Exclusive repository: `LiberoNuvola/PRE-RICH-AEP-Arb-Agent`; existing branch: `Immortal-Protocol`. No Arb work is to be implemented inside IMMORTAL or Cormia.
- E0 current-head S1 conformance must be reverified at task start. A successful S1 run on an older SHA is bounded historic evidence, not automatic current-head GREEN.
- E1–E4 may continue only as synthetic/read-only contract work: provider profile and operation mapping; order/fill lifecycle and reconciliation; account-family completeness; OpenExposure handoff through existing IMMORTAL contracts. No new oracle registry, evidence framework, item ledger or admission witness.
- E5 remains wallet companion read-only W1/W2/W3 consumer work subject to B review of Cardano boundaries; browser/live wallet not proven by mocks. E6 Principal/account/resource isolation is a separate security gate requiring owner/Principal adoption and independent review. E7 W4/W5 execution/delegation is deferred and NOT AUTHORIZED. No real provider/account connection, API credentials, signing, trading or submission.
- A reviews economic obligations/effects; B reviews Cardano wallet/Adapter boundary; C only reviews claimed B3 dependencies; independent reviewer covers Principal/isolation/provider security.

## 4. Explicitly not created: Agent F or Agent G

F and G are not registered agent roles in the current A–E coordination system. The earlier idea of splitting R1/Kc and Issue-admission integration is retained only as two work packages: A owns the economic evidence and R1/Kc source/protection prerequisites; B owns the Cardano/Authoritative Admission integration and conformance boundary. A future split requires a separately recorded owner, issue/task, path allowlist, dependencies and acceptance; do not create F/G implicitly.

## 5. Critical path and parallel tracks

### First owner-purchased Preprod ticket — dependency order

1. B completes/gets an authorized disposition for the P0 B0 security gate (#43); characterization tests must precede any proposed schema/contract remediation.
2. A qualifies a real Option B USD/USDM price source or exact governed two-leg derivation; stale Charli3/Oracle data and reserve NAV are not acceptable substitutes.
3. A produces current same-candidate/same-snapshot EV1–EV7, source provenance, current deployment approval through the approved human gate, and exact live deployment/Pool bindings.
4. A completes PA1–PA7 item-level source coverage, disjointness, obligation lifecycle, Omega inputs and concrete viability/QNE/R1/Kc evidence. Scaffold tests do not replace the certificate.
5. A closes versioned PRE-RICH expiry policy and issuance-state binding (#20).
6. B integrates/tests the authoritative Issue admission path, B2 control/Counter bindings and external signed Issue authority provider using only the admitted evidence. No side door through UI/relayer.
7. Run the read-only readiness gate on the exact candidate. `READY_FOR_WALLET_REVIEW` permits human review only; it is not a signing, submission, deployment or Issue authorization.
8. The project owner personally verifies network, candidate and terms, signs through their connected wallet, submits, then verifies confirmed transaction, Ticket NFT, datum, exact UTxOs and post-state. Agents never sign or submit for the owner.

### Parallel, non-blocking tracks

- A's #41 Treasury receipt journal may proceed in parallel as observational accounting infrastructure; it does not set posting policy, spendability, allocation target, or EEV.
- C continues B3-Materios independently on its dedicated branch.
- E continues only synthetic/read-only Arb E0–E6 work; E7 is deferred.
- D advances local-agent enablement without shared-worktree access.
- Scientific paper work is parallel P1 synthesis, never a reason to defer P0 or overstate results.

## 6. Branch and write discipline

| Lane | Ownership | Rule |
| --- | --- | --- |
| `main` | release only | no direct development; reviewed narrow promotion slices only |
| `work/immortal-green-closure` | A/B shared integration | disjoint path ownership, serialized pushes, exact SHA + changed-path manifest per task |
| `work/b3-materios-provenance-evidence` | C only | independent B3 work |
| Arb repository `Immortal-Protocol` | E only | one active writer; no IMMORTAL/Cormia writes |
| D local project/worktree | D only | read-only first; isolated worktree for any later write |

No new branch is authorized. Do not rename/delete branches in bulk. No agent may treat a passing workflow on an ancestor SHA as a pass on current HEAD. Before any write: fetch branch ref, inspect changed paths, confirm scope and lock, then record starting SHA. After writes: record ending SHA, exact tests/runs, artifacts/digests and limitations.

## 7. Evidence labels and no-claim rules

- **NORMATIVE:** frozen specification/decision record. Implementation convenience cannot alter it.
- **IMPLEMENTATION:** source/type/schema/test/workflow exists; not proof it works.
- **TESTED:** executable test passed on the exact recorded SHA and stated harness.
- **OBSERVED:** read-only provider/ledger fact at a stated time/tip; not automatic authority.
- **QUALIFIED:** purpose-specific source/evidence accepted under a versioned contract.
- **CERTIFIED:** complete proof/certificate whose assumptions, authority, candidate, deployment and digest are explicitly bound.
- **HISTORICAL / HYPOTHESIS / OPEN:** must remain explicitly labeled; absence of evidence is not PASS.

Do not claim GREEN from code presence, fixture count, workflow wiring, build success, endpoint availability, two endpoints with unproven backend independence, stale datum, synthetic QNE, or CI on a different SHA. Do not infer a zero obligation from missing data. Do not turn a Treasury receipt into spendable category credit. Do not alter frozen economic constants, price ladder, expiry semantics, V3, Reveal, Beacon/Registry ABI, or B3 trust assumptions without a separate evidence-backed decision.

## 8. Immediate coordination actions

1. A records a bounded release/handoff for B before B makes any shared-branch write; B remains read-only until then.
2. A/B/C/D/E record explicit acceptance and a current SHA/path/task record in their existing issues/workstreams; GitHub account assignees are not invented because role labels are not mapped to verified account identities.
3. B0 T01b/T04 are the priority executable characterization pair; continue T02/T05/T06/T08 as per Issue #43, without remediation inside that issue.
4. A enumerates exact #37 source-qualification paths before writing; continues #20 and #41 within already allocated paths.
5. C updates the dedicated B3 mission baseline from its own branch and resumes the exact-anchor storage/finality sequence only after historical chain identity checks.
6. E refreshes Arb repository HEAD and E0 before claiming current S1 status; D keeps #39 read-only until D0/D1 acceptance is demonstrated.
7. The next checkpoint must refresh branch/PR/run/artifact refs at the time of the update; this document's commit and the historical workflow SHAs must not be conflated.

---

**No technical changes, deployment, signing, wallet operation, branch creation/deletion, merge, or on-chain transaction is authorized by this coordination baseline.**