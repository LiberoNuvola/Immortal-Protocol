# PRE-RICH — ProtectedCapital Source Census & Item-Ledger Prototype

**Date:** 2026-11-02  
**Branch:** work/immortal-green-closure  
**Baseline HEAD:** e008a0322a88ede235a1f02dd496e7c2f8ed1671  
**Status:** STATIC REPOSITORY SOURCE CENSUS + FIXTURE PROTOTYPE — NOT A LIVE PREPROD CENSUS  
**Change class:** Documentation and fixture artifact only. No runtime code, economic constants, V3, Reveal, validators, workflows, deployment configuration, or on-chain state changed.

---

## 1. Executive result

The tracked source establishes useful accounting aggregates and local ticket lifecycle predicates. It does **not** yet provide a complete, authoritative, item-level source census for L1, L2, and L3.

The central finding is:

> The current Issue observation path reads the Counter, B1 PrizePool, V3 carrier, and B2 control singleton. It does not enumerate the PrizeValidator UTxO population. The V3 projection accepts a caller-supplied unresolved-ticket array and reconciles it to B1 reserve/count, but that reconciliation does not prove that the supplied array is the complete on-chain ticket population.

A first machine-readable ledger sample has been produced from the existing replay test fixture. It proves the arithmetic of the existing L3 projection on that fixture and explicitly records that the L1 aggregate is not itemized and that the L2 zero is fixture-only.

### Gate result

| Area | Census result | Qualification |
|---|---|---|
| L1 crystallized unpaid payouts | B1 aggregate exists; individual revealed-winning PrizeDatum census is not implemented in the Issue observation reader | **AGGREGATE ONLY / ITEMIZATION OPEN** |
| L2 conditional Jackpot | B1/V3 aggregates and state fields exist; current B1/V3 action sets do not implement an authorized Jackpot funding/lock/payout transition | **LIFECYCLE PROVENANCE OPEN** |
| L3 unresolved tickets | Projection validates caller-supplied Pending/BeaconReady item prices/count against B1 aggregates; no complete source enumerator is wired to it | **FIXTURE-RECONCILABLE / POPULATION COMPLETENESS OPEN** |
| L4 settled | Claim transition changes Revealed → Claimed and reduces the pending aggregate | **LOCAL TRANSITION EXISTS; HISTORICAL CENSUS NOT IMPLEMENTED** |
| L5 expired / extinguished | Losing Reveal moves L3 → L5; technical Expire consumes the PrizeDatum and releases the exact Pending reserve or Revealed Win liability | **LOCAL TRANSITIONS EXIST; CONSUMED-EXPIRY HISTORY SOURCE NOT IMPLEMENTED** |
| L6 empty | No all-source census exists to prove that no additional material commitment is omitted | **NOT PROVEN** |

**No actual Preprod ticket or liability identity was returned by this source audit.** Test IDs and fixture values are not live on-chain evidence.

## 2. Source inventory

### 2.1 B1 PrizeDatum contains the necessary per-ticket fields

The canonical PrizeDatum contains, among other fields:

- ticket policy ID and asset name;
- ticket price in USDM sub-units;
- crystallized prize amount in USDM sub-units;
- ticket lifecycle status (Pending, Revealed, Claimed);
- Beacon status and target;
- issuance and expiry timestamps;
- immutable ticket commitment and nonce.

