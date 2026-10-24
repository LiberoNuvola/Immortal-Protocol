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


## Agent A continuation — 2026-10-24

Current execution branch verified as work/immortal-green-closure; the short branch name green does not exist in the current branch list. Do not dispatch the EEV approval workflow until the Preprod tUSDM/canonical-USDM identity decision and the current EV1–EV7 qualification chain are resolved.

### Exact-SHA direct-USDM tests
Commit [b6379b62](https://github.com/LiberoNuvola/Immortal-Protocol/commit/b6379b6284c92fb6c1e992767d88af827d03c582) adds three fail-closed regressions to DirectUsdmEev.test.ts: negative physical quantity, unrelated ADA/PRE-like asset substitution, and malformed ticker-like asset unit. The focused [PRE-RICH Direct-USDM Conformance run #40066013357](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013357) and [Issue Admission Boundary CI #40066013305](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066013305) both succeeded on that exact SHA.

### Blocker decision
The candidate unit e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d is a physical Preprod tUSDM candidate. Its presence in the Pool UTxO and the arithmetic conversion to 100 IMMORTAL subunits per whole token do not establish canonical USDM identity. The source-set producer correctly emits OBSERVED_NOT_QUALIFIED; the approval workflow remains a separate guarded step and was not run.

### Remaining gates
- P-01: fresh source-set and EV1–EV7 qualification with verified content digests, exact live Pool UTxO and approved asset mapping; fresh separately authorized EevDeploymentApproval bound to those exact inputs.
- P-02: production Pyth → MintPolicy denomination/signature binding and native-ledger positive/tampered quote tests remain unproven; feed 16 is ADA/USD, not evidence of a USDM quote.
- P-05/P-06: final transaction-body/input binding and issuance snapshot → issuedAt/expiresAt binding remain open at the actual Issue boundary.
- P-15: read-only Treasury observer and scenario simulator exist, but no verified asset→USDM execution route or executed swap is evidenced.
- P-16: no confirmed user-wallet Ticket NFT Issue is evidenced. No wallet signing, approval dispatch, or transaction submission was performed in this pass.

See the central six-front matrix and exact-SHA workflow inventory in [REPO-WIDE-BRANCH-CHECKPOINT-2026-10-21.md](REPO-WIDE-BRANCH-CHECKPOINT-2026-10-21.md).


### Agent A continuation — Treasury observer source audit, 2026-10-24 (follow-up)

Verified current branch HEAD before this note: `abde45b2ef149997de2813bf808d8144a5fe76a7` (`work/immortal-green-closure`). No new branch created.

The existing Treasury workflows and scripts were inspected directly on this branch:

- `.github/workflows/observe-configured-preprod-treasury.yml` invokes `audit/cardano-integration/observe-configured-preprod-treasury.mjs` in the `DEMETER` environment and requires `PREPROD_TREASURY_ADDRESS`, `PREPROD_TREASURY_SCRIPT_HASH`, and `PREPROD_TREASURY_BINDING_REFERENCE`.
- The observer verifies that the configured Preprod address has a script payment credential matching the supplied script hash and reads address UTxOs from Koios. Its output explicitly labels the binding reference `CALLER_SUPPLIED_NOT_CRYPTOGRAPHICALLY_VERIFIED`; it does not establish authorized deployment, protocol control, a liquidation route, a swap, or QNE.
- `.github/workflows/observe-preprod-treasury-inventory.yml` derives an address from the checked-in `plutus/out/treasury.plutus.json`, then observes balances and token holders. This is useful inventory evidence but is not, by itself, proof that this artifact is the currently authorized deployment.
- `.github/workflows/treasury-liquidation-simulation.yml` and `audit/cardano-integration/treasury-liquidation-simulation.mjs` perform deterministic arithmetic over caller-supplied values. `OBSERVED_EXECUTION` is only an input label; the simulator itself does not fetch a DEX quote, construct/sign/submit a swap, or verify proceeds.

**Execution status:** these workflows were source-audited only in this follow-up. No Treasury observation workflow was dispatched, no live artifact was downloaded, and no swap was attempted. Do not interpret the code review as a fresh ledger observation.

### Exact-SHA CI refresh — 2026-10-24

The latest coordination/documentation commit on the working branch is `abde45b2ef149997de2813bf808d8144a5fe76a7`. The following checks completed successfully on that SHA: [Portability Conformance #40066742664](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066742664), [Governability Adversarial Lab #40066742656](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066742656), [Protocol Declaration Conformance #40066742609](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066742609), [Cardano Adapter Sale Conformance #40066742536](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066742536), and [Documentation Link Check #40066742615](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40066742615). These are conformance/documentation results; they do not certify EEV qualification, live Treasury state, Pyth quote authenticity, or a real ticket issuance.

The latest reviewed operational blockers remain unchanged:
1. Obtain a governed, source-backed decision on whether the candidate Preprod `tUSDM` unit is the canonical accounting USDM. Do not infer identity from ticker, presence, or conversion scale.
2. Only after that decision, produce a fresh exact-Pool-UTxO observation and reproducible EV1–EV7 evidence with independently verified digests; separately authorize the deployment approval.
3. Keep the Treasury inventory read-only. A liquidation scenario remains scenario evidence until a route, execution, costs, and actual USDM received are independently verified.
4. Keep first Issue fail-closed until authoritative admission and the final transaction body are bound to authenticated current evidence, then verify the Ticket NFT in the intended wallet UTxO after on-chain confirmation.

No economic constants, expiry semantics, V3 carrier, Reveal semantics, or wallet/transaction state were changed in this follow-up.
