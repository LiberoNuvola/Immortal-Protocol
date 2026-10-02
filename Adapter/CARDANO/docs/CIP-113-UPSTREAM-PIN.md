# CIP-113 Upstream Pin — Adapter

**Status:** RESEARCH / NON-NORMATIVE / PREPROD PREPARATION
**Date:** 2026-09-30

## Purpose

This file freezes the external inputs that must be recorded before any real CIP-113 ledger deployment is admitted into the IMMORTAL Cardano Adapter evidence pipeline.

## Upstream repositories

- Core: `cardano-foundation/cip113-programmable-tokens`
- Platform: `cardano-foundation/cip113-programmable-tokens-platform`
- Substandard under first smoke test: `dummy`

## Current upstream facts

The core repository is an Aiken implementation of the shared CIP-113 framework. Its architecture contains shared programmable custody, a registry, protocol-parameter state, issuance, unfracking and the programmable-logic base/global validators. The platform repository supplies the off-chain reference platform and substandards, including Dummy.

The Dummy substandard is explicitly documented as the minimal reference implementation and is suitable as a framework/integration test surface. It is not PRE-RICH economics.

The upstream platform currently states that the implementation is research/development and not production-ready. The platform repository has no published GitHub releases. The exact commit used for any deployment must therefore be recorded as deployment evidence.

Sources verified 2026-09-30:
- https://github.com/cardano-foundation/cip113-programmable-tokens
- https://github.com/cardano-foundation/cip113-programmable-tokens-platform
- https://github.com/cardano-foundation/cip113-programmable-tokens/blob/main/documentation/09-DEVELOPING-SUBSTANDARDS.md

## Mandatory deployment pin

Do not populate the following fields from memory or from a moving `main` branch. Populate them only after cloning/building the exact upstream revisions used for the experiment.

| Field | Required value | Current status |
|---|---|---|
| Core commit | immutable Git commit SHA | OPEN |
| Core plutus.json fingerprint | SHA-256 | OPEN |
| Core Aiken version | exact version | OPEN |
| Platform commit | immutable Git commit SHA | OPEN |
| Dummy module commit/tree | exact revision | OPEN |
| Dummy issuance script hash | observed/deployed hash | OPEN |
| Dummy transfer script hash | observed/deployed hash | OPEN |
| Protocol-params reference | tx hash + index | OPEN |
| Registry reference | tx hash + index | OPEN |
| Registry state fingerprint | canonical observed state hash | OPEN |
| Token policy ID | observed/deployed ID | OPEN |
| Token asset name | exact bytes | OPEN |
| Programmable custody address | observed address | OPEN |
| Upgrade/lifecycle authority | observed credential | OPEN |
| First smoke-test tx | tx hash | OPEN |

## First experiment

Use the Dummy substandard only for a framework smoke test:

`mint -> register -> place token under programmable custody -> transfer -> observe -> bind evidence`

No PRE-RICH economic state, payout, liability, treasury or V3 carrier transition is part of this experiment.

## Adapter acceptance

The Adapter accepts the resulting evidence only if:

1. the deployment IDs and revisions match the pinned manifest;
2. registry and protocol-parameter references are exact;
3. the token identity matches the observed transaction;
4. transfer logic identity matches the registry state;
5. the transaction reference is exact;
6. replay against another deployment fails;
7. CIP-113 upgrade authority is not reused as economic authority.

## Stop conditions

Stop the deployment if:

- upstream source changed after the pin;
- generated validator artifacts differ from the pinned fingerprint;
- registry state is stale or ambiguous;
- protocol parameters cannot be bound to the transaction;
- the Dummy transfer requires ThirdPartyAct or freeze/seize behavior;
- any step would require changing IMMORTAL economic constants or PRE-RICH game rules.

## Non-regression

This manifest is Cardano Adapter documentation only. It does not promote CIP-113 into IMMORTAL authority, does not alter PRE-RICH economics, and does not make CIP-113 a prerequisite for the first ordinary PRE-RICH Preprod user.

## Verified immutable upstream pins — 2026-09-30

Core main HEAD at verification: `6b75ba3286b4692ca23059ff51285db357fb09c6`.

Core `aiken.toml`: package version `0.0.1`, compiler `v1.1.23`, Plutus `v3`, stdlib `v3.1.0`, fuzz `v2.2.0`.

Platform main HEAD at verification: `a2446adf36c616df9160f81a02ddd1f07f4e13d8`.

Platform README explicitly identifies the project as R&D, says the standard is still under active development, documents the Dummy module as the minimal permissioned-transfer module, and reports limited Preview testing plus pending professional security audit.

The platform repository currently has no GitHub releases, so these commit SHAs are the reproducibility anchors for this investigation. A real deployment must use these exact SHAs or record a newer explicit pair before proceeding.

Important upstream review finding: the core repository has an open finding concerning live registry-node updates. Therefore the Adapter must bind the observed registry state to the exact transaction; policy ID alone is insufficient. Third-party paths are excluded from the first smoke test.


