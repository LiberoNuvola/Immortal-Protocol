# Agent A — existing quiescence witness reachability audit

**Date:** 2026-11-08  
**Branch:** `work/immortal-green-closure`  
**Exact source HEAD inspected:** `362ee79e00c89995064037c9556906896b1d8380`  
**Classification:** SOURCE-BASED R1/QNE AUDIT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Owner:** Agent A — PRE-RICH economics, EEV and admission policy  
**Scope:** Existing `PreRichLifecycleTransition` candidate against PRE-RICH Preprod S0, R1 T-MARGIN/QNE and R8/NV4. No changes to V3, Reveal, 500×, EEV, action ABI, deployment or admission.

## 1. Executive disposition

The repository already contains a genuine pure lifecycle transition and a QNE predicate:

- `ACTIVE → QUIESCENT` through `EnterQuiescent`;
- `QUIESCENT → QUIESCENT` through `MaintainQuiescent`, advancing a nonce;
- a per-successor check that the post-state buffer `EEV − ProtectedCapital` is at least the pre-state buffer, while representation and safety remain true.

This is useful existing machinery. It is **not yet a usable R1 witness for the declared PRE-RICH Preprod initial state S0**.

Three independent gaps prevent that promotion:

1. **Reachability:** the initial regime is Genesis. The lifecycle module accepts actions only from Active or Quiescent. The inspected Genesis carrier implements only PRE_GENESIS → GENESIS and has no Genesis → Active/Quiescent transition.
2. **Execution boundary:** the lifecycle module is a pure Haskell transition/predicate. The current `PreRichEconomicAdmission` accepts only `V3Action` and does not consume a lifecycle action or lifecycle certificate. The Genesis carrier does not invoke the lifecycle module.
3. **Ω authority:** `qneAcrossOmega` checks a non-empty list supplied by its caller. It does not construct, authenticate, or prove completeness of the deployment's authoritative Ω. Each witness carries EEV, ProtectedCapital and two booleans, not an independently verified complete successor commitment.

**Conclusion:** the quiescence/QNE module is a candidate building block, not an R1/Kc certificate and not a shortcut around the S0 Issue erosion finding. This does not prove `K* = ∅`; it proves only that the existing lifecycle module cannot presently discharge the actual S0 QNE obligation.

## 2. Exact source map

The following blobs were fetched from the branch at the inspected HEAD:

| Source | Blob SHA | Relevant result |
|---|---|---|
| `PRE-RICH/onchain/PreRichLifecycleTransition.hs` | `edae4c21dc98cb07791c83337d5df49bad9a01e5` | Defines Active/Quiescent transition and list-based QNE predicate |
| `plutus/test/PreRichLifecycleTransitionTest.hs` | `1b2f4e104544003eaee9c08dd18ca8f8e46903f8` | Covers lifecycle transition, nonce, non-empty witness list, adverse EEV and representation loss |
| `PRE-RICH/onchain/PreRichRegimeState.hs` | `6d58607cb4a853b1a0a16e180552140d9219704e` | Regime enum includes PreGenesis, Genesis, Active, Quiescent; pure edge is PRE_GENESIS → GENESIS only |
| `PRE-RICH/onchain/GenesisRegimeCarrier.hs` | `276b09deace4475853320356375a12f9ee5f1d60` | On-chain action set contains only `ActivateGenesis`; its output predicate is PRE_GENESIS → GENESIS |
| `plutus/test/GenesisRegimeCarrierTest.hs` | `5315587992fb07a76785b924c194286427fc9575` | Tests Genesis admission and replay rejection; no Active/Quiescent reachability case |
| `PRE-RICH/src/PreRichPreprodDeploymentProfile.ts` | `18f5d1798692f7472fec0bf99fb447f6db586588` | S0 starts with class 0 active/saleable, zero tickets and zero existing obligations |
| `PRE-RICH/onchain/PreRichEconomicAdmission.hs` | `a654587114beec997d97d59810d1fb648facf365` | Admission accepts a V3 action; no lifecycle action/certificate input |
| `docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` | `32b54c73f6676467d197e8f6635155e4752cc17e` | R1 VC1–VC6; T-MARGIN requires a witness available at every represented state |
| `docs/02-certification/NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md` | `3befe38974c963d8701a93bd21131999973f3dbc` | R8/NV4 requires QNE or an explicit T-EROSION disposition |
| `docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md` | `1543ee6b0de15f491eddb872fb6f7d6df7a5f7f3` | Ω must be authoritative or soundly over-approximated; caller narrowing is unsound |

