# Minswap USDM — read-only market / UTxO reconciliation

**Status:** source implementation and contract-bound decoder added; fixture/runtime and live execution not yet evidenced.  
**Branch:** `work/immortal-green-closure`  
**Scope:** Agent A only. No V3, Reveal, Materios, Kernel, Oracle consumer, EEV, R1/Kc, wallet, deployment or transaction changes.

## 1. Purpose and evidence classification

Reconcile Minswap API observations with Cardano ledger UTxOs for the exact Moneta USDM asset. Minswap API and GeckoTerminal are treated as separate indexer/API observations of the same DEX venue, not as independent market venues or independent price oracles.

The collector is an audit/market-observation tool only. Its output is not a USD/USDM quote, peg proof, EEV valuation, authoritative oracle observation, or deployment approval.

## 2. Exact asset identity

Mainnet asset identity (all comparisons are case-insensitive hex equality):

- Policy ID: `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`
- Asset name hex: `0014df105553444d`
- Decimals: `6`
- Human ticker: `USDM` (display only; never an identity key)

## 3. Existing API collector

Source: `scripts/collectMinswapUsdmReadOnly.mjs`  
Initial collector commit: `48b057e018092d296e7c0d2ca82ae61ffeb3c754`

The script queries Minswap asset lookup, pool metrics for V1/V2/Stable, per-pool metrics and price/volume/TVL history. It records HTTP response date, request metadata, raw-body SHA-256 and pagination cursors.

Important implementation review points before qualification:

1. Store raw reserve quantities separately from normalized values and USD-denominated metrics.
2. Ensure LP asset IDs are canonical and pool records cannot silently overwrite a distinct record from another protocol family.
3. Record server HTTP Date separately from chain block time, slot and block hash.
4. Preserve raw request/response bytes or exact UTF-8 body alongside the hash.
5. A partial pagination run or failed pool-history request must produce an incomplete/failed classification, not a complete census.
6. Preserve pools with unknown counterparties, but do not classify them as trusted reference markets.

Minswap documents `POST /v1/pools/metrics` as a query endpoint; the POST method itself does not imply a ledger write. See https://docs.minswap.org/developer/minswap-apis.

## 4. On-chain observer design

The on-chain observer must retrieve live UTxOs read-only and retain, at minimum:

- network and provider name;
- request timestamp and response HTTP Date;
- raw response SHA-256 and response body;
- output reference `tx_hash#tx_index`;
- address and payment/stake credentials;
- asset list as raw integer quantities (policy ID + asset name);
- inline datum CBOR and datum hash, when present;
- transaction block hash, block height, block time and slot, resolved independently if not present in the UTxO response;
- provider request parameters and pagination/range metadata.

Initial acquisition path: public Koios Mainnet `POST /address_utxos` or `POST /script_utxos` with extended output fields. Existing repository code already uses Koios `address_utxos` with `_extended: true` in `audit/cardano-integration/KoiosOgmiosProvider.mjs`. Blockfrost and Maestro are optional read-only cross-check providers. Different providers reading the same ledger are not independent market sources.

Do not infer reserves from API TVL or displayed USD values. Do not infer a datum schema from a pool ticker. Unknown or undecodable datum stays `UNKNOWN`.

## 5. Verified Minswap V2 deployment anchors

The official Minswap DEX V2 repository publishes:

- pool script hash: `ea07b733d932129c378af627436e7cbc2ef0bf96e0036bb51b3bde6b`;
- pool stake key credential hash in `deployed/mainnet/params.json`: `52563c5410bff6a0d43ccebb7c37e1f69f5eb260552521adff33b9c2`;
- official pool creation address, also shown in the repository README:
  `addr1z84q0denmyep98ph3tmzwsmw0j7zau9ljmsqx6a4rvaau66j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq777e2a`.

The official `deployed/mainnet/script.json` additionally identifies `poolAuthenAsset` as policy `f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c` + asset name `4d5350` (`MSP`), and `lpPolicyId` as the same policy. The observer records the raw Pool NFT quantity and whether it is exactly 1; this is not yet a full pool qualification.

