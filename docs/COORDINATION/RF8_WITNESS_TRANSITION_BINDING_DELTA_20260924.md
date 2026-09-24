# IMMORTAL — RF8 Witness-to-Transition Binding Delta 2026-09-24

## Finding

The previous RF8 work established that canonical PRE-RICH economic orchestrators cross `submitEconomic`.

A deeper inspection showed that `EconomicAdmissionWitness` previously carried:

- gate version
- decision reference
- authoritative observation reference
- a single `stateHash`
- EEV
- executable liquidity observation
- authenticated pool reference/value
- immediate liquidity requirement

but it did **not** explicitly identify the canonical economic action or candidate post-state.

Therefore, the witness was a strong submission/admission boundary but did not by itself prove:

`Economic Gate decision -> exact canonical action -> exact pre-state -> exact candidate post-state`.

## Hardening applied

File:

`Adapter/CARDANO/runtime/EconomicAdmission.ts`

Commit:

`157cf0fdd39cc9a5d33cd9a561b769c81da7e487`

Added required witness fields:

- `actionClass`
- `actionFingerprint`
- `postStateHash`

The existing `stateHash` is explicitly documented as the canonical V3 pre-state fingerprint.

The adapter now fail-closes when:

- action class is absent;
- action fingerprint is absent;
- post-state fingerprint is not a 32-byte hex digest.

## Regression evidence

Updated:

`src/__tests__/economic-admission-input-binding.test.ts`

Commit:

`8f6d3ed78636a49ecb6c6662bdd41229e331f738`

New tests reject:

- an admission with no canonical action fingerprint;
- an admission with an invalid post-state fingerprint.

## Important limitation

This does **not** yet prove that the hashes themselves are correctly computed from the canonical V3 state/action.

It only closes the structural omission:

> an economic admission must explicitly name the canonical action, pre-state and candidate post-state.

The next evidence requirement is therefore **hash provenance**, not another field:

1. identify the authoritative canonical V3 state fingerprint function;
2. identify the canonical action fingerprint function;
3. identify the candidate post-state derivation;
4. prove the witness values equal those canonical computations;
5. then bind the witness to the concrete validator transition and transaction evidence.

The existing `CanonicalTransitionEvidence` subsystem already requires:

- action fingerprint;
- pre-state fingerprint;
- post-state fingerprint;
- transaction reference.

It should be reused as evidence vocabulary rather than introducing a second incompatible semantic.

## Status

RF8-A submission boundary: **STRONG IMPLEMENTATION + REGRESSION**

RF8-B witness structural binding: **IMPLEMENTED + REGRESSION**

RF8-B semantic hash provenance/refinement: **OPEN**

No economic constants or economic rules were changed.
