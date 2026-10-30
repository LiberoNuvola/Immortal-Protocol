# Flux Point DoD Pilot — IMMORTAL

**Status:** repository-side pilot active; not a claim that every Flux Point feature is integrated or that the local agent runtime is installed.

## Upstream reviewed

- Repository: [Flux-Point-Studios/fluxpoint-plugins](https://github.com/Flux-Point-Studios/fluxpoint-plugins)
- Reviewed plugin manifest: `fluxpoint 1.49.0`
- Reviewed upstream source commit: `175c0a79f9a998b5fe1e212b511dd490ec06f4a8`
- Licence: Apache-2.0

The source review found a useful Stop-hook / per-edit DoD layer for Claude Code and Codex. It is an additional evidence gate, not a replacement for the repository's conformance workflows, Cardano ledger tests, Yaci measurements, or Preprod evidence.

## Runtime activation

The repository contains the upstream project-level activation snippets:

- Codex: `.codex/config.toml`
- Claude Code: `.claude/settings.json`

Each developer must install the marketplace/plugin once on their own machine.

Codex:

```sh
codex plugin marketplace add Flux-Point-Studios/fluxpoint-plugins
codex plugin add fluxpoint@fluxpoint
```

Claude Code:

```text
/plugin marketplace add Flux-Point-Studios/fluxpoint-plugins
/plugin install fluxpoint@fluxpoint
```

These commands were **not** executed by GitHub Actions or by this repository change. The project settings enable the plugin after it is installed; they do not install it. Therefore this pilot does not claim that Stop or PostToolUse hooks are already active on a developer workstation.

The upstream review commit above is a review reference, not a machine-enforced version pin. Check the installed plugin version before relying on a later marketplace update. Do not run `/fluxpoint:init` blindly: this repository already owns a tailored harness and verification workflows.

## Repository gate

- Gate declaration: `.fluxpoint-gates.json`
- Harness: `scripts/harness.sh`
- Workflow: `.github/workflows/fluxpoint-dod-pilot.yml`

The full local contract runs:

1. root TypeScript typecheck;
2. Vitest suites explicitly discovered under `src/`, `Adapter/`, and `PRE-RICH/`;
3. Node-native `node:test` suites through `tsx --test`, plus the top-level Genesis Treasury assertion file through `tsx`;
4. frontend build;
5. layer-boundary, economic-mutator-surface and RF8 production-boundary audits;
6. IMMORTAL finite-model checks;
7. Materios B3-C TypeScript typecheck and execution-proof / exact-block tests;
8. documentation link check.

The pilot workflow additionally runs Rust formatting verification and `cargo test` for `poc/materios-execution-verifier`.

The `--changed <file>` path dispatches to the file's native test runner: Vitest for Vitest suites, `tsx --test` for Node-native suites, and direct `tsx` execution for the top-level Genesis Treasury assertion fixture. Haskell-dependent differential tests remain fail-closed when invoked without their GHC/Cabal toolchain.

## Verified CI evidence

Two exact-head CI runs now exercise the pilot:

- [Flux Point DoD Pilot #41010532616](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010532616) completed **SUCCESS** at source commit `1e53f8967e9f58059a8725f28fd9d70321a1b9c8`. It passed the full harness, Rust formatting check and Materios execution-verifier tests.
- [Flux Point DoD Pilot #41010944867](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41010944867) completed **SUCCESS** at source commit `38a13d8acf77479d2934d521b1802c47e757f750`. Its exact step record confirms root and checkpoint dependency installation, full harness, scoped Node-native gate, scoped Vitest gate, Rust formatting, and native Materios execution-verifier tests all completed successfully.

The second run also exercised the dedicated scoped-edit regression test added to the workflow. A green workflow proves that these declared commands ran and passed at the recorded source SHA; it does not mean the Claude/Codex plugin was installed on developer workstations or that the upstream Flux Point feature set is complete.

The first run followed fixture-only corrections in:

- `src/__tests__/immortal-cardano-replay.test.ts`: expected class caps now match the declared authoritative cap, and a Reveal observation preserves issue counters for unaffected classes;
- `src/__tests__/immortal-prerich-reveal-transaction-fixture.test.ts`: the active saleable class has a cap above its issued count.

No code in the V3 projection, Reveal implementation, economic kernel or on-chain validators was changed by those corrections.

## Explicit exclusions and remaining work

This pilot deliberately does **not** claim to run or prove:

- Haskell/Plutus builds or generated Haskell–Aiken parity;
- Yaci/ledger execution, complete transaction CBOR size, or measured execution units;
- Cardano Preprod deployment or an authoritative PRE-RICH Issue;
- the Flux Point Aiken eUTxO attack taxonomy;
- CIP-57 builder/blueprint conformance or the Plutus budget ratchet;
- optional Blaster verification or Flux Point graph-mode execution.

Those predicates remain with their dedicated existing workflows/evidence gates or require a separately reviewed mapping to repository tests. In particular, the Flux Point compiled-script-size check is not a substitute for full signed-transaction CBOR measurement, and CIP-57 shape conformance is not validator or ledger correctness.

There is not yet a root `WORK.md`, locked `.fluxpoint-spec.json`, attack taxonomy, budget manifest or blueprint manifest. These are intentionally not fabricated: each needs a precise obligation-to-test mapping and review. The current pilot is loop-gate plumbing plus the repository's existing checks, not a complete rollout of every Flux Point feature.

## Safety boundary

The DoD harness is part of the local trust base and can be changed by repository contributors. Keep independent GitHub Actions required on protected branches and require review of changes to the harness, gate declarations, baselines and future waivers. A green harness is evidence that its declared commands ran and passed; it is not a cryptographic guarantee against a modified harness.
