# Aegis × IMMORTAL — Adaptive Admission Experiment v1

**Branch:** `b1-hardening`  
**Status:** offline experiment only; no Aegis source changes, no deployment, no production policy.  
**Baseline source:** `realdecimalist/aegis-contracts@6549246ff053457c93e6d68e44791efa2ef2f972`. The reviewed source contains the local Underwrite constraint `active_coverage * 3 <= post_total`.

## Why this is more than “make 33% dynamic”

The experiment compares a fixed local cap against an illustrative IMMORTAL-style admission decision with several inputs: reserve adequacy, capital headroom, stress state, and qualification of economic evidence. The intended product capability is a governed economic decision, with an explicit reason and a fail-closed outcome when required evidence is unavailable—not an arbitrary percentage generator.

## Reproduce

```bash
python3 scripts/aegis_immortal_adaptive_experiment.py
```

The script emits `aegis-immortal-adaptive-experiment-report.json` and checks:
- favourable headroom can permit a scenario the fixed 33% cap rejects;
- stress or weak reserve can reject a scenario the fixed cap accepts;
- invalid/unqualified evidence closes admission;
- favourable conditions do not override the calculated cap;
- each decision includes an explanatory reason.

## Important limitations

This is a synthetic comparison harness. It does **not** execute Aegis's Aiken predicate, reconstruct its exact `post_total` calculation, test a Cardano transaction, authenticate a live pool state, or prove the experiment-only policy is safe. The cap values and state bands are illustrative test parameters only—not proposed production constants. The ratio is a deliberately simplified test interface, not a claim that IMMORTAL's capital fields are equivalent to Aegis `backing`, `reserve`, `active_coverage`, or `pool_total`.

The 33% baseline is source-grounded; the adaptive policy is not. No conclusion about profitability or real capital efficiency follows from the synthetic cases.

## Workstream beyond the first experiment

### Track A — Dynamic admission policy
1. Specify canonical state inputs and authoritative sources.
2. Define policy versioning, bounds, monotonic safety properties, and explicit reasons for each admission decision.
3. Add hysteresis / staged recovery so capacity does not oscillate on small state changes.
4. Differentially test against Aegis's actual `underwrite_ok` semantics and validator context.

### Track B — Capital and reserve protection
1. Define a non-overlapping obligation partition; prohibit double counting.
2. Distinguish spendable backing, protected reserve, active coverage and any other liabilities; do not map fields by name.
3. Stress-test simultaneous claims, reserve depletion, oracle/evidence staleness and recovery after a shock.
4. Require post-transition invariants, not only a pre-transition score.

### Track C — Risk-specific controls
Explore whether distinct approved limits are useful for Barrier versus Depeg, term length, oracle confidence/freshness, or concentration. These are hypotheses for validation, not established gaps: Aegis already has risk classes, duration bounds, oracle mandates, freshness and actuarial logic.

### Track D — Portfolio-level admission
Only if Decimalist confirms shared capital or obligations spanning multiple pools/products, evaluate a global gate. The reviewed single-vault source does not establish that requirement.

### Track E — Explainability and evidence
Every decision should be reproducible from a versioned policy, a snapshot of qualified inputs, pre/post state, the reason for accept/reject, and an evidence digest. Missing or stale required evidence must fail closed.

### Track F — Integration path
Because Aegis is documented as mainnet-live and its vault is designed to be immutable, treat contract-level enforcement as a separate architecture decision. First identify whether the existing governed registry/eligibility path can safely carry the policy or whether a new contract generation is required. Never assume an off-chain check alone is enforceable or can prevent a hostile transaction.

## Advancement gates

Do not call this production-ready until:
- economic semantics and field mapping are approved by the relevant owners;
- policy thresholds are derived and governed, not copied from this toy harness;
- the same transition is evaluated against the actual Aegis predicate and validator-context constraints;
- adversarial and boundary tests pass, including stale evidence, reserve shortfall, concurrent claims, and recovery oscillation;
- the enforcement architecture is documented for a mainnet-live immutable vault;
- the test evidence clearly separates pure simulation, Aiken tests, transaction evaluation, and deployment evidence.
