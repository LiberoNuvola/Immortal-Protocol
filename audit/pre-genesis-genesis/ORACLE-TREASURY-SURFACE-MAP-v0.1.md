# PRE-GENESIS → GENESIS — Existing Oracle/Valuation Surface Map v0.1

Status: TRIANGULATED / IMPLEMENTATION GAP.

## Existing canonical machinery

The current repository already contains an authenticated oracle valuation surface. OracleDatum carries valued asset identity, price, publisher and publication timestamp; OracleStateId identifies the singleton state container. The economic helper resolves price only from the authorized oracle-state reference input and rejects mismatched asset identity/publisher/stale oracle data.

The current constitution expresses the Genesis bootstrap value as:

`TreasuryPREValueUSDM = TreasuryPREQuantity × VerifiedPRE_USDMPrice`

The frozen threshold is verified PRE Treasury value >= 4,000 USDM.

## Critical finding

This machinery is not yet a Genesis transition.

No inspected current-branch runtime action was found that composes canonical Treasury observation + verified PRE oracle value + PRE-GENESIS source state + one-shot transition.

Therefore the correct next implementation is composition, not creation of a second oracle.

## Proposed typed boundary

Genesis admission should consume existing verified evidence conceptually:

- canonical Treasury identity/reference
- PRE asset policy/name
- PRE quantity observed in that Treasury state
- verified PRE→USDM oracle price
- oracle publisher/state reference
- oracle freshness
- derived verified USDM value
- source-state hash/reference

Then `GenesisPredicate(observation) = verifiedValue >= 4000 USDM`.

No second price source and no second threshold.

## Important separation

The existing oracle supports settlement valuation. Genesis must additionally bind the Treasury quantity being valued to the canonical protocol-controlled Treasury state. An oracle proving PRE price alone is insufficient.

Likewise, an observed Treasury balance alone is insufficient without the verified PRE→USDM conversion.

## Next concrete code target

Map the exact Treasury UTxO/value representation at the PRE-RICH boundary and build the smallest pure admission predicate around the existing oracle evidence. Only after that should an on-chain state transition be introduced.

Do not modify the existing oracle semantics to accommodate Genesis.