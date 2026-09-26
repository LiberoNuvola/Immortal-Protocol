# IMMORTAL — Cross-Session Coordination & Closure Register

> **Role:** shared operational handoff, source-triangulation register and anti-regression control between concurrent engineering sessions.
>
> **Authority:** this file is **NON-NORMATIVE**. It cannot change protocol semantics. Canonical Constitution/specifications and explicit normative decisions remain authoritative.
>
> **Working branch:** `work/immortal-green-closure`
> **Snapshot:** 2026-09-26
> **Observed HEAD:** `2f99e940b2342a41dfa73a03d0aa96fa40365dd3`
> **HEAD change:** `docs: reorganize cross-session coordination by triangulated fronts`

---

# 0. OPERATING RULE

Every front is tracked across six layers:

1. **NORMATIVE** — what the protocol/profile says must be true.
2. **DESIGN** — architecture/specification.
3. **IMPLEMENTATION** — what the current branch actually contains.
4. **TEST/CI** — executable bounded evidence.
5. **RUNTIME/LEDGER** — Yaci, native Cardano-ledger, Preprod or external canonical witness.
6. **CERTIFICATION** — deployment-specific proof/evidence packet.

A front is **CLOSED** only at the layer explicitly required by its acceptance criterion.

Never promote:
- design → implementation;
- implementation → proof;
- unit test → live ledger evidence;
- schema → cryptographic authenticity;
- simulation → deployment certification.

When sources disagree, use this precedence:

**Constitution / canonical specification → explicit normative decision → current technical specification → current implementation → tests/proofs → runtime evidence → coordination notes → legacy material.**

Notion is the **decision/provenance control plane**; GitHub is the **implementation source**; runtime evidence is the **execution witness**.

---

# 1. ARCHITECTURE BOUNDARY — F0

## F0.1 Universal IMMORTAL

Must remain chain/application neutral:

- canonical economic state;
- obligations/liabilities;
- exposure;
- executable liquidity;
- ProtectedCapital;
- RawSurplus;
- Economic Gate;
- viability;
- safe action;
- atomic transition;
- state history;
- universal safety/lifecycle semantics.

## F0.2 Adapter

Owns concrete execution:

- serialization;
- datum/redeemer/UTxO handling;
- validity intervals;
- transaction construction/signing/submission;
- external-input transport;
- observation/evidence production.

Adapter does **not** independently decide economic admissibility.

## F0.3 PRE-RICH profile/application

Owns:

- ticket ladder;
- payout policy;
- GameRules;
- Jackpot;
- KA/KC/KD;
- application expiry policy;
- application-specific control state.

### Current boundary finding

Parameter separation is substantially implemented, but the V3 state/kernel still structurally contains PRE-RICH-shaped concepts such as class state, control state and Jackpot state.

**Status: 🟡 NEEDS-EVIDENCE / POSSIBLE EXTRACTION**

Do not perform a destructive refactor until all V3 consumers and conformance tests are mapped.

---

# 2. ECONOMIC KERNEL — F1

## F1.1 Economic canon

Current canonical application/profile facts confirmed by Notion:

- KA = 8
- KC = 4
- KD = 4
- PRE-RICH ladder = 1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM
- Genesis = 1 USDM
- PRE Treasury bootstrap >= 4,000 USDM
- PRE-RICH maximum normal payout = 500 × P
- liability-first accounting
- ProtectedCapital
- RawSurplus = max(0, EEV - ProtectedCapital)
- expiry finality
- post-expiry dissolution
- protected Jackpot

These are **not universal IMMORTAL constants** where Notion classifies them as PRE-RICH policy.

## F1.2 ProtectedCapital

Components currently treated as universal semantic components:

- SafetyCapital
- ReserveProtection
- MandatoryFutureCosts

**Status: 🟡 IMPLEMENTED / PRESERVATION EVIDENCE OPEN**

## F1.3 RawSurplus / EEV

Economic admission now separates verified pre-state EEV from candidate-state EEV.

**Status: 🟡 IMPLEMENTED / AUTHORITATIVE PROVENANCE OPEN**

## F1.4 Economic Gate → Viability → Safe Action → Atomic Transition

Required chain:

`Canonical State → Economic Delta → Candidate Post-State → ProtectedCapital → RawSurplus → Economic Gate → Viability → Safe Action → Atomic Transition → Post-State → History`

**Status: 🟡 IMPLEMENTED INTERFACES / END-TO-END LEDGER EVIDENCE OPEN**

## F1.5 Infinite-horizon viability

Local invariant preservation is not an infinite-horizon viability proof.

**Status: 🔴 OPEN CERTIFICATION**

---

# 3. PRE-RICH PROFILE — F2

## F2.1 Ticket ladder

1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM.

**Status: 🟢 CLOSED AS PROFILE POLICY**

## F2.2 Hysteresis

KA=8, KC=4, KD=4.

Exact integer predicates are implemented and have bounded CI evidence.

**Status: 🟢 GREEN / BOUNDED**

## F2.3 Classic-6 / GameRules

20,000-domain replay and payout-unit evidence exist.

**Status: 🟢 GREEN / BOUNDED**

## F2.4 Jackpot

Jackpot is application policy.

Current protection floor:

`J_floor(S) = 500 × max(ΣP_normal, ΣP_saleable(S))`

Funding need:

`FundingNeed(S) = max(0, J_floor(S) − J_locked(S))`

**Status: 🟡 POLICY CLOSED / ON-CHAIN ACTIVATION OPEN**

Current B1 datum does not carry current/highest class control required for direct on-chain activation.

## F2.5 Expiry

Semantic mechanism is closed:

- deterministic horizon from authoritative issuance state/profile policy;
- crystallized at issuance;
- UNRESOLVED → EXPIRED;
- no claim after expiry;
- late reveal has zero economic effect.

Exact numeric duration remains application/deployment policy.

**Status: 🟡 SEMANTICALLY CLOSED / NUMERIC + CONFORMANCE OPEN**

---

# 4. CARDANO ADAPTER / REAL EXECUTION — F3

