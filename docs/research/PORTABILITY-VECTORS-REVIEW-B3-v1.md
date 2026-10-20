# IMMORTAL — Portability and Conformance Vectors Review (B3) v1

**Branch:** `work/b3-materios-provenance-evidence`  
**Review type:** documentation-only, read-only source inspection  
**Scope:** arithmetic representation, canonical economic state boundary, golden vectors, and evidence required for cross-runtime / multi-adapter claims  
**Status:** REVIEW RECORDED — CROSS-RUNTIME PORTABILITY NOT ESTABLISHED BY THE INSPECTED EVIDENCE

## 1. Executive conclusion

The branch contains meaningful conformance evidence for PRE-RICH V3 transitions and for projection of V3 state into IMMORTAL's universal economic state. The inspected `plutus/test/GoldenVectorsTest.hs` asserts expected states for Issue, Reveal and Expire; rejects several invalid transition inputs; checks conservation predicates; tests projection rejection for unknown/duplicate classes and inconsistent exposure; and compares V3 and universal kernel outputs at the economic boundary.

This is evidence of **within-repository semantic bridge conformance for the tested vectors**. It is not, by itself, evidence of cross-runtime equivalence, canonical serialization equivalence, or a deployed second adapter.

The inspected TypeScript boundary `Adapter/CARDANO/serialization/CanonicalEconomicState.ts` uses `bigint` for economic integer quantities and checks non-negativity. The inspected Haskell universal state uses `Integer`. These representations are compatible in intent for integer-valued quantities, but the type declarations alone do not prove equivalence at conversion, encoding, decoding, hashing, or ledger boundaries.

No source code or economic semantics were changed during this review. The tests were inspected, not executed as part of this review; no new green CI result is claimed.

## 2. Evidence inspected

| Artifact | What the source supports | What it does not establish |
|---|---|---|
| `plutus/test/GoldenVectorsTest.hs` | Expected-state vectors for Issue/Reveal/Expire; invalid action cases; conservation checks; PRE-RICH-to-universal projection vectors; V3/universal protected-capital, raw-surplus and solvency comparisons | Execution in this review; independent implementation; another runtime or chain producing the same outputs |
| `IMMORTAL/state/UniversalEconomicState.hs` | Universal aggregate represented with Haskell `Integer`; application-specific ticket/JACKPOT structures intentionally excluded | Type-level proof of adapter serialization or canonical wire compatibility |
| `IMMORTAL/kernel/UniversalEconomicKernel.hs` | Universal ProtectedCapital, RawSurplus, non-negative-state and solvency predicates over the aggregate | Equivalence of every external producer or adapter to these functions |
| `Adapter/CARDANO/serialization/CanonicalEconomicState.ts` | Chain-neutral aggregate shape; economic quantities use TypeScript `bigint`; validation rejects negative values | Canonical byte encoding, round-trip guarantees, hash/domain separation, or Haskell/TypeScript differential execution |
| `docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md` | Normative EEV contract requires deterministic, versioned, reproducible derivation and fail-closed handling; adapter must supply evidence | Correctness of a concrete valuation source, which the document explicitly places outside the universal mathematical layer |
| `docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md` | Defines environment perimeter and requires adapter evidence that Ω soundly over-approximates economically material events | Completeness of any concrete deployment perimeter without deployment-specific evidence |
| `docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` | Concrete certification requires a profile instantiation, executable characteristic predicate, witness selector, verification conditions and non-vacuity evidence | A concrete certified PRE-RICH kernel merely from the universal theorem or aggregate projection |
| `docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md` | Requires adapters to preserve the same semantic result for the same certified inputs and authorized rule version before chain-specific encoding; status is OPEN RESEARCH / PROTOTYPE-READY | Completed multi-adapter implementation or independent cross-chain proof |

## 3. Portability matrix

| Property | Specification / design | Inspected implementation | Vector evidence inspected | Independent cross-runtime evidence |
|---|---|---|---|---|
| Integer economic quantities | Implied by economic state model | Haskell `Integer`; TypeScript `bigint` | Not shown for TypeScript-vs-Haskell | **Open** |
| Non-negative aggregate state | Universal kernel contract | Haskell predicate and TypeScript validator | Haskell tests include invalid economic inputs in selected cases | **Open** |
| Issue/Reveal/Expire expected transitions | PRE-RICH transition model | Haskell V3 implementation | Explicit golden assertions | **Not established** |
| V3 → universal state projection | Universal aggregate boundary | Haskell projection | Base, Issue, Reveal, Expire and invalid-projection vectors | **Not established outside the Haskell path** |
| ProtectedCapital / RawSurplus / solvency bridge | Universal kernel definitions | V3 and universal Haskell functions; TS state-shape validator only | Haskell equivalence assertions for selected states | **Open** |
| Canonical serialization / round trip | Generalized adapter contract requires separation of semantic result from adapter encoding | The inspected TS file defines a type and validator, not an encoding algorithm | No cross-runtime serialization vectors were established from the inspected files | **Open** |
| Deterministic, version-bound derivation | EEV and generalized derivation contracts specify the requirement | No complete multi-adapter derivation implementation established by this review | No paired adapter output corpus established | **Open** |
| Time, expiry boundaries and finality | Ω contract explicitly includes timing, delay, reordering, expiry-boundary timing and freshness lapse | PRE-RICH has expiry transition checks; broader adapter-time semantics not established here | A small expiry vector exists; no comprehensive cross-runtime timing corpus established | **Open** |
| Overflow / rounding / unit conversion | Must be explicit wherever numeric domains differ | The inspected TS boundary uses arbitrary-precision `bigint`; inspected Haskell uses `Integer` | No dedicated paired overflow/rounding/conversion vector corpus established by this inspection | **Open** |
| Second independently implemented adapter | Generalized contract requires semantic preservation | Not established by the inspected B3 artifacts | No real differential evidence established by this review | **Open** |

