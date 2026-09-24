# IMMORTAL — Complete System Specification

**Role:** end-to-end integrative specification and reader guide  
**Scope:** chain-neutral IMMORTAL protocol  
**Status:** INTEGRATIVE DOCUMENT — no new normative semantics  
**Branch:** main

## 1. Purpose

IMMORTAL is a general-purpose, chain-neutral economic protocol. Its validity derives from canonical state, verified evidence, obligations, protected capital, admissible transitions and explicit authority boundaries.

It is independent of a particular blockchain, application, asset, frontend, backend, relayer, publisher or operator.

Core separation:

```
universal protocol semantics
        ≠
execution environment
        ≠
application policy
```

## 2. Canonical protocol flow

```
Truth
  ↓
Canonical State
  ↓
Obligations
  ↓
Protected / Executable Value
  ↓
Uncertainty Ω
  ↓
Viability / Safety
  ↓
Admissible Action
  ↓
Policy
  ↓
Atomic Transition
  ↓
Canonical Successor State
  ↓
History / Evidence
```

For state S and action a:

```
S --a--> S'
```

Acceptance is based on applicable post-state predicates.

## 3. Constitution

Authority hierarchy:

```
IMMORTAL CONSTITUTION
        ↓
IMMORTAL NORMATIVE SPECIFICATIONS
        ↓
IMPLEMENTATION / ADAPTER
        ↓
TESTS / EVIDENCE
```

Lower layers cannot authorize violations of higher layers.

No infrastructure role becomes discretionary economic authority merely by operating infrastructure.

A displayed, off-chain, first-submitted or adapter-produced value is not authoritative without the defining verification predicate.

## 4. Canonical state and obligations

Implementations must represent or derive:

```
EconomicState
Obligations
UnresolvedExposure
ProtectedCapital
ExecutableEconomicValue
AdmissibleActions
HistoricalState
```

Accepted obligations enter safety evaluation. Exposure created by unresolved uncertainty must be represented by a defined mechanism.

Protected capital cannot be treated as discretionary liquidity.

Generic surplus boundary:

```
RawSurplus = max(0, EEV − ProtectedCapital)
```

The applicable protocol/profile defines EEV and ProtectedCapital.

## 5. Exposure and reserves

Generic deterministic exposure:

```
WorstCaseExposure(P,N) = B(P) × N
```

B(P) belongs to the applicable specification.

A statistical model may use:

```
Reserve(N) = N × μ + Z × σ × √N
```

but statistical protection is not automatically deterministic protection.

## 6. Viability

For state S, admissible actions A(S), uncertainty Ω and transition T:

```
K_Ω =
{ S | ∃ admissible policy :
      ∀ω ∈ Ω,
      T(S,a,ω) ∈ K_Ω }
```

A bounded computation must not be presented as an infinite-horizon proof.

Acceptance evaluates the candidate successor state.

## 7. Canonical economic algorithm

```
identify canonical state
→ validate authoritative inputs
→ derive candidate transition
→ compute post-state
→ check mandatory invariants
→ accept only if admissible
→ commit coupled changes atomically
→ record resulting state/history
```

Invalid transitions fail closed.

Any action capable of creating future economic obligation must account for that obligation before acceptance.

## 8. Deterministic derivation

Protocol-defined derivations must be deterministic, domain-separated, versioned, reproducible and independently verifiable.

Where commit/reveal is used:

```
secret
→ commitment
→ canonical binding
→ reveal
→ verification
→ deterministic derivation
```

A witness proves a result; it does not simply assert a chosen result.

## 9. Crystallization, claim and expiry

Once an applicable right is crystallized, unrelated later state changes cannot silently recompute it.

Claim:

```
verify right
→ settle once
→ reduce liability once
```

```
CLAIM ≠ BURN
```

Expiry is final:

```
newClaimability = false
newLiability = false
lateRevealEconomicEffect = none
```

No resurrection is permitted. Exact duration is profile/application policy unless made universal.

