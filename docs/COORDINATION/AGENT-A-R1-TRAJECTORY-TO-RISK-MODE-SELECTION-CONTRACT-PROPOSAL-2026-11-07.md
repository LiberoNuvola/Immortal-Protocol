# Agent A-R1 — Trajectory-to-RiskMode Selection Contract Proposal

**Date:** 2026-11-07  
**Branch:** `work/immortal-green-closure`  
**Source HEAD at proposal start:** `6175c6f7c16eb13b8bf8b7f37a066d2636d58c33`  
**Status:** PROPOSAL / NORMATIVE AUTHORITY DECISION REQUIRED  
**Owner:** Agent A — economic model and policy mapping  
**Independent review:** Agent B — IMMORTAL kernel, V3 and Plutus boundary  
**Implementation:** none  
**Decision authority:** protocol/specification authority; IMMORTAL retains economic admissibility authority

## 1. Purpose and decision boundary

This proposal closes the next analysis step after recovering the typed `RiskMode` scaffold. It defines what a state/trajectory-to-mode contract must bind, how the three existing modes are to be interpreted without weakening safety, which evidence must be present, and where the current profile prevents particular modes from being used.

It does **not** select new thresholds, a value for `Z`, a statistical horizon, `α_t`, an AWRA objective, a combination formula, or a new economic reserve. It does not implement a selector or connect the bridge to production admission.

The canonical IMMORTAL Economic Register establishes the governing direction:

1. identify the candidate economic trajectory / transition envelope;
2. determine which risk information is relevant to that trajectory and applicable profile;
3. evaluate using applicable Worst-Case and/or Statistical analysis;
4. pass constraints/evidence to the IMMORTAL Economic/Viability Gate;
5. admit only if universal constraints and the profile's declared risk policy are satisfied.

The selection is trajectory-dependent, but not caller-selectable: IMMORTAL owns economic admissibility, while the application profile declares its bounded-exposure and statistical-model parameters.

## 2. Interpret RiskMode as an analysis-selection result, not a safety switch

The existing `RiskMode` values should be interpreted as identifying which analytical mechanisms are required for a candidate trajectory:

| Existing mode | Proposed semantic meaning | Safety condition |
|---|---|---|
| `DeterministicWorstCaseOnly` | Evaluate the declared deterministic bounded-exposure model for this trajectory; no statistical assessment is required by the applicable profile rule. | Every universal hard invariant and every application-mandated deterministic floor remains enforced. |
| `StatisticalOnly` | Evaluate the declared distribution/horizon/confidence model where that is the profile-authorized analysis for this trajectory. | This does **not** waive universal safety constraints or any independently mandatory application floor. If the profile requires a deterministic floor, it remains separately evaluated. |
| `DeterministicAndStatistical` | Evaluate both analytical mechanisms for the same trajectory, preserving their distinct outputs and stated roles. | Both outputs must satisfy the declared profile rule; no addition, substitution or double counting may be inferred without an explicit versioned combination contract. |

This resolves a potentially dangerous ambiguity: `StatisticalOnly` cannot mean “statistical estimate replaces a mandatory deterministic guarantee.” It may mean only that the statistical mechanism is the selected *trajectory risk analysis* where no separate deterministic exposure requirement applies. All universal safety invariants remain active.

### Current PRE-RICH V1 constraint

PRE-RICH V1 has a declared maximum normal payout multiplier of 500, and its current unresolved-ticket WCE is part of ProtectedCapital. Therefore the present PRE-RICH Game profile cannot use `StatisticalOnly` to omit or reduce the 500× WCE.

Until a governed profile decision says otherwise:
- deterministic WCE remains mandatory for the PRE-RICH Game paths that create or retain unresolved ticket exposure;
- statistical analysis may be separately calculated for research/reporting or a separately authorized policy criterion, but it does not reduce the existing WCE;
- combined mode remains unsupported by the current bridge and has no adopted combination rule;
- no statistical reserve is silently inserted into `ReserveProtection`.

This profile-specific statement must not be generalized into a universal rule that every IMMORTAL application must always run both models. The canonical register deliberately allows trajectory-specific Worst-Case and/or Statistical analysis.

## 3. Proposed selector inputs and authority binding

A mode resolver must not accept a naked caller-selected `RiskMode` as sufficient authority. It must resolve the mode from a verified candidate trajectory, the applicable profile's predeclared policy, and authenticated evidence.

Minimum input contract:

