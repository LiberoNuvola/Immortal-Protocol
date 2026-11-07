# Agent B — R1 RiskMode and Regime-Control Source Audit

**Date:** 2026-11-07  
**Branch:** `work/immortal-green-closure`  
**Source HEAD audited:** `9e137d18e63b1459b8c97e794731c5e15c45374b`  
**Status:** READ-ONLY SOURCE AUDIT / NO PRODUCTION INTEGRATION  
**Reviewer role:** Agent B — IMMORTAL kernel, V3, Plutus and Cardano boundary  
**Scope:** determine whether a trajectory/state-dependent risk-mode selector and dynamic intensity consumer already exist in the production admission path.

## 1. Executive result

The repository contains a strong, typed architectural trace of the model the project owner recalled:

- `RiskProtectionBridge.RiskMode` explicitly declares `DeterministicWorstCaseOnly`, `StatisticalOnly`, and `DeterministicAndStatistical`.
- Each `RiskAssessment` is bound to a profile version and a trajectory ID, with explicit evidence status and separate optional deterministic/statistical measurements.
- The canonical architecture and the typed bridge therefore preserve a place for selecting risk analysis by trajectory, rather than assuming one universal mode for every transition.

However, the executable boundary is deliberately incomplete:

- `deriveProtectionRequirement` accepts **only** `DeterministicWorstCaseOnly`, and requires the reported deterministic exposure to equal the projected worst-case exposure exactly.
- `StatisticalOnly` and `DeterministicAndStatistical` both return `UnsupportedRiskMode`.
- The resulting `ProtectionRequirement` contains only profile version, trajectory ID and deterministic worst-case amount.
- `PreRichEconomicAdmission` does not import or invoke `RiskProtectionBridge`; it constructs the existing `EconomicGateInput` directly.
- `EconomicGate` has no risk-mode, statistical-reserve, `α_t`, dynamic-budget or risk-envelope input.

**Conclusion:** the risk-mode switch is present as a typed contract/scaffold, but the state/trajectory-to-mode selector and statistical/combined implementations are not operationally integrated. The current production admission path remains deterministic WCE + immediate liquidity + evidence + certified-`Ω` checks.

This is consistent with fail-closed design. It is not a reason to add a statistical addend or alter the 500× floor.

## 2. Exact typed risk-mode bridge

Source: `IMMORTAL/kernel/RiskProtectionBridge.hs`  
Blob: `461df807e7da3a421b171b93e52f3f03e82e007c`

The module declares:

```haskell
data RiskMode
  = DeterministicWorstCaseOnly
  | StatisticalOnly
  | DeterministicAndStatistical
```

and a trajectory-bound assessment:

```haskell
data RiskAssessment = RiskAssessment
  { raProfileVersion :: Integer
  , raTrajectoryId :: Integer
  , raMode :: RiskMode
  , raEvidenceStatus :: EvidenceStatus
  , raDeterministicExposure :: Maybe Integer
  , raStatisticalReserve :: Maybe Integer
  , raCombinationRuleVersion :: Maybe Integer
  }
```

The exact current behavior in `deriveProtectionRequirement` is:

| Mode | Current behavior |
|---|---|
| `DeterministicWorstCaseOnly` | Accepted only with verified evidence, matching profile version and trajectory, and deterministic amount exactly equal to the projected WCE. A statistical amount or combination-rule version is rejected. |
| `StatisticalOnly` | `Left UnsupportedRiskMode` |
| `DeterministicAndStatistical` | `Left UnsupportedRiskMode` |

The returned `ProtectionRequirement` deliberately has only:
- `prProfileVersion`;
- `prTrajectoryId`;
- `prDeterministicWorstCase`.

The module header explicitly says it supports only the existing deterministic PRE-RICH path and is **not yet wired into `PreRichEconomicAdmission`**.

### Packaging and test evidence

- `plutus/pre-rich-plutus.cabal` exposes `RiskProtectionBridge`.
- The same Cabal file defines `risk-protection-bridge-tests` using `plutus/test/RiskProtectionBridgeTest.hs`.
- That test source includes positive deterministic-only coverage and negative cases for statistical-only, combined mode, undeclared statistical output, and undeclared combination rule.

This audit inspected the source and test definitions only. It did not execute Cabal or CI, so no test-pass claim is made here.

## 3. Admission/Gate integration check

### 3.1 `PreRichEconomicAdmission.hs`

Source: `PRE-RICH/onchain/PreRichEconomicAdmission.hs`  
Blob: `a654587114beec997d97d59810d1fb648facf365`

The admission module imports `EconomicGateInput` and `executionAdmissible` from `EconomicGate`; it does not import `RiskProtectionBridge`.

It constructs the Gate input from:
- authoritative truth verified;
- EEV freshness;
- obligations completeness;
- candidate EEV;
- available executable liquidity;
- required immediate liquidity.

