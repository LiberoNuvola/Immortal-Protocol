# Materios P2P finality proof-source probe via Smoldot

Status: **PROOF-SOURCE POC / B3-A OPEN**.

This probe tests a source-agnostic path that does not require a Materios validator/full node, does not activate or modify a Materios node, and does not rely on the public RPC service to transport finality proofs.

## What it does

1. Downloads the published Materios raw preprod v6 chain spec and refuses to continue unless its exact SHA-256 matches the pinned digest.
2. Adds the already documented public P2P bootnode to an in-memory copy only. The downloaded source bytes and digest are preserved; genesis storage is not edited.
3. Builds Smoldot at pinned upstream PR commit c898452405be712c6037ad956464b3fe9f9907f4, which contains the proposed raw GRANDPA justification export via grandpa_subscribeJustifications and chain_getBlock.
4. Starts the Substrate light client, checks system_chain and the genesis hash against the pinned Materios v6 identity.
5. Requests the exact historical target block and captures a returned FRNK justification if the peer serves one. It also subscribes to proofs verified by the light client and captures any raw justifications received during the bounded observation window.
6. Reconstructs a target header's SCALE bytes from the RPC fields and checks Blake2-256(header) against the hash carried by the justification. It writes a JSON evidence artifact without calling it canonical or verified by IMMORTAL.

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

A live proof for a different block is useful proof-transport evidence, but is not a substitute for the exact historical transition witness.

## Reproducibility

Run workflow **Materios Smoldot P2P Finality Probe**. The action artifact includes the raw justification, target header JSON, reconstructed SCALE header bytes, hashes, source identities, target-specific result and explicit non-claims. Treat the artifact as immutable untrusted input for the existing verifier; do not cherry-pick or promote raw evidence without verification.

Pinned source references:

- Smoldot PR: https://github.com/paritytech/smoldot/pull/3369
- Smoldot issue: https://github.com/paritytech/smoldot/issues/3288
- Materios raw chain spec endpoint: https://materios.fluxpointstudios.com/blobs/chain-spec-raw.json
- Materios public P2P bootnode from the operator docs: /dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM
