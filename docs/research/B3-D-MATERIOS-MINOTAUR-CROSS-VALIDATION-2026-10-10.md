# B3-D — Materios / Minotaur Cross-Validation and Proof Boundary — 2026-10-10

## Classification

Research / non-normative.

This note records the comparison between the current Materios preprod architecture and the PRE-RICH B3 target. It does not redefine IMMORTAL economics, Beacon semantics, Materios consensus rules, or the B3 proof system.

## Executive result

The current Materios architecture confirms a useful decomposition but does not by itself close B3.

The relevant layers are:

Cardano mainchain data
  -> Minotaur / Ariadne
  -> Materios committee selection
  -> Aura block production
  -> GRANDPA finality
  -> Materios runtime state / StateRoot
  -> Orinq receipt / anchor state
  -> Cardano anchor

For PRE-RICH B3, the reusable proof chain remains:

authenticated authority history
  -> GRANDPA finality of exact checkpoint
  -> finalized StateRoot
  -> storage proof for exact key
  -> exact AnchorRecord
  -> independent canonical checkpoint -> anchorId binding
  -> CanonicalBeaconAnchor

## 1. Minotaur is committee selection, not the B3 oracle

Materios uses IOG Partner Chains infrastructure with Minotaur/Ariadne to select block-producing candidates from Cardano-derived stake and registration state.

This is useful as upstream consensus provenance, but PRE-RICH MUST NOT treat Minotaur or Ariadne as a new Beacon oracle.

The distinction is:

- Minotaur/Ariadne: who is eligible / selected to produce blocks;
- Aura: block production;
- GRANDPA: finality;
- B3: independent proof that a specific finalized state contains the claimed value.

No Minotaur-specific selector logic is to be reimplemented inside IMMORTAL or in the PRE-RICH verifier.

## 2. Materios receipt attestation is an attestation layer, not B3

The current Materios runtime contains an OrinqReceipts attestation committee with:

- CommitteeMembers;
- AttestationThreshold;
- attest_availability_cert;
- canonical certificate-hash checking;
- AvailabilityCertified finalization when the threshold is reached.

This provides M-of-N attestation of a receipt/certificate.

It is therefore structurally a B2-style trust model for the receipt fact.

It MUST NOT be promoted to B3 merely because the committee is live on preprod.

## 3. Materios Anchors storage is suitable for StateRoot -> value authentication

The inspected upstream storage declaration is:

OrinqReceipts::Anchors
  = StorageMap<Blake2_128Concat, H256, AnchorRecord>

The inspected submit_anchor call accepts anchor_id from the caller and stores the record under that key.

Therefore the raw storage-proof relation can be stated exactly as:

VerifyStorageProof(
    stateRoot,
    storageKey(OrinqReceipts::Anchors, anchorId),
    expectedAnchorRecord,
    proof
)

This proves a selected AnchorRecord is present at a selected finalized state root.

It does not prove that anchorId is the canonical PRE-RICH anchor for a round/checkpoint.

The research must therefore retain two independent relations:

1. State authentication
   finalized StateRoot
     -> Anchors[anchorId]
     -> AnchorRecord

2. Semantic binding
   PRE-RICH round/checkpoint
     -> canonical anchorId
     -> AnchorRecord.root_hash

No guessed anchor-id hash formula is permitted.

## 4. GRANDPA finality is the correct consensus proof boundary

The current Materios node is already running the standard GRANDPA service and declares the standard sc-consensus-grandpa-rpc dependency.

The current upstream partnerchain/node/src/rpc.rs, however, only merges the System, OrinqReceipts and MOTRA RPC modules. It does not currently merge the standard GRANDPA proof RPC handler.

The standard Polkadot SDK proof primitive is:

FinalityProof<Header> = {
    block,
    justification,
    unknown_headers
}

The inner GrandpaJustification contains:

- round;
- commit;
- votes ancestry.

Independent verification must bind:

- exact target block hash/number;
- GRANDPA set ID;
- authenticated authority set;
- signer uniqueness;
- signature validity;
- quorum;
- ancestry;
- authority-set transitions.

The RPC is transport only. Returning proof bytes is not proof acceptance.

## 5. State proof capability exists, but the B3 pipeline is not yet established

The current Materios launch/preflight allowlist explicitly includes state_getReadProof and state_getChildReadProof.

This establishes the standard Substrate state-proof capability at the node surface.

The current source inspection did not establish that Materios already packages a B3-specific storage proof for OrinqReceipts::Anchors.

Therefore:

RPC capability: FOUND
B3 storage-proof pipeline: NOT ESTABLISHED

## 6. Current upstream status relevant to B3

The inspected Materios default-branch tip is:

076964a0c117640a83aa1f13ace681a89b428611

It contains:

- Minotaur/Ariadne-driven committee selection;
- Aura + GRANDPA consensus;
- live preprod deployment documentation;
- receipt attestation committee;
- Cardano anchoring;
- Anchors storage;
- standard GRANDPA RPC dependency declaration;
- state_getReadProof in the RPC allowlist.

But the current create_full RPC assembly does not expose the standard GRANDPA proof module.

Therefore:

| B3 component | Status |
|---|---|
| Materios committee / Minotaur provenance | FOUND |
| GRANDPA finality service | FOUND |
| Standard GRANDPA FinalityProof type | FOUND |
| GRANDPA proof RPC exposed by current Materios create_full | NOT PRESENT |
| StateRoot retrieval | FOUND |
| state_getReadProof capability | FOUND |
| Exact Anchors storage schema | FOUND |
| Exact raw storage-key construction | FOUND |
| Independent storage-proof verification | OPEN |
| Authority-set provenance across transitions | OPEN |
| Canonical checkpoint -> canonical anchorId binding | OPEN |
| Composed B3 RootProof | OPEN |

## 7. Consequence for Beacon 3

The correct target is:

Materios
  -> Minotaur/Ariadne
       committee provenance

Materios
  -> GRANDPA
       finality evidence

Materios
  -> StateRoot
       storage membership proof
       -> exact AnchorRecord
       -> canonical round/checkpoint binding
       -> B3 RootProof / verifier
       -> CanonicalBeaconAnchor
       -> BeaconRegistry

This preserves the existing B3 architecture and avoids introducing a second Beacon committee.

## 8. Immediate executable research gate

The next B3 gate is not “design the quorum”.

It is to obtain and freeze one real preprod witness set:

checkpoint block
+ checkpoint block hash
+ header / StateRoot
+ GRANDPA finality evidence
+ authority set + set id
+ Anchors[anchorId] storage proof
+ AnchorRecord

Then verify, independently and offline after acquisition:

1. the target block is finalized under the authenticated authority history;
2. the StateRoot belongs to that finalized block;
3. the storage proof resolves the exact Anchors[anchorId] value;
4. the recovered AnchorRecord is byte-exact;
5. mutations of block, set id, proof, storage key or value fail;
6. the separate PRE-RICH checkpoint -> anchorId binding remains explicitly unresolved until proven.

Only after this witness passes should the project choose the minimal succinct proof representation for Cardano.

## 9. Non-contamination rule

This research does not authorize:

- importing Minotaur semantics into IMMORTAL;
- inventing a new Beacon quorum;
- treating the Materios receipt committee as B3;
- treating metadata label 8746 as canonicality;
- treating a caller-supplied anchorId as canonical;
- declaring B3 complete from a live preprod dashboard;
- changing V3, Reveal, or economic semantics.

The key principle remains:

A publisher or relayer may transport evidence; it must not choose truth.
