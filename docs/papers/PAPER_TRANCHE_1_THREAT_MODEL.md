# Paper Tranche 1 — Threat Model and Trust Boundaries

**Status:** Research artifact for Paper Tranche 1; threat analysis, not a security certification.
**Workstream:** A — V1 + Paper Tranche 1.
**Branch:** `work/immortal-green-closure`.
**Purpose:** make the manuscript's trust assumptions, failure surfaces, evidence requirements and non-claims explicit. This document does not introduce protocol rules, economic parameters, new authorities, or a new trust mechanism.

## 1. Scope and security objective

The object of analysis is the IMMORTAL liability-first economic model as realized through an adapter and a concrete UTxO ticket application. The narrow objective is to prevent the paper from confusing:

- a property of the abstract economic model;
- closure of a normative rule;
- implementation/refinement conformance;
- a bounded unit or integration test;
- a test-network observation;
- a qualifying native-ledger execution witness.

The primary safety concern is whether a transition preserves the liabilities and protected capital represented by the model, under its assumptions and declared environment. This threat model does **not** establish that all implementation paths conform, that every environment input is truthful or exhaustive, or that the deployed system is live, fair, audited, or mainnet-ready.

## 2. Assets and security-relevant state

| Asset / state | Why it matters | Evidence required for a concrete claim |
|---|---|---|
| Canonical economic rules and constants | An implementation must not silently substitute policy or parameters | Pinned normative source, content hash, and traceability row |
| Economic state and liability partition | Omitted obligations can make internal conservation checks appear to pass while protection is understated | Profile-specific state mapping and obligation-exhaustiveness argument |
| Protected capital / prize-pool value | Determines whether modeled obligations are covered by the qualified perimeter | Authenticated observation of the exact qualified UTxO and asset identity; no inferred liquidation value |
| Ticket lifecycle state (Issue, Reveal, Claim, Expire) | A transition can be correct in isolation yet differ from the actual deployed path | Transition-specific source, test input/output, and the matching deployment evidence class |
| Ticket owner, frozen prize and settlement amount | Mismatch or unauthorized state substitution can alter who may claim or what is paid | Exact datum/redeemer/state binding, validation locus, test and—when claimed—ledger witness |
| Beacon inputs and outcome | Randomness claims depend on the actual authority and timing assumptions | Version-specific beacon specification, commit/reveal or publisher evidence, and deployment proof |
| Adapter serialization and transaction context | Correct abstract state can be serialized or evaluated differently on the target ledger | Exact CBOR, script hash, consumed UTxOs, era/epoch parameters and native evaluator result |
| Evidence provenance | A result detached from its source commit or environment is not independently reproducible | Immutable commit, command, versions, logs, hashes and artifact manifest |

## 3. Trust boundaries and assumptions

### 3.1 Normative and application authority

The repository's stated source-of-truth hierarchy governs interpretation. A test fixture, explanatory document, implementation default or successful build does not amend a normative rule. Where a normative policy anchor has not been pinned by hash, the paper must say so rather than treating the citation as frozen evidence.

### 3.2 External observations: oracle, publisher, relayer and frontend

External inputs can be stale, incomplete, incorrectly mapped or unavailable. A signature can authenticate an origin but does not, by itself, prove truth, completeness, freshness, canonicality or economic admissibility. Frontends and relayers can transport or construct data; they are not economic authority solely because they supply it. The safety argument remains conditional on the correctness and completeness of the declared state and environment perimeter.

### 3.3 Beacon trust

B1's Authorized Publisher is a trust assumption that must be disclosed as part of the trusted computing base (TCB). The paper must not describe B3 or a permissionless canonicality mechanism as achieved merely because architecture, tests or scaffolding exist. Any stronger beacon claim requires the version-specific evidence and deployment witness that actually supports it.

### 3.4 Adapter and Cardano ledger

The abstract kernel, adapter mapping, serialized transaction, script execution and public ledger observation are distinct layers. Passing a unit test, emulator or Yaci devnet scenario does not establish that a submitted production-path transaction succeeds under the applicable native Cardano ledger rules. Such a claim requires exact transaction CBOR and hash, consumed UTxOs, script artifacts/hashes, epoch-specific protocol parameters, era/epoch timing, SystemStart, evaluator version and full result.

### 3.5 Liveness and actor availability

Safety does not imply progress. Missing observations, unavailable relayers/publishers, actor non-cooperation, insufficient funding, expired timing windows, or substrate/network unavailability may prevent a transition from completing. The paper must classify these as liveness/operational dependencies and must not describe a safe stall as successful completion.

### 3.6 Governance and composition

A theorem whose assumptions mention a governance decision does not prove that the decision was actually taken. A locally valid component does not establish safe composition with another deployed system. Any cross-system or multi-adapter claim must be limited to the exact mappings and evidence already available; B3/B4 and broader generalization remain ongoing work.

## 4. Threat and failure register

