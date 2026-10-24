# Materios Explorer — fail-closed Receipt verification proposal

**Prepared:** 2026-10-24  
**Owner:** IMMORTAL Agent C (review proposal only)  
**Upstream base:** `Flux-Point-Studios/materios@7d5c36e7dcd60824d84353e93df5d4a03c9c6c30`  
**Status:** PROPOSAL PREPARED — NOT APPLIED UPSTREAM; tests NOT RUN.

## Exact source anchors

| File | Blob SHA at upstream base | Finding |
|---|---|---|
| `tools/explorer/app.py` | `fc7e8f045f9319c2aa6ceb11c83ec5fc5f5076a1` | `/api/verify/{receipt_id}` returns `verified: true` and nine synthetic `status: pass` entries from a verification-index HTTP 200, including a claimed Cardano L1 anchor verification. |
| `tools/materios-verify/materios_verify/core.py` | `bcd21c3c942e3a3b7fbac234865b69050283831a` | Missing manifest and missing `AvailabilityCertified` event currently become `passed=True`; `FULLY_VERIFIED` checks only the implemented step booleans and checkpoint presence, not a GRANDPA justification, authenticated authority-set provenance, or Cardano L1 inclusion. |
| `tools/explorer/chain.py` | `18d79766bb49efdd89c6c10ff14c928dd6a3411a` | Explorer maintains a paginated receipt list and failed-submission index; those views do not by themselves prove the completeness of every on-chain Receipt. |
| `tools/explorer/static/app.js` | `b5c214e943dfff17237f837e65fbbbb9a922a270` | UI consumes the verification API; must not convert an index record or missing backend proof into a verified badge. |

These are source-level findings. They do not establish whether a production instance is currently exploitable or whether the deployed files match these blobs; live deployment was not independently accessible during this review.

## Prepared patch

[Open the patch proposal](patches/MATERIOS-EXPLORER-FAIL-CLOSED-2026-10-24.patch).

It contains changes targeted at the exact upstream blobs above:

1. Remove the verification-index fast return. The request executes the chain verifier instead of synthesizing a successful result from HTTP 200.
2. Mark absent manifest and event evidence as `passed=false`, `details.status=MISSING`.
3. Add explicit, default-false fields `grandpa_finality_verified`, `authority_set_provenance_verified`, and `cardano_l1_anchor_verified` to the report.
4. Allow `FULLY_VERIFIED` only if all implemented steps and the checkpoint pass **and** all three trust-boundary proof fields are true. The current verifier does not yet populate them, so current receipts should remain `PARTIALLY_VERIFIED` until real proof integrations are implemented. This is deliberate fail-closed behaviour, not a claim that the proof path is now implemented.
5. Add regression tests for missing manifest, missing event, incomplete trust-boundary evidence, complete proof flags, a failed step, and the explorer route's absence of synthetic `verified: true` / `status: pass` literals.

## Regression tests and acceptance commands

Run against a clean checkout of the pinned Materios base with the patch applied:

```sh
PYTHONPATH=tools/materios-verify pytest -q \
  tools/materios-verify/tests/test_fail_closed_verification.py \
  tools/explorer/test_verification_fail_closed.py
```

Then run existing verifier/explorer tests and the full upstream CI suite. Acceptance for this limited patch:

- Verification-index HTTP 200 cannot produce `verified=true` or mark any proof step passed by itself.
- Missing manifest/event remain `MISSING` and non-passing.
- Passing all current receipt/anchor checks without real GRANDPA finality, authenticated authority transitions, and Cardano L1 inclusion cannot yield `FULLY_VERIFIED`.
- No source in this patch purports to implement those missing verifiers; the flags remain false until separate real proof adapters/verifiers exist.
- UI behavior for `PARTIALLY_VERIFIED` and the new report fields is reviewed so the status does not regress to a green badge.
- A complete Receipt-universe export, pagination/snapshot semantics, and live-instance/source identity check remain separate acceptance obligations.

## Compatibility and risk

This intentionally removes the instant success response from the verification index and makes the final result conservative. Consumers that equate the old `FULLY_VERIFIED` with end-to-end finality will need to honor the proof fields. The patch does not change consensus, receipt schema, authority selection, or economic rules.

The unified diff's hunk counts were structurally checked against this prepared text. It has **not** been applied to a Materios checkout, because no checkout/network runner is available in this execution context. Therefore apply-compatibility, syntax, pytest, UI regression and upstream CI are all `NOT_RUN`. Do not submit or publish this patch to upstream without the required authorization.

## Still open after this proposal

- Implement a separate, independently verified GRANDPA justification transport and SCALE verifier.
- Authenticate genesis and the complete authority-set transition chain.
- Prove Cardano L1 inclusion against a separately authenticated Cardano state/transaction source.
- Verify certificate/committee semantics under the authenticated block and runtime identity.
- Enumerate every Receipt status with reproducible pagination and snapshot boundaries.
- Bind public explorer deployment identity to the reviewed source revision and prevent the verification index from acting as a trust anchor.
