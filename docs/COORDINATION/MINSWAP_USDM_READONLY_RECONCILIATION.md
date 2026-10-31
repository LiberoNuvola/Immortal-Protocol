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
- pool address stake credential in `deployed/mainnet/params.json` is a **Key** credential with hash `52563c5410bff6a0d43ccebb7c37e1f69f5eb260552521adff33b9c2`;
- pool batching credential in `deployed/mainnet/script.json` is a **Script** credential with hash `1eae96baf29e27682ea3f815aba361a0c6059d45e4bfbe95bbd2f44a` (also the credential encoded in `poolBatchingAddress`). These are distinct credentials and must not be conflated.
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

The read-only observer now implements a strict V2 PoolDatum JSON decoder for the published 10-field constructor and validates the configured pool batching Script credential, canonical ordered asset pair, exact USDM membership, exact Pool NFT quantity 1, derived LP asset identity/presence, positive liquidity/reserves, exact allowed output Value composition, and lower-bound checks that ensure output Value reserves are not below datum reserves. The ADA reserve comparison follows the validator's `min_pool_ada = 4,500,000 lovelace` adjustment. Unsupported/missing datum JSON remains unqualified.

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
- Value reserve below datum reserve;
- unexpected asset in the pool Value;
- USDM absent from the datum pair.

**Important evidence boundary:** these fixtures are synthetic, not copied from a real Koios response. The Vitest suite has been added to the repository but has not been executed in this environment. Therefore no runtime/test-pass claim is made, and the Koios `inline_datum.value` serialization shape remains to be confirmed against a captured Mainnet fixture.

The implementation constants were cross-checked against the official Minswap V2 source: `PoolDatum` has ten fields; `min_pool_ada` is 4,500,000 lovelace; `compute_lp_asset_name` uses SHA3-256 over each concatenated policy/name pair and then over the two hashes; the deployed Mainnet pool batching Script credential (`1eae…`) and Pool NFT identity match the pinned values already recorded above. The separate pool address Key stake credential (`5256…`) is not the datum's batching credential. See the official [Minswap V2 repository](https://github.com/minswap/minswap-dex-v2), particularly `lib/amm_dex_v2/types.ak`, `lib/amm_dex_v2/utils.ak`, and `deployed/mainnet/params.json`.

**CI harness added:** `.github/workflows/minswap-v2-observer-tests.yml` runs the focused Vitest suite on relevant pushes to `work/immortal-green-closure` and pull requests. Workflow commit: `58188c06c4dc26a9707699bd6933f5502da3e9aa`. Its first run is green: Actions run 41203141441, job decoder-fixtures; logs confirm 9/9 synthetic tests passed on Node 22.23.4 / Vitest 1.6.1.

**CI evidence:** 9/9 synthetic decoder tests passed in Actions run [41203141441](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41203141441), source commit 58188c06c4dc26a9707699bd6933f5502da3e9aa. This does not validate a real provider serialization.

**Next gate:** capture a real Koios UTxO fixture, compare its raw inline datum representation with the decoder, and only after that attempt a strictly read-only Mainnet reconciliation.


## 11. Mainnet acquisition attempt and targeted retry

The first live read-only execution was attempted in Actions run [41203284220](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41203284220). Koios `/address_utxos` timed out with HTTP 504 on the first page after approximately 121 seconds. The raw error body and SHA-256 were preserved in the job log; no rows or datum were returned. This is classified as `SOURCE_UNAVAILABLE`, not as zero matching pools.

To avoid enumerating every UTxO at the shared V2 validator address, the observer now uses Koios `POST /asset_utxos` with the exact USDM policy/name pair and a PostgREST `address=eq.<official-address>` filter, retaining `_extended: true` and the same explicit pagination. Official Koios examples document the `_asset_list` pair structure and extended UTxO fields. The exact-asset/address-filtered retry is queued automatically by the observer workflow; its outcome must be recorded separately. No fallback to ticker or approximate asset identity is allowed.


## 12. Real Mainnet datum fixture and credential correction

The first successful targeted Koios capture exposed the actual Plutus Data constructor for `PoolDatum.pool_batching_stake_credential`: `Inline` constructor 0 wrapping `ScriptCredential` constructor 1, hash `1eae96baf29e27682ea3f815aba361a0c6059d45e4bfbe95bbd2f44a`. The previous decoder incorrectly assumed a VerificationKey credential and compared it with `52563c…`.

Official deployment files distinguish the two identities: `deployed/mainnet/script.json` declares `poolBatchingCredential` as Script hash `1eae…` and `poolBatchingAddress` as `stake17y…`; `deployed/mainnet/params.json` separately declares `poolStakeCredential` as Key hash `52563c…`. The captured UTxO's own `stake_address` decodes to the latter Key hash. The decoder now validates the former Script hash in the datum. A real datum fixture is preserved at `scripts/fixtures/minswap-v2-usdm-mainnet-2026-10-31.json` with Koios response provenance and raw CBOR.

This correction is based on the actual Mainnet datum and official deployment configuration. The real fixture is expected to validate as a candidate only after the focused CI suite reruns; no result is asserted until that run completes.


## 13. Minswap V2 fee accounting — reserve reconciliation rule

The initial observer treated `datum.reserve_a/b == Value reserve_a/b` as mandatory. That was too strict. The official Minswap V2 `order_validation.ak` deliberately tracks both values separately: for a successful swap, the datum reserve increases by `swap_amount - earned_fee_in`, while the Value reserve increases by the full `swap_amount`. The difference therefore retains earned fees in the pool Value without including them in the AMM pricing reserve. See [official Minswap V2 order_validation.ak](https://github.com/minswap/minswap-dex-v2/blob/main/lib/amm_dex_v2/order_validation.ak) around the `validate_swap_exact_in` state update.

The observer now uses a fail-closed lower-bound rule: `Value reserve >= datum reserve` for both pair assets, and records the non-negative difference as `valueSurplusARaw` / `valueSurplusBRaw`. If Value is below datum reserve, the candidate is unqualified. For an ADA pair, lovelace must be at least `min_pool_ada + datum ADA reserve`; for a non-ADA pair, lovelace must equal `min_pool_ada` exactly. The output Value still must contain only ADA, the two pair assets, the derived LP asset and exactly one Pool NFT.

The previous 7 MATCH / 24 UNQUALIFIED classification from run 41203746686 used the superseded equality check. Do not use those counts as current qualification results. The updated focused CI and Mainnet observer run will supersede them.


## 14. First successful Mainnet V2 pool reconciliation snapshot

Actions run [41204050705](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41204050705) completed both the focused decoder suite and the exact-USDM/address-filtered Koios observer successfully. The decoder suite reports **12/12 tests passed**, including the real Koios fixture and fee-surplus/ADA cases. The observer acquired **31** current USDM UTxOs at the official V2 pool address, with 31 transaction contexts; the corrected structural validator reports **31 MATCH, 0 UNQUALIFIED** and no validation reasons.

Evidence artifact: [minswap-v2-usdm-mainnet-readonly-41204050705](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41204050705/artifacts/13043641385), artifact ID `13043641385`, ZIP SHA-256 `38ee9388333e85a1765493cbc879b48bca2a42e9758534893e4897eac86acacc`. JSON body SHA-256 `db5b109eb4638eac10434f5b3d120b57c526d55f2d4f7de837c8aea1434ecbcb`. Snapshot window `2026-10-31T13:06:23.028Z`–`13:08:30.233Z`; Koios response timestamp and raw-body hash are preserved per page in the artifact.

**Interpretation limit:** `MATCH` means exact asset pair membership, official V2 payment script, batching Script credential, Pool NFT, derived LP asset, supported datum shape, positive reserves, allowed Value composition, and Value-reserve lower bounds all passed. It does **not** mean Minswap API market data has been reconciled, nor that any USDM/USD price, peg, oracle source, EEV or deployment is qualified. Minswap API collection remains a separate next step; Minswap API and GeckoTerminal are the same DEX venue, not independent venues.

A follow-up source correction at commit `3c500e192389c16c87eee2e3bb3db9534876f498` makes the per-candidate `qualification` label reflect the structural MATCH without implying oracle qualification. Its workflow rerun is pending at the time of this record.


## 15. Confirmed structural snapshot after qualification-label correction

A second read-only Mainnet run [41204297344](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41204297344) tested source commit `3c500e192389c16c87eee2e3bb3db9534876f498`. The focused test job and observer job both succeeded. The observer returned 31 candidates, all **31 MATCH**, no validation reasons, one complete pagination page, and every per-candidate qualification label is now `POOL_IDENTITY_AND_RESERVE_STRUCTURE_MATCH_NOT_ORACLE_QUALIFICATION`.

Artifact ID `13043476858`, ZIP SHA-256 `57ce6478ecedec6fb522271eedba921ed3a5c62904a567cb94c55fe671674af0`; extracted JSON SHA-256 `76b74901b312a4754673dacfa7f2d787bc0baeb3c94fe7259f88242f7370a8c8`. This confirms the label fix and repeats the structural census. It does not add market price qualification.

A dedicated read-only Minswap API collection job was added to `.github/workflows/minswap-v2-observer-tests.yml` and the collector's cross-protocol pool key was fixed to prevent one protocol family overwriting another. The first API collection run is pending.


## 16. Minswap API current-pool census and cross-source identity comparison

The first full-history attempt (Actions run 41204422144) reached the per-pool history stage and received HTTP 429 from Minswap (`retry in 1 minute`). The collector was changed so per-pool history is opt-in via `--with-history`; the default collection now captures exact-asset lookup and current pool metrics first, avoiding an unnecessary burst of history calls. The collector also preserves protocol family in its internal pool key (`protocol + LP asset id`) so records cannot overwrite each other across V1/V2/Stable.

The metrics-only read-only collection succeeded in Actions run [41204489438](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41204489438): exact verified Moneta USDM found, decimals 6; **43 pools** total — **31 MinswapV2**, **8 Minswap V1**, **4 Minswap Stable**. History was deliberately deferred (`historyCollection.enabled=false`). API artifact ID `13044046954`, ZIP digest `f716856f91f59b521accc4749a25673ef067037fbdf57af6fc107c7bd6346a0e`; extracted JSON SHA-256 `c679c7c150e37ec4690e9508981186256fc1c4173c0e987dde0b67392cc08f30`.

A direct comparison of that API artifact with the same-run Koios artifact (run 41204489438) found **31/31 exact LP asset identity matches** between MinswapV2 API and the 31 Koios candidates, and **31/31 exact unordered asset-pair matches**. This is a pool-set/identity reconciliation only. It does not validate API USD liquidity or volume values, price/peg, independent market depth, or oracle suitability.

A deterministic reconciliation script, `scripts/reconcileMinswapV2UsdmApiOnchainReadOnly.mjs`, and a dependent GitHub Actions job were added to reproduce this comparison from same-run artifacts. The first automated reconciliation run is pending.


## 17. Automated same-run API / Koios reconciliation — first pass

The new dependent Actions job `reconcile-api-vs-onchain` completed successfully in run [41204657669](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41204657669), source commit `d4283fe12e25d315165c88379e9db99d5d372564`. It downloaded both artifacts from the same workflow run and executed `scripts/reconcileMinswapV2UsdmApiOnchainReadOnly.mjs`.

Automated summary:

| Measure | Result |
|---|---:|
| Koios exact-USDM candidates | 31 |
| Koios structurally matched | 31 |
| Minswap API pools, all protocols | 43 |
| Minswap API V2 pools | 31 |
| Exact LP identity + pair matches | **31** |
| On-chain only | 0 |
| API only | 0 |
| Pair mismatches | 0 |
| On-chain unqualified | 0 |
| Duplicate API LP IDs | 0 |

Reconciliation artifact ID `13044411182`, ZIP SHA-256 `b0c2d9b3c93f9e4c6098eb7c7303ad080ed30d77fbac7cc959617ec87ebfc339`; extracted JSON SHA-256 `c01872590804b698dd5ad6adb1328809ea4139467320bdc5abf50a4bbbc07c80`.

The source windows were close but not atomic: API `13:14:27.946Z`–`13:14:28.758Z`; Koios `13:14:29.034Z`–`13:15:46.121Z`. Both preserve per-request raw response hashes and timestamps. This is strong evidence of **pool-set and exact asset-pair identity agreement** between Minswap V2 API and the Koios Mainnet view at the captured times. It is not independent market validation: both sources describe the same Minswap venue / Cardano ledger state. It does not qualify USD-denominated API liquidity/volume, USDM/USD price, peg, oracle, EEV, or deployment. Per-pool history remains deferred after the documented HTTP 429.


## 18. Independent indexer coverage — SuperCardano and additional free/paid paths

### SuperCardano (new read-only indexer observer)

SuperCardano publishes unauthenticated read-only endpoints for exact asset market data:

- `GET /api/v1/markets/tokens/{unit}` — token activity, price in ADA, liquidity, and pool rows with venue, pool key, asset units, reserves, LP, height and time.
- `GET /api/v1/markets/tokens/{unit}/trades` — settled trade rows with transaction hash, block height, venue, pool, exact token/ADA quantities, price when available, order kind, owner classification and flags.
- `GET /api/v1/assets/{unit}/ranks` — ranks and as-of block/time metadata.

The methodology states that SuperCardano reads pools from its own Cardano node, waits 15 blocks before recording pool state, and derives pool prices from on-chain state. It also says that its own token price surface currently reads Minswap V2; WingRiders V2 and Dano Finance are being added after their readers run clean for a week. USD figures currently use DexHunter's ADA/USD rate, not SuperCardano's own independent USD series. Therefore this is a potentially independent **on-chain indexer implementation**, not an independent DEX venue or independent USD oracle. The token pool/trade rows show broader venue identifiers, but each venue's actual freshness and decoder coverage must be evaluated from its block/time and trade rows, not assumed from the site-wide coverage claims.

Exact asset used in the endpoint path is the full unit `c48c…47ad0014df105553444d`, never the ticker alone. A live read through the public endpoint returned pool rows for Minswap V2/V1, WingRiders V2, SundaeSwap V3, VyFi, MuesliSwap, CSWAP, Splash and Danogo CLMM, plus recent trade rows identifying venues such as Minswap V2, WingRiders V2 and Danogo CLMM. These are initial discovery observations, not yet frozen evidence: the committed observer `scripts/collectSuperCardanoUsdmReadOnly.mjs` captures raw responses, response hashes, headers, source metadata, exact asset pools and trades. Its first CI run is pending.

### Other candidate paths and cost classification

| Source | What it adds | Cost / access | Independence caveat |
|---|---|---|---|
| DanoNight stablecoin tracker | Own `cardano-db-sync`-based on-chain pool scan; ADA-per-stablecoin rates, cross-DEX pool comparison, daily history | Public page, no API key shown | Own indexer; its USD conversion uses CoinGecko ADA/USD; daily cadence and published pool coverage are limited |
| GeroWallet Market / Nexus | Gero's own Nexus indexer, 11 DEXs, trades, candles, order books | Wallet UI is free; developer market-data API is paid add-on (Nexus base plan plus Market Data) | Independent indexer implementation; Nexus multi-provider failover can route through Koios/Blockfrost/Maestro, so not an independent underlying ledger |
| DexHunter | Aggregated DEX quotes, OHLCV, order history, routing across 15+ DEXs | Partner API requires `X-Partner-Id`; free API access not established | Aggregator across venues; not a separate venue, and quote path may overlap existing DEX sources |
| Cardanoscan API | Separate explorer/indexer, asset and address/transaction lookups | Free API plan, API key, documented 5 req/s and up to 100k calls/day | Useful for ledger cross-checks, not a native market-price oracle or DEX-specific market-data API |
| CoinGecko / CryptoSlate / market aggregators | Cross-venue listings, snapshots and market summaries | Access tiers vary; public pages accessible | Aggregated sources may share upstream DEX data; provenance and venue de-duplication must be established |

### Source independence model

Do not use “multi-oracle” as a raw count of APIs. Keep these dimensions separate:

1. **Venue independence:** distinct DEX protocol/pool contract (e.g. Minswap vs WingRiders vs SundaeSwap vs Danogo).
2. **Indexer independence:** separately operated chain reader and database (Koios vs SuperCardano own node vs DanoNight db-sync vs Nexus), after checking provider lineage and failover.
3. **Market-data independence:** separate trade/pool interpretation, filtering, freshness, and aggregation methodology.
4. **USD reference independence:** separate fiat/USD source (exchange market or independently published on-chain oracle statement). A USD conversion that reuses DexHunter or CoinGecko is not an independent USD observation.
5. **Issuer/reserve independence:** Moneta reserve/attestation evidence is a distinct backing dimension, not interchangeable with DEX spot price.

A valid multi-source quorum must identify overlap and common-mode dependencies; three APIs that all ingest Minswap or route USD conversion through the same source do not create three independent oracles.

### Immediate next gates

- Verify the SuperCardano collector CI run, inspect raw artifact and freshness metadata, count venue pools and trades, and classify stale/unsupported pools separately.
- Reconcile its Minswap V2 pool keys/reserves and trades against Koios and the Minswap API, while preserving provider-specific identities and timestamps.
- Add venue-specific on-chain observers only for venues that can be authenticated by their own pool NFT/script identities (WingRiders, SundaeSwap, Danogo, VyFi, MuesliSwap, CSWAP, Splash).
- Keep all USD conversion and peg claims blocked until ADA/USD reference provenance and an independent cross-check are qualified.


## 19. First frozen SuperCardano USDM observation

The SuperCardano observer completed successfully in Actions run [41221859296](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41221859296), at source block **14,140,510** (Unix time `1793465281`), with source metadata `stale=false`. Both exact-unit endpoints returned HTTP 200 and their raw response hashes are preserved.

Artifact ID `13050446694`, ZIP SHA-256 `4586f94d439f43d9ee71554abcd397bce0a40e6ee2104ab6e85327a5393e14c2`; extracted JSON SHA-256 `b3c220e155950608fbc34e1b600054e9b72c6b8bfd712fe0ee0d41afed3b59d2`. Raw token response SHA-256 `e6052504d1a3b70e98d583ec9ea1bfb1797da990d6ed012542305d74327fc413`; raw trades response SHA-256 `23d71b9d3856c52f32b45a5e8429abcfabe6f9986472f6c94e5a847b280f4c52`.

The endpoint returned **81 USDM pool records across 9 venue families**: Minswap V2 31, Danogo CLMM 12, Sundae V3 10, Minswap V1 8, WingRiders V2 6, VyFi 5, Splash 5, MuesliSwap 3, CSWAP 1. These are not 81 confirmed active pools: pool timestamps relative to the source's own as-of time show many old records. For Minswap V2, 5 records were under 24h old, 5 were 1–7 days old and 21 were older than 7 days. Other venues' freshness buckets are preserved in the artifact.

The endpoint also returned 50 latest USDM trade rows: Minswap V2 32, Danogo CLMM 13 and WingRiders V2 5; all were Level B. Flags include converted (22), multiHop (9) and batchImpact (2), so these flags must be respected when using trade rows as price evidence. The source's own token price was `5.094192535453990358` ADA/USDM, but its methodology states its own price surface currently reads Minswap V2; it is not a cross-venue consensus or independent USD quote. The USD display uses DexHunter ADA/USD and is explicitly excluded from our oracle count.

This is a useful independent indexer feed for raw pool/trade observations and venue discovery. The next gate is to reconcile SuperCardano's 31 Minswap V2 pool keys and reserve values directly against the same-run Koios UTxOs and PoolDatum, then separately authenticate the non-Minswap venue pools using each venue's own on-chain contract/NFT identities.


## 20. Automated three-source structural reconciliation — 31/31/31

The corrected multi-source workflow [41221976475](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41221976475) completed successfully on commit `16cd0484482ec61a3ac24e62dafbab8847ce83f1`. All required jobs passed: decoder fixtures **12/12**, Koios exact-USDM Mainnet acquisition, Minswap API metrics collection, SuperCardano exact-unit pool/trade collection, and the dependent reconciliation.

The automated reconciliation compared three same-run observations:

- **Koios:** 31 exact-USDM UTxOs at the official Minswap V2 address, each structurally validated.
- **Minswap API:** 31 V2 pool records among 43 total pools across Minswap V1/V2/Stable.
- **SuperCardano:** 31 Minswap V2 pool records among 81 USDM pool records across 9 venue families.

For the 31 Minswap V2 pools, the result is **31/31 exact LP identity + pair + reserve matches** across Koios PoolDatum/UTxO and SuperCardano's own indexer; 0 on-chain-only, 0 SuperCardano-only, 0 pair mismatches, 0 reserve mismatches, 0 duplicate IDs. The separate Minswap API reconciliation also remains 31/31 with 0 API-only, 0 on-chain-only and 0 pair mismatches. This materially strengthens the independent indexer check for Minswap V2's structural pool state.

Reconciliation artifact ID `13050372165`, ZIP SHA-256 `37fb204a00072b38364b2e44662cdd6b7b20d0d7e47d12b166f0624d764bd950`; extracted JSON SHA-256 `92e2a20265ce6db8331db61ee2eb959e41fdad086cc527977be8755cbe3a4c07`.

Same-run source artifacts:
- Koios artifact ID `13050436975`, ZIP SHA-256 `74bba8e5846e3c1936bff777d0664703e917c07a283b85b8d17d3f36ba9eb09f`.
- Minswap API artifact ID `13049768317`, ZIP SHA-256 `afb00e2af4e6103862f372d7f847546e0b43e9b7a36762a68c0f453e466d6b69`.
- SuperCardano artifact ID `13050850055`, ZIP SHA-256 `147a61eefffab293dc52879a94456595ea517be1c966c1575dc02823571e4b5c`.

**Boundary:** this validates pool identity, pair and reserve serialization for Minswap V2. It does not make SuperCardano or Minswap API independent DEX venues, does not independently validate USD conversion, USDM/USD peg, Moneta reserves, or a price oracle quorum. SuperCardano's non-Minswap pool list and trades are useful venue-discovery observations, but their freshness and venue-specific contract authenticity remain separate gates. Many of the 81 pool records are older than seven days; freshness buckets are recorded and must be used before interpreting them as live market depth.


## 21. Danogo CLMM official identity and decoder gate

The public official SDK `dano-finance/clmm-sdk` provides pinned Mainnet constants and the pool datum schema:

- Mainnet pool NFT policy / pool script hash: `d8b69fc53637bcfadbc4469083f706bc293f4d9d2296646c5ca167bb`.
- Mainnet pool script reference UTxO: `64d111b957e7d7848ffdde5149aa77fa4090a7fa1ad0ac108067900614848501#0`.
- Mainnet protocol config reference UTxO: `2cafd7c92f7093e5229af274be83dea660b0590b4174bbed79ba662b44fbd1ee#0`.
- The SDK identifies a pool by a unique token name under the pool script policy; it decodes an inline `PoolDatum` with 12 fields: tokenX, tokenY, LP fee rate, platformFeeX/Y, totalSwapFee, lower/upper sqrt price ratios, minX/Y change, circulating LP supply and last withdraw epoch.
- `getPoolsFromOgmiosTx` finds pool outputs by the pool NFT policy and quantity 1, decodes the inline datum and extracts raw token reserves from the output Value. Its swap math subtracts platform fees and the ADA/min-ADA plus total-swap-fee reserve before calculating active reserves. This means a CLMM reserve ratio alone is not an executable marginal price; current sqrt range/liquidity and fee state matter.

Added `scripts/observeDanogoClmmUsdmReadOnly.mjs` to take Danogo CLMM USDM pool keys discovered by SuperCardano, query those exact pool NFT policy/name pairs from Koios `/asset_utxos`, validate current NFT UTxO cardinality, decode the 12-field datum, verify exact USDM pair membership and compare raw Value reserves with the SuperCardano observation. The observer records payment credential vs the official pool script hash, datum CBOR/hash, output ref, block/time, and per-pool freshness. It makes public GET/POST read-only queries only; no wallet, signature, transaction, or chain write.

The first run is pending. Important limits: this gate proves only current pool identity/datum/Value structure and independent indexer reserve agreement; it does not calculate the CLMM quote, USD price, peg, issuer reserves, or oracle qualification. Pool rows with no current NFT UTxO are recorded as missing/currently closed rather than assumed active.
