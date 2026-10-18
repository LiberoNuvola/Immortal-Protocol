# Workflow C — C6 action-space and transition mapping (2026-10-18)

**Status: AUDIT EVIDENCE / NOT CERTIFIED.** This document records a source-grounded mapping of the normative accounting deltas to the canonical V3 transition implementation on this branch. It is not a normative amendment and does not claim a complete universal transition system.

## 0. Scope, branch and reproducibility

- Repository: `LiberoNuvola/Immortal-Protocol`
- Authorized branch: `release/public-main-curated-2026-09-24`
- Branch HEAD verified through GitHub compare-ref at audit start: `5d10b2697101a75c6878003178084d97e4618b3b` (`docs: record V3 fast gate history`).
- Baseline C6 status: **NOT CERTIFIED**.
- The execution environment has no local Git checkout, so there is no local working tree or uncommitted local change set to inspect. Repository reads and this new-file commit are performed against the named remote branch. No existing file is overwritten.
- No workflow, test suite, deployment, transaction, mint, merge or release was run or performed as part of this audit.

### Source identity (branch content blob SHA)

| Source | Blob SHA | What it establishes |
|---|---|---|
| `docs/workflow-c/C6-RECONCILIATION.md` | `cb73e9b013e7654c2b4744f5a762155832a0a965` (initial read; current branch file was also reread after HEAD verification) | C6 requirements and previous gap analysis |
| `docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` | `32b54c73f6676467d197e8f6635155e4752cc17e` | R1, VC1–VC6, E1–E10 |
| `docs/02-certification/NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md` | `3befe38974c963d8701a93bd21131999973f3dbc` | R8, S0, non-vacuity, QNE and erosion obstruction |
| `docs/02-certification/OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md` | `17a30c6db680987c615ee334d6cf0cb2adbc5db0` | R3, Ω containment/over-approximation and perimeter package |
| `docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` | `9ebe7c55fb5de26aa9c8e1d0f17e466c91855c3e` | R7, PC1–PC7 and permitted accounting deltas |
| `docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md` | `882fe7c64166ca1e394bf6e96bec9ebf90f7e6f8` | Residual R1–R9 obligations |
| `PRE-RICH/docs/GAME-ECONOMY.md` | `3431169896aea420e7f8bff3c1932abed2c358ac` | Closed PRE-RICH application baseline |
| `IMMORTAL/kernel/EconomicTransitionV3.hs` | `62c2980a821cdcfc33a33e15a09617256ab8753c` | Actual V3 action set and transition guards/deltas |
| `IMMORTAL/state/EconomicStateV3.hs` | `e80ecd167fa7c473f211302eb70af444356b2b91` | Canonical V3 aggregate state fields |
| `IMMORTAL/kernel/EconomicKernel.hs` | `14dcc841ae5c055d522facfa60af4787132f27c3` | V3 protected capital, exposure, solvency and conservation |
| `IMMORTAL/state/UniversalEconomicState.hs` | `f89fe04c8aad8ca9c5e544fa9c145a38d157826f` | Chain-neutral aggregate fields |
| `IMMORTAL/kernel/UniversalEconomicKernel.hs` | `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785` | Universal ProtectedCapital, buffer basis and solvency |
| `IMMORTAL/kernel/EconomicGate.hs` | `8b8a06b4af1e2b5f4bac4f5faaa24f279d551127` | Immediate gate and caller-supplied viability booleans |
| `IMMORTAL/conformance/GoldenVectors.hs` | `f555c1309d77bf3542fc0a46d3bfe020be904344` | Synthetic transition fixtures, not a live S0 |

The named branch was checked for the existence of the following paths and they returned **not found on this branch**: `PRE-RICH/onchain/PreRichEconomicAdmission.hs`, `PRE-RICH/onchain/PreRichEconomicProjection.hs`, `PRE-RICH/onchain/PreRichLifecycleTransition.hs`, `plutus/test/PreRichLifecycleTransitionTest.hs`, and `.github/workflows/formal-mechanical-evidence.yml`. They exist in other source snapshots/branches or were discussed in prior audits, but are not evidence of implementation or CI integration on this authorized branch. Do not silently import their status into this branch.

