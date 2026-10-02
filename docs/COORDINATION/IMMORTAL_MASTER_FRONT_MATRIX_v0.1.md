# IMMORTAL — Master Front & Subfront Closure Matrix v0.1

**Branch:** `work/immortal-green-closure`  
**Date:** 2026-09-26  
**Role:** execution coordination; non-normative

## Operating rule

A front is closed only when **design, implementation, execution and evidence** agree. A green unit test is not external proof; a simulation is not a Preprod witness; a UI surface is not protocol authority.

---

## F0 — SOURCE / ARCHITECTURE CONTROL
**Goal:** preserve the authority hierarchy and prevent semantic drift.

### F0.1 Canonical-source map
- Constitution / normative specs
- Decision register
- current technical specs
- implementation
- tests/proofs
- evidence packets
- coordination docs

### F0.2 Boundary audit
- IMMORTAL universal semantics
- Adapter representation/execution
- PRE-RICH application policy
- legacy material

### F0.3 Regression firewall
- no hardcoded PRE-RICH constants in universal kernel
- no legacy 75/10/10/5
- no trusted fallback disguised as verified path
- no maxTxSize relaxation
- no silent defaults for missing authoritative state

**Status:** ACTIVE / continuous.

---

## F1 — UNIVERSAL ECONOMIC KERNEL
**Goal:** prove the universal economic chain independently of PRE-RICH.

### F1.1 State boundary
Classify every V3 state field as universal, profile/application, adapter representation, evidence or legacy.

### F1.2 ProtectedCapital
Prove preservation of:
- SafetyCapital
- ReserveProtection
- MandatoryFutureCosts

through relevant transitions.

### F1.3 RawSurplus
Verify:
`RawSurplus = max(0, EEV - ProtectedCapital)`
and prevent surplus from being used before obligations/protected capital.

### F1.4 Economic Gate
Bind:
`Canonical State → Delta → Candidate State → ProtectedCapital → Gate → Viability → Safe Action → Atomic Transition`

### F1.5 Viability
Separate local invariant preservation from continuation/strategy existence.

### F1.6 Atomicity
Demonstrate that accepted economic transitions cannot be partially realized.

**Status:** OPEN / major closure front.

---

## F2 — PRE-RICH APPLICATION PROFILE
**Goal:** keep application policy explicit and testable without contaminating IMMORTAL.

### F2.1 Canonical classes
- 1/2/3/5/10/25/50/100 USDM
- canonical class identity
- saleability
- cap
- issued/unresolved/exposure

### F2.2 Hysteresis
- KA=8
- KC=4
- KD=4
- activation
- contraction
- recovery
- monotonic HighestClassEverActivated

### F2.3 Classic-6
- two independent rows
- 20,000-slot mapping
- rejection/unbiased reduction
- deterministic replay
- exact payout-unit representation

### F2.4 Jackpot
- state-derived activation
- FundingNeed
- RawSurplus bound
- locked liquidity
- exactly-once payout
- no effect on normal-row randomness

### F2.5 Expiry
- deterministic profile horizon
- crystallized expiresAt
- terminal expiry
- no late resurrection

**Status:** mostly bounded / implementation evidence continues.

---

## F3 — CARDANO ADAPTER / EXECUTION
**Goal:** make Cardano a faithful realization, not a second economic authority.

### F3.1 Serialization
- datum/redeemer compatibility
- integer/unit preservation
- Babbage decoding

### F3.2 Transaction construction
- Issue
- SyncBeacon
- Reveal
- Claim
- Expire
- Jackpot funding where applicable

### F3.3 Transaction-size architecture
- observed protocol maxTxSize
- Reveal reference scripts
- no inline fallback
- serialized-size evidence

### F3.4 Native-ledger evaluation
- exact Tx
- exact UTxO
- exact PParams
- EpochInfo
- SystemStart
- native evaluation

### F3.5 Real Preprod witness
- real wallet
- real ticket
- real transaction
- real observed datum/state
- evidence packet

**Status:** P2.8 + Preprod witness OPEN.

---

## F4 — BEACON / RANDOMNESS
**Goal:** establish the strongest available trust mode without silently changing the trust model.

### F4.1 B1
- authorized publication
- deterministic derivation
- target binding
- fail-closed invalid/missing state

### F4.2 B2
- committee attestation
- quorum semantics
- attestation identity
- replay/conflict handling
- one-shot round binding

### F4.3 B3
- canonical checkpoint
- GRANDPA finality
- authority selection
- ancestry
- state-root authenticity
- storage proof
- succinct proof / verifier
- publisher independence

### F4.4 Trust-mode selection
For each new round:
`B3 → B2 → B1`
Freeze the mode before commitments. Existing rounds never downgrade.

### F4.5 Randomness conformance
- Plutus ↔ TypeScript byte-for-byte
- replay vectors
- domain separation
- Jackpot randomness separation
- no operator-selected outcome

**Status:** B1 bounded; B2/B3 OPEN.

---

## F5 — MATERIOS / EXTERNAL CANONICALITY
**Goal:** make external state canonicality independently verifiable.

### F5.1 GRANDPA finality
- finalized block
- justification
- authority set
- ancestry

### F5.2 Authority selection
- genesis inputs
- sidechain epoch
- D-parameter/stake weighting
- deterministic ordering
- seed derivation
- committee selection

### F5.3 State authentication
- state root
- key derivation
- storage proof
- root/value binding

### F5.4 Succinct proof
- canonical proof system
- Cardano verifier feasibility
- size/execution budget

