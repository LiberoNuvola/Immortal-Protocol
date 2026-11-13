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

## 2026-11-13 — correction: one-shot-per-seed is not a global singleton

A current-source audit of `PRE-RICH/onchain/GenesisRegimeCarrier.hs` and `GenesisCarrierMintPolicy.hs` narrows the claim above:

- The mint policy guarantees at most one token for **one derived policy ID**, whose seed `TxOutRef` is supplied by the caller to the public factory.
- A different seed produces a different policy ID; there is no authorized seed or expected carrier policy/name hard-coded into the parameterless `GenesisRegimeCarrier` validator.
- `PreRichRegimeDatum` itself supplies `prdCarrierPolicy`, `prdCarrierName`, `prdCanonicalTreasury`, PRE identity, Oracle singleton identity/publisher and PrizePool hash. The validator checks continuity and a token under those same datum-supplied carrier fields, not a deployment-pinned identity.
- The validator's exactly-one-own-input/continuing-output checks apply to the current transaction. They do not prove that there is exactly one recognized Genesis carrier UTxO/policy across the ledger.
- The first-Issue reader/provider currently does not consume a Genesis carrier identity or regime witness.

Therefore the implementation has a **one-shot mint mechanic**, but it does **not yet establish one globally canonical Genesis regime singleton**. Independent one-shot policies may create independent carrier tokens/UTxOs at the same unparameterized validator address, and each may be transitioned separately under its own datum identity. The current code has no on-chain or Issue-consumer binding to reject such parallel self-declared carriers.

The same identity issue applies to the datum-supplied Treasury and Oracle source identities: no deployment-pinned Treasury hash, Oracle singleton identity or publisher is embedded as an immutable parameter of the Genesis validator. Those values are preserved from input to output but are not made authoritative merely by being in the datum.

**Disposition correction:** retain as implemented only the one-shot-per-seed policy property and local Yaci transition fixture. Reclassify global singleton authority, canonical source identity and production Genesis regime authority as **OPEN / NOT ESTABLISHED** until the actual seed/policy/name and source identities are pinned by an authenticated mechanism that the validator and the first-Issue consumer enforce. This correction does not authorize a replacement policy, new datum layout, validator parameterization, deployment or ABI change.
