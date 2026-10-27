# Materios P2P finality proof-source probe via Smoldot

Status: **PROOF-SOURCE POC / B3-A OPEN**.

This probe tests a source-agnostic path that does not require a Materios validator/full node, does not activate or modify a Materios node, and does not rely on the public RPC service to transport finality proofs.

## What it does

1. Downloads the published Materios raw preprod v6 chain spec and refuses to continue unless its exact SHA-256 matches the pinned digest.
2. Adds the already documented public P2P bootnode to an in-memory copy only. The downloaded source bytes and digest are preserved; genesis storage is not edited.
3. Builds Smoldot at pinned upstream PR commit c898452405be712c6037ad956464b3fe9f9907f4, which contains the proposed raw GRANDPA justification export via grandpa_subscribeJustifications and chain_getBlock.
4. Starts the Substrate light client, checks system_chain and the genesis hash against the pinned Materios v6 identity.
5. Uses the public HTTP RPC only as an untrusted block-hash discovery source, then asks Smoldot's P2P layer for the target activation block and nearby candidate commit blocks (including the approximate 60-block session boundaries). The HTTP RPC is never trusted for finality; every P2P-returned header is locally SCALE-encoded and hash-checked.
6. Supports both hex-string and byte-array representations of Smoldot's `chain_getBlock.justifications` wire format. It subscribes to justifications verified by the light client and records each candidate outcome, rather than repeatedly polling a single historical block and starving the RPC queue.
7. Records Smoldot's own native GRANDPA warp-sync log observations, including status, timestamp and reported block number. It deliberately does **not** call the legacy `system_health` RPC: run #8 showed that calls timing out and subsequent `chain_getBlock` requests timing out in the same process.
8. Derives a bounded `sync_log_assessment` such as `WARP_SYNC_STALLED_AT_FIXED_BLOCK` or `WARP_SYNC_ADVANCEMENT_OBSERVED`. It reports the observed block range and elapsed sample span. This is local diagnostic classification only; it cannot identify the underlying peer cause or make a finality claim.
9. Reconstructs a proof target header's SCALE bytes and checks Blake2-256(header) against the justification's target hash. It writes a JSON acquisition artifact without calling the proof canonical or verified by IMMORTAL.
10. When a descendant justification target is captured within the configured span, obtains the intervening headers from the pinned Smoldot RPC and verifies every header hash, block number and parent-hash edge from the exact storage-proof witness block to the justification target. The raw SCALE headers are preserved in the artifact for independent verification.

## Why this is the right boundary

Smoldot connects directly to Substrate P2P peers and verifies GRANDPA internally. The source is an untrusted transport, not an authority. The raw proof packet must still pass the existing IMMORTAL verification path from the pinned genesis trust anchor, including signature/quorum, ancestry, authority-set provenance, selection-input commitment and Materios-native execution proof.

The upstream change is an **open PR**, not a merged Smoldot release. This is a pinned feasibility probe, not a production dependency. The build must fail closed if the checked-out commit changes, if the chain-spec digest changes, or if the light client reports the wrong genesis.

## Explicit non-claims

A successful workflow means only that the P2P light-client path delivered at least one raw GRANDPA proof whose target header hash could be reconstructed and matched. It does **not** by itself prove:

- that the particular historical B3 authority transition has been captured (the artifact records this separately);
- that IMMORTAL independently verified the GRANDPA signatures and quorum;
- that authority-set transitions were authenticated back to genesis;
- that the Materios runtime's authority-selection execution proof was captured;
- that VerifiedAuthoritySetTransition was crossed;
- that B3-A is closed.

A live proof for a different block is useful proof-transport evidence, but is not a substitute for the exact historical transition witness. The target activation block has no GRANDPA digest of its own, so nearby descendant commit targets are probed. The acquisition script attempts a bounded, exact, sequential header bridge back to the storage-proof checkpoint; every header hash and parent edge is checked locally. This bridge links the blocks structurally but does not independently verify justification signatures/quorum or the authority-set transition.

## Reproducibility

Run workflow **Materios Smoldot P2P Finality Probe**. The action artifact includes the raw justification, target header JSON, reconstructed SCALE header bytes, hashes, source identities, target-specific result and explicit non-claims. Treat the artifact as immutable untrusted input for the existing verifier; do not cherry-pick or promote raw evidence without verification.

Pinned source references:

- Smoldot PR: https://github.com/paritytech/smoldot/pull/3369
- Smoldot issue: https://github.com/paritytech/smoldot/issues/3288
- Materios raw chain spec endpoint: https://materios.fluxpointstudios.com/releases/chain-spec-v6-raw.json
- Materios public P2P bootnode from the operator docs: /dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM


## Current B3 witness target

The automation default is the latest storage-proof-verified checkpoint at block `2464283` (`0xfc96cd4817f2dda1838c5271e7b60e50064c16c6a293c8e2611d17952d179ca2`). The P2P bridge limits ancestry reconstruction to 512 parent edges by default. Override the target only when there is a specific independently captured witness to bind; a different valid proof target without a verified path back to the selected witness remains insufficient.


## Period-aligned justification probes

Materios' pinned node service sets `GRANDPA_JUSTIFICATION_PERIOD = 512`. The P2P collector now augments the existing near-target probe offsets with `n-1, n, n+1` around the next multiple of that period (for the earlier witness at block 2463858, offsets 397–399; for the current witness at block 2464283, offsets 484–486). This is only a deterministic acquisition hint; each block must still return a real FRNK justification before it can enter the evidence packet.

The witness checkpoint header may be retrieved through the public HTTP RPC if the Smoldot light client cannot serve its block body. HTTP is an untrusted byte transport only: the bridge recomputes the SCALE header hash, verifies it equals the witness hash, checks the pinned state root, and walks parent hashes backwards from a locally hash-bound justification target. It does not treat the HTTP endpoint's finalized-head claim as a trust anchor. GRANDPA signature/quorum verification and authority-set provenance remain separate gates.
