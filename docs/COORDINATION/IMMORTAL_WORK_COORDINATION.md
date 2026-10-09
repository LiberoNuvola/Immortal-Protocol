# IMMORTAL — Cross-Session Coordination & Closure Register

> **Role:** shared operational handoff, source-triangulation register and anti-regression control between concurrent engineering sessions.
>
> **Authority:** this file is **NON-NORMATIVE**. It cannot change protocol semantics. Canonical Constitution/specifications and explicit normative decisions remain authoritative.
>
> **Working branch:** `work/immortal-green-closure`
> **Snapshot:** 2026-09-27
> **Observed HEAD:** `dbe1ec746685ba5d7524050130e24750c1e35a1a`
> **HEAD change:** `docs: register Orynq anchor-id triangulation`

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
- exact Materios storage proof;
- StateRoot → exact value binding;
- independent verification.

### 2026-09-27 triangulation result

The upstream Materios `orinq-receipts` pallet was inspected at the source level.

Confirmed:

```
Anchors<T> =
  StorageMap<_, Blake2_128Concat, H256, AnchorRecord<T::AccountId>, OptionQuery>
```

`AnchorRecord` contains:

- `content_hash: [u8; 32]`
- `root_hash: [u8; 32]`
- `manifest_hash: [u8; 32]`
- `created_at_millis: u64`
- `submitter: AccountId`

Critical boundary finding:

- `submit_anchor` accepts `anchor_id: H256` explicitly;
- the pallet executes `Anchors::<T>::insert(anchor_id, record)`;
- therefore the inspected source does **not** establish `anchor_id` as a deterministic function of `roundId`, `checkpointRef`, block number or StateRoot.

Independent Orynq SDK triangulation adds an observed producer convention:

`anchorId = SHA256(rootHash_bytes || manifestHash_bytes)`

The SDK then submits that derived ID as `OrinqReceipts.submit_anchor(anchorId, contentHash, rootHash, manifestHash)`.

This is **not yet a canonical B3 rule**. It is application/SDK evidence only until the PRE-RICH canonical binding specification explicitly adopts or rejects the formula.

This closes the **storage-schema ambiguity**, but leaves the separate semantic-binding gate:

`canonical checkpoint → canonical anchorId → AnchorRecord.root_hash`

No guessed key derivation is permitted.

Research packet:
`docs/research/B3-C-POC2-MATERIOS-ANCHOR-KEY-TRIANGULATION-2026-09-27.md`

**Status: 🟡 STORAGE SCHEMA IDENTIFIED / 🔴 REAL STORAGE PROOF + CANONICAL CHECKPOINT→ANCHOR BINDING OPEN**

## F5.4 Succinct proof

Proof system is not canonically fixed.

**Status: 🔴 OPEN**

## F5.5 Materios execution-proof transport — B3 medley step

The external Materios node repository was inspected directly.

Confirmed node boundary:
- `Flux-Point-Studios/materios/partnerchain/node/src/rpc.rs` is the node RPC aggregation point.
- The node already owns `FullClient`.
- The workspace is pinned to `polkadot-stable2409-4`.
- Existing RPCs are System, Orinq Receipts and MOTRA.
- The intended proof path is the existing Substrate `sc_client_api::ProofProvider::execution_proof(...)` / `CallExecutor::prove_execution` path.

A dedicated implementation task has been opened in the Materios repository:
- Issue #50: `materios_b3_calculateCommitteeProof`
- Scope: thin RPC transport only; exact block + runtime method + call-data binding; deterministic proof envelope; no selector reimplementation.
- Required later witness: a real finalized Materios block plus separate GRANDPA finality evidence.

This is **not** B3 certification. It is implementation transport infrastructure.

Medley boundary remains:
`A = native/reference verification` (reference/differential path)
`B = succinct proof production` (future production proof path)
`C = proof technology choice` (implementation technique inside B)
`D = canonical Beacon/UTxO registry` (verified state publication)

A/B are not parallel production acceptance paths. D must advance only from verified proof/evidence, not a publisher signature alone.

**Status: 🟡 IMPLEMENTATION TASK OPEN / REAL FIXTURE + VERIFICATION OPEN**

## F5.5b — IMMORTAL-side execution-proof consumer boundary

The IMMORTAL-side adapter now requires an explicit MateriosExecutionProofVerifier before an external-runtime evidence envelope can cross into VerifiedAuthoritySetTransition.

The adapter enforces:
- explicit external-runtime evidence class;
- execution-proof chain binding to the canonical checkpoint;
- execution-proof block binding to the finalized checkpoint;
- proof-system agreement with the authority-transition statement;
- injected execution-proof verification before authority-transition verification.

The adapter does not implement Materios execution-proof cryptography, authority selection, GRANDPA verification, or runtime execution.

Two bounded tests cover:
- rejection when the execution-proof verifier returns false;
- crossing the boundary only when both execution-proof and authority-transition verifiers accept.

**Status: 🟡 IMMORTAL CONSUMER BOUNDARY CLOSED / REAL CRYPTOGRAPHIC VERIFIER + REAL MATERIOS WITNESS OPEN**

## F5.5a — Real Materios fixture contract

Added `poc/materios-grandpa/test/MATERIOS-B3-REAL-FIXTURE-CONTRACT-v1.md`.

The contract now fixes the evidence packet before a real fixture exists:
- exact finalized checkpoint/header;
- real GRANDPA justification and set id;
- exact genesis/selection context;
- native Materios execution-proof witness;
- StateRoot/storage proof where applicable;
- separate verification outputs;
- final crossing into `VerifiedAuthoritySetTransition`.

This is deliberately a **fixture/evidence contract**, not proof and not a selector implementation.

**Status: 🟡 CONTRACT FIXED / REAL WITNESS OPEN**

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

## 44.28 ADAPTER LANDSCAPE / REFERENCE CONFORMANCE — 2026-09-27

The adapter research set has been consolidated under `Adapter/README.md` as a non-normative landscape index.

Materialized trust/conformance artifacts now include:
- `Adapter/REFERENCE/docs/README.md`;
- `Adapter/REFERENCE/docs/CONFORMANCE-METHODOLOGY.md`;
- `Adapter/SOLANA/docs/SOLANA-TRUST-MODEL.md`;
- `Adapter/COSMOS/docs/COSMOS-TRUST-MODEL.md`;
- `docs/research/B3-C-MATERIOS-IBC-LIGHT-CLIENT-RESEARCH-2026-09-27.md`.

