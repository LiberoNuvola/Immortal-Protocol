# CHANGELOG — from IMMORTAL_FINAL_DOCUMENTATION_2026-09-17 (v1.0.0) to v2.0.0-hardened
**Date:** 17 September 2026

Every substantive change is listed. Editorial-only changes are summarised at the end.

---

## 1. Package integrity

| Change | Detail |
|---|---|
| **Manifest rebuilt** | v1.0.0 `MANIFEST.json` declared `"count": 11` while the package contained 13 Markdown files (00–12). The new manifest enumerates every file with filename, type, role (normative vs supporting/audit), byte size and SHA-256 digest, plus package version, crystallization date, verdict and a deterministic package-level digest. |
| **Package digest defined** | `package_sha256` = SHA-256 over the newline-terminated, `LC_ALL=C`-sorted lines `"<filename>  <sha256>"` for every file except `MANIFEST.json`. The algorithm is stated in the manifest so it is independently reproducible. |
| **Normative/supporting split** | Each file is now labelled as normative specification, analysis, proof record, audit or supporting. |

## 2. New documents

| File | Reason |
|---|---|
| `13_LIVENESS_AND_PROGRESS_SPECIFICATION.md` | v1.0.0 accepted safe stall (§17 of the algorithm guide) but never separated safety, viability and liveness, so the infinite-horizon result could be read as implying the protocol acts. |
| `14_UPGRADE_AND_KERNEL_MIGRATION.md` | v1.0.0 protected crystallized rights (C13) but had no condition preventing an upgrade from stranding the live state outside the new viability kernel. |
| `15_COMPOSITION_CONTRACT.md` | v1.0.0 was silent on multiple instances; the naive compositionality assumption is unsound and is now refuted by counterexample. |
| `16_OMEGA_COMPLETENESS_CONTRACT.md` | v1.0.0 asserted Ω completeness as a normative sentence; it is the assumption on which every downstream result rests and needed first-class treatment. |

No document was created merely to increase the count; each discharges a specific criticism.

## 3. Mathematics added

| ID | Result | Kind |
|---|---|---|
| **T4 / T-KUNDER** | `K_c ⊆ Safe ∧ K_c ⊆ Pre(K_c) ⇒ K_c ⊆ K*` (coinduction) | **new, PROVEN** |
| **CK1–CK8** | required properties of a certified concrete kernel, incl. CK3′ acceptance-compatible inductiveness | new, conformance |
| **T8 / T-REFINE** | refinement-based transfer of the gate from model to implementation | **new, CONDITIONALLY PROVEN** |
| **T9 / T-OMEGA-MONO** | `Ω ⊆ Ω′ ⇒ K*_{Ω′} ⊆ K*_Ω`; narrowing is unsound, enlarging is conservative | **new, PROVEN** |
| **T15 / T-NOBLOCK** | non-blocking inside `K_c` under CK3′ | **new, CONDITIONALLY PROVEN** |
| **T16 / L-PROG** | conditional progress under L1–L4 | **new, CONDITIONALLY PROVEN** |
| **T17 / T-UPGRADE** | safe kernel migration under U1–U8 | **new, CONDITIONALLY PROVEN** |
| **T18** | naive compositionality | **new, REFUTED (counterexample)** |
| **T19 / T-COMP-INDEP** | product of certificates under strict independence | **new, PROVEN under assumptions** |
| **T20 / T-COMP-SOUND** | composed system requires its own certificate | **new, PROVEN** |

## 4. Reclassifications and corrections

