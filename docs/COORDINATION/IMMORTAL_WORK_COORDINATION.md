# IMMORTAL — Cross-Session Coordination & Closure Register

> **Role:** shared operational handoff, source-triangulation register and anti-regression control between concurrent engineering sessions.
>
> **Authority:** this file is **NON-NORMATIVE**. It cannot change protocol semantics. Canonical Constitution/specifications and explicit normative decisions remain authoritative.
>
> **Working branch:** `work/immortal-green-closure`
> **Snapshot:** 2026-09-26
> **Observed HEAD:** `2505e2ec5bbbc2b79d34e2009b7eb90bd14cce5d`
> **HEAD change:** `audit: formalize Preprod PRE materialization gate`

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


## 29. ISSUE FIRST-USER WIRING — 2026-09-26

Progressed beyond the previous green boundary without reopening closed checks.

### Implemented

`src/mint.ts` now exposes `mintSerialNFTWithAuthoritativeAdmission`:
- resolves the exact Counter and B1PrizePool UTxOs that will be used by the Issue transaction;
- passes those exact references to `obtainAuthoritativeIssueAdmission`;
- requires the authenticated Pool USDM valuation from the authoritative caller rather than deriving a new valuation in the browser;
- receives the EconomicAdmissionWitness from the injected authoritative producer;
- delegates to the existing `mintSerialNFT` path, which performs the final `submitEconomic(..., 'Issue')` binding immediately before signing.

This closes another **implementation-layer** gap: the admission bridge is no longer an orphan API. It is now on the actual Issue entry path.

### Still explicitly OPEN

This does **not** claim an authoritative producer exists, nor does it claim Preprod execution. The caller must still provide a real producer and authenticated Pool valuation. The next concrete proof is therefore a real producer backed by authoritative observation/refinement, followed by an actual DEMETER/CIP-30 Preprod Issue.

Commit: `01ce8e96903c6c341ab3fc78d8f399470bfd8115`.


# 29. TREASURY ADDRESS — FIRST REAL PREPROD USER GATE — 2026-09-26

The concrete Treasury address is an explicit deployment witness required for the first real PRE-RICH user.

## FACT

- The application configuration uses `VITE_TREASURY_ADDRESS`.
- The Preprod Pages workflow already requires `VITE_TREASURY_ADDRESS` and fails closed if it is absent.
- The repository deliberately does **not** hard-code the deployment Treasury address.
- The Treasury is a protocol script address, not the DEMETER user wallet.
- The exact address must correspond to the actually deployed Plutus V2 Treasury validator and then be independently verified against the Preprod ledger.

## REQUIRED WITNESS

Before the first DEMETER Issue:

1. obtain the exact deployed Treasury validator artifact;
2. derive its Plutus V2 script hash and Preprod script address;
3. set that exact value as the deployment `VITE_TREASURY_ADDRESS` secret;
4. observe the address on Preprod;
5. identify the canonical Treasury UTxO(s) used by the current Genesis/Issue path;
6. bind the observed Treasury reference into the admission/evidence packet;
7. verify that the Issue transaction pays the same canonical Treasury address;
8. verify that no user wallet address is substituted for Treasury.

## NON-REGRESSION

- Never invent or guess the Treasury address.
- Never use DEMETER as Treasury.
- Never derive Genesis activation merely from Treasury UTxO existence.
- Never use legacy `tdThreshold` as the Genesis authority.
- Never expose wallet seed/private keys in repository configuration.
- Do not silently substitute a different Treasury address to make CI or frontend execution pass.

**STATUS: 🔴 OPEN — exact deployed Preprod Treasury address + ledger witness required**

**NEXT CONCRETE WITNESS:** deployed Treasury script hash/address pair + exact Preprod Treasury UTxO observation.


### 29.1 Deterministic derivation completed — 2026-09-26

From the exact current `plutus/out/treasury.plutus.json` artifact:

- Plutus version: **V2**
- Treasury script hash: `7a2a58b992e29d10eae279ae8fa93bb44d854ff832f0823b09b19708`
- Derived Preprod script address: `addr_test1w9az5k9ejt3f6y82ufu6araf8w6ymp20lqe0pq3mpxcewzq4f8jsf`

The derivation is reproducible through `audit/pre-genesis-genesis/derive-preprod-treasury-address.mts` and the associated CI workflow.

