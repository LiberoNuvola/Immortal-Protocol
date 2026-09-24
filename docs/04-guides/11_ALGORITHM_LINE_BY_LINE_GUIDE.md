# IMMORTAL Economic Algorithm — Line-by-Line Guide
**Status:** Supporting | **Version:** 3.0.0

Each step states: **(1) operation · (2) mathematical meaning · (3) security purpose ·
(4) failure condition · (5) conformance implication.**

No application-specific mechanics appear here.

---

## Step 0 — Input
1. Take canonical state `S`, candidate action `a`, authoritative evidence, the declared
   environment contract `E`, and the deployment's certified kernel `K_c`.
2. `S ∈ 𝒮`, `a ∈ A(S)`.
3. The algorithm never begins from a payout, price or desired outcome; it begins from
   verified state.
4. No canonical state, or no declared `K_c` → reject.
5. C1, C5a.

## Step 1 — Establish canonical truth
1. Determine which state and evidence are authoritative.
2. Apply the verification predicate; nothing else defines truth.
3. *Who says this value is true?* — the predicate, not an operator, frontend, caller or
   submission order.
4. Unverified or missing authoritative truth → reject / safe stall.
5. C1, C2, C11.

## Step 2 — Derive obligations
1. Identify every obligation created, affected or exposed by `a`.
2. Update the canonical partition `P`.
3. An unrepresented obligation silently becomes surplus; that is the dominant accounting
   failure (T14 boundary).
4. An economically material obligation that cannot be represented → reject.
5. C3, C17.

## Step 3 — Derive unresolved exposure
1. Identify uncertainty that can create future economic exposure.
2. Exposure enters `ProtectedCapital` or blocks the action.
3. Small probability is **not** a ground for omission; `Ω` is a set, not a measure.
4. Unrepresentable exposure → reject.
5. C3, C14.

## Step 4 — Compute protected capital
1. `ProtectedCapital = Σ_i value(P_i(S))` over the exhaustive partition, including any CAR
   component classified as non-discretionary.
2. Deterministic derivation from canonical state.
3. Prevents reclassification of protected value as surplus.
4. Partition not exhaustive / category missing → fail closed.
5. C4, C17, I2.

## Step 5 — Compute executable economic value (EEV)
1. Obtain `EEV` only from an authoritative, verified, sufficiently fresh source.
2. `EEV(S)` as a derived canonical quantity.
3. A stale or unverified valuation makes every downstream boundary meaningless.
4. Verification or freshness failure → reject / safe stall. Never substitute a convenient
   value.
5. C16, T21.

## Step 6 — Compute the surplus boundary
1. `RawSurplus = max(0, EEV − ProtectedCapital)`.
2. State-local accounting boundary.
3. Marks what is *not* protected. It is not a distribution instruction and not a safety test.
4. Negative residual → `RawSurplus = 0`; it never becomes a licence to draw on protection.
5. C4, I3.

## Step 7 — Construct the uncertainty envelope
1. Build `Ω(S,a)` from canonical state/history and the declared perimeter `E`.
2. `Ω(S,a) ⊇ Real_E(S,a)`.
3. The actor must not be able to choose an envelope that makes its own action look safe.
   Enlargement is sound (T9); narrowing is unsound.
4. Any narrowing by caller, adapter or operator → non-conforming. Completeness not
   demonstrable for a class → enlarge, fail closed, or contract `E` with disclosure.
5. C14, C23, `16`.

## Step 8 — Apply the viability semantics
1. Recall `Pre(K) = {S | ∃a ∀ω∈Ω(S,a), T(S,a,ω) ∈ K}`, `F(K) = Safe ∩ Pre(K)`, `K* = νF`.
2. `K*` is the maximal viability semantics.
3. Defines what "still viable" means independently of any implementation.
4. — (this step computes nothing at runtime).
5. Informational; `K*` is **not** evaluated by the implementation.

## Step 9 — Evaluate the certified concrete kernel
1. Test `∀ ω ∈ Ω(S,a) : T(S,a,ω) ∈ K_c`, where `K_c ⊆ Safe`, `K_c ⊆ Pre(K_c)`.
2. By **T4**, `K_c ⊆ K*`, so kernel membership certifies genuine viability.
3. This is the implementable stand-in for the uncomputable `K*`. Conservatism is accepted;
   unsoundness is not.
4. Any `ω` landing outside `K_c` → reject. `K_c` membership not effectively checkable →
   fail closed and treat the certificate as defective.
5. C5, C5a, CK1–CK8.

## Step 10 — Execution gate
1. `A_exec^spec(S;K_c) = { a | Accept(S,a) ∧ ∀ω∈Ω(S,a): T(S,a,ω) ∈ K_c }`; commit only from
   this set.
