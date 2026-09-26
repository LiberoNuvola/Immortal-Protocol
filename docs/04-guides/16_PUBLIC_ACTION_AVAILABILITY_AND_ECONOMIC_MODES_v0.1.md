# Public Protocol Transparency — Action Availability and Economic Modes

**Status:** normative public-surface specification v0.1

## Principle

The public interface must describe the protocol's **actual current state and permitted actions before the user attempts an action**.

A user must never have to discover a protocol restriction by submitting a transaction that the protocol was already unable to accept.

This applies to the whole system, not only ticket purchase.

The public interface is therefore a **protocol status surface**, not merely a collection of transaction buttons.

## 1. Every action has an explicit public state

Every user-visible protocol action MUST have an authoritative availability declaration.

Minimum states:

- **AVAILABLE** — the action may currently be requested.
- **NOT YET OPEN** — the action belongs to a later protocol phase.
- **PAUSED** — temporarily unavailable while the protocol remains otherwise operational.
- **CLOSED** — the relevant window/round/class is permanently closed.
- **BLOCKED** — a specific prerequisite is currently unsatisfied.
- **HALTED** — the protocol has no valid execution path for this action.

The UI MUST NOT derive these states from failed transaction attempts.

## 2. Actions covered

The same model applies to, at minimum:

- Buy ticket
- Commit ticket
- Reveal ticket
- Activate class
- Deactivate class
- Claim prize
- Settle round
- Expire ticket
- Enter recovery mode
- Exit recovery mode
- Enter surplus mode
- Exit surplus mode
- Distribute surplus

The authoritative declaration may expose additional protocol actions.

## 3. A disabled action must explain itself

A disabled button alone is insufficient.

Example:

**Buy Ticket**  
NOT YET OPEN

> Ticket sales are not open for Round 185.  
> Current phase: **CLASS ACTIVATION**.  
> The protocol will accept tickets after the Sale transition.

For a temporary pause:

**Buy Ticket**  
PAUSED

> Ticket sales are temporarily paused.  
> Reason: no eligible Beacon trust mode is currently available.  
> Current trust state: **HALTED**.

For a prerequisite:

**Activate Class 4**  
BLOCKED

> Class activation requires the declared prerequisite to be satisfied.  
> Current prerequisite state: **PENDING**.

For a completed lifecycle:

**Claim Prize**  
CLOSED

> The claim window for this round has closed.

The wording must come from authoritative protocol state, not frontend inference.

## 4. Protocol phases are public

The public surface MUST expose the current phase/activity and its subject.

Examples:

- Preparing next round
- Activating Class 4
- Selling tickets for Round 185
- Accepting commitments
- Awaiting reveals
- Resolving Round 185
- Distributing a prize
- Protecting capital
- Entering recovery
- Recovering capital
- Entering surplus mode
- Distributing surplus
- Awaiting finality
- Regenerating

The user should be able to see both:

**WHAT THE PROTOCOL IS DOING**

and

**WHAT THE USER CAN DO RIGHT NOW**

These are different concepts and must not be conflated.

## 5. Economic modes are first-class public state

Modes such as:

- **Active Class**
- **Recovery Mode**
- **Surplus Mode**
- **Capital Protection**
- **Regeneration**
- other normative economic modes

MUST be declared explicitly when active or when they prevent an action.

For each mode, the public surface should show:

- mode name;
- current status;
- subject/scope;
- why the mode is active;
- what transitions are permitted;
- which user actions are available;
- which actions are unavailable and why;
- evidence reference;
- observation time;
- relevant economic quantities when the authoritative layer exposes them.

The frontend must never infer "Recovery Mode" or "Surplus Mode" from balances, colours, or failed transactions.

## 6. Active Class must be explicit

When a class is active, the interface should expose:

- class identifier;
- class state;
- activation status;
- activation evidence;
- round association;
- permitted actions;
- unavailable actions;
- relevant price/ticket parameters when authoritative;
- transition condition/status.

Example:

> **Class 4 — ACTIVE**  
> Round: 185  
> Ticket sales: **AVAILABLE**  
> Reveal: **NOT YET OPEN**  
> Activate Class 5: **BLOCKED**  
> Evidence: [reference]

If no class is active:

> **No active class**  
> Current activity: Class preparation  
> Ticket sales: **NOT YET OPEN**

No button should imply that a class is active when the authoritative declaration says otherwise.