**IMPORTANT:** this closes the derivation part, not the deployment/ledger part. The address is not promoted to canonical live Treasury until a Preprod ledger query observes the expected Treasury UTxO at exactly this address and the UTxO is bound into the Genesis/Issue evidence packet.



# 30. ISSUE DECISION CANONICAL INTEGRITY BOUNDARY — 2026-09-26

Progressed beyond the bridge: the injected authoritative Issue producer now has an explicit integrity gate before an EconomicAdmissionWitness can enter the Cardano adapter.

### Implemented

Added:
- `Adapter/CARDANO/observation/AuthoritativeIssueAdmissionDecision.ts`
- validation of canonical decision hashes (`stateHash`, `actionFingerprint`, `postStateHash`);
- non-negative EEV/liquidity constraints;
- exact binding between the decision's observation reference and `ExecutableLiquidityObservation`;
- exact binding between authenticated Pool input/value and the liquidity observation;
- fail-closed check that required immediate liquidity does not exceed the observed executable liquidity.

Updated:
- `Adapter/CARDANO/observation/AuthoritativeIssueAdmission.ts` now validates the decision before constructing the runtime witness.
- adversarial tests cover mismatched observation identity and malformed state hashes.

Commits:
- `e83cfb42ef54574a07f66bfefa096b6eb05ec5f9` — canonical Issue decision integrity boundary
- `f5b0fd7dc1d8117a12dc3357b9a6b14c2a922008` — provider validation
- `2e0f01c82461041492b52de4fccae77b75240b3e` — adversarial tests

### What this closes

The runtime bridge can no longer accept a merely shape-valid object whose internal observation/value bindings contradict each other.

### What remains OPEN

This is still **not** the authoritative economic producer.

The remaining source-of-truth gap is precise:

`authoritative decision artifact -> canonical PRE-RICH V3 observation/refinement -> existing Haskell PreRichEconomicAdmission -> decision artifact -> Cardano adapter`

The missing component must obtain the real current PRE-RICH V3 pre-state and authoritative EEV/liquidity/truth evidence, invoke the existing economic admission path, and emit the resulting replayable decision. It must not reimplement the economics in frontend TypeScript.

**NEXT CONCRETE WITNESS:** a real authoritative Issue decision produced from the current Preprod state, then consumed by the existing bridge, followed by the first DEMETER/CIP-30 Issue transaction.


# 31. AUTHORITATIVE ISSUE PRODUCER — 2026-09-26

The previous blocker has progressed from an interface-only bridge to an actual economic producer in the authoritative layer.

### Implemented

- `PRE-RICH/profile/PreRichIssueDecision.hs` calls the existing `preRichEconomicAdmission` directly.
- It produces canonical pre-state, post-state and action SHA-256 fingerprints from explicit serialization.
- It carries the authoritative EEV, executable liquidity and required immediate liquidity returned by the admission result.
- `plutus/export/IssueAdmission.hs` exposes the producer as a JSON stdin/stdout executable.
- Economic integers cross JSON as decimal strings to avoid JavaScript precision loss.
- `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` connects that producer to the existing Cardano witness boundary and binds the result to the exact observed Pool input/value and observation reference.

### Architectural result

The economic decision is now made by the existing Haskell PRE-RICH/IMMORTAL admission path. The Node/adapter layer does not reimplement the gate; it only transports, verifies and binds its result to concrete Cardano UTxOs.

This matches the eUTXO boundary: transactions explicitly name the concrete inputs and outputs, while validators receive the transaction context rather than querying arbitrary mutable state. citeturn0search0turn0search1

### Remaining OPEN — live observation only

The implementation gap is now reduced to the real-world observation source:

1. obtain the exact current Preprod Counter + B1 PrizePool state;
2. obtain the authoritative V3 class/protection/Jackpot state and verified EEV/truth/freshness evidence;
3. feed that exact observation into `issue-admission`;
4. consume the returned decision through `HaskellIssueAdmissionProvider`;
5. execute the DEMETER/CIP-30 Issue transaction;
6. persist the exact transaction/UTxO evidence.

No synthetic witness or fixture is being promoted to live authority.

Commits:
- `a597d472a314749918782f9ebf4e83f0b15ede89` — authoritative Haskell Issue producer
- `aec29952961a024d95e56b417d4a424c36661c10` — exposed producer module
- `7d906cf8cac6b6a768a89cfe10567ea0c0bb50b7` — producer tests
- `635890b2efdc08804eb3815baa52a5ca4366fb47` — JSON producer executable
- `e7342592d5bdd7bfd7de8400c2cd402faf72de97` — executable registration
- `cbf6df40198d224f47f86228101d1501a8a27ac6` — Node runtime bridge
- `23e248577f9ef0546eb31131195446c778b2ec8d` — lossless integer transport

