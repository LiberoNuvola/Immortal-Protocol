# PRE-GENESIS → GENESIS — Treasury/Oracle Concrete Surface v0.2

Status: TRIANGULATED / IMPLEMENTATION GAP.

## Current concrete identities

- PRE policy id: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`
- PRE asset name: `PRE-RICH` (`5052452d52494348`)
- Treasury address: deployment-configured `VITE_TREASURY_ADDRESS`; it is not hard-coded in the application source.
- Oracle publisher: deployment-configured `VITE_ORACLE_PUBLISHER_PKH`.
- Oracle singleton policy/name: deployment-configured `VITE_ORACLE_STATE_POLICY_ID` / `VITE_ORACLE_STATE_TOKEN_NAME_HEX`.

## Existing verified valuation path

`Economic.oraclePriceFor` accepts only an authorized Oracle State reference input carrying the configured singleton token and an `OracleDatum` whose asset policy/name match the requested asset, whose publisher matches the configured publisher, whose timestamp is fresh against the transaction validity upper bound, and whose price is non-negative.

`Economic.totalUsdmValue` then performs deterministic integer conversion using the oracle price and protocol precision.

This is the existing valuation primitive that Genesis should reuse.

## Missing binding

The missing piece is not PRE valuation. It is proving that the PRE quantity being multiplied belongs to the canonical protocol-controlled Treasury state being used for Genesis.

The current `mint.ts` path proves that the DApp already sends ticket settlement to the configured Treasury address, but it does not define a Genesis observation state machine. The legacy Plutus Treasury datum contains percentage-distribution fields and `tdThreshold`; its `Distribute` validator is therefore not the Genesis transition.

## Minimal Genesis observation

Conceptual observation:

`TreasuryIdentity + TreasuryStateRef + PREPolicyId + PREAssetName + PREQuantity + OracleStateRef + OraclePublisher + VerifiedPREPrice + OracleTimestamp + SourceStateHash`

Derived value:

`VerifiedTreasuryPREValueUSDM = PREQuantity × VerifiedPRE_USDMPrice`

Admission:

`sourceRegime == PRE-GENESIS && canonicalTreasury && verifiedOracle && freshOracle && verifiedValue >= 4000 USDM`

## Non-regression

- Do not introduce a second PRE oracle.
- Do not use the legacy `tdThreshold` as Genesis activation.
- Do not use Treasury UTxO existence as economic proof.
- Do not infer PrizePool liquidity from Treasury PRE custody.
- Do not add a second Genesis threshold or stability window.
- Do not change Oracle semantics to fit Genesis.

## Next implementation seam

Create the smallest application-specific Genesis admission type around the existing oracle primitive and a canonical Treasury observation. Keep it outside the universal IMMORTAL kernel. Then test its negative cases before wiring any Plutus state transition.