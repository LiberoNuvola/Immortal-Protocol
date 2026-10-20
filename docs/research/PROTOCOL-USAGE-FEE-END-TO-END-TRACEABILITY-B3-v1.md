# IMMORTAL — Protocol Usage Fee End-to-End Traceability (B3 v1)

**Date:** 2026-10-20  
**Branch:** `work/b3-materios-provenance-evidence`  
**Classification:** RESEARCH / TRACEABILITY REVIEW / NON-NORMATIVE  
**Scope:** Existing Protocol Usage Fee design and structural boundary evidence  
**Change boundary:** Documentation only. No code, economic rule, parameter, adapter, V3 or Reveal semantics changed.

## 1. Executive finding

The repository and Notion material establish a coherent **architectural separation** for a candidate Protocol Usage Fee:

- IMMORTAL owns the meaning and authorized target of a protocol fee.
- The Adapter realizes settlement and reports chain-native execution cost.
- `ProtocolUsageFee != ChainExecutionCost`; conceptually, `TotalCost = ProtocolUsageFee + ChainExecutionCost`.
- Fee conversion must not change the economic target, bypass safety/viability constraints, or create a second canonical economic lifecycle.
- Missing or inadmissible evidence must fail closed; a fee alone is not a witness that a canonical transition is valid.

The current branch contains a structural JavaScript boundary harness and a generalized derivation contract. These are useful **prototype/conformance-boundary evidence**, not proof that a production fee function computes an economically correct amount, that a price reference is admissible in a real deployment, or that Cardano settlement has been measured end to end.

**Disposition: architectural boundary = documented and structurally exercised in source; concrete fee derivation, rule authorization, reference selection, parameterization, affordability, production adapter realization and reproducible live evidence = OPEN.**

The Notion workflow explicitly says PRE-RICH is out of scope for the universal fee design at this stage. PRE-RICH can be an application conformance fixture only; it must not define universal IMMORTAL fee semantics.

## 2. Sources triangulated

### Repository sources

1. `docs/COORDINATION/FRONT-FEE-GOVERNANCE-BUILD-INCENTIVES.md` — research status, fee/reward separation, governance boundary, candidate function family.
2. `docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md` — non-normative boundary `B = (D,R,I,L,E,V,C,X)`, candidate certification and authorized adoption.
3. `audit/algorithmic-governability/fee-bearing-transition-separation-boundary.mjs` — executable structural checks for fee/chain-cost separation, canonical transition identity, reference/conversion failure, and safety precedence.
4. `audit/algorithmic-governability/reward-treasury-boundary.mjs` — adjacent accounting boundary; not a fee calculator and not evidence of actual Treasury balances.

### Notion sources

