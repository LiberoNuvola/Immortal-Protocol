# Agent C mission — Materios B3-B archive node

## Mission

Work only on the existing branch `work/b3-materios-provenance-evidence`.

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

## 2026-11-04 chain-identity gate — historical v6 fixture identified; sync still held

The upstream chain-identity review is now more precise:

- The recorded pin `076964a0c117640a83aa1f13ace681a89b428611` is dated 2026-10-03 and declares runtime `spec_version: 240`.
- At that revision, `partnerchain/node/src/command.rs` maps the built-in alias `--chain preprod` to `chain_spec_preprod::preprod_config()`. Do **not** use that alias as the historical v6 identity check.
- The same pinned revision contains `tools/launch-preflight/fixtures/preprod-v6-raw.json.gz` (Git blob SHA `01ed435660aa8846fc0143894bdaa76d842a0d6a`). Its `test_launch_preflight.py` describes it as the raw chain spec published by the Preprod network and says its genesis hash was read from a live node. The test `test_genesis_hash_matches_the_live_preprod_genesis` asserts the computed genesis hash equals `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`.
- The same repository revision contains a separate generated fixture, `preprod-spec240-raw.json`; it is not the historical `preprod-v6-raw.json.gz`. Keep these artifacts distinct.
- The pinned `command.rs` accepts a chain-spec file path through `ChainSpec::from_json_file`. The intended route is therefore to decompress the historical v6 fixture and pass its absolute path to `--chain`.
- Upstream main `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` is 90 commits ahead and has a separate spec-243 builder fixture. Do not silently upgrade the source pin or substitute that fixture.

**HOLD:** the historical raw v6 fixture and its source-level genesis test are now located, but the pinned node binary has not yet been run offline against that exact file in this environment. Before an archive sync, decompress the fixture, run the pinned genesis test, and make the pinned `materios-node` load the file by path in an offline `build-spec` round-trip. Confirm the resulting genesis hash remains the live-v6 value above. Only then inspect Codespace capacity and start archive sync using the explicit raw-file path—not `--chain preprod`. B3-B remains OPEN until block 1856408 is independently shown to map to the exact target hash below.

This is a corrected chain-spec selection procedure, not proof that the B3-B target belongs to another chain or that the historical storage witness has been acquired.

The public Materios workflow probe on 2026-11-04 also found no GRANDPA justifications in 769 recent blocks and no exposed `grandpa_proveFinality` or `grandpa_subscribeJustifications` RPC method. This is a public RPC capability limitation, not proof that the chain lacks finality. Successful recent storage proofs for a different receipt do not close the exact B3-B historical target.

See [the 2026-11-04 chain-identity and RPC evidence record](../research/MATERIOS-B3-B-CHAIN-IDENTITY-AND-RPC-BOUNDARY-2026-11-04.md) for the upstream fixture/test references and the remaining gates.

## Codespace / node setup

1. Inspect the available CPU, RAM and free disk first. Do not start an expensive sync on an obviously undersized Codespace.
2. Use the Materios upstream repository `Flux-Point-Studios/materios`.
3. Use the reproducible pinned upstream revision `076964a0c117640a83aa1f13ace681a89b428611`; verify the checkout and use its historical `preprod-v6-raw.json.gz` fixture, not the generated `--chain preprod` alias.
4. Build `materios-node` from `partnerchain`, respecting the upstream `rust-toolchain.toml` and locked dependencies. If the upstream build needs a documented compatibility patch, follow the upstream build instructions rather than inventing a new patch.
5. Do NOT run the Materios registration/deployment wizard. We only need a syncing node for historical read access; do not spend ADA or mutate Cardano state.
6. After the offline fixture round-trip passes, start the partner-chain node with `--chain <absolute-path-to-preprod-v6-raw.json>` and enable archive state pruning. Never use the built-in `--chain preprod` alias for this historical chain. Prefer loopback RPC inside the Codespace while testing.
7. Use a dedicated persistent Codespace directory for the node database, separate from the Immortal repository worktree, so the repository never receives chain data.
8. Keep the node running while the historical target is acquired. Do not delete or purge the database once block 1856408 is reachable.

A suitable starting shape is equivalent to:

`materios-node --chain <absolute-path-to-preprod-v6-raw.json> --base-path <persistent-archive-path> --state-pruning archive --db rocksdb --rpc-port 9945 --rpc-methods safe`

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

- Stay on `work/b3-materios-provenance-evidence`.
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
