# IMMORTAL — Universal Kernel Consumer Inventory (Initial)
Date: 2026-10-28
Branch: `work/immortal-green-closure`
Status: **INITIAL / INCOMPLETE — not a certification or complete call-graph proof**

## Scope
Map known consumers and boundaries for `UniversalEconomicState`, `UniversalEconomicKernel`, `EconomicGate`, the V3 compatibility kernel, and the proof obligations around concrete `K_c` and admissible successors `Ω`. This document does not change economic semantics, constants, transition rules, or adapter policy.

## Source anchors inspected on this branch
- `IMMORTAL/state/UniversalEconomicState.hs` — blob `f89fe04c8aad8ca9c5e544fa9c145a38d157826f`
- `IMMORTAL/kernel/UniversalEconomicKernel.hs` — blob `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785`
- `IMMORTAL/kernel/EconomicGate.hs` — blob `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127`
- `PRE-RICH/onchain/PreRichEconomicProjection.hs` — blob `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13`
- `PRE-RICH/onchain/PreRichEconomicAdmission.hs` — blob `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a`
- `IMMORTAL/state/STATE-FIELD-OWNERSHIP.md` — blob `af6fd3cf0f904b1e45aa58e6b464797b4a3fed8c`
- `IMMORTAL/docs/ECONOMIC-GATE-CARDANO-CONFORMANCE-MATRIX.md` — blob `01b536b395a9dddef78cc342031451880165005f`
- `docs/COORDINATION/RF8_NO_SIDE_DOOR_SURFACE_AUDIT_20260924.md` — blob `4ef56cb9d3a70bf848c38816a067c7c44dc67957`
- `docs/COORDINATION/RF8_ECONOMIC_SURFACE_REACHABILITY_DELTA_20260924.md` — blob `b907396af1aad311b241eed3694546040cc693e2`

## Consumer / boundary inventory

| Consumer or surface | Current role | Classification | Evidence / limitation |
|---|---|---|---|
| `UniversalEconomicKernel` | Computes ProtectedCapital, RawSurplus, non-negativity and solvency | Universal kernel | Pure arithmetic over aggregate state; no chain API in the inspected module. These predicates do not themselves establish `K_c`. |
| `EconomicGate` | Checks verified-truth/freshness/completeness flags, immediate liquidity, and candidate solvency | Universal decision interface | Flags are supplied by callers. Gate comments explicitly state it does not manufacture truth, freshness, obligation coverage, or an Ω certificate. |
| `viabilityGate` / `executionAdmissible` | Consumes booleans for safe post-state and all relevant Ω successors in certified kernel | Universal interface / proof boundary | Boolean witness only; no enumeration of Ω, decision procedure for membership in `K_c`, or proof is implemented here. |
| `PreRichEconomicProjection.projectPreRichState` | Converts V3/profile state to universal aggregate; rejects inconsistent/unknown class data | PRE-RICH profile boundary | Knows ticket classes, profile payout multiplier, class exposure, and locked Jackpot. Correctly fail-closed in inspected path; full equivalence across all actions still requires tests/proof. |
| `PreRichEconomicAdmission.preRichEconomicAdmission` | Composes V3 transition, projection, Economic Gate and viability input | PRE-RICH admission consumer | Receives truth/freshness/completeness and Ω result as arguments; caller provenance and whole-program reachability remain to be demonstrated. |
| `EconomicStateV3` / `EconomicKernel` / `EconomicTransitionV3` | Rich compatibility state and profile-aware transition/economic rules | Legacy/V3 + application profile | Must remain for compatibility until action-by-action equivalence is demonstrated; not all fields belong in universal state. |
| `B1LegacyAdapter` / `plutus/B1PrizePool.hs` | Legacy Cardano datum translation and on-chain pool solvency | Cardano adapter / compatibility | Uses the universal state/kernel for selected checks, while preserving Cardano- and PRE-RICH-specific datum and lifecycle logic. Not evidence of a second adapter's equivalence. |
| `plutus/MintPolicy.hs` | Sale/mint and atomic treasury/pool checks | Cardano on-chain mutation surface | RF8 audit reports independent checks rather than proven invocation of one canonical Economic Gate. |
| `plutus/PrizeValidator.hs` | Reveal/Claim/Expire lifecycle checks | Cardano on-chain mutation surface | RF8 audit reports direct lifecycle/accounting checks; whole-program canonical-gate reachability remains open. |
| `plutus/Treasury.hs` | Treasury value movement/distribution | Cardano on-chain mutation surface | Separate economic surface; canonical-gate call path not proven by the cited audit. |
| `Adapter/REFERENCE/ReferenceAdapter.hs` | Deterministic replay of V3 actions and expected states | Reference/conformance harness | Replays V3 transitions; by itself does not prove a chain-neutral UniversalEconomicState contract or infinite-horizon viability. |
| `IMMORTAL/conformance/RefinementV3.hs`, `ProtectedCapitalConformance.hs`, `plutus/test/ProjectionBoundaryConformanceTest.hs` | Refinement and local preservation/conformance evidence | Tests / proof support | Local invariants and finite action vectors are useful but explicitly not infinite-horizon viability proofs. |
| Cardano observation / off-chain projections | Build observed state and candidate transactions | Off-chain evidence/adapter boundary | Must not be treated as economic authority; on-chain paths and authenticated evidence remain authoritative. |

