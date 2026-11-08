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


## 12. Recovered D3 clarification — permanent safety floor vs adaptive operating intensity

A historical design note recovered from the project Library, **D3 — Economic Engine for Agents** (2 November 2026), makes an important distinction that must remain explicit in this R1 proposal. That note is classified as **design / non-normative relative to the current repository**. It is a recovered application design candidate, not an adopted IMMORTAL or PRE-RICH Game policy.

### 12.1 The two layers are complementary, not interchangeable

**Layer A — deterministic worst-case floor (permanent safety boundary).**

No candidate action is admissible if its post-state violates the applicable ProtectedCapital, safe-action, or certified-Ω/viability requirements. A statistical signal, adaptive budget, operating class, or quiescent label cannot relax this floor.

**Layer B — adaptive operating intensity (discretionary capacity above the floor).**

Only after protected obligations and viability are accounted for may an application policy regulate the size/intensity of new exposure from genuine residual capacity. The recovered D3 sketch uses:

```
S_res(t) = max(0, EEV(t) - PC(t) - L_dedicated(t))
B_t      = alpha_t(S_res(t), class_t, stats_t) * S_res(t)
0 <= alpha_t <= 1
Notional <= min(B_t, RiskEnvelope)
```

These are the historical D3 design expressions, not a newly adopted formula for the IMMORTAL kernel. In particular:
- `S_res` is an operating-capacity view for the Agent's own capital/mandate perimeter; it is not automatically `RawSurplus`, a new ProtectedCapital bucket, or a PRE-RICH Game PrizePool balance.
- `B_t` is a discretionary exposure budget, not a guarantee, a liability reserve, or permission to breach `A_safe`, `Ω`, the Economic Gate, or the deterministic floor.
- `alpha_t`, its inputs/estimator, the RiskEnvelope, the horizon, and all transition thresholds remain unselected and non-normative until the relevant profile authority approves them.
- Statistical information may inform adaptive intensity only through a declared, evidenced profile policy. It cannot certify its own evidence, enlarge the safe action set, or offset mandatory deterministic obligations.

### 12.2 Operating regime and Quiescence candidate

The recovered D3 design proposes the following Agent operating classes:

| Class | Candidate operating capability |
|---|---|
| C0 | Observe / withdraw |
| C1 | Micro size, one leg |
| C2 | Standard size, two legs |
| C3 | Expanded operation, only in a healthy regime |

Upgrades/downgrades are proposed to use separate high/low thresholds (hysteresis) to avoid regime thrashing. No numerical thresholds or automatic mapping from `RiskMode` to C0–C3 are recovered as adopted policy.

The historical Quiescence candidate allows no new exposure, permits reduction/closure of existing positions, and permits withdrawal of uncommitted capital subject to the mandate and obligations. Candidate triggers recorded in D3 include stale oracle evidence, low market depth, drawdown, mandate revocation, `alpha_t -> 0`, or incomplete evidence. These are candidate application triggers, not a currently authorized universal IMMORTAL state transition.

### 12.3 Open exposure, harvestability, and ownership perimeter

D3 also records three constraints that must not be lost when this design is reconsidered:
- A multi-leg open position retains its bounded worst-loss obligation until the leg closes or expires; open exposure is not released merely because one leg has unrealized gains.
- Unrealized gains are not harvestable surplus.
- The recovered per-principal expression is `Harvestable_u = max(0, Equity_u - PC_u - OpenBound_u)`; the Pool analogue is assessed at Pool level and attributed through explicit shares.

The design distinguishes **Solo** (segregated principal, PnL and risk envelope for each user) from **Pool** (explicit collective principal, NAV/share and pro-rata gain/loss). It rejects silent netting between Solo users and rejects access by the Agent to PRE-RICH Game PrizePool, Jackpot, or Treasury without a separately authorized principal.

### 12.4 Relationship to RiskMode — do not collapse the two selectors

The architecture therefore contains two separate questions:

1. **RiskMode / R1:** for the exact candidate economic trajectory and profile, which risk-analysis mechanisms are required (deterministic, statistical, or both), and what typed evidence/constraints must reach ProtectionRequirement and the Economic Gate?
2. **D3 operating regime:** after all mandatory protection and viability constraints hold, what level of discretionary operating intensity is available to this Agent (C0–C3, or Quiescence), under its own mandate, residual-capacity calculation and RiskEnvelope?

