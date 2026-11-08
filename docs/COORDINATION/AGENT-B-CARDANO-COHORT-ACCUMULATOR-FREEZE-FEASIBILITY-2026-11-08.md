# Agent B — Cardano cohort accumulator and freeze feasibility v0.1

**Date:** 2026-11-08  
**Branch:** \`work/immortal-green-closure\`  
**Exact baseline HEAD:** \`f62ed27d4f985e30686adabcd76adcadcf4c502c\`  
**Classification:** READ-ONLY FEASIBILITY / ARCHITECTURE PROPOSAL — NON-NORMATIVE  
**Role:** Agent B — Cardano/Plutus security and conformance  
**Dependencies:** Issue #43 (P0 Registry security), Issue #49 (authenticated per-round Registry identity), Agent B Statistical Issue Decision Binding Contract v0.1, Agent A Cantelli/Reveal-path research.

## 1. Executive result

A permissionless cohort accumulator is technically expressible in Cardano's UTxO model, but **it cannot safely be implemented against the current Registry/Mint/Pool contracts**.

The minimal safe shape is:

1. a unique, authenticated per-round Registry identity and publisher binding;
2. one Pool-scoped, append-only cohort state updated atomically with every Issue;
3. a deterministic freeze transition before any included Registry may become Ready;
4. an Issue gate that refuses enrollment once the cohort is frozen;
5. a complete and authenticated B1 capital perimeter;
6. explicit handling of already-pending tickets, overlapping epochs and lifetime risk allocation.

The current source fails the first requirement. Issue #49 must be designed and separately approved before a cohort can rely on Registry state. The current MintPolicy/PrizeValidator read first matching Registry outputs by payment ScriptHash, while a Ready-shaped output can be created without executing BeaconRegistry. Existing B0/Yaci evidence has already characterized fake-Ready acceptance and reference-order dependence. A cohort root built on those references would be cryptographically tidy but semantically unauthenticated.

**Disposition:** proceed with design and conformance planning only. No code, ABI, validator, MintPolicy, B1 datum, V3, Reveal, workflow, deployment or ledger change is authorized by this note.

## 2. Exact source facts at baseline

### 2.1 Issue path does not currently require a cohort state

\`plutus/MintPolicy.hs::mkPolicy\` checks the counter, ticket mint, new Pending PrizeDatum, Treasury payment and B1 pool reservation. Its \`newPrizeDatumValid\` reads a Registry reference by the configured Registry payment ScriptHash, then checks the target, round and \`BeaconPending\` status.

The MintPolicy's \`readRegistry\` returns the first matching reference input. It does not require:
- a Registry identity NFT;
- exactly one matching reference input;
- a unique independently authenticated per-round Registry instance;
- a cohort accumulator input/output;
- a cohort membership append.

\`atomicPoolReservationValid\` enforces a single B1 Pool input/output and the aggregate face-reserve/count increment, but no separate cohort state is involved.

The B1 \`TicketIssued\` validator checks the Pending PrizeDatum, exact ticket NFT mint, price binding, unchanged total liquidity and reserve/count increments, and deterministic solvency. It does not currently require or update a cohort state.

Therefore an off-chain cohort list or a DApp-side call to an accumulator is not a completeness guarantee. The on-ledger Issue predicates themselves must make enrollment mandatory.

### 2.2 Registry readiness is not currently a trustworthy freeze barrier

\`plutus/BeaconRegistry.hs::validatePublish\` checks:
- the consumed datum is \`BeaconPending\`;
- the transaction includes the \`brRelayerPkh\` supplied in that Pending datum;
- the target and round are carried through;
- the output becomes \`BeaconReady\`;
- the Beacon is derived from the supplied target, mainchain hash and Materios context.

It does not independently authenticate the Pending Registry identity or its creator-nominated publisher, preserve the complete continuing Value, or require a cohort-frozen reference.

\`src/createRound.ts\` explicitly documents that Pending Registry initialization is not constrained by an on-chain validator. Any party can create a competing Pending output and nominate a different relayer key.

\`plutus/PrizeValidator.hs::readRegistry\` and \`plutus/MintPolicy.hs::readRegistry\` select the first matching payment ScriptHash reference. They do not reject multiple matching references or prove a state-token identity. Client-side uniqueness checks are not the ledger boundary.

Issue #43 records exact local-Yaci characterization:
- a Ready-shaped output can be created without executing BeaconRegistry;
- SyncBeacon can accept a fake Ready reference in the isolated Aiken transaction test;
- multiple Registry references can produce order-dependent acceptance;
- RegistryPublish value/round continuity findings remain open.

These results are characterization evidence, not production ledger qualification. They nevertheless prove that the current Registry interface cannot be used as a trusted cohort-freeze guard.

### 2.3 One global B1 Pool already serializes Issue state

The current B1 datum is explicitly one global PrizePool state. Its Issue reservation requires:
- \`ppUnresolvedReserve' = ppUnresolvedReserve + pdPriceUsdm\`;
- \`ppUnresolvedTicketCount' = ppUnresolvedTicketCount + 1\`;
- \`ppTotalLiquidity'\` unchanged.

The current B1 accounting does not carry cohort ID, epoch sequence, membership root, target set, freeze status, capital tranche, or risk-budget consumption.

The B1 Reveal path checks payout against the pre-transition \`effectivePool\`, then crystallizes the exact payout as a pending liability and releases the face-price reserve. The current deterministic 500× solvency invariant is independent of any statistical assessment.

## 3. Minimal candidate architecture

This is a logical design candidate, not a frozen datum/redeemer ABI.

### 3.1 Pool-scoped CohortState

A dedicated singleton state UTxO per B1 Pool could contain:

- protocol/network and exact B1 Pool identity;
- \`cohortId\` and monotonic \`epochSequence\`;
- lifecycle state: OPEN / FROZEN / RESOLVING / CLOSED;
- profile, model and risk-policy versions/digests;
- incremental ticket-membership accumulator (MMR or equivalent append-only authenticated structure);
- enrolled member count and aggregate face sum;
- authenticated per-round Registry identity set/commitment and target count;
- freeze sequence, ledger reference and exact Pool snapshot commitment;
- the integer statistical result inputs/result digest;
- remaining unresolved member count/face sum after freeze;
- allocated risk budget and lifetime budget-consumption reference.

The state must be anchored by a unique authority asset. Its initialization and minting authority must be independently specified. A script address plus a datum supplied by a wallet is not sufficient singleton identity.

### 3.2 Atomic Issue enrollment

Each eligible Issue transaction must consume and continue the exact B1 Pool and CohortState UTxOs. The same transaction must:

1. validate exactly one current authenticated Pending Registry for the ticket's complete \`BeaconTarget\`;
2. prove that Registry identity is already enrolled in the same OPEN cohort;
3. verify that the ticket's profile/model identity is compatible with the cohort;
4. derive the leaf from the exact ticket NFT policy/name, PrizeDatum identity/hash, face price, game version, target and Registry identity;
5. append exactly one leaf to the membership accumulator;
6. increment member count and face sum by exactly one ticket and its exact price;
7. increment the B1 reserve/count by the same price/member;
8. create the exact Pending PrizeDatum and mint exactly one ticket NFT;
9. bind the action and both state transitions to the exact consumed UTxO references and successor hashes.

The accumulator update cannot be only a MintPolicy convention if the B1 transition can be invoked through another compatible ticket policy or another transaction path. The authoritative B1/Issue validator boundary must make omission impossible. The exact script dependency graph must be designed before choosing whether enforcement resides in B1, the canonical mint policy, or both.

A single B1 Pool UTxO already serializes competing Issue transitions. A separate CohortState UTxO adds another mandatory shared input and therefore another serial contention point; it does not remove serialization. Every concurrent Issue must re-read/rebuild against the latest Pool and cohort heads.

### 3.3 Accumulator representation

An append-only Merkle Mountain Range (MMR), or a similarly bounded authenticated append structure, is a better candidate than storing every ticket leaf in the datum:

- each Issue adds one ticket leaf;
- the on-ledger state stores a root/peaks, leaf count and aggregate face sum;
- a membership proof can later bind a ticket transition to the frozen cohort;
- datum size grows logarithmically rather than linearly.

A plain rolling hash chain has a smaller append operation but does not provide an efficient membership proof for an older ticket without supplying/replaying the history. A bare Merkle root does not prove completeness: completeness comes only from every eligible Issue being forced to append atomically.

A separate target accumulator must bind the set of per-round Registry identities. The ticket accumulator alone cannot prove that all BeaconTargets capable of revealing enrolled tickets are covered by the freeze barrier.

No choice between MMR, sparse Merkle structure or another accumulator is approved here. The reference implementation must be independently tested against collision/domain-separation, duplicate leaf, append order, inclusion proof, malformed proof and root replay vectors.

### 3.4 Freeze and Registry publication coupling

A publicly callable freeze transition may consume the OPEN CohortState and continue it as FROZEN only after validating:
- the exact Pool snapshot and aggregate accounting;
- model/policy/version binding;
- complete member/target accumulators;
- every enrolled Registry identity's relationship to this cohort;
- the capital and lifetime-risk-budget contract;
- the policy-defined freeze trigger.

A critical sequencing rule is required: **every RegistryPublish transition for an enrolled target must require a reference to the exact FROZEN cohort state and prove its cohort/target membership**. Otherwise a Beacon could become Ready before the cohort freezes.

This creates a necessary dependency on Issue #49:
- every per-round Registry must have a unique authenticated identity;
- the initial Pending output must be authorized;
- publisher authority must be independently bound;
- the Registry must preserve exact state identity and complete Value;
- the Registry's Publish action must check the cohort freeze state;
- all MintPolicy/PrizeValidator consumers must use the same unique identity read rule.

A simple client-side freeze check is insufficient. A signed checkpoint or a user-supplied list of target IDs is insufficient. An unauthenticated Ready-shaped output must never count as a cohort member or as valid evidence that a target is frozen.

### 3.5 Issue after freeze and future epochs

When the cohort is FROZEN, no Issue may append to it. A subsequent Issue must either:
- be rejected until that cohort reaches CLOSED; or
- enter a distinct new cohort with separately evidenced, non-overlapping capital and lifetime-risk-budget allocation.

The first option is the smallest safe design: one active cohort per global B1 Pool, no new Issue while it resolves. It avoids simultaneous statistical cohorts but pauses sales during resolution and therefore does not deliver continuous/adaptive ticket issuance.

The second option is materially more complex. It requires multiple epoch states plus an authenticated allocation mechanism that prevents old and new cohorts from spending the same B1 capital. Merely subtracting an off-chain \`C_other\` from a reported \`effectivePool\` does not enforce non-overlap. If the same B1 Pool remains the sole liquidity source, its Reveal validator must also enforce the epoch-level capital ownership/allocation; otherwise one epoch's payout can consume funds silently counted for another epoch.

A separate vault/tranche design also requires explicit integration with B1 payout settlement. Moving assets out of B1 would change B1 liquidity and its current solvency behavior; leaving assets in B1 without a ledger-enforced lock would not create a real tranche. Neither option is implemented in the current B1 datum.

Therefore the multi-cohort route must be treated as a B1 accounting/validator design project, not as a small addition to a TypeScript or relayer accumulator.

## 4. Freeze liveness and denial-of-service risk

Permissionless submission does not automatically make an irreversible freeze safe.

If any party can freeze an OPEN cohort at any time, a third party can freeze it prematurely and prevent further ticket enrollment. A valid freeze therefore needs an objective, profile-bound trigger or a permissionless timeout/closure rule with an explicitly accepted liveness trade-off.

This document does not select:
- a freeze time/window;
- a member-count or round-count trigger;
- a game/round schedule;
- an emergency freeze authority;
- a cancellation/recovery path.

A freeze rule must preserve both safety and liveness. Any emergency override or privileged thaw key would be a trust assumption and must be explicit, not hidden in an adapter.

## 5. Capital and risk-budget consequence

The fixed-cohort Cantelli argument requires a single exact pre-Reveal capital value \(C\) and a frozen, complete membership set. The candidate next-epoch budget would be:

\`\`\`text
E* = effectivePool_B1 - C_other
\`\`\`

The current B1 datum has no authenticated \`C_other\` or epoch capital allocation. Its \`effectivePool\` is denominated in USDM accounting sub-units and \`ppTotalLiquidity\` is derived through the current configured Oracle State valuation path. It must not be treated as direct physical tUSDM or immediately executable liquidity.

The current B1 legacy projection also derives the 500× deterministic WCE separately from the nominal face reserve. Its current B1 validator enforces that deterministic solvency floor on Issue. Consequently:
- adding a cohort accumulator does not raise V1 capacity;
- keeping B1 V1 unchanged means the 500× floor still controls Issue;
- using Cantelli to increase capacity requires a separately approved application profile and an explicit B1/Issue enforcement design;
- overlapping cohorts require actual ledger enforcement of capital partitions and one global lifetime risk-budget rule.

A statistical number stored in \`ReserveProtection\` is not an acceptable shortcut. Statistical assessment, face-price reserve, deterministic WCE, crystallized liabilities and other protected components remain separate.

## 6. Failure modes and conformance matrix

The following cases are required before any implementation can be considered safe. Tests must run against ledger-level transaction contexts, not only pure TypeScript mocks.

| ID | Adversarial case | Required outcome |
|---|---|---|
| REG-01 | Fake Pending/Ready output without authenticated per-round identity token | Reject |
| REG-02 | Two Registry reference inputs for the same target, either order | Reject |
| REG-03 | Same target identity issued in a second transaction | Reject |
| REG-04 | Publisher nominated by Pending creator instead of authorized source | Reject |
| REG-05 | RegistryPublish does not reference exact FROZEN cohort | Reject |
| REG-06 | Registry identity or complete Value changes on Publish | Reject |
| ENR-01 | Issue omits CohortState input/output | Reject |
| ENR-02 | Issue updates B1 but not cohort root/count/face sum | Reject |
| ENR-03 | Cohort updated without exact B1 Pool and ticket NFT/PrizeDatum transition | Reject |
| ENR-04 | Duplicate ticket leaf or wrong ticket NFT identity | Reject |
| ENR-05 | Wrong price, target, Pool, game version or profile digest | Reject |
| ENR-06 | Issue references non-OPEN cohort | Reject |
| ENR-07 | Concurrent Issue built on stale cohort head | Ledger conflict / rebuild; never double-append |
| FRZ-01 | Freeze before objective policy trigger | Reject |
| FRZ-02 | Freeze with missing or unauthenticated target membership | Reject |
| FRZ-03 | Beacon Ready before freeze | Reject |
| FRZ-04 | Cohort root/member count/face sum mismatch | Reject |
| FRZ-05 | Freeze replays against another Pool or epoch | Reject |
| FRZ-06 | Any included Registry identity not bound to the epoch | Reject |
| LIFE-01 | Issue appended after FROZEN | Reject |
| LIFE-02 | Ticket Reveal/Expire not proven a cohort member | Reject |
| LIFE-03 | Cohort CLOSED while Pending members remain | Reject |
| CAP-01 | Same capital tranche allocated to two cohorts | Reject |
| CAP-02 | New cohort assumes C_other = 0 without evidence | Reject |
| CAP-03 | Reveal from one cohort spends another cohort's reserved capital | Reject |
| CAP-04 | Oracle-denominated Pool value presented as physical tUSDM/executable liquidity | Reject |
| CAP-05 | Statistical result overwrites/lowers V1 WCE or ReserveProtection | Reject |
| BUD-01 | Same lifetime ε reused by another epoch without allocation | Reject |
| BUD-02 | New Issue after outcome availability without conditional-moment proof | Reject |
| LIVE-01 | Arbitrary third party can irreversibly freeze before approved trigger | Reject / liveness defect |
| LIVE-02 | Only privileged key can freeze or thaw without explicit authority policy | Reject / trust defect |
| REGRESSION-01 | V1, V3 or Reveal semantics altered by cohort bookkeeping | Reject |

## 7. Required order of work

1. **Close the Registry security design gate (Issue #49):** select the per-round identity issuance/trust-root design, independent publisher binding, exact unique-reference read contract, state-token continuity, migration and script-hash dependency solution. No cohort certificate may treat today's Registry output as authenticated.
2. **Define cohort/epoch policy:** identify who/what triggers freeze, whether one epoch per Pool is acceptable, and how future epochs and lifetime ε are handled.
3. **Define capital semantics:** settle whether the guarantee is over B1 accounting \`effectivePool\`, directly verified settlement assets, or another explicit capital predicate; prove non-overlap with known obligations and any other epoch.
4. **Choose accumulator representation:** provide a deterministic reference implementation, canonical encoding and differential proof vectors.
5. **Approve a separate bounded implementation slot:** only after architecture/policy review; enumerate exact changed paths and preserve current V1, V3, Reveal and deployed datum/redeemer compatibility.
6. **Run local native-ledger conformance:** all Issue/Registry/freeze adversarial vectors, stale/concurrent state tests, membership inclusion proofs, and complete transaction size/CEK budgets.
7. **Migration/deployment qualification:** independently approved staged migration for old Registry outputs and Pool state; no old unauthenticated Registry may be upgraded by client assertion.

## 8. Explicit scope boundary

- No code, tests, scripts, workflow, datum/redeemer ABI, B1 validator, MintPolicy, PrizeValidator, BeaconRegistry, V3 Carrier or DApp changes are made or authorized here.
- No RiskMode, \`ε\`, freeze threshold/time, cohort capacity, capital haircut or source/quorum is selected.
- PRE-RICH V1 500× remains in force.
- V3 and Reveal semantics are unchanged.
- Issue #43 remains P0/release-blocking and Issue #49 remains design-only until separately approved.
- The first real Preprod Issue remains governed by Issue #37; this statistical architecture work must not delay or silently change those independent gates.

## 9. Agent B conclusion

The eUTXO model can support a permissionless append/freeze state machine, but only if every Issue and every Registry publication is forced through the same authenticated, atomic state transitions. The current repository does not yet provide those guarantees.

The smallest safe cohort model serializes one OPEN/FROZEN epoch per global B1 Pool and pauses new Issue while that epoch resolves. Continuous Issue across overlapping epochs requires a real ledger-enforced capital partition and B1 payout ownership rules; the current Pool datum and validator do not contain them.

The immediate dependency is therefore Issue #49's authenticated per-round Registry design, followed by an explicit freeze/liveness and capital policy decision. An off-chain accumulator, a client-side guard or a Merkle root without mandatory on-ledger enrollment cannot make the present path permissionless or trustless.