## 1. Canonical implementation boundary

`EconomicTransitionV3.V3Action` contains exactly four constructors: `Issue TicketClass Integer`, `Reveal TicketClass Integer`, `Claim Integer`, and `Expire TicketClass`.

`transitionValid` checks the profile, pre-state conservation/control/non-negativity, whether `transition` returns a candidate, and post-state conservation/control/non-negativity plus monotonicity of `HighestClassEverActivated`. It has **no EEV argument**, no `Accept` relation over authoritative external inputs, no Ω argument, no S0 authority, and no proof object for universal closure.

The V3 state contains crystallized liabilities, unresolved reserve/count, safety capital, reserve protection, mandatory future costs, per-class issued/unresolved/exposure/cap/saleability, control history, and Jackpot state. EEV is supplied separately to `EconomicKernel.solvencyInvariant`; it is not part of `V3EconomicState`. The universal aggregate similarly receives EEV as an argument and computes:

`ProtectedCapital = crystallized liabilities + worst-case exposure + safety capital + reserve protection + mandatory future costs + additional protected capital`

The V3 kernel's `protectedCapital` additionally includes locked Jackpot amount and computes worst-case exposure as profile multiplier times total class exposure. The difference between the V3 and universal aggregate must be handled by an explicit, proven projection/refinement; the projection path cited on other branches is not present at its previously cited path here.

The on-branch `EconomicGate` does not derive universal closure. `viabilityGate safePostState allOmegaSuccessorsInCertifiedKernel` returns the conjunction of two Booleans; `executionAdmissible` accepts those Booleans as arguments. The comments assign upstream authority/refinement duties to callers, but the function itself does not inspect canonical event inputs or derive all Ω successors. This is an interface boundary, not VC3/VC5 proof.

## 2. Normative delta → application transition matrix

Verdict meanings: **PROVEN** means established by the cited source for the stated narrow claim; **PARTIALLY PROVEN** means a local transition/delta exists but one or more certification obligations remain; **UNPROVEN** means the source does not establish the claim; **REFUTED** means a proposed universal inference has a direct counterexample or contradicts the implementation's preconditions. None of these verdicts upgrades C6 certification.

