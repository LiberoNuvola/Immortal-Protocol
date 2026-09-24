# PRE-RICH — Complete System Specification

**Role:** end-to-end integrative specification and reader guide  
**Scope:** PRE-RICH application profile of IMMORTAL  
**Status:** INTEGRATIVE DOCUMENT — it does not create or override normative policy  
**Canonicality:** normative meaning remains defined by the cited source documents in the IMMORTAL → PRE-RICH hierarchy  
**Branch:** `main`

> This document exists to answer one practical question: **“How does PRE-RICH work, from system state and ticket purchase through randomness, result, settlement, expiry, Genesis, Jackpot and Cardano execution?”**
>
> It integrates the current repository documentation. Where implementation or conformance is still open, this document says so explicitly rather than treating design intent as proven behavior.

---

## 1. What PRE-RICH is

PRE-RICH is a concrete application profile of IMMORTAL, instantiated as a Scratch & Win game.

PRE-RICH defines application-specific choices such as:

- denomination and ticket-price ladder;
- ticket lifecycle;
- Classic-6 result model;
- application class ladder;
- Jackpot policy;
- Genesis application regime;
- application settlement policy;
- Beacon trust model.

IMMORTAL remains the universal normative economic layer. Cardano is the current execution environment through the Cardano Adapter.

The architectural boundary is:

```
IMMORTAL universal economic rules
          ↓
PRE-RICH application specialization
          ↓
IMMORTAL Cardano Adapter
          ↓
Cardano ledger
```

PRE-RICH policy must not be promoted into universal IMMORTAL semantics merely because it is implemented on Cardano.

**Primary sources:**  
- `PRE-RICH/docs/PRE-RICH-APPLICATION-PAPER.md`
- `PRE-RICH/docs/CONSTITUTION.md`
- `PRE-RICH/docs/APPLICATION-SPECIFICATION.md`

---

## 2. System at a glance

At the application level, the system can be understood as four coupled state machines.

### 2.1 Ticket lifecycle

```
purchase / commit
      ↓
   committed
      ↓
    reveal
      ↓
 deterministic result
   ↙          ↘
loss          win
  ↓             ↓
history     crystallization
  ↓             ↓
expiry       immutable payout
                ↓
              claim
                ↓
            settlement
```

A claim settles an already-established right.

```
CLAIM ≠ BURN
```

A ticket is transferable; transfer preserves the ticket's identity and economic right.

### 2.2 Economic capacity

```
sale
 ↓
Treasury funding
 +
unresolved-ticket reserve
 ↓
Economic Gate
 ↓
class availability
 ↓
protected obligations
 ↓
RawSurplus
 ↓
possible Jackpot funding
```

Every sale must preserve the post-state economic invariants.

### 2.3 Application regime

```
PRE_GENESIS
    ↓
 GENESIS
    ↓
  ACTIVE
    ↓
QUIESCENT / HALT
```

The PRE-GENESIS → GENESIS transition is permissionless in design and must be independently revalidated on-chain.

### 2.4 Result authority

```
ticket context + commitment/secret
            +
active result/evidence mechanism
            ↓
      deterministic result
            ↓
       derived payout
```

The player does not supply authoritative symbols, tier, payout or winner status.

---

## 3. Frozen application baseline

The current application baseline is:

```
KA = 8
KC = 4
KD = 4

Ticket ladder:
1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM

Genesis = 1 USDM

Verified PRE Treasury bootstrap >= 4000 USDM

MaximumNormalPayout(P) = 500 × P

WorstCaseExposure(P,N) = 500 × P × N

RawSurplus = max(0, EEV − ProtectedCapital)
```

These are application-level frozen semantics, not new IMMORTAL-wide constants.

The former `75 / 10 / 10 / 5` allocation is historical and non-canonical.

**Source:** `PRE-RICH/docs/GAME-ECONOMY.md`, `PRE-RICH/docs/CONSTITUTION.md`

