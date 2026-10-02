# CIP-0113 ↔ PRE-RICH / IMMORTAL Compatibility Audit

**Status:** RESEARCH / NON-NORMATIVE / OPEN  
**Date:** 2026-09-30  
**Scope:** Cardano Adapter ↔ CIP-0113 programmable-token capability  
**Branch:** `work/immortal-green-closure`

## 1. Purpose

This document records a compatibility audit of Cardano CIP-0113 against the existing
IMMORTAL / PRE-RICH architecture.

It does **not** introduce economic rules, change the IMMORTAL kernel, change PRE-RICH
economics, authorize CIP-0113 adoption, or make CIP-0113 a constitutional dependency.

The audit asks whether CIP-0113 can be used as a Cardano-side realization capability
without allowing the programmable-token layer to acquire economic authority.

## 2. External status verified

CIP-0113 PR #444 was merged into the Cardano CIPs repository on 2026-09-29.

The current implementation work remains under active CIP-113 development; the
reference implementation repository explicitly describes the standard as still subject
to specification changes. Therefore this audit treats the external standard as an
external evolving dependency and does not make it normative inside IMMORTAL.

Reference implementation and current development material are maintained separately
from the CIP specification.

## 3. Existing repository authority boundary

The current Cardano Adapter specification states:

- the Adapter is a translation, observation, realization and reporting layer;
- it is not an economic engine;
- it cannot redefine ProtectedCapital or RawSurplus;
- technical feasibility is distinct from economic admissibility;
- observed Cardano evidence is not automatically canonical economic evidence.

PRE-RICH Constitution independently states that PRE-RICH is an application of IMMORTAL
and cannot redefine IMMORTAL semantics while claiming conformance.

Therefore CIP-0113 MUST be treated, if adopted, as a Cardano realization capability
below the economic authority boundary.

## 4. Compatibility matrix

| CIP-0113 capability | PRE-RICH / IMMORTAL treatment | Result |
|---|---|---|
| Programmable-token custody at shared script | Cardano realization mechanism | Compatible in principle |
| Stake-credential ownership | Cardano ownership realization | Compatible in principle |
| Registry of token policy/configuration | Discovery / technical validation | Compatible, but registry truth is not economic truth |
| TransferLogicScript | Application-specific transfer constraint | Candidate integration surface |
| ThirdPartyLogicScript | Potential forced action surface | **OPEN / requires explicit PRE-RICH threat-model review** |
| Unfracking | Same-owner UTxO restructuring | **OPEN / requires explicit semantic review** |
| Issuance logic | Token issuance boundary | Must remain subordinate to PRE-RICH/IMMORTAL issuance rules |
| Global state | Optional token-specific state | Candidate realization surface |
| Reference inputs | Cardano evidence / configuration transport | Compatible |
| Withdraw-zero dispatch | Cardano validation mechanism | Compatible in principle |
| Protocol-parameter wiring | Deployment configuration | **CRITICAL TRUST-BOUNDARY REVIEW** |
| Upgrade authority | Deployment authority | MUST NOT become IMMORTAL economic authority |
| CIP-113 bootstrap identity | Deployment/version identity | Useful technical provenance; not economic authority |
| Wallet integration | UX / observation | Not an economic dependency |

## 5. Critical finding: upgradeability

CIP-0113 permits a deployment to re-point shared validation credentials through
protocol parameters. The current specification explicitly treats the protocol-parameter
UTxO and its recorded upgrade authority as part of the deployment trust model.

This creates a clean architectural rule for PRE-RICH:

```
CIP-113 upgrade authority
        ≠
PRE-RICH economic authority
        ≠
IMMORTAL constitutional authority
```

A CIP-113 upgrade MUST NOT be allowed to change, reinterpret, or bypass:

- IMMORTAL economic predicates;
- ProtectedCapital;
- RawSurplus;
- liability-first accounting;
- PRE-RICH frozen payout rules;
- HighestClassEverActivated monotonicity;
- expiry finality;
- jackpot protection;
- economic admission requirements.

If a programmable-token upgrade can alter any of those semantics, the integration is
not merely a Cardano adapter change: it crosses the normative boundary and requires a
separate specification-level decision.

## 6. Third-party action review

CIP-0113 deliberately does not define one universal third-party authority. A
substandard may permit seizure, forced transfer, freeze, rebase, auto-compounding or
other actions without holder consent.

Therefore PRE-RICH MUST NOT infer trust properties from CIP-0113 conformance alone.

Before using a third-party-capable substandard, the Adapter integration must identify:

1. what third-party actions are possible;
2. who can trigger them;
3. whether the action can reduce holder balance;
4. whether the action can alter PRE-RICH liabilities;
5. whether the action can move assets across the economic boundary;
6. whether the action can invalidate an IMMORTAL state/refinement assumption.

For PRE-RICH's own economic token, a third-party path that can modify economically
relevant balances is a separate authorization surface and cannot be silently accepted
as ordinary token transfer logic.

## 7. Unfracking review

CIP-0113 defines UnfrackingAct as holder-driven restructuring of the holder's own
programmable-token UTxOs without changing ownership.