- [Economic Usage Fee & Adapter Settlement Workflow v0.1](https://app.notion.com/p/3e0c4454d6d581f9b78fd05de6ea7763)
- [01 — Fee Ownership Matrix](https://app.notion.com/p/3e0c4454d6d581d89274e3009a371806)
- [08 — Parameter Selection Boundary & Cardano Adapter Settlement Conformance](https://app.notion.com/p/3e0c4454d6d581209701ffaf4c830408)
- [09 — Existing State Machine + Cardano Settlement Conformance Overlay](https://app.notion.com/p/3e0c4454d6d5815cb608e8f3d7882803)
- [12 — Reference Unit, Target Function & Fee Affordability Formalization](https://app.notion.com/p/3e0c4454d6d5810789fcdf7aa7e8aba3)

The master Notion workflow is marked **OPEN** and explicitly lists parameterization, reference/freshness, bounded conversion, rounding, oracle failure, affordability, adapter conformance, adversarial testing and decision record as work to verify before closure. Its PRE-RICH exclusion is retained here.

## 3. Traceability chain

| Stage | Existing contract/evidence | Assessment |
|---|---|---|
| 1. Normative owner | IMMORTAL owns fee semantics; Adapter owns chain-specific settlement | Architectural boundary documented |
| 2. Authorized rule | `EconomicFeeTarget(S,A)` is a candidate function; rule-space and bounds must be externally declared/versioned | No concrete frozen fee rule established by this review |
| 3. Certified inputs | Generalized contract requires certified state/environment inputs and evidence contract | Production input producer/binding not demonstrated by these artifacts |
| 4. Derivation | Candidate target `EconomicFeeTarget(S,A)` | No production fee amount calculation established by the inspected structural harness |
| 5. Reference admissibility | Notion requires asset identity, quote direction/unit, freshness, provenance, deterministic selection and transaction-context consistency | Requirements documented; live source qualification and end-to-end evidence remain open |
| 6. Conversion | Candidate `SettlementAmount(asset,S,A)`; bounded discrete conversion and explicit failure on unsupported granularity | Design boundary documented; production implementation/proof not established here |
| 7. Economic gates | Fee must not bypass safety, viability, obligations, protected capital or atomicity | Structural harness checks a supplied `safe` value; it does not independently compute or authenticate safety |
| 8. Adapter settlement | Adapter realizes the target, reports native execution cost and preserves target identity | Structural projection only; no real Cardano fee-settlement evidence established here |
| 9. Atomic transition | Fee is a condition on a canonical transition, not a parallel `FEE_PENDING → FEE_PAID` economic state machine | Structural identity and rejection checks exist; production atomicity proof remains open |
| 10. Evidence packet | Deterministic/versioned rule, input provenance, reference, conversion, transaction and post-state evidence | Complete reproducible fee evidence packet not demonstrated by these sources |

## 4. What the current structural harness actually checks

In `fee-bearing-transition-separation-boundary.mjs`, the reviewed source:

- distinguishes the protocol fee identity from chain execution cost;
- preserves two separate cost components in a total-cost observation;
- rejects missing/non-record candidates, blank identities, inherited identity/safety fields, and accessor-backed safety/reference fields;
- returns a safe-stall result for an invalid fee reference and rejects an invalid conversion;
- prevents a supplied `safe: false` value from being overridden by fee validity;
- preserves the supplied `EconomicFeeTarget` through the adapter-shaped projection;
- requires a canonical transition identity, so fee validity alone cannot serve as a canonical transition witness;
- rejects the model of a second fee-only canonical lifecycle.

This is meaningful structural adversarial coverage. However, the fixture supplies opaque strings such as `target-opaque` and `amount-opaque`, and supplies statuses such as `feeReferenceStatus: 'VALID'`, `conversionStatus: 'VALID'`, and `safe: true`. It does **not** derive a fee from certified economic inputs, authenticate those assertions, validate an oracle, perform a real discrete conversion, inspect a Cardano transaction, or prove that a real canonical commit is atomic. A passing fixture is not proof of those omitted operations.

The adjacent `reward-treasury-boundary.mjs` explicitly describes itself as a structural accounting boundary. It does not supply a missing fee calculator or establish a production revenue balance.

## 5. Open decisions that must remain open

The source set does not justify freezing any of the following in this report:

- target denomination and whether the target is fixed, parameterized or state-dependent;
- concrete values, coefficients or bounds for `EconomicFeeTarget`;
- a canonical settlement asset or price source;
- reference-source independence, aggregation/quorum, freshness thresholds or manipulation envelope;
- conversion error tolerances and conservative rounding;
- behavior for a target smaller than the asset's minimum representable unit;
- the concrete affordability gate and its relation to chain execution cost;
- which deployed transitions are fee-bearing;
- whether and how fee revenue can later fund rewards;
- any PRE-specific fee, PRE oracle, PRE price, or PRE-RICH policy as universal IMMORTAL semantics.

The candidate non-blocking property and expression `Q_asset ≈ EconomicFeeTarget / PriceReference(asset)` remain research proposals, not closed universal guarantees.

## 6. Required evidence to close the chain

The next closure packet should connect, without substituting structural fixtures for operational evidence:

1. **Rule identity:** authorized function/rule version, domain, limits and adoption authority.
2. **Input packet:** canonical state/action identity, certified input values, source/provenance references, snapshot/slot/time and freshness result.
3. **Derivation record:** deterministic input-to-target result with versioned algorithm and reproducible digest.
4. **Reference packet:** settlement asset identity, quote unit/direction, source qualification, selection result, freshness and manipulation bounds.
5. **Conversion packet:** exact arithmetic, discrete asset units, rounding/error bound, and explicit rejection for unsupported granularity.
6. **Gate packet:** safety/viability/obligation/liquidity results bound to the same state/action and rule version; no free Boolean substituted for its authoritative evidence.
7. **Adapter packet:** constructed transaction, native chain execution cost, target and settlement amount kept separate, submitted/observed transaction identity.
8. **Atomicity/post-state packet:** proof that required fee settlement and the intended canonical transition cannot diverge, plus observed post-state.
9. **Reproduction:** pinned versions, deterministic fixture(s), adversarial negative cases, CI run/commit identity and, where claimed, actual chain observation.

These are evidence requirements inferred from the existing design boundary; this report does not claim that the packets already exist.

## 7. Paper-safe claim

A defensible statement is:

> IMMORTAL has a documented, chain-neutral Protocol Usage Fee design boundary separating protocol fee semantics from adapter settlement and native chain execution cost. A structural conformance harness exercises separation, fail-closed handling and transition-identity constraints. The concrete target function, authorized parameterization, production reference/conversion path, affordability proof and end-to-end adapter evidence remain open.

Do **not** claim from the inspected artifacts alone that IMMORTAL has a completed production fee algorithm, a proven non-blocking fee guarantee, a qualified live oracle, a Cardano settlement implementation verified end to end, or universal cross-adapter conformance.

## 8. Change and verification record

- Review performed against the existing B3 branch files and the cited Notion workflow.
- Documentation-only report; no economic policy or code changed.
- No CI/test run is claimed by this review.
- No claim is made that live fee-bearing Cardano transactions were submitted or observed.
- V3 and Reveal semantics were not changed.

**Gate result: TRACEABILITY DOCUMENTED — IMPLEMENTATION / LIVE EVIDENCE OPEN.**
