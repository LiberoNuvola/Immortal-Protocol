# GitHub Auto-Merge Integration — Algorithmic Governance

**Status:** NON-NORMATIVE / IMPLEMENTATION PLAN  
**Version:** 0.1-draft  
**Date:** 2026-10-21  
**Branch context:** `work/b3-materios-provenance-evidence`

## Purpose

Connect IMMORTAL's algorithmic-governability principles to GitHub's native Auto-merge without confusing evidence eligibility with protocol authority or repository permissions.

The intended rule is:

> For a narrowly defined, non-normative contribution, GitHub may merge automatically only after the repository's required review and required status checks have passed for the current head commit. Normative, security-sensitive, ambiguous, or boundary-changing contributions do not qualify for this reduced path.

This is a repository-process mechanism, not a DAO, token, protocol rule, or authority to change IMMORTAL semantics.

## Current verified repository setting

Repository metadata currently reports `allow_auto_merge = false`. Therefore GitHub Auto-merge is **not enabled at repository level** as of this inspection. The GitHub integration used for this work does not expose a supported operation to change that repository setting or branch protection/rulesets, so this document does not claim those settings have been applied.

The active `Protect main` ruleset currently requires pull requests, linear history, and prevents non-fast-forward updates and branch deletion, but its retrieved configuration has `required_approving_review_count: 0`, `required_status_checks: []`, `require_code_owner_review: false`, and `dismiss_stale_reviews_on_push: false`. Thus **no human approval and no CI status check are currently required by that ruleset**. The “stronger review” labels described below are process metadata; they do not independently enforce a review. Configure and verify the ruleset before claiming those controls are active.

## Proposed merge path

1. A PR declares its contribution class (A–E) and supplies the evidence package in `docs/04-guides/PUBLIC-CONTRIBUTION-WORKFLOW.md`.
2. The initial live classifier is `scripts/contribution-evidence-gate.mjs`, invoked by `.github/workflows/contribution-evidence-gate.yml`. It checks the declaration and the complete changed-file inventory using base-branch code, verifies that each file fits at least one declared class-specific path boundary, and requires `Evidence-bound commit SHA` to equal the current PR head.
3. Existing required CI checks evaluate their actual properties. The evidence gate must not substitute for tests, conformance, security review, or ledger evidence.
4. A required human approval and the other required CI checks are obtained under the repository's branch rules. The classifier does not independently evaluate reviews or validate a claimed CI result. Approval is a repository action, not proof of conformance.
5. If normative or governance-control-plane paths change, the gate returns `STRONGER_REVIEW_REQUIRED` and fails until an authorized maintainer completes stronger review and applies exactly `governance/strong-review-cleared-<first-12-hex-of-current-head>`. After that label is present, the gate reports `STRONGER_REVIEW_CLEARED` while explicitly keeping `reducedPathEligible = false`; required GitHub approval and other required checks still apply. A new head invalidates the label.
6. Any active challenge/security-hold label blocks the gate, including on the stronger-review path. Clearing a challenge requires a separate `governance/challenge-cleared-<first-12-hex-of-current-head>` label and removal of the active hold label, applied through authorized repository permissions after a recorded disposition. This is an operational convention, not cryptographic authorization.
7. GitHub Auto-merge is eligible only after all required reviews and required status checks pass for the current head. Any new commit invalidates checks and any head-bound clearance, causing reevaluation.
8. The merge method is selected from the repository's allowed merge methods; no workflow may bypass required checks or write directly to the protected branch.

## Classes eligible for the reduced path

Candidate classes are A–E as defined in the public contribution workflow:

- A — non-normative documentation;
- B — audit/evidence tooling;
- C — tests and conformance vectors for already-declared behaviour;
- D — process documentation;
- E — residual-obligation records with cited evidence.

The *entire effective change* must remain within the declared eligible scope. A class label, file path, green check, approval, or popularity signal is not sufficient by itself.



The gate's A–E path mapping is intentionally narrower than a free-form class declaration: A is limited to `README.md`, `docs/README.md`, and `docs/EXECUTIVE-SUMMARY.md`; other Markdown is not automatically eligible by extension alone. B covers audit tooling and selected scripts outside the governance control plane; C covers test/conformance/fixture paths; D covers process guidance; E covers explicitly named residual-obligation records. A PR declaring multiple classes must have every changed file match at least one declared class. Known normative paths and the governance-control plane fail closed to stronger review. This path classification is a filter, not a proof that unrecognized files have no semantic effect.

## Mandatory exclusion / stronger-review routing

The reduced path must not be used for Constitution, Economic Kernel, normative `[M]` predicates, `Safe`, `Ω`, `T`, obligation partition, universal semantics, safety conditions, economic policy, authority boundaries, evidence trust roots, signing/release controls, branch-protection controls, or any semantically ambiguous change.

Path filters and CODEOWNERS can help route review, but cannot prove semantic non-interference. Changes to normative semantics require explicit stronger review; an eligible test or documentation label must never override that boundary.

## Required repository configuration

An administrator must apply and verify these settings in GitHub before describing Auto-merge as active:

1. Enable **Allow auto-merge** in repository settings.
2. Protect the intended target branch with a ruleset/branch protection rule.
3. Require pull requests and the agreed number/type of approvals; dismiss stale approvals when the head changes.
4. Require the exact named status checks selected for the protected branch, including `contribution-evidence-eligibility` after its policy self-tests pass and representative PR behaviour is validated. The gate must have a valid stronger-review clearance route; otherwise requiring it globally would make normative/control-plane PRs impossible to merge. Do not rely on a workflow that is skipped for some changed paths as the only required check.
5. Require conversation resolution and prevent force pushes/deletion as appropriate.
6. Do not permit routine bypass of required checks. If administrators retain bypass powers, document that this is a residual operational authority rather than claiming discretion has been eliminated.
7. Configure CODEOWNERS/stronger reviewers for normative and security-sensitive areas. A sole maintainer cannot manufacture independent review by turning on Auto-merge.
8. Start without a merge queue. Consider a merge queue only if PR volume or race conditions justify it.

After configuration, verify the settings against a test PR: a compliant non-normative PR should wait for approval and all required checks; a failing check or stale head must prevent merge; a normative/boundary-changing PR must not enter the reduced path. 

## Challenge lifecycle and anti-veto safeguards

A concrete challenge is not a permanent discretionary veto, but neither does a deadline make it disappear:

- **OPEN / UNDER_REVIEW:** challenge identifies a permitted category, actionable reason, and evidence reference (except sensitive security reports, handled privately). Auto-merge is blocked.
- **ESCALATED:** the response window elapsed without a recorded disposition. The challenge remains blocking. The record must identify the responsible next action and, where practical, the next review date. Escalation is visibility/accountability, not approval or rejection.
- **SECURITY_HOLD / SECURITY_ESCALATED:** sensitive details may remain private, but the hold remains blocking until an authorized disposition is recorded. Time alone cannot clear it.
- **RESOLVED_NO_BLOCKER:** the challenge is dismissed with a concrete rationale and a public/non-sensitive record tied to the current head.
- **RESOLVED_FIXED:** the defect was corrected on the current head; the disposition, evidence and required checks must refer to that head.
- **UPHELD:** the challenge established a blocker; the affected head is not eligible for Auto-merge. A corrected commit must be re-evaluated and the resolution bound to that new head.

Only a recorded, current-head disposition can clear a challenge for the reduced path. No reaction count, preference, silence, approval, or timeout substitutes for it. If a valid challenge is ignored, the result is a visibly stalled/escalated PR—not an automatic merge. This protects against both unsubstantiated vetoes and deadline-based bypasses.

A valid challenge that is escalated but never adjudicated can still stall a PR. The process makes that failure explicit but cannot eliminate it through code alone; independent escalation requires additional authorized reviewers or a future community process. At the repository's current stage, do not claim such independence exists unless it is actually configured.

## Algorithmic-governability invariants

- **No result-dependent authority:** eligibility criteria are not changed to favour a specific PR after seeing its result.
- **Evidence is commit-bound:** a new head SHA requires fresh checks/evidence.
- **Approval is not evidence:** approval cannot turn a failed predicate into a pass.
- **Evidence is not authority:** a green check cannot modify protocol semantics or grant permissions.
- **No deadline-triggered merge:** procedural overdue status records delay; it never triggers automatic merge or rejection.
- **Concrete contestability:** a challenge records a category and actionable reason/evidence, with private handling for sensitive security details.
- **Fail closed on ambiguity:** normative or unclear scope routes to stronger review.
- **Forkability:** a non-merge in the canonical repository does not imply universal protocol invalidity.

## Limitations and residual authority

GitHub Auto-merge is a conditional execution mechanism, not a proof that governance is non-discretionary. Repository administrators can change settings and permissions unless the organization/platform prevents it. The process can make criteria public, checks reproducible, changes auditable, and bypasses visible; it cannot honestly claim that all human or administrative discretion has been eliminated.

The `scripts/contribution-evidence-gate.mjs` script and `.github/workflows/contribution-evidence-gate.yml` workflow provide a pull-request classification check. The workflow is read-only, checks out the PR base commit rather than contributor code, retrieves the current PR and complete changed-file inventory, fails closed on stale events, missing declarations, placeholders, active challenge labels, or known normative/control-plane paths, and emits a run summary. Normative/control-plane changes can proceed only after an authorized maintainer applies the exact head-bound `governance/strong-review-cleared-<sha12>` label; the result explicitly marks them outside the reduced path, while required GitHub approval and CI remain separate. Active challenge labels block both routes. Workflow B also runs deterministic self-tests for these conditions. Labels are repository metadata, not cryptographic proof or substitutes for required review. This does not prove semantic non-interference, independently adjudicate challenges, or certify the PR's declared tests.

The evidence-eligibility check is **not yet configured as a required branch-protection check**, and the repository currently reports `allow_auto_merge = false`. GitHub may trigger the workflow for the PR that introduces it, but the workflow intentionally checks out the target/base SHA and refuses to execute contributor-supplied policy code. On the initial adoption PR, where the base does not yet contain the classifier and its model, the preflight reports `BOOTSTRAP_REVIEW_REQUIRED` and fails closed; that is a bootstrap condition, not a classifier eligibility verdict. This first PR therefore needs separate human review, and the gate must not be made a required check until it exists on the target branch and representative ordinary PRs have been validated. After the gate is present on the target branch, it can evaluate subsequent PRs using trusted base-branch policy. Supporting self-tests passed in Workflow B, but the bootstrap run does not itself prove the full live process. The public contribution workflow and Auto-merge plan remain drafts until representative PR validation and repository settings are applied and verified. The GitHub integration available for this work does not permit those administrative settings to be changed directly.