## 7. Recovery Mode transparency

When Recovery Mode is active, the interface must say so plainly.

Example:

> **RECOVERY MODE — ACTIVE**  
> The protocol is currently prioritizing the declared recovery transition.  
>  
> Ticket purchase: **UNAVAILABLE**  
> Class activation: **UNAVAILABLE**  
> Recovery actions: **AVAILABLE**  
>  
> Reason: [authoritative reason]  
> Evidence: [evidence reference]

The public surface must not hide a recovery state merely because ordinary operations are temporarily unavailable.

## 8. Surplus Mode transparency

When Surplus Mode is active:

> **SURPLUS MODE — ACTIVE**

The interface should disclose, subject to the authoritative economic declaration:

- that the protocol is operating under the surplus regime;
- what action is currently occurring;
- what distributions/actions are permitted;
- what is protected;
- what remains unavailable;
- the evidence supporting the mode.

The UI must not label ordinary available capital as "surplus" by calculating it independently.

## 9. Mode transitions are also actions

Entering or leaving an economic mode is itself a protocol event.

The public interface should expose:

**Current mode → requested transition → prerequisite → resulting mode**

Example:

> Recovery Mode  
> **EXIT RECOVERY MODE — BLOCKED**  
> Prerequisite: [authoritative prerequisite]  
> Evidence: [evidence reference]

or:

> Class 3  
> **ACTIVATE CLASS 4 — AVAILABLE**  
> Prerequisite state: satisfied  
> Evidence: [evidence reference]

A mode transition must not be represented only as a hidden backend side effect.

## 10. Beacon and availability interact explicitly

Beacon trust is part of the public execution context.

For every action whose validity depends on the Beacon, expose:

- Beacon value/commitment;
- trust mode;
- evidence;
- freshness;
- round binding.

If no valid trust mode is available:

**HALTED — no eligible Beacon trust mode**

Actions dependent on the Beacon become unavailable.

The UI must not attempt the action and wait for the validator to reject it.

## 11. Wallet boundary

Before an available action reaches the wallet:

> **What the protocol will do**  
> **What the user will sign**  
> **Economic effect**  
> **Network**  
> **Round/class/asset**  
> **Beacon trust mode**  
> **Evidence**

The user must never be asked for a mnemonic or private key.

## 12. Lifecycle after action

The interface must distinguish:

AVAILABLE → PREPARING → AWAITING SIGNATURE → SIGNED → SUBMITTED → CONFIRMED

and:

FAILED

A local UI success state is never equivalent to protocol confirmation.

## 13. Evidence follows every public claim

For every important state or action declaration, the public surface should expose:

claim → evidenceRef → canonicalStateRef → observable proof

If evidence is unavailable, the claim must say so.

The frontend cannot manufacture evidence or upgrade evidence quality.

## 14. No silent state changes

The public interface must never silently transform:

- B3 into B2/B1;
- Active into Recovery;
- Recovery into normal operation;
- Surplus into ordinary capital;
- Not Yet Open into Available;
- Blocked into Available;
- Prepared into Confirmed.

Each transition must come from authoritative state.

## 15. User experience rule

The best public interface is not the one with the fewest disabled buttons.

It is the one where the user can understand **why an action is unavailable and what the protocol is doing instead**.

Therefore a disabled action should normally have:

1. a clear state label;
2. a concise explanation;
3. the current phase/mode;
4. the prerequisite or transition condition, when available;
5. evidence reference;
6. an expected next transition, when the protocol can truthfully provide one.

Do not invent an ETA.

## Acceptance test

A first-time user must be able to answer, without reading protocol documentation:

1. What is the protocol doing now?
2. Which class is active?
3. Which economic mode is active?
4. Which actions can I perform?
5. Which actions cannot I perform?
6. Why can I not perform them?
7. What condition changes that state?
8. Which Beacon trust mode is active?
9. What evidence supports the displayed state?
10. What will my wallet sign?
11. What economic effect will occur?
12. Has my transaction actually been confirmed?

If any answer cannot be established from authoritative state, the UI must display **UNKNOWN / NOT DECLARED** rather than inventing an answer.

## Architectural boundary

The authoritative pipeline is:

Economic/Protocol state → observation/validation → public declaration → frontend

The frontend is not an economic oracle.

It presents the protocol's declared state and gives the user a clear path to inspect the supporting evidence.
