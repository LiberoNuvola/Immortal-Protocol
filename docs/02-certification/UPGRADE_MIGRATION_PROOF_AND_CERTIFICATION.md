# Upgrade Migration Proof and Certification — R5
**Status:** Normative (certification layer) | **Version:** 3.0.0
**Relation to package:** `14_UPGRADE_AND_KERNEL_MIGRATION.md` defines U1–U8 and T-UPGRADE.
This document strengthens the result, settles the relationship between `K*_old` and
`K*_new`, and gives the certification procedure.

---

## 1. The relationship between `K*_old` and `K*_new`

**T-UPGRADE-NOMONO (PROVEN).** There is no general inclusion in either direction between
`K*_old` and `K*_new` for arbitrary specification changes.

**Proof (witnesses).** Tightening: take `𝒮 = {0,1,2}` with `0 →ᵃ 1`, `1 →ᵃ 1`, `2 →ᵃ 2`,
`Safe_old = {0,1,2}`, `Safe_new = {2}`. Then `K*_old = {0,1,2}` and `K*_new = {2}`, so
`K*_old ⊄ K*_new` and states `{0,1}` are **stranded**. Loosening: exchange the two safety
predicates; then `K*_new ⊄ K*_old`. ∎

**Mechanically confirmed.** The tightening witness is executed in
`verification/finite_model_checks.py`; the run reports `K_old = [0,1,2]`,
`K_new = [2]`, `stranded_states = [0,1]`, `old_subset_new = False`.

**Consequence.** No upgrade may be justified by an appeal to monotonicity, continuity, or
"the new rules are stricter so they must be safer". Stricter rules strand states; looser
rules may satisfy U1 while violating U7. Both directions require U1–U8.

## 2. T-UPGRADE-NEC — U1 is necessary as well as sufficient

**Statement.** Let `S_u = μ(S_act)` be the activation state under the new semantics. Then

```
S_u ∈ K*_new   ⟺   there exists an infinite Safe_new-conforming continuation from S_u
```

**Proof.** Immediate from **T-CHAR** (`03` §4A): `K*_new` is exactly the set of states from
which a strategy keeps every `Ω_new`-history in `Safe_new` forever. ∎

**Consequence (the point of the theorem).** If `S_u ∉ K*_new`, the post-activation system is
already committed to either leaving `Safe_new` or stalling permanently — **regardless of how
well the implementation behaves afterwards**. U1 is therefore not a conservative extra
condition; it is the exact boundary of admissibility.

**Operational form.** Since `K*_new` is generally uncomputable, the checkable condition is
`χ_new(S_u) = 1` for a valid certificate `K_c,new`, which gives `S_u ∈ K*_new` by T4. The
converse does not hold: `S_u ∈ K*_new \ K_c,new` is possible, in which case the upgrade is
*genuinely* admissible but **not certifiable**, and MUST NOT activate. This is the upgrade
instance of certificate conservatism (`03` §4.3), and a deployment in this position must
produce a better certificate, not proceed.

## 3. T-UPGRADE-FULL — preservation theorem

**Statement.** Assume U1–U8 of `14` §3 and that `K_c,new` is valid (VC1–VC6) and
post-activation execution satisfies C-EXEC w.r.t. `M_new`. Then activation preserves:

| Preserved property | Established by |
|---|---|
| **current safety** | U1 + VC2: `S_u ∈ K_c,new ⊆ Safe_new` |
| **future viability** | U1 + T6 applied in `M_new`: `∀t ≥ t_act: S_t ∈ K_c,new` |
| **pending obligations** | U2 (image existence) + U3 (partition remains exhaustive over carried-over content) |
| **crystallized rights** | U2 + U6: activation is a single transition, so no intermediate state exists in which a right belongs to neither system |
| **unresolved exposure** | U3 + U5: exposure representation is carried over and `Ω_new` does not exclude a material class present in `Ω_old` |
| **protected capital** | U3 non-regression |
| **historical invariants** | U4 |
| **non-trivialisation** | U7: `Safe_new` retains every Constitution `[M]` clause |
| **reproducibility** | U8: `μ`, `M_new`, `K_c,new` published and versioned before activation |

