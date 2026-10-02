# RGB / IMMORTAL Conformance Corpus

**Status:** 🟡 research harness specification / 🔴 no conformance claim
**Scope:** executable test vectors for the candidate RGB Adapter path
**Authority:** current IMMORTAL universal kernel and Economic Gate

## 1. Purpose

This corpus defines the first executable-proof boundary for RGB against IMMORTAL.
It does not implement RGB and does not select RGB. It defines deterministic vectors that a future RGB verifier and the IMMORTAL reference implementation must evaluate identically.

RGB documentation describes client-side validation, single-use seals, schema-defined validation and Bitcoin commitments. [RGB documentation](https://github.com/rgb-protocol/RGB-Documentation) [RGB Core](https://github.com/RGB-WG/rgb-core)

## 2. Canonical input model

Every vector must provide predecessor universal state; candidate post-state; EEV; EEV freshness flag; authoritative-truth flag; obligation-completeness flag; available executable liquidity; required immediate liquidity; safe-post-state flag; all-Ω-successors-in-certified-kernel flag; transition/schema/kernel version; predecessor/seal linkage status; Bitcoin anchor status; conflict/replay status; expected Economic Gate result; expected Viability Gate result; and expected execution-admissibility result.

No vector may introduce Bitcoin-specific economic constants.

## 3. Vector catalogue

| ID | Scenario | Economic Gate | Viability | Execution | Required purpose |
|---|---|---:|---:|---:|---|
| RGB-001 | solvent baseline | ACCEPT | ACCEPT | ACCEPT | positive control |
| RGB-002 | exact solvency boundary | ACCEPT | ACCEPT | ACCEPT | boundary equality |
| RGB-003 | insolvent candidate | REJECT | — | REJECT | ProtectedCapital |
| RGB-004 | negative state component | REJECT | — | REJECT | non-negative invariant |
| RGB-005 | negative EEV | REJECT | — | REJECT | EEV domain |
| RGB-006 | truth not verified | REJECT | — | REJECT | authoritative truth |
| RGB-007 | stale EEV | REJECT | — | REJECT | freshness |
| RGB-008 | obligations incomplete | REJECT | — | REJECT | obligation coverage |
| RGB-009 | negative available liquidity | REJECT | — | REJECT | liquidity domain |
| RGB-010 | negative required liquidity | REJECT | — | REJECT | liquidity domain |
| RGB-011 | required liquidity exceeds available | REJECT | — | REJECT | immediate settlement |
| RGB-012 | unsafe post-state | ACCEPT | REJECT | REJECT | Viability |
| RGB-013 | uncertified Ω successors | ACCEPT | REJECT | REJECT | certified Kc |
| RGB-014 | broken predecessor linkage | REJECT* | — | REJECT | state history |
| RGB-015 | replayed seal | REJECT* | — | REJECT | single-use property |
| RGB-016 | conflicting transition | REJECT* | — | REJECT | conflict handling |
| RGB-017 | unsupported version | REJECT* | — | REJECT | fail-closed versioning |
| RGB-018 | unconfirmed Bitcoin anchor | ACCEPT* | ACCEPT* | POLICY-BOUND | settlement finality boundary |
| RGB-019 | reorg-invalidated anchor | REJECT* | — | REJECT | reorg recovery |
| RGB-020 | confirmed valid anchor | ACCEPT* | ACCEPT* | ACCEPT* | end-to-end positive control |
| RGB-021 | terminal expiry | PROFILE | PROFILE | PROFILE | terminal semantics |
| RGB-022 | terminal dissolution | PROFILE | PROFILE | PROFILE | terminal semantics |

Note: the exact layer responsible for rejection must be specified by the final Adapter verifier; the corpus must not silently attribute an RGB/client-side failure to Bitcoin consensus.

## 4. Reference evaluation

For each vector x require RGBAccept(x) == IMMORTALAccept(x). For every accepted vector require RGBPostState(x) == IMMORTALPostState(x). For rejected vectors, the verifier must emit a canonical rejection class that maps to the IMMORTAL semantic reason.

The first implementation target is therefore a pure deterministic corpus, not a live Bitcoin transaction.

## 5. Adversarial cases

The corpus must explicitly cover mutation of each protected-capital component, EEV, freshness, truth verification, obligation coverage, liquidity, post-state safety, Ω certification, predecessor, seal replay, conflicting seal close, unsupported schema/kernel version, confirmation rollback, and reorg followed by a valid replacement transition.

## 6. Separation of proof layers

The harness must keep three results separate: (1) IMMORTAL reference evaluation — canonical economic result; (2) RGB validation result — client-side contract/state-transition result; (3) Bitcoin observation result — anchor/UTXO/confirmation/reorg evidence.

A passing result in one layer must not be interpreted as a passing result in another.

## 7. Oracle boundary

EEV and authoritative truth remain external inputs to the universal gate. The harness must distinguish authenticated observation accepted, observation present but unauthenticated, stale observation, and unavailable observation.

Unavailable or invalid economic observation must fail closed according to the existing SAFE_STALL boundary rather than inventing a valuation.

## 8. Promotion gate

RGB cannot be promoted from research candidate until all mandatory vectors have deterministic expected outcomes; the IMMORTAL reference evaluator passes; the RGB verifier produces matching outcomes; accepted post-states match canonically; rejection reasons are mapped; replay/conflict/reorg cases are evidenced; the authority boundary is documented; and no second undeclared economic authority is required.

## 9. Current status

**CORPUS SPECIFICATION: MATERIALIZED**

**IMMORTAL EXECUTION: OPEN**

**RGB EXECUTION: OPEN**

**Bitcoin live evidence: OPEN**

**CONFORMANCE CLAIM: NOT ESTABLISHED**

## 10. Non-contamination

This corpus does not modify IMMORTAL economics, ProtectedCapital, Economic Gate, Viability Gate, PRE-RICH, Cardano Adapter or Beacon semantics.
All Bitcoin/RGB-specific artifacts remain under Adapter/BITCOIN/.