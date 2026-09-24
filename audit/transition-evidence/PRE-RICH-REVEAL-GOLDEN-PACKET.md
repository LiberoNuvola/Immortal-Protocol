# PRE-RICH Reveal — Golden Evidence Packet v0.1

> Non-normative evidence manifest. This file does not create or alter economic rules.
> It defines the minimum artifact chain for one real Reveal transition.

## 1. Objective

Close one complete Reveal path from canonical economic admission to an observed Cardano ledger result:

canonical Reveal action → authenticated pre-state → profile/application policy → candidate post-state → Economic Admission → generated transaction → signed transaction → ledger observation → post-state reconstruction → persisted evidence.

A packet is GREEN only when every required artifact is present and cryptographically/provenance-linked. Source inspection, unit tests, emulator output, or a transaction hash without the corresponding raw artifacts do not close the packet.

## 2. Action identity

| Field | Required value | Status |
|---|---|---|
| action | Reveal | FIXED |
| ticket identity | policy ID + asset name | OPEN |
| canonical pre-state hash | 32-byte digest | OPEN |
| canonical post-state hash | 32-byte digest | OPEN |
| transition ID | deterministic transition identifier | OPEN |
| profile/application ID | authoritative PRE-RICH profile reference | OPEN |

## 3. Economic admission

The current runtime boundary requires an explicit EconomicAdmissionWitness before an economic Cardano submission.

Required evidence:
- gateVersion
- decisionReference
- authoritativeObservationReference
- stateHash
- eev
- executableLiquidityObservation
- authenticatedPoolInputReference
- authenticatedPoolUsdmValue
- requiredImmediateLiquidity
- exact inputReferences
- exact liquiditySourceReferences

The packet must preserve the serialized witness actually used by the submission path. Reconstructed or manually rewritten values are not equivalent evidence.

## 4. Reveal pre-state

Preserve the exact observed PrizeDatum and B1PrizePool UTxOs used to construct the transaction.

PrizeDatum fields material to Reveal include: ticket policy/name; player commitment; price; game version; ticket nonce; pending status; Beacon target/status/value; Materios context; PrizePool script hash; issued/expiry timestamps; pre-reveal result/payout fields.

B1PrizePool evidence must include the complete datum and value of the singleton input.

## 5. Candidate post-state

The Reveal implementation currently derives: deterministic ticket symbols from the ticket/beacon inputs; two independent row tiers; the established row payout total; status Revealed; frozen result; summary tier; row 1 and row 2 tiers; B1 unresolved-reserve release; B1 unresolved-ticket-count decrement; B1 pending-liability increase.

The packet must store both the canonical post-state representation and the exact serialized Cardano datum(s) intended for the transaction.

## 6. Cardano transaction artifacts

Preserve without transformation:
1. unsigned transaction CBOR;
2. signed transaction CBOR;
3. transaction ID;
4. transaction body hash;
5. transaction witness set;
6. redeemers, including exact purpose/index/data/ex-units;
7. datums/scripts or reference-script identities used for validation;
8. protocol parameters used for evaluation;
9. exact input UTxOs;
10. exact reference UTxOs;
11. validity interval;
12. collateral, when applicable;
13. raw submission response;
14. observed ledger transaction response.

## 7. Ledger observation

Required: observed transaction ID; provider/node; observation timestamp; block/slot/epoch context; inclusion/finality evidence appropriate to the target environment; raw transaction/UTxO response; cryptographic hashes of raw responses.

The observation must demonstrate the actual state transition, not merely successful submission.

## 8. Post-state reconstruction

Reconstruct the PrizeDatum and B1PrizePool state from the observed ledger.

Required checks:
- exactly one consumed PrizeDatum input;
- Reveal preserves the continuing PrizeDatum;
- status is Revealed;
- payout/result/tier fields match the canonical Reveal witness;
- row 1 and row 2 tiers remain independently observable;
- Pool unresolved reserve decreased by the ticket price;
- Pool unresolved ticket count decreased by one;
- Pool pending liabilities increased by the crystallised payout;
- Pool identity/hash remains bound to the PrizeValidator;
- protected pool fields required by the validator remain unchanged;
- reconstructed post-state hash equals the canonical post-state hash committed by the packet.

## 9. Evaluator evidence

Preserve: exact evaluator input transaction; exact ledger-aligned UTxOs/context; PParams; EpochInfo; SystemStart; evaluator output; ExUnits for every evaluated script/redeemer; exact script failure, if evaluation fails.

An emulator result without current ledger-aligned context is diagnostic only and must not be promoted to real-ledger evidence.

## 10. Closure criteria

### GREEN
All sections 2–9 are populated, hashes/provenance link the artifacts, the signed transaction is observed on the target ledger, and the reconstructed post-state matches the canonical post-state.

### YELLOW
Implementation/refinement/evaluation artifacts exist, but real-ledger observation or one of the required provenance links is missing.

### RED
The packet lacks the exact transaction/witness/context needed to reproduce the claimed result, or the observed post-state contradicts the canonical transition.

## 11. Known current gap

As of this manifest, no real Reveal packet is claimed closed. The project coordination register identifies live-ledger evidence and full B6 Reveal equivalence as open.

This manifest intentionally does not invent a transaction ID, UTxO, ExUnits value, datum hash, or ledger result.