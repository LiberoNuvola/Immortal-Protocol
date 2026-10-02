# Bitcoin L1 Capability Audit — Research Boundary

**Status:** 🟡 research materialized / 🔴 no Bitcoin conformance claim  
**Scope:** Bitcoin L1 as a possible IMMORTAL Adapter realization  
**Date:** 2026-09-27

## 1. Purpose

This document materializes the earlier Bitcoin L1 capability research before selecting any concrete technology such as RGB, Taproot Assets or Liquid/Elements.

It is an Adapter audit, not a redesign of IMMORTAL economics.

The canonical machine remains:

`State → Candidate Action → Safety/Viability → Fee/valuation → Settlement realization → Atomic Commit → State′`

Bitcoin must be evaluated transition-by-transition against that machine.

## 2. Findings from the earlier audit

### L1 — Commit

A Bitcoin transaction can commit to data and ownership conditions through transaction inputs/outputs, script and precommitted predicates.

**Result:** FEASIBLE at the Bitcoin transaction/UTXO level.

**Proof still required:** the Adapter must specify exactly what is committed, how the commitment is bound to the IMMORTAL action/state, and what evidence proves the binding.

### L2 — Lock / controlled spend

Bitcoin Script, timelocks and UTXO ownership conditions can constrain when and under which spending conditions an output can be spent.

**Result:** FEASIBLE for explicitly expressible predicates.

**Boundary:** this does not imply arbitrary covenant-style control over future transaction structure.

### L3 — Reveal

A reveal can be represented by a later transaction satisfying a precommitted predicate or revealing committed data.

**Result:** FEASIBLE for a protocol designed around Bitcoin's available Script primitives.

**Boundary:** rich Cardano-style cross-output/state inspection must not be assumed.

### L4 — Expiration

Absolute/relative timelocks can enforce time-based spending constraints.

**Result:** FEASIBLE for timelock-compatible expiration semantics.

**Required evidence:** exact block/height/time interpretation, reorg treatment, and terminal behavior after expiration.

### L5 — Settlement

Bitcoin can settle BTC-denominated value through ordinary UTXO transfers and script-constrained spends.

**Result:** FEASIBLE as a settlement realization.

**Boundary:** settlement capability is not proof that IMMORTAL economic admission was enforced by Bitcoin consensus.

### L6 — Terminal dissolution

A terminal state can be represented by a final spend path when the required predicate is expressible in Script.

**Result:** FEASIBLE for bounded, predesigned terminal paths.

**Boundary:** arbitrary state-dependent dissolution rules cannot be assumed to be enforceable on L1.

### L7 — UTXO / transaction / block evidence

The Adapter can observe transaction IDs, inputs, outputs, scripts, amounts and block inclusion and can construct evidence around those facts.

**Result:** FEASIBLE as an observation/evidence layer.

**Required proof:** the evidence must define confirmation/finality policy and handle conflicting observations.

### L8 — Reorg / double-spend

Reorganizations and competing spends are part of the Bitcoin trust boundary.

**Result:** MUST be explicit in the Adapter.

The Adapter must define:
- minimum/required confirmation state;
- how an observed transaction moves from pending to accepted;
- how a reorg invalidates or reopens an observation;
- how double-spend/conflicting UTXO observations are represented;
- how stale observations are rejected.

No single unconfirmed observation may be treated as irreversible settlement evidence.

### L9 — Economic execution equivalence

The earlier audit left this **UNPROVEN**.

The required implication is stronger than merely observing a valid Bitcoin transaction:

`A_executable ⊆ A_safe(S,K∞)`

and, for executed effects,

`ExecutedEconomicEffect ⇒ ExecAccept`

The Adapter must also establish the relationship between:
- IMMORTAL Authorization;
- Economic Gate;
- Viability Gate;
- the concrete Bitcoin predicate/transaction;
- the observed post-state.

**Result:** OPEN / certification blocker.

A valid Bitcoin transaction alone does not prove this implication.

