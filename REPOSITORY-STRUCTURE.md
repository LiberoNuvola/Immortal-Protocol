# Repository Structure

IMMORTAL is maintained as a layered monorepo.

## Top-level domains

- `IMMORTAL/` — universal protocol semantics, state model, kernel, governance and protocol documentation.
- `Adapter/` — execution-environment adapters; Cardano is the current adapter.
- `PRE-RICH/` — current application, including application policy, profile and application documentation.
- `audit/` — reproducible audit/integration runners and evidence-oriented fixtures.
- `verification/` — protocol verification tooling and machine-readable verification evidence.
- `plutus/` — Cardano/Plutus source and build/export material.
- `relayer/` — reference operational relayer components.
- `poc/` — proofs of concept and experimental evidence extraction.
- `blockfrost-proxy/` — separately classified infrastructure component.
- `assets/`, `src/`, `public/`, and the root Vite/Node manifests currently form the active PRE-RICH web application workspace. They remain at repository root for build-system compatibility until the application workspace is migrated as one atomic, path-audited unit.

## Root policy

The root is reserved for:

1. repository-wide governance and contributor files;
2. repository-wide documentation entry points;
3. build/package manifests required by the current monorepo/toolchain;
4. files that are genuinely shared across layers.

Layer-specific artifacts must not be added to the root merely for convenience.

## Cleanup rule

Before moving a file, triangulate GitHub, Notion and available evidence. Prefer a path-preserving move over recreation. Do not move an active build input without updating and verifying every consumer.

## Current cleanup checkpoint — 2026-09-21

This pass removes only unambiguous root strays:

- legacy/generated root Plutus `out/` artifacts;
- obsolete root `lucid-global.js` not referenced by the current web entrypoint;
- P2.8-B topology probes into `audit/cardano-integration/p2.8/`;
- captured Cardano datum evidence into `audit/cardano-integration/fixtures/`;
- PRE-RICH token metadata into `PRE-RICH/`.

The root `docs/` tree and active web workspace are deliberately not moved in this pass because they require a complete consumer/path audit. No semantic or economic rule is changed by repository hygiene work.
