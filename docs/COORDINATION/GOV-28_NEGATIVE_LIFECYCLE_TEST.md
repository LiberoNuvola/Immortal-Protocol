# GOV-28 — First Negative Lifecycle Test Added

Date: 2026-09-24
Branch: `work/immortal-green-closure`

The canonical replay test suite now contains a concrete negative twin for lifecycle bypass.

After a valid canonical `ProposalSubmitted` event, the proposal is `Draft`; after `ProposalClassified` it becomes `Classified`. A crafted canonical `StatusChanged(..., Canonical, ...)` is structurally valid and correctly committed, but the authoritative `applyEvent` lifecycle rejects it because the current state is not `Adopted`.

This proves an important layer:

`structural validity + authorization + commitment + predecessor` does **not** imply lifecycle admissibility.

Commit:
`efa2cd804b82e4471070b9037796c0ce6bd8add3`

Important boundary: this is only the first negative twin. It does not close GOV-18 because the current canonical schema still lacks the distinct finalization/adoption/conformance/canonicalization event algebra.

Next: build the corresponding negative/positive lifecycle tests once the reconciled canonical event model is established; do not encode missing GOV-18 stages as ad-hoc status values.
