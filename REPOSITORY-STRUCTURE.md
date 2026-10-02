# Repository Structure

IMMORTAL is maintained as a layered monorepo.

## Top-level domains

- `IMMORTAL/` — universal protocol semantics, state model, kernel, governance and protocol documentation.
- `Adapter/` — execution-environment adapters; Cardano is the current adapter.
- `PRE-RICH/` — PRE-RICH application code, on-chain code, tests and application documentation.
- `audit/` — reproducible audit/integration runners and evidence-oriented fixtures.
- `verification/` — protocol verification tooling and machine-readable verification evidence.
- `plutus/` — shared Cardano/Plutus source and build/export material spanning protocol, adapter and application layers where the current Cabal workspace requires cross-layer compilation.
- `relayer/` — reference operational relayer components.
- `poc/` — proofs of concept and experimental evidence extraction.
- `blockfrost-proxy/` — separately classified infrastructure component.

## Root web workspace

The repository currently contains a multi-page Vite web workspace at the root. It is intentionally mixed for build-system compatibility and must be treated as two logical surfaces:

### IMMORTAL public surface

These pages present the protocol, its architecture, research, evidence boundaries and public status:

- `index.html`
- `protocol.html`
- `algorithm.html`
- `mathematics.html`
- `code.html`
- `adapters.html`
- `ecosystem.html`
- `governance.html`
- `documentation.html`
- `community.html`
- `status.html`
- `read.html`
- `map.html`
- `research.html`
- `verification-lab.html`

### PRE-RICH application/runtime surface

These pages and the current TypeScript web workspace serve the PRE-RICH application, Cardano observation and application-facing tooling:

- `dapp.html`
- `first-user.html`
- `preprod-treasury.html`
- `state-explorer.html`
- `playground.html`
- `timeline.html`
- `threat-model.html`
- `src/`
- `assets/`
- `public/`
- `__tests__/`
- `site.css` is shared by the current public HTML surface.

The root `vite.config.ts`, Node manifests and related configuration are repository-level build glue for this workspace.

This mixed root layout is temporary. The intended direction is an atomic migration that separates the IMMORTAL public web surface from the PRE-RICH application web surface, but that migration must wait until every Vite, TypeScript, CI, script, asset and HTML consumer has been audited and verified together.

## Root policy

The root is reserved for:

1. repository-wide governance and contributor files;
2. repository-wide documentation entry points;
3. build/package manifests required by the current monorepo/toolchain;
4. files that are genuinely shared across layers;
5. the current multi-page web workspace until its atomic migration.

Layer-specific artifacts must not be added to the root merely for convenience.

## Cleanup rule

Before moving or deleting a file, triangulate repository references and available evidence. Prefer path-preserving moves for active artifacts. Do not move an active build input without updating and verifying every consumer. Legacy snapshots should not remain beside active source merely as informal backups; Git history is the recovery mechanism.

## Current cleanup checkpoint — 2026-09-30

This structural pass:

- confirmed the normalized `PRE-RICH/` layout: `src/`, `onchain/`, `tests/`, `docs/`, plus token metadata;
- confirmed no `PRE-RICH/profile/` tree remains;
- removed the orphaned legacy `src/PreRichProjectsPrize.hs` from the active web workspace;
- removed two obsolete `.m04-backup-20260913-205821` snapshots from `plutus/`;
- confirmed that `plutus/` is a legitimate cross-layer Cardano/Plutus build workspace rather than a simple PRE-RICH directory;
- clarified the logical separation between the IMMORTAL public web surface and the PRE-RICH application/runtime surface;
- retained the current root web workspace intentionally because the Vite multi-page build consumes those root paths;
- made no economic, protocol, validator, or runtime identity change.

## Remaining structural work

The main remaining structural task is an **atomic migration of the root web workspace** into explicit logical surfaces (for example `web/` for the IMMORTAL public surface and `PRE-RICH/web/` for the application surface).

That migration is deliberately deferred until all path consumers have been enumerated and a single migration can update and verify Vite, TypeScript, tests, CI, scripts, assets and HTML together. It should not be done as piecemeal file moves.
