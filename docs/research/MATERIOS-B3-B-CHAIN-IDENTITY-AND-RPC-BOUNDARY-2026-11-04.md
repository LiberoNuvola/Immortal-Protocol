# Materios B3-B — chain identity and RPC evidence boundary (2026-11-04)

**Status: B3-B remains OPEN.** This is a read-only investigation record, not a protocol decision or proof of the exact B3-B target.

## Exact target preserved

The B3-B target remains exactly the one pinned in `AGENTS.md`:

| Field | Required value |
|---|---|
| Receipt | `0x552e9e621ad05f0b824b24c36d71b87afbd65387316b7be7406df57d3a598871` |
| Certification hash | `0x78c0bbd6a33dd38009858d540b70e02c756f352ffce30bb4feaa0251e161aa8a` |
| Receipt block | `1856393` |
| Checkpoint leaf/root | `0x807c464cc9064a73e22d07cbaba9f05a07eaa12a7fba68539d2654c704ba941c` |
| Anchor block | `1856408` |
| Anchor hash | `0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e` |
| Anchor id | `0x01b459db196564ea1768e71663b4caa2439279839c52e758f605a5fbd6026b55` |
| Storage key | `0xf2f45ef88f71bc25f444a160450145be2893c8b379803be566c94f4bfeab5cb26c42575af239d32de4c42a85bada380301b459db196564ea1768e71663b4caa2439279839c52e758f605a5fbd6026b55` |

No target, receipt, anchor hash, block number, or storage key was substituted.

## Chain identity finding

The upstream Materios pin recorded by the previous B3-B setup is `076964a0c117640a83aa1f13ace681a89b428611` (commit dated 2026-10-03). In that source, `partnerchain/node/src/command.rs` resolves `--chain preprod` to `chain_spec_preprod::preprod_config()`.

The inspected upstream `main` at `7d5c36e7dcd60824d84353e93df5d4a03c9c6c30` (2026-10-21) is 90 commits ahead of that pin. Its `partnerchain/node/src/chain_spec_preprod.rs` defines `PREPROD_V6_GENESIS` as:

`0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`