## Dummy module pin — verified against platform contract manifest

The platform's `contracts-pin.json` at platform commit `a2446adf36c616df9160f81a02ddd1f07f4e13d8` pins the Dummy blueprint independently of the platform HEAD:

- Dummy source commit: `e63fa0af433ee39b2069521c2dd7579e1c919f89`
- Aiken compiler: `v1.1.21+42babe5`
- Blueprint SHA-256: `c75e41f6ff3f71c278ac4765741ea6cf1e222fa24d5601d85e5e3a25bb15ed0f`
- At that pinned commit the Dummy source/artifact lived under `src/substandards/dummy/`; the current platform tree has renamed the path to `src/modules/dummy/`.

The Dummy README defines the smoke-test semantics exactly: transfer accepts redeemer `200`, issue accepts redeemer `100`, with no domain-specific authorization logic. This is appropriate for framework-only verification and must not be interpreted as PRE-RICH authorization.

## Compatibility result

**CORE + PLATFORM + DUMMY are reproducibly pinned.** The platform's own contract manifest pins core commit `6b75ba...` and Dummy commit `e63fa0...`, so our Adapter can use the same provenance chain without importing platform code into IMMORTAL or PRE-RICH.

The platform's current Devnet Guide also states that its current deployment target is a specific CIP-113 alpha generation and that Preprod requires an explicit deployment before use. Therefore the next step is deployment-materialization, not transaction construction from guessed hashes.


## Deployment-materialization finding — verified 2026-09-30

The deployment path was triangulated against the TypeScript SDK referenced by the upstream platform guide.

### SDK provenance

The referenced sibling SDK currently found in public GitHub is:

- repository: `easy1staking-com/cip113-sdk-ts`
- inspected revision: `1f15296380c46de32ea85668951397e8868815c8`
- package version at that revision: `0.13.0`
- target protocol: CIP-113 `v0.0.1`, byte-identical on-chain contract generation to the documented `0.5.0-alpha.5` generation, with the version relabel recorded by the SDK.

The SDK exports the five protocol-bootstrap transaction builders and `planBootstrap`/ `assembleDeploymentParams`. The exported builders intentionally return unsigned transactions and do not sign, submit, await or fund them.

### Critical deployment boundary

The SDK's `test/harness/bootstrap.ts` contains the orchestration function `bootstrapProtocol`, but the function is explicitly documented and guarded as **devnet-only**. It refuses a non-testnet chain configuration even when a client is injected, and its surrounding fixture owns devnet-specific funding, Yaci settling, endpoints, nonce and other test values.

Therefore:

**The existence of a `preprodChain` client configuration does NOT constitute proof that `bootstrapProtocol` is a supported Preprod deployment procedure.**

The SDK README demonstrates how an already-materialized `DeploymentParams` object can be consumed through a Preprod Blockfrost client. That is an operation path, not evidence that the protocol bootstrap has been safely materialized on Preprod.

### Platform-side confirmation

The upstream platform deployment guide says its checked-in deployment record is for the local Yaci chain and that, after a reset, the protocol must be bootstrapped again through the sibling SDK. The same guide explicitly states that the current branch has **no Preprod deployment** and that a deployment must be materialized before the Preprod profile can be used.

### Consequence for IMMORTAL

The CIP-113 Preprod gate remains **OPEN**.

What is closed:

1. exact core provenance;
2. exact platform provenance;
3. exact Dummy source revision;
4. exact Dummy blueprint fingerprint;
5. exact SDK bootstrap topology;
6. separation between unsigned protocol construction and deployment orchestration.

What remains open:

1. an approved, reproducible **Preprod bootstrap procedure** for the exact pinned contract generation;
2. the real Preprod bootstrap transaction hash;
3. the real reference-script transaction hash;
4. the resulting DeploymentParams / protocol-state references;
5. observed registry state and protocol-parameter state;
6. observed Dummy token identity and transfer transaction;
7. the complete Adapter evidence packet bound to the real Preprod ledger.

No IMMORTAL economic constant, PRE-RICH rule, treasury state or V3 carrier is changed by this finding.

### Required next action

Do not construct deployment hashes from devnet records and do not adapt the local Yaci bootstrap record to Preprod.

The next technical investigation is to establish whether the pinned SDK's **exported five builders** can be driven safely by a dedicated Preprod orchestration layer using:

- a real Preprod Blockfrost/Kupmios-compatible client;
- explicit production deployment inputs for `alwaysFailNonce` and `maxInlineDatumBytes`;
- fresh three-seed UTxOs;
- explicit upgrade-multisig configuration;
- exact transaction-by-transaction observation and confirmation;
- exact recording of all resulting DeploymentParams references.

Until that path is independently verified, CIP-113 remains an Adapter research/hardening track and is not a prerequisite for the ordinary first PRE-RICH Preprod user.