## Findings

1. **A chain-neutral arithmetic core exists.** The inspected universal state and kernel do not import Cardano or Materios-specific APIs.
2. **The projection is not universal code.** PRE-RICH's class decomposition, profile multiplier and Jackpot state are deliberately handled at the application boundary. This is the correct ownership separation, but its preservation properties must be tested against the V3 reference for every canonical action.
3. **The gate is not an evidence oracle.** `EconomicGateInput` accepts booleans and EEV/liquidity values from upstream. Correctness depends on authenticated, fresh, complete and consistently bound evidence from the caller.
4. **No certified concrete `K_c` is established by the inspected code.** The viability API consumes a boolean for the Ω-successor condition. The required profile-specific model, successor relation, membership decision procedure and refinement/proof evidence remain open.
5. **Ω remains an external proof obligation.** Finite transition tests and local ProtectedCapital monotonicity do not establish that every relevant successor remains inside a safe set for an unbounded horizon.
6. **The Cardano implementation is not a cross-chain proof.** A second adapter must consume the same canonical economic vectors and demonstrate equivalent accept/reject results, while separately proving its state translation, finality, authority and atomicity assumptions.
7. **There is a related whole-program admission gap.** The RF8 audit identifies MintPolicy, B1PrizePool, PrizeValidator and Treasury as separate mutation surfaces and states that universal canonical-gate reachability has not been demonstrated. This is relevant to universal-kernel integrity but is not, by itself, proof of an economic-rule defect.

## Required next evidence (no new algorithm or parameters)

1. Complete the repository-wide import/call-site census on the exact current branch HEAD, including Haskell, TypeScript, Plutus validators, scripts, tests and workflow-generated entry points. Record path, symbol, caller, callee, classification and source SHA.
2. For each canonical action (Issue, Reveal, Claim, Expire), bind the same input and post-state to V3 and Universal projections and compare all universal economic outputs, not just compilation or a handful of examples.
3. Trace the provenance of every `EconomicGateInput` field to an authenticated producer; establish where `truthVerified`, `eevFresh`, `obligationsComplete`, available liquidity and the Ω witness are computed and validated.
4. Recover the existing normative specification for `(S, A, Accept, Ω, T, Safe)`, identify the intended definition of `K_c`, and write the exact proof obligation and falsifying counterexample strategy. Do not fill missing definitions by inventing parameters.
5. Demonstrate that each economically material Cardano mutation surface either reaches the canonical admission boundary or document the normative reason and equivalent enforcement proof for a separate path.
6. Only after the reference vectors and trust boundaries are stable, run a second adapter against the identical vectors and record per-vector accept/reject equivalence plus adapter-specific trust assumptions.

## Non-claims
- This is not a complete call-graph inventory.
- It does not claim a certified `K_c`, a complete `Ω`, or infinite-horizon safety.
- It does not authorize refactoring V3, changing kernel semantics, creating another branch, or selecting a new adapter.
- It does not establish that current branch HEAD equals the source anchors above; verify HEAD before extending this inventory.


## 2026-10-28 — Targeted source-level reachability pass

This section records exact file/blob anchors fetched from `work/immortal-green-closure`. These are **file blob SHAs**, not a claim about the branch HEAD SHA. The connector's code search indexes the default branch, so this pass uses explicit branch-ref file reads for the paths below. It is targeted evidence, not an exhaustive repository-wide import/call graph.

### Exact source anchors

| Path | Blob SHA | Observed symbol / call-site evidence | Classification |
|---|---|---|---|
| `IMMORTAL/kernel/EconomicGate.hs` | `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127` | Exports `economicGate`, `viabilityGate`, `executionAdmissible`; `executionAdmissible` composes economic gate and viability gate. | Universal decision API; proof inputs are supplied values/booleans. |
| `PRE-RICH/onchain/PreRichEconomicAdmission.hs` | `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a` | Imports `EconomicGate`; runs V3 transition, projects candidate, constructs `EconomicGateInput`, checks universal solvency, then calls `executionAdmissible`. Parameters include `truthVerified`, `eevFresh`, `obligationsComplete`, and `allOmegaSuccessorsInCertifiedKernel`. | Concrete PRE-RICH composition, but upstream provenance and Ω certificate production are not established by this function. |
| `PRE-RICH/onchain/PreRichEconomicProjection.hs` | `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13` | Defines `projectPreRichState`; module also exposes a projection/solvency conformance predicate comparing V3 and universal solvency. | Profile-specific refinement boundary; a local equality is not full action-by-action or infinite-horizon proof. |
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | `mkPolicy` calls `atomicTreasuryPaymentValid` and `atomicPoolReservationValid` in sale path; no direct named `economicGate` call observed in this source. | Independent Cardano sale/mint enforcement surface; refinement to canonical admissibility not established here. |
| `plutus/B1PrizePool.hs` | `106368b510a52447aa3de7ce951cf615466fc5e8` | Imports `UniversalEconomicKernel`; local `solvencyInvariant` calls `UniversalEconomicKernel.solvencyInvariant`; `mkValidator` and multiple action branches invoke local solvency checks. | Universal solvency integration exists; this is not proof every action follows canonical Gate→Viability. |
| `plutus/PrizeValidator.hs` | `2455f8283d87ff74a94b1b8bca1d1f96d60ae8b2` | Has direct `validateReveal`, `validateClaim`, `validateExpire` branches in `mkValidator`; no direct named universal gate call observed in source. | Separate lifecycle/accounting enforcement surface; refinement proof remains open. |
| `plutus/Treasury.hs` | `8313ed0672ce2a18c6156fce01db0ea75efddd1c` | `mkValidator` handles `Distribute`; inspected module does not import the universal kernel/admission modules. | Separate treasury distribution surface; common canonical gate/refinement not evidenced. |
| `plutus/PrizePool.hs` | `54c7ba920d89e2c6c43ecf09eb5359b180c9469c` | Has its own `mkValidator`; caller/deployment reachability not resolved by this file read. | Legacy pool surface; usage classification still required. |
| `plutus/BeaconRegistry.hs` | `184f4178139dde01845853dcc0ab51371949ec9b` | Has a `mkValidator`; this inspection did not establish that it is an economic authority. | Supporting/protocol-state surface pending bounded role classification. |
| `plutus/CounterValidator.hs` | `29d3bcf6d6a4a0b4348cfa5e17a61ec822093870` | Has a `mkValidator`; this inspection did not establish a universal-gate call. | Supporting issuance-counter surface; determine whether atomic pairing is sufficient. |
| `src/mint.ts` | `b9b1a7f4846e4cfdf8862368421b8ce7cf8b1534` | Candidate sale transaction construction; no assertion here that off-chain code is authoritative. | Off-chain transaction builder; ledger validator remains authority. |
| `src/gameFlow.ts` | `cab3f9d1c7c971b4127f9ae61d1477dc93454fd9` | Candidate game/lifecycle flow construction. | Off-chain orchestration; must be paired with on-chain validation. |

### Reachability matrix (source-level, not certified)

| Action/surface | Concrete entry observed | Named universal admission call observed in entry | What the current evidence supports |
|---|---|---:|---|
| PRE-RICH admission composition | `preRichEconomicAdmission` | Yes, via `executionAdmissible` | The composition exists; caller trust, witness provenance, and all live-entry reachability are still open. |
| SALE | `MintPolicy.mkPolicy` | No | Atomic treasury/pool predicates are present; equivalence to the canonical relation is unproven. |
| Pool lifecycle/accounting | `B1PrizePool.mkValidator` | Universal solvency only | Shared solvency predicate is used; complete Gate→Viability/action binding is unproven. |
| REVEAL / CLAIM / EXPIRE | `PrizeValidator.mkValidator` → action validators | No | Local lifecycle/accounting predicates exist; canonical refinement and bypass regression are missing. |
| TREASURY | `Treasury.mkValidator` | No | Independent distribution logic; normative equivalence or justified separation is not evidenced. |
| Legacy pool | `PrizePool.mkValidator` | Not established | Need exact deployment/reference caller and live/unreachable classification. |
| Beacon / counter | `BeaconRegistry.mkValidator`, `CounterValidator.mkValidator` | Not established | Their economic materiality and atomic pairing need classification, not assumption. |

### Findings sharpened by this pass

1. The universal gate and the PRE-RICH admission composition exist as source code, but a function's existence is not proof that all economic mutations reach it.
2. The main open gap is now concretely split into (a) producer/provenance for gate inputs and Ω, (b) static reachability from all live economic entry points, and (c) a semantics-preserving refinement proof for paths that use local predicates instead of the named gate.
3. The Cardano validators remain separate on-chain enforcement surfaces. Off-chain builders are not authority, and reference replay is not a ledger-level or infinite-horizon certificate.
4. The current source pass does not identify or authorize a refactor. Do not homogenize validators by inserting a symbol solely to satisfy a search; first establish the normative relation and intended architecture.

### Next evidence needed

- Establish the exact branch HEAD through a ref/commit query before describing this inventory as HEAD-pinned; the file reads above only prove the returned path/blob versions on the named ref.
- Complete recursive-tree and call-site search on that exact SHA, including imports, all references to `preRichEconomicAdmission`, `executionAdmissible`, `viabilityGate`, `projectPreRichState`, and validator script compilation/deployment wiring.
- Trace each `EconomicGateInput` field to the authenticated source and show where Ω is derived or certified. A caller-provided Boolean is not itself a certificate.
- Add negative bypass regressions and per-action V3↔universal state/output vectors before considering a second adapter.
- Keep RF8, U-02 consumer/call graph, and U-03 certified infinite-horizon viability OPEN until the corresponding evidence exists.

**Status:** targeted source-level pass recorded; inventory remains **INCOMPLETE**; no tests executed in this pass; no protocol semantics or constants changed.


## 2026-10-28 — Issue decision producer and runtime binding trace

This pass follows the PRE-RICH admission composition one layer further, through the Haskell Issue decision producer, Cardano observation reader/provider and runtime submission boundary. Exact file/blob anchors were fetched using the named branch ref; they are blob SHAs, not a claim that the branch tip has been independently resolved.

| Path | Blob SHA | Observed evidence | Remaining limitation |
|---|---|---|---|
| `PRE-RICH/onchain/PreRichIssueDecision.hs` | `ec37ea8e656fa399f1e57e2404e0c6a2c5b5ccee` | `produceIssueDecision` calls `preRichEconomicAdmission`, then binds action + pre/post-state hashes into an action fingerprint. | It accepts `idiTruthVerified`, `idiEEVFresh`, `idiObligationsComplete` and `idiAllOmegaSuccessorsCertified` as input booleans and copies them into the decision; it does not derive the Ω certificate. |
| `plutus/export/IssueAdmission.hs` | `60e412cc8ffb0965c0c469c43e641496c83a7bc2` | JSON input parser reads the same authority/freshness/completeness/Ω booleans and calls the Haskell decision producer. | Serialization/typing does not authenticate the truth of the fields. |
| `relayer/preprodIssueObservationReader.js` | `77892b31de00d6f7eefd7955b5cfd410d7e36caf` | Requires an authority source or authoritative inputs; checks required fields, non-negative EEV/liquidity, observation timestamp, optional signed carrier decision hashes, and carries `viabilityCertificate` and ProtectedCapital provenance. | The inspected slice still accepts `allOmegaSuccessorsCertified` as a Boolean field. A certificate object is carried separately; its semantic validation and proof of binding to (K_c)/Ω are not established by this reader alone. |
| `relayer/preprodIssueObservationProvider.js` | `ff55cfa0bc28ac8a1d3f46bb52dc88ee980950b5` | Checks observed Counter/Pool/control refs, optional runtime Pool value, required decision fields, and observation-reference equality. | This is input/reference consistency, not a viability proof. |
| `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` | `f0c794892104b25e64e94f402c1dd0f5d604364e` | Runs Haskell producer; checks action, EEV, Pool liquidity, all four Boolean flags against the observed decision input and requires them true; compares ProtectedCapital components/total and decision/observation references; returns witness with EEV and viability evidence. | It checks Boolean equality to the supplied observation input; that alone does not prove the Boolean derives from a sound Ω/Kc certificate. The viability certificate's schema/cryptographic verification must be followed through separately. |
| `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` | `1bed1a4e04d1c861a0d5ea317181cdf431215e3b` | Economic submissions call `assertEconomicAdmission`; Issue submissions additionally call `assertAuthoritativeIssueAdmissionWitness`; transaction input references are rechecked immediately before signing. | The source comment explicitly limits binding: it checks input classification, but does not yet bind the full output/datum/redeemer/validity map to intent. This is a separate runtime transaction-intent boundary, not a substitute for Kc/Ω proof. |
| `plutus/test/EconomicAdmissionTest.hs` | `b6bc5f4fcadfd1393a09ffa49c5997dd6d044186` | Finite tests reject false truth/freshness/completeness/Ω flags and exercise Issue/Reveal/Claim/Expire admission cases. | The Ω test supplies `False`; no test constructs or verifies a mathematical certificate covering every relevant successor. |
| `plutus/test/EconomicGateTest.hs` | `28d6b0ac63c6a49ce30b0004656757442a56e7fa` | Tests gate rejection for unsafe state, bad inputs, and false successor-coverage Boolean. | Confirms Boolean gate behavior, not correctness of an upstream certificate producer. |
| `plutus/pre-rich-plutus.cabal` | `e8daf55df06a5ea3ba4494dca5e0a4a3033b4a27` | Lists EconomicGate, UniversalEconomicKernel, PreRichEconomicAdmission, PreRichIssueDecision and test executables. | Build registration proves inclusion, not live production reachability or proof completion. |
| `scripts/predeploy-check.mjs` | `efc0eecb6ddb37ad63528d3dc15953ab7898970c` | Contains a PRE-RICH B1 predeploy gate and runs `cabal build all -j1` / `cabal run exe:export-scripts`. | Static predeploy checks/build are not a whole-program reachability proof, a deployed verifier, or a successful real Issue transaction. |

### Updated producer-to-ledger chain

`Cardano observation + authority source`
→ `preprodIssueObservationReader` (validates required fields and binds observed references)
→ `preprodIssueObservationProvider` (checks refs and required input shape)
→ `IssueAdmission.hs` JSON decode
→ `PreRichIssueDecision.produceIssueDecision`
→ `PreRichEconomicAdmission` / `EconomicGate` / Boolean Ω condition
→ `HaskellIssueAdmissionProvider` (checks returned decision against observed input and PC provenance)
→ `CardanoExecutionAdapter.submitEconomic` (admission witness and input-classification checks)
→ wallet signing / transaction submission.

This trace is **partially evidenced at source level**. It is not yet proof that the external authority source computes `allOmegaSuccessorsCertified` soundly, that the `viabilityCertificate` is cryptographically/semantically validated against the same candidate state and certified (K_c), or that the entire transaction body is bound to the admitted action.

### Consequence for U-02 / U-03

- **U-02 (consumer/reachability):** the PRE-RICH Issue route has a concrete source path through a server-side Haskell producer and a Cardano runtime admission boundary. That narrows the unknown; it does not discharge whole-program reachability for SALE, Reveal, Claim, Expire, Treasury, legacy pool and other deployed entry points.
- **U-03 (certified viability):** the code and tests make the Boolean nature of the current proof boundary explicit. Existing finite tests establish fail-closed behavior when the flag is false; they do not establish that a true flag is justified.
- **Separate runtime gap:** the Cardano execution adapter itself documents that it does not yet bind the full output/datum/redeemer/validity map to intent. Track this as a transaction-intent binding obligation, distinct from the economic kernel proof.

### Required next targeted checks

1. Inspect the exact implementation and tests of `assertAuthoritativeIssueAdmissionWitness`, the `ViabilityCertificateEvidence` type, and the source that signs/validates the certificate. Verify candidate-state, policy/version, horizon/Ω coverage and authority identity bindings; do not assume fields named “certificate” imply proof.
2. Trace the actual configured `authoritySource` in Preprod workflows/deployment config, not only its interface, and determine whether it is a real verified producer or a fixture/configured Boolean source.
3. Trace the full transaction intent (all inputs, outputs, datum, redeemer, validity range and mint) from witness through Lucid body to signature. Keep this separate from Kc/Ω certification.
4. Resolve the branch tip SHA using an authoritative ref endpoint before calling this a HEAD-pinned inventory; connector search results are default-branch indexed and are not used as proof of branch HEAD.
5. Keep RF8/U-02/U-03 OPEN pending those exact artifacts and tests.

