# IMMORTAL Decision Register
**Status:** Record | **Version:** 3.0.0

## 1. Decisions carried forward from v1.0.0

1. IMMORTAL remains universal, chain-neutral and application-neutral.
2. Generic reserve terminology is **CAR — Conditional Allocation Reserve**.
3. Economic execution is viability-gated.
4. Ω is authoritative; callers cannot choose a convenient subset.
5. Non-vacuity is a deployment admission obligation, not an invented universal mechanism.
6. EEV remains adapter/profile scoped; failure is fail-closed.
7. Obligation/exposure accounting is exhaustive and mutually exclusive.
8. Expiry is final.
9. Coupled economic transitions are atomic.
10. Implementation evidence remains separate from semantic proof.
11. PRE-RICH constants and mechanics remain application-specific.

## 2. Decisions taken in v2.0.0

| # | Decision | Rationale |
|---|---|---|
| **D12** | The executable gate tests a **certified concrete kernel `K_c`**, never an uncomputed `K*`. | `K*` is a greatest fixed point on a possibly infinite space and is not assumed computable. T4 makes `K_c` sound. |
| **D13** | `K_c` must satisfy **CK1–CK8**, including CK3′ (acceptance-compatible inductiveness). | Soundness (CK3) plus non-blocking (CK3′), so stalls are attributable. |
| **D14** | Conservatism of `K_c` is accepted; unsoundness is not. | `K_c` too small costs liveness; `K_c` too large destroys the guarantee. |
| **D15** | `A_exec ⊆ A_safe` is reclassified as **DEFINITIONAL (D4)**; the security claim is the conformance obligation **C-EXEC** and the refinement theorem **T8**. | Removes the v1.0.0 tautology. |
| **D16** | A declared refinement relation `ρ` (C18) is required so implementation conformance is stated precisely rather than gestured at. | Makes T8's premise checkable. |
| **D17** | Safety, viability and liveness are separated; **liveness is not claimed**. Progress assumptions L1–L4 must be published (C19). | `S ∈ K_c` does not imply anyone acts. |
| **D18** | Permanent safe stall is safety-conforming and is never repaired by weakening the gate. | Constitution §10. |
| **D19** | Upgrades require the migration predicate **U1–U8**, including anti-trivialisation U7. | Without U7 an upgrade could satisfy migration by weakening `Safe`. |
| **D20** | An upgrade that cannot demonstrate U1–U8 **must not activate**, even at the cost of permanent stall. | "Activate and repair later" is the exact failure the gate exists to prevent. |
| **D21** | Naive compositionality is **refuted**, not merely unproven; composition requires **C-COMP (X1–X7)** and a certificate on the composed system. | Shared-resource counterexample, `15` §3. |
| **D22** | `T-COMP-INDEP` is retained but flagged as rarely applicable, because correlation alone defeats its product-envelope assumption. | Prevents misuse as a general licence to compose. |
| **D23** | Ω completeness is split into a semantic **normative requirement** and an **adapter admission obligation**, with a published perimeter `E` and residual-risk statement (C23). | It cannot be discharged by assertion. |
| **D24** | Ω enlargement is endorsed as the conservative direction, backed by **T9**. | Converts a rule into a consequence. |
| **D25** | The proof register is **rebuilt**, not appended; each entry carries 12 fields including a counterexample boundary. | v1.0.0 statuses were not granular enough to separate theorem from obligation. |
| **D26** | The manifest carries per-file SHA-256 digests, byte sizes, roles and a deterministic package digest. | v1.0.0 manifest miscounted files and had no cryptographic anchor. |
| **D27** | No universal `K* ≠ ∅` witness is manufactured. | None can be derived without profile values. |

## 3. Decisions deliberately NOT taken

- No governance mechanism is specified (who may upgrade, and how, is profile-scoped).
- No identity or Sybil system is invented.
- No probability measure is introduced over `Ω`; results remain worst-case over a set.
- No universal composition theorem is asserted beyond T19/T20.
- No claim is made about any existing implementation.
