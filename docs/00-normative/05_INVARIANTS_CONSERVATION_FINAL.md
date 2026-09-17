# IMMORTAL Economic Invariants & Conservation
**Status:** Normative | **Version:** 3.0.0

## 1. Invariants

| # | Invariant | Kind |
|---|---|---|
| I1 | **Obligation coverage:** every accepted obligation/exposure is represented before the creating action is executable. | normative |
| I2 | **Protected-capital integrity:** protected value cannot be reclassified as surplus. | normative |
| I3 | **Surplus boundary:** `RawSurplus = max(0, EEV − ProtectedCapital)`. | definition |
| I4 | **Post-state safety:** accepted transitions satisfy `Safe`. | normative, enforced by gate |
| I5 | **Viability:** accepted transitions land in the certified kernel `K_c` (hence in `K*` by T4). | normative, enforced by gate |
| I6 | **Atomicity:** coupled deltas commit together. | normative |
| I7 | **Determinism:** identical authoritative inputs produce identical derived results. | normative |
| I8 | **Single settlement:** a settled right cannot settle again. | normative |
| I9 | **Expiry finality:** expiry cannot recreate rights or liabilities. | normative |
| I10 | **Historical monotonicity:** defined historical maxima never decrease. | normative |
| I11 | **Certificate integrity:** `K_c` satisfies CK1–CK8 and any change to it is an upgrade event. | conformance |
| I12 | **Perimeter disclosure:** the environment perimeter `E` and residual-risk statement are published. | conformance |

I1–I10 are preserved across an upgrade only under the migration predicate of `14`.

## 2. Conservation condition

For the canonical exhaustive, mutually exclusive obligation/exposure partition
`P = {P_1,…,P_n}`:

- no protected commitment may disappear except through its permitted settlement or expiry
  transition;
- no liability may arise without canonical representation;
- residual value is distributable only after all protected components are accounted for.

## 3. Conservation theorem (conditional)

**T14.** Let `P` be exhaustive and mutually exclusive over protected economic content, and
let every accepted transition update `P` only through permitted settlement, expiry or
representation-creating steps. Then for every accepted transition,

```
ProtectedCapital(S′) = ProtectedCapital(S) + Δ_represented − Δ_settled − Δ_expired
```

and no protected quantity is reclassified as surplus.

**Proof.** By exhaustiveness and disjointness, `ProtectedCapital` is the sum over `P`; by
hypothesis each `P_i` changes only via the enumerated permitted deltas; summation gives the
identity. Reclassification would require a `P_i` decrement not matched by a permitted delta,
contradicting the hypothesis. ∎

**Status:** CONDITIONALLY PROVEN. The hypothesis "P is exhaustive" is **C17**, a
conformance obligation. If a material obligation category is missing from `P`, the identity
still holds over `P` but `ProtectedCapital` under-counts true exposure, and the
under-counted amount is silently treated as surplus. This is the dominant accounting
failure mode and is why C17 carries evidence requirements.
