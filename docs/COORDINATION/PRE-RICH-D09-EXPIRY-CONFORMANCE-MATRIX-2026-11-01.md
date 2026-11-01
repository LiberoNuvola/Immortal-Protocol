# PRE-RICH D-09 Expiry Conformance Matrix

**Date:** 2026-11-01  
**Workstream:** Agent B — Cardano / transition conformance  
**Status:** TEST DESIGN — NOT IMPLEMENTATION, NOT A NORMATIVE AMENDMENT  
**Source branch at preparation:** `work/immortal-green-closure`

## 1. Purpose and authority boundary

This matrix translates the expiry cases already stated in the PRE-RICH decision/specification material into independently testable assertions. It does not add an expiry duration, accounting coefficient, state tag, beneficiary, output schema, or new economic rule.

Source reconciliation:

- **09 — Definitive Decision Register, D-09:** records expiry semantics as closed and enumerates UNRESOLVED → EXPIRED, REVEALED LOSS → EXPIRED, CLAIMABLE WIN → EXPIRED, and optional UNRESOLVED → HISTORICAL_REVEALED. It says that after `expiresAt` no transition may create/reactivate a claim, liability, or payment obligation.
- **T2 — Transition Conformance Specification v0.1, §G3:** gives the detailed EXPIRE contract primarily for unresolved tickets and requires ledger-verifiable, atomic accounting.
- **T2 §G4:** specifies `EXPIRED + LATE_REVEAL -> EXPIRED`; late reveal may preserve verifiable history, but cannot reopen a ticket, create a claim, increase pending liabilities, or alter a closed economic obligation.

The Decision Register's four-case matrix is broader than T2 §G3's unresolved-ticket example. D-09 is treated here as the explicit decision source; T2 G3/G4 supply transition/evidence requirements. This discrepancy is a documentation/profile mapping issue, not authority to change the economic semantics.

**Historical reveal is conditional.** D-09 permits it only if the historical policy is enabled. Its activation state was not established by this source inspection. Do not implement or enable a late-reveal path merely because its conditional case appears in this matrix.

## 2. Four required lifecycle cases

| Case | Required pre-state and time | Required postcondition | Accounting assertions | Current source status |
|---|---|---|---|---|
| E1 — Unresolved expiry | Ticket remains UNRESOLVED/Pending; EXPIRE validity lower bound reaches `expiresAt`. | Ticket is terminal/non-claimable; no continuing economic promise. | Release exactly the ticket's unresolved reserve `P`; decrement the unresolved ticket count exactly once; create no pending liability and make no payment. | Pending-only path exists in PrizeValidator, B1PrizePool and DApp builder. |
| E2 — Revealed Loss expiry | Ticket was revealed before expiry and the crystallized result is a loss; expiry is reached. | Ticket reaches terminal expired state; no claim is possible. | No liability is created or retained for the loss; do not release `P` from unresolved reserve again because Reveal already resolved that reserve. No payout. Any remaining state closure must follow existing canonical accounting; do not invent a new pool delta. | Not implemented in the inspected on-chain EXPIRE path. |
| E3 — Revealed Win, unclaimed at expiry | Ticket was revealed before expiry; a winning payout/liability was crystallized and remains unpaid; expiry is reached. | Ticket reaches terminal expired state; no subsequent Claim or payment is possible. | Release exactly the remaining unpaid crystallized liability once. Do not release unresolved reserve a second time. No payment to the owner and no recreated claim/liability. The authoritative remaining-liability value must come from the canonical on-chain state, not a caller-supplied assertion. | Not implemented in the inspected on-chain EXPIRE path; potential stranded liability. |
| E4 — Optional historical reveal after expiry | Ticket is already expired while unresolved; late reveal payload is otherwise valid; historical-only mode must be explicitly enabled by the applicable profile. | `EXPIRED + LATE_REVEAL -> EXPIRED`; historical information may be retained without reopening the ticket. | Economic effect is exactly zero: no pending liability increase, no claimability, no reserve/liability mutation that creates or maintains a promise, no payment. A winning historical outcome remains non-economic/non-claimable. | No late-reveal path in current Reveal validator; current validator rejects Reveal after expiry. Historical-mode enablement is unconfirmed. |

## 3. Cross-case negative and boundary tests

These are required for each applicable implementation path, not substitutes for the four positive cases above.

