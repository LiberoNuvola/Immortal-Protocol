# Agent B — Aiken V3 migration readiness audit

**Date:** 2026-11-07  
**Branch:** `work/immortal-green-closure`  
**Decision:** Aiken V3 is the primary PrizeValidator migration candidate. Haskell V2 is frozen as the canonical differential reference and fallback pending qualification.  
**Tracking:** [Issue #48 — Aiken V3 PrizeValidator migration qualification](https://github.com/LiberoNuvola/Immortal-Protocol/issues/48)

## Executive disposition

The Haskell V2 Pending EXPIRE publication path is blocked before signing/submission by a 16,540-byte reference-script publication transaction against the 16,384-byte limit. The isolated Plutus 1.67.0.0 `conservative-optimisation` candidate increased the parameterized script by 211 bytes and is rejected for the size objective. No further Haskell compiler-size experiments are authorized by this workstream.

Aiken already provides useful local-Yaci evidence for the Prize validator path, including Reveal and Pending EXPIRE. It is not yet a production substitute: the package README labels it an isolated prototype, it compiles to Plutus V3 while the canonical Haskell validator is Plutus V2, and the complete ticket lifecycle is not yet covered.

## Evidence reviewed

### Canonical Haskell V2 size result

- Baseline factory: 16,309 bytes.
- Parameterized Haskell V2 PrizeValidator: 16,443 bytes.
- Baseline script hash: `508588a6ac5925b316b87f85adcc746808b4b29d2e13952184e7175b`.
- Measured reference-script publication candidate: 16,540 bytes, 156 bytes above the 16,384-byte limit.
- Run [#42359125101](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42359125101) measured the isolated `conservative-optimisation` candidate at 16,654 bytes (+211 bytes) and a projected publication size of 16,751 bytes. The publication size is a projection for this candidate, not a built transaction.
- Candidate hash changed; no candidate artifact was promoted or rebound.

### Aiken evidence

Run [#42340114425](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42340114425) on local Yaci showed:

- Pinned Aiken setup/build and reference-script publication: PASS.
- Aiken Reveal positive/negative fixtures and active economic Reveal trace: PASS.
- Aiken Pending EXPIRE fixture: PASS; replay rejected.
- Existing V3 carrier: independently PASS and unchanged.
- Haskell V2 Pending EXPIRE: FAIL before submission at reference-script publication `complete()`.
- Aiken Prize + Haskell B1PrizePool Claim trace: SKIPPED because the step inherited the workflow's implicit `success()` status after the earlier Haskell failure.

These are synthetic local-Yaci integration results, not production USDM/EEV qualification or Preprod deployment evidence.

## Source-level gaps

### SyncBeacon — missing from the Aiken Prize dispatcher

The Aiken wire type already contains the `SyncBeacon` constructor, but `validators/reveal.ak` dispatches only Reveal, Expire and Claim; the fallback returns `False`.

The Haskell source requires a Registry reference input selected by the configured Registry ScriptHash; decodable Registry datum; `BeaconReady`; matching round and full target (network, round, mainchain reference, version); non-empty beacon; exactly one own Prize input; preserved ticket value; and a continuing Prize datum with immutable identity/row tiers/prize amount, Pending status, BeaconReady status and the Registry beacon/receipt fields copied exactly. This must be ported as a typed-context path with adversarial tests. Pure beacon derivation alone is not Registry authentication.

### EXPIRE — incomplete source port, now extended but not yet verified

The prior Aiken transaction validator only accepted Pending. The Haskell reference also accepts Revealed Loss and Revealed Win:

- Pending: exact ticket-price unresolved-reserve release and unresolved-ticket-count decrement; pending liabilities unchanged.
- Revealed Loss: zero payout; pending liabilities, reserve and count unchanged.
- Revealed Win: exact frozen unpaid payout liability release; reserve and count unchanged.
- All paths require the finite lower validity bound at/after expiry, exact Prize/Pool binding, no continuing Prize output, preserved physical pool value on the B1PrizePool side, and all unrelated pool datum fields unchanged.

Agent B has added these status-specific accounting branches and unit vectors to `expire_transaction.ak`, and the Cardano Lab now runs separate Pending / Revealed Loss / Revealed Win Aiken traces. This implementation has **not yet earned a compile or ledger PASS**. The new workflow run is the first verification attempt.

### Claim — typed-context candidate exists; ledger qualification pending

The Aiken Claim typed-context candidate exists and includes owner, Oracle State identity/publisher/freshness and settlement logic. The Claim trace was skipped in the earlier run. The CI condition has been corrected to run the Aiken Claim trace whenever the fresh Aiken build succeeds, even if an unrelated Haskell step has failed. The next exact-head run must demonstrate the Claim trace outcome; no success is claimed yet.

### V2 → V3 and dependent identity — explicit migration boundary

The Aiken package pins compiler v1.1.22 and `plutus = "v3"`; the canonical Haskell PrizeValidator targets Plutus V2. This is not a drop-in replacement. The new implementation must be qualified against the intended Cardano ledger era/network, Plutus V3 context and cost model, reference-script behavior, transaction size and execution limits.

The PrizeDatum and B1PrizePool datum bind each other through the Prize validator hash. Migration therefore requires a coherent rebind of the parameterized Aiken Prize hash, B1PrizePool validator, policy/reference scripts, addresses, adapter/DApp consumers and deployment references. No mixed deployment with stale Haskell hashes is acceptable.

## Work committed

- `f36b3cbc1a8b05200a33339db0449ff98562f5c5` — Aiken Claim trace made independent of preceding Haskell step outcome while retaining the fresh-Aiken-build prerequisite.
- `c85a424e54e605d9036c12bb717440a770503047` — Aiken EXPIRE extended with Pending and Revealed accounting branches plus focused unit tests.
- `3d86dbf6334922af5ad4c126620ec25cc85585ad` — Cardano Lab split into Aiken Pending, Revealed Loss and Revealed Win EXPIRE traces.
- `d792d16304eea6441364a903bd5e399028ef1c1e` — corrected the common EXPIRE guards so Revealed Win may release its frozen pending liability rather than being blocked by a Pending-only equality assertion.

The latest source commit was observed at the time of audit. CI was in progress; no test outcome for the new Revealed branches or the corrected Claim independence is asserted here.

## Acceptance order

1. Confirm pinned Aiken `aiken check` and `aiken build` after the EXPIRE source changes.
2. Require local-Yaci PASS for all three Aiken EXPIRE lifecycle cases (Pending, Revealed Loss, Revealed Win), with expected pool deltas, replay rejection and real B1PrizePool V2 validator participation.
3. Confirm the Aiken Claim trace actually runs after the Haskell V2 failure and capture its positive/negative Yaci outcomes. Close Oracle and exact settlement parity gaps.
4. Implement authenticated SyncBeacon reference-input resolution and state transition parity.
5. Expand the Haskell/Aiken differential matrix across all Prize actions, complete datum/redeemer encodings, state effects, malformed and hashed/inline datums, duplicate inputs/outputs, replay and adversarial contexts.
6. Complete the Plutus V2-to-V3 ledger/cost/context compatibility review and measure complete transactions and execution units against authoritative limits.
7. Only after gates 1–6 pass, produce the complete identity/rebinding manifest and request a separate migration/deployment approval. Run Preprod only under that later approval.

## Change-control boundary

- Keep Haskell V2 source and artifacts unchanged as differential oracle/fallback; do not run further compiler-size experiments by default.
- Do not touch the existing V3 carrier or alter Reveal semantics/economics.
- Do not alter 500×, KA/KC/KD, price ladder, ProtectedCapital, EEV/USDM authority, datum/redeemer ABI, or first-Issue admission gates.
- No production artifact substitution, wallet signature, Preprod/Mainnet action, or deployment was performed by this audit.
- Aiken remains a **migration candidate**, not a production-qualified validator.
