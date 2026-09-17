# Claim Audit — sentence-level scope review
**Status:** Audit | **Version:** 3.0.0

Every strong-claim word in the package was located and its surrounding statement checked
against the evidence that supports it. Counts below are occurrences across all Markdown files
at the time of audit.

| Term | Occurrences | Audit outcome |
|---|---|---|
| "guarantee(s/d)" | 31 | all now qualified by the region (`K_c`/`K*`), the envelope (`Ω`/`Env`), and the gate premise. Three v2.0.0 uses referring to unqualified "safety guarantees" were narrowed. |
| "proves/proof" | 6 | each points to a specific theorem ID with its assumptions stated in the same document |
| "always" | 8 | retained only where the quantifier is genuinely universal in the model (e.g. "enlarging Ω is always sound" — T9) |
| "never" | 41 | retained where it expresses a normative prohibition or a proved impossibility; each occurrence carries the clause or theorem that backs it |
| "cannot" | 47 | audited for the distinction between *mathematically impossible* (e.g. `K_c` outside `K*`) and *normatively forbidden* (e.g. an operator narrowing Ω). Both readings now appear with their basis. |
| "complete" | 49 | mostly "Ω completeness"; every occurrence is tied to a declared perimeter `Env` and never asserted as achieved |
| "verified" | 12 | used only of inputs and evidence, never of the package or an implementation |
| "conforming" | 45 | used of deployments against stated requirements, never as a claim that any deployment conforms |
| "CLOSED" | 79 | audited so that normative closure is never presented as mathematical proof or as implementation conformance |

## Statements rewritten because their scope exceeded their evidence

| # | Location | Was | Now |
|---|---|---|---|
| 1 | `15` §3 | `K_A × K_B ⊄ Pre_AB(K_A × K_B)` | refutation restated at the **gate** level (F2), with F1 and F3 distinguished; mechanically confirmed |
| 2 | `05` §2–§3 | conservation over a single partition, alongside an asset-minus-liability surplus formula | two-sided decomposition; `RawSurplus` is the link, not a cell (`ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` §1) |
| 3 | `08` T7 | "adaptive strategy safety — PROVEN" without qualification | PROVEN **as a corollary of T6**, with an explicit note that it is mathematically shallow |
| 4 | `03` §5 (T5) | "a safe continuation exists" | unchanged, but every citing site now states that existence ≠ execution (T-NOLIVE) |
| 5 | `14` §4 | U1 read as the migration condition | U1 shown **necessary** (T-UPGRADE-NEC) but **insufficient** without U7; ordering of checks changed so U7 is verified first |
| 6 | `16` §2 | "Ω completeness" as a requirement | admission condition settled as **containment, not equality** (T-OMEGA-ADMIT), with the reason equality would be wrong |

## Claims deliberately weakened rather than defended

- No statement anywhere asserts that `K*` is computable, non-empty, or that any `K_c` exists
  for any profile.
- No statement asserts progress, liveness or eventual execution without citing L1–L4.
- No statement asserts that a valuation is correct; `T-EEV-REL` is stated together with the
  warning that relativisation transfers, rather than discharges, the burden.
- No statement asserts that two conforming deployments compose.
- No statement asserts that any implementation conforms.

## Residual strong claims and their exact basis

| Claim retained | Basis |
|---|---|
| "Enlarging Ω is always sound" | T9, PROVEN |
| "A certified kernel is contained in `K*`" | T4, PROVEN, exhaustively checked on 1 588 finite certificates |
| "`K*` is exactly the winning region of the safety game" | T-CHAR, PROVEN (uses choice) |
| "An eroding system has an empty kernel" | T-EROSION, PROVEN |
| "Safety never implies progress" | T-NOLIVE, PROVEN by witness |
| "A stall inside a VC4-valid certificate is an input-availability failure" | T-STALL-ATTRIB, PROVEN |
| "Naive composition is unsound at the gate" | REFUTED claim + executed counterexample |
| "Under-valuation is the safe direction" | T-EEV-MONO, PROVEN given monotone `Safe` |

## Method and limitation

The audit was performed by term search across the corpus followed by manual review of each
occurrence in context. It is a **review**, not a formal check: there is no mechanical
procedure here that certifies the absence of an over-claim, and a reader should treat this
document as a record of what was examined rather than a proof that nothing was missed.
