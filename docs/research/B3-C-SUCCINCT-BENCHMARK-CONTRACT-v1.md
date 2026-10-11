# B3-C — Succinct Proof Benchmark Contract v1

**Classification:** research / measurement contract, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Prepare the measurement boundary for B3-C before a real Materios RootProof exists.

This document does not select a proof system and does not treat a synthetic proof as a
production witness.

## Measurement target

The candidate relation is the existing B3-C target:

`finality + finalized stateRoot + storage inclusion + anchor/context binding`.

The benchmark begins only after B3-A and B3-B have produced a complete real proof relation.

## Metrics

Every candidate proof path must report, from frozen inputs:

| Metric | Measurement |
|---|---|
| Proof bytes | exact serialized proof length |
| Public inputs | exact serialized bytes and logical field count |
| Verifier script/bytecode size | exact artifact size under the declared build |
| Execution budget | measured CPU and memory/ExUnits where the target runtime exposes them |
| Transaction overhead | exact bytes attributable to proof/public inputs |
| Generation time | prover wall-clock time on the declared environment |
| Generation memory | peak memory on the declared environment |
| Verification time | verifier wall-clock time where measurable |
| Failure behavior | exact rejection vector and failure classification |

No measurement is valid without a source/provenance record for the tested artifact.

## Candidate paths

Benchmark the existing research candidates only:

- Native L1 verification;
- succinct proof adapter;
- Mithril-derived infrastructure;
- Cardano bridge/state UTxO architecture.

The list is a research comparison, not an architectural commitment.

## Required frozen inputs

A benchmark run must bind:

- exact B3 checkpoint reference;
- exact finalized header/state root;
- exact storage key/value;
- exact finality/authority context;
- exact proof artifact;
- proof-system/library version;
- verifier source commit;
- compiler/toolchain fingerprint;
- target Cardano protocol parameters where execution is measured.

## Order

The benchmark sequence is:

1. materialize the real B3-A finality relation;
2. materialize the real B3-B storage relation;
3. compose the RootProof;
4. validate positive and negative vectors;
5. produce candidate proofs;
6. measure verifier and serialization costs;
7. compare candidates against the same public relation.

A candidate cannot be selected merely because its prover is convenient.

## Mandatory negative measurements

The benchmark corpus must include mutations of:

- checkpoint identity;
- block number/hash;
- stateRoot;
- storage key;
- storage value;
- authority set/set-id;
- finality witness;
- context/selection input commitment;
- proof bytes;
- runtime identity/version.

Expected result for all invalid mutations: rejection.

## Promotion boundary

This contract permits a future statement of:

`candidate X was measured at Y under environment Z`

It does not permit the statement:

`candidate X is the canonical B3 proof system`

until the required proof relation and architectural decision have been explicitly established.

## Current status

- RootProof relation: **CONTRACT FROZEN**
- Real B3-A/B witness: **OPEN**
- Benchmark harness design: **FROZEN**
- Measurements: **WAITING ON REAL PROOF**
- Proof-system selection: **OPEN**
