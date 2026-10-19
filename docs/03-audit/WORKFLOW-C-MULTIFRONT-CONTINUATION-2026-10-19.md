# IMMORTAL — Workflow C Multi-Front Continuation & Evidence Register

**Observation date:** 2026-10-19  
**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Exclusive working branch:** `work/immortal-green-closure`  
**Source HEAD at audit start:** `df6a4f3c62182570ba65f34323068d0194f4e65f`  
**Latest commit message:** `test: match actual malformed JSON decoder diagnostic`  
**Scope:** source/CI/artefact inventory and status reconciliation. This report is non-normative and introduces no economic or governance semantics.

## 1. Access boundary and repository checkpoint

The remote GitHub branch and exact commit were verified. The recursive tree at that SHA was non-truncated (1,015 entries). The current commit diff contains one file only: `audit/cardano-ledger-runner/TestYaciUTxO.hs`. The working tree itself, including any uncommitted changes on the user's machine, cannot be inspected through the available GitHub connector; no claim is made about local dirty state or local test execution.

The prior PA2/PA7 source-transition audit document found on `release/public-main-curated-2026-09-24` is **not present** in the working-branch tree. No cherry-pick/copy from that release branch was performed. This report records the working-branch continuation without changing or switching the exclusive work branch.

## 2. Exact-head CI inventory

All run conclusions below are bound to exact head SHA `df6a4f3c62182570ba65f34323068d0194f4e65f` on `work/immortal-green-closure`. These results establish only the scope of the named workflow steps, not global protocol conformance.