This appears technically compatible with Cardano UTxO realization, but the Adapter must
prove that restructuring cannot:

- create or destroy economic value;
- bypass transfer validation;
- bypass expiry;
- bypass ownership constraints;
- alter canonical economic state without the corresponding IMMORTAL transition.

The CIP-113 action itself therefore cannot be treated as an economic transition merely
because the ledger accepts it.

## 8. Registry and protocol parameters

CIP-0113 uses reference inputs for protocol parameters and registry nodes.

For PRE-RICH these are evidence/configuration inputs, not economic authority.

The Adapter must bind any accepted observation to:

```
exact deployment identity
+ exact registry/protocol-parameter state
+ exact transaction
+ exact ledger context
```

A cached script hash or stale registry observation MUST NOT be treated as sufficient
conformance evidence where current deployment wiring matters.

## 9. Transaction-size and execution implications

CIP-0113's architecture is relevant to the existing Cardano Adapter work because it
uses:

- reference inputs;
- small dispatch validators;
- withdraw-zero delegates;
- per-policy registry proofs;
- token-specific validation delegates.

This is directionally compatible with the repository's existing effort to keep Cardano
transactions within real ledger limits.

However, this is only an architectural observation. It is **not** evidence that
CIP-0113 reduces PRE-RICH transaction size or execution cost. That requires measured
PRE-RICH transactions and real ledger evaluation.

## 10. Required conformance tests before adoption

The following tests should be added as an Adapter compatibility corpus, without changing
economic semantics:

### A. Upgrade isolation

Given a CIP-113 deployment upgrade that changes programmable-token wiring:

- IMMORTAL economic predicates remain identical;
- PRE-RICH economic state transition remains identical;
- only the declared Cardano realization layer changes.

### B. Third-party isolation

Attempt a third-party action that changes token ownership/value in a way not represented
by the canonical PRE-RICH transition.

Expected result: economic admission/refinement fails closed.

### C. Unfracking isolation

Perform a valid same-owner UTxO restructuring.

Expected result: ownership and economic state remain unchanged except for the permitted
Cardano representation.

### D. Registry freshness

Use a stale or mismatched registry node.

Expected result: Cardano-side validation or evidence binding rejects the realization.

### E. Protocol-parameter freshness

Use a transaction built against obsolete protocol wiring.

Expected result: realization fails or evidence is rejected; no silent fallback.

### F. Mint/burn boundary

Attempt programmable-token mint/burn that is valid under a token substandard but not
valid under the PRE-RICH/IMMORTAL issuance contract.

Expected result: economic admission remains authoritative and rejects the transition.

### G. Evidence replay

Replay a valid historical CIP-113 transaction against a different deployment identity
or protocol-parameter state.

Expected result: the evidence packet is not accepted as current conformance evidence.

## 11. Architectural placement

The compatible placement is:

```
IMMORTAL Constitution
        ↓
IMMORTAL Economic Kernel
        ↓
IMMORTAL Economic Algorithm
        ↓
Cardano Adapter specification
        ↓
PRE-RICH application profile
        ↓
CIP-0113 realization capability
        ↓
Cardano ledger
```

CIP-0113 MUST NOT be inserted above the IMMORTAL economic kernel or between the
IMMORTAL kernel and its canonical economic algorithm.

## 12. Current disposition

**Do not modify the IMMORTAL Economic Kernel.**

**Do not add CIP-0113 constants to PRE-RICH Game Economy.**

**Do not make CIP-0113 a constitutional dependency.**

**Do continue the Adapter-level compatibility work.**

The first concrete Adapter boundary has now been implemented in:

`Adapter/CARDANO/observation/Cip113ProgrammableTokenBoundary.ts`

with executable tests in:

`Adapter/CARDANO/observation/Cip113ProgrammableTokenBoundary.test.ts`

This first layer binds deployment identity, registry node, protocol-parameter state,
transfer-logic reference, token identity, ownership credential and transaction reference.
It also explicitly rejects reuse of CIP-113 upgrade authority as economic authority.
It is evidence binding only; it does not implement CIP-113 validators or claim ledger
support.

The remaining concrete conformance corpus is:

```
upgrade isolation
third-party isolation
unfracking isolation
registry freshness
protocol-parameter freshness
mint/burn boundary
evidence replay
```

Only after those tests are backed by actual Cardano ledger evidence should CIP-0113 be
considered a supported PRE-RICH realization profile.

## 13. Source references

- Cardano CIP-0113: https://github.com/cardano-foundation/CIPs/pull/444
- CIP-0113 reference implementation: https://github.com/cardano-foundation/cip113-programmable-tokens
- Cardano Developer Portal programmable-token documentation:
  https://developers.cardano.org/docs/developers/curriculum/native-tokens/programmable-tokens/
- IMMORTAL Cardano Adapter specification:
  `Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md`
- PRE-RICH Constitution:
  `PRE-RICH/docs/CONSTITUTION.md`
- PRE-RICH Game Economy:
  `PRE-RICH/docs/GAME-ECONOMY.md`
- IMMORTAL Economic Kernel:
  `IMMORTAL/docs/ECONOMIC-KERNEL.md`
