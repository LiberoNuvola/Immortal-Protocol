# IMMORTAL — Adapter Maturity & Research Registry v1

**Classification:** research / architecture registry, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Prevent architectural confusion between the single concrete production adapter and research/reference surfaces that happen to live under `Adapter/`.

## Registry

| Surface | Status | Basis | Permitted claim |
|---|---|---|---|
| `Adapter/CARDANO` | **CONCRETE / production path** | runtime + serialization + observation surfaces present | current concrete chain adapter |
| `Adapter/REFERENCE` | **REFERENCE / verification-only** | deterministic V3 replay/reference implementation | semantic reference, not an external-chain adapter |
| `Adapter/MIDNIGHT` | **RESEARCH / candidate** | Intent boundary + Compact/Moriarty research | future adapter study only |
| `Adapter/BITCOIN` | **RESEARCH / trust model** | docs only (L1/RGB conformance/trust) | no concrete adapter claim |
| `Adapter/COSMOS` | **RESEARCH / trust model** | docs only | no concrete adapter claim |
| `Adapter/ETHEREUM` | **RESEARCH / trust model** | docs only | no concrete adapter claim |
| `Adapter/SOLANA` | **RESEARCH / trust model** | docs only | no concrete adapter claim |

## Rule

A directory under `Adapter/` is not itself evidence of a production adapter.

A **concrete adapter** requires an independently reviewable execution/settlement surface, conformance evidence and chain-observation/evidence path. Research documents, trust models or a reference replay engine do not satisfy that claim.

Current architectural statement:

**Exactly one concrete production chain adapter: Cardano.**

The Midnight surface remains a candidate. The Reference surface is a semantic/reference implementation, not a second chain.

## Workflow B implication

Multi-adapter semantic conformance is currently a **research differential** between the canonical semantic result and future/alternative encodings. It must not be reported as production multichain deployment.

No economic or governance semantics are changed by this registry.