“Open” means the reviewed evidence does not establish the claim; it does not assert that no relevant artifact exists anywhere in the repository.

## 4. Important distinctions

### 4.1 Golden vectors are valuable but scoped

The Haskell golden test is not merely a smoke test: it includes positive and negative transition cases, conservation checks, projection guards, and equality checks between V3 and universal economic functions. The strongest accurate claim is:

> The branch contains executable golden assertions for selected PRE-RICH transitions and selected equivalence properties at the V3-to-universal economic boundary.

It would overstate the evidence to say that these vectors establish equivalence across programming languages, ledger implementations, or blockchain adapters.

### 4.2 Types are not a serialization specification

Haskell `Integer` and TypeScript `bigint` avoid ordinary fixed-width integer overflow at the language-level arithmetic representation, but boundary conversions and encoded formats still need explicit rules. The inspected TypeScript file validates a state object; it does not define a canonical byte encoding or prove encode/decode round trips. This review therefore records serialization portability as **not demonstrated**, not as a proven defect.

### 4.3 Adapter conformance must compare semantic results before encoding

The generalized derivation contract states that adapter-specific encoding and settlement follow the universal derivation. Differential evidence should therefore compare the semantic result first, then separately compare encoding/settlement according to each chain's contract. A harness that compares synthetic already-certified results is useful boundary testing, but it is not proof that production adapters derive those results from real authoritative inputs.

### 4.4 The Ω and EEV perimeter remains part of the guarantee

Portability of a numeric result does not establish completeness of its environmental assumptions. The Ω contract makes safety conditional on a declared environment perimeter and requires the concrete adapter to demonstrate over-approximation. Likewise, the EEV contract says universal theorems are relative to the value supplied by the oracle, not proof that the oracle value is correct.

## 5. Recommended closure packet for a publishable portability claim

This is a proposed evidence plan, not a new normative protocol rule.

1. **Freeze a versioned vector schema.** Each vector should include profile/rule version, canonical input state, action, authoritative environment/event case where relevant, expected semantic result, expected acceptance/rejection classification, and an explicit reason for rejection where applicable.
2. **Cover numeric boundaries.** Include zero, minimum/maximum declared values, large integers, negative values where the boundary must reject them, conversion to/from ledger units, and every rounding rule that actually exists. Do not invent a rounding policy where none is specified; mark the policy as an unresolved contract if needed.
3. **Cover temporal and adversarial boundaries.** Include expiry-boundary cases, delayed/stale evidence, reordered observations, repeated and correlated events, and Ω fail-closed cases according to the declared profile perimeter.
4. **Run the same semantic corpus in materially different implementations.** At minimum, compare the Haskell universal kernel path with the TypeScript adapter-boundary path. Keep the test inputs and expected outputs shared rather than re-creating separate hand-written examples.
5. **Separate semantic equivalence from encoding equivalence.** First compare typed semantic outputs; then test canonical encoding, decoding round trips, domain separation, version identity and stable digests where those mechanisms are specified.
6. **Add an independent adapter only when available.** Run the same profile-level semantic vectors through it. A mock or synthetic harness should be labelled as such; do not present it as live ledger or production adapter evidence.
7. **Bind results to reproducible evidence.** Record source commit, vector-corpus digest, toolchain/runtime versions, command, exit status, and CI run URL. Preserve failures and rejected cases, not just passing outputs.

## 6. Paper-safe wording

Recommended:

> “IMMORTAL includes a universal economic-state boundary and executable PRE-RICH golden vectors that check selected transition outcomes and selected equivalence properties between the PRE-RICH V3 kernel and the universal economic kernel. The repository also specifies a multi-adapter semantic-preservation requirement. Cross-runtime differential execution, canonical serialization equivalence, and production multi-chain conformance remain separate evidence obligations and are not inferred from the Haskell golden vectors alone.”

Avoid claiming “chain-agnostic implementation proven,” “cross-chain equivalence proven,” or “all adapters conform” until the corresponding differential evidence exists and is reproducible.

## 7. Disposition

- **Review result:** useful within-repository golden-vector and projection-equivalence evidence exists.
- **Portability result:** design boundary is stated; cross-runtime and multi-adapter equivalence are not established by the artifacts inspected.
- **Tests:** not run in this review; no new CI status claimed.
- **Code changes:** none.
- **Protected scope:** V3, Reveal semantics, economic rules, and adapter behavior left unchanged.
- **Next closure step:** build the shared, versioned differential vector corpus and run it against materially different implementations; do not describe this as a protocol semantic change.
