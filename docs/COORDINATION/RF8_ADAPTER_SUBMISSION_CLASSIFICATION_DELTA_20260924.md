# IMMORTAL — RF8 Adapter Submission Classification Delta 2026-09-24

## Current branch head observed before this delta

`work/immortal-green-closure`

The branch was actively advancing through the P2.8 ledger-runner work. Before this delta, the Cardano adapter exposed:

- `submit()` — generic signing/submission;
- `submitEconomic()` — economic submission after admission validation.

This naming left the generic path semantically ambiguous when reading transaction audits.

## Hardening

The generic method is now explicitly named:

`submitInfrastructure()`

The economic method remains:

`submitEconomic()`

Commit:

`2e7f0f69fe8ea5d8f5a6487de8186a4d9ff38f63`

The adapter implementation still performs exactly the same signing/submission operation. No economic logic changed.

`src/txHelpers.ts` now routes `signAndSubmitTx()` through `submitInfrastructure()`.

Commit:

`6b5a29ff22c05cc7af8f074b40dee07dc45495da`

The adapter test and RF8 boundary test were updated accordingly.

Commit:

`4ee48cb06fec229ff6bf62d7fdcb96fc614c0cda`

Commit:

`b8591fe162be04d1747b2539f2614edf6548e8f6`

## P2.8 trace classification

The real-Yaci Reveal harness in:

`audit/cardano-integration/reveal-ledger-trace.ts`

previously invoked the generic adapter `submit()`.

It now explicitly invokes:

`submitInfrastructure()`

and documents that this trace is a **ledger-evidence harness**, not the production economic-admission boundary.

Commit:

`1c148d3fab28797c56a019c7256d09936740823b`

This distinction is deliberate:

- production economic orchestration → `submitEconomic()`;
- infrastructure/ledger lab bootstrap → `submitInfrastructure()`.

## Important remaining RF8 issue

The P2.8 Reveal harness still does not carry an authoritative `EconomicAdmissionWitness`.

This is not silently converted into a fake witness.

Reason:

the current trace derives its post-observation fingerprint only **after** the transaction is confirmed, while `submitEconomic()` requires the admission witness before signing/submission. The trace's current fingerprint scheme also includes concrete observed UTxO references, making it an evidence fingerprint rather than a pre-submit canonical state fingerprint.

Therefore the correct unresolved item remains:

> establish the authoritative canonical serialization/fingerprint producer for the candidate V3 state and action, then supply that pre-submit witness to `submitEconomic()`.

## Status

RF8 naming/classification hardening: **IMPLEMENTED**

Production economic submission boundary: **STRONG**

P2.8 ledger harness: **REAL-YACI EVIDENCE PATH / NOT ECONOMIC-ADMISSION PROOF**

Canonical witness fingerprint provenance: **OPEN**

No validator, economic constant, payout rule, or state semantics changed.
