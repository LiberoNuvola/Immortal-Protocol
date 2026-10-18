# C6 — Reference Profile and Action-Space Adequacy

**Status: NOT CERTIFIED.** This is the current reconciliation finding, not a normative amendment.

## Question C6 must answer

Can a single chain-independent IMMORTAL reference profile define an admissible state space, a complete authorized action space and a transition relation that permits an independently checked, non-empty viability certificate—without narrowing the actual authorized behavior or inventing new economic rules?

The profile must separate:
1. the universal economic model;
2. the authorized action/transition semantics;
3. adapter-specific encoding and settlement;
4. observation/provenance and proof verification;
5. the certificate claim and its assumptions.

An adapter's successful settlement or an evidence packet's structural validity cannot substitute for the model-level proof.

## Cross-branch reconciliation (review snapshot 2026-10-18)

- **work/immortal-green-closure:** has the C6-related certification/audit material and PRE-RICH lifecycle helper, but the examined V3 action graph is restricted to Issue/Reveal/Claim/Expire. The V3 viability audit explicitly does not establish a universal IMMORTAL theorem.
- **b1-hardening:** contains the universal state/accounting kernel, but the examined kernel does not define a complete universal action/transition relation or discharge a concrete Kc witness.
- **release/issue-admission-boundary-squash** and **merge/workflow-b-closed-main:** improve the PRE-RICH issue-admission boundary; they do not supply a universal Kc witness.
- **main / release/public-main-curated-2026-09-24:** do not provide an alternate complete universal action algebra that closes C6.
- **work/b3-materios-provenance-evidence:** is the primary source for provenance, evidence integrity, proof boundaries and independent verification patterns. It is not itself the economic viability semantics and does not close Kc non-vacuity.

This is a targeted source review, not a claim that every file on every branch has been exhaustively formally verified.

## Findings that must remain distinct

### Universal kernel and state

`IMMORTAL/kernel/UniversalEconomicKernel.hs` supplies accounting/safety-oriented functions such as protected capital, raw surplus, non-negative state and a solvency invariant. `IMMORTAL/state/UniversalEconomicState.hs` supplies a chain-neutral state aggregate. Those artifacts are useful foundations but do not, by themselves, define an action relation.

### PRE-RICH lifecycle helper

`PRE-RICH/onchain/PreRichLifecycleTransition.hs` includes `EnterQuiescent` and `MaintainQuiescent` in a PRE-RICH lifecycle regime. It is not automatically a universal IMMORTAL action. Its QNE checks depend on supplied Ω witnesses; the caller must establish that those witnesses soundly over-approximate the authoritative Ω. Do not promote it to universal semantics without an authorized derivation.

### Restricted V3 graph

The 2026-10-05 V3 viability audit considered the restricted V3 action set Issue/Reveal/Claim/Expire. Under its stated finite-capacity assumptions, that restricted graph may be well-founded and have empty K*. This is not a theorem that universal IMMORTAL K* is empty, nor a basis for inventing an action to make it non-empty.

### B3 provenance work

The B3 workstream describes derivation contracts, evidence provenance, proof packet boundaries and fail-closed behavior when a cryptographic verifier is absent. This informs C4/C7/C9/C10 and the evidence trust boundary for C6. Structural checks or captured RPC responses do not establish verified proof.

## C6 sub-gates

- **C6-A — profile architecture:** document canonical state, authorized action interface, transition relation interface, assumptions, costs and adapter separation. Every field must point to an existing source or be explicitly marked unresolved.
- **C6-B — substantive semantics:** identify an already-authorized transition relation that admits a concrete inductive/non-vacuous witness. If the current normative corpus does not define such a relation, stop for an architecture decision. Do not synthesize an action, threshold, coefficient, or rule.
- **C6-C — evidence binding:** bind the profile and certificate to immutable source/version identifiers, canonical inputs, evidence digests and a checker result. The checker must derive the result rather than trust asserted booleans.


## QNE candidate screen against the existing normative delta algebra

R1's T-MARGIN is a **conditional certificate construction**, not a universal witness: its profile must prove both safety sufficiency (S1) and QNE for an action available at every certified state and every ω in the authoritative envelope. R8's singleton recipe is stricter: the state must remain exactly unchanged for every permitted environment event. Workflow C does not promote either recipe to an existing universal IMMORTAL action.

The R7 accounting deltas are useful constraints, but the delta list alone does not establish QNE:

| Existing delta | Why it cannot currently discharge universal QNE |
|---|---|
| `settle: L1/L2 → L4` | Requires a valid, available right and atomic settlement; not available at every canonical state. A proof must also cover every Ω successor and all coupled EEV/liability changes. |
| `expire: L1/L2/L3 → L5` | Requires the relevant expiry condition; cannot be assumed available in every state. Expiry semantics cannot be repurposed as a general-purpose safety action. |
| `resolve: L3 → L1/L5` | Worst-case resolution may crystallize an obligation; R7 does not prove the protection buffer is non-decreasing for all Ω outcomes. |
| `verify: A3 → A1/A2` | Depends on authoritative evidence arriving and being accepted; Ω includes external-truth failure/staleness and this is not an always-available action. |
| `stale: A1/A2 → A3` | Can reduce EEV and therefore erode the buffer; it is an environmental/state effect, not a QNE witness. |
| `realise: A4 → A1/A2/∅` | May yield no executable value and is coupled to liability resolution; no general non-erosion theorem is supplied. |
| `represent: ∅ → L1/L2/L3` | Creates a represented commitment and can increase ProtectedCapital; not generally non-eroding. |

This screen is not a proof that no profile-specific QNE exists. It establishes only that **the current universal accounting-delta list does not itself discharge QNE**. A profile may prove a substantive, already-authorized action is non-eroding on a declared subset, or identify an existing authorized regime where obligations and valuations are stable; it must show availability, acceptance, Safe preservation, and closure under every Ω successor.

A generic `NoOp`, rejection, or label such as `SAFE STALL` is not introduced as an economic action. A quiescent-state construction is admissible only if its semantics are already authorized and its environment-stability claim is proved, not assumed.

## C6-B exit question

For the proposed profile, produce a source-backed answer to all of these:
1. What existing normative action is the witness selector allowed to choose?
2. Is it in A(S) and accepted whenever the certificate requires it?
3. Does it preserve `Rep` and `b = EEV − ProtectedCapital` for every ω in the authoritative Ω?
4. Is Ω complete for the published perimeter E, or soundly over-approximated?
5. Is there a concrete canonical S0 with χ(S0)=1 and a reproducible derivation?
6. Is the result a substantive economic continuation, or only a safety/non-vacuity witness with no progress claim?

Until these are answered from authorized semantics and evidence, C6-B/C8 remain BLOCKED. This is an open proof obligation, not a reason to alter the normative corpus.

## C6 exit evidence

C6 can be marked CLOSED only when:
- profile and action domain are complete for the declared perimeter;
- the transition relation is grounded in authorized normative semantics;
- action-space adequacy and non-vacuity are independently justified;
- S0 is admissible, χ(S0)=1, VC2/VC3 are discharged, and S0 ∈ Kc ⊆ K* under T-NV-CHAIN;
- Ω and E are complete and authority-fixed;
- the independent checker and reproducible evidence packet pass.

