# PRE-RICH C1 Acquired-Point ProtectedCapital Census Contract v0.1

**Status:** NON-NORMATIVE EVIDENCE / IMPLEMENTATION CONTRACT — NOT A PA1–PA7 CERTIFICATE  
**Owner:** Agent A — PRE-RICH economics, EEV and admission  
**Branch baseline reviewed:** `work/immortal-green-closure` at `56cd5a4f42f30ca45627124c861024a62e9bd472` (2026-11-13)  
**Purpose:** Define the smallest safe next step for producing a coherent PrizeValidator ticket-population observation and reconciling it with B1/V3, reusing the existing census and acquired-ledger-state observer.

This document does not change the PRE-RICH V1 economics, the 500× normal-payout bound, R7, the B1/V3 datum or redeemer, Reveal, Issue admission semantics, Treasury categories, Genesis, or any deployment. It does not authorize a signature, transaction, funding action, or admission.

## 1. Current source baseline

The following implementation already exists and must be reused rather than recreated:

- `audit/cardano-integration/preprod-protected-capital-census.mjs`: read-only Koios census entry point; derives the configured PrizeValidator and B1 Pool topology, resolves datum bytes, and builds the item ledger.
- `relayer/koiosProtectedCapitalSourceCensus.js`: exact Koios pagination/content-range checks, duplicate/out-of-address rejection, asset/datum validation, page-response digests, and datum-hash verification.
- `PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts`: deterministic current PrizeDatum classification and L1/L3 reconciliation against B1.
- `audit/cardano-integration/preprod-ogmios-context.mjs`: existing Demeter/Ogmios v7 observer that acquires an exact ledger point, checks the acquired point, queries PrizeValidator and B1 Pool UTxOs while that state remains acquired, writes raw packets and SHA-256 digests, and releases the acquired state.
- `relayer/preprodIssueObservationReader.js`: current Issue reader; queries Counter, B1 Pool, V3 carrier and B2 control, but does not consume the PrizeValidator census or acquire all of those inputs at one common ledger point.

The Koios census provides useful pagination and datum-integrity evidence, but its tip-before/tip-after checks do not pin every paginated address query to one ledger snapshot. The Ogmios context observer has a stronger snapshot mechanism, but its currently configured Prize/Pool addresses are explicitly labelled historical candidates requiring revalidation, and its raw observations are not yet transformed into the C1 item ledger.

## 2. Contract objective

Produce one read-only evidence envelope in which the following are observed from the **same acquired Preprod ledger point**:

1. The complete current UTxO set at the deployment-verified PrizeValidator address.
2. The unique B1 PrizePool singleton and its datum.
3. The V3 economic-state carrier singleton and its datum.
4. The Counter singleton used by the Issue observation.
5. The B2 control singleton used by the Issue observation.

The PrizeValidator population is then classified by the existing `buildPreRichProtectedCapitalItemLedger` function. Its ticket-derived L1 and L3 quantities must reconcile exactly with the B1 Pool aggregates and the corresponding V3 aggregates at the same point.

The C1 observer remains separate from transaction construction and submission. Integrating its result into the production Issue admission is a later, separately reviewed boundary change; this contract does not authorize that integration or a new admission ABI.

## 3. Acquisition and source rules

### 3.1 Exact point acquisition

- Open one authenticated Ogmios v7 session to a configured Preprod node.
- Query `queryNetwork/tip`; require a valid non-negative slot and 32-byte block hash.
- Call `acquireLedgerState` for that exact point.
- Require the acquired acknowledgement and its point to match the requested slot and block hash exactly.
- Query `queryLedgerState/tip` and require it to match the acquired point.
- Perform every relevant UTxO query before releasing that same acquired ledger state.
- Release the state in a `finally` path. A failed release invalidates the evidence run.
- Do not replace the acquired point with a later tip, retry one address at a newer point, or combine address results from different acquisition sessions.

A canonical snapshot reference is:

`cardano:preprod:<slot>:<lowercase-block-hash>`

The acquisition point is the ledger-state identity. A local wall-clock timestamp is metadata, not a substitute for it.

### 3.2 Deployment identity

Before querying addresses, derive the PrizeValidator and B1 payment credentials from the exact current deployment artifacts and parameters. Compare those derivations with the current deployment manifest and any address configuration. Also bind the exact Pool singleton policy/name, V3 carrier singleton policy/name, Counter singleton identity, and B2 control singleton identity.

A manifest whose hash matches its own contents is integrity-checked, not thereby signer-authenticated. The current deployment identity loader explicitly returns `SELF_HASH_MATCH_NOT_SIGNATURE_AUTHENTICATION` and `manifestAuthorityCryptographicallyVerified=false`. Preserve this limitation in the packet; do not promote it to deployment authority.