| Front / workflow | Run | Observed result | Evidence scope / limitation |
|---|---:|---|---|
| A — IMMORTAL Cardano Integration Lab | [#1907](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622914) | **IN PROGRESS** | Upstream ledger traces, reference-script smoke and raw Yaci context materialization passed; native UTxO decoder conformance is still running; P2.8 gate and later steps pending. |
| A — P2.8-B.1 Cardano-ledger runner | [#607](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622901) | **IN PROGRESS** | Toolchain/prerequisite setup passed; ledger-aligned bootstrap still running; no evidence artifact available yet. |
| A — Cardano Ledger Audit Runner | [#170](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622929) | **IN PROGRESS** | Setup and Cabal index completed; native runner/decoder build step still running. |
| C/G — Documentation Link Check | [#1669](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622960) | **SUCCESS** | Link/scope check passed on exact head. |
| C/D — Protocol Declaration Conformance | [#2792](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622956) | **SUCCESS** | Declaration tests and `tsc --noEmit` passed on exact head; not a semantic equivalence proof. |
| D — IMMORTAL Portability Conformance | [#1605](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622936) | **SUCCESS** | TypeScript portability vectors and universal-boundary node tests passed; supports only this bounded transition set. |
| E — Algorithmic Governability Adversarial Lab | [#3951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622948) | **SUCCESS** | The `no-result-dependent-authority` script passed; this does not close GOV-28 lifecycle/finality conformance. |
| G — JEV Verification Registry Contract | [#26](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622954) | **SUCCESS** | Registry negatives, generator/fail-closed mapping, operational prompt generation, Materios ingress pipeline passed. No uploaded run artifact was listed. |
| F — IMMORTAL Cardano Preprod Context | [#621](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622957) | **SUCCESS** | Context probe/evidence job succeeded and uploaded artifact `immortal-cardano-preprod-context` (artifact ID `12161726675`, 109,219 bytes). Deployment, direct-USDM bootstrap, carrier observation and real Reveal jobs were **SKIPPED**. This is not a Preprod deployment/Reveal success. |
| F/G — Security Credential Boundary | [#596](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622991) | **SUCCESS** | Provider credential boundary check passed on exact head. |
| F — Cardano Adapter Sale Conformance | [#4003](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39195622915) | **SUCCESS** | Frontend build plus the named economic conformance/test suites passed; no Preprod transaction is implied. |

### CI evidence retrieval limitations

- Commit combined status was `pending` with no individual status records at the time observed; run-level results above were separately read from Actions.
- Job/step summaries are readable, but downloading raw logs for the three in-progress jobs returned a storage/API `BlobNotFound` response. Their final output cannot be inferred from step names.
- No artifacts were listed yet for Integration Lab #1907, P2.8-B.1 #607 or Audit Runner #170.
- The immediately preceding Integration Lab run #1906 and P2.8-B.1 run #606 failed on parent commit `13a06b8ec9f6a770b08f8f8d5f5ebe24612d4c5c`; Audit Runner #169 on that parent was cancelled. These are historical diagnostics, **not** failure evidence for the present SHA.
- The current-head Actions list did not contain a run of `kernel-invalid-class-fail-closed.yml` or `immortal-haskell-conformance.yml`. Exact-head execution for those suites is therefore **NOT RUN / NOT VERIFIED**, not inherited from older commits.

## 3. Fronte A — P2.8 native Yaci decoder and ledger evidence

### Source observations

- `audit/cardano-ledger-runner/TypedPacketDecode.hs` now implements `protocolVersionToBinaryVersion pp = Right (pvMajor (pp ^. ppProtocolVersionL))`. This removes the previously reported misuse of protocol `Version` as an `Integral` value and derives the binary decoder version from the protocol major.
- `audit/cardano-ledger-runner/YaciUTxO.hs` performs typed native decoding and rejects malformed shapes/fields, duplicate inputs, duplicate asset units, invalid quantities, unsupported reference-script bodies and inline datum/hash mismatch.
- `audit/cardano-ledger-runner/TestYaciUTxO.hs` now expects the Aeson diagnostic `expecting record key literal` for malformed input `{`. This is source-verified; exact-head test outcome remains pending inside run #1907.
- `audit/cardano-ledger-runner/Main.hs` binds evidence files to manifest SHA-256, workflow repository/ref/commit/run/attempt, transaction reference/CBOR and observation metadata; missing, synthetic or mismatched context fails closed to `SAFE_STALL`. A typed report is produced only after native decoding and the required evidence checks.
- `docs/audits/P2.8-B.1-cardano-ledger-runner.md` and `docs/02-certification/P2.8-LEDGER-EVALUATION-DOSSIER.md` explicitly distinguish infrastructure readiness from native evaluation acceptance. A valid synthetic fixture is not a ledger verdict.

### Status

| Acceptance item | Status |
|---|---|
| Malformed-JSON expected diagnostic in source/test | **SOURCE-VERIFIED** |
| Test actually passes on exact head | **NOT VERIFIED — #1907 decoder step running** |
| Haskell runner compiles | **NOT VERIFIED — #607 bootstrap and #170 build running** |
| Lab reaches P2.8 gate | **NOT YET — gate step pending in #1907** |
| Native typed evaluation produces A/B result | **NOT VERIFIED** |
| Commit-bound native report/artifact preserved | **NOT VERIFIED — no current-run artifacts listed** |

No decoder/economic change is proposed until a concrete failure appears in logs/step outcomes.

## 4. Fronte B — Source-to-transition expiry inventory

### Normative contract

`PRE-RICH/docs/GAME-ECONOMY.md` §11 requires final expiry, no claim after expiry, no new liability after expiry, release of unresolved reserve where applicable, **release exactly once of an expired unclaimed winning right**, late Reveal unable to create claimability, and dissolution of the expired payment commitment. No new owner policy or expiry duration is proposed in this report.

### Transition register (bounded source inventory)

| Path / evidence surface | Initial → terminal state | Economic fields/effect | Identity, time, atomicity, replay | Evidence and reachability judgment |
|---|---|---|---|---|
| Issue: `src/mint.ts::mintSerialNFT`; `PRE-RICH/src/PreRichIssueRefinement.ts`; `B1PrizePool.TicketIssued` | no ticket → `Pending` | One ticket is created; unresolved count and price reserve increase by the canonical price; pending winning liability is not yet crystallized. | Builder couples ticket sale and pool mutation in one transaction; admission inputs are checked. Full all-entrypoint census still required. | Source-verified in inspected Issue paths; refinement/test coverage exists. This is a class-level and ticket-level issuance boundary, not expiry evidence. |
| Reveal: `src/gameFlow.ts::revealPrize`; `PrizeValidator.validateReveal`; `B1PrizePool.TicketRevealed`; `PreRichRevealRefinement.ts` | `Pending` → `Revealed` | Unresolved price reserve/count decrease; exact payout is crystallized into `ppPendingLiabilities`. Refinement asserts liability after = liability before + frozen payout and payout is capped by the existing 500× rule. | Ticket datum identifies ticket; the validators jointly bind PrizePool updates in one transaction. Actual deployment identity is not established by source inspection. | Source-verified; current Integration Lab steps 29–33 show Reveal/Issue-related ledger traces succeeded in that lab, but those steps are not the revealed-ticket expiry scenario. |
| Claim: `src/gameFlow.ts::claimPrize`; `PrizeValidator.validateClaim`; `B1PrizePool.TicketClaimed`; `PreRichClaimRefinement.ts` | `Revealed` → `Claimed` | Liquidity and `ppPendingLiabilities` decrease by the exact frozen payout; no new payout is computed by Claim. | Owner/ticket identity, signature, expiry upper bound and pool accounting are checked in the inspected path; the coordinated ticket/pool spend is atomic. | Source-verified; bounded unit/conformance evidence exists. This covers successful settlement, not expiry of an unclaimed payout. |
| Pending-only Expire: `src/gameFlow.ts::expirePrize`; `PrizeValidator.validateExpire`; `B1PrizePool.TicketExpired`; `PreRichExpireRefinement.ts` | `Pending` → Prize datum consumed | Unresolved count decreases by one; unresolved price reserve decreases by that ticket's price; total liquidity and `ppPendingLiabilities` remain unchanged. | Ticket datum and `expiresAt` used; transaction lower bound `validFrom(expiresAt)`; Prize/pool inputs are spent atomically. Pool state and removal of the spent Prize datum guard this Pending operation against replay of the same UTxO. | Source-verified. Unit refinement and ledger trace fixtures are expressly Pending-only. |
| Revealed winning right expiry / L1→L5 | required: `Revealed` unclaimed right → expired/dissolved terminal economic right | Required effect: decrement crystallized liability by the frozen payout exactly once; no change to payout value after expiry; exact relationship to liquidity and reserve must be justified by canonical accounting. | Must bind ticket/right ID and payout; atomically update ticket and pool; reject duplicate expiry and subsequent Claim; late Reveal must not restore claimability. | **NOT FOUND IN INSPECTED IMPLEMENTATION**. No matching state/redeemer/validator/refinement/trace was found in reviewed paths. Whole-program absence is **NOT PROVEN**. |
| Aggregate V3: `IMMORTAL/kernel/EconomicTransitionV3.hs` | `Expire TicketClass` | `expireClass` decreases `tcsUnresolved` and the unresolved `tcsExposure` by price; `Claim Integer` decreases aggregate crystallized liabilities. | Expire does not carry a ticket ID, frozen payout or per-ticket expiry witness. An aggregate action alone cannot demonstrate the concrete L1→L5 transition. | Source-verified aggregate/refinement boundary. Do not change V3 semantics as an inferred fix. |
| Evidence-only helpers: `PreRichExpiryEvidence.ts`, `PreRichExpiryPolicy.ts` | time eligibility / expiry derivation | They calculate/validate the time boundary and ensure late Reveal has no positive economic effect; they do not mutate or prove the pool liability transition. | A ticket identifier and issuance/expiry times exist in the evidence shape, but frozen payout and pre/post pending liabilities do not. | Source-verified support logic, **not** a canonical accounting transition. |
| Ledger trace: `audit/cardano-integration/expire-ledger-trace.ts` | expired Pending fixture → Expire | Expects price reserve/count release and unchanged total liquidity/liabilities for the Pending case. | Actual Yaci transaction is atomic for the fixture; fixture scenario contains zero crystallized liability. | Source-verified as fixture definition. Current #1907 has an Aiken V3 economic Expire trace passing, but neither proves Revealed L1→L5 nor closes RF9. |
| Test mirror: `src/__tests__/b1-invariants.test.ts`; `preRichExpireRefinement.test.ts`; `differentialActionReplay.test.ts` | aggregate/pure model | Tests count/reserve decrements and class mapping; the Expire evidence has no frozen payout or pending-liability before/after fields. | Pure tests can reject inconsistent evidence but do not prove on-chain reachability or transaction atomicity. | Source-verified test scope; those tests have not been run locally in this pass. |
| Predeploy guard: `scripts/predeploy-check.mjs` | structural scan | Asserts the presence of `TicketExpired`, `validateExpire`, `Expire`, `pdExpiresAt` and DApp expiry route. | Regex/presence checks do not test post-state decrement of crystallized liability. | Source-verified boundary limitation. A passing structural gate must not be treated as expiry accounting proof. |
| Packaged validator copies | checked-in `plutus/out/*Factory.plutus.json` and `src/plutusScripts/*Factory.plutus.json` | Earlier exact-branch audit recorded byte-identical copies on the release branch. | That is not current-working-branch or deployed-script binding. | **NOT REVALIDATED on this branch/head**; deployment identity NOT VERIFIED. |

### L1→L5 conclusion

The gap is more precise than “there are no expiry tests”: there is a Pending-only Expire implementation and corresponding refinement/test/trace coverage, but that evidence covers unresolved reserve/count rather than a crystallized liability. The aggregate V3 `Expire TicketClass` also does not carry the per-ticket evidence required to infer the missing transition.

Minimum proof obligations before any implementation proposal:
1. Finish the whole-tree exact-branch inventory of callers, builders, validators, artifacts, migrations/relayers/observers and deployment paths.
2. Identify an existing canonical L1→L5 route, if one exists; if not, document the missing source-to-transition relation.
3. Reconcile any proposed minimal extension with the normative source-of-truth order and constructor/index compatibility before code changes.
4. Test expiry before/after the boundary, exact one-time liability release, duplicate expiry rejection, post-expiry Claim rejection, late-Reveal inertness, atomic pool/ticket mutation and replay/concurrency.
5. Bind test and ledger evidence to the exact source and deployed script hashes.

No expiry implementation is selected or modified in this pass.

## 5. Fronts C–G and dependency matrix

| Front | Exact-head work/evidence | Status | Blocking dependency / next action |
|---|---|---|---|
| **C — Kernel Invalid-Class / refinement** | The workflow `.github/workflows/kernel-invalid-class-fail-closed.yml` runs pinned Haskell kernel regressions including V3 vectors, economic admission, protected capital, governance replay and projection boundary. No run for this workflow exists in the current-head Actions list; only `TestYaciUTxO.hs` changed in the current commit. Static review confirms aggregate V3 transitions and ticket-level refinements are separate proof layers. | **NOT RUN on exact head; source boundary reviewed** | Need exact-head workflow/test evidence before claiming current-head invalid-class conformance. Do not relaunch duplicate workflow solely for this report; determine whether a later relevant code change or gate requirement triggers it. |
| **D — Protocol Declaration / portability** | Declaration tests + TypeScript typecheck pass (#2792); bounded portability tests pass (#1605). | **TEST-PASSED on exact head, bounded scope** | Haskell/Cardano equivalence and full adapter equivalence are not implied. |
| **E — GOV-28 governability** | Algorithmic governance no-result-dependent-authority check passes (#3951). Existing GOV-28 status document states the canonical replay/finality/lifecycle boundary still requires fresh exact-head Haskell/Cabal build and replay-suite evidence. No exact-head Haskell conformance run is in the current 11-run set. | **PARTIAL / OPEN** | Need exact-head Haskell build and full canonical replay evidence. The narrow algorithmic-governability script is not a GOV-28 substitute. No invented committee/quorum/authority is introduced. |
| **F — Preprod/Reveal integration** | Preprod Context run #621 succeeded and uploaded a context artifact; all deploy/Reveal jobs were skipped. Integration Lab has local-Yaci smoke plus current V3 Reveal/Claim/Expire trace steps completed before its still-running decoder. | **CONTEXT ARTIFACT PASSED; PREPROD DEPLOY/REVEAL NOT RUN** | Need separate actual deployment/observation evidence only when authorized. No redeploy or economic transaction is initiated by this report. |
| **G — Docs/boundary/provenance** | Docs Link Check (#1669), JEV Registry Contract (#26), Security Credential Boundary (#596) succeeded on exact head. The predeploy check tests structural source presence for expiry, not the L1→L5 post-state. | **TEST-PASSED for named checks; coverage gap source-verified** | If the predeploy gate is to certify expiry semantics, its test coverage must eventually assert economic post-state properties; that is a future scoped change, not implemented here. |

## 6. Additional reachability notes

- `docs/COORDINATION/RF8_ADMISSION_REACHABILITY_RECONCILIATION_20260924.md` already traces `revealPrize / claimPrize / expirePrize → signAndSubmitEconomicTx → adapter.submitEconomic → assertEconomicAdmission`. It also explicitly leaves RF8-B open because the generic `submit(tx)` primitive remains available at API level and whole-program no-side-door is not proved.
- `src/__tests__/differentialActionReplay.test.ts` normalizes Issue, Reveal, Claim and Expire evidence envelopes and negative cases. Its Expire member uses `PreRichExpireRefinement`; it therefore inherits the same Pending reserve/count scope and does not add L1→L5 accounting evidence.
- `IMMORTAL/docs/V3-CARDANO-SEMANTIC-EQUIVALENCE.md` classifies RF2 as open, RF3 as partial, RF8 as open, RF9 as open and RF10/RF11 as partial. These boundaries remain consistent with this source inventory.
- `docs/03-audit/IMMORTAL-IMPLEMENTATION-CLOSURE-STATUS.md` records expiry semantics as closed at normative level while requiring exact-commit test/build/ledger evidence for implementation closure. Semantic closure is not implementation proof.

## 7. Commit and verification discipline

This document is an additive, non-normative evidence register. It does not modify code, tests, validators, datum/redeemer constructors, formulas, expiry duration, V3/Reveal/Claim semantics, CI workflows or deployment configuration.

Statuses use the following meanings: `SOURCE-VERIFIED` = inspected in source; `TEST-PASSED` = run concluded successful on the exact SHA; `BUILD-PASSED` = build step concluded successful; `LEDGER-VERIFIED` = observed by the relevant ledger evaluator; `PREPROD-VERIFIED` = observed on Preprod; `BLOCKED` = a demonstrated dependency prevents closure; `NOT VERIFIED` = evidence is insufficient; `NOT RUN` = no exact-head execution evidence exists.

**Current gate statement:** P2.8 **OPEN / NOT GREEN**; L1→L5 expiry **OPEN / NOT FOUND IN INSPECTED PATHS**; whole-program absence **NOT PROVEN**; PA2/PA7/RF2/RF3/RF8/RF9 **OPEN / NOT CLOSED**; GOV-28 current-head executable closure **NOT VERIFIED**.

## 8. Next concrete actions

1. Recheck #1907, #607 and #170 for terminal job states and artifacts; do not re-run while active.
2. If the decoder test fails, use the exact observed Aeson diagnostic and fix only that assertion/parser boundary; if the compile fails, repair the first Haskell compiler error without changing protocol/economic semantics.
3. Continue exact-branch source inventory for Mint/Issue entrypoints, PrizePool/Treasury/Counter validators, every direct submit path, script factories and deployment bindings; expand the expiry matrix only with file-backed evidence.
4. Once whole-tree reachability is sufficiently mapped, reconcile the missing L1→L5 transition against normative sources and constructor-index compatibility before considering code changes.
5. Obtain a fresh exact-head Haskell/kernel conformance result at a justified trigger point; use the existing narrow green workflow results only for their explicitly tested scopes.

**No local build/test was run. No deployment, transaction, workflow dispatch, merge, squash or branch creation was performed in this report cycle.**
