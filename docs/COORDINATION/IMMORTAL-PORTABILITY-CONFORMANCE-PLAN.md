# IMMORTAL — Cross-Environment Portability & Conformance Plan

**Classification:** non-normative research / coordination
**Date:** 2026-10-03
**Branch context:** `work/immortal-green-closure`
**Status:** planned research track — not a release gate

> This document does not change IMMORTAL economic semantics, PRE-RICH policy, Cardano semantics, or any existing trust model.
>
> Its purpose is to define how portability can be demonstrated progressively rather than asserted.

## 1. Objective

IMMORTAL is specified at a chain-neutral economic layer. Cardano is the first concrete execution environment.

The objective of this track is to demonstrate that the same settled IMMORTAL economic semantics can be realized in a materially different execution environment without copying Cardano-specific assumptions into the kernel.

The target proof is:

```text
same economic semantics
        ↓
same canonical test vector
        ↓
different execution model
        ↓
different adapter realization
        ↓
same admissibility / post-state result
```

This is a conformance experiment, not a second product launch.

## 2. Existing architectural boundary

The repository already defines the intended separation:

```text
Application Profile
        ↓
IMMORTAL
        ↓
Chain Adapter
        ↓
Concrete Ledger / Execution Environment
```

The Cardano Adapter is one realization of the chain boundary. A second environment must introduce a second adapter, not a second economic kernel.

The application profile remains orthogonal to the chain adapter.

## 3. What this track must prove

The first target is deliberately small.

### L0 — Specification

The relevant IMMORTAL rules can be stated without:

- UTxO assumptions;
- Plutus assumptions;
- Cardano transaction encoding;
- Cardano-specific datum/redeemer structure;
- application-specific PRE-RICH parameters.

### L1 — Adapter obligations

Define the minimum contract that every adapter must satisfy:

1. represent the canonical economic state;
2. represent the relevant economic action/transition;
3. expose the pre-state required for admission;
4. execute or simulate the concrete transition;
5. observe the resulting state/facts;
6. produce normalized evidence;
7. bind the observed result back to the canonical transition;
8. fail closed when required evidence is missing or ambiguous.

### L2 — Reference conformance model

Create a deterministic, chain-independent reference model.

The reference model is the comparison oracle for conformance testing. It must not depend on Cardano SDKs, Plutus libraries, EVM libraries, RPC providers, or chain-specific serialization.

### L3 — Minimal second adapter

Implement only enough of a second adapter to exercise one or two universal economic transitions.

The initial scope should be deliberately smaller than PRE-RICH.

Candidate transition classes:

- obligation admission;
- ProtectedCapital / RawSurplus boundary;
- deterministic post-state safety;
- expiry finality, if the universal semantics are sufficiently isolated.

No second Scratch & Win implementation is required for L3.

### L4 — Cross-environment evidence

Run identical conformance vectors against:

- the chain-independent reference model;
- the existing Cardano realization where applicable;
- the second execution environment.

A vector passes only when the normalized economic result agrees.

## 4. Required adapter interface

The exact API is implementation work, but the conceptual interface is:

```text
CanonicalState
    ↓
AdmissionInput
    ↓
admit(state, action)
    ↓
AdmissibilityResult
    ↓
RealizationRequest
    ↓
execute / simulate
    ↓
ObservedTransition
    ↓
Evidence
    ↓
normalize
    ↓
ConformanceResult
```

The adapter MUST NOT:

- invent economic rules;
- alter an inadmissible transition into an admissible one;
- replace the reference economic model;
- silently fill missing evidence;
- promote application policy into universal semantics.

The adapter MAY:

- choose chain-specific transaction structures;
- select chain-specific inputs/resources;
- encode/decode state;
- handle chain-specific fees and validity constraints;
- observe execution;
- report technical realization failures.

## 5. Canonical conformance object

The cross-environment comparison should operate on normalized facts rather than raw transactions.

Conceptually:

```text
ConformanceCase {
  caseId
  preState
  action
  expectedAdmission
  expectedPostState
  expectedObligations
  expectedProtectedCapital
  expectedRawSurplus
  expectedFinalityFacts
}
```

The actual schema must be derived from the existing canonical state and conformance specifications. This document does not redefine those structures.

Raw chain artifacts remain evidence, not the cross-chain comparison format.

## 6. First vector family

Do not start with PRE-RICH Sale/Reveal/Claim.

Start with the smallest universal economic facts that are already sufficiently settled.

### Vector A — Protected capital boundary

Input:

```text
EEV
ProtectedCapital
candidate transition
```

Expected:

```text
RawSurplus = max(0, EEV - ProtectedCapital)
```

The vector must include both:

- a state with surplus;
- a state where protected capital consumes all available EEV.

### Vector B — Liability-first admission

Construct a state where a candidate transition would create an obligation.

Expected behavior:

- existing protected obligations remain accounted for first;
- the candidate transition is accepted only if the resulting state satisfies the universal admissibility predicates;
- otherwise the transition fails closed.

### Vector C — Expiry finality

Where expiry is part of the universal transition semantics:

- pre-expiry action is evaluated normally;
- post-expiry action cannot resurrect an expired economic right;
- the normalized post-state must show finality.

The concrete ticket duration remains application policy and is not part of this vector.

## 7. What must remain out of scope

This track must NOT initially attempt:

