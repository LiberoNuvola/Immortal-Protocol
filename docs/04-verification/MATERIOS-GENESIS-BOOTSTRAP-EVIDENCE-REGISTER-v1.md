# Materios Preprod Genesis Bootstrap — Evidence Register v1

Status: **SOURCE-PINNED CANDIDATE / NOT YET ACCEPTED AS LIVE-NETWORK TRUST ANCHOR**

Scope: prepare the evidence needed for the B3-A genesis bootstrap. This register does not claim that the public endpoint currently serving Materios is proven to use this genesis, and it does not close B3-A.

## Pinned upstream source

Repository: `Flux-Point-Studios/materios`

Source revision: `f1c8b400a229258298236d9337247135b6c1112e`

Relevant source files and blob identities:

- `partnerchain/node/src/chain_spec_preprod.rs` — blob SHA `a0f5b3bd006fbb92870fece47a78e7f1c852a050`
- `partnerchain/runtime/src/migrations.rs` — blob SHA `8faf02962d92f17989717e77fd4118e3a60c91e9`
- `partnerchain/runtime/src/genesis_committee.rs` — blob SHA `03caab080390d291e7f333bdc5f9e4f580cae6cf`

Source links:

- https://github.com/Flux-Point-Studios/materios/blob/f1c8b400a229258298236d9337247135b6c1112e/partnerchain/node/src/chain_spec_preprod.rs
- https://github.com/Flux-Point-Studios/materios/blob/f1c8b400a229258298236d9337247135b6c1112e/partnerchain/runtime/src/migrations.rs
- https://github.com/Flux-Point-Studios/materios/blob/f1c8b400a229258298236d9337247135b6c1112e/partnerchain/runtime/src/genesis_committee.rs

## Candidate chain identity

The pinned runtime source declares the following constant as the Materios preprod genesis hash:

`0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`

The pinned preprod chain-spec source declares:

- chain name: `Materios Preprod v6`
- chain ID: `materios_preprod_v6`
- protocol ID: `materios-preprod-v6`
- chain type: `Live`

These values are source claims at the pinned revision. Before they become an accepted IMMORTAL trust anchor, an independent reproducible build must derive the chain-spec genesis hash and match it byte-for-byte to the runtime constant, and an independently queried live genesis hash must match too. The live RPC response is a cross-check, not the sole trust source.

## Candidate genesis GRANDPA authority set

The pinned preprod chain spec seeds the genesis committee through `sessionCommitteeManagement.initialAuthorities`, with the Aura and GRANDPA fields in session keys. It intentionally leaves the top-level `aura.authorities` and `grandpa.authorities` genesis fields empty; the runtime's `genesis_committee.rs` states that the session pallet seats Aura and GRANDPA from the genesis committee.

The four GRANDPA Ed25519 public keys in source order (MacBook, Gemtek, Node-2, Node-3) are:

| Genesis member label in source | GRANDPA public key (hex) | Weight candidate |
|---|---|---:|
| MacBook | `c05b56dab7a8701871a8be75aed6e2ad8c5eb5ff935ddd2b00eeca7299af35b1` | 1 |
| Gemtek | `4558853422164939eca690f21f76a614f7957352e01a448a4986ca3d55d98f23` | 1 |
| Node-2 | `4dc9c8f9bd37df2bb9223458c897b000fe4362958da6eeb6413b93dcfbabe2ba` | 1 |
| Node-3 | `750d4ba2a831a30d419009f2d8bc1ef1e6fc6f673c7a2b5b500a2b7f2a68458e` | 1 |

The weights and initial set ID are candidates based on the standard Substrate GRANDPA genesis convention, not yet independently confirmed from the actual genesis storage. The initial set ID must be confirmed as `0` from canonical genesis/runtime semantics or a proof anchored to the verified genesis state; do not silently assume it in production code.

## Required closure checks

1. Build the chain spec at the pinned upstream revision with its pinned Rust toolchain/dependencies and record the exact build inputs.
2. Derive the genesis header/hash using the canonical Substrate chain-spec implementation; compare it with the source-declared genesis hash above.
3. Independently query at least two available public sources for `chain_getBlockHash(0)`. Treat those responses as observations only; require exact match to the locally reproduced hash.
4. Establish the genesis GRANDPA authorities and initial set ID from canonical genesis state/runtime semantics. Do not infer the set solely from a later `grandpa_authorities` RPC response.
5. Produce a canonical, versioned IMMORTAL trust manifest with exact chain ID, genesis hash, set ID, authority keys, weights, source commit, source blob SHAs, toolchain/dependency lock, reproducible build output, and manifest digest.
6. Add a bootstrap API that accepts only this pinned manifest identity and returns the initial trusted authority state. A generic caller-provided object must not be sufficient to cross the trust boundary.
7. Ensure every subsequent trusted state is produced only by the existing verified authority-transition boundary. Review the runtime enforcement path, not only TypeScript types.
8. Add negative tests for changed genesis hash, wrong chain ID, mutated/reordered/duplicated authority keys, wrong weights/set ID, manifest digest mismatch, and attempts to construct trusted state directly.
9. Record actual test output and evidence artifact digests. Unit fixtures are not live-network evidence.

## Explicit limitation

The upstream source also contains a launch-baseline fixture described as a pre-AJ, unapproved genesis. That fixture is not accepted as the production/preprod trust anchor. This register instead pins the current preprod chain-spec/runtime source, while retaining the independent build and live-network match as mandatory gates.

B3-A remains **OPEN** until the exact genesis manifest and the verifier's enforced bootstrap boundary pass these checks. A matching genesis hash alone is not proof of later GRANDPA finality or of the Materios-specific authority-selection transition.


## Reproducibility workflow

Workflow committed: `.github/workflows/materios-genesis-reproduction.yml`. It pins the Materios source revision, builds `materios-node`, runs `chain-id --chain preprod`, compares the locally derived genesis hash to the pinned constant, then checks `chain_getBlockHash(0)` from the public Preprod RPC. The workflow execution and artifact have not yet been confirmed; no PASS is claimed here.

The upstream `partnerchain/node/src/cli.rs` (blob `8dfad7b09883d2d355a82ee97975176a34768609`) defines the offline command. `partnerchain/node/src/chain_identity.rs` (blob `6a63e8c22079e52ccd82050daea455b69e0dfb64`) derives the genesis hash using the spec's own runtime code.

Historical cross-check: `poc/materios-grandpa/evidence/live-chain-info-2026-09-25.json` reports the same genesis hash, but is only a dated gateway observation. A passing reproducibility workflow still does not prove GRANDPA finality or the authority transition.
