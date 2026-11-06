# PRE-RICH — Dual-provider live ProtectedCapital census (2026-11-06)

**Status:** bounded current Preprod observation with two-provider concordance; **NOT** a full ProtectedCapital certification, source-completeness proof, R1/Kc certificate, or Issue authorization.

**Branch at final verification:** `work/immortal-green-closure`  
**Latest HEAD checked:** `bd4cd1eb1a7a1db2f1f8cad91f0a58af8c134226`

## 1. Objective and boundary

The purpose of this observation was to establish the current UTxO population at the configured PRE-RICH B1 PrizeValidator and B1 PrizePool addresses, using the existing read-only producer and a second read-only Cardano query path.

No source code for the ledger builder, Koios reader, contracts, validators, or economics was changed for this observation. The workflow changes only:
- enabled an explicit manual trigger for the already-existing two test suites;
- added a read-only Koios census workflow;
- clarified the read-only nature of the existing Preprod context job, then used its push-triggered context-only execution for Demeter/Ogmios corroboration.

No wallet seed was supplied to the census. No bootstrap, deployment, wallet signing, Issue, Reveal, transaction construction, or transaction submission occurred. The existing Demeter/Ogmios context script also performed its pre-existing read-only query of the configured wallet address; that wallet observation is not reproduced in this report.

## 2. Exact-head test evidence

[ProtectedCapital source census tests — workflow run 42171025654](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42171025654) completed successfully on commit `a8bd379a2e09c104a1581dd052443f2122cab9c3`.

- `relayer/koiosProtectedCapitalSourceCensus.test.js`: **19 PASS / 0 FAIL**.
- `PRE-RICH/tests/conformance/PC-item-ledger-source-census.conformance.test.ts`: **15 PASS / 0 FAIL**.

The Node tests exercise endpoint validation, explicit page counts, pagination, stable-tip checks, address/reference validation, duplicate rejection, datum resolution and hash consistency, and fail-closed treatment of incomplete or inconsistent provider data. The Vitest suite exercises item classification, aggregate reconciliation, duplicate and policy mismatches, snapshot mismatch, invalid lifecycle status, Jackpot scalar without lifecycle evidence, and exact fractional payout handling.

Subsequent commits through the HEAD above changed only workflow definitions/comments; the provider reader, item-ledger implementation, and these test files were not changed after the test-bearing commit.

## 3. Koios Preprod observation

[Read-only census workflow run 42171647603](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42171647603) completed successfully on commit `2177e254cf2a0efc49b64cf5929da4dc985ddafc`.

### Identity handling

The workflow downloaded only:
- `preprod-direct-usdm-deployment.json`
- `preprod-oracle-state-deployment.json`

from historical artifact run `39552468679`. It did **not** read or reuse the archived EEV approval JSON.

The manifests' own content digests matched, and the census process re-derived the deployment topology from the checked-out source. It refused to query if any derived script hash, ticket policy ID, or address differed from the manifest topology.

This is deliberately described as `DEPLOYMENT_MANIFESTS_HASH_CHECKED` and `SELF_HASH_MATCH_NOT_SIGNATURE_AUTHENTICATION`; `manifestAuthorityCryptographicallyVerified=false`. The historical manifest is an identity/topology anchor only, not proof of current deployment approval or cryptographic deployment authority.

### Observation

Koios Preprod scan:
- observed at: `2026-11-06T05:59:55.579Z`
- slot: `138261586`
- block height: `5379303`
- snapshot reference: `koios-preprod-observation:138261586:9b551eb174c13fb64aef9cfe7a7821ea2ac3763b0d3e49dbb0ac00244569fa39`
- source manifest digest: `b4ef0b2627282e197eaf428e4c9a9b692df0ed39a7c2bc476ef83d03a1447315`