# 32. V3 ECONOMIC STATE CARRIER — 2026-09-26

The first-user Issue producer is no longer blocked by a missing economic decision producer. The remaining state-authority gap has been isolated and the on-chain carrier implementation has begun.

## Implemented

- `PRE-RICH/profile/V3EconomicStateCarrier.hs`
  - application-owned singleton state carrier;
  - explicit `V3EconomicStateDatum`;
  - monotonic state version;
  - exactly one carrier input and continuing output;
  - singleton authority-token preservation;
  - full V3 state structural validation;
  - class exposure/unresolved consistency checks;
  - protected-capital fields carried explicitly;
  - control and Jackpot state carried explicitly.
- `PRE-RICH/profile/V3EconomicStateCarrierMintPolicy.hs`
  - deployment-parameterized one-shot authority token;
  - concrete seed `TxOutRef`;
  - exactly one configured carrier token.
- `src/preprodEconomicStateObservation.ts`
  - fail-closed singleton discovery and V3 datum decoding;
  - no defaults;
  - no derivation from B1/Treasury;
  - exact carrier UTxO reference returned.
- `src/preprodEconomicStateObservation.test.ts`
  - singleton ambiguity rejection;
  - malformed/unsupported Jackpot rejection;
  - canonical class/state decoding.
- Plutus export/Cabal wiring added.
- Genesis carrier workflow now watches, builds and exports the V3 carrier artifacts.

## Boundary

This carrier is deliberately separate from:

- Treasury;
- B1PrizePool;
- GenesisRegimeCarrier;
- BeaconRegistry.

B1 remains the executable-liquidity/accounting surface. The V3 carrier is the canonical economic-state observation surface.

## Still OPEN

The implementation is **not** deployment evidence.

A concrete deployment still requires:

1. a real seed UTxO;
2. deployment of the one-shot carrier token;
3. creation of the canonical initial V3 state by an explicitly authorized Genesis/deployment transition;
4. exact Preprod carrier UTxO observation;
5. binding of that state to the Haskell Issue decision;
6. first DEMETER/CIP-30 Issue;
7. persisted post-state evidence.

No GoldenVector/test state has been promoted to live authority.

## Important next engineering step

The carrier validator currently provides the state/concurrency boundary. It does not yet authorize arbitrary economic transitions by itself. Issue/Reveal/Claim/Expire must be bound to the consumed/reference V3 state through their respective application validators before the carrier can be treated as the complete canonical transition authority.



## 33. V3 ECONOMIC STATE CARRIER HARDENING — 2026-09-26

Commit `a9a5fab9829cdbbfee19cd9846acd39eaf17734a` hardens the V3 application-owned economic state carrier without changing any economic constant or Genesis semantics.

- The carrier now validates the consumed V3 state as well as the successor state.
- The configured singleton token is counted across **all** transaction inputs and outputs, so an additional copy cannot coexist with the authenticated carrier input/output.
- The existing one-input/one-output/state-version increment rule remains unchanged.
- This closes a validator-level integrity gap; it does **not** close deployment, production singleton identity, initial-state provenance, or first Preprod Issue evidence.
- CI status for this commit is not yet observed; no workflow run is claimed green.

The next deployment blocker remains the same: a real seed UTxO plus an explicitly sourced canonical initial V3 state, followed by production singleton observation and binding to Issue.


## 34. MODERN CIP-30 WALLET BOUNDARY — 2026-09-26

The Preprod DApp wallet layer was refactored without changing economic authority or protocol semantics.

- `src/wallet.ts` now exposes explicit CIP-30 discovery and wallet selection instead of probing providers sequentially and silently taking the first wallet.
- The session records wallet ID/name, API version, address and network.
- The preferred wallet ID is persisted locally only for UX; private keys and seed phrases remain in the wallet.
- CIP-30 account/network change events are observed. The application remains Preprod-only and fails closed on a mainnet network event.
- `src/main.ts` now presents a wallet picker, wallet identity, address, balance and Change Wallet flow.
- `src/wallet.test.ts` covers provider discovery and verifies that discovery does not auto-enable wallets.
- Adapter CI now executes the wallet discovery test and the existing frontend build.
- This is a frontend/application boundary improvement only. It does not grant the wallet economic authority and does not alter IMMORTAL, Genesis, Treasury, Oracle, or V3 carrier semantics.

