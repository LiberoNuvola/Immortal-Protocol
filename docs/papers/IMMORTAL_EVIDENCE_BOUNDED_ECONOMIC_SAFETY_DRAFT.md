# Evidence-Bounded Economic Safety for UTxO Ticket Systems
## A liability-first accounting model and an explicit path from specification to deployment evidence

**Manuscript status:** Research draft — not submission-ready.
**Workstream:** A — V1 + Paper Tranche 1.
**Branch:** `work/immortal-green-closure`.
**Version:** 0.1 — claim-calibrated draft.
**Scope:** IMMORTAL safety specification and its PRE-RICH/Cardano case study. This manuscript does not certify the current implementation or claim mainnet readiness.

## Abstract

Economic applications built on UTxO ledgers must do more than encode a payout rule: they must represent unresolved obligations, protect capital already committed to those obligations, constrain state transitions, and make the evidence supporting an admission decision inspectable. This paper studies an evidence-bounded approach to economic safety for ticket-based applications. IMMORTAL provides a chain-neutral normative and mathematical safety model; PRE-RICH supplies a concrete ticket-lifecycle profile and Cardano adapter as a case study. The model distinguishes protected obligations and capital from freely distributable surplus, with the specified boundary `RawSurplus = max(0, EEV − ProtectedCapital)`, and treats admission as a decision over an explicitly supplied state, valuation and environment rather than as a claim that external observations are intrinsically authoritative.

The contribution is not a claim that the current application is universally safe or formally verified. It is a structured account of how safety claims can be separated into mathematical results, normative closure, implementation conformance, bounded tests, live observations and native-ledger execution evidence. The verification baseline reports proven results about the viability kernel, implementable safety gates, valuation conservatism and the distinction between safety and progress. Separately, repository evidence reports bounded differential transition checks and Cardano Preprod observations, while identifying implementation-conformance and a real production-path Reveal ledger witness as unresolved. We use this separation to state what can be supported now, what remains conditional on deployment evidence, and how a reproducible evaluation should be assembled. The result is an evidence-bounded research contribution: explicit liability-first accounting and trust boundaries, paired with a traceable route from specification to observable execution.

**Keywords:** UTxO, economic safety, liability-first accounting, protected capital, formal methods, refinement, Cardano, evidence provenance, commit-reveal.

## 1. Introduction

A ticket application that executes on a UTxO ledger has at least two different correctness problems. The first is economic: which obligations exist, which assets or reserves protect them, and which transitions may create, discharge or extinguish those obligations? The second is evidential: how can a reviewer determine that the state used for an economic decision was observed correctly, that the implementation preserves the specified transition, and that the claimed behavior corresponds to a real ledger execution?

These problems are related but not interchangeable. A mathematically sound gate does not prove that a concrete adapter supplies the right inputs. A normative rule does not prove that code implements it. A passing fixture or emulator trace does not establish that a production-path transaction was accepted under the relevant ledger rules. Likewise, a live observation of a wallet or pool is not, by itself, evidence that a particular state transition was evaluated correctly.

IMMORTAL addresses the first problem with a chain-neutral normative and mathematical safety model and a certification structure for concrete profiles. PRE-RICH is a ticket-based application profile used to examine how these rules meet a Cardano implementation. This paper concentrates on the narrow, reviewable intersection: liability-first UTxO ticket accounting, explicit trust boundaries, and an evidence path that prevents stronger claims from being inferred from weaker artifacts.

The central research question is:

> **How should a UTxO ticket system express liability-first economic constraints and report the strength and limits of evidence that connects its safety specification to a concrete ledger implementation?**

Our answer is deliberately bounded. We describe the model and its proof-level results, map the concrete implementation and test surfaces, report only the conformance and observation evidence documented for specific snapshots, and make unresolved obligations part of the result rather than hiding them in future-work prose.

### 1.1 Contributions

This draft makes four claims, each with a distinct evidence class:

1. **A formal safety specification.** The IMMORTAL verification baseline records mathematical results for the safety game, viability kernel, certificate/gate construction, valuation conservatism, and safety-versus-progress boundary. These are claims about the mathematical model under stated assumptions, not about every deployment.
2. **An explicit economic accounting boundary.** The PRE-RICH profile documents liability/protection-first accounting, protected capital and a surplus boundary. The paper treats profile-level exhaustiveness and correct observation as separate obligations.
3. **A traceable refinement/evidence structure.** The repository contains code loci for the economic kernel, V3 transitions, refinement/projection, differential replay and adapter boundary tests. The claim-to-evidence matrix records which artifact supports which claim and where evidence is still absent.
4. **A bounded account of implementation progress.** The available dossier reports specific transition-level differential checks and live Preprod observations, but also states that full production-path ledger equivalence remains gated by a qualifying submitted transaction witness and native ledger evaluation.

The fourth contribution is methodological: it makes evidence strength and non-claims auditable. It is not a claim that the whole application is complete.

### 1.2 Non-contributions and non-claims

This paper does **not** claim that:
- the current repository implementation is formally verified;
- every deployment has a non-empty or computable viability kernel;
- every profile has a valid concrete certificate, exhaustive economic partition, correct environment perimeter or trusted valuation oracle;
- safety implies liveness or eventual settlement;
- all Cardano production executions are equivalent to the abstract kernel;
- the publisher-independent B3 Beacon is deployed or proven canonical;
- an independent external security audit is complete;
- PRE-RICH is mainnet-ready.

These boundaries follow the repository's verification status and white paper; they are not qualifications added merely for publication.

## 2. System model and scope

### 2.1 Layers and authority

The relevant architecture separates:

1. **IMMORTAL normative and mathematical layer:** chain-neutral economic semantics, safety model and invariants.
2. **Application/profile layer:** PRE-RICH ticket policy, economic profile and lifecycle.
3. **Adapter layer:** mapping concrete ledger state and evidence to the abstract transition/state model.
4. **Ledger execution layer:** transaction construction, validation, submission and observation.
5. **Evidence layer:** artifacts binding a claim to a source snapshot, test or observed execution.

The authority hierarchy is important. Explanatory documents describe the system; normative specifications define rules; implementation realizes those rules; tests and proofs provide bounded evidence. Lower layers do not silently override higher layers. Conversely, a closed specification does not make a missing implementation obligation disappear.

The repository identifies `IMMORTAL/kernel/EconomicKernel.hs`, `IMMORTAL/kernel/EconomicTransitionV3.hs` and `IMMORTAL/conformance/RefinementV3.hs` as relevant implementation loci. Their presence supports source mapping; it is not, on its own, proof that concrete ledger observations are complete or that every code path conforms.

### 2.2 Economic accounting

The application specification defines a canonical economic unit and a ticket-price ladder. PRE-RICH's documented profile includes a 1 USDM Genesis price, a verified PRE Treasury bootstrap threshold of at least 4,000 USDM, and a maximum normal payout of (500 \times P). The model separates protected obligations/capital from surplus:

`RawSurplus = max(0, EEV − ProtectedCapital)`

Here, `EEV` is the executable economic value supplied by the relevant profile and evidence boundary; `ProtectedCapital` represents obligations/exposures that cannot be treated as freely distributable value. This paper does not redefine EEV, invent valuation haircuts, or assert that every asset is directly and reliably valued. The verification baseline explicitly states that safety is relative to the supplied valuation and that valuation-oracle evidence is a deployment obligation.

The accounting question is therefore not simply whether a pool has a positive balance. It is whether the value that is admitted into the decision is correctly qualified, the protected obligations are completely represented for the profile, and the candidate transition preserves the specified constraints.

### 2.3 Ticket lifecycle

The PRE-RICH case study uses a lifecycle that includes issuance, commitment/reveal, crystallization, claim and expiry. The V3 transition source defines `Issue`, `Reveal`, `Claim` and `Expire` action classes. This paper does not change their semantics or treat a documentation-level description as proof of execution. The specific claim is that these transitions have named specification and implementation loci and that bounded evidence exists for selected transition/refinement boundaries.

### 2.4 Trust boundaries

The following components are not interchangeable with protocol authority:

- a frontend or backend may display state or construct requests;
- a relayer may transport or submit a transaction;
- an oracle or valuation source may supply observations used by the economic decision;
- a Beacon publisher may provide data under the declared Beacon trust model;
- an adapter may map concrete ledger data into the abstract state;
- a ledger evaluator determines validity under the exact transaction, UTxOs, protocol parameters and timing context.

The PRE-RICH white paper describes B1 as an Authorized Publisher model and B3 as the target publisher-independent canonical Beacon. Accordingly, the current B1 trust assumption must remain explicit; B3 is not presented here as achieved deployment evidence.

## 3. Formal safety model: what the theory establishes

The repository's `docs/03-audit/VERIFICATION_STATUS.md` records a v3.0.0 mathematical/certification baseline and expressly states that it does not certify the current repository implementation. It reports twenty mathematical results, including:

- a game-theoretic characterization of the viability kernel (`T-CHAR`);
- an obstruction result for uniform buffer erosion (`T-EROSION`);
- a certificate/gate result and buffer schema (`T-CERT`, `T-MARGIN`);
- the admission condition as containment rather than equality (`T-OMEGA-ADMIT`);
- results on the relationship between supplied valuation and safety (`T-EEV-REL`, `T-EEV-MONO`);
- the distinction between safety and progress (`T-NOLIVE`) and a stall-attribution result (`T-STALL-ATTRIB`);
- conservation and composition results with stated conditionality.

The exact assumptions and theorem statements must be cited from the formal corpus in the final bibliography and technical appendix. This summary does not replace those statements.

Two consequences matter to the application study.

First, the existence of a safety theorem is not a universal deployment certificate. The verification status lists unresolved obligations for profile instantiation and a decision procedure, implementation conformance, an environment/perimeter, substrate and actor behavior, governance execution, composition, profile economics, the initial state and the valuation oracle.

Second, safety does not imply progress. A system may refuse an action because required evidence is unavailable; this can preserve the safety boundary while failing to deliver liveness. The paper therefore treats fail-closed behavior and safe-stall classification as safety/evidence properties, not as proof that a transaction will eventually be accepted or settled.

## 4. From specification to implementation evidence

### 4.1 Traceability method

For each headline claim, the evaluation records the chain:

**Specification → Proof/argument → Code locus → Test → Deployment evidence**

The evidence class is recorded separately at every step. In particular:

- semantic closure is not implementation conformance;
- implementation conformance is not the same as public deployment evidence;
- a test or replay is not a native-ledger execution witness;
- an observation is not a proof that an unobserved transition was valid.

The accompanying [claim-to-evidence matrix](PAPER_TRANCHE_1_TRACEABILITY.md) instantiates this method and identifies allowed wording and open obligations for each proposed claim.

### 4.2 Concrete source and test surfaces

The current source map includes:

- `IMMORTAL/kernel/EconomicKernel.hs` — class exposure, worst-case exposure, protected capital, raw surplus, saleability, solvency and conservation functions;
- `IMMORTAL/kernel/EconomicTransitionV3.hs` — Issue, Reveal, Claim and Expire transition functions;
- `IMMORTAL/conformance/RefinementV3.hs` — concrete-to-V3 projection and refinement checks;
- `plutus/test/ProjectionBoundaryConformanceTest.hs` — V3-to-Universal projection boundary checks;
- `src/__tests__/differentialActionReplay.test.ts` — action refinement-admissibility replay;
- `src/__tests__/immortal-cardano-adapter-conformance.test.ts` — adapter boundary fixtures, mapping/provenance and mutation checks.

These artifacts identify where to inspect behavior and reproduce bounded checks. A final evaluation must run the relevant commands against the exact frozen commit and preserve complete logs and hashes. The paper does not infer a fresh test result from the existence of a test file.

### 4.3 Reported bounded evidence

The Preprod Conformance Dossier reports differential evidence for Issue, Reveal, Claim and Expire, including protected-capital deltas and fail-closed mismatch cases. It also reports that the PRE-RICH Reveal boundary suite passed 4/4 in a successful Preprod workflow, alongside live Demeter/Ogmios v7 context, live wallet UTxO observation, and a source-bound evidence packet. The dossier identifies the historical successful run as `36221378619` / run `44`, at source head `ae4fcc020dff326e8a3ea75c0e07e380a5451bc6`.

This evidence must be reported as evidence for that specific source snapshot and exercised cases. It must not be silently relabeled as evidence for a different current commit or generalized to every possible production execution.

### 4.4 Missing end-to-end ledger witness

The end-to-end dossier and P2.8 ledger-evaluation dossier distinguish bounded tests and live observations from native-ledger evaluation. The documented remaining gate is a qualifying, already-submitted Cardano Preprod transaction hash for the intended production Reveal path, followed by binding the exact transaction CBOR, consumed UTxOs, epoch-specific protocol parameters, era/epoch timing, SystemStart and native `cardano-ledger` evaluation into a reproducible evidence packet.

The existence of the workflow or runner is not evidence that the evaluation has passed. A candidate transaction must first be inspected to ensure it is the intended production path rather than a generated test-policy transaction. Until the qualifying witness and successful evaluation are present, this paper makes no claim of complete production-path ledger equivalence.

## 5. Evaluation protocol and reproducibility

The minimum reproducible evaluation should freeze and publish:

1. the exact source commit SHA and branch snapshot;
2. hashes/versions of the normative documents, code and scripts;
3. exact commands, toolchain versions and environment assumptions;
4. test names, inputs, outputs, logs and artifact hashes for every reported mechanical result;
5. network, observation time/slot, source context, UTxO references and transaction IDs for live claims;
6. exact CBOR, consumed UTxOs, epoch protocol parameters, era/epoch timing, SystemStart, evaluator version and result for ledger-execution claims;
7. at least one controlled rejection drawn from an already specified invalid case, without introducing new protocol semantics;
8. a machine-readable manifest linking each evidence artifact to the claim and source snapshot it supports.

The packet must distinguish positive results, negative results, unavailable evidence and unexecuted checks. A generated fixture, a local Yaci trace, a workflow definition or a successful build must not be promoted into evidence of a real production transaction.

At this draft stage, the evidence map and source loci are assembled, but the complete public evaluation packet and qualifying production-path native-ledger witness are not established by the cited dossiers. The paper therefore describes the evaluation protocol and reports the bounded evidence above; it does not claim that the end-to-end evaluation is complete.

## 6. Threat model and limitations

### 6.1 Assumptions

The safety result depends on the formal model's stated assumptions and, for a concrete profile, on the correctness and completeness of its declared state, environment, valuation and transition mapping. External data is not made authoritative simply by being fetched or signed. A signature may authenticate an origin without proving that the observation is complete, current or canonical.

### 6.2 Failure and adversarial surfaces

Relevant surfaces include:

- incorrect or incomplete valuation input;
- omission of a commitment/liability class from the accounting partition;
- stale or incorrectly mapped concrete state;
- adapter paths that bypass or weaken the intended economic gate;
- publisher/oracle/relayer assumptions that exceed the evidence actually available;
- transaction construction that differs from the tested abstraction;
- missing or mismatched ledger context during native evaluation;
- unavailable inputs or actors causing stalls;
- governance or composition conditions that have not been exercised in a concrete deployment.

The residual obligation register specifically records that an omitted commitment class can be invisible to internal conservation checks while under-counting protection. This is why conservation alone cannot substitute for a profile-specific exhaustiveness argument.

### 6.3 Explicit limitations

The current evidence does not establish implementation conformance across all paths, a concrete certificate for every deployment profile, completeness of a real-world environment perimeter, correctness of every valuation oracle, liveness, a concrete governance act, composition with a second system, independent external security audit, or mainnet readiness. The B3/B4 work and broader generalization of IMMORTAL remain ongoing research, not results claimed by this paper.

## 7. Related work and positioning

This section is a targeted comparison, not a claim of exhaustive literature coverage. The works below are verifiable starting points for the submission bibliography. Their contribution is described narrowly; the paper does not infer novelty merely because the systems have different names or architectures.

### 7.1 Formal specification and implementation conformance for Cardano

Knispel et al. present a mechanized Agda specification covering Cardano ledger transitions and describe it as an executable specification against which production implementation is tested for conformance. This is directly relevant to the distinction between a formal model and concrete ledger behavior. Ferariu, Wadler and Melkonian model smart-contract examples as transition systems, prove their properties in Agda, and separately establish functional equivalence to validator implementations generated through agda2hs, with emulator/property-based testing.

These works set a demanding comparator: a paper about economic safety should state precisely which layer is formalized and what evidence connects it to executable code. IMMORTAL's stated contribution in this draft is different in emphasis: a chain-neutral economic safety/certification model, liability/protection-first accounting concepts, and a claim-by-claim evidence classification for a PRE-RICH/Cardano case study. This is a **positioning hypothesis**, not yet a demonstrated novelty claim. A submission must compare the exact formal definitions, proof obligations and refinement relations before claiming a distinct technical contribution.

### 7.2 EUTXO as execution model

Cardano's official documentation explains that EUTXO transactions consume existing outputs, produce new outputs and carry data, and that transaction validity is evaluated from the transaction and its inputs. This motivates explicit input/state provenance and bounded transition evaluation. It does not, by itself, solve application-level completeness of economic liabilities, valuation trust, or proof that an adapter has mapped every relevant datum correctly. The paper's accounting argument therefore sits above the ledger's value-conservation and transaction-validity rules; it must not imply that EUTXO alone guarantees economic solvency.

### 7.3 Commit-reveal and randomness beacons

Lee et al.'s *Commit-Reveal²* studies last-revealer strategies in randomness beacons and proposes randomized reveal ordering plus accountability and recovery mechanisms. This is relevant to the paper's treatment of reveal availability, bias resistance and liveness. The comparison must remain scoped: the present draft is not proposing a new randomness beacon and does not claim to solve last-revealer bias. Its focus is the economic safety and evidence boundary around a ticket lifecycle that may consume a Beacon result. PRE-RICH's B1 Authorized Publisher assumption remains explicit; B3's publisher-independent canonicality is ongoing work, not a result of this paper.

### 7.4 Safety cases and evidence argumentation

The safety-case literature treats assurance as an argument linking claims to supporting evidence under a defined application and environment. This supports the paper's structure—claim, assumptions, evidence class, counter-boundary and residual obligation—but the structure itself is not a new formal proof technique. The useful engineering contribution is to apply that discipline to the repository's concrete distinction between mathematical result, normative closure, code/test evidence, live observation and native-ledger witness.

### 7.5 Bounded comparison and novelty statement

The defensible statement at this stage is:

> This work combines a chain-neutral economic safety specification with an explicit evidence-traceability method and a bounded PRE-RICH/Cardano case study. Its distinctive value, if confirmed by a fuller comparison, is the explicit treatment of the boundary between formal safety claims and the evidence required to justify deployment-specific claims.

Do **not** yet claim firstness, superiority, universal chain agnosticism in deployed code, full implementation verification, or a novel randomness construction. A camera-ready version should include a systematic comparison table (formal object, safety property, proof technique, implementation relation, runtime evidence, trust assumptions, liveness guarantees) and revise the novelty sentence based on that analysis.

### 7.6 Research gaps still open

The current literature pass is enough to anchor the comparison but not to establish comprehensive coverage. Dedicated searches and full-text review are still required for solvency/accounting protocols, oracle/valuation security, viability-kernel synthesis, proof-carrying certificates and deployment evidence pipelines.

## 8. Discussion

The central lesson from this case study is methodological. An economically meaningful protocol cannot be evaluated solely from its rulebook, its code, its tests, or a live transaction in isolation. These artifacts answer different questions. The mathematical model states what follows from assumptions; the normative layer fixes intended semantics; refinement and tests examine bounded implementation relationships; live observation binds claims to an external network; and a native-ledger witness tests the exact transaction against the applicable ledger context.