| Was (v1.0.0) | Now (v2.0.0) | Reason |
|---|---|---|
| **T7** "Executable strategy safety — PROVEN under execution gate" | **D4 (DEFINITIONAL)** for `A_exec ⊆ A_safe`, plus **C5b/C-EXEC** (obligation) and **T8** (conditional theorem) | The v1.0.0 entry restated the definition of `A_exec`. It was a tautology presented as a security result. |
| **T8** "Adaptive/repeated strategy safety — PROVEN" | **T7**, PROVEN *as a corollary of T6*, with an explicit note that it is mathematically shallow and localises risk to C5b/C14/CK3 | Prevents over-reading. |
| **C5** "Execution checks `K*` viability" | **C5** + **C5a**: checks a declared certified `K_c` satisfying CK1–CK8; explicit prohibition on claiming to test membership in an uncomputed `K*` | `νF` is not assumed computable on an infinite state space. |
| **T12** implementation correctness | **T22**, unchanged status (EVIDENCE REQUIRED), now with explicit refinement requirement C18 | Makes the obligation checkable. |
| **T14** conservation "PROVEN under exhaustive canonical partition" | **T14 CONDITIONALLY PROVEN**, with the under-counting failure mode stated | "PROVEN" was being used for a result depending on an unverified obligation. |
| **T10/T11** expiry/atomicity "PROVEN semantically" | **T12/T13**: expiry CONDITIONALLY PROVEN under stated axioms; atomicity reclassified as NORMATIVE REQUIREMENT | The model has no partial states by construction, so atomicity is a rule about implementations, not a theorem. |
| Audit matrix: 16 domains "CLOSED" | Five-column matrix (universal semantics / proof / implementation / external dependency / status) with residual obligations R1–R9 | v1.0.0 conflated normative closure with mathematical proof. |
| Single verdict line | **Eight-dimensional verdict** (A–H) | A single "CLOSED" was misleading. |
| Proof register appended over time | **Rebuilt from scratch**, 12 fields per entry incl. counterexample boundary and evidence type; IDs are not v1.0.0-compatible | Statuses were not granular enough. |

## 5. Constitution changes

- §5 split into **§5 (viability semantics)** and **§5a (executable viability via `K_c`)**.
- §6 now states that Ω narrowing is *unsound* (backed by T9), not merely forbidden, and
  requires a published perimeter `E`.
- §7 non-vacuity now discharged via `S0 ∈ K_c`.
- **§12 (safety/viability/liveness distinction)**, **§13 (composition)**, **§14 (upgrade,
  with anti-trivialisation)** and **§15 (anti-circularity)** are new.
- Clauses that may not be weakened by governance are marked **[M]**; U7 references this set
  so that an upgrade cannot satisfy migration by weakening `Safe`.

## 6. Conformance changes

- C5 clarified; **C5a, C5b** added.
- **C18–C24** added: refinement disclosure, liveness contract disclosure, non-blocking
  certificate, upgrade migration admissibility, composition contract, perimeter residual-risk
  statement, anti-circularity.
- Every requirement now carries an **evidence class**.

## 7. Explainer changes

Rewritten sections: the checkable-set explanation and its too-small/too-big trade-off; a
"what about waiting" section stating that viability does not imply execution; upgrade
migration; the shared-reserve composition failure; the envelope-boundary limitation; and an
expanded "what is not claimed" list.

## 8. Algorithm guide changes

Restructured from 19 narrative steps to 23 steps, each with operation / mathematical meaning
/ security purpose / failure condition / conformance implication. New steps: certified-kernel
evaluation (9), progress (19), upgrade (20), composition (21). Step 8 now explicitly notes
that `K*` is **not** evaluated at runtime.

## 9. Contamination audit (PRE-RICH boundary)

Searched for: ticket, price, 500×, Genesis, bootstrap, class ladder, Jackpot, hysteresis,
Cardano, UTxO, Plutus, and numeric application constants. **No such term appears in any
universal semantic definition in v2.0.0.** `Jackpot` is named only in `00`/`02`/`12` as
application-layer terminology explicitly excluded from the universal model, with **CAR** as
the universal abstraction.

## 10. Editorial

Consistent notation for `𝒮, A, Accept, Ω, T, Safe, Pre, F, K*, K_c, A_safe, A_exec^spec,
EEV, ProtectedCapital, RawSurplus, CAR`; consistent cross-reference format using the actual repository-relative filename
§x); version and status headers on every document; reading-order table in `00`.

## 11. What was NOT changed

- No governance mechanism was invented.
- No identity system was invented.
- No universal non-vacuity witness was manufactured.
- No probability measure was introduced over `Ω`.
- No claim was made about any implementation, repository or codebase (none was supplied).