The Reference Adapter is explicitly derived from `EconomicKernel.hs`, has no deployment target, and compares canonical economic state transition-by-transition. It is not a second normative economic authority.

Solana remains a trust-model draft only. Its open boundaries are bounded CU execution, account persistence/rent, CPI authority, finality, leader-information/order risk and randomness.

Cosmos remains a trust-model draft only. IBC is treated as a candidate verification mechanism for remote finality/state authenticity, not as a randomness primitive and not as automatic system-wide B3. Relayers remain transport/liveness actors, not economic authorities.

The Materios↔IBC research pass explicitly preserves the Materios non-contamination firewall. It does not modify Materios consensus, authority selection, canonical anchor semantics or the existing B3 proof boundary.

**STATUS: 🟡 ADAPTER RESEARCH INDEX + REFERENCE METHODOLOGY MATERIALIZED / 🔴 ALL NON-CARDANO IMPLEMENTATIONS AND REAL CONFORMANCE EVIDENCE OPEN**

## 44.29 ADAPTER LANDSCAPE PATH AUDIT — 2026-09-27

A path-consistency audit was performed against the current working tree.

Confirmed existing trust-model paths:
- `Adapter/BITCOIN/docs/BITCOIN-TRUST-MODEL.md`
- `Adapter/SUBSTRATE/docs/SUBSTRATE-TRUST-MODEL.md`
- `Adapter/ETHEREUM/docs/ETHEREUM-TRUST-MODEL.md`
- `Adapter/SOLANA/docs/SOLANA-TRUST-MODEL.md`
- `Adapter/COSMOS/docs/COSMOS-TRUST-MODEL.md`
- `Adapter/REFERENCE/docs/README.md`
- `Adapter/REFERENCE/docs/CONFORMANCE-METHODOLOGY.md`

The Adapter Landscape now points to these actual paths. No top-level `BITCOIN-TRUST-MODEL.md` or `SUBSTRATE-TRUST-MODEL.md` is assumed.

The Substrate/Materios trust model is explicitly DRAFT / OPEN DECISION and does not promote GRANDPA, runtime execution, storage proofs or execution-proof transport to B3 by themselves.

The Bitcoin trust model likewise keeps RGB/client validation distinct from B3 and does not authorize implementation.

**STATUS: 🟢 PATH CONSISTENCY CLOSED / 🟡 ADAPTER RESEARCH AND CONFORMANCE REMAIN OPEN**

## 44.30 REFERENCE CONFORMANCE EXECUTION AUDIT — 2026-09-27

The Reference Adapter boundary was checked against the actual repository rather than the documentation alone.

Confirmed:
- `Adapter/REFERENCE/docs/README.md` defines the intended Reference Adapter as a derived artifact over `EconomicKernel.hs`.
- `Adapter/REFERENCE/docs/CONFORMANCE-METHODOLOGY.md` defines deterministic fixtures and transition-by-transition differential comparison.
- Existing Haskell tests already exercise the canonical kernel/projection boundary, including `GoldenVectorsTest.hs`, `ProtectedCapitalConformanceTest.hs`, `ProjectionBoundaryConformanceTest.hs` and `EconomicAdmissionTest.hs`.

Important gap:
- no executable Reference Adapter implementation was found under `Adapter/REFERENCE/`;
- therefore the existing Haskell tests must not be relabeled as Reference Adapter execution;
- no cross-adapter differential PASS can be claimed yet.

The correct next implementation gate is therefore narrow: build a thin Reference Adapter wrapper around the existing kernel, with canonical fixture serialization and canonical-state projection, without introducing new economic formulas or policy.

No economic redesign is justified by this finding.

**STATUS: 🟡 KERNEL/CONFORMANCE TEST FOUNDATION EXISTS / 🔴 REFERENCE ADAPTER EXECUTION + DIFFERENTIAL HARNESS OPEN**

## 44.31 REFERENCE ADAPTER — FIRST EXECUTABLE WRAPPER — 2026-09-27

Materialized the first thin executable Reference Adapter at `Adapter/REFERENCE/ReferenceAdapter.hs`.

Implementation boundary:
- delegates transitions directly to `EconomicTransitionV3`;
- therefore inherits canonical `EconomicKernel` semantics rather than reimplementing economic rules;
- replays ordered transition traces;
- compares every expected post-state field, including classes, control history and jackpot state;
- adds a dedicated `ReferenceAdapterTest.hs` suite with Issue → Reveal → Expire positive replay and mutated-post-state rejection;
- registered in the existing `pre-rich-plutus.cabal` package.

This closes the previous "no executable Reference Adapter implementation" gap at the wrapper level.

It does **not** close live-adapter differential conformance, external-chain certification, or runtime evidence. CI execution for the new suite is still required before declaring the wrapper green.

**STATUS: 🟢 REFERENCE WRAPPER MATERIALIZED / 🟡 EXECUTION+CI VERIFICATION OPEN / 🔴 LIVE DIFFERENTIAL CONFORMANCE OPEN**

## 44.32 REFERENCE ADAPTER CI WIRING — 2026-09-27

The existing Genesis Regime Carrier workflow was extended to include `Adapter/REFERENCE/**` in its change triggers and to execute `cabal test reference-adapter-tests` after the package build.

The workflow definition itself is present on the coordination branch. No workflow run/status is attached to the connector-visible commits, so the new suite remains **unverified by CI** until GitHub executes the workflow.

No local build result is being claimed because the execution environment cannot resolve GitHub externally.

**STATUS: 🟢 WRAPPER + TEST + CI WIRING MATERIALIZED / 🟡 CI EXECUTION EVIDENCE OPEN / 🔴 LIVE DIFFERENTIAL CONFORMANCE OPEN**

## 44.33 REFERENCE ↔ CARDANO EXECUTABLE DIFFERENTIAL — 2026-09-27

A cross-language differential witness is now materialized.