## F3.1 Sale / Issue

Cardano Adapter Sale conformance is green on the current branch lineage.

Issue path now requires `IssueRefinementEvidence` and fails closed if saleability evidence is missing/inconsistent.

**Status: 🟢 BOUNDED / 🟡 ON-CHAIN CONTROL INTEGRATION OPEN**

## F3.2 Reveal transaction-size architecture

The previous inline-script Reveal exceeded the Cardano transaction-size ceiling.

Current architecture:

- PrizeValidator reference script;
- B1PrizePool reference script;
- exact holder lookup;
- hash verification;
- missing/duplicate/mismatch => fail closed;
- `.readFrom(...)`;
- no inline validator fallback.

**Status: 🟡 IMPLEMENTED / RUNTIME MEASUREMENT OPEN**

Never increase `maxTxSize` to make this pass.

## F3.3 P2.8 native ledger runner

Evidence packet must contain:

- `tx.cbor`
- `utxo.json`
- `pparams.json`
- `epoch-info.json`
- `system-start.json`
- `manifest.json`

Runner must decode native Babbage types and invoke:

`evalTxExUnitsWithLogs`

No synthetic evaluator context is permitted.

### Recent resolver progress

- `plutus-tx` source materialization fixed.
- `microlens == 0.4.14.0` compatibility pin added.
- GHC/Cabal/native dependency bootstrap has progressed through previous resolver stages.

**Status: 🔴 OPEN — exact-head native evaluation evidence not yet produced**

## F3.4 Real Preprod Reveal witness

Required:

1. deployed reference scripts;
2. actual Preprod UTxOs;
3. real signed Reveal;
4. serialized byte measurement against observed protocol parameter;
5. successful or exact fail-closed native ledger evaluation;
6. persisted evidence packet.

**Status: 🔴 OPEN — PRIMARY EXECUTION GATE**

## F3.5 Wallet/provider security

CIP-30 user wallet remains the signing authority.

Never put a wallet seed/private key in GitHub.

Blockfrost project credentials remain runtime configuration, not repository secrets exposed to public code.

---

# 5. BEACON / RANDOMNESS — F4

## F4.1 B1

Current operational model:

- deterministic beacon derivation;
- authorized publication boundary;
- explicit target/context/hash checks.

It does **not** prove external canonicality.

**Status: 🟡 OPERATIONAL TRANSITION MODEL**

## F4.2 B2

Authenticated committee/control design exists in:

`PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md`

Singleton identity and ledger enforcement remain deployment work.

**Status: 🟡 DESIGN CANDIDATE / ON-CHAIN INTEGRATION OPEN**

## F4.3 B3 — PRE-RICH-owned canonicality target

**Boundary rule:** B3 belongs to **PRE-RICH**, not to the universal IMMORTAL kernel.

B3 is not an IMMORTAL economic rule. It is the stronger publisher-independent randomness/canonicality target selected by PRE-RICH for its Beacon path. The canonical repository source states this explicitly in `PRE-RICH/docs/B3-BEACON-CONFORMANCE-INVESTIGATION.md`.

IMMORTAL may define only the generic abstraction/boundary for authenticated external canonical evidence. It must not absorb the concrete B3 mechanism, Materios topology, PRE-RICH Beacon domains, or application-specific canonicality policy merely because PRE-RICH instantiates them.

Target PRE-RICH architecture:

`Materios → CanonicalCheckpoint → finality/storage verification → proof → Cardano verifier → CanonicalBeaconAnchor → BeaconRegistry`

Open:

- publisher-independent canonicality;
- GRANDPA finality/authority/ancestry composition;
- StateRoot/storage authentication;
- succinct/ZK system;
- Cardano verifier;
- executable deterministic replay;
- fail-closed adversarial evidence.

**Status: 🔴 OPEN CERTIFICATION**

## F4.4 Trust-mode selection

Current selector already prioritizes:

`B3_VERIFIED → B2_ATTESTED → B1_AUTHORIZED`

Critical rule:

- freeze trust mode before ticket commitments;
- a B3 round never silently downgrades to B2/B1;
- fallback applies only to **new rounds**;
- if no acceptable mode exists, fail closed/halt.

**Status: 🟢 SELECTOR BOUNDED / 🟡 ROUND-LIFECYCLE INTEGRATION OPEN**

## F4.5 Randomness conformance

20,000-domain mapping and rejection/bias handling have bounded evidence.

**Status: 🟢 BOUNDED / 🔴 CANONICAL EXTERNAL RANDOMNESS OPEN**

---

# 6. MATERIOS / EXTERNAL CANONICALITY — F5

## F5.1 GRANDPA finality

PoC/verifier components exist.

Current verifier deliberately fails closed where ancestry is not verified.

**Status: 🔴 OPEN**

## F5.2 Authority selection

Upstream authority-selection provenance has been triangulated.

Do not replace the authoritative selector with a TypeScript reimplementation.

Required evidence includes:

- genesis UTxO;
- AuthoritySelectionInputs;
- sidechain epoch;
- candidate filtering;
- D-parameter/stake weighting;
- ordering;
- seed `epoch_nonce + sidechain_epoch`;
- weighted selection;
- deduplication;
- safety floor;
- committee.

**Status: 🟡 SOURCE-ALIGNED / END-TO-END PROOF OPEN**

## F5.3 State authentication

Need:

- StateRoot binding;
- storage proof;
- StateRoot → exact value binding;
- independent verification.

**Status: 🔴 OPEN**

## F5.4 Succinct proof

Proof system is not canonically fixed.

**Status: 🔴 OPEN**

## F5.5 Adversarial closure

Need publisher-independent, stale/replay/conflicting-root and ancestry/perimeter rejection evidence.

**Status: 🔴 OPEN**

---

# 7. PRE-GENESIS / GENESIS / TREASURY — F6

## F6.1 Treasury identity

Current user-facing Treasury surface derives the script address and allows ordinary users to fund it with their own CIP-30 wallet.

Treasury is not a user wallet.

**Status: 🟡 IMPLEMENTED / DEPLOYMENT EVIDENCE OPEN**

