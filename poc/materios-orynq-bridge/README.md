# Materios Orynq evidence bridge

This optional bridge publishes an already-captured B3-B anchor-state witness as an Orynq/Materios blob receipt. It does **not** replace the repository's Rust storage-proof verifier, the independent GRANDPA verifier, or Cardano's economic enforcement layer.

## Requirements

- Node 22 and the pinned dependencies from this package's lockfile.
- Rust/Cargo, because the CLI re-runs `poc/materios-execution-verifier` against the exact state root, storage key, returned value and proof nodes before showing a plan or submitting.
- A `MateriosB3AnchorStateWitness.verified.json` artifact from the B3-B proof workflow.
- For a live transaction only: operator-managed Preprod RPC URL, local signer URI and blob gateway URL.

Install and typecheck:

```powershell
npm ci --prefix poc/materios-orynq-bridge
npm --prefix poc/materios-orynq-bridge run typecheck
npm --prefix poc/materios-orynq-bridge test
```

## Dry-run

Place the verified witness artifact at the default path:

`poc/materios-checkpoint/out/MateriosB3AnchorStateWitness.verified.json`

Then run:

```powershell
npm --prefix poc/materios-orynq-bridge run anchor
```

An alternate input path can be supplied after `--`; relative paths are resolved from the repository root. Even dry-run mode re-runs the Rust storage-proof verifier. It prints the normalized payload's content hash, receipt ID, chunk count and chunk Merkle root, but does not connect to Materios or submit a transaction.

The payload omits the RPC endpoint, capture timestamp and unrelated fields. It binds the exact block hash, block number, state root, storage key, returned AnchorRecord bytes and the proof bytes/nodes.

## Live submission — explicit opt-in

Live submission consumes a transaction fee and can upload the evidence blob. Keep the signer URI in the operator's local environment; do not commit it or share it with agents. Blob upload authentication uses request-bound local sr25519 signatures, not a shared raw gateway API key.

Set the values from the operator's approved Preprod configuration in PowerShell:

```powershell
$env:MATERIOS_RPC_URL = '<operator-configured Materios Preprod WebSocket RPC>'
$env:MATERIOS_SIGNER_URI = '<locally managed signer URI or mnemonic>'
$env:MATERIOS_BLOB_GATEWAY_URL = '<operator-configured Materios blob gateway URL>'
$env:MATERIOS_CONFIRM_SUBMISSION = 'YES'
npm --prefix poc/materios-orynq-bridge run anchor -- --submit
```

Add `--wait-for-anchor` to also wait for the downstream L1 checkpoint anchor. It is deliberately not the default because it can take longer than receipt inclusion/certification.

The SDK 0.6.2 path submits the Merkle root of the uploaded chunk hashes for a blob receipt; the caller's content hash is not treated as that chunk root. The bridge deliberately omits `schemaHash`: a nonzero schema discriminator is not assumed to enable semantic-root certification on the deployed committee.

## What a successful result does and does not prove

A successful result records on-chain receipt confirmation and the observed certification/anchor fields returned by the SDK. It does **not** by itself establish:

- independent GRANDPA finality or authority-set provenance;
- trustworthiness of the upstream RPC's finalized-head claim;
- a valid B3-A light-client proof;
- economic admission, EEV qualification, ticket issuance or payout authority.

Those gates remain separate and fail-closed. CI only typechecks and tests deterministic payload construction; it never sends a live Materios transaction.
