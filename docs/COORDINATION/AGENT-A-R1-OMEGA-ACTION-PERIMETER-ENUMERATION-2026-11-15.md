# Agent A — R1 authoritative Ω action-perimeter enumeration

**Date:** 2026-11-15  
**Branch:** work/immortal-green-closure  
**Classification:** READ-ONLY SOURCE-BASED ACTION / STATE-PERIMETER AUDIT — NON-NORMATIVE; NO IMPLEMENTATION  
**Scope:** Extend the current PRE-RICH R1 model beyond the four V3 economic constructors and enumerate the independently accepted Cardano state and rights transitions that must be represented in authoritative Ω.

## 1. Executive finding

The deployed application does not have one monolithic economic transition enum. The current action surface is distributed across:

- V3 economic state and its signed singleton carrier;
- the B1 PrizePool state machine;
- the PrizeDatum state machine;
- the serial-ticket MintPolicy, including a separate NFT-burn branch;
- Counter, BeaconRegistry, B2 Control and Genesis carriers;
- permissionless ledger-level ticket-NFT transfers;
- external reference observations, especially Direct-USDM UTxO liveness and Oracle/Registry data.

The five B1 PrizePool constructors and four PrizeDatum constructors do not describe all accepted state changes. In particular, a ticket NFT can move between key/script UTxOs or be burned without an accompanying PrizeDatum expiry/claim transition. Those operations may not directly change ProtectedCapital, but they change the bearer/claim interface and must be represented when the invariant requires complete obligation and rights representation.

This is an action-inventory refinement, not a proof that the list below is already an authoritative complete Ω. The current source still lacks a deployment-bound successor-set generator/proof, and several transitions have cross-carrier refinement gaps.

## 2. Source-grounded accepted action surfaces

### 2.1 V3 economic state / carrier

The canonical V3 economic transition layer has four constructors: Issue, Reveal, Claim and Expire. The on-chain V3 singleton carrier accepts the corresponding action-class labels only (Issue, Reveal, Claim, Expire), requires a signed state/action/post-state binding and preserves the carrier token's full Value.

The carrier verifies signature and hash endpoints; economic transition validity and viability are separately supplied by the Haskell/admission boundary. The carrier does not enumerate the authoritative Ω perimeter.

**R1 relevance:** these four actions cover the V3 representation, but they are not the complete PRE-RICH/Cardano action set.

### 2.2 B1 PrizePool

The current B1PrizePoolAction enum has five constructors:

| Action | ProtectedCapital / direct-EEV role | Current source boundary |
|---|---|---|
| FundTreasury | Normally ΔPC=0; requires direct-EEV monotonicity for QNE | Recomputes Oracle-valued output liquidity and requires it to increase; it does not require physical tUSDM monotonicity |
| TicketIssued(P) | ΔPC=+500P; not QNE | TicketIssued reserves the exact price, and the separate MintPolicy sale path requires same-transaction counter advance, ticket mint, Pending PrizeDatum, Treasury payment and Pool reservation |
| TicketRevealed(P) | ΔPC=Y−500P | Requires matching PrizeDatum and accounting deltas, but does not compare the complete physical Pool Value |
| TicketClaimed(Y) | ΔPC=−Y | Requires Oracle-valued Pool input/output delta equal to Y; this does not imply the direct physical tUSDM delta bound |
| TicketExpired | Pending: −500P; Revealed: −Y or 0 | Requires complete Pool Value equality; pending/revealed liability updates differ |

These are distinct on-chain Pool-spending actions; they cannot be reduced to the four V3 constructors without an explicit state refinement relation.

### 2.3 PrizeDatum and ticket-right lifecycle

The current PrizeAction enum has SyncBeacon, Reveal, Claim and Expire.

- SyncBeacon consumes/continues a Pending PrizeDatum, reads Registry as a reference input and copies the Ready beacon fields. It preserves the PrizeDatum script Value and does not itself change Pool accounting.
- Reveal converts Pending to Revealed and crystallizes the deterministic payout. It must be paired with B1 TicketRevealed in the same transaction.
- Claim converts Revealed to Claimed, checks owner signature and payout, preserves the PrizeDatum script Value and must be paired with B1 TicketClaimed.
- Expire consumes a Pending or Revealed PrizeDatum at/after expiry with no continuing PrizeDatum. It is paired with B1 TicketExpired. The ticket NFT is independent and may remain held.

The Expire source path can release a Revealed payout liability from B1 while preserving physical Pool Value. The V3 Expire mapping observed in the earlier Agent A audit only releases unresolved reserve/count; a deployment-wide refinement for revealed expiry remains open.

### 2.4 Ticket NFT transfer and independent burn

The ticket NFT is not locked inside the PrizeDatum script UTxO. PrizeValidator Claim derives the claimant from the input carrying exactly one ticket NFT and requires that key credential to sign. The Claim transition explicitly does not require burning the NFT. PrizeValidator Expire also consumes the PrizeDatum without requiring the ticket NFT to be consumed or burned.

Consequences for Ω:
- ordinary Cardano transactions can transfer the NFT between UTxOs without a PrizeAction constructor;
- that transfer changes the future claimant selected by Claim, even though B1/V3 economic accounting is unchanged;
- after expiry, the NFT may remain independently held;
- the MintPolicy has a separate burn branch: if its own policy mint field contains exactly one token-name entry with amount −1, the branch returns True before evaluating the Issue sale path. It does not bind that burn to a consumed PrizeDatum, expiry, Claim, owner signature or B1 Pool transition. Cardano ledger conservation still requires the burned asset to be present in transaction inputs; the on-chain policy predicate itself does not supply the missing lifecycle linkage.