| Input | Required meaning | Authority / validation |
|---|---|---|
| Profile identity and version | Exact application/deployment economic profile. | Must match the profile bound to admission and current deployment. |
| Candidate pre-state commitment | Exact canonical state to which the decision applies. | Authenticated state observation; stale or mismatched state rejects. |
| Candidate action / transition identity | Exact action and transition envelope under assessment. | Must match the candidate that is later admitted/executed. |
| Candidate post-state commitment or refinement reference | The state and obligation projection being assessed. | Must be derived by the canonical transition/projection path, not supplied as an unverified claim. |
| Trajectory identifier and definition version | Stable identity for the transition/environment envelope. | Must resolve to a declared profile/IMMORTAL trajectory definition. An ID alone is not a definition. |
| Applicable risk-policy version | Predeclared mapping from trajectory features to required analysis mechanisms. | Governed/versioned; cannot be selected or changed by Adapter or user. |
| Deterministic assessment and evidence | Bounded exposure and its declared assumptions, where required. | Must match canonical profile-derived WCE when a deterministic floor applies. |
| Statistical model reference and evidence | Distribution, model version, horizon, confidence/risk criterion, dependence assumptions, precision and freshness. | Must be profile-declared and independently qualified; missing components make that analysis unavailable. |
| Combination-rule reference | Required only where both outputs jointly constrain the same admissibility decision. | Explicit version, role, units, horizon, perimeter and non-overlap proof. Absence does not authorize arithmetic addition. |
| Evidence provenance | Source references, observation point/time, hashes/signatures and completeness. | Must be authenticated and bound to the exact profile, state and trajectory. |

### Required output binding

The resolved `RiskAssessment` must be inseparable from:
- profile version;
- trajectory identifier and definition version;
- exact candidate transition/state commitment;
- selected risk-policy version;
- selected mode and the reason/evidence that selected it;
- versioned deterministic and/or statistical model references;
- evidence digest and status;
- combination-rule version, only when applicable.

The current `RiskAssessment` has profile version and trajectory ID, but does not by itself carry a state/action commitment, trajectory-definition version, risk-policy version, individual model version/horizon/confidence metadata or evidence digest. The existing bridge therefore lacks enough binding fields to establish the full resolver contract.

The exact serialization and whether references are carried directly or through an authenticated evidence manifest remain implementation design, not decided here.

## 4. Proposed resolution sequence

The resolver must follow this order. It must not fall back to whichever mode happens to pass.

