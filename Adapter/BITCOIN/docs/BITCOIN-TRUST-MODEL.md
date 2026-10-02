
# Bitcoin Adapter — Trust Model

> **Status:** Research / architecture draft  
> **Scope:** IMMORTAL Bitcoin Adapter  
> **Normative status:** This document does not modify IMMORTAL economic rules. It defines a candidate Bitcoin execution/trust boundary for future Adapter work.

## 1. Purpose

The Bitcoin Adapter is the translation, observation and realization layer between the
chain-agnostic IMMORTAL economic model and a Bitcoin-family execution environment.

It does not become a second economic authority.

Its responsibility is to:

- observe Bitcoin-specific settlement state;
- translate IMMORTAL-prescribed requirements into Bitcoin-realizable actions;
- transport and authenticate Bitcoin-specific evidence according to the active profile;
- report realization results and limitations back to IMMORTAL.

IMMORTAL remains the authority for economic semantics, admissibility, safety and
viability.

```text
                    IMMORTAL CORE
              economic semantics / authority
                         ↕
                  BITCOIN ADAPTER
          translate · observe · realize · report
                    ↙         ↘
          application/DApp     Bitcoin-family layer
                               (execution/settlement)
```

The Bitcoin Adapter must not turn a Bitcoin-specific capability into an IMMORTAL
economic decision.

## 2. The fundamental constraint

Bitcoin Script does not expose the same transaction-context inspection and arbitrary
validation surface available to a Cardano Plutus validator.

In particular, the Adapter cannot assume that Bitcoin mainnet Script can enforce the
same rich StateBefore/StateAfter relationships, arbitrary cross-output arithmetic or
application-specific state-machine invariants that are enforced by the Cardano
Adapter's Plutus path.

Therefore:

> **A Bitcoin realization path must never be presented as cryptographically
> equivalent to the Cardano on-chain enforcement path merely because both settle
> through a single transaction.**

Bitcoin transaction atomicity does not by itself provide verification of the economic
relationship between arbitrary inputs and outputs.

Where consensus-level enforcement is unavailable, the missing enforcement must be
represented explicitly as either:

1. a declared trust assumption;
2. client-side validation with independently reproducible rules; or
3. a future consensus capability.

No implicit trust boundary is permitted.

## 3. Trust profiles

The Bitcoin Adapter separates three research profiles.

### 3.1 B1-Bitcoin — declared external authority

**Status:** possible with existing technology, subject to the selected execution layer.

A B1 profile may use an explicitly authorized publisher, federation or other declared
authority to attest to facts that Bitcoin consensus does not itself validate.

The trust assumption must be named in the application profile and evidence packet.

```text
Bitcoin settlement
      ↓
declared authority / publisher
      ↓
verified observation
      ↓
IMMORTAL economic evaluation
```

B1 means **authorized trust**, not trustlessness.

A Bitcoin federation must never be silently treated as equivalent to Bitcoin consensus.

### 3.2 Client-validated Bitcoin profile — RGB research path

**Status:** research target.

RGB provides a client-side-validation model in which contract business logic and state
transition validation are performed by clients while Bitcoin provides an anchoring
layer.

For IMMORTAL this is potentially useful because the economic/state machine can remain
outside Bitcoin Script while retaining independently reproducible validation rules.

The important boundary is:

```text
IMMORTAL economic rules
          ↓
Bitcoin-specific contract schema
          ↓
independent client validation
          ↓
Bitcoin commitment / settlement anchor
```

This profile must **not** be called B3 merely because validation is performed by
multiple clients.

B3 in the existing IMMORTAL vocabulary means a stronger publisher-independent
canonicality/proof target. Client-side validation alone does not establish the
publisher-independent canonical-state proof path required for B3.

The RGB path therefore remains a separate research profile until its evidence,
canonicality and verifier properties are explicitly demonstrated.

### 3.3 B3-Bitcoin — consensus-enforced / proof-based target

**Status:** research / blocked by currently unavailable Bitcoin mainnet consensus
capabilities for the required enforcement surface.

The target is a Bitcoin realization in which the relevant state-transition constraints
or a succinct proof of those constraints can be enforced/verified without an
application-trusted publisher.

Candidate future primitives include covenant/introspection proposals such as
OP_CHECKTEMPLATEVERIFY (BIP-119) and OP_CAT (BIP-347), but proposals must not be
treated as deployed Bitcoin mainnet consensus.

No implementation or roadmap item may assume a future soft fork has activated unless
that activation is independently verified for the target network.

## 4. IMMORTAL concept mapping

| IMMORTAL concept | Cardano realization | Bitcoin research realization | Boundary |
|---|---|---|---|
| Economic state | Plutus datum / canonical state | Client-side state or external committed state | Bitcoin consensus does not automatically validate the full economic state |
| Ticket identity | Native asset + validator/policy | Taproot Assets, RGB or another explicitly selected asset layer | Asset identity does not itself prove economic admissibility |
| Economic Gate | Plutus predicate | IMMORTAL evaluation + profile-specific evidence/validation | Never replaced by wallet/UI logic |
| Atomic settlement | Cardano transaction + validator checks | Bitcoin transaction atomicity | Atomicity is not the same as cross-output economic verification |
| Beacon | Application-specific beacon path | Bitcoin block/commitment-derived source, subject to manipulation analysis | Beacon semantics remain application-specific |
| State transition | Validator-enforced transition | Client validation, declared authority, or future proof/covenant mechanism | Must be classified explicitly |
| Evidence | Cardano datum/tx/script evidence | Bitcoin tx/block/commitment/proof evidence | Evidence provenance and verification rules are profile-specific |