| ID | Threat / failure mode | Potential consequence | Existing control or argument | Evidence needed / current limitation |
|---|---|---|---|---|
| TM-01 | A commitment/liability class is omitted from the state partition | Protected capital or solvency may be overstated even if internal conservation passes | Liability-first accounting and explicit protected-capital model | Profile-specific exhaustiveness proof/argument; not established by conservation alone |
| TM-02 | Valuation input is stale, incomplete, misidentified or non-authoritative | Computed value does not represent the qualified assets | Explicit environment and valuation boundary; fail-closed qualification where implemented | Exact qualified UTxO, canonical asset identity, observation slot/time and source references; do not infer liquidation value |
| TM-03 | A signed publisher/oracle observation is treated as proof of truth or canonicality | Incorrect external state is admitted as authoritative | Separate origin authentication from semantic qualification | Evidence must establish what the signature proves and what it does not; B3 canonicality is not claimed |
| TM-04 | Frontend/relayer supplies a malformed, stale or substituted action/evidence packet | A downstream transition may receive data that differs from the intended state | Typed/refinement boundaries and bounded rejection tests where present | Test evidence only supports the exact exercised predicate; all production paths remain to be traced |
| TM-05 | Claim settlement differs from the frozen prize amount | Claim can violate payout immutability if mismatch is accepted | Existing refinement check requires exact equality; 250-versus-249 negative test passes | Bounded unit-test result only; not a complete Claim proof or ledger witness |
| TM-06 | Adapter serialization or transaction construction diverges from tested abstraction | On-chain behavior can differ from model/test behavior | Explicit adapter boundary and transaction-level evidence requirements | Exact transaction CBOR and native ledger evaluation still required for production-path Reveal |
| TM-07 | A devnet/emulator/test result is reported as native-ledger evidence | Paper overstates deployment validity | Evidence classes are separated in the traceability matrix and packet register | Keep native Reveal witness OPEN until all required transaction/context artifacts and native evaluation exist |
| TM-08 | Beacon design is described as permissionless or deployed without a qualifying witness | Randomness/canonicality guarantees are overstated | Disclose B1 Authorized Publisher TCB; B3 remains unachieved absent evidence | Version-specific beacon artifact and deployment evidence required |
| TM-09 | Actor or substrate unavailability blocks progress | A safe state may remain unresolved; user-facing operation stalls | Safety/liveness distinction; safe-stall must be reported as non-completion | Availability and recovery properties are not established by the current bounded rejection test |
| TM-10 | A historical run or moving branch is used as current reproducibility evidence | Result cannot be tied to the paper's exact source snapshot | Immutable commit/artifact identity and explicit historical labeling | Final release must pin manuscript, matrix, sources, logs and manifest to exact hashes |
| TM-11 | Internal tests are represented as an external security audit | Readers infer independent assurance that was not performed | Explicit non-claim in manuscript | No external audit or mainnet-readiness claim is supported |
| TM-12 | A component-level argument is generalized to multi-system composition | Unverified mapping/authority assumptions are hidden | Composition and multi-adapter work is explicitly separated as ongoing | No broad composition guarantee until mappings, assumptions and evidence are closed |

## 5. Safety versus liveness

The paper should use the following reporting discipline:

- **Safety:** the specified bad transition is excluded under the model's stated assumptions and for the implementation boundary actually tested or evaluated.
- **Liveness:** the system eventually progresses; this requires availability, timing, funding and actor/substrate assumptions not implied by safety alone.
- **Safe stall:** refusing or failing closed may preserve a safety boundary but is not a successful end-to-end operation.
- **Execution evidence:** a successful test proves only the tested path, inputs, software version and environment; it must not be promoted to a stronger evidence class.

These definitions are reporting discipline for the paper, not new protocol semantics.

## 6. Current evidence posture

As of the recorded Workflow A evidence:

- The controlled settlement-mismatch case passed in GitHub Actions on commit `9ad8ccd7e1dd1d6a9c9846106fcdf836f58a06ea`; four tests in the targeted Vitest file passed. This is bounded unit-test evidence only.
- The packet's controlled-rejection entry and traceability matrix identify the run and artifact, but the overall reproducibility packet is not complete or frozen.
- The production-path Reveal native-ledger witness remains **OPEN**.
- B1's Authorized Publisher assumption must remain visible; B3 is not claimed as deployed or achieved.
- No independent external security audit, universal safety, liveness guarantee, or mainnet readiness is claimed.
- Dependency installation for the controlled-rejection run reported 7 audit findings (2 moderate, 3 high, 2 critical). They were not auto-fixed in the evidence-only run and need scoped triage before any dependency-security claim.

## 7. Required publication checks

Before release, verify that:

1. Each threat/control statement is linked to the exact normative source, implementation locus, test and evidence class where applicable.
2. Historical and current evidence are not conflated.
3. The packet manifest includes source commit, tool versions, command, exit code, log hash and artifact hash.
4. The controlled-rejection test is described only as a bounded unit-test result.
5. The native Reveal witness is marked OPEN unless a qualifying submitted transaction has been evaluated by the native ledger with complete context.
6. The TCB explicitly includes the relevant external observation and B1 Authorized Publisher assumptions.
7. No language implies external audit, general liveness, permissionless beacon deployment, or mainnet readiness without separate evidence.

## 8. Relationship to the manuscript

This document is a supporting analysis artifact. The manuscript's Section 6 remains the concise publication-facing summary. The traceability matrix and reproducibility packet remain the authorities for claim-to-evidence classification and artifact provenance respectively. This document does not replace either one.

