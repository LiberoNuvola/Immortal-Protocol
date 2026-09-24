# IMMORTAL / Adapter / PRE-RICH — Implementation & Evidence Status

## Purpose

Questo one-pager affianca le quattro guide integrative del sistema. Non è una certificazione e non sostituisce le fonti normative. Il suo scopo è indicare, per ciascun livello, cosa è normativamente definito, cosa è implementato, cosa è stato testato, quale evidenza esiste e quali residuali restano aperti.

## Status vocabulary

| Stato | Significato |
| --- | --- |
| **Defined** | La semantica è definita nelle fonti normative/integrative. |
| **Implemented** | Esiste una realizzazione concreta nel repository. |
| **Tested** | Esistono test automatici o harness pertinenti. |
| **Evidence** | Esiste un packet/prova osservabile che dimostra il fatto dichiarato. |
| **OPEN** | Rimane un gap di semantica, implementation, equivalence, provenance o evidence. |

Una riga non deve essere considerata chiusa solo perché una CI è verde.

## Executive matrix

| Layer / area | Defined | Implemented | Tested | Evidence | Current residual |
| --- | --- | --- | --- | --- | --- |
| IMMORTAL normative kernel | ✅ | ✅ | ✅ | 🟢 in conformance suite | Residui di equivalenza Cardano e alcuni boundary proof |
| Cardano Adapter boundary | ✅ | ✅ | ✅ | 🟡 crescente | Full semantic/refinement closure ancora parziale |
| PRE-RICH application model | ✅ | ✅ | ✅ | 🟡 crescente | Beacon B3, alcuni historical/genesis evidence edge |
| Sale / Mint path | ✅ | ✅ | ✅ | 🟢 Adapter Sale CI | Semantic-equivalence matrix resta il riferimento per residuali |
| Reveal / typed Ledger path | ✅ | ✅ | 🟡 | 🟡 P2.8 in corso | Typed Ledger evaluation/evidence deve essere chiusa end-to-end |
| Claim / Expire | ✅ | ✅ | ✅ | 🟡 | Full refinement/evidence closure da mantenere distinta dai test locali |
| Genesis transition | ✅ | ✅ | ✅ | 🟡 | Observation binding + real-ledger transition proof |
| Beacon B1 | ✅ | ✅ | ✅ | 🟡 | Provenance/evidence depends on configured authority model |
| Beacon B3 / Materios / GRANDPA | ✅ target architecture | ✅ scaffolding | 🟡 proof harness | 🔴 incomplete provenance | Production-grade finality/provenance proof remains OPEN |
| Governance finalization | ✅ | ✅ | ✅ | 🟡 | Canonicalization record identity/replay binding remains OPEN |

## IMMORTAL

### Normative layer

Defined in:
`IMMORTAL/docs/CONSTITUTION.md`
`IMMORTAL/docs/ECONOMIC-KERNEL.md`
`IMMORTAL/docs/ECONOMIC-ALGORITHM.md`
`IMMORTAL/docs/ARCHITECTURE.md`
`IMMORTAL/docs/CONFORMANCE.md`

Core properties already represented by implementation/conformance include obligations, ProtectedCapital, RawSurplus, post-state safety, deterministic derivation, atomic transition semantics, historical monotonicity and expiry finality.

Residual: IMMORTAL↔Cardano semantic equivalence must not be declared closed where the Cardano implementation intentionally has application/adapter-specific predicates or where execution-liquidity evidence is still distinct from universal economic semantics.

Reference:
`IMMORTAL/docs/V3-CARDANO-SEMANTIC-EQUIVALENCE.md`
`IMMORTAL/docs/ECONOMIC-GATE-CARDANO-CONFORMANCE-MATRIX.md`

## Cardano Adapter

Adapter responsibilities are implemented around execution, admission, serialization, observation and evidence binding.

Key implementation surfaces:
`Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`
`Adapter/CARDANO/runtime/EconomicAdmission.ts`
`Adapter/CARDANO/serialization/CanonicalEconomicState.ts`
`Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts`
`Adapter/CARDANO/observation/CardanoObservedTransitionEvidence.ts`
`Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts`

The admission/evidence binding is designed to bind action class, pre-state hash and candidate post-state hash without becoming a second economic authority.

Residual: complete execution/refinement closure depends on concrete ledger evidence, not solely on construction or local validation.

## PRE-RICH

PRE-RICH has an application-level specification stack plus the complete integrative system specification:

`PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md`

The current documented application includes Classic-6, ticket lifecycle, payout-unit exactness, class progression/contraction, reserve treatment, Jackpot, Genesis and Beacon models.

Important non-regressions:

- canonical price ladder remains 1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM;
- maximum normal payout remains 500 × P;
- liability-first accounting remains in force;
- RawSurplus remains `max(0, EEV - ProtectedCapital)`;
- the historical 75/10/10/5 model is not canonical.

## P2.8 — typed Cardano Ledger evaluation

P2.8 is an evidence/refinement workstream, not a new economic rule.

The target evidence chain is:

```text
exact Reveal CBOR
  → exact consumed UTxOs
  → exact Ledger-era transaction context
  → exact protocol parameters
  → authentic EpochInfo
  → exact SystemStart
  → Ledger-native evaluation
  → execution units + logs + failures per redeemer
  → persisted typed report
```

Current work has already addressed dependency/runtime blockers including `cardano-slotting` and Babbage/inline-datum support. Closure requires the typed evaluation evidence itself, not only successful compilation or runner startup.

## Beacon / Materios / GRANDPA

The repository deliberately keeps the actual authority-selection algorithm in its upstream implementation boundary rather than rewriting it as a local TypeScript selector.

Relevant proof surfaces:
`poc/materios-grandpa/verifier.ts`
`poc/materios-grandpa/verifier-b3-03b.ts`
`poc/materios-grandpa/authority-transition.ts`
`poc/materios-grandpa/ancestry.ts`

`verifier-b3-03b.ts` remains fail-closed when ancestry is not verified.

Current status: the architecture and trust boundary are established, but publisher-independent B3 authority/finality provenance is not to be called complete until the full proof path is available and verified.


### New upstream Materios provenance evidence surface (2026-09-24)

A new Materios explorer/provenance surface is now relevant to the B3 evidence boundary. The upstream repository contains an end-to-end receipt verifier that checks, in order:

```
Receipt on-chain
  → Availability Certificate
  → context-bound checkpoint leaf
  → checkpoint anchor
  → Merkle inclusion
  → manifest integrity
  → AvailabilityCertified event
```

The verifier returns a structured report and distinguishes `FULLY_VERIFIED`, `PARTIALLY_VERIFIED` and `NOT_VERIFIED`. The explorer exposes the verification path and can surface a Cardano L1 anchor transaction hash when a verification-index record is available.

This strengthens the upstream evidence available for the B3 stack: Receipt identity, certificate binding, checkpoint/Merkle inclusion and anchor lineage are concrete proof surfaces. It does **not** by itself prove the separate authority-selection and GRANDPA-finality obligations required by the B3 authority proof contract.

| New Materios surface | B3 effect |
| --- | --- |
| Receipt identity / on-chain storage | **Evidence surface strengthened** |
| Availability certificate binding | **Evidence surface strengthened** |
| Checkpoint leaf / Merkle inclusion | **Evidence surface strengthened** |
| Manifest / certification event cross-check | **Evidence surface strengthened** |
| Cardano L1 anchor reference | **Potentially useful evidence input** |
| AuthoritySelectionInputs provenance | **Not proven by this surface alone** |
| Authoritative selector execution provenance | **OPEN** |
| GRANDPA ancestry/finality proof | **OPEN** |
| Publisher-independent B3 canonicality | **OPEN** |

The repository should treat the new explorer lineage as an upstream evidence source, not as a substitute for the production-grade `VerifiedAuthoritySetTransition` boundary.

## Governance

Recent governance hardening distinguishes Accepted / Rejected finalization using quorum, approval and gates.

Residual:

- canonicalization/decision references are present, but replay does not yet prove that the references identify the same finalized decision;
- a canonical serialization/identity for the CanonicalizationRecord remains OPEN.

## Evidence ladder

For any individual transition, use this ladder:

```text
1. Normative source identified
2. Implementation identified
3. Test/harness exists
4. Test result is captured
5. Realistic/real-ledger evidence exists where required
6. Evidence is bound to the exact transition/state
7. Residual is explicitly classified
```

Only steps 1–4 should never be presented as proof of real on-chain execution when steps 5–6 are required.

## Residual register

| Residual | Layer | Status | Closure condition |
| --- | --- | --- | --- |
| B3 publisher-independent authority provenance | PRE-RICH / Materios | OPEN | Verified finality + authority-selection proof chain |
| GRANDPA ancestry production proof | Evidence | OPEN | Complete cryptographic/finality verification path |
| P2.8 typed Ledger Reveal evaluation | Adapter / Evidence | IN PROGRESS | Complete typed report from exact evidence |
| IMMORTAL↔Cardano semantic equivalence | Adapter / Conformance | OPEN by item | Action-by-action equivalence or explicit justified boundary |
| Genesis observation binding | PRE-RICH / Adapter | OPEN | Authenticated observation + real transition evidence |
| Governance canonicalization identity/replay | Governance | OPEN | Canonical identity and replay-verifiable decision linkage |
| Historical PRE native witness edge cases | PRE-RICH / Evidence | OPEN | Evidence sufficient to establish the historical claim without inference |

## Interpretation rule

The system should be described publicly as:

**well specified and substantially implemented, with a growing conformance/evidence base and explicitly tracked OPEN residuals.**

It should not be described as fully certified, fully trustless or fully on-chain merely because the documentation and CI are green in selected areas.

## Source map

The primary entry documents are:

1. `docs/IMMORTAL-ADAPTER-PRE-RICH-COMPLETE-SYSTEM-MAP.md`
2. `IMMORTAL/docs/IMMORTAL-COMPLETE-SYSTEM-SPECIFICATION.md`
3. `Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md`
4. `PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md`
5. this status/evidence one-pager

Together they provide orientation, layer-specific detail and implementation/evidence status without replacing the normative sources.