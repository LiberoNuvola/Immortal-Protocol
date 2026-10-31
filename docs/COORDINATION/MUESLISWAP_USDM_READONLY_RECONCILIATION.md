# MuesliSwap USDM — read-only pool discovery

**Status:** current Pool NFT UTxOs discovered from SuperCardano hints and re-queried on Koios Mainnet; datum retrieval/decoder and market API remain incomplete.  
**Branch:** `work/immortal-green-closure`  
**Scope:** read-only research only. No wallet, signing, transaction, oracle refresh, EEV or deployment action.

## Exact asset and official deployment identity

Moneta USDM:
- policy ID: `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`
- asset name: `0014df105553444d`
- decimals: 6

Official MuesliSwap pool-contract repository:
- Pool payment credential derived from both published pool addresses: `7045237d1eb0199c84dffe58fe6df7dc5d255eb4d418e4146d5721f8`
- Pool NFT policy ID from `dex/plutus/nft_policyid`: `909133088303c49f3a30f1cc8ed553a73857a29779f6c6561cd8093f`
- Published addresses: `dex/plutus/pool.addr` and `dex/plutus/pool_without_stake_key.addr`

The SuperCardano `muesliswap:<unit>` pool keys use this exact NFT policy followed by a 32-byte (64 hex character) asset name. The observer checks that policy before using a key as a discovery hint.

## First exact-NFT Mainnet acquisition

Actions run [41231687131](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41231687131), source commit `50e8b7896af124d87ac7bcec2376ff2834e554b4`, completed the NFT-based Koios observer successfully.

- SuperCardano discovery hints: 3 distinct MuesliSwap pool NFT units under the official policy.
- Koios exact-NFT queries: 3 current UTxOs returned.
- All 3 UTxOs contain exactly one queried Pool NFT and exact Moneta USDM.
- 2/3 have the official MuesliSwap pool payment credential.
- 1/3 has a different payment credential and remains **unqualified** pending identification of its script/version.
- All 3 outputs have datum hashes; none has inline datum JSON.
- No PoolDatum decoder, LP identity check, reserve validation or market price qualification has yet been completed.

Artifact ID `13053384226`; ZIP SHA-256 `f0700936497e9a5d6f3f171d6210b29911c4c026e8f6be7309099c6b26c178ef`; extracted JSON SHA-256 `936eb06482df7dbd7d6d04e3a58859d74461ef841f464c4f24a098c96b87fb84`.

The two outputs using the official payment credential were at an address not equal to either of the two static address strings in the deployment repository, but their payment credential matches the official pool script hash. This explains why the earlier address-filtered attempt returned zero; exact Pool NFT identity is the better discovery key.

## MuesliSwap public API

The collector queried all four combinations:
- token-a / token-b orientation;
- `only-verified=y` and `only-verified=n`;
- provider filter `muesliswap_v2,muesliswap`.

In run 41231687131 all four requests failed before HTTP response with DNS `ENOTFOUND api.muesliswap.com`. Classification is `SOURCE_UNAVAILABLE`, not zero pools. The public API docs list `GET /liquidity/pools`, the token-a/token-b parameters, and those provider names. See [MuesliSwap API docs](https://docs.muesliswap.com/muesli-api).

## Next gates

1. Resolve all three datum hashes through Koios `POST /datum_info`; raw bytes, JSON and response hashes are retained.
2. Identify the datum schema against the official Muesli pool script source and decode the two official-payment-credential candidates.
3. Investigate the third candidate's different payment credential; do not accept it based on NFT policy alone.
4. Retry the API from a functioning DNS/network path; preserve `SOURCE_UNAVAILABLE` until then.
5. Only after contract-bound decoding and live reserve checks, derive any pool spot observation. This remains separate from USD/USDM peg or oracle qualification.

SuperCardano is an independently operated indexer, not a separate DEX venue. Its rows are discovery hints only; Koios re-queries the exact NFT on Mainnet. No price, peg, oracle, EEV or deployment qualification is produced.
