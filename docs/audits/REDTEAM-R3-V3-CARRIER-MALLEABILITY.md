# RED TEAM — R3 V3 Carrier Decision-Binding Malleability

**Status:** CONFIRMED / RELEASE BLOCKER  
**Branch:** `work/immortal-green-closure`  
**Scope:** V3 economic-state carrier  
**Date:** 2026-10-10

## Finding

The V3 carrier currently authenticates **state continuity**, but not the **economic decision provenance** carried by `AdvanceV3State`.

The production validator `PRE-RICH/onchain/V3EconomicStateCarrier.hs` accepts an action when:

- the action class is one of Issue / Reveal / Claim / Expire;
- decision reference is non-empty;
- observation reference is non-empty;
- pre-state hash is non-empty and matches the consumed carrier datum;
- post-state hash is non-empty and matches the continuing output datum;
- the carrier singleton/version/value invariants hold.

The validator does **not** independently prove that:

- `decisionReference` identifies a canonical decision;
- `observationReference` identifies an authenticated observation;
- `actionFingerprint` is the canonical fingerprint of the economic action;
- the transition was produced by the authoritative economic admission path;
- an Issue transition is coupled to the corresponding atomic Issue effects.

## Concrete exploit

A caller that can spend the deployed V3 carrier can construct a structurally valid `AdvanceV3State` redeemer with arbitrary non-empty provenance fields and an arbitrary 32-byte `actionFingerprint`.

The on-chain checks only require:

```
bindingFieldValid decisionReference
bindingFieldValid observationReference
bindingFieldValid actionFingerprint
```

and then:

```
preHash  == canonicalV3StateHash(before)
postHash == canonicalV3StateHash(after)
```

Therefore the following can be internally self-consistent while carrying fabricated provenance:

```
carrier input
  -> arbitrary non-empty decisionReference
  -> arbitrary non-empty observationReference
  -> arbitrary actionFingerprint
  -> any structurally valid V3 after-state with version +1
  -> carrier continuation
```

The off-chain Issue path does construct the carrier redeemer from the authoritative admission witness, but that does not make the deployed carrier validator itself authoritative. The separate carrier spend surface remains structurally permissionless unless the transaction contains an independently verifiable decision binding.

## Why this is distinct from R2

R2 concerns the trustworthiness of the authority/relayer that produces the economic witness.

R3 is narrower:

> even with no compromised authority at all, the carrier validator currently does not require the on-chain transition to be the transition represented by a real economic decision.

Thus R3 is a **binding failure**, not an EEV valuation failure.

## Current impact

Potential impact includes:

- advancing the canonical V3 carrier without a corresponding economic admission;
- attaching fabricated decision/observation provenance to the resulting state transition;
- creating an authoritative-looking carrier history that cannot be reconstructed from a real decision record;
- bypassing the intended `economic decision -> carrier transition` relationship while preserving all current structural carrier checks.

The current deployment mint policy does not close this spend-time gap; it only constrains initial singleton creation.

## Required closure

Do not invent a second economic algorithm.

The closure must make the carrier consume an already-existing authoritative decision/binding mechanism and must independently verify the facts that are actually represented on-chain.

At minimum, release-grade closure must make the following relation non-malleable:

```
authenticated carrier pre-state
        +
canonical economic action
        +
canonical pre/post state
        +
decision/admission binding
        ↓
single carrier continuation
```

The implementation must come from the existing source-controlled architecture and preserve:

- V3 semantics;
- existing EconomicAdmissionWitness vocabulary;
- existing EEV boundary;
- existing B1 liquidity binding;
- existing singleton/version/value invariants.

No new coefficient, threshold, valuation rule, EEV source, or economic gate is justified by R3.

## Required adversarial conformance

The release suite must reject, at minimum:

1. changed `decisionReference` with identical state endpoints;
2. changed `authoritativeObservationReference` with identical state endpoints;
3. changed `actionFingerprint` with identical state endpoints;
4. a carrier-only Issue transition with no corresponding authoritative decision binding;
5. a replay/parallel spend using the same carrier input.

The positive path must still accept the real Issue transaction and preserve the exact candidate post-state.

## Classification

**R3 = CONFIRMED OPEN**

The existing `V3-ISSUE-CARRIER-BINDING-GAP.md` remains the architectural source of truth for the closure boundary.

This document records the red-team proof only. It does not change canonical economics and does not modify V3/Reveal semantics.
