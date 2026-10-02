# CAES Conformance Matrix — IMMORTAL

**Status:** ARCHITECTURAL / NON-NORMATIVE  
**Purpose:** assess IMMORTAL against the working class definition **CAES — Certified Autonomous Economic System** without introducing a CAES subsystem or changing IMMORTAL normative economics.  
**Branch:** `work/immortal-green-closure`  
**Date:** 2026-09-28

## 1. Working definition

CAES is used here as a **class / architectural label**, not as an IMMORTAL component and not as a claim that the term is an established standard.

Working definition:

> A Certified Autonomous Economic System is an economic protocol in which normative rules are compiled into certified state transitions, constrained by solvency/viability, exposed through permissionless liveness conditions, atomically revalidated at the execution layer, with end-to-end provenance.

Relationship:

```
CAES  ⊃  IMMORTAL
```

For IMMORTAL:

- **CAES** = architectural class;
- **IMMORTAL** = protocol / instance being constructed;
- **K*** = ideal mathematical viability characterization;
- **Kc** = concrete certifiable approximation;
- **ETO** = conceptual query surface for admissible future trajectories;
- **Adapter** = execution/observation realization layer, not economic authority.

No CAES subsystem is required.

---

## 2. Conformance matrix

| CAES property | IMMORTAL architectural evidence | Current status | Minimum closure needed |
|---|---|---|---|
| Normative economic rules | Constitution, Economic Kernel, Economic Algorithm | **CLOSED at normative level** | Preserve source-of-truth hierarchy in implementation/evidence |
| Rules compiled into state transitions | `EconomicTransitionV3.transition` + `transitionValid` | **IMPLEMENTED** | Demonstrate complete execution conformance, not merely local transition validity |
| Solvency constraint | ProtectedCapital, RawSurplus, `solvencyInvariant`, Cardano post-state checks | **IMPLEMENTED / OPEN integration** | Close canonical Economic Gate equivalence for each action |
| Viability constraint | `K*`, `Kc`, CK1–CK8, `A_exec^spec` | **FORMALIZED / INSTANCE OPEN** | Discharge concrete `Kc` certificate and refinement obligations |
| Admissible trajectories | Ω + viability kernel | **FORMALIZED** | Establish concrete Ω perimeter/completeness for each deployment |
| Safe actions | `A_safe`, execution admissibility | **FORMALIZED** | Prove implementation acceptance is contained in the certified safe action relation |
| Permissionless liveness boundary | L1–L4, liveness specification, fail-closed stall semantics | **NORMATIVE CLOSED / DEPLOYMENT OPEN** | Publish and evidence concrete L1–L4 where progress is claimed |
| Autonomous execution | Atomic gated transition model + adapter realization | **ARCHITECTURALLY PRESENT** | End-to-end execution evidence showing no bypass |
| Atomic revalidation | Economic Gate → atomic execution + Cardano validator | **PARTIAL / OPEN EVIDENCE** | Show the same canonical candidate cannot pass economic admission and settle under divergent state/evidence |
| Concrete refinement | `RefinementV3.refinementExact` | **IMPLEMENTED** | Bind actual Cardano datum/observation to the concrete refinement witness |
| Composition | Historical CAES composition lab + current composition contract | **FORMALIZED / PARTIAL** | Joint certificate + joint gate for composed systems; naive compositionality remains refuted |
| End-to-end provenance | `CanonicalTransitionEvidence` binds action, pre/post fingerprints and transaction reference | **IMPLEMENTED / EVIDENCE PIPELINE OPEN** | Produce deployment witnesses covering the full chain from canonical state to observed settlement |
| State recomputation | canonical state → transition → post-state → next viability evaluation | **ARCHITECTURAL TARGET** | Demonstrate closure over observed successor states |
| Non-sovereign algorithmic governance | Governance boundary: derivation ≠ sovereignty | **FORMALIZED** | Continue parameter-laundering/adaptive-governance proof work |
| Evidence hierarchy | DESIGN → PROOF → MODEL → TEST → AUDIT → DEPLOYMENT | **CLOSED as framework** | Populate deployment layer with concrete witnesses |
| Certification claim discipline | explicit non-claims for K*, Kc, liveness, conformance | **CLOSED** | Maintain same epistemic separation in public materials |

---

## 3. What is already substantially CAES-shaped

The current architecture already has the essential decomposition:

```
Canonical State
      ↓
Obligations / Protected Capital
      ↓
Economic Observation
      ↓
Economic Gate
      ↓
Viability / Kc
      ↓
Safe / admissible action
      ↓
Structural transition
      ↓
Atomic execution
      ↓
Concrete refinement
      ↓
Observed settlement
      ↓
Canonical evidence
      ↓
Post-state
      ↓
Recompute admissibility / viability
```

The repository explicitly separates structural transition validity from economic admissibility. `EconomicTransitionV3.transitionValid` checks profile validity, conservation, construction, non-negativity and control-history constraints; it does not itself consume EEV.

That separation is intentional and must not be collapsed by adding hidden economic inputs to the structural predicate.

---

## 4. Critical closure boundary

The current Cardano conformance matrix identifies the main unresolved boundary:

```
structural transition validity
        AND
verified economic observation
        AND
Economic Gate
        AND
viability constraint
        ↓
atomic realization
```

The current implementation has an additive universal Economic Gate interface, but the following remain open:

