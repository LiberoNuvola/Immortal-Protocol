# Workflow C — Chain-Independent Reference Profile Contract

**Status:** interface contract / design only. No economic semantics are added here.

## 1. Purpose

Define the minimum bindings required to instantiate the normative model
`M = (𝒮, Act, A, Accept, Ω, T, Safe)` and R1 certificate
`Cert = ⟨id, version, M, χ, Wit, Bnd, Proofs⟩` in a reproducible, independently checkable package.

This contract deliberately separates a field's existence from the evidence that its value is correct. Required fields with unresolved values remain blockers; they must not be populated with guessed constants or self-attested booleans.

## 2. Required profile bindings

| Binding | Required content | Authority / evidence source | Status |
|---|---|---|---|
| profile identity | stable ID, semantic version, source commit | repository/version control | format defined; concrete profile open |
| state space 𝒮 | canonical state schema, domain and equality | universal model + selected profile | open |
| action universe Act | versioned action schema | authorized transition/profile semantics | open |
| admissible actions A(S) | total, deterministic action-domain procedure | authorized transition/profile semantics | open |
| acceptance Accept(S,a) | authoritative input/admissibility predicate | Constitution + profile | open |
| environment perimeter E | event classes, boundary conditions and exclusions | R3 / Ω contract | open |
| Ω(S,a) | authoritative event envelope and soundness argument | R3, Ω contract | open |
| transition T(S,a,ω) | total successor function on accepted inputs | authorized transition/profile semantics | open |
| Safe(S) | executable safety predicate and proof/evidence | Constitution + profile | open |
| EEV(S) | verified executable value and source contract | accounting/EEV specifications | open |
| χ(S) | deterministic characteristic predicate for Kc | R1 VC1/VC2/VC6 | open |
| Wit(S) | deterministic witness selector | R1 VC3/VC4 | open |
| bounds Bnd | abstractions/bounds and soundness argument | R1 VC3/VC5 | open |
| proofs | VC1–VC6 artefacts and independent checker result | R1 / R8 | open |
| initial state S0 | canonical state and derivation trace | R8 NV1/NV2 | open |
| Ω declaration | all 13 elements, E, authority and residual risk | R3 / Ω contract | checklist prepared; instantiation open |
| refinement relation ρ | implementation-to-canonical-state mapping, if implementation claim is made | R2 RF1–RF11 | not needed for abstract-only claim; otherwise open |
| reproducibility packet | exact command, inputs, outputs, hashes and limitations | C10 | open |

## 3. No inferred defaults

A missing profile value is not defaulted to zero, empty, true, false, unlimited, or a convenient singleton. In particular:
- `zeroUniversalEconomicState` is an implementation helper, not proof that a deployment's initial state is zero or admissible;
- the existence of the universal fixed point K* does not establish K* non-empty;
- a finite-state search does not prove an infinite-state or infinite-horizon claim unless a sound abstraction/proof establishes that implication;
- a PRE-RICH lifecycle action is not automatically an IMMORTAL-universal action;
- a packet field such as `verified: true` is not independent verification.

## 4. Required certificate claims

The checker must recompute, not merely read asserted results, at least:
1. canonicalization and profile/version binding;
2. χ(S0) = 1 and S0's derivation trace;
3. VC2: χ(S)=1 implies Safe(S);
4. VC3: for every certified state, the selected Wit(S) belongs to A(S) and every Ω-successor remains in Kc;
5. VC4: acceptance compatibility under the declared input-availability conditions;
6. VC5: Ω is authoritative for E or a sound over-approximation;
7. VC6: existence and identity of S0 in Kc;
8. digest and cross-reference consistency for every input/proof artifact.

The exact proof method may be a mathematical proof, mechanized proof, or sound model-checking/abstraction argument allowed by R1. The checker must report the method and its limits. It must not imply that finite enumeration alone proves a general infinite domain.

## 5. Status vocabulary

`DESIGN`, `STRUCTURAL`, `SYNTHETIC`, `TRANSPORT-CAPTURED`, `CRYPTOGRAPHICALLY-VERIFIED`, `MODEL-CERTIFIED`, and `CHAIN-OBSERVED` are not interchangeable. The packet may carry multiple independent statuses, but every status needs its own evidence.
