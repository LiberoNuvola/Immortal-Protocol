# Materios Authority-Selection Proof Contract

> Non-normative proof-boundary contract for the IMMORTAL/Materios integration.
> This document does not implement or reimplement the Materios selector.

## Purpose

The proof boundary must establish that an advertised Materios authority set is the result of the authoritative Materios authority-selection procedure for one exact selection context.

IMMORTAL authenticates the resulting transition; it does not independently recompute the Materios committee-selection algorithm.

## Bound statement

A valid authority-selection proof MUST bind, at minimum:

- the proof-system identity/version;
- the chain/runtime identity;
- the exact genesis_utxo context used by the authoritative selector;
- the exact serialized AuthoritySelectionInputs bytes, or an unambiguous commitment to those bytes;
- the Cardano epoch nonce used by the selector;
- the sidechain epoch;
- the resulting authority set;
- the predecessor authority set, when the proof represents an authority-set transition;
- the activation block/height and set identifiers required by the surrounding transition protocol.

The proof verifier MUST reject a statement when any bound context is absent, malformed, inconsistent, or incompatible with the expected proof system.

## Authority boundary

The authoritative selector remains external to IMMORTAL.

The intended flow is:

Materios authoritative selector -> authenticated proof/attestation -> VerifiedAuthoritySetTransition -> IMMORTAL finality/authority consumers

IMMORTAL MUST NOT replace the selector with a TypeScript implementation merely to make the proof executable.

A structural proof object or test double is evidence of the boundary shape only. It is not evidence that the real Materios selector produced the advertised authority set.

## Exact-input requirement

The proof producer must execute against the same semantic input domain used by the authoritative Materios runtime. In particular, the proof must not silently substitute:

- a locally reconstructed candidate list;
- a different genesis context;
- a different epoch nonce;
- a different sidechain epoch;
- a different runtime/profile configuration;
- or a simplified weighting/sampling rule.

If canonical serialization is required, the serialization format and version must itself be bound by the proof-system identity.

## Verification result

The only production-consumable result is a branded/typed verified transition equivalent to the repository's existing VerifiedAuthoritySetTransition boundary.

Unverified statements, synthetic vectors, and test doubles MUST remain outside that trust boundary.

## Current status

This contract closes the specification of the proof boundary, not the proof itself.

Still required for real Materios evidence:

1. authoritative selector execution from the canonical Rust/WASM/runtime implementation;
2. an authenticated proof or independently verifiable attestation;
3. a real finalized-block/authority-set fixture;
4. verification that the authenticated output becomes the repository's VerifiedAuthoritySetTransition;
5. replay evidence tying the proof to the exact bound selection context.

Until those artifacts exist, Materios authority-selection/finality provenance remains OPEN.

## Non-goals

This document does not:

- define new Materios economics;
- define a new authority-selection algorithm;
- authorize IMMORTAL to select authorities;
- treat verify(){ return true; } test doubles as production verification;
- promote synthetic GRANDPA evidence to real Materios evidence.
