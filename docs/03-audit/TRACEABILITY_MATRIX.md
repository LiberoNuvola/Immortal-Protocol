# IMMORTAL Traceability Matrix — criticism → resolution
**Version:** 3.0.0

Resolution classes: **RESOLVED** (fixed at documentation level) ·
**FORMALIZED + OBLIGATION** (formal treatment added; residual obligation named) ·
**REFUTED** (claim shown false) · **NOT RESOLVABLE HERE** (evidence outside corpus).

---

## Issue 1 — Manifest / crystallization integrity
| Aspect | Resolution |
|---|---|
| Wrong file count (`11` vs 13) | **RESOLVED** — `MANIFEST.json` rebuilt: full enumeration, filename, type, role, byte size, SHA-256 per file. |
| No cryptographic anchor | **RESOLVED** — per-file SHA-256 plus deterministic `package_sha256` with its algorithm stated in-manifest. |
| Normative vs supporting undistinguished | **RESOLVED** — `role` field per file; reading-order table in `00` §6. |
| Verdict not in manifest | **RESOLVED** — `verdict` object mirrors `10` §4. |
| Self-consistency | **RESOLVED** — CHECK A/B in `10`-adjacent audit; hashes computed from the packaged files. |

## Issue 2 — `K*` defined but not computable
| Aspect | Resolution |
|---|---|
| Runtime membership in an abstract `νF` | **RESOLVED** — `03` §4 introduces the certified concrete kernel `K_c`; `11` step 9; Constitution §5a. |
| Missing soundness lemma | **RESOLVED** — **T4 / T-KUNDER**, proved in `03` §4, registered in `08`. |
| Sufficiency of `K_c` for the guarantee | **RESOLVED** — `03` §4.2; T6 parameterised by any `K` with CK2/CK3. |
| Incompleteness w.r.t. `K*` | **RESOLVED** — `03` §4.3, incl. the too-small/too-big asymmetry. |
| Properties required of a concrete kernel | **FORMALIZED + OBLIGATION** — CK1–CK8 (`03` §4.4), conformance C5a; evidence CK8 is deployment-supplied. |
| Operational reading of C5 | **RESOLVED** — `03` §4.5, `07` C5/C5a. |
| Documents implying `K*` computation | **RESOLVED** — Constitution §5a, `04` §1 step 7, `07` C5, `11` steps 8–9, `12`. |

## Issue 3 — T7 too close to definition
| Aspect | Resolution |
|---|---|
| Tautology `A_exec ⊆ A_safe` | **RESOLVED** — reclassified as **D4, DEFINITIONAL** (`02` §2, `08` D4). |
| Separation of spec from conformance | **RESOLVED** — `A_exec^spec` defined in `02` §2 / `04` §2; conformance is **C5b / C-EXEC**. |
| Real security property stated | **FORMALIZED + OBLIGATION** — **T8 / T-REFINE** with refinement relation `ρ` (C18); premise is EVIDENCE REQUIRED. |
| Documents updated | `02`, `04`, `07`, `08`, `10`, `11` step 10, `06` §3. |

## Issue 4 — Safety vs liveness / permanent stall
| Aspect | Resolution |
|---|---|
| Three properties conflated | **RESOLVED** — Constitution §12; `13` §2. |
| Gap between viability and execution | **RESOLVED** — `13` §3 gaps G1–G6. |
| Abstract liveness contract | **FORMALIZED + OBLIGATION** — L1–L4 and **T16 / L-PROG** (`13` §4), disclosure C19. |
| Non-blocking certificate | **FORMALIZED** — CK3′ and **T15 / T-NOBLOCK**, conformance C20. |
| Stall attribution | **RESOLVED** — `13` §5 classification table. |
| Forbidden "fixes" | **RESOLVED** — `13` §6. |
| No blockchain mechanisms imported | **RESOLVED** — L1–L4 are substrate-neutral. |
| Explainer overclaim | **RESOLVED** — `12` "What about waiting?". |

