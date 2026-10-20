# Paper Tranche 1 × B3 Materios Provenance — Comparative Assessment

**Date:** 2026-10-20  
**Status:** editorial/architecture assessment; no protocol semantics changed  
**Paper branch examined:** `work/immortal-green-closure` at `6348087ba6065ea42837c07d5c006fae5bb4fed8`  
**B3 branch examined:** `work/b3-materios-provenance-evidence` at `ea79c09217ab7279d7faf483a7c1b08f98f3e7e5`  
**Common base:** `cee626de7ec9c3c2543e2431f7c28f732e065d9d`

## 1. Decision in brief

**Do not merge the two work branches at this stage. Converge their scientific framing and evidence references, while keeping their operational histories separate.**

Paper Tranche 1 already has a coherent, bounded thesis: liability-first UTxO ticket accounting, explicit trust boundaries, and a traceable path from mathematical/normative claims to implementation and deployment evidence. B3 adds potentially important material about authority/provenance, generalized derivation, profile composition, and adversarial conformance. It does not yet provide sufficient evidence to promote all those architectural contracts into established universal implementation results.

The best near-term outcome is:
1. preserve Tranche 1 as the first, deliberately narrow paper;
2. use only selected B3 material to sharpen its trust-boundary discussion and future-work boundary;
3. treat generalized derivation, profile composition, and cross-adapter generality as a candidate second paper/research contribution;
4. only consider a Git merge when a concrete dependency requires it, or after a deliberate integration plan and test review.

This is an editorial and branch-management recommendation, not a claim that the two branches are technically incompatible.

## 2. Comparison method and Git facts

The branch comparison uses GitHub's compare operation against the common base. At the reviewed heads:
- Paper branch: 539 commits ahead of the common base, 0 behind; 111 changed paths.
- B3 branch: 410 commits ahead of the common base, 0 behind; 127 changed paths.
- Six changed paths overlap; three have identical blob content at the two heads and three differ.
- The differing overlapping paths are:
  - `audit/algorithmic-governability/contributor-credential-transferability-independence-boundary.mjs`;
  - `plutus/pre-rich-plutus.cabal`;
  - `poc/materios-checkpoint/src/rpc.ts`.

These numbers are scoped to the two compared refs and their merge base. They do not measure semantic conflict risk, guarantee that a merge would compile, or imply that either branch's entire commit history should be imported into the other. The three divergent files need a line-by-line review and relevant tests before any integration.

The operational split is also recorded in Notion, “03 — Open Decisions & Roadmap”: Workstream A is V1 + Paper Tranche 1; Workstream B is B3/B4 and generalization/research. The roadmap says closed, verified, evidence-associated results are promoted, and specifically prohibits reopening V3/Reveal/economic semantics merely to facilitate B3.

## 3. Claim-by-claim relationship

| Tranche 1 claim / theme | Relevant B3 material | Relationship | Recommended editorial treatment |
|---|---|---|---|
| C1 — Mathematical safety model and implementable gate | Adversarial Review Traceability B3; Generalized Derivation Contract | B3 improves the articulation of the limits: a greatest fixed point does not by itself establish non-emptiness, computability, or deployment conformance. The derivation contract is non-normative and OPEN. | Keep C1's mathematical claim bounded. Add a concise caveat on non-vacuity only if it is consistent with the normative verification corpus. Do not present the generalized derivation contract as a theorem or completed implementation. |
| C2 — Safety does not imply liveness | B3 adversarial review; permissionless liveness and R4 research boundaries | Complementary. B3 makes the environment/event-envelope completeness problem more concrete, but does not close deployed liveness. | Retain the current non-claim. Cite B3 as open follow-up only; do not upgrade to an empirical liveness result. |
| C3 — Liability/protection-first accounting | ProtectedCapital Projection Review B3; EXP-01 typed obligation buckets; EXP-08 netting/offset; EXP-09 transfer/novation | B3 gives a more detailed profile-to-universal-state projection analysis and highlights exhaustiveness, disjointness, and double-counting risks. It explicitly leaves universal C17 conformance and source authenticity open. | Useful as a bounded case-study detail if source/test identities are pinned to the manuscript snapshot. Do not claim every profile or deployment has an exhaustive partition. Avoid conflating unresolved reserve with worst-case exposure. |
| C4 — Bounded transition/refinement evidence | AG-01 Executable Conformance Matrix; multi-function derivation conformance | Related method, not automatic new evidence for PRE-RICH Issue/Reveal/Claim/Expire. AG-01's matrix says independent replay and complete provenance replay remain open. | Do not merge the B3 test count into C4. Add only explicitly identified test results with exact commit/run/source binding. |
| C5 — Native ledger execution witness | B3 public evidence route; B3-A/B/C witness contracts; Materios proof reports | B3's Materios storage-read proof is a different evidence domain from Cardano Reveal ledger evaluation. It cannot substitute for the native Cardano witness. B3-A finality/authority transition remains open in the cited route. | Keep the Reveal witness OPEN. Explain that storage proof, finality proof, and Cardano script execution witness are different evidence types. No substitution or cross-promotion. |
| C6 — Trust and provenance boundaries | B3-A authority transition; B3-B storage proof; public RPC capability results; drand candidate route | Strong conceptual complement. The B3 route carefully distinguishes a storage proof against a captured state root from authenticity of the root, GRANDPA finality, authority-set transitions, and independent canonicality. | This is the strongest B3 contribution to Tranche 1's discussion of evidence strength. Include a short taxonomy/example, while labelling B3-A as OPEN and the drand route as candidate/not approved. |
| C7 — Reproducibility and evidence packet | B3 workflow runs/artifacts and witness-packet boundaries | Same evidence-discipline philosophy, but separate chains, artifacts, environments, and claims. A workflow artifact is only as strong as the property it actually tests. | Reuse the evidence taxonomy, not the artifacts as evidence for the Cardano case. Preserve exact run IDs, commit IDs, retention, and limitations independently. |
| C8 — Scope/non-claims and portability | Generalized Derivation Contract; EXP-04 profile composition; Midnight/Moriarty research | B3 contains a credible research programme for generalization, but the contract itself says OPEN RESEARCH / PROTOTYPE-READY; EXP-04 says composition semantics OPEN. A second adapter and cross-runtime semantic equivalence are not established merely by having boundaries/specs. | Keep portability phrased as design intent or research question. Do not call IMMORTAL empirically chain-agnostic until a materially different application and adapter pass shared conformance vectors with independent evidence. |

## 4. B3 findings that could materially improve the current paper

### 4.1 Evidence classes must not be conflated

The B3 public-evidence route makes an important concrete distinction:
- a storage-read proof can verify a value relative to a captured state root;
- that alone does not authenticate the root/checkpoint;
- a receipt or event stream does not alone prove canonicality;
- absence of a GRANDPA proof from tested public RPC endpoints does not prove that the consensus system lacks finality;
- the drand off-chain PoC verifies a candidate beacon under its configured scheme, but does not prove Materios finality, Cardano on-chain feasibility, or production ticket binding.

This taxonomy directly reinforces Tranche 1's publication rule: evidence must be described at the exact strength of the property it verifies. A concise example can be added to the paper's trust/evidence discussion, provided it is clearly marked as a separate B3 research case and not as evidence for PRE-RICH's Cardano Reveal.

### 4.2 ProtectedCapital projection is useful, but profile-specific

The B3 projection review records the following PRE-RICH mapping:
- crystallized liabilities are projected directly;
- worst-case exposure is derived using the profile's payout bound and unresolved ticket state;
- unresolved reserve is tracked as a separate accounting aggregate and is not automatically added again to ProtectedCapital;
- safety capital, reserve protection, mandatory future costs, and locked Jackpot amount are separately represented;
- EEV remains an external qualified input, not something the projection itself authenticates.

This helps explain why a named accounting aggregate must not be mechanically summed twice. But the same document says the projection does not prove universal profile completeness or authenticate the source state/EEV. It should support a scoped implementation example, not a universal solvency claim.

### 4.3 Generalized derivation is a candidate framework, not a closed result

The contract's boundary (B=(D,R,I,L,E,V,C,X)) usefully groups domain, rule, inputs, limits, evidence, version, contestability and exit behavior. The Explore → Certify → Adopt separation also prevents candidate generation from silently becoming authority.

However, the document explicitly labels itself non-normative and OPEN RESEARCH / PROTOTYPE-READY. Its closure test requires multiple function families to share deterministic, version-bound, evidence-bound, fail-closed machinery and tests showing that candidates cannot mutate the rule-space that authorizes them. Until that is demonstrated, this should be framed as a proposed architectural contract rather than an established universal mechanism.

### 4.4 Profile composition is a research boundary, not a feature to implement prematurely

EXP-04 explicitly leaves open namespace sharing, the scope of composition, conflict resolution, shared protected capital/ring-fencing, and version compatibility. It says no production profile composition type should be introduced before those semantics are decided.

This is a valuable limitation to state in a future generalization paper. It is not a reason to broaden Tranche 1 or alter PRE-RICH's existing profile semantics.

## 5. Candidate paper architecture

### Paper 1 — keep the current thesis
**Evidence-Bounded Economic Safety for UTxO Ticket Systems**

Scope:
1. liability-first accounting and protected capital;
2. mathematical safety results under their explicit assumptions;
3. PRE-RICH/Cardano as a bounded case study;
4. claim-to-evidence traceability and reproducibility;
5. trust/evidence classes, with one short B3 provenance example only if it helps explain the method;
6. limitations: native Reveal witness open, profile exhaustiveness/conformance partial, B3-A finality open, no independent audit or universal portability claim.

The manuscript should not become a general survey of Materios, randomness, governance, contributor credentials, Midnight, or Moriarty. Those topics would dilute the central question.

### Paper 2 — candidate, not yet declared ready
**Authority-Bounded Derivation and Evidence Provenance for Chain-Neutral Economic Protocols** (working title)

Potential research questions:
- How can candidate generation, evidence-based certification and authorized adoption be separated without creating algorithmic sovereignty?
- What conformance conditions are required to preserve the same semantic result across application profiles and chain adapters?
- How should provenance evidence distinguish observation, state proof, finality, authority transition, and application-level execution?
- What negative vectors can detect authority escalation, incomplete obligations, ambiguous profile composition, and cross-runtime semantic drift?

Candidate source material:
- Generalized Derivation Contract;
- EXP-04 Composition of Profiles Boundary;
- AG-01 Executable Conformance Matrix;
- adversarial review traceability;
- B3-A/B/C witness contracts and the public-evidence route;
- relevant adapter research, including Midnight/Moriarty, only where concrete evidence exists.

Minimum gates before claiming this as a results paper:
1. freeze definitions and source-of-truth links;
2. execute and archive the named conformance vectors;
3. distinguish synthetic fixtures from live and cryptographic evidence;
4. show at least one materially different application and one materially different adapter sharing the same semantic vectors, or explicitly narrow the claim if not available;
5. record independent replay/review evidence where claimed;
6. perform systematic related-work review before asserting novelty;
7. report unresolved Materios finality and randomness integration honestly.

## 6. Git integration decision

**Decision: no merge now.**

Reasons:
1. The roadmap explicitly defines A and B as separate workstreams.
2. The two heads contain large divergent commit sets, so merging would combine much more than paper-related documents.
3. There are three overlapping paths whose blobs differ; at least one is Plutus build configuration and another is Materios RPC code. They require technical reconciliation and tests.
4. B3 contains OPEN research contracts and live evidence with sharply bounded claims; importing the whole branch would not make those items closed.
5. The paper can cite and learn from B3 without inheriting its branch history.

### Conditions for revisiting a merge

Reconsider integration only when at least one condition is met:
- a specific B3 artifact is a required dependency of a paper claim and should be included in the frozen paper snapshot;
- a B3 code change is needed by A and has been independently tested;
- both workstreams reach an explicit consolidation milestone.

Before that:
1. keep the current branch split;
2. maintain a small claim-to-B3 cross-reference;
3. cherry-pick only a self-contained, reviewed commit when necessary, not broad ranges;
4. never change V3, Reveal or economic semantics merely to make the histories merge cleanly;
5. run the relevant tests on the target branch and record commit-bound evidence;
6. update the release manifest only after the exact publication snapshot is frozen.

## 7. Confidence and limitations of this assessment

This assessment is based on the reviewed branch heads, the Tranche 1 manuscript/release audit/traceability matrix, and selected B3 research and evidence documents. It is not a complete semantic review of all 127 B3 changed paths or all 1054 files in that tree. It does not establish that a merge will or will not have textual conflicts, nor does it replace code review of the three differing overlapping paths.

The comparison does not certify the correctness of the mathematical model, the production implementation, Materios finality, drand integration, or cross-adapter generality. Those claims remain bounded by the source documents and their stated open gates.

## 8. Primary repository sources

- [Tranche 1 manuscript](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/papers/IMMORTAL_EVIDENCE_BOUNDED_ECONOMIC_SAFETY_DRAFT.md)
- [Tranche 1 traceability matrix](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/papers/PAPER_TRANCHE_1_TRACEABILITY.md)
- [Tranche 1 release audit](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/papers/PAPER_TRANCHE_1_RELEASE_AUDIT.md)
- [Generalized Derivation Contract v1](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md)
- [EXP-04 Composition of Profiles Boundary v1](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/EXP-04-COMPOSITION-OF-PROFILES-BOUNDARY-v1.md)
- [Adversarial Review Traceability Matrix B3](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/ADVERSARIAL-REVIEW-TRACEABILITY-B3-v1.md)
- [AG-01 Executable Conformance Matrix v1](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/AG-01-EXECUTABLE-CONFORMANCE-MATRIX-v1.md)
- [ProtectedCapital Projection Review B3](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/PROTECTED-CAPITAL-PROJECTION-REVIEW-B3-v1.md)
- [B3 Public Evidence and Randomness Route](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/04-verification/B3-PUBLIC-EVIDENCE-AND-RANDOMNESS-ROUTE-2026-10-20.md)
- [Notion: 03 — Open Decisions & Roadmap](https://app.notion.com/p/3d9c4454d6d581738bf2c461a8694a2e)
