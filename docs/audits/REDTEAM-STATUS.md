# REDTEAM-STATUS

## Purpose

Adversarial status for the valuation / Genesis observation / RF8 / B1 / Omega surfaces. This file records concrete attack surfaces found by source inspection. A finding is not closed merely because the normative rule is CLOSED.

## Current findings on b1-hardening

| ID | Surface | Finding | Status |
|---|---|---|---|
| RT-1.3 | Observation / valuation | `EconomicObservation` validates decoded state shape and timestamp sign, but does not enforce freshness, source authentication, Treasury identity, or binding between the observation and an authoritative Cardano object. | FAIL |
| RT-1.5 | Executable liquidity | `ImmortalP25ObservationProjection` accepts pool values supplied by the caller and only cross-checks unresolved reserve/count against ticket list. No explicit executable-liquidity predicate or asset-spendability proof is present in this projection. | GAP |
| RT-1.6 | Reflexive PRE | Projection has no liquidation haircut / market-depth bound for Treasury PRE. Genesis or safety decisions depending on this observation therefore require a stronger valuation contract. | GAP |
| RT-1.8 | Double count | The projection independently accepts pool-level financial fields while deriving ticket exposure from tickets. There is no generic invariant here preventing the same Treasury value from being represented in multiple economic buckets outside the unresolved-ticket checks. | GAP |
| RT-2.3 | Genesis observation | Current B1 relayer documentation explicitly states that the contract does not independently prove authenticity of the external Materios observation. | FAIL |
| RT-2.12 | Genesis carrier | A verified threshold is not equivalent to an executable Genesis transition. The current observation/projection code alone does not establish an authenticated on-chain PRE-GENESIS -> GENESIS carrier. | GAP |
| RT-4.2 | Publisher censorship | B1 relies on a configured relayer as authorized publisher. Censorship/downtime therefore remains a liveness/fairness surface even when safety is preserved. | OPEN RISK |
| RT-5.2 | Omega perimeter | The repository must not claim complete Omega coverage unless the commitment-class inventory covers all economically relevant external observations and execution failures. | GAP |

## Evidence anchors

- `Adapter/CARDANO/observation/EconomicObservation.ts`: observation acceptance performs runtime state validation but does not authenticate the observation source or freshness.
- `Adapter/CARDANO/observation/ImmortalP25ObservationProjection.ts`: projection derives unresolved-ticket reserve/count, but accepts safety capital, reserve protection, mandatory future costs, and pool-level values as inputs.
- `relayer/relayer.js`: the B1 model explicitly documents the configured relayer as authorized publisher and says the contract does not independently prove authenticity of the external Materios observation.
- `IMMORTAL/kernel/EconomicKernel.hs`: the kernel enforces algebraic invariants, but cannot by itself prove that EEV supplied by the adapter is executable liquidity.
- `IMMORTAL/docs/CONSTITUTION.md`: constitutional authority requires objectively verifiable predicates and states that adapters do not acquire economic authority.

## Immediate red-team gates

1. Do not mark Genesis observation as fully closed while RT-2.3 / RT-2.12 remain unresolved.
2. Add negative tests for stale, forged, wrong-Treasury, wrong-asset, and conflicting observations.
3. Define the executable-liquidity predicate before using observed Treasury value to create surplus or activate Genesis.
4. Add an explicit anti-double-counting invariant across all economic buckets, not only unresolved tickets.
5. Keep B1 censorship/liveness explicitly separate from economic safety claims.
6. Require an authenticated carrier for the Genesis transition before release language can say Genesis is implemented.

## Claim discipline

Allowed: "bounded red-team evidence on b1-hardening."

Not allowed without corresponding evidence: "Genesis implemented", "observation trustless", "Omega complete", "liability-proof", or equivalent claims.

## Next attack sequence

RT-1.3/1.5/1.6/1.8 -> RT-2.3/2.12 -> RF8 path inventory -> B1 outage/censorship -> Omega omission matrix.
