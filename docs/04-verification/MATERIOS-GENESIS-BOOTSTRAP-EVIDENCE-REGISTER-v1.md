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

Expected live genesis hash, from the dated public observation and later re-observation:

`0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`

**Important source distinction:** at the pinned revision `f1c8b400a229258298236d9337247135b6c1112e`, the runtime binds `IntentSettlementMateriosChainId` dynamically to `frame_system::BlockHash::<Runtime>::get(0)`; that revision does not hard-code the above hash as a runtime constant. An earlier runtime-source candidate (`011473c88ef82fad3d4877af8d89a5b52abf235f`) contains the literal live-chain identity, but that later runtime source claim does not prove which source and WASM bytes created genesis.

The pinned preprod chain-spec source declares:

- chain name: `Materios Preprod v6`
- chain ID: `materios_preprod_v6`
- protocol ID: `materios-preprod-v6`
- chain type: `Live`

These are source claims, not by themselves a live-chain trust anchor. Acceptance requires a pinned, reproducible runtime blob, a source-derived chain spec that reconstructs the expected genesis hash, and a live RPC hash match. The gateway's `chain-info` route uses the configured RPC and therefore is not an independent second observer. The published raw spec reconstructs the live hash in run #17, but its host is not an independent provenance authority; the raw-spec digest and original runtime-code digest are recorded in the workflow evidence.

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

Workflow: `.github/workflows/materios-genesis-reproduction.yml`. The first complete run is evidence collection, not a closure PASS.

### Run #17 — captured evidence

- Run: https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39556626040
- IMMORTAL commit: `961be9034d502b99e79a4cc8cf106399b769f55c`
- Artifact: https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39556626040/artifacts/12326009589
- ZIP SHA-256: `aa14592f99c128126987b1d273e504b60432a0bf9b10ae2889331b22532e3356`
- Captured raw genesis spec size: 1,063,592 bytes.
- Captured raw genesis spec SHA-256: `77877aa63358af6cf0c78a3b106ac2d295da575973bec1c3ff51d53b3fa65aaa`.
- Raw spec's `:code` bytes SHA-256: `438747fce96411c4fe5d4c02d725993573093937aa14e39104036e5b7811d99f`.
- The pinned `f1c8b400a229258298236d9337247135b6c1112e` source's native-built built-in chain spec produced `0xfdea248a1edbdec4ffca2306a242896758eba27bac1eddcfabfba457483d4e57`, not the expected live genesis.
- The downloaded raw spec, when loaded and hashed by the compiled Materios CLI, produced `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`; the direct Preprod RPC returned the same value. The gateway returned it too, but it is not an independent source: the gateway's `chain-info` route polls its configured RPC.
- Verdict: **FAIL / source reproduction not established**. The artifact intentionally records this mismatch instead of weakening the assertion.

Run #16 for the same pinned upstream commit had produced a different native-built genesis hash (`0x7beedf41110d62c0c7a14c734b2351b647b040e0209ef808fe6c16a846fd7e56`). The difference is consistent with the upstream's own finding that builds of the same source from different paths yielded different WASM `:code` blobs and genesis hashes.

### Historical artifacts recovered from the official release index

The official `/releases/` index gives a more specific candidate than the earlier runtime-`204` source candidate:

| Published artifact | Index evidence | Relevance |
|---|---|---|
| `chain-spec-v6-raw.json` | Published 2026-04-28 15:05 UTC; 1,063,592 bytes | Same file retrieved and hashed in run #17 |
| `materios_runtime.spec-202.wasm` | Published 2026-04-21 22:20 UTC; 477,796 bytes | Not byte-identical to the raw-genesis `:code` |
| `materios_runtime.compact.compressed.wasm` | Published 2026-04-21 22:20 UTC; 477,796 bytes | Not byte-identical to the raw-genesis `:code`; size equality is not byte equality |
| `materios-node-v6-x86_64-linux` | Published 2026-04-28 15:05 UTC; 73,791,376 bytes | Official launch node binary candidate |
| `materios-node-v5-x86_64-linux` | Published 2026-04-21 16:11 UTC; 73,232,144 bytes | Previous network generation, not the v6 trust anchor |

The publisher's public [Node Requirements document](https://github.com/Flux-Point-Studios/docs/blob/edaab98ab9cc106fdd325a90533396132b7cdf3f/materios/node-requirements.md) records the raw v6 chain-spec SHA-256 prefix `77877aa6…65aaa` and official node binary SHA-256 prefix `dda4f3a7…58ebc`. Run #17 recorded the full raw-spec SHA-256 as `77877aa63358af6cf0c78a3b106ac2d295da575973bec1c3ff51d53b3fa65aaa`.

The source revision `5001ee3dc953896c6b06847a80c058d8f7deded2` has `spec_version: 202` in `partnerchain/runtime/src/lib.rs`. This is a better source candidate for the release's `materios_runtime.spec-202.wasm` than the later `bfffb594…` source, whose runtime is spec 204. It is not yet established that compiling commit `5001ee3` reproduces the published WASM bytes: the published genesis runtime contains historical build-path strings, while the source only acquired the deterministic fixed-path builder in October.

