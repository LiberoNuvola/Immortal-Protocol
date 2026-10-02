# IMMORTAL — Application Profile vs Chain Adapter Boundary

**Status:** non-normative architectural clarification  
**Branch:** `work/immortal-green-closure`

## Purpose

This note makes explicit a distinction that must remain stable across applications:

- an **application profile/economic model** specializes IMMORTAL for a concrete application;
- a **chain adapter** realizes chain-neutral IMMORTAL semantics on a concrete ledger.

These are different boundaries and must not be conflated.

## Canonical conceptual stack

```text
APPLICATION
  │
  │ application-specific economic policy
  ▼
APPLICATION ECONOMIC PROFILE
  │
  │ specializes IMMORTAL without redefining universal invariants
  ▼
IMMORTAL
  │
  │ chain-neutral economic semantics
  ▼
CHAIN ADAPTER
  │
  │ realization / observation / evidence
  ▼
CHAIN / LEDGER
```

For Cardano:

```text
PRE-RICH / ECHO / other application
              │
              ▼
       application profile
              │
              ▼
           IMMORTAL
              │
              ▼
       Cardano Adapter
              │
              ▼
           Cardano
```

## One adapter per chain boundary

The Cardano Adapter is **not duplicated per application**.

Its responsibility is to translate, realize, observe and report chain-neutral IMMORTAL semantics using Cardano mechanisms such as:

- UTxO state;
- Datum/Redeemer/Value;
- validators and minting policies;
- transaction construction;
- validity intervals;
- reference inputs;
- submission and observation;
- ledger execution evidence.

Therefore PRE-RICH and ECHO may use the same Cardano Adapter.

A different application does not imply a different Cardano Adapter.

A different chain may require a different Adapter.

```text
                 IMMORTAL
                    │
        ┌───────────┼───────────┐
        │           │           │
      Cardano       EVM       Cosmos
      Adapter      Adapter     Adapter
        │           │           │
     ┌──┴──┐      ┌─┴───┐      ...
     │     │      │     │
 PRE-RICH ECHO   Game A Game B
```

The application-to-IMMORTAL relationship and the IMMORTAL-to-chain relationship are therefore **orthogonal**.

## What belongs to an application

An application may define:

- its economic assets and resources;
- pricing policy;
- reward policy;
- game rules;
- application-specific state;
- application-specific obligations;
- application-specific lifecycle rules.

For PRE-RICH this includes, for example, tickets, prize classes, ticket ladder, 500× payout policy and Jackpot.

For ECHO it would include whatever economic rules ECHO actually defines for agents, resources, production, consumption, trading and related game mechanics.

Those concepts must not become universal IMMORTAL primitives merely because one application uses them.

## What belongs to IMMORTAL

IMMORTAL owns only the universal, chain-neutral economic semantics and invariants that are intentionally defined as protocol-level rules, including the generic treatment of:

- canonical economic state;
- obligations and unresolved exposure;
- ProtectedCapital;
- RawSurplus;
- admissible transitions;
- post-state safety/viability predicates;
- atomic economic transitions;
- finality and non-resurrection where made universal;
- deterministic evidence/conformance boundaries.

Application-specific parameters remain application policy unless explicitly promoted by a future normative decision.

## What belongs to the Cardano Adapter

The Cardano Adapter answers:

> How is an admissible IMMORTAL transition represented, executed, observed and evidenced on Cardano?

It does not answer:

> Is this application-specific economic policy desirable or universally required?

Nor does it become a second economic engine.

## PRE-RICH and ECHO

PRE-RICH is the first current application:

```text
PRE-RICH policy
      ↓
IMMORTAL
      ↓
Cardano Adapter
      ↓
Cardano
```

ECHO, if integrated later, would follow the same pattern:

```text
ECHO policy
      ↓
IMMORTAL
      ↓
same Cardano Adapter
      ↓
Cardano
```

No ECHO-specific economic primitive should be added to IMMORTAL merely to support such an integration.

The correct proof of generality is that materially different application economies can use the same IMMORTAL kernel and the same Cardano Adapter while keeping their application policies separate.

## Non-goals

This document does not:

- define ECHO's economy;
- change PRE-RICH economics;
- add a second adapter;
- change Cardano semantics;
- promote any application rule to IMMORTAL;
- authorize implementation of an ECHO integration.

It is solely an architectural boundary clarification.
