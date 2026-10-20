# Paper Tranche 1 — P5 Related-Work Screening Log

**Workstream:** A — V1 + Paper Tranche 1  
**Branch:** `work/immortal-green-closure`  
**Screening date:** 2026-10-20  
**Status:** P5 PARTIAL — targeted full-text/primary-source screening expanded; systematic review and novelty assessment remain OPEN.

## Purpose and guardrail

This log advances P5 by recording sources screened for the manuscript's central claim: a liability/protection-first economic safety specification paired with explicit evidence boundaries from mathematical result through implementation and ledger evidence. It is not a completed systematic literature review (SLR). The searches in this pass were targeted web searches and primary-publisher/author repositories, not a reproducible exhaustive search across Scopus, IEEE Xplore, ACM Digital Library, Web of Science, or all relevant preprint repositories. No firstness, novelty, superiority, or priority claim is justified by this pass.

## Review questions

- **RQ1 — Economic model:** How do related works model assets, liabilities, solvency, reserves, or financial safety?
- **RQ2 — Formal object:** What is formalized (ledger, individual contract, composition, viability set, or assurance argument)?
- **RQ3 — Evidence relation:** What connects the formal or normative claim to implementation, tests, deployed runtime, or external audit?
- **RQ4 — Trust boundary:** Which external inputs, oracles, off-chain liabilities, authorities, or environment assumptions remain?
- **RQ5 — Distinct scope:** Which part of the IMMORTAL/PRE-RICH contribution could be complementary, and which potential novelty claims remain unsubstantiated?

## Search and screening record

### Search date and query families

Search date: 2026-10-20. Targeted web searches were run for:

1. `formal verification solvency smart contracts DeFi collateral liabilities paper`
2. `formal methods economic safety blockchain protocol liabilities reserve accounting proof`
3. `viability kernel safety games formal verification literature survey`
4. `security assurance cases evidence provenance systematic review GSN`
5. `proof-carrying data deployment evidence reproducibility blockchain smart contract verification`
6. `on-chain solvency accounting smart contracts liabilities protected reserves formal verification`

The results were screened by title/abstract and, where available, full text or the publisher's full HTML. Search-engine results are discovery evidence, not a guarantee of completeness. The following sources were examined more closely and are included because their subject matter materially overlaps with the paper's claims.

## Source-by-source comparison

### S1 — Knispel et al. (2024): Cardano ledger formal specification

