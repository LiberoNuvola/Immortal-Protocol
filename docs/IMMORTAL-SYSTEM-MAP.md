# IMMORTAL / PRE-RICH — End-to-End System Map & Continuity Checkpoint

> Continuity map for reconstructing the system without repeating repository + Notion + Library archaeology. This is an orientation/provenance document, not a replacement for normative specifications.

## 1. System

IMMORTAL → Economic Kernel / Ω → Economic admissibility / viability → Cardano Adapter → PRE-RICH → canonical ticket state → certified NFT identity/state → 3D ticket presentation → reveal / persistent state → claim / settlement.

Within PRE-RICH, the principal tracks are Economics, GameRules, and B3 / Beacon. B3 connects Materios → GRANDPA finality → StateRoot → storage proof → succinct/ZK verification → canonical Beacon.

## 2. Boundaries

### IMMORTAL
Owns universal chain-neutral economic semantics and invariants: Economic Kernel, ProtectedCapital, RawSurplus, viability/Ω, liability-first protection, atomic transitions, expiry finality, permissionless execution, safety/liveness and no-bypass economic boundaries.

PRE-RICH rules such as ticket prices, 500x, Jackpot policy and game distribution are not universal IMMORTAL constants.

### Cardano Adapter
Owns UTxO, Datum/Redeemer/Value, transaction serialization, reference-input/oracle transport, chain-specific evidence, fees and settlement mechanics.

### PRE-RICH
Owns Scratch & Win, ticket ladder, 20,000 outcome domain, 500x payout ceiling, Jackpot, GameRules, Beacon consumption, ticket NFT, 3D presentation and application governance.

## 3. B3

B3 is not merely randomness.

- B3-A: Materios finalized checkpoint/header → GRANDPA finality → authority history/transition → ancestry/quorum → canonical finalized block.
- B3-B: canonical header → StateRoot → storage proof → authenticated application value.
- B3-C: B3-A + B3-B → succinct/ZK proof → Cardano verification.
- B3-D: verified evidence → canonical Beacon → ticket/game seed → rejection sampling → 20,000 outcome mapping → GameRules → deterministic payout.

Existing groundwork must be reused, not recreated:
- poc/materios-checkpoint/
- poc/materios-grandpa/
- plutus/Beacon.hs
- plutus/BeaconRegistry.hs
- src/beacon.ts
- relayer/beaconProvider.js
- docs/archive/B1-B3_evidence/

## 4. Certified 3D ticket

The target is a persistent, state-aware 3D NFT ticket, not merely an image NFT.

Canonical chain: Materios evidence → B3 canonical Beacon → deterministic game result → canonical economic state → certified NFT identity/state → 3D presentation → reveal/state change → claim/settlement.

The renderer is never the economic source of truth. Potential ticket/receipt fields must be classified as on-chain, metadata, derivable, absent or UI-only before implementation.

## 5. Current PRE-RICH economics

- KA=8, KC=4, KD=4
- ticket ladder = 1/2/3/5/10/25/50/100 USDM
- Genesis = 1 USDM
- bootstrap >= 4,000 USDM
- max normal payout = 500xP
- unresolved reserve = sum(P_i)
- worst-case exposure = sum(500 P_i)
- RawSurplus = max(0, EEV - ProtectedCapital)
- liability-first
- CurrentActiveClass may contract
- HighestClassEverActivated is monotonic
- expiry destroys the economic right after expiry
- late reveal cannot create claimability or new payment commitment
- sale must atomically/equivalently bind mint + Treasury payment + unresolved reservation

Statistical reserve remains distinct from deterministic ProtectedCapital. Historical Z/mu/sigma values are reference evidence, not universal constants.

## 6. Jackpot

