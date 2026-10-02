# B3-A / B3-B — Materios Finality + State Authentication Research Pass — 2026-09-27

## Classification

**Research / non-normative.** This note does not alter B3, select a proof system, redefine canonicality, or promote any external implementation to IMMORTAL authority.

## Research target

B3 requires a chain of independently verifiable facts:

`Materios checkpoint → finality/authority provenance → finalized header → StateRoot → exact storage value`

The research question is whether existing production Substrate/bridge mechanisms provide reusable proof patterns without replacing Materios' authoritative selector or inventing an IMMORTAL-side canonicality shortcut.

## Finding A — GRANDPA finality proof structure

Polkadot SDK's GRANDPA finality-proof implementation describes a proof for block B as:

1. a justification for a descendant block F;
2. headers needed to connect B to F when requested;
3. proof of the GRANDPA authority set when the set changes at F.

If several authority-set changes occur between the caller's last finalized block and F, proof fragments are produced and must be verified in order.

**Implication for B3-A:** a single signed statement about a target block is not automatically sufficient. The verifier needs the authority-set transition context and ancestry needed to establish that the finalized target belongs to the authenticated chain.

Primary reference:
https://paritytech.github.io/polkadot-sdk/master/src/sc_consensus_grandpa/finality_proof.rs.html

## Finding B — BEEFY is an adjacent production pattern

Parity's BEEFY documentation explicitly targets efficient trustless bridging and notes that BEEFY runs on top of GRANDPA. A BEEFY commitment contains a payload, block number and validator-set identifier; the signed commitment is a compact finality artifact.

The bridge-oriented design is useful because it separates:

- consensus/finality provenance;
- a compact authenticated commitment;
- application-specific payload verification.

It does **not** mean B3 can simply become BEEFY. Materios must actually provide the required protocol machinery and the B3 relation must be defined against the concrete Materios runtime.

Primary reference:
https://github.com/paritytech/grandpa-bridge-gadget/blob/master/docs/beefy.md

## Finding C — StateRoot/storage proof is a separate relation

Substrate's StorageProof represents trie nodes needed to reconstruct a partial storage backend and verify key lookups. Compact proofs can be decoded against an expected trie root.

Therefore the proof relation should remain explicitly split:

`FinalizedHeader → StateRoot`

then

`StateRoot + storage proof + key → value`

A valid storage proof does not itself establish that the header containing the root was canonical/finalized.

Primary reference:
https://paritytech.github.io/substrate/master/src/sp_trie/storage_proof.rs.html

## Finding D — Cross-chain production pattern

IBC uses a trusted consensus root plus Merkle membership/non-membership proofs. Its LightClient abstraction keeps consensus verification separate from state membership verification.

This is architecturally close to the B3 decomposition:

- authenticated consensus state;
- root-bound state proof;
- exact path/value verification.

It reinforces that B3 should not collapse finality and storage authenticity into one opaque publisher claim.

Primary references:
https://docs.cosmos.network/ibc/latest/light-clients/developer-guide/proofs
https://docs.cosmos.network/ibc/latest/light-clients/developer-guide/overview

## Finding E — Snowbridge demonstrates the full decomposition

Snowbridge's light-client architecture verifies finalized checkpoints, sync-committee authentication, ancestry proofs and Merkle proofs before accepting execution headers. The bridge then uses authenticated header commitments to verify application-relevant data.

This is a useful reference architecture for B3 because it demonstrates an explicit chain of proofs rather than trusting a relayer's assertion.

Primary reference:
https://docs.snowbridge.network/architecture/verification/ethereum

## Materios-specific boundary

Existing repository work has already identified the authoritative Materios authority-selection path. The IMMORTAL/PRE-RICH verifier must consume evidence from that path; it must not reimplement selector semantics in TypeScript.

The open Materios-specific questions remain:

- exact production runtime method for obtaining execution/finality proof;
- exact block/header binding;
- exact authority-set transition witness;
- exact ancestry witness;
- exact StateRoot/storage-proof format and hasher/layout;
- deterministic binding of the requested storage key/value to the B3 checkpoint context.

## Acceptance decomposition

B3-A can only close when an independent verifier can establish:

`target block is finalized under the authenticated Materios authority history`

B3-B can only close when an independent verifier can establish:

`key/value is included in the storage trie committed by the finalized target StateRoot`

B3-A + B3-B still do not equal B3-C. Succinctification and Cardano verification remain separate research/engineering work.

## Research conclusion

The strongest reusable pattern found is **two-stage authentication**:

`finality/authority/ancestry → finalized StateRoot → storage membership → application value`

This matches the existing B3 decomposition and does not require importing another chain's consensus semantics into IMMORTAL.

No proof-system selection is made by this note.
