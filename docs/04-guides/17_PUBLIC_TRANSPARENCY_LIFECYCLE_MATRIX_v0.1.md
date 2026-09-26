# Public Transparency Matrix — Lifecycle, Modes and User Actions

**Status:** normative public-surface matrix v0.1  
**Scope:** IMMORTAL / PRE-RICH public declaration boundary  
**Branch:** `work/immortal-green-closure`

## Purpose

This matrix closes the gap between the public transparency contract and the concrete protocol lifecycle.

It does **not** define new economics, validator rules, Beacon selection, or transition conditions. It defines what the public surface must expose **when the authoritative layer declares a state**.

The authoritative pipeline remains:

`Economic / protocol state → observation / validation → public declaration → frontend`

If the authoritative layer does not provide a value, the public surface MUST display **UNKNOWN / NOT DECLARED** rather than infer it.

## Public lifecycle matrix

| Protocol event / state | What the user sees | User action | Availability semantics | Reason / prerequisite | Next transition | Evidence |
|---|---|---|---|---|---|---|
| Sale | **Selling tickets for Round N** | Buy Ticket | AVAILABLE / NOT YET OPEN / PAUSED / BLOCKED / CLOSED / HALTED | Authoritative sale/class/economic prerequisite | Only if declared by protocol | Sale/economic-state evidence |
| Commit | **Accepting commitments for Round N** | Commit Ticket | AVAILABLE / BLOCKED / CLOSED / HALTED | Authoritative commitment window + round state | Reveal when declared open | Commitment/round evidence |
| Reveal | **Awaiting reveals / Resolving Round N** | Reveal Ticket | AVAILABLE / NOT YET OPEN / BLOCKED / CLOSED / HALTED | Expiry, commitment, Beacon and round prerequisites | Resolution/crystallization when declared | Reveal + Beacon evidence |
| Claim | **Prize claim available for Round N** | Claim Prize | AVAILABLE / CLOSED / BLOCKED / HALTED | Crystallized claimable liability + claim state | Settlement/closure when declared | Claim/liability evidence |
| Expire | **Expiry processing / ticket expiry window** | Expire Ticket | AVAILABLE / NOT YET OPEN / CLOSED / BLOCKED / HALTED | Authoritative expiry condition | Final expiry / settlement | Expiry evidence |
| Class transition | **Activating / contracting Class N** | Activate / Deactivate Class | AVAILABLE / BLOCKED / HALTED | Authoritative hysteresis / transition declaration | Declared target class or HALT | Class transition evidence |
| Jackpot | **Jackpot state: [DECLARED STATE]** | Claim / Settle Jackpot where declared | AVAILABLE / BLOCKED / CLOSED / HALTED | Authoritative jackpot state and protected-liquidity conditions | Declared jackpot transition | Jackpot evidence |
| Recovery | **RECOVERY MODE — [ACTIVE / TRANSITIONING / BLOCKED]** | Recovery action | Only authoritative availability | Authoritative recovery declaration | Exit recovery only when declared | Recovery evidence |
| Surplus | **SURPLUS MODE — [ACTIVE / TRANSITIONING / BLOCKED]** | Surplus action / distribution | Only authoritative availability | Authoritative surplus declaration | Exit/distribution transition when declared | Surplus evidence |

### Important interpretation

The matrix intentionally does **not** say that a given event always means a specific economic mode.

For example:

- a ticket sale does not by itself prove **NORMAL_OPERATION**;
- a reveal does not by itself prove **ACTIVE_CLASS**;
- a positive balance does not prove **SURPLUS_MODE**;
- an unavailable ticket sale does not prove **RECOVERY_MODE**;
- a class number does not prove that the class is active.

Those values must come from the authoritative declaration.

## Class transition transparency

PRE-RICH hysteresis already defines the economic transition rules. The public layer must expose the resulting declared transition without reproducing the algorithm in the frontend.

The public surface should distinguish at least:

- **ACTIVATING CLASS N**
- **MAINTAINING CLASS N**
- **CONTRACTING TO CLASS N**
- **NO ACTIVE CLASS**
- **HALTED**

For each declared transition:

`current class → transition → target class → prerequisite/status → evidence`

The frontend MUST NOT calculate eligibility itself.

If the authoritative state does not expose a target transition, show:

> **Next transition: UNKNOWN / NOT DECLARED**

No ETA should be invented.

## Economic modes

The public mode vocabulary currently includes:

- `NORMAL_OPERATION`
- `ACTIVE_CLASS`
- `RECOVERY_MODE`
- `SURPLUS_MODE`
- `CAPITAL_PROTECTION`
- `REGENERATION`

These are public declarations, not frontend-derived labels.

For every active mode the declaration should provide:

1. mode;
2. status;
3. subject/scope;
4. authoritative reason;
5. permitted transitions;
6. action availability;
7. evidence reference;
8. observation time;
9. relevant economic quantities, **only when exposed by the authoritative layer**.

### Recovery

When declared active:

> **RECOVERY MODE — ACTIVE**  
> The protocol is executing the declared recovery path.  
>  
> Ordinary actions: **[authoritative availability]**  
> Recovery actions: **[authoritative availability]**  
> Reason: **[authoritative reason]**  
> Evidence: **[evidenceRef]**

