# IMMORTAL — Protocol Usage Fee Closure Gap (B3 v1)

**Date:** 2026-10-20  
**Branch:** `work/b3-materios-provenance-evidence`  
**Classification:** RESEARCH / EVIDENCE GAP AUDIT / NON-NORMATIVE  
**Parent:** `PROTOCOL-USAGE-FEE-END-TO-END-TRACEABILITY-B3-v1.md`  
**Change boundary:** Documentation only. No code, economics, V3 or Reveal semantics changed.

## 1. Decision

The traceability chain is not ready to be declared closed. The material supports a stable ownership boundary and a structural conformance prototype, but does not establish a complete production `EconomicFeeTarget → SettlementAmount → atomic settlement → observed evidence` implementation for the universal IMMORTAL Protocol Usage Fee.

**Closure classification:**

- **Architecture/ownership:** documented; principle-level boundary consolidated.
- **Rule authorization and target parameterization:** OPEN.
- **Reference qualification and conversion:** OPEN at deployment/production evidence level.
- **Production fee function:** NOT ESTABLISHED by the artifacts inspected here.
- **Cardano fee settlement and live evidence:** NOT ESTABLISHED by the artifacts inspected here.
- **Tests:** source-level structural checks exist; this audit did not execute them.

“Not established” means the inspected evidence is insufficient to claim closure. It is not a claim that no related work exists anywhere in the repository or workspace.

## 2. Repository and Notion triangulation

### Repository artifacts inspected on this branch

- `docs/COORDINATION/FRONT-FEE-GOVERNANCE-BUILD-INCENTIVES.md`
- `docs/COORDINATION/FRONT-IMMORTAL-TREASURY-FEE.md`
- `docs/COORDINATION/NOTION-MAP-IMPLEMENTATION-CROSSWALK-v0.1.md`
- `docs/COORDINATION/FEE-INCENTIVE-ADVERSARIAL-LAB-v0.1.md`
- `docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md`
- `audit/algorithmic-governability/fee-bearing-transition-separation-boundary.mjs`
- `audit/algorithmic-governability/reward-treasury-boundary.mjs`
- `src/mint.ts`
- `Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts`

Some coordination files contain historical branch labels referring to `work/immortal-green-closure`. They were fetched explicitly at the current B3 branch ref for this review; their embedded historical labels are not evidence that this review was performed on that branch.

### Notion design sources