Until then, status remains NOT CERTIFIED.

## Additional source-grounded check — PRE-RICH lifecycle QNE helper (2026-10-18)

The lifecycle helper on `work/immortal-green-closure` was inspected directly. It is a real **PRE-RICH lifecycle transition**, not a disguised economic no-op: `EnterQuiescent` changes `Active → Quiescent`, and `MaintainQuiescent` increments `transitionNonce` while remaining `Quiescent`. The module comments explicitly separate this lifecycle state from the V3 economic state and say that neither operation changes an economic V3 field.

That makes the helper a legitimate candidate to investigate at the **application/regime layer**, but it does not close C6-B:

1. **Action availability is regime-limited.** `EnterQuiescent` is available only from `Active`; `MaintainQuiescent` only from `Quiescent`. The code does not establish an action available at every state in a proposed universal `K_c`.
2. **Economic stability is not implied by unchanged V3 fields.** EEV and ProtectedCapital are external verified inputs. Their values can change across environmental successors even if this lifecycle operation leaves V3 fields untouched.
3. **The QNE function checks supplied witnesses, not the authoritative envelope itself.** `qneAcrossOmega` rejects an empty witness list and checks each supplied witness for non-negative EEV/protected capital, non-decreasing buffer, representation preservation and safety. Its own comment assigns the caller responsibility for proving the list soundly over-approximates authoritative Ω. No such proof is supplied by this helper.
4. **Acceptance compatibility remains separate.** `lifecycleActionAvailable` checks whether the lifecycle transition is defined; it does not, by itself, discharge the universal model's `Accept(S,a)` / VC4 obligation or bind the transition to a complete chain-independent `T`.

**Result:** do not discard this helper, but do not promote it into the universal IMMORTAL action algebra. The strongest supported conclusion is: *a concrete PRE-RICH lifecycle candidate and a QNE-checking predicate exist; the universal QNE proof is still open*. The missing evidence is an authoritative Ω binding/over-approximation proof, an explicit refinement into the canonical economic transition relation, acceptance compatibility, and proof of `Rep`/buffer preservation over every successor in the declared perimeter.

This finding is source review only; it does not claim that the helper's tests or a formal proof have passed, and it does not change any normative semantics.

## Follow-up implementation trace — helper tests, universal kernel and admission boundary (2026-10-18)

A second source pass followed the lifecycle helper into its adjacent tests and the existing economic-admission boundary on `work/immortal-green-closure`.

### What the existing test establishes

`plutus/test/PreRichLifecycleTransitionTest.hs` contains positive and negative checks for the two lifecycle transitions and synthetic QNE examples. It checks that:
- an explicitly supplied non-eroding successor passes;
- a supplied adverse-EEV successor fails;
- loss of represented obligations fails;
- a mixed envelope fails if any supplied successor erodes;
- an empty witness list fails closed.

These are useful unit-level checks of the helper's local predicate. The test fixtures explicitly construct the `LifecycleOmegaWitness` values; they do **not** derive those values from a canonical economic transition or from an authoritative Cardano/adapter event envelope. The inspected `.github/workflows/formal-mechanical-evidence.yml` does not list this Haskell test among its steps. Therefore this review does not claim the test was executed by CI or that a universal QNE proof exists.

### What the economic kernel and admission boundary establish

`IMMORTAL/kernel/UniversalEconomicKernel.hs` calculates `ProtectedCapital` from crystallized liabilities, worst-case exposure, safety capital, reserve protection, mandatory future costs and additional protected capital. Its solvency invariant checks non-negative EEV, non-negative state fields and `EEV ≥ ProtectedCapital`.

`PRE-RICH/onchain/PreRichEconomicAdmission.hs` separately checks a structural V3 transition, projects the candidate into the universal state, evaluates the economic gate using supplied truth/freshness/obligation inputs, and consumes the caller-provided `allOmegaSuccessorsInCertifiedKernel` Boolean. This is an admission boundary for a candidate action, not a definition or proof of the complete universal transition relation: the function receives the Ω-closure result as an input rather than deriving it itself.

The TypeScript `EconomicAdmissionTransitionBinding.ts` checks that the admission witness and persisted canonical evidence agree on action class and pre-/post-state fingerprints. That is evidence binding, not a proof that the observed post-state is the result of the normative transition for every `ω ∈ Ω`.

### Updated conclusion

The repository contains three distinct useful pieces, but they must not be conflated:

1. **Lifecycle transition helper:** a regime-specific state transition plus a local QNE predicate.
2. **Economic admission gate:** checks a candidate action against supplied evidence and a supplied Ω-closure result.
3. **Canonical transition evidence binding:** correlates a decision with persisted action/state fingerprints.

No inspected artifact composes these into a source-backed universal relation proving, for every certified state, that the selected action is available and accepted and that every authoritative Ω-successor preserves `Rep`, safety and the buffer. The remaining gap is therefore an **explicit refinement/composition proof and authoritative Ω binding**, not a missing Boolean check.

No source semantics were changed. The candidate remains worth retaining for PRE-RICH regime-level work, but C6-B remains BLOCKED until the missing composition and envelope obligations are discharged.


## Follow-up trace — canonical V3 action relation versus lifecycle helper (2026-10-18)

The source trace was extended to the exact module locations for the economic action relation, gate, profile, projection and refinement contract on `work/immortal-green-closure`.

- `IMMORTAL/kernel/EconomicTransitionV3.hs` defines the concrete PRE-RICH economic action constructors `Issue`, `Reveal`, `Claim`, and `Expire`, together with `transition` and `transitionValid`. The transition function calculates a candidate V3 economic state; `transitionValid` checks profile validity, pre/post conservation, control-state validity, non-negativity and monotonic control history.
- `IMMORTAL/state/EconomicProfile.hs` is a declarative profile of version, class prices and maximum normal payout multiplier. Its validation checks positive version, valid positive prices, non-negative multiplier and unique classes. It does not declare a universal IMMORTAL action algebra or an Ω domain.
- `PRE-RICH/onchain/PreRichEconomicProjection.hs` maps a valid V3 state to `UniversalEconomicState` and provides `projectionBoundaryEquivalent` for selected accounting functions. Its own contract explicitly does not establish gate soundness, viability, atomicity or full Cardano/V3 equivalence.
- `IMMORTAL/kernel/EconomicGate.hs` separates immediate economic admissibility from viability. `viabilityGate` is exactly a conjunction of the supplied `safePostState` and `allOmegaSuccessorsInCertifiedKernel` values; it does not derive either a universal transition relation or an Ω-closure proof.
- `IMMORTAL/conformance/RefinementV3.hs` maps `ConcreteV3State` to `V3EconomicState` and checks selected invariants. It is a concrete-state refinement helper, not a proof that lifecycle actions refine into the economic V3 relation or that all adapter/environment successors are covered.

**Composition finding:** the lifecycle action type is not a constructor of `V3Action`, and `PreRichLifecycleTransition.hs` deliberately defines a separate lifecycle state. The reviewed modules do not provide a composition function or refinement theorem connecting `EnterQuiescent`/`MaintainQuiescent` to `EconomicTransitionV3.transition`, nor a theorem binding the lifecycle QNE witnesses to the authoritative Ω envelope. This is the exact missing edge; it should not be filled by silently adding lifecycle actions to V3 or changing V3/Reveal semantics.

