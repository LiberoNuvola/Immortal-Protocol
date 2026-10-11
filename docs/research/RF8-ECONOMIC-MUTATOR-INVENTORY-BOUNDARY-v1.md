# RF8 — Economic Mutator Inventory Boundary v1

## Classification

Evidence/conformance material. This boundary does not change economic semantics, select deployment parameters, or declare whole-program closure.

## Purpose

Turn the existing RF8 source inventory into an executable regression boundary for the currently identified economic transaction paths.

The boundary must preserve the distinction:

`economic action → EconomicAdmission → economic submission`

versus:

`support/control action → infrastructure submission`.

## Current canonical economic action inventory

The current source inventory identifies exactly four application economic actions:

- `Issue`
- `Reveal`
- `Claim`
- `Expire`

The expected application-side economic submission topology is:

- `src/mint.ts` → Cardano `submitEconomic(..., 'Issue')`;
- `src/gameFlow.ts` → `signAndSubmitEconomicTx(..., 'Reveal')`;
- `src/gameFlow.ts` → `signAndSubmitEconomicTx(..., 'Claim')`;
- `src/gameFlow.ts` → `signAndSubmitEconomicTx(..., 'Expire')`.

The helper `src/txHelpers.ts` is infrastructure glue for the economic path. Its canonical economic helper delegates to the Cardano execution adapter's `submitEconomic` method.

## Non-economic/control paths

The known non-economic submission paths remain distinct:

- `SyncBeacon` may use `signAndSubmitTx`;
- registry publication may use `signAndSubmitTx`;
- pending-round creation may use `signAndSubmitTx`.

These paths are not reclassified as Economic Admission merely because they build or submit Cardano transactions.

The legacy `buildClaimTx` helper remains intentionally disabled. Its presence is a compatibility surface, not an alternative economic submission path.

## Executable boundary

The conformance guard verifies:

1. all four known economic actions retain an explicit economic submission path;
2. each action retains its expected action-class identity;
3. `Reveal`, `Claim`, and `Expire` remain in `gameFlow.ts`;
4. `Issue` remains in `mint.ts`;
5. the canonical helper delegates to Cardano `submitEconomic`;
6. the legacy claim builder remains fail-closed;
7. the known support/control paths remain distinct from the economic helper.

A failure means the source inventory has changed and RF8 must be re-audited before closure claims are made.

## Deliberate non-claims

This boundary does not prove:

- exhaustive whole-program transaction-constructor coverage;
- native-ledger correctness;
- EEV authority;
- ProtectedCapital enforcement;
- B3 witness validity;
- V3/Cardano semantic equivalence;
- absence of dynamically introduced future transaction paths.

Accordingly, this boundary can strengthen RF8 evidence but cannot by itself close RF8.

**Status: RF8 evidence boundary / research conformance.**
