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


## Follow-up implementation — SyncBeacon and canonical Registry fixture

After the initial audit, Agent B added an Aiken source port for the missing SyncBeacon transition:

- New canonical Aiken `BeaconRegistryDatum` type, field order matching Haskell `Types.BeaconRegistryDatum`.
- New `sync_beacon_transaction.ak` module. It resolves only the configured Registry script credential from transaction reference inputs, decodes inline or witnessed datum, and checks Ready status, complete target equality (network / round / mainchain ref / version), non-empty beacon, one own Prize input, unique continuing Prize output, preserved value, unchanged immutable identity/row tiers/prize amount and exact copy of beacon / mcHash / Materios context.
- `validators/reveal.ak` now dispatches `SyncBeacon` to that transition and takes the Registry ScriptHash as its first parameter. The candidate ABI therefore changes for this Aiken prototype only; no Haskell datum/redeemer ABI was changed.
- All current Aiken parameterization callsites in Reveal, Expire, Claim and the standalone publication probes now pass the same derived Registry hash before the Oracle State parameters.
- The canonical Haskell fixture producer `plutus/test/RevealSchemaFixtures.hs` now emits a full `BeaconRegistryDatum` Plutus Data fixture; the Aiken fixture generator creates a byte-for-byte serialization test, and the parity workflow requires the new fixture key.

Commits for this follow-up include:
- `cff4ed08e5c9d703fba879bf6c695f898fce2f15`, `ca3886b36303a997af823696e860649127a46c07`: Aiken Registry datum type/import.
- `39a09ff55bbe79ea48f57ca538ac77fb4e80203f`, `904302926d87eba596d331e5c225db8031cbaa9c`, `2663098630e61fb8f0a0371b34058ced53afbb0f`, `8a9d38bbf4150e605dc4425fd6d26bf4b02a7729`, `d8434c95a8178ff04ea1b0c4d0e315319672e26d`: SyncBeacon implementation, focused transition vectors and import/type fixes.
- `772f0aab4aa4cce74b43e26bf8ef3a64974f4655`, `4114743d30df2428ce71ca882ef13672ec1b9a06`: connect SyncBeacon to the unified Aiken Prize dispatcher and add Registry ScriptHash parameter.
- `bb6a47fba55d5eb658483fa4f03373729176e55f`, `a505e13923765ce8cd3b45a4f32cfb8e9d8c6442`, `4302835b8adea432e1efc043161b774e82379db4`, `ec4bd3b6bf9e45f2b409300311fbe3e2a76441d2`, `e4b88a82b94a4adfd41e9e3aeb7d5ef83e382d49`: align all Aiken candidate parameterization and publication probes with the new Registry hash.
- `98593bad0ed47fe80e19a6ec727008535b56248d`, `134e636c6b343697f186bfe0f4764c75fac51dbb`, `34afe24579403e8bcab803c6b7fd347b102dac7b`: canonical Haskell Registry datum fixture, generated Aiken serialization test and CI fixture requirement.

**Verification status:** The full Registry datum serialization comparison and updated Aiken build are pending exact-head CI. Source coverage is not yet a PASS. The transaction-context implementation still needs negative Yaci twins for absent Registry, wrong Registry credential, invalid/unreadable datum, mismatched round/target, non-Ready status, empty beacon, duplicate own input/output, altered immutable fields and altered continuing value. A successful compile alone will not close SyncBeacon.

The latest Aiken Reveal Parity run observed during the follow-up was queued/in progress on an earlier head while the new fixture checker was being committed. The latest full Cardano Lab also still needed to reach the Aiken steps at the time of this report. No production or Preprod approval follows from this source port.


## Follow-up verification — compiler correction and current exact-head CI (2026-11-07)

The Aiken check failure on commit `51dc659fc2229e5ea56ee08badff38b8f7224435` was diagnosed from the compiler output, not assumed to be a Plutus bootstrap problem:

- Fatal diagnostic: `aiken::check::redundant_pattern_match` in `validators/reveal.ak`, at the wildcard branch `_ -> False`.
- All four `PrizeAction` constructors were already explicitly matched (`SyncBeacon`, `Reveal`, `Expire`, `Claim`); the catch-all was redundant and the checker rejected it.
- Commit `eb6688d98e219f003d191b605da16dd9f963bd47` removes only that wildcard. Missing datum remains fail-closed through `expect Some(input_datum)`, and `else(_) { False }` remains the failure handler.

Exact-head evidence after the correction:
- Aiken B1 PrizePool Claim Slice [#42369160897](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42369160897) completed **SUCCESS** on `eb6688d`. Steps 5 and 6 both passed: isolated `aiken check` and `aiken build` for the updated package.
- Aiken Reveal Parity [#42369160948](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42369160948) was still in step 4, canonical Plutus toolchain bootstrap, at observation time. It has not yet produced the exact-head Haskell fixture/serialization-parity result.
- Cardano Integration Lab [#42369160963](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42369160963) had started but was still installing isolated lab dependencies at observation time. No latest-head EXPIRE, Claim, Reveal or SyncBeacon Yaci outcome is claimed.
- The prior parity run on `51dc659` failed because of the redundant wildcard; its log also confirms the Haskell fixture executable itself compiled and generated 13 Plutus Data fixtures and 11 Haskell V2 CEK outcomes. It did not complete the Aiken serialization/parity phase.

The compiler correction is therefore verified by the independent Claim Slice workflow, while full schema serialization parity and native-Yaci transaction qualification remain open. The pure SyncBeacon tests are still not a substitute for a transaction-context/Yaci trace. Haskell production sources remain unchanged.

## Follow-up — isolate Haskell EXPIRE diagnostics from Aiken/P2.8 CI (2026-11-07)

**Workflow commit:** `32961d2efa22e1beef39498dc81220f06ef5f486`  
**Changed path:** `.github/workflows/immortal-cardano-lab.yml`

The exact-head Cardano Integration Lab run `#42369304644` showed that Aiken Pending / Revealed Loss / Revealed Win EXPIRE and the Aiken Prize + Haskell B1PrizePool Claim trace all completed successfully. The Haskell V2 Pending EXPIRE step failed during reference-script transaction construction: 16,540 CBOR bytes against the 16,384-byte Cardano transaction limit, before signing/submission. This is a pre-submission build/resource block, not a validator semantic rejection.

The workflow was adjusted as follows:

- All three Haskell V2 EXPIRE traces are `continue-on-error: true`; Pending, Revealed Loss and Revealed Win each have a stable step ID.
- Their outcomes remain readable through `steps.<id>.outcome` and are registered as distinct JEV checks. A Haskell failure is therefore recorded as `failure`, not normalized to PASS.
- The diagnostic Haskell lane no longer prevents downstream P2.8 context materialization, native UTxO decoder, ledger evidence, resource footprint and pure invariant steps from executing.

**Verification status:** the workflow change is committed and read-back verified on `work/immortal-green-closure`. The push-triggered CI result for commit `32961d2` is pending at this audit update; no PASS is claimed for the corrected run.

No Aiken source, Haskell validator, B1PrizePool, V3 carrier, Reveal semantics/economics, datum/redeemer ABI, 500×, KA/KC/KD, EEV/USDM authority, or deployment configuration was modified. No Preprod/Mainnet transaction or signing occurred.
