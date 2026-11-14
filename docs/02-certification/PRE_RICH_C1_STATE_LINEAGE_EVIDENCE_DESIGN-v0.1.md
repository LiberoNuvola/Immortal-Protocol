# PRE-RICH C1 — State Lineage Evidence Design v0.1

**Status:** NON-NORMATIVE DESIGN NOTE — REVIEW REQUIRED  
**Owner:** Agent A — C1 identity and evidence  
**Branch:** `work/immortal-green-closure`  
**Depends on:** `PRE_RICH_C1_DEPLOYMENT_IDENTITY_ENVELOPE-v0.1.md`, especially §10  
**Purpose:** Separate deployment identity/materialization evidence from proof that the current acquired-point state descends from the authorized deployment generation.

This note proposes an evidence model only. It does not select a provider, chain indexer, trust root, transaction-proof format, lineage algorithm, governance authority, or implementation. It authorizes no code change, signature, transaction, deployment, funding, or admission. It does not alter economic rules, 500×, V3/Reveal, datum ABI, validators, or on-chain state.

## 1. Problem statement

C1 currently has three different facts that must not be collapsed:

1. **Deployment identity:** which source, script bytes, parameters, address, policy and asset identity define the component?
2. **Deployment materialization:** which transaction/output first materialized a particular on-chain state surface, if the component has one?
3. **Current state:** which UTxOs exist at the acquired ledger point, and what datum/value do they carry?

The v0.1 envelope carries `deploymentTxOutRef`; the acquired-point observer emits current `utxoReferences`. The observer validates only that `deploymentTxOutRef` is a non-empty string. It does not parse the reference, compare it with observed UTxOs, retrieve the transaction, verify canonical-chain inclusion, or prove a transition path.

A changed current out-ref is not a mismatch by itself. Conversely, matching address, datum shape, singleton asset name, or source commit does not prove that a current UTxO descends from an authorized deployment.

## 2. Evidence layers

A future verifier should report these layers independently; passing one must not imply another.

| Layer | Claim | Minimum evidence concept | Does not prove |
|---|---|---|---|
| A. Artifact identity | Source and deployment parameters derive the declared script/address/policy identity | Pinned source commit, build inputs, artifact bytes/digests, deterministic re-derivation result | Deployment authorization or live state |
| B. Deployment authorization | The exact identity package was approved by an authorized process | Externally governed trust policy plus verifiable workflow/attestation evidence | That the transaction was included or remains live |
| C. Materialization | The declared deployment transaction created the declared output(s) | Exact transaction body/id, output index, output address/value/datum, canonical-chain inclusion evidence | Current state after the output is spent |
| D. Current observation | The exact current UTxO set was returned at one acquired point | Raw query responses, exact addresses, acquired point, query metadata and response digests | Historical continuity or population exhaustiveness |
| E. State lineage | Current state is connected to the authorized materialization/generation | Independently replayable transition evidence from the materialization boundary to the acquired point | Complete historical obligation accounting unless the replay scope includes it |
| F. Population completeness | The full relevant ticket/obligation population is accounted for | Defined activation boundary, complete history/replay or an independently justified completeness mechanism | Economic qualification outside the declared scope |

The verifier output should preserve separate statuses such as `NOT_EVALUATED`, `PASS`, `FAIL`, and `NOT_APPLICABLE`. Missing evidence is not a pass. No aggregate `lineageVerified=true` should conceal which layer or component was actually checked.

## 3. Transition-chain evidence concept

For a stateful UTxO, a replayable transition chain would minimally identify:

- the authorized starting materialization output reference (or a separately approved state-origin reference);
- the ordered transactions that consume a tracked input and create the next tracked output(s);
- for each transaction: transaction ID, exact consumed input references, relevant created output references, canonical block/slot inclusion evidence, and the transaction-body or canonical ledger-data digest needed for independent verification;
- the acquired ledger point at which the replay terminates;
- explicit treatment of branches, rollbacks, reorgs, missing transactions, ambiguous spends, burns, and recreations;
- the verifier/version and the exact evidence set it consumed.

