# IMMORTAL — Protocol Declaration Layer v0.1

**Status:** DESIGN / NON-NORMATIVE  
**Scope:** public transparency and observability  
**Branch:** `work/immortal-green-closure`

## Purpose

IMMORTAL exposes a public declaration layer so that a protocol does not only publish a dashboard of values. It can declare, in a standard international vocabulary:

1. **what state it is in**;
2. **what it is doing now**;
3. **whether its execution environment is operational**;
4. **which beacon trust mode is currently observed**;
5. **which evidence supports the declaration**.

The declaration layer is a projection of authoritative observations. It is not an economic authority and it must not create, approve, or infer a transition that is not supported by canonical state.

## Separation of concerns

```
Canonical / authoritative state
        |
        +--> Economic semantics
        |
        +--> Operational/liveness observations
        |
        '--> Protocol Declaration Layer
                    |
                    +--> LIFE STATE
                    +--> CURRENT ACTIVITY
                    +--> OPERATIONAL STATUS
                    +--> BEACON
                    '--> EVIDENCE
```

The declaration layer must never become a side door around the Economic Gate, validators, authenticated control, or canonical state.

## 1. LIFE STATE

The biological vocabulary is a public metaphor inspired by the life-cycle reference of the immortal jellyfish (`Turritopsis`). It is presentation semantics, not a new economic primitive.

Initial vocabulary:

| Code | Public label | Meaning |
|---|---|---|
| `PLANULA` | Planula | early/emergent protocol phase |
| `POLYP` | Polyp | structural/stabilization phase |
| `YOUNG_MEDUSA` | Young Medusa | operating and expanding phase |
| `MEDUSA` | Medusa | mature operating phase |
| `REGENERATION` | Regeneration | declared recovery/reconfiguration phase |

These labels do not by themselves imply solvency, viability, security, profitability, or certification.

The exact mapping from verified observations to a Life State is a separate profile/application rule and must be declared rather than hidden in the frontend.

## 2. CURRENT ACTIVITY

Activity is dynamic and must describe what the protocol is doing now, not what it could do.

Initial international vocabulary:

- `ACTIVATING_CLASS`
- `SELLING_ASSET`
- `ISSUING`
- `SETTLING`
- `DISTRIBUTING`
- `PROTECTING_CAPITAL`
- `AWAITING_FINALITY`
- `REGENERATING`

Activities may carry a typed subject, for example:

```
ACTIVATING_CLASS { classId: 4 }
SELLING_ASSET { assetRef: ... }
SETTLING { roundId: ... }
```

The public renderer must not invent an activity from a button click, wallet intent, relayer message, or stale cached state.

## 3. OPERATIONAL STATUS

Operational status is independent from economic state and activity:

- `ONLINE`
- `DEGRADED`
- `PAUSED`
- `HALTED`

This field communicates observed execution availability. It is not a safety or viability verdict.

## 4. BEACON

Where a protocol uses the IMMORTAL beacon architecture, expose the currently selected trust mode explicitly:

- `B3 — VERIFIED`
- `B2 — ATTESTED`
- `B1 — AUTHORIZED`

For a round, the selected beacon trust mode is frozen before commitments. A temporary loss of B3 after a round has started must not silently downgrade that existing round.

## 5. EVIDENCE

Every material declaration should link to the observation supporting it.

Minimum evidence model:

```
{
  declarationId,
  observedAt,
  canonicalStateRef,
  actionRef?,
  evidenceRef[],
  source,
  scope
}
```

A frontend may render human-readable summaries, but the underlying declaration must remain reproducible from authoritative observations.

## 6. PRE-RICH example

A public PRE-RICH page can therefore show:

```
PRE-RICH

LIFE STATE
MEDUSA

CURRENT ACTIVITY
ACTIVATING CLASS 4

ECONOMIC VITALITY
HIGH

OPERATIONAL STATUS
ONLINE

BEACON
B3 — VERIFIED

CURRENT ROUND
#381

EVIDENCE
canonical state: ...
transition: ...
observation: ...
```

`ECONOMIC VITALITY` is intentionally not defined by this document. It is a future profile-level projection over verified economic metrics and must not be confused with solvency, viability, or certification.

## 7. Closure rules

A declaration is publishable only when:

1. its state is derived from an authoritative observation;
2. its activity is tied to a concrete state/transition condition;
3. its operational status has an explicit observation scope;
4. beacon mode is bound to the actual round/protocol context where applicable;
5. material claims carry reproducible evidence;
6. missing or inconsistent evidence causes the declaration to fail closed or become unavailable;
7. the public layer cannot mutate economic state.

## 8. Non-goals

This document does not:

- define IMMORTAL economic constants;
- define PRE-RICH payout or ladder policy;
- prove liveness;
- prove solvency or viability;
- replace the Cardano Adapter;
- establish B3 cryptographic closure;
- introduce new on-chain authority.

The layer is a transparency boundary between verified protocol state and public presentation.