**Test/workflow finding:** `plutus/test/PreRichLifecycleTransitionTest.hs` is not named in the inspected `.github/workflows/formal-mechanical-evidence.yml` steps. The inspected `.github/workflows/pre-rich-action-refinement-conformance.yml` runs a TypeScript/Vitest conformance set and TypeScript typecheck, not that Haskell lifecycle test. Thus the repository review found test source, but no evidence from these workflows that the Haskell test is executed. No test pass or CI certification is claimed.

**Next proof obligation:** locate an already-authorized normative source for the lifecycle action and its acceptance rule; define the explicit refinement/composition boundary without changing economic V3 semantics; then bind each QNE witness to a complete, authority-fixed Ω envelope for the declared perimeter and independently check `Rep`, safety and buffer preservation over every successor. If the normative corpus does not authorize that composition, stop for an architecture decision. C6 remains **NOT CERTIFIED**.


## Normative-source trace — is the lifecycle QNE action already authorized? (2026-10-18)

The normative-source pass covered the Constitution, Universal Economic Model, Economic Kernel, State & Transition Specification, Ω Completeness Contract, Liveness & Progress Specification, and Non-Vacuity/Initial-State Certification.

### What is authorized at the abstract level

The normative corpus defines the abstract action/acceptance/transition contract:
- `A(S)` is the set of candidate admissible actions, `Accept(S,a)` requires an action in that set plus complete, verified and fresh authoritative inputs, and `T(S,a,ω)` is total on accepted inputs.
- `K_c` must satisfy CK1–CK8; CK3 requires every authoritative Ω-successor of a witnessing action to remain in `K_c`, and CK3′ adds acceptance compatibility for non-blocking certification.
- Ω completeness is relative to a published environment perimeter `E`; completeness of a concrete adapter/profile requires evidence and cannot be inferred from a unit-test witness list.
- R8/T-NV-SUFF gives a **conditional construction** for a true quiescent singleton: a safe state and an available action whose transition returns exactly that state for every `ω ∈ Ω(S,a)`. QNE separately requires an available action whose protection buffer does not erode for every authoritative successor.

### What the normative corpus does not authorize by name

In the inspected normative files, `EnterQuiescent`, `MaintainQuiescent`, and the PRE-RICH `Quiescent` regime are not defined as canonical IMMORTAL actions or given an explicit `Accept(S,a)` rule. The normative contracts define what any proposed action must satisfy; they do not, by themselves, authorize this application-specific lifecycle helper as the universal witness.

The generic rejection/safe-stall policy is not a substitute for that witness: the normative sources explicitly distinguish safety from viability and progress. Nor does incrementing a lifecycle nonce establish R8's exact state equality, because the lifecycle state changes and environmental changes to EEV/ProtectedCapital remain possible.

### Decision

**No source-backed authorization edge was found for promoting the PRE-RICH lifecycle helper to the universal IMMORTAL action algebra.** This is a bounded review of the named normative source files, not a claim that every repository file has been exhaustively reviewed.

Therefore the next step is not to alter code or manufacture an action. It is to identify an existing authoritative application/profile contract that authorizes this lifecycle transition and defines its acceptance and refinement semantics. If no such source exists, record an architecture decision before composition. In either case, a separate proof must bind the deployment's full authoritative Ω envelope to the declared perimeter and establish CK3/CK3′, non-vacuity at concrete `S0`, and the required `Rep`/buffer preservation. C6 remains **NOT CERTIFIED**.


## Correction and extended application-contract trace — lifecycle authorization versus operational composition (2026-10-18)

A further scan found an application-level source that must be distinguished from the universal normative corpus: `PRE-RICH/docs/GENESIS-REGIME-CARRIER-DESIGN-v0.1.md` records the semantic regime chain `PRE_GENESIS → GENESIS → ACTIVE → QUIESCENT`. This supports the existence of QUIESCENT as an intended PRE-RICH regime; it does **not** by itself define the full canonical action/acceptance/Ω semantics for `EnterQuiescent` or `MaintainQuiescent`.

The concrete application implementation is split:
- `PreRichRegimeState.hs` and `GenesisRegimeCarrier.hs` implement the PRE-GENESIS → GENESIS boundary, with the on-chain action constructor `ActivateGenesis`.
- `PreRichLifecycleTransition.hs` separately implements ACTIVE → QUIESCENT and QUIESCENT → QUIESCENT-with-incremented-nonce on a different `PreRichLifecycleState` type.
- The reviewed source set contains no composition/refinement function connecting the lifecycle helper's state/action to the canonical regime carrier and the economic `T(S,a,ω)` relation. The documented regime chain therefore supplies application-level intent, but the action-specific acceptance/refinement edge remains unproved in the inspected code.

### Test-wiring correction

The earlier note that `PreRichLifecycleTransitionTest.hs` was not listed in `formal-mechanical-evidence.yml` remains true for that particular workflow, but it was too broad if read as saying the test is not wired into any workflow. The separate `.github/workflows/genesis-regime-carrier.yml` explicitly runs:

```sh
cabal test pre-rich-lifecycle-transition-tests
```

and `plutus/pre-rich-plutus.cabal` defines that suite with `PreRichLifecycleTransitionTest.hs` as its main module. The workflow's existence establishes **test wiring**, not a passing run. No successful Actions run or log was verified in this pass, so execution status remains unconfirmed and no test pass is claimed.

### Updated bounded conclusion

There is now evidence of (1) intended PRE-RICH regime-chain semantics, (2) a concrete local lifecycle transition helper, and (3) a workflow configured to run its Haskell test suite. Still missing from the evidence reviewed here are: a verified successful test run; an explicit composition/refinement from the helper into the canonical application/economic transition boundary; action-specific acceptance compatibility; and a sound authoritative-Ω coverage argument proving QNE over the declared perimeter. Do not interpret the generic regime-chain diagram as proof of these operational obligations.

This correction supersedes any implication that the lifecycle Haskell test is absent from all workflows. C6 remains **NOT CERTIFIED**; no code or normative semantics were changed.


## Additional authority found in Notion T2/P0 — application-level ENTER_QUIESCENCE (2026-10-18)

A targeted Notion search/fetch found an existing application-level contract that was not in the GitHub normative-file set reviewed above: **T2 — Transition Conformance Specification v0.1** (under PRE-RICH Control Center / Definitive Decision Register). Its P0 binding explicitly lists `CONTRACT_CLASS / ENTER_QUIESCENCE` and states that contraction/quiescence may be invoked permissionlessly, with class safety derived from canonical state, `HighestClassEverActivated` monotone, and stale higher-class state forbidden from authorizing an unsafe SALE. T2's common P0 contract requires a deterministic predicate, observable trigger/discovery, permissionless invocation, independent on-chain revalidation, atomic delta, idempotence/concurrency handling, stale/conflict rejection, safe-stall behavior and recovery.

This materially narrows the prior finding:

- **`EnterQuiescent` has an application-level normative candidate source** in T2/P0; it should not be described as wholly unauthorized at the PRE-RICH application layer.
- **`MaintainQuiescent` is not separately named in the T2/P0 action binding found.** Its nonce-incrementing transition remains implementation-level behavior unless another approved source authorizes it.
- The existence of the T2/P0 contract does **not** make the lifecycle action a chain-independent IMMORTAL action, and does not itself prove that the current helper conforms to every P0 requirement.
- It also does not close the QNE certificate: the helper still takes supplied Ω witnesses, while the application contract requires an authoritative transition/evidence path; the reviewed sources do not establish the complete Ω envelope or prove buffer/Rep preservation for every successor. The action's availability/acceptance over every state in a proposed (K_c) remains unproven.

The source is a Notion page marked `unverified` by the Notion integration and last edited 2026-09-14; it is treated here as an existing project specification, not as proof of implementation conformance. The repository's `PRE-RICH/docs/PRE-GENESIS-GENESIS-TRANSITION-CONFORMANCE.md` separately warns not to import PRE-RICH Genesis semantics into universal IMMORTAL economics. No universal semantics are inferred from T2.

**Revised next step:** compare the T2/P0 `ENTER_QUIESCENCE` contract clause-by-clause with `PreRichLifecycleTransition.hs` and its test suite; identify the already-defined canonical pre/post-state and the actual observation/transition binding; then determine whether an existing approved action is available throughout a concrete candidate (K_c). Do not treat `MaintainQuiescent` as authorized merely because its helper and tests exist. C6-B remains **BLOCKED / NOT CERTIFIED**.


## Clause-by-clause conformance trace — T2/P0 ENTER_QUIESCENCE (2026-10-18)

**Scope and evidence level.** This is a source-level comparison between the Notion page *T2 — Transition Conformance Specification v0.1 — 12 settembre 2026* (P0 binding; integration reports page status `unverified`, last edited 2026-09-14), the lifecycle helper and unit tests on `work/immortal-green-closure`, the canonical PRE-RICH regime carrier, economic admission boundary, Cabal suite declaration and CI workflow. It is not a claim of deployed on-chain conformance. T2/P0 is treated as an application-level specification candidate; its verification status is a material limitation.

### P0 matrix

| T2/P0 requirement | Evidence in reviewed sources | Assessment |
|---|---|---|
| Deterministic transition predicate | `lifecycleTransition` defines `Active + EnterQuiescent → Quiescent` and increments `transitionNonce`; `lifecycleActionAvailable` checks whether this pure transition returns a state. | **Partial** — deterministic helper exists, but it is not the action predicate of a canonical on-chain quiescence validator. |
| Observable trigger / state discovery | T2/P0 requires an observable event or state-discovery method. The helper accepts a supplied lifecycle state/action and has no observation/event input. | **Not evidenced in helper** — no trigger/discovery binding was found in the reviewed lifecycle path. |
| Wake-up and re-discovery | Required by common P0. No scheduler, event consumer, or recovery/re-discovery binding was found in the reviewed helper or regime carrier. | **Not evidenced** — operational trigger remains unresolved here. |
| Permissionless invocation | T2/P0 explicitly says `CONTRACT_CLASS / ENTER_QUIESCENCE` may be invoked permissionlessly. The pure helper itself has no caller identity or authorization check. | **Specified, not demonstrated end-to-end** — no corresponding on-chain `EnterQuiescent` entrypoint was found in the reviewed carrier. |
| Independent on-chain revalidation against canonical state | `GenesisRegimeCarrier.mkValidator` revalidates PRE-GENESIS → GENESIS using the carrier datum, authenticated Treasury/Oracle references and `genesisPredicate`; its only action constructor is `ActivateGenesis`. It does not implement `EnterQuiescent`. The lifecycle helper checks only its separate `PreRichLifecycleState`. | **Missing for quiescence** — Genesis validation cannot be credited as quiescence validation. |
| Atomic state delta | The helper returns a new pure Haskell value with incremented nonce. The reviewed on-chain carrier does not consume/update a canonical quiescence state. | **Unit transition only** — atomic ledger transition for quiescence not evidenced. |
| Idempotence and concurrency | The test checks that `EnterQuiescent` is unavailable from `Quiescent`. `MaintainQuiescent` can be repeated and increments the nonce each time. T2/P0 separately requires at most one consumer of the same canonical state. | **Partial / unresolved** — local replay guard for Enter exists; no ledger-level race/consumption test for quiescence, and repeated maintenance is not idempotent as a state transition. |
| Stale/conflicting-state rejection | Pure helper rejects action/regime combinations not listed in its pattern match. No canonical carrier datum/version or stale-state revalidation is bound to the quiescence helper. | **Partial** — local invalid-regime rejection only; canonical stale/conflict rejection not demonstrated. |
| SAFE STALL and missing evidence | T2/P0 defines operational stall/re-discovery behavior. The QNE helper fails closed on an empty witness list or an adverse supplied witness, but it is not a submitter/wakeup/recovery mechanism. | **Predicate fail-closed only** — not proof of the P0 operational path. SAFE STALL is not promoted to an economic action. |
| Recovery/substitution after missed events | No such path was found in the reviewed helper or canonical regime carrier for quiescence. | **Not evidenced**. |
| External dependency boundary | Helper explicitly takes per-successor EEV, ProtectedCapital, representation-preservation and safety values as supplied witness fields. | **Inputs explicit, authority unresolved** — no binding proves their origin, freshness or completeness. |
| No observer/backend/relayer as economic authority | T2/P0 states this boundary. The helper itself does not authenticate a caller or observation; the reviewed quiescence path has no on-chain boundary to inspect. | **Specified, implementation not evidenced**. |
| Class safety and monotone `HighestClassEverActivated` | T2/P0 requires state-derived class safety and monotonic highest-ever class. The lifecycle helper carries only regime and transition nonce; neither class state nor highest-ever-class field is checked there. | **Missing from helper** — must be enforced at the canonical application/economic boundary, not inferred from the regime tag. |

### Canonical pre/post-state and transition binding

The available sources currently expose three different state surfaces, without a proved composition:

1. **Lifecycle helper state:** `PreRichLifecycleState { regime, transitionNonce }`; `EnterQuiescent` changes `Active` to `Quiescent` and increments the nonce.
2. **Canonical regime carrier:** `PreRichRegimeDatum` plus on-chain `GenesisRegimeAction = ActivateGenesis`; the reviewed validator accepts only the PRE-GENESIS → GENESIS edge and has no quiescence branch.
3. **Economic V3 state/admission:** `EconomicTransitionV3` uses `Issue`, `Reveal`, `Claim`, `Expire`. `PreRichEconomicAdmission` accepts a caller-supplied `allOmegaSuccessorsInCertifiedKernel` Boolean; it does not derive Ω closure or bind lifecycle transitions to V3.

Consequently, T2/P0 provides a normative **application-level candidate** for `EnterQuiescence`, but the reviewed implementation does not yet provide the canonical pre-state/post-state binding required to demonstrate that the action is independently revalidated and atomically committed on-chain. The P0 text's class-safety and `HighestClassEverActivated` requirements are also not discharged by the helper's regime/nonce pair.

### QNE-specific conclusion and `MaintainQuiescent`

