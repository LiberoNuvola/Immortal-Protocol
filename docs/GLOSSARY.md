# IMMORTAL Glossary

## IMMORTAL
The universal, chain-neutral, application-neutral economic protocol model.

## Application
A concrete specialization of IMMORTAL with its own economic policy, assets, lifecycle and user-facing semantics.

## Adapter
A layer that maps IMMORTAL's abstract state and transition requirements into a concrete execution environment.

## Cardano Adapter
The current adapter mapping IMMORTAL concepts to Cardano mechanisms such as UTxO state, transactions, validators, validity intervals and native assets.

## PRE-RICH
The current application built on the IMMORTAL model.

## State
The canonical economic information needed to evaluate admissibility and transitions.

## ProtectedCapital
The canonical protected obligations/exposures that cannot be treated as freely distributable value.

## EEV
Economic Evaluation Value used by the universal economic model.

## RawSurplus
`max(0, EEV − ProtectedCapital)`.

## Ω (Omega)
The admissible outcome set considered by the safety model.

## Pre(K)
The predecessor operator identifying states from which an action can keep every admissible outcome in `K`.

## F(K)
The safety/viability operator `Safe ∩ Pre(K)`.

## K*
The greatest fixed point `νF`, representing the abstract viability kernel.

## K_c
A concrete certified kernel used by an implementation.

## CAR
Conditional Allocation Reserve, the universal abstraction for value conditionally allocated under an application-defined rule.

## Atomic transition
A transition whose required economic effects are committed as one indivisible economic state change.

## Expiry finality
The property that an expired economic right cannot be silently resurrected by a later transition.

## Conformance
Evidence that a concrete implementation satisfies the normative requirements applicable to it.

## Governance
A process for evolving/adopting project artifacts. Governance is not proof and does not itself establish economic conformance.

## Evidence
A reproducible artifact supporting a claim, classified by type such as DESIGN, PROOF, MODEL, TEST or AUDIT.

## Experimental
A status meaning that the artifact is for research/reference/development and is not, by that status alone, normative or production-certified.