## F6.2 Treasury observation

Current observation requires:

- exact PRE policy/name;
- canonical Treasury UTxO selection;
- Oracle singleton;
- PRE identity;
- price;
- timestamp;
- publisher;
- freshness;
- observed references.

Ambiguity and stale Oracle fail closed.

**Status: 🟢 BOUNDED OBSERVATION / 🟡 LIVE DEPLOYMENT OPEN**

## F6.3 Genesis admission

Observation is composed with Genesis admission.

Important distinction:

**observation/admission code is not proof of on-chain Genesis enforcement.**

**Status: 🟡 IMPLEMENTED COMPOSITION / 🔴 CARRIER + LEDGER WITNESS OPEN**

## F6.4 Oracle

Freshness and publisher binding are represented.

Open operational issue:

stale Oracle rejection is defined, but the complete stale → state → liquidation/recovery/liveness path is not fully closed.

**Status: 🟡 CLOSING**

## F6.5 Gate 41 / PRE-Snek

Current Notion evidence confirms:

- State-0 anchor closed;
- current State-0 transaction closed;
- Pool NFT mint transaction closed;
- direct Pool NFT UTxO lineage closed;
- immediate Genesis input set closed.

Still open:

- Snek `info.outputId` ↔ actual NFT-bearing output mapping;
- upstream deployment graph;
- seed/min-ADA semantics;
- 3 ADA reconciliation;
- first curve replay.

**Status: 🟡 CLOSING**

## F6.6 Genesis carrier

Genesis carrier implementation exists, but admission authority and concrete deployment witness remain distinct certification steps.

**Status: 🔴 OPEN**

---

# 8. PUBLIC DECLARATION / OBSERVABILITY — F7

## F7.1 Declaration schema

Implemented vocabulary:

Life State:
- PLANULA
- POLYP
- YOUNG_MEDUSA
- MEDUSA
- REGENERATION

Current Activity:
- ISSUING
- AWAITING_FINALITY
- SETTLING
- IDLE
- plus defined application activity vocabulary where evidence supports it.

Operational:
- ONLINE
- DEGRADED
- PAUSED
- HALTED

Beacon:
- B3_VERIFIED
- B2_ATTESTED
- B1_AUTHORIZED

**Status: 🟢 DOMAIN MODEL**

## F7.2 Activity binding

Only observed lifecycle may become public activity.

No activity may be inferred from:

- button click;
- UI intent;
- wallet intent;
- relayer request.

Latest HEAD explicitly records `IDLE` when no activity is observed.

**Status: 🟢 BOUNDED**

## F7.3 Life State

Biological vocabulary is presentation semantics only.

No threshold mapping has been invented.

**Status: 🟡 DESIGN / OPEN**

## F7.4 Staleness

Declaration must expose observation age and fail visibly stale/unavailable.

**Status: 🟡 OPEN**

## F7.5 Evidence UI

Must bind declaration to canonical state, transaction/action reference, source and scope.

**Status: 🟡 OPEN LIVE WIRING**

---

# 9. IMMORTAL V5 / DAPP ECOSYSTEM — F8

## F8.1 V5 home

Preserve the original multi-page V5 information architecture.

## F8.2 DApp Ecosystem

Public structure:

`IMMORTAL → DApp Ecosystem → PRE-RICH`

PRE-RICH is the first Cardano-native application, not the definition of IMMORTAL.

### F8.2a — Immortal-jellyfish / Medusa boundary

The **immortal-jellyfish / Turritopsis / Medusa** concept belongs to the PRE-RICH application/presentation layer as the concrete manifestation of its intended “immortality” property.

It must not be retroactively encoded as a universal IMMORTAL rule merely because PRE-RICH uses it as its defining metaphor.

The architectural hypothesis is:

`IMMORTAL universal algorithm/invariants → PRE-RICH instantiation → observed application property`

This is a design/interpretation boundary, **not yet a formal proof that the universal algorithm itself establishes biological-style immortality**. No threshold, state transition, or economic rule may be invented from the metaphor.

Conversely, PRE-RICH-specific mechanics must not be promoted upstream into IMMORTAL unless separately demonstrated and canonically accepted as universal.

## F8.3 PRE-RICH DApp

Must expose:

- wallet connection;
- Preprod environment;
- canonical ticket state;
- lifecycle;
- evidence;
- protocol activity.

## F8.4 Treasury surface

Treasury funding is a user-signed transaction into a protocol script address.

No private key belongs in the frontend/repository.

## F8.5 Public language

International English.

The biological metaphor is based on the immortal-jellyfish/Turritopsis concept, but the state itself must always derive from verified observations.

**Status: 🟡 ACTIVE REFINEMENT**

---

# 10. GOVERNANCE / ALGORITHMIC GOVERNABILITY — F9

## F9.1 Authorization
Implemented constitutional boundary and proposal/approval predicates.

## F9.2 Execution
Execution remains bounded by authorized layer and economic constraints.

## F9.3 Observation
Canonical events and evidence schema exist.

## F9.4 Replay
GOV-28 canonical replay now binds the canonicalization reference to the exact finalized DecisionRecord for the same proposal; tampering is rejected by regression tests.

## F9.5 Remaining evidence

Notion current-state review still identifies the executable Haskell/build evidence as the remaining proof layer.

Governance must not:

- choose winners;
- rewrite crystallized payouts;
- bypass the Economic Gate;
- create privileged Treasury entitlement;
- alter canonical randomness.

**Status: 🟡 IMPLEMENTED / BUILD + EXECUTION EVIDENCE OPEN**

---

# 11. LIVENESS / OPERATIONS — F10

## F10.1 R4 classifier

FM1–FM10 precedence/classification has bounded green CI evidence.

**Status: 🟢 BOUNDED**

## F10.2 Permissionless recovery

Need deployment-specific proof that eligible recovery actions are executable without privileged operator dependence where required.

**Status: 🟡 OPEN**

## F10.3 Beacon availability

Trust mode must be explicit and frozen per round.

**Status: 🟡 INTEGRATION OPEN**