1. integration of the Economic Gate into the canonical transition path;
2. concrete `Kc` certificate;
3. authoritative Ω binding;
4. Cardano execution wiring;
5. V3 ↔ Cardano equivalence evidence;
6. full refinement/evidence closure.

This is the principal CAES closure frontier.

---

## 5. Liveness is deliberately not part of the safety proof

IMMORTAL's liveness specification explicitly separates:

- safety;
- viability;
- liveness.

Membership in `Kc` means that a viable continuation exists. It does **not** mean an actor will submit it, inputs will arrive, delivery will succeed, or the substrate will commit it.

Therefore:

```
Viability ≠ Liveness
```

L1–L4 are environmental assumptions.

A permanent safe stall is permitted rather than weakening the economic gate.

This is compatible with the CAES definition: "autonomous" must mean self-executing under the protocol's rules, not an unsupported guarantee of eventual progress.

---

## 6. ETO position

ETO — **Economic Trajectory Oracle** — is not a price oracle and is not a normative subsystem.

It is the conceptual query surface:

> From this canonical state, which future economic trajectories remain admissible?

The mathematical basis is the existing viability machinery:

```
K* = greatest viable region
Kc = concrete certifiable approximation
A_safe(S,K) = actions whose authoritative successors remain in K
```

Therefore ETO should not be implemented as an independent authority.

Its future realization, if any, should be a read/query surface over canonical state, obligations, Ω, viability and admissible actions.

---

## 7. Composition boundary

Historical `audit/caes-transition-lab/ComposedTransitionCertificate.ts` already demonstrated the missing composition boundary:

- V3 transition validity;
- concrete refinement;
- Cardano semantic encoding;
- explicit liveness hypotheses;

were carried by one experimental transition witness.

The current architecture subsequently distributes these responsibilities across canonical transition, refinement, adapter observation and evidence layers.

This does **not** justify claiming composition closure.

The current formal record explicitly rejects naive compositionality and requires a joint certificate / joint gate for composed systems.

---

## 8. Exact remaining blockers

### CAES-C1 — Economic Gate integration
**OPEN**

The Economic Gate interface exists, but canonical V3 transition execution must consume the verified economic observation through the intended boundary without duplicating or weakening kernel semantics.

### CAES-C2 — Concrete Kc certificate
**OPEN**

The universal theory defines the requirements for a concrete certifiable kernel. A real deployment still needs CK1–CK8 evidence.

### CAES-C3 — Ω completeness for the deployment
**OPEN**

Ω completeness is an instance/adapter obligation. Narrowing Ω would be unsound.

### CAES-C4 — Refinement-to-execution witness
**OPEN**

`refinementExact` exists, but the deployment must establish the concrete fields from actual ledger state rather than assumed values.

### CAES-C5 — Atomic Cardano equivalence
**OPEN**

For each economically material action, demonstrate agreement among:

1. canonical candidate state;
2. economic gate;
3. viability condition;
4. Cardano validator;
5. observed settlement;
6. resulting canonical post-state.

### CAES-C6 — End-to-end provenance
**PARTIAL**

The evidence structure exists and binds fingerprints to the settlement transaction. Deployment evidence still needs to populate the complete chain.

### CAES-C7 — Liveness evidence
**CONDITIONAL / DEPLOYMENT-SPECIFIC**

IMMORTAL does not claim universal liveness. A deployment claiming progress must instantiate and evidence L1–L4.

### CAES-C8 — Closed-loop recomputation
**OPEN AS EVIDENCE**

The architecture requires post-transition state to become the next canonical input rather than treating a single successful transition as terminal proof.

---

## 9. What we should NOT do

CAES does not justify:

- creating a `CAES/` subsystem;
- changing canonical economic constants;
- moving PRE-RICH rules into IMMORTAL;
- putting ETO in the economic authority layer;
- weakening the fail-closed gate for liveness;
- narrowing Ω to make proofs easier;
- treating finite tests as infinite-horizon proof;
- treating `refinementExact` as proof of ledger truth without concrete evidence;
- calling IMMORTAL "certified" merely because the CAES architecture is present.

---

## 10. Closure criterion

IMMORTAL can legitimately describe itself as satisfying the **CAES architectural pattern** when the remaining implementation/evidence chain is closed:

```
Normative rule
  ↓
Certified transition rule
  ↓
Economic admissibility
  ↓
Concrete Kc / Ω certificate
  ↓
Execution revalidation
  ↓
Atomic settlement
  ↓
Concrete refinement
  ↓
Observed evidence
  ↓
Canonical successor
  ↓
Recomputed admissibility
```

The criterion is intentionally stronger than "smart contracts enforce the rules".

---

## 11. Current overall assessment

**IMMORTAL is already architecturally CAES-shaped.**

The unresolved work is primarily **closure of the certification and realization chain**, not discovery of another architectural component.

The most important next technical frontier is therefore:

> **CAES-C1 + CAES-C2 + CAES-C4 + CAES-C5 as one continuous proof/evidence path.**

That is the shortest path from the abstract CAES architecture to a concrete, inspectable IMMORTAL deployment claim.

---

## 12. External terminology note

Viability kernels are established prior art in viability theory and economics. They characterize states from which at least one future trajectory can remain within constraints. This document makes no novelty claim for `K*`, `Kc`, viability kernels, or ETO's underlying mathematical idea.

Any future novelty claim must concern the specific composition and implementation boundary, and requires a dedicated prior-art review.