A chain of transaction IDs copied from a producer manifest is not independent proof. The verifier must establish transaction identity and canonical inclusion against a declared ledger source and a reviewed trust/consensus policy. The choice of source and proof mechanism remains open; a reachable RPC endpoint or a matching response digest alone is not an authority root.

For each hop, the verifier must demonstrate that the tracked output was consumed by the next transaction and that the claimed successor output was created by that transaction. It must reject gaps, double-spend ambiguity, out-of-order hops, invalid output indices, missing transaction bodies, non-canonical inclusion, and a terminal output that does not match the acquired-point observation.

## 4. Component-specific lineage boundaries

### 4.1 B1 Pool, V3 carrier and B2 control

These components have configured singleton asset identities in the current C1 contract. The current census requires exactly one UTxO at the expected address carrying quantity one of the exact policy ID/token name.

A lineage verifier must not stop at matching the asset unit. It must establish the asset's authorized origin and account for every relevant mint, burn, spend and recreation event under the relevant policy and transaction history. The terminal singleton holder must match the acquired-point census. The verifier must also bind the terminal datum/value to the component's declared state contract.

A singleton asset is a useful tracking handle, not proof of deployment authority and not, by itself, proof that the policy's minting semantics enforce uniqueness.

### 4.2 Counter

Counter has no C1 singleton asset under the current reader contract; its live contract is exactly one UTxO at the configured address.

Therefore its lineage cannot be inferred from a token name. A verifier would need to follow the authorized initial Counter state output through every consuming transaction and successor output, then show that exactly one terminal Counter UTxO exists at the acquired point. If the initial state output or any transition is unavailable, continuity remains unknown and C1 must fail closed.

### 4.3 PrizeValidator population

PrizeValidator is a population address, not a singleton state carrier. Its current UTxO set can contain zero, one or many ticket-obligation records. A single `deploymentTxOutRef` cannot, by itself, represent the lineage of every ticket output created at that address.

Two separate claims are required:

- **Address/script identity:** the current address is bound to the authorized PrizeValidator script and exact parameters.
- **Population/history completeness:** every relevant ticket-obligation creation and lifecycle transition within the declared accounting scope is included and reconciled.

The second claim requires an explicit history boundary and a complete replay or another independently justified completeness construction. A current-point address census alone cannot prove that no historical ticket was omitted, that no obligation was created elsewhere, or that consumed outputs are accounted for. Do not label a current UTxO census as full population lineage.

### 4.4 Script materialization versus state materialization

A script reference output that publishes script bytes, a deployment transaction that creates a carrier UTxO, and a transaction that initializes a protocol state UTxO are different materialization events. A component may have one, several, or no unique state-origin output.

Before changing the v0.1 envelope, maintainers must decide whether `deploymentTxOutRef` means:
- a script-publication/materialization output;
- an initial state output;
- a component-specific deployment transaction output; or
- a reference into a separately defined deployment transaction set.

The current field name and cross-component use do not resolve this distinction. In particular, the PrizeValidator population address must not be forced into a singleton-state interpretation.

## 5. Suggested evidence packet shape (illustrative, not an approved schema)

A future packet could keep these records separate:

- `artifactIdentity`: repository, immutable source commit, build recipe, artifact digests, script/parameter derivation results;
- `deploymentAuthorization`: trust-policy version, authorized workflow identity, attestation subject and verification result;
- `materializationEvents`: one or more typed transaction/output references, each with a declared role (script publication, initial state, carrier initialization, etc.);
- `acquiredPointObservation`: the existing observer output, raw UTxO rows and acquired ledger point;
- `lineageReplay`: per-component ordered transition evidence and independent verification result;
- `populationReplay`: PrizeValidator history boundary, ticket creation/lifecycle records and completeness result;
- `qualification`: independent booleans/statuses for identity, authorization, materialization, current observation, state lineage and population completeness.

