# Concrete Kernel Certification Specification — R1
**Status:** Normative (certification layer) | **Version:** 3.0.0
**Relation to `03_ECONOMIC_KERNEL_FINAL.md`:** `03` supplies the mathematics (T4/T-KUNDER,
T-CHAR, T-EROSION) and the abstract obligations CK1–CK8. This document supplies the
**certificate format, verification conditions and minimum evidence** a deployment must
produce. It adds no new normative authority.

---

## 1. Can R1 be discharged from the corpus?

**No — and the reason is structural, not an omission.** `𝒮`, `A`, `Ω`, `T` and `Safe` are
deliberately uninstantiated in the universal model; a concrete `K_c` is a set of concrete
states and cannot exist before a profile fixes them. What *can* be discharged here, and is:

| Discharged | Result |
|---|---|
| Soundness of the certificate *idea* | **T4 / T-KUNDER**, PROVEN (`03` §4) |
| That `K*` is the maximal such region | **T-CHAR**, PROVEN (`03` §4A) |
| That certificates are genuinely strict in general | mechanically witnessed in 196/400 finite systems (`verification/`) |
| A **certificate schema** with proved verification conditions | **T-MARGIN** below, PROVEN |
| A structural obstruction test | **T-EROSION**, PROVEN (`03` §4B) |
| An exhaustive, machine-checkable statement of what must be supplied | §3–§6 below |

**Missing artifact for full discharge:** a profile instantiation
`(𝒮, A, Accept, Ω, T, Safe)` plus a decision procedure for `S ∈ K_c`. Nothing short of that
can close R1.

## 2. Certificate format (mathematical definition)

A **viability certificate** is a tuple

```
Cert = ⟨ id, version, M, χ, Wit, Bnd, Proofs ⟩
```

| Field | Meaning |
|---|---|
| `id, version` | domain-separated identifier; changing either is an upgrade event (CK7, `14` §7) |
| `M` | the system `(𝒮, A, Accept, Ω, T, Safe)` the certificate is about, by version |
| `χ : 𝒮 → {0,1}` | the **characteristic predicate**; `K_c = χ⁻¹(1)` |
| `Wit : K_c → Act` | the **witness selector**; for each `S ∈ K_c` the action discharging CK3 |
| `Bnd` | the bounds/abstractions used to discharge the `∀ω` obligation soundly |
| `Proofs` | artefacts discharging VC1–VC6 below |

`χ` and `Wit` must be total on their domains, deterministic, and expressible without
reference to any operator, caller, frontend or submission order.

## 3. Verification conditions

A certificate is **valid** iff all of the following are discharged.

| VC | Condition | Formal statement |
|---|---|---|
| **VC1** | Decidability | `χ(S)` is computable within the resources available at decision time (CK1) |
| **VC2** | Safety inclusion | `∀S: χ(S) = 1 ⇒ Safe(S)` (CK2) |
| **VC3** | Inductiveness | `∀S: χ(S) = 1 ⇒ Wit(S) ∈ A(S) ∧ ∀ω ∈ Ω(S,Wit(S)): χ(T(S,Wit(S),ω)) = 1` (CK3) |
| **VC4** | Acceptance compatibility | `∀S: χ(S)=1 ⇒ Accept(S, Wit(S))` whenever required authoritative inputs are present (CK3′) |
| **VC5** | Envelope soundness | the `Ω` quantified over in VC3 is the authoritative envelope of the declared perimeter, or a sound **over**-approximation of it (CK5/CK6; sound by **T9**) |
| **VC6** | Non-vacuity | `∃S₀: χ(S₀) = 1`, and `S₀` is the declared initial state (CK4, C15) |

**T-CERT (PROVEN).** VC2 ∧ VC3 ⇒ `K_c ⊆ K*`; adding VC6 ⇒ `K* ≠ ∅`; adding VC4 ⇒
`A_exec^spec(S;K_c) ≠ ∅` for every `S ∈ K_c` with inputs present.
*Proof:* the first is T4 applied to `K_c = χ⁻¹(1)`; the second is immediate; the third is
T15. ∎

**Note on VC5.** Over-approximating `Ω` is permitted and *shrinks* `K_c`'s admissible
witnesses; it can never make an invalid certificate valid. Under-approximating `Ω`
invalidates VC3 silently, which is the single most dangerous certification error.

## 4. T-MARGIN — a proved certificate schema

Most profiles will want a buffer-style certificate. This schema is proved sound here so
that a deployment inherits the proof and only has to discharge its side conditions.

