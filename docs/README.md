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
