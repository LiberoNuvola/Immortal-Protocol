# IMMORTAL — Initial Chain-Neutral Conformance Vectors

**Status:** research/conformance artifact — non-normative  
**Source basis:** `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md`, `IMMORTAL/kernel/EconomicKernel.hs`  
**Purpose:** establish deterministic cross-environment cases without introducing new economics.

> These vectors do not redefine the economic model. They instantiate existing semantics for conformance testing.

## Vector format

Each case contains:

- canonical pre-state facts;
- candidate action;
- expected derived values;
- expected admissibility/conformance outcome.

Raw ledger representations are intentionally absent.

---

## V01 — Raw surplus with positive surplus

### Input

```text
EEV = 1000
ProtectedCapital = 700
```

### Expected

```text
RawSurplus = max(0, 1000 - 700) = 300
```

### Conformance

PASS iff the environment-normalized result reports:

```text
EEV = 1000
ProtectedCapital = 700
RawSurplus = 300
```

No distribution authorization is implied by the positive result.

---

## V02 — Raw surplus at the protection boundary

### Input

```text
EEV = 1000
ProtectedCapital = 1000
```

### Expected

```text
RawSurplus = 0
```

### Conformance

PASS iff the normalized result reports zero surplus.

This case verifies that protected value is not treated as discretionary merely because EEV is non-zero.

---

## V03 — Protected capital exceeds EEV

### Input

```text
EEV = 900
ProtectedCapital = 1000
```

### Expected

```text
RawSurplus = 0
```

and the state is **not solvent** under the kernel's explicit solvency predicate because:

```text
EEV >= ProtectedCapital
```

is false.

### Conformance

Two results must remain separate:

1. accounting result: `RawSurplus = 0`;
2. safety/solvency result: `solvency = false`.

A positive-surplus calculation must never be inferred from an insolvent state.

---

## V04 — Zero-value boundary

### Input

```text
EEV = 0
ProtectedCapital = 0
```

### Expected

```text
RawSurplus = 0
solvency = true
```

provided all other non-negative state components required by the solvency predicate are zero/non-negative.

### Purpose

Exercise the zero boundary without introducing special-case chain behavior.

---

## V05 — Unresolved exposure contributes to protection

This vector is expressed at the semantic level because the exact profile/state schema is implementation-specific.

### Input

```text
EEV = 10000

Protected components:
  crystallized liabilities = 1000
  worst-case unresolved exposure = 6000
  safety capital = 500
  reserve protection = 500
  mandatory future costs = 500
  other protected component(s) = 0
```

### Expected

```text
ProtectedCapital = 8500
RawSurplus = 1500
```

### Conformance

PASS iff the normalized environment result preserves the same protected-capital decomposition and total.

The vector is specifically intended to prevent an adapter from treating unresolved economic exposure as freely spendable balance.

---

## V06 — Liability-first / no discretionary interpretation

### Input

```text
EEV = 10000
ProtectedCapital = 9500
Candidate discretionary allocation = 800
```

### Expected accounting boundary

```text
RawSurplus = 500
```

Therefore the candidate 800 allocation cannot be justified from RawSurplus alone.

### Conformance

The reference model must distinguish:

```text
RawSurplus = 500
candidate allocation = 800
```

from any later policy predicate.

The vector does NOT define a universal allocation policy. It verifies only that an adapter cannot reinterpret protected value as surplus.

---

## V07 — State-locality

Two states with identical EEV but different protected capital must produce different surplus values.

### State A

```text
EEV = 5000
ProtectedCapital = 2000
RawSurplus = 3000
```

### State B

```text
EEV = 5000
ProtectedCapital = 4500
RawSurplus = 500
```

### Expected invariant

```text
RawSurplus(S) = max(0, EEV(S) - ProtectedCapital(S))
```

The adapter must not cache or reuse the surplus from another state.

---

## V10 — CAR as a protected conditional commitment

### Input

```text
EEV = 1000
CAR = 200
Other protected capital = 300
```

The CAR amount is explicitly classified as a **non-discretionary protected commitment** for this fixture.

### Expected

```text
ProtectedCapital = 200 + 300 = 500
RawSurplus = max(0, 1000 - 500) = 500
```

### What this vector does NOT define

It does not define:

- the application's CAR allocation trigger;
- allocation percentage or rate;
- a universal CAR lifecycle beyond the already normative commitment/settlement/expiry deltas;
- any mapping to `additionalProtectedCapital`;
- any mapping to PRE-RICH Jackpot state.

### Conformance

PASS iff the normalized result preserves CAR as protected non-discretionary value for the fixture and produces the same aggregate ProtectedCapital/RawSurplus boundary.

This is an accounting/conformance vector, not an allocation-policy vector.

---

## V08 — Expiry finality placeholder

The universal model and current architecture identify expiry finality as a conformance concern, but the exact universal transition schema is not reproduced here.

Therefore this vector is intentionally **not executable yet**.

Required semantic shape:

```text
S_pre
  └─ expired transition
       ↓
S_post

late action against the expired right
       ↓
must not recreate the expired economic right
```

### Status

**PENDING SCHEMA EXTRACTION**

Do not invent a duration, ticket structure, or application-specific expiry value for this vector.

---

## V09 — Canonical action safety separation

The universal model defines:

```text
A_safe(S,K) = { a ∈ A(S) | ∀ω ∈ Ω(S,a): T(S,a,ω) ∈ K }
```

and:

```text
A_exec^spec(S;K) ⊆ A_safe(S,K)
```

### Conformance case

Provide an action that is syntactically representable but whose post-state is outside the supplied certified kernel.

### Expected

```text
admissible = false
```

The adapter must not turn technical executability into economic admissibility.

### Status

**PENDING KERNEL-INSTANCE FIXTURE**

The concrete K / Ω fixture must come from the existing conformance corpus; this vector must not invent a new viability model.

---

# Cross-environment comparison rule

For every executable vector:

```text
reference model
      │
      ├── canonical normalized result
      │
      ├── Cardano adapter result
      │
      └── second adapter result
```

A raw transaction, UTxO layout, account storage layout, gas/fee representation, datum encoding, or serialization difference is not itself a conformance failure.

The comparison target is the **normalized economic result and required evidence**.

# Initial executable set

The first implementation batch should be:

```text
V01
V02
V03
V04
V05
V06
V07
V10
```

Then:

```text
V08 → after expiry schema extraction
V09 → after certified-kernel fixture extraction
```

# Non-regression constraints

These vectors must not introduce:

- new economic constants;
- new payout rules;
- new expiry durations;
- new application policy;
- new chain-specific exceptions;
- changes to IMMORTAL normative semantics.

Any mismatch is first classified as:

1. reference-model/schema mismatch;
2. adapter implementation mismatch;
3. ledger realization limitation;
4. evidence/conformance gap.

Only after classification should a normative question be raised.

**End of artifact.**
