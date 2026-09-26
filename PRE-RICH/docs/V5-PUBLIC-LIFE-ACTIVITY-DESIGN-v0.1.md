# PRE-RICH V5 — Public Life & Activity Surface v0.1

**Status:** DESIGN / NON-NORMATIVE  
**Scope:** public website transparency

## Objective

PRE-RICH V5 should behave like a transparent window into the protocol rather than a conventional game dashboard.

The page should continuously expose:

- **Life State** — the current biological presentation state;
- **Current Activity** — the concrete operation being performed, or `IDLE`;
- **Operational Status** — whether the execution path is currently observed as available;
- **Beacon** — the selected trust mode;
- **Evidence** — the references supporting those statements.

## Public card

The primary public card is:

```
PRE-RICH
[ LIFE STATE ]

CURRENT ACTIVITY
[ declared activity ]

OPERATIONAL STATUS
[ status ]

BEACON
[ B3 / B2 / B1 ]

CURRENT ROUND
[ round reference ]

LAST VERIFIED ACTION
[ action / transaction reference ]
```

The visual language may use the Turritopsis-inspired life states:

```
PLANULA → POLYP → YOUNG MEDUSA → MEDUSA
                         ↘
                       REGENERATION
```

The biological names are not economic classifications. They are an internationally readable metaphor for protocol evolution.

## Activity examples

The website should surface an active declaration such as:

```
SELLING ASSET
Class 3
Price: [authoritative value]

ACTIVATING CLASS
Class 4
State transition: [authoritative reference]

ISSUING
Round #381

SETTLING
Round #380
Awaiting finality

PROTECTING CAPITAL
ProtectedCapital
[authoritative observation]
```

When no activity is currently declared, display:

```
CURRENT ACTIVITY
IDLE
```

The page must not display an operation merely because a user clicked a button or because a relayer requested it.

## Transparency rule

Use the language:

> **The protocol declares what it is doing from verified state and evidence.**

Avoid:

- marketing language presented as state;
- predictions presented as status;
- UI intent presented as execution;
- cached data presented as canonical;
- B1 described as B3;
- economic health presented as certification.

## Update cadence

The frontend should refresh declarations from the configured observation source and show the observation age explicitly where practical.

A stale declaration must be visibly stale or unavailable; it must not silently become a current claim.

## Future economic vitality surface

A separate profile-level projection may later expose an **Economic Vitality** label based on declared verified metrics.

That projection must define its inputs, thresholds, scope, and evidence separately. It must never replace the canonical Economic Gate, viability analysis, or accounting rules.

## Scope boundary

This page is an application presentation surface. Universal IMMORTAL semantics belong in the Protocol Declaration Layer; PRE-RICH adds only its application-specific activity subjects and its approved Life State mapping.