It then projects the candidate V3 state, checks universal solvency and the supplied all-`Ω)-successors-certified boolean. No `RiskAssessment`, mode-selection result, `raStatisticalReserve`, `α_t), `B_t), or risk-envelope value is carried into this function.

### 3.2 `EconomicGate.hs`

Source: `IMMORTAL/kernel/EconomicGate.hs`  
Blob: `c9682c2c1c3b522280e2abe6fe2b91a86fec1287`

The Gate enforces verified/fresh/complete evidence, non-negative and sufficient immediate liquidity, and `Kernel.solvencyInvariant`. Viability separately requires the safe post-state and the all-`Ω)-successors-in-certified-kernel condition.

No statistical or dynamic-intensity selector exists in this Gate input.

### 3.3 Deterministic economic kernel

Source: `IMMORTAL/kernel/EconomicKernel.hs`  
Blob: `229972487522da6392ff29aa97581096ebc0ff15`

The current PRE-RICH kernel:
- computes `worstCaseExposure = epMaxNormalPayoutMultiplier × totalClassExposure`;
- derives `protectedCapital` from crystallized liabilities, WCE, SafetyCapital, ReserveProtection, locked Jackpot and mandatory future costs;
- defines `rawSurplus = max(0, EEV - ProtectedCapital)`.

For PRE-RICH V1 the profile sets `epMaxNormalPayoutMultiplier = 500`. The transition module remains Issue/Reveal/Claim/Expire; no statistical reserve or dynamic intensity computation is introduced by these transitions.

## 4. Existing state-dependent controllers — distinct responsibilities

The branch does contain real control/state mechanisms. They must not be conflated with the missing statistical risk-mode selector.

### 4.1 PRE-RICH class hysteresis

Sources:
- `src/preRichHysteresis.ts` — blob `52f154da25c181d92f4d46d2ba4e6bc73c25d92a`
- `PRE-RICH/src/PreRichHysteresisBinding.ts` — blob `594ec3f956046a4dfd77415e0c26999b3301433f`
- `PRE-RICH/onchain/PreRichControlCarrier.hs` — blob `ce5a73dd29894367f031924e5a282935d8d3d66f`

This controller already changes the active **ticket class** according to exact-integer capacity and the canonical PRE-RICH application thresholds:
- `KA = 8` activation;
- `KC = 4` maintenance;
- `KD = 4` post-distribution floor.

It can ACTIVATE, UPGRADE, RETAIN, CONTRACT or HALT. The binding recomputes the expected state and rejects an observed V3/Cardano class state that differs.

This is not the D3 C0–C3 exposure-intensity controller and does not calculate `B_t = α_t × S_res`, AWRA candidate budgets or statistical mode selection.

The on-chain `PreRichControlCarrier` is an authority-signed state carrier for activation/contraction with monotonic class-history constraints. Its validator checks the supplied state transition and signatures; the capacity/controller recomputation is represented separately by the TypeScript binding. The carrier is not the statistical risk engine.

### 4.2 PRE-RICH lifecycle quiescence and QNE

Source: `PRE-RICH/onchain/PreRichLifecycleTransition.hs`  
Blob: `edae4c21dc98cb07791c83337d5df49bad9a01e5`

This module provides a distinct application lifecycle boundary:
- `ACTIVE → QUIESCENT` via `EnterQuiescent`;
- `QUIESCENT → QUIESCENT` via `MaintainQuiescent`, advancing a lifecycle nonce.

It intentionally does not modify any V3 economic field. Its `qneAcrossOmega` predicate requires an available lifecycle action, a non-empty explicit `Ω)-witness list, and a non-eroding safe/representation-preserving result for every supplied witness. The caller remains responsible for proving that the witness set soundly over-approximates authoritative deployment `Ω).

The corresponding test source includes rejection of an adverse EEV shock, lost representation, an empty `Ω) list and any list containing an eroding successor. This is a useful quiescence/QNE mechanism, but it is not `RiskMode` selection and does not implement D3's C0–C3 controller.

### 4.3 Genesis regime carrier

Sources:
- `PRE-RICH/onchain/PreRichRegimeState.hs` — blob `6d58607cb4a853b1a0a16e180552140d9219704e`
- `PRE-RICH/onchain/GenesisRegimeCarrier.hs` — blob `276b09deace4475853320356375a12f9ee5f1d60`
- `PRE-RICH/docs/GENESIS-REGIME-CARRIER-DESIGN-v0.1.md`

The application enum contains `PRE_GENESIS`, `GENESIS`, `ACTIVE`, and `QUIESCENT`, but the Cardano carrier validator currently implements only `ActivateGenesis`: `PRE_GENESIS → GENESIS`. The separate lifecycle module described above represents `ACTIVE → QUIESCENT); the Genesis carrier does not itself implement a four-state risk-mode machine.

