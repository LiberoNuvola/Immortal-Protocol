# Aegis × IMMORTAL — Value-Oriented Gap Analysis v1

**Status:** research hypothesis; not a claim of Aegis deficiency or integration readiness.  
**Target branch:** `b1-hardening`  
**Aegis source baseline:** `realdecimalist/aegis-contracts@6549246ff053457c93e6d68e44791efa2ef2f972`  
**Aiken baseline:** IMMORTAL workflow run [#1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38286601502) succeeded; Aegis README and CI report 1,162 Aiken tests, 0 failures.

## 1. Executive conclusion

Do not pitch “Aegis conforms to IMMORTAL” as a product benefit. Aegis already has substantial protocol-specific controls: a 33% active-coverage cap in Underwrite, reserve accounting, exact transition equations, LP-share protections, oracle/registry controls, and a large regression/security corpus. Repackaging those controls under IMMORTAL would be redundant unless a differential test proves otherwise.

The only promising value hypothesis worth testing first is **portfolio-level economic protection across multiple pools, products, or shared obligations**: IMMORTAL may provide a common liability-first state model and admission rule that is not naturally visible to a single pool's local invariant checks. This is a hypothesis, not a finding that Aegis currently lacks such controls. The inspected public repository describes a single pool/vault model; no source evidence reviewed so far establishes that Aegis currently has cross-pool liabilities or requires a shared treasury.

**Decision gate:** if Aegis has no multi-pool/shared-obligation use case, and its intended risk perimeter is entirely captured by its existing vault-level rules, this integration may have no meaningful product value. Stop or redirect rather than manufacture a gap.

## 2. What Aegis already does (do not sell as new)

At the pinned source baseline:

- Underwrite checks positive coverage/premium, non-negative net growth, continuation lovelace accounting, policy funding/marker creation, and `active_coverage * 3 <= post_total`.
- Claim and Expire have dedicated accounting predicates and validator arms; Claim includes reserve-first draw logic in the inspected implementation.
- The vault has LP share inflation protections, exact value-continuity checks, pool-NFT identity, registry governance rails, and oracle/settlement constraints.
- The Aegis README reports 1,162 passing Aiken tests and documents previous audit, symbolic/property testing, and mainnet live-fire work. Those claims are source-reported; this bridge does not independently re-audit them.

Therefore, “better solvency,” “safer claims,” “stronger auditability,” and “more tests” are not sufficient pitches by themselves. We must show a property that Aegis's current architecture does not already enforce.

## 3. Candidate incremental capability

### Hypothesis H1 — Global economic admission across a wider perimeter

If Aegis later operates multiple pools/products or has obligations/reserves shared across components, a chain-neutral IMMORTAL kernel could evaluate a **single qualified economic state across that perimeter** before authorizing a new risk commitment. This differs from the current local Underwrite cap only if the global perimeter includes real, non-duplicated obligations or protected capital that cannot be represented by the individual vault state.

Potential output:
- a reproducible pre-state/post-state economic decision;
- a reasoned allow/reject result for a proposed new commitment;
- evidence identifying the exact assets, liabilities, reserves, and protected-capital components included;
- a fail-closed result when the evidence or asset perimeter is incomplete.

This must not be implemented as an off-chain advisory flag that the protocol can ignore if the intended claim is enforcement. Any enforcement design must specify who verifies the result and where the constraint is applied.

### Preconditions (all required)

1. Aegis/Decimalist confirms a real use case involving multiple pools, products, or shared obligations.
2. A source-grounded inventory proves which liabilities/assets are not already represented by existing Aegis constraints.
3. An approved mapping defines asset denomination, qualified UTxOs, reserve treatment, liability partition, and no-double-counting rules.
4. The resulting rule is compatible with Aegis's deployed architecture, governance, transaction-size budget, and settlement guarantees.
5. A comparative test shows the added gate rejects a state the existing Aegis rules would accept **and** that the rejection is required by an approved economic policy—not merely by a new arbitrary threshold.

## 4. Falsifiable experiment

Build a differential test harness around the pinned Aegis version, but do not claim a benefit until a legitimate counterexample exists.

| Test | Aegis-only result | IMMORTAL-assisted result sought | Decision |
|---|---|---|---|
| A. Existing single-vault happy paths | Preserve all valid Underwrite/Claim/Expire transitions | Same result, no unexplained state drift | Required compatibility |
| B. Local cap boundary | Existing 33% cap behaves as designed | Must not reject valid states without an approved additional rule | Detect redundant/over-restrictive gate |
| C. Wider-perimeter obligation | Establish whether local vault state omits a real shared obligation | Reject only if qualified global state violates an approved protected-capital invariant | Potential product value |
| D. Missing/stale/unqualified evidence | Existing Aegis behavior recorded as baseline | Fail closed, with explicit reason; no guessed EEV or asset conversion | Evidence robustness |
| E. Double counting | Model policy UTxO and aggregate coverage without duplication | Reject invalid projection / preserve exact obligation count | Mapping correctness |

For each case, capture the exact Aegis source commit, authenticated inputs, pre-state, transition, post-state, validator/test path, IMMORTAL profile version, and reason for any decision difference. Compare after every transition, not just final balances.

**Important:** Case C cannot be populated with invented liabilities. It remains blocked until a real source/spec/business scenario is supplied. Synthetic adversarial values may test the math, but cannot establish that Aegis has this product need.

## 5. Other hypotheses to defer

- **Portable economic evidence / audit packet:** potentially useful to integrators or auditors, but alone it is an assurance artifact rather than a new on-chain capability.
- **Generic solvency gate for the existing single pool:** likely redundant until demonstrated otherwise, because Aegis already has a local coverage cap and accounting constraints.
- **Automatic reserve-first Claim behavior:** not a new IMMORTAL feature; reserve-first arithmetic already appears in the pinned Aegis source.
- **Changing Aegis economics or thresholds:** out of scope. IMMORTAL must not invent Aegis policy.

## 6. Current evidence and boundaries

- The pinned Aiken baseline passed: [workflow run #1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38286601502).
- The fixture harness passed 11 fixture/cases and 26 arithmetic/invariant checks: [run #3](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38286264331). This checks fixture consistency, not full validator execution or IMMORTAL economic conformity.
- Existing bridge fixtures retain `immortal_projection: UNVERIFIABLE`; this remains correct until an economic profile is approved.
- No Aegis source has been changed by this research.
- No deployment, merge, or certification is implied.

## 7. Next action

Before implementing an economic gate, complete a **source-grounded scope check** with two outputs:

1. A table of every relevant Aegis invariant and where it is enforced (pure predicate, validator context, ledger guarantee, off-chain component, or not established).
2. A precise answer to this question: *Does Decimalist have, or plan to have, a cross-pool/shared-obligation risk that Aegis's current per-vault checks do not cover?*

If the answer is no, do not force this integration. If yes, use the real scenario to define the smallest differential test that proves incremental value.