## 10. Atomicity

Economically coupled changes must be atomic:

```
PRECONDITION
→ VALIDATE
→ COMPUTE DELTA
→ CHECK POST-STATE
→ COMMIT ATOMICALLY
→ POSTCONDITION
```

Partial states that falsely represent obligations are non-conforming.

## 11. Governance and liveness

Governance acts only within the authority granted by the applicable normative specification. It cannot assign individual economic outcomes, rewrite crystallized rights, bypass mandatory safety predicates or create personal entitlement from protocol-controlled resources.

Liveness boundary:

```
Liveness mechanism ⊆ admissible execution paths
Liveness mechanism ≠ economic authority
```

Relayers, watchers, schedulers and adapters facilitate execution; they do not become economic authority.

Common execution fabric:

```
Condition
→ Observation
→ Trigger
→ Candidate construction
→ Permissionless invocation
→ Independent revalidation
→ Atomic transition
→ Canonical state
```

## 12. Evidence boundary

```
observation
   ↓
evidence
   ↓
verification
   ↓
canonical input/state
   ↓
economic derivation
```

Evidence producer and verifier are distinct roles.

```
OBSERVED ≠ CANONICAL
CANONICAL ≠ VERIFIED CONFORMANCE
```

## 13. Adapter and application boundaries

The Adapter maps protocol concepts to a concrete environment. It may translate state, assets, evidence and transactions, but must not add economic authority or replace protocol predicates.

An application specializes IMMORTAL with application-specific policy. It is an instance of IMMORTAL, not its parent.

Current repository architecture:

```
IMMORTAL
   ↓
Cardano Adapter
   ↓
PRE-RICH
   ↓
Cardano execution
```

## 14. Conformance

Current protocol conformance requirements:

| ID | Requirement |
|---|---|
| C1 | Required economic state is represented or derivable. |
| C2 | Untrusted infrastructure cannot acquire forbidden economic authority. |
| C3 | Obligations are represented and included in safety evaluation. |
| C4 | Protected amounts are not treated as discretionary liquidity. |
| C5 | Exposure-creating actions are checked against post-state safety. |
| C6 | Coupled economic transitions are atomic. |
| C7 | Protocol-defined derivations are deterministic and reproducible. |
| C8 | Expired rights cannot be resurrected or create new liability. |
| C9 | Settlement preserves applicable economic value. |
| C10 | Liveness infrastructure remains subordinate to economic validity. |
| C11 | Authority derives from defined verification predicates, not submission order or operator discretion. |
| C12 | Current and monotonic historical state remain distinct where both exist. |
| C13 | Crystallized rights are not silently recomputed by unrelated later changes. |

Status dimensions remain separate:

```
Semantic:
CLOSED / OPEN / HISTORICAL / NON-CANONICAL / AMBIGUOUS

Implementation:
IMPLEMENTED / PARTIAL / GAP / TARGET / UNKNOWN

Evidence:
VERIFIED / PARTIAL / MISSING / NOT YET PRODUCED
```

Therefore:

```
IMPLEMENTATION GAP ≠ OPEN ECONOMIC DECISION
MISSING EVIDENCE ≠ FAILED SEMANTICS
```

## 15. What IMMORTAL does not decide

IMMORTAL does not by itself choose Cardano datum/redeemer layouts, application prices, ticket distributions, Jackpot rules, deployment-specific oracle providers, frontend behavior, branding or application-specific expiry values.

Those belong to the relevant adapter, application or deployment scope.

## 16. Primary sources

- IMMORTAL/docs/CONSTITUTION.md
- IMMORTAL/docs/ECONOMIC-KERNEL.md
- IMMORTAL/docs/ECONOMIC-ALGORITHM.md
- IMMORTAL/docs/ARCHITECTURE.md
- IMMORTAL/docs/CONFORMANCE.md
- IMMORTAL/docs/V3-CARDANO-SEMANTIC-EQUIVALENCE.md

**This document is an integrative specification, not a new source of truth.**