Results:
- Derived PrizeValidator address `addr_test1wzf7ctkjwysu3v94f0ccqjef63kdwy2gc4qj368x3a70lvsq6uygp`: **0 UTxOs**, 0 decoded PrizeDatums, 0 unclassified outputs.
- Derived B1 Pool address `addr_test1wrhru9jt8jm600y2mltw300c9tu7cj5tuyew7lz0ex2p75gja592e`: **1** singleton UTxO.
- Exact Pool out-reference: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`.
- Value: 5,000,000 lovelace, one B1 Pool singleton, and 1,000,000,000 atomic units of the configured direct-tUSDM asset.
- Direct-USDM v1 deterministic derivation records 100,000 IMMORTAL USDM subunits for that physical quantity. This is the configured physical-asset EEV derivation; it is not an external USD price or peg observation.
- Datum bytes were available. The one required datum-hash comparison passed; mismatch count was zero.
- Pagination totals reconciled and the reported tip did not change during the scan.

The item ledger reports:
- `ticketLedgerInternallyReconciled=true`;
- scope `PRIZE_VALIDATOR_TICKET_POPULATION_ONLY`;
- L1 pending-liability reconciliation: true;
- L3 face-price/reserve reconciliation: true;
- L3 count reconciliation: true;
- all observed L1/L3 item totals are zero at this snapshot.

Output status: `INTERNAL_RECONCILIATION_ONLY`. Artifact: `pre-rich-protected-capital-live-census-42171647603` (artifact ID `13481771009`).

## 4. Demeter / Ogmios v7 corroboration

[IMMORTAL Cardano Preprod Context — run 42172110656](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42172110656) completed successfully on commit `bd4cd1eb1a7a1db2f1f8cad91f0a58af8c134226`.

The existing context-only job queried PrizeValidator and B1 Pool using `queryLedgerState/utxo` through one authenticated Demeter/Ogmios v7 WebSocket session. It recorded tip-before/tip-after around each address query.

Observed:
- PrizeValidator: **0 UTxOs** at the same address queried by Koios.
- B1 Pool: **1 UTxO**, the exact same out-reference `b84f...#0`.
- Pool value matches Koios: 5,000,000 lovelace, same singleton quantity, same 1,000,000,000 atomic direct-tUSDM quantity.
- Pool inline datum CBOR is byte-for-byte identical to Koios.
- BLAKE2b-256 over the shared CBOR bytes is `aadc3dd97c39464d779f6384584e9dc839f22df89e2d8aebb53e1e9379ba00a1`, matching Koios's datum-hash result.
- PrizeValidator tip stable at slot `138261834`; B1 Pool tip stable at the same slot and block hash `c28f239d1d3abf2195fc9090322c6bbd4028400c9515b83bef40e64e8d006d89`.

Koios observed slot `138261586`; Ogmios observed slot `138261834`, 248 slots later. These are two concordant observations at different tips, not one shared atomic snapshot. The Ogmios packet also labels the configured script address as a historical deployment candidate requiring reconciliation; the Koios runner independently derived the address from the checked-out scripts and matched it to the identity manifest.

Artifact: `immortal-cardano-preprod-context` (run artifact `13481991400`).

## 5. Oracle State liveness and freshness — same read-only campaign

The same workflow was extended to run the existing `preprod-oracle-state-liveness.mjs` observer against a separate copy of the historical identity manifests, so its refreshed observation packet does not mutate the inputs used by the ProtectedCapital census.

[Extended read-only Preprod census and Oracle liveness — run 42172705850](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42172705850) completed successfully on commit `b7f15034204b87c63c2400b969a9f11b8829110d`.

The observer found the exact configured Oracle State singleton still live at:
`fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`.

It decoded the live inline datum and compared its timestamp to the current Koios Preprod chain-tip block time:
- observation time (chain time): `2026-11-06T06:09:44.000Z`;
- timestamp encoded in datum: `2026-10-08T17:38:50.142Z`;
- quote age: `2,464,253,858 ms` (about 28.52 days);
- configured maximum age: `3,600,000 ms` (1 hour);
- freshness: **STALE**; `withinMaxAge=false`.

The observer explicitly records:
- `externalPriceSourceVerified=false`;
- `configuredPublisherTrustIndependentlyEliminated=false`;
- `sourceQualificationStatus=NOT_PROVEN_BY_DATUM_ALONE`;
- the observed quote shape is a configured fixed compatibility quote, not evidence of a verified external market-price source.

This establishes that the singleton/out-reference is still present and structurally decodable, but its quote timestamp is far outside its configured freshness window. The read-only job did not refresh or replace the Oracle datum, and it did not assert an external USD/USDM or ADA/USD source.

