# Workflow C — Branch and Transfer Record

**Transfer snapshot:** 2026-10-18  
**Purpose:** record the chosen existing branch and the limitations of this transfer.

## Branch decision

Destination: `release/public-main-curated-2026-09-24`  
Starting commit: `a8e11a34d92af169164bfedf8e4e3c710f817841`

This branch was selected because the repository branch inventory showed it exists and the Actions query returned zero workflow runs for it, while `main`, `work/immortal-green-closure`, `work/b3-materios-provenance-evidence`, the issue-admission branch and the workflow-B integration branch were excluded from this Workflow C work.

## Important baseline limitation

At the time of selection, comparison with `work/immortal-green-closure` reported the branches diverged, with 1,427 commits ahead on the green-closure side and 1,310 behind relative to it. Therefore this transfer deliberately does **not** merge or replay the divergent repository history. It records Workflow C's complete current design/reconciliation work as an isolated documentation package on the selected existing branch.

This branch is not represented as a current production baseline. Before any later implementation, the package must be reconciled against the then-current canonical branch and source-of-truth hierarchy. Do not merge this branch wholesale into main or green closure.

## Scope of this transfer

- Adds the Workflow C work programme, gate matrix, C6 cross-branch findings and B3 evidence-integration boundary.
- Makes the current NOT CERTIFIED / DESIGN ONLY status explicit.
- Does not alter economic semantics, Haskell/Aiken/TypeScript implementation, CI workflow definitions, deployment configuration, tokens, wallet state, or on-chain state.
- Does not claim any C gate is closed merely because this documentation is committed.

## Next implementation boundary

The next permitted work is to reconcile C0–C5 and implement C6-A/C6-C as non-normative profile/evidence contracts, while keeping C6-B/C8 blocked until an authorized transition relation and a non-empty Kc witness are actually supported. Any push-triggered workflow result must be inspected independently; no status is presumed from this record.
