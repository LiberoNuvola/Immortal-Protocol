# IMMORTAL Documentation Manifest

**Baseline:** September 2026  
**Purpose:** final editorial classification for the b1-hardening documentation tree.

## KEEP — canonical normative corpus

The following remain authoritative and should not be rewritten merely for presentation:

- `docs/00-normative/01_CONSTITUTION_FINAL.md`
- `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md`
- `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md`
- `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md`
- `docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md`
- `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md`

Their mathematical content is the source of truth.

## KEEP — formal and certification records

Keep the proof register, decision register, audit closure matrix, contracts, adversarial analysis, certification specifications and audit registers under their current directories.

These documents record proofs, obligations and evidence and should not be collapsed into the White Paper.

## UPDATE — navigation / orientation

The following are presentation-layer documents and should point clearly into the canonical corpus:

- root `README.md`
- root `WHITEPAPER.md`
- root `ROADMAP.md`
- `docs/README.md`
- `docs/EXECUTIVE-SUMMARY.md`
- `docs/GLOSSARY.md`

## UPDATE — repository policy

The following must describe IMMORTAL rather than PRE-RICH as the repository-level project:

- root `CONTRIBUTING.md`
- root `SECURITY.md`
- root `CODE_OF_CONDUCT.md`

PRE-RICH-specific contribution and security guidance may remain inside `PRE-RICH/` when appropriate.

## KEEP / UPDATE — adapter

`Adapter/CARDANO/docs/ADAPTER-SPECIFICATION.md` remains adapter-scoped. It must not declare Cardano to be a dependency of universal IMMORTAL semantics.

## KEEP / UPDATE — application

`PRE-RICH/docs/` is the application-scoped documentation set. Its constitution and economic policy remain application-specific.

The PRE-RICH White Paper belongs in `PRE-RICH/docs/` and must not replace the universal IMMORTAL White Paper.

## ARCHIVE

Historical drafts, superseded constitutions, research notes and legacy specifications remain under `docs/archive/` for traceability.

They are not deleted merely because they are obsolete.

## Implementation boundary

Source code, Plutus artifacts, frontends, relayers and proof-of-concept material are not automatically universal IMMORTAL implementation.

Their scope must be identified by the surrounding adapter/application documentation.

## Final editorial rule

There must be one universal semantic source of truth.

There may be many explanatory documents.

There must not be two competing normative definitions of the same universal concept.
