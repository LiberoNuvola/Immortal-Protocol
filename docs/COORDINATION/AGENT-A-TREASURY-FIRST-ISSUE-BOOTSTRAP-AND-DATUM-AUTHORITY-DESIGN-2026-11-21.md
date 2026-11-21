# Agent A — first-Issue Treasury bootstrap and datum-authority design

**Date:** 2026-11-21  
**Branch / inspected HEAD:** `work/immortal-green-closure` / `0b677353241848539b25c42ac77191c9d975ffed`  
**Classification:** NON-NORMATIVE SECURITY / IMPLEMENTATION DESIGN CANDIDATE — NO POLICY, ABI OR IMPLEMENTATION AUTHORITY  
**Owner:** Agent A — PRE-RICH first-Issue readiness  
**Related blocker:** [Issue #41 — Treasury receipt journal and batch-settlement carrier](https://github.com/LiberoNuvola/Immortal-Protocol/issues/41)  
**Related gate:** [Issue #37 — USD/USDM, EEV and first-Issue admission](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37)

---

## 1. Executive disposition

The first TicketSale currently has a circular Treasury bootstrap dependency:

1. the application insists on finding an existing Treasury UTxO to read a datum;
2. it copies that raw datum into the Treasury receipt output created by the TicketSale;
3. no current UTxO is returned for either tracked Treasury script identity;
4. the existing manual deposit UI can create the first UTxO, but it creates the legacy nine-field `TreasuryDatum` with threshold zero, four repeated zero ScriptHashes and a 25% split;
5. the legacy on-chain `Distribute` transition remains present and does not conserve the complete Cardano `Value`.

**The manual deposit is not an acceptable bootstrap mechanism.** It both creates the datum-bearing legacy input and leaves the datum-authority and spend-capability problems unresolved.

This note proposes a safer direction: keep one logical PRE-RICH Treasury, keep each TicketSale's receipt as one exact Treasury payment output, and introduce a separate authenticated singleton accounting-state carrier. The first Issue must be able to create or continue that carrier atomically without inheriting an arbitrary public datum. Sale receipt recognition must remain distinct from category allocation: this proposal assigns no percentage, does not automatically credit the Prize category, and does not change the 500× rule or any other game economics.

**No source, test, validator, datum, redeemer, policy, script hash, workflow, wallet, signature, transaction or ledger state was changed.**

## 2. Current source facts at the inspected HEAD

### 2.1 TicketSale currently requires an existing Treasury datum

- `src/mint.ts::getTreasuryDatum` calls `lucid.utxosAt(treasuryAddress)`, then `selectConsistentTreasuryDatum`. An empty set fails with `TREASURY_UTXO_SET_EMPTY`.
- The TicketSale transaction does not consume the selected Treasury UTxO. It later creates a single output with `payToContract(treasuryAddress, inline: treasuryDatum, treasuryPaymentAssets)`.
- The policy's `atomicTreasuryPaymentValid` finds exactly one output under the Treasury ScriptHash and verifies that its Oracle-valued basket equals the ticket price. It does **not** decode or authenticate the Treasury output datum.
- Thus the current selector is an input to datum propagation, not a protocol-state transition or authority proof.

Relevant source:
- `src/mint.ts::getTreasuryDatum`, `getTreasuryDatum` use and the TicketSale Treasury `payToContract`.
- `src/treasuryIdentity.ts::selectConsistentTreasuryDatum`.
- `plutus/MintPolicy.hs::singleScriptOutputValue` and `atomicTreasuryPaymentValid`.

### 2.2 Datum consistency is not datum authentication

`selectConsistentTreasuryDatum` currently checks:
- the set is non-empty;
- each UTxO's address matches the supplied Treasury address;
- output references are unique;
- each datum is present and can be represented canonically;
- every returned datum has the same canonical representation.

It does not check that the datum decodes to the approved nine-field Treasury schema, that the four recipients match an authorized configuration, that percentages are approved, or that a config commitment/signature is valid. Its own source comment states that consistency is not authentication.

Because a sender can pay a public script address with an inline datum without executing the script's spending validator, the UI is not the only possible datum producer. A first arbitrary datum-bearing UTxO can be selected and copied; conflicting datums can make the selector reject the complete set.

### 2.3 The legacy spending validator cannot be the V2 accounting authority

The current `plutus/Treasury.hs` has only `TreasuryAction = Distribute`. The validator:
- calculates the percentage base from input lovelace only;
- checks minimum lovelace at outputs with matching ScriptCredentials;
- does not enforce an exact output set, distinct recipient identities, or full native-asset conservation;
- has no configured datum commitment or publisher/owner authorization.

The current public UI producer `src/treasuryPage.ts::treasuryDatum()` emits `Constr 0 [0, zero, zero, zero, zero, 2500, 2500, 2500, 2500]`. The deprecated `src/treasuryPolicy.ts` must not be promoted as a replacement allocation rule.

### 2.4 There is a usable transaction-ordering primitive, but it is not a complete state-authentication mechanism

The current Ticket mint policy:
- finds Counter inputs by the Counter ScriptHash and requires exactly one matching input for a sale;
- reads its integer datum `n`;
- requires a Counter output with datum `n + 1`.

The current Counter validator additionally requires exactly one successor output at the same address, no extra outputs at that Counter address, and at least preservation of the input lovelace.

This is a useful serialization anchor: two Issue transactions cannot both consume the same exact Counter UTxO. It does **not**, by itself, prove that the entire ledger contains exactly one valid Counter UTxO, nor does it authenticate a Treasury state marker. A new state transition must prove its own singleton/continuation rules.

### 2.5 The existing accounting specification already points to the appropriate topology

`docs/research/PRE-RICH-TREASURY-CATEGORY-LEDGER-OPERATIONAL-SPEC-2026-11-04.md`, §§11.4 and 11.14, recommends:
- one logical PRE-RICH Treasury with multiple physical custody UTxOs;
- one authenticated singleton Treasury accounting-state reference;
- category balances and movements keyed by exact asset unit (policy ID + asset name; ADA separately);
- a distinction between receipt recognition, category posting and actual Treasury-to-PrizePool physical funding;
- a state carrier separate from the TicketSale receipt output, because the current MintPolicy accepts exactly one Treasury payment output and values that entire output against the ticket price;
- state continuation integrated into an already-required TicketSale or a separately authorized batch, rather than treating an observer journal as spending authority.

This note refines that already-recorded target for the first-sale bootstrap; it does not replace the category-ledger specification.

## 3. Required design invariants

The following are security/conformance requirements, not new economic policy:

1. **One logical Treasury.** A state carrier is an authenticated accounting-state anchor, not another Treasury wallet, a second PrizePool or a new economic authority.
2. **Exact asset identity.** Every receipt, category balance and state delta uses the complete Cardano asset unit. ADA is represented separately; ticker text and fiat scalars are not asset identity.
3. **Datum authority is independent of datum consistency.** A UTxO is canonical only if its marker/configuration and datum are authenticated against the active deployment. First-returned or all-equal datums are not sufficient.
4. **One canonical state.** The state carrier has a unique singleton marker, an explicit deployment/config identity, a monotonically advancing sequence and an exact continuation rule. Duplicate, stale, conflicting or unrecognized states fail closed.
5. **TicketSale receipt remains one output.** Preserve the current requirement for exactly one Treasury receipt output whose complete Value is the exact settlement basket verified by the existing Oracle path. Do not place the accounting-state carrier at the same Treasury payment ScriptHash while `singleScriptOutputValue` has this contract.
6. **Atomic receipt evidence.** The same Issue transaction binds its exact Treasury receipt output reference, ticket NFT and Counter transition to the state transition/receipt record.
7. **No implicit category allocation.** A TicketSale receipt may be recorded as received/unclassified or pending classification until the PRE-RICH posting rule is explicitly adopted. This note does not assign gross sale proceeds to Prize, Reserve, Maintenance, Reward or PRE-holder staking.
8. **No silent legacy migration.** The current and historical Treasury script identities remain legacy. No UTxO is to be moved, inherited or spent under a new identity without a separately reviewed migration path.
9. **Full Value conservation on any future Treasury spend.** A new spend path must account for every lovelace and every native-asset quantity across the exact authorized outputs. Lovelace-only percentage checks are not sufficient.
10. **No non-regression.** No change to V3, Reveal, ticket identity, B1 PrizePool transition semantics, 500×, KA/KC/KD, price ladder, Oracle semantics or ProtectedCapital/R1 policy is proposed here.

## 4. Candidate topology

### 4.1 Separate receipt custody from the accounting-state carrier

Keep the TicketSale's one payment output at the canonical Treasury receipt/custody identity. Introduce a distinct Treasury accounting-state script/address carrying a singleton marker and its inline state datum.

The singleton state is the authoritative sequence and category-ledger anchor. Physical custody remains the set of actual Treasury receipt UTxOs. The state carrier must not be treated as proof of physical backing by itself: each represented receipt and asset balance must reconcile to exact live Treasury UTxOs and transaction references.

The state carrier should minimally identify:
- schema/version;
- deployment and canonical Treasury identity;
- immutable configuration/authority commitment;
- unique singleton marker identity;
- state sequence;
- exact native-asset units and quantities represented by the ledger;
- receipt event references and whether each is unclassified, classified under an already-authorized rule, or physically settled;
- prior-state input reference and the transaction that created the continuation;
- verifier/evidence digest or an equivalent reconstructible commitment.

These are semantic minimums. The exact encoding, marker policy and data layout require a separate implementation design and may not be copied from a research-only B3 reward model.

### 4.2 Bootstrap alternatives

Two implementation paths are plausible. Neither is authorized or selected by this note.

**A. Atomic first-Issue initialization (preferred feasibility candidate)**

The first valid TicketSale transaction:
- consumes the canonical initial Counter UTxO;
- mints exactly one Treasury-state marker under a one-shot policy tied to a deployment-pinned bootstrap reference (a candidate anchor is the exact initial Counter out-ref);
- creates the first singleton state-carrier output with the approved configuration commitment and initial sequence;
- creates the one Treasury receipt output with the exact Oracle-valued settlement basket and authenticated receipt datum;
- creates the ticket/Prize outputs and the B1 reservation already required by the existing Issue path.

Later TicketSales consume the current state carrier and create exactly one continuation with the sequence advanced and the new receipt event committed. The state carrier and the receipt output are separate script identities, so the existing one-Treasury-payment-output predicate remains unambiguous.

The state marker's one-shot policy must make duplicate genesis impossible even if a caller tries to create an extra carrier output. The first-state branch must be tied to a specific authorized genesis condition; the mere absence of a state input must never be enough to create a second genesis. A Counter datum value by itself is not a substitute for an immutable one-time reference.

**B. Explicit state initialization before the first TicketSale**

A separate, explicitly authorized deployment/bootstrap transaction creates the singleton marker and initial state carrier without moving or depositing Treasury assets. The first TicketSale then consumes and continues that state.

This may be simpler to reason about and independently audit, but it adds a separate pre-Issue transaction and a governed initializer. It must not be confused with the existing user-facing PRE/ADA deposit page. It also needs a one-time marker policy and a canonical datum/config commitment.

### 4.3 Issue policy and state-validator binding

Whichever bootstrap route is chosen, the on-chain Ticket mint policy must verify the state-carrier condition in the same transaction as the ticket sale:
- first Issue: exactly one authorized bootstrap marker mint and exactly one canonical state output;
- later Issue: exactly one canonical state input, exactly one continuation output, same singleton marker, exact sequence increment and valid receipt delta;
- reject missing, duplicate, altered, stale, unrecognized or conflicting state;
- bind the receipt record to the exact Treasury output reference and complete Value;
- preserve the current Ticket mint, PrizeDatum, Counter and B1 checks.

The current `atomicTreasuryPaymentValid` is insufficient because it authenticates only the existence/value of one Treasury payment output. It must not be assumed to authenticate the datum or the separate state carrier.

The carrier's own validator must also enforce its singleton continuation and state-transition rules. A reference input alone is not a concurrency lock: a spend/continue state transition is required if Issue transactions must serialize on the state itself. The existing Counter already serializes the exact Counter UTxO consumed by each Issue, but uniqueness of the global Counter state must be separately established.

### 4.4 Publicly seeded unrecognized outputs

A public script address can receive outputs with arbitrary datums. Therefore the new state selection logic must select by an authenticated singleton marker/configuration—not by “all UTxOs at this address have the same datum”.

Unrecognized or unmarked outputs must never:
- become the canonical state;
- be copied into the next TicketSale;
- enter a spendable category balance;
- be silently combined with authenticated Treasury custody in a way that creates a false balance.

Their classification, recovery and potential denial-of-service treatment need a specific policy. A malicious deposit must not be able to change the canonical state merely by arriving first or by creating a conflicting datum. The inventory/verifier must still report such outputs as unclassified custody rather than pretending they do not exist.

## 5. Receipt recognition is not category allocation

The first TicketSale may prove a factual receipt: exact ticket mint + exact ticket price + exact Treasury output + unique receipt out-ref. It must not automatically create a Prize-category credit merely because the ticket is sold, nor may a Treasury datum invent category balances.

Until an adopted PRE-RICH posting rule is present, the initial carrier may record the receipt as **unclassified/pending classification**. This is an evidence/clearing state, not a spendable balance or additional EEV asset. The exact representation must be bounded and size-tested; an ever-growing unbounded receipt list is not acceptable.

The existing operational specification remains controlling for this boundary:
- Ticket Issue records the receipt and B1 unresolved-ticket reservation;
- B1's unresolved-ticket reserve is not Treasury Reserve, not WCE and not a category balance;
- Treasury → PrizePool requires an authorized Prize-category debit and matching physical Pool credit;
- Reserve, Maintenance, Reward and PRE-holder staking remain separate until their own sources, budgets and spending authorities are approved.

No opening balance, category percentage, batch threshold, reward amount or new spending rule is selected here.

## 6. Minimum adversarial conformance matrix

Before any implementation is considered, the test design should include at least:

1. **No prior Treasury UTxO:** a first Issue can initialize the authorized state and create the exact receipt without a manual deposit.
2. **Unauthorized datum:** arbitrary legacy/new datum at the receipt address cannot be selected, copied or treated as canonical.
3. **Conflicting/unrecognized outputs:** an attacker-created extra output cannot poison the state or cause the canonical selector to accept an arbitrary first datum; the defined unclassified-custody policy is exercised.
4. **One-time initialization:** a second marker mint/genesis attempt fails, including concurrent/replayed attempts.
5. **Canonical continuation:** later Issue consumes exactly one state singleton and recreates exactly one continuation with sequence +1 and the receipt event bound to the same transaction.
6. **Stale/duplicate state:** missing, duplicate, stale, wrong-network, wrong-deployment or wrong-config marker and carrier fail closed.
7. **Full Value:** every future Treasury spending transition conserves the complete input Value and exact authorized recipient set; no lovelace-only acceptance or unaccounted native-asset remainder.
8. **Receipt exactness:** the Treasury payment output is exactly one output at the canonical address and its full asset map equals the independent settlement derivation.
9. **Counter interaction:** one Issue consumes one exact Counter out-ref and produces one valid successor; a duplicate or alternate-address Counter cannot be mistaken for the canonical serialization anchor.
10. **Legacy isolation:** old `Distribute` inputs cannot be treated as V2 state or be migrated implicitly. Historical and current script identities are kept distinct.
11. **Transaction constraints:** full signed transaction size, script execution units, min-ADA for both carrier and receipt outputs, and all reference/script inputs are measured on the intended Preprod target. The existing 16,384-byte transaction-size ceiling remains binding.
12. **Economic non-regression:** ticket price, B1 reservation, 500×, V3, Reveal, expiry and existing admission predicates are unchanged by the Treasury carrier.

## 7. Release and migration gates

1. Freeze the design of the state marker, config commitment, sequence and bootstrap path without choosing category percentages or a new posting rule.
2. Obtain independent review of the Plutus state transition and of the MintPolicy-to-carrier binding. Agent B owns `audit/cardano-integration/**`; no edits in that lane are made by this note.
3. Decide whether the Treasury-only datum/redeemer encoding can be preserved with a versioned, separately parameterized validator or whether a new Treasury-specific schema is necessary. This is a Treasury ABI/script-identity decision; it must not silently alter the B1, Prize, V3 or Reveal ABI.
4. Define an explicit posture for legacy `Distribute` and any historical script identity. Do not deploy a new Treasury while leaving a funded old input implicitly spendable or pretending that the old and new script hashes are interchangeable.
5. Implement only after the design and policy boundaries are authorized. Add Plutus validator tests, MintPolicy factory tests, TypeScript selector/builder tests and read-only Preprod provenance checks.
6. Rebind the new Treasury script hash/address and every dependent MintPolicy/DApp/config/deployment pin only after the new artefact is built, audited and tested.
7. Complete the separate Oracle, EEV live revalidation, ProtectedCapital, R1/Kc/Ω, Issue admission and deployment approvals. A Treasury fix does not close those gates.

## 8. Explicit non-decisions and non-regression

This note does **not**:
- revive `TREASURY_POLICY`, the legacy 75/10/10/5 split, the UI's 25% placeholders or any relayer threshold;
- designate ticket revenue as automatically spendable Prize capital;
- map Treasury Reserve to `ReserveProtection`, B1 `ppUnresolvedReserve` or WCE;
- authorize Treasury-to-PrizePool spending or category settlement;
- create a second Treasury, a separate PRE staking wallet or a new R7 delta;
- alter the current Oracle, USD/USDM conversion, EEV, protected-capital or admission decisions;
- alter V3, Reveal, B1 ticket economics, 500×, KA/KC/KD, ticket identity, expiry, or any existing validator ABI;
- authorize a wallet signature, funding deposit, transaction, deployment or migration.

**Final disposition:** the current bootstrap is blocked because it relies on a datum from an existing Treasury UTxO and the only current producer is unsafe. The recommended direction is a canonical, one-time initialized Treasury accounting-state carrier, separate from the one physical TicketSale receipt output, with the first state created atomically by a one-shot policy or by a separately authorized initializer. This is design-only. The first real PRE-RICH Issue remains **NO-GO** until the Treasury authority/state/spend path and all independent Issue gates are closed.