1. **Authenticate candidate context.** Verify the canonical pre-state, action, profile, current observation and candidate transition/refinement.
2. **Resolve trajectory.** Derive the trajectory identity and transition envelope from the candidate action and authoritative state/environment evidence. Reject unknown, ambiguous or out-of-profile trajectories.
3. **Load predeclared policy.** Resolve the exact risk-policy version bound to the profile/deployment. The candidate caller cannot supply or override the policy version.
4. **Determine mechanism applicability.** Apply the policy's declared applicability mapping to the verified trajectory facts. This yields the required analysis mode; it is not chosen from model results.
5. **Verify each required model.** A required deterministic or statistical assessment must be present, fresh, complete, correctly scoped and bound to the same candidate. Missing or invalid required evidence rejects the candidate.
6. **Construct Protection Requirement.** Preserve deterministic and statistical outputs as separately typed requirements, unless an explicitly authorized and versioned rule defines their joint use.
7. **Run universal safety / viability.** Apply every mandatory invariant and the authoritative `Ω)-successor requirement. A risk-mode result cannot grant an exception.
8. **Admit exact candidate.** Bind the final decision to the same pre-state, candidate post-state, transition, profile and evidence commitments. Any mutation or stale read forces recomputation.

A failure at any step is fail-closed. There is no implicit downgrade from combined to deterministic-only, deterministic to statistical-only, or evidence-required to evidence-optional.

## 5. Trajectory applicability matrix — candidate mapping, not a new policy

The following matrix distinguishes what the current model already requires from what remains for the specification authority to decide.

| PRE-RICH / IMMORTAL trajectory family | Existing deterministic/accounting treatment | Statistical role | Current mode disposition |
|---|---|---|---|
| Issue creating an unresolved ticket | Adds face reserve/count and adds profile WCE (500× price) to the protected exposure calculation. | The payout distribution can characterize the unresolved cohort; its use as a separate admission criterion is not fully specified in the current Gate path. | PRE-RICH V1 requires deterministic-only today. Whether an additional statistical criterion is also mandatory is OPEN. |
| Reveal resolving one unresolved ticket | Removes the ticket's unresolved face/WCE exposure and adds the actual payout as a crystallized liability. | A cohort statistic may describe the remaining unresolved tickets, but cannot replace the realized liability or alter the deterministic transition. | Deterministic lifecycle/accounting remains mandatory. Statistical treatment of the remaining cohort is profile-policy OPEN. |
| Claim of crystallized liability | Reduces the settled liability by the exact claimed amount. | No statistical estimate can reduce or bypass the known liability. Any separate residual portfolio statistic is not a substitute for settlement accounting. | Existing deterministic accounting and Gate; no statistical substitution. |
| Expire of unresolved ticket | Removes the ticket's unresolved face/WCE exposure under existing expiry/right rules. | Statistical estimate of the remaining unresolved cohort may be recalculated only if a profile policy requires it. It cannot create or erase expiry rights. | Existing deterministic lifecycle/accounting; statistical applicability OPEN. |
| EEV / executable-liquidity deterioration | Existing evidence freshness, executable liquidity and solvency checks apply; an asset is not executable merely because it has a nominal valuation. | Distributional risk can inform a governed trajectory assessment only with an explicit horizon/model; the dynamic AWRA RiskEnvelope references are not a canonical substitute. | Additional statistical/envelope use OPEN; current Gate remains mandatory. |
| ACTIVE → QUIESCENT / QUIESCENT maintenance | Separate lifecycle transition; no V3 economic fields change. QNE must hold for every authoritative `Ω) successor. | Statistical signals may be inputs to a future policy trigger only if expressly authorized and evidenced. They cannot create QNE or certify the `Ω) set. | Lifecycle/QNE path remains separate; no automatic RiskMode mapping. |
| Arb Agent candidate exposure | Separate Principal/mandate/capital perimeter; D3 proposes always-on safety floor plus dynamic surplus/intensity control. | Agent-specific trajectory risk may use profile-authorized statistical analysis. | D3 design remains non-normative; no PRE-RICH Game/PrizePool authority is inherited. |

This matrix is intentionally not an executable state-to-mode table. The canonical register specifies the process and the authority boundary, but does not freeze the complete profile mapping. The authority must approve that mapping before any resolver is implemented.

## 6. Output contract into ProtectionRequirement and Gate

The current bridge returns only:

```haskell
ProtectionRequirement
  { prProfileVersion
  , prTrajectoryId
  , prDeterministicWorstCase
  }
```

That is sufficient for the implemented deterministic-only path, but cannot represent a separately constrained statistical output or an authorized combined assessment without ambiguity.

The proposed semantic output must preserve at least these logically distinct fields:

- deterministic hard-floor requirement, where applicable;
- statistical assessment/criterion and its model/horizon/confidence evidence, where applicable;
- mode and trajectory-policy binding;
- optional versioned combination semantics only where approved;
- evidence completeness and validity;
- exact candidate state/action binding.

No specific Haskell record shape or arithmetic combination is selected here. The implementation review must ensure that:
- deterministic WCE cannot be lowered by a statistical result;
- statistical estimates cannot be mislabeled as funded reserves;
- `ReserveProtection` cannot be reused absent provenance and non-overlap;
- `RawSurplus` is derived only after all applicable protected obligations are accounted for;
- the Economic Gate consumes the canonical typed requirement, not an Adapter-authored parallel decision.

## 7. Relationship to AWRA and the two-layer intensity model

RiskMode selection and AWRA allocation are related but are not the same decision.

- **RiskMode** selects which analytical mechanisms are required for the candidate trajectory.
- **ProtectionRequirement** carries the applicable risk constraints/evidence into economic admissibility.
- **AWRA / dynamic surplus allocation** may select a discretionary application policy only after protection and viability have bounded the safe action set.
- **D3 Arb Agent intensity** uses its separate capital and mandate perimeter; its `S_res`, `α_t`, budget and RiskEnvelope cannot be imported into PRE-RICH Game without a game-specific authority decision.

The order remains:

```text
Authenticated State + Candidate Trajectory
        ↓
Profile-bound RiskMode resolution
        ↓
Worst-Case and/or Statistical assessment
        ↓
Typed Protection Requirement
        ↓
ProtectedCapital / A_safe / Ω / Viability
        ↓
Economic Gate
        ↓
Authorized application policy (e.g. AWRA within its scope)
        ↓
