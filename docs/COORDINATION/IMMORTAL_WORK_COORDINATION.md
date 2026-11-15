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
- Commit comparison reports the current head is eight commits ahead of the tested SHA, and the only changed paths in that interval are this coordination checkpoint and `plutus/test/BeaconCommitmentVectorsTest.hs`. No P2.8 materializer, native ledger runner, UTxO decoder, or Integration Lab workflow source changed in that interval. Therefore no duplicate P2.8 lab run is justified solely to retest the current documentation/Beacon-test-only head delta.
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


## 45.22 — AGENT C — NEXT-BOUNDARY CAPTURE RUNNING — 2026-10-27

The fresh-state run [#40548408573](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573) is now active on commit [`a664937`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/a66493791dc426a4a6a213fd1dc5b9b7a34b84e7). Its `Capture raw historical FRNK candidate over WebSocket` step is waiting for configured target block `2471424` (next 512-block boundary), with the probe's 900-second wait. At launch, the finalized-state artifact [12753497694](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573/artifacts/12753497694) observed block `2471377`, set ID `4352`, five authorities; the live storage-proof artifact [12754820488](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573/artifacts/12754820488) captured block `2471376` shortly after. These are independent observations one block apart, not the target proof.

No target-bound raw witness artifact has been published yet. Do not start another identical run while this wait is active. If target `2471424` finalizes in time, the subsequent capture step will prefer its cross-route-verified WebSocket payload over the older HTTP witness and query target/parent runtime state immediately. If the wait expires or target/parent state is already pruned, classify the acquisition result and do not claim a finality pass.

**STATUS: INFERRED SET-ID 4261 DIAGNOSTIC ONLY; TARGET 2471424 CAPTURE WAIT ACTIVE; NO TARGET-BOUND WITNESS YET; B3-A OPEN; NO LIVE TRANSACTION.**

## 45.23 — AGENT C / AGENT A CROSS-CHECK — FRESH TARGET REPRODUCES SET-ID 4261 SIGNATURE HYPOTHESIS, BUT NO TRUSTED FINALITY — 2026-10-27

Inspected the completed fresh-boundary workflow [run #40548408573](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573), pinned to source head `a66493791dc426a4a6a213fd1dc5b9b7a34b84e7). The run's Rust verifier, finalized-state capture and live storage-proof jobs passed, but `real-grandpa-witness` failed at cryptographic finality verification. Evidence artifact: [`materios-real-grandpa-witness`, ID 12754441369](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573/artifacts/12754441369); raw JSON SHA-256 `7bd6f51b606f2e9edb9a606c3b1e0c6d5b9b1968749f22a040685de17e92b270`. Separate finalized-state artifact: [ID 12753497694](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40548408573/artifacts/12753497694).

### Fresh target facts

- Finalized target: block `2471424`, hash `dcf28d0d21715e914000db6f10e216c8702fc39cd3275368746da3158cf2d16c`, state root `17383edcff2af5dd54c1785fe4622d9533e8471ab66c7221daece8e48748bf59`.
- The capture successfully queried GRANDPA authorities and set ID at the exact target state. The returned set ID is `4352`, with five authorities; target-state lookup itself is not the missing part for this target.
- Its 574-byte raw FRNK justification has round `46478`, four precommits, all four targeting the exact commit target `2471424`, and no ancestry headers.
- Independently re-parsed the artifact bytes and checked the standard localized Ed25519 payload using Python's independent `cryptography` Ed25519 implementation. Under candidate set ID `4261`, **4/4 signatures verify**; under observed target-state set ID `4352`, **0/4 verify**. All four signers are members of the five-key authority list returned at the target. A bounded search of `4096..4352` found exactly one all-signature match: `4261`. This reproduces the same inferred candidate observed at block `2470912`; it is stronger repeatability evidence for the payload/set-ID mismatch hypothesis, not authority authentication.
- With set ID `4352`, the existing verifier returns `INVALID_SIGNATURE`. The artifact's parent-state diagnostic also fails signature verification under `4352`.
- The dense scan covered blocks `2470400..2471424` and found the target justification, but no authority-transition witness in the configured probe window. `provenance_verified=false`; `b3a_claim.overall_status=OPEN`.
- The public RPC returns `METHOD_NOT_FOUND` for both `state_getCode` and `grandpa_proveFinality`; WebSocket justification capture succeeded and matched the target header across routes. The lack of runtime-code and standard finality-proof endpoints remains a transport/provenance gap.

### Interpretation and next action

The fresh run no longer has the earlier target/parent-pruning problem for the target block: exact-target runtime authority state is available. However, this does **not** authenticate the transition history, and the current-state API's set ID still conflicts with the only ID under which all four signatures verify. Do not choose `4261` merely because signatures verify, do not weaken the verifier, and do not mark B3-A green.

Next work should be non-duplicative and evidence-led: (1) preserve this second independent target as a regression vector for the localized payload diagnostic; (2) ask the Materios upstream/operator to explain why `GrandpaApi_current_set_id` returns `4352` while the target justification signatures verify only under `4261`, with the exact target hash/round and raw FRNK digest attached; and (3) obtain either a genesis-rooted authority-set transition proof or a node/RPC route that exposes verifiable runtime code/execution/finality evidence. Do not launch another identical boundary wait until there is a specific change to the witness path or a confirmed endpoint that can resolve the missing provenance.

**STATUS: FRESH TARGET AUTHORITY API READ GREEN; RAW FRNK + CROSS-ROUTE HEADER BINDING GREEN; 4/4 SIGNATURES VERIFY ONLY UNDER INFERRED 4261, NOT OBSERVED 4352; AUTHORITY TRANSITION PROVENANCE MISSING; PUBLIC RUNTIME-CODE/FINALITY RPC UNAVAILABLE; B3-A OPEN; NO LIVE TRANSACTION.**

## 45.24 — AGENT A — FIX RUNTIME-CODE ACQUISITION RPC METHOD — 2026-10-27

The fresh target artifact exposed a correctable acquisition defect: `capture-finalized.ts` requested `state_getCode`, which the public RPC rejects as `-32601 Method not found`. Substrate exposes runtime WASM through the well-known storage item `:code`; query it using standard `state_getStorage` at the exact block hash (`0x3a636f6465`), not a nonexistent standard RPC method.

Applied on the existing `work/immortal-green-closure` branch:
- `poc/materios-checkpoint/src/rpc.ts`: `getRuntimeCode(at)` now reads `:code` via `state_getStorage` at the exact hash and fails closed if absent.
- `poc/materios-checkpoint/test-rpc-b3.ts`: unit expectation and both runtime-capture mocks updated to require the exact `:code` storage key and block hash.
- Fix commit: `b7fe03ea03eaa66a02a55b9e4fd55e3ad411a99f`.
- Test commit: `6e576c28ef179f8ac8b7ebaa4ac086b761d2384e`.
- [Materios Canonical Evidence & Finality Boundary #178](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551713798) — SUCCESS on the test commit.
- [Documentation Link Check #2522](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551713799) — SUCCESS.
- [Materios Canonical Evidence & Finality Boundary #178](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551713798) — SUCCESS on the test commit.
- [Documentation Link Check #2522](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551713799) — SUCCESS.
- [Materios B3 execution-proof verifier #124](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551714015) — FAILURE overall. The Rust verifier and live storage-proof jobs passed; the finalized-state capture succeeded; the real-grandpa-witness job failed because this branch's workflow lacks the WebSocket probe step and direct `grandpa_subscribeJustifications` returned `METHOD_NOT_FOUND`. This is separate from the set-ID mismatch reproduced on Agent C's branch, where the WebSocket probe is present.

**Confirmed effect of the :code fix:** finalized-state artifact [12754214870](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40551714015/artifacts/12754214870), JSON SHA-256 `1ad442dc1a9d01aefb0dce85aa150ffbb6697b26df327db4d96bf53bbb6d6e82`, now records `runtime_code.status=captured` at exact finalized block `2471591` (hash `1ca50d7ccf0156c34a0942b4020af15b52d6a2edf9bddb4523ac362d136d4636`). Runtime WASM length: `857434` bytes; SHA-256 `4f4ee403ab22cd1f35c96aebaa2ba37508611e976a603e6b22b2ea03ec68f3d2`; Substrate-native Blake2-256 `98cab6b1b3d84179fdb252ce281e842310a48461c5e8ea802ea5fd5b33c91c7b`. These are observed hashes of bytes returned by the public RPC, not yet a trusted runtime identity or source-reproducibility proof. The capture still reports set ID `4352`, five authorities, and `grandpa_proveFinality: METHOD_NOT_FOUND`.

This repairs and live-validates runtime-code acquisition only. It does not resolve the GRANDPA set-ID conflict or prove runtime-code identity: returned WASM bytes still need an independently trusted hash/runtime identity and a state-root-bound proof. B3-A remains OPEN; do not infer set ID 4261 as trusted, weaken signature checks, or submit a live transaction.


## 45.25 — AGENT B — CROSS-BRANCH IMMORTAL SDK INVENTORY (DISCOVERY ONLY) — 2026-10-27

Created `docs/COORDINATION/IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md` on the existing `work/immortal-green-closure` branch (inventory commit `79336d655eba03ced2bf58984cde72628038e3d8`).

The inventory identifies reusable existing seams rather than implementing a second kernel:
- `Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json` and `Adapter/REFERENCE/export/ReferenceEconomicConformance.hs` as the conformance/reference starting point;
- `Adapter/CARDANO/serialization/CanonicalEconomicState.ts`, `Adapter/CARDANO/observation/EconomicObservation.ts`, `Adapter/CARDANO/runtime/EconomicAdmission.ts`, and `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` as existing Cardano-boundary types/functions;
- `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts` and `EconomicAdmissionTransitionBinding.ts` as evidence-shape/binding candidates, with an explicit caveat that schema validation does not establish cryptographic truth;
- the research-only `Adapter/MIDNIGHT/*` boundary and `poc/materios-orynq-bridge/*` on Agent C's branch as design examples, not core SDK dependencies.

Cross-branch guardrails:
- Do not cherry-pick whole historical audit branches; their histories diverge and duplicate path names.
- Do not relocate kernel/state code until consumers and conformance tests are mapped.
- Do not move EEV qualification into the SDK (Agent A ownership) or continue Materios/B3 work while paused (Agent C ownership).
- P2.8 native ledger materializer/runner is not an SDK acceptance API until its reference-script UTxO context issue is resolved and exact-head native evaluation evidence is produced.
- No SDK implementation branch, code refactor, deployment, transaction submission, or protocol-semantic change has been made.

**Initial conclusion:** no public IMMORTAL SDK package surface was identified in the first pass. Existing modules provide building blocks, but they are scattered across chain-neutral/reference and Cardano-specific directories. Proposed design-only MVP is a thin core contract/evidence façade, a Cardano adapter wrapper, and a conformance package; no duplicated economic kernel. Before implementation, finish exact branch-head pinning, consumer/dependency mapping, duplicate-definition review, and relevant conformance tests.

**STATUS: SDK CROSS-BRANCH INVENTORY v0.1 RECORDED; DESIGN/RECONNAISSANCE ONLY; NO IMPLEMENTATION AUTHORIZED YET.**


## 45.26 — AGENT B — SDK CONSUMER MAP + P2.8 EVIDENCE RECHECK — 2026-10-27

Updated `docs/COORDINATION/IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md` (follow-up commit `e9d42fa16c3aaa1c31e43503541536db5dc10aa0`).

Consumer mapping from read-only default-branch code search confirms:
- `CanonicalEconomicState.ts` has consumers in `EconomicObservation.ts`, Reveal conformance tests and Preprod conformance source binding.
- `CanonicalTransitionEvidence.ts` is consumed by admission/evidence binding, the Issue admission bridge, CAES composition tests and Reveal/Expire trace runners.
- `CardanoExecutionAdapter.ts` is used by mint, tx helpers, ad settlement and lifecycle traces/tests.
This means a file move or API rewrite would cross real application and evidence paths. The SDK MVP should start with a compatibility façade and contract tests, not renames or a parallel kernel.

P2.8: the current status docs and Reveal remediation spec still distinguish reference-script size remediation from actual native-ledger execution success. The workflow source invokes the native evaluator, but I did not verify a fresh exact-head run artifact that proves success with redeemer/ExUnits or a genuine ledger-originated failure. Therefore I do not declare P2.8 closed, and I do not modify the evaluator based on a green workflow label alone. Required evidence is latest run ID + exact head SHA + artifact digest + `ledger-evaluation-report.json` and its binding.

**STATUS: SDK CONSUMER MAP ADDED; NO CODE REFACTOR; P2.8 CURRENT-HEAD EVIDENCE NOT VERIFIED IN THIS PASS; NO CLOSURE CLAIM.**


## 45.27 — AGENT B — SDK TEST / WORKFLOW MAP — 2026-10-27

Follow-up inventory commit: [`04afcd33610902f8ec525b88d277f7267849aa55`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/04afcd33610902f8ec525b88d277f7267849aa55). Updated artifact: [IMMORTAL SDK cross-branch inventory](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md).

Mapped existing test and workflow boundaries without modifying code:
- `src/__tests__/immortal-reveal-conformance.test.ts`: canonical-state projection and Reveal contract;
- `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.test.ts`: action/pre-state/post-state fingerprint binding and negative twins;
- `Adapter/CARDANO/observation/CardanoObservedTransitionEvidence.test.ts`: observed transition/transaction binding;
- `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts`: fail-closed pre-sign admission/input/liquidity checks;
- `Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json` + `ReferenceEconomicConformance.hs`: existing chain-neutral reference surface, but the vector file is explicitly `executable-seed` and V08/V09 remain pending;
- `.github/workflows/adapter-sale-conformance.yml`: grouped focused boundary tests + build;
- `.github/workflows/immortal-cardano-preprod.yml`: live Preprod context + conformance binding, with manual-only observation/bootstrap options;
- `.github/workflows/immortal-cardano-lab.yml`: Yaci integration and native P2.8 evaluator/evidence packet.

Important limitation: the GitHub connector resolved the working branch files and returned blob SHAs, but its exposed branch search did not return the branch's commit SHA. I am not claiming exact HEAD pinning or fresh test execution from source inspection alone. The inventory now records this explicitly and sets the next gate: resolve exact HEAD, run the focused tests there, then build a thin compatibility façade with contract tests—no file moves or parallel economic kernel.

P2.8 remains separate and OPEN pending inspection of an exact-head `ledger-evaluation-report.json`, its byte-binding artifact, reference-input UTxOs and actual redeemer outcomes. No workflow dispatch, wallet signing, transaction submission, or protocol-semantic change was performed.

**STATUS: TEST/WORKFLOW MAP RECORDED; EXACT HEAD + FRESH TEST RUN STILL UNVERIFIED; NO SDK IMPLEMENTATION STARTED.**


## 45.28 — AGENT B — REFERENCE CONFORMANCE MADE FAIL-CLOSED — 2026-10-27

Implemented on the existing `work/immortal-green-closure` branch; no new branch. Main code/workflow head before this checkpoint entry: [`bde369cb23853f7a31f330d87a232211b1c606f6`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/bde369cb23853f7a31f330d87a232211b1c606f6). Full details are in the [SDK cross-branch inventory](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md).

**Bug found:** `Adapter/REFERENCE/export/ReferenceEconomicConformance.hs` emitted expected/actual values without asserting equality; unsupported executable vectors were silently skipped; V05's decomposition was collapsed into one aggregate field; and V07's nested locality cases were not run. Thus the output was not a fail-closed conformance gate.

**Fix made:**
- Assert every expected kernel output that is present and exit non-zero on mismatch.
- Fail on unsupported executable vector shapes rather than silently omit them.
- Build V05's universal state from its six supplied protected-capital components and check the aggregate against both the declared and expected value.
- Execute both V07 locality cases.
- Route V10 through the canonical `UniversalEconomicKernel` rather than duplicating RawSurplus arithmetic in the runner.
- Print V08/V09 as pending and label the final result `PASS_EXECUTABLE_VECTORS` with a pending count, not full conformance closure.
- Invoke the evaluator from `.github/workflows/immortal-cardano-lab.yml` after canonical Plutus setup and persist `audit/yaci-evidence/reference-conformance.txt`.

The working branch was verified at code/workflow SHA `bde369cb23853f7a31f330d87a232211b1c606f6` before this documentation update. The exposed combined-status endpoint returned no status records, and this environment could not execute the Haskell runner locally. Therefore **the implementation is committed but not yet test-validated**; inspect the actual Integration Lab run and its uploaded `reference-conformance.txt` before relying on it. V08/V09 remain pending, so overall portability conformance is still OPEN.

No normative economic rules, V3 carrier, Reveal semantics, EEV qualification/authority, Materios trust boundary, deployment, wallet signing, or transaction submission changed.

**STATUS: FAIL-CLOSED REFERENCE EVALUATOR IMPLEMENTED; CI INVOCATION ADDED; RUN RESULT PENDING; SDK FACADE STILL NOT STARTED.**


## 45.29 — AGENT B — EXACT-HEAD REFERENCE CONFORMANCE + NATIVE P2.8 EVIDENCE — 2026-10-27

Latest verified Integration Lab run: [#40562306009](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562306009), exact head `cc374da958bc5e7017779974dbb29ef998d06f8d` on `work/immortal-green-closure`. Overall job conclusion: **SUCCESS**. Evidence artifact: [immortal-cardano-lab-evidence.zip](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40562306009/artifacts/12763368218).

### Reference economic conformance
The Haskell runner actually executed against the canonical `UniversalEconomicKernel`; output:
- V01 PASS: protected capital 700, raw surplus 300, solvency True.
- V02 PASS: protected capital 1000, raw surplus 0, solvency True.
- V03 PASS: protected capital 1000, raw surplus 0, solvency False.
- V04 PASS: protected capital 0, raw surplus 0, solvency True.
- V05 PASS: protected capital 8500, raw surplus 1500, solvency True.
- V06 PASS: protected capital 9500, raw surplus 500, solvency True.
- V07.case1 PASS: protected capital 2000, raw surplus 3000.
- V07.case2 PASS: protected capital 4500, raw surplus 500.
- V10 PASS: protected capital 500, raw surplus 500.
- V08 and V09 remain explicitly pending (`pending-schema-extraction`, `pending-certified-kernel-fixture`).
- Final marker: `REFERENCE_CONFORMANCE_RESULT|PASS_EXECUTABLE_VECTORS|pending=2`.

Thus the executable seed vectors pass; this is **not full portability closure** while V08/V09 remain pending.

### Native Cardano-ledger/P2.8 evidence
The same exact-head run produced and bound the current-run artifacts; the fail-closed native runner reported:
- manifest SHA-256 binding verified;
- workflow commit/run binding verified;
- transaction slot/time binding verified;
- transaction reference/CBOR binding verified;
- typed Conway context decoded with native Ledger types;
- 2 redeemer entries, 2 successes, 0 redeemer failures, 0 Plutus execution failures, 0 ledger-context failures, 0 other ledger failures;
- `RESULT: LEDGER_ALIGNED_EVALUATION_SUCCESS`, acceptance A for this exact artifact under Cardano-ledger semantics.
The P2.8 evidence-gate step completed successfully. Resource audit used observed protocol parameters (`maxTxSizeBytes=16384`); this run measured `prizeValidatorFactory` script bytes 15,977 and `b1PrizePoolFactory` script bytes 11,357, plus CBOR transaction artifacts for the recorded traces.

This upgrades the prior P2.8 status from “no fresh exact-head native evaluation evidence verified” to **native ledger evaluation evidence PASS for this run/local Yaci context**. It does not qualify Preprod/mainnet or prove deployment/readiness for a real user ticket. Keep the environment boundary explicit.

### Remaining cautions / next gate
- Overall Integration Lab workflow: SUCCESS on this exact commit, including the native V3 carrier, isolated Aiken Reveal positive/negative twins, Reveal/Expire/FundTreasury/TicketIssued/Claim traces, and evidence packet generation.
- This does not mean all optional builder diagnostics passed: the log contains synthetic-exUnits-stub completion probes returning `BUILDER_COMPLETION_FAIL` (`signed=false`, `submitted=false`, `ledgerValidation=NOT_RUN`). Treat them as builder-probe findings, not ledger validation failures or successful transactions; investigate separately if that probe remains a required acceptance criterion.
- Do not change V3 carrier or Reveal semantics based on these synthetic probe outputs.
- SDK façade remains gated until V08/V09 and the intended SDK acceptance scope are resolved; no SDK façade implementation started in this checkpoint.
- No Preprod/mainnet transaction, user wallet signing, deployment, economic rule change, or Materios work was performed.

**STATUS: EXACT-HEAD LAB SUCCESS; EXECUTABLE REFERENCE VECTORS PASS WITH V08/V09 PENDING; P2.8 NATIVE LEDGER EVIDENCE PASS IN LOCAL YACI ONLY; PREPROD/MAINNET AND FULL PORTABILITY CLOSURE REMAIN OPEN.**


## 45.30 — AGENT B — V08/V09 GAP TRIAGE; NO SEMANTIC GUESSING — 2026-10-27

Follow-up inspection after the exact-head lab success identifies the safe next step for the two pending reference vectors. This is a triage note only; no economic semantics or executable fixtures were changed.

### V08 — expiry finality
- The canonical invariant is I9 in `docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md`: expiry cannot recreate rights or liabilities.
- The Constitution also specifies the generic boundary: no claimability or new liability after expiry, no resurrection, and no late reveal recreating the right; exact application duration is not a universal IMMORTAL constant.
- Existing model-check evidence (`verification/finite_model_checks.py` and `verification/FINITE_MODEL_CHECK_RESULTS.txt`) describes expiry as an absorbing state with no path back to live or settled.
- Therefore V08 must be built from this already-defined transition/finality contract, with boundary cases and explicit expected outcomes. It must not invent an expiry duration, borrow governance proposal-finality rules as if they were ticket semantics, or encode PRE-RICH-specific rules as universal IMMORTAL constants. First locate the canonical executable state/transition model that owns expiry, then fixture that model.

### V09 — safety/viability separation
- The normative Constitution and invariant register distinguish immediate post-state safety from viability in the certified concrete kernel `K_c`; neither a boolean solvency check nor a synthetic `K_c` fixture is sufficient evidence for both.
- The fixture must reference an existing certified-kernel/certificate fixture and preserve the distinction: a transition can pass immediate safety while failing the viability predicate. If no current certified fixture can support that counterexample, V09 remains pending and the missing certified fixture is a real upstream prerequisite; do not invent certificate values, `Ω`, coefficients, or a new economic rule to make the test pass.
- Until that authoritative fixture is found and its provenance verified, keep V09 explicitly pending rather than weakening the fail-closed runner.

### Independent diagnostic follow-up
- The synthetic-exUnits-stub builder probe reported `BUILDER_COMPLETION_FAIL` because the evaluator returned an unexpected `spend:0` redeemer result. That probe had `signed=false`, `submitted=false`, and `ledgerValidation=NOT_RUN`; it is not evidence of a ledger failure and is not a successful transaction.
- Triage its evaluator/redeemer association and whether this probe is an acceptance requirement before modifying any builder. Preserve the native P2.8 pass and do not touch the V3 carrier or Reveal semantics without a reproduced failure in the actual required path.

### Gate disposition
- No SDK façade until V08/V09 are backed by canonical executable evidence or the remaining dependency is explicitly recorded as an accepted blocker.
- No Preprod submission, signing, deployment, changes to normative economic rules, or Materios work in this step.
- Continue on `work/immortal-green-closure`; do not create another branch.

**STATUS: V08 CONTRACT LOCATED BUT EXECUTABLE FIXTURE OWNER MUST BE VERIFIED; V09 REQUIRES A REAL CERTIFIED-KERNEL FIXTURE; SYNTHETIC BUILDER PROBE SEPARATED FROM NATIVE LEDGER EVIDENCE.**


## 45.31 — AGENT B — CANONICAL FIXTURE OWNER AUDIT (V08/V09) — 2026-10-27

Read-only follow-up on the exact owner of the two pending portability vectors. This confirms a real distinction between already-defined semantics and the evidence required to mark a vector executable.

### V08 — expiry finality: reusable behavior exists, but at profile scope
- Universal rule: `docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md` I9 and `IMMORTAL/docs/CONFORMANCE.md` C8 require no resurrection of expired rights/liabilities.
- PRE-RICH already defines the application-specific expiry lifecycle in `PRE-RICH/docs/GAME-ECONOMY.md`; `plutus/PrizeValidator.hs` implements an explicit EXPIRE transition that consumes a pending PrizeDatum and emits no continuing PrizeDatum. PRE-RICH's duration policy is application/profile scope and must not be imported into a chain-neutral IMMORTAL vector.
- `verification/finite_model_checks.py::expiry_absorbing_check` checks an abstract three-state model (live/settled/expired), and its own file explicitly says it is abstract-model evidence, not implementation evidence.
- Decision: do not label V08 fully executable merely by wiring the existing finite abstract check into the economic-kernel runner. The current reference runner exercises `UniversalEconomicKernel`, whose aggregate state has no lifecycle/expiry field. V08 needs a separately identified canonical transition-model owner and a test that invokes that model, or must remain pending with this scope boundary explicit.

### V09 — concrete certificate instance does not exist in the checked-in package
- `docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md` R1 says the `K_c` certificate instance is not in the package because `𝒮, A, Ω, T, Safe` are deliberately uninstantiated.
- `docs/01-formal-records/10_FINAL_AUDIT_CLOSURE_MATRIX.md` records R1 as **PARTIALLY DISCHARGED**: theory is present, instance certification remains external. `docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` defines the VC/CK obligations but is a specification, not an instantiated certificate.
- `IMMORTAL/kernel/EconomicGate.hs::viabilityGate` takes `safePostState` and `allOmegaSuccessorsInCertifiedKernel` booleans. It enforces their conjunction but explicitly does not manufacture or certify `K_c`.
- Decision: no honest certified-kernel fixture is available to bind V09 to in this repo snapshot. Keep V09 pending. Closing it requires a profile/deployment to declare `S, A, Ω, T, Safe`, publish `K_c), discharge CK1–CK8/VC1–VC6 with evidence, and provide a non-vacuity witness where live viability is claimed. A boolean truth-table test would test the gate implementation, not the certificate.

### Next authorized work
1. Find/identify the canonical transition-model interface for universal expiry finality; do not conflate it with PRE-RICH or governance proposal finality.
2. Keep V09 blocked on the missing concrete certificate package; do not fabricate a certificate or reinterpret finite random-model results as deployment evidence.
3. Continue investigating the synthetic builder probe independently; native P2.8 remains PASS only for the exact local-Yaci artifact.
4. Do not start SDK façade, create branches, alter V3/Reveal semantics, submit Preprod transactions, or change economic constants in this step.

**STATUS: V08 SEMANTICS CLOSED BUT CANONICAL UNIVERSAL EXECUTABLE OWNER NOT YET IDENTIFIED; V09 BLOCKED BY ABSENT INSTANTIATED K_c CERTIFICATE (CONFIRMED IN RESIDUAL OBLIGATION REGISTER); NO SEMANTIC SHORTCUT ACCEPTED.**


## 45.32 AGENT B — SDK READINESS / V08 UNIVERSAL TRANSITION OWNER (2026-10-27)

**Working branch exact HEAD observed before this documentation update:** `776963a143bea02def3f231d5834f347460f6609`. The SDK inventory follow-up is recorded in `docs/COORDINATION/IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md`; its update commit is `3f82e1608d3d5f241bd12b970a235646b72ea4e2`.

### Findings
- The universal state/kernel/reference runner are aggregate economic predicates and portability-vector machinery; no universal lifecycle/action transition model was found in those exact-head files.
- `IMMORTAL/kernel/EconomicTransitionV3.hs` implements Issue/Reveal/Claim/Expire but is coupled to `EconomicStateV3`, `EconomicProfile`, ticket classes and V3 application state. It must not be silently relabeled as the universal transition owner.
- PRE-RICH expiry policy/evidence remains profile-specific; `verification/finite_model_checks.py::expiry_absorbing_check` is abstract-model evidence only.
- **V08 remains pending** until the canonical universal transition contract/owner is identified or normatively decided and implementation conformance is added.
- **V09 remains pending** until the concrete deployment/profile certificate for `K_c` and its required evidence exist. SDK types may carry evidence references; they cannot manufacture or imply certification.

### SDK execution boundary
Parallel work may document API contracts, versioned chain-neutral evidence envelopes, export-to-test ownership, and a release gate that explicitly reports pending conformance. Do not yet create a duplicate TypeScript kernel, universal transition API, package facade, or claim full SDK qualification. No protocol semantics, economic constants, V3 carrier, Reveal semantics, EEV authority, wallet signing, deployment, transaction submission, or Materios work was changed.

### Next gate
Map proposed public exports to existing canonical implementations and focused tests, then run the relevant CI against an exact SHA. In parallel, treat V08 as an architecture/contract gap—not as permission to import PRE-RICH expiry duration or equate the V3 transition with universal IMMORTAL.


## 45.33 AGENT B — SDK EXPORT MAP + EXACT-HEAD PORTABILITY PASS (2026-10-27)

- Exact tested HEAD: `74d37a0a27543546cb8e1254489af440f4b5032d`.
- Portability run [#40578528997](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40578528997) completed SUCCESS on that exact SHA. The `conformance` job passed `src/__tests__/immortal-portability-conformance.test.ts` and `src/__tests__/immortal-cardano-universal-boundary.test.ts`.
- Scope limit: bounded tests pass; V08 and V09 remain explicitly pending. This is not full portability certification and does not resolve the universal transition owner or the concrete `K_c) certificate.
- Added export → canonical implementation → existing test mapping in `docs/COORDINATION/IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md` (update commit `e5ce1e1968585e57c5a71696b25813ea7ae7b79a`).
- Candidate surfaces mapped: canonical state shape; Haskell universal reference kernel; versioned transition evidence; admission/evidence binding; Cardano execution adapter; observation/projection; portability vectors/reference runner; V3 transition (not universal); PRE-RICH Issue/USDM (Agent A-owned, not SDK core).
- Existing evidence/authentication limitation is explicit: digest-shaped strings and matching fields are not proof of transaction authenticity or fresh economic observation.
- No SDK package facade or runtime API was created; no protocol semantics, V3 carrier, Reveal, economic constants, EEV authority, wallet signing, deployment, transaction submission, or Materios work changed.

**Next gate:** exact-head focused CI for the existing adapter/evidence suites and a design decision for the universal lifecycle transition contract. Only then define package exports/API compatibility tests; do not turn pending V08/V09 into success by changing labels or adding synthetic fixtures.


## 45.34 AGENT B — EXACT-HEAD SDK/PROTOCOL CI RECHECK (2026-10-27)

The live working branch HEAD is `324bc48ffb1ae44853044fea1812628541cc2032` (`docs(coordination): record SDK export map and portability pass`). Fresh GitHub Actions results have now been polled for that exact SHA:

- [IMMORTAL Portability Conformance #40579659046](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579659046): **SUCCESS**.
- [Protocol Declaration Conformance #40579659067](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579659067): **SUCCESS**.
- [Cardano Adapter Sale Conformance #40579658987](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579658987): **SUCCESS**.
- [Documentation Link Check #40579659055](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579659055): **SUCCESS**.
- [Algorithmic Governability Adversarial Lab #40579659182](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40579659182): **SUCCESS**.

The earlier Cardano Adapter Sale run #40579636315 on the immediately preceding docs commit was cancelled; the newer run above completed successfully on the current HEAD and supersedes it for current-head evidence.

### Interpretation and next gate

This establishes that the listed workflow runs completed successfully on the exact current branch HEAD. It does **not** close V08 (universal lifecycle/expiry transition owner remains unresolved) or V09 (no instantiated, evidenced concrete `K_c` certificate); it is not full portability certification, not Preprod qualification, and not evidence that a real ticket has been issued or purchased. P2.8's native-ledger evidence remains scoped to the previously recorded exact artifact/local Yaci context.

No SDK facade or duplicate TypeScript kernel was introduced. No V3 carrier, Reveal semantics, economic constants, Agent A EEV/Issue authority, wallet signing, deployment, transaction submission, or paused Materios work was changed.

**STATUS: CURRENT-HEAD WORKFLOW SET GREEN; V08/V09 AND REAL PREPROD ISSUE/PURCHASE REMAIN OPEN.**


## 45.35 AGENT B — EXACT-HEAD CI GREEN + V08 CONTRACT OWNER REFINED (2026-10-28)

### Exact-head results

The branch head before this checkpoint update was `1b675e0c4c0a8dd6a61c158544872a67ef462426`. All five triggered workflows completed **SUCCESS** on that exact SHA:

- [IMMORTAL Portability Conformance #40580323631](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580323631).
- [Cardano Adapter Sale Conformance #40580323842](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580323842), both `economic-conformance` and `frontend-build` jobs green.
- [Protocol Declaration Conformance #40580323669](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580323669).
- [Algorithmic Governability Adversarial Lab #40580323684](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580323684).
- [Documentation Link Check #40580324022](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40580324022).

### V08: refine the gap, do not misstate it

The normative contract is present in `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md`: canonical `T(S,a,ω)`, authoritative/fresh input checks, complete post-state, separate state-local safety and certified-`K_c` viability, fail-closed rejection, atomic commit and history. What is not identified is a canonical **universal executable lifecycle/expiry owner** conforming to that contract.

- `PRE-RICH/onchain/PreRichLifecycleTransition.hs` is executable and tested, but specifically owns PRE-RICH regime transitions (`EnterQuiescent`, `MaintainQuiescent`) and QNE witness checks; it is not the universal ticket-expiry model.
- `IMMORTAL/kernel/EconomicTransitionV3.hs` owns profile-coupled Issue/Reveal/Claim/Expire, not a universal chain-neutral lifecycle contract.
- `plutus/test/PreRichLifecycleTransitionTest.hs` cannot discharge universal V08 by itself.

This is an architecture/ownership gap between normative `T` and a universal executable conformance owner—not an absence of normative intent. Keep V08 pending until the owner/contract mapping is decided and tested.

### Gate disposition

The exact-head workflows establish bounded CI success, not full portability closure. V08 and V09 remain open; V09 still needs an instantiated concrete `K_c) certificate and supporting evidence. No package facade or duplicate TypeScript kernel was created. No protocol semantics, economic constants, V3 carrier, Reveal, Agent A EEV/Issue authority, wallet signing, deployment, transaction submission, or Materios work changed.

The SDK cross-branch inventory records the exact-head runs and the refined V08 boundary: [IMMORTAL SDK cross-branch inventory](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md).

**STATUS: FIVE CURRENT-HEAD WORKFLOWS GREEN; V08 UNIVERSAL EXECUTABLE OWNER AND V09 CONCRETE CERTIFICATE REMAIN OPEN.**


## 45.36 AGENT B — SDK API CONTRACT PROPOSAL; NO FACADE IMPLEMENTED (2026-10-28)

### Coordination / exact-head context

Agent A's current work is distinct and must not be duplicated: the repo-wide checkpoint records a fresh read-only Preprod direct-USDM source observation and EV1–EV7 qualification at 04:08 UTC. Its evidence explicitly remains `deploymentApproval: null` / `deploymentApprovalStatus: PENDING`; it does not authorize Issue or discharge R1/`K_c`.

The five bounded CI workflows passed on exact SHA `6a71021404d1d0a354cbe2d948bffb84b3a54bac`. A new docs-only proposal was then committed as `7f2466fbcba1049e608541e61b369c0c554ad094`; CI for that newer head must be treated separately.

### Deliverable

Created [IMMORTAL SDK API Contract Proposal](IMMORTAL-SDK-API-CONTRACT-PROPOSAL-2026-10-28.md) and indexed it in the [SDK cross-branch inventory](IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md).

The proposal is explicitly **review draft, not approved API**. It defines candidate package ownership, a versioned evidence envelope, source/environment/assurance distinctions, compatibility/fail-closed rules and the required release gates. It does not create package code or change protocol semantics.

Important guardrails:
- `@immortal/core` is a proposed data-contract surface, not a duplicate TypeScript economic kernel; Haskell remains the reference authority.
- Cardano build, wallet signature, submission and observed ledger result remain separate phases.
- Evidence shape, source observation, profile qualification, deployment approval and ledger confirmation are separate assurance dimensions; proposed labels must be reconciled with existing normative vocabulary before implementation.
- V08 remains open because the universal executable transition/expiry owner is not mapped to normative `T`.
- V09 remains open pending a concrete, evidenced `K_c` certificate.
- Agent A's direct-USDM EEV qualification does not substitute for deployment approval or authoritative Issue admission.

No new branch, SDK facade, TypeScript kernel, wallet signing, deployment, transaction submission, economic change, V3/Reveal edit, or Materios work occurred.

**STATUS: REVIEWABLE SDK CONTRACT DRAFT COMMITTED; WAITING ON EXACT-HEAD DOC CI AND OWNER REVIEW BEFORE IMPLEMENTATION.**


## 45.37 AGENT B — PACKAGING BASELINE AUDIT (2026-10-28)

Read-only inspection of the root `package.json` and current tree adds a packaging constraint to the SDK proposal: the root manifest is the existing Vite application/operational project, and no root `pnpm-workspace.yaml` or `lerna.json` exists in the inspected tree. The proposed `@immortal/core`, `@immortal/adapter-cardano`, and `@immortal/conformance` names are logical ownership boundaries only, not existing packages.

Updated [SDK API contract proposal](IMMORTAL-SDK-API-CONTRACT-PROPOSAL-2026-10-28.md) and indexed the constraint in the [SDK inventory](IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md). Before implementation, the owner must choose between a non-published internal module and a separately scoped real package/workspace with build/export/dependency/version/release gates. No workspace migration or package facade was created.

Current exact-head CI is running on `92a8a90be1b84e3edc02d2895abde7d329eca3b0`; the docs link check is green, and the other four workflows were in progress/queued at last poll. Additional documentation-only commits have since triggered fresh workflows, so inspect the newest HEAD rather than assuming those results apply.

**STATUS: SDK API DRAFT REFINED WITH PACKAGING REALITY; NO RUNTIME/PACKAGE IMPLEMENTATION.**


## 45.38 AGENT B — ACTION FINGERPRINT BINDING + EXACT-HEAD CONFORMANCE (2026-10-28)

### Coordination and bounded fix

A read-only cross-check found a missing equality in `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts`: the bridge checked `actionClass`, the pre-state hash and the post-state hash, but did not compare `EconomicAdmissionWitness.actionFingerprint` with `CanonicalTransitionEvidence.actionFingerprint`.

The bridge now rejects an action-fingerprint mismatch before the adapter signing boundary. Regression coverage includes:
- a unit negative twin in `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.test.ts`;
- a CAES composition negative twin proving `signTx` and `submitTx` are not called on mismatch;
- an updated valid CAES fixture representing the completed Lucid transaction inputs required by the existing adapter;
- inclusion of `src/__tests__/caes-transition-closure.test.ts` in the Cardano Adapter Sale Conformance command.

### Validation

The relevant suite initially exposed an under-specified *test fixture*, not an adapter implementation failure: the CAES positive case passed a plain object where the adapter requires `toTransaction().body().inputs()`. The fixture was corrected to include the exact declared pool input.

All six bounded workflows below then passed on exact SHA `2ef5c425da9762931ee440ba22ed12d40d9a3d85`:
- [Cardano Adapter Sale Conformance #40631890587](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890587) — `economic-conformance` and `frontend-build`;
- [IMMORTAL Portability Conformance #40631890535](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890535);
- [Protocol Declaration Conformance #40631890534](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890534);
- [Algorithmic Governability Adversarial Lab #40631890649](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890649);
- [Documentation Link Check #40631890547](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890547);
- [PRE-RICH Direct-USDM Conformance #40631890559](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40631890559), an Agent A-owned path kept distinct from SDK work.

The fix proves equality binding only. It does not recompute or authenticate the fingerprint, prove ledger inclusion, qualify EEV, approve Issue, or discharge R1/`K_c`. V08 and V09 remain open, and the SDK API contract remains a draft. The Oracle State readiness/freshness changes committed by the parallel Agent A front are separate, were not duplicated, and were preserved.

No new branch was created. No V3 carrier, Reveal semantics, economic constants, wallet signing, deployment, transaction submission, or Materios work was changed.

**STATUS: ACTION-FINGERPRINT EQUALITY BINDING ADDED; CAES REGRESSION IN CI; SIX BOUNDED WORKFLOWS GREEN ON THE RECORDED EXACT SHA.**


## 45.39 AGENT B — PRODUCTION CALL-SITE AUDIT: CAES BINDING NOT YET WIRED INTO RUNTIME (2026-10-28)

### Precise scope of the fingerprint fix

A follow-up read-only call-site audit refines the interpretation of section 45.38:

- `assertEconomicAdmissionMatchesCanonicalEvidence` is exercised by `src/__tests__/caes-transition-closure.test.ts` and the unit tests. The production `CardanoExecutionAdapter.submitEconomic(...)` method does not accept `CanonicalTransitionEvidence` and does not invoke this binding.
- `src/preRichIssueAdmissionBridge.ts` contains `assertIssueAdmissionMatchesCanonicalEvidence`, and that function compares the Issue action fingerprint as well as pre/post-state fingerprints. The call-site search found its tests, but not use within the production `src/mint.ts` Issue submission path.
- The production Issue path still requires the existing authoritative admission via `obtainAuthoritativeIssueAdmission` and goes through `submitEconomic(..., 'Issue')`; other economic transitions likewise use `submitEconomic` without a `CanonicalTransitionEvidence` object.

So the new fingerprint-equality assertion and its negative twins establish the binding helper's intended behavior, and the CAES test is now in CI, but this evidence binding is **not yet an enforced universal production pre-sign gate**. The earlier section 45.38 must be read as test/helper contract closure, not proof of production call-site integration.

### Safe design next step

Separate the two timing domains:
1. a pre-sign transition-intent/admission binding carrying action class/fingerprint and canonical pre/post-state fingerprints, validated before wallet signing; and
2. a post-submit settlement/observation evidence record that binds the actual transaction reference and independently observed ledger result.

The current `CanonicalTransitionEvidence` requires a non-empty `transactionRef`; do not fabricate a placeholder or conflate a transaction prepared for signing with a submitted/ledger-observed outcome. Before changing the production adapter signature, map the canonical fingerprints actually produced for each of Issue/Reveal/Claim/Expire, decide schema ownership/versioning and fail-closed semantics, then add transition-specific regression tests proving mismatched action/state bindings stop before signing. Do not duplicate Agent A's Issue/EEV producer or change V3/Reveal semantics.

**STATUS: HELPER-LEVEL FINGERPRINT BINDING TESTED; PRODUCTION-WIRING GAP IDENTIFIED AND EXPLICITLY OPEN.**


## 45.40 AGENT B — PHASE-SEPARATED TRANSITION EVIDENCE CONTRACT DRAFT (2026-10-28)

The SDK API draft now records the newly confirmed runtime-wiring gap and a safe next design boundary.

### Contract refinement

The existing `CanonicalTransitionEvidence` object combines action/pre-state/post-state fingerprints with `transactionRef` but does not identify the reference's assurance phase. A candidate Cardano transaction ID may be derivable from a completed body before signature; that does not prove signature, submit acceptance, ledger inclusion or finality. We need phase-separated evidence semantics before runtime export:

1. **Pre-sign transition-intent/admission binding** — action class/fingerprint, pre-state and candidate post-state fingerprints, environment/profile and authoritative admission reference, validated before wallet authorization and bound to the actual transaction body by transition-specific checks.
2. **Submit/settlement observation evidence** — the adapter's actual submission receipt and independently observed chain result, with ledger inclusion/finality verified separately. Keep any precomputed candidate body ID explicitly labeled as a candidate, not as confirmation.

The API proposal was updated at [IMMORTAL SDK API Contract Proposal](IMMORTAL-SDK-API-CONTRACT-PROPOSAL-2026-10-28.md). It explicitly notes that the general and Issue-specific binding helpers are currently exercised by tests rather than wired into every production Issue/Reveal/Claim/Expire path; the existing `submitEconomic` signature does not receive the combined evidence object. The equality regression therefore proves helper behavior, **not universal runtime enforcement**.

### Disposition

Do not retrofit all transitions with a guessed evidence record, placeholder transaction reference or synthetic fingerprint. Before implementation, settle canonical fingerprint ownership/canonicalization, the pre-sign/post-submit schema split and the mapping between each action's witness and completed transaction inputs/outputs. Keep the current adapter input inspection and fail-closed behavior intact.

No package facade, protocol semantic change, economic constant change, V3/Reveal change, Agent A EEV/Issue authority change, wallet signature, deployment, transaction submission, new branch or Materios work was performed.

**STATUS: PHASE-SPLIT API DESIGN ADDED TO THE SDK DRAFT; PRODUCTION-WIRING GAP TRACKED; NO RUNTIME CHANGE.**


## 45.41 AGENT B — ACTION-FINGERPRINT PROVENANCE MATRIX (2026-10-28)

A source-level audit identified different roles for the action fingerprints currently in the repository:

- **Issue:** `PRE-RICH/onchain/PreRichIssueDecision.hs::produceIssueDecision` computes the decision fingerprint from the canonical Issue action plus the canonical pre-state and candidate post-state hashes. The Haskell provider transports it, and the production Issue builder places the admitted field in the V3 carrier redeemer.
- **Reveal:** `audit/cardano-integration/reveal-ledger-trace.ts` constructs a `hashJson` action fingerprint from the local-Yaci fixture's actual input references and Reveal/game/result fields.
- **Claim:** `audit/cardano-integration/claim-ledger-trace.ts` constructs a `hashJson` fingerprint from the fixture's prize/pool/wallet/oracle references and settlement/game fields.
- **Expire:** `audit/cardano-integration/expire-ledger-trace.ts` constructs a `hashJson` fingerprint from fixture input refs, ticket identity, price and expiry fields.

The Reveal/Claim/Expire formulas belong to observed local-Yaci audit traces; they are not current production pre-sign admission producers. The production `src/gameFlow.ts` functions accept `EconomicAdmissionWitness` and submit through the adapter, but this read-only audit did not find an application-level canonical fingerprint producer equivalent to the Haskell Issue decision.

The [SDK API Contract Proposal](IMMORTAL-SDK-API-CONTRACT-PROPOSAL-2026-10-28.md) now records a per-transition provenance matrix and a release gate for canonical fingerprint source ownership plus completed-transaction mapping. The helper equality regression remains helper-level; it does not close the production-wiring gap for all four economic actions.

**Guardrail:** never reuse the post-transition harness `hashJson` as a live pre-sign authorization fingerprint by assumption. Do not alter V3 or Reveal semantics; resolve fingerprint canonicalization and transition-specific transaction mapping before runtime integration. No code or economic rules changed.

## 45.42 AGENT B — PRODUCTION TRANSITION BODY MAPPING (2026-10-28)

A source-level transaction-body mapping audit has been added to the [SDK API Contract Proposal](IMMORTAL-SDK-API-CONTRACT-PROPOSAL-2026-10-28.md) and indexed in the [SDK cross-branch inventory](IMMORTAL-SDK-CROSS-BRANCH-INVENTORY-2026-10-27.md).

The matrix records the current production builders for Issue/Reveal/Claim/Expire: protocol spending inputs, reference inputs, application-declared outputs, existing pre-submit checks and unresolved evidence binding. The critical shared boundary is now explicit: `CardanoExecutionAdapter.submitEconomic` checks the declared protocol inputs are a subset of the completed transaction's spending inputs, but does not classify additional Lucid wallet/fee inputs, bind the complete output/datum/redeemer map to the admission witness, or accept a phase-specific pre-sign transition-intent binding.

Next safe gate before runtime changes:
1. canonical fingerprint producer/encoding ownership for each action;
2. reviewed input classification separating protocol state from legitimate wallet/fee balancing;
3. reviewed output/redeemer/validity predicates for each transition;
4. split pre-sign intent/admission from post-submit/observed-ledger evidence, then wire and test fail-closed composition.

This is a source audit and design map, not a claim that the runtime currently enforces full transition-to-transaction binding. No runtime code or protocol semantics changed, and no work was duplicated from Agent A's Oracle/EEV front. V08/V09 remain open.

**STATUS: TRANSITION-BODY MAP RECORDED; PRODUCTION-WIRING DESIGN GAP MADE ACTIONABLE; NO RUNTIME/API SIGNATURE CHANGE.**


## 45.43 AGENT B — PRE-SIGN SPENDING-INPUT MUTATION GUARD (2026-10-28)

### Change

A focused race-hardening guard was added to `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`. The actual spending-input references read from the completed Lucid body are returned from classification; after the potentially asynchronous wallet UTxO lookup, the adapter re-reads the body immediately before calling the signing port. If the ordered input references differ, economic submission rejects before both signing and submission.

A regression in `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts` mutates the body input set during the wallet-listing await and verifies `signTx` and `submitTx` are never called.

### Validation and limits

[Cardano Adapter Sale Conformance #40739908010](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40739908010) ran on exact SHA `201eb0d660b5e9d3be720ffed8e2b4f9c2490ec5`; `economic-conformance` and `frontend-build` both passed.

This closes only the spending-input mutation window between classification and signing. It does not bind outputs, datums, redeemers, mint/burn, fees or validity fields to a reviewed transition intent, nor does it freeze the transaction object. V08/V09 and R1/`K_c` remain open. No fingerprint formula, economic rule, V3 carrier, Reveal semantics, Agent A Oracle/EEV producer, wallet signature, deployment or ledger submission was changed. No branch was created.

**STATUS: INPUT-SET RECHECK BEFORE SIGNING TESTED; FULL COMPLETED-BODY BINDING REMAINS OPEN.**



## 45.44 AGENT B — EXACT-HEAD COMPLETED-BODY INTEGRITY RECONCILIATION (2026-11-01)

### Exact source snapshot

Read the live branch ref before this audit:
- Branch: `work/immortal-green-closure`
- HEAD: `54483646cacad2d5705eb1389ca59683dfe78bb3`

The exact-HEAD source audit refines the narrower wording in sections 45.42–45.43 and SDK proposal §11.9:

- `submitEconomic` captures the exact completed CML transaction serialization and exact transaction-body serialization before the asynchronous connected-wallet UTxO classification.
- After that await, it re-reads actual spending-input references and the exact full transaction serialization immediately before calling the signing port. Any difference rejects before signing/submission.
- After signing, it reads the signed transaction body serialization and requires byte-for-byte equality with the pre-sign body snapshot before submission.
- Additional spending inputs are classified against the selected wallet's UTxO listing; caller-declared protocol inputs must exist in the actual body.

Therefore the current runtime has a stronger **completed-body mutation/integrity guard** than the input-reference-only description in §45.43 / SDK proposal §11.9. Those historical notes should not be read as saying that only the input list is rechecked at the current HEAD.

### What this does not close

This is still not semantic transaction-to-intent conformance:

- The adapter does not decode and classify every input/reference-input by approved transition role.
- It does not prove that the completed outputs, addresses, values, datums, redeemers, mint/burn, fee or validity fields are the exact semantic realization of the admitted Issue/Reveal/Claim/Expire transition.
- `CanonicalTransitionEvidence` remains a settlement/evidence record requiring a non-empty `transactionRef`; it is not a pre-sign intent record.
- `assertEconomicAdmissionMatchesCanonicalEvidence` remains a helper/test boundary and is not called by production `submitEconomic`.
- The production Issue builder submits through `submitEconomic` with authoritative Issue admission, but the inspected production path does not invoke `assertIssueAdmissionMatchesCanonicalEvidence`.
- Issue retains its Haskell decision fingerprint producer; Reveal/Claim/Expire still have no approved production pre-sign fingerprint producer. Do not promote local-Yaci `hashJson` trace values.

### Cross-source reconciliation

The Notion T2 specification continues to require ledger-verifiable, fail-closed economic transitions and explicitly separates specification from evidence of closure. The current Notion operational bridge page (last fetched 2026-10-31) remains OPEN for operational DApp→Adapter conformance. The Decision Register page fetched for this audit is a historical 2026-10-07 snapshot; it is not evidence that current adapter/runtime gates are closed.

A Notion connected-workspace search for corroborating GitHub/Slack decisions was unavailable because that connector requires a Business plan. The Notion page search/fetch and exact-branch GitHub inspection were still completed; no missing connected-source result is inferred.

### Safe disposition

No runtime/API change is authorized by this audit. Keep the exact-body integrity guard intact. The next implementation gate remains maintainer approval of (1) canonical producer/canonicalization provenance per action, (2) versioned semantic body predicates per transition, and (3) the phase-separated pre-sign intent versus post-submit/observed-ledger evidence contract. Then add positive/negative twins proving every semantic mismatch stops before signing. Do not change V3, Reveal semantics, economic policy, Agent A EEV/Issue authority or Agent C Materios work.

**STATUS: EXACT-BODY INTEGRITY VERIFIED AT LIVE HEAD; SEMANTIC TRANSITION-TO-BODY BINDING, V08/V09 AND R1/K_c REMAIN OPEN. NO RUNTIME CHANGE.**



## 45.45 AGENT B — EXPIRY TRANSITION PROFILE / NORMATIVE-ONCHAIN DRIFT (2026-11-01)

### Exact source snapshot

- Branch: `work/immortal-green-closure`
- Source HEAD audited: `cc8b43c84c84de59a91ae1b9c63138856c00ec79`
- `plutus/PrizeValidator.hs` blob: `2455f8283d87ff74a94b1b8bca1d1f96d60ae8b2`
- `plutus/B1PrizePool.hs` blob: `106368b510a52447aa3de7ce951cf615466fc5e8`
- `src/gameFlow.ts` blob: `cab3f9d1c7c971b4127f9ae61d1477dc93454fd9`

### Normative source reconciliation

The Notion **09 — Definitive Decision Register**, D-09 expiry section, records expiry as CLOSED semantically and describes these cases:
1. UNRESOLVED → EXPIRED: release exactly the unresolved reserve; no liability/claim.
2. REVEALED LOSS → EXPIRED: close the remaining economic state; no claim.
3. CLAIMABLE WIN → EXPIRED: release the unclaimed crystallized liability; no later payment or recreated claim.
4. UNRESOLVED → HISTORICAL_REVEALED, if the historical policy is enabled: historical information only; no pending winning liability and no claimability.

The same register states that after `expiresAt` no transition may create/reactivate a claim, liability or payment obligation. T2 v0.1 §G3 describes EXPIRE primarily for an unresolved ticket; §G4 separately permits a late historical reveal only with zero economic effect. T2 is narrower in its EXPIRE examples than D-09.

### Exact implementation observed

- `PrizeValidator.validateExpire` requires `pdStatus == Pending`, `pdPrizeAmount == 0`, and beacon status Pending or Ready. It requires zero continuing Prize outputs and `txInfoValidRange` lower bound at/after `pdExpiresAt`.
- `B1PrizePool`'s `TicketExpired` branch independently requires the consumed PrizeDatum status Pending and payout zero, then releases exactly `pdPriceUsdm` from unresolved reserve and decrements unresolved count.
- `validateClaim` requires its validity upper bound at/before expiry.
- `validateReveal` also calls `claimBeforeExpiry`; therefore current on-chain Reveal rejects after-expiry Reveal entirely. This is fail-closed and does not create a late-reveal liability, but it does not implement the optional historical-only record described by D-09/T2.
- The production `gameFlow.ts` Expire builder assembles the Pending-ticket path; its PrizePool continuation is built by releasing the ticket price and decrementing unresolved count.

### Conformance finding

**Confirmed implementation/profile gap — not a proposed semantic change.** The current on-chain Expire path only closes Pending/unrevealed tickets. It has no path for a Revealed Loss or a Revealed Win whose crystallized liability remains unclaimed at expiry. Because Claim's validity range must end by expiry, a Revealed Win that remains unclaimed past expiry cannot use Claim; because Expire rejects non-Pending status and non-zero payout, it cannot use the current Expire path either. This is a potential stranded-liability / incomplete expiry-finality implementation relative to D-09.

The current builder and validators are mutually aligned for the Pending-only path; changing only one of them would be unsafe. Any implementation must be a separately reviewed, atomic cross-validator transition with exact pool accounting and adversarial tests. Do not improvise output datums, status transitions, payout/liability deltas or beneficiary rules.

### Safe disposition

- Do not modify `PrizeValidator.hs`, `B1PrizePool.hs`, `gameFlow.ts`, V3 or Reveal in this pass.
- Do not claim expiry conformance is complete from the Pending-only tests.
- Ask protocol governance/maintainers to confirm whether D-09's REVEALED LOSS / CLAIMABLE WIN expiry cases remain the operative canonical requirements and whether historical-only Reveal is enabled. The Decision Register says expiry semantics are CLOSED; this is a conformance implementation question, not authority to reopen the economic policy.
- After confirmation, define a single reviewed transition profile across PrizeValidator, B1PrizePool, builder and evidence tests; add positive/negative twins for Pending, Revealed Loss, Revealed Win unclaimed, Claim-before-expiry, Claim-at/after-expiry, and late historical reveal. Keep the exact current body-integrity guard.
- The SDK proposal §11.4 currently describes Expire as Pending-only. Mark that row as a current implementation snapshot, not proof of full D-09 coverage.

**STATUS: PENDING-ONLY EXPIRE PATH VERIFIED; D-09 REVEALED-LOSS / UNCLAIMED-WIN EXPIRY CONFORMANCE NOT IMPLEMENTED IN THE INSPECTED PATH. NO RUNTIME CHANGE.**

## 45.46 AGENT B — EXPIRY TEST-WIRING / LEDGER-TRACE SCOPE AUDIT

**Exact source HEAD:** `bd85c7a43a9e207116a5e8b70fe921a4b78b6c14`.

### Dedicated expiry workflow coverage

`.github/workflows/pre-rich-expiry-conformance.yml` currently runs only:

- `src/__tests__/preRichExpiryEvidence.test.ts`
- `src/__tests__/preRichExpiryPolicy.test.ts`

Its push path filter also watches only the Evidence/Policy modules and tests. It does **not** include:

- `PRE-RICH/src/PreRichExpireRefinement.ts`
- `src/__tests__/preRichExpireRefinement.test.ts`

Therefore the dedicated expiry workflow does not independently execute the ticket→aggregate Expire refinement test. The test may be exercised by broader workflows, but that is not established by this workflow definition. The workflow also has no `workflow_dispatch` trigger in the inspected source.

### Ledger trace scope

`audit/cardano-integration/expire-ledger-trace.ts` explicitly describes a Yaci/Cardano trace for an expired **Pending** PrizeDatum. Its fixture uses a test seed, synthetic Oracle State identity, and local Yaci API; the source itself disclaims live/authoritative Oracle evidence. It is not evidence for Revealed Loss or unclaimed Revealed Win expiry.

The Aiken parity proof `poc/aiken-reveal-parity/lib/immortal/expire_transaction.ak` also mirrors the existing Pending-only EXPIRE predicate and exact unresolved reserve/count release. It is not a second implementation of the broader D-09 expiry matrix.

### Exact on-chain predicate confirmation

At this HEAD, `plutus/PrizeValidator.hs` lines 731–799 document and enforce Pending-only expiry: consume one Prize input, produce no continuing Prize output, require Pending status, BeaconPending/BeaconReady, zero prize amount, expiry reached, and exact PrizePool reserve/count accounting. `plutus/B1PrizePool.hs` independently enforces the matching Pending-only TicketExpired transition.

### Result / boundary

- Pending EXPIRE: source-aligned across PrizeValidator, B1PrizePool, DApp builder, Aiken parity and existing ticket-level refinement.
- Dedicated expiry workflow: does not currently include the ExpireRefinement test.
- Revealed Loss / unclaimed Revealed Win expiry: no implementation or ledger-trace evidence found in these paths.
- No runtime, validator, V3, Reveal, or economic-policy changes made.

This entry is operational evidence only. It does not amend the canonical expiry semantics or decide how D-09's broader cases should be implemented. Any implementation proposal must preserve the current Pending transition and be reviewed as an atomic PrizeValidator/B1PrizePool/DApp/test change.

## 45.47 AGENT B — D-09 MATRIX + EXPIRY WORKFLOW WIRING (2026-11-01)

### D-09/T2 test design

Added `docs/COORDINATION/PRE-RICH-D09-EXPIRY-CONFORMANCE-MATRIX-2026-11-01.md`.

The matrix keeps the sources separate:

- D-09 enumerates unresolved expiry, revealed-loss expiry, unclaimed crystallized-win expiry, and optional historical reveal.
- T2 §G3 specifies the unresolved EXPIRE path and its ledger-verifiable accounting.
- T2 §G4 specifies late reveal as `EXPIRED + LATE_REVEAL -> EXPIRED` with zero economic effect.
- Historical reveal remains conditional; no source inspected here establishes that the application profile has enabled it.

The matrix defines positive assertions and negative twins for E1–E4, plus expiry-boundary, duplicate, post-claim, post-expiry claim, late LOSS/WIN, attempted late-WIN claim, concurrency, and malformed-accounting cases. It distinguishes reference-model, validator, local-ledger and Preprod evidence. It does not invent E2/E3 pool deltas or an E4 implementation.

### Dedicated expiry workflow wiring

Updated `.github/workflows/pre-rich-expiry-conformance.yml` to:
- include `PreRichExpireRefinement.ts` and `preRichExpireRefinement.test.ts` in both push and pull-request path filters;
- use the actual `src/__tests__` paths for both event types;
- execute Evidence, Policy and ExpireRefinement test files in the dedicated job.

**Exact workflow run evidence:**
- Run #41271499613 — [PRE-RICH Expiry Refinement Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41271499613)
- Run HEAD: `63b06ff9ab56cfea026d8df0f9b585bb5fa27abb`
- Job `expiry`: completed `success`; install and test command steps both succeeded.

This run proves the three existing test files pass with the corrected workflow wiring. It does not prove D-09 E2/E3 validator conformance or E4 historical-mode behavior.

### Source/implementation boundary

At the inspected implementation:
- E1 Pending expiry remains the only implemented on-chain EXPIRE case.
- E2 Revealed Loss and E3 unclaimed Revealed Win are not implemented in the inspected PrizeValidator/B1PrizePool/DApp path.
- E4 historical reveal is conditional in D-09/T2; the current Reveal validator rejects after-expiry Reveal and no historical-mode enablement was verified.
- No validator, gameFlow, V3, Reveal semantics, or economic policy code changed.

### CI at matrix-doc HEAD

At HEAD `4aade8a88be8b5deab1846762f3be49ebdbf45dd`, Documentation Link Check and Algorithmic Governability Adversarial Lab were success; Cardano Adapter Sale, Protocol Declaration, IMMORTAL Portability and Flux Point DoD Pilot were still queued/in progress at the time of this checkpoint update. Do not transfer these outcomes to a subsequent checkpoint-only commit.

**STATUS: EXISTING EXPIRY REFINEMENT TEST NOW RUNS IN ITS DEDICATED WORKFLOW; D-09 MATRIX DOCUMENTED; BROADER ON-CHAIN EXPIRY CONFORMANCE REMAINS OPEN. NO RUNTIME CHANGE.**

## 45.48 AGENT B — NOTION SOURCE VERIFICATION METADATA QUALIFICATION

The Notion connector returned `verification.state = unverified` for both:
- `09 — Definitive Decision Register`
- `T2 — Transition Conformance Specification v0.1`

The retrieved page contents were readable and supplied the D-09 / G3 / G4 text mapped in §45.47 and in `PRE-RICH-D09-EXPIRY-CONFORMANCE-MATRIX-2026-11-01.md`. However, the pages were not marked verified by Notion metadata at retrieval time. Their content must not be described as formally Notion-verified. The test matrix is engineering analysis, not normative approval.

Before implementation of E2/E3/E4, obtain maintainer/governance confirmation of the canonical applicable expiry source and whether historical-only Reveal is enabled. This does not reopen expiry semantics or authorize changing the protocol rules; it establishes the authority and profile configuration for conformance work.

**STATUS: SOURCE TEXT RETRIEVED; NOTION VERIFICATION STATE UNVERIFIED; IMPLEMENTATION AUTHORIZATION NOT INFERRED.**

## 45.49 AGENT B — E2/E3 REVEALED EXPIRY DATUM/REDEEMER RECONSTRUCTION

### Exact implementation snapshot

Source inspected at branch HEAD `3f8ceecf3da856248bf3a740fd3a8dcb300b157d`:
- `plutus/Types.hs` — PrizeDatum / PrizeStatus / PrizeAction / B1PrizePoolDatum / B1PrizePoolAction.
- `plutus/PrizeValidator.hs` — Reveal, Claim, Expire, time predicates.
- `plutus/B1PrizePool.hs` — TicketRevealed, TicketClaimed, TicketExpired.
- `src/gameFlow.ts` — revealPrize, claimPrize, expirePrize.
- `IMMORTAL/kernel/EconomicKernel.hs` — reserve/liability delta definitions.

Design reconstruction: `docs/COORDINATION/PRE-RICH-E2-E3-EXPIRE-TRANSITION-PROFILE-2026-11-01.md`.

### Existing schema/redeemer capacity

Existing `PrizeDatum` already carries `pdStatus`, `pdPrizeAmount`, `pdPriceUsdm`, and `pdExpiresAt`. Existing pool datum separately tracks unresolved reserve, unresolved ticket count and pending liabilities.

Existing redeemer constructor indices can be reused:
- `PrizeAction.Expire`: constructor index 3.
- `B1PrizePoolAction.TicketExpired`: constructor index 4.

E2/E3 do not inherently require a new datum field, a new `PrizeStatus` constructor, or new redeemer constructor. Current expiry consumes the PrizeDatum and leaves the NFT independently held.

### Accounting reconstructed from existing code

Reveal already:
- releases ticket price (P) from unresolved reserve (`reserveRevealDelta(P) = -P`);
- decrements unresolved ticket count;
- adds `max(0, pdPrizeAmount)` to pending liabilities;
- leaves total liquidity unchanged.

Therefore:
- **E2 Revealed Loss (`pdPrizeAmount == 0`):** expiry consumes the PrizeDatum; pool accounting fields remain unchanged. The unresolved reserve/count must not be decremented again.
- **E3 Revealed Win (`pdPrizeAmount = W > 0`):** expiry consumes the PrizeDatum; pending liabilities decrease exactly by (W), while total liquidity, unresolved reserve and unresolved count remain unchanged. No owner payment occurs; unlike Claim, physical liquidity is not reduced.

### New blockers identified

1. B1 `TicketExpired` has an unconditional `ppUnresolvedTicketCount > 0` precondition. This cannot be imposed on E2/E3 because Reveal has already decremented the count for that ticket; it can legitimately be zero when no other unresolved tickets remain.
2. B1 `TicketExpired` validates datum accounting but does not explicitly compare the physical Pool input `TxOut.value` with the continuing Pool output value. The singleton-NFT check does not prove that USDM/ADA pool assets were preserved. Builder behavior passing through the original assets is not an on-chain guarantee. Exact physical value preservation must be enforced for E1 as well as E2/E3, absent a separately reviewed canonical exception.
3. Claim validity uses finite upper bound `<= expiresAt`; Expire uses finite lower bound `>= expiresAt`. Both helpers ignore interval-closure flags. Equality therefore satisfies both time predicates; the two transactions conflict on the same Prize UTxO, but boundary tests must make the chosen equality convention explicit. Do not alter either comparator without canonical authorization.
4. E4 is separate: current Expire consumes the PrizeDatum, and PrizeStatus has no Expired constructor. A post-expiry historical reveal cannot update that consumed datum. If historical mode is confirmed enabled, it requires a persistent non-economic history representation. Historical-mode enablement remains unconfirmed.

### Required coordinated implementation profile

- PrizeValidator must preserve the current Pending branch and add state-specific Revealed expiry validation.
- B1PrizePool must reuse TicketExpired and branch on the consumed PrizeDatum: Pending release as today; Revealed Loss no accounting delta; Revealed Win exact pending-liability release only.
- B1 must verify the matching pool datum deltas and physical pool value preservation on-chain.
- DApp `expirePrize` must build Pending, Revealed-Loss and Revealed-Win cases without using unresolved reserve/count for already-revealed tickets.
- Add positive/negative twins against both validators together, then local-ledger and Preprod evidence.
- E4 remains excluded until historical-mode activation and its retained-history shape are confirmed.

No runtime code, datum schema, redeemer ABI, V3, Reveal semantics or economic policy changed in this audit.

**STATUS: E2/E3 ACCOUNTING MAPPED TO EXISTING DATUM/REDEEMER SHAPES; CURRENT PENDING-ONLY IMPLEMENTATION AND PHYSICAL POOL-VALUE PRESERVATION GAP REMAIN OPEN. NO RUNTIME CHANGE.**

## 45.50 AGENT B — E2/E3 STATE-AWARE EXPIRE IMPLEMENTATION (2026-11-01)

### Exact branch state

- Branch: `work/immortal-green-closure`
- HEAD at this checkpoint: `073c9b5f2390da1cfd8c797ce8f38896c577dfcd`
- E2/E3 transition profile: `docs/COORDINATION/PRE-RICH-E2-E3-EXPIRE-TRANSITION-PROFILE-2026-11-01.md`
- Existing datum ABI and redeemer constructor indices are unchanged.

### Runtime changes

- `PRE-RICH/src/PreRichExpireAccounting.ts`: pure deterministic accounting helper; Pending releases exact price reserve/count, Revealed Loss has zero pool accounting delta, Revealed Win releases only the unclaimed crystallized liability.
- `src/gameFlow.ts::expirePrize`: selects Pending/Revealed from PrizeDatum, validates beacon lifecycle and derives pool fields using the helper.
- `plutus/PrizeValidator.hs::validateExpire`: retains Pending path and adds Revealed Loss/Win predicates. Pool continuation accounting must match the selected lifecycle case.
- `plutus/B1PrizePool.hs::TicketExpired`: independently enforces matching Pending/Revealed deltas; no longer applies unresolved-count-positive to Revealed tickets; requires exact physical Pool input/output Value equality.
- `plutus/Types.hs`: lifecycle comments updated. No new PrizeStatus or redeemer constructor.
- `audit/cardano-integration/expire-ledger-trace.ts`: supports Pending, Revealed Loss and Revealed Win fixtures with unique ticket names; Revealed fixtures are synthetic post-Reveal state fixtures.
- `.github/workflows/immortal-cardano-lab.yml`: preserves the existing Aiken V3 Pending trace and adds three separate Haskell V2 EXPIRE traces, one per state.

### Bounded test evidence

- Dedicated expiry workflow #41272261739: success — **4 test files, 34 tests passed** (Evidence, Policy, existing ExpireRefinement, new ExpireAccounting).
- Cardano Adapter Sale #41272640593 at source HEAD: success (frontend build + economic conformance).
- Protocol Declaration #41272640587: success.
- Documentation Link Check #41272640613: success.
- Algorithmic Governability #41272640658: success.
- IMMORTAL Portability #41272640629: success.
- C13 Cardano Semantic #41272640663: success.
- PRE-RICH Emulator Reveal #41272640601, IMMORTAL Haskell Semantic #41272640621, IMMORTAL Cardano Integration Lab #41272640643, Flux Point #41272640640 and other triggered gates were still in progress when this checkpoint was written.

The Cardano Integration Lab is configured to generate fresh Haskell validators and evaluate the three Haskell V2 EXPIRE fixtures on local Yaci. **No E2/E3 Yaci acceptance result is claimed until those exact steps complete.** Synthetic revealed pre-states prove only the expiry transition from the provided datum/pool pre-state; they are not an end-to-end Reveal execution or Preprod evidence.

### Remaining boundaries

- E1 Pending remains supported and its accounting is preserved.
- E2 Revealed Loss releases no reserve and no liability.
- E3 unclaimed Revealed Win releases exactly its outstanding liability, with physical pool liquidity and reserve/count unchanged.
- The physical B1 PrizePool Value is now checked on-chain for TicketExpired, including E1.
- E4 historical-only Reveal remains excluded until activation and retained-history representation are confirmed.
- No V3, Reveal, Issue/EEV, Agent C/Materios, or economic policy changes.

**STATUS: E2/E3 IMPLEMENTATION PRESENT; 34 UNIT/ACCOUNTING TESTS PASS; TYPESCRIPT/FRONTEND AND SELECTED CI GATES GREEN; HASKELL COMPILE + THREE-CASE YACI LEDGER EVIDENCE PENDING. DO NOT MARK EXPIRY FULLY CLOSED.**

## 45.51 AGENT B — EXPIRE YACI SIZE BLOCKER AND REFERENCE-SCRIPT REMEDIATION (2026-11-01)

### Failed ledger attempt — exact evidence

- Integration Lab run #41272640643 at source snapshot `1f7fd281de2b9e4b226e43213e2f77997713e271`: [run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41272640643).
- Aiken V3 economic Reveal and Aiken V3 economic Expire both completed successfully.
- Haskell V2 Pending EXPIRE failed during Lucid transaction construction: `Max transaction size of 16384 exceeded. Found: 16540`.
- Haskell V2 Revealed Loss and Revealed Win steps were skipped because the sequential workflow stopped at the Pending step.
- This was a builder size-limit failure before submission. It is not a Plutus validator rejection, a Yaci ledger failure, or evidence that E2/E3 accounting predicates are invalid.

### Root cause and bounded correction

The expiry trace had already published the Prize and B1PrizePool validators as reference scripts and included their UTxOs in `readFrom`, but then also called `.attach.SpendingValidator(...)` for both validators. This reattached full scripts as transaction witnesses and defeated the reference-script path.

- Commit `19a29705e7ccf1c437cc74a0eaa2bb23611204fb`: [fix(cardano): spend EXPIRE through reference scripts](https://github.com/LiberoNuvola/Immortal-Protocol/commit/19a29705e7ccf1c437cc74a0eaa2bb23611204fb).
- Changed only `audit/cardano-integration/expire-ledger-trace.ts`: removed both inline SpendingValidator attachments and documented that the `readFrom` reference inputs provide the spending scripts.
- This matches the reference-script construction already used in `audit/cardano-integration/claim-ledger-trace.ts`.
- No validator logic, datum/redeemer ABI, economic accounting, V3, Reveal semantics, EEV, or Materios changes.

### Verification after correction

- New Integration Lab run #41273799510 at exact source commit `19a29705e7ccf1c437cc74a0eaa2bb23611204fb`: [run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41273799510).
- At checkpoint update time, dependencies and cache restore had passed and `Setup canonical Plutus CI` was in progress.
- Aiken V3 Expire and all three Haskell V2 EXPIRE traces had not yet been reached. No post-fix size or ledger PASS is claimed.
- Separate Haskell Semantic Conformance run #41272640621 remained in progress at `Beacon commitment cross-language conformance`; it is not expiry ledger evidence.

**STATUS: REFERENCE-SCRIPT BUILDER CORRECTED; POST-FIX YACI VALIDATION PENDING. E2/E3 MUST REMAIN OPEN UNTIL THE EXACT HASKELL V2 PENDING, REVEALED LOSS AND REVEALED WIN STEPS COMPLETE.**

## 45.52 AGENT B — EXPIRE CML REFERENCE WITNESS PROBE (2026-11-01)

### Exact code snapshot

- Branch: `work/immortal-green-closure`
- Source commit: `fc42cac5d6c6cceab614cebd12d88f8a5925e770`
- Changed file: `audit/cardano-integration/expire-ledger-trace.ts`
- The trace temporarily routes only the PrizeValidator and B1PrizePool script hashes already present in the two `readFrom` reference UTxOs through `CML.PlutusScriptWitness.new_ref(hash)`.
- It asserts that both expected hashes were actually routed through the reference-witness constructor and restores the original `new_script` method in a `finally` block.
- All other script hashes retain Lucid's original constructor path.
- This is a bounded integration-harness compatibility probe. It does not change the production adapter, Plutus validator code, datum/redeemer ABI, accounting semantics, Reveal, V3, EEV or Materios.

### Why this probe exists

The previous two attempts both failed in Lucid transaction construction at 16,540 bytes, before submission. Removing the explicit `.attach.SpendingValidator(...)` calls did not change the measured size. The next experiment explicitly selects CML's reference-script witness representation for the two known reference-backed validator hashes, instead of assuming that `readFrom` alone produced a reference witness in the final transaction.

### Verification status

- New Integration Lab run #41280038100: [run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41280038100).
- Exact head at run start: `fc42cac5d6c6cceab614cebd12d88f8a5925e770`.
- At checkpoint time: project dependency install and Cabal cache restore passed; `Setup canonical Plutus CI` was in progress.
- Aiken V3 Reveal/Expire and Haskell V2 Pending / Revealed Loss / Revealed Win had not yet been reached.
- No transaction-size reduction, Yaci acceptance, or E2/E3 ledger PASS is claimed at this checkpoint.

**STATUS: EXPLICIT CML REFERENCE-WITNESS PROBE COMMITTED; YACI VERIFICATION PENDING. KEEP E1/E2/E3 OPEN UNTIL THE THREE HASKELL V2 EXPIRE TRACE STEPS PASS.**

## 45.53 AGENT B — CML REFERENCE WITNESS HASH-INTERCEPTION DIAGNOSTIC (2026-11-01)

### Completed evidence at source commit fc42

- Integration Lab run #41280038100: [run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41280038100).
- Aiken V3 economic EXPIRE completed successfully on local Yaci. The log records `CML.new_ref` for both expected Aiken Prize and B1PrizePool script hashes, with `inlineFallbackForExpectedScripts=false`; the trace confirms transaction submission, pool continuation, ticket NFT retention and replay rejection.
- The separate Haskell V2 Pending EXPIRE step failed before submission in Lucid/CML transaction completion: `Max transaction size of 16384 exceeded. Found: 16540`. Haskell V2 Revealed Loss/Win were skipped.
- The `expireReferenceWitnesses` summary from that run belongs to the successful Aiken V3 trace. Because the Haskell builder failed before the helper's post-completion summary, that summary alone did not establish whether the Haskell script hash interceptions occurred.
- Earlier Haskell unit/accounting conformance remains green; this is a transaction-builder size failure, not a typed on-chain validator rejection.

### Diagnostic-only follow-up

- Commit `2c2c23360dd77614399cf3b9208b27261dc2e8ce` adds a log at the exact point inside the temporary CML `new_script` interception, recording each matched hash and script byte length before calling `CML.PlutusScriptWitness.new_ref(hash)`.
- The purpose is to distinguish (a) an expected Haskell validator hash not being intercepted from (b) both Haskell witnesses being converted but another component of the provisional transaction still exceeding 16,384 bytes.
- No validator, ABI, accounting logic, datum/redeemer, production adapter, V3 or Reveal code changed.

### Verification after diagnostic

- New Integration Lab run #41281081359: [run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41281081359).
- Exact head: `2c2c23360dd77614399cf3b9208b27261dc2e8ce`.
- At checkpoint update time, the workflow had passed initial project dependency setup and was still preparing the isolated lab.
- No post-diagnostic Haskell hash-interception or ledger result is yet available.

**STATUS: Aiken V3 EXPIRE PASS; HASKELL V2 PENDING STILL BLOCKED BY 16,540-BYTE BUILDER SIZE. EXACT HASKELL HASH-INTERCEPTION DIAGNOSTIC COMMITTED; RE-RUN PENDING. KEEP E1/E2/E3 ON-CHAIN CONFORMANCE OPEN.**

## 45.54 AGENT B — LUCID SCRIPT REGISTRY AND REFERENCE WITNESS SEPARATION (2026-11-01)

### Refined API distinction

The EXPIRE integration harness must keep two separate Lucid responsibilities:
1. `attach.SpendingValidator(script)` registers the script by hash in Lucid's `config.scripts` map, allowing `collectFrom` to resolve the validator for a script-address input.
2. The CML witness representation controls whether the validator body is serialized inline or represented as a reference witness.

The bounded CML wrapper converts the two expected `PlutusScriptWitness.new_script(script)` calls into `PlutusScriptWitness.new_ref(hash)`. Thus restoring the two attach calls is required for Lucid script lookup; with the CML conversion in place, the intention is not to add the full validator body to the spending witness set.

This corrects the earlier over-broad removal of `.attach.SpendingValidator(...)`. That call's script-registry role must not be confused with the serialized witness form.

### Code change

- Commit `7049da9ccb11d07688d5493e07b3733514e99a6a`: [fix(cardano): register EXPIRE scripts before reference spends](https://github.com/LiberoNuvola/Immortal-Protocol/commit/7049da9ccb11d07688d5493e07b3733514e99a6a).
- In `audit/cardano-integration/expire-ledger-trace.ts`, both spending validators are registered after `readFrom` and before `collectFrom`.
- The CML hash-targeted `new_ref` wrapper and immediate per-hash diagnostic remain active.
- No production validator, ABI, economic logic, or V3/Reveal/EEV/Materios code changed.

### Run disposition

- The diagnostic Lab #41281081359 at commit `2c2c23360dd77614399cf3b9208b27261dc2e8ce` was cancelled by a subsequent push before it reached the EXPIRE steps. It produced no Haskell reference-witness interception result.
- New Lab #41281283622 is running at the exact code commit `7049da9ccb11d07688d5493e07b3733514e99a6a`: [run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41281283622).
- At checkpoint update time, it had completed checkout and Setup Node and was installing project dependencies. The EXPIRE steps had not started.

**STATUS: LUCID SCRIPT REGISTRY RESTORED; CML REFERENCE WITNESS PROBE RETAINED. NO POST-FIX SIZE OR HASKELL YACI RESULT YET. KEEP E1/E2/E3 ON-CHAIN CONFORMANCE OPEN.**



## 45.55 AGENT A PRIORITY ORDER — FIRST OWNER-PURCHASED PREPROD TICKET + SCIENTIFIC PAPER (2026-11-02)

The Agent A mandate and ownership are unchanged. This is a sequencing decision only; it does not reassign fronts, change other agents' work, or alter economic/technical semantics.

**Primary execution outcome:** the first real PRE-RICH ticket on Cardano Preprod, purchased by the project owner through their own connected wallet after the existing authoritative admission gates are satisfied.

**Parallel research outcome:** a defensible scientific paper on IMMORTAL/PRE-RICH, grounded in canonical semantics, reproducible implementation evidence, prior-art review, and the real Preprod case study only after it exists.

### Agent A priority sequence

1. Exact live Preprod deployment perimeter and identifiers; no fixture/stale identifier inference.
2. Revalidate direct-USDM EEV against the exact current B1 Pool UTxO; separately trace TicketIssued settlement/funding.
3. Complete PA1–PA7 and item-level ProtectedCapital source completeness, provenance, disjointness, and same-snapshot reconciliation.
4. Bind EEV, ProtectedCapital, V3 carrier, B2 control, Counter, Pool, liquidity, viability, and Omega obligations into the existing fail-closed authoritative Issue witness.
5. Verify the actual first-user Sale path and prepare the owner-controlled wallet purchase. The owner alone reviews/signs/submits; no agent custody, payment, or signing.
6. Confirm the transaction, minted NFT, exact ticket UTxO/datum, and post-state; persist a reproducible, redacted evidence packet.

### Scientific paper — parallel track

- Define research question and contribution only after prior-art comparison.
- Freeze canonical notation and semantics; do not change formulas or parameters to improve the paper.
- Map every claim to source, exact commit, test, workflow/artifact digest, and live transaction where applicable.
- Separate proofs, executable conformance, simulations, provider observations, and live-ledger results.
- Draft related work, formal model/threat model, architecture, provenance/admission, implementation, evaluation, limitations, and reproducibility appendix.
- Do not present pending, fixture-only, simulated, or unverified results as experimental validation.

### Stop conditions

No new branch; no economic parameter/formula changes; no V3/Reveal/validator/kernel/consumer changes under this priority decision; no Materios/B3 takeover; no changes to Agent B/C assignments; no fabricated deployment IDs, source authority, completeness, or protected-component zeros. Missing authority remains a blocker.

The detailed exit criteria and work breakdown are in [Agent A — First Preprod Ticket and Scientific Paper Priority](AGENT-A-PRIORITY-FIRST-PREPROD-TICKET-AND-SCIENTIFIC-PAPER-2026-11-02.md).

**Priority rule:** work outside the existing Agent A mandate is not pulled in. Within that mandate, work not directly advancing the owner-purchased first Preprod ticket or a citable/reproducible paper component is deferred.


## 45.56 AGENT A — PROTECTED CAPITAL PRIZE CENSUS AND OGMIOS CORROBORATION (2026-11-02)

### Canonical implementation retained

- The canonical item-ledger remains `PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts`.
- The canonical full address enumerator remains `relayer/koiosProtectedCapitalSourceCensus.js`; the integrated read-only CLI remains `audit/cardano-integration/preprod-protected-capital-census.mjs`.
- Koios pagination uses explicit limit/offset, exact Content-Range totals, duplicate/reference/asset validation, DatumHash lookup and BLAKE2b-256 content comparison for hash-reference datums. CIP-32 inline data are recorded as `INLINE_DATUM_HASH_NOT_APPLICABLE`, not falsely rejected for lacking a datum_hash.
- Provider attestation, same-backend snapshot pinning, and source completeness authority remain false. No live Koios census has been run in this session.

### Independent Ogmios address observation

- Existing authenticated Demeter/Ogmios v7 context observer has been extended to query the historical PrizeValidator address through `queryLedgerState/utxo` on the same WebSocket session as context/wallet/Pool observations.
- It records raw UTxOs, normalized output references, datum/datumHash, tip-before/tip-after, SHA-256 sidecar and a summary. The address is explicitly marked `HISTORICAL_DEPLOYMENT_CANDIDATE_REVALIDATION_REQUIRED`; it is not asserted as the current deployed address.
- Each returned output must have a valid 32-byte transaction hash plus non-negative output index, and any returned address must match the queried PrizeValidator address. The existing `preprod-context` workflow job verifies the PrizeValidator artifact and sidecar digest, schema/provenance fields, and returned count versus identified references; the probe fails on malformed/mismatched rows or tip movement after retaining diagnostic evidence.
- This is a same-session corroborating address observation, not a replacement for Koios pagination and not an authenticated source-completeness proof.
- Changes are in `audit/cardano-integration/preprod-ogmios-context.mjs` and `.github/workflows/immortal-cardano-preprod.yml`.

### CI evidence and run disposition

- Dedicated census workflow run [41405446327](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41405446327) completed SUCCESS on source head `17e29b4c9f033322811e24ba0cfb9b9e73d51f95`. The Koios provider pagination/provenance Node tests and ProtectedCapital item-ledger Vitest tests both passed on that head.
- A later test-bearing run [41407914884](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41407914884) is queued on `fa096850801a4738648bb307673c2333bf0bbaa3`, with the current 19 Node Koios-reader tests and 15 Vitest ledger tests. The branch is eight commits ahead of that queued head; those commits touch only the Ogmios observer/workflow and docs, not the Koios reader, item-ledger builder, CLI or test files. The queued run is not complete, so no PASS is claimed.
- No new PrizeValidator Ogmios artifact has been verified yet. The Preprod scan has not been executed against the current deployment manifest.

### Current qualification boundary

- L1/L3 ticket ledger builder and Koios source enumerator: implemented, but not live-qualified.
- Ogmios PrizeValidator cross-check: implemented, run/artifact pending.
- Provider authenticity, same-backend snapshot pinning, global source completeness, L2 Jackpot lifecycle, SafetyCapital, ReserveProtection, MandatoryFutureCosts, global L6 emptiness, and PA1–PA7: OPEN.
- No transaction was built/signed/submitted; no V3, Reveal, validator, kernel, economic formula/parameter, or B2/Materios/B3 semantics were changed.

**Next bounded action:** wait for and inspect the workflow-generated Ogmios evidence artifact on the current head; then compare the exact PrizeValidator and B1 Pool observations to the Koios packet under explicit snapshot/provenance limitations. Do not infer a current deployment from historical identifiers.


## 45.57 AGENT A — LIVE PREPROD CENSUS, OGMIOS PACKET REPAIR, AND FIRST-ISSUE BLOCKERS (2026-11-02)

This section supersedes the historical “no live census / Ogmios packet pending” disposition in §45.56. It records only results independently inspected in GitHub Actions artifacts during this session. It does not change the Agent A mandate or protocol semantics.

### Exact source heads and verified runs

- Runtime evidence source head for the latest Ogmios packet: `b45d243a576fc378873720ecec2d257800e7aec4`. The coordination and documentation-link follow-up commits were documentation-only.
- PRE-RICH direct-USDM source qualification run [41410801435](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41410801435) completed SUCCESS at `41d0d2d6b4db7d94b378068282756dc8a5860899`: live PrizeValidator/B1 census executed, B1 re-observed, EV1–EV7 qualified, approval absence verified. This is **source qualification only**; `deploymentApproval` remains `null/PENDING`.
- Dedicated ProtectedCapital source-census workflow [41410801247](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41410801247) completed SUCCESS at the same SHA: Koios pagination/provenance tests and item-ledger conformance tests pass.
- The integrated Preprod context workflow [41414349567](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41414349567) completed SUCCESS at `b45d243a576fc378873720ecec2d257800e7aec4`, including wallet, PrizeValidator, B1 Pool packet checks, Reveal-boundary conformance and conformance binding.
- Latest Ogmios context artifact: `immortal-cardano-preprod-context`, artifact ID `13126941925`, archive SHA-256 `3d1f860e6b876c8c57819a1a7fd0e065e8a1d92d8d1d83bd179fd0dde6075102`. All five included SHA-256 sidecars were independently checked against the archived JSON bytes and passed.

### Live observations at the Ogmios packet tip

All three address observations in the latest artifact report the same stable tip: slot `137925432`, block hash `db09b44597c0836a467142273b978a7d01f426193c8e541bcccee87e435dc098`.

- Service wallet observation: 23 UTxOs, 6,294,787,391 lovelace. This is the configured service/deployment wallet observation, not evidence of the owner's connected buyer wallet.
- Historical PrizeValidator candidate address: 0 UTxOs; tip stable; no malformed/missing-datum rows were observed.
- Historical B1 Pool candidate address: exactly 1 UTxO; tip stable; the observed out-reference is `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`. It contains one B1 Pool singleton and `1,000,000,000` atomic units of direct tUSDM (1,000 USDM at the profile's 6-decimal scale).
- The B1 address/out-reference match the current direct-USDM deployment manifest used by the EV1–EV7 qualification artifact. The Ogmios packet nevertheless keeps explicit `HISTORICAL_DEPLOYMENT_CANDIDATE_REVALIDATION_REQUIRED` provenance; do not promote this observer alone to deployment authority or source-completeness certification.
- The Preprod boundary binding identifies the exact source commit and live observation, but explicitly sets `ledger_aligned_evaluator_run=false` and `full_end_to_end_equivalence_claim=false`. No Reveal transaction was submitted by this workflow.

### Observer and packet-persistence repair

- Previous run [41410801526](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41410801526) exposed that the Ogmios observer wrote wallet/PrizeValidator/B1 SHA sidecars but omitted the corresponding JSON packet files. The workflow therefore failed its existence checks.
- Commit `ff1001e0a5297009a76f55e2770ce8b0ae3f9203` added the three missing JSON writes.
- A subsequent artifact showed the B1 Pool query could cross a tip while still being reported as a completed workflow. Commits `590cce5e6386c74692178828bc4bd5e346f96308` and `f0457e144ee3d1558215d2fe22646c7446b57150` now fail closed on a moving B1 tip and verify the packet, checksum, candidate presence, count, and references.
- Commit `b45d243a576fc378873720ecec2d257800e7aec4` fixes the conformance-binding SHA-256 to hash the exact formatted bytes written to disk. The latest artifact confirms this sidecar now passes.

### Direct-USDM and ProtectedCapital qualification boundary

- Direct tUSDM source-set: `OBSERVED_NOT_QUALIFIED` as a standalone source observation; direct physical value was re-observed and EV1–EV7 qualified under `PRE-RICH-EEV-USDM-DIRECT-V1`.
- Current qualification output still has no deployment approval. An older manual EEV approval run on 2026-10-21 was tied to an earlier source head and is not a substitute for approval bound to the current candidate/source-set/deployment/Oracle digests.
- The live Koios ticket census at slot `137923680` found 0 PrizeValidator UTxOs and one B1 Pool singleton. L1/L3 internal reconciliations matched the B1 aggregates (currently zero). This is **INTERNAL_RECONCILIATION_ONLY**, not full ProtectedCapital qualification.
- Provider attestation, provider-pinned/same-backend snapshot, independent source-completeness authority, global L5/L6 history, L2 Jackpot lifecycle, SafetyCapital, ReserveProtection, MandatoryFutureCosts, PA1–PA7 coverage, and pairwise allocation/disjointness remain OPEN or unproven. Zero live PrizeValidator outputs do not prove that every ProtectedCapital component is globally zero.

### First owner-purchased Issue — blockers still open

1. **B2 Control deployment:** no successful B2 Preprod deployment artifact is present on this current branch head. The last manual deployment attempt [37972119553](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/37972119553) compiled/exported and verified the Plutus artifacts, then stopped before seed selection because `BLOCKFROST_PROJECT_ID` was empty. It did not reach transaction construction/signing/submission. The B2 deployment workflow is manual and does sign/submit a singleton transaction; do not dispatch it without explicit owner authorization and confirmed provider credentials.
2. **Oracle State:** the exact current datum remains stale relative to its configured one-hour max age (approximately 24.6 days old). The liveness observer is read-only. The bootstrap script reuses an existing singleton and preserves its old timestamp; rerunning it does not refresh the datum. The manifest also keeps `externalPriceSourceVerified=false`. Replacing the timestamp with wall-clock time would not prove price truth and is prohibited.
3. **External Issue authority:** `PreprodAuthoritativeIssueProvider` requires an external signed authority URL and verification public key, plus signed EEV, ProtectedCapital provenance, viability and B2/control bindings. The in-repository client composes and verifies the response; it does not manufacture the authority evidence. No current live endpoint/key-backed authority packet has been demonstrated.
4. **R1/Kc and Omega:** the concrete deployment-specific kernel certificate is not present. It requires a governed, non-vacuous `(S, A, Accept, Ω, T, Safe)` instance and VC1–VC6 / CK1–CK8 evidence. Do not narrow Ω artificially, create a synthetic Kc/QNE certificate, or label a fixture as deployment certification.
5. **PA1–PA7 / full ProtectedCapital producer:** the current ticket item ledger and census cover a narrow L1/L3 ticket slice. The item-level producer contract remains documentary; component provenance, completeness, pairwise non-overlap, L2/L5 history and L6 emptiness are not fully established.

### Next Agent A sequence

1. Obtain the missing Blockfrost deployment-provider configuration and owner authorization before any B2 deployment transaction.
2. Qualify the Oracle quote's actual external source and governed freshness policy; do not refresh a stale timestamp without a source-authenticated update path.
3. Materialize and verify the B2 singleton and current Counter/V3/Pool identities with exact Preprod observation packets.
4. Complete the PA1–PA7 item-level evidence producer and non-overlap/completeness witnesses, then instantiate R1/Kc/Omega with a non-vacuity proof under the existing normative scope.
5. Bring up the external signed Issue authority and run the existing read-only `preprod-first-issue-readiness.mjs` gate. Only after it reports `READY_FOR_WALLET_REVIEW` may the owner review the actual DApp Sale path and prepare their own wallet purchase.

**Safety disposition:** no transaction was built, signed or submitted by this session; no EEV deployment approval was issued; no B2 singleton was deployed; no ticket was purchased. V3, Reveal, validator semantics and economic formulas/parameters were not changed.


## 45.58 AGENT A — R1/Kc, Ω, NON-VACUITY AND PA1–PA7 EXACT EXIT CONTRACT (2026-11-02)

This section translates the existing normative certification specifications into concrete evidence inputs for the first Issue. It adds no new theorem, threshold, state variable, economic parameter, or acceptance rule.

### R1 — concrete viability certificate (E1–E10)

The normative source is `docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md`. A valid certificate has the versioned tuple `⟨id, version, M, χ, Wit, Bnd, Proofs⟩` and discharges VC1–VC6:

- **E1 / model instance:** versioned PRE-RICH deployment/profile definition of `(𝒮, A, Accept, Ω, T, Safe)`; name the state representation, allowed canonical actions, acceptance predicate, event successors, transition function and safety predicate.
- **E2 / χ:** total, deterministic, decidable, domain-separated membership predicate for `K_c`, with executable source and specification.
- **E3 / Wit:** total deterministic witness/action selector for every admitted `S ∈ K_c`.
- **E4 / VC2:** proof that every state admitted by `χ` is Safe.
- **E5 / VC3:** inductive proof that the selected action is available and every successor under all `ω ∈ Ω(S,Wit(S))` remains in `K_c`; any finite abstraction needs a separate soundness argument.
- **E6 / VC4:** proof and tests that the witness action satisfies `Accept(S,Wit(S))` when required authoritative inputs exist.
- **E7 / VC5:** the Ω perimeter package and proof the checked envelope is a sound over-approximation of the declared environment.
- **E8 / VC6:** concrete initial state `S₀` and derivation showing `χ(S₀)=1`.
- **E9:** conservatism/liveness-cost report for the selected subset of `K*`.
- **E10:** SHA-256 digest over the χ/Wit artefacts, bound to the deployment/version.

The certificate is not valid by schema presence alone. R1 is discharged only when E1–E10 are published and VC1–VC6 are actually discharged. The generic mathematical theorems and certificate format are proven; a concrete PRE-RICH deployment `K_c` is not yet instantiated.

### R3 — Ω completeness/perimeter package (P1–P8)

The normative source is `docs/02-certification/OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md`. The required package is:

- **P1:** finite, published `Env` event classes and boundary conditions.
- **P2:** explicit exclusions with rationale.
- **P3:** representation for all 13 contract dimensions: authority, event domain, actor independence, adaptive adversaries, repetition, correlation, timing, concurrency, liquidity shocks, oracle failure, boundary, unknown events and failure behaviour.
- **P4:** justification of independence wherever Ω is factored as product components.
- **P5:** soundness proof that any finite checked abstraction over-approximates Ω.
- **P6:** residual-risk statement.
- **P7:** discovery process for a new Ω-completeness witness and fail-closed response.
- **P8:** re-certification trigger for any narrowing of Env/Ω.

The condition is containment: `Ω` must cover all real induced successors in the declared Env; exact equality is not required. Enlarging Ω is conservative; narrowing Ω is an upgrade requiring re-certification. Do not infer event probabilities or omit correlated/adaptive/unknown events because they were absent from a historical sample.

### R8 — non-vacuity and actual initial-state admission (NV1–NV5)

The normative source is `docs/02-certification/NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md`:

- **NV1:** concrete canonical initial state `S₀`.
- **NV2:** evaluation of `χ(S₀)` with reproducible derivation trace.
- **NV3:** complete R1 certificate E1–E10.
- **NV4:** non-eroding action/QNE check, or a proof that the T-EROSION obstruction does not apply.
- **NV5:** if claiming a truly quiescent singleton state, prove that its state is unchanged for every `ω ∈ Ω`, not merely expected events.

Do not confuse the universal existence of an abstract greatest fixed point with a non-empty deployment-specific certified set or an admissible actual Preprod starting state.

### R2 — implementation refinement (RF1–RF11)

The normative source is `docs/02-certification/REFINEMENT_CONFORMANCE_SPECIFICATION.md`. In addition to R1, the concrete implementation needs a refinement relation `ρ` and evidence for RF1 state correspondence, RF2 action correspondence, RF3 transition correspondence, RF4 obligation correspondence, RF5 ProtectedCapital correspondence, RF6 Ω correspondence, RF7 safety preservation, **RF8 no-side-door coverage**, RF9 expiry preservation, RF10 atomicity and RF11 determinism/history.

RF8 is the critical admission-boundary proof: enumerate every state-mutating path in the whole program and show each commits only after the authoritative gate. Unit tests over a subset of code paths are not a whole-program no-side-door proof.

### R7 — item-level ProtectedCapital producer stop point

The normative partition is `docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md`; the current PRE-RICH mapping and implementation contract are in the 2026-11-02 PA1–PA7 mapping and producer-contract audit documents.

The canonical producer implementation sequence already documented in the item-level producer contract is retained:

1. bind one profile/version and exact snapshot envelope;
2. implement stable identities and atomic item records for already-typed obligations (tickets, crystallized payouts and locked Jackpot) from authoritative sources;
3. normalize mandatory protocol-borne future costs separately from benchmark/observed costs, and reconcile the PC.MandatoryFutureCosts ↔ Fs/Fr/Fc boundary without double-counting;
4. keep SafetyCapital and ReserveProtection unqualified until their meaning, R7 mapping, source, valuation/horizon, and pairwise non-overlap are governed;
5. derive all six aggregates from qualified item allocations, produce overlap/completeness witnesses and deterministic replay;
6. only then propose a minimal admission integration change; stop before integration while completeness, mapping, valuation or disjointness is open.

This producer contract is documentation-level only and explicitly NOT IMPLEMENTED / NOT CERTIFIED. The live Koios/Ogmios evidence currently closes only the narrow ticket L1/L3 census plus Pool aggregate reconciliation; it is not an all-component PA1–PA7 certificate.

**Agent A decision:** do not start with a hand-filled Kc JSON or a new workflow that fabricates certificate fields. The next implementation slice is the item-level authoritative source producer and its adversarial replay tests, while the concrete Env/Ω and non-eroding-witness semantics are governed against the current PRE-RICH deployment. No formula, parameter, V3, Reveal, validator or Issue semantics are to be changed under this evidence work.

## 45.59 AGENT A — FIRST-ISSUE ENTRYPOINT HARDENING / RF8-A UPDATE (2026-11-02)

This section records a fail-closed application-boundary repair. It does not close R1/R2/R7/RF8 as a whole and does not authorize an Issue transaction.

### Direct witness bypass removed from the public Issue mint API

Before this change, src/mint.ts::mintSerialNFT accepted an optional caller-built economicAdmission. When present, the function skipped obtainAuthoritativeIssueAdmission; the lower adapter checked the witness's structural completeness and bindings but did not itself verify the external Ed25519 signature. The dedicated mintSerialNFTWithAuthoritativeAdmission wrapper did invoke the provider path and forced B2/V3, but it was not the route used by src/tickets.ts.

Commits:

- f9546a11e51d684e2e4d53f91a9702e1d9ec4ec5: renamed the generic builder to private mintSerialNFTInternal, removed public direct economicAdmission injection from MintSerialOptions, made the authoritative provider required, removed caller-controlled optional B2/V3 flags, forced the B2 and V3 carrier checks on every Issue, and made mintSerialNFTWithAuthoritativeAdmission the only public Issue mint API.
- dd1ca09134baef3b4b019e8ddc60e4b9b717a773: routed src/tickets.ts::buyTickets through the authoritative wrapper.
- 11e713e5dc8d7889dfcd749b022249afb2fb5c43 / 5b900b6f0d36b1958fb8cee53d702a2e451f6316: added src/__tests__/authoritativeIssueEntrypoint.test.ts, a source-level regression invariant covering the absent generic export, mandatory provider resolution, mandatory B2/V3 bindings and absence of alternate mintSerialNFT( application callsites.
- 341b2a880988d61c2fb54c97b1ba91cda001325e: added that regression test to .github/workflows/adapter-sale-conformance.yml.

### Verification on exact current head

Current branch head: 341b2a880988d61c2fb54c97b1ba91cda001325e.

- [Cardano Adapter Sale Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41416756500): SUCCESS. This includes the new authoritative-entrypoint test, adapter/Issue admission tests, relayer/signedIssueAuthority.test.js Ed25519-envelope verification tests, Haskell Issue admission provider tests, and repository-wide RF8 production-boundary audit.
- [Frontend build](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41416756500): SUCCESS.
- [Protocol Declaration / typecheck](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41416756530): SUCCESS.
- [Portability Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41416756420): SUCCESS.
- [Algorithmic Governability](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41416756473): SUCCESS.
- [Documentation Link Check](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41416756506): SUCCESS.

This is a bounded RF8-A improvement: the direct caller-built Issue witness path was removed from the public mint API, and the remaining ticket helper now calls only the authoritative wrapper. It is not proof of whole-program refinement/no-side-door closure (RF8-B), and it is not the R1/Kc certificate.

### Application wiring remains unmaterialized

- The production createPreprodAuthoritativeIssueProvider factory already composes live B2/Counter/Pool/Carrier observation with fetchSignedIssueAuthority, which verifies the signed authority envelope and V3 carrier signature using the configured public key.
- The public Issue wrapper accepts an AuthoritativeIssueAdmissionProvider callback and now invokes it unconditionally. It does not invent or calculate the witness.
- There is still no current DApp callsite that constructs the production provider with a real authority URL/public key and deployment configuration. The only repository UI call found is src/legacyBindings.ts, whose legacy buyTickets(1) event supplies no MintSerialOptions; src/tickets.ts therefore deliberately fails closed with “Mint options required”. That UI is not a functioning first-ticket purchase path.
- Do not replace the provider with a test fixture, local stub, fabricated signature, or static witness. The actual DApp wiring needs the real signed authority endpoint, public key, live deployment identity and verified expiry/settlement configuration.

### Remaining first-Issue blockers unchanged

1. B2 Control singleton has not been deployed on Preprod. Deployment workflow is manual and submits a singleton transaction; the last attempt stopped before seed selection because BLOCKFROST_PROJECT_ID was missing. No deployment was initiated here.
2. Oracle State datum remains stale (about 24.6 days old versus the existing one-hour settlement horizon) and its external ADA price source is not verified. No timestamp was rewritten and no new oracle transaction was submitted.
3. EEV EV1–EV7 source qualification is complete for the direct tUSDM Pool candidate, but current deployment approval remains pending/null and the external signed Issue authority service/key is not configured in a live DApp callsite.
4. R1/Kc, Ω completeness, non-vacuity, R2 RF1–RF11 (especially RF8-B whole-program no-side-door proof) and full PA1–PA7 ProtectedCapital item provenance remain open.
5. The live census and Ogmios packets verify the narrow current on-chain candidate state only; they do not attest the complete ProtectedCapital perimeter.

Safety disposition: no Issue transaction was built, signed or submitted; no B2 deployment was dispatched; no deployment approval was created; no V3, Reveal, economic formula, coefficient, price ladder, payout rule or expiry semantics were changed.


## 45.60 AGENT A — SIGNED EEV APPROVAL LIVE-CANDIDATE BINDING (2026-11-02)

This bounded admission-integrity repair binds the signed EEV deployment approval to the exact live Preprod Pool candidate and direct-USDM source-set observation. It does not certify R1/Kc, deploy B2, refresh Oracle State, authorize Issue, or change V3/Reveal/economic semantics.

### Finding

The signed authority verifier already required:
- EEV qualification status `qualified`;
- EEV deployment approval status `DEPLOYMENT_APPROVED`;
- direct-USDM profile version;
- qualification/approval digest linkage through governance;
- EV1–EV7 evidence;
- a complete Preprod-bound viability certificate with VC1–VC6 and E1–E10;
- ProtectedCapital and viability deployment bindings.

However, before this repair, approval `candidateId` and `sourceSetId` were only checked as non-empty strings. They were not compared with the exact live Pool UTxO and source-set digest supplied to the current Issue verification. A correctly signed approval for another candidate could therefore be replayed inside a different otherwise-valid authority payload.

### Implementation

The verifier `relayer/signedIssueAuthority.js` now requires and cross-checks the qualification's source-set record against the current observation:
- exact `sourceSet.poolInputReference` = live Issue Pool UTxO;
- `sourceSet.directUsdmUnit` = observed direct-USDM asset identity;
- source-set physical USDM amount = live direct-USDM Pool observation;
- `statusAtQualification = OBSERVED_NOT_QUALIFIED`;
- `freshnessModel = LIVE_UTXO_REVALIDATION`;
- `candidateId = PRE-RICH-EEV-USDM-DIRECT-V1:<live Pool txHash#outputIndex>`;
- `sourceSetId = PRE-RICH-EEV-USDM-DIRECT-V1-SOURCE-SET-v0.1:<sourceEvidenceHash>`;
- qualification sourceReference binds the same live Pool reference;
- `governance.approvalInputSourceSetHash` equals the approved source-set digest.

The signed envelope self-verification now passes the exact physical Pool amount into the same validation path. The envelope fixture was aligned with the canonical source-set and approval identifiers.

Four adversarial regressions reject:
1. a candidateId replayed from another Pool UTxO;
2. a sourceSetId replayed from another source-set digest;
3. source-set amount disagreement with the live Pool observation;
4. governance source-set digest disagreement.

The Issue Admission CI typecheck also exposed an unrelated, pre-existing mismatch in the CML test fixture: `TransactionBody.new` was called with three arguments although the locked binding expects four. The test helper now supplies explicit `undefined` as the optional fourth argument; this is fixture-only and does not change transaction or protocol semantics.

Commits on `work/immortal-green-closure`:
- `d0894de1278dfcc579f6c4ad41543ec889a6a271` — bind EEV approval to live Pool candidate;
- `1cb67df2ea4e8a1ee3c19e2b7f9ef4acc7cffa27` — adversarial replay regressions;
- `853e56fd2ad9c13171868a95e6183c7f02e87446` — pass direct Pool amount to envelope self-check;
- `c03f0fb4ced7ed157cfd04fdd10700879c99a815` — align envelope fixture with canonical source set;
- `35bc1fab224863901df7056888f1eee9c9f375f3` — fix CML test-fixture constructor arity.

### Verification on exact current head

Current branch head: `35bc1fab224863901df7056888f1eee9c9f375f3`.

- [Issue Admission Boundary CI #71](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41420797655): SUCCESS, including runtime admission tests, caller-input rejection, signed authority/approval binding, signed envelope end-to-end, first-Issue readiness gate, syntax check and locked-Lucid typecheck.
- [PRE-RICH Direct-USDM Conformance #128](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41420457655): SUCCESS, including authority/admission conformance, EEV approval integrity, Oracle datum and freshness tests, provider typecheck and browser build. This run is on `c03f0fb4...`; the subsequent change only adjusts the unrelated CML test fixture.
- [PRE-RICH B2 Control Carrier Conformance #609](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41420797721): SUCCESS, including authenticated observation regressions and browser build. This is CI evidence, not evidence of B2 Preprod deployment.
- [IMMORTAL Cardano Preprod Context #835](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41420797741): SUCCESS. Read-only context steps validated the configured Preprod wallet, queried Demeter/Ogmios, and observed wallet, PrizeValidator and B1 Pool candidate UTxO evidence. The real Preprod Reveal, direct-USDM bootstrap, V3 carrier observation and Preprod deployment jobs were all SKIPPED. The context run does not certify Oracle freshness or B2 on-chain materialization.
- [IMMORTAL Cardano Integration Lab #2434](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41420797743): automatically started against isolated Yaci devnet; it is a local integration lab, not a Preprod deployment or Issue authorization.

### Remaining first-Issue blockers — unchanged

1. **R1/Kc and Ω/non-vacuity:** no concrete deployment-specific Kc has been instantiated and certified. R1 still requires actual VC1–VC6 and E1–E10 evidence bound to the selected PRE-RICH state/profile; the Ω/Env perimeter and non-vacuity/initial-state evidence remain open. Schema presence or synthetic fixture values are not certification.
2. **Oracle State:** the current stale datum has not been refreshed. Bootstrap reuse preserves the old on-chain timestamp; liveness and quote-set observers are read-only. No authentic quote update was submitted.
3. **B2 Preprod:** authenticated B2 conformance tests pass, but the singleton has not been deployed/materialized on Preprod. No deployment workflow was dispatched.
4. **EEV deployment approval:** EV1–EV7 qualification and approval are distinct. The protected approval workflow was not dispatched and no `DEPLOYMENT_APPROVED` artefact was created during this work.
5. **Authority service/DApp wiring:** the real signed Issue authority endpoint/public key and production DApp provider configuration remain external/runtime prerequisites.
6. **ProtectedCapital:** the complete authoritative PA1–PA7 item-level producer and full provenance certification remain open.

Safety disposition: no Issue was built, signed or submitted; no deployment approval was issued; no B2 deployment or Oracle update was attempted. No V3, Reveal, economic formula, coefficient, ladder, payout or expiry semantics were changed. CI performed only the automatically triggered conformance/context work described above.


## 45.61 AGENT A — ORACLE STATE READ-ONLY OBSERVATION (2026-11-02)

This pass acquired fresh read-only ledger evidence for the historical bootstrap-wallet Oracle singleton and attempted the separate configured-runtime observation. It does not refresh the Oracle datum, qualify its external source, authorize settlement, or change any on-chain state.

### Workflow and execution

- Workflow: [Oracle Quote-Set Read-Only Observation](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41422819880), on `work/immortal-green-closure`, commit `ae18d121572cebe09fcb638b41e57b438cb987d3`.
- Bootstrap-wallet Koios observation: **SUCCESS**. Its read-only artifact was uploaded as artifact `13129754997`, `bootstrap-wallet-oracle-observation-ae18d121572cebe09fcb638b41e57b438cb987d3`; archive SHA-256 `13b43742d7f7dadd845d140f35484ce8aba81bd4947b9e5403c7d1a0b01c8963`.
- Configured runtime singleton observation: **BLOCKED before chain query**. The workflow's `DEMETER` environment supplied empty values for all five required configuration names: `BLOCKFROST_PROJECT_ID`, `ORACLE_STATE_ADDRESS`, `ORACLE_STATE_POLICY_ID`, `ORACLE_STATE_TOKEN_NAME_HEX`, `ORACLE_PUBLISHER_PKH`. The script therefore skipped the Blockfrost UTxO query and emitted no runtime singleton observation artifact. No secret values were logged.

### Historical bootstrap-wallet singleton — exact observation

Observation time from Koios Preprod chain tip: `2026-11-02T09:41:55.000Z`.

- Tip: block `5364332`, absolute slot `137929315`, epoch `323`, hash `ed0eb06874389012ab2c0d64e380d194c31f3c446923c6ccdde99999d187edff`.
- Historical identity: policy `9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e`, token name `4f5241434c45`, configured publisher `69fe256b67d8f11822a34b250ab8ba271bdedb513daf99e618b6bc89`.
- Exact live out-reference: `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`; lovelace `2000000`; datum CBOR SHA-256 `aeb64ac953285ef1dcf2aa017ee09bbe94ffc93c7ddb177b29e579a9078191b2`.
- Datum: `legacy-single-quote`, one quote for `lovelace`, raw price field `100`, timestamp `2026-10-08T17:38:50.142Z`, publisher field matching the expected historical publisher.
- Measured quote age: **24 days, 16 hours, 3 minutes, 4.858 seconds** (2,131,384,858 ms). The existing 1-hour quote-age contract classifies it `STALE_TIMESTAMP`; `usableForIssue=false`, `adaOnlySettlementStructurallyUsable=false`. The legacy one-quote schema additionally reports `LEGACY_SCHEMA_SUPPORTS_ONLY_ONE_ASSET_QUOTE`.
- Artifact inspection explicitly reports `sourceTruthProven=false`, `externalPriceSourceVerified=false`, `configuredPublicPagesRuntimeIdentityProven=false`, and `multiAssetSettlementAuthorisedByThisObservation=false`.

The artifact's JSON evidence digest is `6d05da2524ac799f98728ff4f5832370cf7259b9da81b7ae7be6b86468d9034e`. The run result is intentionally **partial**: the historical bootstrap singleton was observed, but it is not evidence for the configured public Pages runtime identity.

### Interpretation and next dependency

1. The historical bootstrap-wallet Oracle singleton is still live, but its existing quote is stale and structurally unsuitable for Issue settlement. Reusing the singleton does not refresh its timestamp; do not synthesize a new timestamp in the manifest.
2. The configured runtime Oracle identity remains unknown to this workflow because the required GitHub `DEMETER` environment variables/secrets are missing. Do not substitute the historical bootstrap identity for the public runtime identity.
3. The Oracle candidate/source qualification material in Notion (PRE Oracle source-set §22, evidence acquisition §23, and PriceReference deployment contract §30) continues to distinguish operational publisher presence from qualified external source truth. A datum's publisher-field match is not independent market-source verification.
4. The next safe action is to populate/verify the five exact `DEMETER` environment values from the approved deployment record, then rerun this same read-only workflow. Do not bootstrap, sign, submit, refresh the on-chain datum, or deploy as part of that observation.

Safety disposition: both jobs were read-only; bootstrap observation reports `signed=false`, `submitted=false`, `stateChanged=false`. The configured-runtime job stopped before querying Blockfrost. No Oracle update, Issue transaction, deployment approval, B2 deployment, wallet signature or on-chain state transition occurred. V3/Reveal semantics remain untouched.


## 45.62 AGENT A — PUBLIC PAGES / ORACLE RUNTIME CONFIGURATION RECONCILIATION (2026-11-02)

### Purpose

Reconcile the exact source used for the public DApp with the read-only Oracle State observation. This is a source/configuration provenance check only; it does not change Oracle semantics, public deployment, or Issue authority.

### Verified implementation facts

**Public Pages workflow is configured to publish from `main`:**

- [`.github/workflows/immortal-preprod-pages.yml` on main](https://github.com/LiberoNuvola/Immortal-Protocol/blob/main/.github/workflows/immortal-preprod-pages.yml) is triggered by pushes to `main` and builds `dapp.html` / the Vite application.
- The current `main` build job does not define the `VITE_ORACLE_*` environment bindings and does not validate Oracle configuration presence before `npm run build`.
- [`src/config.ts` on main](https://github.com/LiberoNuvola/Immortal-Protocol/blob/main/src/config.ts) reads publisher, policy ID and token-name environment values, but does not export/read `ORACLE_STATE_ADDRESS`.
- [`.env.example` on main](https://github.com/LiberoNuvola/Immortal-Protocol/blob/main/.env.example) does not contain `VITE_ORACLE_STATE_ADDRESS`.

**The working branch contains a newer, but not yet deployed, configuration:**

- [`immortal-preprod-pages.yml` on work/immortal-green-closure](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/immortal-preprod-pages.yml) injects public runtime variables including Oracle publisher, singleton policy/name/address and Blockfrost Preprod configuration.
- [`src/config.ts` on work/immortal-green-closure](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/src/config.ts) now reads `VITE_ORACLE_STATE_ADDRESS`.
- That workflow still declares `push.branches: [main]`; a change made only on `work/immortal-green-closure` does not publish the working-branch build.
- Its public-runtime validation is conditional on `VITE_ISSUE_AUTHORITY_ENDPOINT` being present. If that endpoint is absent, Pages can build without validating the full Issue/Oracle runtime configuration.

### Relation to the read-only Oracle observation

The separate [Oracle Quote-Set Read-Only Observation workflow](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/oracle-quote-set-observation.yml) reads the five required values from the `DEMETER` environment (Blockfrost project ID via secret or variable; Oracle address, policy ID, token-name hex and publisher PKH via variables). Run [41422819880](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41422819880) failed its configuration preflight for all five inputs before querying the configured singleton; the separate historical bootstrap-wallet Koios observation succeeded but is not the public DApp runtime identity.

### Governance/source qualification boundary

Notion gates remain unchanged:

- [Oracle Evidence Acquisition & Provider Qualification Matrix §23](https://app.notion.com/p/3e0c4454d6d581718785f29e4ab51dc3): B1 publisher path is an operational candidate; source qualification requires reproducible evidence.
- [Oracle Candidate Discovery & Evidence Collection §24](https://app.notion.com/p/3e0c4454d6d5814eb368fc67fd74e8ab): B1 authorized publisher is not publisher-independent; current PRE→USDM Oracle is not qualified.
- [PriceReference Canonical Source Qualification & Deployment Contract §30](https://app.notion.com/p/3e0c4454d6d581bd8987ca079abef1ea): PRE→USDM canonical source remains open.

### Disposition

- **PUBLIC PAGES ORACLE IDENTITY: NOT PROVEN.** The checked-in Pages workflow is configured to publish from `main`, whose checked-in source does not carry the runtime Oracle address binding or inject the corresponding runtime variables. The latest deployed Pages artifact/site bundle was not inspected in this pass; an older deployed artifact could differ from the checked-in source.
- **DEMETER exact-singleton observation: BLOCKED at configuration preflight.**
- **Historical bootstrap singleton: OBSERVED, STALE, NOT A SUBSTITUTE FOR PUBLIC RUNTIME IDENTITY.**
- No secret values were copied into source or chat. Repository/environment settings were not changed.
- No Oracle update/bootstrap, signing, transaction submission, Issue, deployment approval or on-chain state change occurred.
- No V3 or Reveal semantics were changed.

### Next safe action

An administrator must select the canonical Pages source and reconcile it with the already prepared working-branch configuration, then populate the approved public runtime variables and the separate `DEMETER` observation bindings from the same deployment record. Only after the exact published bundle and exact configured Preprod singleton agree should the read-only observation be rerun. This finding alone does not close source qualification, R1/Kc/Ω, B2, EEV deployment approval, ProtectedCapital provenance, or the first-ticket gate.

## 45.63 PUBLIC PAGES DEPLOYMENT + FIRST-ISSUE ENTRYPOINT GAP (2026-11-02)

### Exact last observed Pages deployment

The latest Pages workflow run found among the repository's recent main runs is [IMMORTAL Public Pages #187](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38182109071):

- Run ID: 38182109071; completed success on 2026-10-11 at 22:52:44 UTC.
- Source: branch main, exact commit 876bc54f8ee8f6e1dede226db8c367cca3ae620c.
- Both build and deploy jobs completed successfully.
- The Deploy Pages log returned the public environment URL: [https://liberonuvola.github.io/Immortal-Protocol/](https://liberonuvola.github.io/Immortal-Protocol/).
- Build log confirms the DApp page dapp.html and bundle assets/dapp-bIhN6Bfi.js were included in the artifact.
- Pages artifact ID 11718432251; ZIP SHA-256 e7b3f35e30f7e6ab062da6d807c1abb23f03d30c2d361ed7a7265e80d2ce2536. The upload used a one-day retention period; the artifact is now expired (artifact query empty / download returned 404). Therefore the exact historical bundle bytes could not be re-read in this pass. Deployment source, job result, URL and build-log file inventory were verified.

### Configuration at the exact deployed source SHA

At 876bc54f8ee8f6e1dede226db8c367cca3ae620c:

- .github/workflows/immortal-preprod-pages.yml has no job-level env injection for the deployment-specific VITE_ORACLE_* variables and no Oracle runtime preflight. The build performs npm install followed by npm run build.
- src/config.ts reads VITE_ORACLE_PUBLISHER_PKH, VITE_ORACLE_STATE_POLICY_ID and VITE_ORACLE_STATE_TOKEN_NAME_HEX, but it does not define/read ORACLE_STATE_ADDRESS; the deployed .env.example also has no VITE_ORACLE_STATE_ADDRESS.
- No Blockfrost project ID or Oracle singleton address was injected by that Pages workflow.
- The relevant deployed-source src/config.ts blob is 4e4dcf268c5ff01677922e2972a7e662ff87a760; .env.example blob is 02f8c1561c1efbfc8e35d37c5346780208e3c35f.

The current main src/main.ts is byte-identical to the deployed-source version (blob d55ba61dab9377b338989eb56b23b8825c9f6335). This is a direct source check, not a re-read of the expired bundle.

### Critical first-user Issue path finding

**The published DApp is intentionally unable to buy a ticket.**

- In src/main.ts on the deployed SHA and current main, the UI renders BUY TICKET IS FAIL-CLOSED; the Buy button is disabled and the click handler returns "Purchase unavailable: authoritative Economic Gate admission is required."
- src/mint.ts on main does contain mintSerialNFTWithAuthoritativeAdmission, but current src/main.ts does not import or invoke it. A helper's existence is not a wired DApp path.
- On work/immortal-green-closure, src/main.ts imports the authoritative Issue mint function and createRemoteAuthoritativeIssueAdmissionProvider, requests the server-side witness, and uses V3 carrier/settlement observations. The corresponding working-branch src/mint.ts makes the B2 control binding explicit and required. Its Buy button remains disabled until deployment wiring and settlement observations are available; the code does not bypass the fail-closed gate.
- The working branch's Pages workflow contains more recent public-runtime variable injection, including Oracle singleton address/policy/name/publisher, B2, V3 and Blockfrost configuration, but the workflow trigger still targets main. The working branch has not thereby been deployed.

### Promotion / PR state

- Existing [PR #19](https://github.com/LiberoNuvola/Immortal-Protocol/pull/19) is open but currently mergeable=false, changes 593 files and its own body states that the site is not part of the PR. It is not a safe vehicle for wholesale promotion of the public DApp path.
- Searches for open PRs concerning authoritative first Issue, DApp provider wiring and Pages Oracle runtime found no separate focused promotion PR.
- The old release/issue-admission-boundary-squash branch is a four-file CI/adapter change from 2026-10-10; it does not contain the current DApp entrypoint or Pages runtime wiring.

### Disposition

- **LATEST OBSERVED PAGES DEPLOYMENT: SUCCESS, SOURCE SHA 876bc54... (2026-10-11).**
- **PUBLISHED FIRST-ISSUE BUY PATH: FAIL-CLOSED / NOT WIRED.**
- **PUBLISHED ORACLE STATE ADDRESS: NOT EXPOSED BY DEPLOYED SOURCE.**
- **WORKING-BRANCH AUTHORITATIVE ISSUE PATH: IMPLEMENTED AT SOURCE LEVEL, NOT PROMOTED/DEPLOYED AND STILL CONFIGURATION-GATED.**
- The earlier DEMETER configured-singleton run remains blocked before Blockfrost query; the historical bootstrap observation remains stale and is not a substitute.
- No main update, merge, deployment, GitHub environment mutation, secret disclosure, wallet signature, Issue transaction, Oracle update or ledger state change was made.
- V3/Reveal semantics and economic parameters were not changed.

### Next safe action

Build a curated, reviewable promotion of the first-user DApp path from the working branch to main: map its complete dependency closure, carry only the required runtime/provider/adapter/tests/configuration, and add Pages preflight that validates the same approved deployment record without allowing a missing endpoint to masquerade as an Issue-ready deployment. Keep it as a focused PR; do not merge it or deploy it until exact CI passes and the deployment-specific public variables plus the separate DEMETER Blockfrost/Oracle observation bindings are set and matched. Do not merge PR #19 wholesale.


## 45.64 AGENT A — SIGNED ISSUE AUTHORITY PRODUCER / HOSTING GAP (2026-11-02)

### Exact runtime boundary

The current code separates the browser, the Preprod observation/orchestration service, and the external signed authority:

1. The browser's `createRemoteAuthoritativeIssueAdmissionProvider` POSTs the request to the configured public `VITE_ISSUE_AUTHORITY_ENDPOINT`.
2. `relayer/issueAuthorityServer.js` serves `POST /issue-admission`, reads Cardano Preprod state through Blockfrost, constructs `PreprodAuthoritativeIssueProvider`, and returns the resulting witness.
3. `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` asks an external authority source for a signed envelope and verifies it against `ISSUE_AUTHORITY_PUBLIC_KEY`, while binding the response to exact live Counter, B1 Pool, B2 and V3 references and the direct-USDM observation.
4. `relayer/signedIssueAuthority.js` is a verifier/client in this path: `fetchSignedIssueAuthority` GETs the configured external authority URL and verifies the signature. It does not create the authority decision or sign the returned envelope.

### Signing code is not a production signer deployment

- `relayer/preprodIssueAuthorityEnvelope.js` exports `signIssueAuthorityEnvelope`. It signs an already-computed witness, does not compute EEV/ProtectedCapital/viability, and self-verifies its output.
- The observed call site is `relayer/preprodIssueAuthorityEnvelope.test.js`, which creates an ephemeral Ed25519 keypair with `generateKeyPairSync('ed25519')`. This is test evidence only; it does not establish a production key or signer.
- `relayer/signedIssueAuthority.test.js` also constructs ephemeral keys and signs fixtures for verifier regression tests.
- `relayer/authoritativeIssueRefinementEnvelope.js` is explicitly a shape/provenance transport validator, not a cryptographic signature verifier.
- `issueAuthorityServer.js` does not import or call `signIssueAuthorityEnvelope`; it requires an external `ISSUE_AUTHORITY_SOURCE_URL` / `ISSUE_AUTHORITY_URL` and `ISSUE_AUTHORITY_PUBLIC_KEY`.

### Hosting / deployment check

- The checked-in root package exposes `npm run issue-authority-server` as a local process command; `relayer/package.json` is for the older reference relayer and does not deploy this Issue authority.
- The working-branch `.github/workflows` directory contains the Pages, Issue boundary CI, B2, EEV and conformance workflows inspected in this pass, but no workflow that deploys `issueAuthorityServer.js` or a separate signed authority producer.
- No root hosting descriptor such as Dockerfile, Railway, Render, Fly or Procfile was found in the root directory listing inspected.
- The connected Railway workspace/project listing returned no accessible projects. This only establishes that no Railway project is visible to this connection; it does not rule out infrastructure in another provider, account, private repository or private workspace.
- The 2026-10-30 Notion audit had already recorded a bounded negative search for the external certificate producer: no implementation, owner, repository, deployment or key custodian was found in the inspected 27 branch trees, repository ledger and accessible Notion sources. It explicitly excluded private infrastructure that was not visible. This 2026-11-02 pass found no newer repository/Notion evidence that supersedes that result.

### Required server-side configuration (names only)

The source requires, among other deployment identities:

- External authority source URL: `ISSUE_AUTHORITY_SOURCE_URL` or `ISSUE_AUTHORITY_URL`.
- Verification public key: `ISSUE_AUTHORITY_PUBLIC_KEY`.
- Blockfrost Preprod project ID.
- Exact Counter, B1 PrizePool, V3 carrier and B2 control addresses/token identities.
- Direct-USDM unit.
- Exact allowed browser origin: `ISSUE_AUTHORITY_CORS_ORIGIN`.
- Haskell command/arguments for the authoritative Issue producer.

The private signing key is not a Vite/browser variable. No private key, public key, endpoint URL, deployment owner or key custodian is inferred or fabricated here.

### Disposition

- **SIGNED ISSUE AUTHORITY PRODUCER: NOT DEPLOYMENT-VERIFIED.**
- **ISSUE AUTHORITY SERVER: IMPLEMENTED AS AN ADAPTER/VERIFIER, BUT NO LIVE SERVICE HEALTH OR PUBLIC ENDPOINT IS VERIFIED.**
- **SIGNING HELPER: TEST-ONLY USAGE OBSERVED; NOT EVIDENCE OF A PRODUCTION SIGNER.**
- **FIRST PREPROD ISSUE: BLOCKED.** Enabling Pages or publishing the DApp cannot fix the missing external signed authority.
- No private key was generated, copied or exposed; no authority URL or public key was invented; no GitHub environment or hosting setting was changed.
- No service was deployed, no signature was created for production, no wallet was asked to sign, no Issue transaction or Oracle update was submitted, and no on-chain state changed.
- V3/Reveal semantics, EEV formulas and protocol parameters were not changed.

### Next safe action

Locate the already-authorized external authority producer and its accountable key custodian, or obtain an explicit deployment/governance decision defining that authority. Then verify its public key against the deployment-pinned V3 authority binding, its signed payload against exact Preprod state and qualification evidence, and its health/availability before wiring the public endpoint. Do not turn the test-only helper into a production signer or let the observation server assert its own economic authority.


## 45.65 AGENT A — B2 MATERIALIZATION / EEV DEPLOYMENT APPROVAL GATE (2026-11-02)

### Current-run evidence

- [IMMORTAL Cardano Preprod Context #835](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41420797741), SHA `35bc1fab224863901df7056888f1eee9c9f375f3`, completed SUCCESS for the context job. Its `real-preprod-reveal`, `direct-usdm-preprod-bootstrap`, `preprod-v3-carrier-observation` and `preprod-deploy` jobs were all SKIPPED. This is not an Issue transaction or B2 deployment.
- [PRE-RICH B2 Control Carrier Conformance #609](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41420797721), same SHA, completed SUCCESS. It is a conformance workflow; its green result is not an on-chain singleton deployment.
- The dedicated [B2 Control Carrier — Preprod workflow](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/pre-rich-b2-control-preprod.yml) is separate and manual (`workflow_dispatch`). No run of that named deployment workflow appeared in the latest 100 work-branch Actions runs inspected in this pass. Do not claim the B2 singleton exists on-chain based on conformance CI.
- [PRE-RICH Direct-USDM Conformance #128](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41420457655) and the Issue Admission Boundary CI run #71 are GREEN on their exact SHAs, but they do not create an EEV deployment approval or a Preprod Issue transaction.

### EEV qualification is not deployment approval

The source-only workflow `preprod-eev-qualification.yml` explicitly re-observes the live Pool and qualifies EV1–EV7 while requiring `deploymentApproval === null` and source-set status `OBSERVED_NOT_QUALIFIED`.

A separate manual workflow, [PRE-RICH B1 EEV Deployment Approval](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/pre-rich-b1-eev-approval.yml), requires:

- explicit manual input `approve_eev=true` (default is false);
- the `PREPROD-EEV-APPROVAL` GitHub environment;
- `PREPROD_REVEAL_SEED` and `PREPROD_EEV_APPROVAL_TOKEN` secrets;
- Oracle State materialization/reuse, exact direct-USDM deployment/source-set re-observation, EV1–EV7 requalification, and creation/validation of a separate `DEPLOYMENT_APPROVED` artifact.

No matching approval workflow run surfaced in the latest 100 work-branch Actions runs inspected. This pass did not dispatch it, read its secrets, invoke Oracle bootstrap, produce a deployment-approval artifact, or make a ledger change. That workflow must not be triggered as a substitute for locating the approved external authority producer/key custodian or completing the governance evidence.

### Disposition

- **B2 CONTROL:** conformance CI green; live Preprod singleton deployment remains NOT EVIDENCED by the inspected deployment workflow runs.
- **EEV EV1–EV7:** qualification is a separate evidence status; `DEPLOYMENT_APPROVED` is a distinct manually gated artifact and is not inferred from qualification or conformance CI.
- **FIRST ISSUE:** still blocked independently by the external signed-authority producer/public endpoint, exact Oracle runtime identity and freshness, B2 live state, EEV deployment approval, and R1/Kc/Ω plus ProtectedCapital evidence.
- No manual approval workflow, B2 deployment workflow, wallet signature, transaction submission, Oracle bootstrap or deployment was executed. V3/Reveal and economic parameters remain untouched.


## 45.66 AGENT A — LIVE REVALIDATION OF EXISTING EEV APPROVAL (2026-11-02)

### Correction: a separate EEV deployment approval already exists

A targeted Actions-history search across `main` found [PRE-RICH B1 EEV Deployment Approval #4](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679), which was not in the earlier work-branch-only run window:

- Run ID `39552468679`, branch `main`, workflow commit `97b09a38742098f17a61eb07734c401aeedccc06`.
- Completed SUCCESS on 2026-10-21 at 05:57:31 UTC. Every step in the approval job completed successfully, including authenticated Oracle State materialization, live direct-USDM source-set observation, EV1–EV7 requalification, separate approval materialization, digest verification and artifact upload.
- Artifact `immortal-preprod-eev-approved`, ID `12324421376`, ZIP SHA-256 `d219db29890d55e3a63dd9a7ff3b0f04ec53e710a7e77688c8a48610c06d094c`, retained until 2027-01-19.
- Artifact records `status=qualified`, `deploymentApproval.status=DEPLOYMENT_APPROVED`, profile `PRE-RICH-EEV-USDM-DIRECT-V1`, properties EV1–EV7, `approvalActor=LiberoNuvola`, `validFrom=2026-10-21T05:57:26.889Z`, and `validUntilOrRevalidationRule=LIVE_UTXO_REVALIDATION`.
- Approved candidate: `PRE-RICH-EEV-USDM-DIRECT-V1:b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`.
- Approved source-set evidence hash `7645d64514b17f025d0ff5f3ba0780cbee88a4331e77a57e7d07cb0862e8da00`; the `sourceSetId` is bound to this digest. Approved direct-USDM unit is `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`; observed amount `1000000000` atomic units / `100000` IMMORTAL USDM subunits.

The approval artifact explicitly says it does **not itself authorize Issue admission**. It requires live UTxO revalidation plus authenticated control state, ProtectedCapital provenance, viability/liquidity evidence and the authoritative Issue decision.

### Current read-only revalidation — run #44

Triggered the source-qualification-only workflow by a comment-only change to its workflow file; it has no signing, approval, transaction-submit or deployment step.

[PRE-RICH Preprod EEV — Source Qualification Only #44](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41431290207):

- Source SHA `cb720bf72d4f42de0c28da92f600f5ce1f48c66a`; workflow conclusion SUCCESS on 2026-11-02 at 10:45:40 UTC. All steps succeeded.
- Artifact ID `13135020137`, ZIP SHA-256 `0c78e5a8321d50918ea24634ecdebd19e51e18d4ba6b84bbb340bd2f56454146`, retention 30 days.
- Current Koios read found the **same exact B1 PrizePool UTxO** `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`, still live/unspent at the observation snapshot, with the **same** direct-USDM asset unit and quantity `1000000000`; derived amount remains `100000` IMMORTAL USDM subunits.
- The new source observation has a new evidence hash `cc9395d4c2a2672377db68b664883e5dc87d143fd9dc3f3f38f993b3d16c3e39`. The new, source-only qualification has hash `bc2533bdbdac851ed851ea73191088d76ad3033dcfd64c6f2ce7cf9011ca9aa8`, EV1–EV7 qualified, but its deployment approval is deliberately `PENDING` / `NOT_CREATED`.
- **Binding rule:** do not pair this newly emitted source-set digest with the 21-Oct approval artifact. `signedIssueAuthority.js` checks that `deploymentApproval.sourceSetId` and `governance.approvalInputSourceSetHash` bind the exact `sourceSet.sourceEvidenceHash`. The old approval/source-set pair remains separately identifiable; its `LIVE_UTXO_REVALIDATION` rule was exercised against the same live Pool ref and amount in this run. If a new source-set digest is to replace the approved one in an Issue payload, it requires its own properly bound approval; never splice the old approval onto the new digest.

### Oracle State freshness — still a live blocker

Run #44 also re-observed the exact configured Oracle State singleton through Koios:

- Same configured unit, policy, token name, publisher PKH, address and UTxO `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`; uniqueness and exact out-reference checks passed.
- Datum quote timestamp: `1791481130142` ms = 2026-10-08T17:38:50.142Z.
- Chain-time age at the run #44 snapshot: `2135196858` ms (24 days, 17 hours, 6 minutes, 36.858 seconds).
- Configured maximum age: `3600000` ms (1 hour). Result: `STALE`, `withinMaxAge=false`.
- The observer expressly records stale status; it does not refresh or substitute the quote. Datum inspection alone still does not prove external price-source truth or publisher independence.

Thus the physical direct-USDM EEV source was revalidated, but the configured Oracle State quote remains stale and its external market-source truth is not established. A stale Oracle datum cannot be called Issue-ready.

### ProtectedCapital census — full qualification still open

The same run #44 produced a read-only Koios ticket/PrizeValidator census at slot `137933127`, block `5364510`, snapshot hash `89812e57ac214edcf946950e885a4a4a8c0edf6eb2d347c7ec5a11908a699529`.

- Provider read-only = true; transaction submission attempted = false.
- Exact PrizeValidator address returned 0 UTxOs at that snapshot; B1 PrizePool address returned 1 UTxO, the same Pool reference.
- The Pool datum hash was recomputed from inline datum bytes and matched Koios BLAKE2b-256.
- Ticket-ledger internal reconciliation = true, but `sourceCompletenessAuthorityVerified=false`, `providerAttestationVerified=false`, `providerSnapshotPinned=false`, `sameBackendSnapshotVerified=false`, `fullProtectedCapitalQualified=false`, `r7L6EmptinessProven=false`, `l2LifecycleProven=false`, `liveL5RowsMayBePresent=true`, and consumed expiry history still requires transaction replay.
- The census scope is `PRIZE_VALIDATOR_TICKET_POPULATION_ONLY`; it is not a complete certification of all ProtectedCapital obligations. Zero observed PrizeValidator UTxOs does not prove R7/L6 emptiness or absence of historical obligations.
- The deployment manifest integrity is explicitly `SELF_HASH_MATCH_NOT_SIGNATURE_AUTHENTICATION`; its authority was not cryptographically verified by this census.

### B2 deployment history

- Historical [PRE-RICH B2 Control Carrier — Preprod AUTO #1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/37967057715) failed on 2026-10-09 before Plutus build, wallet selection or deployment because Ubuntu could not locate package `libblst-dev`. The B2 deploy step was skipped; no artifact was produced.
- The current `work/immortal-green-closure` manual [B2 Control Carrier — Preprod workflow](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/pre-rich-b2-control-preprod.yml) uses the canonical `.github/actions/setup-plutus` path and has no observed deployment run in the accessible run history. [B2 Conformance #609](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41420797721) is green but is not a singleton deployment.
- B2 live Preprod singleton deployment therefore remains NOT EVIDENCED.

### Producer/source search correction

- Scanned the current HEAD tree of all 27 visible `Immortal-Protocol` branches for authority/signer/deployment file paths. No production signer or independent Issue-authority deployment was found.
- Organization-wide GitHub code search for `ISSUE_AUTHORITY_SOURCE_URL`, `signIssueAuthorityEnvelope`, `PRE-RICH-SIGNED-ISSUE-AUTHORITY-V1` and `createPreprodAuthoritativeIssueProvider` found no other matching repository. The only matching `issue-admission` results were components/docs in `Immortal-Protocol`.
- `docs/research/ISSUE-AUTHORITY-PRODUCER-QUALIFICATION-2026-09-28.md` (also present on main) is explicitly RESEARCH/NON-NORMATIVE and says not to implement a concrete producer until authenticated control state, EEV perimeter/horizon, ProtectedCapital and executable-liquidity evidence are qualified.
- `audit/pre-genesis-genesis/ISSUE-OBSERVATION-PRODUCER-GAP-v0.1.md` remains classified OPEN: the missing boundary is the concrete authenticated observation/refinement producer, not another economic formula or browser interface.
- The historical `LiberoNuvola/PRE-RICH-scratch-and-win-game` repository could not be inspected through the current GitHub connection (repository content/metadata was not available). The accessible Cormia repository was still empty in this check; it does not supply an alternate producer.

### Corrected disposition

- **B1 EEV DEPLOYMENT APPROVAL:** EXISTS (run #4, artifact #12324421376), and its exact Pool UTxO/amount still passes live revalidation at run #44. Do not repeat approval merely because a new read-only source-set artifact has a different digest.
- **CURRENT READ-ONLY DIRECT-USDM QUALIFICATION:** EV1–EV7 PASS; new source set remains OBSERVED_NOT_QUALIFIED and no new approval was created.
- **ORACLE STATE:** exact singleton identity observed, quote STALE by ~24.7 days vs 1-hour max; external price-source truth not proven.
- **PROTECTEDCAPITAL:** census internally reconciled within its narrow scope, but full ProtectedCapital/source completeness/R7-L6 proof NOT QUALIFIED.
- **B2:** conformance CI green; live singleton deployment NOT EVIDENCED.
- **SIGNED ISSUE AUTHORITY / OBSERVATION-REFINEMENT PRODUCER:** no production endpoint, owner or key custodian verified; production witness path remains unresolved.
- **FIRST USER ISSUE:** still BLOCKED, despite the existing EEV approval.

No approval workflow, B2 deployment, Oracle refresh, private-key generation, service deployment, wallet signature, Issue transaction or ledger mutation was performed. V3/Reveal and economic parameters remain unchanged.

### Next safe actions

1. Preserve and use the original EEV approved qualification + its exact approved source-set digest as a matched pair, while live-revalidating the same Pool input/asset amount at admission time. Do not splice it with the new source-set digest.
2. Obtain an authorized fresh Oracle State publication and re-run only the read-only liveness observer; do not invent or write a quote.
3. Complete authenticated ProtectedCapital source completeness, lifecycle replay and R7/L6 evidence.
4. Execute the separately authorized B2 Preprod deployment only through the current manual workflow when its deployment identity/approval inputs are verified.
5. Locate/qualify the external Issue observation/refinement authority and key custodian. Do not turn the test-only signing helper into a production signer.


## 45.67 AGENT A — ADA QUOTE AS A MANDATORY ISSUE SETTLEMENT PREREQUISITE (2026-11-02)

A source-level trace corrects an ambiguity in the previous Oracle disposition:

- The direct-USDM EEV profile is genuinely physical: `preprod-direct-usdm-deployment.json` states `sourceKind=CARDANO_LIVE_UTXO` and explicitly notes that direct-USDM EEV itself does not perform Oracle valuation.
- However, the current work-branch DApp settlement path does require a fresh ADA quote even if a user intends to contribute another quoted token. In `src/main.ts`, `refreshSettlementOptions()` calls `validateIssueSettlementQuote(oracleDatum, 'lovelace', ORACLE_PUBLISHER_PKH, BigInt(Date.now()))` before accepting/building any basket. Its inline comment explains that every Treasury payment contains ADA for min-UTxO; without a fresh ADA quote, no token basket is executable under the existing on-chain valuation path.
- The same function then validates every asset quote and builds the basket through `buildIssueSettlementAssets`; the BUY flow refuses to continue without an exact valid basket.
- The canonical freshness bound in `src/issueSettlement.ts` is `CANONICAL_ORACLE_MAX_AGE_MS = 3_600_000` (one hour); this is code-bound, not a newly invented threshold.

Therefore the run #44 result `STALE` is a **current DApp settlement blocker**, independently of the fact that the direct-USDM EEV qualification passed. The configured Oracle datum is a legacy-single-quote ADA compatibility quote, last timestamped 2026-10-08 and aged 2,135,196,858 ms at the 2026-11-02 Preprod tip. It is not usable for the current basket preflight. Do not refresh only its timestamp or fabricate a price; obtain a source-authorized publication and then repeat the read-only liveness and settlement preflight.

This pass also searched public Slack messages for the exact authority endpoint, `issue-admission`, signed Issue authority and PRE-RICH producer terms; no public-channel results were found. Private channels/DMs were not searched because that connector path requires separate user consent.

No code behavior, Oracle datum, EEV artifact, deployment, approval, wallet, transaction or ledger state was changed by this clarification.


## 44.62 — AGENT B F4 — REGISTRY REFERENCE AUTHENTICITY FAILURE ACROSS ISSUE AND SYNCBEACON — 2026-11-12

This section records a current-branch source/CEK cross-read of the Registry findings. It supplements §§44.59–44.61; it does not reopen the already-decided trust hierarchy and does not authorize a schema or validator edit.

### Confirmed consumer-side failures

1. **Positive-price Issue/MintPolicy accepts a buyer-created Pending Registry reference.**
   - Current `plutus/MintPolicy.hs` `readRegistry` returns the first reference input whose payment credential is the configured Registry ScriptHash.
   - `newPrizeDatumValid` checks the referenced datum's target, round and `BeaconPending` status, but does not require a Registry state token, canonical full address, unique matching reference, authenticated initial creation, frozen trust mode/evidence, or independently anchored relayer authority.
   - Current `plutus/test/BeaconRegistryAdversarialTest.hs` evaluates the real compiled positive-price MintPolicy CEK with a Pending Registry reference whose `brRelayerPkh` is the buyer; the Registry is not spent and BeaconRegistry is not invoked. It explicitly records acceptance. This is CEK characterization, not yet a native Yaci Issue submission.

2. **SyncBeacon accepts an unauthenticated Ready-shaped Registry reference.**
   - The existing JEV/local-Yaci adversarial lane records `AIKEN_SYNC_BEACON_FAKE_READY_ACCEPTED=true`, which is a security-property failure.
   - The fake Registry is created as an ordinary output at the Registry payment script credential; the Registry UTxO is not spent and the BeaconRegistry validator is not executed.
   - The current SyncBeacon consumer accepts the copied Ready-shaped fields. A reference input supplies data; it does not execute the referenced spending validator.

3. **Both consumers are ambiguous on multiple references and under-bind the address.**
   - Haskell `MintPolicy.readRegistry` and `PrizeValidator.readRegistry` stop at the first matching payment ScriptHash.
   - Aiken `sync_beacon_transaction.ak::read_registry` uses `list.find` on the payment credential and returns the first match.
   - The adversarial CEK characterization also accepts two matching Registry references and accepts a lookalike address with the same payment ScriptHash but a different staking credential. Payment ScriptHash equality alone is not canonical Registry identity.

4. **The current nominated relayer field is not an authority root.**
   - `BeaconRegistry.validatePublish` does check that `brRelayerPkh` signed, derives the Beacon from the supplied context, enforces one own input and one continuing output, and preserves target/round/relayer fields.
   - However, the seven-field `BeaconRegistryDatum` has no authenticated singleton identity, and the initial Pending datum is not constrained by an on-chain creation policy. A user can create a Pending-shaped output and nominate their own PKH; checking that same PKH at Publish does not authenticate who was entitled to choose it.
   - The validator's Pending→Ready checks only execute when the Registry UTxO is actually spent. They do not protect a consumer that merely reads an arbitrary reference output.

### Root cause

The consumers currently treat a decodable datum at a matching payment ScriptHash as if it were a canonical Registry state. Cardano reference-input semantics do not run the referenced validator. Therefore, a script credential plus datum constructor/status/round/target is not proof of an authenticated Registry lifecycle.

A unique state token alone is necessary but not sufficient unless its complete lifecycle is constrained:
- it must be minted only by the canonical initial-creation policy/state transition;
- it must be placed in the canonical Registry UTxO with the initial Pending datum;
- the Registry validator must require exactly one token in the unique consumed Registry input and exactly one in its unique continuing output, with no burn/reissue route;
- the immutable token identity must bind the canonical round identity;
- every consumer must require exactly one matching Registry reference, exact canonical Registry address (including staking credential where applicable), exactly one correct state token in that UTxO, the expected round/target and status, and the frozen trust/evidence commitment;
- readers must reject zero or multiple matches, malformed matching datums, wrong token quantity/policy/name, wrong credential/address and duplicate-round anchors. Never select the first match.

The nominated publisher/relayer authority must also be bound independently of a freely-created Pending datum. Its authorization must derive from the selected trust mode and an authenticated configuration/proof/attestation boundary; it cannot be self-nominated by the transaction that creates Pending.

### Reconciliation with the accepted trust policy and §§44.60–44.61

Preserve the existing normative priority exactly: **B3_VERIFIED → B2_ATTESTED → B1_AUTHORIZED**. Descend only after the stronger tier has a specific reproducible qualification failure; record attempted tiers, failure codes and evidence digests; freeze the selected mode and evidence for the round; never silently downgrade. Do not ask the user to choose this hierarchy again.

The prior technical direction in §§44.60–44.61 remains the smallest-delta direction to evaluate: extend the existing Registry with a canonical round identity/anchor and frozen trust/evidence commitment, together with an on-chain one-round/one-anchor invariant. The round-counter/singleton or per-round one-shot-seed approaches remain candidates for the missing uniqueness rule. Do not assume a deterministic token name alone makes an anchor unique, and do not reuse the Genesis carrier token or identity for BeaconRegistry without a separately specified binding.

The trust commitment must be consistently enforced by round creation, the initial-anchor mint/creation boundary, BeaconRegistry Pending→Ready, MintPolicy Issue, SyncBeacon, and the ticket commitment/Reveal verification interface. The existing ticket commitment is recomputed on both Issue and Reveal; changing only Issue is invalid. Any commitment/schema compatibility work remains gated by the versioned migration plan and explicit authorization already required by §44.60/§44.61.

### Required adversarial acceptance matrix

- Buyer creates Pending with buyer-selected relayer and attempts positive-price Issue using it: reject at ledger.
- Buyer creates a Ready-shaped non-derived datum without spending canonical Registry state: reject at SyncBeacon.
- Two Registry references with the same payment ScriptHash, including one valid and one malformed/lookalike: reject as ambiguous; do not use ordering.
- Same payment ScriptHash with wrong staking credential/full address: reject.
- Wrong/missing/duplicated Registry state token, wrong token policy/name/quantity, token in a non-canonical output, attempted burn/reissue: reject.
- Duplicate Pending anchors for one canonical round: impossible to create or unusable by Issue and SyncBeacon.
- Valid canonical Pending→Ready transition: token/value/round/target/trust/evidence commitment remains bound; only the selected mode's independently authenticated authorization can publish.
- Issue consumes only the exact canonical Pending anchor; SyncBeacon consumes only the exact canonical Ready anchor.
- B3→B2→B1 fallback is accepted only with the frozen, reproducible qualification record; missing evidence, failed verifier, timeout or unavailability never silently downgrades.

These cases must be exercised across the actual Haskell and Aiken consumers that remain in the selected live path, first in CEK/unit fixtures and then with native local-Yaci transactions that classify script rejection separately from builder/resource failure.

### Disposition

- Registry-backed positive-price Issue trust boundary: **BLOCKED**.
- SyncBeacon Registry authenticity and ambiguity: **BLOCKED**.
- Canonical one-round/one-Registry anchor and independently bound publisher authority: **NOT IMPLEMENTED / DECISION-DESIGN GATE OPEN**.
- B3→B2→B1 trust policy: **ALREADY DECIDED / PRESERVE**.
- No Haskell/Aiken validator, datum ABI, ticket commitment, economics, V3 carrier or deployment was changed in this audit.


## 45.68 AGENT A — TREASURY RESERVE / PROTECTED CAPITAL / INITIAL ISSUE RECONCILIATION (2026-11-13)

**Audited HEAD:** `5f6dbcd74eb617fc985485d413d636bbbf5dccb8`  
**Classification:** SOURCE-DERIVED ECONOMIC RECONCILIATION / NO POLICY CHANGE  
**Owner:** Agent A — PRE-RICH economics, EEV and admission  
**Scope:** Reserve role, RU/USDM unit bridge, S0 initial Issue margin and the current Haskell conformance evidence. No change to 500×, V3, Reveal, R7, EEV policy or Treasury allocation.

### 1. Exact EEV unit bridge

The inspected source chain confirms that the two monetary pairs at the Issue gate deliberately use different scales:

- `Adapter/CARDANO/observation/DirectUsdmEev.ts` observes the exact configured physical tUSDM in the exact B1 Pool UTxO and returns **USDM sub-units**. It uses six ledger decimals and 100 IMMORTAL USDM sub-units per accounting USDM.
- `relayer/preprodIssueObservationReader.js` verifies that the signed pre-EEV and candidate-EEV amounts both equal the exact physical Pool observation. It then applies `usdmSubunitsToReferenceUnits`: exact division by 100, with a remainder rejected. It passes the normalized values to the Haskell decision as **IMMORTAL reference units (RU)**.
- The same reader leaves `availableExecutableLiquidity` and `requiredImmediateLiquidity` in **USDM sub-units**. They are an immediate-settlement pair and are not converted into RU.
- `PRE-RICH/onchain/PreRichIssueDecision.hs` documents and enforces this input contract: pre/candidate EEV in RU; immediately executable liquidity and its requirement in USDM sub-units.

Therefore, for the historical diagnostic amount of 1,000,000,000 tUSDM atomic units, the direct observer produces 100,000 USDM sub-units and the Issue reader normalizes this to 1,000 RU. This is a conversion of the exact approved Preprod asset identity, not a generic USD/USDM parity claim. A Nov-12 snapshot of that amount remains a historical deployment candidate requiring live revalidation; it is not a current EEV approval.

### 2. What the latest unchanged-EEV test proves

Commit `5f6dbcd74eb617fc985485d413d636bbbf5dccb8` changes only `plutus/test/EconomicAdmissionTest.hs` relative to its immediate parent. The added S0 case is explicitly synthetic:

- pre-EEV = 500 RU and candidate-EEV = 500 RU;
- immediately executable liquidity = 500 USDM sub-units, a separate unit/field;
- required immediate liquidity = 0;
- the initial `Issue(0,1)` adds 500 RU worst-case exposure;
- the candidate remains solvent exactly at 500 RU and is rejected at 499 RU;
- synthetic RawSurplus falls from 500 RU to zero, an exact 500 RU headroom erosion.

This correctly tests **unchanged EEV at Issue**. It is not a live Pool observation, a deployment approval, a first-ticket transaction or a test that a TicketSale payment increases Pool EEV. The 500 USDM sub-units in the fixture are 5 USDM and must not be read as 500 RU.

### 3. Four different meanings that must stay separate

1. **B1 `ppUnresolvedReserve` / V3 `v3UnresolvedReserve`:** aggregate face price of unresolved tickets. For the first 1-RU ticket this increases by 1 RU.
2. **WorstCaseExposure:** 500 × unresolved face exposure under PRE-RICH V1. This is the deterministic maximum-payout amount and is included in ProtectedCapital.
3. **V3 `ReserveProtection`:** a distinct protected-capital component, also added to ProtectedCapital. It is not a Treasury balance or a spendable budget.
4. **PRE-RICH Treasury “Reserve” category:** an intended internal accounting position within the single Treasury custody perimeter. No authenticated Reserve category balance, posting path or debit path is currently demonstrated in B1.

Agent B's source review of the legacy adapter confirms that the B1 projection sets generic SafetyCapital, ReserveProtection and MandatoryFutureCosts to zero; the legacy B1 representation has no Treasury Reserve field, and the V3-to-legacy conversion rejects non-zero values for those unsupported components. A legacy Reserve destination script hash is not a balance or an accounting posting.

Accordingly, a Treasury Reserve balance cannot be mapped to `v3ReserveProtection` by name, used to reduce WorstCaseExposure, or counted as B1 PrizePool liquidity while it remains outside the selected Pool EEV perimeter. Any future Reserve-backed Pool funding needs exact-asset source custody, an explicitly authorized category debit, the physical Treasury-to-Pool transfer, exact Pool credit, and an atomic post-state solvency check. It must not double-count assets still held by Treasury.

### 4. What Reserve could usefully cover — and what it cannot

Agent B's source-level review confirms no counterexample to the enforceable 500× **normal payout amount** bound under the stated assumptions: every normal ticket payout is validator-computed and capped at 500× its ticket price, and every unresolved ticket is represented exactly once in aggregate Pending face exposure. A statistical PMF misspecification changes the probability of reaching the maximum, not the maximum amount enforced by the validator. It is therefore not sound to describe an unallocated Treasury Reserve as a substitute for, or a reduction of, the existing 500× protection.

A separate pathwise Reveal headroom condition does exist. Let `F` be the aggregate remaining unresolved face exposure and `P_last` the price of the final unresolved ticket. Because the Reveal pre-check evaluates the pre-transition EffectivePool while that final face reserve is still deducted, the all-maximum path requires:

`E_free >= 500 × F + P_last`

For homogeneous 1-USDM tickets, a 4,000-USDM pool meets the 500× aggregate amount boundary for eight tickets, but the inspected pre-Reveal predicate supports only seven at that exact boundary; 4,001 USDM is needed to execute the eighth maximum Reveal in that order. This is a **pathwise liveness/headroom** distinction, not evidence that the 500× payout amount is understated, and it does not authorize changing Reveal or WCE semantics.

A funded Reserve could potentially be evaluated as a source of that additional physical headroom, but only through an adopted PRE-RICH posting/funding rule and an authorized, exact-value Treasury-to-PrizePool transfer. No minimum, percentage, trigger, target or automatic Reserve use is selected here. The batch target remains an execution trigger, not an allocation rule or spending authority.

### 5. R1/C1 and current verification status

- The S0 Issue margin change remains `Δ(EEV − ProtectedCapital) = −500 RU` when EEV is unchanged. The new test now demonstrates this boundary directly; it does not establish global T-EROSION, an alternative R1 certificate, or Kc/Ω closure. R1/Kc/Ω remains OPEN.
- The exact direct-USDM-to-RU conversion is implemented and verified at the Preprod reader boundary. C1 is still not producer-closed because the six ProtectedCapital components need authoritative, exhaustive, disjoint, same-snapshot provenance and PA1–PA7 certification.
- Cardano Adapter Sale Conformance [#43367228343](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43367228343) completed SUCCESS on this exact HEAD; this verifies the selected TypeScript/adapter suites, not the changed Haskell test.
- IMMORTAL Haskell Semantic Conformance [#43367228583](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43367228583) was still in progress at inspection, at `Compiled MintPolicy B1 Value-preservation conformance`; `Economic Admission conformance` had not yet run. No Haskell PASS is claimed.
- PRE-RICH Emulator Reveal Conformance [#43367228086](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43367228086) failed at its real Reveal emulator conformance step. This is a separate Reveal gate; the diagnostic-only follow-up steps succeeded. It is not evidence that this test-only Issue commit changed Reveal.

### 6. Non-regression and next safe action

- No allocation percentage, Reserve target, new account authority, statistical guarantee, R7 delta or spending power is introduced.
- No production economic source, 500× rule, V3 transition, Reveal semantics, B1 datum/redeemer or on-chain state is changed.
- No first Issue, signature, deployment approval or Preprod transaction is authorized by this reconciliation.
- Next: complete the exact-head Haskell run; then keep the Agent A work on the C1 source/provenance producer and the Treasury category ledger evidence contract. Any Reserve-to-Pool use must remain blocked until the category debit and physical source-to-destination transfer are proven.

**Disposition:** Reserve is a separate Treasury accounting intention, not `ReserveProtection` and not immediately spendable Pool liquidity. Its most concrete potential utility identified here is separately authorized Reveal liveness headroom; the current code does not yet implement or authorize that path.


## 45.69 AGENT A — C1 PROTECTEDCAPITAL PRODUCER: SIX-COMPONENT SOURCE/PROVENANCE CROSSWALK (2026-11-13)

**Audited source HEAD:** 16a2961118f0288b5f8a5eae58f8f7f8c1418196  
**Classification:** SOURCE-DERIVED PRODUCER GAP / PROFILE CONFORMANCE AUDIT — NOT CERTIFIED  
**Owner:** Agent A — PRE-RICH economics, EEV and admission  
**Scope:** Current direct-USDM Issue reader, V3/B1 reconciliation, signed authority payload and the six ProtectedCapital terms. No change to R7, 500×, V3, Reveal, ABI, Treasury allocation or deployment.

### 1. Executive finding

The current Issue path has an **integrity-bound aggregate ProtectedCapital witness**, but it does not yet have a **PA1–PA7-certified component producer**.

The source chain does the following:

1. The Preprod reader observes the exact Counter, B1 Pool, V3 carrier and B2 control singleton UTxOs.
2. It decodes the B1 Pool datum and V3 carrier state, requires exact RU/USDM conversion and reconciles the monetary aggregates represented by both.
3. The signed Issue authority supplies six ProtectedCapital component amounts and a total. The signed payload binds the provenance reference to the V3 carrier reference and the viability certificate to the same carrier/state hash/EEV snapshot.
4. The Haskell Issue producer independently computes the six numeric terms from the decoded pre-state, including the PRE-RICH 500× WorstCaseExposure, and emits them as V3_PRESTATE_CANONICAL_HASKELL.
5. The TypeScript authority/provider compares the signed component values against the Haskell-computed values; the runtime checks six non-negative amounts, their sum, and the carrier reference.

These are useful same-state and arithmetic integrity controls. They do **not** prove that every underlying obligation was observed, that the three generic protection amounts have an independently qualified economic source, or that the six amounts represent disjoint commitment populations. The signature authenticates what the configured signer asserted; it does not, by itself, prove the assertion's source authority, exhaustiveness or classification.

### 2. Component-by-component source map

| ProtectedCapital component | Current observable/derivation | What is already checked | Unclosed evidence obligation |
|---|---|---|---|
| CrystallizedLiabilities | B1 ppPendingLiabilities and V3 v3CrystallizedLiabilities; B1 sub-units are exactly normalized to RU | Reader reconciles B1 and V3 values on the observed Pool/carrier cut; Haskell recomputes the component from the V3 pre-state | No independent complete population witness for every accepted, unpaid winning Prize obligation; no full L1 ticket-to-aggregate replay in this Issue read path |
| WorstCaseExposure | Haskell kernel derives PRE-RICH V1 500 × Σ(classPrice × unresolvedCount) from the eight V3 class states | Canonical class IDs/prices, class exposure and aggregates are validated; B1 face reserve/count are cross-checked against V3 after exact unit conversion | The Issue reader does not enumerate the complete live Pending/BeaconReady Prize UTxO population. Aggregate agreement between B1 and V3 is not a separate proof that every ticket is represented exactly once or that neither aggregate omitted a ticket |
| SafetyCapital | Scalar field on the V3 carrier | Haskell uses the same pre-state scalar; the signed authority value must match the Haskell result; legacy B1 lifting sets it to zero | No typed source, legal/economic perimeter, amount derivation, time horizon or disjointness witness. Do not infer that it is zero in a non-legacy V3 deployment merely because the legacy adapter cannot represent it |
| ReserveProtection | Scalar field on the V3 carrier | Same carrier/signature/Haskell numeric binding as above; legacy B1 lifting sets it to zero and reverse projection rejects non-zero values | No qualified mapping to a Treasury Reserve custody/category balance, no authorized source debit/posting, and no proof that it is disjoint from WCE, Jackpot, SafetyCapital or other cohort commitments |
| LockedJackpot | B1 ppLockedJackpot and V3 Jackpot lockedAmount | Reader reconciles B1/V3 amount and Jackpot threshold; Haskell includes the exact V3 locked amount | Candidate L2 mapping still needs proof of the funding/locking lifecycle, binding conditional commitment, no overlap with L1/L3 or another category, and full same-state asset/custody backing |
| MandatoryFutureCosts | Scalar field on the V3 carrier | Haskell carries the same pre-state amount; signed authority and Haskell output are compared; legacy B1 lifting sets it to zero and reverse projection rejects non-zero values | No complete cost-obligation register, payer/beneficiary/horizon classification, conservative derivation or PA3 proof. The same payment is not yet reconciled against Fs(P), Fr(P), Fc(P) and the Issue cohort so it cannot be shown not to be double-counted |

### 3. Exact integrity boundary — what the types do and do not encode

At the inspected HEAD:

- IssueProtectedCapitalProvenance and ProtectedCapitalProvenance contain one sourceReference, six integer amounts, two accounting inputs (unresolvedReserve, unresolvedTicketCount) and total. They have no per-component source/verification reference, derivation version, timestamp/slot, unit declaration, evidence digest, canonical R7 cell classification or disjointness witness.
- relayer/signedIssueAuthority.js::validateProtectedCapitalProvenance checks the six named fields, non-negative integers, arithmetic sum and the single source reference. Signature verification binds the payload but does not add the absent component evidence.
- plutus/export/IssueAdmission.hs::protectedCapitalToJSON derives CrystallizedLiabilities, WorstCaseExposure, SafetyCapital, ReserveProtection, LockedJackpot and MandatoryFutureCosts from the canonical V3 pre-state. Its sourceType is V3_PRESTATE_CANONICAL_HASKELL; this establishes deterministic recomputation from the carrier, not the source authority of the carrier's underlying assertions.
- relayer/preprodIssueObservationReader.js directly queries Counter, Pool, V3 carrier and B2 control. It reconciles B1/V3 monetary aggregates but does not read the PrizeValidator address or enumerate live ticket UTxOs in this Issue observation.
- PRE-RICH/src/PreRichCardanoObservationProjection.ts can derive unresolved counts/reserve/exposure from a supplied ticket array and compare those totals with the Pool datum. The existence of that projection does not prove that the current Preprod Issue provider actually supplies it from a complete, authoritative ledger population.

Therefore do not describe the current one-reference/six-amount structure as per-component provenance or as an R7 certificate. It is an authenticated aggregate assertion plus deterministic recomputation and cross-field consistency checks.

### 4. PA1–PA7 consequences

| PA requirement | Current consequence from this source review |
|---|---|
| PA1 — profile instantiation | Candidate L1/L2/L3 mapping exists, but SafetyCapital, ReserveProtection and MandatoryFutureCosts remain untyped by canonical commitment cell |
| PA2 — exhaustive coverage | OPEN: no complete asset/obligation inventory; current Issue reader does not independently enumerate the Prize ticket population or all other protocol obligations |
| PA3 — disjointness | UNPROVEN: no per-component obligation identity/perimeter witness; mandatory future costs are not fully reconciled against the class cost surface |
| PA4 — deterministic valuation | PARTIAL: L1/WCE/Jackpot arithmetic exists; three generic fields lack fully instantiated source/valuation contracts |
| PA5 — permitted transition deltas | PARTIAL: Issue/Reveal/Claim/Expire arithmetic exists, but the full population and source-to-settlement chain is not replayed in one certified inventory |
| PA6 — L6 empty in executable states | NOT DISCHARGED: aggregate equality and six-term summation cannot detect an omitted commitment that is absent from every submitted input |
| PA7 — adversarial omitted-commitment review | OPEN: omitted-ticket, hidden-liability, alias/overlap and cost double-counting cases do not yet have a complete producer-level rejection/evidence matrix |

### 5. Minimum closure artifact — evidence contract, not a new economic rule

Before a production producer can be called C1-closed, its evidence packet needs to give each component a separately replayable record, bound to the same canonical observation envelope:

- canonical component ID and R7 classification (L1/L2/L3);
- non-negative exact integer amount and explicit reference unit;
- source UTxO/ledger/event or mandatory-cost declaration reference;
- verification predicate and independent verification reference;
- observation point (network, acquired slot/point, timestamp) and state hash;
- derivation/profile version and evidence digest;
- obligation identity/population, payer, beneficiary and time horizon where applicable;
- explicit non-overlap key or replayable proof that the commitment is not already represented by another PC component or by Fs/Fr/Fc;
- completeness rule for the relevant source population, including how missing, duplicate, stale, spent, unclassified or conflicting records fail closed.

The packet must replay the six values independently, compute the sum, derive signed C = EEV − ProtectedCapital, derive RawSurplus only after the signed solvency check, and compare the replayed result to the exact Haskell decision/carrier/Issue action. A total-only checksum is necessary but insufficient.

This is an evidence/schema requirement, not authorization to create a new Treasury category, choose a Reserve target, assign a cost coefficient, set an absent field to zero, modify the B1 datum, or alter the current V3/Reveal behavior.

### 6. Next safe action and disposition

1. Keep the current B1/Pool↔V3 cross-check and exact RU conversion unchanged.
2. Treat CrystallizedLiabilities, WCE and LockedJackpot as the three partially sourced components; do not claim full population closure until L1/L2/L3 source coverage and replay exist.
3. Treat SafetyCapital, ReserveProtection and MandatoryFutureCosts as **unqualified input fields** until their own typed source/derivation/perimeter evidence exists. The legacy adapter's zero projection is not proof that a non-legacy producer may safely assert zero.
4. Do not count Treasury Reserve as ReserveProtection or PrizePool EEV. A future transfer needs a separately authorized source debit and exact physical destination credit.
5. Keep C1 / PA1–PA7 OPEN. No current Issue signature, R1/Kc/Ω certificate, USD/USDM source qualification or first-ticket authorization is produced by this audit.

No production source, test, workflow, policy, datum/redeemer ABI, V3/Reveal semantics, 500× parameter, wallet, transaction, deployment or ledger state was changed. No test or CI PASS is claimed by this documentation-only review.

**Disposition:** the current producer proves aggregate integrity relative to one V3 carrier, not completeness/disjointness of the underlying commitment partition. C1 remains **NOT PRODUCER-CLOSED**.

## 45.70 AGENT A — C1 LIVE CENSUS / R1-Kc EVIDENCE BOUNDARY REVALIDATION (2026-11-13)

**Audited source HEAD:** `1e7becb03537eb218c0c8d67ae8a5a181bf7359f`  
**Classification:** SOURCE-BASED RECONCILIATION — READ-ONLY CENSUS REVIEW; NO CERTIFICATION OR ADMISSION AUTHORITY.

### 1. Refinement to §45.69: a ticket census exists, but it is not the Issue producer

The repository contains a dedicated read-only Preprod census path that was not part of the runtime Issue reader reviewed in §45.69:

- `audit/cardano-integration/preprod-protected-capital-census.mjs` derives the PrizeValidator and B1 Pool topology from the checked-out scripts and a deployment-identity bundle, scans both addresses through `relayer/koiosProtectedCapitalSourceCensus.js`, parses PrizeDatum records, and builds `PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts`.
- The Koios source requires exact `Content-Range` totals, reconciles page offsets and page lengths, rejects duplicate or wrong-address references, validates `is_spent=false`, records response-body digests, checks datum bytes/hashes, and requires the ledger tip hash/slot/block height to remain identical before and after the multi-address scan.
- The item ledger independently classifies the observed PrizeDatum population and checks L1 payout totals against B1 pending liabilities, L3 face-price totals against B1 unresolved reserve, and L3 counts against the B1 unresolved-ticket count.

This is a material audit capability and narrows the earlier finding: a full address enumeration mechanism exists for the PrizeValidator ticket population. It does **not** close the producer gap, for reasons made explicit by the implementation itself:

- `paginationComplete=true` describes successful reconciliation of the provider-reported pages; it is not proof that the provider supplied every ledger UTxO.
- The census output hard-codes `sourceCompletenessAuthorityVerified=false`, `providerAttestationVerified=false`, `providerSnapshotPinned=false`, `sameBackendSnapshotVerified=false`, `fullProtectedCapitalQualified=false`, and `r7L6EmptinessProven=false`.
- The item-ledger type fixes `sourceCompletenessAuthorityVerified=false` and `fullProtectedCapitalQualified=false`, with scope `PRIZE_VALIDATOR_TICKET_POPULATION_ONLY`. Its own documentation says completeness metadata cannot prove that an upstream provider actually returned every page.
- L2 lifecycle remains an aggregate observation; consumed expiry history requires transaction replay; L6 absence is not certified; the census does not source SafetyCapital, ReserveProtection or MandatoryFutureCosts.
- The live census is a separate audit workflow. `relayer/preprodIssueObservationReader.js` still does not consume its ticket records or enumerate the PrizeValidator population for the authoritative Issue decision.

Therefore the census can establish a useful **internally reconciled, provider-observed ticket ledger**, not a complete, authenticated PA1–PA7 source producer. Its current boundary must not be upgraded merely because the pagination and arithmetic tests pass.

### 2. Historical census result — not a current admission witness

The latest detailed census report inspected is the 2026-11-06 read-only campaign:

- Koios observed zero PrizeValidator UTxOs and one B1 Pool singleton. The ticket-item ledger internally reconciled zero L1/L3 items to the Pool aggregates at that observation.
- The observed Pool carried 1,000,000,000 atomic units of the configured direct-tUSDM asset, deterministically represented as 100,000 USDM subunits (1,000 USDM units at the declared 100-subunit scale). This is physical configured tUSDM quantity, not a USD/USDM market quote or a parity claim.
- A separate Ogmios query corroborated the Pool out-reference and datum bytes, but it was 248 slots later. It is corroboration at a different chain point, not one shared atomic snapshot.
- The Oracle State quote was stale by approximately 28.52 days against a one-hour maximum-age parameter. Its datum alone did not establish an external USD/USDM source.
- A subsequent direct-USDM EV1–EV7 qualification was mechanically qualified for the exact physical tUSDM profile, while the source set remained `OBSERVED_NOT_QUALIFIED` and deployment approval remained `PENDING / NOT CREATED`.

These are dated observations and qualification artifacts, not a live 2026-11-13 read, not a current deployment approval, not a USD/USDM source qualification, and not R1 or PA1–PA7 evidence. A fresh observation would still need an authenticated completeness/authority path and the separate human deployment-approval binding before being used in Issue admission.

### 3. R1/Kc/Ω revalidation — the certificate remains absent

The current S0 proof boundary is unchanged:

- The only V3 economic action available at the declared S0 is `Issue(0,1)`. With unchanged EEV and the V1 500× WCE, the unclamped margin `b = EEV − ProtectedCapital` decreases by exactly 500 RU. Additional initial solvency headroom does not turn this transition into a non-eroding QNE witness.
- The `allOmegaSuccessorsCertified` value passed to the admission path is a caller-supplied Boolean. It does not enumerate, authenticate or prove completeness of the authoritative Ω successor set.
- The pure lifecycle/QNE helper checks a supplied non-empty witness list, but the reviewed Genesis and Issue execution boundaries do not invoke it as a transaction-bound action/certificate. It is not reachable as `Wit(S0)` in the current profile.
- A general R1 certificate still requires a concrete total `χ`/`Wit`, VC1–VC6, authoritative or soundly over-approximated Ω, the complete deployment evidence package and an exact deployment binding. No such deployment-bound certificate was found.
- The certification manifest still leaves G4 (Protected Capital / Economic Gate / V3↔Cardano) and G7 (deployment certification, including the viability-Kc-Ω certificate) OPEN with empty evidence arrays. The Haskell Semantic Conformance run #444 later completed successfully, but it ran on the earlier commit `5f6dbcd`; its `B-R1 Risk Protection bridge scaffold conformance` step is scaffold conformance, not a deployment certificate.

No theorem that `K* = ∅` is inferred from the local S0 obstruction. Conversely, the local result is sufficient to reject the claim that the current S0 Issue action already supplies the T-MARGIN/QNE witness.

### 4. Operational disposition

1. Keep the separate census as a read-only audit tool; do not call its current output a complete or authoritative producer.
2. Do not feed its Koios records into runtime Issue admission until source authority, completeness, snapshot binding and the transaction-bound handoff are independently specified and verified.
3. Keep the six ProtectedCapital terms and PA1–PA7 open as recorded in §45.69. A ticket census alone cannot qualify the three untyped scalar components or prove disjointness.
4. Keep R1/Kc/Ω MISSING and Issue #37 BLOCKED. Do not replace the missing certificate with a Boolean, a sampled Ω list, a historical artifact or the Haskell scaffold test.
5. No new economic coefficient, R7 policy, Treasury posting, Reserve treatment, Issue rule, V3/Reveal semantic, ABI or deployment is authorized by this review.

The separate Flux test failure was also traced to `deriveCardanoIssueTimeAnchor`: its prior round-trip checked only time→slot after slot→time, allowing a timestamp one millisecond after the actual slot boundary. Commit `1e7becb03537eb218c0c8d67ae8a5a181bf7359f` adds a preceding-millisecond boundary check matching the existing regression test. This narrows the Issue time-anchor validation only; it does not change expiry horizons, economic rules, V3 or Reveal. The focused PRE-RICH Expiry Refinement Conformance #28 passed on the source-fix commit; the broader Flux DoD and Emulator Reveal workflows were still in progress at this documentation snapshot.

**Disposition:** the ticket census is a stronger internal observation tool than the production Issue reader, but it is deliberately not certified for source completeness or full ProtectedCapital. The R1/Kc certificate and current first-Issue authorization remain **MISSING / BLOCKED**.

## 45.71 AGENT A — CURRENT PREPROD ACQUIRED-POINT OBSERVATION AND DIRECT-USDM RECONCILIATION (2026-11-13)

**Evidence workflow:** IMMORTAL Cardano Preprod Context #1034, run `43371927089`, source commit `1e7becb03537eb218c0c8d67ae8a5a181bf7359f`.  
**Classification:** CURRENT READ-ONLY PREPROD OBSERVATION + CURRENT SCRIPT-PROVENANCE MATCH; NOT EEV DEPLOYMENT APPROVAL, NOT PA1–PA7, NOT R1/Kc.

### 1. One exact acquired ledger state

The authenticated Demeter/Ogmios v7 session acquired one ledger state and queried the wallet, PrizeValidator and B1 Pool UTxOs while that state remained acquired:

- slot: `138864340`;
- block hash: `19f47d7c91f0e93ebb48166a1cb677f7c74ff96b11b2d3937a8ca3cff7a11a3e`;
- acquisition and query tip matched exactly;
- context digest: `e4266d5b73926901499a8f66fb4461b23c9ed1e3575f22f62eacf7a58eb92c58`;
- PrizeValidator packet digest: `3e4eaf730894ee72ef5d55a59b9b8f93bbb3d7e8adafd6181f6b0bf531f8f2c5`;
- B1 Pool packet digest: `fa38a1bebec2f2df3384906796ca0a07d2a3519e66b344e2a13dab43a15c5af2`.

The PrizeValidator query returned **zero UTxOs**. The B1 Pool query returned exactly one UTxO, `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`. Unlike the 2026-11-06 Koios/Ogmios observations, these two current address queries are tied to the same acquired ledger point, not merely two nearby tips.

### 2. Address provenance was independently re-derived at that same point

The accompanying `preprod-b1-script-provenance.json` artifact is `PASS`, with 20/20 checks and digest `fa870920a528c735991be70c241fb42c9e96429779cd0a4e5d24e0abd1c6878b`. It binds the exact context/Pool/Prize/wallet packet hashes and the same slot/hash above, then confirms:

- the observed PrizeValidator address and payment credential equal the address/hash derived from the current parameterized Plutus V2 Prize factory;
- the observed B1 Pool address and payment credential equal the current parameterized Pool factory;
- the Pool datum's `ppPrizeHash` equals the current derived PrizeValidator hash;
- the observed Pool UTxO is at that exact Pool script address;
- the runtime and exported factory artefacts are byte-identical for both scripts;
- the singleton Pool authority and Oracle State identities are derived from the observed wallet payment-key identity.

This supersedes the earlier *unrevalidated historical-candidate* status for the two payment credentials at this exact point. It does not create a provider attestation or deployment approval, and it does not claim that a ticket was ever minted or that a Reveal was submitted.

### 3. Exact Pool value and eight-field B1 datum

The Pool UTxO carries:
- 5,000,000 lovelace for the output's ADA component;
- one configured B1 Pool authority singleton;
- `1,000,000,000` atomic units of the exact configured Preprod tUSDM asset, unit `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`.

The raw inline datum decodes as the current eight-field `B1PrizePoolDatum`, with these values:

| Field | Observed value |
|---|---:|
| `ppTotalLiquidity` | 100,000 USDM subunits |
| `ppPendingLiabilities` | 0 |
| `ppUnresolvedReserve` | 0 |
| `ppUnresolvedTicketCount` | 0 |
| `ppLockedJackpot` | 0 |
| `ppJackpotThreshold` | 10,000 USDM subunits |
| `ppSuspendedClasses` | 0 |
| `ppPrizeHash` | exact current PrizeValidator hash |

Under the already accepted narrow Preprod direct-tUSDM profile (six ledger decimals, 100 IMMORTAL USDM subunits per reference unit), the physical quantity is 1,000 test-tUSDM units = 100,000 USDM subunits = **1,000 RU**. It exactly matches `ppTotalLiquidity`. This is a strong fresh physical EEV observation for the configured B1 Pool UTxO. It is **not** a USD/USDM market quote, proof of peg/redemption, proof of Mainnet asset identity, or a statement about other Treasury balances or the separate 4,000-USDM bootstrap objective.

At this acquired point, zero PrizeValidator UTxOs and zero B1 pending/unresolved counters agree. This supports the current live PrizeValidator L1/L3 population being empty at this point. It does not reconstruct spent Claim/Expire history, prove historical L5 completeness, or make L6 globally empty.

### 4. Remaining evidence and certification boundary

The same script-provenance artifact records the Oracle State timestamp as `2026-10-08T17:38:50.142Z`; this is stale relative to the 2026-11-13 observation and cannot qualify an external USD/USDM source. The exact direct-tUSDM physical profile must remain separate from Oracle valuation.

The run's `IMMORTAL-PREPROD-CONFORMANCE-BINDING-v0.1` is `BOUND` to the source hashes and this observation, and its four executable Reveal-boundary conformance tests passed. Its own classification remains:
- `ledger_aligned_evaluator_run=false`;
- `full_end_to_end_equivalence_claim=false`.

The current point narrows two gaps in §45.70: Prize and Pool UTxOs can be queried at a common acquired point, and their current script payment credentials can be re-derived against checked-in factory artefacts. It still does not close:
- authenticated external-provider/source authority and independent backend assurance;
- the runtime Issue producer's integration of this census and its point-bound, replayable evidence;
- historical consumed-ticket/Claim/Expire replay and R7 L5/L6 proofs;
- L2 funding/lock lifecycle provenance;
- SafetyCapital, ReserveProtection and MandatoryFutureCosts component provenance and PA1–PA7 disjointness/completeness;
- USD/USDM Option B source qualification and the fresh human deployment approval;
- the deployment-bound R1/Kc/Ω certificate and VC1–VC6.

R1 disposition is unchanged: the first S0 Issue still raises WCE by 500 RU without increasing this physical EEV and therefore reduces the unclamped margin by 500 RU. The live 1,000-RU Pool means the first 1-RU class may have deterministic solvency headroom under the existing arithmetic; it does not satisfy the current T-MARGIN/QNE non-erosion condition and is not an Issue authorization.

### 5. Current CI status relevant to the same source snapshot

On source commit `1e7becb`, Flux DoD #690 completed SUCCESS, PRE-RICH Expiry Refinement #28 completed SUCCESS, and the Preprod Context #1034 completed SUCCESS. The Emulator Reveal #1063 completed FAILURE before a Reveal-spending transaction could be built:
- the script-reference publication transaction for Prize was 16,532 bytes against the canonical 16,384-byte maximum;
- the diagnostic-only oversized-size probe later passed the publication step, but the B1 value probe intentionally stopped at the price-mismatch guard;
- the Prize validator diagnostic reported a non-polymorphic CEK instantiation error;
- negative Reveal cases were inconclusive because they stopped at build;
- the normal Reveal build then reported `Blockfrost not set. Can't calculate ex units`.

Therefore no real Reveal acceptance/failure semantics are inferred from this run. In particular, the 16,532-byte failure is at the preceding script-publication transaction, not evidence that the Reveal-spending transaction itself exceeded 16,384 bytes.

**Disposition:** Preprod now has a materially stronger common-point physical Pool/ticket observation with current script provenance. It confirms 1,000 RU direct physical tUSDM in the B1 Pool and zero live ticket UTxOs at that exact point, but it does not remove the external valuation, ProtectedCapital producer, R1/Kc/Ω, deployment approval or Reveal execution blockers. No on-chain transaction, wallet signature or deployment was performed by this observation.

## 45.72 AGENT A — GENESIS 4,000-USDM BOOTSTRAP: ON-CHAIN REVALIDATION AND PREPROD AUTHORITY GAPS (2026-11-13)

**Classification:** PRE-RICH APPLICATION GATE AUDIT — SOURCE-BASED; NO NEW ECONOMIC RULE OR DEPLOYMENT AUTHORITY.

### 1. Keep the two monetary requirements separate

The PRE-RICH Genesis bootstrap condition is **verified PRE Treasury value >= 4,000 USDM** (400,000 USDM subunits). It values the exact canonical PRE asset by the configured PRE/USDM Oracle quote. It is not the B1 PrizePool's direct physical tUSDM EEV, does not transfer Treasury value into the PrizePool, and does not grant PrizePool liquidity or reduce WCE/ProtectedCapital.

The current acquired-point observation in §45.71 is only **1,000 RU of physical configured tUSDM in the PrizePool**. It says nothing about the amount or verified value of canonical PRE in the Treasury. The Genesis threshold, PRE asset identity and Treasury observation must be evaluated as a distinct source perimeter.

### 2. What the on-chain Genesis carrier actually revalidates

The current `PRE-RICH/onchain/GenesisRegimeCarrier.hs` contains a concrete `ActivateGenesis` validator. It is more than an off-chain Boolean gate:

- The continuing carrier datum must move from the `PRE_GENESIS` tag to `GENESIS`, and increment both transition nonce and state version exactly once. Its Treasury script hash, PRE policy/name, Oracle singleton policy/name, publisher, carrier identity and PrizePool hash must remain unchanged.
- The consumed and continuing carrier UTxOs must each contain exactly one configured carrier token; transaction-wide carrier input/output quantities are checked and the complete carrier Value must be preserved.
- A Treasury reference input is found by the configured `prdCanonicalTreasury` payment ScriptHash and must carry a decodable `TreasuryDatum`.
- An Oracle reference input must carry the configured Oracle singleton, decode to a quote for the exact PRE policy/name, match the configured publisher, have a non-negative price and pass `validOracleTimestamp` against the transaction validity interval.
- The validator reads the PRE quantity for the exact policy/name from the referenced Treasury UTxO, constructs the observation internally, and applies the existing integer-floor conversion at Oracle precision. The resulting value must be at least `4,000 * 100` USDM subunits.
- The transition is restricted to the carrier only: it may not consume or create a B1 PrizePool script input/output. Treasury and Oracle remain reference inputs, not spent inputs.

Thus the validator itself recomputes the valuation from transaction reference inputs; the production gap is not simply that a caller supplies `allChecksVerified=true`. The pure TypeScript runtime observer is a separate off-chain convenience and does not substitute for this on-chain revalidation.

### 3. Treasury identity binding is narrower than a canonical Treasury-state proof

A remaining source-authority question is visible in `findSingleTreasuryReference`:

- It matches the **payment ScriptHash** stored in the carrier datum, not a complete canonical Cardano address or an independently authenticated Treasury UTxO identity token.
- It accepts a reference input when the `TreasuryDatum` can be decoded. It does not validate the decoded TreasuryDatum's percentage/threshold fields as part of Genesis admission.
- A reference input does not execute the Treasury spending validator. `plutus/Treasury.hs` validates its legacy `Distribute` conditions only when that UTxO is spent.
- The helper rejects multiple matching Treasury script references supplied in the same transaction, but this is not a global ledger census or proof that the referenced UTxO is the sole canonical Treasury state. It also does not compare the full address/staking credential.

This does **not** mean arbitrary assets can be spent from the script address: spending remains subject to the Treasury validator. It means the Genesis proof currently defines Treasury identity at the payment-script-hash + decodable-datum boundary. Whether that is the intended canonical Treasury identity must be explicit. If the intended authority is a unique reviewed Treasury UTxO/full address or a lineage-bound state, the current helper alone does not prove it. Do not silently upgrade this narrower check into a complete Treasury provenance certificate.

### 4. One-shot carrier identity is unique per seed, not globally self-authenticating

`GenesisCarrierMintPolicy` is correctly a one-shot factory parameterized by one exact seed `TxOutRef`; it only permits one unit with the configured carrier name and has no burn path. But different seed references produce different policy IDs. The validator reads the carrier policy/name from its datum rather than from an independently compiled production constant.

Therefore the one-shot policy provides **per-policy uniqueness**, not by itself a globally recognized production Genesis carrier identity. The actual seed reference, derived policy ID/name and canonical PRE_GENESIS carrier UTxO must be fixed in an authenticated deployment manifest/approval. The current source tree and Yaci fixture do not substitute for that production binding.

### 5. Conformance evidence versus production evidence

- `plutus/test/GenesisAdmissionTest.hs` and `GenesisRegimeCarrierTest.hs` exercise the pure admission/regime transition functions. In particular, `GenesisRegimeCarrierTest.hs` imports `PreRichRegimeState`; it does not directly execute `GenesisRegimeCarrier.mkValidator`.
- The separate `audit/pre-genesis-genesis/genesis-carrier-ledger-trace.ts` does execute the compiled validator in a local Yaci/Cardano ledger trace, checks the one-shot carrier, Oracle/Treasury reference inputs, carrier-value preservation, no PrizePool touch and replay rejection. It explicitly sets `production=false` and creates its PRE and Oracle test assets with a wallet-controlled native policy. That is meaningful local evaluator/conformance evidence, but it is not the canonical PRE policy, an authenticated Preprod Treasury, or a production deployment.
- The workflow `.github/workflows/pre-genesis-genesis-cardano.yml` is a local Yaci devnet fixture. It is not the live Preprod PRE materialization witness.

### 6. The first-Issue consumer does not bind the Genesis regime carrier

A second, separate integration gap exists between Genesis activation and the current Issue path:

- `PreRichIssueDecision.hs::IssueDecisionInput` carries the V3 economic pre-state, class/price, EEV/liquidity values, and truth/freshness/obligation/Ω Boolean inputs. It has no Genesis regime state or Genesis carrier reference.
- `relayer/preprodIssueObservationReader.js::readPreprodIssueObservation` reads the Counter, B1 PrizePool, V3 economic-state carrier and B2 control carrier. It does not read the `GenesisRegimeCarrier` address, singleton token, datum or regime tag.
- `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` composes that Issue observation with direct-USDM Pool observation and Haskell admission; it does not add a Genesis regime witness.
- The inspected `src/mint.ts` path builds the Issue transaction using the V3 economic-state carrier and BeaconRegistry/Oracle references; no Genesis regime carrier input/reference is part of its admission binding.

Consequently, the presence of a standalone `ActivateGenesis` validator does not yet establish that the first Issue can only proceed from an authenticated GENESIS regime. The Genesis action itself changes only `PRE_GENESIS → GENESIS`; the current Genesis carrier exposes no `GENESIS → ACTIVE` edge. Do not infer that either the Genesis transition or the separate V3 carrier supplies this missing Issue/regime binding. This is an integration gap, not permission to invent a new regime rule or to alter V3/Issue semantics without a governed decision.

### 7. Production Preprod materialization remains OPEN

The current `PREPROD-PRE-MATERIALIZATION-GATE-v0.1.md` records the canonical PRE identity as policy `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c`, asset name `5052452d52494348`, and explicitly states that no authoritative Preprod mint/transfer transaction or bound PRE-bearing Treasury UTxO has been established in the current evidence corpus.

The existing Treasury inventory observer is useful discovery: it derives the Treasury address from the checked-in Treasury artifact, inspects address/script-hash UTxO inventories, and discovers PRE/tUSDM holders. It does not by itself establish the canonical PRE transfer/mint provenance, calculate a fresh authenticated PRE/USDM valuation, or prove the Genesis transition. The separate configured-Treasury observer inspects tUSDM and takes its binding reference from caller-supplied configuration; it is not a canonical PRE Genesis witness.

The remaining closure chain is therefore:
1. establish the canonical PRE asset on Preprod from an authoritative mint/transfer witness;
2. prove the exact PRE-bearing Treasury state and its intended canonical identity/lineage (not merely a script payment hash plus decodable datum, unless that narrower rule is explicitly adopted);
3. bind the same transaction's fresh PRE/USDM quote to the configured Oracle singleton/publisher;
4. bind the one-shot Genesis carrier seed, policy ID and initial PRE_GENESIS UTxO to a reviewed deployment approval;
5. execute and observe the real Preprod `ActivateGenesis` transaction, including state transition, preserved references/value, replay/concurrency rejection and accounting delta.

The on-chain action currently only performs `PRE_GENESIS → GENESIS`; no `GENESIS → ACTIVE` transition is provided by this carrier. Genesis activation must not be described as first-ticket authorization or as the R1/Kc/QNE certificate. Those remain separate gates.

### 8. Disposition

The economic predicate and a real on-chain revalidation implementation exist at source level. The local Yaci trace exercises that validator, but only with synthetic PRE/Oracle identities. Production Preprod canonical PRE materialization, exact Treasury identity/lineage, canonical carrier deployment identity and an observed Preprod transition remain **OPEN**.

No PRE policy, bridge, Treasury identity rule, Oracle schema, Genesis threshold, PrizePool EEV, ProtectedCapital, R1 rule, V3/Reveal semantics, datum/redeemer ABI, wallet transaction or deployment was changed or authorized by this audit.

## 45.73 AGENT A — GENESIS CARRIER SELF-DECLARED IDENTITY AND TREASURY REFERENCE AUTHORITY (2026-11-13)

**Classification:** SOURCE-LEVEL AUTHORITY BLOCKER FOR PRODUCTION GENESIS USE; adversarial local-Yaci characterization in progress. No validator/ABI/economic change authorized.

### 1. The on-chain Genesis validator is unparameterized and trusts its own datum for every identity

The exported `GenesisRegimeCarrier.compiledValidator` is a parameterless script with the Plutus entry type `BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit`. Its `PreRichRegimeDatum` carries all of the following as datum fields:

- `prdCanonicalTreasury` payment ScriptHash;
- PRE policy ID and asset name;
- Oracle singleton policy ID and token name;
- Oracle publisher PKH;
- Genesis carrier token policy ID and name;
- PrizePool payment ScriptHash.

The validator preserves these fields between input and output, but it does not compare them with any immutable validator parameter, deployment constant, authorized marker or externally authenticated deployment manifest. Consequently, datum continuity is not identity authentication.

### 2. The one-shot mint policy does not establish one global Genesis carrier

`GenesisCarrierMintPolicy.compiledPolicyFactory` is a public one-shot factory parameterized by a caller-selected seed `TxOutRef` and carrier token name. It enforces that the chosen seed is consumed and exactly one token is minted under that derived policy; it does not authorize a particular seed or pin one resulting policy ID in `GenesisRegimeCarrier`.

The carrier validator then reads `prdCarrierPolicy` and `prdCarrierName` from its own datum and verifies one token under those same self-declared values. Its `countOwnInputs`/continuation checks are transaction-local: they constrain the carrier input/output being transitioned, but they do not establish a global singleton across all UTxOs at the unparameterized script address.

Source-level consequence: distinct users can derive different one-shot policies from different seed UTxOs, each mint a token with the same carrier name, and create separate PRE_GENESIS UTxOs at the same GenesisRegimeCarrier validator address with independently chosen datum identities. Each carrier transition can be submitted separately because the validator only requires one own-script input and one matching continuing output in that transaction. The one-shot policy prevents duplicate mint under one policy; it does not prevent multiple independent policies/carriers.

No live production second carrier is asserted here. This is a source-permitted multiplicity path, not a claim that such a carrier is deployed.

### 3. Treasury and Oracle observations inherit those self-declared identities

- `findSingleTreasuryReference` selects a reference input by the datum-supplied Treasury payment ScriptHash and accepts it when a `TreasuryDatum` decodes. It does not pin a full address, staking credential, state NFT, canonical datum hash or expected destination/threshold fields.
- `findSingleOracleReference` requires the singleton token identity, PRE quote, publisher and freshness to match the values in the carrier datum. Those checks are internally consistent, but the singleton policy/name and publisher themselves are not fixed by immutable validator parameters. With a self-created carrier datum, they are self-selected too.
- The Genesis transition does not execute the Treasury or Oracle validator; both are reference inputs.

Therefore the current on-chain validator has a correct arithmetic predicate over the values it reads, but the source identities that give those values protocol authority are not deployment-pinned by the validator itself.

### 4. The legacy Treasury datum can be caller-selected and is not checked by Genesis

`TreasuryDatum` consists only of `tdThreshold`, four recipient ScriptHashes and four percentages. Genesis currently checks its decodability, not its values.

`plutus/Treasury.hs::mkValidator` later checks:
- that a Treasury input exists;
- input lovelace meets the datum-supplied threshold;
- the four datum-supplied percentages sum to 10,000;
- each datum-supplied recipient ScriptHash receives at least its computed lovelace amount.

It does not compare recipient hashes with an immutable deployment set, require distinct recipients, require a signer/authority, or constrain where non-ADA assets in the Treasury input may be sent. If all four recipient hashes are set to one script hash and the percentages are 2,500 each, a single output at that hash carrying the whole lovelace amount satisfies each individual minimum check. The Treasury validator does not itself preserve canonical PRE in a Treasury category or restrict the PRE asset to a canonical destination.

This gives a concrete potential bootstrap bypass: a holder can construct a UTxO at the unparameterized Treasury script address with PRE and a self-selected, syntactically valid Treasury datum. The Genesis validator can count the PRE quantity without validating the datum's destinations. The same datum can define later Treasury distribution destinations. A fresh quote and a carrier with self-selected Oracle/Treasury identities compound the gap.

The exact asset-drain transaction is not yet independently executed in Yaci in this work pass; the recipient-selection and percentage checks above are direct source-level behavior. Do not describe the potential spend as a completed ledger exploit.

### 5. Existing Yaci trace now makes the weak Treasury-datum boundary explicit

The local trace `audit/pre-genesis-genesis/genesis-carrier-ledger-trace.ts` already constructed its Treasury reference with:
- threshold = 0;
- all four destination hashes equal the same fixture-selected `00…00` ScriptHash;
- percentages = 2,500 each (sum = 10,000).

The Genesis transition succeeded because it only needs the datum to decode; the Treasury spending validator is not invoked by a reference input. Commit `5d75dfc4da9428c6508411bff8b0651dcc37aa6b` adds an explicit `treasuryReferenceBoundaryProbe` record to that non-production trace, including these fields and the Genesis acceptance. Its Yaci/Cardano CI run is pending at the time of this checkpoint update; no completed execution result is claimed here.

### 6. First Issue remains disconnected from Genesis regime evidence

As recorded in §45.72, the runtime Issue reader/provider do not read a Genesis carrier or regime tag. Even a correctly anchored and activated Genesis state would not presently be bound into the first-Issue admission. Conversely, a self-created carrier cannot be treated as protocol Genesis authority merely because its own validator transition succeeds.

### 7. Required disposition before production use

The Genesis path must remain **NOT QUALIFIED FOR PRODUCTION** until an authorized design supplies and tests, without relying on self-declared datum values:

1. one globally recognized Genesis carrier identity (fixed seed/policy/name or equivalent authenticated state identity), including rejection of independently minted parallel carriers;
2. deployment-pinned Treasury identity and the intended canonical Treasury datum/configuration or equivalent authenticated Treasury-state lineage;
3. deployment-pinned Oracle singleton identity and publisher, including the expected PRE asset identity;
4. a current Issue admission binding to that exact canonical GENESIS state if Genesis is intended to gate the first Issue;
5. adversarial ledger tests for parallel carriers, forged/self-selected Treasury and Oracle references, alternate staking credentials, untrusted Treasury destinations, replay and concurrent transitions.

These requirements are an evidence/authority boundary, not a request to invent a new threshold or economics. Implementing them may require an explicit deployment/ABI decision and an Agent B/security review. No Genesis validator, mint policy, Treasury datum, Oracle schema, V3/Reveal/Issue semantics, R1/Kc rule or deployment configuration was changed.

## 45.74 AGENT A — B2 ISSUE READ IS OFF-CHAIN-BOUND, NOT ENFORCED BY THE ON-CHAIN V3/MINT PATH (2026-11-13)

**Classification:** SOURCE-LEVEL B2 / FIRST-ISSUE ENFORCEMENT GAP. No change to B2 policy, V3 state, MintPolicy, redeemer ABI or deployment authorized.

### 1. What the current Issue path does correctly off-chain

The Issue builder in `src/mint.ts` requires deployment-configured B2 address/policy/name, queries the exact configured address, requires exactly one UTxO containing the configured singleton, decodes it with `observePreprodB2Control`, checks the observed reference against the chosen UTxO, and compares `CurrentActiveClass` / `HighestClassEverActivated` with the live V3 control projection and requested class. The transaction builder includes the selected B2 UTxO in `.readFrom([...])`.

The reader `relayer/preprodIssueObservationReader.js` independently observes the B2 singleton, rejects an identity/reference mismatch, compares its two class-control values with the V3 carrier's control projection, and places the exact B2 reference in `controlStateReference`. The signed Issue authority payload requires that field and the off-chain verifier checks it equals the current expected reference. The runtime bridge also checks the returned witness's B2 reference against the caller-supplied runtime reference.

This is a real off-chain source binding; it is not merely a frontend-supplied class integer.

### 2. What the transaction validators actually authenticate

The Plutus B2 control validator is parameterized by the configured singleton policy/name and authority key. When a B2 state transition spends the carrier, it checks authority signature, exactly one own input/output, one configured token in each, complete Value preservation, valid datum, and nonce/version increments. This protects the B2 state **when B2 itself is transitioned**.

Ordinary Issue does not spend B2, so that validator is not executed. The current on-chain Issue predicates inspected here are:
- `MintPolicy.hs::mkPolicy`: checks Counter input by payment ScriptHash, Ticket mint, Prize/Registry structure, Oracle valuation, Treasury payment and B1 reservation. Its parameters do not include B2 policy/name/address, and it does not inspect `txInfoReferenceInputs` for B2.
- `V3EconomicStateCarrier.hs::mkValidator`: checks its own V3 singleton, V3 state validity/version/value continuity, state-hash endpoints and the configured Ed25519 authority signature. It does not identify or decode a B2 reference input.
- `B1PrizePool.hs`: checks the Pool accounting transition and ticket reservation; it does not authenticate B2 control.

The fact that `src/mint.ts` includes B2 in `.readFrom` therefore does not make B2 an on-chain precondition by itself. A Cardano reference input is visible to validators through `TxInfo`, but a validator must explicitly inspect and bind it for that input to become a script-enforced requirement.

### 3. The inner signature checked by V3 omits the B2 state reference

This is the decisive source distinction:

- `relayer/signedIssueAuthority.js::verifySignedIssueAuthorityEnvelope` verifies the outer signature over the canonical full payload. That payload includes `controlStateReference`, and the server-side verifier compares it with the live expected reference.
- The Plutus V3 carrier does **not** verify that outer envelope signature. It verifies only `carrierBindingSignature` over `canonicalCarrierBindingMessage`.
- `V3EconomicStateCarrier.hs::canonicalCarrierBindingMessage` commits to action class, decision reference, observation reference, pre-state hash, action fingerprint and post-state hash. It has no `controlStateReference` field.
- The current reader's `observationReference` is formed from the Counter, Pool and V3 carrier references; it does not include the B2 reference. `PreRichIssueDecision.IssueDecisionInput` likewise has no B2 reference.

Thus the exact B2 reference is authenticated in the off-chain signed Issue envelope, but is **not included in the inner signature the on-chain V3 validator verifies**, and no other inspected on-chain Issue validator requires the B2 reference. The current architecture binds B2 to the approved builder/authority service, but does not independently enforce the B2 reference on-chain as required by `PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md` §90–100.

This does not show that a correctly configured and trusted authority will approve an inactive class. It shows that a direct transaction can omit or replace the B2 reference without violating a Plutus check that currently reads it; whether an inner authorization signature can still be obtained is a separate authority-service question. No bypass transaction was constructed or submitted.

### 4. Economic/state consequence and closure requirement

The V3 economic state itself contains `currentActiveClass`, and the on-chain V3 carrier authenticates its pre/post state hashes under the configured authority key. Therefore the existing V3 state can constrain class saleability when a trusted decision source signs the V3 transition. What it does not prove is that this decision was derived from, and bound to, the separate canonical B2 control UTxO required by the B2 design.

Before claiming B2 is an independent on-chain Issue gate, the implementation/evidence must establish one governed binding path, for example by:
- making the on-chain V3 carrier predicate require exactly one deployment-pinned B2 reference input and compare its authenticated datum/control values with the Issue state; or
- explicitly governing and proving that the authority signature over the V3 transition is itself the accepted sole authority for B2, with the B2 reference/identity cryptographically included in the message and a transaction-side verification path that cannot be omitted.

These are alternatives for review, not selected protocol decisions or an implementation mandate. They may affect validator parameters, redeemer/action ABI or the authority contract and require an explicit change decision plus adversarial conformance. Do not silently change the current V3, B2 or MintPolicy semantics to close the gap.

### 5. Agent B Counter lookalike characterization — current Lab failure is a test compile error

The new Agent B CEK characterization in `plutus/test/MintPolicyB1ValuePreservationTest.hs` is currently blocked before Plutus CEK execution. The exact failure in IMMORTAL Cardano Integration Lab #2728 (run `43376155077`, job `131723137013`) is:
`test/MintPolicyB1ValuePreservationTest.hs:30:44: parse error on input ‘as’`

The import is written as `import CounterValidator (compiledValidator as compiledCounterValidator)`, which is invalid Haskell import-alias syntax. A valid equivalent is a qualified import, for example `import qualified CounterValidator as CounterValidator (compiledValidator)`, followed by `CounterValidator.compiledValidator`, or simply importing `compiledValidator` without renaming if there is no name collision.

Consequently, run #2728 records `COUNTER_LOOKALIKE_CEK_OUTCOME=failure` and skips the local-Yaci stage. The source-level payment-ScriptHash matching issue in `MintPolicy.hs` remains visible, but this run has **not** yet executed the new CEK test and supplies no positive/negative CEK result. Agent B owns that Counter characterization and correction; Agent A has not edited their test or validator.

### 6. Disposition

- B2 off-chain observation + authority-envelope reference binding: **IMPLEMENTED**.
- B2 reference included by the ordinary Issue transaction builder: **IMPLEMENTED**.
- B2 reference enforced by the inner on-chain V3 signature or a Plutus Issue validator: **NOT ESTABLISHED**.
- Agent B Counter lookalike CEK result: **NOT RUN — Haskell test parse error**.
- Counter lookalike local-Yaci trace: **SKIPPED** because the earlier CEK characterization step failed.
- B2 and Counter remain separate concerns. No V3, B2, MintPolicy, Counter, 500×, Reveal, Genesis or deployment change was made by this Agent A audit.


## 45.75 AGENT A — B2/V3 MINIMUM BINDING CONTRACT AND ADVERSARIAL TEST MATRIX (2026-11-13)

**Classification:** NON-NORMATIVE implementation/evidence contract for review. It records the proof obligations implied by the existing B2 design (§90–100, §135–158); it does not select a new architecture or authorize an on-chain change.

### 1. Fresh branch reconciliation

At this review point, `work/immortal-green-closure` is one commit ahead of Agent A checkpoint `9b3227b3d11f8286282c03086a7ff925f0cc17cb`. The compare reports exactly one changed path, `plutus/test/MintPolicyB1ValuePreservationTest.hs`, attributable to Agent B's Counter lookalike characterization. Agent A has not edited that file.

The corrected test source now uses `import qualified CounterValidator as CounterValidatorModule` and invokes `CounterValidatorModule.compiledValidator`. This removes the previously observed invalid import-alias syntax. No new CI/CEK/Yaci result was available during this review; source correction is not a test PASS.

### 2. Reconfirmed B2/V3 source boundary

The current source still shows all three of the following:

- `relayer/preprodIssueObservationReader.js` returns the exact B2 `controlStateReference` and passes it to the off-chain authority source, but constructs `observationReference` from Counter + Pool + V3 carrier references only.
- `PreRichIssueDecision.IssueDecisionInput` has decision/observation references but no B2 control reference or B2 control-state fields.
- `V3EconomicStateAction` contains action class, decision reference, observation reference, pre-state hash, action fingerprint, post-state hash and authority signature. `canonicalCarrierBindingMessage` signs those six values; it does not sign a distinct B2 reference. The V3 validator does not inspect a B2 reference input.

The outer signed Issue envelope does include and verify `controlStateReference`, but the outer signature is not the Ed25519 signature verified by the Plutus V3 carrier. These are separate trust boundaries and must not be conflated.

### 3. Minimum evidence invariant

For an ordinary Issue to satisfy the existing B2 design, the evidence must establish the same B2 control state across acquisition, transaction construction and on-chain validation:

1. **Acquired identity:** one exact deployment-configured B2 singleton is observed at a recorded ledger point. Its full configured identity (including the address/credential requirements chosen by the deployment), policy ID, token name, quantity, datum and TxOutRef are recorded. A datum-shaped UTxO or a payment-ScriptHash-only match is not sufficient evidence of the canonical singleton.
2. **Transaction presence:** the exact acquired UTxO is included as a reference input in the submitted Issue transaction. The B2 carrier remains unspent by ordinary Issue, as the design requires.
3. **On-chain recognition:** a validator that actually executes for Issue independently identifies the configured B2 singleton reference input, requires its expected cardinality/identity, decodes the datum and checks the existing B2 control predicates. Merely placing an item in `readFrom` or verifying an off-chain envelope does not enforce this.
4. **Decision consistency:** the class/control values used by the Issue decision match those decoded from that exact reference input and the V3 transition state. At minimum, the existing design's `ticketClass <= CurrentActiveClass` rule and the already specified control-state invariants must fail closed.
5. **Cryptographic binding:** the authority signature checked on-chain commits to the same B2 reference and the relevant control-state values (directly or through a canonical digest), and the executing validator checks that the committed reference is the reference input actually present in `TxInfo`. A signed opaque reference without a transaction-side equality check is insufficient; a present reference without a signature/validator binding is also insufficient.

This is a conjunction, not a choice between “signature includes B2” and “B2 UTxO is present”. Any proposed alternative authority model must be reconciled explicitly with the current B2 design before code is changed.

### 4. Adversarial and positive test matrix

| Case | Required outcome | Proof layer |
|---|---|---|
| Exact configured singleton, valid datum, active class, unchanged canonical reference | Accept when all existing Issue predicates also pass | CEK + ledger |
| Ordinary Issue uses B2 only as reference input; B2 is not spent | Accept; B2 state remains unchanged | Ledger |
| B2 reference omitted | Reject | CEK + ledger |
| A different UTxO with a lookalike datum is supplied | Reject | CEK + ledger |
| Singleton policy ID, token name or quantity differs | Reject | CEK + ledger |
| Two matching configured singleton references are present | Reject; do not select first match | CEK + ledger |
| Reference is stale/replaced after a B2 transition | Reject the missing or non-current reference | Ledger |
| Off-chain signed reference differs from the actual transaction reference | Reject | CEK + ledger |
| B2 datum's current/highest values differ from the state used by the V3 Issue decision | Reject | CEK + ledger |
| `ticketClass > CurrentActiveClass` | Reject | CEK + ledger |
| Existing invalid control relation (including `current > highest`) | Reject | CEK + ledger |
| Valid V3 signature is replayed with a substituted B2 reference | Reject | CEK + ledger |
| B2 reference stays the same but the signed control-state commitment is altered | Reject | CEK + ledger |
| Same payment script hash with an alternate staking credential/address lookalike | Reject unless that full address is explicitly the configured canonical identity | CEK + ledger |

The last case is deliberately phrased against the full configured identity: whether a deployment pins a specific staking credential must come from the deployment/specification, not be invented by this audit. The on-chain check must enforce whichever complete identity is actually governed.

### 5. Evidence sequence and closure criteria

- **Source/ABI review:** identify the exact Issue validator that executes, the exact B2 singleton identity parameters, datum decoder, reference-input lookup and canonical signed-message bytes. Record any datum, redeemer, parameter or validator-hash change before implementation.
- **CEK:** exercise the positive case and every negative row that can be represented at script-context level. Include a paired test proving the signature fails when the reference or control-state commitment is changed.
- **Yaci/native ledger:** submit the positive ordinary Issue and the missing/substituted/stale-reference negatives against the compiled scripts. Record the consumed inputs, reference inputs, outputs, script hashes and evaluator result.
- **Preprod:** only after code/ABI/deployment authority and test gates are explicitly approved, bind the evidence to the exact deployed B2 singleton and acquired ledger point. A local CEK/Yaci PASS is not live Preprod proof.

B2 is not closed until the actual Issue validator enforces the canonical reference and the evidence shows the positive and negative cases. Off-chain observation, an outer signed envelope, or the presence of `readFrom` alone cannot satisfy this criterion.

### 6. Scope guard

This matrix does not authorize adding B2 fields to `V3EconomicStateAction`, changing `canonicalCarrierBindingMessage`, changing `IssueDecisionInput`, changing a validator parameter/redeemer ABI, regenerating deployment scripts, or changing B2/V3/MintPolicy/Counter/Reveal/500×/economic semantics. Those are implementation choices requiring an explicit design/ABI decision and Agent B/security review. No on-chain code or economic rule was changed by this checkpoint.


## 45.76 AGENT A — CROSS-VALIDATOR REFERENCE-INPUT SCAN CONFIRMS B2 IS NOT READ BY ISSUE SCRIPTS (2026-11-13)

**Classification:** branch-source audit; no validator/ABI or protocol semantics changed.

A second pass enumerated the reference-input access in the relevant Plutus scripts on the current branch:

- `plutus/MintPolicy.hs` (blob `0d59fc05b4c11873984fffd10014bd46d8470509`): its `txInfoReferenceInputs` access is in `readRegistry` (lines 236–250), which filters by the supplied Registry payment ScriptHash and decodes a `BeaconRegistryDatum`; the Issue sale predicate calls that helper for Registry validation. No B2 policy/name, B2 datum or class-control read is present in this MintPolicy path.
- `plutus/PrizeValidator.hs` (blob `45f4158c84587db5a3cd3851f35f0d1472d35700`): its reference-input reader is likewise `readRegistry` (lines 533–542), used by `validateSyncBeacon` (line 559). The inspected validator path does not read B2 control.
- `PRE-RICH/onchain/V3EconomicStateCarrier.hs` (blob `f2d0beb9aeeddc0e95b21583d846d56786936dec`): no `txInfoReferenceInputs` access exists; its input path resolves its own spent V3 carrier input.
- `PRE-RICH/onchain/PreRichControlCarrier.hs` (blob `ce5a73dd29894367f031924e5a282935d8d3d66f`): the validator resolves its own B2 input and continuation output. This protects a B2 state transition when B2 is spent; ordinary Issue uses B2 as a reference input and therefore does not execute this spending validator.

This narrows the earlier §45.74 conclusion: across the inspected MintPolicy, Prize and V3 carrier paths, the only reference-input consumer found is the Beacon Registry reader. There is no on-chain B2 reference check hidden in those three execution paths. This is source-level evidence only; it is not a constructed or submitted bypass transaction and does not decide how the existing B2 design should be implemented.

**Disposition:** B2 remains off-chain-bound for ordinary Issue, not independently script-enforced under the current inspected source. The §45.75 matrix remains the closure contract; implementation still requires an explicit design/ABI decision and adversarial CEK + ledger evidence.


## 45.77 AGENT A — ECONOMIC ADAPTER TRANSACTION-INTENT BINDING LIMIT (2026-11-13)

**Classification:** source/call-site audit of the current branch. No code, economic rule, validator or ABI changed.

### 1. What the adapter now proves

Current `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` (blob `ec9693a31aa878d332272c26a9f4baeccceb5715`) strengthens the client-side submission boundary:

- extracts actual spending inputs from the completed Lucid CML transaction body;
- requires declared admission inputs to be present and rejects duplicate references;
- permits extra spending inputs only when each exact reference appears in the connected wallet's UTxO list;
- snapshots exact serialized transaction/body bytes before asynchronous wallet classification;
- rechecks the completed transaction bytes before signing;
- compares the signed transaction body bytes with the validated body before submit;
- requires an EconomicAdmission witness and, for `expectedActionClass === 'Issue'`, an AuthoritativeIssueAdmission witness.

These checks prevent input-list omission and transaction mutation across the asynchronous classification/signing window. They are useful integrity properties.

### 2. What it does not prove

The adapter itself explicitly documents at lines 433–440 that this is input classification only and does not bind the full output/datum/redeemer/validity map to intent.

The current `EconomicAdmissionWitness` validation (`Adapter/CARDANO/runtime/EconomicAdmission.ts`, blob `6ef4091d9fe8be968eea4e04d55df17856c3e038`) validates the declared input set, liquidity-source references, authenticated Pool reference/value, action class, fingerprints as well-formed digests and immediate liquidity. It does not recompute `actionFingerprint` from the completed transaction body or compare the transaction's outputs, mint, withdrawals, redeemers, datums, reference inputs, collateral or validity interval with a canonical action projection.

The exact CML byte snapshot is compared with itself across time; it is not compared with a digest or canonical transaction projection inside the admission witness. Therefore it proves immutability after the check, not that the immutable transaction is the transaction described by the admitted economic decision.

The authoritative Issue witness also contains `controlStateReference`, `v3CarrierBinding`, EEV, ProtectedCapital and viability evidence; the runtime compares several references/values to acquired inputs. But this validation does not, by itself, bind every actual transaction-body field to those evidence objects. In particular, it does not close the B2 on-chain reference-input gap in §§45.74–45.76.

### 3. Reachable call-site classification

A current repository search found these uses of the generic `submitInfrastructure` path:

- `src/registryFlow.ts::publishRoundBeacon` through `src/txHelpers.ts::signAndSubmitTx`;
- `src/gameFlow.ts` call at the inspected line 540, in the Beacon synchronization flow (spends Prize and reads Registry; not the Issue/Reveal/Claim/Expire economic transitions);
- `src/adSettlement.ts::submitAdSettlement`, which has a separate application-level campaign admission and is not an IMMORTAL Issue/Reveal/Claim/Expire transition;
- read-only integration trace harnesses that explicitly identify themselves as audit paths.

The inspected production Issue path in `src/mint.ts` uses `submitEconomic(..., 'Issue')`; the economic Reveal/Claim/Expire paths use the economic submission helper. No current production Issue call site was found using `submitInfrastructure`. The generic method remains a public adapter method, so its intended non-economic restriction is a caller/API discipline rather than a type-level or transaction-semantic enforcement boundary.

### 4. Required closure evidence (not implementation authority)

A future transaction-intent binding review should define, from already-governed action semantics, a canonical projection or commitment covering the fields that materially affect the action. At minimum the review must explicitly classify:

- spending and reference inputs, including exact singleton identities;
- outputs, addresses, values and inline datum hashes/bytes;
- mint/burn assets and quantities;
- script purposes, redeemers and reference-script identities;
- withdrawals/certificates if present;
- collateral and total collateral;
- validity interval;
- the admitted action class, action fingerprint, pre-state and post-state commitments.

Positive and mutation-negative tests should demonstrate that changing any governed field after admission causes rejection before wallet signing. A separate test should demonstrate that a syntactically valid witness cannot be reused with a different transaction body. Tests must not invent a new economic projection or change on-chain semantics; the projection must be explicitly specified and versioned first.

**Disposition:** the adapter now enforces useful exact-input and post-validation immutability checks, but it does not establish complete transaction-to-economic-decision equivalence. This is a residual admission-boundary proof gap, not evidence that a specific live transaction has bypassed on-chain validators. Keep it separate from the B2 reference binding gap and the independent R1/Kc/Ω, ProtectedCapital, Genesis and USD/USDM blockers.

## 45.78 AGENT B — TREASURY / RESERVE CROSS-REVIEW AND A→B HANDOFF (2026-11-15)

**Classification:** independent read-only cross-review of the 15 November Agent B audit supplied in the coordination session, reconciled against the current integration-branch HEAD `4779d67fdb2ec2dd1e271a12791366b55ca19b53` and Agent A §§45.68–45.73. This entry records coordination only; it does not transfer Treasury ownership to Agent B or authorize protocol changes.

### Confirmed cross-review findings

- Keep `Treasury Reserve`, `UnresolvedTicketReserve`, `WorstCaseExposure`, `PendingWinningLiabilities`, `LockedJackpot` and `ReserveProtection` as distinct economic/accounting positions. `ReserveProtection` is a protected-capital requirement, not a liquid asset or a PrizePool deposit.
- The reported Preprod snapshot (slot 139026723 / block 5413649) observed zero Treasury UTxOs and zero sale receipts at the derived Treasury address, alongside one B1 PrizePool UTxO with 100,000 USDM subunits in the supplied manifest. This is a bounded address/snapshot observation, not proof of the complete Treasury history or continuity across snapshots.
- The receipt↔ticket crosswalk's `identityCrosswalkComplete=true` on empty populations is vacuous structural success. Agent B recommends an explicit `EMPTY_INPUT_POPULATIONS` outcome and regression, while preserving all economic-posting and spend-authorization flags as false.
- The Reveal headroom observation is separate from the 500× WCE rule: for one unresolved ticket, a pre-Reveal liquidity amount of exactly `500P` can yield `EffectivePool = 500P - P = 499P`. This is a proof/affordability gap to reconcile, not authority to raise the payout cap or invent a Reserve parameter.
- The current `FundTreasury` path and a ReserveProtection scalar must not be treated as proof of new physical USDM in the exact B1 PrizePool. Any Treasury→PrizePool funding claim needs source-category authorization and matched physical debit/credit evidence.

### Ownership and handoff

- **A-owned:** Treasury receipt journal, Treasury category accounting, EEV/ProtectedCapital producer and approval, and any normative/economic decision. Agent B does not modify these paths or select a Reserve policy.
- **B-owned:** BeaconRegistry/Plutus/Cardano execution and bounded transaction/evidence conformance, under the existing security and ABI review gates. The Registry authenticity issue in §44.62 remains a separate B security blocker; this Treasury review does not displace it.
- **C-owned:** Materios B3 provenance/execution-proof work on `work/b3-materios-provenance-evidence`; no B3 path or C-owned file is changed by this handoff.
- **Handoff to Agent A:** reconcile the four cross-review findings above with §§45.68–45.73; specifically decide whether the empty-population state should be recorded in the canonical crosswalk contract/tests, and preserve the distinction between protected-capital requirement and physically funded PrizePool liquidity. No normative decision is implied.
- **Next Agent B focus:** resume the existing BeaconRegistry authenticity/consumer-boundary work in §44.62 and its already-recorded acceptance matrix. No V3, Reveal, B2 ABI, economic constants, Treasury logic or deployment change is authorized by this review.

**Result:** cross-review complete; Treasury findings handed to A; no code/test/workflow/ledger change; no GREEN promotion.

## 45.79 AGENT B — F4 REGISTRY LIFECYCLE REVALIDATION AT COORDINATION HEAD (2026-11-15)

**Audited HEAD:** `9b6f4ec415f022759842996cd736a66ec0ce4c3e`  
**Classification:** read-only source revalidation + CI lineage correction. No protocol code, tests, workflow, ABI or ledger state changed.

### 1. Current-source revalidation

The following source blobs on the current coordination branch match the previously audited Registry implementation:

- `src/createRound.ts` — `4112d87b7b6d88d77da0bbaee5ed2e172527609e`
- `src/registryDatum.ts` — `0d611c29fe4f74b9b2fa4cd328e8fe2edb5f48f4`
- `src/beaconTrust.ts` — `e9ce2f73be14b85ed4af84863ef40bc68a6625a8`
- `src/registryFlow.ts` — `c402d52ed1e60bb63d0f47d80de6cf0d48c71691`
- `plutus/Types.hs` — `60caeb747018b512e8e6ae7d8a100bb7023863d9`
- `plutus/BeaconRegistry.hs` — `184f4178139dde01845853dcc0ab51371949ec9b`
- `plutus/MintPolicy.hs` — `0d59fc05b4c11873984fffd10014bd46d8470509`
- `plutus/PrizeValidator.hs` — `45f4158c84587db5a3cd3851f35f0d1472d35700`
- `plutus/test/BeaconRegistryAdversarialTest.hs` — `0c55c25a46e2aef497a4b0f36bcdcd49c4e667e9`

The source revalidation confirms:

- `createPendingRound` creates the initial Pending output with ordinary `payToContract`; no minting policy or validator constrains who may create the initial anchor. Its own source comment acknowledges competing Pending entries.
- `src/mint.ts` has client-side checks for exactly one Pending datum per round and, when configured, the expected relayer PKH. These are useful UX guards but do not authenticate a reference input at the Plutus consumer boundary.
- `src/beaconTrust.ts` implements B3→B2→B1 selection helpers, but the audited round-creation/mint call sites still do not invoke the freeze/selection helpers.
- `src/registryFlow.ts` validates optional enriched `brGameRoundCommitment` fields off-chain, but explicitly states that the canonical seven-field on-chain datum does not store them. `registryDatum.ts` deliberately serializes only the seven Haskell fields.
- `BeaconRegistry.validatePublish` checks the nominated relayer signature and deterministic Beacon derivation, but does not authenticate the initial Pending creation, bind the relayer to an independent authority root, require a tokenized unique anchor, or enforce equality between `brRound` and `btRound(brTarget)`.
- `MintPolicy.readRegistry` and `PrizeValidator.readRegistry` still return the first reference input with the configured payment ScriptHash. The SyncBeacon path checks copied Ready fields, not the referenced Registry's executed lifecycle. The current ticket commitment remains target-bound only; adding trust/evidence binding would need matching Issue and Reveal recomputation.

### 2. Current CEK test source versus historical CI evidence

The current `plutus/test/BeaconRegistryAdversarialTest.hs` contains explicit characterization cases for buyer-controlled Pending acceptance, fake Ready acceptance, staking-address lookalikes and multiple Registry references. These are deliberately named as CHARACTERIZATION passes, not security approvals.

The historical Integration Lab #2728 (run `43376155077`, source SHA `fea587bba5171c3f46cf0908a9b1002c5ccb0717`) failed before CEK execution because `MintPolicyB1ValuePreservationTest.hs:30` used invalid Haskell import-alias syntax. The current coordination HEAD has the corrected qualified import `import qualified CounterValidator as CounterValidatorModule`. However, no newer CI result was obtained in this read-only pass. Therefore the old compile failure is diagnosed, but the corrected current-HEAD test suite is **NOT YET EXECUTED / NOT PASS**. No CEK or Yaci result is inferred from source inspection.

### 3. Required boundary and next gate

The previous §44.60 recommendation remains the smallest conceptual delta to evaluate: extend the existing Registry with canonical round identity plus frozen trust/evidence commitment, but only alongside an independently enforced one-round/one-anchor creation invariant. A separate commitment carrier remains the higher-footprint alternative. Neither is authorized for implementation by this audit.

Before any edit, the design/ABI gate must pin:
1. the exact on-chain creation mechanism and uniqueness proof for one canonical anchor per round;
2. the immutable token/anchor identity and complete address/value/datum constraints;
3. the canonical encoding and hash of round identity + selected mode + evidence digest + reproducible fallback record;
4. the authority root for the nominated publisher/relayer under the already-decided B3→B2→B1 policy;
5. the exact Issue and SyncBeacon consumer checks and the Issue/Reveal ticket-commitment compatibility path;
6. migration/deployment compatibility and positive/negative CEK plus native-Yaci evidence.

Do not use a deterministic token name alone as a uniqueness proof; do not reuse the Genesis carrier identity; do not treat client-side selection, a reference input, or a relayer field as authority proof. Preserve the existing trust hierarchy and do not touch V3, Reveal semantics, economics or deployment absent the required decision.

**Disposition:** Registry authenticity remains BLOCKED; current-source findings reconfirmed; corrected Counter test source awaits exact-HEAD execution; no code or ledger changes; no GREEN promotion.

## 45.80 AGENT B — REGISTRY ANCHOR UNIQUENESS MECHANISM COMPARISON (2026-11-15)

**Audited HEAD:** `44631a8c6f909151b26f6471e26d8d8ef7996292`  
**Classification:** read-only source inventory + non-normative mechanism comparison. No validator, mint policy, datum ABI, test, workflow, deployment or ledger state changed.

### 1. Current implementation inventory

The current branch tree contains no dedicated `BeaconRegistryMintPolicy` or equivalent Registry-anchor minting policy. The visible Plutus mint-policy sources are the PRE-RICH ticket policy, Genesis carrier policy, B2 Control carrier policy and V3 Economic State carrier policy.

The Registry lifecycle remains:

- `src/createRound.ts` constructs the seven-field Pending datum and sends it to the Registry address with ordinary `payToContract`; it does not mint or attach a Registry identity token.
- `plutus/Types.hs` defines the current seven-field `BeaconRegistryDatum`; it has no anchor policy/name, frozen trust mode, evidence digest or fallback record.
- `plutus/BeaconRegistry.hs` validates a spent Pending → Ready transition and a continuing output at the same full address. It does not authenticate initial creation or check a state-token identity/value in the spent and continuing Registry outputs.
- `plutus/MintPolicy.hs::readRegistry` and the Registry reader in `plutus/PrizeValidator.hs` select the first reference input with the configured payment ScriptHash; neither establishes a unique canonical Registry anchor.

Relevant current source blobs:
- `src/createRound.ts`: `4112d87b7b6d88d77da0bbaee5ed2e172527609e`
- `plutus/Types.hs`: `60caeb747018b512e8e6ae7d8a100bb7023863d9`
- `plutus/BeaconRegistry.hs`: `184f4178139dde01845853dcc0ab51371949ec9b`
- `plutus/MintPolicy.hs`: `0d59fc05b4c11873984fffd10014bd46d8470509`

### 2. Existing repository patterns are precedents, not ready-made proofs

**Numeric counter pattern.** `plutus/CounterValidator.hs` checks for one continuing output at the same full script address with datum `n+1`, no extra output at that address, and non-decreasing lovelace. The ticket `MintPolicy` requires exactly one input whose payment ScriptHash equals the configured counter hash and checks that an `n+1` output exists.

This is a serialization/continuation motif only. In the inspected code it does not establish an authenticated initial counter, a unique state-token identity, one canonical counter UTxO across all staking credentials, or a binding between that counter sequence and the canonical Beacon `btRound`. It must not be promoted as a secure Registry singleton without those missing invariants.

**One-shot seed pattern.** The existing `PreRichControlCarrierMintPolicy` and `V3EconomicStateCarrierMintPolicy` are parameterized by a `TxOutRef`; they require that input to be consumed and that the transaction mint exactly the configured singleton asset. `GenesisCarrierMintPolicy` similarly requires its one-shot seed and exact named carrier mint.

These demonstrate that a fixed seed reference can authorize a one-time mint. They do not, by themselves, constrain the minted token to a specific Registry address/output or bind its datum to a canonical round. The Genesis carrier identity and policy are separately governed and must not be reused for BeaconRegistry.

Relevant source blobs:
- `plutus/CounterValidator.hs`: `29d3bcf6d6a4a0b4348cfa5e17a61ec822093870`
- `PRE-RICH/onchain/PreRichControlCarrierMintPolicy.hs`: `03e6b4bc9caf8866eca57c4ba1e987799cb49b15`
- `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs`: `b778d8a559d4050a565ac5f49a8d5cccb5451b42`
- `PRE-RICH/onchain/GenesisCarrierMintPolicy.hs`: `c95a16b03258201a29b2593daecb8aa512fb259b`

### 3. Candidate A — dedicated global Registry round allocator

A scalable candidate for one fixed Registry anchor policy is a dedicated, independently bootstrapped allocator singleton, separate from the ticket serial counter and all Genesis/B2/V3 carrier identities.

At a high level, a round-creation transaction would have to prove all of the following atomically:

1. It spends exactly one canonical allocator UTxO at the exact configured full address, carrying exactly one allocator identity token under the expected policy/name and a valid current datum.
2. The Registry-anchor minting policy accepts only the allocator's current state and mints exactly one non-burned anchor token under the fixed Registry policy, with the canonical token name for the allocated round.
3. Exactly one initial Pending Registry output exists at the exact canonical Registry full address. That output carries exactly one matching anchor token, the expected seven-field datum (or the separately approved future schema), and the required `brRound` / `btRound` binding.
4. Exactly one allocator continuation exists, preserving its identity token and required value while advancing the state exactly once. Extra allocator outputs, duplicate anchor outputs, wrong round/name, wrong mint quantities, burns and malformed datum/output combinations fail closed.
5. The Registry spending validator later preserves the same anchor token and immutable round identity across Pending → Ready. Issue and SyncBeacon require exactly one canonical reference carrying that token, at the exact address, with the expected round/target/status; neither consumer may select the first ScriptHash match.

**Important unresolved semantic dependency:** a monotonic allocator proves uniqueness of its own sequence, but it proves uniqueness of an external `btRound` only if the protocol explicitly binds the canonical round ID to that sequence (for example, `btRound = allocated sequence`) or specifies another deterministic anti-reuse mapping. The current source does not define that mapping. Do not silently assume contiguous round numbering, skip behavior, genesis offset or reset/recovery semantics.

A single allocator serializes **round creation** transactions, not every ticket Issue, provided the minted Registry anchor remains a reference input during Issue. Its costs and liveness implications are therefore concentrated at round initialization. Initial singleton authority, recovery/loss handling, and the canonical round-number contract still require specification.

### 4. Candidate B — per-round one-shot seed

A separate one-shot policy parameterized by a round-specific `TxOutRef` can make a particular seed consumable only once and mint one configured token. This can be mechanically simple for an isolated round.

For a reusable Registry consumer, however, it leaves several design obligations:

- The seed must be independently authorized and cryptographically/ledger-bound to the exact canonical round; an arbitrary user-owned seed only proves that the user spent their own UTxO.
- A distinct policy parameter per seed normally yields a distinct policy identity per round. Issue/SyncBeacon cannot trust a policy ID self-declared in the Registry datum; a fixed trusted mapping/root or another governed authentication mechanism is required.
- A single fixed policy accepting arbitrary per-round seeds would itself need a trusted seed-registration/authorization rule. Without that, it recreates buyer-controlled anchor creation under a new name.
- The exact minted token must still be constrained to the single canonical Registry output and preserved by RegistryPublish; the existing carrier policies do not supply those output/address/datum checks.
- Seed custody and provisioning create a liveness/DoS boundary: a seed can be consumed without completing the intended mint unless its spending/authorization flow is constrained.

A per-round seed is therefore not automatically simpler end-to-end. It trades shared allocator state for per-round provisioning, policy identity/mapping and authority-management obligations.

### 5. Comparison and disposition

| Dimension | Dedicated allocator singleton | Per-round one-shot seed |
|---|---|---|
| Anchor policy identity | One fixed Registry policy can cover all allocated rounds | Usually one policy identity per parameterized seed, unless a separately governed shared seed registry exists |
| Uniqueness source | Authenticated singleton state + exactly-once sequence transition | One-time consumption of the exact authorized seed |
| Round binding | Requires a specified sequence ↔ canonical round mapping | Requires an independently authenticated round ↔ seed mapping |
| Concurrency | Serializes round creation through one state UTxO | Independent seeds can avoid global allocator contention |
| Consumer configuration | Fixed policy/name rules are compatible with one shared reader configuration | Dynamic policy identity requires a trusted mapping/root |
| Main risk | Bootstrap/recovery and undefined round-number semantics | Seed authorization/provisioning, dynamic policy identity and seed-consumption DoS |

**Disposition:** neither candidate is selected or authorized. A dedicated allocator is a plausible shared-policy candidate only after canonical round-number semantics and singleton bootstrap/recovery are fixed. A per-round seed remains viable only if a trusted, scalable seed-to-round authority/mapping is specified. The existing ticket counter and carrier mint policies are not accepted substitutes.

### 6. Next design gate — no implementation authority implied

Before any code/ABI change, the design record must settle:

1. canonical round identity and whether `btRound` is sequential, sparse, externally assigned or otherwise mapped;
2. allocator/seed initial authority, exact identity, recovery/loss behavior and authorized creator;
3. exact policy parameters, token-name encoding, output placement, full-address rules and non-burn/reissue lifecycle;
4. Registry Pending → Ready token/value preservation and unique consumer lookup rules across Haskell and any active Aiken path;
5. frozen trust-mode/evidence/fallback commitment and its compatibility with Issue and Reveal ticket-commitment recomputation;
6. migration/deployment sequence and bounded CEK + native-Yaci positive/negative evidence.

The existing hierarchy remains unchanged: **B3_VERIFIED → B2_ATTESTED → B1_AUTHORIZED**; no silent downgrade. This comparison does not authorize changes to V3, Reveal semantics, economics, B2 ABI, Genesis identity or deployment.

**Handoff:** Agent B retains the Registry/Plutus/Cardano security boundary. No task or decision is transferred to A or C by this comparison. Agent A retains economics/admission; Agent C retains Materios B3 provenance. No cross-agent code or runtime action is requested.

**Result:** source comparison recorded; Registry authenticity remains **BLOCKED**; design/ABI gate remains **OPEN**; no code/tests/workflows/ledger changed; no GREEN promotion.

## 45.81 AGENT B — FACTORY / PER-ROUND REGISTRY IDENTITY INVARIANT CONTRACT (2026-11-15)

**Reviewed coordination HEAD:** `fed551d98e6f507d35b2690a8821033a8aa344ab`  
**Classification:** design-only invariant contract derived from the current Registry sources, §44.62/§45.79/§45.80 and the recorded Issue #49 Factory direction. This section is **NON-NORMATIVE** and grants no implementation authority. The Notion source “PRE-RICH — Dual-Level Risk & Adaptive Issue Capacity Contract v0.1” (section 18, verification state reported as `unverified`) is used only as a recorded design direction, not as verified normative authority.

### 1. Three distinct security properties — do not collapse them

The current design discussion contains three related but non-equivalent claims:

1. **Factory / OpenRound uniqueness:** at most one canonical round-opening transition may succeed against a given current Factory state; replay/stale-state attempts fail.
2. **Cardano BeaconRegistry identity:** each opened round has exactly one independently authenticated Registry instance/anchor, with multiple round instances coexisting and each lifecycle preserving its own identity.
3. **External target canonicality:** the complete `BeaconTarget` — especially `mainchainRef` — is derived from an authenticated application configuration and an authenticated Materios checkpoint/anchor relation.

A Factory uniqueness token or state transition can address property 1. A per-round Registry identity and its lifecycle/consumer checks address property 2. Neither proves property 3 by itself. A valid storage proof for a selected Materios `AnchorRecord` authenticates that selected key/value under a StateRoot; it does not, without the separate semantic relation, prove that the key is the canonical anchor for this PRE-RICH round.

**Terminology for this contract:** “Factory STT” means the Factory singleton-token / state-transition candidate already recorded for Issue #49. “Registry identity token” means the independently authenticated per-round identity required by Issue #43/Issue #49. These labels describe separate obligations; they do not select two specific asset implementations. It remains an OPEN decision whether one mechanism could satisfy both obligations. No equivalence is assumed.

### 2. Canonical OpenRound and target invariants

Let `F_n` denote the authenticated current Factory state, `C_v` the authenticated, versioned adopted application configuration, and `R_n` the round identity produced by the still-to-be-specified canonical progression function.

A conforming round-opening relation must satisfy:

- **O1 — Authenticated configuration:** OpenRound reads the canonical adopted governance/application configuration and its version from a ledger-verifiable state. A caller-provided JSON/configuration copy, Haskell replay output, indexer assertion or unverified snapshot is not authority.
- **O2 — Deterministic progression:** the next round identity and complete target are derived/verified from `F_n` plus `C_v` and their authenticated inputs. The exact progression function remains unspecified. Do not assume `round + 1`, contiguous numbering, skip/reset behavior, overflow handling or recovery semantics.
- **O3 — Target field provenance:** `networkId` comes from immutable network/application configuration; `round` is the canonical round identity produced by O2; `version` comes from the authenticated adopted configuration; `mainchainRef` is derived from a separately specified and authenticated source relation for the exact round.
- **O4 — No caller-selected target:** any participant may assemble/submit OpenRound, but cannot choose an arbitrary `BeaconTarget`, supply the authority that validates its own target, or nominate itself as a privileged round opener. A permissionless submitter is a transaction assembler, not an authority.
- **O5 — At-most-one transition:** competing valid submissions against the same current Factory state serialize so that at most one canonical state transition succeeds. A losing submitter may retry against the new authenticated state; a stale/replayed Factory state must fail.
- **O6 — State continuity:** the accepted transition preserves the exact Factory identity and governed state/value continuity required by the eventual Factory specification, and advances only the canonical progression state. Extra, duplicate, malformed or conflicting continuation outputs must fail.

The exact semantic meaning of `BeaconTarget.mainchainRef` remains OPEN. No implementation may silently equate it with a Materios finalized block hash, Orinq `anchor_id`, `AnchorRecord.root_hash`, checkpoint leaf, manifest hash or another byte string. The inspected Materios pallet accepts `anchor_id` as a caller-supplied key; the Orynq SDK convention `SHA256(rootHash || manifestHash)` remains observed producer behavior, not adopted protocol law.

The governance/configuration prerequisite is also independent: the recorded Issue #49 design says canonical adoption state, exact target derivation and an authentic/complete PRE governance snapshot remain to be proven on-chain. Agent B does not define those governance rules or change Agent A's ownership.

### 3. Factory STT and per-round Registry identity

**F-STT — Factory singleton / replay boundary (candidate):**

- The Factory STT candidate must identify the canonical Factory instance and bind the current state used by OpenRound.
- The round-opening transaction must prove use of the current valid state and an authorized transition to its unique continuation; competing submissions against that same state cannot both succeed.
- The exact policy identity, token name, bootstrap, redeemer, current datum/state, mint/burn lifecycle, recovery and restart semantics are not specified by the inspected material. These remain OPEN.
- Factory STT must not be treated as proof of Materios finality, canonical external data, the truth of the target, or the Registry publisher's authority.

**R-ID — Per-round Registry identity (separate obligation):**

- Each canonical round has one independently authenticated Registry identity.
- Multiple rounds may coexist; opening a later round must not overwrite, mutate or make an earlier round's Registry identity ambiguous.
- The identity must bind the canonical round and full target/configuration context under an explicit versioned rule.
- Its policy/name encoding is not selected here. A deterministic token name alone is not a uniqueness proof: the creation policy/state transition and complete output placement must enforce exactly-once issuance, and later lifecycle rules must prevent burn/reissue or identity substitution.
- Do not assume Factory STT itself is the per-round Registry identity. If a future design proposes one asset/mechanism for both roles, it must separately prove both the global Factory replay property and the per-round Registry identity/lifecycle property.

### 4. Canonical Registry creation and immutable identity

- **R1 — Exclusive creation path:** only the canonical OpenRound transition may create an authenticated Pending Registry anchor. A normal output sent to the Registry script address is not sufficient; direct script-address output creation does not execute the Registry spending validator.
- **R2 — Authenticated mint/creation:** the anchor creation policy/state transition must authenticate the exact current Factory state and bind its accepted transition to the canonical next round and complete target/configuration commitment.
- **R3 — Exact output placement:** the creation transaction must produce exactly one canonical Pending Registry output at the exact configured **full Cardano address** (payment credential and staking credential), with exactly one Registry identity token under the expected policy/name and quantity 1.
- **R4 — Exact datum binding:** the Pending datum must match the canonical round/target/configuration/trust commitment required by the approved schema. Current on-chain `BeaconRegistryDatum` remains the seven-field ABI; this contract does not add fields or authorize an ABI change.
- **R5 — No alternate outputs:** reject duplicate Registry outputs, duplicate anchors for one round, wrong address/stake credential, missing/wrong/extra token, wrong policy/name/quantity, token placed in a noncanonical output, conflicting datum, burn/reissue or any alternate route that creates an apparently valid Pending/Ready datum.
- **R6 — Publisher not self-nominated:** the creator of Pending cannot choose the authority root used to authorize its own publication. The authorized publisher/verifier must be resolved from the authenticated application configuration and selected trust-mode evidence. Under B1, the publisher may publish only for the already-fixed target; it is not the round-opening authority, target chooser or economic gatekeeper.

### 5. Pending → Ready lifecycle invariants

A valid Registry publication must prove all of the following in the transaction that actually spends the canonical Registry input:

- exactly one Registry input at the exact canonical full address, with the expected Pending datum and the exact per-round identity token;
- exactly one continuing Registry output at that same exact full address;
- the same immutable per-round identity token, same policy/name and quantity 1 in the spent input and continuing output;
- exact preservation of the complete `Value` and all immutable identity/target/configuration fields, unless a separately adopted normative rule specifies another allowed value transition;
- `brRound == btRound(brTarget)`;
- selected trust mode, evidence commitment, verifier/version identity and the frozen fallback/qualification record remain unchanged;
- only the authorization/verifier appropriate to the selected mode can publish the corresponding Ready state.

The current seven-field Registry validator is not yet enforcing all these properties: in particular, the characterization suite records acceptance of `brRound /= btRound(target)` and a continuing-output Value delta. Those are defects to reject in the eventual acceptance suite, not accepted semantics.

The trust hierarchy is unchanged: **B3_VERIFIED → B2_ATTESTED → B1_AUTHORIZED**. Selection must be made for a new round only, with a valid round-bound object from that mode's own verifier. The chosen mode and Beacon value are frozen before ticket commitments. Missing/invalid evidence, verifier failure, timeout, conflict or temporary unavailability cannot silently downgrade an already-open round. Record the attempted tiers, specific reproducible failure code(s), selected mode, evidence reference/digest, verifier/version and relevant observation time as required by the approved evidence contract. No new fallback policy is defined here.

### 6. Issue and SyncBeacon consumer invariants

Reference inputs are data; including a Registry UTxO as a reference input does **not** execute its spending validator. Therefore both consumers must authenticate the Registry identity and lifecycle from the fields/tokens available in the transaction context.

For **every** active Haskell and Aiken consumer:

- enumerate all reference inputs matching the configured Registry payment ScriptHash; never return the first match;
- reject zero matches and reject more than one match, regardless of ordering or whether one reference looks valid and another is malformed/a lookalike;
- for the single allowed match, require the exact canonical full address, including staking credential;
- require the exact per-round Registry token policy/name and quantity 1 in that reference output, and reject missing, duplicated, wrong-policy, wrong-name, wrong-quantity or mislocated identity tokens;
- decode the datum fail-closed and compare exact canonical round, full `BeaconTarget`, network, version and frozen trust/evidence commitment against the ticket/action context;
- Issue may consume only the canonical **Pending** reference; SyncBeacon may consume only the canonical **Ready** reference;
- reject arbitrary Ready-shaped outputs that were not created by the canonical authenticated lifecycle; a copied datum, deterministic beacon hash or relayer field alone is not proof of that lifecycle.

The current reader is singular and the selected acceptance contract is singular. Any future batch/multi-round transaction semantics require a separately specified rule; do not infer that one Issue/SyncBeacon transaction may use multiple round references.

### 7. Ticket-commitment compatibility boundary

The trust mode and its evidence commitment must be fixed before ticket commitments exist. If a future approved schema extends the ticket commitment to bind trust/evidence, Issue and Reveal must use the same canonical versioned encoding and recompute the same commitment. A change to Issue alone is invalid. This contract does not change current ticket datum/commitment ABI, does not change Reveal semantics, and does not authorize a migration.

### 8. Adversarial acceptance matrix

The following is the proposed minimum acceptance contract. It is not evidence that these tests have been implemented or executed.

| ID | Positive / negative case | Required result |
|---|---|---|
| F01 | Permissionless participant submits OpenRound using authenticated current Factory/config state | Accept only the derived canonical target; submitter cannot choose target/authority |
| F02 | Two competing OpenRound submissions consume/advance the same current Factory state | At most one succeeds; stale/replay attempt rejects; other participant may retry on new state |
| F03 | Missing/wrong Factory identity, stale state, malformed datum, wrong state/value continuation, duplicate continuation or replay | Reject |
| R01 | Canonical OpenRound mints/creates one per-round identity in one Pending Registry output | Accept only exact policy/name/quantity/address/datum binding |
| R02 | Duplicate Pending anchor or duplicate round identity attempted | Impossible to create or unusable by all consumers; reject |
| R03 | Ordinary output creates Pending or Ready directly at Registry script address without canonical identity | Must not be accepted by Issue or SyncBeacon |
| R04 | Wrong payment/staking credential, token policy/name/quantity, missing/duplicate token, token in another output, burn/reissue | Reject |
| R05 | RegistryPublish uses `brRound /= btRound(brTarget)`, adds/removes asset/value, duplicates continuation or changes immutable target/identity | Reject |
| R06 | Wrong publisher/authority for selected trust mode; missing, stale, malformed or failed evidence | Reject |
| R07 | Trust mode/evidence/fallback commitment altered after the round has been frozen | Reject |
| C01 | Issue references exact canonical Pending anchor for the ticket target | Accept only if all other Issue gates also pass |
| C02 | SyncBeacon references exact canonical Ready anchor for the ticket target | Accept only if all other SyncBeacon gates also pass |
| C03 | Buyer-created/fake Ready, non-derived Beacon, unauthorized relayer, no Registry spend lifecycle | Reject |
| C04 | Multiple references sharing Registry payment ScriptHash, including valid + malformed/lookalike, in either order | Reject as ambiguous |
| C05 | Same payment ScriptHash but wrong full address/staking credential | Reject |
| T01 | If trust/evidence is added to ticket binding under an approved version | Issue and Reveal recompute identical commitment; mismatch/version replay rejects |
| B301 | Proof authenticates a selected Materios `AnchorRecord`, but its round/checkpoint-to-anchor relation is absent or wrong | Do not accept it as the canonical target; reject |
| B302 | Wrong chain/network, round, checkpoint, anchor ID, root, storage key or proof block | Reject |

CEK/unit fixtures must first exercise the compiled production wrappers and distinguish current characterization failures from desired post-fix rejection. Then use balanced native-Yaci transaction twins, classifying script rejection separately from builder/serialization/funding/resource failure. Measure ExUnits and actual CBOR against the active protocol parameters; do not raise max transaction size to make a fixture pass. CI must be bound to the exact source SHA. Deployment certification additionally requires exact deployed script/policy hashes, parameters, full addresses and observed UTxO evidence. No test result or deployment state is implied by this matrix.

### 9. Dependencies and decisions still OPEN

This contract intentionally does not decide:

1. Factory STT policy/identity, datum/state, bootstrap, exact redeemer transition, lifetime, mint/burn rules, recovery/restart and loss handling.
2. Whether Factory STT and per-round Registry identity are distinct assets or a dual-purpose mechanism; any unification must prove both properties.
3. Canonical round progression semantics (sequential, sparse, externally assigned or other), including skips, resets, migration and recovery.
4. Authenticated governance/application configuration and complete PRE governance snapshot proof required by the recorded Factory direction.
5. The exact meaning of `mainchainRef` and canonical `round → checkpoint → anchor_id → AnchorRecord → root` relation; external B3-A/B3-B/B3-C finality, storage and verification remain separate and OPEN.
6. Trust/evidence datum schema, canonical encoding, selected-mode authority contract and fallback record.
7. Existing Registry/ticket ABI migration and Issue/Reveal commitment compatibility.
8. Deployment/bootstrap funding, reference-script topology, liveness and denial-of-service/recovery model.
9. Owner approval and a bounded write slot for any implementation; the recorded Issue #49 direction explicitly remains design-only.

### 10. Ownership and disposition

- **Agent B:** Registry identity, Plutus validators/policies, Issue/SyncBeacon consumer boundary, Cardano CEK/Yaci and deployment-evidence conformance.
- **Agent A:** economic policy, EEV/Treasury/ProtectedCapital and admission; no economic decision is reopened.
- **Agent C:** Materios B3 provenance, GRANDPA/finality, storage/execution proof; no B3 ownership is moved to Agent B.
- No task or authority is transferred among agents by this contract.

**Disposition:** Factory/OpenRound identity and per-round Registry anchor are now expressed as separate testable obligations; canonical target provenance remains an independent dependency. Issue #43 Registry authenticity remains **BLOCKED**; Issue #49 remains **DESIGN ONLY / OWNER APPROVAL OPEN**; exact CEK/Yaci evidence for this contract has not been executed; no GREEN promotion.

**Non-effects:** documentation only. No Haskell/Aiken/TypeScript source, datum/redeemer ABI, validator/policy, test, workflow, deployment, wallet, transaction or ledger state was changed.

## 45.82 AGENT B — FACTORY STT VS PER-ROUND IDENTITY: CURRENT CANDIDATE RECONCILIATION (2026-11-15)

**Reviewed branch HEAD:** `c3cf62fed6c045b7e778876a318230b7ddae771d`  
**Prior Issue #49 readiness source:** `docs/COORDINATION/AGENT-B-ISSUE49-TRUSTLESS-FACTORY-READINESS-2026-11-08.md`, blob `d360a6cb729b1d6a858d7841056572bf8eee9c63`; that note itself records an earlier reviewed source HEAD `0cc3e4f077e5f6544dfeff2894f42b805121f49c`.  
**Classification:** design reconciliation from the existing Issue #49 readiness note, rechecked against the current branch source blobs. Non-normative; no implementation authority.

### 1. Finding — one global Factory STT, plus one identity token per round

The repository's earlier Issue #49 readiness analysis already contains a concrete preferred architecture:

- one authenticated Factory state UTxO per PRE-RICH game/deployment namespace, carrying one unique Factory state-thread token (Factory STT);
- each successful, permissionless OpenRound consumes that Factory state, advances its authenticated progression state, mints exactly one new per-round Registry identity token, and creates exactly one Pending Registry output carrying that identity;
- the Factory state token remains in exactly one continuing Factory UTxO;
- earlier per-round Registry UTxOs and their distinct identity tokens remain live and coexist; publishing one round does not consume another round's Registry.

Therefore the earlier open wording “one STT with dual role vs Factory STT plus per-round identity” is clarified as follows:

**Not one and the same NFT reused for both roles.** A single unique Factory STT cannot simultaneously remain in the Factory state UTxO and be present as the unique identity asset in each of several live Registry UTxOs. Moving it into a Registry strands the Factory state; copying it breaks singleton uniqueness; keeping it only in the Factory does not authenticate an individual Registry reference.

**Preferred candidate:** one global Factory STT controls issuance of a family of distinct per-round identity assets. The two roles use distinct token names/assets, but the existing readiness proposal places the Factory STT and the per-round token family under the same Factory script identity/currency symbol `H_F`. Thus this is one canonical issuance authority/state machine, not one reused asset and not a second independently bootstrapped per-round authority.

### 2. Architecture comparison

| Candidate | Multi-round coexistence | Global replay/serialization | Per-round Registry authentication | Disposition |
|---|---|---|---|---|
| Reuse one identical singleton NFT as both Factory state token and Registry identity | Fails without moving/copying the singleton; moving strands Factory, copying violates uniqueness | Cannot preserve a live Factory state and all Registry identities with the same unique asset | Does not identify every Registry independently | Reject as an asset-level dual-role design |
| One Factory STT + distinct per-round tokens minted by that same Factory policy | Yes; one Registry UTxO and one unique token per opened round | Yes, if every OpenRound spends the exact current Factory predecessor and preserves exactly one Factory continuation | Yes, if the Factory policy mints exactly one correct round token into exactly one canonical Pending output and consumers require it | **Preferred existing candidate; design only** |
| Separate one-shot seed/permit/policy for every round | Possible mechanically, but distinct policy namespaces create logical-identity ambiguity | No shared root serialization unless another authenticated singleton coordinates permits | Only if each permit/seed is independently bound to one canonical round and a trusted common root prevents namespace duplication | Rejected as root uniqueness mechanism in existing Issue #49 readiness analysis |
| Factory STT plus a second independent global round-token authority | Possible | Requires two coordinated singleton state machines and atomic cross-binding | Possible | No demonstrated benefit over the same-Factory-policy token family; extra state/authority/coordination burden |

The second row is the design already described in Issue #49 §§4–5. It should be the baseline for further feasibility work, not treated as a newly approved protocol decision.

### 3. Candidate asset and script-hash topology

The earlier readiness note proposes an acyclic dependency topology:

1. Compile BeaconRegistry independently as `H_R`; its script hash must not depend on the Factory policy identity.
2. Compile the Factory STT multi-purpose script with `H_R` and immutable deployment/bootstrap parameters. Its own script hash is the Factory identity currency symbol `H_F`.
3. Keep one fixed Factory thread-token name in the sole Factory state UTxO. The exact name is not selected in this audit.
4. For each accepted round, mint an asset under `H_F` whose token name is a domain-separated encoding of the canonical round identity (the readiness note writes this conceptually as `roundTokenName(round)`). Exact bytes, domain separator and integer encoding remain OPEN.
5. Constrain the OpenRound transaction to create exactly one Pending output at the exact configured Registry full address, holding exactly one of that per-round asset.
6. Parameterize Haskell MintPolicy and PrizeValidator with the expected `H_R` and `H_F`; apply the same identity rule to the active Aiken SyncBeacon consumer.
7. RegistryPublish preserves the per-round token and complete Registry Value. The earlier candidate keeps the current seven-field Registry datum; the authoritative Factory-policy/token check is performed by configured consumers, while the Registry spending validator must preserve the identity asset/value and immutable datum fields.

**Token namespace requirement:** the Factory thread-token name and all round-token names must be disjoint under `H_F`; this is a necessary collision-avoidance property, not a selected encoding.

**Cycle avoidance:** do not parameterize Factory by a Registry hash that itself depends on the Factory currency symbol. The proposed order `H_R → H_F → consumers(H_R,H_F)` is conceptually acyclic. It remains a compiler/artifact hypothesis until a pinned-toolchain prototype proves the actual Plutus V2 script graph, parameter application and currency-symbol behavior.

### 4. Why separate per-round permits are inferior

The existing Issue #49 readiness analysis rejects independent per-round permit UTxOs as the root uniqueness mechanism:

- a deterministic token name plus publisher signature does not stop stateless mint policy invocations in separate transactions from authorizing the same logical target/name;
- one-shot seeds per round create distinct policy IDs, so the same logical round may appear under different policy namespaces unless an authenticated canonical mapping/root already prevents it;
- if every permit is issued by one shared singleton authority, that authority is functionally the Factory and the permit layer adds cost without removing global serialization.

A bearer permit may still represent an already-approved Factory transition, but it cannot replace the Factory's authenticated unique predecessor. No bearer permit, independent per-round signer, runtime allowlist or keeper role is introduced by this reconciliation.

### 5. Current source revalidation

The current `work/immortal-green-closure` source blobs remain the same as the Registry audit baseline:

| Source | Current blob SHA | Relevance |
|---|---|---|
| `src/createRound.ts` | `4112d87b7b6d88d77da0bbaee5ed2e172527609e` | Still accepts caller-supplied target and relayer; creates Pending with ordinary `payToContract` |
| `plutus/Types.hs` | `60caeb747018b512e8e6ae7d8a100bb7023863d9` | Still seven-field Registry datum; no per-round token field |
| `plutus/BeaconRegistry.hs` | `184f4178139dde01845853dcc0ab51371949ec9b` | Pending → Ready validator; no Factory identity mint/creation path |
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | Registry reader remains first-match; no expected Factory policy identity parameter in current boundary |
| `plutus/PrizeValidator.hs` | `45f4158c84587db5a3cd3851f35f0d1472d35700` | Registry reader remains first-match; no per-round Factory token check |
| `poc/aiken-reveal-parity/lib/immortal/sync_beacon_transaction.ak` | `889b61b268131fe67280e82d8f2b4c67a1b5fbcd` | Aiken read path remains first-match by payment credential; no per-round Factory identity check |

The current repository tree contains no Factory/OpenRound production source implementation path. The Factory STT and per-round identity remain design candidates, not deployed or compiled code. The current Pending builder and seven-field datum remain the legacy/untrusted path; their existence must not be treated as proof that the candidate architecture is present.

### 6. Necessary properties for a valid dual-use Factory policy

If the single Factory script identity `H_F` is used both for the Factory thread token and for round-token issuance, the eventual script must separately enforce:

- bootstrap: one exact seed is consumed once; exactly one Factory thread token is created in the exact Factory state output; initial configuration and Registry credential are fixed, not caller-selected;
- Factory continuation: exactly one Factory input with the expected thread token and valid state; exactly one continuing Factory output with the same token and exact governed continuation; no duplicate, burn, replacement or extra Factory state output;
- round identity mint: exactly one new, expected per-round token is minted for the canonical next round; no other `H_F` mint/burn entry is allowed in that OpenRound transaction, except explicitly specified bootstrap behavior;
- Registry placement: exactly one Pending Registry output at the exact full address carries exactly one matching per-round token; no copy in another output, no tokenless lookalike output accepted;
- replay protection: the Factory state records the last accepted sequence/identity or equivalent authenticated state, so reusing the same round cannot mint a second token; stale competing predecessors cannot both succeed;
- lifetime: per-round identity tokens cannot be burned, reissued, transferred away from the Registry output or substituted during Pending → Ready; the Factory thread token never migrates into a Registry;
- consumer rule: all consumers require exactly one reference matching the exact Registry full address, `H_F`, the round-derived token name, quantity one, exact full target and expected lifecycle; multiple matches and lookalikes fail closed.

These are distinct predicates even if they share one Plutus script/currency symbol. The design must not rely on “same policy ID” alone as proof that the right token is in the right output.

### 7. Dependencies and constraints not solved by this choice

This candidate resolves only the *shape* of Factory serialization and per-round identity issuance. It does not close:

- **G1 — governance/genesis trust root:** authenticated initial configuration, verifiable GOV state and authentic/complete PRE voting snapshot remain BLOCKED;
- **G2 — target derivation:** canonical, deterministic and authenticated derivation of the complete BeaconTarget, especially `mainchainRef`, remains BLOCKED;
- **G5 — resource feasibility:** the prior Issue #49 readiness note reports a historical Haskell V2 PrizeValidator size of 16,443 bytes and reference-script publication transaction size of 16,540 bytes versus the 16,384-byte limit. Those measurements need fresh same-source/pinned-toolchain reproduction, but they make consumer expansion a hard precondition rather than a safe assumption;
- **G6 — legacy safety:** live legacy tickets/Registry UTxOs and migration/retirement must be inventoried before activating new consumer hashes;
- **G7 — owner approval:** no implementation/ABI/deployment authorization is granted by this candidate.

B1 remains an authorized-publisher observation profile for a target already fixed by the Factory/configuration. Factory identity does not make the external Materios observation publisher-independent. B3 proof obligations remain Agent C's separate domain.

### 8. Disposition and next bounded work

**Design-level comparison result:** prefer **one global Factory STT plus a per-round token family minted by the same Factory policy identity**. Do not reuse one singleton asset as the Registry identity for all rounds; do not create an independent authority/one-shot seed policy per round. In ordinary language: one global state-thread token, many distinct round identity tokens under the Factory namespace.

This is a reconciliation of the existing Issue #49 candidate, **not** owner approval, normative policy adoption, ABI approval or implementation authorization.

Next bounded work, before code:
1. freeze only the abstract asset model: one Factory thread-token name plus disjoint round-token names under `H_F`;
2. obtain owner decision on the token namespace, exact round progression, immutable bootstrap commitment and recovery/loss model;
3. close G1/G2 separately; no Factory can truthfully claim permissionless trustless OpenRound until both are proven;
4. reproduce Haskell V2 artifact/transaction-size baseline with pinned toolchain before consumer changes;
5. obtain explicit implementation slot and changed-path approval before any Factory prototype or datum/consumer edit.

**Non-effects:** documentation only. No production source, datum/redeemer ABI, minting policy, validator, tests, Aiken, workflows, CI, deployment, wallet, transaction or ledger state changed. No CEK/Yaci result is asserted. Issue #43 remains release-blocking; Issue #49 remains **DESIGN CANDIDATE / NOT IMPLEMENTATION-READY**.


---

## 45.83 AGENT B — FACTORY BOOTSTRAP / ROUND PROGRESSION / BEACON TARGET RESOLVER CROSSWALK

**Date:** 2026-11-15  
**Exact reviewed HEAD:** `703ba814093d94a5586e1ff9b5ab4af1b6212e64`  
**Classification:** SOURCE TRIANGULATION / DESIGN CONTRACT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Scope:** clarify what is actually frozen, what the current builder merely defaults, and which authenticated dependencies must exist before a permissionless trustless OpenRound can be specified.

### 45.83.1 Disposition

The audit still finds **no complete Factory bootstrap, adopted-config carrier, round progression function, or canonical target resolver implemented in production source**. The Factory STT plus per-round token remains a design candidate.

This pass adds one important reconciliation to §45.82:

- governance **parameters** are frozen by the repository's implementation-facing Phase 2 contract;
- governance **source authenticity/completeness and Cardano execution binding** remain open;
- the DApp's current `BeaconTarget` values are defaults/build inputs, not proof of canonical target selection;
- the existing `GameRoundCommitment` is a useful integrity primitive, but the current Registry datum does not carry or authenticate it;
- Materios proof of a selected `AnchorRecord` is not the same property as proof that the selected anchor is canonical for a given PRE-RICH round.

No new protocol rule, target formula, progression rule, script parameter, ABI, or authority is selected here.

### 45.83.2 Governance source precedence correction

The older Notion page `GOV-03 — PRE Voting Mechanisms & Decision Rules v0.1` is explicitly a candidate-space document and says that it does not freeze a final mechanism. It is not the latest implementation-facing contract and its fetched page metadata reports `verification.state=unverified`.

The repository source `docs/00-normative/GOVERNANCE_IMPLEMENTATION_CONTRACT_PHASE2.md` identifies GOV-01 → GOV-18 as its source and freezes these canonical parameters:

- representation: eligible ledger entities at the voting-start snapshot;
- voting weight: `V(P)=P`;
- delegation: direct, non-recursive, weight-conserving and snapshot-bound;
- quorum: `Q/E >= 1/4`, with `Q=Y+N+A`;
- ordinary approval: `Y/(Y+N) > 1/2`;
- kernel approval: `Y/(Y+N) >= 2/3`;
- abstention counts toward quorum and is excluded from the approval denominator;
- community review 7 days, voting 5 days, finalization/challenge 3 days; material amendment starts a new lifecycle.

Therefore GOV-03's old candidate-space language must **not** be used to reopen these already-frozen parameters.

This does **not** close the Factory governance trust root. The separate Agent B source audit `AGENT-B-GOVERNANCE-PRE-SNAPSHOT-AND-BEACON-TARGET-TRUSTLESS-GAP-2026-11-08.md` finds that deterministic Haskell replay still does not prove: complete PRE balances/eligible denominator at the voting-start boundary; the mapping of governance EntityId to Cardano credential; actor signature authenticity; evidence authenticity/completeness; or a Cardano-verifiable adopted application-config state. The existing governance contract itself is not a conformance certificate.

**Correct status:** governance decision parameters are frozen; Cardano-verifiable genesis/snapshot/credential/event/canonicalization provenance remains BLOCKED.

### 45.83.3 Factory bootstrap — immutable configuration is separate from one-shot uniqueness

The prior Issue #49 readiness note specifies an immutable deployment manifest and a one-shot seed reference. Its required initial manifest content includes at least:

- Factory instance/game namespace;
- initial ruleset and configuration commitment;
- exact Registry credential/address;
- B1 trust profile and publisher identity;
- progression rule;
- target-derivation contract;
- script hashes and parameterization;
- seed reference and expected initial Factory state.

The distinction is material:

1. Consuming one seed once can prevent a second bootstrap from the same seed.
2. It does **not**, by itself, prove that the first transaction used the correct initial configuration.
3. The Factory policy/bootstrap path must constrain the initial state and token placement to the independently reproducible deployment commitment. A first submitter cannot be allowed to select the publisher, Registry address, progression, target resolver or configuration while consuming the seed.
4. After bootstrap, the seed must confer no ongoing pause, arbitrary mint, target-selection, publisher-override, upgrade or recovery power.
5. Any mutable application-configuration change must be the result of the authenticated canonical governance transition; an ordinary OpenRound reads that adopted state rather than changing it.

The abstract script dependency proposal remains `H_R → H_F → consumers(H_R,H_F)`: compile the independent Registry as `H_R`, then the Factory policy parameterized by `H_R` and immutable bootstrap inputs as `H_F`, then the consumers. This remains a hash-topology/compiler hypothesis until a pinned-toolchain artifact proves the actual Plutus V2 construction and parameter application.

**Not decided:** exact initial manifest commitment encoding, namespace bytes, token names, seed identity, Factory datum ABI, upgrade policy, or recovery/loss procedure. No admin reset or privileged recovery key may be inferred.

### 45.83.4 Round progression — strict ordering is a candidate constraint, not an adopted function

The Issue #49 readiness note states that a strict monotonic sequence is required as its proposed baseline, while also leaving the exact progression and skip predicates to PRE-RICH application policy and requiring them to be fixed in adopted configuration before code.

The current source does not implement that state machine:

- `src/createRound.ts` accepts a caller-supplied target and relayer; its local round check is only `round >= 0`.
- `src/mint.ts` exposes optional `networkId`, `roundId`, `mainchainRef` and `gameVersion` inputs.
- Its current convenience defaults are `networkId=0`, `roundId=0`, `gameVersion=V1`, and `mainchainRef=UTF8("pre-rich-round-" + roundId)`.
- Those defaults are builder behavior, can be overridden, and are not an authenticated schedule or a Factory progression predicate.

Consequently, do not promote `round+1`, fixed cadence, time-based selection, or skip/reopen rules into protocol law based on these defaults.

Minimum design requirement: the submitter relays a transition whose round is derived from the authenticated Factory predecessor and the adopted progression rule; the submitter does not choose the round. The exact deterministic function, skip eligibility, pause/stop behavior, and config-version transition remain application-policy decisions. If skips are ever allowed, the rule and its visible state consequence must be adopted before implementation; an operator cannot manually skip, reopen, freeze or reorder.

### 45.83.5 Target derivation — current encodings bind bytes but do not establish their origin

The current tuple is `BeaconTarget=(networkId, round, mainchainRef, version)`.

Source facts:

- `plutus/Beacon.hs::deriveBeacon` deterministically hashes the supplied network, round, mainchainRef, mcHash, Materios context and version. Its source comment expressly says this does not prove authenticity of mcHash.
- `src/beacon.ts::deriveGameRoundCommitment` binds `gameId`, `roundId`, `configHash` and `protocolVersion`. It is an integrity/binding primitive, not a Materios receipt, target-selection proof or randomness source.
- `src/registryFlow.ts` recomputes/checks that commitment off-chain and checks round/version consistency. Its own source comments state that the current Registry datum does not contain GameRoundCommitment; the check is therefore not an on-chain authentication boundary.
- `src/registryDatum.ts` and `plutus/Types.hs` retain the current seven-field `BeaconRegistryDatum`; the separate `GameRoundCommitment` type is not included in that datum.
- The ticket commitment includes the encoded complete BeaconTarget, but a commitment to caller-supplied target bytes does not prove that those bytes were selected by the canonical protocol rule.

The field `mainchainRef` therefore remains semantically unresolved. The sources do not authorize silently treating it as one of: a Materios finalized block hash, an Orinq `anchor_id`, an `AnchorRecord.root_hash`, a checkpoint/manifest commitment, or another external reference.

The Materios evidence boundary remains two independent relations:

1. **State authentication:** finalized header/StateRoot plus a valid storage proof authenticates the exact `OrinqReceipts::Anchors[anchor_id]` value.
2. **Semantic target binding:** an independently adopted and verified rule proves that this exact anchor is the canonical one for this PRE-RICH round/checkpoint.

The inspected pallet accepts `anchor_id` as an explicit argument to `submit_anchor`. The Orynq SDK convention `SHA256(rootHash_bytes || manifestHash_bytes)` is observed producer behavior, not a Materios consensus rule or adopted PRE-RICH canonical mapping. The known real Preprod receipt → checkpoint leaf/root → anchor record is a concrete witness for that selected receipt; it does not define a general round-to-anchor function.

Likewise, the repository's `canonicalAnchorKey` hashes a canonical evidence tuple; it is not a protocol rule mapping round to Materios `anchor_id`.

B3's required proof composition remains conceptually:
`finalized header + GRANDPA authority/ancestry/finality proof → StateRoot → storage proof → exact AnchorRecord → adopted round/checkpoint relation`.

B3-A finality/authority provenance, B3-B historical state/storage verification and B3-C Cardano verification/semantic mapping remain separate gates. A valid B1 publisher signature cannot replace them.

### 45.83.6 Minimum trust boundary before OpenRound

The following is an interface-level checklist, **not a selected datum/redeemer ABI**:

1. Read the unique authenticated Factory predecessor and its immutable namespace/sequence state.
2. Read the canonical adopted application-config state and verify its identity/version against the Factory's governed configuration reference.
3. Derive the round from the adopted progression rule and Factory predecessor; reject caller-provided round substitution.
4. Derive `networkId` and `version` from immutable deployment configuration and adopted application configuration respectively.
5. Verify a target witness binding the same round/config to the adopted meaning of `mainchainRef` and the canonical Materios checkpoint/anchor relation.
6. Freeze the full target before B1 publication; the configured B1 publisher may publish observation data only for this target.
7. Atomically advance the Factory state and mint exactly one round identity into exactly one Pending Registry output, preserving the §45.81/§45.82 identity and consumer conditions.

A proof package that only says “this AnchorRecord exists” is insufficient at step 5. A commitment that only says “these config bytes hash to H” is insufficient unless the initial/configuration source and adoption lifecycle are authenticated. If any of these inputs cannot be verified under the selected on-chain trust contract, OpenRound must fail closed.

### 45.83.7 Gates and disposition

| Gate | Required closure | Current status |
|---|---|---|
| B0 — Bootstrap root | Independently reproducible deployment manifest; immutable initial config; exact first Factory state/token constraints; seed replay protection | **DESIGN ONLY / OPEN** |
| B1 — Governance state | Frozen GOV rules plus complete PRE snapshot, credential-bound actors and Cardano-verifiable canonical adoption/config state | **BLOCKED** |
| B2 — Progression | Adopted deterministic next-round/skip/stop function and version transition | **OPEN / NOT SELECTED** |
| B3 — Target semantics | Adopted meaning of mainchainRef and canonical round/checkpoint → anchor relation | **BLOCKED** |
| B4 — External proof | Exact Materios finality, authority/ancestry and historical storage witness | **OPEN** |
| B5 — Script feasibility | Acyclic script/artifact proof, CEK and transaction-size measurements on pinned toolchain | **BLOCKED / MUST REPRODUCE** |
| B6 — Legacy/owner | Live legacy inventory, migration disposition, owner approval and bounded implementation slot | **OPEN / NOT AUTHORIZED** |

**Disposition:** the existing Factory identity shape remains the preferred design candidate, but its bootstrap and OpenRound inputs are not yet trustless. There is no evidence-based route to implement a correct permissionless OpenRound by simply replacing the present caller-supplied `mainchainRef` with an SDK hash or the current string default.

**Non-effects:** documentation/audit only. No production code, ABI, Plutus/Aiken script, Factory policy, target resolver, governance rule, test, workflow, CI run, branch topology, wallet action, transaction, deployment, or ledger state was changed or executed. No V3/Reveal or economic semantics were changed.

### 45.83.8 Exact source pins reviewed

| Source | Blob SHA | Use in this crosswalk |
|---|---|---|
| `docs/00-normative/GOVERNANCE_IMPLEMENTATION_CONTRACT_PHASE2.md` | `bf42cf1c465cf9b6be768efed99594159793c2b9` | Frozen GOV implementation parameters |
| `docs/COORDINATION/AGENT-B-GOVERNANCE-PRE-SNAPSHOT-AND-BEACON-TARGET-TRUSTLESS-GAP-2026-11-08.md` | `ac45a5dcf381898df55362eea0afe407820ea5ac` | Snapshot and target trust gaps |
| `src/config.ts` | `245d81ee6f9916623f7ed31fb4ef904af7407d3b` | Public deployment defaults/config |
| `src/mint.ts` | `1cde621e072db3b9db5b699377915b80b7db5c3e` | Caller-overridable target inputs/defaults |
| `src/createRound.ts` | `4112d87b7b6d88d77da0bbaee5ed2e172527609e` | Caller-supplied Pending target/relayer |
| `src/beacon.ts` | `4ad58dedb68bb3db1b52900b113126105dcd8766` | Target and GameRoundCommitment encoding |
| `src/registryFlow.ts` | `c402d52ed1e60bb63d0f47d80de6cf0d48c71691` | Off-chain commitment checks |
| `src/registryDatum.ts` | `0d611c29fe4f74b9b2fa4cd328e8fe2edb5f48f4` | Seven-field datum encoding |
| `plutus/Beacon.hs` | `3c9065e7b6b2b9484d845d03078dca165e40f031` | On-chain deterministic derivation |
| `plutus/Types.hs` | `60caeb747018b512e8e6ae7d8a100bb7023863d9` | Current Registry ABI |
| `plutus/BeaconRegistry.hs` | `184f4178139dde01845853dcc0ab51371949ec9b` | Current Pending → Ready boundary |
| `poc/materios-checkpoint/src/selectionCommitment.ts` | `ad6dea3d21bacc24d63f6a9fc744978b6eb7188c` | Materios selection commitment extraction only |
| `poc/materios-checkpoint/src/canonicalEvidence.ts` | `1ade2167eae734bd9f1b5c1a0a1672bb579a0f77` | Evidence tuple anchorKey, not round-to-anchor rule |
| `poc/materios-checkpoint/src/capture-anchor.ts` | `3a953606393bcd94eaa82d00381976709c8193ce` | Exact selected AnchorRecord witness capture boundary |
| `docs/research/B3-C-POC2-MATERIOS-ANCHOR-KEY-TRIANGULATION-2026-09-27.md` | `ebc464d9839fdfd523b2cb5806e0aa63a53c144a` | Caller-supplied anchor key and open semantic relation |
| `docs/04-guides/14_BEACON_FAILOVER_AND_ROUND_FREEZE_v0.1.md` | `6bfb95892c10a795070fa7317fb412a6cd5ec443` | Trust-mode freeze only; not a target resolver |



---

## 45.84 AGENT B — OWNER AUTHORITY / PROGRESSION / BOOTSTRAP RECOVERY DECISION CROSSWALK

**Date:** 2026-11-15  
**Exact reviewed HEAD before this entry:** `ad392cdb9b6aae6125df48470e35d8fbf81cdcda`  
**Classification:** OWNER-DIRECTION RECONCILIATION + SOURCE AUDIT — NON-NORMATIVE REGISTER ENTRY; NO IMPLEMENTATION AUTHORITY  
**Primary record:** GitHub Issue #49, owner comments `6713720482`, `6714052413`, `6714159371`, `6717381867`, `6717492532`, `6717518494`, `6817241935`, `6817451638`.

### 45.84.1 Owner direction: permissionless OpenRound; no per-round signing authority

Issue #49 contains a later explicit owner clarification that supersedes the earlier proposed `RoundDefinitionAuthority` signature model:

- Comment `6717381867` described a separate `RoundDefinitionAuthority` signature as an implementation-planning baseline.
- Comment `6717492532` explicitly rejects that as the default/runtime trust root: `OpenRound` must not depend on a single PKH, B1 publisher, relayer/keeper, maintainer/admin wallet, off-chain server signature or manual approval.
- Comment `6717518494` confirms that a per-round signer must not be reintroduced under another name. A Haskell replay result, JSON event, API response, off-chain signature or bare hash cannot replace a missing Cardano-verifiable governance/configuration state.
- The owner requires the round-opening predicate to derive from canonical adopted application configuration and authenticated Factory state; any eligible participant may construct, submit or retry a valid transition. Factory performs independent on-chain revalidation and serializes competing submissions.

**Reconciliation:** do not carry the earlier `RoundDefinitionAuthority` proposal forward as an unresolved option or transitional shortcut. It is rejected for this lifecycle. A valid future design must derive authorization from authenticated canonical state, not from a per-round privileged signer.

Role separation remains:

- Application governance establishes long-lived versioned rules/configuration through its canonical lifecycle.
- Factory checks the adopted state, deterministic progression and authenticated target inputs; it does not decide external truth.
- Any eligible participant may submit/relay; submitter identity does not affect the result.
- The configured B1 publisher publishes observation data only for a Registry target already opened.
- B3/B4 proof providers supply their separate canonicality evidence; they are not implied by B1 publisher identity or Factory token ownership.

### 45.84.2 Progression: the predicate is constrained; the exact function is not adopted here

The owner has required that progression and any skip derive from canonical protocol state/rules. Manual operator skip, freeze, reorder or reopen is prohibited. Competing attempts must serialize through the same authenticated Factory predecessor; stale attempts fail and can be rebuilt by any participant.

The following proposals appear in earlier Issue #49 comments:

- `target.round == lastOpenedRound + 1`;
- a separate explicit `SkipRound` transition for an intentionally skipped number;
- alternatively, earlier discussion considered strictly increasing rounds with gaps.

They are not interchangeable. The later owner clarification fixes the **source and authority of the rule** (canonical state, not operator discretion), but does not itself select one exact numeric predicate or skip lifecycle. The exact progression function, whether skips exist, their eligibility/evidence, and their effect on history remain OPEN until the adopted application configuration specifies them.

Do not implement `round+1`, implicit gaps, skip, pause, reopen or reorder based solely on an earlier recommendation or a DApp default.

### 45.84.3 Target authority: B1 observation is downstream of target selection

The owner requires a complete target to be determined before B1 publication. The target selector cannot be the caller, B1 publisher, relayer, keeper, API, SDK default or off-chain replay.

The 12 November source revalidation in Issue #49 comment `6817241935` makes the Materios boundary precise:

1. Materios `submit_anchor` accepts `anchor_id`, `content_hash`, `root_hash` and `manifest_hash` as supplied extrinsic arguments; the runtime does not recompute or enforce `anchor_id == SHA256(root_hash || manifest_hash)`.
2. Orynq SDK's `SHA256(rootHash || manifestHash)` is therefore an observed producer/verifier convention, not a consensus-enforced Materios rule.
3. A storage proof authenticates an `AnchorRecord` at a selected key; it does not establish that this record is the canonical record for a PRE-RICH round.
4. The required proof remains three-part: adopted round-selection rule → independently verified Materios finality/authority/state → authenticated key/value and exact round/config/network/version binding.

Therefore `mainchainRef` semantics and the round → checkpoint → anchor selection relation remain BLOCKED. Do not promote the Orynq formula, a selected historical test anchor, `canonicalAnchorKey`, or `UTF8("pre-rich-round-" + round)` into protocol law.

### 45.84.4 Bootstrap: one-shot provenance is not initial-state correctness or recovery

The existing `PRE-RICH/onchain/GenesisCarrierMintPolicy.hs` pattern:

- consumes one configured `TxOutRef`;
- permits exactly one configured token name at quantity one under its own currency symbol;
- rejects extra token entries and any different mint quantity/name.

The paired `GenesisRegimeCarrier.hs` checks the carrier token in the consumed and continuing state, a unique continuing output, exact Value continuity and a deterministic transition predicate. This is useful structural precedent only.

It does **not** establish a ready-made Factory deployment:

- the seed out-ref, Factory script identity, initial Factory token name, Factory namespace, Registry credential and initial config commitment are not selected for a deployed Factory;
- one-shot minting alone does not prove correct datum/configuration or token placement; the spending-state validator must enforce the exact canonical continuing Factory output;
- the reviewed branch tree contains no `BeaconRegistryFactory` / `OpenRound` production source;
- the existing Genesis carrier has no generic Factory reset, token re-issuance or admin repair mechanism to reuse.

The owner requires the seed to be finite bootstrap provenance only. It cannot confer continuing admin, pause, arbitrary mint, publisher override, target selection or upgrade powers. The exact initial deployment manifest and reproducible genesis commitment remain an implementation/deployment prerequisite, not an assumed current fact.

### 45.84.5 Recovery: separate operational rediscovery from Factory-state restoration

The P0 liveness contract permits permissionless re-discovery/re-submission of objectively eligible work, safe retries against current state, and replacement of an unavailable observer or relayer. A missed wake-up must not destroy eligibility; when no submitter is active, the system may remain in a safe stall.

That operational recovery is **not** authority to:

- recreate or remint a lost Factory STT;
- reset `lastOpenedRound` or erase used round identities;
- replace the Factory namespace/policy ID under the same identity;
- choose a new target or publisher;
- repair a malformed Factory datum through an administrator key;
- migrate old Registry UTxOs or reissue a round identity.

No Factory-specific loss/corruption/recovery transition, seed reconstitution process, namespace replacement rule or upgrade route is present in the reviewed source or selected in Issue #49. The current Genesis carrier precedent supplies no such generic reset path.

**Safe disposition:** the normal path must preserve one authenticated Factory continuation atomically. If that state becomes unavailable or invalid, the design must fail closed rather than invent an operator recovery key. Whether the instance remains permanently halted, or a deterministic protocol-level recovery/migration can be proven without duplicating history or identities, is an explicit OPEN owner/design decision. The P0 rediscovery rule does not settle it.

### 45.84.6 Decision status matrix

| Question | Owner direction / evidence | Status |
|---|---|---|
| Multiple Registry instances | One independently authenticated Registry identity per round; instances coexist | **DIRECTION SELECTED** |
| Factory STT + per-round identity tokens | Preferred uniqueness/serialization design candidate | **DESIGN BASELINE; NOT IMPLEMENTED** |
| Per-round signer / `RoundDefinitionAuthority` | Explicitly rejected; no per-round privileged signer | **REJECTED** |
| Permissionless submitter | Any eligible participant may submit/retry; submitter is not authority | **OWNER REQUIREMENT** |
| Progression authority | Deterministic rule from canonical adopted config + Factory state | **OWNER REQUIREMENT** |
| Exact progression / skip function | `lastRound+1` and explicit skip were proposals; exact lifecycle not fixed | **OPEN** |
| B1 publisher role | Observation only for already-opened target; not target/round authority | **OWNER REQUIREMENT** |
| `mainchainRef` meaning and round→checkpoint→anchor mapping | No selected canonical function; Materios accepts caller-supplied anchor ID | **BLOCKED** |
| Governance-to-Cardano canonical state | Haskell replay exists; authentic complete PRE snapshot/credential-bound lifecycle/config carrier not demonstrated | **BLOCKED** |
| Bootstrap seed/config | One-shot seed allowed as finite provenance; exact deployment commitment/out-ref/identity absent | **OPEN / NOT DEPLOYED** |
| Factory state loss/recovery | Safe rediscovery is not token/state restoration; no approved recovery mechanism | **OPEN** |
| Legacy Registry migration | Old unauthenticated UTxOs fail closed; no migration approved | **OPEN / NO AUTOMATIC MIGRATION** |

### 45.84.7 Next bounded work

Do not reopen the rejected signer model. Do not implement the Factory yet.

The next design work should be restricted to two concrete interfaces:

1. **Progression/config interface:** specify the minimum fields the authenticated application-config state must commit to, and test whether the exact numeric progression/skip semantics can be derived without adding any new privileged actor.
2. **Fail-stop/recovery interface:** classify Factory failure cases (normal stale transaction, missed wake-up, unavailable observer, consumed/malformed state, script defect, lost seed) and distinguish retryable operational failures from irreversible identity/state failures. Produce no reset/migration authority without an owner-approved deterministic proof contract.

G1 governance authenticity and G2 target derivation remain independent blockers. Haskell V2 size/CEK feasibility, legacy inventory and explicit implementation authorization remain required before any consumer or Factory source change.

**Non-effects:** source/decision reconciliation only. No protocol code, datum/redeemer ABI, policy, script, validator, workflow, test, CI dispatch, wallet, transaction, deployment, branch topology or ledger state changed. No Factory recovery path or progression formula was selected.



---

## 45.85 AGENT B — FACTORY FAILURE / LIVENESS / RECOVERY MATRIX

**Date:** 2026-11-15  
**Exact reviewed HEAD before this entry:** `6b02a60fc0a1039e5f7a022e196c8a37075db382`  
**Classification:** FAILURE-MODE ANALYSIS — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Sources:** Issue #49 owner comments `6717492532`, `6717518494`, `6817451638`; P0 permissionless execution contract; current Genesis one-shot carrier sources.

### 45.85.1 Classification rule

The critical distinction is between:

1. **Operational rediscovery/retry:** the authenticated canonical state still exists and the same valid transition can be reconstructed and submitted by any participant.
2. **Authenticated state restoration:** a missing, corrupted or unusable Factory identity/state would have to be recreated, reset, reissued, migrated or replaced.

P0 supports the first category: missed wake-ups do not remove eligibility; any submitter may rediscover and retry; stale transactions fail; unavailable observers/relayers may be replaced; absent submitters may produce a safe stall.

P0 does not create authority for the second category. In particular it does not authorize reminting a consumed Factory STT, resetting round history, replacing a Factory policy ID, or creating an administrator recovery key.

### 45.85.2 Failure matrix

| Failure condition | Correct classification | Permitted handling under current owner direction | Not permitted / unresolved |
|---|---|---|---|
| Missed wake-up, worker down, no keeper active | **RETRYABLE OPERATIONAL** | Rediscover eligible work from canonical state; any participant can submit | Worker uptime must not be a correctness dependency |
| Two OpenRound attempts consume the same predecessor | **RETRYABLE STALE** | At most one succeeds; loser rereads the new Factory state and rebuilds | Reusing the stale input or creating a second identity |
| Temporary RPC/indexer/observer outage before valid inputs are obtained | **RETRYABLE EVIDENCE ACQUISITION** | Replace observer/source transport and retry against the same canonical inputs; fail closed until verified | API output or observer signature becoming authority |
| B3 finality/storage proof unavailable or invalid | **SAFE STALL / FAIL CLOSED** | No B3-qualified target/round is admitted until required proof is available | Downgrade an existing B3 round to B1/B2, or let B1 publisher choose a replacement target |
| B1 publisher unavailable | **PROFILE-SPECIFIC STALL** | Existing Registry remains bound to its configured B1 publisher; repair of that publisher's observation infrastructure may retry under the same identity | Arbitrary publisher substitution for an already-opened Registry; B1 publisher is not permissionlessly replaceable under the current B1 contract |
| B1 publisher key lost/revoked | **UNRESOLVED INSTANCE/LIFECYCLE FAILURE** | Keep the affected Registry's original publisher binding intact unless a separately approved canonical migration exists | Rewriting `brRelayerPkh` on the live Registry or silently using a new key |
| Canonical governance/config carrier unavailable or not verifiable | **SAFE STALL / FAIL CLOSED** | No new OpenRound; retry only when the same adopted config can be authenticated | Substitute Haskell replay, signed JSON, API, maintainer or per-round signer |
| Target/AnchorRecord missing, ambiguous, stale or wrong | **SAFE STALL / FAIL CLOSED** | Reacquire/verify evidence for the exact protocol-selected target, if the canonical rule and target already exist | Select a different anchor/round through caller, SDK default, publisher or keeper |
| Factory input is stale because another valid transition won | **RETRYABLE STALE** | Re-read the sole continuing state and reconstruct the same rule-derived next action | Treating stale failure as authority to skip, reopen or reorder |
| Factory token missing, duplicated, wrong quantity/policy/name; datum malformed or config mismatch | **FAIL CLOSED / STATE INTEGRITY FAILURE** | Reject every transition; preserve evidence and do not mint a substitute | Admin reset, token re-mint, hidden burn/replacement, accepting a lookalike policy |
| Factory state consumed but no valid continuing state exists | **SHOULD BE UNREACHABLE UNDER THE REQUIRED VALIDATOR CONTRACT** | Future Factory validator must make consumption and exact continuing STT state atomic; invalid transition must fail and leave predecessor unspent | Assuming the existing one-shot mint policy alone enforces output placement/continuity |
| Bootstrap seed unavailable before it is consumed | **BOOTSTRAP BLOCKED** | No bootstrap until an independently approved deployment manifest binds the exact seed and initial commitment | Choosing an alternate seed after deployment identity is fixed without a new approved instance/manifest |
| Bootstrap seed consumed but Factory token/config is placed incorrectly | **POTENTIAL IRRECOVERABLE BOOTSTRAP FAILURE** | Bootstrap must validate exact token, datum/config, address and unique output in the mint/bootstrap transition | Assuming seed consumption alone proves correct Factory initialization; unapproved second mint or admin rescue |
| Factory script/parameterization defect makes the state permanently unspendable | **SAFE STALL / INSTANCE FAILURE** | No upgrade/recovery route is assumed; require separate reviewed protocol-level migration or new instance decision | Admin upgrade key, silent policy-ID replacement, reusing the same round namespace under a new script |
| Legacy Registry has no Factory identity token | **UNSUPPORTED / FAIL CLOSED** | Keep it outside the authenticated consumer path | Automatic migration, fake identity attachment or legacy first-match fallback |

### 45.85.3 Evidence from reusable Genesis carrier precedent

The current `GenesisCarrierMintPolicy.hs` is a one-shot mint constraint: it consumes the configured seed `TxOutRef` and permits exactly one configured token under its own currency symbol. It does not, by itself, prove that the minted token was placed at the intended state address with the correct datum/configuration.

The paired `GenesisRegimeCarrier.hs` spending validator then verifies one carrier token in the consumed state and one in the sole continuing state, exact Value continuity and the deterministic `ActivateGenesis` transition. It has no generic reset/reissue/repair action. This supports two separate conclusions:

- **Bootstrap must constrain placement and initial state atomically**, not merely consume a seed and mint a token.
- **A singleton continuation invariant prevents ordinary transition-level loss only when the actual Factory validator enforces it.** It does not define recovery after a bad bootstrap, permanently unusable script, or broken deployment parameterization.

This is a pattern/evidence reference, not proof that the Factory has been implemented. The reviewed branch contains no Factory/OpenRound production source.

### 45.85.4 Consequences for the Factory contract

The future Factory contract must separately prove:

1. Bootstrap consumes one exact seed once and creates exactly one Factory STT at the exact Factory state output, with the exact approved initial datum/config and no additional Factory token.
2. Every successful OpenRound consumes exactly one authenticated Factory predecessor and creates exactly one valid continuing Factory state with the same STT and the approved progression/config continuity.
3. The per-round identity mint and exactly one Pending Registry creation are atomic with that Factory continuation.
4. A stale competing transaction cannot alter canonical state; a participant can reread and retry.
5. No failure/recovery branch can mint or transfer an already-used round identity, erase history, change the publisher of a live Registry or replace the Factory policy identity without a separate canonical protocol transition.
6. If any required source/config/proof is missing, malformed or non-canonical, the transition fails closed.

These are acceptance properties to test, not an ABI or implementation decision.

### 45.85.5 Owner decisions still required

The evidence supports no automatic answer for:

- whether an irrecoverable Factory state means permanent SAFE STALL for that namespace or permits a deterministic migration/new namespace;
- what proof could establish that migration without reusing a round identity or rewriting canonical history;
- how to handle an unavailable/revoked B1 publisher for already-open Pending registries, given that the publisher is deliberately fixed per Registry;
- whether there is any recovery procedure before initial bootstrap versus after the one-shot seed has been consumed;
- how a deployment manifest is amended before bootstrap if the selected seed/config is invalid, without allowing a post-deployment reset.

Do not invent a recovery key, owner rescue transaction, burn/re-mint path or replacement policy. Such a path would be a new authority surface and would need an explicit protocol decision plus an adversarial uniqueness proof.

### 45.85.6 Disposition

**Operational liveness is designable without a privileged keeper:** re-discovery, competing submissions, stale-state retry and observer replacement follow the P0 model.

**Factory identity restoration is not yet design-closed:** the owner explicitly forbids per-round privileged signing and ongoing administrator capabilities, while no deterministic recovery/migration mechanism exists in the reviewed Factory source (there is no Factory source yet).

Therefore the correct interim condition is **permissionless retry where canonical state remains intact; fail-closed safe stall where authenticated Factory identity/state is missing or invalid**. This is not a claim that permanent halt is the final desired policy; it is the only non-invented disposition until a recovery proof contract is selected.

**Non-effects:** failure-mode/source analysis only. No code, ABI, policy, validator, test, workflow, CI, wallet, transaction, branch topology, deployment or ledger state changed. No reset, migration or recovery mechanism was selected.



---

## 45.86 AGENT B — MINIMUM APPLICATION-CONFIG CARRIER INTERFACE

**Date:** 2026-11-15  
**Exact reviewed HEAD:** `9638c7e85abc391ad5704b79542a49a26e94729d`  
**Classification:** INTERFACE / SECURITY CONTRACT — NON-NORMATIVE; NO ABI OR IMPLEMENTATION AUTHORITY  
**Scope:** separate canonical governance state, adopted PRE-RICH application configuration, Factory progression state and per-round Registry state. No new policy values are selected.

### 45.86.1 Why a separate application-config layer is necessary

The owner direction in Issue #49 comment `6717544912` explicitly separates:

1. immutable governance/genesis anchor;
2. ledger-verifiable governance transitions preserving GOV-16/17/18;
3. authenticated application-config carrier;
4. permissionless Factory transition;
5. independently authenticated Materios target inputs.

The application-config state is not the governance event log and is not the Factory sequence state. It is the *currently adopted, versioned application-policy projection* that Factory must read. A vote, Haskell replay, event JSON, canonicalization record or hash alone is not the carrier's trust root.

The required separation is:

```text
immutable deployment / governance genesis
                 |
                 v
Cardano-verifiable canonical GOV lifecycle
                 |
                 v
current adopted application-config state
                 |
                 +---- deterministic progression rule
                 |
                 +---- target-resolver contract
                 |
                 v
authenticated Factory STT + progression state
                 |
                 v
permissionless OpenRound + authenticated target witness
                 |
                 v
one per-round identity + one immutable Pending Registry
```

This does not mean each box must necessarily be a separate datum or script. It means their state, authority and transition predicates must not be collapsed into one mutable object whose provenance cannot be distinguished.

### 45.86.2 Minimum application-config content

The following is a **field-group contract**, not a selected Plutus datum/ABI or exact serialization. A future implementation may use typed fields, a canonical committed substructure or an equivalent authenticated representation, provided the on-chain verifier can establish every property required by OpenRound.

| Field group | Minimum information to bind | Status / constraint |
|---|---|---|
| Schema and state identity | Config schema/version, unique application/deployment namespace, identity of the Factory instance this config governs | Required; exact identifiers/bytes OPEN |
| Network/deployment domain | Exact network/deployment identity and the declared meaning/source of `BeaconTarget.networkId` | Required; do not infer semantics from the current DApp default `0` |
| Registry binding | Exact Registry payment credential/address form expected by the Factory and consumers | Required; exact script/address topology OPEN pending hash-acyclic design |
| B1 trust profile | Explicit B1-only profile for this Issue #49 Factory generation; no implicit B2/B3/B4 fallback | Owner direction recorded; no trust-mode overloading into `btVersion` |
| B1 publisher | The configured publisher identity used for *new* rounds under this config version | Required; not the OpenRound submitter; actual PKH and future rotation semantics not selected |
| Application/ruleset identity | Adopted application ruleset/version and the configuration commitment to which the proposal was canonicalized | Required; does not amend IMMORTAL economics |
| Round-progression contract | Deterministic rule identity/version and all parameters/state inputs needed to evaluate progression and any allowed skip | Required; exact next-round, skip, pause or stop predicates remain OPEN |
| Target-resolution contract | Deterministic resolver identity/version, declared source/network domain, and the semantics of every BeaconTarget field—especially `mainchainRef`—plus the required authenticated proof relation | Required; canonical round/checkpoint/anchor mapping remains BLOCKED |
| Governance provenance | Exact proposal/decision/canonicalization identity, ruleset version, prior config commitment and conformance/adoption evidence that authorizes this config version | Required as authenticated provenance; non-empty strings or a bare hash are insufficient |
| Version continuity | Monotonic config/state version and predecessor binding so a stale, replayed or forked config cannot be mistaken for current state | Required; exact encoding/transition ABI OPEN |

**Important distinction — commitment versus executable meaning:** `configHash` may bind canonical bytes, but it does not make an opaque policy executable. If Factory must evaluate a progression or target rule, the relevant rule identifier and parameters must either be interpreted by a fixed on-chain evaluator or be accompanied by a proof that the on-chain validator can independently verify. An unknown rule identifier, unsupported version or opaque hash with no verifiable semantics must fail closed.

Similarly, a target-resolver identifier does not prove an AnchorRecord belongs to a round. It must connect to the adopted round-selection rule and the independent Materios authenticity/key-value/semantic-binding obligations in §45.83 and Issue #49 comment `6817241935`.

### 45.86.3 Minimum Factory-state separation

Factory owns *progression state and uniqueness*, not application policy adoption or external truth.

Its minimum conceptual state is:

- the unique Factory STT identity and namespace binding;
- a versioned Factory state/transition nonce;
- the progression cursor/state needed by the adopted progression evaluator (which may include the last accepted round, but this document does not select a numeric progression rule);
- the immutable identity/location of the canonical application-config carrier it is required to read;
- any minimal binding necessary to ensure the referenced config belongs to this Factory namespace.

For each `OpenRound`, the Factory transition must consume exactly one authenticated Factory predecessor and read exactly one current authenticated application-config state. The config reference must be checked by its exact configured credential/address, singleton identity asset and quantity, namespace, schema/version and decodable datum. Absence, duplication, wrong identity, stale state, malformed datum or unsupported rule version fails closed.

The application-config state is not consumed merely because a round opens; it remains the current adopted configuration until a valid governance/canonicalization transition replaces it. Factory consumes and advances only its own STT. This preserves the owner-required distinction between governance/configuration changes and ordinary round execution.

The exact mechanism that makes a config UTxO the unique *current* state, binds the config token to immutable genesis, and handles configuration-update/OpenRound races still requires a separately reviewed script contract. It must guarantee that a transaction cannot successfully open a round against a stale config after that config has been superseded.

### 45.86.4 Configuration transition and effect on already-open rounds

A valid application-config update must be a versioned consequence of the canonical governance lifecycle, not an operator or publisher edit.

Minimum properties:

1. The current config predecessor is authenticated and uniquely identified.
2. The proposed new config is bound to the exact canonicalized application decision and required conformance/compatibility result.
3. The transition preserves one config-state identity and produces one canonical continuing config state; no parallel current configs or silent fork.
4. The new config carries a new version and an explicit predecessor link/commitment.
5. The transition cannot alter IMMORTAL economic invariants or bypass the existing GOV-16/17/18 lifecycle.
6. A config change affects only future OpenRound transitions. It cannot rewrite the target, publisher, trust assumption or identity of an already-created Registry UTxO.
7. A stale config reference cannot be used after a newer config state becomes canonical.

No per-round governance vote is required by this boundary. Ordinary OpenRound reads the latest adopted config and applies its deterministic predicate. Governance changes the long-lived rules/configuration; Factory applies those rules.

**Not selected:** exact governance state-carrier topology, config token minting policy, config address, field encoding, hash domain, update redeemer, version-increment rule, upgrade compatibility or race-resolution implementation.

### 45.86.5 OpenRound read/validation contract

The future OpenRound validation boundary must independently establish, in one atomic transaction:

1. Exactly one authenticated Factory input carrying the expected STT and exactly one continuing Factory output preserving it.
2. Exactly one current application-config reference with the expected singleton identity, full configured address/credential, namespace and decodable/version-supported config.
3. The config's governance provenance is valid under the authenticated canonical GOV state—not merely a caller-supplied commitment or Haskell witness.
4. The progression rule is recognized and evaluated against the actual Factory progression state; caller-supplied round numbers cannot override the result.
5. The target resolver is recognized and the complete `BeaconTarget` is derived/verified from the same config, round and authenticated external inputs. Caller/publisher/SDK defaults cannot choose fields.
6. The full target, expected B1 publisher and the current config version are fixed in the newly created Pending Registry.
7. Exactly one new per-round identity token is minted and exactly one Pending Registry output at the exact configured address carries it.
8. The Factory progression state, new identity and Registry output advance atomically; no other Factory mint/burn or duplicate Registry is accepted.
9. The submitter's PKH has no bearing on the result. Any eligible subject may construct, submit or retry the same valid transition.
10. A concurrent config update or competing OpenRound cannot leave a successful opening based on a superseded config or duplicate the same progression transition.

This is a boundary checklist only. It does not authorise appending fields to the seven-field Registry datum or changing existing consumers. The current per-round Registry identity remains carried in Value under the §45.81–§45.82 design candidate.

### 45.86.6 Existing carrier reuse assessment

The exact current source inventory at `9638c7e85abc391ad5704b79542a49a26e94729d` contains no `ApplicationConfig`, `GovernanceState` or `BeaconRegistryFactory/OpenRound` production module. The Plutus export set includes the existing Genesis, V3 economic-state and PreRichControl carriers; it exports no governance validator or canonical application-config carrier.

Relevant precedents are limited:

- `GenesisCarrierMintPolicy.hs` is a one-shot seed-UTxO/token mint constraint. It does not by itself constrain the destination output/datum/configuration.
- `GenesisRegimeCarrier.hs` shows a singleton transition pattern: exact carrier token conservation, one continuing output, state-version/nonce progression and a deterministic predicate. Its semantics are specific to PRE_GENESIS→GENESIS and authenticated Treasury/Oracle observations; it is not the application-config authority.
- `PreRichControlCarrier.hs` explicitly requires a configured authority signature for each transition. Reusing it as the OpenRound/config-governance authority would violate the owner's no-privileged-signer direction.
- `V3EconomicStateCarrier.hs` has an explicit authority-signature binding in its action. It is an economic-state carrier, not a permissionless governance/configuration authority.
- `GovernanceCanonicalizationWitness.hs` is a pure Haskell projection. It checks record fields, strings and boolean evidence flags; it does not verify a Cardano transaction signer, complete PRE snapshot, on-chain governance lifecycle or canonical config UTxO.

Therefore there is no exact existing carrier that can simply be parameterized and reused as the Factory's adopted application-config state without changing its trust model or semantics.

### 45.86.7 Blocking gates and next owner-independent work

| Gate | Evidence needed | Current disposition |
|---|---|---|
| G1 — Governance root | Authentic/complete PRE snapshot, credential-bound votes/delegations, full Cardano-verifiable GOV-16/17/18 lifecycle and canonicalization | **BLOCKED** |
| G1-F — Config projection | Versioned app-config state linked to verified canonicalization, with a unique authenticated state identity | **DESIGN CONTRACT ONLY** |
| G2 — Target resolver | Adopted `mainchainRef` meaning and canonical round→checkpoint→anchor rule plus external proof | **BLOCKED** |
| G3 — Progression | Exact adopted deterministic progression/skip/stop function and executable representation | **OPEN** |
| G4 — Bootstrap | Immutable deployment/genesis commitment binds initial config, Factory namespace, Registry identity, trust profile and seed | **OPEN / NOT DEPLOYED** |
| G5 — Factory | STT bootstrap/OpenRound implementation, concurrency proof and exact Registry output | **NOT IMPLEMENTED** |
| G6 — Resource/compatibility | Pinned-toolchain script-hash/CEK/transaction-size proof, legacy Registry inventory and owner-authorized changed paths | **BLOCKED** |

The next bounded work is a **field/proof traceability review**, not code:

- for each field group above, identify the authoritative source, on-chain verifier and exact evidence that makes it current;
- explicitly mark any field for which the verifier is not yet implemented;
- do not fill missing values with a signer, operator, API, SDK default, fixed calendar or off-chain replay;
- do not assign the progression rule or `mainchainRef` semantics in this audit.

**Disposition:** the minimum application-config interface can be described, but no authenticated current application-config state exists on the reviewed branch. A hash-only pseudo-carrier would not close the governance gap. Factory remains design-only until G1, G2 and the progression/config contracts are independently closed and implementation is separately authorized.

**Non-effects:** documentation/source crosswalk only. No production code, datum/redeemer ABI, governance rule, validator, minting policy, Factory source, Registry consumer, V3/Reveal semantics, economic rule, tests, workflow, CI run, wallet, transaction, deployment, branch topology or ledger state was changed or executed.

### 45.86.8 Exact source pins reviewed

| Source | Blob SHA | Finding |
|---|---|---|
| `PRE-RICH/onchain/GenesisCarrierMintPolicy.hs` | `c95a16b03258201a29b2593daecb8aa512fb259b` | One-shot seed consumption and singleton mint amount/name only |
| `PRE-RICH/onchain/GenesisRegimeCarrier.hs` | `276b09deace4475853320356375a12f9ee5f1d60` | Domain-specific singleton/value-preserving transition |
| `PRE-RICH/onchain/PreRichControlCarrier.hs` | `ce5a73dd29894367f031924e5a282935d8d3d66f` | Configured authority signature required |
| `PRE-RICH/onchain/V3EconomicStateCarrier.hs` | `f2d0beb9aeeddc0e95b21583d846d56786936dec` | Authority-signature binding for economic state |
| `IMMORTAL/governance/GovernanceCanonicalizationWitness.hs` | `8957b631183e5f69f759fddae0070d35815fb4ec` | Pure Haskell canonicalization projection, not ledger proof |
| `plutus/export/Export.hs` | `b33cd08b2d9dc6800215e771f18d561c87bc34c7` | Existing exports; no governance or ApplicationConfig validator |
| `plutus/pre-rich-plutus.cabal` | `49d2f812350710f44c13a7f8850f8abf6eeba376` | Governance Haskell modules/tests packaged, not a Plutus governance script |



### 45.87 Field/proof traceability — current-source audit

**Audit date:** 2026-11-15  
**Exact branch HEAD audited:** \`work/immortal-green-closure\` / \`ec65f8bf782cc315ecb303c6d527f38496b9b932\`  
**Classification:** READ-ONLY SOURCE TRACEABILITY; this section records current evidence and does not select new protocol values or authorize implementation.

This pass follows every minimum application-config field group from §45.86. It separates (1) the normative authority that ought to determine a value, (2) the current source/input from which the frontend or pure model obtains it, (3) the ledger predicate that constrains it, and (4) the evidence proving that predicate is bound to the current canonical state. A value appearing in a TypeScript type, browser environment variable, Haskell record, transaction datum or hash is not automatically an authenticated application-config value.

#### 45.87.1 Field-to-proof matrix

| Field group | Required authoritative source | What exists at the audited HEAD | On-chain verifier and exact evidence | Disposition |
|---|---|---|---|---|
| Application namespace / Factory binding | Immutable deployment/genesis commitment, then one authenticated current config state bound to exactly one Factory STT | No production ApplicationConfig or BeaconRegistryFactory/OpenRound module was found in the complete recursive repository tree at the audited HEAD. Existing Genesis carriers concern the PRE-RICH regime, not a Factory/application namespace. | No Factory validator exists to check a namespace, Factory token, config token or namespace-to-Factory relation. The Plutus export set contains no Factory or ApplicationConfig export. Tree evidence: audited HEAD above; export evidence: \`plutus/export/Export.hs\` SHA \`b33cd08b2d9dc6800215e771f18d561c87bc34c7\`. | **ABSENT — G4/G5 BLOCKED.** |
| Network / deployment domain and \`BeaconTarget.networkId\` | Adopted versioned config defining the exact Cardano deployment domain and the semantic mapping from that domain to the BeaconTarget field | Browser config sets \`NETWORK = 'Preprod'\`; \`src/mint.ts\` separately defaults \`networkId\` to \`0\` and permits an option override. The \`BeaconTarget\` type is only a number plus round/reference/version bytes. | \`plutus/BeaconRegistry.hs\` copies and compares the supplied target via \`sameTarget\` and uses its fields in beacon derivation. It does not prove that \`networkId\` means the configured Cardano network or derive it from authenticated deployment state. | **INPUT / PARTIAL PRESERVATION ONLY.** Bytes are committed into Registry/beacon calculation, but their network meaning/source is not authenticated. |
| Registry credential / address | Deployment-bound config and Factory parameters fixing the exact Registry credential/address expected for each round | \`createPendingRound\` derives an address client-side from the currently loaded unparameterized Registry script. The Registry datum has no Registry credential or Factory identity field. | The Registry validator checks that its own continuing output remains at its own input address and that only one input from that address is consumed for publication. This protects Pending→Ready continuity; it does not prove that a Factory selected the canonical Registry credential or that a Pending was created by Factory. Sources: \`src/createRound.ts\`, \`plutus/BeaconRegistry.hs\`, \`plutus/Types.hs\`. | **PARTIAL LOCAL CONTINUITY; FACTORY BINDING ABSENT.** |
| B1 trust profile / publisher PKH | Authenticated adopted config explicitly fixing B1 as the profile for this Factory generation and pinning the publisher identity for future rounds | Browser config exposes \`VITE_RELAYER_PKH\`; \`createPendingRound\` accepts \`relayerPkh\` from its caller and writes it into the new Pending datum. | \`BeaconRegistry.hs\` requires a transaction signature from the PKH already stored in the consumed Pending datum when publishing. It does not authenticate who selected/inserted that PKH at Pending creation or check it against canonical config. \`createRound.ts\` creates the Pending with ordinary \`payToContract\`, not a Factory transition. | **PARTIAL B1 PUBLISHER AUTHENTICATION; INITIAL BINDING ABSENT.** The signature proves control of the datum-selected PKH, not governance adoption of that PKH. |
| Application ruleset / config commitment | GOV-canonicalized, adopted application config bound to a specific proposal/decision, ruleset version and conformance result | \`src/beacon.ts\` derives GameRoundCommitment from supplied game ID, round, config hash and protocol version. \`src/registryFlow.ts\` checks the supplied commitment off-chain. The current seven-field Registry datum does not store GameRoundCommitment; \`plutus/Types.hs\` defines only round, target, status, beacon value, mcHash, Materios context and relayer PKH. | No Factory reads or verifies an adopted config state. The Registry validator does not check GameRoundCommitment, configHash, proposal ID or application ruleset. \`src/registryDatum.ts\` documents that the commitment is not written into the datum. | **OFF-CHAIN CONSISTENCY ONLY.** Commitment from supplied inputs is not proof the inputs were adopted. No ABI change is implied. |
| Progression rule ID / parameters | Versioned, governance-adopted deterministic rule evaluated against authenticated Factory progression state | No production Factory state or progression evaluator was found. Current frontend defaults round ID to zero and accepts a \`roundId\` option; relayer selection groups pending candidates by numeric round. | No on-chain \`lastRound + 1\`, skip, pause, stop or progression-rule evaluator exists in a Factory validator because Factory/OpenRound is absent. Registry publication checks continuity of the already-created datum only. | **ABSENT — G3 OPEN / G5 NOT IMPLEMENTED.** |
| Target resolver / \`mainchainRef\` / complete \`BeaconTarget\` | Adopted resolver version plus authenticated source-domain inputs and independently verifiable round→checkpoint→anchor relation | \`src/mint.ts\` defaults \`mainchainRef\` to UTF-8 \`pre-rich-round-<roundId>\` while permitting caller override. \`createPendingRound\` accepts a complete \`BeaconTarget\` argument. No resolver identity or relation is carried by a canonical config carrier. | Registry checks equality of target between Pending and Ready and derives the beacon from the submitted target plus submitted Materios context. It does not establish why that target belongs to that round. The existing B3/Materios audit remains applicable: upstream runtime accepts caller-supplied anchor identifiers and does not enforce the SDK hash convention as a consensus rule (Issue #49 comment \`6817241935\`; §45.83). | **CALLER-SUPPLIED TARGET; AUTHENTICATED RESOLUTION ABSENT. G2 BLOCKED.** |
| Governance provenance / PRE snapshot / canonical adoption | Cardano-verifiable GOV-16/17/18 lifecycle from a complete authenticated PRE snapshot through decision, adoption, conformance and canonicalization | \`Governance.hs\` models entities as \`EntityId = Integer\`, snapshots as supplied entity/weight pairs, and votes against those IDs. \`GovernanceEventSchema.hs\` stores event IDs, ruleset version, payload commitment, predecessor and evidence references as model data. \`GovernanceAuthorization.hs\` classifies event-type/actor-class pairs. \`GovernanceCanonicalizationWitness.hs\` checks fields and boolean evidence flags. | These are pure Haskell model/conformance components, not a Cardano transaction-context verifier. \`IMMORTAL/governance/README.md\` says standalone suites do not authenticate production actors/credentials, establish a live governance authority or certify on-chain governance. \`plutus/export/Export.hs\` exports no governance validator or governance-state carrier. | **BLOCKED — G1.** Haskell replay, event JSON, non-empty evidence strings and a bare hash cannot establish the canonical governance root. |
| Config version / predecessor / unique-current-state continuity | Canonical governance transition preserving one config-state identity, monotonic version and predecessor link, with stale-config rejection | Governance event models contain a predecessor string; existing Genesis, PRE-RICH Control and V3 carriers have their own state/version/nonce or authority patterns. No ApplicationConfig token/datum or transition module exists. | No on-chain config singleton, mint policy, unique-current-config rule, predecessor verifier, stale-reference rejection or config-update/OpenRound race predicate exists. Existing carrier rules are domain-specific; Control/V3 authority-signature patterns are not permissionless config governance. | **ABSENT FOR APPLICATION CONFIG.** Existing carrier patterns are precedents only. |

#### 45.87.2 What is genuinely enforced today

The current B1 Registry script enforces a limited proposition:

- the consumed Registry input is Pending;
- the transaction is signed by the \`brRelayerPkh\` contained in that Pending datum;
- supplied \`mcHash\` and Materios context are non-empty;
- exactly one input at the Registry's own address is consumed;
- exactly one continuing output at that address is decoded;
- the continuing datum preserves the full target, round and relayer PKH, becomes Ready and carries the beacon derived from the supplied target/context.

That proves **publisher authorization relative to the Pending datum and Pending→Ready continuity**. It does not prove the Pending datum was opened by the canonical Factory, that the round/target/config was adopted, that the publisher PKH came from governance, or that the external Materios record is canonical.

Likewise, \`GameRoundCommitment\` is a deterministic integrity primitive, but the source documents that it is not a Materios receipt or authentication proof for external Materios data. Its off-chain validation does not close the datum representation or canonical-config gap.

#### 45.87.3 Exact current source pins

All pins below were fetched from the audited branch HEAD \`ec65f8bf782cc315ecb303c6d527f38496b9b932\` during this pass:

| Source | Blob SHA | Traceability fact |
|---|---|---|
| \`src/config.ts\` | \`245d81ee6f9916623f7ed31fb4ef904af7407d3b\` | Browser \`NETWORK\` and \`VITE_RELAYER_PKH\`; not a ledger config carrier |
| \`src/mint.ts\` | \`1cde621e072db3b9db5b699377915b80b7db5c3e\` | Default network/round/version and caller-overridable target fields |
| \`src/beacon.ts\` | \`4ad58dedb68bb3db1b52900b113126105dcd8766\` | BeaconTarget and off-chain GameRoundCommitment/derivation |
| \`src/createRound.ts\` | \`4112d87b7b6d88d77da0bbaee5ed2e172527609e\` | Caller-supplied relayer PKH; ordinary Pending output creation |
| \`src/registryFlow.ts\` | \`c402d52ed1e60bb63d0f47d80de6cf0d48c71691\` | Off-chain GameRoundCommitment validation; current datum limitation documented |
| \`src/registryDatum.ts\` | \`0d611c29fe4f74b9b2fa4cd328e8fe2edb5f48f4\` | Exact seven-field datum encoding; no Factory identity/commitment field |
| \`plutus/Types.hs\` | \`60caeb747018b512e8e6ae7d8a100bb7023863d9\` | Seven-field BeaconRegistryDatum |
| \`plutus/BeaconRegistry.hs\` | \`184f4178139dde01845853dcc0ab51371949ec9b\` | B1 publisher-signature and Pending→Ready continuity checks |
| \`IMMORTAL/governance/Governance.hs\` | \`a55dc4bdaa3e9f081c9c050ea68fd9c6ac386f2e\` | Pure governance model and supplied snapshot weights |
| \`IMMORTAL/governance/GovernanceEventSchema.hs\` | \`3f933e727b4316e44bc2f456470410b3a8c635bc\` | Canonical event shape, string predecessor and evidence references |
| \`IMMORTAL/governance/GovernanceAuthorization.hs\` | \`8a2716ed368e7403fbac82c7121369bc95ae53d1\` | Event/actor-class rules, not ledger signer verification |
| \`IMMORTAL/governance/GovernanceCanonicalizationWitness.hs\` | \`8957b631183e5f69f759fddae0070d35815fb4ec\` | Pure Haskell canonicalization projection |
| \`IMMORTAL/governance/README.md\` | \`312175e57cb9e94972662353a2775f8fb545de44\` | Explicit limits of Haskell conformance evidence |
| \`plutus/export/Export.hs\` | \`b33cd08b2d9dc6800215e771f18d561c87bc34c7\` | No governance or ApplicationConfig validator export |

#### 45.87.4 Traceability conclusion and next gate

The matrix does not identify a hidden or reusable authenticated ApplicationConfig source. Current artifacts fall into four classes:

- **Frontend inputs:** deployment labels, defaults and environment variables; useful for constructing transactions, not protocol authority.
- **Off-chain deterministic models:** target encoding, GameRoundCommitment and governance replay; useful for consistency/conformance, not proof of canonical adoption.
- **Existing on-chain B1 checks:** publisher signature relative to the Pending datum and Registry transition continuity; useful but downstream of the missing canonical opening.
- **Domain-specific carriers:** Genesis, PRE-RICH Control and V3 state carriers; structural precedents, not an already-authorized ApplicationConfig or governance carrier.

Therefore G1, G1-F, G2, G3, G4 and G5 remain open/blocked as classified in §45.86. The gap is not merely a missing Factory validator; it is the absence of a provenance chain from immutable application genesis, through ledger-verifiable governance adoption, into a unique current config state that can safely determine progression and the complete target.

The next safe task is a separately reviewed proof/interface design for G1-F and the G2/G3 inputs. It must not invent missing source facts or substitute an off-chain authority.

**Non-effects:** documentation-only. No source code, datum/redeemer ABI, Registry consumer, governance semantics, Plutus script, Factory, wallet, workflow, CI run, transaction, deployment, branch topology or ledger state was changed or executed.


### 45.88 M1-A — current implementation, evidence and completeness boundary

**Audit date:** 2026-11-15  
**Exact source HEAD:** \`work/immortal-green-closure\` / \`0e2f4b0ddcedb702125db76f1c782393093b6de5\`  
**Tested implementation checkpoint:** \`7f8005fef23ff64ba88f1e97606b255c02adc802\`  
**Classification:** SOURCE / CI EVIDENCE REVALIDATION — NOT A LIVE LEDGER QUALIFICATION.

This section revalidates the M1-A PRE snapshot indexer against its executable code, test workflow, latest M1-A test job and local two-node runbook. It supersedes the older 69/69 and 78/78 summary counts where those are presented as the latest M1-A unit result.

#### 45.88.1 What is implemented

| Component | Current implementation | What it actually establishes |
|---|---|---|
| Pure PRE UTxO reducer | \`preSnapshotUtxoIndex.mjs\` takes a caller-provided bootstrap set, applies normalized blocks in transaction order, selects \`inputs\` or \`collaterals\` from the explicit Ogmios \`spends\` discriminator, handles collateral return, exact policy/name filtering, integer quantities and rollback | Deterministic state transition from the supplied initial UTxO set and supplied normalized blocks. It does not prove that the initial set is complete or that the block stream is an authenticated governance snapshot. |
| Canonical test message | Sorts raw address-byte leaves, aggregates all tracked UTxOs at the same raw address, and produces a deterministic Merkle-sum root plus digest. It binds module/schema/encoding, caller network label, slot/block/hash, exact asset policy/name, test identity-rule ID, leaf count and total | Byte-identical commitment for equal reducer state. The identity rule is explicitly \`raw-address-bytes-test-only-v1\`; it does not map payment/stake credentials to GOV entities, and the message is not yet bound to a proposal/voting-start predicate. |
| Ogmios v7 adapter and ChainSync | Decodes Praos blocks in the supported Shelley/Allegra/Mary/Alonzo/Babbage/Conway eras, preserves \`spends\`, decodes address/value/mint fields and drives \`findIntersection\`, forward blocks and rollbacks over WebSocket | A real local-node transport/indexing implementation is present in source. The unit suite exercises adapter and client behavior, but no live node session has been recorded. The Byron Base58 path does not yet validate its CBOR envelope/checksum; the M1 profile itself says not to claim production completeness while this remains open. |
| Persistent WAL | Hash-chained append-only block/rollback records, fsync, replay on reopen, local writer lock, manifest and rollback restoration | Detects accidental corruption/torn writes and recovers the locally recorded reducer state. The manifest/journal SHA chain is not an authenticated signature; an actor able to rewrite the complete local files can recompute it. It is a local single-writer persistence mechanism, not an authority or certificate. |
| Two-replica comparison | Requires two differently labelled replicas, distinct configured loopback Ogmios URLs and WAL directories; both sessions must intersect and advance to an operator-supplied \`expectedPoint\`; exact canonical bytes and digest must match | Detects disagreement between the two configured index states at the supplied point. Replica IDs and \`nodeInstanceId\` values are caller-provided labels, not cryptographic attestations that two physical hosts, operators or independent node processes are involved. |
| Kupo exact-point comparison | Requires a strict checkpoint at the supplied slot/hash and compares the exact-asset unspent matches with the reducer at the same retained point | Provides an independent index implementation comparison when a real Kupo database has indexed the same chain and point. Kupo does not certify governance eligibility, the bootstrap manifest, the correctness of the network label or the identity of the node/operator. Kupo's checkpoint does not supply the block number; the runner receives that from the externally supplied expected point. |
| Private non-zero fixture helper | Generates a fresh single-signature native asset \`M1TEST\`, quantity 100, under an ephemeral policy and pays it to the generated local \`utxo1\` wallet address. Runtime is restricted to WSL/Linux, \`cardano-cli 11.0.1\`, private network magic 4242, exact node1 socket/config paths and a confined local workdir. Submit requires a separate environment opt-in and a one-shot marker. | A safe way to exercise non-zero native-asset plumbing on a newly created private chain. It is not the production PRE asset, not a PRE distribution, not a multi-holder electorate and not evidence that the optional prepare/submit/verify sequence has actually run. |

#### 45.88.2 Exact CI qualification — and its limit

The latest M1-A workflow job found during this audit is:

- Workflow: \`.github/workflows/m1-a-pre-snapshot-tests.yml\`
- Run: [42481336005](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42481336005)
- Exact tested commit: \`7f8005fef23ff64ba88f1e97606b255c02adc802\`
- Job: \`Reducer + Ogmios v7 + persistent WAL\`
- Result from the job log: **79 tests / 79 passed / 0 failed / 0 skipped**
- The job also completed \`node --check\` for the reducer, Ogmios adapter, ChainSync client, WAL, replica comparator, dual runner, Kupo parity/HTTP/audit and private-fixture helper.

The commit comparison from that tested checkpoint to the source HEAD audited here (\`0e2f4b0ddcedb702125db76f1c782393093b6de5\`) contains 163 later commits and **no changes to the M1-A implementation, test, package or workflow paths**. The 79/79 result therefore remains applicable to the M1-A files present at the audited HEAD. The prior 69/69 and 78/78 entries are historical intermediate runs; the 79/79 job is the later verified result.

This is a **unit/synthetic CI qualification only**. The workflow installs its small Node dependencies and runs the M1-A test suite and syntax checks. It does not provision \`cardano-node\`, start Ogmios or Kupo, create the private testnet, connect to local node sockets, mint the \`M1TEST\` fixture or run a real chain rollback. In particular, fake-WebSocket runner tests prove the control flow of the runner, not independence or correctness of two live Cardano nodes.

#### 45.88.3 Bootstrap completeness is still the central M1-A gap

The code makes the bootstrap boundary explicit:

1. \`createPreSnapshotIndex({ networkId, asset, anchorPoint, utxos })\` receives the starting UTxO array as an input. It validates and normalizes the entries it receives; it cannot infer whether an omitted PRE UTxO exists elsewhere in the ledger.
2. \`createPreSnapshotJournal\` writes that same starting UTxO set into its local manifest and hashes the manifest. The digest detects subsequent accidental changes, but it does not prove that the source set was complete or that the manifest came from a Cardano ledger query.
3. \`preSnapshotDualReplicaRunner\` accepts \`initialUtxos\`, \`anchorPoint\`, \`networkId\`, asset identity and \`expectedPoint\` from its local configuration. The runner does not itself execute a whole-ledger query, reconstruct a historical full UTxO census or verify a checkpoint-bootstrap proof.
4. The M1 design documents specify full replay and checkpoint-plus-incremental as comparison baselines, but those acceptance paths have not been demonstrated as live M1-A evidence in this branch. The runbook's empty initial set is valid only for the controlled new private testnet origin, where the test asset is created later; it is not a valid shortcut for an already-running Preprod/Mainnet PRE distribution.
5. Kupo parity can expose a reducer mismatch at a queried point. It does not retroactively authenticate a supplied bootstrap manifest, and two local Kupo instances on the same operator-controlled private testnet do not create a multi-operator trust quorum.

Accordingly, **M1-A live bootstrap completeness is NOT QUALIFIED**. The required real run must include an independently evidenced complete bootstrap or full replay, exact chain point, raw TxIn/address/quantity comparison, two live node/ChainSync instances and exact-point Kupo parity. If the source query cannot establish the whole starting UTxO set at the selected point, the run must fail closed rather than accept a partial list.

#### 45.88.4 The M1-A output is not yet a GOV voting snapshot

The existing reducer is intentionally a test profile, and the following production inputs remain unselected or unproved:

- exact production PRE policy ID and asset name, including the source that makes this identity authoritative;
- exact Cardano point corresponding to GOV voting start, including timestamp-to-slot selection and finality rule;
- the complete eligibility/exclusion perimeter for payment outputs, script outputs, treasury, exchange/LP and other classes;
- mapping from raw Cardano addresses to GOV entities and aggregation across an entity's multiple addresses/credentials;
- treatment of addresses sharing a stake credential, enterprise/base/reward credentials and unsupported address eras;
- canonical proposal/snapshot-domain binding so a valid message for one proposal cannot be replayed as another proposal's snapshot;
- authenticity/completeness mechanism accepted by the governance protocol and independently verifiable at the ledger boundary.

The current leaf is a raw address-byte identity, with distinct addresses retained as distinct leaves even when they may share stake credentials. That is a deliberate M1 test choice, not a production GOV entity definition. The exact point is also an external \`expectedPoint\` supplied to the runner; M1-A does not decide which point corresponds to the governance voting-start instant. The network identity is a caller-supplied label in the reducer config, not by itself a proof of the Cardano network magic or genesis.

#### 45.88.5 Readiness matrix and next gates

| Gate | Current evidence | Status |
|---|---|---|
| M1-A reducer semantics | Pure reducer, adapter, WAL, rollback and adversarial fixtures; latest 79/79 CI | **UNIT QUALIFIED** |
| M1-A live node integration | Two-node WSL2 runbook exists; no live node/Ogmios session evidenced | **NOT RUN** |
| M1-A non-zero local asset | Guarded \`M1TEST\` helper and its unit tests exist; no prepare/submit/verify execution evidenced | **NOT RUN** |
| M1-A complete bootstrap/replay | Caller-supplied initial set and hashed local manifest; no demonstrated complete production or private-ledger bootstrap evidence | **OPEN / BLOCKED** |
| M1-A exact-point Kupo parity | Comparators and HTTP audit implemented; no live exact-point Kupo report | **NOT RUN** |
| M1-A resource/recovery qualification | WAL replay/rollback unit tests; no chain-size, disk-growth, restart, deep-rollback or throughput measurements | **OPEN** |
| Production PRE electorate | Asset identity, eligibility, entity/credential mapping and voting-start point unresolved | **BLOCKED BY G1** |
| M1-C custom Mithril certification | No PRE custom module deployed to signers/aggregators/clients and no real certificate | **NOT STARTED** |
| M2 Plutus certificate verification | No production-qualified recursive certificate verifier, CEK measurement or transaction-size proof | **NOT STARTED** |

**Disposition:** M1-A has a credible and tested software core. It is not a complete PRE census, has not passed a live Cardano-node/Kupo run, and does not authenticate a governance electorate. The immediate bounded action is to execute the documented private magic-4242 two-node test with the non-zero \`M1TEST\` fixture and retain the full runtime evidence packet. That will qualify only local indexing plumbing. It must be followed by a separate design and proof decision for production PRE bootstrap, entity identity, eligibility and the voting-start point before M1-C or any GOV snapshot can be treated as authoritative.

**Non-effects:** this revalidation is documentation-only. No M1-A source/test/workflow, governance semantics, production PRE identity, Cardano network, wallet, key, transaction, node, Kupo database, Mithril signer/certificate, Plutus verifier, V3, Reveal, Factory or Registry was changed or executed.

#### 45.88.6 Exact source pins reviewed at the audited HEAD

| Source | Blob SHA |
|---|---|
| \`audit/cardano-integration/preSnapshotUtxoIndex.mjs\` | \`08ee34ab4db1642ebd66410c1f17d8db9fb021b0\` |
| \`audit/cardano-integration/ogmiosV7PreSnapshotAdapter.mjs\` | \`24614d5c93199f23315316d2b5bc732eca4e78b5\` |
| \`audit/cardano-integration/ogmiosV7ChainSyncClient.mjs\` | \`5a1df47ad4974eabe38e8a597c23560bd8c47de9\` |
| \`audit/cardano-integration/preSnapshotJournal.mjs\` | \`1c352feb2a313dce0aba65540f9492ee0f79e874\` |
| \`audit/cardano-integration/preSnapshotReplicaConformance.mjs\` | \`d7edc7e3b4651919071734e4ac8dcb7f37b80e51\` |
| \`audit/cardano-integration/preSnapshotDualReplicaRunner.mjs\` | \`c1e1d13575d0d0cb89c03b14ebbe111a00e3fc62\` |
| \`audit/cardano-integration/preSnapshotKupoParity.mjs\` | \`e9ccb72133aa1327cf2a9bbb47797d53b7541b74\` |
| \`audit/cardano-integration/preSnapshotKupoHttp.mjs\` | \`2fa72b88af75abf72ad40b25fe1b2d22316c288c\` |
| \`audit/cardano-integration/preSnapshotKupoAudit.mjs\` | \`4ebd0708fc6b931d45bcd14f45abc5fb198443e4\` |
| \`audit/cardano-integration/preSnapshotPrivateTestAssetFixture.mjs\` | \`0a144ced20cd08a1befb62fec6fa5f429af0eaef\` |
| \`audit/cardano-integration/preSnapshotPrivateTestAssetFixture.test.mjs\` | \`443aaf38f0daf0477d47bb50b54455e09f27d4bb\` |
| \`audit/cardano-integration/package.json\` | \`095299264f8d44de9261a687d921831108dc8afb\` |
| \`.github/workflows/m1-a-pre-snapshot-tests.yml\` | \`6fa47e974b370924fff2e3ca685105942339dffb\` |
| \`docs/COORDINATION/AGENT-B-M1-A-LOCAL-NODE-INDEXER-EXECUTION-PROFILE-2026-11-08.md\` | \`96a2334c7b979c4c48de9bc8f94ec2e124e1ed2e\` |
| \`docs/COORDINATION/AGENT-B-M1-A-TWO-NODE-LOCAL-DEVNET-RUNBOOK-2026-11-08.md\` | \`68d89cf3fa4e26c0484d899af76bdd56ca06ce1a\` |


### 45.89 Whole-UTxO acquired-state bootstrap — concrete M1-A candidate

**Audit date:** 2026-11-15  
**Repository HEAD:** db9664c21935dfedabd87fa997fa6107c4ece36d  
**Upstream interface pin:** CardanoSolutions/Ogmios v7.0.0  
**Classification:** SOURCE-VERIFIED API CANDIDATE; LIVE COMPATIBILITY AND COMPLETENESS TEST NOT YET RUN.

This pass found a concrete way to remove the manually supplied initialUtxos from an M1-A bootstrap experiment: Ogmios v7's JSON-RPC schema explicitly permits a whole-UTxO query. It can be issued inside the same acquired ledger-state session used for an exact point query.

#### 45.89.1 Upstream API evidence

The exact upstream Ogmios v7.0.0 schema defines:

- QueryLedgerStateUtxo.params as optional and accepting UtxoByOutputReferences, UtxoByAddresses or WholeUtxo;
- WholeUtxo as an empty object type;
- QueryLedgerStateUtxoResponse.result as the typed Utxo array;
- each Utxo entry with transaction ID, output index, address and value, plus optional datum/hash/script fields;
- Ogmios Tip with slot, block ID and block height, while the point used by acquireLedgerState itself carries slot and block ID.

The v7 user guide shows the direct JSON-RPC request queryLedgerState/utxo with no filter parameters. Therefore a raw JSON-RPC request with an explicit empty params object is the schema-level WholeUtxo request candidate.

Important SDK limitation: the v7 TypeScript helper LedgerStateQuery.utxo(context, params?) declares only UtxoByOutputReferences or UtxoByAddresses; its typed wrapper does not expose WholeUtxo, even though the wire schema does. A first M1 probe would therefore use the generic JSON-RPC transport, not pretend the existing typed utxo() wrapper already implements whole-ledger retrieval.

This evidence establishes the declared v7 request/response contract. It does not yet establish that the project's pinned Ogmios binary returns a full, untruncated result at realistic ledger scale. That is a live integration-test requirement.

#### 45.89.2 Candidate bootstrap sequence

The following is the bounded experiment to add to M1-A after its exact request/response contract has been tested. It does not select a production PRE asset or a GOV snapshot point.

1. **Select a chain point with its height.** Obtain a ChainSync block/header observation or chain tip that binds slot, block hash/id and height to the same observed point. Do not combine the slot/hash returned by one request with a later independent queryNetwork/blockHeight result. The current reducer requires blockNo; queryLedgerState/tip in the v7 schema returns PointOrOrigin (slot/id), not a height. The bootstrap implementation must preserve the height from the matching ChainSync point/header, or use an already retained exact point-to-height mapping. If it cannot prove that mapping, it must not fabricate blockNo.
2. **Acquire that exact point.** Send acquireLedgerState for the selected slot/id; require the acknowledgement to return the same point. An acquire failure, point mismatch or rollback ambiguity discards the attempt and requires a new chain point. The existing ogmios-ledger-state-session.mjs demonstrates exact acquire/ack matching and explicit release, but belongs to the Agent A C1 observation path; no ownership transfer or code reuse is made by this audit.
3. **Query the whole UTxO set in the acquired session.** Issue queryLedgerState/utxo with no filter (wire-level WholeUtxo, optionally explicit empty params). The same acquired session must remain active for the entire query. Reject a JSON-RPC error, non-array result, malformed entry, duplicate TxIn, missing address/value, unsafe quantity, unsupported value representation or incomplete/failed response. An exception or transport interruption is not an empty set.
4. **Filter locally by exact asset identity.** Parse all output values with BigInt-safe JSON handling. Match both the exact 28-byte policy ID and exact asset-name bytes; never match ticker, UTF-8 display name, policy alone or a similar token name. For each matching UTxO preserve the exact TxIn, raw Cardano address bytes and positive integer quantity. Reject duplicate references and zero/negative quantities. Aggregate by the selected test identity rule only after every returned UTxO has passed structural validation.
5. **Create an auditable bootstrap manifest.** Bind network/genesis identity, acquired slot/hash, matching ChainSync block height, exact policy/name, total UTxO row count, matching PRE-bearing row count, exact aggregate quantity, filtered row digest, full raw-response digest, request/method, Ogmios/cardano-node versions and software/source pins. Retain the response or a reproducible local evidence file; a digest alone cannot reconstruct or prove the source response.
6. **Initialize M1-A and continue from the same point.** Use the filtered rows as the complete initialUtxos for createPreSnapshotIndex, and bind the WAL manifest to the exact same point and full bootstrap evidence. ChainSync must then find that exact point on the same selected chain before applying the next block; the first forward block must extend the selected point. If the point is not retained, a rollback crosses the bootstrap anchor, or an intersection is absent, stop and rebuild from a newly established complete bootstrap. Never combine a full-UTxO query at point P with a ChainSync stream whose intersection begins after P or on another fork.
7. **Repeat independently.** Each signer/node performs its own acquired-state WholeUtxo query and local filtering. Compare the complete PRE-bearing TxIn/address/quantity set, not only total or Merkle root, at the same network/genesis and exact point. Kupo may provide an additional exact-point independent-index comparison, but its result does not replace or authenticate the bootstrap query.

The selected ChainSync point and the acquired ledger state must be the same point. The Ogmios point shape alone lacks block height; the current M1 reducer point includes it. Height provenance is an explicit implementation requirement, not incidental metadata.

#### 45.89.3 What this closes — and what it does not

If the live test succeeds, this candidate closes a specific operational gap: M1-A no longer needs an operator to author a partial initialUtxos array. The starting UTxO set can be acquired from the local node's ledger state at a point, then reduced to exact-asset rows and followed incrementally.

It does not by itself establish:

- that an endpoint is an authentic Cardano node for the intended network/genesis;
- independence between two signer nodes if they share one operator, host, image or compromised software;
- correctness of the Cardano node binary or of a custom indexer's parser;
- the authoritative production PRE policy/name, voting-start point, eligibility/exclusion perimeter or GOV entity/credential mapping;
- whether two distinct payment addresses map to the same GOV entity or whether stake credentials should aggregate them;
- Cardano-verifiable completeness to a Plutus validator;
- Mithril signer adoption, stake threshold, genesis/circuit-key trust or a custom PRE certification module;
- a historical point that the local node can no longer acquire or whose state was not retained by the local indexer.

An acquired ledger state gives coherent answers at one acquired point. Ogmios documents that arbitrary historical points cannot always be acquired and that acquired states can expire. For future governance snapshots, the signer-local index should therefore bootstrap once and follow ChainSync continuously, retaining exact point history and rollback data; the WholeUtxo call is not a solution for repeatedly querying arbitrary old voting-start points.

#### 45.89.4 Cost and production boundary

Cardano API documentation classifies QueryUTxOWhole as O(n) time and O(n) space in the size of the UTxO set. It explicitly warns that obtaining the whole UTxO set is not efficient because the result can be huge. The Ogmios wire response is also one whole result array, so the experiment must measure:

- node-side query latency and peak memory;
- response bytes and JSON parse peak memory;
- number of total UTxOs versus matching-asset UTxOs;
- filtering/index initialization time;
- WAL manifest size and durable-write time;
- behavior under interruption, timeout and acquired-state expiry;
- recovery/restart time and exact-point continuity;
- results at increasing chain/index sizes.

This candidate is appropriate as a one-time experimental bootstrap/reference. It is not yet a production cadence decision. A signer-local incremental index after a complete bootstrap remains the candidate for repeated snapshots. If the full result cannot be acquired within bounded resources, use a separately proven full-replay/index bootstrap path; do not fall back to a hosted provider's holder list or silently accept a partial result.

#### 45.89.5 Relationship to existing code and ownership boundaries

| Existing source | Current role | Permitted conclusion |
|---|---|---|
| audit/cardano-integration/ogmios-ledger-state-session.mjs | Generic acquire/query/release lifecycle in Agent A C1 path | Useful structural precedent for exact acquire/ack matching; it does not perform a WholeUtxo query or a PRE census. |
| audit/cardano-integration/preprod-c1-acquired-point-observer.mjs | Queries five caller-supplied component addresses at one acquired Preprod point | Demonstrates same-point address queries only. Its own source states that candidate identity is untrusted and authority/C1 qualification are false. It does not establish complete global UTxO population. |
| audit/cardano-integration/preSnapshotUtxoIndex.mjs | Accepts caller-provided initial UTxOs and applies normalized blocks | Can represent the resulting exact-asset bootstrap after a separate decoder/manifest step; currently it does not call Ogmios WholeUtxo. |
| audit/cardano-integration/ogmiosV7PreSnapshotAdapter.mjs | Decodes full ChainSync blocks and their transaction outputs into the reducer contract | Its internal output decoder is not yet a verified WholeUtxo-response adapter. The new bootstrap must have its own tests and exact response-shape pin, including Byron address validation. |
| audit/cardano-integration/preSnapshotJournal.mjs | Stores a supplied bootstrap set and WAL events | Can durably preserve a bootstrap result, but its SHA-256 chain is integrity checking, not source authentication. |

Do not modify Agent A's C1 observer or Ogmios session as part of this experiment without a separately coordinated write slot. Keep M1-A as a separate component and import/reuse only a generic interface after owner/agent coordination.

#### 45.89.6 Required tests before calling this a real bootstrap path

The new M1-A module and tests must prove at least:

- exact WholeUtxo request shape against the pinned Ogmios v7.0.0 binary;
- the returned UTxO array is handled as a complete result and the result count is retained; no pagination/truncation assumptions;
- all value-map forms, BigInt-safe quantities, empty asset names, exact policy/name matching and decoy policies/token names;
- Bech32 Shelley address checks plus full Byron CBOR/checksum validation before a production completeness claim;
- duplicate/malformed TxIn, invalid address, malformed value, unknown era/schema and non-array/error responses fail closed;
- the selected ChainSync point's slot/hash/height is the exact point acquired and the anchor of the resulting WAL;
- a block arriving between point selection and acquire, an acquire-point mismatch, rollback, interruption, truncated response, oversized payload, acquired-state expiry and release failure cannot produce PASS;
- two independent local nodes reproduce byte-identical full matching UTxO rows and canonical message at the same point;
- Kupo's strict checkpoint and exact-asset unspent rows match the bootstrap output at that same point.

Only after those tests are added and run on the pinned toolchain may M1-A live acceptance start. The private M1TEST experiment still qualifies local plumbing only; it is not a PRE-RICH electorate.

#### 45.89.7 Exact pins and references

Repository sources at db9664c21935dfedabd87fa997fa6107c4ece36d:

| Source | Blob SHA | Finding |
|---|---|---|
| audit/cardano-integration/ogmios-ledger-state-session.mjs | 53dbc105c86c64a82399023d9365264131472a18 | Acquire exact point, verify acknowledgement, query only while acquired, release lifecycle |
| audit/cardano-integration/preprod-c1-acquired-point-observer.mjs | 1874885ed214b91563295e6fab8935097926a6c6 | Same-point address UTxO query; explicitly not authority or full census |
| audit/cardano-integration/preprod-c1-cardinality-decoder.mjs | ddcfeb5479b474a6e9fd7808162c9017b9955703 | Ogmios UTxO value/address cardinality decode; not a WholeUtxo census |
| audit/cardano-integration/preSnapshotUtxoIndex.mjs | 08ee34ab4db1642ebd66410c1f17d8db9fb021b0 | Reducer consumes supplied bootstrap UTxO rows |

Upstream Ogmios v7.0.0:

| Source | Blob SHA | Finding |
|---|---|---|
| clients/TypeScript/packages/schema/src/index.ts | 1d26902d1ab7a4322e72cb955b993bc032b47ed0 | Wire schema includes optional WholeUtxo {}, Utxo[] response and Tip.height |
| clients/TypeScript/packages/client/src/LedgerStateQuery/query/utxo.ts | b1f6c9c2e4193d6a512c4432f9b34dc6cf68b52e | Public TypeScript helper omits WholeUtxo from its params type |

**External API references:**
- Ogmios v7 ledger-state queries: https://ogmios.dev/mini-protocols/local-state-query/ (acquire a point, query within the acquired state; direct unfiltered queryLedgerState/utxo example).
- Ogmios v7 QueryLedgerStateUtxo schema: https://ogmios.dev/typescript/api/interfaces/_cardano_ogmios_schema.QueryLedgerStateUtxo.html (WholeUtxo is an accepted request type).
- Cardano API QueryUTxOWhole: https://cardano-api.cardano.intersectmbo.org/cardano-api/Cardano-Api-Query.html (whole UTxO query cost is O(n) time and space).

**Non-effects:** design/evidence documentation only. No source/test/workflow changed; no Ogmios node was contacted; no full UTxO response was requested; no local testnet, wallet, key, transaction or asset was created; no M1TEST submit, Preprod/Mainnet query, Mithril operation, governance decision, Plutus verification, V3/Reveal/Factory/Registry or economic state was changed.

### 45.90 WholeUtxo M1-A bootstrap candidate — isolated implementation and test wiring

**Audit date:** 2026-11-15  
**Base HEAD before this implementation:** c32dd1f244baf6c7540b1b9aeaacbffd70741ef3  
**Implementation sequence:** 285b7ec542d2e7ea0052e043fec652c07ed43705 → 3e5e19ee5212eb07c3e9ea3e12bd2b46c43fd041 → 18bb98fc0939761e7e5f154d904b59eff63a889c → 650b8df7d123cd735927759a5d36d5793da9296f → 83a073e0027d53852a6b9bdacbf72d6397acd834 → a44b67e4d5c92cb3da2206d22944b01bc154a0fb  
**Classification:** IMPLEMENTED CANDIDATE; REPOSITORY CI AND LIVE OGMIOS COMPATIBILITY NOT YET VERIFIED.

#### 45.90.1 Component boundary

Added a distinct M1-A module, `audit/cardano-integration/preSnapshotWholeUtxoBootstrap.mjs`. It does not import or modify the Agent A C1 acquired-session module. It accepts an already-acquired session through a narrow injected contract: `query(method, params)`, `isAcquired`, `isReleased`, `point`, and `release()`.

The bootstrap operation:

1. requires a caller-supplied ChainSync point containing slot, block number, block hash and one of the explicitly accepted observation-source labels;
2. checks that the acquired session slot/hash exactly match that ChainSync point;
3. issues exactly `queryLedgerState/utxo` with an empty params object `{}`;
4. rechecks that the acquired session and point remain unchanged after the query;
5. requires an array response and validates the UTxO entries, TxIn uniqueness, ADA value shape, every policy/name hex key and every integer asset quantity with BigInt-safe handling;
6. filters only by the exact 28-byte policy ID and exact asset-name bytes, preserving transaction ID, output index, decoded address bytes and quantity;
7. initializes the existing pure M1-A reducer at the same slot/hash/block number;
8. attempts session release on all operation paths after session acceptance; failed or unconfirmed release prevents a candidate result from being returned.

The module does not acquire a point itself and does not claim the supplied source label is cryptographic proof. The caller remains responsible for deriving the height from the same ChainSync observation as the slot/hash; independent height queries or fabricated values are not accepted by the design.

#### 45.90.2 Asset/address and evidence constraints

- Empty asset-name bytes are handled as the explicit empty string `assetNameHex: ''`; a missing asset-name property is rejected.
- Asset quantities are kept as BigInt/string at boundaries; unsafe JavaScript numbers, duplicate TxIn, malformed value maps and non-positive quantities fail closed.
- For a PRE-bearing output, only Shelley Bech32 `addr1` / `addr_test1` addresses are accepted by this candidate. Byron/Base58 PRE-bearing outputs are explicitly rejected because the existing Base58 decoder does not validate the full Byron CBOR envelope and checksum. This is a deliberate qualification limit, not proof that the whole ledger contains no Byron outputs.
- The response digest is SHA-256 over a locally canonicalized decoded JSON representation, not a digest of raw wire bytes. The manifest records `rawWireBytesAvailable: false`. A live integration run must retain the original query response/evidence artifact independently if raw-wire reproducibility is required.
- Manifest qualification remains `CANDIDATE_ONLY_NO_SOURCE_COMPLETENESS_PROOF`; authority remains `NOT_ESTABLISHED`. The function cannot prove node identity, network/genesis authenticity, response completeness, or governance eligibility.

#### 45.90.3 Tests and CI wiring

Added `preSnapshotWholeUtxoBootstrap.test.mjs` with cases for exact request/empty params, point anchoring, policy/name decoys, BigInt quantities, empty asset name, empty result, duplicate/malformed TxIn, invalid ADA/value/quantity/address, Byron refusal, session mismatch/expiry, query failure and release failure.

The `test:pre-snapshot-index` npm script now includes the new test, and the standalone `test:pre-snapshot-whole-utxo` script was added. The existing M1-A workflow path filters and syntax-check step now include both new files.

**Local evidence limit:** an isolated temporary Node test harness for the bootstrap control flow reported 19/19 assertions passing. That harness used stub implementations for the reducer and address decoder; it is not a run of the committed repository test against the real reducer/adapter, and it is not GitHub Actions evidence. The committed repository test has been wired into CI, but no PASS status is claimed here until that workflow result is observed.

#### 45.90.4 Remaining gates

| Gate | Current state |
|---|---|
| Isolated bootstrap module and repo test source | **ADDED** |
| npm and M1-A workflow wiring | **ADDED** |
| Real repository test execution / CI | **PENDING VERIFICATION** |
| Pinned Ogmios v7 binary: full response shape, completeness and payload/resource behavior | **NOT RUN** |
| Live acquired-point WholeUtxo query | **NOT RUN** |
| Byron CBOR/checksum validation | **NOT IMPLEMENTED; Byron-bearing PRE output rejected** |
| Two independent signer/node full-row parity and same-point Kupo comparison | **NOT RUN** |
| Production PRE identity, electorate, eligibility, voting-start point and source authenticity | **BLOCKED / OUT OF SCOPE** |
| M1-C Mithril and M2 Plutus verification | **NOT STARTED** |

This implementation creates a bounded adapter candidate to remove operator-authored `initialUtxos` from a controlled M1-A experiment. It does not close the live bootstrap/completeness gate or qualify a governance snapshot. The whole-UTxO response remains a large one-shot result whose memory/latency ceiling must be measured against actual local nodes before any operational cadence decision.

#### 45.90.5 Exact source pins at the implementation HEAD

| Source | Blob SHA |
|---|---|
| `audit/cardano-integration/preSnapshotWholeUtxoBootstrap.mjs` | `c74853ace9095e5c6090b94a1fdfd507d92d954b` |
| `audit/cardano-integration/preSnapshotWholeUtxoBootstrap.test.mjs` | `5fd724c7036cbf199900d0acf23f1fe5a64750a5` |
| `audit/cardano-integration/package.json` | `1a237eb157de8fdb6b7942c9ae2ade34e1ef0696` |
| `.github/workflows/m1-a-pre-snapshot-tests.yml` | `1afad8022d91d0037b5a4d2de7b11d113eb6b927` |

**Non-effects:** No Agent A C1 observer/session, Treasury implementation, V3, Reveal, economics, governance rules, Registry, production Cardano network, node, wallet, key, transaction or asset was changed or contacted. No M1TEST fixture transaction, Mithril operation, deployment or production action was executed.


## 45.91 AGENT B — BEACON REGISTRY ADVERSARIAL CEK SUITE WIRED INTO HASKELL CI (2026-11-15)

**Base HEAD:** `639110ff6574c64cfb020653204d28f3560a94c0`  
**Implementation commit:** `0482d6a1fc51a3546f4325bf4296cb11c534a5ce`  
**Changed path:** `.github/workflows/immortal-haskell-conformance.yml` only  
**Classification:** CI TEST-WIRING ONLY; NO PROTOCOL OR VALIDATOR SEMANTICS CHANGED.

The existing Cabal test suite `beacon-registry-adversarial-tests` was registered in `plutus/pre-rich-plutus.cabal` and the source `plutus/test/BeaconRegistryAdversarialTest.hs` existed, but the branch's `immortal-haskell-conformance.yml` did not invoke it.

Added the workflow step:

```yaml
- name: BeaconRegistry adversarial characterization (CEK only)
  working-directory: plutus
  run: cabal test beacon-registry-adversarial-tests --test-show-details=direct
```

The step runs the existing compiled-wrapper CEK suite. Its output deliberately includes CHARACTERIZATION acceptances for known gaps (including caller-controlled Pending Registry references, `brRound`/target mismatch, Registry Value delta, fake Ready Beacon, same-payment-ScriptHash lookalike and multiple matching Registry references). Those CHARACTERIZATION passes are evidence of current-source behavior, not security approvals. The suite is not balanced-ledger, Yaci, Preprod or deployment evidence.

**Verification:** branch HEAD and workflow contents were re-fetched after the write; HEAD is `0482d6a1fc51a3546f4325bf4296cb11c534a5ce`, and the exact Cabal command is present. The commit combined-status endpoint returned an empty status list at verification time; no CI PASS is claimed yet.

**Non-effects:** no Haskell/TypeScript source, datum/redeemer ABI, validator, minting policy, Registry identity mechanism, Factory, V3, Reveal, B2, economic rule, Treasury, workflow trigger, wallet, transaction, deployment or ledger state was changed. No CI run was manually dispatched and no live network was contacted. This change does not close Issue #43 or Issue #49 and does not promote Registry authenticity to GREEN.


## 45.92 AGENT B — REGISTRY / SYNCBEACON CEK MATRIX EXPANSION (2026-11-15)

**Base HEAD:** `524dcd6b9ecc674e0e47d7e1d92b4cd8f513b237`  
**Test commit:** `da619424d4a24d9a4a92af4cf319716ea82b753e`  
**Test path:** `plutus/test/BeaconRegistryAdversarialTest.hs`  
**Changed paths in this implementation commit:** the test path only  
**Classification:** COMPILED-WRAPPER CEK TEST EXPANSION; NO PROTOCOL OR VALIDATOR SEMANTICS CHANGED.

### 45.92.1 Added CEK cases

The existing `beacon-registry-adversarial-tests` suite was expanded against the existing production compiled wrappers:

- `RegistryPublish` rejects an empty Materios context (the empty `mcHash` rejection was already present).
- `SyncBeacon` rejects a `BeaconPending` Registry reference.
- `SyncBeacon` rejects a `brRound` that differs from the ticket target round.
- `SyncBeacon` rejects a target/version mismatch.
- A named `CHARACTERIZATION` case records that `SyncBeacon` accepts a Ready Registry datum with non-empty Beacon bytes but empty `brMcHash` and empty `brMateriosContext`.

The test blob at the new branch HEAD is `700e2a8c25f9fd80396437caebfb4686a58e52c4`. The GitHub compare from the base to the test commit reports one modified path and 34 additions, zero deletions.

### 45.92.2 Consolidated current-source propositions

The combined current test/source evidence distinguishes these propositions:

| Boundary | Current enforced behavior | Current gap / characterization |
|---|---|---|
| Pending creation | DApp builder derives the Registry address and creates the seven-field Pending datum | Ordinary `payToContract`; no Factory/one-shot identity; caller selects `BeaconTarget` and `relayerPkh` |
| MintPolicy sale consumer | Requires a decodable Pending datum with matching ticket target/round predicates | The Registry is only a reference input; the Registry validator does not execute. A buyer-controlled Pending publisher field is accepted by the compiled MintPolicy CEK fixture |
| RegistryPublish | Requires Pending state, nominated datum-PKH signature, non-empty `mcHash`/context, one Registry input, one continuing Registry output, same target, Ready status and derived Beacon bytes | Nominated PKH was not authenticated at creation; `brRound == btRound(brTarget)` is not separately enforced; continuing Registry Value is not compared with input Value |
| Prize SyncBeacon consumer | Requires Ready status, ticket-round equality, full target equality, non-empty Beacon bytes, one Prize input/output, unchanged Prize Value and exact copied fields | A reference input does not execute RegistryPublish. Non-derived Ready Beacon, empty receipt fields, no Registry signature/spend, same-payment-ScriptHash address lookalike and multiple matching Registry references are accepted by current CEK characterizations |
| Registry reference selection | Configured Registry payment ScriptHash is used to identify a candidate reference | Both `MintPolicy.readRegistry` and `PrizeValidator.readRegistry` return the first matching payment-ScriptHash reference; neither enforces exactly one authentic per-round identity token |

**Important:** a `CHARACTERIZATION` pass means “the existing source accepts this synthetic context”; it is not a security approval, a balanced-transaction result or proof that a currently deployed instance has been exploited.

### 45.92.3 CI status and evidence boundary

The workflow step invoking `cabal test beacon-registry-adversarial-tests --test-show-details=direct` was added in commit `0482d6a1fc51a3546f4325bf4296cb11c534a5ce`.

The current workflow's `push.paths` and `pull_request.paths` already include `.github/workflows/immortal-haskell-conformance.yml`. The test expansion changes `plutus/test/BeaconRegistryAdversarialTest.hs`, which is covered by the existing `plutus/**` push path.

At the time of this audit, the combined-status endpoint returned an empty status list for `da619424d4a24d9a4a92af4cf319716ea82b753e`; the available commit-run wrapper returned no runs because it exposes PR-triggered runs only. Therefore no current exact-HEAD CI PASS or FAIL is claimed. The suite is wired; execution evidence remains pending observation.

The suite runs Plutus CEK over synthetic `ScriptContext` values. It does not prove balanced transaction acceptance, actual ledger execution, Yaci behavior, deployed script identity, transaction size/fees/ExUnits, Preprod behavior or Registry deployment identity.

### 45.92.4 B0 disposition and next proof boundary

Issue #43 remains OPEN. The source/CEK work now gives stronger bounded coverage for RegistryPublish and SyncBeacon, but it does not satisfy the issue's exact-ending-SHA workflow evidence or independent Plutus/security review requirements.

Do not change the seven-field datum, redeemer ABI, Registry policy, consumers, V3, Reveal, B2 or economics as an incidental continuation. The next major proof boundary remains separate:

1. **T01a/T01b:** balanced ledger evidence for Pending/Ready-shaped Registry output creation at the Registry address without Registry validator execution, where applicable.
2. **T04:** a ledger twin in which a Prize UTxO is spent through the exact production Haskell V2 PrizeValidator while a Ready Registry UTxO is supplied only as a reference input.
3. **Deployment identity:** exact deployed Registry script hash/artifact and any required identity token or Factory binding must be established before a production trust claim.
4. **Remediation authority:** any change to Registry datum/identity, publisher source, Factory or consumer reference predicates remains a separately scoped design/ABI/security decision; Issue #43 itself does not authorize an unreviewed schema or semantic change.

**Disposition:** CEK matrix expanded and CI command wired; exact-HEAD execution not yet evidenced; Registry authenticity remains **BLOCKED**; no GREEN promotion.

**Non-effects:** no production Haskell/TypeScript source, datum/redeemer ABI, validator/policy, Registry or Factory mechanism, V3/Reveal/B2/economic/Treasury/Materios code, workflow trigger, wallet, transaction, deployment or ledger state changed. No wallet or network action was taken.


## 45.93 AGENT B — DERIVED-CONSISTENT FAKE READY CHARACTERIZATION (2026-11-15)

**Base HEAD:** `ec4e784d899e13b5b69164cfda6c4305ab3f9861`  
**Test commit:** `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`  
**Changed path:** `plutus/test/BeaconRegistryAdversarialTest.hs` only  
**Classification:** ADDITIONAL CEK CHARACTERIZATION; NO VALIDATOR OR PROTOCOL SEMANTICS CHANGED.

Added a second Ready-reference characterization that is stronger and more realistic than the existing arbitrary non-derived fake Beacon case:

1. The fixture chooses attacker-controlled non-empty `mcHash` and `materiosContext`.
2. It computes `brBeaconValue` using the actual production `deriveBeacon` function over the exact target and those values.
3. It creates a synthetic Ready Registry reference datum carrying those values and a buyer-controlled `brRelayerPkh`.
4. The compiled production `PrizeValidator.compiledValidatorFactory` SyncBeacon branch accepts the context although there is no Registry spending input, Registry redeemer, Registry validator execution or relayer signature in that Prize transaction.

This narrows the security interpretation: the bypass is not dependent on an obviously invalid arbitrary Beacon. A caller can supply a Beacon internally consistent with its own chosen receipt fields, and SyncBeacon only checks/copies those fields rather than authenticating their publication provenance.

**Evidence limit:** this is a synthetic CEK context and proves only the current SyncBeacon predicate accepts that context. It is not a balanced Yaci/Preprod transaction, does not itself execute the Reveal branch, does not measure whether a buyer can grind a particular payout, and does not authenticate any deployed Registry instance. The wider buyer-grinding path remains a source-derived B0 risk recorded in Issue #43 and still needs its complete ledger twin/evidence.

The current branch HEAD was verified as `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`; the test blob is `f17a9b8686fa1d0851a249d76b27a169b5a8db94`. Combined commit status was empty at verification time; no exact-HEAD CI result is claimed.

**Disposition:** derived-consistent fake Ready behavior now has a named compiled-wrapper CEK characterization. Registry authenticity, publication provenance and the full T04/T01b ledger proof remain **BLOCKED**.

**Non-effects:** no production validator/policy, on-chain ABI, DApp/relayer code, V3, Reveal, B2, economics, Factory, Materios, workflow trigger, wallet, transaction, deployment or ledger state changed.


## 45.94 AGENT B — RELAYER WORKER PENDING-SELECTION REVALIDATION (2026-11-15)

**Audited branch:** `work/immortal-green-closure` (re-fetched during this pass)  
**Classification:** READ-ONLY WORKER / TEST / CI CROSSWALK; NO RELAYER OR PROTOCOL SOURCE CHANGED.

### 45.94.1 Current active selection path

The current `relayer/relayer.js::beaconWorker` calls the extracted pure `selectPendingRegistryCandidates(registryUtxos, decodeRegistryDatum)` helper. It no longer uses the older inline grouping behavior described in the 6 November comments.

The helper currently:

- rejects datum decode failures and undecodable datums;
- selects only `BeaconPending` (`status === 0`);
- requires both round fields to decode as BigInt;
- rejects `brRound != btRound(target)`;
- groups by `target.round`;
- selects only a single candidate in a round and refuses every duplicated round.

The current deterministic Node test file contains six cases for duplicates, round mismatch, malformed datum, semantically unqualified Pending, Ready exclusion and independent distinct rounds. The dedicated `beacon-registry-worker-conformance.yml` workflow runs this test file on Node 22 and watches the active worker, selector, test and workflow paths.

### 45.94.2 Remaining worker boundary

The active worker obtains the wallet from `RELAYER_PRIVATE_KEY`, then calls `beaconWorker(lucid)`. The selection helper and `beaconWorker` do not compare `datum.relayerPkh` to the actual wallet payment credential before attempting publication.

Consequences:

- A singleton Pending with a foreign `brRelayerPkh` can be selected and submitted by the worker; the on-chain Registry validator then rejects the transaction because the selected datum Pkh did not sign.
- A foreign-Pkh candidate can contribute to a duplicate-round refusal if another otherwise-qualified Pending exists for the same target round.
- The worker catches publication errors, so the failure is retried on a later polling iteration rather than changing the on-chain state.

This is a worker liveness/resource-selection gap, not a way to forge the configured wallet's signature.

### 45.94.3 Why a local Pkh filter would not authenticate Registry creation

Even if a future worker filter checks the datum's publisher Pkh against the wallet's derived Pkh, that remains an operational filter only. The Pkh is public, and the current Pending builder can put that same public Pkh into an ordinary script-address output without executing `BeaconRegistry`. A caller can therefore construct a lookalike Pending that passes such a local Pkh comparison.

Only an authenticated on-chain opening/identity mechanism can prevent that class of counterfeit Pending from being treated as canonical. The worker filter may reduce pointless attempts but cannot replace the Factory/STT and per-round identity design.

The selector also groups on numeric target round rather than independently authenticating the complete `BeaconTarget` tuple, Registry namespace or per-round identity. It is a deterministic queue filter, not a trust boundary.

### 45.94.4 Scope and disposition

The 6 November Issue #43 coordination comment already noted that its concrete path manifest did not enumerate `relayer/relayer.js`, `relayer/beaconRegistrySelection.js` or `relayer/__tests__/`. No change to those paths is made in this pass. Any follow-up implementation must first reconcile the Issue #43 changed-path manifest/owner review so that worker selection is not modified outside its agreed write perimeter.

**Disposition:** duplicate and round-mismatch worker protection is present and unit-tested; publisher-Pkh prefilter is absent and remains a bounded liveness issue; neither worker filtering nor its tests authenticate Registry creation. Factory/Registry identity remains the required protocol-level remedy. No GREEN promotion.

**Non-effects:** no relayer source, test, workflow, key, environment file, Plutus/TypeScript source, ABI, validator, Factory, V3/Reveal, B2, economics, Treasury, Materios, wallet, transaction, deployment or ledger state changed.


## 45.95 AGENT B — T01b/T04 LEDGER BOUNDARY AND PRIZE VALIDATOR SIZE GATE (2026-11-15)

**Reviewed branch HEAD before this entry:** `637e7709aa07b802e3accc7acba4a2915f76d523`  
**Changed implementation path in this pass:** `.github/workflows/prizevalidator-conservative-optimization-experiment.yml` only  
**Classification:** LEDGER-TEST INVENTORY + RESOURCE GATE; NO PROTOCOL SOURCE/ABI CHANGE.

### 45.95.1 T01b is already in the active Yaci lab

The current `audit/cardano-integration/beacon-registry-adversarial-ledger-trace.ts` (source blob `4478b99e964c6d31ef80614044f6609eab38ecac`) already contains the T01b ledger action:

- an ordinary wallet transaction creates three Pending-shaped outputs at the unparameterized Registry script address;
- a second ordinary wallet transaction creates a Ready-shaped Registry output at that same script address;
- the direct Ready transaction has no Registry spending input, does not attach the Registry validator, and does not execute its spending validator;
- the script confirms the exact seven-field datum and Value on the resulting UTxO;
- the same local trace also performs balanced RegistryPublish twins for a Registry continuation Value reduction and a `brRound != btRound(target)` characterization.

The active `.github/workflows/immortal-cardano-lab.yml` invokes this file as step `beacon_registry_b0_yaci` ("Execute B0 BeaconRegistry adversarial Yaci ledger characterization"). At the time of this entry, run `43678893383` on source commit `53edd61177968ad4f2e1d0dc761c9c5d152bab1e` had reached that step, which was still `in_progress`. No PASS/FAIL result is claimed in this entry.

The trace's own evidence limitation is explicit: its direct Ready output does not prove that a PrizeValidator accepts that Ready as a SyncBeacon reference. It is T01b / Registry creation-and-publication evidence only.

### 45.95.2 The existing SyncBeacon Yaci trace is Aiken V3, not Haskell V2

`audit/cardano-integration/aiken-sync-beacon-ledger-trace.ts` exercises an Aiken Plutus V3 Prize candidate against local Yaci and includes ordinary-payment Ready-shaped Registry reference cases. It is useful for transaction/reference-input mechanics and the Aiken candidate's consumer behavior, but it is not a ledger twin for the canonical Haskell V2 `PrizeValidator.compiledValidatorFactory`.

The existing `plutus/test/BeaconRegistryAdversarialTest.hs` suite executes the actual Haskell V2 production wrapper in CEK over synthetic `ScriptContext` values. Its direct Ready / derived-consistent fake Ready cases remain CEK characterizations, not native-ledger acceptance evidence.

### 45.95.3 Haskell V2 T04 is currently blocked by the 16,384-byte transaction ceiling

The existing resource audit records the canonical parameterized Haskell V2 PrizeValidator baseline at **16,443 bytes**, while the active Cardano transaction size ceiling is **16,384 bytes**. A prior Haskell V2 reference-script publication trace measured **16,540 bytes**. Those are not small transaction-builder defects: the parameterized validator/reference-script publication does not fit the current transaction envelope. Do not create a fake T04 success by raising the local maxTxSize, swapping in Aiken V3, using a different validator hash, or claiming CEK/evaluateTx as a ledger submission.

Accordingly, the Haskell V2 T04 ledger twin is **RESOURCE BLOCKED** until an exact canonical Haskell V2 artifact can be published/referenced within the active limit, or an already-published byte-identical reference script is independently found and authenticated. Even after size feasibility is restored, the test must still:
- create a synthetic Pending Prize UTxO using the exact parameterized Haskell V2 script;
- create a Ready-shaped Registry UTxO by ordinary payment, with no Registry validator execution;
- spend only the Prize UTxO via Haskell V2 SyncBeacon and pass the Ready Registry only through reference inputs;
- record script hash, full transaction CBOR/size, evaluator mode/ExUnits, ledger accept/reject, and pre/post UTxO state;
- classify construction/size failure separately from Plutus semantic rejection.

### 45.95.4 Existing conservative size experiment enabled for repeatable execution

The repository already contains `.github/workflows/prizevalidator-conservative-optimization-experiment.yml`. It:
1. asserts an exact baseline script/factory hash and size before proceeding;
2. temporarily adds only the Plinth compiler's `conservative-optimisation` option to `plutus/PrizeValidator.hs` inside the ephemeral runner;
3. recompiles and measures the isolated candidate;
4. restores the source/generated artifacts in an `always()` cleanup and verifies no tracked worktree diff remains;
5. uploads size-only evidence.

The comparison is explicitly **compile-size only**. Its projected publication byte count is a projection, not a built transaction; it claims no CEK-cost/semantic equivalence, no transaction, no Yaci acceptance and no production artifact qualification.

Added `workflow_dispatch` to the workflow's existing path-filtered push trigger so this bounded experiment can also be launched manually later. The push itself started run **43679611905** on `637e7709aa07b802e3accc7acba4a2915f76d523`; at the time of this entry it was still in progress during dependency installation. No candidate size result is claimed yet.

The measured baseline and threshold remain:
- canonical parameterized baseline: **16,443 bytes**;
- active max transaction size: **16,384 bytes**;
- conditional candidate threshold: **16,287 bytes**, based on the experiment's 97-byte non-script remainder projection.

Passing the 16,287-byte size threshold would only justify a subsequent independent CEK/adversarial equivalence run and a real reference-publication/ledger feasibility test. It would not itself authorize use of the candidate as a production validator.

### 45.95.5 Current dispositions and non-effects

| Gate | Disposition |
|---|---|
| T01b direct Ready output creation | Implemented in current Yaci trace; current run result pending |
| RegistryPublish Value-delta / round-mismatch ledger characterization | Implemented in same Yaci trace; current run result pending |
| Aiken V3 SyncBeacon Yaci characterization | Separate existing trace; not Haskell V2 evidence |
| Haskell V2 SyncBeacon CEK characterization | Implemented in BeaconRegistry adversarial suite; exact-HEAD CI pending |
| Haskell V2 T04 Yaci ledger twin | **RESOURCE BLOCKED** by script/reference-publication transaction size |
| Conservative compiler size experiment | Run `43679611905` started; result pending |
| Registry authenticity / Factory identity | **BLOCKED** |

**Disposition:** T01b is not missing code; its active Yaci result must be read before claiming the ledger characterization has passed. T04 is not safely executable on the canonical Haskell V2 artifact under the recorded transaction-size measurements. Size feasibility is the next prerequisite; semantic qualification remains a separate gate after it.

**Non-effects:** no `PrizeValidator.hs`, `BeaconRegistry.hs`, `Types.hs`, datum/redeemer ABI, Registry consumer, V3, Reveal, B2, economic policy, Treasury or Materios semantics changed. No maxTxSize was raised, no wallet/network secrets were used, no Preprod/Mainnet action was performed, and no production validator artifact was replaced.


## 45.96 AGENT B — T01b / REGISTRY-PUBLISH LOCAL YACI STEP PASSED (2026-11-15)

**Lab run:** `43678893383`  
**Lab source SHA:** `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`  
**Job:** `132705524504` (`devnet-integration`)  
**Step:** `beacon_registry_b0_yaci` — "Execute B0 BeaconRegistry adversarial Yaci ledger characterization"  
**Step conclusion observed:** **SUCCESS**  
**Audited current branch HEAD while recording this result:** `34c10ba08ff9400116cf3fe6c8d352efe5eac4a2`

### 45.96.1 What the successful step establishes

The exact trace source at the lab SHA is `audit/cardano-integration/beacon-registry-adversarial-ledger-trace.ts` (blob `4478b99e964c6d31ef80614044f6609eab38ecac`). Its success exit requires all of these assertions to hold on the ephemeral local Yaci ledger:

- three distinct seven-field Pending-shaped Registry UTxOs were created by an ordinary wallet transaction at the Registry script address;
- a Ready-shaped Registry output was created by an ordinary wallet payment, without a Registry spending input, attached Registry validator or Registry validator execution;
- that direct Ready UTxO's exact datum fields and lovelace Value were recovered from Yaci;
- RegistryPublish consumed the nominated Pending and successfully submitted a balanced transaction whose Registry continuation fell from 6,000,000 to 5,000,000 lovelace while 1,000,000 lovelace was returned to the wallet;
- RegistryPublish accepted a datum where `brRound=41` and `btRound(target)=42`;
- the competing same-round Pending remained unspent.

The successful GitHub Actions step means the script's explicit assertions did not throw. It is local synthetic Yaci evidence only; it is not Preprod deployment or production Registry identity evidence.

### 45.96.2 What remains unproven

This trace does **not** spend a Prize UTxO through Haskell V2 SyncBeacon and does not prove T04. The separate Aiken V3 SyncBeacon trace is also not a substitute for canonical Haskell V2.

The Cardano Integration Lab run remained `in_progress` after the B0 step, at the subsequent Counter lookalike / Aiken preflight area. The Counter lookalike step itself reported **FAILURE** in its job summary; that failure is a separate characterization and is not a B0 step failure. The overall lab run has no final conclusion claimed here.

### 45.96.3 Remaining CI / size states at observation time

- Haskell Semantic Conformance run `43678893331`, SHA `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`: still in progress at `Compiled MintPolicy B1 Value-preservation conformance`; BeaconRegistry adversarial suite step was still pending. No exact Beacon CEK PASS is claimed yet.
- Conservative size experiment run `43679611905`, SHA `637e7709aa07b802e3accc7acba4a2915f76d523`: running, having completed Node/runtime setup and still executing the canonical Plutus toolchain setup. No candidate byte count is available yet.
- The current shared branch is `34c10ba08ff9400116cf3fe6c8d352efe5eac4a2`; subsequent changes since those test SHAs are workflow/documentation only, not modifications to the B0 Yaci source or the adversarial Haskell test source.

**Disposition:** **T01b and RegistryPublish characterization: LOCAL YACI STEP SUCCESS.** Haskell V2 T04 remains **RESOURCE BLOCKED / NOT RUN** until size feasibility is demonstrated; Registry authenticity remains **BLOCKED**; no GREEN promotion.

**Non-effects:** no Registry/Prize validator, datum/redeemer ABI, production deployment, Preprod/Mainnet network, wallet secret, economic policy, V3/Reveal semantics, B2, Treasury or Materios code changed. No production signing or ticket issuance took place.


## 45.97 AGENT B — T01b YACI / HASKELL CEK / AIKEN V3 SYNCBEACON RISULTATI (2026-11-15)

**Branch HEAD verificato prima della registrazione:** `467bab6b2cf5f9928362a50205b94b091b046701`  
**Lab run:** `43678893383` — run #2763 — source SHA `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`  
**Job:** `132705524504` (`devnet-integration`)  
**Classificazione:** EVIDENZA LOCALE YACI + HASKELL CEK + DIAGNOSTICA HARNESS; NESSUNA MODIFICA DI PROTOCOLLO.

### 45.97.1 T01b Registry: risultato Yaci completato e verificato

Il passo `beacon_registry_b0_yaci` (step 29 nel job) ha concluso **SUCCESS**. Il suo output registrato nei log riporta:

- `beaconRegistryB0Yaci = CHARACTERIZATION_COMPLETED`;
- bootstrap transaction: `b422b4ce0c3a853509726da1626f8cef270109c1b8ded80a9cddd10c9b41112b`;
- Value-delta RegistryPublish: `6635439c6b18b553faab3d17a013ee11bececad0674d80029101ac02b4bc60a6`;
- round-mismatch RegistryPublish: `96589f1ec06cce7723ffcc5fa5e41ee063049ababd7eb67de92aace4c6c888a7`;
- Registry Value: **6,000,000 → 5,000,000 lovelace**; wallet return osservato;
- il Pending concorrente è rimasto non speso.

Il passo è riuscito dopo aver verificato la creazione ordinaria dei Pending e di un output Registry Ready-shaped senza esecuzione del validator Registry. È quindi prova ledger locale del fatto che la sola destinazione all'indirizzo con quel payment ScriptHash non autentica provenienza o stato. Il RegistryPublish bilanciato ha inoltre accettato la riduzione di Value e la discrepanza `brRound=41` / `btRound(target)=42`. Questi sono risultati **CHARACTERIZATION**, non comportamento approvato.

### 45.97.2 Haskell V2 adversarial CEK suite: PASS esecutivo, non security approval

Nello stesso job la suite `beacon-registry-adversarial-tests` ha concluso **PASS** (1/1 test suite). Le asserzioni osservate comprendono:

- RegistryPublish: PASS su signer designato; rifiuto di firma mancante, Beacon non derivato, input Registry aggiuntivo, output duplicati, commitment vuoto e contesto Materios vuoto;
- CHARACTERIZATION: RegistryPublish accetta `brRound /= btRound(target)`;
- CHARACTERIZATION: RegistryPublish accetta una variazione di Value nell'output continuativo nel contesto CEK sintetico (contesto non bilanciato);
- SyncBeacon: rifiuta Registry Pending, round mismatch e target/version mismatch;
- CHARACTERIZATION: SyncBeacon accetta un Ready fittizio non derivato, senza esecuzione del Registry o firma del relayer;
- CHARACTERIZATION: SyncBeacon accetta `mcHash/context` scelti dall'attaccante quando il Beacon è correttamente derivato, senza pubblicazione Registry;
- CHARACTERIZATION: SyncBeacon accetta Ready con commitment/context vuoti, un Registry lookalike con stesso payment ScriptHash ma staking credential diversa e più Registry reference selezionando la prima.

Il risultato Cabal **PASS** significa che le asserzioni del test sono state eseguite. Ogni caso marcato CHARACTERIZATION documenta una debolezza riproducibile; non deve essere interpretato come security pass.

### 45.97.3 Aiken Plutus V3 SyncBeacon su Yaci: harness completato, bypass osservato

Lo step `Execute Aiken V3 SyncBeacon adversarial local-Yaci characterization` (step 41) ha concluso **SUCCESS** come harness. Gli outcome registrati nei log sono:

- `AIKEN_SYNC_BEACON_HARNESS_OUTCOME=success`;
- `AIKEN_SYNC_BEACON_FAKE_READY_ACCEPTED=true`;
- `AIKEN_SYNC_BEACON_REFERENCE_AMBIGUITY_ACCEPTED=true`;
- `AIKEN_SYNC_BEACON_INVALID_REGISTRY_ACCEPTED=false`;
- `AIKEN_SYNC_BEACON_DUPLICATE_STRUCTURE_ACCEPTED=false`;
- `AIKEN_SYNC_BEACON_IMMUTABLE_MUTATION_ACCEPTED=false`;
- `AIKEN_SYNC_BEACON_VALUE_MUTATION_ACCEPTED=false`.

La semantica delle variabili è importante: `*_ACCEPTED=true` è la conferma che il candidato ha accettato il twin avversariale. Pertanto fake Ready e reference ambiguity sono **finding**, non controlli superati. La prova riguarda l'implementazione Aiken Plutus V3 isolata su Yaci e non sostituisce il test Haskell V2 né qualifica un deployment.

### 45.97.4 Root cause condivisa osservata nei due consumer SyncBeacon

Nel consumer Haskell V2, `PrizeValidator.hs`:

- `isRegistryRef` filtra il riferimento solo tramite `addressCredential == ScriptCredential regHash`;
- `readRegistry` prende il primo riferimento corrispondente;
- `validateSyncBeacon` controlla Ready, round, target e non-vuotezza del Beacon, quindi copia `brBeaconValue`, `brMcHash` e `brMateriosContext`;
- non verifica un state token univoco, la lineage di creazione/pubblicazione, la spesa Registry nell'azione SyncBeacon o la re-derivazione del Beacon dai campi forniti.

Il consumer Aiken in `poc/aiken-reveal-parity/lib/immortal/sync_beacon_transaction.ak` presenta la stessa struttura sostanziale: il Registry reference è selezionato dal solo payment ScriptHash, il primo match viene usato e `sync_output_matches` richiede un Beacon non vuoto ma non lo ricalcola né autentica la lineage dell'UTxO.

Conseguenza: un indirizzo script è una condizione di destinazione, non una prova che l'UTxO sia stato creato o aggiornato dal validator. Un ordinario pagamento può creare un output con lo stesso payment ScriptHash e un datum Ready-shaped. La derivazione corretta di `brBeaconValue` dimostra coerenza dei campi, non autenticità della fonte esterna o autorizzazione del publisher.

**Security disposition:** Registry provenance/authenticity resta **BLOCKED** in entrambi i consumer. Il problema non si risolve con una sola selezione del primo reference input o un controllo del datum. Serve una futura identità di stato non falsificabile e univoca, con lineage/authority verificabile on-chain; il modello di apertura dovrà continuare a rispettare il vincolo già stabilito di esecuzione permissionless e non introdurre per default un signer privilegiato o un keeper di fiducia. Nessuna implementazione, token policy, Factory ABI o parametro viene introdotto da questa annotazione.

### 45.97.5 Perché l'intero Cardano Lab risulta FAILURE: difetto del test Counter, non del Registry

Il job `132705524504` è terminato **FAILURE** unicamente perché lo step successivo, `Execute Counter lookalike identity spend characterization on local Yaci`, ha lanciato:

`TypeError: Cannot read properties of undefined (reading 'from_scripthash')`

Lo stack punta a `audit/cardano-integration/counter-lookalike-ledger-trace.ts:122`, all'espressione `CML.StakeCredential.from_scripthash(...)`. Il package di audit dichiara `@lucid-evolution/lucid@0.6.5`; il membro atteso non è presente sull'oggetto CML esposto nel runtime. L'errore avviene prima della costruzione e dell'invio delle transazioni Counter: non esiste quindi un esito ledger, né PASS né FAIL semantico, per quel test. La caratterizzazione Counter CEK accoppiata aveva concluso PASS, ma non sostituisce la prova Yaci.

Questa eccezione è indipendente dal passo B0 già riuscito e dal passo Aiken SyncBeacon già completato. Non deve oscurare o invalidare retroattivamente i relativi risultati; al contempo non può essere ignorata per dichiarare verde l'intero Lab.

### 45.97.6 Workflow distinti ancora aperti e limiti

- Haskell Semantic Conformance run `43678893331` sul source SHA `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`: ancora **in_progress** al passo Compiled MintPolicy B1 Value-preservation; non si dichiara completato il workflow complessivo. La suite BeaconRegistry è comunque stata eseguita e ha PASS nella run Lab descritta sopra.
- Conservative size experiment `43679611905`, source SHA `637e7709aa07b802e3accc7acba4a2915f76d523`: ancora **in_progress** alla compilazione/misura baseline-candidate. Non è disponibile un byte count candidato. Il limite canonico di T04 resta **16,443 byte** contro **16,384 byte**; non si presume alcun miglioramento.
- Haskell V2 T04 nativo su Yaci resta **RESOURCE BLOCKED / NOT RUN** fino a una prova positiva di size feasibility e successiva pubblicazione/reference verificata dell'esatto artefatto V2.

**Disposition finale:** T01b Registry Yaci = **SUCCESS locale**; Haskell V2 adversarial CEK suite = **PASS esecutivo con finding CHARACTERIZATION**; Aiken V3 SyncBeacon Yaci = **harness SUCCESS con fake Ready/reference ambiguity accettati**; Counter Yaci = **HARNESS FAILURE pre-submit**; Registry authenticity = **BLOCKED**; Haskell V2 T04 = **RESOURCE BLOCKED**. Nessuna GREEN promotion.

**Non-effects:** nessun sorgente validator, script Aiken, datum/redeemer ABI, Factory, Registry policy, relayer, workflow o parametro di protocollo modificato. Nessuna modifica a V3/Reveal semantics, B2, economia, Treasury o Materios. Nessun maxTxSize alterato, nessuna transazione Preprod/Mainnet, nessuna firma di produzione e nessuna emissione ticket.


## 45.98 AGENT B — ISSUE MINTPOLICY ACCETTA PENDING REGISTRY BUYER-CONTROLLED (2026-11-15)

**Source:** `plutus/MintPolicy.hs` (blob `0d59fc05b4c11873984fffd10014bd46d8470509`)  
**Test:** `plutus/test/BeaconRegistryAdversarialTest.hs`  
**Run:** Cardano Integration Lab `43678893383`, source SHA `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`; suite `beacon-registry-adversarial-tests` = **PASS**.  
**Classification:** ISSUE PATH CEK SECURITY CHARACTERIZATION; NO NATIVE-LEDGER ISSUE CLAIM.

### 45.98.1 Finding

The executed test calls the production compiled MintPolicy wrapper through `applyPositivePriceMint` using `pendingRegistry { brRelayerPkh = buyerPkh }` as a reference input. The complete synthetic sale context includes the expected ticket/prize, pool, counter, Treasury, buyer and oracle structures. `assertEvaluatesSuccessfully` returns, and the suite prints:

`CHARACTERIZATION: positive-price MintPolicy CEK accepts a buyer-controlled Pending Registry reference without Registry spending or relayer authorization; synthetic Oracle quote only`

This establishes that the MintPolicy's current on-chain predicate accepts a buyer-controlled Pending Registry datum at CEK level. The relayer PKH in the datum is set to the buyer; no Registry spending validator is executed and no relayer signature is needed by this MintPolicy check.

### 45.98.2 Source reason

In `MintPolicy.hs`, `readRegistry` walks `txInfoReferenceInputs`, accepts the first output whose payment credential is `ScriptCredential h` with `h == regHash`, and decodes its datum. It does not authenticate full address, a unique Registry state token, initialization lineage or a prior RegistryPublish transition.

`newPrizeDatumValid` then accepts the Registry branch when:
- `sameTarget (brTarget reg) target`;
- `brRound reg == btRound target`;
- `brStatus reg == BeaconPending`.

These checks establish only the contents of an attacker-supplied datum. They do not establish that an authentic Registry instance for that round exists. The same script-address ordinary-payment property demonstrated by T01b applies to this reference input.

### 45.98.3 Scope and consequence

This is an earlier lifecycle boundary than the SyncBeacon finding: the counterfeit Registry can pass the MintPolicy's Registry predicate during Issue, before the ticket later attempts to synchronize a Ready Beacon. It therefore broadens the authenticated-Registry blocker from the SyncBeacon consumer to the positive-price Issue admission predicate.

**Evidence limit:** this test is a compiled Haskell CEK characterization with a synthetic `ScriptContext` and synthetic Oracle quote. It does **not** prove a complete Issue transaction was built, submitted or accepted by Yaci, nor that a production ticket was minted. The next native-ledger twin, if pursued within the approved test perimeter, must use the exact canonical MintPolicy/Prize/Pool artifacts and label any successful local fixture as synthetic local-Yaci evidence only.

**Disposition:** Issue MintPolicy Registry authenticity = **BLOCKED / CEK counterfeit-Pending acceptance observed**. Round and target checks are present, but they are not provenance. Do not treat the Haskell test suite PASS as approval of this path.

**Non-effects:** no MintPolicy source, validator parameters, datum/redeemer ABI, Factory, Registry token policy, sale semantics, economics, Treasury, V3/Reveal, B2, Materios, wallet or network state changed. No ticket was issued and no Preprod/Mainnet transaction was submitted.


## 45.99 AGENT B — B1 BEACON CLOSURE MATRIX RECLASSIFIED AFTER ADVERSARIAL EVIDENCE (2026-11-15)

**Pre-write HEAD:** `9ad44af968f3d6aaecf77239c0cdda2c17fe3c38`  
**Documentation change:** `docs/03-audit/BEACON-CLOSURE-MATRIX.md` only, in commit `9ad44af968f3d6aaecf77239c0cdda2c17fe3c38`.  
**New matrix blob:** `64b1252d0a156f62964b749441e3ac32dc0e4ce9`.  
**Classification:** EVIDENCE-BASED STATUS CORRECTION; NO IMPLEMENTATION AUTHORITY.

The previous matrix row described B1 as **GREEN / operational model** and stated that the real deployment witness was only a remaining deployment-evidence item. That did not reflect the newly executed adversarial evidence: the current Registry's Pending identity, Ready provenance and nominated publisher binding are not authenticated by the on-chain consumers.

The B1 row is now **BLOCKED / P0 Registry identity**. The added date-stamped section separates:
- the deterministic Beacon derivation (which may be internally correct);
- the B1 trust-profile concept (authorized publisher);
- the current Registry implementation (which has confirmed unauthenticated initialization/reference gaps);
- the distinct B2 and B3 status rows, which were not changed.

The matrix cites the exact local Lab run `43678893383`, source SHA `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`, and distinguishes T01b Yaci SUCCESS from the Haskell CEK CHARACTERIZATION findings, Aiken V3 Yaci harness outcomes, Counter pre-submit harness error, and Haskell V2 T04 resource block.

**Disposition:** do not report the current B1 Registry implementation as release-green. The B1 authorized-publisher mode remains a named trust profile, but an authenticated Registry instance has not been established. Registry identity and Issue/SyncBeacon read authenticity stay blocking. Trustless Factory also remains unavailable until G1 governance/configuration and G2 canonical target derivation are resolved.

**Non-effects:** no validator, MintPolicy, Datum/ABI, Factory, relayer, V3, Reveal, B2, economic rule, Treasury or Materios source changed. No code or workflow changed; no transaction, key, wallet, Preprod/Mainnet query, signing, deployment or ticket issuance occurred.


## 46.00 AGENT B — HASKELL SEMANTIC CONFORMANCE BEACONREGISTRY STEP COMPLETED (2026-11-15)

**Workflow:** `Haskell Semantic Conformance`, run `43678893331`  
**Source SHA:** `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`  
**Job:** `132704991081` (`haskell-conformance`)  
**Step 8:** `BeaconRegistry adversarial characterization (CEK only)`  
**Conclusion at poll:** **SUCCESS**  
**Overall workflow at poll:** **IN_PROGRESS**, next step `Beacon commitment cross-language conformance`.

This is a second independent workflow execution of the registered Cabal adversarial suite, in addition to the already observed PASS inside Cardano Lab run `43678893383`. It confirms that the Haskell conformance workflow now actually invokes the BeaconRegistry CEK suite. It remains a CEK-only characterization; all positive `CHARACTERIZATION` outcomes described in §45.97/§45.98 remain security findings, not successful security properties.

The overall workflow is not complete, and no final workflow conclusion is claimed.

**T04 size experiment:** run `43679611905`, job `132707159426`, remains **IN_PROGRESS** at step 8 `Compile, measure baseline, then compare the isolated candidate`. Restore and artifact-upload steps are still pending; no candidate byte count or final clean-worktree evidence is yet available.

**Non-effects:** no source, ABI, validator, mint policy, transaction, wallet, deployment, Preprod/Mainnet or protocol parameter changed in this observation.


## 46.01 AGENT B — HASKELL SEMANTIC CONFORMANCE COMPLETATO / COUNTER YACI HARNESS API FIX DIAGNOSI (2026-11-15)

**Shared branch HEAD prima della nota:** `8b301e95795e98d7066103debb81ce0693080202`  
**Haskell workflow:** [run 43678893331](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43678893331)  
**Source SHA testato:** `53edd61177968ad4f2e1d0dc761c9c5d152bab1e`  
**Job:** `132704991081` — `haskell-conformance`  
**Job/workflow conclusion osservata:** **SUCCESS**  
**Classificazione:** CI HASKELL CONFORMANCE SUCCESS + COUNTER TEST-HARNESS ROOT-CAUSE; NO PROTOCOL IMPLEMENTATION.

### 46.01.1 Haskell workflow: risultato finale

Il workflow Haskell Semantic Conformance, precedentemente registrato come in-progress in §46.00, è terminato **SUCCESS**. Il job unico `haskell-conformance` ha concluso senza alcuno step failure.

Il job log conferma in modo esplicito:
- `cabal test beacon-registry-adversarial-tests --test-show-details=direct`;
- tutte le caratterizzazioni Pending/Ready, publisher, round, Value, lookalike e reference ambiguity eseguite;
- `Test suite beacon-registry-adversarial-tests: PASS`;
- `1 of 1 test suites (1 of 1 test cases) passed`.

La stessa suite ha stampato le finding come `CHARACTERIZATION`. Il workflow verde è quindi una conformance positiva del **test runner** e delle sue asserzioni, non una qualificazione di sicurezza del comportamento caratterizzato. Le righe che mostrano che Issue/SyncBeacon accettano input Registry contraffatti restano finding aperti.

Anche le conformance successive del workflow, incluse Beacon commitment cross-language e i passaggi successivi fino a Genesis regime carrier, sono state completate nel job senza failure. La suite è ora integrata e non rimane più solo una prova eseguita incidentalmente nel Cardano Lab.

### 46.01.2 Counter lookalike Yaci: causa confermata nella superficie API Lucid

Il fallimento separato del test Counter è:
`TypeError: Cannot read properties of undefined (reading 'from_scripthash')`
in `audit/cardano-integration/counter-lookalike-ledger-trace.ts:122`.

La dipendenza effettiva del trace è `@lucid-evolution/lucid@0.6.5` (`audit/cardano-integration/package.json`). La release upstream esatta è identificata dal tag `@lucid-evolution/lucid@0.6.5`; i sorgenti a quel tag mostrano:

- `packages/lucid/src/core.ts` esporta il namespace CML da `@anastasia-labs/cardano-multiplatform-lib-nodejs`;
- `packages/lucid/src/index.ts` esporta `core.ts`, quindi il namespace CML usato dal trace è quello effettivo della release;
- `packages/utils/src/credential.ts` nella stessa release costruisce indirizzi base con `CML.BaseAddress.new(..., CML.Credential.new_script(...), CML.Credential.new_pub_key(...))`.

Il trace Counter usa invece la vecchia API:
`CML.StakeCredential.from_scripthash(...)` e `CML.StakeCredential.from_keyhash(...)`.
Queste chiamate sono incompatibili con l'API documentata/consumata dalla release 0.6.5. Il trace si arresta prima del bootstrap e prima di qualunque submit: nessun outcome ledger Counter è stato prodotto.

**Proposta tecnica circoscritta per una futura slot di test-harness:** costruire i due credentials tramite `CML.Credential.new_script(CML.ScriptHash.from_hex(counterHash))` e `CML.Credential.new_pub_key(CML.Ed25519KeyHash.from_hex(walletPaymentHash))`, mantenendo invariati network id, payment hash, stake hash, indirizzo canonico e twin lookalike. Serializzare il risultato attraverso `CML.BaseAddress.new(...).to_address().to_bech32(undefined)`, come fa la funzione upstream `credentialToAddress`. La patch deve poi essere provata in isolamento fino alla costruzione e submit Yaci; non presumere che il trace passi solo perché l'errore API è rimosso.

### 46.01.3 Perimetro e autorizzazioni

La diagnosi è deterministica, ma il file `audit/cardano-integration/counter-lookalike-ledger-trace.ts` non rientra nel manifest di scrittura precedentemente stabilito per T07, e la slot T07 era stata restituita. Issue #43 non autorizza una modifica di protocollo o di ABI. Pertanto **non è stata applicata alcuna patch al Counter harness** in questo passaggio: la correzione è proposta per un successivo slot esplicito di test-only, con manifest limitato a trace/test e nessun cambio a CounterValidator, MintPolicy, PrizeValidator, ABI o produzione.

### 46.01.4 Stato workflow size T04 al checkpoint

Il run `43679611905` resta `IN_PROGRESS` (conclusion `null`), sul source SHA `637e7709aa07b802e3accc7acba4a2915f76d523`. Al poll, il job `132707159426` era ancora allo step 8 `Compile, measure baseline, then compare the isolated candidate`; restore e upload sono pending. Nessun candidate byte count né clean-worktree restoration claim è disponibile. T04 Haskell V2 rimane **RESOURCE BLOCKED / NOT RUN** fino alla misura e alle successive verifiche indipendenti.

**Disposition:** Haskell Semantic Conformance = **SUCCESS**; BeaconRegistry adversarial CEK harness = **SUCCESS con finding CHARACTERIZATION**; Counter Yaci test = **HARNESS FAILURE pre-submit, API incompatibility identified, repair not applied**; T04 size experiment = **IN PROGRESS**; Registry authenticity = **BLOCKED**.

**Non-effects:** nessun file di protocollo o di harness modificato in questa nota; nessun ABI, script, validator, MintPolicy, Factory, V3/Reveal, economic rule, B2, Treasury o Materios change. Nessuna transazione, firma, wallet, Preprod/Mainnet query, deployment o ticket issuance.


## 46.01 AGENT A — FIRST PREPROD ISSUE GATE RECONCILIATION (2026-11-15)

**Audit HEAD before note:** `8b301e95795e98d7066103debb81ce0693080202`  
**Report:** `docs/COORDINATION/AGENT-A-FIRST-PREPROD-ISSUE-GATE-RECONCILIATION-2026-11-15.md`  
**Classification:** READ-ONLY SOURCE / EVIDENCE RECONCILIATION; NO IMPLEMENTATION AUTHORITY.

**Disposition:** **NO-GO — first real Preprod Issue remains blocked.** Agent B's 2026-11-15 adversarial evidence reclassifies B1 Registry identity as **BLOCKED / P0**: the current Issue MintPolicy accepts a buyer-controlled Pending Registry reference based on payment ScriptHash and datum contents, without authenticating Registry identity/lineage. Independently, R1/Kc/authoritative Ω certification remains missing; the actual S0 Issue action erodes the direct-EEV margin by 500 RU.

The read-only readiness script does not verify either of those two gates. `READY_FOR_WALLET_REVIEW` is not a transaction authorization or a security go/no-go. The detailed source chain, evidence limits, ownership and closure order are recorded in the linked Agent A report.

**Ownership:** Agent B — B1 Registry identity and consumer enforcement; Agent A — deployment-bound R1/Kc/Ω certificate. Revalidate live Direct-USDM EEV, Oracle and B2 evidence only after the upstream blockers have defined closure contracts.

**Non-effects:** no production source, test, validator, policy, ABI, V3, Reveal, 500× rule, wallet, transaction, deployment or ledger state changed or executed.


## 46.02 AGENT B — COORDINAMENTO FIRST-ISSUE NO-GO / CONTRO HARNES REPAIR CANDIDATE (2026-11-15)

**Reviewed shared HEAD:** `5480aa02f79330345b56ee90cf0131afa831a6a7`  
**Agent A report:** `docs/COORDINATION/AGENT-A-FIRST-PREPROD-ISSUE-GATE-RECONCILIATION-2026-11-15.md` (blob `a650dddfc1ec27a60111f9cc3fbdd31a6dc615c2`)  
**Classification:** CROSS-AGENT GATE RECONCILIATION + TEST-HARNESS REPAIR SPEC; NO IMPLEMENTATION.

### 46.02.1 Shared first-Issue disposition and ownership

Agent B read Agent A's exact-head report and confirms the shared first-Preprod-Issue disposition is **NO-GO** on two independent gates:

- **Agent B — B1 Registry identity (P0):** counterfeit Pending can pass the current positive-price Issue MintPolicy predicate; Registry initialization and publisher lineage are not authenticated. Same identity problem affects SyncBeacon readers.
- **Agent A — R1/Kc/authoritative Ω:** deployment-bound viability certificate and complete Ω proof are missing; current S0 Issue action changes direct-EEV margin by `-500 RU`.

Neither gate substitutes for the other. The read-only `READY_FOR_WALLET_REVIEW` output does not certify either. No action to build, sign or submit a first Issue is authorized by a general readiness label or this evidence note.

Agent B's implementation boundary remains the authenticated per-round Registry identity, exact/unique consumer references and immutable publisher binding. Agent A owns the separate economic certificate; do not mix economic coefficient/action decisions into the Registry workstream.

### 46.02.2 Counter Yaci repair: preferred exact-version API

The earlier §46.01 diagnosis was made more precise against the **exact** upstream tag `@lucid-evolution/lucid@0.6.5`, which is the installed version in `audit/cardano-integration/package.json`.

A direct low-level CML fix would replace obsolete `CML.StakeCredential` constructors with `CML.Credential.new_script/new_pub_key`. An even narrower, preferred repair is to use the public helper already exported by that exact package:

- `packages/utils/src/credential.ts` defines `credentialToAddress(network, paymentCredential, stakeCredential)`;
- `packages/utils/src/index.ts` re-exports `credential.ts`;
- `packages/lucid/src/index.ts` re-exports `@lucid-evolution/utils`;
- the helper builds the Cardano base address with the current `CML.Credential` class and returns its Bech32 address.

The future test-only patch can therefore replace the legacy manual construction with:

```ts
import { credentialToAddress } from "@lucid-evolution/lucid"

const lookalikeAddress = credentialToAddress(
  "Preprod",
  { type: "Script", hash: counterHash },
  { type: "Key", hash: walletPaymentHash },
)
```

Retain all existing checks that the payment credential still equals the Counter script hash and the stake credential is the wallet key hash. Then run the complete local-Yaci trace and require observed native-ledger spends, not just successful address construction.

**No patch is applied.** The Counter trace is outside the previously returned T07 changed-path manifest. The API diagnosis and code sketch do not themselves grant a changed-path slot. A separate, explicit, test-only slot must enumerate `audit/cardano-integration/counter-lookalike-ledger-trace.ts` (and any narrowly required test evidence paths), with CounterValidator, production scripts, ABI, policies, V3/Reveal and all economic sources explicitly excluded.

### 46.02.3 Shared-branch movement after Agent B checkpoint

The compare from Agent B HEAD `8b301e95795e98d7066103debb81ce0693080202` to `5480aa02f79330345b56ee90cf0131afa831a6a7` is three commits ahead / zero behind. The only changed paths are:
- new Agent A read-only first-Issue reconciliation report;
- coordination document.

No validator, policy, ABI, workflow, test harness or production source changed in this branch movement.

**Disposition:** cross-agent first-Issue NO-GO confirmed; Counter API mismatch has a minimal public-utility repair design but remains unapplied; the exclusive test-only write slot is not assumed. The conservative Haskell V2 size run `43679611905` remains IN_PROGRESS with no candidate size, so Haskell V2 T04 remains RESOURCE BLOCKED / NOT RUN.

**Non-effects:** no source, validator, ABI, economic rule, test harness, wallet, signing, transaction, deployment, Preprod/Mainnet or ledger state changed.


## 46.03 AGENT B — COUNTER LOOKALIKE TEST-HARNESS API REPAIR COMMITTED / YACI RERUN ACTIVE (2026-11-15)

**Explicit user slot:** test-harness-only Counter address-construction repair.  
**Base HEAD:** `5394c2de36ebaa25ff859ab0958ed854c4cf3060`  
**Commit:** `7396e042eb65db8ab81f49445052ca349addc503`  
**Changed path:** only `audit/cardano-integration/counter-lookalike-ledger-trace.ts`  
**Blob:** `f550585bdea619cff363dd7b4fe3d26b02fef333`  
**Diff:** 9 insertions / 8 deletions.

### 46.03.1 Applied repair

The previous trace called legacy `CML.StakeCredential.from_scripthash/from_keyhash`, which is not present in pinned `@lucid-evolution/lucid@0.6.5`. The exact-version public helper `credentialToAddress` is re-exported from the Lucid package and constructs a base address through the current `CML.Credential` API.

The trace now imports and invokes:

```ts
const lookalikeAddress = credentialToAddress(
  'Preprod',
  { type: 'Script', hash: counterHash },
  { type: 'Key', hash: walletPaymentHash },
)
```

The existing address identity guards remain. The stake credential assertion was strengthened to require not only type `Key`, but exact equality with the ephemeral wallet payment hash. Payment credential must still equal the CounterValidator script hash, and the lookalike full address must remain distinct from the canonical Enterprise address.

No validator, script artifact, datum/redeemer, policy, ABI, relayer, economic rule or production source changed.

### 46.03.2 Exact Lab execution

Push-triggered run: [IMMORTAL Cardano Integration Lab 43681459956](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43681459956)  
Tested SHA: `7396e042eb65db8ab81f49445052ca349addc503`  
Job: `132712783738` (`devnet-integration`).

At the last verified poll, the workflow had completed checkout, Node setup, project dependencies, isolated lab dependencies and build-cache restoration. It remained **IN_PROGRESS** in `Setup canonical Plutus CI`, with no failure reported. The Counter trace had not yet executed. Therefore address-construction repair is committed and exact SHA queued/running, but **not yet runtime-validated or native-ledger-validated**. The complete trace must still bootstrap the three outputs, submit both lookalike spends, observe continuations and prove the canonical Counter-address UTxO remains unspent.

### 46.03.3 Ancillary push-triggered Preprod Context job

The same push also triggered [Preprod Context run 43681459946](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43681459946), whose only active job is explicitly marked read-only by the workflow. Its context observation and UTxO evidence checks completed successfully; deployment, direct-USDM bootstrap, V3 observation and real Reveal jobs were skipped. No transaction or wallet signature was performed by this run. This is independent observational evidence, not first-Issue authorization.

Other commit checks observed SUCCESS: Documentation Link Check `43681459992`, Portability Conformance `43681459969`, Cardano Adapter Sale Conformance `43681459961`.

**Disposition:** API mismatch repair applied to the single authorized test path; Cardano Lab native-Yaci outcome is pending. No claim is made yet that the Counter validator accepted either spend. Issue #43 remains OPEN, B1 Registry authenticity and first Issue remain blocked/NO-GO, and the V2 T04 size experiment is unrelated and remains separately unresolved.

**Non-effects:** no production or protocol source, ABI, validator, policy, Factory, V3/Reveal semantics, economics, Treasury or Materios changed. No Preprod signing, transaction, deployment or ticket issuance occurred.

## 46.04 AGENT B — COUNTER LOOKALIKE TWO-SPEND TRACE ACCEPTED BY LOCAL YACI (2026-11-15)

**Run:** [IMMORTAL Cardano Integration Lab 43681459956](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/43681459956)  
**Exact tested source SHA:** `7396e042eb65db8ab81f49445052ca349addc503`  
**Job:** `132712783738` (`devnet-integration`)  
**Step 30:** `Execute Counter lookalike identity spend characterization on local Yaci` — **COMPLETED / SUCCESS**  
**Prior repair commit:** `7396e042eb65db8ab81f49445052ca349addc503` (only the Counter trace file changed).

### 46.04.1 What the successful trace establishes

The trace source is fail-closed and reaches `CHARACTERIZATION_COMPLETED` only after all of the following operations and assertions return successfully:

1. Creates three synthetic Counter-shaped outputs through an ordinary payment to local Yaci: one at the canonical Counter Enterprise address and two at the lookalike Base address with the same Counter payment ScriptHash and a distinct wallet Key stake credential.
2. Queries both addresses and confirms the exact output counts and initial inline datum `0`.
3. Independently spends lookalike input #1 and input #2 with the compiled Plutus V2 CounterValidator through Yaci. Each trace evaluates exactly one spending redeemer, signs with the **ephemeral local-devnet CI wallet**, submits the transaction and waits for confirmation.
4. After each spend, observes exactly one continuing lookalike output from that transaction and verifies inline datum `1`.
5. Re-queries the canonical Counter Enterprise address and verifies its original UTxO reference is unchanged and its datum remains `0`.

Because step 30 concluded SUCCESS on the exact tested SHA, the legacy CML constructor error is resolved and the entire script reached its terminal success condition. This is native local-Yaci evidence that the Counter validator permits both independently-created same-payment-ScriptHash / alternate-stake-address spends while the canonical-address UTxO remains unspent.

### 46.04.2 Evidence boundary

The trace does **not** execute MintPolicy during a native-ledger Issue, does not mint a Ticket NFT, and does not prove duplicate ticket supply. The paired MintPolicy lookalike result remains CEK-only. This synthetic local-devnet result is not Preprod/Mainnet qualification and does not alter the existing P0 Issue/Registry findings.

The script writes `audit/yaci-evidence/counter-lookalike-identity-characterization.json` including both transaction hashes and output references. The overall Lab job was still active when this note was written, so the uploaded artifact and exact transaction IDs were not yet independently fetched. This note records the verified step conclusion and the source-level assertions it executes; it does not invent or transcribe unavailable tx hashes.

### 46.04.3 Overall Lab at poll

The overall Cardano Lab remained **IN_PROGRESS** after step 30, proceeding through subsequent Aiken V3/Haskell traces. No failed step was present at that poll. Step 30 itself is independently completed SUCCESS and does not depend on the overall job's later outcome.

**Disposition:** Counter lookalike harness/API repair = **VALIDATED**; two independent lookalike spends = **ACCEPTED BY LOCAL YACI**; exact canonical Counter UTxO = **OBSERVED UNCHANGED**. B0 Registry = SUCCESS in the same run. The test-only objective is complete.

**Non-effects:** only the test-harness address construction was changed in commit `7396e042`; no CounterValidator, MintPolicy, PrizeValidator, datum/redeemer, policy, ABI, production script or economic rule changed. The two transactions use the ephemeral local Yaci CI wallet only. No production wallet, Preprod signature, Preprod/Mainnet transaction, deployment or ticket issuance occurred.