| R7 delta | Closest existing application action | Preconditions and actual state effects | `Accept` / canonical `T` | `Rep`, buffer and Ω | VC2 / VC3 / VC4 / VC5 verdict |
|---|---|---|---|---|---|
| `represent: ∅ → L1/L2/L3` | `Issue(cid, price)` creates an unresolved ticket commitment | Requires profile-known class, exact canonical price, `classSaleable`, existing class row; increments unresolved reserve/count, class issued/unresolved/exposure. No L6 completeness proof is part of this function. | `transitionValid` checks structural V3 invariants. It does not itself prove authoritative inputs or the universal `Accept` relation. | With EEV fixed and other fields unchanged, unresolved worst-case exposure increases by (500P) under the current PRE-RICH multiplier; therefore buffer (b=EEV-PC) decreases by (500P). Not QNE. Ω must also include asset/valuation changes. | VC2: conditional on supplied EEV and complete accounting; VC3/QNE: **REFUTED as a universal witness** by buffer erosion; VC4/5: UNPROVEN. |
| `settle: L1/L2 → L4` | `Claim(amount)` decreases crystallized liabilities | Requires amount (>0) and amount no greater than crystallized liabilities; subtracts amount from that field. The V3 action does not encode claimant identity, signature, expiry or atomic ledger settlement. | Structural transition exists. The external settlement/ownership conditions are not established by this V3 function. | If EEV is unchanged and liability accounting is complete, PC decreases by amount and b increases by amount. It is unavailable when there is no positive crystallized liability and cannot witness all states. Ω must cover settlement failures/concurrency and any EEV changes. | Local delta: PARTIALLY PROVEN. Universal availability/QNE: REFUTED. VC4/5: UNPROVEN. |
| `expire: L1/L2/L3 → L5` | `Expire(cid)` removes one unresolved ticket of a class | Requires known class, at least one unresolved ticket and sufficient aggregate reserve; decrements reserve/count and class unresolved/exposure. The action carries class, not ticket identity or an expiry timestamp/eligibility proof. | Structural transition exists; the expiry condition required by the application policy is not checked by this constructor's arguments. | The unresolved exposure component can fall by the class worst-case amount, but availability is conditional. The environment may independently change EEV/freshness; no universal QNE theorem follows. | Delta shape: PARTIALLY PROVEN. Application expiry eligibility and universal witness: UNPROVEN. VC4/5: UNPROVEN. |
| `resolve: L3 → L1/L5` | Closest economic analogue is `Reveal(cid, payout)`: removes unresolved exposure and crystallizes a payout liability | Requires known class, payout within the profile maximum, an unresolved ticket and sufficient reserve; decreases unresolved reserve/count/exposure and increases crystallized liabilities. It is not a generic resolution of all external L3 cases. | A V3 transition exists, but no chain-independent mapping from every L3 resolution event to this action is supplied. | In the isolated one-ticket accounting delta with stable EEV and complete liabilities, PC changes by (-500P + payout), so b does not decrease for payout ≤ (500P). That local algebra is **not** QNE for all Ω: EEV can become stale/change and the action is not always available. | Local accounting implication: CONDITIONALLY PROVEN. Universal QNE/closure: UNPROVEN. VC4/5: UNPROVEN. |
| `verify: A3 → A1/A2` | No V3 action | Evidence verification is not a constructor in `V3Action`; the V3 state has no canonical asset-evidence/freshness object. | No canonical V3 transition binds verifier output to the state in this branch. | Could change authoritative EEV, but is not always available and cannot be selected as a universal action. Ω producer/perimeter absent. | UNPROVEN; not a witness. |
| `stale: A1/A2 → A3` | No V3 action; environmental effect | Freshness expiry is not encoded in `V3Action` or its transition relation. | No canonical V3 transition models it. | Can reduce EEV, hence erode b while V3 economic fields remain unchanged. Any Ω that omits it without a justified perimeter exclusion is unsound. | UNPROVEN; directly obstructs a claim of universal QNE absent a bounded/stable perimeter. |
| `realise: A4 → A1/A2/∅` | At most paired conceptually with Reveal/resolve; not represented as an independent V3 action | V3 Reveal accepts a payout parameter but does not model the full external contingent-asset event or an independent verified-asset realization. | No complete event-to-canonical-`T` mapping is provided. | Realization can yield executable value, no value, or a correlated liability outcome; the branch supplies no Ω derivation covering these cases. | UNPROVEN; not a witness. |

### Interpretation

1. **No existing action is shown to be an always-available QNE witness.** `Claim`, `Expire`, `Reveal` and `Issue` all have state-dependent preconditions; Issue demonstrably increases worst-case exposure. The V3 action algebra does not include the environmental transitions `verify`, `stale` or `realise`.
2. `Reveal` has a useful *conditional* local accounting property: the modeled reduction in worst-case exposure offsets a payout no larger than the already-declared maximum, assuming EEV is stable and all liabilities/exposure are represented. This is a proof obligation worth preserving, not a certificate. The universal Ω includes changes outside that isolated transition unless the declared perimeter justifiably excludes them.
3. The V3 `Expire` constructor cannot, by itself, certify application expiry eligibility because it carries no ticket identity or time/expiry evidence. This is an action/refinement gap, not permission to alter expiry semantics.
4. `verify`, `stale` and `realise` are normative accounting/environment deltas, not currently executable V3 action constructors. Treating them as if they were already covered by the four-action V3 graph would be a false completeness claim.

## 3. Accounting and representation findings