CI for the latest wallet commits is not yet observed; no green status is claimed until the workflow run is available.


## 34. V3 CARRIER OBSERVATION/VALIDATION ALIGNMENT — 2026-09-26

- Canonical V3 jackpot lifecycle has four constructors: Inactive, Locked, Payable, Closed.
- Preprod V3 observer now preserves all four states instead of collapsing/rejecting Payable and Closed.
- V3 carrier validator now requires exactly the canonical eight classes in ID order 0..7 and requires the active class to exist in the carrier state.
- Observer tests cover Payable preservation and singleton ambiguity.
- No economic constant or Genesis/Treasury authority was changed.
- Latest branch HEAD: `98e420cd3aa41e6615ba671b65dd36f9406ad820`.
- GitHub Actions triggered by this HEAD are currently pending; no CI-green claim is made yet.


## 35. V3 PREPROD DEPLOYMENT HELPER — 2026-09-26

- Added `scripts/deployV3Carrier.ts` and `npm run deploy:v3-carrier`.
- The one-shot V3 carrier policy is parameterized from the explicitly selected real seed UTxO; policy ID and carrier address are deployment-derived.
- Initial V3 datum is mandatory explicit CBOR input; the helper never synthesizes a default economic state.
- Deployment requires local/admin `DEPLOYER_MNEMONIC`; browser/CIP-30 never receives or handles this secret.
- After submission the helper queries the derived carrier address and fails unless exactly one singleton UTxO is observed.
- Public deployment evidence is written to `audit/preprod-issue/v3-carrier-deployment.json`.
- This helper does not authorize Issue, Genesis, Treasury or economic transitions; it only establishes the V3 state carrier singleton.


## 36. V3 INITIAL STATE ADMISSION — 2026-09-26

- The live V3 carrier cannot use `IMMORTAL/conformance/GoldenVectors.hs::baseState`: that is a one-class conformance fixture, while the production carrier requires exactly classes 0..7.
- `tcsCap` and `tcsSaleable` are classified as PRE-RICH/application state, not universal IMMORTAL constants; the hysteresis layer also requires externally supplied exact capacity costs.
- Therefore no production initial datum is being invented from fixture values.
- Added: `audit/preprod-issue/V3-INITIAL-STATE-ADMISSION-GAP.md`.
- Deployment helper remains fail-closed and requires explicit `V3_CARRIER_INITIAL_DATUM_CBOR`.
- Closure requires an explicit deployment profile covering all eight classes, caps, control, protected-capital fields, Jackpot state, version and reproducible datum encoding.
- Once declared, proceed directly to singleton deployment → exact observation → Issue-state binding → first DEMETER/CIP-30 Issue.


## 37. V3 INITIAL DATUM STRUCTURAL HARDENING — 2026-09-26

- `scripts/deployV3Carrier.ts` now validates the supplied initial CBOR as the complete `V3EconomicStateDatum` shape before constructing any transaction.
- The gate requires: 8 canonical classes 0..7; non-negative fields; unresolved <= issued; exact class exposure; reserve/count sums; valid control bounds; active class present, saleable and below cap; valid Jackpot state/status.
- This is structural validation only. It does not invent or certify deployment-specific caps/protected-capital values.
- The deployment remains blocked until an explicit PRE-RICH deployment profile supplies those values and their authority/derivation.


## 38. EXPLICIT PREPROD INITIAL V3 PROFILE — 2026-09-26

- Declared `PRE-RICH/profile/PreRichPreprodDeploymentProfile.ts` as the explicit deployment/application profile for the first real Preprod V3 carrier.
- Initial state is empty of tickets/liabilities/reserves; class 0 (1 USDM) is active; HighestClassEverActivated=0; only class 0 is initially saleable.
- All eight classes have explicit cap=10. This is a deployment parameter, not an IMMORTAL universal constant.
- Protected-capital components start at zero because the initial state contains no obligations; Jackpot starts inactive with zero locked amount.
- Added deterministic Plutus datum encoder: `src/preprodV3InitialDatum.ts` and printer `npm run v3:initial-datum`.
- Added deterministic/shape test: `src/preprodV3InitialDatum.test.ts`, wired into Adapter conformance CI.
- Deployment helper still requires the operator to supply the generated CBOR explicitly; no hidden state synthesis.
- Next execution gate is now operational: generate datum → select explicit seed UTxO → deploy singleton → observe exact carrier UTxO → bind Issue admission.


