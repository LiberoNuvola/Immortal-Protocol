# IMMORTAL — RF8 Admission Reachability Reconciliation
Date: 2026-09-24
Branch: `work/immortal-green-closure`

## Purpose

This delta reconciles the previous RF8 surface audit with the actual current Cardano adapter path.

The prior audit correctly found that the Plutus validators do not visibly call a single `EconomicGate` symbol. A second inspection now establishes that the repository does have a distinct **off-chain economic submission boundary** in the Cardano Adapter.

This does not close RF8: the remaining question is whether the off-chain admission witness is itself a faithful refinement of the canonical economic admissibility relation and whether every economically material mutation path is forced through the intended boundary.

## Newly verified current-branch evidence

### Economic Admission boundary

Current file:

`Adapter/CARDANO/runtime/EconomicAdmission.ts`

It defines `EconomicAdmissionWitness` and `assertEconomicAdmission`.

The witness carries:

- `gateVersion`
- `admitted: true`
- `decisionReference`
- `authoritativeObservationReference`
- `stateHash`
- `eev`
- executable-liquidity observation
- authenticated B1 PrizePool input reference/value
- required immediate liquidity.

The assertion is fail-closed and verifies:

- witness exists and is explicitly admitted;
- gate/decision/observation references are non-empty;
- state hash has the required digest shape;
- EEV and required liquidity are non-negative;
- executable liquidity is bound to the transaction input references;
- authenticated B1 Pool input/value matches the executable-liquidity observation;
- observed liquidity source references equal the expected action sources;
- observation reference equals the authoritative observation reference;
- observed spendable liquidity covers required immediate liquidity.

This is concrete evidence of an adapter-side economic admission boundary.

### CardanoExecutionAdapter

Current file:

`Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`

It exposes two paths:

1. generic `submit(tx)`;
2. economic `submitEconomic(tx, admission, inputReferences, liquiditySourceReferences)`.

`submitEconomic` calls `assertEconomicAdmission` before delegating to generic submission.

Therefore the adapter **does have a bypass-capable generic submission primitive** at the API level.

This is critical for RF8: the existence of `submitEconomic` proves an intended gate boundary, but the existence of generic `submit` means API-level non-bypass has not been proven.

## Current application callers

### SALE

`src/mint.ts` now explicitly requires:

`economicAdmission: EconomicAdmissionWitness`

and submits through:

`createCardanoExecutionAdapter(lucid).submitEconomic(...)`.

The input references include Counter + B1PrizePool, while the liquidity source is the exact B1PrizePool input.

This establishes an off-chain admission boundary for the current SALE flow.

### REVEAL / CLAIM / EXPIRE

`src/gameFlow.ts` explicitly imports `EconomicAdmissionWitness` and each economic flow requires an `economicAdmission` witness.

Reveal, Claim and Expire call `signAndSubmitEconomicTx`, which delegates to `adapter.submitEconomic`.

Thus the current PRE-RICH off-chain economic flows are bound to the adapter admission boundary.

### Important limitation

This proves the **current named application flows** use the economic submission path.

It does not yet prove that:

- every economic caller in the repository uses `submitEconomic`;
- no direct use of generic `submit` exists for an economically material action;
- no alternate transaction-construction/submission route exists;
- the witness's `admitted: true` is cryptographically/authentically bound to the canonical V3 transition and its exact pre/post-state;
- Plutus validators are refinements of the same canonical admissibility relation rather than independently compatible checks.

## RF8 refined model

The evidence now supports separating RF8 into two distinct properties:

### RF8-A — Off-chain admission boundary

**Current status: PARTIAL / STRONG IMPLEMENTATION EVIDENCE**

Evidence:

`mintSerialNFT`
→ `submitEconomic`
→ `assertEconomicAdmission)

and

`revealPrize / claimPrize / expirePrize`
→ `signAndSubmitEconomicTx`
→ `submitEconomic`
→ `assertEconomicAdmission).

### RF8-B — Canonical economic refinement / no alternate path

**Status: OPEN**

Still required:

1. repository-wide caller inventory for `submit` vs `submitEconomic`;
2. negative regression test proving an economic flow cannot accidentally fall back to generic submission;
3. exact binding of `EconomicAdmissionWitness` to canonical action + authenticated pre-state + candidate post-state;
4. proof that witness admissibility corresponds to the canonical Economic Gate relation;
5. action-by-action refinement from:
   `Issue / Reveal / Claim / Expire`
   to the concrete Cardano validators;
6. proof/negative tests for alternate transaction-construction paths;
7. ledger evidence for the final transition identity.

## Immediate next test target

Do not change protocol semantics.

Add a repository-level static/runtime regression invariant:

> Every economically material PRE-RICH submission function must call the economic submission boundary and must not call generic Cardano submission directly.

The test should enumerate the current economic entry points and fail if a future edit introduces a direct generic submission path.

Then separately establish the witness-to-canonical-transition binding.

## No normative change

- No KA/KC/KD change.
- No ladder change.
- No 500× change.
- No Jackpot change.
- No expiry change.
- No maxTxSize change.
- No RF8 closure claim.
- No CI-green claim.
- No ledger evidence inferred from source inspection.

**Status: RF8-A PARTIAL/STRONG IMPLEMENTATION EVIDENCE; RF8-B OPEN.**