- R7 permits only the listed cell-to-cell deltas and proves two-sided conservation **conditional on PC1–PC7**. The R7 register explicitly says profile exhaustiveness is not discharged universally; PA2 (enumeration of all economic content) and PA7 (adversarial omission review) are still required for a concrete profile.
- The V3 kernel checks that unresolved reserve equals total class exposure and unresolved count equals the sum of class unresolved counts. This is valuable structural conservation. It does not prove that the application's entire obligation universe is represented, that L6 is empty, or that no material class lies outside the V3 aggregate.
- The V3 state includes per-class exposure, but `EconomicKernel.worstCaseExposure` uses profile multiplier × total class exposure. This depends on profile correctness and exhaustive class representation. The application specification requires class-aware exposure and warns aggregate unresolved count alone is insufficient when ticket prices differ.
- `UniversalEconomicKernel.protectedCapital` sums crystallized liabilities, worst-case exposure, safety capital, reserve protection, mandatory future costs and additional protected capital. A source-grounded projection must demonstrate field-by-field correspondence and include locked Jackpot semantics where required. The cited PRE-RICH projection path is absent from this branch, so no such refinement is claimed here.
- Golden vectors are synthetic conformance fixtures. `baseState` is not ledger-derived and is not a deployment S0.

## 4. Ω completeness and S0

### Ω

R3 requires `Ω-COMPLETE(Env, Ω)`: every successor induced by every material event in the declared perimeter must be contained in the checked Ω successors. A larger Ω is conservative; a smaller Ω is unsound. The R3 P1–P8 package includes event classes and boundaries, exclusions, authority/source mapping, actor independence, adaptive adversaries, repetition, correlation, timing, concurrency, liquidity shocks, oracle failure, abstraction soundness, residual risk, discovery/fail-closed behavior and re-certification triggers.

On this branch, the canonical V3 transition function is deterministic for the four explicit actions and contains no environment-event parameter. No generator or checker that derives an authoritative Ω from ledger/adapter events was found at the paths checked. A list of test fixtures cannot establish Ω completeness. **VC5 remains UNPROVEN.**

### S0

R8 requires a concrete canonical initial state, its authoritative derivation and `χ(S0)=1`. The available `GoldenVectors.baseState` is synthetic, with no ledger observation, authenticated EEV, freshness evidence, complete obligation partition or profile-bound Ω. It cannot be promoted to live S0. The exact S0 contract must bind:
- canonical V3 state and exact source/slot/transaction or state reference;
- profile/model/certificate versions;
- authoritative EEV value and valuation/asset provenance;
- complete protected-capital and representation evidence;
- Ω profile/perimeter digest and the checker result;
- reproducible canonical serialization and digest.

No values are invented here. **VC6 remains UNPROVEN.**

## 5. R1 verification and evidence binding

No independent R1 checker was found at the checked canonical paths. R1 requires VC1 decidability, VC2 safety inclusion, VC3 inductiveness across all Ω successors, VC4 acceptance compatibility, VC5 envelope soundness and VC6 concrete non-vacuity. The existing `EconomicGate.viabilityGate` accepts `allOmegaSuccessorsInCertifiedKernel :: Bool`; it does not derive this result. Similarly, truth/freshness/completeness flags are inputs to the gate and are explicitly expected to be verified upstream.

A future checker can safely certify only the claim its input model supports. For a finite abstraction it must:
1. normalize and hash the exact state/action/Accept/T/Env/Ω model and profile version;
2. derive every transition successor from the supplied canonical transition table/function rather than trust a caller-supplied “all successors safe” flag;
3. reject an empty Ω for any state/action requiring universal closure;
4. verify Ω contains all declared real-perimeter induced successors (or a separately justified sound over-approximation proof);
5. verify the witness is actually in A(S) and accepted for every certified state;
6. check χ(S0), VC2 and VC3 over the full finite domain;
7. emit checker identity/version, artifact digests, counterexamples on failure, and a report explicitly distinguishing model-checking evidence from proof that Env matches reality.

This is a specification for the next implementation tranche, not a claim that such a checker has already been implemented or tested. An explicit list of modelled events alone can only prove containment relative to that list; it cannot establish that the list covers the real world.

## 6. C6 scorecard after this tranche