Any address/script/policy mismatch, unreviewed manifest, stale deployment pin, missing singleton, or ambiguous singleton blocks the run.

### 3.3 Complete UTxO population

- Query the full UTxO set for the exact PrizeValidator address at the acquired point. If using separate per-address requests, each must remain inside the same acquired state.
- Verify every returned address equals the requested address; reject duplicate `txHash#outputIndex` references and malformed references.
- Preserve the raw provider response and its digest, the query method/parameters, the acquired point, endpoint/operator identity, software/API version where available, and the response count.
- Do not infer completeness from a zero-length array unless the provider query semantics and source authority establish that it is a complete address UTxO-set result at the acquired point.
- Require the B1 Pool, V3 carrier, Counter and B2 singleton rows to be unique by exact configured asset identity, not merely by address or datum shape.
- Preserve every unclassified PrizeValidator output as an explicit L6 blocker. Never discard an output because its datum is missing, malformed, unsupported or mismatched.

An acquired point proves temporal coherence of responses from that session; it does not independently prove provider honesty, address completeness, canonical deployment authority, or global R7 exhaustiveness.

## 4. Datum, identity and accounting derivation

For every PrizeValidator UTxO:

- Verify the address and payment credential against the re-derived PrizeValidator script identity.
- Preserve the exact out-ref, datum source (inline or datum-hash lookup), CBOR bytes, calculated datum hash and comparison result, and a SHA-256 digest of the evidence record.
- Decode the existing 23-field PrizeDatum schema without permissive fallback.
- Bind `pdTicketPolicy` to the deployment-derived Ticket policy, `pdTicketName` to the item identity, and `pdPrizePoolHash` to the exact B1 Pool script credential.
- Reject repeated Ticket identities, repeated out-refs, non-canonical ticket prices, invalid status combinations, non-exact unit conversion, malformed expiry fields and missing datum evidence.

Use the existing item-ledger classification, without inventing new categories:

| PrizeDatum state | R7 current-state classification | ProtectedCapital component |
|---|---|---|
| Pending, canonical price, zero payout | L3 | WorstCaseExposure = 500 × ticket face price |
| Revealed, BeaconReady, positive payout | L1 | CrystallizedLiabilities = exact payout |
| Revealed, BeaconReady, zero payout | L5 | none |
| Claimed, BeaconReady, positive payout | L4 | none |
| Unknown, malformed, mismatched or unsupported | L6 | blocks |

Ticket NFT custody is outside the PrizeValidator datum UTxO by design; the PrizeDatum records the obligation. Preserve this distinction and do not require the ticket NFT to be in the same UTxO as the PrizeDatum.

Reconcile exact integer totals:

- L1 payout sum against `ppPendingLiabilities`;
- L3 ticket face-price sum against `ppUnresolvedReserve`;
- L3 item count against `ppUnresolvedTicketCount`;
- computed L3 500× exposure against the canonical V3 class exposure and `WorstCaseExposure`;
- the Pool and V3 aggregate values at the same acquired point;
- the Pool physical configured tUSDM quantity against its datum `totalLiquidity` only under the exact direct-USDM Preprod profile. This quantity check is not a USD/USDM peg or market valuation.

Any mismatch or non-divisible RU/sub-unit conversion is a hard failure. Do not round or silently substitute an oracle price.

## 5. Evidence envelope

Recommended output schema:

`IMMORTAL-PREPROD-PROTECTED-CAPITAL-C1-ACQUIRED-POINT-v0.1`

Minimum fields:

- `network`, `providerId`, `operator/service identity`, `interfaceVersion`, `endpointIdentity`;
- `acquiredPoint`: slot, block hash, canonical snapshot reference, acquisition acknowledgement, pre-query and post-query point checks;
- `deploymentIdentity`: manifest digests, signature/authority status, re-derived script hashes, exact address bindings and all singleton policy/name identities;
- `queryEvidence`: method, exact requested addresses, response counts, raw-response digests and any provider completeness/attestation metadata;
- `rawUtxos`: all exact PrizeValidator, Pool, V3, Counter and B2 UTxO rows required for independent replay;
- `decodedItems`: exact PrizeDatum fields, datum bytes/hash evidence, Ticket identity, out-ref and R7 classification;
- `itemLedger`: existing L1/L3/L4/L5/L6 classification and reconciliation outputs;
- `crossChecks`: B1/V3 aggregate equality, unit conversion, direct physical tUSDM amount and explicit exclusions;
- `qualification`: separate booleans for same-point coherence, datum integrity, deployment authority, provider attestation, address-population completeness, item-ledger reconciliation, historical replay, L2 lifecycle, whole-profile PA1–PA7, and R7 L6 emptiness.

