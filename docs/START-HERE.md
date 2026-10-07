# IMMORTAL — Start Here

> **Scope:** public orientation for non-technical readers. This page is non-normative.

## What is IMMORTAL?

IMMORTAL is a chain-agnostic framework for expressing economic state, obligations, admissible transitions and safety constraints explicitly.

It separates universal economic semantics from the adapter that realizes them on a concrete ledger and from the application that chooses its own policy.

Today the reference realization uses a Cardano adapter and PRE-RICH as the first application.

The project is **experimental**: documentation, implementation, conformance and deployment evidence are separate claims.

## What it is not

- Not a claim of mainnet readiness.
- Not a custodial service or a promise of future returns.
- Not a statement that PRE-RICH rules are universal IMMORTAL rules.
- Not a claim that a green test alone proves deployment-wide conformance.
- Not a declaration that B3 is complete.

## Mechanisms at a glance

The system is intentionally composed of explicit mechanisms rather than a single undifferentiated economic algorithm.

**IMMORTAL:** Economic Gate · Viability Kernel (K_Ω) · A_safe · ProtectedCapital · RawSurplus · Worst-Case Analysis · Statistical Risk Analysis · Hysteresis · Contraction · Quiescence · Recovery / PRE-GENESIS

**PRE-RICH:** AWRA · Treasury Allocation Policy · Adaptive Asset / Liquidation Policy · Jackpot Policy · Game Outcome / Randomization

**Adapter:** evidence transport · semantic preservation · settlement realization · chain conformance

The key boundary is:

```text
IMMORTAL safety / admissibility
              ↓
           A_safe
              ↓
     PRE-RICH policy/mechanism
              ↓
        Cardano Adapter
              ↓
            Ledger
```

For the recovered AWRA machinery, see [AWRA Recovery & Re-Integration](../PRE-RICH/docs/AWRA-RECOVERY-REINTEGRATION-v0.1.md). That document separates recovered history, current-model reproduction and policy-open elements.

## Where to go next

- **Understand the model:** [Executive Summary](EXECUTIVE-SUMMARY.md)
- **Inspect the architecture:** [Complete System Map](IMMORTAL-ADAPTER-PRE-RICH-COMPLETE-SYSTEM-MAP.md)
- **Check current evidence:** [Status](03-audit/VERIFICATION_STATUS.md)
- **Read the current Preprod handoff:** [Preprod handoff](COORDINATION/PREPROD-FIRST-TICKET-HANDOFF-20261003.md)

## Current reality

The public system distinguishes stable documentation from live operational evidence. The current Preprod milestone is the first real PRE-RICH ticket issuance followed by a fresh Reveal; an older expired test ticket is not treated as that milestone.

For authoritative semantics, use the canonical normative corpus under [00-normative](00-normative/).