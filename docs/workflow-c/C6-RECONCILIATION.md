# C6 — Reference Profile and Action-Space Adequacy

**Status: NOT CERTIFIED.** This is the current reconciliation finding, not a normative amendment.

## Question C6 must answer

Can a single chain-independent IMMORTAL reference profile define an admissible state space, a complete authorized action space and a transition relation that permits an independently checked, non-empty viability certificate—without narrowing the actual authorized behavior or inventing new economic rules?

The profile must separate:
1. the universal economic model;
2. the authorized action/transition semantics;
3. adapter-specific encoding and settlement;
4. observation/provenance and proof verification;
5. the certificate claim and its assumptions.

An adapter's successful settlement or an evidence packet's structural validity cannot substitute for the model-level proof.

## Cross-branch reconciliation (review snapshot 2026-10-18)

- **work/immortal-green-closure:** has the C6-related certification/audit material and PRE-RICH lifecycle helper, but the examined V3 action graph is restricted to Issue/Reveal/Claim/Expire. The V3 viability audit explicitly does not establish a universal IMMORTAL theorem.
- **b1-hardening:** contains the universal state/accounting kernel, but the examined kernel does not define a complete universal action/transition relation or discharge a concrete Kc witness.
- **release/issue-admission-boundary-squash** and **merge/workflow-b-closed-main:** improve the PRE-RICH issue-admission boundary; they do not supply a universal Kc witness.
- **main / release/public-main-curated-2026-09-24:** do not provide an alternate complete universal action algebra that closes C6.
- **work/b3-materios-provenance-evidence:** is the primary source for provenance, evidence integrity, proof boundaries and independent verification patterns. It is not itself the economic viability semantics and does not close Kc non-vacuity.

This is a targeted source review, not a claim that every file on every branch has been exhaustively formally verified.

## Findings that must remain distinct

### Universal kernel and state

`IMMORTAL/kernel/UniversalEconomicKernel.hs` supplies accounting/safety-oriented functions such as protected capital, raw surplus, non-negative state and a solvency invariant. `IMMORTAL/state/UniversalEconomicState.hs` supplies a chain-neutral state aggregate. Those artifacts are useful foundations but do not, by themselves, define an action relation.

### PRE-RICH lifecycle helper

`PRE-RICH/onchain/PreRichLifecycleTransition.hs` includes `EnterQuiescent` and `MaintainQuiescent` in a PRE-RICH lifecycle regime. It is not automatically a universal IMMORTAL action. Its QNE checks depend on supplied Ω witnesses; the caller must establish that those witnesses soundly over-approximate the authoritative Ω. Do not promote it to universal semantics without an authorized derivation.

### Restricted V3 graph

The 2026-10-05 V3 viability audit considered the restricted V3 action set Issue/Reveal/Claim/Expire. Under its stated finite-capacity assumptions, that restricted graph may be well-founded and have empty K*. This is not a theorem that universal IMMORTAL K* is empty, nor a basis for inventing an action to make it non-empty.

### B3 provenance work

The B3 workstream describes derivation contracts, evidence provenance, proof packet boundaries and fail-closed behavior when a cryptographic verifier is absent. This informs C4/C7/C9/C10 and the evidence trust boundary for C6. Structural checks or captured RPC responses do not establish verified proof.

## C6 sub-gates

- **C6-A — profile architecture:** document canonical state, authorized action interface, transition relation interface, assumptions, costs and adapter separation. Every field must point to an existing source or be explicitly marked unresolved.
- **C6-B — substantive semantics:** identify an already-authorized transition relation that admits a concrete inductive/non-vacuous witness. If the current normative corpus does not define such a relation, stop for an architecture decision. Do not synthesize an action, threshold, coefficient, or rule.
- **C6-C — evidence binding:** bind the profile and certificate to immutable source/version identifiers, canonical inputs, evidence digests and a checker result. The checker must derive the result rather than trust asserted booleans.

## C6 exit evidence

C6 can be marked CLOSED only when:
- profile and action domain are complete for the declared perimeter;
- the transition relation is grounded in authorized normative semantics;
- action-space adequacy and non-vacuity are independently justified;
- S0 is admissible, χ(S0)=1, VC2/VC3 are discharged, and S0 ∈ Kc ⊆ K* under T-NV-CHAIN;
- Ω and E are complete and authority-fixed;
- the independent checker and reproducible evidence packet pass.

Until then, status remains NOT CERTIFIED.