RiskMode is not the C0–C3 class selector. C0–C3 is not a risk-analysis mode. Quiescence is not evidence that Ω is certified. A transition to a less intensive class or Quiescence cannot repair an already unsafe state retroactively; it only constrains future actions and permits the explicitly safe reduction/closure actions.

### 12.5 Application boundary and disposition

This D3 material belongs to the **PRE-RICH Arb Agent** candidate, not to the PRE-RICH Scratch & Win Game. Its Principal, liabilities, open exposures, EEV/valuation perimeter, RiskEnvelope, Solo/Pool accounting, and operational classes must remain separate from the Game's PrizePool, Jackpot, ticket exposure, and application policy.

The transferable IMMORTAL-level concepts are limited to the semantic boundaries already supported by the Canonical Economic Register: liability/protection-first accounting, residual capacity only after protection, safe-action/viability filtering, evidence provenance, atomic transition, and no authority expansion by an adaptive selector. The numeric and application-specific D3 mechanics remain non-normative.

**Status:** historical D3 two-layer design recovered and cross-referenced; no D3 selector, `alpha_t`, C0–C3 transition policy, RiskEnvelope, Solo/Pool accounting implementation, statistical reserve, or Game integration is authorized by this clarification. The deterministic safety floor remains non-substitutable.
## 10. Permissionless and automatic execution contract — required target

This section records the project requirement that the selector and admission path remain **permissionless, automatic, deterministic and independently verifiable**. It is a target architecture contract, not a claim that the current Issue path already satisfies it.

### 10.1 Invocation is permissionless; economic truth is not caller-defined

- Any user, keeper, relayer or independent observer may construct and submit a candidate transition.
- The caller may provide observations, witnesses and a candidate action, but may not choose the applicable RiskMode, risk-policy version, cohort limit, epsilon allocation or evidence-validity result.
- The canonical verifier and economic rules determine whether the submitted candidate is admissible. The submitter receives no special economic authority.
- A backend, signer, publisher or single operator must not become the per-transition source of economic truth. If an external data source is required, its identity, trust assumptions, freshness and verification boundary must be explicit and independently checkable.
- Liveness services may wake up, construct or relay a transaction; they cannot authorise an unsafe transition or make an invalid witness valid.

### 10.2 Automatic selector: deterministic function of authenticated inputs

The mode resolver must be a pure, deterministic, versioned function of at least:

- authenticated canonical pre-state and candidate post-state/projection;
- exact action and transition identity;
- active immutable profile and risk-policy commitments;
- trajectory definition and permitted transition envelope;
- authenticated liquidity, obligations and source observations;
- the model/evidence references required by that profile.

The same authenticated inputs and policy version must yield the same selected mode and disposition. The selector must choose required analytical mechanisms from the predeclared policy and verified trajectory facts, not select a mode after seeing which result is easiest to pass.

Unknown trajectory, missing/stale evidence, mismatched commitments or unavailable required analysis must fail closed. There is no automatic fallback from a required combined/statistical analysis to a weaker deterministic-only or caller-selected path merely because the required evidence failed.

Mode selection must be performed by canonical verifier logic or by a permissionless proof-carrying computation whose result is verified by canonical on-chain rules. A naked API response, database row, enum, or single authority signature over an off-chain scalar is not a trustless selector.

### 10.3 Statistical computation must be independently verifiable

Statistical cohort computation may be expensive and can be produced off-chain by any party, but the result cannot be accepted solely because a configured backend or signer asserts it.

Before a statistical profile is activated, its implementation must provide one of:
- an on-chain verifier for the declared bounded calculation; or
- a proof/witness format that any party can generate and the canonical on-chain verifier can validate against the committed model, cohort, state and inputs.

A committee or publisher signature may identify an observation source where the profile explicitly permits that trust assumption; it must not silently substitute for proof of the risk calculation or confer exclusive admission authority.

If the declared statistical calculation cannot be verified within the target ledger's transaction/resource constraints, the statistical admission mode remains unavailable/fail-closed on that adapter until a verifiable execution path is qualified. A simulation, Monte Carlo point estimate or off-chain attestation is not sufficient by itself.

### 10.4 Risk-budget reservation must be atomic and replay/concurrency safe

For a statistical cohort profile:

- the lifetime/global risk budget and every cohort allocation must be represented by canonical, versioned state;
- the new Issue must atomically reserve its allocation and bind it to the exact cohort/model/policy version;
- competing Issue transactions must not be able to consume the same remaining risk budget;
- a read-only reference to a budget UTxO is not, by itself, a concurrency lock or reservation;
- where multiple cohorts share one global budget, the canonical budget state must be consumed/recreated or otherwise updated through an equivalent ledger-enforced serialization mechanism in the same atomic admission transition;
- replay, stale-state, concurrent-spend or changed-model attempts must fail closed.

No new epsilon value, allocation formula, threshold or budget-reset rule is selected by this proposal.

### 10.5 Cohort terms are immutable; automatic regime changes affect new commitments

A ticket/cohort must be bound at admission to its exact application profile, policy version, payout-model version, cohort ID, risk-budget allocation and evidence commitment.

An automatic mode change may govern **new Issue candidates / new cohorts only**. It cannot retroactively:
- change the guarantee attached to an existing ticket;
- convert an existing statistical cohort into an unconditional deterministic 500× guarantee without actual eligible top-up/backstop;
- reduce a crystallised win or known liability;
- replenish a breached risk budget with future losing outcomes, future sales or uncommitted Treasury value.

If conditions deteriorate, the selector may stop or contract new admissions. Existing Reveal, Claim, Expire and settlement rights continue under the immutable rules already bound to their tickets.

### 10.6 Deterministic, statistical and hybrid application postures

These are distinct application guarantees, not an unrestricted global toggle:

| Application posture | New unresolved exposure | Required condition |
|---|---|---|
| **V1 deterministic** | Full profile WCE, currently 500 × Σ(Pᵢ × Nᵢ) | Existing PRE-RICH V1 rule; no statistical downgrade |
| **Statistical cohort** | Profile-approved cohort/path-risk requirement for unresolved outcomes | Explicit application-policy approval, qualified model, lifetime risk budget, eligible-capital perimeter and independently verifiable computation |
| **Hybrid/backstopped** | Statistical assessment plus a separately enforced deterministic backstop for the uncovered gap | Backstop must be real, authenticated, unencumbered and available to the same obligation perimeter |

For every posture, universal IMMORTAL invariants, authenticated state, known crystallised liabilities and the Economic/Viability Gate remain mandatory. A statistical profile may replace the current 500× unresolved-ticket WCE only if the specification authority explicitly adopts that different application guarantee for a new profile version. It cannot be presented as the same unconditional 500× guarantee.

The D3 Arb Agent intensity budget remains a separate mechanism: it limits discretionary activity above its safety floor and uses its own Principal / open-exposure perimeter. It is not the PRE-RICH Game statistical-cohort policy.

### 10.7 Quiescence and recovery are protocol dispositions, not privileged commands

A future governed selector may derive NORMAL / CONTRACTING / QUIESCENT / RECOVERY dispositions from authenticated state and the active policy. Their exact thresholds and model inputs remain authority decisions.

- QUIESCENT blocks new exposure/Issue when the required evidence, capital or risk conditions are not satisfied; it does not invalidate existing tickets or block their canonical lifecycle settlement.
- RECOVERY permits new admissions only after fresh authenticated evidence and the same canonical verifier establish that the active policy is again satisfied.
- Hysteresis thresholds, policy versions and transition evidence must be canonical and replay-safe. They must not be supplied per call by a user, DApp or relayer.
- PRE-RICH ticket-price classes (and KA/KC/KD) remain distinct from IMMORTAL RiskMode and from D3 Arb Agent operating classes C0–C3.

### 10.8 Current implementation gap — do not overstate permissionlessness

Agent B's independent 8 Nov review found that the current Issue-admission path verifies a configured Ed25519 authority binding over action/decision/observation references and state hashes. This is not the RiskMode selector, but it is a current admission dependency and means the path must not yet be described as fully permissionless/trustless.

The review also confirms that the current RiskProtectionBridge is not wired into PreRichEconomicAdmission; it accepts only the deterministic-only path and rejects StatisticalOnly / DeterministicAndStatistical. Its RiskEvidenceVerified constructor is an enum, not cryptographic proof.

Therefore this section specifies the desired trust boundary and future conformance target. It does not authorise removing the current signature, introduce a replacement signer, or claim a permissionless production path exists. Any removal of the configured authority dependency requires a separate proof-backed design and authorization.

### 10.9 Recommended order of implementation after policy approval

