# PRE-RICH E2/E3 Revealed-ticket Expiry — Existing Datum/Redeemer Transition Profile

**Date:** 2026-11-01  
**Owner:** Agent B — Cardano / transaction conformance  
**Status:** DESIGN RECONSTRUCTION — NO RUNTIME CHANGE  
**Inspected branch HEAD:** `3f8ceecf3da856248bf3a740fd3a8dcb300b157d`

## 1. Executive result

The existing on-chain datum and redeemer shapes already contain enough information to distinguish the two missing revealed-ticket expiry cases:

- `PrizeDatum.pdStatus` is `Pending | Revealed | Claimed`.
- `PrizeDatum.pdPrizeAmount` is the crystallized payout; a Revealed loss has zero and a Revealed win has a positive amount.
- `PrizeDatum.pdExpiresAt` is the ticket's immutable expiry boundary.
- `B1PrizePoolDatum` separately tracks `ppUnresolvedReserve`, `ppUnresolvedTicketCount`, and `ppPendingLiabilities`.

The existing redeemer constructors can also be reused without changing their constructor indices:

- `PrizeAction.Expire` is constructor index 3.
- `B1PrizePoolAction.TicketExpired` is constructor index 4.

Accordingly, E2/E3 do **not** inherently require a new datum field, new `PrizeStatus` constructor, or new redeemer constructor. The existing design consumes the PrizeDatum on expiry and leaves the ticket NFT independently held; no explicit `Expired` value is written to a continuing PrizeDatum.

This is a source-level transition reconstruction, not an authorization to implement it. It does not settle the optional E4 historical-record path.

## 2. Accounting already performed by Reveal

The inspected `IMMORTAL/kernel/EconomicKernel.hs` defines:

- `reserveRevealDelta(P) = -P`;
- `liabilityRevealDelta(W) = max(0, W)`;
- `reserveExpiryDelta(P) = -P`;
- `liabilityClaimDelta(W) = -max(0, W)`.

The B1 `TicketRevealed` branch requires a Pending PrizeDatum input and Revealed output, then updates the pool:
- unresolved reserve decreases by the ticket price (P);
- unresolved ticket count decreases by one;
- pending liabilities increase by the non-negative crystallized payout (W);
- total liquidity is unchanged.

Thus after a valid Reveal, the ticket is no longer represented in unresolved reserve/count. A later expiry of a Revealed ticket must not perform the Pending expiry release again.

## 3. E2 — Revealed Loss → expired

**Eligible input profile:** `pdStatus == Revealed`, `pdPrizeAmount == 0`, and the expiry lower validity bound reaches `pdExpiresAt`.

Expected transaction-level effects:
- consume exactly one PrizeDatum input;
- produce no continuing output at the PrizeValidator address;
- make no payment to the ticket owner;
- retain the ticket NFT independently, as the current expiry model allows;
- consume exactly one B1 PrizePool input and produce its singleton continuation.

Expected pool datum:
- `ppTotalLiquidity'` = `ppTotalLiquidity`;
- `ppPendingLiabilities'` = `ppPendingLiabilities`;
- `ppUnresolvedReserve'` = `ppUnresolvedReserve`;
- `ppUnresolvedTicketCount'` = `ppUnresolvedTicketCount`;
- all other pool datum fields unchanged.

Reason: Reveal already released the ticket price reserve and registered zero liability for the loss. E2 is terminal ticket-state removal, not a second reserve release.

## 4. E3 — Revealed Win, unclaimed → expired

**Eligible input profile:** `pdStatus == Revealed`, `pdPrizeAmount == W > 0`, the winning liability remains unpaid, and the expiry lower validity bound reaches `pdExpiresAt`.

Expected transaction-level effects:
- consume exactly one PrizeDatum input;
- produce no continuing output at the PrizeValidator address;
- make no payment to the ticket owner;
- consume exactly one B1 PrizePool input and produce its singleton continuation;
- retain the ticket NFT independently.

Expected pool datum:
- `ppTotalLiquidity'` = `ppTotalLiquidity` (no physical payout occurred);
- `ppPendingLiabilities'` = `ppPendingLiabilities - W`;
- `ppUnresolvedReserve'` = `ppUnresolvedReserve`;
- `ppUnresolvedTicketCount'` = `ppUnresolvedTicketCount`;
- all other pool datum fields unchanged.

Required fail-closed guard: `W > 0` and `W <= ppPendingLiabilities` before constructing the subtraction. The resulting datum must preserve the existing solvency invariant.

Reason: the crystallized obligation is extinguished, but no USDM has been paid out. This is not Claim. Claim pays (W) and decreases physical pool liquidity by (W); E3 does not.

No new economic parameter is introduced: (W) is read from the consumed PrizeDatum that the Reveal validator previously constrained.

## 5. Required cross-validator implementation shape

The following is the minimum consistent scope for a separately reviewed implementation:

### PrizeValidator

- Keep the existing Pending case byte-for-byte semantically intact.
- Add a Revealed case for expiry at/after the ticket boundary.
- For Revealed, accept zero payout (E2) or positive payout (E3), but reject Claimed.
- Require BeaconReady for the Revealed path.
- Consume one Prize input and require zero continuing Prize outputs, as the current expiry model does.
- Verify exact B1 output accounting for the selected case.
- Keep Claim's existing pre-expiry gate and owner/payment rules unchanged.

### B1PrizePool

