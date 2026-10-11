# IMMORTAL — Permissionless Liveness / Wake-up Boundary v1

**Classification:** research / architectural contract, non-normative
**Branch:** `work/b3-materios-provenance-evidence`
**Date:** 2026-10-11

## Purpose

Define one reusable operational boundary for protocol transitions whose economic or lifecycle condition can become true without an active user, while preserving permissionless execution and fail-closed safety.

## Common transition

The reusable pattern is:

`Condition`
→ `Observable State/Event`
→ `Wake-up`
→ `Permissionless Invocation`
→ `Independent On-chain Revalidation`
→ `Atomic Transition`
→ `Canonical State`

The wake-up mechanism may be off-chain, on-chain, scheduled, event-driven, or supplied by multiple independent observers. Its existence must not create economic authority.

## Safety property

A missing wake-up or missing invoker must never convert an unverified condition into an authorized state transition.

Therefore:

- no keeper is an authority;
- no notification provider is canonical truth;
- stale observations are not silently promoted;
- a failed invocation leaves the canonical state unchanged unless the already-authorized transition explicitly defines a safe partial state;
- a subsequent valid observation may make the same transition executable again.

## Permissionless execution

A transition is permissionless when any actor able to satisfy the transaction requirements may attempt it, and the chain independently verifies:

1. the current canonical predicate;
2. the required evidence;
3. validity/freshness constraints;
4. transition authorization;
5. post-state invariants.

A preferred relayer may reduce latency, but the protocol must not depend on that actor for economic safety.

## Safe stall

Where an external condition is required for truth or execution and that condition is unavailable, the default boundary is:

`UNVERIFIABLE`
→ no economic authorization
→ canonical state remains safe
→ future wake-up/retry remains possible.

This is not equivalent to automatic zero valuation, automatic liquidation, or automatic payout.

## Idempotency and concurrency

A wake-up may race with another invocation. The transition itself must therefore enforce its own current-state predicate and consume/update the exact state it is authorized to change.

Duplicate wake-ups must not produce duplicate economic effects.

## Reuse domains

The same liveness boundary may be applied to:

- `PRE_GENESIS → GENESIS`;
- `EXPIRE`;
- class contraction/recovery;
- Oracle/EEV refresh or liquidation;
- Jackpot activation/payout/reset;
- Treasury distribution;
- Beacon publication/consumption.

Reuse is operational, not semantic: each transition retains its own normative predicate, evidence contract and post-state rules.

## Non-sovereignty

The wake-up layer must not:

- define the economic predicate;
- select a new canonical value;
- change a reward/fee rule;
- authorize itself;
- rewrite evidence requirements;
- bypass the Economic Gate;
- turn absence of evidence into positive authority.

## Promotion gate

Promotion requires at least:

1. one concrete transition mapped end-to-end;
2. explicit no-keeper behavior;
3. stale/missing evidence failure;
4. permissionless invocation;
5. independent revalidation;
6. atomic/idempotent post-state behavior;
7. adversarial proof that the wake-up actor cannot acquire economic authority.

**Status: OPEN RESEARCH / REUSABLE LIVENESS BOUNDARY.**
