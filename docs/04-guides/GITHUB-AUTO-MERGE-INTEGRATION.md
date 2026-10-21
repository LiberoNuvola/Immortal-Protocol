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

## Proposed merge path

1. A PR declares its contribution class (A–E) and supplies the evidence package in `docs/04-guides/PUBLIC-CONTRIBUTION-WORKFLOW.md`.
2. The algorithmic-governability evidence gate evaluates only process eligibility: declared class, affected scope, normative status, evidence completeness, and commit binding.
3. Existing required CI checks evaluate their actual properties. The evidence gate must not substitute for tests, conformance, security review, or ledger evidence.
4. A required human approval is obtained under the repository's branch rules. Approval is a repository action, not proof of conformance. For changes that need stronger review, the existing stronger review path applies.
5. Any valid, unresolved challenge blocks Auto-merge. It must receive a recorded disposition before the ordinary merge preconditions can be satisfied; a response deadline never dismisses it automatically.
6. GitHub Auto-merge is eligible only after all required reviews and required status checks pass for the current head. Any new commit invalidates checks and any challenge disposition tied to the prior head, causing reevaluation.
7. The merge method is selected from the repository's allowed merge methods; no workflow may bypass required checks or write directly to the protected branch.

## Classes eligible for the reduced path

Candidate classes are A–E as defined in the public contribution workflow:

- A — non-normative documentation;
- B — audit/evidence tooling;
- C — tests and conformance vectors for already-declared behaviour;
- D — process documentation;
- E — residual-obligation records with cited evidence.

The *entire effective change* must remain within the declared eligible scope. A class label, file path, green check, approval, or popularity signal is not sufficient by itself.

## Mandatory exclusion / stronger-review routing

The reduced path must not be used for Constitution, Economic Kernel, normative `[M]` predicates, `Safe`, `Ω`, `T`, obligation partition, universal semantics, safety conditions, economic policy, authority boundaries, evidence trust roots, signing/release controls, branch-protection controls, or any semantically ambiguous change.

Path filters and CODEOWNERS can help route review, but cannot prove semantic non-interference. Changes to normative semantics require explicit stronger review; an eligible test or documentation label must never override that boundary.

## Required repository configuration

An administrator must apply and verify these settings in GitHub before describing Auto-merge as active:

1. Enable **Allow auto-merge** in repository settings.
2. Protect the intended target branch with a ruleset/branch protection rule.
3. Require pull requests and the agreed number/type of approvals; dismiss stale approvals when the head changes.
4. Require the exact named status checks selected for the protected branch, including the dedicated evidence-gate check once it is implemented and validated. Do not rely on a workflow that is skipped for some changed paths as the only required check.
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

The `scripts/contribution-evidence-gate.mjs` script and `.github/workflows/contribution-evidence-gate.yml` workflow now provide a pull-request classification check. The workflow is read-only, checks out the PR base commit rather than contributor code, retrieves the current PR and complete changed-file inventory, fails closed on stale events, missing declarations, placeholders, or known normative/control-plane paths, and emits a run summary. Workflow B also runs deterministic self-tests for the gate. This does not prove semantic non-interference, adjudicate human challenges, or certify the PR's declared tests; existing CI and repository review protections remain separate conditions.

The evidence-eligibility check is **not yet configured as a required branch-protection check**, and the repository currently reports `allow_auto_merge = false`. No live representative PR has yet demonstrated the full process. The public contribution workflow and Auto-merge plan therefore remain drafts until CI self-tests pass, the workflow is exercised on representative PRs, and an administrator applies and verifies repository settings. The GitHub integration available for this work does not permit those administrative settings to be changed directly.