# 39. V3 PREPROD EXECUTION BLOCKER — 2026-09-26

The design/encoding gate for the first V3 Preprod singleton is now closed. The remaining blocker is purely operational and is intentionally fail-closed.

Observed on the current branch:
- the explicit PRE-RICH Preprod profile exists;
- deterministic initial V3 datum generation exists;
- structural validation exists in the deployment helper;
- no repository file contains a real deployment seed UTxO;
- the latest commit has no observed GitHub Actions workflow run/status yet.

Therefore the next execution cannot be fabricated from a fixture, a Yaci wallet, or a guessed transaction reference.

## Required operator witness

Provide/select:
1. a real Preprod deployer UTxO reference: `<txHash>#<outputIndex>`;
2. the corresponding local/admin signer path for `npm run deploy:v3-carrier`;
3. the generated output of `npm run v3:initial-datum`.

The helper will derive the one-shot policy ID and carrier address from that exact seed, submit the singleton, and require exactly one observed carrier UTxO.

After deployment, the evidence gate is:
`seed UTxO -> derived policy ID -> derived carrier address -> submitted tx -> exact singleton UTxO -> V3 observation -> Issue admission binding`.

No Genesis, Treasury, Issue, or economic authority is inferred from the deployment helper itself.

## CI observation rule

As of this coordination update, the latest profile/datum commits have no workflow run/status observable through the GitHub integration. No green CI state is claimed until a real run is observed.


# 30. ISSUE ADMISSION PRODUCER — EXECUTABLE PATH FOUND — 2026-09-26

The previously identified "authoritative producer" gap is narrower than initially stated.

## Existing canonical producer

The repository already contains:

- `PRE-RICH/profile/PreRichIssueDecision.hs` — authoritative PRE-RICH Issue decision path;
- `produceIssueDecision` — calls `preRichEconomicAdmission` using the canonical PRE-RICH profile;
- `plutus/export/IssueAdmission.hs` — executable JSON boundary (`cabal run issue-admission`) which parses the complete IssueDecisionInput and returns an admitted decision or fails closed;
- `src/preRichIssueAdmissionBridge.ts` — runtime boundary that refuses any witness not produced by an injected authoritative provider and binds it to exact Counter/Pool/liquidity inputs;
- `src/mint.ts::mintSerialNFTWithAuthoritativeAdmission` — actual Issue entry point already wired to that bridge.

This means we must **not create a second economic implementation in TypeScript**. The Haskell executable is the intended economic authority; TypeScript must only transport observed/refinement inputs and consume its result.

## Exact remaining blocker

The missing piece is now **transport/runtime integration**, not economic decision logic:

`Preprod observation/refinement → canonical IssueDecisionInput JSON → cabal run issue-admission → authoritative IssueDecision → EconomicAdmissionWitness → mintSerialNFTWithAuthoritativeAdmission → CIP-30 signing`

The producer must receive complete authoritative inputs:

- exact V3 pre-state;
- Issue class/price;
- pre-state EEV;
- candidate EEV;
- immediately executable liquidity;
- required immediate liquidity;
- truth verification;
- EEV freshness;
- obligations completeness;
- certified Ω successor condition;
- decision reference;
- observation reference.

No field may be synthesized from browser UI state, legacy B1 aggregation, or a conformance fixture.

## Non-regression

- Do not duplicate `preRichEconomicAdmission` in TypeScript.
- Do not turn `PreRichCardanoObservationProjection.ts` into an economic authority; it remains an observation/refinement projection.
- Do not expose `DEPLOYER_MNEMONIC` or any wallet seed to the browser.
- Do not claim that the executable producer itself is Preprod evidence until its inputs are sourced from the actual observed singleton state and the resulting Issue is executed on Preprod.

**STATUS: 🟡 IMPLEMENTATION PATH IDENTIFIED / RUNTIME TRANSPORT OPEN**

**NEXT CONCRETE IMPLEMENTATION:** wire a non-browser runtime (relayer/service) to invoke the existing `issue-admission` executable from authoritative observed inputs, then adapt its output into `EconomicAdmissionWitness` with exact Pool/liquidity binding.


## 30.1 CURRENT HEAD RECONCILIATION — 2026-09-26