- global, not per class
- all classes eligible
- activation follows ladder/stability condition and economic trajectory
- once locked, capital cannot be dissolved, redirected or reduced before win
- current normal floor = 500 x (1+2+3+5+10+25+50+100) = 98,000 USDM
- dynamic floor = 500 x max(sum normal prices, sum saleable prices)
- full locked-balance payout is the lifecycle target
- funding constrained by NewJackpot <= RawSurplus plus post-state Economic Gate
- remaining closure: deterministic, permissionless, non-discretionary activation threshold frozen at lock

## 7. GameRules

Current domain: 20,000 outcome slots.

| Outcome | Slots |
|---|---:|
| Loss | 17,500 |
| 1 USDM | 1,700 |
| 2.5 USDM | 600 |
| 5 USDM | 180 |
| 100 USDM | 19 |
| 500 USDM | 1 |

Target EV = 0.64996875.

Randomness uses a 16-bit source, rejection sampling with accepted upper bound 60,000, then reduction into the 20,000 domain. Direct modulo mapping over the full 16-bit domain must not be used because it introduces bias.

Existing deterministic replay vectors are evidence; closure still requires independent Plutus/TypeScript execution parity.

Historical 10,000-slot material must be treated as historical until explicitly reconciled.

## 8. Economic conformance

The current kernel computes ProtectedCapital and worst-case exposure and fails closed on unknown classes.

The Cardano B1 validator already checks pre-state and post-state solvency for issue, reveal, claim and expiry.

The remaining conformance question is semantic equivalence: canonical V3 candidate state → ProtectedCapital → RawSurplus / Economic Gate where EEV exists → Cardano projected state → validator predicate → equivalence evidence.

Do not weaken invariants to make fixtures/tests pass.

The legacy adapter intentionally exposes a lossy compatibility view for newer protected-capital fields and rejects non-lossless reverse projection.

## 9. Liveness

Every required action must follow: Condition → deterministic observation → event/trigger → candidate construction → permissionless invocation → independent on-chain revalidation → atomic transition → canonical state.

Recurring test: if the condition becomes true at 03:00 and nobody is operating the system, what happens?

A relayer can improve latency but must not be economic authority or a single point of failure.

## 10. Repository truth

Active branch: work/immortal-green-closure

Reference/hardening baseline: b1-hardening

Do not use main as the active implementation surface.

Existing conformance/evidence artifacts include the Economic Gate/Cardano matrix, B3 Beacon conformance investigation, payout-unit conformance, GameRules replay vectors and the Cardano/Yaci integration lab.

## 11. Anti-reconstruction workflow

Before any material change:
1. Search Notion for topic/title/decision.
2. Fetch/search GitHub on the active branch.
3. Search Library/files for checkpoints, evidence, prototypes and historical artifacts.
4. Classify sources: NORMATIVE / IMPLEMENTATION / EVIDENCE / HISTORICAL / HYPOTHESIS / OPEN DECISION.
5. Reuse existing work; update an existing artifact when it covers the same function.
6. Never weaken invariants to make tests green.
7. Never promote placeholders, benchmarks or historical values to canon without evidence.
8. Reconcile conflicts explicitly and preserve provenance.
9. Only then modify code or documentation.
10. Update this map only when the system-level map changes materially.

## 12. Current closure front

This map is a continuity layer, not a new normative specification.

Remaining integrated tracks:
- IMMORTAL ↔ Cardano Adapter conformance
- protected-capital correspondence / C-EXEC / no-side-door evidence
- B3 canonicality and publisher-independent verification
- deterministic GameRules replay parity
- permissionless liveness audit
- exact settlement-asset construction
- executable governance
- P2.8 real-ledger evidence
- certified 3D NFT implementation from canonical persistent state
- deterministic Jackpot activation threshold

## 13. Source-of-truth rule

When this map conflicts with a newer normative specification, the normative specification wins. When it conflicts with an implementation fact, the current repository wins for implementation state. When it conflicts with an older checkpoint, the newer reconciled artifact wins, with provenance preserved.

**Update this document with deltas; do not rebuild it from scratch.**