Reuse the existing `TicketExpired` constructor index 4. Branch on the consumed PrizeDatum status:
- Pending: preserve the current exact `-P` unresolved reserve and `-1` unresolved count rule; keep liabilities and total liquidity unchanged.
- Revealed Loss: keep all accounting fields unchanged.
- Revealed Win: reduce only pending liabilities by the consumed PrizeDatum's positive payout; do not change total liquidity, unresolved reserve or unresolved count.
- Reject Claimed, unknown/inconsistent states, insufficient pending liabilities, and expiry before the boundary.

The current unconditional precondition `ppUnresolvedTicketCount > 0` cannot apply to E2/E3: after Reveal the count for that ticket has already been decremented and may legitimately be zero when no other unresolved tickets remain.

### DApp builder

The current `expirePrize` builder rejects every non-Pending PrizeDatum and always subtracts price from unresolved reserve/count. It must be made state-aware:
- retain the current Pending construction;
- for Revealed Loss, leave pool accounting fields unchanged;
- for Revealed Win, reduce pending liabilities by the crystallized payout only;
- in either Revealed case, do not require unresolved count or reserve to contain this already-resolved ticket's price;
- continue using the current expiry validity lower bound and existing reference-script path.

The DApp is a constructor, not the authority. PrizeValidator and B1PrizePool must independently enforce the same state-specific deltas.

## 6. Physical PrizePool value preservation — additional blocker

The existing `B1PrizePool.TicketExpired` branch validates datum fields but does not explicitly compare the physical input PrizePool `TxOut.value` with its continuing output value. The shared singleton-NFT check proves the pool authority token remains singleton; it does not prove that all USDM and ADA assets in the pool UTxO were preserved.

The current DApp builder passes the original `poolUtxo.assets` to the continuing pool output, but that builder behavior is not an on-chain guarantee. A malicious expiry transaction must not be able to preserve the datum's declared `ppTotalLiquidity` while diverting physical pool assets to another output.

Before E2/E3 is considered safe, the B1 on-chain expiry branch needs an explicit physical-value preservation predicate (exact input/output value equality for the PrizePool UTxO, unless a reviewed canonical fee/min-UTxO rule explicitly authorizes a difference). This requirement applies to existing E1 as well; it is not unique to the new cases.

## 7. Expiry-boundary predicate overlap

At this HEAD:
- Prize Claim uses a finite validity upper bound with `getPOSIXTime upper <= pdExpiresAt`.
- Prize Expire uses a finite validity lower bound with `getPOSIXTime lower >= pdExpiresAt`.
- Both helpers ignore the interval closure flag.

Therefore equality at `pdExpiresAt` satisfies both time predicates. Claim and Expire contend on the same Prize UTxO, so both cannot successfully consume the same input in competing ledger transactions; however the exact equality convention should be explicit in the canonical boundary tests. Do not silently change `<=` to `<` or `>=` to `>` in this implementation pass.

## 8. E4 remains separate and conditional

The current `PrizeStatus` has no `Expired` constructor and the existing Expire path consumes the PrizeDatum with no continuing output. After that transaction, there is no PrizeDatum UTxO to update with a later historical reveal.

If historical-only Reveal is enabled, a persistent history mechanism is needed (for example, a retained non-economic expired record or a separate history datum). This would be a distinct design/API/schema decision; it must not be improvised as part of E2/E3. The inspected Notion text makes historical reveal conditional, and Notion metadata returned `verification.state = unverified`; enablement and canonical authority remain unconfirmed.

## 9. Required positive and negative tests before implementation closure

- E2 loss at expiry: zero Prize continuation, pool datum unchanged, physical pool value unchanged, no owner payment.
- E2 loss before expiry: reject.
- E3 win at expiry: liability decreases exactly by PrizeDatum payout; pool liquidity/reserve/count unchanged; physical pool value unchanged; no owner payment.
- E3 win with insufficient pending liabilities: reject.
- E3 win before expiry: reject.
- E2/E3 attempted Claim after expiry or after successful expiry: reject/no Prize UTxO.
- E2/E3 duplicate expiry: reject because the Prize input has already been consumed.
- Claimed ticket expiry: reject.
- Wrong pool identity, multiple Prize inputs, missing/duplicate pool continuation, changed unrelated datum fields, changed physical pool value, or malformed payout: reject.
- Boundary twins at `expiresAt - 1`, exactly `expiresAt`, and `expiresAt + 1`, preserving the currently encoded interval convention until governance specifies otherwise.

Reference-model tests are not validator proof. Each positive/negative case must ultimately be exercised against the actual PrizeValidator and B1PrizePool together, followed by local-ledger evaluation and then deployment-specific Preprod evidence.

## 10. Safe disposition

- E2/E3 can be expressed with existing datum fields and redeemer constructor indices; a new datum or redeemer shape is not inherently required.
- The current validators and builder must be changed atomically and tested together.
- Add an explicit on-chain physical Pool UTxO value-preservation check before claiming expiry accounting is ledger-safe.
- Keep V3, Reveal, Issue/EEV, and Agent C/Materios untouched.
- Do not implement E4 until historical-mode enablement and the persistent history representation are explicitly confirmed.

**STATUS: E2/E3 ACCOUNTING RECONSTRUCTED FROM EXISTING FIELDS; CURRENT PENDING-ONLY VALIDATORS/BUILDER AND POOL PHYSICAL-VALUE GUARD REMAIN IMPLEMENTATION GAPS. NO RUNTIME CHANGE.**
