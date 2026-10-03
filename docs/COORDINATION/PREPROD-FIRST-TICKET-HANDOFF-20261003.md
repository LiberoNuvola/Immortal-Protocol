# PRE-RICH Preprod — First Real Ticket Operational Handoff

**Classification:** non-normative operational handoff
**Branch:** `work/immortal-green-closure`
**Date:** 2026-10-03

> This document contains the current operational state needed for the next Preprod run. Stable closure and certification status live in `docs/03-audit/IMMORTAL-IMPLEMENTATION-CLOSURE-STATUS.md`.

## Current state

Preprod topology is already deployed. The latest real Reveal reached the provider-backed Preprod validator and was rejected with the concrete rule failure `Prize: reveal window closed`. The deployed ticket is expired and must not be reopened.

- Current branch: `work/immortal-green-closure`
- Current verified code head: `036e18fb1d383a25fcebbcd1de9b8ce6f532eece`
- Implementation phase: FINALIZED
- Current phase: live-ledger evidence / integration closure
- Primary milestone: first real PRE-RICH ticket purchase on Cardano Preprod

## Latest Reveal observation

Run **37055478116**, job **110999006361**, executed commit `54f8d593...`.

| Gate | Status | Observation |
|---|---|---|
| Preprod context | **GREEN** | Context, wallet, live UTxOs and conformance succeeded |
| Deployment reuse | **GREEN** | Existing deployed topology was rehydrated; no bootstrap |
| Reveal redeemer encoding | **FIXED** | `Data.to(...)` removed the previous CML CBOR crash |
| Local UPLC evaluation | **BYPASSED** | `localUPLCEval: false` forced provider evaluation |
| Provider-backed Preprod evaluation | **REACHED** | Koios/Ogmios evaluated the actual PrizeValidator |
| Reveal validator result | **REJECTED** | `Prize: reveal window closed` / trace `PT5` |
| Signature / submit | **NOT REACHED** | Rejected during completion/evaluation |
| First real Preprod ticket | **NOT YET EXECUTED** | No Reveal transaction was submitted |

## Deployed topology

- Prize UTxO: `87af46f42746e32faf788cdd23d13df81af6aa0919a78cb9128cd09766fd1ad1#1`
- Pool UTxO: `87af46f42746e32faf788cdd23d13df81af6aa0919a78cb9128cd09766fd1ad1#0`
- Prize reference UTxO: `2706a87590f497d8880d2f6f2a9c51b0297d082e53d065f9371585dac6ce20c6#0`
- Pool reference UTxO: `b12d47bc8a0adabd6b84a1c4b5806935d4e03bedb1bdfe5415d06ae355bb540d#0`

## Required next transition

**Issue a new real ticket → obtain a fresh Pending Prize UTxO with its crystallized expiry → Reveal that fresh ticket.**

The first real Issue must bind a complete authoritative `IssueDecisionInput` from live Preprod state. Fixtures or synthetic witnesses are not acceptable for the first ticket.

Current intended chain:

```
LIVE Counter + LIVE B1 PrizePool
        ↓
LIVE authoritative V3 state observation/refinement   ← OPEN
        ↓
complete IssueDecisionInput
        ↓
canonical Haskell Issue decision
        ↓
EconomicAdmissionWitness
        ↓
mintSerialNFT()
        ↓
FIRST REAL PREPROD ISSUE
        ↓
fresh Reveal
```

Existing implementation surfaces include:
- `relayer/preprodIssueObservation.js`
- `relayer/issueAdmissionProvider.js`
- `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts`
- `PRE-RICH/onchain/V3EconomicStateCarrier.hs`

## Expiry policy

- Policy: `preRichExpiryPolicyV1` / `pre-rich-expiry-v1`
- V1 bounds: **2 hours minimum / 300 days maximum**
- Horizon: deterministically derived from the verified issuance-state snapshot using unresolved-reserve pressure, then crystallized into `pdExpiresAt`
- These are PRE-RICH application parameters, not IMMORTAL universal constants.

## Non-regression rules

- Do not redeploy the existing topology.
- Do not weaken `PrizeValidator` to bypass expiry.
- Do not treat the expired deployed ticket as the first real user ticket.
- Do not invent a different expiry horizon for testing.
- Do not claim the first Preprod ticket until Issue is signed/confirmed and the subsequent Reveal is also confirmed and reconstructed.
