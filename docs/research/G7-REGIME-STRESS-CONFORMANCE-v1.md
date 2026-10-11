# IMMORTAL — G7 Regime / Stress Conformance Boundary v1

**Classification:** conformance / research, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Expose the already-implemented PRE-RICH hysteresis behaviour as a reusable stress/conformance boundary without introducing new thresholds or a new regime machine.

## Existing policy

The application-level policy already implemented is:

- KA = 8
- KC = 4
- KD = 4

with the existing relationship:

`KC <= KD < KA`.

The implementation defines the existing actions:

`ACTIVATE → UPGRADE → RETAIN → CONTRACT → HALT`.

## Stress boundary

A conformance run must exercise a multi-step capacity path that crosses the existing activation and maintenance boundaries and verifies:

- no premature upgrade;
- direct contraction;
- safe halt when maintenance cannot be satisfied;
- historical activation monotonicity;
- deterministic reactivation after a halt;
- no caller-selected control state can override the deterministic controller.

The stress path uses the existing policy and supplied capacity costs. It does not define new values.

## Non-sovereignty

The stress harness does not choose its own regime thresholds, change the policy, or elevate an observation into protocol authority.

## Status

**G7-light: CONFORMANCE READY / DEPLOYMENT EVIDENCE OPEN.**