| Gate / condition | Result | Evidence class |
|---|---|---|
| C6-A — profile architecture | Partially specified by R1/R3/R7 and V3 state/kernel; no complete profile instantiation | Normative specification + source inspection |
| C6-B — authorized witness/action adequacy | **BLOCKED**; no universally available non-eroding authorized action demonstrated | Source-grounded action mapping |
| C6-C — evidence binding | **PARTIAL / NOT CERTIFIED**; finite R1 checker and source-snapshot guard exist, but the finite model is not bound to the deployed transition relation, authoritative Accept/EEV, real Ω, or live S0 | Checker implementation + source inspection |
| VC1 | Formula/code for local V3 transition is decidable; certificate predicate χ is not instantiated | Partial source evidence |
| VC2 | Local solvency invariant exists; full `Safe`/Rep inclusion for a concrete profile not proved | Conditional source evidence |
| VC3 | Four-action local transition exists; all-Ω inductiveness not proved | Unproven |
| VC4 | Structural `transitionValid` exists; universal `Accept(S,Wit(S))` not instantiated | Unproven |
| VC5 / Ω | R3 contract exists; authoritative Env and sound Ω binding absent | Unproven |
| VC6 / S0 | Synthetic fixtures exist; no authoritative concrete S0 in this evidence set | Unproven |
| QNE and Rep/buffer preservation | Issue erodes modeled buffer; Reveal is only conditionally non-eroding under stable EEV/complete accounting; no universal witness | Partially analysed, not certified |
| Non-empty Kc | Not established | Not certified |

## 7. Next blocking point

The highest-priority blocker is **not another Boolean or a new action**. It is a profile-bound, source-authorized transition/refinement and Ω contract that can derive (rather than assert) every successor and bind authoritative EEV, obligations, acceptance and S0. The only potentially useful existing action-level result from this audit is the conditional local non-erosion property of Reveal under stable EEV and complete accounting; it is not always available and does not survive arbitrary unmodelled environment changes by assumption.

Next work must connect the finite-model checker to a source-grounded and exhaustive V3→universal projection, then bind the derived transition/Accept relations to authoritative Env/Ω and a real S0. The source-snapshot guard added later detects drift in canonical files but does not by itself bind model rows to source semantics. Do not represent this work as closing C6 until the model/Env/S0 evidence is bound.


## 8. Follow-up implementation — finite R1 checker (2026-10-18)

After the source mapping above, a deliberately bounded finite-model checker was added on this branch:

- Checker: [`scripts/check-r1-finite-certificate.mjs`](../../scripts/check-r1-finite-certificate.mjs)
- Input contract and limitations: [`R1-FINITE-CHECKER-SCHEMA.md`](R1-FINITE-CHECKER-SCHEMA.md)
- Regression suite: [`test/check-r1-finite-certificate.test.mjs`](../../test/check-r1-finite-certificate.test.mjs)
- CI workflow: [`c6-r1-finite-checker.yml`](../../.github/workflows/c6-r1-finite-checker.yml)

The checker derives EEV and ProtectedCapital from explicit R7 cell inputs, computes `Rep` and `χ`, checks the declared finite action availability/acceptance relations, derives successors from the transition table, rejects empty Ω, rejects undeclared materiality and Ω under-approximation relative to the declared finite Env, checks inductiveness, and hashes the normalized input plus checker source. It rejects caller-asserted certification booleans and synthetic S0 source kinds.

**Evidence boundary:** the local isolated copy of the checker and tests passed 8/8 Node built-in tests. The checker and test files were committed to the authorized remote branch, and a narrow path-filtered CI workflow was added. The available GitHub connector exposes no push-run listing/dispatch operation; the commit's combined status response was empty, so the remote workflow result is **UNVERIFIED**, not PASS. The remote branch has no local checkout in this execution environment.

This implementation is a finite-model gate only. It cannot authenticate source references or inventory digests, prove that the supplied event perimeter matches reality, establish action-list completeness, prove that transition rows refine deployed code, or supply a live S0. The regression fixture is synthetic and is not deployment evidence. Therefore C6-A/B/C, VC5 against reality, and VC6 for deployment remain **NOT CERTIFIED**.


## 8. Cross-branch recovery and disposition (rechecked 2026-10-18)