This is a conceptual separation, not a new required envelope or an instruction to add fields. Canonical serialization, transaction proof encoding, provider selection, trust model, retention and verifier implementation all require separate review.

## 6. Fail-closed conditions

At minimum, a future verifier must leave lineage unqualified or fail when:

- the deployment authorization chain is absent or unverified;
- the materialization role/reference is ambiguous;
- a referenced transaction or output cannot be independently retrieved and verified;
- a transition hop is missing, reordered, non-canonical or inconsistent;
- an output is spent without a verified successor where continuity is required;
- singleton origin, mint/burn history or terminal holder cannot be reconciled;
- Counter has no verifiable initial state or unique terminal state;
- PrizeValidator history has no explicit boundary or cannot establish population completeness;
- the terminal replay result differs from the acquired-point census;
- the ledger source, consensus/trust policy or verifier version is unspecified.

A missing lineage proof is `UNKNOWN`, not evidence that the component is invalid. It nevertheless blocks C1 qualification wherever lineage is required.

## 7. Open decisions — no implementation authorized

1. What exactly does `deploymentTxOutRef` denote for each of the five components?
2. Which event defines the start of the PrizeValidator population-completeness window?
3. Which independently governed ledger source and canonical-inclusion proof model may a verifier rely on?
4. Is lineage verified by full replay, a transaction graph with independently checked inclusion, or another reviewed method?
5. How are rollbacks, reorgs, missing history and policy-level burn/re-mint cases handled?
6. Which authority approves the trust root, source identity, verifier implementation and evidence retention?
7. Which exact lineage claims are required for C1, and which broader PA1–PA7 claims remain separate?

Until these decisions are reviewed, no signer, CA, registry, quorum, provider, proof format or verifier is selected. GOV-30 remains a discussion draft; this note does not close it.

## 8. Ownership and disposition

Agent A owns the read-only C1 evidence model. Agent B must review any future proposal that turns lineage or completeness into an Issue precondition. No production provider, deployment producer, observer, validator, V3/Reveal, datum ABI, admission ABI, wallet flow or on-chain state is changed by this note.

**Disposition:** the existing observer remains a same-point raw census primitive. Deployment authority, materialization, current observation, state lineage and PrizeValidator population completeness remain distinct qualifications. C1 remains OPEN; PA1–PA7 remain unqualified.


## 9. Source audit — actual materialization behavior on the reviewed branch

**Reviewed branch HEAD:** `d7d34526abe17428ea98a200324d2422b0650e2e`  
**Scope:** read-only inspection of current producer and Issue source. This is source-code evidence, not proof that any corresponding Preprod transaction ran or remains live.

### 9.1 B1 PrizePool

`audit/cardano-integration/preprod-direct-usdm-bootstrap.mjs` derives the B1/Prize topology and, when no existing Pool singleton is found, submits one transaction that mints the Pool singleton and pays the B1 address with the initial inline Pool datum and physical tUSDM. It then observes the singleton output and stores its exact reference as `utxos.pool`.

There is an important recovery branch: if exactly one existing Pool singleton is found, the producer reuses that current UTxO and records it as `utxos.pool`; it does not recover or prove the original creation transaction. Thus `utxos.pool` is an observed Pool state reference at bootstrap execution, not unconditionally the immutable first materialization reference. The manifest does not separately persist the bootstrap transaction hash in the shown `utxos` record.

**Consequence:** B1's initial state creation can be evidenced by the fresh-bootstrap transaction/output when that branch actually ran and its transaction is independently verified. A reused Pool reference must be classified as a current observation unless its prior creation/lineage is independently recovered.

### 9.2 V3 carrier

`scripts/deployV3Carrier.mts` explicitly selects a seed UTxO, derives the singleton policy from that seed and token name, derives the carrier validator/address, and submits one transaction that consumes the seed, mints quantity one of the carrier asset, and creates the carrier output with the explicitly supplied canonical initial datum.

