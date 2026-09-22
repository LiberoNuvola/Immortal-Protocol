# IMMORTAL — Autonomous Session Handoff — 2026-09-22

## Snapshot

- Branch: work/immortal-green-closure
- Current observed head: 7ed1250443006815486d8125e77530a53a847512
- Previous coordination snapshot was behind this head; this addendum records current evidence without rewriting main coordination history.

## Verified current CI evidence

### Cardano Adapter Sale

Run 35773924588 on 7ed12504 is SUCCESS.

### PRE-RICH Reveal

Run 35773924559 on 7ed12504 is FAILURE.
Canonical limits: maxTxSize 16,384; maxTxExMem 14,000,000; maxTxExSteps 10,000,000,000.
Failure: Spend[1] execution went over budget.

This does not overturn the stronger diagnostic evidence already recorded: the high-budget Pool-only probe isolated the earliest relevant operation to the B1PrizePool Value/valueOf path and produced EVALUATOR_VALUE_FAILURE / NonConstrScrutinized. No production validator or economic rule was changed.

## Genesis carrier

Current branch contains the minimal application-only carrier PRE-RICH/profile/PreRichRegimeState.hs.

- PreGenesis -> Genesis only.
- Composes the existing genesisPredicate.
- Does not duplicate Treasury balance, Oracle payload, PrizePool liquidity, or universal economic state.
- Fails closed for all other regimes.

Remaining gap: Cardano carrier, atomic transition, and concurrency boundary. No second economic state machine should be introduced.

Existing singleton-token patterns in B1PrizePool/Oracle confirm that a singleton identity mechanism exists in the repository, but no canonical Genesis singleton identity has yet been established by the normative material inspected. Do not invent a policy/name pair merely to close the gap.

## Materios

The proof boundary remains correctly fail-closed:

untrusted statement -> structural validation -> explicit proof verifier -> verified transition -> trusted authority state

The test verifier returning true is a structural boundary stub only. No current-branch evidence was found for a production cryptographic Rust/WASM selector/verifier that can safely be promoted. Keep the Materios gate OPEN.

## Next work

1. Continue differential evaluator investigation for Reveal without modifying validator economics.
2. Map canonical P0/T2 regime-state requirements against existing Cardano singleton patterns before writing a Genesis validator.
3. Keep Genesis carrier tests and Plutus admission seam separate from the universal kernel.
4. Continue Materios selector/proof-runtime discovery; do not replace it with TypeScript.
5. Re-scan active workflows after the next push; cancelled runs are not failures of the underlying property.

## Classification

- Reveal: OPEN / evaluator-runtime blocker.
- Genesis predicate: GREEN at admission/conformance seam; on-chain carrier OPEN.
- Cardano Adapter Sale: GREEN for current run.
- Materios: OPEN / proof implementation missing.
- No normative economic decision introduced.