## 3. Fee / valuation boundary

Bitcoin execution introduces an observable BTC fee, but the earlier audit explicitly distinguished:

- observed transaction cost;
- a proven worst-case fee envelope;
- the valuation/conversion required by IMMORTAL.

Invalid or unavailable fee conversion must fail closed as a **SAFE_STALL**, rather than silently becoming an accepted economic outcome.

The Adapter therefore cannot invent an exchange rate or treat a current fee quote as a protocol-certified valuation.

## 4. What the audit did NOT establish

The earlier work did **not** establish that:

- Bitcoin L1 is already conformant with IMMORTAL;
- Bitcoin Script can reproduce arbitrary Cardano validator/state semantics;
- RGB is the chosen implementation;
- Liquid/Elements is the chosen implementation;
- Taproot Assets is the chosen implementation;
- future covenant proposals are active consensus;
- a Gateway is necessary;
- a Gateway is unnecessary in every future realization.

Those are separate research or implementation decisions.

## 5. Gateway question

The earlier architecture work did not prove a Settlement Gateway was necessary.

Therefore the current status is:

**Gateway: UNPROVEN / NOT NORMATIVE.**

The correct next test is transition-by-transition realization. Introduce a Gateway only if the Bitcoin Adapter cannot satisfy a required IMMORTAL boundary directly and the additional trust/verification boundary is explicitly specified.

## 6. Required conformance matrix

Before implementation/conformance, each supported transition must have all of:

| IMMORTAL requirement | Bitcoin realization | Consensus-enforced? | External/client evidence? | Reorg behavior | Status |
|---|---|---:|---:|---|---|
| Commit | UTXO/script/commitment | TBD | TBD | TBD | OPEN |
| Lock | Script + timelock/predicate | TBD | TBD | TBD | OPEN |
| Reveal | Precommitted predicate/data reveal | TBD | TBD | TBD | OPEN |
| Expiration | CLTV/CSV-style constraint | TBD | TBD | TBD | OPEN |
| Settlement | BTC UTXO spend | TBD | TBD | TBD | OPEN |
| Dissolution | Terminal spend path | TBD | TBD | TBD | OPEN |
| Economic admission | IMMORTAL-side proof/evaluation | NO L1 claim | REQUIRED | REQUIRED | OPEN |
| Post-state | Adapter observation + verification | NO L1 claim | REQUIRED | REQUIRED | OPEN |

This table is intentionally a research matrix, not a conformance assertion.

## 7. Technology selection gate

Only after the L1 capability matrix is complete should a concrete realization be selected.

Candidate research profiles already separated by the trust-model document:

- **B1-Bitcoin:** explicit external authority/federation.
- **RGB/client-side validation:** Bitcoin anchoring plus client-side state validation.
- **B3-Bitcoin:** consensus/proof-based publisher-independent target.

No candidate may be promoted to an IMMORTAL primitive without an evidence packet proving the required trust and state-transition properties.

## 8. Non-contamination rule

This audit does not modify:
- IMMORTAL economic constants;
- ProtectedCapital;
- Economic Gate semantics;
- viability rules;
- PRE-RICH economics;
- Beacon semantics;
- Cardano Adapter semantics.

Bitcoin-specific assumptions remain inside `Adapter/BITCOIN/`.

## 9. Next concrete research packet

The next Bitcoin research packet should answer, with sources and executable/provable examples where applicable:

1. exact Bitcoin Script capabilities relevant to each transition;
2. covenant/introspection limitations of current Bitcoin consensus;
3. timelock semantics and reorg consequences;
4. descriptor/PSBT/signing boundaries;
5. RGB client-side validation trust and state-transition evidence;
6. Liquid/Elements federation trust and enforcement boundary;
7. Taproot Assets trust/state model;
8. whether any candidate can satisfy L9 without importing a second economic authority;
9. whether a Gateway is required for any uncovered transition.

Until that packet exists, Bitcoin remains a research Adapter profile only.
