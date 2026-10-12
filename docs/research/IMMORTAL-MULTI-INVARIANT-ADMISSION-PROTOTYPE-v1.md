# IMMORTAL Multi-Invariant Economic Admission Prototype v1

**Branch:** `b1-hardening`  
**Classification:** synthetic, offline research only.  
**Purpose:** test whether IMMORTAL can coordinate several economic invariants in one admission decision, rather than merely replace a fixed coverage percentage with a dynamic one.

## Prototype decision

The synthetic evaluator checks all of the following together:
- qualification of economic evidence (fail closed);
- non-negative numeric inputs and a non-zero qualified asset base;
- reserve component meets a minimum floor;
- total existing plus proposed coverage remains below a dynamic coverage cap;
- qualified assets cover protected capital plus existing and proposed coverage;
- high stress is paired with a contracted cap.

It returns a decision and explicit rejection reasons. This is a test of the generalizable *shape* of a decision interface, not a production economic algorithm.

## Accounting convention / double-counting guard

In this prototype, `protected_capital` already includes `reserve_component`. Reserve is checked against its floor, but is not subtracted a second time in the headroom equation:

`post_admission_headroom = qualified_assets - protected_capital - existing_coverage - proposed_coverage`

The convention is intentionally explicit so the same reserve cannot be counted twice. It is not a claim that these fields map directly to Aegis's `backing`, `reserve`, `active_coverage`, or `pool_total`.

## Differential cases

The synthetic matrix includes:
- a favourable case where a 40% illustrative dynamic cap accepts an operation rejected by a 33% fixed comparison;
- a reserve-floor breach that passes the simple fixed-ratio comparison but fails the combined gate;
- a protected-capital shortfall that passes the fixed-ratio comparison but fails the combined gate;
- a stricter dynamic cap that rejects an operation otherwise within the fixed comparison;
- high stress with an insufficiently contracted cap;
- unqualified evidence, negative inputs and zero qualified assets;
- a case where all prototype invariants pass.

## Reproduce

```bash
python3 scripts/immortal-multi-invariant-admission.py
```

The script writes `immortal-multi-invariant-admission-report.json` and asserts expected outcomes and the no-double-counting equation.

## What this does not prove

- It does not run Aegis's actual Aiken predicate or a Cardano transaction.
- It does not establish that Aegis lacks any of these controls in its full system.
- It does not validate the illustrative thresholds or constitute approved IMMORTAL economics.
- It does not demonstrate production safety, increased profit, or capital efficiency.
- It does not prove a shared multi-pool obligation exists in Aegis.

## Next technical gate

Replace the abstract local-cap comparison with a source-grounded differential model of the actual Aegis `underwrite_ok` semantics and its validator context, while keeping IMMORTAL accounting concepts separate until a field-by-field mapping is explicitly justified. Then add state-transition and adversarial tests for simultaneous claims, reserve depletion, stale evidence, post-transition obligations, and recovery oscillation. Keep all research in IMMORTAL until evidence warrants any external proposal.
