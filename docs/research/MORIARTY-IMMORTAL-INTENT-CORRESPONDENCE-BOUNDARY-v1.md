# IMMORTAL — Moriarty / Intent Correspondence Boundary v1

**Classification:** research / executable conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## 1. Verified upstream reference

Upstream research target:

- Repository: `CharlesHoskinson/Moriarty`
- Current observed commit: `3748fe8278287a3729c17c5ddc245f669e21e847`
- Native owner-intent profile: `moriarty-owner-intent/2`
- Primary source: `crates/mori-core/src/intent.rs`

Moriarty is a bounded financial language for Midnight. Its owner-intent model is explicitly richer than the current IMMORTAL PRE-RICH IssueIntent.

## 2. Correspondence

Current IMMORTAL application intent:

`IssueIntent = { action, classId, price }`

Verified Moriarty OwnerIntent contains:

`{ profile, source_hash, program_hash, semantics, action, scenario_hash, assets, authority }`

and its Authorization contains source/chain/account identity, signing scheme/key, nonce/predecessor, validity interval and per-asset gross/fee/net/liability limits.

Therefore:

`Moriarty OwnerIntent != IMMORTAL IssueIntent`

The current relation is a **profile-scoped semantic projection**, not schema equivalence.

## 3. Required boundary

The only safe pipeline is:

`Moriarty source/OwnerIntent → validated semantic projection → IMMORTAL Intent → separately certified Economic Admission → Adapter execution`

A projection must not:

- invent missing fields;
- convert omitted authority constraints into defaults;
- manufacture Economic Admission;
- treat a valid signature as ledger authority;
- treat a solver-selected execution plan as owner intent;
- silently change the requested action or application coordinates.

## 4. Identity layers

Three identities remain distinct:

1. **Source identity:** source/profile/program/semantics/scenario.
2. **Application intent identity:** requested IMMORTAL action and profile coordinates.
3. **Economic admission identity:** certified decision over canonical state.

The same bytes, hash or signature must not be reused as a substitute for a different identity layer unless an explicit verified binding says so.

## 5. Promotion states

- **MAPPED:** semantic relation is explicitly declared and all required authority-bearing data is preserved or separately bound.
- **UNVERIFIABLE:** required binding or authority-bearing information is absent.
- **REJECTED:** action identity or bound semantics conflict.

A successful mapping does not itself mean that an IMMORTAL economic transition is admissible.

## 6. Relation to Workflow B

This boundary strengthens:

- generalized derivation: Intent is an input contract, not a derived economic result;
- EXP-05: abstract action/claim interfaces must preserve source semantics;
- EXP-06: source and evidence identities remain explicit;
- EXP-12: observation/signature/source evidence cannot self-promote into economic authority;
- multi-adapter semantics: Cardano and future Midnight execution consume the same already-certified semantic admission rather than recalculating it.

## 7. Non-regression

This research does not modify PRE-RICH economics, V3, Reveal, B3 Materios semantics, Governance, or the Cardano Adapter.

It does not make Moriarty a dependency and does not declare a production Midnight Adapter.

**Status:** Moriarty source reference VERIFIED; semantic boundary executable; source-to-production admission/ledger binding OPEN.
