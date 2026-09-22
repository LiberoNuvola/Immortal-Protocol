# Materios authority-selection proof contract

## Purpose

IMMORTAL/PRE-RICH must not reproduce the Materios authority-selection algorithm in TypeScript.

The trust boundary is:

`Materios Rust execution` -> `authenticated selection evidence` -> `VerifiedAuthoritySetTransition`

The TypeScript side may validate bindings and consume a proof artifact, but it must not recompute candidate filtering, weighting, ordering, seeding, weighted selection, deduplication, or the safety floor.

## Upstream execution anchor

Current upstream Materios `main` selection entry point:

`partnerchain/vendor/authority-selection-inherents/src/select_authorities.rs`

Current upstream commit observed during triangulation:

`0c57e2da6a6d5dbd63ee6e535eebcb0735e7699d`

The runtime calls the selector with:

- `Sidechain::genesis_utxo()`
- `AuthoritySelectionInputs`
- `sidechain_epoch`

The selector itself performs, in order:

1. trustless-candidate validation against `genesis_utxo`;
2. permissioned-candidate validation;
3. D-parameter/stake-derived weights;
4. deterministic candidate ordering;
5. seed derivation from `epoch_nonce + sidechain_epoch`;
6. committee-size calculation;
7. weighted selection or the upstream force-include path;
8. output deduplication;
9. `MIN_DISTINCT_COMMITTEE` safety floor;
10. committee materialization.

These semantics belong to the Materios implementation, not IMMORTAL.

## Required authentic proof artifact

A future transition proof must bind all of the following exact values:

- upstream Materios commit;
- exact serialized `AuthoritySelectionInputs` bytes;
- exact `genesis_utxo` bytes;
- exact `sidechain_epoch`;
- exact `epoch_nonce` as contained in the serialized inputs;
- exact candidate set represented by those bytes;
- exact D-parameter represented by those bytes;
- exact `toAuthorities` produced by the Rust execution;
- selector result status (`Some` committee or `None` fallback);
- the proof/attestation format and verifier.

The artifact must be generated from an actual Rust execution of the upstream selector. A hand-written TypeScript recreation, a fixture whose expected committee was guessed, or a test double returning `true` is not sufficient.

## Acceptance test

The first real authority-transition fixture should assert:

`hash(serialized selection inputs)` == `selectionInputsHash`

and independently establish that the authenticated Rust execution maps:

`(genesis_utxo, exact AuthoritySelectionInputs, sidechain_epoch)`

to the declared `toAuthorities`.

The IMMORTAL transition verifier then binds that authenticated result into the existing `VerifiedAuthoritySetTransition`.

## Negative tests

The proof gate must fail closed if any of these are changed without regenerating the authentic proof:

- one byte of `selectionInputs`;
- `selectionInputsHash`;
- `genesis_utxo`;
- `sidechain_epoch`;
- candidate ordering/content;
- D-parameter;
- epoch nonce;
- declared `toAuthorities`;
- upstream execution/proof identity.

## Current status

The structural boundary already exists in `poc/materios-grandpa/src/authority-transition.ts`.

Its current `AuthoritySetTransitionProofVerifier` is deliberately only an interface. The repository must not promote the existing `verify: () => true` test double to production evidence.

This document closes the architecture contract for the next implementation step: produce and verify the first authentic Rust-generated Materios selection vector, then connect it to the existing transition boundary.