---

## 4. Economic accounting

PRE-RICH uses liability-first accounting.

For accounting asset `A`:

```
EffectivePool(A) =
    TotalLiquidity(A)
  - PendingWinningLiabilities(A)
  - UnresolvedTicketReserve(A)
  - LockedJackpotLiquidity(A)
```

The corresponding safety condition is:

```
PendingWinningLiabilities
+ UnresolvedTicketReserve
+ LockedJackpotLiquidity
<= TotalLiquidity
```

Protected obligations take precedence over discretionary surplus.

### 4.1 Protected capital and RawSurplus

```
RawSurplus = max(0, EEV − ProtectedCapital)
```

RawSurplus is the admissible residual after protected obligations and capital requirements are accounted for. It is not an alternative name for Treasury balance.

### 4.2 Genesis non-double-counting

The Genesis bootstrap condition is evidence that the application may cross the Genesis boundary.

It does **not** automatically convert Treasury bootstrap value into PrizePool liquidity.

The accounting distinction remains:

```
Treasury bootstrap evidence
        ≠
PrizePool liquidity
```

The same economic value must not be counted twice merely because Genesis becomes active.

**Sources:**  
- `PRE-RICH/docs/GAME-ECONOMY.md`
- `PRE-RICH/docs/GENESIS-REGIME-CARRIER-DESIGN-v0.1.md`
- `PRE-RICH/docs/PRE-GENESIS-GENESIS-TRANSITION-CONFORMANCE.md`

---

## 5. Ticket classes

The application supports:

```
1 / 2 / 3 / 5 / 10 / 25 / 50 / 100 USDM
```

The application tracks:

- `CurrentActiveClass`
- `HighestClassEverActivated`

`CurrentActiveClass` may contract.

`HighestClassEverActivated` is monotonic.

The contraction sequence is:

```
100 → 50 → 25 → 10 → 5 → 3 → 2 → 1 → HALT
```

Suspension affects new sales. It does not invalidate existing tickets or crystallized liabilities.

For class price `P` and unresolved ticket count `N`:

```
WorstCaseExposure(P,N) = 500 × P × N
```

Because ticket classes have different prices, class-aware exposure or an equivalent deterministic mechanism is required.

---

## 6. The Classic-6 game

The current PRE-RICH game is **Classic-6 with two independent rows**.

Each row samples uniformly from a 20,000-slot domain:

```
0..17499       loss      87.5%
17500..19199   tier 1     8.5%
19200..19799   tier 2     3.0%
19800..19979   tier 3     0.9%
19980..19998   tier 4     0.095%
19999          tier 5     0.005%
```

A 16-bit draw is accepted only when it is below `60000`, then reduced modulo `20000`.

Because:

```
60000 = 3 × 20000
```

the reduction is uniform.

The two rows are independently evaluated and use domain-separated inputs.

### 6.1 Row payouts

| Tier | Base multiplier | Effective payout |
|---|---:|---:|
| 1 | 2 | 1 × P |
| 2 | 5 | 2.5 × P |
| 3 | 10 | 5 × P |
| 4 | 200 | 100 × P |
| 5 | 1000 | 500 × P |

The ticket-level payout is the sum of the two row payouts, capped at:

```
500 × P
```

Therefore the row-tier table must not be mistaken for the complete ticket-level outcome distribution.

### 6.2 Exact ticket-level distribution

The current canonical two-row distribution is:

| Ticket payout | Exact pair count / 400,000,000 | Probability |
|---:|---:|---:|
| 0 × P | 306,250,000 | 76.5625% |
| 1 × P | 59,500,000 | 14.8750% |
| 2 × P | 2,890,000 | 0.7225% |
| 2.5 × P | 21,000,000 | 5.2500% |
| 3.5 × P | 2,040,000 | 0.5100% |
| 5 × P | 6,660,000 | 1.6650% |
| 6 × P | 612,000 | 0.1530% |
| 7.5 × P | 216,000 | 0.0540% |
| 10 × P | 32,400 | 0.0081% |
| 100 × P | 665,000 | 0.16625% |
| 101 × P | 64,600 | 0.01615% |
| 102.5 × P | 22,800 | 0.00570% |
| 105 × P | 6,840 | 0.00171% |
| 200 × P | 361 | 0.00009025% |
| 500 × P | 39,999 | 0.00999975% |

