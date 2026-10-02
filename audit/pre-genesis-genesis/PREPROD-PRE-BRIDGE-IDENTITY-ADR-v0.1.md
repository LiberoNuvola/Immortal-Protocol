# PREPROD PRE Bridge — Identity ADR v0.1

Date: 2026-09-26

## Decision boundary

The historical PRE asset is:

- Policy ID: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`
- Asset name: `5052452d52494348` (`PRE-RICH`)

Cardano defines a native asset by the complete `PolicyID + AssetName`. A different policy therefore creates a different asset identity. The minting policy hash is permanently bound to the policy ID. This is the basis for the bridge identity boundary.

## Non-negotiable rule

A Preprod asset with a different policy ID is **not** the canonical PRE asset.

It may only be represented as:

- a bridge/wrapped representation;
- a deployment/test representation;

until an explicit cryptographic and economic binding is defined and independently verified.

## Historical policy observation

The recovered 381-byte historical PlutusV2 witness contains the byte sequence:

`f6874f42a880915f7d79d6b23ecc55eb378b5fd8847c4004ed1c98a2eba70509`

The repository evidence identifies this as embedded in the historical PRE policy witness. This is strong evidence that the policy is parameterized by a concrete historical UTxO/hash, but the exact decompilation/execution proof is still a separate verification gate.

## Consequence

Directly reusing the historical policy on Preprod must not be assumed possible.

If the policy is confirmed one-shot/UTxO-parameterized, the historical parameter cannot simply be replaced with a Preprod UTxO while retaining the same Policy ID: parameterizing the script changes the script and therefore its policy hash.

## Bridge requirement

The bridge must explicitly model:

`Canonical Mainnet PRE -> locked/provenance-controlled source -> Preprod representation -> Treasury -> authenticated observation -> Genesis admission`

The representation must never be silently treated as the canonical asset.

## Status

**OPEN — identity model established; one-shot behavior still requires independent execution/decompilation evidence.**
