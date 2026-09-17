# Accounting Partition and Conservation Certification — R7
**Status:** Normative (certification layer) | **Version:** 3.0.0
**Relation to package:** `05_INVARIANTS_CONSERVATION_FINAL.md` states invariants I1–I12 and
the conservation theorem T14. This document supplies the canonical decomposition, corrects a
conflation found in v2.0.0, and gives the certification obligation.

---

## 1. Correction: conservation is two-sided

> **Correction notice.** v2.0.0 wrote conservation over a single partition `P` of "protected
> economic content" and simultaneously used `RawSurplus = max(0, EEV − ProtectedCapital)`.
> Those are different sides of the balance: `EEV` values **executable assets**, while
> `ProtectedCapital` values **commitments against them**. A single partition cannot carry
> both without double counting. v3.0.0 splits the decomposition in two and states
> conservation separately on each side, with the surplus boundary as the *link* between
> them rather than a member of either.

## 2. The canonical two-sided decomposition

### 2.1 Asset side `𝔄(S)` — what the protocol can actually execute against

| Cell | Content | Included in `EEV`? |
|---|---|---|
| **A1** | Verified liquid executable value | **yes** |
| **A2** | Verified value subject to a declared conversion/haircut, valued net | yes, net of the haircut |
| **A3** | Value present but not verified, or stale beyond the freshness window | **no** — fails closed (C16) |
| **A4** | Value contingent on an unresolved event | **no** on the asset side; the contingency appears on the liability side as L3 |
| **A5** | Non-economic/informational holdings | **no** |

```
EEV(S) = value(A1) + value_net(A2)
```

### 2.2 Liability side `𝔏(S)` — what is committed

| Cell | Content | Included in `ProtectedCapital`? |
|---|---|---|
| **L1** | Pending accepted obligations (due, not yet settled) | **yes** |
| **L2** | CAR — value conditionally committed to a future allocation | **yes** |
| **L3** | Unresolved exposure: worst-case incremental liability over `Ω` | **yes**, at its `Ω`-worst-case value |
| **L4** | Settled obligations | **no** — left the liability side through settlement |
| **L5** | Expired rights/liabilities | **no** — left through expiry, and cannot return (I9) |
| **L6** | Unrepresented exposure | **not representable ⇒ the creating action is not executable** (I1) |

```
ProtectedCapital(S) = value(L1) + value(L2) + value_worstcase_Ω(L3)
```

### 2.3 The link, not a cell

```
RawSurplus(S) = max(0, EEV(S) − ProtectedCapital(S))
```

Surplus is a **derived boundary between the two sides**, not a partition cell. Treating it as
a cell is exactly the error that lets protected value be reclassified as distributable.

### 2.4 Historical quantities
Historical monotone facts live in a **separate ledger `ℌ`**, disjoint from both sides, and
never enter `EEV` or `ProtectedCapital` (C12, I10). They are recorded, not valued.

## 3. Well-formedness conditions

| ID | Condition |
|---|---|
| **PC1** | `A1…A5` are pairwise disjoint and jointly exhaustive over asset content |
| **PC2** | `L1…L6` are pairwise disjoint and jointly exhaustive over commitment content |
| **PC3** | No item appears on both sides except through the declared contingency link A4 ↔ L3 |
| **PC4** | `ℌ` is disjoint from `𝔄` and `𝔏` |
| **PC5** | Every cell has a deterministic valuation function (C7); L3's is the `Ω`-worst case, not an expectation |
| **PC6** | Every transition maps cells to cells only through the permitted deltas of §4 |
| **PC7** | L6 is empty in every executable state — an unrepresentable exposure blocks execution |

## 4. Permitted deltas

