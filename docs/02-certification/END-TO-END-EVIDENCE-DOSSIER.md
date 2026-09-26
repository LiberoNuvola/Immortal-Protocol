# IMMORTAL End-to-End Evidence Dossier

**Status:** DOSSIER READY; final on-chain A/B section remains OPEN until a real submitted Preprod transaction witness is evaluated.

## Evidence chain

IMMORTAL Constitution
→ Economic Kernel / V3
→ Universal economic projection
→ PRE-RICH canonical boundary
→ Cardano Adapter
→ real Cardano Preprod transaction
→ exact UTxOs + epoch protocol parameters
→ Cardano-ledger native evaluation
→ Accepted / rejected classification

## What is already closed

### Economic semantics
Executable differential evidence covers the V3 → Universal transition deltas for Issue, Reveal, Claim and Expire. Fail-closed mismatch checks cover reserve/count composition, canonical classes and protected components.

### PRE-RICH boundary
The Reveal boundary suite passes 4/4. The exercised cases preserve canonical price/class semantics and reject incompatible aggregate observations.

### Live Preprod observation
Demeter/Ogmios v7 connectivity, network context and funded-wallet UTxO observation have all been observed in successful CI runs. The latest successful Preprod packet is source-bound and hash-bound.

### Mutator topology
Issue, Reveal, Claim and Expire are all present behind the canonical economic admission boundary and are covered by structural negative evidence.

### Security
A previously committed provider credential was removed from the active source and the security boundary workflow passes. Historical repository objects may still contain the old value; operational revocation/rotation remains an external credential-management action.

## What is laboratory-only

The current Yaci Reveal trace is a real Cardano-ledger realization on the local isolated devnet. It is useful evidence for execution topology, resource behavior and replay rejection, but it is **not** a live Preprod transaction witness.

## Final open evidence gate

The only external witness still missing for the complete end-to-end packet is:

**A real, already-submitted Cardano Preprod transaction hash belonging to the intended production Reveal path.**

The repository now contains the non-signing workflow needed to consume that witness without placing private signing material in CI.

## Final dossier rule

Do not replace the missing transaction witness with:
- an emulator fixture,
- a Yaci transaction,
- a synthetic CBOR,
- current-tip protocol parameters for an older transaction,
- or inferred wallet credentials.

The final statement becomes CLOSED only when the exact submitted transaction is evaluated under the exact epoch protocol parameters and typed timing context, and the resulting ledger classification is bound to the IMMORTAL/PRE-RICH conformance snapshot.
