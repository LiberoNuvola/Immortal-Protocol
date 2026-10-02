# B3-C PoC-2 — Storage Proof Boundary

**Status:** 🟡 research specification / 🔴 no storage-proof conformance claim
**Scope:** bridge from an independently verified Materios checkpoint to a cryptographically verified storage value.

## 1. Purpose

PoC-0 established reproducible extraction of a Materios checkpoint. The existing PoC-1A establishes a strict GRANDPA verification boundary against a trusted authority state, but explicitly does not yet establish complete production finality.

PoC-2 must answer a different question:

> Given a state root associated with the selected checkpoint, can an untrusted proof generator provide a storage proof that independently proves the claimed value at the exact canonical key?

This is the storage half of the eventual RootProof relation. It does not establish B3 by itself.

## 2. Evidence model

Polkadot SDK storage proofs are sets of serialized trie nodes that allow a verifier to reconstruct the relevant partial trie and authenticate key/value lookup against a known storage root. The SDK exposes proof-generation/verification machinery and strict errors for invalid proofs, missing values, unused nodes and root mismatches. citeturn1search8turn1search3

The current RPC ecosystem also exposes storage-at-block operations keyed by a block hash; the newer chain-head storage API explicitly associates the requested storage with the selected block. citeturn1search0turn1search6

Therefore the proof boundary is:

`finalized/verified checkpoint -> stateRoot -> storage proof -> key/value verification`

## 3. Critical unresolved item: exact Materios key

The repository's current B3 documents define a deterministic PRE-RICH anchor-key function conceptually, but do not yet establish the exact production Materios storage key and encoded `AnchorRecord` for the required state object.

**This remains OPEN.**

No guessed pallet prefix, storage map name, SCALE type, hash strategy, or key encoding may be promoted to the proof implementation until triangulated against the actual Materios runtime metadata/source and a real node observation.

## 4. PoC-2 inputs

The minimum proof input is:
- checkpoint block hash;
- checkpoint state root;
- exact storage key bytes;
- claimed storage value bytes;
- raw storage proof nodes;
- trie/state version required by the selected runtime;
- deterministic encoding/version of the claimed AnchorRecord.

The verifier must derive or independently validate the key from the canonical protocol inputs rather than accepting an arbitrary publisher-supplied key.

## 5. Required verifier relation

For a positive proof:

`VerifyStorageProof(stateRoot, key, value, proof) = true`

must imply that `value` is the value associated with `key` in the trie committed by `stateRoot`.

The verifier must reject if:
- the proof root does not match the checkpoint state root;
- the key is absent when a mandatory value is required;
- the value differs from the claimed value;
- proof nodes are malformed;
- proof nodes are insufficient to reach the key;
- proof contains invalid/duplicate/unusable nodes under the chosen proof format;
- decoded value fails the canonical `AnchorRecord` schema;
- key/value/version/domain binding is inconsistent.

## 6. Positive proof vector

PoC-2 must produce one real vector from a real Materios checkpoint:

`checkpoint -> stateRoot -> exact key -> actual value -> raw proof`

The verifier must reproduce the value without consulting the Materios node after receiving the proof package.

That last property is essential: otherwise the node remains the hidden authority.

## 7. Negative proof vectors

At minimum:

1. mutate state root;
2. mutate key;
3. mutate claimed value;
4. remove a required trie node;
5. mutate a trie node;
6. add unrelated/unused proof data where the verifier is required to reject it;
7. use proof from a different block/state root;
8. substitute an arbitrary publisher-selected key;
9. decode a value under the wrong version/domain;
10. provide a valid proof for another storage item.

Every negative case must fail closed.

## 8. Binding to B3

PoC-2 alone establishes only:

`stateRoot + proof -> authenticated storage value`

The eventual B3 statement additionally requires:

`checkpointRef -> canonical finalized stateRoot -> canonical key -> AnchorRecord(root/context)`

Therefore the final RootProof still needs both:
- independent finality/canonical-checkpoint verification;
- storage proof verification.

## 9. Proof-generator trust boundary

The proof generator remains untrusted.

It may:
- query Materios;
- retrieve storage proofs;
- decode SCALE;
- package trie nodes;
- construct the evidence packet.

It must not be the authority that declares the proof valid.

A malicious generator may only cause the verifier to reject an invalid proof.

## 10. Real-node requirement

Synthetic trie fixtures are useful for parser and verifier tests, but they do not close PoC-2.

Closure requires a real Materios checkpoint and a real storage proof generated for that checkpoint.

The repository must preserve enough provenance to reproduce the vector: network/chain identity, block hash, state root, exact key, proof bytes, runtime metadata/version and extraction timestamp.

## 11. Execution target

The first implementation target should remain an external verifier, not Plutus.

Sequence:

1. identify exact storage key from Materios source/metadata;
2. obtain a real read proof at a finalized checkpoint;
3. verify it independently against the extracted state root;
4. add adversarial vectors;
5. bind the verified value to `roundId + checkpointRef`;
6. only then evaluate the cost of direct Cardano verification;
7. only if direct verification is too expensive, compose a succinct proof.

This preserves the B3-C order and prevents jumping from RPC directly to Halo2.

## 12. Current status

| Layer | Status |
|---|---|
| PoC-0 checkpoint extraction | existing evidence |
| PoC-1A signature/quorum boundary | implemented, but trusted authority state remains external |
| complete GRANDPA finality | OPEN |
| exact Materios anchor storage key | OPEN |
| real storage proof | OPEN |
| independent storage verifier | OPEN |
| complete RootProof | OPEN |
| succinct circuit benchmark | later |

## 13. Non-contamination

This note does not alter IMMORTAL economics, Beacon semantics, Cardano semantics, Bitcoin semantics, or the B3 conclusion.

PoC-2 is evidence research only. It does not promote any external node, relayer, RPC endpoint, proof generator or proof system to IMMORTAL authority.

## Sources

- Polkadot SDK `StorageProof` documentation: https://paritytech.github.io/polkadot-sdk/master/yet_another_parachain_runtime/sp_trie/struct.StorageProof.html
- Polkadot SDK storage-proof implementation: https://paritytech.github.io/polkadot-sdk/master/src/bp_runtime/storage_proof.rs.html
- Polkadot JSON-RPC chain-head storage specification: https://paritytech.github.io/json-rpc-interface-spec/api/chainHead_v1_storage.html
- Existing repository B3/B1-B3 evidence and Materios PoC-0/PoC-1 artifacts.