Exact first two moments:

```
E[payout] = 0.64996875 × P
σ ≈ 6.689612535 × P
```

Historical single-result distributions must not be presented as the current Classic-6 ticket-level distribution.

**Source:** `PRE-RICH/docs/GAME-ECONOMY.md`

---

## 7. Unresolved-ticket reserve

Every unrevealed ticket consumes economic capacity.

The reference statistical reserve model is:

```
UnresolvedReserve(N) = N × μ + Z × σ × sqrt(N)
```

For the current canonical ticket-level distribution, normalized to a 1-USDM ticket:

```
μ = 0.64996875 USDM
σ ≈ 6.689612535 USDM
Z = deployment/model parameter
```

This is a statistical risk model.

It does **not** replace deterministic worst-case protection.

Deterministic exposure remains:

```
WorstCaseExposure(P,N) = 500 × P × N
```

---

## 8. Buying a ticket: the Sale transition

A valid sale couples three economic effects:

```
Ticket mint
    +
Treasury payment
    +
unresolved-ticket reservation
```

The intended sequence is:

```
validate ticket class
→ validate exact application price
→ validate payment/conversion
→ read current economic state
→ compute post-sale unresolved exposure
→ compute protected obligations
→ evaluate deterministic exposure
→ evaluate statistical reserve
→ evaluate safety floor
→ evaluate locked Jackpot protection
→ evaluate CurrentActiveClass
→ mint ticket + record payment + reserve exposure atomically
```

The sale must preserve the post-state invariants.

Off-chain bookkeeping alone is insufficient when the rule requires economic enforcement.

**Source:** `PRE-RICH/docs/ECONOMIC-ALGORITHM.md`, `PRE-RICH/docs/GAME-ECONOMY.md`

---

## 9. Commit

Commit binds the ticket/game context and secret before the result can be known.

The commit step exists to establish the required cryptographic relationship before reveal.

The exact production cryptographic binding must be read together with the current result/Beacon implementation and its conformance evidence.

Commit does not itself create a payout.

---

## 10. Beacon and randomness

### 10.1 B1

B1 is the current PRE-RICH authorized-publisher Beacon trust model.

The application expects an active, valid Beacon/evidence mechanism before authoritative result derivation.

### 10.2 B3

B3 is the stronger publisher-independent target.

The repository currently has source-level work and conformance investigation around:

- deterministic mapping to the 20,000 outcome domain;
- unbiased rejection construction;
- publisher-independent canonical randomness;
- domain separation;
- validation of missing/malformed/inconsistent Beacon evidence.

However, B3 publisher-independent canonicality must not be treated as proven merely because the selector/mapping logic exists.

### 10.3 Authority boundary

A result must be derived from verified context/evidence, not from a player-selected result.

The player cannot authoritatively supply:

- symbols;
- tier;
- payout;
- winner status.

**Source:**  
- `PRE-RICH/docs/APPLICATION-SPECIFICATION.md`
- `PRE-RICH/docs/B3-BEACON-CONFORMANCE-INVESTIGATION.md`
- current `poc/materios-grandpa` / Beacon evidence boundary documentation

---

## 11. Reveal

The economic flow is:

```
validate expiry boundary
→ validate commitment
→ validate active Beacon/evidence
→ derive deterministic result
→ determine tier / Jackpot result
→ verify economic capacity
→ release unresolved exposure exactly once
→ create crystallized liability if winning
→ freeze result and payout
```

