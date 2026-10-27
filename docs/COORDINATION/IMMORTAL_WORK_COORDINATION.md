# IMMORTAL — Cross-Session Coordination & Closure Register

> **Role:** shared operational handoff, source-triangulation register and anti-regression control between concurrent engineering sessions.
>
> **Authority:** this file is **NON-NORMATIVE**. It cannot change protocol semantics. Canonical Constitution/specifications and explicit normative decisions remain authoritative.
>
> **Working branch:** `work/immortal-green-closure`
> **Snapshot:** 2026-10-25
> **Coordination policy update:** `fd039c2591095d5dc51afa956742c66e3bbf9d02` — general checkpoint established as multi-agent coordination control plane
> **HEAD rule:** read the live branch HEAD from GitHub at every session start; this file's historical entries are not a substitute for current refs or run evidence.

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

## 0.1 REUSE OF VERIFIED COMPILED ARTIFACTS

When a workflow requires a compiled Plutus artifact and that artifact is already available with the **same deterministic source/project/toolchain fingerprint**, the workflow **MUST reuse the verified artifact** instead of recompiling it.

Operational sequence:

1. **Cache hit:** restore the required artifact(s) directly, verify that the expected files exist, and continue with the conformance/deployment steps.
2. **Cache miss:** bootstrap the canonical Plutus toolchain, compile/export the artifact(s), verify them, then persist them for reuse.
3. A later test, observation or conformance failure **does not invalidate a successfully compiled artifact**. A retry may reuse it when the fingerprint remains identical.
4. An artifact from a different source/project/toolchain fingerprint **MUST NOT be reused**, even when its filename or role is identical.
5. Deployment evidence remains bound to the exact artifact identity/fingerprint required by the deployment gate; cache reuse is an execution optimization, not an authority change.

The rule applies to compiled artifacts only. It does not permit skipping tests, evidence generation, exact-SHA checks, or deployment-specific certification.

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

## 44.53 RED TEAM R3 — V3 CARRIER DECISION-BINDING MALLEABILITY — 2026-10-10

A source-level red-team recheck of the current V3 carrier confirmed that the 2026-09-28 decision-envelope work is structural only.

`PRE-RICH/onchain/V3EconomicStateCarrier.hs` requires:

- an allowed action class;
- non-empty decision and observation references;
- non-empty pre/action/post fingerprint fields;
- canonical pre-state hash equality;
- canonical post-state hash equality;
- singleton/input/output/value/version invariants.

It does **not** recompute the canonical action fingerprint, authenticate the decision/observation references, invoke the canonical economic transition, or prove that the carrier spend corresponds to an authoritative Issue admission.

Therefore an actor able to spend the carrier can construct a structurally valid `AdvanceV3State` carrying fabricated provenance and an arbitrary 32-byte action fingerprint, while still supplying a self-consistent valid V3 after-state.

The off-chain `mintSerialNFTWithAuthoritativeAdmission()` path does build the correct envelope and consumes the deployed carrier, but that does not close the independent on-chain carrier spend surface.

Red-team evidence:
`docs/audits/REDTEAM-R3-V3-CARRIER-MALLEABILITY.md`
commit `d456be3ebe243187778c6d35e861137a36b8bfb2`.

**STATUS: 🔴 R3 CONFIRMED OPEN / RELEASE BLOCKER**

No production validator change is made in this pass because the repository does not yet contain a canonical on-chain decision-authority mechanism that can be reused without inventing new protocol semantics.

Closure must be sourced from the existing architecture and must make the carrier transition non-malleably correspond to the existing economic decision/admission path. V3 semantics, Reveal semantics, EEV rules and B1 liquidity rules remain unchanged.

## 44.54 — GENERAL CHECKPOINT AS MULTI-AGENT COORDINATION CONTROL PLANE — 2026-10-25

**Purpose:** this general checkpoint is the mandatory coordination layer for all agents/sessions working on IMMORTAL. It coordinates work and evidence; it does not replace normative authority, implementation sources, or ledger evidence.

### 44.54.1 Mandatory pre-flight before any work

Before investigating, editing, testing, or reporting a front, every agent MUST:

1. Read this checkpoint and the latest operational handoff.
2. Identify the canonical work branch and its exact HEAD SHA from GitHub; never assume the branch name implies the current contents.
3. Read the relevant recent commit(s), PR diff, workflow runs, and evidence artifacts on that exact SHA.
4. Search the checkpoint and recent handoffs for the same front, symptom, hypothesis, test, and prior PASS/FAIL.
5. Compare the candidate branch with the canonical work branch when they differ. Explicitly report divergence and identify which evidence applies to which commit.
6. Record a front lease before substantive work: owner/agent, exact branch+SHA, scope, hypothesis, planned action, acceptance criterion, and status.

If any of these checks cannot be completed, the agent must state the limitation and must not present old or branch-local evidence as current.

### 44.54.2 One canonical work front; no duplicate diagnosis

- For an active front, one agent/session is the **driver**; other agents may perform bounded independent review, but must not repeat the same experiment without stating what new uncertainty the repetition resolves.
- A front lease is unique by front_id. Before starting a test, search for an existing lease or recent evidence with the same front_id and objective.
- If the front is already PASS at the required evidence layer on the canonical SHA, stop re-running it. Verify provenance and artifact identity, then move to the first downstream unresolved gate.
- A failure on a divergent review/audit branch is branch-local evidence. It is not automatically a regression of the canonical branch and must not reopen a gate already passed elsewhere.
- If branch comparison reveals duplicated work, pause the duplicate path, reconcile the exact commits and test harnesses, and resume only the unresolved delta.
- Do not create branches unless the user explicitly authorizes it. Do not merge, rebase, force-update refs, deploy, sign, or submit on-chain transactions without the required authorization.

### 44.54.3 Evidence record required for every status claim

Every PASS/FAIL/OPEN claim must include:

- front_id and acceptance criterion;
- branch name and full source commit SHA;
- workflow/run URL and attempt, if applicable;
- artifact/evidence reference and its source commit;
- environment/ledger and relevant toolchain or protocol-parameter identity;
- exact result and the layer proven (source, unit, CI, simulation, Yaci, native ledger, Preprod, certification);
- what the result does not prove;
- next unresolved dependency and owner.

A result from one SHA must never be silently attributed to another SHA. Historical evidence remains historical unless artifact/source identity and applicability are independently revalidated.

### 44.54.4 Coordination state machine

Use only these operational states:

- **UNTRIAGED** — evidence and owner not yet reconciled.
- **READY** — scope, canonical SHA, owner, and acceptance criterion recorded.
- **IN_PROGRESS** — one named driver is executing the bounded task.
- **BLOCKED** — a named dependency or decision prevents progress.
- **PASS_AT_LAYER** — acceptance criterion passed at a stated evidence layer and exact SHA; not a general GREEN declaration.
- **REVIEW_REQUIRED** — independent review or cross-branch reconciliation remains.
- **CLOSED** — required evidence layers are complete, provenance is bound, and the checkpoint records the closure basis.

A status may move backwards when new evidence invalidates applicability. “CI green”, “source implemented”, “Yaci accepted”, “native ledger accepted”, “Preprod observed”, and “certified” are distinct states and must never be conflated.

### 44.54.5 Current reconciliation — V3 carrier vs Reveal

- The operational reference is work/immortal-green-closure; the exact HEAD must be re-read from GitHub at the start of each run.
- The review/treasury-readonly-observer branch and PR #36 are a divergent audit line, not an alternate canonical V3 development front. PR #36 remains Draft.
- Integration Lab #2246 on review HEAD e6a21b4287c6d39c7b07d08e7f527683b0b524bd reported a native Yaci ledger rejection of its typed V3 carrier path (data isn't supported in 'case'). This is evidence for that exact review-branch artifact/harness only; it does not by itself invalidate a carrier PASS recorded on the canonical work branch.
- Therefore no new carrier probe should be started from the review branch merely to repeat that failure. First bind the previously reported carrier PASS to its exact work-branch SHA, run URL, artifact and ledger evidence. If that evidence meets the acceptance criterion, mark the carrier PASS at that layer and continue at the first downstream unresolved gate.
- Reveal remains a separate gate. Do not modify V3 production logic or Reveal semantics as part of coordination/reconciliation. Do not change the production ABI or policy ID based only on the review-branch diagnostic.

### 44.54.6 Agent handoff contract

Every agent handoff must start with a compact header:

    FRONT:
    DRIVER:
    CANONICAL BRANCH@SHA:
    WORKING BRANCH@SHA (if different):
    STATE:
    ACCEPTANCE CRITERION:
    LATEST EVIDENCE:
    DUPLICATE-WORK CHECK:
    NEXT ACTION:
    BLOCKER / USER DECISION REQUIRED:

The receiving agent must acknowledge the front and continue from the stated evidence. If the evidence contradicts the current checkpoint, it must update/reconcile the checkpoint before launching another experiment.

### 44.54.7 Authority and safety boundaries

This checkpoint can assign work, record dependencies, and classify evidence. It cannot invent or approve protocol economics, change normative semantics, authorize deployment, or promote a release. Normative/economic decisions remain with the user and the canonical authority hierarchy above. Missing evidence must remain OPEN/BLOCKED rather than being inferred from successful adjacent tests.

**Initial state:** coordination rule adopted; carrier PASS provenance reconciliation still required before its exact commit/run can be treated as the operative baseline. No production code or on-chain state is changed by this entry.


## 44.55 PREPROD-REVEAL — SINGLE DRIVER LEASE — 2026-10-25

**Front lease ID:** `PREPROD-REVEAL/collectFrom-CML-datum-parser`

