# CIP-113 PRE-RICH — Preprod Readiness

**Status:** ADAPTER RESEARCH / NOT YET DEPLOYED  
**Date:** 2026-09-30  
**Scope:** Cardano Adapter only

## Decision

CIP-113 is **not yet a PRE-RICH Preprod dependency**.

The Adapter boundary is implemented, but a real CIP-113 ledger experiment must not begin by guessing validator hashes, registry nodes, protocol-parameter UTxOs, deployment identities, or substandard semantics.

The external CIP-113 platform currently describes itself as research and development, with limited Preview testing and no production-readiness claim. Therefore the next step is evidence acquisition, not an invented deployment.

## Existing PRE-RICH Preprod surface

The repository already has:

- 'NETWORK = Preprod';
- Blockfrost Preprod configuration;
- PRE-RICH policy identity;
- V3 carrier deployment identity inputs;
- Treasury / Pool / PrizeValidator / BeaconRegistry artifacts;
- existing Yaci/Cardano evidence traces;
- Adapter evidence binding.

These remain valid independently of CIP-113.

## Required CIP-113 inputs before real deployment

A real experiment requires all of the following to be obtained from the current CIP-113 implementation and bound to the exact testnet deployment:

1. **Core implementation revision** — exact repository commit, exported validator artifacts, and toolchain assumptions.
2. **Substandard** — exact PRE-RICH token substandard, transfer logic, issuance logic, and explicit ThirdPartyAct policy.
3. **Deployment identity** — exact protocol deployment identity and global validator/registry credentials.
4. **Registry state** — exact registry node/reference input, token policy/asset name, and transfer-logic reference.
5. **Protocol parameters** — exact CIP-113 parameter reference and upgrade-authority identity.
6. **Ledger evidence** — transaction CBOR/hash, reference inputs, outputs, execution success/costs, and network identity.

## PRE-RICH safety rules

The first real experiment must be deliberately narrow:

- no ThirdPartyAct;
- no freeze/seize semantics;
- no economic state mutation through CIP-113;
- no change to IMMORTAL economic predicates;
- no change to PRE-RICH payout/liability rules;
- CIP-113 upgrade authority cannot become economic authority;
- mint/burn must remain bound to the canonical PRE-RICH economic transition;
- Unfracking, if tested, must preserve owner and token quantity;
- stale registry/protocol-parameter evidence must fail closed.

## First transaction target

The first ledger experiment should be a minimal programmable PRE token transfer with one token policy, one asset, one holder transition and one current registry node, with no economic transition.

The question is simply: can the Cardano Adapter observe and prove that CIP-113 enforced the declared programmable-token rule on the real ledger?

Only after this passes should CIP-113 be connected to an economically meaningful PRE-RICH operation.

## Acceptance evidence

The Adapter must persist and reproduce the binding of:

    deployment identity
    + core revision
    + substandard revision
    + registry node
    + protocol-parameter state
    + token identity
    + transfer logic
    + transaction
    + ledger context

## Current blocker

The blocker is **not PRE-RICH architecture**. The blocker is obtaining a reproducible, exact CIP-113 deployment/substandard state suitable for a real ledger experiment.

Until that evidence exists, the existing Adapter boundary and tests are the correct maximum level of integration.

## Non-regression

This document does not modify IMMORTAL economics, PRE-RICH Game Economy, constitutional dependencies, or the first PRE-RICH Preprod path, and does not claim CIP-113 production readiness.


## Verified deployment-path triangulation — 2026-09-30

The upstream platform deployment guide and the referenced TypeScript SDK were inspected together.

The SDK revision inspected was `1f15296380c46de32ea85668951397e8868815c8` in `easy1staking-com/cip113-sdk-ts`. It contains the canonical five exported unsigned bootstrap builders and a `bootstrapProtocol` orchestration harness.

The important distinction is that the exported builders are network-agnostic transaction construction primitives, while the `test/harness/bootstrap.ts` orchestration is explicitly **devnet-only**. It performs Yaci-specific funding/indexer settling and refuses non-testnet execution in that harness.

The SDK does expose `preprodChain` and documents consuming an already-materialized `DeploymentParams` through a Preprod Blockfrost client. That proves the runtime/client path, but **does not prove a supported Preprod bootstrap path**.

The upstream platform guide independently states that its checked-in bootstrap record is for the local Yaci chain and that the current branch has no Preprod deployment record.

### Result

The readiness gate remains:

**OPEN — Preprod deployment materialization not yet proven.**

The next step is not to copy/adapt the Yaci bootstrap record. It is to build and verify a dedicated Preprod orchestration around the exact exported builders, with production-selected security inputs and fresh Preprod UTxOs, then independently observe every submitted transaction.

No PRE-RICH economic transition belongs in that experiment.