The player's supplied data is not allowed to become the economic authority for the result.

### 11.1 Loss

For a non-winning result:

- no winning liability is crystallized;
- unresolved-ticket exposure is released exactly once according to the canonical transition;
- the historical ticket/result may remain subject to retention rules.

### 11.2 Win

For a winning result:

- the result is established;
- the payout is crystallized;
- the crystallized payout becomes immutable;
- later state changes cannot recompute or reduce it.

---

## 12. Crystallization

Crystallization is the point at which a winning payout becomes an immutable economic obligation.

After crystallization:

```
payout is frozen
```

The payout is not recalculated because of later:

- Treasury movements;
- PRE valuation changes;
- class suspension;
- governance changes;
- later liquidity changes;
- later Jackpot changes.

This is a critical boundary between result determination and later settlement.

---

## 13. Claim

Claim is a single-use settlement transition.

Conceptually:

```
verify ticket and ownership where required
→ verify revealed state
→ use frozen payout
→ settle exact economic value
→ reduce liability exactly once
→ prevent second claim
```

Claim does not require NFT destruction.

```
CLAIM ≠ BURN
```

A claimed ticket may remain as a historical collectible.

---

## 14. Expiry

Expiry is final.

After expiry:

```
newClaimability = false
newLiability = false
lateRevealEconomicEffect = none
```

The expired payment commitment dissolves.

The canonical semantic effects are:

- no claim after expiry;
- no new liability after expiry;
- unresolved reserve released exactly once where applicable;
- expired unclaimed winning right released exactly once;
- late historical reveal may preserve historical information;
- late reveal cannot create claimability;
- no resurrection of an expired right.

The exact numeric lifetime is not a universal IMMORTAL constant. PRE-RICH/deployment must declare a deterministic profile policy and crystallize `expiresAt` at issuance.

The mechanism is therefore closed while the concrete deployment value remains a profile/application parameter.

**Source:** `PRE-RICH/docs/GAME-ECONOMY.md`, `PRE-RICH/docs/APPLICATION-SPECIFICATION.md`

---

## 15. Transferability and ticket identity

Tickets are transferable.

A transfer preserves:

- ticket identity;
- commitment;
- round;
- game configuration;
- future result;
- economic right.

Transfer cannot duplicate the right.

A revealed winning ticket may remain transferable where permitted; its crystallized payout remains attached to the ticket.

Voluntary burn provides:

- no refund;
- no bonus;
- no additional economic right.

---

## 16. Settlement and payout units

PRE-RICH prizes are denominated in USDM.

The current Cardano-facing representation establishes:

```
1 USDM = 100 sub-units
```

Thus:

```
Genesis price = 100 sub-units

tier 1 = 100 sub-units = 1 USDM
tier 2 = 250 sub-units = 2.5 USDM
tier 3 = 500 sub-units = 5 USDM
tier 4 = 10,000 sub-units = 100 USDM
tier 5 = 50,000 sub-units = 500 USDM
```

Settlement in USDM, ADA or another supported asset is allowed only when validated conversion preserves the frozen USDM economic value.

The settlement boundary must address, where applicable:

- asset identity;
- price validity;
- freshness;
- decimal handling;
- deterministic rounding;
- minimum-UTxO treatment;
- stale/malformed data rejection.

A crystallized prize cannot be reduced merely by changing settlement asset.

**Source:** `PRE-RICH/docs/PAYOUT-UNIT-CONFORMANCE.md`, `PRE-RICH/docs/GAME-ECONOMY.md`

---

## 17. Jackpot

The Jackpot is PRE-RICH application policy.

It is separate from the normal Classic-6 row distribution and must not modify that distribution.

### 17.1 Protection

```
NewJackpot <= RawSurplus
JackpotPayout <= LockedJackpotLiquidity
```

Once funded and locked, Jackpot liquidity cannot be reduced or dissolved before the winning transition.

### 17.2 Activation

