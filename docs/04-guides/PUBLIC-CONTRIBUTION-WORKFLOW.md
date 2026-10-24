# Public Contribution Workflow — Evidence-Gated Acceptance

**Status:** NON-NORMATIVE / PROCESS PROPOSAL  
**Version:** 0.2-draft  
**Date:** 2026-10-21  
**Related:** `CONTRIBUTING.md` · `ROADMAP.md` · [`GITHUB-AUTO-MERGE-INTEGRATION.md`](GITHUB-AUTO-MERGE-INTEGRATION.md) · Constitution §§10, 12 · `audit/algorithmic-governability/` · GOV-* evidence and replay documents

> This guide proposes a public process. It does not create protocol semantics, economic authority, a right to bypass mandatory checks, or an automatic merge mechanism. It remains a draft until explicitly adopted and implemented.

## 1. Purpose and governing distinction

IMMORTAL treats governance as an evolution mechanism, not ownership. Contribution handling should be predictable and contestable, with evidence and layer boundaries doing as much of the decision work as practicable.

Keep these questions separate:

1. **Evidence:** What can be reproduced or verified?
2. **Conformance:** Does the change satisfy the applicable declared requirements?
3. **Process eligibility:** Does this PR fit the narrow evidence-gated class?
4. **Repository action:** Can the PR be merged under the repository's actual branch protections and permissions?

Passing one question does not silently answer the others. In particular, evidence-complete status is not a claim that all security risks have been eliminated, and it cannot itself grant write permission or force GitHub to merge a PR.

## 2. Contribution classes

### 2.1 Candidate classes for the evidence-gated path

A PR may claim this path only when its entire effective change remains within one or more of these classes:

| Class | Eligible examples | Boundary |
|---|---|---|
| **A — Non-normative documentation** | Cross-links, glossary, reader guides, typo fixes, clarifications explicitly marked non-normative | Must not alter the meaning of normative predicates by implication |
| **B — Audit and evidence tooling** | Audit harnesses, evidence collection, deterministic reporting, CI diagnostics | Must not redefine what counts as authoritative evidence |
| **C — Tests and conformance vectors** | Tests that encode already-declared behaviour; regression vectors | Must not smuggle in a new normative rule through the test oracle |
| **D — Process documentation** | Contribution guidance, issue templates, workflow documentation | Must not silently change constitutional or economic policy |
| **E — Residual-obligation records** | Updating an obligation status or attaching reproducible evidence | The status change must cite the evidence and preserve unresolved uncertainty |

A PR touching multiple classes must satisfy the requirements of every claimed class. If classification is ambiguous, it is not eligible until the ambiguity is resolved.

### 2.2 Excluded from pure evidence-gating

The following require the existing stronger review and evidence path; they cannot be promoted into the reduced-review class merely by adding tests:

- Constitution, Economic Kernel, other normative `[M]` predicates, or files designated as normative;
- changes to `Safe`, `Ω`, `T`, the obligation partition, or mandatory safety conditions;
- changes to universal semantics, authority boundaries, upgrade/migration contracts, or conformance definitions;
- application policy that could leak into universal semantics, including rules affecting payout, protection, liabilities, or crystallised rights;
- changes to evidence authority, trust assumptions, release trust roots, signing keys, or branch-protection controls;
- generated or vendored changes whose provenance cannot be established.

A test-only PR is excluded if its expected result changes the meaning of a normative requirement. File paths alone do not determine eligibility: reviewers must consider semantic effect.

For repository automation, the live evidence gate reports known normative and governance-control-plane changes as `STRONGER_REVIEW_REQUIRED`. The gate remains failing until an authorized maintainer records stronger-review clearance with the exact head-bound label `governance/strong-review-cleared-<first-12-hex-of-current-head>`. This clearance does not make the PR eligible for the reduced path and does not replace the required GitHub approval or other required CI checks. Any new head invalidates the clearance label.

**Current enforcement limitation (verified 2026-10-21):** the active `Protect main` ruleset currently has zero required approving reviews and an empty required-status-check list. The phrases “required GitHub approval” and “required CI checks” above describe controls that must be configured before adoption; they are not yet enforced by that ruleset. Until then, the head-bound labels record the process disposition but do not provide independent review or required-check enforcement.

## 3. Evidence package

A PR claiming the evidence-gated path must include this declaration in its description. Mark each item accurately; do not check a box merely because a workflow exists.

