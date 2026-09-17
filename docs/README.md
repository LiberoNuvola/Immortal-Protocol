# IMMORTAL Protocol — Documentation

## IMMORTAL v3.0.0

This directory contains the crystallized IMMORTAL v3.0.0 specification and its associated
certification, audit, explanatory, and historical material.

### Authority model


Constitution
    ↓
Normative specification
    ↓
Contracts
    ↓
Certification requirements
    ↓
Audit / evidence
    ↓
Implementation conformance


**Normative authority comes from the canonical specification and contracts.** Certification
and audit documents record what must be demonstrated and what evidence has been established;
they do not create new normative authority.

## Reading order

1. `00-normative/01_CONSTITUTION_FINAL.md` — root authority
2. `00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` — universal economic model
3. `00-normative/03_ECONOMIC_KERNEL_FINAL.md` — economic kernel and formal results
4. `00-normative/04_STATE_TRANSITION_SPECIFICATION.md` — state-transition discipline
5. `00-normative/05_INVARIANTS_CONSERVATION_FINAL.md` — invariants and conservation
6. `02-analysis/06_ADVERSARIAL_GAME_THEORETIC_FINAL.md` — adversarial analysis
7. `00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md` — conformance requirements
8. `01-formal-records/08_FORMAL_PROOF_REGISTER_FINAL.md` — proof register
9. `01-formal-records/09_DECISION_REGISTER_FINAL.md` — decision record
10. `01-formal-records/10_FINAL_AUDIT_CLOSURE_MATRIX.md` — closure matrix
11. `01-contracts/` — liveness, upgrade, composition and Ω contracts
12. `02-analysis/` — adversarial and game-theoretic analysis
13. `02-certification/` — concrete-kernel, refinement, accounting, EEV and related certification specifications
14. `03-audit/` — status, residual obligations, traceability, claim and mechanical-verification records
15. `04-guides/` — algorithm guide and non-mathematical explanation
16. `05-history/` — historical change records

## Verification boundary

The v3.0.0 mathematical model and normative specification are treated as closed in this
baseline. Implementation conformance is a separate evidence question and must not be inferred
from the existence of the mathematical proofs or finite-model checks.

The executable finite-model material lives in the repository-level `verification/` directory,
not in this documentation tree.

## Scope

IMMORTAL is specified as a universal, chain-neutral, application-neutral economic protocol.
Application-specific PRE-RICH mechanics and Cardano implementation details belong to their
respective implementation/adapter layers rather than to the universal model.
