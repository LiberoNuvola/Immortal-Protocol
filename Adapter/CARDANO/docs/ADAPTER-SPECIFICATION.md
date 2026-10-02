# Cardano Adapter Specification

## 1. Boundary

The Cardano Adapter is the **translation, observation and realization layer** between
chain-neutral IMMORTAL semantics and Cardano-specific execution.

The Adapter is shared across applications that use IMMORTAL on Cardano. An application
profile specializes IMMORTAL for its own economic domain; the Adapter does not become
application-specific merely because one such application is currently deployed.

```text
             APPLICATION A       APPLICATION B
                   │                   │
             economic profile    economic profile
                   │                   │
                   └─────────┬─────────┘
                             ▼
                         IMMORTAL
                   universal semantics
                             │
                             ▼
                      CARDANO ADAPTER
                translate · observe · realize
                             │
                             ▼
                         Cardano
```

For the current integration, PRE-RICH is a Cardano-native DApp and an
IMMORTAL-conformant application. ECHO or another future application may use the same
Cardano Adapter without creating a second adapter.

The Adapter is not the owner of an application and is not an independent economic
engine.

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
- execution and confirmation feedback to IMMORTAL and the relevant application.

## 3. Authority boundary

The Adapter is not an economic authority.

It may observe and analyze the concrete chain environment, normalize its state, determine
what transaction/UTxO realizations are physically possible, and report candidate
chain-realization trajectories and their technical consequences.

IMMORTAL evaluates the universal economic meaning of those observations and determines
economic admissibility, safety, viability and required universal economic effects.

The Adapter may answer **"what can this chain realize, under these concrete conditions?"**
but it must not turn that answer into **"what is economically allowed by IMMORTAL?"**.
That second decision belongs to IMMORTAL.

The application chooses application intent and strategy. It cannot make an action
economically valid merely by requesting it, and the Adapter cannot make it valid merely
by realizing it.

## 4. External evidence

Cardano cannot be assumed to know arbitrary external state. An adapter may transport
evidence; the Cardano verification path determines whether that evidence satisfies the
active application trust model.

## 5. Application-profile boundary

Application-specific economic policy belongs to the application profile, not to the
Cardano Adapter.

For PRE-RICH, this includes ticket classes, pricing, payout policy, Jackpot lifecycle,
GameRules and application-specific Beacon usage.

For another application, those policies may be materially different while the same
Cardano Adapter continues to provide the chain boundary.

B1/B3 are current PRE-RICH integration/trust-model concerns. They are not an IMMORTAL
constitutional dependency and do not make the Cardano Adapter a PRE-RICH-specific
component.

## 6. Conformance

Cardano Adapter conformance requires preservation of IMMORTAL predicates plus the
requirements of the relevant application profile. This document does not declare the
current implementation conforming.

## 7. Operational execution boundary

The application formulates an **application intent** and supplies application-specific
data. It must not be the universal economic authority and should not independently
define the chain-specific realization of an IMMORTAL-admissible action.

The Cardano Adapter is responsible for translating admissible requirements into
Cardano-specific transaction/UTxO realization, including construction, signing and
submission where applicable, and for translating resulting chain evidence back toward
IMMORTAL and the relevant application.

For the current SALE/MINT slice, signing and submission cross the chain boundary through
`Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts`.

The adapter returns the chain transaction reference. It does not choose economic
results, alter application economics, or convert application values outside the
declared IMMORTAL/application contract.

## 8. Application ↔ IMMORTAL ↔ Adapter operational contract

The conceptual interaction is:

```text
Application intent / strategy
            ↓
Application Economic Profile
            ↓
   IMMORTAL economic evaluation
            ↓
 admissible universal conditions
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
 Application/profile result
```

The application expresses intent and strategy through its profile. IMMORTAL determines
the universal admissible economic space. The Cardano Adapter translates those abstract
requirements into concrete Cardano actions and carries observations/evidence back toward
IMMORTAL.

The Adapter is therefore a **translator and chain-boundary component**, not a second
economic authority and not an application-specific adapter.

## 9. Reuse rule

A new application on Cardano does **not** imply a new Cardano Adapter.

A new Adapter is justified by a materially different chain/execution boundary or by an
explicitly specified adapter contract, not by the existence of another application.

```text
                    IMMORTAL
                       │
          ┌────────────┼────────────┐
          │            │            │
       Cardano         EVM        Cosmos
       Adapter       Adapter      Adapter
          │
      ┌───┴────┐
      │        │
   PRE-RICH   Application B
```