- a second PRE-RICH deployment;
- multi-chain marketing claims;
- token bridging;
- shared liquidity;
- cross-chain jackpot operation;
- cross-chain governance;
- B3/Materios implementation;
- replacement of the Cardano adapter;
- changes to KA/KC/KD;
- changes to PRE-RICH price ladder;
- changes to 500× payout policy;
- new IMMORTAL economic primitives merely to make another chain easier.

A second adapter that requires changing the economic kernel is evidence of an architectural question, not permission to change the kernel.

## 8. Choosing the second environment

Selection should be based on architectural contrast, not popularity.

The preferred research target is an account-based execution model, because it tests whether the IMMORTAL semantics survive a materially different state representation and transaction model.

The environment is not selected by this document.

Selection criteria:

1. materially different state model from Cardano;
2. deterministic local execution/testing;
3. reproducible state snapshots;
4. accessible execution evidence;
5. ability to implement a minimal adapter without introducing a second economic engine;
6. low enough operational cost that conformance tests can run repeatedly.

## 9. Evidence levels

Use the following vocabulary:

| Level | Evidence | Claim supported |
|---|---|---|
| L0 | chain-neutral specification | semantics are specified independently |
| L1 | adapter obligations | boundary is explicitly defined |
| L2 | reference vectors | semantics are executable independently |
| L3 | second adapter | portability is experimentally demonstrated |
| L4 | repeated cross-environment evidence | conformance is reproducibly demonstrated |

Do not describe L0/L1 as multi-chain evidence.

Do not describe L3 as production readiness.

## 10. Failure classification

A cross-environment failure must be classified before any change is proposed.

| Failure | Interpretation |
|---|---|
| Reference model rejects | Economic/reference-model result |
| Adapter rejects valid case | Adapter implementation gap |
| Ledger cannot realize admitted case | Technical realization limitation |
| Observed state differs | Conformance failure |
| Evidence is incomplete | Evidence gap / fail-closed |
| Only Cardano encoding differs | Expected adapter-specific difference |
| Universal semantics require chain-specific exception | Architecture question; do not patch kernel reflexively |

The final row is particularly important: portability testing is intended to reveal accidental chain assumptions.

## 11. Success condition

The first meaningful success condition is NOT:

> “IMMORTAL runs on another chain.”

It is:

> “A settled chain-neutral economic transition can be evaluated by the reference model and independently realized by two different adapters, with equivalent normalized economic results and separately inspectable execution evidence.”

That is a much narrower and stronger claim.

## 12. Work sequence

```text
NOW
 │
 ├─ A. Freeze current Cardano work
 │
 ├─ B. Define adapter obligations
 │
 ├─ C. Extract chain-neutral reference vectors
 │
 ├─ D. Implement reference-model runner
 │
 ├─ E. Select second environment
 │
 ├─ F. Implement minimal adapter
 │
 ├─ G. Run identical vectors
 │
 └─ H. Publish evidence package
```

The Cardano V3 closure remains independent of steps E–H.

## 13. Repository placement

Initial artifacts should live under:

```text
docs/COORDINATION/
  IMMORTAL-PORTABILITY-CONFORMANCE-PLAN.md

research / reference-model implementation:
  separate from normative economic sources

conformance vectors:
  shared, deterministic, versioned artifacts

second adapter:
  isolated under the adapter boundary
```

The work must not be inserted into `docs/00-normative/` until an explicit normative decision says that the corresponding adapter obligations or semantics are authoritative.

## 14. Relationship to current Cardano closure

This research track is parallel work.

It does not block:

- V3 carrier execution;
- Cardano Preprod Issue/Reveal evidence;
- P2.8;
- B1 hardening;
- Genesis evidence;
- current Cardano adapter conformance.

Conversely, a second adapter does not provide evidence for unresolved Cardano gates.

The two evidence streams must remain separate.

## 15. Public wording while L0–L2 only

Until a second adapter exists, the accurate statement is:

> IMMORTAL is specified as environment-agnostic. Cardano is the first concrete adapter. Portability is a design goal being tested through a chain-independent reference model and future adapter conformance work.

After L3, the wording may state that portability has been experimentally demonstrated for the specific tested transition set, with the exact scope named.

No broader claim should be inferred from a small adapter.

## 16. Exit criteria for this research track

### Phase A — Interface
- [ ] Adapter obligations written and reviewed
- [ ] Existing Cardano adapter mapped to obligations
- [ ] No Cardano-specific rule promoted into IMMORTAL

### Phase B — Reference
- [ ] Chain-neutral reference runner exists
- [ ] Initial vectors are deterministic
- [ ] Vectors are derived from existing authoritative semantics
- [ ] No new economic constants introduced

### Phase C — Second adapter
- [ ] Second environment selected
- [ ] Minimal adapter implemented
- [ ] Same vectors execute in both environments
- [ ] Differences are normalized at the adapter boundary

### Phase D — Evidence
- [ ] Raw execution evidence retained
- [ ] Normalized conformance report generated
- [ ] Failures classified
- [ ] Scope of demonstrated portability explicitly stated

## 17. Non-regression rule

The portability track MUST NOT be used as a reason to:

- weaken an existing invariant;
- introduce chain-specific exceptions into IMMORTAL;
- change canonical economic constants;
- bypass existing evidence gates;
- relabel experimental work as production evidence.

If portability exposes a genuine limitation in the current universal specification, that limitation becomes a documented research finding first. Any normative change requires the normal authority path.

---

**End of document.**
