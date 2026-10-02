# IMMORTAL — Multi-Agent Front Rotation

**Branch:** `work/immortal-green-closure`  
**Purpose:** operational allocation and cross-review between concurrent sessions.  
**Authority:** non-normative; canonical specifications, Decision Register and current implementation remain authoritative.

## Operating rule

Do not let each session stay locked to one front. Work is divided for throughput, then periodically exchanged for adversarial review. A reviewer must actively try to falsify the previous worker's conclusion, not merely restate it.

## Current allocation

| Front cluster | Primary pass | Mandatory cross-review |
|---|---|---|
| Reveal / P2.8-B.1 / evaluator differential | Session A | Session B reviews evaluator interpretation and artifact freshness |
| Genesis / C7 Oracle provenance / C8 Snek UTxO | Session B | Session A reviews Treasury/value provenance and excluded liquidity |
| C9 bootstrap accounting / C10 state semantics | Session A | Session B checks conservation and exclusion boundary |
| C11 atomic Gate→Viability→Adapter→ledger | Session B | Session A checks economic authority and atomicity |
| C12 lifecycle conformance | Session A | Session B reviews Issue/Reveal/Claim/Expire correspondence |
| C13 datum/redeemer serialization | Session B | Session A performs semantic round-trip review |
| C14 artifact provenance/reproducibility | Session A | Session B checks stale-artifact and hash-binding failure modes |
| C15 replay/idempotency | Session B | Session A attacks duplicate-submission and consumed-state cases |
| B4 ProtectedCapital | Session A | Session B reviews partition and lifecycle deltas |
| B5 Economic Gate→Viability→Safe Action | Session B | Session A reviews candidate-post-state and immediate-liquidity semantics |
| B6 V3↔Cardano equivalence | Shared | Each session reviews the other's refinement claims |
| 3D certified persistent NFT | Shared | Cross-review authority separation vs presentation |
| B2 hysteresis/control binding | Shared | Cross-review caller-selected state and canonical controller provenance |
| Treasury/Protocol Revenue | Session B | Session A reviews universal/application boundary |
| Materios finality/authority proof | Session A | Session B reviews cryptographic trust boundary |

## Rotation protocol

1. **Primary pass:** inspect current branch, canonical source, implementation, tests and current CI evidence.
2. **Record only falsifiable claims:** distinguish implementation, test, simulation, emulator and real-ledger evidence.
3. **Exchange:** after a meaningful change, the other session reviews the same front from a different angle.
4. **Adversarial review:** search specifically for stale artifacts, caller-controlled observations, missing provenance, non-atomic transitions, replay paths, silent defaults and economic leakage.
5. **Reconciliation:** if the reviewer finds a defect, fix it or record the exact unresolved boundary. Never hide disagreement by changing the coordination status.
6. **Rotate:** move to another cluster after the review; do not monopolize a single front while unrelated fronts remain open.
7. **Promotion rule:** GREEN only when current-head evidence supports the exact closure claim. A fixture, source inspection or emulator result cannot silently substitute for a real-ledger/proof requirement.

## Current priority sweep

- Reveal: wait for and classify fresh-artifact runs only; legacy failures are historical evidence.
- Genesis: continue the real Yaci carrier trace and independently bind Treasury + Oracle observations.
- C7/C8: trace actual Oracle/Snek UTxO identity and provenance; classify the 3 ADA/provider-offset observation without inventing semantics.
- C9/C10: prove bootstrap PRE satisfies admission but is not automatically imported into Genesis PrizePool liquidity/state.
- C11–C13: connect economic admission to concrete transaction/state serialization and observed post-state.
- C14: bind source commit, toolchain, generated script bytes/hash and evidence packet.
- C15: execute replay/idempotency cases for Genesis and lifecycle transitions.
- B4/B5/B6: continue evidence work in parallel; do not wait for Reveal/Genesis to finish before advancing these.
- Materios: continue boundary hardening while keeping the missing production cryptographic proof explicit.
- Treasury/Revenue: finish representation mapping without inventing fee values or accounting classification.

## Handoff record

Every substantive handoff should state:
- current commit;
- files inspected/changed;
- exact evidence observed;
- what remains unproven;
- the next adversarial question for the receiving session.

**No economic constants or normative rules are changed by this file.**

## 2026-09-23 — Rotation execution update

Concrete C14 progress landed on the working branch:
- `7c1b60be884aec17103c3931f462f7c4508af90b`: IMMORTAL Cardano Integration Lab now records SHA-256 hashes of generated Plutus artifacts together with `GITHUB_SHA` before ledger execution.
- `0b4b066b9f60c60697258c2960126864aa4978f8`: PRE-GENESIS → GENESIS workflow now records hashes of the generated Genesis carrier and one-shot mint-policy artifacts.

These are provenance/evidence improvements only. They do not establish semantic equivalence or ledger success by themselves.

Next cross-review question: verify that the evidence consumers actually upload and correlate these hash manifests with the transaction/evidence packets, and that no later step silently replaces the hashed artifacts with committed/stale `src/plutusScripts` copies.


## 2026-09-23 — Cross-review: Genesis evaluator compatibility

Session A review of the Genesis front found the carrier still used the Ledger API `valueOf` helper for every PRE/carrier/oracle singleton lookup. B1PrizePool had already replaced the same helper with explicit `AssocMap` traversal after the evaluator Value failure. To avoid carrying the same evaluator/compiler compatibility risk into the Genesis carrier, commit `2b589e44dbdc7b411fba8941a4f530f25d820101` applies the same semantics-preserving direct lookup pattern.

