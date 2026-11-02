# PRE-RICH C1 — Capacity / EEV / ProtectedCapital Evidence Reconciliation

**Date:** 2026-11-02  
**Branch:** `work/immortal-green-closure`  
**Audited HEAD:** `d5a5244032ce3b42589ed99f5b89c14afb0a2f4a`  
**Classification:** READ-ONLY ECONOMIC RECONCILIATION / EVIDENCE CONTRACT — NOT IMPLEMENTED, NOT CERTIFIED  
**Scope:** PRE-RICH capacity numerator (C), EEV, ProtectedCapital, and the cost surface used by Hysteresis.  
**Explicit exclusions:** No code, V3, Reveal, workflow, deployment, or on-chain state changes. No IMMORTAL universal-kernel theorem is claimed.

## 1. Executive conclusion

The semantic bridge for the Hysteresis numerator can be recovered from the existing economic documentation:

```text
C' = EEV' - ProtectedCapital'
RawSurplus = max(0, EEV - ProtectedCapital)
```

The Fee Amount Discovery record states the first relation in its accounting-compatibility section. The current Economic Canon records the second relation. Together they support the following interpretation:

- `C` is the **signed economic headroom** `EEV - ProtectedCapital`;
- `RawSurplus` is the non-negative projection `max(0, C)`;
- Hysteresis must use the signed headroom only after the economic gate has established `C >= 0`;
- a negative `C` must fail closed. It must not be hidden by clamping to zero before the solvency decision.

This is a reconciliation of existing semantics, not a new economic formula or parameter.

The unresolved C1 issue is therefore narrower than “the definition of C is missing”: the semantic mapping is recoverable, but a **production producer that authenticates EEV and every ProtectedCapital component from the same canonical observation has not been demonstrated**.

## 2. Normative economic relations

The current PRE-RICH hysteresis baseline remains:

```text
X(P) = 499P + Fs(P) + Fr(P) + Fc(P)
CR(P) = C / X(P)

Activation:  CR(P) >= KA = 8
Maintenance: CR(Pcurrent) >= KC = 4
Distribution floor: KD = 4
Hysteresis buffer: (KA - KC) × X(P) = 4 × X(P)
```

The exact-integer equivalent comparisons should be used where applicable, rather than floating-point division:

```text
C >= KA × X(P)
C >= KC × X(Pcurrent)
```

These comparisons are valid only after EEV, ProtectedCapital, and X(P) have been derived in the same reference unit and for the same canonical state/observation.

Do not reopen KA/KC/KD, the ticket ladder, or the 500× normal-payout ceiling in this workstream.

## 3. ProtectedCapital: current canonical component map

The current kernel implementation and Economic Canon describe:

```text
ProtectedCapital =
    CrystallizedLiabilities
  + WorstCaseExposure
  + SafetyCapital
  + ReserveProtection
  + LockedJackpot
  + MandatoryFutureCosts
```

The accounting partition certification further separates the asset side (EEV) from the commitment side (ProtectedCapital). Its profile obligations require exhaustive and disjoint classification; algebraic addition alone does not prove that classification.

| Component | Existing representation / candidate source | C1 status |
|---|---|---|
| CrystallizedLiabilities | B1 pending-liability datum; must reconcile to accepted, unresolved winning obligations and exact lifecycle status | Partially observable; completeness and provenance remain open |
| WorstCaseExposure | Derive from the complete unresolved-ticket set and the canonical class prices, using PRE-RICH's 500× maximum payout rule | Derivable if the ticket set is exhaustive and identity/status are authoritative |
| UnresolvedReserve | Sum of unresolved ticket prices; cross-check against the B1 Pool aggregate and ticket count | Accounting representation / reconciliation input; **not a separate ProtectedCapital addend** |
| SafetyCapital | V3 field / projection input | Authoritative source, meaning, and disjointness not demonstrated |
| ReserveProtection | V3 field / projection input | Authoritative source, meaning, and disjointness not demonstrated; must not be confused with UnresolvedReserve |
| LockedJackpot | B1/V3 jackpot state and locked amount | State representation exists; source/value and non-overlap with other PC components require proof |
| MandatoryFutureCosts | Protocol-borne future-cost declarations and reproducible cost evidence | Numerical bounds and complete source mapping remain open |

### 3.1 UnresolvedReserve is not an additional liability

