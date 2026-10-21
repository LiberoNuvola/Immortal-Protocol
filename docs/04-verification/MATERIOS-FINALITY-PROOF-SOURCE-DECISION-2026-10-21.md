# Materios B3-A — Finality Evidence Source Audit and Frozen Route (2026-10-21)

Status: **B3-A OPEN — available public surfaces do not provide the real GRANDPA witness; alternate already-operating proof path required.**

Latest source audit: [MATERIOS-ALTERNATE-FINALITY-SOURCE-INVENTORY-2026-10-21.md](MATERIOS-ALTERNATE-FINALITY-SOURCE-INVENTORY-2026-10-21.md) records the reviewed endpoints, P2P route, public-sync-node announcement, reusable verifier code, and the current fail-closed decision.
Latest feasibility ruling: [MATERIOS-B3-A-PUBLIC-DATA-ONLY-FEASIBILITY-2026-10-21.md](MATERIOS-B3-A-PUBLIC-DATA-ONLY-FEASIBILITY-2026-10-21.md) explains why the current public observations cannot be converted into a GRANDPA proof without a real witness or an explicit protocol change.
Latest fallback proposal: [MATERIOS-B3-A-FINALITY-EVIDENCE-ARCHITECTURE-FALLBACK-DECISION-2026-10-21.md](MATERIOS-B3-A-FINALITY-EVIDENCE-ARCHITECTURE-FALLBACK-DECISION-2026-10-21.md) compares source-acquisition paths and a future permissionless evidence-publication design. It is a proposed architecture track only; no protocol change is approved.

**Current applicable constraint:** IMMORTAL cannot assume access to a Materios operator node, provision another node, or modify/deploy the upstream Materios node. The local-operator CLI plan was frozen earlier as a possible acquisition route, but it is not an executable next step under the current resource constraint. Do not present it as the current plan unless access to a real node is explicitly established.

**Current route:** use only already available Materios/public infrastructure to obtain the evidence it actually exposes. The live public-RPC probe has already shown that the checked endpoints provide historical headers but not the required GRANDPA justification or historical execution/storage proof at the target. Keep Materios for the receipt lineage and storage-inclusion evidence it can support; seek a separate, already-operating source for independently verifiable GRANDPA finality and authority transitions. If no source provides the necessary cryptographic packet, B3-A stays OPEN. No trusted relay, operator attestation, current authority list, or drand beacon may be substituted for GRANDPA finality.

The documents below preserve earlier implementation options and contracts; they do not override the above operational constraint:
- [Local operator CLI proof plan](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/04-verification/MATERIOS-B3-LOCAL-OPERATOR-CLI-PROOF-v1.md)
- [Operator evidence acquisition handoff](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/04-verification/MATERIOS-B3-OPERATOR-EVIDENCE-ACQUISITION-HANDOFF-v1.md)
- [Operator patchset — fallback only](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/04-verification/MATERIOS-B3-OPERATOR-PATCHSET-v1.patch)
- [Standard GRANDPA RPC handoff — fallback context](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/04-verification/MATERIOS-B3-GRANDPA-RPC-HANDOFF.md)

Issue #50 is recorded below only as evidence that the public execution-proof RPC was not adopted upstream. Re-reading or retrying that issue is not the prescribed path. This note does not claim that any Materios block is unfinalized; it records the still-missing real witness and independent verification.

## Smoldot P2P acquisition attempt — 2026-10-21

The source-agnostic P2P light-client route was tested using the pinned Smoldot PR #3369 implementation, official SHA-256-pinned Materios v6 raw chain spec, and the sole public bootnode currently documented by Materios. The client reported the expected genesis identity, and some candidate historical headers were locally hash-bound. Across the original three runs and the corrected native-log [run #9](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951), **no FRNK justification was captured**. Run #9 removed the `system_health` RPC calls that had confounded run #8; it hash-bound five candidate headers, including the target, but returned no justification. Native sync logs recorded 36 observations over 350 seconds all at block 97,069 (22 in-progress, 14 idle), classified `WARP_SYNC_STALLED_AT_FIXED_BLOCK`. The earlier run #8 is treated as confounded for block-query availability because every health call and subsequent block queries timed out.

Detailed immutable artifact IDs, digests, candidate-by-candidate outcomes, and scope limits are recorded in [MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md](MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md). This is a failed proof-acquisition attempt, not evidence that any tested block is unfinalized and not a verifier failure. The current Smoldot revision is an open upstream PR rather than a merged release.

