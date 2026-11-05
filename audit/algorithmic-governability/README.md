# Algorithmic Governability — Adversarial Executable Lab v0.1

**Status:** NON-NORMATIVE / EVIDENCE HARNESS  
**Purpose:** executable evidence for the boundary already defined by the Algorithmic Governability canon.

## Scope

This lab does not define new economic or governance rules. It checks the following already-stated candidate properties:

1. **No Result-Dependent Authority:** a monitor result may not alter normative authority, the governing metric, the evidence contract, or the admissibility rule unless an explicitly pre-authorized institutional rule already permits that change.
2. **Search non-escalation:** a partial/adaptive search may not convert a partial coverage claim into a complete normative universe, widen its candidate domain, or weaken the immutable safe set merely because of search results.

3. **Contribution-acceptance boundary (research extension):** in a toy model, evidence eligibility is derived from declared class/scope, commit-bound evidence and required checks; challenge and deadline states do not grant a maintainer unilateral result-dependent authority.

The harnesses use deliberately small immutable toy objects. Passing them is evidence that the implementations preserve these boundaries in the modeled cases; they are not proofs of the entire protocol or guarantees that repository permissions enforce the modeled controls.

## Contribution-acceptance and GitHub Auto-merge model (research extension)

The `contribution-acceptance-boundary.mjs` toy model checks evidence eligibility, commit binding, challenge lifecycle and intended Auto-merge preconditions. It does not query live pull requests or configure GitHub permissions. Once the gate is present in the target/base branch, its live PR workflow runs this model alongside parser and path-policy fixtures. On the initial adoption PR, the trusted-base preflight correctly reports `BOOTSTRAP_REVIEW_REQUIRED` because it will not execute policy code supplied only by that PR. Repository rules must still enforce human approvals and required status checks.

## Evidence model

```text
Immutable Boundary
  ├─ Domain
  ├─ Rule
  ├─ Inputs
  ├─ Limits
  ├─ EvidenceContract
  ├─ Version
  ├─ Contestability
  └─ Exit

Explore → CandidateSet
Certify → admissible / rejected / unverifiable
Adopt → only if Certify(admissible)
```

The lab intentionally gives two monitors identical observations but different derived metrics. The selection rule is predeclared and does not grant either monitor new authority.

## Run

```bash
node audit/algorithmic-governability/no-result-dependent-authority.mjs
node audit/algorithmic-governability/contribution-acceptance-boundary.mjs
```

Expected result: all assertions PASS.

## Non-goals

- no new reward formula;
- no fee formula;
- no governance threshold;
- no economic parameter;
- no claim of cryptographic proof;
- no substitution for AG-01 canonical replay/finality evidence.
