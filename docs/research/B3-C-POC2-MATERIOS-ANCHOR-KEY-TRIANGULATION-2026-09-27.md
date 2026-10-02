# B3-C PoC-2 — Materios AnchorRecord Key Triangulation

**Date:** 2026-09-27  
**Status:** 🟡 exact storage schema identified / 🔴 canonical checkpoint-to-anchor binding remains open  
**Scope:** PRE-RICH B3-C evidence boundary; non-normative research note.

## 1. Result

Direct inspection of the upstream Materios repository identified the concrete storage item used for submitted anchors:

- pallet: `orinq-receipts`
- storage item: `Anchors<T>`
- type: `StorageMap<_, Blake2_128Concat, H256, AnchorRecord<T::AccountId>, OptionQuery>`
- value type: `AnchorRecord<AccountId>`

The `AnchorRecord` fields are:

- `content_hash: [u8; 32]`
- `root_hash: [u8; 32]`
- `manifest_hash: [u8; 32]`
- `created_at_millis: u64`
- `submitter: AccountId`

## 2. Critical finding: the key is caller-supplied

The `submit_anchor` extrinsic accepts:

```
anchor_id: H256
content_hash: H256
root_hash: H256
manifest_hash: H256
```

and stores the record as:

```
Anchors::<T>::insert(anchor_id, record)
```

Therefore the storage key is **not** shown by the inspected source to be a deterministic function of `roundId`, `checkpointRef`, block number, or state root.

This is materially different from a canonical Beacon relation.

## 3.1 Deterministic raw storage-key construction

Given the source-confirmed storage declaration:

```
StorageMap<_, Blake2_128Concat, H256, AnchorRecord<T::AccountId>, OptionQuery>
```

the raw state key for `Anchors[anchorId]` follows the standard FRAME `StorageMap` construction:

```
Twox128("OrinqReceipts")
|| Twox128("Anchors")
|| Blake2_128(anchorId)
|| anchorId
```

where `anchorId` is the SCALE-encoded H256 key (32 bytes). This follows the FRAME storage-prefix and `Blake2_128Concat` rules; it is a key-construction rule, not evidence that the selected `anchorId` is canonical for a Beacon round.

This removes the remaining **raw-key construction ambiguity** for PoC-2. It does not remove the separate **semantic binding ambiguity**.

## 3. Independent SDK triangulation

A second, independent source — the Orynq SDK Materios adapter — defines the producer-side `anchor_id` as:

```
anchorId = SHA256(rootHash_bytes || manifestHash_bytes)
```

The same adapter submits:

```
submit_anchor(
  anchorId,
  SHA256(rootHash_bytes),
  rootHash,
  manifestHash
)
```

This is important evidence for the **application/SDK convention** connecting an anchor to its content. It does **not** by itself prove that Materios consensus or the PRE-RICH Beacon specification treats this formula as canonical. The formula must therefore remain classified as an observed producer convention until the PRE-RICH canonical binding specification explicitly adopts it.

## 3. Consequence for PoC-2

The exact storage-proof statement can now be defined without guessing the pallet prefix or map/hash strategy:

```
VerifyStorageProof(
  stateRoot,
  storageKey(OrinqReceipts::Anchors, anchorId),
  expectedAnchorRecord,
  proof
) = true
```

The verifier can authenticate that a specific `AnchorRecord` occupies the `Anchors` map at the selected state root.

However, this alone does **not** establish:

```
roundId/checkpointRef -> canonical anchorId -> rootHash
```

because `anchor_id` is supplied to `submit_anchor` by the caller.

## 4. B3 acceptance impact

The previous PoC-2 boundary remains correct but must be split into two independently evidenced relations:

1. **State authentication:** canonical finalized StateRoot authenticates the exact `Anchors[anchorId]` value.
2. **Semantic binding:** an independent rule/proof must establish that the authenticated `anchorId` is the canonical anchor for the PRE-RICH Beacon round/checkpoint.

No implementation should invent a hash formula for `anchorId`.

## 5. Next executable work

1. Obtain a real finalized Materios block containing a real `submit_anchor` transaction.
2. Record the exact `anchorId`, block hash and state root.
3. Obtain a real state/storage proof for `OrinqReceipts::Anchors[anchorId]`.
4. Independently verify the proof against the recorded state root without consulting the node after proof acquisition.
5. Add adversarial vectors for root/key/value/proof mutation and wrong-block proofs.
6. Separately trace the canonical rule that binds a PRE-RICH Beacon round/checkpoint to this `anchorId`.
7. Only after both relations are proven compose the B3 RootProof; succinct proof technology remains downstream.

## 6. Evidence boundary

This note does **not** claim B3 conformance, canonicality, publisher independence, GRANDPA finality, or a production proof system. It records an upstream source-confirmed storage schema and removes one previously unresolved ambiguity: the exact pallet/storage map/key type is now known.

