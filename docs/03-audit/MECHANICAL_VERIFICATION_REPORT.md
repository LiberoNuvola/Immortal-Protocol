# Mechanical Verification Report
**Status:** Evidence record | **Version:** 3.0.0
**Artefacts:** `verification/finite_model_checks.py`, `verification/FINITE_MODEL_CHECK_RESULTS.txt`

---

## 1. Scope, and what this is not

The harness checks the mathematical claims of `03_ECONOMIC_KERNEL_FINAL.md` and
`15_COMPOSITION_CONTRACT.md` on **finite** systems: 400 randomly generated ones (fixed seed
`20260917`, reproducible) plus hand-built fixtures.

| This report **is** | This report **is not** |
|---|---|
| MECHANICAL EVIDENCE for the abstract model on finite instances | a proof for infinite state spaces — the paper proofs in `03` are that |
| a check that the stated theorems are not mis-stated | evidence about any implementation, adapter, oracle or deployment |
| a source of counterexample witnesses | a discharge of R1, R2, R3, R5, R6, R7, R8 or R9 |

A finite system is modelled as `succ(s,a) = {T(s,a,ω) | ω ∈ Ω(s,a)}`. No generality is lost
for the kernel results, all of which quantify over successors only.

## 2. Results

| Check | Method | Result |
|---|---|---|
| **T1** monotonicity of `Pre`, `F` | randomised, 30 subset pairs per system | 400 pass / 0 fail |
| **T3** `K*` is a fixed point, inside `Safe` and `Pre`, and is the **greatest** post-fixed point | exhaustive over all subsets | 400 pass / 0 fail |
| **T4 / T-KUNDER** `K_c ⊆ Safe ∧ K_c ⊆ Pre(K_c) ⇒ K_c ⊆ K*` | **exhaustive over every subset of every system**; 1 588 certificates examined | 400 pass / 0 fail |
| **T6** gated execution never leaves the certificate | adversarial event resolution, arbitrary policy, 20 runs × 40 steps per system | 271 pass / 0 fail (129 systems vacuous — no non-empty certificate existed) |
| **T9** enlarging `Ω` shrinks `K*` | randomised enlargement | 400 pass / 0 fail |
| Conservation algebra | 2 000 random admissible delta vectors | 0 violations |
| Expiry finality | reachability from the expired class | expired class absorbing; no path to live or settled |

## 3. Findings that changed the documentation

### 3.1 The composition counterexample was stated at the wrong level — **corrected**
v2.0.0 claimed `K_A × K_B ⊄ Pre_AB(K_A × K_B)`. The fixture shows that with idle actions
available the product state set **can** be inductive in the joint system (`F3 = True`), and
the joint start state can lie in `K*_AB`. The refutation is real but sits at the **gate**:

```
F2:  A_safe_A(K_A) × A_safe_B(K_B)  ⊄  A_safe_AB(K_A × K_B)      [confirmed True]
```

`15` §3 and `COMPOSITIONALITY_PROOF_AND_CERTIFICATION.md` §1 were rewritten accordingly, and
**X5b (joint gate)** was added to C-COMP. Without this correction a deployment could have
satisfied the letter of X5 by exhibiting an inductive product set while leaving the unsafe
simultaneous action ungated.

### 3.2 Certificate conservatism is the common case, not an edge case
In **196 of 400** systems some valid certificate was a **strict** subset of `K*`. The
liveness cost described in `03` §4.3 is therefore routine, and a deployment should expect to
refuse actions that were genuinely viable.

### 3.3 Ω narrowing produced false certification in roughly a third of systems
In **138 of 400** systems, a narrowed envelope certified at least one state that is not
viable under the true envelope. Narrowing is not a theoretical hazard; in this sample it
silently produced unsound certificates 34.5% of the time. This is mechanical support for
treating `Ω` narrowing as unsound (T9) rather than as a policy violation.

### 3.4 Upgrade non-monotonicity, witnessed
The fixture produces `K_old = {0,1,2}`, `K_new = {2}`, `stranded = {0,1}` under a governance
tightening of `Safe`. This is the executable witness behind **T-UPGRADE-NOMONO** and behind
the requirement that U1 be checked against the *activation state*, not assumed.

### 3.5 T-COMP-INDEP held on every independent product tested
0 failures across 120 randomly generated strictly independent products (72 vacuous). This
supports the theorem but says nothing about real compositions, which rarely satisfy its
assumptions.

## 4. Vacuity note

129 of 400 random systems admitted **no non-empty certificate at all** — i.e. `K* = ∅` or
close to it. Roughly a third of arbitrary systems are simply inadmissible. This is a useful
calibration for the non-vacuity obligation (R8): having a well-defined kernel is not a
formality, and the T-EROSION obstruction test exists because failing it is common.

## 5. Reproduction

```
cd verification && python3 finite_model_checks.py
```

Deterministic under seed `20260917`. Runtime is seconds. The script is the authoritative
statement of what was checked; this report summarises it and does not extend it.

## 6. Category placement

Under the taxonomy of `08` §1 and Part II of the verification brief, everything here is
**MECHANICAL EVIDENCE about the abstract model**. It is not MATHEMATICAL PROOF (the proofs
are in `03`), not a MODEL-LEVEL CERTIFICATE for any deployment, and not IMPLEMENTATION,
ADAPTER or GOVERNANCE CONFORMANCE.