The authorized branch was re-read at the start of this continuation: remote ref existed and still pointed to `f787be061cfcf5c9a1d832d43be1c75a3d913384`. The current task then added a source-binding guard and updated the branch-local CI definition. No local checkout exists in the execution environment; Git status, local diff, and native Cabal test execution remain unavailable.

### Recovered candidates (read-only source branches)

| Candidate | Provenance | Semantic review | Disposition |
|---|---|---|---|
| `PRE-RICH/onchain/PreRichEconomicProjection.hs` | `work/immortal-green-closure` HEAD `5b060f13ea4ded1a163526c99935860c9d0f1316`; blob `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13`. Same blob was read on `release/issue-admission-boundary-squash` HEAD `5b04f0c005bc983dd9be6427d78ff232e0240f20`. | Computes class reserve/count and worst-case exposure from profile prices and payout multiplier; maps locked Jackpot into universal `uesAdditionalProtectedCapital`; checks aggregate boundary equality. It rejects duplicate classes and per-class exposure mismatch, but the shown code does not independently require every canonical profile class to be present exactly once. | **ADAPTABLE, NOT IMPORTED.** Strong candidate for the missing V3→universal projection, but class-domain exhaustiveness and regression tests on the authorized branch must be established before importing. |
| `PRE-RICH/onchain/PreRichEconomicAdmission.hs` | `work/immortal-green-closure` HEAD `5b060f13ea4ded1a163526c99935860c9d0f1316`; blob `d8360b608f3bb32b7c74000de3ca3b5e3a907a9a`. Same blob on `release/issue-admission-boundary-squash` and `work/b3-materios-provenance-evidence` at time of read. | Composes structural V3 transition, projection, and economic gate, but takes `truthVerified`, `eevFresh`, `obligationsComplete`, and especially `allOmegaSuccessorsInCertifiedKernel` as caller-supplied Booleans. | **INFORMATIONAL ONLY FOR C6.** Useful boundary decomposition, not an authoritative Accept/Ω proof and not safe to count as universal closure. |
| `PRE-RICH/onchain/PreRichLifecycleTransition.hs` | `work/immortal-green-closure` HEAD `5b060f13ea4ded1a163526c99935860c9d0f1316`; blob `edae4c21dc98cb07791c83337d5df49bad9a01e5`. | `EnterQuiescent` and `MaintainQuiescent` change a separate lifecycle state/nonce, not V3 economic fields. QNE checks each supplied witness for safe buffer non-erosion and representation preservation, and rejects an empty witness list. The code expressly leaves soundness of the supplied Ω envelope to the caller. | **INFORMATIONAL ONLY; NOT A QNE WITNESS.** It does not prove Ω completeness, economic-state preservation under all real events, or that these lifecycle actions are in the authorized normative action relation. Not imported. |
| `plutus/test/PreRichLifecycleTransitionTest.hs` | `work/immortal-green-closure` HEAD `5b060f13ea4ded1a163526c99935860c9d0f1316`; blob `ae45d53803cc8845220875858487b17514abb3d1`. | Contains finite example tests for lifecycle transitions, adverse EEV, representation loss, and empty/non-empty witness lists. | **INFORMATIONAL TEST EVIDENCE ONLY.** It tests supplied finite witnesses, not their real-world Ω coverage; execution on the authorized branch was not performed. |
| `.github/workflows/formal-mechanical-evidence.yml` | `work/immortal-green-closure` HEAD `5b060f13ea4ded1a163526c99935860c9d0f1316`; blob `7ff859e532e42e0030ec6074c84b3d8b81b64d82`. | Trigger filters target the green branch for push and `b1-hardening` for PR. | **NOT REUSABLE AS-IS.** Does not run on the authorized destination branch; importing it would not provide CI coverage here without a deliberate workflow adaptation. |

The following paths were checked and remain absent on the authorized branch at the time of the read: the projection, admission and lifecycle modules above, their lifecycle test, and `.github/workflows/formal-mechanical-evidence.yml`. No code from those branches was imported.

### 9. Canonical source binding guard

Added to the authorized branch:

- `scripts/check-r1-canonical-source.mjs`
- `test/check-r1-canonical-source.test.mjs`
- Updated `.github/workflows/c6-r1-finite-checker.yml` to run the source guard and both isolated Node test files, and to trigger when the guarded canonical Haskell files change.

The guard pins Git blob SHA-1s for the current V3 transition, V3 state, V3 kernel, universal state, universal kernel, and economic gate; it also extracts and checks the exact V3 action constructors, canonical record field lists, and protected-capital terms. This is a **source-drift alarm and structural contract**, not a proof of projection equivalence or an input generator for a deployment certificate. It deliberately fails when one of the pinned source files changes so a reviewer must reassess and update the baseline explicitly.

The source guard's report explicitly states that the authorized branch has no projection module. It does not claim a complete field-by-field semantic mapping. The recovered projection remains the best candidate for a subsequent isolated adaptation, subject to an explicit exact-class-set invariant and tests against the destination kernels.

### 10. Execution and CI evidence boundary

- The current remote branch ref was rechecked after writes and points to `471d3ee59462094594b0f090e9e84dceb3db22b2` at this checkpoint.
- GitHub combined status for that commit returned an empty status list. This means **CI is UNVERIFIED**, not PASS.
- No local Git checkout is available; no local working tree or native Haskell/Cabal build was inspected or executed.
- No workflow was manually dispatched; no deployment, transaction, mint, merge, or release was performed.
- Local test evidence from the prior checkpoint (8/8 finite-checker tests) applies to the isolated scratch copy noted in the prior report, not to an exact execution of the remote source blob. The new source-guard tests and updated workflow have not yet been observed passing in remote CI.

**Current verdict remains C6 NOT CERTIFIED.** The concrete improvement is exact-source drift detection for the canonical transition/state/kernel/gate snapshots. The principal missing artifact remains a source-grounded and exhaustive projection/model that binds actual V3 state, complete inventory, authoritative EEV, `Accept`, `T`, and Ω to a real S0.

## 11. V3 → universal projection guard (continuation checkpoint)

**Classification: MECHANICAL EVIDENCE + TEST EVIDENCE; not a deployment certificate.**

### Source and recovered candidate

The source candidate was reread on `work/immortal-green-closure` at HEAD `5b060f13ea4ded1a163526c99935860c9d0f1316`; blob SHA remains `22cf16232594a0e7f6c52749feaf8bf0ea6e5b13`. It is **not imported**. It validates duplicate classes, class price/exposure consistency and aggregate reserve/count, but does not prove that `v3Classes` contains exactly the profile's canonical class set. This is the concrete omission the new independent guard rejects.

The destination source snapshots are pinned by Git blob SHA-1 in `scripts/check-v3-universal-projection.mjs`:

| Source | Blob SHA | Use in projection check |
|---|---|---|
| `IMMORTAL/state/EconomicProfile.hs` | `e4eccd67bec97543b802aa15ff1b2719c9c18bde` | Profile version, unique class IDs, canonical prices and payout multiplier |
| `IMMORTAL/state/EconomicStateV3.hs` | `e80ecd167fa7c473f211302eb70af444356b2b91` | V3 aggregate, class, control and Jackpot fields |
| `IMMORTAL/kernel/EconomicTransitionV3.hs` | `62c2980a821cdcfc33a33e15a09617256ab8753c` | Confirms the exact existing action constructors: Issue, Reveal, Claim, Expire |
| `IMMORTAL/kernel/EconomicKernel.hs` | `14dcc841ae5c055d522facfa60af4787132f27c3` | V3 class exposure, worst-case exposure, ProtectedCapital, RawSurplus and solvency |
| `IMMORTAL/state/UniversalEconomicState.hs` | `f89fe04c8aad8ca9c5e544fa9c145a38d157826f` | Universal aggregate fields |
| `IMMORTAL/kernel/UniversalEconomicKernel.hs` | `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785` | Universal ProtectedCapital, RawSurplus and solvency |

The checker refuses to treat a source drift as a valid baseline: hashes must match, and it separately checks the parsed action set, V3/universal record field sets and required ProtectedCapital terms. These pins identify source snapshots; they do not prove that a deployment runs them.

