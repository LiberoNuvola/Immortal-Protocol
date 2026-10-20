# Protocol Usage Fee G1 — Normative Decision Reconciliation B3 v1
**Date:** 2026-10-20  
**Target branch:** `work/b3-materios-provenance-evidence`  
**Status:** reconciliation complete; G1 remains OPEN  
**Scope:** reconcile current Notion fee workflow and matrices against canonical authority/transition requirements. Documentation only.

## Sources
Notion records inspected:
- `IMMORTAL — Economic Usage Fee & Adapter Settlement Workflow v0.1` (last edited 2026-10-11)
- `10 — Fee-Bearing Transition Matrix & Final Protocol/Adapter Separation Check v0.1` (2026-09-19)
- `01 — Fee Ownership Matrix — IMMORTAL vs Adapter v0.1` (2026-09-19)
- `IMMORTAL — Economic Canon & Parameter Boundary Register v0.1` (2026-10-07)
- `Economic Rule Classification Matrix — Immortal Protocol / Adapter / PRE-RICH` (2026-09-21)

Canonical branch sources:
- `docs/00-normative/01_CONSTITUTION_FINAL.md`
- `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md`
- `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md`
- `IMMORTAL/kernel/EconomicGate.hs`
- `IMMORTAL/kernel/EconomicTransitionV3.hs`
- `IMMORTAL/state/EconomicProfile.hs`
- `PRE-RICH/onchain/PreRichEconomicAdmission.hs`
- `src/preRichIssueAdmissionBridge.ts`
- `Adapter/CARDANO/runtime/EconomicAdmission.ts`

## 1. Already decided — do not reopen as G1 implementation questions
1. One Protocol Usage Fee category per transition; `ProtocolUsageFee != ChainExecutionCost`; `TotalCost = ProtocolUsageFee + ChainExecutionCost`.
2. IMMORTAL defines universal fee semantics; deployment/profile declares fee applicability; Adapter performs chain-specific settlement and reports chain cost/evidence. Adapter cannot choose applicability independently or add a second Protocol Usage Fee.
3. Candidate applicability is `FeeBearing(S,A,Profile) ∈ {true,false}`. The transition matrix is a candidate classification, not an instruction that every row is fee-bearing.
4. No fee amount, universal denomination, price source, conversion, rounding, affordability or settlement asset is selected by G1.
5. PRE-RICH ticket/game rules, PRE settlement assumptions, Treasury destination and reward policy are not universal IMMORTAL rules. The parent fee workflow explicitly keeps PRE-RICH out of scope for now.
6. Fees cannot bypass Safe, `K_c`, ProtectedCapital, liabilities, viability or atomicity. Fee receipts do not automatically become RawSurplus or reward budget.
7. Fee effects belong to the same canonical transition; no second fee state machine.

These are architectural decisions, not evidence that all are already enforced by production code.

## 2. Still undecided or unimplemented
The inspected records do not establish:
- which canonical usage classes are true/false in any concrete deployment/profile;
- the canonical class registry and mapping from class identity to the admitted action;
- exact immutable profile/deployment revision binding;
- a canonical predicate authenticating the declaring authority/source;
- deterministic treatment of stale, conflicting, superseded or revoked declarations;
- how a verified fee obligation enters the complete candidate post-state;
- end-to-end conformance proving every relevant admission path applies the same declaration.

The Notion workflow is OPEN and prohibits code during design/specification absent an explicitly opened implementation workflow. No class may be inferred fee-bearing from the matrix.

## 3. Project approval is not the runtime authority predicate
A project-level decision can approve a specification through the established process. That does not mean a founder, developer, operator, relayer, Adapter or frontend becomes a source of canonical economic truth merely by operating infrastructure.

Constitution §2 requires canonical truth to derive from defined verification predicates. A Git commit, Notion page, identifier, digest, signature-shaped field or operator assertion is not by itself the authority predicate unless the canonical verifier establishes what it proves. This reconciliation does not invent a signer, quorum, governance threshold, key-management model or cryptographic format.

## 4. Code-to-spec alignment
Existing reusable elements include:
- canonical `V3Action` constructors (Issue, Reveal, Claim, Expire);
- profile versioning in `EconomicProfile`;
- action/pre-state/post-state fingerprints in the Cardano admission witness;
- evidence-only binding between the witness and canonical transition evidence;
- structural transition → candidate state → universal projection → Economic Gate/viability composition.

The inspected fee path does not connect these elements to a G1 declaration. `EconomicProfile` has no fee-applicability map. `EconomicGateInput` accepts already-verified booleans and explicitly does not manufacture their authority. The evidence bridge binds identifiers but is not an economic authority.

The narrowest compatible conceptual insertion point remains authoritative-input verification and obligation/exposure derivation **before** candidate post-state construction. This is not authorization to add code now.

## 5. Minimum next design artifact
Before implementation, produce a **G1 Authority and Resolution Contract** that:
1. defines canonical usage-class identity and its mapping to actions, without selecting fee-bearing classes;
2. defines profile/deployment revision binding;
3. references an approved authority-verification mechanism instead of inventing a signer/quorum;
4. lists statuses such as declared-true, declared-false, unconfigured, invalid, stale, conflicting and revoked, marking unresolved execution consequences as OPEN;
5. places verified applicability and any resulting obligation inside the existing transition and complete candidate post-state;
6. separates declaration-authority evidence from settlement-receipt evidence;
7. maps conformance to C2, C3, C5b, C6, C7, C11 and the fee matrix;
8. separates normative decisions from implementation/test work.

Do not silently infer true or fee-exempt from a missing declaration. The prior G1 record labels that case UNCONFIGURED; its final execution semantics must be settled in the approved contract.

## Conclusion
No conflict was found between the fee workflow and canonical transition/authority rules. The remaining G1 gaps are specification/authority gaps, not merely a missing boolean. Reuse profile/version, action identity, evidence binding and fail-closed patterns, but do not mistake them for an authority predicate.

**G1 remains OPEN.** No fee-bearing class, fee value, authority mechanism, production code, tests, CI, deployment, V3 or Reveal behavior was changed.