## Issue 5 — Governance upgrades change `K*`
| Aspect | Resolution |
|---|---|
| Upgrade may strand live state | **FORMALIZED + OBLIGATION** — U1 (`14` §3), optional stronger U1′ over `K_c,old ∩ Reach_live`. |
| Crystallized rights | **RESOLVED** — U2, U4; `04` §5. |
| Protection/partition regression | **RESOLVED** — U3. |
| Ω narrowing at migration | **RESOLVED** — U5, backed by T9. |
| Activation atomicity | **RESOLVED** — U6. |
| Trivial satisfaction by weakening `Safe` | **RESOLVED** — U7 anti-trivialisation, keyed to Constitution **[M]** clauses. |
| Determinism / disclosure | **RESOLVED** — U8, CK7. |
| Theorem | **FORMALIZED** — **T17 / T-UPGRADE**, CONDITIONALLY PROVEN (`14` §4). |
| Governance mechanism | **Deliberately not invented** — `09` §3. |
| Inadmissible upgrade behaviour | **RESOLVED** — `14` §6: must not activate, even at cost of permanent stall. |
| Documents updated | Constitution §14, `02` §7, `03` (via T4/T6), `04` §5, `07` C21, `08` T17, `09` D19–D20, `10`, `11` step 20. |

## Issue 6 — Composition
| Aspect | Resolution |
|---|---|
| `K_A × K_B = K_{A×B}` | **REFUTED** — shared-reserve counterexample, `15` §3, registered as **T18**. |
| Why individual viability fails to compose | **RESOLVED** — `15` §3 (each Ω incomplete for the joint environment). |
| Composition contract | **FORMALIZED + OBLIGATION** — **C-COMP / X1–X7** (`15` §4), conformance C22. |
| Strongest unconditional statement | **RESOLVED** — **T20 / T-COMP-SOUND** (certify the composed system). |
| Conditional compositionality | **FORMALIZED** — **T19 / T-COMP-INDEP** under independence 1–5, with scope warning that correlation alone defeats it. |
| No false universal theorem | **RESOLVED** — `15` §7. |

## Issue 7 — Ω completeness
| Aspect | Resolution |
|---|---|
| Assertion treated as fact | **FORMALIZED + OBLIGATION** — `16` §2 splits semantic requirement from adapter conformance; T10 classified PROFILE/ADAPTER OBLIGATION. |
| Soundness direction | **RESOLVED (PROVEN)** — **T9 / T-OMEGA-MONO**, `03` §8: enlargement conservative, narrowing unsound. |
| 13 required contract elements | **RESOLVED** — `16` §4 (authority, domain, actor independence, adaptive adversaries, repetition, correlation, timing, concurrency, liquidity shocks, oracle failure, boundary, unknown events, failure behaviour). |
| Explicit limitation statement | **RESOLVED** — `16` §6, reproduced in `00` §4, `12`, C23. |
| Failure behaviour | **RESOLVED** — `16` §5 (enlarge / fail closed / contract `E` with disclosure). |
| C14 updated | **RESOLVED** — `07` C14, plus new C23. |

## Issue 8 — Cross-document formal consistency
| Term | Single definition site | Consistent in |
|---|---|---|
| `K*` | `03` §1 | 00,01,02,03,04,06,07,08,10,11,12,13,14,15,16 |
| `K_c` | `03` §4.4 | 00,01,03,04,05,07,08,10,11,12,13,14,15 |
| `A_safe`, `A_exec^spec` | `02` §2 | 02,03,04,06,07,08,11,13 |
| `Safe`, `Pre`, `F` | `03` §1 | as above |
| `Ω` | `02` §1 + `16` §2 | all |
| `EEV`, `ProtectedCapital`, `RawSurplus` | `02` §1, §3 | 01,02,05,11 |
| `CAR` | `02` §4 | 00,02,11,15 |
| expiry / atomicity / settlement | `01` §8–§9, `04` | 04,05,08,11 |
| liveness | `13` §2 | 01,06,10,11,12,13 |
| upgrade | `14` | 01,07,08,09,10,11,14 |
| composition | `15` | 01,06,07,08,10,11,15 |
| conformance / implementation | `07` | 07,08,10 |
No competing definitions remain; where a concept has both an abstract and a concrete reading
(`K*` vs `K_c`; `A_exec^spec` vs committed actions), the two are named differently.

## Issue 9 — Proof register reconstruction
**RESOLVED** — `08` rebuilt from scratch; 12 fields per entry; nine-value status vocabulary;
no entry depending on an unverified external assumption is labelled PROVEN; anti-circularity
rules stated in `08` §2.

## Issue 10 — Final audit matrix
**RESOLVED** — `10` §1 uses the five required columns across all 24 required properties,
plus residual obligations R1–R9 in §3.

## Issue 11 — Non-vacuity
**RESOLVED (limitation retained)** — `03` §9, Constitution §7, T11: universal `K* ≠ ∅` NOT
CLAIMED; deployment must exhibit `S0 ∈ K_c`, which yields `S0 ∈ K*` by T4. No witness
manufactured.

