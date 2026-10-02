# PRE Birth-Date Reconciliation v0.1

Date: 2026-09-26

## Purpose

Record the earliest PRE-RICH transaction currently observed by the operator in the first-user wallet, without promoting that observation to historical mint proof.

## Operator-supplied observation

Transaction:
`2681490ad1fcc9e2108ac628e8eab401343688a5afe6673d2fe398cc04d578a2`

Observed timestamp:
`2025-04-20 17:47:06`

Observed PRE-RICH amount in the transaction:
`9,607,888 PRE-RICH`

The operator reports this as the oldest PRE-RICH transaction currently found in the wallet history.

## Evidence boundary

This observation proves only that PRE-RICH was present in the observed wallet transaction by 2025-04-20 17:47:06.

It does **not** by itself prove:
- that this was the first PRE transaction;
- that this was the token mint;
- that the wallet received the first ever PRE allocation;
- that the transaction date is the PRE birth date.

## Canonical historical mint target

The repository's Gate 41 lineage identifies:

`0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`

as the historical transaction that mints the Pool NFT and creates the exact 1,000,000,000 PRE bootstrap under:

- policy: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`
- asset name: `5052452d52494348`

The historical mint-policy witness/script remains the decisive missing artifact for deterministic reconstruction of the PRE mint.

## Current conclusion

The previously used date 2025-05-23 is **not accepted as the PRE birth date** unless independently evidenced.

The current timeline constraint is:

`PRE present in operator-observed wallet <= 2025-04-20 17:47:06`

The historical mint timestamp of transaction `0235...` remains OPEN pending primary transaction evidence.

## Next deterministic step

Acquire the historical transaction CBOR/witness for `0235...`, extract candidate minting scripts from the witness set, and accept a candidate only when its derived policy ID equals the canonical PRE policy `1b29...`.

No synthetic Preprod PRE, guessed policy, or explorer inference may substitute for this artifact.