Source: [plutus/Types.hs, PrizeStatus and PrizeDatum](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/Types.hs#L30-L148).

This is sufficient to define a candidate item identity as the pair (pdTicketPolicy, pdTicketName), with the datum's status and economic fields tied to the exact UTxO snapshot. It is not, by itself, an enumeration of all tickets.

### 2.2 L3: unresolved tickets

B1 defines ppUnresolvedReserve as the sum of unresolved ticket prices and ppUnresolvedTicketCount as the number of tickets in Pending/BeaconReady. The validator's TicketIssued path verifies one new Pending PrizeDatum, binds pdPriceUsdm to the redeemer, increments reserve by that exact price and count by one, and keeps total liquidity and pending liabilities unchanged.

Sources:
- [B1 datum accounting fields](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/Types.hs#L191-L218)
- [B1 TicketIssued transition](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/B1PrizePool.hs#L702-L790)
- [V3 projection input and reconciliation](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/src/PreRichCardanoObservationProjection.ts#L98-L130) and [projection checks](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/src/PreRichCardanoObservationProjection.ts#L252-L310).

The current TypeScript projection's observed ticket type contains only ticketId, priceUsdm, and status Pending | BeaconReady. It checks duplicate IDs, canonical ticket prices/classes, derived reserve, and count against the supplied B1 values. It does **not**:
- query the PrizeValidator address;
- discover all live PrizeDatum UTxOs;
- prove page/cursor exhaustion or source completeness;
- bind each supplied string ID to a live ticket NFT policy/name and exact UTxO reference;
- represent Revealed or Claimed tickets for L1/L4 accounting.

The current UI/game helper findPrizeUtxo queries UTxOs at a provided prize address but requires a known ticket policy/name and returns that one matching ticket. This is a point lookup, not a global census. The certified-ticket module also validates a selected wallet NFT against a supplied datum; it does not enumerate protocol-wide ticket state.

Sources:
- [src/gameFlow.ts, point lookup](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/src/gameFlow.ts#L292-L309)
- [PreRichCertifiedTicket.ts, selected NFT/datum binding](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/src/PreRichCertifiedTicket.ts#L1-L136).

**L3 finding:** the aggregation proof is conditional on the completeness and authority of input.tickets. Current code establishes internal consistency of the supplied array, not the completeness of the live ledger population.

### 2.3 L1: crystallized unpaid winning payouts

B1 documents ppPendingLiabilities as the sum of crystallized, unclaimed winning payouts. The Reveal validator path verifies the consumed Pending PrizeDatum and continuing Revealed PrizeDatum, preserves ticket identity, and increments pending liabilities by the exact pdPrizeAmount. The Claim path requires the input to be Revealed, checks the same ticket identity and payout, changes the continuing datum to Claimed, verifies payment, reduces physical Pool value, and reduces pending liabilities by the claimed amount.

The expiry path separately supports:
- Pending expiry: releases the exact ticket price reserve/count;
- Revealed Win expiry: releases the exact still-unpaid pdPrizeAmount liability;
- Revealed Loss expiry: no liability delta.

Sources:
- [B1 ppPendingLiabilities definition](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/Types.hs#L191-L207)
- [B1 Reveal](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/B1PrizePool.hs#L792-L885)
- [B1 Claim](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/B1PrizePool.hs#L886-L1037)
- [B1 Expire](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/B1PrizePool.hs#L1038-L1128).

The current Issue observation reader imports ppPendingLiabilities from the single Pool datum and reads the V3 carrier. It does not query the PrizeValidator address or return the set of individual Revealed-winning unpaid PrizeDatum items.

A future read-only census can derive candidate L1 rows from all live, valid PrizeDatum UTxOs at the exact configured PrizeValidator address:
- Revealed with positive pdPrizeAmount: candidate L1 until an exact Claim or valid Expire transition consumes/releases it;
- Revealed with zero payout: L3 → L5 extinguished right; no crystallized payout liability, although its PrizeDatum may remain live until technical expiry;
- Claimed: L4/history, not live L1;
- Pending or BeaconReady: L3, not L1.

Important: wall-clock passage beyond pdExpiresAt is not itself proof that the Pool liability has been released. Until the corresponding on-chain expiry transition is observed and the aggregate changes, an expired-but-still-live Revealed Win must not be silently removed from L1.

**L1 finding:** Pool aggregate semantics are explicit, but item-level membership and exact aggregate reconciliation are not implemented in the current Issue source reader.

### 2.4 L2: Jackpot

The B1 datum carries ppLockedJackpot and ppJackpotThreshold. But the current B1PrizePoolAction constructors are only:
- FundTreasury;
- TicketIssued;
- TicketRevealed;
- TicketClaimed;
- TicketExpired.

There is no JackpotFund, JackpotLock, or JackpotPayout action in this action type. The current B1 validator preserves ppLockedJackpot and ppJackpotThreshold across FundTreasury and each ticket transition; the field is not changed by these operations.

Sources:
- [B1 action type](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/Types.hs#L325-L363)
- [B1 transition preservation checks](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/B1PrizePool.hs#L655-L680), [TicketIssued](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/B1PrizePool.hs#L742-L760), [Claim](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/B1PrizePool.hs#L1000-L870), and [Expire](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/B1PrizePool.hs#L1008-L1022).

IMMORTAL V3 defines Jackpot status and cycle fields, but the current V3 action type contains only Issue, Reveal, Claim, and Expire. Those transitions do not implement a Jackpot lifecycle change. In the TypeScript B1-to-V3 projection, Jackpot status is inferred as locked when the scalar locked amount is positive and the cycle is hard-coded to zero. That is a projection convention; it is not evidence of a signed funding/lock transition.

Sources:
- [V3 Jackpot state](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/IMMORTAL/state/EconomicStateV3.hs#L52-L98)
- [V3 action and transitions](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/IMMORTAL/kernel/EconomicTransitionV3.hs#L15-L95)
- [B1-to-V3 projection](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/src/PreRichCardanoObservationProjection.ts#L294-L310).

The Game Economy document defines the intended state-derived Jackpot funding and exact-once payout semantics. That policy document does not supply the missing executable transition evidence in the current B1/V3 action sets.

**L2 finding:** a non-zero ppLockedJackpot can be observed as an aggregate, but current source does not establish its authorized creation, lifecycle, or exact-once transition into L1. Do not certify a candidate L2 item solely from the scalar.

### 2.5 Issue observation reader is not an item census

The current readPreprodIssueObservation queries exactly the Counter singleton, B1 PrizePool singleton, V3 carrier singleton, and B2 control singleton. It decodes their state and invokes an authenticated authority source for the remaining economic inputs. The function has no PrizeValidator address or ticket-policy argument and does not call utxosAt(prizeAddress).

Source: [relayer/preprodIssueObservationReader.js](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/relayer/preprodIssueObservationReader.js#L286-L380).

This distinction is important: the current provider's signed state/carrier binding can authenticate the exact observed aggregate state and decision references, but it does not itself establish the per-ticket membership that generated those aggregates.

The atomic Issue transaction proves that the Ticket NFT is sent to the buyer separately from the PrizeDatum output deposited at the PrizeValidator address. The census therefore keys the liability item by the immutable (pdTicketPolicy, pdTicketName) datum identity and the exact PrizeDatum UTxO reference. It does not expect an NFT in that script UTxO. Source: [src/mint.ts, atomic ticket delivery and PrizeDatum output](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/src/mint.ts#L1525-L1635).

### 2.6 No deployment identity supplied by tracked configuration

The tracked .env.example leaves the Preprod Blockfrost project ID, ticket policy ID, B1 Pool singleton identity, B2 address/identity, PrizeValidator reference address, authority endpoint, and direct-USDM unit empty. This is appropriate for secrets and deployment-specific values, but means the repository snapshot alone does not identify the exact deployed Preprod ticket and Pool sources.

Source: [.env.example](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.env.example#L1-L47).

No live chain query was made in this pass. No real ticket policy, PrizeValidator address, transaction reference, current slot, or Preprod Pool UTxO should be inferred from the test fixtures or the blank example configuration.

## 3. Atomic ledger prototype — fixture only

The machine-readable fixture is:

[PRE-RICH-PROTECTED-CAPITAL-ITEM-LEDGER-FIXTURE-2026-11-02.json](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/audits/fixtures/PRE-RICH-PROTECTED-CAPITAL-ITEM-LEDGER-FIXTURE-2026-11-02.json)

It uses the existing preInput() fixture from src/__tests__/immortal-cardano-replay.test.ts:

| Fixture record | Ticket price | R7 candidate | Worst-case exposure |
|---|---:|---|---:|
| ticket-1 / Pending | 100 USDM sub-units = 1 reference unit | L3 | 500 reference units |
| ticket-2 / BeaconReady | 200 USDM sub-units = 2 reference units | L3 | 1,000 reference units |
| ticket-3 / Pending | 300 USDM sub-units = 3 reference units | L3 | 1,500 reference units |
| **Total** | **600 sub-units = 6 reference units** | **L3** | **3,000 reference units** |

Fixture Pool aggregates:
- ppUnresolvedReserve = 600 sub-units; derived item sum = 600 — fixture reconciliation passes.
- ppUnresolvedTicketCount = 3; item count = 3 — fixture reconciliation passes.
- ppPendingLiabilities = 500 sub-units = 5 reference units — present only as an aggregate; no individual revealed-winning payout records exist in the fixture.
- ppLockedJackpot = 0 — zero in the fixture only; not a live Jackpot observation.

**Result:** the L3 arithmetic and aggregate reconciliation are reproduced. L1 itemization is missing, L2 lifecycle provenance is not demonstrated, and L6 emptiness is not proven. The fixture packet is therefore explicitly UNQUALIFIED_FIXTURE_ONLY.

The fixture labels ticket-1, ticket-2, and ticket-3 are not NFT asset names, transaction references, or actual Cardano ticket identities.

## 4. Read-only census acceptance conditions

Before the producer can issue a live item ledger, the read-only source reader must supply all of the following under one ledger snapshot boundary:

1. Exact network, network magic, observed slot/time, provider identity, and source freshness.
2. Exact PrizeValidator address derived from the deployed script parameters, ticket policy ID, and B1 Pool singleton policy/name.
3. Complete pagination/cursor exhaustion for all UTxOs at the PrizeValidator address, not just known ticket IDs or wallet UTxOs.
4. Exact PrizeDatum UTxO reference, raw datum digest, decoded 23-field PrizeDatum, and the immutable ticket identity carried in datum fields pdTicketPolicy/pdTicketName. The Ticket NFT is a separate buyer-held output in the atomic Issue transaction; it is not expected inside the PrizeValidator UTxO.
5. Explicit treatment of undecodable datums, missing inline datum/reference datum, non-ticket UTxOs, stale/equivocating provider responses, and duplicate identities; none may silently disappear from the census.
6. Full matching to the exact B1 Pool datum and V3 carrier snapshot; the ticket list, B1 aggregates, and V3 classes must all refer to the same observation boundary.
7. L1 reconciliation: sum of every live Revealed, positive, unpaid payout item equals ppPendingLiabilities, taking exact Claim and Expire transitions into account.
8. L3 reconciliation: Pending/BeaconReady identities, price sum and count equal B1 ppUnresolvedReserve and ppUnresolvedTicketCount; class counts and deterministic worst-case exposure agree with the PRE-RICH profile.
9. L2 remains unqualified until the Jackpot funding/lock/payout source transition is represented and independently verified.
10. Consumed expired records and settled historical records require transaction/history evidence. A current live UTxO scan alone cannot reconstruct the complete L4/L5 history.

All source errors, gaps, unclassified material records, and incomplete pages must produce an unqualified packet, never a fallback zero.

## 5. Precise next implementation boundary

The first source-reader implementation should be read-only and separate from Issue admission:

- enumerate PrizeValidator address UTxOs for one configured Preprod snapshot;
- decode and validate PrizeDatum identity/status/price/payout/expiry fields;
- produce candidate L1 and L3 rows with exact UTxO references and raw-data digests;
- reconcile L1/L3 row sums and counts to the exact B1 Pool datum;
- produce explicit INCOMPLETE for undecodable/unsupported/uncovered source records;
- emit the L2 scalar as AGGREGATE_ONLY / LIFECYCLE_NOT_PROVEN, not as a qualified item;
- preserve the raw source manifest and canonical packet digest for replay.

This reader must not write transactions, alter any datum, or submit any transaction. It must not modify V3, Reveal, the B1 validator, or the Jackpot semantics. A separate normative/implementation decision is required before creating an on-chain Jackpot transition.

## 6. Current conclusion

**L3:** arithmetic projection exists; global source census missing.  
**L1:** aggregate semantics and validator deltas exist; per-ticket payout census missing.  
**L2:** aggregate scalar exists; authorized funding/lock/payout transition not implemented in the current B1/V3 action sets.  
**L4/L5:** local terminal transitions exist; full historical source replay missing.  
**L6:** emptiness not proven.

**Live source census:** NOT PERFORMED.  
**Fixture atomic ledger:** CREATED / RECONCILED FOR L3 ONLY.  
**Live atomic ledger:** NOT QUALIFIED.  
**PA1–PA7:** NOT CERTIFIED.

No economic rule or parameter is changed by this report.


## 7. Implementation increment — pure ticket ledger

A pure, read-only builder has now been added:

[`PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts)

It consumes a caller-supplied PrizeValidator census and:
- validates the declared network/snapshot, Pool/PrizeValidator bindings, hashes, exact UTxO references, datum-embedded ticket policy/name identity, and duplicate ticket/UTxO identities;
- classifies live Pending/BeaconReady ticket records as L3 using the existing profile price ladder and 500× maximum normal payout multiplier;
- classifies live positive Revealed payouts as L1, even when the expiry timestamp has passed, until the exact on-chain Claim/Expire transition is represented;
- maps positive Revealed payouts to L1, losing Reveal (zero payout) to L5 per the item-level lifecycle contract, and Claimed payouts to L4; the losing PrizeDatum may remain live until technical expiry, while Expire consumes its PrizeDatum UTxO;
- reconciles L1 sum and L3 face-price/count against the supplied B1 Pool aggregate;
- treats positive `ppLockedJackpot` as aggregate-only, not certified L2, because lifecycle provenance is absent.

The function explicitly returns `sourceCompletenessAuthorityVerified: false`. It can test internal arithmetic and the consistency of caller-declared page/count metadata; it cannot verify provider pagination, source completeness, cryptographic attestation, or whether a caller omitted an unseen UTxO. `fullProtectedCapitalQualified` and global L6 emptiness remain false by construction.

Adversarial tests were added:

[`PC-item-ledger-source-census.conformance.test.ts`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/tests/conformance/PC-item-ledger-source-census.conformance.test.ts)

The 15 Vitest cases cover L1/L3 reconciliation, expired-by-clock but still-live L1, incomplete pagination, unclassified source outputs, L1 aggregate mismatch, duplicate logical identity, duplicate UTxO reference, datum policy mismatch, positive Jackpot without transition proof, snapshot mismatch, non-canonical prices, invalid Beacon lifecycle status, losing Reveal → L5, and exact fractional-payout handling. The 18 Node tests cover Preprod endpoint selection, provider page totals, missing/changed Content-Range, changed tip, address mismatch, invalid/duplicate asset rows, duplicate UTxO references, DatumHash resolution, and missing datums.

**Execution status at this audit baseline:** the pure builder tests were authored but not yet run. The provider-specific reader and dedicated test workflow were added later; see §8. No live Preprod source census has been performed.

**Next bounded task at this audit baseline:** implement a separate provider-specific, read-only PrizeValidator address enumerator. This was advanced by the follow-on implementation in §8, but live source authority and certification remain open.


### 7.1 Exact sub-unit preservation at the L1 bridge

The PRE-RICH payout-unit conformance artifact explicitly defines 1 USDM = 100 sub-units and confirms that a valid tier-2 payout is 250 sub-units = 2.5 USDM. The B1 PrizePool monetary fields are also denominated in USDM sub-units.

Sources:
- [PRE-RICH payout unit conformance](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/docs/PAYOUT-UNIT-CONFORMANCE.md)
- [B1 monetary datum units](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/plutus/Types.hs#L180-L218)
- [Current PRE-RICH projection conversion](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/src/PreRichCardanoObservationProjection.ts#L240-L310)

The item-ledger builder therefore preserves every payout amount exactly in USDM sub-units and never rounds or truncates an individual L1 item. Its reference-unit projection is nullable:
- one unpaid 2.5-USDM payout remains exactly 250 sub-units; its aggregate cannot be represented as a whole reference unit, so the builder reports a blocking conversion finding rather than truncating it to 2;
- two unpaid 2.5-USDM payouts remain two exact 250-sub-unit items; their aggregate is 500 sub-units = 5 reference units and is exactly representable as an aggregate.

This reveals an existing interface boundary, not a new economic rule: a non-integral-USD L1 aggregate cannot currently be projected into the V3 reference-unit integer without an explicit, governed unit treatment. The builder preserves the source amount and blocks the lossy bridge. No change was made to the existing projection or V3 kernel.

The test suite at this point included both fractional-payout cases. The current item-ledger suite totals **15 Vitest tests authored** and the provider reader totals **18 Node tests authored**; neither suite is declared passing until an exact-head Actions run is verified.


## 8. Follow-on implementation — shared Koios Preprod source census

The canonical provider enumerator and PrizeValidator/Pool census are the shared implementation already present on this branch:

- [`relayer/koiosProtectedCapitalSourceCensus.js`](../../relayer/koiosProtectedCapitalSourceCensus.js)
- [Provider pagination / snapshot / datum provenance tests](../../relayer/koiosProtectedCapitalSourceCensus.test.js)
- [Integrated Preprod ProtectedCapital census](../../audit/cardano-integration/preprod-protected-capital-census.mjs)
- [ProtectedCapital item-ledger builder](../../PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts)
- [Dedicated test workflow](../../.github/workflows/pre-rich-protected-capital-ticket-census.yml)

The shared provider:

1. Enumerates the PrizeValidator and B1 Pool addresses within one Preprod tip snapshot.
2. Requires exact numeric Content-Range totals, reconciles every page/offset, detects changed totals and duplicate UTxO references, and fails closed on incomplete pagination.
3. Resolves datum hashes through Koios datum_info while retaining datum-source and digest provenance.
4. Reads the tip before and after the scan and rejects a changed snapshot.
5. Emits a canonical source manifest and digest.

The integrated census derives the PrizeValidator and Pool topology from the current deployment scripts/configuration, checks the Pool singleton, decodes the 23-field PrizeDatum and eight-field Pool datum, and feeds the exact records into the existing pure item-ledger builder. It retains unclassified outputs and raw source rows.

**Non-certification remains deliberate:** the manifest sets provider attestation/authority to unverified. A stable tip and exact pagination totals are provider evidence, not independent proof that the provider returned every ledger UTxO. The output explicitly keeps full ProtectedCapital qualification, PA1–PA7, L2 lifecycle, and global R7 L6 emptiness unproven.

The dedicated workflow runs:
- Node's native test runner for the shared Koios provider tests;
- Vitest for the item-ledger source-census conformance suite.

**Execution status:** the workflow definition is committed, but no successful Actions result has yet been verified for the latest workflow revision. Do not claim the tests passed until an exact-head run completes.

**Live source census:** not performed in this documentation update. The current observer expects deployment environment values (oracle publisher/state identity and B1 Pool singleton identity) and uses the deployment topology it derives. No identifiers or live authority were inferred from fixtures. The recovered historical EEV deployment artifact is a separate, dated observation and must be revalidated before Issue admission.

No V3, Reveal, validator, Kernel, economic parameter, B2, Issue-admission, deployment, or on-chain state was changed by this documentation correction.


## 9. R7 lifecycle correction and provider observation boundary

### 9.1 PrizeDatum versus Ticket NFT custody

The canonical mint flow creates two separate outputs in one atomic sale:
- a datum-only PrizeValidator output containing the PrizeDatum;
- a Ticket NFT output delivered to the buyer.

Consequently, the PrizeValidator census uses (pdTicketPolicy, pdTicketName) as the stable logical identity from the PrizeDatum, alongside the exact datum UTxO reference and digest. It does not search for or require the NFT in that UTxO. The pure ledger labels this custody boundary OUTSIDE_PRIZE_VALIDATOR_UTXO.

Source: [src/mint.ts](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/src/mint.ts#L1525-L1635).

### 9.2 R7 transition mapping retained by the item ledger

The source-derived item mapping is:
- Pending / BeaconReady: L3, valued using the existing 500× exposure rule.
- Revealed with positive payout: L1 until exact Claim or valid Expire is observed. Reaching pdExpiresAt by wall-clock alone does not release the liability.
- Revealed with zero payout: L3 → L5 (losing Reveal extinguishes the economic right). The PrizeDatum can still be present in the live PrizeValidator UTxO set until technical expiry; this is not an L1 liability and is not mislabeled as a Claim/L4 settlement.
- Claimed with positive frozen payout: L1 → L4.
- Expire: consumes the PrizeDatum UTxO. The resulting L5 historical event cannot be reconstructed from a live PrizeValidator-address scan; it requires transaction-history/replay evidence.

The builder and its test suite now preserve this distinction. A live scan can include a losing Reveal datum classified to L5, while a ticket removed by Expire is absent from the live source population. The census therefore cannot claim global L5 history completeness.

### 9.3 Koios API implementation and limitations

The shared reader uses the official Preprod Koios endpoint (https://preprod.koios.rest/api/v1) and PostgREST pagination:
- POST /address_utxos with explicit limit and offset;
- Prefer: count=exact;
- numeric Content-Range checks on every page;
- stable ordering and duplicate-reference checks;
- bounded datum_info batches for DatumHash-only outputs;
- response-page and datum-content digests in the local source manifest;
- tip hash/slot/block-number check before and after both address scans.

Koios's official API documentation states that it is a decentralized/elastic REST query layer and documents offset/limit pagination, a maximum page size of 1,000 rows, and Content-Range behavior. See [Koios API documentation](https://www.koios.rest/api.html) and [Cardano Developer Portal — Koios Preprod endpoint](https://developers.cardano.org/docs/get-started/koios/).

**Important confidence boundary:** the manifest explicitly records:
- providerAttestationVerified = false;
- datumBytesAvailableForAll = true only when every scanned output includes datum bytes;
- datumHashComparisonsVerified = true only when all datum bytes are available and every output that has a datum_hash matches the locally recomputed BLAKE2b-256 hash; inline datum outputs without an on-chain datum_hash are recorded separately as not applicable;
- providerSnapshotPinned = false;
- sameBackendSnapshotVerified = false;
- consistencyAssessment = TIP_STABLE_BUT_NOT_QUERY_PINNED.

The before/after tip check only proves the reported tip did not move during the scan. Exact PostgREST page counts and local hashes do not cryptographically prove that every request was served from one pinned backend snapshot or that a distributed provider did not omit an output. The manifest digest is a local integrity digest, not a provider signature or independent completeness certificate. The reader recomputes the Cardano Plutus datum hash as BLAKE2b-256 over returned CBOR bytes wherever the UTxO carries a datum_hash. The Koios /datum_info response uses the response field hash and bytes; the reader accepts that documented shape and compares the CBOR hash with the requested UTxO datum_hash. For CIP-32 inline datums the output carries the datum itself instead of a datum-hash reference, so the CLI accepts the inline bytes as inline content and records INLINE_DATUM_HASH_NOT_APPLICABLE rather than demanding a missing datum_hash. For hash-reference datums, the CLI fails closed unless BLAKE2b-256 matches. These checks verify the content/hash relation where an on-chain datum hash exists; they do not authenticate the provider's address enumeration or pin all requests to one backend snapshot.

### 9.4 Execution boundary and status

The integrated runner is:

[audit/cardano-integration/preprod-protected-capital-census.mjs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/cardano-integration/preprod-protected-capital-census.mjs)

It derives the script topology from deployment configuration, scans the PrizeValidator and B1 Pool addresses, parses the singleton Pool datum and individual PrizeDatums, retains unclassified outputs, feeds the pure builder, and writes a local evidence packet. It is read-only and contains no transaction construction/signing/submission path.

Required deployment-specific values remain external environment configuration. This pass did not run the CLI against Preprod, did not obtain a real live census, and did not produce a provider signature. The test workflows are committed, but an exact-head successful Actions result has not been verified in this session.

**Current status:** provider-specific enumeration and runner IMPLEMENTED; test suites AUTHORED and wired to CI; live Preprod scan NOT EXECUTED; provider completeness/authenticity NOT PROVEN; L2 lifecycle OPEN; full ProtectedCapital and PA1–PA7 NOT CERTIFIED.


## 10. Agent A execution follow-up — 2026-11-02

### 10.1 Canonical item-ledger conformance corrections

The first exact-head census workflow exposed two independent test/runtime defects:

- `PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts` called `referenceUnitsIfRepresentable` without defining it. The helper is now present and returns `null` for a non-integral reference-unit conversion while retaining the original USDM subunit amount. This matches the existing conformance contract: one 2.5 USDM payout remains exact in subunits and is not rounded; two fractional payouts can be aggregated if their exact sum is representable. No economic formula or parameter changed. Fix commit: `d97b0188f97cc59ef6c244aaffefc6a9e2925bda`.
- `relayer/koiosProtectedCapitalSourceCensus.test.js` invoked `test()` before initializing the `node:test` binding. Imports were moved before the first test declaration. Fix commit: `17e29b4c9f033322811e24ba0cfb9b9e73d51f95`.

The latest visible test workflow is run [41405446327](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41405446327), on commit `17e29b4c9f033322811e24ba0cfb9b9e73d51f95`. At the time of this update the job is still queued; no successful test result is claimed. Earlier failures were attributable to the two defects above.

### 10.2 Read-only exact B1 Pool observation

The existing authenticated Demeter/Ogmios v7 context observer was extended to query the historical B1 PrizePool address in the same read-only WebSocket session as the network context and wallet observation. It writes the raw Ogmios UTxO response, normalized output references/values/datums, a SHA-256 digest, and tip-before/tip-after values. The observer also compares the two complete tip responses and explicitly checks whether the historical candidate out-reference `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0` is present.

Relevant commits:
- `7a4f7bfc327e25378ffe19c8f6c381e7d1a69716` — add B1 Pool query;
- `a12d6d89c814cf38bd680d0f16e549ccf31007bb` — bind the historical candidate address in the workflow;
- `4b58920fdeb6b14a322c2ecf8821a1d595264fd5` — correct newline serialization;
- `3bb4fb9bf5e6c4331490f4e38fec493baf7f346e` — compare full tip responses and bind the exact historical out-reference.

The exact-head observer workflow is [run 41405789774](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41405789774), on commit `3bb4fb9bf5e6c4331490f4e38fec493baf7f346e`. It is pending with no job/artifact yet. A previous run was cancelled before producing an artifact. Consequently, **no fresh Demeter B1 Pool UTxO observation has yet been obtained**. The 2026-10-21 EEV artifact remains historical and requires live revalidation.

A Cardanoscan address view and the historical funding transaction provide corroborating explorer evidence only; they do not establish the current exact UTxO, its datum, the current direct-tUSDM quantity, provider completeness, or EEV approval.

### 10.3 B2 deployment identity remains unmaterialized

The B2 Preprod deployment workflow was inspected. No `b2-control-deployment.json` artifact is present. Historical executions did not deploy B2:

- run `37967057715`: failed during dependency installation because `libblst-dev` was unavailable; deployment steps did not run;
- run `37967535347`: cancelled;
- run `37972119553`: failed before seed UTxO selection because `BLOCKFROST_PROJECT_ID` was missing; deployment steps did not run.

Therefore B2 control address, policy ID, singleton unit, state out-reference, and deployment transaction remain **unknown/unverified**. The configured token name is not a deployment witness. Do not synthesize B2 identifiers from the deployment script or environment naming.

### 10.4 Current certification boundary

- B1 deployment identifiers: historically recovered, live Pool state **not yet revalidated**.
- B1 direct-USDM EEV: historical qualification exists, but current UTxO/quantity/snapshot approval **not refreshed**.
- B2 deployment: **not evidenced as deployed**; exact identity missing.
- ProtectedCapital item ledger: two CI defects corrected; exact-head CI **pending**, not yet passed.
- Provider enumeration: implementation and datum-hash verification exist, but provider completeness/authenticity and same-backend query pinning remain **unproven**.
- Full PA1–PA7, L2 lifecycle evidence, global R7 L6 emptiness, and full ProtectedCapital qualification remain **open**.

No V3, Reveal, validator, kernel, consumer, economic parameter, Materios/B3, or on-chain state was changed in this follow-up.


## 11. CIP-32 inline datum and Koios datum_info schema correction

The PrizeValidator and B1 Pool contract outputs are created with inline datums. Under CIP-32, a transaction output's datum field is either a hash reference or the actual inline Plutus Data; an inline datum is not required to carry a separate datum_hash. Therefore a source reader that demands a datum_hash for every inline output would reject valid contract UTxOs.

The Koios source reader and CLI now distinguish:
- hash-reference output: datum_hash is present; datum_info resolves the CBOR bytes; BLAKE2b-256 is recomputed and must match;
- inline-data output: inline_datum.bytes is present; the CBOR bytes are locally hashed for the evidence record, but the comparison with a separate on-chain datum_hash is explicitly not applicable;
- missing/unknown data: retained as MISSING or unclassified and rejected by the integrated parser when it concerns a required PrizeDatum or B1 Pool.

The Koios datum_info response's documented datum hash field is `hash`, alongside `bytes`; the reader now parses that field (retaining datum_hash as a compatibility fallback). The test mock now uses the documented `hash` key.

The source manifest digest includes the following derived metrics:
- `datumBytesAvailableForAll`;
- `datumHashComparisonsVerified`;
- `datumHashComparisonRequiredCount`;
- `datumHashMismatchCount`;
- `inlineDatumWithoutHashCount`.

The integrated CLI requires bytes for every parsed PrizeDatum/Pool datum. If a datum_hash exists, its BLAKE2b-256 comparison must pass. If datum_hash is absent, the source must identify the row as a true inline datum with status `INLINE_DATUM_HASH_NOT_APPLICABLE`.

Sources: [CIP-32](https://cips.cardano.org/cip/CIP-0032) and [Koios datum_info response schema](https://pkg.go.dev/github.com/cardano-community/koios-go-client/v3#DatumInfo).


## 12. Independent read-only Ogmios corroboration path

The existing authenticated Preprod context workflow has been extended rather than creating a competing census implementation:

- Script: [`audit/cardano-integration/preprod-ogmios-context.mjs`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/cardano-integration/preprod-ogmios-context.mjs)
- Workflow: [`.github/workflows/immortal-cardano-preprod.yml`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/immortal-cardano-preprod.yml)

The `preprod-context` job already connects to Demeter's authenticated Ogmios v7 Preprod endpoint. It now queries `queryLedgerState/utxo` for the PrizeValidator address in the same WebSocket session as the wallet and B1 Pool context, and records:
- raw Ogmios UTxO response;
- normalized output references, values, datums, datum hashes and reference scripts;
- reported tip before and after the PrizeValidator query;
- SHA-256 of the raw evidence packet and a text summary;
- explicit address provenance `HISTORICAL_DEPLOYMENT_CANDIDATE_REVALIDATION_REQUIRED`.

The address configured for this observation is the historical PrizeValidator address recovered by Agent A from the 2026-10-21 deployment artifact. It is not represented as the current active deployment. The workflow's verification step checks that the packet exists, its SHA-256 sidecar verifies, schema/address-provenance markers match, the returned UTxO count equals the exact identified-reference count, and the reported tip is stable. The observer validates each output reference as a 32-byte transaction hash plus non-negative output index and rejects any row whose returned address differs from the queried PrizeValidator address. It records datum/datumHash presence counts without pretending to classify or qualify the source population. The script fails the read-only observation job on malformed/mismatched UTxO rows or a changed tip after preserving the diagnostic packet.

This Ogmios query is a **single-address, same-session corroborating observation**, not a replacement for the Koios paginated enumerator and not a provider completeness certificate. It does not prove that the historical address is still the current PrizeValidator; that must be reconciled against the current deployment manifest. It also does not independently certify a common pinned ledger snapshot across all earlier/later workflow queries.

**Execution status:** workflow/script changes are committed and push-triggered, but no artifact from the new PrizeValidator Ogmios query has been verified in this session. Historical identifiers remain candidates until the workflow produces a fresh artifact and the deployment binding is reconciled.

## 13. Current exact-head CI evidence boundary

The dedicated census workflow run **41405446327** completed successfully:
- `source-census-tests` job — SUCCESS;
- `Run Koios provider pagination and provenance tests` — SUCCESS;
- `Run ProtectedCapital item-ledger conformance tests` — SUCCESS.

The run's recorded source head is `17e29b4c9f033322811e24ba0cfb9b9e73d51f95`. The current working branch is **19 commits ahead** of that tested head. Consequently this is a valid green result for the exact historical test head, not proof that all subsequent provider/inline-datum/Ogmios edits have passed. No successful Actions result for the current latest head has been verified. The current code should be treated as **TESTED ON PRIOR HEAD; CURRENT-HEAD CI PENDING**.

No live PrizeValidator census has yet been generated by either provider in this session. The Koios CLI remains unexecuted with the external deployment environment, and the Ogmios corroboration workflow has not yet supplied its new PrizeValidator artifact.