### Field-by-field projection contract

| V3 source | Universal target / transformation | Executable check | Residual limitation |
|---|---|---|---|
| `v3CrystallizedLiabilities` | Direct → `uesCrystallizedLiabilities` | Non-negative integer; included once in both PC sums | Does not authenticate completeness of liability inventory |
| `v3UnresolvedReserve` | Direct → `uesUnresolvedReserve` | Must equal sum over exact classes of canonical price × unresolved count | Equality is conditional on profile and supplied class inventory |
| `v3UnresolvedTicketCount` | Direct → `uesUnresolvedTicketCount` | Must equal sum of per-class unresolved counts | Does not prove ticket identity/ledger inventory |
| `v3Classes` / `epClassPrices` / `epMaxNormalPayoutMultiplier` | Derived → `uesWorstCaseExposure = multiplier × Σ(price(class) × unresolved(class))` | Exact set equality; reject missing, duplicate and unknown classes; reject noncanonical price/exposure; check totals | Class list/profile authenticity remains external; no proof of live ticket inventory |
| `v3SafetyCapital` | Direct → `uesSafetyCapital` | Non-negative integer; included once in PC | Source authority not authenticated |
| `v3ReserveProtection` | Direct → `uesReserveProtection` | Non-negative integer; included once in PC | Source authority not authenticated |
| `v3MandatoryFutureCosts` | Direct → `uesMandatoryFutureCosts` | Non-negative integer; included once in PC | PA2/PA7 economic exhaustiveness remains open |
| `v3Jackpot.jsLockedAmount` | Direct → `uesAdditionalProtectedCapital` | Required and non-negative; output equals the source amount; PC equality check prevents omission or double count in the computed boundary | Jackpot status, threshold, cycle and lifecycle are not represented in the universal aggregate |
| `v3Control` | No universal field | Current/highest IDs must be in profile; current active class must not exceed highest-ever-activated class | Control history and activation semantics are not projected |
| `tcsIssued`, `tcsCap`, `tcsSaleable` | No universal field | Non-negative issued/cap and Boolean saleable shape | Application admission/cap/saleability behavior is not proven equivalent |
| External `EEV` | Separate checker input, not a state projection | Non-negative input; buffer = EEV − ProtectedCapital; RawSurplus = max(0, buffer); solvency iff buffer ≥ 0 | EEV provenance/authenticity/freshness are **not** checked by this tool |

The V3 kernel's ProtectedCapital includes the locked Jackpot; the universal kernel has no Jackpot field and sums `uesAdditionalProtectedCapital`. The checker sets that field to the locked Jackpot exactly once and independently compares the two computed ProtectedCapital sums. It does not map Jackpot lifecycle semantics.

The computed **buffer** is `EEV − ProtectedCapital`; it is not the V3 `effectivePool`, which separately subtracts crystallized liabilities, unresolved reserve and locked Jackpot. These quantities must not be conflated.

### Added artifacts and CI evidence

- `scripts/check-v3-universal-projection.mjs` — finite projection and canonical source-snapshot guard.
- `test/check-v3-universal-projection.test.mjs` — positive mapping case and negative cases for missing/duplicate/unknown classes, duplicate profile IDs, noncanonical class exposure, reserve/count mismatch, invalid price, invalid control history, negative Jackpot, Git blob framing, and missing source files.
- `.github/workflows/c6-r1-finite-checker.yml` — same existing workflow now runs the source guard and all three Node test files; no duplicate workflow was created.

The first CI execution `#10` at commit `e3d4df9ae9e94520bbe4b798e45d56e6401358d6` failed on the positive fixture because its declared unresolved reserve was `8`, while the class-derived canonical total was `4`. This was a fixture inconsistency, not a kernel change. The fixture was corrected to `4` in commit `0c47eeca49637338ebae4fe8fc5c071c071974ce`; the negative mismatch test still uses `7`. A new push run `#11` was observed queued immediately after that correction. Its final conclusion must be checked separately; no PASS is inferred from queueing.

No Haskell normative source was changed. No deployment, transaction, mint, merge, release or manual workflow dispatch was performed.