Do not claim that recovery is active merely because ordinary actions are unavailable.

### Surplus

When declared active:

> **SURPLUS MODE — ACTIVE**  
> The protocol is operating under the declared surplus regime.  
>  
> Current action: **[declared activity]**  
> Protected state: **[declared value, if available]**  
> Distribution/action availability: **[declared availability]**  
> Evidence: **[evidenceRef]**

The public layer MUST NOT calculate surplus independently.

## Beacon context

For every action whose validity depends on the Beacon, the public declaration must expose:

- round binding;
- Beacon value/commitment identifier where public;
- observed trust mode;
- evidence reference;
- observation/verification time;
- freshness where available.

The operational trust ladder is:

`B3 VERIFIED → B2 ATTESTED → B1 AUTHORIZED → HALT`

Selection applies only to a new round before commitments. Once committed, the selected mode/value is frozen.

Therefore:

> A later Beacon fallback MUST NOT rewrite the public trust state of an already committed round.

The public surface must never display B2/B3 merely because the corresponding implementation exists. The displayed mode is the **observed authoritative declaration**.

## Action availability matrix

Every public action must be represented by an authoritative availability record.

| Action | Required public explanation |
|---|---|
| BUY_TICKET | current round/class, sale state, price/economic effect, Beacon context where applicable |
| COMMIT_TICKET | round, commitment state, prerequisites, wallet effect |
| REVEAL_TICKET | round, commitment, expiry, Beacon context, result/economic effect |
| ACTIVATE_CLASS | current/target class, declared prerequisite, economic transition |
| DEACTIVATE_CLASS | current class, declared transition reason, resulting state |
| CLAIM_PRIZE | claimable liability, round/ticket, payout/economic effect |
| SETTLE_ROUND | round, settlement state, resulting transition |
| EXPIRE_TICKET | ticket/round, expiry condition, resulting finality |
| ENTER_RECOVERY_MODE | declared prerequisite, transition effect, evidence |
| EXIT_RECOVERY_MODE | declared prerequisite, resulting mode, evidence |
| ENTER_SURPLUS_MODE | declared prerequisite, resulting mode, evidence |
| EXIT_SURPLUS_MODE | declared prerequisite, resulting mode, evidence |
| DISTRIBUTE_SURPLUS | declared surplus state, protected obligations, distribution effect |

An action marked unavailable MUST expose a state and explanation. A disabled button with no reason is non-conforming.

## Transaction lifecycle

Every executable action must distinguish:

`AVAILABLE → PREPARING → AWAITING SIGNATURE → SIGNED → SUBMITTED → CONFIRMED`

or:

`FAILED`

These are not interchangeable.

In particular:

- **Prepared** does not mean signed.
- **Signed** does not mean submitted.
- **Submitted** does not mean confirmed.
- A client-side success state does not establish protocol confirmation.

## Wallet boundary

Before signature, the public surface must show, where applicable:

- protocol/deployment;
- network;
- action;
- round/class/asset;
- declared economic effect;
- Beacon trust mode;
- evidence;
- explicit wallet-signing boundary.

The frontend MUST NOT request or handle a mnemonic or private key.

## Evidence chain

Every material public claim should resolve through:

`claim → evidenceRef → canonical state/reference → independently observable proof`

Where proof is not available:

> **Evidence: NOT AVAILABLE / NOT DECLARED**

The frontend must never manufacture an evidence reference.

## Fail-closed presentation rules

The public surface MUST prefer an explicit unknown/unavailable state over an inferred stronger state.

Never transform:

- NOT YET OPEN → AVAILABLE
- BLOCKED → AVAILABLE
- RECOVERY → NORMAL_OPERATION
- SURPLUS → NORMAL_OPERATION
- B1 → B2/B3
- B2 → B3
- PREPARED → CONFIRMED
- implementation availability → operational availability

## Acceptance checklist

A first-time user must be able to answer from the public interface:

1. What is the protocol doing?
2. Which class is active?
3. Which economic mode is active?
4. Which actions are available?
5. Which actions are unavailable?
6. Why?
7. What prerequisite changes the state?
8. Which Beacon trust mode is actually observed?
9. What evidence supports each important claim?
10. What will the wallet sign?
11. What economic effect is declared?
12. Is the transaction confirmed?

If any answer is not supported by authoritative data, display **UNKNOWN / NOT DECLARED**.

## Frontend integration boundary

The frontend agent should consume:

- `ProtocolDeclaration`
- `PublicProtocolState`
- `ActionAvailability`
- `ProtocolModeDeclaration`
- `ActiveClassDeclaration`
- transaction lifecycle declarations
- evidence references

The frontend agent should **not** reimplement:

- economic eligibility;
- hysteresis;
- Beacon selection;
- Beacon downgrade logic;
- surplus calculation;
- recovery detection;
- canonical-state inference.

This matrix is therefore an integration contract, not a second protocol implementation.

## Closure criterion

The transparency front is closed only when the public surface can render this matrix from authoritative declarations for the supported lifecycle states, and when missing evidence/state is visibly represented as **UNKNOWN / NOT DECLARED** rather than silently inferred.
