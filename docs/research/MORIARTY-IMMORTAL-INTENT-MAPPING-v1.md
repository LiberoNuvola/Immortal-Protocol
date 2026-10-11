# IMMORTAL ↔ Moriarty — Intent Semantic Mapping v1

**Classification:** research / non-normative  
**Date:** 2026-10-11  
**Branch:** `work/b3-materios-provenance-evidence`

## 1. Purpose

This document records the first source-grounded mapping between IMMORTAL's chain-neutral Intent boundary and the real **Moriarty** language repository maintained by Charles Hoskinson.

It is a research/conformance surface only. It does not import Moriarty as a production dependency and does not modify IMMORTAL economics, governance, V3, Reveal, or the Cardano Adapter.

## 2. Source status

The Moriarty repository defines itself as a permissionless language of provable financial intention for Midnight and specifies a target architecture in which:

```
Intent → Plan → Episode → Stage
```

The current Moriarty intent-language design is explicitly marked **specified-only proposal**: the design describes the intended language and acceptance model, but its constructs are not thereby proven implemented or accepted by a milestone.

Moriarty's product contract separately requires authenticated intention, financial invariants, authority, complete effects and explicit residual duties, while preserving the distinction between signed intent, candidate execution and actual Midnight execution.

## 3. Current IMMORTAL Intent anchor

The repository currently exposes:

```
IssueIntent {
  action: "Issue"
  classId: bigint
  price: bigint
}
```

The object is deliberately:

- chain-neutral;
- non-authorizing;
- free of EEV, ProtectedCapital and liquidity claims;
- free of Cardano-specific transaction inputs.

It is therefore an **application-level transition request**, not a full Moriarty signed intent.

## 4. Source-grounded correspondence

| IMMORTAL surface | Moriarty concept | Relation |
|---|---|---|
| `IssueIntent.action` | intent/action selection | semantic anchor; not byte-equivalent |
| `IssueIntent.classId` | application-specific operation/terms | profile-specific field; no universal Moriarty mapping assigned |
| `IssueIntent.price` | financial quantity/budget/outcome constraint | profile-specific field; must not be silently reinterpreted |
| absence of admission data | signed intent vs acceptance relation | compatible separation; economic admission remains upstream in IMMORTAL |
| chain-neutral object | cross-domain `Intent` | compatible architectural property |
| adapter execution | Moriarty `Stage` / target execution | related but not equivalent; adapter remains responsible for chain realization |
| future proof/evidence | bound proof relation / execution evidence | requires explicit binding, not assumed by the Intent object |

## 5. Important non-equivalences

The current IMMORTAL `IssueIntent` does **not** carry the richer Moriarty semantics described by MIL/1, including:

- domain-qualified clocks and validity windows;
- structured asset identity and representation;
- gross debit / fee / net outcome bounds;
- observations and trust classes;
- authorities, budgets and revocation;
- replay identity and nonce/head controls;
- complete effects;
- persistent duties / liabilities;
- recovery and partial-completion semantics;
- canonical encoding and authenticated intent digest;
- declared residue.

These are not missing implementation bugs to patch into `IssueIntent` automatically. They are a **mapping/research boundary**. Some are application/profile concerns, some belong to a future universal Intent contract, and some are execution/proof obligations.

## 6. Architecture rule

The safe composition is:

```
IMMORTAL canonical economic semantics
        ↓
Economic Gate / Viability / authoritative admission
        ↓
IMMORTAL Intent
        ↓
Moriarty intent representation (future integration boundary)
        ↓
Moriarty acceptance / proof pipeline
        ↓
Midnight execution
        ↓
observed state + evidence
```

The following shortcut is forbidden:

```
Moriarty proof/result → redefine IMMORTAL economics
```

A Moriarty proof can establish the relation encoded by the Moriarty program and its bound intent. It does not, by itself, transfer economic authority from the IMMORTAL Kernel or PRE-RICH application policy.

Where the same predicate exists in both systems, a future integration must prove semantic correspondence rather than relying on similar names.

## 7. Intent / Admission / Execution boundary

The research now treats three separate objects as first-class:

```
Intent      = what is requested / authorized at the application-intent layer
Admission   = independently verified economic permission to execute
Execution   = concrete realization on a chain
```

Moriarty's own separation between Intent and Plan reinforces this boundary: a solver's plan is checked against the intent rather than becoming authoritative.

For IMMORTAL, this means a future Moriarty adapter must consume an already-authoritative economic admission and must not manufacture that admission from a Moriarty witness, solver result, or local evaluator output.

## 8. First conformance target

The first executable target is deliberately narrow.

A valid test must prove:

1. the same IMMORTAL Intent identity enters the mapping unchanged;
2. application-specific fields are preserved without invented reinterpretation;
3. missing economic admission is classified as unavailable, not inferred;
4. action mismatch is rejected;
5. no Moriarty field is treated as an IMMORTAL economic authority claim;
6. richer Moriarty-only constructs are reported as explicit residue/open mapping rather than silently dropped.

This is a boundary test, not a compiler correspondence proof.

## 9. Next research layers

### MRY-1 — Intent schema correspondence

Derive a field-by-field mapping for a single PRE-RICH Issue request, with explicit status:

`mapped` / `profile-specific` / `not represented` / `requires new normative decision`.

No field is added to IMMORTAL merely because Moriarty has it.

### MRY-2 — Canonical bytes and digest

Compare IMMORTAL's eventual action fingerprint/state binding with Moriarty's canonical intent encoding and digest rules.

The goal is not to reuse one hash as another. The goal is to prove whether the two identities can be linked without ambiguity.

### MRY-3 — Admission-to-intent binding

Define the exact relation:

```
EconomicAdmission
  └─ binds → Intent identity
```

The admission must remain authoritative independently of the Moriarty solver/plan.

### MRY-4 — Intent-to-execution proof binding

Determine how a Moriarty proof/accepted episode can carry the exact IMMORTAL Intent fingerprint into Midnight execution evidence.

### MRY-5 — Differential semantic vector

For one already-settled action, compare:

```
IMMORTAL reference result
        ↔
Cardano adapter realization
        ↔
Moriarty/Midnight realization
```

Only identical normalized semantics should count as differential evidence.

## 10. Non-regression

This research does not:

- introduce new economic constants;
- change KA/KC/KD;
- change 500×;
- change the PRE-RICH price ladder;
- alter V3 or Reveal;
- replace the Cardano adapter;
- declare a production Midnight Adapter;
- declare Moriarty a universal IMMORTAL language requirement;
- treat Moriarty's specified-only constructs as implemented proof capability.

## 11. Status

| Item | Status |
|---|---|
| Moriarty repository/source identified | **VERIFIED** |
| Moriarty = intent language for Midnight DeFi work | **VERIFIED** |
| Current IMMORTAL IssueIntent anchor | **PRESENT** |
| Full schema equivalence | **OPEN** |
| Admission binding | **OPEN** |
| Canonical byte/digest correspondence | **OPEN** |
| Real Moriarty → Midnight proof evidence | **OPEN** |
| Differential IMMORTAL/Cardano/Midnight evidence | **OPEN** |
| Production Midnight Adapter | **NOT STARTED** |