**Proof.** Safety and future viability: T4 gives `K_c,new ⊆ K*_new`; U1 gives the base case;
VC2/VC3 give the hypotheses of T6; C-EXEC gives the gate hypothesis; U5 gives envelope
authority. The remaining rows are direct consequences of the cited conditions, with U6
supplying the atomicity needed to exclude a half-migrated state and U7 excluding the
degenerate solution `Safe_new = 𝒮_new`. ∎

**Status:** **CONDITIONALLY PROVEN.** Every hypothesis is a conformance, certification or
governance obligation. Nothing here establishes that a particular governance act satisfies
them.

## 4. Is `S_u ∈ K*_new` sufficient on its own?

**No.** It is sufficient for *future safety and viability* (§3 rows 1–2) and for nothing
else. Specifically it does not give:

- **rights preservation** — `μ` could map a state with crystallized rights to a viable state
  with those rights deleted; U2 is required;
- **non-regression of protection** — U3;
- **history integrity** — U4;
- **non-trivialisation** — U7. Without it, `Safe_new = 𝒮_new` makes `K*_new = 𝒮_new` and U1
  becomes vacuous. **U7 is what stops U1 from being satisfiable by fiat.**

So U1 is necessary (T-UPGRADE-NEC) but far from sufficient, and a governance process that
checks only U1 has checked the one condition that any upgrade can pass by redefining safety.

## 5. Upgrade certification procedure

Executed **before** activation, in order. Any failure aborts; the system remains under
`M_old` (`14` §6).

| Step | Action | Artifact |
|---|---|---|
| **UC1** | Publish `M_new`, `μ`, and the diff against `M_old` (which of `Safe, Ω, T, A`, partition, `K_c` changed) | specification + diff |
| **UC2** | Re-establish a valid certificate `K_c,new`: VC1–VC6 per `CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` | certificate package |
| **UC3** | Check U7 first — `Safe_new` retains every `[M]` clause | clause-by-clause mapping |
| **UC4** | Determine the activation state `S_act` and compute `S_u = μ(S_act)`; verify `χ_new(S_u) = 1` | witness + evaluation trace |
| **UC5** | If activation timing is not fixed in advance, verify U1′: `μ(K_c,old ∩ Reach_live) ⊆ K_c,new` | proof over the reachable set |
| **UC6** | Verify U2/U3/U4: rights image, protection non-regression, history preservation | per-right mapping table |
| **UC7** | Verify U5: `Ω_new` does not narrow coverage; any perimeter change is a C23 disclosure | perimeter diff |
| **UC8** | Verify U6: activation is a single atomic canonical transition passing the ordinary gate | transition spec + test |
| **UC9** | Verify U8: determinism, versioning, domain separation, publication before activation | digests + timestamps |
| **UC10** | Publish the upgrade certificate; only then activate | signed package |

**UC3 before UC4 is deliberate.** Checking U1 first invites the trivialisation the ordering
prevents.

## 6. Status

| Item | Category | Status |
|---|---|---|
| T-UPGRADE-NOMONO | MATHEMATICAL PROOF + MECHANICAL EVIDENCE | **PROVEN**; witness executed |
| T-UPGRADE-NEC | MATHEMATICAL PROOF | **PROVEN** (from T-CHAR) |
| T-UPGRADE-FULL | MATHEMATICAL PROOF, conditional | **CONDITIONALLY PROVEN** |
| U1 sufficiency alone | — | **REFUTED** (§4) |
| UC1–UC10 procedure | NORMATIVE CLOSURE | **CLOSED** |
| Any actual upgrade satisfying U1–U8 | GOVERNANCE CONFORMANCE | **NOT DISCHARGEABLE HERE** |