## 5. AWRA and D3 dynamic intensity boundary

The two AWRA modules remain explicitly reference-only:

- `PreRichAwraReference.ts` (blob `add70d19f36404caa6ad63285fa3144fbe0fda24`) restores probability-budget transformations and candidate evaluation; it requires caller-supplied donor, admissibility, viability and preference functions.
- `PreRichAwraDynamicReference.ts` (blob `aa3c717e1e9680b74b75cddc43b04aa3bc97a48a`) restores the v36 risk-envelope relation and observed v37 budget fit; its own header states the v37–v39 selector source is unavailable.

Neither module supplies a canonical `α_t), an authorized state-to-mode resolver, or a production connection to the Plutus Economic Gate.

The D3 C0–C3/`S_res`/`α_t`/`RiskEnvelope` design remains the separate, non-normative Arb Agent design recovered from Library. It must not be relabelled as the existing PRE-RICH ticket-class hysteresis or the lifecycle quiescence implementation.

## 6. Resolution of the owner’s remembered “switch”

The code now permits a more exact answer:

- **Yes — the remembered risk-mode switch has a concrete typed footprint:** `RiskMode` has three explicit modes and `RiskAssessment` binds the selected mode to a profile version and trajectory ID.
- **No — it is not yet a functioning state-dependent selector:** no current module derives `raMode` from protocol regime/trajectory conditions; the bridge receives the mode as input.
- **No — StatisticalOnly and combined mode are not implemented:** both fail closed in the bridge.
- **No — dynamic intensity is not wired:** there is no production flow from `S_res` through `α_t) and `RiskEnvelope` into Gate/Admission.
- **Yes — adjacent state controllers exist:** ticket-class hysteresis is implemented at application level, while ACTIVE→QUIESCENT and QNE are represented in a separate lifecycle module. Neither chooses the statistical risk mode.

The phrase “depending on protocol state” should therefore be captured as a required **trajectory/state-to-risk-mode selection policy**, not inferred from the mere existence of the enum.

## 7. Contract still required before implementation

The specification authority must define, at minimum:

1. the authoritative state/trajectory classifier and which facts distinguish the supported risk regimes;
2. whether the risk mode is deterministic-only, a statistical supplement to the deterministic floor, or a governed combined assessment for each trajectory;
3. the hard-floor invariant that remains active in every mode;
4. the meaning, source and dependence assumptions of the statistical reserve, including `Z), horizon, mixed-class treatment, confidence, freshness and precision;
5. whether a combination rule is required and, if so, its version and non-double-counting proof;
6. how the risk result becomes a typed `ProtectionRequirement` and how that requirement feeds `PreRichEconomicAdmission`/Gate;
7. how the separate AWRA intensity output (`S_res`, `α_t), `B_t), `RiskEnvelope`) relates to, but does not weaken, the protection requirement;
8. how PRE-RICH ticket class hysteresis, application lifecycle quiescence and any future D3 regime controller remain distinct and evidence-bound.

A naming/semantic decision is necessary for `StatisticalOnly`: under the recovered two-layer invariant, statistical analysis cannot mean permission to discard the deterministic hard floor. It would need to mean a narrowly scoped statistical assessment for a trajectory while the hard floor remains separately enforced, or it must remain unsupported.

## 8. Agent disposition

| Front | Disposition |
|---|---|
| Typed RiskMode scaffold | Present and exposed; deterministic-only path implemented |
| Statistical-only bridge behavior | Explicitly unsupported / fail-closed |
| Combined bridge behavior | Explicitly unsupported / fail-closed |
| Mode resolver from protocol state/trajectory | Not found |
| RiskProtectionBridge → PreRichEconomicAdmission connection | Not implemented |
| α / dynamic budget / RiskEnvelope → Gate connection | Not implemented |
| PRE-RICH ticket-class hysteresis | Present; separate from risk-mode selection |
| ACTIVE → QUIESCENT lifecycle / QNE | Present as separate lifecycle module |
| Genesis Cardano carrier | PRE_GENESIS → GENESIS only |
| D3 C0–C3 Arb Agent controller | Recovered design only; non-normative and separate application |

**Next assignment — Agent A:** prepare the normative state/trajectory-to-risk-mode contract proposal and exact typed interface mapping, with no chosen thresholds, Z, α, combination rule or policy preference unless already authorized by a canonical decision.

**Next assignment — Agent B:** after that contract exists, review whether the deterministic floor remains invariant across each selected mode and whether the RiskProtectionBridge can be integrated into admission without creating a parallel authority or changing V3/Reveal semantics.

**Change control:** this was a read-only audit. No code, tests, CI, workflows, certificates, wallet signatures, transactions, deployment or ledger state were changed or executed.