### F5.5 Adversarial closure
- mutated epoch
- mutated authority set
- stale finality
- conflicting roots
- replayed anchor

**Status:** OPEN.

---

## F6 — PRE-GENESIS / GENESIS / TREASURY
**Goal:** create a real Preprod Treasury and bind Genesis admission to its canonical observed state.

### F6.1 Treasury identity
- deployed validator script
- deterministic script address
- deployment-configured identity
- no operator wallet as Treasury

### F6.2 Treasury observation
- exact Treasury state reference
- PRE policy/name
- PRE quantity
- ambiguity rejection
- source-state hash

### F6.3 Oracle observation
- singleton token
- asset identity
- publisher
- timestamp freshness
- exact price
- source reference

### F6.4 Genesis valuation
`PRE quantity × verified Oracle price / canonical precision`

### F6.5 Genesis admission
- PRE-GENESIS regime
- canonical Treasury
- canonical PRE
- verified/fresh Oracle
- ≥ 4000 USDM
- fail-closed negative cases

### F6.6 Genesis carrier
- one-shot transition
- exact Treasury/Oracle references
- replay rejection
- real Preprod witness

**Status:** Treasury surface IMPLEMENTED; canonical observation/admission binding OPEN.

---

## F7 — PUBLIC DECLARATION / OBSERVABILITY
**Goal:** the protocol publicly declares what it is actually doing.

### F7.1 Declaration schema
- Life State
- Current Activity
- Operational Status
- Beacon mode
- evidence

### F7.2 Activity binding
Only observed lifecycle may become public activity:
- ISSUING
- AWAITING_FINALITY
- SETTLING
- IDLE

### F7.3 Life State
- PLANULA
- POLYP
- YOUNG_MEDUSA
- MEDUSA
- REGENERATION

Thresholds remain OPEN until sourced.

### F7.4 Staleness
- observation timestamp
- stale/unavailable state
- no cached truth

### F7.5 Evidence UI
- canonical state reference
- transaction reference
- observation source
- scope

**Status:** schema/binding implemented; live source + Life State mapping OPEN.

---

## F8 — IMMORTAL V5 / DAPP ECOSYSTEM
**Goal:** present the system as a coherent public protocol rather than a developer dashboard.

### F8.1 V5 base
Preserve the original multi-page V5 information architecture.

### F8.2 DApp Ecosystem
- ecosystem overview
- PRE-RICH application card
- launch DApp
- protocol/application boundary

### F8.3 PRE-RICH DApp
- user wallet connection
- Preprod
- canonical ticket state
- lifecycle
- evidence

### F8.4 Treasury surface
- protocol Treasury address
- user wallet distinct from Treasury
- user-signed funding
- live state

### F8.5 Public language
International English.
No marketing claims presented as verification.

**Status:** active refinement.

---

## F9 — GOVERNANCE / ALGORITHMIC GOVERNABILITY
**Goal:** make governance observable, replayable and bounded by protocol authority.

### F9.1 Authorization
Who may propose/approve.

### F9.2 Execution
How approved changes execute.

### F9.3 Observation
How the chain/runtime proves what executed.

### F9.4 Replay
How an independent verifier reproduces the decision.

### F9.5 Economic bounds
Governance cannot:
- choose winners
- rewrite crystallized payouts
- bypass Gate
- create privileged Treasury entitlement
- alter canonical randomness

**Status:** implemented/research evidence continuing.

---

## F10 — LIVENESS / OPERATIONS
**Goal:** distinguish availability from truth and safety.

### F10.1 R4 classifier
FM1–FM10 precedence and classification.

### F10.2 Permissionless recovery
- eligible action
- executable trace
- no privileged operator dependency where not required

### F10.3 Beacon availability
- selected trust mode
- round freeze
- new-round fallback only

### F10.4 Staleness
Operational status must have observation scope and age.

**Status:** classifier bounded; deployment evidence OPEN.

---

## F11 — EVIDENCE / CERTIFICATION
**Goal:** every closure claim points to reproducible evidence.

### F11.1 Evidence taxonomy
- unit/conformance
- simulation
- Yaci/devnet
- native ledger
- Preprod
- external canonical witness

### F11.2 Evidence binding
- exact commit
- exact transaction
- exact UTxO
- exact protocol parameters
- exact source hash

### F11.3 Negative evidence
Each critical gate needs rejection cases, not only happy path.

### F11.4 Reproducibility
Independent rerun from frozen inputs.

### F11.5 Closure register
No green label without the required evidence class.

**Status:** OPEN / continuous.

---

## F12 — ARCHITECTURAL / NOVELTY RESEARCH
**Goal:** document prior art before making any novelty claim.

### F12.1 Known mechanisms
Identify established components individually.

### F12.2 Composition
Identify the actual IMMORTAL composition.

### F12.3 Differentiators
Describe concrete architectural differences.

### F12.4 Evidence
Cite primary sources and repository evidence.

**Status:** research.

---

# Immediate execution order

1. **F6** — bind real Treasury observation to Genesis admission.
2. **F3** — close P2.8 + real Preprod Reveal witness.
3. **F4/F5** — close B1/B2/B3 boundaries without trust-model regression.
4. **F7/F8** — finish live public transparency and V5 presentation.
5. **F1/F2** — state-boundary and economic conformance closure.
6. **F9/F10** — governance/liveness evidence.
7. **F11** — final certification packets.
8. **F12** — research/novelty map.

This order is operational, not a ranking of importance: F6/F3 produce concrete chain witnesses that unblock several downstream evidence surfaces.
