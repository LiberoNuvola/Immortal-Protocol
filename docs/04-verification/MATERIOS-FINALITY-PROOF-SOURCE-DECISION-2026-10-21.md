# Materios B3-A — Finality Evidence Source Audit and Frozen Route (2026-10-21)

Status: **B3-A OPEN — the operator-local acquisition route is already decided; real witness still pending.**

**Adopted route — do not reopen:** a real, synchronized Materios operator/full-validator node with the local `b3-proof` CLI, followed by independent IMMORTAL verification. The CLI reads the native `FullClient` for the target header, stored GRANDPA justification, native `ProofProvider::execution_proof`, and runtime identity; it exports an immutable evidence artifact. Public GRANDPA/execution-proof RPC wiring is the frozen fallback only, not the next task.

This audit is subordinate to, and does not supersede, the existing frozen plan:
- [Local operator CLI proof plan](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/04-verification/MATERIOS-B3-LOCAL-OPERATOR-CLI-PROOF-v1.md)
- [Operator evidence acquisition handoff](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/04-verification/MATERIOS-B3-OPERATOR-EVIDENCE-ACQUISITION-HANDOFF-v1.md)
- [Operator patchset — fallback only](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/04-verification/MATERIOS-B3-OPERATOR-PATCHSET-v1.patch)
- [Standard GRANDPA RPC handoff — fallback context](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/04-verification/MATERIOS-B3-GRANDPA-RPC-HANDOFF.md)

Issue #50 is recorded below only as evidence that the public execution-proof RPC was not adopted upstream. Re-reading or retrying that issue is not the prescribed path. This note does not claim that any Materios block is unfinalized; it records the still-missing real witness and independent verification.

## Evidence reviewed

### 1. Public Materios RPC surface

Endpoints checked in the existing B3 investigation:

- `https://materios.fluxpointstudios.com/rpc`
- `https://materios.fluxpointstudios.com/preprod-rpc`

Observed results recorded by the investigation:

- `grandpa_proveFinality` returns JSON-RPC `-32601 method not found`.
- Tested `chain_getBlock(...)` responses had `justifications: null`.
- A bounded scan of blocks `2,377,458–2,378,226` (769 blocks) did not find FRNK justifications.
- `MATERIOS_ARCHIVE_RPC` was not configured during that investigation.

These observations establish a public-interface/evidence-availability limitation only. They do **not** establish that the scanned blocks were unfinalized, and the scan does not cover all blocks or every possible service.

