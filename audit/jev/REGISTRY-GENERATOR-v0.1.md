# JEV Verification Registry Generator v0.1

## Purpose

Generate a schema-validated `immortal.jev-verification-registry.v1` document from explicit GitHub Actions step outcomes. The generator is isolated from Reveal, V3, and economic-kernel semantics.

## Input contract

```json
{
  "metadata": {
    "repository": "owner/repo",
    "commitSha": "40 lowercase hex chars",
    "ref": "refs/heads/branch",
    "workflowRunId": "string or null",
    "workflowRunUrl": "https://... or null",
    "runAttempt": 1,
    "executionContext": "devnet",
    "generatedAt": "optional ISO date-time"
  },
  "checks": [{
    "checkId": "STABLE.CHECK.ID",
    "requirementRef": "existing Gate/requirement",
    "stepOutcome": "success|failure|cancelled|skipped|unknown",
    "evidenceRefs": [{"kind":"workflow-run","uri":"https://..."}],
    "limitations": ["what this check does not establish"]
  }]
}
```

Optional `observedValue` and `expectedValue` fields are copied verbatim when supplied. The generator never scrapes arbitrary numbers or invents a measurement.

## Outcome mapping

| GitHub Actions outcome | Registry result |
|---|---|
| `success` | `PASS` |
| `failure` | `FAIL` |
| `cancelled` or `unknown` | `BLOCKED` |
| `skipped` | `NOT_RUN` |

A step outcome is not an overall workflow/protocol attestation. The summary is scoped to the checks present in the input. A separate Gate policy is required to determine mandatory checks and whether missing checks block promotion.

## Commands

```sh
node scripts/test-jev-verification-registry-generator.mjs
node scripts/jev-verification-registry-generator.mjs input.json output.json
node scripts/validate-jev-verification-registry.mjs output.json
```

## Safety boundaries

- No API credentials or GitHub API requests are used by this generator.
- It does not alter workflow source, validator source, Reveal/V3 semantics, or economic rules.
- It does not infer Reveal transaction size from arbitrary log text.
- PASS/FAIL requires explicit evidence references.
- Compare results with original step summaries/logs and packet hashes before workflow integration.
