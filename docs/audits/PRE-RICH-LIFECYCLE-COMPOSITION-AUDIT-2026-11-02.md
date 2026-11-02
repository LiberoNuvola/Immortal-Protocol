# PRE-RICH Lifecycle / B2 Control / Issue Composition Audit

**Date:** 2026-11-02  
**Branch:** `work/immortal-green-closure`  
**Audited HEAD:** `061b871e3a090bbacbb4dac86a739ffc31f2e9ea`  
**Classification:** READ-ONLY RECONCILIATION / DESIGN CONTRACT — NOT IMPLEMENTED, NOT CERTIFIED  
**Scope:** PRE-RICH application control and Issue admission only. No IMMORTAL universal-kernel change. No V3 or Reveal semantic change.

## 1. Executive finding

The repository already contains the PRE-RICH hysteresis policy, a deterministic application controller, a B2 authenticated class-control carrier, a DApp Issue path that requires B2 binding, and a separate lifecycle transition model.

These elements are **partially composed in the application path**, but they are not yet one independently enforced on-chain transition contract.

The important correction to the earlier audit is that the normal DApp entry point does require B2:

- `mintSerialNFTWithAuthoritativeAdmission` forces `requireB2ControlBinding: true`;
- the Issue builder resolves exactly one configured B2 singleton, decodes its datum, compares its current/highest classes to the Issue evidence, and checks the requested class against the observed current class;
- it passes the exact B2 reference to the authoritative provider and includes the B2 UTxO in `.readFrom(...)`.

However, the Plutus scripts inspected do not independently decode or validate that B2 reference input during Issue. The DApp and signed off-chain authority path check it; the on-chain Issue validators do not currently make the reference itself a mandatory, state-checked input.

Separately, the lifecycle `ACTIVE → QUIESCENT` exists as a pure transition model, but the deployed regime carrier and the Issue decision do not consume it. Thus QUIESCENT is not yet an on-chain Issue prohibition.

**Conclusion:** recover and connect the existing semantics; do not invent a replacement controller or alter economic constants. The immediate work is an Issue-specific enforcement contract plus a lifecycle/regime binding. This application-level closure does not by itself discharge universal C6/QNE.

## 2. Existing semantic sources

### 2.1 Hysteresis policy and controller

Sources:

- [`src/preRichHysteresis.ts`](../../src/preRichHysteresis.ts)
- [`PRE-RICH/src/PreRichHysteresisBinding.ts`](../../PRE-RICH/src/PreRichHysteresisBinding.ts)
- [`PRE-RICH/docs/ECONOMIC-ALGORITHM.md`](../../PRE-RICH/docs/ECONOMIC-ALGORITHM.md)

The controller implements the already-closed application thresholds:

- `KA = 8` — activation;
- `KC = 4` — maintenance;
- `KD = 4` — post-distribution floor.

Its outputs are `ACTIVATE`, `UPGRADE`, `RETAIN`, `CONTRACT` and `HALT`. It preserves `HighestClassEverActivated` monotonically and contracts directly to the highest lower class that remains maintainable.

`PreRichHysteresisBinding.ts` provides `derivePreRichControl` and `assertPreRichControlMatches`. The latter recomputes the expected controller result and fails closed if the observed class-control state differs. Its conformance test exercises exact integer examples: with `C=320` and a class cost of `40`, activation occurs at the exact `8×X(P)` boundary; with `C=80`, a class costing `40` is contracted and a class costing `20` is retained at the exact `4×X(P)` maintenance boundary. These are synthetic controller fixtures, not authenticated Preprod capacity observations.

**The normative hysteresis formula was already recovered; it must not be reinvented.** The Notion Economic Decision Register and the 14 September Hysteresis Reconciliation record the following closed semantic contract:

```text
X(P) = 499P + Fs(P) + Fr(P) + Fc(P)
CR(P) = C / X(P)

Activation: CR(P) >= KA = 8
Maintenance: CR(Pcurrent) >= KC = 4
Hysteresis buffer: B(P) = (KA - KC) × X(P) = 4 × X(P)
Distribution floor: KD = 4
```