The current policy is state-derived rather than based on an independent scalar maturity ladder.

Conceptually:

```
StableLadder(S) :=
  CurrentActiveClass(S)
    = HighestClassEverActivated(S)
    = 100
  AND ActivationPredicate(100,S)
  AND NOT SuspensionPredicate(100,S)
```

Funding eligibility is:

```
StableLadder(S)
AND FundingNeed(S) > 0
AND Gate(S, JACKPOT_FUND) = ACCEPT
```

with:

```
J_floor(S) = 500 × max(ΣP_normal, ΣP_saleable(S))
FundingNeed(S) = max(0, J_floor(S) − J_locked(S))
NewJackpot = FundingNeed(S)
```

The resulting state must remain economically admissible and the new Jackpot amount must fit inside RawSurplus.

### 17.3 Payout

The current application policy states:

**full current locked-balance payout exactly once**

After payout, the paid amount enters the normal crystallized/pending liability path and the Jackpot bucket is reduced exactly once.

There is no fixed canonical Jackpot allocation percentage.

Historical scalar maturity ladders and fixed allocation splits are non-canonical.

**Source:** `PRE-RICH/docs/GAME-ECONOMY.md`

---

## 18. Treasury and PrizePool

Player payments enter protocol-controlled Treasury.

There is no automatic personal entitlement for founder, team, developer, administrator or operator.

Treasury → PrizePool funding is a separate protocol-controlled transition.

It must preserve:

- crystallized liabilities;
- unresolved reserve;
- deterministic exposure;
- locked Jackpot;
- safety capital;
- all other mandatory invariants.

Genesis activation must not silently perform:

```
Treasury bootstrap → PrizePool liquidity
```

The Treasury and PrizePool therefore have distinct accounting meaning even when the application routes value between them through explicit protocol transitions.

---

## 19. PRE-GENESIS → GENESIS

Genesis is entered when the verified PRE Treasury economic value satisfies:

```
>= 4000 USDM
```

with Genesis itself defined at:

```
1 USDM
```

The operational flow is:

```
Canonical PRE-GENESIS state
        ↓
verified Genesis predicate
        ↓
observable eligible state
        ↓
permissionless candidate transaction
        ↓
independent on-chain revalidation
        ↓
atomic PRE-GENESIS → GENESIS
        ↓
canonical Genesis state
```

The submitter does not decide whether the predicate is true.

A safe state with nobody submitting the transition is:

```
PRE-GENESIS canonical safe state → SAFE STALL
```

The state must remain discoverable and retryable.

### 19.1 Required on-chain checks

A conformant carrier must independently bind:

- source regime;
- unique carrier state consumption;
- continuing carrier output;
- deterministic version/nonce progression;
- canonical Treasury identity;
- canonical PRE asset identity;
- authenticated Treasury observation;
- fresh/valid Oracle evidence;
- verified Treasury value;
- frozen Genesis threshold;
- no implicit PrizePool increase;
- no bootstrap double counting;
- concurrency rejection;
- exact GENESIS destination state.

The existing `genesisPredicate` is an admission predicate over an observation; it is not by itself sufficient to authenticate which ledger Treasury/Oracle inputs supplied those values.

The safe shape is:

```
actual Treasury / Oracle reference inputs
        ↓
authenticated on-chain observation
        ↓
GenesisTreasuryObservation
        ↓
existing genesisPredicate
        ↓
ActivateGenesis
```

**Source:**  
- `PRE-RICH/docs/GENESIS-REGIME-CARRIER-DESIGN-v0.1.md`
- `PRE-RICH/docs/PRE-GENESIS-GENESIS-TRANSITION-CONFORMANCE.md`

---

## 20. Governance boundary

PRE-RICH governance may control project and application matters within the authority inherited from IMMORTAL.

Governance cannot:

- override IMMORTAL invariants;
- assign individual winners;
- assign Jackpot recipients discretionarily;
- alter crystallized payouts;
- bypass solvency for selected transactions;
- create privileged personal Treasury entitlement.