## 5. Ticket representation

The Adapter must not prescribe a Bitcoin asset technology as an IMMORTAL primitive.

Candidate realization technologies include:

- RGB client-side-validated contracts;
- Taproot Assets;
- Liquid/Elements assets for a federated execution profile.

The selected technology must provide a documented mapping for:

- unique ticket identity;
- ownership;
- transfer semantics;
- application metadata;
- lifecycle state;
- evidence/reference to the economic state.

Metadata alone is not an economic proof.

## 6. State representation

The Cardano PrizePool datum cannot simply be copied into Bitcoin Script.

A Bitcoin Adapter must define, for its selected profile:

1. where the canonical application state is represented;
2. who/what validates state transitions;
3. how previous state is linked to the next state;
4. how conflicting histories are detected;
5. how finality is established;
6. how IMMORTAL receives independently checkable evidence.

A client-side state representation must not be described as Bitcoin consensus state.

A federated state representation must identify the federation and its authority boundary.

## 7. Beacon / randomness boundary

A Bitcoin block hash may be considered as an input to an application beacon, but the
Adapter must not claim that a future block hash is automatically unbiased randomness.

Any design using a future block hash must specify at least:

- commitment time relative to the beacon block;
- the exact block-selection rule;
- domain separation;
- reorganization/finality handling;
- miner manipulation/grinding analysis;
- economic value at risk relative to the cost of withholding or replacing a block;
- behavior when the expected block is not final or cannot be observed.

The beacon remains application evidence. It does not become an IMMORTAL economic
authority.

## 8. Liquid / Elements profile

Liquid/Elements may be used as a practical B1 demonstrator where its additional
contract and asset capabilities are useful.

If selected, the profile must state explicitly:

- that Liquid is a federated network;
- which federation/authority is trusted;
- which facts are enforced by Elements script;
- which facts are enforced by federation rules;
- which facts are evaluated by IMMORTAL;
- which evidence is independently verifiable from the public chain.

Liquid must not be described as "Bitcoin mainnet enforcement".

Its use therefore creates a distinct execution/trust profile and must remain visible
in the Gap Matrix.

## 9. Adapter authority boundary

The Bitcoin Adapter may answer:

> **"What can this Bitcoin-family environment realize under these concrete conditions?"**

It must not answer:

> **"What is economically allowed by IMMORTAL?"**

The latter remains an IMMORTAL decision.

The DApp supplies application intent. The Adapter supplies concrete realization and
observation. IMMORTAL supplies economic authority.

This preserves the existing Adapter specification:

```text
DApp intent
    ↓
Bitcoin Adapter observation / realization analysis
    ↓
IMMORTAL economic evaluation
    ↓
admissible requirements
    ↓
Bitcoin Adapter realization
    ↓
Bitcoin settlement
    ↓
evidence / observation
    ↓
IMMORTAL revalidation
```

## 10. B1/B3 terminology rule

The repository's existing distinction must remain explicit:

- **B1:** an authorized trust assumption is part of the active model.
- **B3:** publisher-independent canonicality/proof is established by the specified
  verification path.

Therefore:

- Liquid federation ≠ Bitcoin trustlessness;
- RGB client-side validation ≠ B3 by definition;
- a Bitcoin block hash ≠ unbiased randomness by definition;
- a transaction being atomic ≠ economic invariants being verified;
- a client agreeing on state ≠ consensus proving that state.

## 11. Required evidence before implementation claims

A Bitcoin Adapter implementation must not be described as conformant merely because
transactions can be constructed or settled.

Before a profile can claim conformance, evidence must cover at least:

1. concrete state observation;
2. canonical serialization;
3. state-transition validation;
4. authority/provenance verification;
5. finality/reorg handling;
6. conflict detection;
7. economic-boundary preservation;
8. negative/adversarial cases;
9. reproducible evidence packets;
10. explicit classification of every trust assumption.

For B3, the evidence additionally needs to demonstrate the publisher-independent
canonicality/proof path required by the applicable B3 specification.

## 12. Research status

This document establishes a boundary, not an implementation claim.

Current status:

| Profile | Status | Trust boundary |
|---|---|---|
| B1-Bitcoin | Research / potentially implementable | Explicit authorized authority |
| RGB client-validated | Research target | Client-side validation + Bitcoin anchoring |
| B3-Bitcoin | Research / blocked target | Requires an independently verifiable proof/enforcement path |

No Bitcoin Adapter implementation, asset selection, covenant mechanism or consensus
feature is normative until a separate specification, conformance tests and evidence
packet are accepted.

## 13. Non-contamination rule

This Adapter must remain an execution-layer component.

It must not:

- modify IMMORTAL economic constants;
- redefine ProtectedCapital;
- redefine Economic Gate semantics;
- introduce Bitcoin-specific economics into the IMMORTAL kernel;
- make Liquid, RGB, Taproot Assets or another protocol a universal IMMORTAL dependency;
- promote an experimental Bitcoin mechanism to normative status without an explicit
  architectural decision.

The Bitcoin Adapter is an Adapter.

It translates, observes, realizes and reports.

It does not become IMMORTAL.
