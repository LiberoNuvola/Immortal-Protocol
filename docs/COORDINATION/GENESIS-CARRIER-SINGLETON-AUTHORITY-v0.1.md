# Genesis Carrier Singleton Authority — v0.1

## Purpose

Close the remaining singleton-authority gap for the PRE-RICH application-owned Genesis regime carrier without introducing a new economic rule.

## Canonical mechanism

The carrier authority is a Cardano native asset whose minting policy is a one-shot policy parameterized by one concrete `TxOutRef`. The minting transaction must consume that exact reference and must mint exactly one asset under the policy, with the configured carrier asset name. Burning is not permitted.

This follows the Cardano one-shot NFT pattern: a policy tied to a specific UTxO can succeed only once because that UTxO can be consumed only once. The resulting policy hash is the carrier Policy ID. The complete carrier identity is therefore:

`CarrierAssetId = oneShotPolicyId(seedTxOutRef, carrierName) + carrierName`

The policy does not contain economic logic and does not decide Genesis activation.

## Interaction with the carrier validator

`GenesisRegimeCarrier.hs` already requires:

- exactly one carrier token in the transition inputs;
- exactly one carrier token in the transition outputs;
- exactly one carrier token in the consumed carrier UTxO;
- exactly one carrier token in the continuing carrier UTxO.

The new mint policy supplies the missing provenance boundary: the token being conserved by the carrier validator is created by a policy whose successful mint is unique by construction and whose burn path is forbidden.

Thus the intended lifecycle is:

`seed UTxO → one-shot mint exactly 1 carrier → canonical PRE_GENESIS carrier UTxO → ActivateGenesis → canonical GENESIS carrier UTxO`

No second mint transaction can create another unit under the same policy.

## Repository implementation

- `PRE-RICH/profile/GenesisCarrierMintPolicy.hs`
  - `oneShotInputConsumed`
  - exact own-policy/token-name/quantity check
  - no burn path
  - compiled policy factory
- `plutus/pre-rich-plutus.cabal`
  - exposes `GenesisCarrierMintPolicy`
- `plutus/export/Export.hs`
  - exports `plutus/out/genesisCarrierMintPolicy.plutus.json`
- `.github/workflows/genesis-regime-carrier.yml`
  - watches the policy source
  - asserts both carrier artifacts exist

## What this proves / does not prove

This closes the policy-level singleton authority design gap once the policy is actually parameterized with the deployment seed reference and the resulting policy ID/name are recorded in the canonical deployment configuration/evidence.

It does not by itself prove:

1. that a real deployment has already minted the token;
2. that the token was placed in the canonical PRE_GENESIS carrier UTxO;
3. that the real `ActivateGenesis` transaction succeeds on ledger;
4. that a concurrent/replayed transition is rejected;
5. that Treasury datum semantics have been migrated/validated beyond the current structural decode.

Those remain ledger/deployment evidence fronts.

## Non-regression rule

Do not use the carrier token as Treasury liquidity, PrizePool liquidity, ProtectedCapital, RawSurplus, or any other economic quantity. It is solely an application-state identity/authority token.

No Genesis threshold, Oracle source, payout rule, or IMMORTAL universal state formula is changed by this mechanism.
