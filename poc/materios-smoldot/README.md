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
7. Samples `system_health` after genesis identity validation and at 15-second intervals during the proof wait, recording peer count, `isSyncing`, `shouldHavePeers`, timestamps, and query errors in the evidence artifact. This distinguishes lack of peers from ongoing/stalled sync and avoids interpreting every negative result as the same failure.
8. Derives a conservative `system_health_assessment` from those bounded samples (`NO_PEERS_OBSERVED`, `PEERS_CONNECTED_SYNCING_OBSERVED`, `PEERS_CONNECTED_NOT_SYNCING_AT_SAMPLE_TIMES`, `HEALTH_UNAVAILABLE`, or `MIXED_OR_INCONCLUSIVE`). This is local diagnostic classification only; it is not a network-wide availability or finality claim.
9. Reconstructs a proof target header's SCALE bytes and checks Blake2-256(header) against the justification's target hash. It writes a JSON acquisition artifact without calling the proof canonical or verified by IMMORTAL.

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

A live proof for a different block is useful proof-transport evidence, but is not a substitute for the exact historical transition witness. The target activation block has no GRANDPA digest of its own, so nearby descendant commit targets are probed; if a descendant justification is found, a sequential ancestry bridge back to the activation block is still required.

## Reproducibility

Run workflow **Materios Smoldot P2P Finality Probe**. The action artifact includes the raw justification, target header JSON, reconstructed SCALE header bytes, hashes, source identities, target-specific result and explicit non-claims. Treat the artifact as immutable untrusted input for the existing verifier; do not cherry-pick or promote raw evidence without verification.

Pinned source references:

- Smoldot PR: https://github.com/paritytech/smoldot/pull/3369
- Smoldot issue: https://github.com/paritytech/smoldot/issues/3288
- Materios raw chain spec endpoint: https://materios.fluxpointstudios.com/releases/chain-spec-v6-raw.json
- Materios public P2P bootnode from the operator docs: /dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM
