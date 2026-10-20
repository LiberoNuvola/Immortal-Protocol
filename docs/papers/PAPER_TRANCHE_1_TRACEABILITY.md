# Paper Tranche 1 — Claim-to-Evidence Traceability Matrix

**Status:** Working paper / evidence map — not a certification.
**Workstream:** WORKSTREAM A — V1 + Paper Tranche 1.
**Target branch:** `work/immortal-green-closure`.
**Purpose:** establish an auditable link from each proposed paper claim to its normative source, argument/proof, implementation locus, tests, deployment evidence, and explicit limits.

## 1. Publication rule

This matrix is an editorial and evidence-control artifact. It does not create protocol semantics, change an economic rule, or upgrade the status of any implementation. A claim may be published only at the strength supported by its evidence class.

Use these evidence classes distinctly:

- **MATHEMATICAL PROOF:** theorem established in the mathematical corpus under its stated assumptions.
- **NORMATIVE CLOSURE:** requirement or rule is specified; this does not prove code conformance.
- **MECHANICAL / TEST EVIDENCE:** a named, bounded check passed for the exercised cases.
- **PREPROD OBSERVATION:** a specific live observation was collected from Cardano Preprod.
- **LEDGER EXECUTION WITNESS:** exact submitted transaction, consumed UTxOs, epoch protocol parameters, timing context and native ledger evaluation are bound together.
- **OPEN / NOT PROVEN:** the required artifact or deployment-specific evidence is absent.

Never infer a stronger class from a weaker one. In particular, a mathematical proof is not implementation verification; a passing test is not universal conformance; a live UTxO observation is not proof that a production Reveal transaction was accepted by the native ledger evaluator.

## 2. Claim-to-evidence matrix

| ID | Proposed paper claim | Normative / specification source | Proof or argument | Implementation locus | Test / mechanical evidence | Deployment evidence | Allowed wording and boundary | Status |
|---|---|---|---|---|---|---|---|---|
| C1 | IMMORTAL defines a formal safety model with stated assumptions and an implementable safety gate. | `docs/00-normative/` canonical specification set; `docs/03-audit/VERIFICATION_STATUS.md` | The verification status records 20 mathematical results, including T-CHAR, T-EROSION, T-CERT/T-MARGIN and T-OMEGA-ADMIT, with assumptions and limits. | The mathematical result does not itself identify a conforming concrete implementation. Map concrete code only when the refinement audit establishes it. | The verification corpus supports theorem-level claims; it is not evidence that the deployed code conforms. | A concrete profile certificate and deployment evidence remain separate obligations. | “IMMORTAL specifies a mathematical safety model and proves stated results under explicit assumptions.” Do not say “the implementation is formally verified.” | **MATHEMATICAL MODEL CLOSED; implementation conformance UNPROVEN** |
| C2 | Safety does not imply progress or liveness. | `docs/03-audit/VERIFICATION_STATUS.md`; `docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md` R4 | T-NOLIVE and T-STALL-ATTRIB are recorded as proven; liveness requires environment and actor evidence. | No general deployed actor/environment behavior is established by these theorems. | Mathematical result and failure taxonomy; do not present as empirical liveness test. | No environment/actor substrate evidence sufficient to claim liveness is recorded in the cited register. | “The safety model does not guarantee progress; liveness is not claimed.” | **THEORETICAL RESULT; deployment liveness OPEN** |
| C3 | Economic accounting is protection/liability-first, with explicit protected capital and surplus treatment. | `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md`; `docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md`; application rules in `PRE-RICH/docs/GAME-ECONOMY.md` | Normative accounting rules and the two-sided assets/liabilities decomposition are specified. `RESIDUAL_OBLIGATION_REGISTER.md` R7 explicitly warns that exhaustiveness of a profile's economics needs profile evidence. | Kernel and application implementation must be mapped to exact symbols/files in the implementation-conformance pass; do not infer from the specification alone. | Use only named tests and artifacts actually present in the checked commit. The current paper map does not treat a general test suite as proof of an exhaustive economic partition. | Profile-specific treasury, pool and valuation evidence remains distinct from normative accounting. | “The specification defines liability/protection-first accounting.” Any implementation claim must be scoped to the exact tested transitions and inputs. | **NORMATIVE BASELINE CLOSED; profile/refinement evidence PARTIAL** |
| C4 | PRE-RICH's exercised transition boundary preserves canonical IMMORTAL semantics for the tested Issue/Reveal/Claim/Expire cases. | `docs/02-certification/IMMORTAL-PREPROD-CONFORMANCE-DOSSIER.md`; canonical economic specifications | Differential evidence is reported for Issue, Reveal, Claim and Expire, including protected-capital deltas and fail-closed mismatch cases. | PRE-RICH Reveal boundary and associated integration/evidence workflow; exact loci must be bound to the artifact's source snapshot before publication. | The dossier reports Reveal boundary **4/4 passed** in the cited successful workflow, run `36221378619` / run `44`, head `ae4fcc020dff326e8a3ea75c0e07e380a5451bc6`. Treat this as historical evidence for that exact snapshot, not proof of current HEAD. | Live Demeter/Ogmios v7 context, wallet UTxO observation and source-bound packet were reported for that run. | “For the exercised cases and cited snapshot, the boundary checks passed.” Do not generalize to every possible execution or silently re-label historical evidence as current-commit evidence. | **BOUNDED TEST + PREPROD OBSERVATION** |
| C5 | End-to-end Cardano ledger equivalence has been demonstrated for the production Reveal path. | `docs/02-certification/END-TO-END-EVIDENCE-DOSSIER.md`; `docs/02-certification/IMMORTAL-PREPROD-CONFORMANCE-DOSSIER.md` | The dossier explicitly says end-to-end equivalence remains gated by a real submitted Preprod transaction witness. | `.github/workflows/immortal-preprod-ledger-evidence.yml` is described as the non-signing consumer of a real transaction hash. Any candidate witness must be inspected to confirm it is the intended production path, not a generated test-policy transaction. | Yaci/local traces and boundary tests do not substitute for native ledger evaluation of the intended production transaction. | Required witness: exact submitted transaction hash/CBOR, consumed UTxOs, exact epoch protocol parameters, era/epoch timing, SystemStart and native `cardano-ledger` evaluation. | Do not claim full end-to-end ledger equivalence until the witness is captured, classified and bound to the exact source/transaction context. | **OPEN — REAL PRODUCTION-PATH WITNESS REQUIRED** |
| C6 | The first Beacon model removes all publisher trust. | `docs/WHITEPAPER.md`; Beacon specifications and closure matrix | The white paper explicitly describes B1 as an Authorized Publisher model and B3 as the target publisher-independent canonical Beacon. | B1 is the current model described by the paper; B3 proof-of-concept or architecture is not equivalent to deployed canonicality. | Cite only concrete tests for the exact Beacon version and commit. | The cited paper says B3 is target/in progress; deployment and canonicality are not established by the white paper. | State the B1 trust assumption plainly. Describe B3 as a target unless deployment evidence proves otherwise. | **B1 TRUST ASSUMPTION EXPLICIT; B3 TARGET / NOT CLAIMED AS ACHIEVED** |
| C7 | The protocol has completed independent security audit and is mainnet-ready. | `docs/WHITEPAPER.md` status table | No proof follows from the project orientation document. The white paper says external independent security audit is not completed and mainnet is not ready. | Repository implementation status is not a substitute for independent audit. | Existing internal tests and red-team activity must not be described as an independent external audit. | Mainnet readiness is explicitly not claimed. | This claim is **not publishable**. Say “research/active development; not mainnet-ready; independent external security audit not completed.” | **NOT SUPPORTED; CONTRADICTED BY CURRENT STATUS DOCUMENT** |
| C8 | The formal theory settles every deployment-specific profile obligation. | `docs/03-audit/VERIFICATION_STATUS.md`; `docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md` R1–R9 | The register distinguishes mathematical discharge from concrete profile, adapter, governance, environment, valuation and implementation evidence. | A concrete deployment must supply its own profile and refinement evidence. | No documentation-only action can discharge missing runtime or implementation evidence. | Profile instantiation, decision procedure for `χ`, `Env`, valuation oracle and other concrete artifacts are separately required. | Explain the boundary between universal theory and deployment-specific evidence; do not say all residual obligations are closed. | **PARTIAL; DEPLOYMENT-SPECIFIC OBLIGATIONS OPEN** |

## 3. Evidence packet checklist (P3)

Before freezing a paper release, bind the following to a single immutable evidence packet:

- [ ] Exact branch and commit SHA used for the paper snapshot.
- [ ] Exact versions / hashes of normative documents and implementation files cited.
- [ ] Reproduction commands and tool/runtime versions for every reported mechanical result.
- [ ] Test names, exact outcomes, logs and artifact hashes; no inferred or reconstructed results.
- [ ] For live Preprod claims: network, observation time/slot, source endpoint/context, transaction hash and relevant UTxO references.
- [ ] For ledger-evaluation claims: exact CBOR, consumed UTxOs, epoch-specific protocol parameters, era/epoch timing, SystemStart, evaluator version and complete result.
- [ ] A clear label for each artifact: proof, specification, test, observation, simulation, or ledger execution.
- [ ] Explicit negative results and unresolved obligations, not only successful runs.