**Status:** Issue producer-to-runtime source path narrowed; authority/Ω soundness and full transaction-intent binding remain OPEN; no tests executed in this pass; no economic semantics or constants changed.


## 2026-10-28 — Viability certificate validation boundary refined

Follow-up inspection of `src/preRichIssueAdmissionBridge.ts` and `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` narrows the earlier limitation: the bridge does perform structural and deployment-binding validation on the viability certificate. The remaining gap is more specific than “certificate object is merely carried.”

| Path | Blob SHA | Verified source behavior | Remaining proof boundary |
|---|---|---|---|
| `src/preRichIssueAdmissionBridge.ts` | `8e594655f68fb3c9f267703a85474e6fd1f25f8e` | Requires certificate ID/version, model/predicate/witness-selector/bounds references, a 64-hex digest, six VC proof records with non-empty references and 64-hex digests, ten evidence records with the same structural requirements, and deployment binding to Preprod network, carrier state, state hash, EEV snapshot and ProtectedCapital source. It also checks EEV deployment approval and EV1–EV7 evidence, plus protected-capital component/total consistency. | The inspected code validates shape, references, digest syntax and identity bindings. This is not itself a verifier for the contents of VC1–VC6, E1–E10, nor a mathematical proof that all relevant Ω successors remain in certified (K_c). The actual referenced artifacts and their verification semantics must be recovered. |
| `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` | `886f8b62ea001c4d822777f4cc6e8a440dd57320` | Requires authority URL, public key, direct-USDM unit and deployed control identifiers; observes physical Pool USDM; calls `fetchSignedIssueAuthority`; compares authority Pool/EEV/timestamp to direct observation; requires carrier-binding signature and signed state/action/post-state digests. | This is a configured external authority integration, not a locally invented economic producer. The deployed endpoint/key/configuration and the authority's actual evidence-generation/verification process still need verification against the target environment. |
| `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` | `f0c794892104b25e64e94f402c1dd0f5d604364e` | Rechecks the Haskell decision against authority-supplied values, requires the flags true, compares ProtectedCapital components/total and binds decision references. | Equality with signed/supplied inputs prevents inconsistent substitution but cannot upgrade a Boolean into a verified Ω proof. |
| `Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts` | `1bed1a4e04d1c861a0d5ea317181cdf431215e3b` | Revalidates admission witness and checks exact input classification immediately before signing. | Its own comment states the full output/datum/redeemer/validity map is not yet bound to intent. This must be closed separately from viability proof. |

### Refined conclusion

The Issue admission route is stronger than a bare Boolean-only frontend path: it has a configured external authority interface, signature-related carrier binding, EEV qualification evidence, ProtectedCapital provenance, a typed viability-certificate envelope, deployment identity checks and a runtime admission boundary.

However, **certificate structure and deployment binding are not the same as certificate verification**. The inspected bridge checks references and digest formats, but this pass did not retrieve or validate the actual referenced VC proof artifacts or identify an executable verifier that establishes the normative CK1–CK8 obligations over (K_c) and Ω. Therefore U-03 remains OPEN. This finding does not invalidate the implemented binding checks; it distinguishes what they establish from what they do not establish.

### Immediate follow-up order

1. Recover the schemas, canonical content/digests and verification code for VC1–VC6 and E1–E10. Determine whether the verifier checks the actual proof payload or only a manifest of references.
2. Verify the configured Preprod authority URL/public key and the production implementation behind that endpoint; inspect the exact signed payload schema and signature verification path.
3. Bind the viability certificate to the exact candidate action fingerprint and post-state, not only the observed carrier state and pre-state hash, or document the existing equivalent binding if it is present elsewhere.
4. Close the documented full-transaction-intent gap in `CardanoExecutionAdapter` only after identifying existing normative requirements and tests; do not alter economic formulas or V3/Reveal semantics.
5. Preserve U-02 and RF8 as OPEN until the all-surface reachability proof and bypass regressions are complete.

**Status:** certificate structural/deployment validation confirmed; proof-content verification and full transaction-intent binding remain OPEN; no tests executed in this pass; no protocol semantics or constants changed.
