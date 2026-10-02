# Genesis / Treasury Carrier — Closure Packet — 2026-09-27

## Classification
Evidence/conformance planning only. The Genesis threshold and economic predicate remain unchanged.

## Objective

Produce one deployment-specific evidence packet proving the already-defined transition:

PRE_GENESIS carrier → GENESIS carrier

with Treasury/Oracle evidence bound to the same authenticated transition.

## Required packet

- exact repository commit;
- carrier input UTxO reference;
- carrier datum before transition;
- carrier datum after transition;
- exact Treasury UTxO reference;
- exact PRE asset policy/name;
- exact Oracle state/input reference;
- observed PRE quantity;
- verified PRE→USDM price and precision;
- freshness/timestamp evidence;
- canonical admission result;
- transaction CBOR;
- protocol parameters relevant to the transaction;
- transaction output references;
- post-transition carrier observation;
- PrizePool value before/after proving no implicit bootstrap liquidity mutation;
- manifest hashing all artifacts.

## Negative witnesses

The same harness must retain rejection evidence for:

- below 4,000 USDM;
- stale Oracle;
- wrong Treasury;
- wrong PRE asset;
- malformed Treasury datum;
- duplicate carrier input;
- multiple carrier outputs;
- wrong resulting regime;
- replay against consumed PRE_GENESIS state;
- bootstrap value incorrectly credited to PrizePool.

## Boundary

The TypeScript admission mirror is evidence/refinement only. It cannot replace the on-chain predicate or authenticated observation.

## Closure

This packet closes the deployment-specific Genesis carrier gate only when a real ledger witness demonstrates the transition and all required negative twins remain reproducible.
