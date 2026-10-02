# RF8 — Economic Mutator Inventory / Differential Replay Preparation — 2026-09-27

## Classification

Evidence/conformance material. This document does not change economic semantics and does not declare whole-program closure.

## Source inventory performed

The current branch source was inspected for transaction construction and submission boundaries.

### Economic transitions

| Path | Mutation | Construction | Submission | Classification |
|---|---|---|---|---|
| `src/mint.ts` | Issue / TicketIssued / PrizePool reserve+count / Treasury payment | Lucid tx in application | `submitEconomic(...,'Issue')` | economic; admission required |
| `src/gameFlow.ts` Reveal | Prize + B1PrizePool transition | Lucid tx in application | `submitEconomic(...,'Reveal')` | economic; admission required |
| `src/gameFlow.ts` Claim | Prize + B1PrizePool + settlement + ticket return | Lucid tx in application | `submitEconomic(...,'Claim')` | economic; admission required |
| `src/gameFlow.ts` Expire | Prize + B1PrizePool transition | Lucid tx in application | `submitEconomic(...,'Expire')` | economic; admission required |

The four paths pass concrete consumed-input references and the B1 Pool reference as liquidity-source references into the economic submission boundary.

## Non-economic state transitions

| Path | Mutation | Submission | Classification |
|---|---|---|---|
| `src/gameFlow.ts` SyncBeacon | Beacon/Prize lifecycle state | `signAndSubmitTx` | non-economic support transition; must not be treated as Economic Admission |
| `src/registryFlow.ts` publish | BeaconRegistry Pending→Ready | `signAndSubmitTx` | external/beacon control path, not direct economic liability mutation |
| `src/createRound.ts` create pending | BeaconRegistry initial state | `signAndSubmitTx` | setup/control path; separate authorization question remains documented |
| `relayer/registryPublisher.js` / `relayer/relayer.js` | Beacon publication | infrastructure submission | relayer/control path, not economic admission |
| `audit/**` transaction scripts | fixtures / ledger traces | direct Lucid submission/build | test/evidence infrastructure; not production application path |

## Disabled legacy path

`src/txHelpers.ts::buildClaimTx` is intentionally disabled and throws. The supported Claim path is the economic flow in `src/gameFlow.ts`.

Any stale search/index result showing an old implementation of that helper must not be interpreted as current branch source.

## Important residual boundary

Transaction construction for economic actions still occurs in application code before the Adapter signs/submits the transaction.

This is an **Adapter responsibility-scope gap**, not an identified second economic authority. The current safety boundary is:

`canonical admission witness → submitEconomic → signing/submission → on-chain validator`

Do not refactor transaction construction merely to make the architecture look cleaner; first establish whether the canonical Adapter specification requires construction centralization for B6 closure.

## Differential replay cases

The first differential suite should normalize only observable/conformance facts:

### Issue
- class/price;
- Counter input/output;
- Ticket asset identity;
- PrizeDatum issuance;
- B1 reserve/count delta;
- Treasury payment;
- economic admission reference.

### Reveal
- PrizeDatum transition;
- deterministic payout;
- B1 reserve/count/liability deltas;
- Beacon reference;
- reference-script identities;
- economic admission and liquidity source references.

### Claim
- exact crystallized liability;
- ownership input;
- expiry boundary;
- settlement asset/value;
- B1 liquidity/liability delta;
- ticket return;
- economic admission.

### Expire
- exact ticket identity;
- crystallized expiry;
- unresolved reserve/count release;
- absence of new liability;
- economic admission.

## Negative replay requirements

Every action needs at least these mismatch classes:

- wrong action class;
- missing admission;
- admission action class mismatch;
- liquidity source not among candidate inputs;
- stale/mismatched observed liquidity;
- wrong ticket identity;
- wrong price;
- wrong expiry;
- unexpected state delta;
- missing continuing output;
- duplicate singleton state;
- altered Beacon/reference-script identity where applicable.

## Current conclusion

The source inventory now has a concrete four-action economic set and a separate list of non-economic/control transaction paths.

This materially advances RF8, but **does not close RF8**. Whole-program closure still requires exhaustive path enumeration, current-head regression evidence, and coverage of dynamically loaded/future transaction constructors.

## Next implementation-safe step

Build the differential harness around canonical fixtures and normalized action envelopes first. Do not make it an economic oracle and do not move transaction construction across module boundaries until the Adapter responsibility question is resolved by the canonical specification.


## Differential replay harness — materialized

A first normalized replay harness is now present at
`src/__tests__/differentialActionReplay.test.ts`.

It:
- normalizes Issue, Reveal, Claim and Expire into a common action envelope;
- checks that each envelope remains tied to consumed input references;
- checks that the declared liquidity source is part of the consumed inputs;
- rejects an altered action class;
- rejects an inadmissible refinement instead of treating it as canonical.

The PRE-RICH action-refinement CI workflow now executes this test and triggers on its source path.

### Evidence boundary

This harness is **conformance evidence only**. It does not:
- evaluate a Cardano transaction with the native ledger;
- establish authoritative EEV;
- establish ProtectedCapital;
- decide Economic Gate or viability;
- prove on-chain semantic equivalence;
- replace P2.8 or Preprod evidence.

Therefore RF8 remains open pending exhaustive path coverage and stronger whole-program/no-side-door evidence.


## B6 replay bridge — strengthened

The existing Cardano→V3 replay surface at
`src/__tests__/immortal-cardano-replay.test.ts` is now part of the RF8/B6 differential evidence chain.

The fixture was corrected so canonical active classes are not simultaneously at their cap while marked saleable. This is a fixture-validity correction, not an economic-rule change.

Additional negative replay cases now reject:
- incorrect unresolved reserve;
- incorrect unresolved ticket count;
- duplicate ticket identity;
- non-canonical ticket price.

The intended replay chain is now explicit:

`Cardano observation → PRE-RICH observation projection → V3 pre-state → canonical expected transition → observed Cardano post-state → exact state equality`

The suite remains fixture-level conformance evidence. It does not establish that the observation itself came from an authenticated live ledger or that the native ledger accepted the transaction.
