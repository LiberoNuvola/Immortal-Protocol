# Multi-Oracle Currentness Authority — Existing Surface Audit

Status: **READ-ONLY ARCHITECTURE AUDIT / NON-NORMATIVE**
Date: 2026-10-29
Branch: `work/immortal-green-closure`
Purpose: identify reusable repository surfaces for current registry-state authority without changing the existing Oracle State, V3, Reveal, or production consumers.

## Executive finding

The current Cardano Oracle State singleton is useful evidence that the deployed quote UTxO is live, but it is **not a suitable authority for a multi-oracle registry's current version or revocations**.

The inspected bootstrap creates the Oracle State asset under a native minting policy requiring the deployment wallet signature and places the singleton at the wallet address:
`audit/cardano-integration/preprod-direct-oracle-state-bootstrap.mjs`.

Its liveness observer explicitly requires `authorityKind: DEPLOYMENT_WALLET_SIGNED`, verifies a unique live singleton and exact UTxO reference, and classifies the existing quote timestamp. It explicitly records that external price-source truth is not proven by the datum alone:
`audit/cardano-integration/preprod-oracle-state-liveness.mjs`.

The observation pipeline also marks `externalPriceSourceVerified: false` and `configuredPublisherTrustIndependentlyEliminated: false`:
`audit/cardano-integration/observe-preprod-oracle-quote-set.mjs`.

The existing datum shape in `Adapter/CARDANO/observation/OracleTypes.hs` remains either the five-field legacy quote or `OracleQuoteSet [OracleQuote]`. The additive quote set is for multiple assets in one singleton UTxO, not a versioned registry state machine. `plutus/Economic.hs` authenticates a configured singleton quote and checks one configured publisher/freshness rule; it does not consume a registry sequence, registry digest, activation history or revocation overlay.

**Conclusion:** do not repurpose or extend the existing Oracle State datum to smuggle registry-currentness semantics into the deployed quote path. A separate Cardano adapter-level currentness state is the leading on-ledger candidate to evaluate, not an approved change.

## Candidate comparison

### Candidate A — dedicated Cardano registry singleton UTxO

A separate state object could hold:
- a dedicated singleton asset identity;
- immutable schema/policy version;
- canonical registry sequence, version and digest;
- the active source/feed identities, or a digest/root binding to a versioned registry artifact;
- current source/feed/policy revocation tombstones;
- a deterministic transition version and evidence reference.

A dedicated validator would lock the singleton and allow updates only through a defined state transition. For an update from state (S_n) to (S_{n+1}), the transition would require exactly one old registry input, exactly one successor registry output, the same singleton asset, the expected script/address binding, and a strictly increasing sequence. The successor's canonical payload digest must bind the exact registry version and revocation state.

A consumer transaction would include the exact live registry UTxO as a reference input and validate its singleton token, datum schema, policy version, sequence and digest against its expected contract. Once the old registry UTxO has been spent in a valid update, it is no longer an available reference input on the canonical ledger, which gives ledger-level protection against using that consumed state as the current head.

Limits and open points:
- A singleton asset alone is insufficient: without a validator locking the UTxO and enforcing successor-state rules, the asset can be moved without preserving registry semantics.
- On-chain uniqueness/currentness does not itself authenticate the off-chain source observations.
- The state transition still needs an explicit authorization rule for adding sources and applying revocations. A wallet signature alone is not permissionless.
- Off-chain reads through a hosted indexer are observations, not independent proofs of canonical state. Production admission should ultimately bind registry state into the transaction context, or the off-chain provider must verify a suitable chain-state proof.
- Script size, transaction size, datum size, and execution budget require measurement before any consumer integration.

### Candidate B — reuse the existing Oracle State singleton

Rejected as the default design. Its minting and authority semantics are deployment-wallet-signed; its datum has quote semantics rather than registry version/revocation state; the present consumer interface is configured-publisher-based. Changing it would risk conflating source-price authority, registry administration and protocol valuation. This would also violate the current non-regression rule to preserve deployed Oracle State semantics until a separate migration is approved.

### Candidate C — off-chain signed currentness service

This can fit the new `currentnessProvider` interface, but a signature plus a monotonic database is not intrinsically permissionless. It adds operator availability, key lifecycle, durable rollback protection, and current-revocation trust assumptions. Treat it as an explicit fallback only, not as the trustless default. The process-local high-water mark in `multiOracleRegistrySnapshot.js` is only defence-in-depth and resets on restart.

### Candidate D — proof-backed currentness of external registry state

An adapter could verify a proof, light-client witness or governed attestation binding the latest registry sequence/digest and revocation state. This can be more permissionless than a trusted service only if the verifier establishes the relevant canonicality/finality and the attestation's authority is explicit. Feasibility depends on the chosen source system and proof format; none is selected here.

## Recommended evaluation order

Consistent with the project's trust-minimizing approach, evaluate:
1. a dedicated ledger-bound registry singleton with a validator that enforces unique state transitions, provided its source-activation/revocation authorization can be defined without a hidden privileged authority;
2. a verifiable external-state proof/light-client path if currentness is sourced outside Cardano;
3. an explicitly governed attestation path if proof verification is infeasible;
4. a trusted currentness service with durable monotonic state only as a disclosed fallback.

Candidate A is **not yet approved**. Do not create or deploy a new registry contract, mint a new singleton, change an existing address/policy, or wire protocol consumers as part of this audit.

## Minimum acceptance vectors before production wiring

- no registry singleton, more than one apparent singleton, wrong policy/token identity, wrong script address or malformed datum: reject;
- consumed old state referenced after a registry update: cannot validate as the current head;
- sequence unchanged or decreasing across a state update: reject;
- same sequence but different version/digest: reject;
- registry digest not matching the canonical signed/committed payload: reject;
- inactive/revoked source/feed/policy tuple: reject even if its source signature is otherwise valid;
- revocation disappears under the same policy/version: reject unless a separately governed reactivation transition is defined;
- unauthorized update, duplicate source/feed tuple, missing currentness evidence or unverified source proof: reject;
- current registry state unavailable or ambiguous: fail closed;
- repeat the state-transition and currentness vectors through Cardano ledger-level tests and measure CBOR size/execution budget.

## Non-regression

This audit does not alter `OracleTypes.hs`, `Economic.hs`, `MintPolicy.hs`, `B1PrizePool.hs`, `PrizeValidator.hs`, the deployed Oracle State, V3, Reveal, EEV, Issue Admission or the universal IMMORTAL kernel. It activates no source, selects no quorum/aggregation policy, specifies no USD/USDM conversion, and performs no on-chain operation.

The next implementation decision is the authority mechanism for a *new* registry state, with its update authorization made explicit. Only after that decision should a dedicated test harness be built; production consumer wiring comes later.