## F10.4 Oracle/adapter staleness

Stale data must not become spendable economic truth.

Remaining gap is the complete operational transition after stale rejection.

**Status: 🟡 CLOSING**

---

# 12. EVIDENCE / CERTIFICATION — F11

## F11.1 Evidence classes

- unit/conformance;
- simulation;
- Yaci/devnet;
- native Cardano-ledger;
- Preprod;
- external canonical witness.

## F11.2 Binding

Every closure packet must identify, where applicable:

- exact commit;
- exact workflow/run;
- exact artifact;
- exact transaction;
- exact UTxO;
- exact protocol parameters;
- exact source hash;
- exact scope.

## F11.3 Negative evidence

Critical gates need adversarial rejection evidence.

## F11.4 Reproducibility

Independent rerun from frozen inputs.

## F11.5 Certification rule

No GREEN/CLOSED certification claim without the evidence class required by that gate.

**Status: 🔴 CONTINUOUS / FINAL CERTIFICATION OPEN**

---

# 13. ARCHITECTURAL / NOVELTY RESEARCH — F12

## F12.1 Known mechanisms

Document established prior art individually:

- state-transition systems;
- invariants;
- safety/liveness;
- formal refinement;
- atomicity;
- proof-carrying data;
- protocol verification;
- cryptographic commitments;
- permissionless execution.

## F12.2 Composition

Potentially distinctive research object is the composition/boundary discipline:

`normative economic constitution → certified economic state/transition → ProtectedCapital/safety → viability → permissionless/liveness boundary → authenticated executable-liquidity provenance → adapter → on-chain revalidation → atomic transition → canonical state → reproducible evidence`

This remains a **research hypothesis**, not a novelty claim.

## F12.3 Differentiators

Must be source-grounded and compared against primary literature/projects.

## F12.4 Evidence

No novelty statement until the prior-art matrix is complete.

**Status: 🟡 RESEARCH**

---

# 14. CROSS-FRONT CERTIFICATION GATES

These are the current hard gates that can block a false “finished” declaration:

### G1 — Native Cardano ledger
P2.8 exact-head typed evaluation succeeds and produces persisted native-ledger evidence.

### G2 — Real Preprod Reveal
Reference scripts are deployed, transaction size is measured against observed parameters, and the exact transaction is evaluated.

### G3 — Materios/B3
Publisher-independent finality + state authentication + authority/ancestry/perimeter evidence.

### G4 — B4/B5/B6
ProtectedCapital, Economic Gate, viability and V3↔Cardano semantic correspondence are demonstrated at the required runtime layer.

### G5 — Governance
Current-head Haskell/build and execution evidence closes the remaining GOV-28 certification layer.

### G6 — Genesis
Concrete Treasury + Oracle + Genesis carrier witness proves the admission path without conflating observation with enforcement.

### G7 — Deployment certification
R1–R8 / RF1–RF11 deployment-specific evidence, including Ω perimeter, Kc/non-vacuity and RF8 no-side-door coverage.

---

# 15. CURRENT MULTI-AGENT HANDOFF

## Agent A — P2.8 / Cardano ledger

**Owns:** F3.2–F3.4.

Next:
1. verify the microlens-pinned run;
2. continue through typed UTxO/EpochInfo/SystemStart;
3. persist native evaluation result;
4. do not synthesize missing context;
5. report exact blocker if evaluator still fails.

## Agent B — Beacon / Materios

**Owns:** F4 + F5.

Next:
1. continue B3-A/B evidence;
2. preserve authoritative selector provenance;
3. do not replace selector with TS logic;
4. implement/verify trust-mode freeze at round creation;
5. keep B1/B2 fallback explicit and new-round-only.

## Agent C — Genesis / Treasury / Gate 41

**Owns:** F6.

Next:
1. close live Treasury observation;
2. continue Gate-41 upstream provenance;
3. resolve Snek output mapping;
4. resolve 3 ADA / seed semantics from transaction evidence;
5. produce real Genesis admission/carrier witness.

## Agent D — Governance

**Owns:** F9.

Next:
1. run current-head Haskell build/test;
2. verify GOV-28 canonicalization replay on executable path;
3. attach exact workflow/artifact evidence.

## Agent E — V5 / DApp Ecosystem

**Owns:** F7 + F8.

Next:
1. continue V5 presentation refinement;
2. wire observed activity/evidence into public surface;
3. keep Life State thresholds non-normative until sourced;
4. make stale/unavailable state explicit;
5. keep public language international English.

## Agent F — Economic / state boundary

**Owns:** F0 + F1 + F2 + B4/B5/B6.

Next:
1. map all V3 state consumers before refactoring;
2. preserve universal/profile separation;
3. continue ProtectedCapital/Gate/V3↔Cardano evidence;
4. do not turn PRE-RICH policy into universal kernel semantics.

## Agent G — Evidence / certification / research

**Owns:** F11 + F12.

Next:
1. maintain evidence taxonomy;
2. bind every closure claim to exact evidence;
3. maintain prior-art matrix;
4. prevent simulation/test evidence from being promoted to proof.

---

# 16. CURRENT OPEN REGISTER

