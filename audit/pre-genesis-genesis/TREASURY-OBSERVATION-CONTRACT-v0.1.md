# PRE-GENESIS → GENESIS Treasury Observation Contract v0.1

**Status:** implementation/evidence gap — contract extraction only; not a new economic rule.

## Finding

Direct inspection of the current closure branch found no executable PRE-GENESIS → GENESIS transition, no `PreGenesis`/`GenesisState` type, and no runtime action that consumes a verified Treasury valuation and changes the economic regime.

The current Treasury implementation is a legacy distribution mechanism (`TreasuryAction = Distribute`) with percentage fields and a nominal `tdThreshold`. It is not a valid Genesis activation authority. Reusing it would conflate legacy Treasury distribution with the frozen Genesis bootstrap condition.

## Minimum boundary

Before an implementation can commit Genesis, the adapter/application boundary must expose a verified observation equivalent to:

```text
TreasuryObservation = {
  treasuryIdentity,
  treasuryStateReference,
  preAssetIdentity,
  preQuantity,
  verifiedPreUsdmValue,
  valuationEvidenceReference,
  observationFreshness,
  observationStateHash
}
```

The exact representation is intentionally left open until the real PRE-RICH/Cardano Treasury datum and valuation path are mapped.

## Admission contract

```text
PRE-GENESIS
  → verify canonical Treasury identity
  → verify current Treasury state/reference
  → verify PRE asset identity + quantity
  → verify valuation evidence/freshness
  → evaluate Genesis bootstrap predicate
  → candidate GENESIS state
  → on-chain revalidation
  → atomic transition
```

For the current PRE-RICH canon, the frozen bootstrap condition is verified PRE Treasury value >= 4,000 USDM. The observation path must prove that the value belongs to the protocol-controlled Treasury.

## Non-double-counting boundary

Genesis activation does not imply:

- transfer of Treasury PRE into PrizePool;
- reclassification of historical Snek bootstrap supply as PrizePool liquidity;
- creation of RawSurplus merely because Treasury custody exists;
- deletion of bootstrap provenance.

Any transfer/reclassification must be a separate, explicitly specified economic transition.

## Required negative evidence

- below-threshold observation;
- stale valuation;
- malformed valuation;
- wrong PRE asset;
- wrong Treasury UTxO/address;
- non-protocol-controlled Treasury;
- duplicate/concurrent Genesis transition;
- bootstrap value incorrectly appearing in PrizePool liquidity;
- legacy Treasury percentage distribution presented as Genesis proof.

## Closure criterion

The front is not closed until a reproducible trace exists:

```text
PRE-GENESIS state
→ canonical Treasury observation
→ verified value evidence
→ candidate transition
→ validator/on-chain revalidation
→ committed GENESIS state
→ accounting delta
```

Simulation output remains experimental evidence and cannot substitute for the on-chain transition proof.