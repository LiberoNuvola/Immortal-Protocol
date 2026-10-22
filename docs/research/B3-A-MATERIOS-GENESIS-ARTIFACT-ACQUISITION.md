# Materios v6 genesis artifact acquisition

## Purpose

Acquire the byte-exact hosted release chain spec and its publisher checksum manifest on a machine with ordinary HTTPS access. The current ChatGPT web extractors cannot retrieve the manifest's raw bytes, and text extraction of the large JSON is not byte-preserving.

## Run

From the repository root, on a Linux/macOS shell with `curl` and `sha256sum`:

```bash
bash scripts/b3/fetch-materios-genesis-artifacts.sh
```

Or pass a destination directory:

```bash
bash scripts/b3/fetch-materios-genesis-artifacts.sh /secure/path/materios-genesis-v6
```

The script downloads `SHA256SUMS` and `chain-spec-v6-raw.json`, requires exactly one full 64-hex SHA-256 manifest entry for the exact filename, computes SHA-256 over the downloaded bytes, fails closed on mismatch, and records byte count, URLs, UTC acquisition time and digest in `ACQUISITION.txt`.

## Security interpretation

A matching digest establishes consistency with the downloaded manifest, not independent authenticity, because the manifest and JSON are served by the same host. Preserve the exact bytes, manifest, acquisition record, shell/tool versions and logs. Independently pin the intended genesis identity through a reviewed source or separate trust anchor.

Do **not** use the similarly named repository file `Flux-Point-Studios/materios/chain-spec/chain-spec-raw.json` as a substitute: the repository object is 614,373 bytes, while the release index lists `chain-spec-v6-raw.json` as 1,063,592 bytes. Do not hash a web-extracted or reformatted JSON string.

## Gate after acquisition

1. Independently validate the manifest entry and archive raw bytes plus SHA-256.
2. Pin a specific Substrate SDK/toolchain version and build/reconstruct the genesis storage/header.
3. Recompute and compare genesis hash to an independently reviewed expected identity.
4. Decode `pallet_grandpa::Authorities` from reconstructed genesis storage (and determine the initial set ID from the correct runtime/genesis semantics).
5. Record command lines, toolchain lock, outputs and reproducibility results before implementing any trusted-bootstrap constructor.

Until those steps are independently reproduced, authenticated bootstrap remains OPEN/BLOCKER. This script does not perform genesis reconstruction, does not authenticate authority state, and does not change production code or chain state.
