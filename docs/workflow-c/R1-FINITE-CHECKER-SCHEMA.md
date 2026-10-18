# R1 finite-model checker — input contract and limits

**Implementation:** [`scripts/check-r1-finite-certificate.mjs`](../../scripts/check-r1-finite-certificate.mjs)  
**Regression suite:** [`test/check-r1-finite-certificate.test.mjs`](../../test/check-r1-finite-certificate.test.mjs)  
**CI gate:** [`.github/workflows/c6-r1-finite-checker.yml`](../../.github/workflows/c6-r1-finite-checker.yml)

This is a deterministic checker for a **finite, explicitly supplied model**. It is a useful mechanical gate for R1 obligations; it is not an authoritative PRE-RICH/IMMORTAL deployment certificate. It must never be used to label C6 CERTIFIED merely because it returns `ok: true`.

## Run

```sh
node --test test/check-r1-finite-certificate.test.mjs
node scripts/check-r1-finite-certificate.mjs path/to/model.json
```

The CLI emits a JSON result with the checker version and SHA-256, normalized-input SHA-256, derived states/buffers, VC labels and limitations. A rejected model returns a non-zero exit status. No valid deployment model or live S0 is included in the repository by this implementation.

## Input schema

Top-level required fields:

| Field | Required content |
|---|---|
| `schemaVersion` | Exact string `immortal-r1-finite-model-v1` |
| `profile` | Non-empty `id` and `version` |
| `model` | Non-empty `id` and `version` |
| `certificate` | Non-empty `id`, `version`, `initialStateId`, and `witnessByState` mapping each derived certified state ID to an action ID |
| `states` | Non-empty finite state domain; requirements below |
| `actions` | Non-empty action domain with `id`, `availableIn` and `acceptedIn` state-ID lists |
| `environment` | `perimeterId`, non-empty `sourceRefs`, `events`, and `materiality` declarations |
| `omega` | `id`, non-empty `sourceRefs`, and non-empty abstract `events` |
| `transitions` | Finite deterministic rows `{state, action, event, successor}` that define the checked transition table |

### Canonical state inputs

Each state includes:

- `id`;
- `source`: `kind`, `reference`, `revision`, and a 64-character lowercase SHA-256 `digest`;
- `inventory`: `sourceRef`, `digest`, complete declared `assetIds` and `commitmentIds`;
- `assets`: records `{id, cell, amount}`, where cell is one of R7 A1–A5;
- `commitments`: records `{id, cell, amount}`, where cell is one of R7 L1–L6;
- `protectedCapitalAddons`: decimal-integer strings for `safetyCapital`, `reserveProtection`, `mandatoryFutureCosts`, and `additionalProtectedCapital`.

All economic amounts are non-negative decimal strings, parsed as arbitrary-precision integers. Asset `amount` for A1/A2 means verified executable amount / declared net value; A3/A4/A5 are excluded from EEV. Commitment amounts in L1/L2/L3 contribute to ProtectedCapital; L4/L5 do not. An L6 commitment makes Rep false. Cross-side duplicate IDs are rejected because this version does not encode the R7 A4↔L3 contingency refinement.

The checker derives:

```text
EEV = sum(amount for assets in A1 or A2)
PC  = sum(amount for commitments in L1, L2 or L3)
    + safetyCapital + reserveProtection
    + mandatoryFutureCosts + additionalProtectedCapital
b   = EEV - PC
Rep = inventory ID sets match the state partition
      AND no L6 item exists
      AND IDs/cells/amounts pass structural checks
χ   = Rep AND b >= 0
```

These formulas are the checker's finite input abstraction. The profile must still justify that the supplied partition and add-ons faithfully refine the target economic state; the checker cannot discover omitted real-world assets or obligations.

### Action, transition and Ω inputs

- Each action's `availableIn` and `acceptedIn` lists are explicit finite relations, not Boolean claims. The checker verifies the witness is present in both relations at each derived `χ=1` state. It does not prove these relations match deployed code.
- `environment.events` entries contain unique `id` and non-empty `sourceRef`. The environment also has non-empty global `sourceRefs`.
- `environment.materiality` must have exactly one declaration for every state/action pair listed as available. Each row has `state`, `action`, `eventIds`, and `sourceRef`. It explicitly records which declared real-perimeter events are material for that pair; an omitted pair is rejected rather than treated as impossible. Every declared environment event must be material for at least one available pair.
- `omega.events` entries have globally unique IDs and non-empty `sourceRef`. The Ω set must be non-empty.
- `transitions` must define at most one successor for each `(state, action, event)`. The checker derives Ω successors from transition rows whose event IDs belong to Ω; it does not accept a supplied `allOmegaSuccessorsInCertifiedKernel` Boolean.
- For each available state/action pair, the checker requires at least one derived Ω successor. It then checks every declared Env transition successor is covered by an Ω successor for the same state/action. It rejects undeclared Env materiality and an Ω under-approximation.

### Certificate checks

The checker derives the certified set from the finite states and `χ`; it does not accept a producer-supplied `chi`, `Rep`, `safe`, `VCn`, or universal-closure Boolean. It checks:

- VC1: the finite predicate is computable from validated input fields;
- VC2: derived `Rep ∧ b≥0` safety rule;
- VC3: every derived certified state has exactly one witness; the witness is available; every derived Ω successor remains certified;
- VC4: the witness is included in the declared accepted-action relation;
- VC5: declared real-perimeter successors are contained in derived Ω successors;
- VC6: the initial state exists, derives into χ, and has `source.kind = ledger`.

## Deliberate limits — do not overclaim

1. **Ω/reality:** VC5 is only relative to the finite `environment.events` and `environment.materiality` supplied. The checker does not authenticate their sources or prove that the declared perimeter covers reality. R3 P1–P8 and the adapter/perimeter evidence remain external obligations.
2. **S0 authenticity:** `source.kind = ledger` and non-empty references are metadata checks only. The checker does not query a ledger, verify a transaction, validate signatures, or authenticate the source digest. The unit tests use synthetic inputs and are not S0 evidence.
3. **Action-space completeness:** `availableIn` and `acceptedIn` are declared relations. The checker does not prove that the action list is exhaustive or that the deployed `Accept` implementation conforms.
4. **Transition refinement:** transition rows are an explicit finite table. The checker does not prove they are generated by `EconomicTransitionV3` or by an authoritative chain-independent `T`.
5. **R7 exhaustiveness:** exact inventory-set matching only checks the declared inventory against its partition. It cannot prove that the inventory includes every real asset/commitment; PA2/PA7 remain open. Cross-side contingency linking is not yet represented.
6. **Proof category:** a passing test is TEST EVIDENCE. A successful run on a supplied model is MECHANICAL EVIDENCE relative to that model. Neither is a mathematical proof of a deployment, adapter conformance, or governance decision.

**Required use:** treat this checker as an independent finite-model gate and counterexample generator. A real C6 package still needs source-authorized model/action semantics, justified abstraction and Ω over-approximation, authenticated EEV/obligation inputs, actual ledger-derived S0, implementation-refinement evidence, and independent review.