| ID | Front | Current status | Immediate closure witness |
|---|---|---|---|
| P2.8 | F3 | 🔴 OPEN | Native ledger evaluation packet |
| PREPROD-REVEAL | F3 | 🔴 OPEN | Real reference-script Reveal + measured CBOR + ledger evaluation |
| B3-A | F4/F5 | 🔴 OPEN | Publisher-independent finality proof |
| B3-B | F4/F5 | 🔴 OPEN | StateRoot/storage/value proof |
| B3-C | F4/F5 | 🔴 OPEN | Canonical succinct-proof decision + verifier evidence |
| B2-CONTROL | F4 | 🟡 OPEN | Deployed singleton + ledger enforcement |
| MATERIOS-AUTH | F5 | 🟡 OPEN | End-to-end authority/ancestry provenance |
| GENESIS | F6 | 🔴 OPEN | Real Treasury/Oracle/carrier admission witness |
| GATE-41 | F6 | 🟡 CLOSING | Snek mapping + seed/3-ADA + curve replay |
| ORACLE-LIVENESS | F6/F10 | 🟡 CLOSING | Stale→state→recovery/liquidation operational trace |
| LIFE-STATE | F7 | 🟡 OPEN | Sourced observation→state mapping |
| OBSERVABILITY | F7 | 🟡 OPEN | Live evidence/staleness UI wiring |
| V5 | F8 | 🟡 ACTIVE | Final presentation + live protocol declarations |
| GOV-28 | F9 | 🟡 OPEN | Current-head Haskell/build execution evidence |
| V3-BOUNDARY | F0/F1 | 🟡 NEEDS-EVIDENCE | Complete consumer/conformance map |
| B4 | F1 | 🟡 OPEN | Preservation + authoritative provenance |
| B5 | F1 | 🟡 OPEN | Live Gate/viability certificate |
| B6 | F1/F3 | 🟡 PARTIAL | Full V3↔Cardano semantic equivalence |
| RF8 | F11/F12 | 🔴 OPEN | Whole-program no-side-door evidence |
| RF6/Ω | F11 | 🔴 OPEN | Deployment perimeter certificate |
| Kc/non-vacuity | F11 | 🔴 OPEN | Concrete deployment/profile evidence |
| NOVELTY | F12 | 🟡 RESEARCH | Completed prior-art comparison |

---

# 17. EXECUTION ORDER — UPDATED

The order below is a **dependency order**, not an importance ranking.

### NOW
1. **P2.8 native ledger**
2. **Real Preprod Reveal**
3. **Genesis/Treasury + Gate 41**
4. **Materios/B3**
5. **Beacon trust-mode round integration**

### IN PARALLEL
6. **Governance Haskell evidence**
7. **V5 + public observability**
8. **V3/state-boundary/B4/B5/B6**
9. **Liveness/oracle recovery**

### FINAL CERTIFICATION
10. **Evidence packets**
11. **RF8/RF6/Ω/Kc**
12. **Independent specialist review**
13. **Novelty/prior-art report**

---

# 18. ANTI-REGRESSION FIREWALL

Never:

- change KA/KC/KD to obtain green CI;
- change the PRE-RICH ladder;
- weaken the 500× ceiling;
- change Genesis semantics to fit an observed deployment;
- weaken ProtectedCapital;
- bypass the Economic Gate;
- weaken validator checks;
- increase Cardano transaction limits;
- replace Materios authority selection with a convenient local implementation;
- silently downgrade B3 to B2/B1 inside an already-created round;
- treat B1 as B3;
- treat a frontend/relayer state as economic truth;
- invent oracle values;
- invent Treasury identity;
- treat historical/legacy material as current canon;
- promote test/simulation evidence to cryptographic or live-ledger proof.

---

# 19. SOURCE TRIANGULATION REGISTER

## Primary Notion control sources

- **PRE-RICH — Control Center**
  - current operational workflow;
  - system-level triggerability/liveness audit;
  - current P2.8/RF8 observations;
  - canonical-document navigation.

- **IMMORTAL / PRE-RICH — End-to-End System Map & Continuity Checkpoint**
  - system architecture;
  - Materios/B3 composition;
  - evidence continuity.

- **IMMORTAL — Economic Canon & Parameter Boundary Register**
  - economic ownership;
  - universal vs profile parameters;
  - closed decisions.

- **IMMORTAL / PRE-RICH — Governance Current State — GOV-28**
  - current governance implementation/evidence state.

- **2026-09-21 — IMMORTAL Multi-Front Workflow Checkpoint**
  - cross-front dependency and handoff state.

- **41 — PRE Snek Deployment Lineage & Seed Reconciliation**
  - Gate 41 deployment evidence.

- **2026-09-21 — B4 ProtectedCapital / B5 Gate Surgical Conformance Pass**
  - ProtectedCapital/Gate boundaries.

- **2026-09-21 — A1/A2/A3 Policy Closure — Ticket Expiry & Jackpot**
  - expiry/Jackpot policy closure.

- **M3 — Chain Adapter & Serialization Boundary Design**
  - Adapter boundary and V3/Cardano correspondence.

## Primary repository sources

- `docs/COORDINATION/IMMORTAL_MASTER_FRONT_MATRIX_v0.1.md`
- `docs/IMMORTAL-IMPLEMENTATION-CLOSURE-STATUS.md`
- `PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md`
- `docs/audits/P2.8-REVEAL-REFERENCE-SCRIPT-REMEDIATION-v0.1.md`
- `PRE-RICH/docs/B3-BEACON-CONFORMANCE-INVESTIGATION.md`
- `docs/archive/B1-B3_evidence/beacon-canonicality-spec.md`
- `src/beaconTrust.ts`
- `src/protocolDeclaration.ts`
- `src/protocolDeclarationObservation.ts`
- `src/genesisTreasuryObservation.ts`
- `PRE-RICH/profile/GenesisTreasuryRuntime.ts`
- `audit/cardano-integration/reveal-ledger-trace.ts`
- `audit/cardano-ledger-runner/`
- `src/gameFlow.ts`
- `src/livenessBoundary.ts`

## External/runtime source classes

- Cardano Preprod;
- Yaci Store/devnet;
- native cardano-ledger;
- Koios;
- Blockfrost;
- Materios/GRANDPA upstream artifacts;
- primary academic/prior-art sources for F12.

---

# 20. SESSION REPORT TEMPLATE

Every agent/session update must end with:

```
FRONT:
SUBFRONT:
HEAD:
SOURCE SET:
IMPLEMENTATION:
TEST/CI:
RUNTIME:
CERTIFICATION:
STATUS:
BLOCKER:
NEXT CONCRETE WITNESS:
FILES/COMMITS:
```

Use **FACT / NORMATIVE / IMPLEMENTATION MISMATCH / VALIDATION RESULT / HYPOTHESIS / OPEN DECISION** when describing findings.

---

# 21. FINALIZATION RULE

The implementation phase is frozen.

The project may be called:

- **IMPLEMENTATION GREEN** only after current-head regression + required bounded CI gates pass;
- **OPERATIONALLY GREEN** only after current-head Haskell regression and Yaci/P2.8 native-ledger lifecycle evidence pass;
- **DEPLOYMENT CERTIFIED** only after deployment-specific R1–R8/RF1–RF11 evidence is attached;
- **FULLY CERTIFIED** only when the external canonical-state proof, Ω perimeter, Kc/non-vacuity, RF8 no-side-door and required specialist review are complete.

Until then, use the exact layer-specific status above.

**No agent may close a gate by changing the meaning of the gate.**


---

# 22. PUBLIC TRANSPARENCY LIFECYCLE MATRIX — OBSERVABILITY-002

**Added:** 2026-09-26  
**Purpose:** close the public declaration mapping from lifecycle/economic events to user-visible action availability without changing protocol economics.

Canonical matrix:
- `docs/04-guides/17_PUBLIC_TRANSPARENCY_LIFECYCLE_MATRIX_v0.1.md`

Required public coverage:
- Sale
- Commit
- Reveal
- Claim
- Expire
- Class activation/deactivation/contraction
- Jackpot
- Recovery Mode
- Surplus Mode
- Capital Protection / Regeneration where authoritatively declared
- Beacon-dependent actions
- transaction lifecycle and wallet boundary

Rules:
1. Frontend consumes authoritative declarations; it does not reconstruct economic state.
2. Every public action has an explicit availability state and explanation.
3. Active Class and economic modes are declared, never inferred from balances or failed transactions.
4. Beacon trust is observed/frozen state; B2/B3 are not claimed operational without their required deployment evidence.
5. Missing state/evidence is rendered as `UNKNOWN / NOT DECLARED`.
6. No ETA or next transition is invented; it is shown only when authoritatively declared.
7. This front does not modify KA/KC/KD, economic formulas, validator semantics, Beacon selection, or frontend implementation ownership.

**Current implementation witness:** commit `8f6f0650de4f96d060d10128ac2574aff1e74b3f`.

**Frontend integration target:** consume `ProtocolDeclaration`, `PublicProtocolState`, `ActionAvailability`, `ProtocolModeDeclaration`, and `ActiveClassDeclaration`; do not duplicate the underlying transition algorithms.


---

# 23. CROSS-FRONT EXECUTION PASS — 2026-09-26

This pass started from the coordination register and advanced every front that can be progressed without fabricating runtime evidence or changing normative economics.

## F0/F1/F2 — Economic/state boundary

**FACT:** PRE-RICH Cardano observation already requires authoritative class state, explicit ProtectedCapital components, and explicit Current/Highest class control.

**IMPLEMENTATION:** added `PRE-RICH/profile/PreRichPublicStateProjection.ts`.

Boundary rule:
- observed CurrentActiveClass may be projected to the public Active Class declaration;
- economic modes and action availability are **not** derived from balances;
- those declarations remain separate authoritative inputs.

**STATUS:** 🟡 boundary strengthened; runtime conformance remains open.

## F3 — Cardano / real execution

No fake closure was introduced.

**BLOCKER:** P2.8 native ledger packet and real Preprod Reveal remain external/runtime witnesses:
`tx.cbor + utxo.json + pparams.json + epoch-info.json + system-start.json + manifest.json`.

The public layer now has no path that can convert implementation availability into execution confirmation.

**STATUS:** 🔴 runtime gate remains open.

## F4/F5 — Beacon / Materios

No B2/B3 operational claim was introduced.

Public state continues to require observed evidence for Beacon mode, and the trust ladder remains:
`B3 VERIFIED → B2 ATTESTED → B1 AUTHORIZED → HALT`.

**BLOCKERS:** publisher-independent B3 proof, StateRoot/storage authentication, authority/ancestry provenance, and deployment enforcement.

**STATUS:** 🔴 certification open.

## F6 — Genesis / Treasury / Gate 41

No Treasury identity, Oracle value, Snek output mapping, seed semantics, or 3-ADA meaning was inferred.

**BLOCKERS:** live Treasury/Oracle/carrier witness and remaining Gate-41 reconciliation.

**STATUS:** 🟡/🔴 deployment evidence open.

## F7/F8 — Public observability / V5

Added:
- `src/publicStateValidation.ts`
- `src/__tests__/publicStateValidation.test.ts`
- `PRE-RICH/profile/PreRichPublicStateProjection.ts`
- `PRE-RICH/profile/__tests__/PreRichPublicStateProjection.test.ts`
- lifecycle matrix `docs/04-guides/17_PUBLIC_TRANSPARENCY_LIFECYCLE_MATRIX_v0.1.md`

The public boundary now validates:
- AVAILABLE ↔ available consistency;
- mode ACTIVE ↔ active consistency;
- required reasons/evidence/observation time;
- configurable freshness without inventing a protocol-wide freshness threshold.

**STATUS:** 🟡 implementation advanced; live frontend/evidence wiring remains open.

## F9 — Governance

No semantic shortcut was taken.

**BLOCKER:** current-head Haskell/build/execution evidence required for GOV-28.

**STATUS:** 🟡 implementation; execution evidence open.

## F10 — Liveness / operations

Public state validation now supports freshness checks without choosing an arbitrary universal freshness window.

**BLOCKER:** complete deployment-specific stale → state → recovery/liquidation trace.

**STATUS:** 🟡 closing.

## F11 — Evidence / certification

Public declarations now enforce evidence references for active class and protocol modes.

This is an evidence-binding safeguard, **not** certification.

**BLOCKERS:** exact artifact/run/transaction/UTxO binding for closure packets and negative/adversarial evidence.

**STATUS:** 🔴 continuous certification work.

## F12 — Prior art / novelty

No novelty claim was added.

**BLOCKER:** complete source-grounded prior-art matrix.

**STATUS:** 🟡 research.

### Commits from this pass