`Fs`, `Fr` and `Fc` enter `X(P)` only when they are genuinely mandatory future protocol costs: settlement/issue, reveal when protocol-paid, and claim when protocol-paid. Future mandatory OPEX is included only when it is an actual protocol commitment. The semantic formula and inclusion rule are CLOSED; reproducible implementation benchmarks for the actual `Fs/Fr/Fc` and mandatory OPEX remain open. The bare-case values `Activation=3992P` and `Maintenance=1996P` apply only when the additional cost terms are zero/absent.

The older candidate ranges `KA ∈ {6,7,8}` and `KC ∈ {4,5}` are historical research results and were superseded by the Definitive Decision Register: `KA=8, KC=4, KD=4` is the frozen normative baseline. They must not be reopened absent new evidence of incompatibility.

**Input/provenance boundary still open:** `PreRichHysteresisBinding` accepts `capacity: bigint` and exact per-class `capacityCost: bigint` from its caller; it does not derive them. The canonical meaning of the ratio and the formula for `X(P)` are available, but this audit has not identified an authoritative production derivation that binds the actual numerator `C` to the exact current economic observation, nor a complete production derivation/benchmark of the mandatory `Fs/Fr/Fc` values. The historical Genesis example `C=4,000` is an illustrative bare-case bound, not a general live-capacity oracle. Do not silently substitute EEV, EffectivePool, RawSurplus or another field for `C`; the profile must identify and authenticate the exact numerator under the approved economic model.