- `Adapter/REFERENCE/export/ReferenceAdapterGolden.hs` executes the canonical Haskell Reference Adapter over an eight-class canonical V3 fixture and emits deterministic state records.
- `src/__tests__/reference-cardano-differential.test.ts` runs that executable reference through Cabal and compares its initial, Issue and Reveal states against `projectCardanoToImmortalV3` field-for-field.
- The comparison deliberately treats the Cardano TypeScript projection as the observed adapter-side projection and the Haskell kernel as the semantic reference; no second economic formula is introduced.
- The Genesis Regime Carrier CI workflow now runs the differential after Node dependencies are installed.

This is still fixture-level conformance, not live-ledger certification. It does not prove Cardano consensus/finality, randomness, or real Preprod execution.

**STATUS: 🟢 EXECUTABLE REFERENCE↔CARDANO DIFFERENTIAL MATERIALIZED / 🟡 CI EXECUTION EVIDENCE OPEN / 🔴 LIVE PREPROD DIFFERENTIAL OPEN**

## 44.34 FIRST-USER ISSUE ADMISSION BOUNDARY — 2026-09-27

The real PRE-RICH Sale path was traced end-to-end against the current working tree.

Confirmed executable path:
- `src/mint.ts` builds the atomic Issue transaction;
- Counter input, B1PrizePool input, Ticket mint, Pending PrizeDatum, Treasury payment and ticket delivery are assembled in the same transaction;
- submission uses `CardanoExecutionAdapter.submitEconomic(..., 'Issue')` and therefore cannot bypass the Economic Gate;
- `src/preRichIssueAdmissionBridge.ts` binds the admission witness to the exact Counter/Pool inputs and authenticated Pool valuation.

The remaining blocker is precise and intentional:
- no authoritative `AuthoritativeIssueAdmissionProvider` implementation is currently materialized in the repository;
- the browser must not calculate or manufacture EEV, ProtectedCapital, viability, Ω, state hashes, action fingerprints or admission decisions;
- the existing `EconomicAdmissionWitness` type is an admission boundary, not itself an authority;
- the existing Relayer is a Beacon/Treasury operational component and is not authorized to become an economic decision-maker merely to unblock the DApp.

Therefore the First User page must keep **Buy Ticket = OPEN / admission unavailable** until an authoritative producer is connected. Creating a frontend mock, hard-coded witness, or local economic calculator would violate the existing no-side-door boundary.

Required next witness:
1. authoritative Issue observation/refinement producer;
2. exact Counter + B1PrizePool input binding;
3. authenticated Pool USDM valuation;
4. canonical pre-state/action/post-state fingerprints;
5. explicit decision reference + observation reference;
6. `EconomicAdmissionWitness` validation;
7. real Preprod Sale submission and persisted transaction/UTxO evidence.

**STATUS: 🟢 SALE/ADAPTER BOUNDARY VERIFIED IN CODE / 🔴 AUTHORITATIVE ISSUE PRODUCER + REAL PREPROD SALE OPEN**

## 44.35 AUTHORITATIVE ISSUE TRANSPORT BOUNDARY MATERIALIZED — 2026-09-27

Added `Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts` as an explicit transport/validation boundary for the missing Issue admission producer.

It:
- requires an explicitly identified producer (`id` + `version`);
- accepts a provider rather than calculating economic truth;
- delegates to the existing `preRichIssueAdmissionBridge`;
- validates the resulting `EconomicAdmissionWitness` against the exact Counter/Pool/liquidity references;
- rejects wrong action class or mismatched liquidity provenance.

Added regression coverage in `Adapter/CARDANO/runtime/__tests__/AuthoritativeIssueAdmission.test.ts` for positive binding, wrong action class and wrong liquidity source.

This is **not** an authoritative economic producer. It is the boundary the real producer must satisfy. No browser mock, hard-coded production witness, or local economic calculation was added.

**STATUS: 🟢 PRODUCER INTERFACE + FAIL-CLOSED BINDING MATERIALIZED / 🔴 REAL AUTHORITATIVE PRODUCER + PREPROD SALE EVIDENCE OPEN**

## 44.36 ISSUE ADMISSION PROVENANCE TRIANGULATION — 2026-09-27

Triangulation completed across the existing economic kernel, PRE-RICH Issue refinement, Cardano observation/projection, Oracle/Pool valuation and EEV certification contract.

Finding: the repository already contains the **admission algorithm**, not a concrete authoritative producer. `PRE-RICH/profile/PreRichEconomicAdmission.hs` requires explicit EEV, executable liquidity, truth verification, freshness, obligation completeness and certified-Ω successor evidence. `PreRichCardanoObservationProjection.ts` can derive the V3 observation from Cardano inputs but deliberately requires protected-capital/control observations rather than inventing them. `Economic.poolUsdmValue` is an existing canonical B1 Pool valuation primitive backed by the authenticated Oracle State, but the EEV contract does not authorize us to equate Pool value with EEV.

Therefore no economic producer was fabricated. New audit record: `docs/audits/PRE-RICH-ISSUE-ADMISSION-PROVENANCE.md`.

The exact remaining producer obligations are now explicit: authoritative EEV derivation/provenance, freshness, obligation completeness, protected-capital observations, executable liquidity bound to the exact Pool UTxO, Economic Gate + viability result, canonical fingerprints, decision/observation references and replayable evidence.

**STATUS: 🟢 PROVENANCE TRIANGULATED / 🔴 CONCRETE AUTHORITATIVE PRODUCER + END-TO-END PREPROD ISSUE EVIDENCE OPEN**

## 44.37 ISSUE PRODUCER CONTRACT MATERIALIZED — 2026-09-27

Added `src/authoritativeIssueAdmissionProducer.ts` as the explicit boundary between an external authoritative observation/refinement service and the PRE-RICH Issue path. It is deliberately **not** an oracle: it does not derive EEV, ProtectedCapital, viability, Ω certification or Gate booleans. It passes the producer output through the existing fail-closed `obtainAuthoritativeIssueAdmission` bridge.

Added `src/__tests__/authoritativeIssueAdmissionProducer.test.ts` covering successful pass-through, wrong Pool UTxO rejection and producer-unavailable fail-closed behavior. Adapter Sale CI now includes this test.

This closes the **software contract gap** but does not close the **authority/evidence gap**. A concrete authoritative producer is still required before the browser can Buy Ticket. No economic formula or authority rule was changed.

