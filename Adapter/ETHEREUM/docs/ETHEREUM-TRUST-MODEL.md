# Ethereum Adapter — Trust Model

**Status:** 🟡 DRAFT / OPEN DECISION
**Semantic status:** research boundary only; no Ethereum implementation or conformance claim is authorized by this document.

## 1. Role

This document defines the trust boundary for a future Ethereum/EVM Adapter under IMMORTAL.
It does not modify IMMORTAL universal semantics, Economic Gate, Viability Gate, Cardano Adapter, PRE-RICH or Beacon semantics.

The central architectural observation is the inverse of the Bitcoin case: EVM contracts can enforce rich state relationships inside a single atomic transaction, while randomness, public ordering, reentrancy, shared mutable state, upgrade authority and gas become explicit trust/safety surfaces.

## 2. Universal machine

The Adapter must preserve the canonical machine:

`State → Candidate Action → Safety/Viability → Fee/valuation → Settlement realization → Atomic Commit → State′`

Ethereum transaction atomicity may realize the atomic-commit boundary, but it does not by itself prove IMMORTAL economic admission. The contract must still enforce the applicable Economic Gate, Viability Gate and concrete-kernel conditions.

## 3. Economic state realization

A candidate Ethereum implementation may represent application state in contract storage and may perform multiple state/value effects in one transaction.

The universal economic quantities remain canonical:
- crystallizedLiabilities;
- unresolvedReserve;
- unresolvedTicketCount;
- worstCaseExposure;
- safetyCapital;
- reserveProtection;
- mandatoryFutureCosts;
- additionalProtectedCapital.

ProtectedCapital, RawSurplus and solvency predicates must remain exactly those of the current IMMORTAL kernel.

No Ethereum-specific economic constant may be introduced into IMMORTAL.

## 4. Atomic sale / settlement

A single EVM transaction can update contract storage and perform token/value transfers, with a revert undoing the transaction state changes.

Conformance still requires proof that the function cannot leave an economically invalid intermediate or final state reachable through another entry point, callback, delegated call or upgrade path.

An atomic transaction is therefore an execution primitive, not an economic-conformance certificate.

## 5. Randomness trust classes

### B1-Ethereum — Authorized external publisher

Chainlink VRF is a candidate B1 construction: verifiable randomness is delivered by an external oracle network and verified on-chain. The authority/network boundary must be named explicitly.

drand/League of Entropy is a separate candidate: a distributed threshold beacon operated by multiple independent organizations. Its security derives from the threshold and ceremony/network assumptions, not from Ethereum consensus itself. It should therefore be classified as an external B1-style randomness boundary, not native B3.

### B1-Ethereum — Native RANDAO with declared economic mitigation

`PREVRANDAO` exposes beacon-chain RANDAO output to the EVM. EIP-4399 explicitly documents proposer biasability: a proposer can refuse to propose and can influence applications by controlling when a transaction is included. The same EIP also documents mitigations such as future lookahead and states that longer lookahead accumulates additional entropy.

Therefore PREVRANDAO may be researched as a bounded-risk native source, but it must not be treated as an unbiased B3 oracle without a protocol-specific bias/grinding proof.

### B3-Ethereum — native proof-based randomness

A future protocol-level construction could qualify as B3 only if its security and verification are provided by Ethereum consensus/protocol rules and the relevant IMMORTAL proof boundary is independently demonstrated.

A future VDF or similar proposal is therefore a research target only. No activation or deployment date is assumed.

## 6. Required randomness proof

Any Ethereum randomness candidate must specify:
- commit point and commit data;
- earliest eligible beacon/block/slot;
- lookahead;
- who can know the result before commitment becomes irreversible;
- proposer/validator influence power;
- censorship and inclusion influence;
- maximum economically rational grinding window;
- maximum payout/value at risk;
- reorg/finality treatment;
- domain separation;
- failure/stall behavior;
- verification evidence.

For PREVRANDAO specifically, the proof must address the proposer influence and transaction-inclusion effects documented by EIP-4399 rather than merely hashing the opcode output.

## 7. Reentrancy boundary

EVM external calls transfer control flow to another contract and can create reentrancy vulnerabilities. Ethereum's security guidance explicitly recommends checks-effects-interactions and/or a mutex-style guard.

IMMORTAL Ethereum conformance must therefore cover:
- every external call site;
- callback/reentrancy paths;
- token hooks and receiver callbacks where applicable;
- state mutation ordering;
- reentrancy guards where required;
- invariant preservation across failed calls.

Reentrancy must be treated as a first-class conformance dimension, not as an implementation detail.

## 8. Mempool / MEV boundary

Reveal transactions may be visible before inclusion. A candidate protocol must specify whether a searcher/proposer can observe, reorder, censor or selectively delay a reveal to influence an economic result.