1. Freeze the application policy/profile version and its transition-to-mode mapping.
2. Specify the on-chain verifiable statistical witness/proof and deterministic calculation bounds; reject the design if it cannot meet ledger resource limits without trusted off-chain authority.
3. Specify atomic cohort/global-budget state and concurrency/replay behavior.
4. Bind profile, mode, model, cohort, state/action and evidence commitments into the canonical admission result.
5. Prove that universal invariants and known liabilities cannot be bypassed in any mode.
6. Implement behind a new, explicitly versioned application profile; preserve PRE-RICH V1 unchanged as the current fallback.
7. Run adversarial, differential, resource and on-chain conformance tests before any deployment consideration.

**Disposition:** permissionless/automatic/trustless selection is recorded as a hard target constraint. The resolver, proof-carrying statistical verifier, atomic risk-budget state and removal of the current configured signer dependency are not implemented or qualified. No risk appetite, alpha, Z, threshold, confidence level, combination formula or new guarantee is approved by this section.


## 11. State/action/trajectory resolver contract — explicit applicability matrix (2026-11-08)

This section turns the proposal's resolution sequence into an auditable state/action contract. It separates (a) facts already determined by source and current profile, (b) analytical relevance stated in the economic algorithm, and (c) binding mode/policy choices that still require specification authority. It does not silently turn a relevance statement into an approved numerical test.

### 11.1 Resolver signature and authority

The target resolver is a deterministic pure function over one exact candidate transition:

~~~text
T = (S_pre, action, S_candidate)
mode = ResolveRiskMode(
    profile_id,
    profile_version,
    risk_policy_hash,
    state_commitment(S_pre),
    action_commitment(action),
    candidate_commitment(S_candidate),
    derived_trajectory_id,
    authenticated_trajectory_facts,
    evidence_manifest
)
~~~

The resolver MUST derive the trajectory identity from the authenticated transition and profile. A caller-supplied trajectory label, RiskMode, operating class, alpha, confidence level, cohort membership or budget is never accepted as authority.

Minimum bound inputs:

- application/profile identity and immutable version;
- canonical pre-state and exact candidate post-state commitments;
- action/redeemer family and exact economic effect;
- derived trajectory ID and definition version;
- relevant obligation/exposure perimeter, asset/unit basis and time horizon;
- current deterministic protection rule and whether it is mandatory for this trajectory;
- statistical model/profile reference, population and risk epoch where applicable;
- authenticated source/freshness/completeness evidence and evidence digest;
- policy version / hash that defines the applicability mapping.

The resolver output is also bound to these same objects. Changing the candidate, profile, state, action, horizon, epoch or evidence invalidates the result and requires recomputation.

### 11.2 Analysis applicability is not the same thing as a funding formula

Use these meanings:

- **D (Worst-Case Analysis):** calculate the profile's deterministic bounded exposure and enforce every deterministic floor marked mandatory for this trajectory.
- **S (Statistical Risk Analysis):** calculate the selected, profile-qualified distribution/horizon/risk criterion and preserve its distinct evidence. It is only an admission constraint where the profile explicitly says so; otherwise it may be monitoring/reporting evidence.
- **D+S (Combined):** both analyses are independently required for the same trajectory. Their outputs remain separately typed. No sum, substitution, maximum, or other combination is inferred unless a separate rule declares units, horizon, perimeter, role and non-overlap.
- **UNRESOLVED / FAIL-CLOSED:** no unique authorized mapping or required evidence exists. The system does not ask the caller to pick a mode. New exposure is not admitted under a profile that requires the unresolved analysis.

A mode describes which analyses must be performed; it is not an amount of ProtectedCapital, a budget, or permission to skip the Economic Gate / Ω viability.

### 11.3 Current PRE-RICH action/trajectory applicability matrix