Operational workers, relayers and recovery mechanisms are liveness functions.

They cannot become economic authorities.

---

## 21. Cardano architecture

PRE-RICH does not directly redefine Cardano semantics.

The execution boundary is:

```
PRE-RICH economic/application intent
          ↓
IMMORTAL Adapter boundary
          ↓
Cardano transaction
          ↓
Cardano ledger validation
```

Cardano-specific concerns include:

- UTxO state;
- validators;
- native assets;
- validity intervals;
- transaction construction;
- ledger-native execution;
- Cardano observation/evidence.

The current P2.8 work is intended to make the ledger execution evidence genuinely Ledger-native rather than synthetic.

The required typed evidence path is:

```
exact transaction CBOR
+
exact consumed UTxOs
+
exact protocol parameters
+
EpochInfo
+
SystemStart
        ↓
typed Cardano Ledger context
        ↓
evalTxExUnitsWithLogs
        ↓
per-redeemer exunits / logs / failures
        ↓
persisted report
```

Missing or ambiguous typed context must remain fail-closed.

This operational evidence is implementation/conformance evidence; it does not change PRE-RICH policy.

---

## 22. What is authoritative and what is derived

### 22.1 Authority-bearing categories

Examples include:

- canonical economic state;
- validated ticket/game context;
- validated commitment;
- accepted Beacon/evidence;
- authenticated Treasury/Oracle observations;
- frozen crystallized payout;
- ledger state transitions.

### 22.2 Derived categories

Examples include:

- symbols displayed in a lifecycle payload;
- prize tier derived from validated result data;
- payout amount derived from the canonical tier and ticket price;
- winner status;
- rendered user-facing result information.

The presence of a derived value in a serialized payload does not make it authoritative.

---

## 23. Safety and liveness separation

PRE-RICH explicitly separates economic safety from operational liveness.

### Safety

Safety determines what is economically and cryptographically allowed:

- solvency;
- reserve protection;
- payout limits;
- immutable crystallization;
- expiry finality;
- Jackpot protection;
- governance boundaries;
- authenticated evidence.

### Liveness

Liveness concerns how an already-permitted transition gets executed:

- observation;
- discovery;
- wake-up;
- permissionless invocation;
- transaction relaying;
- operational recovery.

A relayer may help a transition happen.

It must not be able to change what the transition means.

The common execution shape is:

```
Condition
→ Observation / Discovery
→ Wake-up
→ Permissionless Invocation
→ On-chain Revalidation
→ Atomic Transition
→ Canonical State
```

---

## 24. Complete lifecycle example

Consider a ticket priced at `P`.

### Step 1 — Sale

The application verifies:

- the class is saleable;
- the exact price;
- the payment;
- the economic state.

The transaction couples:

```
ticket mint
+
payment
+
unresolved reserve
```

### Step 2 — Commit

The ticket's result-driving context is bound before the result can be known.

### Step 3 — Reveal

The application verifies:

- the expiry boundary;
- the commitment;
- Beacon/result evidence;
- economic capacity.

It derives the deterministic outcome.

### Step 4 — Result

If losing:

```
no winning liability
→ release unresolved exposure exactly once
```

If winning:

```
derive tier
→ derive payout
→ crystallize
→ freeze payout
```

### Step 5 — Claim

The holder submits a single-use settlement against the frozen payout.

### Step 6 — Expiry

If the ticket reaches expiry without a valid claim/right:

```
claimability ends
liability cannot be created
reserve/right dissolves exactly once
```

A late reveal cannot revive the expired right.

---

## 25. What “conformant” means

A rule being specified is not the same as that rule being implemented and not the same as that implementation having ledger evidence.

Therefore PRE-RICH uses three distinct notions:

```
CANONICAL SEMANTICS
        ≠
IMPLEMENTATION
        ≠
CONFORMANCE EVIDENCE
```