```text
### Evidence-Gated Contribution Declaration

- Layer: [Universal | Adapter | Application | Process | Audit]
- Class: [A | B | C | D | E; multiple classes use comma or +, e.g. A, C]
- Normative status: [Non-normative | Normative/uncertain — evidence-gated path not claimed]
- Purpose and claimed effect:
- Affected files / areas:
- Invariants, predicates, interfaces, or evidence contracts touched:
- Explicitly unchanged boundaries:
- Evidence:
  - Evidence-bound commit SHA: [exact current PR head SHA; refresh after every commit]
  - Reproduction command(s):
  - Required CI workflow/run links:
  - Test/vector names and results:
  - Evidence artifact or digest, if applicable:
- Residual-obligation impact: [None | Updated, with links | Unresolved]
- Compatibility / migration impact:
- Provenance of generated or copied material:
- Known limitations and untested claims:
- Why this PR qualifies for class A/B/C/D/E:
```

For a documentation-only change, tests may be inapplicable; say so rather than inventing a test result. For tests and audit tooling, include reproducible commands and expected outputs. Evidence should identify commit SHA and environment where relevant. A green CI badge is not a substitute for identifying what the workflow actually tests.

### 3.1 Initial automated eligibility check

The initial gate implementation is `scripts/contribution-evidence-gate.mjs`, invoked by `.github/workflows/contribution-evidence-gate.yml`. It reads the PR metadata and paginated changed-file inventory through a read-only GitHub token, checks out the base commit rather than contributor code, and fails closed if the event is stale, required declaration fields are missing, the evidence-bound SHA differs from the current PR head, or a changed path is outside the declared class boundary.

The first path mapping is deliberately narrow: A is limited to `README.md`, `docs/README.md`, and `docs/EXECUTIVE-SUMMARY.md`; other documentation paths do not qualify as class A by extension alone and need stronger review unless covered by an explicit class D process-documentation boundary. B is audit tooling and selected scripts outside the governance-control plane; C is test/conformance/fixture paths; D is contribution/process documentation; E is explicitly named residual-obligation records. Every changed file must match at least one declared class. Known normative files, the gate itself, governance lab, workflow files, and contribution-policy documents require stronger review regardless of the self-declared class. The current conservative routing also sends `IMMORTAL/kernel/`, `IMMORTAL/docs/`, `PRE-RICH/docs/`, `Adapter/*/docs/`, `docs/01-contracts/`, `docs/02-certification/`, `docs/architecture/`, governance formal records, and files whose name contains `NORMATIVE` or `CONFORMANCE` to stronger review. This intentionally favors false positives over silently allowing authoritative specifications through the reduced path; it is still only a path filter, not a proof of semantic non-interference.

This is an initial process classifier, not a semantic proof. It cannot decide whether arbitrary prose or code has a hidden normative effect, and it does not replace required CI checks, review approval, security triage, or branch protection. The check must not be treated as a required merge condition until the workflow has been validated on representative PRs and the repository rules are deliberately configured.

## 4. Eligibility and status states

The following are proposed public labels for discussion, not yet an implemented GitHub automation contract:

- **CLAIMED:** author requests evidence-gated handling and supplies the declaration.
- **INCOMPLETE:** a specific required declaration item or reproducible artifact is missing.
- **ELIGIBLE:** scope is within an allowed class and required evidence is present and internally consistent.
- **CHALLENGED (OPEN / UNDER_REVIEW):** a concrete defect, scope mismatch, security concern, or counter-evidence has been stated; Auto-merge is blocked.
- **ESCALATED:** a challenge passed its response window without disposition; it remains blocking and needs a recorded next action.
- **SECURITY_HOLD / SECURITY_ESCALATED:** a sensitive security concern is being triaged privately; the hold remains blocking until an authorized disposition is recorded.
- **RESOLVED_NO_BLOCKER:** a reasoned disposition found no merge-blocking issue and is bound to the current head.
- **RESOLVED_FIXED:** a blocker was corrected on the current head; evidence and required checks are current.
- **UPHELD:** a challenge established a blocker for the affected head; that head is not eligible for Auto-merge.
- **PROCEDURALLY OVERDUE:** the contribution response window elapsed without a substantive response or a documented reason for delay. This records delay; it does not imply approval, rejection, or automatic merge.
- **OUT OF SCOPE:** a reasoned classification explains why stronger review is required.
- **CLOSED / WITHDRAWN:** the PR was closed or withdrawn, with its public record preserved.

Eligibility is a process classification, not a conformance certificate. It must not be inferred solely from the absence of comments or from a green workflow.

## 5. Review and challenge protocol

