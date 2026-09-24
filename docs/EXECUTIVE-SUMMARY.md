# IMMORTAL — Executive Summary

## In one sentence

IMMORTAL is a universal economic protocol model that defines how economic state, obligations, safety and evidence can be specified independently of a particular blockchain or application.

## The three layers

```text
IMMORTAL
Universal protocol
      ↓
Cardano Adapter
Execution environment
      ↓
PRE-RICH
Concrete application
```

**IMMORTAL is not PRE-RICH.**  
**Cardano is not IMMORTAL.**

## What the kernel does

The kernel asks a precise question:

> From which states can the system continue operating without violating the defined safety conditions, even considering every admissible outcome?

That is expressed through the greatest fixed point:

`K* = νF`

A concrete implementation can use a certified kernel `K_c`, subject to the certification requirements.

## What is protected

The model distinguishes protected obligations/capital from surplus:

`RawSurplus = max(0, EEV − ProtectedCapital)`

This prevents economic value already committed to obligations from being silently counted as freely distributable surplus.

## Why Ω matters

`Ω` represents the outcomes that the model considers possible.

If the real system can produce outcomes that the model excluded, a safety proof based on the narrower model can be unsound.

Therefore, completeness of the outcome perimeter is a certification obligation.

## What is proven vs what is not

The formal corpus proves several mathematical properties of the abstract model, including fixed-point existence/characterization and soundness of suitable concrete post-fixed-point approximations.

It does **not** automatically prove:

- that the current implementation conforms;
- that all external assumptions are true;
- that deployment is safe;
- that `K*` is computable;
- that `K*` is non-empty in every system;
- that `K_c = K*`.

## Current status

IMMORTAL is experimental and open source.

Cardano is the current adapter. PRE-RICH is the current application.

The project is structured so that future applications and adapters can be evaluated against the same universal core without turning their specific policy choices into universal rules.