**Source:** Knispel, A. et al., “Formal Specification of the Cardano Blockchain Ledger, Mechanized in Agda,” FMBC 2024, OASIcs 118, 2:1–2:18. [Publisher record and full paper](https://drops.dagstuhl.de/entities/document/10.4230/OASIcs.FMBC.2024.2), DOI 10.4230/OASIcs.FMBC.2024.2.

- **Formal object:** the Cardano ledger's modular transition hierarchy, including realistic ledger rules and governance.
- **Method/evidence:** mechanized Agda specification; the paper describes an executable specification used to test production implementation conformance.
- **Relation:** directly addresses ledger semantics and ledger implementation conformance, a lower-layer object than IMMORTAL's application-economic/profile safety.
- **Boundary:** does not, by itself, establish that a particular application has an exhaustive liability partition, correct external valuation, or correct adapter mapping.
- **Implication for paper:** retain as a strong comparator; explicitly distinguish ledger conformance from application-economic conformance.

### S2 — Tolmach et al. (2021): Formal analysis of composable DeFi protocols

**Source:** Tolmach, P., Li, Y., Lin, S.-W., & Liu, Y., “Formal Analysis of Composable DeFi Protocols.” [arXiv full text](https://arxiv.org/abs/2103.00540).

- **Formal object:** token, pool, and interactions among Curve, Compound and USDC models.
- **Method/evidence:** process-algebraic/CSP# models checked with PAT; the paper reports a case study over interacting DeFi protocols and safety/correctness properties.
- **Relation:** overlaps with system-level economic/security reasoning and emphasizes that interactions between protocols can create emergent risks not visible in single-contract review.
- **Boundary:** the case study models specific EVM/DeFi components; it does not provide a chain-neutral liability-first UTxO ticket accounting specification or a native Cardano production-path witness.
- **Implication for paper:** narrow the contrast to the studied formal object and evidence path. Do not imply that compositional formal analysis is absent from prior work.

### S3 — Lazirko, Appelbaum & Vasarhelyi (2025): Proof of reserves, double-helix framework

**Source:** Lazirko, M., Appelbaum, D., & Vasarhelyi, M., “Proof of reserves: a double-helix framework,” *The British Accounting Review*, article 101730 (2025). [Publisher record](https://doi.org/10.1016/j.bar.2025.101730); [institutional metadata](https://www.researchwithrutgers.org/en/publications/proof-of-reserves-a-double-helix-framework-2/).

- **Object:** verification of cryptocurrency-exchange financial positions, joining on-chain transaction analysis with off-chain financial information.
- **Method/evidence:** a proposed parallel verification framework for assets and off-chain information; the publisher abstract states no data were used for the described research.
- **Relation:** directly relevant to the distinction between observed on-chain assets and obligations that may live off-chain, and to the insufficiency of asset-only evidence.
- **Boundary:** exchange proof-of-reserves/audit scope is not identical to a UTxO ticket application's state-transition liabilities, protected capital, or economic admission predicate. The abstract does not establish a Cardano ledger execution witness.
- **Implication for paper:** discuss as a complementary accounting/provenance approach; avoid claiming that the assets/liabilities evidence problem is unique to IMMORTAL.

### S4 — Bhambhwani & Huang (2024): Auditing decentralized finance

**Source:** Bhambhwani, S. M., & Huang, A. H., “Auditing decentralized finance,” *The British Accounting Review* 56(2), article 101270 (2024). [Publisher record](https://doi.org/10.1016/j.bar.2023.101270); [institutional metadata and abstract](https://researchportal.hkust.edu.hk/en/publications/auditing-decentralized-finance/).

- **Object:** empirical relationship between smart-contract audit services and market outcomes for 316 large DeFi protocols.
- **Method/evidence:** empirical sample and event-study analysis, according to the publisher abstract.
- **Relation:** useful evidence that audits are a separate assurance institution and that an internal evidence packet must not be described as an independent external audit.
- **Boundary:** market-level empirical evidence about audit services does not prove a particular protocol's solvency, establish formal correctness, or replace a ledger execution witness.
- **Implication for paper:** retain the explicit non-claim that IMMORTAL has not completed an independent external security audit; do not conflate internal conformance work with independent assurance.

### S5 — Mohamad, Steghöfer & Scandariato (2021): Security assurance cases SLR

**Source:** Mohamad, M., Steghöfer, J.-P., & Scandariato, R., “Security assurance cases—state of the art of an emerging approach,” *Empirical Software Engineering* 26, article 70 (2021). [Open full text](https://link.springer.com/article/10.1007/s10664-021-09971-7).

- **Object:** security assurance cases as structured arguments connecting claims, context/assumptions and material evidence.
- **Method/evidence:** a systematic literature review comparing 51 papers; the paper reports gaps in practitioner support, validation and tooling.
- **Relation:** directly overlaps with claim-to-evidence traceability and the distinction between argument structure and the evidence needed to support it.
- **Boundary:** using a claim/evidence structure is not by itself a new formal method. The review is broad security-assurance literature, not a specific UTxO economic-safety or Cardano deployment result.
- **Implication for paper:** treat IMMORTAL's traceability matrix as an application of assurance-case discipline unless a precise, evidence-backed distinction is demonstrated. The paper must not claim novelty merely from arranging claims and artifacts in a table.

### S6 — Shukla et al. (2022): System security assurance SLR

**Source:** Shukla, A. et al., “System security assurance: A systematic literature review,” *Computer Science Review* 45 (2022), article 100496. [Publisher record/full-text landing page](https://doi.org/10.1016/j.cosrev.2022.100496).

- **Object:** security assurance requirements, processes, metrics, environments and methods across ICT and cyber-physical systems.
- **Method/evidence:** systematic review; the abstract emphasizes limitations of existing assurance approaches, including static approaches and lack of continuous assurance.
- **Relation:** broader context for evidence maintenance, environment assumptions and assurance-process limitations.
- **Boundary:** not a UTxO economic accounting model and not evidence of IMMORTAL implementation properties.
- **Implication for paper:** include only if it materially supports the assurance discussion; do not duplicate the narrower Mohamad et al. review without explaining the distinction.

### S7 — Aubin (1990): Survey of viability theory

**Source:** Aubin, J.-P., “A Survey of Viability Theory,” *SIAM Journal on Control and Optimization* 28(4), 749–788 (1990). [SIAM record](https://epubs.siam.org/doi/10.1137/0328044).

- **Object:** viable solutions under state constraints and controlled invariance for nonlinear control problems.
- **Method/evidence:** mathematical survey.
- **Relation:** background for viability kernels and constrained trajectories.
- **Boundary:** does not directly compare IMMORTAL's exact discrete economic safety game, proof assumptions, certificate construction, or deployment evidence. Those require a theorem-by-theorem comparison against the primary sources.
- **Implication for paper:** use as background, not as a direct novelty comparator without a more precise mapping.

### S8 — Cardano formal-ledger software artifact

**Source:** IntersectMBO, *formal-ledger-specifications* (2024 artifact). [Dagstuhl artifact record](https://drops.dagstuhl.de/entities/artifact/10.4230/artifacts.22485); [repository](https://github.com/IntersectMBO/formal-ledger-specifications).

- **Object:** executable Agda ledger specifications and extracted Haskell conformance-testing artifacts.
- **Method/evidence:** software artifact associated with the mechanized ledger specification.
- **Relation:** reinforces the need to bind formal specifications and executable artifacts to explicit versions.
- **Boundary:** not an independent artifact for IMMORTAL and not an application-level solvency certificate.
- **Implication for paper:** cite the exact artifact/version only if discussing reproducibility or ledger conformance; avoid treating a moving repository as a frozen evaluation snapshot.

## Comparison matrix

| Source | Primary formal/evidential object | What it adds to the comparison | What it does not establish for IMMORTAL |
|---|---|---|---|
| Knispel et al. 2024 | Mechanized ledger transition system | Formal ledger semantics + production-conformance objective | Application-level liability completeness or correct valuation |
| Tolmach et al. 2021 | Composed DeFi protocol models | System-level safety across interacting protocols | Chain-neutral UTxO accounting or production Cardano witness |
| Lazirko et al. 2025 | On-chain/off-chain reserve and liability evidence | Asset-only proof is insufficient when obligations span ledgers | Ticket-level state-transition correctness or native ledger evaluation |
| Bhambhwani & Huang 2024 | Empirical audit-service outcomes | Independent audit is distinct from internal tests and evidence maps | Formal correctness or solvency of an individual protocol |
| Mohamad et al. 2021 | SLR of security assurance cases | Claim/context/assumption/evidence structures and validation/tooling gaps | Novelty of IMMORTAL's traceability method by itself |
| Shukla et al. 2022 | SLR of system security assurance | Broader assurance process, environment and continuous-assurance context | Economic-kernel or Cardano-specific result |
| Aubin 1990 | Viability theory | Classical mathematical context for viability kernels | Direct theorem-level novelty comparison |
| IntersectMBO artifact | Executable ledger specification code | Reproducibility and specification-to-code comparison | PRE-RICH profile conformance |

## P5 status and closure criteria

**Status remains OPEN.** This pass expands the source coverage and corrects the comparison boundary; it does not yet satisfy a formal SLR protocol.

Remaining work:

1. Run reproducible searches in at least two suitable scholarly databases (e.g., Scopus and IEEE Xplore/ACM Digital Library) plus backward/forward snowballing; save exact query strings, dates, result counts and exports.
2. Define inclusion/exclusion criteria and a screening log before making novelty claims.
3. Complete full-text comparison for the exact formal objects in the safety-game/viability corpus and any closely related financial-safety/solvency model.
4. Compare assumptions, state spaces, transition relations, invariants, proof methods, implementation relation, runtime evidence, external trust assumptions and liveness guarantees.
5. Add the resulting matrix to the manuscript only after bibliographic metadata and each technical characterization are checked.
6. Keep the novelty statement provisional until that work is complete.

## Publication-safe conclusion at this stage

The reviewed literature already includes mechanized ledger specifications, formal analysis of composable DeFi protocols, reserve/liability verification frameworks, empirical studies of DeFi auditing, viability theory and systematic assurance-case reviews. Accordingly, the paper should not claim that formal economic safety, compositional verification, reserve/liability evidence, or assurance cases are novel in isolation.

A potentially differentiating contribution remains a **hypothesis**: the particular combination of liability-first economic accounting, explicit separation of mathematical/normative/implementation/deployment evidence classes, and a bounded PRE-RICH/Cardano traceability case. Whether this combination is novel and sufficiently substantive must be established by the systematic comparison above. No paper gate is declared closed by this log.
