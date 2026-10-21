> **AUDIT / CONFORMANCE MATRIX — NON-NORMATIVE.** This document tracks implementation and evidence against canonical sources; it does not create protocol semantics.

# IMMORTAL / PRE-RICH — Constitution & Conformance Gap Matrix

**Status:** OPERATIONAL / NON-NORMATIVE  
**Repository reference:** `work/immortal-green-closure`  
**Role:** implementation/conformance tracker subordinate to the canonical Constitutions and specifications.

> This document does not define protocol semantics. It records gaps against them.

## 1. Canonical authority

Primary authority is external to this matrix:

- `docs/00-normative/01_CONSTITUTION_FINAL.md`
- `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md`
- `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md`
- `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md`
- `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md`
- `Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md`
- `PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md`
- `PRE-RICH/docs/GAME-ECONOMY.md`
- `PRE-RICH/docs/ECONOMIC-ALGORITHM.md`
- `PRE-RICH/docs/CONFORMANCE.md`

The matrix cannot supersede any of them.

## 2. Status legend

| Status | Meaning |
|---|---|
| CLOSED | semantic/normative rule is settled |
| CLOSING | settled rule with proof, implementation or conformance work remaining |
| IMPLEMENTATION GAP/FAIL | implementation contradicts or omits a settled rule |
| EVIDENCE GAP | evidence is incomplete |
| TARGET | future architecture |
| HISTORICAL CLOSED | retained for traceability, not current authority |
| OPEN DECISION | genuine normative choice remains |

`IMPLEMENTATION GAP/FAIL` never means `OPEN DECISION`.

## 3. Canonical baseline to protect

The gap tracker must never rewrite the following as proposals:

| Requirement | Semantic status | Conformance status |
|---|---|---|
| KA=8, KC=4, KD=4 | CLOSED | CLOSING / evidence |
| Hysteresis semantic/structural rule | CLOSED | numerical/implementation/evidence CLOSING/OPEN |
| Ladder 1/2/3/5/10/25/50/100 USDM | CLOSED | CLOSING |
| Genesis = 1 USDM | CLOSED | CLOSING |
| PRE Treasury bootstrap >= 4000 USDM | CLOSED | CLOSING |
| Maximum normal payout 500×P | CLOSED | CLOSING |
| Liability-first accounting | CLOSED | CLOSING |
| ProtectedCapital | CLOSED | CLOSING |
| `RawSurplus=max(0, EEV-ProtectedCapital)` | CLOSED | CLOSING |
| CurrentActiveClass contraction | CLOSED | CLOSING |
| HighestClassEverActivated monotonicity | CLOSED | CLOSING |
| Expiry finality | CLOSED | CLOSING |
| Jackpot isolation/protection | CLOSED | CLOSING |
| `NewJackpot <= RawSurplus` | CLOSED | CLOSING |
| Jackpot payout <= LockedJackpotLiquidity | CLOSED | CLOSING |
| Ticket identity/transferability | CLOSED | CLOSING |
| Voluntary burn / CLAIM != BURN | CLOSED | CLOSING |
| Sale atomicity | CLOSED | CLOSING |
| Treasury → PrizePool invariants | CLOSED | CLOSING |
| Settlement-value preservation | CLOSED | CLOSING |
| Reveal → result → crystallization | CLOSED | CLOSING |
| Crystallized payout immutability | CLOSED | CLOSING |
| Jackpot selection/reset/liability | CLOSED | CLOSING |
| Liveness boundary | CLOSED | CLOSING |
| Verified multi-asset conversion | CLOSED | CLOSING |

## 4. True normative OPEN set

After reconciliation with the latest Decision Register and PRE-RICH policy closure, only the following remains an active normative `OPEN DECISION`:

No current PRE-RICH policy item remains in the normative OPEN set. The expiry mechanism is closed; exact V1 numeric bounds are application/deployment parameters.

The following are **CLOSED at the current PRE-RICH policy level** and must not be reintroduced as open decisions:
- Jackpot payout mode = full current locked-balance payout exactly once.
- Future Jackpot allocation = no fixed allocation rate; any future change is a new PRE-RICH policy decision rather than a current unresolved choice.
- Jackpot activation mechanism = current active class = highest class ever activated at the top class, with the existing activation/suspension predicates.

KA/KC/KD and hysteresis are **not** in the normative OPEN set.

## 5. Gap register

