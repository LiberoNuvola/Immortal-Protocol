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
