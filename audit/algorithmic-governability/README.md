# Algorithmic Governability — Adversarial Executable Lab v0.1

**Status:** NON-NORMATIVE / EVIDENCE HARNESS  
**Purpose:** executable evidence for the boundary already defined by the Algorithmic Governability canon.

## Scope

This lab does not define new economic or governance rules. It checks two already-stated candidate properties:

1. **No Result-Dependent Authority:** a monitor result may not alter normative authority, the governing metric, the evidence contract, or the admissibility rule unless an explicitly pre-authorized institutional rule already permits that change.
2. **Search non-escalation:** a partial/adaptive search may not convert a partial coverage claim into a complete normative universe, widen its candidate domain, or weaken the immutable safe set merely because of search results.

The harness uses deliberately small immutable toy objects. Passing it is evidence that the implementation preserves these boundaries in the modeled cases; it is not a proof of the entire protocol.

## G4 / G5 workflow mapping

G4 and G5 are **not missing research functions** and should not be duplicated in this Node-only lab.

- **G4 — B4/B5/B6 system closure:** ProtectedCapital, Economic Gate, viability and V3↔Cardano semantic correspondence. Canonical evidence is carried by the dedicated Haskell/Cardano conformance workflows and the frozen B5/B6 action-evidence contract.
- **G5 — Governance certification:** current-head governance build/execution evidence, canonical replay and GOV-18/GOV-28 lifecycle conformance. Canonical evidence is carried by the dedicated Haskell governance suites.
- This lab may expose or cross-reference those fronts, but must not invent a parallel governance/economic implementation.

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