The operator guide mentions a justification-retaining public sync node as being deployed, but no usable public endpoint was found in the reviewed docs, issues, PRs, or commit search. The official snapshot/bootstrap documentation still names only one reliable public bootnode; the current snapshot is operational state recovery, not a substitute for historical finality proof. The next acquisition gate remains a documented endpoint for the announced service or another already-operating proof publisher. Because the single-bootnode path stalled again, stop repeating it absent a concrete new peer/source lead. The separate [fallback architecture proposal](MATERIOS-B3-A-FINALITY-EVIDENCE-ARCHITECTURE-FALLBACK-DECISION-2026-10-21.md) outlines a future permissionless evidence-publication path; it does not change today's trust model or close B3-A. Do not deploy a Materios node or weaken the trust boundary.

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

### Additional live witness probe — 2026-10-21

The later CI run [#39590324041](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590324041) tested the existing public `/rpc` endpoint again, independently of the Smoldot P2P probe. The uploaded `materios-real-grandpa-witness` packet (artifact ID `12341295881`, ZIP SHA-256 `56c8d7f5c77de9108d5f2993a1dcd7edcbd0c63fb5bb39399117356d11528e31`) records status `BLOCKED_NO_PUBLIC_GRANDPA_WITNESS`:

- The dense scan covered **769 blocks**, numbers `2,381,072–2,381,840`.
- No block in that scan contained a recognized GRANDPA `FRNK` justification. Four block responses had a non-null justification field, but none contained a GRANDPA justification.
- `grandpa_proveFinality` returned `-32601 Method not found`; the capture also could not obtain runtime code through `state_getCode` (`-32601 Method not found`).
- The finalized head and reported current GRANDPA set ID (`4220`) remain untrusted RPC observations, not a finality certificate or authenticated authority history.

This is an additional endpoint-availability result, not an assertion that the scanned blocks were unfinalized or that the chain's finality is invalid. The packet explicitly leaves cryptographic finality and authority-transition provenance false. It extends the known scan evidence but does not make the historical target's proof available.

### RPC method-catalogue check — 2026-10-21

The newer [Materios Existing-Route Proof Availability run #39590352016](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590352016) probed `rpc_methods` on the public `/preprod-rpc` endpoint. It received a valid catalogue of **85 advertised methods**. The following were **not listed**:

- `grandpa_proveFinality`
- `grandpa_subscribeJustifications`
- `grandpa_unsubscribeJustifications`
- `materios_b3_calculateCommitteeProof`
- `state_getCode`

The artifact `materios-existing-route-proof-probe-39590352016-1` (ID `12341796069`, ZIP SHA-256 `5fb6c9ceab5a72392ef1a4cf458adac389b471f4c15232b18d3d9101565b0a91`) also contains a native storage-trie proof that independently verifies membership of the requested key/value against the state root supplied by the HTTP RPC, using 10 proof nodes. This is **B3-B inclusion evidence only**: the proof packet explicitly keeps GRANDPA finality, authority provenance, deployed runtime identity, anchor-to-round binding, and B3 conformance false.

The following rerun [#39590352022](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590352022) repeated the witness capture at a slightly later head. It returned `BLOCKED_NO_PUBLIC_GRANDPA_WITNESS` for a second contiguous 769-block window, **2,381,088–2,381,856**, again with `blocks_with_grandpa_justification=[]`. The RPC-reported head was block `2,381,856`; this is an untrusted observation. Artifact `materios-real-grandpa-witness`, ID `12342350690`, ZIP SHA-256 `6fdef44520add9fcbf00a37d2789a93ced4cd920a4826c9185d8cb5cac8abd14`.

The resulting public capability picture is narrower and better evidenced than a generic RPC failure: the selected endpoint returns ordinary chain observations and storage proofs, but does not advertise either standard GRANDPA proof-delivery method, the Materios-specific execution-proof method, or `state_getCode`. This still proves only what this endpoint exposes at the time checked; it does not rule out a separate already-operating proof source.

### Direct WebSocket verification — 2026-10-21

The focused [Materios WebSocket GRANDPA Probe run #39592480972](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39592480972) connected to the documented public WebSocket endpoint `wss://materios.fluxpointstudios.com/preprod-rpc`, received an `rpc_methods` catalogue of **85 methods**, and confirmed both `system_chain = Materios Preprod v6` and the expected genesis hash `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`.

The live catalogue again did not list `grandpa_proveFinality`, `grandpa_subscribeJustifications`, or `grandpa_unsubscribeJustifications`. The probe then called the first two methods directly over WebSocket (not just checking the catalogue); both returned **`-32601 Method not found`**. A `chain_getBlock` query at the RPC-reported head **2,382,015** returned `justifications: null`. That head/hash is an untrusted endpoint observation. No finality payload or justification was captured.

Artifact `materios-websocket-grandpa-probe-39592480972-1`: ID `12342328397`, ZIP SHA-256 `9557340a51dc9a279136853a0ffaaa3a5fe1126297293f8f91fafdaac4936f4d`.

This closes the transport ambiguity: for the selected public endpoint, it is **not merely that the HTTP catalogue hides the methods**; the actual WebSocket calls reject them too. It still does not prove that no separate already-operating proof publisher exists.

### Public gateway peer discovery — 2026-10-21

The corrected live probe also queried both publicly documented chain-info routes: `https://materios.fluxpointstudios.com/chain-info` and `https://materios.fluxpointstudios.com/preprod-blobs/chain-info`. Both returned HTTP 200 and identical response SHA-256 `d0ab3269279ba779341f7aa51a31b0c576a7b83d5c280a24b68182470eb0c8d6`. Both reported the expected genesis, runtime spec version 242, best block 2,382,058, finalized block 2,382,056, and exactly the same single bootnode:

`/dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM`

After deduplication, the two APIs yielded **one unique public bootnode, not a second peer**. These are untrusted discovery observations only; returned best/finalized block numbers are not finality evidence. The probe artifact is run [#39593013066](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39593013066), artifact `materios-websocket-grandpa-probe-39593013066-1`, ID `12341638901`, SHA-256 `71d05518456821fcaf342a7f78bd46907aec1ffea325d803ed25cf7449037b42`.

This rules out the gateway's current public discovery list as a source of additional peers in the tested state. It does not rule out a private override or another unlisted provider.

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

## Next permitted action — alternate proof source, not another Materios issue pass

The previous public-RPC capability probe already closed that check. Do not repeat it, reopen issue #50, prepare an upstream patch, or assume the local-operator CLI can be run under the current constraint.

Continue on the current IMMORTAL branch by evaluating already-running, externally reachable proof sources against a strict acceptance test: can a source provide the raw GRANDPA justification (not only a finalized-head number), the ancestry headers, the historically applicable authority set/set ID, and enough authenticated authority-transition evidence for IMMORTAL to verify the target independently? The source is only an untrusted transport; trust comes from the existing verifier and pinned trust anchor, never from the provider's identity or its assertion.

Separate the evidence layers:

- **Materios receipts / B3-B inclusion:** retain and use the real receipt + storage-proof work already achieved, without relabelling it as finality.
- **B3-A finality and authority transitions:** seek an existing proof source compatible with independent GRANDPA verification. The public endpoints examined do not meet this gate.
- **drand / B3-D randomness:** useful for its separate beacon/randomness purpose; it does not certify Materios block finality or authority transitions.

If no already-operating source can deliver the required proof packet, record that constraint as the blocker and compare alternate consensus/proof paths as a separate architecture decision. Do not silently weaken the trust model. B3-A remains OPEN until a real artifact passes independent verification. No V3/Reveal/economic semantic changes are required.

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


## Supersession note — operational constraint

The earlier Notion checkpoint [MATERIOS B3-A — Authority Transition Triangulation — 11 Oct 2026](https://app.notion.com/p/3f6c4454d6d581e5b818f9ab312fce7e?pvs=204) records the local operator/CLI route as a primary technical design. This audit preserves that design as historical prepared work, but the later operating constraint that IMMORTAL has no node to operate and cannot activate or modify a Materios node takes precedence for current execution. Therefore the current next action is alternate, already-operating proof-source discovery, not local CLI execution or an upstream change.

### Published snapshot pointer check — 2026-10-21

The existing public snapshot manifest is reachable at `https://materios.fluxpointstudios.com/operator-snapshots/preprod/latest.json` and returned HTTP 200. Its recorded archive is:

- URL: `https://materios.fluxpointstudios.com/operator-snapshots/preprod/materios-preprod-rocksdb-20261016T093001Z.tar.gz`
- Manifest publish time: `20261016T093001Z`
- Published head block: `2309250`
- Advertised size: **3,848,386,217 bytes** (about 3.58 GiB)
- Manifest SHA-256: `97512dbea473c3d2e11e8db8c5b5b2a356e9da2d3e225c434cea2e055a63e49d`

A read-only one-byte range request to the archive URL returned **HTTP 404**. The archive was not downloaded or unpacked, and no node was started. The manifest therefore does not provide an accessible offline data source at the time of the probe. This is an observed availability failure for the published URL; it does not prove the artifact was permanently removed, and it does not tell us whether any GRANDPA justification is contained in the database.

Immutable manifest-only artifact: [snapshot-pointer run #39593881158](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39593881158), artifact ID `12342744743`, ZIP SHA-256 `b2cce9169cdb321cf37916484aef02a75bdaea126299e26cf5e5c54667dabd88`.

This leaves no usable source in the current tested set: the public RPC/WebSocket does not serve GRANDPA methods or justifications; the gateway advertises only one peer; Smoldot stalls against that peer; the snapshot pointer references an unavailable multi-gigabyte archive. B3-A remains **OPEN**. A future retest of the snapshot requires only checking the manifest URL/object availability first; do not attempt a multi-gigabyte download until the URL responds successfully and there is a concrete offline verification plan.