| Candidate action / derived trajectory | Source-supported current rule | Statistical relevance | Resolver disposition today |
|---|---|---|---|
| **Issue / Sale — new Pending ticket while its Registry is BeaconPending** | PRE-RICH V1 requires deterministic WCE = 500 × aggregate unresolved face exposure, atomic B1 face reservation, solvency, EEV/liquidity and viability checks. ECONOMIC-ALGORITHM.md also explicitly lists “evaluate statistical reserve” in the Sale sequence. | S is expressly relevant to Sale, but current sources do not settle whether the statistic is report-only or a separately binding sale criterion, nor its Z/confidence/horizon/epoch acceptance rule. | D is mandatory. S applicability is declared/relevant but its binding role is unresolved. Do not claim a complete D+S admission or silently omit the documented statistical evaluation. Current production implements D only; record this as a source-to-implementation gap pending policy clarification. |
| **Issue / Sale — a new ticket when any relevant outcome is already knowable** | V1 deterministic rule remains mandatory; current Issue commitment binds to BeaconPending. | Unconditional Classic-6 moments cannot be restarted for the old Pending set. A new statistical epoch may include only newly enrolled tickets whose Registry is still BeaconPending at a common freeze, with old epochs separately funded, or use a proven conditional model. | D mandatory. S is unresolved until a conditional-history / epoch-allocation contract is verified. No unconditional rolling re-admission. |
| **Reveal — derive result and crystallize a win** | Verify commitment/beacon, derive result, check exact pre-transition B1 affordability, release that ticket's unresolved reserve/exposure and add the actual payout as an immutable known liability. | A pre-existing sealed statistical epoch may continue to cover its original whole set; do not recalculate unconditional moments only over the remaining Pending tickets after observing an outcome. | D mandatory for transition/liability. No new mode switch on the revealed ticket; retain the epoch's existing statistical evidence only under its original terms. |
| **Claim — settle an already crystallized payout** | Verify owner/right, frozen payout/value and single settlement; reduce the known liability exactly once. | The payout is no longer an unresolved random variable. Statistical payout estimation cannot discount or defer the known claim. | D / exact accounting. S is not applicable to the already crystallized liability. |
| **Expire — close an expired unresolved right** | Apply the ticket's frozen expiry rule; remove the right/reserve exactly once under the canonical transition. | An expired ticket is no longer a future payout right. Its removal does not authorize resetting the risk epoch or recycling its ε; the remaining epoch's treatment follows the epoch contract. | D / exact lifecycle accounting. No fresh statistical draw or budget reset. |
| **FundTreasury / fund or pay Jackpot** | Preserve source-qualified value, exact FundingNeed, locked Jackpot and all known liabilities; Economic Gate / viability remain mandatory. | Classic-6 payout moments do not describe Treasury source quality, liquidation or the Jackpot state machine. Any other stochastic model must match the actual trajectory and be separately authorized. | D mandatory. No automatic Classic-6 S mode. |
| **EEV / executable-liquidity deterioration** | Verified EEV, executable liquidity, freshness, obligation completeness, post-state solvency and Ω viability govern the candidate. | The ticket payout PMF is not a market-liquidity or liquidation model. Statistical/stress evidence may be required only if the profile declares a matching asset/liquidity trajectory model and horizon. | D mandatory; S remains profile-specific and cannot be inferred from Classic-6. |
| **ACTIVE / QUIESCENT / RECOVERY or class contraction** | Existing class hysteresis, lifecycle transition and universal QNE/Ω requirements remain distinct and mandatory. | Authenticated indicators may be inputs to a future profile-owned regime predicate; statistical evidence cannot create QNE or authorize a non-viable successor. | D / universal viability mandatory. Any S-based trigger or recovery condition needs a versioned predicate, evidence contract and hysteresis rule. |
| **PRE-RICH Arb Agent candidate trade** | Separate user mandate, Solo/Pool principal, open exposure, EEV and safety perimeter. | D3 proposes an always-on floor plus post-protection dynamic intensity / RiskEnvelope. It is not the Game's prize-payout PMF. | Separate application profile/resolver. Never inherit Game's Pool, Jackpot, 500× or statistical epoch. |

This matrix does not assign one universal mode to an action name. Exact candidate facts and the applicable profile policy remain inputs. It does establish that Claim/Expire are not fresh payout draws, Reveal crystallizes a known liability, and the Classic-6 cohort model cannot be reused as a liquidity model.

### 11.4 Deterministic resolution algorithm

The resolver MUST execute the following ordered steps and return a bound assessment or a typed failure:

1. **Authenticate profile.** Check the profile ID/version, policy hash and activation interval. Reject unknown, stale, superseded or unapproved policy.
2. **Commit the candidate.** Bind exact canonical pre-state, action/redeemer, candidate post-state, asset/unit basis and observation references.
3. **Derive trajectory.** Compute the trajectory family from the transition and its verified facts. Never trust a caller's trajectory ID or RiskMode.
4. **Resolve required analyses.** Evaluate the profile's applicability predicates over the derived trajectory facts. The mapping must yield exactly one required-analysis set. No match, ambiguous overlap, or conflicting rules produces UNRESOLVED / FAIL-CLOSED.
5. **Preserve mandatory D.** If the profile marks a deterministic floor mandatory, calculate it from canonical state/profile and verify it exactly. No statistical result can lower or switch it off.
6. **Verify S where selected.** Require the exact model, population/epoch, horizon, confidence/tail criterion, dependence or conditional-information contract, integer precision, freshness and proof/witness. A Monte Carlo point estimate or unauthenticated signed value is not sufficient.
7. **Keep outputs separate.** Produce D and S results as separate typed evidence. Apply an arithmetic combination only under an explicit versioned rule.
8. **Run universal admissibility.** Evaluate protected obligations, EEV, executable liquidity, Economic Gate, A_safe and every required Ω successor for this exact candidate.
9. **Commit atomically.** Bind mode, profile, policy/model versions, evidence digest, budget/epoch state and candidate state in the same concurrency/replay-safe admission boundary. If the exact state changes, recompute.

### 11.5 Automatic state change, hysteresis and immutable commitments

The selection is automatic because every transition re-evaluates the same public, versioned predicate over its newly authenticated state and candidate trajectory. It is not automatic because an AI, keeper, user or relayer chooses a convenient enum.

A future selector may change the required analysis as verified state changes, but only as follows:

- transition guards and operating-regime predicates are committed in the profile/policy version;
- any high/low hysteresis relationship and its evidence inputs are declared by that policy; no numerical thresholds are invented by this proposal;
- the new mode applies to the new candidate transition/new cohort only;
- existing tickets retain the guarantee, model, epoch and expiry terms bound at admission;
- contraction/quiescence may block new exposure but cannot erase Reveal/Claim/Expire rights or bypass Ω/QNE;
- recovery requires fresh authenticated evidence and a fresh successful resolver/Gate evaluation; no caller may request a recovery mode directly.

Current PRE-RICH KA/KC/KD values govern the Game's ticket-class hysteresis, not the missing RiskMode thresholds. D3 C0–C3 remains a separate Arb Agent design. Neither is silently reused as the RiskMode state classifier.

### 11.6 Permissionless verifier target

A permissionless implementation can allow any participant to derive and submit a candidate assessment, but the canonical verifier—not the submitter—must enforce the same result:

- policy and model versions are public, immutable for the commitment and content-addressed;
- inputs are ledger-authenticated or proven against authenticated references;
- any party can generate the deterministic calculation / statistical witness;
- on-chain verification binds the witness to the exact profile, pre-state, action, candidate, cohort and epoch;
- the admission transition atomically reserves the required eligible capital and global/epoch risk budget;
- competing, stale, replayed or partially updated candidates fail;
- no exclusive signer, backend assertion or caller-supplied RiskMode can decide admissibility.

Current code does not meet this target: the bridge accepts deterministic-only and is not wired to Admission; the Gate has no statistical mode or intensity fields; and the current Issue path retains a configured Ed25519 authority binding. This section is a target contract, not a claim of present permissionless production behavior.

### 11.7 Decisions still reserved to specification authority

The following are not derivable from the resolver mechanics and must be explicitly decided before activation:

1. For PRE-RICH Issue, whether the documented statistical-reserve evaluation is monitoring-only or a binding second sale criterion; do not infer this from the phrase “evaluate statistical reserve” alone.
2. Which statistical construction is normative for the Game trajectory: the historical Nμ + Zσ√N, the research Cantelli bound, or another explicitly specified model. They are not interchangeable.
3. The applicable population, pre-outcome epoch freeze, horizon, global/lifetime ε, treatment of BeaconReady tickets, conditional-information assumptions and capital ring-fencing.
4. Whether a future PRE-RICH Game profile may replace the current per-ticket 500× pathwise payout guarantee with a probabilistic criterion for new commitments. Such a version would be a different guarantee; V1 remains unchanged.
5. Which verified state predicates govern mode/regime transitions, high/low hysteresis and recovery; no thresholds or α values are selected here.
6. The proof format, integer/resource budget and atomic on-chain state needed to verify the selector permissionlessly.
7. The separate PRE-RICH Arb Agent policy/mandate authority, if its D3 intensity design is ever implemented.

**Disposition:** the resolver's structure and applicability boundaries are now explicit; the binding PRE-RICH statistical sale role, statistical model, state predicates, thresholds, epoch/global-budget state and on-chain verifier remain OPEN. No selector or mode switch is implemented by this proposal.
