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
| Smoldot light-client P2P route / upstream justification API | Existing [IMMORTAL P2P probe](../../poc/materios-smoldot/README.md), pinned to [Smoldot PR #3369](https://github.com/paritytech/smoldot/pull/3369), which remains open as of 2026-10-21; underlying issue [#3288](https://github.com/paritytech/smoldot/issues/3288) is also open | **NO WITNESS FROM TESTED SINGLE-BOOTNODE ROUTE / B3-A OPEN** | Run [#39601026951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951) used native sync-log telemetry without health RPC calls, hash-bound 5 of 18 sampled headers including activation target 1,856,408, and captured 0 FRNK justifications. Its 36 sync-log observations over 350 seconds all reported block #97,069 (22 in progress / 14 idle), assessed as `WARP_SYNC_STALLED_AT_FIXED_BLOCK`. Run #8's health-RPC timeouts are separately marked as confounded. The PR provides the missing JSON-RPC API but does not provide Materios archival data or solve the tested peer's fixed-block warp-sync stall. This is failure of the tested acquisition route, not evidence that later blocks are unfinalized. |
| Announced justification-retaining public sync node | [Materios operator guide](https://github.com/Flux-Point-Studios/materios/blob/main/docs/OPERATOR_KIT.md) says FPS is deploying one so nodes syncing from behind can obtain old justifications | **NOT YET USABLE FROM PUBLIC EVIDENCE** | The public guide does not specify a usable hostname/port, P2P peer ID, RPC/WSS URL, or readiness status for this service. It may exist privately or be in deployment; the reviewed evidence is insufficient to connect to it. Do not guess hostnames or claim availability. |
| Orynq SDK's generic GRANDPA verifier and recorded fixtures | [Orynq issue #98](https://github.com/Flux-Point-Studios/orynq-sdk/issues/98); `packages/anchors-midnight/src/__tests__/fixtures/preprod-blocks.json` at the public `main` ref | **POSSIBLE RESEARCH INPUT; NOT A MATERIOS WITNESS SOURCE** | The recorded fixtures identify the chain as **Midnight Preprod** with genesis `0xdf831b09a8baa92badf47762ce5ac439b7e47e3ed3d39600cfdd44fad552361b`, not Materios v6 genesis `0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`. The package has no cited raw proof for the pinned Materios target. Issue #98 also records verifier-hardening findings; its October 5 comment says L1/L2 were fixed on a feature branch while L3 remained open. Do not import another chain's fixtures as Materios evidence or replace IMMORTAL's normative verifier with an unqualified copy. |
| Materios receipt / Cardano L1 anchor data | Existing B3-B receipt lineage and independently verified storage-inclusion evidence | **USEFUL, BUT A DIFFERENT CLAIM** | Receipt availability, Cardano anchor inclusion and trie membership are distinct from Materios GRANDPA finality and authority-set provenance. Preserve these results as B3-B/evidence lineage without upgrading them to B3-A. |
| drand | Existing isolated randomness PoC | **B3-D RANDOMNESS ONLY** | A beacon output does not certify that a particular Materios block was finalized or authenticate a Materios authority transition. |

## Additional official infrastructure documentation checked — 2026-10-21

The official [Current-Snapshot Bootstrap guide](https://github.com/Flux-Point-Studios/docs/blob/main/materios/current-snapshot-bootstrap.md) confirms that the public operator path still identifies **exactly one reliable public bootnode**. Its hourly snapshot manifest points to a RocksDB tarball containing `data/chains/materios_preprod_v6/db/`, intended to restore an operator to current state and avoid the known historical-sync problem. It does not publish a second P2P peer or a justification-serving RPC endpoint.

The guide's post-restore canonical-room self-check compares a local block hash to the hash reported by the public `/chain-info` route. That is useful operator diagnostics, but under IMMORTAL's frozen trust boundary it is not a GRANDPA witness: the public hash remains an untrusted claim unless bound to the raw justification and authenticated authority history. A snapshot can be useful for operations, but must not be treated as a substitute for the missing proof packet.

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
- [Fallback architecture proposal — permissionless finality-evidence publication](MATERIOS-B3-A-FINALITY-EVIDENCE-ARCHITECTURE-FALLBACK-DECISION-2026-10-21.md)
- [Smoldot P2P probe results and immutable artifacts](MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md)
- [WebSocket GRANDPA capability probe workflow](../../.github/workflows/materios-websocket-grandpa-probe.yml)
- [Existing-route proof availability workflow](../../.github/workflows/materios-existing-route-proof-availability.yml)
- [Official Materios node requirements](https://github.com/Flux-Point-Studios/docs/blob/main/materios/node-requirements.md)
- [Official Materios operator guide](https://github.com/Flux-Point-Studios/materios/blob/main/docs/OPERATOR_KIT.md)
- [Materios Gateway chain-info implementation](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/src/routes/chain-info.ts)
- [Materios Gateway firehose implementation](https://github.com/Flux-Point-Studios/materios-gateway/blob/78a654465be54c002a027806f496350e8cbf860a/src/firehose/chain-events.ts)

### Upstream API feasibility check — 2026-10-21

A fresh read of [smoldot issue #3288](https://github.com/paritytech/smoldot/issues/3288) and [PR #3369](https://github.com/paritytech/smoldot/pull/3369) confirms that the missing justification API has an upstream implementation proposal, but it is **not merged**: both issue and PR remain open, and the PR head is the exact commit already pinned by the existing IMMORTAL P2P workflow (c898452405be712c6037ad956464b3fe9f9907f4). The PR provides:
- grandpa_subscribeJustifications / grandpa_unsubscribeJustifications for live proofs;
- chain_getBlock responses with a justification when smoldot can obtain and verify it;
- longer retention of authority-set-change proofs for sequential consumers.

This changes the recommended engineering priority: we do not need to recreate the proposed RPC surface. We need to diagnose why the existing pinned light client does not acquire from the published Materios peer. The probe is already configured to verify the raw chain-spec digest and genesis identity, ask the P2P client for historical blocks, reconstruct the SCALE header and check the justification target hash. It must continue to treat the result as acquisition evidence only.

Bounded next action:
1. Stop repeating the same single-bootnode path: run #9 confirms that removing diagnostic RPC interference restores the old behaviour but leaves warp sync fixed at block #97,069 and still produces no justification.
2. Resume P2P acquisition only if a concrete additional peer ID/address or the announced justification-retaining sync endpoint becomes available in official documentation or is provided as a specific lead. Do not guess DNS names or scan arbitrary hosts.
3. In parallel, continue the separate verification analysis of the preprod-v6 historical selector inputs, maintaining `HISTORICAL_SELECTOR_REPRODUCIBILITY_UNVERIFIED` until target-specific evidence is available.
4. Accept B3-A only when a raw FRNK justification is captured and independently checked against its target header, then the genesis-rooted authority history and Materios-specific selection-input/runtime/execution proof pass the existing verifier. A current-block proof alone would prove transport, not the pinned historical transition.

## Parallel path: acquisition and architecture alternatives — 2026-10-21

A fresh read of the official [Materios Operator Kit](https://github.com/Flux-Point-Studios/materios/blob/main/docs/OPERATOR_KIT.md) still documents the FPS-side justification-pruning problem and says a justification-retaining public sync node is being deployed. The current public text still gives no endpoint, P2P peer ID, RPC method, or readiness signal for that service. This is a lead to resolve, not an available source.

### Ranked alternatives

| Priority | Path | Trustless fit | Current assessment / exit criterion |
|---|---|---|---|
| A | **Discover and probe the announced justification-retaining public sync node** | High: transport may be operated by FPS, but IMMORTAL independently validates every proof | Best next low-cost step. Resume only when a public endpoint/peer ID is published or supplied as a concrete lead; then probe identity, historical block/justification availability, and reproducibility. Do not guess DNS names. |
| B | **Acquire raw justification bytes from another already-running Materios full-node/RPC provider** | High if the proof is checked from the pinned genesis and all required authority transitions are authenticated | Search provider docs/announcements for an actual endpoint, not just an explorer or finalized-height API. A provider is a byte source, not a trust anchor. Exit if no endpoint and no raw FRNK payload. |
| C | **Permissionless P2P proof acquisition using Substrate block requests** | Potentially high; peers are untrusted and proof verification remains local | Use the existing IMMORTAL probe pinned to [Smoldot PR #3369](https://github.com/paritytech/smoldot/pull/3369), rather than writing a duplicate P2P client immediately. The PR (still open as of 2026-10-21) exposes grandpa_subscribeJustifications and makes chain_getBlock return locally verified or peer-supplied justifications; the underlying issue #3288 describes the same missing API. It relies on Substrate P2P machinery already present in smoldot, including block requests with justifications=true. The latest result is [run #39601026951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951), using native Smoldot sync-log diagnostics without `system_health` RPC calls. It hash-verified five candidate headers, including the pinned activation header, but captured zero FRNK justifications; 13 candidate queries returned no block object. Over 350 seconds, 36 native warp-sync observations reported the same block #97,069 (22 in-progress, 14 idle), classified `WARP_SYNC_STALLED_AT_FIXED_BLOCK`. Artifact ID `12346387679`. Thus run #8's extra health RPCs were indeed confounding, but removing them does not resolve this tested route's stuck warp sync or supply the witness. No second public peer or usable justification-retaining endpoint is documented. Preserve the separation between transport acquisition and historical authority-transition verification. Do not label a workflow green as B3-A closure. |
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


## New upstream correctness risk: historical Preprod v6 selector reproducibility — 2026-10-21

A review of the official Materios repository identified a separate issue from proof-byte acquisition:

- [Materios issue #105](https://github.com/Flux-Point-Studios/materios/issues/105) remains **OPEN**. It documents that Preprod v6's historical committee draws can query Cardano epoch E while E is still current, so the db-sync result moves with each node's tip. A later replay against E's final state can yield a different committee and fail `InvalidValidatorsHashMismatch`.
- The issue explicitly says **no replay of v6 history against db-sync was run** and no specific failing block is known. This is therefore a material, evidence-backed risk hypothesis—not proof that any particular B3 target is invalid or unverifiable.
- [PR #100](https://github.com/Flux-Point-Studios/materios/pull/100) was merged on 2026-10-21 and leaves the v6 relaxation permanently selected by the pinned genesis hash. It does not introduce an automatic date-based switch to the strict rule.
- [Issue #109](https://github.com/Flux-Point-Studios/materios/issues/109) remains **OPEN** and proposes a future opt-in chain-state switch to the strict Ariadne rule. It requires a coordinated rollout and a freeze of committee inputs; it is not an available deployed fix and is not itself a historical proof source.

### B3-A impact

Treat this as a second, independent gate alongside GRANDPA witness acquisition:

1. Obtaining a raw FRNK justification proves neither that the historical selector inputs are reproducible nor that the Materios-specific transition proof is complete.
2. A retrospective execution of the selector against the final state of a Cardano epoch must not be assumed equivalent to the data the block's author actually observed while that epoch was still changing.
3. The B3-A verifier needs target-specific evidence binding the selector result to authenticated inputs/commitments and the exact runtime/activation block. Any proposed replay path must show that it reconstructs the historical observation, not silently substitute the present or final epoch state.
4. The pinned target used by IMMORTAL (block 1,856,408, hash `0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e`) has **not** been classified by the evidence reviewed here as affected or unaffected by #105.

**Required classification until target-specific evidence exists:** `HISTORICAL_SELECTOR_REPRODUCIBILITY_UNVERIFIED`.

This finding does not justify weakening GRANDPA verification, replacing the genesis trust anchor, changing Materios selector semantics, or reopening Materios issue #50. It means the exact historical-input binding must be evaluated in addition to finding a transport that can supply raw justification bytes.
