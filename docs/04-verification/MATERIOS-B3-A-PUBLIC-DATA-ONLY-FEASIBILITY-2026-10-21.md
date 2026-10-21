# Materios B3-A — Public-Data-Only Feasibility Decision (2026-10-21)

Status: **NO TRUSTLESS B3-A CLOSURE FROM THE CURRENTLY OBSERVED PUBLIC DATA / B3-A OPEN**

Branch: `work/b3-materios-provenance-evidence`

## Decision

Under the current operating constraints — no Materios node to operate, no upstream Materios change, and no trust placed in a proof provider — the currently observed public surfaces do not provide the evidence needed to close B3-A. There is no verifier-side algorithmic change that can turn the present observations into a GRANDPA finality proof.

This is a conditional feasibility conclusion about the evidence currently available through the examined surfaces. It does **not** claim that Materios blocks are unfinalized, that GRANDPA consensus is invalid, or that no private/undocumented proof source exists.

Keep the failure state explicit:

`MATERIOS_FINALITY_PROOF_UNAVAILABLE`

B3-A remains **OPEN**. Do not weaken the proof boundary or re-open already-completed negative RPC probes just to create activity.

## Why the missing witness cannot be inferred

GRANDPA verification requires cryptographic data, not just a report that a node has finalized a block. At minimum the receiver must be able to bind:

`pinned genesis trust anchor → authenticated authority set/set ID → raw GRANDPA justification → signed precommits and quorum → ancestry/header hashes → ordered authority-set transitions → target checkpoint`

For the Materios-specific B3 boundary, the verifier must additionally bind the actual selector/enactment evidence: the on-chain selection-input commitment, exact runtime identity and call/result bytes, native execution proof, activation block hash/number, and the existing `VerifiedAuthoritySetTransition` boundary.

The currently observed public data does not supply that complete packet:

- A `chain_getFinalizedHead` result, `/chain-info.finalized_block`, an explorer status, or agreement between RPCs is an untrusted service assertion.
- A header/hash and its digest can help describe a candidate chain, but are not a GRANDPA justification.
- A storage/trie proof can establish that a key/value is included under the supplied StateRoot; without independently authenticated finality, it does not prove that the containing header is canonical.
- A ZK proof can compress verification of a supplied witness. It cannot reconstruct the missing validator signatures, authenticated authority-set history, or Materios execution proof from a finalized-height number.
- Drand proves its separate beacon/randomness statement, not Materios finality.
- A public SDK verifier or its fixtures do not supply a Materios witness. In particular, the reviewed Orynq fixture is for Midnight Preprod, with a different genesis hash.

These are distinct cryptographic claims and must remain separately typed.

## Evidence basis

1. The current public Materios HTTP/WebSocket endpoints do not advertise the GRANDPA proof-delivery methods. Focused live probes called the methods directly; `grandpa_proveFinality` and `grandpa_subscribeJustifications` returned `-32601 Method not found`. Tested `chain_getBlock` responses had no FRNK justification.
2. The gateway peer-discovery response from both `/chain-info` and `/preprod-blobs/chain-info` returned the same single documented bootnode. It did not disclose a second public proof peer. All reported head/finalized numbers are still untrusted observations.
3. The pinned Smoldot P2P experiment verified the expected raw-chain-spec digest and genesis identity, but remained in warp sync around block 97,069 and did not capture a raw FRNK justification across the sampled target/descendant candidates. This is a failure of the tested acquisition route, not evidence that the later reported blocks are unfinalized.
4. Materios' public operator guide mentions a justification-retaining public sync node as being deployed, but the reviewed public material does not identify an endpoint or peer ID usable by the collector.
5. The existing real receipt/storage-inclusion results remain useful within B3-B. They do not supply B3-A finality or authenticated authority provenance.

Detailed source and artifact IDs are recorded in:

- [Alternate finality source inventory](MATERIOS-ALTERNATE-FINALITY-SOURCE-INVENTORY-2026-10-21.md)
- [Smoldot P2P probe results](MATERIOS-SMOLDOT-P2P-PROBE-RESULT-2026-10-21.md)
- [Frozen finality source decision](MATERIOS-FINALITY-PROOF-SOURCE-DECISION-2026-10-21.md)
- [B3-A trustless/permissionless verification decision](B3-A-TRUSTLESS-PERMISSIONLESS-VERIFICATION-DECISION-v1.md)
- [Fallback architecture proposal — permissionless finality-evidence publication](MATERIOS-B3-A-FINALITY-EVIDENCE-ARCHITECTURE-FALLBACK-DECISION-2026-10-21.md)

## Permitted forward paths

There are only a few materially distinct ways to resume B3-A without weakening the trust model:

### A. An already-operating proof source becomes publicly reachable