For eligible PRs, reviewers should focus on the declared boundary and evidence rather than re-opening settled preferences unrelated to the change.

A substantive challenge should state at least one of:

1. a missing or irreproducible evidence item;
2. a failing declared check or a counterexample;
3. a specific layer-boundary or normative-scope violation;
4. a compatibility, provenance, security, or licensing concern;
5. a concrete reason the contribution is misclassified.

Where feasible, the challenge should link to the affected line, invariant, test, or artifact and describe what would resolve it. “I do not like this change” is feedback, but by itself is not an evidence-based conformance objection. Conversely, evidence completeness does not require a maintainer to ignore a credible security report.

The author must have a reasonable opportunity to answer a challenge. The public record should distinguish unresolved technical objections from scheduling delay, reviewer disagreement, and repository-permission constraints.

### 5.1 Challenge lifecycle and Auto-merge effect

A valid challenge has an explicit lifecycle; it is neither an unlimited silent veto nor something a deadline can erase.

- **OPEN / UNDER_REVIEW:** a qualifying challenge has been recorded. Auto-merge is blocked.
- **ESCALATED:** its response window elapsed without a disposition. It remains blocking; the record must identify the next action and, where practical, a next review date.
- **SECURITY_HOLD / SECURITY_ESCALATED:** the report may be handled privately to avoid exposing exploit details. It remains blocking until an authorized disposition is recorded; deadline expiry does not clear it.
- **RESOLVED_NO_BLOCKER:** a reasoned disposition finds no merge-blocking issue. The record must be tied to the current head commit.
- **RESOLVED_FIXED:** a blocker has been corrected on the current head. Evidence and required checks must be rerun or reconfirmed for that head.
- **UPHELD:** the challenge established a blocker. The affected head is not eligible for Auto-merge; any correction requires a new evaluation.

Only a recorded disposition tied to the current head can clear a valid challenge for the reduced merge path. In the current repository gate, an authorized maintainer records this disposition using exactly `governance/challenge-cleared-<first-12-hex-of-current-head>` and removes the active challenge/hold label; the gate rejects stale or ambiguous clearance labels. The disposition should state the category, rationale, relevant evidence, and who made the repository-process decision. For sensitive security cases, a public non-sensitive summary may replace the details. This label convention is enforced through repository permissions and is not cryptographic proof; required GitHub review remains separate.

An overdue challenge must never be converted automatically into approval or rejection. If nobody adjudicates it, the PR stays blocked and its unresolved status remains visible. This exposes a stalled decision but cannot, by itself, eliminate stalling. Independent appeal requires additional authorized reviewers or a future community process; the repository must not claim those exist until they are actually available and configured.

### 5.2 Initial GitHub label convention

The live evidence gate recognizes these hold labels: `governance/challenged`, `governance/escalated`, `governance/security-hold`, `governance/security-escalated`, and `governance/upheld`. Any active hold blocks the reduced path. These labels are a process signal, not a cryptographic proof or an independent adjudication.

After a disposition is recorded with its rationale, relevant evidence, decision-maker and current head SHA, an authorized maintainer may remove the applicable hold label and apply `governance/challenge-cleared-<first-12-hex-of-head-SHA>`. The classifier requires exactly one clearance label and verifies its SHA prefix. A new commit makes a previous clearance label stale and blocks the reduced path until the disposition is re-evaluated. A clearance label must never be added merely because a timer expired.

The classifier recognizes the label names; repository labels must be created/configured and the procedure followed manually. Label presence does not create independent review where the repository has no independent reviewer.

## 6. Response windows and stalled PRs

To make indefinite silence visible, this draft proposes the following **provisional targets for community review**, not yet binding service guarantees:

- acknowledge or classify a claimed evidence-gated PR within **7 calendar days**;
- provide an eligibility decision or a specific list of missing items within **14 calendar days**;
- if the PR remains unresolved beyond that window, record the blocker and next action publicly, or mark it **PROCEDURALLY OVERDUE**.

A documented reason—such as security triage, CI outage, unavailable upstream dependency, or a genuinely disputed boundary—may justify extending a window. It should identify the reason and a next review date where practical. Repeatedly resetting a clock without a new reason should not make a stalled PR appear timely.

These targets cannot guarantee a merge and must not be represented as already enforced. If the repository lacks independent reviewers or the technical ability to apply the process, that limitation must be stated rather than concealed.

## 7. Legitimate maintainer role

Maintainers retain operational responsibilities required by the actual repository configuration, including:

