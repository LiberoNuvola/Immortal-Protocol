# IMMORTAL — White Paper

**Universal Economic Protocol**  
**Documentation baseline:** September 2026  
**Status:** Experimental / Open Source / Research & Development

## Abstract

IMMORTAL is a universal protocol model for economic systems whose safety-critical behavior can be described through explicit state, obligations, protected capital, admissible transitions and verifiable evidence.

The protocol is designed to separate three things that are often mixed together:

1. what the economic system means;
2. how an execution environment realizes that meaning;
3. what a concrete application chooses to build with it.

The resulting architecture is:

```text
IMMORTAL
   ↓
Adapter
   ↓
Application
```

The current adapter is Cardano. The current application is PRE-RICH.

IMMORTAL does not require either one at the universal semantic layer.

## 1. Why IMMORTAL

Economic software often combines policy, implementation details and operational authority in a single system. This makes it difficult to determine whether a failure is a violation of the intended economic model, an implementation defect, an environment assumption or simply an application-specific policy choice.

IMMORTAL addresses this by making the boundary explicit.

A conforming system should be able to answer:

- What is the canonical state?
- Which obligations are protected?
- Which actions are admissible?
- Which future outcomes must be considered?
- Which transitions are safe?
- Which evidence demonstrates that the implementation realizes the specification?

## 2. The universal model

Let:

- `S` be a state;
- `A(S)` the actions available from `S`;
- `Ω(S,a)` the admissible outcome set for action `a`;
- `T(S,a,ω)` the resulting state;
- `Safe` the set of economically safe states.

The universal viability operator is:

`Pre(K) = { S | ∃a ∀ω∈Ω(S,a), T(S,a,ω)∈K }`

and:

`F(K) = Safe ∩ Pre(K)`

The greatest fixed point is:

`K* = νF`

`K*` is the abstract viability kernel. It represents states from which there exists an action that keeps every admissible future outcome inside the kernel.

A concrete implementation need not compute `K*` directly. IMMORTAL therefore permits a certified concrete kernel `K_c` subject to the requirements and evidence defined by the normative specifications.

## 3. Why K* and Kc are different

`K*` is a mathematical specification object.

`K_c` is a concrete certified approximation that an implementation can actually enforce.

The important direction is safety-preserving:

`K_c ⊆ K*`

when the post-fixed-point conditions are satisfied.

A repository must not claim that an implementation is safe merely because `K*` exists mathematically. The concrete state predicate, refinement relation, transition implementation and evidence must all be addressed.

## 4. Economic protection

IMMORTAL separates economic exposure from freely distributable surplus.

The universal model defines:

`RawSurplus = max(0, EEV − ProtectedCapital)`

where `ProtectedCapital` represents the canonical protected obligations/exposures of the active system and `EEV` is the relevant economic evaluation value.

The protocol does not prescribe one universal denomination, oracle, asset or business model. Those belong to an application profile and its adapter.

## 5. Conditional Allocation Reserve

IMMORTAL uses the generic abstraction **CAR — Conditional Allocation Reserve**.

CAR is intentionally universal. A concrete application may call a corresponding mechanism a jackpot, reserve, bonus pool or another application-specific name, but that name does not change the universal semantics.

## 6. Safety and execution

An action is safe for a kernel `K` when every admissible outcome remains in `K`:

`A_safe(S,K) = { a ∈ A(S) | ∀ω∈Ω(S,a): T(S,a,ω)∈K }`

The execution specification additionally requires the action to satisfy the system's acceptance predicate.

The conceptual gate is:

```text
Economic Gate
     ↓
Viability Gate
     ↓
Policy Selector
     ↓
Atomic Execution
```

The gate is not merely documentation. The implementation must demonstrate that the execution path cannot silently bypass the safety predicate.

## 7. Atomic transitions

Economic state changes are treated as atomic transitions where the economic semantics require atomicity.

This prevents intermediate states from being treated as if they were valid completed economic states.