- `051c12e7e7a2f6a75c32d97fa34db42928944256` — public declaration validation/freshness
- `50f021e329c9a3343f66c1707b3919aee2c81b24` — validation tests
- `6d56f9cd6af317c84f14e60c3acbe4ab405c51c5` — PRE-RICH public state projection
- `df9d7544db32dc4ca0aa176edbca680f06752c57` — projection tests

### Required next concrete witnesses

1. **P2.8:** exact-head native evaluation packet.
2. **Boundary audit:** verify no B3/PRE-RICH Beacon or Medusa-specific semantics have leaked into universal IMMORTAL sources.
3. **Preprod Reveal:** real signed reference-script Reveal and ledger evaluation.
3. **B3:** publisher-independent finality + StateRoot/storage + authority/ancestry evidence.
4. **Genesis:** live Treasury/Oracle/carrier admission witness.
5. **Governance:** current-head Haskell execution artifact.
6. **Observability:** live declaration feed + stale/unavailable UI rendering.
7. **Certification:** frozen-input evidence packets with negative/adversarial coverage.

### Session report

```
FRONT: F0–F12 cross-front pass
SUBFRONT: state/public boundary, observability, evidence safeguards
HEAD: 2026-09-26 branch work/immortal-green-closure
SOURCE SET: coordination register + current repository implementation/specification
IMPLEMENTATION: advanced; no economic/validator semantics changed
TEST/CI: new bounded tests added; CI/runtime execution still required
RUNTIME: no new runtime witness fabricated
CERTIFICATION: unchanged; hard gates remain open
STATUS: IN PROGRESS
BLOCKER: P2.8, Preprod Reveal, B3, Genesis, GOV-28 and deployment evidence
NEXT CONCRETE WITNESS: exact runtime evidence packets above
FILES/COMMITS: see commits listed above
```

---

# 24. EXECUTION PASS — PUBLIC BOUNDARY + REVEAL EVIDENCE SEPARATION — 2026-09-26

## Public state boundary

The PRE-RICH public projection now requires the authoritative Active Class status explicitly: `ACTIVE | INACTIVE | TRANSITIONING | BLOCKED`.

It no longer infers `ACTIVE` merely because an economic observation contains a CurrentActiveClass.

Public validation additionally rejects:
- invalid Active Class identifiers;
- missing Active Class evidence;
- invalid Active Class observation timestamps.

Commits:
- `7946bce8b5d74945de6cb0e8261cb73545d313cb`
- `76f0ca63d14e510ca21fdfaff65844ed6903e824`
- `e7e4d6ae29c5cea7e2d54f6d90f48793eace6c5a`
- `c22cc059db5b370c93b0d99383044bfc017ab1ad`

## Reveal evidence separation

Repository inspection confirms that `audit/cardano-integration/reveal-ledger-trace.ts` is a real local Yaci/Cardano-devnet execution trace, not a Preprod witness.

It creates and submits a real Yaci transaction and persists:
- Reveal CBOR;
- protocol parameters;
- transition evidence;
- consumed/produced UTxOs;
- replay rejection evidence.

However its evidence explicitly carries `environment: local-yaci-devnet`.

Therefore:
- it is valid runtime evidence for the local Yaci execution path;
- it is not promoted to Preprod evidence;
- it cannot close PREPROD-REVEAL or the Preprod portion of F3.

## Current CI observation

New push-triggered runs were observed for the latest implementation commits, including:
- Protocol Declaration Conformance — queued;
- Algorithmic Governability Adversarial Lab — queued.

A queued run is not promoted to PASS.

## Current closure state

**IMPLEMENTATION:** public boundary strengthened and tested.

**LOCAL RUNTIME:** Reveal path has an explicit real-Yaci evidence-producing trace.

**PREPROD:** still OPEN pending a real Preprod transaction/evaluator packet.

**P2.8:** still OPEN pending exact-head native ledger evaluation artifact.

**No gate is closed by this pass.** The pass closes an ambiguity: local-Yaci evidence and Preprod evidence are separate evidence classes.


# 25. CI EXECUTION CONFIRMATION — 2026-09-26

Two push-triggered validation runs previously observed as queued have now completed successfully on the public-boundary head `e7e4d6ae29c5cea7e2d54f6d90f48793eace6c5a`:

- Protocol Declaration Conformance — run `36227168706`: **PASS** (`declaration-conformance`). Protocol declaration tests and TypeScript typecheck completed successfully.
- Algorithmic Governability Adversarial Lab — run `36227168703`: **PASS** (`no-result-dependent-authority`). The no-result-dependent-authority adversarial check completed successfully.

This is bounded CI evidence only. It does not close P2.8, PREPROD-REVEAL, B3, Genesis, or deployment certification. In particular, the real Yaci Reveal trace remains local-devnet evidence and must not be promoted to Preprod.

**Validation result:** the public declaration boundary changes have passed their targeted conformance/typecheck CI, and the algorithmic governability adversarial guard has passed.

**Next concrete witnesses:** exact-head native ledger evaluation packet and real Preprod Reveal packet.

# 26. FIRST REAL PREPROD USER GATE — 2026-09-26

The target of the current development cycle is explicitly:

make the first real PRE-RICH user transaction executable from the public DApp on Cardano Preprod using a normal CIP-30 wallet.

This is a deployment gate distinct from FULL CERTIFICATION.

Required witnesses, in order:
1. Green Closure DApp is deployable under the repository Pages subpath.
2. All required Preprod contract/reference-script configuration is present without any wallet seed/private key in the repository.
3. DEMETER can connect through CIP-30.
4. The frontend can obtain authoritative current protocol/profile state.
5. A valid EconomicAdmissionWitness can be produced by the authoritative economic/refinement path for Issue.
6. mintSerialNFT can consume that witness and submit the real atomic Issue transaction.
7. The real Preprod transaction is observed and its exact UTxOs/state are persisted.
8. Beacon synchronization and Reveal use the deployed reference scripts and measured transaction size.
9. Native cardano-ledger evaluation is performed against the exact Preprod transaction context.
10. The resulting user-visible lifecycle/evidence is rendered from observation, not UI intent.

## Current concrete blocker

