# Workflow C — R1 economic inventory checkpoint

**Date:** 2026-10-18  
**Branch:** \`release/public-main-curated-2026-09-24\`  
**Baseline HEAD:** \`0b5876895dd4884bbb252962fbadf38eda091cb2\`  
**Implementation commit:** \`b331e28b4636873ab0fd5970cad26896887e5b03\` (inventory gate; CI run #16 failed on two audit-checker defects, fixed in the follow-up commit)  
**Status:** \`BLOCKED — PROFILE EVIDENCE REQUIRED\`; this is an audit result, not certification.

## Scope and source hierarchy

The audit pins the normative R7 accounting partition, R1 certificate specification, R9 EEV contract, R3 Ω perimeter specification and the PRE-RICH application economy, then compares them with V3 and universal Haskell state/kernel fields. R7 defines the general two-sided ontology A1–A5 and L1–L6; PRE-RICH Game Economy is the application-level baseline; implementation fields are evidence of representation, not authority to invent a normative mapping.

## Implemented

- Machine-readable register for the eleven R7 cells, separate historical ledger \`ℌ\`, and derived \`RawSurplus\` boundary.
- Source-anchored index of 17 discovered components/boundaries: qualified USDM asset, crystallized liabilities, worst-case and statistical unresolved reserve, PC add-ons, Jackpot, class/control state, Jackpot lifecycle, A4↔L3 contingency, historical facts, L6, CAR, expiry identity, EffectivePool/buffer distinction and non-qualified assets.
- Checker pins ten normative/implementation source blobs and validates source identity, canonical cell labels/coverage, source anchors, missing/duplicate rows, duplicate accounting keys, missing accounting rules and premature PA2/PA7 promotion.
- Regression tests and CI integration on the authorized branch.

The registry is deliberately a **known-component index**, not a claim that those 17 rows exhaust all economic content that the profile can create.

## Phase A — inventory exhaustiveness: BLOCKED

The R7 cell ontology is mechanically enumerated and checked against pinned source definitions. This does **not** discharge PA2: a profile-authored enumeration of every asset and commitment that PRE-RICH can create, mapped exactly once to A1–A5/L1–L6, is still missing. PA7's independent adversarial omission review is also missing. R7 explicitly proves that omitted commitments can leave recorded-cell conservation intact while understating ProtectedCapital.

## Phase B — R1/R7 obligation mapping: PARTIAL

- V3 class-derived worst-case exposure is a candidate for L3, but is not bound to all authoritative Ω successors.
- V3 crystallized liabilities are a candidate for L1 only while the right is pending; the aggregate does not distinguish per-ticket L1/L4/L5 lifecycle state.
- V3 statistical unresolved reserve is not R7 L3's Ω-worst-case liability.
- V3/Universal kernels add safety capital, reserve protection and mandatory future costs to ProtectedCapital, while R7's normative expression is L1 + L2 + worst-case L3. Their exact cell mapping and disjointness remain unproven.
- Jackpot locked amount is included once by the current projection as \`uesAdditionalProtectedCapital\`, but its exact R7 cell and disjointness from L2/L3 remain unproven.
- CAR applicability, L6 emptiness, history-ledger coverage, expiry identity and classification of excluded assets remain open.

## Phase C — contingencies: BLOCKED

R7 requires the A4↔L3 relation and paired \`realise\`/\`resolve\` effects. No event-by-event proof of pairing, incompatible alternative exclusion or authoritative Ω coverage has been found in the V3 projection. No event, probability, haircut or fallback rule was invented.

## Phase D — V3↔R1 binding: NOT STARTED

The existing finite projection was not changed. No complete R1 model binding is emitted while PA2/PA3/PA4/PA7 and contingency refinement remain open.

## Phase E — Accept/T/Ω/EEV/S0: NOT STARTED

The source contracts define the evidence required, but this work does not authenticate deployed \`Accept\`, prove universal \`T\) equivalence, establish Ω completeness, produce EV1–EV7 adapter evidence or produce a live ledger S0. The \`PRE-RICH-EEV-USDM-DIRECT-V1\` boundary remains narrow: canonical USDM in the exact qualified B1 PrizePool UTxO only; no oracle-based PRE/ADA conversion or invented liquidity assumptions.

## Phase F — tests and CI

Run #16 at \`b331e28b4636873ab0fd5970cad26896887e5b03\` **FAILED** in the new inventory audit step before running the test step. The log exposed two checker issues: the contingency-source guard was applied to every unresolved row rather than only the A4↔L3 register row, and one source anchor omitted literal backticks around the R7 cell range. Both are corrected in the follow-up commit; the follow-up CI result must be recorded against its exact SHA before claiming the new gate passes.

## Phase G — provenance: PARTIAL

The checker pins exact source blob IDs. Hashes establish source identity, not remote deployment authenticity or live observations. No signature, attestation or evidence digest is fabricated.

## Evidence classification

- **MATHEMATICAL PROOF:** R7 T-CONS-GAP remains the conditional theorem that an omitted commitment can understate PC while recorded-cell conservation still holds.
- **MECHANICAL EVIDENCE:** the checker validates the R7 cell ontology and register/source consistency, if its CI gate passes.
- **TEST EVIDENCE:** tests cover bounded checker behaviors only; they cannot prove the real profile inventory is exhaustive.
- **IMPLEMENTATION CONFORMANCE:** V3 and Universal fields are source-pinned; application-to-R1 semantic equivalence is not established.
- **ADAPTER CONFORMANCE:** EV1–EV7, P1–P8 and live ledger observation remain absent.
- **GOVERNANCE DECISION:** any proposed assignment of PC add-ons, Jackpot or CAR to R7 cells requires approved normative semantics.
- **UNVERIFIED ASSUMPTION:** the discovered component index may omit profile-created economic content.

## Single bottleneck

**Profile-level exhaustive inventory plus independent omission review (PA2 + PA7), including the unresolved disjointness/contingency treatment for V3 PC add-ons and A4↔L3.** This precedes definitive V3↔R1 binding: a consistent finite projection can still omit a real obligation, and the R7 theorem shows why internal conservation cannot detect that omission.

## Reproduction

\`\`\`sh
node scripts/check-r1-economic-inventory.mjs
node --test test/check-r1-economic-inventory.test.mjs
node --test test/check-r1-finite-certificate.test.mjs test/check-r1-canonical-source.test.mjs test/check-v3-universal-projection.test.mjs test/check-r1-economic-inventory.test.mjs
\`\`\`

These are reproduction commands, not evidence that the follow-up commit has passed.