Possible mitigations include commit-then-reveal separation, future randomness lookahead, encrypted/private transaction paths, or a protocol design in which transaction visibility cannot change the admissible outcome.

Private relays are not automatically trustless. If relied upon, their authority and failure mode must be explicitly classified.

## 9. Shared mutable state

Ethereum storage can place many tickets and aggregate economic state behind a common contract authority.

Conformance must therefore prove:
- aggregate invariant preservation;
- isolation between ticket operations;
- no unauthorized state transition through alternate entry points;
- correct accounting after partial external interactions;
- bounded gas for all required operations.

Containment must be demonstrated rather than assumed from the execution model.

## 10. Upgradeability / no-side-door rule

A proxy or other upgrade mechanism can change executable economic semantics without necessarily changing the visible application state.

Therefore an Ethereum Adapter is **not conformant** if an administrator can silently replace economic logic.

If upgradeability is required, the upgrade path must itself be governed by a canonical, auditable process with:
- explicit authorization;
- canonical proposal/evidence;
- timelock;
- observable activation;
- replay/finality handling;
- emergency behavior that cannot bypass the Economic Gate.

A direct mutable admin key is not an acceptable substitute for this boundary.

An immutable contract is the default research baseline.

## 11. Gas / aggregate accounting

Ethereum execution has a finite gas limit. Economic state updates must therefore use bounded/incremental accounting rather than unbounded iteration over all unresolved tickets.

Where the existing IMMORTAL implementation uses delta-based accounting, the Ethereum Adapter must preserve the same semantic result without introducing a loop whose gas cost grows with total historical state.

Out-of-gas behavior must fail closed and must not leave an economically partial state.

## 12. Fee / valuation boundary

Gas consumption and transaction fees are execution costs, not automatically IMMORTAL economic valuation.

The Adapter must distinguish observed gas/fee cost, worst-case execution envelope and any protocol valuation required by IMMORTAL.

Missing or invalid valuation evidence must follow the existing SAFE_STALL boundary rather than inventing a conversion.

## 13. Conformance matrix

| Requirement | Ethereum realization | Consensus-enforced | Contract-enforced | External evidence | Status |
|---|---|---:|---:|---:|---|
| Commit | EVM transaction/state transition | Partial | Required | Required | OPEN |
| Lock | storage/predicate/timelock | Partial | Required | Required | OPEN |
| Reveal | contract transition | Partial | Required | Required | OPEN |
| Expiration | block/time conditions | Partial | Required | Required | OPEN |
| Settlement | ETH/ERC token transfer | Partial | Required | Required | OPEN |
| Dissolution | terminal contract path | Partial | Required | Required | OPEN |
| Economic admission | Economic Gate + concrete kernel | No automatic claim | Required | Required | OPEN |
| Post-state | storage observation + verification | No automatic claim | Required | Required | OPEN |
| Randomness | candidate beacon + proof | TBD | Required | Required | OPEN |
| Reentrancy | call-graph/invariant discipline | No | Required | Required | OPEN |
| Upgrade authority | immutable or governed path | No | Required | Required | OPEN |
| Gas boundedness | bounded state transition | No | Required | Required | OPEN |

## 14. Candidate classification

| Candidate | Current classification | Promotion condition |
|---|---|---|
| PREVRANDAO + protocol-specific lookahead/grinding bound | B1-style/native bounded-risk candidate | quantitative bias/value-at-risk proof |
| Chainlink VRF | B1-Ethereum | explicit oracle trust/failure model + on-chain verification evidence |
| drand / League of Entropy | B1-style external threshold beacon | threshold, key/ceremony, availability and bridge verification evidence |
| future native VDF/proof randomness | B3-Ethereum research target | activated consensus primitive + independent proof/conformance evidence |

## 15. Technology-selection gate

No candidate is promoted until the conformance matrix and randomness proof are complete.

The selected realization must preserve IMMORTAL semantics transition-by-transition and must not import an undeclared economic authority.

## 16. Non-contamination firewall

This document does not alter:
- IMMORTAL economic constants;
- ProtectedCapital;
- Economic Gate;
- Viability Gate;
- PRE-RICH economics;
- Cardano Adapter semantics;
- Bitcoin Adapter semantics;
- Beacon semantics.

Ethereum-specific assumptions remain inside `Adapter/ETHEREUM/`.

## Sources

- EIP-4399, PREVRANDAO and its documented biasability/mitigation considerations.
- Ethereum smart-contract security guidance on reentrancy.
- Chainlink VRF documentation.
- drand / League of Entropy documentation.

External-source claims are evidence for the research boundary only; they do not become IMMORTAL canon until the repository's conformance process establishes them.