Adapter execution of the admitted candidate
```

AWRA cannot choose its own risk mode, define its own objective, enlarge the safe action set, or revise the evidence authority. No `α_t) value, AWRA budget fraction, candidate preference or RiskEnvelope parameter is proposed.

## 8. Fail-closed conditions

Reject the candidate if any of the following occurs:

- profile version, policy version, trajectory definition or state/action commitment is missing or mismatched;
- the trajectory is unknown, ambiguous or outside the declared profile;
- the caller-supplied mode disagrees with the authorized resolver;
- a required model is unavailable, stale, invalid, incomplete or bound to another horizon/perimeter;
- a deterministic assessment differs from canonical projected WCE where that floor applies;
- a statistical result is supplied without its declared model/horizon/confidence/dependence evidence;
- combined mode is selected without an approved, versioned role/units/horizon/perimeter/non-overlap contract;
- an output would reduce a mandatory deterministic floor, count unavailable liquidity, duplicate a protected obligation or infer ReserveProtection from another field;
- the exact candidate changes after risk assessment or before atomic admission;
- `Ω) completeness/certification or universal viability is not established.

## 9. Decisions required from specification authority

These are the explicit decisions still needed; this proposal does not answer them by assumption:

1. **Scope:** which application profiles and trajectory families use the resolver first? PRE-RICH Game and Arb Agent must remain separate.
2. **Profile mapping:** which state/action/trajectory facts map to each of the three `RiskMode` values?
3. **StatisticalOnly semantics:** for profiles with mandatory deterministic floors, confirm that this mode cannot suppress those floors. For PRE-RICH V1, retain 500× unless separately changed by an authorized decision.
4. **Statistical model contract:** choose/confirm distribution version, population/cohort, horizon, confidence criterion, dependence/correlation assumptions, numerical precision and freshness.
5. **Combined mode:** decide whether both analyses can jointly constrain a trajectory and, if so, their separate roles, common units/horizon/perimeter, non-double-counting rule and combination-rule version.
6. **Output semantics:** decide whether the statistical result is monitoring-only, a distinct admission constraint, or a separately funded reserve; do not conflate these.
7. **Quiescence/recovery:** decide which evidence may trigger regime changes and which concrete actions are admissible in each regime; QNE remains a separate universal proof obligation.
8. **Governance:** identify the canonical policy artifact, authority, versioning, amendment and activation procedure.

## 10. Agent A / Agent B work split

### Agent A — economic contract
- reconcile the trajectory mapping against the current profile and Canonical Economic Register;
- present the open authority decisions above as a decision packet;
- keep game vs agent capital boundaries explicit;
- make no numerical or normative selection not present in an approved source.

### Agent B — implementation/conformance review
- verify the final resolver and assessment binding cannot be caller-selected or replayed against a different candidate;
- preserve deterministic PRE-RICH 500× WCE and current V3/Reveal lifecycle;
- ensure combined/statistical modes remain fail-closed until the authority contract is available;
- verify the typed Protection Requirement is consumed by the existing Gate rather than creating a second authority;
- require negative tests for stale/mismatched state, trajectory, policy, evidence and mode.

## 11. Disposition

| Item | Status |
|---|---|
| Canonical trajectory-dependent Worst-Case and/or Statistical architecture | CONFIRMED |
| Existing typed three-value RiskMode enum | PRESENT |
| Authorized state/trajectory-to-mode resolver | NOT IMPLEMENTED / POLICY MAPPING OPEN |
| Deterministic-only bridge path | IMPLEMENTED IN SCAFFOLD; not wired into admission |
| StatisticalOnly and combined bridge paths | UNSUPPORTED / FAIL-CLOSED |
| PRE-RICH V1 deterministic WCE 500× | REMAINS REQUIRED |
| Statistical role in PRE-RICH V1 Gate | OPEN |
| Combined risk rule | OPEN; no additive formula |
| RiskMode → ProtectionRequirement → Admission/Gate production path | NOT INTEGRATED |
| AWRA final selector and dynamic intensity parameters | OPEN / RESEARCH REFERENCES ONLY |
| Arb Agent D3 → Scratch & Win reuse | NOT AUTHORIZED |

**No code or policy was changed.** This proposal does not close R1/Kc/QNE, does not create a non-eroding witness, does not modify 500×, ProtectedCapital, V3, Reveal, EEV, deployment or Issue authorization. All current bridge negative behavior remains the correct fail-closed disposition pending the decisions above.
