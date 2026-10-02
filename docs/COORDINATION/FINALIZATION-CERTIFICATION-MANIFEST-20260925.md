# IMMORTAL — Finalization & Certification Manifest
Date: 2026-09-25
Branch: work/immortal-green-closure

## Finalization decision

The current implementation/conformance phase is FINALIZED. No remaining certification item is to be solved by weakening, redefining, or silently extending protocol semantics.

## Frozen implementation boundary

- IMMORTAL remains chain-agnostic; Adapter remains the chain-realization boundary; PRE-RICH remains application/profile policy.
- ProtectedCapital, RawSurplus and liability-first accounting remain frozen.
- PRE-RICH ladder, 500× normal-payout cap and KA/KC/KD remain profile semantics and are not promoted to universal IMMORTAL constants.
- Economic submission remains fail-closed and distinct from generic infrastructure submission.
- RF8 economic mutation inventory and current TypeScript submission-boundary coverage remain in force.
- Issue and Expire refinement witnesses remain in force.
- Governance canonicalization requires exact DecisionRecord-reference equality for the same proposal.
- Materios/B3 local commitment checks remain bound to selection-input bytes/hash and activation block hash/number.
- P2.8 remains native Cardano-ledger evaluation with source-grounded dependencies and no synthetic Ledger context.

## Certification gates

| Gate | Status | Closure evidence required |
|---|---|---|
| P2.8 native evaluator | OPEN | exact-head workflow artifact showing native evaluator execution and classification |
| Reveal budget | OPEN | fresh Haskell/Plutus artifact execution; distinguish stale-artifact drift from genuine budget failure |
| Materios/B3 | OPEN | publisher-independent finality + runtime/state + selection-input proof composition |
| B4/B5/B6 | OPEN | end-to-end ledger conformance, including authenticated EEV/liquidity and V3↔Cardano equivalence |
| RF8 whole-program | OPEN | complete mutation-path/no-side-door evidence |
| Independent assurance | OPEN | specialist Plutus/UPLC review and second-human review |
| Protocol Usage Fee | OPEN POLICY | only explicit normative source may select universal parameters |

## Certification rule

A gate becomes CLOSED only when its exact commit, exact workflow/test, exact artifact or live observation, and scope are recorded. Unit tests, schemas, simulations and source assertions are not promoted to cryptographic or live-ledger proof.

## Freeze rule

Do not change economic constants, payout bounds, expiry semantics, oracle rules, validator safety conditions, authority selection, or protocol limits merely to obtain green CI or satisfy an audit observation.

## Result

This manifest marks the end of the implementation phase and the transition to evidence/certification closure. It does not claim that the remaining certification gates are already closed.
