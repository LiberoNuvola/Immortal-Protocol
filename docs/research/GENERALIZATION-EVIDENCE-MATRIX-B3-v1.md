# IMMORTAL — Generalization Evidence Matrix (B3) v1

**Branch:** `work/b3-materios-provenance-evidence`  
**Classification:** research / evidence triage; non-normative  
**Purpose:** distinguish generalized architecture, executable structural harnesses, function-specific implementation, runtime evidence, and open claims  
**Status:** GENERALIZED BOUNDARY PROTOTYPED; FUNCTIONAL / ECONOMIC GENERALIZATION NOT YET CLOSED

## 1. Executive finding

The branch does contain more than a paper-only idea: it has an explicit generalized derivation contract and executable JavaScript boundary harnesses. The harness `audit/algorithmic-governability/generalized-function-family-boundary.mjs` tests domain/rule/evidence/bounds identity, fail-closed treatment of missing or unverified inputs, family isolation, explicit `PARTIAL` search coverage, and separation of Explore → Certify → Adopt. The related `exp-cross-function-conformance-boundary.mjs` exercises the same broad structural pattern across identifiers EXP-01 through EXP-12.

However, the tested outputs are generic structural values and externally supplied Boolean claims. These harnesses do **not** calculate the real economic fee target, reward budget, contribution reward, review reward, governance eligibility, or adaptive parameter for actual authoritative inputs. They test whether a candidate stays inside a declared boundary, not whether a particular economic derivation formula is correct, complete, fair, manipulation-resistant, or viable.

Therefore the strongest supported conclusion is:

> IMMORTAL has a reusable, fail-closed **candidate-derivation boundary prototype** with executable structural tests and multiple candidate function families identified in research. The reviewed evidence does not yet establish a single generalized implementation that computes and certifies those function families end-to-end from authoritative inputs.

This report is documentation-only. No economic formulas, coefficients, thresholds, policy, V3, Reveal, or adapter semantics were changed. This review inspected source; it did not run tests. The historical Workflow B CI status recorded in Notion is reported separately below and is not presented as a fresh run from this review.

## 2. Source-of-truth alignment

The generalized contract `docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md` is explicitly **non-normative** and **OPEN RESEARCH / PROTOTYPE-READY**. It specifies the common boundary:

`B = (D, R, I, L, E, V, C, X)`

with domain, rule, inputs, limits, evidence, version, contestability and exit/fail-closed behavior. Its lifecycle is:

`Explore → CandidateSet → Certify → ADMISSIBLE | REJECTED | UNVERIFIABLE → Adopt`

Adoption is not an algorithmic side effect: it must enter an already authorized transition/governance path. The contract also states that reuse of machinery does not imply reuse of authority or semantics.

The Notion research master for fee/governance/build incentives triangulates the candidate families as `EconomicFeeTarget(S,A)`, `RewardBudget(S)`, `CodeContributionReward(C,E)`, `ReviewReward(C,E)`, vote/governance reward and eligibility functions, and profile-controlled adaptive parameters. It marks fee derivation, rewards, treasury-to-budget accounting, and anti-Sybil/anti-farming evidence as OPEN. These are research candidates, not frozen protocol policy.

The Economic Canon register preserves the distinction between universal economic primitives and profile/application-owned values. In particular, it records that the PRE-RICH 500× payout multiplier is application policy, not a universal IMMORTAL constant. This review introduces no new universal numeric parameter.

## 3. Generalization evidence matrix

