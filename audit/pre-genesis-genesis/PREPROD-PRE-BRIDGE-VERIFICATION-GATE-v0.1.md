# PREPROD PRE Bridge — Verification Gate v0.1

Date: 2026-09-26

## Purpose

Determine whether the historical PRE minting policy can be reused directly on Preprod, or whether a bridge representation is technically mandatory.

## Evidence already available

Historical PRE policy witness:

- transaction: `0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`
- policy: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`
- asset name: `5052452d52494348`
- Plutus version: V2
- serialized witness length: 381 bytes
- mint redeemer: `{"int":1}`
- exact witness: `audit/gate41/HISTORICAL-PRE-MINTING-POLICY-WITNESS-v0.1.md`

## Candidate one-shot parameter

The witness contains the 32-byte value:

`f6874f42a880915f7d79d6b23ecc55eb378b5fd8847c4004ed1c98a2eba70509`

This is a strong candidate for an embedded OutputReference/transaction hash parameter.

## Verification tasks

1. Decompile the Plutus V2 program into a representation where constants and input predicates are inspectable.
2. Locate the candidate 32-byte value in the decompiled program.
3. Identify whether it is used as an OutputReference/transaction hash.
4. Prove whether the mint branch requires consumption of that exact UTxO.
5. Recompute the policy hash from the exact script and verify the canonical policy ID.
6. Attempt a controlled negative case with a different UTxO reference.
7. Record the exact toolchain/version and all input hashes.
8. Produce a reproducible evidence packet.

## Acceptance criteria

### Direct reuse CLOSED only if

The exact historical policy can be shown to validate a new Preprod mint without consuming the historical parameter UTxO and without changing the policy ID.

### Bridge REQUIRED if

The mint branch requires the historical UTxO, or any replacement parameter changes the policy ID, or the policy cannot be safely re-executed on Preprod.

## Fail closed

Until this gate is closed, do not:

- mint a new token under a guessed policy;
- rename a different-policy asset to PRE;
- alter Genesis admission;
- use Yaci synthetic PRE as production evidence.

## Status

**OPEN — verification evidence required.**
