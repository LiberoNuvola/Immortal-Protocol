# IMMORTAL — Midnight Adapter Research v1

Classification: research / non-normative
Status: adapter study / architecture boundary
Branch: work/b3-materios-provenance-evidence
Date: 2026-10-11

## 1. Objective

Study a future Midnight Adapter for IMMORTAL while keeping the universal economic kernel and the existing Cardano Adapter unchanged.

The target flow is:

IMMORTAL Intent → chain-neutral Economic Admission → Midnight Adapter → Compact circuit / Midnight transaction → observed public state → evidence

The repository currently has one concrete adapter: Cardano. Midnight is a second-adapter research candidate, not a production adapter.

## 2. Miroarty / Compact source note

The project history refers to a language named Miroarty as the source of the Intent concept. That name could not be verified in the current GitHub repository, connected Notion pages, searched Library material, or the public web sources reviewed on 2026-10-11. No source attribution is therefore claimed here.

Midnight's documented smart-contract language is Compact. The current official documentation describes Compact as a strongly typed, bounded language for smart contracts, with public ledger state, zero-knowledge circuits, and TypeScript-supplied witnesses.

Until the exact Miroarty reference is recovered, the IMMORTAL layer remains language-neutral and Compact is treated only as the concrete Midnight target language.

## 3. Existing Intent

The repository already contains IMMORTAL/intent/IssueIntent.ts.

IssueIntent declares the requested action and its application coordinates, but it does not authorize execution, contain economic truth, or contain Cardano-specific data.

This is an excellent adapter boundary.

## 4. Why Midnight is a meaningful second adapter

Midnight has an explicit split between:

- ledger: public on-chain state;
- circuit: logic whose correctness is proved;
- witness: local/private inputs supplied by the DApp.

The Midnight.js execution path additionally separates private-state storage, public-data access, ZK configuration, proof generation, wallet/fee balancing, and network submission.

This gives IMMORTAL a useful second execution model:

Cardano: explicit UTxO / Datum / Redeemer / validity / reference-input realization.
Midnight: circuit / witness / ledger / ZK proof / private-state realization.

The same chain-neutral Intent and Economic Admission can therefore be tested against two structurally different adapters.

## 5. Critical rule

Intent != Admission != Execution.

A Midnight witness is not an economic authority.
A Compact circuit is not a replacement for IMMORTAL economic semantics.
An adapter must not recalculate EEV, ProtectedCapital, K_c, viability, or Ω completeness.

## 6. Proposed Midnight mapping

Input: chain-neutral IssueIntent.

Admission: separately verified IMMORTAL economic decision.

Adapter preparation:
- preserve the exact Intent action and coordinates;
- bind the admission decision reference, state hash and action fingerprint;
- identify the target Compact circuit explicitly;
- classify public inputs versus private witness inputs;
- carry proof/configuration provenance.

Execution:
- invoke the generated Compact circuit through the Midnight.js provider stack;
- let the Compact circuit enforce the chain/application transition;
- generate the required proof;
- balance chain fees using Midnight's wallet/DUST mechanism;
- submit and wait for finalization.

Observation:
- read public ledger state through the public-data/indexer path;
- keep local private state separate;
- produce evidence that links the observed post-state to the admitted Intent and executed circuit.

## 7. New issue exposed by the second adapter

Today EconomicAdmissionWitness lives under Adapter/CARDANO/runtime.

That object is useful for Cardano, but importing it directly into a Midnight Adapter would invert the architecture and make the supposedly chain-neutral Intent layer depend on Cardano.

Therefore the research result is:

Cardano-specific admission object ≠ universal admission interface.

A future extraction should define a chain-neutral admission contract, then let Cardano and Midnight adapters realize it independently.

No extraction is performed in this research surface until the canonical ownership of that interface is decided.

## 8. Candidate execution envelope

prepare(Intent, Admission) → MidnightExecutionEnvelope
execute(Envelope) → MidnightSubmissionReceipt
observe(Contract) → PublicStateObservation
evidence(Receipt, Observation) → ExecutionEvidence

prepare must fail closed when admission is absent, for a different action, or not bound to the same Intent.

execute must not change the admitted economics.

observe is informational until it crosses an explicit verification/evidence boundary.

## 9. Privacy boundary

Midnight makes visibility a first-class concern.

A future IMMORTAL/Midnight profile must classify every economically relevant datum as one of:

- public ledger data;
- private witness/private state;
- committed data;
- proof-derived public statement.

The mere fact that a witness supplied a value does not make that value authoritative.

Compact's explicit disclosure mechanism must be treated as a visibility boundary, not as a source of economic authority.

## 10. Upgrade / maintenance authority

Midnight has chain-specific maintenance authority for circuit/verifier-key changes.

That authority must remain separate from IMMORTAL economic authority.

A Midnight Adapter therefore has two different proof obligations:

1. prove that the chain execution is valid for the deployed Compact contract;
2. prove that the executed action corresponds to an already-authorized IMMORTAL action.

## 11. Research risks

- economic admission binding into a Midnight circuit is not yet defined;
- public/private representation of economic state is not yet defined;
- concrete settlement mechanism is application-dependent;
- DUST / chain execution cost must remain distinct from any future IMMORTAL Protocol Usage Fee;
- real Midnight finality/evidence acquisition is not yet implemented;
- the exact Miroarty source for the historical Intent concept remains unresolved.

## 12. Research status

| Item | Status |
| --- | --- |
| IMMORTAL IssueIntent | PRESENT |
| Current concrete adapter | Cardano only |
| Midnight target language | Compact VERIFIED |
| Midnight.js provider model | VERIFIED |
| Chain-neutral adapter boundary | READY FOR DESIGN |
| Production Midnight Adapter | NOT STARTED |
| Real Midnight deployment | NOT STARTED |
| Chain-neutral admission interface extraction | OPEN |
| Miroarty source mapping | UNRESOLVED |

## 13. Non-regression

This research does not change the IMMORTAL Constitution, Economic Kernel, V3, Reveal, Cardano Adapter semantics, PRE-RICH economics, B3 Materios semantics, or Governance.