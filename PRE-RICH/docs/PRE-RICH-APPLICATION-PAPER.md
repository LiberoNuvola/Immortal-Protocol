# PRE-RICH — Application Paper

**Role:** concrete application of IMMORTAL  
**Current environment:** Cardano through the IMMORTAL Cardano Adapter  
**Status:** Experimental / Open Source / Active Development

## 1. What PRE-RICH is

PRE-RICH is a concrete application profile of IMMORTAL.

Its purpose is to instantiate the universal protocol with an application-specific economic system, including denomination, ticket lifecycle, class activation, settlement, reserves, Jackpot policy and Beacon trust assumptions.

## 2. What PRE-RICH is not

PRE-RICH is not the definition of IMMORTAL.

Its parameters and policy choices do not become universal merely because they are implemented on Cardano.

## 3. Current application baseline

The current application documentation defines:

- USDM as the application economic denomination;
- ticket classes `1 / 2 / 3 / 5 / 10 / 25 / 50 / 100`;
- Genesis at 1 USDM;
- maximum normal payout of `500 × ticket price`;
- liability/protection-first accounting;
- expiry finality;
- B1 authorized-publisher Beacon model;
- B3 as a future publisher-independent target.

These are PRE-RICH application semantics.

## 4. Relationship to IMMORTAL

PRE-RICH inherits the universal obligations to preserve applicable IMMORTAL predicates and evidence requirements.

Its own constitution and specifications determine how the application instantiates those abstractions.

## 5. Relationship to Cardano

Cardano supplies the execution environment.

UTxO state, validators, native assets, validity intervals, transaction construction and Cardano-specific evidence are adapter concerns.

## 6. Evidence status

The application remains experimental. Implementation evidence must be read together with the IMMORTAL conformance specification and the Cardano adapter evidence.

A mathematical property of IMMORTAL is not automatically a conformance claim about PRE-RICH.

## 7. Governance boundary

PRE-RICH governance can evolve application policy and project organization within its authority.

It cannot silently modify IMMORTAL's universal invariants and continue to claim universal conformance.
