# Cardano Adapter Specification

## 1. Boundary

PRE-RICH is a **Cardano-native DApp** and, at the same time, an **IMMORTAL-conformant application**.
It belongs to the execution environment in which it is built (Cardano) and adopts
IMMORTAL's protocol semantics to move autonomously within the economic space that
IMMORTAL determines to be admissible.

The Cardano Adapter is the **translation, observation and realization layer** between
the abstract IMMORTAL side and Cardano-specific execution. It is not the owner of
the DApp, and it is not an independent economic engine.

```text
                    IMMORTAL CORE
              economic semantics / authority
                         ↕
                  CARDANO ADAPTER
          translate · observe · realize · report
                    ↙         ↘
           PRE-RICH DApp      Cardano chain
        (Cardano-native +     (execution layer)
         IMMORTAL-conformant)
```

The Adapter translates IMMORTAL-prescribed economic requirements and admissible
actions into Cardano-realizable action candidates, and translates Cardano state,
execution results and evidence back into the forms IMMORTAL evaluates.

PRE-RICH remains an application of Cardano while using IMMORTAL as its governing
economic/protocol model.

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

It may observe and analyze the concrete chain environment, normalize its state, determine
what transaction/UTxO realizations are physically possible, and report candidate
chain-realization trajectories and their technical/economic consequences.

IMMORTAL alone evaluates the economic meaning of those observations and determines
economic admissibility, safety, viability and required economic effects.

The Adapter may answer **"what can this chain realize, under these concrete conditions?"**
but it must not turn that answer into **"what is economically allowed by IMMORTAL?"**.
That second decision belongs to IMMORTAL.

The DApp chooses application intent and strategy. It cannot make an action economically
valid merely by requesting it, and the Adapter cannot make it valid merely by realizing it.

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
PRE-RICH DApp intent / strategy
            ↓
      CARDANO ADAPTER
            ↓
   IMMORTAL economic evaluation
            ↓
 admissible action / conditions
            ↓
      CARDANO ADAPTER
   chain-realization analysis
            ↓
     Cardano transaction
            ↓
   chain observation/evidence
            ↓
   IMMORTAL revalidation
            ↓
      PRE-RICH DApp result
```

The DApp is native to Cardano and is an application of IMMORTAL at the economic/protocol
level. It expresses intent and strategy; IMMORTAL determines the admissible economic
space; the Adapter translates between those abstract requirements and concrete Cardano
actions, while carrying observations and evidence back to IMMORTAL.

The Adapter is therefore a **translator**, not a second economic authority:
it does not invent, override or reinterpret IMMORTAL economic rules.