src/mint.ts already implements the atomic Issue transaction and correctly requires:
- EconomicAdmissionWitness;
- IssueRefinementEvidence;
- verified expiry policy + issuance state;
- authenticated Counter;
- authenticated BeaconRegistry;
- authenticated B1 PrizePool;
- Treasury datum/payment;
- atomic ticket mint + Prize output + Pool continuation.

However, the repository currently has no frontend/runtime producer that constructs an authoritative EconomicAdmissionWitness for Issue. The DApp therefore correctly keeps Buy Tickets fail-closed.

This is now the primary application-to-economic-runtime blocker for the first real user.

Do not:
- synthesize a witness in the frontend;
- fill hashes/EEV/liquidity with placeholders;
- weaken EconomicAdmission;
- bypass the Economic Gate;
- turn the existing Haskell test vector into live authority.

The next implementation task is to bridge the authoritative PRE-RICH economic admission path to the Cardano runtime in a way that preserves the existing evidence-binding checks and can be independently observed/replayed.

## Deployment infrastructure advanced

- dapp.html now uses a relative module path compatible with the GitHub Pages repository subpath.
- .github/workflows/immortal-preprod-pages.yml now provides a gated V5/PRE-RICH Pages deployment.
- The Pages workflow fails closed when required Preprod configuration secrets are absent and never requires or stores a wallet seed.
- .github/workflows/immortal-cardano-preprod.yml no longer cancels an in-flight evidence run when a newer push arrives.

Commits:
- d6ea9d733bdf375268c1c62292d7313e2258e06c — Pages-compatible DApp module path.
- 43ccd2884b787e2393f64799bb6e52650e3af34f — gated Preprod Pages deployment.
- f05f1ab5926da9f1a197e3d5f9c40c0548038024 — preserve Preprod evidence runs.

Status: first-user path IN PROGRESS; frontend deployment infrastructure advanced; authoritative Issue admission bridge remains OPEN.

### Session report

FRONT: First real Preprod user gate
SUBFRONT: DApp deployment + Issue economic admission bridge
HEAD: work/immortal-green-closure after f05f1ab5926da9f1a197e3d5f9c40c0548038024
SOURCE SET: current repository implementation + coordination register
IMPLEMENTATION: Pages path fixed; gated Preprod Pages workflow added; evidence-run cancellation removed
TEST/CI: workflow execution still required
RUNTIME: no new live witness fabricated
CERTIFICATION: OPEN
STATUS: IN PROGRESS
BLOCKER: authoritative EconomicAdmissionWitness producer for Issue
NEXT CONCRETE WITNESS: executable Issue-admission bridge, then real DEMETER-signed Preprod Issue
FILES/COMMITS: d6ea9d7, 43ccd28, f05f1ab


# 27. ISSUE ADMISSION BRIDGE — TRIANGULATED STATUS — 2026-09-26

Repository + Notion triangulation confirms the first-user blocker is an implementation/conformance gap, not an unresolved economic-policy decision.

- The Haskell `PreRichEconomicAdmission` path already composes transition validity, PRE-RICH projection, explicit EEV, executable liquidity, truth/freshness/obligation checks and the IMMORTAL Economic Gate.
- The Cardano Adapter correctly refuses economic submission without `EconomicAdmissionWitness`.
- `mintSerialNFT` already binds `Issue`, the canonical ticket refinement evidence, the authenticated B1 PrizePool input and the liquidity source inputs before signing.
- The current frontend has no authoritative producer for that witness.
- The legacy B1 pool datum can expose aggregate quantities, but `B1LegacyAdapter` explicitly marks the lossless V3 projection unavailable when unresolved tickets, protected-capital fields, class composition or full Jackpot lifecycle are required. Therefore it cannot be silently promoted to canonical V3 admission for a live Issue.
- Notion's current Control Center independently confirms that the remaining gap is implementation/conformance/evidence and that the relayer is not economic authority.

Consequently, the next valid implementation is an observation/refinement bridge that obtains the complete authoritative PRE-RICH economic state required by `PreRichEconomicAdmission`, binds it to the exact Preprod singleton inputs, and emits a replayable witness. A frontend-generated witness, a synthetic zero protected-capital state, or reuse of a Haskell fixture as live authority is prohibited.

The first-user path remains fail-closed until this bridge exists.

## Additional CI hardening

The submitted-transaction Preprod ledger evidence workflow now also preserves an in-flight evidence run (`cancel-in-progress: false`).

Commit: `2882a9a2b824682f7ad7619f2da8c3cbf3e0bc1e`.


# 28. PROGRESSION RULE + ISSUE ADMISSION BRIDGE — 2026-09-26

Closed targeted CI checks are now treated as **PASS/DO NOT REPEAT** unless their inputs or implementation change. Subsequent sessions must spend effort on open gates and their next concrete witness, not re-run or re-report already-closed bounded checks as if they were blockers.

## New implementation

Added `src/preRichIssueAdmissionBridge.ts` and its adversarial tests.

The bridge now defines the missing boundary between an authoritative PRE-RICH admission producer and the Cardano Issue runtime:
- the provider is injected; the browser cannot calculate or synthesize EEV, liquidity, state hashes or gate decisions;
- exact Counter and B1 PrizePool input references are required;
- the exact liquidity-source set is required;
- the authoritative witness must pass the existing EconomicAdmission checks with action class `Issue`;
- the witness's authenticated Pool reference and USDM valuation must equal the exact runtime-observed Pool input;
- PRE-RICH class saleability is checked before the authority provider is invoked.

This is an implementation boundary, not live authority and not deployment evidence. The remaining blocker is to supply the authoritative producer and wire this bridge into the first-user DApp/relayer path. No synthetic witness is allowed.

Commits:
- `6fc0bc6dd77349688f9386f08ba9480c5c2f38ef` — Issue admission bridge
- `5b7a28a6c4f00867bd04fd04c712dc23fd7a172b` — bridge tests

**NEXT:** implement the authoritative producer/refinement runtime and connect it to this bridge; then execute the first real DEMETER/CIP-30 Preprod Issue. Do not revisit the already-green declaration/governability CI unless changed by this work.