**Setup.** Let `b(S) = EEV(S) − ProtectedCapital(S)` and suppose the profile establishes:

- **(S1) Safety sufficiency.** `b(S) ≥ 0 ∧ Rep(S) ⇒ Safe(S)`, where `Rep(S)` is the profile's
  representation predicate (obligations represented, partition exhaustive, no expired right
  live).
- **(QNE) Quiescence non-erosion.** There is a distinguished conservative action `a₀(S) ∈ A(S)`,
  available at every `S` with `Rep(S)`, such that for all `ω ∈ Ω(S,a₀(S))`:
  `b(T(S,a₀,ω)) ≥ b(S)` and `Rep(T(S,a₀,ω))`.

**Define** `χ(S) = 1 ⟺ Rep(S) ∧ b(S) ≥ 0`, and `Wit(S) = a₀(S)`.

**Claim.** `K_c = χ⁻¹(1)` satisfies VC2 and VC3, hence `K_c ⊆ K*`.

**Proof.** VC2: by (S1). VC3: let `χ(S)=1`. By QNE, `a₀(S) ∈ A(S)` and for every
`ω ∈ Ω(S,a₀)` the successor has `b ≥ b(S) ≥ 0` and `Rep`, so `χ = 1` on every successor. ∎

**Status:** PROVEN, conditional on (S1) and (QNE), which are **profile obligations**.

### 4.1 The margin variant, and why a constant margin does not help
If quiescence erodes the buffer by at most `δ > 0` per step, no constant-margin set
`{b ≥ m}` is inductive: the successor only guarantees `b ≥ m − δ`. Raising `m` does not fix
this, because the same argument applies at the new level. By **T-EROSION**, if erosion is
bounded below by `ε > 0` *uniformly over all actions*, then `K* = ∅` outright. Therefore:

> **QNE is not a convenience. Some non-eroding conservative action must exist, or the
> deployment has no viability kernel to certify.**

A profile whose obligations accrue while idle must supply a genuinely non-eroding action
(for example: settle-and-shrink, or a quiescent state in which accrual is itself suspended),
or accept `K* = ∅`.

## 5. Minimum evidence a real deployment must provide

| # | Artifact | Form |
|---|---|---|
| E1 | Profile instantiation of `𝒮, A, Accept, Ω, T, Safe`, versioned | specification document |
| E2 | `χ` as executable, deterministic, domain-separated code or a decidable formula | source + spec |
| E3 | `Wit` as an explicit selector | source + spec |
| E4 | VC2 discharge | proof, mechanised proof, or exhaustive model check over the abstract domain |
| E5 | VC3 discharge — **the central obligation** | inductive-invariant proof; if abstraction is used, a soundness argument for the abstraction |
| E6 | VC4 discharge | proof + tests showing `Accept(S, Wit(S))` under stated input availability |
| E7 | VC5 discharge | the `../01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md` / `OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md` perimeter package, plus proof that the checked envelope over-approximates it |
| E8 | VC6 discharge | the `S₀` witness and its derivation (see `NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md`) |
| E9 | Conservatism report | worked examples of states in `K* \ K_c` if known, and the liveness cost accepted |
| E10 | Certificate digest | SHA-256 over E2/E3 artefacts, bound to the deployment version |

A deployment publishing E1–E10 has discharged **R1**. Publishing fewer than E1–E8 has not.

## 6. Symbolic certificate vs implementation evidence

These are different categories and must never be substituted (`08` §1):

| | Establishes | Does not establish |
|---|---|---|
| **Symbolic certificate** (E2–E5) | that the *specified* region is sound | that any code evaluates `χ` correctly |
| **Implementation evidence** (R2) | that the code computes `χ`, `Wit` and the gate as specified | that the specified region is sound |

Both are required. Either alone is insufficient, and a deployment that produces only one
must say which.

## 7. Status

| Item | Category | Status |
|---|---|---|
| T4, T-CHAR, T-EROSION, T-CERT, T-MARGIN | MATHEMATICAL PROOF | **PROVEN** (T-MARGIN conditional on S1, QNE) |
| Certificate format §2, VC1–VC6 §3 | NORMATIVE CLOSURE | **CLOSED** |
| An actual `K_c` for any deployment | MODEL-LEVEL CERTIFICATE | **NOT DISCHARGEABLE HERE** — requires E1 |
| `χ`/`Wit` implementation conformance | IMPLEMENTATION CONFORMANCE | **EVIDENCE REQUIRED** (R2) |