- [Economic Usage Fee & Adapter Settlement Workflow v0.1](https://app.notion.com/p/3e0c4454d6d581f9b78fd05de6ea7763) — OPEN, IMMORTAL + Cardano Adapter scope, PRE-RICH excluded.
- [01 — Fee Ownership Matrix](https://app.notion.com/p/3e0c4454d6d581d89274e3009a371806) — CLOSED PRINCIPLE for ownership/separation; denomination, target, reference, rounding and affordability remain open.
- [08 — Parameter Selection Boundary & Cardano Adapter Settlement Conformance](https://app.notion.com/p/3e0c4454d6d581209701ffaf4c830408) — OPEN; boundary model stable, deployment parameters and Cardano conformance open.
- [09 — Existing State Machine + Cardano Settlement Conformance Overlay](https://app.notion.com/p/3e0c4454d6d5815cb608e8f3d7882803) — OPEN; fee belongs to a canonical transition, not a parallel economic lifecycle.
- [12 — Reference Unit, Target Function & Fee Affordability Formalization](https://app.notion.com/p/3e0c4454d6d5810789fcdf7aa7e8aba3) — OPEN; fixed/simple target in a reference unit is an initial candidate, not a frozen parameter.

## 3. Gap matrix

| Required link | What the inspected evidence supports | Closure gap |
|---|---|---|
| Fee semantics and owner | IMMORTAL owns protocol-fee semantics; Adapter realizes settlement; one fee category per transition | Principle-level architecture only; no adopted concrete universal fee policy |
| Authorized rule/version | Generalized derivation contract requires declared domain, rule, inputs, limits, evidence, version, contestability and exit | No concrete fee rule authorization/adoption record established in the inspected artifacts |
| Target denomination and amount | Notion introduces reference unit `U` and candidate `EconomicFeeTarget(S,A,Profile)`; initial fixed target is a candidate | No numeric target or complete production target function established; do not infer a value from PRE-RICH ticket prices |
| Input provenance | Generalized contract requires certified inputs; issue admission has a separate EEV evidence/provenance structure | No end-to-end fee-input packet bound to a fee-bearing transition established here |
| Price/reference evidence | Notion specifies identity, quote units/direction, freshness, provenance and deterministic selection requirements | No selected and qualified universal reference source or complete live reference packet established here |
| Conversion and rounding | Candidate conversion to discrete settlement amount with bounded error and fail-closed behavior | No concrete production converter/proof and deployment parameter set established here |
| Affordability and safety | Fee cannot override safety, viability, obligations, ProtectedCapital or atomicity | Structural harness consumes supplied booleans/statuses; it does not calculate/authenticate the underlying safety or affordability evidence |
| Adapter settlement | Cardano adapter code exists for application transactions; the fee harness contains an adapter-shaped projection | No fee-specific transaction construction/settlement/observation chain established here |
| Atomic commit and observation | Canonical transition identity is required by the structural harness | No live fee-bearing transaction with correlated pre-state, target, settlement, tx id and observed post-state established here |
| Reproducibility | Versioned contracts and test source exist | No test execution or CI run is claimed by this audit; no complete fee evidence digest/packet demonstrated here |

## 4. Important classification: PRE-RICH ticket payment is not proof of IMMORTAL Protocol Usage Fee

The inspected `src/mint.ts` describes an application-specific ticket issuance transaction:

- buyer payment is sent to the configured Treasury destination;
- ticket NFT delivery, counter update and PrizePool reserve update are part of the application transaction;
- `TICKET_PAYMENT_LOVELACE` is the concrete Preprod settlement amount;
- the source comment explicitly distinguishes that ADA amount from the USDM economic valuation `pdPriceUsdm`.

The file contains no `ProtocolUsageFee`, `EconomicFeeTarget` or `ChainExecutionCost` symbol in the inspected content. This supports a narrow classification: **the ticket payment is evidence of PRE-RICH application sale/settlement mechanics, not by itself evidence of the universal IMMORTAL Protocol Usage Fee.**

Do not reinterpret the current ticket sale payment, `DEFAULT_PRICE_USDM`, a Treasury destination, or the legacy Treasury distribution policy as the missing universal fee function.

The coordination front `FRONT-IMMORTAL-TREASURY-FEE.md` likewise warns that legacy `src/treasuryPolicy.ts`, `plutus/Treasury.hs` and `TreasuryDatum` are PRE-RICH/deployment representations, not a universal IMMORTAL Treasury primitive. A fee inflow is not automatically ProtectedCapital, RawSurplus, or unrestricted distributable value.

## 5. Important classification: authoritative Issue admission is not fee derivation

`Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts` describes itself as transport/integrity infrastructure. It validates an already-authoritative witness and includes EEV qualification, deployment approval, provenance, ProtectedCapital provenance and viability-certificate evidence.

That is relevant to PRE-RICH Issue admission. It does not establish that the universal Protocol Usage Fee target is derived or that the fee reference/conversion/settlement chain is implemented. The Issue admission evidence model must not be repurposed as proof of a separate fee contract without an explicit trace connecting each field to that contract.

## 6. What the structural test proves — and what it does not

`audit/algorithmic-governability/fee-bearing-transition-separation-boundary.mjs` checks structural properties using a fixture: separate fee and chain-cost identities, fail-closed reference/conversion statuses, a supplied safety flag, target preservation in an adapter-shaped result, and a canonical transition identity.

It does **not**:
- derive a fee amount from a certified state and an adopted function;
- qualify or authenticate an oracle/reference source;
- prove freshness or resistance to manipulation;
- perform bounded integer conversion/rounding against a real asset;
- measure actual Cardano execution cost;
- construct, submit and observe a fee-bearing transaction;
- prove that production on-chain state and off-chain evidence are atomically bound.

The test should therefore be described as structural boundary conformance, not an end-to-end fee implementation test.

## 7. Minimum next closure work (no new economics)

The next work should be evidence-first and should not invent values or formulas:

1. **Rule identity:** locate or create a decision record only through the existing authorized path, identifying the rule version and domain. Keep the amount and parameter selection OPEN until actually authorized.
2. **Call-site inventory:** search the B3 branch for all fee/settlement representations and classify each as universal IMMORTAL, adapter mechanism, PRE-RICH application payment, legacy Treasury, or research harness.
3. **Concrete derivation trace:** if a real fee producer exists, bind its inputs and outputs to the candidate transition and exact rule version. If not, record the implementation gap rather than substituting ticket price or chain fee.
4. **Reference and conversion evidence:** attach the actual selected asset/reference evidence, exact units, freshness result, deterministic selection result, rounding rule and rejection cases.
5. **Adapter realization:** correlate target, settlement amount, transaction body/witness, native chain execution cost and observed transaction/state.
6. **Safety/atomicity:** bind all gates to the same canonical pre-state/action and show that fee payment cannot bypass or diverge from the intended transition.
7. **Reproducibility:** execute the relevant focused tests/CI and record commit/run identifiers and a reproducible evidence packet. Do not claim live evidence without a real observation.

No new branch, fee amount, formula, oracle, threshold, or reward allocation is proposed by this gap report.

## 8. Paper-safe conclusion

> The repository and design corpus contain a documented Protocol Usage Fee ownership boundary and a structural conformance harness. The reviewed PRE-RICH ticket-payment path and Issue-admission witness are application-specific mechanisms, not proof of a completed universal fee function. The concrete authorized target, certified reference/conversion path, affordability evidence and end-to-end Cardano settlement remain unestablished by the evidence inspected for this review.

**Gate result: CLOSURE GAP CLASSIFIED — NO ECONOMIC OR CODE CHANGE — OPERATIONAL FEE EVIDENCE STILL REQUIRED.**
