# Dijkstra D1–D2 Upstream Readiness Audit

**Scope:** `work/b3-materios-provenance-evidence` only.  
**Classification:** research/audit tooling; non-normative.  
**Does not authorize:** new branches, changes to Reveal, PRE-RICH validators, Plutus pins, economic rules, deployment, or G1 closure.

## Purpose

The offline CLI wire-format preflight passed in run [39548855783](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39548855783), but that only demonstrates local build/sign/ID/embed behavior. This audit records the upstream integration dependencies before spending effort on a ledger fixture.

The companion workflow `.github/workflows/immortal-dijkstra-upstream-readiness.yml` queries public GitHub API metadata for pinned upstream pull requests and uploads a timestamped JSON snapshot. A successful workflow means **the snapshot was collected**, not that Dijkstra integration passed.

## Tracked upstream evidence

| Reference | What it covers | Required interpretation |
|---|---|---|
| [cardano-node #6677](https://github.com/IntersectMBO/cardano-node/pull/6677) | Node 11.2 integration prerequisite | Track merge state; not itself a nested-transaction acceptance proof |
| [cardano-node #6709](https://github.com/IntersectMBO/cardano-node/pull/6709) | Local Dijkstra testnet and nested transaction / top-level Guard properties | Required upstream test harness; inspect current body and merge state |
| [cardano-ledger #6189](https://github.com/IntersectMBO/cardano-ledger/pull/6189) | Ledger decoding fix for required top-level Guard data | A merged decoder fix does not prove node-to-client submission works |
| [cardano-api #1361](https://github.com/IntersectMBO/cardano-api/pull/1361) | SubTx API construction/signing | API support alone does not prove node integration |
| [cardano-cli #1453](https://github.com/IntersectMBO/cardano-cli/pull/1453) | Raw CLI build/sign/txid/embed commands | Balanced nested-transaction fee estimation is a separate capability |

The audit stores each reference's state, merged timestamp, head/base SHA, update timestamp, URL, title and body. It does not infer that a PR is successful from its title or from a ledger-side fix alone.

## D1 — Toolchain and support matrix

Before a ledger experiment, freeze and record the exact node, API, CLI, ledger, Plutus compiler/API, era/protocol version and genesis/configuration. Mark each needed capability `SUPPORTED`, `UNSUPPORTED` or `NOT VERIFIED` with a direct evidence link:

- Dijkstra era and protocol version 12 actually running;
- sub-transaction construction, decoding and ID stability;
- nested transaction balancing and whole-batch fee calculation;
- key/native/Plutus V4 sub-transaction guards;
- top-level Guard witness construction and node-to-client submission;
- reference witnesses, script context translation and Plutus V4 execution;
- whole-batch balance, aggregate collateral and ExUnits;
- observation of accepted/rejected transactions and resulting UTxOs.

Do not mark a capability supported from source code, a CLI-only smoke test, or a merged PR without an executable result for the pinned target.

## D2 — Reproduce the top-level Guard submission test

The next runtime gate is to run the exact upstream Dijkstra test property in a reproducible local testnet/runtime, after the node integration prerequisite is usable. Preserve:

1. checkout SHA and dirty-tree status for every upstream component;
2. compiler/build tool versions, exact test command and configuration/genesis hashes;
3. test name and complete logs, including node-to-client submission;
4. whether failure occurs during decoding/submission, Guard validation, Plutus evaluation, or ledger validation;
5. signed fixture hash and the observed ledger/UTxO result.

**D2 PASS criteria:** the top-level Plutus V4 Guard test submits successfully and reaches the expected ledger validation path; its positive and negative assertions pass; the exact versions and evidence are retained. An upstream PR merge alone is not a D2 PASS.

If the upstream test still fails in the streaming decoder before Guard validation, classify D2 as `BLOCKED_UPSTREAM_SUBMISSION_DECODER`. Do not weaken the assertion or bypass the Guard.

## Exit decision

- If the required upstream node integration/test target is still open or the top-level Guard submission property still fails, record `BLOCKED`; do not build the sponsor ledger fixture yet.
- Once D1 is pinned and D2 passes, create a **separate toy batch** (no PRE-RICH validators and no IMMORTAL economic semantics) for fee balancing, full CBOR size, collateral, ExUnits, acceptance and negative tests.
- The toy batch must never be confused with the offline synthetic transaction from the CLI preflight.
- G1 remains OPEN. No protocol fee, fee-bearing operation class, sponsor reimbursement or margin is selected by this audit.
