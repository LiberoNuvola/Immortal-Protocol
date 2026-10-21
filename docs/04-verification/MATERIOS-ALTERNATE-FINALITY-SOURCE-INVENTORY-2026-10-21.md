# Materios B3-A — Alternate Finality Source Inventory (2026-10-21)

Status: **NO QUALIFYING ALREADY-OPERATING PUBLIC SOURCE FOUND / B3-A OPEN**

Branch: \`work/b3-materios-provenance-evidence\`

## Purpose and operating constraint

This is the source-discovery record for B3-A. It applies the frozen IMMORTAL trust model to already-operating, externally reachable infrastructure. IMMORTAL may acquire bytes from any party, but accepts finality only after independently checking the raw GRANDPA justification, its target/header binding and ancestry, and the complete authenticated authority-set history from the pinned genesis trust anchor.

The current operational constraint is unchanged: IMMORTAL has no Materios node available to operate, provision, activate, or modify. The local operator CLI design is preserved as historical work but is not an available next step. This investigation makes no upstream Materios change.

## Source inventory

| Candidate | Evidence reviewed | Classification | Why it does / does not satisfy B3-A |
|---|---|---|---|
| Materios public HTTP RPC \`/rpc\` and \`/preprod-rpc\` | Existing read-only probes and bounded block scans; see the source decision document and run artifacts linked below | **UNAVAILABLE for GRANDPA proof transport** | The methods catalogue does not advertise \`grandpa_proveFinality\` or \`grandpa_subscribeJustifications\`; direct WebSocket calls returned method-not-found. Tested block responses had no FRNK justification. The endpoints can still return ordinary headers and receipt/storage data. |
| Materios Gateway, \`/chain-info\`, explorer, receipt firehose | Public \`materios-gateway\` source at commit \`78a654465be54c002a027806f496350e8cbf860a\`; \`chain-info\` queries \`chain_getFinalizedHead\` and \`chain_getHeader\`; firehose carries receipts/events and connection status | **OBSERVATION / RECEIPT DISCOVERY ONLY** | A reported finalized height, a block header, indexed event, or receipt/anchor is not a cryptographic GRANDPA proof. No raw justification plus authenticated authority-transition packet is exposed by these reviewed routes. |
| Published Materios P2P bootnode | Official node-requirements and operator docs publish one address: \`/dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM\` | **ONE DOCUMENTED PEER; NOT A PROOF ENDPOINT** | The official guide says one bootnode is enough to discover the rest and that more will be published as they come online. No second public bootnode or separate historical-proof RPC endpoint was found in the reviewed current public documentation. |
| Smoldot light-client P2P route | Three pinned runs under upstream PR #3369; detailed results in [MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md](MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md) | **FAILED ACQUISITION ATTEMPT, NOT A FINALITY VERDICT** | The client accepted the pinned chain-spec digest and reported the expected Materios genesis. It remained in warp sync around block 97,069 while the untrusted HTTP RPC reported a much later head. Across the sampled candidates it captured no FRNK justification. This demonstrates that the tested one-bootnode configuration did not deliver the witness; it does not prove that later blocks are unfinalized or that no other peer/service exists. |
| Announced justification-retaining public sync node | [Materios operator guide](https://github.com/Flux-Point-Studios/materios/blob/main/docs/OPERATOR_KIT.md) says FPS is deploying one so nodes syncing from behind can obtain old justifications | **NOT YET USABLE FROM PUBLIC EVIDENCE** | The public guide does not specify a usable hostname/port, P2P peer ID, RPC/WSS URL, or readiness status for this service. It may exist privately or be in deployment; the reviewed evidence is insufficient to connect to it. Do not guess hostnames or claim availability. |
| Orynq SDK's generic GRANDPA verifier and recorded fixtures | [Orynq issue #98](https://github.com/Flux-Point-Studios/orynq-sdk/issues/98); \`packages/anchors-midnight/src/__tests__/fixtures/preprod-blocks.json\` at the public \`main\` ref | **POSSIBLE RESEARCH INPUT; NOT A MATERIOS WITNESS SOURCE** | The recorded fixtures identify the chain as **Midnight Preprod** with genesis \`0xdf831b09a8baa92badf47762ce5ac439b7e47e3ed3d39600cfdd44fad552361b\`, not Materios v6 genesis \`0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf\`. The package has no cited raw proof for the pinned Materios target. Issue #98 also records verifier-hardening findings; its October 5 comment says L1/L2 were fixed on a feature branch while L3 remained open. Do not import another chain's fixtures as Materios evidence or replace IMMORTAL's normative verifier with an unqualified copy. |
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

## Evidence references already in the repository

- [Frozen finality-source decision](MATERIOS-FINALITY-PROOF-SOURCE-DECISION-2026-10-21.md)
- [Smoldot P2P probe results and immutable artifacts](MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md)
- [WebSocket GRANDPA capability probe workflow](../../.github/workflows/materios-websocket-grandpa-probe.yml)
- [Existing-route proof availability workflow](../../.github/workflows/materios-existing-route-proof-availability.yml)
- [Official Materios node requirements](https://github.com/Flux-Point-Studios/docs/blob/main/materios/node-requirements.md)
- [Official Materios operator guide](https://github.com/Flux-Point-Studios/materios/blob/main/docs/OPERATOR_KIT.md)
- [Materios Gateway chain-info implementation](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/src/routes/chain-info.ts)
- [Materios Gateway firehose implementation](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/src/firehose/chain-events.ts)

## Decision and stopping rule

**No reviewed, already-operating public source currently qualifies as the B3-A witness source.** The missing item is not another boolean endpoint or another verifier implementation; it is an actual cryptographic witness packet from a source that can serve it.

Keep the result fail-closed as \`MATERIOS_FINALITY_PROOF_UNAVAILABLE\`. Do not claim B3-A GREEN, use a current authority list as its own trust anchor, substitute a gateway's finalized-height report, trust an operator signature, promote drand, infer a justification from a header, or keep repeating the same public-RPC/issue-#50 check.

The next acquisition attempt is justified only when one of these concrete conditions occurs:

1. The already-operating justification-retaining service publishes a documented, reachable P2P/RPC endpoint or peer identity; or
2. A different already-operating provider is identified that can return a raw FRNK justification and the required ancestry/authority-transition evidence.

The source remains an untrusted transport. Any bytes obtained must still pass IMMORTAL's independent verifier, including genesis-rooted authority provenance and the Materios-specific runtime/input/execution-proof boundary. A recent valid GRANDPA proof alone does not close the historical activation-transition gate. If neither source becomes available, the next decision is a separate architecture decision about what proof of finality can be obtained from the existing public data—not another speculative endpoint or a weakened trust model.

**B3-A remains OPEN. B3-B receipt/storage evidence remains usable within its stated scope. No V3, Reveal, economics, or Materios selector semantics are changed.**
