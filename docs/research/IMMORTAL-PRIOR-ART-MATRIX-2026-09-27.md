# IMMORTAL — Prior-Art Matrix Research Pass — 2026-09-27

## Classification

**Research only. No novelty claim.**

## Question

Which existing systems already demonstrate pieces of the composition used by IMMORTAL/PRE-RICH?

| Reference | Finality / consensus proof | State/storage proof | Succinct proof | Cross-chain verifier | Economic normative kernel | Evidence/conformance separation |
|---|---|---|---|---|---|---|
| Substrate GRANDPA finality proof | Yes | No | No | Adjacent | No | Partial |
| BEEFY bridge pattern | Yes | Via authenticated header/MMR ecosystem | Compact commitment | Yes | No | Partial |
| IBC light clients | Yes | Yes | Not inherently ZK | Yes | No | Strong protocol separation |
| Snowbridge | Yes | Yes | Not required | Yes | No | Strong decomposition |
| Mithril | Certificate/signature aggregation | Cardano data/Merkle certification | Yes | Not a Materios light client | No | Adjacent |
| SP1 Tendermint example | Yes, inside zkVM | Depends on light-client relation | Yes | Yes | No | Demonstration only |
| Differential conformance harnesses | No | No | No | N/A | No | Strong testing pattern |

## Important distinction

The search found substantial prior art for individual components and for cross-chain proof composition.

The research does **not** establish that the exact IMMORTAL composition is novel.

The distinctive hypothesis, if any, must be tested against a broader literature and implementation matrix covering:

- universal economic state kernel;
- authoritative economic admission;
- chain adapter boundary;
- external canonicality proof;
- succinct verification on destination chain;
- evidence/certification separation;
- fail-closed trust-mode lifecycle.

## Additional succinct-proof reference

The SP1 Tendermint example demonstrates a ZK light client whose zkVM program verifies Tendermint header updates and whose Solidity contract verifies the resulting proof. Its repository explicitly labels the example work-in-progress and not production/audited.

Reference:
https://github.com/succinctlabs/sp1-tendermint-example

This is useful as an architecture reference, not deployment evidence for B3.

## BEEFY / Snowbridge implication

BEEFY/Snowbridge demonstrate that finality commitments can be made verifier-friendly for another execution environment. They also demonstrate that application payloads still need their own authenticated inclusion relation.

Therefore B3 should continue to distinguish:

`consensus/finality`
→ `state commitment`
→ `application value`
→ `Beacon derivation`

## Research status

**Prior-art research: materially advanced, not complete.**

No “first”, “unique”, “novel”, or equivalent claim should be published from this matrix alone.
