# Issue Admission Boundary Audit — 2026-10-10

## Scope and invariant

Branch audited: `work/immortal-green-closure`. This checkpoint records concrete boundary gaps without changing IMMORTAL economics, the V3 carrier, Reveal semantics, deployment policy, or branch topology.

Normative chain remains: IMMORTAL Constitution → Economic Kernel → Economic Algorithm → architecture specs → Cardano Adapter spec → PRE-RICH Constitution → Application Spec → Game Economy rules → implementation → tests → evidence.

## Confirmed findings

### P0 — transaction/input binding is caller-asserted, not derived at the signing boundary

`Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` accepts `tx: unknown` and a separate `inputReferences` array. `submitEconomic()` validates the admission against the supplied array, then forwards the opaque transaction to `signTx()`. It does not independently prove that the input references supplied to the gate are the inputs encoded in the transaction actually signed.

The Issue call site in `src/mint.ts` uses `submitEconomic(tx, economicAdmission, [...], [...], 'Issue')`. This proves adapter routing, but not the identity between candidate transaction body and caller-supplied references.

**Closure criterion:** establish a stable, supported way to derive/canonicalize the actual candidate transaction inputs before signing, then compare them to the admission's bound references and action fingerprint. Do not rely on undocumented Lucid internals or caller-provided duplicates. If this cannot be done at the current TxBuilder boundary, move the check to a typed immutable candidate/finalized-body boundary before signing and document the trust boundary explicitly.

### P0 — freshness helper exists but is not part of the mandatory admission gate

`Adapter/CARDANO/observation/ExecutableLiquidityObservation.ts` exports `assertExecutableLiquidityObservationFresh(observation, currentObservedAt, maxAge)`. The inspected `assertEconomicAdmission()` invokes input binding and authenticated PrizePool correlation, but does not invoke freshness validation. The test file tests freshness as a standalone helper only; it does not prove that a stale observation is rejected by `submitEconomic()`.

**Closure criterion:** trace the authoritative clock and freshness policy through the full Issue provider/call graph. Make freshness an obligatory pre-sign check using an already governed time source and existing policy. Do not invent a max-age constant. If no governing max-age/revalidation rule exists, keep the live gate fail-closed and record that missing governance input rather than guessing.

### P1 — digest syntax checks do not verify evidence content

The Issue bridge checks that EV1–EV7, Viability proof/evidence digests, and deployment evidence hash are 64 hex characters and that references are non-empty. This validates shape, not that the digest is recomputed from the referenced evidence or that the referenced source is authentic and retrievable.

**Closure criterion:** resolve each evidence reference through the approved evidence store/source, canonicalize the exact bytes under an existing format/version, recompute the digest, and verify the source/approval binding. No new hash convention or source authority may be invented in this patch.

### P1 — canonical transition evidence is a binding record, not a ledger observation

`CanonicalTransitionEvidence.ts` validates non-empty fields and hash-shaped fingerprints. `assertIssueAdmissionMatchesCanonicalEvidence()` correlates admission fingerprints with that record, but the record alone does not establish that the submitted transaction was included or that actual ledger post-state equals the declared post-state.

**Closure criterion:** after submission, correlate the returned transaction reference with an authoritative ledger observation and independently reconstruct/validate StateAfter against the expected canonical post-state. Until that evidence exists, classify the transition as submitted/unobserved, not confirmed.

## Test gaps to add

- Adapter-level stale observation rejection: `submitEconomic()` must not sign when the freshness check fails.
- Transaction-body/input mismatch: a witness/input list cannot authorize a different actual candidate body.
- Evidence content tampering: changing referenced evidence without updating its verified digest must fail.
- Ledger post-state divergence: receipt alone must not produce a successful conformance result.
- Replay: reusing an admission for a different candidate body or changed pre-state must fail before signing.

Tests must use real production boundaries where possible. Mocks can test fail-closed behavior but cannot be reported as Preprod or ledger evidence.

## Safe execution order

1. Trace Issue provider, time source, and all `submitEconomic` call sites; identify the existing governing freshness/revalidation rule.
2. Design actual-body/input binding at the supported Lucid/ledger boundary; add adversarial regression tests before changing the adapter API.
3. Verify evidence retrieval, canonicalization, digest recomputation, and approval provenance against existing source-of-truth docs.
4. Add post-submit ledger observation and StateAfter conformance; separate submission receipt from confirmed realization.
5. Run focused tests/typecheck, then full suite and the relevant workflow. Record exact commit/run URLs and artifacts in Notion.
6. Only then report a gate as closed. No V3/Reveal semantic changes are in scope.

## Status at checkpoint

- Confirmed by source inspection: caller-supplied input refs are separate from opaque `tx`; freshness is tested as a helper but not enforced by the inspected admission function; digest fields are shape-checked; canonical evidence schema is not itself ledger observation.
- Not yet implemented or verified: any closure patch, full call-graph freshness source, actual transaction-body extraction, evidence-source digest recomputation, or post-submit ledger reconciliation.
- No tests were executed as part of this source-inspection checkpoint.