**STATUS: 🟢 PRODUCER CONTRACT MATERIALIZED / 🔴 AUTHORITATIVE IMPLEMENTATION + LIVE PREPROD ISSUE OPEN**

## 44.38 NOTION ↔ REPOSITORY EEV / CONTROL-STATE TRIANGULATION — 2026-09-27

Notion was checked against the repository for the missing Issue producer authority.

The result reinforces, rather than changes, the repository boundary:
- the B4/B5 admission bridge is already defined as `candidate transition → authoritative inputs → ProtectedCapital → Economic Gate → Viability`;
- authoritative EEV provenance remains an implementation/conformance obligation;
- `CurrentActiveClass` and `HighestClassEverActivated` require a verifiable application control-state representation and are not reconstructible from the legacy B1 Pool datum alone;
- the EEV asset-perimeter work explicitly leaves asset perimeter, liquidation horizon `τ`, canonical oracle adoption and execution-cost model open; PRE is not currently qualified as an EEV-liquidatable asset;
- therefore no concrete Issue producer can legitimately be promoted from the existing Pool/Oracle observation alone.

This closes the triangulation question: **there is no existing Notion decision authorizing a shortcut that would make the current B1 Pool value, displayed PRE value, or relayer output authoritative EEV.**

The remaining blocker is now specifically a source-of-truth qualification task, not a missing TypeScript interface: establish the concrete EEV source/perimeter/horizon and the authoritative PRE-RICH control-state producer, then implement the producer against the already-materialized witness contract.

**STATUS: 🟢 CROSS-SOURCE TRIANGULATION CLOSED / 🔴 EEV QUALIFICATION + CONTROL-STATE AUTHORITY + LIVE ISSUE PRODUCER OPEN**

## 44.39 CROSS-SOURCE TRIANGULATION — RF8/B6 + REMAINING CLOSURE HOLES — 2026-09-27

A fresh triangulation was performed across the active GitHub branch, the current Notion control-plane records, and the existing evidence/closure documents.

### RF8/B6

The new normalized RF8 replay harness and the existing Cardano→V3 projection are consistent with the canonical boundary:
- Haskell/IMMORTAL remains the semantic reference;
- PRE-RICH projection is an observation/refinement layer;
- Cardano observations must be authenticated before they can become closure evidence;
- native ledger evaluation remains separate.

The four economic mutators remain: Issue / Reveal / Claim / Expire.

The current source audit still identifies no second production economic submission path, but transaction construction remains in DApp code while signing/submission is centralized in the Adapter. This remains a conformance-scope question, not a reason to introduce another economic authority.

### B5 / Issue admission

Notion and repository remain aligned:
- 500× is PRE-RICH application policy, not universal IMMORTAL law;
- Pool USDM value is not automatically EEV;
- authoritative EEV provenance, asset perimeter, liquidation horizon, execution-cost model and PRE-RICH control-state provenance remain open;
- CurrentActiveClass and HighestClassEverActivated cannot be reconstructed from the legacy B1 Pool datum alone.

Therefore the missing first-user Issue producer cannot legitimately be synthesized from current Pool/Oracle observations.

### P2.8

The native runner remains fail-closed on missing typed UTxO/PParams/EpochInfo/SystemStart. The closure witness is still a real native-ledger evaluation packet. No synthetic evaluator context is acceptable.

### B3 / Materios

The current architecture remains: finality/authority/ancestry → finalized StateRoot → storage membership/value → succinct verification → Cardano Beacon.

No source justifies collapsing B3-A/B/C into a single off-chain assertion or replacing Materios authority selection with TypeScript.

### Gate 41

Notion Gate 41 still supports:
- State-0 anchor closed;
- current State-0 transaction identified;
- direct predecessor identified;
- exact Pool NFT mint transaction identified;
- deployment input graph, seed/min-ADA semantics, 3 ADA reconciliation and first curve replay remain open.

The 3 ADA delta is evidence, not yet a demonstrated semantic seed rule.

### Governance

GOV-28 remains an implementation/conformance gap: the normative lifecycle already distinguishes finalization, adoption, conformance and canonicalization, while the live Haskell state/replay path still needs executable reconciliation and build evidence. No new governance semantics should be invented.

### CI evidence

Connector-visible workflow lookup for the newest RF8/B6 commits returned no workflow runs. Therefore no CI green status is claimed for these commits.

### Newly confirmed closure-critical holes

1. Authoritative Issue producer / EEV qualification — still the blocker for real first-user Issue.
2. P2.8 native evaluation packet — still the main Cardano execution witness.
3. Real Preprod Reveal — still separate from fixture/reference-script conformance.
4. Genesis carrier authenticated observation — predicate exists, but the ledger must bind Treasury/Oracle reference inputs to the observation.
5. B3-A/B/C cryptographic proof chain — finality, storage/value authentication and succinct verifier remain distinct.
6. B2 live singleton/control enforcement — implementation/design exists; deployed ledger witness remains open.
7. RF6/Ω + B4/B5 — deployment perimeter, complete Ω, ProtectedCapital provenance and live Gate/viability evidence remain open.
8. RF8 whole-program coverage — current source inventory is materially stronger, but dynamic/future mutators and full negative-twin coverage are not yet exhaustive.
9. Legacy Treasury.Distribute surface — relayer path is closed, but the historical on-chain validator surface remains and must be release-isolated/deactivated before final certification.
10. Governance executable evidence — current-head Haskell/build evidence remains pending.

### Execution consequence

The work can proceed in parallel, but the next evidence-bearing steps are:
P2.8 native → Preprod Reveal → Genesis authenticated carrier → B3-A/B proof → B3-C verifier.

RF8/B6 continues in parallel as the semantic differential layer, not as a substitute for ledger evidence.


## 44.40 DEEP CLOSURE PASS — 2026-09-28

A second-depth triangulation decomposed the remaining holes into authority, execution, canonical-external-evidence and certification layers. This entry is non-normative and changes no economic rule.

### A. First-user Preprod critical chain

The concrete execution dependency is now:

1. P2.8 native Cardano-ledger replay packet;
2. real Preprod Reveal;
3. authenticated Genesis carrier / Treasury-Oracle input binding;
4. authoritative Issue producer / EEV provenance;
5. first-user Issue;
6. real Claim / Expire evidence.

