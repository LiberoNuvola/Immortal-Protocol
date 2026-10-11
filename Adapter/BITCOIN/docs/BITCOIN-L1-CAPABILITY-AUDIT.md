# Bitcoin L1 Capability Audit — Research Boundary

**Status:** 🟡 capability classification advanced / 🔴 no Bitcoin conformance claim  
**Scope:** Bitcoin L1 as a possible IMMORTAL Adapter realization  
**Date:** 2026-10-11

## 1. Purpose

This document materializes the Bitcoin L1 capability research before selecting any concrete technology such as RGB, Taproot Assets or Liquid/Elements.

It is an Adapter audit, not a redesign of IMMORTAL economics.

The canonical machine remains:

`State → Candidate Action → Safety/Viability → Fee/valuation → Settlement realization → Atomic Commit → State′`

Bitcoin must be evaluated transition-by-transition against that machine.

## 2. Findings from the capability audit

### L1 — Commit
A Bitcoin transaction can commit to data and ownership conditions through transaction inputs/outputs, script and precommitted predicates.

**Result:** FEASIBLE at the Bitcoin transaction/UTXO level.

**Proof still required:** specify exactly what is committed, how it is bound to the IMMORTAL action/state, and what evidence proves that binding.

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
The Adapter can observe transaction IDs, inputs, outputs, scripts, amounts and block inclusion and construct evidence around those facts.

**Result:** FEASIBLE as an observation/evidence layer.

**Required proof:** define confirmation/finality policy and handle conflicting observations.

### L8 — Reorg / double-spend
Reorganizations and competing spends are part of the Bitcoin trust boundary.

**Result:** MUST be explicit in the Adapter.

The Adapter must define minimum/required confirmation state, pending-to-accepted transitions, reorg invalidation/downgrade, conflicting UTXO handling and stale-observation rejection. No single unconfirmed observation may be treated as irreversible settlement evidence.

### L9 — Economic execution equivalence
The required implication is stronger than merely observing a valid Bitcoin transaction:

`A_executable ⊆ A_safe(S,K∞)`

and, for executed effects, `ExecutedEconomicEffect ⇒ ExecAccept`.

The Adapter must establish the relationship between IMMORTAL Authorization, Economic Gate, Viability Gate, the concrete Bitcoin predicate/transaction and the observed post-state.

**Result:** OPEN / certification blocker. A valid Bitcoin transaction alone does not prove this implication.

## 3. Fee / valuation boundary

Bitcoin execution introduces an observable BTC fee, but three quantities must remain distinct: observed transaction cost; a proven worst-case fee envelope; and the valuation/conversion required by IMMORTAL.

Invalid or unavailable fee conversion must fail closed as **SAFE_STALL**, rather than silently becoming an accepted economic outcome. The Adapter cannot invent an exchange rate or treat a current fee quote as protocol-certified valuation.

## 4. Transition-by-transition capability matrix

The following matrix closes the *classification* of the current Bitcoin L1 boundary. It does **not** close implementation or conformance.

