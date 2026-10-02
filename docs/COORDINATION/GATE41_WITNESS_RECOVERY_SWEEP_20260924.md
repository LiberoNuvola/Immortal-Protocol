# Gate 41 — Historical PRE Mint Witness Recovery Sweep — 2026-09-24

## Scope

Target transaction:

`0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`

PRE policy:

`1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c4`

This document records an evidence-recovery sweep only. It is not normative and does not alter IMMORTAL/PRE-RICH economics.

## Triangulation result

### Repository

The working branch `work/immortal-green-closure` was searched for the exact transaction hash, PRE policy, redeemer/mint terms, Gate 41 witness artifacts and `mint-input-refs`.

No current working-branch search result exposed the historical dedicated PRE mint witness.

The branch contains the fail-closed Koios acquisition helper:

`scripts/acquire-pre-snek-koios-redeemer.ps1`

It was corrected to Koios `api/v0` in:

`516a9ca576aaeb9299e3cb999a9a17583c207f99`

The helper requires all three predicates:

- exact transaction hash;
- `purpose=mint`;
- exact PRE policy.

It preserves raw provider pages, acquisition index, hashes and provenance.

### Library / historical corpus

The historical staged-manifest snapshot confirms that an earlier workspace contained:

`evidence/pre-snek/gate41-genesis/tx-info/0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4.raw.json`

However, the current Library corpus exposes this as a historical manifest/listing entry rather than as a separately retrievable raw artifact.

The independent Koios UTxO transcript remains available and independently establishes the transaction inputs/outputs and PRE distribution.

The historical Pool datum remains available and contains:

- PRE policy `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c4`;
- asset name `PRE-RICH`;
- datum threshold `18,191,400,000` lovelace.

No Library artifact recovered in this sweep contains the dedicated historical `purpose=mint` PRE redeemer/witness set.

### Public web/provider surfaces

Exact-hash searches across public Cardano explorer/index surfaces did not recover an indexed copy of the target witness.

Direct retrieval of the Koios `script_redeemers` response was not available through the current research transport. Therefore no provider response has been fabricated, inferred, or treated as evidence.

This does **not** prove that Koios lacks the record. It proves only that this session has not acquired the raw response.

## Gate 41 classification

| Evidence item | Status |
|---|---|
| Historical transaction identity | CLOSED |
| Historical UTxO/input/output evidence | CLOSED |
| Pool-NFT/PRE output #1 | CLOSED |
| Creator-side PRE output #2 | CLOSED |
| 1B PRE split | CLOSED |
| Pool datum hash | CLOSED |
| Pool datum bytes | CLOSED |
| Datum threshold 18,191,400,000 | CLOSED |
| Exact 3 ADA correspondence | STRONG CORRELATION |
| Semantic meaning of 3 ADA | OPEN |
| Genesis 10 ADA funding role | OPEN |
| Historical PRE mint redeemer/witness | **OPEN — primary artifact gap** |
| Serialized transaction CBOR/witness set | **OPEN — primary artifact gap** |

## Required closure artifact

The minimal artifact that closes the primary witness gap is a preserved provider response or serialized transaction artifact that permits filtering:

`purpose=mint`

and

`script_hash = 1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c4`

for the exact target transaction.

The witness must then be compared only against the historical:

- 3,928,019 PRE creator-side quantity;
- 10,000,000 lovelace candidate funding component;
- Pool-NFT output #1;
- creator-side output #2.

Later curve-spend redeemers remain inadmissible as substitutes for the historical mint witness.

## Non-regression

No economic constants, validator semantics, governance rules, transaction-size limits or IMMORTAL architectural boundaries were changed.

**Conclusion: Gate 41 witness acquisition remains OPEN, but the remaining gap is now isolated to a specific primary artifact rather than a general lack of historical transaction evidence.**