Historical semantic sources: [09 — Definitive Decision Register](https://app.notion.com/p/3d9c4454d6d5811e8bece49c16cf2c9d), [ECONOMIC DOCUMENTATION — CLOSURE GATE / Hysteresis Reconciliation](https://app.notion.com/p/3dac4454d6d58125b677ee19930940f0), and [00 — ACTIVE SYSTEM WORKFLOW & CLOSURE GATE](https://app.notion.com/p/3dbc4454d6d58110875bcdabb1bfefbf).

### 2.2 B2 authenticated class-control carrier

Sources:

- [`PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md`](../../PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md)
- [`PRE-RICH/onchain/PreRichControlCarrier.hs`](../../PRE-RICH/onchain/PreRichControlCarrier.hs)
- [`PRE-RICH/onchain/PreRichControlCarrierMintPolicy.hs`](../../PRE-RICH/onchain/PreRichControlCarrierMintPolicy.hs)
- [`Adapter/CARDANO/observation/PreprodB2ControlObservation.ts`](../../Adapter/CARDANO/observation/PreprodB2ControlObservation.ts)

The B2 datum stores:

`CurrentActiveClass`, `HighestClassEverActivated`, `stateVersion`, `transitionNonce`, and the configured singleton identity.

The on-chain validator authenticates the singleton, requires the configured authority signature, preserves value and singleton, advances version/nonce, and checks monotonic direction:

- `ActivateControl`: current/highest cannot decrease and highest cannot be below current;
- `ContractControl`: current cannot increase and highest must remain unchanged.

**Important distinction:** the current B2 validator does not recompute the hysteresis predicate or prove that the submitted lower class is exactly the deterministic `evolvePreRichHysteresis` result. It enforces shape, authorization and direction, not the full policy calculation. The B2 design document describes the existing hysteresis calculation as normative and calls for the relevant class/capacity predicates to be respected; the present validator alone does not discharge that requirement.

The B2 design is also marked as a closure candidate, not a fully closed deployment contract.

### 2.3 DApp Issue path — B2 is required here

Source: [`src/mint.ts`](../../src/mint.ts).

The public authoritative wrapper forces:

```ts
requireV3CarrierBinding: true,
requireB2ControlBinding: true,
```

When B2 binding is required, the DApp:

1. requires the configured B2 address, policy and token name;
2. resolves exactly one UTxO carrying the configured singleton;
3. decodes the B2 datum through `observePreprodB2Control`;
4. compares its state reference and current/highest classes with the live V3 control projection and Issue evidence;
5. rejects a class above the observed B2 current class;
6. passes the exact B2 reference to the authoritative Issue provider;
7. includes the B2 UTxO in the transaction reference inputs.

The signed authority envelope also requires and verifies that its `controlStateReference` equals the observed B2 reference. This is real application-layer binding and must be preserved.

### 2.4 On-chain enforcement gap for the B2 reference

Sources:

- [`PRE-RICH/onchain/V3EconomicStateCarrier.hs`](../../PRE-RICH/onchain/V3EconomicStateCarrier.hs)
- [`plutus/MintPolicy.hs`](../../plutus/MintPolicy.hs)
- [`plutus/B1PrizePool.hs`](../../plutus/B1PrizePool.hs)
- [`relayer/signedIssueAuthority.js`](../../relayer/signedIssueAuthority.js)

The inspected V3 carrier validator checks its own singleton continuation, V3 state validity, canonical pre/post-state hashes and an Ed25519 carrier-binding signature. It does not inspect the B2 reference input or decode a B2 datum.

The carrier-binding message checked by that validator consists of:

`actionClass | decisionReference | observationReference | stateHash | actionFingerprint | postStateHash`.

It does not directly include the B2 UTxO reference. The outer signed Issue-authority envelope does include and verify `controlStateReference`, but that outer envelope is checked by the off-chain provider; the Plutus V3 carrier validator does not verify the outer envelope.

The inspected ticket `MintPolicy.hs` reads the Beacon Registry reference input and validates ticket creation/payment/pool conditions, but does not decode B2 control state. The inspected B1 PrizePool validator likewise has no B2 control-datum binding.

Therefore:

- the normal DApp submission path checks and includes B2;
- the signed off-chain provider binds the authority decision to B2;
- the current Plutus Issue validators do not independently establish that the B2 reference is present, unique, current and consistent with the V3 control state.

This is an **on-chain enforcement gap**, not an absence of B2 from the DApp path.

## 3. Lifecycle / QUIESCENT gap

Sources:

- [`PRE-RICH/onchain/PreRichLifecycleTransition.hs`](../../PRE-RICH/onchain/PreRichLifecycleTransition.hs)
- [`PRE-RICH/onchain/PreRichRegimeState.hs`](../../PRE-RICH/onchain/PreRichRegimeState.hs)
- [`PRE-RICH/onchain/GenesisRegimeCarrier.hs`](../../PRE-RICH/onchain/GenesisRegimeCarrier.hs)
- [`PRE-RICH/onchain/PreRichIssueDecision.hs`](../../PRE-RICH/onchain/PreRichIssueDecision.hs)
- [`PRE-RICH/onchain/PreRichEconomicAdmission.hs`](../../PRE-RICH/onchain/PreRichEconomicAdmission.hs)

The existing `PreRichLifecycleTransition` model defines `ACTIVE → QUIESCENT` and `QUIESCENT → QUIESCENT). Its module explicitly sits outside `EconomicTransitionV3` and does not change economic V3 fields. The QNE helper accepts caller-provided Ω witnesses and leaves Ω completeness/soundness to the caller.

The deployed `GenesisRegimeCarrier` is narrower: its action type contains only `ActivateGenesis`, and its validator implements the `PRE_GENESIS → GENESIS` edge. `PreRichRegimeState` lists `Active` and `Quiescent`, but that enumeration does not implement those ledger transitions.

The canonical Haskell Issue decision and economic admission input types do not carry a regime field. The Issue builder does not observe or reference the regime carrier. Accordingly, an on-chain QUIESCENT state is not presently a condition of Issue acceptance.

### HALT representation

The hysteresis controller represents `HALT` with `currentActiveClass = null`. The B2 datum, B2 observer and V3 economic state require a numeric class in the range 0..7. No approved encoding mapping this null controller result to a canonical regime/control state was found.

Do not encode HALT as class 0 or another arbitrary class. The application contract must explicitly decide how QUIESCENT supersedes the last numeric class while preserving `HighestClassEverActivated`.

### No-keeper behaviour

The controller is not invoked by the inspected authoritative Issue admission chain. The DApp verifies that the requested class is no greater than the already-recorded B2/V3 `CurrentActiveClass`; it does not recompute `KC × X(P)` and compare the observed control with a fresh deterministic hysteresis result before Issue.

Therefore the current code does not establish the intended no-keeper property:

> if capacity has crossed the maintenance boundary but no one has yet submitted a contraction transaction, a new Issue must still be rejected.

The Economic Gate may reject an economically insolvent candidate, but that is not equivalent to enforcing the PRE-RICH maintenance threshold. The no-keeper property must be made explicit in the Issue acceptance boundary.

## 4. Reconciled composition contract — proposed, not yet authorized as implementation

This contract uses existing PRE-RICH meanings and parameters. It introduces no new economic constant, threshold, payout rule or universal IMMORTAL action.

### C1 — authoritative hysteresis inputs

For every class, the application must use the already-closed cost-surface semantics `X(P)=499P+Fs(P)+Fr(P)+Fc(P)`, including only genuinely mandatory future protocol costs, and the already-closed ratio `CR(P)=C/X(P)`. Activation is `CR(P)≥8`; maintenance is `CR(Pcurrent)≥4`; the normative buffer is `4×X(P)`. The values `KA=8, KC=4, KD=4` are frozen decisions, not new candidates.

The remaining evidence requirement is to bind the exact integer numerator `C` to an authoritative, current, versioned economic observation, and to benchmark the actual mandatory `Fs/Fr/Fc`/OPEX values for the deployed implementation. The controller must not accept caller-selected costs, synthetic capacity or stale observations as production evidence. If the source and derivation of `C` cannot be established for a concrete deployment profile, control transition and Issue must fail closed.

### C2 — deterministic control result

Given the authenticated pre-state and canonical inputs, compute the existing `evolvePreRichHysteresis` result. The submitted B2 transition must equal that exact result:

- `ACTIVATE/UPGRADE`: satisfy the already-approved activation predicate and preserve monotonic historical maximum;
- `RETAIN`: preserve both class fields;
- `CONTRACT`: set current class to exactly the highest maintainable class at or below the previous current class, preserving the historical maximum;
- `HALT`: transition the application regime to QUIESCENT using an explicitly approved encoding, not a fabricated numeric class.

The current B2 validator's direction-only checks are not a substitute for this equality check.

### C3 — Issue acceptance

An Issue is admissible only if all of the following are bound to the same canonical observation/transaction:

1. exactly one current B2 singleton and its decoded datum;
2. the canonical regime state is ACTIVE (not QUIESCENT/HALT);
3. the requested class is no higher than the B2 current class;
4. the B2 control agrees with the V3 control projection;
5. the current hysteresis maintenance predicate is satisfied for the active class;
6. ticket cap/saleability and canonical price checks pass;
7. the existing Economic Gate and authoritative EEV/obligation/viability admission passes.

The ledger enforcement must validate the relevant reference input(s) itself. DApp inclusion and an off-chain envelope are necessary evidence, but do not alone make a Plutus validator enforce a reference-input condition.

### C4 — contraction and no-keeper safety

A contraction submission should be permissionless where the governing T2 contract requires it, with on-chain revalidation of the canonical predicate and exact successor.

The safety property cannot depend on a keeper being available. If the current class fails its maintenance predicate, Issue must fail closed even when the B2 control UTxO has not yet been updated. Contraction updates the canonical state; it is not the only mechanism preventing a new unsafe sale.

The present B2 validator requires a configured authority signature. Its relationship to the permissionless T2 semantics must be resolved rather than silently treated as equivalent.

### C5 — QUIESCENT and recovery

When no class remains maintainable:

- enter canonical QUIESCENT/HALT;
- prohibit all new Issue actions at the on-chain acceptance boundary;
- preserve existing ticket rights, liabilities and their representation;
- do not interpret QUIESCENT as settlement, expiry or deletion of obligations.

Recovery must use the existing activation threshold `KA` and the same canonical `X(P)` derivation. It must transition from QUIESCENT only after independent revalidation, preserve `HighestClassEverActivated`, and reopen Issue only after the regime and control states are atomically consistent.

Whether the last numeric `CurrentActiveClass` is retained as historical control while QUIESCENT, or another representation is approved, remains an explicit design decision. No new sentinel is assumed here.

### C6 — atomicity and replay/concurrency

The Issue transaction must bind the exact B2 and regime state references. A stale reference after a control/regime transition must not authorize an Issue. A control transition must preserve singleton identity, increment its version/nonce exactly once, and reject competing or replayed transitions.

All state references, pre/post hashes, action identity and authority evidence must describe the same observed transition.

## 5. Required evidence before implementation is considered conformant

| Test/evidence | Required result |
|---|---|
| Cost surface `X(P)` | Uses the frozen `499P+Fs+Fr+Fc` formula and includes only mandatory costs; actual cost benchmark is reproducible |
| Capacity numerator `C` | Exact current value is authenticated, versioned and tied to the approved economic observation/profile |
| Hysteresis replay | Computes `CR(P)=C/X(P)` using frozen `KA=8, KC=4, KD=4` and matches the submitted controller result |
| B2 validator | Recomputes the exact controller result; rejects arbitrary lower class, invalid activation and historical-maximum regression |
| Issue without B2 reference | Rejected by the on-chain Issue enforcement path |
| Missing/duplicate/malformed B2 singleton | Rejected |
| B2/V3 control mismatch | Rejected on-chain |
| Issue class above current class | Rejected on-chain |
| Maintenance threshold breached, no keeper called | Issue still rejected |
| QUIESCENT regime | Issue rejected even if old numeric class remains in B2/V3 |
| Recovery below `KA` | Rejected |
| Recovery at/above approved `KA` predicate | Only the exact approved transition is accepted |
| Concurrent Issue vs control/regime transition | Stale competing transaction rejected |
| Existing ticket obligations | Remain fully represented through contraction and quiescence |

Existing tests are useful but do not jointly discharge this matrix. In particular, the B2 observation tests prove singleton decoding/fail-closed parsing; the hysteresis tests prove the controller over supplied fixtures; lifecycle tests prove the pure lifecycle model. They do not yet prove the integrated on-chain Issue/regime contract.

## 6. Boundary with IMMORTAL C6/QNE

This reconciliation closes no universal IMMORTAL theorem.

PRE-RICH's controller and lifecycle are application policy. Even after their Issue enforcement is completed, C6 still needs a profile-specific `(S, A, Accept, Ω, T, Safe)`, complete/sound Ω, a real non-erosion witness, representation preservation and a certified non-empty `K_c`.

QUIESCENT preventing new issuance does not by itself prevent adverse EEV/asset events from eroding the buffer. The QNE proof must still quantify over every successor in the declared Ω.

## 7. Non-regression / execution boundary

- No V3 economic action or Reveal semantics are changed by this audit.
- No new economic constants or hysteresis thresholds are introduced.
- No new branch is created.
- No code, validator, test, workflow, deployment or on-chain state is changed by this document.
- JEV and Materios proof acquisition remain outside this workstream.

**Disposition:** existing semantics are recoverable; application composition is only partially implemented. The next authorized implementation slice, after the design decisions in C1/C4/C5 are resolved, should be the Issue-specific on-chain enforcement boundary and its integrated negative tests. Do not start by modifying V3/Reveal or by inventing a new universal QNE action.
