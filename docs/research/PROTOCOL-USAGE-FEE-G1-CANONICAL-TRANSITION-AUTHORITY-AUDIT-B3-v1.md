# IMMORTAL — G1 Canonical Transition & Authority Binding Audit B3 v1

**Classification:** research / non-normative / no implementation authorization  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-20  
**Status:** TARGETED AUDIT COMPLETE — G1 INTERFACE NOT YET BOUND TO CANONICAL EXECUTION  
**Scope:** compare the G1 interface proposal with the branch's normative transition/authority rules and the existing fee-bearing separation harness. Documentation only.

## 1. Executive finding

The G1 interface proposal is compatible with the normative architecture only if it is treated as an **authoritative input to the existing canonical transition**, not as an independent admission path.

The repository already defines the controlling sequence in `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md` v3.0.0:

`canonical state → authoritative input verification → obligation/exposure derivation → candidate delta → complete post-state → Safe → K_c → accept/reject → atomic commit → history`

The root Constitution v3.0.0 states that economic truth derives from defined verification predicates, infrastructure actors do not gain discretionary economic authority, and protocol-defined derivations must be deterministic, domain-separated, versioned, reproducible and independently verifiable.

The current G1 proposal names useful declaration fields and fail-closed states, but no inspected artifact binds those fields to a production canonical transition evaluator or establishes the source's authority. **G1 remains OPEN.** No code change is justified by this audit.

## 2. Normative sources inspected on the target branch

### 2.1 Root Constitution — `docs/00-normative/01_CONSTITUTION_FINAL.md`, v3.0.0

Relevant constraints:
- §2: no founder, developer, operator, relayer, publisher, adapter or frontend obtains discretionary economic authority merely by operating infrastructure; canonical truth needs defined verification predicates.
- §3: every accepted obligation and economically material unresolved exposure must be represented before the action creating/accepting it becomes executable.
- §5a: economic execution is gated by the declared certified concrete kernel `K_c`; the deployment may not claim membership in uncomputed `K*`.
- §8: coupled economic changes are atomic.
- §11: protocol derivations are deterministic, domain-separated, versioned, reproducible and independently verifiable.
- §15: evidence cannot circularly establish the claim it is intended to prove.

Implication for G1: a declaration record, signature, evidence URI, profile label or non-empty field is not automatically authority. The approved verification predicate must establish why that declaration is authoritative in the specific profile/state context.

### 2.2 State & Transition Specification — `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md`, v3.0.0

The transition is `(S,a,ω) → S′ = T(S,a,ω)`. Undefinedness is rejection, not a transition. Accepted inputs must be complete, verified and fresh; obligation/exposure accounting must be exhaustive; the committed action must lie in `A_exec^spec(S;K_c)`.

Failure of authoritative truth, freshness, obligation representation, safety or effective `K_c` checking rejects the action or safe-stalls as specified. Coupled deltas commit together or not at all.

Implication for G1: if the selected transition is fee-bearing, the fee obligation must enter the candidate delta and full post-state before safety/viability admission. G1 cannot run after admission as a UI-only check or as a separate fee-only commit. The exact fee amount/settlement details remain separate gates.

### 2.3 Conformance Specification — `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md`, v3.0.0

The relevant requirements include canonical state, no forbidden infrastructure authority, obligations before action execution, protected amounts, certified `K_c`, atomicity, deterministic derivation, canonical verification predicates, and disclosure of implementation refinement.

Implication for G1: interface shape alone cannot establish conformance. A later implementation must show how the declaration is consumed by the actual transition and how the implementation step refines exactly one canonical transition.

## 3. Existing fee-bearing separation harness

Inspected on this branch:
- `docs/research/FEE-BEARING-TRANSITION-SEPARATION-BOUNDARY-v1.md`
- `audit/algorithmic-governability/fee-bearing-transition-separation-boundary.mjs`

The research harness covers important separation properties: distinct Protocol Usage Fee and ChainExecutionCost, reference/conversion failure handling, safety precedence, immutable-target intent, atomic-transition identity and prohibition of a parallel fee lifecycle.

However, its candidate is a synthetic frozen JavaScript object with placeholder strings such as `state-1` and `target-opaque`. Its local `commit` predicate checks shape and a supplied `safe` boolean; it does not consume the canonical G1 declaration proposal, authenticate an authority source, verify a real profile/version binding, derive the actual post-state, or check a certified `K_c` witness. The harness is therefore a bounded separation guard, not proof that G1 authorization or canonical transition integration exists.

This is not a defect in the harness's stated research scope. It is a boundary on what its passing result can establish.

## 4. G1 interface requirements after canonical binding

Before a production implementation can be justified, the canonical contract must specify—not this audit invent—the following:

1. **Canonical action binding:** how a canonical usage-class identifier is derived from or bound to `a` in `T(S,a,ω)`. No prose-only or UI-derived class mapping.
2. **Profile/state binding:** how the declaration is bound to the exact profile revision and relevant canonical pre-state, and how stale/mismatched binding is rejected.
3. **Authority predicate:** which normative source is permitted to issue/amend the declaration and what verification predicate establishes that fact. The Constitution does not authorize an operator or adapter merely by role.
4. **Completeness and conflict semantics:** how missing classes, unknown identifiers, duplicates, conflicting mappings, revision changes and revocation are handled deterministically.
5. **Obligation ordering:** when `DECLARED_TRUE`, derive the fee obligation before complete post-state safety and `K_c` evaluation. A `DECLARED_FALSE` result means no Protocol Usage Fee under that declared profile/class, but does not remove other obligations or native chain execution costs.
6. **Atomicity/refinement:** if a fee-bearing transition is accepted, its economic delta and the applicable fee obligation/settlement effects must follow the existing canonical transition and atomicity contract; no independent fee lifecycle or second commit.
7. **Evidence scope:** distinguish proof that a declaration was authorized from proof that a fee was settled/received. Neither evidence class substitutes for the other.

These are closure questions, not a new authority mechanism or new economic policy.

## 5. Required end-to-end shape (conceptual only)

`canonical pre-state S + action a`
→ `verify authoritative inputs and applicable profile revision`
→ `resolve canonical usage class`
→ `verify G1 declaration (TRUE / FALSE / UNCONFIGURED / INVALID)`
→ `derive applicable obligations; if TRUE, include fee obligation`
→ `candidate delta + complete post-state`
→ `Safe and certified K_c`
→ `accept/reject`
→ `atomic canonical commit`
→ `adapter settlement evidence`
→ `receipt/accounting classification`

This is a dependency map, not a claim that the stages are implemented. `EconomicFeeTarget`, `SettlementAmount`, reference admissibility, receipt evidence, accounting classification and any reward budget remain distinct and are not closed by G1.

## 6. Non-regression and decisions deliberately left open

- No fee-bearing classes are selected by this audit.
- No authority/signature/credential mechanism is invented.
- No fee amount, settlement asset, oracle, rounding, freshness, affordability or beneficiary rule is selected.
- No Treasury/reward classification is inferred from fee receipt.
- No second economic state machine is introduced.
- No changes to V3 or Reveal semantics.
- No production code, tests, CI, deployment or on-chain behavior changed.

## 7. Decision

**G1 remains OPEN.** The interface proposal is conceptually compatible with the normative transition model, but the authoritative declaration producer, verification predicate, canonical class mapping and real transition binding remain unestablished in the inspected surfaces.

**Verification limits:** targeted exact-branch reads of the named normative and research artifacts plus the existing Notion fee workflow/matrix. This is not a whole-repository proof of absence and does not certify runtime or ledger behavior.
