# Repository-wide coordination checkpoint

**Coordination update:** 2026-11-06  
**Working branch:** `work/immortal-green-closure`  
**HEAD before this checkpoint update:** `75f3dbb81a3740878b566528a37e5e8456de83bb`  
**Purpose:** central pointer for current cross-agent work. This entry records the new A-R1 frontier; it does not supersede earlier issue evidence or authorize protocol changes.

## Agent A — A-R1 Dynamic Economic Margin / Statistical Reserve

**Lead:** Agent A  
**Independent technical review:** Agent B  
**Status:** READ-ONLY BASELINE RECORDED; review and analytic follow-through open.

New baseline:
- `docs/COORDINATION/AGENT-A-R1-DYNAMIC-MARGIN-STATISTICAL-RESERVE-BASELINE-2026-11-06.md` (updated with exact moment reproduction and symbolic lifecycle vectors (latest report commit `aa7ac0160fb06fbe3ecfb11eb7324b7e6d9d44a8`))
- Commit introducing the baseline: `75f3dbb81a3740878b566528a37e5e8456de83bb`

The audit distinguishes:
1. nominal unresolved face reserve, currently `Σ(P_i × N_i)` in the V3 aggregate/carrier;
2. deterministic class-aware worst-case exposure, currently `500 × Σ(P_i × N_i)`;
3. PRE-RICH's documented statistical payout-risk model, `Nμ + Zσ√N`, with `μ = 0.64996875P`, `σ ≈ 6.689612535P`, and `Z` still a deployment/model parameter;
4. `ReserveProtection`, a separate protected-capital component whose source and non-overlap are not established by the current V3 arithmetic.

No statistical addend has been inserted into ProtectedCapital. No 500×, KA/KC/KD, price ladder, V3/Reveal semantics, EEV source, script identity or deployment rule has been changed.

### Agent A next steps
- Independently reproduce the current ticket-level probability moments from the canonical two-row payout table.
- Build lifecycle vectors that display nominal face reserve, deterministic WCE, crystallized liability and the statistical estimate separately through Issue/Reveal/Claim/Expire — **symbolically derived** in the A-R1 report; mixed-class variance expression remains conditional on cross-ticket independence.
- Identify the missing specification/evidence contract for the statistical model's role, Z, mixed-class dependence, precision and admission boundary.
- Keep the R1/QNE proof universal over the authoritative Ω; a statistical confidence estimate is not a substitute for that proof.

### Agent B review request
- Review `EconomicKernel.hs`, `EconomicTransitionV3.hs`, `PreRichEconomicProjection.hs`, `PreRichEconomicAdmission.hs`, and `V3EconomicStateCarrier.hs` against the new A-R1 crosswalk.
- Confirm the current carrier's unresolved reserve is nominal face value, not the statistical quantity — source review supports this; B1 explicitly calls it the deterministic ticket-price reserve and EconomicGate has no μ/σ/Z input.
- Check any candidate mapping to `ReserveProtection` against the PA3/PA4 source-provenance and non-overlap requirements.
- Do not change V3/Reveal semantics or introduce a new ProtectedCapital addend during review.

## Existing blockers retained

- **Issue #37 / R1-Kc-QNE:** concrete profile instantiation, complete E1–E10/VC1–VC6 evidence, authoritative Ω and a valid non-eroding witness remain open. The S0 Issue-only erosion finding is not superseded by the statistical reserve baseline.
- **Issue #37 / PA3–PA4:** component-level provenance and disjointness for SafetyCapital, ReserveProtection and MandatoryFutureCosts remain open. `ReserveProtection` must not be inferred from the nominal unresolved reserve.
- **Issue #37 / current EEV and Preprod evidence:** live snapshot, source completeness, Oracle qualification and first-Issue admission gates remain separate.
- **Issue #20 / expiry:** earlier builder-side time-anchor work remains bounded by the documented policy/provenance/on-chain conformance gaps; this checkpoint makes no status change.
- **Issue #41 / Treasury receipts:** read-only evidence remains non-authoritative for economic allocation or spending.

## Change-control boundary

This A-R1 increment is analysis/documentation only. No code/tests/workflows were changed or run; no certificate was issued; no wallet signature, transaction, bootstrap, approval or deployment was performed. Any implementation of statistical reserve behavior requires an explicit policy/specification decision and an evidence-backed field/gate contract first.
