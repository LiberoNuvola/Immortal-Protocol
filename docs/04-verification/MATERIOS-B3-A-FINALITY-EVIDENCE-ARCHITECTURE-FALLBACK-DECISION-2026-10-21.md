# B3-A — Finality Evidence Architecture Fallback Decision (2026-10-21)

Status: **PROPOSED ARCHITECTURE DECISION — NO PROTOCOL CHANGE APPROVED / B3-A OPEN**

Branch: `work/b3-materios-provenance-evidence`

Related records:
- [Trustless/permissionless verification decision](B3-A-TRUSTLESS-PERMISSIONLESS-VERIFICATION-DECISION-v1.md)
- [Public-data-only feasibility ruling](MATERIOS-B3-A-PUBLIC-DATA-ONLY-FEASIBILITY-2026-10-21.md)
- [Alternate source inventory](MATERIOS-ALTERNATE-FINALITY-SOURCE-INVENTORY-2026-10-21.md)
- [Smoldot P2P probe results](MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md)

## 1. Why this decision is needed

The bounded acquisition experiments have reached a repeatable stopping point on the only documented public Materios P2P bootnode.

- The public RPC endpoints do not expose the needed GRANDPA proof APIs and the tested block responses do not carry a FRNK justification.
- The corrected Smoldot probe in [run #39601026951](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39601026951) removed the diagnostic `system_health` RPC calls that confounded run #8. It again verified the pinned chain identity and reconstructed/hash-verified the historical activation target's header, plus four other sampled candidate headers, but acquired **zero** raw FRNK justifications.
- In that run, 36 native warp-sync log observations over 350 seconds all reported block **97,069**: 22 “in progress” and 14 “idle”. The collector classified this as `WARP_SYNC_STALLED_AT_FIXED_BLOCK`.
- The public Materios operator documentation still names one reliable bootnode. It mentions a justification-retaining sync node as being deployed but gives no usable endpoint, peer ID, RPC URL or readiness signal.
- [Materios issue #105](https://github.com/Flux-Point-Studios/materios/issues/105) also records a separate possible historical selector-reproducibility risk for Preprod v6. It explicitly does not establish a known failing block or a completed replay.

This is enough to stop repeating the same single-bootnode probe in the absence of a newly documented source. It is **not** evidence that Materios blocks are unfinalized, nor does it show that the IMMORTAL verifier is incorrect.

## 2. Decision boundary

This proposal keeps the existing B3-A acceptance claim and trust anchor unchanged.

A qualifying packet still has to bind:

`pinned genesis -> authenticated authority state -> raw GRANDPA justification(s) -> signatures/quorum + ancestry -> ordered authority transitions -> target header`

For the Materios-specific boundary it must additionally bind the exact runtime identity, the relevant selection inputs/commitment and historical execution result/proof, and cross the existing `VerifiedAuthoritySetTransition` boundary. Selector semantics are not changed by this proposal.

**No alternative below can be labelled B3-A GREEN merely because it improves availability, publishes a hash, proves storage inclusion, or produces a ZK proof without an authenticated witness.**

## 3. Options considered

| Option | Trustless / permissionless fit | What it solves | What it does not solve | Disposition |
|---|---|---|---|---|
| A. Wait for a documented, already-running justification-retaining Materios node or another public archive | High. Every source is an untrusted transport; IMMORTAL verifies the bytes | Could restore access to historic blocks and justification payloads without changing protocol semantics | No usable endpoint is publicly documented today; does not automatically supply the Materios-native selector execution packet | **Keep as the preferred low-change acquisition path, but do not keep probing without a concrete endpoint/peer lead** |
| B. Permissionless archival mirrors / evidence relays | High if all are treated only as data sources and the existing verifier remains authoritative | Multiple parties can cache and redistribute exactly the same raw proof packet; source agreement is diagnostic only | A mirror cannot invent missing signatures or make an unfinalized claim final. A relay without an archival source has no data to serve | **Compatible transport enhancement, not a new trust anchor** |
| C. Permissionless publication of future finality evidence with Cardano L1 anchoring | Potentially high if anyone can submit and consumers verify from genesis; design must make evidence available, not just commit to a hash | Can make future witness packets durable and publicly discoverable; can reduce dependence on a single proof-serving RPC | Requires a new producer/publication interface. A Cardano hash commitment by itself neither proves Materios finality nor ensures the committed bytes remain retrievable. It cannot retroactively reconstruct the missing historical target packet | **Best separate architecture track for future events if upstream proof transport remains unavailable; requires its own specification, review and deployment** |
| D. Succinct / ZK proof of GRANDPA and selector execution | Potentially high if proof relation is sound and anchored to the fixed genesis and exact runtime | Could reduce verification cost and potentially fit a constrained on-chain verifier | A prover still needs the historical signatures, headers, authority transitions and execution inputs. ZK compresses a witness; it does not recreate unavailable data. Selector-history ambiguity remains to be resolved | **Research only after defining and acquiring the complete witness; not a data-acquisition workaround** |
| E. Replace B3-A with the existing B3-B receipt/storage-inclusion claim | Not equivalent to B3-A | Can support a receipt-specific product claim whose required statement is only that a receipt/commitment is included under a given state root or Cardano anchor | Does not prove that a Materios block was finalized or authenticate its GRANDPA authority history | **Only as an explicit product/acceptance-semantics decision; never call it B3-A closure** |
| F. Accept a named operator, RPC head, committee attestation or external beacon as finality | Fails the frozen trust model | May be operationally convenient | Substitutes a trusted assertion for GRANDPA and/or selector provenance | **Rejected** |

## 4. Proposed direction

Adopt a two-track plan without merging their claims:

### Track 1 — Existing historical target

Keep block `1,856,408` (`0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e`) under `MATERIOS_FINALITY_PROOF_UNAVAILABLE`.

Resume source acquisition only when one of these concrete conditions occurs:
1. The announced justification-retaining public sync node publishes a documented, reachable endpoint/peer identity; or
2. Another already-running source is identified that can actually return raw FRNK justification bytes for the required history; or
3. A real archival snapshot/database artifact becomes available and there is a bounded, read-only way to extract the original justification packet without bootstrapping or operating a Materios node.

Any bytes from a new source remain untrusted and must pass the existing verifier. The target-specific historical-selector concern remains separately classified as `HISTORICAL_SELECTOR_REPRODUCIBILITY_UNVERIFIED` until the historical inputs and execution result are bound. A later proof for a current block is transport evidence, not proof of this historical transition.

### Track 2 — Future finality evidence availability

Write a separate, reviewable protocol/interface specification for a **permissionless finality-evidence publication path**. Before implementation, the specification must resolve the following questions without inventing or silently freezing new economic/protocol semantics:

1. **Publication object:** exact canonical bytes and versioning for the target header, raw justification, ancestry, authority-set transition material, chain/genesis identity, runtime identity, selector input commitment and Materios-native execution proof.
2. **Verification relation:** re-use the existing IMMORTAL verifier as normative. State whether verification happens on Cardano, in an independently verifiable off-chain consumer, or through a formally specified succinct proof. No path may accept a submitter's assertion as verification.
3. **Availability:** a commitment to off-chain bytes alone is not enough. Define how permissionless consumers recover the packet (for example, on-chain chunks under an explicit byte/transaction budget, or multiple independently operated archives), and what the system claims if bytes are unavailable.
4. **Cost and ledger constraints:** account for Cardano transaction size, datum/metadata encoding, fees, reference-script/execution budgets and multi-transaction chunking before claiming on-chain automation. Do not assume a complete transition packet fits in one transaction.
5. **Anti-replay and binding:** bind every packet to the pinned chain/genesis, exact target header hash/number, authority-set ID and ordered transition; make duplicates harmless and mismatched packets rejectable.
6. **Historical selector data:** specify how the producer obtains and binds the actual historical selection inputs and runtime result for Preprod v6. Replaying against today's Cardano/db-sync view or an epoch's eventual final state without proving equivalence is not acceptable.
7. **Liveness and failure state:** anyone should be able to submit valid evidence, but no one should be able to force acceptance of invalid evidence. Missing publication, unavailable bytes or verifier failure remains OPEN/UNAVAILABLE, not green.
8. **Producer independence:** avoid requiring a single blessed operator or committee. The producer may be external, but consumers independently verify its output; the design must document any remaining availability assumptions.

Publication is an evidence transport mechanism until its verification path is specified and deployed. A Cardano L1 commitment alone does **not** close the Materios GRANDPA boundary.

## 5. Explicit non-decisions / invariants

This document does not authorize implementation or deployment of a new finality contract, new trust anchor, committee, verifier algorithm, ZK circuit, incentive, threshold, fee schedule, or authority-selection rule. Those require separate specifications and review.

- Do not reopen Materios issue #50 as a substitute for raw finality evidence.
- Do not deploy or operate a Materios node under the current resource constraint.
- Do not make arbitrary host guesses or scan undocumented infrastructure.
- Do not change Materios selector semantics or claim issue #105 is a proven target failure.
- Do not modify Cardano V3, Reveal, PRE-RICH economics, or the existing `VerifiedAuthoritySetTransition` semantics.
- Keep B3-B receipt/storage inclusion evidence separately typed.
- Keep `MATERIOS_FINALITY_PROOF_UNAVAILABLE` fail-closed for the historical target.

## 6. Exit criteria

The historical B3-A blocker closes only when a real immutable packet passes the existing independent verifier from the agreed genesis anchor through the ordered authority history and the Materios-specific selector/execution boundary.

The future-publication track can advance to implementation only after its interface, availability model, verification placement, transaction/cost budget, historical-input provenance model, and failure states have been specified and reviewed. No implementation or on-chain status is claimed by this proposal.

**Recommendation:** stop repeating the current single-bootnode capture experiment; keep monitoring only for a concrete public source lead; in parallel, review a future permissionless finality-evidence publication design as a separate architecture track. B3-A remains **OPEN**.
