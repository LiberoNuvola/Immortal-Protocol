# JEV Materios Ingress Runbook v0.1

**Purpose:** Build an IMMORTAL-owned JEV registry from a PoC-0 `CanonicalCheckpoint.json` artifact without modifying Materios.
**Status:** Executable path and synthetic pipeline tests pass. A live checkpoint must be supplied by an operator before this is a real Preprod observation.

## 1. Produce the checkpoint

Run the existing PoC-0 against the intended Materios node, using its existing documented interface:

```bash
cd poc/materios-checkpoint
MATERIOS_RPC="$MATERIOS_RPC" MATERIOS_CHAIN_ID=materios_preprod_v6 npm run poc0
```

The expected output file is `poc/materios-checkpoint/out/CanonicalCheckpoint.json`. Do not use the mock server for a claim of live Preprod observation. Preserve the original bytes as the artifact to be hashed.

## 2. Create JEV metadata

Create a local, uncommitted `jev-metadata.json` with actual values from the run. Never put RPC credentials, secret query parameters, or private data in the metadata.

```json
{
  "repository": "LiberoNuvola/Immortal-Protocol",
  "commitSha": "<40-character lowercase commit SHA that produced/collected this evidence>",
  "ref": "refs/heads/work/immortal-green-closure",
  "executionContext": "preprod",
  "workflowRunId": null,
  "workflowRunUrl": null,
  "runAttempt": null
}
```

The commit SHA is provenance metadata, not proof that the node's claims are true. If the checkpoint was generated outside GitHub Actions, leave run identifiers null rather than inventing them.

## 3. Build the registry

From the repository root, substitute the actual artifact URI and output paths:

```bash
node scripts/build-jev-materios-registry.mjs \
  --checkpoint poc/materios-checkpoint/out/CanonicalCheckpoint.json \
  --metadata ./jev-metadata.json \
  --source-uri 'https://<approved-immutable-artifact-reference>/CanonicalCheckpoint.json' \
  --expected-chain-id materios_preprod_v6 \
  --output ./jev-materios-registry.json
```

If no approved, immutable, retrievable artifact URI exists, do not fabricate one: preserve the file locally and establish an approved evidence reference before registering it. The URI is a provenance reference; the adapter computes SHA-256 from the exact local bytes, but does not fetch the URI to compare its content.

To enforce an explicit freshness policy, add `--max-age-seconds <configured-value>`. No universal freshness threshold is implied by this runbook. An expired or future-dated observation fails closed.

## 4. Interpret the result

For a valid observation-only checkpoint:
- `MATERIOS.CHECKPOINT.EXTRACTION` can be PASS for structural validation and configured chain identity only.
- `MATERIOS.ARTIFACT.DIGEST` means the digest was computed for the supplied bytes; it does not authenticate the producer or prove that a remote URI contains those bytes.
- `MATERIOS.GRANDPA.FINALITY`, `MATERIOS.STORAGE.PROOF`, and `MATERIOS.CANONICALITY` remain NOT_RUN unless separate, actual verifier results are added through a governed path.

The registry's overall result must therefore not be described as protocol GREEN or proof of Materios finality. The output path is created exclusively; remove or choose a new output path before rerunning.

## 5. Evidence to retain

Keep the original checkpoint, generated registry, SHA-256 of the original bytes, collection timestamp, configured network ID, source alias, PoC-0 commit, and any immutable artifact reference. Redact secrets. Record whether the source was live Preprod or a mock; mock evidence is test evidence only.