For example:

- the Classic-6 semantics can be closed while ledger parity remains open;
- the Genesis predicate can be implemented while the authenticated ledger observation layer remains open;
- B3 mapping can exist while publisher-independent canonicality remains unproven.

No implementation gap reopens an already-closed application policy unless an explicit new policy decision changes the semantics.

---

## 26. Current open edges

The following must continue to be treated according to their current evidence state rather than assumed complete:

### Beacon / B3

Publisher-independent canonicality and complete production-grade finality/provenance remain evidence-dependent.

### Genesis carrier

The final Cardano carrier, authenticated observation binding, real-ledger transition trace and concurrency/accounting evidence remain implementation/conformance work.

### Cardano Ledger runner

The P2.8 typed Ledger-native execution path is being completed. A green dependency build is not by itself proof of evaluator conformance; the required typed context and real evaluator report are the closure target.

### Settlement

Cross-layer evidence must demonstrate that the frozen USDM economic value survives actual settlement without silent rounding/truncation.

### Oracle source selection

Where the application requires a deployment-specific canonical PRE→USDM source/provider, that source remains subject to its own evidence gate.

---

## 27. What this document deliberately does not do

This document does **not**:

- introduce a new economic parameter;
- replace the PRE-RICH Constitution;
- replace Game Economy;
- replace the Economic Algorithm;
- replace Beacon conformance documentation;
- replace Genesis transition conformance;
- convert open evidence into a green claim;
- import historical `75/10/10/5` economics;
- redefine IMMORTAL universal semantics;
- redefine Cardano protocol semantics.

It is an integrative map over the existing canonical sources.

---

## 28. Source map

| Topic | Primary current source |
|---|---|
| PRE-RICH identity and boundary | `PRE-RICH-APPLICATION-PAPER.md` |
| Application constitution | `CONSTITUTION.md` |
| Application behavior | `APPLICATION-SPECIFICATION.md` |
| Economic transitions | `ECONOMIC-ALGORITHM.md` |
| Detailed game economics | `GAME-ECONOMY.md` |
| Conformance | `CONFORMANCE.md` |
| Beacon / B3 | `B3-BEACON-CONFORMANCE-INVESTIGATION.md` |
| Genesis carrier | `GENESIS-REGIME-CARRIER-DESIGN-v0.1.md` |
| PRE-GENESIS → GENESIS | `PRE-GENESIS-GENESIS-TRANSITION-CONFORMANCE.md` |
| Payout units | `PAYOUT-UNIT-CONFORMANCE.md` |

---

## 29. Reader path

A new contributor should read this document first and then follow the source map according to the subsystem being changed.

Recommended path:

```
1. PRE-RICH COMPLETE SYSTEM SPECIFICATION
                 ↓
2. APPLICATION SPECIFICATION
                 ↓
3. GAME ECONOMY
                 ↓
4. ECONOMIC ALGORITHM
                 ↓
5. relevant conformance document
                 ↓
6. implementation
                 ↓
7. evidence
```

For Cardano-specific implementation work, continue from the Adapter and Ledger evidence rather than treating TypeScript application code as the ledger authority.

---

## 30. Final boundary

The most important mental model for PRE-RICH is:

```
USER INTENT
   ↓
APPLICATION ACTION
   ↓
VALIDATED PRE-RICH STATE
   ↓
IMMORTAL ECONOMIC GATE / INVARIANTS
   ↓
VERIFIED RESULT / EVIDENCE
   ↓
IMMUTABLE ECONOMIC TRANSITION
   ↓
CARDANO ADAPTER
   ↓
CARDANO LEDGER
```

No actor in the operational stack is allowed to substitute private judgment for protocol truth.

The application can be extended and its policy can evolve within its authority, but the distinction between **application policy, universal economic invariants, derived data, execution mechanics and evidence** must remain explicit.

**This document is an integrative specification, not a new source of truth.**
