# Agent A — R1 S0/QNE obstruction and certificate options

**Date:** 2026-11-08  
**Branch:** `work/immortal-green-closure`  
**Audit base HEAD:** `bb1af83c46dd425361369675486ebef6e0c0fa7f`  
**Classification:** SOURCE-DERIVED ECONOMIC/CERTIFICATION ANALYSIS — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Owner:** Agent A — PRE-RICH economics, EEV and admission policy  
**Scope:** Current PRE-RICH V1 Preprod initial state, T-MARGIN/QNE, R1/VC1–VC6 and candidate routes. No change to 500×, V3, Reveal, B1 datum/redeemer, EEV source or admission semantics.

## 1. Executive disposition

The current source establishes a precise obstruction at the declared PRE-RICH Preprod initial state S0:

- S0 has no existing liabilities, unresolved tickets, protected components or Jackpot;
- only class 0 at 1 RU is saleable;
- among the current V3 actions `Issue`, `Reveal`, `Claim`, and `Expire`, only `Issue(0,1)` is structurally valid at S0;
- the Issue transaction continues the exact B1 Pool physical Value unchanged and leaves `ppTotalLiquidity` unchanged;
- the current V1 projection adds 500 RU of unresolved worst-case exposure to ProtectedCapital.

Consequently, under the current direct-USDM observation contract, pre- and candidate-EEV are the same exact Pool value:

`b(S) = EEV(S) − ProtectedCapital(S)`

`b(T(S0, Issue(0,1))) − b(S0) = 0 − 500 = −500 RU.`

This is an exact source-derived margin change, independent of the starting EEV. More capital can make the post-Issue state solvent, but it does not make this Issue non-eroding.

**What this proves:** the current S0 Issue action cannot be the non-eroding QNE witness required by the T-MARGIN certificate schema.

**What this does not prove:** it does not, by itself, prove `K* = ∅` or establish that every conceivable R1 certificate for a different, explicitly specified action/state model is impossible. T-EROSION requires a uniform erosion condition over every state and every available action. That global premise has not been demonstrated. The general R1 certificate still requires a total `χ`/`Wit` and VC1–VC6 over the authoritative Ω; no such deployment certificate currently exists.

The correct status remains: **R1/Kc/Ω certificate MISSING; current T-MARGIN/QNE witness at S0 NOT SATISFIED; no new protocol rule inferred.**

## 2. Exact source chain

The following current branch source identities were inspected read-only:

| Source | Blob SHA | Relevant fact |
|---|---|---|
| `PRE-RICH/src/PreRichPreprodDeploymentProfile.ts` | inspected at audit HEAD | Initial deployment profile: zero obligations/protected components, class 0 alone saleable, one-ticket unit price 1 RU |
| `PRE-RICH/onchain/PreRichEconomicProfile.hs` | `17487e50226a63061dfbf8500130a947bf5df62c` | V1 class ladder and fixed `epMaxNormalPayoutMultiplier = 500` |
| `PRE-RICH/onchain/PreRichIssueDecision.hs` | `d7ef01b841fc28a5e5085f8cfe473b7cc8e92e09` | First-Issue decision invokes the fixed `preRichEconomicProfileV1`; its input carries separate pre/candidate EEV values and an Omega-successors Boolean |
| `PRE-RICH/onchain/PreRichEconomicAdmission.hs` | `a654587114beec997d97d59810d1fb648facf365` | Projects candidate state, computes the Economic Gate and tests the supplied Omega-successors certification flag |
| `IMMORTAL/kernel/EconomicTransitionV3.hs` | inspected at audit HEAD | Current action constructors are Issue, Reveal, Claim and Expire; the initial state admits only class-0 Issue |
| `IMMORTAL/kernel/UniversalEconomicKernel.hs` | `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785` | ProtectedCapital includes crystallized liabilities, WCE and all separately typed protected components |
| `Adapter/CARDANO/observation/DirectUsdmEev.ts` | `0c6fa421a2655a2e84610f8ae4dae2a002120cbf` | Direct physical tUSDM amount is converted to EEV sub-units; no USD/USDM oracle mark is applied |
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | `atomicPoolReservationValid` requires the same complete physical Value before/after and unchanged Pool totalLiquidity while only face reserve/count increase |
| `plutus/B1PrizePool.hs` | `175be60b8f01ef214c92d7527191bcebb66ad656` | `TicketIssued` adds face reserve/count; the separate V1 solvency check still derives 500× WCE |

The deployment-profile and V3 transition file hashes are intentionally not reconstructed in this table; their current source contents were inspected, but no blob hashes are claimed here.

## 3. Exact S0 arithmetic

The declared S0 has:

- crystallized liabilities = 0;
- unresolved face reserve/count = 0;
- SafetyCapital = 0;
- ReserveProtection = 0;
- MandatoryFutureCosts = 0;
- Jackpot locked amount = 0;
- class 0 price = 1 RU, saleable, no prior tickets;
- classes 1–7 not saleable.

The V1 worst-case exposure is:

`WCE(S0) = 500 × 0 = 0 RU.`

After the only valid action `Issue(0,1)`:

`WCE(S1) = 500 × 1 × 1 = 500 RU.`

No crystallized liability or other protected component changes at Issue. The entire ProtectedCapital delta is therefore +500 RU.

The direct-USDM EEV adapter counts the physical quantity of the exact Preprod tUSDM in the exact B1 Pool UTxO. For the Issue transition:

- the MintPolicy requires `beforeValue == afterValue`;
- `ppTotalLiquidity(after) == ppTotalLiquidity(before)`;
- the Pool continuation carries the same physical Value;
- the ticket sale payment is a separate Treasury output, not a PrizePool liquidity increment.

Thus `candidateEEV = preEEV` when both are bound to the same stable Pool cut and the same exact direct-USDM quantity. No additional RU enters the Pool at Issue.

Let that common EEV be `E` RU:

`b(S0) = E − 0 = E`

`b(S1) = E − 500`

`Δb = −500 RU.`

Two different predicates must not be conflated:

| Condition | Result |
|---|---|
| Immediate post-Issue solvency | Passes only if `E ≥ 500 RU` and all other Gate/evidence conditions pass |
| T-MARGIN QNE non-erosion | Fails for this action for every `E`, because `Δb = −500 RU < 0` |

A larger initial Pool can satisfy immediate solvency while still failing the QNE comparison. Solvency headroom is not a non-eroding witness.

### 3.1 Test-fixture delta correction

`plutus/test/EconomicAdmissionTest.hs` contains a useful synthetic boundary test:

- pre-EEV = 500;
- candidate EEV = 501;
- initial synthetic RawSurplus = 500;
- post-Issue synthetic RawSurplus = 1.

That fixture demonstrates arithmetic and immediate-gate behavior, but it deliberately increases candidate EEV by 1 RU. It is not the exact Direct-USDM Issue observation, which binds pre/candidate EEV to the same Pool value. The fixture's displayed RawSurplus change is −499; the source-derived Direct-USDM QNE delta is −500. Also, `rawSurplus` is clamped at zero, whereas the R1 margin `b = EEV − ProtectedCapital` is the unclamped quantity. Do not use the synthetic 500→501 test as the deployment R1 certificate.

## 4. Certification interpretation — three different claims

### 4.1 General R1 certificate (VC1–VC6)

The normative R1 specification requires a concrete system `(S, A, Accept, Ω, T, Safe)`, a total deterministic characteristic predicate `χ`, a witness selector `Wit`, sound bounds and proof artefacts. In particular:

- VC2: every certified state is Safe;
- VC3: the selected action is available and **all authoritative Ω-successors** remain in the certified region;
- VC4: the witness action is accepted when required inputs are present;
- VC5: Ω is authoritative or soundly over-approximated;
- VC6: the actual declared S0 is in the certified region.

No deployment `χ`, `Wit`, complete E1–E10 package or verified deployment-bound certificate is currently present.

### 4.2 T-MARGIN certificate schema

The proved T-MARGIN schema is a sufficient route. It requires S1 (buffer non-negativity plus representation implies Safe) and QNE: a distinguished action available at every represented state whose every Ω-successor preserves or increases `b` and representation.

At current S0, that QNE action cannot be the only currently available V3 action, `Issue(0,1)`, because it decreases `b` by exactly 500 RU. Therefore **the current S0/action profile does not satisfy the T-MARGIN QNE side condition**.

### 4.3 T-EROSION and the whole-kernel claim

T-EROSION proves `K* = ∅` only if a positive uniform erosion amount applies for every state and every available action, with a worst-case eroding Ω-successor each time. The S0 result is local: it shows the only current action at S0 erodes by 500 RU. It does not establish the theorem's global premise.

Accordingly:
- do not claim that the mathematical IMMORTAL kernel is empty;
- do not claim the whole R1 problem is solved by a local Issue arithmetic test;
- do not claim the present T-MARGIN certificate is valid;
- do require an explicit R8/NV4 argument: either a real non-eroding witness under Ω, or a sound profile-wide argument why the T-EROSION obstruction does not apply, together with the actual R1 VC3 proof.

## 5. Current QNE and Ω evidence boundary

The current implementation passes `allOmegaSuccessorsCertified` as a Boolean into `PreRichEconomicAdmission` / `PreRichIssueDecision`. The Boolean is a gate input, not an independently enumerated or cryptographically verified Ω proof. The producer does not itself construct the authoritative event envelope, derive a witness selector, or prove VC3.