The evidence records both `deploymentTransactionRef` (transaction-level) and `carrierStateReference` (specific output-level). The output-level reference is observed after confirmation and is therefore the precise initial state output for this deployment run, subject to independent transaction/inclusion verification.

**Consequence:** for the currently inspected producer, V3 has a concrete state-materialization transaction/output pair. Its later Issue continuation outputs are state transitions, not a new deployment generation.

### 9.3 B2 control carrier

`scripts/deployPreRichControlCarrier.mts` follows the same shape: explicit seed, seed-derived singleton policy, derived control address, one transaction that consumes the seed, mints quantity one and creates the initial control datum. Its evidence records `deploymentTransactionRef` and `controlStateReference`.

The Issue builder currently reads the B2 singleton as a reference input; the inspected Issue construction does not consume and recreate B2 in the Issue transaction. Other control transitions may exist elsewhere and would need their own replay if the state changes.

**Consequence:** the B2 producer has a concrete initial state-materialization pair for its deployment run. Do not assume that it remains the current state output forever.

### 9.4 PrizeValidator population

The production Issue path in `src/mint.ts` creates a new Pending PrizeDatum output at `prizeAddress` using `payToContract`; the transaction comment explicitly describes the PrizeValidator side as `(no input) → Pending PrizeDatum`. The same Issue transaction mints/delivers the Ticket NFT and advances Counter/Pool/V3 state.

The direct-USDM bootstrap producer derives and records the PrizeValidator address/hash, but its manifest `utxos` block records only the Pool reference. It does not create a PrizeDatum population output as part of that B1 Pool bootstrap.

**Consequence:** there is no single PrizeValidator population materialization out-ref in the inspected direct-USDM producer. Each Issue creates a population member. Population history must start from an explicitly defined Issue activation boundary and account for every Issue-created PrizeDatum plus its subsequent lifecycle transitions. The script/reference-script publication event, if one exists, is a different artifact/materialization role and must not be substituted for the first ticket output.

### 9.5 Counter

The inspected direct-USDM bootstrap records `counterAddress` and `counterHash` in topology, but its `utxos` record contains only `pool`. The source regression test `preprod-direct-usdm-counter-address-evidence.test.mjs` explicitly asserts that Counter address evidence is not promoted to a Counter UTxO/materialization reference.

The production Issue path reads exactly one Counter UTxO, consumes it, and creates the continuation at the same address with datum `n + 1` in the same Issue transaction. The inspected producer set does not establish the origin transaction/output for the Counter UTxO that must exist before the first Issue.

**Consequence:** Counter's first state origin remains an evidence gap. Do not label the first observed Counter UTxO as its deployment materialization unless its origin is recovered and independently verified. The first Issue transition can only extend a known origin; it cannot retrospectively prove that origin.

### 9.6 Consolidated result

| Component | What current source establishes | What it does not establish |
|---|---|---|
| PrizeValidator | Script/address identity; each Issue creates a Pending population output | One population-wide deployment out-ref; full Issue-history boundary/completeness |
| B1 Pool | Pool singleton state output on fresh bootstrap; exact current ref in manifest | Original creation provenance on reuse path; full post-bootstrap transition lineage |
| Counter | Script/address identity; one current UTxO required; Issue consumes and recreates it | Origin transaction/output for the pre-first-Issue Counter state |
| V3 | Explicit initial datum; deployment transaction and initial state output references | Authority authentication or later transition replay |
| B2 | Explicit initial datum; deployment transaction and initial state output references | Authority authentication or later transition replay |

This audit narrows the open design question: the v0.1 requirement for a non-empty `deploymentTxOutRef` on every component is not satisfiable from the currently inspected producer outputs without either (a) inventing a reference, (b) mislabelling a current observation as initial materialization, or (c) changing the contract to support typed materialization roles and population/initial-state origins. None of those changes is made here.

The correct current disposition is to preserve missing origins as `UNKNOWN / NOT PROVIDED`, keep C1 OPEN, and obtain the missing Counter-origin and PrizeValidator population-boundary evidence before designing a production lineage verifier.
