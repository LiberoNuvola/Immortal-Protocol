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

Run [#17](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39150614492) passed on `9716c3ad6c80bffcd5769c5f440ae72d0dbadde7`; run [#18](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39150682177) passed on `4c01c7ede834ade10de851b2d00956fd0401cbc1`, with the inventory audit passing and the combined Node suite at 40/40. This paragraph records those exact run/commit pairs; it does not assert that a later documentation commit was tested by either run.


## Independent source-surface audit and provenance update — 2026-10-18

### Source recovery and authority

The audit re-read the authorized baseline commit 2e811d7d2c84183232154f315b534e847972a42f and recovered profile paths already present there, including PRE-RICH/profile/PreRichEconomicProjection.hs and PreRichEconomicAdmission.hs, plus the TypeScript ticket-level Issue/Reveal/Claim/Expire refinements, expiry policy, Jackpot policy, Cardano observation projection and executable-liquidity observer. These are different paths from the historical PRE-RICH/onchain candidates discussed in the earlier cross-branch note.

The register now contains a source catalog of 30 entries. Each records source ID, repository path, Git blob SHA-1, baseline commit, authority class and relation to the economic inventory. The checker validates exact catalog coverage against the pinned source map. This is source provenance and drift detection, not deployment authentication and not proof that the source universe is exhaustive.

### Source-derived inventory expansion

The register expanded from 17 to 32 component/boundary rows. The checker now requires 15 source-surface anchors linking normative or implementation clauses to named register rows. Newly explicit surfaces include:

- atomic ticket sale coupling (ticket mint, Treasury payment and unresolved-ticket reservation);
- current Classic-6 two-row result distribution and the distinction between statistical reserve and deterministic worst-case exposure;
- immutable winning payout and its transition into pending liability;
- single-use Claim settlement and terminal L4 classification;
- profile-defined expiry policy crystallized at issuance;
- ticket identity, transferability and no duplication of the economic right;
- state-derived Jackpot funding gap and full locked-balance payout exactly once;
- Treasury Genesis bootstrap evidence versus qualified PrizePool liquidity;
- frozen USDM value and settlement conversion boundaries;
- concrete spendable UTxO evidence for executable liquidity;
- class caps and saleability controls;
- caller-supplied admission Boolean premises;
- Cardano minimum-UTxO/execution-cost classification;
- the observed ticket-status domain versus the complete lifecycle.

This is a broader and more adversarial source checklist, but it remains curated. The test suite verifies that the known checklist cannot be silently shortened or detached from its rows; it does not prove that no other economic content exists.

### Findings that block PA2/PA7

1. The Haskell V3 Expire constructor carries a class but no ticket ID or timestamp; the application refinement requires ticket identity, class, issuance/expiry timestamps and per-ticket reserve release.
2. V3 Claim changes an aggregate liability, while the application refinement binds current owner, owner signature, exact frozen payout, ticket identity and retained NFT.
3. V3 Reveal accepts class and payout, while the application refinement additionally requires Beacon readiness, commitment/result verification, per-ticket expiry, row payout composition and exact liability crystallization.
4. The Haskell V3-to-Universal projection folds over the observed class list and rejects duplicate/unknown classes, but the fold itself does not establish that every canonical profile class occurs exactly once. The separate TypeScript Cardano projection checks exactly eight classes; this is a separate implementation path, not proof that every authoritative deployment path uses it.
5. PRE-RICH EconomicAdmission receives truthVerified, eevFresh, obligationsComplete and allOmegaSuccessorsInCertifiedKernel as Boolean arguments. Their presence does not prove the truth of those premises.
6. Cardano projection and refinement tests exercise bounded input cases; synthetic test fixtures do not authenticate a complete deployed ticket universe or prove L6 empty.
7. SafetyCapital, ReserveProtection, MandatoryFutureCosts and locked Jackpot remain in V3/Universal ProtectedCapital but have no complete, disjoint mapping to the R7 expression L1 + L2 + worst-case-Ω(L3). No R7 cell has been invented for the unmapped add-ons.
8. Ticket identity and expiry policy are lifecycle metadata, not themselves historical ledger values; the register does not assign them to ℌ or to L5 merely because they affect terminal-state accounting.

### CI and corrections

- Run #20 at commit 53aa813a776fb81a00b4721a5b815ce6d7b203a6 failed closed on two literal source-anchor mismatches: an A1-A5 source phrase and the case/wording of the Genesis bootstrap sentence.
- Run #21 at commit 6f02c6d5f582fa07012f180490c349d065b2d16a passed the source guards, inventory gate and 45/45 Node tests after correcting those anchors.
- Run #22 at commit d8be60447b00162a070c93127d558413e95eb5ea passed the source guards and inventory gate; the combined Node suite reported 48 tests, 48 pass, 0 fail. The audit output reported 32 component rows, 30 source-catalog rows and 15 required/registered source surfaces. It still returned closureEligible false and MECHANICAL_EVIDENCE_REGISTER_VALID_BUT_PROFILE_CLOSURE_UNPROVEN.

### Current phase result

- Phase A: PARTIAL — source universe and economic transition surfaces are better enumerated, but PA2 remains open.
- Phase B: PARTIAL — L1/L3/L4/L5 relationships and add-on gaps are documented; PC3/PC5 reconciliation remains open.
- Phase C: BLOCKED — no complete authoritative A4↔L3 contingency refinement over Ω.
- Phase D: BLOCKED — no definitive V3↔R1 binding.
- Phase E: BLOCKED — Accept/T/Ω/EEV/S0 are not authoritatively bound.
- Phase F: PASS for bounded Node tests and pinned source gates only.
- Phase G: PARTIAL — source catalog and exact source pins are present; deployment/observation provenance is absent.

PA2, PA3, PA4, PA5, PA6 and PA7 remain open. No semantic kernel changes, deployment, ledger transaction, mint, merge or manual workflow dispatch occurred.


### Final documentation CI record

- Run #23: SUCCESS on d6743836f84b003ad833657faf51cc740ae19227, 48/48 Node tests; the report/matrix update was checked on its exact SHA.
- Run #24: SUCCESS on 7ae34445db58c3eb7dcd9840c51e7019fd10851c, 48/48 Node tests; source catalog and expanded inventory gates passed.
- The audit result remains closureEligible=false, with 32 component/boundary rows, 30 pinned source-catalog rows and 15 required source surfaces. These counts measure the reviewed checklist, not the full economic domain.