- preventing secret exposure, malicious changes, supply-chain compromise, and abuse;
- triaging credible security or licensing concerns, including private handling where disclosure would increase risk;
- checking that required branch protections and release-signing controls are not bypassed;
- ensuring the recorded commit is the one whose evidence was evaluated;
- resolving genuine ambiguity in process classification, with a written rationale;
- carrying out the merge or release action when authorized by repository permissions.

Maintainer status does not, by itself, confer authority to rewrite protocol semantics or to declare a failed predicate satisfied. A maintainer's operational veto should identify its basis. For urgent security cases, the public record may initially be minimal, with a non-sensitive explanation added when safe.

Where feasible, a maintainer who authored the contribution or has a material conflict should disclose it and seek another reviewer. This is a safeguard, not a claim that independent review is currently always available. If only one authorized repository maintainer is available, the process must say so: that maintainer may determine repository handling within the published process, but cannot turn that operational role into authority to waive protocol predicates or redefine normative semantics. The absence of an independent reviewer is a documented governance limitation, not a reason to simulate independence.

## 8. No result-dependent authority

The acceptance process must not allow the result of a contribution, test, reward, popularity measure, or maintainer preference to rewrite the rules that determine its own admissibility.

For example:

- a passing test may establish only the property that the test actually exercises;
- a popular PR does not gain normative authority from reactions or endorsements;
- a failing check cannot be reclassified as passing merely because the result is inconvenient;
- a maintainer cannot change the eligibility criteria after seeing a particular PR's result in order to favour or suppress that PR;
- evidence-gated eligibility cannot weaken mandatory safety predicates.

If process criteria need revision, propose the revision prospectively, document its rationale, and test it against adversarial cases. Do not apply a one-off exception as though it were a general rule.

## 9. Relationship to the algorithmic-governability lab

The existing `audit/algorithmic-governability` lab tests a limited toy model of No Result-Dependent Authority and search non-escalation. It does not currently prove that repository contribution acceptance is non-discretionary.

A proposed extension should model, at minimum:

- immutable eligibility criteria evaluated independently of PR popularity or outcome;
- a deterministic eligibility result from declared class, changed-scope inventory, required evidence, and check results;
- a maintainer challenge that must reference an allowed challenge category and evidence or state a legitimate security/process basis;
- no silent conversion of **ELIGIBLE** into **INELIGIBLE** without a recorded reason;
- no automatic promotion of **INCOMPLETE** or **CHALLENGED** to **ELIGIBLE** due to time, popularity, or pressure;
- deadline expiry produces **PROCEDURALLY OVERDUE**, not automatic merge or automatic rejection;
- changed commits invalidate or re-evaluate evidence tied to the previous commit;
- normative or ambiguous changes are routed to stronger review;
- fork/withdrawal remains possible without the canonical repository treating dissent as protocol non-conformance.

Adversarial cases should include a maintainer who dislikes a compliant PR, an author who falsely claims evidence completeness, a green but irrelevant test, a changed commit after a passing run, a genuine security concern, and an overdue PR with no substantive objection.

A passing toy model would show only that the modeled rules behave as intended. It would not prove that GitHub permissions, human behaviour, or the repository's entire governance process are free from discretion.

## 10. Forks, dissent, and reproducibility

The canonical repository may define its own acceptance process, but rejection or non-merge does not establish that a contribution is invalid in every fork. Forks may preserve, modify, or reject the proposal under their own declared process and licensing obligations.

For meaningful comparison, contributors should be able to identify the source commit, evidence artifacts, tool versions, and applicable criteria. Forkability is not a substitute for explaining decisions in the canonical repository; it is the escape hatch that prevents canonical maintainership from becoming exclusive ownership of the protocol.

## 11. Adoption and open questions

Before treating this guide as adopted policy, resolve and document:

1. whether the proposed 7/14-day targets are appropriate;
2. who may independently classify or challenge an eligible PR when the maintainer is also the author;
3. which checks are mandatory for each eligible class;
4. how to record a sensitive security hold without leaking exploit details;
5. whether status labels will be manual, bot-assisted, or backed by a deterministic audit script;
6. how changed commits invalidate evidence and reset response windows;
7. what observable event will justify marking the Roadmap item complete.

The next implementation step should be a small adversarial toy model in `audit/algorithmic-governability`, followed by a CI run and review of false positives/negatives. Until that exists and the process is explicitly adopted, the Roadmap item **Public contribution workflow hardened** remains open.

---

**Current claim:** this document is a non-normative proposal only. It does not assert that evidence-gated acceptance is implemented, that maintainer discretion has been eliminated, or that any PR is entitled to automatic merge.
