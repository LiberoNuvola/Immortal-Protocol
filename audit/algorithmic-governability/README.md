# Algorithmic Governability — Adversarial Executable Lab v0.1

**Status:** NON-NORMATIVE / EVIDENCE HARNESS  
**Purpose:** executable evidence for the boundary already defined by the Algorithmic Governability canon.

## Scope

This lab does not define new economic or governance rules. It checks two already-stated candidate properties:

1. **No Result-Dependent Authority:** a monitor result may not alter normative authority, the governing metric, the evidence contract, or the admissibility rule unless an explicitly pre-authorized institutional rule already permits that change.
2. **Search non-escalation:** a partial/adaptive search may not convert a partial coverage claim into a complete normative universe, widen its candidate domain, or weaken the immutable safe set merely because of search results.

The harness uses deliberately small immutable toy objects. Passing it is evidence that the implementation preserves these boundaries in the modeled cases; it is not a proof of the entire protocol.

## IMMORTAL Expansion namespace

This lab contains support for the **IMMORTAL Expansion** research front. Its identifiers are:

| ID | Generalization |
| --- | --- |
| EXP-01 | Typed obligations / seniority |
| EXP-02 | Term structure / time horizon |
| EXP-03 | Multi-asset / eligibility / haircut boundary |
| EXP-04 | Composition of profiles |
| EXP-05 | Abstract contingent claims |
| EXP-06 | Evidence-as-input |
| EXP-07 | Regime / hysteresis |
| EXP-08 | Netting / offset |
| EXP-09 | Obligation transfer / novation |
| EXP-10 | Explicit risk budget |
| EXP-11 | Deterministic auction / allocation |
| EXP-12 | Observer vs authority split |

The **EXP-** prefix is deliberate: it prevents these generalization axes from being confused with Governance (`GOV-xx`), system closure fronts (`B4/B5/B6`), or the separate G1–G6 liveness conditions.

Current bounded implementations in this branch include EXP-01-light, EXP-03-minimal, EXP-06 and EXP-07-light. The remaining EXP items stay research/open until their semantic boundary is explicitly justified.

These expansions are not a second governance system and do not create new economic authority.

## Evidence model

```
Immutable Boundary
  ├─ Domain
  ├─ Rule
  ├─ Inputs
  ├─ Limits
  ├─ EvidenceContract
  ├─ Version
  ├─ Contestability
  └─ Exit

Explore → CandidateSet
Certify → admissible / rejected / unverifiable
Adopt → only if Certify(admissible)
```

The lab intentionally gives two monitors identical observations but different derived metrics. The selection rule is predeclared and does not grant either monitor new authority.

## Run

```bash
node audit/algorithmic-governability/no-result-dependent-authority.mjs
```

Expected result: all assertions PASS.

## Non-goals

- no new reward formula;
- no fee formula;
- no governance threshold;
- no economic parameter;
- no claim of cryptographic proof;
- no substitution for AG-01 canonical replay/finality evidence.