- `src/mint.ts` now actually exports `mintSerialNFTWithAuthoritativeAdmission` as a thin fail-closed wrapper over `mintSerialNFT`.
- The wrapper requires an injected `AuthoritativeIssueAdmissionProvider` and authenticated Pool USDM valuation; it does not compute EEV, liquidity, hashes, or gate decisions.
- Final Counter/Pool observation and EconomicAdmission input binding remain inside the existing Issue transaction path.
- Current HEAD: `a8361c518aa08a097113e707a537f3a1aaa9365d`.
- This is implementation progress only; it does not constitute Preprod execution or an authoritative producer witness.


# 40. PREPROD PRE BOOTSTRAP TRIANGULATION — 2026-09-26

The PRE bootstrap question was re-triangulated against current GitHub implementation and Notion provenance before any new token/policy work.

## Confirmed

- The application currently identifies PRE-RICH as policy `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c` with asset name `5052452d52494348`.
- Genesis admission requires an observed, canonical Treasury PRE quantity whose independently verified value is >= 4,000 USDM.
- The Treasury observation/admission path does not mint PRE; it validates observed PRE identity, quantity, Oracle price, freshness and publisher.
- The existing Yaci Genesis trace is explicitly a **non-production fixture** and uses synthetic test identities. It must not be promoted to the real Preprod token.
- Gate 37 defines the canonical PRE identity as the Mainnet PRE/Snek asset and deliberately refuses synthetic State-0 evidence.
- Notion's bootstrap/liveness closure treats the Genesis threshold as already canonical and separates the PRE Treasury bootstrap from PrizePool liquidity.

## Critical deployment conclusion

The current corpus contains **no verified evidence of the canonical PRE asset already existing on Preprod**, and contains no authoritative Preprod mint/distribution transaction for that asset.

Therefore:

- do **not** create a second guessed PRE policy and call it canonical PRE;
- do **not** ask the first user/Lace wallet to supply PRE it does not have;
- do **not** promote the Yaci synthetic PRE mint fixture to production;
- do **not** infer that the Mainnet PRE asset exists on Preprod merely because the application configuration references its Mainnet policy ID;
- do **not** block the first-user CIP-30 boundary by requiring PRE in the user's wallet.

## Exact remaining operational gate

The deployment owner must provide or establish an authoritative Preprod PRE materialization path that is compatible with the canonical PRE identity/deployment policy. Once a real PRE-bearing Preprod UTxO exists, the already-implemented path is:

`canonical PRE UTxO → protocol Treasury → verified Oracle → Genesis admission → V3 state → Lace/CIP-30 first user`.

This is classified as a **deployment/materialization gate**, not a new IMMORTAL economic decision.

## Non-regression rule

Any Preprod-specific token used solely for local/Yaci testing must be explicitly labelled fixture/test deployment and must never be substituted for the canonical PRE identity in Genesis certification.

**STATUS: 🟡 TRIANGULATED / PREPROD MATERIALIZATION WITNESS OPEN**


# 41. CURRENT HEAD / PRE MATERIALIZATION RECONCILIATION — 2026-09-26

The branch reference above is now reconciled with the actual Git ref.

## Verified repository state

- Branch: `work/immortal-green-closure`
- Observed HEAD: `2505e2ec5bbbc2b79d34e2009b7eb90bd14cce5d`
- Parent: `f3a3a1b6c76c21ae28e250ac867998ea8e564fa3`
- Latest commit: `audit: formalize Preprod PRE materialization gate`
- `audit/pre-genesis-genesis/PREPROD-PRE-MATERIALIZATION-GATE-v0.1.md` is now part of the current branch.

## Historical PRE evidence re-check

The repository contains the historical acquisition procedures for:

- transaction `0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`;
- canonical PRE policy `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`;
- PRE asset name `5052452d52494348`;
- Blockfrost transaction CBOR/redeemer acquisition;
- Koios provider-indexed mint-redeemer acquisition.

These scripts acquire transaction/redeemer evidence, but **they do not contain the historical minting-policy source/script needed to deterministically reproduce the policy**.

## Current classification

`PREPROD PRE MATERIALIZATION = OPEN`

The exact missing artifact is now narrowed to an authoritative Preprod materialization witness compatible with the canonical PRE identity. Historical Mainnet transaction evidence alone does not establish Preprod existence.

No new token policy, synthetic Yaci asset, or guessed minting script may be introduced as a substitute.

## Parallel execution rule

While this gate is open, all independent fronts may continue. No front may silently reinterpret the canonical PRE identity or weaken Genesis admission to bypass the materialization gate.