The current canon distinguishes:

- `UnresolvedReserve = Σ unresolved ticket price`;
- `WorstCaseExposure = 500 × Σ unresolved ticket price`.

The first is an accounting representation; the second is the PRE-RICH worst-case protection requirement. Adding both independently to ProtectedCapital would duplicate protection for the same unresolved-ticket population.

`EffectivePool` is a separate immediate-liquidity expression. It is not the Hysteresis numerator C and is not an alternative ProtectedCapital definition.

### 3.2 Historical formula is not the current component map

The 15 September adversarial audit recorded:

```text
C = V - L - E - J - R - M - O
```

and identified a specification conflict when both worst-case exposure and unresolved reserve were subtracted independently at Genesis.

That audit is explicitly marked non-canonical / audit-only. It predates the later ProtectedCapital partition and must not be used as a second equation or mapped one-to-one onto the current V3 fields. In particular, the old symbol `R` must not be assumed to mean the current `ReserveProtection` field.

The later component map and the two-sided accounting partition supersede that ambiguous historical decomposition.

## 4. EEV: existing Preprod evidence and its limits

The repository contains a concrete direct-USDM profile:

`PRE-RICH-EEV-USDM-DIRECT-V1`

The source-set producer:

1. identifies the exact B1 PrizePool address and singleton;
2. looks up the exact `txHash#outputIndex` and rejects a stale/non-live UTxO;
3. verifies the configured direct tUSDM asset identity and physical quantity;
4. converts the quantity with the declared conservative FLOOR rule;
5. records network, source reference, chain tip, observation time, derivation version, and evidence digest.

The qualification workflow checks the source/deployment/Oracle-State bindings and records EV1–EV7 references and hashes. Deployment approval is separate from qualification.

### 4.1 Historical successful approval run

GitHub Actions run [39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679), dated 2026-10-21, completed successfully. It produced a `DEPLOYMENT_APPROVED` result for the direct-USDM Preprod candidate:

- exact B1 Pool UTxO: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`;
- physical tUSDM: `1,000,000,000` atomic units;
- converted value: `100,000` IMMORTAL USDM subunits (1,000 USDM);
- profile: `PRE-RICH-EEV-USDM-DIRECT-V1`;
- source-set ID: `PRE-RICH-EEV-USDM-DIRECT-V1-SOURCE-SET-v0.1:7645d64514b17f025d0ff5f3ba0780cbee88a4331e77a57e7d07cb0862e8da00`.

The run used the separately pinned protocol snapshot `0e5fa575f84e3759655b6d0a3492b2f0b79aa446` from the workflow registered on `main`. The uploaded artifact is a historical approval for that candidate and snapshot; it is not, by itself, a fresh observation for 2026-11-02 or an approval of the current work-branch HEAD. The exact UTxO must be revalidated at admission time.

The current work-branch source-set and approval scripts have since changed from the pinned snapshot. The work-branch source-set adds a fixed allow-list check for the approved tUSDM unit, and the approval path has stronger artifact-integrity checks. No matching successful approval run against the current work-branch HEAD was established in this reconciliation.

### 4.2 What this EEV qualification does not prove

The profile is deliberately narrow: physical tUSDM in one exact Cardano Preprod B1 PrizePool UTxO. It is not a general multi-asset EEV producer, not mainnet evidence, and not evidence that ADA or PRE are liquidatable into USDM.

EV7 references the accounting-partition contract as the EEV boundary statement. It does **not** discharge the profile-level PA1–PA7 obligations for the completeness and disjointness of ProtectedCapital. A successful EV1–EV7 EEV qualification therefore cannot be treated as a ProtectedCapital certification or as a complete C1 certificate.

The workflow's own governance metadata also says that EEV deployment approval does not itself authorize Issue admission; authenticated control state, ProtectedCapital provenance, viability/liquidity evidence, and the authoritative Issue decision remain required.

## 5. Mandatory future costs and X(P)

The canonical cost surface remains:

```text
X(P) = 499P + Fs(P) + Fr(P) + Fc(P)
```

The evidence model makes a critical distinction:

| Class | Meaning | May enter mandatory future cost? |
|---|---|---|
| OBSERVED_EXECUTION_COST | Cost actually measured for one execution | No, not automatically |
| BENCHMARK_COST | Reproducible measurement over declared fixtures | No, not automatically |
| MANDATORY_COST_DECLARATION | Future cost contractually borne by the protocol/profile | Yes, according to the declared bound |
| LOCKED_VALUE | Recoverable or structurally locked value | No, not automatically |
| OPTIONAL_INFRA_COST | Non-mandatory service/infrastructure expense | No, unless the protocol explicitly assumes it |

The benchmark must retain a cost vector:

```text
(TxFee, ScriptExecutionCost, LockedValue, RelayerCompensation, OtherExplicitCost)
```

Only components that the protocol actually bears may contribute to `Fs`, `Fr`, `Fc`, or mandatory OPEX. Cardano MinUTxO/locked ADA is not automatically burned OPEX. An observed transaction fee is not automatically a future protocol obligation.

The benchmark records require action class, adapter/profile/network version, fixture and transaction shape, measurement rule, exact evidence reference, timestamp/slot, units, payer classification, and provenance. A single first-ticket observation is evidence of one execution, not a deterministic worst-case bound. For safety-critical protocol-borne costs, the declared safety envelope must be justified over the admissible transaction-shape space.

The fee benchmark matrix still classifies SALE/MINT, REVEAL_LOSS, REVEAL_WIN, CLAIM, and relevant EXPIRE/operational paths as OPEN — measure. The evidence framework is consolidated; numerical calibration is deployment work. Until a mandatory cost has a defensible bound, it must not be silently set to zero where the protocol has promised to bear it.

### 5.1 Cross-boundary no-double-count requirement

A further reconciliation is required between:

- `ProtectedCapital.MandatoryFutureCosts`, which is an addend of the current ProtectedCapital formula; and
- `Fs(P)`, `Fr(P)`, and `Fc(P)`, which enter the class cost surface `X(P)`.

The current sources do not provide a complete cohort/time-horizon mapping proving whether a given protocol-borne future cost is:
1. an already committed obligation represented in the current state's ProtectedCapital;
2. an incremental per-ticket cost used to assess the proposed class capacity; or
3. both, as an expressly intended conservative buffer.

The evidence packet must classify each cost by action, payer, beneficiary/population, obligation time horizon, and whether it is already represented in `MandatoryFutureCosts`. The same underlying future payment must not be silently duplicated across the PC addend and the X(P) cost surface. Conversely, a genuine incremental cost of a proposed new ticket must not be omitted merely because a related cost for existing tickets is already protected.

No term is to be removed from `ProtectedCapital` or `X(P)` on the basis of this audit. The mapping and any intended conservative overlap require an explicit, versioned profile rule and replayable evidence.

## 6. Producer and implementation boundary

Current implementation facts:

- `src/preRichHysteresis.ts` accepts caller-supplied `capacity` and per-class `capacityCost`; it does not authenticate either value.
- `PRE-RICH/src/PreRichHysteresisBinding.ts` can recompute the exact deterministic controller result, but it relies on those supplied inputs.
- `PRE-RICH/src/PreRichCardanoObservationProjection.ts` derives unresolved reserve/count from the observed unresolved-ticket set and reconciles them with the Pool aggregate. It receives `safetyCapital`, `reserveProtection`, and `mandatoryFutureCosts` as inputs; it does not originate their authority.
- `src/preRichIssueAdmissionBridge.ts` checks the arithmetic ProtectedCapital component sum and binds the provenance reference to the V3 carrier state. Sum equality and a state reference do not prove component exhaustiveness, disjointness, or source authority.
- `PRE-RICH/onchain/PreRichEconomicAdmission.hs` composes admission/gate/viability inputs; it does not turn caller-supplied values into authenticated observations.

Therefore C1 is **semantically reconciled but not producer-closed**.

## 7. Minimum C1 evidence contract

A production C1 packet must bind all fields below to one pre-state and one transition candidate.

### 7.1 Canonical observation envelope

- network and deployment/profile ID;
- exact pre-state V3 carrier reference, state version, state hash, and observation slot/time;
- EEV snapshot reference, source-set ID, asset identity, quantity, unit/decimal conversion, valuation/derivation version, freshness rule, and digest;
- ProtectedCapital profile/version and source reference;
- exact candidate Issue class/price and the same pre-state fingerprint.

### 7.2 ProtectedCapital component evidence

For each of the six canonical PC components, provide:

- a semantic category identifier;
- exact integer amount and reference unit;
- source and verification reference;
- state/observation reference and time;
- derivation version and evidence digest;
- accounting-side classification;
- proof that it is not duplicated in another PC component.

In addition:

- provide the profile PA1–PA7 mapping and completeness argument;
- derive the unresolved-ticket population from an authoritative complete set;
- reproduce `UnresolvedReserve` and `WorstCaseExposure` independently and reconcile the Pool aggregates;
- demonstrate the intended treatment of locked Jackpot value;
- demonstrate that SafetyCapital, ReserveProtection, and MandatoryFutureCosts are not aliases or overlapping representations;
- fail closed on unknown or unclassified material obligations.

A bare arithmetic check `sum(components) == total` is necessary but insufficient.

### 7.3 Capacity derivation

The producer must compute:

```text
C = EEV - ProtectedCapital
RawSurplus = max(0, C)
```

using the exact same state, timestamp/slot, accounting perimeter, and reference unit. It must preserve the signed `C` value for the solvency decision and reject `C < 0` before Hysteresis is called.

No independent producer may substitute B1 Pool balance, `poolUsdmValue`, `EffectivePool`, `RawSurplus` clamped to zero, or an unauthenticated caller field for this calculation.

### 7.4 Cost-surface derivation

For all eight classes, provide an exact integer `X(P)` with:

- canonical base `499P`;
- separately evidenced `Fs`, `Fr`, and `Fc`;
- explicit payer/contract classification per cost;
- benchmark and safety-envelope versions;
- a reproducible declared-shape space;
- evidence hashes and validity/revalidation conditions.

An observed cost must not be promoted automatically to a mandatory future cost. A mandatory cost must not be omitted merely because no transaction has yet measured it.

### 7.5 Deterministic replay

The evidence packet must allow an independent verifier to reproduce:

1. EEV and each PC component;
2. PC total and completeness/disjointness checks;
3. signed `C` and `RawSurplus`;
4. all class-specific `X(P)`;
5. the exact `KA=8/KC=4/KD=4` controller output;
6. equality between the replayed output and the submitted control state;
7. the Issue admission result, with the same observation, B2 state, V3 state, and transaction candidate.

## 8. C1 closure matrix

| Requirement | Current assessment |
|---|---|
| Semantic bridge `C = EEV - ProtectedCapital` | RECOVERED from existing accounting compatibility and RawSurplus semantics |
| Frozen `X(P)` formula and `KA/KC/KD=8/4/4` | CLOSED semantic baseline |
| Direct-USDM EEV observation method | IMPLEMENTED for the narrow Preprod profile |
| Direct-USDM Preprod candidate approval | Historical successful run exists; revalidate exact UTxO and current snapshot before reuse |
| General multi-asset EEV perimeter/horizon | OPEN deployment/profile parameters |
| Crystallized-liability completeness | PARTIAL / profile evidence required |
| Unresolved exposure from complete ticket set | DERIVATION exists; authoritative population completeness required |
| No duplicate UnresolvedReserve addend | CLOSED semantic distinction |
| SafetyCapital source and bound | OPEN / UNPROVEN |
| ReserveProtection source and disjointness | OPEN / UNPROVEN |
| LockedJackpot evidence and accounting treatment | PARTIAL / profile conformance required |
| MandatoryFutureCosts source, safety bounds, and cross-boundary mapping to Fs/Fr/Fc | OPEN / numerical calibration and no-double-count evidence required |
| PA1–PA7 ProtectedCapital partition for PRE-RICH | Candidate map committed; certification OPEN (PA1 partial, PA2 open, PA3 unproven, PA4 partial, PA5 open, PA6 partial, PA7 partial/open) |
| ProtectedCapital.MandatoryFutureCosts vs X(P) Fs/Fr/Fc overlap mapping | OPEN / NOT PROVEN |
| Producer binds all inputs to one observation and exact V3/B2 state | OPEN |
| Hysteresis result independently replayable at Issue | OPEN |

## 9. PA1–PA7 profile mapping

The follow-on audit [PRE-RICH-PA1-PA7-PROTECTED-CAPITAL-PROFILE-MAPPING-2026-11-02.md](PRE-RICH-PA1-PA7-PROTECTED-CAPITAL-PROFILE-MAPPING-2026-11-02.md) now instantiates the candidate PRE-RICH R7 asset/commitment cells and records evidence status for every PA artifact.

Current verdict: PA1 candidate map PARTIAL; PA2 OPEN; PA3 UNPROVEN; PA4 PARTIAL; PA5 OPEN/PARTIAL; PA6 PARTIAL/not discharged; PA7 PARTIAL/OPEN. The document also corrects an old audit finding: the current branch rejects unknown/noncanonical classes, but class validation does not prove that the complete economic obligation population was observed.

A further operational finding is material to C1: the B1 `TicketIssued` branch increments unresolved reserve/count while keeping `ppTotalLiquidity` unchanged. Do not assume a new ticket purchase increases B1 Pool EEV; trace and prove the actual settlement/funding destination separately.

## 10. Next implementation slice — after evidence qualification

Do not change the Hysteresis formula or economic constants. The first implementation should be the **evidence producer and conformance tests**, not a new controller:

1. use the committed PA1–PA7 candidate map to prove disjointness/completeness and source authority;
2. provide authenticated sources for the currently caller-supplied PC components and an exhaustive inventory of ticket/Jackpot/CAR/treasury obligations;
3. revalidate the current direct-USDM Preprod source and bind it to the exact candidate state; trace TicketIssued settlement separately because B1 keeps ppTotalLiquidity unchanged on that action;
4. build the exact-integer C and X(P) derivation with same-snapshot/unit checks and an explicit PC.MandatoryFutureCosts ↔ Fs/Fr/Fc cohort/horizon reconciliation;
5. add positive/negative evidence-replay tests, including missing, stale, overlapping, omitted, duplicate, negative, and unit-mismatch cases;
6. only then bind the replayed result to B2 transition and Issue admission.

No implementation, test, workflow, branch, or on-chain state was changed by this reconciliation.

## 11. Sources

### GitHub — current work-branch sources

- [PRE-RICH lifecycle / B2 / Issue composition audit](PRE-RICH-LIFECYCLE-COMPOSITION-AUDIT-2026-11-02.md)
- [EEV oracle and valuation contract](../02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md)
- [Accounting partition and conservation certification](../02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md)
- [Direct-USDM observer](../../Adapter/CARDANO/observation/DirectUsdmEev.ts)
- [Direct-USDM source-set producer](../../audit/cardano-integration/preprod-direct-usdm-source-set.mjs)
- [Direct-USDM qualification producer](../../audit/cardano-integration/preprod-direct-usdm-qualification.mjs)
- [Hysteresis controller](../../src/preRichHysteresis.ts)
- [Cardano V3 observation projection](../../PRE-RICH/src/PreRichCardanoObservationProjection.ts)
- [Issue admission bridge](../../src/preRichIssueAdmissionBridge.ts)

### Notion — semantic and evidence decisions

- [09 — Definitive Decision Register](https://app.notion.com/p/3d9c4454d6d5811e8bece49c16cf2c9d)
- [IMMORTAL — Economic Canon & Parameter Boundary Register](https://app.notion.com/p/3e2c4454d6d581e39ad6e764d162dbd7)
- [13 — Fee Amount Discovery](https://app.notion.com/p/3e0c4454d6d581aabf29f21e688b4fb3)
- [14 — Fee Discovery Evidence Model](https://app.notion.com/p/3e0c4454d6d5811ab0d3fe7e93f18aab)
- [15 — Fee Benchmark Matrix](https://app.notion.com/p/3e0c4454d6d5812a951fd812d37ae11e)
- [B4 ProtectedCapital / B5 Gate Surgical Conformance Pass](https://app.notion.com/p/3e2c4454d6d581ceae8ee6bff128786d)
- [EHSE — EEV Asset Perimeter & Liquidation Horizon](https://app.notion.com/p/3d9c4454d6d581179b5afd5bc6a77d20)
- [Final Economic Model Audit — 15 September 2026](https://app.notion.com/p/3dcc4454d6d5818bb53cfd3962efd988) — historical/non-canonical; retained only to explain the superseded decomposition.

**Disposition:** C1's semantic relation is recoverable. C1 is not implementation-ready until the EEV source is freshly revalidated and the PRE-RICH ProtectedCapital profile proves PA1–PA7, especially source authority, exhaustiveness, disjointness, and same-state binding.
