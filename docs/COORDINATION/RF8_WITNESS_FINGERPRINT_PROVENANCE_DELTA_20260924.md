# IMMORTAL — RF8 Witness ↔ Transition Evidence Delta 2026-09-24

## Triangulation result

The authoritative kernel path exists in:

- `IMMORTAL/kernel/EconomicGate.hs`
- `PRE-RICH/profile/PreRichEconomicAdmission.hs`
- `IMMORTAL/kernel/EconomicTransitionV3.hs`
- `IMMORTAL/conformance/RefinementV3.hs`

The actual canonical sequence is present:

`pre-state → transition → candidate V3 → PRE-RICH projection → UniversalEconomicState → EconomicGate → viability → admission`

The Haskell admission result explicitly carries:

- canonical action;
- candidate V3 state;
- candidate universal state;
- pre/candidate EEV;
- executable liquidity;
- immediate liquidity requirement.

## Critical gap recovered

There is currently **no repository function that canonically computes the SHA-256 fingerprints** required by the TypeScript:

- `EconomicAdmissionWitness.stateHash`
- `EconomicAdmissionWitness.actionFingerprint`
- `EconomicAdmissionWitness.postStateHash`

The evidence layer `CanonicalTransitionEvidence` consumes these fingerprints but does not compute them.

Therefore the current TS witness fields are identifiers that must be sourced from an authoritative producer; they are not proof merely because they match the required syntax.

No guessed serializer/hash function was introduced.

## New bridge

Added:

`Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts`

Commit:

`865f5e9f8fc477878fd45b15901a11ddff4899ba`

It verifies that a persisted `CanonicalTransitionEvidence` record matches the economic admission witness on:

- action class;
- canonical pre-state fingerprint;
- candidate post-state fingerprint.

This creates an explicit evidence bridge without claiming to compute canonical hashes.

Regression tests added:

`Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.test.ts`

Commit:

`59b91f2bae9a5cb1f95911035cffc5e8d4d9f4d1`

Tests reject action, pre-state and post-state mismatches.

## Packet alignment

Updated:

`audit/transition-evidence/PRE-RICH-REVEAL-GOLDEN-PACKET.md`

to require the newly explicit witness fields:

- canonical V3 pre-state fingerprint;
- action class;
- action fingerprint;
- canonical V3 candidate post-state fingerprint.

Commit:

`3a8969cdb6212f7950cd732c00c0094fe24e5b81`

## What is now proven

1. The authoritative Haskell admission path computes the candidate state and runs the Economic Gate / viability composition.
2. The Cardano runtime requires an explicit economic admission before economic submission.
3. The witness structurally carries action + pre-state + post-state identifiers.
4. Persisted canonical transition evidence can now be checked against those same identifiers.
5. Regression tests cover mismatches.

## What remains open

### RF8-B semantic fingerprint provenance

Still required:

`authoritative V3 state/action → canonical serialization → fingerprint`

The repository currently does not expose that chain as an executable function.

### RF8-C concrete refinement

Still required:

`admission → exact PRE-RICH action → exact Cardano validator transition → observed transaction`

### RF8-D ledger packet

Still required for closure:

- signed transaction;
- raw ledger observation;
- datum/redeemer context;
- evaluator evidence;
- reconstructed post-state;
- equality with the canonical post-state identifier.

## Status

RF8-A submission boundary: **STRONG**

RF8-B structural witness binding: **IMPLEMENTED + REGRESSION**

RF8-B canonical fingerprint provenance: **OPEN**

RF8-C validator refinement: **OPEN**

RF8-D real-ledger evidence: **OPEN**

No economic rule, constant, or state ownership decision was changed.
