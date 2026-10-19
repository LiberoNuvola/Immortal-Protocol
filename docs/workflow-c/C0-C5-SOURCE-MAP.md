# Workflow C — Technical Source Map and Reconciliation

**Status:** RECONCILIATION IN PROGRESS; not a certification result.  
**Target branch:** `release/public-main-curated-2026-09-24`  
**Source baseline reviewed:** commit `a8e11a34d92af169164bfedf8e4e3c710f817841`.

This is a **technical source map**, not the authoritative numbered Workflow C front list. Its former subsection numbers C0–C5 were local work-package labels and did not match the canonical Notion C0–C5 scope. Use `NOTION-CANONICAL-FRONT-CROSSWALK.md` for the normative workfront numbering and do not infer that a local technical-map item closes the correspondingly numbered Notion front.


## Source hierarchy

The controlling order remains:
1. `docs/00-normative/01_CONSTITUTION_FINAL.md` — root authority, mandatory safety predicates, Ω perimeter, non-vacuity, atomicity, determinism, and anti-circularity.
2. `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` — canonical symbols 𝒮, A(S), Accept, Ω, T, Safe, K*, Kc and accounting boundaries.
3. `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md` — fixed-point semantics, T4/K-under, CK1–CK8, T-EROSION, transition safety.
4. Relevant normative contracts and certification specifications, including `docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md`, R1, R2, R3, R4 and R8.
5. Architecture and adapter specifications.
6. PRE-RICH constitution/application/game rules only when reasoning about the PRE-RICH profile, not as universal IMMORTAL authority.
7. Implementation, tests and evidence as conformance material; they do not grant normative authority.

If a lower-level artifact conflicts with a higher-level source, record the conflict; do not silently resolve it by editing code or the higher-level rule.

## Technical map 0 — Scope and authority

**Existing source:** Constitution §§1–2, 5a, 6–8, 10–15; Universal Economic Model §§6–7.  
**Established:** IMMORTAL is chain- and application-neutral; no infrastructure actor gains discretionary economic authority; a deployment declares its concrete Kc and perimeter E; safety, viability and liveness are distinct; implementation conformance cannot prove the abstract model.  
**Still required:** exact versioned reference-profile identifier, intended perimeter, explicit exclusions and the claim boundary. This workflow certifies neither a Cardano deployment nor PRE-RICH merely by defining a model.

## Technical map 1 — Canonical state representation

**Existing source:** Universal Economic Model; `IMMORTAL/state/UniversalEconomicState.hs`; R2 Refinement Conformance Specification.  
**Established:** a canonical state S belongs to 𝒮; implementation correspondence must be total on reachable implementation states, functional up to canonical equality, deterministic and versioned. The current universal Haskell aggregate represents liabilities, reserve/ticket count, worst-case exposure, safety capital, reserve protection, mandatory future costs and additional protected capital.  
**Still required:** decide whether this aggregate is the complete state for the selected profile or only an economic projection. Record units, field ownership, history, EEV source, canonical encoding and all additional state needed to determine actions and successors. No assumption that the aggregate alone is complete.

## Technical map 2 — Predicate inventory

**Existing source:** Constitution §§3–7; Universal Economic Model; Economic Kernel CK1–CK8; R1 VC1–VC6; R7 PC1–PC7.  
**Established:** Safe, Accept, Ω, T, χ, Wit and Kc have distinct roles. Protected obligations must be exhaustively represented; unrepresented exposure blocks execution; RawSurplus is accounting, not authorization.  
**Still required:** a traceable inventory mapping each profile predicate to its authoritative source, inputs, domain, decision procedure, version and evidence obligation. A test or boolean field is not a proof of the predicate it names.

## Technical map 3 — Transition semantics

**Existing source:** Universal Economic Model §§1–2; Economic Kernel §§1, 4–6; R1 §2–3; R7 §4 permitted accounting deltas; R2 RF2–RF3.  
**Established:** the model requires A(S), Accept(S,a), Ω(S,a), and T(S,a,ω); T must be total for accepted inputs and Ω non-empty for accepted pairs. The abstract proof T4 establishes Kc ⊆ K* only after CK2/CK3 are shown.  
**Still required:** profile-specific action domain, preconditions, postconditions, transition costs, successor derivation and exhaustive action mapping. The accounting deltas in R7 constrain accounting movements; they do not by themselves define a complete action/transition relation. Do not infer a universal action from a PRE-RICH-specific helper.

## Technical map 4 — Evidence and provenance

**Existing source:** Constitution §§11, 15; R2; R3; B3 evidence-boundary work on `work/b3-materios-provenance-evidence`.  
**Established:** derivations must be deterministic, domain-separated, versioned, reproducible and independently verifiable; no circular evidence; Ω completeness cannot prove itself. Structural consistency, transport capture and cryptographic verification are different evidence classes.  
**Still required:** bind each profile input to source identity, observation/checkpoint, source version, derivation version, verifier identity/version, raw evidence digest and verification result. The B3 branch is an evidence-pattern source, not a branch to merge wholesale and not proof that Kc is non-empty.

## Technical map 5 — Reproducible execution/checking contract

**Existing source:** R1 §§2–6; R2 §5; R3 §5; Constitution §§8, 11, 15.  
**Established:** the certificate needs a deterministic χ, witness selector Wit, sound Ω bounds and proof artefacts; the implementation must separately conform to them. The packet must distinguish symbolic/model-level certification from implementation evidence.  
**Still required:** a runnable checker with pinned invocation, canonical inputs, exact source commit, raw output, exit status, hashes, assumptions and limitations. No current Workflow C result is upgraded to MODEL-CERTIFIED until the checker actually recomputes the claims.

## Consequence for C6–C10

- C6-A can define a reference-profile interface while marking unresolved semantics explicitly.
- C6-B/C8 remain blocked until an authorized concrete transition relation and a non-empty witness are established.
- C7 can now use the normative 13-element Ω list as its checklist; the profile must instantiate it and provide evidence, not merely repeat the list.
- C9/C10 can be designed as independent recomputation and reproducibility contracts, but are not complete until executable checker evidence exists.

## Review caveat

This is a targeted reconciliation of the named source files at the recorded baseline. It is not an exhaustive formal verification of the repository or every branch.
