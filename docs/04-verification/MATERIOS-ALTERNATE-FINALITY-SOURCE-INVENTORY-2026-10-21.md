# Materios B3-A — Alternate Finality Source Inventory (2026-10-21)

Status: **NO QUALIFYING ALREADY-OPERATING PUBLIC SOURCE FOUND / B3-A OPEN**

Branch: `work/b3-materios-provenance-evidence`

## Purpose and operating constraint

This is the source-discovery record for B3-A. It applies the frozen IMMORTAL trust model to already-operating, externally reachable infrastructure. IMMORTAL may acquire bytes from any party, but accepts finality only after independently checking the raw GRANDPA justification, its target/header binding and ancestry, and the complete authenticated authority-set history from the pinned genesis trust anchor.

The current operational constraint is unchanged: IMMORTAL has no Materios node available to operate, provision, activate, or modify. The local operator CLI design is preserved as historical work but is not an available next step. This investigation makes no upstream Materios change.

## Source inventory

| Candidate | Evidence reviewed | Classification | Why it does / does not satisfy B3-A |
|---|---|---|---|
| Materios public HTTP RPC `/rpc` and `/preprod-rpc` | Existing read-only probes and bounded block scans; see the source decision document and run artifacts linked below | **UNAVAILABLE for GRANDPA proof transport** | The methods catalogue does not advertise `grandpa_proveFinality` or `grandpa_subscribeJustifications`; direct WebSocket calls returned method-not-found. Tested block responses had no FRNK justification. The endpoints can still return ordinary headers and receipt/storage data. |
| Materios Gateway, `/chain-info`, explorer, receipt firehose | Public `materios-gateway` source at commit `78a654465be54c002a027806f496350e8cbf860a`; `chain-info` queries `chain_getFinalizedHead` and `chain_getHeader`; firehose carries receipts/events and connection status | **OBSERVATION / RECEIPT DISCOVERY ONLY** | A reported finalized height, a block header, indexed event, or receipt/anchor is not a cryptographic GRANDPA proof. No raw justification plus authenticated authority-transition packet is exposed by these reviewed routes. |
| Published Materios P2P bootnode | Official node-requirements and operator docs publish one address: `/dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM` | **ONE DOCUMENTED PEER; NOT A PROOF ENDPOINT** | The official guide says one bootnode is enough to discover the rest and that more will be published as they come online. No second public bootnode or separate historical-proof RPC endpoint was found in the reviewed current public documentation. |
| Smoldot light-client P2P route | Three pinned runs under upstream PR #3369; detailed results in [MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md](MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md) | **FAILED ACQUISITION ATTEMPT, NOT A FINALITY VERDICT** | The client accepted the pinned chain-spec digest and reported the expected Materios genesis. It remained in warp sync around block 97,069 while the untrusted HTTP RPC reported a much later head. Across the sampled candidates it captured no FRNK justification. This demonstrates that the tested one-bootnode configuration did not deliver the witness; it does not prove that later blocks are unfinalized or that no other peer/service exists. |
| Announced justification-retaining public sync node | [Materios operator guide](https://github.com/Flux-Point-Studios/materios/blob/main/docs/OPERATOR_KIT.md) says FPS is deploying one so nodes syncing from behind can obtain old justifications | **NOT YET USABLE FROM PUBLIC EVIDENCE** | The public guide does not specify a usable hostname/port, P2P peer ID, RPC/WSS URL, or readiness status for this service. It may exist privately or be in deployment; the reviewed evidence is insufficient to connect to it. Do not guess hostnames or claim availability. |
| Orynq SDK's generic GRANDPA verifier and recorded fixtures | [Orynq issue #98](https://github.com/Flux-Point-Studios/orynq-sdk/issues/98); `packages/anchors-midnight/src/__tests__/fixtures/preprod-blocks.json` at the public `main` ref | **POSSIBLE RESEARCH INPUT; NOT A MATERIOS WITNESS SOURCE** | The recorded fixtures identify the chain as **Midnight Preprod** with genesis `0xdf831b09a8baa92badf47762ce5ac439b7e47e3ed3d39600cfdd44fad552361b`, not Materios v6 genesis `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`. The package has no cited raw proof for the pinned Materios target. Issue #98 also records verifier-hardening findings; its October 5 comment says L1/L2 were fixed on a feature branch while L3 remained open. Do not import another chain's fixtures as Materios evidence or replace IMMORTAL's normative verifier with an unqualified copy. |
| Materios receipt / Cardano L1 anchor data | Existing B3-B receipt lineage and independently verified storage-inclusion evidence | **USEFUL, BUT A DIFFERENT CLAIM** | Receipt availability, Cardano anchor inclusion and trie membership are distinct from Materios GRANDPA finality and authority-set provenance. Preserve these results as B3-B/evidence lineage without upgrading them to B3-A. |
| drand | Existing isolated randomness PoC | **B3-D RANDOMNESS ONLY** | A beacon output does not certify that a particular Materios block was finalized or authenticate a Materios authority transition. |

## Latest live discovery confirmation — public Gateway + WebSocket

The later read-only [Materios WebSocket GRANDPA Probe run #39593013066](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39593013066) independently queried the two public peer-discovery routes:

- `https://materios.fluxpointstudios.com/chain-info`
- `https://materios.fluxpointstudios.com/preprod-blobs/chain-info`

Both returned HTTP 200 and the same response SHA-256, `d0ab3269279ba779341f7aa51a31b0c576a7b83d5c280a24b68182470eb0c8d6`. Both listed the same **single** bootnode, `/dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM`; unique bootnode count was 1. The response reported genesis `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`, runtime spec version 242, best block 2,382,058 and finalized block 2,382,056. Those heights remain untrusted gateway observations, not finality evidence.

Over the same WebSocket run, `rpc_methods` returned 85 methods but did not list `grandpa_proveFinality`, `grandpa_subscribeJustifications`, or `grandpa_unsubscribeJustifications`. Direct calls to the first two returned JSON-RPC `-32601 Method not found`. `chain_getBlock` at the reported head had `justifications: null`. No raw GRANDPA payload was captured.

Immutable artifact: `materios-websocket-grandpa-probe-39593013066-1`, ID `12341638901`, ZIP SHA-256 `71d05518456821fcaf342a7f78bd46907aec1ffea325d803ed25cf7449037b42`.

**Result:** the gateway's published peer-discovery metadata does not reveal another public peer candidate, and its public RPC still does not supply the missing finality witness. This is positive evidence of the currently published surface, not proof that a private or undocumented service does not exist.

## Follow-up after WebSocket probe classification fix — 2026-10-21

The workflow `.github/workflows/materios-websocket-grandpa-probe.yml` now distinguishes probe/integrity failure from a completed negative acquisition:
- `ACQUISITION_ERROR`: connection or pinned Materios genesis identity does not validate.
- `WITNESS_UNAVAILABLE`: endpoint identity is valid, but no raw GRANDPA finality payload/FRNK justification was returned.
- `WITNESS_CAPTURED_UNVERIFIED`: raw payload is captured, but the independent verifier has not accepted it.

Run [#39595137122](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39595137122) completed successfully with `WITNESS_UNAVAILABLE`; the workflow's success does not mean B3-A passed. The separate fix to render the summary classification correctly is in commit `7530efacd3481470af81f1d250ba061422b0fb54`.

No qualifying new witness source was identified by this workflow. B3-A remains OPEN and `MATERIOS_FINALITY_PROOF_UNAVAILABLE` remains fail-closed. This classification change is operational only and does not change trust semantics.

## Evidence references already in the repository

- [Public-data-only feasibility ruling](MATERIOS-B3-A-PUBLIC-DATA-ONLY-FEASIBILITY-2026-10-21.md)
- [Frozen finality-source decision](MATERIOS-FINALITY-PROOF-SOURCE-DECISION-2026-10-21.md)
- [Smoldot P2P probe results and immutable artifacts](MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md)
- [WebSocket GRANDPA capability probe workflow](../../.github/workflows/materios-websocket-grandpa-probe.yml)
- [Existing-route proof availability workflow](../../.github/workflows/materios-existing-route-proof-availability.yml)
- [Official Materios node requirements](https://github.com/Flux-Point-Studios/docs/blob/main/materios/node-requirements.md)
- [Official Materios operator guide](https://github.com/Flux-Point-Studios/materios/blob/main/docs/OPERATOR_KIT.md)
- [Materios Gateway chain-info implementation](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/src/routes/chain-info.ts)
- [Materios Gateway firehose implementation](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/src/firehose/chain-events.ts)

## Parallel path: acquisition and architecture alternatives — 2026-10-21

A fresh read of the official [Materios Operator Kit](https://github.com/Flux-Point-Studios/materios/blob/main/docs/OPERATOR_KIT.md) still documents the FPS-side justification-pruning problem and says a justification-retaining public sync node is being deployed. The current public text still gives no endpoint, P2P peer ID, RPC method, or readiness signal for that service. This is a lead to resolve, not an available source.

### Ranked alternatives

| Priority | Path | Trustless fit | Current assessment / exit criterion |
|---|---|---|---|
| A | **Discover and probe the announced justification-retaining public sync node** | High: transport may be operated by FPS, but IMMORTAL independently validates every proof | Best next low-cost step. Resume only when a public endpoint/peer ID is published or supplied as a concrete lead; then probe identity, historical block/justification availability, and reproducibility. Do not guess DNS names. |
| B | **Acquire raw justification bytes from another already-running Materios full-node/RPC provider** | High if the proof is checked from the pinned genesis and all required authority transitions are authenticated | Search provider docs/announcements for an actual endpoint, not just an explorer or finalized-height API. A provider is a byte source, not a trust anchor. Exit if no endpoint and no raw FRNK payload. |
| C | **Permissionless P2P proof acquisition using Substrate block requests** | Potentially high; peers are untrusted and proof verification remains local | Research a minimal client/protocol path that can request blocks with justifications from existing peers, including authority-change blocks. Initial source inspection supports this as technically plausible but not yet proven: smoldot's low-level block-request codec has an explicit `justifications` request field ([`block_request.rs`](https://github.com/paritytech/smoldot/blob/cb059fa38e411d11c8a279668b2570b9124f8920/lib/src/network/codec/block_request.rs)), while its light-client compatibility layer has paths that return headers with an empty justification vector ([`parachain.rs`](https://github.com/paritytech/smoldot/blob/cb059fa38e411d11c8a279668b2570b9124f8920/light-base/src/sync_service/parachain.rs)). Thus the public JSON-RPC limitation is not proof that the underlying Substrate P2P protocol cannot carry justifications; the practical blocker is accessing/implementing the lower-level request/response path and finding a peer that actually serves the requested payload. The existing probe stalled during warp sync and obtained no witness. First validate protocol/library support against the pinned Materios chain spec and obtain one real raw proof before expanding scope. |
| D | **Change the B3-A finality trust model / use another finality mechanism** | Unknown until a complete alternative proof and trust anchor are specified | Last resort and a separate architecture decision. A gateway height, signed operator statement, receipt, drand output, or current authority list is not a replacement for finality proof. Any alternative must specify genesis/trust anchor, authenticated transitions, target binding, verifier, on-chain cost, liveness and adversarial assumptions before implementation. |

### Important distinction: evidence availability versus finality semantics

- A different RPC or P2P peer can solve **data acquisition** without changing the IMMORTAL trust model.
- A different verifier cannot synthesize signatures that were never acquired.
- A current finalized header or state/execution proof alone does not establish the full historical GRANDPA authority-transition chain.
- B3-B receipt/storage proofs remain useful for their own claim, but must not be promoted to B3-A finality.
- Do not reopen Materios issue #50 as a substitute for this work; it is not the chosen next step. Do not touch V3, Reveal, PRE-RICH economics, or Materios authority-selector semantics.

### Next execution order

1. Continue monitoring the official operator-kit documentation and public Materios repo for a concrete sync-node endpoint/peer ID or readiness announcement.
2. In parallel, perform a bounded protocol/library feasibility check for a purpose-built P2P block-with-justification requester. The acceptance test is one authentic, raw FRNK justification bound to a real Materios block, not a mocked fixture.
3. If either source yields bytes, route them through the existing independent verifier and preserve all current fail-closed checks.
4. If neither path yields a witness, stop repeating endpoint probes and prepare a separately reviewed architecture decision. Until then MATERIOS_FINALITY_PROOF_UNAVAILABLE remains fail-closed.

## Decision and stopping rule

**No reviewed, already-operating public source currently qualifies as the B3-A witness source.** The missing item is not another boolean endpoint or another verifier implementation; it is an actual cryptographic witness packet from a source that can serve it.

Keep the result fail-closed as `MATERIOS_FINALITY_PROOF_UNAVAILABLE`. Do not claim B3-A GREEN, use a current authority list as its own trust anchor, substitute a gateway's finalized-height report, trust an operator signature, promote drand, infer a justification from a header, or keep repeating the same public-RPC/issue-#50 check.

The next acquisition attempt is justified only when one of these concrete conditions occurs:

1. The already-operating justification-retaining service publishes a documented, reachable P2P/RPC endpoint or peer identity; or
2. A different already-operating provider is identified that can return a raw FRNK justification and the required ancestry/authority-transition evidence.

The source remains an untrusted transport. Any bytes obtained must still pass IMMORTAL's independent verifier, including genesis-rooted authority provenance and the Materios-specific runtime/input/execution-proof boundary. A recent valid GRANDPA proof alone does not close the historical activation-transition gate. If neither source becomes available, the next decision is a separate architecture decision about what proof of finality can be obtained from the existing public data—not another speculative endpoint or a weakened trust model.

**B3-A remains OPEN. B3-B receipt/storage evidence remains usable within its stated scope. No V3, Reveal, economics, or Materios selector semantics are changed.**
