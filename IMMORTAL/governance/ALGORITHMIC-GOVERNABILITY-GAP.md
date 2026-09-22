# IMMORTAL — Algorithmic Governability Gap / AG-01

**Status:** research/conformance work item; non-normative until explicitly adopted  
**Target branch:** `work/immortal-green-closure`  
**Scope:** IMMORTAL universal layer, governance layer, application/profile boundary

## 1. Problem

IMMORTAL should be able to evolve its operational state as environmental
conditions change without making the algorithm the source of its own authority.

The target property is:

> The algorithm may select or compute admissible trajectories from the
> current state and environment, but it cannot enlarge, rewrite, or
> self-authorize its constitutional authority.

This is an architectural property, not a claim that an algorithm should
replace human or collective authorization. Current constitutional/algorithmic
governance literature similarly treats authorization, constraint,
contestability, and accountability as distinct from mere automation.

## 2. Current repository position

The working branch already contains important pieces:

- `IMMORTAL/state/UniversalEconomicState.hs` separates application-neutral
  economic quantities from profile/application state.
- `IMMORTAL/state/STATE-FIELD-OWNERSHIP.md` explicitly prevents PRE-RICH
  fields from silently becoming universal law.
- `IMMORTAL/state/EconomicProfile.hs` represents application-declared
  economic parameters separately from universal interpretation.
- `IMMORTAL/governance/Governance.hs` provides a deterministic governance
  state machine with snapshots, voting, delegation, gates, and lifecycle
  transitions.
- `IMMORTAL/governance/GovernanceAuthorization.hs` separates actor
  authorization, evidence, and ruleset compatibility.
- `IMMORTAL/governance/RulesetRegistry.hs` makes ruleset versions immutable
  and monotonic.
- GOV-22/GOV-23 establish canonical-event replay and independent replay
  evidence boundaries.

These pieces are compatible with an algorithmic-governability architecture,
but they do not yet constitute a complete proof of that property.

## 3. Required authority separation

The working model should remain:

```
Constitution / immutable constitutional constraints
                    |
                    v
          Governable rule space
                    |
                    v
        Algorithmic admissibility
                    |
                    v
       Verified candidate trajectory
                    |
                    v
       Atomic state transition
                    |
                    v
             New canonical state
```

The algorithm receives authority; it does not mint authority.

### 3.1 Constitutional layer

Defines constraints that the operational algorithm cannot change by ordinary
execution.

Examples of properties to verify, without inventing new economics:

- safety/invariant preservation;
- separation between universal IMMORTAL semantics and application policy;
- required evidence/provenance;
- valid transition structure;
- ruleset-version compatibility;
- explicit constitutional amendment path.

### 3.2 Algorithmic layer

May compute:

- admissible transitions;
- candidate trajectories;
- environment-dependent choices;
- parameter values inside an already-authorized governable domain.

It must not silently convert a candidate into an authorized transition.

### 3.3 Verification layer

A candidate must be checked against the authoritative constraints before
becoming canonical state.

The proof object should bind at minimum:

- predecessor state/reference;
- environment observation/reference;
- algorithm/ruleset version;
- candidate transition;
- relevant constitutional/ruleset commitment;
- resulting state/reference;
- evidence required by the applicable gate.

### 3.4 Evolution layer

Environmental adaptation is therefore a state transition problem:

```
(state, environment, authorized-ruleset)
    -> candidate
    -> admissibility proof
    -> atomic transition
    -> canonical post-state
```

A failed proof means no transition. It must not mean that the algorithm is
allowed to relax the constraint.

## 4. Constitutional change

There are two fundamentally different operations:

1. **Operational adaptation:** choose another trajectory already permitted by
   the current constitutional/ruleset envelope.
2. **Constitutional amendment:** change that envelope.

The algorithm may perform (1) where authorized. It must not perform (2) merely
because environmental conditions make the current envelope inconvenient.

A constitutional amendment must therefore have a distinct, explicit
authorization and replay path. The algorithm may propose an amendment or
compute consequences, but adoption remains governed by the constitutional
amendment mechanism.

## 5. Concrete conformance obligations

AG-01 should not be marked GREEN until the following are demonstrated:

| ID | Requirement | Evidence target |
|---|---|---|
| AG-01 | Candidate cannot self-authorize | negative transition test |
| AG-02 | Candidate cannot weaken an invariant | adversarial invariant test |
| AG-03 | Environment is input, not authority | typed boundary + replay vector |
| AG-04 | Ruleset identity is bound to decision | canonical commitment test |
| AG-05 | Constitutional amendment is distinct from operational adaptation | separate lifecycle test |
| AG-06 | Verified candidate becomes canonical only through atomic transition | transition/evidence test |
| AG-07 | Same inputs/ruleset deterministically replay to same decision | independent replay |
| AG-08 | A stale or incompatible ruleset is rejected | negative compatibility test |
| AG-09 | Application policy cannot silently become universal law | state/profile boundary test |
| AG-10 | External authority/provenance is explicit where required | evidence/provenance test |

## 6. Relation to current open fronts

AG-01 is deliberately cross-cutting:

- **State boundary:** defines what the algorithm is allowed to observe and
  change at the universal/application boundary.
- **B4 ProtectedCapital:** a candidate trajectory cannot consume protected
  capital merely because the environment makes that trajectory desirable.
- **B5 Gate → Viability → Atomic Transition:** the admissibility proof belongs
  before canonical commitment.
- **B6 V3 ↔ Cardano:** the on-chain transition must realize the same
  admissibility semantics rather than merely resemble them.
- **C5 permissionless lifecycle:** permissionless invocation supplies an
  execution mechanism, not additional authority.
- **C6 evidence:** provenance must be sufficient to distinguish an authorized
  algorithmic decision from an untrusted observation.
- **Materios/B3:** externally selected authority must remain an authenticated
  input/proof boundary; IMMORTAL must not recreate Materios selection rules.
- **PRE-RICH separation:** ticket classes, Jackpot policy, and other
  application rules remain profile/application policy unless separately
  promoted by an explicit constitutional decision.

## 7. Design principle to preserve

The intended adaptive model is not:

```
environment -> algorithm -> new rules
```

but:

```
constitution
     |
authorized rule space
     |
environment + current state
     |
algorithm computes admissible candidates
     |
verification
     |
authorized transition
     |
new state
```

This distinction is the core of algorithmic governability.

## 8. Closure condition

AG-01 is closed only when the repository can demonstrate, with executable
tests and reproducible evidence, that:

> **No executable algorithmic path can obtain more authority than the
> constitutional/ruleset boundary already grants it, while authorized
> environmental adaptation remains possible within that boundary.**

Until then, AG-01 remains OPEN.