- **Driver:** current session operating PR #38 (Reveal trace diagnostic).
- **Canonical coordination branch@SHA:** `work/immortal-green-closure@da799005d5a6d4f7db71576902d2217e4ebf79d4`.
- **Working branch@SHA:** `fix/preprod-eev-approval-pin@e3d9d425e63a69f905b4d91c6c779a88b209b7ed`.
- **State:** `IN_PROGRESS` (direct CML parser experiment completed; next isolated diagnostic is running from PR branch after push).
- **Scope:** isolate which `collectFrom` input triggers CML's `PlutusData.from_cbor_hex` WASM crash in the Yaci Integration Lab. Diagnostic-only; no production validator, V3, Reveal semantics, economic rules, or transaction-size limit changes.
- **Latest evidence:** Integration Lab #2248 run [40210264223](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40210264223) failed on `e3d9d425e63a69f905b4d91c6c779a88b209b7ed`. Follow-up #2249 run [40212607739](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40212607739) failed on `7c4d5aab7c489163060dd95232de9023904eb994`. Direct CML `PlutusData.from_cbor_hex` returned PASS for both exact observed datum strings (Prize 658 hex chars; B1PrizePool 96); the later lazy Lucid builder still crashed in `TxUtils.ts:60` / `Collect.ts:61` with `RuntimeError: memory access out of bounds`. This narrows the failure to the subsequent builder parse/conversion or WASM lifetime interaction, but does not yet prove a root cause. V3 carrier remained PASS; transaction serialization was not reached.
- **Current experiment:** commit [889e827](https://github.com/LiberoNuvola/Immortal-Protocol/commit/889e827566e83884d4597fc5136f59b677c5dd66) removes the diagnostic's explicit `parsed.free()` call, preserving the objects until process exit to test whether manual WASM object disposal affects Lucid's later lazy parse. This is a narrow diagnostic hypothesis, not a claimed root cause. Exact-SHA Integration Lab #2251 is queued/pending: [run 40215140216](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40215140216). Do not launch a duplicate run; inspect this run once jobs materialize.
- **Acceptance criterion:** identify whether direct CML parsing fails on either observed datum or whether both parse and the failure is elsewhere in the lazy builder; then implement only the minimal correction supported by evidence. If the builder completes, measure serialized Reveal CBOR against observed `maxTxSize=16384`; do not raise the limit.
- **Duplicate-work check:** Agent A's assigned P2.8 work is native Cardano-ledger evaluation/context materialization (F3.2–F3.4); this lease is the preceding Lucid/Yaci Reveal transaction-builder crash. Share resulting raw ledger/evidence artifacts with Agent A when useful, but do not duplicate its native evaluator investigation. The `copilot/fix-real-preprod-reveal-job` branch is not treated as an active duplicate based on its latest commit (2026-10-21, EEV governance metadata only); recheck before expanding scope.
- **Coordination rule:** while this lease is active, no other session should repeat the same Yaci `collectFrom`/CML parser experiment on another branch. Independent review is welcome if it addresses a different uncertainty and cites its own exact SHA.
- **Protected boundaries:** V3 carrier is already PASS in the current trace and is not to be modified. This diagnostic does not qualify Reveal, Preprod, economic admission, or first-user Issue.

## 44.56 PREPROD-REVEAL — CML PARSER EXPERIMENT RESULT — 2026-10-25

**Front lease ID:** `PREPROD-REVEAL/collectFrom-CML-datum-parser`

- **State:** `IN_PROGRESS`; first discriminator completed, next bounded isolation required.
- **Source branch@SHA:** `fix/preprod-eev-approval-pin@7c4d5aab7c489163060dd95232de9023904eb994`.
- **Run:** Integration Lab #2249, [40212607739](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40212607739), failed at Reveal step 22; job evidence artifact ID `12606973389`, SHA-256 `9ecaa43471e7d533e5699623a17db33c851d288af311db2b4dfd874d0a64d11c`.
- **Observed evidence:** both direct CML `PlutusData.from_cbor_hex` calls PASS for the exact provider datums (Prize: 658 hex characters; B1PrizePool: 96). Both `collectFrom` stage markers also PASS, then lazy builder completion fails in Lucid `Collect.ts:61` at `PlutusData.from_cbor_hex` with `RuntimeError: memory access out of bounds`.
- **Layer proven:** diagnostic Yaci Integration Lab only. This rules out a simple failure of direct parsing of either observed datum; it does not prove which lazy builder input/operation triggers the crash, successful transaction completion, tx size, Reveal ledger acceptance, Preprod, or economic admission.
- **Next action:** isolate each input in its own diagnostic builder completion path on this same leased branch, using unchanged observed UTxOs/datums and no production semantics changes. Record whether the crash reproduces for Prize-only, B1PrizePool-only, or only the combined builder. If completion gets past the parser, retain the first downstream error and do not claim Reveal PASS.
- **Guardrails:** V3 remains untouched; no change to Reveal semantics, economic rules, ABI, policy ID, or `maxTxSize=16384`. Do not start the equivalent experiment on another branch.


## 44.57 — AGENT B F4/F5 — BEACON/MATERIOS SOURCE AUDIT — 2026-10-25

**Purpose:** record a bounded source audit of the Agent B front without duplicating the active Reveal/Yaci diagnostic and without changing Beacon, B3, or economic semantics.

**Scope:** work/b3-materios-provenance-evidence source surfaces, checked against the canonical coordination checkpoint. This entry records source-level evidence only; the inspected branch is not implicitly promoted to the canonical implementation baseline.

### Evidence and findings

1. **B3-A — GRANDPA finality / authority history remains OPEN.** The branch's poc/materios-grandpa/test/README.md explicitly states that the PoC uses synthetic fixtures, has no real Materios finalized-block/justification/authenticated authority-transition fixture, and deliberately fails closed with ANCESTRY_NOT_VERIFIED when verifyAncestry: true. The authority transition verifier requires an injected proof verifier; the repository does not provide a production cryptographic implementation for that transition boundary.
2. **B3-B — storage authentication remains a separate gate.** The existing research contract keeps finality/authority/ancestry, finalized StateRoot, storage membership/value, and B3-C succinct verification distinct. A checkpoint extraction or valid storage proof alone does not establish canonical finality.
3. **Authoritative selector provenance is correctly not reimplemented in TypeScript.** poc/materios-grandpa/test/MATERIOS-AUTHORITY-SELECTION-PROOF-CONTRACT.md requires proof of canonical runtime identity, execution block/state commitment, branch witness, exact SCALE inputs, and resulting committee. A local runtime API result alone is explicitly insufficient.
4. **Trust-mode helpers exist but operational integration is not evidenced.** src/beaconTrust.ts defines selectBeaconMode and assertFrozenBeaconMode; src/__tests__/beaconTrust.test.ts tests priority/fallback and rejection of downgrade. Repository code search found no call sites beyond the helper module and its tests. Therefore round-creation/commitment freeze is not yet proven operationally integrated.
5. **The B1 registry has an explicit representation gap.** src/registryFlow.ts says GameRoundCommitment is checked off-chain but is not stored in the current seven-field BeaconRegistryDatum; plutus/BeaconRegistry.hs does not authenticate it. Do not claim that off-chain consistency checks create an on-chain binding.

### Classification

- B3-A real finality and authenticated authority-transition evidence: **OPEN**.
- B3-B real StateRoot-bound storage proof/value evidence: **OPEN**.
- B3-C succinct/Cardano verification: **OPEN**.
- Trust-mode freeze at actual round creation/commitment: **OPEN — source-level helper/tests only; no operational call-site evidence found**.
- B1 registry round-commitment binding: **OPEN — known schema/validator representation gap**.

### Next bounded action

Trace the actual round-creation and ticket-commitment path on the canonical work branch and identify the existing authoritative state boundary for freezing mode + beacon + evidenceRef + roundId. If the current on-chain schema cannot represent that binding, report the exact schema/validator gap for normative authorization; do not silently extend the datum, alter validator semantics, substitute a TypeScript selector, or promote synthetic fixtures to production evidence.

**No source code, validator schema, deployment, or on-chain state was changed by this audit.** V3 and Reveal remain outside this front.


## 44.58 — AGENT B F4 — ROUND-LIFECYCLE TRACE / EXACT INTEGRATION GAP — 2026-10-25

Follow-up to 44.57. The actual create/mint/registry path has now been traced at source level on work/b3-materios-provenance-evidence. This remains a source audit, not a claim that this branch is the canonical deployment baseline.

### Trace

- src/createRound.ts: createPendingRound accepts only target, relayerPkh and optional funding. It writes the initial BeaconPending registry UTxO using the current seven-field BeaconRegistryDatum. Its own security comment says initial Pending creation is not constrained by an on-chain validator, so competing Pending entries can be created for the same round.
- src/registryDatum.ts + plutus/Types.hs: BeaconRegistryDatum contains only brRound, brTarget, brStatus, brBeaconValue, brMcHash, brMateriosContext and brRelayerPkh. It has no trust mode, selected evidenceRef, verifiedAt, or GameRoundCommitment field. GameRoundCommitment exists as a separate Haskell type, but is not embedded in BeaconRegistryDatum.
- src/mint.ts: the Issue/mint path uses DEFAULT_ROUND_ID = 0 unless its existing options override it; constructs a BeaconTarget; selects a Pending registry UTxO by round; optionally checks the relayer PKH client-side; then derives the ticket commitment from ticket identity/player commitment/version/nonce/price/encoded BeaconTarget. No call to selectBeaconMode or assertFrozenBeaconMode was found in the source path.
- plutus/MintPolicy.hs: the on-chain Issue policy checks sameTarget, brRound == btRound and brStatus == BeaconPending. It does not validate or freeze B1/B2/B3 mode or a mode-specific evidence reference.
- src/registryFlow.ts: publishRoundBeacon validates GameRoundCommitment inputs off-chain, derives R, and publishes BeaconReady. The file explicitly acknowledges that the on-chain Pending datum does not carry GameRoundCommitment and the current validator does not authenticate it.

### Exact classification

1. The lifecycle freeze gap is not merely a missing helper call in tests: the active round creation API and current on-chain registry representation have no field/binding for trust mode plus evidence reference.
2. The current ticket commitment binds the BeaconTarget, not a verified trust mode/evidence object. B1 registry authorization proves the designated relayer authorized publication and the supplied R is derived from supplied context; it does not prove B3/B2/B1 provenance.
3. Client-only mode selection/freeze would improve fail-closed UX but would not close the on-chain binding or prevent a competing Pending registry entry.
4. No normative change is authorized by this audit. Do not alter BeaconRegistryDatum, MintPolicy, BeaconRegistry validator, or ticket commitment semantics until the user decides the required binding and compatibility/deployment strategy.

### Next step

Report this precise gap for the user's normative decision. After authorization, implement only the selected boundary and add conformance tests that prove the chosen mode/evidence/round binding at round creation, ticket commitment and on-chain validation. Until then, F4 lifecycle integration and the B1 registry commitment gap remain OPEN. No code, validator schema, branch count, deployment or on-chain state changed in this trace.

## 44.48 REVEAL DIAGNOSTIC BRANCH RECONCILIATION — 2026-10-25

Agent A rechecked the Reveal diagnostic lineage against the live coordination branch and PR #38. This entry is an operational coordination record only; it does not change protocol or validator semantics.

### Refs and evidence

- Coordination branch `work/immortal-green-closure`: pre-update HEAD `1af9acc8580aaa74976efbe0acd90cba8417d707`; this checkpoint update is commit `b669290c378c7f1aa2c84885bfae63410a10be7a`.
- PR #38 head branch `fix/preprod-eev-approval-pin`: diagnostic commit `889e827566e83884d4597fc5136f59b677c5dd66`.
- Preceding diagnostic commit `61941eb87cf4810e9ae179501315ebab466224a4` added isolated Lucid `collectFrom(...).complete()` probes for Prize-only and B1PrizePool-only inputs.
- `889e827` removes manual freeing of the CML diagnostic parse object to test whether WASM object lifetime interferes with Lucid's lazy builder.
- Run #2251 (`40215140216`) was still `in_progress` at this check; its job had not reached the Reveal execution step. It is not yet evidence for either PASS or FAIL of the Reveal probe.

### Compatibility finding

The coordination branch already contains `audit/cardano-integration/reveal-ledger-trace.ts` (blob `89958e2c7b026ea9f680cbd24dff78cedc15aaab`). That trace already builds the Reveal transaction with the two reference inputs, both `collectFrom` inputs, and post-state outputs; it performs reference-script preflight and serialized-CBOR size checks.

PR #38 instead contains `audit/cardano-integration/reveal-ledger-trace-evolution.ts` (blob `ec2c1d1d25e61c33bb091657a1397d1a7c4a578a`). It has a distinct implementation/import set, including a direct `PlutusData.from_cbor_hex` diagnostic and the two isolated completion probes. The PR workflow invokes this Evolution trace; the coordination-branch workflow invokes the existing `reveal-ledger-trace.ts` for its active Reveal path.

Therefore the Evolution file is **not a drop-in replacement**. Do not cherry-pick the two commits alone, replace the existing trace, or change the workflow target without a compatibility review. The minimal candidate for future alignment is to adapt only the isolated builder-completion probes to the existing coordination-branch trace, after confirming its local variable/API compatibility; the CML object-lifetime probe is specific to the Evolution trace's `PlutusData` parser call and must not be copied as though it tested the same code path.

### Guardrails and next action

- Keep V3 carrier untouched.
- Do not change Reveal semantics, transaction size limits, or economic rules.
- Do not create a branch, duplicate the lab run, or merge/cherry-pick the PR.
- Preserve run #2251 as evidence for the PR's diagnostic path. Recheck its terminal status before interpreting it.
- If the failure remains reproducible on the coordination branch, add only bounded diagnostic probes to its existing trace and use the existing workflow path; distinguish construction-only evidence from ledger execution evidence.

**STATUS: BRANCH MISMATCH CONFIRMED / SAFE PORT NOT YET APPLIED / RUN #2251 NOT YET REVEAL-TERMINAL AT CHECK TIME**



## 44.59 — AGENT B F4 — REAFFIRMED NORMATIVE POLICY: TRUSTLESS-FIRST, TRANSPARENT FALLBACK — 2026-10-25

**User clarification:** this is an already-decided normative policy, not an open choice to re-litigate. IMMORTAL must start from the most trustless/permissionless Beacon mode available and descend only when a higher mode fails, through a transparent process.

### Normative policy to preserve

1. For a new round, attempt/select the strongest available verified mode in this order: **B3_VERIFIED → B2_ATTESTED → B1_AUTHORIZED**.
2. A lower mode may be selected only when the higher mode has failed an explicit, reproducible qualification check; lack of evidence, verifier failure, timeout, invalid proof, or unavailable dependency must be recorded as a specific failure reason. Do not silently downgrade.
3. Publish an auditable decision record for each attempted mode and the selected mode: round ID, Beacon identity/value, mode, evidence reference or digest, verifier/qualification result, failure code and relevant timestamps/version identifiers. Preserve privacy/security constraints and do not treat a log alone as cryptographic proof.
4. Once the selected mode and round commitment are frozen, the mode/value/evidence binding cannot silently change mid-round. Any exceptional recovery/restart must follow an explicit protocol rule and leave a verifiable audit trail; agents must not invent that rule.
5. This policy does not itself prove B3/B2/B1 evidence valid. B3-A/B/C gates and on-chain enforcement remain separately evidenced requirements.

### Operational implementation gap

The existing `src/beaconTrust.ts` helper already encodes B3 → B2 → B1 priority and a no-change assertion, but the preceding source trace found no operational call sites in round creation/mint. The current seven-field `BeaconRegistryDatum` does not bind trust mode/evidence, and `MintPolicy.hs` does not enforce that binding. Thus policy intent exists, but the lifecycle/on-chain enforcement remains **OPEN**.

### Next bounded action

Do not ask the user to choose the trust hierarchy again. Perform a source-grounded comparison of the smallest viable on-chain enforcement boundaries (extend the round registry vs. a separate immutable round/trust commitment), evaluating how each can enforce: unique round binding, B3→B2→B1 qualification/fallback transparency, mode/evidence freeze, and ticket-commitment linkage. Report the comparison and implementation delta before editing protocol schemas or validators. No normative semantics are to be invented; do not touch V3 or Reveal, create branches, or claim GREEN without evidence.

**No implementation code or on-chain state changed in this checkpoint update.**


## 44.60 — AGENT B F4 — ON-CHAIN BINDING OPTIONS COMPARISON — 2026-10-25

**Scope:** source-grounded comparison of extending the existing round registry versus a separate immutable round/trust commitment. Source inspected on `work/b3-materios-provenance-evidence`; this branch is evidence for the audit, not automatically the deployment baseline. No implementation files changed.

### Existing evidence reviewed

- `src/beaconTrust.ts` (SHA `e9ce2f73be14b85ed4af84863ef40bc68a6625a8`): helper priority is B3_VERIFIED → B2_ATTESTED → B1_AUTHORIZED, but repository source audit found no operational round-creation/mint call sites.
- `src/createRound.ts` (SHA `4112d87b7b6d88d77da0bbaee5ed2e172527609e`): initial Pending registry UTxO is currently created by a plain `payToContract`; source comment explicitly acknowledges no on-chain creation validator constraint and competing Pending entries for the same round are possible.
- `src/registryDatum.ts` (SHA `0d611c29fe4f74b9b2fa4cd328e8fe2edb5f48f4`) and `plutus/Types.hs` (SHA `a10b2ce9b74b2e91dc7d75577996dc9abb555930`): current `BeaconRegistryDatum` has seven fields and no trust mode/evidence commitment; `GameRoundCommitment` is a separate type not embedded in the registry datum.
- `plutus/BeaconRegistry.hs` (SHA `184f4178139dde01845853dcc0ab51371949ec9b`): validator authenticates the Pending→Ready transition via the configured relayer and deterministic beacon derivation; it does not authenticate source trust mode/proof validity and does not constrain creation of the initial Pending output.
- `plutus/MintPolicy.hs` (SHA `0d59fc05b4c11873984fffd10014bd46d8470509`): Issue reads a registry reference and checks target/round/Pending status, but not trust mode/evidence. The ticket commitment currently covers ticket identity, player commitment, game version, nonce, price and encoded BeaconTarget only.
- `plutus/Beacon.hs` (SHA `3c9065e7b6b2b9484d845d03078dca165e40f031`), `src/beacon.ts` (SHA `4ad58dedb68bb3db1b52900b113126105dcd8766`) and `plutus/PrizeValidator.hs` (SHA `dab86e7f25dc160b3331861fec3042c4f3005a02`): the same ticket commitment is recomputed during Reveal using the existing fields and target. A persistent trust binding cannot simply be added to the issuance hash alone; the commitment data and Reveal-side recomputation must remain byte-for-byte consistent. This would require a PrizeDatum/commitment-interface and Reveal-validator compatibility change, even if the random outcome derivation itself is left unchanged.

### Comparison

**Option B — extend the existing registry datum**
- Add a canonical trust-mode value and evidence digest/reference to the registry round state; ensure the Pending→Ready transition preserves those fields and the validator prevents changes.
- Wire the B3→B2→B1 qualification/fallback record into round creation before freezing the selected result.
- Update Issue/MintPolicy to validate the selected mode/evidence binding and include its canonical digest in the ticket binding.
- Still must solve the currently unguarded initial Pending creation / duplicate-round problem. Merely adding fields to the datum does not establish a unique canonical round. A round-uniqueness/anchor mechanism must be enforced on-chain.
- Lowest conceptual surface area because the existing registry already serves as the Issue reference, but changes a live datum schema and registry validator and still has the Reveal commitment-compatibility dependency.

**Option C — separate immutable round/trust commitment**
- Create a distinct round commitment carrying round identity, selected trust mode and evidence digest; Issue must reference and validate it, and the ticket binding must include its canonical commitment hash.
- Must have on-chain uniqueness and immutability enforcement (e.g. a canonical one-per-round anchor/token/policy rule); a separate UTxO by itself is not immutable or unique.
- Adds another reference object, deployment/configuration surface and reference-input/transaction-size overhead. It does not remove the need to keep ticket commitment data and Reveal-side recomputation consistent.
- Cleaner separation of round identity/trust provenance from the existing operational Beacon registry, but larger integration footprint and no evidence in this audit that a suitable existing carrier already satisfies all required invariants.

### Technical conclusion

**Provisional smallest-delta direction: extend the existing registry (B), but only together with a separately proven on-chain uniqueness rule for the canonical round anchor.** It reuses the existing registry reference and avoids introducing an additional trust-carrier UTxO. This is a technical recommendation, not permission to edit the schema or validator. If the unique-anchor invariant cannot be expressed safely within the existing registry architecture, reopen C with an explicit cost comparison.

The trust policy remains exactly as reaffirmed in 44.59: try B3 first, then B2, then B1 only after a recorded, reproducible qualification failure; publish an auditable decision trail; freeze the selected mode and evidence binding for the round; never silently downgrade. The fallback process does not itself prove that a tier's underlying evidence is valid.

### Required implementation gates before code changes

1. Identify and specify the on-chain one-round/one-canonical-anchor invariant and how the initial Pending output is created without allowing competing anchors.
2. Specify the canonical serialization/hash of mode + evidence digest + round identity, including failure/audit record representation; do not treat an off-chain log as cryptographic proof.
3. Map compatibility changes across `Types.hs`, `registryDatum.ts`, `createRound.ts`, `BeaconRegistry.hs`, `MintPolicy.hs`, `Beacon.hs`/TS mirror, `PrizeDatum` serialization, and `PrizeValidator.hs` Reveal commitment verification.
4. Add conformance tests for strongest-available selection, explicit fallback reasons, invalid/missing evidence fail-closed behavior, no duplicate canonical round anchor, immutable mode/evidence binding, and ticket/round/evidence cross-binding.
5. Keep B3-A/B/C evidence gates separate. Do not label B3 available merely because the selector prefers B3; real proof/verification qualification must pass.
6. Existing guardrail remains: do not change V3 or Reveal semantics in this front. Because the persistent ticket commitment requires Reveal-side compatibility work, keep implementation blocked and coordinate/authorize that bounded contract change explicitly rather than smuggling it into an unrelated patch.

**STATUS: architecture comparison recorded; no implementation/schema/validator/deployment/on-chain changes; F4 remains OPEN.**

## 44.49 REVEAL PROBE RESULT — RUN #2251 — 2026-10-25

Run #2251 (`40215140216`, head `889e827566e83884d4597fc5136f59b677c5dd66`) has now completed with **FAIL**. The native-ledger V3 carrier step passed; the active Reveal step failed.

The Evolution trace records both provider datums as strings whose CBOR exactly matches the expected fixture encoding (Prize length 658 hex characters; B1PrizePool length 96). Direct `PlutusData.from_cbor_hex` calls pass for both. However, both isolated `collectFrom(...).complete()` probes fail with `RuntimeError: memory access out of bounds` in `PlutusData.from_cbor_hex`, called from Lucid Evolution `TxUtils.ts:60` / `Collect.ts:61`. The subsequent stage probes show the `collectFrom` calls themselves can be created; the failure occurs during completion/conversion. This is strong localization, not yet proof of a specific library defect or of an unsafe lifetime issue.

### Coordination-branch follow-up

The same minimal probes are a candidate to port into the existing `audit/cardano-integration/reveal-ledger-trace.ts` on this branch, using its already-bound observed UTxOs, reference inputs, redeemers and post-state datums. They must remain construction-only (no signing/submission), emit independent PASS/FAIL evidence, and leave the authoritative full trace in place. The attempted source-file write through the GitHub connector was blocked and **no source-code change was made** in this step. No additional lab run was launched.

**STATUS: RUN #2251 REVEAL FAIL CONFIRMED / CML DIRECT PARSE PASS / LUCID COMPLETION CONVERSION FAIL / MINIMAL PORT IDENTIFIED BUT NOT APPLIED**



## 44.61 — AGENT B F4 — CANONICAL ROUND ANCHOR / COMMITMENT DELTA — 2026-10-25

Follow-up to 44.60. This narrows the next implementation gate to the missing invariant and the exact ticket-commitment compatibility surface. Source inspection only; no implementation files changed.

### 1. Canonical-round uniqueness: current state and minimum invariant

- `src/createRound.ts` creates the Pending registry output with a plain `payToContract` and no mint-policy or validator execution that authorizes creation. It therefore cannot establish one canonical registry UTxO per round.
- A datum field containing `roundId`, mode or a commitment hash is not by itself unique: Cardano permits multiple UTxOs with the same datum.
- A client query that finds one registry UTxO is not a consensus rule and cannot close the duplicate-anchor risk.
- The protocol needs an on-chain canonical anchor invariant: for each canonical round identity, exactly one active anchor is accepted by Issue; a competing anchor must be impossible to create or unusable by every protocol path.

### 2. Candidate enforcement pattern to prototype (not yet implemented)

**Preferred candidate for an engineering spike:** a unique round-anchor NFT/state transition, issued under an on-chain policy that is bound to a canonical round-creation input/state transition, with the NFT held by the registry UTxO and checked by Issue. If round IDs are sequential, a singleton round-counter/state UTxO could serialize creation and advance atomically with creation of the anchor. The design must establish that the policy cannot mint a second accepted anchor for the same canonical round and that the token cannot be burned/reissued to bypass uniqueness. A deterministic token name alone is not sufficient.

Before choosing this pattern, inspect whether an existing authoritative singleton/counter can be reused without coupling unrelated ticket serials to round creation. The current ticket counter is not assumed to be an adequate round counter. Do not deploy a new policy or alter ticket-counter semantics during the spike.

**Alternative:** a separate one-shot seed UTxO / per-round parameterized mint policy. It may give strong uniqueness, but requires a trustworthy way to establish each round's seed and may create additional script/configuration complexity. No existing evidence in this audit proves that this mechanism is already implemented.

### 3. Canonical trust commitment fields

The frozen on-chain commitment must bind, at minimum:
- canonical round identity (`roundId` plus the existing canonical game/configuration/version commitment, once authenticated);
- selected trust mode (B3_VERIFIED, B2_ATTESTED, or B1_AUTHORIZED);
- Beacon target/value identity;
- a cryptographic digest/reference for the selected evidence bundle and qualification result;
- a version/domain separator for the encoding.

The audit record must preserve the attempted higher tiers and their explicit failure codes before a lower tier is selected. The chain-bound digest should commit to a canonical, deterministic representation of that record; a mutable URL or plain text log alone is not sufficient. Exact field encoding, digest domain and treatment of timestamps/large evidence bundles still need an engineering spec and conformance vectors.

### 4. Ticket commitment and Reveal compatibility: exact affected surface

The existing commitment function in `plutus/Beacon.hs` and its TS mirror `src/beacon.ts` includes ticket ID, player commitment, game version, nonce, price and encoded BeaconTarget. `MintPolicy.hs` verifies this commitment during Issue; `PrizeValidator.hs` recomputes it during Reveal. Therefore the trust commitment must be added through a synchronized versioned commitment scheme and persist in authenticated ticket data (or be immutably recoverable from a uniquely bound on-chain anchor that Reveal verifies). Changing only the issuance calculation is incorrect.

The smallest plausible compatibility design to evaluate is to bind a `roundTrustCommitmentHash` into the ticket commitment and persist the same hash in `PrizeDatum`, with both Issue and Reveal validating it against the canonical round anchor. This requires a schema change to `PrizeDatum`, TS datum builders, the Haskell/TS commitment functions, MintPolicy, and Reveal verification. It is not approved for implementation yet; preserve the existing V2 commitment semantics until the versioned migration plan and tests are reviewed. Do not change random-result derivation.

### 5. Required spike and acceptance tests

The next bounded engineering spike should be test-only/design-first and answer:
1. Can the candidate anchor mechanism reject two competing Pending anchors for the same round under adversarial transaction construction?
2. Can Issue reject a registry reference whose anchor token, round identity, mode, or evidence digest does not match the canonical commitment?
3. Can the registry transition Pending→Ready preserve the frozen mode/evidence digest while publishing the beacon, with no change to trust tier?
4. Can Reveal validate the same round-trust commitment without changing random-result derivation?
5. Does fallback produce a deterministic, auditable record: B3 attempted first; each failed tier has a reproducible reason; only then is the next tier eligible?
6. Does any path accept missing/invalid evidence, a duplicate anchor, an altered evidence digest, or silent downgrade? Every such case must fail closed.

### Status / guardrails

Architecture recommendation remains **B (extend existing registry)** only as a provisional smallest-delta direction, contingent on a sound unique-anchor mechanism. The trust hierarchy/fallback policy is already decided by the user and must not be re-asked. No code/schema/validator/deployment/on-chain state changed. V3 and Reveal semantics remain protected; any later ticket-commitment compatibility change must be coordinated and explicitly reviewed, not smuggled into a Beacon-only patch. F4 remains **OPEN**.

## 44.62 — AGENT B F4 — EXISTING COUNTER REUSE SPIKE — 2026-10-25

**Scope:** bounded source audit to determine whether the existing Counter/Singleton can safely serialize canonical Beacon round creation. Read-only audit; no code, schema, validator, deployment or on-chain changes.

### Files and evidence inspected on `work/immortal-green-closure`

- `plutus/CounterValidator.hs` (blob `29d3bcf6d6a4a0b4348cfa5e17a61ec822093870`): the validator accepts the counter transition `n -> n+1`, requires exactly one continuing counter output at its own address, and prevents draining its lovelace. It does not encode a round identity or bind a counter step to BeaconRegistry creation.
- `plutus/MintPolicy.hs` (blob `0d59fc05b4c11873984fffd10014bd46d8470509`): the counter input is part of the ticket sale path and the counter-derived value is used to derive the serial ticket token name. This is ticket issuance state, not a round-creation authority.
- `src/mint.ts` (blob `b9b1a7f4846e4cfdf8862368421b8ce7cf8b1534`): documents and implements the sale flow with Counter `n -> n+1`; the default round ID is separately configured as `DEFAULT_ROUND_ID = 0`.
- `src/createRound.ts` (blob `4112d87b7b6d88d77da0bbaee5ed2e172527609e`): creates a Pending registry output with `payToContract`; its own security comment says initial Pending creation is not constrained by an on-chain validator and competing Pending entries for the same round are possible.
- `plutus/BeaconRegistry.hs` (blob `184f4178139dde01845853dcc0ab51371949ec9b`): validates the authorized Pending→Ready publication transition, including relayer signature, deterministic beacon derivation and preservation of existing target/round/relayer fields. It does not govern initial Pending creation or enforce a one-anchor-per-round minting invariant.

### Finding

**The existing ticket Counter is not a safe drop-in round counter.** Its current invariant serializes ticket issuance; it has no round identity and is not atomically bound to creating a canonical Beacon anchor. Reusing it would couple round creation to ticket serial issuance, while its present validator alone would not establish the required canonical round uniqueness.

The existing V3 carrier, B1 PrizePool and Oracle singleton references are also not established by the inspected source as round-creation counters. Their existence or singleton identity does not automatically authorize Beacon anchor creation. No inspected source evidence establishes an already-deployed, suitable round-counter singleton or a round-anchor minting policy.

### Spike conclusion / next bounded gate

1. Do **not** repurpose the ticket Counter or change its semantics.
2. Do **not** claim uniqueness from a deterministic token name, client-side singleton query, or datum equality.
3. The next design/test-only spike should inventory actual minting policies and deployment parameterization for an already-existing one-shot/unique anchor mechanism. If none has a provable round-bound invariant, record that a dedicated round-anchor policy/state transition is a new protocol surface requiring explicit design review and authorization.
4. Any candidate must adversarially demonstrate that two Pending anchors for one canonical round cannot both be accepted by Issue, including burn/reissue and competing-transaction cases. A candidate round counter must advance atomically with anchor creation and must not be the ticket serial counter.
5. Keep trust-mode/evidence binding and ticket commitment/Reveal compatibility as separate gates. No commitment/schema edits in this spike.

**STATUS: EXISTING COUNTER REUSE REJECTED AS UNSAFE ON CURRENT EVIDENCE; NO SUITABLE ROUND-ANCHOR MECHANISM PROVEN; F4 OPEN. V3 AND REVEAL UNCHANGED.**

## 44.63 — AGENT B F4 — ONE-SHOT POLICY INVENTORY / REUSE DECISION — 2026-10-25

**Scope:** inspect existing one-shot minting policies to decide whether one can already enforce canonical Beacon round-anchor uniqueness. Design/source audit only; no code, schema, deployment or on-chain changes.

### Existing policies inspected on `work/immortal-green-closure`

- `PRE-RICH/onchain/GenesisCarrierMintPolicy.hs` (blob `c95a16b03258201a29b2593daecb8aa512fb259b`): parameterized by one seed `TxOutRef` and configured token name; requires the seed input to be consumed and exactly one token entry of quantity 1 under its own currency symbol. The one-shot seed is effective for a single Genesis carrier identity, not for arbitrary per-round anchors.
- `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs` (blob `b778d8a559d4050a565ac5f49a8d5cccb5451b42`): parameterized by seed and token name; requires the seed to be consumed and the complete mint value to equal exactly one token. It is a V3 economic-state carrier authority, not a Beacon round policy.
- `PRE-RICH/onchain/PreRichControlCarrierMintPolicy.hs` (blob `03e6b4bc9caf8866eca57c4ba1e987799cb49b15`): same seed-consumption/exact-singleton-mint pattern for the authenticated control carrier. It does not encode Beacon round identity or trust evidence.
- `plutus/export/Export.hs` (blob `b33cd08b2d9dc6800215e771f18d561c87bc34c7`) exports these three carrier mint-policy factories, alongside the ticket MintPolicy and BeaconRegistry validator. No Beacon round-anchor mint-policy factory is exported there.

### Reuse decision

**No existing one-shot policy is reusable as-is for Beacon round anchors.** Each existing policy is parameterized and named for a different singleton authority. Reusing its policy ID/token would conflate Genesis, V3 economic state, or B2 control identity with Beacon round identity; using one seed-bound policy for all rounds would also only establish one one-shot issuance, not a distinct canonical anchor for every round.

The source does establish that the repository has working *design patterns* for seed-bound one-shot singleton assets. A new Beacon-specific policy could adapt that pattern, but that is a new protocol surface, not a safe configuration-only reuse. In particular, one-shot uniqueness of a single token does not by itself prove uniqueness for an unbounded set of round IDs. A per-round policy would require an authoritative, non-replayable seed/creation authority for each round; a global policy would need an on-chain state transition that serializes and binds each round creation. Neither mechanism is evidenced for Beacon today.

### Minimum proof obligations for any proposed new policy

1. Bind the created asset to the canonical round identity, with a deterministic encoding/domain separator.
2. Prove the creation authority cannot be reused to create a competing anchor for that same round, including parallel competing transactions and any burn/reissue route.
3. Require Issue to validate the exact anchor asset and its round identity, not merely find a datum at the registry script address.
4. Ensure the anchor and Pending registry datum are created atomically; later Pending→Ready publication must preserve the same identity and frozen trust/evidence commitment.
5. Demonstrate positive and adversarial ledger tests for two competing Pending anchors, wrong-round token, wrong token name/policy, burn attempt, replayed seed, and mismatched trust/evidence digest.
6. Keep this independent of ticket serial Counter semantics and do not alter V3 or Reveal during this spike.

### Result

**F4 remains OPEN.** The audit found reusable implementation patterns, but no existing Beacon-compatible unique-anchor mechanism or evidence of its deployment. The next step is a design/test-only prototype proposal for a dedicated Beacon anchor authority and its binding to the registry/Issue path; it must be reviewed before any code or schema changes. Existing ticket commitment/Reveal compatibility remains a separately coordinated gate.

**No implementation, validator, datum schema, deployment, transaction submission, or on-chain state changed.**



## 44.64 — AGENT A — COORDINATION-TRACE COMPLETION PROBES APPLIED — 2026-10-25

The two construction-only Reveal completion probes have now been added to the existing `audit/cardano-integration/reveal-ledger-trace.ts` on `work/immortal-green-closure` (source change commit `45ab69666ae275dbe4641c96142d03ee1106d500`). The probes independently exercise `Prize-only` and `B1PrizePool-only` using the already observed UTxOs, bound reference-script inputs, redeemers, and post-state datum CBOR.

Each probe calls Lucid `.complete({ localUPLCEval: false })` and emits separate PASS/FAIL evidence; it does not sign or submit. The existing authoritative Reveal builder and trace remain immediately afterward and unchanged. No validator, datum schema, economic rule, V3 carrier, maxTxSize setting, or on-chain state was changed.

The branch advanced again while this work was being verified; current branch head at checkpoint update: `16e3051231218fa2af63dc8ba08fe4b0dd43af0b`. The source blob was verified on the shared branch and contains both probe labels. No workflow-dispatch action is exposed through the connected GitHub tools, so a new lab run has not been manually dispatched from this session. Check the push-triggered Actions run for this branch before drawing conclusions; do not launch a duplicate run if one is already active.

**STATUS: MINIMAL PROBES COMMITTED AND VERIFIED ON COORDINATION BRANCH / CI RESULT PENDING. V3 AND REVEAL SEMANTICS UNCHANGED.**


## 44.65 — AGENT B F5 — MATERIOS EXECUTION-PROOF RPC IMPLEMENTATION RECHECK — 2026-10-25

**Scope:** verify whether the external Materios execution-proof transport requested by issue #50 is actually present. Read-only cross-repository audit; no external repository writes and no local implementation/deployment.

### Evidence checked

- Upstream issue [Flux-Point-Studios/materios#50](https://github.com/Flux-Point-Studios/materios/issues/50), titled `B3: expose finalized execution proof via materios_b3_calculateCommitteeProof RPC`, is **closed** with `state_reason: not_planned` (closed 2026-09-26). Its body specifies exact block/method/callData binding, the SDK `ProofProvider::execution_proof(...)` path, a versioned deterministic proof envelope, and a real finalized-block fixture. Closure is not implementation evidence.
- Upstream `partnerchain/node/src/rpc.rs` on `main` was fetched at blob `30827863c7b8f6fb507b008cee9f572ec48fe06f`. The file registers System, Orinq Receipts and MOTRA RPC modules only; no B3 execution-proof RPC is registered there.
- Repository code search for the exact name `materios_b3_calculateCommitteeProof` returned no implementation match.
- IMMORTAL's `poc/materios-grandpa/test/MATERIOS-B3-REAL-FIXTURE-CONTRACT-v1.md` (blob `bb78e7d1bca3531860c03aab51d54d2e5d20471e`) still requires a real finalized checkpoint, real GRANDPA justification, native execution proof, state-root/storage proof where applicable, separate verification results, and exact hashes/versions/inputs before closure.
- The existing anchor triangulation note (blob `ebc464d9839fdfd523b2cb5806e0aa63a53c144a`) still identifies semantic binding from PRE-RICH round/checkpoint to canonical `anchorId` as unresolved; the observed SDK formula remains a producer convention, not a normative rule.

### Finding and gate status

**F5 transport remains OPEN.** Issue #50 being closed as `not_planned` must not be mistaken for a delivered RPC. The currently inspected upstream `main` source does not register the method, and no exact-name implementation was found. Consequently, there is no basis here to claim a real native execution-proof fixture or B3 certification.

Next bounded action: obtain an explicit implementation path/owner for the transport task or build an isolated, reviewable implementation proposal against the pinned `polkadot-stable2409-4` API. Do not duplicate authority selection in TypeScript; do not use synthetic proof as runtime evidence. The real finalized-block fixture and independent verification remain separate acceptance gates. No upstream changes, IMMORTAL code/schema changes, deployment, or on-chain actions were performed.

**STATUS: F5 RPC TRANSPORT NOT EVIDENCED ON UPSTREAM MAIN; REAL FIXTURE AND B3 VERIFICATION OPEN.**


## 44.66 — AGENT B F5 — MINIMAL RPC IMPLEMENTATION CONTRACT (DESIGN ONLY) — 2026-10-25

**Purpose:** turn the missing Materios RPC into an implementable, reviewable task without writing to the external repository or confusing execution proof with finality.

### Source/API facts confirmed

- Materios workspace partnerchain/Cargo.toml blob df28b401485b3a5fb736ce02ddde8bc7917e6109 pins the Substrate/Polkadot SDK crates to Git tag polkadot-stable2409-4, including sc-client-api.
- Node dependency file partnerchain/node/Cargo.toml blob efcacffc9412c239370b81449b08e9198adaf8d2 already declares sc-client-api = { workspace = true }; no new SDK dependency is indicated.
- partnerchain/node/src/service.rs blob 33298f0fbce45ea7f333728302ee8080eaf12ec8 defines FullClient = sc_service::TFullClient<Block, RuntimeApi, WasmExecutor<...>>. The service already has a concrete client object to pass into RPC dependencies.
- partnerchain/node/src/rpc.rs blob 30827863c7b8f6fb507b008cee9f572ec48fe06f currently has no ProofProvider<Block> bound/import or B3 RPC registration. create_full consumes FullDeps { client, pool }, so the least invasive integration point is an additional method registered on the existing module, using the same client.
- The workspace declares the pinned SDK tag, but the current source file alone does not establish that a proposed implementation compiles; compile and tests against that exact tag remain mandatory.

### Proposed thin RPC contract (not implemented)

Method: materios_b3_calculateCommitteeProof

Input:
- at: exact 32-byte block hash; reject absent/malformed values. Never substitute best/head state.
- method: non-empty runtime API method name; reject absent/empty values.
- callData: exact SCALE-encoded bytes, accepted as strict hex or base64 only if one encoding is chosen and versioned; reject malformed input.

Execution:
1. Parse at into the pinned runtime's Block::Hash and construct the exact BlockId<Block> required by sc_client_api::ProofProvider<Block>::execution_proof.
2. Invoke only client.execution_proof(&block_id, &method, &call_data) (exact signature to compile-check against the pinned tag). Preserve returned result bytes and proof bytes without semantic reinterpretation.
3. Return a versioned deterministic envelope with schema/version, chain/runtime identity, exact at, method, call-data bytes or cryptographic hash, execution result bytes, serialized proof, proof-system/version identifier and proof commitment. Canonical encoding and hash domain must be specified before fixture generation; do not improvise them in the RPC.
4. Return structured errors for invalid inputs, unknown/unavailable block state, execution failure and proof-generation failure. No fallback to best state and no synthetic response.

### Trust boundary / non-goals

- The execution proof authenticates a runtime execution only under its supported verifier and required code/state witnesses. It does not prove that at is GRANDPA-finalized.
- Finalized header, GRANDPA justification/set ID, ancestry, storage/state-root binding and authority-transition verification remain separate artifacts/results as required by MATERIOS-B3-REAL-FIXTURE-CONTRACT-v1.md.
- The RPC must not calculate or reimplement committee selection, accept an operator-selected committee as proof, or mark the returned result as VerifiedAuthoritySetTransition.
- Exact method allowlisting versus arbitrary runtime method invocation, input/output limits, RPC exposure/authentication and envelope hash algorithm are explicit implementation-review items; do not silently invent a policy for them.

### Minimum test matrix before considering transport complete

1. Exact block hash + exact method + exact call data are reflected in the response commitment.
2. Missing/malformed hash, empty method and malformed bytes are rejected.
3. An unavailable/unknown block and execution/proof errors fail closed; no head-state substitution.
4. Mutating each input independently changes the committed request identity or produces a failure.
5. Output encoding is deterministic and versioned; proof serialization round-trips.
6. An integration test on a real Materios node produces a non-synthetic fixture; independent verification is tested separately.
7. GRANDPA/finality and state-root checks are never inferred from successful RPC execution alone.

**STATUS: DESIGN CONTRACT ONLY. NO UPSTREAM CODE CHANGE. F5 REMAINS OPEN UNTIL IMPLEMENTATION, PINNED-TAG BUILD/TESTS, REAL FIXTURE AND INDEPENDENT VERIFICATION PASS.**


## 44.67 — AGENT B F5 — PINNED SDK SIGNATURE VERIFIED / RPC CONTRACT CORRECTION — 2026-10-25

Read-only source verification against the exact SDK tag used by Materios. The file `substrate/client/api/src/proof_provider.rs` at `paritytech/polkadot-sdk` tag `polkadot-stable2409-4` defines `ProofProvider<Block>::execution_proof` as:

`fn execution_proof(&self, hash: Block::Hash, method: &str, call_data: &[u8]) -> sp_blockchain::Result<(Vec<u8>, StorageProof)>`

Thus the earlier design-only wording that suggested constructing `BlockId<Block>` and calling `execution_proof(&block_id, ...)` is incorrect for this pinned tag. The implementation contract is corrected: parse the supplied exact `at` into `Block::Hash`, then call `client.execution_proof(at_hash, method, &call_data)` with the trait in scope. The method returns execution result bytes plus a `StorageProof`; it does not itself establish GRANDPA finality. The authoritative source is [the pinned SDK source](https://github.com/paritytech/polkadot-sdk/blob/polkadot-stable2409-4/substrate/client/api/src/proof_provider.rs).

Materios already declares `sc-client-api` through the workspace and `FullClient` is the concrete service client, so no additional dependency is indicated. This confirms a minimal technical integration path but not successful compilation, runtime behavior, proof verification or a real fixture. Before implementation, confirm `StorageProof` SCALE serialization/API on the same pinned tag and settle the versioned envelope, proof hash domain, RPC exposure/authentication and input limits during review; do not invent these as normative decisions.

**STATUS: EXACT EXECUTION-PROOF API SIGNATURE CONFIRMED AGAINST PINNED TAG; DESIGN ONLY. F5 OPEN. NO UPSTREAM OR ON-CHAIN CHANGE.**


## 44.68 — AGENT B F5 — PINNED STORAGEPROOF SCALE CONTRACT / CONSUMER RECHECK — 2026-10-25

**Scope:** close the remaining source-level question from 44.67: whether the pinned SDK `StorageProof` has canonical SCALE serialization, and whether IMMORTAL already has an independent consumer. Read-only source audit; no implementation or upstream writes.

### Pinned SDK fact

At `paritytech/polkadot-sdk` tag `polkadot-stable2409-4`, `substrate/primitives/trie/src/storage_proof.rs` defines:

```rust
#[derive(Debug, PartialEq, Eq, Clone, Encode, Decode, TypeInfo)]
pub struct StorageProof {
    trie_nodes: BTreeSet<Vec<u8>>,
}
```

Therefore `StorageProof` supports native SCALE `Encode`/`Decode` at the exact SDK tag. Its node collection is a `BTreeSet`, and the source exposes iteration in lexicographical order. This supports using the SDK's own SCALE encoding as the transport serialization for the proof object, provided the producer and verifier pin compatible type/revision and the verifier rejects malformed or trailing bytes. It does **not** define the RPC envelope serialization, proof-commitment hash algorithm/domain, or canonical JSON/hex policy; those remain explicit review decisions, not inferred defaults.

Source: [pinned StorageProof implementation](https://github.com/paritytech/polkadot-sdk/blob/polkadot-stable2409-4/substrate/primitives/trie/src/storage_proof.rs).

### IMMORTAL consumer recheck

- `poc/materios-execution-verifier/src/lib.rs` already SCALE-decodes `StorageProof`, rejects trailing bytes, checks the runtime WASM Blake2-256 against an expected hash, and calls the SDK's `execution_proof_check` against a supplied state root. It compares the reproduced runtime result with the expected result.
- `poc/materios-execution-verifier/src/storage.rs` independently checks a storage proof against an expected state root/key/value and rejects malformed SCALE, trailing bytes, root mismatch and value mismatch.
- The current unit fixtures in `storage.rs` are locally synthesized trie fixtures (e.g. key `anchor` / value `anchor-record`). They are useful for verifier mechanics only and do not satisfy the real Materios finalized-block fixture contract.
- The verifier README explicitly leaves GRANDPA finality, canonical block identity, deployed runtime/WASM provenance, selector semantics and the surrounding authority transition to outer B3 verification.

### Finding / remaining gates

The SDK serialization question is resolved at source level; an IMMORTAL-side execution-proof verifier and storage-proof verifier already exist. This narrows F5 but does not close it. Still missing on the evidence inspected here: the Materios node RPC transport on upstream main, a real finalized Materios fixture, independently authenticated block/state-root/runtime-code bindings, and an end-to-end result crossing `VerifiedAuthoritySetTransition` with finality checked separately. No claim that the existing Rust crate was built or run in this session.

**STATUS: SCALE `StorageProof` ENCODING CONFIRMED AT PINNED TAG; EXISTING CONSUMER FOUND; REAL MATERIOS FIXTURE / RPC / END-TO-END B3 EVIDENCE OPEN. NO IMPLEMENTATION, DEPLOYMENT, OR ON-CHAIN CHANGE.**


## 44.65 — AGENT A — REVEAL COMPLETION PROBES / RUN #2252 RESULT — 2026-10-25

Run #2252 (40218479088, source commit 45ab69666ae275dbe4641c96142d03ee1106d500) completed with overall FAIL, but the active Reveal trace itself progressed through successful build, size preflight, submission and replay rejection.

### What the run proves

- Both newly-added isolated probes reached the Yaci/Ogmios evaluator rather than reproducing the prior memory access out of bounds from Lucid's PlutusData.from_cbor_hex conversion.
- Prize-only was rejected during script evaluation with a generic validator failure and no useful trace.
- B1PrizePool-only was rejected with the explicit trace: B1PrizePool: exactly one decodable prize input required. This is expected for a transaction that spends only the pool and omits its coupled Prize input; the isolated probes are therefore not valid ledger transactions and their FAIL statuses must not be interpreted as a fresh datum-conversion failure.
- The full canonical Reveal trace completed: preflight reports 1,139 bytes <= 16,384 with zero embedded Plutus scripts and both reference inputs present; the signed transaction was 1,245 bytes; the trace reports replayRejected: true. Thus the active Reveal transaction was built, submitted and its replay was rejected in this run.
- V3 carrier step and the other main candidate traces, including the isolated Aiken Reveal positive/negative ledger twins, passed.

### Why the overall workflow failed

The run's terminal failures were later, separate checks:
1. Run native Yaci UTxO decoder conformance failed with a Haskell compile error: Illegal type: ‘11’ Perhaps you intended to use DataKinds.
2. JEV operational prompt generation failed closed because the generated prompt exceeded its 7,000-character limit; the dedicated prompt-generator test itself passed.

These two failures do not establish a failure in the canonical Reveal transaction.

### Next diagnostic refinement

The current isolated probes call Lucid complete(), which invokes the configured evaluator; omitting the coupled input makes script evaluation fail and obscures the narrower builder-conversion question. If another probe is needed, isolate builder completion from ledger evaluation using a clearly labelled, temporary test-only evaluator stub with bounded synthetic ExUnits, restored in a finally block. Such evidence must be explicitly classified as construction-only, never ledger acceptance. Do not sign/submit those probe transactions. Keep the existing full Reveal path as the authoritative ledger test.

STATUS: FULL REVEAL TRACE BUILT/SUBMITTED; SIZE GATE PASS; REPLAY REJECTED. PRIOR CML MEMORY-BOUNDS FAILURE NOT REPRODUCED IN RUN #2252. ISOLATED PROBE FAILS ARE DUE TO INVALID SINGLE-INPUT SCRIPT CONTEXTS; NOT A VALID LEDGER VERDICT. LAB OVERALL FAILS LATER AT UTxO DECODER COMPILATION AND JEV PROMPT SIZE. V3 AND REVEAL SEMANTICS UNCHANGED.


## 44.66 — AGENT A — PROBE REFINEMENT TO SEPARATE BUILDER FROM EVALUATOR — 2026-10-25

After inspecting run #2252, the two single-input probes were refined in source commit 6b250be5c8dbef0d08b5a1efe4ff1b9bce3aef60. Each probe now temporarily replaces the provider evaluator with a labelled construction-only stub returning synthetic ExUnits, runs Lucid complete(), and restores the original evaluator in finally. Output statuses are explicitly BUILDER_COMPLETION_PASS/FAIL with ledgerValidation=NOT_RUN; the probe transactions are never signed or submitted. The canonical Reveal path executes after the evaluator has been restored and continues to use the real evaluator and authoritative ledger submission.

This refinement is specifically intended to avoid treating the expected script failure from a deliberately incomplete single-input transaction as a builder conversion failure. Synthetic ExUnits are diagnostic scaffolding only and do not qualify transaction execution, solvency, or ledger acceptance.

Branch head verified after the source commit: 6b250be5c8dbef0d08b5a1efe4ff1b9bce3aef60. No fresh run for this commit was visible in the workflow-run query at checkpoint time; inspect Actions before starting anything manually, and do not duplicate an automatically triggered run.

**STATUS: PROBE NOW SEPARATES LUCID BUILDER COMPLETION FROM SCRIPT EVALUATION; RESULT PENDING CI. CANONICAL REVEAL REMAINS THE ONLY LEDGER-AUTHORITATIVE PATH. V3, REVEAL SEMANTICS AND maxTxSize UNCHANGED.**


## 44.69 — AGENT B F5 — LIVE-CI COVERAGE / EXECUTION-PROOF GAP — 2026-10-25

**Scope:** reconcile the current IMMORTAL CI and RPC client with the external Materios implementation gap, so existing work is not repeated. Source/CI configuration audit only.

### Existing IMMORTAL-side coverage found

- `.github/workflows/materios-evidence-conformance.yml` runs the canonical-evidence tests, `test:execution-proof`, `test:rpc-b3`, TypeScript typecheck, and the Materios GRANDPA test/build suite.
- `.github/workflows/materios-b3-execution-verifier.yml` runs Rust formatting and verifier tests. Its non-PR jobs separately capture finalized-state evidence, attempt a real GRANDPA witness, and capture/verify a live storage proof.
- `poc/materios-checkpoint/src/rpc.ts` already contains `getCommitteeExecutionProof(callDataHex, at)`, sending the exact block hash and call-data hex to `materios_b3_calculateCommitteeProof`. The local tests exercise this through a mock JSON-RPC server; those tests validate client contract/response handling, not availability of the method on the real node.
- `docs/04-verification/MATERIOS-B3-NODE-RPC-PATCH-HANDOFF.md` explicitly labels the upstream node-side patch as **defined / not applied**.

### External upstream recheck

Fetched `Flux-Point-Studios/materios` `main` again:
- `partnerchain/node/src/rpc.rs` remains blob `30827863c7b8f6fb507b008cee9f572ec48fe06f`; `create_full` registers System, Orinq Receipts and MOTRA only. No `materios_b3_calculateCommitteeProof` registration is present.
- `partnerchain/node/Cargo.toml` remains blob `efcacffc9412c239370b81449b08e9198adaf8d2`; `sc-client-api` is already a direct workspace dependency, but the proposed RPC registration and direct encoding/hex dependencies are not present in the inspected `rpc.rs`.

### Exact remaining gap

The configured CI has meaningful live captures for finalized headers/GRANDPA and storage proofs, plus mock tests for the execution-proof client. It does **not** demonstrate a live native execution proof from Materios, because the public node source still lacks the RPC transport. No successful current CI run was independently confirmed in this source audit, and no workflow was dispatched.

The next action is therefore not to rewrite IMMORTAL's RPC client or verifier. It is to obtain/apply/review the node-side Materios patch through its own repository process, compile it against the pinned SDK, and then add/obtain a real finalized-block execution-proof fixture consumed by the existing verifier. The upstream issue `#50` is closed `not_planned`, so it cannot be treated as an implementation owner or completion signal. Do not write to the upstream repository or dispatch CI without explicit authorization.

**STATUS: IMMORTAL CLIENT / MOCK TESTS / VERIFIER / LIVE STORAGE+FINALITY CAPTURE PIPELINE EXIST; REAL NODE EXECUTION-PROOF RPC AND END-TO-END REAL B3 FIXTURE REMAIN OPEN. NO CODE OR UPSTREAM CHANGE IN THIS AUDIT.**


## 44.70 — AGENT B — MATERIOS WORK PAUSED BY USER — 2026-10-25

Per explicit user direction, pause all active Agent B work on Materios and wait for upstream developments. This is a coordination/status decision, not a technical closure.

- Do not continue the upstream RPC patch handoff, execution-proof transport implementation, live fixture work, or further Materios investigations while paused.
- Do not write to the external Materios repository, dispatch workflows, or declare F5 GREEN.
- Preserve the existing IMMORTAL-side client, verifier, tests, evidence pipeline, and the documented gap unchanged.
- Resume only when the user asks to resume or when a concrete upstream development is presented for review. At resumption, first inspect upstream Materios repository/PR/release state and the shared checkpoint to avoid duplicating work.
- F5 remains OPEN: the native execution-proof RPC and a real end-to-end B3 fixture have not been established. F4 Beacon uniqueness/trust-commitment work remains separately OPEN and is not implied to be paused unless coordinated by the user.

**STATUS: MATERIOS F5 WORK PAUSED AT USER REQUEST; WAITING FOR UPSTREAM DEVELOPMENTS; NO TECHNICAL CLOSURE OR GREEN CLAIM.**


## 44.71 — AGENT B F4 — IMPLEMENTATION BOUNDARY RECHECK — 2026-10-25

**Scope:** F4 read-only source audit after pausing F5/Materios. No normative or protocol code changes.

### Current implementation boundary confirmed

- `plutus/BeaconRegistry.hs` validates the spend-side `BeaconPending → BeaconReady` transition: one own input, designated relayer signature, nonempty receipt fields, exactly one continuing registry output, stable target/round/relayer and deterministic beacon derivation. It does not constrain the creation of the initial Pending output or enforce a unique registry anchor for a round.
- `src/createRound.ts` creates that Pending output with an ordinary `payToContract`; its own comment explicitly acknowledges there is no on-chain creation constraint. A client-side relayer check is not a uniqueness or consensus guarantee.
- `plutus/Types.hs` defines `GameRoundCommitment` as a type, but the seven-field `BeaconRegistryDatum` does not contain it. `src/registryFlow.ts` validates the supplied commitment off-chain and explicitly says the current datum/validator do not authenticate it. `src/registryDatum.ts` deliberately serializes only the seven current fields.
- `plutus/Beacon.hs` / `src/beacon.ts` already share a canonical `ticketCommitment` that binds ticket ID, player commitment, game version, nonce, price and encoded BeaconTarget. No `roundTrustCommitmentHash` is currently part of that commitment or persisted in `PrizeDatum`.
- The counter validator remains a simple monotonic counter, and the existing ticket serial counter must not be repurposed as round-anchor uniqueness authority.

### Consequence / bounded next work

F4 is a protocol-representation gap, not a missing client-side check. Closing it requires a coordinated, versioned on-chain design for (1) non-replayable/unique round-anchor creation and (2) authenticated binding of the chosen round/trust commitment across registry, Issue and Reveal. A client-only filter cannot close either property. Any change to datum shape, ticket commitment, mint policy or Reveal validation is a compatibility-sensitive protocol change and must not be silently introduced under this audit.

No implementation was made because the uniqueness authority and versioned migration semantics are normative design choices; the existing checkpoint already records that they require explicit coordinated approval. No V3 or Reveal behavior was changed. F5/Materios remains paused per §44.70.

**STATUS: F4 SOURCE BOUNDARY RECONFIRMED; INITIAL-PENDING UNIQUENESS AND ON-CHAIN GAME-ROUND/TRUST COMMITMENT BINDING REMAIN OPEN. NEXT ACTION IS TO PREPARE A TESTABLE VERSIONED CHANGESET ONLY AFTER THE REQUIRED DESIGN CHOICE IS AUTHORIZED.**


## 44.72 — AGENT B F4 — PERMISSIONLESS UNIQUENESS DESIGN OPTIONS / TEST CONTRACT — 2026-10-25

**Purpose:** prepare the F4 next-step design/test contract without changing protocol semantics or selecting a normative architecture. Materios/F5 remains paused under §44.70.

### Hard invariant to close

For a canonical game-round identity, there must be at most one accepted on-chain round anchor, and Issue/Reveal must authenticate the same frozen anchor/trust commitment. A client query that picks one among multiple Pending UTxOs is not an invariant. The current seven-field registry datum and current ticket commitment do not persist/authenticate a dedicated trust commitment.

### Candidate A — permissionless serialized registry state (preferred first to evaluate)

A protocol-controlled singleton state UTxO, protected by a dedicated spending validator and a non-reissuable singleton asset, serializes round-anchor creation. Creation remains permissionless if the validator allows any caller to advance the state while requiring the exact next canonical round/identity and exactly one corresponding anchor output. The transition consumes the sole state UTxO and recreates it with a monotonic sequence/commitment update, so concurrent attempts conflict on the same input. The validator must prevent skipped/replayed round identities and authenticate the anchor output. This candidate is not yet proven to support arbitrary out-of-order round IDs; do not assume that it does.

### Candidate B — one-shot anchor asset per round

A round anchor carries a unique native asset whose policy can mint only once using a specific seed UTxO. Cardano's one-shot UTxO pattern provides uniqueness for that policy. However, a separate arbitrary seed/policy chosen by each caller does NOT guarantee one global canonical anchor for a round: the canonical seed/policy derivation and round-identity binding must themselves be protocol-defined and non-conflicting. Therefore this is not a drop-in fix unless a unique canonical seed authority is established.

### Candidate C — permissioned creation

An admin/relayer key or committee authorizes Pending creation. This can be simpler, but it weakens permissionlessness and introduces authority/key governance. It is a fallback only if the higher trustless options are shown to fail under a reproducible, explicitly classified reason and the user's already-decided downgrade policy is followed. No silent fallback.

### Shared test contract (required whichever design is selected)

1. Two concurrent create attempts for the same canonical round: at most one can be accepted.
2. Duplicate/replayed round ID after anchor exists: reject.
3. Different round ID with same GameRoundCommitment, and same round ID with altered commitment: reject.
4. Wrong network, mainchain reference, game config hash, protocol version, asset policy/name, or trust-mode commitment: reject.
5. Issue referencing a non-canonical/competing anchor: reject on-chain.
6. Reveal whose stored commitment differs from the Issue-time frozen commitment: reject on-chain.
7. Replayed/burned/reissued anchor asset or counterfeit token under a different policy: reject.
8. Multiple registry outputs, missing singleton, malformed datum, or absent continuation/state token: fail closed.
9. Valid canonical creation → Issue → Reveal path: pass, preserving existing V2 behavior unless and until a separately versioned migration is approved.
10. Property/model test concurrent submissions and arbitrary round ordering; record whether ordering is supported or prohibited by the chosen rule.

### Compatibility / safety boundary

- Do not repurpose the ticket serial Counter, V3 carrier, B2 control singleton, or any unrelated singleton as the Beacon authority.
- Do not change the current ticket commitment domain/version or append fields to PrizeDatum/BeaconRegistryDatum until a versioned schema/validator migration is explicitly selected and its old/new compatibility behavior is tested.
- Do not touch V3 or Reveal semantics as part of this design-only work.
- User's general policy remains: evaluate the most trustless/permissionless solution first; any downgrade requires a reproducible higher-tier failure, explicit failure code, transparent record and frozen selected mode. This does not by itself authorize a specific F4 implementation or schema migration.

**STATUS: DESIGN OPTIONS AND ACCEPTANCE TEST CONTRACT RECORDED; NO NORMATIVE OPTION SELECTED, NO PROTOCOL CODE CHANGED. NEXT STEP: compare candidate A against current validator/transaction constraints, then bring only unresolved normative choice(s) to the user before implementation.**


## 44.73 — AGENT B F4 — SERIALIZED REGISTRY FEASIBILITY / COMMITMENT AUTHORITY — 2026-10-25

Follow-up to §44.72: candidate A is a promising mechanism for preventing concurrent writes, but **serialization alone is not sufficient**.

### Source check

- `plutus/CounterValidator.hs` is a monotonic integer counter: it checks one continuing counter output with value `n+1` and value preservation. It has no round identity, canonical commitment, or registry-token binding. It is not a Beacon registry authority and must not be repurposed.
- The current `BeaconRegistryDatum` remains seven fields and has no authenticated `GameRoundCommitment`. `GameRoundCommitment` exists as a type and off-chain derivation, but there is no on-chain canonical source that forces a creator to use the right game ID/configuration before the first anchor is accepted.
- Therefore a permissionless singleton transition that accepts arbitrary caller-supplied commitment bytes could serialize a bad first write or enable griefing. It would fix the race but not establish the intended round identity.

### Additional mandatory design condition

Before candidate A can be implemented, define how the canonical round identity/configuration is fixed *before* the permissionless create transaction. Candidate sources to evaluate, without selecting one yet:
1. immutable protocol/game configuration already authenticated by an existing on-chain datum or parameter;
2. a prior explicit commitment transaction whose uniqueness and update rules are independently enforced;
3. an authority/committee attestation, which is a weaker trust tier and only eligible under the user's explicit reproducible-failure downgrade policy.

A client-supplied hash, a datum field that is not checked by the validator, or a caller-selected seed does not satisfy this condition. The final create transaction must validate the exact canonical commitment and bind it into the unique anchor. The selected trust mode and evidence must be frozen and auditable.

### Next bounded task

Continue read-only inventory of existing immutable config/round identity carriers and validator references to determine whether candidate 1 already exists and can be reused without repurposing unrelated state. If not, report the minimal unresolved authority decision; do not implement a new singleton, alter schemas, or modify Issue/Reveal semantics before that decision.

**STATUS: SERIALIZATION CANDIDATE REFINED; PRE-EXISTING CANONICAL COMMITMENT AUTHORITY NOT YET FOUND. F4 REMAINS OPEN; NO CODE CHANGE.**


## 44.74 — AGENT B F4 — CANONICAL ROUND CONFIG AUTHORITY INVENTORY — 2026-10-25

Read-only inventory following §44.73. No implementation, schema, deployment or workflow changes.

### Sources inspected on `work/immortal-green-closure`

- `plutus/Types.hs`: `GameRoundCommitment` is a standalone type; `BeaconRegistryDatum` still has seven fields and does not carry it. `PrizeDatum` carries `pdGameVersion` and `pdBeaconTarget`, but no frozen `roundTrustCommitmentHash` or canonical configuration hash.
- `plutus/BeaconRegistry.hs`: the validator authenticates the relayer's publication transition and deterministic derivation from supplied receipt/context; it does not authenticate a pre-existing canonical game configuration or constrain initial Pending creation.
- `src/config.ts`: network is declared as Preprod and deployment identities (addresses/policy IDs/token names) are loaded from environment variables. These identify deployment components but are not an on-chain canonical game/round configuration authority.
- `src/loadValidator.ts`: script factories are parameterized with existing validator/script identities and B1 dependencies; no already-established canonical game-round configuration carrier was identified in the inspected interface.
- `src/preRichIssueAdmissionBridge.ts`: authoritative Issue admission and economic transition evidence are a separate admission boundary; the inspected type surface does not establish a canonical on-chain Beacon round/config commitment.
- Existing B1 PrizePool, V3 carrier, B2 control and serial Counter identities are application/economic/deployment components. None may be repurposed as Beacon authority without a separately authorized protocol design.

### Result

**Candidate 1 from §44.73 is NOT FOUND in the inspected current interfaces.** This is a bounded source audit, not proof that no such carrier exists anywhere in every branch or deployment artifact; however, no existing authenticated on-chain carrier is available to reuse from the reviewed path without changing protocol representation.

The minimum unresolved design decision is now precise: decide how the canonical game/config/round identity becomes authoritative *before* permissionless anchor creation, and how its frozen trust-mode commitment is bound across registry → Issue → Reveal. The implementation cannot safely infer this from environment configuration, client-supplied hashes, a relayer-signed receipt, or unrelated singleton tokens.

### Next action boundary

Do not create a new singleton, alter `BeaconRegistryDatum`/`PrizeDatum`, change ticket commitment domains, or touch Issue/Reveal/V3 until the user authorizes a versioned design. Continue to prioritize a permissionless/trustless option; a lower tier requires a reproducible higher-tier failure and an explicit auditable downgrade decision. F5/Materios remains paused under §44.70.

**STATUS: F4 READ-ONLY INVENTORY RECORDED; NO REUSABLE CANONICAL ROUND-CONFIG AUTHORITY IDENTIFIED IN THE INSPECTED INTERFACES. F4 REMAINS OPEN; NO CODE CHANGE.**


## 44.75 — AGENT B F4 — TRUSTLESS-FIRST CANDIDATE DESIGN / AUTHORITY TRADE-OFF — 2026-10-25

Follow-up to §44.74. Design analysis only; no normative option selected and no protocol code changed.

### Candidate D — immutable configuration commitment + dedicated permissionless round-state machine

This is the strongest concrete candidate found for further evaluation, while preserving the user's trustless-first policy:

1. **Pin the canonical profile at deployment:** the dedicated Beacon-round validator/policy is parameterized by the canonical game ID, configuration hash, protocol/schema version, network/domain and a unique bootstrap seed reference. These values must be frozen in the deployment manifest and reproduced from the exact script artifact/hash. This avoids letting the first public caller choose the game configuration. It is still a deployment-time trust boundary: whoever authorizes the initial artifact/configuration must be governed and audited.
2. **Create one dedicated singleton authority:** a one-shot policy tied to the specified seed UTxO mints one non-reissuable state token into the new Beacon round-state UTxO. The minting policy checks the exact token name/quantity and the required script destination/initial datum. No existing B1/B2/V3/counter token is reused.
3. **Permissionless sequential advancement:** any caller may propose the next round, but the spending validator requires the singleton token on the consumed state UTxO, the exact next round identity, the deployment-pinned game/config/version/network, and a correctly derived commitment. It requires exactly one continuing state output with the same singleton and incremented round/commitment. Competing transactions conflict on the same state input, so at most one transition from that state can confirm.
4. **Anchor binding:** the registry anchor must carry the exact canonical round commitment accepted by the state transition. Issue must verify that anchor against the same commitment and freeze it into the ticket's commitment domain; Reveal must compare against the Issue-time frozen value. This necessarily requires a versioned registry/ticket datum and commitment migration, not a client-only patch.
5. **Read-only shared config alternative:** if the configuration must be readable without serializing every Issue, publish the immutable config UTxO as a reference input. Reference inputs avoid read contention, but only help if the referenced datum/script identity is itself authenticated and cannot be substituted. The mutable round-state singleton remains separate.

### What this candidate does and does not guarantee

- It can make **round creation permissionless after deployment** and serialize conflicting advances without a continuously authorized relayer.
- It does not magically make the initial deployment/configuration self-authenticating. The canonical config hash and bootstrap seed/authority must be fixed by a reviewed artifact and governance process; a caller-selected hash is insufficient.
- The sequential state machine naturally disallows skipped or arbitrary out-of-order round IDs unless a different canonical allocation rule is explicitly designed. Do not claim arbitrary ordering.
- A one-shot token proves uniqueness only for that policy/seed. It does not prove the semantic correctness of game configuration or cross-contract commitment binding by itself.
- A fixed deployment parameter can make a malicious first state transition impossible under the validator, but upgrades/new policy versions still require explicit governance and compatibility rules.

### Minimal decision required before implementation

The user need not choose every code detail yet. The unresolved normative choice is whether PRE-RICH accepts a **deployment-pinned canonical configuration plus permissionless sequential round state** as the initial F4 trustless design, including its ordering constraint and versioned Issue/Reveal migration. If not, an alternative authority model must be explicitly specified. No lower-trust tier is proposed as an automatic fallback.

### Acceptance checks before any GREEN claim

- Bootstrap seed and singleton token can be minted exactly once, to the required script address with the canonical initial datum.
- Caller cannot alter pinned game/config/version/network or initialize a competing authority.
- Two concurrent transitions from the same state: at most one confirms; stale-state retry is deterministic.
- Skip, replay, duplicate round, wrong commitment and wrong trust mode all reject.
- Registry, Issue and Reveal compare the same frozen commitment across the versioned schema.
- Existing ticket versions are handled explicitly and remain unchanged unless migration policy says otherwise.
- Independent build reproduces the deployed script hashes; model/property tests cover sequence transitions and adversarial initialization.

Cardano's eUTXO model supports the underlying mechanism: consumed UTxOs cannot be spent twice, concurrent spends of the same state conflict, and reference inputs can share immutable data without consuming it. These ledger properties support the candidate but do not decide PRE-RICH's normative configuration authority. See Cardano documentation on [eUTXO concurrency](https://developers.cardano.org/docs/get-started/technical-concepts/eutxo/) and [reference inputs, CIP-31](https://cips.cardano.org/cip/CIP-0031).

**STATUS: CONCRETE TRUSTLESS-FIRST CANDIDATE AND TRADE-OFF RECORDED; REQUIRES USER'S NORMATIVE ACCEPTANCE BEFORE IMPLEMENTATION. F4 OPEN; NO CODE CHANGE. F5/MATERIOS STILL PAUSED.**


## 44.76 — AGENT B F4 — VERSIONED SCHEMA / MIGRATION BLUEPRINT (DESIGN ONLY) — 2026-10-25

This blueprint converts candidate D (§44.75) into a reviewable implementation sequence. It is **non-normative** and does not authorize source changes. It deliberately names logical fields rather than freezing constructor order, serialization, hash encoding, or commitment domain; those must be specified and reviewed before implementation.

### Proposed version boundary

Create a new explicit Beacon/Issue commitment version (name/version identifier to be finalized in the normative spec). Do not silently reinterpret existing V1/V2 datum bytes or existing ticket NFTs. The migration must define:
- which ticket/schema versions can still be issued;
- whether legacy pending tickets can be revealed under their original semantics;
- the exact activation boundary for the new version;
- whether old and new validators coexist and how a ticket chooses its version;
- a fail-closed rule for missing or mismatched version tags.

### Logical data contract (field names are illustrative)

1. **Deployment-pinned immutable profile**
   - network/domain identifier;
   - canonical game identifier;
   - canonical configuration hash;
   - protocol/schema version;
   - bootstrap seed UTxO reference and singleton policy/artifact identity.
   These values must be fixed by validator/policy parameters and independently reproduced from the deployed artifacts. A public transaction caller must not supply replacements.
2. **Dedicated round-state datum**
   - schema version;
   - pinned profile/config hash;
   - current canonical round index/identity;
   - current canonical GameRoundCommitment;
   - singleton authority token identity;
   - transition state needed to prove exactly one valid continuation.
   Every transition validates the old state and emits exactly one valid continuation carrying the same authority token. The precise datum and value-preservation rules remain to be specified.
3. **BeaconRegistry datum vNext**
   - existing registry fields retained only as required by compatibility;
   - explicit schema/version tag;
   - canonical game/config/profile hash;
   - canonical round identity;
   - authenticated GameRoundCommitment;
   - trust-mode commitment/hash.
   The registry validator must prove the commitment against the authenticated round-state authority, not merely check nonempty bytes or a relayer signature.
4. **Issue-time frozen ticket commitment**
   - include the authenticated registry/round commitment and trust-mode commitment in a new domain-separated ticket commitment version;
   - Issue must verify the referenced canonical registry anchor on-chain and persist the same values in the ticket's on-chain datum/commitment representation;
   - the client may calculate candidate values but cannot be the authority for accepting them.
5. **Reveal-time verification**
   - compare the ticket's frozen schema version, round commitment and trust-mode commitment against the exact canonical fields established at Issue;
   - reject missing, altered, substituted or version-incompatible values;
   - preserve legacy behavior only for explicitly supported legacy versions; do not modify existing Reveal semantics as part of this design note.

### Implementation order once the normative design is approved

A. Freeze the encoding spec first: canonical byte encoding, domain separators, hash preimages, field ordering, integer normalization, network/config identity, and cross-language golden vectors for TypeScript/Haskell.

B. Implement the dedicated authority/policy and state validator in isolation; prove one-shot bootstrap, correct initial datum, singleton quantity/destination, monotonic sequential transition, and stale-state conflict behavior. Do not reuse Counter, V3, B2 or B1 state.

C. Extend registry datum/validator and TypeScript serializer/parser together. Add golden round-trip vectors and negative tests for missing or mismatched commitment/version fields.

D. Extend Issue admission/validator and ticket datum/commitment version in a separately reviewable change. Verify canonical registry reference and freeze the commitment on-chain. Do not change the old commitment domain in place.

E. Extend Reveal only under the selected versioned migration and with the owner of the Reveal front coordinating the exact compatibility contract. Agent B must not independently alter Reveal or duplicate Agent A's diagnostic work.

F. Add end-to-end conformance tests from bootstrap → round transition → registry publication → Issue → Reveal, plus adversarial/property tests listed in §44.72 and §44.75. Then collect build, CI, ledger/runtime and deployment-certification evidence separately; source compilation alone is not GREEN.

### Cross-language and adversarial test minimum

- Identical commitment bytes/hash from Haskell and TypeScript for the same fixture, including boundary integers and malformed/empty byte fields.
- Wrong schema version, config hash, network/domain, round identity, trust mode, registry UTxO or singleton token: reject.
- Duplicate initialization, duplicate round, stale state, skipped round and concurrent state spends: reject or deterministically serialize according to the selected sequential rule.
- Registry commitment altered after off-chain calculation: on-chain validation rejects.
- Issue attempts with a client-only commitment, noncanonical registry output or mismatched profile: reject.
- Ticket datum and commitment disagree, Reveal receives a different round/trust commitment, or a legacy ticket is presented under new-version rules: reject.
- Valid vNext path passes while supported legacy fixtures retain their specified behavior.
- Artifact hashes and deployment manifest reproduce exactly; evidence identifies source commit, toolchain, schema version, network and validator/policy hashes.

### Explicitly unresolved (normative, not to be guessed by implementation)

1. Accept or reject the deployment-pinned configuration + permissionless sequential-round architecture.
2. Select exact canonical identity fields, commitment encoding/domain and schema/version numbers.
3. Define migration activation and the handling of already-issued/pending tickets.
4. Define the governance/approval procedure for bootstrap artifact/configuration and later upgrades.

**STATUS: MIGRATION BLUEPRINT RECORDED FOR REVIEW; NO SOURCE, SCHEMA, WORKFLOW OR DEPLOYMENT CHANGED. F4 REMAINS OPEN. F5/MATERIOS REMAINS PAUSED.**


## 44.77 — AGENT B F4 — IMPLEMENTATION INSERTION-POINT / DEPENDENCY AUDIT — 2026-10-25

Read-only follow-up to §44.76. Current branch source was re-fetched; no protocol code was changed.

### Confirmed insertion points and coupling

| Layer | Current source / behavior | Required vNext seam | Regression boundary |
|---|---|---|---|
| Commitment primitive | `plutus/Beacon.hs`: `deriveGameRoundCommitment` already hashes game ID, round, config hash and protocol version; `ticketCommitment` binds ticket ID, player commitment, game version, nonce, price and encoded BeaconTarget. | Specify a new domain/versioned commitment preimage that binds canonical round/profile and trust-mode commitment; mirror exact encoding in TypeScript and Haskell. | Do not mutate existing `ticketDomain` or existing digest semantics in place. |
| Registry representation | `plutus/Types.hs`: `BeaconRegistryDatum` has seven fields and no `GameRoundCommitment`, schema version, config hash or trust-mode commitment. `src/registryDatum.ts` serializes exactly those seven fields and explicitly documents the gap. | Add a separately versioned registry representation and synchronized serializer/parser/golden vectors. | Constructor field order is serialized data; appending fields without a version/compatibility plan risks datum decoding breakage. |
| Registry transition | `plutus/BeaconRegistry.hs`: Pending→Ready checks relayer signature, receipt/context nonempty, one own input, same target/round/relayer and deterministic beacon derivation. | Require the canonical round-state authority/commitment and prove the output preserves the same canonical profile/round commitment. Initial Pending creation still needs a uniqueness/authority rule. | A relayer signature authenticates the publisher, not the canonical game/config identity. |
| Issue / mint | `plutus/MintPolicy.hs:newPrizeDatumValid` checks ticket fields, pool binding, existing ticket commitment, and a referenced registry in Pending state with matching target/round. `src/mint.ts` serializes PrizeDatum fields 0..22. | New-version Issue must verify the authenticated canonical anchor and freeze the profile/round/trust commitments in the vNext ticket representation/digest. | Preserve current commitment checks for legacy version; no client-only field is authoritative. |
| Sync / Reveal | `plutus/PrizeValidator.hs:validateSyncBeacon` reads registry from reference inputs and compares target/round/beacon receipt fields. Reveal recomputes current ticket commitment from the legacy preimage. | New-version path must compare the same frozen commitment from Issue; migration rules must state exactly which validator branch each ticket version follows. | This is an interface dependency, not permission for Agent B to edit Reveal independently or change its current semantics. |
| Deployment identity | `src/config.ts` and validator loading provide deployment IDs/parameters, but no authenticated on-chain canonical config carrier was found in the inspected interfaces. | Deployment manifest must bind network/domain, game ID, config hash, protocol/schema version, seed UTxO and exact compiled policy/validator hashes. | Environment variables alone are not an on-chain authority; deployment artifacts must be independently reproduced. |

### Feasibility conclusions

1. The hash primitive already exists, so vNext does not need an invented hashing algorithm; it needs a normative encoding/domain specification and on-chain enforcement.
2. The most consequential change is the **cross-layer representation migration**: Types/datum ↔ Haskell validators ↔ TypeScript serializers/builders ↔ mint policy/Issue ↔ Reveal. Updating only `registryFlow.ts` or `registryDatum.ts` cannot close the on-chain trust gap.
3. The current Issue path already reads registry data via reference inputs in the Prize validator; reference inputs are appropriate for reading immutable config without consuming it, provided the config identity and datum are authenticated. The mutable round-state UTxO remains a separate serialized authority. Cardano docs confirm reference inputs are visible to scripts without being consumed, and that spending validators inspect datum, redeemer and transaction context. Sources: [CIP-31](https://cips.cardano.org/cip/CIP-0031), [Cardano validator context](https://developers.cardano.org/docs/developers/curriculum/smart-contracts/datum-redeemer-context/).
4. No current source evidence establishes an authenticated canonical round/config carrier that can be reused as-is. This remains a bounded audit, not a claim about every historical branch or deployed artifact.
5. No compile/test/ledger evidence was produced by this read-only audit. F4 remains OPEN; nothing is GREEN by implication.

### Recommended execution sequence after explicit design approval

- **Gate 0 — Normative freeze:** approve the authority architecture, ordering rule, exact fields/domains/encoding, and old-ticket activation/compatibility policy.
- **Gate 1 — Encoding-only fixtures:** add cross-language golden vectors for commitment and datum encoding without changing deployed validator behavior.
- **Gate 2 — New authority in isolation:** dedicated one-shot bootstrap and sequential state transition; test duplicate initialization, wrong profile, replay, stale-state and concurrency.
- **Gate 3 — Registry vNext:** add the versioned datum and on-chain state/commitment verification with legacy fixtures.
- **Gate 4 — Issue vNext:** verify canonical registry/profile and freeze the same commitment into a new ticket commitment version.
- **Gate 5 — Reveal integration:** coordinate with the Reveal owner; implement only the approved version branch and run legacy + vNext conformance.
- **Gate 6 — Evidence:** independent build/hash reproduction, unit/property tests, CI, ledger runtime and deployment evidence; report each layer separately.

**STATUS: INSERTION-POINT AND DEPENDENCY MATRIX RECORDED; READ-ONLY AUDIT ONLY. NO SOURCE/SCHEMA/WORKFLOW/DEPLOYMENT CHANGE. F4 OPEN. F5/MATERIOS STILL PAUSED.**


## 44.78 — AGENT A — REVEAL BUILDER COMPLETION PROBES / INTEGRATION LAB #2253 — 2026-10-25

Run: [IMMORTAL Cardano Integration Lab #2253](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40222957767), source commit `6b250be5c8dbef0d08b5a1efe4ff1b9bce3aef60`; completed `failure`.

### Reveal diagnostic findings

- Both construction-only probes emitted `BUILDER_COMPLETION_PASS`:
  - `Prize-only`
  - `B1PrizePool-only`
- These probes temporarily stubbed `providerWithEvaluation.evaluateTx` with synthetic ExUnits, called Lucid `complete({ localUPLCEval: false })`, and restored the real evaluator in `finally`. They were unsigned, not submitted, and explicitly report `ledgerValidation: NOT_RUN`.
- This is evidence that the builder-completion path did **not** reproduce the earlier `memory access out of bounds` under the synthetic-evaluator isolation. It does not prove that the original failure was caused by the evaluator, nor that isolated one-input transactions are valid ledger contexts.
- The canonical Reveal trace ran with the real evaluator after restoration. Its reference-script preflight reported 1,139 bytes, both expected reference inputs present, zero embedded Plutus scripts, and `maxTxSize=16384`. The serialized canonical trace transaction reported 1,245 bytes, `belowMaxTxSize=true`, payout 200, and `replayRejected=true`. The replay rejection is expected evidence that replay of the already-consumed transaction is rejected; it is not a Reveal failure. The trace's transaction/reference and execution-budget diagnostics were emitted without changing V3 or Reveal semantics.
- The isolated Aiken V3 candidate's wrong-secret twin was rejected by native Yaci. This is candidate-path evidence only; it is not a claim that the experimental candidate is semantically identical to the canonical production Haskell Plutus V2 validator.

### Overall lab outcome and unrelated blockers

The workflow concluded `failure` due to two later checks:

1. Native Yaci UTxO decoder conformance failed to compile: `YaciUTxO.hs:54:55 — Illegal type: ‘11’ Perhaps you intended to use DataKinds`, at `natVersion @11`.
2. JEV operational prompt generation refused to truncate a generated prompt exceeding 7,000 characters. Its dedicated generator test still passed.

The JEV registry/evidence packet and Notion evidence ledger steps completed successfully; later evidence records identify the decoder as failed and dependent gates as skipped. These two workflow blockers do not negate the builder-probe results, but they prevent the whole Integration Lab from being GREEN.

### Next action boundary

- Keep V3 carrier, Reveal semantics, and `maxTxSize=16384` unchanged.
- Do not rerun the lab merely to repeat the completed probes. First fix the bounded Haskell compile issue in coordination with the owner of `audit/cardano-ledger-runner/YaciUTxO.hs`, and handle the JEV prompt-size contract without truncating safety boundaries.
- The original Lucid/CML conversion concern is **not reproduced in the isolated builder-completion probes**, but remains only partially resolved: the synthetic evaluator is a diagnostic boundary, not a root-cause proof. Preserve the canonical real-evaluator ledger path as the authoritative integration evidence.

**STATUS: BOTH ISOLATED BUILDER-COMPLETION PROBES PASS; CANONICAL TRACE FITS THE 16,384-BYTE LIMIT AND REPLAY IS REJECTED; INTEGRATION LAB FAILS ON SEPARATE DECODER-COMPILE AND JEV-PROMPT-LENGTH CHECKS. NO V3/REVEAL SEMANTICS CHANGED.**


## 44.78 — AGENT B F4 — EXISTING TEST COVERAGE / GOLDEN-VECTOR GAP AUDIT — 2026-10-25

Read-only test inventory on the live `work/immortal-green-closure` branch. No tests or protocol code were changed and no test command was executed.

### Existing coverage located

- `src/__tests__/beaconTrust.test.ts` tests off-chain trust-mode selection and prevents silent downgrade after a round commitment. It does **not** prove that the selected mode/commitment is authenticated on-chain or stored in BeaconRegistryDatum/PrizeDatum.
- `src/registryFlow.ts` recomputes `deriveGameRoundCommitment` and rejects off-chain mismatches, but its own documentation acknowledges the seven-field on-chain registry does not persist/authenticate the commitment.
- `src/beacon.ts` and `plutus/Beacon.hs` mirror the current field encoding and derivation domains. The reviewed test inventory did not identify a dedicated cross-language golden-vector suite for `deriveGameRoundCommitment`, `encodeBeaconTarget`, `ticketCommitment`, or BeaconRegistry datum serialization.
- `src/registryDatum.ts` documents its seven-field constructor order. The reviewed inventory did not identify a focused round-trip/negative-test suite for this datum.
- Issue admission tests exist, but the inspected Issue bridge tests are focused on authoritative economic admission evidence; their presence is not evidence that a canonical Beacon round/config/trust commitment is enforced by the minting policy.

This is a bounded search of the current branch's discovered `src/__tests__` inventory and inspected files, not a proof that no related fixture exists elsewhere. Before claiming absence globally, implementation work should search the full test tree and CI workflows again.

### Test additions required before any schema implementation is accepted

**Tier A — byte-level compatibility (no validator semantics changed):**
1. Fixed fixtures for game ID, round ID, config hash, protocol version, BeaconTarget, ticket fields and expected canonical preimage bytes/hash.
2. Same fixtures evaluated by TypeScript and Haskell; compare exact bytes where exported and exact digest otherwise.
3. Boundary cases: zero and positive round IDs, multi-byte fields, empty byte strings where the encoding permits them, long integers, and negative integer rejection/normalization according to the already-established legacy contract. Do not decide a new negative-value policy implicitly.
4. Datum serialization round-trip tests that assert exact constructor index, field count, order, and byte encodings.

**Tier B — trust binding and schema versions:**
1. Mutate one field at a time: game ID, config hash, protocol/schema version, network/domain, round ID, trust-mode commitment, registry identity and singleton policy/name.
2. Reject absent, duplicate, malformed or conflicting vNext fields.
3. Verify that a commitment supplied only by the client or off-chain registryFlow cannot satisfy on-chain Issue admission.
4. Ensure legacy ticket fixtures still select legacy semantics, and vNext fixtures cannot be interpreted as legacy or vice versa.
5. Test registry → Issue → Reveal equality of the frozen commitment, coordinated with the Reveal owner.

**Tier C — state-machine / ledger behavior:**
1. Duplicate bootstrap and counterfeit singleton token reject.
2. Concurrent round-state spends allow at most one transition from the same state; stale retries are deterministic.
3. Replay, duplicate round, skipped round and wrong profile reject according to the approved sequential rule.
4. Full positive and negative end-to-end tests on a local ledger emulator first, then Yaci/Cardano runtime evidence under a separately reviewed workflow.

### Implementation safety conclusion

The safest immediate implementation unit, **after normative encoding/version approval**, is the isolated golden-vector and serialization conformance layer. It can expose Haskell/TypeScript drift before adding a new state machine or changing ticket datum constructors. Until the encoding and migration policy are approved, do not create a speculative vNext domain name, assign schema version numbers, or modify protocol source.

Cardano CIP-31 confirms reference inputs allow transactions to read UTxOs without consuming them, but that feature does not authenticate a datum by itself; contract logic must still bind the expected identity. Source: [CIP-31 Reference inputs](https://cips.cardano.org/cip/CIP-0031).

**STATUS: EXISTING COVERAGE AND TEST GAPS MAPPED; NO TEST EXECUTION AND NO SOURCE CHANGE. F4 OPEN. F5/MATERIOS REMAINS PAUSED.**


## 44.79 — AGENT B F4 — LEGACY GOLDEN-VECTOR REGRESSION TEST ADDED — 2026-10-26

Added `src/__tests__/beaconCommitmentVectors.test.ts` in commit `deb82b5548fca723428415cd44f3df4337a2b5aa`, then re-fetched the file and verified its contents on `work/immortal-green-closure`.

The test pins three expected values for the **existing implementation only**:
- `encodeBeaconTarget` for network 1, round 381, mainchain reference `aabbcc`, version `v1`;
- `deriveGameRoundCommitment` for fixed game ID/config hash/round/version;
- existing `ticketCommitment` V2 with fixed ticket/player commitment/game version/nonce/price/target.

Expected values were independently calculated from the documented length-prefixed ASCII-decimal/raw-byte encoding and SHA-256. This is a TypeScript regression fixture, **not yet a cross-language Haskell-vs-TypeScript conformance result** and not evidence that the on-chain validators authenticate the round commitment.

### Verification status

- File creation commit: `deb82b5548fca723428415cd44f3df4337a2b5aa`.
- Re-fetch: successful; all three tests are present.
- Combined commit status query: no status entries returned at query time.
- Tests were **not executed** in this environment; no CI result is claimed. Next step is to observe the branch's automatic CI, if configured, or have the authorized runner execute the focused Vitest file.
- No protocol contract, datum schema, commitment domain, Reveal behavior, V3, workflow dispatch, or deployment was changed.

**STATUS: LEGACY TS GOLDEN-VECTOR REGRESSION TEST ADDED; EXECUTION PENDING. F4 OPEN. F5/MATERIOS STILL PAUSED.**


## 44.79 — AGENT A — FOLLOW-UP FIXES FOR LAB #2253 BLOCKERS — 2026-10-26

Two narrowly scoped fixes were committed to the shared coordination branch after the #2253 evidence review:

1. **Yaci UTxO decoder compile fix** — commit [`781da77`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/781da7747b8d62f4a6eef1a4b97157016542a143) adds only `{-# LANGUAGE DataKinds #-}` to `audit/cardano-ledger-runner/YaciUTxO.hs`, addressing the compiler's explicit complaint about type-level literal `11` in `natVersion @11`. Decoder logic and ledger semantics are unchanged. CI result is pending/in progress as of this entry.
2. **JEV prompt size fix** — commits [`0724b11`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/0724b11cd9aa783dbe3017a69807ba3de0a17d94) and [`838a32a`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/838a32a13cc0e305b6f79b12bece9ff91bbfa545) compact only repeated per-check row labels in `scripts/build-jev-operational-prompt.mjs`. All 21 checks, results, evidence references, limitations, freshness checks and hard safety boundaries remain present. A local reconstruction using the archived #2253 verification registry projects a 6,819-character prompt, below the 7,000-character limit. This is a sizing calculation, not yet a CI PASS; the generated prompt and dedicated tests must be confirmed by the next active lab run.

The new commits triggered overlapping lab workflows; #2255 and #2256 were cancelled, while #2254 and #2257 were observed running/pending at the time of this entry. Do not launch another run. Use the newest surviving run for the combined decoder/JEV fixes, and distinguish its source SHA from earlier runs.

### Safety and scope

- No new branch created.
- No V3 carrier, Reveal semantics, economic rules, or transaction-size limit changed.
- Materios remains paused.
- Do not mark the lab GREEN until the decoder compiles, JEV prompt generation succeeds, and downstream evidence gates complete with observed outcomes.

**STATUS: MINIMAL DECODER AND JEV OUTPUT-COMPACTION FIXES COMMITTED; PROMPT LENGTH ESTIMATED AT 6,819 CHARACTERS; AWAITING SURVIVING CI EVIDENCE.**


## 44.80 — AGENT B — BEACON GOLDEN-VECTOR FOLLOW-UP / CROSS-LANGUAGE HARNESS AUDIT — 2026-10-26

Follow-up after §44.79, scoped to F4 and the existing commitment encoding only.

### Findings

- Re-fetched `src/beacon.ts`, `src/__tests__/beaconCommitmentVectors.test.ts`, and `plutus/Beacon.hs` from `work/immortal-green-closure`. Their declared field order, length-prefix convention, domain strings and hash preimages are visibly aligned for the three pinned vectors.
- Queried GitHub combined commit status and commit-associated workflow runs for `deb82b5548fca723428415cd44f3df4337a2b5aa`: no status entries and no PR-triggered workflow runs were returned. This is **no CI evidence**, not a pass or a failure.
- Inspected `plutus/pre-rich-plutus.cabal` and `plutus/test/GoldenVectorsTest.hs`. The existing `v3-golden-vector-tests` target is primarily economic-state coverage; no Beacon encoding/commitment vectors were found in that test source.
- The Haskell mirror uses Plutus builtins (`BuiltinByteString`, `sha2_256`) and is compiled in the Plutus toolchain. A normal host-language test that merely duplicates the TypeScript preimage algorithm would not prove that the actual Plutus implementation matches it. A sound cross-language test should evaluate the actual Plutus functions (or use a single generated language-neutral fixture whose reference producer is the actual Haskell/Plutus implementation) and compare output bytes/digests against TypeScript.

### Next safe step

Do **not** alter protocol semantics or the legacy encoding. First establish the repository's supported mechanism for evaluating the compiled `Beacon.hs` functions in a test harness, then wire the existing three fixtures through that mechanism. If the existing harness cannot evaluate these functions without material new infrastructure, report that limitation rather than claiming cross-language conformance. Keep all F4 on-chain uniqueness/authenticated-binding gaps open pending normative decision.

### Boundaries and status

- No Haskell test suite, TypeScript vector, contract, datum schema, commitment domain, Reveal, V3, CI workflow, deployment, or Materios component was changed in this follow-up.
- The three TypeScript golden-vector tests remain **unexecuted** in this environment.
- Official Cardano MPFS development documentation provides a relevant precedent: a Haskell reference generates language-neutral vectors, another on-chain language consumes them, and CI checks vector freshness. This is a testing pattern only, not protocol authority: https://cardano-foundation.github.io/cardano-mpfs-onchain/development/

**STATUS: CROSS-LANGUAGE TEST GAP CONFIRMED; IMPLEMENTATION METHOD NOT YET VERIFIED; NO GREEN CLAIM. F4 OPEN. F5/MATERIOS PAUSED.**


## 44.80 — AGENT A — LAB #2257 RESULTS AND FOLLOW-UP — 2026-10-26

Integration Lab #2257 completed with **FAIL** on source commit `838a32a13cc0e305b6f79b12bece9ff91bbfa545` ([run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40268321258)). The decoder and prompt-size source fixes moved past their previous blockers, but two gates failed:

1. **JEV operational prompt generator test:** the generated prompt was produced within the size contract, but the test still asserted the old row syntax (`REVEAL.TRACE: FAIL` and `evidence: this run`). The compact output is now `REVEAL.TRACE FAIL R:this run`. I updated only these two stale assertions in commit [`eb18832`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/eb18832a4549da436e23bfe60bdac3bc42bd4f85). Focused CI confirmation is pending; no protocol behavior is involved.

2. **P2.8 ledger evidence gate:** decoder conformance is recorded as PASS, but ledger qualification remains BLOCKED. The attached `ledger-evaluation-report.json` has two spending redeemer failures, both typed `MissingScript` (spending indices 1 and 2), zero Plutus execution failures, and zero ledger-context failures. The gate correctly returned `SAFE_STALL / NON_EXECUTION_LEDGER_FAILURE`; this is not evidence of a validator semantic rejection. Investigate the exact transaction/reference-script/witness binding for the evaluated transaction before changing code. Do not relabel this as PASS or FAIL at the Plutus-validator level without new evidence.

### Verified boundaries
- Lab #2257 job: 46 successful steps, two failed steps, zero pending at completion.
- `P2.8.YACI.UTXO.DECODER`: PASS in the generated verification registry.
- `P2.8.LEDGER.EVIDENCE.GATE`: BLOCKED due to the two `MissingScript` failures.
- `REVEAL.TRACE` and `V3.CARRIER.LEDGER`: PASS for the isolated local Yaci paths only; this is not Preprod/mainnet qualification or full Haskell/Aiken parity.
- The generated JEV prompt is present in the artifact and retains the safety/freshness boundaries.
- No V3 carrier, Reveal semantics, economic rules, or 16,384-byte transaction limit changed. No branch created; Materios remains paused.

**STATUS: DECODER COMPILE/CONFORMANCE BLOCKER CLEARED IN LAB #2257; JEV TEST EXPECTATIONS CORRECTED IN `eb18832`; P2.8 LEDGER QUALIFICATION STILL BLOCKED BY MISSING SCRIPT WITNESSES/REFERENCES. OVERALL NOT GREEN.**


## 44.81 — AGENT B — PLUTUS CEK BEACON VECTOR HARNESS ADDED — 2026-10-26

Following §44.80, added a focused test harness intended to execute the actual compiled Plutus expressions with the repository's pinned Plutus toolchain, rather than testing only a duplicate host-language implementation.

### Changes

- Added `plutus/test/BeaconCommitmentVectorsTest.hs` (commit `7ad6a59815c72ef29c62bfd39bddae17e964c4a4`, with import correction in `df14851d1f4e63b68cb62a9585ea1c91d5187e20`). It compiles boolean checks around the actual `Beacon.encodeBeaconTarget`, `deriveGameRoundCommitment`, and `ticketCommitment` functions and evaluates them using `evaluationResultMatchesHaskell` / the Plutus CEK test support.
- Added Cabal target `beacon-commitment-cross-language-tests` in `plutus/pre-rich-plutus.cabal` (commit `e5423e616a9d0384fdf9c4cb2ccc57c502235449`).
- Added a dedicated step to `.github/workflows/immortal-haskell-conformance.yml` (commit `3302066ff1f9fb489f9c8e9a86c9a0cfc879373a`) to run `cabal test beacon-commitment-cross-language-tests --test-show-details=direct`.
- Re-fetched the test, Cabal file and workflow from the branch; the new suite and workflow step are present.

### Verification status / guardrails

- No test execution result is available yet. The queried combined commit status was empty; the connector's commit-associated workflow-run query returns PR-triggered runs only, so its empty result does not prove the push workflow did not start.
- This is a **candidate harness pending compiler/CI validation**, not yet a cross-language PASS. If CI reports a type, splice, or API error, fix only this test harness and its wiring; do not change `Beacon.hs` semantics or the golden values merely to make the test pass.
- No datum schema, commitment domain, uniqueness authority, Issue/Reveal behavior, V3, deployment or Materios component was changed. F4 remains open pending separate normative resolution of the on-chain uniqueness/authenticated-binding design; F5/Materios remains paused.

**STATUS: PLUTUS CEK VECTOR SUITE WIRED INTO HASKELL CONFORMANCE WORKFLOW; EXECUTION RESULT PENDING. NO GREEN CLAIM.**


## 44.82 — AGENT B — CEK HARNESS STATIC API REVIEW — 2026-10-26

Follow-up to §44.81, after re-fetching the test, Cabal target and workflow from the current shared branch.

- Confirmed the test file and Cabal suite are present and the Haskell conformance workflow invokes the new target on pushes affecting `plutus/**` or the workflow file.
- Cross-checked the use of `evaluationResultMatchesHaskell` against the upstream Plutus Haddock. Its documented shape is `CompiledCode a -> (Eq r, Show r => r -> r -> k) -> hask -> k`, consistent with comparing each compiled `Bool` result against `True`. This is a static API-shape check against published Plutus docs, **not** confirmation that the repository's exact pinned dependency set compiles this test.
- GitHub connector search did not expose a run/status for this push. No test was executed here. Do not dispatch a workflow manually; observe the automatic push workflow or request an authorized runner's result.
- If the exact pinned toolchain rejects imports, splices, or the evaluator call, fix the harness only and retain the TypeScript-derived expected values unless independent evidence proves a vector wrong.

**STATUS: STATIC REVIEW COMPLETE; EXACT-TOOLCHAIN BUILD AND CEK RESULTS STILL PENDING. NO CROSS-LANGUAGE PASS CLAIM.**


## 44.81 — AGENT A — P2.8 REFERENCE-INPUT CONTEXT REPAIR — 2026-10-26

Inspection of the #2262 evidence packet ([run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40271989995)) narrowed the `MissingScript` blocker to a context-materialization gap:

- Reveal's signed CBOR diagnostics recorded the exact two reference inputs (one Plutus V3, one Plutus V2) and zero embedded Plutus scripts, as expected for reference-script spending.
- The same run's P2.8 manifest reported `reference_inputs: 0`, an empty `reference_script_utxos`, and `script_artifacts: null`; the native evaluator therefore had the two spending script inputs but no reference-script UTxOs available in its reconstructed UTxO context. The ledger report's two `MissingScript` entries match the two spent script hashes.
- This is strong evidence of missing reference-input context in the P2.8 evidence materializer, not evidence of a Reveal validator semantic rejection. The finding remains scoped to local Yaci evidence and must be confirmed by a fresh native-ledger evaluation.

Changes published on the existing `work/immortal-green-closure` branch:
1. Commit [`b518b1e`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/b518b1e30f3a640aab7aba1d9b0f79080d4de6fc): extract the exact reference-input outrefs from the signed Reveal CBOR, compare them to the two validated reference-script UTxOs, and persist them into `reveal-transition.json`.
2. Commit [`3416b3e`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/3416b3ed94bf6c93faf565a2034a61e5b94a122b): have the P2.8 materializer fetch each exact reference UTxO by outref and append its full context plus serialized `script_ref` and `reference_script_hash` into the native runner's `utxo.json`; manifest counts now include those reference inputs. Missing/invalid reference evidence fails closed.

### Verification in progress
- Integration Lab #2263 is running on the producer change (`b518b1e`); do not interpret it as validation of the materializer change.
- Integration Lab #2264 is queued/pending on the combined head (`3416b3e`): [run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40274963276). This is the decisive run for the context repair.
- JEV Verification Registry Contract #51 is queued on the same combined head.
- No new workflow was manually dispatched. V3 carrier, Reveal semantics, economic rules, and the 16,384-byte limit remain unchanged. Materios remains paused.

**STATUS: REFERENCE-INPUT CONTEXT REPAIR IMPLEMENTED; NOT YET VERIFIED BY THE COMBINED P2.8 NATIVE-LEDGER RUN. OVERALL NOT GREEN.**


## 44.83 — AGENT B — CEK ASSERTION COMPARATOR TYPE CORRECTION — 2026-10-26

Static review found one test-harness risk: the equality operator passed to `evaluationResultMatchesHaskell` must use host Haskell's `Eq`, not the PlutusTx prelude's equality class. Corrected `plutus/test/BeaconCommitmentVectorsTest.hs` to use `Haskell.==` for the evaluator-result comparison while retaining `PlutusTx.Prelude.(==)` inside each compiled Plutus expression. Commit: [`f28a8b3`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/f28a8b39d4bbd6c7f74c299ba697f53293b364e6).

The pinned workflow still has no returned status entries for the CI wiring commit at query time; no exact-head build/test output is available through the current connector results. This correction is based on the published `evaluationResultMatchesHaskell` signature and is not a claim that the test compiles. Do not start another workflow manually; the source changes should be exercised by the existing push trigger. Keep the vector values and on-chain semantics unchanged unless a reproducible test demonstrates a mismatch.

**STATUS: COMPARATOR TYPE RISK FIXED IN SOURCE; BUILD/CEK EXECUTION STILL PENDING. F4 OPEN; F5/MATERIOS PAUSED.**


## 44.84 — AGENT B — RECHECK EXACT BRANCH HEAD FOR BEACON CEK SUITE — 2026-10-26

Re-fetched the current shared-branch versions of:
- `plutus/test/BeaconCommitmentVectorsTest.hs` (blob `a84a277bdae5b6e53500735952e4b0080fbe0479`);
- `plutus/pre-rich-plutus.cabal` (blob `d4e098170194dcc5114bd250eb27338f978b6ab2`);
- `.github/workflows/immortal-haskell-conformance.yml` (blob `b4363361930f62fd592a715726e97f869ee81738`).

### Current finding
- The CEK harness now passes host `Haskell.==` as the result comparator, while the three compiled expressions retain PlutusTx equality. The Cabal suite declares `plutus-tx:plutus-tx-testlib`, and the workflow invokes the focused suite on branch pushes affecting `plutus/**` or the workflow itself.
- The workflow wiring is present on `work/immortal-green-closure`. The available commit-associated workflow-run connector only reports PR-triggered runs; a blank result from that connector cannot establish whether the branch-push workflow ran. No exact-head build log or test result has been obtained in this pass.
- Published Plutus documentation confirms the evaluator helper accepts a compiled expression, a polymorphic host comparator, and an expected lifted value; this supports the comparator shape, but the documentation consulted is for Plutus 1.68, not the repository-pinned 1.67.0.0 toolchain. This remains a static review, not a pinned-toolchain compilation result.

### Decision / boundaries
No source edits were made in this pass because no reproducible failure or exact-head CI result was available to justify another change. Do not manually dispatch the workflow. Next evidence-bearing step is to inspect the automatic run for the current branch head and, if it fails, patch only the harness/wiring with the exact compiler diagnostic. Keep golden values and protocol semantics unchanged unless independent evidence proves a vector incorrect. F4 on-chain uniqueness/authenticated binding remains OPEN; no normative design selected. V3 and Reveal semantics untouched; F5/Materios remains PAUSED.

**STATUS: EXACT FILES RE-FETCHED; STATIC HARNESS/WIRING CHECK COMPLETE; PINNED TOOLCHAIN BUILD AND CEK EXECUTION STILL UNVERIFIED. NO GREEN CLAIM.**


## 44.85 — AGENT B — CI EVIDENCE LOOKUP FOR BEACON CEK SUITE — 2026-10-26

Follow-up to §44.84. Queried the current connector's commit status and commit-associated workflow-run views for checkpoint commit `06f63a410440566730c3b07491c06fc58ff51f25`:
- Combined commit status returned an empty `statuses` list.
- Commit-associated workflow runs returned an empty list; this endpoint is documented by the connector as filtering to pull-request-triggered runs only.
- Attempted to inspect the workflow's public Actions page, but the retrieval was unavailable in this environment. Therefore the automatic branch-push run cannot be confirmed or ruled out from these observations.

### Result
This is a **CI observability gap**, not a test pass and not a test failure. No workflow was manually dispatched and no source was changed to manufacture a result. The CEK harness, Cabal target, and workflow step remain present from the prior re-fetch. The next valid closure evidence is a real automatic run with its exact head SHA, job outcome and focused test log, or an authorized runner providing those artifacts.

F4 remains OPEN for on-chain canonical round uniqueness and authenticated commitment binding. No normative choice made; no protocol semantics, V3, Reveal or Materios changed. F5/Materios remains PAUSED.

**STATUS: NO CI RESULT VISIBLE THROUGH AVAILABLE LOOKUPS; TEST EXECUTION UNVERIFIED. NO GREEN CLAIM.**


## 44.86 — AGENT B — INDEPENDENT RECOMPUTATION OF BEACON GOLDEN VECTORS — 2026-10-26

To make progress despite the unavailable exact-head CI result, re-fetched the TypeScript source `src/beacon.ts`, its focused tests `src/__tests__/beaconCommitmentVectors.test.ts`, and the Plutus source `plutus/Beacon.hs` from `work/immortal-green-closure`. Independently recomputed the three fixed fixtures using a separate host-side implementation of the documented length-prefixed ASCII-decimal/raw-byte encoding and SHA-256.

### Results
- BeaconTarget encoding: `31313333383133aabbcc327631` — matches the checked-in fixture.
- GameRoundCommitment: `319820630ca9c2e09d872270d8cc090dd264b1e0c0f43be2bb5bd4a5971a4e74` — matches the checked-in fixture.
- Existing V2 ticket commitment: `018c2f8b435091e59ad1a4db011e9d41536bdcd1bac141c69fc42f74f329dd0b` — matches the checked-in fixture.

This independently checks the expected values against the documented algorithm; it is **not** execution of the checked-in Vitest suite, not execution of Plutus CEK, and not proof of exact cross-language runtime conformance. The earlier CI observability limitation remains unchanged. No source edit was necessary based on this recomputation.

### Boundaries
F4 remains OPEN: vectors do not establish on-chain uniqueness or authenticated commitment binding across Registry → Issue → Reveal. No normative design selected. No V3, Reveal semantics, deployment or Materios change; F5/Materios remains PAUSED.

**STATUS: ALL THREE EXPECTED VECTOR VALUES INDEPENDENTLY RECOMPUTED AND MATCH; AUTOMATED TS/PLUTUS TEST EXECUTION STILL UNVERIFIED. NO GREEN CLAIM.**


## 44.87 — AGENT B — FIX EXACT CI FAILURE IN BEACON CEK TEST IMPORT — 2026-10-26

Recovered the actual GitHub Actions run that had been missed by the previous commit-status lookup: [IMMORTAL Haskell Semantic Conformance run 40275034320](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40275034320), on commit `f28a8b39d4bbd6c7f74c299ba697f53293b364e6`. The pinned GHC 9.6.7 toolchain successfully completed dependency installation and the first three Haskell suites; the new Beacon suite failed at parse time before any vector was executed:

```
test/BeaconCommitmentVectorsTest.hs:12:6: error: [GHC-58481]
parse error on input ‘[’
```

The offending import-list item was written as `([])`. Corrected only that syntax to `[]` in `plutus/test/BeaconCommitmentVectorsTest.hs`, commit `2269bfd4c9321a86b1d5a33ecea68ae1b64ad888`. Re-fetched the file and verified the corrected import is present (blob `e9c31f6083b91a376882dfa83a6faa14b6781a8a`). This is a source-level response to the exact compiler diagnostic; it does not yet establish that compilation proceeds or that CEK vectors pass.

### Verification / coordination
- The run above is a confirmed **FAIL**, not an unobserved run. Its job log shows the Beacon test step failed at Haskell parsing; later suites were skipped.
- The source fix was committed to the existing `work/immortal-green-closure` branch; no branch created and no workflow manually dispatched. Wait for the branch-push workflow on the fix commit and inspect its exact-head logs.
- Keep all expected vector values and `Beacon.hs` semantics unchanged unless the next compiler/runtime evidence shows a separate issue.
- F4 remains OPEN for canonical round uniqueness and authenticated commitment binding. V3 and Reveal semantics untouched; F5/Materios remains PAUSED.

**STATUS: FIRST EXACT TOOLCHAIN FAILURE IDENTIFIED AND MINIMALLY FIXED; RE-RUN/CEK RESULTS PENDING. NO GREEN CLAIM.**


## 44.88 — AGENT B — AUTOMATIC RE-RUN OBSERVED AFTER BEACON IMPORT FIX — 2026-10-26

After commit `2269bfd4c9321a86b1d5a33ecea68ae1b64ad888`, queried the repository's Actions runs endpoint directly rather than the commit-associated workflow-run wrapper. Confirmed the automatic [IMMORTAL Haskell Semantic Conformance run 40374182443](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40374182443) was created on the exact fix SHA and was `in_progress` at the time of observation. Its job had reached the early conformance steps; the Beacon step outcome was not yet available. No workflow was manually dispatched.

This confirms the corrected source is being tested by the branch-push workflow, but does not yet prove the import compiles or the CEK vectors pass. Wait for this exact run to complete and inspect the Beacon step and final conclusion before further edits. Multiple other workflows were also triggered by the push; do not start additional runs.

The source fix is limited to the invalid Prelude import-list spelling, corrected from `([])` to `[]`. Expected values and `Beacon.hs` semantics remain unchanged. F4 remains OPEN for on-chain canonical round uniqueness and authenticated commitment binding; V3/Reveal semantics unchanged; F5/Materios remains PAUSED.

**STATUS: EXACT FAILURE FIX COMMITTED; AUTOMATIC HASKELL CONFORMANCE RUN 40374182443 OBSERVED IN PROGRESS ON FIX SHA; OUTCOME PENDING. NO GREEN CLAIM.**


## 44.89 — AGENT B — SECOND EXACT COMPILER FAILURE AND MINIMAL IMPORT FIX — 2026-10-26

Inspected the completed automatic Haskell conformance run [40374182443](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40374182443), exact head `2269bfd4c9321a86b1d5a33ecea68ae1b64ad888`. The first import correction did **not** compile: the Beacon step failed again at `test/BeaconCommitmentVectorsTest.hs:12:5`, parse error on `[`, now pointing to the explicit `, []` item. Earlier steps 7–10 completed successfully; Beacon vector execution did not begin.

Removed only the problematic `[]` entry from the explicit Prelude import list in `plutus/test/BeaconCommitmentVectorsTest.hs`; commit `8f1e2eb79d044623cfdfcfd7e28891a2956fbb0e`, new blob `cdefbb4448d960a1cb4f59108f3e3c420175a726`. Re-fetched the committed file and confirmed the import list no longer contains that item. Expected values, Beacon implementation and test semantics are unchanged.

The branch-push workflow has automatically queued new work on exact SHA `8f1e2eb79d044623cfdfcfd7e28891a2956fbb0e`; no manual dispatch was made. Next step: inspect the new Haskell Semantic Conformance run and its Beacon step/log. Do not infer success from the edit or from other suites passing.

F4 remains OPEN for on-chain canonical round uniqueness and authenticated commitment binding. No normative design selected; V3 and Reveal semantics untouched; F5/Materios remains PAUSED.

**STATUS: SECOND PARSE FAILURE REPRODUCED FROM EXACT CI LOG AND MINIMALLY FIXED; NEW EXACT-HEAD CI PENDING. NO GREEN CLAIM.**


## 44.90 — AGENT B — P2.8 NATIVE YACI CONTEXT AND REDEEMER EVALUATION VERIFIED — 2026-10-26

Reviewed the completed evidence artifacts for [IMMORTAL Cardano Integration Lab run #2269](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40374182330), exact workflow head `2269bfd4c9321a86b1d5a33ecea68ae1b64ad888`. This is the run that followed the native Yaci field-normalization change; run #2267 on `cf596d1` had been cancelled during canonical Plutus toolchain setup before reaching P2.8.

### P2.8 evidence from run #2269
- `Materialize raw Yaci ledger context for P2.8`: **success**.
- `Run native Yaci UTxO decoder conformance`: **success**.
- `Run P2.8 ledger evidence gate against this lab packet`: **success**.
- The evidence manifest classifies 5 transaction inputs, including exactly 2 reference inputs. Both exact reference UTxOs were fetched from Yaci; `utxo.json` contains both with `reference: true`, populated `script_ref`, `reference_script_hash`, normalized `amount`, and `ledger_address_hex`.
- `ledger-evaluation-report.json` contains two spending redeemer entries, indices 1 and 2, each with `status: success`, empty failure logs, and measured ExUnits. No `MissingScript` or `ContextError` is present in this native evaluator report.
- The sanitized evidence artifact was uploaded as artifact ID `12678720668`; its registry records the P2.8 materialization, decoder, ledger-evidence gate, and resource-footprint checks as PASS.

### Scope and remaining boundary
The workflow was subsequently cancelled during `Run predeploy structural gate` as newer branch pushes arrived. Therefore this is **confirmed local Yaci P2.8 ledger-evaluation evidence for the exact run/head**, not a successful conclusion for the entire Integration Lab, not Preprod/mainnet qualification, and not deployment approval. The report proves the two recorded spending redeemers evaluated successfully in this materialized context; it does not independently establish full production Haskell/Aiken parity or authoritative Issue admission.

No V3 carrier, Reveal semantics, economic constants, or Materios work was changed. Materios remains PAUSED. Preserve the evidence artifact and avoid re-running P2.8 on another branch; next coordination step is to verify whether the latest branch head needs a fresh exact-head Integration Lab after the current concurrent agent changes settle.

**STATUS: P2.8 NATIVE YACI EVALUATION PASS ON RUN #2269 / SHA `2269bfd`; OVERALL WORKFLOW CANCELLED LATER, FULL LAB/DEPLOYMENT NOT GREEN.**


## 44.91 — AGENT B — COMPLETE INTEGRATION LAB GREEN ON EXACT RUN #2270 — 2026-10-26

Follow-up to §44.90: the automatic [IMMORTAL Cardano Integration Lab run #2270](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40379279411) completed with **workflow conclusion `success`** on exact SHA `8f1e2eb79d044623cfdfcfd7e28891a2956fbb0e`. This run is the first full successful Integration Lab after the native Yaci reference UTxO normalization. No manual dispatch was used.

### Exact-run evidence
- `Materialize raw Yaci ledger context for P2.8`: success.
- `Run native Yaci UTxO decoder conformance`: success.
- `Run P2.8 ledger evidence gate against this lab packet`: success.
- `Run predeploy structural gate`: success.
- The workflow's final conclusion is success; the sanitized evidence registry reports `overallResult: PASS`.
- Artifact: [immortal-cardano-lab-evidence, ID 12680095350](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40379279411/artifacts/12680095350), SHA-256 `d71d63e83bb0ec179b5a536f3336c6e1b64a8b83811615457760af8535d35f27`.
- Manifest binds the evidence to run ID `40379279411`, attempt 1, exact SHA above, local Yaci Conway / protocol major 11, transaction `211a3a8384e1e91c09b687d96e3ea489478f9f8da83bb49cd48ccf965bdf6261`.
- Manifest classifies 5 inputs, including 2 reference inputs. Both exact Yaci UTxOs are present in `utxo.json` with `reference: true`, non-empty `script_ref`, populated `reference_script_hash`, normalized `amount`, and `ledger_address_hex`.
- `ledger-evaluation-report.json` contains two `ConwaySpending` redeemers (indices 0 and 1), both `status: success`, empty logs, and measured ExUnits; no `MissingScript` or `ContextError` appears in that report.
- The resource audit reads the observed Conway protocol parameter `maxTxSizeBytes = 16384`; the largest listed transaction CBOR is 12,173 bytes. This statement applies only to the listed measured artifacts and is not a claim that every production Reveal transaction fits the limit.

### Correct scope
This is a **full successful local Yaci Integration Lab run**, including P2.8 native ledger evaluation and the predeploy structural gate. It is not Cardano Preprod/mainnet qualification, not a production ticket issuance, and not authoritative Issue admission/deployment approval. The isolated Aiken V3 Reveal candidate has its own explicit fixture-only limitations in the registry; do not interpret those checks as proof of canonical Haskell Plutus V2 parity.

No normative economic decision was made. Existing V3 carrier and canonical Reveal semantics were not altered by the Yaci normalization fix. Materios remains PAUSED. Do not dispatch another duplicate lab run; coordinate any next action against the exact latest branch head and the remaining authoritative-admission / R1-Kc certificate blocker.

**STATUS: INTEGRATION LAB #2270 = PASS ON SHA `8f1e2eb`; P2.8 MATERIALIZATION, DECODER, LEDGER EVALUATION AND PREDEPLOY STRUCTURAL GATE ALL PASS; PRODUCTION/PREPROD DEPLOYMENT REMAINS BLOCKED BY ITS SEPARATE QUALIFICATION REQUIREMENTS.**


## 44.90 — AGENT B — THIRD BEACON TEST COMPILER DIAGNOSTIC AND IMPORT CLEANUP — 2026-10-26

Inspected the completed automatic Haskell Semantic Conformance run [40379279491](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40379279491), exact head `8f1e2eb79d044623cfdfcfd7e28891a2956fbb0e). The Beacon suite advanced past parsing but failed while compiling the test module with the exact diagnostic:

```
test/BeaconCommitmentVectorsTest.hs:12:5: error:
Module ‘Prelude’ does not export ‘(:)’
```

Removed the fragile `NoImplicitPrelude` + manually enumerated Prelude import list and replaced it with the conventional `import Prelude hiding ((==))`. This preserves the intentional unqualified PlutusTx `(==)` inside compiled expressions and the qualified host comparison `Haskell.==` used by the evaluator helper; all ordinary Haskell names and list constructors now come from Prelude normally. No vector values, Beacon production implementation, or test assertions changed.

Committed to the existing branch as `a01f2892268379b4400fea147abdb9397898213a`; source blob `83cfc8fc5069d2ea0efa8006155e3e6d4eda20f4`. This is a targeted response to the compiler error. The next automatic exact-head Haskell run must confirm whether compilation and CEK vector evaluation proceed.

Coordination note: other branch work has independently recorded Yaci Integration Lab #2270 as passing on SHA `8f1e2eb`; that result is separate evidence and does not change the Beacon Haskell suite's failure on that SHA. Do not conflate those workflows.

F4 remains OPEN for on-chain canonical round uniqueness and authenticated commitment binding. V3 and Reveal semantics remain untouched by this Agent B edit. F5/Materios remains PAUSED. No normative design selected; no manual workflow dispatch.

**STATUS: THIRD EXACT COMPILER FAILURE IDENTIFIED AND IMPORT BLOCK SIMPLIFIED; COMMIT `a01f289` AWAITS AUTOMATIC HASKELL CONFORMANCE. NO BEACON GREEN CLAIM.**


## 44.92 — AGENT A — P2.8 EXACT-HEAD RECONCILIATION AFTER LAB #2270 — 2026-10-26

Agent A independently rechecked the P2.8 runner/context path and compared the successful Integration Lab source SHA against the current coordination branch head.

### Source and evidence reconciliation

- Current coordination branch HEAD observed before this checkpoint append: `5d3953db6efd8896835b9de5ac9ced81f84fcf64`.
- Successful local Yaci Integration Lab: [run #2270](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40379279411), exact tested SHA `8f1e2eb79d044623cfdfcfd7e28891a2956fbb0e`.
- Commit comparison reports the current head is five commits ahead of the tested SHA, and the only changed paths in that interval are this coordination checkpoint and `plutus/test/BeaconCommitmentVectorsTest.hs`. No P2.8 materializer, native ledger runner, UTxO decoder, or Integration Lab workflow source changed in that interval. Therefore no duplicate P2.8 lab run is justified solely to retest the current documentation/Beacon-test-only head delta.
- Run #2270 completed with workflow conclusion `success`. Its P2.8 context materialization, native Yaci UTxO decoder, ledger-evidence gate, and predeploy structural gate all passed. The evidence packet binds to local Yaci Conway / protocol major 11 and records both exact reference UTxOs and two successful `ConwaySpending` redeemer evaluations with measured ExUnits.
- Independent source inspection confirms the runner uses typed Conway `Tx`, `UTxO`, `PParams`, `EpochInfo`, and `SystemStart` inputs and invokes the Cardano-ledger `evalTxExUnitsWithLogs` boundary. The materializer checks the raw Yaci protocol major rather than guessing it, and the typed timing decoder fails closed on missing/mismatched timing evidence.

### Scope and status

This verifies the existing **local Yaci P2.8 execution witness** and its continued applicability to the current head's unchanged P2.8 source. It does not promote local Conway execution to Cardano Preprod qualification, production Reveal acceptance, first-user Issue admission, or deployment certification. The real Preprod Reveal and deployment-specific certification chain remain separate open gates. The historical P2.8 dossier contains older status text and should not be read as overriding the exact-run artifact evidence above; update its status only through a separately reviewed evidence-document pass.

No source semantics or runtime code changed in this entry. No duplicate workflow was dispatched. V3/Reveal semantics and the 16,384-byte limit remain untouched; Materios remains PAUSED.

**STATUS: P2.8 LOCAL YACI EVIDENCE RE-VALIDATED AGAINST CURRENT P2.8 SOURCE; CURRENT-HEAD DELTA IS DOCS + BEACON TEST ONLY; NO DUPLICATE RUN REQUIRED. PREPROD/DEPLOYMENT QUALIFICATION REMAINS OPEN.**


## 44.93 — AGENT A — P2.8 DOSSIER STATUS RECONCILED TO RUN #2270 — 2026-10-26

Updated `docs/02-certification/P2.8-LEDGER-EVALUATION-DOSSIER.md` in commit [`5ab7c08`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/5ab7c08d2ca01eb9c859828a2f0e353bf4000b00) to remove stale wording that said no successful native evaluation existed.

The dossier now distinguishes two different acceptance scopes:
- **PASS:** local Yaci Conway packet, Integration Lab #2270, exact tested SHA `8f1e2eb79d044623cfdfcfd7e28891a2956fbb0e`, artifact ID `12680095350`, artifact SHA-256 `d71d63e83bb0ec179b5a536f3336c6e1b64a8b83811615457760af8535d35f27`.
- **OPEN:** deployment-facing Cardano Preprod/Babbage qualification, which still requires an already-submitted transaction independently shown to match the intended production Reveal path and its exact typed context.

This is a documentation/evidence-status correction only. It does not promote local Conway evidence to Preprod certification, claim canonical Haskell Plutus V2/Aiken parity, approve EEV deployment, or unblock authoritative first Issue admission. No workflow was dispatched; no protocol code, economic semantics, V3 carrier, Reveal semantics, or 16,384-byte limit changed. Materios remains PAUSED.

**STATUS: P2.8 DOSSIER NO LONGER CONTRADICTS RUN #2270; LOCAL EVIDENCE PASS AND PREPROD QUALIFICATION OPEN ARE EXPLICITLY SEPARATED.**


## 44.94 — AGENT A — ADA/USDM SETTLEMENT QUOTE SOURCE GAP RECORDED — 2026-10-26

After the prior unit-boundary discussion, Agent A performed a bounded source check for Option C (a quote already denominated in USDM), without changing protocol semantics.

- Decision memo updated in commit [`7d29e50`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/7d29e50b989b556e866e0bb18c6d979cf55726df), file `audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md`, section 9.
- The documented Pyth input remains ADA/USD, not ADA/USDM.
- The existing `ADA_PRICE_USDM_SUBUNITS = 80` in the FundTreasury valuation trace is a synthetic bounded-test fixture, not a live or qualified source.
- No authenticated, freshness-bounded direct ADA/USDM source with frozen identity, precision, rounding and failure semantics was identified in the inspected current-branch contract/trace materials.

**Finding:** Option C is not implementation-ready on current evidence. This does not prove that no such source exists anywhere; it means the repository has not yet qualified one. Next bounded task is to inventory candidate Cardano oracle/market sources against the existing trust, manipulation/liquidity, freshness, exact-identity and fail-closed requirements. If none qualifies, return the B-vs-alternative choice to the normative authority; do not silently relabel USD/ADA as USDM/ADA.

No Oracle schema, `OracleQuote`, `Economic.totalUsdmValue`, MintPolicy, V3 carrier, canonical Reveal semantics, EEV approval, deployment or Issue authorization changed. Materios remains PAUSED. This is a source-availability finding only, not a normative selection.

**STATUS: OPTION C NOT QUALIFIED ON CURRENT REPOSITORY EVIDENCE; NO NORMATIVE CHOICE MADE; FOLLOW-UP SOURCE INVENTORY OPEN.**


## 44.95 — AGENT A — OPTION B SELECTED: SEPARATE USD/USDM RATE REQUIRED — 2026-10-26

The protocol authority explicitly selected **Option B**: independently verify USD/USDM rather than assuming parity or selecting a direct ADA/USDM quote. The decision memo records this in commit [`d3c27a8`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/d3c27a8d84156b5bc386b95e80ddd717b0d7bddf), file `audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md`.

### Required conversion and safety gates

- Consume ADA/USD and USD/USDM as separate, source-authenticated values; define the USD-per-USDM pair direction (or an exact reciprocal) explicitly.
- Both legs need exact source/feed identity, governed precision/exponents, timestamps, freshness bounds and fail-closed behavior. Either missing/stale/invalid leg rejects settlement.
- Bind both observations into the same accepted Issue transaction, unless a normative specification explicitly approves a bounded timestamp-skew rule.
- Preserve raw integer price/exponent and perform exact rational arithmetic with one final governed rounding operation; no off-chain pre-rounding.
- Freeze numerator/denominator representation, supported exponent/overflow bounds, confidence/spread checks where supported, failure predicates and cross-language differential tests before changing `OracleQuote`, `Economic.totalUsdmValue`, or MintPolicy semantics.

### Source investigation result

Official Pyth documentation confirms the existing Cardano integration example uses ADA/USD feed ID 16 and warns that signature verification does not itself enforce freshness; the consuming contract must check timestamps ([Pyth Cardano guide](https://docs.pyth.network/price-feeds/pro/use-prices-on-blockchain/cardano), [Pyth feed catalogue](https://docs.pyth.network/pro/price-feed-ids)). The catalogue is dynamically discoverable, but this check did not establish a concrete USD/USDM feed ID or qualify one for this application. Pyth Pro's existence or ability to request expanded feed coverage is not evidence that a suitable USD/USDM feed is currently available, contractually usable, or deployed/verified on Cardano Preprod.

**Decision status:** Option B selected; exact USD/USDM source/provider/feed and source contract remain OPEN. This is not an implementation authorization for guessed feed identifiers. Do not assume 1 USDM = 1 USD, do not introduce a hardcoded ratio, and do not silently fall back to Option A or C if the source is missing. No production code, deployment, EEV approval or real Issue was changed/authorized. V3 and canonical Reveal semantics remain untouched; Materios remains PAUSED.

**STATUS: OPTION B ARCHITECTURE SELECTED; SOURCE QUALIFICATION AND VERSIONED PRICE REFERENCE CONTRACT OPEN.**


## 44.95 — AGENT B — BEACON CEK FIRST-RUN ISOLATION — 2026-10-26

The automatic Haskell Semantic Conformance run [#40384960940](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40384960940) compiled `BeaconCommitmentVectorsTest.hs` after the Prelude import correction, then failed while loading the package shared library with an undefined GHC info symbol for `GovernanceConformance.lifecycleEventAdmissible`. This is a later-stage dynamic-link/load failure, not the previous Prelude compile error. The three Beacon vectors did not execute successfully.

Agent B moved the existing Beacon test step ahead of the other Cabal tests in workflow commit [`15f894f`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/15f894fbb70816e43c4ecba423d91108f99f18bf), on the existing `work/immortal-green-closure` branch. This is a diagnostic ordering experiment intended to distinguish an incremental build-order interaction from a reproducible dynamic-link failure. It changes CI ordering only; no Beacon vector, production implementation, protocol semantics, V3, or Reveal was changed.

Automatic Haskell run [#40393627899](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40393627899) is queued/in progress on exact head `15f894fbb70816e43c4ecba423d91108f99f18bf`. At checkpoint time the Beacon step has not yet reported a result. Do not claim Beacon green until all three CEK vectors pass. If the failure persists on the first Cabal test, inspect GHC/Cabal dynamic-link and Template Haskell loading behavior before editing production modules. Materios remains PAUSED; do not alter V3 or Reveal.

**STATUS: BEACON FIRST-RUN ISOLATION COMMITTED; AUTOMATIC CI PENDING; F4 OPEN.**


## 44.96 — AGENT A — USD/USDM SOURCE INVENTORY; CHARLI3 CANDIDATE ONLY — 2026-10-26

Following Option B selection, Agent A inspected public provider documentation and market-data references and recorded the evidence in decision memo commit [`b1d439b`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/b1d439b7f1215ea1fd368283d51ab51700f6277d), section 11.

### Source findings

- **Pyth Pro:** official Cardano guide documents ADA/USD feed ID 16 and requires consumer-side freshness checks. The inspected public material did not identify a concrete USD/USDM feed ID qualified for this app/Preprod. This is not proof no such feed exists; confirm via current programmatic feed catalogue/provider.
- **Charli3:** its public material advertises configurable Cardano oracle feeds and multi-DEX/API-source adapters. It is a plausible provider for a custom source, but no exact USD/USDM feed, underlying source list, deployment/datum identity, freshness contract, or Preprod witness has been verified for IMMORTAL.
- **Market dashboards/DEX pools:** useful for source discovery and manipulation/liquidity analysis, but an off-chain dashboard snapshot or one pool ratio is not itself an authenticated, governed on-chain settlement quote.
- **Issuer/reserve material:** useful context about USDM's intended peg and reserve framework, but using that claim as the numeric rate would reintroduce the unselected fixed-parity assumption rather than independently measure USD/USDM.

### Next bounded action

Contact/inspect Charli3's concrete feed catalogue and ask whether a USD-per-USDM feed can be sourced and delivered through a verifier path on Cardano Preprod. In parallel, check Pyth's programmatic symbol API for an exact USD/USDM feed before ruling it out. Require documented underlying sources, aggregation/outlier and manipulation controls, exact feed/datum identity, pair direction, precision, timestamp/freshness semantics, deployment addresses, and a verifiable Preprod example. Do not code against an unconfirmed provider response or guessed identifier.

**STATUS: OPTION B SELECTED; CHARLI3 IS A PROVIDER CANDIDATE, NOT A QUALIFIED SOURCE; PYTH USD/USDM FEED NOT YET VERIFIED; SOURCE QUALIFICATION OPEN.** No production code, Oracle schema, MintPolicy, V3, Reveal, deployment, EEV approval or Issue authorization changed. Materios remains PAUSED.


## 44.97 — AGENT A — LIVE USD/USDM FEED CATALOGUE CHECK — 2026-10-26

Follow-up to §44.96: Agent A inspected the public Charli3 feed portal and provider docs. The portal currently rendered “Active Feeds: 00” / “0 Total Records”; Charli3's documented feed examples list ADA/USD, BTC/ADA and ETH/USD, but not USD/USDM. This is a snapshot of public documentation/UI, not proof that Charli3 has no feeds or cannot configure a custom feed. See [portal](https://portal.charli3.io/dev/feeds) and [configuration docs](https://docs.charli3.io/oracles/node-operators/push-oracle/configuration).

Pyth documents a programmatically discoverable feed catalogue at its Symbology & Reference Data API, but this pass did not retrieve a successful live response and therefore did **not** verify whether a USD/USDM symbol exists. Do not report the feed absent; it remains unverified. See [Pyth feed catalogue docs](https://docs.pyth.network/pro/price-feed-ids).

**Next evidence gate:** obtain a successful live Pyth catalogue response and search canonical symbols/pair direction; separately obtain a concrete Charli3 feed/source/deployment specification or provider confirmation. Any candidate must evidence underlying sources, aggregation/outlier/manipulation policy, pair direction, precision/exponent, freshness/timestamp-skew contract, exact Preprod verifier/deployment identity and a reproducible on-chain witness. No guessed feed ID or hardcoded parity; missing/stale quote must fail closed. No production code, Oracle schema, MintPolicy, V3, Reveal, deployment, EEV approval or Issue authorization changed. Materios remains PAUSED.

**STATUS: OPTION B SELECTED; LIVE FEED SOURCE STILL UNVERIFIED; NO PRODUCTION IMPLEMENTATION AUTHORIZED.**


## 44.98 — AGENT A — LIVE PYTH CATALOGUE RESPONSE; NO QUALIFIED MONETA USD/USDM FEED — 2026-10-26

Agent A successfully retrieved the Pyth Pro Symbology & Reference Data API using its documented `query=USDM` filter. Evidence and interpretation are recorded in decision memo section 13, commit [`fa5fd78`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/fa5fd78c73656817ae8495e69a565b29738d396b).

### Exact catalogue findings
- `Crypto.USDM/USD`, Pyth Pro ID `609`, is described as **MOUNTAIN PROTOCOL USD / US DOLLAR** and has state **inactive**. It is not Moneta's USDM and cannot be used for this conversion.
- `Crypto.NAV.USDM/RESERVES`, Pyth Pro ID `3326`, is described as **US DOLLAR MONETA / RESERVES** and has state **stable**, but it is a reserves instrument, not a USD-per-Moneta-USDM quote.
- `Crypto.NAV.USDM1/USD`, Pyth Pro ID `3324`, is **US DOLLAR M1 / US DOLLAR**, not the Moneta USDM token's market price.
- The filtered response showed no stable, active feed identified as the Moneta USDM/USD market price or its unambiguously inverted USD/Moneta-USDM quote.

References: [Pyth live filtered catalogue](https://pyth.dourolabs.app/v1/symbols?query=USDM), [Pyth symbology reference](https://docs.pyth.network/pro/symbology-reference).

### Decision and next gate
This is a bounded negative finding about the public Pyth Pro catalogue response at check time, not a claim that no custom feed can ever be offered. Do not use the inactive Mountain Protocol feed, the reserves instrument, the USDM1/USD feed, or a hardcoded 1:1 parity. Pyth is **not qualified** as the second leg of Option B on current evidence.

Continue provider/source qualification for a concrete Charli3 specification or another source that provides USD per the exact Moneta USDM asset, including provenance, aggregation/outlier and manipulation policy, pair direction, precision/exponent, freshness and timestamp-skew rules, exact Preprod verifier/deployment identity, and a reproducible on-chain witness. Fail closed when either quote is absent, stale, misdirected, or unqualified.

No production code, oracle schema, feed ID, MintPolicy, V3, Reveal, deployment, EEV approval, or Issue authorization changed. Materios remains PAUSED.

**STATUS: OPTION B SELECTED; PYTH CATALOGUE CHECK COMPLETE; NO QUALIFIED MONETA USD/USDM FEED FOUND IN THIS CATALOGUE QUERY; SOURCE QUALIFICATION STILL OPEN.**


## 44.99 — AGENT A — CHARLI3 CEASED OPERATIONS; PROVIDER PATH REASSESSMENT — 2026-10-26

The current [official Charli3 site](https://charli3.io/) states that Charli3 Oracle **ceased operations in May 2026**, while its open-source solutions remain available. The site directs users to its official X account for contract support. A contemporaneous ecosystem report also reproduced the May 25, 2026 service-pause announcement ([report and transcript](https://learncardano.io/podcasts/cardano-ada-news-update-strike-perps-indigo-v3-charli3-more-29-may-2026/)). Decision memo section 14 records the finding in commit [`edd5ea4`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/edd5ea433c435aa48a88ec8c09e01a40418e85b5).

### Operational consequence
- Charli3 must not be treated as an available hosted provider for a live USD/USDM feed.
- Its open-source code may be considered only as a reference for an independently operated oracle, with explicit governance and ownership of node operators, data sources, funding, monitoring, upgrades/security, deployment and Preprod qualification. This is not an existing qualified source.
- The Pyth catalogue check (§44.98 / memo §13) found no qualified market quote for the exact Moneta USDM asset; Mountain Protocol's similarly named feed is inactive and refers to a different token, while Moneta's reserves feed is not a USD-per-USDM market quote.

### Next bounded action
Inventory currently operational Cardano-compatible oracle/source paths and exact Moneta USDM market pairs available on-chain. Do not select one as normative authority yet. For each candidate, require authenticated observations, unambiguous pair direction, source provenance, aggregation/manipulation controls, precision, freshness and timestamp-skew rules, and an independently verifiable Preprod witness. A DEX-derived cross-rate remains only a candidate until pool identity, liquidity/depth, manipulation bounds, and atomic observation semantics can be governed and verified. No single pool/dashboard becomes settlement authority by default.

No production code, oracle schema, feed ID, MintPolicy, V3, Reveal, deployment, EEV approval or Issue authorization changed. Materios remains PAUSED.

**STATUS: OPTION B SELECTED; PYTH DIRECT QUOTE NOT QUALIFIED; CHARLI3 HOSTED SERVICE CEASED; SOURCE ARCHITECTURE AND QUALIFICATION OPEN.**


## 45.00 — AGENT A — ORCFAX ADA-USD + ADA-USDM CANDIDATE PATH; LIVENESS OPEN — 2026-10-26

Agent A found a concrete pair-path candidate in Orcfax's public feed configuration. Full evidence and guardrails are in decision memo section 15, commit [`a73ba00`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/a73ba0086de8f90e177880ab429b36ad53323cb2).

### Feed configuration evidence
- Mainnet configuration version `2026.05.18.0001` lists `ADA-USD` (CEX median, 3600-second interval, 1% deviation, `sponsored`) and `ADA-USDM` (DEX weighted mean, 3600-second interval, 2% deviation, `sponsored`).
- Preview configuration version `2025.10.09.0002` lists both pairs as `showcase`, not production sponsorship.
- References: [Mainnet feed configuration](https://raw.githubusercontent.com/orcfax/cer-feeds/main/feeds/mainnet/cer-feeds.json), [Preview feed configuration](https://raw.githubusercontent.com/orcfax/cer-feeds/main/feeds/preview/cer-feeds.json), [feed policy](https://docs.orcfax.io/feed-overview).

Under the provider's base-quote naming convention, the **candidate** derivation is:

`USD per USDM = (USD per ADA from ADA-USD) / (USDM per ADA from ADA-USDM)`

This is not yet a qualified implementation. Both exact feed identities, datum formats, timestamps/freshness, precision and validity windows must be verified. Mainnet status `sponsored` means support depends on sponsorship; Preview `showcase` is not production qualification.

### Blocking evidence gap
The public Orcfax Explorer could not be retrieved successfully in this pass, and the indexed page material exposed facts/collection timestamps several months old. The feed-config repository is dated 2026-05-18 and does not prove current publication or fresh Preprod values. Next: verify current Preprod publication and exact datum identity for both feeds, publisher/support status, compatible observation times, and a reproducible fresh on-chain witness. Missing or stale either leg => fail closed.

**STATUS: OPTION B SELECTED; ORCFAX PAIR PATH IDENTIFIED; CURRENT LIVENESS AND PREPROD VERIFIER EVIDENCE NOT YET VERIFIED; NO PRODUCTION IMPLEMENTATION OR ISSUE AUTHORIZATION.** Charli3 remains ceased/hosted service unavailable; Materios remains PAUSED.


## 45.01 — AGENT A — ORCFAX EXACT FEED IDS KNOWN; BOTH OBSERVATIONS FAIL FRESHNESS — 2026-10-26

Follow-up to §45.00: public feed-specific Explorer search results identify `CER/ADA-USDM/3` and `CER/ADA-USD/3`. Details and caveats are in decision memo section 16, commit [`d921807`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/d92180744d0f86cb5d3d8d4b2e544056a05debf7).

- `CER/ADA-USDM/3`: Explorer search result displays latest value `0.1628`, age 27 days at retrieval; a selected historical fact dated 2026-06-14 states 1 ADA = 0.1684 USDM.
- `CER/ADA-USD/3`: Explorer search result displays latest value `0.1633`, age about 2 months at retrieval; a selected historical fact dated 2026-06-18.
- Feed-specific references: [ADA-USDM](https://explorer.orcfax.io/feeds/CER/ADA-USDM/facts/5cbbb7ee-a232-4f36-844a-5c00ceaeb645), [ADA-USD](https://explorer.orcfax.io/feeds/CER/ADA-USD/facts/11aa4839-0760-4079-8d0d-524e16d8d3eb).

Both configured heartbeats are 3600 seconds. The surfaced latest-value ages exceed that interval by a wide margin. Therefore these observations **fail freshness and must not be used for settlement**. The cross-rate remains only a candidate formula: `USD per USDM = (USD per ADA) / (USDM per ADA)`, using exact, fresh, authenticated, precision-normalized observations and a governed timestamp-skew rule.

The Explorer could not be fetched directly by the web fetcher in this pass, so indexed search results are discovery evidence only; revalidate exact datum identities, values, publication slots/timestamps, and feed activity from the ledger. Next action: verify whether the publisher still publishes fresh facts and whether both feed datums can be independently observed on Preprod. If not, drop Orcfax for settlement and assess another governed source. No production code, schema, feed ID, MintPolicy, V3, Reveal, deployment, EEV approval or Issue authorization changed.

**STATUS: ORCFAX IS A CONCRETE PAIR-PATH CANDIDATE BUT FAILS CURRENT FRESHNESS EVIDENCE; OPTION B STILL BLOCKED.**

## 45.02 — AGENT B — BEACON CEK FAILURE ROOT-CAUSE CANDIDATE — 2026-10-26

The completed first-run isolation [#40393627899](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40393627899) failed after compiling all 52 library modules and compiling the Beacon test executable. The decisive error remains:

`undefined symbol: prezmrichzmplutuszm0zi1zi0zi0zminplace_GovernanceConformance_lifecycleEventAdmissible_info`

The source module `IMMORTAL/governance/GovernanceConformance.hs` exports `lifecycleEventAdmissible`, and `GovernanceCanonicalReplay.hs` imports it. However, `plutus/pre-rich-plutus.cabal` did not declare `GovernanceConformance` in either `exposed-modules` or `other-modules` (the latter stanza was empty). This is a concrete package-manifest inconsistency and a plausible cause of the unresolved in-place dynamic symbol.

Agent B added `GovernanceConformance` to the library's `other-modules` list in commit [`48f79b0`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/48f79b078c1e654e694b82e6a8ab15241ad442cf) on the existing `work/immortal-green-closure` branch. This declares the existing internal module to Cabal; it does not change its implementation or protocol semantics.

**Validation pending:** the new commit must pass the Beacon CEK test and print all three vector PASS lines before F4 can be advanced. If the same undefined symbol persists, inspect GHC package registration/link metadata next. V3, canonical Reveal semantics and Beacon vectors were not changed. Materios remains PAUSED.

**STATUS: MANIFEST INCONSISTENCY FIX COMMITTED; CI EVIDENCE PENDING; F4 OPEN.**


## 45.03 — AGENT B — BEACON TEST DEPENDENCY FIX; VALIDATION RUNNING — 2026-10-27

The first rerun after §45.02 passed library compilation but failed while compiling `BeaconCommitmentVectorsTest.hs`:

`Could not load module ‘Plinth.Plugin’`; GHC identified hidden package `plutus-tx-plugin-1.67.0.0` and recommended adding it to the component's `build-depends`.

Agent B added `plutus-tx-plugin ^>=1.67.0.0` to the `beacon-commitment-cross-language-tests` stanza only, commit [`0941f21`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/0941f217ec8da58d8e05e80124864faf70486deb), on the existing `work/immortal-green-closure` branch. This is a test-component dependency declaration; it does not alter Beacon vectors, protocol semantics, V3 or Reveal.

Validation run: [IMMORTAL Haskell Semantic Conformance #40448943389](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40448943389) was in progress at checkpoint time. Branch HEAD had advanced to `ebb0ae553941ba0dab1c0a3e46300fdf243a16d3`, so continue coordinating against the current branch head and shared checkpoint; do not assume the test has passed until logs show the three vectors and the final success marker.

**STATUS: EXPLICIT TEST DEPENDENCY ADDED; CI PENDING; F4 OPEN; V3/REVEAL UNCHANGED; MATERIOS REMAINS PAUSED.**


## 45.04 — AGENT C — MATERIOS UPSTREAM UPDATES ARRIVED; B3 BRIDGE RESUMED — 2026-10-27

This section supersedes the pause wording in §45.02–§45.03 for Materios. The pause meant waiting for meaningful upstream work; the user has now confirmed that updates have arrived and asked to exploit them. Agent C's Materios work is active again.

### Upstream changes confirmed
- [orynq-sdk commit `552a6ac`](https://github.com/Flux-Point-Studios/orynq-sdk/commit/552a6ac6eb56f62252d82644dde1f654fe57c6dc): `anchors-materios` 0.6.2 fixes blob receipts to use the Merkle root of uploaded chunk hashes and treats absent/zero schema hashes as blob receipts. The upstream regression tests cover multi-chunk blobs, zero schema hash and schema-class roots.
- [orynq-sdk commit `b5d1d4e`](https://github.com/Flux-Point-Studios/orynq-sdk/commit/b5d1d4e62fda22d95df6dbe43f4771c8c01b7cf8): quickstart trace receipts made certifiable.
- [orynq-sdk commit `8373932`](https://github.com/Flux-Point-Studios/orynq-sdk/commit/837393261797d99fec046a1a5f551d39822f9b6f): trace receipt hashes surfaced through CLI/MCP.
- [orynq-sdk commit `207bcda`](https://github.com/Flux-Point-Studios/orynq-sdk/commit/207bcda1b112653a26cf44c29ae18a7cfdf3366e) hardens landed-set hints through the standing service/controller. This code is in the `anchors-midnight-submit` path, not a Materios finality verifier; use only the invariant that a block hint locates evidence and never vouches for it. Do not import Midnight-specific parameters or semantics into Materios.

### Integration started
On the existing `work/b3-materios-provenance-evidence` branch, Agent C added an isolated consumer bridge under `poc/materios-orynq-bridge/` (commit [`a733516`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/a733516d796559fb4aca6648f5326340b1b0bbc1)):
- Pins `@fluxpointstudios/orynq-sdk-anchors-materios` to `0.6.2`.
- Consumes the existing `MateriosB3AnchorStateWitness.verified.json` artifact, rejects mismatched target/read-proof blocks and missing proof-verification scope, and omits the source RPC endpoint and capture-time metadata from the anchored payload.
- Precomputes the content hash, receipt ID and chunk Merkle root; submission uses the SDK's blob receipt path with no semantic `schemaHash`.
- Live submission is opt-in only (`--submit` plus `MATERIOS_CONFIRM_SUBMISSION=YES`); blob uploads use a local sr25519 signature rather than a shared raw gateway API key.
- Does not replace the Rust storage-proof verifier or independent GRANDPA finality verification; anchoring a witness is not proof that the witness is true or final.

CI [Materios Orynq Evidence Bridge](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40449545360) was still installing dependencies at checkpoint time. Wait for TypeScript/test success and confirmation that the first generated package lock is committed before marking the integration validated. No live Materios transaction has been submitted.

**STATUS: MATERIOS RESUMED; SDK 0.6.2 BRIDGE IMPLEMENTED; CI PENDING; NO LIVE TRANSACTION; INDEPENDENT STORAGE/GRANDPA GATES REMAIN OPEN.**


## 45.05 — AGENT C — OryNq bridge baseline green; re-verification added — 2026-10-27

Follow-up to §45.04:
- The initial bridge CI [`#40449545360`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40449545360) passed TypeScript typecheck and all five tests. The first generated `package-lock.json` was committed by that run as [`3caf2002`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/3caf2002ee51c3931779c65c218e3fb0d95e782c), pinning `@fluxpointstudios/orynq-sdk-anchors-materios` to `0.6.2`.
- Follow-up [`08c135b`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/08c135b1a3a33bccfb4fe1508ee49108adb748fa) makes the CLI run `cargo run --quiet --manifest-path poc/materios-execution-verifier/Cargo.toml --bin verify-storage-witness` against the witness's exact state root/key/value/proof nodes and compares its output to the recorded SCALE proof. The caller-provided `verification` flag alone is no longer sufficient for CLI planning or submission.
- CI [`#40449688051`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40449688051) passed on head [`75d498e`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/75d498efc9bddd552192ab5c383cf10f3beb49cf), including the re-verification code's TypeScript compile and the five deterministic tests.
- Workflow hardening commit [`e697c89`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/e697c89a1b53eb0b801eac492a9f22ec81e229db) removes bootstrap-time lockfile writes and narrows CI permissions to `contents: read`; its post-change CI run remains to be checked separately.

No live transaction has been submitted. The bridge is an optional evidence-publication path only. Before any live run, the Rust verifier must pass on the actual witness; GRANDPA finality and authority provenance are still separate open gates. No Orynq receipt certification is treated as settlement authority.

**STATUS: MATERIOS ACTIVE AGAIN; BRIDGE CODE + FIVE TESTS GREEN AT 75d498e; LOCKFILE PINNED; CI PERMISSION-HARDENING VALIDATION PENDING; NO LIVE SUBMISSION.**


## 45.06 — AGENT C — OryNq bridge CI GREEN AFTER LOCKED, READ-ONLY WORKFLOW — 2026-10-27

Final status update to §45.04–§45.05:
- Workflow hardening commit [`e697c89`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/e697c89a1b53eb0b801eac492a9f22ec81e229db) was validated by [Materios Orynq Evidence Bridge run `#40449758413`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40449758413): **SUCCESS** on the exact current head `e697c89a1b53eb0b801eac492a9f22ec81e229db`.
- Step evidence: pinned dependencies installed with `npm ci`; TypeScript typecheck passed; all five deterministic fail-closed/receipt-plan tests passed. The workflow now has `contents: read` only and no longer self-writes the lockfile.
- Bridge's CLI path now re-runs the repository Rust storage-proof verifier before it prints a plan or performs a live submit. The relevant code compiles and the CI tests pass, but the live CLI has **not** yet been exercised against an actual `MateriosB3AnchorStateWitness.verified.json` artifact. This is an explicit remaining validation step.
- No live Materios transaction has been submitted. SDK certification/anchoring remains an evidence-publication layer; independent GRANDPA finality, authority-set provenance, and B3-A acceptance stay open.
- Zero-knowledge credential presentations mentioned in the upstream internal note are **not** implemented by this bridge. It uses local sr25519 request signing for blob gateway uploads; do not conflate the two.

**STATUS: MATERIOS ACTIVE; OryNq SDK 0.6.2 bridge typecheck/tests GREEN; locked least-privilege CI GREEN; real-witness CLI integration and independent GRANDPA/authority proof remain OPEN; no live transaction.**


## 45.07 — AGENT C — REAL PREPROD WITNESS CAPTURED AND RUST VERIFIED; PLAN ARTIFACT FIX IN VALIDATION — 2026-10-27

This supersedes the earlier "real-witness CLI integration open" wording in §45.06 where the new evidence below closes part of that gap.

Run [`#40450156010`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40450156010) reached a real Materios Preprod witness with no `MATERIOS_ARCHIVE_RPC` secret by using the public read-only HTTP JSON-RPC endpoint as fallback and leaving the target at the endpoint's reported finalized head. The exact target block hash from preflight is passed into capture, preventing the preflight and capture phases from silently using different blocks.

Confirmed steps from the completed run:
- Select read-only Materios RPC: PASS.
- Exact witness-target preflight: PASS.
- Capture witness at exact target: PASS.
- Rust verifier unit suite: PASS.
- Exact `header.stateRoot + storage key + returned AnchorRecord bytes + StorageProof` verification: PASS.
- The Orynq CLI then re-ran the Rust verifier against the captured witness and generated a dry-run receipt plan successfully. The observed target was block `2463800`, hash `0xa9299da4b516e2c8e08f6416a2fdf65c1c94509e160cf93db1a3850546378fe8`; the planned receipt ID was `0x59dca2edbef36dc40c529c3678a6494539bb2486655c23f2fe7af5a4252acffc`.

The overall run ended **FAIL** only when the next step attempted to parse the dry-run output as JSON; `npm run` had prefixed its normal banner lines. This was a CI serialization bug, not a witness/Rust/Orynq-plan failure. Agent C fixed it in [`ae60390`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/ae6039043cb50f91e2f24cb09b651c531e400954) by invoking the local `tsx` executable directly and capturing only the JSON output. Validation is running in [`#40450383862`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40450383862).

No live receipt was submitted and no Orynq certification was asserted. This capture verifies the storage-proof boundary only; the finalized-head report is still an untrusted RPC observation until independently bound by GRANDPA finality and authority-set provenance. No payout, EEV, B1 admission, B2 carrier or Issue authority follows from it.

**STATUS: REAL PREPROD CAPTURE + RUST STORAGE PROOF + DRY-RUN PLAN GREEN; SANITIZED-PLAN ARTIFACT STEP FIXED / RETEST PENDING; GRANDPA/AUTHORITY GATES OPEN; NO LIVE SUBMISSION.**


## 45.08 — AGENT C — OryNq BRIDGE END-TO-END DRY-RUN GREEN — 2026-10-27

Run [`#40450383862`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40450383862) completed **SUCCESS** on commit [`ae60390`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/ae6039043cb50f91e2f24cb09b651c531e400954). This run covered the complete non-transactional pipeline:
1. Public Materios Preprod RPC selected in read-only mode.
2. Preflight and witness capture bound to one exact finalized-head hash.
3. Rust unit suite passed; the actual witness storage proof verified against the exact `stateRoot`, storage key and AnchorRecord value.
4. The Orynq bridge repeated the Rust verification and produced its receipt plan in dry-run mode.
5. JSON plan was serialized and uploaded successfully after removing npm's stdout banner from the captured JSON.

Sanitized artifact [`materios-orynq-receipt-plan`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40450383862/artifacts/12710810268) confirms:
- witness block: `2463823`, hash `0x68968877f7696d4f09d093a5d8712228d64e834fdb4ec84ed0841d6832fb8260`;
- planned receipt ID: `0x03cd4676949335567e851a41391cc5749fd9690cf911f41eb78ae05f58670114`;
- content hash/chunk Merkle root: `0x9d37a8ecc89a9d0b215fc385f363ce634d0c3166b8a63a7da9b065991838d2a5`, with one chunk (therefore both hashes coincide).

A follow-up workflow hardening commit [`e6e70ca`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/e6e70cad22ff8857043ebea6a005af2a3b72f798) now strips `rpc_endpoint` and `captured_at` from the verified witness and uploads the sanitized witness plus plan as one short-lived artifact. Its validation run [`#40450688645`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40450688645) is queued.

**STATUS: REAL WITNESS + RUST STORAGE PROOF + OryNq DRY-RUN PLAN GREEN; NO LIVE SUBMISSION; GRANDPA FINALITY/AUTHORITY PROVENANCE STILL OPEN; SANITIZED WITNESS ARTIFACT RETENTION CHANGE PENDING.**


## 45.09 — AGENT C — SANITIZED REAL WITNESS ARTIFACT GREEN — 2026-10-27

This supersedes the "artifact retention pending" statement in §45.08.

- [Run `#40450688645`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40450688645) completed **SUCCESS** on branch head `e6e70cad22ff8857043ebea6a005af2a3b72f798`.
- The [combined sanitized evidence artifact](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40450688645/artifacts/12710431625), ID `12710431625`, contains both `MateriosB3AnchorStateWitness.verified.json` (12,792 bytes) and `OrynqReceiptPlan.sanitized.json` (604 bytes); endpoint URL and capture timestamp are removed.
- The witness carries 10 storage proof nodes; `storage_proof.at` equals its exact target block hash; the Rust verifier passed against its `stateRoot`, storage key and exact AnchorRecord value.
- Target in this artifact: block `2463858`, hash `0x04c7818ffbc4f14dbd67e5d1e30d4e3e53bbd0ce58afac502358696c0d37d3d9`, state root `0x89c3bdfd6d05b091a45bde277d268b5603c264d40f1ee6aa67f02ae674fd20fe`.
- Dry-run plan: receipt ID `0xf643d04ae43f67d530e958e32cba68b5b91f4fbb40773d3f1bab91cf000029e0`; content hash/chunk-Merkle root `0x5bf74218fb6369bc159a394948eafef5beab4a717c04f7a6cd4d2d8615b33023`; one chunk, 12,152 bytes. Because this is a blob receipt with one chunk, the SDK's chunk Merkle root equals the content hash.

A follow-up metadata correctness pass adds explicit propagation of the preflight target mode into `checkpoint_source`: the artifact above is conservative but labels the selected hash as an "explicit block hash" even though this CI obtained it through `chain_getFinalizedHead`. Commits [`c39d8d2`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/c39d8d2f33ea4d7e36b7cb80ffc7cd0ca4b2b68c), [`4749dae`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/4749dae0d4cbfc6a32142fec3c2daf140fe3f8ce), [`37f2c72`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/37f2c727539b5b1b4530d011d662a76aa1ad61da) and [`da16da6`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/da16da6d623ae79acebe0888baca1f873df2c80f) carry this source-label fix and update the stale capture/preflight comments. Validate the latest branch head before treating that metadata correction as closed.

**STATUS: REAL WITNESS + RUST STORAGE PROOF + OryNq DRY-RUN + SANITIZED COMBINED ARTIFACT GREEN; SOURCE-LABEL CORRECTION IN CI; NO LIVE RECEIPT; GRANDPA FINALITY AND AUTHORITY PROVENANCE REMAIN OPEN.**


## 45.10 — AGENT C — NEXT B3-A EXPERIMENT MOVED TO PINNED SMOLDOT P2P — 2026-10-27

Evidence boundary re-checked against latest public Materios probes:
- Public HTTP RPC endpoints report a finalized head, but `grandpa_proveFinality` is `-32601 method-not-found`, and `chain_getBlock.justifications` is null on the sampled finalized head. The bounded public-HTTP scan ended `NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_DENSE_SCAN`.
- The Existing-Route Proof Availability workflow independently captured/verified storage proof but then correctly failed closed because it could not capture GRANDPA justification bytes and the RPC also lacked `state_getCode`. This is endpoint capability/evidence availability, not a reason to mark B3-A green.
- To try the permissionless path before asking for an archive endpoint or operator-supplied proof, Agent C updated [`.github/workflows/materios-smoldot-p2p-finality-probe.yml`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/.github/workflows/materios-smoldot-p2p-finality-probe.yml) to run on a narrow push trigger and changed its default target to the most recent Rust-verified witness: block `2463858`, hash `0x04c7818ffbc4f14dbd67e5d1e30d4e3e53bbd0ce58afac502358696c0d37d3d9`.
- The [Smoldot P2P probe run `#40452133173`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40452133173) is in progress on commit `cd7ed4a7caa5e48ed4edc5cd21d2bc01d6308533`. It builds the pinned Smoldot PR revision, verifies the official chain spec digest and expected genesis hash, uses P2P for the proof source, and treats HTTP only as untrusted block/header discovery.
- A P2P-captured raw justification and locally reconstructed header are only acquisition evidence. Closure still requires feeding it into the IMMORTAL GRANDPA signature/quorum verifier against an authenticated authority set, then proving the authority-set transition from the genesis trust anchor. Smoldot's own reported finality is not imported as a trusted proof packet by itself.

**STATUS: OryNq DRY-RUN + RUST STORAGE PROOF GREEN; PUBLIC HTTP GRANDPA/RUNTIME PROOF INPUTS UNAVAILABLE; PINNED SMOLDOT P2P PROBE RUNNING AGAINST THE REAL WITNESS BLOCK; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.11 — AGENT C — ANCESTRY BRIDGE TESTED; P2P TARGET FALLBACK CORRECTED — 2026-10-27

- Added `poc/materios-smoldot/target-ancestry-bridge.mjs`: it reconstructs canonical Substrate Header SCALE bytes, recomputes Blake2-256 hashes, checks each block number and parent hash, requires a complete consecutive header sequence between the exact storage checkpoint and a GRANDPA justification target, and caps the default bridge at 512 parent edges. The raw SCALE header encodings are returned for independent verification. The module expressly does **not** verify GRANDPA signatures/quorum or authority provenance.
- Added six deterministic tests in `poc/materios-smoldot/target-ancestry-bridge.test.mjs` covering a valid chain, bad parent link, missing intermediate header, wrong target hash, max-span refusal and a same-block target. [Materios Canonical Evidence & Finality Boundary run `#40453367532`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40453367532) completed **SUCCESS**; both the ancestry tests and `node --check poc/materios-smoldot/capture-finality.mjs` passed.
- Integrated the ancestry bridge into `capture-finality.mjs`. It tries to obtain intermediate headers from Smoldot's own RPC, checks each returned block hash against the reconstructed header and each parent edge, and records `witness_header_ancestry_link_verified` only when the exact witness block is structurally connected to a captured justification target. It does not treat this as B3-A closure.
- Important prior-run correction: [Smoldot probe run `#40452133173`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40452133173) used the stale fallback env target `1856408` despite the input default being `2463858`. Its artifact [`12710459983`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40452133173/artifacts/12710459983) found zero raw justifications and classified Smoldot sync as `WARP_SYNC_STALLED_AT_FIXED_BLOCK` around block `97069`. This is a negative acquisition result for that probe, not evidence against GRANDPA consensus itself.
- Corrected the fallback environment target to the latest Rust-verified witness: block `2463858`, hash `0x04c7818ffbc4f14dbd67e5d1e30d4e3e53bbd0ce58afac502358696c0d37d3d9`. The current correctly targeted P2P probe [run `#40453433161`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40453433161) is running against this target. The P2P workflow was restored to its known-good structure after an over-broad YAML edit caused zero-job workflow failures; current tests live in the already working evidence-conformance workflow, which validates the new module.
  
**STATUS: OryNq dry-run + real Rust storage proof GREEN; ancestry bridge implementation and tests GREEN; correctly targeted Smoldot P2P run IN PROGRESS; public RPC still supplies no usable GRANDPA proof; B3-A OPEN; no live transaction.**


## 45.10 — AGENT C — SOURCE-LABEL FIX + LATEST WITNESS BRIDGE GREEN; P2P FINALITY ACQUISITION RUNNING — 2026-10-27

Latest B3 branch head checked: `47607479b44847e593074e802971168e1213580e`.

- [Canonical Evidence & Finality Boundary run `#40454871048`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40454871048) completed **SUCCESS**. It passed the witness-to-GRANDPA target ancestry bridge tests, canonical evidence tests, execution-proof tests, RPC B3 tests, typecheck, and the GRANDPA verifier suite/build (15 test files, 149 tests passed in `poc/materios-grandpa`).
- [Orynq Evidence Bridge run `#40454870910`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40454870910) completed **SUCCESS** on the same branch head. Preflight, exact-block witness capture, Rust tests, storage proof verification, Orynq dry-run, sanitization and combined artifact upload all passed.
- New combined artifact [`materios-b3-verified-witness-and-orynq-plan`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40454870910/artifacts/12711863497), ID `12711863497`, size 4,430 bytes, contains sanitized verified witness and receipt plan; RPC endpoint and capture timestamp are removed. This run validates the corrected `checkpoint_source` plumbing at branch head `47607479`.
- [Smoldot P2P Finality Probe run `#40454861474`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40454861474) remains **in progress** at the proof-capture step. Its job is to acquire raw GRANDPA justification evidence from P2P and structurally bind the witness header to the justification target; no finality conclusion is available yet. The public RPC had not supplied usable GRANDPA proof material in earlier probes.

This is important separation of gates: successful unit/integration tests for GRANDPA verification and the ancestry bridge validate verifier code and its evidence boundary; they do not mean a live justification was obtained or accepted for the current target.

**STATUS: REAL WITNESS + RUST STORAGE PROOF + SANITIZED ORYNQ DRY-RUN GREEN; SOURCE PROVENANCE LABEL TESTED; P2P GRANDPA PROOF ACQUISITION STILL RUNNING; B3-A NOT CLOSED; NO LIVE TRANSACTION.**


## 45.12 — AGENT C — P2P PROBE NOW USES EXACT LATEST WITNESS + STATE ROOT — 2026-10-27

Latest B3 branch head: `0a3e28521551a1f5566cadfe0bfd1c933421cd8b`.

The latest successful Orynq bridge run [`#40454870910`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40454870910) captured and Rust-verified this exact witness:
- block: `2464310`;
- hash: `0xbbe17274a5d8c82ba15bac5bd62da5db4bc109f560e63a610e1476ab7c8a0f69`;
- stateRoot: `0x04a4a79a4e5d4cd70899cb04aadab6aece6e86f7a05b62d4a1caead0975216fa`.

The Smoldot workflow and capture defaults now use all three values, with an explicit `target_state_root` workflow input. A branch-scoped concurrency group prevents new duplicate probe runs. Commits: [`d136186`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/d136186b340bc3ae33f5644ad17327c2c5236249) and [`0a3e285`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/0a3e28521551a1f5566cadfe0bfd1c933421cd8b).

On the same latest commit, [Canonical Evidence & Finality Boundary `#40455355384`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40455355384) and [Orynq Evidence Bridge `#40455355258`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40455355258) are both **SUCCESS**. Target-aligned Smoldot run [`#40455355288`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40455355288) was queued when last checked. Previous completed P2P acquisition [`#40453433161`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40453433161) captured no raw GRANDPA justifications and observed warp-sync fixed at block 97069 for 350 seconds. Its result is explicitly classified as acquisition failure, not consensus invalidity.

**STATUS: STORAGE PROOF + RUST VERIFICATION + SANITIZED ORYNQ PLAN GREEN; GRANDPA VERIFIER TESTS GREEN; CURRENT P2P ACQUISITION NOT YET PROVEN; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.13 — AGENT C — LATEST TARGET-ALIGNED P2P RUN ACTIVE — 2026-10-27

The new single-run probe [`#40455355288`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40455355288), on `0a3e28521551a1f5566cadfe0bfd1c933421cd8b`, has moved from queued to **in progress**. It uses the exact witness tuple from the latest successful Orynq run: block `2464310`, hash `0xbbe17274a5d8c82ba15bac5bd62da5db4bc109f560e63a610e1476ab7c8a0f69`, stateRoot `0x04a4a79a4e5d4cd70899cb04aadab6aece6e86f7a05b62d4a1caead0975216fa`. The workflow now has branch-scoped concurrency control; the earlier pre-guard run `#40455345347` was cancelled when the latest run entered the group.

No artifact/result is available from the current capture step yet. Do not interpret its running status as proof availability. The last completed capture remains `#40453433161`: zero raw justifications, target block unavailable through Smoldot RPC, warp sync stalled at block 97069 for 350 seconds.

**STATUS: LATEST EXACT-WITNESS P2P CAPTURE IN PROGRESS; RAW GRANDPA PROOF NOT YET CAPTURED; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.14 — AGENT C — P2P TARGET NUMBER FALLBACK CORRECTED — 2026-10-27

The completed target-aligned P2P probe [run #40455355288](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40455355288) exposed a workflow wiring defect: the workflow_dispatch input default and capture script used block `2464310`, but the environment fallback `MATERIOS_TARGET_BLOCK_NUMBER` still overrode it with stale block `2464283`. The run log records the mixed tuple: number `2464283` with the block hash and stateRoot for `2464310`. The ancestry bridge consequently returned `ANCESTRY_BRIDGE_UNAVAILABLE (CHECKPOINT_HEADER_NOT_HASH_BOUND_TO_WITNESS)`. The same run captured zero raw GRANDPA justifications and observed Smoldot warp sync stalled at block `97069` for 350 seconds. This is an acquisition/configuration failure, not evidence that Materios GRANDPA consensus is invalid.

Fix committed on the existing B3 branch `work/b3-materios-provenance-evidence` as [`05327bd`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/05327bd7182b4e64ee50c5d76496a1418e707b3e): the environment fallback now uses `2464310`, aligning number, hash and stateRoot to the exact latest Rust-verified witness. No new branch was created. Push-triggered rerun [#40456422345](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40456422345) was queued when this section was written; verify its run/artifact before concluding the fix is effective.

B3-A remains **OPEN** until a real raw GRANDPA justification is captured, bound to a reconstructed matching target header and witness ancestry, and independently verified along with authenticated authority history/transition. Existing Rust storage proof, sanitized Orynq dry-run and verifier tests remain green. No live transaction or receipt submission.

**STATUS: MIXED-TARGET DEFAULT FIXED; VALIDATION RERUN QUEUED; REAL GRANDPA PROOF NOT YET CAPTURED; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.15 — AGENT C — UPSTREAM GRANDPA PRUNING HYPOTHESIS — 2026-10-27

Independent source review found an upstream operational note in [Materios Operator Kit at commit `7d5c36e`](https://github.com/Flux-Point-Studios/materios/blob/7d5c36e7dcd60824d84353e93df5d4a03c9c6c30/docs/OPERATOR_KIT.md#L59-L74): it describes a full-node sync floor associated with historical GRANDPA-justification pruning and notes that a justification-retaining public sync node was being deployed. This is a **plausible hypothesis only**, not proof that the Smoldot light-client stall has the same cause. Run `#40455355288` recorded only warp-sync progress/idle states at block `97069`; its captured logs do not contain direct peer-ban, duplicate-request, or pruning evidence.

Keep the corrected exact-witness probe `#40456422345` running to completion. If it still stalls at the same warp-sync block, do not merely repeat identical probes or treat the upstream note as proven. Next evidence-seeking step should qualify whether the announced justification-retaining sync endpoint exists and can supply raw GRANDPA bytes for independent local verification. Any such endpoint is a **transport/source**, not a trust anchor: IMMORTAL must still bind the proof to a reconstructed header/witness ancestry and verify signatures/quorum plus authenticated authority transition. No finality claim and no live transaction.

**STATUS: WORKFLOW TARGET DEFAULT FIXED; RERUN ACTIVE; JUSTIFICATION-PRUNING CAUSE ONLY A HYPOTHESIS; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.16 — AGENT C — P2P TARGET RE-ALIGNED; PUBLIC WS FALLBACK ACTIVE — 2026-10-27

The previously target-correct run [#40456422345](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40456422345) is complete with a negative proof-availability result. Its evidence JSON confirms the expected Materios v6 genesis hash (`genesis_hash_match: true`) and the fixed tuple `2464310` / `0xbbe17274...` / `0x04a4a79a...`, so the older number/hash mismatch is resolved. However, Smoldot returned no block object for the pinned target or target+1, returned some nearby headers without any FRNK justification, and the candidate scan captured zero justifications. `target_ancestry_bridge` therefore reports `NO_GRANDPA_JUSTIFICATION_CAPTURED`; warp sync remained fixed at block `97069` across 350 seconds. This establishes the remaining blocker as P2P historical proof availability (not proof of invalid consensus). Artifact: [12712766579](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40456422345/artifacts/12712766579).

The latest successful Rust-verified witness+Orynq dry-run artifact from [#40457016082](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457016082), artifact [12713306213](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457016082/artifacts/12713306213), provides a stable pinned target for this capture round: block `2464531`, hash `0x91fb7cca7ff9ed11c981e524446978750691b376df2eb615322a6bf83834d2a7`, stateRoot `0xfa97240573061c759e447042f86db343d9a323e57184f2ec8382bef43d88a3b4`, storage proof at the same hash with 10 proof nodes. Its checkpoint source is the HTTP `chain_getFinalizedHead` response and remains explicitly untrusted for finality.

Updated existing B3 branch `work/b3-materios-provenance-evidence` (no new branch): workflow input and env fallbacks now match the pinned `2464531` tuple in commit [`9701681`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/9701681e3c0d98ea2ac8fe14afafb108de511bc0); capture-script defaults were aligned in [`b349356`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/b34935640df4df143ecfe1f2e280bef2efbd51cd). The probe [#40457322219](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457322219) is active on the matching head. The intermediate probe [#40457303536](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457303536) was cancelled by concurrency when the aligned script commit arrived; it is not an evidence result.

Regression test commit [`f618ed0`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/f618ed0003592e31ef7727a6562775144c444535) passed in [Canonical Evidence & Finality Boundary #40457016078](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457016078), including test `keeps the workflow witness tuple aligned with capture defaults`; 15 GRANDPA test files / 149 tests and build passed. The Orynq bridge passed on that commit and again at current head `b349356` in [#40457322157](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457322157).

In parallel, the existing public WebSocket acquisition path was activated read-only by adding branch-scoped concurrency to `.github/workflows/materios-websocket-grandpa-probe.yml` in [`537b01b`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/537b01b3e50b509270a3f80934e652160f51e9d0). Run [#40457452181](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457452181) is in progress. It checks pinned genesis identity and calls the existing `grandpa_proveFinality` plus `grandpa_subscribeJustifications` methods; any payload is raw acquisition only and must still pass independent IMMORTAL verification.

Next checkpoint action: inspect [#40457322219](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457322219) and [#40457452181](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457452181), including artifacts. If the public WebSocket route returns raw justification bytes, feed them to existing verifier path; if neither path yields bytes, pursue evidence for the official justification-retaining sync endpoint rather than repeating identical P2P runs.

**STATUS: TARGET TUPLE CONSISTENT; STORAGE-PROOF/OryNQ DRY-RUN GREEN; P2P GRANDPA PROOF STILL UNAVAILABLE; PUBLIC WS PROBE ACTIVE; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.17 — AGENT C — PUBLIC WS ROUTE NEGATIVE; NO PUBLISHED RETAINING ENDPOINT FOUND — 2026-10-27

The read-only [WebSocket probe #40457452181](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457452181) completed with workflow SUCCESS and artifact [12713545241](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457452181/artifacts/12713545241), but its result is **negative for proof acquisition**. The endpoint `wss://materios.fluxpointstudios.com/preprod-rpc` connects and matches the pinned Materios Preprod v6 genesis hash. At observed finalized head #2464572, block justifications had zero entries; direct `grandpa_proveFinality` and `grandpa_subscribeJustifications` calls both returned JSON-RPC `METHOD_NOT_FOUND`. No raw proof bytes were captured.

Gateway discovery from both published `chain-info` paths yields the same single bootnode (`/dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM`), with explicit `untrusted peer-discovery metadata only` scope. A current public-repository review found the upstream operator-kit note about a justification-retaining sync node being deployed, but no published endpoint URL or additional bootnode in the current `Flux-Point-Studios/materios` main at [`7d5c36e`](https://github.com/Flux-Point-Studios/materios/commit/7d5c36e7dcd60824d84353e93df5d4a03c9c6c30) or `materios-operator-kit` main at [`3ec3323`](https://github.com/Flux-Point-Studios/materios-operator-kit/commit/3ec33237a2d5566753553be53f9769d5e5569eeb). This means the retaining endpoint remains an infrastructure lead to verify, not an available route.

The correctly pinned P2P probe [#40457322219](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457322219) is still in progress on `b349356`; it targets the stable witness tuple block `2464531`, hash `0x91fb7cca7ff9ed11c981e524446978750691b376df2eb615322a6bf83834d2a7`, stateRoot `0xfa97240573061c759e447042f86db343d9a323e57184f2ec8382bef43d88a3b4`. The independent test/conformance run [#40457322259](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457322259) and Orynq storage-proof/dry-run run [#40457322157](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457322157) are SUCCESS on the same source head. Keep the pinned target fixed through this capture attempt rather than chasing each newly observed head.

If P2P again returns no proof, do not repeat the identical single-bootnode probe. Obtain a maintainer-published justification-retaining endpoint/peer or prepare a full-node source from the upstream current-snapshot procedure; treat all bytes from that source as untrusted and run the existing local GRANDPA + authority-transition verification. No raw proof means no B3-A closure; no live transaction.

**STATUS: STORAGE PROOF AND ORYNQ DRY-RUN GREEN; PUBLIC WS GRANDPA METHODS UNAVAILABLE; P2P RETRY ACTIVE; NO PUBLISHED RETAINING ENDPOINT URL FOUND; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.18 — AGENT C — HISTORICAL FRNK FOUND; AUTHORITY STATE PRUNED; NEXT BOUNDARY PROBE ACTIVE — 2026-10-27

The targeted WebSocket capture on run [#40458139500](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458139500), artifact [12712539696](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458139500/artifacts/12712539696), produced a 574-byte raw FRNK justification for boundary block `2464256`, header hash `0xeae63b407791a803192d1357d73eae50754edd9f0eb76347d84480f61a8bc4b0`, stateRoot `0x1f8fffd3559354051d43602211333b7f1bc1724f8640fc52d1e4f0e23d4ade74`, SHA-256 `5ddfe7fcdc3c3c346c96f91fb4689df51b12729724a71d2f3b9d9b7c181dc9b6`. The chain/genesis identity matched.

The existing capture/verify job has been wired to consume the WebSocket payload in commit [`c0faed4`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/c0faed4fe3966b9b5e7e53b93a8d233774a7f48e). It verifies payload SHA-256, same-target header fields across HTTP and WebSocket, and a locally recomputed Substrate header hash before attempting GRANDPA verification. The first run [#40458773667](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458773667) found the payload but the public HTTP node returned `UnknownBlock: State already discarded` for runtime authority state at the historical proof block.

A deliberately untrusted current-state fallback was added only to preserve diagnostics and allow a cryptographic check if the same set is still current. Run [#40458885807](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458885807), artifact [12713208481](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458885807/artifacts/12713208481), captured round `15968`, observed set-id `4352`, 4 precommits, and returned `INVALID_SIGNATURE` against the current runtime authority set. This is a valid **negative verification result for that provided set**, not proof that the old justification is invalid: the target-block authority state was pruned, and the observed current set's provenance is unverified. Cryptographic finality remains false.

The follow-up now pins the next 512-block boundary `2464768` (ignoring stale workflow override `2464256`), waits up to 900 seconds for that target to become finalized, then captures the FRNK bytes and tries runtime state at the exact target while it is recent. Current run: [#40459273895](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40459273895), source head [`45bf530`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/45bf5300f642f7ecf45f6cf6ee659712c692756c), still active at checkpoint time. `MATERIOS_WITNESS_LOOKBACK=1024` is also set so the previously verified storage checkpoint at block `2463858` can be included for a later header-ancestry bridge.

The capture script writes authority-state provenance as unverified even if current-state fallback is used. The next closure step requires (a) matching target header/hash and GRANDPA signature+quorum validation against the correct target authority set, (b) header bridge from pinned storage-proof checkpoint `2463858` to the finality target, and (c) authenticated authority transition provenance. No live transaction.

**STATUS: REAL HISTORICAL FRNK BYTES CAPTURED; HISTORIC TARGET STATE PRUNED; CURRENT-SET SIGNATURE CHECK FAILED; NEXT BOUNDARY `2464768` CAPTURE ACTIVE; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.19 — AGENT C — DYNAMIC BOUNDARY CAPTURED; SIGNATURE CHECK STILL FAILS — 2026-10-27

The static finality candidate `2464768` had become stale as Materios Preprod advanced to block `2471202`; the previous capture failed to match the old candidate within its bounded HTTP scan. Fixed this on the existing B3 branch in [`afb9291`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/afb92919c77f2db4524c1176a8b29210e82426fe): the read-only WebSocket probe now selects the latest finalized 512-block boundary unless a configured candidate is still ahead or within the 1024-block cross-route window. No new branch.

New WebSocket run [#40545697151](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697151) SUCCESS, artifact [12752218262](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697151/artifacts/12752218262): chain/genesis identity matches; finalized head observed at `2471202`; dynamically selected boundary `2470912`; header hash `0x82d0e8cfd8646e40a370290283dfc94c9c14f592f3a7f2a0d4ae9a71f73da96d`; stateRoot `0xd67687e3a5ae4efcbc9ed178f201718f9c25b9de5524d30d2d9310413a8b5af1`; 574-byte raw FRNK payload captured, SHA-256 `8e6c1a5e3ddbc20d55c6148f06b7710f9780c2f9dbb50d978fd15ccbd3e39006`. Payload remains untrusted transport evidence.

The capture/verification workflow [#40545697588](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697588), artifact [12751857950](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697588/artifacts/12751857950), cross-bound the WebSocket header against HTTP and recomputed header hash successfully, but the historical target state was already pruned (`UnknownBlock: State already discarded`). Parent-state query was also pruned. Diagnostic fallback to current finalized authority set `4352` (5 authorities) gives `INVALID_SIGNATURE` for the 4-precommit justification. This does **not** prove the chain's consensus invalid: the historical authority state and transition remain unauthenticated, and independent signature encoding/source validity still need resolution. The code adds parent-state signature/quorum diagnostics only when the target-set check fails, in commit [`5f8f417`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/5f8f417edd9341704305bd4c6496a94c72499552); it does not promote diagnostic evidence to trusted state.

B3-B live storage proof is green in the same run (artifact [12753540712](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697588/artifacts/12753540712)); Orynq witness/receipt dry-run is SUCCESS [#40545697346](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697346), artifact [12753430506](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697346/artifacts/12753430506). Existing-route proof-availability run [#40545697148](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697148) remains fail-closed because the HTTP endpoint has no `grandpa_proveFinality`, no runtime code and `chain_getBlock` fallback reports `invalid justification engine id[0]` (artifact [12752776678](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697148)).

Next step: resolve the signature mismatch with an independent standard GRANDPA implementation and an authenticated historical authority-set transition. Do not keep rotating candidate blocks without fixing the trust/provenance problem; do not use current-set fallback as authority proof. The B3-A gate remains OPEN and no live transaction/receipt has been submitted.

**STATUS: DYNAMIC FRNK CAPTURE GREEN; HEADER CROSS-ROUTE/HASH BINDING GREEN; STORAGE PROOF AND ORYNQ DRY-RUN GREEN; GRANDPA CRYPTOGRAPHIC FINALITY NOT VERIFIED; HISTORICAL AUTHORITY STATE PRUNED; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.20 — AGENT C — INDEPENDENT SIGNATURE CROSS-CHECK — 2026-10-27

Performed an independent diagnostic against the raw 574-byte justification from artifact [12751857950](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545697588/artifacts/12751857950). The four precommit signer IDs all match keys in the returned five-authority set, and the target hash/number decode consistently. A separate Ed25519 implementation rejects all four signatures for the standard localized GRANDPA payload using observed set-id `4352`. Checked the upstream `paritytech/substrate` GRANDPA source: `localized_payload_with_buffer` encodes `(message, round, set_id)` and the `Precommit` message uses enum index `1`; the current IMMORTAL encoding follows that layout. This reduces the likelihood that the failure is only the local verifier's first-error reporting, but it does not by itself prove the RPC payload is invalid on-chain.

The authority state at `2470912` and its parent is pruned by the public RPC, so the current set is only an untrusted fallback. The earlier block `2464768` capture did return exact-target runtime authority state but also failed `INVALID_SIGNATURE`; neither capture has authenticated transition provenance. Treat the possibilities still open as: payload/transport corruption or nonstandard chain semantics, incorrect/unavailable historical authority-set context, or a verifier mismatch not yet exposed by the tested encoding variants. Do not weaken signature verification or promote a current-state fallback.

Next: acquire a proof/source that can provide authenticated historical authority state (or an upstream-maintainer confirmation of the expected GRANDPA key/signature semantics), then compare the same raw FRNK bytes with an independent Substrate-compatible verifier. Keep B3-A OPEN until signature/quorum, ancestry, and authority-transition provenance are all verified.

**STATUS: RAW FRNK ACQUISITION GREEN; STANDARD ED25519 CHECK REJECTS 4/4 AGAINST OBSERVED SET; CAUSE NOT YET ATTRIBUTED; HISTORICAL AUTHORITY PROVENANCE MISSING; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.21 — AGENT C — SET-ID HYPOTHESIS NARROWED; NEXT BOUNDARY CAPTURE ARMED — 2026-10-27

A bounded diagnostic was added on the existing B3 branch in [`2700a57`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/2700a570d2859c128b709825b490ee7f86f46fbf). Against the captured raw FRNK justification at block `2470912` (round `44306`, 4 precommits), the probe tested set IDs `4096..4352` using the standard localized payload and each embedded signer key. Exactly one candidate matched: `set_id=4261`, with **4/4 signatures valid**. The subsequent diagnostic ran the existing signature/quorum/ancestry verifier using candidate ID `4261` and the currently observed 5-authority list; it returned `SIGNATURE_QUORUM_ANCESTRY_PASS_UNTRUSTED` with signed weight `4/5`. Evidence: artifact [12752923922](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548126634/artifacts/12752923922).

This narrows the earlier `INVALID_SIGNATURE`: the bytes and standard GRANDPA signing payload are internally consistent under candidate set ID `4261`, while current runtime API reports set ID `4352`. It is **not** a finality pass. The candidate ID was inferred from signatures, not authenticated from historical runtime state; the current authority list is also a fallback because target and parent state were pruned. The source review of Materios runtime at [`33da1cf`](https://github.com/Flux-Point-Studios/materios/commit/33da1cfe480248252f35a6675db33ebc4895cff) confirms the standard `sp_consensus_grandpa::AuthorityId` / `GrandpaApi` path. Do not promote the inferred ID or current authority set to trusted state.

Next attempt is designed to capture the next 512-block boundary while its runtime state is still queryable. The probe's WebSocket witness now supersedes an older HTTP witness only when its block number is newer, after cross-route header equality and local header-hash recomputation; commit [`0799995`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/07999956273109890a79a737a7629fbfdeebe287). The execution-verifier workflow is pinned to next boundary `2471424` with the existing 900-second wait in commit [`a664937`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/a66493791dc426a4a6a213fd1dc5b9b7a34b84e7). Run [#40548408573](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573) is queued on that head; runs [#40548377508](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548377508) and [#40548377488](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548377488) are validating the preceding code changes.

Expected result of the next boundary capture: query `GrandpaApi_grandpa_authorities` and `GrandpaApi_current_set_id` at both target and parent immediately after finalization; compare those with the set ID inferred by the signatures. Even if target/parent state is available, keep it labelled untrusted until the genesis-rooted Materios authority-transition proof is authenticated. No new branch, no V3/Reveal changes, no live transaction.

**STATUS: RAW FRNK CAPTURE GREEN; 4/4 SIGNATURES + 4/5 QUORUM/ANCESTRY PASS ONLY UNDER INFERRED SET ID 4261; AUTHORITY SET-ID PROVENANCE STILL OPEN; NEXT BOUNDARY 2471424 CAPTURE ARMED; B3-A OPEN; NO LIVE TRANSACTION.**


## 45.21 — AGENT C — INFERRED SET-ID SIGNATURE PASS IS DIAGNOSTIC ONLY — 2026-10-27

The raw FRNK capture from [run #40548126634](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548126634), artifact [12752923922](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548126634/artifacts/12752923922), now contains a stronger bounded diagnostic: for target block `2470912` (`0x82d0e8cfd8646e40a370290283dfc94c9c14f592f3a7f2a0d4ae9a71f73da96d`), all 4/4 Ed25519 signatures verify when the localized GRANDPA payload uses candidate set ID `4261`. The existing full verifier then reports `SIGNATURE_QUORUM_ANCESTRY_PASS_UNTRUSTED` with signed weight `4` of total `5`; the observed current runtime API returns set ID `4352`, which yields `INVALID_SIGNATURE`. The raw signer IDs match the keys in the currently observed authority list.

This is **not** a finality PASS: set ID `4261` was inferred by a bounded signature search, not read from authenticated historical state; the target and parent runtime states are pruned; the currently observed authority list is only a current-state fallback; and the authority-set transition history from trusted genesis is not proven. Do not promote the inferred set ID or diagnostic result to `TrustedAuthorityState`, do not weaken the verifier, and do not submit a live receipt.

A fresh-target workflow is active on the same B3 branch. [Run #40548408573](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573), source head `a66493791dc426a4a6a213fd1dc5b9b7a34b84e7`, selects boundary `2471424` and waits for it to become finalized so the runtime authority state can be queried while recent. The verifier and live storage-proof jobs have passed in this run; the WebSocket capture/real-witness job is still running. Inspect its resulting artifact before changing the diagnostic classification.

**STATUS: RAW FRNK AND CROSS-ROUTE HEADER BINDING GREEN; 4/4 SIGNATURES + 4/5 WEIGHT + ANCESTRY PASS ONLY UNDER INFERRED SET ID 4261; AUTHENTICATED SET-ID/TRANSITION STILL MISSING; FRESH TARGET CAPTURE ACTIVE; B3-A OPEN; NO LIVE TRANSACTION.**