| Area | Current gap | Classification | Required treatment |
|---|---|---|---|
| Hysteresis | numerical derivation/parametrization | CLOSING | derive/validate without changing semantic rule |
| Hysteresis | on-chain enforcement | IMPLEMENTATION GAP / CLOSING | implement against canonical semantics |
| Hysteresis | conformance evidence | EVIDENCE GAP | produce reproducible evidence |
| KA/KC/KD | quantitative robustness validation | CLOSING | validate the canonical baseline |
| KA/KC/KD | implementation | IMPLEMENTATION GAP / CLOSING | enforce `8/4/4` and their roles |
| KA/KC/KD | evidence | EVIDENCE GAP | produce conformance evidence |
| SALE | atomic payment/reservation/issuance | IMPLEMENTATION GAP / CLOSING | prove atomicity |
| REVEAL | deterministic result and crystallization | CLOSING | complete parity/proof |
| EXPIRY | finality / late-reveal non-claimability | CLOSING | prove transition behavior |
| CLAIM | frozen payout and once-only liability transition | CLOSING | prove current path |
| Multi-asset | verified conversion enforcement | CLOSING | validate identity, price, freshness, decimals, rounding, min-UTxO and rejection |
| Jackpot | lifecycle/accounting enforcement | CLOSING | prove isolation, funding, selection, reset and liability rules |
| Liveness | permissionless/event-driven execution | CLOSING | verify triggerability and safe stall behavior |
| ISSUE settlement builder | Treasury output amount is still requested as fixed `TICKET_PAYMENT_LOVELACE`; no price-derived construction/final-body settlement equality evidence | IMPLEMENTATION GAP/FAIL | Block predeploy; derive a supported settlement quantity from authenticated references and verify the completed Treasury output against the canonical integer valuation |
| Oracle asset coverage | `OracleDatum` carries one asset quote and the Issue MintPolicy is bound to one Oracle State singleton; token+ADA baskets do not have demonstrated simultaneous quote coverage | IMPLEMENTATION GAP/FAIL | Do not claim ADA/NIGHT/PRE or basket settlement support until the quote-set/reference contract and supported asset profile are implemented and tested |
| Settlement conversion precision | `totalUsdmValue` applies ceiling division per nonzero asset; equality is in the integer conversion domain, not automatically unrounded rational equality | EVIDENCE / CONTRACT GAP | Preserve the current rule; close bounded-conversion error analysis and test granularity/rounding boundaries before broader equivalence claims |
| V3 Issue transition | Carrier validator checks valid endpoints and mandatory authority signature but does not independently reconstruct the exact canonical Issue delta/action fingerprint | IMPLEMENTATION GAP/FAIL; authority-dependent | Specify on-chain transition refinement or a rigorously verified proof against the existing reference transition; never bypass the signature check as an interim fix |
| Economic evidence authentication | EEV, executable liquidity, freshness, obligation completeness and certified-Ω inputs are evaluated off-chain but are not all independently derived from authenticated transaction data by the current Issue validators | EVIDENCE / IMPLEMENTATION GAP | Authenticate each source and bind it to exact UTxOs, or prove it under a reviewed on-chain-verifiable construction; identify residual assumptions |
| First real Issue evidence | No verified completed transaction from the intended user's wallet plus independent reconciliation of ticket NFT, Treasury output, Counter, PrizeDatum, B1 Pool and V3 post-state | EVIDENCE GAP | Do not claim first-ticket completion; run only after settlement conformance, deployed service/configuration and current admission evidence are verified |
| Infinite horizon | transition relation / invariance proof | CLOSING — PROOF | complete proof or explicitly bound the claim |

## 6. Historical classification

The following may appear in historical evidence but must not be treated as current policy:

- `75/10/10/5` allocation.
- V25 artifacts.
- `K*=1.482`.
- old Constitution / Architecture / Economic Algorithm documents.
- historical Beacon B1/B3 research.

When referenced, label them `HISTORICAL`, `NON-CANONICAL`, `EXPERIMENTAL` or `EVIDENCE` as appropriate.

## 7. Audit rule

For every mismatch:

1. identify the highest authoritative source;
2. classify the mismatch as semantic, model, proof/validation, implementation or evidence;
3. correct the subordinate artifact;
4. never promote implementation behavior into economic authority;
5. never reopen a CLOSED normative decision without an explicit new decision.

## 8. Finality statement

This matrix is not a second Constitution, Economic Algorithm or policy document.

Its job is to answer only:

> **What is specified, what is implemented, what is proved, and what evidence is still missing?**

That separation is mandatory for the IMMORTAL / PRE-RICH documentation set.


## 9. First real Issue — evidence boundary (2026-10-21)

This is a non-normative status clarification for the paper and release process. It does not change the canonical rule set.

- USDM remains the ticket's economic unit of account; the protocol may accept a different settlement asset only when the actual Treasury output satisfies the existing authenticated conversion predicate.
- The current builder still supplies a fixed ADA amount. Since the Plutus valuation function excludes the configured ADA minimum-UTxO quantity from economic ADA value, the requested amount itself is not evidence that the Genesis price has been paid. The finalized transaction body has not been observed to establish whether Lucid preserves or rejects that request.
- A successful EEV qualification artifact is not a ticket transaction, is not proof of an authoritative live Issue witness for the current UTxOs, and is not evidence that the ticket reached a user's wallet.
- A real Issue using the current V3 carrier remains authority-backed because the carrier validator requires the configured Ed25519 signer. Such a transaction, after settlement construction is repaired, can be used for a deliberately scoped Adapter/ledger integration experiment only; it does not demonstrate permissionlessness.
- No real Issue should be executed merely to create a milestone while settlement conformance is known incomplete. The `scripts/predeploy-check.mjs` release gate now fails closed for the fixed-ADA Issue construction and requires a focused Issue settlement conformance test before it can pass.

Canonical reference: [`docs/COORDINATION/FIRST-REAL-PREPROD-TICKET-READINESS-20261021.md`](../COORDINATION/FIRST-REAL-PREPROD-TICKET-READINESS-20261021.md).
