# PRE-RICH Beacon Closure Matrix

**Branch:** `work/immortal-green-closure`  
**Scope:** B1 / B2 / B3 Beacon architecture  
**Purpose:** close the evidence bookkeeping without claiming cryptographic closure that has not been demonstrated.

## Canonical rule

The Beacon ladder is:

`B1 -> B2 (optional) -> B3`

- **B1** — authorized publisher.
- **B2** — committee attestation.
- **B3** — publisher-independent canonical-state proof.

The downstream game pipeline is intentionally unchanged across the ladder: canonical Beacon -> ticket seed -> deterministic game result.

## Closure matrix

| Layer | What is established | Closure status | Remaining condition |
|---|---|---|---|
| **B1 — Authorized** | Beacon derivation, round/target binding, Registry pending/ready boundary, relayer authorization, exact derived Beacon checks, and downstream consumption are implemented. | **GREEN / operational model** | Real deployment witness remains deployment evidence, not a change to the B1 model. |
| **B2 — Attested** | The trust model and threshold-attestation concept are specified as a transitional model. B2 does not remove the underlying-source canonicality problem by itself. | **CLOSED AS ARCHITECTURAL MODE / NOT DEPLOYED** | No B2 deployment is claimed. A live B2 implementation would require its own normative attestation format, threshold semantics, and evidence. |
| **B3 — Canonical** | Domain separation, deterministic Beacon derivation, 20,000-domain rejection sampling, replay vectors, round/target binding, and the proof/anchor architecture are established. | **GREEN INTERNAL / EXTERNAL PROOF OPEN** | Publisher-independent Materios finality + storage proof + Cardano-verifiable canonicality must still be executed and evidenced. |

## What we must not claim

B1 is not B3.

A deterministic hash of Materios context does not by itself prove that the context is canonical.

A real Materios checkpoint is evidence for the proof pipeline, not by itself a B3 proof.

The browser, frontend, relayer, ordinary backend, or external adapter must never become the B3 root of trust.

## B3 exact remaining chain

The only remaining B3 chain is:

```
real Materios finalized checkpoint
        ↓
GRANDPA finality evidence
        ↓
canonical state / storage proof
        ↓
publisher-independent proof
        ↓
Cardano verifier
        ↓
CanonicalBeaconAnchor
        ↓
BeaconRegistry
        ↓
Beacon
```

This matrix therefore closes the **three Beacon work classifications** without converting an unresolved external cryptographic witness into a false green status.

## Frontend implication

The public frontend must expose the observed Beacon mode explicitly:

- `B1 — AUTHORIZED`
- `B2 — ATTESTED`
- `B3 — VERIFIED`

It must never display B3 merely because B3 code paths exist. The displayed mode must come from the authoritative deployment/round declaration.

## Evidence references

- `plutus/Beacon.hs`
- `plutus/BeaconRegistry.hs`
- `src/beacon.ts`
- `PRE-RICH/docs/B3-BEACON-CONFORMANCE-INVESTIGATION.md`
- `docs/archive/B1-B3_evidence/beacon-canonicality-spec.md`
- `verification/pre-rich-gamerules-v1-vectors.json`

**Conclusion:** Beacon architecture is now explicitly classified at the evidence boundary. The remaining B3 item is one external cryptographic/provenance witness, not an undefined collection of frontend or game-rule tasks.

## 2026-10-10 — Real Materios Preprod witness reconnaissance

A real Preprod receipt/anchor chain has now been bound at the provenance level without promoting it to B3 cryptographic closure.

### Verified provenance chain

The observed real receipt is:

`0x552e9e621ad05f0b824b24c36d71b87afbd65387316b7be7406df57d3a598871`

The corresponding certification hash is:

`78c0bbd6a33dd38009858d540b70e02c756f352ffce30bb4feaa0251e161aa8a`

The receipt was observed on-chain in block `1856393`. The checkpoint leaf construction:

`SHA256("materios-checkpoint-v1" || chain_genesis || receipt_id || cert_hash)`

reproduces exactly:

`0x807c464cc9064a73e22d07cbaba9f05a07eaa12a7fba68539d2654c704ba941c`

That leaf is the singleton root of the real batch associated with the receipt and is bound to the first observed anchor:

- anchor block: `1856408`
- anchor block hash: `0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e`
- anchor id: `0x01b459db196564ea1768e71663b4caa2439279839c52e758f605a5fbd6026b55`
- content/root hash: `0x807c464cc9064a73e22d07cbaba9f05a07eaa12a7fba68539d2654c704ba941c`
- manifest hash: `0xebd2ea0e0e463344c3caecf6d97279ef87077737adc997570afa8a26c1febeb8`

The current `OrinqReceipts::Anchors[anchor_id]` value was also observed with matching content hash, root hash and manifest hash. The upstream runtime path for `submit_anchor` stores the record under a new anchor id and rejects duplicate ids, so this is an immutable-anchor binding for this witness.

### Exact B3-B target

The remaining state-authentication witness is now narrowed to one exact object:

`Anchor block 1856408 -> header StateRoot -> Anchors[anchor_id] storage proof -> exact AnchorRecord`

The public Materios Preprod RPC serves the historical header, but the state at block `1856408` is pruned. Therefore both historical `state_getStorage` and historical `state_getReadProof` fail with `UnknownBlock: State already discarded`.

This is a **state-retention/infrastructure blocker**, not an unresolved storage-key derivation problem.

A conforming B3-B witness therefore requires an archive/full-state Materios node (or an equivalent independently retained historical-state source) from which the verifier can obtain:

1. the exact header and StateRoot for block `1856408`;
2. the exact `Anchors[anchor_id]` value;
3. the native storage proof for that key at that block;
4. an offline proof verification against the exact StateRoot.

### B3-A remains separate

The same real anchor finding does **not** establish GRANDPA finality for block `1856408`.

The currently exposed public RPC does not provide `grandpa_proveFinality`, so the B3-A requirement remains:

`exact checkpoint -> real GRANDPA justification -> authenticated authority-set state/transition -> independent verification`

No B3 GREEN claim is made from the receipt/anchor lineage alone.

### Current classification

| Evidence component | Status |
| --- | --- |
| Real receipt observed | **FOUND** |
| Real availability certificate bound to receipt | **FOUND** |
| Real checkpoint leaf recomputed | **FOUND / independently reproducible** |
| Real anchor identified and bound to leaf/root | **FOUND** |
| Current AnchorRecord observed | **FOUND** |
| Historical StateRoot at anchor block | **HEADER AVAILABLE / STATE PRUNED** |
| Historical `state_getReadProof` | **BLOCKED BY STATE RETENTION** |
| GRANDPA finality proof for anchor block | **OPEN** |
| Authority-set provenance/transition proof | **OPEN** |
| Publisher-independent B3 closure | **OPEN** |

This reconnaissance does not alter V3, Reveal, EEV semantics, B2 semantics or Beacon 4 status. It only replaces the previous generic “real fixture open” statement with a concrete, reproducible partial witness and a precisely identified infrastructure boundary.