A packet is not complete merely because files exist. Each artifact must be bound to the same source snapshot and the claim it supports.

## 4. Threat-model inputs for P4

The paper must state, at minimum, what is trusted and what is not:

1. **Normative authority:** canonical specifications govern; explanatory documents and implementation notes cannot silently change them.
2. **Frontend/backend/relayer:** may observe, transport or construct data; they are not economic authority merely because they provide it.
3. **Beacon:** B1 has an Authorized Publisher trust assumption; B3 is not to be described as achieved without deployment evidence.
4. **Valuation/oracle and environment perimeter:** the safety theorem is relative to its supplied valuation and declared environment; it does not prove that external observations are complete or truthful.
5. **Adapter and ledger:** test/emulator success is not the same as exact native-ledger evaluation of a submitted production-path transaction.
6. **Liveness:** safety does not guarantee progress; availability failures and actor/substrate behavior remain deployment concerns.
7. **Governance and composition:** theorem-level conditions do not prove that a concrete governance act occurred or that two deployed systems compose safely.
8. **Audit readiness:** internal evidence is not an independent external security audit.

This is a required coverage list, not a claim that every threat has been fully mitigated.

## 5. Related-work plan (P5)

**Initial bibliography and comparative table added; systematic comparison remains OPEN.** The manuscript now contains an initial positioning table across Cardano ledger formalization, smart-contract verification, randomness beacons, EUTXO documentation, assurance-case literature and viability theory. This is a bounded first pass, not a systematic review or a novelty proof. The following sources have been checked against publisher, institutional or official documentation pages:

- Knispel et al. (2024), *Formal Specification of the Cardano Blockchain Ledger, Mechanized in Agda*, FMBC/OASIcs. DOI: https://doi.org/10.4230/OASIcs.FMBC.2024.2. Comparator for a mechanized ledger specification and production-conformance objective.
- Ferariu, Wadler and Melkonian (2025), *Validity, Liquidity, and Fidelity: Formal Verification for Smart Contracts in Cardano*, FMBC/OASIcs. DOI: https://doi.org/10.4230/OASIcs.FMBC.2025.6. Comparator for transition-system properties, functional equivalence to validator implementation, and emulator/property-based testing.
- Lee et al. (2025), *Commit-Reveal²: Securing Randomness Beacons with Randomized Reveal Order in Smart Contracts*, arXiv:2504.03936; conference DOI: https://doi.org/10.1109/ICBC64466.2025.11114691. Comparator for last-revealer risk, reveal ordering, accountability and recovery; not evidence that IMMORTAL solves randomness bias.
- Cardano official documentation, *Plutus — Accounting model used by Plutus* and *The Extended UTXO Model*: https://docs.cardano.org/developer-resources/smart-contracts/plutus and https://developers.cardano.org/docs/get-started/technical-concepts/eutxo/. Primary background on EUTXO transaction/value semantics.
- “Security assurance cases—state of the art of an emerging approach,” *Empirical Software Engineering* (2021), https://doi.org/10.1007/s10664-021-09971-7. Background on assurance cases as structured arguments with evidence in a defined application/environment.
- Aubin, J.-P. (1990), “A Survey of Viability Theory,” *SIAM Journal on Control and Optimization*, 28(4), 749–788, https://doi.org/10.1137/0328044. Background on viability kernels and controlled invariance; not a direct comparator for Cardano or IMMORTAL implementation evidence.

Remaining research areas:
- systematic full-text review of safety-case argumentation and evidence assurance;
- solvency/liability accounting in on-chain financial applications;
- valuation oracle trust and conservative valuation;
- viability-kernel computation, safety games and certificate-based gates;
- proof-carrying evidence and deployment evidence pipelines.

For each source, record: bibliographic metadata, exact property/mechanism, assumptions, proof/evaluation method, implementation relation, runtime evidence and what IMMORTAL does or does not add. The manuscript now contains an initial comparative table, but novelty is not established until full-text review and a systematic comparison are complete.

## 6. Paper Tranche 1 exit gate

Tranche 1 is ready for editorial freeze only when:

- [ ] The scientific claim is narrowed to the proved/specification-level contribution and its assumptions.
- [ ] Every headline claim maps to this matrix and to a source artifact.
- [ ] Current-commit evidence is distinguished from historical run evidence.
- [ ] The P3 reproducibility packet is complete for every empirical claim.
- [ ] The P4 threat model covers the trust boundaries and non-claims above.
- [ ] P5 related work is cited and supports the novelty framing.
- [ ] Limitations include implementation conformance, profile/adapter evidence, liveness, Beacon status, external audit and mainnet readiness.
- [ ] The frozen draft and packet are identified by exact hashes.

**Scope guard:** this paper tranche does not require closing B3/B4, proving the entire implementation, or changing any V3/Reveal semantics. It must report unresolved obligations honestly rather than convert them into paper-only closure.

## 7. Primary source links

- [Verification Status](../03-audit/VERIFICATION_STATUS.md)
- [Residual Obligation Register](../03-audit/RESIDUAL_OBLIGATION_REGISTER.md)
- [Constitution Gap Matrix](../03-audit/CONSTITUTION-GAP-MATRIX.md)
- [PRE-RICH White Paper](../WHITEPAPER.md)
- [Preprod Conformance Dossier](../02-certification/IMMORTAL-PREPROD-CONFORMANCE-DOSSIER.md)
- [End-to-End Evidence Dossier](../02-certification/END-TO-END-EVIDENCE-DOSSIER.md)
- [Notion — 03 Open Decisions & Roadmap](https://app.notion.com/p/3d9c4454d6d581738bf2c461a8694a2e)
- [Notion — IMMORTAL Multi-Front Workflow](https://app.notion.com/p/3e2c4454d6d5813f939aed777ba175b0)
- [Notion — Active System Workflow & Closure Gate](https://app.notion.com/p/3dbc4454d6d58110875bcdabb1bfefbf)


## 8. Concrete implementation and test loci (branch snapshot)

These paths were fetched from `work/immortal-green-closure` while preparing this matrix. Their presence is a source map, not a declaration that all implementation-conformance obligations are discharged.

| Concern | Concrete locus | What it can support | Limit |
|---|---|---|---|
| Economic kernel | `IMMORTAL/kernel/EconomicKernel.hs` | Code locus for class exposure, worst-case exposure, effective pool, protected capital, raw surplus, saleability, solvency and conservation invariants. | Source inspection alone is not a proof that every deployed adapter supplies correct inputs. |
| V3 transition semantics | `IMMORTAL/kernel/EconomicTransitionV3.hs` | Code locus for Issue, Reveal, Claim and Expire transitions. | Must be paired with tests and refinement evidence; do not modify semantics as part of paper work. |
| V3 refinement boundary | `IMMORTAL/conformance/RefinementV3.hs` | Defines the concrete-to-V3 projection and refinement checks; comments explicitly state concrete/Cardano code must establish fields from actual datum state. | A projection contract is not itself evidence that every datum field was correctly observed. |
| Projection boundary test | `plutus/test/ProjectionBoundaryConformanceTest.hs` | Executable V3-to-Universal projection boundary checks, including protected-capital and transition assertions. | Bounded test cases only; not native-ledger execution evidence. |
| Differential action replay | `src/__tests__/differentialActionReplay.test.ts` | Exercises refinement-admissibility evidence for Issue, Reveal, Claim and Expire. | Fixture/replay evidence must not be described as an on-chain transaction witness. |
| Adapter conformance suite | `src/__tests__/immortal-cardano-adapter-conformance.test.ts` | Tests canonical class mappings, field provenance, permutation invariance, mutation rejection and action-boundary fixtures. | The suite's own header says it does not replace live Cardano/emulator execution. |
| Native ledger evidence dossier | `docs/02-certification/P2.8-LEDGER-EVALUATION-DOSSIER.md` | Defines required exact validator artifacts, transaction CBOR, consumed UTxOs, era-specific protocol parameters, timing context and SHA-256 manifest. | Its status says native evaluator result remains pending a fresh successful build/evaluation run. |
| Production-path witness workflow | `.github/workflows/immortal-preprod-ledger-evidence.yml` | Intended evidence collection path once a qualifying submitted production Reveal transaction is available. | The workflow's existence is not evidence that a qualifying transaction has already been evaluated. |

### Snapshot and CI discipline

- The branch's current file contents are the source references for this matrix; a paper freeze must record the exact commit SHA that contains both this matrix and the cited implementation/test files.
- A GitHub search index result may refer to the default branch or an older indexed commit. It must not override files fetched from the target branch.
- The create/update commit for this matrix was `17153fc5fbf27e92dfe6aa6626f48257fdfde04e`; the file's blob was re-fetched successfully after creation.
- The connector returned no combined status checks for that documentation-only commit. This means no checks were reported by that status endpoint, not that CI passed.