| Test ID | Attempt | Expected result |
|---|---|---|
| X1 | EXPIRE with validity lower bound before `expiresAt` | Reject; no state/accounting mutation. |
| X2 | EXPIRE exactly at the canonical expiry boundary | Accept only where the canonical finite validity interval reaches the boundary and the state-specific case is otherwise valid. |
| X3 | EXPIRE after a prior EXPIRE | Reject; no second reserve/liability release. |
| X4 | EXPIRE after CLAIM | Reject; paid obligation cannot be released again. |
| X5 | CLAIM with validity beyond expiry or after terminal EXPIRED state | Reject; no payment and no claim recreation. |
| X6 | Late Reveal LOSS after expiry (historical mode only) | If mode is enabled, retain history only and assert zero economic delta; otherwise reject under the configured profile. |
| X7 | Late Reveal WIN after expiry (historical mode only) | If mode is enabled, retain history only and assert zero economic delta; no claim or liability. Otherwise reject under the configured profile. |
| X8 | Claim attempt after late historical WIN | Reject; no payment, liability, or reopening. |
| X9 | Duplicate/concurrent EXPIRE attempts against the same ticket input | At most one ledger transition can consume the input; no double release. |
| X10 | Malformed/missing ticket or pool datum, wrong pool identity, wrong reserve/liability amount, or non-singleton transition | Fail closed; no successful transaction. |

Boundary convention must be tested against the finite Cardano validity interval, not wall-clock time supplied by an off-chain caller. The current validator helper permits a Claim validity upper bound `<= expiresAt` and requires EXPIRE lower bound `>= expiresAt`; keep those exact predicates unless a canonical source explicitly changes them.

## 4. Required evidence by layer

1. **Reference-model tests:** one positive and one or more negative twins for E1–E4, with E4 gated by an explicit historical-mode fixture. These tests demonstrate model assertions only.
2. **Validator-level tests:** exercise the actual PrizeValidator and B1PrizePool predicates together. Assert both ticket transition and pool datum/value changes. A unit test of an off-chain refinement helper is not validator conformance.
3. **Yaci/native-ledger trace:** construct and evaluate actual transactions for every implemented case; preserve transaction CBOR, UTxO before/after, protocol parameters, redeemers, execution units, and evaluation logs. The present EXPIRE Yaci trace is only a synthetic Pending-ticket fixture.
4. **Preprod evidence:** only after validators/profile are reviewed and deployed; use actual script references and UTxOs, then preserve signed transaction and observed ledger transition. Local Yaci evidence is not Preprod evidence.

For every positive transaction test, add a *negative twin* that changes one semantic element (wrong lifecycle state, wrong time bound, wrong accounting delta, wrong pool identity, duplicate input/output, or attempted payment/claim recreation) and prove that it fails before successful ledger acceptance.

## 5. Current implementation mapping

The inspected source at the preparation baseline has these limits:

- `plutus/PrizeValidator.hs::validateExpire` requires Pending status, zero payout, beacon Pending/Ready, expiry reached, one Prize input, no continuing Prize output, and exact unresolved reserve/count release.
- `plutus/B1PrizePool.hs` independently enforces the matching Pending-only TicketExpired pool transition.
- `src/gameFlow.ts` builds the Pending-ticket expiry transaction.
- `PRE-RICH/src/PreRichExpireRefinement.ts` and `src/__tests__/preRichExpireRefinement.test.ts` check the ticket-to-aggregate refinement for the unresolved reserve/count release only.
- `audit/cardano-integration/expire-ledger-trace.ts` is an explicitly synthetic/local-Yaci Pending-ticket trace.
- `poc/aiken-reveal-parity/lib/immortal/expire_transaction.ak` mirrors the Pending-only predicate.

Therefore E1 is implemented at the inspected source level, with separate evidence limits. E2/E3 are not implemented in those paths. E4 is conditionally described by D-09/T2, but current on-chain Reveal rejects after expiry and no historical-mode activation was verified.

## 6. Safe implementation sequence

1. Preserve current E1 behavior and its passing tests.
2. Confirm the active profile's historical-reveal setting; do not infer that it is enabled.
3. Define reviewed transition profiles for E2 and E3 from the canonical datum/accounting model. Explicitly identify the exact pool liability/reserve fields and prove they are released once, with no new payout.
4. If historical mode is enabled, specify an independently reviewable E4 path whose post-expiry economic state is unchanged. Do not weaken the existing Reveal validator or change V3 as a shortcut.
5. Implement each case atomically across PrizeValidator, B1PrizePool, DApp builder, reference-model tests, validator tests and ledger traces. Keep transaction-to-authorized-intent binding as a separate requirement.
6. Do not mark D-09 closed at the implementation/evidence layer until the relevant deployed ledger evidence exists.

**No runtime or normative change is contained in this matrix.**