| Function family / boundary | Research definition exists | Executable implementation inspected | What current tests establish | What remains open |
|---|---|---|---|---|
| Generic candidate derivation boundary | Yes: `GENERALIZED-DERIVATION-CONTRACT-v1.md` | `generalized-function-family-boundary.mjs` | Version/domain/evidence/bounds binding; missing evidence fails closed; declared-bound violation rejected; structural family isolation; no automatic adoption | Real derivation function, authoritative evidence verification, complete authorized search coverage, integration with production transition |
| EXP-01…EXP-12 structural family IDs | Generalized EXP family is referenced in repository harnesses | `exp-cross-function-conformance-boundary.mjs` | A generic boundary can be parameterized by family ID and rule/evidence/bounds/adoption-path identifiers | EXP identifiers are not, by themselves, twelve implemented economic functions; no function-specific semantic oracle is supplied by the generic harness |
| Protocol Usage Fee / `EconomicFeeTarget(S,A)` | Yes; Notion fee workflow defines ownership boundary and open parameterization | `fee-bearing-transition-separation-boundary.mjs` tests a fee-bearing transition boundary with opaque target/conversion values | Protocol fee and chain execution cost remain separate; invalid reference/conversion or unsafe transition cannot be committed by this harness | Real target formula/parameters; concrete oracle/reference selection; rounding/granularity; affordability evidence; end-to-end authoritative inputs and adapter settlement |
| Reward budget / Treasury boundary | Yes; research distinguishes received revenue, protected/reserved/available funds and reward budget | `reward-treasury-boundary.mjs` | Structural evidence/version checks; protected value exclusion and available-revenue envelope must be represented; reward output cannot rewrite fee/accounting/reward rule identity in the harness | Real authenticated Treasury accounting producer; canonical allocation formula; reward-budget certification; production integration |
| Code contribution reward | Yes; proposed chain is Contribution → CI evidence → review/acceptance → canonical record → reward eligibility | Generic boundary plus reward/Treasury boundary; no complete reward formula established by this review | Generic non-sovereignty and evidence-shape boundaries can be reused | Accepted contribution semantics, anti-Sybil/collusion/Gaming proof, actual reward derivation, budget binding and settlement evidence |
| Review reward | Yes; candidate family in research | No complete function-specific derivation established by inspected files | General boundary can represent a rule/evidence/bounds identity | Review-quality predicate, conflict/self-review/collusion handling, actual formula, authority and evidence |
| Vote/governance reward and eligibility | Yes; candidate family in research | Generic family harness uses a synthetic `governance` domain | Domain/rule identity isolation and fail-closed shape checks in the harness | Actual governance eligibility/quorum/authority integration; verified participation semantics; no reward-driven authority change |
| Adaptive profile parameter / upgrade candidate | Yes; candidate trajectory family in generalized contract | Generic Explore/Certify/Adopt structural harness | Candidate cannot be adopted merely because it was explored; PARTIAL coverage cannot be silently promoted to complete; adoption is boundary-checked | Concrete proposal schemas, rule-specific invariants, complete search evidence if claimed, authorized upgrade execution and replay |
| Cross-adapter universal result | Contract requires same semantic result for same certified inputs and rule version before encoding | Midnight execution/evidence boundary test is present for Issue-intent and receipt/post-state binding; it is research-only | Distinguishes admission, execution evidence, finality reference and public observation; checks post-state binding in its test | It is not proof that fee/reward derivations are implemented identically across adapters; no real second-chain economic differential execution established here |
| PRE-RICH V3 → universal kernel | Not the generalized derivation engine, but an adjacent bridge | Haskell projection and golden-vector tests | Selected V3/universal state and kernel equivalence vectors | Not evidence that the fee/reward/governance families above are implemented or cross-runtime conformant |

## 4. How to interpret the structural harnesses

### 4.1 What is genuinely implemented

The generalized-function-family harness creates separate `fee`, `reward`, and `governance` boundaries, each with its own domain, rule version, evidence-contract identity and bounds-contract identity. It checks that candidates retain these identities and rejects missing, malformed, unverified, mismatched or out-of-bounds inputs. It also explicitly represents search coverage as `PARTIAL` when no independent completeness witness exists, and keeps adoption separate from derivation.

The EXP harness extends the generic pattern to EXP-01…EXP-12 and has defensive tests for malformed records and accessor-backed properties. This is useful input-boundary hardening.

The fee and reward/Treasury harnesses also encode meaningful negative cases at the structural boundary. They test the separation of authority and evidence; they do not invent economic parameters.

### 4.2 What is not demonstrated by a passing structural test

If `withinDeclaredBounds` is an externally supplied Boolean, the harness tests the behavior conditional on that Boolean; it does not independently prove the bound. Likewise, `evidenceVerified: true` is not proof that an actual source was authenticated unless a trusted producer and verifier are bound to that field.