A named EconomicAdmissionWitness or AuthoritativeClassState is not itself an authority. The producer/provenance chain must be bound to observed state.

### B. CLASS-AUTH

The repository contains AuthoritativeClassState and consumers for currentActiveClass / highestClassEverActivated. The V3 design requires these fields to remain distinct and highestClassEverActivated to be monotonic.

Required closure chain:

canonical economic state → authenticated observation → authoritative class state → Economic Gate.

No browser, relayer or arbitrary producer may supply favorable class state without authenticated provenance.

**STATUS: 🔴 OPEN**

### C. RF8-WC — closed-world mutation inventory

Issue / Reveal / Claim / Expire are routed through EconomicAdmission, but RF8 is not closed until the complete economic-effect universe is classified. Remaining surfaces include legacy Treasury.Distribute, burn/NFT identity mutation, Genesis/Oracle/Counter/Beacon surfaces and any other deployed economically material entry point.

Each surface must be classified:

CANONICAL / SUPPORT / LEGACY / DISABLED

For economically material surfaces, negative-twin evidence must show that the effect cannot occur outside the canonical economic transition boundary.

**STATUS: 🔴 OPEN**

### D. RF8-LEGACY — Treasury.Distribute

The legacy Treasury Distribute validator/redeemer remains present. The current relayer refuses to emit the legacy distribution without authoritative Economic Admission, and Genesis documentation explicitly excludes reuse of the legacy path. This is hardening evidence, not proof that the deployed surface is economically inert.

Before final certification the surface must be release-isolated/deactivated or explicitly proven non-economic/support-only.

**STATUS: 🔴 OPEN**

### E. GENESIS-LIVE

Genesis admission is an observation predicate, but repository evidence distinguishes predicate evaluation from authentication of the exact Treasury/Oracle ledger inputs that supplied the observed values.

Required witness:

Treasury/Oracle inputs → authenticated observation → Genesis predicate → carrier consumption/continuation → validator revalidation → committed GENESIS state.

**STATUS: 🔴 OPEN**

### F. B3-ID — canonical anchor identity

Materios storage accepts an explicit anchor_id; inspected upstream evidence does not establish a deterministic canonical mapping from checkpoint/round/StateRoot to that key. The observed Orynq SDK derivation is application/SDK evidence only until PRE-RICH explicitly adopts or rejects it.

Required boundary before B3-C proof selection:

canonical checkpoint → deterministic canonical AnchorId → AnchorRecord/root binding.

No first-matching-anchor or guessed hash derivation is acceptable.

**STATUS: 🔴 OPEN**

### G. P2.8-REPLAY

The native runner has progressed to typed Babbage decoding and fail-closed prerequisites. Closure still requires a self-contained reproducible packet containing tx.cbor, exact UTxO, protocol parameters, EpochInfo, SystemStart, manifest/source/environment metadata and the actual evalTxExUnitsWithLogs result.

**STATUS: 🔴 OPEN**

### H. TEST-REPRO

The repository has multiple test families/runners. A single nominal green statement is insufficient. Closure requires a runner/dependency/command/expected-result/artifact/commit/environment matrix, with scope distinguished between unit, reference, Yaci/devnet, native ledger and Preprod evidence.

**STATUS: 🟡 OPEN**

### I. Ω / K∞ separation

Local Economic Gate correctness must not be presented as an infinite-horizon viability theorem. Complete Ω/action/state perimeter and K∞ preservation remain universal certification work and are not substitutes for concrete Preprod execution gates.

**STATUS: 🔴 OPEN — UNIVERSAL CERTIFICATION**

### J. Evidence caution

No CI-green claim is made for newest closure commits merely from source inspection. Recent connector-visible workflow lookup for RF8/B6 commits returned no runs.

### Resulting execution priority

The authority blocker is now narrowed to two coupled producer tasks:

1. authoritative PRE-RICH control-state provenance;
2. authoritative EEV source/perimeter/horizon and executable-liquidity binding.

Only after those exist can the already-materialized Issue admission contract become a real first-user producer.

## 44.41 ISSUE AUTHORITY PRODUCER QUALIFICATION — 2026-09-28

Added `docs/research/ISSUE-AUTHORITY-PRODUCER-QUALIFICATION-2026-09-28.md`.

The producer boundary is now explicitly decomposed into three evidence layers before any concrete first-user producer is allowed:

1. **CLASS-AUTH** — authenticated PRE-RICH control state, with deterministic hysteresis replay and monotonic `HighestClassEverActivated`;
2. **EEV** — qualified asset/perimeter/liquidation horizon/source evidence; no Pool balance, displayed PRE price, market cap or relayer valuation may be promoted to EEV;
3. **LIQUIDITY** — exact spendable B1 PrizePool UTxO, declared/observed value equality, freshness and candidate-transaction binding.

The existing `AuthoritativeIssueAdmissionProvider` remains the transport boundary. It is not promoted to authority merely by implementation. The concrete producer remains blocked until the underlying authority sources are qualified.

Required negative evidence is now enumerated for CLASS-AUTH, EEV, LIQUIDITY and PRODUCER, including stale/missing/mismatched/wrong-source cases.

**STATUS: 🟢 AUTHORITY CONTRACT QUALIFIED / 🔴 AUTHENTICATED SOURCES + CONCRETE PRODUCER OPEN**

No economic rule changed. No oracle was selected. No PRE value was promoted into EEV. No fake producer was introduced.

## 44.42 SOURCE-OF-TRUTH DEEP PASS — 2026-09-28

Direct repository census refined the authority blocker.

- **CLASS-AUTH:** deterministic hysteresis exists, but its inputs are not authenticated by the current B1 Pool datum. B1/V3 semantic-equivalence and `B1LegacyAdapter` both show the legacy Pool representation is lossy for full class/control/protected-capital state.
- **EEV:** the normative R9 EEV contract is CLOSED as a contract, but its concrete adapter obligations EV1–EV7 are not discharged by an identified production Issue provider. The existing Genesis PRE→USDM Oracle surface is a concrete Genesis valuation source, **not** a general EEV source.
- **LIQUIDITY:** exact singleton B1 PrizePool UTxO + validated USDM value is an existing concrete execution surface; candidate-input binding is implemented, but current-head ledger evidence remains required.