The exact transaction model is environment-specific. In Cardano, for example, the adapter maps the abstract transition into UTxO transactions, validity intervals, datums, redeemers, validators and native assets.

## 8. Expiry finality

Expiry is a state boundary when an application defines an expiring economic right.

After expiry, the application must not silently recreate an economic right or liability that the transition system has already extinguished.

The exact expiry semantics are application-level unless elevated by a future universal decision.

## 9. Adversarial reasoning

IMMORTAL treats the environment as adversarial unless assumptions explicitly constrain it.

The outcome set `Ω` is therefore part of the safety model.

A narrower `Ω` can produce a larger apparent kernel and can therefore create unsound certification if excluded outcomes are actually possible.

The formal results include the monotonicity of the kernel with respect to outcome-set assumptions.

## 10. Composition

Independent safety does not automatically imply safety of a composed economic system.

IMMORTAL therefore treats composition as a separate certification problem. Cross-system shared resources, coupled transitions, common liabilities and correlated outcomes must be explicitly addressed.

## 11. Upgrades

An upgrade is not merely a software version change when economic semantics are involved.

A valid migration must preserve the required economic and safety properties for the states and obligations that cross the upgrade boundary.

The upgrade contracts and certification documents define the required evidence.

## 12. Governance

Governance is an evolution mechanism, not ownership.

A governance process may decide which compatible specification or implementation is adopted by a community, but governance does not prove a theorem and a vote does not create conformance evidence.

The intended governance principles include:

- no hidden privileged path;
- no unilateral economic control;
- proof is distinct from voting;
- voting is distinct from conformance;
- token ownership is not automatically identity;
- forks and dissent remain possible;
- constitutional and kernel changes require stronger evidence.

## 13. Evidence ladder

IMMORTAL distinguishes:

1. **DESIGN** — what the system says it intends to do.
2. **PROOF** — mathematical reasoning about the model.
3. **MODEL** — executable/reference-model checks.
4. **TEST** — implementation-level tests.
5. **AUDIT** — independent or structured review evidence.
6. **DEPLOYMENT** — evidence about a concrete environment.

No lower class should be silently presented as a higher class.

## 14. Current implementation architecture

### Universal layer

`docs/00-normative/` contains the canonical universal specifications.

### Adapter layer

`Adapter/CARDANO/` maps the universal model to Cardano.

### Application layer

`PRE-RICH/` contains the concrete PRE-RICH application and its own application-level constitution, specifications and economic policy.

This separation is deliberate.

## 15. PRE-RICH

PRE-RICH is the current application profile and first concrete laboratory for IMMORTAL.

Its application-specific semantics include, among other things, its ticket model, denomination, class ladder, Beacon model, Treasury, PrizePool, Jackpot and application settlement rules.

Those rules are documented under `PRE-RICH/docs/`.

They are not universal IMMORTAL requirements.

## 16. Cardano

Cardano is currently the first adapter.

Its job is to preserve IMMORTAL predicates while mapping them into Cardano's execution environment.

The Cardano adapter is not the source of universal economic truth.

## 17. What IMMORTAL does not claim

IMMORTAL does not claim:

- that every repository implementation is conforming;
- that mathematical existence of `K*` implies computability or deployability;
- that a finite model check proves arbitrary deployments safe;
- that the current implementation is mainnet-ready;
- that Cardano is a universal dependency;
- that PRE-RICH policy is universal protocol policy;
- that experimental code is production-certified.

The formal kernel specification explicitly records additional results that are **not** asserted, including universal non-emptiness of `K*`, finite convergence, computability/decidability of `K*`, existence of a concrete `K_c`, equality `K_c = K*`, and safety implying progress.

## 18. Conclusion

IMMORTAL is a framework for making economic safety claims explicit enough to be inspected, challenged and tested.

Its central architectural rule is simple:

> **The protocol defines the universal constraints; adapters realize them; applications specialize them; evidence determines what can actually be claimed.**

The project remains experimental. Its purpose is to make the boundary between mathematical specification and concrete economic execution as explicit as possible.
