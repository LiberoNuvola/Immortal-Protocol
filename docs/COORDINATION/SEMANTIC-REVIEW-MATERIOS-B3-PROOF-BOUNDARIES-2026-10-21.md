# Semantic Review — Materios B3 Finality, Historical State, and Execution-Proof Boundaries

**Review date:** 2026-10-21  
**Review ID:** `SEM-MATERIOS-B3-PROOF-BOUNDARIES-2026-10-21`  
**Reviewed B3 branch source snapshot:** `2778d3e107f45ee15157fff8ef894905a72070ea`  
**Latest inspected P2P acquisition run:** [#39601026951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951), run head `3719db8655cc212deec7736641ac85d235bbf5c5`, artifact `12346387679`  
**Scope:** read-only review of existing collectors/verifiers, a completed P2P evidence artifact, workflow gates, and upstream RPC registration. No new endpoint scan, node deployment, proof manufacture, source modification or branch operation was performed.

## Executive disposition

B3 remains **OPEN / BLOCKED**, with three separate prerequisites that must not be conflated:

- **B3-A — canonicality/finality:** no authentic raw GRANDPA `FRNK` justification has been captured for target block 1,856,408. The new pinned Smoldot/P2P artifact independently reconstructed the target header hash and confirmed the configured genesis hash, but captured zero raw justifications.
- **B3-B — historical anchor state:** no complete proof packet has been acquired for the exact historical `stateRoot + Anchors[anchor_id] value + state_getReadProof` at the target block hash. The storage-proof verifier is meaningful, but it cannot authenticate a caller-supplied root as finalized.
- **B3-C/P-11 — Materios selector execution proof:** the consumer/verifier boundary exists, but the current upstream node `partnerchain/node/src/rpc.rs` inspected on main does not register `materios_b3_calculateCommitteeProof`, despite issue #50 being marked closed. Closure reason/implementation provenance remains unresolved.

These are acquisition/integration blockers, not reasons to change the trust model or reproduce Materios' authority selector in TypeScript. Do not use B2, a Pyth result, a valid storage-inclusion fixture, an observed RPC head or the presence of a FullClient/RPC dependency as a substitute.

## A. Fresh artifact check — Smoldot P2P proof probe

Run [#39601026951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951) completed with **failure at the proof-availability verdict**, after the pinned Smoldot client built, performed proof capture and uploaded artifact `12346387679`.

The downloaded artifact `materios-smoldot-p2p-finality-evidence.zip` was inspected read-only. Its SHA-256 is `ae98dadea115687f01ef6db3f30bd1ced8dc501651932ecd3a3ecdfd287a3dfa`; the contained `materios-smoldot-evidence.json` SHA-256 is `55fdd081fb49a5b8aacc0d377ea9531eddfcac7052d9cf9b475113a050359881`.

Concrete observations from the artifact:

| Evidence field | Observed value | Scope limit |
|---|---|---|
| Capture status | `NO_RAW_GRANDPA_PROOF_CAPTURED` | Acquisition failed closed; no finality claim |
| Chain spec | downloaded SHA-256 `77877aa6…`; effective spec explicitly adds only the bootnode in memory | Provenance for the probe configuration, not proof of finality |
| Genesis | expected and observed genesis both `0x0e46e33f…849f7bf` | Correct chain identity is necessary, not sufficient |
| Target | block `1856408`, hash `0x7db6da35…4cfdf44e` | Exact previously identified target |
| Target header | locally reconstructed header hash matches requested hash | Authentic header bytes do not yield a GRANDPA signature/quorum |
| Target justification | `frnkJustificationFound=false`; empty `justifications` | No B3-A proof to verify |
| Captured justifications | zero | No signatures, quorum, or ancestry packet is available for independent verification |
| Warp sync | 36 observations / 350 seconds; stuck on block `97069`, 22 in-progress / 14 idle | Bounded, source-specific stall; underlying peer cause is not established |
| Reported finalized head | block `2382694` via public HTTP RPC | Explicitly untrusted observation, not the trust anchor |

The artifact also shows some candidate blocks where Smoldot returned no block object. The correct conclusion is narrowly **this selected pinned P2P path failed to supply the requested witness under this bounded run**, not that GRANDPA data cannot exist on any archive, full node, peer or authorized operator source.

Source freshness check: the run head `3719db8655cc212deec7736641ac85d235bbf5c5` differs from the current B3 HEAD `2778d3e107f45ee15157fff8ef894905a72070ea`, but the proof-capture implementation `poc/materios-smoldot/capture-finality.mjs`, GRANDPA capture/verifier and B3 verifier modules read for this review have identical blob identities across those snapshots. The only workflow change between those snapshots was the P2P workflow's temporary push trigger plus documentation changes. The artifact remains relevant to the same capture implementation; it must not be described as Actions run on the newer B3 HEAD.

## B. B3-A — GRANDPA verifier boundary

The existing implementation has an appropriate separation, but the input witness is missing:

1. `poc/materios-grandpa/src/capture-real-witness.ts` extracts raw `FRNK` justification bytes and candidate headers from untrusted RPC responses. Its own module comments warn that reading an authority list/set-id through `state_call` does not authenticate that authority state.
2. `poc/materios-grandpa/src/verifier.ts` validates the supplied authority state, chain/genesis/checkpoint/set-id binding, signatures, duplicate signers, weight/quorum and ancestry. This verifier answers whether the justification is consistent with the supplied trusted authority state; it does not, by itself, prove that the authority state was the canonical historical set.
3. `poc/materios-grandpa/src/authority-transition.ts` keeps the untrusted transition statement separate from the nominal `VerifiedAuthoritySetTransition`. It requires an external `AuthoritySetTransitionProofVerifier` to approve the transition statement and binds recovered selection inputs to an on-chain `selectionInputsHash` commitment.
4. The full required packet therefore remains: exact target header/block hash → authentic GRANDPA justification → historically applicable authority set/set-id → selection/enactment inputs and on-chain commitment → Materios-native selector execution proof → ancestry/quorum → independent verification → `VerifiedAuthoritySetTransition`.

Do not infer the target's historical authority set from a later observed set-id, do not treat the current RPC head as canonicality proof, and do not mark packet-shape or local cryptographic fixtures as a real witness.

## C. B3-B — exact historical anchor storage proof

`poc/materios-checkpoint/src/capture-anchor.ts` requires `MATERIOS_ARCHIVE_RPC`, binds header/storage/read-proof requests to one exact block hash, and rejects if `readProof.at` differs from the requested hash. Its output explicitly lists **independent trie proof verification** and **GRANDPA finality** as open requirements.

`poc/materios-checkpoint/src/rpc.ts` describes storage/read-proof responses as untrusted transport evidence. Its checks for response schema and exact requested block hash are useful, but do not authenticate finality.

`poc/materios-execution-verifier/src/storage.rs` calls the native Substrate `read_proof_check` against a supplied state root and exact key/value, rejects malformed SCALE/trailing bytes, and rejects incorrect root/key/value. Its tests build local synthetic trie fixtures. That establishes a bounded verifier path—not a real proof for anchor block 1,856,408 and not a binding from this proof's root to an independently finalized target header.

The missing acquisition packet is specifically: the exact historical header's `stateRoot`, the exact `OrinqReceipts::Anchors[anchor_id]` SCALE value, and `state_getReadProof` returned at the **same exact block hash**, then independently verified by the pinned Rust verifier. A recent/live inclusion proof or a proof from a different `at` does not close the historical target.

## D. B3-C / P-11 — execution-proof client versus upstream transport

The IMMORTAL client is already shaped around an exact proof request:

- `poc/materios-checkpoint/src/rpc.ts` requests `materios_b3_calculateCommitteeProof` for a specific block hash and SCALE call data, and checks that the returned block hash, runtime method, call data and runtime metadata match the requested context.
- `poc/materios-checkpoint/src/executionProof.ts` keeps execution proof bytes untrusted until the response is bound to the requested runtime invocation.
- `poc/materios-execution-verifier/src/lib.rs` checks the proof against a supplied state root and exact runtime WASM hash/method/call data/result. Its module comments correctly state that this alone neither proves finality nor that the supplied WASM is the canonical runtime at the network block.

However, the upstream issue [Flux-Point-Studios/materios#50](https://github.com/Flux-Point-Studios/materios/issues/50) is currently **closed with zero comments**, while current upstream `main` file `partnerchain/node/src/rpc.rs` has blob SHA `30827863c7b8f6fb507b008cee9f572ec48fe06f` and its `create_full` path merges only System, OrinqReceipts and MOTRA RPCs. The requested `materios_b3_calculateCommitteeProof` method is not registered in the inspected file.

The IMMORTAL patch specification `docs/04-verification/MATERIOS-B3-GRANDPA-RPC-UPSTREAM-PATCH-v1.md` explicitly labels itself **NOT APPLIED**. The presence of `FullClient`, a `sc-consensus-grandpa-rpc` Cargo dependency, a closed issue, or a client method name does not establish a deployed proof transport. Do not implement a duplicate selector in TypeScript or silently recreate the upstream RPC. First resolve whether the expected method exists on the exact deployed/other upstream ref, then demand a concrete finalized-block proof fixture and independent verification.

## SHA-pinned source register

These blob identities are from B3 HEAD `2778d3e107f45ee15157fff8ef894905a72070ea`. Test-source entries below were inspected as source but were not rerun as part of this review.

| Path | Blob SHA | Classification |
|---|---|---|
| `poc/materios-grandpa/src/capture-real-witness.ts` | `1fcef87520a40681d7340fe4f772cc57cbcb0a31` | `REVIEWED_STATIC_UNTRUSTED_RPC_CAPTURE` |
| `poc/materios-grandpa/src/verifier.ts` | `b6831e4b9f52e244e98d8f02fb1c10f025da2728` | `REVIEWED_STATIC_JUSTIFICATION_VS_AUTHORITY_TRUST_BOUNDARY` |
| `poc/materios-grandpa/src/authority-transition.ts` | `e7c9a7b079c80764267d35e2d4518147bfb8732a` | `REVIEWED_STATIC_VERIFIED_TRANSITION_GATE` |
| `poc/materios-grandpa/src/ancestry.ts` | `3c29534bb2b76b3a5fee33d3bbf5576e33b056e6` | `REVIEWED_STATIC_HEADER_ANCESTRY_CHECKS` |
| `poc/materios-grandpa/src/authority.ts` | `b6aab2acb434490dc0809af92195bab1ca98d86c` | `REVIEWED_STATIC_AUTHORITY_STATE_VALIDATION` |
| `poc/materios-grandpa/src/grandpa.ts` | `5ab0a8c01bedddbb03b0ea36a4c9a3327584b620` | `REVIEWED_STATIC_GRANDPA_JUSTIFICATION_DECODE` |
| `poc/materios-grandpa/test/verifier.test.ts` | `d25585e82e0bc831c098372c0aa5720f920a6bd5` | `REVIEWED_TEST_SOURCE_NOT_RERUN` |
| `poc/materios-checkpoint/src/rpc.ts` | `74f983d5980f25452c6517024528528fdbbfce43` | `REVIEWED_STATIC_EXACT_BLOCK_RPC_TRANSPORT` |
| `poc/materios-checkpoint/src/capture-anchor.ts` | `b99d24ec77c3e617f3b923600a73d86526884668` | `REVIEWED_STATIC_HISTORICAL_ANCHOR_COLLECTOR` |
| `poc/materios-checkpoint/src/capture-storage-proof.ts` | `69e54dd95c80f66cac20d29a9e1afdeff63faa55` | `REVIEWED_STATIC_STORAGE_PROOF_ACQUISITION` |
| `poc/materios-checkpoint/src/executionProof.ts` | `c5175cb0055bc2cf1d979af16b18550d3e02c795` | `REVIEWED_STATIC_EXECUTION_PROOF_CLIENT` |
| `poc/materios-execution-verifier/src/lib.rs` | `10e543fbc10525fb257728fba6cbfcac809c76bb` | `REVIEWED_STATIC_NATIVE_EXECUTION_PROOF_CHECK` |
| `poc/materios-execution-verifier/src/storage.rs` | `9b7432f629668aaca5cf7e4db5e26c62ccc22d76` | `REVIEWED_STATIC_NATIVE_STORAGE_TRIE_CHECK` |
| `poc/materios-execution-verifier/src/bin/verify-storage-proof.rs` | `690d522fb0449e8250494ef7f669b720deaeb04d` | `REVIEWED_STATIC_VERIFIER_CLI_BOUNDARY` |
| `.github/workflows/materios-b3-execution-verifier.yml` | `3e4c28ca66b1e7f61fef25ab7e01e1d9b60b0d94` | `REVIEWED_WORKFLOW_DISTINCT_ACQUISITION_AND_NATIVE_VERIFICATION_JOBS` |
| `.github/workflows/materios-b3-real-fixture-capture.yml` | `6d2cc1854b57993af02fbcb355d98d8fe5b810a8` | `REVIEWED_WORKFLOW_FAILS_CLOSED_ON_MISSING_PROOF_TRANSPORT` |
| `.github/workflows/materios-evidence-conformance.yml` | `39293c71cd21609cbfdc247d80516b2175c33467` | `REVIEWED_WORKFLOW_EVIDENCE_SCHEMA_NOT_REAL_PROOF` |
| `poc/materios-smoldot/capture-finality.mjs` | `9c937ba50ea4f36af17e4e93ca25a7fcfdbccc21` | `REVIEWED_STATIC_PINNED_P2P_ACQUISITION` |
| `.github/workflows/materios-smoldot-p2p-finality-probe.yml` | `cc0bc57dce276431821210f56593cb9681d08a99` | `REVIEWED_WORKFLOW_PROOF_AVAILABILITY_FAIL_CLOSED` |
| `docs/04-verification/MATERIOS-B3-GRANDPA-RPC-UPSTREAM-PATCH-v1.md` | `5a929ce0795a89391580aa439bab3920e252fd88` | `REVIEWED_UPSTREAM_PATCH_SPEC_NOT_APPLIED` |

## Next executable gate — change the acquisition source, not the protocol trust model

1. Identify a **specific already-operating** archive/full node, or authorized Materios FullClient source, that actually retains the target GRANDPA justifications and the exact historical state. Record endpoint/operator authority and retention/proof method before a new probe.
2. At exact target block hash `0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e`, capture header + genuine `FRNK` justification and, independently, the historical Anchor storage value/proof. Do not repeat the same public RPC window or pinned Smoldot stalled probe unchanged.
3. Independently verify finality with the historically correct authority set/set-id and the ordered authority transition. Separately verify the storage proof against that exact header StateRoot.
4. Resolve upstream #50 against the exact node/deployed ref. Only after the transport exists should a concrete finalized-block execution-proof packet be captured and verified for block hash, canonical runtime WASM identity, method, call data and result.
5. Keep workflow fixture/schema gates separate from real witness verification. Do not close B3-A/B/C based on any single one of these passes.

**Verdict:** B3-A `BLOCKED_NO_PUBLIC_GRANDPA_WITNESS`; B3-B `BLOCKED_EXACT_HISTORICAL_ANCHOR_WITNESS`; B3-C/P-11 `INTEGRATION_BLOCKED_UPSTREAM_CLOSURE_DISCREPANCY`. These are source-specific findings, not proof that all potential providers lack the data. Overall repo audit remains `PARTIAL / OPEN`. This review changed no protocol code, proof contract, branch topology, or deployed/ledger state.