Therefore the next implementation target is explicitly **source qualification**, not another local calculation:

1. authenticated PRE-RICH control-state carrier/observation;
2. concrete EEV source qualified against EV1–EV7 and the declared asset/τ perimeter;
3. retain Pool UTxO as separate executable-liquidity witness;
4. instantiate existing Issue producer;
5. first-user Issue evidence.

No oracle, haircut, τ or PRE valuation rule was invented or promoted.

**STATUS: 🔴 CLASS-AUTH OPEN / 🔴 EEV PRODUCER OPEN / 🟡 LIQUIDITY BINDING IMPLEMENTED — LEDGER EVIDENCE OPEN**


## 44.43 CURRENT-BRANCH GENESIS ARITHMETIC RECONCILIATION — 2026-09-28

A current-closure source check at commit `0765f73e8c7d5c084ce073e4fb3a7d73e1308101` reconciled the previously reported Genesis arithmetic discrepancy. The PRE-RICH Plutus path `PRE-RICH/profile/PreRichGenesisAdmission.hs` still used the universal helper `ceilingDiv`, while the TypeScript Genesis admission path and red-team closure record specify conservative floor arithmetic for the hard lower-bound predicate. This was a real cross-language conformance gap, not a new economic rule.

Action taken on `work/immortal-green-closure`:
- `d6083997fcad5c884f86b4886e627752ae7cc9ff` — replace Genesis admission rounding-up with integer floor division using the existing Plutus `divide` primitive. No threshold, oracle, price or economic policy changed.
- `0765f73e8c7d5c084ce073e4fb3a7d73e1308101` — add Plutus regression coverage for the fractional sub-threshold case that would round upward under ceiling arithmetic.

Closure classification: arithmetic/conformance gap CLOSED at source level; execution evidence remains required through the Genesis carrier/native ledger gates. This does not close GENESIS-LIVE.


## 44.44 GENESIS CARRIER SOURCE-REALITY RECONCILIATION — 2026-09-28

A second current-commit source check found a documentation/implementation mismatch that must not be silently treated as closure. `PRE-RICH/docs/GENESIS-REGIME-CARRIER-DESIGN-v0.1.md` states that the application/Cardano Genesis carrier and carrier validator already exist, but at commit `5f2e731da575a82dfefe2f66b78fe95365ffbcd6` the named implementation paths `PRE-RICH/profile/GenesisRegimeCarrier.hs` and `PRE-RICH/profile/GenesisCarrierMintPolicy.hs` are not present. `plutus/Types.hs` likewise contains no dedicated `PreRichRegimeDatum`/regime carrier datum; its singleton B1 PrizePool remains an accounting datum and explicitly does not authorize class activation.

Classification: **GENESIS-CARRIER remains OPEN at implementation/source level**. The design document is a conformance target, not proof that the implementation exists. No new carrier or datum is being invented in this pass because the exact canonical serialization/identity and on-chain validator surface must first be triangulated from the authoritative source hierarchy.

The already-corrected Genesis arithmetic remains closed at source level; this finding is separate and reopens only the implementation/evidence status of GENESIS-LIVE.


## 44.45 ISSUE PRODUCER / EEV AUTHORITY RECHECK — 2026-09-28

A fresh current-branch inspection changes the classification of the Issue producer seam. `Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts` and `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` are present. The latter is a server/relayer transport that invokes an explicitly configured Haskell producer, binds its decision reference and observation reference, and converts the result into the existing `EconomicAdmissionWitness`.

This is useful infrastructure, but it does **not** close the authoritative-economic-source gap. The Haskell producer receives an observed `decisionInput`; the adapter transport does not derive or authenticate EEV, CurrentActiveClass/HighestClassEverActivated, ProtectedCapital, or Ω. `PreRichCardanoObservationProjection` likewise requires `authoritativeClasses`, `safetyCapital`, `reserveProtection`, `mandatoryFutureCosts`, `currentActiveClass`, and `highestClassEverActivated` as already-authoritative inputs. Therefore the correct status is:

- producer/transport boundary: IMPLEMENTED;
- concrete authenticated class/control-state source: OPEN;
- concrete qualified EEV source satisfying EV1–EV7: OPEN;
- executable Pool UTxO observation/binding: IMPLEMENTED at code level, live ledger evidence OPEN;
- first-user Issue: BLOCKED on those authority inputs.

No new oracle, valuation formula, haircut, horizon, or economic constant is introduced.

## 44.46 CURRENT-BRANCH SOURCE CENSUS — V3 CARRIER / EEV / GENESIS — 2026-09-28

A branch-specific source census was repeated using the actual work/immortal-green-closure tree, because the repository is diverged from main and the branch is 15 commits behind main. This distinction is material: files visible on main must not be reported as present on the closure branch until reconciled/merged.

### V3 control-state carrier

On the current closure branch, PRE-RICH/profile/ contains PreRichGenesisAdmission.hs but does not contain:

- PreRichRegimeState.hs;
- GenesisRegimeCarrier.hs;
- GenesisCarrierMintPolicy.hs.

The branch does contain the existing audit/preprod-issue/V3-LIVE-STATE-CARRIER-GAP.md, whose acceptance contract already requires a separate application-owned V3 economic-state singleton. Therefore the branch-local source census confirms the CLASS-AUTH / V3 carrier gap is still real at implementation level.

The corresponding carrier files are visible on the current main source line, but that is not evidence for the current closure branch. No merge/backport is performed in this pass because the exact serialization, singleton identity, lifecycle and validator binding must remain source-of-truth controlled.

### Genesis arithmetic

The current closure-branch PRE-RICH/profile/PreRichGenesisAdmission.hs now uses Plutus divide for genesisTreasuryValueUsdm; the previously identified ceiling/floor discrepancy is therefore reconciled at source level. This does not provide Genesis carrier or ledger evidence.

### Issue producer

The current closure branch does contain Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts. It is confirmed as transport/binding infrastructure only: it invokes an explicitly configured Haskell producer and binds decision/observation references to the observed Pool input. It does not itself authenticate or derive CLASS-AUTH, EEV, ProtectedCapital or Ω.

### EEV

No current-branch census result establishes a concrete production Issue EEV source satisfying EV1–EV7. The existing Genesis PRE→USDM Oracle remains Genesis-specific and is not promoted to general EEV.