This is a source inspection. No test suite or CI run is claimed by this audit.

## 3. Reachability from the actual initial regime

### 3.1 What the pure lifecycle module permits

`lifecycleTransition` has exactly two successful branches:

- `(Active, EnterQuiescent)` returns Quiescent and increments `plsTransitionNonce`;
- `(Quiescent, MaintainQuiescent)` returns Quiescent and increments `plsTransitionNonce`.

All other regime/action pairs return `Nothing`. In particular, Genesis has no lifecycle action in this module.

### 3.2 What the deployment's regime carrier permits

`PreRichRegimeState` contains four constructors: PreGenesis, Genesis, Active and Quiescent. However, `preGenesisToGenesis` only accepts PreGenesis and a passing Genesis observation.

The inspected on-chain `GenesisRegimeCarrier` likewise exposes only `ActivateGenesis`; its output check requires the before tag to be PRE_GENESIS and the after tag to be GENESIS, with nonce/version increment. It has no action for Genesis → Active, Genesis → Quiescent, Active → Quiescent or Quiescent maintenance.

The fact that an enum includes Active/Quiescent does not establish an on-chain path into those states.

### 3.3 Consequence for S0

The current Preprod profile initializes the V3/economic deployment with no existing tickets, liabilities or protected components and class 0 saleable. The separate regime helper and carrier define Genesis as the post-Genesis state.

The available quiescence witness is therefore not reachable from the inspected S0 execution boundary. It cannot be selected as `Wit(S0)` merely because `activeLifecycleState` and `quiescentLifecycleState` constructors exist as pure helpers.

A future profile could define a different, explicitly admitted initial joint state, but that would require a versioned profile and a fresh S0/NV1–NV5 certificate. It cannot be inferred from the present profile.

## 4. The QNE predicate is useful but not a proof of Ω

### 4.1 What it actually checks

For each supplied `LifecycleOmegaWitness`, `qneWitnessHolds` checks:

- non-negative successor EEV;
- non-negative successor ProtectedCapital;
- `postEEV − postProtectedCapital >= preEEV − preProtectedCapital`;
- representation preserved;
- `lowSafe = True`.

`qneAcrossOmega` additionally requires that a lifecycle action is available, pre-values are non-negative, the supplied list is non-empty, and every listed witness passes.

This is directionally consistent with the T-MARGIN QNE condition.

### 4.2 What it does not establish

The function receives `[LifecycleOmegaWitness]` as an ordinary argument. It does not establish that:

- the list is the authoritative environment envelope;
- it is a sound over-approximation of every economically material successor;
- an actor cannot omit, reorder or substitute witness classes;
- the EEV/ProtectedCapital values are bound to one authenticated ledger cut and deployment version;
- the representation/safety booleans were derived by a canonical verifier;
- each item corresponds to the exact lifecycle action and complete post-state.

This matches the module's own comment: the caller remains responsible for proving the witness list soundly over-approximates authoritative deployment Ω. The normative Ω contract makes that a separate deployment obligation. Non-empty is necessary, not sufficient.

### 4.3 QNE is weaker than a list of favourable observations

A safe implementation cannot treat the supplied list as evidence merely because all entries pass. Ω is not a sample of observed events or a probability distribution. It must contain every economically material permitted event or a sound over-approximation, including adverse valuation changes, delays, repeated/correlated events, concurrency, liquidity shocks and oracle failures in the declared perimeter.

If any permitted event lowers the buffer, the proposed lifecycle action is not QNE. If completeness cannot be proved, the deployment must enlarge Ω, fail closed, or expressly contract its guarantee perimeter under the normative contract. It may not silently omit the adverse case.

## 5. Existing test coverage and one missing isolating case

The lifecycle test source checks:

- Active → Quiescent and nonce increment;
- Quiescent maintenance and nonce increment;
- invalid action/regime pairs;
- a non-eroding witness;
- an adverse EEV witness;
- representation loss;
- rejection of an empty Ω list;
- rejection when a supplied list contains an eroding witness.

