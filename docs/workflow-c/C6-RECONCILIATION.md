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
