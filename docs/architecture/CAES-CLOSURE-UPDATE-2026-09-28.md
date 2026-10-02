# CAES Closure Update — 2026-09-28

**Branch:** `work/immortal-green-closure`  
**Status:** ARCHITECTURAL / EVIDENCE UPDATE  
**Related:** `docs/architecture/CAES-CONFORMANCE-MATRIX.md`

## Finding

The CAES closure review initially identified Economic Gate → Cardano execution as an apparently open integration boundary.

Inspection of the current implementation shows that the boundary is already materially implemented in two layers:

1. `PRE-RICH/profile/PreRichEconomicAdmission.hs`
   - validates the structural V3 transition;
   - constructs the candidate post-state;
   - projects it into the application-neutral universal economic state;
   - consumes explicit EEV, executable-liquidity and verification inputs;
   - invokes the universal `executionAdmissible` boundary.

2. `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`
   - requires an explicit `EconomicAdmissionWitness` for economically material submission;
   - fails closed before signing when admission is absent or invalid;
   - checks action class, state fingerprints, authenticated liquidity and source inputs.

The runtime therefore already enforces:

```
Economic admission witness
        ↓
Cardano submission
```

without making the adapter an economic authority.

## Remaining distinction

The missing piece is not the existence of an Economic Gate.

The remaining proof boundary is the **producer-to-consumer provenance chain**:

```
canonical V3 transition
        ↓
Pre-RICH economic admission
        ↓
EconomicAdmissionWitness
        ↓
canonical transition evidence
        ↓
Cardano economic submission
        ↓
observed settlement
```

The repository already contains the evidence-layer bridge:

`Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts`

It verifies that the admission witness and canonical evidence agree on:

- action class;
- pre-state fingerprint;
- candidate post-state fingerprint.

## New conformance test

Added:

`src/__tests__/caes-transition-closure.test.ts`

The test composes:

1. `EconomicAdmissionWitness`;
2. `CanonicalTransitionEvidence`;
3. evidence binding;
4. Cardano `submitEconomic()`.

It also verifies that a divergent canonical post-state fingerprint stops the composed flow **before signing**.

Commit:

`875add012ef194a2c1761df99fb47ad5bb57ed72`

## What this closes

### CAES-C1 — Economic Gate integration

**Status: SUBSTANTIALLY IMPLEMENTED**

The universal gate exists and PRE-RICH admission consumes it before constructing an admission witness.

### CAES-C5 — Atomic Cardano admission boundary

**Status: PARTIAL → STRONGER TESTED BOUNDARY**

The Cardano adapter cannot economically submit without a valid admission witness. The new composition test additionally verifies evidence binding before submission.

### CAES-C6 — Provenance

**Status: PARTIAL**

Admission/evidence identity binding is now explicitly exercised in one composed test.

## What remains genuinely open

### CAES-C2 — Concrete Kc

Still requires a real CK1–CK8 certificate for the deployment.

### CAES-C3 — Ω completeness

Still an adapter/deployment obligation.

### CAES-C4 — Concrete refinement

`RefinementV3.refinementExact` exists, but actual ledger-derived witness production must be demonstrated.

### CAES-C5 — Full atomic equivalence

The new test is a software-boundary composition test. It does **not** prove Cardano ledger semantics, Plutus execution, or observed transaction equivalence.

Required next evidence remains:

```
canonical candidate
    ↔ Economic Gate
    ↔ admission witness
    ↔ concrete Cardano transaction
    ↔ validator execution
    ↔ observed post-state
```

### CAES-C8 — Closed-loop recomputation

Still needs an observed successor to be fed back into the canonical state/refinement/viability pipeline.

## Important architectural conclusion

Do **not** add another CAES module.

Do **not** move economic formulas into the Cardano adapter.

Do **not** put ETO inside the economic authority layer.

The correct remaining work is evidence closure at the existing boundaries.
