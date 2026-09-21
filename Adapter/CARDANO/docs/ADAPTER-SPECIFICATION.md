# Cardano Adapter Specification

## 1. Boundary

Cardano is an adapter/implementation environment for IMMORTAL, not a dependency of IMMORTAL's abstract protocol semantics.

The Adapter is the operational bridge through which the DApp communicates with IMMORTAL and through which IMMORTAL observes and interacts with the concrete chain.

```text
PRE-RICH DApp
      ↕
IMMORTAL Adapter
      ↕
IMMORTAL Core
      ↕
   Cardano chain
```

## 2. Responsibilities

The adapter maps generic concepts to Cardano mechanisms, including where applicable:

- UTxO state;
- transaction inputs/outputs;
- datum/redeemer representation;
- validators and minting policies;
- Cardano-native assets;
- validity intervals;
- reference inputs;
- transaction construction/submission;
- Cardano-specific evidence transport;
- chain-state observation and normalization;
- discovery/analysis of chain-feasible realization paths;
- StateBefore/StateAfter observation;
- execution and confirmation feedback to IMMORTAL and the DApp.

## 3. Authority boundary

The Adapter is not an economic authority.

It may observe and analyze the concrete chain environment, normalize its state, determine what transaction/UTxO realizations are physically possible, and report candidate realization trajectories and their consequences.

IMMORTAL alone evaluates the economic meaning of those observations and determines economic admissibility, safety, viability and required economic effects.

The Adapter must not independently decide an economic result that the IMMORTAL predicate requires to be verified.

## 4. External evidence

Cardano cannot be assumed to know arbitrary external state. An adapter may transport evidence; the Cardano verification path determines whether that evidence satisfies the active application trust model.

## 5. PRE-RICH integration

For the current PRE-RICH integration, B1 is an authorized-publisher trust model and B3 is a stronger publisher-independent canonicality target. Neither is an IMMORTAL constitutional dependency.

## 6. Conformance

Cardano adapter conformance requires preservation of IMMORTAL predicates plus the requirements of the relevant application profile. This document does not declare the current implementation conforming.


## 7. Operational execution boundary

For the current SALE/MINT slice, the DApp may construct the transaction shape,
but signing and submission cross the chain boundary through
`Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`.

The adapter returns the chain transaction reference. It does not choose
economic results, alter application economics, or convert application values.


## 10. DApp ↔ IMMORTAL operational contract

The canonical interaction is:

```text
DApp intent
    ↓
Adapter
    ↓
IMMORTAL economic evaluation
    ↓
admissible action / economic conditions
    ↓
Adapter chain realization analysis
    ↓
Cardano transaction / observation
    ↓
Adapter evidence
    ↓
IMMORTAL revalidation
    ↓
DApp result
```

The DApp may choose application strategy and express intent. IMMORTAL determines the economically admissible action space. The Adapter is the communication, observation and realization bridge; it does not become a second economic engine.
