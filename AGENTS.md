# IMMORTAL / PRE-RICH — Agent Operating Instructions

**Updated:** 2026-11-06  
**Role and branch baseline:** [Repo-wide Coordination Baseline 2026-11-06](docs/COORDINATION/REPO-WIDE-COORDINATION-BASELINE-2026-11-06.md).  
**Historical checkpoint:** [Repository-Wide Branch & Evidence Checkpoint](docs/COORDINATION/REPO-WIDE-BRANCH-CHECKPOINT-2026-10-21.md).

This file is the repository-wide routing and safety index. It does not assign protocol authority or replace normative specifications, GitHub Issues, or the current Control Center.

## Agent roles

- **Agent A — Economy / first Preprod Issue:** Issue #37 USD/USDM + EEV/source evidence + ProtectedCapital; Issue #20 authoritative expiry; Issue #41 read-only Treasury receipt journal/carrier evaluation; evidence-backed scientific paper in parallel. A owns only the paths enumerated in the current coordination baseline and task record.
- **Agent B — Cardano security / Adapter / execution evidence:** Issue #43 BeaconRegistry adversarial characterization; Issue #42 B42-A credential boundary then B42-B provider qualification; Cardano integration and lifecycle evidence after admission prerequisites. B preserves V3/Reveal and frozen economics.
- **Agent C — Materios B3:** C1 bootstrap/authority provenance, C2 exact historical storage proof, C3 independent verifier, C4 trust-model disposition. Sole lane: `work/b3-materios-provenance-evidence`. Detailed B3-B archive mission: [Agent C B3-B mission](docs/COORDINATION/AGENT-C-B3-B-ARCHIVE-NODE-MISSION-2026-11-06.md).
- **Agent D — Local development-agent enablement:** Issue #39; read-only D0/D1 first, later writes only in an isolated worktree with explicit task/path/command allowlist.
- **Agent E — Arb Agent:** exclusive sibling repository `LiberoNuvola/PRE-RICH-AEP-Arb-Agent`, existing branch `Immortal-Protocol`; synthetic/read-only S1 and contract evidence only. No write in IMMORTAL or Cormia.

Agent labels are coordination roles, not protocol actors, principals, signers or autonomous authorities. Agent F/G are not registered roles. Any future split of R1/Kc or admission work must be recorded as a bounded package with an owner, issue, dependencies, path allowlist and acceptance criteria; it does not create an implied agent.

## Branch lanes

- `main`: release-only; no direct development.
- `work/immortal-green-closure`: shared A/B integration lane. A and B have disjoint path ownership; pushes must be serialized. Agent B remains read-only until an explicit Agent A/coordination handoff records release SHA, exact paths, time/window and confirmation that A has paused those paths.
- `work/b3-materios-provenance-evidence`: Agent C only.
- Arb sibling repository branch `Immortal-Protocol`: Agent E only.
- Agent D uses a separate local project/worktree; no default write access to A/B/C worktrees.

No new branch, bulk branch deletion/rename, rebase, merge, deployment, wallet signature, on-chain transaction or automatic promotion is authorized by this file.

## Required task record

Before work, every task must record: role/owner, repository, branch, exact starting SHA, allowed paths, objective, dependencies, commands/tests, required evidence, and stop conditions. Before each write, refetch branch HEAD and inspect the changed-path diff. After work, record ending SHA, exact CI/workflow runs, artifacts and digests, and unresolved limits.

Do not write outside the task allowlist. `plutus/Types.hs` changes require cross-validator impact review. Shared workflow changes require explicit path-owner coordination. Do not alter frozen economic constants, formulae, price ladder, expiry semantics, V3, Reveal, BeaconRegistry ABI, or Materios trust assumptions without a separately authorized, evidence-backed task.

## Evidence discipline

Code presence, fixture counts, workflow wiring, successful build, endpoint availability, stale data, synthetic witnesses, or tests on another SHA are not proof of current-head readiness. Classify evidence as implementation, tested-on-exact-SHA, observed-at-tip/time, purpose-qualified, certified, historical, hypothesis or open. Missing evidence is UNKNOWN, not PASS. Keep bounded CEK, Yaci/devnet, Preprod observation, authoritative qualification and live user-signed ledger evidence distinct.

`READY_FOR_WALLET_REVIEW` is a human review gate only. Only the project owner may personally review and sign the actual purchase from their connected wallet. Agents never custody keys, sign, submit or perform financial/on-chain actions on the owner's behalf.

## First Preprod Issue guard

The first real ticket remains BLOCKED until the applicable B0 security disposition, qualified Option B USD/USDM source, current direct-USDM EV1–EV7 and bound deployment approval, complete PA1–PA7/source evidence, deployment-bound R1/Kc/QNE/viability, versioned expiry policy/issuance state, B2/Counter/control bindings, and authoritative Issue witness all refer to the same approved candidate/deployment snapshot. The Treasury receipt journal is observational and does not grant spending or posting authority.

## B3 mission preservation

The previous root-level Materios archive-node instructions have been preserved, with the working lane scoped to Agent C, in [AGENT-C-B3-B-ARCHIVE-NODE-MISSION-2026-11-06.md](docs/COORDINATION/AGENT-C-B3-B-ARCHIVE-NODE-MISSION-2026-11-06.md). They no longer define the mission of every worker using the shared green branch.