# B3-C — RootProof Verification Contract v1

## Classification

**Research / non-normative.** This document freezes a verification contract for the existing B3 decomposition. It does not select a proof system, change canonicality semantics, or promote any transport/provider to authority.

## 1. Purpose

B3-C must compose the two already-separated relations:

`B3-A: checkpoint -> authenticated finality/authority -> finalized StateRoot`

and

`B3-B: StateRoot + exact storage key + proof -> authenticated value`

into one verifier relation suitable for later succinctification and, only after feasibility is demonstrated, Cardano execution.

The target statement remains:

`VerifyRootProof(checkpointRef, stateRoot, key, value, proof, context) = ACCEPT`

only when all required bindings succeed.

## 2. Public-input contract

The eventual RootProof verifier must bind at minimum:

| Input | Required property |
|---|---|
| `checkpointRef` | exact block hash + block number |
| `stateRoot` | extracted from the exact target header |
| `runtime identity` | version/code identity bound to the execution context |
| `storage key` | exact canonical key bytes for the required storage item |
| `claimed value` | exact bytes / canonical decoded value |
| `storage proof` | proof bytes sufficient to authenticate key/value against `stateRoot` |
| `B3 context` | protocol/version/domain binding required by Beacon derivation |
| `finality evidence` | independently verifiable B3-A evidence |
| `semantic binding` | proof that the authenticated value corresponds to the intended Beacon/checkpoint context |

No field is trusted merely because a publisher or adapter supplies it.

## 3. Verification order

The verifier should preserve the existing decomposition rather than collapse it into one opaque assertion:

1. Validate packet schema and domain/version.
2. Validate exact checkpoint hash/number binding.
3. Validate header-derived `stateRoot`.
4. Validate runtime identity / code binding where required by the execution proof.
5. Verify B3-A finality/authority/ancestry evidence.
6. Verify the storage proof against the exact `stateRoot`.
7. Validate the exact canonical storage key.
8. Decode and validate the claimed value under the expected version/domain.
9. Validate semantic binding from the authenticated value to the intended Beacon/checkpoint context.
10. Bind the resulting statement into the RootProof commitment.

The verifier must stop on the first failed mandatory relation.

## 4. Fail-closed classification boundary

The verifier must distinguish, at minimum, the failure categories already established by the B3 decomposition:

- malformed or incomplete evidence packet;
- checkpoint/header mismatch;
- state-root mismatch;
- runtime identity mismatch where runtime binding is required;
- finality/authority/ancestry verification failure;
- storage-key mismatch;
- malformed or invalid storage proof;
- proof/root mismatch;
- authenticated value mismatch or decode/version failure;
- semantic checkpoint/anchor binding failure;
- stale/replayed evidence;
- protocol/domain-version incompatibility.

These are **conceptual failure categories only**. They are not new normative error-code names and do not freeze a serialized API. The concrete error representation remains an implementation detail unless separately established by the canonical specification.

## 5. Adversarial vector contract

Synthetic vectors are permitted only as verifier/conformance tests. They must never be represented as real Materios evidence.

### Positive class

`P-01` — internally consistent RootProof fixture.

Required relations:
- checkpoint hash/number agree;
- stateRoot agrees with header fixture;
- key/value/proof agree;
- proof root matches stateRoot;
- context/domain/version agree.

Expected: **ACCEPT**.

### Negative classes

`N-01` — mutated checkpoint hash  
Expected: reject with `CHECKPOINT_MISMATCH`.

`N-02` — mutated stateRoot  
Expected: reject with `HEADER_STATE_ROOT_MISMATCH` or `STORAGE_PROOF_ROOT_MISMATCH`.

`N-03` — mutated storage key  
Expected: `STORAGE_KEY_MISMATCH`.

`N-04` — mutated claimed value  
Expected: `STORAGE_VALUE_MISMATCH`.

`N-05` — proof node removed  
Expected: `STORAGE_PROOF_MALFORMED` or equivalent proof failure.

`N-06` — proof node mutated  
Expected: proof verification failure.

`N-07` — proof from another state root/block  
Expected: `STORAGE_PROOF_ROOT_MISMATCH`.

`N-08` — valid proof for another storage item  
Expected: `STORAGE_KEY_MISMATCH` or semantic rejection.

`N-09` — wrong value decoding/version/domain  
Expected: `STORAGE_VALUE_DECODE_FAILURE` or `DOMAIN_VERSION_MISMATCH`.

`N-10` — missing finality evidence  
Expected: `FINALITY_UNVERIFIED`.

`N-11` — missing authority provenance  
Expected: `AUTHORITY_PROVENANCE_UNVERIFIED`.

`N-12` — stale checkpoint/context  
Expected: `STALE_CONTEXT`.

`N-13` — replayed evidence packet in a different round/context  
Expected: `REPLAY_DETECTED` or domain-binding rejection.

`N-14` — semantic anchor/checkpoint mismatch  
Expected: `SEMANTIC_BINDING_UNVERIFIED`.

## 6. Separation of proof-generation and proof-verification

The proof generator is untrusted.

It may:
- query a Materios node;
- extract headers/state;
- request storage proofs;
- decode SCALE;
- package evidence.

It may not:
- declare canonicality;
- define the authority set;
- replace the authoritative Materios selector;
- replace GRANDPA verification;
- convert a missing proof into success.

The verifier must be able to evaluate the received proof package without consulting the proof generator again.

## 7. Real-evidence gate

A synthetic positive fixture closes only the verifier's internal conformance surface.

A real B3-C evidence claim additionally requires:

`real Materios checkpoint -> real B3-A finality evidence -> real stateRoot -> real storage proof -> independent verification`

The current public RPC probe establishes that the documented public endpoints do not provide the historical state/read-proof/finality transport needed for target block 1856408. Therefore no real B3-C vector is claimed by this document.

## 8. Succinctification gate

Succinct proof work starts only after the complete RootProof relation has a real positive vector and adversarial coverage.

Measurements must include:
- proof size;
- public-input size;
- prover cost;
- verifier cost;
- script size;
- exact transaction encoding overhead.

No proof system is selected by this contract.

## 9. Non-regression

This contract does not:
- alter IMMORTAL economics;
- alter PRE-RICH GameRules;
- alter V3/Reveal;
- alter Materios authority selection;
- require a public proof RPC;
- authorize use of a current authority set for a historical checkpoint;
- turn synthetic tests into deployment evidence.

## 10. Status

**Contract frozen for parallel research.**

Production B3-C remains **OPEN** pending real B3-A/B3-B evidence.