The normative Ω contract requires, for the declared perimeter, source authority, event-domain definition, actor independence, adaptive adversaries, repeated and correlated events, timing, concurrency, liquidity shocks, external truth/oracle failures, exclusions, unknown events and fail-closed behavior. Narrowing Ω because an event is unlikely is prohibited.

The current source set does not contain a deployment-bound evidence packet demonstrating:
- the complete Preprod environment perimeter and its exclusions;
- an over-approximation of all material successor classes for the candidate action;
- the exact proof that every successor remains in the proposed `Kc`;
- a profile-wide QNE/T-EROSION disposition;
- an authenticated source for current EEV and any required capital/obligation evidence at the same ledger cut.

This is an absence of certification evidence, not proof that every listed event currently occurs.

## 6. Candidate routes — none is approved

| Route | What it would need to establish | Why it is not a shortcut |
|---|---|---|
| **A. True Hold / Quiescent action** | An explicit action/state transition, available whenever required by `Wit`, with representation and `b` preserved for every authoritative Ω-successor | A label or no-op transaction is insufficient. If EEV can be invalidated, capital can deteriorate, or mandatory obligations accrue under Ω, Hold is not QNE. No Hold constructor exists in current V3Action. |
| **B. Capital-accreting Issue transition** | A single authenticated transition whose post-state EEV increases by at least 500 RU for the 1-RU class-0 Issue, with atomic physical Pool accounting and source proof | Current Issue preserves Pool Value and routes the 1-RU sale payment to Treasury. Merely pre-funding a larger starting balance does not change the −500 RU Δb of Issue. |
| **C. Different inductive certificate** | A concrete `χ`/`Wit` whose certified region includes the actual S0 and all chosen Ω-successors, with VC1–VC6 and terminal-state handling | General VC3 need not use the T-MARGIN formula, but it must be proved over all authoritative Ω-successors. The present V3 action set also has no action at the no-obligation/non-saleable terminal fixture; a certificate cannot silently ignore an actionless successor. |
| **D. Statistical cohort profile** | A separately governed probabilistic application guarantee, exact risk budget/model, pre-outcome complete cohort, capital partition, randomness proof and disclosed failure probability | Cantelli bounds a probability; Ω is a worst-case set, not a probability distribution. A non-zero probability of a payout above the cohort capital remains a permitted event in Ω. Statistical-only capacity cannot be presented as unchanged universal worst-case safety or as a QNE proof. A deterministic backstop for the whole gap removes the claimed uplift unless further qualified capital is committed. |

A future profile may choose to accept a probabilistic payout guarantee for new tickets, but that is a change in the user-facing guarantee, not a RiskMode toggle. It cannot retroactively alter V1 tickets. The deterministic accounting of known liabilities, expiry rights, exact Claim settlement and mandatory capital remains distinct.

## 7. Agent A recommendation

1. Preserve the current V1 500× rule and current Issue semantics while the first ticket is being qualified. Do not lower the floor or insert the statistical estimate into ProtectedCapital/ReserveProtection to make the certificate appear to pass.
2. Treat the S0 T-MARGIN/QNE witness as an actual blocker, not as a missing paperwork checkbox. A viable route needs a specified action model that remains valid under the authoritative Ω, or a different formally proved certificate.
3. Do not add a Hold/no-op constructor until the perimeter analysis proves that the environment cannot erode the buffer or representation while the system waits. Do not call inactivity safe merely because no transaction is submitted.
4. Keep probabilistic adaptive capacity separate from universal R1 safety. The 18/42/59 Cantelli sensitivities remain conditional research, not current V1 ticket limits or a substitute for the QNE/Ω proof.
5. Require any new action, profile or certificate design to be reviewed by Agent B for exact transaction/ledger binding and by the specification authority for policy adoption before implementation.

For the first V1 Issue, the remaining independent gates in Issue #37 remain unchanged: qualified USD/USDM settlement source, current EV1–EV7 evidence, deployment approval bound to those current hashes, R1/Kc/Ω, expiry and authoritative Issue admission.

## 8. Non-regression and execution record

- Read-only source and specification analysis only.
- No production source, test, workflow, profile, parameter, datum/redeemer ABI, V3, Reveal, 500×, ProtectedCapital, EEV source or admission semantics changed.
- No test or CI run is claimed by this report.
- No Preprod/Mainnet query, wallet signature, transaction, bootstrap, approval or deployment was performed.
- No provider, quorum, ε, Z, horizon, aggregation, fallback or statistical guarantee was selected.
- This report is documentation only and does not modify the shared central checkpoint.

**Disposition:** S0 Issue decreases `b` by exactly 500 RU; current T-MARGIN QNE witness fails at S0; a global T-EROSION theorem or alternative R1 certificate has not been established; R1/Kc/Ω remains OPEN; first V1 Preprod Issue remains BLOCKED.