`qneAcrossOmega` verifies each supplied `LifecycleOmegaWitness` for non-negative post-EEV/protected capital, non-eroding buffer, representation preservation and safety, and rejects an empty list. It does not establish that the list covers the authoritative Ω for declared perimeter E. Nor does it bind each witness to the actual post-state produced by a canonical `T(S,a,ω)`.

T2/P0 names `CONTRACT_CLASS / ENTER_QUIESCENCE`; no separate authorization for `MaintainQuiescent` was found in that binding. Its nonce-incrementing behavior therefore remains an implementation helper, not an approved QNE action, unless another approved source explicitly authorizes it. It must not be added to the universal IMMORTAL action algebra by inference.

The lifecycle test suite is **wired** in `.github/workflows/genesis-regime-carrier.yml` via `cabal test pre-rich-lifecycle-transition-tests`, and declared in `plutus/pre-rich-plutus.cabal`. This establishes test configuration only. A successful run and its logs must be verified separately; source presence or workflow wiring is not a passing result.

### Required next proof edge

Without changing V3/Reveal or introducing new economic semantics, the next admissible work is to establish from approved sources and implementation evidence:

1. the canonical pre-state, post-state, deterministic trigger and class-safety predicate for `ENTER_QUIESCENCE`;
2. the on-chain validator/transition path that revalidates and atomically consumes the canonical state, including stale/conflict and concurrency behavior;
3. the authoritative origin and completeness proof for EEV, ProtectedCapital, representation and safety evidence across every `ω ∈ Ω`;
4. the explicit refinement between that application transition and the declared IMMORTAL profile's `Accept` / `T(S,a,ω)`, without silently inserting the lifecycle action into `EconomicTransitionV3`;
5. a verified successful CI run for the wired suite, followed by independent evidence for Ω coverage and QNE over the declared perimeter.

**Disposition:** T2/P0 narrows the authority gap for the application-level `EnterQuiescence` candidate; it does not close implementation conformance, Ω completeness, CK3/CK3′, or C6-B. C6 remains **NOT CERTIFIED**. No source code or normative semantics were changed by this review.


## Additional implementation candidate — B2 Control carrier and class contraction (2026-10-18)

The follow-up search found a closer on-chain class-control surface on `work/immortal-green-closure`: `PRE-RICH/onchain/PreRichControlCarrier.hs`. This is materially relevant to T2/P0's `CONTRACT_CLASS / ENTER_QUIESCENCE` binding and should be assessed before deciding that the only implementation candidate is the separate lifecycle helper.

### What this carrier actually enforces

The reviewed `PreRichControlDatum` contains:
- `currentActiveClass`;
- `highestClassEverActivated`;
- `stateVersion`;
- `transitionNonce`;
- control policy/token identity.

Its validator requires exactly one own script input and continuing output, exactly one control token in aggregate inputs and outputs, unchanged output/input `Value`, a valid configured policy/token identity, and increments both state version and transition nonce by one. It also requires a transaction signature from the configured `authority`.

For `ContractControl`, the validator enforces that the new current class equals the redeemer's requested class and is no greater than the previous current class; `highestClassEverActivated` must remain unchanged. For `ActivateControl`, current and highest-ever class cannot decrease, and highest-ever remains at least the current class. These constraints are consistent with the monotonic-highest-class part of T2/P0.

### What it does not yet establish for ENTER_QUIESCENCE

1. **Not the same state/action:** this carrier models class indices, not the `PreRichRegime.Quiescent` tag. `ContractControl` does not itself transition `Active → Quiescent`, and no composition with `PreRichLifecycleTransition` was found.
2. **Invocation versus authorization:** the validator requires `authoritySigned configuredAuthority` for every action. T2/P0 says contraction/quiescence may be invoked permissionlessly. A permissionless submitter can transport a transaction only if the configured signature is independently available in the intended protocol path; the reviewed validator does not establish that. This is a material conformance question, not automatically a defect: clarify whether the signature authorizes a state-derived decision or makes a privileged caller the only eligible invoker.
3. **Decision/observation references:** the redeemer must provide non-empty decision and observation references, but this validator checks only that they are non-empty. It does not decode or authenticate their content, prove observation freshness, or independently derive the class contraction predicate from canonical economic evidence.
4. **Atomicity/concurrency:** singleton token conservation, one own input/output and monotone state version/nonce provide a strong local UTxO-consumption boundary. This supports stale/racing transaction rejection at the carrier level, but no successful ledger trace was established in this source pass.
5. **Economic QNE:** the class carrier does not compute EEV, ProtectedCapital, representation preservation, or `b = EEV - ProtectedCapital`; it therefore cannot alone discharge QNE or CK3/CK3′.

### Revised architecture conclusion

There are now two separate PRE-RICH candidates worth preserving, not conflating:

- `PreRichControlCarrier.ContractControl`: a canonical on-chain **class-contraction** transition with monotone `HighestClassEverActivated` and singleton-state consumption, but requiring a configured authority signature and not itself entering the `Quiescent` regime.
- `PreRichLifecycleTransition.EnterQuiescent`: an application-level **regime transition** aligned by name with T2/P0, but currently a pure helper without a demonstrated canonical on-chain state-consumption path.

The missing edge is more precise than previously recorded: establish whether the approved semantics intend class contraction to be the concrete mechanism for `ENTER_QUIESCENCE`, and, if so, provide an authorized refinement binding the class-control datum/action and the regime state transition atomically. Do not infer that mapping from naming alone, and do not remove the configured authority signature or invent a new permissionless mechanism without an approved source.

After that mapping is grounded, independently prove the QNE/Ω obligations. Neither carrier supplies an authoritative Ω envelope or a non-empty inductive `K_c` witness.

No source code was changed. C6 remains **NOT CERTIFIED**; the new finding narrows the implementation search but does not close P0 conformance or C6-B.


## Follow-up trace — B2 control carrier, deployment and permissionless P0 (2026-10-18)

The B2 control implementation was traced against the exact head of `work/immortal-green-closure` reviewed for this pass: `363811e0b78125f879e98a5e58aaf35b70c5801a`. This is source inspection; it does not establish that the current branch head has passed CI or that a control singleton is deployed on Preprod.

### What the carrier actually enforces

`PRE-RICH/onchain/PreRichControlCarrier.hs` defines a separate PRE-RICH control UTxO with `CurrentActiveClass`, `HighestClassEverActivated`, `stateVersion`, `transitionNonce`, policy identity and token name. `ContractControl` allows the current class to decrease while requiring `HighestClassEverActivated` to remain exactly unchanged. Both activation and contraction require non-empty decision/observation references, one continuing own-script output, exactly one own-script input, preservation of the singleton token, unchanged output Value, and increments of version and nonce.

The decisive authorization predicate is unconditional: `authoritySigned configuredAuthority txInfo` is required for every action. The validator only checks that the two references are non-empty; it does not itself authenticate their contents, derive the state-based contraction decision, or check the referenced observation's freshness. No `Quiescent` regime is encoded in this datum/action algebra, and this carrier does not calculate EEV, ProtectedCapital, Rep, the QNE buffer, or closure over Ω.

### Permissionless invocation is not established by the present deployment path

The deployment script `scripts/deployPreRichControlCarrier.mts` defaults `PREPROD_CONTROL_AUTHORITY_PKH` to the deploying wallet's payment key hash unless a separate authority hash is configured. This sets the authority identity; it does not implement permissionless transition submission.