The address is a discovery anchor, not by itself proof that every returned UTxO is a valid pool. Candidate UTxOs must be filtered by the exact USDM policy/name and validated against the V2 validator's actual datum/value rules and deployed reference material.

Official source files:
- https://github.com/minswap/minswap-dex-v2
- https://github.com/minswap/minswap-dex-v2/blob/main/deployed/mainnet/params.json
- https://github.com/minswap/minswap-dex-v2/blob/main/deployed/mainnet/references.json

For V2, the contract source describes `PoolDatum` asset pair and reserve fields and requires consistency between reserve fields and the output `Value`. The observer must compare both, not choose one.

## V2 decoder implementation status

The read-only observer now implements a strict V2 PoolDatum JSON decoder for the published 10-field constructor and validates the configured batching stake key credential, canonical ordered asset pair, exact USDM membership, exact Pool NFT quantity 1, derived LP asset identity/presence, positive liquidity/reserves, exact allowed output Value composition, and datum reserve quantities against output Value. The ADA reserve comparison follows the validator's `min_pool_ada = 4,500,000 lovelace` adjustment. Unsupported/missing datum JSON remains unqualified.

This is a source implementation awaiting fixtures and runtime verification, not a live qualification.

## 6. Protocol-specific handling

Do not share a single datum decoder across V1, V2 and StableSwap.

- **V1:** identify pools through official V1 deployed validator/pool identity and pool NFT/LP identity; extract exact asset pair and reserves only after decoding the verified V1 datum.
- **V2:** bind to the deployed V2 pool validator identity and configured stake credential; validate exact pair, LP identity, pool authentication asset and consistency of datum reserves against the output Value.
- **StableSwap:** bind to the official StableSwap pool validator and each pool's exact Pool NFT. Verify the Pool NFT's uniqueness/quantity and verify the ordered stable-asset parameter list before interpreting datum `balances`.

StableSwap's official repository documents per-pool Pool NFT, stable-asset parameters, and an ordered balances array in the pool datum. Each StableSwap pool is manually parameterized; do not assume every pool uses the same asset order or datum parameters:
https://github.com/minswap/minswap-stableswap

## 7. Reconciliation rules

Join API and chain observations by exact pool identity, not display name alone. Required join fields are protocol family + LP asset identity (where applicable) + Pool NFT/authentication identity + exact asset pair + pool validator address.

For each matched pool:

1. API asset A/B must match the chain pool pair by policy ID and asset-name hex, allowing orientation reversal only by explicitly swapping sides.
2. Chain reserve quantities must be read as integer atomic units; decimals are metadata, not floating-point conversion.
3. When a datum duplicates reserve fields, compare datum reserves to the corresponding Value quantities according to the exact validator semantics.
4. API reserve values, where supplied, are compared after documented decimals normalization; retain raw values and rounding details.
5. Compare pool identity, reserve quantities, UTxO reference, datum hash, transaction/block metadata and provider response hashes.
6. If the same pool is observed at different chain points, compare only after aligning transaction/slot context; asynchronous provider lag is not automatically a reserve mismatch.
7. Report differences explicitly; never silently overwrite a previous observation.

Allowed result classifications:

- `MATCH`: same pool and exact pair; reserve values reconcile at the same ledger state within precisely documented unit conversion.
- `API_LAG`: identity matches but API indexer is behind the latest chain UTxO; retain both states and chain context.
- `RESERVE_MISMATCH`: identity and state align but reserve quantities disagree.
- `IDENTITY_MISMATCH`: pool ID, pair, validator, NFT or LP identity does not agree.
- `UNKNOWN`: missing/ambiguous identity, unknown datum version, incomplete pagination, missing chain context, or unsupported decoder.
- `SOURCE_UNAVAILABLE`: provider did not return a usable response.

No mismatch is resolved by preferring the API or the chain without retaining both observations and the reason for disposition.

## 8. Execution gates

