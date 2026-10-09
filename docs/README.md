# IMMORTAL Documentation

## Purpose

This directory is the canonical documentation system for IMMORTAL.

The repository distinguishes universal protocol semantics from adapter and application material.

## Authority

```text
1. Constitution
2. Normative specifications
3. Contracts
4. Certification requirements
5. Formal records / analysis
6. Audit and evidence
7. Implementation
8. Tests and deployment evidence
9. Historical archive
```

Evidence records do not create normative authority.

## Mechanism index

The repository documents the following first-class mechanisms explicitly.

| Layer | Mechanisms |
|---|---|
| **IMMORTAL** | Economic Gate · Viability Kernel (K_Ω) · A_safe · ProtectedCapital · RawSurplus · Worst-Case Analysis · Statistical Risk Analysis · Hysteresis · Contraction · Quiescence · Recovery / PRE-GENESIS |
| **PRE-RICH** | AWRA · Treasury Allocation Policy · Adaptive Asset / Liquidation Policy · Jackpot Policy · Game Outcome / Randomization |
| **Adapter** | Evidence transport · semantic preservation · settlement realization · chain conformance |

The architectural rule is:

```text
IMMORTAL safety / admissibility
              ↓
           A_safe
              ↓
     PRE-RICH policy/mechanism
              ↓
        Cardano Adapter
              ↓
            Ledger
```

The mechanism registry is a documentation index, not a new normative layer. Individual mechanisms remain governed by their applicable canonical specification.

## Recommended paths

### For everyone

- [Executive Summary](EXECUTIVE-SUMMARY.md)
- [Glossary](GLOSSARY.md)
- [White Paper](../WHITEPAPER.md)

### For protocol readers

- [Constitution](00-normative/01_CONSTITUTION_FINAL.md)
- [Universal Economic Model](00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md)
- [Economic Kernel](00-normative/03_ECONOMIC_KERNEL_FINAL.md)
- [State Transition](00-normative/04_STATE_TRANSITION_SPECIFICATION.md)
- [Invariants](00-normative/05_INVARIANTS_CONSERVATION_FINAL.md)
- [Conformance](00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md)

### For formal review

- `01-formal-records/`
- `01-contracts/`
- `02-analysis/`
- `02-certification/`

### For evidence

- `03-audit/`
- repository `verification/`

### For implementation

- `../IMMORTAL/`
- `../Adapter/CARDANO/`
- `../PRE-RICH/`

## Layer rule

If a statement contains Cardano-specific mechanics, it belongs in the adapter layer.

If a statement contains PRE-RICH-specific economic policy, it belongs in PRE-RICH.

If a statement is intended to hold for any conforming implementation, it belongs in IMMORTAL.

When in doubt, do not promote an application rule into the universal layer.

## Archive rule

Historical documents remain available for traceability but are not current normative authority unless explicitly referenced by the authority hierarchy.


## Five-click paths

### Protocol reviewer
1. `README.md`
2. `docs/EXECUTIVE-SUMMARY.md`
3. `docs/DOCUMENTATION-AUTHORITY-MATRIX.md`
4. `docs/00-normative/01_CONSTITUTION_FINAL.md`
5. `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md`

### Cardano implementer
1. `README.md`
2. `docs/IMMORTAL-ADAPTER-PRE-RICH-COMPLETE-SYSTEM-MAP.md`
3. `Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md`
4. `PRE-RICH/docs/ECONOMIC-ALGORITHM.md`
5. `docs/03-audit/`

### PRE-RICH contributor
1. `README.md`
2. `docs/ROADMAP.md`
3. `PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md`
4. `PRE-RICH/docs/GAME-ECONOMY.md`
5. `PRE-RICH/docs/CONFORMANCE.md`

### Evidence / audit
Use `docs/02-certification/`, `docs/03-audit/` and `audit/` as evidence surfaces. These do not override `docs/00-normative/` or the applicable application/adapter specifications.

## Layered files that intentionally remain at root

The root-level `WHITEPAPER.md`, `ROADMAP.md` and `CONTRIBUTING.md` are repository/IMMORTAL-level entry documents. Their similarly named files under `docs/` are PRE-RICH-facing documents and are **not competing duplicates**. Keep both unless their scopes are deliberately changed.

The same rule applies to system maps: `docs/IMMORTAL-ADAPTER-PRE-RICH-COMPLETE-SYSTEM-MAP.md` is the end-to-end navigation map; `docs/IMMORTAL-SYSTEM-MAP.md` is a continuity/provenance checkpoint. Neither is normative authority.


## Status — do not mix

| Need | Open |
|---|---|
| Stable closure / certification gaps | `03-audit/IMMORTAL-IMPLEMENTATION-CLOSURE-STATUS.md` |
| What to do next on Preprod | `COORDINATION/PREPROD-FIRST-TICKET-HANDOFF-20261003.md` |
| Live verification register | `03-audit/VERIFICATION_STATUS.md` |
| Open obligations | `03-audit/RESIDUAL_OBLIGATION_REGISTER.md` |

### System maps

- **Primary navigation:** `IMMORTAL-ADAPTER-PRE-RICH-COMPLETE-SYSTEM-MAP.md`
- **Secondary continuity checkpoint:** `IMMORTAL-SYSTEM-MAP.md`

The secondary map is for provenance/continuity; it is not a competing navigation authority.