This layered approach also makes negative results useful. A paper that explicitly reports missing profile evidence, unresolved conformance, and an incomplete production-path witness gives reviewers a way to assess the work without treating development progress as certification. It also defines what evidence would change the status of each claim.

The present contribution should therefore be judged as a formal specification and an evidence-traceability case study with bounded implementation observations, not as a finished or universally verified financial application.

## 9. Conclusion

This paper has framed liability-first UTxO ticket accounting as both an economic specification problem and an evidence problem. IMMORTAL's mathematical baseline supports specific claims about safety gates, viability and the limits of safety; PRE-RICH supplies a concrete ticket-profile case study; repository tests and Preprod dossiers provide bounded implementation evidence. The same sources identify important limits: deployment-specific profile and valuation obligations remain, implementation conformance is not established globally, liveness is not claimed, and the native-ledger witness for the intended production Reveal path remains a publication gate.

The contribution is thus not “a universally safe protocol,” but an explicit, auditable separation of specification, proof, implementation, test and deployment evidence. The next step toward a publishable system/workshop paper is to freeze the source snapshot, complete the reproducible evaluation including a controlled rejection and qualifying ledger witness, finish the related-work comparison, and publish the complete evidence packet alongside the manuscript.

## References and repository artifacts

### External literature and primary documentation

1. Knispel, A., Melkonian, O., Chapman, J., Hill, A., Jääger, J., DeMeo, W., & Norell, U. (2024). “Formal Specification of the Cardano Blockchain Ledger, Mechanized in Agda.” *FMBC 2024*, OASIcs 118, 2:1–2:18. https://doi.org/10.4230/OASIcs.FMBC.2024.2
2. Ferariu, T., Wadler, P., & Melkonian, O. (2025). “Validity, Liquidity, and Fidelity: Formal Verification for Smart Contracts in Cardano.” *FMBC 2025*, OASIcs 129, 6:1–6:21. https://doi.org/10.4230/OASIcs.FMBC.2025.6
3. Lee, S., Gee, E., Soroush, N., Bingol, M. A., & Huang, K. (2025). “Commit-Reveal²: Securing Randomness Beacons with Randomized Reveal Order in Smart Contracts.” arXiv:2504.03936; later conference publication DOI: https://doi.org/10.1109/ICBC64466.2025.11114691
4. Cardano Documentation. “Plutus — Accounting model used by Plutus” and “The Extended UTXO Model.” https://docs.cardano.org/developer-resources/smart-contracts/plutus and https://developers.cardano.org/docs/get-started/technical-concepts/eutxo/
5. Leveson-style safety-case literature remains to be selected and checked against the intended formal argumentation framework; no specific reference is claimed as fully reviewed in this draft.

### Repository artifacts (must be pinned to the exact frozen commit)

1. `docs/03-audit/VERIFICATION_STATUS.md` — mathematical/certification status and non-claims.
2. `docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md` — R1–R9 and required external evidence.
3. `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md` — normative economic kernel.
4. `docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md` — invariants and conservation.
5. `docs/02-certification/IMMORTAL-PREPROD-CONFORMANCE-DOSSIER.md` — bounded conformance and live observation evidence.
6. `docs/02-certification/END-TO-END-EVIDENCE-DOSSIER.md` — end-to-end evidence boundary.
7. `docs/02-certification/P2.8-LEDGER-EVALUATION-DOSSIER.md` — native-ledger witness requirements and status.
8. `docs/WHITEPAPER.md` — PRE-RICH application scope, Beacon trust model and readiness status.
9. `docs/papers/PAPER_TRANCHE_1_TRACEABILITY.md` — claim-to-evidence matrix.
10. Notion, **03 — Open Decisions & Roadmap**, section “WORKSTREAM A — PAPER TRANCHE 1” — workstream scope, P1–P5 and exit gate.
