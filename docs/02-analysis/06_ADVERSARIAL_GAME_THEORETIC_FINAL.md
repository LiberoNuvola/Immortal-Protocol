# IMMORTAL Adversarial & Game-Theoretic Security Analysis
**Status:** Analysis (non-normative) | **Version:** 3.0.0

## 1. Model

A two-party interaction: the **protocol** (which may only commit actions passing the gate)
and an **adversary/environment** that (i) chooses which admissible actions are attempted,
adaptively on full history, and (ii) resolves `ω` within `Ω(S,a)` adversarially.

## 2. Universal result

If every committed action lies in `A_exec^spec(S;K_c)` and `Ω` is authoritative and complete
for the declared perimeter `E`, then every executable history beginning in `K_c` remains in
`K_c ⊆ K* ⊆ Safe` (T6, T7).

This covers history-dependent and adaptive strategies, repeated optimisation, randomisation
and optional stopping, because the invariant is re-established at every transition rather
than argued once over a horizon.

## 3. Where adversarial risk actually lives

T7 is a corollary of T6, so the analysis does not end at "proven". All residual adversarial
surface reduces to exactly three premises:

| Premise | Owner | Failure consequence |
|---|---|---|
| **C-EXEC** — implementation commits only gated actions | implementation | invariant void; classical exploit surface |
| **Ω completeness** over perimeter `E` | adapter / profile | out-of-model event; theorem silent |
| **CK3** — `K_c` really is inductive | certifier | certificate unsound; gate admits unsafe successors |

An adversary rationally attacks these three, not the fixed-point mathematics.

## 4. Attack classes

| Attack | Semantic response | Depends on |
|---|---|---|
| Spend protected capital | Blocked by I2 / protection predicate | C4, C17 |
| Create hidden obligation | Blocked by exhaustive accounting | C17 |
| Narrow Ω to look safe | Non-conforming; **unsound by T9** | C14, `16` |
| Use stale / unverified EEV | Fail closed | C16 |
| Reveal after expiry | No economic effect (I9) | C8 |
| Double settlement | Blocked by canonical consumption (I8) | C9 |
| Repeat until failure | Infinite-horizon invariant (T6) | C-EXEC |
| Adapt strategy to history | Covered (T7) | C-EXEC |
| Race coupled changes | Atomicity required (I6) | C6 |
| Interleave across two deployments | **Not covered by single-system results**; see `15` | C-COMP |
| Force permanent stall | Safety-conforming; a **liveness** attack, see `13` | L1–L4 |
| Push an upgrade that weakens `Safe` | Blocked by U7/U8 anti-trivialisation | `14` |
| Exploit `K_c` over-approximation error | Certificate invalid (CK3 breach) | CK8 evidence |
| Griefing via conservative `K_c` | Economic inefficiency, not unsafety (§4.3 of `03`) | accepted trade-off |

## 5. Grief / denial analysis

Because the gate fails closed, an adversary who can make authoritative inputs unavailable
can induce a stall. This is a **liveness** attack and is not mitigated by the safety
machinery. Profiles that require progress must supply the assumptions of `13` and show that
the adversary cannot indefinitely violate them. IMMORTAL does not claim such a bound.

## 6. Identity

Identity/Sybil policy is profile-scoped. IMMORTAL does not invent an identity system, and
no universal result here depends on identity assumptions.