The same source explicitly documents that live Preprod v6 starts from its dedicated raw chain spec, **not** from `preprod_config()`. The upstream change that introduced the live-v6 genesis handling is [33e5606f08a1839116b83f73e36afa8d67c0a938](https://github.com/Flux-Point-Studios/materios/commit/33e5606f08a1839116b83f73e36afa8d67c0a938), dated 2026-10-20.

**Consequence:** the old recipe “build the 2026-10-03 pin and start it with `--chain preprod`” has not been shown to load the live Preprod-v6 genesis. Do not run an expensive sync using that recipe until the generated genesis identity is compared with the live-v6 genesis and the target block history. This finding is a chain-identity HOLD, not proof that the B3-B target belongs to another chain.

References:
- [Pinned upstream source](https://github.com/Flux-Point-Studios/materios/tree/076964a0c117640a83aa1f13ace681a89b428611/partnerchain/node/src)
- [Inspected upstream tip](https://github.com/Flux-Point-Studios/materios/tree/7d5c36e7dcd60824d84353e93df5d4a03c9c6c30/partnerchain/node/src)
- [Live-v6 genesis handling change](https://github.com/Flux-Point-Studios/materios/commit/33e5606f08a1839116b83f73e36afa8d67c0a938)

## Public RPC diagnostic — 2026-11-04

Commit `0d5e3d6fe24d88e73bdd2a664cf46d2c7e1b98c8` ran the existing Materios evidence workflows.

The public endpoints `/rpc` and `/preprod-rpc` returned the same finalized-head hash in the justification-capability probe. Across the scanned window 2,578,693–2,579,461 (769 blocks), `chain_getBlock` exposed no GRANDPA `FRNK` justification. Both `grandpa_proveFinality` and `grandpa_subscribeJustifications` returned method-not-found. The uploaded artifact `materios-grandpa-witness-diagnostic` therefore records `BLOCKED_GRANDPA_RPC_METHODS_NOT_EXPOSED`, with `cryptographic_finality_verified=false`. This establishes an RPC capability limitation; it does **not** establish that the chain has no GRANDPA finality.

The finalized-state capture artifact observed block 2,579,460 and GRANDPA set id 4550 with five authorities. Its finality proof is unavailable (`grandpa_proveFinality: -32601`) and its selection-input commitment is null. The capture is not an independently verified finality witness.

## Live storage artifact — not the B3-B target

The successful `live-storage-proof` job produced a real Rust-verified storage packet, but for a different receipt:

- Receipt: `0xd5db6db7ef4f7e6b7d05e67cea6e5b48f8faa0f70ec5dd5838a5db3385897064`
- Certification block: `2579312`
- Certification block hash: `0xc8c86065b4840ecea25e96ddfa4356291c4bbab677ca03431d1a19783ff8ce81`
- Proof `at`: that same block hash; 10 proof nodes.
- Historical `System.Events` proofs were captured for blocks 2,579,311 and 2,579,312, then verified by the Rust storage-proof verifier.
- The decoded event signer set matched the events-indexer signer set; the observed attestation count reached threshold 3; the interval contained zero committee-mutation events.

The artifact explicitly does not independently verify GRANDPA finality, source-runtime canonicality, individual extrinsic signatures, or underlying attester signatures. It is useful evidence that the public RPC can return some recent historical state and read proofs, but it does not prove that the requested key at block 1,856,408 is retained or available.

## CI record for commit `0d5e3d6fe24d88e73bdd2a664cf46d2c7e1b98c8`

| Workflow | Result | Meaning |
|---|---|---|
| Documentation Link Check #3563 | SUCCESS | Documentation checks passed |
| Algorithmic Governability #5993 | SUCCESS | Existing boundary tests passed |
| Protocol Declaration #4835 | SUCCESS | Declaration checks passed |
| IMMORTAL Portability #3499 | SUCCESS | Portability/conformance tests passed |
| Flux Point DoD Pilot #393 | SUCCESS | Local DoD and native Materios verifier tests passed |
| Materios B3 execution-proof verifier #192 | FAILURE | GRANDPA witness step blocked because public RPC proof methods/justifications are not exposed; checkpoint TypeScript, Rust verifier, finalized-state capture, and live storage-proof jobs succeeded |
| Cardano Adapter Sale #5898 | CANCELLED overall | Frontend build succeeded and every listed economic-conformance test step completed successfully, but the workflow/job conclusion was cancelled; do not relabel it SUCCESS |

The successful live storage and finalized-state capture jobs are not equivalent to the exact historical B3-B anchor witness.

## Credential redaction correction

The capture script previously wrote the full `MATERIOS_ARCHIVE_RPC` URL into `rpc_endpoint` and printed it to the job log. Commit `0d5e3d6fe24d88e73bdd2a664cf46d2c7e1b98c8` changes this to persist and log only the HTTP(S) origin (scheme, host, port), or a generic redacted label for non-HTTP(S) inputs. URL userinfo, path, query, and fragment are excluded. The endpoint still remains unchanged for the actual RPC connection. This is credential hygiene, not evidence of a successful historical capture.

## Required next gate

Continue only in the existing branch and persistent Codespace workflow described in `AGENTS.md`:

1. Inspect Codespace CPU, RAM and disk before a full archive sync.
2. Resolve and pin the correct Materios source revision and exact raw Preprod-v6 chain spec. Do not silently replace the recorded pin or assume `--chain preprod` means live v6.
3. Offline, reproduce the genesis hash of the proposed node/spec and compare it with the live-v6 genesis `0x0e46…f7bf`. The target history must then independently establish that block number 1,856,408 maps to the exact pinned anchor hash.
4. Keep archive database and node state outside the repository; use archive pruning and loopback RPC in the persistent Codespace.
5. Run the existing `archive-rpc-preflight.mjs` against the exact target block hash and storage key. Require non-null historical storage and a proof whose `at` is exactly the target hash.
6. Run the existing Rust verifier against the exact target header StateRoot, key, value and proof. Materialize the existing verified witness artifact.

If the target header or historical key is unavailable, report the exact RPC failure and stop. Never substitute the recent receipt, a later block, current state, or an unverified endpoint response.

## Scope and change record

- No IMMORTAL economic semantics, PRE-RICH semantics, V3, Reveal, B1, B2, Cardano state, or Materios network state changed.
- No node sync, registration, deployment wizard, ADA spend, or database operation was performed.
- Only the B3 capture script's endpoint redaction was changed in code; its commit is `0d5e3d6fe24d88e73bdd2a664cf46d2c7e1b98c8`.
- B3-B exact historical target: **OPEN / NOT CAPTURED / NOT VERIFIED**.