A generic `value: 7` or opaque fee target proves no real fee/reward formula. Family IDs prove namespace separation, not semantic diversity or correctness. Passing an EXP family test does not mean twelve separate functions have been derived, certified, and settled.

### 4.3 Historical CI evidence

The Notion Algorithmic Governability page records Workflow B #159 as **SUCCESS** for the generalized derivation boundary update, with checks for PARTIAL search coverage, Explore → Certify → Adopt separation, self-adoption rejection, family/domain isolation and rule-version isolation. This is historical evidence that the registered harness ran in that recorded workflow. It is not a fresh test run for this report, does not prove a production function formula, and does not close the open fee/reward/governance fronts.

## 5. Generalization maturity scale

Use these labels in the paper and status tables:

1. **Concept specified** — a research or normative contract describes the family.
2. **Structural harness implemented** — boundary ownership, evidence shape, version identity and fail-closed behavior are executable.
3. **Function-specific derivation implemented** — the actual rule computes an output from defined inputs.
4. **Authoritative input binding** — the input producer authenticates source, freshness, scope and provenance; the function does not self-certify these.
5. **Function-specific conformance** — positive, negative, boundary and adversarial vectors establish the declared rule's behavior.
6. **Cross-runtime differential conformance** — materially different implementations execute the same versioned vector corpus and agree on semantic results.
7. **Operational evidence** — reproducible execution and, where relevant, real adapter/ledger settlement evidence are recorded.

The generalized derivation boundary reaches at least level 2 in the inspected sources. Individual adjacent fronts may have their own additional evidence, but this review does not promote all candidate function families to levels 3–7.

## 6. Minimum closure sequence

This is a recommended evidence sequence, not a new normative rule or authorization to invent formulas.

- **G1 — Family registry:** for every family, record its domain, authorized rule/version, inputs, bounds, evidence contract, adoption path and current maturity level.
- **G2 — Separate authority from assertions:** replace externally asserted `evidenceVerified` / `withinDeclaredBounds` claims in any production path with verifiable evidence or a clearly authenticated producer contract. Do not silently change the research harness's scope.
- **G3 — One real family end-to-end:** select one already-authorized family, likely the existing Protocol Usage Fee front, and trace its existing spec → implementation → tests → evidence. Preserve all unresolved fee parameters as OPEN; do not invent a formula.
- **G4 — Function-specific vectors:** include exact expected outputs and fail-closed cases based on the authoritative specification, including missing/stale evidence, version mismatch, out-of-bound result, and adoption-path mismatch.
- **G5 — Cross-family isolation:** test that one family cannot import another family's authority, evidence contract, rule version, bounds or budget.
- **G6 — Differential execution:** only after a real deterministic function exists, execute the same versioned vectors in materially different implementations and compare semantic results before adapter encoding.
- **G7 — Evidence packet:** bind repository commit, rule version, vector digest, toolchain, exact command, exit status and CI run. Label harness-only, simulated, integration and live-ledger evidence distinctly.

## 7. Paper-safe claim

Recommended wording:

> “IMMORTAL proposes a generalized candidate-derivation boundary for fee, reward, governance and profile-policy functions. The repository contains executable structural harnesses for domain and rule-version isolation, evidence/bounds binding, fail-closed classification, partial-search transparency and separation of exploration, certification and adoption. These harnesses support the feasibility of a reusable non-sovereignty boundary. They do not, by themselves, establish the correctness or deployment readiness of each economic function; function-specific formulas, authoritative input binding, adversarial conformance and cross-runtime/adapter evidence remain separate obligations.”

Avoid claiming that the generalized derivation engine already implements every listed family or that a successful structural harness proves the correctness of the underlying economics.

## 8. Disposition

- **Generalized derivation contract:** present; explicitly non-normative and open research.
- **Structural boundary prototype:** present in executable harnesses.
- **Function-specific economic derivations:** mixed / not generally established by the inspected artifacts.
- **Historical Workflow B evidence:** #159 SUCCESS is recorded in Notion; no test run was performed for this review.
- **Multi-adapter generalization:** requirement specified; function-level production differential evidence not established here.
- **Code/economic semantics:** unchanged.
- **Next step:** use the existing Fee workflow as a single function-specific traceability case, without changing its open parameters or introducing new economics.
