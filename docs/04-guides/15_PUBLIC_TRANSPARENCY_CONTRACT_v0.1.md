# Public Transparency Contract — Beacon, Activity, Evidence and User Actions

**Status:** normative frontend/public-surface guidance  
**Branch:** `work/immortal-green-closure`

## Principle

A user must be able to understand **what the protocol is doing, what trust assumption is currently active, what evidence supports that statement, what will happen before they sign, and what actually happened after execution**.

The frontend is a presentation surface. It must consume an authoritative protocol/round declaration and must never infer a stronger trust state from implementation availability.

## 1. Beacon trust mode is always explicit

For every active round the public surface MUST show exactly one observed trust mode:

- **B3 — VERIFIED** — publisher-independent canonical-state proof verified.
- **B2 — ATTESTED** — the declared committee-attestation certificate verified.
- **B1 — AUTHORIZED** — the declared authorized publisher path verified.

The interface MUST NOT display “secure”, “verified”, “canonical”, or equivalent language when the authoritative declaration only supports a lower mode.

If no mode is currently available, the public surface MUST say:

**HALTED — no verified Beacon trust mode available for this round.**

It MUST NOT substitute an unverified API response.

## 2. Fallback is visible, not silent

The trust ladder is:

`B3 VERIFIED → B2 ATTESTED → B1 AUTHORIZED → HALT`

Fallback applies only to a **new round** before commitments.

The user-facing declaration SHOULD expose:

- current mode;
- whether a stronger mode is unavailable;
- reason/status supplied by the authoritative declaration;
- round identifier;
- Beacon value or commitment identifier;
- evidence reference;
- evidence observation/verification time;
- evidence age/freshness where available.

A committed round MUST retain the mode and Beacon selected at commitment time. A later B3 outage MUST NOT make an already-committed B3 round appear as B2 or B1.

## 3. The protocol declares what it is doing

The public surface MUST expose the current protocol activity from the authoritative declaration.

Examples of activities include:

- creating or selling a ticket;
- accepting a ticket commitment;
- revealing a ticket;
- activating a class;
- resolving a round;
- paying a prize;
- expiring a ticket;
- settling or closing an economic state.

The wording must describe the protocol action, not merely the user's button click.

If an action changes an economic state, the public surface SHOULD disclose the declared economic effect before wallet signature.

## 4. Before a user signs

A transaction/action confirmation MUST make clear:

1. **Protocol:** IMMORTAL / PRE-RICH and the relevant deployment.
2. **Network:** e.g. Cardano Preprod.
3. **Action:** the protocol operation being authorized.
4. **Round/class/asset:** the exact subject where applicable.
5. **Economic effect:** assets/tokens/fees involved, as declared by the protocol.
6. **Beacon mode:** B3/B2/B1 and its evidence reference.
7. **Wallet step:** explicitly state that the user's connected wallet will sign.
8. **No private-key transfer:** the UI MUST NOT ask the user to paste a wallet private key or mnemonic into the website.

The primary action should make the signing boundary explicit, e.g.:

**Reveal Ticket → Awaiting wallet signature**

## 5. After execution

After submission the public surface SHOULD expose, where available:

- transaction hash;
- network;
- submission time;
- confirmation state;
- protocol action;
- round/class/asset;
- Beacon mode and evidence reference used for the round;
- relevant datum/validator/economic transition evidence;
- links to independently inspect the transaction on the applicable explorer.

The UI MUST distinguish:

- **Prepared** — transaction constructed, not signed.
- **Awaiting signature** — wallet has not yet completed the signing step.
- **Signed** — wallet produced a signature, but submission/confirmation may still be pending.
- **Submitted** — transaction hash exists.
- **Confirmed** — the network confirmed the transaction.
- **Failed** — execution/submission failed, with the authoritative error where safe to disclose.

A client-side success animation MUST NOT be treated as protocol confirmation.

## 6. Evidence is inspectable

Every public claim about protocol state SHOULD have an evidence reference or an explicit declaration that evidence is unavailable.

Evidence references should be stable identifiers, not opaque claims such as “verified by the system”.

Where possible, the UI should let the user inspect:

`claim → evidence reference → canonical state/reference → on-chain or external proof`

The frontend must not manufacture evidence references.

## 7. Trust limitations are visible

If B3 is not deployed or its external provenance proof is still open, the public surface must not present B3 as active merely because B3 code exists.

Likewise, an architectural B2 definition must not be presented as a live B2 attestation.

The displayed state is therefore an **observed operational declaration**, not a statement about what the codebase theoretically supports.

## 8. Fail closed

The public surface must prefer an explicit unavailable/ halted state over a stronger-looking but unsupported statement.

In particular:

- missing evidence → no trust-mode claim;
- stale/unbound evidence → no trust-mode claim;
- round mismatch → no trust-mode claim;
- frozen-mode mismatch → reject the state transition;
- unavailable B3/B2/B1 → HALT.

## 9. Frontend authority boundary

The frontend may:

- present authoritative declarations;
- show evidence and links;
- request wallet signatures;
- show transaction lifecycle;
- explain the active trust assumption.

The frontend may NOT:

- choose B3/B2/B1 independently;
- downgrade or upgrade a committed round;
- derive economic health;
- turn an API response into canonical evidence;
- accept a private key or mnemonic as a signing mechanism.

## 10. Minimum public round card

Every active round should be representable by a compact public card containing:

`Round`  
`Activity`  
`Beacon`  
`Trust mode`  
`Evidence`  
`Observed/verified at`  
`Freshness`  
`Network`  
`Current status`

For a user action, add:

`What will happen`  
`Economic effect`  
`Wallet signature required`

For a completed action, add:

`Transaction hash`  
`Confirmation state`  
`Evidence / explorer`

## Acceptance criterion

A user who has never read the repository documentation must be able to answer, from the public interface alone:

1. What is IMMORTAL/PRE-RICH doing now?
2. Which Beacon trust mode is actually active?
3. Why is that mode active?
4. What evidence supports it?
5. Is the evidence fresh and bound to this round?
6. What will my wallet sign?
7. What economic effect will this action have?
8. Has the transaction merely been prepared/signed/submitted, or is it actually confirmed?
9. What can I independently inspect?

If the interface cannot answer these questions from authoritative data, the corresponding claim must be marked unavailable rather than inferred.