### Execution consequence

The immediate implementation order is unchanged but now branch-precise:

1. reconcile/triangulate the V3 carrier source on the closure branch;
2. qualify the concrete EEV source/perimeter/horizon;
3. keep B1 PrizePool as the separate executable-liquidity witness;
4. instantiate the existing Haskell Issue producer against authenticated sources;
5. only then perform the real first-user Issue witness.

No economic constant, oracle, valuation formula, haircut, horizon or control-state default is invented in this pass.

**STATUS: 🔴 V3 CARRIER / CLASS-AUTH OPEN · 🔴 EEV SOURCE OPEN · 🟡 LIQUIDITY BINDING IMPLEMENTED / LEDGER EVIDENCE OPEN**

## 44.47 V3 CARRIER FOUND — BINDING GAP RECLASSIFICATION — 2026-09-28

A deeper branch-local census corrected the previous implementation classification. The V3 carrier is present on the current closure branch, under PRE-RICH/onchain/, not PRE-RICH/profile/:

- PRE-RICH/onchain/V3EconomicStateCarrier.hs
- PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs
- PRE-RICH/onchain/PreRichRegimeState.hs
- PRE-RICH/onchain/GenesisRegimeCarrier.hs

The carrier validator provides a singleton-token boundary and requires exactly one script input/output, preservation of carrier value, valid V3 state, and monotonic state version (after = before + 1). The one-shot mint policy binds initial minting to a deployment seed input.

This changes the status from missing implementation to implemented carrier / open economic-authority binding.

Critical remaining gap: the carrier currently validates structural state continuity, but does not bind the carrier transition to the corresponding Issue/Reveal/Claim/Expire decision, candidate post-state, decision fingerprint, or authenticated economic admission witness. It also does not establish EEV or ProtectedCapital provenance.

The separate PreRichIssueDecision still receives idiPreState, idiPreEEV, idiCandidateEEV, liquidity and truth/freshness booleans as explicit inputs. That is a decision function, not proof that those values originated from the deployed carrier or a qualified EEV source.

Required closure chain:

V3 carrier UTxO → authenticated pre-state → Haskell economic decision → exact action/post-state binding → Cardano transition → post-state carrier evidence

Separately:

qualified EEV source → EV1–EV7 evidence → Issue decision

No new economic rule is introduced. No B1/Treasury value is promoted to EEV. No TypeScript economic authority is added.

**STATUS: 🟢 V3 CARRIER IMPLEMENTATION PRESENT · 🔴 CARRIER→DECISION BINDING OPEN · 🔴 EEV SOURCE OPEN · 🟡 LIQUIDITY BINDING IMPLEMENTED / LEDGER EVIDENCE OPEN**


## 44.48 V3 CARRIER → ISSUE DECISION BINDING DEEP PASS — 2026-09-28

Added `audit/preprod-issue/V3-ISSUE-CARRIER-BINDING-GAP.md` at commit `043f9ec787fb1b70f94f4b542d23847aef05e23d`.

Current-branch inspection confirms the V3 carrier implementation is present under `PRE-RICH/onchain/` and already enforces singleton identity, one carrier input/output, value preservation, valid V3 state and monotonic versioning. The remaining gap is specifically **carrier → economic decision binding**, not carrier existence.

The existing Issue authority seam already contains the reusable binding vocabulary: `decisionReference`, `authoritativeObservationReference`, `stateHash`, `actionClass`, `actionFingerprint`, `postStateHash`, executable-liquidity observation and exact B1 PrizePool input/value. The Haskell Issue provider is transport/binding infrastructure, not an authority source.

The current V3 carrier action remains structural (`AdvanceV3State`) and does not bind the carrier transition to the economic action, decision identity, pre/post state fingerprints or admission witness. The current `mintSerialNFT()` Issue transaction likewise does not yet consume/continue the deployed V3 carrier.

### Minimal closure shape

```
exact V3 carrier input
  → authenticated pre-state
  → existing Haskell economic decision
  → decision/observation/action/pre/post fingerprints
  → carrier transaction binding
  → exact candidate post-state carrier output
```

No new economic rule is required. The carrier validator should verify transaction-visible binding facts; EEV derivation remains outside the carrier and remains subject to EV1–EV7 qualification.

Required bounded tests: correct/mismatched carrier, pre/post hashes, action class, decision/observation references, action fingerprint, output-state mismatch, replay and competing transition from the same carrier UTxO.

**STATUS: 🟢 V3 CARRIER STRUCTURE · 🔴 CARRIER→ISSUE DECISION BINDING · 🔴 EEV SOURCE · 🟡 LIQUIDITY LIVE EVIDENCE**

First-user Preprod Issue remains blocked on these authority/binding prerequisites. No economics, oracle, haircut, horizon or PRE value has been invented or promoted.


## 44.49 V3 CARRIER DECISION ENVELOPE — 2026-09-28

Implemented the first concrete carrier→decision binding layer on `work/immortal-green-closure`.

### Source changes

- `PRE-RICH/onchain/V3EconomicStateCarrier.hs` now extends `AdvanceV3State` with an explicit decision envelope:
  - action class;
  - decision reference;
  - authoritative observation reference;
  - pre-state hash;
  - action fingerprint;
  - post-state hash.
- The carrier validator now fails closed unless the envelope is non-empty and the action class is one of `Issue`, `Reveal`, `Claim`, `Expire`.
- Added `plutus/test/V3EconomicStateCarrierBindingTest.hs` with positive and negative envelope cases.
- Registered `v3-economic-state-carrier-binding-tests` in `plutus/pre-rich-plutus.cabal`.
- Added the test to `.github/workflows/genesis-regime-carrier.yml`.

Latest commit: `f35c08c743c07d62a264366bbf085d3b840fd5e5`.

### Important boundary

This is **not yet full cryptographic/economic authority binding**. The on-chain carrier currently checks that the transaction carries a valid decision envelope, but it does not yet recompute the canonical V3 SHA-256 fingerprints or prove that the supplied decision reference/EEV originated from an authenticated economic source. The existing Haskell producer and `EconomicAdmissionWitness` remain the economic decision boundary.