| IMMORTAL requirement | Current Bitcoin L1 realization | Enforced by Bitcoin consensus | Additional evidence / verification | Reorg/conflict treatment | Status |
|---|---|---|---|---|---|
| Commit | Transaction/UTXO commitment; optional Taproot script commitment | Transaction inclusion and encoded script conditions only | Bind commitment to IMMORTAL action, canonical pre-state and rule identity | Inclusion can be reorganized; revalidate anchor | FEASIBLE, binding OPEN |
| Lock | UTXO spend conditions, signatures, CLTV/CSV where applicable | Only the pre-encoded spending predicate | Verify ownership, locked value, script and intended obligation | Detect competing spend; pending is not final | FEASIBLE, profile-dependent |
| Reveal | Witness/script data or preimage satisfying a committed predicate | Only the encoded predicate, not arbitrary economic semantics | Verify reveal-to-commitment relation and IMMORTAL action binding | Reorg may remove reveal transaction | FEASIBLE, protocol binding OPEN |
| Expiration | CLTV/CSV, nLockTime/nSequence within their actual semantics | Encoded time/height spend condition | Bind deadline and terminal behavior; distinguish height from timestamp semantics | Re-evaluate after reorg; no inferred finality | FEASIBLE, profile binding OPEN |
| Settlement | Atomic UTXO transaction | Valid spends and outputs under Bitcoin consensus/script | Independently validate IMMORTAL admission and expected post-state | Conflicting spend/reorg invalidates prior observation | FEASIBLE as settlement, economic conformance OPEN |
| Dissolution | Precommitted terminal/refund spend path | Only the encoded terminal path | Prove terminal condition and ensure no unauthorized claim/liability | Detect reorg and conflicting terminal spend | FEASIBLE for bounded paths, conformance OPEN |
| Economic admission | IMMORTAL-side decision/evidence | **Not provided by Bitcoin L1** | Separately authenticated admission bound to state, rule, action and transaction | Stale admission or changed inputs must fail closed | OPEN / blocker |
| Post-state | Adapter reconstructs observed transaction/UTXO effects | Bitcoin authenticates inclusion and consensus-valid transaction, not IMMORTAL meaning | Deterministic reconstruction, source provenance and independent verification | Reorg-aware observation state machine required | OPEN / blocker |
| Fee / valuation | Actual BTC fee observable from transaction | BTC fee observable; USDM/economic value not supplied by consensus | Declared valuation source and proven bounds where required | Missing/stale valuation → SAFE_STALL | OPEN / blocker |
| Canonicality/finality | Header/chain-work observation under a declared verification profile | Consensus selects valid chain; explicit adapter verification/finality policy still required | Chain identity, header/transaction inclusion, confirmation policy and provenance | Reorg must revoke or downgrade observations | OPEN / profile-specific |

### Matrix interpretation

- **Consensus-enforced** means only what current Bitcoin consensus and the transaction's actual script enforce. It excludes off-chain policy, wallet, indexer, RGB client, federation or IMMORTAL evaluation.
- **Feasible** is not equivalent to **conformant**. The full L9 implication remains open.
- Transaction atomicity does not prove arbitrary cross-input/output economic relations.
- No arbitrary covenant/introspection ability is assumed.
- No future soft fork or unactivated proposal is treated as current consensus.

## 5. Gateway question

**Gateway: UNPROVEN / NOT NORMATIVE.**

The matrix does not prove a separate Settlement Gateway is necessary. A Gateway may be proposed only if a specific chain-neutral responsibility cannot properly belong to IMMORTAL Core or an individual Adapter and its authority/evidence boundary is specified. This audit does not insert a Gateway into the normative hierarchy.

## 6. Technology selection gate

No concrete Bitcoin implementation is selected by this document.

- **B1-Bitcoin:** explicitly declared external authority/federation profile; not trustless by definition.
- **RGB/client-side validation:** client-validated state anchored to Bitcoin; client validation alone does not establish B3 publisher-independent canonicality.
- **B3-Bitcoin:** publisher-independent consensus/proof target; blocked until its required enforcement/proof path is demonstrated using capabilities available on the target network.

No candidate may be promoted to an IMMORTAL primitive without an evidence packet proving the required trust and state-transition properties.

## 7. Required evidence before implementation claims

Evidence must cover concrete state observation and canonical serialization; state-transition validation and binding to IMMORTAL rule/action identity; authority/provenance verification; finality/reorg handling and conflict detection; fee/valuation boundaries and fail-closed behavior; economic-boundary preservation including L9; negative/adversarial cases; reproducible evidence packets; and explicit classification of every trust assumption.

For B3, evidence must additionally demonstrate the publisher-independent canonicality/proof path required by the applicable B3 specification.

## 8. Non-contamination rule

This audit does not modify IMMORTAL economic constants, ProtectedCapital, Economic Gate semantics, viability rules, PRE-RICH economics, Beacon semantics or Cardano Adapter semantics. Bitcoin-specific assumptions remain inside `Adapter/BITCOIN/`.

## 9. Next concrete packet

1. Select one research profile for a bounded demonstrator without calling it production.
2. Specify the canonical evidence envelope for transaction, input/output set, commitment, block/header identity and observation status.
3. Define the reorg transition table (pending → observed → accepted under declared policy; accepted → invalidated/downgraded on reorg).
4. Add a negative vector where a valid Bitcoin transaction lacks valid IMMORTAL admission.
5. Add a negative vector where post-state mismatch is detected despite valid transaction inclusion.
6. Compare the selected profile against the same IMMORTAL semantic fixture only after these boundaries are explicit.

Until these gates pass, Bitcoin remains a research Adapter profile only.