- [ ] Execute the existing Minswap collector against Mainnet and preserve full output.
- [ ] Verify exact asset lookup, all protocol pagination and all pool-history responses.
- [ ] Confirm exact V1, V2 and Stable pool identities from official contract deployment material.
- [ ] Implement/read-only UTxO acquisition by exact asset, filtered to the verified script address.
- [ ] Decode each datum family against source-verified schema; fail closed for unknown variants. (V2 decoder source added; fixture/runtime verification pending.)
- [ ] Reconcile API data to UTxO/value/datum at an aligned chain state.
- [ ] Add fixtures/tests for orientation, decimals, duplicate pool identity, stale indexer, datum mismatch, incomplete pages and unsupported datum.
- [ ] Record hashes, run identity, code commit, timestamps and limitations in an evidence packet.
- [ ] Update Issue #37 and this coordination record with exact outcomes.

## 9. Current result and limitations

The collector source is present, but no successful live execution has been evidenced in this session. The current execution environment failed DNS resolution for the Minswap and Koios hosts, so no current pool count, reserve, UTxO or slot claim is made. Direct UTxO acquisition and reconciliation remain open.

Option B remains unqualified. This document does not authorize a price, parity assumption, oracle refresh, protocol change, signing, submission, deployment or Issue.


## 10. Decoder fixture harness — 2026-10-31

The V2 observer now exports its pure decoder/validation functions and has a direct-execution guard, so tests can import the implementation without starting any network request.

Added `scripts/observeMinswapV2UsdmUtxosReadOnly.test.mjs` with synthetic Plutus-JSON fixtures for:

- published 10-field `PoolDatum` decoding and bigint precision;
- unsupported constructor shape;
- internally consistent exact-USDM candidate;
- batching stake credential mismatch;
- Pool NFT quantity other than exactly one;
- missing derived LP asset;
- datum reserve vs Value mismatch;
- unexpected asset in the pool Value;
- USDM absent from the datum pair.

**Important evidence boundary:** these fixtures are synthetic, not copied from a real Koios response. The Vitest suite has been added to the repository but has not been executed in this environment. Therefore no runtime/test-pass claim is made, and the Koios `inline_datum.value` serialization shape remains to be confirmed against a captured Mainnet fixture.

The implementation constants were cross-checked against the official Minswap V2 source: `PoolDatum` has ten fields; `min_pool_ada` is 4,500,000 lovelace; `compute_lp_asset_name` uses SHA3-256 over each concatenated policy/name pair and then over the two hashes; the deployed Mainnet batching stake key hash and Pool NFT identity match the pinned values already recorded above. See the official [Minswap V2 repository](https://github.com/minswap/minswap-dex-v2), particularly `lib/amm_dex_v2/types.ak`, `lib/amm_dex_v2/utils.ak`, and `deployed/mainnet/params.json`.

**CI harness added:** `.github/workflows/minswap-v2-observer-tests.yml` runs the focused Vitest suite on relevant pushes to `work/immortal-green-closure` and pull requests. Workflow commit: `58188c06c4dc26a9707699bd6933f5502da3e9aa`. Its first run is green: Actions run 41203141441, job decoder-fixtures; logs confirm 9/9 synthetic tests passed on Node 22.23.4 / Vitest 1.6.1.

**CI evidence:** 9/9 synthetic decoder tests passed in Actions run [41203141441](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41203141441), source commit 58188c06c4dc26a9707699bd6933f5502da3e9aa. This does not validate a real provider serialization.

**Next gate:** capture a real Koios UTxO fixture, compare its raw inline datum representation with the decoder, and only after that attempt a strictly read-only Mainnet reconciliation.


## 11. Mainnet acquisition attempt and targeted retry

The first live read-only execution was attempted in Actions run [41203284220](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41203284220). Koios `/address_utxos` timed out with HTTP 504 on the first page after approximately 121 seconds. The raw error body and SHA-256 were preserved in the job log; no rows or datum were returned. This is classified as `SOURCE_UNAVAILABLE`, not as zero matching pools.

To avoid enumerating every UTxO at the shared V2 validator address, the observer now uses Koios `POST /asset_utxos` with the exact USDM policy/name pair and a PostgREST `address=eq.<official-address>` filter, retaining `_extended: true` and the same explicit pagination. Official Koios examples document the `_asset_list` pair structure and extended UTxO fields. The exact-asset/address-filtered retry is queued automatically by the observer workflow; its outcome must be recorded separately. No fallback to ticker or approximate asset identity is allowed.