The public operator docs also distinguish genesis runtime code from the upgraded live runtime: the v6 raw genesis spec does not export `CandidateValidationApi`, while the upgraded live runtime does. Therefore the current main-branch runtime cannot simply be substituted as genesis `:code`; the historical WASM must be byte-identified and used when reconstructing the v6 chain spec.

### Run #22 — official binary/raw-spec consistency

- Workflow: [Materios Runtime Artifact Match](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39560950332).
- IMMORTAL commit: `bb920e49ac94019a39854e91266bee096a01ef10`.
- Artifact: [comparison evidence ZIP](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39560950332/artifacts/12327368993); ZIP SHA-256 `1ae964f9b4e709ed0ef1321051f4a6fbce36da8bb9736ad023d489a20ed97db9`.
- Publisher `SHA256SUMS` validates both the raw spec (`77877aa6…65aaa`) and the official v6 node binary (`dda4f3a731c909641d42b0f52f78b7d0bdf1a35867f0c2759cd50f5bfd158ebc`).
- The official node binary's `build-spec --chain preprod --raw` completed successfully. Its `genesis.raw.top` had 63 entries and matched the published raw spec's complete storage map, including every key/value and `:code`, exactly.
- The official node's built-in runtime code SHA-256 is `438747fce96411c4fe5d4c02d725993573093937aa14e39104036e5b7811d99f`, identical to the raw spec's `:code` SHA-256. The code is 526,789 bytes.
- None of the 11 separately published runtime WASM files tested matches that code hash. In particular, `materios_runtime.spec-202.wasm` and `materios_runtime.compact.compressed.wasm` both hash to `7fa5ccb12ebde4f2d2904cfb6ee0678c3e5549c0a678e0f2d8833f2399ffcae2`; `materios_runtime.spec-209.wasm` is 526,758 bytes and has a different hash too.
- Workflow verdict: **PASS_OFFICIAL_BINARY_RAW_SPEC_MATCH**. This establishes consistency of two official release artifacts; it is not source reproducibility, because they have a common publisher and the embedded runtime does not match any of the tested standalone WASMs.

The key unresolved source question is therefore narrower: recover the exact committed or otherwise attested source/build inputs that produced the 526,789-byte genesis runtime. The published release index has no `materios_runtime.spec-208.wasm`; the `spec-202` runtime is not byte-identical to the genesis code, and the published `spec-209` runtime is also different. Upstream's v6 chain-spec source comments state that the reset preserved a spec-208 runtime without building a new one for genesis. The source revision producing that spec-208 blob has not been found in the currently visible public branch refs or commit search. The current-main node build is not a substitute: run #17 reconstructed a different hash from its current built-in spec, while loading the published raw spec still produced the expected live genesis hash.

A further probe of the official binary's `--version` output returned `0.1.0-df6a0f88293`, suggesting a source revision identifier. A search of the currently visible public branches and commit search for that identifier produced no match in `Flux-Point-Studios/materios`; this does not prove the object never existed, only that its source revision cannot currently be resolved from the public refs and search path we checked. The official release documentation says the binary is built from `main`, but the v6 binary's embedded identifier is not traceable to the currently visible main history from this investigation. Until the full commit or an independently verifiable source archive is recovered, the binary/raw-spec consistency result must not be presented as source reproducibility.

### Required build path

Upstream added a specific reproducible runtime builder in signed commit `e55bda47ecb114599e3ae2717c9ff69a01a71683` (3 October 2026), whose commit message explicitly documents this source-path problem. Its `tools/runtime-build/build.sh` builds the runtime at `/materios` in a digest-pinned `rust:1.85.0-bookworm` image and emits SHA-256 and Blake2-256 of `materios_runtime.compact.compressed.wasm`. The published raw spec's `:code` digest must be compared with this output for a source candidate; simply compiling `materios-node` on the runner is not sufficient.

Run #18 / #19 are expensive native-build diagnostics from historical source candidate `bfffb5942818334e367ef44a222e5371a9a3968b`. That candidate uses a spec-204 runtime, not the spec-208 runtime noted for the genesis reset, so it must not be treated as the source of the genesis `:code`. The heavy workflow has been changed to manual dispatch only to prevent automatic repeat builds while the exact source revision is unresolved.

The upstream `partnerchain/node/src/cli.rs` (blob `8dfad7b09883d2d355a82ee97975176a34768609`) defines the offline command, and `partnerchain/node/src/chain_identity.rs` (blob `6a63e8c22079e52ccd82050daea455b69e0dfb64`) derives the genesis hash from a chain spec's storage.

Historical cross-check: `poc/materios-grandpa/evidence/live-chain-info-2026-09-25.json` reports the same genesis hash, but is only a dated gateway observation. Genesis identity reproduction still does not prove GRANDPA finality or the Materios-specific authority-selection transition.