This is useful unit coverage. One important assertion is not isolated by the current adverse-EEV fixture:

- pre-buffer = 110 − 100 = 10;
- current adverse fixture has post-buffer = 90 − 100 = −10 and `lowSafe = False`.

That fixture fails both non-erosion and safety. It does not independently demonstrate that the QNE inequality rejects an **eroding but still solvent/safe** successor.

A focused regression candidate (not added or run) is:

```haskell
safeButEroding =
  LifecycleOmegaWitness
    { lowPostEEV = 105
    , lowPostProtectedCapital = 100
    , lowRepresentationPreserved = True
    , lowSafe = True
    }
```

With pre-EEV = 110 and pre-ProtectedCapital = 100, the successor buffer is +5 versus +10 before. It remains non-negative and is marked safe, but it is eroding; `qneWitnessHolds` and `qneAcrossOmega` must reject it solely on the QNE comparison.

A second useful boundary regression would construct a Genesis lifecycle state and assert that neither `EnterQuiescent` nor `MaintainQuiescent` is currently available. That would make the S0 reachability gap explicit in the executable test suite. These are proposed tests only; the Agent A documentation slot does not authorize editing the Plutus test path.

## 6. Joint-state obligation if this candidate is ever promoted

A valid R1 certificate cannot reason over the lifecycle substate while ignoring the economics it is supposed to protect. The concrete system must define one joint state containing, at minimum, the canonical PRE-RICH economic state, lifecycle regime/nonce, exact B1 Pool state, obligation representation, and the deployment's authenticated EEV/ProtectedCapital inputs.

A candidate lifecycle witness must then demonstrate, for every represented joint state:

1. the conservative action is actually available and permissionlessly executable;
2. the action is accepted by the deployed on-chain path, not merely by a pure Haskell predicate;
3. its transition preserves the exact economic obligations and representation;
4. all authoritative Ω successors satisfy the QNE margin inequality and remain Safe;
5. the complete successor envelope is authenticated or soundly over-approximated;
6. every action/state/proof is bound to the same deployment and ledger cut, with replay and concurrency protections;
7. terminal states retain a valid witness or are explicitly outside the certified region with a sound reachability argument.

A separate lifecycle UTxO/carrier could in principle be part of a joint transaction system, but it would have to be enforced atomically with the relevant economic state. It cannot become an off-chain escape hatch around the V3/EconomicAdmission boundary. This audit does not select a carrier design or authorize an ABI change.

## 7. Disposition and next gates

| Question | Finding |
|---|---|
| Does a pure Active → Quiescent transition exist? | Yes |
| Does explicit Quiescent maintenance exist? | Yes |
| Does the QNE predicate compare pre/post margin rather than assume constant EEV? | Yes |
| Is the QNE module itself proof of authoritative Ω completeness? | No |
| Is Active/Quiescent reachable from the inspected Preprod Genesis carrier? | Not in the inspected source path |
| Does current PreRichEconomicAdmission accept the lifecycle action/certificate? | No |
| Is the current S0 QNE witness discharged? | No |
| Does this prove T-EROSION globally or `K* = ∅`? | No |

Recommended sequence, without changing current V1 policy:

1. Treat current lifecycle QNE as a reusable local predicate, not as the deployment R1 certificate.
2. Specify the exact joint state and a reachable, permissionless lifecycle action for the real S0 profile, if that route is intended.
3. Produce the full authoritative Ω/perimeter evidence and bind each successor to the action/state/profile.
4. Add the isolating safe-but-eroding regression and Genesis reachability regression under a separately authorized test slot.
5. Re-run the S0/QNE arithmetic: the existing Issue-only V3 action still erodes the margin by exactly 500 RU. The lifecycle candidate does not change this result until the complete action and certificate path is established.
6. Obtain independent Agent B source/on-chain review before any implementation; preserve V3, Reveal and 500× unless a separately governed profile decision explicitly changes them.

**Final disposition:** the repository has a real lifecycle/QNE building block, but no reachable, Ω-complete, transaction-bound QNE witness for the current S0. R1/Kc/Ω remains OPEN; Issue #37 remains BLOCKED. No production source, test, workflow, parameter, datum/redeemer ABI, V3, Reveal, wallet, transaction or ledger state was changed or executed.
