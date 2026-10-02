# V3 Carrier → Economic Decision Binding Gap

**Status:** OPEN / implementation boundary
**Branch:** `work/immortal-green-closure`
**Date:** 2026-09-28

## 1. Source-controlled finding

The current branch already contains the V3 carrier implementation:

- `PRE-RICH/onchain/V3EconomicStateCarrier.hs`
- `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs`
- `PRE-RICH/onchain/PreRichRegimeState.hs`
- `PRE-RICH/onchain/GenesisRegimeCarrier.hs`

The V3 economic carrier currently establishes a structural singleton/version boundary:

- exactly one carrier script input;
- exactly one carrier script output;
- carrier token amount remains exactly one;
- carrier value is preserved;
- output datum decodes as V3 state;
- V3 state validity is checked;
- output version is exactly input version + 1.

This is **carrier integrity**, not yet **economic decision authority**.

## 2. Existing Issue authority seam

The existing Issue path already carries the following witness fields through `EconomicAdmissionWitness`:

- `decisionReference`
- `authoritativeObservationReference`
- `stateHash`
- `actionClass`
- `actionFingerprint`
- `postStateHash`
- candidate EEV
- executable-liquidity observation
- authenticated B1 PrizePool input/value
- required immediate liquidity.

`src/preRichIssueAdmissionBridge.ts` binds the witness to the exact Counter/Pool inputs.

`Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` is a transport/binding boundary: it invokes an explicitly configured Haskell producer and checks the decision/observation references against the observed Pool input.

These modules do **not** establish that the V3 carrier state or EEV source is authoritative.

## 3. Exact remaining binding gap

The current V3 carrier action is only:

`AdvanceV3State`

and the validator does not currently bind the carrier transition to:

1. the exact economic action class (`Issue`, `Reveal`, `Claim`, `Expire`);
2. the canonical decision reference;
3. the authoritative observation reference;
4. the canonical pre-state fingerprint;
5. the canonical action fingerprint;
6. the canonical candidate post-state fingerprint;
7. the economic admission witness;
8. the exact output carrier datum selected by the economic decision.

Therefore:

`carrier structural transition`

does not yet imply

`authenticated economic decision → corresponding carrier transition`.

## 4. Minimal binding shape

Do not introduce a new economic rule.

The minimal implementation should reuse the existing admission vocabulary and make the carrier transition consume/bind the already-produced decision rather than recomputing economics on-chain.

Required conceptual chain:

```
exact carrier input UTxO
        ↓
authenticated V3 pre-state
        ↓
existing Haskell Issue decision
        ↓
decisionReference + observationReference
+ actionClass + actionFingerprint
+ preStateHash + postStateHash
        ↓
carrier redeemer / transaction binding
        ↓
exact candidate output carrier datum
        ↓
V3 carrier validator
```

The validator should independently verify only the binding facts that are available from the transaction:

- the carrier input is the authenticated pre-state;
- the output datum is the claimed post-state;
- the pre/post fingerprints correspond to the actual carrier datum endpoints;
- the action class is the expected economic action;
- the decision/action identity is bound to the transition;
- the singleton/version/value invariants remain true.

The economic predicate itself remains in the existing economic admission path. No EEV derivation belongs in the carrier validator.

## 5. Reuse before new fields

Existing fields should be reused rather than creating parallel concepts:

| Existing concept | Existing source | Binding role |
|---|---|---|
| `stateHash` | EconomicAdmissionWitness | V3 pre-state identity |
| `postStateHash` | EconomicAdmissionWitness | candidate post-state identity |
| `actionClass` | EconomicAdmissionWitness | Issue/Reveal/Claim/Expire identity |
| `actionFingerprint` | EconomicAdmissionWitness | canonical decision/action identity |
| `decisionReference` | EconomicAdmissionWitness | decision provenance |
| `authoritativeObservationReference` | EconomicAdmissionWitness | observation provenance |
| carrier datum | V3 carrier | actual ledger pre/post state |

No second EEV field, second control-state field, or second economic gate is justified by this gap.

## 6. Transaction construction consequence

The current `mintSerialNFT()` Issue transaction consumes:

- Counter;
- B1 PrizePool;

and uses the economic admission witness off-chain before submission.

It does **not** currently consume/continue the V3 carrier.

Therefore the next implementation step cannot be a cosmetic witness field in TypeScript. The transaction must eventually include the deployed V3 carrier UTxO as an economic-state input/output, and the carrier validator must see the binding redeemer.

That deployment surface is still an execution prerequisite. Until a canonical deployed carrier UTxO/address is identified, the first-user Issue cannot truthfully be declared carrier-bound.

## 7. Tests required before live use

Add bounded conformance tests for:

### Positive
- correct carrier input;
- correct V3 pre-state;
- correct action class = Issue;
- matching decision reference;
- matching observation reference;
- matching pre-state hash;
- matching action fingerprint;
- matching post-state hash;
- exact candidate output state;
- version increments by one;
- carrier value unchanged.

### Negative
- wrong carrier input;
- wrong pre-state hash;
- wrong post-state hash;
- wrong action class;
- wrong decision reference;
- wrong observation reference;
- wrong action fingerprint;
- output state changed without corresponding post-state hash;
- replay of an already-consumed carrier;
- two competing transitions from the same carrier UTxO.

These are binding tests, not proof of EEV authority.

## 8. EEV remains a separate blocker

The current branch still has no identified production Issue EEV source satisfying EV1–EV7.

The existing Genesis PRE→USDM Oracle is not promoted to general EEV.

The exact B1 PrizePool UTxO remains the separate executable-liquidity witness.

The next EEV task remains source qualification:

`qualified source → asset perimeter → liquidation route → τ → deterministic valuation → EV1–EV7 evidence`

No valuation formula, haircut, horizon, oracle or PRE market value is invented here.

## 9. Closure classification

Current state:

- **V3 carrier structural implementation:** GREEN at source/conformance boundary.
- **Carrier → Issue decision binding:** RED / OPEN.
- **Concrete authoritative EEV source:** RED / OPEN.
- **Executable B1 liquidity binding:** GREEN at implementation boundary; live ledger evidence OPEN.
- **First-user Preprod Issue:** BLOCKED until the authority sources and carrier binding are materialized.

This document is an implementation/audit boundary only. It changes no canonical economics.
