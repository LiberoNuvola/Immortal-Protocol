# IMMORTAL — Cross-Session Coordination & Closure Register

> **Role:** shared operational handoff, source-triangulation register and anti-regression control between concurrent engineering sessions.
>
> **Authority:** this file is **NON-NORMATIVE**. It cannot change protocol semantics. Canonical Constitution/specifications and explicit normative decisions remain authoritative.
>
> **Working branch:** `work/immortal-green-closure`
> **Snapshot:** 2026-09-26
> **Observed HEAD:** `c598b9abf2a8ec931c0128d226584c699d6dfcae`
> **HEAD change:** `docs: refine explicit protocol activity declaration`

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

## F4.3 B3

Target architecture:

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
