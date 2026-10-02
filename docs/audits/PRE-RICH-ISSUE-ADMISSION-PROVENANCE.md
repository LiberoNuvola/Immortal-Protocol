# PRE-RICH Issue Admission — Provenance Boundary

**Status:** TRIANGULATED / PRODUCER OPEN  
**Date:** 2026-09-27  
**Scope:** PRE-RICH Issue admission on Cardano

## Finding

The repository already contains the economic admission algorithm, the Cardano liquidity observation surface, and the Issue refinement boundary. It does **not** contain a concrete authoritative producer that supplies the complete economic evidence required by the admission witness.

The normative sequence is:

```
Cardano observation
  -> authoritative/refinement evidence
  -> EEV snapshot
  -> Economic Gate
  -> Viability
  -> EconomicAdmissionWitness
  -> Cardano Issue transaction
```

## Existing authoritative machinery

### 1. Issue refinement

`PRE-RICH/profile/PreRichIssueEvidence.ts` validates class identity, canonical price, activation bounds, issued count and cap. It establishes whether the requested Issue class is saleable. It does not establish EEV, ProtectedCapital, viability or Ω certification.

### 2. Cardano observation/projection

`PRE-RICH/profile/PreRichCardanoObservationProjection.ts` can project observed unresolved tickets and authenticated class/pool data into the PRE-RICH V3 representation. It deliberately requires protected-capital components and control state as supplied observations; it does not invent them.

### 3. Economic admission kernel

`PRE-RICH/profile/PreRichEconomicAdmission.hs` composes structural transition validity, projection, explicit EEV, executable liquidity, truth/freshness/completeness flags and the viability condition. Its inputs are explicitly an interface to the authoritative observation/refinement layer.

### 4. Oracle / Pool valuation

The Cardano B1 path already has a canonical valuation primitive: `Economic.poolUsdmValue`, backed by the authenticated Oracle State singleton and publisher checks. The B1 PrizePool validator uses this valuation against the concrete Pool output. This is a reusable observation source; it is not by itself a complete EEV contract.

### 5. EEV contract

`docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md` requires an authoritative source fixed by the verification predicate, verification evidence, freshness, deterministic derivation, conservative conversion and fail-closed behavior. The repository does not currently identify a concrete deployed PRE-RICH EEV source that discharges EV1–EV7 for Issue admission.

## What must NOT be done

- Do not calculate EEV in the browser.
- Do not use the B1 Pool value as EEV merely because it is available.
- Do not turn the Beacon/Treasury relayer into an economic authority without an explicit normative authorization.
- Do not manufacture `truthVerified`, `eevFresh`, `obligationsComplete` or `allOmegaSuccessorsInCertifiedKernel` booleans locally.
- Do not treat the existing unit/conformance fixtures as a live economic decision source.

## Exact producer contract remaining

A real Issue producer must provide, with provenance:

1. canonical pre-state observation;
2. candidate Issue transition/post-state;
3. authoritative EEV snapshot and derivation reference;
4. freshness proof;
5. obligation-completeness proof;
6. executable liquidity observation bound to the exact consumed B1 PrizePool UTxO;
7. ProtectedCapital components required by the profile;
8. Economic Gate result;
9. certified-Ω successor/viability result;
10. canonical pre-state, action and candidate post-state fingerprints;
11. decision reference and observation reference;
12. enough evidence to replay the decision independently.

The adapter-side boundary now accepts this producer explicitly through `AuthoritativeIssueAdmission.ts` and rejects witnesses that do not bind to the exact runtime inputs.

## Closure

**Closed:** Issue refinement boundary; B1 Pool observation/valuation primitive; economic admission kernel; adapter-side witness binding.  
**Open:** concrete authoritative EEV/protected-capital/refinement producer; end-to-end Issue admission evidence; real Preprod ticket transaction.

No economic rule was added or changed by this document.