**Review status:** targeted compatibility hardening only. Fresh Genesis compilation + Yaci execution must still validate it; no GREEN promotion from source inspection.

## 2026-09-23 — Cross-review: Genesis C9/C10 exclusion evidence

Commit `a2364a00d40d8b149673397b3bc75a8a9c4d1c40` strengthens the real Yaci Genesis trace: after ActivateGenesis it now verifies that the exact Treasury and Oracle reference UTxOs remain unconsumed and records an explicit evidence boundary that the transition touches only the carrier state, not PrizePool/bootstrap liquidity.

This does **not** prove the full Genesis economic state transition; it proves a narrower and important exclusion property when the lab succeeds: Treasury/Oracle references are observational inputs, not consumed funding, and the carrier transition itself does not import bootstrap PRE into PrizePool liquidity.


## 2026-09-23 — C14 Genesis evidence packet binding

C14 cross-review found that hashing generated Genesis artifacts in CI was necessary but not sufficient: the hashes were not yet correlated inside the actual ledger evidence packet containing the transition transaction CBOR.

Added:
- `5c9dff9a79932ca52cdbbefbb88a1da5f0de5ca0` — `audit/pre-genesis-genesis/record-artifact-provenance.ts`
- `83e479e5989fcb32ec497913288eda3f87257f90` — Genesis workflow now runs the provenance binder after the real Yaci transition and before artifact upload.

The binder records `GITHUB_SHA`, SHA-256 hashes of the exact generated Genesis carrier and mint-policy artifacts used by the workflow, and binds that manifest to the observed transition transaction reference + CBOR presence in `genesis-carrier-transition.json`.

This closes a concrete stale-artifact correlation gap at the evidence-packet layer, but does not by itself prove semantic equivalence or successful ledger execution. Fresh workflow execution remains required.

Next adversarial question for the receiving session: attack whether any generated artifact can be replaced between hash capture and transaction execution, and whether the recorded transition CBOR can be independently mapped to the same script bytes rather than merely co-existing in the same JSON packet.


## 2026-09-23 — C14 adversarial binding tightened

The previous provenance binder still correlated artifact hashes with the evidence packet only structurally. It did not independently recompute the Cardano identities represented by the generated bytes.

Hardened in:
- `0ae45b8107ce0c82f184c981c2424aa5dcee6bef`
- `0d6b8a4547348119d0ea0f1b34b60fcd610b1a33`

The binder now loads the exact generated Genesis validator and mint-policy CBOR, recomputes:
- the Genesis carrier validator script hash;
- the Genesis carrier mint-policy ID;

and fail-closes unless both equal the identities recorded by the observed Yaci transition evidence.

This establishes a stronger transitive binding:
**generated script bytes → independently recomputed Cardano identity → observed transition evidence identity**.

It still does not parse the signed transaction CBOR to prove that every serialized script witness/redeemer byte is identical to the generated artifact. That remains the next C14 adversarial boundary.


## 2026-09-23 — C14 adversarial rotation update

**Primary pass:** C14 provenance  
**Finding:** hash manifests and evidence-field correlation were insufficient to prove that the generated validator bytes were the bytes carried by the submitted transition.

**Hardening applied**
- Signed transition CBOR is parsed with Lucid/CML.
- Plutus V2 witness set is inspected directly.
- Generated `genesisRegimeCarrier.plutus.json` bytes must occur verbatim in the signed witness set.
- Observed witness script hashes must independently resolve to the generated carrier validator hash.
- Evidence records the witness-presence and witness-identity binding results.

**Cross-review conclusion:** this closes the identified artifact→signed-witness identity gap at the evidence-binder layer. It does not close the fresh-ledger evidence requirement.

**Commits:** `35db1b4f6d4137732a6f9ac23c71f676d2661616`, `c20d4b45c4db2c693d76849e8d3777fb64140e89`, coordination `d153370ce47fd94fcbd8ec5546cc52dca7a661ac`.

**Next reviewer attack:** inspect a fresh Genesis workflow artifact packet and confirm the exact submitted CBOR, generated artifact hashes, source commit, observed witness bytes/identity and transition tx reference are all mutually consistent.


## 2026-09-23 — C15 atomic pairing side-door found and closed

**Primary pass:** C15 replay/idempotency + C12 lifecycle cross-review.

A concrete independent-validator side door was found in `plutus/B1PrizePool.hs`: `TicketRevealed` and `TicketClaimed` previously inspected a Prize output but did not require the corresponding Prize input. The companion `PrizeValidator` enforces the lifecycle when its own input is spent, and the production `gameFlow.ts` already spends both inputs, but the Pool validator itself could otherwise be invoked with a fabricated economic Prize output and mutate Pool accounting without consuming the canonical ticket state.

Hardened in:
- `c0e68db47192f4aba0fa3d080f83b60c9005010e` — Pool Reveal now requires exactly one decodable Prize input, Pending status, matching ticket identity and matching price; Pool Claim now requires exactly one Prize input, Revealed status, matching ticket identity and frozen payout.

This is a validator-boundary hardening, not a new economic rule. It makes the two economic transitions independently atomic across the Pool/Prize pair rather than relying on the caller to assemble the companion spend correctly.

The existing lifecycle semantics remain:
- Reveal consumes Pending Prize state and produces Revealed state;
- Claim consumes Revealed Prize state and produces Claimed state;
- Expire consumes Pending Prize state only after expiry.

**Next adversarial question:** test whether any remaining Pool action can mutate economic accounting without consuming the exact canonical Prize state it claims to represent, and then exercise duplicate/concurrent submissions against the real ledger.

**Status:** C12/C15 validator pairing hardened / fresh Plutus compilation + Yaci lifecycle evidence required.