This finding does not assert that every burn is unauthorized or that it necessarily extinguishes a valid payout. It means that NFT ownership, transfer, burn, and PrizeDatum/Pool obligation closure are separate state dimensions. A valid R1 representation predicate must explicitly define the relationship among them and must not assume that NFT burn is equivalent to Claim or Expire.

### 2.5 Counter / Registry / control / Genesis / lifecycle

| Carrier | Accepted transition | Economic effect / R1 relevance |
|---|---|---|
| CounterValidator | Integer datum n → n+1 | Issue sequencing state. It does not itself change Pool EEV or ProtectedCapital. Its address/identity matters to MintPolicy and is independently under Agent B's Registry/Counter work |
| BeaconRegistry | RegistryPublish: Pending → Ready | Relayer-signed beacon publication. Changes the truth/readiness input used by SyncBeacon/Reveal; no direct Pool or PC delta |
| B2 PreRichControlCarrier | ActivateControl / ContractControl | Authority-signed control-state updates; changes active/highest class and thus future saleability, but does not itself update V3 or B1 Pool |
| GenesisRegimeCarrier | ActivateGenesis: PreGenesis → Genesis | One-shot regime activation with authenticated Treasury/Oracle references. It explicitly rejects B1 PrizePool inputs and outputs in the same transaction; it is not a recurring Active/Quiescent witness |
| PreRichLifecycleTransition helper | EnterQuiescent / MaintainQuiescent | Pure helper only. No on-chain carrier or atomic Pool/V3/lifecycle transaction was found in the inspected source boundary |

These state machines influence future action availability and the interpretation of S0. They must be included in the joint state even when their immediate direct-EEV and ProtectedCapital deltas are zero.

## 3. External and ledger-environment successor dimensions

The deployment Ω must also account for environmental changes that are not constructors in the above Plutus enums:

1. Exact Pool UTxO spent/replaced, duplicate or stale out-reference, and competing transactions that race a reference snapshot.
2. Direct-USDM source asset identity, physical tUSDM quantity and immediate liveness/finality of the exact Pool UTxO.
3. Oracle reference-input identity, asset-specific quote set, publisher, timestamp/freshness and missing/duplicate quote behavior. B1 Claim and FundTreasury acceptance is Oracle-valued even though Direct-USDM EEV is physical tUSDM.
4. BeaconRegistry state and external Materios/relayer evidence changes that affect SyncBeacon and Reveal eligibility.
5. Ticket NFT transfer, lock-up in a script UTxO, burn and eventual expiry of its separate PrizeDatum.
6. Validity-range/time transitions across Claim-before-expiry and Expire-at/after-expiry boundaries.
7. Transaction ordering, UTxO concurrency, rollback/finality and source unavailability.

The Oracle data module supplies authenticated quote lookup primitives, but the inspected PRE-RICH Plutus boundary did not expose a single Oracle state-transition validator that can be treated as the complete source of Oracle update semantics. The external publisher/update mechanism therefore remains an explicit Ω dependency until its deployed authority and transition rules are bound.

## 4. Current R1 implications

The candidate joint state must distinguish at least:

- V3 economic datum + exact V3 carrier UTxO;
- B1 Pool datum + full Value + exact Pool UTxO;
- individual PrizeDatum states and their expiry;
- each ticket NFT unit and the UTxO/credential currently holding it;
- Counter, Registry, B2 Control and Genesis/lifecycle singleton references and versions;
- the direct-USDM profile and exact external observation/Oracle/Registry reference cut.

An action may leave EEV and ProtectedCapital unchanged while changing whether a future Claim is executable (NFT transfer/burn), whether a future Issue is admissible (B2 Control), or whether a future Reveal is admissible (Registry/Oracle/expiry state). Those are not economic deltas, but they still affect whether obligations remain represented and whether the witness selector is total.

The allOmegaSuccessorsCertified boolean in the signed Issue-authority payload is not evidence that these dimensions have been enumerated. The lifecycle helper's supplied witness list likewise cannot establish its own completeness. Ω must cover these accepted actions and external successor classes under the same deployment-bound state identity.

## 5. Ownership and closure handoff

- **Agent A:** maintain the complete joint-state/action inventory, define the exact Ω perimeter/over-approximation, bind the S0 state and prove VC1–VC6/E1–E10.
- **Agent B:** close B1 Registry/Counter identity and independently review atomic script/UTxO transaction boundaries, NFT representation/burn effects and the Claim/expiry dual-validator path.
- **Deployment/authority owner:** bind exact Oracle publisher/update authority, Direct-USDM asset profile, control/registry identities and finality/freshness rules to the same deployed S0.

No new action, ABI, validator, proof system, coefficient, RiskMode, payout rule or action restriction is selected by this report.

## 6. Disposition

The four-action V3-only model is incomplete as the actual PRE-RICH Ω. The current system has additional B1, PrizeDatum, ticket-NFT, Counter, Registry, Control and Genesis/lifecycle transitions, plus external observation/time/UTxO successors. The independent MintPolicy burn branch is not transactionally tied to PrizeDatum expiry or Claim.

This enumeration improves the specification of the proof obligation; it does not prove Ω completeness or close R1/Kc. Reveal/Claim/FundTreasury Direct-USDM issues have compiled-CEK test specifications in place, with CI execution still pending. Agent B's B1 Registry identity P0 remains independent. First real Preprod Issue remains **NO-GO**.

**Non-effects:** no production source, test, validator, MintPolicy, datum/redeemer ABI, workflow, wallet, signature, deployment or ledger state changed or executed by this audit.