The justification-retaining service (or another existing provider) publishes a documented endpoint or peer identity and serves raw GRANDPA evidence. Treat every byte as untrusted transport, then pass it through the current IMMORTAL verifier. Success is defined by an immutable real packet crossing the full genesis-rooted and Materios-specific acceptance boundary, not by a green availability probe.

### B. A new protocol/architecture supplies an independently verifiable anchor

If no source can serve the witness, the separate [fallback architecture proposal](MATERIOS-B3-A-FINALITY-EVIDENCE-ARCHITECTURE-FALLBACK-DECISION-2026-10-21.md) compares permissionless evidence publication and verification-placement options. A candidate design could use Cardano L1 commitments to finalized Materios headers and authority-transition material, together with a formally specified proof relation. That would be a protocol/interface change requiring its own requirements, review, implementation and deployment. It is **not** already present in the current receipt anchoring path and must not be assumed available. A commitment alone does not prove GRANDPA finality or guarantee that off-chain evidence remains retrievable.

A proof system, light-client library, relay, or ZK circuit alone is not this mechanism. It needs a well-defined authenticated input/commitment and a live producer of the evidence.

### C. Change the product's acceptance claim explicitly

For a receipt-specific product flow, one may choose to accept a verified Cardano L1 anchor/receipt commitment as the relevant claim, if that meets the actual product requirement. Such a decision would change the acceptance semantics: it may authenticate the receipt commitment but does **not** establish Materios GRANDPA finality. It cannot be presented as B3-A closure.

### D. The operator-local proof path becomes an available resource

The frozen local-operator CLI design could collect the native execution proof and stored justifications from a real synced node. The current operational constraint excludes that path; it must not be described as executable until the resource constraint changes.

## Explicit non-actions

- Do not guess unpublished hostnames or scan arbitrary addresses for an undocumented private service.
- Do not repeat the public RPC capability tests or re-open issue #50 solely to re-confirm the same missing method.
- Do not trust a recent authority list to authenticate its own history.
- Do not accept an operator signature, oracle, hand-selected multisig, gateway claim, current RPC head, or drand result as a substitute for GRANDPA finality.
- Do not change Materios selector semantics, Cardano V3, Reveal, PRE-RICH economics, or existing IMMORTAL verification semantics to bypass missing evidence.

## Acceptance rule

B3-A becomes GREEN only when a real, immutable packet establishes finality and ordered authority provenance from the pinned genesis trust anchor and passes the existing independent verifier through the exact Materios-specific authority-transition boundary. A new witness source is a prerequisite; no source availability result by itself is sufficient.

**Current conclusion:** B3-A cannot be closed from the currently observed public data under the current operating constraints. Preserve `MATERIOS_FINALITY_PROOF_UNAVAILABLE`; continue independent work that does not depend on this gate; resume B3-A only on one of the concrete source/protocol triggers above.


## Additional acceptance risk: Preprod v6 historical selector inputs — 2026-10-21

The official [Materios issue #105](https://github.com/Flux-Point-Studios/materios/issues/105) is still open. It identifies a possible reproducibility problem in the Preprod v6 history: under the permanent v6 `AriadneRule::Relaxed`, committee selection may read a still-changing current Cardano epoch through a node's local db-sync tip. A later reconstruction from that epoch's final data may calculate a different committee.

The source issue is careful about its evidence: it reports the mechanism and historical mid-epoch input changes, but **does not report a replay of v6 history or a known failing block**. So this is not a proven failure of the pinned target. The target block 1,856,408 remains unclassified with respect to this risk.

The merged [Materios PR #100](https://github.com/Flux-Point-Studios/materios/pull/100) leaves Preprod v6 on the relaxation permanently. The proposed [issue #109](https://github.com/Flux-Point-Studios/materios/issues/109) describes a future RootTimelock/storage-key opt-in switch to the strict rule; it remains open and does not itself establish historical selector provenance.

Accordingly, acquisition and acceptance are separate:

- **Acquisition gate:** obtain authentic raw GRANDPA justification(s) and required ancestry/authority-transition data.
- **Historical selector gate:** independently bind the target's selector result to the exact authenticated inputs and runtime/block context used at that point in history. A replay against current Cardano data, or against the epoch's final data without proving equivalence, is insufficient.
- **Current state:** both gates remain open. Until target-specific input provenance or an equivalent independently verified execution proof is available, classify the historical selector aspect as `HISTORICAL_SELECTOR_REPRODUCIBILITY_UNVERIFIED`, not as a proven failure.

Do not alter the pinned trust model, weaken the finality requirements, touch selector semantics, or reopen Materios issue #50 to bypass this gate. The existing public-data-only conclusion still stands, now with this independent caveat: even successful transport acquisition must be followed by an explicit historical-input verification step.
