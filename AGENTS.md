# Codex operating instructions — Materios B3-B archive node

## Mission

Work only on the existing branch `work/immortal-green-closure`.

Primary objective: obtain and independently verify the historical Materios storage witness required to close B3-B for the exact anchor already recorded by this repository.

Do not invent economics, alter IMMORTAL economic semantics, or reopen V3/Reveal/B1/B2 semantics.

## Exact B3-B target

- receipt: `0x552e9e621ad05f0b824b24c36d71b87afbd65387316b7be7406df57d3a598871`
- certification hash: `78c0bbd6a33dd38009858d540b70e02c756f352ffce30bb4feaa0251e161aa8a`
- receipt block: `1856393`
- checkpoint leaf/root: `0x807c464cc9064a73e22d07cbaba9f05a07eaa12a7fba68539d2654c704ba941c`
- anchor block: `1856408`
- anchor hash: `0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e`
- anchor id: `0x01b459db196564ea1768e71663b4caa2439279839c52e758f605a5fbd6026b55`
- storage key:
  `0xf2f45ef88f71bc25f444a160450145be2893c8b379803be566c94f4bfeab5cb26c42575af239d32de4c42a85bada380301b459db196564ea1768e71663b4caa2439279839c52e758f605a5fbd6026b55`

## Existing pipeline to use

Do not replace the existing B3-B pipeline. Use:
- `audit/materios-b3/archive-rpc-preflight.mjs`
- `poc/materios-checkpoint/src/capture-anchor.ts`
- `.github/workflows/materios-b3-b-anchor-proof.yml`
- Rust verifier in `poc/materios-execution-verifier`

The preflight is authoritative for determining whether an RPC really serves the historical state required by B3-B.

## Codespace / node setup

1. Inspect the available CPU, RAM and free disk first. Do not start an expensive sync on an obviously undersized Codespace.
2. Use the Materios upstream repository `Flux-Point-Studios/materios`.
3. Use a reproducible pinned upstream revision. The repository currently records upstream tip `076964a0c117640a83aa1f13ace681a89b428611`; verify the repository state before using it.
4. Build `materios-node` from `partnerchain`, respecting the upstream `rust-toolchain.toml` and locked dependencies. If the upstream build needs a documented compatibility patch, follow the upstream build instructions rather than inventing a new patch.
5. Do NOT run the Materios registration/deployment wizard. We only need a syncing node for historical read access; do not spend ADA or mutate Cardano state.
6. Start the partner-chain node against the existing `preprod` chain and enable archive state pruning. Prefer loopback RPC inside the Codespace while testing.
7. Use a dedicated persistent Codespace directory for the node database, separate from the Immortal repository worktree, so the repository never receives chain data.
8. Keep the node running while the historical target is acquired. Do not delete or purge the database once block 1856408 is reachable.

A suitable starting shape is equivalent to:

`materios-node --chain preprod --base-path <persistent-archive-path> --state-pruning archive --db rocksdb --rpc-port 9945 --rpc-methods safe`

Do not add validator/registration flags unless the upstream preprod chain requires them for syncing.

## Synchronization and proof

1. Wait until the node can serve header block `0x7db6da...`.
2. Then run the existing archive preflight against `http://127.0.0.1:9945` (or the actual local RPC port) and require PASS.
3. Run the existing `capture:anchor` command with `MATERIOS_ARCHIVE_RPC` pointing to that local RPC.
4. Run the Rust verifier and require:
   - exact header StateRoot binding;
   - exact storage key;
   - exact returned storage value;
   - valid read-proof reconstruction;
   - no synthetic or hand-entered proof data.
5. Materialize the verified JSON witness under the existing `poc/materios-checkpoint/out` path.
6. Never commit the Materios chain database, RocksDB files, keystore, credentials, RPC secrets, or large node logs to Git.
7. If historical state is unavailable, fail closed and report the exact RPC failure. Do not substitute a newer block, a current-state query, a public RPC without historical state, or a fabricated witness.

## Acceptance criteria

Declare B3-B evidence GREEN only when all of the following are true:
- exact target block header is served;
- exact historical storage is non-null at that block;
- read proof is returned and bound to the same block hash;
- independent Rust verification succeeds against the header StateRoot;
- exact key/value extraction matches the proof;
- verified witness file exists;
- no repository semantics were changed.

If the node cannot reach the historical target because the available snapshot/database does not retain that state, do not force it. Diagnose whether a true archive sync or an archive-capable snapshot is required and stop at the evidence boundary.

## Git discipline

- Stay on `work/immortal-green-closure`.
- Do not create a new branch.
- Do not rewrite history.
- Do not modify V3, Reveal, B1 EEV, B2 semantics, or economic constants.
- Keep commits small and purpose-specific.
- Do not commit generated chain state.

## Final report

At the end, report:
- Codespace resources observed;
- upstream Materios revision used;
- exact node command actually used;
- sync status at block 1856408;
- preflight result;
- verifier result;
- witness path and size;
- any blocker, with the exact failing RPC call if blocked.