Artifact: `pre-rich-protected-capital-live-census-42172705850` (artifact ID `13481587687`).

## 6. Direct-USDM EV1–EV7 requalification — current exact source, no approval

[PRE-RICH Preprod EEV — Source Qualification Only, run 42173808916](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42173808916) completed **SUCCESS** on commit `5c66893db29ab62c16cdf0514e73afa210627e46`.

The existing read-only EEV workflow restored only the deployment/Oracle-State identity manifests, discarded the historical source-set, qualification and approved-qualification artifacts, then:
1. re-observed the exact Oracle State singleton and timestamp;
2. re-ran the live PrizeValidator/Pool census;
3. re-observed the exact live B1 Pool source UTxO;
4. regenerated the direct-USDM source-set;
5. regenerated the EV1–EV7 qualification against the exact current repository bytes;
6. verified artifact digests and that no deployment approval was created.

The resulting source-set is `OBSERVED_NOT_QUALIFIED`, with the expected direct-tUSDM asset and the same Pool out-reference `b84f...#0`. Its deterministic `direct-usdm-v1` derivation is:
- physical asset amount: `1,000,000,000` atomic units;
- ledger decimals: 6;
- conversion: `floor(atomicQuantity * 100 / 1,000,000)`;
- resulting amount: `100,000` IMMORTAL USDM subunits.

The regenerated qualification artifact reports:
- `status=qualified`;
- profile `PRE-RICH-EEV-USDM-DIRECT-V1-QUALIFICATION-v0.1`;
- all `EV1` through `EV7` mechanically verified against the current source references/digests;
- `deploymentApproval=null`;
- `deploymentApprovalStatus=PENDING`;
- evidence hash `febad35042d0c71c556f6225e3fdd0c00a4718809fb5e28750dfd096f8fed908`.

This is an exact-source, read-only qualification of the **direct physical tUSDM EEV profile only**. It does not authorize deployment or Issue, does not certify ProtectedCapital PA1–PA7, and does not qualify a USD/USDM market price. The same run again observed the Oracle State quote as `STALE` and `externalPriceSourceVerified=false`.

Artifact: `preprod-eev-qualified-source-5c66893db29ab62c16cdf0514e73afa210627e46` (artifact ID `13482152037`).

## 7. What the evidence establishes

At the observed times, two different Cardano query paths returned a concordant view for the exact queried addresses:
- no live UTxO at the configured/derived PrizeValidator address;
- one B1 Pool singleton at the same exact out-reference;
- matching Pool value and datum bytes;
- zero L1/L3 obligations in the Pool datum and item-ledger projection.

This is a bounded current-state observation. It does not prove historical emptiness or the completeness of every source that could contribute to ProtectedCapital.

## 8. Non-claims and remaining blockers

The following fields intentionally remain false in the Koios output:
- `deploymentManifestAuthorityCryptographicallyVerified=false`;
- `sourceCompletenessAuthorityVerified=false`;
- `providerAttestationVerified=false`;
- `providerSnapshotPinned=false`;
- `sameBackendSnapshotVerified=false`;
- `fullProtectedCapitalQualified=false`;
- `r7L6EmptinessProven=false`;
- `l2LifecycleProven=false`.

Consequently this observation does **not** certify:
- PA1–PA7 or the full ProtectedCapital perimeter;
- PA2 source exhaustiveness across every profile asset/commitment source;
- item-level provenance for SafetyCapital, ReserveProtection, or MandatoryFutureCosts;
- L2 Jackpot funding/lock/transition lifecycle;
- global/historical R7 L5 completeness or R7 L6 emptiness;
- a deployment-bound R1/Kc certificate.

The two-provider concordance improves confidence in the bounded address observation but does not provide provider signatures, a common pinned backend snapshot, or proof that the two services have independent underlying ledger backends.

USD/USDM Option B and the production Oracle price-source qualification remain separate blockers. The presence of physical tUSDM in the Pool must not be interpreted as a USD price, redemption guarantee, peg, or market conversion.

**Disposition:** first real PRE-RICH Issue remains **BLOCKED**. The live zero-ticket observation is now materially better evidenced, but admission still requires complete source/authority/viability evidence and deployment-bound R1/Kc certification.
