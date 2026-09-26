# PRE-GENESIS → GENESIS Treasury Observation Contract v0.1

**Status:** implementation/evidence gap — regime carrier/predicate implemented; production/on-chain transition evidence remains open.

## Finding

The implementation boundary has advanced since this contract was first recorded. The current PRE-RICH profile now contains an explicit `PreRichRegimeState`, canonical `preGenesisState`/`genesisState` carriers, and a fail-closed `preGenesisToGenesis` transition predicate over a `GenesisTreasuryObservation`. Dedicated GenesisRegimeCarrier tests cover acceptance, below-threshold rejection, conservative fractional valuation, wrong-source rejection, and replay rejection.

The remaining gap is the **production/on-chain transition path**: a verified real Treasury observation must still be connected to canonical identity/state evidence, on-chain revalidation, atomic committed GENESIS state, and a reproducible accounting delta. The legacy Treasury distribution mechanism must not be reused as Genesis authority.

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