Because the validator requires that authority's signature over the transaction, an arbitrary party cannot independently construct and submit a new contraction transaction without obtaining that signature. A party could potentially relay a fully signed transaction, but that is materially narrower than the T2/P0 contract that any eligible subject may invoke a transition from canonical state, with the protocol independently validating eligibility. The reviewed implementation does not establish a public transaction-construction/submission path that lets any submitter invoke a state-derived contraction without making the authority the required signer of the exact transaction.

This is a real unresolved conformance question, not an instruction to remove the signature. The signature could be compatible only if an approved authority decision is separated from permissionless invocation in a way that preserves the protocol's stated authority boundary; no such refinement is established by the reviewed files.

### What the workflows and tests demonstrate

- `.github/workflows/pre-rich-b2-control-conformance.yml` builds/caches the two B2 Plutus artifacts, runs TypeScript observation/provider regressions, and performs a browser build. The reviewed workflow does not invoke an on-chain/emulator trace of `ContractControl` or prove permissionless eligibility.
- The repository tree at the reviewed branch head did not expose a dedicated `PreRichControlCarrier` validator test file by that name. This is a path-level finding, not proof that no relevant assertions exist anywhere.
- `.github/workflows/pre-rich-b2-control-preprod.yml` is a manual deployment workflow. It explicitly checks out `work/immortal-green-closure`, builds fresh artifacts, resolves one live seed UTxO, deploys the singleton and uploads a deployment evidence JSON. The workflow definition and deployment script are not proof that the workflow has successfully run or that the singleton currently exists on Preprod; no successful run or live deployment evidence was verified in this pass.
- `Adapter/CARDANO/observation/PreprodB2ControlObservation.ts` reads the configured singleton and fails closed on missing/duplicate UTxOs, missing datum, malformed fields, or policy/token/class-binding mismatch. This establishes an observation boundary, not a transition-authority or liveness proof.
- `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` requires the control identity and binds the signed Issue authority response to the observed control reference. That supports the Issue admission read path; it does not establish the separate class-contraction/ENTER_QUIESCENCE transition.

### Required source-backed resolution

Keep the two existing candidates separate until an authorized source binds them:

1. `ContractControl`: authenticated class contraction with monotone `HighestClassEverActivated`, but with configured-authority signature and no explicit Quiescent regime.
2. `EnterQuiescent`: a separate PRE-RICH lifecycle helper transition, with no demonstrated atomic refinement into the authenticated B2 control UTxO.

The missing edge is an approved refinement specifying whether and how class contraction implements T2/P0 `CONTRACT_CLASS / ENTER_QUIESCENCE`, including the authority-signature versus permissionless-invocation boundary, canonical trigger/predicate, on-chain revalidation, atomic state delta, stale/concurrent submission behavior, and an evidence-backed ledger test. Do not infer that edge from the action name, and do not change validator semantics without an authorized decision.

**Updated C6 result:** B2 makes the class-control state more concrete but does not supply an authorized universal IMMORTAL action or a non-empty `Kc` witness. C6 remains **NOT CERTIFIED**; C6-B remains blocked. No V3, Reveal, economic constants, or normative semantics were changed.


## Normative cross-check — T2 and P0 permissionless wording (Notion snapshot 2026-09-14)

The direct source text resolves the general permissionless requirement more strongly than an action-name inference:

- **T2 — Transition Conformance Specification v0.1**, under P0 transition bindings, explicitly says for `CONTRACT_CLASS / ENTER_QUIESCENCE` that class safety is state-derived, contraction/quiescence may be invoked permissionlessly, stale higher-class state must never authorize an unsafe SALE, and `HighestClassEverActivated` remains monotone. Its common contract also requires independent on-chain revalidation, atomic state transition, stale/conflicting-state rejection, recovery/substitution, and no observer/backend/relayer/publisher becoming economic authority.
- **P0 — Protocol-Level Liveness & Permissionless Execution Contract**, §§1, 5, 7–8 and 14, defines permissionless as requiring no privileged operator and allowing any subject capable of constructing/submitting a valid transaction to attempt the transition. It explicitly lists both `CONTRACT_CLASS` and `ENTER_QUIESCENCE` as applicable transitions and says the class transition plus `CurrentActiveClass` update must be atomic. The submitter transports a candidate; protocol validation determines validity.

The reviewed B2 validator's mandatory `configuredAuthority` transaction signature is therefore **not proven conformant** to this source requirement. Relaying an authority-signed transaction is not enough to establish the stated model if the authority must approve/sign each exact transition and no independent eligible subject can cause an objectively eligible contraction to be constructed and submitted. However, the source does not specify the cryptographic shape of an authority decision, so this finding does **not** authorize deleting the signature or choosing a replacement scheme. The gap is a missing approved binding between (a) canonical state-derived eligibility, (b) any legitimate decision/evidence authorization, and (c) permissionless transaction submission plus validator revalidation.

**Source-quality qualification:** the Notion fetch metadata for both T2 and P0 reports `verification.state = unverified`; P0 is titled “Draft for consolidation” and its walk reports transition-level bindings as CLOSING. They are strong evidence of the documented intended contract, but they are not proof that the transition-specific implementation is closed or that these pages have been formally promoted to verified normative status. This distinction must remain visible in any closure claim.

**Operational consequence:** do not change B2 code yet. The next required artifact is an explicit, authorized transition binding/decision that preserves the documented permissionless contract and existing authority boundary; then test the concrete transaction path for any-submitter invocation, stale-state rejection, atomic class update and monotone historical maximum. Until that binding and evidence exist, this remains a conformance gap rather than a solved design.


## Follow-up clarification — B2-Control versus Beacon track; permissionless preference (2026-10-18)

A naming cross-check confirms that **B2-Control and Beacon are separate workstreams** and must not be treated as the same blocker:

- **B2-Control** is the PRE-RICH authenticated class-control singleton documented in `PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md` and implemented by `PRE-RICH/onchain/PreRichControlCarrier.hs`. It carries `CurrentActiveClass` / `HighestClassEverActivated` and currently requires `authoritySigned configuredAuthority` for both activation and contraction.
- **Beacon / Beacon 4** is a separate trust/canonicality and proof-path research track. The Beacon 4 Notion page explicitly labels that work as hypothesis/open architecture, not normative, and non-blocking for the first PRE-RICH ticket. It does not provide the missing authority refinement for `ContractControl`.

### Permissionless is the preferred target, not yet an approved protocol change

The current design preference is to preserve **permissionless invocation** for eligible class contraction / quiescence: any eligible subject should be able to construct and submit a candidate transaction, while the on-chain validator independently checks canonical state-derived eligibility and atomically applies the transition. A submitter/relayer must not become an economic authority, and a privileged key should not be required merely to invoke an already-eligible transition.

This preference is consistent with the documented intent in T2/P0, but it is **not itself a formal governance decision**. T2/P0 fetch metadata remains `unverified`, and P0 is marked “Draft for consolidation”. The sources do not yet define a canonical cryptographic format for any separate decision/evidence authorization. Therefore:

- Do **not** remove `configuredAuthority` from the validator by inference alone.
- Do **not** conflate permissionless transaction submission with permissionless economic decision-making: the chain must still independently revalidate the state-derived predicate and evidence.
- Resolve the exact boundary between a decision/evidence witness and transaction invocation in an authorized refinement; then implement and test it.
- Keep the separate `EnterQuiescent` helper and `ContractControl` carrier uncomposed until an approved mapping defines their atomic state transition.

### Next evidence gate

An approved binding must specify the eligible state-derived trigger, what (if anything) needs cryptographic authorization, how an arbitrary eligible submitter constructs/submits the transaction without a privileged per-transaction signer, and how the validator enforces freshness, stale/concurrent rejection, atomic class/regime update, and monotone `HighestClassEverActivated`. A reproducible emulator/ledger trace must then demonstrate invocation by a non-authority submitter and the negative twins.

**Status unchanged:** this clarifies scope and desired direction only. No validator, Beacon, V3, Reveal, or economic semantics were changed. C6 remains **NOT CERTIFIED**; no GREEN or deployment claim is made.


## Follow-up trace — permissionless pattern exists elsewhere; B2-specific binding still absent (2026-10-18)

A further cross-check found an existing design pattern that helps isolate the B2 issue without copying semantics across transitions:

- `PRE-RICH/docs/GENESIS-REGIME-CARRIER-DESIGN-v0.1.md` explicitly defines Genesis activation as permissionless: the predicate is checked on-chain, any eligible submitter may invoke, the transition is atomic, and no privileged Genesis operator is required.
- `PRE-RICH/onchain/PreRichLifecycleTransition.hs` separately defines the pure `Active → Quiescent` transition, but it is not itself an authenticated UTxO validator and is not composed with `PreRichControlCarrier`.
- `scripts/deployPreRichControlCarrier.mts` defaults `PREPROD_CONTROL_AUTHORITY_PKH` to the deploying wallet's payment key hash unless configured otherwise. This confirms the configured signer can default to the deployer; it does not prove any live deployment or authorize that key as the only class-transition invoker.
- `.github/workflows/pre-rich-b2-control-conformance.yml` does not contain a `ContractControl` ledger/emulator trace. The manual Preprod workflow definition is not evidence that deployment ran successfully.

### What this comparison establishes

Permissionless, state-derived, on-chain revalidation is already an explicit **design pattern** in the Genesis carrier design. It is therefore not necessary to invent a new general execution philosophy for B2. But Genesis activation and class contraction/quiescence have different predicates and state deltas: the Genesis design is precedent for the invocation boundary, **not authorization to transplant its validator or infer B2 transition semantics**.

### Recommended minimal next implementation decision (not applied)

Authorize a B2-specific refinement with the following boundary:

1. The canonical control/economic state determines whether contraction or quiescence is eligible.
2. Any submitter may construct and submit the candidate transaction once that predicate is true.
3. The validator re-derives/checks the predicate from authenticated, fresh state/evidence and performs the state update atomically.
4. If decision evidence needs authentication, its authorization must be represented separately from the identity of the transaction submitter; it must not silently make the configured key a required signer of every eligible invocation.
5. The class update, any regime change to `QUIESCENT`, and nonce/version changes must have one approved atomic refinement; stale competing transactions must fail against consumed canonical state.
6. `HighestClassEverActivated` remains monotone and contraction cannot retroactively authorize sales in a higher class.

This is a **recommended architecture decision for approval**, not an assertion that the current code already satisfies it. The exact evidence format, freshness predicate and composition with the regime carrier still need to be grounded in the authorized source contract before production code is changed.

**Verification status:** source inspection only. No test or deployment was executed in this pass. C6 remains **NOT CERTIFIED**; no V3, Reveal, economic constants, or Beacon semantics were changed.


## Source triangulation — P0 execution contract versus governance authority (2026-10-18)

The direct Notion source reads strengthen the intended invocation boundary but do not close the formal approval gap:

- **P0 — Protocol-Level Liveness & Permissionless Execution Contract** (metadata: `unverified`) explicitly says permissionless means no privileged operator is required and any eligible subject may submit a valid transition. Its transition table marks permissionless invocation as an existing principle for both `CONTRACT_CLASS` and `ENTER_QUIESCENCE`; it separately calls out atomic `CurrentActiveClass` update, preservation of `HighestClassEverActivated`, independent on-chain revalidation, stale-state safety and recovery.
- **GOV-02 — Authority / Permission Matrix v0.1** (metadata: `unverified`) prohibits relayer authority to alter canonical state, oracle/operator authority to define economic truth, and privileged settlement paths. It distinguishes participation/review from governance authority and canonicalization.
- **09 — Definitive Decision Register** (metadata: `unverified`) lists class control as semantically closed, but explicitly says infinite-horizon proof and ledger conformance remain to be proven. It does not provide a B2-specific authorization for the current per-transaction signer requirement.
- **GOV-28 — Governance Current State** (metadata: `unverified`) concerns governance decision lifecycle, witness, conformance and canonicalization gaps. The retrieved relevant sections do not define the cryptographic semantics of `PreRichControlCarrier.configuredAuthority` or authorize that signer as mandatory for class contraction.

### Result of authority search

No retrieved decision artifact explicitly binds all three elements needed here: (a) state-derived eligibility for `CONTRACT_CLASS / ENTER_QUIESCENCE`, (b) any distinct authorization of decision/evidence, and (c) permissionless transaction submission without a privileged per-transaction signer. The general P0/GOV-02 direction is clear in the retrieved text, but source metadata remains unverified and the B2-specific refinement is missing.

### Implementation decision

Do not alter `PreRichControlCarrier.hs` yet. The minimum safe implementation change cannot be selected until the canonical predicate/evidence reference and the class-to-`QUIESCENT` atomic mapping are grounded. Once approved, test at least: non-authority submitter succeeds when eligible; same submitter fails when ineligible; stale reference/UTxO fails; two competing submissions yield at most one transition; highest-ever class is unchanged on contraction; and class/regime/version/nonce update is atomic.

This is a source-retrieval result, not proof that no such decision exists anywhere in the workspace. It means none was found in the searched artifacts. No tests or deployment were run. C6 remains **NOT CERTIFIED**.


## Additional prior-art check — permissionless execution and class authority (2026-10-18)

A second targeted repository search found stronger textual prior art, but not a canonical B2 authorization:

- `docs/archive/treasury-distribution-spec.md` states that no human operator/backend/founder/team wallet/relayer may have discretionary authority over class activation or contraction, and that a relayer may execute a valid permissionless transaction. The file is under `docs/archive/`; it is historical/reconciliation material, not sufficient by itself to authorize a production validator change.
- `PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md` states that `CurrentActiveClass` may contract, `HighestClassEverActivated` is monotonic, and PRE-GENESIS → GENESIS is permissionless in design. It labels itself an integrative document and says normative meaning remains in cited source documents.
- `PRE-RICH/docs/GENESIS-REGIME-CARRIER-DESIGN-v0.1.md` gives a concrete permissionless pattern: state predicate, discoverable state, any eligible submitter, on-chain revalidation, atomic singleton transition, and stale competing candidate failure. It explicitly applies this pattern to Genesis, not automatically to class contraction.

### What this changes — and what it does not

This prior art makes the preferred separation of **economic decision authority** from **transaction submission** consistent with existing architecture language. It strengthens the case for a permissionless B2 refinement rather than a privileged keeper.

