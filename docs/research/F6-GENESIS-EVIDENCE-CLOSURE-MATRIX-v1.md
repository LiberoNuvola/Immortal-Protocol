# F6 — PRE-GENESIS → GENESIS Evidence Closure Matrix v1

**Classification:** conformance / evidence contract, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Advance the Genesis/Treasury front in parallel without changing the frozen bootstrap condition
or turning application observation into protocol authority.

The existing implementation already has:

`Treasury observation → verified PRE/USDM valuation → Genesis admission predicate`.

The remaining gap is production/on-chain evidence.

## Existing implementation

`src/genesisTreasuryObservation.ts` observes:

- exact Treasury address;
- exact PRE policy/name;
- the unique PRE-bearing Treasury UTxO;
- Oracle singleton;
- Oracle PRE asset identity;
- price;
- timestamp;
- publisher;
- freshness;
- Treasury/Oracle state references;
- source state hash.

`PRE-RICH/src/GenesisTreasuryAdmission.ts` then enforces:

- PRE-GENESIS regime;
- canonical Treasury identity;
- canonical PRE identity;
- canonical Oracle publisher;
- canonical Oracle precision;
- non-negative quantity/price;
- verified/fresh valuation;
- threshold admission at the existing 4,000 USDM bootstrap condition.

No new threshold is introduced here.

## Closure matrix

| Gate | Current status | Evidence still required |
|---|---|---|
| Treasury identity | bounded implementation | real deployed script/address witness |
| Treasury PRE quantity | bounded observation | real Preprod UTxO + exact asset identity |
| Oracle identity | bounded observation | real singleton state + datum evidence |
| Oracle freshness | bounded predicate | real timestamp/observation pair |
| Valuation | bounded calculation | exact observed quantity × verified price evidence |
| Genesis admission | bounded composition | real candidate Genesis state + on-chain revalidation |
| One-shot transition | semantic requirement | duplicate/replay rejection on ledger |
| No double-counting | contract defined | pre/post accounting evidence |
| GENESIS state commitment | open | exact committed post-state witness |
| Independent replay | open | frozen observation packet + second execution |

## Required negative evidence

The existing contract already identifies the following negative cases:

- below threshold;
- stale valuation;
- malformed valuation;
- wrong PRE asset;
- wrong Treasury;
- non-protocol-controlled Treasury;
- duplicate/concurrent Genesis transition;
- bootstrap value incorrectly appearing in PrizePool liquidity.

The implementation/conformance suite should continue to use these cases rather than inventing
new policy categories.

## Real-evidence packet

Once a real Treasury observation is available, the packet must bind:

`observation → valuation → admission → candidate state → transaction → ledger result → post-state/accounting delta`.

The exact transaction and UTxO references must be preserved. A UI display or simulation is
not sufficient.

## Boundary

Genesis activation does not imply:

- automatic Treasury→PrizePool transfer;
- reclassification of historical liquidity;
- creation of RawSurplus merely from custody;
- deletion of bootstrap provenance.

Any such operation is a separate economic transition and must remain explicitly specified.

## Current status

- Treasury observation implementation: **BOUNDED**
- Genesis admission composition: **BOUNDED**
- On-chain Genesis carrier: **OPEN**
- Real Preprod witness: **OPEN**
- Independent replay: **OPEN**