## Issue 12 — PRE-RICH boundary
**RESOLVED** — contamination audit in `CHANGELOG` §9; no application constant, price, payout
multiple, ticket mechanic, chain or ledger-model term appears in any universal definition.
`CAR` is the universal abstraction; `Jackpot` is named only as excluded application
terminology.

## Issue 13 — Document package
**RESOLVED** — 00–12 revised; 13–16 added, each discharging a specific issue; no duplicates,
no obsolete versions, no hidden files.

## Issue 14 — Public explanation
**RESOLVED** — `12` covers all eleven required points, including liveness separation, upgrade
migration, composition contract, Ω completeness and an explicit "what is not claimed" list.

## Issue 15 — Line-by-line algorithm
**RESOLVED** — `11` rewritten: 23 steps, each with operation, mathematical meaning, security
purpose, failure condition and conformance implication; all required mappings present.

## Issue 16 — No circular proofs
**RESOLVED** — `08` §2 records the six circularity checks; Constitution §15 makes
anti-circularity a mandatory clause; C24 makes it auditable. Specifically: D4 is not used to
prove itself; `K*` membership is derived only via T4 from CK2/CK3; conformance is never a
model theorem; Ω completeness is never its own evidence; T17 re-establishes the new
certificate rather than assuming it; T18 refutes assumed product viability.

## Issue 17 — Final verdict
**RESOLVED** — eight-dimensional verdict in `10` §4, mirrored in `00` §8 and `MANIFEST.json`.


---

# v3.0.0 — verification pass traceability

| Brief section | Requirement | Resolution |
|---|---|---|
| Part I | Reconstruct R1–R9 and attempt discharge | `RESIDUAL_OBLIGATION_REGISTER.md` |
| Part II | Strict evidence categories | `08` §1 vocabulary extended to 12 statuses; every new document's §Status table uses them |
| Part III | R1 certificate | `CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md`; T-CERT, T-MARGIN, VC1–VC6, E1–E10; abstractness of `𝒮` stated as the reason no instance is possible |
| Part IV | R2 refinement | `REFINEMENT_CONFORMANCE_SPECIFICATION.md`; T-REFINE-FWD; RF1–RF11 covering all eleven required correspondences |
| Part V | R3 Ω perimeter | `OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md`; `Ω-COMPLETE(Env,Ω)` and its failure condition formalised; **equality rejected, containment proved correct** (T-OMEGA-ADMIT) |
| Part VI | R4 liveness | `LIVENESS_AND_PROGRESS_PROOF_SPECIFICATION.md`; T-PROG conditional; T-NOLIVE and T-STALL-ATTRIB proven; FM1–FM10 covering all eight required failure modes |
| Part VII | R5 upgrade | `UPGRADE_MIGRATION_PROOF_AND_CERTIFICATION.md`; `K*_old` vs `K*_new` settled (no inclusion, T-UPGRADE-NOMONO); `S_u ∈ K*_new` shown necessary but insufficient; UC1–UC10 |
| Part VIII | R6 composition | `COMPOSITIONALITY_PROOF_AND_CERTIFICATION.md`; counterexample retained and **corrected**; T-COMP-SOUND, -INDEP, -GATE; XC1–XC8 |
| Part IX | R7 partition | `ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md`; two-sided decomposition A1–A5 / L1–L6 covering all eight required categories; T-CONS-2, T-CONS-GAP; PA1–PA7 as profile obligation |
| Part X | R8 non-vacuity | `NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md`; N1–N4 separation; T-NV-CHAIN, T-NV-SUFF; T-EROSION as obstruction test; no witness manufactured |
| Part XI | R9 EEV | `EEV_ORACLE_AND_VALUATION_CONTRACT.md`; T-EEV-REL and T-EEV-MONO; V1–V9; EV1–EV7 |
| Part XII | Mechanical verification | `verification/` + `MECHANICAL_VERIFICATION_REPORT.md`; T1/T3/T4/T6/T9, composition, upgrade, expiry, conservation |
| Part XIII | Proof register rebuild | `08` v3.0.0, six sections, shallow results flagged |
| Part XIV | Final status matrices | `10` §3 (R1–R9 with missing artifacts) and §4 (eight dimensions) |
| Part XV | Claim audit | `CLAIM_AUDIT.md`; six statements rewritten |
| Part XVI | Open-source readiness | `VERIFICATION_STATUS.md` §5; the two claims separated, only one supported |
