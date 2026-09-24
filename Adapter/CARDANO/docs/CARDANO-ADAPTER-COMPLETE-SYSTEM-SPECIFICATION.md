# CARDANO ADAPTER — Complete System Specification

**Role:** end-to-end integrative specification and reader guide
**Scope:** IMMORTAL Cardano Adapter
**Status:** INTEGRATIVE DOCUMENT — no new IMMORTAL or Cardano semantics
**Branch:** work/immortal-green-closure

## 1. Purpose

The Cardano Adapter is the translation, observation, realization and reporting layer between chain-neutral IMMORTAL semantics and Cardano execution.

It is not a second economic engine, the authority that decides IMMORTAL economic admissibility, the owner of PRE-RICH, or a replacement for Cardano ledger rules.

Core distinction:

```
technical feasibility ≠ economic admissibility
```

## 2. Position in the stack

```
IMMORTAL
  universal economic semantics
          ↓
CARDANO ADAPTER
  translate · observe · realize · report
          ↓
PRE-RICH / other application
          ↓
CARDANO LEDGER
```

## 3. Responsibilities

The Adapter maps generic concepts to Cardano mechanisms:

- UTxO state;
- transaction inputs and outputs;
- datum/redeemer representation;
- validators and minting policies;
- native assets;
- validity intervals;
- reference inputs;
- transaction construction;
- signing/submission where applicable;
- chain observation and normalization;
- StateBefore/StateAfter;
- execution and confirmation evidence.

It may answer: **“How can this be realized on Cardano?”**

It must not answer in its own authority: **“Therefore IMMORTAL economically allows it.”**

## 4. Authority boundary

The Adapter may observe, normalize, translate, construct, submit and report.

It must not:

- choose economically favorable outcomes;
- bypass IMMORTAL safety predicates;
- redefine ProtectedCapital or RawSurplus;
- silently reinterpret application policy;
- convert operator preference into protocol truth.

## 5. State and evidence pipeline

```
raw Cardano state
      ↓
normalized observation
      ↓
authenticated evidence
      ↓
verified input/state
      ↓
IMMORTAL / application evaluation
```

Raw observation is not automatically canonical economic state.

## 6. Transaction realization

```
application intent
      ↓
economic admissibility
      ↓
adapter realization requirements
      ↓
Cardano transaction candidate
      ↓
ledger execution
      ↓
observed result
      ↓
adapter evidence
      ↓
revalidation / conformance
```

Transaction provenance should identify consumed state, reference inputs, bound evidence, outputs, value changes, validator/redeemer path, validity interval, fees, execution result and resulting state.

A transaction reference or confirmation is chain evidence; it is not automatically full IMMORTAL conformance evidence.

## 7. Economic observation boundary

The Adapter can report UTxOs, transaction submission, observed datums, values, execution logs and resulting state.

It cannot silently convert those observations into an IMMORTAL admission decision.

## 8. Multi-asset settlement and oracles

Alternative-asset settlement must preserve applicable economic value:

```
verified asset identity
+
valid/fresh conversion evidence
+
deterministic conversion
+
value preservation
```

Cardano cannot inherently know arbitrary external state.

An adapter may transport external/oracle evidence, but the active verification mechanism decides whether the evidence is authoritative.

## 9. Transition evidence

The Adapter distinguishes:

```
CardanoObservedTransitionEvidence
        =
ledger / environment fact
```

from:

```
CanonicalTransitionEvidence
        =
verified relation to canonical economic transition
```

The former cannot be silently substituted for the latter.

## 10. Refinement boundary

For implementation/adapter state σ and canonical state S:

```
ρ(σ,S)
```

The refinement relation demonstrates that a concrete Cardano realization corresponds to the intended canonical action and resulting state.

A technically similar transaction is not sufficient for semantic equivalence.

## 11. IMMORTAL ↔ Cardano equivalence

The repository treats V3 ↔ Cardano equivalence as a conformance obligation.

Relevant action boundaries include:

- Issue;
- Reveal;
- Claim;
- Expire.

Cardano may impose additional environment predicates such as ownership, signatures, settlement conversion, validity windows or execution-liquidity constraints.

Those constraints belong in an explicit refinement/execution envelope rather than silently replacing the chain-neutral model.

## 12. Ledger-native evidence

The intended high-confidence path is:

```
exact transaction CBOR
+
exact consumed UTxOs
+
exact protocol parameters
+
EpochInfo
+
SystemStart
      ↓
typed Ledger context
      ↓
evalTxExUnitsWithLogs
      ↓
per-redeemer exunits / logs / failures
      ↓
persistent report
```

Missing or ambiguous typed context must fail closed.

A dependency build alone is not Ledger conformance proof.

## 13. P2.8

P2.8 is an Adapter/evidence subsystem:

```
Yaci / recorded evidence
        ↓
typed materialization
        ↓
real Ledger evaluator
        ↓
reproducible report
        ↓
conformance evidence
```

It must not synthesize missing context merely to obtain a green result.

## 14. Safety and liveness

The Adapter may provide observation, discovery, wake-up, transaction construction, submission, retry and status reporting.

It may not choose a result, bypass an economic gate, rewrite a payout, reclassify obligations or become protocol truth.

```
Liveness mechanism ⊆ admissible execution paths
Liveness mechanism ≠ economic authority
```

## 15. Fail-closed behavior

The Adapter must not guess when required evidence is missing, contradictory or ambiguous.

Examples include missing UTxOs, ambiguous protocol parameters, missing EpochInfo/SystemStart, unverifiable oracle binding, malformed transition evidence, unknown asset identity or incomplete refinement relation.

The outcome is an explicit evidence/realization gap or safe stall.

## 16. Source map

- Adapter/CARDANO/docs/ADAPTER-SPECIFICATION.md
- Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts
- Adapter/CARDANO/runtime/EconomicAdmission.ts
- Adapter/CARDANO/serialization/CanonicalEconomicState.ts
- Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts
- Adapter/CARDANO/observation/CardanoObservedTransitionEvidence.ts
- Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts
- IMMORTAL/docs/V3-CARDANO-SEMANTIC-EQUIVALENCE.md
- audit/cardano-ledger-runner/

**This document is an integrative specification, not a new source of truth.**