```
represent : ∅ → L1 | L2 | L3        (creates a represented commitment)
settle    : L1 | L2 → L4            (consumes the canonical right exactly once, I8)
expire    : L1 | L2 | L3 → L5       (final; no return path, I9)
resolve   : L3 → L1 | L5            (uncertainty resolves into obligation or nothing)
verify    : A3 → A1 | A2            (evidence arrives)
stale     : A1 | A2 → A3            (freshness lapses; fails closed)
realise   : A4 → A1 | A2 | ∅        (contingency resolves, paired with resolve on L3)
```

No other cell-to-cell movement is admissible.

## 5. T-CONS-2 — two-sided conservation

**Statement.** Under PC1–PC7 and the permitted deltas of §4, for every accepted transition:

```
ProtectedCapital(S′) = ProtectedCapital(S) + Δrepresent + Δresolve↑ − Δsettle − Δexpire
EEV(S′)              = EEV(S)              + Δverify + Δrealise − Δstale
```

and no element of `L1 ∪ L2 ∪ L3` is reclassified as surplus, because `RawSurplus` is derived
from the two totals and is not a cell any item can move into.

**Proof.** By PC2 the liability total is the sum over `L1,L2,L3`; by PC6 each cell changes
only through §4's deltas; summing gives the first identity. By PC1 and PC6 the same argument
gives the second. Reclassification would require a movement `L_i → RawSurplus`, which is not
among the permitted deltas and is not expressible, since `RawSurplus` is a derived scalar. ∎

**Status:** **CONDITIONALLY PROVEN** — conditional on PC1–PC7, which are profile obligations.

**Mechanically checked:** the conservation algebra was exercised on 2000 random admissible
delta vectors with 0 violations (`verification/`). This checks the *algebra*, not any
profile's PC1–PC7.

## 6. Why exhaustiveness cannot be discharged universally

The universal model does not know what economic content a profile has. A finite universal
cell list is possible (§2 gives one) but its **exhaustiveness for a given profile** is a
statement about that profile's economics, not about the model. Inventing profile cells here
would manufacture false closure.

**T-CONS-GAP (PROVEN, and the reason PC7 matters).** If a material commitment class `X` is
omitted from `𝔏`, then `ProtectedCapital` under-counts by `value(X)` and `RawSurplus`
over-counts by the same amount. The conservation identity of §5 **still holds** over the
recorded cells, so no invariant check fires. *Proof:* immediate from the definitions. ∎

This is the package's most dangerous silent failure: conservation is locally satisfied while
the protocol treats real obligations as distributable surplus. Nothing inside the accounting
system detects it; only PC2 exhaustiveness evidence does.

## 7. Certification obligation (profile level)

| # | Artifact |
|---|---|
| **PA1** | The profile's instantiation of `A1…A5` and `L1…L6` with concrete content classes |
| **PA2** | Exhaustiveness argument for PC1/PC2 — an enumeration of all economic content the profile can create, each mapped to exactly one cell |
| **PA3** | Disjointness argument (PC3), especially the A4 ↔ L3 contingency link |
| **PA4** | Valuation functions per cell (PC5), with L3's worst-case-over-`Ω` derivation |
| **PA5** | Delta-closure proof (PC6): every protocol operation maps to §4 deltas only |
| **PA6** | PC7 evidence: the executability check that keeps L6 empty |
| **PA7** | An adversarial review specifically seeking an omitted commitment class (T-CONS-GAP) |

PA2 and PA7 are the substance of R7. The rest is bookkeeping.

## 8. Status

| Item | Category | Status |
|---|---|---|
| Two-sided decomposition §2, PC1–PC7, deltas §4 | NORMATIVE CLOSURE | **CLOSED** |
| T-CONS-2 | MATHEMATICAL PROOF, conditional | **CONDITIONALLY PROVEN** |
| T-CONS-GAP | MATHEMATICAL PROOF | **PROVEN** |
| Conservation algebra | MECHANICAL EVIDENCE | 0/2000 violations |
| Exhaustiveness for any profile | PROFILE CONFORMANCE | **NOT DISCHARGEABLE HERE** — requires PA1–PA7 |