2. Definitionally `A_exec^spec ⊆ A_safe(S,K_c)` (**D4** — no security content by itself).
3. The security content is the *conformance* claim that the implementation has no other
   commit path (C-EXEC, T8). This is the critical anti-bypass rule.
4. Any code path committing outside `A_exec^spec` → non-conforming; T6/T8 do not apply.
5. C5b, C18.

## Step 11 — Policy selection
1. A policy may choose among members of `A_exec^spec(S;K_c)`.
2. Selection within an already-safe set.
3. A malicious or defective policy selector cannot enlarge the safe set.
4. Policy proposing an action outside the gated set → non-conforming.
5. C5b, Constitution §10.

## Step 12 — Compute the complete post-state
1. Compute every coupled economic delta before committing anything.
2. `S′ = T(S,a,ω)` in full, not a projection.
3. Validating only the immediately visible balance is the classic partial-view error.
4. Any coupled delta uncomputed → reject.
5. C6.

## Step 13 — Re-check invariants on the post-state
1. Check obligation coverage, protected capital, unresolved exposure, `Safe`, `K_c`
   membership, expiry, determinism, historical monotonicity.
2. I1–I12 on `S′`.
3. Pre-state validity does not imply post-state validity.
4. Any invariant failing → reject.
5. C3–C9, C12, C13.

## Step 14 — Atomic commit
1. `PRECONDITION → VALIDATE → COMPUTE DELTA → CHECK POST-STATE → COMMIT ATOMICALLY → POSTCONDITION`.
2. One canonical transition.
3. Prevents races on coupled changes and half-real obligations.
4. Partial economic state → non-conforming.
5. C6, T13.

## Step 15 — Record canonical history
1. Record the resulting canonical state and history.
2. Historical state is separate from current state.
3. Monotone historical facts are not rewritten because operating conditions contracted.
4. History rewritten or conflated with current state → non-conforming.
5. C12, C13, I10.

## Step 16 — Expiry
1. For an expired right: `claimable = false`, `new liability = 0`, late-reveal economic
   effect `= none`, no resurrection.
2. The right is canonically consumed; `A` admits no reinstating action.
3. Closes the late-reveal and resurrection classes.
4. Any path recreating an expired right → non-conforming.
5. C8, T12.

## Step 17 — Settlement
1. Settlement consumes or reduces the canonical right exactly once.
2. Canonical consumption; crystallized amounts are not silently recomputed.
3. Closes double-settlement.
4. Second settlement attempt → reject.
5. C9, C13, T24.

## Step 18 — Safe stall
1. If no action passes the gate, do nothing.
2. `A_exec^spec(S;K_c) = ∅`.
3. Stalling is preferable to crossing an unsafe boundary; liveness infrastructure cannot
   override economic safety.
4. Classify the stall per `13` §5 (environmental fault vs. certificate conservatism vs.
   genuine viability boundary vs. CK3′ defect).
5. C10, C19, C20.

## Step 19 — Progress (separate property)
1. Under published assumptions L1–L4, an eligible gated action is eventually committed.
2. `13` §4 (**T16**).
3. Makes explicit that `S ∈ K_c` guarantees *existence* of a continuation, not execution.
4. Assumption violated → stall persists; safety unaffected.
5. C19, C20. **Not guaranteed by IMMORTAL alone.**

## Step 20 — Upgrade (when applicable)
1. Before activating a changed `Safe`, `Ω`, `T`, `A`, partition or `K_c`: demonstrate
   U1–U8, re-establish CK1–CK8 for `K_c,new`, then activate as one atomic transition.
2. `μ(S_act) ∈ K_c,new ⊆ K*_new` (**T17**).
3. Prevents stranding the live state outside the new kernel and prevents silent
   extinguishment of crystallized rights; U7 prevents satisfying migration by weakening
   `Safe`.
4. Any of U1–U8 not demonstrable → the upgrade must not activate, even at the cost of
   permanent stall.
5. C21.

## Step 21 — Composition (when applicable)
1. Before any economic interaction with another instance or external economic system:
   satisfy X1–X7 and certify the **composed** system.
2. `K_AB ⊆ Safe_AB ∧ K_AB ⊆ Pre_AB(K_AB)` (**T20**); `K_A × K_B` is not inherited (**T18**).
3. Prevents the shared-resource double-draw and cross-system partial commits.
4. Interaction without a composed certificate → non-conforming.
5. C22.

## Step 22 — Infinite-horizon result
1. If `S_0 ∈ K_c` and every committed action passes the gate, induction gives
   `∀t ≥ 0 : S_t ∈ K_c ⊆ K* ⊆ Safe`.
2. **T6**, with `K_c ⊆ K*` by **T4**.
3. This is why the algorithm is not a one-step balance check: the invariant is
   re-established at every transition, against every event in the envelope.
4. Premises failing (gate bypass, Ω narrowing, defective certificate) → the conclusion is
   void, not degraded.
5. C5, C5b, C14, C15.
