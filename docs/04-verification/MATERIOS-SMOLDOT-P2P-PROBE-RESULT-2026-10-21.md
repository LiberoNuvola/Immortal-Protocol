# Materios B3-A — Smoldot P2P Finality Probe Results (2026-10-21)

Status: **NO RAW GRANDPA PROOF CAPTURED / B3-A OPEN**.

Branch: `work/b3-materios-provenance-evidence`.

## Purpose and trust boundary

This probe tested a possible proof-acquisition route that does not require IMMORTAL to operate, activate, or modify a Materios node. It used the pinned Smoldot proof-export change under review in [paritytech/smoldot#3369](https://github.com/paritytech/smoldot/pull/3369), the published Materios v6 raw chain spec, and the one public P2P bootnode currently documented by Materios.

The acquired chain-spec bytes matched the pinned SHA-256:

`77877aa63358af6cf0c78a3b106ac2d295da575973bec1c3ff51d53b3fa65aaa`

Smoldot reported the expected chain ID `materios_preprod_v6` and genesis hash:

`0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf`

The HTTP RPC was used only as an untrusted source of candidate block hashes and a diagnostic head number. No RPC-reported finalized head or source agreement was treated as a trust anchor.

## Run results

| Run | IMMORTAL code revision | Immutable artifact | Result |
|---|---|---|---|
| [#39588463820](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39588463820) | `064de0418a952f38a69fae60748d53f65a1f7672` | ID `12340029226`; ZIP SHA-256 `0817770c01d8c53ec6a23038c371309fe2a67e6ab3580578f1e91321225468f7` | 18 candidate blocks; 3 headers hash-bound; 0 FRNK justifications captured |
| [#39588504155](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39588504155) | `72c7603ffeaa967188b9ecf33c074d59d0b05837` | ID `12341098852`; ZIP SHA-256 `cf957ac9fda457d8dc23d922b9b71cbf82b2c214efb4dd7059ecac20d5d2a68c` | 18 candidate blocks; 4 headers hash-bound; 0 FRNK justifications captured |
| [#39588545434](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39588545434) | `810c49cea9c9cbd9089874c616f2e731cb767836` | ID `12339949549`; ZIP SHA-256 `d9b79ec7e85b36cb5554fdf4d1892e30344fe550d5f59b988708302da65dc074` | 18 candidate blocks; 3 headers hash-bound; 0 FRNK justifications captured |
| [#39598706602 (run #8)](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39598706602) | `711a0fb852f819b481692cbb1b84d0bd4dfcd245` | ID `12344858114`; JSON diagnostics retained in the ZIP artifact | 18 candidate queries all `QUERY_UNAVAILABLE`; 0 hash-bound headers; 0 FRNK justifications |
| [#39601026951 (run #9)](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951) | `3719db8655cc212deec7736641ac85d235bbf5c5` | ID `12346387679`; JSON diagnostics retained in the ZIP artifact | 18 candidate queries; 5 headers hash-bound; 0 FRNK justifications; sync telemetry parsed over 350 seconds |

For all three runs, the Smoldot logs repeatedly reported GRANDPA warp sync idle/in progress at block **97,069**, while the untrusted HTTP RPC reported a finalized head around block **2,381,706–2,381,714**. This is an observed light-client synchronization/availability problem in this test configuration; it is not evidence that the later blocks are unfinalized.

The best target-specific result was from run #39588545434:

- Activation target `1856408 / 0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e`: returned header SCALE bytes hash to the expected block hash.
- That response contained **no FRNK justification**.
- Nearby candidate blocks `1856587` and `1856708` also returned hash-bound headers but no FRNK justification.
- The other sampled blocks did not return a block object from Smoldot within the bounded probe.
- No raw GRANDPA justification was acquired from the subscription or block responses.

The candidate scan sampled the activation block and nearby descendant candidates at offsets `0, 1, 52, 59, 60, 61, 119, 120, 121, 179, 180, 181, 239, 240, 241, 299, 300, 301`. This is bounded evidence only; it is not an exhaustive scan of all Materios peers, all blocks, or every potential proof publisher.

## Run #8: diagnostic RPC interference observed

Run [#39598706602](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39598706602) used the first `system_health` instrumentation revision. Every sampled `system_health` request timed out, starting with the first probe immediately after genesis validation. Subsequent Smoldot `chain_getBlock` requests also timed out, and no historical header or justification was captured in this attempt. The native Smoldot log continued to alternate between “GrandPa warp sync in progress” and “idle” at block **97,069**.

This means the health-RPC instrumentation was not useful and the run is **confounded for historical block-query availability**; it cannot establish that the P2P peer lacks all requested blocks. The capture script was revised in commit [808e34b](https://github.com/LiberoNuvola/Immortal-Protocol/commit/808e34bfe11ae32fe54a50fe3fe7a00f065a8c9d) to stop issuing `system_health` and instead record warp-sync state directly from Smoldot's native log callback. The next bounded run is needed to measure historical queries without those extra RPC calls.

## Run #9: native sync-log diagnostics, health RPC removed

Run [#39601026951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951) removed the `system_health` queries that had timed out in run #8. It preserved the expected chain ID and genesis identity, and the historical block-query behaviour returned to the earlier pattern:

- 18 candidate blocks were queried.
- 5 returned headers whose reconstructed SCALE hash matched the requested block hash.
- The pinned activation target 1,856,408 was among those hash-bound headers, but its response contained no FRNK justification.
- No raw GRANDPA justification was captured from either the subscription or block responses.
- 13 other candidate queries returned no block object from Smoldot in the bounded probe.

The native Smoldot log collector recorded 36 warp-sync observations over 350 seconds: 22 “in progress” and 14 “idle”. Every sample reported the same block **97,069**, so the derived classification was `WARP_SYNC_STALLED_AT_FIXED_BLOCK`. This is a local observation of the tested client/peer route, not proof that later blocks are unfinalized or that the peer is globally unavailable.

Immutable artifact: ID `12346387679`, [workflow run #39601026951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951). The workflow failed closed because no raw proof was captured; its candidate query step and artifact upload succeeded.

## Conclusion

**The tested single-bootnode Smoldot path is not currently a usable source of the needed GRANDPA witness.** It verifies the chain identity and can retrieve some historical headers, but it neither completes warp sync beyond block 97,069 nor returns a raw justification in the sampled target/descendant blocks.

Do not promote any of these artifacts to finality evidence. They are acquisition diagnostics, not proofs of finality.

The upstream Materios operator guide mentions that a justification-retaining public sync node is being deployed, but the public docs reviewed for this work still publish only the existing bootnode and no verifiable endpoint for that service. GitHub searches for the phrase found the operator guide note only, with no public endpoint, issue, or pull request that makes the service usable from this workflow. This is not proof that the service does not exist privately; its public availability remains **UNVERIFIED**.

The next viable source-acquisition gate is therefore: **verify that the already-operating justification-retaining sync service has a public, documented P2P/RPC endpoint, or find another already-operating provider that returns the required proof packet**. Do not deploy a Materios node, trust a named operator, bypass the genesis-rooted verifier, or substitute drand/receipt evidence for GRANDPA.

## Additional Materios protocol-reproducibility caveat

Upstream [Materios #105](https://github.com/Flux-Point-Studios/materios/issues/105) remains open and records a separate preprod v6 risk: committee selection may read unsettled Cardano epoch data from a moving db-sync tip, meaning later replay may derive a different committee. Upstream states that a full replay has not been performed and no specific bad block is proven. The opt-in strict-rule switch in [Materios #109](https://github.com/Flux-Point-Studios/materios/issues/109) remains open and has not been verified active.

This does not invalidate a GRANDPA signature or prove any target block invalid. It means an eventual proof packet must authenticate the actual ordered GRANDPA authority-set transitions and Materios-specific selector/enactment evidence; re-running selection against today's Cardano/db-sync view is not a substitute.

## Acceptance remains unchanged

B3-A stays **OPEN** until an immutable real witness is independently verified from the agreed genesis trust anchor through GRANDPA signature/quorum, ancestry, ordered authority-set history, runtime/input commitment, Materios-native execution proof, and the existing `VerifiedAuthoritySetTransition` boundary. No production or B3 conformance claim is made here.