The next required step is therefore to bind the actual Issue transaction to the deployed carrier UTxO and make the transaction carry the same decision envelope, without duplicating the economic algorithm in TypeScript. A deployed carrier address/UTxO is still required before that transaction path can be materialized.

### CI

A Genesis Regime Carrier workflow for the latest source change is currently **in progress** (run `36357870924`, head `f35c08c743c07d62a264366bbf085d3b840fd5e5`). No green result is claimed until the run completes.

**STATUS: 🟢 DECISION-ENVELOPE STRUCTURE · 🔴 CRYPTOGRAPHIC/STATE-HASH RECOMPUTATION · 🔴 LIVE CARRIER→ISSUE TX BINDING · 🔴 EEV SOURCE · 🟡 LIQUIDITY LIVE EVIDENCE**


## 44.50 ISSUE AUTHORITY — PROTECTED-CAPITAL PROVENANCE BINDING — 2026-10-09

The Issue authority seam was advanced without changing PRE-RICH economics or the V3 decision semantics.

### Implemented

- PRE-RICH/onchain/PreRichIssueDecision.hs now retains the exact authoritative preState inside the produced IssueDecision.
- plutus/export/IssueAdmission.hs now emits a structured ProtectedCapital provenance witness derived by the canonical Haskell EconomicKernel.protectedCapital / worstCaseExposure path, with all six protected components and accounting inputs.
- Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts now binds that provenance to the exact observed V3 carrier state reference and normalizes serialized integer fields to bigint.
- relayer/preprodIssueAuthorityEnvelope.js provides a fail-closed signing boundary for the complete Issue authority envelope and self-verifies the generated signature before returning it.
- relayer/preprodIssueAuthorityEnvelope.test.js covers the positive signed-envelope path.
- plutus/test/PreRichIssueDecisionTest.hs now asserts preservation of the exact pre-state used for provenance.

### Boundary preserved

This closes a concrete provenance implementation gap:

authenticated V3 carrier preState → canonical Haskell Issue decision → ProtectedCapital provenance → signed Issue authority envelope

It does not manufacture EEV or Viability. The signed envelope still requires:

- EEV qualification with EV1–EV7 and DEPLOYMENT_APPROVED;
- a real ViabilityCertificate with VC1–VC6 and E1–E10;
- exact live Pool/Counter/carrier/control bindings;
- an explicit immediate-liquidity requirement;
- deployment-held signing authority.

The existing browser/adapter path remains fail-closed when any required authority evidence is missing.

### Current classification

🟢 ProtectedCapital provenance derivation/binding implemented
🟢 Signed Issue envelope producer implemented
🔴 Concrete Viability/Kc-Ω certificate evidence still required
🔴 B2 live control deployment still required
🔴 Atomic first-user Preprod Issue still blocked

No V3 economic rule changed.


## 44.51 ISSUE AUTHORITY — WITNESS IDENTITY HARDENING — 2026-10-09

A second binding pass closed three concrete interface ambiguities found while wiring the new ProtectedCapital provenance path.

### Closed

1. The authoritative Issue witness now carries the exact Counter reference, pre-EEV, Issue class and Issue price instead of receiving those values outside the witness.
2. The Haskell Issue adapter requires the canonical action string `Issue:<classId>:<price>` and verifies pre-EEV, candidate EEV and executable liquidity against the authoritative decision input.
3. Haskell-derived ProtectedCapital is cross-checked component-by-component and by total against the upstream authenticated authority source before being admitted into the witness.
4. The signed authority verifier now accepts JSON numeric coordinates independent of whether the runtime expected values are `number` or `bigint`, while still comparing them as exact integers.
5. The signed envelope requires the explicit Issue schema/action and the signer refuses a missing or negative pre-EEV.
6. A dedicated `HaskellIssueAdmissionProvider.test.ts` exercises the binding path and a negative ProtectedCapital mismatch case; Adapter Sale Conformance now runs it.

### CI

Current branch head: `69222769c2e8f31b21c1ebd50a3e87d68c1906a3`.

At the latest check:
- PRE-RICH B2 Control Carrier Conformance #46: queued
- Cardano Adapter Sale Conformance #3131: queued
- Protocol Declaration Conformance #1860: queued

No green status is claimed before completion.

### Kc / Ω boundary

The concrete deployment Kc remains intentionally external. The normative certification package requires a real profile instantiation of `(S,A,Accept,Ω,T,Safe)` plus VC1–VC6 and E1–E10. The current repository does not contain such a deployment certificate, and the 2026-10-05 viability audit shows that treating only `Issue/Reveal/Claim/Expire` as the complete infinite-horizon action space would make the concrete kernel empty. No artificial Kc, narrowed Ω, or fake QNE action is introduced here.

No V3 economic rule changed.


## 44.52 B2 CONTROL AUTHORITY + ISSUE IDENTITY BINDING — 2026-10-09

The PRE-RICH B2 control carrier is now bound to an explicit deployment authority key. The validator rejects every control mutation unless the configured payment key hash is among the transaction signatories. The deployment script derives that authority from the deployer wallet by default and records it in the deployment manifest; a separate PREPROD_CONTROL_AUTHORITY_PKH may be supplied.

The real Issue authority witness now also carries the exact B2 control UTxO reference. That reference is propagated through the live observation reader, Haskell Issue provider, signed authority envelope, verifier and mintSerialNFT call-site. The live Issue path reads the exact B2 singleton as a reference input and fails closed on any mismatch.

The Issue witness therefore binds:

- Counter UTxO;
- B2 control UTxO;
- B1 PrizePool UTxO;
- V3 carrier UTxO;
- pre-EEV/class/price;
- ProtectedCapital provenance;
- EEV EV1–EV7 + deployment approval;
- viability VC1–VC6 + E1–E10 + deployment binding.

Historical research recovery confirms that PRE-RICH's earlier Dynamic Viability Machine already modeled PRE_GENESIS, QUIESCENT, contraction and recovery. Those semantics remain historical/research evidence until a concrete deployment Kc/Ω package proves VC1–VC6, especially inductiveness, acceptance compatibility, Ω soundness and non-vacuity. No V3 economic semantics were changed.

B2 remains deployment-open until the real control singleton identity is materialized on Cardano Preprod and an adversarial ledger trace proves authorized mutation, singleton uniqueness and Issue reference binding.