Every qualification must be derived from named evidence. Missing evidence is `false`/unknown and fail-closed, not an empty list or an implicit zero.

## 6. What this observation can and cannot certify

If all checks pass, this adapter can strengthen the **current live PrizeValidator ticket-population evidence** and its same-point reconciliation to B1/V3. It can support the L1/L3 part of a future C1 producer.

It cannot, by itself, certify:

- PA1/PA2: that all PRE-RICH assets and all possible protocol obligations are exhaustively mapped to R7 A1–A5/L1–L6;
- PA3: disjointness across ticket liabilities, Jackpot, SafetyCapital, ReserveProtection, MandatoryFutureCosts, treasury categories, and other commitment populations;
- PA4: independently sourced and governed valuations for all six ProtectedCapital components;
- PA5: closure of every Issue/Reveal/Claim/Expire/Jackpot/Treasury operation against the permitted R7 deltas;
- PA6: global L6 emptiness or an on-chain-verifiable completeness condition;
- PA7: adversarial exclusion of hidden/omitted commitments;
- consumed expiry/settlement history that no longer exists as a live UTxO;
- the lifecycle/source backing of a non-zero L2 LockedJackpot;
- authenticated provider authority merely because an endpoint is reachable or a response digest matches;
- R1/Kc/Ω, USD/USDM source qualification, EEV Deployment Approval, Registry authenticity, B2 on-chain binding, or Genesis authority.

In particular, a finite census of current PrizeValidator UTxOs cannot prove that no historical ticket was omitted or that no obligation was ever created outside the enumerated address. Historical transaction replay and a protocol-level completeness argument remain separate requirements.

## 7. Required adversarial tests

The adapter and packet validator must reject at least:

1. acquire acknowledgement with a different slot or block hash;
2. ledger tip mismatch before or after the query sequence;
3. release failure or a query executed after release;
4. Preprod address with wrong payment credential, staking credential or network;
5. manifest hash mismatch, missing signature/authority trust, or stale deployment pin;
6. missing, duplicate, malformed, or wrong-quantity singleton tokens;
7. duplicate UTxO out-refs or Ticket policy/name identities;
8. returned output at a different address;
9. missing/invalid datum bytes or datum-hash mismatch;
10. Pending with non-zero payout, Revealed without BeaconReady, invalid payout/state combinations, non-canonical ticket price, or non-exact RU conversion;
11. unclassified output, changed population count, independent-source disagreement, or any L1/L3/Pool/V3 reconciliation mismatch;
12. an artificial omission of a known UTxO between independent source captures, proving that the completeness check—not just the item-ledger arithmetic—fails.

The existing Koios tests remain useful for page-boundary, duplicate, datum-resolution and Content-Range failures. The new acquired-point fixtures must cover the Ogmios acquisition/session boundary and the conversion into the existing item ledger.

## 8. Admission and ownership boundary

The initial deliverable is a read-only evidence packet and deterministic tests. Do not wire it into `PreprodAuthoritativeIssueProvider` or change `readPreprodIssueObservation` as part of this contract. That production integration needs an explicit interface/authority review and an Agent B review of how a completeness witness is bound to the actual transaction body and on-chain precondition.

A signed off-chain assertion that a list is complete is not, by itself, proof that an on-chain validator has observed every UTxO at an address. If PA6 is to be an executable-state condition, its enforcement architecture must be separately specified and adversarially tested; do not treat this document or an RPC census as an on-chain proof.

## 9. Exit criteria for this bounded step

- [ ] Current deployment address/script/token identities revalidated against an authorized deployment record.
- [ ] PrizeValidator + B1 Pool + V3 carrier + Counter + B2 observed inside one authenticated acquired ledger state.
- [ ] Raw responses, point, queries and digests preserved.
- [ ] PrizeDatum census deterministically replayed through the existing item ledger.
- [ ] All L1/L3/B1/V3 cross-checks pass at the exact same point.
- [ ] Independent source / authority and completeness limitations explicitly carried in output.
- [ ] Negative tests demonstrate point, identity, omission, datum and accounting failures.
- [ ] Whole-profile PA1–PA7 remains OPEN until its distinct evidence obligations are independently satisfied.

**Disposition:** build the acquired-point C1 observation adapter first; do not redesign the 500× rule, create a Reserve backstop, alter V3/Reveal, or claim first-Issue qualification from a ticket census.