Reference: [Materios Preprod RPC endpoint](https://materios.fluxpointstudios.com/preprod-rpc).

### 2. Upstream execution-proof RPC request is not an available dependency

Upstream issue [Flux-Point-Studios/materios#50](https://github.com/Flux-Point-Studios/materios/issues/50), “B3: expose finalized execution proof via materios_b3_calculateCommitteeProof RPC”, was closed on 2026-09-26 with state reason **not_planned**.

The requested method concerns a Substrate runtime **execution/storage proof** generated through `sc_client_api::ProofProvider::execution_proof(...)`. The issue's acceptance criteria explicitly require a real finalized-block fixture, but also state that finalized-block selection and GRANDPA justification capture are separate evidence artifacts. Therefore this RPC, even if implemented, would not itself close the GRANDPA finality boundary.

As of the public upstream main source inspected on 2026-10-21, [`partnerchain/node/src/rpc.rs`](https://github.com/Flux-Point-Studios/materios/blob/bc1465d85e033001bc86175b85d60f2e5c353413/partnerchain/node/src/rpc.rs) registers System, Orinq Receipts and MOTRA RPCs; it does not register `materios_b3_calculateCommitteeProof` or a GRANDPA RPC module.

The standard Substrate/Polkadot.js GRANDPA RPC surface includes `grandpa_proveFinality` and `grandpa_subscribeJustifications` when a node/provider exposes these methods. Reference: [Polkadot.js RPC documentation](https://polkadot.js.org/docs/polkadot/rpc/).

### 3. Evidence that does exist is not a substitute

The existing Materios receipt/storage-proof PoC demonstrates inclusion against a captured state root. It does not prove that the header containing the receipt was finalized by the Materios GRANDPA authority set.

The independent drand Plutus V3 PoC demonstrates verification of a drand beacon signature in a local devnet. It provides verifiable beacon evidence, not a proof that a particular Materios block was finalized. It cannot be relabelled as a GRANDPA substitute.

## Decision

1. **Keep Materios useful for receipt retrieval and storage inclusion proofs.** Keep those results explicitly typed and described as inclusion evidence.
2. **Do not create a trusted finalized-block claim from the public RPC's finalized head, a returned block header, or a gateway/indexer statement alone.** Those are observations from a service, not a cryptographic finality proof.
3. **Do not rely on issue #50 being implemented upstream.** It is closed as `not_planned`, and its intended execution proof would still be distinct from GRANDPA finality.
4. **Accept a third-party proof source only as an untrusted transport.** It is acceptable if it returns the raw justification and necessary ancestry/authority-transition evidence, and IMMORTAL independently verifies every cryptographic and state-transition step. The provider must not be an authority in the trust decision.
5. **If no existing source exposes the required proof, preserve a fail-closed result:** `MATERIOS_FINALITY_PROOF_UNAVAILABLE`. Do not introduce an operator signature, multisig attestation, trusted relay, remote witness quorum, or drand signature as a substitute while claiming 100% trustless GRANDPA finality.

## Required acceptance packet before B3-A can close

For one selected finalized target block, the proof source must supply:

- exact chain identity and genesis hash;
- target header, block number and hash;
- raw GRANDPA justification in the exact encoding expected by the verifier;
- all ancestry headers required by the justification;
- the applicable authority set and set ID;
- the complete, authenticated chain of authority-set transitions from the pinned genesis trust anchor to that set;
- an independently reproducible verification result, plus negative tests for altered target/header, missing ancestry, invalid signatures, insufficient weight, wrong set ID, and unauthenticated authority transitions.

The verifier must reject the packet when any element is unavailable or fails. Storage inclusion, execution proofs and GRANDPA finality must remain separate proof claims with separate evidence.

## Next permitted action — execute the already adopted route

Do **not** restart a generic public-surface search. Continue from the frozen operator-local plan:

1. Use the real Materios operator/full-validator instance already envisaged by the operator kit; do not create a fifth node just to repeat the public RPC probe.
2. Confirm its local database/base path, chain spec/genesis identity, and sync status.
3. Apply/build the already specified local `b3-proof` CLI only against a pinned Materios source revision and the operator's existing configuration.
4. Capture the exact target header, stored GRANDPA justification, native execution proof, runtime identity/code, authority set/set ID, and selection commitment into one immutable artifact.
5. Feed the artifact into the existing IMMORTAL verifier and require it to cross `VerifiedAuthoritySetTransition`. Synthetic tests remain conformance tests, never live witness evidence.

If the operator node cannot provide the witness after this capability test, use the **already prepared patchset as fallback** against a pinned Materios build. Only then reassess the fallback's remaining work; do not treat the closed issue #50 as an instruction to implement upstream or as the primary route.

B3-A remains OPEN until a real artifact passes independent verification. No V3/Reveal/economic semantic changes are required for this work.

## Source references

- [Materios issue #50 — execution proof RPC request](https://github.com/Flux-Point-Studios/materios/issues/50)
- [Materios upstream RPC registration at inspected commit](https://github.com/Flux-Point-Studios/materios/blob/bc1465d85e033001bc86175b85d60f2e5c353413/partnerchain/node/src/rpc.rs)
- [Polkadot.js GRANDPA JSON-RPC documentation](https://polkadot.js.org/docs/polkadot/rpc/)
- [Polkadot SDK — GRANDPA justification verification context](https://paritytech.github.io/polkadot-sdk/master/bp_header_chain/justification/index.html)


## Additional public surface check — Materios Gateway

The public [Materios Gateway repository](https://github.com/Flux-Point-Studios/materios-gateway/tree/78a654465be54c002a027806f496350e8cbf860a) was also inspected. Its `chain-info` route queries `chain_getFinalizedHead` and `chain_getHeader`, then reports a `finalized_block` number. It does not return the GRANDPA justification, authenticated authority transitions, or a finality-proof envelope. Its receipt firehose consumes `system.events` and `chain.subscribeNewHeads`; its event types concern receipt submission/certification/anchoring and connection status, not cryptographic finality proofs.

Pinned source references:
- [Gateway chain-info route](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/src/routes/chain-info.ts)
- [Gateway firehose route](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/src/routes/firehose.ts)
- [Gateway chain-event subscriber](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/src/firehose/chain-events.ts)
- [Gateway README/API scope](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/README.md)

The gateway therefore aids receipt discovery and provides an operator-facing observation of the finalized head, but it does not currently supply the missing proof artifact. Its `finalized_block` value is sourced from the configured Materios RPC and must not be treated as an independent cryptographic certificate.


## Additional protocol-validity caveat — preprod v6 authority-selection replay

Upstream issue [Flux-Point-Studios/materios#105](https://github.com/Flux-Point-Studios/materios/issues/105) is still open as of this review. It documents a separate risk in preprod v6: under the current preprod relaxation, authority selection can read Cardano data from the Cardano epoch that is still in progress, with database queries extending to each node's moving db-sync tip. A node replaying the same Materios history later can therefore read a different final state and derive a different committee. The issue notes that a complete replay of v6 history against production db-sync has **not** been performed, so no specific bad block has been proven.

This issue is **not evidence that GRANDPA finality signatures are invalid**, and it does not erase the storage-inclusion result. It does mean that IMMORTAL must not assume that replaying the authority-selection algorithm against today's Cardano/db-sync view reconstructs historical committee transitions deterministically. A candidate trustless light-client path must verify the actual authenticated authority-set transitions from finalized Materios headers/justifications using the proper GRANDPA set IDs; a current committee query or a fresh off-chain recomputation is not an adequate substitute.

Reference: [upstream comment updating #105 after #100's third round](https://github.com/Flux-Point-Studios/materios/issues/105#issuecomment-6293128733).

Treat this as an additional open verification question, separate from the missing justification source. It does not by itself prove that a header-based GRANDPA light client cannot work; that path still requires actual justifications, an authenticated transition chain, and negative tests.


The related [upstream issue #109](https://github.com/Flux-Point-Studios/materios/issues/109), which proposes an opt-in chain-state switch from v6's relaxed Ariadne rule to the strict upstream rule, also remained **open** at this review. Do not assume that remediation has been activated on the live preprod chain. For IMMORTAL this remains a separate protocol-reproducibility risk, not a replacement for the absent justification evidence.
