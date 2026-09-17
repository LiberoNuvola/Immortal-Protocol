# EEV Oracle and Valuation Contract — R9
**Status:** Normative (certification layer) | **Version:** 3.0.0
**Relation to package:** `07` C16 and `08` T21 state the obligation. This document proves
what the universal layer *can* prove about a supplied valuation, and states what the adapter
must demonstrate.

---

## 1. EEV as a parameter

Write `M[V]` for the system whose `EEV` is supplied by a valuation oracle `V : 𝒮 → ℝ`.
Everything in `03` is stated over a fixed system, so it is stated over `M[V]` for whatever
`V` the adapter supplies.

## 2. T-EEV-REL — relativisation (PROVEN)

**Statement.** For any valuation oracle `V`, all kernel results hold in `M[V]`: T1–T7, T9,
T-CHAR, T-EROSION, T4/T-KUNDER and T6 are valid with `EEV := V`.

**Proof.** None of those proofs inspects the internal structure of `EEV`; `V` enters only
through `Safe` and the derived quantities. Substituting `V` changes the system, not the
arguments. ∎

**Consequence, stated bluntly.** The safety theorems are guarantees **relative to the number
the oracle supplied**. If `V` overstates value, the protocol is safe with respect to a
fiction. Relativisation is a real result — it is what lets the universal layer be
valuation-agnostic — but it transfers the entire burden to the adapter, and it must never be
quoted as though it validated `V`.

## 3. T-EEV-MONO — conservative valuation is the safe direction (PROVEN)

**Statement.** Suppose `Safe` is monotone in valuation: `V′ ≤ V` pointwise and
`Safe_{V}(S) ⇐ Safe_{V′}(S)` (an under-valuation is never "more safe" by accident) — as
holds for the standard form `Safe ⊆ {EEV ≥ ProtectedCapital}`. Then

```
V′ ≤ V   ⇒   K*_{V′} ⊆ K*_{V}
```

**Proof.** `Safe_{V′} ⊆ Safe_{V}`, so `F_{V′}(K) ⊆ F_{V}(K)` for every `K`; by T1/T3 the
greatest fixed points are ordered the same way. ∎

**Consequence.** Deliberate under-valuation (haircuts, conservative marks) **shrinks** the
kernel and is sound, exactly as enlarging `Ω` is sound (T9). Over-valuation is unsound. This
gives the adapter a clear direction of error: **when uncertain, mark down.**

## 4. The EEV contract

| # | Element | Requirement |
|---|---|---|
| **V1 Authoritative source** | the source is fixed by the protocol's verification predicate, not by the caller, operator, frontend or submission order (C2, C11) |
| **V2 Verification** | every reported value carries evidence checkable against that predicate; unverified values are never used |
| **V3 Freshness** | a declared freshness window; a value outside it is stale and unusable, with no grace path |
| **V4 Determinism** | identical authoritative inputs yield an identical `EEV`; the derivation is domain-separated, versioned and reproducible (C7) |
| **V5 Conversion/haircut** | any conversion, liquidity discount or slippage assumption is part of the declared derivation, applied in the conservative direction (T-EEV-MONO) |
| **V6 Valuation boundary** | what `EEV` does and does not value — cell `A1`/`A2` of the two-sided decomposition only; A3/A4/A5 are excluded (see `ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` §2.1) |
| **V7 Failure state** | unavailability, staleness, equivocation and out-of-range values all fail closed; the action is rejected and the protocol may stall |
| **V8 Equivocation handling** | if a source can report different values to different observers, that possibility is an event class in `Ω` (`16` §4 item 10), not an implementation detail |
| **V9 Shock representation** | adverse valuation moves are represented in `Ω`, at worst case, not as an expectation |

**V7 and V9 together are the substance.** A valuation contract without a fail-closed path and
without `Ω`-represented shocks supplies a number, not a guarantee.

## 5. What the adapter must demonstrate

| # | Artifact |
|---|---|
| **EV1** | Source specification and the verification predicate binding it |
| **EV2** | Derivation specification: inputs → `EEV`, deterministic and versioned |
| **EV3** | Freshness window with justification, and the staleness test |
| **EV4** | Conservatism argument: evidence that the derivation errs downward (T-EEV-MONO) |
| **EV5** | Failure-path evidence: tests showing rejection/stall on unavailable, stale, equivocating or out-of-range input |
| **EV6** | The `Ω` entries representing valuation shocks and oracle failure, cross-referenced to the perimeter package (R3/P3) |
| **EV7** | Boundary statement per V6, cross-referenced to the accounting partition (R7/PA1) |

## 6. What cannot be proven at the universal layer

- That any particular `V` is **correct**. Correctness of a valuation is an empirical claim
  about the world and about a data source; it is outside mathematics and outside this corpus.
- That a source will remain authoritative.
- That the freshness window is short enough for the real environment's rate of change — this
  is a perimeter question (R3), not a valuation question.

## 7. Status

| Item | Category | Status |
|---|---|---|
| T-EEV-REL | MATHEMATICAL PROOF | **PROVEN** |
| T-EEV-MONO | MATHEMATICAL PROOF | **PROVEN** (given monotone `Safe`) |
| V1–V9 contract | NORMATIVE CLOSURE | **CLOSED** |
| Correctness of any `V` | ADAPTER CONFORMANCE | **NOT DISCHARGEABLE HERE — and not a mathematical claim** |