It does not prove that the current `ContractControl` validator can simply remove `configuredAuthority`: the B2 carrier currently validates only that decision/observation references are non-empty, not that they authenticate a fresh class-contraction predicate. Removing the signature without replacing that missing verification would make the action caller-controlled, not permissionless-and-safe.

### Minimal safe design boundary for the next implementation slice

1. Preserve the existing B2 singleton, exact one-input/one-output consumption, token conservation, unchanged Value, version/nonce increments, and monotone `HighestClassEverActivated`.
2. Define the exact on-chain-verifiable predicate/evidence reference for class contraction from already-approved sources; do not invent a new economic threshold or trust arbitrary non-empty references.
3. Bind `CurrentActiveClass` contraction and `QUIESCENT` regime transition atomically only if the approved canonical regime model requires both in the same transition; otherwise preserve the existing separated state machine and document its refinement boundary.
4. Add ledger-level positive/negative twins for non-authority submitter, ineligible state, stale evidence/reference, competing UTxO spends, monotone highest class, and atomic regime/version/nonce updates.
5. Keep Beacon/Materios outside this change: neither is a substitute for the class predicate or a reason to require a privileged tx signer.

**Status:** prior art found; B2-specific proof and conformance remain missing. No code change, CI run, or deployment performed. This section is a reconciliation finding, not a canonical amendment or authorization to alter the validator.

## B2 class-contraction predicate audit — exact boundary (2026-10-18)

### Canonical application semantics recovered

The current `PRE-RICH/docs/GAME-ECONOMY.md` labels its application baseline CLOSED and says:
- saleability derives from verified post-sale economic state; no administrator manually enables an economically unsafe class;
- `CurrentActiveClass` may contract while `HighestClassEverActivated` is monotonic;
- contraction follows the existing ladder `100 → 50 → 25 → 10 → 5 → 3 → 2 → 1 → HALT`;
- worst-case exposure is class-aware, with `WorstCaseExposure(P,N) = 500 × P × N`; aggregate unresolved count alone is insufficient when ticket prices differ;
- the application hysteresis semantics are closed at `KA=8`, `KC=4`, `KD=4`.

The archived `docs/archive/architecture-spec.md` further states that `CurrentActiveClass` is state-derived and may decrease when economic safety requires contraction, and that class exposure must be derived per class and consistent with aggregate unresolved reserve.

### What the audit did not find

These sources establish the economic constraints and desired outcome, but the reviewed active files do **not** expose a single reusable, authenticated `classContractionEligible(state) → nextClass` function that the B2 validator can call or independently reproduce. The closed parameter values alone do not specify the full on-chain predicate, the authoritative per-class state source, or the binding between a referenced decision/observation and the exact state snapshot.

`PreRichControlCarrier.hs` currently checks only that `ContractControl`'s decision and observation byte strings are non-empty; it does not validate them against canonical per-class counts/exposure, EEV, ProtectedCapital, saleability, or a current authenticated snapshot. The separate `PreRichLifecycleTransition.hs` is a pure regime helper and does not close this evidence boundary.

### Safe conclusion / implementation gate

Do **not** implement permissionless contraction by simply deleting `authoritySigned`, by trusting an off-chain class recommendation, or by inventing a threshold from `KA/KC/KD`. The exact missing artifact is an authenticated, reproducible binding from the existing closed PRE-RICH economic semantics to the B2 state transition:

1. identify the canonical on-chain source for per-class unresolved counts/exposure and all economic values required by the existing gate;
2. reuse the existing approved saleability/hysteresis derivation without redefining its thresholds;
3. bind the decision and observation references to the same current state/version and verify their authenticity/freshness on-chain;
4. derive the permitted contraction result from that state, rather than accept caller-selected `newCurrent`;
5. keep any tx submitter permissionless, while preserving singleton consumption, version/nonce increments, token/value invariants and monotone historical maximum;
6. demonstrate positive and adversarial ledger traces, including stale state, under-protected post-state, invalid evidence, and competing spends.

**Disposition:** implementation remains blocked at the predicate/evidence binding, not at the permissionless invocation concept. No code change, test run, CI dispatch or deployment performed. This is a source-audit finding, not a change to closed economic semantics.

## T2/P0 decision archaeology — semantic closure versus B2 conformance (2026-10-18)

### Normative reconciliation

The targeted Notion retrieval clarifies a distinction that must be preserved:

- **09 — Definitive Decision Register** classifies class control and hysteresis as semantically closed; `KA=8`, `KC=4`, `KD=4` and the class ladder remain canonical. It says implementation/conformance gaps do not reopen closed decisions.
- **T2 — Transition Conformance Specification** requires economic transitions to be ledger-verifiable and fail closed when a necessary condition cannot be demonstrated. It prohibits the redeemer from freely choosing canonical economic values. For system-triggered transitions it inherits P0's contract.
- **P0 — Protocol-Level Liveness & Permissionless Execution Contract** explicitly binds `CONTRACT_CLASS / ENTER_QUIESCENCE` to state-derived class safety, permissionless invocation, independent on-chain revalidation, atomic transition, stale-state rejection, recovery/re-discovery and monotone `HighestClassEverActivated`. A submitter transports a candidate; it does not decide economic truth. No submitter means SAFE STALL, not permission to sell at an unsafe class.

This is stronger than saying that permissionless invocation is merely a preference: the retrieved T2/P0 text specifies it as the intended conformance contract for these transitions. However, the retrieved Notion pages do not expose verified metadata establishing their governance status, so this audit records their explicit content without upgrading their source-verification status.

### Exact unresolved implementation boundary

The sources do **not** provide a complete executable refinement from those requirements to the current B2 validator. In particular, they do not establish, in one canonical implementation artifact:
1. the exact on-chain state representation for per-class unresolved exposure and the other inputs required by the already-closed economic gate;
2. the deterministic predicate and destination-class derivation that independently reproduce existing saleability/hysteresis semantics;
3. the authenticated and freshness-bound relationship between decision/observation evidence and the exact consumed control/economic state;
4. the atomic refinement, if any, between class contraction and the separate QUIESCENT regime state.

Therefore this is **not an invitation to reopen economic policy** or invent a new decision. It is an implementation/conformance gap against the stated contract. The current B2 carrier's non-empty reference checks and privileged `configuredAuthority` signature do not, by themselves, satisfy P0's independent on-chain revalidation. Removing that signature alone would not satisfy the contract either.

### Next implementation gate — no code authorized by this audit

Before changing the validator, identify an existing canonical state/evidence source and show how the closed economic predicate can be recomputed on-chain. Then test the contract at ledger/emulator level: eligible non-authority submitter succeeds; ineligible or under-protected state fails; stale/invalid evidence fails; competing spends allow at most one transition; class/regime/version/nonce changes are atomic as specified; `HighestClassEverActivated` never decreases.

**Disposition:** class/hysteresis semantics CLOSED; permissionless invocation contract explicitly specified in retrieved T2/P0; B2 predicate/evidence refinement and ledger conformance OPEN. C6 remains **NOT CERTIFIED**. This documentation update does not authorize a validator change and does not alter V3, Reveal, EEV, first Issue, Beacon or B3/Materios.
