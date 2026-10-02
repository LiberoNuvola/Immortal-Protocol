# Gate 41 — Historical PRE mint witness retrieval pass — 2026-09-24

## New finding

A deeper retrieval pass checked:

1. Library acquisition manifests and transaction evidence;
2. the active GitHub branch `work/immortal-green-closure`;
3. exact PRE mint transaction path;
4. searches for `redeemer`, `purpose: mint`, `assets_minted`, and the PRE policy;
5. the exact creation datum.

The acquisition manifest/transcript explicitly lists:

`evidence/pre-snek/gate41-genesis/tx-info/0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4.raw.json`

and also the normalized/non-raw transaction artifacts.

However, direct GitHub content retrieval of both:

- `...0235...raw.json`
- `...0235....json`

on `work/immortal-green-closure` returns HTTP 404.

Therefore the manifest proves that these files were part of an acquisition/staging snapshot, but **does not prove that the raw witness artifact is currently available in the active repository**.

## Important false-positive eliminated

Library searches for `redeemer` and `purpose: mint` surfaced detailed Plutus redeemers, but inspection shows these belong to other transactions/continuing pool state (for example State-0 / later transactions), not the PRE creation mint `0235...`.

They must not be reused as the historical PRE mint witness.

## Current evidence boundary

Confirmed:

- PRE policy: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`;
- exact PRE creation transaction: `0235e186...`;
- exact PRE supply: 1,000,000,000;
- pool allocation: 996,071,981;
- creator-side allocation: 3,928,019;
- exact PoolDatum and its historical parameters.

Not yet observed:

- PRE token mint redeemer for `0235...`;
- historical PRE mint-policy source/compiled artifact;
- direct witness binding 3,928,019 PRE to exactly 10 ADA.

## Status

The historical witness gap is now **confirmed as an artifact-availability gap**, not merely an unsuccessful search.

The 10 ADA hypothesis remains:

**STRONGER SEMANTIC LEAD / NOT PROVEN.**

No current Snek v1 formula is retrofitted onto the historical PRE launch.

## Next decisive route

Retrieve the missing historical raw transaction from the original acquisition source or re-acquire it from an authoritative Cardano transaction endpoint with full witness/redeemer information. Then compare:

- minting policies;
- mint redeemers;
- output topology;
- creator allocation;
- pool seed;
- transaction metadata;
- any launch-specific datum/parameters.

Only after that comparison can the 10 ADA attribution be promoted.
